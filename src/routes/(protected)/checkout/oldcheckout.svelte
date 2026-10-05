<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import { isLoggedIn, user } from '$lib/stores/auth';
	import { createApi } from '$lib/api';
	import { get } from 'svelte/store';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

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

	interface AddressForm {
		firstName: string;
		lastName: string;
		phone: string;
		email: string;
		address: string;
		city: string;
		state: string;
		postalCode: string;
		country: string;
	}

	interface UserProfile {
		first_name: string;
		last_name: string;
		email: string;
		phone_number: string;
		date_of_birth?: string;
		gender?: string;
		avatar?: string;
	}

	interface PaymentMethod {
		type: 'cod' | 'card' | 'paypal' | 'esewa' | 'khalti';
		cardNumber: string;
		expiryDate: string;
		cvv: string;
		nameOnCard: string;
	}

	let checkoutItems: CheckoutItem[] = $state([]);
	let userProfile: UserProfile | null = $state(null);
	let shippingAddresses: Address[] = $state([]);
	let billingAddresses: Address[] = $state([]);
	let isLoadingProfile = $state(true);
	let selectedShippingAddressId: number | null = $state(null);
	let selectedBillingAddressId: number | null = $state(null);
	let showShippingForm = $state(false);
	let showBillingForm = $state(false);
	let showQRCode = $state(false);

	const api = createApi(fetch);

	let shippingForm: AddressForm = $state({
		firstName: '',
		lastName: '',
		phone: '',
		email: '',
		address: '',
		city: '',
		state: '',
		postalCode: '',
		country: 'Nepal'
	});

	let billingForm: AddressForm = $state({
		firstName: '',
		lastName: '',
		phone: '',
		email: '',
		address: '',
		city: '',
		state: '',
		postalCode: '',
		country: 'Nepal'
	});

	let billingAddressSame = $state(false);
	let paymentMethod: PaymentMethod = $state({
		type: 'cod',
		cardNumber: '',
		expiryDate: '',
		cvv: '',
		nameOnCard: ''
	});

	let promoCode = $state('');
	let promoDiscount = $state(0);
	let isPromoApplied = $state(false);
	let isSubmitting = $state(false);
	let submitMessage: { type: 'success' | 'error'; text: string } | null = $state(null);
	let currentStep = $state(1);
	let errors: { [key: string]: string } = $state({});

	function createEmptyForm(): AddressForm {
		return {
			firstName: '',
			lastName: '',
			phone: '',
			email: '',
			address: '',
			city: '',
			state: '',
			postalCode: '',
			country: 'Nepal'
		};
	}

	function populateFormFromAddress(addr: Address): AddressForm {
		const nameParts = (addr.full_name || '').split(' ');
		return {
			firstName: nameParts[0] || '',
			lastName: nameParts.slice(1).join(' ') || '',
			phone: addr.phone || '',
			email: addr.email || '',
			address: addr.address_line1 || '',
			city: addr.city || '',
			state: addr.state || '',
			postalCode: addr.postal_code || '',
			country: addr.country || 'Nepal'
		};
	}

	async function fetchUserAddresses() {
		if (!$isLoggedIn) {
			isLoadingProfile = false;
			return;
		}

		try {
			const [profileRes, shippingRes, billingRes] = await Promise.all([
				api.profile.getProfile(),
				api.addresses.getShippingAddresses(),
				api.addresses.getBillingAddresses()
			]);

			if (profileRes) {
				const userData = profileRes.user;
				const profileData = userData?.profile || profileRes.profile;
				if (profileData) {
					userProfile = profileData as UserProfile;
				}
			}

			shippingAddresses = normalizeAddressList(shippingRes);
			billingAddresses = normalizeAddressList(billingRes);

			if (shippingAddresses.length > 0) {
				const defaultAddr = shippingAddresses.find((a) => a.is_default) || shippingAddresses[0];
				selectedShippingAddressId = defaultAddr.id;
				shippingForm = populateFormFromAddress(defaultAddr);
			} else {
				showShippingForm = true;
				if (userProfile) {
					shippingForm.firstName = userProfile.first_name || '';
					shippingForm.lastName = userProfile.last_name || '';
					shippingForm.email = (userProfile as any).email || '';
					shippingForm.phone = userProfile.phone_number || '';
				}
			}

			if (billingAddresses.length > 0) {
				const defaultAddr = billingAddresses.find((a) => a.is_default) || billingAddresses[0];
				selectedBillingAddressId = defaultAddr.id;
			}
		} catch (error) {
			console.error('[Checkout] Error fetching addresses:', error);
		} finally {
			isLoadingProfile = false;
		}
	}

	function normalizeAddressList(res: any): Address[] {
		if (res?.data && Array.isArray(res.data)) return res.data as Address[];
		if (Array.isArray(res)) return res as Address[];
		return [];
	}

	function selectShippingAddress(address: Address) {
		selectedShippingAddressId = address.id;
		shippingForm = populateFormFromAddress(address);
		showShippingForm = false;
	}

	function toggleShippingForm() {
		showShippingForm = !showShippingForm;
		if (showShippingForm) {
			selectedShippingAddressId = null;
			shippingForm = createEmptyForm();
			if (userProfile) {
				shippingForm.firstName = userProfile.first_name || '';
				shippingForm.lastName = userProfile.last_name || '';
				shippingForm.email = (userProfile as any).email || '';
				shippingForm.phone = userProfile.phone_number || '';
			}
		}
	}

	function selectBillingAddress(address: Address) {
		selectedBillingAddressId = address.id;
		showBillingForm = false;
	}

	function toggleBillingForm() {
		showBillingForm = !showBillingForm;
		if (showBillingForm) {
			selectedBillingAddressId = null;
			billingForm = createEmptyForm();
		}
	}

	function initDefaultBillingForm() {
		billingForm = { ...shippingForm };
	}

	$effect(() => {
		if (billingAddressSame) {
			initDefaultBillingForm();
		}
	});

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

		await fetchUserAddresses();
	});

	let subtotal = $derived(checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
	let shipping = $derived(subtotal > 50 ? 0 : 8.99);
	let tax = $derived(subtotal * 0.08);
	let discount = $derived(isPromoApplied ? subtotal * (promoDiscount / 100) : 0);
	let total = $derived(subtotal + shipping + tax - discount);

	function validateStep(step: number): boolean {
		errors = {};

		if (step === 1) {
			if (!shippingForm.firstName?.trim()) errors.firstName = 'First name is required';
			if (!shippingForm.email?.trim()) errors.email = 'Email is required';
			if (!shippingForm.phone?.trim()) errors.phone = 'Phone number is required';
			if (!shippingForm.address?.trim()) errors.address = 'Address is required';
			if (!shippingForm.city?.trim()) errors.city = 'City is required';
			if (!shippingForm.postalCode?.trim()) errors.postalCode = 'Postal code is required';
		} else if (step === 2) {
			if (billingAddressSame) return true;
			if (!showBillingForm && selectedBillingAddressId === null) {
				errors.billingAddress = 'Please select a billing address or enter a new one';
			}
			if (showBillingForm) {
				if (!billingForm.firstName?.trim()) errors.billingFirstName = 'First name is required';
				if (!billingForm.email?.trim()) errors.billingEmail = 'Email is required';
				if (!billingForm.phone?.trim()) errors.billingPhone = 'Phone number is required';
				if (!billingForm.address?.trim()) errors.billingAddressAddr = 'Address is required';
				if (!billingForm.city?.trim()) errors.billingCity = 'City is required';
				if (!billingForm.postalCode?.trim()) errors.billingPostalCode = 'Postal code is required';
			}
		} else if (step === 3) {
			if (paymentMethod.type === 'card') {
				if (!paymentMethod.cardNumber) errors.cardNumber = 'Card number is required';
				if (!paymentMethod.expiryDate) errors.expiryDate = 'Expiry date is required';
				if (!paymentMethod.cvv) errors.cvv = 'CVV is required';
				if (!paymentMethod.nameOnCard) errors.nameOnCard = 'Name on card is required';
			}
		}

		return Object.keys(errors).length === 0;
	}

	function nextStep() {
		if (isLoadingProfile) return;
		if (!validateStep(currentStep)) return;
		currentStep++;
	}

	function prevStep() {
		currentStep--;
	}

	function applyPromoCode() {
		const validCodes: { [key: string]: number } = {
			HEMP10: 10,
			SAVE15: 15,
			NEWCUSTOMER: 20
		};
		const code = promoCode.toUpperCase();
		if (validCodes[code]) {
			isPromoApplied = true;
			promoDiscount = validCodes[code];
		} else {
			alert('Invalid promo code');
		}
	}

	function formatCardNumber(value: string) {
		return value
			.replace(/\s/g, '')
			.replace(/(\d{4})/g, '$1 ')
			.trim();
	}

	function handleCardNumberInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value.replace(/\D/g, '');
		if (value.length <= 16) {
			paymentMethod.cardNumber = formatCardNumber(value);
		}
	}

	function handleExpiryInput(event: Event) {
		const target = event.target as HTMLInputElement;
		let value = target.value.replace(/\D/g, '');
		if (value.length >= 2) {
			value = value.substring(0, 2) + '/' + value.substring(2, 4);
		}
		paymentMethod.expiryDate = value;
	}

	function placeOrder() {
		if (validateStep(3)) {
			submitOrder();
		}
	}

	async function submitOrder() {
		const orderPayload = prepareOrderPayload();
		if (!orderPayload) {
			alert('Failed to prepare order - missing user data');
			return;
		}

		try {
			const response = await api.orders.confirmOrder(orderPayload);
			if (response) {
				if (typeof sessionStorage !== 'undefined') {
					const confirmationData = {
						...response,
						shippingAddress: { ...shippingForm },
						paymentMethodType: paymentMethod.type,
						subtotal,
						shipping,
						tax,
						discount,
						total,
						promoCode: isPromoApplied ? promoCode : null,
						promoDiscount: isPromoApplied ? promoDiscount : 0
					};
					sessionStorage.setItem('orderConfirmation', JSON.stringify(confirmationData));
					sessionStorage.removeItem('checkoutItems');
				}
				goto('/order-confirmation');
			} else {
				alert('Failed to place order. Please try again.');
			}
		} catch (error) {
			alert(`Error placing order: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	function prepareOrderPayload() {
		const userData = get(user);
		if (!userData?.id) return null;

		const orderItems = checkoutItems.map((item) => ({
			cart: item.cartId || null,
			cart_item: item.cartItemId || null,
			product_id: item.id,
			name: item.name,
			quantity: item.quantity,
			price: item.price,
			image: item.image,
			size: item.size,
			color: item.color,
			subtotal: item.price * item.quantity
		}));

		return {
			user_id: userData.id,
			cart_id: checkoutItems.length > 0 ? checkoutItems[0].cartId : null,
			items: orderItems,
			shipping_address: selectedShippingAddressId,
			billing_address: billingAddressSame ? selectedShippingAddressId : selectedBillingAddressId,
			payment_method: paymentMethod.type,
			subtotal: parseFloat(subtotal.toFixed(2)),
			shipping: parseFloat(shipping.toFixed(2)),
			tax: parseFloat(tax.toFixed(2)),
			discount: parseFloat(discount.toFixed(2)),
			total: parseFloat(total.toFixed(2)),
			promo_code: isPromoApplied ? promoCode : undefined,
			promo_discount_percentage: isPromoApplied ? promoDiscount : 0
		};
	}

	function getSelectedBillingDisplay(): Address | null {
		if (billingAddressSame) return null;
		if (!selectedBillingAddressId) return null;
		return billingAddresses.find((a) => a.id === selectedBillingAddressId) || null;
	}
</script>

<svelte:head>
	<title>Checkout - Himalayan Hemp Heaven</title>
</svelte:head>

<Topbar />

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
				<span class="step-label">Shipping</span>
			</div>
			<div class="step {currentStep >= 2 ? 'active' : ''} {currentStep > 2 ? 'completed' : ''}">
				<div class="step-number">2</div>
				<span class="step-label">Billing</span>
			</div>
			<div class="step {currentStep >= 3 ? 'active' : ''} {currentStep > 3 ? 'completed' : ''}">
				<div class="step-number">3</div>
				<span class="step-label">Payment</span>
			</div>
			<div class="step {currentStep >= 4 ? 'active' : ''}">
				<div class="step-number">4</div>
				<span class="step-label">Review</span>
			</div>
		</div>

		<div class="checkout-layout">
			<div class="checkout-main">
				{#if currentStep === 1}
					<div class="step-content">
						<div class="step-header">
							<h2>Shipping Information</h2>
							<p>Enter your shipping details or select a saved address</p>
						</div>

						{#if isLoadingProfile}
							<div class="loading-profile">
								<div class="spinner"></div>
								<p>Loading your information...</p>
							</div>
						{:else if shippingAddresses.length > 0 && !showShippingForm}
							<div class="existing-addresses-section">
								<div class="section-header">
									<span class="section-icon">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
											width="20"
											height="20"
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
									</span>
									<h3>Shipping Address</h3>
								</div>

								<div class="address-cards-container">
									{#each shippingAddresses as address (address.id)}
										<div
											class="address-card modern {selectedShippingAddressId === address.id
												? 'selected'
												: ''}"
											role="button"
											tabindex="0"
											onclick={() => selectShippingAddress(address)}
											onkeydown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													selectShippingAddress(address);
												}
											}}
										>
											<div class="card-header">
												<div class="card-title">
													<h4>{address.full_name}</h4>
													{#if address.is_default}
														<span class="default-badge">Default</span>
													{/if}
												</div>
												<div class="card-radio">
													<input
														type="radio"
														name="shipping-address"
														checked={selectedShippingAddressId === address.id}
														onchange={() => selectShippingAddress(address)}
													/>
												</div>
											</div>
											<div class="card-content">
												<p class="address-line">
													<span class="address-icon">📍</span>
													{address.address_line1}
													{#if address.address_line2}
														<br /><span class="address-icon"></span>{address.address_line2}
													{/if}
												</p>
												<p class="city-state">
													{address.city}, {address.state}
													{address.postal_code}
												</p>
												<p class="country">{address.country}</p>
												<div class="contact-info">
													{#if address.phone}
														<p class="info-row">
															<span class="info-icon">📞</span>
															{address.phone}
														</p>
													{/if}
													{#if address.email}
														<p class="info-row">
															<span class="info-icon">✉️</span>
															{address.email}
														</p>
													{/if}
												</div>
											</div>
										</div>
									{/each}
								</div>

								<button type="button" class="btn-add-address" onclick={toggleShippingForm}>
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
											d="M12 4.5v15m7.5-7.5h-15"
										/>
									</svg>
									Add New Address
								</button>
							</div>
						{:else}
							<form
								class="checkout-form"
								method="POST"
								action="?/updateShippingAddress"
								use:enhance={() => {
									isSubmitting = true;
									return async ({ result }) => {
										isSubmitting = false;
										if (result.type === 'success') {
											submitMessage = { type: 'success', text: 'Shipping address saved!' };
											await fetchUserAddresses();
											showShippingForm = false;
										} else {
											submitMessage = { type: 'error', text: 'Failed to save shipping address.' };
										}
										setTimeout(() => {
											submitMessage = null;
										}, 3000);
									};
								}}
							>
								{#if shippingAddresses.length > 0 && showShippingForm}
									<div class="form-notice">
										<p>Adding a new shipping address</p>
										<button type="button" class="btn-link" onclick={toggleShippingForm}
											>Cancel</button
										>
									</div>
								{/if}

								{#if submitMessage}
									<div class="submit-message {submitMessage.type}">{submitMessage.text}</div>
								{/if}

								<div class="form-section">
									<div class="section-header">
										<span class="section-icon">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
												width="20"
												height="20"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
												/>
											</svg>
										</span>
										<h3>Contact Information</h3>
									</div>
									<div class="form-row cols-2">
										<div class="form-group floating">
											<input
												type="text"
												id="firstName"
												name="firstName"
												bind:value={shippingForm.firstName}
												class={errors.firstName ? 'error' : ''}
												placeholder=" "
											/>
											<label for="firstName">First Name <span class="req">*</span></label>
											{#if errors.firstName}<span class="error-message">{errors.firstName}</span
												>{/if}
										</div>
										<div class="form-group floating">
											<input
												type="text"
												id="lastName"
												name="lastName"
												bind:value={shippingForm.lastName}
												placeholder=" "
											/>
											<label for="lastName">Last Name</label>
										</div>
										<div class="form-group floating">
											<input
												type="tel"
												id="phone"
												name="phone"
												bind:value={shippingForm.phone}
												class={errors.phone ? 'error' : ''}
												placeholder=" "
											/>
											<label for="phone">Phone <span class="req">*</span></label>
											{#if errors.phone}<span class="error-message">{errors.phone}</span>{/if}
										</div>
										<div class="form-group floating">
											<input
												type="email"
												id="email"
												name="email"
												bind:value={shippingForm.email}
												class={errors.email ? 'error' : ''}
												placeholder=" "
											/>
											<label for="email">Email Address <span class="req">*</span></label>
											{#if errors.email}<span class="error-message">{errors.email}</span>{/if}
										</div>
									</div>
								</div>

								<div class="form-section">
									<div class="section-header">
										<span class="section-icon">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
												width="20"
												height="20"
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
										</span>
										<h3>Shipping Address</h3>
									</div>
									<div class="form-row cols-2">
										<div class="form-group floating">
											<input
												type="text"
												id="address"
												name="address_line1"
												bind:value={shippingForm.address}
												class={errors.address ? 'error' : ''}
												placeholder=" "
											/>
											<label for="address">Street Address <span class="req">*</span></label>
											{#if errors.address}<span class="error-message">{errors.address}</span>{/if}
										</div>
										<div class="form-group floating">
											<input
												type="text"
												id="city"
												name="city"
												bind:value={shippingForm.city}
												class={errors.city ? 'error' : ''}
												placeholder=" "
											/>
											<label for="city">City <span class="req">*</span></label>
											{#if errors.city}<span class="error-message">{errors.city}</span>{/if}
										</div>
										<div class="form-group floating">
											<input
												type="text"
												id="state"
												name="state"
												bind:value={shippingForm.state}
												placeholder=" "
											/>
											<label for="state">State / Province</label>
										</div>
										<div class="form-group floating">
											<input
												type="text"
												id="postalCode"
												name="postalCode"
												bind:value={shippingForm.postalCode}
												class={errors.postalCode ? 'error' : ''}
												placeholder=" "
											/>
											<label for="postalCode">Postal Code <span class="req">*</span></label>
											{#if errors.postalCode}<span class="error-message">{errors.postalCode}</span
												>{/if}
										</div>
									</div>
									<div class="form-row">
										<div class="form-group floating select-group">
											<select id="country" name="country" bind:value={shippingForm.country}>
												<option value="Nepal">🇳🇵 Nepal</option>
											</select>
											<label for="country">Country</label>
										</div>
										<div class="form-group floating">
											<button type="submit" class="btn-save" disabled={isSubmitting}>
												{isSubmitting ? 'Saving...' : 'Save Address'}
											</button>
										</div>
									</div>
								</div>
							</form>
						{/if}
					</div>
				{:else if currentStep === 2}
					<div class="step-content">
						<div class="step-header">
							<h2>Billing Details</h2>
							<p>Choose or enter your billing address</p>
						</div>

						{#if isLoadingProfile}
							<div class="loading-profile">
								<div class="spinner"></div>
								<p>Loading billing information...</p>
							</div>
						{:else}
							<div class="billing-same-section">
								<label class="checkbox-label">
									<input type="checkbox" bind:checked={billingAddressSame} />
									<span class="checkmark"></span>
									<span>Billing address same as shipping address</span>
								</label>
							</div>

							{#if billingAddressSame}
								<div class="billing-same-display">
									<div class="billing-same-card">
										<div class="billing-same-header">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
												width="20"
												height="20"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<span>Using shipping address as billing address</span>
										</div>
										<div class="billing-same-details">
											<p><strong>{shippingForm.firstName} {shippingForm.lastName}</strong></p>
											<p>{shippingForm.address}</p>
											<p>{shippingForm.city}, {shippingForm.state} {shippingForm.postalCode}</p>
											<p>{shippingForm.country}</p>
											{#if shippingForm.phone}<p>📞 {shippingForm.phone}</p>{/if}
											{#if shippingForm.email}<p>✉️ {shippingForm.email}</p>{/if}
										</div>
									</div>
								</div>
							{:else if billingAddresses.length > 0 && !showBillingForm}
								<div class="existing-addresses-section">
									<div class="section-header">
										<span class="section-icon">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
												width="20"
												height="20"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
												/>
											</svg>
										</span>
										<h3>Billing Address</h3>
									</div>

									<div class="address-cards-container">
										{#each billingAddresses as address (address.id)}
											<div
												class="address-card modern {selectedBillingAddressId === address.id
													? 'selected'
													: ''}"
												role="button"
												tabindex="0"
												onclick={() => selectBillingAddress(address)}
												onkeydown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault();
														selectBillingAddress(address);
													}
												}}
											>
												<div class="card-header">
													<div class="card-title">
														<h4>{address.full_name}</h4>
														{#if address.is_default}
															<span class="default-badge">Default</span>
														{/if}
													</div>
													<div class="card-radio">
														<input
															type="radio"
															name="billing-address"
															checked={selectedBillingAddressId === address.id}
															onchange={() => selectBillingAddress(address)}
														/>
													</div>
												</div>
												<div class="card-content">
													<p class="address-line">
														<span class="address-icon">📍</span>
														{address.address_line1}
														{#if address.address_line2}
															<br /><span class="address-icon"></span>{address.address_line2}
														{/if}
													</p>
													<p class="city-state">
														{address.city}, {address.state}
														{address.postal_code}
													</p>
													<p class="country">{address.country}</p>
													<div class="contact-info">
														{#if address.phone}
															<p class="info-row">
																<span class="info-icon">📞</span>
																{address.phone}
															</p>
														{/if}
														{#if address.email}
															<p class="info-row">
																<span class="info-icon">✉️</span>
																{address.email}
															</p>
														{/if}
													</div>
												</div>
											</div>
										{/each}
									</div>

									<button type="button" class="btn-add-address" onclick={toggleBillingForm}>
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
												d="M12 4.5v15m7.5-7.5h-15"
											/>
										</svg>
										Add New Billing Address
									</button>
								</div>
							{:else}
								<form
									class="checkout-form"
									method="POST"
									action="?/updateBillingAddress"
									use:enhance={() => {
										isSubmitting = true;
										return async ({ result }) => {
											isSubmitting = false;
											if (result.type === 'success') {
												submitMessage = { type: 'success', text: 'Billing address saved!' };
												await fetchUserAddresses();
												showBillingForm = false;
											} else {
												submitMessage = { type: 'error', text: 'Failed to save billing address.' };
											}
											setTimeout(() => {
												submitMessage = null;
											}, 3000);
										};
									}}
								>
									{#if billingAddresses.length > 0 && showBillingForm}
										<div class="form-notice">
											<p>Adding a new billing address</p>
											<button type="button" class="btn-link" onclick={toggleBillingForm}
												>Cancel</button
											>
										</div>
									{/if}

									{#if submitMessage}
										<div class="submit-message {submitMessage.type}">{submitMessage.text}</div>
									{/if}

									<div class="form-section">
										<div class="section-header">
											<span class="section-icon">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="1.5"
													stroke="currentColor"
													width="20"
													height="20"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
													/>
												</svg>
											</span>
											<h3>Contact Information</h3>
										</div>
										<div class="form-row cols-2">
											<div class="form-group floating">
												<input
													type="text"
													id="billingFirstName"
													name="firstName"
													bind:value={billingForm.firstName}
													class={errors.billingFirstName ? 'error' : ''}
													placeholder=" "
												/>
												<label for="billingFirstName">First Name <span class="req">*</span></label>
												{#if errors.billingFirstName}<span class="error-message"
														>{errors.billingFirstName}</span
													>{/if}
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="billingLastName"
													name="lastName"
													bind:value={billingForm.lastName}
													placeholder=" "
												/>
												<label for="billingLastName">Last Name</label>
											</div>
											<div class="form-group floating">
												<input
													type="tel"
													id="billingPhone"
													name="phone"
													bind:value={billingForm.phone}
													class={errors.billingPhone ? 'error' : ''}
													placeholder=" "
												/>
												<label for="billingPhone">Phone <span class="req">*</span></label>
												{#if errors.billingPhone}<span class="error-message"
														>{errors.billingPhone}</span
													>{/if}
											</div>
											<div class="form-group floating">
												<input
													type="email"
													id="billingEmail"
													name="email"
													bind:value={billingForm.email}
													class={errors.billingEmail ? 'error' : ''}
													placeholder=" "
												/>
												<label for="billingEmail">Email Address <span class="req">*</span></label>
												{#if errors.billingEmail}<span class="error-message"
														>{errors.billingEmail}</span
													>{/if}
											</div>
										</div>
									</div>

									<div class="form-section">
										<div class="section-header">
											<span class="section-icon">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="1.5"
													stroke="currentColor"
													width="20"
													height="20"
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
											</span>
											<h3>Billing Address</h3>
										</div>
										<div class="form-row cols-2">
											<div class="form-group floating">
												<input
													type="text"
													id="billingAddress"
													name="address_line1"
													bind:value={billingForm.address}
													class={errors.billingAddressAddr ? 'error' : ''}
													placeholder=" "
												/>
												<label for="billingAddress">Street Address <span class="req">*</span></label
												>
												{#if errors.billingAddressAddr}<span class="error-message"
														>{errors.billingAddressAddr}</span
													>{/if}
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="billingCity"
													name="city"
													bind:value={billingForm.city}
													class={errors.billingCity ? 'error' : ''}
													placeholder=" "
												/>
												<label for="billingCity">City <span class="req">*</span></label>
												{#if errors.billingCity}<span class="error-message"
														>{errors.billingCity}</span
													>{/if}
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="billingState"
													name="state"
													bind:value={billingForm.state}
													placeholder=" "
												/>
												<label for="billingState">State / Province</label>
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="billingPostalCode"
													name="postalCode"
													bind:value={billingForm.postalCode}
													class={errors.billingPostalCode ? 'error' : ''}
													placeholder=" "
												/>
												<label for="billingPostalCode">Postal Code <span class="req">*</span></label
												>
												{#if errors.billingPostalCode}<span class="error-message"
														>{errors.billingPostalCode}</span
													>{/if}
											</div>
										</div>
										<div class="form-row">
											<div class="form-group floating select-group">
												<select id="billingCountry" name="country" bind:value={billingForm.country}>
													<option value="Nepal">🇳🇵 Nepal</option>
												</select>
												<label for="billingCountry">Country</label>
											</div>
											<div class="form-group floating">
												<button type="submit" class="btn-save" disabled={isSubmitting}>
													{isSubmitting ? 'Saving...' : 'Save Billing Address'}
												</button>
											</div>
										</div>
									</div>
								</form>
							{/if}

							{#if errors.billingAddress}
								<div class="error-message-box">{errors.billingAddress}</div>
							{/if}
						{/if}
					</div>
				{:else if currentStep === 3}
					<div class="step-content">
						<div class="step-header">
							<h2>Payment Information</h2>
							<p>Choose your preferred payment method</p>
						</div>

						<div class="payment-methods">
							<label class="payment-option">
								<input
									type="radio"
									name="payment"
									value="cod"
									bind:group={paymentMethod.type}
									onchange={() => {
										paymentMethod.type = 'cod';
										showQRCode = false;
									}}
								/>
								<div class="payment-option-content">
									<span class="payment-method-label">🚚 Cash on Delivery</span>
									<p class="payment-method-desc">Pay when you receive your order</p>
								</div>
							</label>

							{#if paymentMethod.type === 'cod'}
								<div class="payment-info-box animate-slide-in">
									<h4>Delivery Payment Information</h4>
									<div class="cod-benefits">
										<div class="benefit-item">
											<span class="benefit-icon">✓</span>
											<p>No payment needed now</p>
										</div>
										<div class="benefit-item">
											<span class="benefit-icon">✓</span>
											<p>Pay only when delivered</p>
										</div>
										<div class="benefit-item">
											<span class="benefit-icon">✓</span>
											<p>Secure and convenient</p>
										</div>
									</div>
								</div>
							{/if}

							<label class="payment-option">
								<input
									type="radio"
									name="payment"
									value="esewa"
									bind:group={paymentMethod.type}
									onchange={() => {
										paymentMethod.type = 'esewa';
										showQRCode = false;
									}}
								/>
								<div class="payment-option-content">
									<span class="payment-method-label">💚 QR Code Scan</span>
									<p class="payment-method-desc">Scan the QR code to make payment</p>
								</div>
							</label>

							{#if paymentMethod.type === 'esewa'}
								<div class="payment-info-box animate-slide-in">
									<button
										class="scan-button"
										onclick={() => {
											showQRCode = !showQRCode;
										}}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
											width="18"
											height="18"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
											/>
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
					</div>
				{:else if currentStep === 4}
					<div class="step-content">
						<div class="step-header">
							<h2>Review Your Order</h2>
							<p>Please review your order before placing it</p>
						</div>
						<div class="order-review">
							<div class="addresses-review-container">
								<div class="address-review-card shipping-review animate-fade-in">
									<div class="address-card-header">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
											width="24"
											height="24"
											class="address-icon-header"
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
										<h3>Shipping Address</h3>
									</div>
									<div class="address-card-content">
										{#if shippingForm.firstName}
											<div class="address-detail">
												<p class="address-name">
													<strong>{shippingForm.firstName} {shippingForm.lastName}</strong>
												</p>
												<p class="address-line">
													<span class="icon">📍</span>
													{shippingForm.address}
												</p>
												<p class="address-city-state">
													{shippingForm.city}, {shippingForm.state}
													{shippingForm.postalCode}
												</p>
												<p class="address-country">{shippingForm.country}</p>
												<div class="address-contact-info">
													{#if shippingForm.email}<p class="contact-item">
															<span class="icon">📧</span>
															{shippingForm.email}
														</p>{/if}
													{#if shippingForm.phone}<p class="contact-item">
															<span class="icon">📞</span>
															{shippingForm.phone}
														</p>{/if}
												</div>
											</div>
										{:else}
											<div class="no-address-message">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="1.5"
													stroke="currentColor"
													width="48"
													height="48"
													class="no-address-icon"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
													/>
												</svg>
												<p class="no-address-text">No shipping address found</p>
											</div>
										{/if}
										{#if shippingForm.firstName}
											<div class="address-badge shipping-badge">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="2"
													stroke="currentColor"
													width="16"
													height="16"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
												</svg>
												<span>Delivery To</span>
											</div>
										{/if}
									</div>
								</div>

								<div
									class="address-review-card billing-review animate-fade-in"
									style="animation-delay: 0.2s;"
								>
									<div class="address-card-header">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
											width="24"
											height="24"
											class="address-icon-header"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
											/>
										</svg>
										<h3>Billing Address</h3>
									</div>
									<div class="address-card-content">
										{#if billingAddressSame}
											<div class="address-detail">
												<p class="address-name">
													<strong>{shippingForm.firstName} {shippingForm.lastName}</strong>
												</p>
												<p class="address-line">
													<span class="icon">📍</span>
													{shippingForm.address}
												</p>
												<p class="address-city-state">
													{shippingForm.city}, {shippingForm.state}
													{shippingForm.postalCode}
												</p>
												<p class="address-country">{shippingForm.country}</p>
												<div class="address-contact-info">
													{#if shippingForm.email}<p class="contact-item">
															<span class="icon">📧</span>
															{shippingForm.email}
														</p>{/if}
													{#if shippingForm.phone}<p class="contact-item">
															<span class="icon">📞</span>
															{shippingForm.phone}
														</p>{/if}
												</div>
											</div>
										{:else if getSelectedBillingDisplay()}
											{@const selectedBilling = getSelectedBillingDisplay()}
											{#if selectedBilling}
												<div class="address-detail">
													<p class="address-name"><strong>{selectedBilling.full_name}</strong></p>
													<p class="address-line">
														<span class="icon">📍</span>
														{selectedBilling.address_line1}
													</p>
													<p class="address-city-state">
														{selectedBilling.city}, {selectedBilling.state}
														{selectedBilling.postal_code}
													</p>
													<p class="address-country">{selectedBilling.country}</p>
													<div class="address-contact-info">
														{#if selectedBilling.email}<p class="contact-item">
																<span class="icon">📧</span>
																{selectedBilling.email}
															</p>{/if}
														{#if selectedBilling.phone}<p class="contact-item">
																<span class="icon">📞</span>
																{selectedBilling.phone}
															</p>{/if}
													</div>
												</div>
											{/if}
										{:else}
											<div class="no-address-message">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="1.5"
													stroke="currentColor"
													width="48"
													height="48"
													class="no-address-icon"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
													/>
												</svg>
												<p class="no-address-text">No billing address found</p>
											</div>
										{/if}
										{#if billingAddressSame || getSelectedBillingDisplay()}
											<div class="address-badge billing-badge">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="2"
													stroke="currentColor"
													width="16"
													height="16"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
												</svg>
												<span>{billingAddressSame ? 'Same as Shipping' : 'Billing'}</span>
											</div>
										{/if}
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
					{#if currentStep < 4}
						<button class="btn-primary" onclick={nextStep} disabled={isLoadingProfile}>
							{currentStep === 1 ? 'Proceed to Billing' : 'Continue'}
						</button>
					{:else}
						<button class="btn-primary checkout-btn" onclick={placeOrder}>Confirm Order</button>
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
							<input
								type="text"
								placeholder="Discount code"
								bind:value={promoCode}
								disabled={isPromoApplied}
							/>
							<button
								class="apply-btn"
								onclick={applyPromoCode}
								disabled={isPromoApplied || !promoCode.trim()}>Apply</button
							>
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
	.checkout-page {
		background: #fafafa;
		min-height: 100vh;
		padding: 80px 0 40px;
	}
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
	}
	.breadcrumb {
		margin-bottom: 30px;
		font-size: 14px;
		color: #666;
	}
	.breadcrumb a {
		color: #059669;
		text-decoration: none;
	}
	.breadcrumb a:hover {
		text-decoration: underline;
	}
	.separator {
		margin: 0 8px;
		color: #ccc;
	}
	.current {
		color: #333;
		font-weight: 500;
	}

	.progress-steps {
		display: flex;
		justify-content: center;
		margin-bottom: 40px;
		position: relative;
	}
	.progress-steps::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 20%;
		right: 20%;
		height: 2px;
		background: #e5e7eb;
		z-index: 1;
	}
	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		z-index: 2;
		background: #fafafa;
		padding: 0 20px;
	}
	.step-number {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #e5e7eb;
		color: #9ca3af;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		margin-bottom: 8px;
		transition: all 0.3s ease;
	}
	.step.active .step-number {
		background: #059669;
		color: white;
	}
	.step.completed .step-number {
		background: #059669;
		color: white;
	}
	.step.completed .step-number::after {
		content: '✓';
	}
	.step-label {
		font-size: 14px;
		font-weight: 500;
		color: #6b7280;
	}
	.step.active .step-label {
		color: #059669;
	}

	.checkout-layout {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 40px;
	}

	.loading-profile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px;
		background: #f9fafb;
		border-radius: 8px;
		margin-bottom: 24px;
	}
	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top-color: #059669;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 16px;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes slideInLeft {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	.animate-fade-in {
		animation: fadeIn 0.6s ease-in-out forwards;
	}
	.loading-profile p {
		color: #6b7280;
		font-size: 14px;
	}

	.checkout-main {
		background: white;
		border-radius: 12px;
		padding: 32px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
	}
	.step-content {
		margin-bottom: 32px;
	}
	.step-header {
		margin-bottom: 32px;
		text-align: center;
	}
	.step-header h2 {
		font-size: 28px;
		font-weight: 700;
		color: #09240f;
		margin-bottom: 8px;
	}
	.step-header p {
		color: #6b7280;
		font-size: 16px;
	}

	.checkout-form {
		max-width: 720px;
		margin: 0 auto;
	}
	.form-section {
		margin-bottom: 28px;
		padding: 24px;
		background: #f9fdfb;
		border: 1px solid #e8f5e9;
		border-radius: 12px;
	}
	.section-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 20px;
		padding-bottom: 14px;
		border-bottom: 1px solid #e0ece3;
	}
	.section-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: #059669;
		color: white;
		border-radius: 8px;
		flex-shrink: 0;
	}
	.section-header h3 {
		font-size: 17px;
		font-weight: 600;
		color: #09240f;
		margin: 0;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	.form-row.cols-3 {
		grid-template-columns: 1fr 1fr 1fr;
	}

	.form-group {
		margin-bottom: 18px;
	}
	.form-group.floating {
		position: relative;
	}
	.form-group.floating input,
	.form-group.floating select {
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
	}
	.form-group.floating select {
		padding-right: 40px;
		cursor: pointer;
	}
	.form-group.select-group::after {
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

	.form-group.floating label {
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
	.form-group.floating input:focus + label,
	.form-group.floating input:not(:placeholder-shown) + label,
	.form-group.floating select:focus + label,
	.form-group.floating select:valid + label {
		top: 8px;
		transform: translateY(0);
		font-size: 11px;
		color: #059669;
		font-weight: 500;
	}
	.form-group.floating input:focus,
	.form-group.floating select:focus {
		outline: none;
		border-color: #059669;
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
		background: #fafffe;
	}
	.form-group.floating input:hover:not(:focus),
	.form-group.floating select:hover:not(:focus) {
		border-color: #a3c4ae;
	}
	.form-group.floating input.error {
		border-color: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
	}
	.form-group.floating input.error + label {
		color: #ef4444;
	}
	.req {
		color: #ef4444;
		font-weight: 600;
	}

	.form-group label {
		display: block;
		font-size: 14px;
		font-weight: 500;
		color: #374151;
		margin-bottom: 6px;
	}
	.form-group input,
	.form-group select {
		width: 100%;
		padding: 12px 16px;
		border: 1.5px solid #d4ddd7;
		border-radius: 10px;
		font-size: 14px;
		transition:
			border-color 0.25s,
			box-shadow 0.25s;
		background: #fff;
	}
	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #059669;
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
	}

	.error-message {
		display: block;
		color: #ef4444;
		font-size: 12px;
		margin-top: 5px;
		font-weight: 500;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
		font-size: 14px;
		color: #4b5563;
		transition: color 0.2s;
	}
	.checkbox-label:hover {
		color: #1f2937;
	}
	.checkbox-label input[type='checkbox'] {
		display: none;
	}
	.checkmark {
		width: 20px;
		height: 20px;
		border: 2px solid #c5d1c9;
		border-radius: 5px;
		position: relative;
		transition: all 0.25s;
		flex-shrink: 0;
	}
	.checkbox-label:hover .checkmark {
		border-color: #059669;
	}
	.checkbox-label input[type='checkbox']:checked + .checkmark {
		background: #059669;
		border-color: #059669;
	}
	.checkbox-label input[type='checkbox']:checked + .checkmark::after {
		content: '✓';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 12px;
		font-weight: bold;
	}

	.billing-same-section {
		margin-bottom: 24px;
	}
	.billing-same-display {
		margin-bottom: 24px;
	}
	.billing-same-card {
		background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
		border: 2px solid #86efac;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(5, 150, 105, 0.1);
	}
	.billing-same-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
		color: #047857;
		font-weight: 600;
		font-size: 14px;
	}
	.billing-same-header svg {
		flex-shrink: 0;
		color: #059669;
	}
	.billing-same-details p {
		margin: 4px 0;
		font-size: 14px;
		color: #1f2937;
		line-height: 1.5;
	}

	.form-notice {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 8px;
		margin-bottom: 20px;
	}
	.form-notice p {
		margin: 0;
		font-size: 14px;
		color: #047857;
		font-weight: 500;
	}
	.btn-link {
		background: none;
		border: none;
		color: #059669;
		font-weight: 600;
		cursor: pointer;
		font-size: 14px;
		text-decoration: underline;
	}

	.btn-save {
		width: 100%;
		padding: 16px;
		background: #059669;
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}
	.btn-save:hover {
		background: #047857;
	}
	.btn-save:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.submit-message {
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 20px;
		font-size: 14px;
		font-weight: 500;
	}
	.submit-message.success {
		background: #f0fdf4;
		color: #047857;
		border: 1px solid #bbf7d0;
	}
	.submit-message.error {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}

	.payment-methods {
		margin-bottom: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.payment-option {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
		padding: 14px 16px;
		border: 2px solid #e5e7eb;
		border-radius: 10px;
		transition: all 0.3s ease;
		background: #fff;
	}
	.payment-option:hover {
		border-color: #1db584;
		background: #f0fdf4;
	}
	.payment-option input[type='radio'] {
		cursor: pointer;
		width: 18px;
		height: 18px;
		accent-color: #1db584;
		margin: 0;
	}
	.payment-option-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.payment-method-label {
		font-weight: 600;
		color: #0b5d1e;
		font-size: 15px;
	}
	.payment-method-desc {
		font-size: 13px;
		color: #6b7280;
		margin: 0;
	}

	.payment-info-box {
		margin-left: 32px;
		padding: 16px;
		background: linear-gradient(135deg, rgba(29, 181, 132, 0.05) 0%, rgba(29, 181, 132, 0.02) 100%);
		border: 1px solid rgba(29, 181, 132, 0.2);
		border-radius: 8px;
		margin-bottom: 16px;
	}
	.payment-info-box h4 {
		font-size: 14px;
		font-weight: 600;
		color: #0b5d1e;
		margin: 0 0 12px 0;
	}
	.cod-benefits {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 12px;
	}
	.benefit-item {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		font-size: 13px;
		color: #374151;
	}
	.benefit-icon {
		color: #1db584;
		font-weight: 700;
		flex-shrink: 0;
		font-size: 16px;
	}
	.benefit-item p {
		margin: 0;
		line-height: 1.4;
	}

	.address-cards-container {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}
	.address-card.modern {
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 20px;
		cursor: pointer;
		transition: all 0.3s ease;
		background: #fff;
		position: relative;
	}
	.address-card.modern:hover {
		border-color: #059669;
		box-shadow: 0 4px 12px rgba(5, 150, 105, 0.1);
		transform: translateY(-2px);
	}
	.address-card.modern.selected {
		border-color: #059669;
		background: #f0fdf4;
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
	}
	.address-card.modern .card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16px;
		gap: 12px;
	}
	.address-card.modern .card-title {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.address-card.modern .card-title h4 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: #09240f;
	}
	.address-card.modern .default-badge {
		display: inline-block;
		background: #dbeafe;
		color: #0369a1;
		font-size: 11px;
		font-weight: 600;
		padding: 4px 8px;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.address-card.modern .card-radio {
		flex-shrink: 0;
	}
	.address-card.modern input[type='radio'] {
		width: 20px;
		height: 20px;
		cursor: pointer;
		accent-color: #059669;
	}
	.address-card.modern .card-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.address-card.modern .address-line {
		margin: 0;
		font-size: 14px;
		color: #374151;
		line-height: 1.6;
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}
	.address-card.modern .address-icon {
		flex-shrink: 0;
		font-size: 16px;
	}
	.address-card.modern .city-state {
		margin: 0;
		font-size: 14px;
		color: #6b7280;
		font-weight: 500;
	}
	.address-card.modern .country {
		margin: 0;
		font-size: 13px;
		color: #9ca3af;
	}
	.address-card.modern .contact-info {
		border-top: 1px solid #e5e7eb;
		padding-top: 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.address-card.modern .info-row {
		margin: 0;
		font-size: 13px;
		color: #6b7280;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.address-card.modern .info-icon {
		flex-shrink: 0;
		font-size: 14px;
	}

	.existing-addresses-section {
		margin-bottom: 28px;
	}
	.btn-add-address {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		background: #f3f4f6;
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		font-weight: 600;
		color: #059669;
		cursor: pointer;
		transition: all 0.25s;
		font-size: 14px;
	}
	.btn-add-address:hover {
		background: #e5e7eb;
		border-color: #059669;
		box-shadow: 0 2px 8px rgba(5, 150, 105, 0.1);
	}

	@keyframes slideInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-slide-in {
		animation: slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.scan-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 16px;
		padding: 10px 20px;
		background: linear-gradient(135deg, #1db584 0%, #15a372 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		box-shadow: 0 4px 12px rgba(29, 181, 132, 0.3);
	}
	.scan-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(29, 181, 132, 0.4);
		background: linear-gradient(135deg, #15a372 0%, #0f8860 100%);
	}
	.scan-button:active {
		transform: translateY(0);
	}

	.qr-code-container {
		margin-top: 16px;
		padding: 20px;
		background: linear-gradient(135deg, rgba(29, 181, 132, 0.05) 0%, rgba(29, 181, 132, 0.02) 100%);
		border: 2px dashed rgba(29, 181, 132, 0.3);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.qr-code-img {
		width: 200px;
		height: 200px;
		border-radius: 8px;
		border: 3px solid white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	.qr-info-text {
		font-size: 14px;
		color: #1db584;
		font-weight: 600;
		margin: 0;
	}

	.order-review {
		max-width: 100%;
	}
	.addresses-review-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
		margin-bottom: 32px;
	}
	@media (max-width: 768px) {
		.addresses-review-container {
			grid-template-columns: 1fr;
			gap: 16px;
		}
	}
	.address-review-card {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 24px;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	.address-review-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #059669, #34d399);
		transform: translateX(-100%);
		transition: transform 0.6s ease;
	}
	.address-review-card:hover::before {
		transform: translateX(0);
	}
	.address-review-card:hover {
		border-color: #10b981;
		box-shadow: 0 8px 20px rgba(16, 185, 129, 0.12);
	}
	.shipping-review::before {
		background: linear-gradient(90deg, #059669, #34d399);
	}
	.billing-review::before {
		background: linear-gradient(90deg, #7c3aed, #a78bfa);
	}
	.address-card-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 20px;
		padding-bottom: 16px;
		border-bottom: 1px solid #f3f4f6;
	}
	.address-card-header h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 700;
		color: #09240f;
	}
	.address-icon-header {
		width: 24px;
		height: 24px;
		color: #059669;
		flex-shrink: 0;
	}
	.billing-review .address-icon-header {
		color: #7c3aed;
	}
	.address-card-content {
		position: relative;
	}
	.address-detail {
		margin-bottom: 16px;
	}
	.address-name {
		font-size: 15px;
		font-weight: 700;
		color: #09240f;
		margin-bottom: 8px;
	}
	.address-line {
		font-size: 14px;
		color: #4b5563;
		margin-bottom: 6px;
		display: flex;
		align-items: flex-start;
		gap: 6px;
	}
	.address-line .icon {
		flex-shrink: 0;
		margin-top: 2px;
	}
	.address-city-state {
		font-size: 14px;
		color: #6b7280;
		margin-bottom: 4px;
	}
	.address-country {
		font-size: 13px;
		color: #9ca3af;
		margin-bottom: 12px;
		font-weight: 500;
	}
	.address-contact-info {
		margin-top: 14px;
		padding-top: 12px;
		border-top: 1px solid #f3f4f6;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.contact-item {
		font-size: 13px;
		color: #4b5563;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.contact-item .icon {
		flex-shrink: 0;
	}
	.address-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		margin-top: 12px;
	}
	.shipping-badge {
		background: #ecfdf5;
		color: #047857;
	}
	.billing-badge {
		background: #f5f3ff;
		color: #6d28d9;
	}
	.address-badge svg {
		width: 14px;
		height: 14px;
	}

	.no-address-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 24px;
		text-align: center;
		background: #fafafa;
		border-radius: 8px;
		border: 2px dashed #e5e7eb;
	}
	.no-address-icon {
		width: 48px;
		height: 48px;
		color: #d1d5db;
		margin-bottom: 12px;
		opacity: 0.6;
	}
	.no-address-text {
		margin: 0;
		font-size: 14px;
		font-weight: 500;
		color: #9ca3af;
	}

	.review-section {
		margin-bottom: 24px;
		padding: 24px;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		background: white;
	}
	.review-section h3 {
		font-size: 16px;
		font-weight: 700;
		color: #09240f;
		margin-bottom: 16px;
	}
	.payment-display {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.payment-method-box {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: #f9fafb;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		flex: 1;
	}
	.payment-icon {
		font-size: 24px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 28px;
	}
	.payment-method-box span:last-child {
		font-size: 14px;
		font-weight: 500;
		color: #4b5563;
	}

	.checkout-navigation {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-top: 32px;
		padding-top: 24px;
		border-top: 1px solid #e5e7eb;
	}
	.nav-spacer {
		flex: 1;
	}
	.btn-primary,
	.btn-secondary {
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		font-size: 14px;
	}
	.btn-primary {
		background: #059669;
		color: white;
	}
	.btn-primary:hover {
		background: #047857;
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-secondary {
		background: #f3f4f6;
		color: #4b5563;
		border: 1px solid #d1d5db;
	}
	.btn-secondary:hover {
		background: #e5e7eb;
	}
	.checkout-btn {
		font-size: 16px;
		padding: 16px 32px;
	}

	.order-summary {
		position: sticky;
		top: 100px;
		height: fit-content;
	}
	.summary-card {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
	}
	.summary-card h3 {
		font-size: 20px;
		font-weight: 700;
		color: #09240f;
		margin-bottom: 20px;
	}

	.order-items {
		margin-bottom: 24px;
	}
	.order-item {
		display: flex;
		gap: 12px;
		margin-bottom: 16px;
		padding-bottom: 16px;
		border-bottom: 1px solid #f3f4f6;
	}
	.order-item:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}
	.item-image {
		position: relative;
		width: 60px;
		height: 60px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
	}
	.item-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.item-quantity {
		position: absolute;
		top: -6px;
		right: -6px;
		background: #059669;
		color: white;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 600;
	}
	.item-details {
		flex: 1;
	}
	.item-details h4 {
		font-size: 14px;
		font-weight: 600;
		color: #09240f;
		margin-bottom: 4px;
		line-height: 1.3;
	}
	.item-details p {
		font-size: 12px;
		color: #6b7280;
		margin-bottom: 4px;
	}
	.item-price {
		font-size: 14px;
		font-weight: 600;
		color: #059669;
	}

	.promo-section {
		margin-bottom: 24px;
	}
	.promo-input {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}
	.promo-input input {
		flex: 1;
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
	}
	.apply-btn {
		background: #059669;
		color: white;
		border: none;
		padding: 10px 16px;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 14px;
	}
	.apply-btn:hover:not(:disabled) {
		background: #047857;
	}
	.apply-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.promo-applied {
		color: #059669;
		font-size: 12px;
		font-weight: 500;
	}

	.price-breakdown {
		margin-bottom: 24px;
	}
	.price-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
		font-size: 14px;
		color: #4b5563;
	}
	.price-row.discount {
		color: #059669;
	}
	.price-row.total {
		font-size: 18px;
		font-weight: 700;
		color: #09240f;
		margin-bottom: 0;
	}
	.price-divider {
		height: 1px;
		background: #e5e7eb;
		margin: 16px 0;
	}

	.error-message-box {
		padding: 12px 16px;
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
		border-radius: 8px;
		margin-top: 16px;
		font-size: 14px;
		font-weight: 500;
	}

	@media (max-width: 1024px) {
		.checkout-layout {
			grid-template-columns: 1fr 350px;
			gap: 30px;
		}
	}
	@media (max-width: 768px) {
		.checkout-page {
			padding: 60px 0 20px;
		}
		.container {
			padding: 0 16px;
		}
		.checkout-layout {
			grid-template-columns: 1fr;
			gap: 20px;
		}
		.checkout-main {
			padding: 20px;
		}
		.order-summary {
			position: static;
			order: -1;
		}
		.form-row {
			grid-template-columns: 1fr;
		}
		.form-row.cols-3 {
			grid-template-columns: 1fr;
		}
		.form-section {
			padding: 16px;
		}
		.progress-steps {
			margin-bottom: 20px;
		}
		.step {
			padding: 0 10px;
		}
		.step-number {
			width: 32px;
			height: 32px;
			font-size: 14px;
		}
		.step-label {
			font-size: 12px;
		}
		.checkout-navigation {
			flex-direction: column;
			gap: 12px;
		}
		.nav-spacer {
			display: none;
		}
		.btn-primary,
		.btn-secondary {
			width: 100%;
		}
	}
	@media (min-width: 769px) and (max-width: 1024px) {
		.form-row.cols-3 {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 480px) {
		.checkout-main,
		.summary-card {
			padding: 16px;
		}
		.form-section {
			padding: 12px;
			border-radius: 8px;
		}
		.section-icon {
			width: 30px;
			height: 30px;
		}
		.step-header h2 {
			font-size: 22px;
		}
		.item-details h4 {
			font-size: 13px;
		}
	}
</style>
