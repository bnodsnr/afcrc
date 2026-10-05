import { fail, redirect } from '@sveltejs/kit';
import { api } from '$lib/admin/api/client';
import type { Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { form } from '$app/server';
import { base } from '$lib/admin/paths';


export const load = async ({ cookies }) => {
    const token = cookies.get('adm_access_token') || '';
    if (!token) {
        throw redirect(303, `${base}/login`);
    }
    try {
        const response = await api.get('/api/categories/', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const subcategoriesResponse = await api.get('/api/subcategories/', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // Handles every shape the backend returns:
        // - plain array
        // - paginated object ({ results: [...] }) e.g. GET /api/categories/
        // - custom envelope ({ data: [...] })     e.g. GET /api/subcategories/
        const normalizeList = (res: any) =>
            Array.isArray(res)
                ? res
                : Array.isArray(res?.results)
                    ? res.results
                    : Array.isArray(res?.data)
                        ? res.data
                        : [];

        const categories = normalizeList(response);
        const subcategories = normalizeList(subcategoriesResponse);

        const serializedCategories = categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name
        }));

        return { categories: serializedCategories, subcategories };
    } catch (error: any) {
        console.error('❌ Error loading categories:', error?.message || error);
        console.error('Error details:', error?.response?.status, error?.response?.data);
        // Return empty array on error instead of crashing
        return { categories: [], subcategories: [] };
    }
}

export const actions: Actions = {
    create: async ({ request, cookies }) => {
        try {
            
            const authToken = cookies.get('adm_access_token');
            console.log('🔐 Auth Token:', authToken ? 'Present' : 'Missing');
            const data = await request.formData();
            const name = data.get('name') as string;
            console.log('Create action - name:', name);
            const mainCategoryId = data.get('mainCategoryId') as string;
            const description = data.get('description') as string;
            const imageFile = data.get('image') as File | null;
            const isActive = data.get('isActive') === 'true';
            // Create FormData for multipart request
            const formData = new FormData();
            formData.append('name', name);
            formData.append('category_id', mainCategoryId);
            formData.append('description', description);
            formData.append('is_active', String(isActive));
            if (imageFile && imageFile.size > 0) {
                formData.append('featured_image', imageFile);
            }
            console.log('Create action image file:', formData);
            
            // Send to API
            // NOTE: api.post resolves with parsed JSON ({ success, message, data }) — not a Response
            const apiUrl = `/api/subcategories/`;
            const result = await api.post(apiUrl, formData, {
                headers: {
                    Authorization: `Bearer ${authToken || ''}`
                }
            });

            if (!result?.success) {
                return fail(400, {
                    error: result?.message || 'Failed to create subcategory',
                    details: result?.errors || null
                });
            }

            return {
                success: true,
                message: result.message || 'Subcategory created successfully',
                subcategory: result.data
            };
            
        } catch (error) {
            return fail(500, {
                error: 'An unexpected error occurred',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    },

    update: async ({ request, cookies, url }) => {
        const token = cookies.get('adm_access_token') || '';
        if (!token) {
            throw redirect(303, `${base}/login`);
        }
        try {
            const id = url.searchParams.get('id');
            const data = await request.formData();
            const name = data.get('name') as string;
            const mainCategoryId = data.get('mainCategoryId') as string;
            const description = data.get('description') as string;
            const imageFile = data.get('image') as File | null;
            const isActive = data.get('isActive') === 'true';

            if (!id) {
                return fail(400, { error: 'Subcategory ID is missing' });
            }

            if (!name || name.trim() === '') {
                return fail(400, { error: 'Subcategory name is required' });
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('category_id', mainCategoryId);
            formData.append('description', description);
            formData.append('is_active', String(isActive));
            if (imageFile && imageFile.size > 0) {
                formData.append('featured_image', imageFile);
            }

            const response = await fetch(`${PUBLIC_API_BASE_URL}/api/subcategories/${id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                return fail(response.status, {
                    error: errorData.message || errorData.detail || 'Failed to update subcategory'
                });
            }

            const result = await response.json();
            return {
                success: true,
                message: 'Subcategory updated successfully',
                subcategory: result
            };
        } catch (error) {
            console.error('Update subcategory error:', error);
            return fail(500, {
                error: 'An unexpected error occurred'
            });
        }
    },

    delete: async ({ request, cookies }) => {
        const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
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
            const response = await fetch(`${PUBLIC_API_BASE_URL}/api/subcategories/${id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token || ''}`
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
            const response = await fetch(`${PUBLIC_API_BASE_URL}/api/subcategories/${id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token || ''}`
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