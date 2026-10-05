/**
 * Secure cookie utilities for auth
 *
 * Strategy:
 * - cust_access_token / cust_refresh_token: HttpOnly cookies (set by backend, JS cannot read)
 * - cust_logged_in: Regular cookie (NOT HttpOnly) — a simple "true" flag
 *   that the client reads to know if the user is authenticated.
 *   The actual JWT never touches JavaScript.
 *
 * NAMESPACED with "cust_" prefix to avoid conflicts with webadmin cookies
 * when both projects run on the same domain.
 */

/** Namespaced cookie names for the customer frontend */
export const COOKIE_NAMES = {
	ACCESS_TOKEN: 'cust_access_token',
	REFRESH_TOKEN: 'cust_refresh_token',
	FLAG: 'cust_logged_in',
	USER_STORAGE: 'cust_auth_user'
} as const;

/**
 * Legacy names to clean up during migration.
 *
 * `access_token` / `refresh_token` are deliberately NOT here: those names now
 * belong to the admin panel session (which uses the `adm_` prefix), so wiping
 * them from a shopper logout would sign an admin out of a different tab.
 */
const LEGACY_COOKIES = ['is_logged_in', 'auth_token', 'access', 'refresh'];

function isSecureContext(): boolean {
	if (typeof window === 'undefined') return false;
	return window.location.protocol === 'https:';
}

export function getCookieOptions() {
	return {
		path: '/',
		sameSite: 'Lax' as const,
		secure: isSecureContext(),
		maxAge: 3600 * 24 * 7 // 7 days
	};
}

// ─── Low-level cookie helpers ───

export function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	const nameEQ = name + '=';
	for (const raw of document.cookie.split(';')) {
		const cookie = raw.trim();
		if (cookie.indexOf(nameEQ) === 0) {
			return decodeURIComponent(cookie.substring(nameEQ.length));
		}
	}
	return null;
}

export function setCookie(
	name: string,
	value: string,
	options: Partial<ReturnType<typeof getCookieOptions>> = {}
): void {
	if (typeof document === 'undefined') return;
	const opts = { ...getCookieOptions(), ...options };
	let str = `${name}=${encodeURIComponent(value)}`;
	if (opts.path) str += `; Path=${opts.path}`;
	if (opts.sameSite) str += `; SameSite=${opts.sameSite}`;
	if (opts.secure) str += '; Secure';
	if (opts.maxAge) str += `; Max-Age=${opts.maxAge}`;
	document.cookie = str;
}

export function deleteCookie(name: string): void {
	if (typeof document === 'undefined') return;
	const opts = getCookieOptions();
	let str = `${name}=; Path=${opts.path}; Max-Age=0`;
	if (opts.sameSite) str += `; SameSite=${opts.sameSite}`;
	document.cookie = str;
}

// ─── Auth flag (NOT HttpOnly — safe to read from JS) ───

/**
 * Check if user is logged in by reading the non-HttpOnly flag cookie.
 * The actual JWT is in an HttpOnly cookie and never exposed to JS.
 */
export function hasAuthCookie(): boolean {
	return getCookie(COOKIE_NAMES.FLAG) === 'true';
}

/**
 * Set the auth flag cookie after successful login.
 * Call this after the backend sets the HttpOnly JWT cookies.
 */
export function setAuthCookie(): void {
	setCookie(COOKIE_NAMES.FLAG, 'true');
}

/**
 * Clear the auth flag cookie on logout.
 */
export function clearAuthCookie(): void {
	deleteCookie(COOKIE_NAMES.FLAG);
}

// ─── User data persistence (sessionStorage) ───

export function saveUserToStorage(userData: any): void {
	if (typeof sessionStorage === 'undefined') return;
	try {
		sessionStorage.setItem(COOKIE_NAMES.USER_STORAGE, JSON.stringify(userData));
	} catch {
		// sessionStorage might be full or unavailable
	}
}

export function getUserFromStorage(): any {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		const data = sessionStorage.getItem(COOKIE_NAMES.USER_STORAGE);
		return data ? JSON.parse(data) : null;
	} catch {
		return null;
	}
}

export function clearUserFromStorage(): void {
	if (typeof sessionStorage === 'undefined') return;
	try {
		sessionStorage.removeItem(COOKIE_NAMES.USER_STORAGE);
	} catch {
		// ignore
	}
}

// ─── Token reading (server-side only) ───

/**
 * Read access token from cookies.
 * NOTE: On the client, HttpOnly cookies are NOT readable via document.cookie.
 * This function is useful server-side (in +page.server.ts / +layout.server.ts)
 * where SvelteKit's `cookies.get()` should be used instead.
 */
export function getAccessToken(): string | null {
	const token =
		getCookie('cust_client_token') ||
		getCookie(COOKIE_NAMES.ACCESS_TOKEN) ||
		getCookie('access_token') ||
		getCookie('access') ||
		getCookie('auth_token');
	return token;
}

export function getRefreshToken(): string | null {
	return (
		getCookie(COOKIE_NAMES.REFRESH_TOKEN) ||
		getCookie('refresh_token') ||
		getCookie('refresh')
	);
}

// ─── Cleanup ───

export function clearAuthCookies(): void {
	clearAuthCookie();
	clearUserFromStorage();
	deleteCookie('access_token');
	deleteCookie('access');
	deleteCookie('refresh_token');
	deleteCookie('refresh');
	deleteCookie('cust_client_token');
	deleteCookie(COOKIE_NAMES.ACCESS_TOKEN);
	deleteCookie(COOKIE_NAMES.REFRESH_TOKEN);
}
