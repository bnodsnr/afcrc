import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ params, cookies, fetch }) => {
	const token = cookies.get('adm_access_token');

	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};

	try {
		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/services/${params.id}/`, {
			method: 'GET',
			headers
		});

		if (!response.ok) {
			console.error('❌ Service API Error:', response.status, await response.text());
			throw error(response.status, 'Failed to load service');
		}

		const payload = await response.json();

		return {
			service: payload.data ?? null,
			apiToken: token,
			error: null
		};
	} catch (err) {
		console.error('❌ Server Load Error:', err);
		throw error(500, 'Failed to load service');
	}
};

export const actions: Actions = {
	update: async ({ request, cookies, params }) => {
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

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/services/${params.id}/`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: apiFormData
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('❌ Service Update Error:', response.status, result);
				return fail(response.status, {
					message: result.message || 'Failed to update service',
					success: false,
					errors: result.errors
				});
			}

			return {
				success: true,
				message: 'Service updated successfully!',
				data: result.data
			};
		} catch (err) {
			console.error('❌ Server Action Error:', err);
			return fail(500, {
				message: 'An error occurred while updating the service',
				success: false
			});
		}
	}
};
