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

		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/vendors/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Failed to fetch vendors:', errorText);
			return {
				vendors: [],
				error: 'Failed to load vendors'
			};
		}

		const data = await response.json();

		let vendors = [];
		if (data && typeof data === 'object') {
			if (data.results && Array.isArray(data.results)) {
				vendors = data.results;
			} else if (Array.isArray(data)) {
				vendors = data;
			} else if (data.data && Array.isArray(data.data)) {
				vendors = data.data;
			}
		}

		return { vendors };
	} catch (error) {
		console.error('Error fetching vendors:', error);
		return {
			vendors: [],
			error: 'Failed to load vendors'
		};
	}
};

export const actions: Actions = {
	deleteVendor: async ({ request, cookies }) => {
		try {
			const formData = await request.formData();
			const vendorId = formData.get('id');

			if (!vendorId) {
				return fail(400, { success: false, message: 'Vendor ID is required' });
			}

			const token = cookies.get('adm_access_token') || '';
			if (!token) {
				return fail(401, { success: false, message: 'Not authenticated' });
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/vendors/${vendorId}/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include'
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				return fail(response.status, { success: false, message: data.message || 'Failed to delete vendor' });
			}

			return { success: true, data: { id: vendorId } };
		} catch (error) {
			return fail(500, {
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
};
