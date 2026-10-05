<script lang="ts">
	import { getImageUrl } from '$lib/admin/utils/image';
	import { base } from '$lib/admin/paths';
	import { enhance } from '$app/forms';
	import type { Variation, VariationImage } from '$lib/admin/features/products/types/product';
	import { createEmptyVariation } from '$lib/admin/features/products/types/product';

	let { data } = $props();

	let isSaving = $state(false);
	let saveMessage = $state('');
	let dragOver = $state<number | null>(null);

	function withClientId(v: any) {
		return { ...v, _cid: v._cid ?? crypto.randomUUID() };
	}

	function previewUrl(image: VariationImage | string | null | undefined): string | null {
		if (!image) return null;
		if (typeof image === 'string') return getImageUrl(image);
		if (image.file) return URL.createObjectURL(image.file);
		const path = (image as any).path || (image as any).url || (image as any).image || null;
		if (typeof path === 'string' && path.trim()) return getImageUrl(path);
		return null;
	}

	let variations = $state<(Variation & { _cid: string; _previewUrl?: string | null })[]>([
		withClientId({ ...createEmptyVariation(), quantity: 1 })
	]);

	$effect(() => {
		if (data?.variations && Array.isArray(data.variations)) {
			variations = JSON.parse(JSON.stringify(data.variations)).map((v: any) => ({
				...withClientId(v),
				_previewUrl: previewUrl(v.image)
			}));
		}
	});
	function setFile(i: number, file: File) {
		const old = variations[i]._previewUrl;
		if (old?.startsWith('blob:')) URL.revokeObjectURL(old);

		variations[i] = {
			...variations[i],
			_previewUrl: URL.createObjectURL(file),
			image: {
				...(variations[i].image ?? {}),
				file,
				alt_text: variations[i].name || file.name
			}
		};
	}

	function removeImage(i: number) {
		const old = variations[i]._previewUrl;
		if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
		variations[i] = { ...variations[i], _previewUrl: null, image: null };
	}

	function handleImageChange(i: number, e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		console.log('handleImageChange', i, file);
		if (!file) return;
		setFile(i, file);
		setTimeout(() => {
			input.value = '';
		}, 0);
	}

	function handleDrop(i: number, event: DragEvent) {
		event.preventDefault();
		dragOver = null;
		const file = event.dataTransfer?.files?.[0];
		if (!file || !file.type.startsWith('image/')) return;
		setFile(i, file);
	}

	function addVariation() {
		variations = [...variations, withClientId({ ...createEmptyVariation(), quantity: 1 })];
	}

	async function removeVariation(index: number, id?: number) {
		if (id) {
			const formData = new FormData();
			formData.append('variation_id', String(id));

			const response = await fetch('?/deleteVariation', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok) {
				addToast('Variation deleted successfully.', 'success');
				variations = variations.filter((_, idx) => idx !== index);
			} else {
				addToast(result.message ?? 'Failed to delete variation.', 'error');
			}
		} else {
			const old = variations[index]._previewUrl;
			if (old?.startsWith('blob:')) URL.revokeObjectURL(old);

			variations = variations.filter((_, idx) => idx !== index);
		}
	}
	// function removeVariation(i: number, id: number) {
	// 	if (id) {
	// 		alert('removeVariation', id);
	// 	} else {
	// 		alert('removeVariation', i);
	// 	}
	// 	// const old = variations[i]._previewUrl;
	// 	// if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
	// 	// variations = variations.filter((_, idx) => idx !== i);
	// }

	function changeQty(i: number, delta: number) {
		const current = Number(variations[i].quantity ?? 0);
		variations[i] = { ...variations[i], quantity: Math.max(0, current + delta) };
	}

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

	function handleSubmit({ formData }: { formData: FormData }) {
		isSaving = true;
		saveMessage = '';

		const keysToDelete = [
			'variation_id[]',
			'variation_name[]',
			'variation_weight[]',
			'variation_price[]',
			'variation_regular_price[]',
			'variation_sales_price[]',
			'variation_quantity[]',
			'variations_status[]',
			'color[]',
			'variation_image[]',
			'variation_image_index[]'
		];
		for (const key of keysToDelete) formData.delete(key);

		for (let i = 0; i < variations.length; i++) {
			const v = variations[i] as any;
			formData.append('variation_id[]', String(v.id ?? ''));
			formData.append('variation_name[]', v.name ?? '');
			formData.append('variation_weight[]', String(v.weight ?? ''));
			formData.append('variation_price[]', String(v.price ?? ''));
			formData.append('variation_regular_price[]', String(v.regular_price ?? ''));
			formData.append('variation_sales_price[]', String(v.sales_price ?? ''));
			formData.append('variation_quantity[]', String(v.stock_quantity ?? v.quantity ?? ''));
			formData.append('variations_status[]', v.status ?? 'active');
			formData.append('color[]', v.color ?? '');

			if (v.image?.file instanceof File && v.image.file.size > 0) {
				formData.append('variation_image[]', v.image.file, v.image.file.name);
				formData.append('variation_image_index[]', String(i));
			}
		}
		return async ({ result, update }) => {
			isSaving = false;

			if (result.type === 'success') {
				// Refresh page data
				addToast('Variations saved successfully.', 'success');
				await update();
			}

			if (result.type === 'failure') {
				console.error(result.data?.message);
				addToast('Failed to save variations.', 'error');
			}
		};
	}
</script>

<div class="page-wrap">
	<div class="breadcrumb">
		<a href={base}>Dashboard</a>
		<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<span>Variations</span>
	</div>

	<div class="page-header">
		<div>
			<h1>Product Variations</h1>
			<p>Manage sizes, colors, weights and pricing</p>
		</div>
		<span class="count-pill">{variations.length} variation{variations.length !== 1 ? 's' : ''}</span
		>
	</div>

	<form
		action="?/saveVariations"
		method="post"
		enctype="multipart/form-data"
		use:enhance={handleSubmit}
	>
		<div class="var-list">
			{#if variations.length === 0}
				<div class="empty-card">
					<svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#c4b5fd">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
						/>
					</svg>
					<p>No variations yet. Click <strong>Add Variation</strong> to get started.</p>
				</div>
			{/if}

			{#each variations as variation, index (index)}
				<div class="var-card">
					<span class="badge">{index + 1}</span>

					<div class="card-body">
						<input type="hidden" name="variation_id[]" value={variation.id ?? ''} />
						<!-- ── Image column ── -->
						<div class="img-col">
							{#if variation._previewUrl}
								<img
									src={variation._previewUrl}
									alt={variation.name || 'Variation image'}
									class="img-preview"
								/>
								<input
									type="file"
									class="btn-img-action"
									id="img-{index}"
									accept="image/*"
									onchange={(e) => handleImageChange(index, e)}
								/>
								<!-- Has image: show it inside the styled upload zone -->
								<!-- <div
									class="img-zone has-image"
									ondragover={(e) => {
										e.preventDefault();
										dragOver = index;
									}}
									ondragleave={() => (dragOver = null)}
									ondrop={(e) => handleDrop(index, e)}
									onclick={() => document.getElementById(`img-${index}`)?.click()}
									role="button"
									tabindex="0"
									aria-label="Change variation image"
									onkeydown={(e) =>
										e.key === 'Enter' && document.getElementById(`img-${index}`)?.click()}
								>
									<img
										src={variation._previewUrl}
										alt={variation.name || 'Variation image'}
										class="img-preview"
									/>
								</div> -->

								<!-- <div class="img-actions">
									<button
										type="button"
										class="btn-img-action"
										onclick={() => document.getElementById(`img-${index}`)?.click()}
									>
										<svg
											width="11"
											height="11"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z"
											/>
										</svg>
										Change
									</button>
									<button
										type="button"
										class="btn-img-action btn-img-remove"
										onclick={() => removeImage(index)}
										aria-label="Remove image"
									>
										<svg
											width="11"
											height="11"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div> -->
							{:else}
								<input
									type="file"
									class="btn-img-action"
									id="img-{index}"
									accept="image/*"
									onchange={(e) => handleImageChange(index, e)}
								/>
							{/if}
						</div>

						<!-- ── Inputs column ── -->
						<div class="inputs-col">
							<div class="field">
								<label class="lbl" for="vname-{index}">Name</label>
								<input
									id="vname-{index}"
									type="text"
									class="inp"
									bind:value={variation.name}
									placeholder="e.g. Red / Large / 500g"
								/>
							</div>

							<div class="field">
								<label class="lbl" for="vcolor-{index}">Color</label>
								<div class="color-row">
									<input
										type="color"
										class="swatch"
										bind:value={variation.color}
										title="Pick color"
									/>
									<input
										id="vcolor-{index}"
										type="text"
										class="inp"
										bind:value={variation.color}
										placeholder="#FFFFFF"
										style="width:96px;"
									/>
									{#if variation.color}
										<span class="color-dot" style="background:{variation.color};"></span>
									{/if}
								</div>
							</div>

							<div class="num-row">
								<div class="field">
									<label class="lbl" for="vweight-{index}">Weight</label>
									<div class="affix-wrap">
										<span class="affix">g</span>
										<input
											id="vweight-{index}"
											type="number"
											step="0.01"
											min="0"
											class="inp affix-inp"
											bind:value={variation.weight}
											placeholder="0"
										/>
									</div>
								</div>
								<div class="field">
									<label class="lbl" for="vprice-{index}">Price</label>
									<div class="affix-wrap">
										<span class="affix">$</span>
										<input
											id="vprice-{index}"
											type="number"
											step="0.01"
											min="0"
											class="inp affix-inp mono"
											bind:value={variation.price}
											placeholder="0.00"
										/>
									</div>
								</div>
								<div class="field">
									<label class="lbl" for="vreg-{index}">Regular</label>
									<div class="affix-wrap">
										<span class="affix">$</span>
										<input
											id="vreg-{index}"
											type="number"
											step="0.01"
											min="0"
											class="inp affix-inp mono"
											bind:value={variation.regular_price}
											placeholder="0.00"
										/>
									</div>
								</div>
								<div class="field">
									<label class="lbl" for="vsale-{index}">Sale</label>
									<div class="affix-wrap">
										<span class="affix">$</span>
										<input
											id="vsale-{index}"
											type="number"
											step="0.01"
											min="0"
											class="inp affix-inp mono sale-inp"
											bind:value={variation.sales_price}
											placeholder="0.00"
										/>
									</div>
								</div>
							</div>

							<div class="field">
								<label class="lbl" for="vqty-{index}">Qty</label>
								<div class="stepper">
									<button
										type="button"
										class="step-btn"
										onclick={() => changeQty(index, -1)}
										aria-label="Decrease"
										disabled={Number(variation.quantity ?? 0) <= 0}>−</button
									>
									<input
										id="vqty-{index}"
										type="number"
										min="0"
										class="inp step-inp mono"
										bind:value={variation.stock_quantity}
										placeholder="0"
									/>
									<button
										type="button"
										class="step-btn"
										onclick={() => changeQty(index, 1)}
										aria-label="Increase">+</button
									>
								</div>
							</div>
						</div>
					</div>

					<div class="card-footer">
						<button
							type="button"
							class="btn-del"
							onclick={() => removeVariation(index, variation.id)}
							aria-label="Remove variation {index + 1}"
						>
							<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

			<button type="button" class="btn-add" onclick={addVariation}>
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

		<div class="footer">
			<a href={base + '/products'} class="btn-cancel">Cancel</a>
			<button type="submit" class="btn-save" disabled={isSaving}>
				{#if isSaving}
					<svg
						width="14"
						height="14"
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
					<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					Save Variations
				{/if}
			</button>
		</div>
	</form>
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

<style>
	.page-wrap {
		min-height: 100vh;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		margin-bottom: 16px;
		color: #9e95bb;
	}
	.breadcrumb a {
		color: #7c3aed;
		font-weight: 500;
		text-decoration: none;
	}
	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 18px;
	}
	.page-header h1 {
		font-size: 20px;
		font-weight: 700;
		margin: 0 0 2px;
	}
	.page-header p {
		font-size: 12px;
		color: #9e95bb;
		margin: 0;
	}
	.count-pill {
		font-size: 12px;
		font-weight: 600;
		color: #7c3aed;
		background: #f0ebff;
		border: 1px solid #ddd6fe;
		border-radius: 20px;
		padding: 3px 12px;
		white-space: nowrap;
	}

	.var-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.empty-card {
		border: 1.5px dashed #e2ddf2;
		border-radius: 12px;
		padding: 40px 20px;
		text-align: center;
		color: #9e95bb;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		font-size: 13px;
	}

	/* ── Card ── */
	.var-card {
		background: #fff;
		border: 1px solid #e8e4f3;
		border-radius: 14px;
		position: relative;
		padding: 16px;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	.var-card:hover {
		border-color: #c4b5fd;
		box-shadow: 0 2px 16px rgba(124, 58, 237, 0.07);
	}
	.badge {
		position: absolute;
		top: -9px;
		left: 14px;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		background: #7c3aed;
		color: #fff;
		border-radius: 10px;
		font-size: 10px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		letter-spacing: 0.02em;
	}

	/* ── Two-column layout ── */
	.card-body {
		display: grid;
		grid-template-columns: 120px minmax(0, 1fr);
		gap: 16px;
		padding-top: 8px;
		align-items: start; /* prevents img-col stretching to inputs height */
	}

	/* ── Image column ── */
	.img-col {
		display: flex;
		flex-direction: column;
		gap: 8px;
		/* Lock the column width so the grid never squeezes it */
		width: 120px;
		flex-shrink: 0;
	}

	/*
	 * img-zone is the clickable square.
	 * - position: relative so the absolutely-positioned img-preview fills it.
	 * - min-width / min-height prevent grid from shrinking it below 120×120.
	 * - overflow: hidden clips the image to the rounded corners.
	 */
	.img-zone {
		width: 120px;
		height: 120px;
		min-width: 120px;
		min-height: 120px;
		border-radius: 12px;
		border: 1.5px dashed #c4b5fd;
		background: #faf8ff;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 7px;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.img-zone:hover,
	.img-zone.drag-active {
		background: #f0ebff;
		border-color: #7c3aed;
	}

	/* Solid border once an image is loaded */
	.img-zone.has-image {
		border: 1.5px solid #e8e4f3;
	}
	/* Subtle highlight on hover when image exists — no overlay, just border */
	.img-zone.has-image:hover {
		border-color: #7c3aed;
		background: transparent;
	}

	/*
	 * img-preview fills the entire img-zone. Using a normal block image keeps
	 * layout stable across screen sizes and avoids desktop-only rendering quirks.
	 */
	.img-preview {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 10px;
		display: block;
	}

	.upload-hint {
		font-size: 10px;
		color: #a794d0;
		text-align: center;
		line-height: 1.4;
	}

	/* Change / Remove buttons below the image */
	.img-actions {
		display: flex;
		gap: 6px;
		width: 120px; /* match img-zone width */
	}
	.btn-img-action {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 5px 8px;
		font-size: 11px;
		font-weight: 600;
		border-radius: 7px;
		cursor: pointer;
		border: 1.5px solid #ddd6fe;
		background: #f5f0ff;
		color: #7c3aed;
		transition: background 0.12s;
	}
	.btn-img-action:hover {
		background: #ede9fe;
	}
	.btn-img-remove {
		/* Fixed width so it doesn't stretch */
		flex: 0 0 auto;
		background: #fff1f2;
		border-color: #fecaca;
		color: #dc2626;
	}
	.btn-img-remove:hover {
		background: #fee2e2;
	}

	/* ── Inputs column ── */
	.inputs-col {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.num-row {
		display: flex;
		gap: 8px;
	}
	.num-row .field {
		flex: 1;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.lbl {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		color: #9c89c0;
	}

	.inp {
		width: 100%;
		padding: 7px 10px;
		font-size: 13px;
		font-family: 'Inter', sans-serif;
		border: 1.5px solid #e8e4f3;
		border-radius: 8px;
		background: #faf8ff;
		color: #1e1b2e;
		outline: none;
		box-sizing: border-box;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	.inp:focus {
		border-color: #7c3aed;
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
		background: #fff;
	}
	.inp::placeholder {
		color: #c8bfe0;
	}
	.mono {
		font-variant-numeric: tabular-nums;
	}

	.affix-wrap {
		position: relative;
	}
	.affix {
		position: absolute;
		left: 9px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 11px;
		color: #b0a0cc;
		pointer-events: none;
		font-weight: 500;
	}
	.affix-inp {
		padding-left: 20px;
	}

	.sale-inp {
		border-color: #fde68a;
		background: #fffcf0;
	}
	.sale-inp:focus {
		border-color: #f59e0b;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
	}

	.color-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.swatch {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1.5px solid #e8e4f3;
		cursor: pointer;
		padding: 2px;
		background: none;
		flex-shrink: 0;
	}
	.color-dot {
		width: 20px;
		height: 20px;
		border-radius: 5px;
		border: 1.5px solid #e8e4f3;
		flex-shrink: 0;
	}

	/* ── Qty stepper ── */
	.stepper {
		display: flex;
		align-items: center;
		border: 1.5px solid #e8e4f3;
		border-radius: 8px;
		overflow: hidden;
		background: #faf8ff;
		width: fit-content;
		height: 33px;
	}
	.step-btn {
		width: 28px;
		height: 100%;
		background: none;
		border: none;
		color: #7c3aed;
		font-size: 17px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.12s;
	}
	.step-btn:hover:not(:disabled) {
		background: #ede9fe;
	}
	.step-btn:disabled {
		color: #c4b5fd;
		cursor: not-allowed;
	}
	.step-inp {
		width: 52px;
		border: none;
		border-left: 1.5px solid #e8e4f3;
		border-right: 1.5px solid #e8e4f3;
		border-radius: 0;
		background: transparent;
		text-align: center;
		padding: 0 4px;
		height: 100%;
		font-size: 13px;
		color: #1e1b2e;
		outline: none;
	}

	/* ── Card footer ── */
	.card-footer {
		display: flex;
		justify-content: flex-end;
		padding-top: 12px;
		margin-top: 4px;
		border-top: 1px solid #f3f0fb;
	}
	.btn-del {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 12px;
		font-size: 11px;
		font-weight: 600;
		background: #fff1f2;
		border: 1.5px solid #fecaca;
		border-radius: 7px;
		color: #dc2626;
		cursor: pointer;
		transition: background 0.12s;
	}
	.btn-del:hover {
		background: #fee2e2;
	}

	/* ── Add variation button ── */
	.btn-add {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		width: 100%;
		padding: 10px 16px;
		font-size: 13px;
		font-weight: 600;
		color: #7c3aed;
		background: #faf8ff;
		border: 1.5px dashed #c4b5fd;
		border-radius: 12px;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.btn-add:hover {
		background: #f0ebff;
		border-color: #7c3aed;
	}

	/* ── Page footer ── */
	.footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid #f0ecfa;
	}
	.btn-cancel {
		display: inline-flex;
		align-items: center;
		padding: 8px 18px;
		font-size: 13px;
		font-weight: 600;
		color: #7c6fa0;
		background: #f5f3ff;
		border: 1.5px solid #e2ddf2;
		border-radius: 9px;
		text-decoration: none;
		transition: background 0.12s;
	}
	.btn-cancel:hover {
		background: #ede9fe;
	}
	.btn-save {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 8px 22px;
		font-size: 13px;
		font-weight: 600;
		color: #fff;
		background: linear-gradient(135deg, #7c3aed, #9333ea);
		border: none;
		border-radius: 9px;
		cursor: pointer;
		box-shadow: 0 3px 10px rgba(124, 58, 237, 0.3);
		transition:
			opacity 0.12s,
			transform 0.1s;
	}
	.btn-save:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
	}
	.btn-save:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		appearance: none;
		-moz-appearance: textfield;
	}

	/* ── Mobile ── */
	@media (max-width: 600px) {
		.card-body {
			grid-template-columns: 1fr;
		}
		.img-col {
			width: 100%;
		}
		.img-zone {
			width: 100%;
			height: 120px;
			min-width: unset;
		}
		.img-actions {
			width: 100%;
		}
		.num-row {
			flex-wrap: wrap;
		}
	}
</style>
