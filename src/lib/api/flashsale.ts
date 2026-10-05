/**
 * Product-related API calls
 */

import type { ApiClient } from './client';
import type { FlashSalesData} from './types';

export class FlashSales {
    constructor(private client: ApiClient) {}

    /**
     * Get flash sales
     */
    async getFlashSales(): Promise<FlashSalesData | null> {
        return this.client.get<FlashSalesData>('/api/get-flash-sales/');
    }
}
