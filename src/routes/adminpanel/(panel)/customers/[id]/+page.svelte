<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$lib/admin/paths';

	interface Address {
		id: number;
		address_type: 'billing' | 'shipping';
		full_name: string;
		phone: string;
		email: string;
		address_line1: string;
		address_line2: string;
		city: string;
		state: string;
		postal_code: string;
		country: string;
		is_default: boolean;
		created_at: string;
	}

	interface OrderItem {
		id: number;
		product_id: number;
		name: string;
		quantity: number;
		price: number;
		size: string;
		color: string;
		subtotal: number;
		discount: number;
	}

	interface Order {
		id: number;
		order_code: string;
		status: 'pending' | 'confirmed' | 'processing' | 'delivered' | 'cancelled';
		payment_method: string;
		payment_status: string;
		subtotal: number;
		shipping: number;
		tax: number;
		discount: number;
		total: number;
		created_at: string;
		items: OrderItem[];
	}

	interface CustomerData {
		id: number;
		email: string;
		name: string;
		phone: string;
		is_active: boolean;
		created_at: string;
		is_buyer: boolean;
		addresses: {
			billing: Address[];
			shipping: Address[];
		};
		orders: Order[];
		total_orders: number;
		total_spent: number;
	}

	export let data: { customerDetails: CustomerData };

	const customer = data.customerDetails;

	// Get default addresses
	const defaultBilling =
		customer.addresses.billing.find((a) => a.is_default) || customer.addresses.billing[0];
	const defaultShipping =
		customer.addresses.shipping.find((a) => a.is_default) || customer.addresses.shipping[0];

	// Format date
	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Format currency
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'NPR'
		}).format(amount);
	}

	// Get status badge color
	function getStatusColor(status: string) {
		const colors: { [key: string]: string } = {
			pending: 'badge-warning',
			confirmed: 'badge-info',
			processing: 'badge-primary',
			delivered: 'badge-success',
			cancelled: 'badge-error'
		};
		return colors[status] || 'badge-secondary';
	}
</script>

<div class="min-h-screen bg-base-200 p-4 md:p-8">
	<div class="max-w-6xl mx-auto">
		<!-- Header with customer info -->
		<div class="mb-8">
			<a href={`${base}/customers`} class="btn btn-sm btn-ghost gap-2 mb-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="w-4 h-4"
				>
					<path d="m15 18-6-6 6-6" />
				</svg>
				Back to Customers
			</a>

			<div class="card bg-base-100 shadow-lg">
				<div class="card-body">
					<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h1 class="card-title text-3xl mb-2">{customer.name}</h1>
							<p class="text-base-content/70">{customer.email}</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<div class="badge {customer.is_active ? 'badge-success' : 'badge-error'} badge-lg">
								{customer.is_active ? 'Active' : 'Inactive'}
							</div>
							<div class="badge badge-primary badge-lg">
								Member since {formatDate(customer.created_at)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
			<div class="stat bg-base-100 rounded-lg shadow">
				<div class="stat-figure text-primary">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-8 h-8"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M2.25 3h19.5A2.25 2.25 0 0 1 24 5.25v13.5A2.25 2.25 0 0 1 21.75 21H2.25A2.25 2.25 0 0 1 0 18.75V5.25A2.25 2.25 0 0 1 2.25 3Z"
						/>
					</svg>
				</div>
				<div class="stat-title">Total Orders</div>
				<div class="stat-value text-primary">{customer.total_orders}</div>
			</div>

			<div class="stat bg-base-100 rounded-lg shadow">
				<div class="stat-figure text-secondary">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-8 h-8"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 3.071-.879 4.242 0M3.75 19.5c0 1.657.895 3.054 2.414 3.97C7.681 23.957 10.271 24 12 24c1.729 0 4.319-.043 6.836-1.03C20.355 22.554 21.25 21.157 21.25 19.5M3.75 19.5c0-1.017.211-1.987.654-2.873m7.757 0c-.508 1.186-1.897 2-3.654 2-2.071 0-3.75-1.679-3.75-3.75 0-1.017.211-1.987.654-2.873m7.757 0c1.573.6 2.809 2.088 2.809 3.873 0 2.07-1.679 3.75-3.75 3.75-1.757 0-3.146-.814-3.654-2"
						/>
					</svg>
				</div>
				<div class="stat-title">Total Spent</div>
				<div class="stat-value text-secondary">{formatCurrency(customer.total_spent)}</div>
			</div>

			<div class="stat bg-base-100 rounded-lg shadow">
				<div class="stat-figure text-accent">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-8 h-8"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
						/>
					</svg>
				</div>
				<div class="stat-title">Phone</div>
				<div class="stat-value text-accent text-sm">{customer.phone || 'N/A'}</div>
			</div>
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Addresses Section -->
			<div class="lg:col-span-1 space-y-6">
				<!-- Shipping Address -->
				<div class="card bg-base-100 shadow-lg overflow-hidden">
					<div class="bg-primary text-primary-content p-4">
						<h2 class="card-title text-lg flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-5 h-5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M8.25 18.75H12m-7.5-6h15m-6-3H9.12a2.25 2.25 0 0 0-2.131 1.342l-.821 2.05a2.25 2.25 0 0 0-.131.851v3.597a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 20.25 17.25V7.5a2.25 2.25 0 0 0-2.25-2.25H5.625a2.25 2.25 0 0 0-2.25 2.25Z"
								/>
							</svg>
							Shipping Address
						</h2>
					</div>
					<div class="card-body">
						{#if defaultShipping}
							<div class="space-y-2 text-sm">
								<div>
									<p class="font-semibold">{defaultShipping.full_name}</p>
									<p class="text-base-content/70">{defaultShipping.phone}</p>
								</div>
								<div class="divider my-2" />
								<div>
									<p>{defaultShipping.address_line1}</p>
									{#if defaultShipping.address_line2}
										<p>{defaultShipping.address_line2}</p>
									{/if}
									<p>
										{defaultShipping.city}, {defaultShipping.state}
										{defaultShipping.postal_code}
									</p>
									<p>{defaultShipping.country}</p>
								</div>
								{#if defaultShipping.is_default}
									<div class="badge badge-outline badge-sm mt-2">Default</div>
								{/if}
							</div>
						{:else}
							<p class="text-base-content/50">No shipping address available</p>
						{/if}
					</div>
				</div>

				<!-- Billing Address -->
				<div class="card bg-base-100 shadow-lg overflow-hidden">
					<div class="bg-secondary text-secondary-content p-4">
						<h2 class="card-title text-lg flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-5 h-5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h.008v.008H5.25v-.008Zm2 0h.008v.008H7.25v-.008Zm2 0h.008v.008H9.25v-.008Zm2 0h.008v.008h-.008v-.008Zm2 0h.008v.008h-.008v-.008Zm2 0h.008v.008h-.008v-.008Zm2 0h.008v.008h-.008v-.008Zm2 0h.008v.008h-.008v-.008Zm2 0h.008v.008h-.008v-.008ZM3.75 15h.008v.008H3.75V15Zm2 0h.008v.008H5.75V15Zm2 0h.008v.008H7.75V15Zm2 0h.008v.008H9.75V15Zm2 0h.008v.008h-.008V15Zm2 0h.008v.008h-.008V15Zm2 0h.008v.008h-.008V15Zm2 0h.008v.008h-.008V15Zm2 0h.008v.008h-.008V15ZM3.75 6.75h.008v.008H3.75V6.75Z"
								/>
							</svg>
							Billing Address
						</h2>
					</div>
					<div class="card-body">
						{#if defaultBilling}
							<div class="space-y-2 text-sm">
								<div>
									<p class="font-semibold">{defaultBilling.full_name}</p>
									<p class="text-base-content/70">{defaultBilling.phone}</p>
								</div>
								<div class="divider my-2" />
								<div>
									<p>{defaultBilling.address_line1}</p>
									{#if defaultBilling.address_line2}
										<p>{defaultBilling.address_line2}</p>
									{/if}
									<p>{defaultBilling.city}, {defaultBilling.state} {defaultBilling.postal_code}</p>
									<p>{defaultBilling.country}</p>
								</div>
								{#if defaultBilling.is_default}
									<div class="badge badge-outline badge-sm mt-2">Default</div>
								{/if}
							</div>
						{:else}
							<p class="text-base-content/50">No billing address available</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Order History Section -->
			<div class="lg:col-span-2">
				<div class="card bg-base-100 shadow-lg">
					<div class="bg-accent text-accent-content p-4">
						<h2 class="card-title text-lg flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-5 h-5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 18 4.5h-2.25A2.25 2.25 0 0 0 13.5 2.25 2.25 2.25 0 0 0 11.25 4.5H9a2.25 2.25 0 0 0-2.25 2.25v11.25A2.25 2.25 0 0 0 9 20.25h9z"
								/>
							</svg>
							Order History
						</h2>
					</div>
					<div class="card-body">
						{#if customer.orders && customer.orders.length > 0}
							<div class="overflow-x-auto">
								<table class="table table-compact w-full">
									<thead>
										<tr class="bg-base-200">
											<th>Order Code</th>
											<th>Date</th>
											<th>Items</th>
											<th>Status</th>
											<th>Total</th>
										</tr>
									</thead>
									<tbody>
										{#each customer.orders as order (order.id)}
											<tr class="hover:bg-base-200">
												<td class="font-mono font-semibold text-sm">{order.order_code}</td>
												<td class="text-sm">{formatDate(order.created_at)}</td>
												<td class="text-sm"
													>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td
												>
												<td>
													<span class="badge {getStatusColor(order.status)} text-xs">
														{order.status}
													</span>
												</td>
												<td class="font-semibold">{formatCurrency(order.total)}</td>
											</tr>
											<!-- Order Items Details -->
											<tr class="bg-base-200/50">
												<td colspan="5" class="p-4">
													<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
														{#each order.items as item (item.id)}
															<div class="bg-base-100 p-3 rounded border border-base-300">
																<div class="flex justify-between items-start">
																	<div class="flex-1">
																		<p class="font-semibold text-sm">{item.name}</p>
																		<p class="text-xs text-base-content/60 mt-1">
																			Qty: {item.quantity}
																			{#if item.size}
																				| Size: {item.size}
																			{/if}
																			{#if item.color}
																				| Color: {item.color}
																			{/if}
																		</p>
																	</div>
																	<div class="text-right">
																		<p class="font-semibold text-sm">
																			{formatCurrency(item.subtotal)}
																		</p>
																		{#if item.discount > 0}
																			<p class="text-xs text-success">
																				-{formatCurrency(item.discount)}
																			</p>
																		{/if}
																	</div>
																</div>
															</div>
														{/each}
													</div>
													<div class="divider my-2" />
													<div class="grid grid-cols-2 gap-4 text-sm">
														<div>
															<p class="text-base-content/60">Subtotal</p>
															<p class="font-semibold">{formatCurrency(order.subtotal)}</p>
														</div>
														<div>
															<p class="text-base-content/60">Shipping</p>
															<p class="font-semibold">{formatCurrency(order.shipping)}</p>
														</div>
														<div>
															<p class="text-base-content/60">Tax</p>
															<p class="font-semibold">{formatCurrency(order.tax)}</p>
														</div>
														<div>
															<p class="text-base-content/60">Discount</p>
															<p class="font-semibold">{formatCurrency(order.discount)}</p>
														</div>
													</div>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<div class="text-center py-8">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="w-12 h-12 mx-auto text-base-content/30 mb-3"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m0 0C5.405 7.97 9.25 9 12 9c2.75 0 6.595-1.03 8.25-2.625M7.5 9v5.25c0 2.278 3.694 4.125 8.25 4.125s8.25-1.847 8.25-4.125V9"
									/>
								</svg>
								<p class="text-base-content/60">No orders yet</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
