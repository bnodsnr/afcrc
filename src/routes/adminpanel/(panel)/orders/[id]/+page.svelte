<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';
	import { getImageUrl } from '$lib/admin/utils/image';
	import { base } from '$lib/admin/paths';

	let { data } = $props();
	let orderDetails = $state(data.orderDetails.data);
	let isModalOpen = $state(false);
	let isUpdating = $state(false);
	let errorMessage = $state('');

	// Define status progression order
	const statusProgression = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'];
	const allStatusOptions = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'];

	const statusClasses = {
		pending: 'btn-warning',
		confirmed: 'btn-accent',
		processing: 'btn-info',
		delivered: 'btn-success',
		cancelled: 'btn-error'
	};

	// Get available statuses based on current status
	function getAvailableStatuses(currentStatus: string): string[] {
		const currentIndex = statusProgression.indexOf(currentStatus);

		if (currentIndex === -1) return [];

		// If cancelled, no further updates allowed
		if (currentStatus === 'cancelled') return [];

		// If delivered, can only cancel
		if (currentStatus === 'delivered') return ['cancelled'];

		// For other statuses, allow next status and cancellation
		const available = [statusProgression[currentIndex + 1]];
		if (currentStatus !== 'pending') {
			available.push('cancelled');
		}

		return available;
	}

	// Check if status transition is allowed
	function isStatusAllowed(newStatus: string, currentStatus: string): boolean {
		const available = getAvailableStatuses(currentStatus);
		return available.includes(newStatus);
	}

	async function handleStatusClick() {
		errorMessage = '';
		isModalOpen = true;
	}

	async function updateStatus(newStatus: string) {
		errorMessage = '';

		if (newStatus === orderDetails.status) {
			isModalOpen = false;
			return;
		}

		// Check if transition is allowed
		if (!isStatusAllowed(newStatus, orderDetails.status)) {
			errorMessage = `Cannot update from ${orderDetails.status} to ${newStatus}. Invalid status transition.`;
			return;
		}

		isUpdating = true;
		try {
			const formData = new FormData();
			formData.append('status', newStatus);

			const response = await fetch(`?/updateStatus`, {
				method: 'POST',
				body: formData
			});

			const responseData = await response.json();

			if (response.ok) {
				orderDetails.status = newStatus;
				isModalOpen = false;
				errorMessage = '';
				orderDetails = { ...orderDetails };
				goto(base + `/orders/${orderDetails.id}`, { replaceState: true });
			} else {
				errorMessage = responseData.error || 'Failed to update order status';
			}
		} catch (error) {
			console.error('Error updating status:', error);
			errorMessage = 'Error updating order status. Please try again.';
		} finally {
			isUpdating = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
	<div class="max-w-6xl mx-auto">
		<!-- Breadcrumb Navigation -->
		<div class="mb-6 flex items-center gap-2 text-sm">
			<a href={base} class="link link-hover text-primary font-medium">Dashboard</a>
			<svg
				class="w-4 h-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<a href={base + '/orders'} class="link link-hover text-primary font-medium">Orders</a>
			<svg
				class="w-4 h-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Order Details</span>
		</div>
		<!-- Header Section -->
		<div
			class="bg-gradient-to-r from-green-600 via-green-500 to-emerald-400 rounded-xl shadow-xl p-8 mb-8 text-white"
		>
			<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
				<div>
					<h1 class="text-4xl font-bold mb-4">Order Details</h1>
					<div class="space-y-2">
						<p class="text-green-100 flex items-center gap-2">
							<span class="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold"
								>Order Code: {orderDetails.order_code}</span
							>
						</p>
						<p class="text-green-100">
							<span class="font-semibold">Customer:</span>
							{orderDetails.user.name}
						</p>
						<p class="text-green-100">
							<span class="font-semibold">Phone:</span>
							{orderDetails.user.phone}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<button
						class={`btn btn-soft ${statusClasses[orderDetails.status] || ''} font-semibold capitalize`}
						onclick={handleStatusClick}
					>
						{orderDetails.status}
					</button>
				</div>
			</div>
		</div>

		<!-- Address Section -->
		<div class="grid md:grid-cols-2 gap-6 mb-8">
			<!-- Shipping Address -->
			<div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
				<h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
					<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 8c1.657 0 5-1.343 5-5s-3.343-5-5-5-5 1.343-5 5 3.343 5 5 5zm0 0c-1.657 0-5 1.343-5 5v2c0 1.657 2.239 3 5 3s5-1.343 5-3v-2c0-3.657-3.343-5-5-5z"
						/>
					</svg>
					Shipping Address
				</h2>
				<div class="space-y-3 text-gray-700">
					{#if orderDetails.shipping_address}
						<div>
							<p class="text-sm text-gray-500 font-semibold">Name</p>
							<p class="font-medium">
								{orderDetails.shipping_address.first_name}
								{orderDetails.shipping_address.last_name}
							</p>
						</div>
						<div>
							<p class="text-sm text-gray-500 font-semibold">Address</p>
							<p>{orderDetails.shipping_address.address_line_1}</p>
							{#if orderDetails.shipping_address.address_line_2}
								<p>{orderDetails.shipping_address.address_line_2}</p>
							{/if}
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<p class="text-sm text-gray-500 font-semibold">City</p>
								<p>{orderDetails.shipping_address.city}</p>
							</div>
							<div>
								<p class="text-sm text-gray-500 font-semibold">State</p>
								<p>{orderDetails.shipping_address.state}</p>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<p class="text-sm text-gray-500 font-semibold">Postal Code</p>
								<p>{orderDetails.shipping_address.postal_code}</p>
							</div>
							<div>
								<p class="text-sm text-gray-500 font-semibold">Country</p>
								<p>{orderDetails.shipping_address.country}</p>
							</div>
						</div>
						<div>
							<p class="text-sm text-gray-500 font-semibold">Phone</p>
							<p>{orderDetails.shipping_address.phone_number}</p>
						</div>
					{:else}
						<p class="text-gray-400 italic">No shipping address available</p>
					{/if}
				</div>
			</div>

			<!-- Billing Address -->
			<div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
				<h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
					<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
					Billing Address
				</h2>
				<div class="space-y-3 text-gray-700">
					{#if orderDetails.billing_address}
						<div>
							<p class="text-sm text-gray-500 font-semibold">Name</p>
							<p class="font-medium">
								{orderDetails.billing_address.first_name}
								{orderDetails.billing_address.last_name}
							</p>
						</div>
						<div>
							<p class="text-sm text-gray-500 font-semibold">Address</p>
							<p>{orderDetails.billing_address.address_line_1}</p>
							{#if orderDetails.billing_address.address_line_2}
								<p>{orderDetails.billing_address.address_line_2}</p>
							{/if}
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<p class="text-sm text-gray-500 font-semibold">City</p>
								<p>{orderDetails.billing_address.city}</p>
							</div>
							<div>
								<p class="text-sm text-gray-500 font-semibold">State</p>
								<p>{orderDetails.billing_address.state}</p>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<p class="text-sm text-gray-500 font-semibold">Postal Code</p>
								<p>{orderDetails.billing_address.postal_code}</p>
							</div>
							<div>
								<p class="text-sm text-gray-500 font-semibold">Country</p>
								<p>{orderDetails.billing_address.country}</p>
							</div>
						</div>
						<div>
							<p class="text-sm text-gray-500 font-semibold">Phone</p>
							<p>{orderDetails.billing_address.phone_number}</p>
						</div>
					{:else}
						<p class="text-gray-400 italic">No billing address available</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Order Items Section -->
		<div class="bg-white rounded-xl shadow-md overflow-hidden">
			<div class="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b-2 border-gray-200">
				<h2 class="text-xl font-bold text-gray-800">Order Items</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="bg-gray-50 border-b-2 border-gray-200">
							<th class="px-6 py-3 text-left text-sm font-semibold text-gray-600">#SN</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-gray-600">Product</th>
							<th class="px-6 py-3 text-center text-sm font-semibold text-gray-600">Quantity</th>
							<th class="px-6 py-3 text-right text-sm font-semibold text-gray-600">Price</th>
							<th class="px-6 py-3 text-right text-sm font-semibold text-gray-600">Total</th>
						</tr>
					</thead>
					<tbody>
						{#if orderDetails.items.length === 0}
							<tr>
								<td colspan="5" class="px-6 py-8 text-center text-gray-400">
									<p class="text-lg">No items found for this order.</p>
								</td>
							</tr>
						{/if}
						{#each orderDetails.items as item, index}
							<tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4">
									<span
										class="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full font-semibold text-sm"
										>{index + 1}</span
									>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-4">
										<div class="avatar">
											<div class="mask mask-rounded h-14 w-14 flex-shrink-0">
												<img src={getImageUrl(item.image)} alt={item.name} class="object-cover" />
											</div>
										</div>
										<div>
											<p class="font-semibold text-gray-800">{item.name}</p>
											{#if item.size}
												<p class="text-xs text-gray-500">Size: {item.size}</p>
											{/if}
											{#if item.color}
												<p class="text-xs text-gray-500">Color: {item.color}</p>
											{/if}
										</div>
									</div>
								</td>
								<td class="px-6 py-4 text-center">
									<span
										class="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold"
										>{item.quantity}</span
									>
								</td>
								<td class="px-6 py-4 text-right">
									<p class="text-gray-800 font-medium">Rs. {item.price}</p>
								</td>
								<td class="px-6 py-4 text-right">
									<p class="text-green-600 font-bold text-lg">Rs. {item.subtotal}</p>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Order Summary -->
			{#if orderDetails.subtotal !== undefined}
				<div class="bg-gray-50 px-6 py-6 border-t-2 border-gray-200">
					<div class="flex flex-col md:flex-row justify-end gap-8 max-w-2xl ml-auto">
						<div class="flex justify-between items-center gap-8">
							<span class="text-gray-600 font-medium">Subtotal:</span>
							<span class="text-lg font-semibold text-gray-800">Rs. {orderDetails.subtotal}</span>
						</div>
						{#if orderDetails.shipping > 0}
							<div class="flex justify-between items-center gap-8">
								<span class="text-gray-600 font-medium">Shipping:</span>
								<span class="text-lg font-semibold text-gray-800">Rs. {orderDetails.shipping}</span>
							</div>
						{/if}
						{#if orderDetails.tax > 0}
							<div class="flex justify-between items-center gap-8">
								<span class="text-gray-600 font-medium">Tax:</span>
								<span class="text-lg font-semibold text-gray-800">Rs. {orderDetails.tax}</span>
							</div>
						{/if}
						{#if orderDetails.discount > 0}
							<div class="flex justify-between items-center gap-8">
								<span class="text-gray-600 font-medium">Discount:</span>
								<span class="text-lg font-semibold text-red-600">-Rs. {orderDetails.discount}</span>
							</div>
						{/if}
						<div class="flex justify-between items-center gap-8 border-l-2 border-gray-300 pl-8">
							<span class="text-gray-800 font-bold">Total:</span>
							<span class="text-2xl font-bold text-green-600">Rs. {orderDetails.total}</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Status Update Modal -->
	{#if isModalOpen}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
				<h3 class="text-xl font-bold text-gray-800 mb-2">Update Order Status</h3>
				<p class="text-sm text-gray-500 mb-4">
					Current Status: <span class="font-semibold text-gray-700"
						>{orderDetails.status.toUpperCase()}</span
					>
				</p>

				{#if errorMessage}
					<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
						<p class="text-sm text-red-700">{errorMessage}</p>
					</div>
				{/if}

				{#if getAvailableStatuses(orderDetails.status).length === 0}
					<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
						<p class="text-sm text-yellow-800">
							{orderDetails.status === 'cancelled'
								? 'This order is cancelled and cannot be updated.'
								: 'This order has reached its final status.'}
						</p>
					</div>
				{:else}
					<p class="text-gray-600 mb-6 text-sm">Select a new status for this order:</p>

					<div class="space-y-3 mb-6">
						{#each allStatusOptions as status}
							{@const isCurrentStatus = status === orderDetails.status}
							{@const isAvailable = getAvailableStatuses(orderDetails.status).includes(status)}
							{@const isPreviousStatus =
								statusProgression.indexOf(status) < statusProgression.indexOf(orderDetails.status)}

							<button
								class={`w-full px-4 py-3 rounded-lg font-semibold transition-all text-sm ${
									isCurrentStatus
										? 'bg-gray-100 text-gray-600 cursor-not-allowed border-2 border-gray-300'
										: isAvailable
											? `${
													status === 'processing'
														? 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-2 border-blue-300'
														: status === 'delivered'
															? 'bg-cyan-100 hover:bg-cyan-200 text-cyan-800 border-2 border-cyan-300'
															: status === 'cancelled'
																? 'bg-red-100 hover:bg-red-200 text-red-800 border-2 border-red-300'
																: 'bg-green-100 hover:bg-green-200 text-green-800 border-2 border-green-300'
												}`
											: isPreviousStatus
												? 'bg-gray-50 text-gray-400 cursor-not-allowed border-2 border-gray-200'
												: 'bg-gray-50 text-gray-400 cursor-not-allowed border-2 border-gray-200'
								}`}
								disabled={!isAvailable || isUpdating}
								onclick={() => updateStatus(status)}
								title={isCurrentStatus
									? 'Current status'
									: !isAvailable
										? 'Cannot revert or skip status'
										: ''}
							>
								{status.charAt(0).toUpperCase() + status.slice(1)}
								{#if isCurrentStatus}
									<span class="text-xs ml-2">(Current)</span>
								{:else if isPreviousStatus}
									<span class="text-xs ml-2">(Cannot revert)</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}

				<div class="flex gap-3">
					<button
						class="flex-1 btn btn-outline btn-sm"
						onclick={() => (isModalOpen = false)}
						disabled={isUpdating}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
