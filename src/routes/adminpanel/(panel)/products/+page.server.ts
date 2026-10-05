import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
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
        // Fetch products API
        const productResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/products/list-paginated`, {
            method: 'GET',
            headers
        });

        // Handle product fetch failure
        if (!productResponse.ok) {
            console.error(
                '❌ Products API Error:',
                productResponse.status,
                await productResponse.text()
            );

            throw error(productResponse.status, 'Failed to load products');
        }
        const categoryResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/categories/`, {
            method: 'GET',
            headers
        });

        // Parse JSON
        const productsData = await productResponse.json();
        console.log(productsData);
        const categoriesData = await categoryResponse.json();
        return {
            products: productsData.results ?? [],
            productCount: productsData.count ?? 0,
            nextUrl: productsData.next ?? '',
            apiToken: token,
            categories: categoriesData ?? [],
            error: null
        };
    } catch (err) {
        console.error('❌ Load Error:', err);

        return {
            products: [],
            error: 'Something went wrong while loading data'
        };
    }
};
export const actions: Actions = {
    deleteProduct: async ({ request, cookies, fetch }) => {
        const token = cookies.get('adm_access_token');
        const formData = await request.formData();
        const productId = formData.get('product_id');
        console.log(productId);
        const headers = {
            'Content-Type': 'application/json',
            Authorization:`Bearer ${token}`
        }
        try {
            const deleteResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/products/${productId}/delete-product/`, {
                method: 'DELETE',
                headers,
            });
            if (!deleteResponse.ok) {
                return fail(400, {
                    error: 'Unable to delete product.'
                });
            }
            const deleteData = await deleteResponse.json();
            return {
                success: true,
                messae:"Product Deleted Successfully"
            }
        } catch(err) {

        }

		return {
			success: true
		};
	}
};