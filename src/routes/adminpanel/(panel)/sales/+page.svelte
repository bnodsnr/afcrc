<script lang="ts">
	import { base } from '$lib/admin/paths';

	let { data } = $props();
	let { sales, apiToken } = data;
	let filteredSales = $state(sales);
	let searchQuery = $state('');
	let statusFilter = $state('all');

	// Toast notifications
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

	// Filter sales based on search and status
	function filterSales() {
		filteredSales = sales.filter((sale: any) => {
			const matchesSearch =
				!searchQuery ||
				sale.order_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				sale.user?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				sale.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesStatus = statusFilter === 'all' || sale.status?.toLowerCase() === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}

	function handleSearch(e: Event) {
		searchQuery = (e.target as HTMLInputElement).value;
		filterSales();
	}

	function handleStatusFilter(e: Event) {
		statusFilter = (e.target as HTMLSelectElement).value;
		filterSales();
	}

	function printSales() {
		window.print();
		addToast('Opening print dialog...', 'info');
	}

	function getStatusColor(status: string) {
		const statusLower = status?.toLowerCase() || '';
		if (statusLower === 'pending') return 'badge-warning';
		if (statusLower === 'confirmed') return 'badge-info';
		if (statusLower === 'shipped') return 'badge-primary';
		if (statusLower === 'delivered') return 'badge-success';
		if (statusLower === 'cancelled') return 'badge-error';
		return 'badge-neutral';
	}

	function formatDate(dateString: string) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatPrice(price: number | string) {
		const num = typeof price === 'string' ? parseFloat(price) : price;
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'NPR'
		}).format(num);
	}

	// Calculate summary statistics
	function getTotalSales() {
		return sales.reduce((sum: number, sale: any) => sum + (parseFloat(sale.subtotal) || 0), 0);
	}

	function getTotalItems() {
		return sales.reduce((sum: number, sale: any) => sum + (parseInt(sale.quantity) || 0), 0);
	}

	function getTotalTax() {
		return sales.reduce((sum: number, sale: any) => sum + (parseFloat(sale.order.tax) || 0), 0);
	}

	function getAverageOrderValue() {
		const totalSales = getTotalSales();
		const totalOrders = sales.length;
		return totalOrders > 0 ? totalSales / totalOrders : 0;
	}

	function getTotalOrderAmount() {
		return sales.reduce((sum: number, sale: any) => sum + (parseFloat(sale.order.total) || 0), 0);
	}

	function getTotalItemAmount() {
		return sales.reduce((sum: number, sale: any) => sum + (parseFloat(sale.subtotal) || 0), 0);
	}

	function getSalesThisMonth() {
		const now = new Date();
		const currentMonth = now.getMonth();
		const currentYear = now.getFullYear();

		return sales.reduce((sum: number, sale: any) => {
			if (sale.sales_date) {
				const saleDate = new Date(sale.sales_date);
				if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
					return sum + (parseFloat(sale.subtotal) || 0);
				}
			}
			return sum;
		}, 0);
	}
</script>

<div class="min-h-screen">
	<div class="p-6">
		<!-- Header Section -->
		<div class="mb-8">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-base-content">Sales & Report</h1>
					<p class="mt-1 text-base-content/60">Manage and view all sales orders</p>
				</div>
				<button
					onclick={printSales}
					class="no-print btn gap-2 btn-primary"
					title="Print sales list"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H7a2 2 0 01-2-2v-4a2 2 0 012-2h10a2 2 0 012 2v4a2 2 0 01-2 2zm-6 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z"
						/>
					</svg>
					Print
				</button>
			</div>

			<!-- Print Title (only visible in print) -->
			<div class="print-only print-title">
				<h2 style="text-align: center; font-size: 24px; margin-bottom: 10px;">Sales Report</h2>
				<p style="text-align: center; font-size: 14px; margin-bottom: 20px;">
					Generated on {new Date().toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</p>
			</div>

			<!-- Summary Widgets -->
			<div class="no-print mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<!-- Total Sales Amount Widget -->
				<div
					class="card bg-gradient-to-br from-blue-50 to-blue-100 shadow-md transition-shadow hover:shadow-lg"
				>
					<div class="card-body">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-sm font-medium text-base-content/60">Total Sales Amount</h3>
								<p class="mt-2 text-2xl font-bold text-blue-600">
									{formatPrice(getTotalOrderAmount())}
								</p>
							</div>
							<div class="rounded-full bg-blue-200 p-3 text-blue-600">
								<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				<!-- Total Items Widget -->
				<div
					class="card bg-gradient-to-br from-green-50 to-green-100 shadow-md transition-shadow hover:shadow-lg"
				>
					<div class="card-body">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-sm font-medium text-base-content/60">Total Items Sold</h3>
								<p class="mt-2 text-2xl font-bold text-green-600">{getTotalItems()}</p>
							</div>
							<div class="rounded-full bg-green-200 p-3 text-green-600">
								<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				<!-- Total Tax Amount Widget -->
				<div
					class="card bg-gradient-to-br from-orange-50 to-orange-100 shadow-md transition-shadow hover:shadow-lg"
				>
					<div class="card-body">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-sm font-medium text-base-content/60">Total Tax Amount</h3>
								<p class="mt-2 text-2xl font-bold text-orange-600">{formatPrice(getTotalTax())}</p>
							</div>
							<div class="rounded-full bg-orange-200 p-3 text-orange-600">
								<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				<!-- Total Item Amount Widget -->
				<div
					class="card bg-gradient-to-br from-purple-50 to-purple-100 shadow-md transition-shadow hover:shadow-lg"
				>
					<div class="card-body">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-sm font-medium text-base-content/60">Total Item Amount</h3>
								<p class="mt-2 text-2xl font-bold text-purple-600">
									{formatPrice(getTotalItemAmount())}
								</p>
							</div>
							<div class="rounded-full bg-purple-200 p-3 text-purple-600">
								<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Filters Section -->
			<div class="no-print mb-6 rounded-lg bg-base-100 p-4 shadow-sm">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Search Input -->
					<div class="form-control">
						<label class="label" for="search">
							<span class="label-text font-medium">Search</span>
						</label>
						<input
							type="text"
							id="search"
							placeholder="Search by order code, customer name, or email..."
							class="input-bordered input input-sm"
							value={searchQuery}
							oninput={handleSearch}
						/>
					</div>

					<!-- Status Filter -->
					<div class="form-control">
						<label class="label" for="status-filter">
							<span class="label-text font-medium">Filter by Status</span>
						</label>
						<select
							id="status-filter"
							class="select-bordered select select-sm"
							value={statusFilter}
							onchange={handleStatusFilter}
						>
							<option value="all">All Statuses</option>
							<option value="pending">Pending</option>
							<option value="confirmed">Confirmed</option>
							<option value="shipped">Shipped</option>
							<option value="delivered">Delivered</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Results Count -->
			<div class="no-print mb-4 text-sm text-base-content/60">
				Showing {filteredSales.length} of {sales.length} sales
			</div>
		</div>

		<!-- Sales Table -->
		<div class="overflow-x-auto rounded-lg bg-base-100 shadow-sm">
			{#if filteredSales.length > 0}
				<table class="table w-full table-zebra">
					<thead class="bg-base-200 font-semibold text-base-content">
						<tr>
							<th class="p-3">S.N.</th>
							<th class="p-3">Order Code</th>
							<th class="p-3">Customer</th>
							<th>Product Name</th>
							<th>Quantity</th>
							<th>Price</th>
							<th>Total</th>
							<th class="p-3">Status</th>
							<th class="p-3">Order Date</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredSales as sale, index (sale.id)}
							<tr class="border-b transition-colors hover:bg-base-200">
								<td class="p-3 text-center font-medium">{index + 1}</td>
								<td class="p-3 font-medium">{sale.order?.order_code || '-'}</td>
								<td class="p-3">
									{sale.buyer?.name || ''}
								</td>
								<td class="p-3 text-sm">{sale.name || '-'}</td>
								<td class="p-3 text-sm">{sale.quantity || '-'}</td>
								<td class="p-3 text-sm">{sale.price || '-'}</td>
								<td class="p-3 font-semibold">{formatPrice(sale.subtotal || 0)}</td>
								<td class="p-3">
									<span class="badge {getStatusColor(sale.order.status)}"
										>{sale.order.status || 'Pending'}</span
									>
								</td>
								<td class="p-3 text-sm">{formatDate(sale.order.created_at)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<div class="p-12 text-center">
					<svg
						class="mx-auto mb-4 h-16 w-16 text-base-content/20"
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
					<p class="text-lg text-base-content/60">No sales found</p>
					<p class="mt-1 text-sm text-base-content/40">
						Try adjusting your search or filter criteria
					</p>
				</div>
			{/if}
		</div>

		<!-- Summary Section (for print) -->
		<div class="print-only mt-8" style="page-break-before: avoid;">
			<h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Summary</h3>
			<table style="width: 100%; border-collapse: collapse;">
				<tbody>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd;">Total Orders</td>
						<td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
							{filteredSales.length}
						</td>
					</tr>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd;">Total Revenue</td>
						<td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
							{formatPrice(
								filteredSales.reduce(
									(sum: number, sale: any) => sum + (parseFloat(sale.total_amount) || 0),
									0
								)
							)}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Toast Notifications -->
<div class="no-print fixed top-4 right-4 z-50 flex flex-col gap-2">
	{#each toasts as t (t.id)}
		<div
			class="animate-in fade-in slide-in-from-top-2 max-w-xs rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg"
			style="background: {t.type === 'success'
				? 'linear-gradient(90deg, #16a34a, #059669)'
				: t.type === 'error'
					? 'linear-gradient(90deg, #dc2626, #b91c1c)'
					: 'linear-gradient(90deg, #3b82f6, #2563eb)'}"
		>
			<div class="flex items-center gap-2">
				{#if t.type === 'success'}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else if t.type === 'error'}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
				{t.message}
			</div>
		</div>
	{/each}
</div>

<style>
	@media print {
		.no-print {
			display: none !important;
		}

		.print-title {
			page-break-after: avoid;
		}

		table {
			width: 100%;
			border-collapse: collapse;
		}

		th,
		td {
			border: 1px solid #ddd;
			padding: 8px;
			text-align: left;
		}

		th {
			background-color: #f2f2f2;
			font-weight: bold;
		}

		tr {
			page-break-inside: avoid;
		}

		.print-only {
			display: block !important;
		}

		body {
			margin: 0;
			padding: 10px;
		}

		.min-h-screen {
			min-height: auto !important;
		}
	}

	.print-only {
		display: none;
	}
</style>
