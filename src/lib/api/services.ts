import type { ApiClient } from './client';

export interface ServiceData {
	id: number;
	name: string;
	slug: string;
	status: boolean;
	short_description: string | null;
	content: string | null;
	featured_image: string | null;
	created_at: string;
	updated_at: string;
}

export class ServicesApi {
	constructor(private client: ApiClient) {}

	async getServices(): Promise<ServiceData[]> {
		const response = await this.client.get<ServiceData[]>('/api/get-services/');
		return response || [];
	}

	async getFooterServices(): Promise<ServiceData[]> {
		const response = await this.client.get<ServiceData[]>('/api/get-footer-services/');
		return response || [];
	}

	async getServiceBySlug(slug: string): Promise<ServiceData | null> {
		const response = await this.client.get<ServiceData>(`/api/get-service-by-slug/${slug}/`);
		return response || null;
	}
}
