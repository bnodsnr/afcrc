import type { PageServerLoad } from './$types';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ fetch }) => {
	const api = createApi(fetch);

	// Resolved in parallel on the server so the HTML ships with data already inlined.
	const [
		heroBanners,
		categories,
		productWidgets,
		premiummeat,
		agroProducts,
		herbalProducts,
		beverages,
		limitBlogs,
		settings,
		testimonials,
		pageComponents,
		faqs,
		ourProcess,
		aboutUs,
		premiumMeatInfo,
		agroInfo,
		herbalInfo,
		beverageInfo,
		companystat
	] = await Promise.all([
		api.heroBanners.getHeroBanners(),
		api.categories.getCategories(),
		api.products.getProductWidgetsByCategory(),
		api.products.getPremiumMeat(),
		api.products.getAgroProducts(),
		api.products.getHerbalProducts(),
		api.products.getBeverages(),
		api.blogs.getLimitBlogs(),
		api.settings.getSettings(),
		api.testimonials.getTestimonials(),
		api.pages.getPageComponents('introduction'),
		api.faqs.getFaqs(),
		api.components.getComponentsByParentId('our-process'),
		api.components.getComponentsByParentId('about-us'),
		api.components.getComponentByParentId('premium-meat-info'),
		api.components.getComponentByParentId('agro-info'),
		api.components.getComponentByParentId('herbal-info'),
		api.components.getComponentByParentId('beverages-info'),
		api.keyStats.getCompanyStats()
	]);
	return {
		heroBanners: heroBanners ?? [],
		categories: categories ?? [],
		productWidgets: productWidgets ?? [],
		premiummeat: premiummeat ?? [],
		agroProducts: agroProducts ?? [],
		herbalProducts: herbalProducts ?? [],
		beverages: beverages ?? [],
		limitBlogs: limitBlogs ?? [],
		settings: settings ?? {},
		testimonials: testimonials ?? [],
		pageComponents: pageComponents ?? [],
		faqs: faqs ?? [],
		ourProcess: ourProcess ?? [],
		aboutUs: aboutUs ?? [],
		premiumMeatInfo:premiumMeatInfo??[],
		agroInfo:agroInfo??[],
		herbalInfo:herbalInfo??[],
		beverageInfo:beverageInfo??[],
		companystat:companystat??[],
	};
};
