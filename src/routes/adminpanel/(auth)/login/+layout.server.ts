import { redirect } from '@sveltejs/kit';
import { adminUrl } from '$lib/admin/paths';
import { clearAdminSession, readAdminSession } from '$lib/admin/session';
import type { LayoutServerLoad } from './$types';

/**
 * Admin login is the only part of the panel reachable without a session.
 *
 * A live session is bounced straight to the dashboard, and a stale one is
 * cleared so `hooks.server.ts` can redirect to the login screen.
 */
export const load: LayoutServerLoad = async ({ cookies }) => {
	const { token, expiry, isAuthenticated } = readAdminSession(cookies);

	if (isAuthenticated) {
		throw redirect(303, adminUrl('/dashboard'));
	}

	// Expired leftovers would otherwise linger in the browser.
	if (token && expiry) {
		clearAdminSession(cookies);
	}

	return { token: null, tokenExpiry: null, isAuthenticated: false };
};