import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAccessTokenFromCookieStore } from '$lib/utils/protected-route';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
	const authToken = getAccessTokenFromCookieStore(cookies);
	const API_BASE_URL = PUBLIC_BASE_URL || 'http://localhost:9000';

	try {
		const body = await request.json();

		const response = await fetch(`${API_BASE_URL}/api/cart/add/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
			},
			body: JSON.stringify(body)
		});

		const data = await response.json().catch(() => null);

		return json(data ?? { error: 'Upstream returned empty response' }, {
			status: response.status
		});
	} catch (err) {
		console.error('[API /api/cart/add]', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to add to cart' },
			{ status: 500 }
		);
	}
};
