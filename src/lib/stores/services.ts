import { writable } from 'svelte/store';
import type { ServiceData } from '$lib/api/services';

export const services = writable<ServiceData[]>([]);
