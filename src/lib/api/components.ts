import { ApiClient } from './client';
import type { ComponentData, ComponentsData } from './types';

export class ComponentsApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get menus with their submenus nested.
	 *
	 * @param parent a menu slug (`/api/get-component/our-process/`). When omitted,
	 *   the top-level menus (parent_id null) are returned.
	 */
	async getComponentsByParentId(parent?: number | string | null): Promise<ComponentsData> {
		const endpoint =
			parent === undefined || parent === null || parent === ''
				? '/api/get-component/'
				: `/api/get-component/${encodeURIComponent(String(parent))}/`;
		const response = await this.client.get<ComponentsData>(endpoint);
		return Array.isArray(response) ? response : [];
	}

	/** Get a single component by slug, or null when it does not exist */
	async getComponentByParentId(parent: number | string): Promise<ComponentData | null> {
		const response = await this.getComponentsByParentId(parent);
		return response[0] ?? null;
	}
}
