import type { HandleClientError } from '@sveltejs/kit';
import { ADMIN_COOKIES, ADMIN_COOKIE_PATH } from '$lib/admin/session';

/**
 * Client-side admin session watchdog.
 *
 * Imported only by the admin panel layouts, so it can never interfere with the
 * storefront. It watches for API calls that come back 401/403 and for the
 * access token reaching its expiry, then tears the session down.
 *
 * These cookies are HttpOnly, so this can only clear them from JS by expiring
 * them — the server-side guard in `hooks.server.ts` remains the real authority.
 */

let logoutTimeout: ReturnType<typeof setTimeout> | null = null;
let warningTimeout: ReturnType<typeof setTimeout> | null = null;

function clearCookies() {
	const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; path=';

	for (const name of Object.values(ADMIN_COOKIES)) {
		document.cookie = `${name}=; ${expired}${ADMIN_COOKIE_PATH}`;
	}
}

function performLogout() {
	clearCookies();

	// Sync other tabs.
	localStorage.setItem('admin-logout-event', Date.now().toString());

	if (!window.location.pathname.startsWith(`${ADMIN_COOKIE_PATH}/login`)) {
		window.location.href = `${ADMIN_COOKIE_PATH}/login`;
	}
}

function readExpiry(): number | null {
	const row = document.cookie
		.split('; ')
		.find((entry) => entry.startsWith(`${ADMIN_COOKIES.EXPIRY}=`));

	if (!row) return null;

	const expiry = Number.parseInt(row.split('=')[1] ?? '', 10);
	return Number.isNaN(expiry) ? null : expiry;
}

/**
 * Only API traffic should trigger a logout. Page navigations return SvelteKit's
 * own HTML, and a 401 there is a normal auth redirect rather than an API error.
 */
function isApiCall(resource: RequestInfo | URL): boolean {
	return resource.toString().includes('/api/');
}

function setupFetchInterceptor() {
	const originalFetch = window.fetch.bind(window);

	window.fetch = async function (resource: RequestInfo | URL, config?: RequestInit) {
		const response = await originalFetch(resource, config);

		if ((response.status === 401 || response.status === 403) && isApiCall(resource)) {
			performLogout();
		}

		return response;
	};
}

const WARNING_MS = 5 * 60 * 1000;

function setupAutoLogout() {
	if (logoutTimeout) clearTimeout(logoutTimeout);
	if (warningTimeout) clearTimeout(warningTimeout);

	const expiry = readExpiry();

	// No expiry cookie simply means "no session to watch".
	if (expiry === null) return;

	const remaining = expiry - Date.now();

	if (remaining <= 0) {
		performLogout();
		return;
	}

	if (remaining > WARNING_MS) {
		warningTimeout = setTimeout(() => {
			window.dispatchEvent(
				new CustomEvent('session-expiring-soon', { detail: { timeRemaining: WARNING_MS } })
			);
		}, remaining - WARNING_MS);
	}

	logoutTimeout = setTimeout(performLogout, remaining);
}

export function initAdminSession(): () => void {
	if (typeof window === 'undefined') {
		return () => {};
	}

	setupFetchInterceptor();
	setupAutoLogout();

	const onStorage = (e: StorageEvent) => {
		if (e.key === 'admin-logout-event') performLogout();
	};
	const onVisibility = () => {
		if (document.visibilityState === 'visible') setupAutoLogout();
	};
	const interval = setInterval(setupAutoLogout, 60_000);

	window.addEventListener('storage', onStorage);
	document.addEventListener('visibilitychange', onVisibility);

	return () => {
		clearInterval(interval);
		window.removeEventListener('storage', onStorage);
		document.removeEventListener('visibilitychange', onVisibility);
		if (logoutTimeout) clearTimeout(logoutTimeout);
		if (warningTimeout) clearTimeout(warningTimeout);
	};
}

export const handleError: HandleClientError = ({ error }) => {
	console.error('Admin client error boundary:', error);
};