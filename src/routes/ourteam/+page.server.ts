import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const api = createApi(fetch);
		const teams = await api.teams.getTeams();
		return {
			teams: teams ?? []
		};
	} catch (e) {
		throw error(500, 'Failed to load teams');
	}
};
