import type { PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const token = cookies.get('adm_access_token');
	const headers = { Authorization: `Bearer ${token}` };

	const [groupsRes, permsRes, flatRes] = await Promise.all([
		fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/groups/`, { headers }),
		fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/permissions/`, { headers }),
		fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/permissions/flat/`, { headers })
	]);

	const groupsJson = await groupsRes.json();
	const permsJson = await permsRes.json();
	const flatJson = await flatRes.json();

	return {
		groups: groupsJson.data ?? [],
		groupedPermissions: permsJson.data ?? [],
		flatPermissions: flatJson.data ?? [],
		apiToken: token
	};
};
