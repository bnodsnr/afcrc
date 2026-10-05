/**
 * Main API exports - centralized API client
 */

import { ApiClient } from './client';
import { AuthApi } from './auth';
import { ProductsApi } from './products';
import { SalesApi } from './sales';
import { BannersApi } from './banners';
import { CategoriesApi } from './categories';
import { CollectionsApi } from './collections';
import { TrendigProducts } from './trendingproduct';
import { FlashSales } from './flashsale';
import { BlogApi } from './blogs';
import { SettingApi } from './settings';
import type { SettingsData } from './types';
import { TestimonialApi } from './testimonials';
import { CartApi } from './cart';
import { ProfileApi } from './profile';
import { AddressesApi } from './addresses';
import { OrdersApi } from './orders';
import { PagesApi } from './pages';
import { MenuApi } from './menus';
import { VendorsApi } from './vendors';
import { FaqsApi } from './faqs';
import { AgroProductApi } from './agroproducts';
import { TeamsApi } from './teams';
import { ServicesApi } from './services';
import { ComponentsApi } from './components';
import { KeyStatsApi } from './keystats';

/**
 * Create API instances with the provided fetch function
 * @param fetchFn - SvelteKit's fetch function
 * @param baseUrl - Optional base URL override (uses PUBLIC_BASE_URL by default)
 */
export function createApi(fetchFn: typeof fetch, baseUrl?: string, token?: string) {
	const client = new ApiClient(fetchFn, baseUrl, token);
	return {
		auth: new AuthApi(client),
		products: new ProductsApi(client),
		sales: new SalesApi(client),
		heroBanners: new BannersApi(client),
		banners: new BannersApi(client),
		promoBanners: new BannersApi(client),
		collections: new CollectionsApi(client),
		categories: new CategoriesApi(client),
		trendingProducts: new TrendigProducts(client),
		flashSales: new FlashSales(client),
		blogs: new BlogApi(client),
		settings: new SettingApi(client),
		testimonials: new TestimonialApi(client),
		cart: new CartApi(client),
		profile: new ProfileApi(client),
		addresses: new AddressesApi(client),
		orders: new OrdersApi(client),
		pages: new PagesApi(client),
		menus: new MenuApi(client),
		vendors: new VendorsApi(client),
		faqs: new FaqsApi(client),
		agroProducts: new AgroProductApi(client),
		teams: new TeamsApi(client),
		services: new ServicesApi(client),
		components:new ComponentsApi(client),
		keyStats: new KeyStatsApi(client)
	};
}

// Export types
export * from './types';
export type { ApiClient } from './client';
export type { CartItem, CartCountResponse, CartResponse } from './cart';
export type { UserProfile, ProfileResponse, UserData, ShippingAddressData } from './profile';
export type { Address, AddressesResponse, SingleAddressResponse } from './addresses';
export type { Order, OrderConfirmRequest, OrderResponse, OrdersListResponse } from './orders';
export type { Vendor, VendorResponse, VendorListResponse } from './vendors';

// Convenience functions for common operations
import { browser } from '$app/environment';
import type { HeroBanner } from '$lib';
import test from 'node:test';

/**
 * Get products by category ID
 */
export async function getProductsByCategory(categoryId: number): Promise<any[]> {
	const api = createApi(fetch);
	return api.products.getByCategory(categoryId);
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<any[]> {
	const api = createApi(fetch);
	const result = await api.categories.getCategories();
	// The API returns an array or an object with categories
	return Array.isArray(result) ? result : [];
}

/**
 * Get site settings
 */
export async function getSettings(): Promise<SettingsData[]> {
	const api = createApi(fetch);
	const settings = await api.settings.getSettings();
	if (!settings) {
		return [];
	}
	return Array.isArray(settings) ? settings : [settings];
}
