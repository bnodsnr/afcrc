<script lang="ts">
	import { base } from '$lib/admin/paths';

	let { data } = $props();
	let products = data.products || [];
	let summary = data.summary || {};
	let filteredProducts = $state(products);
	let searchQuery = $state('');
	let statusFilter = $state('all');
	let sortField = $state('name');
	let sortDirection = $state<'asc' | 'desc'>('asc');

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

	function filterProducts() {
		filteredProducts = products.filter((product: any) => {
			const matchesSearch =
				!searchQuery ||
				product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				product.category?.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesStatus =
				statusFilter === 'all' || product.stock_status?.toLowerCase() === statusFilter;

			return matchesSearch && matchesStatus;
		});
		sortProducts();
	}

	function handleSearch(e: Event) {
		searchQuery = (e.target as HTMLInputElement).value;
		filterProducts();
	}

	function handleStatusFilter(e: Event) {
		statusFilter = (e.target as HTMLSelectElement).value;
		filterProducts();
	}

	function handleSort(field: string) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
		sortProducts();
	}

	function sortProducts() {
		filteredProducts = [...filteredProducts].sort((a: any, b: any) => {
			let aVal = a[sortField];
			let bVal = b[sortField];
			if (typeof aVal === 'string') aVal = aVal?.toLowerCase() || '';
			if (typeof bVal === 'string') bVal = bVal?.toLowerCase() || '';
			if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});
	}

	function printInventory() {
		window.print();
		addToast('Opening print dialog...', 'info');
	}

	function getStockStatusBadge(status: string) {
		const map: Record<string, { class: string; label: string }> = {
			instock: { class: 'badge-success', label: 'In Stock' },
			outofstock: { class: 'badge-error', label: 'Out of Stock' },
			lowstock: { class: 'badge-warning', label: 'Low Stock' }
		};
		return map[status] || { class: 'badge-neutral', label: 'Unknown' };
	}

	function formatCurrency(val: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NPR', minimumFractionDigits: 0 }).format(val);
	}

	function getSortIcon(field: string) {
		if (sortField !== field) return '';
		return sortDirection === 'asc' ? '▲' : '▼';
	}
</script>

<div class="min-h-screen">
	<div class="p-6">
		<!-- Header -->
		<div class="mb-8">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-base-content">Product Stocks</h1>
					<p class="mt-1 text-base-content/60">Complete inventory overview — quantity, sales & available stock</p>
				</div>
				<button onclick={printInventory} class="no-print btn gap-2 btn-primary">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H7a2 2 0 01-2-2v-4a2 2 0 012-2h10a2 2 0 012 2v4a2 2 0 01-2 2zm-6 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
					</svg>
					Print
				</button>
			</div>

			<!-- Print Title -->
			<div class="print-only print-title">
				<h2 style="text-align: center; font-size: 24px; margin-bottom: 10px;">Product Stock Report</h2>
				<p style="text-align: center; font-size: 14px; margin-bottom: 20px;">
					Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
				</p>
			</div>

			<!-- Summary Widgets -->
			<div class="no-print mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
				<div class="stat rounded-lg bg-base-100 shadow-sm">
					<div class="stat-title">Total Products</div>
					<div class="stat-value text-primary text-2xl">{summary.total_products ?? filteredProducts.length}</div>
				</div>
				<div class="stat rounded-lg bg-base-100 shadow-sm">
					<div class="stat-title">Total Stock</div>
					<div class="stat-value text-blue-500 text-2xl">{summary.total_stock ?? 0}</div>
				</div>
				<div class="stat rounded-lg bg-base-100 shadow-sm">
					<div class="stat-title">Total Sold</div>
					<div class="stat-value text-green-500 text-2xl">{summary.total_sold ?? 0}</div>
				</div>
				<div class="stat rounded-lg bg-base-100 shadow-sm">
					<div class="stat-title">Available</div>
					<div class="stat-value text-purple-500 text-2xl">{summary.total_available ?? 0}</div>
				</div>
				<div class="stat rounded-lg bg-base-100 shadow-sm">
					<div class="stat-title">Out of Stock</div>
					<div class="stat-value text-error text-2xl">{summary.out_of_stock ?? 0}</div>
				</div>
			</div>

			<!-- Filters -->
			<div class="no-print mb-6 rounded-lg bg-base-100 p-4 shadow-sm">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="form-control">
						<label class="label" for="search">
							<span class="label-text font-medium">Search</span>
						</label>
						<input
							type="text"
							id="search"
							placeholder="Search by name, SKU, or category..."
							class="input-bordered input input-sm"
							value={searchQuery}
							oninput={handleSearch}
						/>
					</div>
					<div class="form-control">
						<label class="label" for="status-filter">
							<span class="label-text font-medium">Stock Status</span>
						</label>
						<select
							id="status-filter"
							class="select-bordered select select-sm"
							value={statusFilter}
							onchange={handleStatusFilter}
						>
							<option value="all">All Statuses</option>
							<option value="instock">In Stock</option>
							<option value="lowstock">Low Stock</option>
							<option value="outofstock">Out of Stock</option>
						</select>
					</div>
					<div class="flex items-end">
						<span class="text-sm text-base-content/60">
							Showing {filteredProducts.length} of {products.length} products
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Stock Table -->
		<div class="overflow-x-auto rounded-lg bg-base-100 shadow-sm">
			{#if filteredProducts.length > 0}
				<table class="table w-full table-zebra">
					<thead class="bg-base-200 font-semibold text-base-content">
						<tr>
							<th class="p-3 cursor-pointer select-none" onclick={() => handleSort('name')}>
								S.N. / Product {getSortIcon('name')}
							</th>
							<th class="p-3">SKU</th>
							<th class="p-3 cursor-pointer select-none" onclick={() => handleSort('category')}>
								Category {getSortIcon('category')}
							</th>
							<th class="p-3 text-right cursor-pointer select-none" onclick={() => handleSort('regular_price')}>
								MRP {getSortIcon('regular_price')}
							</th>
							<th class="p-3 text-right cursor-pointer select-none" onclick={() => handleSort('sale_price')}>
								Sale Price {getSortIcon('sale_price')}
							</th>
							<th class="p-3 text-center cursor-pointer select-none" onclick={() => handleSort('total_stock')}>
								Total Qty {getSortIcon('total_stock')}
							</th>
							<th class="p-3 text-center cursor-pointer select-none" onclick={() => handleSort('total_sold')}>
								Sold {getSortIcon('total_sold')}
							</th>
							<th class="p-3 text-center cursor-pointer select-none" onclick={() => handleSort('available_stock')}>
								Available {getSortIcon('available_stock')}
							</th>
							<th class="p-3 text-center">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredProducts as product, index (product.id)}
							<tr class="border-b transition-colors hover:bg-base-200">
								<td class="p-3">
									<div class="flex items-center gap-3">
										{#if product.image}
											<div class="avatar">
												<div class="mask mask-squircle h-10 w-10">
													<img src={product.image} alt={product.name} />
												</div>
											</div>
										{/if}
										<div>
											<div class="font-bold text-sm">{index + 1}. {product.name || '-'}</div>
											<div class="text-xs text-base-content/50">{product.vendor || ''}</div>
										</div>
									</div>
								</td>
								<td class="p-3 font-mono text-xs">{product.sku || '-'}</td>
								<td class="p-3 text-sm">{product.category || '-'}</td>
								<td class="p-3 text-right text-sm">{formatCurrency(product.regular_price)}</td>
								<td class="p-3 text-right text-sm">
									{#if product.sale_price}
										<span class="text-error font-medium">{formatCurrency(product.sale_price)}</span>
									{:else}
										<span class="text-base-content/40">—</span>
									{/if}
								</td>
								<td class="p-3 text-center">
									<div class="tooltip" data-tip="Product: {product.product_stock_qty} + Variations: {product.variation_stock}">
										<span class="badge badge-lg bg-blue-100 text-blue-700 border-blue-200">{product.total_stock}</span>
									</div>
								</td>
								<td class="p-3 text-center">
									<span class="badge badge-lg badge-outline">{product.total_sold}</span>
								</td>
								<td class="p-3 text-center font-semibold">
									{#if product.available_stock > 0}
										<span class="badge badge-lg badge-success badge-outline">{product.available_stock}</span>
									{:else}
										<span class="badge badge-lg badge-error">{product.available_stock}</span>
									{/if}
								</td>
							<td class="p-3 text-center">
								<span class="badge {getStockStatusBadge(product.stock_status).class}">
									{getStockStatusBadge(product.stock_status).label}
								</span>
							</td>
							</tr>
						{/each}
					</tbody>
					<tfoot class="bg-base-200 font-semibold text-base-content">
						<tr>
							<td class="p-3" colspan="5">Totals</td>
							<td class="p-3 text-center">
								<span class="badge badge-lg bg-blue-100 text-blue-700 border-blue-200">
									{filteredProducts.reduce((sum: number, p: any) => sum + (p.total_stock || 0), 0)}
								</span>
							</td>
							<td class="p-3 text-center">
								<span class="badge badge-lg badge-outline">
									{filteredProducts.reduce((sum: number, p: any) => sum + (p.total_sold || 0), 0)}
								</span>
							</td>
							<td class="p-3 text-center font-bold">
								{filteredProducts.reduce((sum: number, p: any) => sum + (p.available_stock || 0), 0)}
							</td>
							<td class="p-3"></td>
						</tr>
					</tfoot>
				</table>
			{:else}
				<div class="p-12 text-center">
					<svg class="mx-auto mb-4 h-16 w-16 text-base-content/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
					</svg>
					<p class="text-lg text-base-content/60">No products found</p>
					<p class="mt-1 text-sm text-base-content/40">Try adjusting your search or filter criteria</p>
				</div>
			{/if}
		</div>

		<!-- Print Summary -->
		<div class="print-only mt-8">
			<h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Summary</h3>
			<table style="width: 100%; border-collapse: collapse;">
				<tbody>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd;">Total Products</td>
						<td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">{filteredProducts.length}</td>
					</tr>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd;">Total Stock Quantity</td>
						<td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
							{filteredProducts.reduce((sum: number, p: any) => sum + (p.total_stock || 0), 0)}
						</td>
					</tr>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd;">Total Sold</td>
						<td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
							{filteredProducts.reduce((sum: number, p: any) => sum + (p.total_sold || 0), 0)}
						</td>
					</tr>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd;">Available Stock</td>
						<td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
							{filteredProducts.reduce((sum: number, p: any) => sum + (p.available_stock || 0), 0)}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Toasts -->
<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
	{#each toasts as t (t.id)}
		<div
			class="max-w-xs rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg"
			style="background: {t.type === 'success' ? 'linear-gradient(90deg, #16a34a, #059669)' : t.type === 'error' ? 'linear-gradient(90deg, #dc2626, #b91c1c)' : 'linear-gradient(90deg, #2563eb, #1d4ed8)'}"
		>
			{t.message}
		</div>
	{/each}
</div>

<style>
	@media print {
		.no-print { display: none !important; }
		.print-title { page-break-after: avoid; }
		table { width: 100%; border-collapse: collapse; }
		th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
		th { background-color: #f2f2f2; font-weight: bold; }
		tr { page-break-inside: avoid; }
		.print-only { display: block !important; }
		body { margin: 0; padding: 10px; }
		.min-h-screen { min-height: auto !important; }
	}
	.print-only { display: none; }
</style>
