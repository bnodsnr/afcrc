import { describe, expect, it } from 'vitest';
import { getAccessTokenFromCookieStore, hasAuthenticatedSession } from './protected-route';

describe('protected route auth helpers', () => {
	it('reads the primary access token cookie', () => {
		const cookies = {
			get: (name: string) => (name === 'access_token' ? 'token-123' : null)
		};

		expect(getAccessTokenFromCookieStore(cookies)).toBe('token-123');
	});

	it('falls back to the legacy access cookie name', () => {
		const cookies = {
			get: (name: string) => (name === 'access' ? 'legacy-token' : null)
		};

		expect(hasAuthenticatedSession(cookies)).toBe(true);
	});

	it('returns false when no auth cookie is present', () => {
		const cookies = {
			get: () => null
		};

		expect(hasAuthenticatedSession(cookies)).toBe(false);
	});
});
