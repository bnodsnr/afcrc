import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ cookies, fetch, url }) => {
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

	const page = url.searchParams.get('page') || '1';

	try {
		// Fetch products API with gallery data
		const productResponse = await fetch(
			`${PUBLIC_API_BASE_URL}/api/products/list-paginated?page=${page}`,
			{
				method: 'GET',
				headers
			}
		);

		// Handle product fetch failure
		if (!productResponse.ok) {
			console.error(
				'❌ Products API Error:',
				productResponse.status,
				await productResponse.text()
			);

			throw error(productResponse.status, 'Failed to load products');
		}

		// Parse JSON
		const productsData = await productResponse.json();

		return {
			products: productsData.results ?? [],
			productCount: productsData.count ?? 0,
			nextUrl: productsData.next ?? '',
			previousUrl: productsData.previous ?? '',
			apiToken: token,
			currentPage: parseInt(page),
			error: null
		};
	} catch (err) {
		console.error('❌ Load Error:', err);

		throw error(500, 'Failed to load gallery');
	}
};
