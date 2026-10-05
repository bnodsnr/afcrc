<script lang="ts">
	import { getImageUrl } from '$lib/admin/utils/image';
	import { base } from '$lib/admin/paths';
	import type { Variation, VariationImage } from '$lib/admin/features/products/types/product';
	import { createEmptyVariation } from '$lib/admin/features/products/types/product';

	let { data } = $props();
	let variations = $state<Variation[]>([]);
	let isSaving = $state(false);
	let saveMessage = $state('');
	let showDialog = $state(false);
	let imagePreview = $state<string | null>(null);
	let imageInput: HTMLInputElement;
	// Modal state
	let modalOpen = $state(false);
	let modalMode = $state<'add' | 'edit'>('add');
	let editIndex = $state<number | null>(null);
	let modalImagePreview = $state<string>('');

	function openDialog() {
		showDialog = true;
	}

	function closeDialog() {
		showDialog = false;
	}

	// Form draft inside modal
	let draft = $state<Variation>(createEmptyVariation());

	function removeImage() {
		draft.image = null;
		imagePreview = null;
		if (imageInput) {
			imageInput.value = '';
		}
	}

	$effect(() => {
		const dataWithVariations = data as any;
		if (dataWithVariations?.variations && Array.isArray(dataWithVariations.variations)) {
			variations = JSON.parse(JSON.stringify(dataWithVariations.variations));
		} else {
			variations = [createEmptyVariation()];
		}
	});

	function openAddModal() {
		draft = createEmptyVariation();
		modalImagePreview = '';
		modalMode = 'add';
		editIndex = null;
		modalOpen = true;
	}

	function openEditModal(index: number) {
		draft = JSON.parse(JSON.stringify(variations[index]));
		modalImagePreview = draft.image ? previewUrl(draft.image) : '';
		modalMode = 'edit';
		editIndex = index;
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
	}

	function handleModalImageChange(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		draft = {
			...draft,
			image: {
				...(draft.image || {}),
				file,
				alt_text: draft.name || ''
			}
		};
		modalImagePreview = URL.createObjectURL(file);
	}

	function submitModal() {
		if (modalMode === 'add') {
			variations = [...variations, { ...draft }];
		} else if (modalMode === 'edit' && editIndex !== null) {
			const updated = [...variations];
			updated[editIndex] = { ...draft };
			variations = updated;
		}
		closeModal();
	}

	function removeVariation(index: number) {
		variations = variations.filter((_, i) => i !== index);
	}

	function previewUrl(image: VariationImage | undefined | null): string {
		if (!image) return '';
		if (image.file) return URL.createObjectURL(image.file);
		if (image.path) return getImageUrl(image.path);
		return '';
	}

	async function handleSave() {
		isSaving = true;
		saveMessage = '';
		try {
			saveMessage = 'Variations saved successfully!';
			setTimeout(() => (saveMessage = ''), 3000);
		} catch (err) {
			saveMessage = 'Failed to save variations';
			console.error(err);
		} finally {
			isSaving = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
			closeModal();
		}
	}
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
			<span class="text-base-content/60">Product Variations</span>
		</div>
		<div class="mb-6 rounded-lg">
			<div class="mb-4 flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Product Variations</h1>
					<p class="text-sm">Manage your product variations</p>
				</div>
				<button
					class="btn gap-2 shadow-md transition-shadow btn-sm btn-primary hover:shadow-lg"
					onclick={openDialog}
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Add New Variation
				</button>
			</div>
		</div>
		<div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
			<table class="table">
				<thead>
					<tr>
						<th class="col-sn">#</th>
						<th class="col-img">Image</th>
						<th class="col-name">Name</th>
						<th class="col-color">Color</th>
						<th class="col-price">Price</th>
						<th class="col-price">Regular</th>
						<th class="col-price">Sale</th>
						<th class="col-weight">Weight</th>
						<th class="col-actions">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each variations as variation, index (index)}
						<tr>
							<!-- SN -->
							<td class="td-sn">{index + 1}</td>

							<!-- Image -->
							<td class="td-img">
								{#if variation.image}
									<img
										src={previewUrl(variation.image)}
										alt={variation.image.alt_text || variation.name}
										class="variation-thumb"
									/>
								{:else}
									<div
										class="variation-thumb-placeholder"
										style="background: {variation.color
											? variation.color + '22'
											: 'var(--color-background-secondary)'};"
									>
										{#if variation.color}
											<span class="color-dot-lg" style="background: {variation.color};"></span>
										{:else}
											<svg
												width="16"
												height="16"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												style="opacity:0.3;"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
												/>
											</svg>
										{/if}
									</div>
								{/if}
							</td>

							<!-- Name -->
							<td class="td-name">
								<span class="variation-name">{variation.name || '—'}</span>
							</td>

							<!-- Color -->
							<td class="td-color">
								{#if variation.color}
									<div class="color-cell">
										<span class="color-swatch" style="background: {variation.color};"></span>
										<span class="color-hex">{variation.color}</span>
									</div>
								{:else}
									<span class="empty-cell">—</span>
								{/if}
							</td>

							<!-- Price -->
							<td class="td-price">
								{#if variation.price}
									<span class="price-main">${Number(variation.price).toFixed(2)}</span>
								{:else}
									<span class="empty-cell">—</span>
								{/if}
							</td>

							<!-- Regular Price -->
							<td class="td-price">
								{#if variation.regular_price}
									{#if variation.sales_price}
										<span class="price-strike">${Number(variation.regular_price).toFixed(2)}</span>
									{:else}
										<span class="price-main">${Number(variation.regular_price).toFixed(2)}</span>
									{/if}
								{:else}
									<span class="empty-cell">—</span>
								{/if}
							</td>

							<!-- Sale Price -->
							<td class="td-price">
								{#if variation.sales_price}
									<div class="sale-cell">
										<span class="price-sale">${Number(variation.sales_price).toFixed(2)}</span>
										<span class="badge-sale">Sale</span>
									</div>
								{:else}
									<span class="empty-cell">—</span>
								{/if}
							</td>

							<!-- Weight -->
							<td class="td-weight">
								{#if variation.weight}
									<span class="weight-val"
										>{variation.weight}<span class="weight-unit">g</span></span
									>
								{:else}
									<span class="empty-cell">—</span>
								{/if}
							</td>

							<!-- Actions -->
							<td class="td-actions">
								<div class="actions-row">
									<button
										type="button"
										class="btn-action btn-edit"
										title="Edit variation"
										aria-label="Edit {variation.name}"
										onclick={() => openEditModal(index)}
									>
										<svg
											width="14"
											height="14"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
									</button>
									<button
										type="button"
										class="btn-action btn-delete"
										title="Remove variation"
										aria-label="Remove {variation.name}"
										onclick={() => removeVariation(index)}
									>
										<svg
											width="14"
											height="14"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
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

					{#if variations.length === 0}
						<tr>
							<td colspan="9" class="empty-state">
								<svg
									width="32"
									height="32"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									style="margin-bottom:8px; opacity:0.3;"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
									/>
								</svg>
								<p style="margin:0; font-size:13px; color: var(--color-text-secondary);">
									No variations yet
								</p>
								<button class="btn-add" style="margin-top:12px;" onclick={openAddModal}
									>Add first variation</button
								>
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
			<!-- <div class="table-wrapper"> -->
			<!-- <div class="table-scroll">
					
				</div>
				{#if variations.length > 0}
					<button class="add-row-btn" onclick={openAddModal}>
						<svg
							width="14"
							height="14"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Add variation
					</button>
				{/if} -->
			<!-- </div> -->
		</div>
	</div>
</div>
<!-- Add Category Dialog -->
<div
	class="modal {showDialog ? 'modal-open' : ''}"
	style="display: {showDialog ? 'flex' : 'none'};"
>
	<div class="modal-box">
		<form method="POST" enctype="multipart/form-data" class="space-y-4"></form>
	</div>
	<form method="dialog" class="modal-backdrop" onclick={closeDialog}>
		<button>close</button>
	</form>
</div>
