import type { LayoutServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { decodeJwtPayload, readAdminSession } from '$lib/admin/session';

/**
 * Root data for every /adminpanel route.
 *
 * Access control itself lives in `src/hooks.server.ts` so it runs before any
 * route or layout code. This load only resolves the signed-in admin's profile
 * and permissions, which the sidebar and route guards depend on.
 */
export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
	const { token, expiry, isAuthenticated } = readAdminSession(cookies);

	let user: {
		id: number | string | null;
		name: string;
		email: string;
		avatar: string;
		role: string;
		is_superuser: boolean;
		permissions: string[];
		profileLoaded: boolean;
	} | null = null;

	if (token) {
		const userId = decodeJwtPayload(token)?.user_id;

		if (userId) {
			try {
				const res = await fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/${userId}/`, {
					headers: { Authorization: `Bearer ${token}` }
				});

				if (res.ok) {
					const json = await res.json();
					const d = json.data ?? json;
					const name = d.name || d.email || 'Administrator';

					user = {
						id: d.id ?? userId,
						name,
						email: d.email ?? '',
						avatar:
							d.avatar ??
							`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
						role: d.is_superuser ? 'Super Admin' : 'Admin',
						is_superuser: d.is_superuser ?? false,
						permissions: d.all_permissions ?? [],
						profileLoaded: true
					};
				}
			} catch {
				// Profile lookup is best-effort; the fallback below keeps the panel usable.
			}
		}
	}

	// Never claim superuser on a failed lookup — that would silently grant full
	// access to an unidentified account. `profileLoaded: false` instead tells the
	// nav to stay fully visible rather than pretend to know the permission set.
	user ??= {
		id: null,
		name: 'Administrator',
		email: '',
		avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Administrator',
		role: 'Admin',
		is_superuser: false,
		permissions: [],
		profileLoaded: false
	};

	return {
		token,
		tokenExpiry: expiry,
		isAuthenticated,
		user
	};
};