import type { PageServerLoad } from './$types';
import { createApi } from '$lib/api';
import type { CategoryData } from '$lib/api/types';

const MAX_PAGES = 20;

export const load: PageServerLoad = async ({ params, fetch }) => {
	const api = createApi(fetch);
	const slug = params.slug;
	const bannerMap: Record<string, string> = {
		'agro-products': 'agro',
		'herbal-products': 'herbal',
		'premium-meat': 'meat',
		'beverage-products': 'beverage'
	};

	const bannerslug = bannerMap[slug] ?? 'beverage-products';

	try {
		const [categories, banners] = await Promise.all([
			api.categories.getCategories(),
			api.banners.getBannerPlacement(bannerslug)
		]);

		const categoryList = categories || [];

		// Route slug may be the unique slug, an seo_slug or a dasherized name
		let category: CategoryData | null = await api.categories.getCategoryBySlug(slug);
		if (!category) {
			const needle = slug.toLowerCase();
			const match = categoryList.find(
				(c) =>
					c.seo_slug?.toLowerCase() === needle ||
					c.slug?.toLowerCase() === needle ||
					c.name?.toLowerCase().replace(/\s+/g, '-') === needle
			);
			if (match) category = await api.categories.getCategoryBySlug(match.slug);
		}

		if (!category) {
			return { category: null, categories: categoryList, products: [], banners };
		}

		const products: any[] = [];
		for (let page = 1; page <= MAX_PAGES; page++) {
			const res = await api.categories.getCategoryCatalog(category.slug, page);
			const batch: any[] = res?.products ?? [];
			products.push(...batch);
			if (!res?.pagination?.has_next || batch.length === 0) break;
		}

		return { category, categories: categoryList, products, banners };
	} catch (error) {
		return { category: null, categories: [], products: [], banners: [] };
	}
};
