/**
 * Admin panel URL helpers.
 *
 * The admin panel is served from the SAME SvelteKit application as the
 * storefront, but under its own path prefix (`/adminpanel`).
 *
 * SvelteKit's `paths.base` is application-wide, so it cannot be used to
 * prefix a sub-tree of routes. Instead every admin module imports `base`
 * from here, which keeps the existing `` `${base}/dashboard` `` call-sites
 * working unchanged while the storefront stays rooted at `/`.
 */

/** URL prefix for every admin route. */
export const ADMIN_BASE = '/adminpanel';

/**
 * Mirrors the shape of `base` from `$app/paths` so admin code that was
 * written against the standalone app keeps compiling and linking correctly.
 */
export const base = ADMIN_BASE;

/**
 * Build an absolute admin URL from a path fragment.
 *
 * `adminUrl('/dashboard')` -> `/adminpanel/dashboard`
 */
export function adminUrl(path = ''): string {
	if (!path || path === '/') return ADMIN_BASE;
	return `${ADMIN_BASE}/${path.replace(/^\/+/, '')}`;
}

/** True when a pathname belongs to the admin panel. */
export function isAdminPath(pathname: string): boolean {
	return pathname === ADMIN_BASE || pathname.startsWith(`${ADMIN_BASE}/`);
}