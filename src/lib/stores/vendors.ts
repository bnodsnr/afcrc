import { writable, get } from 'svelte/store';
import { createApi } from '$lib/api';
import type { Vendor } from '$lib/api/vendors';

interface VendorStore {
	vendors: Vendor[];
	loading: boolean;
	error: string | null;
	lastCreated: Vendor | null;
}

function createVendorStore() {
	const { subscribe, set, update } = writable<VendorStore>({
		vendors: [],
		loading: false,
		error: null,
		lastCreated: null
	});

	return {
		subscribe,

		/**
		 * Fetch all vendors from the API
		 */
		fetchVendors: async (): Promise<boolean> => {
			update((s) => ({ ...s, loading: true, error: null }));
			try {
				const api = createApi(fetch);
				const response = await api.vendors.getVendors();
				const vendors = response?.vendors || response?.data || [];
				update((s) => ({ ...s, vendors, loading: false }));
				return true;
			} catch (err: any) {
				update((s) => ({
					...s,
					loading: false,
					error: err?.message || 'Failed to fetch vendors'
				}));
				return false;
			}
		},

		/**
		 * Create a new vendor via POST /api/vendor
		 */
		createVendor: async (vendorData: Partial<Vendor>): Promise<{ success: boolean; vendor?: Vendor; message: string }> => {
			update((s) => ({ ...s, loading: true, error: null }));
			try {
				const api = createApi(fetch);
				const response = await api.vendors.createVendor(vendorData);

				if (response && (response.success || response.vendor || response.data)) {
					const vendor = response.vendor || response.data;
					update((s) => ({
						...s,
						vendors: vendor ? [...s.vendors, vendor] : s.vendors,
						lastCreated: vendor || null,
						loading: false
					}));
					return {
						success: true,
						vendor,
						message: response.message || 'Vendor created successfully'
					};
				}

				update((s) => ({
					...s,
					loading: false,
					error: response?.message || 'Failed to create vendor'
				}));
				return {
					success: false,
					message: response?.message || 'Failed to create vendor'
				};
			} catch (err: any) {
				const message = err?.message || 'An error occurred while creating vendor';
				update((s) => ({ ...s, loading: false, error: message }));
				return { success: false, message };
			}
		},

		/**
		 * Update an existing vendor
		 */
		updateVendor: async (id: number, vendorData: Partial<Vendor>): Promise<{ success: boolean; vendor?: Vendor; message: string }> => {
			update((s) => ({ ...s, loading: true, error: null }));
			try {
				const api = createApi(fetch);
				const response = await api.vendors.updateVendor(id, vendorData);

				if (response && (response.success || response.vendor || response.data)) {
					const vendor = response.vendor || response.data;
					update((s) => ({
						...s,
						vendors: vendor
							? s.vendors.map((v) => (v.id === id ? vendor : v))
							: s.vendors,
						loading: false
					}));
					return {
						success: true,
						vendor,
						message: response.message || 'Vendor updated successfully'
					};
				}

				update((s) => ({
					...s,
					loading: false,
					error: response?.message || 'Failed to update vendor'
				}));
				return {
					success: false,
					message: response?.message || 'Failed to update vendor'
				};
			} catch (err: any) {
				const message = err?.message || 'An error occurred while updating vendor';
				update((s) => ({ ...s, loading: false, error: message }));
				return { success: false, message };
			}
		},

		/**
		 * Delete a vendor
		 */
		deleteVendor: async (id: number): Promise<{ success: boolean; message: string }> => {
			update((s) => ({ ...s, loading: true, error: null }));
			try {
				const api = createApi(fetch);
				const response = await api.vendors.deleteVendor(id);

				if (response && response.success) {
					update((s) => ({
						...s,
						vendors: s.vendors.filter((v) => v.id !== id),
						loading: false
					}));
					return {
						success: true,
						message: response.message || 'Vendor deleted successfully'
					};
				}

				update((s) => ({
					...s,
					loading: false,
					error: response?.message || 'Failed to delete vendor'
				}));
				return {
					success: false,
					message: response?.message || 'Failed to delete vendor'
				};
			} catch (err: any) {
				const message = err?.message || 'An error occurred while deleting vendor';
				update((s) => ({ ...s, loading: false, error: message }));
				return { success: false, message };
			}
		},

		/**
		 * Get a vendor by ID from the local store
		 */
		getVendorById: (id: number): Vendor | undefined => {
			const state = get(vendorStore);
			return state.vendors.find((v) => v.id === id);
		},

		/**
		 * Reset store to initial state
		 */
		reset: () => {
			set({ vendors: [], loading: false, error: null, lastCreated: null });
		}
	};
}

export const vendorStore = createVendorStore();
