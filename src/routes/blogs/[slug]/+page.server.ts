import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const slug = params.slug;

		// Create API client with SvelteKit's fetch
		const api = createApi(fetch);

		// Fetch category by unique slug
		const [blogsData, settingsData] = await Promise.all([
			api.blogs.getBlogBySlug(slug),
			api.settings.getSettings()
		]);

		if (!blogsData) {
			throw error(404, `blog not found:`);
		}

		// Optional: Verify SEO slug matches for URL consistency

		return {
			blogsData: blogsData,
			settingsData: settingsData
		};
	} catch (e: any) {
		console.error('[+page.server.ts] Error loading blog data:', e);
		if (e.status === 404) {
			throw e;
		}
		throw error(500, 'Failed to load category');
	}
};
