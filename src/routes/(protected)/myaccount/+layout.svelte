<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import Footer from '$lib/components/Footer.svelte';
	import { isLoggedIn, user } from '$lib/stores/auth';
	import { createApi } from '$lib/api';
	import Sidebar from './components/Sidebar.svelte';

	let { children } = $props();
	let userProfile = $state<any>(null);
	let isLoading = $state(true);

	onMount(async () => {
		if ($isLoggedIn) {
			try {
				const api = createApi(fetch);
				const data = await api.profile.getProfile();
				if (data) {
					const userData = data.user;
					if (userData?.data) {
						userProfile = userData.data;
					} else if (data.user) {
						userProfile = data.user;
					}
				}
			} catch (e) {
				console.error('Failed to fetch profile:', e);
			}
		}
		isLoading = false;
	});
</script>

<main class="dashboard-layout">
	<div class="dashboard-container">
		<Sidebar {userProfile} />
		<div class="content-area">
			{#if isLoading}
				<div class="loading-state">
					<div class="spinner"></div>
					<p>Loading your dashboard...</p>
				</div>
			{:else}
				{@render children()}
			{/if}
		</div>
	</div>
</main>

<Footer />

<style>
	.dashboard-layout {
		background: #f8fafc;
		min-height: calc(100vh - 120px);
		padding: 24px 20px 48px;
	}

	.dashboard-container {
		max-width: 1280px;
		margin: 0 auto;
		display: flex;
		gap: 28px;
		align-items: flex-start;
	}

	.content-area {
		flex: 1;
		min-width: 0;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 20px;
		color: #6b7280;
		gap: 16px;
	}

	.spinner {
		width: 36px;
		height: 36px;
		border: 3px solid #e5e7eb;
		border-top-color: #0b5d1e;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.dashboard-layout {
			padding: 0;
		}

		.dashboard-container {
			flex-direction: column;
			gap: 0;
		}
	}
</style>
