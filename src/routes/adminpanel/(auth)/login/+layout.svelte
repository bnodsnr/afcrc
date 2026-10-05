<script lang="ts">
	import '$lib/admin/admin.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import DebugApiUrl from '$lib/admin/components/DebugApiUrl.svelte';

	let { children } = $props();

	// Auth pages are always light mode
	onMount(() => {
		if (browser) {
			document.documentElement.setAttribute('data-theme', 'light');
			document.documentElement.classList.add('theme-loaded');
		}
	});
</script>

<!-- Auth layout without sidebar and topbar -->
<main class="admin-root min-h-screen">
	<DebugApiUrl />
	{@render children()}
</main>

<style>
	:global(.theme-loaded) {
		transition:
			background-color 0.3s ease,
			color 0.3s ease;
	}
</style>
