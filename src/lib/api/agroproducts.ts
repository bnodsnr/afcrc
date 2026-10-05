/**
 * Agro Products API calls
 */

import type { ApiClient } from './client';
import type { ProductWidget } from './types';

export class AgroProductApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get agro products (category_id = 1).
	 * Returns a flat list of product cards.
	 */
	async getAgroProducts(limit = 8): Promise<ProductWidget[] | null> {
		return this.client.get<ProductWidget[]>(`/api/get-agro-products/?limit=${limit}`);
	}

	/**
	 * Get subcategories for a category by slug (e.g. 'agri-products').
	 * Returns subcategories with product_count.
	 */
	async getSubcategoriesByCategory(slug: string): Promise<any[]> {
		const response = await this.client.get<any[]>(`/api/get-subcat-by-cat/${'agro-products'}/`);
		return response || [];
	}
}
