import { fail, redirect } from '@sveltejs/kit';
import { setAccessToken } from '$lib/admin/api/client';
import type { Actions } from './$types';
import { dev } from '$app/environment';
import { base } from '$lib/admin/paths';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

// Helper function to validate and extract expiry from JWT token safely on server
function getJwtExpiry(token: string): number {
	try {
		// Validate JWT format (should have 3 parts separated by dots)
		const parts = token.split('.');
		if (parts.length !== 3) {
			throw new Error('Invalid JWT format');
		}

		const base64Url = parts[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = Buffer.from(base64, 'base64').toString();
		const payload = JSON.parse(jsonPayload);

		// Validate exp claim exists and is in the future
		if (!payload.exp || typeof payload.exp !== 'number') {
			throw new Error('Token missing exp claim');
		}

		const expiryMs = payload.exp * 1000;
		if (expiryMs < Date.now()) {
			console.warn('⚠️ Token is already expired');
			throw new Error('Token is already expired');
		}

		return expiryMs;
	} catch (e) {
		throw new Error(`Invalid token: ${e instanceof Error ? e.message : 'Unknown error'}`);
	}
}

// Helper function to validate token structure
function isValidToken(token: any): boolean {
	return typeof token === 'string' && token.length > 0 && token.split('.').length === 3;
}

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim();
		const password = data.get('password') as string;

		console.log('🔐 Admin login attempt:', email);

		// 1. Structural Validation
		if (!email || !password) {
			console.error(
				'❌ Missing credentials - email:',
				email,
				'password:',
				password ? 'present' : 'missing'
			);
			return fail(400, {
				email,
				missing: true,
				message: 'Email and password are required fields.'
			});
		}

		try {
			// Build full API URL
			const apiUrl = PUBLIC_API_BASE_URL;
			const loginUrl = `${PUBLIC_API_BASE_URL}/api/admin-auth/login/`;
			console.log('🌐 Sending login request to API:', loginUrl);
			const result = await fetch(loginUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					email: email,
					password
				})
			}).then(async (res) => {
				if (!res.ok) {
					const error = await res.json();
					console.error('❌ Auth API error:', error);
					throw {
						status: res.status,
						data: error
					};
				}
				return res.json();
			});

			// 2. Validate API response structure
			if (!result) {
				console.error('❌ API returned null response');
				return fail(500, {
					email,
					error: 'No response from authentication server.'
				});
			}

			// Check success flag
			if (result.success !== true) {
				console.warn('⚠️ API returned success=false or missing:', result.success);
				return fail(401, {
					email,
					incorrect: true,
					message: result?.message || 'Invalid administrative credentials.'
				});
			}

			// Check tokens object exists
			if (!result.tokens || typeof result.tokens !== 'object') {
				return fail(401, {
					email,
					incorrect: true,
					message: 'Authentication service returned invalid response format.'
				});
			}

			const accessToken = result.tokens.access;
			const refreshToken = result.tokens.refresh;

			// 3. Validate token presence and format
			if (!isValidToken(accessToken)) {
				return fail(500, {
					email,
					error: 'Access token validation failed - invalid format.'
				});
			}

			if (!isValidToken(refreshToken)) {
				return fail(500, {
					email,
					error: 'Refresh token validation failed - invalid format.'
				});
			}

			// 4. Parse and validate JWT expiration
			let expiryTimeMs: number;
			try {
				expiryTimeMs = getJwtExpiry(accessToken);
			} catch (expiryError) {
				return fail(500, {
					email,
					error: 'Token expiry validation failed. Contact support.'
				});
			}

			// Derive maxAge in seconds for cookie lifespan
			const maxAgeSeconds = Math.max(0, Math.floor((expiryTimeMs - Date.now()) / 1000));

			// 5. Cookie Configuration Settings
			const isProduction = !dev;
			const cookiePath = `/${base}`.replace(/\/+/g, '/'); // Ensure single leading slash
			const secureCookieOptions = {
				path: cookiePath,
				httpOnly: true,
				secure: isProduction,
				sameSite: 'lax' as const,
				maxAge: maxAgeSeconds
			};

			// 6. Commit Secure HTTP-Only State Storage
			cookies.set('adm_access_token', accessToken, secureCookieOptions);
			cookies.set('adm_token', accessToken, secureCookieOptions); // Backup alias

			// Only persist a refresh token we actually received — setting a
			// cookie to `undefined` would write the literal string "undefined".
			if (refreshToken) {
				cookies.set('adm_refresh_token', refreshToken, secureCookieOptions);
			}

			// 7. Expose Expiry Timestamp to client via non-httpOnly cookie
			cookies.set('adm_token_expiry', String(expiryTimeMs), {
				path: cookiePath,
				httpOnly: false,
				secure: isProduction,
				sameSite: 'lax',
				maxAge: maxAgeSeconds
			});

			// 8. Sync server API instance state
			setAccessToken(accessToken);
			console.log(
				'✅ Login successful, tokens stored in cookies and API client updated. Expiry:',
				new Date(expiryTimeMs).toISOString()
			);

			// 9. Route Redirection to Dashboard
			const redirectUrl = `/${base}`.replace(/\/+/g, '/') + '/dashboard';
			throw redirect(303, redirectUrl);
		} catch (error: any) {
			console.error('❌ Login action error:', error);
			// Let SvelteKit's built-in redirect exceptions pass through unhindered
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				console.log('📤 Redirect exception caught, re-throwing to browser...', error);
				throw error;
			}

			// Extract error details safely
			const status = error?.status || 500;
			const message = error?.message || 'An error occurred during login.';
			const errorData = error?.data;

			// Provide user-friendly error messages
			let userMessage = message;
			if (status === 401 || status === 400) {
				userMessage = errorData?.message || 'Invalid email or password.';
			} else if (status === 500) {
				userMessage = 'Server error. Please contact support.';
			}

			return fail(status, {
				email,
				error: status === 500 ? message : undefined,
				incorrect: status === 401 || status === 400,
				message: userMessage
			});
		}
	}
};
