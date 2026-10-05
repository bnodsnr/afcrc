import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import{fail} from '@sveltejs/kit';
import type { Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	// Get auth token
	const token = cookies.get('adm_access_token') || cookies.get('adm_access_token');

	// Redirect if not authenticated
	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	// Reusable headers
	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};

	try {
		// Fetch blogs API
		const blogsResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/blogs/`, {
			method: 'GET',
			headers
		});

		// Handle blogs fetch failure
		if (!blogsResponse.ok) {
			console.error('❌ Blogs API Error:', blogsResponse.status, await blogsResponse.text());
			throw error(blogsResponse.status, 'Failed to load blogs');
		}

		// Parse JSON
		const blogsData = await blogsResponse.json();

		return {
			blogs: blogsData.data ?? [],
			blogCount: blogsData.data?.length ?? 0,
			apiToken: token,
			error: null
		};
	} catch (err) {
		console.error('❌ Server Load Error:', err);
		throw error(500, 'Failed to load blogs');
	}
};


export const actions = {
	deleteBlog: async ({  request, cookies }) => {
		const token = cookies.get('adm_access_token') || cookies.get('adm_access_token');

		if (!token) {
			throw redirect(302, `${base}/login`);
		}
		try {			const formData = await request.formData();
			const blogId = formData.get('id');

			if (!blogId) {
				return fail(400, {
					success: false,
					message: 'Blog ID is required'
				});
			}

			// Make request to backend API with token
			const backendUrl = `${PUBLIC_API_BASE_URL}/api/blogs/${blogId}/`;

			const response = await fetch(backendUrl, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Backend API Error:', response.status, errorText);
				return fail(response.status, {
					success: false,
					message: 'Failed to delete blog'
				});
			}

			return {
				success: true,
				message: 'Blog deleted successfully'
			};
		} catch (error) {
			console.error('[Server Action] Error:', error);
			return fail(500, {
				success: false,
				message: 'An error occurred while deleting the blog'
			});
		}
	}
};