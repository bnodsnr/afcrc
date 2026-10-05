import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const token = cookies.get('adm_access_token');

	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};

	try {
		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/teams/`, {
			method: 'GET',
			headers
		});

		if (!response.ok) {
			console.error('❌ Teams API Error:', response.status, await response.text());
			throw error(response.status, 'Failed to load teams');
		}

		const payload = await response.json();

		return {
			teams: payload.data ?? [],
			teamsCount: payload.data?.length ?? 0,
			apiToken: token,
			error: null
		};
	} catch (err) {
		console.error('❌ Server Load Error:', err);
		throw error(500, 'Failed to load teams');
	}
};

export const actions: Actions = {
	deleteTeam: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token');

		if (!token) {
			throw redirect(302, `${base}/login`);
		}

		try {
			const formData = await request.formData();
			const id = formData.get('id');

			if (!id) {
				return fail(400, {
					success: false,
					message: 'Team member ID is required'
				});
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/teams/${id}/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Backend API Error:', response.status, errorText);
				return fail(response.status, {
					success: false,
					message: 'Failed to delete team member'
				});
			}

			return {
				success: true,
				message: 'Team member deleted successfully'
			};
		} catch (err) {
			console.error('[Server Action] Error:', err);
			return fail(500, {
				success: false,
				message: 'An error occurred while deleting the team member'
			});
		}
	}
};
