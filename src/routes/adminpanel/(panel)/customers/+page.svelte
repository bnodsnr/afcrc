<script lang="ts">
	let customerName = '';
	let customerEmail = '';
	let customerPhone = '';
	let { data } = $props();
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { base } from '$lib/admin/paths';
	import { faPhone } from '@fortawesome/free-solid-svg-icons';

	// 👇 $derived so they update when load() re-runs
	let customers = $derived(data.customers);

	let pagination = $derived(customers.pagination);

	// 👇 local filter state synced from URL
	let name = $derived($page.url.searchParams.get('name') ?? '');
	let phone = $derived($page.url.searchParams.get('phone') ?? '');
	let email = $derived($page.url.searchParams.get('email') ?? '');
	let pageSize = $derived($page.url.searchParams.get('page_size') ?? '10');

	function applyFilters() {
		const params = new URLSearchParams();
		params.set('page', '1');
		params.set('page_size', pageSize);
		if (name) params.set('name', name);
		if (phone) params.set('phone', phone);
		if (email) params.set('email', email);
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

<div class="min-h-screen">
	<div class="mx-auto max-w-6xl">
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
			<span class="text-base-content/60">All Customers</span>
		</div>
		<!-- Header Section -->
		<div class="mb-6 rounded-lg">
			<div class="mb-4 flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">All Customers</h1>
					<p class="text-sm">Manage your all customer's information</p>
				</div>
			</div>
		</div>
		<!-- Filters -->
		<form class="mb-4 rounded-lg" onsubmit={(e) => e.preventDefault()}>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
				<div class="form-control">
					<input
						type="text"
						value={phone}
						placeholder="Search by phone no."
						class="input-bordered input input-md w-full text-base-content placeholder-base-content/50"
					/>
				</div>
				<div class="form-control">
					<input
						type="text"
						value={email}
						placeholder="Search by email."
						class="input-bordered input input-md w-full text-base-content placeholder-base-content/50"
					/>
				</div>

				<!-- 👇 bind dates -->
				<div class="form-control">
					<input
						id="customer-name"
						type="text"
						bind:value={name}
						class="input-bordered input input-md w-full text-base-content"
						placeholder="Search by customer name"
					/>
				</div>

				<!-- 👇 call applyFilters on click -->
				<div class="form-control">
					<button class="btn w-full flex-nowrap gap-2 btn-md btn-primary" onclick={applyFilters}>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						Filter Customer
					</button>
				</div>
			</div>
		</form>

		<div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
			<table class="table w-full table-zebra">
				<thead>
					<tr>
						<th>#SN</th>
						<th>Name</th>
						<th>Email</th>
						<th>Phone</th>
						<th>Total Orders</th>
						<th>Total Spent</th>
						<th>Joined Date</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>

				<tbody
					>{#if customers.data.length === 0}
						<tr>
							<td colspan="12" class="px-6 py-4 text-center text-sm text-gray-500">
								No customers found.
							</td>
						</tr>
					{:else}
						{#each customers.data as customer (customer.id)}
							<tr>
								<td>{customer.id}</td>
								<td>{customer.name}</td>
								<td>{customer.email}</td>
								<td>{customer.phone}</td>
								<td>{customer.total_orders}</td>
								<td>Rs. {customer.total_spent.toFixed(2)}</td>
								<td>{customer.created_at}</td>
								<td>
									<span
										class={`badge ${customer.is_active === true ? 'badge-success' : 'badge-error'}`}
									>
										{customer.is_active === true ? 'Active' : 'Inactive'}
									</span>
								</td>
								<td>
									<a
										href={base + `/customers/${customer.id}`}
										class="btn btn-square btn-xs btn-info"
										title="View details"
									>
										<svg
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
										</svg>
									</a>
								</td>
							</tr>
						{/each}
					{/if}
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
		<!-- Order Items Section -->
		<div class="overflow-hidden rounded-xl bg-white shadow-md"></div>
	</div>
</div>
