import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	let toastId = 0;

	return {
		subscribe,
		
		show: (message: string, type: ToastType = 'info', duration: number = 3000) => {
			const id = `toast-${++toastId}`;
			const toast: Toast = { id, message, type, duration };

			update((toasts) => [...toasts, toast]);

			if (duration > 0) {
				setTimeout(() => {
					update((toasts) => toasts.filter((t) => t.id !== id));
				}, duration);
			}

			return id;
		},

		success: (message: string, duration?: number) => {
			return createToastStore().show(message, 'success', duration);
		},

		error: (message: string, duration?: number) => {
			return createToastStore().show(message, 'error', duration);
		},

		warning: (message: string, duration?: number) => {
			return createToastStore().show(message, 'warning', duration);
		},

		info: (message: string, duration?: number) => {
			return createToastStore().show(message, 'info', duration);
		},

		dismiss: (id: string) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		},

		clear: () => {
			update(() => []);
		}
	};
}

export const toastStore = createToastStore();

// Convenience functions
export function showToast(message: string, type: ToastType = 'info', duration?: number) {
	toastStore.show(message, type, duration);
}

export function showSuccess(message: string, duration?: number) {
	toastStore.show(message, 'success', duration);
}

export function showError(message: string, duration?: number) {
	toastStore.show(message, 'error', duration);
}

export function showWarning(message: string, duration?: number) {
	toastStore.show(message, 'warning', duration);
}

export function showInfo(message: string, duration?: number) {
	toastStore.show(message, 'info', duration);
}
