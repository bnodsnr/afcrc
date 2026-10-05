/**
 * Base API client for making HTTP requests
 */

import { env } from '$env/dynamic/public';
import { getAccessToken } from '$lib/utils/cookies';

export class ApiClient {
	private fetch: typeof fetch;
	private baseUrl: string;
	private token?: string;

	constructor(fetchFn: typeof fetch, baseUrl?: string, token?: string) {
		this.fetch = fetchFn;
		this.baseUrl = baseUrl || env.PUBLIC_BASE_URL || '';
		this.token = token;
	}
	
	/**
	 * Construct full URL from endpoint
	 */
	private getUrl(endpoint: string): string {
		// If endpoint is already a full URL, return as is
		if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
			return endpoint;
		}
		// Otherwise, prepend base URL
		return this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint;
	}

	/**
	 * Get authorization headers with token
	 */
	private getAuthHeaders(overrideToken?: string): Record<string, string> {
		const headers: Record<string, string> = {};
		const token = overrideToken || this.token || getAccessToken();
		
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
		return headers;
	}

	/**
	 * Make a GET request to the API
	 */
	async get<T>(endpoint: string, token?: string): Promise<T | null> {
		// console.log('Making GET request to:', endpoint, 'with token:', token);
		try {
			const url = this.getUrl(endpoint);
			
			const response = await this.fetch(url, {
				headers: token ? { 'Authorization': `Bearer ${token}` } : this.getAuthHeaders()	,
				credentials: 'include'
			});
			if (!response.ok) {
				const errorText = await response.text();
				return null;
			}
			
			const data = await response.json();
			// Handle API wrapper format: { success, message, data }
			if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
				return data.data as T;
			}
			
			return data as T;
		} catch (error) {
			console.error(`[API] Failed to fetch ${endpoint}:`, error);
			return null;
		}
	}

	/**
	 * Make a POST request to the API
	 */
	async post<T>(endpoint: string, data?: unknown): Promise<T | null> {
		try {
			const url = this.getUrl(endpoint);
			const authHeaders = this.getAuthHeaders();
			
			const response = await this.fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...authHeaders
				},
				credentials: 'include',
				body: data ? JSON.stringify(data) : undefined
			});
			
			
			if (!response.ok) {
				
				const errorText = await response.text();
				return null;
			}
			
			const responseData = await response.json();
		
			// Handle API wrapper format: { success, message, data }
			if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
				
				return responseData.data as T;
			}
			
			return responseData as T;
		} catch (error) {
			console.error(`[API] Failed to post to ${endpoint}:`, error);
			return null;
		}
	}

	/**
	 * Make a PUT request to the API
	 */
	async put<T>(endpoint: string, data?: unknown): Promise<T | null> {
		try {
			const url = this.getUrl(endpoint);
			const authHeaders = this.getAuthHeaders();
			
			const response = await this.fetch(url, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...authHeaders
				},
				credentials: 'include',
				body: data ? JSON.stringify(data) : undefined
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				return null;
			}
			
			const responseData = await response.json();
		
			// Handle API wrapper format: { success, message, data }
			if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
				return responseData.data as T;
			}
			
			return responseData as T;
		} catch (error) {
			// console.error(`[API] Failed to put to ${endpoint}:`, error);
			return null;
		}
	}

	/**
	 * Make a DELETE request to the API
	 */
	async delete<T>(endpoint: string): Promise<T | null> {
		try {
			const url = this.getUrl(endpoint);
			const authHeaders = this.getAuthHeaders();
			
			const response = await this.fetch(url, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					...authHeaders
				},
				credentials: 'include'
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error(`[API] Error body:`, errorText);
				return null;
			}
			
			const responseData = await response.json();
		
			// Handle API wrapper format: { success, message, data }
			if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
				return responseData.data as T;
			}
			
			return responseData as T;
		} catch (error) {
			// console.error(`[API] Failed to delete ${endpoint}:`, error);
			return null;
		}
	}
}
