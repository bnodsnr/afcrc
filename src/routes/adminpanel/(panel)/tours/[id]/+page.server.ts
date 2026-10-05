import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

const SECTION_FIELDS: Record<string, string[]> = {
	general: ['title', 'category', 'status', 'tour_type'],
	thumbnail: ['thumbnail'],
	description: ['short_description', 'description'],
	facts: [
		'currency', 'starting_price', 'discount_price',
		'duration_days', 'duration_nights',
		'starting_location', 'ending_location',
		'minimum_group_size', 'maximum_group_size', 'difficulty'
	],
	details: ['transportation', 'accommodation', 'meals'],
	seo: ['meta_title', 'meta_description', 'meta_keywords'],
	highlights: ['highlights'],
	includes: ['includes'],
	excludes: ['excludes'],
	gallery: ['gallery'],
	faq: ['faq'],
	itinerary: ['itineraries'],
	departures: ['departures']
};

const JSON_FIELDS = new Set([
	'highlights', 'includes', 'excludes', 'gallery', 'faq', 'itineraries', 'departures'
]);

function firstServerError(payload: any): string {
	const errors = payload?.errors;
	if (errors == null) return '';
	if (typeof errors === 'string') return errors;
	if (Array.isArray(errors)) {
		for (const item of errors) {
			const msg = firstServerError({ errors: item });
			if (msg) return msg;
		}
		return '';
	}
	const key = Object.keys(errors)[0];
	if (key === undefined) return '';
	const msg = firstServerError({ errors: errors[key] });
	return typeof msg === 'string' ? msg : '';
}

export const load: PageServerLoad = async ({ params, fetch, cookies }) => {
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

		return { tour, token, categories };
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		throw error(500, 'Failed to load tour');
	}
};

export const actions: Actions = {
	patch: async ({ request, params, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) return fail(401, { error: 'Unauthorized' });

		const tourId = Number(params.id);
		if (isNaN(tourId)) return fail(400, { error: 'Invalid tour ID' });

		const fd = await request.formData();
		const section = ((fd.get('section') as string) || '').trim();
		const fields = SECTION_FIELDS[section];
		if (!fields) return fail(400, { error: 'Unknown section.' });

		const form = new FormData();
		for (const name of fields) {
			const value = fd.get(name);
			if (value === null) continue;
			if (value instanceof File) {
				if (value.size > 0) form.append(name, value, value.name);
				continue;
			}
			const s = String(value).trim();
			if (JSON_FIELDS.has(name)) {
				if (s !== '') {
					try {
						JSON.parse(s);
					} catch {
						return fail(400, { error: `${name} must be valid JSON.` });
					}
					form.append(name, s);
				}
			} else {
				form.append(name, s);
			}
		}

		if ([...form.keys()].length === 0) {
			return fail(400, { error: 'Nothing to update.' });
		}

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/packages/${tourId}/`, {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
				body: form
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg =
					firstServerError(json) || json.message || json.error || 'Failed to update.';
				return fail(res.status, { error: msg, details: json });
			}
			return { success: true, message: 'Updated.' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to update.';
			return fail(500, { error: message });
		}
	}
};
