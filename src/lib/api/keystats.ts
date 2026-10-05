import type { ApiClient } from './client';

export interface KeyStatData {
	id: number;
	title: string;
	slogan: string;
	seo_slug: string;
	count_number: number;
	status: boolean;
	created_at?: string;
	updated_at?: string;
}

export type KeyStatsData = KeyStatData[];

export class KeyStatsApi {
	constructor(private client: ApiClient) {}

	/**
	 * Get company key statistics
	 */
	async getCompanyStats(): Promise<KeyStatsData> {
		const response = await this.client.get<KeyStatsData>('/api/get-companystat/');
		return response || [];
	}
}