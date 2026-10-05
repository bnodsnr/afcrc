<script lang="ts">
	import { resolve, base } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { getImageUrl } from '$lib/utils/image';
	import { getCategoryUrl } from '$lib/utils/url';
	import { addToCart } from '$lib/utils/cart';
	import { showSuccess, showError, showWarning } from '$lib/stores/toast';
	import { buildCartItemId, getCartItemByCartItemId } from '$lib/stores/cart';
	import { isLoggedIn } from '$lib/stores/auth';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const product = $derived(data.product);
	const relatedProducts = $derived(data.relatedProducts ?? []);

	type GalleryImage = {
		image: string;
		alt_text?: string;
		variationId?: number;
	};

	type Variation = {
		id: number;
		name: string;
		color?: string;
		color_code?: string;
		hex_code?: string;
		image?: string;
		images?: { image: string; alt_text?: string }[];
	};

	// ---- Image gallery state ----
	let selectedImageIndex = $state(0);
	let isImageZoomed = $state(false);
	let isLightboxOpen = $state(false);
	let magnifierX = $state(0);
	let magnifierY = $state(0);
	let mouseX = $state(0);
	let mouseY = $state(0);
	let isMagnifierActive = $state(false);
	let selectedVariation = $state<string | null>(null);
	let selectedSize = $state<string | null>(null);

	const images = $derived.by(() => {
		const list: GalleryImage[] = [];

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

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (isLightboxOpen && e.key === 'Escape') isLightboxOpen = false;
	}

	// ---- Selection state ----
	// Colour and size are single-select: choosing a new option replaces the
	// previous choice instead of adding to it.
	let quantity = $state(1);
	let activeTab = $state<'description' | 'specifications' | 'features' | 'reviews'>('description');

	const variations = $derived((product?.variations ?? []) as Variation[]);
	const availableSizes = $derived(
		Array.isArray(product?.product_sizes) ? product.product_sizes.filter(Boolean) : []
	);

	function selectVariation(v: Variation) {
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

	async function requireAuth() {
		if (!get(isLoggedIn)) {
			await goto(resolve('/login'));
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
		console.log('product', product);
		if (!product || isAddingToCart || !(await requireAuth())) return;
		// if (!validateSelection()) return;
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
				goto(`${base}/cart` as unknown as ResolvedPathname);
			},
			onError: (err) => showError(err || 'Failed to add product to cart')
		});
		isAddingToCart = false;
	}

	let isBuyingNow = $state(false);

	async function handleBuyNow() {
		console.log('product', product);
		if (!product || isBuyingNow || !(await requireAuth())) return;
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

		isBuyingNow = true;

		await addToCart(product, {
			quantity,
			color: selectedVariation ?? undefined,
			size: selectedSize ?? undefined,
			onSuccess: () => {
				showSuccess(`${quantity} × ${product.name} added to cart`);
				quantity = 1;
				goto(`${base}/checkout` as unknown as ResolvedPathname);
			},
			onError: (err) => {
				showError(err || 'Failed to add product to cart');
				isBuyingNow = false;
			}
		});
		isBuyingNow = false;
	}

	function incrementQuantity() {
		if (quantity < 99) {
			quantity++;
		} else {
			showWarning('Maximum quantity is 99');
		}
	}
	function decrementQuantity() {
		if (quantity > 1) {
			quantity--;
		} else {
			showWarning('Minimum quantity is 1');
		}
	}
	function handleQuantityInput(e: Event) {
		const value = parseInt((e.target as HTMLInputElement).value);
		if (isNaN(value) || value < 1) quantity = 1;
		else if (value > 99) {
			quantity = 99;
			showWarning('Maximum quantity is 99');
		} else quantity = value;
	}

	// ---- Pricing ----
	const regularPrice = $derived(Number(product?.regular_price) || 0);
	const discountedPrice = $derived(product?.sale_price ? Number(product.sale_price) : null);
	const hasDiscount = $derived(!!discountedPrice && discountedPrice < regularPrice);
	const savings = $derived(hasDiscount ? (regularPrice - discountedPrice!).toFixed(2) : null);

	const starItems = [0, 1, 2, 3, 4];

	function formatPrice(price: number | string): string {
		const n = Number(price) || 0;
		return `Rs. ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function variationColor(v: Variation): string {
		return v.color || v.color_code || v.hex_code || v.name;
	}
</script>

<svelte:head>
	<title>{product?.name || 'Product'} - AFCRC</title>
	<meta name="description" content={product?.description || 'View product details'} />
</svelte:head>

<svelte:window onkeydown={handleGlobalKeydown} />

{#if !product}
	<!-- Not Found State -->
	<div class="flex min-h-[70vh] items-center justify-center bg-paper px-5 py-20">
		<div class="max-w-[440px] text-center">
			<div
				class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-paper-2 text-pine-dark"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="34" height="34">
					<circle cx="11" cy="11" r="8" stroke-width="1.5" />
					<path d="M21 21l-4.35-4.35" stroke-width="1.5" stroke-linecap="round" />
					<path d="M8 11h6M11 8v6" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</div>
			<h1 class="m-0 mb-2.5 font-serif text-[1.75rem] font-bold text-ink">Product Not Found</h1>
			<p class="m-0 mb-7 leading-relaxed text-ink-soft">
				The product you're looking for doesn't exist or has been removed.
			</p>
			<a
				href={resolve('/')}
				class="inline-flex items-center gap-2 rounded-full bg-pine px-7 py-3.5 font-bold text-white shadow-[0_4px_16px_rgba(43,109,76,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-pine-dark"
			>
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
	<div class="bg-paper-white">
		<!-- Top strip: breadcrumb -->
		<div class="border-b border-line bg-pine-dark">
			<div class="mx-auto max-w-[1180px] px-6 py-3.5 max-md:px-4">
				<nav
					class="flex flex-wrap items-center gap-2 font-mono text-[0.72rem] tracking-[0.08em] text-paper/70 uppercase"
					aria-label="Breadcrumb"
				>
					<a
						href={resolve('/')}
						class="inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-gold"
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="13" height="13"
							><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke-width="2" /></svg
						>
						Home
					</a>
					<span class="text-paper/50" aria-hidden="true">/</span>
					{#if product.category}
						<a
							href={getCategoryUrl(product.category) as unknown as ResolvedPathname}
							class="transition-colors duration-200 hover:text-gold">{product.category.name}</a
						>
						<span class="text-paper/50" aria-hidden="true">/</span>
					{/if}
					<span class="max-w-[300px] truncate font-semibold text-gold">{product.name}</span>
				</nav>
			</div>
		</div>

		<!-- Main Product Section -->
		<section class="py-[60px] max-md:py-10">
			<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
				<div class="grid grid-cols-[400px_1fr] items-start gap-10 max-lg:grid-cols-1">
					<!-- ===== LEFT: Image Gallery ===== -->
					<div class="flex w-full max-w-[400px] flex-col gap-2.5 max-lg:mx-auto max-lg:max-w-full">
						<!-- Main image -->
						<div
							class="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_-24px_rgba(18,50,26,0.2)]"
							onmousemove={handleMagnifierMove}
							onmouseleave={handleMagnifierLeave}
							role="img"
							aria-label="Product image with magnifier"
						>
							{#if activeImages()[selectedImageIndex]}
								<button
									type="button"
									class="m-0 block h-full w-full cursor-zoom-in border-none bg-none p-0"
									onclick={() => openLightbox(selectedImageIndex)}
									onmouseenter={() => (isImageZoomed = true)}
									onmouseleave={() => (isImageZoomed = false)}
									aria-label="Zoom image"
								>
									<img
										src={getImageUrl(activeImages()[selectedImageIndex].image)}
										alt={activeImages()[selectedImageIndex].alt_text || product.name}
										class="h-full w-full object-contain transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] {isImageZoomed
											? 'scale-[1.35]'
											: ''}"
										id="main-product-image"
									/>
								</button>

								<!-- Magnifier Lens -->
								{#if isMagnifierActive}
									{@const magStyle = getMagnifierImageStyle(mouseX, mouseY)}
									<div
										class="pointer-events-none absolute z-10 h-[150px] w-[150px] overflow-hidden rounded-xl border-[2.5px] border-pine bg-white shadow-[0_8px_24px_rgba(43,109,76,0.3),0_0_0_2px_rgba(255,255,255,0.8)]"
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
									<div
										class="absolute top-3 left-3 z-[5] animate-pulse rounded-full bg-gold px-3 py-1 font-mono text-[0.72rem] font-semibold text-pine-dark shadow-md"
									>
										{product.discount_percentage}% OFF
									</div>
								{/if}
								<button
									class="absolute right-3 bottom-3 z-[5] flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-none bg-white/90 text-pine backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white hover:text-teal"
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
								<div
									class="flex h-full w-full flex-col items-center justify-center gap-2.5 text-[0.85rem] text-ink-soft/60"
								>
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
									class="absolute top-1/2 left-2.5 z-[5] flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-white/90 text-ink opacity-0 shadow-md backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:bg-white hover:text-pine"
									onclick={() =>
										(selectedImageIndex =
											selectedImageIndex > 0 ? selectedImageIndex - 1 : activeImages().length - 1)}
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
									class="absolute top-1/2 right-2.5 z-[5] flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-white/90 text-ink opacity-0 shadow-md backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:bg-white hover:text-pine"
									onclick={() =>
										(selectedImageIndex =
											selectedImageIndex < activeImages().length - 1 ? selectedImageIndex + 1 : 0)}
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
								<div
									class="absolute bottom-3 left-1/2 z-[5] -translate-x-1/2 rounded-full bg-pine-dark/70 px-3 py-1 font-mono text-[0.7rem] font-semibold text-paper backdrop-blur-sm"
								>
									{selectedImageIndex + 1} / {activeImages().length}
								</div>
							{/if}
						</div>

						<!-- Horizontal thumbnail strip -->
						{#if activeImages().length > 1}
							<div
								class="mt-3 flex [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] gap-2 overflow-x-auto px-0.5 pb-1"
							>
								{#each activeImages() as image, index (index)}
									<button
										class="h-[60px] w-[60px] flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-white p-0 shadow-[0_2px_4px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-pine hover:shadow-[0_4px_12px_rgba(43,109,76,0.2)] {selectedImageIndex ===
										index
											? 'border-pine-dark shadow-[0_0_0_2px_rgba(23,83,58,0.12),0_4px_12px_rgba(23,83,58,0.18)]'
											: 'border-line'}"
										onclick={() => (selectedImageIndex = index)}
										aria-label="View image {index + 1}"
									>
										<img
											src={getImageUrl(image.image)}
											alt={image.alt_text || product.name}
											class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
										/>
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- ===== RIGHT: Product Info ===== -->
					<div class="flex flex-col gap-5">
						<div
							class="rounded-2xl border border-line bg-white p-6 shadow-[0_16px_40px_-24px_rgba(18,50,26,0.2)] max-md:p-5"
						>
							<!-- Category tag -->
							{#if product.category}
								<span
									class="inline-block rounded-full bg-pine px-3 py-1 text-[0.75rem] font-bold tracking-[0.01em] text-paper uppercase"
								>
									{product.category.name}
								</span>
							{/if}

							<!-- Product Title -->
							<h1
								class="mt-3 font-serif text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.15] font-bold tracking-[-0.02em] text-ink"
							>
								{product.name}
							</h1>

							<!-- Rating Row -->
							{#if product.rating || product.reviews_count}
								<div class="mt-2 flex flex-wrap items-center gap-2 text-[0.85rem]">
									<div class="flex gap-0.5">
										{#each starItems as i (i)}
											<span
												class="leading-none {i < Math.floor(product.rating || 0)
													? 'text-gold'
													: i === Math.floor(product.rating || 0) &&
														  (product.rating || 0) % 1 >= 0.5
														? 'text-gold'
														: 'text-line'}">★</span
											>
										{/each}
									</div>
									<span class="font-bold text-ink">{product.rating || 0}</span>
									{#if product.reviews_count}
										<span class="text-line">·</span>
										<a href="#reviews" class="font-semibold text-pine hover:underline"
											>{product.reviews_count} Reviews</a
										>
									{/if}
									<span class="text-line">·</span>
									<span
										class="inline-flex items-center gap-1 rounded-full bg-paper-2/60 px-2.5 py-0.5 text-[0.75rem] font-bold text-pine-dark"
									>
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

							<div class="my-5 h-px bg-gradient-to-r from-teal/40 to-transparent"></div>

							<!-- Price Block -->
							<div class="rounded-2xl bg-paper-2/40 p-4">
								{#if discountedPrice && discountedPrice < regularPrice}
									<div class="flex flex-wrap items-baseline gap-3">
										<span
											class="font-mono text-[clamp(1.8rem,3vw,2.25rem)] font-black tracking-[-0.03em] text-ink"
										>
											Rs. {discountedPrice.toFixed(2)}
										</span>
										<span class="font-mono text-[1.1rem] text-ink-soft line-through">
											Rs. {regularPrice.toFixed(2)}
										</span>
										{#if savings}
											<span
												class="rounded-full bg-pine px-3 py-0.5 font-mono text-[0.72rem] font-bold text-paper shadow-[0_2px_8px_rgba(43,109,76,0.3)]"
											>
												Save Rs. {savings}
											</span>
										{/if}
									</div>
								{:else}
									<div class="flex flex-wrap items-baseline gap-3">
										<span
											class="font-mono text-[clamp(1.8rem,3vw,2.25rem)] font-black tracking-[-0.03em] text-ink"
										>
											{formatPrice(regularPrice)}
										</span>
									</div>
								{/if}
								<p class="m-0 mt-2 text-[0.78rem] text-ink-soft">
									✓ Inclusive of all taxes &nbsp;|&nbsp; Free shipping on orders above Rs. 999
								</p>
							</div>

							<!-- Colour + Size selection, combined into one compact row -->
							{#if variations.length > 0 || availableSizes.length > 0}
								<div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
									{#if variations.length > 0}
										<div class="flex flex-col gap-2.5">
											<div class="flex items-center justify-between gap-2">
												<span class="text-[0.82rem] font-bold tracking-[0.04em] text-ink uppercase">
													Colour
												</span>
												{#if selectedVariation}
													<span
														class="rounded-full bg-teal/15 px-2.5 py-0.5 text-[0.68rem] font-bold whitespace-nowrap text-pine-dark"
													>
														Selected
													</span>
												{:else}
													<span
														class="text-[0.7rem] font-medium whitespace-nowrap text-ink-soft/60"
													>
														Pick one
													</span>
												{/if}
											</div>
											<div class="flex flex-wrap gap-2">
												{#each variations as v (v.id)}
													<button
														type="button"
														class="relative h-[30px] w-[30px] flex-shrink-0 cursor-pointer overflow-hidden rounded-md border-2 p-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-pine hover:shadow-[0_3px_8px_rgba(43,109,76,0.2)] {selectedVariation ===
														variationColor(v)
															? 'border-pine-dark shadow-[0_0_0_2px_rgba(23,83,58,0.15),0_3px_8px_rgba(23,83,58,0.25)]'
															: 'border-line'}"
														onclick={() => selectVariation(v)}
														aria-label={v.name}
														title={v.name}
													>
														{#if v.color_code || v.hex_code || v.color}
															<span
																class="block h-full w-full"
																style="background:{v.color_code || v.hex_code || v.color}"
															></span>
														{:else if v.image}
															<img
																src={getImageUrl(v.image)}
																alt={v.name}
																class="block h-full w-full object-cover"
															/>
														{:else}
															<span
																class="flex h-full w-full items-center justify-center bg-paper-2 text-[0.6rem] font-bold text-ink-soft uppercase"
																>{v.name.slice(0, 2)}</span
															>
														{/if}
														{#if selectedVariation === variationColor(v)}
															<span
																class="absolute inset-0 flex items-center justify-center bg-pine-dark/40 font-mono text-[0.7rem] font-bold text-paper"
																>✓</span
															>
														{/if}
													</button>
												{/each}
											</div>
										</div>
									{/if}

									{#if availableSizes.length > 0}
										<div class="flex flex-col gap-2.5">
											<div class="flex items-center justify-between gap-2">
												<span class="text-[0.82rem] font-bold tracking-[0.04em] text-ink uppercase">
													Size
												</span>
												{#if selectedSize}
													<span
														class="rounded-full bg-teal/15 px-2.5 py-0.5 text-[0.68rem] font-bold whitespace-nowrap text-pine-dark"
													>
														Selected
													</span>
												{:else}
													<span
														class="text-[0.7rem] font-medium whitespace-nowrap text-ink-soft/60"
													>
														Pick one
													</span>
												{/if}
											</div>
											<div class="flex flex-wrap gap-2">
												{#each availableSizes as size (size)}
													<button
														type="button"
														class="h-[30px] min-w-[30px] flex-shrink-0 cursor-pointer rounded-lg border-2 bg-white px-3 text-[0.78rem] font-bold tracking-[0.02em] text-ink uppercase shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-pine hover:shadow-[0_3px_8px_rgba(43,109,76,0.2)] {selectedSize ===
														size
															? 'border-pine-dark bg-paper text-pine-dark shadow-[0_0_0_2px_rgba(23,83,58,0.15)]'
															: 'border-line'}"
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

								<div class="my-5 h-px bg-gradient-to-r from-teal/40 to-transparent"></div>
							{/if}

							<!-- Stock + Urgency -->
							<div class="mt-5 flex flex-wrap items-center gap-4">
								{#if product?.stock_status === 'out_of_stock'}
									<span
										class="inline-flex items-center gap-1.5 rounded-full bg-[#fee2e2] px-3.5 py-1.5 text-[0.8rem] font-bold text-[#dc2626]"
									>
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
									</span>
								{:else}
									<span
										class="inline-flex items-center gap-1.5 rounded-full bg-pine px-3.5 py-1.5 text-[0.8rem] font-bold text-paper"
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											width="14"
											height="14"
											stroke-width="2.5"><polyline points="20 6 9 17 4 12" /></svg
										>
										In Stock
									</span>
									<span class="inline-flex items-center gap-1.5 text-[0.8rem] text-pine-dark">
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
									</span>
								{/if}
							</div>

							{#if product?.stock_status !== 'out_of_stock'}
								<!-- CTA row -->
								<div class="mt-6 flex flex-wrap items-center gap-3">
									<div class="flex items-center gap-3">
										<span class="text-[0.95rem] font-bold text-ink">Quantity</span>
										<div
											class="flex items-center overflow-hidden rounded-xl border-2 border-pine bg-white transition-colors duration-300 focus-within:border-pine-dark"
										>
											<button
												class="flex h-11 w-11 cursor-pointer items-center justify-center border-none bg-pine text-paper transition-all duration-200 hover:bg-pine-dark hover:text-white disabled:cursor-not-allowed"
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
												class="h-11 w-16 [appearance:textfield] border-y-2 border-pine text-center text-[1.05rem] font-bold text-pine-dark outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
												bind:value={quantity}
												min="1"
												max="99"
												oninput={handleQuantityInput}
												aria-label="Quantity"
											/>
											<button
												class="flex h-11 w-11 cursor-pointer items-center justify-center border-none bg-pine text-paper transition-all duration-200 hover:bg-pine-dark hover:text-white disabled:cursor-not-allowed"
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
											<span
												class="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.78rem] font-semibold text-pine-dark"
											>
												<svg
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													width="14"
													height="14"
													stroke-width="2.5"><polyline points="20 6 9 17 4 12" /></svg
												>
												{productCartQuantity} already in cart
											</span>
										{/if}
									</div>
									<button
										class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gold bg-gold px-8 py-3.5 font-bold text-pine-dark shadow-[0_2px_8px_rgba(251,233,186,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-[0_6px_20px_rgba(251,233,186,0.4)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
										onclick={handleBuyNow}
										disabled={isBuyingNow}
									>
										{#if isBuyingNow}
											<svg
												class="animate-spin"
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
											Redirecting...
										{:else}
											<svg
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												width="20"
												height="20"
												stroke-width="2"
												><path
													d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
												/><polyline points="14 2 14 8 20 8" /><line
													x1="16"
													y1="13"
													x2="8"
													y2="13"
												/><line x1="16" y1="17" x2="8" y2="17" /><polyline
													points="10 9 9 9 8 9"
												/></svg
											>
											Buy Now
										{/if}
									</button>
									<button
										class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-pine bg-pine px-8 py-3.5 font-bold text-white shadow-[0_2px_8px_rgba(43,109,76,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-pine-dark hover:shadow-[0_6px_20px_rgba(43,109,76,0.2)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
										onclick={handleAddToCart}
										disabled={isAddingToCart}
									>
										{#if isAddingToCart}
											<svg
												class="animate-spin"
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
						</div>
					</div>
				</div>

				<!-- ===== Product Detail Tabs ===== -->
				<div
					class="mt-10 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
				>
					<div
						class="flex gap-0 overflow-x-auto border-b-2 border-line bg-paper-2/30"
						role="tablist"
						aria-label="Product details"
					>
						<button
							class="relative flex flex-shrink-0 cursor-pointer items-center gap-2 border-none px-6 py-4 font-sans text-[0.9rem] font-semibold whitespace-nowrap transition-all duration-300 {activeTab ===
							'description'
								? 'bg-white text-pine-dark'
								: 'bg-transparent text-ink hover:bg-teal/5 hover:text-pine'}"
							onclick={() => (activeTab = 'description')}
							role="tab"
							aria-selected={activeTab === 'description'}
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
							{#if activeTab === 'description'}
								<span
									class="absolute right-0 -bottom-0.5 left-0 h-[3px] rounded-t-md bg-pine"
									aria-hidden="true"
								></span>
							{/if}
						</button>
						{#if product.specifications}
							<button
								class="relative flex flex-shrink-0 cursor-pointer items-center gap-2 border-none px-6 py-4 font-sans text-[0.9rem] font-semibold whitespace-nowrap transition-all duration-300 {activeTab ===
								'specifications'
									? 'bg-white text-pine-dark'
									: 'bg-transparent text-ink hover:bg-teal/5 hover:text-pine'}"
								onclick={() => (activeTab = 'specifications')}
								role="tab"
								aria-selected={activeTab === 'specifications'}
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
								{#if activeTab === 'specifications'}
									<span
										class="absolute right-0 -bottom-0.5 left-0 h-[3px] rounded-t-md bg-pine"
										aria-hidden="true"
									></span>
								{/if}
							</button>
						{/if}
						{#if product.features && product.features.length > 0}
							<button
								class="relative flex flex-shrink-0 cursor-pointer items-center gap-2 border-none px-6 py-4 font-sans text-[0.9rem] font-semibold whitespace-nowrap transition-all duration-300 {activeTab ===
								'features'
									? 'bg-white text-pine-dark'
									: 'bg-transparent text-ink hover:bg-teal/5 hover:text-pine'}"
								onclick={() => (activeTab = 'features')}
								role="tab"
								aria-selected={activeTab === 'features'}
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
								{#if activeTab === 'features'}
									<span
										class="absolute right-0 -bottom-0.5 left-0 h-[3px] rounded-t-md bg-pine"
										aria-hidden="true"
									></span>
								{/if}
							</button>
						{/if}
						<button
							class="relative flex flex-shrink-0 cursor-pointer items-center gap-2 border-none px-6 py-4 font-sans text-[0.9rem] font-semibold whitespace-nowrap transition-all duration-300 {activeTab ===
							'reviews'
								? 'bg-white text-pine-dark'
								: 'bg-transparent text-ink hover:bg-teal/5 hover:text-pine'}"
							onclick={() => (activeTab = 'reviews')}
							role="tab"
							aria-selected={activeTab === 'reviews'}
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
							{#if activeTab === 'reviews'}
								<span
									class="absolute right-0 -bottom-0.5 left-0 h-[3px] rounded-t-md bg-pine"
									aria-hidden="true"
								></span>
							{/if}
						</button>
					</div>

					<div class="p-9 max-md:p-6">
						{#if activeTab === 'description'}
							{#if product.description}
								<div class="flex gap-5">
									<div
										class="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-xl bg-pine-dark text-paper"
									>
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
									<div>
										<h3 class="m-0 mb-2.5 font-serif text-[1.1rem] font-bold text-ink">
											About this product
										</h3>
										<p class="m-0 text-[0.95rem] leading-[1.8] text-ink-soft">
											{product.description}
										</p>
									</div>
								</div>
							{:else}
								<div
									class="flex flex-col items-center justify-center gap-3 py-8 text-[0.9rem] text-ink-soft/60"
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										width="40"
										height="40"
										stroke-width="1"
										><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg
									>
									<p class="m-0">No description available for this product.</p>
								</div>
							{/if}
						{:else if activeTab === 'specifications' && product.specifications}
							<table class="w-full border-collapse">
								<tbody>
									{#each Object.entries(product.specifications) as [key, value] (key)}
										<tr class="border-b border-line last:border-none">
											<th
												class="w-[38%] bg-paper-2/40 px-5 py-3.5 text-left text-[0.875rem] font-bold text-ink"
											>
												{key}
											</th>
											<td class="px-5 py-3.5 text-[0.875rem] text-ink-soft">{value}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{:else if activeTab === 'features' && product.features && product.features.length > 0}
							<ul class="m-0 grid list-none gap-3 p-0">
								{#each product.features as feature, i (i)}
									<li
										class="flex items-start gap-3.5 rounded-xl border-[1.5px] border-line bg-paper-2/20 px-4 py-3.5 leading-relaxed text-ink-soft transition-colors duration-200 hover:border-teal/40"
									>
										<div
											class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-pine text-[0.75rem] font-bold text-paper"
										>
											{i + 1}
										</div>
										<span>{feature}</span>
									</li>
								{/each}
							</ul>
						{:else if activeTab === 'reviews'}
							<div id="reviews">
								{#if product.rating}
									<div class="mb-8 flex flex-col gap-6 sm:flex-row sm:gap-12">
										<div class="flex-shrink-0 text-center">
											<span class="block font-serif text-[4rem] leading-none font-black text-ink"
												>{product.rating}</span
											>
											<div class="mt-2 flex gap-0.5">
												{#each starItems as i (i)}
													<span
														class="text-[1.4rem] leading-none {i < Math.floor(product.rating || 0)
															? 'text-gold'
															: 'text-line'}">★</span
													>
												{/each}
											</div>
											<span class="mt-1.5 block text-[0.8rem] text-ink-soft"
												>{product.reviews_count || 0} reviews</span
											>
										</div>
										<div class="flex flex-1 flex-col justify-center gap-2">
											{#each [5, 4, 3, 2, 1] as star (star)}
												<div class="flex items-center gap-2.5">
													<span class="w-6 flex-shrink-0 text-[0.78rem] text-ink-soft">{star}★</span
													>
													<div class="h-2 flex-1 overflow-hidden rounded bg-line/60">
														<div
															class="h-full rounded bg-gradient-to-r from-pine to-teal transition-all duration-500"
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
								<div
									class="rounded-2xl border-[1.5px] border-dashed border-pine-dark/30 bg-paper-2/20 p-6 text-center"
								>
									<p class="m-0 mb-3.5 text-[0.9rem] text-ink-soft">
										Share your thoughts with other customers
									</p>
									<a
										href="#reviews"
										class="inline-flex items-center rounded-xl bg-gold px-6 py-2.5 font-bold text-pine-dark shadow-[0_3px_12px_rgba(251,233,186,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(251,233,186,0.5)]"
										>Write a Review</a
									>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- ===== Related Products ===== -->
				{#if relatedProducts.length > 0}
					<div
						class="mt-10 rounded-2xl border border-line bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
					>
						<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
							<div>
								<div class="eyebrow">You may also like</div>
								<h2
									class="m-0 mt-1 font-serif text-[clamp(1.2rem,2vw,1.6rem)] font-bold tracking-[-0.02em] text-pine-dark"
								>
									Related Products
								</h2>
							</div>
						</div>
						<div
							class="grid grid-cols-5 gap-4 max-xl:grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-2"
						>
							{#each relatedProducts as rp (rp.id)}
								<a
									href={resolve(`/product/${rp.seo_slug || rp.slug}/${rp.slug}`)}
									class="group flex flex-col overflow-hidden rounded-xl border-2 border-line bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-teal hover:shadow-[0_14px_32px_rgba(43,109,76,0.15)]"
								>
									<div class="relative aspect-square max-h-[180px] overflow-hidden bg-paper-2">
										<img
											src={getImageUrl(
												rp.primary_image?.image || rp.images?.[0]?.image || rp.image
											)}
											alt={rp.name}
											loading="lazy"
											class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
										/>
										{#if rp.discount_percentage}
											<span
												class="absolute top-2 left-2 rounded-full bg-gold px-2.5 py-0.5 font-mono text-[0.65rem] font-bold text-pine-dark shadow-[0_2px_8px_rgba(251,233,186,0.4)]"
												>-{rp.discount_percentage}%</span
											>
										{/if}
									</div>
									<div class="flex flex-1 flex-col gap-2 p-3.5">
										<h3
											class="m-0 line-clamp-2 text-[0.85rem] leading-[1.4] font-bold text-pine-dark"
										>
											{rp.name}
										</h3>
										<div class="mt-auto flex items-baseline gap-2">
											<span class="font-mono text-[1.05rem] font-bold text-pine-dark">
												{formatPrice(
													rp.sale_price && rp.sale_price < rp.regular_price
														? rp.sale_price
														: rp.regular_price
												)}
											</span>
											{#if rp.sale_price && rp.sale_price < rp.regular_price}
												<span class="font-mono text-[0.82rem] text-ink-soft line-through">
													{formatPrice(rp.regular_price)}
												</span>
											{/if}
										</div>
									</div>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</section>

		<!-- Lightbox -->
		{#if isLightboxOpen}
			<div
				class="fixed inset-0 z-[9999] flex animate-[fadeIn_0.25s_ease] items-center justify-center bg-pine-dark/90 backdrop-blur-md"
				onclick={() => (isLightboxOpen = false)}
				onkeydown={(e) => e.key === 'Escape' && (isLightboxOpen = false)}
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<div
					class="relative flex h-[90vh] w-[90vw] max-w-[1200px] items-center justify-center"
					onclick={(e) => e.stopPropagation()}
					role="presentation"
				>
					<button
						class="absolute -top-2 -right-2 z-10 flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-full border-[1.5px] border-paper/25 bg-white/10 text-paper backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:rotate-90 hover:bg-white/20"
						onclick={() => (isLightboxOpen = false)}
						aria-label="Close"
					>
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
							class="absolute top-1/2 left-5 z-10 flex h-[52px] w-[52px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-paper/25 bg-white/10 text-paper backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20 max-sm:hidden"
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
							class="absolute top-1/2 right-5 z-10 flex h-[52px] w-[52px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-paper/25 bg-white/10 text-paper backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20 max-sm:hidden"
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
					<div class="flex max-h-full max-w-full items-center justify-center">
						{#if activeImages()[selectedImageIndex]}
							<img
								src={getImageUrl(activeImages()[selectedImageIndex].image)}
								alt={activeImages()[selectedImageIndex].alt_text || product.name}
								class="max-h-[80vh] max-w-full rounded-xl object-contain shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
							/>
						{/if}
					</div>
					{#if activeImages().length > 1}
						<div
							class="absolute -bottom-12 left-1/2 -translate-x-1/2 rounded-full border-[1.5px] border-paper/20 bg-white/10 px-5 py-2 font-mono text-[0.85rem] font-bold text-paper backdrop-blur-sm"
						>
							{selectedImageIndex + 1} / {activeImages().length}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
