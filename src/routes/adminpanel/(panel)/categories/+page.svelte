<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';

	interface Subcategory {
		id: number;
		name: string;
		slug: string;
		image?: string;
		description: string;
		productCount: number;
	}

	interface Category {
		id: number;
		name: string;
		slug: string;
		icon?: string;
		image?: string;
		description: string;
		productCount: number;
		subcategories: Subcategory[];
		isExpanded?: boolean;
	}

	// Sample category data
	let categories: Category[] = [
		{
			id: 1,
			name: 'Electronics',
			slug: 'electronics',
			description: 'Electronic devices and gadgets',
			productCount: 145,
			isExpanded: true,
			subcategories: [
				{
					id: 101,
					name: 'Smartphones',
					slug: 'smartphones',
					description: 'Mobile phones and accessories',
					productCount: 42
				},
				{
					id: 102,
					name: 'Laptops',
					slug: 'laptops',
					description: 'Computers and notebooks',
					productCount: 28
				},
				{
					id: 103,
					name: 'Tablets',
					slug: 'tablets',
					description: 'Tablets and iPad devices',
					productCount: 19
				},
				{
					id: 104,
					name: 'Accessories',
					slug: 'accessories',
					description: 'Chargers, cables, and more',
					productCount: 56
				}
			]
		},
		{
			id: 2,
			name: 'Fashion',
			slug: 'fashion',
			description: 'Clothing and accessories',
			productCount: 298,
			isExpanded: false,
			subcategories: [
				{
					id: 201,
					name: 'Men Clothing',
					slug: 'men-clothing',
					description: 'Mens apparel collection',
					productCount: 89
				},
				{
					id: 202,
					name: 'Women Clothing',
					slug: 'women-clothing',
					description: 'Womens apparel collection',
					productCount: 125
				},
				{
					id: 203,
					name: 'Shoes',
					slug: 'shoes',
					description: 'Footwear for all occasions',
					productCount: 84
				}
			]
		},
		{
			id: 3,
			name: 'Home & Garden',
			slug: 'home-garden',
			description: 'Furniture and home decor',
			productCount: 187,
			isExpanded: false,
			subcategories: [
				{
					id: 301,
					name: 'Furniture',
					slug: 'furniture',
					description: 'Tables, chairs, sofas',
					productCount: 95
				},
				{
					id: 302,
					name: 'Kitchen',
					slug: 'kitchen',
					description: 'Kitchen appliances and tools',
					productCount: 72
				},
				{
					id: 303,
					name: 'Bedding',
					slug: 'bedding',
					description: 'Beds, pillows, sheets',
					productCount: 20
				}
			]
		},
		{
			id: 4,
			name: 'Sports & Outdoors',
			slug: 'sports-outdoors',
			description: 'Sports equipment and outdoor gear',
			productCount: 156,
			isExpanded: false,
			subcategories: [
				{
					id: 401,
					name: 'Sports Equipment',
					slug: 'sports-equipment',
					description: 'Balls, bats, and equipment',
					productCount: 68
				},
				{
					id: 402,
					name: 'Outdoor Gear',
					slug: 'outdoor-gear',
					description: 'Camping and hiking gear',
					productCount: 54
				},
				{
					id: 403,
					name: 'Fitness',
					slug: 'fitness',
					description: 'Gym and fitness equipment',
					productCount: 34
				}
			]
		}
	];

	let searchQuery = '';
	let filterStatus = 'all';
	let sortBy = 'name';

	$: filteredCategories = categories
		.filter((category) => {
			const matchesSearch =
				category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				category.slug.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesSearch;
		})
		.sort((a, b) => {
			switch (sortBy) {
				case 'name':
					return a.name.localeCompare(b.name);
				case 'products':
					return b.productCount - a.productCount;
				case 'subcategories':
					return b.subcategories.length - a.subcategories.length;
				default:
					return 0;
			}
		});

	function toggleExpanded(id: number) {
		const category = categories.find((c) => c.id === id);
		if (category) {
			category.isExpanded = !category.isExpanded;
			categories = categories;
		}
	}

	function deleteCategory(id: number) {
		if (confirm('Are you sure you want to delete this category?')) {
			categories = categories.filter((c) => c.id !== id);
		}
	}

	function deleteSubcategory(categoryId: number, subcategoryId: number) {
		if (confirm('Are you sure you want to delete this subcategory?')) {
			const category = categories.find((c) => c.id === categoryId);
			if (category) {
				category.subcategories = category.subcategories.filter((s) => s.id !== subcategoryId);
				categories = categories;
			}
		}
	}

	onMount(() => {
		// Load categories from API if needed
	});
</script>

<div class="min-h-screen bg-base-200">
	<div class="mx-auto">
		<!-- Header with Filters -->
		<div
			class="bg-gradient-to-r from-primary to-primary/80 rounded-lg shadow-lg p-4 mb-6 text-primary-content"
		>
			<div class="flex justify-between items-center gap-4 mb-4">
				<div>
					<h1 class="text-2xl font-bold">Categories</h1>
					<p class="text-primary-content/80 text-sm">Manage product categories and subcategories</p>
				</div>
				<button class="btn btn-secondary btn-sm shadow-md hover:shadow-lg transition-shadow gap-2">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Add Category
				</button>
			</div>

			<!-- Filters Section -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-2">
				<!-- Search -->
				<div class="form-control md:col-span-2">
					<input
						type="text"
						placeholder="Search categories..."
						class="input input-bordered input-xs w-full bg-white/90 text-base-content placeholder-base-content/50"
						bind:value={searchQuery}
					/>
				</div>

				<!-- Sort By -->
				<div class="form-control">
					<select
						class="select select-bordered select-xs w-full bg-white/90 text-base-content"
						bind:value={sortBy}
					>
						<option value="name">Sort by Name</option>
						<option value="products">Most Products</option>
						<option value="subcategories">Most Subcategories</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Categories List -->
		<div class="space-y-3">
			{#if filteredCategories.length > 0}
				{#each filteredCategories as category (category.id)}
					<div class="bg-base-100 rounded-lg shadow-sm overflow-hidden">
						<!-- Main Category Header -->
						<div
							class="flex items-center gap-4 p-4 hover:bg-base-200/50 transition-colors cursor-pointer border-b border-base-200"
						>
							<button
								on:click={() => toggleExpanded(category.id)}
								class="btn btn-ghost btn-xs btn-circle"
								title={category.isExpanded ? 'Collapse' : 'Expand'}
							>
								<svg
									class="w-4 h-4 transition-transform {category.isExpanded ? 'rotate-90' : ''}"
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
							</button>

							<div class="flex-1">
								<h2 class="text-lg font-semibold text-base-content">{category.name}</h2>
								<p class="text-sm text-base-content/60">{category.description}</p>
							</div>

							<div class="flex items-center gap-3">
								<div class="text-right">
									<p class="text-sm font-semibold text-base-content">{category.productCount}</p>
									<p class="text-xs text-base-content/60">Products</p>
								</div>
								<div class="divider divider-horizontal m-0 h-8"></div>
								<div class="text-right">
									<p class="text-sm font-semibold text-base-content">
										{category.subcategories.length}
									</p>
									<p class="text-xs text-base-content/60">Subcategories</p>
								</div>
								<div class="divider divider-horizontal m-0 h-8"></div>
							</div>

							<div class="flex gap-2">
								<button class="btn btn-ghost btn-xs" title="Edit category">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</button>
								<button
									on:click={() => deleteCategory(category.id)}
									class="btn btn-ghost btn-xs text-error"
									title="Delete category"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							</div>
						</div>

						<!-- Subcategories -->
						{#if category.isExpanded && category.subcategories.length > 0}
							<div class="bg-base-200/30">
								{#each category.subcategories as subcategory (subcategory.id)}
									<div
										class="flex items-center gap-4 p-4 border-b border-base-200 last:border-b-0 hover:bg-base-200/50 transition-colors ml-8"
									>
										<div class="flex-1">
											<h3 class="font-medium text-base-content">{subcategory.name}</h3>
											<p class="text-sm text-base-content/60">{subcategory.description}</p>
										</div>

										<div class="text-right mr-2">
											<p class="text-sm font-semibold text-base-content">
												{subcategory.productCount}
											</p>
											<p class="text-xs text-base-content/60">Products</p>
										</div>

										<div class="flex gap-2">
											<button class="btn btn-ghost btn-xs" title="Edit subcategory">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</button>
											<button
												on:click={() => deleteSubcategory(category.id, subcategory.id)}
												class="btn btn-ghost btn-xs text-error"
												title="Delete subcategory"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										</div>
									</div>
								{/each}

								<!-- Add Subcategory -->
								<div class="p-4 border-t border-base-200">
									<button class="btn btn-ghost btn-xs btn-block">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4v16m8-8H4"
											/>
										</svg>
										Add Subcategory
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			{:else}
				<!-- Empty State -->
				<div class="bg-base-100 rounded-lg shadow-sm p-12 text-center">
					<svg
						class="mx-auto h-12 w-12 text-base-content/40 mb-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
						/>
					</svg>
					<h3 class="text-lg font-semibold text-base-content mb-1">No categories found</h3>
					<p class="text-base-content/60 mb-4">
						{#if searchQuery}
							Try adjusting your search terms.
						{:else}
							Start by creating your first category.
						{/if}
					</p>
					<button class="btn btn-primary btn-sm inline-flex items-center gap-2">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Add First Category
					</button>
				</div>
			{/if}
		</div>

		<!-- Statistics -->
		<div class="grid grid-cols-3 gap-4 mt-8">
			<div class="bg-base-100 rounded-lg shadow-sm p-4 text-center">
				<p class="text-3xl font-bold text-primary">{categories.length}</p>
				<p class="text-sm text-base-content/60">Total Categories</p>
			</div>
			<div class="bg-base-100 rounded-lg shadow-sm p-4 text-center">
				<p class="text-3xl font-bold text-primary">
					{categories.reduce((sum, c) => sum + c.subcategories.length, 0)}
				</p>
				<p class="text-sm text-base-content/60">Total Subcategories</p>
			</div>
			<div class="bg-base-100 rounded-lg shadow-sm p-4 text-center">
				<p class="text-3xl font-bold text-primary">
					{categories.reduce((sum, c) => sum + c.productCount, 0)}
				</p>
				<p class="text-sm text-base-content/60">Total Products</p>
			</div>
		</div>
	</div>
</div>
