/**
 * Addresses API endpoints
 */

import type { ApiClient } from './client';

export interface Address {
	id: number;
	address_type: 'shipping' | 'billing';
	full_name?: string;
	phone?: string;
	email?: string;
	address_line1: string;
	address_line2?: string;
	city: string;
	state: string;
	postal_code: string;
	country: string;
	is_default: boolean;
}

export interface AddressesResponse {
	success: boolean;
	addresses?: Address[];
	data?: Address[];
	[key: string]: any;
}

export interface SingleAddressResponse {
	success: boolean;
	address?: Address;
	data?: Address;
	[key: string]: any;
}

export class AddressesApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get all addresses
	 * GET /api/addresses/
	 */
	async getAddresses(): Promise<AddressesResponse | null> {
		try {
			const response = await this.client.get<AddressesResponse>('/api/addresses/');
			return response;
		} catch (error) {
			console.error('[AddressesApi] Failed to get addresses:', error);
			return null;
		}
	}

	/**
	 * Get billing addresses
	 * GET /api/addresses/billing/
	 */
	async getBillingAddresses(): Promise<AddressesResponse | null> {
		try {
			const response = await this.client.get<AddressesResponse>('/api/myaccount/billingaddress/');
			return response;
		} catch (error) {
			console.error('[AddressesApi] Failed to get billing addresses:', error);
			return null;
		}
	}

	/**
	 * Get shipping addresses
	 * GET /api/addresses/shipping/
	 */
	async getShippingAddresses(): Promise<AddressesResponse | null> {
		try {
			const response = await this.client.get<AddressesResponse>('/api/myaccount/shippingaddress/');
			return response;
		} catch (error) {
			console.error('[AddressesApi] Failed to get shipping addresses:', error);
			return null;
		}
	}

	/**
	 * Create new address
	 * POST /api/addresses/
	 */
	async createAddress(data: Partial<Address>): Promise<SingleAddressResponse | null> {
		try {
			const response = await this.client.post<SingleAddressResponse>('/api/addresses/', data);
			return response;
		} catch (error) {
			console.error('[AddressesApi] Failed to create address:', error);
			return null;
		}
	}

	/**
	 * Update address
	 * PUT /api/addresses/{id}/
	 */
	async updateAddress(id: number, data: Partial<Address>): Promise<SingleAddressResponse | null> {
		try {
			const response = await this.client.put<SingleAddressResponse>(`/api/addresses/${id}/`, data);
			return response;
		} catch (error) {
			console.error('[AddressesApi] Failed to update address:', error);
			return null;
		}
	}

	/**
	 * Delete address
	 * DELETE /api/addresses/{id}/
	 */
	async deleteAddress(id: number): Promise<any> {
		try {
			const response = await this.client.delete<any>(`/api/addresses/${id}/`);
			return response;
		} catch (error) {
			console.error('[AddressesApi] Failed to delete address:', error);
			return null;
		}
	}
}
