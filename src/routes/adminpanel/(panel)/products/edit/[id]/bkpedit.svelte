<script lang="ts">
	import { enhance } from '$app/forms';
	import { base } from '$lib/admin/paths';
	import { deserialize } from '$app/forms';
	import { onMount } from 'svelte';
	interface GalleryImage {
		file: File;
		alt_text: string;
		is_primary: boolean;
		color: string;
	}

	let { data } = $props();
	let categories = $state(data.categories || []);
	let subcategories = $state([]);
	let isDataLoaded = $state(false);
	let selectedPRoductType = $state('None');

	// Product form data
	let product: any = $state({
		// Basic Information
		name: '',
		vendor: '',
		description: '',
		shortDescription: '',
		category: '',
		category_name: '',
		subcategory: '',
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
		categories: [],
		tags: [], // Images
		mainImage: null,
		mainImagePreview: null, // Blob URL for display only
		mainImageAlt: '',
		mainImageColor: '',
		mainImageId: null, // To track existing main image for edits
		galleryImages: [], // Array of { file, alt_text, is_primary, color }

		// Reviews & Ratings
		reviewsEnabled: true,

		// Status & Visibility
		status: 'published', // draft, pending, publish
		featured: false,
		catalogVisibility: 'visible', // visible, catalog, search, hidden

		// SEO
		metaTitle: '',
		metaDescription: '',
		canonicalUrl: ''
	});

	// Available tags
	let availableTags = ['None', 'Trending', 'Flash Sales', 'New Arrival', 'Best Seller'];

	// Product attributes for variations
	let globalAttributes = [
		{ name: 'Color', options: ['Red', 'Blue', 'Green', 'Black', 'White'] },
		{ name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
		{ name: 'Material', options: ['Cotton', 'Polyester', 'Wool', 'Silk'] }
	];

	// File input references
	let mainImageInput: HTMLInputElement;
	let galleryImageInput: HTMLInputElement;

	// Shipping details visibility toggle
	let showShippingDetails = false;

	let availableSizes = $state(['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']);
	let selected_sizes = $state([]);

	// Reactive effect to sync state with data prop
	$effect(() => {
		// Update categories when data changes
		if (data?.categories && Array.isArray(data.categories)) {
			categories = data.categories;
		}

		// Initialize form with product data whenever data prop changes
		if (data?.product) {
			const p = data.product;

			// Populate basic information
			product.vendor = String(p.vendor || '');
			product.name = p.name || '';
			product.description = p.description || '';
			product.shortDescription = p.short_description || '';
			// Populate pricing
			product.regularPrice = p.regular_price || '';
			product.salePrice = p.sale_price || '';

			product.mainImage = p.images[0]?.image || null;
			product.mainImageAlt = p.images[0]?.alt_text || '';
			product.mainImageColor = p.images[0]?.color || '';
			product.mainImageId = p.images[0]?.id || null;

			// Populate categories - ensure proper ID handling with category_name
			const categoryId = p.category || '';
			product.category = String(categoryId);
			product.category_name = p.category_name || '';
			const subcategoryId = p.subcategory_id || p.subcategory || '';
			product.subcategory = String(subcategoryId);

			// Populate inventory & stock from nested inventory object
			if (p.inventory) {
				product.manageStock = p.inventory.manage_stock || true;
				product.stockQuantity = p.inventory.stock_quantity || '';
				product.stockStatus = p.inventory.stock_status || 'instock';
				product.allowBackorders = p.inventory.backorders_allowed ? 'yes' : 'no';
				product.lowStockThreshold = p.inventory.low_stock_threshold || '';
			} else {
				product.manageStock = p.manage_stock || true;
				product.stockQuantity = p.stock_quantity || '';
				product.stockStatus = p.stock_status || 'instock';
				product.allowBackorders = p.allow_backorders ? 'yes' : 'no';
				product.lowStockThreshold = p.low_stock_threshold || '';
			}

			// Populate shipping
			if (p.shipping) {
				product.weight = p.shipping.weight || '';
				product.dimensions.length = p.shipping.length || '';
				product.dimensions.width = p.shipping.width || '';
				product.dimensions.height = p.shipping.height || '';
				product.shippingClass = p.shipping.shipping_class || '';
			} else {
				product.weight = p.weight || '';
				product.dimensions.length = p.length || '';
				product.dimensions.width = p.width || '';
				product.dimensions.height = p.height || '';
				product.shippingClass = p.shipping_class || '';
			}

			// Populate status & visibility
			product.status = p.status || 'published';
			product.featured = p.featured || false;
			product.catalogVisibility = p.visibility || 'visible';

			// Populate SEO from nested seo object
			if (p.seo) {
				product.metaTitle = p.seo.meta_title || '';
				product.metaDescription = p.seo.meta_description || '';
				product.canonicalUrl = p.seo.canonical_url || '';
			} else {
				product.metaTitle = p.meta_title || '';
				product.metaDescription = p.meta_description || '';
				product.canonicalUrl = p.canonical_url || '';
			}

			if (p.available_sizes && Array.isArray(p.available_sizes)) {
				// .map() extracts the size string and converts it to lowercase to match your target
				selected_sizes = p.available_sizes.map((obj) => obj.size);
			} else {
				selected_sizes = []; // Safe fallback if data is missing
			}

			if (p.product_type && typeof p.product_type === 'string') {
				selectedPRoductType = p.product_type;
			} else {
				selectedPRoductType = 'None';
			}

			// Populate gallery images from images array
			if (p.images && Array.isArray(p.images)) {
				product.galleryImages = p.images.map((img: any) => ({
					file: null,
					img_id: img.id || null,
					alt_text: img.alt_text || '',
					is_primary: img.is_primary || false,
					color: img.color || '',
					image_url: img.image // Store the URL for display
				}));
			}

			// Load subcategories if category is set
			if (categoryId) {
				loadSubcategoriesForEdit(categoryId);
			}

			// Mark data as loaded to show form
			isDataLoaded = true;
		}
	});

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

	function removeGalleryImage(index: number) {
		product.galleryImages.splice(index, 1);
		product = product;
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
	}

	function addTag(tagId: string) {
		if (!product.tags.includes(tagId)) {
			product.tags.push(tagId);
			product = product;
		}
	}

	function removeTag(tagId: number) {
		product.tags = product.tags.filter((id: number) => id !== tagId);
	}

	let subcategoriesLoading = $state(false);
	async function loadSubcategories(event) {
		const categoryId = event.target.value;
		// subcategories = [];
		// product.subcategory = '';

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

			if (result.type === 'success' && result.data?.data) {
				subcategories = result.data.data;
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

	// Helper function to load subcategories after product load
	async function loadSubcategoriesForEdit(categoryId: string | number) {
		if (!categoryId) {
			subcategories = [];
			return;
		}

		try {
			const formData = new FormData();
			formData.append('categoryId', String(categoryId));

			const response = await fetch('?/fetchSubcategories', {
				method: 'POST',
				body: formData,
				headers: {
					'x-sveltekit-action': 'true'
				}
			});

			if (!response.ok) {
				console.error('Failed to fetch subcategories:', response.statusText);
				subcategories = [];
				return;
			}

			// SvelteKit actions return devalue-encoded text, not plain JSON
			const text = await response.text();
			const result = deserialize(text);
			if (result.type === 'success' && result.data?.data) {
				subcategories = result.data.data;
			} else if (result.type === 'success' && Array.isArray(result.data)) {
				subcategories = result.data;
			} else {
				subcategories = [];
			}
		} catch (error) {
			console.error('Error loading subcategories:', error);
			subcategories = [];
		}
	}

	let isSubmitting = false;
	let toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }> = [];

	function addToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
		const id = Date.now().toString();
		toasts = [...toasts, { id, message, type }];

		// Auto-remove after 3 seconds
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 3000);
	}

	async function handleSubmit(event: any) {
		isSubmitting = true;
		const formData = new FormData();

		// BASIC INFORMATION
		formData.append('name', product.name || '');
		formData.append('vendor', product.vendor || '');
		formData.append('description', product.description || '');
		formData.append('shortDescription', product.shortDescription || '');

		// PRICING
		formData.append('regularPrice', product.regularPrice || '0');
		formData.append('salePrice', product.salePrice || '');

		// CATEGORIES
		formData.append('category', product.category || '');
		formData.append('subcategory', product.subcategory || '');

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

		// MAIN IMAGE
		// if (product.mainImage && product.mainImage instanceof File) {
		// 	formData.append('mainImageId', product.mainImageId || '');
		// 	formData.append('mainImage', product.mainImage);
		// 	formData.append('mainImageAlt', product.mainImageAlt || '');
		// 	formData.append('mainImageColor', product.mainImageColor || '');
		// }
		formData.append('mainImageAlt', product.mainImageAlt || '');
		formData.append('mainImageColor', product.mainImageColor || '');

		if (product.mainImage) {
			// 1. Always send the metadata ID if it exists
			formData.append('mainImageId', product.mainImageId || '');

			// 2. Handle the image source safely
			if (product.mainImage instanceof File) {
				console.log('Submitting a brand new file upload');
				formData.append('mainImage', product.mainImage); // Appends the actual binary file
			} else {
				// Extract the URL whether it's a direct string or nested in an object
				const existingImageUrl =
					typeof product.mainImage === 'string' ? product.mainImage : product.mainImage.url || '';

				if (existingImageUrl) {
					// IMPORTANT: Prevent blob URLs from being sent - they are temporary and cannot be persisted
					if (existingImageUrl.startsWith('blob:')) {
						console.warn(
							'⚠️ BLOB URL detected! This is a temporary preview URL that cannot be persisted. Treating as deleted.'
						);
						formData.append('mainImageDeleted', 'true');
					} else {
						console.log('Submitting an existing image URL:', existingImageUrl);
						// TIP: Use a distinct key like 'existingMainImageUrl' if your backend
						// multipart middleware struggles with mixed strings/files on the same key.
						formData.append('existingMainImageUrl', existingImageUrl);
					}
				}
			}
		} else {
			// Handle the case where the user explicitly deleted the image
			formData.append('mainImageDeleted', 'true');
		}

		// console.log('Submitting product with mainImage:', product.mainImage);
		// if (product.mainImage) {
		// 	// 1. Always send the metadata if an image exists (new or existing)
		// 	formData.append('mainImageId', product.mainImageId || '');

		// 	// 2. Conditionally handle the image source
		// 	if (product.mainImage instanceof File) {
		// 		console.log('Submitting product with newImage:', product.mainImage);
		// 		// It's a new file upload
		// 		formData.append('mainImage', product.mainImage);
		// 	} else if (typeof product.mainImage === 'string') {
		// 		// It's an existing image URL or image path
		// 		formData.append('mainImage', product.mainImage);
		// 	} else {
		// 		// Fallback case just in case mainImage is an object from a database fetch
		// 		formData.append('mainImage', product.mainImage.url || '');
		// 	}
		// } else {
		// 	// Optional: Handle the case where the user deleted the image
		// 	formData.append('mainImageDeleted', 'true');
		// }

		// GALLERY IMAGES WITH METADATA
		// formData.append('galleryImageCount', String(product.galleryImages.length));

		// const galleryMetadata: Array<{
		// 	alt_text: string;
		// 	is_primary: boolean;
		// 	color: string;
		// }> = [];

		// const existingGalleryImages: Array<{
		// 	image_url: string;
		// 	alt_text: string;
		// 	is_primary: boolean;
		// 	color: string;
		// }> = [];

		// product.galleryImages.forEach((img: GalleryImage, idx: number) => {
		// 	if (img.file && img.file instanceof File) {
		// 		// NEW image: append file
		// 		formData.append(`galleryImage_${idx}`, img.file);

		// 		galleryMetadata.push({
		// 			alt_text: img.alt_text || '',
		// 			is_primary: img.is_primary || false,
		// 			color: img.color || ''
		// 		});
		// 	} else if (img.image_url) {
		// 		// EXISTING image: store metadata and URL
		// 		existingGalleryImages.push({
		// 			image_url: img.image_url,
		// 			alt_text: img.alt_text || '',
		// 			is_primary: img.is_primary || false,
		// 			color: img.color || ''
		// 		});
		// 	}
		// });

		// Add gallery metadata for new images as JSON
		// if (galleryMetadata.length > 0) {
		// 	formData.append('gallery_metadata', JSON.stringify(galleryMetadata));
		// }

		// Add existing gallery images metadata
		// if (existingGalleryImages.length > 0) {
		// 	formData.append('existing_gallery_images', JSON.stringify(existingGalleryImages));
		// }

		// SIZES (Array of selected size strings)
		if (selected_sizes && selected_sizes.length > 0) {
			formData.append('sizesCount', String(selected_sizes.length));
			selected_sizes.forEach((size: string, idx: number) => {
				formData.append(`sizeName_${idx}`, size);
			});
		}

		// TAGS (Array of tag IDs)
		if (product.tags && product.tags.length > 0) {
			formData.append('tagsCount', String(product.tags.length));
			product.tags.forEach((tagId: number, idx: number) => {
				formData.append(`tagId_${idx}`, String(tagId));
			});
		}

		// PRODUCT TYPE
		if (selectedPRoductType && selectedPRoductType !== 'None') {
			formData.append('product_type', selectedPRoductType);
		}

		// product.galleryImages.forEach((img: GalleryImage, idx: number) => {
		// 	console.log(`  [${idx}]`, {
		// 		hasFile: img.file instanceof File,
		// 		hasImageUrl: !!img.image_url,
		// 		alt_text: img.alt_text,
		// 		is_primary: img.is_primary,
		// 		color: img.color
		// 	});
		// });
		// for (const [key, value] of formData.entries()) {
		// 	console.log(`  ${key}:`, value instanceof File ? `File: ${value.name}` : value);
		// }

		try {
			const actionName = 'updateProduct';
			const response = await fetch(`?/${actionName}`, {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			if (!response.ok) {
				console.error('Error updating product:', result);
				addToast(result.message || 'Failed to update product', 'error');
			} else {
				addToast('Product updated successfully!', 'success');
				// Redirect after a brief delay
				// setTimeout(() => {
				// 	window.location.href = '/admincontrol/products';
				// }, 1500);
			}
		} catch (error) {
			console.error('Error:', error);
			addToast('An error occurred while saving the product', 'error');
		} finally {
			isSubmitting = false;
		}
	}
	onMount(() => {});
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
			<span class="text-base-content/60">Edit Product</span>
		</div>
		<!-- Page Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold">{data?.product ? 'Edit' : 'Create'} Product Details</h1>
			<p class="mt-1 text-base-content/70">
				{data?.product
					? 'Update the product information below'
					: 'Complete the form below to add a new product to your store'}
			</p>
		</div>

		<form
			class="space-y-8"
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit(e);
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
								{#if isDataLoaded}
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
											{#if product.vendor}
												<span class="badge badge-sm badge-primary">{product.vendor}</span>
											{/if}
										</label>
										<select
											id="vendor"
											name="vendor"
											class="select-bordered select w-full"
											bind:value={product.vendor}
										>
											<option value="">Select a vendor</option>
											<option value="Royal Hemp">Royal Hemp</option>
											<option value="Ganesh Hemp">Ganesh Hemp</option>
										</select>
									</div>
								{:else}
									<div class="form-control">
										<div class="h-16 w-full skeleton"></div>
									</div>
									<div class="form-control">
										<div class="h-16 w-full skeleton"></div>
									</div>
								{/if}
							</div>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								{#if isDataLoaded}
									<div class="form-control">
										<label class="label" for="category">
											<span class="label-text font-medium">Category</span>
											{#if product.category_name}
												<span class="badge badge-sm badge-info">{product.category_name}</span>
											{/if}
										</label>
										<select
											id="category"
											class="select-bordered select w-full"
											bind:value={product.category}
											name="category"
											onchange={(e) => {
												product.category = e.currentTarget.value;
												loadSubcategories(e);
											}}
										>
											<option value="">Select a category</option>
											{#each categories as category}
												<option value={String(category.id)}>{category.name}</option>
											{/each}
										</select>
									</div>
								{:else}
									<div class="form-control">
										<div class="h-16 w-full skeleton"></div>
									</div>
								{/if}
								{#if isDataLoaded}
									<div class="form-control">
										<label class="label" for="subCategory">
											<span class="label-text font-medium">Sub Category</span>
											{#if product.subcategory && Array.isArray(subcategories)}
												{@const subCatName = subcategories.find(
													(s) => String(s.id) === String(product.subcategory)
												)?.name}
												{#if subCatName}
													<span class="badge badge-sm badge-info">{subCatName}</span>
												{/if}
											{/if}
										</label>
										{#key subcategories}
											<select
												id="subCategory"
												class="select-bordered select w-full"
												bind:value={product.subcategory}
												name="subCategory"
												disabled={subcategories.length === 0}
											>
												<option value="">
													{subcategories.length === 0
														? 'Select a category first'
														: 'Select a subcategory'}
												</option>
												{#each subcategories as subcategory}
													<option value={String(subcategory.id)}>{subcategory.name}</option>
												{/each}
											</select>
										{/key}
									</div>
								{:else}
									<div class="form-control">
										<div class="h-16 w-full skeleton"></div>
									</div>
								{/if}
							</div>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								{#if isDataLoaded}
									<div class="form-control">
										<label class="label" for="regularPrice">
											<span class="label-text font-medium">Regular Price ($)</span>
										</label>
										<input
											id="regularPrice"
											type="number"
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
											class="input-bordered input w-full"
											bind:value={product.salePrice}
											placeholder="0.00"
											step="0.01"
										/>
									</div>
								{:else}
									<div class="form-control">
										<div class="h-16 w-full skeleton"></div>
									</div>
									<div class="form-control">
										<div class="h-16 w-full skeleton"></div>
									</div>
								{/if}
							</div>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								{#if isDataLoaded}
									<div class="form-control">
										<label class="label" for="shortDesc">
											<span class="label-text font-medium">Short Description</span>
										</label>
										<textarea
											id="shortDesc"
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
											class="textarea-bordered textarea h-20 w-full"
											bind:value={product.description}
											placeholder="Detailed product description"
										></textarea>
									</div>
								{:else}
									<div class="form-control">
										<div class="h-24 w-full skeleton"></div>
									</div>
									<div class="form-control">
										<div class="h-24 w-full skeleton"></div>
									</div>
								{/if}
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
									<input type="checkbox" class="checkbox" bind:checked={product.manageStock} />
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
								<div class="space-y-6">
									<div>
										<label class="label">
											<span class="label-text font-medium">Product Gallery</span>
										</label>
										<div class="space-y-6">
											<div class="card border-2 border-base-300 bg-base-100 p-6">
												<div class="space-y-4">
													<div>
														<label class="label" for="main-image-file">
															<span class="label-text font-medium">Main (Feature) Image</span>
														</label>

														<div
															class="rounded-lg border-2 border-dashed border-base-300 p-6 text-center"
														>
															{#if product.mainImage}
																<input
																	type="hidden"
																	name="mainImageId"
																	value={product.mainImageId || ''}
																/>
																<div class="relative inline-block">
																	<img
																		src={product.mainImagePreview || product.mainImage}
																		alt="Main Image Preview"
																		class="mx-auto max-h-48 max-w-xs rounded-lg object-contain"
																	/>
																	<button
																		type="button"
																		class="btn absolute -top-2 -right-2 btn-circle btn-sm btn-error"
																		onclick={() => {
																			// Clean up memory before removing
																			if (product.mainImagePreview)
																				URL.revokeObjectURL(product.mainImagePreview);
																			product.mainImage = null;
																			product.mainImagePreview = null;
																			product = product; // Trigger reactivity
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
																name="mainImage"
																class="hidden"
																accept="image/*"
																onchange={(e: Event) => {
																	const target = e.target as HTMLInputElement;
																	if (target.files && target.files[0]) {
																		// Revoke old preview blob URL if it exists to prevent memory leaks
																		if (product.mainImagePreview)
																			URL.revokeObjectURL(product.mainImagePreview);

																		// Store the actual File object for submission
																		product.mainImage = target.files[0];
																		// Generate a preview blob URL for display only
																		product.mainImagePreview = URL.createObjectURL(target.files[0]);
																		product = product; // Trigger reactivity
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

													<!-- <div>
														<label class="label" for="main-file">
															<span class="label-text font-medium">Main (Feature) Image</span>
														</label>
														<div
															class="border-2 border-dashed border-base-300 rounded-lg p-6 text-center"
														>
															{#if product.mainImage}
																<div class="relative inline-block">
																	<img
																		src={URL.createObjectURL(product.mainImage)}
																		alt="Main Image Preview"
																		class="max-w-xs max-h-48 object-contain mx-auto rounded-lg"
																	/>
																	<button
																		type="button"
																		class="btn btn-sm btn-error btn-circle absolute -top-2 -right-2"
																		onclick={() => {
																			product.mainImage = null;
																			product = product; // Trigger reactivity
																		}}
																	>
																		×
																	</button>
																</div>
															{:else}
																<div class="text-base-content/60">
																	<svg
																		class="mx-auto h-10 w-10 mb-2"
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
																accept="image/*"
																onchange={(e: Event) => {
																	const target = e.target as HTMLInputElement;
																	if (target.files && target.files[0]) {
																		product.mainImage = target.files[0];
																		product = product; // Trigger reactivity
																	}
																}}
															/>
															<button
																type="button"
																class="btn btn-primary btn-sm mt-3"
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
													</div> -->

													<div class="form-control">
														<label class="label" for="main-alt-text">
															<span class="label-text text-sm font-medium">Main Image Alt Text</span
															>
														</label>
														<textarea
															id="main-alt-text"
															class="textarea-bordered textarea w-full textarea-sm"
															bind:value={product.mainImageAlt}
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

									<!-- {#each product.galleryImages as image, index} -->
									<!-- <div class="card bg-base-100 border-2 border-base-300 p-6">
											<div class="space-y-4"> -->
									<!-- Image File Input -->
									<!-- <div>
													<label class="label" for="gallery-file-{index}">
														<span class="label-text font-medium">Gallery Image {index + 1}</span>
														{#if image.file || image.image_url}
															<span class="badge badge-info badge-sm"
																>{image.file ? 'New' : 'Existing'}</span
															>
														{/if}
													</label>
													<div
														class="border-2 border-dashed border-base-300 rounded-lg p-6 text-center bg-base-100 hover:bg-base-50 transition"
													>
														{#if image.file}
															<div class="relative inline-block mb-4">
																<div
																	class="bg-white border border-base-300 rounded-lg p-4 inline-block shadow-md"
																>
																	<img
																		src={URL.createObjectURL(image.file)}
																		alt="Gallery {index + 1}"
																		class="max-w-xs max-h-80 object-contain"
																	/>
																</div>
																<button
																	type="button"
																	class="btn btn-sm btn-error btn-circle absolute -top-3 -right-3 shadow-lg"
																	onclick={() => {
																		image.file = null;
																		product = product;
																	}}
																	title="Remove image"
																>
																	×
																</button>
															</div>
															<div class="text-sm text-base-content/60 mb-3">
																<p class="font-semibold">{image.file.name}</p>
															</div>
														{:else if image.image_url}
															<div class="relative inline-block mb-4">
																<div
																	class="bg-white border border-base-300 rounded-lg p-4 inline-block shadow-md"
																>
																	<img
																		src={image.image_url}
																		alt="Gallery {index + 1}"
																		class="max-w-xs max-h-80 object-contain"
																	/>
																</div>
																<button
																	type="button"
																	class="btn btn-sm btn-error btn-circle absolute -top-3 -right-3 shadow-lg"
																	onclick={() => {
																		product.galleryImages.splice(index, 1);
																		product = product;
																	}}
																	title="Remove image"
																>
																	×
																</button>
															</div>
															<div class="text-sm text-base-content/60 mb-3">
																<p class="font-semibold">Existing Image</p>
															</div>
														{:else}
															<div class="text-base-content/60 py-6">
																<svg
																	class="mx-auto h-10 w-10 mb-2"
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
																<p class="font-semibold">Click to select image</p>
															</div>
														{/if}
														<input
															id="gallery-file-{index}"
															type="file"
															class="hidden"
															accept="image/*"
															onchange={(e: Event) => {
																const target = e.target as HTMLInputElement;
																if (target.files && target.files[0]) {
																	image.file = target.files[0];
																	product = product;
																}
															}}
														/>
														<button
															type="button"
															class="btn btn-primary btn-sm mt-3"
															onclick={(e) => {
																const input = (e.target as HTMLElement)
																	.closest('.border-dashed')
																	?.querySelector('input[type="file"]') as HTMLInputElement;
																input?.click();
															}}
														>
															{image.file ? 'Change Image' : 'Select Image'}
														</button>
													</div>
												</div> -->

									<!-- Alt Text Input -->
									<!-- <div class="form-control">
													<label class="label" for="alt-text-{index}">
														<span class="label-text font-medium text-sm">Alt Text</span>
													</label>
													<textarea
														id="alt-text-{index}"
														class="textarea textarea-bordered textarea-sm w-full"
														bind:value={image.alt_text}
														placeholder="Descriptive text for accessibility and SEO"
														rows="2"
													></textarea>
												</div> -->

									<!-- Color and Primary Toggle -->
									<!-- <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div class="form-control">
														<label class="label" for="color-{index}">
															<span class="label-text font-medium text-sm">Product Color</span>
														</label>
														<div class="flex gap-2 items-center">
															<input
																id="color-{index}"
																type="text"
																class="input input-bordered input-sm flex-grow"
																bind:value={image.color}
																placeholder="e.g., Red, Blue"
															/>
															<div class="flex items-center gap-1">
																<input
																	type="color"
																	class="w-12 h-10 rounded cursor-pointer border border-base-300"
																	bind:value={image.color}
																	title="Pick a color"
																/>
																{#if image.color}
																	<span class="text-xs font-mono bg-base-200 px-2 py-1 rounded"
																		>{image.color}</span
																	>
																{/if}
															</div>
														</div>
													</div>

													<div class="form-control">
														<label class="label cursor-pointer justify-start gap-2">
															<input
																type="checkbox"
																class="checkbox checkbox-sm"
																checked={image.is_primary}
																onchange={(e: Event) => {
																	const target = e.target as HTMLInputElement;
																	product.galleryImages.forEach((img: GalleryImage, i: number) => {
																		img.is_primary = i === index && target.checked;
																	});
																	product = product;
																}}
															/>
															<span class="label-text font-medium text-sm">
																{#if image.is_primary}
																	<span class="badge badge-success badge-sm">Primary Image</span>
																{:else}
																	Set as primary
																{/if}
															</span>
														</label>
													</div>
												</div> -->

									<!-- Remove Button -->
									<!-- <button
													type="button"
													class="btn btn-error btn-sm w-full"
													onclick={() => removeGalleryImage(index)}
												>
													<svg
														class="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
													Remove Image
												</button> -->
									<!-- </div>
										</div>
									{/each} -->

									<!-- Add New Image Button -->
									<!-- <button
										type="button"
										class="btn btn-primary btn-outline w-full"
										onclick={addNewGalleryField}
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4v16m8-8H4"
											/>
										</svg>
										+ Add Another Image
									</button> -->
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
								>
									<option value="draft">Draft</option>
									<option value="published">Published</option>
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
							{#each availableSizes as size (size)}
								{@const isChecked = selected_sizes.includes(size)}
								<label class="label cursor-pointer justify-start">
									<input
										type="checkbox"
										name="size"
										class="checkbox checkbox-sm checkbox-info"
										checked={isChecked}
										onchange={(e: Event) => {
											const target = e.target as HTMLInputElement;
											if (target.checked) {
												selected_sizes = [...selected_sizes, size];
											} else {
												selected_sizes = selected_sizes.filter((s) => s !== size);
											}
										}}
									/>
									<span class="label-text text-smp p-1 font-medium">{size}</span>
								</label>
							{/each}
						</div>

						{#if selected_sizes.length > 0}
							<div class="mt-3 rounded-lg border border-base-300 p-2">
								<div class="mb-2 text-xs font-bold uppercase opacity-70">
									Selected Sizes ({selected_sizes.length}):
								</div>
								<div class="flex flex-wrap gap-2">
									{#each selected_sizes as size}
										<span class="badge-ssm badge badge-info">{size}</span>
									{/each}
								</div>
							</div>
						{:else}
							<div class="alert-sm mt-2 alert alert-warning">
								<div class="text-xs">
									<strong>Debug:</strong> No sizes selected. selected_sizes = {JSON.stringify(
										selected_sizes
									)}
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
										bind:group={selectedPRoductType}
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
						{#if selectedPRoductType && selectedPRoductType !== 'None'}
							<div class="mt-3 rounded-lg border border-base-300 p-2">
								<div class="mb-2 text-xs font-bold uppercase opacity-70">Selected:</div>
								<div class="flex flex-wrap gap-1">
									<span class="badge badge-sm badge-warning">{selectedPRoductType}</span>
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
									name="canonical_url"
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
				<button class="btn btn-ghost">
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
				<button
					class="btn btn-primary {isSubmitting ? 'loading' : ''}"
					type="submit"
					disabled={isSubmitting}
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					{isSubmitting ? 'Saving...' : data?.product ? 'Update Product' : 'Create Product'}
				</button>
			</div>
		</form>
	</div>
</div>
