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
        const productResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/products/${productId}/`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });
        if(!productResponse.ok) {
            const errorText = await productResponse.text();
            console.error(`Failed to fetch product ${productId}:`, errorText);
            throw error(productResponse.status, 'Failed to load product');
        }
        const productData = await productResponse.json();
        // console.log('✅ Product data fetched successfully:', productData);
        return { 
            product: productData,
            variations: productData.variations || [] 
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

function parseProductFormData(formData: FormData) {
	const product = {
		
		variations: (() => {
			const names      = formData.getAll('variation_name[]')     as string[];
			const weights    = formData.getAll('variation_weight[]')   as string[];
			const prices     = formData.getAll('variation_price[]')    as string[];
			const quantities = formData.getAll('variation_quantity[]') as string[];
			const statuses   = formData.getAll('variations_status[]')  as string[];
			const colors     = formData.getAll('color[]')              as string[];
			

			// Each slot is either a real File (new upload) or an empty Blob/string
			// (placeholder we appended in handleSubmit to keep indices aligned)
			const imageFiles = formData.getAll('variation_image[]') as (File | Blob | string)[];
            
			return names.map((name, i) => {
				const raw     = imageFiles[i];
				const hasFile = raw instanceof File && raw.size > 0;

				return {
					name,
					weight:   weights[i]    ?? '',
					price:    prices[i]     ?? '',
					quantity: quantities[i] ?? '',
					status:   statuses[i]   ?? 'active',
					color:    colors[i]     ?? '',
					image: {
						file:     hasFile ? (raw as File) : null,
					},
				};
			});
		})(),
	};

	return product;
}


export const actions: Actions = {
    saveVariations: async ({ params, request, cookies, fetch }) => {
        const token = cookies.get('adm_access_token') || '';
        if (!token) throw error(401, 'Unauthorized');

        try {
            const productId = Number(params.id);
            const formData = await request.formData();

            const ids        = formData.getAll('variation_id[]');
            const names      = formData.getAll('variation_name[]');
            const weights    = formData.getAll('variation_weight[]');
            const prices     = formData.getAll('variation_price[]');
            const regPrices  = formData.getAll('variation_regular_price[]');
            const salePrices = formData.getAll('variation_sales_price[]');
            const quantities = formData.getAll('variation_quantity[]');
            const statuses   = formData.getAll('variations_status[]');
            const colors     = formData.getAll('color[]');

            // Sparse image entries + their exact variation indices
            const imageFiles   = formData.getAll('variation_image[]');
            const imageIndices = formData.getAll('variation_image_index[]').map(Number);

            // Build a map: variationIndex → File
            const imageMap = new Map<number, File>();
            imageIndices.forEach((varIdx, fileIdx) => {
                const file = imageFiles[fileIdx];
                if (file instanceof File && file.size > 0) {
                    imageMap.set(varIdx, file);
                }
            });

            // Build variations metadata
            const variations = names.map((name, i) => ({
                id:             ids[i] ? Number(ids[i]) : null,
                name:           String(name ?? ''),
                weight:         parseFloat(String(weights[i]))    || 0,
                price:          parseFloat(String(prices[i]))     || 0,
                regular_price:  parseFloat(String(regPrices[i]))  || 0,
                sales_price:    parseFloat(String(salePrices[i])) || 0,
                stock_quantity: parseInt(String(quantities[i]))   || 0,
                status:         String(statuses[i] ?? 'active'),
                color:          String(colors[i] ?? ''),
                has_new_image:  imageMap.has(i)  // ← exact flag per variation
            }));

            // Build API FormData
            const apiFormData = new FormData();
            apiFormData.append('variations', JSON.stringify(variations));

            // Attach files with their exact variation index as the key
            for (const [varIdx, file] of imageMap.entries()) {
                apiFormData.append(`variation_image_${varIdx}`, file, file.name);
            }
            console.log('Prepared FormData for API:', apiFormData);
            const response = await fetch(
                `${PUBLIC_API_BASE_URL}/api/products/${productId}/variations/`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: apiFormData,
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Failed to save variations:', errorText);
                throw error(response.status, 'Failed to save variations');
            }

            return { success: true, message: 'Variations saved successfully' };

        } catch (err) {
            console.error('❌ Error saving variations:', err);
            if (err && typeof err === 'object' && 'status' in err) throw err;
            throw error(500, 'Failed to save variations');
        }
    },
    deleteVariation: async ({ params, request, cookies, fetch }) => {
        const token = cookies.get('adm_access_token') || '';

        if (!token) {
            return fail(401, {
                success: false,
                message: 'Unauthorized'
            });
        }

        try {
            const productId = Number(params.id);
            if (isNaN(productId)) {
                return fail(400, {
                    success: false,
                    message: 'Invalid product ID.'
                });
            }

            const formData = await request.formData();
            const variationId = formData.get('variation_id');

            if (!variationId) {
                return fail(400, {
                    success: false,
                    message: 'Variation ID is required.'
                });
            }

            const response = await fetch(
                `${PUBLIC_API_BASE_URL}/api/products/${productId}/delete-variation/`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ variation_id: String(variationId) })
                }
            );

            if (!response.ok) {
                let message = 'Failed to delete variation';

                try {
                    const data = await response.json();
                    message = data.message || data.error || message;
                } catch {
                    // Ignore JSON parsing errors
                }

                return fail(response.status, {
                    success: false,
                    message
                });
            }

            return {
                success: true,
                message: 'Variation deleted successfully.'
            };
        } catch (err) {
            console.error('❌ Error deleting variation:', err);

            return fail(500, {
                success: false,
                message: err instanceof Error ? err.message : 'Something went wrong.'
            });
        }
    }
};