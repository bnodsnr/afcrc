import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies, fetch, url }) => {
	const token = cookies.get('adm_access_token') || '';
	const page = url.searchParams.get('page') || '1';

	let packages: any[] = [];
	let pagination: { count: number; page: number; page_size: number } = { count: 0, page: 1, page_size: 10 };

	try {
		const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/packages/?page=${page}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		if (res.ok) {
			const json = await res.json();
			packages = json.data?.results ?? [];
			pagination = {
				count: json.data?.count ?? packages.length,
				page: parseInt(page, 10),
				page_size: json.data?.results?.length ?? 10
			};
		}
	} catch {
		packages = [];
	}

	return { token, packages, pagination };
};

export const actions: Actions = {
	delete: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) return fail(401, { error: 'Unauthorized' });

		const fd = await request.formData();
		const id = (fd.get('id') as string) || '';
		if (!id) return fail(400, { error: 'Missing tour id' });

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/packages/${id}/`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				return fail(res.status, { error: json.message || 'Failed to delete the tour.' });
			}
			return { success: true, message: 'Tour deleted successfully.' };
		} catch (err: unknown) {
			return fail(500, { error: err instanceof Error ? err.message : 'Delete failed.' });
		}
	}
};
