<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { page } from '$app/state';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	interface UnreadMessage {
		id: number;
		name: string;
		message: string;
		created_at: string;
	}

	interface RecentOrder {
		id: number;
		order_code: string;
		status: string;
		total: number;
		created_at: string;
		user__name: string;
		user__email: string;
		total_items: number;
	}

	let {
		user = { name: 'Administrator', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=A', role: 'Admin' },
		themeCategories = {},
		currentTheme = 'light',
		changeTheme = (theme: string) => {},
		toggleDrawer = () => {},
		apiToken = ''
	} = $props();

	let searchTerm = $state('');
	let profileDropdownOpen = $state(false);
	let messagesOpen = $state(false);
	let isLoggingOut = $state(false);
	let logoutFormRef: HTMLFormElement | undefined = $state();
	let unreadMessages = $state<UnreadMessage[]>([]);
	let unreadCount = $derived(unreadMessages.length);
	let ordersOpen = $state(false);
	let recentOrders = $state<RecentOrder[]>([]);
	let pendingOrdersCount = $derived(recentOrders.length);

	async function fetchUnread() {
		try {
			if (!apiToken) return;
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/contact-forms/`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiToken}`
				}
			});
			if (!res.ok) return;
			const json = await res.json();
			const all: UnreadMessage[] = json.data ?? [];
			unreadMessages = all
				.filter((m) => m.status === 'new')
				.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
				.slice(0, 5);
		} catch {
			// silently fail
		}
	}

	async function fetchRecentOrders() {
		try {
			if (!apiToken) return;
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/orders/admin/recent/`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiToken}`
				}
			});
			if (!res.ok) return;
			const json = await res.json();
			const orders: RecentOrder[] = json.data?.orders ?? [];
			recentOrders = orders.slice(0, 5);
		} catch {
			// silently fail
		}
	}

	function handleSearch() {
		if (searchTerm.trim()) {
			console.log('Searching for:', searchTerm);
		}
	}

	type BreadcrumbIcon =
		| 'home'
		| 'create'
		| 'edit'
		| 'view'
		| 'delete'
		| 'list'
		| 'settings'
		| 'profile'
		| 'default';

	function getSegmentIcon(segment: string): BreadcrumbIcon {
		const s = segment.toLowerCase();
		if (s === 'dashboard') return 'home';
		if (['create', 'new', 'add'].includes(s)) return 'create';
		if (['edit', 'update', 'modify'].includes(s)) return 'edit';
		if (['view', 'show', 'detail', 'details'].includes(s)) return 'view';
		if (['delete', 'remove'].includes(s)) return 'delete';
		if (['settings', 'setting', 'preferences', 'config'].includes(s)) return 'settings';
		if (['profile', 'account', 'me'].includes(s)) return 'profile';
		if (['list', 'index', 'all'].includes(s)) return 'list';
		if (/^[0-9a-f-]{8,}$/i.test(s) || /^\d+$/.test(s)) return 'view';
		return 'default';
	}

	function toggleProfileDropdown() {
		profileDropdownOpen = !profileDropdownOpen;
	}

	async function handleLogout() {
		isLoggingOut = true;
		if (logoutFormRef) {
			logoutFormRef.submit();
		}
	}

	function truncate(s: string, max = 60) {
		return s.length <= max ? s : s.slice(0, max) + '...';
	}

	function timeAgo(dateStr: string) {
		const now = Date.now();
		const diff = now - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		return `${days}d ago`;
	}

	const baseSegments = base.split('/').filter(Boolean);

	const format = (segment: string) =>
		decodeURIComponent(segment)
			.replace(/[-_]/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase());

	const breadcrumbs = $derived.by(() => {
		let segments = page.url.pathname.split('/').filter(Boolean);
		segments = segments.slice(baseSegments.length);
		segments = segments.filter((s) => s !== 'dashboard');

		return [
			{
				label: 'Dashboard',
				href: `${base}/dashboard`,
				icon: 'home' as BreadcrumbIcon
			},
			...segments.map((segment, index) => ({
				label: format(segment),
				href: `${base}/${segments.slice(0, index + 1).join('/')}`,
				icon: getSegmentIcon(segment)
			}))
		];
	});

	onMount(() => {
		fetchUnread();
		fetchRecentOrders();
		const interval = setInterval(() => { fetchUnread(); fetchRecentOrders(); }, 30000);
		return () => clearInterval(interval);
	});
</script>

<!-- Clean topbar matching the image design -->
<header class="border-b border-base-300 bg-base-200/80 px-6 py-4 text-base-content">
	<div class="flex items-center justify-between">
		<!-- Left side: Mobile menu + Breadcrumb -->
		<div class="flex items-center gap-4">
			<!-- Mobile menu button -->
			<button
				class="rounded-md p-2 hover:bg-gray-100 lg:hidden"
				onclick={() => toggleDrawer()}
				aria-label="Toggle menu"
			>
				<svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>
		</div>

		<!-- Right side: Search + Notifications + Profile -->
		<div class="flex items-center gap-4">
			<!-- Search -->
			<div class="relative">
				<div class="relative">
					<svg
						class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400"
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
						class="w-64 rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						bind:value={searchTerm}
						onkeydown={(e) => e.key === 'Enter' && handleSearch()}
					/>
				</div>
			</div>

			<!-- Messages -->
			<div class="relative">
				<button
					class="relative rounded-lg p-2 transition-colors hover:bg-gray-100"
				onclick={() => (messagesOpen = !messagesOpen)}
				aria-label="Messages"
				>
					<svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
					{#if unreadCount > 0}
						<span
							class="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
						>
							{unreadCount > 9 ? '9+' : unreadCount}
						</span>
					{/if}
				</button>

				{#if messagesOpen}
					<div
						class="absolute top-full right-0 z-50 mt-2 w-80 rounded-lg border border-gray-100 bg-white shadow-xl"
					>
						<div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
							<h3 class="text-sm font-semibold text-gray-900">Messages</h3>
							{#if unreadCount > 0}
								<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
									{unreadCount} new
								</span>
							{/if}
						</div>

						<div class="max-h-80 overflow-y-auto">
							{#if unreadMessages.length === 0}
								<div class="flex flex-col items-center px-4 py-8 text-center">
									<svg class="mb-2 h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<p class="text-sm text-gray-500">No unread messages</p>
								</div>
							{:else}
								{#each unreadMessages as msg (msg.id)}
									<a
										href={`${base}/contactform`}
										class="flex gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50"
									>
										<div
											class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700"
										>
											{msg.name.charAt(0).toUpperCase()}
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center justify-between gap-2">
												<p class="truncate text-sm font-medium text-gray-900">{msg.name}</p>
												<span class="flex-shrink-0 text-xs text-gray-400">{timeAgo(msg.created_at)}</span>
											</div>
											<p class="mt-0.5 truncate text-xs text-gray-500">{truncate(msg.message)}</p>
										</div>
									</a>
								{/each}
							{/if}
						</div>

						<a
							href={`${base}/contactform`}
							class="flex items-center justify-center gap-2 border-t border-gray-100 px-4 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
						>
							View all messages
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</a>
					</div>
				{/if}
			</div>

			<!-- Orders -->
			<div class="relative">
				<button
					class="relative rounded-lg p-2 transition-colors hover:bg-gray-100"
					onclick={() => (ordersOpen = !ordersOpen)}
					aria-label="Orders"
				>
					<svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
						/>
					</svg>
					{#if pendingOrdersCount > 0}
						<span
							class="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
						>
							{pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
						</span>
					{/if}
				</button>

				{#if ordersOpen}
					<div
						class="absolute top-full right-0 z-50 mt-2 w-80 rounded-lg border border-gray-100 bg-white shadow-xl"
					>
						<div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
							<h3 class="text-sm font-semibold text-gray-900">New Orders</h3>
							{#if pendingOrdersCount > 0}
								<span class="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
									{pendingOrdersCount} pending
								</span>
							{/if}
						</div>

						<div class="max-h-80 overflow-y-auto">
							{#if recentOrders.length === 0}
								<div class="flex flex-col items-center px-4 py-8 text-center">
									<svg class="mb-2 h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
									</svg>
									<p class="text-sm text-gray-500">No pending orders</p>
								</div>
							{:else}
								{#each recentOrders as order (order.id)}
									<a
										href={`${base}/orders/${order.id}`}
										class="flex gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50"
									>
										<div
											class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700"
										>
											#{order.order_code.slice(-4)}
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center justify-between gap-2">
												<p class="truncate text-sm font-medium text-gray-900">{order.user__name}</p>
												<span class="flex-shrink-0 text-xs text-gray-400">{timeAgo(order.created_at)}</span>
											</div>
											<p class="mt-0.5 truncate text-xs text-gray-500">
												{order.order_code} &middot; ${order.total.toFixed(2)} &middot; {order.total_items} item{order.total_items !== 1 ? 's' : ''}
											</p>
										</div>
									</a>
								{/each}
							{/if}
						</div>

						<a
							href={`${base}/orders`}
							class="flex items-center justify-center gap-2 border-t border-gray-100 px-4 py-3 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50"
						>
							View all orders
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</a>
					</div>
				{/if}
			</div>

			<!-- Theme toggle -->
			<div class="relative">
				<button
					class="btn btn-circle btn-ghost btn-sm"
					onclick={() => changeTheme(currentTheme === 'dark' ? 'light' : 'dark')}
					aria-label="Toggle theme"
					title={currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
				>
					{#if currentTheme === 'dark'}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 3v2m0 14v2m9-9h-2M5 12H3m12.657 7.657-1.414-1.414M9.757 9.757 8.343 8.343m7.314 0-1.414 1.414M9.757 14.243l-1.414 1.414"
							/>
						</svg>
					{:else}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
							/>
						</svg>
					{/if}
				</button>
			</div>

			<!-- User Profile -->
			<div class="relative">
				<button
					class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100"
					onclick={toggleProfileDropdown}
					aria-label="User profile menu"
				>
					<div class="h-8 w-8 overflow-hidden rounded-full border border-gray-200">
						<img src={user.avatar} alt="Profile" class="h-full w-full object-cover" />
					</div>
					<div class="hidden sm:block">
						<p class="text-sm font-medium text-gray-900">{user.name}</p>
					</div>
					<svg
						class="hidden h-4 w-4 text-gray-600 sm:block"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 14l-7 7m0 0l-7-7m7 7V3"
						/>
					</svg>
				</button>

				{#if profileDropdownOpen}
					<div
						class="absolute top-full right-0 z-50 mt-2 w-48 rounded-lg border border-gray-100 bg-white py-2 shadow-xl"
					>
						<!-- Profile Info -->
						<div class="border-b border-gray-100 px-4 py-3">
							<p class="text-sm font-medium text-gray-900">{user.name}</p>
							<p class="mt-1 text-xs text-gray-500">Administrator</p>
						</div>

						<!-- Menu Items -->
						<button
							class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
						>
							<svg
								class="h-4 w-4 text-gray-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							<span>Settings</span>
						</button>

						<button
							class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
						>
							<svg
								class="h-4 w-4 text-gray-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M18.364 5.636l-3.536 3.536m0 5.172l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.172l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
							<span>Help</span>
						</button>

						<!-- Divider -->
						<div class="my-2 border-t border-gray-100"></div>

						<form method="POST" action="{base}/logout" bind:this={logoutFormRef}>
							<button
								type="submit"
								disabled={isLoggingOut}
								onclick={handleLogout}
								class="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								<span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
							</button>
						</form>
					</div>
				{/if}
			</div>
		</div>
	</div>
</header>
