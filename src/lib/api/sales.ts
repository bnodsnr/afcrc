/**
 * Sales and promotions API calls
 */

import type { ApiClient } from './client';
import type { FlashSalesData } from './types';

export class SalesApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get flash sales
	 */
	async getFlashSales(): Promise<FlashSalesData | null> {
		return this.client.get<FlashSalesData>('/api/flash-sales');
	}

	/**
	 * Get deals of the day
	 */
	async getDealsOfTheDay(): Promise<FlashSalesData | null> {
		return this.client.get<FlashSalesData>('/api/deals-of-the-day');
	}
}
