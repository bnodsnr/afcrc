<script lang="ts">
	let { 
		user = { name: 'Bryan A.', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=bryan', role: 'Administrator' },
		nav = [],
		closeDrawer = () => {}
	} = $props();
	
	// Handle navigation click
	function handleNavClick() {
		closeDrawer();
	}
</script>

<!-- Clean sidebar matching the image design -->
<aside class="min-h-full w-64 bg-white border-r border-gray-200">
	<!-- Logo section -->
	<div class="p-6 border-b border-gray-200">
		<div class="flex items-center gap-3">
			<div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
				<span class="text-white font-bold text-sm">🏠</span>
			</div>
			<div>
				<h1 class="text-lg font-bold text-gray-900">Nexus</h1>
			</div>
		</div>
	</div>
	
	<!-- Navigation menu -->
	<nav class="p-4">
		<!-- Main Navigation -->
		<div class="mb-6">
			<ul class="space-y-1">
				{#each nav as item}
					<li>
						<a 
							href={item.href || `#${item.name.toLowerCase()}`}
							class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {item.active ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-50'}"
							onclick={handleNavClick}
						>
							<span class="flex-shrink-0 w-5 h-5 {item.active ? 'text-blue-700' : 'text-gray-500'}">{@html item.icon}</span>
							<span>{item.name}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
		
		<!-- Menu section labels -->
		<!-- <div class="mb-4">
			<h3 class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</h3>
		</div> -->
		
		<!-- Additional navigation items -->
		<!-- <ul class="space-y-1">
			<li>
				<a href="#leagues" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" onclick={handleNavClick}>
					<span class="flex-shrink-0 w-5 h-5 text-gray-500">
						<svg fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
						</svg>
					</span>
					<span>Leagues</span>
				</a>
			</li>
			<li>
				<a href="#teams" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" onclick={handleNavClick}>
					<span class="flex-shrink-0 w-5 h-5 text-gray-500">
						<svg fill="currentColor" viewBox="0 0 24 24">
							<path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.996 1.996 0 0 0 18.07 7h-.14c-.8 0-1.54.5-1.85 1.26l-1.92 5.78c-.28.85.11 1.81.93 2.08.22.07.44.11.67.11.65 0 1.26-.31 1.65-.84L18 16v6h2z"/>
						</svg>
					</span>
					<span>Teams</span>
				</a>
			</li>
			<li>
				<a href="#players" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" onclick={handleNavClick}>
					<span class="flex-shrink-0 w-5 h-5 text-gray-500">
						<svg fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
						</svg>
					</span>
					<span>Players</span>
				</a>
			</li>
			<li>
				<a href="#matches" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" onclick={handleNavClick}>
					<span class="flex-shrink-0 w-5 h-5 text-gray-500">
						<svg fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
						</svg>
					</span>
					<span>Matches</span>
				</a>
			</li>
			<li>
				<a href="#fixtures" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" onclick={handleNavClick}>
					<span class="flex-shrink-0 w-5 h-5 text-gray-500">
						<svg fill="currentColor" viewBox="0 0 24 24">
							<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
						</svg>
					</span>
					<span>Fixtures</span>
				</a>
			</li>
			<li>
				<a href="#analytics" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" onclick={handleNavClick}>
					<span class="flex-shrink-0 w-5 h-5 text-gray-500">
						<svg fill="currentColor" viewBox="0 0 24 24">
							<path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.25l1.41-1.41L15.5 12.4l-3.5 3.5-4.5-4.5L2 16.9l1.41 1.41L8.5 13.31l4.5 4.5 6.5-6.5z"/>
						</svg>
					</span>
					<span>Analytics</span>
				</a>
			</li>
		</ul> -->
		
		<!-- Second menu section -->
		<!-- <div class="mt-6 mb-4">
			<h3 class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Configuration</h3>
		</div>
		
		<ul class="space-y-1">
			<li>
				<a href="#settings" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" onclick={handleNavClick}>
					<span class="flex-shrink-0 w-5 h-5 text-gray-500">
						<svg fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
						</svg>
					</span>
					<span>Settings</span>
				</a>
			</li>
			<li>
				<a href="#support" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" onclick={handleNavClick}>
					<span class="flex-shrink-0 w-5 h-5 text-gray-500">
						<svg fill="currentColor" viewBox="0 0 24 24">
							<path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
						</svg>
					</span>
					<span>Help & Support</span>
				</a>
			</li>
		</ul> -->
	</nav>
	
	<!-- User info at bottom -->
	<div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
		<div class="flex items-center gap-3">
			<div class="w-8 h-8 rounded-full overflow-hidden">
				<img src={user.avatar} alt="User avatar" class="w-full h-full object-cover" />
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-sm font-medium text-gray-900 truncate">{user.name}</div>
				<div class="text-xs text-gray-500 truncate">{user.role}</div>
			</div>
			<button class="p-1 rounded-lg hover:bg-gray-100" aria-label="User menu">
				<svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
				</svg>
			</button>
		</div>
	</div>
</aside>
