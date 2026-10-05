<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Footer from '$lib/components/Footer.svelte';
	import { isLoggedIn } from '$lib/stores/auth';
	import { createApi } from '$lib/api';
	import type { CartItem as ApiCartItem } from '$lib/api/cart';

	interface CartItem {
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
		inStock: boolean;
		selected: boolean;
	}

	const { data } = $props();

	// Create API client instance (used for client-side fallback / future mutations)
	const api = createApi(fetch);

	// --- Shared parser: turns an api.cart.getCart() response into CartItem[] ---
	// Used both by the SSR-provided `data.cart` and by the client-side fallback fetch,
	// so the mapping logic never drifts between the two paths.
	function parseCartResponse(response: any): CartItem[] {
		if (!response) return [];

		let cart: any = null;
		cart = response.cart;

		if (!cart) {
			// Order confirmation response or empty cart response - just treat as empty
			return [];
		}

		const cartId = cart.id;
		const items = cart.items || [];

		if (items.length === 0) return [];

		return items.map((item: ApiCartItem) => {
			// Handle both nested product and flat item formats
			const product = item.product || {};
			const itemId = (product as any).id || item.product_id || item.id;
			const name = (product as any).name || item.name || 'Product';
			const image =
				(product as any).image || (product as any).images?.[0]?.image || item.image || '';
			const price = parseFloat(
				String(
					item.price ||
						(product as any).sale_price ||
						(product as any).regular_price ||
						item.sale_price ||
						0
				)
			);
			const originalPrice = (product as any).regular_price || item.regular_price;

			return {
				id: itemId,
				cartId: cartId,
				cartItemId: item.cart_item_id || item.id,
				name,
				image,
				price,
				originalPrice: originalPrice ? parseFloat(String(originalPrice)) : undefined,
				size: item.size || '',
				color: item.color || '',
				colorHex: item.colorHex || item.color_hex || '#000000',
				quantity: item.quantity || 1,
				inStock: ((product as any).stock_status || item.stock_status) !== 'out_of_stock',
				selected: true
			} satisfies CartItem;
		});
	}

	// --- Initialize state directly from SSR props ---
	// data.cart was already fetched server-side in +page.server.ts, so the cart
	// renders correctly on first paint with no loading flash and no extra request.
	let cartItems: CartItem[] = $state(parseCartResponse(data.cart));
	// Only show the spinner if SSR didn't give us a cart and the client thinks
	// the user is logged in (meaning we're about to attempt a client-side fallback fetch).
	let isLoading = $state(!data.cart && $isLoggedIn);
	let selectAll = $state(false);

	onMount(async () => {
		// SSR already succeeded (even an empty cart is a valid, successful result) - nothing to do.
		if (data.cart) {
			isLoading = false;
			return;
		}

		// SSR load returned null (e.g. its try/catch failed) - fall back to a client-side fetch.
		if ($isLoggedIn) {
			await fetchCartFromAPI();
		} else {
			isLoading = false;
		}
	});

	async function fetchCartFromAPI() {
		try {
			const response = await api.cart.getCart();

			if (!response) {
				isLoading = false;
				return;
			}
			cartItems = parseCartResponse(response);
		} catch (error) {
			console.error('[CartPage] Failed to fetch cart from API:', error);
		} finally {
			isLoading = false;
		}
	}

	let promoCode = $state('');
	let isPromoApplied = $state(false);
	let promoDiscount = $state(0);

	// Calculate based on selected items only
	let selectedItems = $derived(cartItems.filter((item) => item.selected));
	let subtotal = $derived(selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
	let shipping = $derived(subtotal > 50 ? 0 : 8.99);
	let tax = $derived(subtotal * 0.08);
	let discount = $derived(isPromoApplied ? subtotal * (promoDiscount / 100) : 0);
	let total = $derived(subtotal + shipping + tax - discount);
	let selectedCount = $derived(selectedItems.length);

	// Update selectAll checkbox state - use $effect instead of $: for side-effect
	$effect(() => {
		selectAll = cartItems.length > 0 && cartItems.every((item) => item.selected);
	});

	function toggleSelectAll() {
		const newState = !selectAll;
		cartItems = cartItems.map((item) => ({ ...item, selected: newState }));
	}

	function toggleItemSelection(itemId: number) {
		cartItems = cartItems.map((item) =>
			item.id === itemId ? { ...item, selected: !item.selected } : item
		);
	}

	function updateQuantity(itemId: number, change: number) {
		cartItems = cartItems.map((item) => {
			if (item.id === itemId) {
				const newQuantity = Math.max(1, item.quantity + change);
				return { ...item, quantity: newQuantity };
			}
			return item;
		});
	}

	function removeItem(itemId: number) {
		cartItems = cartItems.filter((item) => item.id !== itemId);
	}

	function moveToWishlist(itemId: number) {
		// Add to wishlist logic here
		removeItem(itemId);
	}

	function applyPromoCode() {
		const validCodes: { [key: string]: number } = {
			HEMP10: 10,
			SAVE15: 15,
			WELCOME20: 20
		};

		const code = promoCode.toUpperCase();
		if (validCodes[code]) {
			isPromoApplied = true;
			promoDiscount = validCodes[code];
		} else {
			alert('Invalid promo code');
		}
	}

	function proceedToCheckout() {
		if (selectedCount === 0) {
			alert('Please select at least one item to checkout');
			return;
		}
		// Store selected items for checkout
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
		}
		// Navigate to checkout page using SvelteKit client-side navigation
		// This preserves the in-memory auth state (isLoggedIn store, user store)
		goto('/checkout');
	}
</script>

<svelte:head>
	<title>Shopping Cart - Himalayan Hemp Heaven</title>
</svelte:head>

<main class="cart-page">
	<div class="container">
		<!-- Breadcrumb -->
		<nav class="breadcrumb">
			<a href="/">Home</a>
			<span class="separator">></span>
			<span class="current">Shopping Cart</span>
		</nav>

		{#if isLoading}
			<!-- Loading State -->
			<div class="empty-cart">
				<div class="loading-spinner"></div>
				<p>Loading your cart...</p>
			</div>
		{:else if cartItems.length === 0}
			<!-- Empty Cart -->
			<div class="empty-cart">
				<div class="empty-cart-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h10M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z"
						/>
					</svg>
				</div>
				<h2>Your cart is empty</h2>
				<p>Looks like you haven't added any hemp products to your cart yet.</p>
				<a href="/products" class="continue-shopping-btn">Continue Shopping</a>
			</div>
		{:else}
			<!-- Cart Header -->
			<div class="cart-header">
				<h1>Shopping Cart</h1>
				<p>
					{cartItems.length}
					{cartItems.length === 1 ? 'item' : 'items'} in your cart
					{#if selectedCount < cartItems.length}
						<span class="selected-info">({selectedCount} selected)</span>
					{/if}
				</p>
			</div>

			<div class="cart-layout">
				<!-- Cart Items -->
				<div class="cart-items">
					<div class="items-header">
						<span class="col-select">
							<input
								type="checkbox"
								checked={selectAll}
								onchange={toggleSelectAll}
								aria-label="Select all items"
							/>
						</span>
						<span class="col-product">Product</span>
						<span class="col-price">Price</span>
						<span class="col-quantity">Quantity</span>
						<span class="col-total">Total</span>
						<span class="col-action"></span>
					</div>
					{#each cartItems as item}
						<div
							class="cart-item {!item.inStock ? 'out-of-stock' : ''} {item.selected
								? 'selected'
								: ''}"
						>
							<div class="item-select">
								<input
									type="checkbox"
									checked={item.selected}
									onchange={() => toggleItemSelection(item.id)}
									disabled={!item.inStock}
									aria-label="Select {item.name}"
								/>
							</div>
							<div class="item-product">
								<div class="item-image">
									<img src={item.image} alt={item.name} />
									{#if !item.inStock}
										<div class="stock-overlay">Out of Stock</div>
									{/if}
								</div>
								<div class="item-details">
									<h3 class="item-name">{item.name}</h3>
									<div class="item-variants">
										<span class="variant">Size: {item.size}</span>
										<span class="variant">
											Color: {item.color}
											<span class="color-dot" style="background-color: {item.colorHex}"></span>
										</span>
									</div>
									<div class="item-actions">
										<button class="action-btn" onclick={() => moveToWishlist(item.id)}>
											♡ Move to Wishlist
										</button>
										<button class="action-btn remove" onclick={() => removeItem(item.id)}>
											🗑 Remove
										</button>
									</div>
								</div>
							</div>

							<div class="item-price">
								<span class="current-price"
									>NPR {item.price.toLocaleString('en-NP', {
										minimumFractionDigits: 0,
										maximumFractionDigits: 0
									})}</span
								>
								{#if item.originalPrice}
									<span class="original-price"
										>NPR {item.originalPrice.toLocaleString('en-NP', {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0
										})}</span
									>
								{/if}
							</div>

							<div class="item-quantity">
								<div class="quantity-controls">
									<button
										class="qty-btn"
										onclick={() => updateQuantity(item.id, -1)}
										disabled={item.quantity <= 1}
									>
										-
									</button>
									<span class="qty-display">{item.quantity}</span>
									<button class="qty-btn" onclick={() => updateQuantity(item.id, 1)}> + </button>
								</div>
							</div>

							<div class="item-total">
								<span class="total-price"
									>NPR {(item.price * item.quantity).toLocaleString('en-NP', {
										minimumFractionDigits: 0,
										maximumFractionDigits: 0
									})}</span
								>
							</div>
							<div class="item-remove">
								<button
									class="remove-btn"
									onclick={() => removeItem(item.id)}
									aria-label="Remove item"
								>
									×
								</button>
							</div>
						</div>
					{/each}

					<!-- Continue Shopping -->
					<div class="continue-shopping">
						<a href="/products" class="continue-btn"> ← Continue Shopping </a>
					</div>
				</div>

				<!-- Order Summary -->
				<div class="order-summary">
					<div class="summary-card">
						<h3>Order Summary</h3>
						{#if selectedCount > 0}
							<p class="summary-subtitle">
								{selectedCount}
								{selectedCount === 1 ? 'item' : 'items'} selected
							</p>
						{/if}
						<!-- Promo Code -->
						<div class="promo-section">
							<div class="promo-input">
								<input
									type="text"
									placeholder="Enter promo code"
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
									✓ Promo code applied: {promoDiscount}% off
								</div>
							{/if}
						</div>

						<!-- Summary Details -->
						<div class="summary-details">
							<div class="summary-row">
								<span>Subtotal</span>
								<span
									>NPR {subtotal.toLocaleString('en-NP', {
										minimumFractionDigits: 0,
										maximumFractionDigits: 0
									})}</span
								>
							</div>
							<div class="summary-row">
								<span>Shipping Fee</span>
								<span
									>{shipping === 0
										? 'Free'
										: `NPR ${shipping.toLocaleString('en-NP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span
								>
							</div>

							{#if discount > 0}
								<div class="summary-row discount">
									<span>Discount ({promoDiscount}%)</span>
									<span
										>-NPR {discount.toLocaleString('en-NP', {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0
										})}</span
									>
								</div>
							{/if}
							<div class="summary-divider"></div>
							<div class="summary-row total">
								<span>Total</span>
								<span
									>NPR {subtotal.toLocaleString('en-NP', {
										minimumFractionDigits: 0,
										maximumFractionDigits: 0
									})}</span
								>
							</div>
						</div>

						<!-- Free Shipping Progress -->
						{#if shipping > 0}
							<div class="shipping-progress">
								<div class="progress-text">
									Add <strong
										>NPR {(50 - subtotal).toLocaleString('en-NP', {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0
										})}</strong
									> more for free shipping
								</div>
								<div class="progress-bar">
									<div
										class="progress-fill"
										style="width: {Math.min((subtotal / 50) * 100, 100)}%"
									></div>
								</div>
							</div>
						{:else}
							<div class="free-shipping-badge">🚚 You qualify for free shipping!</div>
						{/if}

						<!-- Checkout Button -->
						<button class="checkout-btn" onclick={proceedToCheckout}> Proceed to Checkout </button>

						<!-- Security Badges -->
						<div class="security-badges">
							<div class="security-item">
								<span class="security-icon">🔒</span>
								<span>Secure Checkout</span>
							</div>
							<div class="security-item">
								<span class="security-icon">📦</span>
								<span>Free Returns</span>
							</div>
							<div class="security-item">
								<span class="security-icon">🌱</span>
								<span>Eco Packaging</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</main>

<Footer />

<style>
	.cart-page {
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

	/* Empty Cart */
	.empty-cart {
		text-align: center;
		padding: 80px 20px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top-color: #059669;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 16px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.empty-cart-icon {
		width: 80px;
		height: 80px;
		margin: 0 auto 24px;
		color: #d1d5db;
	}

	.empty-cart-icon svg {
		width: 100%;
		height: 100%;
	}

	.empty-cart h2 {
		font-size: 24px;
		font-weight: 700;
		color: #09240f;
		margin-bottom: 12px;
	}

	.empty-cart p {
		color: #6b7280;
		margin-bottom: 32px;
		font-size: 16px;
	}

	.continue-shopping-btn {
		display: inline-block;
		background: #059669;
		color: white;
		padding: 12px 32px;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		transition: background 0.2s;
	}

	.continue-shopping-btn:hover {
		background: #047857;
	}

	/* Cart Header */
	.cart-header {
		margin-bottom: 32px;
	}

	.cart-header h1 {
		font-size: 32px;
		font-weight: 700;
		color: #09240f;
		margin-bottom: 8px;
	}

	.cart-header p {
		color: #6b7280;
		font-size: 16px;
	}

	.selected-info {
		color: #059669;
		font-weight: 600;
		margin-left: 8px;
	}

	/* Cart Layout */
	.cart-layout {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 40px;
	}

	/* Cart Items */
	.cart-items {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
	}

	.items-header {
		display: grid;
		grid-template-columns: 40px 2fr 1fr 1fr 1fr 60px;
		gap: 16px;
		padding-bottom: 16px;
		border-bottom: 2px solid #e5e7eb;
		font-weight: 600;
		color: #374151;
		font-size: 14px;
		margin-bottom: 20px;
	}

	.col-select {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.col-select input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: #059669;
	}

	.cart-item {
		display: grid;
		grid-template-columns: 40px 2fr 1fr 1fr 1fr 60px;
		gap: 16px;
		align-items: center;
		padding: 20px 0;
		border-bottom: 1px solid #f3f4f6;
		transition: all 0.2s;
	}

	.cart-item.selected {
		background: #f0fdf4;
	}

	.cart-item:hover {
		background: #f9fafb;
	}

	.cart-item.out-of-stock {
		opacity: 0.6;
	}

	/* Item Selection */
	.item-select {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.item-select input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: #059669;
	}

	.item-select input[type='checkbox']:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	/* Item Product */
	.item-product {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}

	.item-image {
		position: relative;
		width: 80px;
		height: 80px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
	}

	.item-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.stock-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 600;
	}

	.item-details {
		flex: 1;
	}

	.item-name {
		font-size: 16px;
		font-weight: 600;
		color: #09240f;
		margin-bottom: 8px;
		line-height: 1.3;
	}

	.item-variants {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 12px;
	}

	.variant {
		font-size: 12px;
		color: #6b7280;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.color-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1px solid #e5e7eb;
	}

	.item-actions {
		display: flex;
		gap: 16px;
	}

	.action-btn {
		background: none;
		border: none;
		color: #6b7280;
		font-size: 12px;
		cursor: pointer;
		transition: color 0.2s;
	}

	.action-btn:hover {
		color: #059669;
	}

	.action-btn.remove:hover {
		color: #dc2626;
	}

	/* Item Price */
	.item-price {
		text-align: right;
	}

	.current-price {
		font-size: 16px;
		font-weight: 600;
		color: #059669;
		display: block;
	}

	.original-price {
		font-size: 12px;
		color: #9ca3af;
		text-decoration: line-through;
	}

	/* Quantity Controls */
	.quantity-controls {
		display: flex;
		align-items: center;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		width: fit-content;
	}

	.qty-btn {
		width: 32px;
		height: 32px;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 16px;
		font-weight: 600;
		color: #6b7280;
		transition: all 0.2s;
	}

	.qty-btn:hover:not(:disabled) {
		background: #f3f4f6;
		color: #059669;
	}

	.qty-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.qty-display {
		min-width: 40px;
		text-align: center;
		font-weight: 600;
		color: #09240f;
	}

	/* Item Total */
	.total-price {
		font-size: 16px;
		font-weight: 700;
		color: #09240f;
	}

	/* Remove Button */
	.remove-btn {
		width: 32px;
		height: 32px;
		border: none;
		background: #f3f4f6;
		border-radius: 50%;
		cursor: pointer;
		font-size: 18px;
		color: #6b7280;
		transition: all 0.2s;
	}

	.remove-btn:hover {
		background: #fee2e2;
		color: #dc2626;
	}

	/* Continue Shopping */
	.continue-shopping {
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid #e5e7eb;
	}

	.continue-btn {
		color: #059669;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s;
	}

	.continue-btn:hover {
		color: #047857;
	}

	/* Order Summary */
	.summary-card {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
		position: sticky;
		top: 100px;
	}

	.summary-card h3 {
		font-size: 20px;
		font-weight: 700;
		color: #09240f;
		margin-bottom: 8px;
	}

	.summary-subtitle {
		font-size: 14px;
		color: #6b7280;
		margin-bottom: 20px;
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

	/* Summary Details */
	.summary-details {
		margin-bottom: 24px;
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 12px;
		color: #4b5563;
	}

	.summary-row.discount {
		color: #059669;
	}

	.summary-row.total {
		font-size: 18px;
		font-weight: 700;
		color: #09240f;
		margin-bottom: 0;
	}

	.summary-divider {
		height: 1px;
		background: #e5e7eb;
		margin: 16px 0;
	}

	/* Shipping Progress */
	.shipping-progress {
		margin-bottom: 20px;
	}

	.progress-text {
		font-size: 12px;
		color: #6b7280;
		margin-bottom: 8px;
	}

	.progress-bar {
		height: 6px;
		background: #f3f4f6;
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #059669, #00d4aa);
		transition: width 0.3s ease;
	}

	.free-shipping-badge {
		background: #d1fae5;
		color: #059669;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		text-align: center;
		margin-bottom: 20px;
	}

	/* Checkout Button */
	.checkout-btn {
		width: 100%;
		background: #059669;
		color: white;
		border: none;
		padding: 16px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
		margin-bottom: 20px;
	}

	.checkout-btn:hover {
		background: #047857;
	}

	/* Security Badges */
	.security-badges {
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
		.cart-layout {
			grid-template-columns: 1fr 350px;
			gap: 30px;
		}
	}

	@media (max-width: 768px) {
		.cart-page {
			padding: 60px 0 20px;
		}

		.container {
			padding: 0 16px;
		}

		.cart-layout {
			grid-template-columns: 1fr;
			gap: 20px;
		}

		.summary-card {
			position: static;
		}

		.items-header {
			display: none;
		}

		.cart-item {
			grid-template-columns: 1fr;
			gap: 12px;
			padding: 16px 0;
		}

		.item-product {
			grid-column: 1 / -1;
		}

		.item-price,
		.item-quantity,
		.item-total {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.item-price::before {
			content: 'Price:';
			font-weight: 500;
			color: #6b7280;
		}

		.item-quantity::before {
			content: 'Quantity:';
			font-weight: 500;
			color: #6b7280;
		}

		.item-total::before {
			content: 'Total:';
			font-weight: 500;
			color: #6b7280;
		}

		.item-remove {
			position: absolute;
			top: 16px;
			right: 0;
		}
	}

	@media (max-width: 480px) {
		.cart-header h1 {
			font-size: 24px;
		}

		.cart-items,
		.summary-card {
			padding: 16px;
		}

		.item-image {
			width: 60px;
			height: 60px;
		}

		.item-name {
			font-size: 14px;
		}
	}
</style>
