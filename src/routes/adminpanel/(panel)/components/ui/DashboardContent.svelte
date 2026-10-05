<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';

	let { dashboardstats } = $props(); // ← receive as 'stats' (match what parent passes)

	let stats = {
		totalOrders: dashboardstats.totalOrders.total_orders || 0,
		totalSales: dashboardstats.totalOrders.total_revenue || 0,
		averageOrderValue: 0,
		pendingOrders: dashboardstats.statusCount.status_counts?.pending || 0,
		completedOrders: dashboardstats.statusCount.status_counts?.delivered || 0,
		totalRevenue: dashboardstats.totalOrders.total_revenue || 0
	};

	let recentOrders = dashboardstats.recentOrders.orders;
	let topProducts = dashboardstats.topProducts.products;
	let statusCount = dashboardstats.statusCount.status_counts || {
		delivered: 0,
		processing: 0,
		pending: 0,
		cancelled: 0,
		confirmed: 0,
		total_orders: 0
	};
	// let topProducts = [
	// 	{ name: 'Premium Hemp Product A', sales: 342, revenue: 34200, rating: 4.8 },
	// 	{ name: 'Hemp Extract Oil', sales: 289, revenue: 28900, rating: 4.6 },
	// 	{ name: 'Hemp Protein Powder', sales: 215, revenue: 21500, rating: 4.5 },
	// 	{ name: 'Hemp Skincare Set', sales: 156, revenue: 15600, rating: 4.7 }
	// ];

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'delivered':
				return 'bg-green-100 text-green-800';
			case 'processing':
				return 'bg-blue-100 text-blue-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-base-content';
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'delivered':
				return '✓';
			case 'processing':
				return '⟳';
			case 'pending':
				return '◐';
			case 'cancelled':
				return '✕';
			default:
				return '○';
		}
	};

	function formatDate(dateString: string) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="min-h-screen text-base-content">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="mb-2 text-4xl font-bold text-base-content">Dashboard</h1>
			<p class="text-base-content opacity-80">Welcome back! Here's your ecommerce overview.</p>
		</div>

		<!-- Key Metrics Cards -->
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<!-- Total Orders Card card w-96 bg-base-100 card-xs shadow-sm -->
			<div
				class="rounded-xl border-l-4 border-green-500 bg-base-100 p-6 shadow-md transition-shadow hover:shadow-lg"
			>
				<div class="mb-4 flex items-start justify-between">
					<div>
						<p class="mb-1 text-sm font-semibold text-gray-500">Total Orders</p>
						<p class="text-3xl font-bold text-base-content">{stats.totalOrders.toLocaleString()}</p>
						<p class="mt-2 text-xs font-semibold text-green-600">↑ 12% from last month</p>
					</div>
					<div class="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
						<svg
							class="h-6 w-6 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
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

			<!-- Total Sales Card -->
			<div
				class="rounded-xl border-l-4 border-green-500 bg-base-100 p-6 shadow-md transition-shadow hover:shadow-lg"
			>
				<div class="mb-4 flex items-start justify-between">
					<div>
						<p class="mb-1 text-sm font-semibold text-gray-500">Total Sales</p>
						<p class="text-3xl font-bold text-base-content">
							Rs. {stats.totalSales.toLocaleString()}
						</p>
						<p class="mt-2 text-xs font-semibold text-green-600">↑ 8% from last month</p>
					</div>
					<div class="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
						<svg
							class="h-6 w-6 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
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

			<!-- Avg Order Value Card -->
			<div
				class="rounded-xl border-l-4 border-purple-500 bg-base-100 p-6 shadow-md transition-shadow hover:shadow-lg"
			>
				<div class="mb-4 flex items-start justify-between">
					<div>
						<p class="mb-1 text-sm font-semibold text-gray-500">Avg Order Value</p>
						<p class="text-3xl font-bold text-base-content">Rs. {stats.averageOrderValue}</p>
						<p class="mt-2 text-xs font-semibold text-green-600">↑ 5% from last month</p>
					</div>
					<div class="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
						<svg
							class="h-6 w-6 text-purple-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
					</div>
				</div>
			</div>

			<!-- Pending Orders Card -->
			<div
				class="rounded-xl border-l-4 border-orange-500 bg-base-100 p-6 shadow-md transition-shadow hover:shadow-lg"
			>
				<div class="mb-4 flex items-start justify-between">
					<div>
						<p class="mb-1 text-sm font-semibold text-gray-500">Pending Orders</p>
						<p class="text-3xl font-bold text-base-content">{stats.pendingOrders}</p>
						<p class="mt-2 text-xs font-semibold text-orange-600">⚠ Needs attention</p>
					</div>
					<div class="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/20">
						<svg
							class="h-6 w-6 text-orange-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Content Grid -->
		<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Recent Orders Section -->
			<div class="overflow-hidden rounded-xl bg-base-100 shadow-md lg:col-span-2">
				<div class="border-b-2 border-base-300 bg-base-100 to-gray-100 px-6 py-4">
					<h2 class="flex items-center gap-2 text-xl font-bold text-base-content">
						<svg class="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
							<path
								d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z"
							/>
						</svg>
						Recent Orders
					</h2>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b border-base-300 bg-base-200">
								<th class="px-6 py-3 text-left text-xs font-semibold text-base-content opacity-70"
									>Order ID</th
								>
								<th class="px-6 py-3 text-left text-xs font-semibold text-base-content opacity-70"
									>Customer</th
								>
								<th class="px-6 py-3 text-center text-xs font-semibold text-base-content opacity-70"
									>Items</th
								>
								<th class="px-6 py-3 text-right text-xs font-semibold text-base-content opacity-70"
									>Amount</th
								>
								<th class="px-6 py-3 text-center text-xs font-semibold text-base-content opacity-70"
									>Status</th
								>
								<th class="px-6 py-3 text-left text-xs font-semibold text-base-content opacity-70"
									>Date</th
								>
							</tr>
						</thead>
						<tbody>
							{#each recentOrders as order}
								<tr class="border-b border-base-300 transition-colors hover:bg-base-200">
									<td class="px-6 py-4">
										<p class="font-mono text-sm font-semibold text-blue-600">
											{order.order_code}
										</p></td
									>
									<td class="px-6 py-4">
										<p class="text-sm font-medium text-base-content">{order.user__name}</p>
										<p class="text-xs text-gray-500">{order.user__phone}</p>
									</td>
									<td class="px-6 py-4 text-center">
										<span
											class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700"
											>{order.total_items}
										</span></td
									>
									<td class="px-6 py-4 text-right">
										<p class="font-semibold text-green-600">Rs. {order.total}</p>
									</td>
									<td class="px-6 py-4 text-center">
										<span
											class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold {getStatusColor(
												order.status
											)}"
										>
											{getStatusIcon(order.status)}
											<span class="capitalize">{order.status}</span>
										</span>
									</td>
									<td class="px-6 py-4">
										<p class="text-sm text-base-content opacity-70">
											{formatDate(order.created_at)}
										</p>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<div class="border-t border-base-300 px-6 py-4 text-center">
					<a
						href={base + '/orders/'}
						class="text-sm font-semibold text-blue-600 hover:text-blue-800">View all orders →</a
					>
				</div>
			</div>

			<!-- Order Status Summary -->
			<div class="rounded-xl bg-base-100 p-6 shadow-md">
				<h2 class="mb-6 flex items-center gap-2 text-lg font-bold text-base-content">
					<svg class="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
						<path
							fill-rule="evenodd"
							d="M4 5a2 2 0 012-2 1 1 0 100-2 4 4 0 00-4 4v10a4 4 0 004 4h12a4 4 0 004-4V5a4 4 0 00-4-4 1 1 0 100 2 2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
							clip-rule="evenodd"
						/>
					</svg>
					Order Status
				</h2>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="h-3 w-3 rounded-full bg-green-500"></div>
							<span class="text-sm font-medium text-base-content">Confirmed</span>
						</div>
						<span class="font-bold text-green-600">{statusCount.confirmed}</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="h-3 w-3 rounded-full bg-green-500"></div>
							<span class="text-sm font-medium text-base-content">Delivered</span>
						</div>
						<span class="font-bold text-green-600">{statusCount.delivered}</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="h-3 w-3 rounded-full bg-blue-500"></div>
							<span class="text-sm font-medium text-base-content">Processing</span>
						</div>
						<span class="font-bold text-blue-600">{statusCount.processing}</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="h-3 w-3 rounded-full bg-yellow-500"></div>
							<span class="text-sm font-medium text-base-content">Pending</span>
						</div>
						<span class="font-bold text-yellow-600">{statusCount.pending}</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="h-3 w-3 rounded-full bg-red-500"></div>
							<span class="text-sm font-medium text-base-content">Cancelled</span>
						</div>
						<span class="font-bold text-red-600">{statusCount.cancelled}</span>
					</div>

					<!-- Progress Bar -->
					<div class="mt-6 border-t border-base-300 pt-6">
						<p class="mb-2 text-xs font-semibold text-base-content opacity-70">
							Overall Completion Rate
						</p>
						<div class="h-3 w-full rounded-full bg-gray-200">
							<div
								class="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
								style="width: {(statusCount.delivered / statusCount.total_orders) * 100 || 10}	%"
							></div>
						</div>
						<p class="mt-2 text-xs font-semibold text-base-content opacity-70">
							{Math.round((statusCount.delivered / statusCount.total_orders) * 100 || 10)}% Complete
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Top Products Section -->
		<div class="overflow-hidden rounded-xl bg-base-100 shadow-md">
			<div class="border-b-2 border-base-300 bg-base-100 to-gray-100 px-6 py-4">
				<h2 class="flex items-center gap-2 text-xl font-bold text-base-content">
					<svg class="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z"
						/>
					</svg>
					Top Products
				</h2>
			</div>
			<div class="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">
				{#each topProducts as product, index}
					<div
						class="rounded-lg border border-base-300 bg-gradient-to-br from-slate-50 to-slate-100 p-4 transition-shadow hover:shadow-md"
					>
						<div class="mb-3 flex items-center justify-between">
							<span
								class="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-2 py-1 text-xs font-bold text-white"
							>
								#{index + 1}
							</span>
							<div class="flex items-center gap-1">
								<span class="text-yellow-500">★</span>
								<span class="text-xs font-semibold text-base-content">5.0</span>
							</div>
						</div>
						<p class="mb-3 line-clamp-2 text-sm font-semibold text-base-content">{product.name}</p>
						<div class="space-y-2 border-t border-base-300 pt-3">
							<div class="flex justify-between">
								<span class="text-xs text-base-content opacity-70">Sales</span>
								<span class="text-sm font-bold text-blue-600">{product.total_orders}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-xs text-base-content opacity-70">Revenue</span>
								<span class="text-sm font-bold text-green-600"
									>Rs. {product.total_revenue.toLocaleString()}</span
								>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
