import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('adm_access_token') || '';
	if (!token) {
		throw redirect(302, `${base}/login`);
	}
	return {};
};

export const actions: Actions = {
	createFaq: async ({ request, cookies }) => {
		try {
			const token = cookies.get('adm_access_token') || '';
			if (!token) {
				return fail(401, { success: false, message: 'Not authenticated' });
			}

			const formData = await request.formData();

			const backendFormData = new FormData();
			backendFormData.append('question', formData.get('question') as string);
			backendFormData.append('answer', (formData.get('answer') as string) || '');
			backendFormData.append('category', formData.get('category') as string);
			backendFormData.append('order', (formData.get('order') as string) || '0');
			backendFormData.append('is_active', (formData.get('is_active') as string) || 'true');

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/faqs/create/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				credentials: 'include',
				body: backendFormData
			});

			const data = await response.json();
			if (!response.ok) {
				return fail(response.status, {
					success: false,
					message: data.message || 'Failed to create FAQ',
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
