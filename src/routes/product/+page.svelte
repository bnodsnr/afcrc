<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';

	let selectedColor = $state('pink');
	let selectedSize = $state('M');
	let quantity = $state(1);
	let selectedImage = $state(0);

	const product = {
		name: 'Basic hooded sweatshirt in pink',
		price: '$16.99',
		originalPrice: '$24.99',
		discount: '32%',
		rating: 4.5,
		reviewCount: 128,
		colors: [
			{ name: 'Pink', value: 'pink', color: '#F8BBD9' },
			{ name: 'Beige', value: 'beige', color: '#F5F5DC' },
			{ name: 'White', value: 'white', color: '#FFFFFF' },
			{ name: 'Light Pink', value: 'light-pink', color: '#FFB6C1' },
			{ name: 'Gray', value: 'gray', color: '#D3D3D3' }
		],
		sizes: ['XS', 'S', 'M', 'L', 'XL'],
		images: [
			'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop&crop=center',
			'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop&crop=left',
			'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop&crop=right',
			'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop&crop=top'
		],
		description:
			'Comfortable and stylish basic hooded sweatshirt made from premium hemp blend fabric. Perfect for casual wear and layering.',
		features: [
			'100% organic hemp cotton blend',
			'Adjustable drawstring hood',
			'Kangaroo front pocket',
			'Ribbed cuffs and hem',
			'Machine washable'
		]
	};

	const relatedProducts = [
		{
			id: 1,
			name: 'Hemp Casual T-Shirt',
			price: '$12.99',
			originalPrice: '$18.99',
			discount: 32,
			rating: 4.3,
			reviews: 89,
			image:
				'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop&crop=center'
		},
		{
			id: 2,
			name: 'Organic Hemp Pants',
			price: '$24.99',
			originalPrice: '$35.99',
			discount: 31,
			rating: 4.6,
			reviews: 156,
			image:
				'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&crop=center'
		},
		{
			id: 3,
			name: 'Hemp Fiber Jacket',
			price: '$34.99',
			originalPrice: '$49.99',
			discount: 30,
			rating: 4.4,
			reviews: 203,
			image:
				'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&h=500&fit=crop&crop=center'
		}
	];

	function changeQuantity(delta: number) {
		quantity = Math.max(1, quantity + delta);
	}

	function selectImage(index: number) {
		selectedImage = index;
	}
</script>

<svelte:head>
	<title>{product.name} - Hemp Store</title>
</svelte:head>

<main class="product-page">
	<div class="container">
		<!-- Breadcrumb -->
		<nav class="breadcrumb">
			<a href="/">Home</a>
			<span>/</span>
			<a href="/collections">Collections</a>
			<span>/</span>
			<span class="current">Basic hooded sweatshirt in pink</span>
		</nav>

		<div class="product-layout">
			<!-- Product Images -->
			<div class="product-images">
				<div class="main-image">
					<img src={product.images[selectedImage]} alt={product.name} />
					<div class="discount-badge">{product.discount} OFF</div>
				</div>

				<div class="thumbnail-grid">
					{#each product.images as image, index}
						<button
							class="thumbnail {selectedImage === index ? 'active' : ''}"
							onclick={() => selectImage(index)}
						>
							<img src={image} alt="Product view {index + 1}" />
						</button>
					{/each}
				</div>
			</div>

			<!-- Product Details -->
			<div class="product-details">
				<h1 class="product-title">{product.name}</h1>

				<!-- Price and Rating -->
				<div class="price-rating">
					<div class="price-section">
						<span class="current-price">{product.price}</span>
						<span class="original-price">{product.originalPrice}</span>
						<span class="discount">Save {product.discount}</span>
					</div>
					<div class="rating">
						<div class="stars">
							{#each Array(5) as _, i}
								<span class="star {i < Math.floor(product.rating) ? 'filled' : ''}">★</span>
							{/each}
						</div>
						<span class="rating-text">{product.rating}</span>
						<span class="review-count">({product.reviewCount} reviews)</span>
					</div>
				</div>

				<!-- Color Selection -->
				<div class="option-group">
					<label class="option-label">Color</label>
					<div class="color-options">
						{#each product.colors as color}
							<button
								class="color-option {selectedColor === color.value ? 'selected' : ''}"
								style="background-color: {color.color}"
								onclick={() => (selectedColor = color.value)}
								title={color.name}
							></button>
						{/each}
					</div>
				</div>

				<!-- Size Selection -->
				<div class="option-group">
					<label class="option-label">Size</label>
					<div class="size-options">
						{#each product.sizes as size}
							<button
								class="size-option {selectedSize === size ? 'selected' : ''}"
								onclick={() => (selectedSize = size)}
							>
								{size}
							</button>
						{/each}
					</div>
				</div>

				<!-- Quantity and Add to Cart -->
				<div class="purchase-section">
					<div class="quantity-selector">
						<button onclick={() => changeQuantity(-1)}>-</button>
						<span class="quantity">{quantity}</span>
						<button onclick={() => changeQuantity(1)}>+</button>
					</div>

					<button class="add-to-cart">Add to cart</button>
					<button class="buy-now">Buy now</button>
				</div>

				<!-- Product Info -->
				<div class="product-info">
					<div class="info-item">
						<span class="label">Product details</span>
						<p class="description">{product.description}</p>
					</div>

					<div class="info-item">
						<span class="label">Features</span>
						<ul class="features-list">
							{#each product.features as feature}
								<li>{feature}</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>

<!-- Related Products Section -->
<section class="related-products">
	<div class="container">
		<h2 class="section-title">Related Products</h2>
		<div class="products-grid">
			{#each relatedProducts as product, index}
				<div class="product-card">
					<div class="product-image">
						<img src={product.image} alt={product.name} />
						<div class="product-badge">{product.discount}% OFF</div>
						<div class="product-overlay">
							<button class="quick-view-btn">Quick View</button>
						</div>
					</div>
					<div class="product-info">
						<h3 class="product-name">{product.name}</h3>
						<div class="product-rating">
							{#each Array(5) as _, i}
								<span class="star {i < Math.floor(product.rating) ? 'filled' : ''}">★</span>
							{/each}
							<span class="rating-count">({product.reviews})</span>
						</div>
						<div class="product-pricing">
							<span class="current-price">{product.price}</span>
							{#if product.originalPrice}
								<span class="original-price">{product.originalPrice}</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<Footer />

<style>
	.product-page {
		background: #fafafa;
		min-height: 100vh;
		padding: 20px 0;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}

	/* Breadcrumb */
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 30px;
		font-size: 14px;
		color: #666;
	}

	.breadcrumb a {
		color: #007bff;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.breadcrumb .current {
		color: #333;
		font-weight: 500;
	}

	/* Product Layout */
	.product-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 60px;
		background: white;
		padding: 40px;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	/* Product Images */
	.product-images {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.main-image {
		position: relative;
		width: 100%;
		aspect-ratio: 3/4;
		border-radius: 12px;
		overflow: hidden;
		background: #f8f8f8;
	}

	.main-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.discount-badge {
		position: absolute;
		top: 16px;
		left: 16px;
		background: #ff4444;
		color: white;
		padding: 6px 12px;
		border-radius: 16px;
		font-size: 12px;
		font-weight: 600;
	}

	.thumbnail-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}

	.thumbnail {
		width: 100%;
		aspect-ratio: 1;
		border: 2px solid transparent;
		border-radius: 8px;
		overflow: hidden;
		background: none;
		cursor: pointer;
		transition: border-color 0.2s ease;
	}

	.thumbnail:hover {
		border-color: #ddd;
	}

	.thumbnail.active {
		border-color: #007bff;
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Product Details */
	.product-details {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.product-title {
		font-size: 28px;
		font-weight: 600;
		color: #333;
		margin: 0;
		line-height: 1.3;
	}

	/* Price and Rating */
	.price-rating {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.price-section {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.current-price {
		font-size: 24px;
		font-weight: 700;
		color: #ff4444;
	}

	.original-price {
		font-size: 18px;
		color: #999;
		text-decoration: line-through;
	}

	.discount {
		background: #ff4444;
		color: white;
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
	}

	.rating {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.stars {
		display: flex;
		gap: 2px;
	}

	.star {
		color: #ddd;
		font-size: 16px;
	}

	.star.filled {
		color: #ffc107;
	}

	.rating-text {
		font-weight: 600;
		color: #333;
	}

	.review-count {
		color: #666;
		font-size: 14px;
	}

	/* Options */
	.option-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.option-label {
		font-weight: 600;
		color: #333;
		font-size: 16px;
	}

	.color-options {
		display: flex;
		gap: 12px;
	}

	.color-option {
		width: 40px;
		height: 40px;
		border: 3px solid transparent;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
	}

	.color-option:hover {
		transform: scale(1.1);
	}

	.color-option.selected {
		border-color: #007bff;
		box-shadow:
			0 0 0 2px white,
			0 0 0 4px #007bff;
	}

	.size-options {
		display: flex;
		gap: 8px;
	}

	.size-option {
		padding: 8px 16px;
		border: 2px solid #ddd;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.size-option:hover {
		border-color: #007bff;
	}

	.size-option.selected {
		border-color: #007bff;
		background: #007bff;
		color: white;
	}

	/* Purchase Section */
	.purchase-section {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.quantity-selector {
		display: flex;
		align-items: center;
		border: 2px solid #ddd;
		border-radius: 6px;
		overflow: hidden;
	}

	.quantity-selector button {
		width: 40px;
		height: 40px;
		border: none;
		background: #f8f8f8;
		cursor: pointer;
		font-size: 18px;
		font-weight: 600;
		transition: background 0.2s ease;
	}

	.quantity-selector button:hover {
		background: #e8e8e8;
	}

	.quantity {
		width: 60px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		background: white;
	}

	.add-to-cart {
		flex: 1;
		background: #28a745;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.add-to-cart:hover {
		background: #218838;
	}

	.buy-now {
		background: #007bff;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.buy-now:hover {
		background: #0056b3;
	}

	/* Product Info */
	.product-info {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding-top: 20px;
		border-top: 1px solid #eee;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.info-item .label {
		font-weight: 600;
		color: #333;
	}

	.description {
		color: #666;
		line-height: 1.6;
		margin: 0;
	}

	.features-list {
		margin: 0;
		padding-left: 20px;
		color: #666;
	}

	.features-list li {
		margin-bottom: 4px;
	}

	/* Payment Methods */
	.payment-methods {
		display: flex;
		gap: 12px;
		align-items: center;
		padding-top: 20px;
		border-top: 1px solid #eee;
	}

	.payment-methods img {
		height: 24px;
		opacity: 0.7;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.product-layout {
			grid-template-columns: 1fr;
			gap: 30px;
			padding: 20px;
		}

		.product-title {
			font-size: 24px;
		}

		.purchase-section {
			flex-direction: column;
			align-items: stretch;
		}

		.quantity-selector {
			align-self: flex-start;
		}
	}

	/* Related Products Section */
	.related-products {
		background: #f8fffe;
		padding: 60px 0;
		margin-top: 0;
	}

	.related-products .container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
	}

	.related-products .section-title {
		text-align: center;
		font-size: 32px;
		font-weight: 700;
		color: #09240f;
		margin-bottom: 40px;
		position: relative;
	}

	.related-products .section-title::after {
		content: '';
		position: absolute;
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
		width: 60px;
		height: 3px;
		background: linear-gradient(90deg, #059669, #00d4aa);
		border-radius: 2px;
	}

	.products-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 30px;
	}

	.product-card {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		position: relative;
	}

	.product-card:hover {
		transform: translateY(-8px);
		box-shadow: 0 8px 30px rgba(5, 150, 105, 0.15);
	}

	.product-image {
		position: relative;
		aspect-ratio: 4/5;
		overflow: hidden;
	}

	.product-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.product-card:hover .product-image img {
		transform: scale(1.05);
	}

	.product-badge {
		position: absolute;
		top: 12px;
		right: 12px;
		background: #dc2626;
		color: white;
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		z-index: 2;
	}

	.product-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: all 0.3s ease;
	}

	.product-card:hover .product-overlay {
		opacity: 1;
	}

	.quick-view-btn {
		background: white;
		color: #09240f;
		border: none;
		padding: 10px 20px;
		border-radius: 25px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		transform: translateY(10px);
	}

	.product-card:hover .quick-view-btn {
		transform: translateY(0);
	}

	.quick-view-btn:hover {
		background: #059669;
		color: white;
	}

	.product-info {
		padding: 20px;
	}

	.product-name {
		font-size: 16px;
		font-weight: 600;
		color: #09240f;
		margin-bottom: 8px;
		line-height: 1.3;
	}

	.product-rating {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-bottom: 12px;
	}

	.star {
		color: #ddd;
		font-size: 14px;
	}

	.star.filled {
		color: #fbbf24;
	}

	.rating-count {
		font-size: 12px;
		color: #6b7280;
		margin-left: 4px;
	}

	.product-pricing {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 16px;
	}

	.current-price {
		font-size: 18px;
		font-weight: 700;
		color: #059669;
	}

	.original-price {
		font-size: 14px;
		color: #9ca3af;
		text-decoration: line-through;
	}

	.add-to-cart-btn {
		width: 100%;
		background: #059669;
		color: white;
		border: none;
		padding: 12px 16px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.add-to-cart-btn:hover {
		background: #047857;
		transform: translateY(-1px);
	}

	.add-to-cart-btn svg {
		width: 18px;
		height: 18px;
	}

	/* Responsive for Related Products */
	@media (max-width: 768px) {
		.related-products {
			padding: 40px 0;
		}

		.related-products .container {
			padding: 0 16px;
		}

		.related-products .section-title {
			font-size: 26px;
			margin-bottom: 30px;
		}

		.products-grid {
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 20px;
		}

		.product-info {
			padding: 16px;
		}
	}
</style>
