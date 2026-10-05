import { goto } from '$app/navigation';
import { base } from '$lib/admin/paths';

interface SubmitOptions {
	successMessage?: string;
	errorMessage?: string;
	redirectTo?: string;
	addToast: (message: string, type: 'success' | 'error' | 'info') => void;
	setLoading: (value: boolean) => void;
	delay?: number;
}

export function createSubmitHandler(options: SubmitOptions) {
	return () => {
		options.setLoading(true);

		return async ({ result }: any) => {
			if (result.type === 'success') {
				options.addToast(
					options.successMessage ?? 'Operation completed successfully',
					'success'
				);

				if (options.delay) {
					await new Promise((resolve) =>
						setTimeout(resolve, options.delay)
					);
				}

				if (options.redirectTo) {
					await goto(`${base}${options.redirectTo}`);
				}
			} else {
				options.addToast(
					options.errorMessage ?? 'Something went wrong',
					'error'
				);

				options.setLoading(false);
			}
		};
	};
}