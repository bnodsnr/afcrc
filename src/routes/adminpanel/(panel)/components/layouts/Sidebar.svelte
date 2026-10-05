<script lang="ts">
	import nlogo from '$lib/admin/assets/newlogo.ico';

	let {
		user = {
			name: 'Bryan A.',
			avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=bryan',
			role: 'Administrator'
		},
		nav = [],
		closeDrawer = () => {}
	} = $props();

	let expandedMenus = $state<string[]>([]);

	// Handle navigation click
	function handleNavClick() {
		closeDrawer();
	}

	function toggleSubmenu(itemName: string) {
		if (expandedMenus.includes(itemName)) {
			expandedMenus = expandedMenus.filter((name) => name !== itemName);
		} else {
			expandedMenus = [...expandedMenus, itemName];
		}
	}
</script>

<!-- Clean sidebar matching the image design -->
<aside class="flex h-full w-full flex-col bg-base-100 text-base-content">
	<!-- Logo section with close button -->
	<div class="border-b border-base-300 bg-base-200/80 px-6 py-5">
		<div class="flex items-center justify-between gap-4">
			<div class="flex-shrink-0 border-b border-base-300 bg-base-200/80">
				<div class="flex items-center gap-4">
					<!-- ✅ wrapper row added -->
					<!-- <div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-green-600 shadow-md"
					></div> -->
					<div class="min-w-0 flex-1">
						<h1
							class="truncate text-lg leading-tight font-bold text-base-content"
							style="letter-spacing: -0.025em"
						>
							Admin Panel
						</h1>
						<p class="text-sm leading-tight font-semibold text-success">Manage Your Content</p>
					</div>
				</div>
			</div>

			<!-- Close button - only visible on mobile -->
			<button
				class="flex-shrink-0 rounded-md p-2 transition-colors hover:bg-base-200 lg:hidden"
				onclick={() => closeDrawer()}
				aria-label="Close sidebar"
			>
				<svg
					class="h-5 w-5 text-base-content/70"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Navigation menu -->
	<nav class="flex-1 overflow-y-auto border-b border-base-300 bg-base-200/80 p-4">
		<!-- Main Navigation -->
		<div class="mb-6">
			<ul class="space-y-1">
				{#each nav as item}
					<li>
						{#if item.submenu && item.submenu.length > 0}
							<!-- Menu item with submenu -->
							<button
								onclick={() => toggleSubmenu(item.name)}
								class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 {item.active
									? 'border-r-2 border-primary bg-primary/10 text-primary'
									: 'text-base-content/80 hover:bg-base-200'}"
							>
								<span
									class="h-5 w-5 flex-shrink-0 {item.active
										? 'text-primary'
										: 'text-base-content/70'}">{@html item.icon}</span
								>
								<span>{item.name}</span>
								<svg
									class="ml-auto h-4 w-4 transition-transform {expandedMenus.includes(item.name)
										? 'rotate-90'
										: ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</button>

							<!-- Submenu items -->
							{#if expandedMenus.includes(item.name)}
								<ul class="mt-1 ml-4 space-y-1 border-l-2 border-base-300 pl-3">
									{#each item.submenu as subitem}
										<li>
											<a
												href={subitem.href}
												class="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-base-content/70 transition-colors duration-200 hover:bg-base-200 hover:text-primary"
												onclick={handleNavClick}
											>
												<span class="text-base-content/50">•</span>
												<span>{subitem.name}</span>
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						{:else}
							<!-- Regular menu item without submenu -->
							<a
								href={item.href || `#${item.name.toLowerCase()}`}
								class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 {item.active
									? 'border-r-2 border-primary bg-primary/10 text-primary'
									: 'text-base-content/80 hover:bg-base-200'}"
								onclick={handleNavClick}
							>
								<span
									class="h-5 w-5 flex-shrink-0 {item.active
										? 'text-primary'
										: 'text-base-content/70'}">{@html item.icon}</span
								>
								<span>{item.name}</span>
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</nav>
</aside>
