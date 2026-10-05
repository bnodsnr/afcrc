import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch, url, cookies }) => {
	const token = cookies.get('adm_access_token');

	const headers = { Authorization: `Bearer ${token}` };

	const [usersRes, groupsRes] = await Promise.all([
		fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/`, { headers }),
		fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/groups/`, { headers })
	]);

	const usersJson = await usersRes.json();
	const groupsJson = await groupsRes.json();

	return {
		adminUsers: usersJson.data ?? usersJson ?? [],
		groups: groupsJson.data ?? [],
		apiToken: token
	};
};

export const actions: Actions = {
	deleteUser: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token');
		const formData = await request.formData();
		const id = formData.get('id');

		const res = await fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/${id}/delete/`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) {
			return fail(400, { success: false, message: 'Failed to delete user' });
		}
		return { success: true, message: 'User deleted successfully' };
	}
};