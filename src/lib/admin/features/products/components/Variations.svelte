<script lang="ts">
	import { getImageUrl } from '$lib/admin/utils/image';
	import type { Variation, VariationStatus, VariationImage } from '../types/product';
	import { createEmptyVariation } from '../types/product';

	// ── Props ────────────────────────────────────────────────────────────────────
	let { variations = $bindable<Variation[]>([]) } = $props();

	('');
	// ── Constants ────────────────────────────────────────────────────────────────
	const statuses: { value: VariationStatus; label: string }[] = [
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' }
	];

	const presetColors = [
		'#ef4444',
		'#f97316',
		'#eab308',
		'#22c55e',
		'#3b82f6',
		'#8b5cf6',
		'#ec4899',
		'#f8fafc',
		'#94a3b8',
		'#1e293b'
	];

	// ── State ────────────────────────────────────────────────────────────────────
	let colorPopover: number | null = $state(null);

	// ── Helpers ──────────────────────────────────────────────────────────────────

	/** Derive a preview URL: object-URL for a fresh File, or getImageUrl for a
	 *  persisted path string, or '' when nothing is set. */
	// function previewUrl(img: VariationImage | null | undefined): string {
	// 	if (!img) return '';
	// 	if (img.file) return URL.createObjectURL(img.file);
	// 	if (img.path) return getImageUrl(img.path);
	// 	return '';
	// }

	function previewUrl(image: VariationImage | string | null | undefined): string | null {
		if (!image) return null;
		if (typeof image === 'string') return getImageUrl(image);
		if (image.file) return URL.createObjectURL(image.file);
		const path = (image as any).path || (image as any).url || (image as any).image || null;
		if (typeof path === 'string' && path.trim()) return getImageUrl(path);
		return null;
	}

	// ── Variation CRUD ───────────────────────────────────────────────────────────
	function addVariation() {
		if (!Array.isArray(variations)) variations = [];
		variations = [...variations, createEmptyVariation()];
	}

	function removeVariation(index: number) {
		variations = variations.filter((_, i) => i !== index);
	}

	function duplicateVariation(index: number) {
		const src = variations[index];
		// Duplicate without the File reference — a persisted path is kept so an
		// existing image is still visible; a brand-new file is intentionally dropped
		// (the user should re-upload for the duplicate if needed).
		const copy: Variation = {
			...src,
			image: src.image
				? {
						alt_text: src.image.alt_text,
						is_primary: false,
						color: src.image.color,
						path: src.image.path
					}
				: null
		};
		variations = [...variations.slice(0, index + 1), copy, ...variations.slice(index + 1)];
	}

	// ── Image handling ───────────────────────────────────────────────────────────
	function handleImageChange(index: number, e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		// Store the File object directly — matches the GalleryImage / MainImage pattern.
		// The parent form submission reads variation.image.file (and optionally .path
		// for existing records).
		variations[index].image = {
			...(variations[index].image || {}),
			file
		};
		variations = [...variations];
		console.log(`Variation ${index} image changed:`, variations);
	}

	function removeImage(index: number) {
		variations[index].image = null;
		variations = [...variations];
	}

	// ── Color handling ───────────────────────────────────────────────────────────
	function setColor(index: number, color: string) {
		variations[index].color = color;
		// Keep image.color in sync if an image exists
		if (variations[index].image) {
			variations[index].image!.color = color;
		}
		variations = [...variations];
		colorPopover = null;
	}

	function togglePopover(index: number) {
		colorPopover = colorPopover === index ? null : index;
	}

	// ── Validation ───────────────────────────────────────────────────────────────
	function isIncomplete(v: Variation) {
		return (
			!v.name.trim() || v.price === '' || (v.quantity === '' && v.stock_quantity === undefined)
		);
	}

	// ── Derived ──────────────────────────────────────────────────────────────────
	let totalStock = $derived(
		variations.reduce((sum, v) => {
			const q = Number(v.quantity);
			return sum + (isNaN(q) ? 0 : q);
		}, 0)
	);
</script>

<svelte:window
	onclick={(e) => {
		if (!(e.target as HTMLElement).closest('.color-cell')) colorPopover = null;
	}}
/>

<div class="vw">
	<!-- ── Header ──────────────────────────────────────────────────────────────── -->
	<div class="vw-header">
		<div class="header-left">
			<span class="section-title">Variations</span>
			{#if variations.length > 0}
				<span class="pill">{variations.length} total</span>
				<span class="pill green">{totalStock} in stock</span>
			{/if}
		</div>
		<button type="button" class="add-btn" onclick={addVariation}>
			<svg width="11" height="11" viewBox="0 0 12 12" fill="none">
				<path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			Add Variation
		</button>
	</div>

	<!-- ── Empty state ─────────────────────────────────────────────────────────── -->
	{#if variations.length === 0}
		<div class="empty-state">
			<svg
				width="28"
				height="28"
				viewBox="0 0 24 24"
				fill="none"
				stroke="#cbd5e1"
				stroke-width="1.4"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<path d="M3 9h18M9 21V9" />
			</svg>
			<p>No variations yet — add one to define sizes, colours, or packs.</p>
		</div>
	{:else}
		<div class="vlist">
			<!-- Column headers -->
			<div class="vlist-headers">
				<div class="hdr-visual">
					<span class="hdr-visual-cell">Image</span>
					<span class="hdr-visual-sep"></span>
					<span class="hdr-visual-cell">Color</span>
				</div>
				<div class="hdr-fields">
					<span class="hd hd-name">Name</span>
					<span class="hd hd-num">Weight (g)</span>
					<span class="hd hd-num">Price</span>
					<span class="hd hd-qty">Qty</span>
					<span class="hd hd-status">Status</span>
					<span class="hd hd-actions"></span>
				</div>
			</div>

			<!-- ── Rows ──────────────────────────────────────────────────────────── -->
			{#each variations as variation, i (i)}
				{#if variation.image}
					<!-- Preload persisted images to avoid flashes of "no image" when editing -->
					{@const _ = getImageUrl(variation.image)}
				{/if}
				{@const imgPreview = previewUrl(variation.image)}

				<div class="vrow" class:incomplete={isIncomplete(variation)}>
					<input type="hidden" name="color[]" value={variation.color ?? ''} />
					<!-- ── LEFT: image + color ──────────────────────────────────── -->
					<div class="col-visual">
						<!-- Image block -->
						<div class="visual-block">
							{#if imgPreview}
								<div class="img-wrap">
									<img src={imgPreview} alt={variation.name || 'variation'} class="thumb" />
									<button
										type="button"
										class="img-remove"
										onclick={() => removeImage(i)}
										title="Remove image">✕</button
									>
								</div>
								<!-- Keep the file input in the DOM (hidden) so the form still
								     has a named slot for this variation's upload. The File object
								     is already stored in variation.image.file — this input is
								     only here so native form submission works too. -->
								<input
									id="img-{i}"
									type="file"
									name="variation_image[]"
									accept="image/*"
									class="sr-only"
									onchange={(e) => handleImageChange(i, e)}
								/>
							{:else}
								<label class="img-upload" for="img-{i}" title="Upload image">
									<svg
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#94a3b8"
										stroke-width="1.6"
									>
										<rect x="3" y="3" width="18" height="18" rx="2" />
										<circle cx="8.5" cy="8.5" r="1.5" />
										<path d="m21 15-5-5L5 21" />
									</svg>
									<input
										id="img-{i}"
										type="file"
										name="variation_image[]"
										accept="image/*"
										class="sr-only"
										onchange={(e) => handleImageChange(i, e)}
									/>
								</label>
							{/if}
						</div>

						<div class="visual-sep"></div>

						<!-- Color block -->
						<div class="visual-block color-cell">
							<button
								type="button"
								class="color-trigger"
								onclick={() => togglePopover(i)}
								title={variation.color || 'Pick a color'}
							>
								<span
									class="color-dot"
									class:empty={!variation.color}
									style="background:{variation.color || 'transparent'}"
								></span>
								<svg width="9" height="9" viewBox="0 0 10 10" fill="none">
									<path
										d="M2 3.5 5 7l3-3.5"
										stroke="#94a3b8"
										stroke-width="1.5"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</button>

							{#if colorPopover === i}
								<div class="color-popover">
									<p class="popover-label">Presets</p>
									<div class="swatch-grid">
										{#each presetColors as color}
											<button
												type="button"
												class="swatch"
												class:selected={variation.color === color}
												style="background:{color}"
												onclick={() => setColor(i, color)}
											></button>
										{/each}
									</div>
									<div class="popover-divider"></div>
									<p class="popover-label">Custom</p>
									<div class="custom-color">
										<!-- No name="" — the hidden input above handles submission -->
										<input
											type="color"
											class="native-color"
											value={variation.color || '#000000'}
											oninput={(e) => {
												variations[i].color = (e.target as HTMLInputElement).value;
												if (variations[i].image)
													variations[i].image!.color = variations[i].color ?? '';
												variations = [...variations];
											}}
											onchange={(e) => setColor(i, (e.target as HTMLInputElement).value)}
										/>
										<!-- Display-only hex input — no name="" -->
										<input
											type="text"
											class="hex-input"
											placeholder="#000000"
											value={variation.color ?? ''}
											oninput={(e) => {
												const val = (e.target as HTMLInputElement).value;
												if (/^#[0-9a-fA-F]{6}$/.test(val)) {
													variations[i].color = val;
													if (variations[i].image) variations[i].image!.color = val;
													variations = [...variations];
												}
											}}
										/>
										{#if variation.color}
											<button type="button" class="clear-btn" onclick={() => setColor(i, '')}
												>✕</button
											>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- ── RIGHT: fields ────────────────────────────────────────── -->
					<div class="col-fields">
						<div class="field-wrap field-name">
							<input
								type="text"
								name="variation_name[]"
								placeholder="e.g. Red – Large"
								class="finput"
								class:ferror={!variation.name.trim()}
								bind:value={variation.name}
							/>
						</div>

						<div class="field-wrap field-num">
							<input
								type="number"
								name="variation_weight[]"
								step="0.01"
								min="0"
								placeholder="0"
								class="finput fright"
								bind:value={variation.weight}
							/>
						</div>

						<div class="field-wrap field-num">
							<div class="prefix-wrap">
								<span class="prefix">$</span>
								<input
									type="number"
									step="0.01"
									min="0"
									name="variation_price[]"
									placeholder="0.00"
									class="finput fright has-prefix"
									class:ferror={variation.price === ''}
									bind:value={variation.price}
								/>
							</div>
						</div>

						<div class="field-wrap field-qty">
							<div class="qty-wrap">
								<button
									type="button"
									class="qty-btn"
									onclick={() => {
										const cur = Number(variation.quantity || variation.stock_quantity) || 0;
										if (cur > 0) {
											variation.quantity = cur - 1;
											variations = [...variations];
										}
									}}>−</button
								>
								<input
									type="number"
									name="variation_quantity[]"
									min="0"
									step="1"
									placeholder="0"
									bind:value={variation.stock_quantity}
									class="finput fright qty-input"
									class:ferror={variation.quantity === '' && variation.stock_quantity === undefined}
									onchange={(e) => {
										variation.quantity = (e.target as HTMLInputElement).value;
										variations = [...variations];
									}}
									oninput={(e) => {
										variation.quantity = (e.target as HTMLInputElement).value;
									}}
								/>
								<button
									type="button"
									class="qty-btn"
									onclick={() => {
										const cur = Number(variation.quantity || variation.stock_quantity) || 0;
										variation.quantity = cur + 1;
										variations = [...variations];
									}}>+</button
								>
							</div>
						</div>

						<div class="field-wrap field-status">
							<select
								bind:value={variation.status}
								name="variations_status[]"
								class="fselect"
								class:is-inactive={variation.status === 'inactive'}
							>
								{#each statuses as s}
									<option value={s.value}>{s.label}</option>
								{/each}
							</select>
						</div>

						<div class="field-wrap field-actions">
							<button
								type="button"
								class="act-btn"
								title="Duplicate"
								onclick={() => duplicateVariation(i)}
							>
								<svg
									width="13"
									height="13"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
								>
									<rect x="8" y="8" width="13" height="13" rx="2" />
									<path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
								</svg>
							</button>
							<button
								type="button"
								class="act-btn danger"
								title="Remove"
								onclick={() => removeVariation(i)}
							>
								<svg
									width="13"
									height="13"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
								>
									<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="vw-footer">
			<span class="count-hint">
				{variations.length} variation{variations.length === 1 ? '' : 's'} ·
				{variations.filter((v) => v.status === 'active').length} active ·
				{totalStock} units total
			</span>
		</div>
	{/if}
</div>

<style>
	.vw {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	/* ── Header ──────────────────────────────────────────────────────────────── */
	.vw-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #0f172a;
	}

	.pill {
		font-size: 0.67rem;
		font-weight: 500;
		background: #f1f5f9;
		color: #64748b;
		border-radius: 20px;
		padding: 0.12rem 0.48rem;
	}

	.pill.green {
		background: #dcfce7;
		color: #15803d;
	}

	.add-btn {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		background: #0f172a;
		color: #fff;
		border: none;
		padding: 0.38rem 0.8rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.add-btn:hover {
		background: #1e293b;
	}

	/* ── Empty state ─────────────────────────────────────────────────────────── */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem;
		border: 1.5px dashed #e2e8f0;
		border-radius: 8px;
		color: #94a3b8;
		font-size: 0.82rem;
		text-align: center;
	}
	.empty-state p {
		margin: 0;
	}

	/* ── List ────────────────────────────────────────────────────────────────── */
	.vlist {
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		overflow: visible;
	}

	.vlist-headers {
		display: flex;
		background: #f8fafc;
		border-bottom: 1px solid #e2e8f0;
		border-radius: 7px 7px 0 0;
	}

	.hdr-visual {
		display: flex;
		align-items: center;
		width: 160px;
		flex-shrink: 0;
		border-right: 1px solid #e2e8f0;
	}

	.hdr-visual-cell {
		flex: 1;
		text-align: center;
		font-size: 0.67rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.45rem 0;
	}

	.hdr-visual-sep {
		width: 1px;
		height: 16px;
		background: #e2e8f0;
	}

	.hdr-fields {
		display: flex;
		flex: 1;
		align-items: center;
	}

	.hd {
		font-size: 0.67rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.45rem 0.5rem;
		white-space: nowrap;
	}

	.hd-name {
		flex: 2;
		min-width: 0;
	}
	.hd-num {
		width: 90px;
		flex-shrink: 0;
	}
	.hd-qty {
		width: 110px;
		flex-shrink: 0;
	}
	.hd-status {
		width: 95px;
		flex-shrink: 0;
	}
	.hd-actions {
		width: 60px;
		flex-shrink: 0;
	}

	/* ── Row ─────────────────────────────────────────────────────────────────── */
	.vrow {
		display: flex;
		border-bottom: 1px solid #f1f5f9;
		transition: background 0.1s;
		position: relative;
	}

	.vrow:last-child {
		border-bottom: none;
	}
	.vrow:hover {
		background: #fafbfc;
	}
	.vrow.incomplete {
		background: #fff8f8;
	}
	.vrow.incomplete:hover {
		background: #fff2f2;
	}

	/* ── Visual column ───────────────────────────────────────────────────────── */
	.col-visual {
		display: flex;
		align-items: center;
		border-right: 1px solid #e2e8f0;
		flex-shrink: 0;
		width: 160px;
	}

	.visual-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: 0.5rem 0.4rem;
	}

	.visual-sep {
		width: 1px;
		background: #e2e8f0;
		align-self: stretch;
		margin: 0.3rem 0;
	}

	/* Image */
	.img-wrap {
		position: relative;
		width: 36px;
		height: 36px;
	}

	.thumb {
		width: 36px;
		height: 36px;
		object-fit: cover;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
		display: block;
	}

	.img-remove {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		border: none;
		background: #ef4444;
		color: #fff;
		font-size: 0.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.img-upload {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: 1.5px dashed #cbd5e1;
		border-radius: 6px;
		cursor: pointer;
		background: #f8fafc;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.img-upload:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}

	/* Visually hidden but present in the form */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	/* ── Color cell ──────────────────────────────────────────────────────────── */
	.color-cell {
		position: relative;
	}

	.color-trigger {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 0.3rem 0.5rem;
		cursor: pointer;
		transition: border-color 0.15s;
		width: 44px;
	}

	.color-trigger:hover {
		border-color: #94a3b8;
	}

	.color-dot {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 1.5px solid #e2e8f0;
	}

	.color-dot.empty {
		background: repeating-linear-gradient(
			45deg,
			#f1f5f9 0px,
			#f1f5f9 2px,
			#e2e8f0 2px,
			#e2e8f0 4px
		) !important;
	}

	/* Color popover */
	.color-popover {
		position: absolute;
		top: calc(100% + 6px);
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 0.65rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 168px;
	}

	.popover-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	.swatch-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.35rem;
	}

	.swatch {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: 2px solid #e2e8f0;
		cursor: pointer;
		transition:
			transform 0.1s,
			border-color 0.1s;
	}

	.swatch:hover {
		transform: scale(1.2);
	}

	.swatch.selected {
		border-color: #0f172a;
		transform: scale(1.15);
		box-shadow: 0 0 0 2px #fff inset;
	}

	.popover-divider {
		height: 1px;
		background: #f1f5f9;
	}

	.custom-color {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.native-color {
		width: 26px;
		height: 26px;
		padding: 0;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		cursor: pointer;
		flex-shrink: 0;
	}

	.hex-input {
		flex: 1;
		padding: 0.22rem 0.38rem;
		border: 1px solid #e2e8f0;
		border-radius: 5px;
		font-size: 0.73rem;
		font-family: monospace;
		background: #fff;
		outline: none;
		min-width: 0;
	}

	.hex-input:focus {
		border-color: #94a3b8;
	}

	.clear-btn {
		font-size: 0.65rem;
		color: #cbd5e1;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0 0.1rem;
	}

	.clear-btn:hover {
		color: #ef4444;
	}

	/* ── Fields column ───────────────────────────────────────────────────────── */
	.col-fields {
		display: flex;
		flex: 1;
		align-items: center;
		min-width: 0;
	}

	.field-wrap {
		padding: 0.4rem 0.4rem;
		display: flex;
		align-items: center;
	}

	.field-name {
		flex: 2;
		min-width: 0;
	}
	.field-num {
		width: 90px;
		flex-shrink: 0;
	}
	.field-qty {
		width: 110px;
		flex-shrink: 0;
	}
	.field-status {
		width: 95px;
		flex-shrink: 0;
	}
	.field-actions {
		width: 60px;
		flex-shrink: 0;
		justify-content: flex-end;
		gap: 0.25rem;
	}

	/* Inputs */
	.finput {
		width: 100%;
		padding: 0.32rem 0.45rem;
		border: 1px solid #e2e8f0;
		border-radius: 5px;
		font-size: 0.82rem;
		background: #fff;
		color: #0f172a;
		outline: none;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
		box-sizing: border-box;
	}

	.finput:focus {
		border-color: #94a3b8;
		box-shadow: 0 0 0 2px #f1f5f9;
	}

	.ferror {
		border-color: #fca5a5 !important;
	}
	.fright {
		text-align: right;
	}

	.prefix-wrap {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	.prefix {
		position: absolute;
		left: 0.42rem;
		color: #94a3b8;
		font-size: 0.76rem;
		pointer-events: none;
	}

	.has-prefix {
		padding-left: 1.3rem;
	}

	/* Qty stepper */
	.qty-wrap {
		display: flex;
		align-items: center;
		border: 1px solid #e2e8f0;
		border-radius: 5px;
		overflow: hidden;
		width: 100%;
	}

	.qty-btn {
		width: 26px;
		height: 30px;
		border: none;
		background: #f8fafc;
		color: #64748b;
		font-size: 1rem;
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.12s;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.qty-btn:hover {
		background: #e2e8f0;
		color: #0f172a;
	}

	.qty-input {
		flex: 1;
		border: none !important;
		border-radius: 0 !important;
		border-left: 1px solid #e2e8f0 !important;
		border-right: 1px solid #e2e8f0 !important;
		text-align: center !important;
		box-shadow: none !important;
		padding: 0.32rem 0.2rem;
		min-width: 0;
	}

	/* Status select */
	.fselect {
		width: 100%;
		padding: 0.32rem 0.4rem;
		border: 1px solid #e2e8f0;
		border-radius: 5px;
		font-size: 0.78rem;
		background: #f0fdf4;
		color: #15803d;
		font-weight: 500;
		cursor: pointer;
		outline: none;
	}

	.fselect.is-inactive {
		background: #f8fafc;
		color: #94a3b8;
	}

	/* Action buttons */
	.act-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		border-radius: 5px;
		background: #f1f5f9;
		color: #64748b;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
		flex-shrink: 0;
	}

	.act-btn:hover {
		background: #e2e8f0;
		color: #0f172a;
	}
	.act-btn.danger:hover {
		background: #fee2e2;
		color: #dc2626;
	}

	/* Footer */
	.vw-footer {
		display: flex;
		justify-content: flex-end;
	}

	.count-hint {
		font-size: 0.71rem;
		color: #94a3b8;
	}

	/* Remove native number spinners */
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
