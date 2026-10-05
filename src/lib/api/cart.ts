/**
 * Cart API endpoints
 */

import type { ApiClient } from './client';

export interface CartCountResponse {
	success: boolean;
	active_count: number;
	[key: string]: any;
}

export interface CartItem {
	id: number;
	product_id?: number;
	cart_item_id?: number;
	product?: {
		id: number;
		name: string;
		image?: string;
		images?: Array<{ image: string }>;
		sale_price?: string | number;
		regular_price?: string | number;
		stock_status?: string;
	};
	name?: string;
	image?: string;
	price?: string | number;
	sale_price?: string | number;
	regular_price?: string | number;
	size?: string;
	color?: string;
	color_hex?: string;
	colorHex?: string;
	quantity: number;
	stock_status?: string;
}

export interface CartResponse {
	success: boolean;
	cart?: {
		id: number;
		items: CartItem[];
	};
	order?: any;
	items?: CartItem[];
	data?: any;
	[key: string]: any;
}

export class CartApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get the current cart count
	 * GET /api/cart/count/
	 */
	async getCount(): Promise<CartCountResponse | null> {
		try {
			const response = await this.client.get<CartCountResponse>('/api/cart/count/');
			return response;
		} catch (error) {
			console.error('[CartApi] Failed to get cart count:', error);
			return null;
		}
	}

	/**
	 * Get full cart with all items
	 * GET /api/cart/
	 */
	async getCart(token: string): Promise<CartResponse | null> {
		try {
			const response = await this.client.get<CartResponse>('/api/cart/', token);
			return response;
		} catch (error) {
			console.error('[CartApi] Failed to get cart:', error);
			return null;
		}
	}
}
