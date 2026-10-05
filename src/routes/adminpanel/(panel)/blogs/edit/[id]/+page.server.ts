import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ params, cookies, fetch }) => {

    const id = params.id;
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
        const blogsResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/blogs/${id}`, {
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
        console.log('blogsData is', blogsData);

        return {
            blogs: blogsData.data ?? [],
          
            apiToken: token,
            error: null
        };
    } catch (err) {
        console.error('❌ Server Load Error:', err);
        throw error(500, 'Failed to load blogs');
    }
};

export const actions: Actions = {	updateBlog: async ({ request, cookies, params }) => {
		try {
			const token = cookies.get('adm_access_token');

			if (!token) {
				return fail(401, { message: 'Unauthorized - No token found' });
			}

			const formData = await request.formData();

			// Extract form fields
			const id = formData.get('id') as string;
			const title = formData.get('title') as string;
			const author = formData.get('author') as string;
			const content = formData.get('content') as string;
			const status = formData.get('is_active') === 'on' ? true : false;
			const image = formData.get('image') as File | null;

			// Validation
			if (!id) {
				return fail(400, {
					message: 'Blog ID is required',
					success: false
				});
			}

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

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/blogs/${id}/`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: apiFormData
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('❌ Blog Update Error:', response.status, result);
				return fail(response.status, {
					message: result.message || 'Failed to update blog',
					success: false,
					errors: result.errors
				});
			}

			return {
				success: true,
				message: 'Blog updated successfully!',
				data: result.data
			};
		} catch (err) {
			console.error('❌ Server Action Error:', err);
			return fail(500, {
				message: 'An error occurred while updating the blog',
				success: false
			});
		}
	},    deleteBlog: async ({ request, cookies }) => {
        try {
            const formData = await request.formData();
            const blogId = formData.get('id');

            console.log('[Server Action] Delete blog ID:', blogId);

            if (!blogId) {
                return fail(400, {
                    success: false,
                    message: 'Blog ID is required'
                });
            }

            // Get token from httpOnly cookies
            const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
            console.log('[Server Action] Token available:', token ? 'Yes' : 'No');

            if (!token) {
                return fail(401, {
                    success: false,
                    message: 'Not authenticated'
                });
            }
            // Make request to backend API with token
            const backendUrl = `${PUBLIC_API_BASE_URL}/api/blogs/${blogId}/`;
            console.log('[Server Action] Calling backend:', backendUrl);

            const response = await fetch(backendUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                credentials: 'include'
            });

            console.log('[Server Action] Backend response status:', response.status);

            const data = await response.json();
            console.log('[Server Action] Backend response:', data);

            if (!response.ok) {
                return fail(response.status, data);
            }

            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('[Server Action] Error:', error);
            return fail(500, {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};