<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { enhance, deserialize } from '$app/forms';
	import { base } from '$lib/admin/paths';
	import { goto } from '$app/navigation';

	interface mainImage {
		file: File;
		alt_text: string;
		is_primary: boolean;
		color: string;
	}

	interface GalleryImage {
		file: File;
		alt_text: string;
		is_primary: boolean;
		color: string;
	}

	let { data } = $props();
	let categories = $state(data.categories || []);
	let subcategories = $state<any[]>([]);
	let subcategoriesLoading = $state(false);
	let isSubmitting = $state(false);
	let loading = $state(false);
	// Product form data
	let product: any = $state({
		// Basic Information
		name: '',
		vendor: '',
		description: '',
		shortDescription: '',
		productType: 'None',
		// Pricing
		regularPrice: '',
		salePrice: '',

		// Inventory & Stock
		manageStock: true,
		stockQuantity: '',
		stockStatus: 'instock', // instock, outofstock, onbackorder
		allowBackorders: 'no', // no, notify, yes
		lowStockThreshold: '',

		// Shipping
		weight: '',
		dimensions: {
			length: '',
			width: '',
			height: ''
		},
		colors: [], // Array of { name, hex_code }
		shippingClass: '',
		size: [],
		// Categories & Tags
		category: '',
		subcategory: '',
		tags: [],
		mainImage: null, // Images
		mainImageAlt: '',
		mainImageColor: '',

		galleryImages: [], // Array of { file, alt_text, is_primary, color }

		// Reviews & Ratings
		reviewsEnabled: true,

		// Status & Visibility
		status: 'publish', // draft, pending, publish
		featured: false,
		catalogVisibility: 'visible', // visible, catalog, search, hidden

		// SEO
		metaTitle: '',
		metaDescription: '',
		canonicalUrl: ''
	});

	// Toast notifications
	interface Toast {
		id: number;
		message: string;
		type: 'success' | 'error' | 'info';
	}
	let toasts = $state<Toast[]>([]);

	function addToast(message: string, type: Toast['type'] = 'info') {
		const id = Date.now();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 3000);
	}

	// Available tags
	let availableTags = ['None', 'Trending', 'Flash Sales', 'New Arrival', 'Best Seller'];

	// Product attributes for variations
	let globalAttributes = [
		{ name: 'Color', options: ['Red', 'Blue', 'Green', 'Black', 'White'] },
		{ name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
		{ name: 'Material', options: ['Cotton', 'Polyester', 'Wool', 'Silk'] }
	];

	let mainImageInput: HTMLInputElement;

	let galleryImageInput: HTMLInputElement;

	// Shipping details visibility toggle
	let showShippingDetails = false;

	// Available sizes
	let availableSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
	let selectedSizes: string[] = [];

	function handleMainImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			product.mainImage = target.files[0];
		}
	}

	function handleGalleryImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			Array.from(target.files).forEach((file: File) => {
				product.galleryImages = [
					...product.galleryImages,
					{
						file,
						alt_text: '',
						is_primary: false,
						color: ''
					}
				];
			});
			product = product;
		}
	}

	function addNewGalleryField() {
		product.galleryImages = [
			...product.galleryImages,
			{
				file: null,
				alt_text: '',
				color: '',
				is_primary: false
			}
		];
		product = product;
	}
	function removeGalleryImage(index: number) {
		product.galleryImages.splice(index, 1);
		product = product;
	}
	function addTag(tagId: number) {
		if (!product.tags.includes(tagId)) {
			product.tags.push(tagId);
			product = product;
		}
	}

	function removeTag(tagId: number) {
		product.tags = product.tags.filter((id: number) => id !== tagId);
	}

	async function loadSubcategories(event) {
		const categoryId = event.target.value;

		subcategories = [];
		product.subcategory = '';

		if (!categoryId) return;

		subcategoriesLoading = true;

		try {
			const formData = new FormData();
			formData.append('categoryId', categoryId);

			const response = await fetch('?/fetchSubcategories', {
				method: 'POST',
				body: formData,
				headers: {
					'x-sveltekit-action': 'true' // 👈 required header
				}
			});

			// SvelteKit actions return devalue-encoded text, not plain JSON.
			const text = await response.text();
			const result = deserialize(text);

			if (result.type === 'success' && result.data?.subcategories) {
				subcategories = result.data.subcategories;
			} else {
				subcategories = [];
			}
		} catch (error) {
			console.error('Error loading subcategories:', error);
			subcategories = [];
		} finally {
			subcategoriesLoading = false;
		}
	}

	// Initialize form
	onMount(() => {
		// Load any existing product data or set defaults
	});

	async function handleSubmit(event: any) {
		isSubmitting = true;
		const formData = new FormData();

		// BASIC INFORMATION
		formData.append('name', product.name || '');
		formData.append('vendor', product.vendor || '');
		formData.append('description', product.description || '');
		formData.append('product_type', product.productType || 'None');
		formData.append('shortDescription', product.shortDescription || '');

		// PRICING
		formData.append('regularPrice', product.regularPrice || '0');
		formData.append('salePrice', product.salePrice || '');

		// CATEGORIES
		formData.append('category', product.category || '');
		formData.append('subCategory', product.subcategory || '');

		// STATUS & VISIBILITY
		formData.append('featured', product.featured ? 'on' : 'off');
		formData.append('catalogVisibility', product.catalogVisibility || 'visible');
		formData.append('status', product.status || 'draft');
		formData.append('reviewsEnabled', product.reviewsEnabled ? 'on' : 'off');

		// SHIPPING & DIMENSIONS
		formData.append('weight', product.weight || '');
		formData.append('length', product.dimensions?.length || '');
		formData.append('width', product.dimensions?.width || '');
		formData.append('height', product.dimensions?.height || '');
		formData.append('shippingClass', product.shippingClass || '');

		// INVENTORY & STOCK
		formData.append('manageStock', product.manageStock ? 'on' : 'off');
		formData.append('stockQuantity', product.stockQuantity || '0');
		formData.append('lowStockThreshold', product.lowStockThreshold || '');
		formData.append('stockStatus', product.stockStatus || 'instock');
		formData.append('allowBackorders', product.allowBackorders === 'yes' ? 'on' : 'off');

		// SEO
		formData.append('metaTitle', product.metaTitle || '');
		formData.append('metaDescription', product.metaDescription || '');
		formData.append('canonicalUrl', product.canonicalUrl || '');

		if (product.mainImage && product.mainImage instanceof File) {
			formData.append('mainImage', product.mainImage);
			formData.append('mainImageAlt', product.mainImageAlt || '');
			formData.append('mainImageColor', product.mainImageColor || '');
		}

		// GALLERY IMAGES WITH METADATA
		formData.append('galleryImageCount', String(product.galleryImages.length));

		const galleryMetadata: Array<{
			alt_text: string;
			is_primary: boolean;
			color: string;
		}> = [];

		product.galleryImages.forEach((img: GalleryImage, idx: number) => {
			if (img.file && img.file instanceof File) {
				formData.append(`galleryImage_${idx}`, img.file);

				galleryMetadata.push({
					alt_text: img.alt_text || '',
					is_primary: img.is_primary || false,
					color: img.color || ''
				});
			}
		});

		// Add gallery metadata as single JSON field
		if (galleryMetadata.length > 0) {
			formData.append('gallery_metadata', JSON.stringify(galleryMetadata));
		}

		// SIZES (Array of selected size strings)
		if (selectedSizes && selectedSizes.length > 0) {
			formData.append('sizesCount', String(selectedSizes.length));
			selectedSizes.forEach((size: string, idx: number) => {
				formData.append(`sizeName_${idx}`, size);
			});
		}

		// LOG FORM DATA FOR DEBUGGING
		console.log('=== FORM SUBMISSION DEBUG ===');
		console.log('Product Object:', product);
		console.log('Selected Sizes:', selectedSizes);
		console.log('FormData Contents:');
		for (const [key, value] of formData.entries()) {
			console.log(`  ${key}:`, value instanceof File ? `File: ${value.name}` : value);
		}

		try {
			const response = await fetch('?/createProduct', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				console.error('Error creating product:', result);
				addToast(result.message || 'Failed to create product', 'error');
			} else {
				addToast('Product created successfully!', 'success');
				await new Promise((resolve) => setTimeout(resolve, 1500));
				window.location.href = `${base}/products`;
			}
		} catch (error) {
			console.error('Error:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen">
	<div class="mx-auto max-w-7xl">
		<!-- Breadcrumb Navigation -->
		<div class="mb-6 flex items-center gap-2 text-sm">
			<a href={base} class="link font-medium text-primary link-hover">Dashboard</a>
			<svg
				class="h-4 w-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<a href={base + '/products'} class="link font-medium text-primary link-hover">Products</a>
			<svg
				class="h-4 w-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Add New Product</span>
		</div>
		<!-- Page Header -->
		<div class="mb-8">
			<h4 class="text-3xl font-bold">Create New Product</h4>
			<p class="mt-1">Complete the form below to add a new product to your store</p>
		</div>

		<form
			method="POST"
			enctype="multipart/form-data"
			action="?/createProduct"
			use:enhance={() => {
				loading = true;

				return async ({ result }) => {
					if (result.type === 'success') {
						addToast('Product created successfully!', 'success');

						// optional delay for toast visibility
						await new Promise((resolve) => setTimeout(resolve, 1500));

						await goto(`${base}/products`);
					} else if (result.type === 'failure') {
						addToast('Failed to create product', 'error');
						loading = false;
					} else if (result.type === 'error') {
						addToast('Something went wrong', 'error');
						loading = false;
					}
				};
			}}
		>
			<!-- Two Column Form Layout -->
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<!-- Left Column (Main Content) -->
				<div class="space-y-6 lg:col-span-2">
					<!-- General Information -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							General Information
						</h2>

						<div class="space-y-4">
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="form-control">
									<label class="label" for="name">
										<span class="label-text font-medium">Product Name</span>
									</label>
									<input
										id="name"
										type="text"
										name="name"
										class="input-bordered input w-full"
										bind:value={product.name}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="vendor">
										<span class="label-text font-medium">Vendor</span>
									</label>
									<select
										id="vendor"
										name="vendor"
										class="select-bordered select w-full"
										bind:value={product.vendor}
									>
										<option value="Royal Hemp">Royal Hemp</option>
										<option value="Ganesh Hemp">Ganesh Hemp</option>
									</select>
								</div>
							</div>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="form-control">
									<label class="label" for="category">
										<span class="label-text font-medium">Category</span>
									</label>
									<select
										id="category"
										class="select-bordered select w-full"
										name="category"
										onchange={(e) => {
											product.category = e.currentTarget.value;
											loadSubcategories(e);
										}}
									>
										<option value="">Select a category</option>
										{#each categories as category}
											<option value={category.id}>{category.name}</option>
										{/each}
									</select>
								</div>
								<div class="form-control">
									<label class="label" for="subCategory">
										<span class="label-text font-medium">Sub Category</span>
									</label>
									{#key subcategories}
										<select
											id="subCategory"
											class="select-bordered select w-full"
											bind:value={product.subcategory}
											name="subCategory"
											disabled={subcategoriesLoading || subcategories.length === 0}
										>
											<option value="">
												{subcategoriesLoading
													? 'Loading...'
													: subcategories.length === 0
														? 'Select a category first'
														: 'Select a subcategory'}
											</option>
											{#each subcategories as subcategory}
												<option value={subcategory.id}>{subcategory.name}</option>
											{/each}
										</select>
									{/key}
								</div>
							</div>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="form-control">
									<label class="label" for="regularPrice">
										<span class="label-text font-medium">Regular Price ($)</span>
									</label>
									<input
										id="regularPrice"
										type="number"
										name="regular_price"
										class="input-bordered input w-full"
										bind:value={product.regularPrice}
										placeholder="0.00"
										step="0.01"
									/>
								</div>
								<div class="form-control">
									<label class="label" for="salePrice">
										<span class="label-text font-medium">Sale Price ($)</span>
									</label>
									<input
										id="salePrice"
										type="number"
										name="sales_price"
										class="input-bordered input w-full"
										bind:value={product.salePrice}
										placeholder="0.00"
										step="0.01"
									/>
								</div>
							</div>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="form-control">
									<label class="label" for="shortDesc">
										<span class="label-text font-medium">Short Description</span>
									</label>
									<textarea
										id="shortDesc"
										name="shortDescription"
										class="textarea-bordered textarea h-20 w-full"
										bind:value={product.shortDescription}
										placeholder="Brief product description"
									></textarea>
								</div>

								<div class="form-control">
									<label class="label" for="fullDesc">
										<span class="label-text font-medium">Full Description</span>
									</label>
									<textarea
										id="fullDesc"
										name="description"
										class="textarea-bordered textarea h-20 w-full"
										bind:value={product.description}
										placeholder="Detailed product description"
									></textarea>
								</div>
							</div>
						</div>
					</div>

					<!-- Inventory & Stock Management -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
								/>
							</svg>
							Inventory & Stock Management
						</h2>

						<div class="space-y-4">
							<div class="form-control">
								<label class="label cursor-pointer justify-start gap-2">
									<input
										type="checkbox"
										name="manage_stock"
										class="checkbox"
										bind:checked={product.manageStock}
									/>
									<span class="label-text font-medium">Track quantity for this product</span>
								</label>
							</div>

							{#if product.manageStock}
								<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div class="form-control">
										<label class="label" for="stockQty">
											<span class="label-text">Stock Quantity</span>
										</label>
										<input
											id="stockQty"
											type="number"
											name="stockQuantity"
											class="input-bordered input w-full"
											bind:value={product.stockQuantity}
											placeholder="0"
											min="0"
										/>
									</div>
									<div class="form-control">
										<label class="label" for="lowStock">
											<span class="label-text">Low Stock Threshold</span>
										</label>
										<input
											id="lowStock"
											type="number"
											name="lowStockThreshold"
											class="input-bordered input w-full"
											bind:value={product.lowStockThreshold}
											placeholder="2"
											min="0"
										/>
									</div>
								</div>
							{/if}

							<div class="form-control">
								<label class="label" for="stockStatus">
									<span class="label-text font-medium">Stock Status</span>
								</label>
								<select
									id="stockStatus"
									class="select-bordered select w-full"
									name="stockStatus"
									bind:value={product.stockStatus}
								>
									<option value="instock">In Stock</option>
									<option value="outofstock">Out of Stock</option>
									<option value="onbackorder">On Backorder</option>
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="backorders">
									<span class="label-text font-medium">Allow Backorders</span>
								</label>
								<select
									id="backorders"
									class="select-bordered select w-full"
									name="allowBackorders"
									bind:value={product.allowBackorders}
								>
									<option value="no">Do not allow</option>
									<option value="notify">Allow, but notify customer</option>
									<option value="yes">Allow</option>
								</select>
							</div>
						</div>
					</div>
					<!-- Product Images -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							Product Images & Gallery
						</h2>

						<div class="space-y-6">
							<!-- Gallery Images -->
							<div>
								<label class="label">
									<span class="label-text font-medium">Product Gallery</span>
								</label>
								<div class="space-y-6">
									<div class="card border-2 border-base-300 bg-base-100 p-6">
										<div class="space-y-4">
											<div>
												<label class="label" for="main-file">
													<span class="label-text font-medium">Main (Feature) Image</span>
												</label>
												<div
													class="rounded-lg border-2 border-dashed border-base-300 p-6 text-center"
												>
													{#if product.mainImage}
														<div class="relative inline-block">
															<img
																src={URL.createObjectURL(product.mainImage)}
																alt="Main Image Preview"
																class="mx-auto max-h-48 max-w-xs rounded-lg object-contain"
															/>
															<button
																type="button"
																class="btn absolute -top-2 -right-2 btn-circle btn-sm btn-error"
																onclick={() => {
																	product.mainImage = null;
																	product = product;
																}}
															>
																×
															</button>
														</div>
													{:else}
														<div class="text-base-content/60">
															<svg
																class="mx-auto mb-2 h-10 w-10"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 48 48"
															>
																<path
																	d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
																	stroke-width="2"
																	stroke-linecap="round"
																	stroke-linejoin="round"
																/>
															</svg>
															<p class="text-sm">Click to select main image</p>
														</div>
													{/if}

													<input
														id="main-image-file"
														type="file"
														class="hidden"
														name="mainImage"
														accept="image/*"
														onchange={(e: Event) => {
															const target = e.target as HTMLInputElement;
															if (target.files && target.files[0]) {
																product.mainImage = target.files[0];
																product = product;
															}
														}}
													/>
													<button
														type="button"
														class="btn mt-3 btn-sm btn-primary"
														onclick={(e) => {
															const input = (e.target as HTMLElement)
																.closest('.border-dashed')
																?.querySelector('input[type="file"]') as HTMLInputElement;
															input?.click();
														}}
													>
														{product.mainImage ? 'Change Image' : 'Select Image'}
													</button>
												</div>
											</div>

											<div class="form-control">
												<label class="label" for="main-alt-text">
													<span class="label-text text-sm font-medium">Main Image Alt Text</span>
												</label>
												<textarea
													id="main-alt-text"
													class="textarea-bordered textarea w-full textarea-sm"
													bind:value={product.mainImageAlt}
													name="mainImageAlt"
													placeholder="Descriptive text for primary image accessibility (SEO)"
													rows="2"
												></textarea>
											</div>

											<div class="form-control">
												<label class="label" for="main-color">
													<span class="label-text text-sm font-medium">Main Product Color</span>
												</label>
												<div class="flex gap-2">
													<input
														id="main-color"
														type="text"
														name="mainImageColor"
														class="input-bordered input input-sm flex-grow"
														bind:value={product.mainImageColor}
														placeholder="e.g., Red, Blue, Default"
													/>
													<input
														type="color"
														class="input-bordered input input-sm w-14 cursor-pointer"
														bind:value={product.mainImageColor}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Right Column (Sidebar) -->
				<div class="space-y-6 lg:col-span-1">
					<!-- Publish Settings & Status -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-7"
								/>
							</svg>
							Publish
						</h2>

						<div class="space-y-4">
							<div class="form-control">
								<label class="label" for="status">
									<span class="label-text text-sm font-medium">Status</span>
								</label>
								<select
									id="status"
									class="select-bordered select w-full select-sm"
									bind:value={product.status}
									name="status"
								>
									<option value="draft">Draft</option>
									<option value="pending">Pending Review</option>
									<option value="published" selected>Published</option>
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="visibility">
									<span class="label-text text-sm font-medium">Visibility</span>
								</label>
								<select
									id="visibility"
									class="select-bordered select w-full select-sm"
									bind:value={product.catalogVisibility}
									name="visibility"
								>
									<option value="visible">Shop & search</option>
									<option value="catalog">Shop only</option>
									<option value="search">Search only</option>
									<option value="hidden">Hidden</option>
								</select>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer justify-start gap-2">
									<input
										type="checkbox"
										class="checkbox checkbox-sm"
										name="featured"
										bind:checked={product.featured}
									/>
									<span class="label-text text-sm font-medium">Featured product</span>
								</label>
							</div>
						</div>
					</div>

					<!-- Available Sizes -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
								/>
							</svg>
							Available Sizes
						</h2>

						<div class="space-y-2">
							{#each availableSizes as size}
								<label class="label cursor-pointer justify-start gap-2 py-1">
									<input
										type="checkbox"
										name="size"
										value={size}
										class="checkbox checkbox-sm checkbox-info"
										checked={selectedSizes.includes(size)}
										onchange={(e: Event) => {
											const target = e.target as HTMLInputElement;
											if (target.checked) {
												selectedSizes = [...selectedSizes, size];
											} else {
												selectedSizes = selectedSizes.filter((s) => s !== size);
											}
										}}
									/>
									<span class="label-text p-1 text-sm font-medium"> {size}</span>
								</label>
							{/each}
						</div>

						{#if selectedSizes.length > 0}
							<div class="mt-3 rounded-lg border border-base-300 p-2">
								<div class="mb-2 text-xs font-bold uppercase opacity-70">Selected Sizes:</div>
								<div class="flex flex-wrap gap-2">
									{#each selectedSizes as size}
										<span class="badge badge-sm badge-info">{size}</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- Tags -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
								/>
							</svg>
							Tags
						</h2>
						<div class="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-base-300 p-3">
							{#each availableTags as tag}
								<label class="label cursor-pointer justify-start gap-2 px-1 py-1">
									<input
										type="radio"
										name="productType"
										class="radio radio-sm radio-warning"
										value={tag}
										onchange={(e: Event) => {
											const target = e.target as HTMLInputElement;
											if (target.checked) {
												addTag(tag);
											}
										}}
									/>
									<span class="label-text text-sm">{tag}</span>
								</label>
							{/each}
						</div>
						{#if product.tags.length > 0}
							<div class="mt-3 rounded-lg border border-base-300 p-2">
								<div class="mb-2 text-xs font-bold uppercase opacity-70">Selected:</div>
								<div class="flex flex-wrap gap-1">
									{#each product.tags as tagId}
										{@const tag = availableTags.find((t) => t.id === tagId)}
										{#if tag}
											<span class="badge badge-sm badge-warning">{tag.name}</span>
										{/if}
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- SEO Settings -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							SEO
						</h2>

						<div class="space-y-4">
							<div class="form-control">
								<label class="label" for="metaTitle">
									<span class="label-text text-sm font-medium">Meta Title</span>
								</label>
								<input
									id="metaTitle"
									type="text"
									class="input-bordered input input-sm w-full"
									bind:value={product.metaTitle}
									placeholder="SEO title"
								/>
							</div>

							<div class="form-control">
								<label class="label" for="metaDesc">
									<span class="label-text text-sm font-medium">Meta Description</span>
								</label>
								<textarea
									id="metaDesc"
									class="textarea-bordered textarea h-16 textarea-sm"
									bind:value={product.metaDescription}
									placeholder="SEO description"
								></textarea>
							</div>
							<div class="form-control">
								<label class="label" for="canonicalUrl">
									<span class="label-text text-sm font-medium">Canonical Url</span>
								</label>
								<input
									id="canonicalUrl"
									type="text"
									name="canonicalUrl"
									class="input-bordered input input-sm w-full"
									bind:value={product.canonicalUrl}
									placeholder="Canonical URL for SEO"
								/>
							</div>
						</div>
					</div>
					<!-- Shipping Information -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
								/>
							</svg>
							Shipping Information
						</h2>

						<div class="space-y-4">
							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text font-medium">Show Shipping Details</span>
									<input type="checkbox" class="checkbox" bind:checked={showShippingDetails} />
								</label>
							</div>

							{#if showShippingDetails}
								<div class="space-y-4">
									<div class="form-control">
										<label class="label" for="weight">
											<span class="label-text font-medium">Weight (kg)</span>
										</label>
										<input
											id="weight"
											type="number"
											class="input-bordered input w-full"
											bind:value={product.weight}
											placeholder="0"
											step="0.01"
										/>
									</div>

									<div>
										<label class="label">
											<span class="label-text font-medium">Dimensions (cm)</span>
										</label>
										<div class="grid grid-cols-3 gap-4">
											<div class="form-control">
												<label class="label" for="length">
													<span class="label-text text-xs">Length</span>
												</label>
												<input
													id="length"
													type="number"
													class="input-bordered input w-full"
													bind:value={product.dimensions.length}
													placeholder="0"
													step="0.01"
												/>
											</div>
											<div class="form-control">
												<label class="label" for="width">
													<span class="label-text text-xs">Width</span>
												</label>
												<input
													id="width"
													type="number"
													class="input-bordered input w-full"
													bind:value={product.dimensions.width}
													placeholder="0"
													step="0.01"
												/>
											</div>
											<div class="form-control">
												<label class="label" for="height">
													<span class="label-text text-xs">Height</span>
												</label>
												<input
													id="height"
													type="number"
													class="input-bordered input w-full"
													bind:value={product.dimensions.height}
													placeholder="0"
													step="0.01"
												/>
											</div>
										</div>
									</div>

									<div class="form-control">
										<label class="label" for="shippingClass">
											<span class="label-text font-medium">Shipping Class</span>
										</label>
										<select
											id="shippingClass"
											class="select-bordered select w-full"
											bind:value={product.shippingClass}
										>
											<option value="">No shipping class</option>
											<option value="standard">Standard Shipping</option>
											<option value="express">Express Shipping</option>
											<option value="overnight">Overnight Shipping</option>
											<option value="heavy">Heavy Items</option>
											<option value="fragile">Fragile Items</option>
										</select>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Submit Buttons -->
			<div
				class="sticky bottom-0 z-10 -mx-6 -mb-6 flex justify-end gap-3 border-t border-base-300 bg-base-100 p-6"
			>
				<button type="button" class="btn btn-ghost">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					Cancel
				</button>

				<button type="submit" class="btn btn-primary" disabled={loading}>
					{#if loading}
						<span class="loading loading-sm loading-spinner"></span>
						Saving...
					{:else}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						Save
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
	{#each toasts as t (t.id)}
		<div
			class="animate-in fade-in slide-in-from-top-2 max-w-xs rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg"
			style="background: {t.type === 'success'
				? 'linear-gradient(90deg, #16a34a, #059669)'
				: t.type === 'error'
					? 'linear-gradient(90deg, #dc2626, #b91c1c)'
					: 'linear-gradient(90deg, #3b82f6, #2563eb)'}"
		>
			<div class="flex items-center gap-2">
				{#if t.type === 'success'}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else if t.type === 'error'}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
				{t.message}
			</div>
		</div>
	{/each}
</div>
