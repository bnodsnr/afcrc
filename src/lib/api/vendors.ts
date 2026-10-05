/**
 * Vendors API endpoints
 */

import type { ApiClient } from './client';

export interface Vendor {
	id: number;
	name: string;
	slug?: string;
	description?: string;
	logo?: string;
	email?: string;
	phone?: string;
	address?: string;
	is_active?: boolean;
	created_at?: string;
	updated_at?: string;
	[key: string]: any;
}

export interface VendorResponse {
	success: boolean;
	message?: string;
	data?: Vendor;
	vendor?: Vendor;
}

export interface VendorListResponse {
	success: boolean;
	message?: string;
	data?: Vendor[];
	vendors?: Vendor[];
}

export class VendorsApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get all vendors
	 * GET /api/vendors/
	 */
	async getVendors(): Promise<VendorListResponse | null> {
		try {
			const response = await this.client.get<VendorListResponse>('/api/vendors/');
			return response;
		} catch (error) {
			console.error('[VendorsApi] Failed to get vendors:', error);
			return null;
		}
	}

	/**
	 * Get vendor by ID
	 * GET /api/vendors/{id}/
	 */
	async getVendorById(id: number): Promise<VendorResponse | null> {
		try {
			const response = await this.client.get<VendorResponse>(`/api/vendors/${id}/`);
			return response;
		} catch (error) {
			console.error('[VendorsApi] Failed to get vendor:', error);
			return null;
		}
	}

	/**
	 * Create a new vendor
	 * POST /api/vendor
	 */
	async createVendor(data: Partial<Vendor>): Promise<VendorResponse | null> {
		try {
			const response = await this.client.post<VendorResponse>('/api/vendor', data);
			return response;
		} catch (error) {
			console.error('[VendorsApi] Failed to create vendor:', error);
			return null;
		}
	}

	/**
	 * Update an existing vendor
	 * PUT /api/vendors/{id}/
	 */
	async updateVendor(id: number, data: Partial<Vendor>): Promise<VendorResponse | null> {
		try {
			const response = await this.client.put<VendorResponse>(`/api/vendors/${id}/`, data);
			return response;
		} catch (error) {
			console.error('[VendorsApi] Failed to update vendor:', error);
			return null;
		}
	}

	/**
	 * Delete a vendor
	 * DELETE /api/vendors/{id}/
	 */
	async deleteVendor(id: number): Promise<VendorResponse | null> {
		try {
			const response = await this.client.delete<VendorResponse>(`/api/vendors/${id}/`);
			return response;
		} catch (error) {
			console.error('[VendorsApi] Failed to delete vendor:', error);
			return null;
		}
	}
}
