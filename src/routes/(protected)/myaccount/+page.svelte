<script lang="ts">
	import { base } from '$app/paths';

	const { data } = $props();
	let totalOrders = parseInt(data.summary.data.statistics?.total_orders, 0) || 0;
	let totalSpent = parseFloat(data.summary.data.statistics?.total_spent) || 0;
	let cancelledOrders = parseInt(data.summary.data.statistics?.cancelled_orders, 10) || 0;
	let deliveredOrders = parseInt(data.summary.data.statistics?.delivered_orders, 10) || 0;
	let recentOrders = data.summary.data.recent_orders || [];
	let status = data.summary.data.status_breakdown?.[0]?.status || '';
	console.log('status', status);
	function getStatusClass(status: string): string {
		const s = status?.toLowerCase() || '';
		if (s === 'delivered') return 'status-delivered';
		if (s === 'processing') return 'status-processing';
		if (s === 'cancelled') return 'status-cancelled';
		if (s === 'shipped') return 'status-shipped';
		return 'status-pending';
	}
</script>

<div class="page-header">
	<h1>Dashboard</h1>
	<p>Welcome back! Here's an overview of your account.</p>
</div>
<!-- Stats Grid -->
<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-icon stat-icon-orders">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.8"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
				/>
			</svg>
		</div>
		<div class="stat-content">
			<span class="stat-label">Total Orders</span>
			<span class="stat-value">{totalOrders}</span>
		</div>
	</div>

	<div class="stat-card">
		<div class="stat-icon stat-icon-spent">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.8"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
				/>
			</svg>
		</div>
		<div class="stat-content">
			<span class="stat-label">Total Spent</span>
			<span class="stat-value"
				>Rs. {totalSpent.toLocaleString('en', { minimumFractionDigits: 2 })}</span
			>
		</div>
	</div>

	<div class="stat-card">
		<div class="stat-icon stat-icon-delivered">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.8"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
		<div class="stat-content">
			<span class="stat-label">Delivered</span>
			<span class="stat-value">{deliveredOrders}</span>
		</div>
	</div>

	<div class="stat-card">
		<div class="stat-icon stat-icon-cancelled">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.8"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</div>
		<div class="stat-content">
			<span class="stat-label">Cancelled</span>
			<span class="stat-value">{cancelledOrders}</span>
		</div>
	</div>
</div>

<!-- Recent Orders -->
<div class="card">
	<div class="card-header">
		<h2>Recent Orders</h2>
		<a href="{base}/myaccount/orders" class="view-all-link">
			View All
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				width="16"
				height="16"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
			</svg>
		</a>
	</div>

	{#if recentOrders.length > 0}
		<div class="table-responsive">
			<table class="orders-table">
				<thead>
					<tr>
						<th>Code</th>
						<th>Date</th>
						<th>Item Name</th>
						<th>Quantity</th>
						<th>Status</th>
						<th>Total</th>
					</tr>
				</thead>
				<tbody>
					{#each recentOrders as order}
						<tr>
							<td class="order-id">#{order.order_code || order.id}</td>
							<td class="order-date"
								>{new Date(order.order_date || order.date).toLocaleDateString()}</td
							>

							<td>{order.name}</td>
							<td>{order.quantity || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</td>
							<td>
								<span class="status-badge {getStatusClass(status)}">
									{status}
								</span>
							</td>
							<td class="order-amount">Rs. {(order.subtotal || 0).toFixed(2)}</td>
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
			<p>No orders yet</p>
			<a href="{base}/shop" class="shop-btn">Start Shopping</a>
		</div>
	{/if}
</div>

<style>
	.page-header {
		margin-bottom: 28px;
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

	/* ===== Stats Grid ===== */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		margin-bottom: 28px;
	}

	.stat-card {
		background: #ffffff;
		border-radius: 14px;
		padding: 20px;
		display: flex;
		align-items: flex-start;
		gap: 14px;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.04),
			0 2px 12px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.04);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.stat-icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.stat-icon svg {
		width: 22px;
		height: 22px;
	}

	.stat-icon-orders {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}

	.stat-icon-spent {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}

	.stat-icon-delivered {
		background: rgba(11, 93, 30, 0.1);
		color: #0b5d1e;
	}

	.stat-icon-cancelled {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.stat-label {
		font-size: 12.5px;
		font-weight: 500;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-size: 22px;
		font-weight: 800;
		color: #111827;
		letter-spacing: -0.5px;
		line-height: 1.2;
	}

	/* ===== Card ===== */
	.card {
		background: #ffffff;
		border-radius: 14px;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.04),
			0 2px 12px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.04);
		margin-bottom: 28px;
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	.card-header h2 {
		font-size: 16px;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.view-all-link {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 13px;
		font-weight: 600;
		color: #0b5d1e;
		text-decoration: none;
		transition: color 0.2s;
	}

	.view-all-link:hover {
		color: #16a34a;
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
		padding: 12px 24px;
		text-align: left;
		font-size: 11.5px;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background: #f9fafb;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	.orders-table td {
		padding: 14px 24px;
		font-size: 13.5px;
		color: #374151;
		border-bottom: 1px solid rgba(0, 0, 0, 0.04);
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

	.order-id {
		font-weight: 600;
		color: #111827;
	}

	.order-date {
		color: #6b7280;
	}

	.order-amount {
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
		padding: 10px 22px;
		background: #0b5d1e;
		color: #ffffff;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.2s;
	}

	.shop-btn:hover {
		background: #16a34a;
	}

	/* ===== Quick Actions ===== */
	.quick-actions {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
	}

	.action-card {
		background: #ffffff;
		border-radius: 14px;
		padding: 24px 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		text-decoration: none;
		color: #374151;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.04),
			0 2px 12px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.04);
		font-size: 13px;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.action-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
	}

	.action-icon {
		width: 48px;
		height: 48px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-icon svg {
		width: 24px;
		height: 24px;
	}

	.action-icon-orders {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}

	.action-icon-returns {
		background: rgba(245, 158, 11, 0.1);
		color: #d97706;
	}

	.action-icon-profile {
		background: rgba(11, 93, 30, 0.1);
		color: #0b5d1e;
	}

	.action-icon-addresses {
		background: rgba(139, 92, 246, 0.1);
		color: #7c3aed;
	}

	/* ===== Responsive ===== */
	@media (max-width: 1024px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.quick-actions {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.quick-actions {
			grid-template-columns: repeat(2, 1fr);
		}

		.page-header h1 {
			font-size: 20px;
		}
	}
</style>
