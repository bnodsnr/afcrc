<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { fade, slide } from 'svelte/transition';
	import { env } from '$env/dynamic/public';
	import { resolve } from '$app/paths';
	import { getImageUrl } from '$lib/utils/image';
	import { handleAddToCart } from '$lib/utils/cart';

	type ApiCategory = {
		id: number;
		name: string;
		featured_image?: string | null;
	};

	type Category = {
		id: number;
		name: string;
		image: string | null;
	};

	type ApiProduct = {
		id: number;
		name: string;
		slug: string;
		seo_slug?: string;
		sku?: string;
		category_name?: string;
		category?: number;
		regular_price?: string | number;
		sale_price?: string | number;
		primary_image?: { image?: string } | null;
		images?: { image?: string }[];
		featured_image?: string | null;
		description?: string;
		short_description?: string;
		product_sizes?: unknown;
		stock_status?: string;
		stock_quantity?: string | number;
	};

	type Product = {
		id: number;
		name: string;
		slug: string;
		seo_slug: string;
		sku: string;
		brand: string;
		category?: number;
		price: number;
		originalPrice: number;
		discount: number;
		image: string;
		description?: string;
		shortDescription?: string;
		rating: number;
		reviews: number;
		stockStatus?: string;
		stockQuantity: number;
	};

	// ---------- Filter State ----------
	const filters = $state({
		category: null as number | null,
		search: '',
		sort: 'default',
		minPrice: 0,
		maxPrice: 10000
	});

	// ---------- UI State ----------
	let currentPage = $state(1);
	let products = $state<Product[]>([]);
	let totalPages = $state(1);
	let totalProducts = $state(0);
	let brands = $state<Category[]>([]);
	let isLoading = $state(false);
	let filterDrawerOpen = $state(false);
	let viewMode = $state<'grid' | 'list'>('grid');

	const skeletonItems = [0, 1, 2, 3, 4, 5];
	const starItems = [0, 1, 2, 3, 4];
	const pageItems = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));

	onMount(async () => {
		await fetchCategories();
		await loadProducts();
	});

	function closeDrawerOnEscape(e: KeyboardEvent) {
		if (filterDrawerOpen && e.key === 'Escape') filterDrawerOpen = false;
	}

	// -----------------------------
	// Categories
	// -----------------------------
	async function fetchCategories() {
		try {
			const res = await fetch(`${env.PUBLIC_BASE_URL}/api/get-categories/`);
			const data = await res.json();
			brands = (data.data ?? []).map((category: ApiCategory) => ({
				id: category.id,
				name: category.name,
				image: category.featured_image
			}));
		} catch (err) {
			console.error(err);
		}
	}

	// -----------------------------
	// Products
	// -----------------------------
	async function loadProducts(page = 1) {
		isLoading = true;

		try {
			const params = new SvelteURLSearchParams();

			if (filters.category) params.set('category', filters.category.toString());
			if (filters.search.trim()) params.set('search', filters.search);
			if (filters.sort !== 'default') params.set('sort', filters.sort);
			if (filters.minPrice > 0) params.set('min_price', filters.minPrice.toString());
			if (filters.maxPrice < 10000) params.set('max_price', filters.maxPrice.toString());
			params.set('page', page.toString());

			const response = await fetch(`${env.PUBLIC_BASE_URL}/api/paginated-products/?${params}`);

			if (!response.ok) throw new Error("Couldn't fetch products");

			const data = await response.json();

			totalProducts = data.count;
			currentPage = page;
			totalPages = Math.ceil(data.count / 18);

			products = data.results.map(mapProduct);
		} catch (err) {
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	function mapProduct(product: ApiProduct): Product {
		const regular = Number(product.regular_price) || 0;
		const sale = Number(product.sale_price) || 0;
		const hasDiscount = sale > 0 && sale < regular;
		const image =
			product.primary_image?.image ?? product.images?.[0]?.image ?? product.featured_image ?? '';

		return {
			id: product.id,
			name: product.name,
			slug: product.slug,
			seo_slug: product.seo_slug || product.slug,
			sku: product.sku ?? '',
			brand: product.category_name ?? '',
			category: product.category,
			price: hasDiscount ? sale : regular,
			originalPrice: regular,
			discount: hasDiscount ? Math.round(((regular - sale) / regular) * 100) : 0,
			image,
			description: product.description,
			shortDescription: product.short_description,
			rating: 4.5,
			reviews: 0,
			stockStatus: product.stock_status,
			stockQuantity: Number(product.stock_quantity)
		};
	}

	function formatPrice(price: number | string): string {
		const n = Number(price) || 0;
		return `Rs. ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	// -----------------------------
	// Filter Actions
	// -----------------------------
	async function selectCategory(id: number | null) {
		filters.category = filters.category === id ? null : id;
		currentPage = 1;
		await loadProducts();
		filterDrawerOpen = false;
	}

	async function searchProducts() {
		currentPage = 1;
		await loadProducts();
	}

	async function changeSort() {
		currentPage = 1;
		await loadProducts();
	}

	async function applyPriceFilter() {
		if (filters.minPrice > filters.maxPrice) {
			filters.maxPrice = filters.minPrice;
		}
		currentPage = 1;
		await loadProducts();
	}

	async function changePage(page: number) {
		await loadProducts(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	async function clearFilters() {
		filters.category = null;
		filters.search = '';
		filters.sort = 'default';
		filters.minPrice = 0;
		filters.maxPrice = 10000;
		currentPage = 1;
		await loadProducts();
	}

	function addToCart(e: Event, product: Product) {
		e.preventDefault();
		e.stopPropagation();
		handleAddToCart(
			{
				id: product.id,
				name: product.name,
				slug: product.slug,
				seo_slug: product.seo_slug,
				image: product.image,
				sale_price: product.discount > 0 ? product.price : null,
				regular_price: product.originalPrice,
				sku: product.sku,
				stock_status: product.stockStatus,
				max_quantity: product.stockQuantity || undefined
			},
			1
		);
	}
</script>

<svelte:window onkeydown={closeDrawerOnEscape} />

<svelte:head>
	<title>Shop — AFCRC</title>
	<meta
		name="description"
		content="Browse fresh picks, seasonal favorites and handpicked essentials from AFCRC."
	/>
</svelte:head>

<!-- ── Hero ── -->
<section
	class="relative overflow-hidden bg-pine-dark py-[110px] max-md:py-16"
	style="background:
		radial-gradient(circle at 15% 20%, #4b845a 0%, transparent 35%),
		radial-gradient(circle at 85% 15%, #fbe9ba 0%, transparent 35%),
		linear-gradient(135deg, #17533a 0%, #84a66d 50%, #fdf0cf 100%)"
>
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<nav
			class="mb-8 flex items-center gap-2 font-mono text-[0.72rem] tracking-[0.08em] text-paper/70 uppercase"
			aria-label="Breadcrumb"
		>
			<a href={resolve('/')} class="transition-colors duration-200 hover:text-gold">Home</a>
			<span aria-hidden="true">/</span>
			<span class="font-semibold text-gold">Shop</span>
		</nav>
		<div class="max-w-[640px]">
			<div class="eyebrow text-gold before:bg-gold">Curated collection</div>
			<h1
				class="mt-4 font-serif text-[clamp(2.6rem,6vw,4.2rem)] leading-none font-bold tracking-[-0.01em] text-paper"
			>
				Shop
			</h1>
			<p class="mt-5 max-w-[520px] text-[0.98rem] leading-relaxed text-paper/85">
				Browse fresh picks, seasonal favorites and handpicked essentials from our farms and
				production lines.
			</p>
		</div>
	</div>
</section>

<!-- ── Mobile filter toggle ── -->
<div
	class="sticky top-0 z-40 flex items-center justify-between gap-2.5 border-b border-line bg-paper-white px-4 py-3 lg:hidden"
>
	<button
		type="button"
		class="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-pine px-4 py-2 text-[0.8rem] font-bold text-white shadow-[0_8px_18px_-6px_rgba(43,109,76,0.5)] transition-transform duration-200 hover:-translate-y-px"
		onclick={() => (filterDrawerOpen = !filterDrawerOpen)}
		aria-expanded={filterDrawerOpen}
		aria-controls="filterDrawer"
	>
		<svg
			width="15"
			height="15"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<line x1="4" y1="6" x2="20" y2="6" />
			<line x1="8" y1="12" x2="20" y2="12" />
			<line x1="12" y1="18" x2="20" y2="18" />
		</svg>
		Filters
	</button>
	<div
		class="flex max-w-[230px] flex-1 items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2"
	>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			class="shrink-0 text-ink-soft/60"
			aria-hidden="true"
		>
			<path d="M3 6h18M7 12h10M11 18h2" />
		</svg>
		<select
			class="w-full cursor-pointer border-none bg-transparent text-[0.8rem] font-semibold text-ink outline-none"
			aria-label="Sort products"
			bind:value={filters.sort}
			onchange={changeSort}
		>
			<option value="default">Sort: Default</option>
			<option value="price-asc">Price: Low → High</option>
			<option value="price-desc">Price: High → Low</option>
			<option value="name-asc">Name: A → Z</option>
			<option value="name-desc">Name: Z → A</option>
			<option value="discount">Biggest Discount</option>
		</select>
	</div>
</div>

<!-- ── Filter drawer overlay (mobile) ── -->
{#if filterDrawerOpen}
	<div
		class="fixed inset-0 z-[90] bg-pine-dark/40 backdrop-blur-sm"
		role="presentation"
		onclick={() => (filterDrawerOpen = false)}
		transition:fade={{ duration: 150 }}
	></div>
	<aside
		id="filterDrawer"
		class="fixed top-0 bottom-0 left-0 z-[100] flex w-[min(320px,88vw)] flex-col overflow-hidden bg-white shadow-[12px_0_28px_rgba(0,0,0,0.22)]"
		aria-label="Filters panel"
		transition:slide={{ duration: 250 }}
	>
		<div class="flex items-center justify-between border-b border-line px-5 py-4">
			<span class="text-[0.95rem] font-bold text-ink">Filters</span>
			<button
				type="button"
				class="cursor-pointer rounded-lg px-2 py-1 text-[1.05rem] leading-none text-ink-soft transition-colors hover:bg-paper-2/60 hover:text-ink"
				onclick={() => (filterDrawerOpen = false)}
				aria-label="Close filters">✕</button
			>
		</div>
		<div class="flex-1 overflow-y-auto p-4">
			{@render filterForm()}
		</div>
	</aside>
{/if}

<!-- ── Main ── -->
<section class="bg-paper-white py-[60px] max-md:py-10">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<div class="grid grid-cols-[280px_1fr] items-start gap-6 max-lg:grid-cols-1">
			<!-- Sidebar (desktop only) -->
			<aside
				class="sticky top-[90px] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_-24px_rgba(18,50,26,0.2)] max-lg:hidden"
				aria-label="Filters"
			>
				{@render filterForm()}
			</aside>

			<!-- Main Content -->
			<div
				class="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_-24px_rgba(18,50,26,0.2)]"
			>
				<!-- Content header -->
				<div class="border-b border-line p-5 pb-0 max-md:px-4">
					<div class="mb-4 flex flex-wrap items-center justify-between gap-4">
						<div>
							<div class="eyebrow">Curated collection</div>
							<h2
								class="mt-1 font-serif text-[clamp(1.4rem,2.4vw,1.8rem)] font-semibold tracking-[-0.01em] text-pine-dark"
							>
								Shop
							</h2>
							<p class="text-[0.85rem] text-ink-soft">
								Browse fresh picks, seasonal favorites and handpicked essentials.
							</p>
						</div>
						<span
							class="inline-flex items-center rounded-full border border-teal/20 bg-teal/10 px-3.5 py-1.5 font-mono text-[0.7rem] font-semibold text-pine-dark"
						>
							{totalProducts} products
						</span>
					</div>

					<!-- Toolbar -->
					<div
						class="mb-5 flex h-[52px] items-center overflow-hidden rounded-xl border border-line bg-white max-md:h-auto max-md:flex-wrap max-md:py-2"
					>
						<div class="relative flex h-full min-w-0 flex-1 items-center">
							<svg
								class="absolute left-3.5 h-4 w-4 shrink-0 text-ink-soft/60"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
							>
								<circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
							</svg>
							<input
								type="search"
								class="h-full w-full border-none bg-transparent py-0 pr-3 pl-10 text-[0.85rem] text-ink outline-none placeholder:text-ink-soft/50 focus:bg-paper-2/40"
								placeholder="Search products…"
								aria-label="Search products"
								bind:value={filters.search}
								onchange={searchProducts}
							/>
						</div>

						<div class="h-[22px] w-px shrink-0 bg-line max-md:hidden" aria-hidden="true"></div>

						<div class="flex h-full shrink-0 items-center gap-2 px-4">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								class="shrink-0 text-ink-soft/60"
								aria-hidden="true"
							>
								<path d="M3 6h18M7 12h10M11 18h2" />
							</svg>
							<span
								class="text-[0.75rem] font-semibold whitespace-nowrap text-ink-soft max-md:hidden"
								>Sort by</span
							>
							<select
								id="sortSelect"
								class="cursor-pointer border-none bg-transparent py-0 text-[0.85rem] font-semibold text-ink outline-none"
								bind:value={filters.sort}
								onchange={changeSort}
							>
								<option value="default">Default</option>
								<option value="price-asc">Price: Low → High</option>
								<option value="price-desc">Price: High → Low</option>
								<option value="name-asc">Name: A → Z</option>
								<option value="name-desc">Name: Z → A</option>
								<option value="discount">Biggest Discount</option>
							</select>
						</div>

						<div class="h-[22px] w-px shrink-0 bg-line max-md:hidden" aria-hidden="true"></div>

						<div class="flex h-full shrink-0 items-center gap-2 px-4 max-md:hidden">
							<span class="text-[0.75rem] font-semibold whitespace-nowrap text-ink-soft">View</span>
							<div
								class="flex items-center gap-0.5 rounded-lg border border-line bg-paper-2/50 p-0.5"
							>
								<button
									type="button"
									class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors duration-150 {viewMode ===
									'grid'
										? 'bg-teal/15 text-pine-dark'
										: 'text-ink-soft hover:text-pine-dark'}"
									aria-label="Grid view"
									aria-pressed={viewMode === 'grid'}
									title="Grid view"
									onclick={() => (viewMode = 'grid')}
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										aria-hidden="true"
									>
										<rect x="3" y="3" width="7" height="7" />
										<rect x="14" y="3" width="7" height="7" />
										<rect x="3" y="14" width="7" height="7" />
										<rect x="14" y="14" width="7" height="7" />
									</svg>
								</button>
								<button
									type="button"
									class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors duration-150 {viewMode ===
									'list'
										? 'bg-teal/15 text-pine-dark'
										: 'text-ink-soft hover:text-pine-dark'}"
									aria-label="List view"
									aria-pressed={viewMode === 'list'}
									title="List view"
									onclick={() => (viewMode = 'list')}
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										aria-hidden="true"
									>
										<line x1="4" y1="6" x2="20" y2="6" />
										<line x1="4" y1="12" x2="20" y2="12" />
										<line x1="4" y1="18" x2="20" y2="18" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Content -->
				<div class="p-5 max-md:p-4">
					{#if isLoading}
						<div class="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">
							{#each skeletonItems as i (i)}
								<div class="overflow-hidden rounded-2xl border border-line">
									<div class="aspect-[4/3] animate-pulse bg-line/60"></div>
									<div class="space-y-3 p-4">
										<div class="h-3 w-2/3 animate-pulse rounded bg-line/70"></div>
										<div class="h-3 w-1/3 animate-pulse rounded bg-line/50"></div>
									</div>
								</div>
							{/each}
						</div>
					{:else if products.length === 0}
						<div class="flex flex-col items-center justify-center px-6 py-16 text-center">
							<div
								class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-pine"
								aria-hidden="true"
							>
								<svg
									width="26"
									height="26"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
								>
									<circle cx="11" cy="11" r="8" />
									<path d="m21 21-4.35-4.35" />
								</svg>
							</div>
							<h3 class="font-serif text-[1.3rem] font-semibold text-pine-dark">
								No products found
							</h3>
							<p class="mt-1.5 text-[0.9rem] text-ink-soft">
								Try adjusting or clearing your filters.
							</p>
							<button
								type="button"
								class="mt-5 cursor-pointer rounded-full bg-pine px-6 py-2.5 text-[0.85rem] font-bold text-white transition-colors duration-200 hover:bg-pine-dark"
								onclick={clearFilters}>Clear filters</button
							>
						</div>
					{:else if viewMode === 'grid'}
						<div class="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">
							{#each products as product (product.id)}
								<a
									href={resolve(`/product/${product.seo_slug}/${product.slug}`)}
									class="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(30,75,51,0.18)]"
								>
									<div class="relative aspect-[4/3] overflow-hidden bg-paper-2">
										<img
											src={getImageUrl(product.image)}
											alt={product.name}
											loading="lazy"
											class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
										{#if product.discount > 0}
											<span
												class="absolute top-3 left-3 rounded-full bg-gold px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold text-pine-dark shadow-sm"
												>-{product.discount}%</span
											>
										{/if}
										<button
											class="absolute right-3 bottom-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-none bg-pine-dark text-white opacity-0 shadow-md transition-all duration-300 group-hover:opacity-100 hover:bg-pine"
											onclick={(e) => addToCart(e, product)}
											aria-label="Add to cart"
										>
											<svg
												width="15"
												height="15"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line
													x1="3"
													y1="6"
													x2="21"
													y2="6"
												/><path d="M16 10a4 4 0 0 1-8 0" /></svg
											>
										</button>
									</div>
									<div class="flex flex-1 flex-col p-4">
										<span
											class="mb-1.5 self-start rounded-full bg-teal/10 px-2.5 py-0.5 font-mono text-[0.55rem] leading-none tracking-[0.06em] text-teal uppercase"
											>{product.brand || 'Product'}</span
										>
										<h3
											class="mb-1 font-serif text-[0.95rem] font-semibold tracking-[-0.01em] text-pine-dark"
										>
											{product.name}
										</h3>
										<div class="mb-2.5 flex items-center gap-0.5">
											{#each starItems as j (j)}
												<svg
													class="h-2.5 w-2.5 {j < Math.round(product.rating)
														? 'text-gold'
														: 'text-line'}"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 0 0-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 0 0-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 0 0-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957z"
													/>
												</svg>
											{/each}
										</div>
										<div class="mt-auto flex items-center justify-between">
											<div class="flex items-baseline gap-1.5">
												<span class="font-mono text-[0.95rem] font-bold text-pine-dark">
													{formatPrice(product.price)}
												</span>
												{#if product.discount > 0}
													<span class="font-mono text-[0.7rem] text-ink-soft line-through">
														{formatPrice(product.originalPrice)}
													</span>
												{/if}
											</div>
										</div>
									</div>
								</a>
							{/each}
						</div>
					{:else}
						<div class="flex flex-col gap-5">
							{#each products as product (product.id)}
								<a
									href={resolve(`/product/${product.seo_slug}/${product.slug}`)}
									class="group flex gap-5 overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(30,75,51,0.18)] max-sm:flex-col"
								>
									<div
										class="relative w-[240px] shrink-0 overflow-hidden bg-paper-2 max-sm:h-[200px] max-sm:w-full"
									>
										<img
											src={getImageUrl(product.image)}
											alt={product.name}
											loading="lazy"
											class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
										{#if product.discount > 0}
											<span
												class="absolute top-3 left-3 rounded-full bg-gold px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold text-pine-dark shadow-sm"
												>-{product.discount}%</span
											>
										{/if}
									</div>
									<div class="flex flex-1 flex-col p-5">
										<span
											class="mb-1.5 self-start rounded-full bg-teal/10 px-2.5 py-0.5 font-mono text-[0.55rem] leading-none tracking-[0.06em] text-teal uppercase"
											>{product.brand || 'Product'}</span
										>
										<h3
											class="font-serif text-[1.05rem] font-semibold tracking-[-0.01em] text-pine-dark"
										>
											{product.name}
										</h3>
										<p class="mt-1.5 line-clamp-2 text-[0.85rem] leading-relaxed text-ink-soft">
											{product.shortDescription || product.description}
										</p>
										<div class="mt-auto flex items-center justify-between pt-4">
											<div class="flex items-baseline gap-2">
												<span class="font-mono text-[1rem] font-bold text-pine-dark">
													{formatPrice(product.price)}
												</span>
												{#if product.discount > 0}
													<span class="font-mono text-[0.75rem] text-ink-soft line-through">
														{formatPrice(product.originalPrice)}
													</span>
												{/if}
											</div>
											<button
												class="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-pine px-4 py-2 text-[0.8rem] font-bold text-white transition-colors duration-200 hover:bg-pine-dark"
												onclick={(e) => addToCart(e, product)}
											>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="1.5"
													stroke-linecap="round"
													stroke-linejoin="round"
													><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line
														x1="3"
														y1="6"
														x2="21"
														y2="6"
													/><path d="M16 10a4 4 0 0 1-8 0" /></svg
												>
												Add to cart
											</button>
										</div>
									</div>
								</a>
							{/each}
						</div>
					{/if}

					<!-- Pagination -->
					{#if !isLoading && products.length > 0 && totalPages > 1}
						<nav
							class="mt-6 flex flex-wrap items-center justify-center gap-2"
							aria-label="Product pages"
						>
							<button
								type="button"
								class="flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 text-[0.85rem] font-semibold text-ink transition-all duration-200 hover:border-pine hover:bg-pine hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-white disabled:hover:text-ink"
								disabled={currentPage === 1}
								onclick={() => changePage(currentPage - 1)}
								aria-label="Previous page"
							>
								&laquo;
							</button>

							{#each pageItems as page (page)}
								<button
									type="button"
									class="flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border px-3 text-[0.85rem] font-semibold transition-all duration-200 {currentPage ===
									page
										? 'border-pine bg-pine text-white'
										: 'border-line bg-white text-ink hover:border-pine/40 hover:bg-paper-2/50'}"
									onclick={() => changePage(page)}
									aria-label="Page {page}"
									aria-current={currentPage === page ? 'page' : undefined}
								>
									{page}
								</button>
							{/each}

							<button
								type="button"
								class="flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 text-[0.85rem] font-semibold text-ink transition-all duration-200 hover:border-pine hover:bg-pine hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-white disabled:hover:text-ink"
								disabled={currentPage === totalPages}
								onclick={() => changePage(currentPage + 1)}
								aria-label="Next page"
							>
								&raquo;
							</button>
						</nav>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ── Shared filter form (used in both the sidebar and the mobile drawer) ── -->
{#snippet filterForm()}
	<form class="flex flex-col gap-6 p-5" onsubmit={(e) => e.preventDefault()}>
		<div class="flex flex-col gap-3">
			<h3
				class="m-0 border-b border-line pb-2 font-mono text-[0.72rem] font-bold tracking-[0.08em] text-pine uppercase"
			>
				Category
			</h3>
			<div class="flex max-h-[260px] flex-col gap-1.5 overflow-y-auto">
				<label
					class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.85rem] text-ink transition-colors duration-150 hover:bg-paper-2/50"
				>
					<input
						type="radio"
						name="brand"
						class="h-4 w-4 shrink-0 cursor-pointer accent-pine"
						checked={filters.category === null}
						onchange={() => selectCategory(null)}
					/>
					<span>All Categories</span>
				</label>
				{#each brands as brand (brand.id)}
					<label
						class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.85rem] text-ink transition-colors duration-150 hover:bg-paper-2/50"
					>
						<input
							type="radio"
							name="brand"
							class="h-4 w-4 shrink-0 cursor-pointer accent-pine"
							checked={filters.category === brand.id}
							onchange={() => selectCategory(brand.id)}
						/>
						<span>{brand.name}</span>
					</label>
				{/each}
				{#if brands.length === 0}
					<p class="text-[0.8rem] text-ink-soft/70">No categories available.</p>
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<h3
				class="m-0 border-b border-line pb-2 font-mono text-[0.72rem] font-bold tracking-[0.08em] text-pine uppercase"
			>
				Price Range
			</h3>
			<div class="flex items-end gap-2.5">
				<label class="flex min-w-0 flex-1 flex-col gap-1 text-[0.7rem] font-semibold text-ink-soft">
					<span>Min</span>
					<input
						type="number"
						min="0"
						max={filters.maxPrice}
						class="w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[0.85rem] text-ink outline-none focus:border-pine focus:ring-2 focus:ring-pine/15"
						bind:value={filters.minPrice}
						onchange={applyPriceFilter}
					/>
				</label>
				<span class="pb-2 text-ink-soft">–</span>
				<label class="flex min-w-0 flex-1 flex-col gap-1 text-[0.7rem] font-semibold text-ink-soft">
					<span>Max</span>
					<input
						type="number"
						min={filters.minPrice}
						class="w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[0.85rem] text-ink outline-none focus:border-pine focus:ring-2 focus:ring-pine/15"
						bind:value={filters.maxPrice}
						onchange={applyPriceFilter}
					/>
				</label>
			</div>
			<input
				type="range"
				min="0"
				max="10000"
				step="50"
				bind:value={filters.maxPrice}
				onchange={applyPriceFilter}
				class="w-full cursor-pointer accent-pine"
				aria-label="Maximum price"
			/>
		</div>

		<button
			type="button"
			class="cursor-pointer rounded-xl border border-pine/20 bg-teal/10 px-4 py-2.5 text-[0.85rem] font-bold text-pine-dark transition-colors duration-200 hover:bg-pine hover:text-white"
			onclick={clearFilters}>Clear all filters</button
		>
	</form>
{/snippet}
