import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { adminUrl } from '$lib/admin/paths';
import { ADMIN_COOKIES, ADMIN_COOKIE_PATH, clearAdminSession } from '$lib/admin/session';

export const POST: RequestHandler = async ({ cookies }) => {
	const accessToken = cookies.get(ADMIN_COOKIES.ACCESS_TOKEN) ?? cookies.get(ADMIN_COOKIES.TOKEN);
	const refreshToken = cookies.get(ADMIN_COOKIES.REFRESH_TOKEN) ?? '';

	// Revoke the session server-side. Best-effort: the local session is cleared
	// either way, so a backend hiccup must not trap the admin in the panel.
	if (accessToken) {
		try {
			await fetch(`${PUBLIC_API_BASE_URL}/api/admin-auth/logout/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`
				},
				body: JSON.stringify({ refresh: refreshToken })
			});
		} catch {
			// Ignored on purpose — see above.
		}
	}

	// Only ever touch `adm_*` cookies. Deleting every cookie on the domain
	// would also sign the shopper out of the storefront.
	clearAdminSession(cookies);

	// Sweep any legacy admin cookies left from before the namespace existed.
	for (const name of ['token', 'access_token', 'refresh_token', 'token_expiry']) {
		cookies.delete(name, { path: ADMIN_COOKIE_PATH });
		cookies.delete(name, { path: '/' });
	}

	throw redirect(303, adminUrl('/login'));
};