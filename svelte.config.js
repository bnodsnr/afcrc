import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		// Force runes mode for the storefront, except for libraries.
		// Can be removed in svelte 6.
		//
		// The admin panel (`/adminpanel`) is exempted: it still uses Svelte 5's
		// legacy mode (slots, `export let`, `$:`, `on:click`) and its consumers
		// depend on that API. Keep this in sync with `vite.config.ts`, which is the
		// config SvelteKit actually reads when options are passed there.
		runes: ({ filename }) => {
			if (filename.split(/[/\\]/).includes('node_modules')) return undefined;

			const normalized = filename.replace(/\\/g, '/');
			const isAdmin =
				normalized.includes('/src/routes/adminpanel/') ||
				normalized.includes('/src/lib/admin/');

			return isAdmin ? undefined : true;
		}
	},
	kit: {
		adapter: adapter({
			out: 'build',
			precompress: true
		}),
		paths: {
			base: ''
		},
		csrf: {
			trustedOrigins: ['*']
		},
		prerender: {
			handleHttpError: 'warn'
		}
	}
};

export default config;