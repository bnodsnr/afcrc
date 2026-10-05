/**
 * Collections API calls
 */

import type { ApiClient } from './client';
import type { CollectionsData } from './types';

export class CollectionsApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get all collections
	 */
	async getCollections(): Promise<CollectionsData | null> {
		return this.client.get<CollectionsData>('/api/collections');
	}

	/**
	 * Get featured collections
	 */
	async getFeaturedCollections(): Promise<CollectionsData | null> {
		return this.client.get<CollectionsData>('/api/collections/featured');
	}
}
