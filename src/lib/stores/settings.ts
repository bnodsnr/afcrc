import { writable } from 'svelte/store';
import type { SettingsData } from '$lib/api/types';    

export const settings = writable<SettingsData | null>(null);