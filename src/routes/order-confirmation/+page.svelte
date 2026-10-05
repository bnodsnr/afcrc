<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	// import Topbar from '$lib/components/Topbar.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	interface OrderItem {
		id: number;
		name: string;
		image: string;
		price: number;
		originalPrice?: number;
		size: string;
		color: string;
		colorHex: string;
		quantity: number;
	}

	interface OrderDetails {
		orderNumber: string;
		orderDate: string;
		estimatedDelivery: string;
		trackingNumber: string;
		customerEmail: string;
		shippingAddress: {
			name: string;
			address: string;
			city: string;
			postalCode: string;
			country: string;
		};
		paymentMethod: string;
		subtotal: number;
		shipping: number;
		tax: number;
		discount: number;
		total: number;
		items: OrderItem[];
	}

	// Sample order data (in real app, this would come from URL params or API)
	let orderDetails: OrderDetails = $state({
		orderNumber: 'HH' + Math.random().toString(36).substr(2, 8).toUpperCase(),
		orderDate: new Date().toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}),
		estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}),
		trackingNumber: 'HH' + Math.random().toString(36).substr(2, 10).toUpperCase(),
		customerEmail: 'customer@example.com',
		shippingAddress: {
			name: 'John Doe',
			address: '123 Main Street, Apt 4B',
			city: 'Kathmandu',
			postalCode: '44600',
			country: 'Nepal'
		},
		paymentMethod: 'Credit Card ending in 1234',
		subtotal: 83.97,
		shipping: 0,
		tax: 6.72,
		discount: 8.4,
		total: 82.29,
		items: [
			{
				id: 1,
				name: 'Hemp Classic Hooded Sweatshirt',
				image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
				price: 16.99,
				originalPrice: 24.99,
				size: 'M',
				color: 'Pink',
				colorHex: '#F8BBD9',
				quantity: 2
			},
			{
				id: 2,
				name: 'Organic Hemp Canvas Sneakers',
				image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
				price: 49.99,
				originalPrice: 65.99,
				size: '42',
				color: 'Green',
				colorHex: '#059669',
				quantity: 1
			}
		]
	});

	let showConfetti = $state(false);

	onMount(() => {
		// Show confetti animation on page load
		showConfetti = true;
		setTimeout(() => {
			showConfetti = false;
		}, 3000);
	});

	function goToHome() {
		goto('/');
	}

	function shopMore() {
		goto('/categories');
	}

	function trackOrder() {
		// In real app, this would redirect to tracking page
		alert(`Track your order with tracking number: ${orderDetails.trackingNumber}`);
	}

	function downloadInvoice() {
		// In real app, this would generate and download PDF invoice
		alert('Invoice download feature coming soon!');
	}
</script>

<svelte:head>
	<title>Order Confirmation - Himalayan Hemp Heaven</title>
</svelte:head>

<!-- <Topbar /> -->

<!-- Confetti Animation -->
{#if showConfetti}
	<div class="confetti-container">
		{#each Array(50) as _, i}
			<div class="confetti" style="--delay: {i * 0.1}s; --x: {Math.random() * 100}%;"></div>
		{/each}
	</div>
{/if}

<main class="confirmation-page">
	<div class="container">
		<!-- Success Header -->
		<div class="success-header">
			<div class="success-icon">
				<div class="check-circle">
					<svg
						width="40"
						height="40"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
			</div>
			<h1>Thank You for Your Order!</h1>
			<p class="success-message">
				Your order has been successfully placed and is being processed. We'll send you updates about
				your order status via email.
			</p>
		</div>

		<!-- Action Buttons -->
		<div class="action-section">
			<div class="action-buttons">
				<button class="btn-primary" onclick={shopMore}>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 17.6 17.4 18 18 18S19 17.6 19 17V13M9 19.5C9.8 19.5 10.5 20.2 10.5 21S9.8 22.5 9 22.5 7.5 21.8 7.5 21 8.2 19.5 9 19.5ZM20 19.5C20.8 19.5 21.5 20.2 21.5 21S20.8 22.5 20 22.5 18.5 21.8 18.5 21 19.2 19.5 20 19.5Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					Continue Shopping
				</button>
				<button class="btn-secondary" onclick={goToHome}>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<polyline
							points="9,22 9,12 15,12 15,22"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					Back to Home
				</button>
			</div>
		</div>
	</div>
</main>

<Footer />

<style>
	/* Confetti Animation */
	.confetti-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1000;
		overflow: hidden;
	}

	.confetti {
		position: absolute;
		width: 10px;
		height: 10px;
		background: linear-gradient(45deg, #059669, #00d4aa, #34d399, #10b981);
		animation: confetti-fall 3s ease-out var(--delay) forwards;
		top: -10px;
		left: var(--x);
	}

	@keyframes confetti-fall {
		0% {
			transform: translateY(-100vh) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translateY(100vh) rotate(720deg);
			opacity: 0;
		}
	}

	/* Main Styles */
	.confirmation-page {
		background: #fafafa;
		min-height: 100vh;
		padding: 80px 0 40px;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
	}

	/* Success Header */
	.success-header {
		text-align: center;
		margin-bottom: 40px;
		background: white;
		padding: 40px;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.success-icon {
		margin-bottom: 24px;
	}

	.check-circle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #059669, #00d4aa);
		border-radius: 50%;
		color: white;
		box-shadow: 0 8px 32px rgba(5, 150, 105, 0.3);
	}

	.success-header h1 {
		font-size: 32px;
		font-weight: 700;
		color: #09240f;
		margin-bottom: 12px;
	}

	.success-message {
		font-size: 16px;
		color: #6b7280;
		max-width: 500px;
		margin: 0 auto;
		line-height: 1.6;
	}

	/* Order Summary Grid */
	.order-summary-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
		margin-bottom: 32px;
	}

	.summary-card {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 16px;
		border-bottom: 1px solid #f3f4f6;
	}

	.card-header h2 {
		font-size: 18px;
		font-weight: 600;
		color: #09240f;
	}

	.order-status {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.order-status.confirmed {
		background: #dcfce7;
		color: #16a34a;
	}

	/* Order Info */
	.order-info {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 20px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
	}

	.info-row .label {
		color: #6b7280;
		font-weight: 500;
	}

	.info-row .value {
		color: #09240f;
		font-weight: 600;
	}

	.delivery-date {
		color: #059669 !important;
	}

	.tracking-number {
		font-family: monospace;
		background: #f3f4f6;
		padding: 2px 6px;
		border-radius: 4px;
	}

	/* Card Actions */
	.card-actions {
		display: flex;
		gap: 12px;
	}

	.btn-primary,
	.btn-secondary {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		font-size: 14px;
		text-decoration: none;
	}

	.btn-primary {
		background: #059669;
		color: white;
		flex: 1;
	}

	.btn-primary:hover {
		background: #047857;
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: #f8fafc;
		color: #4b5563;
		border: 1px solid #e2e8f0;
		flex: 1;
	}

	.btn-secondary:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
		transform: translateY(-1px);
	}

	/* Shipping Info */
	.shipping-info {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.shipping-address h4,
	.payment-info h4 {
		font-size: 14px;
		font-weight: 600;
		color: #09240f;
		margin-bottom: 8px;
	}

	.address p {
		font-size: 14px;
		color: #4b5563;
		margin-bottom: 2px;
		line-height: 1.4;
	}

	.payment-info p {
		font-size: 14px;
		color: #4b5563;
	}

	/* Order Items Section */
	.order-items-section {
		background: white;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 0;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid #f3f4f6;
	}

	.section-header h2 {
		font-size: 20px;
		font-weight: 600;
		color: #09240f;
	}

	/* Delivery Timeline */
	.delivery-timeline {
		display: flex;
		gap: 20px;
	}

	.timeline-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		position: relative;
	}

	.timeline-step:not(:last-child)::after {
		content: '';
		position: absolute;
		top: 18px;
		right: -10px;
		width: 20px;
		height: 2px;
		background: #e5e7eb;
	}

	.timeline-step.active::after {
		background: #059669;
	}

	.step-icon {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #f3f4f6;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
	}

	.timeline-step.active .step-icon {
		background: #059669;
		color: white;
	}

	.timeline-step span {
		font-size: 12px;
		color: #6b7280;
		font-weight: 500;
	}

	.timeline-step.active span {
		color: #059669;
	}

	/* Order Items */
	.order-items {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.order-item {
		display: flex;
		gap: 16px;
		padding: 16px;
		border: 1px solid #f3f4f6;
		border-radius: 8px;
		background: #fafafa;
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

	.item-quantity {
		position: absolute;
		top: -6px;
		right: -6px;
		background: #059669;
		color: white;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: 600;
	}

	.item-details {
		flex: 1;
	}

	.item-details h3 {
		font-size: 16px;
		font-weight: 600;
		color: #09240f;
		margin-bottom: 8px;
	}

	.item-specs {
		display: flex;
		gap: 16px;
		margin-bottom: 8px;
	}

	.spec {
		font-size: 14px;
		color: #6b7280;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.color-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1px solid #e5e7eb;
	}

	.item-price {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.current-price {
		font-size: 16px;
		font-weight: 600;
		color: #059669;
	}

	.original-price {
		font-size: 14px;
		color: #9ca3af;
		text-decoration: line-through;
	}

	.item-total {
		display: flex;
		align-items: center;
	}

	.total-price {
		font-size: 18px;
		font-weight: 700;
		color: #09240f;
	}

	/* Price Summary */
	.price-summary {
		margin-bottom: 32px;
	}

	.price-summary .summary-card {
		max-width: 400px;
		margin-left: auto;
	}

	.price-summary h3 {
		font-size: 18px;
		font-weight: 600;
		color: #09240f;
		margin-bottom: 16px;
	}

	.price-breakdown {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.price-row {
		display: flex;
		justify-content: space-between;
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
		margin-top: 8px;
		padding-top: 12px;
		border-top: 1px solid #e5e7eb;
	}

	.price-divider {
		height: 1px;
		background: #e5e7eb;
		margin: 8px 0;
	}

	/* Action Section */
	.action-section {
		margin-bottom: 40px;
	}

	.action-buttons {
		display: flex;
		justify-content: center;
		gap: 16px;
	}

	.action-buttons .btn-primary,
	.action-buttons .btn-secondary {
		padding: 16px 32px;
		font-size: 16px;
	}

	/* Additional Info */
	.additional-info {
		background: white;
		border-radius: 12px;
		padding: 32px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 24px;
	}

	.info-card {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}

	.info-icon {
		font-size: 24px;
		width: 48px;
		height: 48px;
		background: #f0fdf4;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.info-content h4 {
		font-size: 16px;
		font-weight: 600;
		color: #09240f;
		margin-bottom: 4px;
	}

	.info-content p {
		font-size: 14px;
		color: #6b7280;
		line-height: 1.5;
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.order-summary-grid {
			grid-template-columns: 1fr;
		}

		.delivery-timeline {
			gap: 12px;
		}

		.timeline-step span {
			font-size: 10px;
		}
	}

	@media (max-width: 768px) {
		.confirmation-page {
			padding: 60px 0 20px;
		}

		.container {
			padding: 0 16px;
		}

		.success-header {
			padding: 24px;
		}

		.success-header h1 {
			font-size: 24px;
		}

		.check-circle {
			width: 60px;
			height: 60px;
		}

		.summary-card,
		.order-items-section,
		.additional-info {
			padding: 20px;
		}

		.section-header {
			flex-direction: column;
			gap: 16px;
			align-items: flex-start;
		}

		.delivery-timeline {
			gap: 8px;
		}

		.timeline-step {
			gap: 4px;
		}

		.step-icon {
			width: 28px;
			height: 28px;
			font-size: 14px;
		}

		.timeline-step span {
			font-size: 9px;
		}

		.order-item {
			flex-direction: column;
			gap: 12px;
		}

		.item-details h3 {
			font-size: 14px;
		}

		.action-buttons {
			flex-direction: column;
		}

		.card-actions {
			flex-direction: column;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 480px) {
		.success-header,
		.summary-card,
		.order-items-section,
		.additional-info {
			padding: 16px;
		}

		.action-buttons .btn-primary,
		.action-buttons .btn-secondary {
			padding: 14px 24px;
			font-size: 14px;
		}

		.item-image {
			width: 60px;
			height: 60px;
		}

		.item-quantity {
			width: 20px;
			height: 20px;
			font-size: 10px;
		}
	}
</style>
