import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const token = cookies.get('adm_access_token');

	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};

	try {
		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/enquiry/`, {
			method: 'GET',
			headers
		});

		if (!response.ok) {
			console.error('Enquiries API Error:', response.status, await response.text());
			throw error(response.status, 'Failed to load enquiries');
		}

		const json = await response.json();

		return {
			items: json.data ?? [],
			totalCount: json.data?.length ?? 0,
			apiToken: token,
			error: null
		};
	} catch (err) {
		console.error('Server Load Error:', err);
		throw error(500, 'Failed to load enquiries');
	}
};

export const actions: Actions = {
	deleteItem: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token');

		if (!token) {
			throw redirect(302, `${base}/login`);
		}

		try {
			const formData = await request.formData();
			const id = formData.get('id');

			if (!id) {
				return fail(400, { success: false, message: 'ID is required' });
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/enquiry/${id}/delete/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				return fail(response.status, { success: false, message: 'Failed to delete' });
			}

			return { success: true, message: 'Deleted successfully' };
		} catch (err) {
			console.error('[Server Action] Error:', err);
			return fail(500, { success: false, message: 'An error occurred' });
		}
	}
};
