<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { getImageUrl } from '$lib/admin/utils/image';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { page } from '$app/stores';

	interface ProductImage {
		id: number;
		image: string;
		alt_text: string | null;
		is_primary: boolean;
		color: string | null;
	}

	interface Product {
		id: number;
		name: string;
		sku: string;
		slug: string;
		status: string;
		regular_price: string;
		sale_price: string | null;
		category_name: string | null;
		created_at: string;
		images: ProductImage[];
	}

	let { data } = $props();
	const token = data.apiToken;
	let products = $state<Product[]>(data?.products ?? []);
	let totalItems = $state(data?.productCount ?? 0);
	let currentPage = $state(data?.currentPage ?? 1);
	let itemsPerPage = $state(10);

	let searchQuery = $state('');
	let filterStatus = $state('all');
	let sortBy = $state('default');
	let colorFilter = $state('all');
	let expandedProductId = $state<number | null>(null);
	let isLoading = $state(false);

	async function fetchProducts(pageNum = 1) {
		isLoading = true;
		try {
			const baseUrl = PUBLIC_API_BASE_URL || 'http://127.0.0.1:9000';

			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};

			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}

			const res = await fetch(`${baseUrl}/api/products/list-paginated?page=${pageNum}`, {
				method: 'GET',
				headers
			});

			if (!res.ok) throw new Error('API server returned an error');

			const payload = await res.json();
			products = payload.results ?? [];
			totalItems = payload.count ?? 0;
			currentPage = pageNum;

			// Update URL without navigation
			window.history.replaceState({}, '', `${base}/products/gallery?page=${pageNum}`);
		} catch (err) {
			console.error('Failed to load gallery:', err);
		} finally {
			isLoading = false;
		}
	}

	let processedProducts = $derived.by(() => {
		let list = [...products];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
			);
		}

		if (filterStatus !== 'all') {
			list = list.filter((p) => p.status === filterStatus);
		}

		if (colorFilter !== 'all') {
			list = list.filter((p) =>
				p.images?.some((img) => img.color?.toLowerCase() === colorFilter.toLowerCase())
			);
		}

		if (sortBy === 'name') {
			list.sort((a, b) => a.name.localeCompare(b.name));
		} else if (sortBy === 'sku') {
			list.sort((a, b) => a.sku.localeCompare(b.sku));
		} else if (sortBy === 'images') {
			list.sort((a, b) => (b.images?.length ?? 0) - (a.images?.length ?? 0));
		}

		return list;
	});

	let availableColors = $derived.by(() => {
		const colors = new Set<string>();
		products.forEach((p) => {
			p.images?.forEach((img) => {
				if (img.color) {
					colors.add(img.color);
				}
			});
		});
		return Array.from(colors).sort();
	});

	let totalPages = $derived(Math.ceil(totalItems / itemsPerPage));

	const getColorBadgeStyle = (color: string | null) => {
		if (!color) return 'badge-ghost';
		const colorMap: Record<string, string> = {
			red: 'badge-error',
			blue: 'badge-info',
			green: 'badge-success',
			yellow: 'badge-warning',
			black: 'badge-ghost',
			white: 'badge-ghost',
			gray: 'badge-neutral',
			grey: 'badge-neutral',
			purple: 'badge-secondary'
		};
		return colorMap[color.toLowerCase()] || 'badge-neutral';
	};

	const getPrimaryBadgeStyle = (isPrimary: boolean) => {
		return isPrimary ? 'badge-primary' : 'badge-outline';
	};

	const handleImageError = (e: Event) => {
		const img = e.target as HTMLImageElement;
		img.src =
			'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 class=%22h-full w-full text-base-content/30%22 fill=%22none%22 viewBox=%220 0 24 24%22%3E%3Cpath stroke=%22currentColor%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z%22/%3E%3C/svg%3E';
	};
</script>

<div class="min-h-screen bg-base-200 p-4">
	<div class="max-w-7xl mx-auto">
		<!-- Breadcrumb Navigation -->
		<div class="mb-6 flex items-center gap-2 text-sm">
			<a href={base} class="link link-hover text-primary font-medium">Dashboard</a>
			<svg
				class="w-4 h-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<a href={base + '/products'} class="link link-hover text-primary font-medium">Products</a>
			<svg
				class="w-4 h-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Gallery</span>
		</div>
		<!-- Header -->
		<div
			class="bg-gradient-to-r from-primary to-primary/80 rounded-lg shadow-lg p-6 mb-6 text-primary-content"
		>
			<div class="flex justify-between items-center gap-4">
				<div>
					<h1 class="text-3xl font-bold">Product Gallery</h1>
					<p class="text-primary-content/80 text-sm">
						Manage and view all product images with colors and alt text
					</p>
				</div>
				<a
					class="btn btn-primary shadow-md hover:shadow-lg transition-shadow gap-2"
					href={base + '/products/create'}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Upload New Image
				</a>
			</div>
		</div>

		<!-- Filters Section -->
		<div class="bg-base-100 rounded-lg shadow-md p-6 mb-6">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<!-- Search -->
				<div class="form-control">
					<label class="label">
						<span class="label-text font-semibold">Search</span>
					</label>
					<input
						type="text"
						placeholder="Search by name or SKU"
						class="input input-bordered input-sm"
						bind:value={searchQuery}
					/>
				</div>

				<!-- Status Filter -->
				<div class="form-control">
					<label class="label">
						<span class="label-text font-semibold">Status</span>
					</label>
					<select class="select select-bordered select-sm" bind:value={filterStatus}>
						<option value="all">All Status</option>
						<option value="draft">Draft</option>
						<option value="published">Published</option>
					</select>
				</div>

				<!-- Color Filter -->
				<div class="form-control">
					<label class="label">
						<span class="label-text font-semibold">Color</span>
					</label>
					<select class="select select-bordered select-sm" bind:value={colorFilter}>
						<option value="all">All Colors</option>
						{#each availableColors as color}
							<option value={color}>{color}</option>
						{/each}
					</select>
				</div>

				<!-- Sort By -->
				<div class="form-control">
					<label class="label">
						<span class="label-text font-semibold">Sort By</span>
					</label>
					<select class="select select-bordered select-sm" bind:value={sortBy}>
						<option value="default">Default</option>
						<option value="name">Name (A-Z)</option>
						<option value="sku">SKU</option>
						<option value="images">Most Images</option>
					</select>
				</div>
			</div>

			<!-- Info -->
			<div class="mt-4 text-sm text-base-content/70">
				Showing {processedProducts.length} of {products.length} products • Total gallery items: {products.reduce(
					(sum, p) => sum + (p.images?.length ?? 0),
					0
				)}
			</div>
		</div>

		<!-- Gallery List -->
		<div class="space-y-4">
			{#if processedProducts.length === 0}
				<div class="alert alert-warning shadow-lg">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>No products found matching your filters.</span>
				</div>
			{:else}
				{#each processedProducts as product (product.id)}
					<div
						class="bg-base-100 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
					>
						<!-- Product Header -->
						<button
							onclick={() =>
								(expandedProductId = expandedProductId === product.id ? null : product.id)}
							class="w-full p-4 bg-base-200 hover:bg-base-300 transition-colors text-left flex justify-between items-center"
						>
							<div class="flex-1">
								<div class="flex items-center gap-3">
									<svg
										class="w-5 h-5 transition-transform {expandedProductId === product.id
											? 'rotate-90'
											: ''}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										/>
									</svg>
									<div>
										<h3 class="font-semibold text-lg">{product.name}</h3>
										<p class="text-sm text-base-content/60">SKU: {product.sku}</p>
									</div>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<span
									class="badge {product.status === 'published' ? 'badge-success' : 'badge-warning'}"
								>
									{product.status}
								</span>
								<span class="badge badge-outline">
									{product.images?.length ?? 0} images
								</span>
							</div>
						</button>

						<!-- Product Content -->
						{#if expandedProductId === product.id}
							<div class="p-4 border-t border-base-300">
								{#if product.images && product.images.length > 0}
									<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{#each product.images as image (image.id)}
											<div
												class="bg-base-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
											>
												<!-- Image -->
												<div class="relative bg-base-300 aspect-square overflow-hidden">
													<img
														src={getImageUrl(image.image)}
														alt={image.alt_text || 'Product image'}
														class="w-full h-full object-cover hover:scale-105 transition-transform"
														onerror={handleImageError}
													/>
													{#if image.is_primary}
														<div class="absolute top-2 right-2 badge badge-primary gap-1">
															<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
																<path
																	d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
																/>
															</svg>
															Primary
														</div>
													{/if}
												</div>

												<!-- Image Details -->
												<div class="p-3 space-y-3">
													<!-- Color Badge -->
													{#if image.color}
														<div>
															<p class="text-xs font-semibold text-base-content/60 mb-1">Color</p>
															<span class="badge {getColorBadgeStyle(image.color)}">
																{image.color}
															</span>
														</div>
													{/if}

													<!-- Alt Text -->
													<div>
														<p class="text-xs font-semibold text-base-content/60 mb-1">Alt Text</p>
														{#if image.alt_text}
															<p class="text-sm bg-base-300 p-2 rounded line-clamp-2 break-words">
																{image.alt_text}
															</p>
														{:else}
															<p class="text-sm text-base-content/50 italic">No alt text</p>
														{/if}
													</div>

													<!-- Actions -->
													<div class="flex gap-2 pt-2">
														<a
															href={base + `/products/gallery/${product.id}`}
															class="btn btn-xs btn-outline flex-1"
														>
															View
														</a>
														<button class="btn btn-xs btn-ghost" title="Edit image">
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
																	d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
																/>
															</svg>
														</button>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="text-center py-8 text-base-content/60">
										<svg
											class="w-12 h-12 mx-auto mb-2 opacity-50"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										<p class="text-sm">No images for this product</p>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex justify-center items-center gap-2 mt-8 pb-8">
				<button
					class="btn btn-sm"
					disabled={currentPage === 1 || isLoading}
					onclick={() => fetchProducts(currentPage - 1)}
				>
					← Previous
				</button>

				<div class="flex gap-1">
					{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1) as pageNum}
						<button
							class="btn btn-sm {currentPage === pageNum ? 'btn-primary' : 'btn-ghost'}"
							disabled={isLoading}
							onclick={() => fetchProducts(pageNum)}
						>
							{pageNum}
						</button>
					{/each}
					{#if totalPages > 5}
						<span class="px-2">...</span>
						<button
							class="btn btn-sm {currentPage === totalPages ? 'btn-primary' : 'btn-ghost'}"
							disabled={isLoading}
							onclick={() => fetchProducts(totalPages)}
						>
							{totalPages}
						</button>
					{/if}
				</div>

				<button
					class="btn btn-sm"
					disabled={currentPage === totalPages || isLoading}
					onclick={() => fetchProducts(currentPage + 1)}
				>
					Next →
				</button>
			</div>
		{/if}
	</div>
</div>
