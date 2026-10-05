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
		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/teams/${params.id}/`, {
			method: 'GET',
			headers
		});

		if (!response.ok) {
			console.error('❌ Team API Error:', response.status, await response.text());
			throw error(response.status, 'Failed to load team member');
		}

		const payload = await response.json();

		return {
			team: payload.data ?? null,
			apiToken: token,
			error: null
		};
	} catch (err) {
		console.error('❌ Server Load Error:', err);
		throw error(500, 'Failed to load team member');
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
			const qualification = formData.get('qualification') as string;
			const position = formData.get('position') as string;
			const description = formData.get('description') as string;
			const is_active = formData.get('is_active') === 'on';
			const image = formData.get('image') as File | null;

			if (!name) {
				return fail(400, { message: 'Name is required', success: false });
			}

			const apiFormData = new FormData();
			apiFormData.append('name', name);
			apiFormData.append('qualification', qualification || '');
			apiFormData.append('position', position || '');
			apiFormData.append('description', description || '');
			apiFormData.append('is_active', is_active ? 'true' : 'false');

			if (image && image.size > 0) {
				apiFormData.append('image', image);
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/teams/${params.id}/`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: apiFormData
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('❌ Team Update Error:', response.status, result);
				return fail(response.status, {
					message: result.message || 'Failed to update team member',
					success: false,
					errors: result.errors
				});
			}

			return {
				success: true,
				message: 'Team member updated successfully!',
				data: result.data
			};
		} catch (err) {
			console.error('❌ Server Action Error:', err);
			return fail(500, {
				message: 'An error occurred while updating the team member',
				success: false
			});
		}
	}
};
