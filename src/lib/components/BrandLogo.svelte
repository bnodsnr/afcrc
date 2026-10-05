<script lang="ts">
	import { base } from '$app/paths';
	import deafultlogo from '$lib/images/logo.png';
	let { logo }: { logo?: string } = $props();
</script>

<a href="{base}/" class="brand-logo">
	{#if logo}
		<img src={logo} alt="Store logo" class="logo-img" />
	{:else}
		<img src={deafultlogo} alt="Store logo" class="logo-img" />
	{/if}
</a>

<style>
	.brand-logo {
		display: flex;
		align-items: center;
		text-decoration: none;
	}
	.logo-img {
		max-height: 60px;
		width: auto;
		object-fit: contain;
	}
</style>
