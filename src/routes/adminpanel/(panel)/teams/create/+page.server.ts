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

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/teams/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: apiFormData
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('❌ Team Create Error:', response.status, result);
				return fail(response.status, {
					message: result.message || 'Failed to create team member',
					success: false,
					errors: result.errors
				});
			}

			return {
				success: true,
				message: 'Team member created successfully!',
				data: result.data
			};
		} catch (err) {
			console.error('❌ Server Action Error:', err);
			return fail(500, {
				message: 'An error occurred while creating the team member',
				success: false
			});
		}
	}
};
