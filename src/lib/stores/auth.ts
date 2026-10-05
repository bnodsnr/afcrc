import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { env } from '$env/dynamic/public';
import {
	hasAuthCookie,
	setAuthCookie,
	clearAuthCookie,
	saveUserToStorage,
	getUserFromStorage,
	clearUserFromStorage
} from '$lib/utils/cookies';

/**
 * SECURE AUTH STORE
 *
 * The JWT lives ONLY in HttpOnly cookies set by the backend.
 * This store tracks user info in memory and auth state via a
 * non-HttpOnly "is_logged_in" flag cookie.
 *
 * Flow:
 *   Login  → backend sets HttpOnly JWT cookies
 *          → frontend sets is_logged_in=true flag cookie + stores user in memory + sessionStorage
 *   Refresh → initAuth() reads is_logged_in flag + restores user from sessionStorage
 *   Logout  → backend clears HttpOnly cookies
 *          → frontend clears flag cookie + memory + sessionStorage
 */

// ─── In-memory state (never persisted to storage) ───

const user = writable<any>(null);
const authed = writable<boolean>(false);
const authInitialized = writable<boolean>(false);

const isLoggedIn = derived(authed, ($v) => $v);

/**
 * Restore auth state on mount by reading the flag cookie and sessionStorage.
 * This runs synchronously — the flag cookie tells us if the user was logged in,
 * sessionStorage provides the user data.
 */
function initAuth(): boolean {
	const authenticated = hasAuthCookie();
	authed.set(authenticated);

	if (authenticated) {
		const savedUser = getUserFromStorage();
		if (savedUser) {
			user.set(savedUser);
		}
	}

	authInitialized.set(true);
	return authenticated;
}

/**
 * Called after successful login.
 * Stores user info in memory + sessionStorage and sets the flag cookie.
 * The JWT is already in HttpOnly cookies (set by the backend).
 */
function setAuth({ user: u }: { access?: string; refresh?: string; user?: any }) {
	if (u) {
		user.set(u);
		saveUserToStorage(u);
	}
	setAuthCookie();
	authed.set(true);
	authInitialized.set(true);
}

/**
 * Clear all auth state.
 */
function clearAuth() {
	authed.set(false);
	user.set(null);
	authInitialized.set(false);
	clearAuthCookie();
	clearUserFromStorage();
}

/**
 * Logout — calls backend endpoint, then clears local state.
 */
async function logout(): Promise<boolean> {
	try {
		const baseUrl = env.PUBLIC_BASE_URL || '';
		const response = await fetch(`${baseUrl}/api/auth/logout/`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include'
		});
		clearAuth();
		return response.ok;
	} catch {
		clearAuth();
		return false;
	}
}

export { user, isLoggedIn, authInitialized, initAuth, setAuth, clearAuth, logout };
