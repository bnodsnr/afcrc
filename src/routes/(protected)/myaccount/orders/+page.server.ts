import { createApi } from '$lib/api';

import { redirect } from '@sveltejs/kit';

export const load = async ({ cookies, fetch }) => {

    const authToken = cookies.get('cust_access_token');

    if (!authToken) {
        throw redirect(302, '/login');
    }

    try {
        const api = createApi(fetch, undefined, authToken);
        const data = await api.profile.getorderhistory(authToken);
        console.log('Order history data:', data);
        return { orderHistory: data };
	} catch (e) {
        console.error('Failed to fetch order history:', e);
        return { orderHistory: { items: [] } };
    }
}
