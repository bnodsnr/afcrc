import { PUBLIC_BASE_URL } from '$env/static/public';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

/**
 * Server-side login form action.
 *
 * ARCHITECTURE — How JWT tokens reach the browser as HttpOnly cookies:
 *
 * ┌──────────┐         ┌────────────────┐         ┌──────────────────┐
 * │  Browser  │──POST──▶│  SvelteKit      │──POST──▶│  Django Backend  │
 * │  (client) │  form   │  Server         │  json   │  :9000            │
 * └──────────┘         └────────────────┘         └──────────────────┘
 *                            │                            │
 *                            │  ◀── { tokens: { access,   │
 *                            │        refresh } } in body ─│
 *                            │   (Django does NOT set      │
 *                            │    Set-Cookie headers)      │
 *                            │                            │
 *                            │── Set-Cookie (built here) ─▶ Browser
 *                            │    cust_access_token (HttpOnly)
 *                            │    cust_refresh_token (HttpOnly)
 *                            │    cust_client_token (readable, mirrors access)
 *                            │    cust_logged_in (readable flag)
 *                            │
 *                            │── { success, user } ──────▶ Browser
 *                             (raw JWT never reaches client-side JS)
 *
 * WHY THIS IS SECURE:
 * 1. The primary JWT (cust_access_token) is HttpOnly — JS cannot read it.
 * 2. This SvelteKit server action is the ONLY place that ever sees the raw
 *    token from the response body — it's set as a cookie here and then
 *    never returned to the browser in the JSON response.
 * 3. `cust_client_token` is an intentional, readable duplicate — only needed
 *    if some client-side code must build an Authorization header manually.
 *    If everything can go through `credentials: 'include'` instead, this
 *    cookie can be removed entirely for a stricter setup.
 * 4. SameSite=Lax prevents CSRF on cross-origin POST requests.
 * 5. Secure flag ensures cookies are only sent over HTTPS in production.
 * 6. The SvelteKit server talks to Django server-to-server — the backend
 *    never communicates directly with the browser (no CORS issues).
 *
 * COOKIE FLOW ON LOGIN:
 *   1. Browser submits form to SvelteKit server (same origin).
 *   2. SvelteKit server calls Django backend (server-to-server).
 *   3. Django validates credentials, returns { user, tokens: { access, refresh } }
 *      as plain JSON — no Set-Cookie header from Django.
 *   4. SvelteKit server reads tokens.access / tokens.refresh from that body
 *      and sets its OWN Set-Cookie headers on the response to the browser.
 *   5. Browser stores the HttpOnly cookie — JavaScript can never access it.
 *   6. SvelteKit server also sets cust_logged_in=true (non-HttpOnly flag).
 *   7. All subsequent API calls include cookies via credentials: 'include'.
 *
 * COOKIE FLOW ON SUBSEQUENT REQUESTS:
 *   Browser ──Cookie: cust_access_token=eyJ...──▶ Django Backend
 *   (browser automatically sends HttpOnly cookies with every request)
 *
 * COOKIE FLOW ON LOGOUT:
 *   1. Client calls the logout action.
 *   2. SvelteKit server clears cust_access_token / cust_refresh_token /
 *      cust_client_token / cust_logged_in (Max-Age=0).
 */

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const actions: Actions = {
	login: async ({ request, fetch, cookies, url }) => {
		const formData = await request.formData();
		const identifier = String(formData.get('identifier') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		// ─── Server-side validation ───
		if (!identifier || !password) {
			return fail(400, {
				success: false,
				message: 'Email and password are required'
			});
		}

		if (!isValidEmail(identifier)) {
			return fail(400, {
				success: false,
				message: 'Please enter a valid email address'
			});
		}

		// ─── Call Django backend ───
		try {
			const res = await fetch(`${PUBLIC_BASE_URL}/api/customer/login/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ identifier, password })
			});

			if (!res.ok) {
				let errorMessage = 'Invalid email or password';
				try {
					const data = await res.json();
					errorMessage = data.detail || data.message || errorMessage;
				} catch {
					// response wasn't JSON
				}
				return fail(res.status, {
					success: false,
					message: errorMessage
				});
			}

			// ─── Parse the login response body ───
			// Django returns tokens directly in the body:
			//   { success, message, user: {...}, tokens: { access, refresh } }
			// There is no Set-Cookie header from Django — we build our own
			// cookies below from these values.
			let userData: any = null;
			let accessToken: string | undefined;
			let refreshToken: string | undefined;

			try {
				const data = await res.json();
				userData = data?.user ?? null;
				accessToken = data?.tokens?.access;
				refreshToken = data?.tokens?.refresh;
			} catch {
				// response wasn't JSON — nothing to extract
			}

			if (!accessToken) {
				return fail(500, {
					success: false,
					message: 'Login succeeded but no session token was returned. Please try again.'
				});
			}

			const isProd = url.protocol === 'https:';

			// ─── Set the primary HttpOnly access token cookie ───
			// This is what the backend should authenticate requests with,
			// via credentials: 'include' on subsequent fetches.
			cookies.set('cust_access_token', accessToken, {
				path: '/',
				maxAge: 7600, // 1 hour — match your backend's access token TTL
				sameSite: 'lax',
				secure: isProd,
				httpOnly: true
			});

			// ─── Set the refresh token cookie, if present ───
			if (refreshToken) {
				cookies.set('cust_refresh_token', refreshToken, {
					path: '/',
					maxAge: 60 * 60 * 24 * 7, // 7 days — match your backend's refresh token TTL
					sameSite: 'lax',
					secure: isProd,
					httpOnly: true
				});
			}

			// ─── Non-HttpOnly flag cookie for client-side auth checks ───
			cookies.set('cust_logged_in', 'true', {
				path: '/',
				maxAge: 60 * 60 * 24 * 7, // 7 days
				sameSite: 'lax',
				secure: isProd,
				httpOnly: false // client JS must read this
			});

			// ─── Return success (NOT redirect) so use:enhance can set auth state ───
			// Returning data with type='success' lets the client call setAuth() BEFORE goto(),
			// ensuring the isLoggedIn store is true when beforeNavigate fires.
			const redirectTo = url.searchParams.get('redirectTo') || '/';
			return {
				success: true,
				user: userData,
				redirectTo
			};
		} catch (error: any) {
			return fail(500, {
				success: false,
				message: 'Unable to connect to server. Please try again.'
			});
		}
	}
};