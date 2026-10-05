<script lang="ts">
	import { base } from '$app/paths';
	let { data } = $props();

	interface OrderHistoryItem {
		id: string;
		name: string;
		quantity: number;
		price: number;
		image: string;
		size: string;
		color: string;
		subtotal: number;
		discount: number;
		order_code: string;
		order_date: string;
		order_status: string;
	}

	function mapOrderHistory(apiData: typeof data.orderHistory.items): OrderHistoryItem[] {
		if (apiData && Array.isArray(apiData)) {
			return apiData.map((item: any) => ({
				id: item.id,
				name: item.name,
				quantity: parseInt(item.quantity, 10) || 0,
				price: parseFloat(item.price) || 0,
				image: item.image,
				size: item.size,
				color: item.color,
				subtotal: parseFloat(item.subtotal) || 0,
				discount: parseFloat(item.discount) || 0,
				order_code: item.order_code,
				order_date: item.order_date,
				order_status: item.order_status
			}));
		}
		return [];
	}

	let isLoading = $derived(data.orderHistory === null || data.orderHistory === undefined);
	let orderHistory = $derived(mapOrderHistory(data.orderHistory?.items));

	function getStatusClass(status: string): string {
		const s = status?.toLowerCase() || '';
		if (s === 'delivered') return 'status-delivered';
		if (s === 'processing') return 'status-processing';
		if (s === 'cancelled') return 'status-cancelled';
		if (s === 'shipped') return 'status-shipped';
		return 'status-pending';
	}

	let filterStatus = $state('all');
	const statusOptions = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

	let filteredOrders = $derived(
		filterStatus === 'all'
			? orderHistory
			: orderHistory.filter((o) => o.order_status?.toLowerCase() === filterStatus)
	);
</script>

<div class="page-header">
	<h1>Order History</h1>
	<p>Track and manage all your orders in one place.</p>
</div>

{#if isLoading}
	<div class="card">
		<div class="loading-content">
			<div class="spinner"></div>
			<p>Loading order history...</p>
		</div>
	</div>
{:else}
	<!-- Filters -->
	<div class="filters-bar">
		{#each statusOptions as status}
			<button
				class="filter-chip"
				class:active={filterStatus === status}
				onclick={() => (filterStatus = status)}
			>
				{status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
				{#if status === 'all'}
					<span class="count">{orderHistory.length}</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="card">
		{#if filteredOrders.length > 0}
			<div class="table-responsive">
				<table class="orders-table">
					<thead>
						<tr>
							<th>#</th>
							<th>Product</th>
							<th>Order Code</th>
							<th>Date</th>
							<th>Qty</th>
							<th>Price</th>
							<th>Status</th>
							<th class="text-right">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredOrders as item, index}
							<tr>
								<td class="serial">{index + 1}</td>
								<td>
									<div class="product-cell">
										{#if item.image}
											<img src={item.image} alt={item.name} class="product-thumb" />
										{/if}
										<div class="product-info">
											<span class="product-name">{item.name}</span>
											{#if item.size || item.color}
												<span class="product-meta">
													{#if item.size}Size: {item.size}{/if}
													{#if item.size && item.color}
														|
													{/if}
													{#if item.color}Color: {item.color}{/if}
												</span>
											{/if}
										</div>
									</div>
								</td>
								<td class="code-cell">#{item.order_code}</td>
								<td class="date-cell">{new Date(item.order_date).toLocaleDateString()}</td>
								<td class="qty-cell">{item.quantity}</td>
								<td>Rs. {item.price.toFixed(2)}</td>
								<td>
									<span class="status-badge {getStatusClass(item.order_status)}">
										{item.order_status}
									</span>
								</td>
								<td class="subtotal text-right">Rs. {item.subtotal.toFixed(2)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.2"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
						/>
					</svg>
				</div>
				<h3 class="empty-title">
					{filterStatus === 'all' ? 'No orders yet' : `No ${filterStatus} orders`}
				</h3>
				<p class="empty-desc">
					{filterStatus === 'all'
						? "You haven't placed any orders yet. Start exploring our collection!"
						: `You don't have any ${filterStatus} orders at the moment.`}
				</p>
				{#if filterStatus === 'all'}
					<a href="{base}/shop" class="shop-btn">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16">
							<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
						</svg>
						Start Shopping
					</a>
				{:else}
					<a href="{base}/shop" class="shop-btn-outline">Browse All Products</a>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.page-header {
		margin-bottom: 24px;
	}

	.page-header h1 {
		font-size: 24px;
		font-weight: 800;
		color: #111827;
		margin: 0;
		letter-spacing: -0.5px;
	}

	.page-header p {
		font-size: 14px;
		color: #6b7280;
		margin: 6px 0 0;
	}

	/* ===== Filters ===== */
	.filters-bar {
		display: flex;
		gap: 8px;
		margin-bottom: 20px;
		overflow-x: auto;
		padding-bottom: 4px;
		-webkit-overflow-scrolling: touch;
	}

	.filter-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 20px;
		border: 1px solid #e5e7eb;
		background: #ffffff;
		color: #6b7280;
		font-size: 12.5px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.2s;
		font-family: inherit;
	}

	.filter-chip:hover {
		border-color: #0b5d1e;
		color: #0b5d1e;
	}

	.filter-chip.active {
		background: #0b5d1e;
		color: #ffffff;
		border-color: #0b5d1e;
	}

	.filter-chip .count {
		background: rgba(255, 255, 255, 0.2);
		padding: 1px 7px;
		border-radius: 10px;
		font-size: 11px;
	}

	.filter-chip.active .count {
		background: rgba(255, 255, 255, 0.2);
	}

	/* ===== Card ===== */
	.card {
		background: #ffffff;
		border-radius: 14px;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.04),
			0 2px 12px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.04);
		overflow: hidden;
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60px 20px;
		color: #6b7280;
		gap: 12px;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e5e7eb;
		border-top-color: #0b5d1e;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ===== Table ===== */
	.table-responsive {
		overflow-x: auto;
	}

	.orders-table {
		width: 100%;
		border-collapse: collapse;
	}

	.orders-table th {
		padding: 12px 20px;
		text-align: left;
		font-size: 11.5px;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background: #f9fafb;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		white-space: nowrap;
	}

	.orders-table td {
		padding: 14px 20px;
		font-size: 13.5px;
		color: #374151;
		border-bottom: 1px solid rgba(0, 0, 0, 0.04);
		vertical-align: middle;
	}

	.orders-table tbody tr:last-child td {
		border-bottom: none;
	}

	.orders-table tbody tr:hover {
		background: rgba(11, 93, 30, 0.02);
	}

	.text-right {
		text-align: right;
	}

	.serial {
		color: #9ca3af;
		font-size: 12px;
		width: 40px;
	}

	.product-cell {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.product-thumb {
		width: 42px;
		height: 42px;
		border-radius: 8px;
		object-fit: cover;
		border: 1px solid rgba(0, 0, 0, 0.06);
		flex-shrink: 0;
	}

	.product-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.product-name {
		font-weight: 600;
		color: #111827;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 200px;
	}

	.product-meta {
		font-size: 11.5px;
		color: #9ca3af;
	}

	.code-cell {
		font-weight: 600;
		color: #0b5d1e;
	}

	.date-cell {
		color: #6b7280;
		white-space: nowrap;
	}

	.qty-cell {
		text-align: center;
	}

	.subtotal {
		font-weight: 700;
		color: #111827;
	}

	/* ===== Status Badge ===== */
	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 10px;
		border-radius: 20px;
		font-size: 11.5px;
		font-weight: 600;
		text-transform: capitalize;
		letter-spacing: 0.2px;
		white-space: nowrap;
	}

	.status-delivered {
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
	}
	.status-processing {
		background: rgba(59, 130, 246, 0.1);
		color: #2563eb;
	}
	.status-shipped {
		background: rgba(139, 92, 246, 0.1);
		color: #7c3aed;
	}
	.status-cancelled {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}
	.status-pending {
		background: rgba(245, 158, 11, 0.1);
		color: #d97706;
	}

	/* ===== Empty State ===== */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60px 20px;
		color: #6b7280;
	}

	.empty-icon {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(11, 93, 30, 0.08), rgba(11, 93, 30, 0.03));
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16px;
	}

	.empty-icon svg {
		width: 32px;
		height: 32px;
		color: #0b5d1e;
	}

	.empty-title {
		font-size: 17px;
		font-weight: 700;
		color: #111827;
		margin: 0 0 6px;
	}

	.empty-desc {
		font-size: 13.5px;
		color: #9ca3af;
		margin: 0 0 20px;
		text-align: center;
		max-width: 320px;
		line-height: 1.5;
	}

	.shop-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 11px 24px;
		background: #0b5d1e;
		color: #ffffff;
		border-radius: 10px;
		font-size: 13.5px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
		box-shadow: 0 2px 8px rgba(11, 93, 30, 0.25);
	}

	.shop-btn:hover {
		background: #16a34a;
		box-shadow: 0 4px 14px rgba(11, 93, 30, 0.3);
		transform: translateY(-1px);
	}

	.shop-btn-outline {
		display: inline-flex;
		align-items: center;
		padding: 10px 22px;
		background: transparent;
		color: #0b5d1e;
		border: 1.5px solid #0b5d1e;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
	}

	.shop-btn-outline:hover {
		background: rgba(11, 93, 30, 0.06);
	}

	@media (max-width: 640px) {
		.page-header h1 {
			font-size: 20px;
		}
	}
</style>
