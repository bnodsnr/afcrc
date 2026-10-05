import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ cookies }) => {
	// Get auth token
	const token = cookies.get('adm_access_token');

	// Redirect if not authenticated
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
		}
		return { parentMenus, apiToken: token, error: null };
	} catch {
		return { parentMenus: [], apiToken: token, error: null };
	}
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		try {
			const token = cookies.get('adm_access_token');

			if (!token) {
				return fail(401, { message: 'Unauthorized - No token found' });
			}
			console.log('🔐 Token:', token);
			const formData = await request.formData();

			// Extract form fields
			const name = formData.get('name') as string;
			const company = formData.get('company') as string | null;
			const designation = formData.get('designation') as string;
			const content = formData.get('content') as string;
			const is_active = formData.get('is_active') === 'on' ? true : false;
			const photo = formData.get('photo') as File | null;

			// Validation
			if (!name || !content) {
				return fail(400, {
					message: 'Name and content are required',
					success: false
				});
			}

			// Create FormData for API request
			const apiFormData = new FormData();
			apiFormData.append('name', name);
			apiFormData.append('company', company || '');
			apiFormData.append('content', content);
			apiFormData.append('is_active', is_active ? 'true' : 'false');

			// Add image if provided
			if (photo && photo.size > 0) {
				apiFormData.append('photo', photo);
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/testimonials/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: apiFormData
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('❌ Testimonial Creation Error:', response.status, result);
				return fail(response.status, {
					message: result.message || 'Failed to create testimonial',
					success: false,
					errors: result.errors
				});
			}

			return {
				success: true,
				message: 'Testimonial created successfully!',
				data: result.data
			};
		} catch (err) {
			console.error('❌ Server Action Error:', err);
			return fail(500, {
				message: 'An error occurred while creating the testimonial',
				success: false
			});
		}
	}
};
