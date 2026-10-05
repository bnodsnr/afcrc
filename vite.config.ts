import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	server: {
		watch: {
			// `.venv` (not just `venv`) — the python venv blows the inotify limit.
			ignored: ['**/venv/**', '**/.venv/**', '**/node_modules/**', '**/.git/**']
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the storefront, except for libraries.
				// Can be removed in svelte 6.
				//
				// The admin panel (`/adminpanel`) is exempted: it was written against
				// Svelte 5's legacy mode (slots, `export let`, `$:`, `on:click`) and
				// several of its components are consumed with that API. Svelte 5
				// auto-detects per file, so leaving these on legacy mode compiles them
				// exactly as they did before the merge. New admin components should
				// be written in runes mode.
				runes: ({ filename }) => {
					if (filename.split(/[/\\]/).includes('node_modules')) return undefined;

					const normalized = filename.replace(/\\/g, '/');
					const isAdmin =
						normalized.includes('/src/routes/adminpanel/') ||
						normalized.includes('/src/lib/admin/');

					return isAdmin ? undefined : true;
				}
			},
			adapter: adapter({ out: 'build', precompress: true }),
			prerender: {
				handleHttpError: 'warn'
			}
		}),

		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
