import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

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
	return { token, categories };
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) return fail(401, { error: 'Unauthorized' });

		const fd = await request.formData();
		const name = ((fd.get('name') as string) || '').trim();
		if (!name) return fail(400, { error: 'Category name is required.' });

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/categories/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name,
					description: ((fd.get('description') as string) || '').trim(),
					status: ((fd.get('status') as string) || '').trim() || 'active',
					sort_order: parseInt((fd.get('sort_order') as string) || '0', 10)
				})
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				return fail(res.status, { error: json.message || 'Failed to create category.' });
			}
			return { success: true, message: 'Category created successfully.' };
		} catch (err: unknown) {
			return fail(500, { error: err instanceof Error ? err.message : 'Create failed.' });
		}
	},

	delete: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) return fail(401, { error: 'Unauthorized' });

		const fd = await request.formData();
		const id = (fd.get('id') as string) || '';
		if (!id) return fail(400, { error: 'Missing category id' });

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/categories/${id}/`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				return fail(res.status, { error: json.message || 'Failed to delete category.' });
			}
			return { success: true, message: 'Category deleted successfully.' };
		} catch (err: unknown) {
			return fail(500, { error: err instanceof Error ? err.message : 'Delete failed.' });
		}
	}
};
