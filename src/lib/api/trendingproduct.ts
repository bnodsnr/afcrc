/**
 * Product-related API calls
 */

import type { ApiClient } from './client';
import type { TrendingData} from './types';

export class TrendigProducts {
    constructor(private client: ApiClient) {}

    /**
     * Get trending categories
     */
    async getTrendingProducts(): Promise<TrendingData | null> {
        return this.client.get<TrendingData>('/api/get-trending-products/');
    }
}
