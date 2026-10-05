<script lang="ts">
	import { onMount } from 'svelte';
	
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
		'Teams', 'Players', 'Matches', 'League Table', 'Fixtures', 'Analytics',
		'Add Team', 'Schedule Match', 'Player Stats', 'Team Performance'
	];
	
	let filteredSuggestions = $derived(searchSuggestions.filter(item => 
		item.toLowerCase().includes(searchTerm.toLowerCase())
	).slice(0, 5));
	
	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
		// Close other dropdowns
		notificationOpen = false;
		profileOpen = false;
		searchOpen = false;
	}
	
	function toggleNotifications() {
		notificationOpen = !notificationOpen;
		// Close other dropdowns
		dropdownOpen = false;
		profileOpen = false;
		searchOpen = false;
	}
	
	function toggleProfile() {
		profileOpen = !profileOpen;
		// Close other dropdowns
		dropdownOpen = false;
		notificationOpen = false;
		searchOpen = false;
	}
	
	function toggleSearch() {
		searchOpen = !searchOpen;
		// Close other dropdowns
		dropdownOpen = false;
		notificationOpen = false;
		profileOpen = false;
		
		if (searchOpen) {
			// Focus search input after state update
			setTimeout(() => {
				const searchInput = document.getElementById('search-input');
				searchInput?.focus();
			}, 50);
		}
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
			// Add actual search functionality here
		}
	}
	
	// Enhanced keyboard and click handling
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
	
	// Get theme icon based on current theme
	function getThemeIcon(theme: string) {
		if (theme === 'dark' || theme === 'night' || theme === 'black') {
			return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.75 4.09L15.5 6.34 16.84 7.69 19.09 5.44L17.75 4.09M21 15.5H18.5V17.5H21V15.5M4.5 10.5V12.5H7V10.5H4.5M13 .55C8 .55 4 4.55 4 9.55C4 14.55 8 18.55 13 18.55C18 18.55 22 14.55 22 9.55C22 4.55 18 .55 13 .55M19.09 18.56L16.84 16.31L15.5 17.66L17.75 19.91L19.09 18.56M16.56 8.94L15.22 7.59L13.77 9.04L15.11 10.39L16.56 8.94Z"/></svg>`;
		} else {
			return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 18.5C13.92 16.5 16.5 14.08 16.5 10.5C16.5 8 14.5 6 12 6S7.5 8 7.5 10.5C7.5 14.08 10.08 16.5 12 18.5M12 2L14.39 5.42C15.92 7.9 17.5 10.5 17.5 13.5C17.5 17.09 14.59 20 11 20H13C16.59 20 19.5 17.09 19.5 13.5C19.5 10.5 17.92 7.9 16.39 5.42L12 2Z"/></svg>`;
		}
	}
</script>


		<div class="relative">
			<button 
				class="btn btn-ghost btn-circle" 
				title="Change Theme ({currentTheme})"
				onclick={toggleDropdown}
				type="button"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z"/>
				</svg>
			</button>
			
			{#if dropdownOpen}
				<!-- Backdrop -->
				<div 
					class="fixed inset-0 z-[9998]" 
					onclick={() => dropdownOpen = false}
				></div>
				
				<!-- Dropdown content -->
				<div class="theme-dropdown absolute right-0 top-full mt-2 bg-base-100 rounded-box w-60 p-3 shadow-2xl border border-base-300">
					<div class="flex items-center justify-between mb-3">
						<h3 class="font-semibold text-sm">Select Theme</h3>
						<span class="badge badge-primary badge-sm">{currentTheme}</span>
					</div>
					<div class="max-h-80 overflow-y-auto">
						<div class="grid gap-1">
							{#each themes as theme}
								<button 
									class="btn btn-sm justify-start capitalize {currentTheme === theme ? 'btn-primary' : 'btn-ghost'}"
									onclick={() => selectTheme(theme)}
									type="button"
								>
									<span class="flex items-center justify-between w-full">
										<span>{theme}</span>
										{#if currentTheme === theme}
											<svg class="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
											</svg>
										{/if}
									</span>
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Notifications -->
		<div class="dropdown dropdown-end">
			<div tabindex="0" role="button" class="btn btn-ghost btn-circle">
				<div class="indicator">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
					</svg>
					<span class="badge badge-xs badge-primary indicator-item">3</span>
				</div>
			</div>
			<div tabindex="0" class="card compact dropdown-content bg-base-100 rounded-box w-64 shadow z-[1] mt-3">
				<div class="card-body">
					<h3 class="font-bold">Notifications</h3>
					<div class="text-sm">Match starting in 30 minutes</div>
					<div class="text-sm">New player registration</div>
					<div class="text-sm">Team update required</div>
				</div>
			</div>
		</div>
		<!-- Profile dropdown -->
		<div class="dropdown dropdown-end">
			<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
				<div class="w-10 rounded-full">
					<img alt="Profile" src={user.avatar} />
				</div>
			</div>
			<ul tabindex="0" class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
				<li>
					<a class="justify-between">
						Profile
						<span class="badge">New</span>
					</a>
				</li>
				<li><a>Settings</a></li>
				<li><a href="/">Logout</a></li>
			</ul>
		</div>