import { fail, redirect } from '@sveltejs/kit';
import { api } from '$lib/admin/api/client';
import type { Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { form } from '$app/server';
import { base } from '$lib/admin/paths';

export const load = async ({params, fetch, cookies }) => {
	const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
	if (!token) {
		console.log('🔐 No auth token found, redirecting to login.');
        throw redirect(303, `${base}/login`);
    }
    try {
		const response = await api.get('/api/categories/', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // API may return a plain array or a paginated object ({ results: [...] })
        const categories = Array.isArray(response)
            ? response
            : Array.isArray(response?.results)
                ? response.results
                : [];
        return { categories };
    } catch (error) {
        console.error('❌ Error loading categories:', error);
        throw error;
    }
}

export const actions: Actions = {
	
	create: async ({ request, cookies, fetch }) => {
		const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
		if (!token) {
			console.log('🔐 No auth token found, redirecting to login.');
			throw redirect(303, `${base}/login`);
		}
        try {
			const data = await request.formData();
			const name = data.get('category_name') as string;
			const description = data.get('category_description') as string;
            const imageFile = data.get('image') as File | null;
            const isActive = data.get('is_active') === 'on' ? true : false;

			// Validate required fields
			if (!name || name.trim() === '') {
				return fail(400, {
					error: 'Category name is required',
					name,
                    description,
                    isActive
				});
			}

			// Create FormData for multipart request
			const formData = new FormData();
			formData.append('name', name);
            formData.append('description', description);
            formData.append('is_active', String(isActive));
			if (imageFile && imageFile.size > 0) {
				formData.append('featured_image', imageFile);
			}
			
			console.log('📤 Sending request to:', `${PUBLIC_API_BASE_URL}/api/categories/`);
			
			// Send to API
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/categories/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token || ''}`
				},
				body: formData
			});

			console.log('📥 API Response Status:', response.status);
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ API Error Response:', errorText);
				try {
					const errorData = JSON.parse(errorText);
					return fail(response.status, {
						error: errorData.message || 'Failed to create category',
						details: errorData
					});
				} catch {
					return fail(response.status, {
						error: 'Failed to create category',
						details: errorText
					});
				}
			}

			const result = await response.json();
			return {
				success: true,
				message: 'Category created successfully',
				category: result
			};
		} catch (error) {
			console.error('Create category error:', error);
			return fail(500, {
				error: 'An unexpected error occurred',
				details: error instanceof Error ? error.message : String(error)
			});
		}
	},

	update: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
		if (!token) {
			console.log('🔐 No auth token found, redirecting to login.');
			throw redirect(303, `${base}/login`);
		}
		try {
			const data = await request.formData();
			const id = data.get('category_id');
			const name = data.get('category_name') as string;
			const description = data.get('category_description') as string;
            const imageFile = data.get('image') as File | null;
            const isActive = data.get('is_active') === 'on' ? true : false;
			// Validate required fields
			if (!name || name.trim() === '') {
				return fail(400, {
					error: 'Category name is required'
				});
			}

			// Create FormData for multipart request
			const formData = new FormData();
			formData.append('name', name);
			formData.append('description', description);
			formData.append('is_active', String(isActive));
			if (imageFile && imageFile.size > 0) {
				formData.append('featured_image', imageFile);
			}
			// Send to API
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/categories/${id}/`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});
			if (!response.ok) {
				const errorData = await response.json();
				return fail(response.status, {
					error: errorData.message || 'Failed to update category'
				});
			}

			const result = await response.json();
			return {
				success: true,
				message: 'Category updated successfully',
				category: result
			};
		} catch (error) {
			console.error('Update category error:', error);
			return fail(500, {
				error: 'An unexpected error occurred'
			});
		}
	},

	delete: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
		console.log('🔐 Checking for auth token:', token ? 'Found' : '');
		if (!token) {
			console.log('🔐 No auth token found, redirecting to login.');
			throw redirect(303, `${base}/login`);
		}
		try {
			const data = await request.formData();
			const id = data.get('category_id') as string;

			// Validate required fields
			if (!id) {
				return fail(400, {
					error: 'Category ID is required'
				});
			}

			// Send to API
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/categories/${id}/`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return fail(response.status, {
					error: errorData.message || 'Failed to delete category'
				});
			}

			return {
				success: true,
				message: 'Category deleted successfully'
			};
		} catch (error) {
			console.error('Delete category error:', error);
			return fail(500, {
				error: 'An unexpected error occurred'
			});
		}
	},

	toggleStatus: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
		if (!token) {
			console.log('🔐 No auth token found, redirecting to login.');
			throw redirect(303, `${base}/login`);
		}

		try {
			const data = await request.formData();
			const id = data.get('category_id') as string;
			const isActive = data.get('is_active') === 'true';

			// Validate required fields
			if (!id) {
				return fail(400, {
					error: 'Category ID is required'
				});
			}

			// Create FormData for PATCH request
			const formData = new FormData();
			formData.append('is_active', String(!isActive));

			// Send to API
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/categories/${id}/`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json();
				return fail(response.status, {
					error: errorData.message || 'Failed to update category status'
				});
			}

			const result = await response.json();
			return {
				success: true,
				message: `Category ${!isActive ? 'activated' : 'deactivated'} successfully`,
				category: result
			};
		} catch (error) {
			console.error('Toggle status error:', error);
			return fail(500, {
				error: 'An unexpected error occurred'
			});
		}
	}
};

