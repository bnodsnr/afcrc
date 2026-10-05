<script lang="ts">
	import { onMount } from 'svelte';

	// 	name: 'League',
	// 	href: `${base}/league`,
	// 	icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>`
	// },
	// {
	// 	name: 'Registrations',
	// 	href: `${base}/registration`,
	// 	icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-.14 0-.27.01-.4.04-.39.08-.74.28-1.01.55-.18.18-.33.4-.43.64-.1.23-.16.49-.16.77v14c0 .27.06.54.16.78.1.23.25.45.43.64.27.27.62.47 1.01.55.13.02.26.03.4.03h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM12 2.75c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zM19 19H5V5h2v3h10V5h2v14z"/></svg>`
	// },
	// {
	// 	name: 'Fixtures',
	// 	href: `${base}/fixtures`,
	// 	icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>`
	// },
	// {
	// 	name: 'Groups',
	// 	href: `${base}/groups`,
	// 	icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-1.1-.9-2-2-2s-2 .9-2 2V18H4zm8-3c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1zm1-9.5c0 .83-.67 1.5-1.5 1.5S10 6.33 10 5.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm4 2.5c0 .83-.67 1.5-1.5 1.5S14 8.83 14 8s.67-1.5 1.5-1.5S17 7.17 17 8zm-3 4.5c-1.1 0-2 .9-2 2v4.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V17h2c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-3z"/></svg>`
	// },
	// {
	// 	name: 'Matches',
	// 	href: `${base}/matches`,
	// 	icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`
	// },

	// {
	// 	name: 'Themes',
	// 	href: `${base}/themes`,
	// 	icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`
	// }

	let {
		user = { name: 'User', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=user' },
		themes = [],
		currentTheme = 'dark',
		changeTheme = (theme: string) => {},
		toggleDrawer = () => {}
	} = $props();

	let dropdownOpen = $state(false);
	let notificationOpen = $state(false);
	let profileOpen = $state(false);
	let searchOpen = $state(false);
	let searchTerm = $state('');

	// Search suggestions
	let searchSuggestions = [
		'Teams',
		'Players',
		'Matches',
		'League Table',
		'Fixtures',
		'Analytics',
		'Add Team',
		'Schedule Match',
		'Player Stats',
		'Team Performance'
	];

	let filteredSuggestions = $derived(
		searchSuggestions
			.filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()))
			.slice(0, 5)
	);

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
		notificationOpen = false;
		profileOpen = false;
		searchOpen = false;
	}

	function toggleNotifications() {
		notificationOpen = !notificationOpen;
		dropdownOpen = false;
		profileOpen = false;
		searchOpen = false;
	}

	function toggleProfile() {
		profileOpen = !profileOpen;
		dropdownOpen = false;
		notificationOpen = false;
		searchOpen = false;
	}

	function toggleSearch() {
		searchOpen = !searchOpen;
		dropdownOpen = false;
		notificationOpen = false;
		profileOpen = false;
	}

	function selectTheme(theme: string) {
		changeTheme(theme);
		dropdownOpen = false;
	}

	function closeAllDropdowns() {
		dropdownOpen = false;
		notificationOpen = false;
		profileOpen = false;
		searchOpen = false;
	}

	function handleSearch() {
		if (searchTerm.trim()) {
			console.log('Searching for:', searchTerm);
		}
	}

	onMount(() => {
		function handleKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				closeAllDropdowns();
			}
		}

		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;
			if (!target.closest('.dropdown-container')) {
				closeAllDropdowns();
			}
		}

		document.addEventListener('keydown', handleKeydown);
		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<!-- Enhanced topbar with solid DaisyUI navbar structure -->
<div class="navbar bg-base-100 border-b border-base-300 px-4">
	<!-- Left side: Mobile menu button and search -->
	<div class="navbar-start">
		<button
			class="btn btn-square btn-ghost lg:hidden"
			onclick={toggleDrawer}
			aria-label="Toggle menu"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
		</button>

		<!-- Search on larger screens -->
		<div class="hidden lg:flex ml-4">
			<div class="relative dropdown-container">
				<div class="form-control">
					<div class="input-group">
						<input
							type="text"
							placeholder="Search teams, players, matches..."
							class="input input-bordered input-sm w-80 bg-base-100"
							bind:value={searchTerm}
							onfocus={toggleSearch}
						/>
						<button class="btn btn-sm btn-square bg-base-200 border-base-300" aria-label="Search">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</button>
					</div>
				</div>

				<!-- Search suggestions -->
				{#if searchOpen && filteredSuggestions.length > 0}
					<div
						class="absolute top-full left-0 w-full mt-1 bg-base-100 rounded-lg shadow-lg border border-base-300 z-50"
					>
						{#each filteredSuggestions as suggestion}
							<button
								class="w-full text-left px-4 py-2 hover:bg-base-200 first:rounded-t-lg last:rounded-b-lg transition-colors"
								onclick={() => {
									searchTerm = suggestion;
									searchOpen = false;
									handleSearch();
								}}
								type="button"
							>
								{suggestion}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Center: Logo/Title -->
	<div class="navbar-center">
		<h1 class="text-xl font-bold text-primary hidden sm:block">Soccer League Admin</h1>
	</div>

	<!-- Right side: Actions -->
	<div class="navbar-end gap-2">
		<!-- Theme selector -->
		<div class="dropdown dropdown-end dropdown-container">
			<button
				class="btn btn-ghost btn-circle btn-sm"
				title="Change Theme"
				onclick={toggleDropdown}
				type="button"
				aria-label="Change theme"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			</button>

			{#if dropdownOpen}
				<div
					class="dropdown-content bg-base-100 rounded-lg w-52 p-3 shadow-lg border border-base-300 mt-1 z-50"
				>
					<div class="px-2 py-2 text-sm font-semibold border-b border-base-300 mb-2">
						Select Theme: <span class="text-primary">{currentTheme}</span>
					</div>
					<div class="max-h-60 overflow-y-auto space-y-1">
						{#each themes as theme}
							<button
								class="btn btn-sm btn-ghost w-full justify-start {currentTheme === theme
									? 'btn-primary'
									: ''}"
								onclick={() => selectTheme(theme)}
								type="button"
							>
								<span class="capitalize">{theme}</span>
								{#if currentTheme === theme}
									<svg class="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Notifications -->
		<div class="dropdown dropdown-end dropdown-container">
			<button
				class="btn btn-ghost btn-circle btn-sm"
				onclick={toggleNotifications}
				type="button"
				aria-label="Notifications"
			>
				<div class="indicator">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
						/>
					</svg>
					<span class="badge badge-xs badge-primary indicator-item">3</span>
				</div>
			</button>

			{#if notificationOpen}
				<div
					class="dropdown-content bg-base-100 rounded-lg w-72 p-4 shadow-lg border border-base-300 mt-1 z-50"
				>
					<h3 class="font-bold mb-3 text-base">Notifications</h3>
					<div class="space-y-3">
						<div class="flex items-start gap-3 p-2 bg-base-200 rounded-lg">
							<div class="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
							<div class="text-sm">
								<p class="font-medium">Match starting soon</p>
								<p class="text-base-content/70">Eagles vs Tigers in 30 minutes</p>
							</div>
						</div>
						<div class="flex items-start gap-3 p-2 bg-base-200 rounded-lg">
							<div class="w-2 h-2 bg-info rounded-full mt-2 flex-shrink-0"></div>
							<div class="text-sm">
								<p class="font-medium">New player registration</p>
								<p class="text-base-content/70">John Smith joined Ravens team</p>
							</div>
						</div>
						<div class="flex items-start gap-3 p-2 bg-base-200 rounded-lg">
							<div class="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0"></div>
							<div class="text-sm">
								<p class="font-medium">Team update required</p>
								<p class="text-base-content/70">Lions roster needs verification</p>
							</div>
						</div>
					</div>
					<div class="mt-3 pt-3 border-t border-base-300">
						<button class="btn btn-sm btn-primary w-full">View All</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Profile dropdown -->
		<div class="dropdown dropdown-end dropdown-container">
			<button
				class="btn btn-ghost btn-circle avatar"
				onclick={toggleProfile}
				type="button"
				aria-label="Profile menu"
			>
				<div class="w-8 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
					<img alt="Profile" src={user.avatar} />
				</div>
			</button>

			{#if profileOpen}
				<div
					class="dropdown-content bg-base-100 rounded-lg w-52 p-2 shadow-lg border border-base-300 mt-1 z-50"
				>
					<div class="px-3 py-2 border-b border-base-300 mb-2">
						<p class="font-semibold text-sm">{user.name}</p>
						<p class="text-xs text-base-content/70">Administrator</p>
					</div>
					<ul class="menu menu-sm p-0">
						<li><a href="/profile" class="rounded-lg">Profile Settings</a></li>
						<li><a href="/preferences" class="rounded-lg">Preferences</a></li>
						<li><a href="/help" class="rounded-lg">Help & Support</a></li>
						<li class="mt-2 pt-2 border-t border-base-300">
							<a href="" class="text-error rounded-lg">Sign Out</a>
						</li>
					</ul>
				</div>
			{/if}
		</div>
	</div>
</div>
