import { createApi } from '$lib/api';

/**
 * Fetch settings from the API
 * @returns Promise resolving to settings array
 */
export async function fetchCategories(): Promise<Setting[]> {
  try {
    const api = createApi(fetch);
    const response = await api.get('/settings');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch settings from API:', error);
    return [];
  }
}