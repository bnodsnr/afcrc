import type { ApiClient } from './client';
import type { TeamData } from './types';

export class TeamsApi {
	constructor(private client: ApiClient) {}

	async getTeams(): Promise<TeamData[]> {
		const response = await this.client.get<TeamData[]>('/api/get-teams/');
		return response || [];
	}
}
