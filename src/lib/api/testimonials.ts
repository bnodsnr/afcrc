/**
 * Product-related API calls
 */

import type { ApiClient } from './client';
import type { TestimonialData} from './types';

export class TestimonialApi {
    constructor(private client: ApiClient) {}

    /**
     * Get all testimonials
     */
    async getTestimonials(): Promise<TestimonialData[]> {
        const response = await this.client.get<TestimonialData[]>('/api/get-testimonials/');
        // Client already unwraps { success, message, data } format
        // So response is already the data array, or null
        return response || [];
    }
}
