import { redirect, type Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { ADMIN_BASE, adminUrl, isAdminPath } from '$lib/admin/paths';
import { clearAdminSession, readAdminSession } from '$lib/admin/session';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

/**
 * Storefront routes that require a signed-in shopper.
 *
 * Mirrors the per-page guards that already existed, so this is reinforcement
 * rather than a behaviour change. `/order-confirmation` is deliberately absent:
 * it is a post-checkout page backed by sessionStorage, not a guarded account page.
 */
const CUSTOMER_PROTECTED = ['/cart', '/checkout', '/myaccount'];

/** The only admin route reachable without a session. */
const ADMIN_LOGIN = `${ADMIN_BASE}/login`;

function isCustomerProtected(pathname: string): boolean {
	return CUSTOMER_PROTECTED.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Access control for the two independent sessions hosted by this app.
 *
 * Admin and shopper sessions never overlap: separate cookie namespaces
 * (`adm_*` vs `cust_*`), separate login screens, separate guards. Admin
 * cookies are additionally scoped to `/adminpanel` so the browser never sends
 * them to a storefront route.
 */
const handleAuth: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;

	const isAdmin = isAdminPath(pathname);
	const isAdminLogin = pathname === ADMIN_LOGIN || pathname.startsWith(`${ADMIN_LOGIN}/`);
	const adminSession = readAdminSession(event.cookies);
	const customerToken = event.cookies.get('cust_access_token');

	if (isAdmin) {
		// Already signed in? Don't let anyone sit on the login screen.
		if (isAdminLogin && adminSession.isAuthenticated) {
			throw redirect(303, adminUrl('/dashboard'));
		}

		if (!isAdminLogin && !adminSession.isAuthenticated) {
			// Drop expired leftovers so the browser stops sending them.
			clearAdminSession(event.cookies);

			// Preserve where they were headed, but never the login page itself —
			// that would allow a redirect loop.
			const target = search ? `${pathname}${search}` : '';
			throw redirect(
				303,
				target
					? `${ADMIN_LOGIN}?redirect=${encodeURIComponent(target)}`
					: ADMIN_LOGIN
			);
		}

		return resolve(event);
	}

	// A signed-in admin has no business on a shopper account page.
	if (adminSession.isAuthenticated && isCustomerProtected(pathname)) {
		throw redirect(303, adminUrl('/dashboard'));
	}

	if (isCustomerProtected(pathname) && !customerToken) {
		throw redirect(303, '/login');
	}

	return resolve(event);
};

export const handle: Handle = ({ event, resolve }) =>
	handleParaglide({ event, resolve: (e) => handleAuth({ event: e, resolve }) });