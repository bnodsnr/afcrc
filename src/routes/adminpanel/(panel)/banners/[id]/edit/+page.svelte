<script lang="ts">
	import { enhance } from '$app/forms';
	import { base } from '$lib/admin/paths';
	import { getImageUrl } from '$lib/admin/utils/image';

	interface Banner {
		id: number;
		title: string;
		image: string;
		primary_text?: string;
		secondary_text?: string;
		placement: string;
		link?: string;
		is_active: boolean;
		created_at?: string;
		updated_at?: string;
	}

	interface PageData {
		banner: Banner;
	}

	let { data, form }: { data: PageData; form: any } = $props();
	let banner = $state(data.banner);

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

	let primaryText = $state(banner?.primary_text || '');
	let secondaryText = $state(banner?.secondary_text || '');
	let isActive = $state(banner?.is_active ?? true);
	let imagePreview: string | null = $state(banner?.image ? getImageUrl(banner.image) : null);
	let imageInput: HTMLInputElement;
	let loading = $state(false);
	let placement = $state(banner?.placement || '');
	// Compress image using canvas
	async function compressImage(file: File): Promise<File> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = (event) => {
				const img = new Image();
				img.src = event.target?.result as string;
				img.onload = () => {
					const canvas = document.createElement('canvas');
					let { width, height } = img;

					// Resize to max 1920x1080 for banners
					const maxWidth = 1920;
					const maxHeight = 1080;
					if (width > maxWidth || height > maxHeight) {
						const ratio = Math.min(maxWidth / width, maxHeight / height);
						width *= ratio;
						height *= ratio;
					}

					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext('2d');
					ctx?.drawImage(img, 0, 0, width, height);

					// Convert to blob with compression
					canvas.toBlob(
						(blob) => {
							if (blob) {
								const compressedFile = new File([blob], file.name, {
									type: 'image/jpeg',
									lastModified: Date.now()
								});
								resolve(compressedFile);
							} else {
								reject(new Error('Failed to compress image'));
							}
						},
						'image/jpeg',
						0.75 // 75% quality for good balance
					);
				};
				img.onerror = () => reject(new Error('Failed to load image'));
			};
			reader.onerror = () => reject(new Error('Failed to read file'));
		});
	}

	async function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			const maxSize = 2 * 1024 * 1024; // 2MB in bytes

			// Validate file type first
			const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
			if (!validTypes.includes(file.type)) {
				addToast(`Invalid file type. Only PNG, JPG, GIF, WebP allowed`, 'error');
				target.value = ''; // Reset input
				return;
			}

			try {
				addToast(`Compressing image...`, 'info');
				const compressedFile = await compressImage(file);
				const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
				const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);

				// Check compressed file size
				if (compressedFile.size > maxSize) {
					addToast(`Compressed image still ${compressedSizeMB}MB, exceeds 2MB limit`, 'error');
					target.value = '';
					return;
				}

				// Replace file in input with compressed version
				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(compressedFile);
				target.files = dataTransfer.files;

				// Show preview
				const reader = new FileReader();
				reader.onload = (e) => {
					imagePreview = e.target?.result as string;
					addToast(`Image ready (${compressedSizeMB}MB)`, 'success');
				};
				reader.readAsDataURL(compressedFile);
			} catch (error) {
				console.error('Compression error:', error);
				addToast('Failed to compress image', 'error');
				target.value = '';
			}
		}
	}
	function removeImage() {
		imagePreview = null;
		if (imageInput) {
			imageInput.value = '';
		}
	}
</script>

<div class="min-h-screen bg-base-200">
	<div class="mx-auto">
		<!-- Breadcrumb Navigation -->
		<!-- <div class="mb-6 flex items-center gap-2 text-sm">
			<a href={base} class="link font-medium text-primary link-hover">Dashboard</a>
			<svg
				class="h-4 w-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<a href={base + '/banners'} class="link font-medium text-primary link-hover">Banners</a>
			<svg
				class="h-4 w-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Edit Banner</span>
		</div> -->

		<!-- Success/Error Messages -->
		{#if form?.success}
			<div class="mb-6 alert alert-success">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				<span>{form.message || 'Banner updated successfully!'}</span>
			</div>
		{/if}
		{#if form?.error}
			<div class="mb-6 alert alert-error">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				<span>{form.error}</span>
			</div>
		{/if}

		<!-- Form Content -->
		<form
			method="POST"
			enctype="multipart/form-data"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					if (result.type === 'success') {
						addToast('Banner updated successfully!', 'success');
						await new Promise((resolve) => setTimeout(resolve, 1500));
						window.location.href = `${base}/banners`;
					} else if (result.type === 'failure') {
						addToast('Failed to update banner', 'error');
						loading = false;
					}
				};
			}}
		>
			<input type="hidden" name="id" value={banner.id} />

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<!-- Main Content -->
				<div class="space-y-6 lg:col-span-2">
					<!-- Banner Text Content -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-6 text-xl font-semibold">Banner Text Content</h2>

						<div class="space-y-4">
							<!-- Placement -->
							<div class="form-control">
								<label class="label" for="placement">
									<span class="label-text font-medium">Placement</span>
								</label>
								<select
									id="placement"
									name="placement"
									class="select-bordered select w-full"
									bind:value={placement}
									required
								>
									<option value="">Select placement...</option>
									
									<option value="hero">Hero</option>
									<option value="agro">Agro Products</option>
									<option value="herbal">Herbal Products</option>
									<option value="meat">Premium Meat</option>
									<option value="beverage">Drinks & Beverage</option>
									<option value="about">About Us</option>
								</select>
							</div>

							<!-- Title -->
							<div class="form-control">
								<label class="label" for="title">
									<span class="label-text font-medium">Title *</span>
								</label>
								<input
									type="text"
									id="title"
									name="title"
									class="input-bordered input w-full"
									placeholder="Banner title"
									value={banner.title || ''}
									required
								/>
							</div>

							<!-- Primary Text -->
							<div class="form-control">
								<label class="label" for="primary_text">
									<span class="label-text font-medium">Primary Text (Heading)</span>
								</label>
								<input
									type="text"
									id="primary_text"
									name="primary_text"
									class="input-bordered input w-full"
									bind:value={primaryText}
									placeholder="Main banner heading"
									maxlength="100"
								/>
								<label class="label" for="primary_text">
									<span class="label-text-alt text-base-content/60">{primaryText.length}/100</span>
								</label>
							</div>

							<!-- Secondary Text -->
							<div class="form-control">
								<div>
									<label class="label" for="secondary_text">
										<span class="label-text font-medium">Secondary Text (Subheading)</span>
									</label>
								</div>
								<div>
									<textarea
										class="textarea-bordered textarea w-full"
										id="secondary_text"
										name="secondary_text"
										bind:value={secondaryText}
										placeholder="Supporting text or description"
										rows="3"
										maxlength="250"
									></textarea>
									<label class="label" for="secondary_text">
										<span class="label-text-alt text-base-content/60"
											>{secondaryText.length}/250</span
										>
									</label>
								</div>
							</div>

							<!-- Link URL -->
							<div class="form-control">
								<label class="label" for="link">
									<span class="label-text font-medium">Link URL</span>
								</label>
								<input
									type="url"
									id="link"
									name="link"
									class="input-bordered input w-full"
									placeholder="https://example.com/shop"
									value={banner.link || ''}
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Sidebar -->
				<div class="space-y-6">
					<!-- Banner Image -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold">Banner Image</h2>

						<div class="rounded-lg border-2 border-dashed border-base-300 p-6 text-center">
							{#if imagePreview}
								<div class="relative inline-block w-full">
									<img
										src={getImageUrl(imagePreview)}
										alt="Banner preview"
										class="h-48 w-full rounded-lg object-cover"
									/>
									<button
										type="button"
										class="btn absolute -top-2 -right-2 btn-circle btn-sm btn-error"
										onclick={removeImage}
										title="Remove image"
									>
										×
									</button>
								</div>
							{:else}
								<div class="text-base-content/60">
									<svg
										class="mx-auto mb-3 h-12 w-12"
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
									<p class="font-medium">Click to upload banner image</p>
									<p class="text-sm">PNG, JPG, GIF up to 2MB</p>
									<p class="mt-2 text-xs text-base-content/50">Recommended: 1200x400px</p>
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
								class="btn mt-4 btn-sm btn-primary"
								onclick={() => imageInput?.click()}
							>
								{imagePreview ? 'Change Image' : 'Upload Image'}
							</button>
						</div>

						<div class="form-control">
							<h2 class="mb-4 text-lg font-semibold">Status</h2>
							<label class="label cursor-pointer">
								<span class="label-text font-medium">Active</span>
								<input
									type="checkbox"
									name="is_active"
									class="toggle toggle-primary"
									bind:checked={isActive}
								/>
							</label>
							<p class="mt-2 text-sm text-base-content/60">
								{isActive ? 'This banner is currently active' : 'This banner is inactive'}
							</p>
						</div>

						<!-- Image Info -->
						<!-- <div class="mt-4 rounded-lg bg-base-200 p-4 text-sm text-base-content/70">
							<p class="mb-2 font-medium">Image Guidelines:</p>
							<ul class="list-inside list-disc space-y-1">
								<li>Recommended size: 1200x400px</li>
								<li>Max file size: 2MB</li>
								<li>Supported formats: PNG, JPG, GIF, WebP</li>
								<li>Use high quality images</li>
							</ul>
						</div> -->

						<!-- Action Buttons -->
						<div class="mt-6 flex gap-3">
							<a href={base + '/banners'} class="btn flex-1 btn-outline"> Cancel </a>
							<button type="submit" class="btn flex-1 btn-primary" disabled={loading}>
								{#if loading}
									<span class="loading loading-sm loading-spinner"></span>
									Processing...
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									Update
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
		</form>
	</div>
</div>

<!-- Toast Notifications -->
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
