/**
 * Product-related API calls
 */

import type { ApiClient } from './client';
import type { BlogData} from './types';

export class BlogApi {
    constructor(private client: ApiClient) {}

    /**
     * Get all categories
     */
    async getLimitBlogs(): Promise<BlogData[]> {
        const response = await this.client.get<BlogData[]>('/api/get-blogs/');
        return response || [];
    }
    async getBlogs(): Promise<BlogData[]> {
        const response = await this.client.get<BlogData[]>('/api/get-blogs/');
        return response || [];
    }

    async getBlogBySlug(slug: string): Promise<BlogData | null> {
        const response = await this.client.get<BlogData>(`/api/get-blog-by-slug/${slug}/`);
        return response || null;
    }
}
