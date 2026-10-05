import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ params, fetch, cookies }) => {
	const token = cookies.get('adm_access_token') || '';
	try {
		const productTypeId = Number(params.id);
		if (isNaN(productTypeId)) {
			throw error(400, 'Invalid product type ID');
		}

		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/product-types/${productTypeId}/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});

		if (!response.ok) {
			throw error(response.status, 'Failed to load product type');
		}

		const data = await response.json();

		let productType = null;
		if (data && typeof data === 'object') {
			if (data.data && typeof data.data === 'object') {
				productType = data.data;
			} else if (data.results && Array.isArray(data.results) && data.results[0]) {
				productType = data.results[0];
			} else if (!Array.isArray(data)) {
				productType = data;
			}
		}

		if (!productType) {
			throw error(404, 'Product type not found');
		}

		return { productType };
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load product type');
	}
};

export const actions: Actions = {
	default: async ({ request, params, fetch, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		try {
			const productTypeId = Number(params.id);
			if (isNaN(productTypeId)) {
				return fail(400, { error: 'Invalid product type ID' });
			}

			const formData = await request.formData();
			const name = formData.get('name') as string;
			const code = formData.get('code') as string;
			const description = formData.get('description') as string;
			const isActive = formData.get('is_active') === 'on';

			if (!name || name.trim() === '') {
				return fail(400, { error: 'Product type name is required', name, code, description, isActive });
			}

			const payload = {
				name: name.trim(),
				code: code?.trim() || '',
				description: description || '',
				is_active: isActive
			};

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/product-types/${productTypeId}/`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(payload),
				credentials: 'include'
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('API Error Response:', errorText);
				try {
					const errorData = JSON.parse(errorText);
					return fail(response.status, {
						error: errorData.message || errorData.error || 'Failed to update product type',
						details: errorData
					});
				} catch {
					return fail(response.status, { error: 'Failed to update product type', details: errorText });
				}
			}

			const result = await response.json();
			return {
				success: true,
				message: 'Product type updated successfully',
				productType: result
			};
		} catch (err: any) {
			return fail(500, {
				error: err instanceof Error ? err.message : 'An unexpected error occurred'
			});
		}
	}
};
