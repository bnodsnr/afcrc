import { error, fail, isHttpError, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';
import { normalizeHtmlContent } from '$lib/admin/utils/sanitize';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

type MenuRecord = {
	id: number;
	name?: string;
	is_parent?: boolean;
	children?: MenuRecord[];
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as JsonRecord)
		: {};
}

function collectIds(menu: MenuRecord, ids: Set<number>) {
	if (typeof menu.id === 'number') ids.add(menu.id);
	for (const child of menu.children ?? []) {
		collectIds(child, ids);
	}
}

function formatApiError(data: unknown, fallback: string): string {
	const { errors, message } = asRecord(data);
	if (errors) {
		if (typeof errors === 'string') return `${fallback}: ${errors}`;
		if (typeof errors === 'object') {
			const details = Object.entries(asRecord(errors))
				.map(([field, value]) => {
					const text = Array.isArray(value) ? value.join(' ') : String(value);
					return `${field}: ${text}`;
				})
				.join(', ');
			if (details) return `${fallback}: ${details}`;
		}
	}
	return typeof message === 'string' && message ? message : fallback;
}

export const load: PageServerLoad = async ({ params, cookies, fetch }) => {
	const token = cookies.get('adm_access_token') || '';
	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	const menuId = Number(params.id);
	if (!Number.isInteger(menuId)) {
		throw error(400, 'Invalid menu id');
	}

	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};

	try {
		const [menuRes, menusRes] = await Promise.all([
			fetch(`${PUBLIC_API_BASE_URL}/api/menus/${menuId}/`, { method: 'GET', headers }),
			fetch(`${PUBLIC_API_BASE_URL}/api/menus/`, { method: 'GET', headers })
		]);

		if (!menuRes.ok) {
			throw error(menuRes.status === 404 ? 404 : 502, 'Failed to load menu');
		}

		const menuPayload = asRecord(await menuRes.json());
		const menu = asRecord(menuPayload.data ?? menuPayload);
		if (typeof menu.id !== 'number') {
			throw error(404, 'Menu not found');
		}

		// A menu can never be its own ancestor, so its own id and every descendant id
		// are excluded from the parent options.
		const excludedIds = new Set<number>();
		collectIds(menu as unknown as MenuRecord, excludedIds);

		let allMenus: JsonRecord[] = [];
		if (menusRes.ok) {
			const menusPayload = asRecord(await menusRes.json());
			const list = menusPayload.data ?? menusPayload;
			if (Array.isArray(list)) {
				allMenus = list
					.map((item) => asRecord(item))
					.filter((item) => Object.keys(item).length > 0);
			}
		}

		const parentMenus = allMenus
			.filter((m) => m.is_parent === true && typeof m.id === 'number' && !excludedIds.has(m.id))
			.map((m) => ({
				id: m.id as number,
				name: typeof m.name === 'string' ? m.name : '',
				position: typeof m.position === 'string' ? m.position : ''
			}));

		return { menu, parentMenus };
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('Failed to load menu', err);
		throw error(500, 'Failed to load menu');
	}
};

export const actions: Actions = {
	updateMenu: async ({ request, cookies, params, fetch }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) {
			return fail(401, { message: 'Not authenticated' });
		}

		try {
			const menuId = Number(params.id);
			if (!Number.isInteger(menuId)) {
				return fail(400, { message: 'Invalid menu id' });
			}

			const formData = await request.formData();

			const name = (formData.get('name') as string)?.trim() || '';
			if (!name) {
				return fail(400, { message: 'Page name is required' });
			}

			const position = (formData.get('position') as string) || '';
			if (!position) {
				return fail(400, { message: 'Position is required' });
			}

			const isParent = (formData.get('is_parent') as string) === 'true';
			const parent = (formData.get('parent') as string) || '';
			if (!isParent && !parent) {
				return fail(400, { message: 'Please select a parent menu' });
			}
			if (!isParent && Number(parent) === menuId) {
				return fail(400, { message: 'A menu cannot be its own parent' });
			}

			const isComponent = (formData.get('is_component') as string) === 'true';
			const componentName = ((formData.get('component_name') as string) || '').trim();
			if (isComponent && !componentName) {
				return fail(400, { message: 'Component name is required' });
			}

			const imageFile = formData.get('image') as File | null;
			if (imageFile && imageFile.size > MAX_IMAGE_SIZE) {
				const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(2);
				return fail(400, { message: `Image size ${sizeMB}MB exceeds 2MB limit` });
			}

			const order = Number(formData.get('order'));
			const backendFormData = new FormData();
			backendFormData.append('name', name);
			backendFormData.append('url', (formData.get('url') as string)?.trim() || '');
			backendFormData.append(
				'slug',
				(formData.get('slug') as string)?.trim() ||
					name
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, '-')
						.replace(/(^-|-$)/g, '')
			);
			backendFormData.append('position', position);
			backendFormData.append('is_parent', isParent ? 'true' : 'false');
			backendFormData.append('is_component', isComponent ? 'true' : 'false');
			backendFormData.append('component_name', isComponent ? componentName : '');
			backendFormData.append('parent', isParent ? '' : parent);
			backendFormData.append(
				'page_content',
				normalizeHtmlContent((formData.get('page_content') as string) || '')
			);
			backendFormData.append('order', String(Number.isFinite(order) && order >= 0 ? order : 0));
			backendFormData.append('is_active', (formData.get('is_active') as string) === 'true' ? 'true' : 'false');

			if (imageFile && imageFile.size > 0) {
				backendFormData.append('featured_image', imageFile, imageFile.name);
			}
			if ((formData.get('remove_image') as string) === 'true') {
				backendFormData.append('remove_featured_image', 'true');
			}

			const response = await fetch(
				`${PUBLIC_API_BASE_URL}/api/menus/${menuId}/update/`,
				{
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${token}`
					},
					credentials: 'include',
					body: backendFormData
				}
			);

			const responseText = await response.text();
			let data: unknown;
			try {
				data = JSON.parse(responseText);
			} catch {
				return fail(502, {
					message: `Invalid API response (${response.status}): ${responseText.substring(0, 200)}`
				});
			}

			if (!response.ok) {
				return fail(response.status, {
					message: formatApiError(data, 'Failed to update menu')
				});
			}

			return { success: true, message: 'Menu updated successfully!', data };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			if (message.includes('payload') || message.includes('body size') || message.includes('413')) {
				return fail(413, {
					message: 'Payload too large. Please use a smaller image (max 2MB).'
				});
			}
			return fail(500, { message });
		}
	},

	deleteMenu: async ({ request, cookies, fetch }) => {
		try {
			const formData = await request.formData();
			const menuId = Number(formData.get('id'));
			if (!Number.isInteger(menuId)) {
				return fail(400, { success: false, message: 'Menu ID is required' });
			}
			const token = cookies.get('adm_access_token') || '';
			if (!token) {
				return fail(401, { success: false, message: 'Not authenticated' });
			}
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/menus/${menuId}/delete/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include'
			});
			if (!response.ok) {
				const payload = asRecord(await response.json().catch(() => null));
				const message =
					typeof payload.message === 'string' ? payload.message : 'Failed to delete menu';
				return fail(response.status, { success: false, message, errors: payload.errors });
			}
			return { success: true, data: asRecord(await response.json().catch(() => null)) };
		} catch (error) {
			return fail(500, {
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
};
