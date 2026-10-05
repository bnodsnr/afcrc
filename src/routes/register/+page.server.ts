import { PUBLIC_BASE_URL } from '$env/static/public';
import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

// Email validation helper
function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Password strength validation
function isStrongPassword(pwd: string): { valid: boolean; message: string } {
	if (pwd.length < 8) {
		return { valid: false, message: 'Password must be at least 8 characters long' };
	}
	if (!/[A-Z]/.test(pwd)) {
		return { valid: false, message: 'Password must contain at least one uppercase letter' };
	}
	if (!/[a-z]/.test(pwd)) {
		return { valid: false, message: 'Password must contain at least one lowercase letter' };
	}
	if (!/[0-9]/.test(pwd)) {
		return { valid: false, message: 'Password must contain at least one number' };
	}
	return { valid: true, message: '' };
}

export const actions: Actions = {
	createUser: async ({ request, fetch }) => {
		const form = await request.formData();

		// sanitize inputs
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();

		const mobile = String(form.get('mobile') ?? '')
			.trim()
			.replace(/\s+/g, '');

		const password = String(form.get('password') ?? '');
		const confirmPassword = String(form.get('confirmPassword') ?? '');

		const values = {
			name,
			email,
			mobile
		};

		// validation errors
		const errors: Record<string, string> = {};

		// name validation
		if (!name) {
			errors.name = 'Full name is required';
		} else if (name.length < 2) {
			errors.name = 'Name must be at least 2 characters';
		} else if (name.length > 100) {
			errors.name = 'Name is too long';
		}

		// email validation
		if (!email) {
			errors.email = 'Email is required';
		} else if (!isValidEmail(email)) {
			errors.email = 'Please enter a valid email address';
		}

		// mobile validation
		if (mobile && !/^\+?\d{10,15}$/.test(mobile)) {
			errors.mobile = 'Please enter a valid phone number';
		}

		// password validation
		if (!password) {
			errors.password = 'Password is required';
		} else {
			const passwordCheck = isStrongPassword(password);

			if (!passwordCheck.valid) {
				errors.password = passwordCheck.message;
			}
		}

		// confirm password
		if (!confirmPassword) {
			errors.confirmPassword = 'Please confirm your password';
		} else if (password !== confirmPassword) {
			errors.confirmPassword = 'Passwords do not match';
		}

		// stop if validation failed
		if (Object.keys(errors).length > 0) {
			return fail(400, {
				success: false,
				message: 'Please fix the errors below',
				errors,
				values
			});
		}

		try {
			const res = await fetch(`${PUBLIC_BASE_URL}/api/create-customer/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({
					name,
					email,
					phone: mobile,
					password
				})
			});

			let payload: any = {};

			try {
				payload = await res.json();
			
			} catch (e) {
				return fail(500, {
					success: false,
					message: 'Server returned invalid response',
					errors: {
						server: 'Something went wrong. Please try again later.'
					},
					values
				});
			}

			// backend validation errors
			if (!res.ok) {
				const formattedErrors: Record<string, string> = {};

				// Extract errors from different possible response formats
				const errorSource = payload?.errors || payload;

				// handle field errors
				if (errorSource && typeof errorSource === 'object') {
					Object.entries(errorSource).forEach(([key, value]) => {
						// Map 'phone' field from backend to 'mobile' on frontend
						const fieldName = key === 'phone' ? 'mobile' : key;

						if (Array.isArray(value)) {
							// DRF returns array of error messages
							formattedErrors[fieldName] = String(value[0]);
						} else if (typeof value === 'string') {
							formattedErrors[fieldName] = value;
						}
					});
				}

				// generic fallback - only if no field errors were extracted
				if (Object.keys(formattedErrors).length === 0) {
					formattedErrors.server =
						payload?.detail ||
						payload?.message ||
						payload?.non_field_errors?.[0] ||
						'Registration failed. Please try again.';
				}

				return fail(res.status, {
					success: false,
					message: 'Oops! Something went wrong. Please check the form and try again.',
					errors: formattedErrors,
					values
				});
			}

			// success
			const encodedEmail = encodeURIComponent(email);
			throw redirect(303, `/verify-email?email=${encodedEmail}`);
		} catch (error: any) {
			// preserve redirect
			if (error?.status === 303) {
				throw error;
			}
			// Determine specific error type
			let errorMessage = 'Unable to complete registration';
			
			if (error?.message?.includes('fetch failed')) {
				errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
			} else if (error?.message?.includes('ERR_INTERNET_DISCONNECTED')) {
				errorMessage = 'Internet connection lost. Please check your network and try again.';
			} else if (error?.message?.includes('timeout')) {
				errorMessage = 'Request timeout. Server is taking too long to respond.';
			}

			return fail(500, {
				success: false,
				message: errorMessage,
				errors: {
					server: errorMessage
				},
				values
			});
		}
	}
};