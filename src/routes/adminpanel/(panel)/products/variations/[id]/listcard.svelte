<script lang="ts">
	import { getImageUrl } from '$lib/admin/utils/image';
	import { base } from '$lib/admin/paths';
	import type { Variation, VariationImage } from '$lib/admin/features/products/types/product';
	import { createEmptyVariation } from '$lib/admin/features/products/types/product';

	let { data } = $props();
	let variations = $state<Variation[]>([]);
	let isSaving = $state(false);
	let saveMessage = $state('');
	let dragOver = $state<number | null>(null);

	$effect(() => {
		const dataWithVariations = data as any;
		if (dataWithVariations?.variations && Array.isArray(dataWithVariations.variations)) {
			variations = JSON.parse(JSON.stringify(dataWithVariations.variations));
		} else {
			variations = [createEmptyVariation()];
		}
	});

	function addVariation() {
		variations = [...variations, createEmptyVariation()];
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

	function handleImageChange(index: number, event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const updated = [...variations];
		updated[index] = {
			...updated[index],
			image: {
				...(updated[index].image || {}),
				file,
				alt_text: updated[index].name || ''
			}
		};
		variations = updated;
	}

	function handleDrop(index: number, event: DragEvent) {
		event.preventDefault();
		dragOver = null;
		const file = event.dataTransfer?.files?.[0];
		if (!file || !file.type.startsWith('image/')) return;
		const updated = [...variations];
		updated[index] = {
			...updated[index],
			image: {
				...(updated[index].image || {}),
				file,
				alt_text: updated[index].name || ''
			}
		};
		variations = updated;
	}

	async function handleSave() {
		isSaving = true;
		saveMessage = '';
		try {
			saveMessage = 'success';
			setTimeout(() => (saveMessage = ''), 3000);
		} catch (err) {
			saveMessage = 'error';
			console.error(err);
		} finally {
			isSaving = false;
		}
	}

	function getVariationLabel(v: Variation, i: number): string {
		return v.name?.trim() || `Variation ${i + 1}`;
	}
</script>

<div class="page-bg">
	<div style="max-width: 860px; margin: 0 auto; padding: 32px 20px;">
		<!-- Breadcrumb -->
		<div class="breadcrumb" style="display:flex; align-items:center; gap:6px; margin-bottom:20px;">
			<a href={base}>Dashboard</a>
			<span>›</span>
			<a href={base + '/products'}>Products</a>
			<span>›</span>
			<span>Variations</span>
		</div>

		<!-- Page header -->
		<div class="page-header">
			<div>
				<h1>
					Product Variations
					<span class="count-pill" style="font-size:14px; margin-left:8px;"
						>{variations.length}</span
					>
				</h1>
				<p>Manage sizes, colors, weights and pricing for each variant</p>
			</div>
			<button class="btn-add-header" onclick={addVariation}>
				<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Add Variation
			</button>
		</div>

		<!-- Toast -->
		{#if saveMessage === 'success'}
			<div class="toast-success" style="margin-bottom:20px;">
				<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				Variations saved successfully!
			</div>
		{:else if saveMessage === 'error'}
			<div class="toast-error" style="margin-bottom:20px;">
				<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				Failed to save. Please try again.
			</div>
		{/if}

		<form method="POST" action="?/saveVariations" enctype="multipart/form-data">
			<div style="display:flex; flex-direction:column; gap:16px;">
				{#if variations.length === 0}
					<div class="var-card">
						<div class="empty-hint">
							<svg
								width="40"
								height="40"
								fill="none"
								viewBox="0 0 24 24"
								stroke="#c4b5fd"
								style="margin:0 auto 12px; display:block;"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
								/>
							</svg>
							No variations yet. Click <strong>Add Variation</strong> to get started.
						</div>
					</div>
				{/if}

				{#each variations as variation, index (index)}
					<div class="var-card">
						<div class="var-badge">{index + 1}</div>

						<!-- Card top: image + name/weight -->
						<div style="display:flex; gap:20px; padding:20px 20px 16px 20px; padding-left:62px;">
							<!-- Image zone -->
							<div>
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="image-zone"
									class:drag-active={dragOver === index}
									ondragover={(e) => {
										e.preventDefault();
										dragOver = index;
									}}
									ondragleave={() => (dragOver = null)}
									ondrop={(e) => handleDrop(index, e)}
									onclick={() => document.getElementById(`img-${index}`)?.click()}
									role="button"
									tabindex="0"
									onkeydown={(e) =>
										e.key === 'Enter' && document.getElementById(`img-${index}`)?.click()}
									aria-label="Upload variation image"
								>
									{#if variation.image && (variation.image.file || variation.image.path)}
										<img
											src={previewUrl(variation.image)}
											alt={variation.image.alt_text || variation.name}
										/>
										<div class="overlay">
											<svg
												width="20"
												height="20"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
												/>
											</svg>
											Change
										</div>
									{:else}
										<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#c4b5fd">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="1.5"
												d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										<span
											style="font-size:11px; color:#b0a8d0; margin-top:6px; text-align:center; line-height:1.3;"
											>Drop image<br />or click</span
										>
									{/if}
								</div>
								<input
									type="file"
									id="img-{index}"
									accept="image/*"
									class="sr-only"
									name="variation_image[]"
									style="display:none;"
									onchange={(event) => handleImageChange(index, event)}
								/>
							</div>

							<!-- Name + Weight stack -->
							<div style="flex:1; display:flex; flex-direction:column; gap:12px;">
								<div>
									<label class="field-label" for="vname-{index}">Variation Name</label>
									<input
										id="vname-{index}"
										type="text"
										class="var-input"
										bind:value={variation.name}
										name="variation_name[]"
										placeholder="e.g. Red / Large / 500g"
									/>
								</div>
								<div>
									<label class="field-label" for="vweight-{index}">Weight</label>
									<div class="price-tag">
										<span class="currency">g</span>
										<input
											id="vweight-{index}"
											type="number"
											step="0.01"
											min="0"
											class="var-input"
											style="padding-left: 26px;"
											bind:value={variation.weight}
											name="variation_weight[]"
											placeholder="0"
										/>
									</div>
								</div>
							</div>
						</div>

						<hr class="section-divider" />

						<!-- Pricing row -->
						<div style="padding:16px 20px;">
							<p
								style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#7c6fa0; margin:0 0 12px;"
							>
								Pricing
							</p>
							<div class="price-grid">
								<div>
									<label class="field-label" for="vprice-{index}">Price</label>
									<div class="price-tag">
										<span class="currency">$</span>
										<input
											id="vprice-{index}"
											type="number"
											step="0.01"
											min="0"
											class="var-input price-input"
											bind:value={variation.price}
											name="variation_price[]"
											placeholder="0.00"
										/>
									</div>
								</div>
								<div>
									<label class="field-label" for="vreg-{index}">Regular Price</label>
									<div class="price-tag">
										<span class="currency">$</span>
										<input
											id="vreg-{index}"
											type="number"
											step="0.01"
											min="0"
											class="var-input price-input"
											bind:value={variation.regular_price}
											name="variation_regular_price[]"
											placeholder="0.00"
										/>
									</div>
								</div>
								<div>
									<label class="field-label" for="vsale-{index}">Sale Price</label>
									<div class="price-tag">
										<span class="currency">$</span>
										<input
											id="vsale-{index}"
											type="number"
											step="0.01"
											min="0"
											class="var-input price-input"
											style="border-color: #fde68a; background:#fffbeb;"
											bind:value={variation.sales_price}
											name="variation_sales_price[]"
											placeholder="0.00"
										/>
									</div>
								</div>
							</div>
						</div>

						<hr class="section-divider" />

						<!-- Color + Actions row -->
						<div
							style="padding:14px 20px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;"
						>
							<div style="flex:1; min-width:160px;">
								<label class="field-label" for="vcolor-{index}">Color</label>
								<div class="color-row">
									<input
										type="color"
										class="color-swatch"
										bind:value={variation.color}
										name="color[]"
										title="Pick a color"
									/>
									<input
										id="vcolor-{index}"
										type="text"
										class="var-input"
										bind:value={variation.color}
										placeholder="#FFFFFF"
										style="max-width:120px;"
									/>
									{#if variation.color}
										<span
											style="
											display:inline-block;
											width:24px; height:24px;
											border-radius:6px;
											background:{variation.color};
											border:1.5px solid #e2ddf2;
											flex-shrink:0;
										"
										></span>
									{/if}
								</div>
							</div>

							<button
								type="button"
								class="btn-delete"
								onclick={() => removeVariation(index)}
								aria-label="Remove variation {index + 1}"
							>
								<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
								Remove
							</button>
						</div>
					</div>
				{/each}

				<!-- Add variation card -->
				<button type="button" class="btn-add" onclick={addVariation}>
					<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Add Another Variation
				</button>
			</div>

			<!-- Footer actions -->
			<div
				style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px; padding-top:20px; border-top:1.5px solid #f0ecfa;"
			>
				<a
					href={base + '/products'}
					style="display:inline-flex; align-items:center; padding:11px 20px; font-size:14px; font-weight:600; color:#7c6fa0; background:#f5f3ff; border:1.5px solid #e2ddf2; border-radius:10px; text-decoration:none; transition:background 0.15s;"
				>
					Cancel
				</a>
				<button type="submit" class="btn-save" disabled={isSaving} onclick={handleSave}>
					{#if isSaving}
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							style="animation:spin 1s linear infinite;"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
						Saving…
					{:else}
						<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						Save Variations
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.page-bg {
		background: #f8f7ff;
		min-height: 100vh;
	}

	/* Card */
	.var-card {
		background: #ffffff;
		border: 1.5px solid #e8e4f3;
		border-radius: 16px;
		overflow: hidden;
		transition:
			box-shadow 0.2s ease,
			border-color 0.2s ease;
		position: relative;
	}
	.var-card:hover {
		box-shadow: 0 8px 32px rgba(124, 58, 237, 0.1);
		border-color: #c4b5fd;
	}

	/* Card badge */
	.var-badge {
		position: absolute;
		top: 18px;
		left: 18px;
		width: 32px;
		height: 32px;
		background: linear-gradient(135deg, #7c3aed, #a855f7);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		font-weight: 700;
		z-index: 2;
		box-shadow: 0 2px 8px rgba(124, 58, 237, 0.35);
	}

	/* Image drop zone */
	.image-zone {
		background: #faf9ff;
		border: 2px dashed #c4b5fd;
		border-radius: 12px;
		width: 100%;
		aspect-ratio: 1 / 1;
		max-width: 140px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
		position: relative;
		overflow: hidden;
	}
	.image-zone:hover,
	.image-zone.drag-active {
		background: #ede9fe;
		border-color: #7c3aed;
	}
	.image-zone img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		position: absolute;
		inset: 0;
		border-radius: 10px;
	}
	.image-zone .overlay {
		position: absolute;
		inset: 0;
		background: rgba(124, 58, 237, 0.55);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.2s;
		border-radius: 10px;
		color: white;
		font-size: 12px;
		font-weight: 600;
		gap: 4px;
	}
	.image-zone:hover .overlay {
		opacity: 1;
	}

	/* Field label */
	.field-label {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #7c6fa0;
		margin-bottom: 5px;
		display: block;
	}

	/* Inputs */
	.var-input {
		width: 100%;
		padding: 8px 12px;
		font-size: 14px;
		font-family: 'Inter', sans-serif;
		border: 1.5px solid #e2ddf2;
		border-radius: 8px;
		background: #faf9ff;
		color: #1e1b2e;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
		outline: none;
	}
	.var-input:focus {
		border-color: #7c3aed;
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
		background: #ffffff;
	}
	.var-input::placeholder {
		color: #c0b8d4;
	}

	/* Price input — monospace feel */
	.price-input {
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
	}

	/* Color picker row */
	.color-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.color-swatch {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		border: 1.5px solid #e2ddf2;
		cursor: pointer;
		padding: 2px;
		background: none;
		flex-shrink: 0;
	}

	/* Delete button */
	.btn-delete {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		font-size: 13px;
		font-weight: 600;
		color: #dc2626;
		background: #fff1f2;
		border: 1.5px solid #fecaca;
		border-radius: 8px;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}
	.btn-delete:hover {
		background: #fee2e2;
		border-color: #f87171;
	}

	/* Add button */
	.btn-add {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		font-size: 14px;
		font-weight: 600;
		color: #7c3aed;
		background: #f5f3ff;
		border: 2px dashed #c4b5fd;
		border-radius: 12px;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
		width: 100%;
		justify-content: center;
	}
	.btn-add:hover {
		background: #ede9fe;
		border-color: #7c3aed;
	}

	/* Save button */
	.btn-save {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 11px 28px;
		font-size: 15px;
		font-weight: 600;
		color: white;
		background: linear-gradient(135deg, #7c3aed, #9333ea);
		border: none;
		border-radius: 10px;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
		transition:
			opacity 0.15s,
			transform 0.1s;
	}
	.btn-save:hover:not(:disabled) {
		opacity: 0.92;
		transform: translateY(-1px);
	}
	.btn-save:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}

	/* Section divider */
	.section-divider {
		border: none;
		border-top: 1px solid #f0ecfa;
		margin: 0;
	}

	/* Toast */
	.toast-success {
		background: #f0fdf4;
		border: 1.5px solid #86efac;
		color: #166534;
		border-radius: 10px;
		padding: 12px 18px;
		font-size: 14px;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.toast-error {
		background: #fff1f2;
		border: 1.5px solid #fca5a5;
		color: #991b1b;
		border-radius: 10px;
		padding: 12px 18px;
		font-size: 14px;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	/* Breadcrumb */
	.breadcrumb a {
		color: #7c3aed;
		font-weight: 500;
		font-size: 13px;
		text-decoration: none;
		transition: color 0.15s;
	}
	.breadcrumb a:hover {
		color: #5b21b6;
		text-decoration: underline;
	}
	.breadcrumb span {
		font-size: 13px;
		color: #9e95bb;
	}

	/* Price group */
	.price-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}

	/* Tag on price field */
	.price-tag {
		position: relative;
	}
	.price-tag .currency {
		position: absolute;
		left: 11px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 13px;
		color: #9e95bb;
		pointer-events: none;
	}
	.price-tag .var-input {
		padding-left: 22px;
	}

	/* Empty state */
	.empty-hint {
		text-align: center;
		padding: 40px 20px;
		color: #9e95bb;
		font-size: 14px;
	}

	/* Header gradient strip */
	.page-header {
		background: linear-gradient(135deg, #1e1b2e 0%, #2d2352 100%);
		border-radius: 16px;
		padding: 28px 32px;
		margin-bottom: 28px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}
	.page-header h1 {
		color: white;
		font-size: 22px;
		font-weight: 700;
		margin: 0 0 4px;
	}
	.page-header p {
		color: #b0a8d0;
		font-size: 13px;
		margin: 0;
	}

	.count-pill {
		background: rgba(255, 255, 255, 0.12);
		color: #e0d9f7;
		border-radius: 20px;
		padding: 3px 12px;
		font-size: 13px;
		font-weight: 600;
		border: 1px solid rgba(255, 255, 255, 0.18);
	}

	.btn-add-header {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 9px 18px;
		font-size: 14px;
		font-weight: 600;
		color: #7c3aed;
		background: white;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transition:
			transform 0.1s,
			box-shadow 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.btn-add-header:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
	}
</style>
