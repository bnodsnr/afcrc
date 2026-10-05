<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let tokenStatus = $state<'checking' | 'found' | 'missing'>('checking');
	let tokenExpiry = $state<number | null>(null);
	let timeRemaining = $state<string>('');
	let allCookies = $state<string[]>([]);

	onMount(() => {
		checkTokenStatus();
		// Update every 10 seconds
		const interval = setInterval(checkTokenStatus, 10000);
		return () => clearInterval(interval);
	});

	function checkTokenStatus() {
		// First, check if we have token expiry from page data (server-side hydration)
		const pageData = $page.data;

		let hasToken = false;
		let expiryMs: number | null = null;

		// Priority 1: Use server data if available
		if (pageData?.isAuthenticated && pageData?.tokenExpiry) {
			hasToken = true;
			expiryMs = pageData.tokenExpiry;
		} else {
			// Priority 2: Fall back to cookies
			const tokenExpiryCookie = document.cookie
				.split('; ')
				.find((row) => row.startsWith('adm_token_expiry='));

			const accessTokenCookie = document.cookie
				.split('; ')
				.find((row) => row.startsWith('access_token='));

			if (tokenExpiryCookie) {
				hasToken = true;
				const [, value] = tokenExpiryCookie.split('=');
				expiryMs = parseInt(value);
			}
		}

		// Get all cookies for debugging
		allCookies = document.cookie.split('; ');

		if (hasToken && expiryMs) {
			tokenStatus = 'found';
			tokenExpiry = expiryMs;

			// Calculate time remaining
			const now = Date.now();
			const remaining = expiryMs - now;

			if (remaining <= 0) {
				timeRemaining = 'Expired';
			} else {
				const minutes = Math.floor(remaining / 60000);
				const seconds = Math.floor((remaining % 60000) / 1000);
				timeRemaining = `${minutes}m ${seconds}s`;
			}
		} else {
			tokenStatus = 'missing';
			tokenExpiry = null;
			timeRemaining = '';
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

{#if tokenStatus === 'found'}
	<div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-4 rounded">
		<div class="flex items-center justify-between">
			<div>
				<p class="font-bold text-sm">✅ Token Found</p>
				<p class="text-xs">Expires in: <span class="font-mono font-bold">{timeRemaining}</span></p>
			</div>
			<button
				onclick={() => checkTokenStatus()}
				class="text-xs bg-green-200 hover:bg-green-300 px-2 py-1 rounded"
				title="Refresh status"
			>
				🔄 Refresh
			</button>
		</div>
	</div>
{:else if tokenStatus === 'missing'}
	<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
		<div class="flex items-center justify-between">
			<div>
				<p class="font-bold text-sm">❌ No Token Found</p>
				<p class="text-xs">
					Token expiry not found in server data or cookies. Check browser DevTools > Application >
					Cookies
				</p>
			</div>
			<button
				onclick={() => checkTokenStatus()}
				class="text-xs bg-red-200 hover:bg-red-300 px-2 py-1 rounded"
				title="Refresh status"
			>
				🔄 Refresh
			</button>
		</div>
	</div>

	<!-- Show all cookies for debugging -->
	<details class="bg-yellow-50 border border-yellow-200 p-2 mb-4 rounded text-xs">
		<summary class="cursor-pointer font-bold text-yellow-700 mb-2"
			>📋 Debug: Show All Cookies</summary
		>
		<div class="space-y-1 max-h-32 overflow-y-auto">
			{#if allCookies.length > 0}
				{#each allCookies as cookie, i}
					<div
						class="bg-yellow-100 p-1 rounded flex items-center justify-between group hover:bg-yellow-200"
					>
						<code class="text-yellow-900 break-all">{cookie}</code>
						<button
							onclick={() => copyToClipboard(cookie)}
							class="opacity-0 group-hover:opacity-100 text-xs bg-yellow-300 hover:bg-yellow-400 px-2 py-0.5 rounded ml-2"
							title="Copy cookie"
						>
							📋
						</button>
					</div>
				{/each}
			{:else}
				<p class="text-yellow-700">No cookies found</p>
			{/if}
		</div>
	</details>
{:else}
	<div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 mb-4 rounded">
		<p class="font-bold text-sm">🔍 Checking token status...</p>
	</div>
{/if}

<style>
	:global(details) {
		font-family: 'Courier New', monospace;
	}
</style>
