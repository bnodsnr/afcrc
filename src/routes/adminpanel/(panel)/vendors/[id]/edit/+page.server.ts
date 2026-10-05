import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ params, fetch, cookies }) => {
	const token = cookies.get('adm_access_token') || '';
	try {
		const vendorId = Number(params.id);
		if (isNaN(vendorId)) {
			throw error(400, 'Invalid vendor ID');
		}

		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/vendors/${vendorId}/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});

		if (!response.ok) {
			throw error(response.status, 'Failed to load vendor');
		}

		const data = await response.json();

		let vendor = null;
		if (data && typeof data === 'object') {
			if (data.data && typeof data.data === 'object') {
				vendor = data.data;
			} else if (data.results && Array.isArray(data.results) && data.results[0]) {
				vendor = data.results[0];
			} else if (!Array.isArray(data)) {
				vendor = data;
			}
		}

		if (!vendor) {
			throw error(404, 'Vendor not found');
		}

		return { vendor };
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load vendor');
	}
};

export const actions: Actions = {
	default: async ({ request, params, fetch, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		try {
			const vendorId = Number(params.id);
			if (isNaN(vendorId)) {
				return fail(400, { error: 'Invalid vendor ID' });
			}

			const formData = await request.formData();
			const name = formData.get('name') as string;
			const email = formData.get('email') as string;
			const phone = formData.get('phone') as string;
			const address = formData.get('address') as string;
			const description = formData.get('description') as string;
			const isActive = formData.get('is_active') === 'on';

			if (!name || name.trim() === '') {
				return fail(400, { error: 'Vendor name is required', name, email, phone, address, description, isActive });
			}

			const payload = {
				name: name.trim(),
				email: email || '',
				phone: phone || '',
				address: address || '',
				description: description || '',
				is_active: isActive
			};

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/vendors/${vendorId}/`, {
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
						error: errorData.message || errorData.error || 'Failed to update vendor',
						details: errorData
					});
				} catch {
					return fail(response.status, { error: 'Failed to update vendor', details: errorText });
				}
			}

			const result = await response.json();
			return {
				success: true,
				message: 'Vendor updated successfully',
				vendor: result
			};
		} catch (err: any) {
			return fail(500, {
				error: err instanceof Error ? err.message : 'An unexpected error occurred'
			});
		}
	}
};
