<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { showSuccess, showError } from '$lib/stores/toast';
	import { slide, fade } from 'svelte/transition';
	const { data } = $props();

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

	let shippingAddresses = $state<any[]>(data.shippingAddress || []);
	let billingAddresses = $state<any[]>(data.billingAddress || []);
	let processingAction = $state<'set-default' | 'delete' | 'create' | 'edit' | null>(null);

	$effect(() => {
		shippingAddresses = data.shippingAddress || [];
		billingAddresses = data.billingAddress || [];
	});

	async function refreshAddresses() {
		await invalidateAll();
	}

	// Forms
	let showShippingForm = $state(false);
	let showBillingForm = $state(false);
	let editingAddressId = $state<number | null>(null);
	let activeTab = $state<'shipping' | 'billing'>('shipping');

	let shippingForm = $state<Partial<Address>>(getEmptyForm('shipping'));
	let billingForm = $state<Partial<Address>>(getEmptyForm('billing'));
	let formErrors = $state<Record<string, string>>({});

	function getEmptyForm(type: 'shipping' | 'billing'): Partial<Address> {
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

	function openShippingForm(address?: any) {
		if (address) {
			editingAddressId = address.id ?? null;
			shippingForm = { ...address };
		} else {
			editingAddressId = null;
			shippingForm = getEmptyForm('shipping');
		}
		formErrors = {};
		showShippingForm = true;
	}

	function openBillingForm(address?: any) {
		if (address) {
			editingAddressId = address.id ?? null;
			billingForm = { ...address };
		} else {
			editingAddressId = null;
			billingForm = getEmptyForm('billing');
		}
		formErrors = {};
		showBillingForm = true;
	}

	function closeForms() {
		showShippingForm = false;
		showBillingForm = false;
		editingAddressId = null;
		formErrors = {};
	}

	function validateForm(form: Partial<Address>): boolean {
		formErrors = {};
		if (!form.full_name?.trim()) formErrors.full_name = 'Full name is required';
		if (!form.phone?.trim()) formErrors.phone = 'Phone number is required';
		if (!form.address_line1?.trim()) formErrors.address_line1 = 'Address is required';
		if (!form.city?.trim()) formErrors.city = 'City is required';
		if (!form.postal_code?.trim()) formErrors.postal_code = 'Postal code is required';
		return Object.keys(formErrors).length === 0;
	}

	let defaultFormEl: HTMLFormElement | null = $state(null);
	let defaultAddressId = $state('');
	let defaultAddressType = $state('');

	function setDefaultAddress(id: number, type: 'shipping' | 'billing') {
		processingAction = 'set-default';
		defaultAddressId = String(id);
		defaultAddressType = type;
		setTimeout(() => defaultFormEl?.requestSubmit(), 0);
	}

	let deleteFormEl: HTMLFormElement | null = $state(null);
	let deleteAddressId = $state('');
	let deleteAddressType = $state('');

	function deleteAddress(id: number, type: 'shipping' | 'billing') {
		if (!confirm(`Are you sure you want to delete this ${type} address?`)) return;
		processingAction = 'delete';
		deleteAddressId = String(id);
		deleteAddressType = type;
		setTimeout(() => deleteFormEl?.requestSubmit(), 0);
	}
</script>

<div class="page-header">
	<h1>Addresses</h1>
	<p>Manage your shipping and billing addresses.</p>
</div>

<!-- Hidden form for setting default address -->
<form
	method="POST"
	action="?/setDefaultAddress"
	bind:this={defaultFormEl}
	use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				await refreshAddresses();
				processingAction = null;
				showSuccess(result.data.message || 'Default address updated');
			} else if (result.type === 'failure') {
				processingAction = null;
				showError(result.data.message || 'Failed to update default address');
			}
		};
	}}
>
	<input type="hidden" name="address_id" value={defaultAddressId} />
	<input type="hidden" name="address_type" value={defaultAddressType} />
</form>

<!-- Hidden form for deleting address -->
<form
	method="POST"
	action="?/deleteAddress"
	bind:this={deleteFormEl}
	use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				await refreshAddresses();
				processingAction = null;
				showSuccess(result.data.message || 'Address deleted');
			} else if (result.type === 'failure') {
				processingAction = null;
				showError(result.data.message || 'Failed to delete address');
			}
		};
	}}
>
	<input type="hidden" name="address_id" value={deleteAddressId} />
	<input type="hidden" name="address_type" value={deleteAddressType} />
</form>

{#if processingAction}
	<div class="processing-overlay" transition:fade>
		<div class="processing-box">
			<div class="spinner"></div>
			<p>
				{#if processingAction === 'set-default'}
					Setting default address...
				{:else if processingAction === 'delete'}
					Deleting address...
				{:else if processingAction === 'edit'}
					Updating address...
				{:else if processingAction === 'create'}
					Saving address...
				{/if}
			</p>
		</div>
	</div>
{/if}

<!-- Tabs -->
<div class="tab-switcher">
	<button
		class="tab-btn"
		class:active={activeTab === 'shipping'}
		onclick={() => {
			activeTab = 'shipping';
			closeForms();
		}}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.8"
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
		Shipping Addresses
		<span class="tab-count">{shippingAddresses.length}</span>
	</button>
	<button
		class="tab-btn"
		class:active={activeTab === 'billing'}
		onclick={() => {
			activeTab = 'billing';
			closeForms();
		}}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.8"
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
		Billing Addresses
		<span class="tab-count">{billingAddresses.length}</span>
	</button>
</div>

<!-- Shipping Addresses -->
{#if activeTab === 'shipping'}
	<div class="card">
		<div class="card-header">
			<h2>Shipping Addresses</h2>
			{#if !showShippingForm}
				<button class="btn-add" onclick={() => openShippingForm()}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						width="16"
						height="16"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Add Address
				</button>
			{/if}
		</div>

		<!-- Address Form -->
		<!-- Address List -->
		<div class="address-list">
			{#if shippingAddresses.length > 0}
				{#each shippingAddresses as addr}
					<div
						class="address-card"
						class:address-default={addr.is_default}
						class:address-disabled={!addr.is_default}
					>
						<div class="address-card-header">
							<div class="address-name">
								{addr.full_name || 'Shipping Address'}
								{#if addr.is_default}
									<span class="default-badge">Default</span>
								{/if}
							</div>
							<div class="address-actions">
								{#if !addr.is_default}
									<button
										class="btn-set-default"
										onclick={() => setDefaultAddress(addr.id!, 'shipping')}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.8"
											stroke="currentColor"
											width="14"
											height="14"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										Set as Default
									</button>
									<button
										class="btn-delete"
										onclick={() => deleteAddress(addr.id!, 'shipping')}
										aria-label="Delete"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.8"
											stroke="currentColor"
											width="16"
											height="16"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
											/>
										</svg>
									</button>
								{/if}
								<button
									class="btn-icon"
									onclick={() => openShippingForm(addr)}
									aria-label="Edit"
									disabled={!addr.is_default}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.8"
										stroke="currentColor"
										width="16"
										height="16"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
										/>
									</svg>
								</button>
							</div>
						</div>
						<div class="address-body">
							<p class="addr-line">{addr.address_line1}</p>
							{#if addr.address_line2}
								<p class="addr-line">{addr.address_line2}</p>
							{/if}
							<p class="addr-line">
								{addr.city}{addr.state ? `, ${addr.state}` : ''}
								{addr.postal_code}
							</p>
							<p class="addr-line">{addr.country || 'Nepal'}</p>
							{#if addr.phone}
								<p class="addr-contact">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										width="14"
										height="14"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
										/>
									</svg>
									{addr.phone}
								</p>
							{/if}
							{#if addr.email}
								<p class="addr-contact">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										width="14"
										height="14"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
										/>
									</svg>
									{addr.email}
								</p>
							{/if}
						</div>
					</div>
				{/each}
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
								d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
							/>
						</svg>
					</div>
					<p>No shipping addresses saved yet.</p>
					<button class="btn-primary" onclick={() => openShippingForm()}
						>Add Shipping Address</button
					>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Billing Addresses -->
{#if activeTab === 'billing'}
	<div class="card">
		<div class="card-header">
			<h2>Billing Addresses</h2>
			{#if !showBillingForm}
				<button class="btn-add" onclick={() => openBillingForm()}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						width="16"
						height="16"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Add Address
				</button>
			{/if}
		</div>

		<div class="address-list">
			{#if billingAddresses.length > 0}
				{#each billingAddresses as addr}
					<div
						class="address-card"
						class:address-default={addr.is_default}
						class:address-disabled={!addr.is_default}
					>
						<div class="address-card-header">
							<div class="address-name">
								{addr.full_name || 'Billing Address'}
								{#if addr.is_default}
									<span class="default-badge">Default</span>
								{/if}
							</div>
							<div class="address-actions">
								{#if !addr.is_default}
									<button
										class="btn-set-default"
										onclick={() => setDefaultAddress(addr.id!, 'billing')}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.8"
											stroke="currentColor"
											width="14"
											height="14"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										Set as Default
									</button>
									<button
										class="btn-delete"
										onclick={() => deleteAddress(addr.id!, 'billing')}
										aria-label="Delete"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.8"
											stroke="currentColor"
											width="16"
											height="16"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
											/>
										</svg>
									</button>
								{/if}
								<button
									class="btn-icon"
									onclick={() => openBillingForm(addr)}
									aria-label="Edit"
									disabled={!addr.is_default}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.8"
										stroke="currentColor"
										width="16"
										height="16"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
										/>
									</svg>
								</button>
							</div>
						</div>
						<div class="address-body">
							<p class="addr-line">{addr.address_line1}</p>
							{#if addr.address_line2}
								<p class="addr-line">{addr.address_line2}</p>
							{/if}
							<p class="addr-line">
								{addr.city}{addr.state ? `, ${addr.state}` : ''}
								{addr.postal_code}
							</p>
							<p class="addr-line">{addr.country || 'Nepal'}</p>
							{#if addr.phone}
								<p class="addr-contact">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										width="14"
										height="14"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
										/>
									</svg>
									{addr.phone}
								</p>
							{/if}
							{#if addr.email}
								<p class="addr-contact">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										width="14"
										height="14"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
										/>
									</svg>
									{addr.email}
								</p>
							{/if}
						</div>
					</div>
				{/each}
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
								d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
							/>
						</svg>
					</div>
					<p>No billing addresses saved yet.</p>
					<button class="btn-primary" onclick={() => openBillingForm()}>Add Billing Address</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if showShippingForm || showBillingForm}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={closeForms} transition:fade>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()} transition:slide>
			<div class="modal-header">
				<h3>
					{#if showShippingForm}
						{editingAddressId ? 'Edit' : 'Add New'} Shipping Address
					{:else}
						{editingAddressId ? 'Edit' : 'Add New'} Billing Address
					{/if}
				</h3>
				<button class="modal-close" onclick={closeForms} aria-label="Close">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						width="20"
						height="20"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="modal-body">
				{#if showShippingForm}
					<form
						method="POST"
						action="?/updateShippingAddress"
						use:enhance={() => {
							if (!validateForm(shippingForm)) return async () => {};
							processingAction = editingAddressId ? 'edit' : 'create';
							return async ({ result }) => {
								if (result.type === 'success') {
									closeForms();
									await refreshAddresses();
									processingAction = null;
									showSuccess('Shipping address saved successfully');
								} else if (result.type === 'failure') {
									processingAction = null;
									showError('Failed to save address');
								}
							};
						}}
					>
						<input type="hidden" name="id" value={editingAddressId ?? ''} />

						<div class="form-row form-row-3">
							<div class="form-group">
								<label>Full Name <span class="req">*</span></label>
								<input
									type="text"
									name="full_name"
									bind:value={shippingForm.full_name}
									placeholder="Full name"
									class={formErrors.full_name ? 'error' : ''}
								/>
								{#if formErrors.full_name}<span class="field-error">{formErrors.full_name}</span
									>{/if}
							</div>
							<div class="form-group">
								<label>Phone <span class="req">*</span></label>
								<input
									type="tel"
									name="phone"
									bind:value={shippingForm.phone}
									placeholder="Phone number"
									class={formErrors.phone ? 'error' : ''}
								/>
								{#if formErrors.phone}<span class="field-error">{formErrors.phone}</span>{/if}
							</div>
							<div class="form-group">
								<label>Email</label>
								<input
									type="email"
									name="email"
									bind:value={shippingForm.email}
									placeholder="Email"
								/>
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label>Address Line 1 <span class="req">*</span></label>
								<input
									type="text"
									name="address_line1"
									bind:value={shippingForm.address_line1}
									placeholder="Street address"
									class={formErrors.address_line1 ? 'error' : ''}
								/>
								{#if formErrors.address_line1}<span class="field-error"
										>{formErrors.address_line1}</span
									>{/if}
							</div>
							<div class="form-group">
								<label>Address Line 2</label>
								<input
									type="text"
									name="address_line2"
									bind:value={shippingForm.address_line2}
									placeholder="Apt, suite, etc."
								/>
							</div>
						</div>

						<div class="form-row form-row-3">
							<div class="form-group">
								<label>City <span class="req">*</span></label>
								<input
									type="text"
									name="city"
									bind:value={shippingForm.city}
									placeholder="City"
									class={formErrors.city ? 'error' : ''}
								/>
								{#if formErrors.city}<span class="field-error">{formErrors.city}</span>{/if}
							</div>
							<div class="form-group">
								<label>State/Province</label>
								<input
									type="text"
									name="state"
									bind:value={shippingForm.state}
									placeholder="State"
								/>
							</div>
							<div class="form-group">
								<label>Postal Code <span class="req">*</span></label>
								<input
									type="text"
									name="postal_code"
									bind:value={shippingForm.postal_code}
									placeholder="Postal code"
									class={formErrors.postal_code ? 'error' : ''}
								/>
								{#if formErrors.postal_code}<span class="field-error">{formErrors.postal_code}</span
									>{/if}
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label>Country</label>
								<input
									type="text"
									name="country"
									bind:value={shippingForm.country}
									placeholder="Country"
								/>
							</div>
						</div>

						<div class="form-actions">
							<button
								type="button"
								class="btn-secondary"
								onclick={closeForms}
								disabled={processingAction !== null}>Cancel</button
							>
							<button type="submit" class="btn-primary" disabled={processingAction !== null}>
								{#if processingAction === 'create' || processingAction === 'edit'}
									Processing...
								{:else}
									{editingAddressId ? 'Update Address' : 'Save Address'}
								{/if}
							</button>
						</div>
					</form>
				{:else if showBillingForm}
					<form
						method="POST"
						action="?/updateBillingAddress"
						use:enhance={() => {
							if (!validateForm(billingForm)) return async () => {};
							processingAction = editingAddressId ? 'edit' : 'create';
							return async ({ result }) => {
								if (result.type === 'success') {
									closeForms();
									await refreshAddresses();
									processingAction = null;
									showSuccess(result.data.message || 'Billing address saved successfully');
								} else if (result.type === 'failure') {
									processingAction = null;
									showError(result.data.message || 'Failed to save address');
								}
							};
						}}
					>
						<input type="hidden" name="id" value={editingAddressId ?? ''} />

						<div class="form-row form-row-3">
							<div class="form-group">
								<label>Full Name <span class="req">*</span></label>
								<input
									type="text"
									name="full_name"
									bind:value={billingForm.full_name}
									placeholder="Full name"
									class={formErrors.full_name ? 'error' : ''}
								/>
								{#if formErrors.full_name}<span class="field-error">{formErrors.full_name}</span
									>{/if}
							</div>
							<div class="form-group">
								<label>Phone <span class="req">*</span></label>
								<input
									type="tel"
									name="phone"
									bind:value={billingForm.phone}
									placeholder="Phone number"
									class={formErrors.phone ? 'error' : ''}
								/>
								{#if formErrors.phone}<span class="field-error">{formErrors.phone}</span>{/if}
							</div>
							<div class="form-group">
								<label>Email</label>
								<input
									type="email"
									name="email"
									bind:value={billingForm.email}
									placeholder="Email"
								/>
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label>Address Line 1 <span class="req">*</span></label>
								<input
									type="text"
									name="address_line1"
									bind:value={billingForm.address_line1}
									placeholder="Street address"
									class={formErrors.address_line1 ? 'error' : ''}
								/>
								{#if formErrors.address_line1}<span class="field-error"
										>{formErrors.address_line1}</span
									>{/if}
							</div>
							<div class="form-group">
								<label>Address Line 2</label>
								<input
									type="text"
									name="address_line2"
									bind:value={billingForm.address_line2}
									placeholder="Apt, suite, etc."
								/>
							</div>
						</div>

						<div class="form-row form-row-3">
							<div class="form-group">
								<label>City <span class="req">*</span></label>
								<input
									type="text"
									name="city"
									bind:value={billingForm.city}
									placeholder="City"
									class={formErrors.city ? 'error' : ''}
								/>
								{#if formErrors.city}<span class="field-error">{formErrors.city}</span>{/if}
							</div>
							<div class="form-group">
								<label>State/Province</label>
								<input
									type="text"
									name="state"
									bind:value={billingForm.state}
									placeholder="State"
								/>
							</div>
							<div class="form-group">
								<label>Postal Code <span class="req">*</span></label>
								<input
									type="text"
									name="postal_code"
									bind:value={billingForm.postal_code}
									placeholder="Postal code"
									class={formErrors.postal_code ? 'error' : ''}
								/>
								{#if formErrors.postal_code}<span class="field-error">{formErrors.postal_code}</span
									>{/if}
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label>Country</label>
								<input
									type="text"
									name="country"
									bind:value={billingForm.country}
									placeholder="Country"
								/>
							</div>
						</div>

						<div class="form-actions">
							<button
								type="button"
								class="btn-secondary"
								onclick={closeForms}
								disabled={processingAction !== null}>Cancel</button
							>
							<button type="submit" class="btn-primary" disabled={processingAction !== null}>
								{#if processingAction === 'create' || processingAction === 'edit'}
									Processing...
								{:else}
									{editingAddressId ? 'Update Address' : 'Save Address'}
								{/if}
							</button>
						</div>
					</form>
				{/if}
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
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.04),
			0 2px 12px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.04);
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

	.btn-add {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 8px;
		border: none;
		background: #0b5d1e;
		color: #ffffff;
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.btn-add:hover {
		background: #16a34a;
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

	/* ===== Form ===== */
	.form-title {
		font-size: 15px;
		font-weight: 700;
		color: #111827;
		margin-bottom: 20px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
		margin-bottom: 16px;
	}

	.form-row-3 {
		grid-template-columns: repeat(3, 1fr);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.form-group label {
		font-size: 12.5px;
		font-weight: 600;
		color: #374151;
	}

	.req {
		color: #dc2626;
	}

	.form-group input {
		padding: 9px 12px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 13px;
		color: #111827;
		background: #ffffff;
		transition: border-color 0.2s;
		font-family: inherit;
	}

	.form-group input:focus {
		outline: none;
		border-color: #0b5d1e;
		box-shadow: 0 0 0 3px rgba(11, 93, 30, 0.1);
	}

	.form-group input.error {
		border-color: #dc2626;
	}

	.field-error {
		font-size: 11px;
		color: #dc2626;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 8px;
	}

	.btn-secondary {
		padding: 9px 18px;
		border-radius: 8px;
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
		padding: 9px 18px;
		border-radius: 8px;
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
	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ===== Address List ===== */
	.address-list {
		padding: 16px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 16px;
	}

	.address-card {
		border: 1px solid rgba(0, 0, 0, 0.06);
		border-radius: 12px;
		padding: 18px;
		transition: all 0.2s;
	}

	.address-card:hover {
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
	}

	.address-card.address-default {
		border: 2px solid #0b5d1e;
		background: #f0fdf4;
		box-shadow: 0 2px 12px rgba(11, 93, 30, 0.1);
	}

	.address-card.address-disabled {
		opacity: 0.55;
	}

	.address-card.address-disabled .address-body {
		pointer-events: none;
	}

	.address-card.address-disabled .btn-icon {
		pointer-events: none;
	}

	.address-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.address-name {
		font-size: 14px;
		font-weight: 600;
		color: #111827;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.default-badge {
		background: rgba(11, 93, 30, 0.1);
		color: #0b5d1e;
		font-size: 10.5px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 10px;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.btn-icon {
		background: none;
		border: 1px solid transparent;
		color: #6b7280;
		padding: 6px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-icon:hover {
		background: #f3f4f6;
		color: #0b5d1e;
		border-color: #e5e7eb;
	}

	.btn-icon:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		pointer-events: auto;
	}

	.address-actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.btn-set-default {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 5px 10px;
		border-radius: 6px;
		border: 1px solid #0b5d1e;
		background: transparent;
		color: #0b5d1e;
		font-size: 11.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
		white-space: nowrap;
	}

	.btn-set-default:hover {
		background: #0b5d1e;
		color: #ffffff;
	}

	.btn-delete {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 5px 10px;
		border-radius: 6px;
		border: 1px solid #dc2626;
		background: transparent;
		color: #dc2626;
		font-size: 11.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
		white-space: nowrap;
	}

	.btn-delete:hover {
		background: #dc2626;
		color: #ffffff;
	}

	.address-body {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.addr-line {
		font-size: 13px;
		color: #4b5563;
		margin: 0;
		line-height: 1.5;
	}

	.addr-contact {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12.5px;
		color: #6b7280;
		margin: 4px 0 0;
	}

	/* ===== Empty State ===== */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px 20px;
		color: #6b7280;
		gap: 12px;
		grid-column: 1 / -1;
	}

	.empty-icon {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: #f3f4f6;
		display: flex;
		align-items: center;
		justify-content: center;
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
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.modal-content {
		background: #ffffff;
		border-radius: 16px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	.modal-header h3 {
		font-size: 17px;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.modal-close {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 4px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.modal-close:hover {
		background: #f3f4f6;
		color: #111827;
	}

	.modal-body {
		padding: 24px;
	}

	.modal-body .form-actions {
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	@media (max-width: 768px) {
		.page-header h1 {
			font-size: 20px;
		}

		.tab-switcher {
			flex-direction: column;
		}

		.form-row-3 {
			grid-template-columns: 1fr;
		}

		.address-list {
			grid-template-columns: 1fr;
		}

		.modal-content {
			max-height: 95vh;
		}
	}

	/* ===== Processing Overlay ===== */
	.processing-overlay {
		position: fixed;
		inset: 0;
		background: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	}

	.processing-box {
		background: #ffffff;
		border-radius: 12px;
		padding: 32px 40px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
	}

	.processing-box p {
		font-size: 14px;
		font-weight: 600;
		color: #374151;
		margin: 0;
	}
</style>
