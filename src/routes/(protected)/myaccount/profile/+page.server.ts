import { fail, error } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getAccessTokenFromCookieStore } from '$lib/utils/protected-route';
import { PUBLIC_BASE_URL } from '$env/static/public';
import {createApi} from '$lib/api';

export const load = async ({ fetch, cookies }) => {
	const authToken = getAccessTokenFromCookieStore(cookies);

	try {
		const api = createApi(fetch, undefined, authToken);
		const data = await api.profile.getProfile();
		console.log('Profile data:', data);
		return { profile: data?.user ?? data?.data?.user ?? data?.data ?? null };
		// const response = await fetch(`${PUBLIC_BASE_URL}/api/myaccount/profile/`, {
		// 	method: 'GET',
		// 	headers: {
		// 		'Content-Type': 'application/json',
		// 		'Authorization': `Bearer ${authToken}`
		// 	}
		// });

		// if (!response.ok) {
		// 	throw error(response.status, { message: 'Failed to fetch profile data' });
		// }

		// const body = await response.json();
		// const user = body?.user ?? body?.data?.user ?? body?.data ?? null;
		// return { profile: user };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(500, { message: e instanceof Error ? e.message : 'An error occurred' });
	}
}

export const actions: Actions = {
	updateProfile: async ({ request, fetch, cookies }) => {
		const formData = await request.formData();
		const user_name = formData.get('user_name') as string;
		const date_of_birth = formData.get('date_of_birth') as string;
		const gender = formData.get('gender') as string;
		const phone = formData.get('phone') as string;

		const authToken = getAccessTokenFromCookieStore(cookies);

		try {
			const response = await fetch(`${PUBLIC_BASE_URL}/api/myaccount/profile/update/`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				},
				body: JSON.stringify({ user_name, date_of_birth, gender, phone })
			});

			if (!response.ok) {
				const err = await response.json();
				return fail(response.status, {
					message: err.detail || 'Failed to update profile'
				});
			}

			const result = await response.json();
			return {
				success: true,
				message: 'Profile updated successfully',
				data: result
			};
		} catch (e) {
			return fail(500, {
				message: e instanceof Error ? e.message : 'An error occurred'
			});
		}
	}
};
