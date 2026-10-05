import type { PageServerLoad } from './$types';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const api = createApi(fetch);
		const [products, subcategories] = await Promise.all([
			api.products.getAllProducts(),
			api.products.getAllSubCategories()
		]);
		return {
			products: products || [],
			subcategories: subcategories || []
		};
	} catch (error) {
		console.error('Error loading products:', error);
		return {
			products: [],
			subcategories: []
		};
	}
};
