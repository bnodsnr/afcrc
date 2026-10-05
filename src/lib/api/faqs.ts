import type { ApiClient } from './client';

export interface FaqItem {
	id: number;
	question: string;
	answer: string;
	category: string;
	order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export class FaqsApi {
	constructor(private client: ApiClient) {}

	async getFaqs(): Promise<FaqItem[]> {
		const response = await this.client.get<FaqItem[]>('/api/get-faqs/');
		return response || [];
	}
}
