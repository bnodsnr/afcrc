<script lang="ts">
	import { base } from '$app/paths';
	import { getImageUrl } from '$lib/utils/image';
	import { getCategoryUrl, getProductUrl } from '$lib/utils/url';
	import { addToCart } from '$lib/utils/cart';
	import { showSuccess, showError, showWarning } from '$lib/stores/toast';
	import { buildCartItemId, getCartItemByCartItemId } from '$lib/stores/cart';
	import { isLoggedIn } from '$lib/stores/auth';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import Topbar from '$lib/components/Topbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Toast from '$lib/components/Toast.svelte';

	let { data }: { data: PageData } = $props();

	const product = $derived(data.product);
	const relatedProducts = $derived(data.relatedProducts ?? []);

	// ---- Image gallery state ----
	let selectedImageIndex = $state(0);
	let isImageZoomed = $state(false);
	let isLightboxOpen = $state(false);
	let magnifierX = $state(0);
	let magnifierY = $state(0);
	let mouseX = $state(0);
	let mouseY = $state(0);
	let isMagnifierActive = $state(false);
	let imgWidth = $state(0);
	let imgHeight = $state(0);
	let selectedVariation = $state<string | null>(null);
	let selectedSize = $state<string | null>(null);

	const images = $derived.by(() => {
		const list: any[] = [];

		if (product?.images?.length) {
			list.push(...product.images);
		} else if (product?.primary_image) {
			list.push({ image: product.primary_image, alt_text: product?.name });
		}

		for (const v of variations) {
			if (v.images?.length) {
				for (const img of v.images) {
					list.push({ ...img, variationId: v.id });
				}
			} else if (v.image) {
				list.push({ image: v.image, alt_text: v.name || product?.name, variationId: v.id });
			}
		}

		return list;
	});
	function activeImages() {
		return images;
	}

	function handleMagnifierMove(event: MouseEvent) {
		const container = event.currentTarget as HTMLElement;
		const rect = container.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		mouseX = x;
		mouseY = y;

		if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
			magnifierX = Math.max(0, Math.min(x - 75, rect.width - 150));
			magnifierY = Math.max(0, Math.min(y - 75, rect.height - 150));
			isMagnifierActive = true;
		} else {
			isMagnifierActive = false;
		}
	}

	function handleMagnifierLeave() {
		isMagnifierActive = false;
	}

	function handleImageLoad(e: Event) {
		const img = e.target as HTMLImageElement;
		imgWidth = img.naturalWidth;
		imgHeight = img.naturalHeight;
	}

	function getMagnifierImageStyle(mouseX: number, mouseY: number) {
		const zoomLevel = 2;
		const lensSize = 150;

		const imgElement = document.getElementById('main-product-image') as HTMLImageElement;
		if (!imgElement) {
			return {
				backgroundPositionX: '0px',
				backgroundPositionY: '0px',
				backgroundSize: '300px 300px'
			};
		}

		const imgRect = imgElement.getBoundingClientRect();
		const displayWidth = imgRect.width;
		const displayHeight = imgRect.height;
		const imgOffsetX = imgRect.left - (imgElement.parentElement?.getBoundingClientRect().left || 0);
		const imgOffsetY = imgRect.top - (imgElement.parentElement?.getBoundingClientRect().top || 0);

		const relativeX = Math.max(0, Math.min(mouseX - imgOffsetX, displayWidth));
		const relativeY = Math.max(0, Math.min(mouseY - imgOffsetY, displayHeight));

		const zoomedWidth = displayWidth * zoomLevel;
		const zoomedHeight = displayHeight * zoomLevel;

		const backgroundX = -(relativeX * zoomLevel - lensSize / 2);
		const backgroundY = -(relativeY * zoomLevel - lensSize / 2);

		return {
			backgroundPositionX: `${backgroundX}px`,
			backgroundPositionY: `${backgroundY}px`,
			backgroundSize: `${zoomedWidth}px ${zoomedHeight}px`
		};
	}

	function openLightbox(index: number) {
		selectedImageIndex = index;
		isLightboxOpen = true;
	}

	function navigateLightbox(direction: 'prev' | 'next') {
		const imgs = activeImages();
		selectedImageIndex =
			direction === 'prev'
				? selectedImageIndex > 0
					? selectedImageIndex - 1
					: imgs.length - 1
				: selectedImageIndex < imgs.length - 1
					? selectedImageIndex + 1
					: 0;
	}

	// ---- Selection state ----
	// Colour and size are single-select: choosing a new option replaces the
	// previous choice instead of adding to it.
	let selectedSizes = $state<string[]>([]);
	let quantity = $state(1);
	let activeTab = $state<'description' | 'specifications' | 'features' | 'reviews'>('description');
	let isWishlisted = $state(false);

	const variations = $derived(product?.variations ?? []);
	const availableSizes = $derived(
		Array.isArray(product?.product_sizes) ? product.product_sizes.filter(Boolean) : []
	);
	const availableWeights = $derived(product?.weights ?? []);

	function selectVariation(v: any) {
		const colorValue: string = v.color || v.color_code || v.hex_code || v.name;
		const isAlreadySelected = selectedVariation === colorValue;
		selectedVariation = isAlreadySelected ? null : colorValue;
		selectedImageIndex = 0;
	}

	function selectSize(size: string) {
		selectedSize = selectedSize === size ? null : size;
	}

	// ---- Cart / checkout ----
	// The cart line for the CURRENTLY SELECTED colour/size combo — recomputed
	// any time the selection changes. This is what "already in cart" should
	// reflect, since the same product can now have several lines (one per
	// colour/size), not just one.
	const currentCartItemId = $derived(
		product ? buildCartItemId(product.id, selectedVariation, selectedSize) : ''
	);
	const currentCartLine = $derived(
		product ? getCartItemByCartItemId(currentCartItemId) : undefined
	);
	const productInCart = $derived(!!currentCartLine);
	const productCartQuantity = $derived(currentCartLine?.quantity ?? 0);

	let isAddingToCart = $state(false);
	let isBuyingNow = $state(false);

	async function requireAuth() {
		if (!get(isLoggedIn)) {
			await goto('/login');
			return false;
		}
		return true;
	}

	/**
	 * Blocks add-to-cart / buy-now if the product has colours or sizes but
	 * none has been picked yet — otherwise there's no way to know which
	 * variant line to create.
	 */

	function validateSelection(): boolean {
		if (variations.length > 0 && !selectedVariation) {
			showError('Please select a colour');
			return false;
		}
		if (availableSizes.length > 0 && !selectedSize) {
			showError('Please select a size');
			return false;
		}
		return true;
	}

	async function handleAddToCart() {
		if (!product || isAddingToCart || !(await requireAuth())) return;
		if (!validateSelection()) return;
		if (quantity < 1) {
			showError('Please enter a valid quantity');
			return;
		}
		if (quantity > 99) {
			showError('Maximum quantity is 99');
			return;
		}
		if (product.stock_status === 'out_of_stock') {
			showError('This product is currently out of stock');
			return;
		}

		isAddingToCart = true;

		await addToCart(product, {
			quantity,
			color: selectedVariation ?? undefined,
			size: selectedSize ?? undefined,
			onSuccess: (msg) => {
				showSuccess(msg || `${quantity} × ${product.name} added to cart`);
				quantity = 1;
			},
			onError: (err) => showError(err || 'Failed to add product to cart')
		});
		isAddingToCart = false;
	}

	// async function handleBuyNow() {
	// 	if (!product || isBuyingNow || !(await requireAuth())) return;
	// 	if (!validateSelection()) return;
	// 	if (quantity < 1) {
	// 		showError('Please enter a valid quantity');
	// 		return;
	// 	}
	// 	if (product.stock_status === 'out_of_stock') {
	// 		showError('This product is currently out of stock');
	// 		return;
	// 	}

	// 	isBuyingNow = true;
	// 	const success = await addToCart(product, {
	// 		quantity,
	// 		sizes: selectedSizes,
	// 		selectedVariations,
	// 		onSuccess: () => (window.location.href = `${base}/checkout`),
	// 		onError: (err) => {
	// 			showError(err || 'Failed to proceed to checkout');
	// 			isBuyingNow = false;
	// 		}
	// 	});
	// 	if (!success) isBuyingNow = false;
	// }

	function incrementQuantity() {
		quantity < 99 ? quantity++ : showWarning('Maximum quantity is 99');
	}
	function decrementQuantity() {
		quantity > 1 ? quantity-- : showWarning('Minimum quantity is 1');
	}
	function handleQuantityInput(e: Event) {
		const value = parseInt((e.target as HTMLInputElement).value);
		if (isNaN(value) || value < 1) quantity = 1;
		else if (value > 99) {
			quantity = 99;
			showWarning('Maximum quantity is 99');
		} else quantity = value;
	}

	function toggleWishlist() {
		isWishlisted = !isWishlisted;
		// TODO: persist to backend
	}

	function shareProduct() {
		if (navigator.share) {
			navigator.share({
				title: product?.name,
				text: product?.description,
				url: window.location.href
			});
		} else {
			showWarning('Sharing not supported on this browser');
		}
	}

	// ---- Pricing ----
	const regularPrice = $derived(Number(product?.regular_price) || 0);
	const discountedPrice = $derived(product?.sale_price ? Number(product.sale_price) : null);
	const hasDiscount = $derived(!!discountedPrice && discountedPrice < regularPrice);
	const savings = $derived(hasDiscount ? (regularPrice - discountedPrice!).toFixed(2) : null);
</script>

<svelte:head>
	<title>{product?.name || 'Product'} - Hemp Store</title>
	<meta name="description" content={product?.description || 'View product details'} />
</svelte:head>
<Topbar />

{#if !product}
	<!-- Not Found State -->
	<div class="not-found-page">
		<div class="not-found-inner">
			<div class="not-found-icon">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<circle cx="11" cy="11" r="8" stroke-width="1.5" />
					<path d="M21 21l-4.35-4.35" stroke-width="1.5" stroke-linecap="round" />
					<path d="M8 11h6M11 8v6" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</div>
			<h1>Product Not Found</h1>
			<p>The product you're looking for doesn't exist or has been removed.</p>
			<a href="{base}/" class="btn-home">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18"
					><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke-width="2" /><polyline
						points="9 22 9 12 15 12 15 22"
						stroke-width="2"
					/></svg
				>
				Back to Home
			</a>
		</div>
	</div>
{:else}
	<div class="product-page">
		<!-- Top strip: breadcrumb + actions -->
		<div class="breadcrumb-strip">
			<div class="container">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<a href="{base}/">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"
							><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke-width="2" /></svg
						>
						Home
					</a>
					<span class="bc-sep">›</span>
					{#if product.category}
						<a href={getCategoryUrl(product.category)}>{product.category.name}</a>
						<span class="bc-sep">›</span>
					{/if}
					<span class="bc-current">{product.name}</span>
				</nav>
			</div>
		</div>

		<!-- Main Product Section -->
		<section class="product-section">
			<div class="container">
				<div class="product-grid">
					<!-- ===== LEFT: Compact Image Gallery ===== -->
					<div class="gallery-col">
						<!-- Main image (compact) -->
						<div class="main-img-col">
							<div
								class="main-img-frame compact"
								class:zoomed={isImageZoomed}
								onmousemove={handleMagnifierMove}
								onmouseleave={handleMagnifierLeave}
								role="img"
								aria-label="Product image with magnifier"
							>
								{#if activeImages()[selectedImageIndex]}
									<button
										type="button"
										class="main-img-btn"
										onclick={() => openLightbox(selectedImageIndex)}
										onmouseenter={() => (isImageZoomed = true)}
										onmouseleave={() => (isImageZoomed = false)}
										aria-label="Zoom image"
									>
										<img
											src={getImageUrl(activeImages()[selectedImageIndex].image)}
											alt={activeImages()[selectedImageIndex].alt_text || product.name}
											class="main-img"
											id="main-product-image"
											onload={handleImageLoad}
										/>
									</button>

									<!-- Magnifier Lens -->
									{#if isMagnifierActive}
										{@const magStyle = getMagnifierImageStyle(mouseX, mouseY)}
										<div
											class="magnifier-lens"
											style="
												left: {magnifierX}px; 
												top: {magnifierY}px;
												background-image: url('{getImageUrl(activeImages()[selectedImageIndex].image)}');
												background-size: {magStyle.backgroundSize};
												background-position: {magStyle.backgroundPositionX} {magStyle.backgroundPositionY};
												background-repeat: no-repeat;
											"
										></div>
									{/if}

									{#if product.discount_percentage}
										<div class="img-badge discount-pill">
											🔥 {product.discount_percentage}% OFF
										</div>
									{/if}
									<button
										class="zoom-hint"
										onclick={() => openLightbox(selectedImageIndex)}
										aria-label="Zoom"
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											width="16"
											height="16"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<circle cx="11" cy="11" r="8" />
											<line x1="21" y1="21" x2="16.65" y2="16.65" />
											<line x1="11" y1="8" x2="11" y2="14" />
											<line x1="8" y1="11" x2="14" y2="11" />
										</svg>
									</button>
								{:else}
									<div class="img-placeholder">
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											width="48"
											height="48"
											stroke-width="1"
										>
											<rect x="3" y="3" width="18" height="18" rx="2" />
											<circle cx="8.5" cy="8.5" r="1.5" />
											<polyline points="21 15 16 10 5 21" />
										</svg>
										<span>No Image Available</span>
									</div>
								{/if}

								<!-- Gallery nav arrows (only when multiple images) -->
								{#if activeImages().length > 1}
									<button
										class="gal-arrow gal-prev"
										onclick={() =>
											(selectedImageIndex =
												selectedImageIndex > 0
													? selectedImageIndex - 1
													: activeImages().length - 1)}
										aria-label="Previous image"
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											width="20"
											height="20"
											stroke-width="2.5"><polyline points="15 18 9 12 15 6" /></svg
										>
									</button>
									<button
										class="gal-arrow gal-next"
										onclick={() =>
											(selectedImageIndex =
												selectedImageIndex < activeImages().length - 1
													? selectedImageIndex + 1
													: 0)}
										aria-label="Next image"
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											width="20"
											height="20"
											stroke-width="2.5"><polyline points="9 18 15 12 9 6" /></svg
										>
									</button>
									<div class="img-counter">{selectedImageIndex + 1} / {activeImages().length}</div>
								{/if}
							</div>

							<!-- Horizontal thumbnail strip (compact) -->
							{#if activeImages().length > 1}
								<div class="thumb-strip-h">
									{#each activeImages() as image, index}
										<button
											class="thumb-item-h"
											class:thumb-active={selectedImageIndex === index}
											onclick={() => (selectedImageIndex = index)}
											aria-label="View image {index + 1}"
										>
											<img src={getImageUrl(image.image)} alt={image.alt_text || product.name} />
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- ===== RIGHT: Product Info ===== -->
					<div class="info-col">
						<!-- Category tag + actions -->
						<div class="info-top-row">
							{#if product.category}
								<span class="category-chip">{product.category.name}</span>
							{/if}
							<div class="icon-actions"></div>
						</div>

						<!-- Product Title -->
						<h1 class="product-title">{product.name}</h1>

						<!-- Rating Row -->
						{#if product.rating || product.reviews_count}
							<div class="rating-row">
								<div class="stars-wrap">
									{#each Array(5) as _, i}
										<span
											class="star"
											class:star-filled={i < Math.floor(product.rating || 0)}
											class:star-half={i === Math.floor(product.rating || 0) &&
												(product.rating || 0) % 1 >= 0.5}>★</span
										>
									{/each}
								</div>
								<span class="rating-val">{product.rating || 0}</span>
								{#if product.reviews_count}
									<span class="reviews-sep">·</span>
									<a href="#reviews" class="reviews-link">{product.reviews_count} Reviews</a>
								{/if}
								<span class="reviews-sep">·</span>
								<span class="verified-badge">
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										width="13"
										height="13"
										stroke-width="2.5"><polyline points="20 6 9 17 4 12" /></svg
									>
									Verified
								</span>
							</div>
						{/if}

						<!-- Divider -->
						<div class="divider"></div>

						<!-- Price Block -->
						<div class="price-block">
							{#if discountedPrice && discountedPrice < regularPrice}
								<div class="price-main">
									<span class="price-current">Rs. {discountedPrice.toFixed(2)}</span>
									<span class="price-original">Rs. {regularPrice.toFixed(2)}</span>
									{#if savings}
										<span class="price-save-pill">Save Rs. {savings}</span>
									{/if}
								</div>
							{:else}
								<div class="price-main">
									<span class="price-current">Rs. {regularPrice}</span>
								</div>
							{/if}
							<p class="tax-note">
								✓ Inclusive of all taxes &nbsp;|&nbsp; Free shipping on orders above Rs. 999
							</p>
						</div>

						<!-- ===== Colour + Size selection, combined into one compact row ===== -->
						<!-- Both are now single-select: choosing a new colour/size replaces the previous choice. -->
						{#if variations.length > 0 || availableSizes.length > 0}
							<div class="selection-row">
								{#if variations.length > 0}
									<div class="selection-col">
										<div class="selection-header">
											<span class="selection-label">Colour</span>
											{#if selectedVariation}
												<span class="selection-count">Selected</span>
											{:else}
												<span class="selection-hint">Pick one</span>
											{/if}
										</div>
										<div class="chip-row">
											{#each variations as v}
												<button
													type="button"
													class="color-chip"
													class:chip-active={selectedVariation ===
														(v.color || v.color_code || v.hex_code || v.name)}
													onclick={() => selectVariation(v)}
													aria-label={v.name}
													title={v.name}
												>
													{#if v.color_code || v.hex_code || v.color}
														<span
															class="chip-swatch"
															style="background:{v.color_code || v.hex_code || v.color}"
														></span>
													{:else if v.image}
														<img src={getImageUrl(v.image)} alt={v.name} class="chip-img" />
													{:else}
														<span class="chip-swatch chip-text">{v.name.slice(0, 2)}</span>
													{/if}
													{#if selectedVariation === (v.color || v.color_code || v.hex_code || v.name)}
														<span class="chip-check">...</span>
													{/if}
												</button>
											{/each}
										</div>
									</div>
								{/if}

								{#if availableSizes.length > 0}
									<div class="selection-col">
										<div class="selection-header">
											<span class="selection-label">Size</span>
											{#if selectedSize}
												<span class="selection-count">Selected</span>
											{:else}
												<span class="selection-hint">Pick one</span>
											{/if}
										</div>
										<div class="chip-row">
											{#each availableSizes as size}
												<button
													type="button"
													class="size-chip"
													class:chip-active={selectedSize === size}
													onclick={() => selectSize(size)}
													title={size}
												>
													{size}
												</button>
											{/each}
										</div>
									</div>
								{/if}
							</div>

							<!-- Divider -->
							<div class="divider"></div>
						{/if}

						<!-- Stock + Urgency -->
						<div class="stock-urgency-row">
							{#if product?.stock_status === 'out_of_stock'}
								<div class="stock-chip out-of-stock">
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										width="14"
										height="14"
										stroke-width="2.5"
										><line x1="4" y1="4" x2="20" y2="20" /><line
											x1="4"
											y1="20"
											x2="20"
											y2="4"
										/></svg
									>
									Out of Stock
								</div>
							{:else}
								<div class="stock-chip in-stock">
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										width="14"
										height="14"
										stroke-width="2.5"><polyline points="20 6 9 17 4 12" /></svg
									>
									In Stock
								</div>
								<div class="urgency-text">
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										width="14"
										height="14"
										stroke-width="2"
										><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg
									>
									Order now for delivery.
								</div>
							{/if}
						</div>

						<!-- Divider -->
						<div class="divider"></div>

						{#if product?.stock_status !== 'out_of_stock'}
							<div class="cta-buttons">
								<!-- Quantity Selector -->
								{#if product?.stock_status !== 'out_of_stock'}
									<div class="qty-row">
										<span class="qty-label">Quantity</span>
										<div class="qty-control">
											<button
												class="qty-btn"
												onclick={decrementQuantity}
												disabled={quantity <= 1}
												aria-label="Decrease"
											>
												<svg
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													width="16"
													height="16"
													stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg
												>
											</button>
											<input
												type="number"
												class="qty-input"
												bind:value={quantity}
												min="1"
												max="99"
												oninput={handleQuantityInput}
												aria-label="Quantity"
											/>
											<button
												class="qty-btn"
												onclick={incrementQuantity}
												disabled={quantity >= 99}
												aria-label="Increase"
											>
												<svg
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													width="16"
													height="16"
													stroke-width="2.5"
													><line x1="12" y1="5" x2="12" y2="19" /><line
														x1="5"
														y1="12"
														x2="19"
														y2="12"
													/></svg
												>
											</button>
										</div>
										{#if productInCart}
											<div class="in-cart-note">
												<svg
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													width="14"
													height="14"
													stroke-width="2.5"><polyline points="20 6 9 17 4 12" /></svg
												>
												{productCartQuantity} already in cart
											</div>
										{/if}
									</div>
								{/if}
								<button class="btn-cart" onclick={handleAddToCart} disabled={isAddingToCart}>
									{#if isAddingToCart}
										<svg
											class="spinner-icon"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											width="20"
											height="20"
											stroke-width="2"
											><circle
												cx="12"
												cy="12"
												r="10"
												stroke-dasharray="31.4"
												stroke-dashoffset="10"
											/></svg
										>
										Adding...
									{:else}
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											width="20"
											height="20"
											stroke-width="2"
											><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path
												d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
											/></svg
										>
										Add to Cart
									{/if}
								</button>
							</div>
						{/if}

						<!-- CTA Buttons -->
					</div>
				</div>

				<!-- ===== Product Detail Tabs ===== -->
				<div class="tabs-section">
					<div class="tab-nav">
						<button
							class="tab-btn"
							class:tab-active={activeTab === 'description'}
							onclick={() => (activeTab = 'description')}
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								width="16"
								height="16"
								stroke-width="2"
								><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline
									points="14 2 14 8 20 8"
								/><line x1="16" y1="13" x2="8" y2="13" /><line
									x1="16"
									y1="17"
									x2="8"
									y2="17"
								/><polyline points="10 9 9 9 8 9" /></svg
							>
							Description
						</button>
						{#if product.specifications}
							<button
								class="tab-btn"
								class:tab-active={activeTab === 'specifications'}
								onclick={() => (activeTab = 'specifications')}
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									width="16"
									height="16"
									stroke-width="2"
									><path d="M9 11l3 3L22 4" /><path
										d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
									/></svg
								>
								Specifications
							</button>
						{/if}
						{#if product.features && product.features.length > 0}
							<button
								class="tab-btn"
								class:tab-active={activeTab === 'features'}
								onclick={() => (activeTab = 'features')}
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									width="16"
									height="16"
									stroke-width="2"
									><polygon
										points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
									/></svg
								>
								Features
							</button>
						{/if}
						<button
							class="tab-btn"
							class:tab-active={activeTab === 'reviews'}
							onclick={() => (activeTab = 'reviews')}
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								width="16"
								height="16"
								stroke-width="2"
								><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg
							>
							Reviews
						</button>
					</div>

					<div class="tab-body">
						{#if activeTab === 'description'}
							<div class="tab-pane desc-pane">
								{#if product.description}
									<div class="desc-content">
										<div class="desc-icon-wrap">
											<svg
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												width="28"
												height="28"
												stroke-width="1.5"
												><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z" /><path
													d="M12 16v-4M12 8h.01"
												/></svg
											>
										</div>
										<div class="desc-text">
											<h3>About this product</h3>
											<p>{product.description}</p>
										</div>
									</div>
								{:else}
									<div class="empty-tab">
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											width="40"
											height="40"
											stroke-width="1"
											><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg
										>
										<p>No description available for this product.</p>
									</div>
								{/if}
							</div>
						{:else if activeTab === 'specifications' && product.specifications}
							<div class="tab-pane">
								<table class="spec-table">
									<tbody>
										{#each Object.entries(product.specifications) as [key, value]}
											<tr>
												<th>{key}</th>
												<td>{value}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else if activeTab === 'features' && product.features && product.features.length > 0}
							<div class="tab-pane features-pane">
								<ul class="features-list">
									{#each product.features as feature, i}
										<li class="feature-item">
											<div class="feature-num">{i + 1}</div>
											<span>{feature}</span>
										</li>
									{/each}
								</ul>
							</div>
						{:else if activeTab === 'reviews'}
							<div class="tab-pane reviews-pane" id="reviews">
								{#if product.rating}
									<div class="reviews-summary">
										<div class="reviews-score-block">
											<span class="big-score">{product.rating}</span>
											<div class="stars-wrap">
												{#each Array(5) as _, i}
													<span
														class="star star-lg"
														class:star-filled={i < Math.floor(product.rating || 0)}>★</span
													>
												{/each}
											</div>
											<span class="reviews-total">{product.reviews_count || 0} reviews</span>
										</div>
										<div class="reviews-bars">
											{#each [5, 4, 3, 2, 1] as star}
												<div class="bar-row">
													<span class="bar-label">{star}★</span>
													<div class="bar-track">
														<div
															class="bar-fill"
															style="width: {star === Math.round(product.rating || 0)
																? 65
																: star > Math.round(product.rating || 0)
																	? 10
																	: 20}%"
														></div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
								<div class="write-review-cta">
									<p>Share your thoughts with other customers</p>
									<a href="#reviews" class="btn-write-review">Write a Review</a>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<!-- Lightbox -->
		{#if isLightboxOpen}
			<div
				class="lightbox-bg"
				onclick={() => (isLightboxOpen = false)}
				onkeydown={(e) => e.key === 'Escape' && (isLightboxOpen = false)}
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<div
					class="lightbox-box"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
					role="presentation"
				>
					<button class="lb-close" onclick={() => (isLightboxOpen = false)} aria-label="Close">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							width="28"
							height="28"
							stroke-width="2.5"
							><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg
						>
					</button>
					{#if activeImages().length > 1}
						<button
							class="lb-arrow lb-prev"
							onclick={() => navigateLightbox('prev')}
							aria-label="Previous"
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								width="28"
								height="28"
								stroke-width="2.5"><polyline points="15 18 9 12 15 6" /></svg
							>
						</button>
						<button
							class="lb-arrow lb-next"
							onclick={() => navigateLightbox('next')}
							aria-label="Next"
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								width="28"
								height="28"
								stroke-width="2.5"><polyline points="9 18 15 12 9 6" /></svg
							>
						</button>
					{/if}
					<div class="lb-img-wrap">
						{#if activeImages()[selectedImageIndex]}
							<img
								src={getImageUrl(activeImages()[selectedImageIndex].image)}
								alt={activeImages()[selectedImageIndex].alt_text || product.name}
								class="lb-img"
							/>
						{/if}
					</div>
					{#if activeImages().length > 1}
						<div class="lb-counter">{selectedImageIndex + 1} / {activeImages().length}</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
	<!-- end .product-page -->
{/if}

<Footer />
<Toast />

<style>
	/* ==============================
	   GLOBAL RESETS
	============================== */
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}

	/* ==============================
	   NOT FOUND PAGE
	============================== */
	.not-found-page {
		min-height: 70vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f0fdf4 0%, #fff 100%);
		padding: 120px 20px 60px;
	}
	.not-found-inner {
		text-align: center;
		max-width: 440px;
	}
	.not-found-icon {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #d1fae5, #a7f3d0);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 24px;
		color: #059669;
	}
	.not-found-inner h1 {
		font-size: 1.75rem;
		font-weight: 800;
		color: #1e293b;
		margin: 0 0 10px;
	}
	.not-found-inner p {
		color: #64748b;
		margin: 0 0 28px;
		line-height: 1.6;
	}
	.btn-home {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 14px 28px;
		background: linear-gradient(135deg, #10b981, #059669);
		color: white;
		text-decoration: none;
		border-radius: 12px;
		font-weight: 700;
		box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
		transition: all 0.25s ease;
	}
	.btn-home:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
	}

	/* ==============================
	   LAYOUT
	============================== */
	.product-page {
		min-height: 100vh;
		padding-bottom: 80px;
	}
	.container {
		max-width: 1280px;
		margin: 0 auto;
		padding: 20px 24px;
		border-radius: 5px;
	}

	/* ==============================
	   BREADCRUMB STRIP
	============================== */
	.breadcrumb-strip {
		background: #0b5d1e;
		border-bottom: 1px solid #f5f5f5;
		position: static;
	}
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8rem;
		color: #fff;
		flex-wrap: wrap;
	}
	.breadcrumb a {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: #fff;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s;
	}
	.breadcrumb a:hover {
		color: #d4a017;
	}
	.bc-sep {
		color: #fff;
	}
	.bc-current {
		color: #fff;
		font-weight: 600;
	}

	/* ==============================
	   PRODUCT SECTION
	============================== */
	.product-section {
		background-color: #f5f5f5;
	}

	/* Gallery column now uses a fixed, smaller max-width instead of a 1:1 split */
	.product-grid {
		display: grid;
		grid-template-columns: 400px 1fr;
		gap: 48px;
		align-items: start;
	}

	/* ==============================
	   GALLERY COLUMN
	============================== */
	.gallery-col {
		display: flex;
		flex-direction: column;
		gap: 10px;
		position: sticky;
		top: 110px;
		align-self: flex-start;
		width: 100%;
		max-width: 400px;
	}

	.main-img-col {
		flex: 1;
		min-width: 0;
	}

	/* Compact main image frame — smaller footprint */
	.main-img-frame {
		position: relative;
		aspect-ratio: 1 / 1;
		max-width: 400px;
		border-radius: 5px;
		overflow: hidden;
		transition:
			border-color 0.3s,
			box-shadow 0.3s;
	}
	.main-img-frame:hover {
		box-shadow: 0 10px 36px rgba(16, 185, 129, 0.13);
	}
	.main-img-frame.zoomed .main-img {
		transform: scale(1.35);
	}

	.main-img-btn {
		display: block;
		width: 100%;
		height: 100%;
		border: none;
		background: none;
		padding: 0;
		margin: 0;
		cursor: zoom-in;
	}

	.main-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		transform-origin: center;
		box-sizing: border-box;
		display: block;
	}

	.img-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #94a3b8;
		gap: 10px;
		font-size: 0.85rem;
	}

	.img-badge {
		position: absolute;
		z-index: 5;
		font-weight: 800;
		font-size: 0.72rem;
		letter-spacing: 0.02em;
	}

	/* Horizontal thumbnail strip — smaller thumbs */
	.thumb-strip-h {
		display: flex;
		flex-direction: row;
		gap: 8px;
		overflow-x: auto;
		padding: 6px 2px;
		scrollbar-width: thin;
		scrollbar-color: #cbd5e1 transparent;
		margin-top: 12px;
		scroll-behavior: smooth;
	}
	.thumb-strip-h::-webkit-scrollbar {
		height: 5px;
	}
	.thumb-strip-h::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 10px;
	}
	.thumb-strip-h::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 10px;
	}
	.thumb-strip-h::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	.thumb-item-h {
		width: 60px;
		height: 60px;
		flex-shrink: 0;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		overflow: hidden;
		cursor: pointer;
		padding: 0;
		background: white;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
	}
	.thumb-item-h img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}
	.thumb-item-h:hover {
		border-color: #10b981;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	}
	.thumb-item-h:hover img {
		transform: scale(1.1);
	}
	.thumb-item-h.thumb-active {
		border-color: #d4a017 !important;
		box-shadow:
			0 0 0 2px rgba(11, 93, 30, 0.1),
			0 4px 12px rgba(11, 93, 30, 0.15) !important;
		background: #f0fdf4;
	}
	.discount-pill {
		top: 12px;
		left: 12px;
		background: linear-gradient(135deg, #0b5d1e, #0b5d1e);
		color: white;
		padding: 6px 12px;
		border-radius: 100px;
		box-shadow: 0 4px 12px rgba(239, 236, 68, 0.4);
		animation: badgePulse 2.5s ease-in-out infinite;
	}
	@keyframes badgePulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.04);
		}
	}

	.zoom-hint {
		position: absolute;
		bottom: 12px;
		right: 12px;
		z-index: 5;
		width: 34px;
		height: 34px;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(8px);
		border: none;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #d4a017;
		cursor: pointer;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
		transition: all 0.25s;
	}
	.zoom-hint:hover {
		background: white;
		color: #10b981;
		transform: scale(1.1);
	}

	.magnifier-lens {
		position: absolute;
		width: 150px;
		height: 150px;
		z-index: 10;
		background: #0b5d1e;
		border: 2.5px solid #10b981;
		border-radius: 12px;
		overflow: hidden;
		box-shadow:
			0 8px 24px rgba(16, 185, 129, 0.3),
			0 0 0 2px rgba(255, 255, 255, 0.8),
			inset 0 0 0 1px rgba(16, 185, 129, 0.2);
		pointer-events: none;
		background-color: white;
		background-size: cover;
		background-attachment: local;
		background-repeat: no-repeat;
		will-change: transform;
	}

	.gal-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 5;
		width: 36px;
		height: 36px;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(8px);
		border: none;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #1e293b;
		cursor: pointer;
		box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
		transition: all 0.25s;
		opacity: 0;
	}
	.main-img-frame:hover .gal-arrow {
		opacity: 1;
	}
	.gal-arrow:hover {
		background: white;
		color: #10b981;
		transform: translateY(-50%) scale(1.1);
	}
	.gal-prev {
		left: 10px;
	}
	.gal-next {
		right: 10px;
	}

	.img-counter {
		position: absolute;
		bottom: 12px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		color: white;
		padding: 4px 12px;
		border-radius: 100px;
		font-size: 0.7rem;
		font-weight: 600;
		z-index: 5;
	}

	/* ==============================
	   INFO COLUMN
	============================== */
	.info-col {
		display: flex;
		flex-direction: column;
		gap: 22px;
	}

	.info-top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.category-chip {
		display: inline-block;
		padding: 5px 10px;
		background: #0b5d1e;
		color: #fff;
		font-size: 0.75rem;
		font-weight: 700;
		border-radius: 100px;
		letter-spacing: 0.01em;
		text-transform: uppercase;
	}

	.icon-actions {
		display: flex;
		gap: 8px;
	}

	.icon-btn {
		width: 42px;
		height: 42px;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		background: #d4a017;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		transition: all 0.25s;
	}
	.icon-btn:hover {
		border-color: #10b981;
		color: #10b981;
		background: #f0fdf4;
		transform: translateY(-1px);
	}
	.wishlisted {
		color: #ef4444 !important;
		border-color: #fca5a5 !important;
		background: #fff1f2 !important;
	}

	.product-title {
		font-size: 2rem;
		font-weight: 800;
		color: #161616;
		line-height: 1.15;
		letter-spacing: -0.025em;
		margin: 0;
	}

	.rating-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		font-size: 0.85rem;
	}
	.stars-wrap {
		display: flex;
		gap: 2px;
	}
	.star {
		color: #d1d5db;
		font-size: 1.05rem;
		line-height: 1;
	}
	.star-filled {
		color: #fbbf24;
	}
	.rating-val {
		font-weight: 800;
		color: #1e293b;
	}
	.reviews-sep {
		color: #cbd5e1;
	}
	.reviews-link {
		color: #10b981;
		font-weight: 600;
		text-decoration: none;
	}
	.reviews-link:hover {
		text-decoration: underline;
	}
	.verified-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: #f0fdf4;
		color: #059669;
		padding: 3px 10px;
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.divider {
		height: 1px;
		background: linear-gradient(90deg, #d1fae5, transparent);
	}

	.price-block {
		background: linear-gradient(135deg, #f5f5f5 0%, #f5f5f5 100%);
		border-radius: 5px;
	}
	.price-main {
		display: flex;
		align-items: baseline;
		gap: 12px;
		flex-wrap: wrap;
	}
	.price-current {
		font-size: 2.25rem;
		font-weight: 900;
		color: #222222;
		letter-spacing: -0.03em;
	}
	.price-original {
		font-size: 1.2rem;
		color: #f5f5f5;
		text-decoration: line-through;
	}
	.price-save-pill {
		padding: 4px 12px;
		background: linear-gradient(135deg, #10b981, #059669);
		color: 161616;
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 700;
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
	}
	.tax-note {
		font-size: 0.78rem;
		color: #161616;
		margin: 0;
	}

	.stock-urgency-row {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}
	.stock-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border-radius: 100px;
		font-size: 0.8rem;
		font-weight: 700;
	}
	.in-stock {
		background: #0b5d1e;
		color: #fff;
	}
	.out-of-stock {
		background: #fee2e2;
		color: #dc2626;
	}
	.urgency-text {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #0b5d1e;
		font-size: 0.8rem;
	}

	/* ==============================
	   COMBINED COLOUR + SIZE SELECTOR
	   Compact, side-by-side, modern chip UI. Both support multi-select.
	============================== */
	.selection-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 28px;
	}
	.selection-col {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}
	.selection-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		flex-wrap: wrap;
	}
	.selection-label {
		font-weight: 700;
		color: #1e293b;
		font-size: 0.82rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.selection-count {
		font-size: 0.68rem;
		font-weight: 700;
		color: #0b5d1e;
		background: #d1fae5;
		padding: 3px 10px;
		border-radius: 100px;
		white-space: nowrap;
	}
	.selection-hint {
		font-size: 0.7rem;
		color: #94a3b8;
		font-weight: 500;
		white-space: nowrap;
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	/* Colour chip — small square swatch */
	.color-chip {
		position: relative;
		width: 26px;
		height: 26px;
		flex-shrink: 0;
		border-radius: 5px;
		border: 2px solid #e2e8f0;
		background: white;
		cursor: pointer;
		padding: 0;
		overflow: hidden;
		display: block;
		transition: all 0.18s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}
	.color-chip:hover {
		border-color: #10b981;
		transform: translateY(-1px);
		box-shadow: 0 3px 8px rgba(16, 185, 129, 0.2);
	}
	.color-chip.chip-active {
		border-color: #d4a017;
		box-shadow:
			0 0 0 2px rgba(212, 160, 23, 0.15),
			0 3px 8px rgba(212, 160, 23, 0.25);
	}
	.chip-swatch {
		width: 100%;
		height: 100%;
		display: block;
	}
	.chip-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.chip-text {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6rem;
		font-weight: 700;
		color: #475569;
		text-transform: uppercase;
		background: #f1f5f9;
	}
	.chip-check {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.34);
	}

	/* Size chip — small rounded pill, same visual family as colour chips */
	.size-chip {
		min-width: 26px;
		height: 26px;
		flex-shrink: 0;
		padding: 0 12px;
		border-radius: 8px;
		border: 2px solid #e2e8f0;
		background: white;
		font-family: inherit;
		font-size: 0.78rem;
		font-weight: 700;
		color: #1e293b;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		cursor: pointer;
		transition: all 0.18s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}
	.size-chip:hover {
		border-color: #10b981;
		transform: translateY(-1px);
		box-shadow: 0 3px 8px rgba(16, 185, 129, 0.2);
	}
	.size-chip.chip-active {
		border-color: #d4a017;
		background: #fdf3df;
		color: #a3730f;
		box-shadow: 0 0 0 2px rgba(212, 160, 23, 0.15);
	}

	/* Quantity row */
	.qty-row {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}
	.qty-label {
		font-weight: 700;
		color: #1e293b;
		font-size: 0.95rem;
	}
	.qty-control {
		display: flex;
		align-items: center;
		border: 2px solid #f5f5f5;
		border-radius: 5px;
		overflow: hidden;
		transition: border-color 0.25s;
	}
	.qty-control:focus-within {
		border-color: #fff;
	}
	.qty-btn {
		width: 46px;
		height: 46px;
		border: none;
		background: #0b5d1e;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #f5f5f5;
		transition: all 0.2s;
	}
	.qty-btn:hover:not(:disabled) {
		background: #fff;
		color: #0b5d1e;
	}
	.qty-btn:disabled {
		cursor: not-allowed;
	}
	.qty-input {
		width: 64px;
		height: 46px;
		border: none;
		border-left: 2px solid #0b5d1e;
		border-right: 2px solid #0b5d1e;
		text-align: center;
		font-size: 1.05rem;
		font-weight: 700;
		color: #0b5d1e;
		-moz-appearance: textfield;
		appearance: textfield;
	}
	.qty-input::-webkit-inner-spin-button,
	.qty-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
	}
	.qty-input:focus {
		outline: none;
	}
	.in-cart-note {
		display: flex;
		align-items: center;
		gap: 5px;
		background: #d4a017;
		color: #fff;
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 0.78rem;
		font-weight: 600;
	}

	/* CTA buttons */
	.cta-buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.btn-cart,
	.btn-buy {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		width: 100%;
		padding: 16px 24px;
		border-radius: 5px;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		border: none;
		transition: all 0.3s ease;
		font-family: inherit;
		box-sizing: border-box;
	}
	.btn-cart {
		background: #0b5d1e;
		color: #fff;
		border: 2.5px solid #0b5d1e;
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
	}
	.btn-cart:hover:not(:disabled) {
		background: #0b5d1e;
		color: #fff;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(16, 185, 129, 0.2);
	}
	.btn-buy {
		background: #d4a017;
		color: white;
		box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
	}
	.btn-buy:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 28px rgba(16, 185, 129, 0.45);
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
	}
	.btn-cart:disabled,
	.btn-buy:disabled {
		opacity: 0.55;
		cursor: not-allowed;
		transform: none !important;
	}

	.spinner-icon {
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ==============================
	   TABS SECTION
	============================== */
	.tabs-section {
		margin-top: 56px;
		background: white;
		border-radius: 5px;
		border: 1.5px solid #e2e8f0;
		overflow: hidden;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
	}

	.tab-nav {
		display: flex;
		background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%);
		border-bottom: 2px solid #e2e8f0;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 16px 28px;
		border: none;
		background: transparent;
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		color: #161616;
		cursor: pointer;
		white-space: nowrap;
		position: relative;
		transition: all 0.25s;
		flex-shrink: 0;
	}
	.tab-btn:hover {
		color: #10b981;
		background: rgba(16, 185, 129, 0.05);
	}
	.tab-active {
		color: #d4a017 !important;
		background: white !important;
	}
	.tab-active::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, #d4a017, #d4a017);
		border-radius: 3px 3px 0 0;
	}

	.tab-body {
		padding: 36px;
	}

	.desc-content {
		display: flex;
		gap: 20px;
	}
	.desc-icon-wrap {
		width: 52px;
		height: 52px;
		flex-shrink: 0;
		background: #161616;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
	}
	.desc-text h3 {
		font-size: 1rem;
		font-weight: 700;
		color: #161616;
		margin: 0 0 10px;
	}
	.desc-text p {
		color: #161616;
		line-height: 1.8;
		margin: 0;
		font-size: 0.95rem;
	}

	.empty-tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 32px 0;
		color: #94a3b8;
		font-size: 0.9rem;
	}

	.spec-table {
		width: 100%;
		border-collapse: collapse;
	}
	.spec-table tr:nth-child(even) {
		background: #f8fafc;
	}
	.spec-table tr {
		border-bottom: 1px solid #e2e8f0;
	}
	.spec-table tr:last-child {
		border-bottom: none;
	}
	.spec-table th {
		text-align: left;
		padding: 14px 20px;
		font-weight: 700;
		color: #1e293b;
		font-size: 0.875rem;
		background: #f0fdf4;
		width: 38%;
	}
	.spec-table td {
		padding: 14px 20px;
		color: #475569;
		font-size: 0.875rem;
	}

	.features-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 12px;
	}
	.feature-item {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		padding: 14px 18px;
		background: #f8fafc;
		border: 1.5px solid #e2e8f0;
		border-radius: 12px;
		color: #475569;
		line-height: 1.6;
		transition: border-color 0.2s;
	}
	.feature-item:hover {
		border-color: #a7f3d0;
	}
	.feature-num {
		width: 28px;
		height: 28px;
		flex-shrink: 0;
		background: linear-gradient(135deg, #10b981, #059669);
		color: white;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 800;
	}

	.reviews-summary {
		display: flex;
		gap: 48px;
		margin-bottom: 32px;
	}
	.reviews-score-block {
		text-align: center;
		flex-shrink: 0;
	}
	.big-score {
		font-size: 4rem;
		font-weight: 900;
		color: #1e293b;
		line-height: 1;
		display: block;
	}
	.star-lg {
		font-size: 1.4rem;
	}
	.reviews-total {
		font-size: 0.8rem;
		color: #64748b;
		display: block;
		margin-top: 6px;
	}
	.reviews-bars {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
		justify-content: center;
	}
	.bar-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.bar-label {
		font-size: 0.78rem;
		color: #64748b;
		width: 24px;
		flex-shrink: 0;
	}
	.bar-track {
		flex: 1;
		height: 8px;
		background: #e2e8f0;
		border-radius: 4px;
		overflow: hidden;
	}
	.bar-fill {
		height: 100%;
		background: linear-gradient(90deg, #10b981, #059669);
		border-radius: 4px;
		transition: width 0.6s ease;
	}
	.write-review-cta {
		padding: 24px;
		background: #f5f5f5;
		border-radius: 5px;
		text-align: center;
		border: 1.5px dashed #161616;
	}
	.write-review-cta p {
		color: #161616;
		margin: 0 0 14px;
		font-size: 0.9rem;
	}
	.btn-write-review {
		display: inline-flex;
		align-items: center;
		padding: 10px 24px;
		background: linear-gradient(135deg, #d4a017, #d4a017);
		color: white;
		text-decoration: none;
		border-radius: 10px;
		font-weight: 700;
		font-size: 0.875rem;
		box-shadow: 0 3px 12px rgba(16, 185, 129, 0.3);
		transition: all 0.25s;
	}
	.btn-write-review:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
	}

	/* ==============================
	   RELATED PRODUCTS
	============================== */
	.related-section {
		margin-top: 60px;
		padding: 40px;
		background: white;
		border-radius: 24px;
		border: 1.5px solid #e2e8f0;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
	}
	.related-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 28px;
		gap: 16px;
		flex-wrap: wrap;
	}
	.related-title {
		font-size: 1.6rem;
		font-weight: 800;
		color: #d4a017;
		margin: 0 0 4px;
		letter-spacing: -0.02em;
	}
	.related-sub {
		font-size: 0.875rem;
		color: #d4a017;
		margin: 0;
	}
	.view-all-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #fff;
		font-weight: 700;
		font-size: 0.875rem;
		text-decoration: none;
		padding: 9px 18px;
		border: 2px solid #d4a017;
		border-radius: 10px;
		transition: all 0.25s;
		background: #d4a017;
	}
	.view-all-link:hover {
		background: #d4a017;
		color: white;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	/* Related product cards — smaller image tiles */
	.related-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 16px;
	}

	.rp-card {
		background: white;
		border-radius: 14px;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		border: 2px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}
	.rp-card:hover {
		transform: translateY(-6px);
		border-color: #10b981;
		box-shadow: 0 14px 32px rgba(16, 185, 129, 0.15);
	}

	.rp-img-wrap {
		position: relative;
		aspect-ratio: 1;
		max-height: 180px;
		background: linear-gradient(135deg, #f0fdf4, #f8fafc);
		overflow: hidden;
	}
	.rp-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.4s ease;
	}
	.rp-card:hover .rp-img {
		transform: scale(1.08);
	}

	.rp-badge {
		position: absolute;
		top: 8px;
		left: 8px;
		background: linear-gradient(135deg, #ef4444, #dc2626);
		color: white;
		padding: 4px 9px;
		border-radius: 100px;
		font-size: 0.65rem;
		font-weight: 800;
		box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
	}

	.rp-hover-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.38);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 12px;
		opacity: 0;
		transition: opacity 0.3s;
	}
	.rp-card:hover .rp-hover-overlay {
		opacity: 1;
	}

	.rp-quick-view {
		display: flex;
		align-items: center;
		gap: 6px;
		background: white;
		color: #10b981;
		padding: 7px 14px;
		border-radius: 8px;
		font-size: 0.7rem;
		font-weight: 700;
		transform: translateY(12px);
		transition: transform 0.3s;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
	}
	.rp-card:hover .rp-quick-view {
		transform: translateY(0);
	}

	.rp-info {
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
	}
	.rp-name {
		font-size: 0.85rem;
		font-weight: 700;
		color: #d4a017;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.4;
		min-height: 2.4rem;
	}
	.rp-stars {
		display: flex;
		gap: 2px;
		align-items: center;
		font-size: 0.85rem;
	}
	.rp-stars span {
		color: #d1d5db;
	}
	.rp-stars .star-filled {
		color: #fbbf24;
	}
	.rp-rating-val {
		font-size: 0.75rem;
		font-weight: 700;
		color: #1e293b;
		margin-left: 4px;
	}

	.rp-price-row {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.rp-price-curr {
		font-size: 1.05rem;
		font-weight: 800;
		color: #d4a017;
	}
	.rp-price-orig {
		font-size: 0.82rem;
		color: #94a3b8;
		text-decoration: line-through;
	}

	.rp-cart-btn {
		width: 100%;
		margin-top: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 9px;
		border: none;
		border-radius: 10px;
		background: #d4a017;
		color: white;
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.25s;
		font-family: inherit;
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
	}
	.rp-cart-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
	}

	/* ==============================
	   LIGHTBOX
	============================== */
	.lightbox-bg {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.9);
		backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 0.25s ease;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.lightbox-box {
		position: relative;
		width: 90vw;
		height: 90vh;
		max-width: 1200px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.lb-close {
		position: absolute;
		top: -8px;
		right: -8px;
		z-index: 10;
		width: 52px;
		height: 52px;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(8px);
		border: 1.5px solid rgba(255, 255, 255, 0.25);
		border-radius: 50%;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.25s;
	}
	.lb-close:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.1) rotate(90deg);
	}

	.lb-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
		width: 52px;
		height: 52px;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(8px);
		border: 1.5px solid rgba(255, 255, 255, 0.25);
		border-radius: 50%;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.25s;
	}
	.lb-arrow:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-50%) scale(1.1);
	}
	.lb-prev {
		left: -72px;
	}
	.lb-next {
		right: -72px;
	}

	.lb-img-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		max-width: 100%;
		max-height: 100%;
	}
	.lb-img {
		max-width: 100%;
		max-height: 80vh;
		object-fit: contain;
		border-radius: 12px;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
	}
	.lb-counter {
		position: absolute;
		bottom: -48px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(8px);
		border: 1.5px solid rgba(255, 255, 255, 0.2);
		color: white;
		padding: 8px 20px;
		border-radius: 100px;
		font-size: 0.85rem;
		font-weight: 700;
	}

	/* ==============================
	   RESPONSIVE
	============================== */
	@media (max-width: 1100px) {
		.product-grid {
			grid-template-columns: 1fr;
			gap: 32px;
		}
		.gallery-col {
			position: static;
			max-width: 100%;
		}
		.main-img-frame {
			max-width: 360px;
		}
		.related-grid {
			grid-template-columns: repeat(3, 1fr);
		}
		.lb-prev {
			left: -20px;
		}
		.lb-next {
			right: -20px;
		}
	}

	@media (max-width: 768px) {
		.product-section {
			padding: 24px 0 0;
		}
		.product-title {
			font-size: 1.5rem;
		}
		.price-current {
			font-size: 1.75rem;
		}
		.cta-buttons {
			grid-template-columns: 1fr;
		}
		.related-section {
			padding: 24px;
		}
		.related-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.related-header {
			flex-direction: column;
			align-items: flex-start;
		}
		.tab-body {
			padding: 24px;
		}
		.reviews-summary {
			flex-direction: column;
			gap: 24px;
		}
		.gallery-col {
			position: static;
		}
		.main-img-frame {
			max-width: 100%;
			aspect-ratio: 1 / 1;
		}
		.selection-row {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}

	@media (max-width: 480px) {
		.container {
			padding: 0 16px;
		}
		.product-title {
			font-size: 1.25rem;
		}
		.price-current {
			font-size: 1.5rem;
		}
		.related-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
		}
		.rp-info {
			padding: 12px;
		}
		.rp-name {
			font-size: 0.8rem;
		}
		.tab-btn {
			padding: 14px 16px;
			font-size: 0.8rem;
		}
		.tabs-section {
			border-radius: 16px;
		}
		.lb-prev,
		.lb-next {
			display: none;
		}
		.thumb-item-h {
			width: 48px;
			height: 48px;
		}
	}
</style>
