import { page } from '$app/stores';
import { get } from 'svelte/store';

interface User {
	is_superuser: boolean;
	permissions: string[];
	/**
	 * False when the admin's profile could not be loaded (API unreachable,
	 * endpoint missing, etc.). The panel is a UI hint only — every mutation is
	 * still authorised by the API — so an unknown permission set must not hide
	 * the whole navigation.
	 */
	profileLoaded?: boolean;
}

function getUser(): User | null {
	const p = get(page);
	return (p.data?.user as User) ?? null;
}

export function hasPermission(perms?: string | string[]): boolean {
	const user = getUser();
	if (!user) return true;
	if (user.is_superuser) return true;
	if (user.profileLoaded === false) return true;
	if (!perms || (Array.isArray(perms) && perms.length === 0)) return true;

	const checkList = Array.isArray(perms) ? perms : [perms];
	return checkList.some((p) =>
		user.permissions.includes(p) || user.permissions.some((up) => up.endsWith(`.${p}`))
	);
}