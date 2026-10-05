import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Create API client with SvelteKit's fetch
		const api = createApi(fetch);

		const [blogsData, settingsData] = await Promise.all([
			api.blogs.getBlogs(),
			api.settings.getSettings()
		]);

		if (!blogsData) {
			throw error(404, `Category not found:`);
		}

		// Optional: Verify SEO slug matches for URL consistency

		return {
			blogsData: blogsData,
			settingsData: settingsData
		};
	} catch (e: any) {
		console.error('[+page.server.ts] Error loading category data:', e);
		if (e.status === 404) {
			throw e;
		}
		throw error(500, 'Failed to load category');
	}
};
