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
        // Fetch testimonials API
        const testimonialResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/testimonials/${id}`, {
            method: 'GET',
            headers
        });

        // Handle testimonials fetch failure
        if (!testimonialResponse.ok) {
            console.error('❌ Testimonials API Error:', testimonialResponse.status, await testimonialResponse.text());
            throw error(testimonialResponse.status, 'Failed to load testimonials');
        }

        // Parse JSON
        const testimonialData = await testimonialResponse.json();
        console.log('testimonialData is', testimonialData);

        return {
            testimonials: testimonialData.data ?? [],
          
            apiToken: token,
            error: null
        };
    } catch (err) {
        console.error('❌ Server Load Error:', err);
        throw error(500, 'Failed to load testimonials');
    }
};

export const actions: Actions = {
    update: async ({ request, cookies, params }) => {
		try {
			const token = cookies.get('adm_access_token');

			if (!token) {
				return fail(401, { message: 'Unauthorized - No token found' });
			}
            const id = params.id;
			const formData = await request.formData();

			// Extract form fields
			//const id = formData.get('id') as string;
			// Extract form fields
			const name = formData.get('name') as string;
			const company = formData.get('company') as string | null;
			const designation = formData.get('designation') as string;
			const content = formData.get('content') as string;
			const is_active = formData.get('is_active') === 'on' ? true : false;
			const photo = formData.get('photo') as File | null;

			// Validation
			if (!id) {
				return fail(400, {
					message: 'Blog ID is required',
					success: false
				});
			}

			// if (!title || !content) {
			// 	return fail(400, {
			// 		message: 'Title and content are required',
			// 		success: false
			// 	});
			// }

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

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/testimonials/${id}/`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: apiFormData
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('❌ Testimonial Update Error:', response.status, result);
				return fail(response.status, {
					message: result.message || 'Failed to update testimonial',
					success: false,
					errors: result.errors
				});
			}

			return {
				success: true,
				message: 'Testimonial updated successfully!',
				data: result.data
			};
		} catch (err) {
			console.error('❌ Server Action Error:', err);
			return fail(500, {
				message: 'An error occurred while updating the testimonial',
				success: false
			});
		}
},
    
    deleteBlog: async ({ request, cookies }) => {
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