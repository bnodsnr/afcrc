<script lang="ts">
	import { base } from '$lib/admin/paths';
	import { enhance } from '$app/forms';
	import { getImageUrl } from '$lib/admin/utils/image';
	interface SubCategory {
		id: number;
		name: string;
		slug: string;
		seo_slug?: string;
		mainCategoryId: number;
		description: string;
		image?: string;
		isActive: boolean;
		categoryName?: string;
		productCount?: number;
		created?: string;
	}

	interface FormData {
		name: string;
		slug: string;
		mainCategoryId: number;
		description: string;
		image: File | null;
		isActive: boolean;
	}

	let { data } = $props();

	let mainCategories = $state<{ id: number; name: string }[]>(
		Array.isArray(data?.categories) ? data.categories : []
	);

	function mapSubcategory(sub: any): SubCategory {
		return {
			id: sub.id,
			name: sub.name,
			slug: sub.slug ?? '',
			seo_slug: sub.seo_slug ?? '',
			mainCategoryId: sub.category?.id ?? sub.category_id ?? sub.mainCategoryId ?? 0,
			description: sub.description ?? '',
			image: sub.featured_image ?? undefined,
			isActive: sub.is_active ?? sub.isActive ?? true,
			categoryName: sub.category?.name ?? '—',
			productCount: sub.product_count ?? sub.productCount ?? 0,
			created: sub.created_at ?? sub.created ?? new Date().toISOString().split('T')[0]
		};
	}

	// Use a plain array in $state — reassign the whole array for reactivity
	let subcategories = $state<SubCategory[]>(
		Array.isArray(data?.subcategories) ? data.subcategories.map(mapSubcategory) : []
	);

	// Keep local state in sync when data is reloaded (e.g. invalidateAll)
	$effect(() => {
		const incomingCategories = data?.categories;
		mainCategories = Array.isArray(incomingCategories) ? incomingCategories : [];
		const incomingSubcategories = data?.subcategories;
		subcategories = Array.isArray(incomingSubcategories)
			? incomingSubcategories.map(mapSubcategory)
			: [];
	});

	// ── Filters (plain $state, NOT called as functions) ──────────────────────
	let searchQuery = $state('');
	let filterStatus = $state('all');
	let filterMainCategory = $state('all');
	let sortBy = $state('created');

	// ── Dialog / form ─────────────────────────────────────────────────────────
	let showDialog = $state(false);
	let isEditMode = $state(false);
	let editingSubcategoryId = $state<number | null>(null);
	let imagePreview = $state<string | null>(null);
	let imageInput: HTMLInputElement;

	let formData = $state<FormData>({
		name: '',
		slug: '',
		mainCategoryId: mainCategories[0]?.id ?? 0,
		description: '',
		image: null,
		isActive: true
	});

	// ── Derived filtered + sorted list ────────────────────────────────────────
	const filteredSubcategories = $derived(
		subcategories
			.filter((sub) => {
				// FIX: searchQuery is a string, not a function
				const q = searchQuery.toLowerCase();
				const matchesSearch =
					sub.name.toLowerCase().includes(q) || sub.slug.toLowerCase().includes(q);

				const matchesStatus =
					filterStatus === 'all' || (filterStatus === 'active' ? sub.isActive : !sub.isActive);

				// FIX: only parseInt when the value is not 'all'
				const matchesMainCategory =
					filterMainCategory === 'all' || sub.mainCategoryId === parseInt(filterMainCategory, 10);

				return matchesSearch && matchesStatus && matchesMainCategory;
			})
			.sort((a, b) => {
				if (sortBy === 'name') return a.name.localeCompare(b.name);
				if (sortBy === 'products') return (b.productCount ?? 0) - (a.productCount ?? 0);
				return new Date(b.created ?? 0).getTime() - new Date(a.created ?? 0).getTime();
			})
	);

	// ── Helpers ───────────────────────────────────────────────────────────────
	function generateSlug(name: string) {
		return name
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');
	}

	function handleNameChange() {
		formData.slug = generateSlug(formData.name);
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
		if (imageInput) imageInput.value = '';
	}

	function openDialog() {
		isEditMode = false;
		editingSubcategoryId = null;
		resetForm();
		showDialog = true;
	}

	function openEditDialog(subcategory: SubCategory) {
		isEditMode = true;
		editingSubcategoryId = subcategory.id;
		formData = {
			name: subcategory.name,
			slug: subcategory.slug,
			mainCategoryId: subcategory.mainCategoryId,
			description: subcategory.description,
			image: null,
			isActive: subcategory.isActive
		};
		if (subcategory.image) {
			imagePreview = subcategory.image;
		}
		showDialog = true;
	}

	function closeDialog() {
		showDialog = false;
		isEditMode = false;
		editingSubcategoryId = null;
		resetForm();
	}

	function resetForm() {
		formData = {
			name: '',
			slug: '',
			mainCategoryId: mainCategories[0]?.id ?? 0,
			description: '',
			image: null,
			isActive: true
		};
		imagePreview = null;
		if (imageInput) imageInput.value = '';
	}

	async function deleteSubcategory(id: number) {
		if (!confirm('Are you sure you want to delete this subcategory?')) return;

		const previous = subcategories;
		// Optimistic update
		subcategories = subcategories.filter((c) => c.id !== id);

		try {
			const body = new FormData();
			body.append('category_id', String(id));
			const res = await fetch('?/delete', { method: 'POST', body });
			if (!res.ok) throw new Error('Delete failed');
		} catch {
			// Revert on failure
			subcategories = previous;
			addToast('Failed to delete subcategory', 'error');
		}
	}

	async function toggleStatus(id: number) {
		const target = subcategories.find((c) => c.id === id);
		if (!target) return;
		const newValue = !target.isActive;

		// Optimistic update
		subcategories = subcategories.map((c) => (c.id === id ? { ...c, isActive: newValue } : c));

		try {
			const body = new FormData();
			body.append('category_id', String(id));
			body.append('is_active', String(!newValue));
			const res = await fetch('?/toggleStatus', { method: 'POST', body });
			if (!res.ok) throw new Error('Toggle failed');
		} catch {
			// Revert on failure
			subcategories = subcategories.map((c) => (c.id === id ? { ...c, isActive: !newValue } : c));
			addToast('Failed to update status', 'error');
		}
	}

	function formatDate(dateString: string) {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function clearFilters() {
		searchQuery = '';
		filterStatus = 'all';
		filterMainCategory = 'all';
		sortBy = 'created';
	}

	// ── Toast ─────────────────────────────────────────────────────────────────
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

	// ── Form enhance handler ──────────────────────────────────────────────────
	function handleFormSubmit() {
		return async ({ result, update }: any) => {
			if (result.type === 'success') {
				// Handle both { subcategory } and { data } shapes from server action
				const raw = result.data?.subcategory ?? result.data?.data ?? result.data;
				if (raw && raw.id) {
					const mapped = mapSubcategory(raw);
					if (isEditMode && editingSubcategoryId) {
						// Update existing subcategory
						subcategories = subcategories.map((c) => (c.id === editingSubcategoryId ? mapped : c));
						addToast('Subcategory updated successfully!', 'success');
					} else {
						// Create new subcategory
						subcategories = [mapped, ...subcategories];
						addToast('Subcategory created successfully!', 'success');
					}
				} else {
					const message = isEditMode
						? 'Updated! Refresh to see changes.'
						: 'Created! Refresh to see updated list.';
					addToast(message, 'info');
				}
				showDialog = false;
				isEditMode = false;
				editingSubcategoryId = null;
				resetForm();
				// Do NOT call update() on success — it would re-run the action result
			} else if (result.type === 'failure') {
				const errorMsg = isEditMode
					? 'Failed to update subcategory'
					: 'Failed to create subcategory';
				addToast(result.data?.error ?? errorMsg, 'error');
				await update({ reset: false });
			} else {
				await update({ reset: false });
			}
		};
	}

	const isFiltered = $derived(
		searchQuery !== '' || filterStatus !== 'all' || filterMainCategory !== 'all'
	);
</script>

<!-- Toast notifications -->
<div class="toast-top toast-end toast z-50">
	{#each toasts as toast (toast.id)}
		<div
			class="alert {toast.type === 'success'
				? 'alert-success'
				: toast.type === 'error'
					? 'alert-error'
					: 'alert-info'}"
		>
			<span>{toast.message}</span>
		</div>
	{/each}
</div>

<div class="min-h-screen">
	<div class="mx-auto">
		<!-- Breadcrumb -->
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
			<span class="text-base-content/60">Sub Categories</span>
		</div>

		<!-- ── Header ─────────────────────────────────────────────────────────── -->
		<div class="bg mb-4 rounded-lg">
			<div class="flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Sub Categories</h1>
					<p class="text-sm">
						{subcategories.length} total · {filteredSubcategories.length} shown
					</p>
				</div>
				<button onclick={openDialog} class="btn-default btn gap-2 shadow-md btn-sm hover:shadow-lg">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

		<!-- ── Filter form (separate from the create form) ────────────────────── -->
		<form class="mb-4 rounded-lg" onsubmit={(e) => e.preventDefault()}>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-5">
				<!-- Search -->
				<div class="form-control md:col-span-2">
					<label class="label pb-1">
						<span class="label-text text-xs font-semibold tracking-wide uppercase">Search</span>
					</label>
					<input
						type="text"
						placeholder="Name or slug…"
						class="input-bordered input input-sm w-full"
						bind:value={searchQuery}
					/>
				</div>

				<!-- Category filter -->
				<div class="form-control">
					<label class="label pb-1">
						<span class="label-text text-xs font-semibold tracking-wide uppercase">Category</span>
					</label>
					<select class="select-bordered select w-full select-sm" bind:value={filterMainCategory}>
						<option value="all">All Categories</option>
						{#each mainCategories as category}
							<option value={String(category.id)}>{category.name}</option>
						{/each}
					</select>
				</div>

				<!-- Status filter -->
				<div class="form-control">
					<label class="label pb-1">
						<span class="label-text text-xs font-semibold tracking-wide uppercase">Status</span>
					</label>
					<select class="select-bordered select w-full select-sm" bind:value={filterStatus}>
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>

				<!-- Sort -->
				<div class="form-control">
					<label class="label pb-1">
						<span class="label-text text-xs font-semibold tracking-wide uppercase">Sort by</span>
					</label>
					<select class="select-bordered select w-full select-sm" bind:value={sortBy}>
						<option value="created">Recently Created</option>
						<option value="name">Name (A–Z)</option>
						<option value="products">Most Products</option>
					</select>
				</div>
			</div>

			<!-- Active filter chips + clear button -->
			{#if isFiltered}
				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span class="text-xs text-base-content/50">Active filters:</span>
					{#if searchQuery}
						<span class="badge gap-1 badge-outline badge-sm">
							"{searchQuery}"
							<button type="button" onclick={() => (searchQuery = '')} class="ml-1 font-bold"
								>×</button
							>
						</span>
					{/if}
					{#if filterStatus !== 'all'}
						<span class="badge gap-1 badge-outline badge-sm">
							{filterStatus}
							<button type="button" onclick={() => (filterStatus = 'all')} class="ml-1 font-bold"
								>×</button
							>
						</span>
					{/if}
					{#if filterMainCategory !== 'all'}
						<span class="badge gap-1 badge-outline badge-sm">
							{mainCategories.find((c: any) => String(c.id) === filterMainCategory)?.name ??
								filterMainCategory}
							<button
								type="button"
								onclick={() => (filterMainCategory = 'all')}
								class="ml-1 font-bold">×</button
							>
						</span>
					{/if}
					<button type="button" onclick={clearFilters} class="btn text-error btn-ghost btn-xs">
						Clear all
					</button>
				</div>
			{/if}
		</form>

		<!-- ── Table ──────────────────────────────────────────────────────────── -->
		<div class="overflow-hidden rounded-lg bg-base-100 shadow-sm">
			{#if filteredSubcategories.length > 0}
				<div class="overflow-x-auto">
					<table class="table w-full table-zebra">
						<thead class="bg-base-200">
							<tr>
								<th class="text-left">Subcategory</th>
								<th class="text-left">Category</th>
								<th class="text-left">Description</th>
								<th class="text-center">Products</th>
								<th class="text-center">Status</th>
								<th class="text-left">Created</th>
								<th class="text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredSubcategories as sub (sub.id)}
								<tr>
									<!-- Name + slug + image -->
									<td>
										<div class="flex items-center gap-3">
											{#if sub.image}
												<div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
													<img
														src={getImageUrl(sub.image)}
														alt={sub.name}
														class="h-full w-full object-cover"
													/>
												</div>
											{:else}
												<div
													class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-base-200"
												>
													<svg
														class="h-5 w-5 text-base-content/40"
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
											<div>
												<p class="font-medium text-base-content">{sub.name}</p>
												<p class="text-xs text-base-content/50">{sub.slug}</p>
											</div>
										</div>
									</td>

									<!-- Category -->
									<td>
										<span class="badge badge-outline badge-sm">{sub.categoryName}</span>
									</td>

									<!-- Description -->
									<td>
										<p class="max-w-xs truncate text-sm text-base-content/70">
											{sub.description || '—'}
										</p>
									</td>

									<!-- Product count -->
									<td class="text-center">
										<span class="badge badge-outline badge-sm">{sub.productCount ?? 0}</span>
									</td>

									<!-- Status — shows live reactive value -->
									<td class="text-center">
										<span class="badge badge-sm {sub.isActive ? 'badge-success' : 'badge-ghost'}">
											{sub.isActive ? 'Active' : 'Inactive'}
										</span>
									</td>

									<!-- Created -->
									<td class="text-sm whitespace-nowrap text-base-content/70">
										{formatDate(sub.created ?? '')}
									</td>

									<!-- Actions -->
									<td class="text-center">
										<div class="flex justify-center gap-1">
											<!-- Toggle active -->
											<button
												type="button"
												onclick={() => toggleStatus(sub.id)}
												class="tooltip btn btn-square btn-xs btn-warning"
												data-tip={sub.isActive ? 'Deactivate' : 'Activate'}
											>
												{#if sub.isActive}
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

											<!-- Edit -->
											<button
												type="button"
												onclick={() => openEditDialog(sub)}
												class="tooltip btn btn-square btn-xs btn-info"
												data-tip="Edit"
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

											<!-- Delete -->
											<button
												type="button"
												onclick={() => deleteSubcategory(sub.id)}
												class="tooltip btn btn-square text-white btn-xs btn-error"
												data-tip="Delete"
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

				<div class="border-t border-base-300 px-4 py-3">
					<p class="text-sm text-base-content/60">
						Showing <strong>{filteredSubcategories.length}</strong> of
						<strong>{subcategories.length}</strong> subcategories
					</p>
				</div>
			{:else}
				<div class="p-12 text-center">
					<svg
						class="mx-auto mb-4 h-12 w-12 text-base-content/30"
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
					<h3 class="mb-1 text-lg font-semibold">No subcategories found</h3>
					<p class="mb-4 text-sm text-base-content/60">
						{#if isFiltered}
							Try adjusting your filters or search terms.
						{:else}
							Start by creating your first subcategory.
						{/if}
					</p>
					{#if isFiltered}
						<button type="button" onclick={clearFilters} class="btn mr-2 btn-outline btn-sm">
							Clear Filters
						</button>
					{/if}
					<button type="button" onclick={openDialog} class="btn gap-2 btn-sm btn-primary">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
			{/if}
		</div>
	</div>
</div>

<!-- ── Create Subcategory Modal ────────────────────────────────────────────── -->
{#if showDialog}
	<div class="modal-open modal">
		<form
			action={isEditMode ? `?/update&id=${editingSubcategoryId}` : '?/create'}
			method="POST"
			enctype="multipart/form-data"
			class="modal-box w-full max-w-2xl space-y-4"
			use:enhance={handleFormSubmit}
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-bold">{isEditMode ? 'Edit Subcategory' : 'Add New Subcategory'}</h3>
				<button type="button" onclick={closeDialog} class="btn btn-circle btn-ghost btn-sm"
					>✕</button
				>
			</div>

			<div class="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
				<!-- Main Category -->
				<div class="form-control">
					<label class="label" for="mc-select">
						<span class="label-text font-medium">Main Category *</span>
					</label>
					<select
						id="mc-select"
						name="mainCategoryId"
						class="select-bordered select w-full"
						bind:value={formData.mainCategoryId}
					>
						{#each mainCategories as category}
							<option value={category.id}>{category.name}</option>
						{/each}
					</select>
				</div>

				<!-- Name -->
				<div class="form-control">
					<label class="label" for="sub-name">
						<span class="label-text font-medium">Subcategory Name *</span>
					</label>
					<input
						id="sub-name"
						type="text"
						name="name"
						placeholder="Enter subcategory name"
						class="input-bordered input w-full"
						bind:value={formData.name}
						oninput={handleNameChange}
						required
					/>
				</div>

				<!-- Slug preview (read-only, sent as hidden) -->
				{#if formData.slug}
					<p class="text-xs text-base-content/50">
						Slug: <code class="rounded bg-base-200 px-1">{formData.slug}</code>
					</p>
				{/if}
				<input type="hidden" name="slug" value={formData.slug} />

				<!-- Description -->
				<div class="form-control">
					<label class="label" for="sub-desc">
						<span class="label-text font-medium">Description</span>
					</label>
					<textarea
						id="sub-desc"
						name="description"
						placeholder="Enter subcategory description"
						class="textarea-bordered textarea w-full"
						rows="3"
						bind:value={formData.description}
					></textarea>
				</div>

				<!-- Image upload -->
				<div class="form-control">
					<label class="label">
						<span class="label-text font-medium">Subcategory Image</span>
					</label>
					<div class="rounded-lg border-2 border-dashed border-base-300 p-4 text-center">
						{#if imagePreview}
							<div class="relative inline-block w-full">
								<img src={getImageUrl(imagePreview)} alt="Preview" class="h-40 w-full rounded-lg object-cover" />
								<button
									type="button"
									class="btn absolute -top-2 -right-2 btn-circle btn-sm btn-error"
									onclick={removeImage}>×</button
								>
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
								<p class="text-xs">PNG, JPG, GIF up to 10 MB</p>
							</div>
						{/if}
						<input
							type="file"
							name="image"
							class="hidden"
							accept="image/*"
							bind:this={imageInput}
							onchange={handleImageUpload}
						/>
						<button
							type="button"
							class="btn mt-2 btn-sm btn-primary"
							onclick={() => imageInput?.click()}
						>
							{imagePreview ? 'Change Image' : 'Upload Image'}
						</button>
					</div>
				</div>

				<!-- Active toggle -->
				<!-- FIX: send a real value regardless of checkbox state -->
				<input type="hidden" name="isActive" value={formData.isActive ? 'true' : 'false'} />
				<div class="form-control">
					<label class="label cursor-pointer" for="is-active">
						<span class="label-text font-medium">Active</span>
						<input
							id="is-active"
							type="checkbox"
							class="toggle toggle-primary"
							bind:checked={formData.isActive}
						/>
					</label>
				</div>
			</div>

			<div class="modal-action mt-6">
				<button type="button" onclick={closeDialog} class="btn btn-ghost">Cancel</button>
				<button type="submit" class="btn gap-2 btn-primary">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					{isEditMode ? 'Update Subcategory' : 'Add Subcategory'}
				</button>
			</div>
		</form>
		<div class="modal-backdrop" onclick={closeDialog}></div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: -1;
	}
</style>
