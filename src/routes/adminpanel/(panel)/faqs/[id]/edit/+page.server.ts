import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const token = cookies.get('adm_access_token') || '';
	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	try {
		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/faqs/${params.id}/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw error(response.status, 'Failed to load FAQ');
		}

		const faqData = await response.json();
		const faq = faqData?.data || faqData;

		return { faq };
	} catch (err) {
		throw error(500, 'Failed to load FAQ');
	}
};

export const actions: Actions = {
	updateFaq: async ({ request, cookies, params }) => {
		try {
			const token = cookies.get('adm_access_token') || '';
			if (!token) {
				return fail(401, { message: 'Not authenticated' });
			}

			const formData = await request.formData();

			const backendFormData = new FormData();
			backendFormData.append('question', formData.get('question') as string);
			backendFormData.append('answer', (formData.get('answer') as string) || '');
			backendFormData.append('category', formData.get('category') as string);
			backendFormData.append('order', (formData.get('order') as string) || '0');
			backendFormData.append('is_active', (formData.get('is_active') as string) || 'true');

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/faqs/${params.id}/update/`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`
				},
				credentials: 'include',
				body: backendFormData
			});

			const data = await response.json();
			if (!response.ok) {
				return fail(response.status, {
					message: data.message || 'Failed to update FAQ',
					errors: data.errors
				});
			}
			return { success: true, data };
		} catch (error) {
			return fail(500, {
				message: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	},

	deleteFaq: async ({ request, cookies }) => {
		try {
			const formData = await request.formData();
			const faqId = formData.get('id');
			if (!faqId) {
				return fail(400, { success: false, message: 'FAQ ID is required' });
			}
			const token = cookies.get('adm_access_token') || '';
			if (!token) {
				return fail(401, { success: false, message: 'Not authenticated' });
			}
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/faqs/${faqId}/delete/`, {
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
