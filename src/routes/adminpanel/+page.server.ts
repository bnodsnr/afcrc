import { redirect } from '@sveltejs/kit';
import { adminUrl } from '$lib/admin/paths';
import { readAdminSession } from '$lib/admin/session';
import type { PageServerLoad } from './$types';

/**
 * `/adminpanel` is just an entry point — send admins to the dashboard and
 * everyone else to the admin login.
 */
export const load: PageServerLoad = async ({ cookies }) => {
	const { isAuthenticated } = readAdminSession(cookies);

	throw redirect(303, adminUrl(isAuthenticated ? '/dashboard' : '/login'));
};