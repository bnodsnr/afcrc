/**
 * Banner and promotional content API calls
 */

import type { ApiClient } from './client';
import type { PromoBannersData } from './types';

export class BannersApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get promotional banners
	 */
	async getPromoBanners(): Promise<PromoBannersData | null> {
		const result = await this.client.get<PromoBannersData>('/api/get-promo-banners/');
		
		return result;
	}

	/**
	 * Get hero banners
	 */
	async getHeroBanners(): Promise<PromoBannersData | null> {
		return this.client.get<PromoBannersData>('/api/get-hero-banners/');
	}

	async getBannerPlacement(placement: string): Promise<PromoBannersData | null> {
		return this.client.get<PromoBannersData>(`/api/get-banner-placement/${placement}`);
	}
}
