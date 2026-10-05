import { createApi } from '$lib/api';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAccessTokenFromCookieStore } from '$lib/utils/protected-route';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
		const authToken = cookies.get('cust_access_token');

		if (!authToken) {
			throw redirect(302, '/login');
		}

	try {
		const api = createApi(fetch, undefined, authToken);
		const data = await api.cart.getCart(authToken);
		return { cart: data };
	} catch (e) {
		return { cart: null };
	}
};