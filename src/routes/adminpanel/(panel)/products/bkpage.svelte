<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { getImageUrl } from '$lib/admin/utils/image';
	import type { Product } from '$lib/admin/features/products/types/product.js';
	import { PUBLIC_API_BASE_URL } from '$env/static/public'; // Use your env variable if available

	// 1. Grab your SSR data passed from +page.server.ts
	let { data } = $props();
	const token = data.apiToken;
	let mainCategories = $state(data.categories ?? []);

	let searchQuery = $state('');
	let filterStatus = $state('all');
	let filterMainCategory = $state('all');
	let sortBy = $state('created');

	const isFiltered = $derived(
		searchQuery !== '' || filterStatus !== 'all' || filterMainCategory !== 'all'
	);
	// 2. Initialize frontend states using the exact keys returned from your SSR load function
	let products = $state<Product[]>(data?.products ?? []);
	let totalItems = $state(data?.productCount ?? 0); // Directly maps to your SSR 'productCount'

	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	// 🔥 Fetch products on page change (Client-side fetch)
	async function fetchProducts(page = 1) {
		try {
			// Falls back to local url string if your environment import setup differs
			const baseUrl = PUBLIC_API_BASE_URL || 'http://127.0.0.1:9000';

			// Setup the exact headers your Django backend expects
			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};

			// If a token is present, append the Bearer auth string
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
			const res = await fetch(`${baseUrl}/api/products/list-paginated?page=${page}`, {
				method: 'GET',
				headers: headers // 🔥 Passing the headers here
			});

			if (!res.ok) throw new Error('API server returned an error error');

			const payload = await res.json();

			// 3. Map raw Django keys into your component state
			products = payload.results ?? [];

			totalItems = payload.count ?? 0; // Sync raw 'count' back into totalItems safely
			currentPage = page;
		} catch (err) {
			console.error('Failed to load products on client pagination:', err);
		}
	}

	// ✅ Derived state: Client-side processing (filtering/sorting the CURRENT page slice)
	let processedProducts = $derived.by(() => {
		let list = [...products];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
			);
		}

		if (filterStatus !== 'all') {
			list = list.filter((p) => p.status === filterStatus);
		}

		// ✅ Only sort if user explicitly chose a sort option
		if (sortBy === 'price') {
			list.sort((a, b) => parseFloat(a.regular_price) - parseFloat(b.regular_price));
		} else if (sortBy === 'category') {
			list.sort((a, b) => (a.category_name ?? '').localeCompare(b.category_name ?? ''));
		} else if (sortBy === 'name') {
			list.sort((a, b) => a.name.localeCompare(b.name));
		}
		// 'default' → no sort, preserves API order (descending by id)

		return list;
	});

	// Pagination configuration
	let totalPages = $derived(Math.max(1, Math.ceil(totalItems / itemsPerPage)));
	let startItem = $derived(totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1);
	let endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

	$effect(() => {
		if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
		if (currentPage < 1) currentPage = 1;
	});

	function getPaginationRange() {
		const pages: (number | string)[] = [];
		const maxPages = 5;
		const half = Math.floor(maxPages / 2);

		let start = Math.max(1, currentPage - half);
		let end = Math.min(totalPages, currentPage + half);

		if (end - start < maxPages - 1) {
			if (start === 1) {
				end = Math.min(totalPages, start + maxPages - 1);
			} else {
				start = Math.max(1, end - maxPages + 1);
			}
		}

		if (start > 1) {
			pages.push(1);
			if (start > 2) pages.push('...');
		}

		for (let i = start; i <= end; i++) pages.push(i);

		if (end < totalPages) {
			if (end < totalPages - 1) pages.push('...');
			pages.push(totalPages);
		}

		return pages;
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			fetchProducts(page);
		}
	}

	interface Toast {
		id: number;
		message: string;
		type: 'success' | 'error' | 'info';
	}
	let toasts = $state<Toast[]>([]);

	function addToast(message: string, type: Toast['type'] = 'info') {
		const id = Date.now();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 3000);
	}

	async function deleteProduct(id: number) {
		if (!confirm('Delete this product?')) return;
		const formData = new FormData();
		formData.append('product_id', String(id));
		const response = await fetch('?/deleteProduct', {
			method: 'POST',
			body: formData
		});
		const result = await response.json();
		if (result.type === 'success') {
			addToast('Product has been deleted');
			products = products.filter((p) => p.id !== id);
			totalItems = Math.max(0, totalItems - 1);
		}
	}
	onMount(() => {
		// Since SSR provides initial page data, only fetch if it arrived empty
		if (!products.length) {
			fetchProducts(1);
		}
	});
</script>

<div class="min-h-screen">
	<div class="mx-auto">
		<!-- Header with Filters -->
		<!-- Breadcrumb Navigation -->
		<div class="mb-6 flex items-center gap-2 text-sm">
			<a href={base} class="link font-medium text-primary link-hover">Dashboard</a>
			<svg
				class="h-4 w-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Products</span>
		</div>
		<div class="mb-6 rounded-lg">
			<div class="mb-4 flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Products</h1>
					<p class="text-sm">Manage your store products</p>
				</div>
				<a
					class="btn-default btn flex-nowrap gap-2 shadow-md transition-shadow btn-sm hover:shadow-lg"
					href={base + '/products/create'}
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Add New Product
				</a>
			</div>

			<!-- Filters Section -->
			<!-- ── Filter form (separate from the create form) ────────────────────── -->
			<form class="mb-4 rounded-lg" onsubmit={(e) => e.preventDefault()}>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-5">
					<!-- Search -->
					<div class="form-control md:col-span-2">
						<label class="label pb-1" for="searchQuery">
							<span class="label-text text-xs font-semibold tracking-wide uppercase">Search</span>
						</label>
						<input
							type="text"
							placeholder="Name or slug…"
							class="input-bordered input input-sm w-full"
							bind:value={searchQuery}
						/>
					</div>

					<!-- Category filter -->
					<div class="form-control">
						<label class="label pb-1" for="mainCategory">
							<span class="label-text text-xs font-semibold tracking-wide uppercase">Category</span>
						</label>
						<select id="mainCategory" class="select-bordered select w-full select-sm">
							<option value="all">All Categories</option>
							{#each mainCategories as category}
								<option value={String(category.id)}>{category.name}</option>
							{/each}
						</select>
					</div>

					<!-- Status filter -->
					<div class="form-control">
						<label class="label pb-1" for="status">
							<span class="label-text text-xs font-semibold tracking-wide uppercase">Status</span>
						</label>
						<select
							id="status"
							class="select-bordered select w-full select-sm"
							bind:value={filterStatus}
						>
							<option value="all">All Status</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</div>

					<!-- Sort -->
					<div class="form-control">
						<label class="label pb-1" for="sortBy">
							<span class="label-text text-xs font-semibold tracking-wide uppercase">Sort by</span>
						</label>
						<select id="sortBy" class="select-bordered select w-full select-sm" bind:value={sortBy}>
							<option value="created">Recently Created</option>
							<option value="name">Name (A–Z)</option>
							<option value="products">Most Products</option>
						</select>
					</div>
				</div>

				<!-- Active filter chips + clear button -->
				{#if isFiltered}
					<div class="mt-3 flex flex-wrap items-center gap-2">
						<span class="text-xs text-base-content/50">Active filters:</span>
						{#if searchQuery}
							<span class="badge gap-1 badge-outline badge-sm">
								"{searchQuery}"
								<button type="button" onclick={() => (searchQuery = '')} class="ml-1 font-bold"
									>×</button
								>
							</span>
						{/if}
						{#if filterStatus !== 'all'}
							<span class="badge gap-1 badge-outline badge-sm">
								{filterStatus}
								<button type="button" onclick={() => (filterStatus = 'all')} class="ml-1 font-bold"
									>×</button
								>
							</span>
						{/if}
						{#if filterMainCategory !== 'all'}
							<span class="badge gap-1 badge-outline badge-sm">
								{mainCategories.find((c: any) => String(c.id) === filterMainCategory)?.name ??
									filterMainCategory}
								<button
									type="button"
									onclick={() => (filterMainCategory = 'all')}
									class="ml-1 font-bold">×</button
								>
							</span>
						{/if}
						<button type="button" onclick={clearFilters} class="btn text-error btn-ghost btn-xs">
							Clear all
						</button>
					</div>
				{/if}
			</form>
		</div>

		<!-- Products Table -->
		<div class="overflow-hidden rounded-lg bg-base-100 shadow-sm">
			{#if processedProducts.length > 0}
				<div class="overflow-x-auto">
					<table class="table w-full table-zebra">
						<thead class="bg-base-200">
							<tr>
								<th>Product</th>
								<th>Vendor</th>
								<th>Regular Price</th>
								<th>Sale Price</th>

								<th>Available Stock</th>
								<th>Available Colors</th>
								<th>Available Sizes</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each processedProducts as product (product.id)}
								<tr>
									<!-- Product Name -->
									<td>
										<div class="flex items-center gap-3">
											<div
												class="flex h-12 w-12 items-center justify-center rounded-lg bg-base-200"
											>
												{#if product.primary_image}
													<img
														src={getImageUrl(product.primary_image.image)}
														alt={product.primary_image.alt_text || product.name}
														class="h-full w-full rounded-lg object-cover"
													/>
												{:else}
													<svg
														class="h-6 w-6 text-base-content/40"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
														/>
													</svg>
												{/if}
											</div>
											<div>
												<p class="font-medium text-base-content">{product.name}</p>
												<p class="text-sm text-base-content/60">{product.category_name}</p>
												<!-- <span class="badge badge-outline badge-sm capitalize badge-warning"
													>{product.product_type}</span
												> -->
												<div
													role="alert"
													class="badge badge-outline badge-xs capitalize badge-warning"
												>
													<p class="text-xs font-bold">{product.product_type}</p>
												</div>
											</div>
										</div>
									</td>
									<td>{product.vendor}</td>

									<!-- Regular Price -->
									<td>
										<b class="">Rs.{product.regular_price}</b>
									</td>
									<!-- Regular Price -->
									<td>
										<b class="">Rs.{product.sale_price ? `${product.sale_price}` : '0.00'}</b>
									</td>

									<td>
										<span class="">{product.inventory?.stock_quantity ?? 'N/A'}</span>
									</td>
									<td>
										{#if product.product_colors && product.product_colors.length > 0}
											{#each product.product_colors as color}
												<div class="tooltip">
													<div class="tooltip-content">
														<div class="text-grey-400 text-1xl animate-bounce font-black">
															{color}
														</div>
													</div>
													<div
														class="mx-1 h-5 w-5 rounded-md border border-base-content/20"
														style="background-color: {color}"
													></div>
												</div>
											{/each}
										{:else}
											<span class="mx-1 badge badge-outline badge-error">n/a</span>
										{/if}
									</td>
									<td>
										{#if product.available_sizes && product.available_sizes.length > 0}
											{#each product.available_sizes as size}
												<span class="badge-dash-outline mx-1 badge badge-xs badge-success">
													{size.size ?? 'n/a'}
												</span>
											{/each}
										{:else}
											<span class="mx-1 badge badge-outline badge-error">n/a</span>
										{/if}
									</td>

									<!-- Status -->
									<td class="text-center">
										{#if product.status === 'published'}
											<span class="badge badge-sm badge-success">Published</span>
										{:else if product.status === 'draft'}
											<span class="badge-gray badge badge-sm">Draft</span>
										{:else}
											<span class="badge badge-sm capitalize badge-warning">{product.status}</span>
										{/if}
									</td>

									<td class="text-center">
										<div class="flex justify-center gap-1">
											<a
												href={base + '/products/variations/' + product.id}
												class="tooltip btn btn-square text-white btn-xs btn-warning"
												data-tip="Variations"
												aria-label="variations"
											>
												<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 6h16M4 12h16M4 18h16"
													/>
													<circle cx="8" cy="6" r="2" fill="currentColor" />
													<circle cx="16" cy="12" r="2" fill="currentColor" />
													<circle cx="12" cy="18" r="2" fill="currentColor" />
												</svg>
											</a>

											<a
												href={base + '/products/edit/' + product.id}
												class="tooltip btn btn-square btn-xs btn-info"
												data-tip="Edit"
												aria-label="edit"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</a>

											<!-- Delete -->
											<button
												type="button"
												onclick={() => deleteProduct(product.id)}
												class="tooltip btn btn-square text-white btn-xs btn-error"
												data-tip="Delete"
												aria-label="delete"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Pagination Section -->
				<div class="border-t border-base-300 p-4">
					<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
						<!-- Results Info -->
						<p class="text-sm text-base-content/60">
							Showing <span class="font-semibold">{startItem}</span> to
							<span class="font-semibold">{endItem}</span> of
							<span class="font-semibold">{totalItems}</span> products
						</p>

						<!-- Items Per Page Selector -->
						<div class="flex items-center gap-2">
							<label for="itemsPerPage" class="text-sm text-base-content/60">Items per page:</label>
							<select
								id="itemsPerPage"
								class="select-bordered select w-20 select-sm"
								bind:value={itemsPerPage}
								onchange={(e) => {
									itemsPerPage = parseInt(e.target.value);
									currentPage = 1;
								}}
							>
								<option value={5}>5</option>
								<option value={10}>10</option>
								<option value={15}>15</option>
								<option value={20}>20</option>
								<option value={25}>25</option>
								<option value={50}>50</option>
							</select>
						</div>

						<!-- Pagination Controls -->
						<div class="flex items-center gap-2">
							<!-- Previous Button -->
							<button
								class="btn btn-outline btn-sm"
								disabled={currentPage === 1}
								onclick={() => goToPage(currentPage - 1)}
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									/>
								</svg>
								Previous
							</button>

							<!-- Page Numbers -->
							<div class="flex gap-1">
								{#each getPaginationRange() as page (page)}
									{#if page === '...'}
										<span class="px-2 py-1 text-base-content/60">...</span>
									{:else}
										<button
											class={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
											onclick={() => goToPage(page)}
										>
											{page}
										</button>
									{/if}
								{/each}
							</div>

							<!-- Next Button -->
							<button
								class="btn btn-outline btn-sm"
								disabled={currentPage === totalPages}
								onclick={() => goToPage(currentPage + 1)}
							>
								Next
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Filtered Results Empty State -->
			{#if processedProducts.length === 0 && (searchQuery || filterStatus !== 'all')}
				<div class="p-12 text-center">
					<svg
						class="mx-auto mb-4 h-12 w-12 text-base-content/40"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
						/>
					</svg>
					<h3 class="mb-1 text-lg font-semibold text-base-content">No products found</h3>
					<p class="mb-4 text-base-content/60">
						{#if searchQuery || filterStatus !== 'all'}
							Try adjusting your filters or search terms.
						{:else}
							Start by adding your first product to your store.
						{/if}
					</p>
					<a href="create" class="btn inline-flex items-center gap-2 btn-sm btn-primary">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Add New Product
					</a>
				</div>
			{/if}

			<!-- No Products Empty State -->
			{#if processedProducts.length === 0}
				<div class="p-12 text-center">
					<svg
						class="mx-auto mb-4 h-12 w-12 text-base-content/40"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
						/>
					</svg>
					<h3 class="mb-1 text-lg font-semibold text-base-content">No products found</h3>
					<p class="mb-4 text-base-content/60">Start by adding your first product to your store.</p>
					<a href="create" class="btn inline-flex items-center gap-2 btn-sm btn-primary">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Add Product
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
	{#each toasts as t (t.id)}
		<div
			class="max-w-xs rounded px-4 py-2 text-sm text-white shadow"
			style="background: {t.type === 'success'
				? 'linear-gradient(90deg,#16a34a,#059669)'
				: t.type === 'error'
					? 'linear-gradient(90deg,#dc2626,#b91c1c)'
					: 'linear-gradient(90deg,#3b82f6,#2563eb)'}"
		>
			{t.message}
		</div>
	{/each}
</div>
