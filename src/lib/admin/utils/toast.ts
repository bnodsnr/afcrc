export interface Toast {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info';
	duration: number;
}

let toasts = $state<Toast[]>([]);

function addToast(message: string, type: Toast['type'] = 'info', duration = 3000) {
	const id = Date.now() + Math.random();
	toasts.push({ id, message, type, duration });

	if (duration > 0) {
		setTimeout(() => removeToast(id), duration);
	}

	return id;
}

function removeToast(id: number) {
	toasts = toasts.filter((t) => t.id !== id);
}

function clearAll() {
	toasts = [];
}

export const toastStore = {
	get all() {
		return toasts;
	},
	add: addToast,
	remove: removeToast,
	clear: clearAll,
	// convenience shortcuts
	success: (message: string, duration?: number) => addToast(message, 'success', duration),
	error: (message: string, duration?: number) => addToast(message, 'error', duration),
	info: (message: string, duration?: number) => addToast(message, 'info', duration)
};