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

		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/faqs/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});

		if (!response.ok) {
			return { faqs: [], error: 'Failed to load FAQs' };
		}

		const data = await response.json();
		let faqs = [];
		if (data && typeof data === 'object') {
			if (data.data && Array.isArray(data.data)) {
				faqs = data.data;
			} else if (Array.isArray(data)) {
				faqs = data;
			}
		}
		return { faqs };
	} catch (error) {
		return { faqs: [], error: 'Failed to load FAQs' };
	}
};

export const actions: Actions = {
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
