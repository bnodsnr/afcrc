import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { tourStepAction } from '$lib/admin/server/tourStep';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const token = cookies.get('adm_access_token') || '';

	let categories: any[] = [];
	try {
		const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/categories/`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		if (res.ok) {
			const json = await res.json();
			categories = json.data?.results ?? json.data ?? [];
		}
	} catch {
		categories = [];
	}

	return {
		token,
		categories
	};
};

export const actions: Actions = {
	default: ({ request, cookies }) =>
		tourStepAction(request, cookies.get('adm_access_token') || '', { allowCreate: true })
};
