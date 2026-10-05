/**
 * Profile API endpoints
 */

import type { ApiClient } from './client';

export interface UserProfile {
	id?: number;
	first_name: string;
	last_name: string;
	email: string;
	phone_number: string;
	date_of_birth?: string;
	gender?: string;
	avatar?: string;
	user_email?: string;
	user_name?: string;
}

export interface ShippingAddressData {
	id: number;
	address_type: 'shipping' | 'billing';
	full_name: string;
	phone: string;
	email: string;
	address_line1: string;
	address_line2?: string;
	city: string;
	state: string;
	postal_code: string;
	country: string;
	is_default: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface UserData {
	id: number;
	email: string;
	phone: string;
	name: string;
	is_active: boolean;
	created_at: string;
	profile: UserProfile;
	addresses?: ShippingAddressData[];
	billing_address?: ShippingAddressData;
	shipping_address?: ShippingAddressData;
}

export interface ProfileResponse {
	success: boolean;
	profile?: UserProfile;
	data?: UserProfile;
	user?: UserData;
	[key: string]: any;
}

export interface TotalOrdersResponse {
	success: boolean;
	total_orders?: number;
	[key: string]: any;
}

export interface TotalSpentResponse {
	success: boolean;
	total_spent?: number;
	[key: string]: any;
}

export interface Order {
    id: string;
    created_at?: string;
    date?: string;
    status: string;
    total: number;
    items?: { name: string; quantity: number; price: number }[];
}

export interface Summary {
	statistics: {
		total_orders: string,
		total_spent: string,
		cancelled_orders: string,
		delivered_orders: string,
		average_order_value: string
		recent_orders: Order[]
	};
}

export interface OrderHistory {
	total_items: string,
	item: {
		id:string,
		name:string,
		quantity:string,
		price:string,
		image: string,
		size: string,
		color: string,
		subtotal: string,
		discount: string,
		order_code: string,
		order_date: string,
		order_status: string
	}
}
export class ProfileApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get user profile
	 * GET /api/profile/
	 */
	async getProfile(): Promise<ProfileResponse | null> {
		try {
			const response = await this.client.get<ProfileResponse>('/api/myaccount/profile/');
			return response;
		} catch (error) {
			console.error('[ProfileApi] Failed to get profile:', error);
			return null;
		}
	}

	async gettotalorders(): Promise<TotalOrdersResponse | null> {
		try {
			const response = await this.client.get<TotalOrdersResponse>('/api/orders/total/');
			return response;
		} catch (error) {
			console.error('[ProfileApi] Failed to get total orders:', error);
			return null;
		}
	}

	async gettotalspent(): Promise<TotalOrdersResponse | null> {
		try {
			const response = await this.client.get<TotalOrdersResponse>('/api/orders/spent/');
			return response;
		} catch (error) {
			console.error('[ProfileApi] Failed to get total spent:', error);
			return null;
		}
	}

	async getrecentorders(): Promise<Order[] | null> {
		try {
			const response = await this.client.get<{ success: boolean; recent_orders: Order[] }>('/api/orders/recent/');
			return response.recent_orders || [];
		} catch (error) {
			console.error('[ProfileApi] Failed to get recent orders:', error);
			return null;
		}
	}

	async getordersummary(): Promise<{summary: Summary} | null> {
		try {
			const response = await this.client.get<{ success: boolean; summary: Summary }>('/api/orders/summary/');
			return response;
		} catch (error) {
			console.error('[ProfileApi] Failed to get order summary:', error);
			return null;
		}
	}

	async getorderhistory(token?: string): Promise<{ success: boolean; order_history: OrderHistory[], } | null> {
		
		try {
			const response = await this.client.get<{ success: boolean; order_history: OrderHistory[] }>('/api/orders/history/', token);
			return response;
		} catch (error) {
			console.error('[ProfileApi] Failed to get order history:', error);
			return null;
		}
	}
	/**
	 * Update user profile
	 * PUT /api/profile/
	 */
	async updateProfile(data: Partial<UserProfile>): Promise<ProfileResponse | null> {
		try {
			const response = await this.client.put<ProfileResponse>('/api/profile/', data);
			return response;
		} catch (error) {
			console.error('[ProfileApi] Failed to update profile:', error);
			return null;
		}
	}

	async getShippingAddress(token?: string): Promise<ShippingAddressData | null> {
		try {
			const response = await this.client.get<ShippingAddressData>('/api/myaccount/shippingaddress/', token);
			return response;
		} catch (error) {
			console.error('[ProfileApi] Failed to get shipping address:', error);
			return null;
		}
	}

	async getBillingAddress(token?: string): Promise<ShippingAddressData | null> {
		try {
			const response = await this.client.get<ShippingAddressData>('/api/myaccount/billingaddress/', token);
			return response;
		} catch (error) {
			console.error('[ProfileApi] Failed to get billing address:', error);
			return null;
		}
	}
}
