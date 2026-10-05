<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import Footer from '$lib/components/Footer.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import { getImageUrl } from '$lib/utils/image';
	import { getProductUrl } from '$lib/utils/url';
	import { handleAddToCart } from '$lib/utils/cart';
	import topbg from '$lib/assets/images/2.png';
	import AllProducts from '$lib/components/AllProducts.svelte';
	import ProductGrid from '$lib/components/ProductGrid.svelte';

	// ---------- Filter State ----------
	let selectedCategory = $state<number | null>(null);
	let searchQuery = $state('');
	let minPrice = $state(0);
	let maxPrice = $state(10000);
	let sortBy = $state('default');

	// ---------- UI State ----------
	let currentPage = $state(1);
	let itemsPerPage = 18;
	let isLoading = $state(false);
	let filterDrawerOpen = $state(false);

	// ---------- Data ----------
	let brands = $state([]);
	let allProducts = $state([]);

	onMount(async () => {
		await fetchCategories();
		await loadProducts();
	});

	// -----------------------------
	// Categories
	// -----------------------------
	async function fetchCategories() {
		try {
			const res = await fetch(`${env.PUBLIC_BASE_URL}/api/get-categories/`);

			const data = await res.json();

			brands = (data.data ?? []).map((category: any) => ({
				id: category.id,
				name: category.name,
				image: category.featured_image
			}));
		} catch (err) {
			console.error(err);
		}
	}

	// -----------------------------
	// Products (Single API Function)
	// -----------------------------
	async function loadProducts(page = currentPage) {
		isLoading = true;

		try {
			const params = new URLSearchParams();

			if (selectedCategory) params.set('category', selectedCategory.toString());

			if (searchQuery.trim()) params.set('search', searchQuery.trim());

			if (sortBy !== 'default') params.set('sort', sortBy);

			params.set('page', page.toString());

			const res = await fetch(`${env.PUBLIC_BASE_URL}/api/paginated-products/?${params}`);

			if (!res.ok) throw new Error('Failed to load products');

			const data = await res.json();

			allProducts = data.results.map((product: any) => {
				const regular = Number(product.regular_price);
				const sale = Number(product.sale_price) || 0;

				return {
					id: product.id,
					name: product.name,
					brand: product.category?.name,
					price: sale || regular,
					originalPrice: regular,
					discount: sale && sale < regular ? Math.round(((regular - sale) / regular) * 100) : 0,
					image: product.image,
					slug: product.slug
				};
			});

			currentPage = page;
		} catch (err) {
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	// -----------------------------
	// Filter Actions
	// -----------------------------
	async function selectCategory(id: number) {
		selectedCategory = selectedCategory === id ? null : id;

		currentPage = 1;

		await loadProducts();

		filterDrawerOpen = false;
	}

	async function searchProducts(query: string) {
		searchQuery = query;
		currentPage = 1;

		await loadProducts();
	}

	async function changeSort(sort: string) {
		sortBy = sort;
		currentPage = 1;

		await loadProducts();
	}

	async function changePage(page: number) {
		await loadProducts(page);

		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	}

	async function clearFilters() {
		selectedCategory = null;
		searchQuery = '';
		sortBy = 'default';
		minPrice = 0;
		maxPrice = 10000;
		currentPage = 1;

		await loadProducts();
	}
	function closeDrawerOnEscape(e: KeyboardEvent) {
		if (e.key === 'Escape') filterDrawerOpen = false;
	}
</script>

<svelte:window onkeydown={filterDrawerOpen ? closeDrawerOnEscape : undefined} />

<Topbar />

<!-- ── Hero ── -->
<div class="category-hero">
	<img src={topbg} alt="" loading="eager" />
	<div class="hero-content">
		<div class="hero-top-row">
			<nav class="breadcrumb-hero" aria-label="Breadcrumb">
				<a href="/">Home</a>
				<span class="sep" aria-hidden="true">›</span>
				<span class="current">Products</span>
			</nav>
			<div class="hero-actions">
				<button class="hero-btn btn-video" type="button">
					<div class="hero-btn-icon" aria-hidden="true">▶</div>
					<div class="hero-btn-text">
						<span class="hero-btn-label">How to order</span>
						<span class="hero-btn-main">Watch Video</span>
					</div>
				</button>
				<button class="hero-btn btn-rate" type="button">
					<div class="hero-btn-icon" aria-hidden="true">📄</div>
					<div class="hero-btn-text">
						<span class="hero-btn-label">Download</span>
						<span class="hero-btn-main">Today's Rate</span>
					</div>
				</button>
				<a href="tel:+9779851247506" class="hero-btn btn-call">
					<div class="hero-btn-icon" aria-hidden="true">📞</div>
					<div class="hero-btn-text">
						<span class="hero-btn-label">Call to order</span>
						<span class="hero-btn-main">9851247506</span>
					</div>
				</a>
			</div>
		</div>
	</div>
</div>

<!-- ── Mobile filter toggle ── -->
<div class="mobile-filter-bar">
	<button
		class="mobile-filter-btn"
		type="button"
		onclick={() => (filterDrawerOpen = !filterDrawerOpen)}
		aria-expanded={filterDrawerOpen}
		aria-controls="filterDrawer"
	>
		<svg
			width="16"
			height="16"
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
	<div class="mobile-sort-wrap">
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<path d="M3 6h18M7 12h10M11 18h2" />
		</svg>
		<select class="sort-select" aria-label="Sort products" bind:value={sortBy}>
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
	<div class="drawer-overlay" role="presentation" onclick={() => (filterDrawerOpen = false)}></div>
	<div class="filter-drawer" id="filterDrawer" aria-label="Filters panel">
		<div class="drawer-header">
			<span>Filters</span>
			<button
				class="drawer-close"
				type="button"
				onclick={() => (filterDrawerOpen = false)}
				aria-label="Close filters">✕</button
			>
		</div>
		<div class="drawer-body">
			{@render filterForm()}
		</div>
	</div>
{/if}

<main class="categories-page">
	<div class="container">
		<div class="page-layout">
			<!-- Sidebar (desktop only) -->
			<aside class="sidebar-col" aria-label="Filters">
				{@render filterForm()}
			</aside>

			<!-- Main Content -->
			<div class="main-content">
				<!-- Topbar row -->
				<div class="content-header">
					<h2 class="section-title">Products</h2>
					<div class="topbar-row">
						<div class="search-wrap">
							<svg
								class="search-icon"
								width="15"
								height="15"
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
								class="search-input"
								placeholder="Search products…"
								aria-label="Search products"
								bind:value={searchQuery}
							/>
						</div>

						<div class="topbar-divider" aria-hidden="true"></div>

						<div class="sort-wrap">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
								style="color:#9ca3af;flex-shrink:0"
							>
								<path d="M3 6h18M7 12h10M11 18h2" />
							</svg>
							<label class="sort-label" for="sortSelect">Sort by</label>
							<select id="sortSelect" class="sort-select" bind:value={sortBy}>
								<option value="default">Default</option>
								<option value="price-asc">Price: Low → High</option>
								<option value="price-desc">Price: High → Low</option>
								<option value="name-asc">Name: A → Z</option>
								<option value="name-desc">Name: Z → A</option>
								<option value="discount">Biggest Discount</option>
							</select>
						</div>

						<div class="topbar-divider" aria-hidden="true"></div>

						<div class="view-toggle-wrap">
							<span class="view-label">View</span>
							<div class="view-toggle" role="group" aria-label="View layout">
								<button
									class="view-btn {viewMode === 'grid' ? 'active' : ''}"
									type="button"
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
									class="view-btn {viewMode === 'list' ? 'active' : ''}"
									type="button"
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

				<!-- Loading State -->
				{#if isLoading}
					<div class="state-container">
						<div class="skeleton-grid">
							{#each Array(8) as _}
								<div class="skeleton-card">
									<div class="skeleton-img"></div>
									<div class="skeleton-body">
										<div class="skeleton-line wide"></div>
										<div class="skeleton-line narrow"></div>
										<div class="skeleton-line medium"></div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{:else if paginatedProducts.length === 0}
					<div class="state-container empty">
						<div class="empty-icon" aria-hidden="true">🌿</div>
						<p class="empty-title">No products found</p>
						<p class="empty-sub">Try adjusting or clearing your filters.</p>
						<button class="clear-all-btn" type="button" onclick={clearFilters}>Clear filters</button
						>
					</div>
				{:else}
					<div class="products-grid-wrapper {viewMode === 'list' ? 'list-view' : ''}">
						<ProductGrid products={paginatedProducts} />
						<!-- {#each paginatedProducts as product (product.id)}
							<a href={getProductUrl(product)} class="product-card">
								<div class="card-image">
									<img
										src={getImageUrl(product.image)}
										alt={product.name}
										loading="lazy"
										decoding="async"
										width="400"
										height="400"
									/>
									{#if product.discount > 0}
										<span class="discount-badge">-{product.discount}%</span>
									{/if}
									<span class="category-badge">{product.brand}</span>
								</div>

								<div class="card-body">
									<h3 class="product-name">{product.name}</h3>

									<div class="stars" aria-label="4.5 out of 5 stars">
										{#each [1, 2, 3, 4] as _}
											<span class="star" aria-hidden="true">★</span>
										{/each}
										<span class="star half" aria-hidden="true">★</span>
									</div>

									<div class="card-footer">
										<div class="price-block">
											{#if product.discount > 0}
												<span class="original-price">Rs.{product.originalPrice}</span>
											{/if}
											<span class="price"><sup>Rs.</sup>{product.price}</span>
										</div>
										<button
											class="add-btn"
											type="button"
											aria-label="Add {product.name} to cart"
											onclick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handleAddToCart(product);
											}}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2.5"
												stroke-linecap="round"
												stroke-linejoin="round"
												aria-hidden="true"
											>
												<line x1="12" y1="5" x2="12" y2="19" />
												<line x1="5" y1="12" x2="19" y2="12" />
											</svg>
										</button>
									</div>
								</div>
							</a>
						{/each} -->
					</div>

					<!-- Pagination -->
					{#if totalPages > 1}
						<nav class="pagination" aria-label="Product pages">
							<button
								class="page-btn"
								type="button"
								disabled={currentPage === 1}
								onclick={() => changePage(currentPage - 1)}
								aria-label="Previous page"
							>
								&laquo;
							</button>

							{#each Array(totalPages) as _, i}
								{@const page = i + 1}
								<button
									class="page-btn {currentPage === page ? 'active' : ''}"
									type="button"
									onclick={() => changePage(page)}
									aria-label="Page {page}"
									aria-current={currentPage === page ? 'page' : undefined}
								>
									{page}
								</button>
							{/each}

							<button
								class="page-btn"
								type="button"
								disabled={currentPage === totalPages}
								onclick={() => changePage(currentPage + 1)}
								aria-label="Next page"
							>
								&raquo;
							</button>
						</nav>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</main>

<Footer />

<!-- ── Shared filter form (used in both the sidebar and the mobile drawer) ── -->
{#snippet filterForm()}
	<form class="filter-form" onsubmit={(e) => e.preventDefault()}>
		<div class="filter-section">
			<h3 class="filter-heading">Category</h3>
			<div class="filter-options">
				<label class="filter-radio">
					<input
						type="radio"
						name="brand"
						checked={selectedBrand === ''}
						onchange={() => selectBrand('', 0)}
					/>
					<span>All Categories</span>
				</label>
				{#each brands as brand (brand.id)}
					<label class="filter-radio">
						<input
							type="radio"
							name="brand"
							value={brand.id}
							checked={selectedBrand === brand.name}
							onchange={() => selectBrand(brand.name, brand.id)}
						/>
						<span>{brand.name}</span>
					</label>
				{/each}
				{#if brands.length === 0}
					<p class="filter-empty">No categories available.</p>
				{/if}
			</div>
		</div>

		<div class="filter-section">
			<h3 class="filter-heading">Price Range</h3>
			<div class="price-inputs">
				<label class="price-field">
					<span>Min</span>
					<input type="number" min="0" max={maxPrice} bind:value={minPrice} />
				</label>
				<span class="price-sep">–</span>
				<label class="price-field">
					<span>Max</span>
					<input type="number" min={minPrice} bind:value={maxPrice} />
				</label>
			</div>
			<input
				type="range"
				min="0"
				max="10000"
				step="50"
				bind:value={maxPrice}
				class="price-slider"
				aria-label="Maximum price"
			/>
		</div>

		<button type="button" class="clear-filters-btn" onclick={clearFilters}>
			Clear all filters
		</button>
	</form>
{/snippet}

<style>
	/* ── Reset / Base ── */
	/* *,
	*::before,
	*::after {
		box-sizing: border-box;
	} */

	/* ── Hero ── */
	.category-hero {
		position: relative;
		height: clamp(160px, 28vw, 260px);
		overflow: hidden;
		box-shadow: 0 10px 40px rgba(255, 215, 0, 0.18);
	}

	.category-hero img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hero-content {
		position: relative;
		z-index: 2;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: clamp(16px, 4vw, 28px) clamp(16px, 5vw, 48px);
		color: #fff;
	}

	.hero-top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
	}

	.breadcrumb-hero {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: clamp(11px, 1.5vw, 13px);
		font-weight: 500;
		opacity: 0.9;
	}

	.breadcrumb-hero a {
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		transition: color 0.2s;
	}
	.breadcrumb-hero a:hover {
		color: #fff;
	}
	.breadcrumb-hero .sep {
		opacity: 0.5;
	}
	.breadcrumb-hero .current {
		font-weight: 600;
		color: #fff;
	}

	.hero-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.hero-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border-radius: 8px;
		font-size: clamp(11px, 1.3vw, 12.5px);
		cursor: pointer;
		border: none;
		text-decoration: none;
		transition: all 0.22s ease;
		white-space: nowrap;
		font-family: inherit;
	}

	.hero-btn-icon {
		width: 26px;
		height: 26px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		font-size: 12px;
	}

	.hero-btn-text {
		display: flex;
		flex-direction: column;
		line-height: 1.1;
		text-align: left;
	}

	.hero-btn-label {
		font-size: 9px;
		font-weight: 500;
		letter-spacing: 0.7px;
		text-transform: uppercase;
		opacity: 0.75;
		margin-bottom: 1px;
	}

	.hero-btn-main {
		font-size: clamp(11px, 1.3vw, 13px);
		font-weight: 700;
	}

	.btn-video {
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(8px);
	}
	.btn-video:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}
	.btn-video .hero-btn-icon {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn-rate {
		background: rgba(134, 239, 172, 0.15);
		color: #bbf7d0;
		border: 1px solid rgba(134, 239, 172, 0.3);
		backdrop-filter: blur(8px);
	}
	.btn-rate:hover {
		background: rgba(134, 239, 172, 0.25);
		transform: translateY(-2px);
	}
	.btn-rate .hero-btn-icon {
		background: rgba(134, 239, 172, 0.2);
		color: #86efac;
	}

	.btn-call {
		background: #16a34a;
		color: #fff;
		border: 1px solid #15803d;
		box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);
	}
	.btn-call:hover {
		background: #15803d;
		transform: translateY(-2px);
	}
	.btn-call .hero-btn-icon {
		background: rgba(255, 255, 255, 0.2);
	}

	/* ── Mobile filter bar ── */
	.mobile-filter-bar {
		display: none;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 10px 16px;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		position: sticky;
		top: 0;
		z-index: 40;
	}

	.mobile-filter-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		background: #d4a017;
		color: #fff;
		border: none;
		border-radius: 7px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.18s;
		white-space: nowrap;
	}
	.mobile-filter-btn:hover {
		background: #b8880e;
	}

	.mobile-sort-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		max-width: 220px;
		margin-left: auto;
	}
	.mobile-sort-wrap svg {
		color: #9ca3af;
		flex-shrink: 0;
	}

	.mobile-sort-wrap .sort-select {
		width: 100%;
		border: none;
		outline: none;
		font-size: 13px;
		font-weight: 600;
		color: #1f2937;
		background: transparent;
		cursor: pointer;
		font-family: inherit;
	}

	/* ── Drawer ── */
	.drawer-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 90;
		animation: fadeIn 0.2s ease;
	}

	.filter-drawer {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		width: min(320px, 88vw);
		background: #fff;
		z-index: 100;
		display: flex;
		flex-direction: column;
		box-shadow: 6px 0 24px rgba(0, 0, 0, 0.18);
		animation: slideIn 0.25s ease;
		overflow: hidden;
	}

	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid #e5e7eb;
		font-size: 15px;
		font-weight: 700;
		color: #1f2937;
	}

	.drawer-close {
		background: none;
		border: none;
		font-size: 18px;
		color: #6b7280;
		cursor: pointer;
		line-height: 1;
		padding: 4px 8px;
		border-radius: 6px;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.drawer-close:hover {
		background: #f3f4f6;
		color: #111;
	}

	.drawer-body {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes slideIn {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}

	/* ── Page layout ── */
	.categories-page {
		padding: 32px 0 48px;
	}

	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 clamp(12px, 3vw, 24px);
	}

	.page-layout {
		display: grid;
		grid-template-columns: 270px 1fr;
		gap: 28px;
		align-items: start;
	}

	/* ── Sidebar col ── */
	.sidebar-col {
		position: sticky;
		top: 24px;
		background: #fff;
		border-radius: 10px;
		border: 1.5px solid #e6f4ea;
		box-shadow: 0 4px 20px rgba(11, 93, 30, 0.07);
		overflow: hidden;
	}

	/* ── Filter form ── */
	.filter-form {
		padding: 18px;
		display: flex;
		flex-direction: column;
		gap: 22px;
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.filter-heading {
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #0b5d1e;
		margin: 0;
		padding-bottom: 8px;
		border-bottom: 1px solid #e6f4ea;
	}

	.filter-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-height: 260px;
		overflow-y: auto;
	}

	.filter-radio {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: #374151;
		cursor: pointer;
	}

	.filter-radio input[type='radio'] {
		accent-color: #16a34a;
		width: 15px;
		height: 15px;
		cursor: pointer;
		flex-shrink: 0;
	}

	.filter-empty {
		font-size: 12.5px;
		color: #9ca3af;
		margin: 0;
	}

	.price-inputs {
		display: flex;
		align-items: flex-end;
		gap: 8px;
	}

	.price-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 11px;
		color: #6b7280;
		font-weight: 600;
		flex: 1;
		min-width: 0;
	}

	.price-field input {
		width: 100%;
		padding: 7px 8px;
		border: 1.5px solid #e6f4ea;
		border-radius: 6px;
		font-size: 13px;
		font-family: inherit;
		color: #1f2937;
		outline: none;
	}

	.price-field input:focus {
		border-color: #16a34a;
	}

	.price-sep {
		color: #9ca3af;
		padding-bottom: 8px;
	}

	.price-slider {
		width: 100%;
		accent-color: #16a34a;
		cursor: pointer;
	}

	.clear-filters-btn {
		padding: 9px 14px;
		background: #f0fdf4;
		color: #0b5d1e;
		border: 1.5px solid #dcfce7;
		border-radius: 7px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition:
			background 0.18s,
			color 0.18s;
	}

	.clear-filters-btn:hover {
		background: #dcfce7;
	}

	/* ── Main content ── */
	.main-content {
		background: #fff;
		border-radius: 10px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}

	/* ── Content header ── */
	.content-header {
		padding: 20px 24px 0;
		border-bottom: 1px solid #e5e7eb;
		margin-bottom: 0;
	}

	.section-title {
		font-size: clamp(20px, 2.5vw, 26px);
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 16px;
	}

	.topbar-row {
		display: flex;
		align-items: center;
		height: 48px;
		border: 1.5px solid #e6f4ea;
		border-radius: 8px;
		overflow: hidden;
		margin-bottom: 20px;
	}

	.search-wrap {
		position: relative;
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
		height: 100%;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: #9ca3af;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		height: 100%;
		padding: 0 12px 0 38px;
		border: none;
		outline: none;
		font-size: 13px;
		color: #1f2937;
		background: transparent;
		font-family: inherit;
	}
	.search-input::placeholder {
		color: #9ca3af;
	}
	.search-input:focus {
		background: #f8fdf9;
	}

	.topbar-divider {
		width: 1px;
		height: 22px;
		background: #e6f4ea;
		flex-shrink: 0;
	}

	.sort-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0 12px;
		height: 100%;
		flex-shrink: 0;
	}

	.sort-label {
		font-size: 12px;
		color: #9ca3af;
		white-space: nowrap;
		font-weight: 500;
	}

	.sort-select {
		border: none;
		outline: none;
		font-size: 13px;
		font-weight: 600;
		color: #1f2937;
		background: transparent;
		cursor: pointer;
		font-family: inherit;
		padding: 0;
		max-width: 160px;
	}

	.view-toggle-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0 12px;
		height: 100%;
		flex-shrink: 0;
	}

	.view-label {
		font-size: 12px;
		color: #9ca3af;
		font-weight: 500;
		white-space: nowrap;
	}

	.view-toggle {
		display: flex;
		align-items: center;
		background: #f0fdf4;
		border: 1.5px solid #e6f4ea;
		border-radius: 6px;
		padding: 2px;
		gap: 2px;
	}

	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		color: #9ca3af;
		background: transparent;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.view-btn:hover,
	.view-btn.active {
		color: #0b5d1e;
		background: #dcfce7;
	}

	/* ── Products grid ── */
	.products-grid-wrapper {
		/* display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px; */
		padding: 20px 24px;
	}

	/* ── List view ── */
	/* .products-grid.list-view {
		grid-template-columns: 1fr;
	} */

	/* ── States ── */
	.state-container {
		padding: 24px;
	}

	.state-container.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 64px 24px;
		text-align: center;
	}

	.empty-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}
	.empty-title {
		font-size: 18px;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 8px;
	}
	.empty-sub {
		font-size: 14px;
		color: #6b7280;
		margin: 0 0 20px;
	}

	.clear-all-btn {
		padding: 10px 24px;
		background: #d4a017;
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.18s;
	}
	.clear-all-btn:hover {
		background: #b8880e;
	}

	/* ── Skeleton ── */
	.skeleton-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
	}

	.skeleton-card {
		border-radius: 8px;
		overflow: hidden;
		background: #f3f4f6;
	}

	.skeleton-img {
		aspect-ratio: 1 / 1;
		background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	.skeleton-body {
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.skeleton-line {
		height: 12px;
		border-radius: 4px;
		background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	.skeleton-line.wide {
		width: 90%;
	}
	.skeleton-line.medium {
		width: 60%;
	}
	.skeleton-line.narrow {
		width: 40%;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* ── Pagination ── */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 6px;
		padding: 24px;
		flex-wrap: wrap;
	}

	.page-btn {
		min-width: 38px;
		height: 38px;
		padding: 6px 10px;
		border: 1px solid #d1d5db;
		background: #fff;
		color: #374151;
		border-radius: 7px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 600;
		font-size: 13px;
		font-family: inherit;
	}

	.page-btn:hover:not(:disabled) {
		background: #d4a017;
		color: #fff;
		border-color: #d4a017;
		transform: translateY(-1px);
	}

	.page-btn.active {
		background: #d4a017;
		color: #fff;
		border-color: #d4a017;
	}

	.page-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ─────────────────────────────────────────────
	   RESPONSIVE BREAKPOINTS
	───────────────────────────────────────────── */

	/* Large desktop: 3-col grid */
	@media (max-width: 1280px) {
		.products-grid,
		.skeleton-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* Tablet landscape: collapse sidebar */
	@media (max-width: 1024px) {
		.page-layout {
			grid-template-columns: 240px 1fr;
			gap: 20px;
		}

		.products-grid,
		.skeleton-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* Tablet portrait: hide sidebar, show mobile filter bar */
	@media (max-width: 768px) {
		.mobile-filter-bar {
			display: flex;
		}

		.categories-page {
			padding: 16px 0 40px;
		}

		.page-layout {
			grid-template-columns: 1fr;
		}

		.sidebar-col {
			display: none;
		}

		.main-content {
			border-radius: 8px;
		}

		.content-header {
			padding: 16px 16px 0;
		}

		.section-title {
			margin-bottom: 12px;
		}

		.topbar-row {
			margin-bottom: 16px;
		}

		/* Hide view toggle on tablet */
		.view-toggle-wrap {
			display: none;
		}

		/* Shorten the sort label */
		.sort-label {
			display: none;
		}

		.products-grid,
		.skeleton-grid {
			padding: 16px;
			gap: 12px;
			grid-template-columns: repeat(3, 1fr);
		}

		.hero-actions .btn-video,
		.hero-actions .btn-rate {
			display: none;
		}
	}

	/* Mobile: 2-col grid */
	@media (max-width: 580px) {
		.products-grid,
		.skeleton-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
		}

		.products-grid.list-view {
			grid-template-columns: 1fr;
		}

		.products-grid.list-view .card-image {
			width: 110px;
		}

		.topbar-row {
			/* Stack search + sort vertically */
			flex-wrap: wrap;
			height: auto;
			border-radius: 8px;
			padding: 4px 0;
		}

		.search-wrap {
			min-height: 40px;
			border-bottom: 1px solid #e6f4ea;
		}

		.topbar-divider {
			display: none;
		}

		.sort-wrap {
			padding: 6px 12px;
			border-top: none;
		}

		.product-name {
			font-size: 12px;
		}
		.price {
			font-size: 15px;
		}

		.add-btn {
			width: 30px;
			height: 30px;
		}

		.card-body {
			padding: 10px;
			gap: 5px;
		}

		.pagination {
			padding: 16px;
			gap: 4px;
		}
		.page-btn {
			min-width: 34px;
			height: 34px;
			font-size: 12px;
		}

		.hero-actions {
			display: none;
		}

		.hero-content {
			padding: 14px 16px;
		}
	}

	/* Very small: single column */
	@media (max-width: 360px) {
		.products-grid,
		.skeleton-grid {
			grid-template-columns: 1fr;
		}

		.container {
			padding: 0 10px;
		}
	}
</style>
