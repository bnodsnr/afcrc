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
		// Fetch both APIs in parallel
		const [catResponse, productResponse, vendorResponse] = await Promise.all([
			fetch(`${PUBLIC_API_BASE_URL}/api/categories/`, {
				method: 'GET',
				headers
			}),
			fetch(`${PUBLIC_API_BASE_URL}/api/products/`, {
				method: 'GET',
				headers
			}),
			fetch(`${PUBLIC_API_BASE_URL}/api/vendors/`, {
				method: 'GET',
				headers
			})
		]);

		// Handle category fetch failure
		if (!catResponse.ok) {
			

			throw error(catResponse.status, 'Failed to load categories');
		}

		// Handle product fetch failure
		if (!productResponse.ok) {
			
			throw error(productResponse.status, 'Failed to load products');
		}

		// Parse JSON in parallel
		const [categories, products, vendors] = await Promise.all([
			catResponse.json(),
			productResponse.json(),
			vendorResponse.json()
		]);

		console.log('product categorys', categories);

		return {
			categories: categories ?? [],
			products: products ?? [],
			vendors: vendors ?? [],
			token: token ?? '',
			error: null
		};
	} catch (err) {
		console.error(' Load Error:', err);

		return {
			categories: [],
			products: [],
			vendors: [],
			token: '',
			error: 'Something went wrong while loading data'
		};
	}
};

function parseProductFormData(formData: FormData) {
	const product = {
		name:             formData.get('name')          as string,
		vendor:           formData.get('vendor')        as string,
		category:         formData.get('category')      as string,
		subCategory:      formData.get('subCategory')   as string,
		regular_price:    formData.get('regular_price') as string,
		sales_price:      formData.get('sales_price')   as string,
		price_unit:       (formData.get('price_unit') as string) || 'per_kg',
		weight:           formData.get('weight') as string,
		shortDescription: formData.get('shortDescription') as string,
		description:      formData.get('description')   as string,
		status:           formData.get('status')        as string,
		visibility: formData.get('visibility') as string,
		sizes: formData.get('sizes') as string,
		size_category: formData.get('size_category') as string || 'general',
		featured: formData.get('featured') === 'on',
		product_type: formData.get('productType') as string,

		inventory: {
			manageStock: formData.get('manage_stock') === 'on',
			stock_quantity: formData.get('stockQuantity') as string,
			low_stock_threshold: formData.get('lowStockThreshold') as string,
			stock_status: formData.get('stockStatus') as string,
			allow_backorders: formData.get('allowBackorders') as string,
		},
		

		mainImage: formData.get('mainImage') as File | null,

		seo: {
			meta_title:   formData.get('meta_title')   as string,
			meta_desc:    formData.get('meta_desc')     as string,
			canonicalUrl: formData.get('canonicalUrl') as string,
			keywords:     formData.get('keywords')     as string,
		},
		variations: (() => {
			const names      = formData.getAll('variation_name[]')     as string[];
			const weights    = formData.getAll('variation_weight[]')   as string[];
			const prices     = formData.getAll('variation_price[]')    as string[];
			const quantities = formData.getAll('variation_quantity[]') as string[];
			const statuses   = formData.getAll('variations_status[]')  as string[];
			const colors     = formData.getAll('color[]')              as string[];
			const imagePaths = formData.getAll('variation_image_path[]') as string[];
			const imageAlts  = formData.getAll('variation_image_alt[]')  as string[];

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
						path:     imagePaths[i] ?? '',   // existing server path (edit mode)
						alt_text: imageAlts[i]  ?? '',
					},
				};
			});
		})(),
	};
	return product;
}

export const actions: Actions = {
	fetchSubcategories: async ({ request, cookies }) => {
		try {
			const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';

			if (!token) {
				return fail(401, { message: 'Unauthorized - No token found' });
			}

			const formData = await request.formData();
			const categoryId = formData.get('categoryId');

			if (!categoryId) {
				return fail(400, { message: 'Category ID is required' });
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/categories/subcategories/${categoryId}/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include'
			});

			if (!response.ok) {
				console.error(' Failed to fetch subcategories:', await response.text());
				return fail(response.status, { message: 'Failed to load subcategories' });
			}

			const apiResponse = await response.json();
			// Extract the 'data' array from the API response structure
			const subcategoriesData = apiResponse.data || [];
			return {
				subcategories: subcategoriesData
			};
		} catch (error) {
			console.error(' Error fetching subcategories:', error);
			return fail(500, { message: 'An error occurred while fetching subcategories' });
		}
	},
	createProduct: async ({ request, cookies }) => {
		try {
			// Get token from httpOnly cookies
			const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
			if (!token) {
				return fail(401, { message: 'Unauthorized - No token found' });
			}
			const formData = await request.formData();
			const product = parseProductFormData(formData);
			console.log('Parsed product data:', product);
			// Strip mainImage and variation images out of the JSON payload — they're sent separately
			const { mainImage, variations, ...productWithoutImages } = product;
			const apiFormData = new FormData();
			
			// Clean variations by removing File objects from JSON
			// const variationsForJson = variations.map(({ image, ...rest }) => rest);
			const variationsForJson = variations.map(({ image, ...v }) => ({
				...v,
				image_path:    image.path     ?? '',
				image_alt:     image.alt_text ?? '',
			}));

			const productPayload = { ...productWithoutImages, variations: variationsForJson };
			
			apiFormData.append('product', JSON.stringify(productPayload));
			
			// Append main image if present
			if (mainImage instanceof File) {
				apiFormData.append('mainImage', mainImage, mainImage.name);
			}
			// Append variation images with unique keys
			variations.forEach((v, i) => {
				if (v.image.file instanceof File && v.image.file.size > 0) {
					apiFormData.append(`variation_image_${i}`, v.image.file, v.image.file.name);
				}
			});
			console.log('Submitting product data:', apiFormData);
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/products/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: apiFormData
			});
			const result = await response.json();
			if (!response.ok) {
				return fail(response.status, {
					message: result.error || result.message || 'Failed to create product'
				});
			}

			return {
				success: true,
				message: 'Product created successfully!',
				product: result.product,
				debug: result.debug
			};
		} catch (error: unknown) {
			if (error instanceof Error && error.message.includes('Redirect')) {
				throw error; // Re-throw SvelteKit redirects
			}
			return fail(500, {
				message: error instanceof Error ? error.message : 'An error occurred while creating the product'
			});
		}
	}
};
