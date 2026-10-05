import { PUBLIC_BASE_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const api = createApi(fetch);
		const [settings] = await Promise.all([
			api.settings.getSettings()
		]);
		return {
			settings: settings || [],
		};
	} catch (error) {
		return {
			settings: []
		};
	}
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const form = await request.formData();

		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const message = String(form.get('message') ?? '').trim();
		const phone = String(form.get('phone') ?? '').trim();
		const subject = String(form.get('subject') ?? '').trim();

		const values = { name, email, message, phone, subject };

		const errors: Record<string, string> = {};

		if (!name) errors.name = 'Name is required';
		if (!email) errors.email = 'Email is required';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address';
		if (!message) errors.message = 'Message is required';
		else if (message.length < 10) errors.message = 'Message must be at least 10 characters';
		if (!phone) errors.phone = 'Phone is required';

		if (Object.keys(errors).length > 0) {
			return fail(400, { success: false, message: 'Please fix the errors below', errors, values });
		}

		try {
			const res = await fetch(`${PUBLIC_BASE_URL}/api/contact-forms/submit/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({ name, email, message, phone , subject })
			});

			let payload: any = {};
			try {
				payload = await res.json();
			} catch (e) {
				return fail(500, { success: false, message: 'Server returned invalid response', errors: { server: 'Something went wrong. Please try again later.' }, values });
			}

			if (!res.ok) {
				const formattedErrors: Record<string, string> = {};
				const errorSource = payload?.errors || payload;
				if (errorSource && typeof errorSource === 'object') {
					Object.entries(errorSource).forEach(([key, value]) => {
						if (Array.isArray(value)) formattedErrors[key] = String(value[0]);
						else if (typeof value === 'string') formattedErrors[key] = value;
					});
				}
				if (Object.keys(formattedErrors).length === 0) {
					formattedErrors.server = payload?.message || 'Submission failed. Please try again.';
				}
				return fail(res.status, { success: false, message: 'Submission failed', errors: formattedErrors, values });
			}

			return { success: true, message: 'Message sent successfully! We will get back to you soon.' };
		} catch (error: any) {
			let errorMessage = 'Unable to submit form';
			if (error?.message?.includes('fetch failed')) errorMessage = 'Cannot connect to server. Please check your internet connection.';
			return fail(500, { success: false, message: errorMessage, errors: { server: errorMessage }, values });
		}
	}
};
