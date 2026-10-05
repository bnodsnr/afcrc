/**
 * Orders API endpoints
 */

import type { ApiClient } from './client';

export interface Order {
	id?: number;
	order_code: string;
	user_id?: number;
	items: any[];
	billing_address?: any;
	shipping_address?: any;
	payment_method: string;
	payment_status: string;
	order_status: string;
	total_amount: number;
	created_at?: string;
	updated_at?: string;
}

export interface OrderConfirmRequest {
	items: any[];
	shipping_address: any;
	billing_address?: any;
	payment_method: string;
	promo_code?: string | null;
}

export interface OrderResponse {
	success: boolean;
	order?: Order;
	data?: Order;
	message?: string;
	[key: string]: any;
}

export interface OrdersListResponse {
	success: boolean;
	orders?: Order[];
	data?: Order[];
	[key: string]: any;
}

export class OrdersApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get user's orders
	 * GET /api/orders/
	 */
	async getOrders(): Promise<OrdersListResponse | null> {
		try {
			const response = await this.client.get<OrdersListResponse>('/api/orders/');
			return response;
		} catch (error) {
			console.error('[OrdersApi] Failed to get orders:', error);
			return null;
		}
	}

	/**
	 * Get single order details
	 * GET /api/orders/{id}/
	 */
	async getOrder(id: number | string): Promise<OrderResponse | null> {
		try {
			const response = await this.client.get<OrderResponse>(`/api/orders/${id}/`);
			return response;
		} catch (error) {
			console.error('[OrdersApi] Failed to get order:', error);
			return null;
		}
	}

	/**
	 * Confirm/create new order
	 * POST /api/orders/confirm/
	 */
	async confirmOrder(data: OrderConfirmRequest): Promise<OrderResponse | null> {
		try {
			const response = await this.client.post<OrderResponse>('/api/orders/confirm/', data);
			return response;
		} catch (error) {
			console.error('[OrdersApi] Failed to confirm order:', error);
			return null;
		}
	}

	/**
	 * Cancel order
	 * POST /api/orders/{id}/cancel/
	 */
	async cancelOrder(id: number | string): Promise<OrderResponse | null> {
		try {
			const response = await this.client.post<OrderResponse>(`/api/orders/${id}/cancel/`, {});
			return response;
		} catch (error) {
			console.error('[OrdersApi] Failed to cancel order:', error);
			return null;
		}
	}

	/**
	 * Update order status
	 * PATCH /api/orders/{id}/
	 */
	async updateOrderStatus(id: number | string, status: string): Promise<OrderResponse | null> {
		try {
			const response = await this.client.post<OrderResponse>(`/api/orders/${id}/`, { status });
			return response;
		} catch (error) {
			console.error('[OrdersApi] Failed to update order:', error);
			return null;
		}
	}
}
