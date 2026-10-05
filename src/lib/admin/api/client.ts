// src/lib/api/client.ts

// =======================================
// CONFIG
// =======================================

import { PUBLIC_API_BASE_URL } from '$env/static/public';

// Determine BASE_URL with multiple fallback strategies
let BASE_URL: string;

// Strategy 1: Use static env var if available and not empty
if (PUBLIC_API_BASE_URL && PUBLIC_API_BASE_URL.trim()) {
	BASE_URL = PUBLIC_API_BASE_URL;
}
// Strategy 2: In browser, try to detect from window location
else if (typeof window !== 'undefined') {
	// Check if running under /adminhemp/ (production)
	if (window.location.pathname.startsWith('/adminhemp')) {
		BASE_URL = window.location.origin + '/hhhadminapi';
	} else {
		BASE_URL = window.location.origin;
	}
}
// Strategy 3: Default fallback
else {
	BASE_URL = 'http://localhost:3000';
}
let accessToken: string | null = null;

// Allow setting auth token globally
export function setAccessToken(token: string) {
	accessToken = token;
}

export function clearAccessToken() {
	accessToken = null;
}

// =======================================
// REQUEST INTERCEPTOR
// =======================================

async function withRequestInterceptors(url: string, options: any = {}) {
    const passedHeaders = options.headers || {};
    
    // Check if body is FormData
    const isFormData = options.body instanceof FormData;
    
    options.headers = {
        ...passedHeaders
    };

    // Only set Content-Type for non-FormData requests
    if (!isFormData && !options.headers["Content-Type"]) {
        options.headers["Content-Type"] = "application/json";
    }

    // Attach token if available and not already set
    if (accessToken && !options.headers["Authorization"]) {
        options.headers["Authorization"] = `Bearer ${accessToken}`;
    }


    return { url, options };
}

// =======================================
// RESPONSE INTERCEPTOR
// =======================================

async function withResponseInterceptors(response: Response) {
	if (!response.ok) {
		let errorData = null;

		try {
			errorData = await response.json();
		} catch (_) {
			// If it's not JSON, try to get text
			try {
				const text = await response.text();
			} catch (e) {
				console.error('❌ Could not read error response');
			}
			errorData = { message: "Unknown error" };
		}

		throw {
			status: response.status,
			message: errorData?.message || "Request failed",
			data: errorData
		};
	}

	// Return JSON safely
	try {
		const text = await response.text();
		if (!text) {
			console.warn('⚠️  Empty response body');
			return null;
		}
		
		// Check if response is HTML instead of JSON
		if (text.trim().startsWith('<')) {
			
			throw {
				status: 500,
				message: 'Server returned HTML instead of JSON (possibly 401/403 error page)',
				data: { error: 'HTML_RESPONSE', url: response.url }
			};
		}
		
		return JSON.parse(text);
	} catch (error: any) {
		// Don't double-log if we already caught HTML
		if (error?.data?.error === 'HTML_RESPONSE') {
			throw error;
		}
	
		
		throw {
			status: 500,
			message: 'Invalid JSON response from server',
			data: { error: String(error) }
		};
	}
}

// =======================================
// RETRY FUNCTION
// =======================================

async function fetchWithRetry(url: string, options: any, retries = 1) {
	try {
		return await fetch(url, options);
	} catch (err) {
		if (retries <= 0) throw err;
		return fetchWithRetry(url, options, retries - 1);
	}
}

// =======================================
// MAIN API FUNCTION
// =======================================

async function request(method: string, endpoint: string, body?: any, opts: any = {}) {
    const fullUrl = BASE_URL + endpoint;
   
    // Log stack trace to find which file is calling this
    const stack = new Error().stack || '';
    const callerLine = stack.split('\n')[2]?.trim() || 'Unknown';
    
    // Check if body is FormData
    const isFormData = body instanceof FormData;
   
    const baseOptions = {
        method,
        // Don't stringify FormData - send it as-is
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        credentials: opts.credentials || 'include',
        ...opts
    };
    
    // Apply request interceptors
    const { url, options } = await withRequestInterceptors(fullUrl, baseOptions);
    
    
    
    const response = await fetch(url, options);
    
   
    const result = await withResponseInterceptors(response);
    return result;
}

// =======================================
// SHORTCUT METHODS
// =======================================

export const api = {
	get: (endpoint: string, opts = {}) => request("GET", endpoint, null, opts),
	post: (endpoint: string, body: any, opts = {}) => request("POST", endpoint, body, opts),
	put: (endpoint: string, body: any, opts = {}) => request("PUT", endpoint, body, opts),
	patch: (endpoint: string, body: any, opts = {}) => request("PATCH", endpoint, body, opts),
	delete: (endpoint: string, opts = {}) => request("DELETE", endpoint, null, opts)
};

export default api;
