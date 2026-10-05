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

	return {
		apiToken: token,
		error: null
	};
};

export const actions: Actions = {
	createBlog: async ({ request, cookies }) => {
		try {
			const token = cookies.get('adm_access_token');

			if (!token) {
				return fail(401, { message: 'Unauthorized - No token found' });
			}
			const formData = await request.formData();

			// Extract form fields
			const title = formData.get('title') as string;
			const author = formData.get('author') as string;
			const content = formData.get('content') as string;
			const status = formData.get('is_active') === 'on' ? true : false;
			const image = formData.get('image') as File | null;

			// Validation
			if (!title || !content) {
				return fail(400, {
					message: 'Title and content are required',
					success: false
				});
			}

			// Create FormData for API request
			const apiFormData = new FormData();
			apiFormData.append('title', title);
			apiFormData.append('author', author || '');
			apiFormData.append('content', content);
			apiFormData.append('status', status ? 'true' : 'false');

			// Add image if provided
			if (image && image.size > 0) {
				apiFormData.append('image', image);
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/blogs/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: apiFormData
			});

			console.log('API Response Status:', response.status);
			const result = await response.json();

			if (!response.ok) {
				
				return fail(response.status, {
					message: result.message || 'Failed to create blog',
					success: false,
					errors: result.errors
				});
			}

			return {
				success: true,
				message: 'Blog created successfully!',
				data: result.data
			};
		} catch (err) {
			
			return fail(500, {
				message: 'An error occurred while creating the blog',
				success: false
			});
		}
	}
};
