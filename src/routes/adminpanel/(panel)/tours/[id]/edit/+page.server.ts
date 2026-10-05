import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { tourStepAction } from '$lib/admin/server/tourStep';

export const load: PageServerLoad = async ({ params, cookies, fetch }) => {
	const token = cookies.get('adm_access_token') || '';
	const tourId = Number(params.id);

	try {
		if (isNaN(tourId)) throw error(400, 'Invalid tour ID');

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

		const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/packages/${tourId}/`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		if (!res.ok) {
			const json = await res.json().catch(() => ({}));
			throw error(res.status, json.message || 'Failed to load tour');
		}

		const json = await res.json();
		const tour = json.data ?? json;
		if (!tour || typeof tour !== 'object' || Array.isArray(tour)) {
			throw error(404, 'Tour not found');
		}

		return { token, categories, tour };
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		throw error(500, 'Failed to load tour');
	}
};

export const actions: Actions = {
	default: ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) return fail(401, { error: 'Unauthorized' });
		return tourStepAction(request, token, { allowCreate: false });
	}
};
