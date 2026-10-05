import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ params, fetch, cookies }) => {
    const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
    
    // Redirect if not authenticated
    if (!token) {
        throw redirect(302, `${base}/login`);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
    
    try {
        const productId = Number(params.id);
        if (isNaN(productId)) {
            throw error(400, 'Invalid product ID');
        }

        // Fetch both product and categories in parallel
        const [productResponse] = await Promise.all([
            fetch(`${PUBLIC_API_BASE_URL}/api/products/${productId}/`, {
                method: 'GET',
                headers,
                credentials: 'include'
            }),
           
        ]);

        if (!productResponse.ok) {
            const errorText = await productResponse.text();
            console.error(`❌ Failed to fetch product ${productId}:`, errorText);
            throw error(productResponse.status, 'Failed to load product');
        }

        
        const [productData] = await Promise.all([
            productResponse.json()
        ]);

        let product = null;
        
        // Safely extract the product from common Django DRF response wrappers
        if (productData && typeof productData === 'object') {
            if (productData.data && typeof productData.data === 'object') {
                product = productData.data;
            } else if (productData.results && Array.isArray(productData.results) && productData.results[0]) {
                product = productData.results[0];
            } else if (!Array.isArray(productData)) {
                product = productData;
            }
        }

        if (!product) {
            throw error(404, 'Product details not found');
        }
        return {
            product
        };

    } catch (err) {
        console.error('❌ Error fetching product:', err);
        
        // If it's already a SvelteKit error instance thrown above, rethrow it directly
        if (err && typeof err === 'object' && 'status' in err) {
            throw err;
        }
        
        throw error(500, 'Failed to load product');
    }
};

export const actions: Actions = {
    uploadImage: async ({ request, fetch, cookies, params }) => {
        const formData = await request.formData();

        const image = formData.get('image') as File;
        const alt_text = formData.get('alt_text') as string;
        const color = formData.get('color') as string;

        if (!image || image.size === 0) {
            return fail(400, { error: 'No image provided' });
        }
        const productId = Number(params.id);
        if (isNaN(productId)) {
            return fail(400, { error: 'Invalid product ID' });
        }
        const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
        const apiForm = new FormData();
        apiForm.append('image', image);
        apiForm.append('alt_text', alt_text);
        apiForm.append('color', color);
        apiForm.append('product', productId);

        const response = await fetch(`${PUBLIC_API_BASE_URL}/api/product-images/`, {
            method: 'POST',
            body: apiForm,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('Upload response:', { status: response.status, data });
        if (!response.ok) {
            return fail(response.status, { error: data.detail || 'Upload failed' });
        }

        return {
            success: true,
            newData: {
                id: data.id,
                image: data.image,
                alt_text: data.alt_text || '',
                is_primary: data.is_primary,
                color: data.color || ''
            }
        };
    },
    
    deleteImage: async ({ request, fetch, cookies }) => {
        const formData = await request.formData();
        const imageId = formData.get('imageId') as string;

        if (!imageId) {
            return fail(400, { message: 'Image ID is required' });
        }

        const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
        
        const response = await fetch(`${PUBLIC_API_BASE_URL}/api/product-images/${imageId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return fail(response.status, { message: error.detail || 'Failed to delete image' });
        }

        return {
            success: true,
            message: 'Image deleted successfully'
        };
    }
};