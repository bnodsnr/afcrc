import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createApi } from '$lib/api';
import { DIRECTION_PARENT, OBJECTIVES_SLUG } from '$lib/utils/direction';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Create API client with SvelteKit's fetch
		const api = createApi(fetch);

		// `direction` is the `our-direction` row that carries the section header and
		// the mission / vision cards. `objectives` is authored as its own row, so
		// it is fetched separately.
		const [aboutUs, ourProcess, whyAfcrc, chairmanMessage, direction, objectives] =
			await Promise.all([
				api.components.getComponentByParentId('about-us'),
				api.components.getComponentByParentId('our-process'),
				api.components.getComponentByParentId('why-afcrc'),
				api.components.getComponentByParentId('chairman-message'),
				// Optional: the MVO block falls back to built-in copy when missing,
				// so an empty result must not take the whole page down.
				api.components.getComponentByParentId(DIRECTION_PARENT).catch(() => null),
				api.components.getComponentByParentId(OBJECTIVES_SLUG).catch(() => null)
			]);
		return {
			aboutUs: aboutUs,
			ourProcess: ourProcess,
			whyAfcrc,
			chairmanMessage,
			direction,
			objectives
		};
	} catch (e: unknown) {
		console.error('[+page.server.ts] Error loading data:', e);
		const status = (e as { status?: number })?.status;
		if (status === 404) {
			throw e;
		}
		throw error(500, 'Failed to load category');
	}
};
