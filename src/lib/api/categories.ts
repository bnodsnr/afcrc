/**
 * Product-related API calls
 */

import type { ApiClient } from './client';
import type { CategoryData} from './types';

export class CategoriesApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get all categories
	 */
	async getCategories(): Promise<CategoryData[]> {
		const response = await this.client.get<CategoryData[]>('/api/get-categories/');
		return response || [];
	}

	/**
	 * Get category details with subcategories and products by unique slug
	 */
	async getCategoryBySlug(slug: string): Promise<CategoryData | null> {
		const response = await this.client.get<CategoryData>(`/api/category-details/${slug}/`);
		return response || null;
	}

	/**
	 * Get paginated category catalogue (category meta + product pages)
	 */
	async getCategoryCatalog(slug: string, page = 1): Promise<any | null> {
		const response = await this.client.get<any>(
			`/api/category-details/${slug}/?page=${page}`
		);
		return response || null;
	}

	/**
	 * Get subcategories for a category
	 */
	async getSubcategories(slug: string): Promise<any> {
		const response = await this.client.get<any>(`/api/get-subcategories/${slug}/`);
		return response?.data || [];
	}
}
