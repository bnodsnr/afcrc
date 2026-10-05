import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAccessTokenFromCookieStore } from '$lib/utils/protected-route';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ fetch, cookies }) => {
	const authToken = getAccessTokenFromCookieStore(cookies);
	const API_BASE_URL = PUBLIC_BASE_URL || 'http://localhost:9000';

	if (!authToken) {
		return json({ success: false, active_count: 0 }, { status: 401 });
	}

	try {
		const response = await fetch(`${API_BASE_URL}/api/cart/count/`, {
			headers: {
				Authorization: `Bearer ${authToken}`
			}
		});

		const data = await response.json().catch(() => null);

		return json(data ?? { error: 'Upstream returned empty response' }, {
			status: response.status
		});
	} catch (err) {
		console.error('[API /api/cart/count]', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to fetch cart count' },
			{ status: 500 }
		);
	}
};
