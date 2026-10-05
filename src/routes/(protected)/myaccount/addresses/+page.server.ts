import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_BASE_URL } from '$env/static/public';
import type { Actions } from './$types';
import {createApi} from '$lib/api';
import { getAccessTokenFromCookieStore } from '$lib/utils/protected-route';

export const load = async ({ cookies, fetch }) => {
	const authToken = cookies.get('cust_access_token');
	const api = createApi(fetch, undefined, authToken);
	if (!authToken) {
		throw redirect(302, '/login');
	}
	// const response = await api.profile.getShippingAddress();

	// const api = createApi(fetch);
	const shippingResponse = await api.addresses.getShippingAddresses();
	
	const billingResponse = await api.addresses.getBillingAddresses();
	if (!shippingResponse && !billingResponse) {
		return { shippingAddress: null, billingAddress: null };
	}
	return { shippingAddress: shippingResponse, billingAddress: billingResponse };

}

export const actions: Actions = {
	updateShippingAddress: async ({ request, fetch, cookies }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const full_name = formData.get('full_name') as string;
		const phone = formData.get('phone') as string;
		const email = formData.get('email') as string;
		const address_line1 = formData.get('address_line1') as string;
		const address_line2 = formData.get('address_line2') as string;
		const city = formData.get('city') as string;
		const state = formData.get('state') as string;
		const postal_code = formData.get('postal_code') as string;
		const country = formData.get('country') as string;
		const is_default = formData.get('is_default') === 'on';
		const address_type = 'shipping';

		const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:9000';
		const authToken = getAccessTokenFromCookieStore(cookies);

		const isEdit = !!id;

		const body: Record<string, any> = {
			full_name,
			phone,
			email,
			address_line1,
			address_line2,
			city,
			state,
			postal_code,
			country,
			address_type,
			is_default
		};

		// Choose endpoint + method based on create vs update
		const url = isEdit
			? `${API_BASE_URL}/api/myaccount/shippingaddress/update/${id}/`
			: `${API_BASE_URL}/api/myaccount/shippingaddress/`;
			// console.log('Request URL:', url);

		const method = isEdit ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				},
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const error = await response.json();
				return fail(response.status, {
					message: error.detail || `Failed to ${isEdit ? 'update' : 'save'} shipping address`
				});
			}

			const result = await response.json();
			return {
				success: true,
				message: isEdit
					? 'Shipping address updated successfully'
					: 'Shipping address saved successfully',
				data: result
			};
		} catch (error) {
			return fail(500, {
				message: error instanceof Error ? error.message : 'An error occurred'
			});
		}
	},

	updateBillingAddress: async ({ request, fetch, cookies }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const full_name = formData.get('full_name') as string;
		const phone = formData.get('phone') as string;
		const email = formData.get('email') as string;
		const address_line1 = formData.get('address_line1') as string;
		const address_line2 = formData.get('address_line2') as string;
		const city = formData.get('city') as string;
		const state = formData.get('state') as string;
		const postal_code = formData.get('postal_code') as string;
		const country = formData.get('country') as string;
		const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:9000';
		const authToken = getAccessTokenFromCookieStore(cookies);

		try {
			const isEdit = !!id;
			const body: Record<string, any> = {
				full_name, phone, email, address_line1, address_line2,
				city, state, postal_code, country
			};
			if (isEdit) body.id = Number(id);

			const response = await fetch(`${API_BASE_URL}/api/myaccount/billingaddress/create/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				},
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const error = await response.json();
				return fail(response.status, {
					message: error.detail || 'Failed to save billing address'
				});
			}

			const result = await response.json();
			return {
				success: true,
				message: isEdit ? 'Billing address updated successfully' : 'Billing address saved successfully',
				data: result
			};
		} catch (error) {
			return fail(500, {
				message: error instanceof Error ? error.message : 'An error occurred'
			});
		}
	},

	setDefaultAddress: async ({ request, fetch, cookies }) => {
		const formData = await request.formData();
		const addressId = formData.get('address_id') as string;
		const addressType = formData.get('address_type') as string;
		const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:9000';
		const authToken = getAccessTokenFromCookieStore(cookies);

		try {
			const endpoint = addressType === 'shipping'
				? `${API_BASE_URL}/api/myaccount/shippingaddress/update/${addressId}/`
				: `${API_BASE_URL}/api/myaccount/billingaddress/update/${addressId}/`;

			const body: Record<string, any> = {
				id: Number(addressId),
				is_default: true
			};

			const response = await fetch(endpoint, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				},
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const error = await response.json();
				return fail(response.status, {
					message: error.detail || 'Failed to set default address'
				});
			}

			return {
				success: true,
				message: 'Default address updated successfully'
			};
		} catch (error) {
			return fail(500, {
				message: error instanceof Error ? error.message : 'An error occurred'
			});
		}
	},

	deleteAddress: async ({ request, fetch, cookies }) => {
		const formData = await request.formData();
		const addressId = formData.get('address_id') as string;
		const addressType = formData.get('address_type') as string;
		const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:9000';
		const authToken = getAccessTokenFromCookieStore(cookies);

		try {
			const endpoint = addressType === 'shipping'
				? `${API_BASE_URL}/api/myaccount/shippingaddress/delete/${addressId}/`
				: `${API_BASE_URL}/api/myaccount/billingaddress/delete/${addressId}/`;

			const response = await fetch(endpoint, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${authToken}`
				}
			});

			if (!response.ok) {
				let detail = 'Failed to delete address';
				try {
					const error = await response.json();
					detail = error.detail || detail;
				} catch {}
				return fail(response.status, { message: detail });
			}

			return {
				success: true,
				message: `${addressType === 'shipping' ? 'Shipping' : 'Billing'} address deleted successfully`
			};
		} catch (error) {
			return fail(500, {
				message: error instanceof Error ? error.message : 'An error occurred'
			});
		}
	}
};
