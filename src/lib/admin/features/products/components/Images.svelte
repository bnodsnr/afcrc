<script lang="ts">
	import { getImageUrl } from '$lib/admin/utils/image';
	import type { MainImage, GalleryImage } from '../types/product';

	let {
		mainImage = $bindable<MainImage | null>(null),
		galleryImages = $bindable<GalleryImage[]>([])
	} = $props();
	function setMainImage(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0] ?? null;
		mainImage = { file, alt_text: '', is_primary: true, color: '' };
	}

	function addGalleryImage(e: Event) {
		const files = (e.target as HTMLInputElement).files;
		if (!files) return;
		for (const file of files) {
			galleryImages.push({ file, alt_text: '', is_primary: false, color: '' });
		}
	}

	function removeGalleryImage(index: number) {
		galleryImages.splice(index, 1);
	}
</script>

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
							<div class="rounded-lg border-2 border-dashed border-base-300 p-6 text-center">
								{#if mainImage?.file instanceof File}
									<div class="relative inline-block">
										<img
											src={URL.createObjectURL(mainImage.file)}
											alt="Main Image Preview"
											class="mx-auto max-h-48 max-w-xs rounded-lg object-contain"
										/>
										<button
											type="button"
											class="btn absolute -top-2 -right-2 btn-circle btn-sm btn-error"
											onclick={() => {
												mainImage = null;
											}}
										>
											×
										</button>
									</div>
								{:else}
									<div class="text-base-content/60">
										<img
											src={getImageUrl(mainImage)}
											alt="Main Image Preview"
											class="mx-auto max-h-48 max-w-xs rounded-lg object-contain"
										/>
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

										const file = target.files?.[0];

										if (file) {
											mainImage = {
												file,
												alt_text: '',
												is_primary: true,
												color: ''
											};
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
									{mainImage ? 'Change Image' : 'Select Image'}
								</button>
							</div>
						</div>

						<!-- <div class="form-control">
							<label class="label" for="main-alt-text">
								<span class="label-text text-sm font-medium">Main Image Alt Text</span>
							</label>
							<textarea
								id="main-alt-text"
								class="textarea-bordered textarea w-full textarea-sm"
								bind:value={mainImageAlt}
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
									bind:value={mainImageColor}
									placeholder="e.g., Red, Blue, Default"
								/>
								<input
									type="color"
									class="input-bordered input input-sm w-14 cursor-pointer"
									bind:value={mainImageColor}
								/>
							</div>
						</div> -->
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
