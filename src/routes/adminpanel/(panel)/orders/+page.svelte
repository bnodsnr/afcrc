<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { base } from '$lib/admin/paths';

	let { data } = $props();

	// 👇 $derived so they update when load() re-runs
	let orders = $derived(data.orders);
	let pagination = $derived(data.pagination);

	// 👇 local filter state synced from URL
	let statusFilter = $derived($page.url.searchParams.get('status') ?? '');
	let startDate = $derived($page.url.searchParams.get('start_date') ?? '');
	let endDate = $derived($page.url.searchParams.get('end_date') ?? '');
	let pageSize = $derived($page.url.searchParams.get('page_size') ?? '10');

	function applyFilters() {
		const params = new URLSearchParams();
		params.set('page', '1');
		params.set('page_size', pageSize);
		if (statusFilter) params.set('status', statusFilter);
		if (startDate) params.set('start_date', startDate);
		if (endDate) params.set('end_date', endDate);
		goto(`?${params}`);
	}

	function goPage(p: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(p));
		goto(`?${params}`);
	}

	function changePageSize(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page_size', val);
		params.set('page', '1');
		goto(`?${params}`);
	}

	// page numbers with ellipsis
	function getPageNumbers(current: number, total: number): (number | '...')[] {
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
		const pages: (number | '...')[] = [1];
		if (current > 3) pages.push('...');
		for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
			pages.push(i);
		}
		if (current < total - 2) pages.push('...');
		pages.push(total);
		return pages;
	}
</script>

<div class="min-h-screen space-y-4">
	<!-- Breadcrumb Navigation -->
	<div class="mb-6 flex items-center gap-2 text-sm">
		<a href={base} class="link font-medium text-primary link-hover">Dashboard</a>
		<svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>

		<span class="text-base-content/60">All Orders</span>
	</div>
	<!-- Header -->
	<div class="mb-6 rounded-lg">
		<div class="mb-4 flex items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold">All Orders</h1>
				<p class="text-sm">Manage your all customer's orders</p>
			</div>
			<div>
				<a
					href={base + '/banners/create'}
					class="btn flex-nowrap gap-2 transition-shadow btn-sm btn-warning hover:shadow-lg"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
						<circle cx="12" cy="14" r="3" stroke-width="2" />
						<path stroke-linecap="round" stroke-width="2" d="M12 12.5v1.5l.75.75" />
					</svg>
					Pending Orders
				</a>
				<a
					href={base + '/banners/create'}
					class="btn flex-nowrap gap-2 transition-shadow btn-sm btn-info hover:shadow-lg"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Confirmed Orders
				</a>
				<a
					href={base + '/banners/create'}
					class="btn flex-nowrap gap-2 transition-shadow btn-sm btn-success hover:shadow-lg"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20 7l-8-4-8 4m16 0v10l-8 4m8-14l-8 4m0 10l-8-4V7m8 14V11"
						/>
					</svg>
					Delivered Orders
				</a>
				<a
					href={base + '/banners/create'}
					class="btn flex-nowrap gap-2 transition-shadow btn-sm btn-error hover:shadow-lg"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Cancelled Orders
				</a>
			</div>
		</div>
	</div>
	<!-- Filters -->
	<form class="mb-4 rounded-lg" onsubmit={(e) => e.preventDefault()}>
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
			<div class="form-control">
				<input
					type="text"
					placeholder="Search by phone no."
					class="input-bordered input input-sm w-full"
				/>
			</div>

			<!-- 👇 bind status filter -->
			<div class="form-control">
				<select
					class="select-bordered bg-base select w-full select-sm text-base-content"
					bind:value={statusFilter}
				>
					<option value="">All Status</option>
					<option value="confirmed">Confirmed</option>
					<option value="processing">Processing</option>
					<option value="delivered">Delivered</option>
				</select>
			</div>

			<!-- 👇 bind dates -->
			<div class="form-control">
				<input
					id="start-date"
					type="date"
					bind:value={startDate}
					class="input-bordered bg-base input input-sm w-full text-base-content"
					style="color-scheme: light;"
				/>
			</div>

			<div class="form-control">
				<input
					id="end-date"
					type="date"
					bind:value={endDate}
					class="input-bordered bg-base input input-sm w-full text-base-content"
					style="color-scheme: light;"
				/>
			</div>

			<!-- 👇 call applyFilters on click -->
			<div class="form-control">
				<button class="btn w-full flex-nowrap gap-2 btn-sm btn-primary" onclick={applyFilters}>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					Filter Orders
				</button>
			</div>
		</div>
	</form>
	<!-- Table -->
	<div class="overflow-x-auto">
		<table class="table">
			<thead class="bg-base-200">
				<tr>
					<th>#SN</th>
					<th>Code</th>
					<th>User</th>
					<th>Phone</th>
					<th>Items</th>
					<th>Subtotal</th>
					<th>Discount</th>
					<th>Delivery Charge</th>
					<th>Amount</th>
					<th>Date</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#if orders.length === 0}
					<tr>
						<td colspan="7" class="py-4 text-center text-gray-500">No orders found.</td>
					</tr>
				{/if}
				{#each orders as order, i (order.id)}
					<tr>
						<!-- 👇 correct serial number across pages -->
						<th>{(pagination.current_page - 1) * pagination.page_size + i + 1}</th>
						<td>{order.order_code}</td>
						<td>{order.user.name}</td>
						<td>{order.user.phone}</td>
						<td>{order.total_items}</td>
						<td>Rs.{order.subtotal ?? 0}</td>
						<td>Rs.{order.discount_amount ?? 0}</td>
						<td>Rs.{order.tax ?? 0}</td>
						<td>Rs.{order.total ?? 0}</td>
						<td>{new Date(order.created_at).toLocaleDateString()}</td>
						<td>
							<span
								class="badge badge-sm"
								class:badge-warning={order.status === 'pending'}
								class:badge-success={order.status === 'confirmed'}
								class:badge-default={order.status === 'processing'}
								class:badge-info={order.status === 'delivered'}
								class:badge-error={order.status === 'cancelled'}
							>
								{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
							</span>
						</td>
						<td>
							<a href={base + `/orders/${order.id}`} class="btn btn-xs btn-primary"
								><svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z"
									/>
								</svg></a
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<!-- Pagination -->
		<div class="border-t border-base-300 p-4">
			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<!-- 👇 correct API keys: total_items, page_size, current_page -->
				<p class="text-sm text-base-content/60">
					Showing
					<span class="font-semibold">
						{(pagination.current_page - 1) * pagination.page_size + 1}
					</span>
					–
					<span class="font-semibold">
						{Math.min(pagination.current_page * pagination.page_size, pagination.total_items)}
					</span>
					of
					<span class="font-semibold">{pagination.total_items}</span>
					orders
				</p>

				<!-- Page size -->
				<div class="flex items-center gap-2">
					<label for="itemsPerPage" class="text-sm text-base-content/60">Items per page:</label>
					<select
						id="itemsPerPage"
						class="select-bordered select w-20 select-sm"
						value={pageSize}
						onchange={changePageSize}
					>
						<option value="5">5</option>
						<option value="10">10</option>
						<option value="15">15</option>
						<option value="20">20</option>
						<option value="25">25</option>
						<option value="50">50</option>
					</select>
				</div>

				<!-- 👇 proper pagination buttons with ellipsis -->
				<div class="join">
					<button
						class="btn join-item btn-sm"
						disabled={!pagination.has_previous}
						onclick={() => goPage(pagination.current_page - 1)}>«</button
					>

					{#each getPageNumbers(pagination.current_page, pagination.total_pages) as p}
						{#if p === '...'}
							<button class="btn-disabled btn join-item btn-sm">…</button>
						{:else}
							<button
								class="btn join-item btn-sm"
								class:btn-active={p === pagination.current_page}
								onclick={() => goPage(p as number)}>{p}</button
							>
						{/if}
					{/each}

					<button
						class="btn join-item btn-sm"
						disabled={!pagination.has_next}
						onclick={() => goPage(pagination.current_page + 1)}>»</button
					>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	input[type='date']::-webkit-calendar-picker-indicator {
		cursor: pointer;
		border-radius: 4px;
		margin-right: 2px;
		opacity: 0.6;
		filter: invert(0.8);
	}
</style>
