import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('adm_access_token');

	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	return {
		apiToken: token,
		error: null
	};
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token');

		if (!token) {
			return fail(401, { message: 'Unauthorized - No token found', success: false });
		}

		try {
			const formData = await request.formData();

			const name = formData.get('name') as string;
			const status = formData.get('status') === 'on';
			const short_description = formData.get('short_description') as string;
			const content = formData.get('content') as string;
			const featured_image = formData.get('featured_image') as File | null;

			if (!name) {
				return fail(400, { message: 'Name is required', success: false });
			}

			const apiFormData = new FormData();
			apiFormData.append('name', name);
			apiFormData.append('status', status ? 'true' : 'false');
			apiFormData.append('short_description', short_description || '');
			apiFormData.append('content', content || '');

			if (featured_image && featured_image.size > 0) {
				apiFormData.append('featured_image', featured_image);
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/services/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: apiFormData
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('❌ Service Create Error:', response.status, result);
				return fail(response.status, {
					message: result.message || 'Failed to create service',
					success: false,
					errors: result.errors
				});
			}

			return {
				success: true,
				message: 'Service created successfully!',
				data: result.data
			};
		} catch (err) {
			console.error('❌ Server Action Error:', err);
			return fail(500, {
				message: 'An error occurred while creating the service',
				success: false
			});
		}
	}
};
