import type { ApiClient } from './client';
import type { PageComponentData } from './types';

export class PagesApi {
	constructor(private client: ApiClient) {}

	async getPageComponents(componentName?: string): Promise<PageComponentData[]> {
		let endpoint = '/api/get-page-components/';
		if (componentName) {
			endpoint += `?component_name=${encodeURIComponent(componentName)}`;
		}
		const response = await this.client.get<PageComponentData[]>(endpoint);
		return response || [];
	}

	async getPageComponentsBySlug(slug: string): Promise<PageComponentData[]> {
		const endpoint = `/api/get-page-components/${encodeURIComponent(slug)}/`;
		const response = await this.client.get<PageComponentData[]>(endpoint);
		return response || [];
	}
}

export type { PageComponentData };
