<script lang="ts">
	import { showSuccess, showError } from '$lib/stores/toast';
	import footerlogo from '$lib/images/footerlogo.jpeg';
	import { base } from '$app/paths';
	import { commonSettings, commonCategories } from '$lib/stores/common';
	import { categories } from '$lib/stores/categories';
	import { getImageUrl } from '$lib/utils/image';
	import { categoriesDrawerOpen } from '$lib/stores/categoriesDrawer';

	let email = $state('');
	let isSubscribing = $state(false);
	let isSubscribed = $state(false);

	// Categories drawer visibility — controlled via shared store so the
	// MobileBottomNav (rendered separately in the layout) can open it.
	const drawerOpen = $derived($categoriesDrawerOpen);
	const closeDrawer = () => categoriesDrawerOpen.set(false);

	let settingsData = $derived($commonSettings);

	let contactEmail = $derived(settingsData?.email || 'info@afcrc.com');
	let contactPhone = $derived(settingsData?.phone_number || '+977 1-990-0000');
	let contactAddress = $derived(
		[
			settingsData?.address_line1,
			settingsData?.address_line2,
			settingsData?.city,
			settingsData?.state
		]
			.filter(Boolean)
			.join(', ') || 'Kathmandu, Nepal'
	);
	let contactCountry = $derived(settingsData?.country || 'Nepal');
	let workingHours = $derived(settingsData?.working_hours || 'Sun – Fri, 8:00 AM – 6:00 PM');
	let facebookUrl = $derived(
		settingsData?.facebook_url || 'https://www.facebook.com/profile.php?id=100066542056042'
	);
	let instagramUrl = $derived(settingsData?.instagram_url || facebookUrl);
	let tiktokUrl = $derived(settingsData?.tiktok_url || facebookUrl);

	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	async function handleSubscribe(event: SubmitEvent) {
		event.preventDefault();
		if (!EMAIL_RE.test(email)) {
			showError('Please enter a valid email address.');
			return;
		}
		isSubscribing = true;
		await new Promise((r) => setTimeout(r, 600));
		isSubscribing = false;
		isSubscribed = true;
		showSuccess("You're on the list! Welcome to the AFCRC newsletter.");
		email = '';
		setTimeout(() => (isSubscribed = false), 4000);
	}
</script>

<footer class="relative overflow-hidden bg-pine-dark pt-[80px] pb-[32px] text-[#C9CDC2]">
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent"
	></div>
	<div
		class="pointer-events-none absolute -top-40 left-1/2 h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-teal/15 blur-[120px]"
	></div>

	<div class="relative mx-auto max-w-[1280px] px-[40px] max-md:px-[22px]">
		<div
			class="via-gold-dark relative mb-[46px] overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-teal/25 to-pine-dark/80 p-[30px] max-md:p-[26px]"
		>
			<div
				class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gold/15 blur-[60px]"
			></div>
			<div class="relative flex flex-col items-center justify-between gap-6 lg:flex-row">
				<div class="max-w-[420px] text-center lg:text-left">
					<div class="mb-2 font-mono text-[0.72rem] tracking-[0.14em] text-gold uppercase">
						Stay in the loop
					</div>
					<h4 class="font-serif text-[1.5rem] font-semibold tracking-[-0.01em] text-paper">
						Get product drops &amp; farm-fresh updates
					</h4>
				</div>
				{#if isSubscribed}
					<div
						class="flex w-full max-w-[440px] items-center justify-center gap-3 rounded-xl border border-gold/50 bg-gold/10 px-6 py-4 text-gold"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M20 6L9 17l-5-5" />
						</svg>
						<span class="text-[0.95rem] font-medium">Subscribed! Watch your inbox.</span>
					</div>
				{:else}
					<form
						onsubmit={handleSubscribe}
						class="flex w-full max-w-[440px] items-center gap-2 rounded-xl border border-white/15 bg-white/8 p-2 backdrop-blur-sm transition-colors duration-300 focus-within:border-gold/60"
					>
						<input
							bind:value={email}
							type="email"
							required
							placeholder="Enter your email address"
							aria-label="Email address"
							class="w-full flex-1 bg-transparent px-3 py-2 text-[0.95rem] text-paper outline-none placeholder:text-[#8B9184]"
						/>
						<button
							type="submit"
							disabled={isSubscribing}
							class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-[0.85rem] font-semibold tracking-[0.04em] text-pine-dark uppercase transition-all duration-300 hover:bg-paper hover:shadow-[0_8px_24px_-8px_rgba(251,233,186,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{#if isSubscribing}
								<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
									/>
								</svg>
								<span>Wait…</span>
							{:else}
								<span>Subscribe</span>
							{/if}
						</button>
					</form>
				{/if}
			</div>
		</div>

		<div
			class="grid grid-cols-[1.35fr_0.7fr_0.7fr_1.1fr] gap-x-10 gap-y-10 pb-[50px] max-lg:grid-cols-2 max-md:grid-cols-1"
		>
			<div class="footer-brand">
				<h5
					class="mb-[16px] max-w-[300px] font-serif text-[18px] font-bold tracking-[0.12em] text-paper uppercase"
				>
					Agricultural & Forest Conservation Research Centre (AFCRC)
				</h5>
				<p class="text-[0.9rem]text-paper max-w-[350px] font-serif">
					AFCRC brings production, packaging and distribution together under one standard — premium
					meat, agricultural products, herbal supplements and beverages, sourced and delivered with
					care.
				</p>
				<div class="mt-[22px] flex gap-3">
					<a
						href={facebookUrl}
						target="_blank"
						rel="noopener"
						aria-label="Facebook"
						class="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/20 transition-all duration-250 hover:border-gold hover:bg-gold hover:text-pine-dark"
					>
						<svg width="17" height="17" viewBox="0 0 24 24" fill="none">
							<path
								d="M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H7v4h3v7h4v-7h3l1-4h-4V9c0-.6.4-1 1-1z"
								stroke="currentColor"
								stroke-width="1.3"
							/>
						</svg>
					</a>
					<a
						href={instagramUrl}
						target="_blank"
						rel="noopener"
						aria-label="Instagram"
						class="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/20 transition-all duration-250 hover:border-gold hover:bg-gold hover:text-pine-dark"
					>
						<svg
							width="17"
							height="17"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"
						>
							<rect x="3" y="3" width="18" height="18" rx="5" />
							<circle cx="12" cy="12" r="4" />
							<circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
						</svg>
					</a>
					<a
						href={tiktokUrl}
						target="_blank"
						rel="noopener"
						aria-label="TikTok"
						class="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/20 transition-all duration-250 hover:border-gold hover:bg-gold hover:text-pine-dark"
					>
						<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M16 3c.3 2.3 1.7 3.9 4 4.2v3c-1.6 0-3-.5-4-1.3v6.6c0 3.4-2.7 5.5-5.4 5.5C7.2 21 5 18.9 5 16.2c0-3 2.6-5.2 5.7-4.9v3.1c-1.4-.4-2.8.5-2.8 1.9 0 1.2 1 2.1 2.3 2.1 1.4 0 2.5-1.1 2.5-2.6V3h3.3z"
							/>
						</svg>
					</a>
				</div>
			</div>

			<div>
				<h5
					class="mb-[20px] font-serif text-[18px] font-bold tracking-[0.12em] text-paper uppercase"
				>
					Quick Links
				</h5>
				<ul class="m-0 flex list-none flex-col gap-3 p-0">
					<li>
						<a
							href="/"
							class="group inline-flex items-center gap-2 text-[0.9rem] text-inherit no-underline transition-colors duration-200 hover:text-white"
						>
							<span class="h-px w-0 bg-gold transition-all duration-300 group-hover:w-3"></span>Home
						</a>
					</li>
					<li>
						<a
							href="{base}/about"
							class="group inline-flex items-center gap-2 text-[0.9rem] text-inherit no-underline transition-colors duration-200 hover:text-white"
						>
							<span class="h-px w-0 bg-gold transition-all duration-300 group-hover:w-3"
							></span>About Us
						</a>
					</li>

					<li>
						<a
							href="{base}/outteam"
							class="group inline-flex items-center gap-2 text-[0.9rem] text-inherit no-underline transition-colors duration-200 hover:text-white"
						>
							<span class="h-px w-0 bg-gold transition-all duration-300 group-hover:w-3"></span>Our
							Team
						</a>
					</li>
					<li>
						<a
							href="{base}/contact"
							class="group inline-flex items-center gap-2 text-[0.9rem] text-inherit no-underline transition-colors duration-200 hover:text-white"
						>
							<span class="h-px w-0 bg-gold transition-all duration-300 group-hover:w-3"
							></span>Contact
						</a>
					</li>
				</ul>
			</div>

			<div>
				<h5
					class="mb-[20px] font-serif text-[18px] font-bold tracking-[0.12em] text-paper uppercase"
				>
					Products
				</h5>
				<ul class="m-0 flex list-none flex-col gap-3 p-0">
					{#each $commonCategories as category}
						<li>
							<a
								href="{base}/product/{category.seo_slug}"
								class="group inline-flex items-center gap-2 text-[0.9rem] text-inherit no-underline transition-colors duration-200 hover:text-white"
							>
								<span class="h-px w-0 bg-gold transition-all duration-300 group-hover:w-3"
								></span>{category.name}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<div>
				<h5
					class="mb-[20px] font-serif text-[18px] font-bold tracking-[0.12em] text-paper uppercase"
				>
					Contact
				</h5>
				<ul class="m-0 flex list-none flex-col gap-3.5 p-0">
					<li class="flex items-start gap-3">
						<span
							class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-gold"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
							>
								<path d="M3 6h18v12H3z" />
								<path d="M3 6l9 7 9-7" />
							</svg>
						</span>
						<div>
							<div class="text-[0.78rem] tracking-wider text-[#8B9184] uppercase">Email</div>
							<a
								href="mailto:{contactEmail}"
								class="text-[0.9rem] text-inherit no-underline transition-colors duration-200 hover:text-gold"
								>{contactEmail}</a
							>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span
							class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-gold"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
							>
								<path d="M4 5h16v14H4z" />
								<path d="M4 5l8 7 8-7" />
							</svg>
						</span>
						<div>
							<div class="text-[0.78rem] tracking-wider text-[#8B9184] uppercase">Phone</div>
							<a
								href="tel:{contactPhone}"
								class="text-[0.9rem] text-inherit no-underline transition-colors duration-200 hover:text-gold"
								>{contactPhone}</a
							>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span
							class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-gold"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
							>
								<path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
								<circle cx="12" cy="10" r="2.5" />
							</svg>
						</span>
						<div>
							<div class="text-[0.78rem] tracking-wider text-[#8B9184] uppercase">Address</div>
							<span class="text-[0.9rem]">{contactAddress}, {contactCountry}</span>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Drawer Backdrop -->
	{#if drawerOpen}
		<div class="drawer-backdrop" onclick={closeDrawer} role="presentation"></div>
	{/if}

	<!-- Categories Drawer -->
	<div class="categories-drawer" class:drawer-open={drawerOpen}>
		<div class="drawer-header">
			<h2 class="drawer-title">Explore Products</h2>
			<button class="drawer-close" onclick={closeDrawer} aria-label="Close categories">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		<ul class="drawer-list">
			{#each $commonCategories as category}
				<li>
					<a href="{base}/product/{category.slug}" class="drawer-item" onclick={closeDrawer}>
						<div class="drawer-item-icon">
							<img src={getImageUrl(category.featured_image)} alt={category.name} />
						</div>
						<span class="drawer-item-label">{category.name}</span>
						<svg
							class="drawer-chevron"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6" />
						</svg>
					</a>
				</li>
			{/each}
		</ul>
	</div>

	<div class="relative mx-auto max-w-[1280px] px-[40px] max-md:px-[22px]">
		<div
			class="flex items-center justify-between border-t border-white/12 pt-[26px] text-[0.82rem] text-[#8B9184] max-md:flex-col max-md:gap-3"
		>
			<span>&copy; 2026 AFCRC. All rights reserved.</span>
			<div class="hidden items-center gap-2 md:flex">
				<span class="inline-block h-[5px] w-[5px] rotate-45 bg-gold/70"></span>
				<span>Production · Packaging · Distribution</span>
			</div>
			<span class="text-[0.78rem] text-gold"> DEVELOPED BY KOSMOS TECHNOLOGY.</span>
		</div>
	</div>
</footer>

<style>
	/* ─── Drawer + backdrop (hidden on desktop) ─── */
	.drawer-backdrop,
	.categories-drawer {
		display: none;
	}

	/* ════════════════════════════════════════
	   RESPONSIVE — mobile
	════════════════════════════════════════ */
	@media (max-width: 768px) {
		/* ─── Drawer backdrop ─── */
		.drawer-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.55);
			z-index: 998;
			animation: fadeIn 0.2s ease;
		}

		/* ─── Categories drawer ─── */
		.categories-drawer {
			display: block;
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			background: #1e1e1e;
			border-radius: 20px 20px 0 0;
			z-index: 999;
			transform: translateY(100%);
			transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
			max-height: 75vh;
			overflow-y: auto;
			padding-bottom: env(safe-area-inset-bottom, 16px);
		}
		.categories-drawer.drawer-open {
			transform: translateY(0);
		}
		.drawer-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 20px 12px;
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		}
		.drawer-title {
			font-size: 18px;
			font-weight: 700;
			color: #f4fbf6;
			margin: 0;
		}
		.drawer-close {
			width: 32px;
			height: 32px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.08);
			border: none;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			color: #f4fbf6;
			transition: background 0.2s ease;
		}
		.drawer-close svg {
			width: 16px;
			height: 16px;
		}
		.drawer-close:hover {
			background: rgba(255, 255, 255, 0.15);
		}
		.drawer-list {
			list-style: none;
			padding: 8px 0 80px;
			margin: 0;
		}
		.drawer-item {
			display: flex;
			align-items: center;
			gap: 14px;
			padding: 14px 20px;
			text-decoration: none;
			color: #f4fbf6;
			transition: background 0.15s ease;
			border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		}
		.drawer-item:hover {
			background: rgba(212, 160, 23, 0.08);
		}
		.drawer-item-icon {
			width: 40px;
			height: 40px;
			border-radius: 10px;
			background: rgba(212, 160, 23, 0.12);
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			overflow: hidden;
		}
		.drawer-item-icon img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
		.drawer-item-label {
			flex: 1;
			font-size: 15px;
			font-weight: 500;
		}
		.drawer-chevron {
			width: 16px;
			height: 16px;
			color: rgba(255, 255, 255, 0.3);
			flex-shrink: 0;
		}

		@keyframes fadeIn {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}
	}
</style>
