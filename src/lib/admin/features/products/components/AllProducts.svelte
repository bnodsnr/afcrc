<script lang="ts">
	import type { ProductResponse } from '$lib/admin/features/products/types/product';
	import type { Category } from '$lib/admin/features/categories/types';
	import PaginationList from '$lib/admin/components/PaginationList.svelte';
	import { createPagination } from '$lib/admin/utils/pagination.svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { getImageUrl } from '$lib/admin/utils/image';
	import { base } from '$lib/admin/paths';
	import { toastStore } from '$lib/admin/utils/tostar.svelte';
	import { pageLoader } from '$lib/admin/utils/Pageloader.svelte';

	let { data } = $props();

	let products = $state<ProductResponse[]>([]);
	const token = data.token;
	let categories = $state<Category[]>([]);
	let isLoading = $state(false);
	let loadError = $state<string | null>(null);
	let deletingId = $state<number | null>(null);

	const baseUrl = PUBLIC_API_BASE_URL || 'https://himalayanhepmheaven.com/hhhadminapi/';

	const pagination = createPagination();
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};

	let searchQuery = $state('');
	let debouncedSearch = $state('');
	let filterStatus = $state('all');
	let filterCategory = $state('all');
	let sortBy = $state('created');

	// Keep track of the request in flight so a slow/stale response can never
	// clobber the results of a newer, faster one (race condition fix).
	let activeController: AbortController | null = null;

	// Debounce the raw search input so we don't fire a request per keystroke.
	$effect(() => {
		const value = searchQuery;
		const timer = setTimeout(() => {
			debouncedSearch = value;
		}, 350);
		return () => clearTimeout(timer);
	});

	// Whenever a *filter* (not the page itself) changes, jump back to page 1.
	// Without this you can be stuck on page 5 showing "no results" after
	// narrowing a search/filter.
	let prevFilters = {
		search: debouncedSearch,
		status: filterStatus,
		category: filterCategory,
		sort: sortBy
	};
	$effect(() => {
		const current = {
			search: debouncedSearch,
			status: filterStatus,
			category: filterCategory,
			sort: sortBy
		};
		const changed =
			current.search !== prevFilters.search ||
			current.status !== prevFilters.status ||
			current.category !== prevFilters.category ||
			current.sort !== prevFilters.sort;

		if (changed) {
			prevFilters = current;
			if (pagination.currentPage !== 1) {
				pagination.goTo(1);
			}
		}
	});

	async function loadProducts() {
		// Cancel any in-flight request before starting a new one.
		activeController?.abort();
		const controller = new AbortController();
		activeController = controller;

		const params = new URLSearchParams({
			page: String(pagination.currentPage),
			page_size: String(pagination.itemsPerPage)
		});

		if (debouncedSearch.trim()) {
			params.set('search', debouncedSearch.trim());
		}
		if (filterStatus !== 'all') {
			params.set('status', filterStatus);
		}
		if (filterCategory !== 'all') {
			params.set('category', filterCategory);
		}
		if (sortBy !== 'created') {
			params.set('ordering', sortBy);
		}

		isLoading = true;
		loadError = null;

		try {
			const res = await fetch(`${baseUrl}/api/products/list-paginated?${params.toString()}`, {
				method: 'GET',
				headers,
				signal: controller.signal
			});

			if (!res.ok) {
				throw new Error(`Failed to load products (${res.status})`);
			}

			const result = await res.json();

			// If a newer request has started since this one fired, ignore this result.
			if (activeController !== controller) return;

			products = result.results ?? [];
			pagination.setTotal(result.count ?? 0);
		} catch (err) {
			if ((err as Error).name === 'AbortError') return;
			if (activeController !== controller) return;
			loadError = err instanceof Error ? err.message : 'Failed to load products';
			products = [];
		} finally {
			if (activeController === controller) {
				isLoading = false;
			}
		}
	}

	async function deleteProduct(id: number) {
		const confirmed = window.confirm(
			'Are you sure you want to delete this product? This cannot be undone.'
		);
		if (!confirmed) return;

		deletingId = id;
		pageLoader.show();
		try {
			const res = await fetch(`${baseUrl}/api/products/${id}/`, {
				method: 'DELETE',
				headers
			});

			if (!res.ok) {
				throw new Error(`Failed to delete product (${res.status})`);
			}
			toastStore.success('Product deleted successfully');
			// If we deleted the last item on a page beyond page 1, step back a page.
			if (products.length === 1 && pagination.currentPage > 1) {
				pagination.goTo(pagination.currentPage - 1);
			} else {
				await loadProducts();
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to delete product';
			loadError = message;
			toastStore.error(message);
		} finally {
			deletingId = null;
			pageLoader.hide();
		}
	}

	function parseSizes(sizes: string | string[] | null | undefined): string[] {
		if (!sizes) return [];
		if (Array.isArray(sizes)) return sizes.filter(Boolean);
		if (typeof sizes === 'string')
			return sizes
				.split('.')
				.map((s) => s.trim())
				.filter(Boolean);
		return [];
	}

	$effect(() => {
		categories = data.categories ?? [];
		pagination.currentPage;
		pagination.itemsPerPage;
		debouncedSearch;
		filterStatus;
		filterCategory;
		sortBy;
		loadProducts();
	});
</script>

<form class="mb-4 rounded-lg" onsubmit={(e) => e.preventDefault()}>
	<div class="grid grid-cols-1 gap-3 md:grid-cols-5">
		<!-- Search -->
		<div class="form-control md:col-span-2">
			<label class="label pb-1" for="searchQuery">
				<span class="label-text text-xs font-semibold tracking-wide uppercase">Search</span>
			</label>
			<input
				id="searchQuery"
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
			<select
				id="mainCategory"
				class="select-bordered select w-full select-sm"
				bind:value={filterCategory}
			>
				<option value="all">All Categories</option>
				{#each categories as category (category.id)}
					<option value={String(category.id)}>{category.name}</option>
				{/each}
			</select>
		</div>

		<!-- Status filter -->
		<div class="form-control">
			<label class="label pb-1" for="status">
				<span class="label-text text-xs font-semibold tracking-wide uppercase">Status</span>
			</label>
			<select id="status" class="select-bordered select w-full select-sm" bind:value={filterStatus}>
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
</form>

{#if loadError}
	<div role="alert" class="mb-4 alert alert-error text-sm">
		<span>{loadError}</span>
		<button type="button" class="btn btn-ghost btn-xs" onclick={() => loadProducts()}>Retry</button>
	</div>
{/if}

<div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
	<table class="table w-full table-zebra">
		<thead>
			<tr>
				<th scope="col">Product</th>
				<th scope="col">Product Type</th>
				<th scope="col">Regular Price</th>
				<th scope="col">Sale Price</th>
				<th scope="col">Stock</th>
				<th scope="col">Sizes</th>
				<th scope="col">Variations</th>
				<th scope="col">Status</th>
				<th scope="col">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#if isLoading && products.length === 0}
				<tr>
					<td colspan="9" class="py-8 text-center text-base-content/60">Loading products…</td>
				</tr>
			{:else if !isLoading && products.length === 0}
				<tr>
					<td colspan="9" class="py-8 text-center text-base-content/60">No products found.</td>
				</tr>
			{:else}
				{#each products as product (product.id)}
					<tr class:opacity-50={deletingId === product.id}>
						<!-- Product Name -->
						<td>
							<div class="flex items-center gap-3">
								<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-base-200">
									{#if product.primary_image?.image}
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
											aria-hidden="true"
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
									<div role="alert" class="badge badge-outline badge-xs capitalize badge-warning">
										<p class="text-xs font-bold">{product.product_type}</p>
									</div>
								</div>
							</div>
						</td>
						<td>{product.vendor}</td>

						<!-- Regular Price -->
						<td>
							<b>Rs.{product.regular_price}</b>
						</td>
						<!-- Sale Price -->
						<td>
							<b>Rs.{product.sale_price != null ? product.sale_price : '0.00'}</b>
						</td>

						<td>
							<div class="flex items-center gap-2">
								<span></span>

								<span
									class={`badge w-24 badge-sm whitespace-nowrap badge-error ${
										(product.inventory?.stock_quantity ?? 0) > 0 ? 'badge-success' : 'badge-error'
									}`}
								>
									{product.inventory?.stock_quantity ?? 0}
									{(product.inventory?.stock_quantity ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
								</span>
							</div>
						</td>

						<td>
							{#if parseSizes(product.product_sizes).length > 0}
								{@const formattedSizes = parseSizes(product.product_sizes).join(', ')}

								<div
									class="badge-badge-success max-w-[140px]"
									data-tip="Variations"
									aria-label="Variations for {formattedSizes}"
								>
									{formattedSizes}
								</div>
							{:else}
								<span>N/A</span>
							{/if}
						</td>
						<td>
							{#if (product.variations?.length ?? 0) > 0}
								<a
									href={base + '/products/variations/' + product.id}
									class="tooltip btn p-3 btn-ghost btn-xs"
									data-tip="Variations"
									aria-label="Variations for {product.name}"
								>
									{product.variations.length} Variations
								</a>
								<!-- <span class="alert-sm alert alert-info">
									{product.variations.length} variations
								</span> -->
							{:else}
								<span class="badge badge-ghost">N/A</span>
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
									aria-label="Variations for {product.name}"
								>
									<svg
										class="h-5 w-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
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
									aria-label="Edit {product.name}"
								>
									<svg
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
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
									disabled={deletingId === product.id}
									class="tooltip btn btn-square text-white btn-xs btn-error"
									data-tip="Delete"
									aria-label="Delete {product.name}"
								>
									<svg
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
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
			{/if}
		</tbody>
	</table>
</div>

{#if pagination.totalPages > 1}
	<PaginationList
		currentPage={pagination.currentPage}
		totalPages={pagination.totalPages}
		totalItems={pagination.totalItems}
		startItem={pagination.startItem}
		endItem={pagination.endItem}
		itemsPerPage={pagination.itemsPerPage}
		itemLabel="products"
		onPageChange={(page) => pagination.goTo(page)}
		onPageSizeChange={(size) => pagination.setPageSize(size)}
	/>
{/if}
