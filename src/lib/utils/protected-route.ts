type CookieStore = {
	get?: (name: string) => string | null | undefined;
};

export function getAccessTokenFromCookieStore(cookies: CookieStore | null | undefined): string | null {
	if (!cookies?.get) return null;

	const cookieNames = ['cust_client_token', 'cust_access_token', 'access_token', 'access', 'auth_token'];
	console.log('Checking cookies for access token:', cookieNames);
	for (const name of cookieNames) {
		const value = cookies.get(name);
		if (value) {
			return value;
		}
	}

	return null;
}

export function hasAuthenticatedSession(cookies: CookieStore | null | undefined): boolean {
	return Boolean(getAccessTokenFromCookieStore(cookies));
}
