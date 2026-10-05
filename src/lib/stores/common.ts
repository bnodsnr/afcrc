/**
 * Common application data (settings, categories, services)
 *
 * These three datasets are shared across the whole site — the header, footer,
 * and most pages read from them. Rather than every component/route fetching
 * them independently, this module provides a single `loadCommonData()` function
 * and a set of reactive stores that any route or component can read.
 *
 * It is wired up once in the root `+layout.svelte`, so it loads on every page
 * navigation and the data is immediately available to every child component.
 */

import { writable, derived, get } from 'svelte/store';
import { createApi } from '$lib/api';
import type { SettingsData, CategoryData } from '$lib/api/types';
import type { ServiceData } from '$lib/api/services';

export interface CommonData {
	settings: SettingsData | null;
	categories: CategoryData[];
	services: ServiceData[];
}

export interface CommonDataState {
	data: CommonData;
	loading: boolean;
	error: string | null;
	loaded: boolean;
}

const initialState: CommonDataState = {
	data: {
		settings: null,
		categories: [],
		services: []
	},
	loading: false,
	error: null,
	loaded: false
};

// Single source of truth for all common data
export const commonData = writable<CommonDataState>(initialState);

// Convenience read-only derived stores for components
export const commonSettings = derived(commonData, ($s) => $s.data.settings);
export const commonCategories = derived(commonData, ($s) => $s.data.categories);
export const commonServices = derived(commonData, ($s) => $s.data.services);
export const commonLoading = derived(commonData, ($s) => $s.loading);
export const commonLoaded = derived(commonData, ($s) => $s.loaded);

// Prevent duplicate concurrent loaders (e.g. multiple components mounting at once)
let inflight: Promise<void> | null = null;

/**
 * Fetch settings, categories and services from the API and populate the store.
 * Safe to call from anywhere — concurrent calls are de-duplicated.
 */
export function loadCommonData(fetchFn: typeof fetch = fetch): Promise<void> {
	// Short-circuit: already loaded successfully
	const state = getState();
	if (state.loaded) return Promise.resolve();

	// Reuse a request that is already in flight
	if (inflight) return inflight;

	commonData.update((s) => ({ ...s, loading: true, error: null }));

	inflight = (async () => {
		const api = createApi(fetchFn);
		try {
			const [settings, categories, services] = await Promise.all([
				api.settings.getSettings(),
				api.categories.getCategories(),
				api.services.getServices()
			]);

			commonData.set({
				data: {
					settings: normalizeSettings(settings),
					categories: Array.isArray(categories) ? categories : [],
					services: Array.isArray(services) ? services : []
				},
				loading: false,
				error: null,
				loaded: true
			});
		} catch (err: any) {
			commonData.set({
				...getState(),
				loading: false,
				error: err?.message || 'Failed to load common data'
			});
		} finally {
			inflight = null;
		}
	})();

	return inflight;
}

/**
 * Reload common data, bypassing the cached/in-flight guard.
 */
export function reloadCommonData(fetchFn: typeof fetch = fetch): Promise<void> {
	inflight = null;
	commonData.update((s) => ({ ...s, loaded: false }));
	return loadCommonData(fetchFn);
}

function getState(): CommonDataState {
	return get(commonData);
}

function normalizeSettings(settings: SettingsData | SettingsData[] | null): SettingsData | null {
	if (!settings) return null;
	return Array.isArray(settings) ? (settings[0] ?? null) : settings;
}
