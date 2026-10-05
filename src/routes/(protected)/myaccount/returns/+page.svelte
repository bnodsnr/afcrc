<script lang="ts">
	import { onMount } from 'svelte';
	import { isLoggedIn } from '$lib/stores/auth';
	import { createApi } from '$lib/api';
	import { showSuccess, showError } from '$lib/stores/toast';

	interface OrderHistoryItem {
		id: string;
		name: string;
		quantity: number;
		price: number;
		image: string;
		order_code: string;
		order_date: string;
		order_status: string;
		subtotal: number;
	}

	let orderHistory = $state<OrderHistoryItem[]>([]);
	let isLoading = $state(true);
	let activeTab = $state<'return' | 'cancel'>('return');

	// Return modal
	let showReturnModal = $state(false);
	let selectedOrder = $state<OrderHistoryItem | null>(null);
	let returnReason = $state('');
	let returnDescription = $state('');
	let returnQuantity = $state(1);
	let isSubmitting = $state(false);

	// Cancel modal
	let showCancelModal = $state(false);
	let cancelReason = $state('');
	let cancelDescription = $state('');

	onMount(async () => {
		if ($isLoggedIn) {
			await fetchOrderHistory();
		}
		isLoading = false;
	});

	async function fetchOrderHistory() {
		try {
			const api = createApi(fetch);
			const data = await api.profile.getorderhistory();
			if (data?.order_history && Array.isArray(data.order_history)) {
				orderHistory = data.order_history.map((item: any) => ({
					id: item.id,
					name: item.name,
					quantity: parseInt(item.quantity, 10) || 0,
					price: parseFloat(item.price) || 0,
					image: item.image,
					order_code: item.order_code,
					order_date: item.order_date,
					order_status: item.order_status,
					subtotal: parseFloat(item.subtotal) || 0
				}));
			}
		} catch (e) {
			console.error('Failed to fetch order history:', e);
		}
	}

	let returnableOrders = $derived(
		orderHistory.filter((o) => o.order_status?.toLowerCase() === 'delivered')
	);

	let cancellableOrders = $derived(
		orderHistory.filter(
			(o) =>
				o.order_status?.toLowerCase() !== 'cancelled' &&
				o.order_status?.toLowerCase() !== 'delivered'
		)
	);

	function openReturnModal(order: OrderHistoryItem) {
		selectedOrder = order;
		returnReason = '';
		returnDescription = '';
		returnQuantity = order.quantity;
		showReturnModal = true;
	}

	function closeReturnModal() {
		showReturnModal = false;
		selectedOrder = null;
	}

	function openCancelModal(order: OrderHistoryItem) {
		selectedOrder = order;
		cancelReason = '';
		cancelDescription = '';
		showCancelModal = true;
	}

	function closeCancelModal() {
		showCancelModal = false;
		selectedOrder = null;
	}

	async function submitReturnRequest() {
		if (!selectedOrder || !returnReason.trim()) {
			showError('Please select a reason for return');
			return;
		}

		isSubmitting = true;
		try {
			const api = createApi(fetch);
			const response = await (api.orders as any).submitReturnRequest({
				order_code: selectedOrder.order_code,
				reason: returnReason,
				description: returnDescription,
				quantity: returnQuantity
			});

			if (response?.success || response?.id) {
				showSuccess('Return request submitted successfully');
				closeReturnModal();
				setTimeout(() => location.reload(), 500);
			} else {
				showError(response?.message || 'Failed to submit return request');
			}
		} catch (error) {
			showError('Error submitting return request. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	async function submitCancelRequest() {
		if (!selectedOrder || !cancelReason.trim()) {
			showError('Please select a reason for cancellation');
			return;
		}

		isSubmitting = true;
		try {
			const api = createApi(fetch);
			const response = await (api.orders as any).submitCancelRequest({
				order_code: selectedOrder.order_code,
				reason: cancelReason,
				description: cancelDescription
			});

			if (response?.success || response?.id) {
				showSuccess('Order cancellation request submitted');
				closeCancelModal();
				setTimeout(() => location.reload(), 500);
			} else {
				showError(response?.message || 'Failed to submit cancellation');
			}
		} catch (error) {
			showError('Error submitting cancellation. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	function getStatusClass(status: string): string {
		const s = status?.toLowerCase() || '';
		if (s === 'delivered') return 'status-delivered';
		if (s === 'processing') return 'status-processing';
		if (s === 'cancelled') return 'status-cancelled';
		return 'status-pending';
	}
</script>

<div class="page-header">
	<h1>Return & Cancellation</h1>
	<p>Request returns for delivered items or cancel pending orders.</p>
</div>

<!-- Tab Switcher -->
<div class="tab-switcher">
	<button
		class="tab-btn"
		class:active={activeTab === 'return'}
		onclick={() => (activeTab = 'return')}
	>
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="18" height="18">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>
		</svg>
		Returns
		<span class="tab-count">{returnableOrders.length}</span>
	</button>
	<button
		class="tab-btn"
		class:active={activeTab === 'cancel'}
		onclick={() => (activeTab = 'cancel')}
	>
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="18" height="18">
			<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
		</svg>
		Cancellations
		<span class="tab-count">{cancellableOrders.length}</span>
	</button>
</div>

{#if isLoading}
	<div class="card">
		<div class="loading-content">
			<div class="spinner"></div>
			<p>Loading orders...</p>
		</div>
	</div>
{:else}
	<!-- Returns Section -->
	{#if activeTab === 'return'}
		<div class="card">
			<div class="card-header">
				<h2>Returnable Orders</h2>
				<span class="subtitle">Delivered orders eligible for return</span>
			</div>

			{#if returnableOrders.length > 0}
				<div class="order-list">
					{#each returnableOrders as order}
						<div class="order-card">
							<div class="order-card-left">
								{#if order.image}
									<img src={order.image} alt={order.name} class="order-thumb" />
								{/if}
								<div class="order-details">
									<h3 class="order-name">{order.name}</h3>
									<div class="order-meta">
										<span class="meta-item">#{order.order_code}</span>
										<span class="meta-sep">|</span>
										<span class="meta-item">{new Date(order.order_date).toLocaleDateString()}</span>
										<span class="meta-sep">|</span>
										<span class="meta-item">Qty: {order.quantity}</span>
									</div>
									<div class="order-price">Rs. {order.subtotal.toFixed(2)}</div>
								</div>
							</div>
							<div class="order-card-right">
								<span class="status-badge status-delivered">Delivered</span>
								<button class="btn-action btn-return" onclick={() => openReturnModal(order)}>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="16" height="16">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>
									</svg>
									Request Return
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<div class="empty-icon">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<p>No delivered orders available for return</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Cancellation Section -->
	{#if activeTab === 'cancel'}
		<div class="card">
			<div class="card-header">
				<h2>Cancellable Orders</h2>
				<span class="subtitle">Pending or processing orders that can be cancelled</span>
			</div>

			{#if cancellableOrders.length > 0}
				<div class="order-list">
					{#each cancellableOrders as order}
						<div class="order-card">
							<div class="order-card-left">
								{#if order.image}
									<img src={order.image} alt={order.name} class="order-thumb" />
								{/if}
								<div class="order-details">
									<h3 class="order-name">{order.name}</h3>
									<div class="order-meta">
										<span class="meta-item">#{order.order_code}</span>
										<span class="meta-sep">|</span>
										<span class="meta-item">{new Date(order.order_date).toLocaleDateString()}</span>
										<span class="meta-sep">|</span>
										<span class="meta-item">Qty: {order.quantity}</span>
									</div>
									<div class="order-price">Rs. {order.subtotal.toFixed(2)}</div>
								</div>
							</div>
							<div class="order-card-right">
								<span class="status-badge {getStatusClass(order.order_status)}">
									{order.order_status}
								</span>
								<button class="btn-action btn-cancel" onclick={() => openCancelModal(order)}>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="16" height="16">
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
									</svg>
									Cancel Order
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<div class="empty-icon">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<p>No orders available for cancellation</p>
				</div>
			{/if}
		</div>
	{/if}
{/if}

<!-- Return Modal -->
{#if showReturnModal && selectedOrder}
	<div class="modal-overlay" onclick={closeReturnModal} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && closeReturnModal()}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<div>
					<h3>Return Request</h3>
					<p class="modal-subtitle">Order #{selectedOrder.order_code}</p>
				</div>
				<button class="modal-close" onclick={closeReturnModal} aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="20" height="20">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				<div class="modal-order-info">
					{#if selectedOrder.image}
						<img src={selectedOrder.image} alt={selectedOrder.name} class="modal-thumb" />
					{/if}
					<div>
						<strong>{selectedOrder.name}</strong>
						<p>Qty: {selectedOrder.quantity} | Rs. {selectedOrder.price.toFixed(2)}</p>
					</div>
				</div>

				<div class="form-group">
					<label for="return-qty">Return Quantity</label>
					<input
						type="number"
						id="return-qty"
						min="1"
						max={selectedOrder.quantity}
						bind:value={returnQuantity}
					/>
				</div>

				<div class="form-group">
					<label for="return-reason">Reason for Return *</label>
					<select id="return-reason" bind:value={returnReason} required>
						<option value="">Select a reason...</option>
						<option value="defective">Product is Defective</option>
						<option value="damaged">Arrived Damaged</option>
						<option value="not_as_described">Not as Described</option>
						<option value="size_fit">Incorrect Size/Fit</option>
						<option value="color_different">Color Different</option>
						<option value="unwanted">Changed Mind</option>
						<option value="other">Other</option>
					</select>
				</div>

				<div class="form-group">
					<label for="return-desc">Additional Details</label>
					<textarea
						id="return-desc"
						bind:value={returnDescription}
						placeholder="Provide more details about the return (optional)"
						rows="3"
					></textarea>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn-secondary" onclick={closeReturnModal} disabled={isSubmitting}>Cancel</button>
				<button class="btn-primary" onclick={submitReturnRequest} disabled={isSubmitting}>
					{isSubmitting ? 'Submitting...' : 'Submit Return'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Cancel Modal -->
{#if showCancelModal && selectedOrder}
	<div class="modal-overlay" onclick={closeCancelModal} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && closeCancelModal()}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<div>
					<h3>Cancel Order</h3>
					<p class="modal-subtitle">Order #{selectedOrder.order_code}</p>
				</div>
				<button class="modal-close" onclick={closeCancelModal} aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="20" height="20">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				<div class="modal-order-info">
					{#if selectedOrder.image}
						<img src={selectedOrder.image} alt={selectedOrder.name} class="modal-thumb" />
					{/if}
					<div>
						<strong>{selectedOrder.name}</strong>
						<p>Qty: {selectedOrder.quantity} | Rs. {selectedOrder.subtotal.toFixed(2)}</p>
					</div>
				</div>

				<div class="warning-box">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" width="18" height="18">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
					</svg>
					<span>This action cannot be undone once the order is shipped.</span>
				</div>

				<div class="form-group">
					<label for="cancel-reason">Reason for Cancellation *</label>
					<select id="cancel-reason" bind:value={cancelReason} required>
						<option value="">Select a reason...</option>
						<option value="changed_mind">Changed My Mind</option>
						<option value="found_cheaper">Found Cheaper Alternative</option>
						<option value="duplicate_order">Duplicate Order</option>
						<option value="dont_want">Don't Want It Anymore</option>
						<option value="other">Other</option>
					</select>
				</div>

				<div class="form-group">
					<label for="cancel-desc">Additional Comments</label>
					<textarea
						id="cancel-desc"
						bind:value={cancelDescription}
						placeholder="Tell us why you want to cancel (optional)"
						rows="3"
					></textarea>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn-secondary" onclick={closeCancelModal} disabled={isSubmitting}>Keep Order</button>
				<button class="btn-danger" onclick={submitCancelRequest} disabled={isSubmitting}>
					{isSubmitting ? 'Processing...' : 'Confirm Cancellation'}
				</button>
			</div>
		</div>
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

	/* ===== Tabs ===== */
	.tab-switcher {
		display: flex;
		gap: 8px;
		margin-bottom: 24px;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
		background: #ffffff;
		color: #6b7280;
		font-size: 13.5px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.tab-btn:hover {
		border-color: #0b5d1e;
		color: #0b5d1e;
	}

	.tab-btn.active {
		background: #0b5d1e;
		color: #ffffff;
		border-color: #0b5d1e;
	}

	.tab-count {
		background: rgba(0, 0, 0, 0.08);
		padding: 1px 8px;
		border-radius: 10px;
		font-size: 11px;
		font-weight: 600;
	}

	.tab-btn.active .tab-count {
		background: rgba(255, 255, 255, 0.2);
	}

	/* ===== Card ===== */
	.card {
		background: #ffffff;
		border-radius: 14px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 12px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.04);
		overflow: hidden;
	}

	.card-header {
		padding: 20px 24px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	.card-header h2 {
		font-size: 16px;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.subtitle {
		font-size: 13px;
		color: #6b7280;
		margin-top: 4px;
		display: block;
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

	@keyframes spin { to { transform: rotate(360deg); } }

	/* ===== Order List ===== */
	.order-list {
		padding: 8px;
	}

	.order-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		border-radius: 12px;
		transition: background 0.2s;
		gap: 16px;
	}

	.order-card:hover {
		background: #f9fafb;
	}

	.order-card-left {
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
		flex: 1;
	}

	.order-thumb {
		width: 52px;
		height: 52px;
		border-radius: 10px;
		object-fit: cover;
		border: 1px solid rgba(0, 0, 0, 0.06);
		flex-shrink: 0;
	}

	.order-details {
		min-width: 0;
	}

	.order-name {
		font-size: 14px;
		font-weight: 600;
		color: #111827;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.order-meta {
		display: flex;
		gap: 6px;
		margin-top: 4px;
		flex-wrap: wrap;
	}

	.meta-item {
		font-size: 12px;
		color: #6b7280;
	}

	.meta-sep {
		font-size: 12px;
		color: #d1d5db;
	}

	.order-price {
		font-size: 13px;
		font-weight: 600;
		color: #111827;
		margin-top: 4px;
	}

	.order-card-right {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
	}

	/* ===== Status Badge ===== */
	.status-badge {
		display: inline-flex;
		padding: 4px 10px;
		border-radius: 20px;
		font-size: 11.5px;
		font-weight: 600;
		text-transform: capitalize;
		white-space: nowrap;
	}

	.status-delivered { background: rgba(16, 185, 129, 0.1); color: #059669; }
	.status-processing { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
	.status-cancelled { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
	.status-pending { background: rgba(245, 158, 11, 0.1); color: #d97706; }

	/* ===== Action Buttons ===== */
	.btn-action {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 8px;
		border: none;
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
		white-space: nowrap;
	}

	.btn-return {
		background: rgba(245, 158, 11, 0.1);
		color: #d97706;
	}

	.btn-return:hover {
		background: rgba(245, 158, 11, 0.2);
	}

	.btn-cancel {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}

	.btn-cancel:hover {
		background: rgba(239, 68, 68, 0.2);
	}

	/* ===== Empty State ===== */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px 20px;
		color: #6b7280;
	}

	.empty-icon {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: #f3f4f6;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 12px;
	}

	.empty-icon svg {
		width: 28px;
		height: 28px;
		color: #9ca3af;
	}

	.empty-state p {
		font-size: 14px;
		margin: 0;
	}

	/* ===== Modal ===== */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.modal {
		background: #ffffff;
		border-radius: 16px;
		width: 100%;
		max-width: 480px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 24px 24px 0;
	}

	.modal-header h3 {
		font-size: 18px;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.modal-subtitle {
		font-size: 13px;
		color: #6b7280;
		margin: 4px 0 0;
	}

	.modal-close {
		background: none;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 4px;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.modal-close:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.modal-body {
		padding: 20px 24px;
	}

	.modal-order-info {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: #f9fafb;
		border-radius: 10px;
		margin-bottom: 20px;
	}

	.modal-thumb {
		width: 44px;
		height: 44px;
		border-radius: 8px;
		object-fit: cover;
	}

	.modal-order-info strong {
		font-size: 13.5px;
		color: #111827;
	}

	.modal-order-info p {
		font-size: 12px;
		color: #6b7280;
		margin: 2px 0 0;
	}

	.warning-box {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		background: rgba(245, 158, 11, 0.08);
		border: 1px solid rgba(245, 158, 11, 0.2);
		border-radius: 10px;
		margin-bottom: 20px;
		font-size: 12.5px;
		color: #92400e;
	}

	.form-group {
		margin-bottom: 16px;
	}

	.form-group label {
		display: block;
		font-size: 13px;
		font-weight: 600;
		color: #374151;
		margin-bottom: 6px;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 10px 14px;
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		font-size: 13.5px;
		color: #111827;
		background: #ffffff;
		transition: border-color 0.2s;
		font-family: inherit;
		box-sizing: border-box;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #0b5d1e;
		box-shadow: 0 0 0 3px rgba(11, 93, 30, 0.1);
	}

	.form-group textarea {
		resize: vertical;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		padding: 0 24px 24px;
	}

	.btn-secondary {
		padding: 10px 20px;
		border-radius: 10px;
		border: 1px solid #e5e7eb;
		background: #ffffff;
		color: #374151;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.btn-secondary:hover {
		background: #f9fafb;
	}

	.btn-primary {
		padding: 10px 20px;
		border-radius: 10px;
		border: none;
		background: #0b5d1e;
		color: #ffffff;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.btn-primary:hover {
		background: #16a34a;
	}

	.btn-primary:disabled,
	.btn-secondary:disabled,
	.btn-danger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-danger {
		padding: 10px 20px;
		border-radius: 10px;
		border: none;
		background: #dc2626;
		color: #ffffff;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.btn-danger:hover {
		background: #ef4444;
	}

	@media (max-width: 640px) {
		.page-header h1 { font-size: 20px; }

		.tab-switcher {
			flex-direction: column;
		}

		.order-card {
			flex-direction: column;
			align-items: flex-start;
		}

		.order-card-right {
			width: 100%;
			justify-content: space-between;
			margin-top: 8px;
		}

		.modal {
			max-width: 100%;
			margin: 10px;
		}
	}
</style>
