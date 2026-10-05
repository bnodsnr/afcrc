import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies, fetch, url }) => {
	const token = cookies.get('adm_access_token') || '';
	const page = url.searchParams.get('page') || '1';
	const status = url.searchParams.get('status') || '';

	let bookings: any[] = [];
	let pagination: { count: number; page: number; page_size: number } = { count: 0, page: 1, page_size: 10 };

	try {
		const query = new URLSearchParams({ page });
		if (status) query.set('status', status);
		const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/bookings/?${query}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		
		if (res.ok) {
			const json = await res.json();
			bookings = json.data?.results ?? [];
			console.log(bookings);
			pagination = {
				count: json.data?.count ?? bookings.length,
				page: parseInt(page, 10),
				page_size: json.data?.results?.length ?? 10
			};
		}
	} catch {
		bookings = [];
	}

	return { token, bookings, pagination, status };
};

export const actions: Actions = {
	cancel: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) return fail(401, { error: 'Unauthorized' });

		const fd = await request.formData();
		const id = (fd.get('id') as string) || '';
		if (!id) return fail(400, { error: 'Missing booking id' });

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/bookings/${id}/cancel/`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				return fail(res.status, { error: json.message || 'Failed to cancel booking.' });
			}
			return { success: true, message: json.message || 'Booking cancelled successfully.' };
		} catch (err: unknown) {
			return fail(500, { error: err instanceof Error ? err.message : 'Cancel failed.' });
		}
	},

	confirm: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) return fail(401, { error: 'Unauthorized' });

		const fd = await request.formData();
		const id = (fd.get('id') as string) || '';
		if (!id) return fail(400, { error: 'Missing booking id' });

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/bookings/${id}/confirm/`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				return fail(res.status, { error: json.message || 'Failed to confirm booking.' });
			}
			return { success: true, message: json.message || 'Booking confirmed successfully.' };
		} catch (err: unknown) {
			return fail(500, { error: err instanceof Error ? err.message : 'Confirm failed.' });
		}
	}
};
