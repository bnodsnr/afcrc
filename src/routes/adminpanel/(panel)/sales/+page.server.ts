import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const token = cookies.get('adm_access_token');

	// Redirect if not authenticated
	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	try {
		// Fetch orders/sales from API
		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/sales/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw error(response.status, 'Failed to load sales');
		}

		const data = await response.json();

		return {
			sales: data.data ?? data.sales ?? data,
			apiToken: token
		};
	} catch (err) {
		console.error('❌ Server Load Error:', err);
		throw error(500, 'Failed to load sales');
	}
};
