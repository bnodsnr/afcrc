import type { PageServerLoad } from './$types';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const api = createApi(fetch);
		const [agroProducts, agroSubcategories] = await Promise.all([
			api.agroProducts.getAgroProducts(100),
			api.agroProducts.getSubcategoriesByCategory('agro-products')
		]);
		return {
			agroProducts: agroProducts || [],
			subcategories: agroSubcategories || []
		};
	} catch (error) {
		console.error('Error loading agro products page:', error);
		return {
			agroProducts: [],
			subcategories: []
		};
	}
};
