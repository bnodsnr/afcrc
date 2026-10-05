import { PUBLIC_BASE_URL } from '$env/static/public';
import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	verifyOtp: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const otp = String(form.get('otp') ?? '').trim();

		if (!email || !otp) {
			return fail(400, {
				success: false,
				message: 'Email and OTP are required'
			});
		}

		if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
			return fail(400, {
				success: false,
				message: 'OTP must be a 6-digit number'
			});
		}

		try {
			const res = await fetch(`${PUBLIC_BASE_URL}/api/verify-otp/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, otp })
			});

			let payload: any = {};
			try {
				payload = await res.json();
			} catch {
				return fail(500, {
					success: false,
					message: 'Server returned invalid response'
				});
			}

			if (!res.ok) {
				return fail(res.status, {
					success: false,
					message: payload?.message || 'Verification failed. Please try again.'
				});
			}

			// OTP verified successfully - set auth cookies and redirect
			const accessToken = payload?.tokens?.access;
			const refreshToken = payload?.tokens?.refresh;
			const userData = payload?.user;

			if (accessToken) {
				cookies.set('cust_access_token', accessToken, {
					path: '/',
					maxAge: 7600,
					sameSite: 'lax',
					secure: true,
					httpOnly: true
				});
			}

			if (refreshToken) {
				cookies.set('cust_refresh_token', refreshToken, {
					path: '/',
					maxAge: 60 * 60 * 24 * 7,
					sameSite: 'lax',
					secure: true,
					httpOnly: true
				});
			}

			cookies.set('cust_logged_in', 'true', {
				path: '/',
				maxAge: 60 * 60 * 24 * 7,
				sameSite: 'lax',
				secure: true,
				httpOnly: false
			});

			return {
				success: true,
				message: 'Email verified successfully!',
				user: userData
			};
		} catch (error: any) {
			if (error?.status === 303) throw error;
			return fail(500, {
				success: false,
				message: 'Unable to connect to server. Please try again.'
			});
		}
	},

	resendOtp: async ({ request, fetch }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();

		if (!email) {
			return fail(400, {
				success: false,
				message: 'Email is required'
			});
		}

		try {
			const res = await fetch(`${PUBLIC_BASE_URL}/api/auth/resend-otp/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			let payload: any = {};
			try {
				payload = await res.json();
			} catch {
				return fail(500, {
					success: false,
					message: 'Server returned invalid response'
				});
			}

			if (!res.ok) {
				return fail(res.status, {
					success: false,
					message: payload?.message || 'Failed to resend OTP. Please try again.'
				});
			}

			return {
				success: true,
				message: 'OTP resent successfully! Check your email.'
			};
		} catch (error: any) {
			return fail(500, {
				success: false,
				message: 'Unable to connect to server. Please try again.'
			});
		}
	}
};
