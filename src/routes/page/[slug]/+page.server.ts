import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		// Create API client with SvelteKit's fetch
		const api = createApi(fetch);

		// Fetch page components by slug
		const [pageDetails, settingsData] = await Promise.all([
			api.pages.getPageComponentsBySlug(params.slug),
			api.settings.getSettings()
		]);

		if (!pageDetails) {
			throw error(404, `Component not found:`);
		}

		// Optional: Verify SEO slug matches for URL consistency

		return {
			pageDetails: pageDetails,
			settingsData: settingsData
		};
	} catch (e: any) {
		console.error('[+page.server.ts] Error loading page data:', e);
		if (e.status === 404) {
			throw e;
		}
		throw error(500, 'Failed to load category');
	}
};
