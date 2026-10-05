/**
 * Product-related API calls
 */

import type { ApiClient } from './client';
import type { TrendingData, BestSellerData, ProductWidgetsData, ProductWidget } from './types';

export class ProductsApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get trending products
	 */
	async getTrending(): Promise<TrendingData | null> {
		return this.client.get<TrendingData>('/api/get-trending-products/');
	}

	/**
	 * Get best seller products
	 */
	async getBestSellers(): Promise<BestSellerData | null> {
		return this.client.get<BestSellerData>('/api/best-sellers');
	}

	/**
	 * Get popular products
	 */
	async getPopular(): Promise<TrendingData | null> {
		return this.client.get<TrendingData>('/api/popular');
	}

	/**
	 * Get products by category
	 */
	async getByCategory(categoryId: number): Promise<any[]> {
		const result = await this.client.get<any>(`/api/categories/${categoryId}/products/`);
		return result?.products || result || [];
	}

	/**
	 * Get product details by unique slug
	 */
	async getProductBySlug(slug: string): Promise<any | null> {
		const response = await this.client.get<any>(`/api/product-details/${slug}/`);
		// Client already unwraps { success, message, data } format
		return response || null;
	}

	async getRelatedProducts(slug: string): Promise<any[] | []> {
		const result = await this.client.get<any>(`/api/get-related-products/${slug}/`);
		return result?.data || result || [];
	}

	async getAllProducts(): Promise<any[] | []> {
		const result = await this.client.get<any>(`/api/get-all-products/`);
		return result?.data || result || [];
	}

	async getAllSubCategories(): Promise<any[] | []> {
		const result = await this.client.get<any>(`/api/get-all-subcategories/`);
		return result?.data || result || [];
	}

	/**
	 * Get homepage product widgets grouped by category.
	 * A single call powers both the AgriProduct and PremiumMeat sections.
	 */
	async getProductWidgetsByCategory(limit = 8): Promise<ProductWidgetsData | null> {
		return this.client.get<ProductWidgetsData>(
			`/api/get_product_widgets_by_category/?limit=${limit}`
		);
	}

	/**
	 * Get premium meat products (category_id = 2).
	 * Returns a flat list of product cards.
	 */
	async getPremiumMeat(limit = 8): Promise<ProductWidget[] | null> {
		return this.client.get<ProductWidget[]>(`/api/get-premium-meat/?limit=${limit}`);
	}
	
	/**
	 * Get agro products (category_id = 1).
	 * Returns a flat list of product cards.
	 */
	async getAgroProducts(limit = 8): Promise<ProductWidget[] | null> {
		return this.client.get<ProductWidget[]>(`/api/get-agro-products/?limit=${limit}`);
	}
	/**
	 * Get premium meat products (category_id = 2).
	 * Returns a flat list of product cards.
	 */
	async getHerbalProducts(limit = 8): Promise<ProductWidget[] | null> {
		return this.client.get<ProductWidget[]>(`/api/get-herbal-products/?limit=${limit}`);
	}
		/**
	 * Get premium meat products (category_id = 2).
	 * Returns a flat list of product cards.
	 */
	async getBeverages(limit = 8): Promise<ProductWidget[] | null> {
		return this.client.get<ProductWidget[]>(`/api/get-beverages/?limit=${limit}`);
	}
}
