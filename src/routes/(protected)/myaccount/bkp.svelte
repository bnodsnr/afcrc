<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import Footer from '$lib/components/Footer.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import { isLoggedIn, user } from '$lib/stores/auth';
	import { createApi } from '$lib/api';
	import { toastStore } from '$lib/stores/toast';

	interface Address {
		id?: number;
		address_type: 'shipping' | 'billing';
		full_name?: string;
		phone?: string;
		email?: string;
		address_line1?: string;
		address_line2?: string;
		city?: string;
		state?: string;
		postal_code?: string;
		country?: string;
		is_default?: boolean;
	}

	interface billingAddress {
		id?: number;
		address_type: 'shipping' | 'billing';
		full_name?: string;
		phone?: string;
		email?: string;
		address_line1?: string;
		address_line2?: string;
		city?: string;
		state?: string;
		postal_code?: string;
		country?: string;
		is_default?: boolean;
	}
	interface Profile {
		id?: number;
		user_email?: string;
		user_name?: string;
		phone_number?: string;
		date_of_birth?: string;
		gender?: string;
		avatar?: string;
	}

	interface Order {
		id: string;
		order_code?: string;
		date: string;
		status: string;
		total: number;
		items: { name: string; quantity: number; price: number; image: string }[];
	}

	interface Summary {
		total_orders: string;
		total_spent: string;
		cancelled_orders: string;
		delivered_orders: string;
		average_order_value: string;
		recent_orders: Order[];
	}

	interface OrderHistory {
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

	interface ReturnRequest {
		order_code: string;
		reason: string;
		description: string;
		quantity?: number;
	}

	interface CancelRequest {
		order_code: string;
		reason: string;
		description: string;
	}
	let userProfile: Profile | null = $state(null);
	let addresses: Address[] = $state([]);
	let shippingAddresses: Address[] = $state([]);
	let billingAddresses: billingAddress[] = $state([]);
	let isLoading = $state(true);
	let activeTab = $state('dashboard');
	let isEditing = $state(false);
	let isSubmitting = $state(false);
	let submitMessage: { type: 'success' | 'error'; text: string } | null = $state(null);

	// Dashboard stats
	let totalOrders = $state(0);
	let totalSpent = $state(0);
	let cancelledOrders = $state(0);
	let recentOrders: Order[] = $state([]);
	let summary: Summary | null = $state(null);
	let orderHistory: OrderHistory[] = $state([]);

	// Return & Cancel Order States
	let showReturnModal = $state(false);
	let showCancelModal = $state(false);
	let selectedOrder: OrderHistory | null = $state(null);
	let returnReason = $state('');
	let returnDescription = $state('');
	let returnQuantity = $state(1);
	let cancelReason = $state('');
	let cancelDescription = $state('');
	let isProcessing = $state(false);

	onMount(async () => {
		if ($isLoggedIn) {
			const api = createApi(fetch);
			await Promise.all([fetchProfile(api), fetchTotalOrders(api), fetchAddresses(api)]);
			fetchTotalSpent(api);
			fetchRecentOrders(api);
			fetchOrderSummary(api);
			fetchOrderHistory(api);
			fetchAddresses(api);
			fetchBillingAddress(api);
			fetchShippingAddress(api);
		}
		isLoading = false;
	});

	function getStatusColor(status: string): string {
		switch (status.toLowerCase()) {
			case 'delivered':
				return 'delivered';
			case 'processing':
				return 'processing';
			case 'cancelled':
				return 'cancelled';
			default:
				return 'pending';
		}
	}

	async function fetchProfile(api: ReturnType<typeof createApi>) {
		try {
			const data = await api.profile.getProfile();
			if (data) {
				const userData = data.user;
				if (userData?.profile) {
					userProfile = userData.profile;
				} else if (data.profile) {
					userProfile = data.profile;
				}
			}
		} catch (error) {
			console.error('Failed to fetch profile:', error);
		}
	}

	async function fetchTotalOrders(api: ReturnType<typeof createApi>) {
		try {
			const data = await api.profile.gettotalorders();
			if (data && data.total_orders !== undefined) {
				totalOrders = data.total_orders;
			}
		} catch (error) {
			console.error('Failed to fetch total orders:', error);
		}
	}

	async function fetchTotalSpent(api: ReturnType<typeof createApi>) {
		try {
			const data = await api.profile.gettotalspent();
			if (data && data.total_spent !== undefined) {
				totalSpent = data.total_spent;
			}
		} catch (error) {
			console.error('Failed to fetch total spent:', error);
		}
	}

	async function fetchRecentOrders(api: ReturnType<typeof createApi>) {
		try {
			const data = await api.profile.getrecentorders();
			if (data && data) {
				recentOrders = data.map((order: any) => ({
					id: order.id,
					order_code: order.order_code || `ORD-${order.id}`,
					date: order.created_at || order.date,
					status: order.status,
					total: order.total,
					items: order.items || []
				}));
			}
		} catch (error) {
			console.error('Failed to fetch recent orders:', error);
		}
	}

	async function fetchOrderSummary(api: ReturnType<typeof createApi>) {
		try {
			const data = await api.profile.getordersummary();
			if (data && data.statistics) {
				totalOrders = parseInt(data.statistics.total_orders, 10);
				totalSpent = parseFloat(data.statistics.total_spent);
				cancelledOrders = parseInt(data.statistics.cancelled_orders, 10);
				recentOrders = data.statistics.recent_orders.map((order: any) => ({
					id: order.id,
					order_code: order.order_code || `ORD-${order.id}`,
					date: order.created_at || order.date,
					status: order.status,
					total: order.total,
					items: order.items || []
				}));
			}
		} catch (error) {
			console.error('Failed to fetch order summary:', error);
		}
	}

	async function fetchOrderHistory(api: ReturnType<typeof createApi>) {
		try {
			const data = await api.profile.getorderhistory();
			if (data && data.items && Array.isArray(data.items)) {
				orderHistory = data.items.map((item: any) => ({
					id: item.id,
					name: item.name,
					quantity: item.quantity,
					price: item.price,
					image: item.image,
					size: item.size,
					color: item.color,
					subtotal: item.subtotal,
					discount: item.discount,
					order_code: item.order_code,
					order_date: item.order_date,
					order_status: item.order_status
				}));
				console.log('Fetched order history:', orderHistory);
			}
		} catch (error) {
			console.error('Failed to fetch order history:', error);
		}
	}

	async function fetchAddresses(api: ReturnType<typeof createApi>) {
		try {
			const data = await api.addresses.getBillingAddresses();
			// if (data) {
			// 	billingAddresses = data;
			// }
		} catch (error) {
			console.error('Failed to fetch addresses:', error);
		}
	}

	async function fetchBillingAddress(api: ReturnType<typeof createApi>) {
		try {
			const data = await api.addresses.getBillingAddresses();
			if (data) {
				billingAddresses = data;
			}
		} catch (error) {
			console.error('Failed to fetch billing address:', error);
		}
		return null;
	}

	async function fetchShippingAddress(api: ReturnType<typeof createApi>) {
		try {
			const data = await api.addresses.getShippingAddresses();
			if (data) {
				shippingAddresses = data;
			}
		} catch (error) {
			console.error('Failed to fetch shipping address:', error);
		}
		return null;
	}

	// Return & Cancel Order Functions
	function openReturnModal(order: OrderHistory) {
		selectedOrder = order;
		returnReason = '';
		returnDescription = '';
		returnQuantity = order.quantity;
		showReturnModal = true;
	}

	function closeReturnModal() {
		showReturnModal = false;
		selectedOrder = null;
		returnReason = '';
		returnDescription = '';
	}

	function openCancelModal(order: OrderHistory) {
		selectedOrder = order;
		cancelReason = '';
		cancelDescription = '';
		showCancelModal = true;
	}

	function closeCancelModal() {
		showCancelModal = false;
		selectedOrder = null;
		cancelReason = '';
		cancelDescription = '';
	}

	async function submitReturnRequest() {
		if (!selectedOrder || !returnReason.trim()) {
			toastStore.error('Please select a reason for return');
			return;
		}

		isProcessing = true;
		try {
			const api = createApi(fetch);
			const returnRequest: ReturnRequest = {
				order_code: selectedOrder.order_code,
				reason: returnReason,
				description: returnDescription,
				quantity: returnQuantity
			};

			// Call API to submit return request
			const response = await api.orders.submitReturnRequest(returnRequest);

			if (response?.success || response?.id) {
				toastStore.success('Return request submitted successfully');
				closeReturnModal();
				setTimeout(() => location.reload(), 500);
			} else {
				toastStore.error(response?.message || 'Failed to submit return request');
			}
		} catch (error) {
			console.error('Error submitting return request:', error);
			toastStore.error('Error submitting return request. Please try again.');
		} finally {
			isProcessing = false;
		}
	}

	async function submitCancelRequest() {
		if (!selectedOrder || !cancelReason.trim()) {
			toastStore.error('Please select a reason for cancellation');
			return;
		}

		isProcessing = true;
		try {
			const api = createApi(fetch);
			const cancelRequest: CancelRequest = {
				order_code: selectedOrder.order_code,
				reason: cancelReason,
				description: cancelDescription
			};

			// Call API to submit cancel request
			const response = await api.orders.submitCancelRequest(cancelRequest);

			if (response?.success || response?.id) {
				toastStore.success('Order cancellation request submitted successfully');
				closeCancelModal();
				setTimeout(() => location.reload(), 500);
			} else {
				toastStore.error(response?.message || 'Failed to submit cancellation request');
			}
		} catch (error) {
			console.error('Error submitting cancel request:', error);
			toastStore.error('Error submitting cancellation request. Please try again.');
		} finally {
			isProcessing = false;
		}
	}

	let showShippingForm = $state(false);
	let showBillingForm = $state(false);
	let isShippingExpanded = $state(true);
	let editingAddressId: number | null = $state(null);
	let isSavingAddress = $state(false);
	let addressFormErrors: Record<string, string> = $state({});

	function getEmptyAddressForm(type: 'shipping' | 'billing') {
		return {
			address_type: type,
			full_name: '',
			phone: '',
			email: '',
			address_line1: '',
			address_line2: '',
			city: '',
			state: '',
			postal_code: '',
			country: 'Nepal',
			is_default: false
		};
	}

	let shippingForm = $state<Omit<Address, 'id'>>(getEmptyAddressForm('shipping'));
	let billingForm = $state<Omit<Address, 'id'>>(getEmptyAddressForm('billing'));
	let shippingFormRef: HTMLFormElement;

	function openShippingForm(address?: Address) {
		if (address) {
			editingAddressId = address.id ?? null;
			shippingForm = { ...address };
		} else {
			editingAddressId = null;
			shippingForm = getEmptyAddressForm('shipping');
		}
		addressFormErrors = {};
		showShippingForm = true;
	}

	function openBillingForm(address?: Address) {
		if (address) {
			editingAddressId = address.id ?? null;
			billingForm = { ...address };
		} else {
			editingAddressId = null;
			billingForm = getEmptyAddressForm('billing');
		}
		addressFormErrors = {};
		showBillingForm = true;
	}

	function cancelShippingForm() {
		showShippingForm = false;
		editingAddressId = null;
		shippingForm = getEmptyAddressForm('shipping');
		addressFormErrors = {};
	}

	function cancelBillingForm() {
		showBillingForm = false;
		editingAddressId = null;
		billingForm = getEmptyAddressForm('billing');
		addressFormErrors = {};
	}

	function validateAddressForm(form: typeof shippingForm): boolean {
		addressFormErrors = {};
		if (!(form.full_name || '').trim()) addressFormErrors.full_name = 'Full name is required';
		if (!(form.phone || '').trim()) addressFormErrors.phone = 'Phone number is required';
		if (!(form.address_line1 || '').trim()) addressFormErrors.address_line1 = 'Address is required';
		if (!(form.city || '').trim()) addressFormErrors.city = 'City is required';
		if (!(form.postal_code || '').trim()) addressFormErrors.postal_code = 'Postal code is required';
		return Object.keys(addressFormErrors).length === 0;
	}
	async function handleShippingFormSubmit() {
		if (!validateAddressForm(shippingForm)) return false;
		return true;
	}

	async function handleBillingFormSubmit() {
		if (!validateAddressForm(billingForm)) return false;
		return true;
	}
</script>

<Topbar />
<main class="my-account-page">
	<div class="container">
		<div class="account-wrapper">
			<!-- Sidebar Navigation -->
			<aside class="sidebar">
				<!-- Profile Section -->
				<div class="profile-section">
					<div class="profile-avatar">
						<span class="avatar-placeholder">
							{userProfile?.user_name?.charAt(0).toUpperCase() || 'U'}
						</span>
					</div>
					<div class="profile-info">
						<h3 class="profile-name">{userProfile?.user_name || 'User'}</h3>
						<p class="profile-email">{userProfile?.user_email || 'email@example.com'}</p>
					</div>
				</div>

				<!-- Navigation Menu -->
				<nav class="sidebar-nav">
					<button
						class="nav-item {activeTab === 'dashboard' ? 'active' : ''}"
						onclick={() => (activeTab = 'dashboard')}
					>
						<svg
							class="nav-icon"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4-2h2v20h-2zm4 4h2v16h-2z" />
						</svg>
						<span>Dashboard</span>
					</button>
					<button
						class="nav-item {activeTab === 'account' ? 'active' : ''}"
						onclick={() => (activeTab = 'account')}
					>
						<svg
							class="nav-icon"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
							/>
						</svg>
						<span>Account Information</span>
					</button>
					<button
						class="nav-item {activeTab === 'orders' ? 'active' : ''}"
						onclick={() => (activeTab = 'orders')}
					>
						<svg
							class="nav-icon"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
							/>
						</svg>
						<span>Order History</span>
					</button>
					<button
						class="nav-item {activeTab === 'addresses' ? 'active' : ''}"
						onclick={() => (activeTab = 'addresses')}
					>
						<svg
							class="nav-icon"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S15.33 8 14.5 8 13 8.67 13 9.5s.67 1.5 1.5 1.5z"
							/>
						</svg>
						<span>Address Book</span>
					</button>
					<button
						class="nav-item {activeTab === 'settings' ? 'active' : ''}"
						onclick={() => (activeTab = 'settings')}
					>
						<svg
							class="nav-icon"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.62l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.48.1.62l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.62l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.48-.1-.62l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
							/>
						</svg>
						<span>Return & Cancellation</span>
					</button>
				</nav>
			</aside>

			<!-- Main Content -->
			<div class="main-content">
				<div class="page-header">
					<h1 class="page-title">My Account</h1>
					<p class="page-subtitle">Welcome back, {userProfile?.user_name || 'Customer'}!</p>
				</div>

				<!-- Dashboard Tab -->
				{#if activeTab === 'dashboard'}
					<div class="dashboard-content" transition:fade>
						<!-- Stats Widgets -->
						<div class="stats-grid">
							<div class="stat-widget">
								<div class="stat-header">
									<span class="stat-icon orders">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
											<path
												d="M3 2.25A2.25 2.25 0 015.25 0h13.5A2.25 2.25 0 0121 2.25v19.5A2.25 2.25 0 0118.75 24H5.25A2.25 2.25 0 013 21.75V2.25z"
											/>
										</svg>
									</span>
									<span class="stat-label">Total Orders</span>
								</div>
								<div class="stat-value">{totalOrders}</div>
								<p class="stat-description">Lifetime orders</p>
							</div>

							<div class="stat-widget">
								<div class="stat-header">
									<span class="stat-icon spent">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
											<path
												d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"
											/>
										</svg>
									</span>
									<span class="stat-label">Total Spent</span>
								</div>
								<div class="stat-value">Rs.{totalSpent.toFixed(2)}</div>
								<p class="stat-description">On completed orders</p>
							</div>

							<div class="stat-widget">
								<div class="stat-header">
									<span class="stat-icon cancelled">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
											<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
										</svg>
									</span>
									<span class="stat-label">Cancelled Orders</span>
								</div>
								<div class="stat-value">{cancelledOrders}</div>
								<p class="stat-description">Orders cancelled</p>
							</div>

							<div class="stat-widget">
								<div class="stat-header">
									<span class="stat-icon addresses">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
											<path
												d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S15.33 8 14.5 8 13 8.67 13 9.5s.67 1.5 1.5 1.5z"
											/>
										</svg>
									</span>
									<span class="stat-label">Saved Addresses</span>
								</div>
								<div class="stat-value">{addresses.length}</div>
								<p class="stat-description">
									{shippingAddresses.length} shipping, {billingAddresses.length} billing
								</p>
							</div>
						</div>

						<!-- Recent Orders Table -->
						<div class="card" transition:fade>
							<div class="card-header">
								<h2>Recent Orders</h2>
								<button class="button text-link" onclick={() => (activeTab = 'orders')}>
									View All Orders →
								</button>
							</div>

							{#if recentOrders.length > 0}
								<div class="table-wrapper">
									<table class="orders-table">
										<thead>
											<tr>
												<th>Date</th>
												<th>Items</th>
												<th>Status</th>
												<th>Total</th>
												<!-- <th>Action</th> -->
											</tr>
										</thead>
										<tbody>
											{#each recentOrders as order}
												<tr>
													<!-- <td class="order-id">{order.order_code}</td> -->
													<td class="order-date">{new Date(order.date).toLocaleDateString()}</td>
													<td class="order-items-count"
														>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td
													>
													<td>
														<span class="status-badge {getStatusColor(order.status)}">
															{order.status}
														</span>
													</td>
													<td class="order-amount">Rs. {order.total.toFixed(2)}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{:else}
								<div class="empty-state">
									<p>No orders yet. Start shopping!</p>
								</div>
							{/if}
						</div>

						<!-- Quick Actions -->
						<div class="quick-actions">
							<button class="action-card" onclick={() => (activeTab = 'addresses')}>
								<span class="action-icon">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S15.33 8 14.5 8 13 8.67 13 9.5s.67 1.5 1.5 1.5z"
										/>
									</svg>
								</span>
								<span class="action-text">Manage Addresses</span>
							</button>
							<button class="action-card" onclick={() => (activeTab = 'account')}>
								<span class="action-icon">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
										/>
									</svg>
								</span>
								<span class="action-text">Edit Profile</span>
							</button>
							<button class="action-card" onclick={() => (activeTab = 'settings')}>
								<span class="action-icon">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.62l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.48.1.62l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.62l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.48-.1-.62l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
										/>
									</svg>
								</span>
								<span class="action-text">Settings</span>
							</button>
						</div>
					</div>
				{/if}

				<!-- Account Details Tab -->
				{#if activeTab === 'account'}
					<div class="card" transition:fade>
						<div class="card-header">
							<h2>Account Details</h2>
							<div class="card-actions">
								<button class="button secondary" onclick={() => (activeTab = 'addresses')}
									>Manage Addresses</button
								>
								{#if isEditing}
									<button
										type="submit"
										form="profileForm"
										class="button primary"
										disabled={isSubmitting}
									>
										{isSubmitting ? 'Saving...' : 'Save Changes'}
									</button>
									<button
										type="button"
										class="button secondary"
										onclick={() => (isEditing = false)}
									>
										Cancel
									</button>
								{:else}
									<button type="button" class="button primary" onclick={() => (isEditing = true)}>
										Edit Profile
									</button>
								{/if}
							</div>
						</div>
						{#if submitMessage}
							<div class="message {submitMessage.type}">
								{submitMessage.text}
							</div>
						{/if}

						{#if isLoading}
							<p>Loading profile...</p>
						{:else if userProfile}
							<form
								id="profileForm"
								method="POST"
								action="?/updateProfile"
								use:enhance={() => {
									isSubmitting = true;
									return async ({ result }) => {
										isSubmitting = false;
										if (result.type === 'success') {
											submitMessage = {
												type: 'success',
												text: result.data.message
											};
											isEditing = false;
											// Update userProfile with new data if returned
											if (result.data.data) {
												userProfile = { ...userProfile, ...result.data.data };
											}
										} else if (result.type === 'failure') {
											submitMessage = {
												type: 'error',
												text: result.data.message
											};
										}
										// Clear message after 3 seconds
										setTimeout(() => {
											submitMessage = null;
										}, 3000);
									};
								}}
							>
								<div class="account-panel">
									<div class="left-column">
										<div class="profile-avatar-large">
											{#if userProfile.avatar}
												<img src={userProfile.avatar} alt="avatar" />
											{:else}
												<span class="avatar-initial"
													>{userProfile.user_name?.charAt(0).toUpperCase() || 'U'}</span
												>
											{/if}
										</div>
										<div class="quick-stats">
											<div class="stat">
												<span class="stat-value">{totalOrders}</span>
												<span class="stat-label">Orders</span>
											</div>
											<div class="stat">
												<span class="stat-value">Rs.{totalSpent.toFixed(2)}</span>
												<span class="stat-label">Spent</span>
											</div>
										</div>
									</div>
									<div class="right-column">
										{#if isEditing}
											<div class="form-grid">
												<div class="form-field">
													<label for="name">Full Name</label>
													<input
														type="text"
														id="name"
														name="user_name"
														bind:value={userProfile.user_name}
													/>
												</div>
												<div class="form-field">
													<label for="dob">Date of Birth</label>
													<input
														type="date"
														id="dob"
														name="date_of_birth"
														bind:value={userProfile.date_of_birth}
													/>
												</div>
												<div class="form-field">
													<label for="gender">Gender</label>
													<select id="gender" name="gender" bind:value={userProfile.gender}>
														<option value="">Select...</option>
														<option value="male">Male</option>
														<option value="female">Female</option>
														<option value="other">Other</option>
														<option value="prefer_not_to_say">Prefer not to say</option>
													</select>
												</div>
											</div>
										{:else}
											<div class="account-info">
												<div class="info-field">
													<span class="label">Full Name</span>
													<span class="value">{userProfile.user_name || 'Not set'}</span>
												</div>
												<div class="info-field">
													<span class="label">Email</span>
													<span class="value">{userProfile.user_email}</span>
												</div>

												<div class="info-field">
													<span class="label">Phone No.</span>
													<span class="value">{userProfile.phone_number || 'Not set'}</span>
												</div>

												<div class="info-field">
													<span class="label">Date of Birth</span>
													<span class="value">{userProfile.date_of_birth || 'Not set'}</span>
												</div>
												<div class="info-field">
													<span class="label">Gender</span>
													<span class="value">{userProfile.gender || 'Not set'}</span>
												</div>
												<div class="actions-row">
													<button class="button secondary" onclick={() => (activeTab = 'orders')}
														>View Orders</button
													>
													<button class="button text">Change Password</button>
												</div>
											</div>
										{/if}
									</div>
								</div>
							</form>
						{:else}
							<p>Unable to load profile. Please try again later.</p>
						{/if}
					</div>
				{/if}

				<!-- Orders Tab -->
				{#if activeTab === 'orders'}
					<div class="card" transition:fade>
						<h2>Order History</h2>
						{#if orderHistory.length > 0}
							<div class="table-wrapper">
								<table class="orders-table">
									<thead>
										<tr>
											<th>#</th>
											<th>Order Code</th>
											<th>Date</th>
											<th>Item Name</th>
											<th>Quantity</th>
											<th>Price</th>
											<th>Image</th>
											<th>Status</th>
											<th>Subtotal</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{#each orderHistory as item, index}
											<tr>
												<td class="serial-number">{index + 1}</td>
												<td class="order-code-cell">{item.order_code}</td>
												<td class="order-date">{new Date(item.order_date).toLocaleDateString()}</td>
												<td class="item-name">{item.name}</td>
												<td class="item-qty">{item.quantity}</td>
												<td class="item-price">Rs.{item.price.toFixed(2)}</td>
												<td class="item-image-cell">
													<img src={item.image} alt={item.name} class="item-image" />
												</td>
												<td>
													<span class="status-badge {getStatusColor(item.order_status)}">
														{item.order_status}
													</span>
												</td>
												<td class="item-subtotal">Rs.{item.subtotal.toFixed(2)}</td>
												<td class="actions-cell">
													<div class="action-buttons">
														{#if item.order_status.toLowerCase() === 'delivered'}
															<button
																class="btn-action btn-return"
																onclick={() => openReturnModal(item)}
																title="Return Order"
																aria-label="Return Order"
															>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke-width="1.5"
																	stroke="currentColor"
																	width="16"
																	height="16"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
																	/>
																</svg>
																Return
															</button>
														{:else if item.order_status.toLowerCase() !== 'cancelled'}
															<button
																class="btn-action btn-cancel"
																onclick={() => openCancelModal(item)}
																title="Cancel Order"
																aria-label="Cancel Order"
															>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke-width="1.5"
																	stroke="currentColor"
																	width="16"
																	height="16"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
																	/>
																</svg>
																Cancel
															</button>
														{/if}
													</div>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<div class="empty-state">
								<p>No orders yet. Start shopping!</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Return Order Modal -->
				{#if showReturnModal && selectedOrder}
					<div class="modal-overlay" onclick={closeReturnModal}>
						<div class="modal-content return-modal" onclick={(e) => e.stopPropagation()}>
							<div class="modal-header">
								<h3>Return Order</h3>
								<button class="modal-close" onclick={closeReturnModal}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										width="20"
										height="20"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>

							<div class="modal-body">
								<div class="return-item-info">
									<img
										src={selectedOrder.image}
										alt={selectedOrder.name}
										class="return-item-image"
									/>
									<div class="return-item-details">
										<h4>{selectedOrder.name}</h4>
										<p>Order Code: <strong>{selectedOrder.order_code}</strong></p>
										<p>Quantity: <strong>{selectedOrder.quantity}</strong></p>
										<p>Price: <strong>Rs.{selectedOrder.price.toFixed(2)}</strong></p>
									</div>
								</div>

								<form class="return-form">
									<div class="form-group">
										<label for="return-quantity">Return Quantity</label>
										<input
											type="number"
											id="return-quantity"
											min="1"
											max={selectedOrder.quantity}
											bind:value={returnQuantity}
										/>
									</div>

									<div class="form-group">
										<label for="return-reason">Return Reason *</label>
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
										<label for="return-description">Additional Details</label>
										<textarea
											id="return-description"
											bind:value={returnDescription}
											placeholder="Provide more details about the return (optional)"
											rows="4"
										></textarea>
									</div>
								</form>
							</div>

							<div class="modal-footer">
								<button class="btn-secondary" onclick={closeReturnModal} disabled={isProcessing}>
									Close
								</button>
								<button
									class="btn-primary btn-return-submit"
									onclick={submitReturnRequest}
									disabled={isProcessing}
								>
									{isProcessing ? 'Processing...' : 'Submit Return Request'}
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Cancel Order Modal -->
				{#if showCancelModal && selectedOrder}
					<div class="modal-overlay" onclick={closeCancelModal}>
						<div class="modal-content cancel-modal" onclick={(e) => e.stopPropagation()}>
							<div class="modal-header">
								<h3>Cancel Order</h3>
								<button class="modal-close" onclick={closeCancelModal}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										width="20"
										height="20"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>

							<div class="modal-body">
								<div class="cancel-item-info">
									<img
										src={selectedOrder.image}
										alt={selectedOrder.name}
										class="cancel-item-image"
									/>
									<div class="cancel-item-details">
										<h4>{selectedOrder.name}</h4>
										<p>Order Code: <strong>{selectedOrder.order_code}</strong></p>
										<p>
											Order Date: <strong
												>{new Date(selectedOrder.order_date).toLocaleDateString()}</strong
											>
										</p>
										<p>Total: <strong>Rs.{selectedOrder.subtotal.toFixed(2)}</strong></p>
										<p class="warning-text">
											Note: This action cannot be undone once the order is shipped.
										</p>
									</div>
								</div>

								<form class="cancel-form">
									<div class="form-group">
										<label for="cancel-reason">Cancellation Reason *</label>
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
										<label for="cancel-description">Additional Comments</label>
										<textarea
											id="cancel-description"
											bind:value={cancelDescription}
											placeholder="Tell us why you want to cancel (optional)"
											rows="4"
										></textarea>
									</div>
								</form>
							</div>

							<div class="modal-footer">
								<button class="btn-secondary" onclick={closeCancelModal} disabled={isProcessing}>
									Keep Order
								</button>
								<button
									class="btn-danger btn-cancel-submit"
									onclick={submitCancelRequest}
									disabled={isProcessing}
								>
									{isProcessing ? 'Processing...' : 'Confirm Cancellation'}
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Addresses Tab -->
				{#if activeTab === 'addresses'}
					<div class="card" transition:fade>
						<h2>My Addresses</h2>

						{#if isLoading}
							<p>Loading addresses...</p>
						{:else}
							<div class="address-grid">
								<!-- Shipping Addresses -->
								<div class="address-section-shipping">
									<button
										class="section-header-shipping"
										onclick={() => (isShippingExpanded = !isShippingExpanded)}
										type="button"
									>
										<div class="section-title-group">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="2"
												stroke="currentColor"
												width="18"
												height="18"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
												/>
											</svg>
											<h3>Shipping Details</h3>
										</div>
										<svg
											class="toggle-icon"
											class:rotated={isShippingExpanded}
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="2"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M19.5 8.25l-7.5 7.5-7.5-7.5"
											/>
										</svg>
									</button>

									{#if isShippingExpanded}
										<div class="section-content-shipping" transition:slide>
											{#if shippingAddresses.length > 0}
												{#each shippingAddresses as saddress}
													<div class="shipping-card">
														<div class="shipping-card-header">
															<div class="shipping-info-top">
																<h4 class="shipping-name">
																	{saddress.full_name || 'Shipping Contact'}
																</h4>
																{#if saddress.is_default}
																	<span class="default-badge-shipping">default</span>
																{/if}
															</div>
															<button
																class="button-icon-edit"
																onclick={() => openShippingForm(saddress)}
																aria-label="Edit shipping address"
																title="Edit shipping address"
															>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke-width="2"
																	stroke="currentColor"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
																	/>
																</svg>
															</button>
														</div>

														<div class="shipping-details-grid">
															<div class="shipping-detail-item">
																<span class="detail-icon-shipping location">
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		fill="currentColor"
																		viewBox="0 0 24 24"
																	>
																		<path
																			d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
																		/>
																	</svg>
																</span>
																<div class="detail-content">
																	<span class="detail-label">Address</span>
																	<p class="detail-value">{saddress.address_line1}</p>
																	{#if saddress.address_line2}
																		<p class="detail-value secondary">
																			{saddress.address_line2}
																		</p>
																	{/if}
																	<p class="detail-value secondary">
																		{saddress.city}, {saddress.state}
																		{saddress.postal_code}
																	</p>
																	<p class="detail-value secondary">{saddress.country}</p>
																</div>
															</div>

															<div class="shipping-detail-item">
																<span class="detail-icon-shipping phone">
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		fill="currentColor"
																		viewBox="0 0 24 24"
																	>
																		<path
																			d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
																		/>
																	</svg>
																</span>
																<div class="detail-content">
																	<span class="detail-label">Phone</span>
																	<p class="detail-value">{saddress.phone}</p>
																</div>
															</div>

															{#if saddress.email}
																<div class="shipping-detail-item">
																	<span class="detail-icon-shipping email">
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			fill="currentColor"
																			viewBox="0 0 24 24"
																		>
																			<path
																				d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
																			/>
																		</svg>
																	</span>
																	<div class="detail-content">
																		<span class="detail-label">Email</span>
																		<p class="detail-value">{saddress.email}</p>
																	</div>
																</div>
															{/if}
														</div>
													</div>
												{/each}
											{:else}
												<div class="empty-state-shipping">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														stroke-width="1.5"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
														/>
													</svg>
													<p>No shipping address saved yet.</p>
													<p class="empty-hint">Add your shipping details for faster checkout</p>
												</div>
											{/if}

											{#if showShippingForm}
												<div class="address-form-card" transition:slide>
													<form
														id="profileForm"
														method="POST"
														action="?/updateShippingAddress"
														use:enhance={() => {
															isSubmitting = true;
															return async ({ result }) => {
																isSubmitting = false;
																if (result.type === 'success') {
																	submitMessage = {
																		type: 'success',
																		text:
																			result.data.message || 'Shipping address saved successfully'
																	};
																	isEditing = false;
																	cancelShippingForm();
																	// Show success toast and reload page
																	toastStore.success(
																		result.data.message || 'Shipping address saved successfully'
																	);
																	setTimeout(() => location.reload(), 500);
																} else if (result.type === 'failure') {
																	submitMessage = {
																		type: 'error',
																		text: result.data.message
																	};
																}
																// Clear message after 3 seconds
																setTimeout(() => {
																	submitMessage = null;
																}, 3000);
															};
														}}
													>
														<div class="address-form-header">
															<span class="form-icon">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke-width="1.5"
																	stroke="currentColor"
																	width="18"
																	height="18"
																	><path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
																	/></svg
																>
															</span>
															<h4>{editingAddressId ? 'Edit' : 'New'} Shipping Address</h4>
														</div>

														<div class="addr-form-row cols-3">
															<div class="addr-form-group floating">
																<input
																	type="text"
																	id="ship-name"
																	name="full_name"
																	bind:value={shippingForm.full_name}
																	placeholder=" "
																	class={addressFormErrors.full_name ? 'error' : ''}
																/>
																<label for="ship-name">Full Name <span class="req">*</span></label>
																{#if addressFormErrors.full_name}<span class="field-error"
																		>{addressFormErrors.full_name}</span
																	>{/if}
															</div>
															<div class="addr-form-group floating">
																<input
																	type="tel"
																	id="ship-phone"
																	name="phone"
																	bind:value={shippingForm.phone}
																	placeholder=" "
																	class={addressFormErrors.phone ? 'error' : ''}
																/>
																<label for="ship-phone">Phone <span class="req">*</span></label>
																{#if addressFormErrors.phone}<span class="field-error"
																		>{addressFormErrors.phone}</span
																	>{/if}
															</div>
															<div class="addr-form-group floating">
																<input
																	type="email"
																	id="ship-email"
																	name="email"
																	bind:value={shippingForm.email}
																	placeholder=" "
																/>
																<label for="ship-email">Email</label>
															</div>
														</div>

														<div class="addr-form-row">
															<div class="addr-form-group floating">
																<input
																	type="text"
																	id="ship-addr1"
																	name="address_line1"
																	bind:value={shippingForm.address_line1}
																	placeholder=" "
																	class={addressFormErrors.address_line1 ? 'error' : ''}
																/>
																<label for="ship-addr1"
																	>Address Line 1 <span class="req">*</span></label
																>
																{#if addressFormErrors.address_line1}<span class="field-error"
																		>{addressFormErrors.address_line1}</span
																	>{/if}
															</div>
															<div class="addr-form-group floating">
																<input
																	type="text"
																	id="ship-addr2"
																	name="address_line2"
																	bind:value={shippingForm.address_line2}
																	placeholder=" "
																/>
																<label for="ship-addr2">Address Line 2</label>
															</div>
														</div>

														<div class="addr-form-row cols-3">
															<div class="addr-form-group floating">
																<input
																	type="text"
																	id="ship-city"
																	name="city"
																	bind:value={shippingForm.city}
																	placeholder=" "
																	class={addressFormErrors.city ? 'error' : ''}
																/>
																<label for="ship-city">City <span class="req">*</span></label>
																{#if addressFormErrors.city}<span class="field-error"
																		>{addressFormErrors.city}</span
																	>{/if}
															</div>
															<div class="addr-form-group floating">
																<input
																	type="text"
																	id="ship-state"
																	name="state"
																	bind:value={shippingForm.state}
																	placeholder=" "
																/>
																<label for="ship-state">State / Province</label>
															</div>
															<div class="addr-form-group floating">
																<input
																	type="text"
																	id="ship-postal"
																	name="postal_code"
																	bind:value={shippingForm.postal_code}
																	placeholder=" "
																	class={addressFormErrors.postal_code ? 'error' : ''}
																/>
																<label for="ship-postal"
																	>Postal Code <span class="req">*</span></label
																>
																{#if addressFormErrors.postal_code}<span class="field-error"
																		>{addressFormErrors.postal_code}</span
																	>{/if}
															</div>
														</div>

														<div class="addr-form-row">
															<div class="addr-form-group floating select-wrapper">
																<select
																	id="ship-country"
																	name="country"
																	bind:value={shippingForm.country}
																>
																	<option value="Nepal">🇳🇵 Nepal</option>
																	<option value="India">🇮🇳 India</option>
																	<option value="Bangladesh">🇧🇩 Bangladesh</option>
																	<option value="Bhutan">🇧🇹 Bhutan</option>
																</select>
																<label for="ship-country">Country</label>
															</div>
															<div class="addr-form-group addr-checkbox">
																<label class="addr-check-label">
																	<input
																		type="checkbox"
																		name="is_default"
																		bind:checked={shippingForm.is_default}
																	/>
																	<span class="addr-checkmark"></span>
																	Set as default shipping address
																</label>
															</div>
														</div>

														<div class="addr-form-actions">
															<button
																class="button secondary"
																onclick={cancelShippingForm}
																type="button">Cancel</button
															>
															<button
																class="button primary"
																type="submit"
																disabled={isSavingAddress}
															>
																{#if isSavingAddress}Saving...{:else}{editingAddressId
																		? 'Update'
																		: 'Save'} Address{/if}
															</button>
														</div>
													</form>
												</div>
											{/if}

											<!-- {#if !showShippingForm}
												<button
													class="button primary add-addr-btn"
													onclick={() => openShippingForm()}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														stroke-width="2"
														stroke="currentColor"
														width="16"
														height="16"
														><path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M12 4.5v15m7.5-7.5h-15"
														/></svg
													>
													Add Shipping Address
												</button>
											{/if} -->
										</div>
									{/if}
								</div>

								<!-- Billing Addresses -->
								<div class="address-section">
									<div class="section-header-premium">
										<div class="section-title-group">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="2"
												stroke="currentColor"
												width="18"
												height="18"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
												/>
											</svg>
											<h3>Billing Details</h3>
										</div>
									</div>

									{#if billingAddresses.length > 0}
										{#each billingAddresses as baddress}
											<div class="billing-card-premium">
												<div class="billing-card-header">
													<div class="billing-info-top">
														<h4 class="billing-name">
															{baddress.full_name || 'Billing Contact'}
														</h4>
														{#if baddress.is_default}
															<span class="default-badge-premium">default</span>
														{/if}
													</div>
													<button
														class="button-icon-edit"
														onclick={() => openBillingForm(baddress)}
														aria-label="Edit billing address"
														title="Edit billing address"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															stroke-width="2"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
															/>
														</svg>
													</button>
												</div>

												<div class="billing-details-grid">
													<div class="billing-detail-item">
														<span class="detail-icon location">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																fill="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
																/>
															</svg>
														</span>
														<div class="detail-content">
															<span class="detail-label">Address</span>
															<p class="detail-value">{baddress.address_line1}</p>
															{#if baddress.address_line2}
																<p class="detail-value secondary">
																	{baddress.address_line2}
																</p>
															{/if}
															<p class="detail-value secondary">
																{baddress.city}, {baddress.state}
																{baddress.postal_code}
															</p>
															<p class="detail-value secondary">{baddress.country}</p>
														</div>
													</div>

													<div class="billing-detail-item">
														<span class="detail-icon phone">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																fill="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
																/>
															</svg>
														</span>
														<div class="detail-content">
															<span class="detail-label">Phone</span>
															<p class="detail-value">{baddress.phone}</p>
														</div>
													</div>

													{#if baddress.email}
														<div class="billing-detail-item">
															<span class="detail-icon email">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	fill="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
																	/>
																</svg>
															</span>
															<div class="detail-content">
																<span class="detail-label">Email</span>
																<p class="detail-value">{baddress.email}</p>
															</div>
														</div>
													{/if}
												</div>
											</div>
										{/each}
									{:else}
										<div class="empty-billing-state">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
												/>
											</svg>
											<p>No billing address saved yet.</p>
											<p class="empty-hint">Add your billing details for faster checkout</p>
										</div>
									{/if}

									<!-- {:else}
										<p class="no-data">No billing address saved yet.</p>
									{/if} -->

									{#if showBillingForm}
										<div class="address-form-card" transition:slide>
											<form
												id="billingForm"
												method="POST"
												action="?/updateBillingAddress"
												use:enhance={() => {
													isSavingAddress = true;
													return async ({ result }) => {
														isSavingAddress = false;
														if (result.type === 'success') {
															submitMessage = {
																type: 'success',
																text: result.data.message || 'Billing address saved successfully'
															};
															isEditing = false;
															cancelBillingForm();
															// Refresh billing addresses from backend
															location.reload();
														} else if (result.type === 'failure') {
															submitMessage = {
																type: 'error',
																text: result.data.message
															};
														}
														// Clear message after 3 seconds
														setTimeout(() => {
															submitMessage = null;
														}, 3000);
													};
												}}
											>
												<div class="address-form-header">
													<span class="form-icon billing">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															stroke-width="1.5"
															stroke="currentColor"
															width="18"
															height="18"
															><path
																stroke-linecap="round"
																stroke-linejoin="round"
																d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
															/></svg
														>
													</span>
													<h4>{editingAddressId ? 'Edit' : 'New'} Billing Address</h4>
												</div>

												<div class="addr-form-row cols-3">
													<div class="addr-form-group floating">
														<input
															type="text"
															id="bill-name"
															name="full_name"
															bind:value={billingForm.full_name}
															placeholder=" "
															class={addressFormErrors.full_name ? 'error' : ''}
														/>
														<label for="bill-name">Full Name <span class="req">*</span></label>
														{#if addressFormErrors.full_name}<span class="field-error"
																>{addressFormErrors.full_name}</span
															>{/if}
													</div>
													<div class="addr-form-group floating">
														<input
															type="tel"
															id="bill-phone"
															name="phone"
															bind:value={billingForm.phone}
															placeholder=" "
															class={addressFormErrors.phone ? 'error' : ''}
														/>
														<label for="bill-phone">Phone <span class="req">*</span></label>
														{#if addressFormErrors.phone}<span class="field-error"
																>{addressFormErrors.phone}</span
															>{/if}
													</div>
													<div class="addr-form-group floating">
														<input
															type="email"
															id="bill-email"
															name="email"
															bind:value={billingForm.email}
															placeholder=" "
														/>
														<label for="bill-email">Email</label>
													</div>
												</div>

												<div class="addr-form-row">
													<div class="addr-form-group floating">
														<input
															type="text"
															id="bill-addr1"
															name="address_line1"
															bind:value={billingForm.address_line1}
															placeholder=" "
															class={addressFormErrors.address_line1 ? 'error' : ''}
														/>
														<label for="bill-addr1">Address Line 1 <span class="req">*</span></label
														>
														{#if addressFormErrors.address_line1}<span class="field-error"
																>{addressFormErrors.address_line1}</span
															>{/if}
													</div>
													<div class="addr-form-group floating">
														<input
															type="text"
															id="bill-addr2"
															name="address_line2"
															bind:value={billingForm.address_line2}
															placeholder=" "
														/>
														<label for="bill-addr2">Address Line 2</label>
													</div>
												</div>

												<div class="addr-form-row cols-3">
													<div class="addr-form-group floating">
														<input
															type="text"
															id="bill-city"
															name="city"
															bind:value={billingForm.city}
															placeholder=" "
															class={addressFormErrors.city ? 'error' : ''}
														/>
														<label for="bill-city">City <span class="req">*</span></label>
														{#if addressFormErrors.city}<span class="field-error"
																>{addressFormErrors.city}</span
															>{/if}
													</div>
													<div class="addr-form-group floating">
														<input
															type="text"
															id="bill-state"
															name="state"
															bind:value={billingForm.state}
															placeholder=" "
														/>
														<label for="bill-state">State / Province</label>
													</div>
													<div class="addr-form-group floating">
														<input
															type="text"
															id="bill-postal"
															name="postal_code"
															bind:value={billingForm.postal_code}
															placeholder=" "
															class={addressFormErrors.postal_code ? 'error' : ''}
														/>
														<label for="bill-postal">Postal Code <span class="req">*</span></label>
														{#if addressFormErrors.postal_code}<span class="field-error"
																>{addressFormErrors.postal_code}</span
															>{/if}
													</div>
												</div>

												<div class="addr-form-row">
													<div class="addr-form-group floating select-wrapper">
														<select
															id="bill-country"
															name="country"
															bind:value={billingForm.country}
														>
															<option value="Nepal">🇳🇵 Nepal</option>
															<option value="India">🇮🇳 India</option>
															<option value="Bangladesh">🇧🇩 Bangladesh</option>
															<option value="Bhutan">🇧🇹 Bhutan</option>
														</select>
														<label for="bill-country">Country</label>
													</div>
													<div class="addr-form-group addr-checkbox">
														<label class="addr-check-label">
															<input
																type="checkbox"
																name="is_default"
																bind:checked={billingForm.is_default}
															/>
															<span class="addr-checkmark"></span>
															Set as default billing address
														</label>
													</div>
												</div>

												<div class="addr-form-actions">
													<button class="button secondary" onclick={cancelBillingForm} type="button"
														>Cancel</button
													>
													<button class="button primary" type="submit" disabled={isSavingAddress}>
														{#if isSavingAddress}Saving...{:else}{editingAddressId
																? 'Update'
																: 'Save'} Address{/if}
													</button>
												</div>
											</form>
										</div>
									{/if}

									<!-- {#if !showBillingForm}
										<button class="button primary add-addr-btn" onclick={() => openBillingForm()}>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="2"
												stroke="currentColor"
												width="16"
												height="16"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M12 4.5v15m7.5-7.5h-15"
												/></svg
											>
											Add Billing Address
										</button>
									{/if} -->
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Settings Tab -->
				{#if activeTab === 'settings'}
					<div class="card" transition:fade>
						<h2>Account Settings</h2>
						<div class="settings-content">
							<!-- Password Change -->
							<div class="settings-section">
								<h3>Change Password</h3>
								<div class="form-group">
									<div class="form-field">
										<label for="current-password">Current Password</label>
										<input type="password" id="current-password" />
									</div>
									<div class="form-field">
										<label for="new-password">New Password</label>
										<input type="password" id="new-password" />
									</div>
									<div class="form-field">
										<label for="confirm-password">Confirm New Password</label>
										<input type="password" id="confirm-password" />
									</div>
									<button class="button primary">Update Password</button>
								</div>
							</div>
							<!-- Notification Preferences -->
							<div class="settings-section">
								<h3>Notification Preferences</h3>
								<div class="checkbox-group">
									<label class="checkbox-field">
										<input type="checkbox" checked />
										<span>Order updates</span>
									</label>
									<label class="checkbox-field">
										<input type="checkbox" checked />
										<span>Promotional emails</span>
									</label>
									<label class="checkbox-field">
										<input type="checkbox" />
										<span>Newsletter</span>
									</label>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>
<Footer />

<style>
	.my-account-page {
		background: #f7f8fa;
		padding: 20px 20px 20px 20px;
		overflow-x: hidden;
		/* prevent horizontal touch/drag gestures; allow vertical scrolling */
		touch-action: pan-y;
		-webkit-overflow-scrolling: touch;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 16px;
		width: 100%;
	}

	.my-account-page img,
	.my-account-page svg {
		-webkit-user-drag: none;
	}

	.account-wrapper {
		display: flex;
	}

	/* ================= SIDEBAR ================= */

	.sidebar {
		width: 230px;
		background: #fff;
		border-right: 1px solid #e5e7eb;
		padding: 14px 10px;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.profile-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding-bottom: 14px;
		border-bottom: 1px solid #e5e7eb;
	}

	.profile-avatar {
		width: 58px;
		height: 58px;
		border-radius: 50%;
		background: #16a34a;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar-placeholder {
		font-size: 22px;
		font-weight: 700;
		color: #fff;
	}

	.profile-name {
		font-size: 13px;
		font-weight: 600;
		color: #111827;
		text-align: center;
	}

	.profile-email {
		font-size: 10px;
		color: #6b7280;
		word-break: break-all;
		text-align: center;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 9px 12px;
		border: none;
		border-radius: 8px;
		background: transparent;
		font-size: 12px;
		cursor: pointer;
		color: #4b5563;
		transition: 0.2s;
	}

	.nav-item:hover {
		background: rgba(22, 163, 74, 0.08);
		color: #16a34a;
	}

	.nav-item.active {
		background: rgba(22, 163, 74, 0.12);
		color: #16a34a;
		font-weight: 600;
	}

	.nav-icon {
		width: 16px;
		height: 16px;
	}

	.logout-btn {
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid #e5e7eb;
		color: #dc2626;
	}

	.logout-btn:hover {
		background: rgba(220, 38, 38, 0.08);
		color: #b91c1c;
	}

	/* ================= MAIN ================= */

	.main-content {
		flex: 1;
		padding: 20px;
		overflow-y: auto;
	}

	.page-header {
		margin-bottom: 18px;
	}

	.page-title {
		font-size: 22px;
		font-weight: 700;
		color: #111827;
		margin-bottom: 4px;
	}

	.page-subtitle {
		font-size: 12px;
		color: #6b7280;
	}

	/* ================= CARDS ================= */

	.card {
		background: #fff;
		border-radius: 12px;
		padding: 18px;
		margin-bottom: 18px;
		border: 1px solid #ececec;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}

	.card h2 {
		font-size: 17px;
		margin-bottom: 14px;
		color: #111827;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 14px;
	}

	.card-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	/* Account panel layout */
	.account-panel {
		display: grid;
		grid-template-columns: 220px 1fr;
		gap: 18px;
		align-items: start;
	}

	.left-column {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
	}

	.profile-avatar-large {
		width: 120px;
		height: 120px;
		border-radius: 16px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #ecfccb, #bbf7d0);
		box-shadow: 0 6px 18px rgba(16, 185, 129, 0.12);
	}

	.profile-avatar-large img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-initial {
		font-size: 44px;
		font-weight: 800;
		color: #065f46;
	}

	.quick-stats {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		align-items: center;
	}

	.quick-stats .stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 8px 12px;
		border-radius: 10px;
		background: #fff;
		border: 1px solid #eef2f6;
		width: 100%;
	}

	.quick-stats .stat .stat-value {
		font-size: 18px;
		font-weight: 700;
		color: #0f172a;
	}

	.quick-stats .stat .stat-label {
		font-size: 12px;
		color: #6b7280;
		margin-top: 4px;
	}

	.right-column .account-info {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.info-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 12px;
		background: #fff;
		border-radius: 10px;
		border: 1px solid #f1f5f9;
	}

	.info-field .label {
		font-size: 12px;
		color: #6b7280;
		font-weight: 600;
	}
	.info-field .value {
		font-size: 14px;
		color: #0f172a;
		font-weight: 700;
	}

	.actions-row {
		grid-column: 1 / -1;
		display: flex;
		gap: 8px;
		margin-top: 6px;
	}

	/* ================= STATS ================= */

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 14px;
		margin-bottom: 18px;
	}

	.stat-widget {
		background: #fff;
		border-radius: 12px;
		padding: 16px;
		border: 1px solid #ececec;
	}

	.stat-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.stat-icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
	}

	.stat-icon.orders {
		background: #3b82f6;
	}

	.stat-icon.spent {
		background: #10b981;
	}

	.stat-icon.cancelled {
		background: #ef4444;
	}

	.stat-icon.addresses {
		background: #f59e0b;
	}

	.stat-icon svg {
		width: 20px;
		height: 20px;
	}

	.stat-label {
		font-size: 11px;
		color: #6b7280;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 700;
		margin-bottom: 4px;
		color: #111827;
	}

	.stat-description {
		font-size: 11px;
		color: #9ca3af;
	}

	/* ================= TABLE ================= */

	.table-wrapper {
		overflow-x: auto;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}

	.orders-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12px;
		min-width: 520px;
	}

	.orders-table th {
		background: #f9fafb;
		padding: 10px;
		text-align: left;
		font-size: 10px;
		color: #6b7280;
		text-transform: uppercase;
	}

	.orders-table td {
		padding: 10px;
		border-top: 1px solid #f1f1f1;
	}

	.serial-number {
		font-weight: 600;
		color: #6b7280;
		text-align: center;
	}

	.order-code-cell {
		font-weight: 700;
		color: #16a34a;
	}

	.orders-table .item-image {
		width: 48px;
		height: 48px;
		border-radius: 8px;
		overflow: hidden;
		object-fit: cover;
		flex-shrink: 0;
	}

	.orders-table tbody tr:hover {
		background: #fafafa;
	}

	.status-badge {
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-badge.delivered {
		background: #dcfce7;
		color: #166534;
	}

	.status-badge.processing {
		background: #fef3c7;
		color: #92400e;
	}

	.status-badge.cancelled {
		background: #fee2e2;
		color: #991b1b;
	}

	.status-badge.pending {
		background: #e0e7ff;
		color: #3730a3;
	}

	/* ================= BUTTONS ================= */

	.button {
		padding: 8px 14px;
		border: none;
		border-radius: 8px;
		font-size: 12px;
		cursor: pointer;
		transition: 0.2s;
	}

	.button.primary {
		background: #16a34a;
		color: white;
	}

	.button.primary:hover {
		background: #15803d;
	}

	.button.secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.button.text {
		background: transparent;
		color: #16a34a;
	}

	.button-link {
		background: none;
		border: none;
		color: #16a34a;
		font-size: 12px;
		cursor: pointer;
	}

	/* ================= FORMS ================= */

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.form-field label {
		font-size: 12px;
		font-weight: 600;
		color: #374151;
	}

	input[type='text'],
	input[type='email'],
	input[type='tel'],
	input[type='password'],
	input[type='date'],
	select {
		width: 100%;
		padding: 9px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 12px;
		background: #fff;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #16a34a;
	}

	/* ================= ADDRESS ================= */

	.address-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 16px;
	}

	.address-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.address-section h3 {
		font-size: 15px;
		color: #111827;
	}

	.address-card {
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		padding: 14px;
		background: #fff;
	}

	.address-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.address-header h4 {
		font-size: 14px;
	}

	.default-badge {
		background: #dcfce7;
		color: #166534;
		font-size: 9px;
		padding: 3px 8px;
		border-radius: 6px;
	}

	.address-text {
		font-size: 12px;
		line-height: 1.5;
		color: #4b5563;
		margin-bottom: 8px;
	}

	.contact-info {
		font-size: 11px;
		color: #6b7280;
	}

	/* ================= QUICK ACTIONS ================= */

	.quick-actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 12px;
	}

	.action-card {
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		padding: 16px;
		background: #fff;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 12px;
		transition: 0.2s;
	}

	.action-card:hover {
		border-color: #16a34a;
	}

	.action-icon {
		width: 42px;
		height: 42px;
		border-radius: 10px;
		background: #16a34a;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-icon svg {
		width: 20px;
		height: 20px;
	}

	/* ================= MESSAGES ================= */

	.message {
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 16px;
		font-size: 14px;
		animation: slideDown 0.3s ease-out;
	}

	.message.success {
		background-color: #dcfce7;
		color: #166534;
		border: 1px solid #86efac;
	}

	.message.error {
		background-color: #fee2e2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ================= BILLING DETAILS ================= */

	.section-header-premium {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 2px solid #f0f0f0;
	}

	.section-title-group {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.section-title-group svg {
		width: 18px;
		height: 18px;
		color: #16a34a;
		flex-shrink: 0;
	}

	.section-title-group h3 {
		font-size: 15px;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.billing-card-premium {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 12px;
		transition: all 0.3s ease;
	}

	.billing-card-premium:hover {
		border-color: #16a34a;
		box-shadow: 0 4px 12px rgba(22, 163, 74, 0.08);
	}

	.billing-card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16px;
		gap: 12px;
	}

	.billing-info-top {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.billing-name {
		font-size: 14px;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.default-badge-premium {
		background: linear-gradient(135deg, #16a34a, #15803d);
		color: #fff;
		font-size: 10px;
		font-weight: 600;
		padding: 4px 8px;
		border-radius: 6px;
		text-transform: lowercase;
	}

	.button-icon-edit {
		background: transparent;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.button-icon-edit:hover {
		background: #f9fafb;
		border-color: #16a34a;
		color: #16a34a;
	}

	.button-icon-edit svg {
		width: 16px;
		height: 16px;
		stroke: currentColor;
	}

	.billing-details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
	}

	.billing-detail-item {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.detail-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #fff;
	}

	.detail-icon svg {
		width: 16px;
		height: 16px;
	}

	.detail-icon.location {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
	}

	.detail-icon.phone {
		background: linear-gradient(135deg, #10b981, #059669);
	}

	.detail-icon.email {
		background: linear-gradient(135deg, #f59e0b, #d97706);
	}

	.detail-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.detail-label {
		font-size: 11px;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.detail-value {
		font-size: 13px;
		color: #111827;
		margin: 0;
		line-height: 1.5;
	}

	.detail-value.secondary {
		font-size: 12px;
		color: #6b7280;
	}

	.empty-billing-state {
		text-align: center;
		padding: 40px 20px;
		color: #9ca3af;
	}

	.empty-billing-state svg {
		width: 48px;
		height: 48px;
		margin-bottom: 12px;
		opacity: 0.5;
	}

	.add-addr-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		justify-content: center;
	}

	.add-addr-btn svg {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
	}

	/* ================= SHIPPING SECTION ================= */

	.address-section-shipping {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.section-header-shipping {
		background: linear-gradient(135deg, #f0fdf4, #f0f9ff);
		border: 1px solid #d1fae5;
		border-radius: 12px;
		padding: 14px 16px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: inherit;
	}

	.section-header-shipping:hover {
		background: linear-gradient(135deg, #dcfce7, #e0f2fe);
		border-color: #16a34a;
		box-shadow: 0 4px 12px rgba(22, 163, 74, 0.1);
	}

	.section-header-shipping .section-title-group {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.section-header-shipping .section-title-group svg {
		width: 18px;
		height: 18px;
		color: #059669;
		flex-shrink: 0;
	}

	.section-header-shipping .section-title-group h3 {
		font-size: 15px;
		font-weight: 600;
		color: #047857;
		margin: 0;
	}

	.toggle-icon {
		width: 20px;
		height: 20px;
		color: #059669;
		transition: transform 0.3s ease;
		flex-shrink: 0;
	}

	.toggle-icon.rotated {
		transform: rotate(180deg);
	}

	.section-content-shipping {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.shipping-card {
		background: #fafaf9;
		border: 1.5px solid #e7e5e4;
		border-radius: 12px;
		padding: 16px;
		transition: all 0.3s ease;
	}

	.shipping-card:hover {
		background: #fff;
		border-color: #059669;
		box-shadow: 0 6px 16px rgba(5, 150, 105, 0.1);
		transform: translateY(-2px);
	}

	.shipping-card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16px;
		gap: 12px;
	}

	.shipping-info-top {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.shipping-name {
		font-size: 14px;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.default-badge-shipping {
		background: linear-gradient(135deg, #d1fae5, #a7f3d0);
		color: #065f46;
		font-size: 10px;
		font-weight: 700;
		padding: 4px 8px;
		border-radius: 6px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.shipping-details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
	}

	.shipping-detail-item {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.detail-icon-shipping {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #fff;
	}

	.detail-icon-shipping svg {
		width: 16px;
		height: 16px;
	}

	.detail-icon-shipping.location {
		background: linear-gradient(135deg, #059669, #047857);
	}

	.detail-icon-shipping.phone {
		background: linear-gradient(135deg, #0891b2, #0e7490);
	}

	.detail-icon-shipping.email {
		background: linear-gradient(135deg, #7c3aed, #6d28d9);
	}

	.empty-state-shipping {
		text-align: center;
		padding: 40px 20px;
		color: #9ca3af;
		background: #fafaf9;
		border-radius: 12px;
		border: 1px dashed #e7e5e4;
	}

	.empty-state-shipping svg {
		width: 48px;
		height: 48px;
		margin-bottom: 12px;
		opacity: 0.5;
		color: #059669;
	}

	.empty-state-shipping p {
		margin: 8px 0;
		font-size: 13px;
	}

	.empty-hint {
		color: #6b7280;
		font-size: 12px !important;
	}

	/* ================= ADDRESS FORM ================= */

	.address-form-card {
		background: linear-gradient(135deg, #ffffff, #f9fafb);
		border: 1.5px solid #e5e7eb;
		border-radius: 14px;
		padding: 20px;
		margin-bottom: 16px;
		transition: all 0.3s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.address-form-card:hover {
		border-color: #16a34a;
		box-shadow: 0 8px 20px rgba(22, 163, 74, 0.1);
	}

	.address-form-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 18px;
		padding-bottom: 12px;
		border-bottom: 2px solid #f0f0f0;
	}

	.form-icon {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: linear-gradient(135deg, #16a34a, #15803d);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.form-icon svg {
		width: 18px;
		height: 18px;
	}

	.address-form-header h4 {
		font-size: 16px;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.addr-form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 14px;
		margin-bottom: 14px;
	}

	.addr-form-row.cols-2 {
		grid-template-columns: repeat(2, 1fr);
	}

	.addr-form-row.cols-3 {
		grid-template-columns: repeat(3, 1fr);
	}

	.addr-form-group {
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.addr-form-group.floating {
		position: relative;
	}

	.addr-form-group.floating input,
	.addr-form-group.floating select {
		padding: 11px 12px;
		border: 1.5px solid #e5e7eb;
		border-radius: 10px;
		font-size: 13px;
		background: #fff;
		transition: all 0.3s ease;
		font-family: inherit;
	}

	.addr-form-group.floating input::placeholder,
	.addr-form-group.floating select::placeholder {
		color: transparent;
	}

	.addr-form-group.floating input:focus,
	.addr-form-group.floating select:focus {
		outline: none;
		border-color: #16a34a;
		background: #f9fafb;
		box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
	}

	.addr-form-group.floating input:not(:placeholder-shown) ~ label,
	.addr-form-group.floating input:focus ~ label,
	.addr-form-group.floating select:focus ~ label {
		transform: translateY(-28px) scale(0.85);
		color: #16a34a;
		font-weight: 600;
	}

	.addr-form-group.floating label {
		position: absolute;
		top: 11px;
		left: 12px;
		font-size: 13px;
		color: #6b7280;
		pointer-events: none;
		transition: all 0.3s ease;
		origin: left top;
		transform-origin: left top;
		background: white;
		padding: 0 4px;
		margin-left: -4px;
	}

	.req {
		color: #ef4444;
		margin-left: 2px;
	}

	.field-error {
		font-size: 11px;
		color: #ef4444;
		margin-top: 4px;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.addr-form-group.floating input.error,
	.addr-form-group.floating select.error {
		border-color: #ef4444;
		background: #fef2f2;
	}

	.addr-form-group.floating input.error:focus,
	.addr-form-group.floating select.error:focus {
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}

	.select-wrapper select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
		padding-right: 30px;
	}

	.select-wrapper select:focus {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2316a34a' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
	}

	.addr-checkbox {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		margin-top: 6px;
	}

	.addr-check-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 13px;
		color: #374151;
		user-select: none;
	}

	.addr-check-label input[type='checkbox'] {
		width: 0;
		height: 0;
		opacity: 0;
		position: absolute;
	}

	.addr-checkmark {
		width: 18px;
		height: 18px;
		border: 1.5px solid #d1d5db;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		background: white;
		flex-shrink: 0;
	}

	.addr-check-label input[type='checkbox']:checked ~ .addr-checkmark {
		background: linear-gradient(135deg, #16a34a, #15803d);
		border-color: #16a34a;
		color: white;
	}

	.addr-check-label input[type='checkbox']:checked ~ .addr-checkmark::after {
		content: '✓';
		font-size: 11px;
		font-weight: 700;
		color: white;
	}

	.addr-form-actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid #f0f0f0;
	}

	.addr-form-actions .button {
		min-width: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.addr-form-actions .button.primary {
		background: linear-gradient(135deg, #16a34a, #15803d);
		box-shadow: 0 2px 8px rgba(22, 163, 74, 0.2);
	}

	.addr-form-actions .button.primary:hover:not(:disabled) {
		background: linear-gradient(135deg, #15803d, #166534);
		box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
		transform: translateY(-1px);
	}

	.addr-form-actions .button.secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.addr-form-actions .button.secondary:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	.addr-form-actions .button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* ================= MOBILE ================= */

	@media (max-width: 768px) {
		.account-wrapper {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
			border-right: none;
			border-bottom: 1px solid #e5e7eb;
		}

		.sidebar-nav {
			flex-direction: row;
			overflow-x: auto;
		}

		.main-content {
			padding: 14px;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.address-grid {
			grid-template-columns: 1fr;
		}

		.addr-form-row.cols-3,
		.addr-form-row.cols-2 {
			grid-template-columns: repeat(2, 1fr);
		}

		.address-form-card {
			padding: 16px;
		}

		.addr-form-row {
			gap: 12px;
			margin-bottom: 12px;
		}
	}

	@media (max-width: 480px) {
		.page-title {
			font-size: 18px;
		}

		.card {
			padding: 14px;
		}

		.stat-value {
			font-size: 20px;
		}

		.button {
			font-size: 11px;
			padding: 7px 10px;
		}

		.orders-table {
			min-width: 420px;
		}

		/* Make order tab item images smaller */
		.orders-table .item-image {
			width: 40px;
			height: 40px;
			border-radius: 6px;
			overflow: hidden;
			flex-shrink: 0;
			object-fit: cover;
		}

		.addr-form-row.cols-3 {
			grid-template-columns: 1fr;
		}

		.addr-form-row.cols-2 {
			grid-template-columns: 1fr;
		}

		.addr-form-actions {
			flex-direction: column-reverse;
			gap: 8px;
		}

		.addr-form-actions .button {
			width: 100%;
		}

		.address-form-card {
			padding: 12px;
		}

		.address-form-header {
			margin-bottom: 14px;
		}

		.address-form-header h4 {
			font-size: 14px;
		}
	}

	/* ================= MODAL STYLES ================= */

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
		animation: fadeIn 0.3s ease-out;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		animation: slideUp 0.3s ease-out;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24px;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 20px;
		color: #1f2937;
	}

	.modal-close {
		background: none;
		border: none;
		cursor: pointer;
		color: #6b7280;
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
	}

	.modal-close:hover {
		color: #1f2937;
	}

	.modal-body {
		padding: 24px;
	}

	.modal-footer {
		display: flex;
		gap: 12px;
		padding: 20px 24px;
		border-top: 1px solid #e5e7eb;
		justify-content: flex-end;
	}

	/* Return/Cancel Item Info */
	.return-item-info,
	.cancel-item-info {
		display: flex;
		gap: 16px;
		margin-bottom: 24px;
		padding: 16px;
		background: #f9fafb;
		border-radius: 8px;
	}

	.return-item-image,
	.cancel-item-image {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: 6px;
		flex-shrink: 0;
	}

	.return-item-details,
	.cancel-item-details {
		flex: 1;
	}

	.return-item-details h4,
	.cancel-item-details h4 {
		margin: 0 0 8px 0;
		font-size: 16px;
		color: #1f2937;
	}

	.return-item-details p,
	.cancel-item-details p {
		margin: 6px 0;
		font-size: 14px;
		color: #6b7280;
	}

	.warning-text {
		color: #dc2626;
		font-weight: 500;
		padding: 8px;
		background: #fee2e2;
		border-radius: 4px;
	}

	/* Form Styles */
	.return-form,
	.cancel-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-group label {
		font-size: 14px;
		font-weight: 500;
		color: #1f2937;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		font-family: inherit;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	/* Action Buttons in Table */
	.actions-cell {
		padding: 8px !important;
	}

	.action-buttons {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.btn-action {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border: none;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.btn-action svg {
		width: 16px;
		height: 16px;
	}

	.btn-return {
		background-color: #dbeafe;
		color: #0369a1;
		border: 1px solid #0284c7;
	}

	.btn-return:hover {
		background-color: #bfdbfe;
	}

	.btn-cancel {
		background-color: #fee2e2;
		color: #dc2626;
		border: 1px solid #ef4444;
	}

	.btn-cancel:hover {
		background-color: #fecaca;
	}

	/* Modal Action Buttons */
	.btn-primary,
	.btn-secondary,
	.btn-danger {
		padding: 10px 20px;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background-color: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.btn-secondary {
		background-color: #e5e7eb;
		color: #1f2937;
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: #d1d5db;
	}

	.btn-danger {
		background-color: #ef4444;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background-color: #dc2626;
	}

	.btn-return-submit,
	.btn-cancel-submit {
		min-width: 140px;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Responsive Modal */
	@media (max-width: 640px) {
		.modal-content {
			max-width: 100%;
		}

		.return-item-info,
		.cancel-item-info {
			flex-direction: column;
			text-align: center;
		}

		.return-item-image,
		.cancel-item-image {
			margin: 0 auto;
		}

		.modal-footer {
			flex-direction: column-reverse;
		}

		.btn-primary,
		.btn-secondary,
		.btn-danger {
			width: 100%;
		}

		.action-buttons {
			flex-direction: column;
		}

		.btn-action {
			width: 100%;
			justify-content: center;
		}
	}
</style>
