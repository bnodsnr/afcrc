import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const token = cookies.get('adm_access_token') || '';

	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};

	try {
		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/products/list-paginated`, {
			method: 'GET',
			headers,
			credentials: 'include'
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Failed to fetch products:', errorText);
			throw error(response.status, 'Failed to load products');
		}

		const data = await response.json();
		console.log('✅ Products fetched successfully');

		// Flatten variations from all products
		const allVariations = (data.results || []).flatMap((product: any) => 
			(product.variations || []).map((variation: any) => ({
				...variation,
				productId: product.id,
				productName: product.name
			}))
		);

		return {
			products: data.results || [],
			variations: allVariations,
			apiToken: token
		};
	} catch (err) {
		console.error('❌ Error loading variations:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load variations');
	}
};
