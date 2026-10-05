<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { enhance } from '$app/forms';
	import { getImageUrl } from '$lib/admin/utils/image';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	interface MainCategory {
		id: number;
		name: string;
		seo_slug: string;
		description: string;
		image?: string;
		productCount: number;
		is_active: boolean;
		created: string;
		featured_image?: string;
	}
	let categories = $state<MainCategory[]>(Array.isArray(data?.categories) ? data.categories : []);

	// Keep local state in sync when data is reloaded (e.g. invalidateAll)
	$effect(() => {
		const incoming = data?.categories;
		categories = Array.isArray(incoming) ? incoming : [];
	});

	interface FormData {
		name: string;
		seo_slug: string;
		description: string;
		image: File | null;
		is_active: boolean;
	}
	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let filterStatus = $state('all');
	let sortBy = $state('created');
	let showDialog = $state(false);
	let imagePreview = $state<string | null>(null);
	let imageInput: HTMLInputElement;
	let editingCategoryId = $state<number | null>(null);
	let pageLoading = $state(false);
	let isLoading = $state(false);

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

	let formData = $state<FormData>({
		name: '',
		seo_slug: '',
		description: '',
		image: null,
		is_active: true
	});

	let filteredCategories = $derived(
		(Array.isArray(categories) ? categories : [])
			.filter((category) => {
				const matchesSearch =
					category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					category.seo_slug.toLowerCase().includes(searchQuery.toLowerCase());
				const matchesCategory =
					selectedCategory === 'all' || category.id === Number(selectedCategory);
				const matchesStatus =
					filterStatus === 'all' ||
					(filterStatus === 'active' ? category.is_active : !category.is_active);
				return matchesSearch && matchesCategory && matchesStatus;
			})
			.sort((a, b) => {
				switch (sortBy) {
					case 'created':
						return new Date(b.created).getTime() - new Date(a.created).getTime();
					case 'name':
						return a.name.localeCompare(b.name);
					case 'products':
						return b.productCount - a.productCount;
					default:
						return 0;
				}
			})
	);

	function generateSlug(name: string) {
		return name
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');
	}

	function handleNameChange() {
		formData.seo_slug = generateSlug(formData.name);
	}

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			formData.image = target.files[0];
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(formData.image);
		}
	}

	function removeImage() {
		formData.image = null;
		imagePreview = null;
		if (imageInput) {
			imageInput.value = '';
		}
	}

	function openDialog(category?: MainCategory) {
		showDialog = true;
		if (category) {
			editingCategoryId = category.id;
			formData = {
				name: category.name,
				seo_slug: category.seo_slug,
				description: category.description,
				image: null,
				is_active: category.is_active
			};
			imagePreview = category.featured_image || null;
		} else {
			editingCategoryId = null;
			resetForm();
		}
	}

	function closeDialog() {
		showDialog = false;
		resetForm();
		editingCategoryId = null;
	}

	function resetForm() {
		formData = {
			name: '',
			seo_slug: '',
			description: '',
			image: null,
			is_active: true
		};
		imagePreview = null;
		if (imageInput) {
			imageInput.value = '';
		}
	}

	async function deleteCategory(id: number) {
		if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
			return;
		}

		isLoading = true;

		try {
			const formData = new FormData();
			formData.append('category_id', id.toString());

			const response = await fetch('?/delete', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const result = await response.json();
				categories = categories.filter((c) => c.id !== id);
				addToast('Category deleted successfully', 'success');
			} else {
				const data = await response.json();

				addToast(`Failed to delete category: ${data.error || 'Unknown error'}`, 'error');
			}
		} catch (error) {
			addToast(
				`Error deleting category: ${error instanceof Error ? error.message : 'Unknown error'}`,
				'error'
			);
		} finally {
			isLoading = false;
		}
	}

	function toggleStatus(id: number) {
		const category = categories.find((c) => c.id === id);
		if (category) {
			category.is_active = !category.is_active;
			categories = categories;
		}
	}

	function handleFormSubmit({ formData }: any) {
		return async ({ result }: any) => {
			if (result.type === 'success') {
				addToast('Category saved successfully.', 'success');
				pageLoading = true;
				const savedCategory = result.data.category;

				// ✅ Update source data
				const index = categories.findIndex((c) => c.id === savedCategory.id);

				if (index !== -1) {
					// update existing
					categories = categories.map((c) => (c.id === savedCategory.id ? savedCategory : c));
				} else {
					// add new
					categories = [savedCategory, ...categories];
				}
				closeDialog();
				try {
					// Re-run all load functions to refresh categories from server
					await invalidateAll();
				} catch (err) {
					addToast('Could not refresh data.', 'error');
				} finally {
					pageLoading = false;
				}
			} else if (result.type === 'failure') {
				addToast('Failed to save category.', 'error');
			}
		};
	}

	onMount(() => {
		// Load categories from API if needed
	});
</script>

<div class="min-h-screen">
	<div class="mx-auto">
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
			<span class="text-base-content/60">Categories</span>
		</div>
		<!-- Header with Filters -->
		<div class="mb-6 rounded-lg">
			<div class="mb-4 flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Main Categories</h1>
					<p class="text-sm">Manage your main product categories</p>
				</div>
				<button
					onclick={() => openDialog()}
					class="btn flex-nowrap gap-2 border-base-content bg-base-content text-base-100 transition-shadow btn-sm hover:border-base-content hover:bg-base-content/90 hover:shadow-lg"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
		</div>

		<form class="mb-4 rounded-lg" onsubmit={(e) => e.preventDefault()}>
			<div class="flex flex-wrap items-end gap-2">
				<!-- Search -->
				<div class="form-control min-w-40 flex-1">
					<input
						type="text"
						placeholder="Search name or slug…"
						class="input-bordered input w-full input-sm"
						bind:value={searchQuery}
					/>
				</div>

				<!-- Category filter -->
				<div class="form-control min-w-36 flex-1">
					<select class="select-bordered select w-full select-sm" bind:value={selectedCategory}>
						<option value="all">All Categories</option>
						{#each filteredCategories as category}
							<option value={String(category.id)}>{category.name}</option>
						{/each}
					</select>
				</div>

				<!-- Status filter -->
				<div class="form-control min-w-32">
					<select class="select-bordered select w-full select-sm" bind:value={filterStatus}>
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>

				<!-- Sort -->
				<div class="form-control min-w-40">
					<select class="select-bordered select w-full select-sm" bind:value={sortBy}>
						<option value="created">Recently Created</option>
						<option value="name">Name (A–Z)</option>
						<option value="products">Most Products</option>
					</select>
				</div>

				<!-- Clear button -->
				<!-- {#if isFiltered}
					<button type="button" onclick={clearFilters} class="btn text-error btn-ghost btn-sm">
						Clear
					</button>
				{/if} -->
			</div>
		</form>
		<!-- Categories Table -->
		<div class="overflow-hidden rounded-lg bg-base-100 shadow-sm">
			{#if filteredCategories.length > 0}
				<div class="overflow-x-auto">
					<table class="table w-full table-zebra">
						<thead class="bg-base-200">
							<tr>
								<th class="text-left">Feature Image</th>
								<th class="text-left">Category Name</th>
								<th class="text-left">Description</th>
								<th class="text-center">Status</th>
								<th class="text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredCategories as category (category.id)}
								<tr>
									<td>
										{#if category.featured_image}
											<div class="h-14 w-14 overflow-hidden rounded-lg">
												<img
													src={getImageUrl(category.featured_image)}
													alt={category.name}
													class="h-full w-full object-cover"
												/>
											</div>
										{:else}
											<div
												class="flex h-14 w-14 items-center justify-center rounded-lg bg-base-200"
											>
												<svg
													class="h-6 w-6 text-base-content/40"
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
											</div>
										{/if}
									</td>
									<td>
										<div>
											<p class="font-medium text-base-content">{category.name}</p>
											<p class="text-xs text-base-content/60">{category.seo_slug}</p>
										</div>
									</td>
									<td>
										<p class="max-w-xs text-sm text-base-content/70">{category.description}</p>
									</td>
									<td class="text-center">
										<span
											class="badge badge-sm {category.is_active ? 'badge-success' : 'badge-gray'}"
										>
											{category.is_active ? 'Active' : 'Inactive'}
										</span>
									</td>
									<td class="text-center">
										<div class="flex justify-center gap-2">
											<button
												onclick={() => toggleStatus(category.id)}
												class="btn btn-square btn-warning btn-xs"
												title={category.is_active ? 'Deactivate' : 'Activate'}
											>
												{#if category.is_active}
													<svg class="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 20 20">
														<path
															fill-rule="evenodd"
															d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
															clip-rule="evenodd"
														/>
													</svg>
												{:else}
													<svg
														class="h-4 w-4 text-base-content/40"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												{/if}
											</button>
											<button
												onclick={() => openDialog(category)}
												class="btn btn-square text-white btn-info btn-xs"
												title="Edit category"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</button>
											<button
												onclick={() => deleteCategory(category.id)}
												class="btn btn-square text-white btn-error btn-xs"
												title="Delete category"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Results Info -->
				<div class="border-t border-base-300 p-4">
					<p class="text-sm text-base-content/60">
						Showing {filteredCategories.length} of {categories.length} categories
					</p>
				</div>
			{:else}
				<!-- Empty State -->
				<div class="p-12 text-center">
					<svg
						class="mx-auto mb-4 h-12 w-12 text-base-content/40"
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
					<h3 class="mb-1 text-lg font-semibold text-base-content">No categories found</h3>
					<p class="mb-4 text-base-content/60">
						{#if searchQuery || filterStatus !== 'all'}
							Try adjusting your filters or search terms.
						{:else}
							Start by creating your first category.
						{/if}
					</p>
					<button
						onclick={() => openDialog()}
						class="btn inline-flex items-center gap-2 btn-primary btn-sm"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Create First Category
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Toasts -->
<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
	{#each toasts as t (t.id)}
		<div
			class="max-w-xs rounded px-4 py-2 text-sm text-white shadow"
			style="background: {t.type === 'success'
				? 'linear-gradient(90deg,#16a34a,#059669)'
				: t.type === 'error'
					? 'linear-gradient(90deg,#dc2626,#b91c1c)'
					: 'linear-gradient(90deg,#3b82f6,#2563eb)'}"
		>
			{t.message}
		</div>
	{/each}
</div>

{#if pageLoading}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="flex flex-col items-center gap-3 rounded bg-white p-4 shadow">
			<svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
			</svg>
			<div class="text-sm font-medium">Reloading…</div>
		</div>
	</div>
{/if}

<!-- Add Category Dialog -->
<div
	class="modal {showDialog ? 'modal-open' : ''}"
	style="display: {showDialog ? 'flex' : 'none'};"
>
	<div class="modal-box w-full max-w-2xl">
		<form
			action={editingCategoryId ? '?/update' : '?/create'}
			method="POST"
			enctype="multipart/form-data"
			class="space-y-4"
			use:enhance={handleFormSubmit}
		>
			{#if editingCategoryId}
				<input type="hidden" name="category_id" value={editingCategoryId} />
			{/if}
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-bold">
					{editingCategoryId ? 'Edit' : 'Add New'} Category
				</h3>
				<button type="button" onclick={closeDialog} class="btn btn-circle btn-ghost btn-sm">
					✕
				</button>
			</div>

			<div class="max-h-96 space-y-4 overflow-y-auto">
				<!-- Category Name -->
				<div class="form-control">
					<label class="label" for="category_name">
						<span class="label-text font-medium">Category Name *</span>
					</label>
					<input
						type="text"
						id="category_name"
						name="category_name"
						placeholder="Enter category name"
						class="input-bordered input w-full"
						bind:value={formData.name}
						onchange={handleNameChange}
						required
					/>
				</div>
				<!-- Description -->
				<div class="form-control">
					<label class="label" for="category_description">
						<span class="label-text font-medium">Description</span>
					</label>
					<textarea
						id="category_description"
						name="category_description"
						placeholder="Enter category description"
						class="textarea-bordered textarea w-full"
						rows="3"
						bind:value={formData.description}></textarea>
				</div>

				<!-- Image Upload -->
				<div class="form-control">
					<label class="label" for="image">
						<span class="label-text font-medium">Category Image</span>
					</label>
					<div class="rounded-lg border-2 border-dashed border-base-300 p-4 text-center">
						{#if imagePreview}
							<div class="relative inline-block w-full">
								<img
									src={imagePreview}
									alt="Category preview"
									class="h-40 w-full rounded-lg object-cover"
								/>
								<button
									type="button"
									class="btn absolute -top-2 -right-2 btn-circle btn-error btn-sm"
									onclick={removeImage}
									title="Remove image"
								>
									×
								</button>
							</div>
						{:else}
							<div class="text-base-content/60">
								<svg
									class="mx-auto mb-2 h-8 w-8"
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
								<p class="font-medium">Click to upload image</p>
								<p class="text-xs">PNG, JPG, GIF up to 10MB</p>
							</div>
						{/if}
						<input
							type="file"
							id="image"
							name="image"
							class="hidden"
							accept="image/*"
							bind:this={imageInput}
							onchange={handleImageUpload}
						/>
						<button
							type="button"
							class="btn mt-2 btn-primary btn-sm"
							onclick={() => imageInput?.click()}
						>
							{imagePreview ? 'Change Image' : 'Upload Image'}
						</button>
					</div>
				</div>

				<!-- Active Status -->
				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text font-medium">Active</span>
						<input
							type="checkbox"
							name="is_active"
							class="toggle toggle-primary"
							bind:checked={formData.is_active}
						/>
					</label>
				</div>
			</div>

			<!-- Dialog Actions -->
			<div class="modal-action mt-6">
				<button type="button" onclick={closeDialog} class="btn btn-ghost"> Cancel </button>
				<button type="submit" class="btn btn-primary">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					{editingCategoryId ? 'Update Category' : 'Add Category'}
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop" onclick={closeDialog}>
		<button>close</button>
	</form>
</div>

<style>
	:global(.modal) {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;

		align-items: center;
		justify-content: center;
		z-index: 40;
	}

	/* :global(.modal.modal-open) {
		display: flex;
	}

	:global(.modal .modal-box) {
		position: relative;
		width: 90%;
		max-width: 500px;
		background-color: var(--color-base-100);
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	:global(.modal-backdrop) {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: transparent;
		cursor: pointer;
	} */
</style>
