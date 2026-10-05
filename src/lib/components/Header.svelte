<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import BrandLogo from './BrandLogo.svelte';
	import { fade, scale } from 'svelte/transition';
	import { cartCount } from '$lib/stores/cart';
	import { base } from '$app/paths';
	import { initAuth, user, isLoggedIn, clearAuth } from '$lib/stores/auth';
	import { clearAuthCookies } from '$lib/utils/cookies';
	import { showSuccess } from '$lib/stores/toast';
	import { createApi } from '$lib/api';
	import type { SettingsData } from '$lib/api';
	import type { CategoryData } from '$lib/api/types';
	import { commonSettings, commonCategories, commonServices } from '$lib/stores/common';
	import { getProductUrl } from '$lib/utils/url';
	import { getImageUrl } from '$lib/utils/image';
	const api = createApi(fetch);

	interface SearchProduct {
		id?: number;
		name?: string;
		slug?: string;
		seo_slug?: string;
		image?: string;
		featured_image?: string;
		category_name?: string;
		sale_price?: string | number;
		regular_price?: string | number;
		[key: string]: unknown;
	}
	let settingsData = $derived($commonSettings);
	let serverCartCount = $state(0);
	let logo = $derived(settingsData?.logo || undefined);
	let phoneNumber = $derived(settingsData?.phone_number || '1-800-9000');
	let displayCartCount = $derived($isLoggedIn ? serverCartCount : $cartCount);

	let whatsappNumber = $derived(settingsData?.whatsapp_number || '');
	let whatsappMessage = $derived(settingsData?.whatsapp_message || 'Hello, I have a question');
	let facebookUrl = $derived(settingsData?.facebook_url || '');
	let instagramUrl = $derived(settingsData?.instagram_url || '');

	const announcements = [
		'Free Shipping on Orders Over Rs. 999',
		'Use Code WELCOME10 for 10% Off Your First Order',
		'Sale Up to 50% Off — Limited Time Only'
	];
	let currentAnnouncement = $state(0);
	let announcementInterval: ReturnType<typeof setInterval> | undefined;

	onMount(() => {
		initAuth();
		if ($isLoggedIn) fetchCartCount();
		announcementInterval = setInterval(() => {
			currentAnnouncement = (currentAnnouncement + 1) % announcements.length;
		}, 4000);
		return () => {
			if (announcementInterval) clearInterval(announcementInterval);
		};
	});

	$effect(() => {
		if ($isLoggedIn) fetchCartCount();
	});

	async function fetchCartCount() {
		try {
			const res = await fetch(`${base}/api/cart/count`, { credentials: 'include' });
			if (!res.ok) return;
			const response = await res.json();
			if (response?.success) serverCartCount = response.active_count ?? 0;
		} catch (error) {
			console.error('[CartCount] Fetch failed:', error);
		}
	}

	let isAccountMenuOpen = $state(false);
	let isMobileDrawerOpen = $state(false);
	let isLoggingOut = false;
	let dropdownRef: HTMLDivElement | undefined = $state(undefined);
	let mobileDrawerRef: HTMLDivElement | undefined = $state(undefined);
	let isCurrencyOpen = $state(false);
	let currencyRef: HTMLDivElement | undefined = $state(undefined);
	let selectedCurrency = $state('NRP');
	const currencies = ['NRP'];

	const serviceLinks = [
		{
			key: 'training',
			title: 'Training Services',
			desc: 'Hands-on programs for farmers & technicians'
		},
		{
			key: 'academic',
			title: 'Academic Courses',
			desc: 'Certificate & diploma courses in agriculture'
		},
		{
			key: 'soil',
			title: 'Soil Testing',
			desc: 'Lab analysis of soil health & fertility'
		},
		{
			key: 'fertilizer',
			title: 'Fertilizer Management',
			desc: 'Nutrient plans tailored to your soil'
		}
	];

	const aboutLinks = [
		{
			key: 'introduction',
			title: 'Introduction',
			desc: 'Who we are & what we stand for',
			href: '/about'
		},
		{
			key: 'profile',
			title: 'Company Profile',
			desc: 'Our mission, vision & values',
			href: '/companyprofile'
		},
		{
			key: 'teams',
			title: 'Our Teams',
			desc: 'Meet the people behind AFCRC',
			href: '/ourteam'
		}
	];

	// Services pulled from the shared common-data store (falls back to curated links)
	let serviceNavLinks = $derived.by(() => {
		const fetched = $commonServices;
		if (fetched.length > 0) {
			return fetched.map((s) => ({
				key: s.slug || String(s.id),
				title: s.name,
				desc: s.short_description || '',
				href: `${base}/services/${s.slug || s.id}`
			}));
		}
		return serviceLinks.map((s) => ({
			key: s.key,
			title: s.title,
			desc: s.desc,
			href: `${base}/services#${s.key}`
		}));
	});

	let isAboutOpen = $state(false);
	let aboutRef: HTMLLIElement | undefined = $state(undefined);
	let isServicesOpen = $state(false);
	let servicesRef: HTMLLIElement | undefined = $state(undefined);
	let isProductsOpen = $state(false);
	let productsRef: HTMLLIElement | undefined = $state(undefined);
	let navCategories = $derived<CategoryData[]>($commonCategories);

	// Mobile drawer accordion state (mirrors the desktop main-menu dropdowns)
	let mobileAboutOpen = $state(false);
	let mobileProductsOpen = $state(false);
	let mobileServicesOpen = $state(false);
	function toggleMobileSection(section: 'about' | 'products' | 'services') {
		if (section === 'about') mobileAboutOpen = !mobileAboutOpen;
		else if (section === 'products') mobileProductsOpen = !mobileProductsOpen;
		else mobileServicesOpen = !mobileServicesOpen;
	}
	const closeMobileDrawer = () => {
		isMobileDrawerOpen = false;
		mobileAboutOpen = false;
		mobileProductsOpen = false;
		mobileServicesOpen = false;
	};
	const mobileLinkClass =
		'block cursor-pointer rounded-[6px] border-none bg-none px-4 py-[13px] text-left font-[inherit] text-sm font-medium text-[rgba(245,215,142,0.8)] no-underline transition-all duration-200 hover:bg-[rgba(212,160,23,0.08)] hover:text-[#d4a017]';
	const mobileSectionClass =
		'flex w-full cursor-pointer items-center justify-between rounded-[6px] border-none bg-none px-4 py-[13px] text-left font-[inherit] text-sm font-medium text-[rgba(245,215,142,0.9)] transition-all duration-200 hover:bg-[rgba(212,160,23,0.08)] hover:text-[#d4a017]';

	let isSearchOpen = $state(false);
	let searchQuery = $state('');
	let allProducts = $state<SearchProduct[]>([]);
	let searchLoading = $state(false);
	let searchError = $state(false);
	let searchInput: HTMLInputElement | undefined = $state(undefined);

	$effect(() => {
		if (isSearchOpen) searchInput?.focus();
	});

	let searchResults = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return [];
		return allProducts.filter(
			(p) =>
				p.name?.toLowerCase().includes(q) ||
				p.slug?.toLowerCase().includes(q) ||
				p.seo_slug?.toLowerCase().includes(q) ||
				String(p.id ?? '').includes(q)
		);
	});

	async function openSearch() {
		isSearchOpen = true;
		if (allProducts.length > 0 || searchLoading) return;
		searchLoading = true;
		searchError = false;
		try {
			const products = await api.products.getAllProducts();
			allProducts = Array.isArray(products) ? products : [];
			if (allProducts.length === 0) searchError = true;
		} catch (e) {
			console.error('[Search] Failed to load products', e);
			searchError = true;
		} finally {
			searchLoading = false;
		}
	}

	function closeSearch() {
		isSearchOpen = false;
		searchQuery = '';
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isAccountMenuOpen = false;
		}
		if (currencyRef && !currencyRef.contains(event.target as Node)) {
			isCurrencyOpen = false;
		}
		if (servicesRef && !servicesRef.contains(event.target as Node)) {
			isServicesOpen = false;
		}
		if (productsRef && !productsRef.contains(event.target as Node)) {
			isProductsOpen = false;
		}
		if (aboutRef && !aboutRef.contains(event.target as Node)) {
			isAboutOpen = false;
		}
		if (mobileDrawerRef && !mobileDrawerRef.contains(event.target as Node)) {
			const menuBtn = document.querySelector('.mobile-menu-toggle');
			if (menuBtn && !menuBtn.contains(event.target as Node)) {
				isMobileDrawerOpen = false;
			}
		}
	}

	$effect(() => {
		if (typeof document !== 'undefined') {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	async function logout(event?: Event) {
		if (event) event.preventDefault();
		if (isLoggingOut) return;
		isLoggingOut = true;
		try {
			await api.auth.logout();
		} catch (e) {
			console.error('[Logout] error', e);
		} finally {
			clearAuth();
			clearAuthCookies();
			showSuccess('You are logged out', 2000);
			isLoggingOut = false;
			setTimeout(() => {
				try {
					goto('/');
				} catch (e) {}
			}, 500);
		}
	}
</script>

<!-- Top utility bar -->
<div class="border-b border-white/8 bg-pine p-0 text-xs font-medium text-white max-md:hidden">
	<div
		class="mx-auto flex max-w-[1180px] items-center justify-between px-8 max-md:flex-col max-md:gap-1 max-md:px-4 max-md:py-2 max-md:text-center max-md:text-[11px]"
	>
		<!-- Left: Marquee announcements -->
		<div class="flex items-center gap-3">
			<div class="relative flex h-[34px] w-[380px] items-center overflow-hidden">
				{#each announcements as announcement, i}
					<div
						class="absolute left-0 flex items-center gap-2 transition-all duration-500"
						class:opacity-0={i !== currentAnnouncement}
						class:opacity-100={i === currentAnnouncement}
						class:translate-y-0={i === currentAnnouncement}
						class:translate-y-2={i !== currentAnnouncement}
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="shrink-0 text-gold"
						>
							<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
						</svg>
						<span class="text-xs font-semibold tracking-wide text-white/95">
							{announcement}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Right: Social, WhatsApp, Currency, Auth -->
		<div class="flex items-center gap-2">
			<!-- Social Icons -->
			{#if facebookUrl}
				<a
					href={facebookUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center justify-center rounded-full p-1.5 text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
					aria-label="Facebook"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
						<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
					</svg>
				</a>
			{/if}
			{#if instagramUrl}
				<a
					href={instagramUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center justify-center rounded-full p-1.5 text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
					aria-label="Instagram"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
						<rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
						<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
						<line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
					</svg>
				</a>
			{/if}

			<span class="mx-1 h-3 w-px bg-white/15"></span>

			<!-- WhatsApp -->

			<a
				href="https://wa.me/{whatsappNumber}?text={encodeURIComponent(whatsappMessage)}"
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white/80 transition-all duration-200 hover:bg-[rgba(37,211,102,0.15)] hover:text-white"
				aria-label="Chat on WhatsApp"
			>
				<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"
					/>
				</svg>
				<span class="text-[10px] font-semibold tracking-wide uppercase">WhatsApp</span>
			</a>

			<span class="mx-1 h-3 w-px bg-white/15"></span>

			<!-- Currency Switcher -->
			<div class="relative" bind:this={currencyRef}>
				<button
					class="flex cursor-pointer items-center gap-1 rounded-full border-none px-2.5 py-1 text-xs font-semibold text-white/85 transition-all duration-200 hover:bg-white/15"
					onclick={() => (isCurrencyOpen = !isCurrencyOpen)}
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<path d="M2 12h20" />
						<path
							d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
						/>
					</svg>
					{selectedCurrency}
					<svg
						width="8"
						height="8"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="transition-transform duration-200"
						class:rotate-180={isCurrencyOpen}
					>
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</button>
				{#if isCurrencyOpen}
					<div
						class="absolute top-full left-0 z-[9999] mt-1 min-w-[90px] rounded-lg border border-white/10 bg-pine-dark py-1 shadow-lg"
						transition:fade={{ duration: 100 }}
					>
						{#each currencies as c}
							<button
								class="flex w-full cursor-pointer items-center gap-2 border-none bg-none px-3 py-1.5 text-left text-xs font-medium transition-colors duration-150 hover:bg-white/8 hover:text-white {selectedCurrency ===
								c
									? 'text-white'
									: 'text-white/70'}"
								onclick={() => {
									selectedCurrency = c;
									isCurrencyOpen = false;
								}}
							>
								<span
									class="flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[8px] font-bold {selectedCurrency ===
									c
										? 'border-gold bg-gold text-pine-dark'
										: 'border-white/20'}"
								>
									{selectedCurrency === c ? '✓' : ''}
								</span>
								{c}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<span class="mx-1 h-3 w-px bg-white/15"></span>

			<!-- Sign Up / Track Order -->
			{#if $isLoggedIn}
				<a
					href="{base}/myaccount/orders"
					class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide text-white/85 no-underline transition-all duration-200 hover:bg-white/10 hover:text-white"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
						<line x1="3" y1="9" x2="21" y2="9" />
						<line x1="9" y1="21" x2="9" y2="9" />
					</svg>
					Track Order
				</a>
			{:else}
				<a
					href="{base}/register"
					class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase no-underline transition-all duration-200 hover:border-white hover:bg-white hover:text-pine-dark hover:shadow-[0_2px_12px_rgba(255,255,255,0.2)]"
				>
					<svg
						width="11"
						height="11"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
						<polyline points="10 17 15 12 10 7" />
						<line x1="15" y1="12" x2="3" y2="12" />
					</svg>
					Sign Up
				</a>
			{/if}
		</div>
	</div>
</div>

<!-- Main Navbar -->
<nav class="sticky top-0 z-[100] border-b border-white/25 bg-paper-white">
	<div
		class="mx-auto flex h-[70px] max-w-[1180px] items-center justify-between gap-5 px-8 max-md:h-[90px] max-md:px-4"
	>
		<!-- Logo -->
		<div class="flex shrink-0 items-center">
			<BrandLogo {logo} />
		</div>

		<!-- Nav Links -->
		<ul class="m-0 flex flex-1 list-none justify-center gap-2 p-0 max-md:hidden">
			<li
				class="relative"
				bind:this={aboutRef}
				onmouseenter={() => (isAboutOpen = true)}
				onmouseleave={() => (isAboutOpen = false)}
			>
				<div class="flex items-center">
					<a
						href="{base}/about"
						class="rounded-[6px] px-[18px] text-sm font-semibold tracking-[0.8px] text-[#0b5d1e] uppercase no-underline transition-all duration-200 hover:-translate-y-px hover:bg-[rgba(212,160,23,0.12)] hover:text-[#d4a017]"
						>About Us</a
					>
					<button
						type="button"
						class="ml-[-6px] cursor-pointer border-none bg-transparent p-1.5 text-[#0b5d1e]"
						class:rotate-180={isAboutOpen}
						aria-label="Toggle about menu"
						aria-haspopup="true"
						aria-expanded={isAboutOpen}
						onclick={() => (isAboutOpen = !isAboutOpen)}
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="transition-transform duration-200"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>
				</div>

				{#if isAboutOpen}
					<div
						class="absolute top-full left-1/2 z-[110] w-[300px] -translate-x-1/2 pt-3"
						transition:fade={{ duration: 150 }}
					>
						<div
							class="overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_18px_40px_-16px_rgba(20,40,20,0.28)]"
						>
							{#each aboutLinks as item (item.key)}
								<a
									href="{base}{item.href}"
									class="group flex items-start gap-3 px-4 py-3 no-underline transition-colors duration-200 hover:bg-[rgba(11,93,30,0.06)]"
									onclick={() => (isAboutOpen = false)}
								>
									<span
										class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(11,93,30,0.09)] text-[#0b5d1e] transition-colors duration-200 group-hover:bg-[#d4a017] group-hover:text-white"
									>
										{#if item.key === 'introduction'}
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<circle cx="12" cy="12" r="10" />
												<path d="M12 16v-4" />
												<path d="M12 8h.01" />
											</svg>
										{:else if item.key === 'profile'}
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M4 22h16" />
												<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
												<path d="M10 7h4" />
												<path d="M10 11h4" />
												<path d="M10 15h4" />
											</svg>
										{:else}
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
												<circle cx="9" cy="7" r="4" />
												<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
												<path d="M16 3.13a4 4 0 0 1 0 7.75" />
											</svg>
										{/if}
									</span>
									<span class="min-w-0">
										<span class="block text-sm font-bold text-[#17301c]">{item.title}</span>
										<span class="block text-xs leading-snug text-[#6b6b66]">{item.desc}</span>
									</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</li>
			<li
				class="relative"
				bind:this={productsRef}
				onmouseenter={() => (isProductsOpen = true)}
				onmouseleave={() => (isProductsOpen = false)}
			>
				<div class="flex items-center">
					<span
						class="cursor-default rounded-[6px] px-[18px] text-sm font-semibold tracking-[0.8px] text-[#0b5d1e] uppercase transition-all duration-200"
						aria-haspopup="true"
						aria-expanded={isProductsOpen}>Products</span
					>
					<button
						type="button"
						class="ml-[-6px] cursor-pointer border-none bg-transparent p-1.5 text-[#0b5d1e]"
						class:rotate-180={isProductsOpen}
						aria-label="Toggle products menu"
						aria-haspopup="true"
						aria-expanded={isProductsOpen}
						onclick={() => (isProductsOpen = !isProductsOpen)}
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="transition-transform duration-200"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>
				</div>

				{#if isProductsOpen}
					<div
						class="absolute top-full left-1/2 z-[110] w-[300px] -translate-x-1/2 pt-3"
						transition:fade={{ duration: 150 }}
					>
						<div
							class="max-h-[60vh] overflow-y-auto rounded-xl border border-black/8 bg-white shadow-[0_18px_40px_-16px_rgba(20,40,20,0.28)]"
						>
							{#if navCategories.length === 0}
								<div class="px-4 py-5 text-center text-xs text-[#6b6b66]">Loading categories…</div>
							{:else}
								{#each navCategories as cat (cat.id)}
									<a
										href="{base}/product/{cat.seo_slug}"
										class="group flex items-center gap-3 px-4 py-3 no-underline transition-colors duration-200 hover:bg-[rgba(11,93,30,0.06)]"
										onclick={() => (isProductsOpen = false)}
									>
										<span
											class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[rgba(11,93,30,0.09)] text-[#0b5d1e]"
										>
											{#if cat.featured_image}
												<img
													src={getImageUrl(cat.featured_image)}
													alt={cat.name}
													class="h-full w-full object-cover"
													loading="lazy"
												/>
											{:else}
												<svg
													width="16"
													height="16"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path
														d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
													/>
													<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
												</svg>
											{/if}
										</span>
										<span class="min-w-0">
											<span class="block text-sm font-bold text-[#17301c]">{cat.name}</span>
											{#if cat.description}
												<span class="block truncate text-xs leading-snug text-[#6b6b66]">
													{cat.description}
												</span>
											{/if}
										</span>
									</a>
								{/each}
							{/if}
						</div>
					</div>
				{/if}
			</li>
			<li
				class="relative"
				bind:this={servicesRef}
				onmouseenter={() => (isServicesOpen = true)}
				onmouseleave={() => (isServicesOpen = false)}
			>
				<div class="flex items-center">
					<a
						href="{base}/services"
						class="rounded-[6px] px-[18px] text-sm font-semibold tracking-[0.8px] text-[#0b5d1e] uppercase no-underline transition-all duration-200 hover:-translate-y-px hover:bg-[rgba(212,160,23,0.12)] hover:text-[#d4a017]"
						>Services</a
					>
					<button
						type="button"
						class="ml-[-6px] cursor-pointer border-none bg-transparent p-1.5 text-[#0b5d1e]"
						class:rotate-180={isServicesOpen}
						aria-label="Toggle services menu"
						aria-haspopup="true"
						aria-expanded={isServicesOpen}
						onclick={() => (isServicesOpen = !isServicesOpen)}
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="transition-transform duration-200"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>
				</div>

				{#if isServicesOpen}
					<div
						class="absolute top-full left-1/2 z-[110] w-[300px] -translate-x-1/2 pt-3"
						transition:fade={{ duration: 150 }}
					>
						<div
							class="overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_18px_40px_-16px_rgba(20,40,20,0.28)]"
						>
							{#each serviceNavLinks as service (service.key)}
								<a
									href={service.href}
									class="group flex items-start gap-3 px-4 py-3 no-underline transition-colors duration-200 hover:bg-[rgba(11,93,30,0.06)]"
									onclick={() => (isServicesOpen = false)}
								>
									<span
										class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(11,93,30,0.09)] text-[#0b5d1e] transition-colors duration-200 group-hover:bg-[#d4a017] group-hover:text-white"
									>
										{#if service.key === 'training'}
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M2 3h20" />
												<path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
												<path d="m7 21 5-5 5 5" />
											</svg>
										{:else if service.key === 'academic'}
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path
													d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"
												/>
												<path d="M22 10v6" />
												<path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
											</svg>
										{:else if service.key === 'soil'}
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="m21 7-6.82 6.82a2.83 2.83 0 1 1-4-4L17 3" />
												<path d="m16 2 6 6" />
												<path d="M22 16 16 22" />
											</svg>
										{:else}
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path
													d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
												/>
												<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
											</svg>
										{/if}
									</span>
									<span class="min-w-0">
										<span class="block text-sm font-bold text-[#17301c]">{service.title}</span>
										<span class="block text-xs leading-snug text-[#6b6b66]">{service.desc}</span>
									</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</li>
			<li>
				<a
					href="{base}/blogs"
					class="rounded-[6px] px-[18px] py-[10px] text-sm font-semibold tracking-[0.8px] text-[#0b5d1e] uppercase no-underline transition-all duration-200 hover:-translate-y-px hover:bg-[rgba(212,160,23,0.12)] hover:text-[#d4a017]"
					>Blogs</a
				>
			</li>
			<li>
				<a
					href="{base}/contact"
					class="rounded-[6px] px-[18px] py-[10px] text-sm font-semibold tracking-[0.8px] text-[#0b5d1e] uppercase no-underline transition-all duration-200 hover:-translate-y-px hover:bg-[rgba(212,160,23,0.12)] hover:text-[#d4a017]"
					>Contact</a
				>
			</li>
		</ul>

		<!-- Right Icons -->
		<div class="flex shrink-0 items-center gap-3 max-md:hidden">
			<button
				class="relative flex cursor-pointer items-center justify-center p-[10px] text-[#0b5d1e] no-underline transition-all duration-200 hover:scale-105 hover:bg-[#0b5d1e] hover:text-[#f5f5f5]"
				aria-label="Search"
				onclick={openSearch}
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.35-4.35"></path>
				</svg>
			</button>

			<a
				href="{base}/cart"
				class="relative flex cursor-pointer items-center justify-center rounded-[8px] border-none bg-none p-[10px] text-[#0b5d1e] no-underline transition-all duration-200 hover:scale-105 hover:bg-[#0b5d1e] hover:text-[#f5f5f5]"
				aria-label="Cart"
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="8" cy="21" r="1"></circle>
					<circle cx="19" cy="21" r="1"></circle>
					<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
					></path>
				</svg>
				{#if displayCartCount > 0}
					<span
						class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#1a0d00] bg-[#d4a017] text-[11px] font-black text-[#f5f5f5] shadow-[0_2px_6px_rgba(212,160,23,0.4)]"
						transition:scale={{ duration: 200 }}
					>
						{displayCartCount > 99 ? '99+' : displayCartCount}
					</span>
				{/if}
			</a>

			{#if $isLoggedIn}
				<div class="relative" bind:this={dropdownRef}>
					<button
						class="relative flex cursor-pointer items-center justify-center rounded-full border-none bg-none p-[10px] text-[#0b5d1e] no-underline transition-all duration-200 hover:scale-105 hover:bg-[rgba(11,93,30,0.08)]"
						onclick={() => (isAccountMenuOpen = !isAccountMenuOpen)}
						aria-label="Account"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
							<circle cx="12" cy="7" r="4"></circle>
						</svg>
					</button>
					{#if isAccountMenuOpen}
						<div
							class="absolute top-[calc(100%+10px)] right-0 z-[9999] min-w-[200px] rounded-xl border border-black/8 bg-white p-[6px] shadow-[0_4px_24px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.06)]"
							transition:fade={{ duration: 150 }}
						>
							<div class="flex items-center gap-2 px-3 pt-[10px] pb-[6px]">
								<span class="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
								></span>
								<span class="text-xs font-bold tracking-[0.5px] text-gray-500 uppercase"
									>Account</span
								>
							</div>
							<div class="mx-2 my-1 h-px bg-black/6"></div>
							<a
								href="/myaccount"
								class="group flex w-full cursor-pointer items-center gap-[10px] rounded-[8px] border-none bg-none px-3 py-[9px] text-left font-[inherit] text-sm font-medium text-gray-800 no-underline transition-all duration-150 hover:bg-gray-100 hover:text-[#0b5d1e]"
							>
								<span
									class="flex items-center justify-center opacity-50 transition-opacity duration-150 group-hover:opacity-100"
								>
									<svg
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										><circle cx="12" cy="7" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></svg
									>
								</span>
								My Account
							</a>
							<a
								href="/myaccount/orders"
								class="group flex w-full cursor-pointer items-center gap-[10px] rounded-[8px] border-none bg-none px-3 py-[9px] text-left font-[inherit] text-sm font-medium text-gray-800 no-underline transition-all duration-150 hover:bg-gray-100 hover:text-[#0b5d1e]"
							>
								<span
									class="flex items-center justify-center opacity-50 transition-opacity duration-150 group-hover:opacity-100"
								>
									<svg
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line
											x1="3"
											y1="6"
											x2="21"
											y2="6"
										/><path d="M16 10a4 4 0 0 1-8 0" /></svg
									>
								</span>
								My Orders
							</a>
							<a
								href="/myaccount/returns"
								class="group flex w-full cursor-pointer items-center gap-[10px] rounded-[8px] border-none bg-none px-3 py-[9px] text-left font-[inherit] text-sm font-medium text-gray-800 no-underline transition-all duration-150 hover:bg-gray-100 hover:text-[#0b5d1e]"
							>
								<span
									class="flex items-center justify-center opacity-50 transition-opacity duration-150 group-hover:opacity-100"
								>
									<svg
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										><polyline points="1 4 1 10 7 10" /><path
											d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"
										/></svg
									>
								</span>
								Returns
							</a>
							<div class="mx-2 my-1 h-px bg-black/6"></div>
							<button
								class="group flex w-full cursor-pointer items-center gap-[10px] rounded-[8px] border-none bg-none px-3 py-[9px] text-left font-[inherit] text-sm font-medium text-gray-800 no-underline transition-all duration-150 hover:bg-gray-100 hover:bg-red-50 hover:text-[#0b5d1e] hover:text-red-600"
								onclick={() => logout()}
							>
								<span
									class="flex items-center justify-center opacity-50 transition-opacity duration-150 group-hover:opacity-100"
								>
									<svg
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
											points="16 17 21 12 16 7"
										/><line x1="21" y1="12" x2="9" y2="12" /></svg
									>
								</span>
								Sign Out
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Mobile toggle -->
		<button
			class="hidden cursor-pointer rounded-[6px] border-none bg-pine bg-none p-2 text-[#fff] hover:bg-[rgba(212,160,23,0.1)] hover:text-[#d4a017] max-md:flex"
			aria-label="Open menu"
			onclick={() => (isMobileDrawerOpen = !isMobileDrawerOpen)}
		>
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<line x1="3" y1="6" x2="21" y2="6"></line>
				<line x1="3" y1="12" x2="21" y2="12"></line>
				<line x1="3" y1="18" x2="21" y2="18"></line>
			</svg>
		</button>
	</div>
</nav>

<!-- Mobile Drawer -->
{#if isMobileDrawerOpen}
	<div
		class="fixed inset-0 z-[998] bg-black/70"
		role="button"
		tabindex="0"
		transition:fade={{ duration: 200 }}
		onclick={() => (isMobileDrawerOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (isMobileDrawerOpen = false)}
	></div>
	<div
		class="fixed top-0 right-0 z-[999] h-screen w-[300px] overflow-y-auto border-l border-[rgba(212,160,23,0.15)] bg-[#1a0d00]"
		bind:this={mobileDrawerRef}
		transition:scale={{ duration: 200, start: 0.95 }}
	>
		<div
			class="flex items-center justify-between border-b border-[rgba(212,160,23,0.15)] bg-[#2d1800] px-5 py-[18px]"
		>
			<span class="text-lg font-bold text-[#d4a017]">Menu</span>
			<button
				class="cursor-pointer rounded-[6px] border-none bg-none p-[6px] text-[rgba(245,215,142,0.7)] hover:text-[#d4a017]"
				onclick={() => (isMobileDrawerOpen = false)}
				aria-label="Close"
			>
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
		<div class="flex flex-col gap-[2px] p-3">
			<a href="{base}/" class={mobileLinkClass} onclick={closeMobileDrawer}>Home</a>

			<!-- About Us submenu -->
			<button
				type="button"
				class={mobileSectionClass}
				aria-expanded={mobileAboutOpen}
				aria-haspopup="true"
				onclick={() => toggleMobileSection('about')}
			>
				About Us
				<svg
					class:rotate-180={mobileAboutOpen}
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="shrink-0 transition-transform duration-200"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>
			{#if mobileAboutOpen}
				<div class="flex flex-col gap-[2px] pl-3">
					{#each aboutLinks as item (item.key)}
						<a
							href="{base}{item.href}"
							class="block cursor-pointer rounded-[6px] border-none bg-none px-4 py-[11px] text-left font-[inherit] text-sm text-[rgba(245,215,142,0.65)] no-underline transition-all duration-200 hover:bg-[rgba(212,160,23,0.08)] hover:text-[#d4a017]"
							onclick={closeMobileDrawer}>{item.title}</a
						>
					{/each}
				</div>
			{/if}

			<a href="{base}/shop" class={mobileLinkClass} onclick={closeMobileDrawer}>Shop</a>

			<!-- Products submenu -->
			<button
				type="button"
				class={mobileSectionClass}
				aria-expanded={mobileProductsOpen}
				aria-haspopup="true"
				onclick={() => toggleMobileSection('products')}
			>
				Products
				<svg
					class:rotate-180={mobileProductsOpen}
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="shrink-0 transition-transform duration-200"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>
			{#if mobileProductsOpen}
				<div class="flex flex-col gap-[2px] pl-3">
					{#if navCategories.length === 0}
						<div class="px-4 py-3 text-xs text-[rgba(245,215,142,0.5)]">Loading categories…</div>
					{:else}
						{#each navCategories as cat (cat.id)}
							<a
								href="{base}/product/{cat.seo_slug}"
								class="block cursor-pointer rounded-[6px] border-none bg-none px-4 py-[11px] text-left font-[inherit] text-sm text-[rgba(245,215,142,0.65)] no-underline transition-all duration-200 hover:bg-[rgba(212,160,23,0.08)] hover:text-[#d4a017]"
								onclick={closeMobileDrawer}>{cat.name}</a
							>
						{/each}
					{/if}
				</div>
			{/if}

			<!-- Services submenu -->
			<button
				type="button"
				class={mobileSectionClass}
				aria-expanded={mobileServicesOpen}
				aria-haspopup="true"
				onclick={() => toggleMobileSection('services')}
			>
				Services
				<svg
					class:rotate-180={mobileServicesOpen}
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="shrink-0 transition-transform duration-200"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>
			{#if mobileServicesOpen}
				<div class="flex flex-col gap-[2px] pl-3">
					{#each serviceNavLinks as service (service.key)}
						<a
							href={service.href}
							class="block cursor-pointer rounded-[6px] border-none bg-none px-4 py-[11px] text-left font-[inherit] text-sm text-[rgba(245,215,142,0.65)] no-underline transition-all duration-200 hover:bg-[rgba(212,160,23,0.08)] hover:text-[#d4a017]"
							onclick={closeMobileDrawer}>{service.title}</a
						>
					{/each}
				</div>
			{/if}

			<a href="{base}/blogs" class={mobileLinkClass} onclick={closeMobileDrawer}>Blogs</a>
			<a href="{base}/contact" class={mobileLinkClass} onclick={closeMobileDrawer}>Contact</a>
		</div>
	</div>
{/if}

<!-- Search Overlay -->
{#if isSearchOpen}
	<div
		class="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-sm"
		role="button"
		tabindex="0"
		transition:fade={{ duration: 150 }}
		onclick={closeSearch}
		onkeydown={(e) => {
			if (e.key === 'Escape') closeSearch();
		}}
	></div>
	<div
		class="fixed top-0 right-0 left-0 z-[1101] mx-auto max-w-[720px] px-6 pt-[9vh] max-md:px-4"
		transition:scale={{ duration: 200, start: 0.96 }}
	>
		<div
			class="overflow-hidden rounded-2xl border border-gold/25 bg-pine-dark shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)]"
		>
			<div class="flex items-center gap-3 border-b border-white/10 px-5 py-4">
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="#d4a017"
					stroke-width="2"
					class="shrink-0"
				>
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.35-4.35"></path>
				</svg>
				<input
					bind:value={searchQuery}
					bind:this={searchInput}
					type="search"
					placeholder="Search products..."
					aria-label="Search products"
					class="w-full flex-1 bg-transparent text-[1rem] text-white outline-none placeholder:text-white/40"
					onkeydown={(e) => {
						if (e.key === 'Escape') closeSearch();
					}}
				/>
				<button
					class="cursor-pointer rounded-lg border-none bg-none p-1 text-white/50 transition-colors duration-200 hover:text-white"
					aria-label="Close search"
					onclick={closeSearch}
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div class="max-h-[60vh] overflow-y-auto p-2">
				{#if searchLoading}
					<div class="px-4 py-6 text-center text-sm text-white/50">Loading products…</div>
				{:else if searchError && allProducts.length === 0}
					<div class="px-4 py-6 text-center text-sm text-white/50">
						No products available right now.
					</div>
				{:else if searchQuery.trim() === ''}
					<div class="px-4 py-6 text-center text-sm text-white/50">
						Start typing to search our catalog.
					</div>
				{:else if searchResults.length === 0}
					<div class="px-4 py-6 text-center text-sm text-white/50">
						No products match “{searchQuery.trim()}”.
					</div>
				{:else}
					<ul class="m-0 flex list-none flex-col gap-1 p-0">
						{#each searchResults.slice(0, 12) as product (product.slug || product.id || product.name)}
							<li>
								<a
									href={getProductUrl(product)}
									class="flex items-center gap-3 rounded-xl px-3 py-2.5 no-underline transition-colors duration-150 hover:bg-white/8"
									onclick={closeSearch}
								>
									{#if product.image || product.featured_image}
										<img
											src={product.image || product.featured_image}
											alt={product.name}
											class="h-12 w-12 shrink-0 rounded-lg bg-white/10 object-cover"
											loading="lazy"
										/>
									{:else}
										<div
											class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 font-mono text-[0.6rem] text-white/40"
										>
											IMG
										</div>
									{/if}
									<div class="min-w-0 flex-1">
										<div class="truncate text-[0.95rem] font-medium text-white">
											{product.name}
										</div>
										{#if product.category_name}
											<div
												class="truncate font-mono text-[0.65rem] tracking-[0.08em] text-white/40 uppercase"
											>
												{product.category_name}
											</div>
										{/if}
									</div>
									{#if product.sale_price || product.regular_price}
										<div class="shrink-0 text-right">
											<div class="font-mono text-[0.85rem] font-semibold text-gold">
												Rs. {product.sale_price || product.regular_price}
											</div>
											{#if product.sale_price && product.regular_price}
												<div class="font-mono text-[0.65rem] text-white/35 line-through">
													Rs. {product.regular_price}
												</div>
											{/if}
										</div>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>
{/if}
