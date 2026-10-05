import type { PageServerLoad } from './$types';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const api = createApi(fetch);
		const [categories, products, subcategories] = await Promise.all([
			api.categories.getCategories(),
			api.products.getAllProducts(),
			api.products.getAllSubCategories()
		]);
		return {
			categories: categories || [],
			products: products || [],
			subcategories: subcategories || []
		};
	} catch (error) {
		console.error('Error loading categories page:', error);
		return {
			categories: [],
			products: [],
			subcategories: []
		};
	}
};
