import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const slug = params.slug;
		const api = createApi(fetch);

		const [service, settingsData] = await Promise.all([
			api.services.getServiceBySlug(slug),
			api.settings.getSettings()
		]);

		if (!service) {
			throw error(404, `Service not found`);
		}

		return {
			service: service,
			settingsData: settingsData
		};
	} catch (e: any) {
		console.error('[+page.server.ts] Error loading service data:', e);
		if (e.status === 404) {
			throw e;
		}
		throw error(500, 'Failed to load service');
	}
};
