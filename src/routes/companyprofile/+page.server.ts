import type { PageServerLoad } from './$types';
import { createApi } from '$lib/api';
import { DIRECTION_PARENT } from '$lib/utils/direction';

export const load: PageServerLoad = async ({ fetch }) => {
	const api = createApi(fetch);

	// Fetched independently: a categories outage must not blank out the services section.
	// Mission / vision / objectives live under one `our-direction` parent row (the
	// heading/lead are its body, the three cards are its children), so a single
	// call replaces three per-card lookups that matched no slug in the admin.
	const [
		categories,
		services,
		chairmanMessage,
		companyProfile,
		companyStory,
		storyWidget,
		direction,
		objectives
	] = await Promise.allSettled([
		api.categories.getCategories(),
		api.services.getServices(),
		api.components.getComponentByParentId('chairman-message'),
		api.components.getComponentByParentId('company-profile'),
		api.components.getComponentByParentId('company-story'),
		api.components.getComponentByParentId('our-story'),
		api.components.getComponentByParentId(DIRECTION_PARENT),
		api.components.getComponentByParentId('our-objective')
	]);
	console.log('company profile load', {
		objectives
	});
	if (categories.status === 'rejected') {
		console.error('Error loading company profile categories:', categories.reason);
	}
	if (services.status === 'rejected') {
		console.error('Error loading company profile services:', services.reason);
	}
	if (chairmanMessage.status === 'rejected') {
		console.error('Error loading chairman message:', chairmanMessage.reason);
	}
	if (companyProfile.status === 'rejected') {
		console.error('Error loading company profile copy:', companyProfile.reason);
	}
	if (companyStory.status === 'rejected') {
		console.error('Error loading company story:', companyStory.reason);
	}
	if (storyWidget.status === 'rejected') {
		console.error('Error loading story widget:', storyWidget.reason);
	}
	if (direction.status === 'rejected') {
		console.error('Error loading mission / vision / objectives:', direction.reason);
	}
	if (objectives.status === 'rejected') {
		console.error('Error loading objectives:', objectives.reason);
	}

	return {
		categories: categories.status === 'fulfilled' ? (categories.value ?? []) : [],
		services: services.status === 'fulfilled' ? (services.value ?? []) : [],
		chairmanMessage: chairmanMessage.status === 'fulfilled' ? chairmanMessage.value : null,
		companyProfile: companyProfile.status === 'fulfilled' ? companyProfile.value : null,
		companyStory: companyStory.status === 'fulfilled' ? companyStory.value : null,
		storyWidget: storyWidget.status === 'fulfilled' ? storyWidget.value : null,
		direction: direction.status === 'fulfilled' ? direction.value : null,
		objectives: objectives.status === 'fulfilled' ? objectives.value : null
	};
};
