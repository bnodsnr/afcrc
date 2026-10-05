import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';
import { normalizeHtmlContent } from '$lib/admin/utils/sanitize';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('adm_access_token') || '';
	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	try {
		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/menus/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});

		let parentMenus = [];
		if (response.ok) {
			const data = await response.json();
			parentMenus = data.data;
			// if (data?.data && Array.isArray(data.data)) {
			// 	parentMenus = data.data.filter((m: any) => m.is_parent);
			// }
		}
		return { parentMenus };
	} catch {
		return { parentMenus: [] };
	}
};

export const actions: Actions = {
	createMenu: async ({ request, cookies }) => {
		try {
			const token = cookies.get('adm_access_token') || '';
			if (!token) {
				return fail(401, { success: false, message: 'Not authenticated' });
			}

			const formData = await request.formData();

			const backendFormData = new FormData();
			backendFormData.append('name', formData.get('name') as string);
			backendFormData.append('url', (formData.get('url') as string) || '');
			backendFormData.append('slug', (formData.get('slug') as string) || '');
			backendFormData.append('position', formData.get('position') as string);
			backendFormData.append('is_parent', formData.get('is_parent') as string);
			backendFormData.append('is_component', (formData.get('is_component') as string) || 'false');
			if (formData.get('component_name')) {
				backendFormData.append('component_name', formData.get('component_name') as string);
			}
			if (formData.get('parent')) {
				backendFormData.append('parent', formData.get('parent') as string);
			}
			backendFormData.append('page_content', normalizeHtmlContent((formData.get('page_content') as string) || ''));
			backendFormData.append('order', (formData.get('order') as string) || '0');
			backendFormData.append('is_active', (formData.get('is_active') as string) || 'true');
			const imageFile = formData.get('image') as File | null;
			
			if (imageFile) {
				backendFormData.append('featured_image', imageFile);
			}
			
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/menus/create/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				credentials: 'include',
				body: backendFormData
			});

			const responseText = await response.text();

			let data;
			try {
				data = JSON.parse(responseText);
			} catch {
				return fail(500, {
					success: false,
					message: `Invalid API response (${response.status}): ${responseText.substring(0, 200)}`
				});
			}
			if (!response.ok) {
				return fail(response.status, {
					success: false,
					message: data.message || 'Failed to create menu',
					errors: data.errors
				});
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
