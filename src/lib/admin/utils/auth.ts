/**
 * Authentication utility functions
 * Centralized token management for consistent auth handling
 */

/**
 * Get authentication token from cookies
 * Tries multiple cookie names for compatibility
 * @returns Token string or empty string if not found
 */
export function getAuthToken(): string {
	if (typeof document === 'undefined') {
		// console.log('[Auth] Server-side context, no cookies available');
		return '';
	}

	console.log('[Auth] All cookies:', document.cookie);
	
	// Try to find token in cookies - look for both httpOnly and regular cookies
	// Note: httpOnly cookies won't be accessible to JS, so we check for token_expiry as a proxy
	const cookies = document.cookie.split('; ');
	
	for (const cookie of cookies) {
		
		if (cookie.startsWith('token=') || cookie.startsWith('access_token=')) {
			const [, value] = cookie.split('=');
			
			if (value) {
				const decodedValue = decodeURIComponent(value);
				console.log('[Auth] Decoded token length:', decodedValue.length);
				return decodedValue;
			}
		}
	}

	return '';
}

/**
 * Check if user has a valid token
 * Since httpOnly cookies aren't accessible to JS, we check for token_expiry cookie
 * which indicates the server has set an authentication token
 * @returns true if token appears to be set (based on token_expiry cookie)
 */
export function isAuthenticated(): boolean {
	if (typeof document === 'undefined') {
		console.log('[Auth] Server-side: not authenticated');
		return false;
	}

	
	// Check if token_expiry cookie exists (non-httpOnly cookie set by server)
	// This is a proxy for checking if user is authenticated
	const cookies = document.cookie.split('; ');
	const hasTokenExpiry = cookies.some(cookie => cookie.startsWith('adm_token_expiry='));
	
	if (hasTokenExpiry) {
		// Check if token hasn't expired
		const expiryMatch = cookies.find(cookie => cookie.startsWith('adm_token_expiry='));
		if (expiryMatch) {
			const [, expiryStr] = expiryMatch.split('=');
			const expiryTime = parseInt(decodeURIComponent(expiryStr));
			const now = Date.now();
			console.log('[Auth] Token expiry check - now:', now, 'expiryTime:', expiryTime, 'valid:', now < expiryTime);
			return now < expiryTime;
		}
	}

	return false;
}

/**
 * Get authorization header with Bearer token
 * For httpOnly cookies, the server automatically sends them
 * This is mainly for cases where we have access to the token
 * @returns Object with Authorization header or empty object if no token
 */
export function getAuthHeader(): Record<string, string> {
	const token = getAuthToken();
	if (!token) {
		return {};
	}
	return {
		Authorization: `Bearer ${token}`
	};
}

/**
 * Make authenticated fetch request
 * Automatically includes Bearer token in Authorization header if available
 * For httpOnly cookies, the browser will send them automatically with credentials: 'include'
 * @param url - The URL to fetch
 * @param options - Fetch options (optional)
 * @returns Promise<Response>
 */
export async function authenticatedFetch(
	url: string,
	options: RequestInit = {}
): Promise<Response> {
	const token = getAuthToken();
	console.log('[Auth] authenticatedFetch called');
	console.log('[Auth] Token found:', token ? `Yes (${token.length} chars)` : 'No');
	console.log('[Auth] URL:', url);
	console.log('[Auth] Method:', options.method || 'GET');
	
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...options.headers as Record<string, string>
	};

	// Only add Authorization header if we have a non-httpOnly token
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	} else {
		console.log('[Auth] No token to add to header - relying on httpOnly cookies via credentials: include');
	}
	
	return fetch(url, {
		...options,
		headers,
		credentials: 'include' // Browser will send httpOnly cookies automatically
	});
}

/**
 * Redirect to login if not authenticated
 * Call this in protected components/pages
 */
export function redirectToLoginIfNeeded(baseUrl: string): void {
	if (!isAuthenticated()) {
		window.location.href = `${baseUrl}/login`;
	}
}

/**
 * Clear all auth cookies
 * Call this during logout
 */
export function clearAuthCookies(): void {
	if (typeof document === 'undefined') return;

	const cookies = ['adm_token', 'adm_access_token', 'adm_refresh_token', 'adm_token_expiry'];
	cookies.forEach((cookie) => {
		document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
	});
}

