<script lang="ts">
	import '$lib/admin/admin.css';
	import Sidebar from './components/layouts/Sidebar.svelte';
	import Topbar from './components/layouts/Topbar.svelte';
	import DebugApiUrl from '$lib/admin/components/DebugApiUrl.svelte';
	import Toast from '$lib/admin/components/Toast.svelte';
	import PageLoader from '$lib/admin/components/PageLoader.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	import { base } from '$lib/admin/paths';
	import { initAdminSession } from '$lib/admin/client-session';

	let { children, data } = $props();

	// Auth state from server data
	let isAuthenticated = $state(false);
	let tokenExpiry = $state<number | null>(null);

	// Initialize auth state from server
	$effect(() => {
		isAuthenticated = data?.isAuthenticated ?? false;
		tokenExpiry = data?.tokenExpiry ?? null;
	});

	// 401/403 handling, expiry countdown and cross-tab logout sync.
	// Scoped to the panel: this never touches storefront requests.
	onMount(() => initAdminSession());

	// Theme management with proper reactive state
	let currentTheme = $state('light');
	let themes = [
		'light',
		'dark',
		'cupcake',
		'bumblebee',
		'emerald',
		'corporate',
		'synthwave',
		'retro',
		'cyberpunk',
		'valentine',
		'halloween',
		'garden',
		'forest',
		'aqua',
		'lofi',
		'pastel',
		'fantasy',
		'wireframe',
		'black',
		'luxury',
		'dracula',
		'cmyk',
		'autumn',
		'business',
		'acid',
		'lemonade',
		'night',
		'coffee',
		'winter'
	];

	// Drawer state for better mobile control
	let drawerOpen = $state(false);

	// Gates the FOUC guard until the daisyUI theme has been applied.
	let themeReady = $state(false);

	onDestroy(() => {
		if (!browser) return;
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.classList.remove('theme-loaded');
		document.documentElement.style.colorScheme = '';
	});

	// Load theme from localStorage on mount
	onMount(() => {
		if (browser) {
			const savedTheme = localStorage.getItem('soccer-admin-theme');
			const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
			const initialTheme = savedTheme && themes.includes(savedTheme) ? savedTheme : preferredTheme;

			applyTheme(initialTheme);
			// Reveal the panel once the theme is applied (prevents a flash of
			// unthemed content). Scoped to `.admin-root` so it can never hide
			// the storefront.
			themeReady = true;
		}
	});

	/**
	 * daisyUI resolves its theme from `[data-theme]` on <html>, so the attribute
	 * has to live there. It is removed on destroy — otherwise it would follow the
	 * visitor back to the storefront, whose `btn` / `card` classes would then
	 * pick up daisyUI styling.
	 */
	function applyTheme(theme: string) {
		if (!browser) return;

		currentTheme = theme;
		localStorage.setItem('soccer-admin-theme', theme);
		document.documentElement.setAttribute('data-theme', theme);
		document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
	}

	// Function to change theme with improved reactivity
	function changeTheme(theme: string) {
		if (!browser) return;

		applyTheme(theme);

		// Trigger a re-render to ensure all components update
		requestAnimationFrame(() => {
			document.documentElement.style.display = 'none';
			document.documentElement.offsetHeight; // Force reflow
			document.documentElement.style.display = '';
		});
	}

	function toggleTheme() {
		changeTheme(currentTheme === 'dark' ? 'light' : 'dark');
	}

	// Handle drawer toggle
	function toggleDrawer() {
		drawerOpen = !drawerOpen;
	}

	// Close drawer when clicking outside (mobile)
	function closeDrawer() {
		drawerOpen = false;
	}

	// User with permission data
	type AdminUser = {
		name: string;
		email: string;
		avatar: string;
		role: string;
		is_superuser: boolean;
		permissions: string[];
	};

	let user: AdminUser = $derived({
		name: 'Administrator',
		email: '',
		avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=A',
		role: 'Admin',
		is_superuser: true,
		permissions: [],
		...(data.user ?? {})
	} as AdminUser);

	interface NavSubItem {
		name: string;
		href: string;
		requiredPermissions?: string[];
	}

	interface NavItem {
		name: string;
		href: string;
		icon: string;
		active?: boolean;
		requiredPermissions?: string[];
		submenu?: NavSubItem[];
	}

	function hasAnyPermission(perms?: string[]): boolean {
		if (user.is_superuser) return true;
		if (!perms || perms.length === 0) return true;
		return perms.some(
			(p) => user.permissions.includes(p) || user.permissions.some((up) => up.endsWith(`.${p}`))
		);
	}

	function canAccessItem(item: NavItem): boolean {
		if (hasAnyPermission(item.requiredPermissions)) return true;
		if (item.submenu && item.submenu.length > 0) {
			return item.submenu.some((sub) => hasAnyPermission(sub.requiredPermissions));
		}
		return false;
	}

	let nav: NavItem[] = [
		{
			name: 'Dashboard',
			href: `${base}/dashboard`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>`
		},
		{
			name: 'Banners',
			href: `${base}/banners`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8 12h8v6H8z"/></svg>`,
			requiredPermissions: ['view_banner']
		},

		{
			name: 'Categories',
			href: `${base}/categories`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
			submenu: [
				{
					name: 'Main Categories',
					href: `${base}/categories/maincategories`,
					requiredPermissions: ['view_category']
				},
				{
					name: 'Sub Categories',
					href: `${base}/categories/subcategories`,
					requiredPermissions: ['view_subcategory']
				}
			]
		},
		{
			name: 'Products',
			href: `${base}/products`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-1-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>`,
			requiredPermissions: ['view_product']
		},
		{
			name: 'Orders',
			href: `${base}/orders`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2V17zm4 0h-2V7h2V17zm4 0h-2v-4h2V17z"/></svg>`,
			requiredPermissions: ['view_orders']
		},
		// {
		// 	name: 'Tours & Packages',
		// 	href: `${base}/tours`,
		// 	icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M17 12c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3zm-8-9h2v2H9zm0 16h2v2H9zm-7-7h2v2H2zm18 0h2v2h-2zM5.66 4.25l1.41 1.41-1.41 1.41L4.25 5.66l1.41-1.41zm12.93 0l1.41 1.41-1.41 1.41-1.41-1.41 1.41-1.41zM12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>`,
		// 	submenu: [
		// 		{
		// 			name: 'Create Tour',
		// 			href: `${base}/tours/create`,
		// 			requiredPermissions: ['add_tour']
		// 		},
		// 		{
		// 			name: 'All Tours',
		// 			href: `${base}/tours`,
		// 			requiredPermissions: ['view_tour']
		// 		},
		// 		{
		// 			name: 'Tour Categories',
		// 			href: `${base}/tours/categories`,
		// 			requiredPermissions: ['view_tourcategory']
		// 		}
		// 	]
		// },
		// {
		// 	name: 'Bookings',
		// 	href: `${base}/tours/bookings`,
		// 	icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>`,
		// 	requiredPermissions: ['view_menu']
		// },
		{
			name: 'Page Manager',
			href: `${base}/menus`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>`,
			requiredPermissions: ['view_menu']
		},
		// {
		// 	name: 'Marketing',
		// 	href: `#`,
		// 	icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-5h-3V4c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h14v3h3l3-3v-1z"/></svg>`
		// },
		{
			name: 'Key Statics',
			href: `${base}/keystatics`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-5h-3V4c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h14v3h3l3-3v-1z"/></svg>`
		},
		{
			name: 'Blogs',
			href: `${base}/blogs`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-5h-3V4c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h14v3h3l3-3v-1z"/></svg>`,
			requiredPermissions: ['view_blog']
		},
		{
			name: 'Testimonials',
			href: `${base}/testimonials`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
					</svg>`,
			requiredPermissions: ['view_testimonials']
		},
		{
			name: 'FAQs',
			href: `${base}/faqs`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>`,
			requiredPermissions: ['view_faq']
		},
		{
			name: 'Services',
			href: `${base}/services`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-.7 0-1.38-.11-2-.32-.61-.21-1.04-.7-1.04-1.35v-2.83c0-.65.43-1.14 1.04-1.35.62-.21 1.3-.32 2-.32.55 0 1 .45 1 1v4.82c0 .55-.45 1-1 1zM4 15.5c.7 0 1.38-.11 2-.32.61-.21 1.04-.7 1.04-1.35v-2.83c0-.65-.43-1.14-1.04-1.35-.62-.21-1.3-.32-2-.32-.55 0-1 .45-1 1v4.82c0 .55.45 1 1 1zM12 1C6.48 1 2 5.48 2 11v3.5C2 16.54 3.96 18 6 18h1v3h2v-3h6v3h2v-3h1c2.04 0 4-1.46 4-3.5V11c0-5.52-4.48-10-10-10z"/></svg>`,
			requiredPermissions: ['view_setting']
		},
		// 		{
		// 			name: 'Enquiries',
		// 			href: `${base}/enquiries`,
		// 			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
		// `,
		// 			requiredPermissions: ['view_setting']
		// 		},
		{
			name: 'Settings',
			href: `${base}/settings`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.62l-1.92-3.32c-.12-.22-.38-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.5-.41h-3.84c-.26 0-.46.17-.49.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.48.1.62l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.1.62l1.92 3.32c.12.22.38.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.03.24.23.41.49.41h3.84c.26 0 .46-.17.49-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.48-.12-.62l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
			requiredPermissions: ['view_setting']
		},
		{
			name: 'Messages',
			href: `${base}/contactform`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24">
				<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
			</svg>`,
			requiredPermissions: ['view_contactform']
		},
		{
			name: 'Users',
			href: `${base}/adminusers`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 4c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm9 0c-.29 0-.62.02-.97.05 1.16.64 2.2 1.77 2.45 3.45H23v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
			requiredPermissions: ['view_buyeruser']
		},
		{
			name: 'Roles',
			href: `${base}/roles`,
			icon: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`,
			requiredPermissions: ['view_group']
		}
	];

	function isActive(item: NavItem, path: string): boolean {
		if (
			item.href &&
			(path === item.href || (item.href !== base && path.startsWith(item.href + '/')))
		)
			return true;
		if (item.submenu) return item.submenu.some((sub) => path === sub.href);
		return false;
	}

	let filteredNav = $derived.by(() => {
		const path = $page.url.pathname;
		return nav
			.filter((item) => canAccessItem(item))
			.map((item) => ({
				...item,
				active: isActive(item, path)
			}));
	});
</script>

<!-- Enhanced layout with responsive sidebar -->
<div
	class="admin-root flex min-h-screen bg-base-100 text-base-content"
	class:admin-theme-ready={themeReady}
>
	<DebugApiUrl />
	<!-- Sidebar for large screens - always visible -->
	<div class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
		<div class="flex min-h-0 flex-1 flex-col border-r border-base-300 bg-base-100">
			<Sidebar nav={filteredNav} {user} {closeDrawer} />
		</div>
	</div>

	<!-- Mobile drawer -->
	<div class="drawer lg:hidden">
		<input id="drawer-toggle" type="checkbox" class="drawer-toggle" bind:checked={drawerOpen} />

		<!-- Main content for mobile -->
		<div class="drawer-content flex min-h-screen flex-col">
			<!-- Clean topbar -->
			<Topbar
				{currentTheme}
				{themes}
				{changeTheme}
				{toggleDrawer}
				{toggleTheme}
				apiToken={data.token}
				{user}
			/>

			<!-- Page content -->
			<main class="flex-1 overflow-auto bg-base-200">
				<div class="p-6">
					<!-- <TokenStatusBanner /> -->
					{@render children()}
				</div>
			</main>
		</div>

		<!-- Mobile sidebar -->
		<div class="drawer-side z-40">
			<label for="drawer-toggle" class="drawer-overlay bg-black/50"></label>
			<div class="min-h-full w-64 border-r border-base-300 bg-base-100">
				<Sidebar nav={filteredNav} {user} {closeDrawer} />
			</div>
		</div>
	</div>

	<!-- Main content for large screens -->
	<div class="hidden lg:ml-64 lg:flex lg:flex-1 lg:flex-col">
		<!-- Clean topbar -->
		<Topbar
			{currentTheme}
			{themes}
			{changeTheme}
			{toggleDrawer}
			{toggleTheme}
			apiToken={data.token}
			{user}
		/>

		<!-- Page content -->
		<main class="flex-1 overflow-auto bg-base-200 shadow-lg">
			<div class="p-6">
				<PageLoader />
				<Toast />
				{@render children()}
			</div>
		</main>
	</div>
</div>

<!-- Theme loading styles -->
<style>
	.admin-root:not(.admin-theme-ready) {
		visibility: hidden;
	}

	.admin-root.admin-theme-ready {
		visibility: visible;
		transition: all 0.3s ease;
	}

	/* Remove gaps and ensure proper positioning */
	.drawer {
		position: relative;
	}

	/* Mobile: drawer-side is hidden by default */
	.drawer-side {
		z-index: 40;
	}

	/* Mobile: Show drawer when toggle is checked */
	.drawer-toggle:checked ~ .drawer-side {
		transform: translateX(0);
	}

	/* Mobile: drawer starts off-screen */
	@media (max-width: 1023px) {
		.drawer-side {
			position: fixed;
			left: 0;
			top: 0;
			bottom: 0;
			width: 16rem;
			transform: translateX(-100%);
			transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		}
	}

	/* Enhanced scrollbar for main content */
	main::-webkit-scrollbar {
		width: 6px;
	}

	main::-webkit-scrollbar-track {
		background: transparent;
	}

	main::-webkit-scrollbar-thumb {
		background: color-mix(in oklab, var(--color-base-content) 20%, transparent);
		border-radius: 3px;
	}

	main::-webkit-scrollbar-thumb:hover {
		background: color-mix(in oklab, var(--color-base-content) 30%, transparent);
	}

	/* Smooth drawer transitions */
	.drawer-side {
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Enhanced backdrop effects */
	.drawer-overlay {
		transition: all 0.3s ease;
	}
</style>
