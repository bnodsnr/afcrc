<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import { isLoggedIn, user } from '$lib/stores/auth';
	import { createApi } from '$lib/api';
	import { get } from 'svelte/store';
	import { enhance } from '$app/forms';

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

	interface billingAddress {
		id?: number;
		address_type: 'billing';
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

	interface ShippingAddress {
		fullName?: string;
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
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

	// Load cart items from sessionStorage (passed from cart page)
	let checkoutItems: CheckoutItem[] = $state([]);

	// Load items on mount
	import { onMount } from 'svelte';

	let userProfile: UserProfile | null = $state(null);
	let billingAddress: billingAddress | null = $state(null);
	let shippingAddresses: Address[] = $state([]);
	let billingAddresses: Address[] = $state([]);
	let isLoadingProfile = $state(true);
	let selectedShippingAddressId: number | null = $state(null);
	let selectedBillingAddressId: number | null = $state(null);
	let showAddressForm = $state(false);
	let showBillingForm = $state(false);
	let showQRCode = $state(false);
	let qrCodeData = $state('');

	// Create API client instance
	const api = createApi(fetch);

	async function fetchUserProfile() {
		if (!$isLoggedIn) {
			isLoadingProfile = false;
			return;
		}

		try {
			// Fetch profile
			const profileResponse = await api.profile.getProfile();
			if (profileResponse) {
				// Handle the new response structure with user object
				let userData = profileResponse.user;
				let userProfileData = userData?.profile || profileResponse.profile;

				if (userProfileData) {
					userProfile = userProfileData as UserProfile;
				}
				// Populate name, email, and phone from profile
				if (userProfileData) {
					shippingAddress.firstName = userProfileData.first_name || '';
					shippingAddress.lastName = userProfileData.last_name || '';
					shippingAddress.email = userProfileData.email || userProfileData.user_email || '';
					shippingAddress.phone = userProfileData.phone_number || '';
					shippingAddress.fullName =
						`${userProfileData.first_name || ''} ${userProfileData.last_name || ''}`.trim();
				}

				// Get shipping address from user object if available
				if (userData?.shipping_address) {
					const shippingAddr = userData.shipping_address;
					shippingAddress.address = shippingAddr.address_line1 || '';
					shippingAddress.city = shippingAddr.city || '';
					shippingAddress.state = shippingAddr.state || '';
					shippingAddress.postalCode = shippingAddr.postal_code || '';
					shippingAddress.country = shippingAddr.country || 'Nepal';

					// Update fullName from shipping address if present
					if (shippingAddr.full_name) {
						shippingAddress.fullName = shippingAddr.full_name;
						const nameParts = shippingAddr.full_name.split(' ');
						shippingAddress.firstName = nameParts[0] || '';
						shippingAddress.lastName = nameParts.slice(1).join(' ') || '';
					}

					billingAddress = {
						id: shippingAddr.id,
						address_type: 'billing',
						address_line1: shippingAddr.address_line1,
						address_line2: shippingAddr.address_line2,
						city: shippingAddr.city,
						state: shippingAddr.state,
						postal_code: shippingAddr.postal_code,
						country: shippingAddr.country,
						is_default: shippingAddr.is_default
					};
				} else if (userData?.billing_address) {
					// Fall back to billing address if shipping not available
					const billingAddr = userData.billing_address;
					shippingAddress.address = billingAddr.address_line1 || '';
					shippingAddress.city = billingAddr.city || '';
					shippingAddress.state = billingAddr.state || '';
					shippingAddress.postalCode = billingAddr.postal_code || '';
					shippingAddress.country = billingAddr.country || 'Nepal';

					if (billingAddr.full_name) {
						shippingAddress.fullName = billingAddr.full_name;
						const nameParts = billingAddr.full_name.split(' ');
						shippingAddress.firstName = nameParts[0] || '';
						shippingAddress.lastName = nameParts.slice(1).join(' ') || '';
					}

					billingAddress = {
						id: billingAddr.id,
						address_type: 'billing',
						address_line1: billingAddr.address_line1,
						address_line2: billingAddr.address_line2,
						city: billingAddr.city,
						state: billingAddr.state,
						postal_code: billingAddr.postal_code,
						country: billingAddr.country,
						is_default: billingAddr.is_default
					};
				}
			} else {
				console.error('[Checkout] Failed to fetch profile');
			}
		} catch (error) {
			console.error('[Checkout] Error fetching profile or address:', error);
		} finally {
			isLoadingProfile = false;
		}
	}

	async function fetchBillingAddress(api: ReturnType<typeof createApi>) {
		try {
			const response = await api.addresses.getBillingAddresses();
			let addresses: Address[] = [];
			if (response?.data && Array.isArray(response.data)) {
				addresses = response.data as Address[];
			} else if (Array.isArray(response)) {
				addresses = response as Address[];
			}

			billingAddresses = addresses;
			if (addresses.length > 0) {
				// Auto-select first default address if available
				const defaultAddress = billingAddresses.find((addr) => addr.is_default);
				if (defaultAddress && defaultAddress.id !== undefined) {
					selectedBillingAddressId = defaultAddress.id;
				}
			}
		} catch (error) {
			console.error('Failed to fetch billing address:', error);
			billingAddresses = [];
		}
		return null;
	}

	async function fetchShippingAddress(api: ReturnType<typeof createApi>) {
		try {
			const response = await api.addresses.getShippingAddresses();
			// Handle both response formats: {data: [...]} or direct array [...]
			let addresses: Address[] = [];
			if (response?.data && Array.isArray(response.data)) {
				addresses = response.data as Address[];
			} else if (Array.isArray(response)) {
				addresses = response as Address[];
			}

			shippingAddresses = addresses;

			if (addresses.length > 0) {
				// Auto-select first default address if available
				const defaultAddress = shippingAddresses.find((addr) => addr.is_default);
				if (defaultAddress && defaultAddress.id !== undefined) {
					selectedShippingAddressId = defaultAddress.id;
					populateAddressFields(defaultAddress);
				} else {
					showAddressForm = true; // Show form if no default address to pre-fill
				}
			}
		} catch (error) {
			console.error('Failed to fetch shipping address:', error);
			shippingAddresses = [];
		}
		return null;
	}

	function populateAddressFields(address: Address | ShippingAddress) {
		// Handle Address type from API
		if ('address_line1' in address) {
			const addr = address as Address;
			shippingAddress.fullName = addr.full_name || '';
			const nameParts = (addr.full_name || '').split(' ');
			shippingAddress.firstName = nameParts[0] || '';
			shippingAddress.lastName = nameParts.slice(1).join(' ') || '';
			shippingAddress.email = addr.email || '';
			shippingAddress.phone = addr.phone || '';
			shippingAddress.address = addr.address_line1 || '';
			shippingAddress.city = addr.city || '';
			shippingAddress.state = addr.state || '';
			shippingAddress.postalCode = addr.postal_code || '';
			shippingAddress.country = addr.country || 'Nepal';
		} else {
			// Handle ShippingAddress type
			const addr = address as ShippingAddress;
			shippingAddress.fullName = addr.fullName || '';
			const nameParts = (addr.fullName || '').split(' ');
			shippingAddress.firstName = nameParts[0] || '';
			shippingAddress.lastName = nameParts.slice(1).join(' ') || '';
			shippingAddress.email = addr.email || '';
			shippingAddress.phone = addr.phone || '';
			shippingAddress.address = addr.address || '';
			shippingAddress.city = addr.city || '';
			shippingAddress.state = addr.state || '';
			shippingAddress.postalCode = addr.postalCode || '';
			shippingAddress.country = addr.country || 'Nepal';
		}
	}

	function selectShippingAddress(address: Address) {
		if (address.id !== undefined) {
			selectedShippingAddressId = address.id;
		}
		populateAddressFields(address);
		showAddressForm = false;
	}

	function toggleAddressForm() {
		showAddressForm = !showAddressForm;
		if (showAddressForm) {
			selectedShippingAddressId = null;
		}
	}

	function selectBillingAddress(address: Address) {
		if (address.id !== undefined) {
			selectedBillingAddressId = address.id;
		}
		showBillingForm = false;
	}

	function toggleBillingForm() {
		showBillingForm = !showBillingForm;
		if (showBillingForm) {
			selectedBillingAddressId = null;
		}
	}

	onMount(async () => {
		// Load checkout items from sessionStorage
		if (typeof sessionStorage !== 'undefined') {
			const stored = sessionStorage.getItem('checkoutItems');
			if (stored) {
				try {
					checkoutItems = JSON.parse(stored);
				} catch (e) {
					console.error('Failed to parse checkout items:', e);
					// Redirect back to cart if no valid items
					window.location.href = '/cart';
				}
			} else {
				// No items selected, redirect to cart
				window.location.href = '/cart';
			}
		}

		// Fetch user profile and addresses in parallel
		await Promise.all([fetchUserProfile(), fetchBillingAddress(api), fetchShippingAddress(api)]);
	});

	// Form data
	let shippingAddress: ShippingAddress = $state({
		firstName: '',
		lastName: '',
		fullName: '',
		email: '',
		phone: '',
		address: '',
		city: '',
		state: '',
		postalCode: '',
		country: 'Nepal'
	});

	let paymentMethod: PaymentMethod = $state({
		type: 'cod',
		cardNumber: '',
		expiryDate: '',
		cvv: '',
		nameOnCard: ''
	});

	let billingAddressForm: ShippingAddress = $state({
		firstName: '',
		lastName: '',
		fullName: '',
		email: '',
		phone: '',
		address: '',
		city: '',
		state: '',
		postalCode: '',
		country: 'Nepal'
	});

	let billingAddressSame = $state(false);
	let saveInfo = $state(false);
	let subscribeNewsletter = $state(true);
	let promoCode = $state('');
	let promoDiscount = $state(0);
	let isPromoApplied = $state(false);

	let isEditing = $state(false);
	let isSubmitting = $state(false);
	let submitMessage: { type: 'success' | 'error'; text: string } | null = $state(null);

	// Handle billing address same as shipping checkbox
	$effect(() => {
		if (billingAddressSame) {
			// Copy shipping address to billing form
			billingAddressForm.firstName = shippingAddress.firstName;
			billingAddressForm.lastName = shippingAddress.lastName;
			billingAddressForm.fullName = shippingAddress.fullName;
			billingAddressForm.email = shippingAddress.email;
			billingAddressForm.phone = shippingAddress.phone;
			billingAddressForm.address = shippingAddress.address;
			billingAddressForm.city = shippingAddress.city;
			billingAddressForm.state = shippingAddress.state;
			billingAddressForm.postalCode = shippingAddress.postalCode;
			billingAddressForm.country = shippingAddress.country;
		} else {
			// Clear billing form to allow user to enter new address
			billingAddressForm = {
				firstName: '',
				lastName: '',
				fullName: '',
				email: '',
				phone: '',
				address: '',
				city: '',
				state: '',
				postalCode: '',
				country: 'Nepal'
			};
		}
	});

	// Calculations
	let subtotal = $derived(checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
	let shipping = $derived(subtotal > 50 ? 0 : 8.99);
	let tax = $derived(subtotal * 0.08);
	let discount = $derived(isPromoApplied ? subtotal * (promoDiscount / 100) : 0);
	let total = $derived(subtotal + shipping + tax - discount);

	// Current step (1: Shipping, 2: Billing, 3: Payment, 4: Review)
	let currentStep = $state(1);

	// Validation
	let errors: { [key: string]: string } = $state({});

	function validateStep(step: number): boolean {
		errors = {};

		if (step === 1) {
			// Validate shipping address
			if (!shippingAddress.firstName) errors.firstName = 'First name is required';

			if (!shippingAddress.email) errors.email = 'Email is required';
			if (!shippingAddress.phone) errors.phone = 'Phone number is required';
			if (!shippingAddress.address) errors.address = 'Address is required';
			if (!shippingAddress.city) errors.city = 'City is required';
			if (!shippingAddress.postalCode) errors.postalCode = 'Postal code is required';
		} else if (step === 2) {
			// Validate billing address
			if (billingAddressSame) {
				// When same as shipping, billing is already validated via shipping address validation
				return true;
			} else {
				// When different from shipping, must select a billing address
				if (selectedBillingAddressId === null) {
					errors.billingAddress = 'Please select a billing address';
				}
			}
		} else if (step === 3) {
			// Validate payment method
			if (paymentMethod.type === 'card') {
				if (!paymentMethod.cardNumber) errors.cardNumber = 'Card number is required';
				if (!paymentMethod.expiryDate) errors.expiryDate = 'Expiry date is required';
				if (!paymentMethod.cvv) errors.cvv = 'CVV is required';
				if (!paymentMethod.nameOnCard) errors.nameOnCard = 'Name on card is required';
			}
		}

		// // Debug: show validation errors when present
		// if (Object.keys(errors).length > 0) {
		// 	console.log('[DEBUG] Validation failed for step', step, 'errors:', errors);
		// } else {
		// 	console.log('[DEBUG] Validation passed for step', step);
		// }

		return Object.keys(errors).length === 0;
	}
	function nextStep() {
		// console.log(
		// 	'[DEBUG] nextStep called. currentStep=',
		// 	currentStep,
		// 	'isLoadingProfile=',
		// 	isLoadingProfile
		// );
		if (isLoadingProfile) {
			console.log('[DEBUG] Profile still loading - preventing navigation until data loaded');
			return;
		}

		const ok = validateStep(currentStep);
		if (ok) {
			// If moving from step 1 (shipping) to step 2 (billing), auto-populate billing address
			if (currentStep === 1) {
				// Auto-select a billing address if one exists and billingAddressSame is true
				if (billingAddressSame && billingAddresses.length > 0) {
					const defaultBillingAddress = billingAddresses.find((addr) => addr.is_default);
					if (defaultBillingAddress && defaultBillingAddress.id !== undefined) {
						selectedBillingAddressId = defaultBillingAddress.id;
					}
				}
			}
			// console.log('[DEBUG] Advancing from step', currentStep, 'to', currentStep + 1);
			currentStep++;
		} else {
			console.log('[DEBUG] Not advancing - validation failed');
		}
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
		// Prepare order payload
		const orderPayload = prepareOrderPayload();
		if (!orderPayload) {
			alert('Failed to prepare order - missing user data');
			return;
		}

		try {
			// Submit order to backend
			const response = await api.orders.confirmOrder(orderPayload);

			console.log('[Checkout] Order submission response:', response);

			if (response) {
				// Store full order data + checkout context for confirmation page
				if (typeof sessionStorage !== 'undefined') {
					const confirmationData = {
						...response,
						shippingAddress: { ...shippingAddress },
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
					// Clear checkout items after successful order
					sessionStorage.removeItem('checkoutItems');
				}

				// Redirect to order confirmation page
				window.location.href = '/order-confirmation';
			} else {
				console.error('[Checkout] Order submission failed');
				alert('Failed to place order. Please try again.');
			}
		} catch (error) {
			console.error('[Checkout] Error submitting order:', error);
			alert(`Error placing order: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	function getUserData() {
		const userData = get(user);

		if (!userData || !userData.id) {
			console.error('User ID not available');
			return null;
		}

		return userData;
	}

	function buildOrderItems() {
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

		console.log('[DEBUG] Order items with cart/cart_item:', orderItems);
		return orderItems;
	}

	function buildShippingAddressPayload() {
		const shippingAddressPayload = {
			first_name: shippingAddress.firstName,
			last_name: shippingAddress.lastName,
			email: shippingAddress.email,
			phone: shippingAddress.phone,
			address_line1: shippingAddress.address,
			city: shippingAddress.city,
			state: shippingAddress.state,
			postal_code: shippingAddress.postalCode,
			country: shippingAddress.country
		};

		console.log('[DEBUG] Shipping address payload:', shippingAddressPayload);
		return shippingAddressPayload;
	}

	function buildPricePayload() {
		const pricePayload = {
			subtotal: parseFloat(subtotal.toFixed(2)),
			shipping: parseFloat(shipping.toFixed(2)),
			tax: parseFloat(tax.toFixed(2)),
			discount: parseFloat(discount.toFixed(2)),
			total: parseFloat(total.toFixed(2))
		};

		console.log('[DEBUG] Price payload:', pricePayload);
		return pricePayload;
	}

	function buildPromoPayload() {
		const promoPayload = {
			promo_code: isPromoApplied ? promoCode : undefined,
			promo_discount_percentage: isPromoApplied ? promoDiscount : 0
		};

		console.log('[DEBUG] Promo payload:', promoPayload);
		return promoPayload;
	}

	function prepareOrderPayload() {
		// Get user data
		const userData = getUserData();
		console.log('[DEBUG] User data for order payload:', userData);
		if (!userData) {
			return null;
		}

		// Build individual payload components
		const orderItems = buildOrderItems();
		const shippingAddressPayload = buildShippingAddressPayload();
		const pricePayload = buildPricePayload();
		const promoPayload = buildPromoPayload();

		// Complete order payload
		const orderPayload = {
			user_id: userData.id,
			cart_id: checkoutItems.length > 0 ? checkoutItems[0].cartId : null,
			items: orderItems,
			shipping_address: selectedShippingAddressId,
			billing_address: selectedBillingAddressId,
			payment_method: paymentMethod.type,
			...pricePayload,
			...promoPayload
		};

		console.log('[DEBUG] Complete order payload:', orderPayload);
		return orderPayload;
	}
</script>

<svelte:head>
	<title>Checkout - Himalayan Hemp Heaven</title>
</svelte:head>

<Topbar />

<main class="checkout-page">
	<div class="container">
		<!-- Breadcrumb -->
		<nav class="breadcrumb">
			<a href="/">Home</a>
			<span class="separator">></span>
			<a href="/cart">Cart</a>
			<span class="separator">></span>
			<span class="current">Checkout</span>
		</nav>

		<!-- Progress Steps -->
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
			<!-- Main Content -->
			<div class="checkout-main">
				{#if currentStep === 1}
					<!-- Step 1: Shipping Information -->
					<div class="step-content">
						<div class="step-header">
							<h2>Shipping Information</h2>
							<p>Please provide your shipping details</p>
						</div>

						{#if isLoadingProfile}
							<div class="loading-profile">
								<div class="spinner"></div>
								<p>Loading your information...</p>
							</div>
						{:else if userProfile && billingAddress}
							<div class="profile-info">
								<div class="profile-badge">
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
									<span>Your billing address has been loaded</span>
								</div>
							</div>
						{/if}

						<!-- Shipping Address Selection or Form -->
						{#if shippingAddresses.length > 0}
							<!-- Display Existing Addresses -->
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
									{#each shippingAddresses as address}
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
														<br />
														<span class="address-icon"></span>{address.address_line2}
													{/if}
												</p>
												<p class="city-state">
													{address.city}, {address.state}
													{address.postal_code}
												</p>
												<p class="country">{address.country}</p>

												<div class="contact-info">
													<p class="info-row">
														<span class="info-icon">📞</span>
														{address.phone}
													</p>
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

								<!-- <button type="button" class="btn-add-address" onclick={toggleAddressForm}>
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
								</button> -->
							</div>
						{:else}
							<div class="">
								<form
									class="checkout-form"
									method="POST"
									action="?/updateShippingAddress"
									use:enhance={() => {
										isSubmitting = true;
										return async ({ result }) => {
											isSubmitting = false;
											if (result.type === 'success') {
												submitMessage = {
													type: 'success',
													text: 'Shipping address updated successfully!'
												};
											} else {
												submitMessage = {
													type: 'error',
													text: 'Failed to update shipping address. Please try again.'
												};
											}
											// Clear message after 3 seconds
											setTimeout(() => {
												submitMessage = null;
											}, 3000);
										};
									}}
								>
									<!-- Contact Information -->
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
													bind:value={shippingAddress.firstName}
													class={errors.firstName ? 'error' : ''}
													placeholder=" "
												/>
												<label for="firstName">First Name <span class="req">*</span></label>
												{#if errors.firstName}
													<span class="error-message">{errors.firstName}</span>
												{/if}
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="lastName"
													name="lastName"
													bind:value={shippingAddress.lastName}
													class={errors.lastName ? 'error' : ''}
													placeholder=" "
												/>
												<label for="lastName">Last Name <span class="req">*</span></label>
												{#if errors.lastName}
													<span class="error-message">{errors.lastName}</span>
												{/if}
											</div>

											<div class="form-group floating">
												<input
													type="tel"
													id="phone"
													bind:value={shippingAddress.phone}
													class={errors.phone ? 'error' : ''}
													placeholder=" "
													name="phone"
												/>
												<label for="phone">Phone <span class="req">*</span></label>
												{#if errors.phone}
													<span class="error-message">{errors.phone}</span>
												{/if}
											</div>
											<div class="form-group floating">
												<input
													type="email"
													id="email"
													name="email"
													bind:value={shippingAddress.email}
													class={errors.email ? 'error' : ''}
													placeholder=" "
												/>
												<label for="email">Email Address <span class="req">*</span></label>
												{#if errors.email}
													<span class="error-message">{errors.email}</span>
												{/if}
											</div>
										</div>

										<div class="form-row"></div>
									</div>
									<!-- Shipping Address -->
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
													bind:value={shippingAddress.address}
													class={errors.address ? 'error' : ''}
													placeholder=" "
												/>
												<label for="address">Street Address <span class="req">*</span></label>
												{#if errors.address}
													<span class="error-message">{errors.address}</span>
												{/if}
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="city"
													name="city"
													bind:value={shippingAddress.city}
													class={errors.city ? 'error' : ''}
													placeholder=" "
												/>
												<label for="city">City <span class="req">*</span></label>
												{#if errors.city}<div class="form-group floating">
														<input
															type="text"
															id="city"
															bind:value={shippingAddress.city}
															class={errors.city ? 'error' : ''}
															placeholder=" "
														/>
														<label for="city">City <span class="req">*</span></label>
														{#if errors.city}
															<span class="error-message">{errors.city}</span>
														{/if}
													</div>
													<span class="error-message">{errors.city}</span>
												{/if}
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="state"
													name="state"
													bind:value={shippingAddress.state}
													placeholder=" "
												/>
												<label for="state">State / Province</label>
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="postalCode"
													name="postalCode"
													bind:value={shippingAddress.postalCode}
													class={errors.postalCode ? 'error' : ''}
													placeholder=" "
												/>
												<label for="postalCode">Postal Code <span class="req">*</span></label>
												{#if errors.postalCode}
													<span class="error-message">{errors.postalCode}</span>
												{/if}
											</div>
										</div>

										<div class="form-row">
											<div class="form-group floating select-group">
												<select id="country" name="country" bind:value={shippingAddress.country}>
													<option value="Nepal">🇳🇵 Nepal</option>
													<!-- <option value="India">🇮🇳 India</option>
													<option value="Bangladesh">🇧🇩 Bangladesh</option>
													<option value="Bhutan">🇧🇹 Bhutan</option> -->
												</select>
												<label for="country">Country</label>
											</div>

											<div class="form-group floating">
												<button type="submit" class="btn-toggle-form">Save</button>
											</div>
										</div>
									</div>
								</form>
							</div>
						{/if}

						<!-- Address Form (shown when no addresses exist or user wants to add new) -->
					</div>
				{:else if currentStep === 2}
					<!-- Step 2: Billing Details -->
					<div class="step-content">
						<div class="step-header">
							<h2>Billing Details</h2>
							<p>Confirm your billing address</p>
						</div>

						{#if billingAddresses.length > 0}
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
									<h3>Billing Address</h3>
								</div>

								<div class="address-cards-container">
									{#each billingAddresses as address}
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
														<br />
														<span class="address-icon"></span>{address.address_line2}
													{/if}
												</p>
												<p class="city-state">
													{address.city}, {address.state}
													{address.postal_code}
												</p>
												<p class="country">{address.country}</p>

												<div class="contact-info">
													<p class="info-row">
														<span class="info-icon">📞</span>
														{address.phone}
													</p>
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
							</div>
						{:else}
							<div class="">
								<!-- Same as Shipping Address Toggle -->
								<div class="billing-same-section">
									<label class="checkbox-label">
										<input type="checkbox" bind:checked={billingAddressSame} />
										<span class="checkmark"></span>
										<span>Billing address same as shipping address</span>
									</label>
								</div>
								<form
									class="checkout-form"
									method="POST"
									action="?/updateBillingAddress"
									use:enhance={() => {
										isSubmitting = true;
										return async ({ result }) => {
											isSubmitting = false;
											if (result.type === 'success') {
												submitMessage = {
													type: 'success',
													text: 'Billing address created successfully!'
												};

												// Fetch updated billing addresses
												try {
													const response = await api.addresses.getBillingAddresses();
													let addresses: Address[] = [];
													if (response?.data && Array.isArray(response.data)) {
														addresses = response.data as Address[];
													} else if (Array.isArray(response)) {
														addresses = response as Address[];
													}

													billingAddresses = addresses;

													// Auto-select the last (newly created) address
													if (addresses.length > 0) {
														const newAddress = addresses[addresses.length - 1];
														if (newAddress.id !== undefined) {
															selectedBillingAddressId = newAddress.id;
														}
													}

													// Hide the form
													showBillingForm = false;
												} catch (error) {
													console.error('Failed to refresh billing addresses:', error);
												}
											} else {
												submitMessage = {
													type: 'error',
													text: 'Failed to create billing address. Please try again.'
												};
											}
											// Clear message after 3 seconds
											setTimeout(() => {
												submitMessage = null;
											}, 3000);
										};
									}}
								>
									<!-- Contact Information -->
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
													bind:value={billingAddressForm.firstName}
													class={errors.firstName ? 'error' : ''}
													placeholder=" "
												/>
												<label for="billingFirstName">First Name <span class="req">*</span></label>
												{#if errors.firstName}
													<span class="error-message">{errors.firstName}</span>
												{/if}
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="billingLastName"
													name="lastName"
													bind:value={billingAddressForm.lastName}
													class={errors.lastName ? 'error' : ''}
													placeholder=" "
												/>
												<label for="billingLastName">Last Name <span class="req">*</span></label>
												{#if errors.lastName}
													<span class="error-message">{errors.lastName}</span>
												{/if}
											</div>

											<div class="form-group floating">
												<input
													type="tel"
													id="billingPhone"
													bind:value={billingAddressForm.phone}
													class={errors.phone ? 'error' : ''}
													placeholder=" "
													name="phone"
												/>
												<label for="billingPhone">Phone <span class="req">*</span></label>
												{#if errors.phone}
													<span class="error-message">{errors.phone}</span>
												{/if}
											</div>
											<div class="form-group floating">
												<input
													type="email"
													id="billingEmail"
													name="email"
													bind:value={billingAddressForm.email}
													class={errors.email ? 'error' : ''}
													placeholder=" "
												/>
												<label for="email">Email Address <span class="req">*</span></label>
												{#if errors.email}
													<span class="error-message">{errors.email}</span>
												{/if}
											</div>
										</div>

										<div class="form-row"></div>
									</div>
									<!-- Billing Address -->
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
													bind:value={billingAddressForm.address}
													class={errors.address ? 'error' : ''}
													placeholder=" "
												/>
												<label for="billingAddress">Street Address <span class="req">*</span></label
												>
												{#if errors.address}
													<span class="error-message">{errors.address}</span>
												{/if}
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="billingCity"
													name="city"
													bind:value={billingAddressForm.city}
													class={errors.city ? 'error' : ''}
													placeholder=" "
												/>
												<label for="billingCity">City <span class="req">*</span></label>
												{#if errors.city}
													<span class="error-message">{errors.city}</span>
												{/if}
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="billingState"
													name="state"
													bind:value={billingAddressForm.state}
													placeholder=" "
												/>
												<label for="billingState">State / Province</label>
											</div>
											<div class="form-group floating">
												<input
													type="text"
													id="billingPostalCode"
													name="postalCode"
													bind:value={billingAddressForm.postalCode}
													class={errors.postalCode ? 'error' : ''}
													placeholder=" "
												/>
												<label for="billingPostalCode">Postal Code <span class="req">*</span></label
												>
												{#if errors.postalCode}
													<span class="error-message">{errors.postalCode}</span>
												{/if}
											</div>
										</div>

										<div class="form-row">
											<div class="form-group floating select-group">
												<select
													id="billingCountry"
													name="country"
													bind:value={billingAddressForm.country}
												>
													<option value="Nepal">🇳🇵 Nepal</option>
												</select>
												<label for="billingCountry">Country</label>
											</div>

											<div class="form-group floating">
												<button type="submit" class="btn-toggle-form">Save Billing Address</button>
											</div>
										</div>
									</div>
								</form>
							</div>
						{/if}

						<!-- Billing Validation Error -->
						{#if errors.billingAddress}
							<div class="error-message-box">
								{errors.billingAddress}
							</div>
						{/if}
					</div>
				{:else if currentStep === 3}
					<!-- Step 3: Payment Information -->
					<div class="step-content">
						<div class="step-header">
							<h2>Payment Information</h2>
							<p>Choose your preferred payment method</p>
						</div>

						<!-- Payment Method Selection -->
						<div class="payment-methods">
							<div class="payment-options">
								<label class="payment-option">
									<input type="radio" name="payment" value="cod" bind:group={paymentMethod.type} />
									<div class="payment-card">
										<div class="payment-icon">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 48 28"
												width="48"
												height="28"
												><rect width="48" height="28" rx="5" fill="#059669" /><path
													d="M10 18h2a3 3 0 006 0h8a3 3 0 006 0h3v-5l-4-5h-5V7H10v11z"
													fill="none"
													stroke="#fff"
													stroke-width="1.5"
													stroke-linejoin="round"
												/><circle cx="15" cy="18" r="2" fill="#fff" /><circle
													cx="29"
													cy="18"
													r="2"
													fill="#fff"
												/><path
													d="M26 8h5l3.5 4.5H26V8z"
													fill="none"
													stroke="#fff"
													stroke-width="1.2"
												/><text
													x="14"
													y="14"
													font-size="4.5"
													fill="#fff"
													font-weight="600"
													font-family="sans-serif">COD</text
												></svg
											>
										</div>
										<span>Cash on Delivery</span>
									</div>
								</label>
								<label class="payment-option"
									><button
										class="scan-button"
										onclick={() => {
											showQRCode = !showQRCode;
											if (!showQRCode) qrCodeData = '';
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
												d="M3.5 1.5h4m0 0V5m0-3.5L3 1.5M3.5 5.5h4m0 0v3.5m0-3.5L3 5.5M8 8h.01M3.5 14.5h4m0 0v3.5m0-3.5L3 14.5M20 3h-3m0 0V1m0 2h3m0-2v3m0-3h-3m0 0V1m2 10h.01m3 2h-3m0 0v3.5m0-3.5h3m0 0v3.5m-3-3.5v-2"
											/>
										</svg>
										{showQRCode ? 'Hide QR Code' : 'Scan Now'}
									</button>
									{#if showQRCode}
										<div class="qr-code-container animate-slide-in">
											<img src="/esewa_qr.png" alt="eSewa QR Code" class="qr-code-img" />
											<p class="qr-info-text">Scan with your eSewa app to pay</p>
										</div>
									{/if}</label
								>
							</div>
						</div>

						<!-- Payment Details (shown based on selected method) -->
						<div class="payment-detail-section">
							{#if paymentMethod.type === 'cod'}
								<div class="digital-payment-info">
									<div class="cod-icon-wrap">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 64 40"
											width="64"
											height="40"
											><rect width="64" height="40" rx="8" fill="#059669" /><path
												d="M14 26h3a4 4 0 008 0h10a4 4 0 008 0h4v-7l-5-6h-7V10H14v16z"
												fill="none"
												stroke="#fff"
												stroke-width="2"
												stroke-linejoin="round"
											/><circle cx="21" cy="26" r="2.5" fill="#fff" /><circle
												cx="39"
												cy="26"
												r="2.5"
												fill="#fff"
											/><path
												d="M35 13h6l4.5 5.5H35V13z"
												fill="none"
												stroke="#fff"
												stroke-width="1.5"
											/></svg
										>
									</div>
									<h4>Cash on Delivery</h4>
									<p>Pay with cash when your order is delivered to your doorstep.</p>
									<ul class="cod-features">
										<li>✅ No online payment required</li>
										<li>✅ Pay only when you receive the product</li>
										<li>✅ Inspect before you pay</li>
									</ul>
								</div>

								<div class="digital-payment-info">
									<!-- <div class="payment-logo">
										<img src="/esewa_logo.svg" alt="eSewa" class="payment-logo-img" />
									</div> -->
									<!-- <p>You will be redirected to eSewa to complete your payment securely.</p> -->
									<button
										class="scan-button"
										onclick={() => {
											showQRCode = !showQRCode;
											if (!showQRCode) qrCodeData = '';
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
												d="M3.5 1.5h4m0 0V5m0-3.5L3 1.5M3.5 5.5h4m0 0v3.5m0-3.5L3 5.5M8 8h.01M3.5 14.5h4m0 0v3.5m0-3.5L3 14.5M20 3h-3m0 0V1m0 2h3m0-2v3m0-3h-3m0 0V1m2 10h.01m3 2h-3m0 0v3.5m0-3.5h3m0 0v3.5m-3-3.5v-2"
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
							{:else if paymentMethod.type === 'card'}
								<!-- Card Payment Form -->
								<form class="payment-form">
									<div class="form-row">
										<div class="form-group floating">
											<input
												type="text"
												id="nameOnCard"
												bind:value={paymentMethod.nameOnCard}
												class={errors.nameOnCard ? 'error' : ''}
												placeholder=" "
											/>
											<label for="nameOnCard">Name on Card <span class="req">*</span></label>
											{#if errors.nameOnCard}
												<span class="error-message">{errors.nameOnCard}</span>
											{/if}
										</div>
									</div>

									<div class="form-row">
										<div class="form-group floating">
											<input
												type="text"
												id="cardNumber"
												value={paymentMethod.cardNumber}
												oninput={handleCardNumberInput}
												class={errors.cardNumber ? 'error' : ''}
												placeholder=" "
												maxlength="19"
											/>
											<label for="cardNumber">Card Number <span class="req">*</span></label>
											{#if errors.cardNumber}
												<span class="error-message">{errors.cardNumber}</span>
											{/if}
										</div>
									</div>

									<div class="form-row cols-3">
										<div class="form-group floating">
											<input
												type="text"
												id="expiryDate"
												value={paymentMethod.expiryDate}
												oninput={handleExpiryInput}
												class={errors.expiryDate ? 'error' : ''}
												placeholder=" "
												maxlength="5"
											/>
											<label for="expiryDate">Expiry (MM/YY) <span class="req">*</span></label>
											{#if errors.expiryDate}
												<span class="error-message">{errors.expiryDate}</span>
											{/if}
										</div>
										<div class="form-group floating">
											<input
												type="text"
												id="cvv"
												bind:value={paymentMethod.cvv}
												class={errors.cvv ? 'error' : ''}
												placeholder=" "
												maxlength="4"
											/>
											<label for="cvv">CVV <span class="req">*</span></label>
											{#if errors.cvv}
												<span class="error-message">{errors.cvv}</span>
											{/if}
										</div>
										<div class="form-group card-icons">
											<span class="card-brand">💳</span>
											<span class="card-brand">VISA</span>
											<span class="card-brand">MC</span>
										</div>
									</div>
								</form>
							{:else if paymentMethod.type === 'esewa'}
								<div class="digital-payment-info">
									<div class="payment-logo">
										<img src="/esewa_logo.svg" alt="eSewa" class="payment-logo-img" />
									</div>
									<p>You will be redirected to eSewa to complete your payment securely.</p>
									<button
										class="scan-button"
										onclick={() => {
											showQRCode = !showQRCode;
											if (!showQRCode) qrCodeData = '';
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
												d="M3.5 1.5h4m0 0V5m0-3.5L3 1.5M3.5 5.5h4m0 0v3.5m0-3.5L3 5.5M8 8h.01M3.5 14.5h4m0 0v3.5m0-3.5L3 14.5M20 3h-3m0 0V1m0 2h3m0-2v3m0-3h-3m0 0V1m2 10h.01m3 2h-3m0 0v3.5m0-3.5h3m0 0v3.5m-3-3.5v-2"
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
							{:else if paymentMethod.type === 'khalti'}
								<div class="digital-payment-info">
									<div class="payment-logo">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 120 44"
											class="payment-logo-img"
											><rect width="120" height="44" rx="8" fill="#5C2D91" /><text
												x="60"
												y="28"
												text-anchor="middle"
												font-size="22"
												fill="#fff"
												font-weight="700"
												font-family="Arial, sans-serif">Khalti</text
											></svg
										>
									</div>
									<p>You will be redirected to Khalti to complete your payment securely.</p>
									<button
										class="scan-button"
										onclick={() => {
											showQRCode = !showQRCode;
											if (!showQRCode) qrCodeData = '';
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
												d="M3.5 1.5h4m0 0V5m0-3.5L3 1.5M3.5 5.5h4m0 0v3.5m0-3.5L3 5.5M8 8h.01M3.5 14.5h4m0 0v3.5m0-3.5L3 14.5M20 3h-3m0 0V1m0 2h3m0-2v3m0-3h-3m0 0V1m2 10h.01m3 2h-3m0 0v3.5m0-3.5h3m0 0v3.5m-3-3.5v-2"
											/>
										</svg>
										{showQRCode ? 'Hide QR Code' : 'Scan Now'}
									</button>
									{#if showQRCode}
										<div class="qr-code-container animate-slide-in">
											<img src="/khalti_qr.png" alt="Khalti QR Code" class="qr-code-img" />
											<p class="qr-info-text">Scan with your Khalti app to pay</p>
										</div>
									{/if}
								</div>
							{:else if paymentMethod.type === 'paypal'}
								<div class="digital-payment-info">
									<div class="payment-logo">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 120 44"
											class="payment-logo-img"
											><rect width="120" height="44" rx="8" fill="#003087" /><text
												x="60"
												y="20"
												text-anchor="middle"
												font-size="16"
												fill="#fff"
												font-weight="700"
												font-family="Arial, sans-serif">Pay</text
											><text
												x="60"
												y="36"
												text-anchor="middle"
												font-size="16"
												fill="#009cde"
												font-weight="700"
												font-family="Arial, sans-serif">Pal</text
											></svg
										>
									</div>
									<p>You will be redirected to PayPal to complete your payment securely.</p>
								</div>
							{:else if paymentMethod.type === 'imepay'}
								<div class="digital-payment-info">
									<div class="payment-logo">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 120 44"
											class="payment-logo-img"
											><rect width="120" height="44" rx="8" fill="#FF6B35" /><text
												x="60"
												y="28"
												text-anchor="middle"
												font-size="18"
												fill="#fff"
												font-weight="700"
												font-family="Arial, sans-serif">IME Pay</text
											></svg
										>
									</div>
									<p>You will be redirected to IME Pay to complete your payment securely.</p>
								</div>
							{/if}
						</div>
					</div>
				{:else if currentStep === 4}
					<!-- Step 4: Review Order -->
					<div class="step-content">
						<div class="step-header">
							<h2>Review Your Order</h2>
							<p>Please review your order before placing it</p>
						</div>
						<!-- Order Review -->
						<div class="order-review">
							<!-- Addresses Section - Side by Side -->
							<div class="addresses-review-container">
								<!-- Shipping Address Card -->
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
										{#if shippingAddress && shippingAddress.firstName}
											<div class="address-detail">
												<p class="address-name">
													<strong>{shippingAddress.firstName} {shippingAddress.lastName}</strong>
												</p>
												<p class="address-line">
													<span class="icon">📍</span>
													{shippingAddress.address}
												</p>
												<p class="address-city-state">
													{shippingAddress.city}, {shippingAddress.state}
													{shippingAddress.postalCode}
												</p>
												<p class="address-country">{shippingAddress.country}</p>

												<div class="address-contact-info">
													<p class="contact-item">
														<span class="icon">📧</span>
														{shippingAddress.email}
													</p>
													<p class="contact-item">
														<span class="icon">📞</span>
														{shippingAddress.phone}
													</p>
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

										{#if shippingAddress && shippingAddress.firstName}
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

								<!-- Billing Address Card -->
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
										{#if selectedBillingAddressId && billingAddresses.length > 0}
											{#each billingAddresses as address (address.id)}
												{#if address.id === selectedBillingAddressId}
													<div class="address-detail">
														<p class="address-name"><strong>{address.full_name}</strong></p>
														<p class="address-line">
															<span class="icon">📍</span>
															{address.address_line1}
															{#if address.address_line2}
																<br />
																<span class="icon"></span>{address.address_line2}
															{/if}
														</p>
														<p class="address-city-state">
															{address.city}, {address.state}
															{address.postal_code}
														</p>
														<p class="address-country">{address.country}</p>

														<div class="address-contact-info">
															<p class="contact-item">
																<span class="icon">📧</span>
																{address.email}
															</p>
															<p class="contact-item">
																<span class="icon">📞</span>
																{address.phone}
															</p>
														</div>
													</div>
												{/if}
											{/each}
										{:else if billingAddressSame}
											<div class="address-detail">
												<p class="address-name">
													<strong>{shippingAddress.firstName} {shippingAddress.lastName}</strong>
												</p>
												<p class="address-line">
													<span class="icon">📍</span>
													{shippingAddress.address}
												</p>
												<p class="address-city-state">
													{shippingAddress.city}, {shippingAddress.state}
													{shippingAddress.postalCode}
												</p>
												<p class="address-country">{shippingAddress.country}</p>

												<div class="address-contact-info">
													<p class="contact-item">
														<span class="icon">📧</span>
														{shippingAddress.email}
													</p>
													<p class="contact-item">
														<span class="icon">📞</span>
														{shippingAddress.phone}
													</p>
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
												<p class="no-address-text">No billing address found</p>
											</div>
										{/if}

										{#if (selectedBillingAddressId && billingAddresses.length > 0) || billingAddressSame}
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
									{:else if paymentMethod.type === 'card'}
										<div class="payment-method-box">
											<span class="payment-icon">💳</span>
											<span>Credit/Debit Card ending in {paymentMethod.cardNumber.slice(-4)}</span>
										</div>
									{:else if paymentMethod.type === 'esewa'}
										<div class="payment-method-box">
											<span class="payment-icon">💚</span>
											<span>eSewa Digital Wallet</span>
										</div>
									{:else if paymentMethod.type === 'khalti'}
										<div class="payment-method-box">
											<span class="payment-icon">🟣</span>
											<span>Khalti Digital Wallet</span>
										</div>
									{:else if paymentMethod.type === 'paypal'}
										<div class="payment-method-box">
											<span class="payment-icon">🅿️</span>
											<span>PayPal</span>
										</div>
									{:else if paymentMethod.type === 'imepay'}
										<div class="payment-method-box">
											<span class="payment-icon">🟠</span>
											<span>IME Pay</span>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Navigation Buttons -->
				<div class="checkout-navigation">
					{#if currentStep > 1}
						<button class="btn-secondary" onclick={prevStep}> ← Back </button>
					{/if}

					<div class="nav-spacer"></div>

					{#if currentStep < 4}
						<button
							class="btn-primary"
							onclick={nextStep}
							disabled={isLoadingProfile}
							title={isLoadingProfile ? 'Loading profile...' : ''}
						>
							{currentStep === 1 ? 'Process to Billing' : 'Continue'}
						</button>
					{:else}
						<button class="btn-primary checkout-btn" onclick={placeOrder}> Confirm Order </button>
					{/if}
				</div>
			</div>

			<!-- Order Summary Sidebar -->
			<div class="order-summary">
				<div class="summary-card">
					<h3>Order Summary</h3>

					<!-- Order Items -->
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

					<!-- Promo Code -->
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
								disabled={isPromoApplied || !promoCode.trim()}
							>
								Apply
							</button>
						</div>
						{#if isPromoApplied}
							<div class="promo-applied">
								✓ Discount applied: {promoDiscount}% off
							</div>
						{/if}
					</div>

					<!-- Price Breakdown -->
					<div class="price-breakdown">
						<div class="price-row">
							<span>Subtotal</span>
							<span>Rs. {subtotal.toFixed(2)}</span>
						</div>
						<div class="price-row">
							<span>Shipping Fee</span>
							<span>{shipping === 0 ? 'Free' : `Rs. ${shipping.toFixed(2)}`}</span>
						</div>
						<!-- <div class="price-row">
							<span>Tax</span>
							<span>Rs. {tax.toFixed(2)}</span>
						</div> -->
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

					<!-- Security Features -->
					<!-- <div class="security-features">
						<div class="security-item">
							<span class="security-icon">🔒</span>
							<span>256-bit SSL encryption</span>
						</div>
						<div class="security-item">
							<span class="security-icon">🛡️</span>
							<span>Secure payment processing</span>
						</div>
						<div class="security-item">
							<span class="security-icon">📦</span>
							<span>Free returns within 30 days</span>
						</div>
					</div> -->
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

	/* Progress Steps */
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

	/* Layout */
	.checkout-layout {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 40px;
	}

	/* Loading Profile */
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

	/* Profile Info Badge */
	.profile-info {
		margin-bottom: 24px;
	}

	.profile-badge {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 8px;
		color: #059669;
		font-size: 14px;
		font-weight: 500;
	}

	.profile-badge svg {
		flex-shrink: 0;
	}

	/* Main Content */
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

	/* Forms */
	.checkout-form,
	.payment-form {
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

	.form-section.preferences-section {
		background: transparent;
		border: none;
		padding: 0;
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

	.form-section h3 {
		font-size: 17px;
		font-weight: 600;
		color: #09240f;
		margin-bottom: 16px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.form-row.cols-3 {
		grid-template-columns: 1fr 1fr 1fr;
	}

	/* Floating label form group */
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

	/* Legacy non-floating styles (fallback) */
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

	.form-group input.error {
		border-color: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
	}

	.error-message {
		display: block;
		color: #ef4444;
		font-size: 12px;
		margin-top: 5px;
		font-weight: 500;
	}

	/* Card brand icons in 3rd column */
	.card-icons {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding-top: 10px;
	}

	.card-brand {
		font-size: 13px;
		font-weight: 700;
		color: #6b7280;
		background: #f3f4f6;
		padding: 4px 8px;
		border-radius: 4px;
		letter-spacing: 0.5px;
	}

	/* Checkboxes */
	.checkbox-group {
		margin-bottom: 14px;
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

	/* Billing Details Display */
	.billing-same-section {
		margin-bottom: 24px;
	}

	.shipping-details-display {
		margin: 24px 0;
		animation: slideDown 0.3s ease-out;
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

	.details-card {
		background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
		border: 2px solid #86efac;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(5, 150, 105, 0.1);
	}

	.details-card h4 {
		margin: 0 0 16px 0;
		font-size: 16px;
		font-weight: 600;
		color: #047857;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.details-card h4::before {
		content: '✓';
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: #059669;
		color: white;
		border-radius: 50%;
		font-size: 14px;
		font-weight: bold;
	}

	.details-content {
		display: grid;
		gap: 12px;
	}

	.detail-row {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 16px;
		margin: 0;
		padding: 12px 0;
		border-bottom: 1px solid #d1fae5;
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-row .label {
		font-weight: 600;
		color: #047857;
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.detail-row .value {
		color: #1f2937;
		font-size: 14px;
		word-break: break-word;
	}

	/* Payment Methods */
	.payment-methods {
		margin-bottom: 24px;
	}

	.payment-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
		gap: 12px;
		margin-bottom: 8px;
	}

	.payment-option {
		cursor: pointer;
	}

	.payment-option input[type='radio'] {
		display: none;
	}

	.payment-card {
		border: 2px solid #e5e7eb;
		border-radius: 10px;
		padding: 14px 10px;
		text-align: center;
		transition: all 0.25s;
	}

	.payment-card:hover {
		border-color: #a3c4ae;
		background: #fafffe;
	}

	.payment-option input[type='radio']:checked + .payment-card {
		border-color: #059669;
		background: #f0fdf4;
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
	}

	/* Address Cards */
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

	.payment-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 6px;
		min-height: 28px;
	}

	.payment-icon svg {
		border-radius: 5px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.payment-card span {
		font-size: 13px;
		font-weight: 500;
		color: #374151;
		display: block;
	}

	/* Payment detail section */
	.payment-detail-section {
		min-height: 60px;
	}

	/* Digital Payment Info */
	.digital-payment-info {
		text-align: center;
		padding: 28px;
		background: #f9fafb;
		border: 1px solid #e8f0eb;
		border-radius: 12px;
		margin-bottom: 24px;
	}

	.digital-payment-info p {
		color: #4b5563;
		font-size: 14px;
		line-height: 1.6;
	}

	/* COD specific styles */
	.cod-info {
		background: #f0fdf4;
		border-color: #bbf7d0;
	}

	.cod-icon-wrap {
		margin-bottom: 8px;
	}

	.cod-info h4 {
		font-size: 17px;
		font-weight: 600;
		color: #09240f;
		margin-bottom: 6px;
	}

	.cod-features {
		list-style: none;
		padding: 0;
		margin: 14px auto 0;
		max-width: 280px;
		text-align: left;
	}

	.cod-features li {
		font-size: 14px;
		color: #166534;
		padding: 4px 0;
	}

	.payment-logo {
		margin-bottom: 16px;
		display: flex;
		justify-content: center;
	}

	.payment-logo-img {
		height: 44px;
		width: auto;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
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

	/* Order Review */
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
	}

	.payment-method-box span:last-child {
		font-size: 14px;
		font-weight: 500;
		color: #4b5563;
	}

	/* Navigation */
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

	/* Order Summary Sidebar */
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

	/* Order Items */
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

	/* Promo Section */
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

	/* Price Breakdown */
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

	/* Security Features */
	.security-features {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.security-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #6b7280;
	}

	.security-icon {
		font-size: 14px;
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.checkout-layout {
			grid-template-columns: 1fr 350px;
			gap: 30px;
		}

		.payment-options {
			grid-template-columns: 1fr;
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

		.payment-options {
			grid-template-columns: 1fr;
		}

		.item-details h4 {
			font-size: 13px;
		}
	}
</style>
