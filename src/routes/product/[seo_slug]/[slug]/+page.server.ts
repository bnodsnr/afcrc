import type { PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createApi } from '$lib/api';
import { getAccessTokenFromCookieStore } from '$lib/utils/protected-route';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { seo_slug, slug } = params;

	if (!slug) {
		throw error(404, 'Product slug is required');
	}

	try {
		const api = createApi(fetch);
		const productData = await api.products.getProductBySlug(slug);
		const relatedProducts = await api.products.getRelatedProducts(slug);

		if (!productData) {
			throw error(404, `Product not found: ${slug}`);
		}

		return {
			product: productData,
			relatedProducts,
			seo_slug,
			slug
		};
	} catch (e: any) {
		if (e.status === 404) {
			throw e;
		}
		throw error(500, 'Failed to load product');
	}
};

export const actions: Actions = {
	addToCart: async ({ request, fetch, cookies }) => {
		const formData = await request.formData();
		const product_id = Number(formData.get('product_id'));
		const quantity = Number(formData.get('quantity')) || 1;
		const color = (formData.get('color') as string) || undefined;
		const size = (formData.get('size') as string) || undefined;

		if (!product_id) {
			return fail(400, { cartError: 'Invalid product' });
		}

		if (quantity < 1 || quantity > 99) {
			return fail(400, { cartError: 'Quantity must be between 1 and 99' });
		}

		const authToken = getAccessTokenFromCookieStore(cookies);
		const API_BASE_URL = PUBLIC_BASE_URL || 'http://localhost:9000';

		try {
			const response = await fetch(`${API_BASE_URL}/api/cart/add/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
				},
				body: JSON.stringify({ product_id, quantity, color, size })
			});

			if (!response.ok) {
				const err = await response.json().catch(() => null);
				return fail(response.status, {
					cartError: err?.error || err?.detail || 'Failed to add product to cart'
				});
			}

			const result = await response.json();
			if (result?.success && result?.cart) {
				const items = result.cart.items || [];
				return {
					cartSuccess: true,
					cartMessage: 'Product added to cart',
					cart: {
						items: items.map((item: any) => ({
							cart_item_id: item.cart_item_id,
							id: item.product?.id || item.id,
							name: item.product?.name || 'Product',
							slug: item.product?.slug || '',
							seo_slug: item.product?.seo_slug || '',
							image: item.product?.image || item.product?.images?.[0]?.image || '',
							price: parseFloat(
								item.price ?? item.product?.sale_price ?? item.product?.regular_price ?? '0'
							),
							quantity: item.quantity,
							sku: item.product?.sku,
							stock_status: item.product?.stock_status,
							max_quantity: item.product?.max_quantity,
							color: item.color || undefined,
							size: item.size || undefined
						}))
					}
				};
			}

			return fail(400, { cartError: 'Unexpected server response' });
		} catch (err) {
			return fail(500, {
				cartError: err instanceof Error ? err.message : 'Failed to add product to cart'
			});
		}
	}
};
