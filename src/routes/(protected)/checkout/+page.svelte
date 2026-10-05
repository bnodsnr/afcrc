<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import { isLoggedIn } from '$lib/stores/auth';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	interface CheckoutItem {
		id: number;
		cartId?: number;
		cartItemId?: number;
		name: string;
		image: string;
		price: number;
		originalPrice?: number;
		size: string;
		color: string;
		colorHex: string;
		quantity: number;
	}

	interface Address {
		id: number;
		address_type: 'shipping' | 'billing';
		full_name?: string;
		phone?: string;
		email?: string;
		address_line1: string;
		address_line2?: string;
		city: string;
		state: string;
		postal_code: string;
		country: string;
		is_default: boolean;
	}

	interface PaymentMethod {
		type: 'cod' | 'esewa';
	}

	let checkoutItems: CheckoutItem[] = $state([]);
	let showQRCode = $state(false);
	let currentStep = $state(1);
	let isSubmitting = $state(false);

	let selectedShippingId: number | null = $state(null);
	let selectedBillingId: number | null = $state(null);
	let billingSameAsShipping = $state(false);

	let paymentMethod: PaymentMethod = $state({ type: 'cod' });
	let promoCode = $state('');
	let promoDiscount = $state(0);
	let isPromoApplied = $state(false);
	let errors: { [key: string]: string } = $state({});

	let shippingAddresses: Address[] = $derived(data.shippingAddresses ?? []);
	let billingAddresses: Address[] = $derived(data.billingAddresses ?? []);

	let selectedShippingAddress: Address | null = $derived(
		shippingAddresses.find((a) => a.id === selectedShippingId) ?? null
	);

	let selectedBillingAddress: Address | null = $derived(
		billingSameAsShipping
			? selectedShippingAddress
			: billingAddresses.find((a) => a.id === selectedBillingId) ?? null
	);

	onMount(async () => {
		if (!get(isLoggedIn)) {
			goto('/login?redirectTo=%2Fcheckout', { replaceState: true });
			return;
		}

		if (typeof sessionStorage !== 'undefined') {
			const stored = sessionStorage.getItem('checkoutItems');
			if (stored) {
				try {
					checkoutItems = JSON.parse(stored);
				} catch {
					goto('/cart');
					return;
				}
			} else {
				goto('/cart');
				return;
			}
		}

		if (shippingAddresses.length > 0) {
			const def = shippingAddresses.find((a) => a.is_default) ?? shippingAddresses[0];
			selectedShippingId = def.id;
		}
		if (billingAddresses.length > 0) {
			const def = billingAddresses.find((a) => a.is_default) ?? billingAddresses[0];
			selectedBillingId = def.id;
			billingSameAsShipping = false;
		} else {
			billingSameAsShipping = true;
		}
	});

	let subtotal = $derived(checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
	let shipping = $derived(subtotal > 50 ? 0 : 8.99);
	let tax = $derived(subtotal * 0.08);
	let discount = $derived(isPromoApplied ? subtotal * (promoDiscount / 100) : 0);
	let total = $derived(subtotal + shipping + tax - discount);

	function validateStep(step: number): boolean {
		errors = {};
		if (step === 1) {
			if (!selectedShippingAddress) {
				errors.shipping = 'Please select a shipping address';
				return false;
			}
			if (!selectedBillingAddress) {
				errors.billing = 'Please select a billing address';
				return false;
			}
		}
		if (step === 2) {
			if (!paymentMethod.type) {
				errors.payment = 'Please select a payment method';
				return false;
			}
		}
		return true;
	}

	function nextStep() {
		if (!validateStep(currentStep)) return;
		currentStep++;
	}

	function prevStep() {
		currentStep--;
	}

	function applyPromoCode() {
		const validCodes: Record<string, number> = { HEMP10: 10, SAVE15: 15, NEWCUSTOMER: 20 };
		const code = promoCode.toUpperCase();
		if (validCodes[code]) {
			isPromoApplied = true;
			promoDiscount = validCodes[code];
		} else {
			alert('Invalid promo code');
		}
	}

	$effect(() => {
		if (form?.success && form?.order) {
			if (typeof sessionStorage !== 'undefined') {
				sessionStorage.setItem(
					'orderConfirmation',
					JSON.stringify({
						...form.order,
						shippingAddress: selectedShippingAddress,
						paymentMethodType: paymentMethod.type,
						subtotal,
						shipping,
						tax,
						discount,
						total,
						promoCode: isPromoApplied ? promoCode : null,
						promoDiscount: isPromoApplied ? promoDiscount : 0
					})
				);
				sessionStorage.removeItem('checkoutItems');
			}
			goto('/order-confirmation');
		}
	});

	function handleOrderSubmit() {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			isSubmitting = false;
			if (result.type === 'failure') {
				alert(result.data?.message || 'Failed to place order. Please try again.');
				return;
			}
			await update();
		};
	}
</script>

<svelte:head>
	<title>Checkout - Himalayan Hemp Heaven</title>
</svelte:head>

<main class="checkout-page">
	<div class="container">
		<nav class="breadcrumb">
			<a href="/">Home</a>
			<span class="separator">></span>
			<a href="/cart">Cart</a>
			<span class="separator">></span>
			<span class="current">Checkout</span>
		</nav>

		<div class="progress-steps">
			<div class="step {currentStep >= 1 ? 'active' : ''} {currentStep > 1 ? 'completed' : ''}">
				<div class="step-number">1</div>
				<span class="step-label">Address</span>
			</div>
			<div class="step {currentStep >= 2 ? 'active' : ''} {currentStep > 2 ? 'completed' : ''}">
				<div class="step-number">2</div>
				<span class="step-label">Payment</span>
			</div>
			<div class="step {currentStep >= 3 ? 'active' : ''}">
				<div class="step-number">3</div>
				<span class="step-label">Review</span>
			</div>
		</div>

		<div class="checkout-layout">
			<div class="checkout-main">
				{#if currentStep === 1}
					<div class="step-content">
						<div class="step-header">
							<h2>Shipping Address</h2>
							<p>Select your shipping address</p>
						</div>

						<div class="address-section">
							<div class="address-list">
								{#each shippingAddresses as address}
									<label class="address-option">
										<input
											type="radio"
											name="shippingAddress"
											value={address.id}
											bind:group={selectedShippingId}
										/>
										<div class="address-option-content">
											<div class="address-option-header">
												<span class="address-name">{address.full_name || 'Address'}</span>
												{#if address.is_default}
													<span class="default-badge">Default</span>
												{/if}
											</div>
											<p class="address-detail">{address.address_line1}</p>
											<p class="address-detail">{address.city}, {address.state} {address.postal_code}</p>
											<p class="address-detail">{address.country}</p>
											{#if address.phone}
												<p class="address-contact">📞 {address.phone}</p>
											{/if}
											{#if address.email}
												<p class="address-contact">📧 {address.email}</p>
											{/if}
										</div>
									</label>
								{:else}
									<div class="no-address-message">
										<p>No shipping addresses found. Please add one in your account.</p>
										<a href="/myaccount/addresses" class="add-address-link">Add Address</a>
									</div>
								{/each}
							</div>
						</div>

						{#if errors.shipping}
							<div class="error-message-box">{errors.shipping}</div>
						{/if}
					</div>

					<div class="step-content">
						<div class="step-header">
							<h2>Billing Address</h2>
							<p>Select your billing address</p>
						</div>

						<div class="billing-toggle">
							<label class="toggle-label">
								<input type="checkbox" bind:checked={billingSameAsShipping} />
								<span class="toggle-text">Billing address same as shipping</span>
							</label>
						</div>

						{#if !billingSameAsShipping}
							<div class="address-section">
								<div class="address-list">
									{#each billingAddresses as address}
										<label class="address-option">
											<input
												type="radio"
												name="billingAddress"
												value={address.id}
												bind:group={selectedBillingId}
											/>
											<div class="address-option-content">
												<div class="address-option-header">
													<span class="address-name">{address.full_name || 'Address'}</span>
													{#if address.is_default}
														<span class="default-badge">Default</span>
													{/if}
												</div>
												<p class="address-detail">{address.address_line1}</p>
												<p class="address-detail">{address.city}, {address.state} {address.postal_code}</p>
												<p class="address-detail">{address.country}</p>
												{#if address.phone}
													<p class="address-contact">📞 {address.phone}</p>
												{/if}
												{#if address.email}
													<p class="address-contact">📧 {address.email}</p>
												{/if}
											</div>
										</label>
									{:else}
										<div class="no-address-message">
											<p>No billing addresses found.</p>
											<a href="/myaccount/addresses" class="add-address-link">Add Address</a>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if errors.billing}
							<div class="error-message-box">{errors.billing}</div>
						{/if}
					</div>
				{:else if currentStep === 2}
					<div class="step-content">
						<div class="step-header">
							<h2>Payment Method</h2>
							<p>Choose your preferred payment method</p>
						</div>

						<div class="addresses-summary-row">
							{#if selectedShippingAddress}
								<div class="mini-address-card">
									<div class="mini-address-header">
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18">
											<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
										</svg>
										<span>Shipping to</span>
									</div>
									<p class="mini-name">{selectedShippingAddress.full_name}</p>
									<p class="mini-detail">{selectedShippingAddress.address_line1}, {selectedShippingAddress.city}, {selectedShippingAddress.state} {selectedShippingAddress.postal_code}</p>
								</div>
							{/if}
							{#if selectedBillingAddress}
								<div class="mini-address-card">
									<div class="mini-address-header billing">
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18">
											<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
										</svg>
										<span>Billing to {billingSameAsShipping ? '(Same)' : ''}</span>
									</div>
									<p class="mini-name">{selectedBillingAddress.full_name}</p>
									<p class="mini-detail">{selectedBillingAddress.address_line1}, {selectedBillingAddress.city}, {selectedBillingAddress.state} {selectedBillingAddress.postal_code}</p>
								</div>
							{/if}
						</div>

						<div class="payment-methods">
							<label class="payment-option">
								<input type="radio" name="payment" value="cod" bind:group={paymentMethod.type} onchange={() => { paymentMethod.type = 'cod'; showQRCode = false; }} />
								<div class="payment-option-content">
									<span class="payment-method-label">🚚 Cash on Delivery</span>
									<p class="payment-method-desc">Pay when you receive your order</p>
								</div>
							</label>

							{#if paymentMethod.type === 'cod'}
								<div class="payment-info-box animate-slide-in">
									<h4>Delivery Payment Information</h4>
									<div class="cod-benefits">
										<div class="benefit-item"><span class="benefit-icon">✓</span><p>No payment needed now</p></div>
										<div class="benefit-item"><span class="benefit-icon">✓</span><p>Pay only when delivered</p></div>
										<div class="benefit-item"><span class="benefit-icon">✓</span><p>Secure and convenient</p></div>
									</div>
								</div>
							{/if}

							<label class="payment-option">
								<input type="radio" name="payment" value="esewa" bind:group={paymentMethod.type} onchange={() => { paymentMethod.type = 'esewa'; showQRCode = false; }} />
								<div class="payment-option-content">
									<span class="payment-method-label">💚 QR Code Scan</span>
									<p class="payment-method-desc">Scan the QR code to make payment</p>
								</div>
							</label>

							{#if paymentMethod.type === 'esewa'}
								<div class="payment-info-box animate-slide-in">
									<button class="scan-button" onclick={() => { showQRCode = !showQRCode; }}>
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18">
											<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
											<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
										</svg>
										{showQRCode ? 'Hide QR Code' : 'Scan Now'}
									</button>
									{#if showQRCode}
										<div class="qr-code-container animate-slide-in">
											<img src="/esewa_qr.png" alt="eSewa QR Code" class="qr-code-img" />
											<p class="qr-info-text">Scan with your eSewa app to pay</p>
										</div>
									{/if}
								</div>
							{/if}
						</div>

						{#if errors.payment}
							<div class="error-message-box">{errors.payment}</div>
						{/if}
					</div>
				{:else if currentStep === 3}
					<div class="step-content">
						<div class="step-header">
							<h2>Review Your Order</h2>
							<p>Please review your order before placing it</p>
						</div>

						<div class="order-review">
							<div class="addresses-review-container">
								<div class="address-review-card shipping-review animate-fade-in">
									<div class="address-card-header">
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24" class="address-icon-header">
											<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
										</svg>
										<h3>Shipping Address</h3>
									</div>
									<div class="address-card-content">
										{#if selectedShippingAddress}
											<div class="address-detail">
												<p class="address-name"><strong>{selectedShippingAddress.full_name}</strong></p>
												<p class="address-line"><span class="icon">📍</span> {selectedShippingAddress.address_line1}</p>
												<p class="address-city-state">{selectedShippingAddress.city}, {selectedShippingAddress.state} {selectedShippingAddress.postal_code}</p>
												<p class="address-country">{selectedShippingAddress.country}</p>
												<div class="address-contact-info">
													{#if selectedShippingAddress.email}<p class="contact-item"><span class="icon">📧</span> {selectedShippingAddress.email}</p>{/if}
													{#if selectedShippingAddress.phone}<p class="contact-item"><span class="icon">📞</span> {selectedShippingAddress.phone}</p>{/if}
												</div>
											</div>
										{:else}
											<div class="no-address-message">
												<p class="no-address-text">No shipping address selected</p>
											</div>
										{/if}
										<div class="address-badge shipping-badge">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16">
												<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span>Delivery To</span>
										</div>
									</div>
								</div>

								<div class="address-review-card billing-review animate-fade-in" style="animation-delay: 0.2s;">
									<div class="address-card-header">
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24" class="address-icon-header billing-icon">
											<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
										</svg>
										<h3>Billing Address</h3>
									</div>
									<div class="address-card-content">
										{#if selectedBillingAddress}
											<div class="address-detail">
												<p class="address-name"><strong>{selectedBillingAddress.full_name}</strong></p>
												<p class="address-line"><span class="icon">📍</span> {selectedBillingAddress.address_line1}</p>
												<p class="address-city-state">{selectedBillingAddress.city}, {selectedBillingAddress.state} {selectedBillingAddress.postal_code}</p>
												<p class="address-country">{selectedBillingAddress.country}</p>
												<div class="address-contact-info">
													{#if selectedBillingAddress.email}<p class="contact-item"><span class="icon">📧</span> {selectedBillingAddress.email}</p>{/if}
													{#if selectedBillingAddress.phone}<p class="contact-item"><span class="icon">📞</span> {selectedBillingAddress.phone}</p>{/if}
												</div>
											</div>
										{:else}
											<div class="no-address-message">
												<p class="no-address-text">No billing address selected</p>
											</div>
										{/if}
										<div class="address-badge billing-badge">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16">
												<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span>{billingSameAsShipping ? 'Same as Shipping' : 'Billing'}</span>
										</div>
									</div>
								</div>
							</div>

							<div class="review-section animate-fade-in" style="animation-delay: 0.4s;">
								<h3>Payment Method</h3>
								<div class="payment-display">
									{#if paymentMethod.type === 'cod'}
										<div class="payment-method-box">
											<span class="payment-icon">🚚</span>
											<span>Cash on Delivery</span>
										</div>
									{:else if paymentMethod.type === 'esewa'}
										<div class="payment-method-box">
											<span class="payment-icon">💚</span>
											<span>QR Code Scan</span>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/if}

			<div class="checkout-navigation">
				{#if currentStep > 1}
					<button class="btn-secondary" onclick={prevStep}>← Back</button>
				{/if}
				<div class="nav-spacer"></div>
				{#if currentStep < 3}
					<button class="btn-primary" onclick={nextStep}>Continue</button>
				{:else}
					<form
						method="POST"
						action="?/createOrder"
						use:enhance={() => {
							isSubmitting = true;
							return handleOrderSubmit();
						}}
					>
						<input type="hidden" name="shippingAddressId" value={selectedShippingId ?? ''} />
						<input
							type="hidden"
							name="billingAddressId"
							value={selectedBillingId ?? ''}
						/>
						<input
							type="hidden"
							name="billingSameAsShipping"
							value={billingSameAsShipping ? 'true' : 'false'}
						/>
						<input type="hidden" name="paymentMethod" value={paymentMethod.type} />
						<input
							type="hidden"
							name="items"
							value={JSON.stringify(
								checkoutItems.map((item) => ({
									id: item.id,
									name: item.name,
									price: item.price,
									image: item.image,
									size: item.size,
									color: item.color,
									quantity: item.quantity,
									cartId: item.cartId || null,
									cartItemId: item.cartItemId || null
								}))
							)}
						/>
						<input
							type="hidden"
							name="cartId"
							value={checkoutItems.length > 0 ? checkoutItems[0].cartId ?? '' : ''}
						/>
						<input type="hidden" name="subtotal" value={subtotal.toFixed(2)} />
						<input type="hidden" name="shipping" value={shipping.toFixed(2)} />
						<input type="hidden" name="tax" value={tax.toFixed(2)} />
						<input type="hidden" name="discount" value={discount.toFixed(2)} />
						<input type="hidden" name="total" value={total.toFixed(2)} />
						<input
							type="hidden"
							name="promoCode"
							value={isPromoApplied ? promoCode : ''}
						/>
						<input
							type="hidden"
							name="promoDiscountPercentage"
							value={isPromoApplied ? String(promoDiscount) : '0'}
						/>
						<button
							type="submit"
							class="btn-primary checkout-btn"
							disabled={isSubmitting}
						>
							{isSubmitting ? 'Placing Order...' : 'Confirm Order'}
						</button>
					</form>
				{/if}
			</div>
			</div>

			<div class="order-summary">
				<div class="summary-card">
					<h3>Order Summary</h3>
					<div class="order-items">
						{#each checkoutItems as item}
							<div class="order-item">
								<div class="item-image">
									<img src={item.image} alt={item.name} />
									<span class="item-quantity">{item.quantity}</span>
								</div>
								<div class="item-details">
									<h4>{item.name}</h4>
									<p>Size: {item.size}, Color: {item.color}</p>
									<span class="item-price">Rs. {(item.price * item.quantity).toFixed(2)}</span>
								</div>
							</div>
						{/each}
					</div>

					<div class="promo-section">
						<div class="promo-input">
							<input type="text" placeholder="Discount code" bind:value={promoCode} disabled={isPromoApplied} />
							<button class="apply-btn" onclick={applyPromoCode} disabled={isPromoApplied || !promoCode.trim()}>Apply</button>
						</div>
						{#if isPromoApplied}
							<div class="promo-applied">✓ Discount applied: {promoDiscount}% off</div>
						{/if}
					</div>

					<div class="price-breakdown">
						<div class="price-row">
							<span>Subtotal</span>
							<span>Rs. {subtotal.toFixed(2)}</span>
						</div>
						<div class="price-row">
							<span>Shipping Fee</span>
							<span>{shipping === 0 ? 'Free' : `Rs. ${shipping.toFixed(2)}`}</span>
						</div>
						{#if discount > 0}
							<div class="price-row discount">
								<span>Discount</span>
								<span>-Rs. {discount.toFixed(2)}</span>
							</div>
						{/if}
						<div class="price-divider"></div>
						<div class="price-row total">
							<span>Total</span>
							<span>Rs. {total.toFixed(2)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>

<Footer />

<style>
	.checkout-page { background: #fafafa; min-height: 100vh; padding: 80px 0 40px; }
	.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
	.breadcrumb { margin-bottom: 30px; font-size: 14px; color: #666; }
	.breadcrumb a { color: #059669; text-decoration: none; }
	.breadcrumb a:hover { text-decoration: underline; }
	.separator { margin: 0 8px; color: #ccc; }
	.current { color: #333; font-weight: 500; }

	.progress-steps { display: flex; justify-content: center; margin-bottom: 40px; position: relative; }
	.progress-steps::before { content: ''; position: absolute; top: 50%; left: 20%; right: 20%; height: 2px; background: #e5e7eb; z-index: 1; }
	.step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; background: #fafafa; padding: 0 30px; }
	.step-number { width: 40px; height: 40px; border-radius: 50%; background: #e5e7eb; color: #9ca3af; display: flex; align-items: center; justify-content: center; font-weight: 600; margin-bottom: 8px; transition: all 0.3s ease; }
	.step.active .step-number { background: #059669; color: white; }
	.step.completed .step-number { background: #059669; color: white; }
	.step.completed .step-number::after { content: '✓'; }
	.step-label { font-size: 14px; font-weight: 500; color: #6b7280; }
	.step.active .step-label { color: #059669; }

	.checkout-layout { display: grid; grid-template-columns: 1fr 400px; gap: 40px; }

	.checkout-main { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
	.step-content { margin-bottom: 32px; }
	.step-header { margin-bottom: 32px; text-align: center; }
	.step-header h2 { font-size: 28px; font-weight: 700; color: #09240f; margin-bottom: 8px; }
	.step-header p { color: #6b7280; font-size: 16px; }

	.address-section { margin-bottom: 24px; }
	.address-list { display: flex; flex-direction: column; gap: 12px; }
	.address-option { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; padding: 16px; border: 2px solid #e5e7eb; border-radius: 10px; transition: all 0.3s ease; background: #fff; }
	.address-option:hover { border-color: #1db584; background: #f0fdf4; }
	.address-option input[type='radio'] { cursor: pointer; width: 18px; height: 18px; accent-color: #1db584; margin: 2px 0 0; flex-shrink: 0; }
	.address-option-content { flex: 1; }
	.address-option-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
	.address-option .address-name { font-size: 14px; font-weight: 600; color: #09240f; }
	.default-badge { background: #ecfdf5; color: #047857; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; text-transform: uppercase; }
	.address-option .address-detail { font-size: 13px; color: #6b7280; margin: 2px 0; line-height: 1.4; }
	.address-option .address-contact { font-size: 12px; color: #9ca3af; margin: 4px 0 0; }

	.billing-toggle { margin-bottom: 20px; }
	.toggle-label { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 12px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
	.toggle-label input[type='checkbox'] { width: 18px; height: 18px; accent-color: #059669; cursor: pointer; }
	.toggle-text { font-size: 14px; font-weight: 500; color: #374151; }

	.add-address-link { display: inline-block; margin-top: 12px; padding: 8px 16px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; transition: background 0.2s; }
	.add-address-link:hover { background: #047857; }

	.addresses-summary-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
	@media (max-width: 640px) { .addresses-summary-row { grid-template-columns: 1fr; } }
	.mini-address-card { padding: 16px; background: #f9fdfb; border: 1px solid #e8f5e9; border-radius: 10px; }
	.mini-address-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; }
	.mini-address-header svg { color: #059669; flex-shrink: 0; }
	.mini-address-header.billing { color: #6d28d9; }
	.mini-address-header.billing svg { color: #7c3aed; }
	.mini-name { margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #09240f; }
	.mini-detail { margin: 0; font-size: 13px; color: #6b7280; line-height: 1.4; }

	.payment-methods { margin-bottom: 24px; display: flex; flex-direction: column; gap: 16px; }
	.payment-option { display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 10px; transition: all 0.3s ease; background: #fff; }
	.payment-option:hover { border-color: #1db584; background: #f0fdf4; }
	.payment-option input[type='radio'] { cursor: pointer; width: 18px; height: 18px; accent-color: #1db584; margin: 0; }
	.payment-option-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
	.payment-method-label { font-weight: 600; color: #0b5d1e; font-size: 15px; }
	.payment-method-desc { font-size: 13px; color: #6b7280; margin: 0; }

	.payment-info-box { margin-left: 32px; padding: 16px; background: linear-gradient(135deg, rgba(29,181,132,0.05) 0%, rgba(29,181,132,0.02) 100%); border: 1px solid rgba(29,181,132,0.2); border-radius: 8px; margin-bottom: 16px; }
	.payment-info-box h4 { font-size: 14px; font-weight: 600; color: #0b5d1e; margin: 0 0 12px 0; }
	.cod-benefits { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
	.benefit-item { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #374151; }
	.benefit-icon { color: #1db584; font-weight: 700; flex-shrink: 0; font-size: 16px; }
	.benefit-item p { margin: 0; line-height: 1.4; }

	@keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
	.animate-slide-in { animation: slideInUp 0.4s cubic-bezier(0.34,1.56,0.64,1); }

	.scan-button { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; padding: 10px 20px; background: linear-gradient(135deg, #1db584 0%, #15a372 100%); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 4px 12px rgba(29,181,132,0.3); }
	.scan-button:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(29,181,132,0.4); }
	.scan-button:active { transform: translateY(0); }

	.qr-code-container { margin-top: 16px; padding: 20px; background: linear-gradient(135deg, rgba(29,181,132,0.05) 0%, rgba(29,181,132,0.02) 100%); border: 2px dashed rgba(29,181,132,0.3); border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
	.qr-code-img { width: 200px; height: 200px; border-radius: 8px; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
	.qr-info-text { font-size: 14px; color: #1db584; font-weight: 600; margin: 0; }

	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
	.animate-fade-in { animation: fadeIn 0.6s ease-in-out forwards; }

	.order-review { max-width: 100%; }
	.addresses-review-container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
	@media (max-width: 768px) { .addresses-review-container { grid-template-columns: 1fr; } }
	.address-review-card { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; transition: all 0.3s ease; position: relative; overflow: hidden; }
	.address-review-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #059669, #34d399); transform: translateX(-100%); transition: transform 0.6s ease; }
	.address-review-card:hover::before { transform: translateX(0); }
	.address-review-card:hover { border-color: #10b981; box-shadow: 0 8px 20px rgba(16,185,129,0.12); }
	.shipping-review::before { background: linear-gradient(90deg, #059669, #34d399); }
	.billing-review::before { background: linear-gradient(90deg, #7c3aed, #a78bfa); }
	.address-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6; }
	.address-card-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #09240f; }
	.address-icon-header { width: 24px; height: 24px; color: #059669; flex-shrink: 0; }
	.billing-icon { color: #7c3aed; }
	.address-card-content { position: relative; }
	.address-detail { margin-bottom: 16px; }
	.address-name { font-size: 15px; font-weight: 700; color: #09240f; margin-bottom: 8px; }
	.address-line { font-size: 14px; color: #4b5563; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 6px; }
	.address-line .icon { flex-shrink: 0; margin-top: 2px; }
	.address-city-state { font-size: 14px; color: #6b7280; margin-bottom: 4px; }
	.address-country { font-size: 13px; color: #9ca3af; margin-bottom: 12px; font-weight: 500; }
	.address-contact-info { margin-top: 14px; padding-top: 12px; border-top: 1px solid #f3f4f6; display: flex; flex-direction: column; gap: 6px; }
	.contact-item { font-size: 13px; color: #4b5563; margin: 0; display: flex; align-items: center; gap: 6px; }
	.contact-item .icon { flex-shrink: 0; }
	.address-badge { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-top: 12px; }
	.shipping-badge { background: #ecfdf5; color: #047857; }
	.billing-badge { background: #f5f3ff; color: #6d28d9; }
	.address-badge svg { width: 14px; height: 14px; }

	.no-address-message { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 24px; text-align: center; background: #fafafa; border-radius: 8px; border: 2px dashed #e5e7eb; }
	.no-address-text { margin: 0; font-size: 14px; font-weight: 500; color: #9ca3af; }

	.review-section { margin-bottom: 24px; padding: 24px; border: 2px solid #e5e7eb; border-radius: 12px; background: white; }
	.review-section h3 { font-size: 16px; font-weight: 700; color: #09240f; margin-bottom: 16px; }
	.payment-display { display: flex; align-items: center; gap: 12px; }
	.payment-method-box { display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; flex: 1; }
	.payment-icon { font-size: 24px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; min-height: 28px; }
	.payment-method-box span:last-child { font-size: 14px; font-weight: 500; color: #4b5563; }

	.checkout-navigation { display: flex; align-items: center; gap: 16px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
	.nav-spacer { flex: 1; }
	.btn-primary, .btn-secondary { padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; font-size: 14px; }
	.btn-primary { background: #059669; color: white; }
	.btn-primary:hover { background: #047857; }
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-secondary { background: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db; }
	.btn-secondary:hover { background: #e5e7eb; }
	.checkout-btn { font-size: 16px; padding: 16px 32px; }

	.error-message-box { padding: 12px 16px; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 8px; margin-top: 16px; font-size: 14px; font-weight: 500; }

	.order-summary { position: sticky; top: 100px; height: fit-content; }
	.summary-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
	.summary-card h3 { font-size: 20px; font-weight: 700; color: #09240f; margin-bottom: 20px; }
	.order-items { margin-bottom: 24px; }
	.order-item { display: flex; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6; }
	.order-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
	.item-image { position: relative; width: 60px; height: 60px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
	.item-image img { width: 100%; height: 100%; object-fit: cover; }
	.item-quantity { position: absolute; top: -6px; right: -6px; background: #059669; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; }
	.item-details { flex: 1; }
	.item-details h4 { font-size: 14px; font-weight: 600; color: #09240f; margin-bottom: 4px; line-height: 1.3; }
	.item-details p { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
	.item-price { font-size: 14px; font-weight: 600; color: #059669; }

	.promo-section { margin-bottom: 24px; }
	.promo-input { display: flex; gap: 8px; margin-bottom: 8px; }
	.promo-input input { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
	.apply-btn { background: #059669; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s; font-size: 14px; }
	.apply-btn:hover:not(:disabled) { background: #047857; }
	.apply-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.promo-applied { color: #059669; font-size: 12px; font-weight: 500; }

	.price-breakdown { margin-bottom: 24px; }
	.price-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #4b5563; }
	.price-row.discount { color: #059669; }
	.price-row.total { font-size: 18px; font-weight: 700; color: #09240f; margin-bottom: 0; }
	.price-divider { height: 1px; background: #e5e7eb; margin: 16px 0; }

	@media (max-width: 1024px) { .checkout-layout { grid-template-columns: 1fr 350px; gap: 30px; } }
	@media (max-width: 768px) {
		.checkout-page { padding: 60px 0 20px; }
		.container { padding: 0 16px; }
		.checkout-layout { grid-template-columns: 1fr; gap: 20px; }
		.checkout-main { padding: 20px; }
		.order-summary { position: static; order: -1; }
		.progress-steps { margin-bottom: 20px; }
		.step { padding: 0 20px; }
		.step-number { width: 32px; height: 32px; font-size: 14px; }
		.step-label { font-size: 12px; }
		.checkout-navigation { flex-direction: column; gap: 12px; }
		.nav-spacer { display: none; }
		.btn-primary, .btn-secondary { width: 100%; }
	}
	@media (max-width: 480px) {
		.checkout-main, .summary-card { padding: 16px; }
		.step-header h2 { font-size: 22px; }
		.item-details h4 { font-size: 13px; }
	}
</style>
