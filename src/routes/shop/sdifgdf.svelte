<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import type { PageData } from './$types';
	import { getImageUrl } from '$lib/utils/image';
	import { getProductUrl } from '$lib/utils/url';
	import { handleAddToCart } from '$lib/utils/cart';

	let { data }: { data: PageData } = $props();
	let isAddingToCart = $state(false);
	let addingProductId = $state<string | null>(null);

	// Filter states
	let searchQuery = $state('');
	let selectedSubcategory = $state('');
	let selectedPriceRange = $state('all');
	let sortBy = $state('featured');
	let currentPage = $state(1);
	let viewMode = $state<'grid' | 'list'>('grid');
	const itemsPerPage = 12;

	// Get subcategories from API data
	const subcategories = $derived((data as any)?.subcategories || []);
	const allProducts = $derived(data?.products || []);

	// Price ranges
	const priceRanges = [
		{ label: 'All Prices', value: 'all', min: 0, max: Infinity },
		{ label: 'Under NRP 500', value: '0-500', min: 0, max: 500 },
		{ label: 'NRP 500 – 1,000', value: '500-1000', min: 500, max: 1000 },
		{ label: 'NRP 1,000 – 2,000', value: '1000-2000', min: 1000, max: 2000 },
		{ label: 'NRP 2,000 – 5,000', value: '2000-5000', min: 2000, max: 5000 },
		{ label: 'Above NRP 5,000', value: '5000+', min: 5000, max: Infinity }
	];

	const hasActiveFilters = $derived(
		searchQuery !== '' ||
			selectedSubcategory !== '' ||
			selectedPriceRange !== 'all' ||
			sortBy !== 'featured'
	);

	// Reactive filtering logic
	const filteredProducts = $derived.by(() => {
		return allProducts.filter((product: any) => {
			const searchMatch =
				!searchQuery ||
				product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				product.description?.toLowerCase().includes(searchQuery.toLowerCase());

			const subcategoryMatch =
				!selectedSubcategory ||
				(product.subcategories &&
					product.subcategories.some((sub: any) => sub.id === selectedSubcategory));

			const priceRangeObj = priceRanges.find((r) => r.value === selectedPriceRange);
			const productPrice = parseFloat(product.regular_price) || 0;
			const priceMatch =
				!priceRangeObj || (productPrice >= priceRangeObj.min && productPrice <= priceRangeObj.max);

			return searchMatch && subcategoryMatch && priceMatch;
		});
	});

	// Sort products
	const sortedProducts = $derived.by(() => {
		const products = [...filteredProducts];
		switch (sortBy) {
			case 'price-low':
				return products.sort((a: any, b: any) => a.regular_price - b.regular_price);
			case 'price-high':
				return products.sort((a: any, b: any) => b.regular_price - a.regular_price);
			case 'name-az':
				return products.sort((a: any, b: any) => a.name.localeCompare(b.name));
			case 'name-za':
				return products.sort((a: any, b: any) => b.name.localeCompare(a.name));
			case 'newest':
				return products.sort((a: any, b: any) => b.id - a.id);
			default:
				return products;
		}
	});

	// Pagination
	const totalPages = $derived(Math.ceil(sortedProducts.length / itemsPerPage));
	const paginatedProducts = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return sortedProducts.slice(start, end);
	});

	const pageNumbers = $derived.by(() => {
		const pages: (number | 'ellipsis')[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (currentPage > 3) pages.push('ellipsis');
			for (
				let i = Math.max(2, currentPage - 1);
				i <= Math.min(totalPages - 1, currentPage + 1);
				i++
			) {
				pages.push(i);
			}
			if (currentPage < totalPages - 2) pages.push('ellipsis');
			pages.push(totalPages);
		}
		return pages;
	});

	// Reset to page 1 when filters change
	$effect(() => {
		if (searchQuery || selectedSubcategory || selectedPriceRange || sortBy) {
			currentPage = 1;
		}
	});

	function clearFilters() {
		searchQuery = '';
		selectedSubcategory = '';
		selectedPriceRange = 'all';
		sortBy = 'featured';
		currentPage = 1;
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	async function onAddToCart(e: MouseEvent, product: any) {
		e.preventDefault();
		e.stopPropagation();
		addingProductId = product.id;
		await handleAddToCart(product);
		setTimeout(() => (addingProductId = null), 800);
	}

	function formatPrice(price: number | string) {
		return Number(price).toLocaleString('en-NP');
	}
</script>

<svelte:head>
	<title>All Products — Hemp Store</title>
	<meta name="description" content="Browse our complete collection of premium hemp products" />
</svelte:head>

<Topbar />

<main class="products-page">
	<!-- Hero Strip -->
	<div class="hero-strip">
		<div class="hero-inner">
			<div class="breadcrumb">
				<a href="/">Home</a>
				<svg viewBox="0 0 16 16" fill="currentColor"
					><path
						d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"
					/></svg
				>
				<span>All Products</span>
			</div>
			<h1>Our Collection</h1>
			<p>Explore premium hemp — crafted with care, rooted in nature.</p>
		</div>
		<div class="hero-bg-shapes">
			<div class="shape shape-1"></div>
			<div class="shape shape-2"></div>
			<div class="shape shape-3"></div>
		</div>
	</div>

	<div class="container">
		<!-- Filters Panel -->
		<div class="filters-panel">
			<div class="filters-top">
				<!-- Search -->
				<div class="search-wrap">
					<svg
						class="search-ico"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" stroke-linecap="round" />
					</svg>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search products…"
						class="search-input"
						aria-label="Search products"
					/>
					{#if searchQuery}
						<button
							class="clear-search"
							onclick={() => (searchQuery = '')}
							aria-label="Clear search"
							title="Clear search"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</button>
					{/if}
				</div>

				<div class="selects-row">
					<!-- Subcategory -->
					{#if subcategories.length > 0}
						<div class="select-wrap">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
								><path d="M4 6h16M7 12h10M10 18h4" stroke-linecap="round" /></svg
							>
							<select
								bind:value={selectedSubcategory}
								class="filter-select"
								aria-label="Filter by category"
							>
								<option value="">All Categories</option>
								{#each subcategories as subcategory}
									<option value={subcategory.id}>{subcategory.name}</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Price Range -->
					<div class="select-wrap">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
							><path
								d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
								stroke-linecap="round"
							/></svg
						>
						<select
							bind:value={selectedPriceRange}
							class="filter-select"
							aria-label="Filter by price"
						>
							{#each priceRanges as range}
								<option value={range.value}>{range.label}</option>
							{/each}
						</select>
					</div>

					<!-- Sort By -->
					<div class="select-wrap">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
							><path d="M3 6h18M7 12h10M11 18h2" stroke-linecap="round" /></svg
						>
						<select bind:value={sortBy} class="filter-select" aria-label="Sort products">
							<option value="featured">Featured</option>
							<option value="price-low">Price: Low → High</option>
							<option value="price-high">Price: High → Low</option>
							<option value="name-az">Name: A–Z</option>
							<option value="name-za">Name: Z–A</option>
							<option value="newest">Newest First</option>
						</select>
					</div>

					<!-- Clear -->
					{#if hasActiveFilters}
						<button class="clear-btn" onclick={clearFilters}>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
								><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" /></svg
							>
							Clear filters
						</button>
					{/if}
				</div>
			</div>

			<div class="filters-bottom">
				<div class="results-info">
					<span class="count-pill">{filteredProducts.length}</span>
					<span class="results-label">
						{filteredProducts.length === 1 ? 'product' : 'products'} found
					</span>
					{#if filteredProducts.length !== allProducts.length}
						<span class="filtered-note">of {allProducts.length} total</span>
					{/if}
				</div>

				<!-- View Mode Toggle -->
				<div class="view-toggle" role="group" aria-label="View mode">
					<button
						class="view-btn"
						class:active={viewMode === 'grid'}
						onclick={() => (viewMode = 'grid')}
						aria-label="Grid view"
						title="Grid view"
					>
						<svg viewBox="0 0 24 24" fill="currentColor"
							><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" /></svg
						>
					</button>
					<button
						class="view-btn"
						class:active={viewMode === 'list'}
						onclick={() => (viewMode = 'list')}
						aria-label="List view"
						title="List view"
					>
						<svg viewBox="0 0 24 24" fill="currentColor"
							><path
								d="M3 5h2v2H3zm4 0h14v2H7zM3 11h2v2H3zm4 0h14v2H7zM3 17h2v2H3zm4 0h14v2H7z"
							/></svg
						>
					</button>
				</div>
			</div>
		</div>

		<!-- Products Grid / List -->
		{#if paginatedProducts.length > 0}
			<div class="products-grid" class:list-mode={viewMode === 'list'}>
				{#each paginatedProducts as product}
					<a
						href={getProductUrl(product)}
						class="product-card"
						class:list-card={viewMode === 'list'}
					>
						<!-- Badge -->
						{#if product.sales_price && product.regular_price > product.sales_price}
							<div class="badge badge-sale">
								–{Math.round(
									((product.regular_price - product.sales_price) / product.regular_price) * 100
								)}%
							</div>
						{:else if product.is_new}
							<div class="badge badge-new">New</div>
						{/if}

						<!-- Image -->
						<div class="product-image">
							<img
								src={getImageUrl(product.main_image || product.image)}
								alt={product.name}
								loading="lazy"
							/>
							<div class="product-overlay">
								<button
									class="overlay-btn"
									aria-label="Quick view {product.name}"
									title="Quick view"
									onclick={(e) => e.preventDefault()}
								>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								</button>
								<button
									class="overlay-btn"
									aria-label="Add to wishlist"
									title="Wishlist"
									onclick={(e) => e.preventDefault()}
								>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
										/>
									</svg>
								</button>
							</div>
						</div>

						<!-- Info -->
						<div class="product-info">
							{#if product.subcategories?.length}
								<span class="product-category">{product.subcategories[0].name}</span>
							{/if}
							<h3 class="product-name">{product.name}</h3>

							{#if viewMode === 'list' && product.description}
								<p class="product-desc">{product.description?.slice(0, 120)}…</p>
							{/if}

							<div class="price-row">
								<span class="current-price">NRP {formatPrice(product.regular_price)}</span>
								{#if product.sales_price && product.regular_price > product.sales_price}
									<span class="original-price">NRP {formatPrice(product.sales_price)}</span>
								{/if}
							</div>

							<button
								class="add-to-cart-btn"
								class:adding={addingProductId === product.id}
								onclick={(e) => onAddToCart(e, product)}
								disabled={addingProductId === product.id}
								aria-label="Add {product.name} to cart"
							>
								{#if addingProductId === product.id}
									<svg
										class="spinner"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2.5"
									>
										<path
											d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
											stroke-linecap="round"
										/>
									</svg>
									Adding…
								{:else}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
										/>
									</svg>
									Add to Cart
								{/if}
							</button>
						</div>
					</a>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="pagination-wrap">
					<div class="pagination">
						<!-- First + Prev -->
						<button
							class="pg-btn pg-arrow"
							onclick={() => goToPage(1)}
							disabled={currentPage === 1}
							aria-label="First page"
							title="First page"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path
									d="M11 17l-5-5 5-5M18 17l-5-5 5-5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>
						<button
							class="pg-btn pg-arrow"
							onclick={() => goToPage(currentPage - 1)}
							disabled={currentPage === 1}
							aria-label="Previous page"
							title="Previous page"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</button>

						<!-- Page Numbers -->
						<div class="page-numbers">
							{#each pageNumbers as pg}
								{#if pg === 'ellipsis'}
									<span class="pg-ellipsis">…</span>
								{:else}
									<button
										class="pg-btn pg-num"
										class:active={pg === currentPage}
										onclick={() => goToPage(pg as number)}
										aria-label="Page {pg}"
										aria-current={pg === currentPage ? 'page' : undefined}>{pg}</button
									>
								{/if}
							{/each}
						</div>

						<!-- Next + Last -->
						<button
							class="pg-btn pg-arrow"
							onclick={() => goToPage(currentPage + 1)}
							disabled={currentPage === totalPages}
							aria-label="Next page"
							title="Next page"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</button>
						<button
							class="pg-btn pg-arrow"
							onclick={() => goToPage(totalPages)}
							disabled={currentPage === totalPages}
							aria-label="Last page"
							title="Last page"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path
									d="M13 17l5-5-5-5M6 17l5-5-5-5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>
					</div>

					<p class="page-info">
						Showing <strong
							>{(currentPage - 1) * itemsPerPage + 1}–{Math.min(
								currentPage * itemsPerPage,
								sortedProducts.length
							)}</strong
						>
						of <strong>{sortedProducts.length}</strong> products &nbsp;·&nbsp; Page
						<strong>{currentPage}</strong>
						of <strong>{totalPages}</strong>
					</p>
				</div>
			{/if}
		{:else}
			<div class="no-products">
				<div class="no-products-icon">
					<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
						<circle cx="28" cy="28" r="20" />
						<path d="M44 44l12 12" stroke-linecap="round" />
						<path d="M20 28h16M28 20v16" stroke-linecap="round" />
					</svg>
				</div>
				<h3>No products found</h3>
				<p>Try adjusting your search or removing some filters.</p>
				<button class="reset-btn" onclick={clearFilters}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
						><path
							d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
							stroke-linecap="round"
						/><path d="M3 3v5h5" stroke-linecap="round" stroke-linejoin="round" /></svg
					>
					Reset All Filters
				</button>
			</div>
		{/if}
	</div>
</main>

<Footer />

<style>
	/* ── Tokens ────────────────────────────────────── */
	:root {
		--forest: #0b2d12;
		--forest-mid: #1a5228;
		--leaf: #2d8a4e;
		--leaf-light: #4caf70;
		--cream: #f7f4ef;
		--cream-dark: #ede8df;
		--gold: #c9a84c;
		--gold-light: #e8c97a;
		--text: #1a1a1a;
		--text-muted: #6b7280;
		--border: #e2ddd5;
		--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
		--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
		--shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.12), 0 6px 20px rgba(0, 0, 0, 0.06);
		--radius-card: 20px;
		--radius-btn: 12px;
		--transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* ── Page ──────────────────────────────────────── */
	.products-page {
		background: var(--cream);
		min-height: 100vh;
	}

	.container {
		max-width: 1320px;
		margin: 0 auto;
		padding: 0 24px 80px;
	}

	/* ── Hero Strip ───────────────────────────────── */
	.hero-strip {
		position: relative;
		background: linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 60%, #1e6b3a 100%);
		color: white;
		padding: 100px 24px 56px;
		overflow: hidden;
		margin-bottom: 0;
	}

	.hero-inner {
		position: relative;
		z-index: 2;
		max-width: 1320px;
		margin: 0 auto;
	}

	.hero-strip h1 {
		font-size: clamp(2.2rem, 5vw, 3.6rem);
		font-weight: 800;
		letter-spacing: -0.03em;
		margin: 12px 0 10px;
		line-height: 1.1;
		background: linear-gradient(135deg, #ffffff 0%, var(--gold-light) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-strip p {
		font-size: 1.05rem;
		color: rgba(255, 255, 255, 0.65);
		font-weight: 400;
		letter-spacing: 0.01em;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.82rem;
		color: rgba(255, 255, 255, 0.5);
		margin-bottom: 6px;
	}

	.breadcrumb a {
		color: rgba(255, 255, 255, 0.65);
		text-decoration: none;
		transition: color var(--transition);
	}

	.breadcrumb a:hover {
		color: white;
	}

	.breadcrumb svg {
		width: 14px;
		height: 14px;
		opacity: 0.45;
	}

	/* Decorative shapes */
	.hero-bg-shapes {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.shape {
		position: absolute;
		border-radius: 50%;
		opacity: 0.06;
		background: white;
	}

	.shape-1 {
		width: 420px;
		height: 420px;
		top: -120px;
		right: -80px;
	}
	.shape-2 {
		width: 240px;
		height: 240px;
		bottom: -60px;
		right: 20%;
	}
	.shape-3 {
		width: 140px;
		height: 140px;
		top: 30px;
		left: 42%;
	}

	/* ── Filters Panel ────────────────────────────── */
	.filters-panel {
		background: white;
		border-radius: 0 0 var(--radius-card) var(--radius-card);
		box-shadow: var(--shadow-md);
		border: 1px solid var(--border);
		border-top: none;
		padding: 24px 28px 20px;
		margin-bottom: 36px;
		position: sticky;
		top: 0;
		z-index: 40;
	}

	.filters-top {
		display: flex;
		gap: 14px;
		flex-wrap: wrap;
		margin-bottom: 18px;
	}

	/* Search */
	.search-wrap {
		position: relative;
		flex: 1;
		min-width: 240px;
	}

	.search-ico {
		position: absolute;
		left: 14px;
		top: 50%;
		transform: translateY(-50%);
		width: 18px;
		height: 18px;
		color: var(--text-muted);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 11px 42px 11px 44px;
		border: 1.5px solid var(--border);
		border-radius: var(--radius-btn);
		font-size: 0.9rem;
		background: var(--cream);
		color: var(--text);
		transition: all var(--transition);
		font-family: inherit;
	}

	.search-input::placeholder {
		color: #aaa;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--forest);
		background: white;
		box-shadow: 0 0 0 3px rgba(11, 45, 18, 0.08);
	}

	.clear-search {
		position: absolute;
		right: 11px;
		top: 50%;
		transform: translateY(-50%);
		width: 26px;
		height: 26px;
		padding: 0;
		background: var(--cream-dark);
		border: none;
		border-radius: 50%;
		color: var(--text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition);
	}

	.clear-search:hover {
		background: #ddd;
		color: var(--text);
	}
	.clear-search svg {
		width: 14px;
		height: 14px;
	}

	/* Selects row */
	.selects-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		align-items: center;
	}

	.select-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.select-wrap > svg {
		position: absolute;
		left: 12px;
		width: 15px;
		height: 15px;
		color: var(--text-muted);
		pointer-events: none;
		z-index: 1;
	}

	.filter-select {
		padding: 10px 14px 10px 36px;
		border: 1.5px solid var(--border);
		border-radius: var(--radius-btn);
		font-size: 0.875rem;
		background: var(--cream);
		color: var(--text);
		cursor: pointer;
		transition: all var(--transition);
		font-family: inherit;
		font-weight: 500;
		appearance: none;
		-webkit-appearance: none;
		min-width: 160px;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
		padding-right: 34px;
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--forest);
		background-color: white;
		box-shadow: 0 0 0 3px rgba(11, 45, 18, 0.08);
	}

	.clear-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 18px;
		background: #fff1f0;
		border: 1.5px solid #fca5a5;
		color: #dc2626;
		border-radius: var(--radius-btn);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition);
		font-family: inherit;
		white-space: nowrap;
	}

	.clear-btn svg {
		width: 15px;
		height: 15px;
	}
	.clear-btn:hover {
		background: #dc2626;
		border-color: #dc2626;
		color: white;
	}

	/* Bottom row */
	.filters-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-top: 16px;
		border-top: 1px solid var(--border);
		flex-wrap: wrap;
	}

	.results-info {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.count-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 36px;
		height: 28px;
		padding: 0 10px;
		background: var(--forest);
		color: white;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.01em;
	}

	.results-label {
		font-weight: 500;
		color: var(--text);
	}
	.filtered-note {
		color: #aaa;
		font-size: 0.82rem;
	}

	/* View toggle */
	.view-toggle {
		display: flex;
		background: var(--cream);
		border: 1.5px solid var(--border);
		border-radius: 10px;
		overflow: hidden;
		gap: 0;
	}

	.view-btn {
		width: 38px;
		height: 34px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition);
	}

	.view-btn svg {
		width: 16px;
		height: 16px;
	}
	.view-btn:hover {
		color: var(--forest);
	}
	.view-btn.active {
		background: var(--forest);
		color: white;
	}

	/* ── Products Grid ────────────────────────────── */
	.products-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 22px;
		margin-bottom: 48px;
	}

	.products-grid.list-mode {
		grid-template-columns: 1fr;
		gap: 14px;
	}

	/* ── Product Card ─────────────────────────────── */
	.product-card {
		background: white;
		border-radius: var(--radius-card);
		overflow: hidden;
		border: 1px solid var(--border);
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		position: relative;
		transition: all var(--transition);
		box-shadow: var(--shadow-sm);
	}

	.product-card:hover {
		transform: translateY(-6px);
		box-shadow: var(--shadow-lg);
		border-color: rgba(11, 45, 18, 0.15);
	}

	/* List mode card */
	.list-card {
		flex-direction: row;
		border-radius: 16px;
	}

	.list-card .product-image {
		width: 200px;
		min-width: 200px;
		height: 180px;
		border-radius: 16px 0 0 16px;
	}

	.list-card .product-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 24px 28px;
		text-align: left;
	}

	.list-card .add-to-cart-btn {
		max-width: 200px;
	}

	.list-card .product-overlay {
		border-radius: 16px 0 0 16px;
	}

	/* Badge */
	.badge {
		position: absolute;
		top: 14px;
		left: 14px;
		z-index: 2;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.badge-sale {
		background: linear-gradient(135deg, #dc2626, #ef4444);
		color: white;
		box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
	}

	.badge-new {
		background: linear-gradient(135deg, var(--forest), var(--leaf));
		color: white;
		box-shadow: 0 2px 8px rgba(11, 45, 18, 0.3);
	}

	/* Image */
	.product-image {
		position: relative;
		height: 340px;
		overflow: hidden;
		background: var(--cream);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}

	.product-image img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.product-card:hover .product-image img {
		transform: scale(1.07);
	}

	/* Overlay */
	.product-overlay {
		position: absolute;
		inset: 0;
		background: rgba(11, 45, 18, 0.72);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
		opacity: 0;
		transition: opacity var(--transition);
	}

	.product-card:hover .product-overlay {
		opacity: 1;
	}

	.overlay-btn {
		width: 48px;
		height: 48px;
		background: white;
		border: none;
		border-radius: 50%;
		color: var(--forest);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition);
		transform: translateY(8px);
		box-shadow: var(--shadow-md);
	}

	.product-card:hover .overlay-btn {
		transform: translateY(0);
	}

	.overlay-btn:hover {
		background: var(--gold-light);
		transform: scale(1.1) !important;
	}

	.overlay-btn svg {
		width: 20px;
		height: 20px;
	}

	/* Info */
	.product-info {
		padding: 18px 18px 18px;
		flex: 1;
		display: flex;
		flex-direction: column;
		text-align: center;
	}

	.product-category {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--leaf);
		margin-bottom: 5px;
	}

	.product-name {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text);
		margin: 0 0 6px 0;
		line-height: 1.35;
		transition: color var(--transition);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.product-card:hover .product-name {
		color: var(--forest);
	}

	.product-desc {
		font-size: 0.82rem;
		color: var(--text-muted);
		line-height: 1.6;
		margin-bottom: 10px;
	}

	/* Price */
	.price-row {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 8px;
		margin: 8px 0 14px;
		flex-wrap: wrap;
	}

	.list-card .price-row {
		justify-content: flex-start;
	}

	.current-price {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--forest);
		letter-spacing: -0.01em;
	}

	.original-price {
		font-size: 0.82rem;
		color: #aaa;
		text-decoration: line-through;
	}

	/* Add to Cart */
	.add-to-cart-btn {
		width: 100%;
		background: var(--forest);
		color: white;
		border: none;
		padding: 11px 16px;
		border-radius: var(--radius-btn);
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: all var(--transition);
		position: relative;
		overflow: hidden;
		font-family: inherit;
		letter-spacing: 0.02em;
		margin-top: auto;
	}

	.add-to-cart-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			transparent 0%,
			rgba(255, 255, 255, 0.08) 50%,
			transparent 100%
		);
		transform: translateX(-100%);
		transition: transform 0.5s ease;
	}

	.add-to-cart-btn:hover::before {
		transform: translateX(100%);
	}

	.add-to-cart-btn:hover:not(:disabled) {
		background: var(--leaf);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(11, 45, 18, 0.35);
	}

	.add-to-cart-btn:disabled {
		opacity: 0.8;
		cursor: not-allowed;
		transform: none !important;
	}

	.add-to-cart-btn svg {
		width: 18px;
		height: 18px;
	}

	/* Spinner */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.spinner {
		animation: spin 0.7s linear infinite;
	}

	/* ── Pagination ───────────────────────────────── */
	.pagination-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding-top: 12px;
	}

	.pagination {
		display: flex;
		align-items: center;
		gap: 6px;
		background: white;
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 8px 10px;
		box-shadow: var(--shadow-sm);
	}

	.page-numbers {
		display: flex;
		align-items: center;
		gap: 4px;
		margin: 0 4px;
	}

	.pg-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		cursor: pointer;
		font-family: inherit;
		font-weight: 600;
		transition: all var(--transition);
		border-radius: 10px;
	}

	.pg-arrow {
		width: 38px;
		height: 38px;
		background: var(--cream);
		color: var(--text-muted);
	}

	.pg-arrow svg {
		width: 18px;
		height: 18px;
	}

	.pg-arrow:hover:not(:disabled) {
		background: var(--forest);
		color: white;
		transform: scale(1.06);
	}

	.pg-arrow:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.pg-num {
		min-width: 38px;
		height: 38px;
		padding: 0 10px;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.pg-num:hover:not(.active) {
		background: var(--cream);
		color: var(--forest);
	}

	.pg-num.active {
		background: var(--forest);
		color: white;
		box-shadow: 0 4px 12px rgba(11, 45, 18, 0.3);
		transform: scale(1.06);
	}

	.pg-ellipsis {
		color: #bbb;
		font-weight: 600;
		width: 28px;
		text-align: center;
		font-size: 0.9rem;
	}

	.page-info {
		font-size: 0.82rem;
		color: var(--text-muted);
		text-align: center;
	}

	.page-info strong {
		color: var(--text);
	}

	/* ── No Products ──────────────────────────────── */
	.no-products {
		text-align: center;
		padding: 80px 32px;
		background: white;
		border-radius: var(--radius-card);
		border: 1.5px dashed var(--border);
	}

	.no-products-icon {
		width: 80px;
		height: 80px;
		margin: 0 auto 24px;
		opacity: 0.25;
		color: var(--forest);
	}

	.no-products-icon svg {
		width: 100%;
		height: 100%;
	}

	.no-products h3 {
		font-size: 1.4rem;
		font-weight: 800;
		color: var(--text);
		margin-bottom: 10px;
	}

	.no-products p {
		color: var(--text-muted);
		font-size: 0.95rem;
		margin-bottom: 28px;
	}

	.reset-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: var(--forest);
		color: white;
		border: none;
		padding: 13px 30px;
		border-radius: var(--radius-btn);
		font-weight: 700;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all var(--transition);
		font-family: inherit;
	}

	.reset-btn svg {
		width: 18px;
		height: 18px;
	}
	.reset-btn:hover {
		background: var(--leaf);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(11, 45, 18, 0.3);
	}

	/* ── Responsive ───────────────────────────────── */
	@media (max-width: 1200px) {
		.products-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 900px) {
		.products-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 16px;
		}
		.filters-panel {
			position: static;
			border-radius: var(--radius-card);
			border: 1px solid var(--border);
		}
	}

	@media (max-width: 640px) {
		.hero-strip {
			padding: 88px 20px 44px;
		}
		.container {
			padding: 0 16px 60px;
		}
		.filters-panel {
			padding: 18px 16px 14px;
		}
		.filters-top {
			flex-direction: column;
		}
		.search-wrap {
			min-width: 100%;
		}
		.filter-select {
			min-width: 100%;
		}
		.selects-row {
			flex-direction: column;
		}
		.clear-btn {
			width: 100%;
			justify-content: center;
		}
		.products-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 12px;
		}
		.product-image {
			height: 190px;
		}
		.list-card {
			flex-direction: column;
		}
		.list-card .product-image {
			width: 100%;
			min-width: unset;
			height: 200px;
			border-radius: 16px 16px 0 0;
		}
		.list-card .product-info {
			padding: 16px;
			text-align: center;
		}
		.list-card .price-row {
			justify-content: center;
		}
		.list-card .add-to-cart-btn {
			max-width: 100%;
		}
	}

	@media (max-width: 420px) {
		.products-grid {
			grid-template-columns: 1fr;
		}
		.product-image {
			height: 240px;
		}
	}
</style>
