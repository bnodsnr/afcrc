/**
 * Authentication API endpoints
 */

import type { ApiClient } from './client';

export class AuthApi {
	constructor(private client: ApiClient) {}

	/**
	 * Logout the current user
	 * POST /api/auth/logout/
	 */
	async logout(): Promise<boolean> {
		try {
			const response = await this.client.post('/api/auth/logout/', {});
			return response !== null;
		} catch (error) {
			console.error('[AuthApi] Logout failed:', error);
			return false;
		}
	}
}
