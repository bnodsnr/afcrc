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

		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/menus/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});

		if (!response.ok) {
			return { menus: [], error: 'Failed to load menus' };
		}

		const data = await response.json();
		let menus = [];
		if (data && typeof data === 'object') {
			if (data.data && Array.isArray(data.data)) {
				menus = data.data;
			} else if (Array.isArray(data)) {
				menus = data;
			}
		}
		return { menus };
	} catch (error) {
		return { menus: [], error: 'Failed to load menus' };
	}
};

export const actions: Actions = {
	deleteMenu: async ({ request, cookies }) => {
		try {
			const formData = await request.formData();
			const menuId = formData.get('id');
			if (!menuId) {
				return fail(400, { success: false, message: 'Menu ID is required' });
			}
			const token = cookies.get('adm_access_token') || '';
			if (!token) {
				return fail(401, { success: false, message: 'Not authenticated' });
			}
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/menus/${menuId}/delete/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include'
			});
			const data = await response.json();
			if (!response.ok) {
				return fail(response.status, data);
			}
			return { success: true, data };
		} catch (error) {
			return fail(500, {
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
};
