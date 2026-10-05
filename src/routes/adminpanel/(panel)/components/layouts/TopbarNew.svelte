<script lang="ts">
	let {
		user = { name: 'Bryan', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=bryan' },
		themes = [],
		currentTheme = 'light',
		changeTheme = (theme: string) => {},
		toggleDrawer = () => {}
	} = $props();

	let searchTerm = $state('');
	let dropdownOpen = $state(false);

	function handleSearch() {
		if (searchTerm.trim()) {
			console.log('Searching for:', searchTerm);
		}
	}

	function toggleThemeDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	function selectTheme(theme: string) {
		changeTheme(theme);
		dropdownOpen = false;
	}
</script>

<!-- Clean topbar matching the image design -->
<header class="bg-white border-b border-gray-200 px-6 py-4">
	<div class="flex items-center justify-between">
		<!-- Left side: Mobile menu + Breadcrumb -->
		<div class="flex items-center gap-4">
			<!-- Mobile menu button -->
			<button
				class="lg:hidden p-2 rounded-md hover:bg-gray-100"
				onclick={() => toggleDrawer()}
				aria-label="Toggle menu"
			>
				<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>

			<!-- Breadcrumb -->
			<nav class="flex items-center gap-2 text-sm">
				<span class="text-blue-600 font-medium">🏠 Nexus</span>
				<span class="text-gray-400">/</span>
				<span class="text-gray-600">CRM Overview</span>
			</nav>
		</div>

		<!-- Right side: Search + Notifications + Profile -->
		<div class="flex items-center gap-4">
			<!-- Search -->
			<div class="relative">
				<div class="relative">
					<svg
						class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						type="text"
						placeholder="Search"
						class="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						bind:value={searchTerm}
						onkeydown={(e) => e.key === 'Enter' && handleSearch()}
					/>
				</div>
			</div>

			<!-- Notifications -->
			<button class="relative p-2 rounded-lg hover:bg-gray-100">
				<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
					/>
				</svg>
				<span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
			</button>

			<!-- Downloads -->
			<button class="p-2 rounded-lg hover:bg-gray-100">
				<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			</button>

			<!-- Theme selector -->
			<div class="relative">
				<button class="p-2 rounded-lg hover:bg-gray-100" onclick={toggleThemeDropdown}>
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
						class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
					>
						{#each themes as theme}
							<button
								class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 capitalize {currentTheme ===
								theme
									? 'text-blue-600 bg-blue-50'
									: 'text-gray-700'}"
								onclick={() => selectTheme(theme)}
							>
								{theme}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- User Profile -->
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 rounded-full overflow-hidden">
					<img src={user.avatar} alt="Profile" class="w-full h-full object-cover" />
				</div>
				<div class="hidden sm:block">
					<p class="text-sm font-medium text-gray-900">{user.name}</p>
				</div>
			</div>
		</div>
	</div>
</header>
