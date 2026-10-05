import type { ApiClient } from './client';

export interface MenuItem {
	id: number;
	name: string;
	url: string | null;
	slug: string | null;
	position: string;
	is_parent: boolean;
	is_component: boolean;
	component_name: string | null;
	component_props: Record<string, string> | null;
	parent: number | null;
	featured_image: string | null;
	page_content: string | null;
	order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	children: MenuItem[];
}

export class MenuApi {
	constructor(private client: ApiClient) {}

	async getMenus(position?: string): Promise<MenuItem[]> {
		let endpoint = '/api/menus/list/';
		if (position) {
			endpoint += `?position=${encodeURIComponent(position)}`;
		}
		const response = await this.client.get<MenuItem[]>(endpoint);
		return response || [];
	}

	async getHeaderMenus(): Promise<MenuItem[]> {
		return this.getMenus('header');
	}

	async getFooterMenus(): Promise<MenuItem[]> {
		return this.getMenus('footer');
	}
}
