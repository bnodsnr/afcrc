import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { seo_slug, slug } = params;

	if (!slug) {
		throw error(404, 'Category slug is required');
	}

	try {
		const api = createApi(fetch);
		const categoryData = await api.categories.getCategoryBySlug(slug);

		if (!categoryData) {
			throw error(404, `Category not found: ${slug}`);
		}

		const [products, subcategories, categories] = await Promise.all([
			api.products.getAllProducts().catch(() => []),
			api.products.getAllSubCategories().catch(() => []),
			api.categories.getCategories().catch(() => [])
		]);

		return {
			category: categoryData,
			products: products || [],
			subcategories: subcategories || [],
			categories: categories || [],
			seo_slug,
			slug
		};
	} catch (e: any) {
		console.error('[+page.server.ts] Error loading category data:', e);
		if (e.status === 404) {
			throw e;
		}
		throw error(500, 'Failed to load category');
	}
};
