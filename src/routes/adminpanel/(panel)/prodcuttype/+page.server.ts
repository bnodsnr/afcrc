import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	try {
		const token = cookies.get('adm_access_token') || '';
		if (!token) {
			throw redirect(303, `${base}/login`);
		}

		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/product-types/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Failed to fetch product types:', errorText);
			return {
				productTypes: [],
				error: 'Failed to load product types'
			};
		}

		const data = await response.json();

		let productTypes = [];
		if (data && typeof data === 'object') {
			if (data.results && Array.isArray(data.results)) {
				productTypes = data.results;
			} else if (Array.isArray(data)) {
				productTypes = data;
			} else if (data.data && Array.isArray(data.data)) {
				productTypes = data.data;
			}
		}

		return { productTypes };
	} catch (error) {
		console.error('Error fetching product types:', error);
		return {
			productTypes: [],
			error: 'Failed to load product types'
		};
	}
};

export const actions: Actions = {
	deleteProductType: async ({ request, cookies }) => {
		try {
			const formData = await request.formData();
			const productTypeId = formData.get('id');

			if (!productTypeId) {
				return fail(400, { success: false, message: 'Product type ID is required' });
			}

			const token = cookies.get('adm_access_token') || '';
			if (!token) {
				return fail(401, { success: false, message: 'Not authenticated' });
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/product-types/${productTypeId}/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include'
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				return fail(response.status, {
					success: false,
					message: data.message || 'Failed to delete product type'
				});
			}

			return { success: true, data: { id: productTypeId } };
		} catch (error) {
			return fail(500, {
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
};
