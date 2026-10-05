/**
 * Admin panel session handling.
 *
 * The storefront and the admin panel are two independent applications served
 * from one SvelteKit process, so they must never share a session. Cookies are
 * therefore namespaced (`adm_*`) and scoped to the `/adminpanel` path, which
 * means the browser never even sends an admin cookie to a storefront route.
 *
 * Storefront cookies use the `cust_` prefix (see `$lib/utils/cookies`).
 */

import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { ADMIN_BASE } from './paths';

export const ADMIN_COOKIES = {
	/** HttpOnly JWT sent to the API as a Bearer token. */
	ACCESS_TOKEN: 'adm_access_token',
	/** Legacy alias of ACCESS_TOKEN, kept for older sessions. */
	TOKEN: 'adm_token',
	/** Epoch-ms the access token expires; readable by client JS on purpose. */
	EXPIRY: 'adm_token_expiry',
	/** HttpOnly refresh token. */
	REFRESH_TOKEN: 'adm_refresh_token'
} as const;

const ALL_ADMIN_COOKIES = Object.values(ADMIN_COOKIES);

/** Admin cookies are scoped to the admin path so they can't leak. */
export const ADMIN_COOKIE_PATH = ADMIN_BASE;

export interface AdminCookieOptions {
	path: string;
	sameSite: 'lax';
	secure: boolean;
	httpOnly: boolean;
	maxAge: number;
}

export function adminCookieOptions(maxAgeSeconds: number, httpOnly = true): AdminCookieOptions {
	return {
		path: ADMIN_COOKIE_PATH,
		sameSite: 'lax',
		secure: !dev,
		httpOnly,
		maxAge: maxAgeSeconds
	};
}

export interface AdminSession {
	token: string | null;
	expiry: number | null;
	isAuthenticated: boolean;
}

/**
 * Read and validate the admin session from cookies.
 *
 * `expiry` is stored alongside the token so we can reject an expired session
 * without spending a round-trip to the API on every request.
 */
export function readAdminSession(cookies: Cookies): AdminSession {
	const token = cookies.get(ADMIN_COOKIES.ACCESS_TOKEN) ?? cookies.get(ADMIN_COOKIES.TOKEN) ?? null;
	const rawExpiry = cookies.get(ADMIN_COOKIES.EXPIRY);
	const expiry = rawExpiry ? Number.parseInt(rawExpiry, 10) : Number.NaN;

	if (!token || Number.isNaN(expiry)) {
		return { token: null, expiry: null, isAuthenticated: false };
	}

	if (Date.now() >= expiry) {
		return { token: null, expiry, isAuthenticated: false };
	}

	return { token, expiry, isAuthenticated: true };
}

/** Remove every admin cookie. Scoped to the admin path. */
export function clearAdminSession(cookies: Cookies): void {
	for (const name of ALL_ADMIN_COOKIES) {
		cookies.delete(name, { path: ADMIN_COOKIE_PATH });
	}
}

/**
 * Decode the JWT payload without verifying the signature.
 *
 * Only used for non-authoritative reads (displaying a user id). Never trust
 * the result for access control — the API remains the source of truth.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
	try {
		const payload = token.split('.')[1];
		if (!payload) return null;
		const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
		return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')));
	} catch {
		return null;
	}
}