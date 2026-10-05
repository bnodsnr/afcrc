<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import Footer from '$lib/components/Footer.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import { isLoggedIn, user } from '$lib/stores/auth';
	import { createApi } from '$lib/api';

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

	interface Profile {
		id?: number;
		user_email?: string;
		user_name?: string;
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
	let userProfile: Profile | null = $state(null);
	let addresses: Address[] = $state([]);
	let shippingAddresses: Address[] = $state([]);
	let billingAddresses: Address[] = $state([]);
	let isLoading = $state(true);
	let activeTab = $state('dashboard');
	let isEditing = $state(false);

	// Dashboard stats
	let totalOrders = $state(0);
	let totalSpent = $state(0);
	let cancelledOrders = $state(0);
	let recentOrders: Order[] = $state([]);
	let summary: Summary | null = $state(null);
	//let recentOrders = $state<typeof orderHistory>([]);

	const orderHistory = [
		{
			id: 'ORD-001',
			date: '2025-10-30',
			status: 'Delivered',
			total: 129.99,
			items: [
				{ name: 'CBD Oil Tincture', quantity: 2, price: 49.99 },
				{ name: 'Hemp Body Lotion', quantity: 1, price: 30.01 }
			]
		},
		{
			id: 'ORD-002',
			date: '2025-10-15',
			status: 'Processing',
			total: 89.99,
			items: [{ name: 'Hemp Protein Powder', quantity: 1, price: 89.99 }]
		},
		{
			id: 'ORD-003',
			date: '2025-09-20',
			status: 'Cancelled',
			total: 45.5,
			items: [{ name: 'Hemp Tea', quantity: 2, price: 22.75 }]
		},
		{
			id: 'ORD-004',
			date: '2025-09-10',
			status: 'Delivered',
			total: 199.99,
			items: [{ name: 'Premium CBD Bundle', quantity: 1, price: 199.99 }]
		}
	];

	onMount(async () => {
		//calculateDashboardStats();

		if ($isLoggedIn) {
			const api = createApi(fetch);
			await Promise.all([fetchProfile(api), fetchTotalOrders(api), fetchAddresses(api)]);
			fetchTotalSpent(api);
			fetchRecentOrders(api);
			fetchOrderSummary(api);
		}
		isLoading = false;
	});

	function calculateDashboardStats() {
		totalOrders = orderHistory.length;
		totalSpent = orderHistory
			.filter((o) => o.status !== 'Cancelled')
			.reduce((sum, order) => sum + order.total, 0);
		cancelledOrders = orderHistory.filter((o) => o.status === 'Cancelled').length;
		recentOrders = orderHistory.slice(0, 5);
	}

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

	//fetch profile and addresses with error handling for new API response structure
	async function fetchProfile(api: ReturnType<typeof createApi>) {
		try {
			const data = await api.profile.getProfile();
			if (data) {
				// Handle new response structure with user object containing profile and addresses
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

	//fetch total orders with error handling for new API response structure
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

	//fetch total spent amout by user
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
				// Map API response to local order structure
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
			console.log('Order summary data:', data);
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

	// async function fetchOrderSummary(api: ReturnType<typeof createApi>) {
	// 	try {
	// 		const data = await api.profile.getordersummary();
	// 		console.log('Order summary data:', data.recent_orders);
	// 		if (data && data.recent_orders) {
	// 			totalOrders = parseInt(data.statistics.total_orders, 10);
	// 			totalSpent = parseFloat(data.statistics.total_spent);
	// 			cancelledOrders = parseInt(data.statistics.cancelled_orders, 10);
	// 			recentOrders = data.statistics.recent_orders.map((order: any) => ({
	// 				id: order.id,
	// 				order_code: order.order_code || `ORD-${order.id}`,
	// 				date: order.created_at || order.date,
	// 				status: order.status,
	// 				total: order.total,
	// 				items: order.items || []
	// 			}));
	// 		}
	// 	} catch (error) {
	// 		console.error('Failed to fetch order summary:', error);
	// 	}
	// }
	async function fetchAddresses(api: ReturnType<typeof createApi>) {
		try {
			const data = await api.profile.getProfile();
			if (data) {
				// Get addresses from user object in profile response
				const userData = data.user;
				if (userData?.addresses) {
					addresses = userData.addresses;
					shippingAddresses = addresses.filter((addr) => addr.address_type === 'shipping');
					billingAddresses = addresses.filter((addr) => addr.address_type === 'billing');
				}
			}
		} catch (error) {
			console.error('Failed to fetch addresses:', error);
		}
	}

	function formatAddress(addr: Address): string {
		return `${addr.address_line1}${addr.address_line2 ? ', ' + addr.address_line2 : ''}, ${addr.city}, ${addr.state} ${addr.postal_code}, ${addr.country}`;
	}

	// Address form state
	let showShippingForm = $state(false);
	let showBillingForm = $state(false);
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

	async function saveAddress(form: typeof shippingForm) {
		if (!validateAddressForm(form)) return;

		isSavingAddress = true;
		try {
			const api = createApi(fetch);
			const isEdit = editingAddressId !== null;

			if (isEdit && editingAddressId) {
				const response = await api.addresses.updateAddress(editingAddressId, form);
				if (response?.success) {
					const refreshApi = createApi(fetch);
					await fetchAddresses(refreshApi);
					if (form.address_type === 'shipping') {
						cancelShippingForm();
					} else {
						cancelBillingForm();
					}
				} else {
					alert(`Failed to save address: ${response?.message || 'Unknown error'}`);
				}
			} else {
				const response = await api.addresses.createAddress(form);
				if (response?.success) {
					const refreshApi = createApi(fetch);
					await fetchAddresses(refreshApi);
					if (form.address_type === 'shipping') {
						cancelShippingForm();
					} else {
						cancelBillingForm();
					}
				} else {
					alert(`Failed to save address: ${response?.message || 'Unknown error'}`);
				}
			}
		} catch (error) {
			console.error('Error saving address:', error);
			alert('Failed to save address. Please try again.');
		} finally {
			isSavingAddress = false;
		}
	}
</script>

<Topbar />
<main class="my-account-page">
	<div class="container">
		<div class="page-header">
			<h1 class="page-title">My Account</h1>
			<p class="page-subtitle">Welcome back, {userProfile?.user_name || 'Customer'}!</p>
		</div>

		<!-- Navigation Tabs -->
		<div class="tabs">
			<button
				class="tab-button {activeTab === 'dashboard' ? 'active' : ''}"
				onclick={() => (activeTab = 'dashboard')}>Dashboard</button
			>
			<button
				class="tab-button {activeTab === 'account' ? 'active' : ''}"
				onclick={() => (activeTab = 'account')}>Account Details</button
			>
			<button
				class="tab-button {activeTab === 'orders' ? 'active' : ''}"
				onclick={() => (activeTab = 'orders')}>Orders</button
			>
			<button
				class="tab-button {activeTab === 'addresses' ? 'active' : ''}"
				onclick={() => (activeTab = 'addresses')}>Addresses</button
			>
			<button
				class="tab-button {activeTab === 'settings' ? 'active' : ''}"
				onclick={() => (activeTab = 'settings')}>Settings</button
			>
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
						<div class="stat-value">${totalSpent.toFixed(2)}</div>
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
										<th>Order ID</th>
										<th>Date</th>
										<th>Items</th>
										<th>Status</th>
										<th>Total</th>
										<th>Action</th>
									</tr>
								</thead>
								<tbody>
									{#each recentOrders as order}
										<tr>
											<td class="order-id">{order.order_code}</td>
											<td class="order-date">{new Date(order.date).toLocaleDateString()}</td>
											<td class="order-items-count"
												>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td
											>
											<td>
												<span class="status-badge {getStatusColor(order.status)}">
													{order.status}
												</span>
											</td>
											<td class="order-amount">${order.total.toFixed(2)}</td>
											<td>
												<button class="button-link">View Details</button>
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
					<button class="button primary" onclick={() => (isEditing = !isEditing)}>
						{isEditing ? 'Save Changes' : 'Edit Profile'}
					</button>
				</div>

				{#if isLoading}
					<p>Loading profile...</p>
				{:else if userProfile}
					<div class="form-grid">
						{#if isEditing}
							<div class="form-group">
								<div class="form-field">
									<label for="name">Full Name</label>
									<input type="text" id="name" bind:value={userProfile.user_name} />
								</div>
								<div class="form-field">
									<label for="email">Email</label>
									<input type="email" id="email" value={userProfile.user_email} disabled />
								</div>
								<div class="form-field">
									<label for="dob">Date of Birth</label>
									<input type="date" id="dob" bind:value={userProfile.date_of_birth} />
								</div>
								<div class="form-field">
									<label for="gender">Gender</label>
									<select id="gender" bind:value={userProfile.gender}>
										<option value="">Select...</option>
										<option value="male">Male</option>
										<option value="female">Female</option>
										<option value="other">Other</option>
										<option value="prefer_not_to_say">Prefer not to say</option>
									</select>
								</div>
							</div>
						{:else}
							<div class="info-group">
								<div class="info-field">
									<span class="label">Full Name</span>
									<span class="value">{userProfile.user_name || 'Not set'}</span>
								</div>
								<div class="info-field">
									<span class="label">Email</span>
									<span class="value">{userProfile.user_email}</span>
								</div>
								<div class="info-field">
									<span class="label">Date of Birth</span>
									<span class="value">{userProfile.date_of_birth || 'Not set'}</span>
								</div>
								<div class="info-field">
									<span class="label">Gender</span>
									<span class="value">{userProfile.gender || 'Not set'}</span>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<p>Unable to load profile. Please try again later.</p>
				{/if}
			</div>
		{/if}

		<!-- Orders Tab -->
		<!-- Orders Tab -->
		{#if activeTab === 'orders'}
			<div class="card" transition:fade>
				<h2>Order History</h2>
				{#if recentOrders.length > 0}
					<div class="table-wrapper">
						<table class="orders-table">
							<thead>
								<tr>
									<th>Order ID</th>
									<th>Date</th>
									<th>Items Details</th>
									<th>Status</th>
									<th>Total</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{#each recentOrders as order}
									<tr>
										<td class="order-id">{order.order_code}</td>
										<td class="order-date">{new Date(order.date).toLocaleDateString()}</td>
										<td class="order-items-detail">
											<div class="items-list">
												{#each order.items as item}
													<div class="item-row">
														<span class="item-name">{item.name}</span>
														<span class="item-qty">Qty: {item.quantity}</span>
														<span class="item-price">${item.price.toFixed(2)}</span>
														<span>
															<img src={item.image} alt={item.name} class="item-image" />
														</span>
													</div>
												{/each}
											</div>
										</td>
										<td>
											<span class="status-badge {getStatusColor(order.status)}">
												{order.status}
											</span>
										</td>
										<td class="order-amount">${order.total.toFixed(2)}</td>
										<td>
											<button class="button-link">View Details</button>
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
		<!-- Addresses Tab -->
		{#if activeTab === 'addresses'}
			<div class="card" transition:fade>
				<h2>My Addresses</h2>

				{#if isLoading}
					<p>Loading addresses...</p>
				{:else}
					<div class="address-grid">
						<!-- Shipping Addresses -->
						<div class="address-section">
							<h3>Shipping Addresses</h3>
							{#if shippingAddresses.length > 0}
								{#each shippingAddresses as address}
									<div class="address-card">
										<div class="address-header">
											<h4>{address.full_name}</h4>
											{#if address.is_default}
												<span class="default-badge">Default</span>
											{/if}
											<button class="button text" onclick={() => openShippingForm(address)}
												>Edit</button
											>
										</div>
										<p class="address-text">
											{formatAddress(address)}
										</p>
										<p class="contact-info">
											Phone: {address.phone}
											{#if address.email}
												<br />Email: {address.email}
											{/if}
										</p>
									</div>
								{/each}
							{:else}
								<p class="no-data">No shipping address saved yet.</p>
							{/if}

							{#if showShippingForm}
								<div class="address-form-card" transition:slide>
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
												bind:value={shippingForm.address_line1}
												placeholder=" "
												class={addressFormErrors.address_line1 ? 'error' : ''}
											/>
											<label for="ship-addr1">Address Line 1 <span class="req">*</span></label>
											{#if addressFormErrors.address_line1}<span class="field-error"
													>{addressFormErrors.address_line1}</span
												>{/if}
										</div>
										<div class="addr-form-group floating">
											<input
												type="text"
												id="ship-addr2"
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
												bind:value={shippingForm.state}
												placeholder=" "
											/>
											<label for="ship-state">State / Province</label>
										</div>
										<div class="addr-form-group floating">
											<input
												type="text"
												id="ship-postal"
												bind:value={shippingForm.postal_code}
												placeholder=" "
												class={addressFormErrors.postal_code ? 'error' : ''}
											/>
											<label for="ship-postal">Postal Code <span class="req">*</span></label>
											{#if addressFormErrors.postal_code}<span class="field-error"
													>{addressFormErrors.postal_code}</span
												>{/if}
										</div>
									</div>

									<div class="addr-form-row">
										<div class="addr-form-group floating select-wrapper">
											<select id="ship-country" bind:value={shippingForm.country}>
												<option value="Nepal">🇳🇵 Nepal</option>
												<option value="India">🇮🇳 India</option>
												<option value="Bangladesh">🇧🇩 Bangladesh</option>
												<option value="Bhutan">🇧🇹 Bhutan</option>
											</select>
											<label for="ship-country">Country</label>
										</div>
										<div class="addr-form-group addr-checkbox">
											<label class="addr-check-label">
												<input type="checkbox" bind:checked={shippingForm.is_default} />
												<span class="addr-checkmark"></span>
												Set as default shipping address
											</label>
										</div>
									</div>

									<div class="addr-form-actions">
										<button class="button secondary" onclick={cancelShippingForm} type="button"
											>Cancel</button
										>
										<button
											class="button primary"
											onclick={() => saveAddress(shippingForm)}
											type="button"
											disabled={isSavingAddress}
										>
											{#if isSavingAddress}Saving...{:else}{editingAddressId ? 'Update' : 'Save'} Address{/if}
										</button>
									</div>
								</div>
							{/if}

							{#if !showShippingForm}
								<button class="button primary add-addr-btn" onclick={() => openShippingForm()}>
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
							{/if}
						</div>

						<!-- Billing Addresses -->
						<div class="address-section">
							<h3>Billing Addresses</h3>
							{#if billingAddresses.length > 0}
								{#each billingAddresses as address}
									<div class="address-card">
										<div class="address-header">
											<h4>{address.full_name}</h4>
											{#if address.is_default}
												<span class="default-badge">Default</span>
											{/if}
											<button class="button text" onclick={() => openBillingForm(address)}
												>Edit</button
											>
										</div>
										<p class="address-text">
											{formatAddress(address)}
										</p>
										<p class="contact-info">
											Phone: {address.phone}
											{#if address.email}
												<br />Email: {address.email}
											{/if}
										</p>
									</div>
								{/each}
							{:else}
								<p class="no-data">No billing address saved yet.</p>
							{/if}

							{#if showBillingForm}
								<div class="address-form-card" transition:slide>
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
												bind:value={billingForm.address_line1}
												placeholder=" "
												class={addressFormErrors.address_line1 ? 'error' : ''}
											/>
											<label for="bill-addr1">Address Line 1 <span class="req">*</span></label>
											{#if addressFormErrors.address_line1}<span class="field-error"
													>{addressFormErrors.address_line1}</span
												>{/if}
										</div>
										<div class="addr-form-group floating">
											<input
												type="text"
												id="bill-addr2"
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
												bind:value={billingForm.state}
												placeholder=" "
											/>
											<label for="bill-state">State / Province</label>
										</div>
										<div class="addr-form-group floating">
											<input
												type="text"
												id="bill-postal"
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
											<select id="bill-country" bind:value={billingForm.country}>
												<option value="Nepal">🇳🇵 Nepal</option>
												<option value="India">🇮🇳 India</option>
												<option value="Bangladesh">🇧🇩 Bangladesh</option>
												<option value="Bhutan">🇧🇹 Bhutan</option>
											</select>
											<label for="bill-country">Country</label>
										</div>
										<div class="addr-form-group addr-checkbox">
											<label class="addr-check-label">
												<input type="checkbox" bind:checked={billingForm.is_default} />
												<span class="addr-checkmark"></span>
												Set as default billing address
											</label>
										</div>
									</div>

									<div class="addr-form-actions">
										<button class="button secondary" onclick={cancelBillingForm} type="button"
											>Cancel</button
										>
										<button
											class="button primary"
											onclick={() => saveAddress(billingForm)}
											type="button"
											disabled={isSavingAddress}
										>
											{#if isSavingAddress}Saving...{:else}{editingAddressId ? 'Update' : 'Save'} Address{/if}
										</button>
									</div>
								</div>
							{/if}

							{#if !showBillingForm}
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
							{/if}
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
</main>
<Footer />

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
		box-sizing: border-box;
		width: 100%;
		overflow: hidden;
	}

	.my-account-page {
		padding: 32px 0;
		background: #f8f9fa;
		min-height: 100vh;
		box-sizing: border-box;
		width: 100%;
		overflow: hidden;
	}

	main {
		width: 100%;
		box-sizing: border-box;
		overflow: hidden;
	}

	.page-header {
		margin-bottom: 32px;
	}

	.page-title {
		font-size: 32px;
		font-weight: 700;
		margin: 0;
		color: #1a1a1a;
	}

	.page-subtitle {
		font-size: 16px;
		color: #6b7280;
		margin: 8px 0 0 0;
	}

	.tabs {
		display: flex;
		border-bottom: 2px solid #e5e5e5;
		margin-bottom: 32px;
		gap: 8px;
		background: white;
		padding: 0;
		border-radius: 12px 12px 0 0;
		flex-wrap: wrap;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scroll-behavior: smooth;
	}

	.tab-button {
		padding: 14px 20px;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 15px;
		font-weight: 500;
		position: relative;
		color: #6b7280;
		transition: all 0.3s ease;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.tab-button:hover {
		color: #16a34a;
	}

	.tab-button.active {
		color: #16a34a;
		border-bottom: 3px solid #16a34a;
		margin-bottom: -2px;
	}

	.card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		padding: 28px;
		margin-bottom: 24px;
		box-sizing: border-box;
		width: 100%;
		overflow: hidden;
		-webkit-user-drag: none;
		user-select: text;
	}

	.card h2 {
		font-size: 24px;
		font-weight: 600;
		margin-bottom: 24px;
		color: #1a1a1a;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.card-header h2 {
		margin: 0;
	}

	/* Dashboard */
	.dashboard-content {
		display: flex;
		flex-direction: column;
		gap: 28px;
		touch-action: auto;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
		touch-action: auto;
	}

	.stat-widget {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		border-left: 4px solid transparent;
		touch-action: auto;
	}

	.stat-widget:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}

	.stat-widget:nth-child(1) {
		border-left-color: #3b82f6;
	}

	.stat-widget:nth-child(2) {
		border-left-color: #10b981;
	}

	.stat-widget:nth-child(3) {
		border-left-color: #ef4444;
	}

	.stat-widget:nth-child(4) {
		border-left-color: #f59e0b;
	}

	.stat-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 10px;
		color: white;
		font-size: 24px;
	}

	.stat-icon.orders {
		background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
	}

	.stat-icon.spent {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	}

	.stat-icon.cancelled {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	}

	.stat-icon.addresses {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	}

	.stat-icon svg {
		width: 28px;
		height: 28px;
	}

	.stat-label {
		font-size: 14px;
		color: #6b7280;
		font-weight: 500;
	}

	.stat-value {
		font-size: 32px;
		font-weight: 700;
		color: #1a1a1a;
		margin-bottom: 8px;
	}

	.stat-description {
		font-size: 13px;
		color: #9ca3af;
		margin: 0;
	}

	/* Orders Table */
	.table-wrapper {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}

	.orders-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
		min-width: 600px;
	}

	.orders-table thead {
		background: #f9fafb;
		border-bottom: 2px solid #e5e7eb;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.orders-table th {
		padding: 14px;
		text-align: left;
		font-weight: 600;
		color: #374151;
		text-transform: uppercase;
		font-size: 12px;
		letter-spacing: 0.5px;
		white-space: nowrap;
	}

	.orders-table tbody tr {
		border-bottom: 1px solid #e5e7eb;
		transition: background 0.2s;
	}

	.orders-table tbody tr:hover {
		background: #f9fafb;
	}

	.orders-table td {
		padding: 16px 14px;
		color: #4b5563;
	}

	.order-id {
		font-weight: 600;
		color: #1a1a1a;
		min-width: 100px;
	}

	.order-date {
		color: #6b7280;
		min-width: 120px;
	}

	.order-items-count {
		color: #6b7280;
		min-width: 80px;
	}

	.order-amount {
		font-weight: 600;
		color: #059669;
		min-width: 80px;
	}

	.status-badge {
		display: inline-block;
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
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

	.button-link {
		background: none;
		border: none;
		color: #16a34a;
		cursor: pointer;
		font-weight: 600;
		padding: 0;
		transition: color 0.2s;
	}

	.button-link:hover {
		color: #15803d;
	}

	.empty-state {
		text-align: center;
		padding: 40px 20px;
		color: #9ca3af;
	}

	/* Quick Actions */
	.quick-actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
	}

	.action-card {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 20px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		text-align: center;
		color: #1a1a1a;
		font-weight: 500;
		font-size: 15px;
	}

	.action-card:hover {
		border-color: #16a34a;
		background: #f0fdf4;
		transform: translateY(-2px);
	}

	.action-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: #f0fdf4;
		border-radius: 10px;
		color: #16a34a;
		transition: all 0.3s;
	}

	.action-card:hover .action-icon {
		background: #16a34a;
		color: white;
	}

	.action-icon svg {
		width: 24px;
		height: 24px;
	}

	.button {
		padding: 10px 18px;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		font-size: 14px;
		font-weight: 600;
		transition: all 0.3s;
	}

	.button.primary {
		background-color: #16a34a;
		color: white;
	}

	.button.primary:hover {
		background-color: #15803d;
		box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
	}

	.button.text {
		background: none;
		color: #16a34a;
	}

	.button.text-link {
		background: none;
		color: #16a34a;
		padding: 0;
		font-size: 14px;
	}

	.button.text:hover {
		background-color: rgba(22, 163, 74, 0.1);
	}

	.form-grid {
		display: grid;
		gap: 24px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-field label {
		font-size: 14px;
		font-weight: 600;
		color: #374151;
	}

	input[type='text'],
	input[type='email'],
	input[type='tel'],
	input[type='password'],
	input[type='date'],
	select {
		padding: 10px 14px;
		border: 1.5px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		transition: all 0.3s;
		width: 100%;
		box-sizing: border-box;
	}

	input[type='text']:focus,
	input[type='email']:focus,
	input[type='tel']:focus,
	input[type='password']:focus,
	input[type='date']:focus,
	select:focus {
		outline: none;
		border-color: #16a34a;
		box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
	}

	.info-group {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.info-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-bottom: 16px;
		border-bottom: 1px solid #e5e7eb;
	}

	.info-field:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.info-field .label {
		font-size: 13px;
		color: #6b7280;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.info-field .value {
		font-size: 16px;
		color: #1a1a1a;
		font-weight: 500;
	}

	.orders-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.order-card {
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		padding: 20px;
		background: #f9fafb;
	}

	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16px;
	}

	.date {
		font-size: 13px;
		color: #6b7280;
		margin: 0;
	}

	.status {
		padding: 6px 14px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
	}

	.status.delivered {
		background-color: #dcfce7;
		color: #166534;
	}

	.status.processing {
		background-color: #fef3c7;
		color: #92400e;
	}

	.status.cancelled {
		background-color: #fee2e2;
		color: #991b1b;
	}

	.order-items {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 12px;
	}

	.order-item {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
		color: #4b5563;
	}

	.order-total {
		display: flex;
		justify-content: space-between;
		padding-top: 12px;
		border-top: 1px solid #e5e5e5;
		font-weight: 600;
		color: #1a1a1a;
	}

	.address-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 32px;
		width: 100%;
		box-sizing: border-box;
	}

	.address-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-width: 0;
		width: 100%;
		box-sizing: border-box;
	}

	.address-section h3 {
		font-size: 18px;
		font-weight: 600;
		margin: 0;
		color: #1a1a1a;
	}

	.address-card {
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		padding: 16px;
		background: #f9fafb;
	}

	.address-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
		flex-wrap: wrap;
	}

	.address-header h4 {
		font-weight: 600;
		font-size: 16px;
		margin: 0;
		color: #1a1a1a;
	}

	.default-badge {
		padding: 4px 10px;
		background-color: #dcfce7;
		color: #166534;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
	}

	.address-text {
		font-size: 14px;
		line-height: 1.6;
		color: #4b5563;
		margin: 0 0 8px 0;
	}

	.contact-info {
		font-size: 13px;
		color: #6b7280;
		margin: 0;
	}

	.no-data {
		color: #9ca3af;
		font-style: italic;
		padding: 16px 0;
		margin: 0;
	}

	input[type='date'],
	select {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 16px;
	}

	input[type='date']:focus,
	select:focus {
		outline: none;
		border-color: #16a34a;
		box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
	}

	.settings-content {
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.settings-section {
		border-bottom: 1px solid #e5e5e5;
		padding-bottom: 32px;
	}

	.settings-section:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.settings-section h3 {
		font-weight: 600;
		margin-bottom: 16px;
	}

	.checkbox-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.checkbox-field {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.checkbox-field input[type='checkbox'] {
		width: 16px;
		height: 16px;
	}

	/* Address Form Card */
	.address-form-card {
		background: #f9fdfb;
		border: 1.5px solid #d4e8da;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 16px;
	}

	.address-form-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 20px;
		padding-bottom: 14px;
		border-bottom: 1px solid #e0ece3;
	}

	.form-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		background: #16a34a;
		color: white;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.form-icon.billing {
		background: #0d9488;
	}

	.address-form-header h4 {
		font-size: 16px;
		font-weight: 600;
		color: #09240f;
		margin: 0;
	}

	/* Address form grid rows */
	.addr-form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		margin-bottom: 4px;
	}

	.addr-form-row.cols-3 {
		grid-template-columns: 1fr 1fr 1fr;
	}

	/* Floating label group */
	.addr-form-group {
		margin-bottom: 14px;
		width: 100%;
		box-sizing: border-box;
	}

	.addr-form-group.floating {
		position: relative;
		width: 100%;
		box-sizing: border-box;
	}

	.addr-form-group.floating input,
	.addr-form-group.floating select {
		width: 100%;
		padding: 18px 16px 8px;
		border: 1.5px solid #d4ddd7;
		border-radius: 10px;
		font-size: 14px;
		background: #fff;
		color: #1a1a1a;
		transition:
			border-color 0.25s,
			box-shadow 0.25s,
			background 0.25s;
		appearance: none;
		-webkit-appearance: none;
		box-sizing: border-box;
		max-width: 100%;
	}

	.addr-form-group.floating select {
		padding-right: 40px;
		cursor: pointer;
	}

	.addr-form-group.select-wrapper {
		position: relative;
		width: 100%;
		box-sizing: border-box;
	}

	.addr-form-group.select-wrapper::after {
		content: '';
		position: absolute;
		right: 16px;
		top: 50%;
		transform: translateY(-50%);
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 6px solid #6b7280;
		pointer-events: none;
	}

	.addr-form-group.floating label {
		position: absolute;
		top: 50%;
		left: 16px;
		transform: translateY(-50%);
		font-size: 14px;
		color: #8e9e93;
		pointer-events: none;
		transition: all 0.2s ease;
		background: transparent;
		padding: 0 2px;
		line-height: 1;
	}

	.addr-form-group.floating input:focus + label,
	.addr-form-group.floating input:not(:placeholder-shown) + label,
	.addr-form-group.floating select:focus + label,
	.addr-form-group.floating select:valid + label {
		top: 8px;
		transform: translateY(0);
		font-size: 11px;
		color: #16a34a;
		font-weight: 500;
	}

	.addr-form-group.floating input:focus,
	.addr-form-group.floating select:focus {
		outline: none;
		border-color: #16a34a;
		box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
		background: #fafffe;
	}

	.addr-form-group.floating input:hover:not(:focus),
	.addr-form-group.floating select:hover:not(:focus) {
		border-color: #a3c4ae;
	}

	.addr-form-group.floating input.error {
		border-color: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
	}

	.addr-form-group.floating input.error + label {
		color: #ef4444;
	}

	.req {
		color: #ef4444;
		font-weight: 600;
	}

	.field-error {
		display: block;
		color: #ef4444;
		font-size: 12px;
		margin-top: 4px;
		font-weight: 500;
	}

	/* Checkbox inside address form */
	.addr-checkbox {
		display: flex;
		align-items: center;
	}

	.addr-check-label {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		font-size: 14px;
		color: #4b5563;
		transition: color 0.2s;
	}

	.addr-check-label:hover {
		color: #1f2937;
	}

	.addr-check-label input[type='checkbox'] {
		display: none;
	}

	.addr-checkmark {
		width: 20px;
		height: 20px;
		border: 2px solid #c5d1c9;
		border-radius: 5px;
		position: relative;
		transition: all 0.25s;
		flex-shrink: 0;
	}

	.addr-check-label:hover .addr-checkmark {
		border-color: #16a34a;
	}

	.addr-check-label input[type='checkbox']:checked + .addr-checkmark {
		background: #16a34a;
		border-color: #16a34a;
	}

	.addr-check-label input[type='checkbox']:checked + .addr-checkmark::after {
		content: '\2713';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 12px;
		font-weight: bold;
	}

	/* Form actions */
	.addr-form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 8px;
		padding-top: 16px;
		border-top: 1px solid #e5ece8;
	}

	.button.secondary {
		background: #f3f4f6;
		color: #4b5563;
		border: 1px solid #d1d5db;
	}

	.button.secondary:hover {
		background: #e5e7eb;
	}

	.button.primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Add address button */
	.add-addr-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.order-items-detail {
		max-width: 100%;
		width: auto;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.item-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		padding: 8px 0;
		border-bottom: 1px solid #f0f0f0;
		flex-wrap: wrap;
	}

	.item-row:last-child {
		border-bottom: none;
	}

	.item-name {
		flex: 1;
		color: #1a1a1a;
		font-weight: 500;
		min-width: 120px;
	}

	.item-qty {
		color: #6b7280;
		font-size: 12px;
		white-space: nowrap;
	}

	.item-price {
		color: #059669;
		font-weight: 600;
		white-space: nowrap;
	}

	.item-image {
		max-width: 30px;
		height: auto;
		border-radius: 4px;
	}

	@media (max-width: 768px) {
		.container {
			padding: 0 16px;
		}

		.card {
			padding: 20px;
			margin-bottom: 16px;
		}

		.tabs {
			overflow-x: auto;
			white-space: nowrap;
			-webkit-overflow-scrolling: touch;
			scroll-snap-type: x mandatory;
			scroll-behavior: smooth;
		}

		.tab-button {
			padding: 12px 16px;
			font-size: 14px;
			scroll-snap-align: start;
			flex-shrink: 0;
		}

		.stats-grid {
			grid-template-columns: 1fr 1fr;
			gap: 16px;
		}

		.stat-widget {
			padding: 16px;
		}

		.stat-value {
			font-size: 24px;
		}

		.stat-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.stat-icon {
			width: 40px;
			height: 40px;
		}

		.stat-icon svg {
			width: 24px;
			height: 24px;
		}

		.quick-actions {
			grid-template-columns: 1fr;
			gap: 12px;
		}

		.action-card {
			padding: 16px;
			font-size: 14px;
		}

		.action-icon {
			width: 40px;
			height: 40px;
		}

		.card-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
		}

		.card-header h2 {
			margin-bottom: 0;
		}

		.card h2 {
			font-size: 20px;
			margin-bottom: 16px;
		}

		.table-wrapper {
			margin: 0;
			padding: 0;
		}

		.orders-table {
			font-size: 12px;
		}

		.orders-table th,
		.orders-table td {
			padding: 12px 10px;
		}

		.address-grid {
			grid-template-columns: 1fr;
			gap: 20px;
		}

		.address-section h3 {
			font-size: 16px;
		}

		.address-card {
			padding: 12px;
		}

		.address-header {
			gap: 8px;
		}

		.address-header h4 {
			font-size: 14px;
		}

		.default-badge {
			font-size: 11px;
			padding: 3px 8px;
		}

		.address-text {
			font-size: 13px;
			margin-bottom: 6px;
		}

		.contact-info {
			font-size: 12px;
		}

		.addr-form-row {
			grid-template-columns: 1fr;
			gap: 12px;
		}

		.addr-form-row.cols-3 {
			grid-template-columns: 1fr;
		}

		.address-form-card {
			padding: 16px;
			margin: 0 0 16px 0;
			border-radius: 8px;
		}

		.address-form-header {
			gap: 8px;
			margin-bottom: 16px;
			padding-bottom: 12px;
		}

		.form-icon {
			width: 30px;
			height: 30px;
			font-size: 14px;
		}

		.address-form-header h4 {
			font-size: 14px;
		}

		.addr-form-group.floating input,
		.addr-form-group.floating select {
			font-size: 16px;
			padding: 16px 12px 6px;
		}

		.addr-form-group.floating label {
			font-size: 12px;
			left: 12px;
		}

		.addr-form-actions {
			flex-direction: column;
			gap: 10px;
			margin-top: 6px;
			padding-top: 12px;
		}

		.addr-form-actions .button {
			width: 100%;
		}

		.add-addr-btn {
			width: 100%;
			justify-content: center;
		}

		.form-field {
			gap: 6px;
		}

		.form-field label {
			font-size: 13px;
		}

		.info-field {
			gap: 4px;
			padding-bottom: 12px;
		}

		.info-field .label {
			font-size: 12px;
		}

		.info-field .value {
			font-size: 15px;
		}

		.button {
			padding: 9px 16px;
			font-size: 13px;
		}
	}

	@media (max-width: 480px) {
		.container {
			padding: 0 12px;
		}

		.my-account-page {
			padding: 16px 0;
		}

		.page-header {
			margin-bottom: 20px;
		}

		.page-title {
			font-size: 22px;
		}

		.page-subtitle {
			font-size: 14px;
		}

		.card {
			padding: 16px;
			margin-bottom: 12px;
			border-radius: 8px;
		}

		.stats-grid {
			grid-template-columns: 1fr;
			gap: 12px;
		}

		.stat-widget {
			padding: 14px;
		}

		.stat-value {
			font-size: 20px;
			margin-bottom: 4px;
		}

		.stat-label {
			font-size: 12px;
		}

		.stat-description {
			font-size: 11px;
		}

		.stat-icon {
			width: 36px;
			height: 36px;
		}

		.stat-icon svg {
			width: 20px;
			height: 20px;
		}

		.quick-actions {
			grid-template-columns: 1fr;
			gap: 10px;
		}

		.action-card {
			padding: 14px;
			font-size: 13px;
			gap: 10px;
		}

		.action-icon {
			width: 36px;
			height: 36px;
		}

		.action-icon svg {
			width: 20px;
			height: 20px;
		}

		.tab-button {
			padding: 10px 12px;
			font-size: 12px;
		}

		.card h2 {
			font-size: 18px;
			margin-bottom: 14px;
		}

		.table-wrapper {
			margin: 0;
			padding: 0;
		}

		.orders-table {
			font-size: 11px;
			min-width: 500px;
		}

		.orders-table th,
		.orders-table td {
			padding: 10px 8px;
		}

		.order-id {
			min-width: 80px;
		}

		.order-date {
			min-width: 100px;
		}

		.order-items-count {
			min-width: 60px;
		}

		.order-amount {
			min-width: 70px;
		}

		.status-badge {
			padding: 4px 8px;
			font-size: 11px;
		}

		.button-link {
			font-size: 12px;
		}

		.address-grid {
			gap: 16px;
		}

		.address-section h3 {
			font-size: 15px;
			margin-bottom: 12px;
		}

		.address-card {
			padding: 10px;
		}

		.address-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 6px;
		}

		.address-header h4 {
			font-size: 13px;
		}

		.address-header button {
			font-size: 11px;
			padding: 6px 10px;
		}

		.address-text {
			font-size: 12px;
			line-height: 1.5;
			margin-bottom: 4px;
		}

		.contact-info {
			font-size: 11px;
		}

		.address-form-card {
			padding: 14px;
			margin: 0 0 12px 0;
			border-radius: 8px;
		}

		.address-form-header {
			gap: 6px;
			margin-bottom: 14px;
			padding-bottom: 10px;
		}

		.form-icon {
			width: 28px;
			height: 28px;
		}

		.address-form-header h4 {
			font-size: 13px;
		}

		.addr-form-row {
			gap: 10px;
			margin-bottom: 2px;
		}

		.addr-form-group.floating input,
		.addr-form-group.floating select {
			font-size: 14px;
			padding: 14px 10px 4px;
		}

		.addr-form-group.floating label {
			font-size: 11px;
			left: 10px;
		}

		.addr-form-group.floating input:focus + label,
		.addr-form-group.floating input:not(:placeholder-shown) + label,
		.addr-form-group.floating select:focus + label,
		.addr-form-group.floating select:valid + label {
			top: 6px;
			font-size: 10px;
		}

		.req {
			font-size: 12px;
		}

		.field-error {
			font-size: 11px;
		}

		.addr-check-label {
			font-size: 12px;
			gap: 8px;
		}

		.addr-checkmark {
			width: 18px;
			height: 18px;
		}

		.addr-form-actions {
			flex-direction: column;
			gap: 8px;
			margin-top: 4px;
			padding-top: 10px;
		}

		.addr-form-actions .button {
			width: 100%;
			font-size: 12px;
			padding: 8px 12px;
		}

		.add-addr-btn {
			width: 100%;
			font-size: 12px;
			padding: 8px 12px;
		}

		.form-field {
			gap: 4px;
		}

		.form-field label {
			font-size: 12px;
		}

		.info-group {
			gap: 16px;
		}

		.info-field {
			gap: 4px;
			padding-bottom: 10px;
		}

		.info-field .label {
			font-size: 11px;
		}

		.info-field .value {
			font-size: 14px;
		}

		.button {
			padding: 8px 14px;
			font-size: 12px;
		}

		.button-link {
			padding: 4px 8px;
		}

		.settings-section {
			padding-bottom: 20px;
			margin-bottom: 20px;
		}

		.settings-section h3 {
			font-size: 14px;
		}

		.checkbox-group {
			gap: 10px;
		}

		.checkbox-field {
			font-size: 13px;
		}

		.items-list {
			gap: 6px;
		}

		.item-row {
			gap: 6px;
			padding: 6px 0;
			font-size: 12px;
		}

		.item-name {
			min-width: 100px;
		}

		.item-image {
			max-width: 24px;
		}
	}

	@media (min-width: 769px) and (max-width: 1024px) {
		.addr-form-row.cols-3 {
			grid-template-columns: 1fr 1fr;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
