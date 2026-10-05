<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { base } from '$app/paths';
	import { getProductUrl } from '$lib/utils/url';
	import { getImageUrl } from '$lib/utils/image';
	import { handleAddToCart } from '$lib/utils/cart';
	import dummyimage from '$lib/images/dymmyimage.png';
	import type { PageData } from './$types';
	import PageBanner from '$lib/components/PageBanner.svelte';

	let { data }: { data: PageData } = $props();

	const category = $derived(data.category);
	const categories = $derived(data.categories ?? []);
	const allProducts = $derived(data.products ?? []);
	const banners = $derived(data.banners ?? []);

	type SubcategoryRef = {
		id: number;
		name: string;
		description?: string;
		featured_image?: string | null;
	};

	const subcategories = $derived.by<SubcategoryRef[]>(() => {
		const fromCategory = (category?.subcategories ?? []).filter(
			(s: any) => s && s.is_active !== false
		);
		if (fromCategory.length > 0) return fromCategory;
		const seen = new Map<number, SubcategoryRef>();
		for (const p of allProducts) {
			const s = p.subcategory;
			if (s?.id && !seen.has(s.id)) seen.set(s.id, s);
		}
		return [...seen.values()];
	});

	// ---------- Filters ----------
	let selectedSubs = $state<number[]>([]);
	let searchTerm = $state('');
	let sortBy = $state<'featured' | 'price-low' | 'price-high' | 'name-az'>('featured');
	let currentPage = $state(1);
	const PER_PAGE = 12;

	const subCounts = $derived.by(() => {
		const counts = new Map<number, number>();
		for (const p of allProducts) {
			const id = p.subcategory?.id;
			if (id != null) counts.set(id, (counts.get(id) ?? 0) + 1);
		}
		return counts;
	});

	function toggleSub(id: number) {
		selectedSubs = selectedSubs.includes(id)
			? selectedSubs.filter((s) => s !== id)
			: [...selectedSubs, id];
	}

	const HOMEPAGE_PRODUCTS_PER_SUB = 6;

	const productsBySubcategory = $derived.by(() => {
		const grouped = new Map<number, { sub: SubcategoryRef; products: any[] }>();
		for (const p of allProducts) {
			const subId = p.subcategory?.id;
			if (subId == null) continue;
			if (!grouped.has(subId)) {
				grouped.set(subId, { sub: p.subcategory, products: [] });
			}
			grouped.get(subId)!.products.push(p);
		}
		return [...grouped.values()];
	});

	function sortProducts(list: any[]) {
		const sorted = [...list];
		switch (sortBy) {
			case 'price-low':
				sorted.sort(
					(a, b) =>
						(parseFloat(a.sale_price ?? a.regular_price) || 0) -
						(parseFloat(b.sale_price ?? b.regular_price) || 0)
				);
				break;
			case 'price-high':
				sorted.sort(
					(a, b) =>
						(parseFloat(b.sale_price ?? b.regular_price) || 0) -
						(parseFloat(a.sale_price ?? a.regular_price) || 0)
				);
				break;
			case 'name-az':
				sorted.sort((a, b) => String(a.name).localeCompare(String(b.name)));
				break;
		}
		return sorted;
	}

	const filteredProducts = $derived.by(() => {
		const q = searchTerm.trim().toLowerCase();
		let list = allProducts.filter((p: any) => {
			const subMatch = selectedSubs.length === 0 || selectedSubs.includes(p.subcategory?.id);
			if (!subMatch) return false;
			if (!q) return true;
			return (
				p.name?.toLowerCase().includes(q) ||
				p.description?.toLowerCase().includes(q) ||
				p.short_description?.toLowerCase().includes(q) ||
				p.subcategory?.name?.toLowerCase().includes(q)
			);
		});
		list = [...list];
		switch (sortBy) {
			case 'price-low':
				list.sort(
					(a, b) =>
						(parseFloat(a.sale_price ?? a.regular_price) || 0) -
						(parseFloat(b.sale_price ?? b.regular_price) || 0)
				);
				break;
			case 'price-high':
				list.sort(
					(a, b) =>
						(parseFloat(b.sale_price ?? b.regular_price) || 0) -
						(parseFloat(a.sale_price ?? a.regular_price) || 0)
				);
				break;
			case 'name-az':
				list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
				break;
			default:
				break;
		}
		return list;
	});

	const totalPages = $derived(Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE)));
	const paginatedProducts = $derived(
		filteredProducts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
	);

	$effect(() => {
		void selectedSubs;
		void searchTerm;
		void sortBy;
		currentPage = 1;
	});
	$effect(() => {
		if (currentPage > totalPages) currentPage = totalPages;
	});

	let filtersOpen = $state(false);

	// ---------- Helpers ----------
	function price(value: unknown): number {
		const n = parseFloat(String(value ?? 0));
		return Number.isNaN(n) ? 0 : n;
	}
	function formatPrice(value: number): string {
		return `Rs. ${value.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
	function heroImage(): string {
		return getImageUrl(category?.featured_image, dummyimage);
	}
	function productImage(p: any): string {
		return getImageUrl(p.main_image ?? p.image, dummyimage);
	}
	function discountOf(p: any): number {
		return Math.min(Math.round(p.discount_percentage ?? 0), 99);
	}
	function scrollToCatalog() {
		document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<svelte:head>
	<title>{category ? `${category.name} — AFCRC` : 'Category — AFCRC'}</title>
	{#if category?.description}
		<meta name="description" content={category.description} />
	{/if}
</svelte:head>

{#if category}
	<div class="min-h-screen bg-paper-white pb-20 font-sans">
		<!-- ===================== Hero ===================== -->
		<section class="relative overflow-hidden bg-pine-dark">
			<PageBanner
				{banners}
				{subcategories}
				onselectsubcategory={(id) => {
					toggleSub(id);
					scrollToCatalog();
				}}
			></PageBanner>
			<!-- <img
				src={heroImage()}
				alt={category.name}
				class="absolute inset-0 h-full w-full object-cover opacity-45"
			/>
			<div
				class="absolute inset-0"
				style="background:
					radial-gradient(circle at 85% 15%, rgba(246, 201, 154, 0.22) 0%, transparent 45%),
					linear-gradient(100deg, rgba(13, 43, 30, 0.95) 0%, rgba(23, 83, 58, 0.82) 45%, rgba(35, 116, 77, 0.55) 100%);"
			></div>
			<div class="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true">
				<svg
					class="h-full w-full"
					xmlns="http://www.w3.org/2000/svg"
					preserveAspectRatio="none"
					viewBox="0 0 100 100"
				>
					<defs>
						<pattern
							id="cat-hero-lines"
							width="22"
							height="22"
							patternUnits="userSpaceOnUse"
							patternTransform="rotate(45)"
						>
							<rect width="22" height="1.5" y="10" fill="#f6c99a" />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#cat-hero-lines)" />
				</svg>
			</div>

			<div class="relative mx-auto max-w-[1180px] px-6 pt-8 pb-[9.75rem] max-md:px-4">
				<nav
					class="flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.12em] text-white/60 uppercase"
				>
					<a href="{base}/" class="no-underline transition-colors hover:text-gold">Home</a>
					<span aria-hidden="true">/</span>
					<a href="{base}/shop" class="no-underline transition-colors hover:text-gold">Shop</a>
					<span aria-hidden="true">/</span>
					<span class="text-gold">{category.name}</span>
				</nav>

				<div class="mt-8 flex flex-wrap items-end justify-between gap-6">
					<div class="max-w-xl">
						<div class="eyebrow text-gold [&::before]:bg-gold">Category</div>
						<h1
							class="reveal mt-3 font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-paper-white"
						>
							{category.name}
						</h1>
						{#if category.description}
							<p class="reveal mt-3 max-w-md text-[0.92rem] leading-relaxed text-white/70">
								{category.description}
							</p>
						{/if}
					</div>

					<div class="flex items-center gap-3">
						<div
							class="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 text-center backdrop-blur-sm"
						>
							<div class="font-serif text-xl font-semibold text-gold tabular-nums">
								{allProducts.length}
							</div>
							<div class="font-mono text-[0.6rem] tracking-[0.14em] text-white/60 uppercase">
								Products
							</div>
						</div>
						<div
							class="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 text-center backdrop-blur-sm"
						>
							<div class="font-serif text-xl font-semibold text-gold tabular-nums">
								{subcategories.length}
							</div>
							<div class="font-mono text-[0.6rem] tracking-[0.14em] text-white/60 uppercase">
								Subcategories
							</div>
						</div>
					</div>
				</div>
			</div> -->
		</section>

		<!-- ===================== Catalog ===================== -->
		<section id="catalog" class="scroll-mt-24">
			{#if selectedSubs.length === 0 && !searchTerm}
				<!-- ====== GROUPED HOME VIEW ====== -->
				{#if filteredProducts.length === 0}
					<div class="mx-auto max-w-[1180px] px-6 py-16 text-center max-md:px-4">
						<p class="font-serif text-lg text-ink-soft">No products in this category yet.</p>
					</div>
				{:else}
					{#each productsBySubcategory as group, gi (group.sub.id)}
						<section class="{gi % 2 === 0 ? 'bg-paper-white' : 'bg-[#f4f1ec]'} transition-colors">
							<div class="mx-auto max-w-[1180px] px-6 py-12 max-md:px-4 max-md:py-8">
								<!-- Subcategory header -->
								<div class="mb-8 flex flex-wrap items-end justify-between gap-4 max-md:mb-6">
									<div class="flex items-center gap-4">
										{#if group.sub.featured_image}
											<img
												src={getImageUrl(group.sub.featured_image, dummyimage)}
												alt={group.sub.name}
												class="hidden h-14 w-14 rounded-xl border border-line object-cover shadow-sm md:block"
												loading="lazy"
											/>
										{/if}
										<div>
											<h2
												class="font-serif text-[clamp(1.4rem,2.5vw,1.9rem)] leading-tight font-semibold tracking-[-0.015em] text-pine-dark"
											>
												{group.sub.name}
											</h2>
											{#if group.sub.description}
												<p class="mt-1 max-w-md text-[0.82rem] leading-relaxed text-ink-soft">
													{group.sub.description}
												</p>
											{/if}
										</div>
									</div>
									<button
										class="group/btn inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-pine/30 bg-white px-5 py-2 font-mono text-[0.68rem] font-semibold tracking-[0.08em] text-pine-dark uppercase shadow-sm transition-all duration-300 hover:border-pine hover:bg-pine hover:text-paper-white hover:shadow-md"
										onclick={() => {
											selectedSubs = [group.sub.id];
											scrollToCatalog();
										}}
									>
										View All
										<span
											class="inline-block transition-transform duration-300 group-hover/btn:translate-x-0.5"
										>
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
											</svg>
										</span>
										<span
											class="ml-1 rounded-full bg-pine-dark/10 px-2 py-0.5 font-mono text-[0.6rem] tabular-nums group-hover/btn:bg-white/20"
										>
											{group.products.length}
										</span>
									</button>
								</div>

								<!-- Product grid -->
								<div class="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
									{#each sortProducts(group.products).slice(0, HOMEPAGE_PRODUCTS_PER_SUB) as p (p.id)}
										{@render productCard(p)}
									{/each}
								</div>
							</div>
						</section>
					{/each}
				{/if}
			{:else}
				<!-- ====== FILTERED / SEARCH VIEW ====== -->
				<div class="mx-auto max-w-[1180px] px-6 py-12 max-md:px-4 max-md:py-8">
					<!-- Mobile filter toggle -->
					<button
						class="mb-5 flex w-full cursor-pointer items-center justify-between rounded-xl border border-line bg-white px-4 py-3 font-mono text-[0.7rem] tracking-[0.1em] text-pine-dark uppercase lg:hidden"
						onclick={() => (filtersOpen = !filtersOpen)}
					>
						<span class="inline-flex items-center gap-2">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							>
								<line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line
									x1="10"
									y1="18"
									x2="14"
									y2="18"
								/>
							</svg>
							Filters {selectedSubs.length > 0 ? `(${selectedSubs.length})` : ''}
						</span>
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
							class:rotate-180={filtersOpen}
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>

					{#if filtersOpen}
						<div class="mb-8 lg:hidden" transition:slide={{ duration: 200 }}>
							{@render filters()}
						</div>
					{/if}

					<div class="grid items-start gap-10 lg:grid-cols-[250px_1fr]">
						<aside class="sticky top-24 hidden self-start lg:block">
							{@render filters()}
						</aside>

						<div>
							<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
								<p class="font-sans text-sm text-ink-soft">
									Showing
									<span class="font-semibold text-pine-dark">{paginatedProducts.length}</span>
									of
									<span class="font-semibold text-pine-dark">{filteredProducts.length}</span>
									product{filteredProducts.length === 1 ? '' : 's'}
								</p>
								<label
									class="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.1em] text-ink-soft uppercase"
								>
									Sort
									<select
										bind:value={sortBy}
										class="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 font-sans text-xs font-medium text-pine-dark outline-none focus:border-pine"
									>
										<option value="featured">Featured</option>
										<option value="price-low">Price: Low to High</option>
										<option value="price-high">Price: High to Low</option>
										<option value="name-az">Name: A to Z</option>
									</select>
								</label>
							</div>

							{#if filteredProducts.length === 0}
								<div
									class="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-pine-dark/20 bg-white px-6 py-20 text-center"
								>
									<svg
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#2B6D4C"
										stroke-width="1.4"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="opacity-70"
									>
										<circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><path
											d="M8 11h6"
										/>
									</svg>
									<p class="font-serif text-lg text-ink">No products match your filters.</p>
									<p class="max-w-xs font-sans text-sm text-ink-soft">
										Try clearing the subcategory selection or searching for something else.
									</p>
									<button
										class="mt-2 cursor-pointer rounded-full bg-pine-dark px-5 py-2 font-mono text-[0.68rem] tracking-[0.08em] text-paper-white uppercase transition-all hover:bg-pine"
										onclick={() => {
											selectedSubs = [];
											searchTerm = '';
										}}
									>
										Clear all
									</button>
								</div>
							{:else}
								<div class="grid grid-cols-2 gap-5 md:grid-cols-3">
									{#each paginatedProducts as p (p.id)}
										{@render productCard(p)}
									{/each}
								</div>

								{#if totalPages > 1}
									<nav
										class="mt-10 flex items-center justify-center gap-2"
										aria-label="Product pages"
									>
										<button
											class="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 font-mono text-xs text-pine-dark transition-all hover:border-pine disabled:cursor-not-allowed disabled:opacity-40"
											disabled={currentPage === 1}
											onclick={() => (currentPage -= 1)}
										>
											Prev
										</button>
										{#each Array(totalPages) as _, i}
											<button
												class="h-9 w-9 cursor-pointer rounded-lg border font-mono text-xs transition-all {currentPage ===
												i + 1
													? 'border-pine-dark bg-pine-dark text-paper-white'
													: 'border-line bg-white text-pine-dark hover:border-pine'}"
												aria-current={currentPage === i + 1}
												onclick={() => (currentPage = i + 1)}
											>
												{i + 1}
											</button>
										{/each}
										<button
											class="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 font-mono text-xs text-pine-dark transition-all hover:border-pine disabled:cursor-not-allowed disabled:opacity-40"
											disabled={currentPage === totalPages}
											onclick={() => (currentPage += 1)}
										>
											Next
										</button>
									</nav>
								{/if}
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</section>
	</div>
{:else}
	<!-- Category not found -->
	<section class="flex min-h-[70vh] items-center justify-center bg-paper-white px-6 font-sans">
		<div class="flex max-w-md flex-col items-center gap-4 text-center">
			<svg
				width="36"
				height="36"
				viewBox="0 0 24 24"
				fill="none"
				stroke="#2B6D4C"
				stroke-width="1.4"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="opacity-70"
			>
				<path
					d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
				/>
				<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
			</svg>
			<h1 class="font-serif text-2xl font-semibold text-pine-dark">
				We couldn't find that category.
			</h1>
			<p class="text-sm text-ink-soft">
				It may have been moved or renamed. Browse our full range instead.
			</p>
			<a
				href="{base}/shop"
				class="mt-2 inline-flex items-center gap-2 rounded-full bg-pine-dark px-6 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] text-paper-white uppercase no-underline transition-all hover:-translate-y-0.5 hover:bg-pine"
			>
				Go to shop
			</a>
		</div>
	</section>
{/if}

{#snippet productCard(p: any)}
	<article
		class="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-500 hover:-translate-y-1 hover:border-pine/40 hover:shadow-[0_22px_48px_-18px_rgba(23,83,58,0.4)]"
	>
		<a
			href={getProductUrl(p)}
			class="relative block aspect-square w-full overflow-hidden bg-[rgba(11,93,30,0.04)]"
			aria-label={p.name}
		>
			<img
				src={productImage(p)}
				alt={p.name}
				loading="lazy"
				width="250"
				height="250"
				class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
			/>
			{#if discountOf(p) > 0}
				<span
					class="absolute top-3 left-3 rounded-full bg-gold px-2.5 py-1 font-mono text-[0.62rem] font-bold text-[#2c1714] shadow-lg"
				>
					-{discountOf(p)}%
				</span>
			{/if}
			{#if p.subcategory?.name}
				<span
					class="absolute top-3 right-3 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 font-mono text-[0.55rem] tracking-[0.08em] whitespace-nowrap text-white/90 uppercase backdrop-blur-md"
				>
					{p.subcategory.name}
				</span>
			{/if}
		</a>
		<div class="flex flex-1 flex-col p-4">
			<a
				href={getProductUrl(p)}
				class="line-clamp-2 font-serif text-[0.98rem] leading-snug font-semibold text-pine-dark no-underline transition-colors group-hover:text-pine"
			>
				{p.name}
			</a>
			{#if p.short_description}
				<p class="mt-1 line-clamp-1 text-xs text-ink-soft">{p.short_description}</p>
			{/if}
			<div class="mt-auto pt-3">
				<div class="flex items-baseline gap-2">
					<span class="font-mono text-[1rem] font-bold tracking-tight text-pine-dark tabular-nums">
						{formatPrice(price(p.sale_price ?? p.regular_price))}
					</span>
					{#if p.sale_price != null && price(p.sale_price) < price(p.regular_price)}
						<span class="font-mono text-[0.72rem] text-ink-soft/60 tabular-nums line-through">
							{formatPrice(price(p.regular_price))}
						</span>
					{/if}
				</div>
				<button
					class="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-pine-dark py-2.5 font-mono text-[0.66rem] font-semibold tracking-[0.08em] text-paper-white uppercase transition-all duration-300 hover:bg-pine hover:shadow-[0_10px_24px_-8px_rgba(23,83,58,0.6)]"
					onclick={() =>
						handleAddToCart({
							id: p.id,
							name: p.name,
							slug: p.slug,
							seo_slug: p.seo_slug ?? '',
							image: p.main_image ?? p.image ?? undefined,
							sale_price: p.sale_price,
							regular_price: p.regular_price
						})}
				>
					<svg
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
						<path
							d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
						/>
					</svg>
					Add to Cart
				</button>
			</div>
		</div>
	</article>
{/snippet}

{#snippet filters()}
	<div class="flex flex-col gap-8">
		<!-- Categories -->

		<!-- Subcategories -->
		{#if subcategories.length > 0}
			<div class="rounded-2xl border border-line bg-white p-5">
				<div class="flex items-center justify-between">
					<h3 class="flex items-center gap-2 font-serif text-base font-semibold text-pine-dark">
						<svg
							width="15"
							height="15"
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
						Subcategories
					</h3>
					{#if selectedSubs.length > 0}
						<button
							class="cursor-pointer border-none bg-none font-mono text-[0.62rem] tracking-[0.08em] text-pine uppercase underline-offset-2 hover:underline"
							onclick={() => (selectedSubs = [])}
						>
							Reset
						</button>
					{/if}
				</div>
				<ul class="mt-4 flex list-none flex-col gap-2.5 p-0">
					{#each subcategories as sub (sub.id)}
						<li>
							<label
								class="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft transition-colors hover:text-pine-dark"
							>
								<input
									type="checkbox"
									checked={selectedSubs.includes(sub.id)}
									onchange={() => toggleSub(sub.id)}
									class="h-4 w-4 shrink-0 cursor-pointer accent-pine-dark"
								/>
								<span class="min-w-0 flex-1 truncate">{sub.name}</span>
								<span class="shrink-0 font-mono text-[0.68rem] text-ink-soft/70 tabular-nums">
									{subCounts.get(sub.id) ?? 0}
								</span>
							</label>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="rounded-2xl border border-line bg-white p-5">
			<h3 class="flex items-center gap-2 font-serif text-base font-semibold text-pine-dark">
				<svg
					width="15"
					height="15"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
					<rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
				</svg>
				Categories
			</h3>
			<ul class="mt-4 flex list-none flex-col gap-1 p-0">
				{#each categories as c (c.id)}
					<li>
						<a
							href="{base}/product/{c.seo_slug}"
							class="flex items-center justify-between rounded-lg px-3 py-2 text-sm no-underline transition-colors duration-150 {c.id ===
							category?.id
								? 'bg-pine-dark font-semibold text-paper-white'
								: 'text-ink-soft hover:bg-[rgba(11,93,30,0.06)] hover:text-pine-dark'}"
						>
							<span class="truncate">{c.name}</span>
							{#if c.id === category?.id}
								<svg
									width="13"
									height="13"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg
								>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Search -->
		<!-- <div class="rounded-2xl border border-line bg-white p-5">
			<h3 class="font-serif text-base font-semibold text-pine-dark">Search</h3>
			<div class="relative mt-3">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="#565C51"
					stroke-width="2"
					stroke-linecap="round"
					class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
				>
					<circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
				</svg>
				<input
					type="search"
					placeholder="Search {category?.name ?? 'products'}…"
					bind:value={searchTerm}
					class="w-full rounded-lg border border-line bg-[#faf9f6] py-2.5 pr-3 pl-9 text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-pine"
				/>
			</div>
		</div> -->
	</div>
{/snippet}
