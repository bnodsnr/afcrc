/**
 * Product-related API calls
 */

import type { ApiClient } from './client';
import type { SettingsData} from './types';

export class SettingApi {
    constructor(private client: ApiClient) {}

    /**
     * Get settings
     * Returns either a single SettingsData object or an array
     */
    async getSettings(): Promise<SettingsData | SettingsData[] | null> {
        const response = await this.client.get<SettingsData | SettingsData[]>('/api/get-settings/');
        return response || null;
    }
}
