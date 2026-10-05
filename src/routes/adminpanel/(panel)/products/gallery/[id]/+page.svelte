<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { goto } from '$app/navigation';
	import { getImageUrl } from '$lib/admin/utils/image';
	import { PUBLIC_API_BASE_URL } from '$env/static/public'; // Use your env variable if available

	interface ProductImage {
		id: number;
		image: string;
		alt_text: string | null;
		is_primary: boolean;
		color: string | null;
	}
	let { data } = $props();
	let product = data.product;

	let gallery = $state<ProductImage[]>(product.gallery_images || []);
	let showUploadModal = $state(false);
	let uploadForm = $state({
		file: null as File | null,
		alt_text: '',
		preview: '' as string,
		mainImageColor: ''
	});
	let isUploading = $state(false);
	let uploadError = $state('');
	let showLightbox = $state(false);
	let lightboxIndex = $state(0);
	let isDeleting = $state(false);

	async function deleteImage(imageId: number, event: Event) {
		event.stopPropagation();

		if (!confirm('Are you sure you want to delete this image?')) {
			return;
		}

		isDeleting = true;
		try {
			const response = await fetch(`?/deleteImage`, {
				method: 'POST',
				body: new URLSearchParams({
					imageId: imageId.toString()
				}),
				credentials: 'include'
			});

			if (!response.ok) {
				let error: any = {};
				try {
					error = await response.json();
				} catch {
					error = { message: 'Delete failed' };
				}
				uploadError = error?.message || 'Delete failed';
				addToast('Failed to delete image', 'error');
				return;
			}

			// Remove from gallery state
			gallery = gallery.filter((img) => img.id !== imageId);
			addToast('Image deleted successfully', 'success');
		} catch (error) {
			uploadError = error instanceof Error ? error.message : 'An error occurred during deletion';
			addToast('Error deleting image', 'error');
		} finally {
			isDeleting = false;
		}
	}

	function openLightbox(index: number) {
		lightboxIndex = index;
		showLightbox = true;
	}

	function closeLightbox() {
		showLightbox = false;
	}

	function previousImage() {
		lightboxIndex = (lightboxIndex - 1 + gallery.length) % gallery.length;
	}

	function nextImage() {
		lightboxIndex = (lightboxIndex + 1) % gallery.length;
	}

	onMount(() => {
		const handleKeydown = (e: KeyboardEvent) => {
			if (!showLightbox) return;

			if (e.key === 'Escape') {
				closeLightbox();
			} else if (e.key === 'ArrowLeft') {
				previousImage();
			} else if (e.key === 'ArrowRight') {
				nextImage();
			}
		};

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	function openDialog() {
		showUploadModal = true;
		uploadError = '';
	}

	function closeDialog() {
		showUploadModal = false;
		uploadForm = {
			file: null,
			alt_text: '',
			preview: '',
			mainImageColor: ''
		};
		uploadError = '';
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		console.log('Selected file:', file);

		if (file) {
			if (!file.type.startsWith('image/')) {
				uploadError = 'Please select a valid image file';
				return;
			}

			uploadForm.file = file;
			const reader = new FileReader();
			reader.onload = (event) => {
				uploadForm.preview = event.target?.result as string;
			};
			reader.readAsDataURL(file);
			uploadError = '';
		}
	}

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

	async function handleUpload() {
		if (!uploadForm.file) {
			uploadError = 'Please select an image';
			alert(uploadError);
			return;
		}

		isUploading = true;
		uploadError = '';

		try {
			const formData = new FormData();
			formData.append('image', uploadForm.file);
			formData.append('alt_text', uploadForm.alt_text);
			formData.append('color', uploadForm.mainImageColor);

			const response = await fetch(`?/uploadImage`, {
				method: 'POST',
				body: formData,
				credentials: 'include'
			});

			if (!response.ok) {
				let error: any = {};
				try {
					error = await response.json();
				} catch {
					error = { message: 'Upload failed' };
				}
				uploadError = error?.message || 'Upload failed';
				return;
			}

			const result = await response.json();

			addToast('Image uploaded successfully', 'success');
			await new Promise((resolve) => setTimeout(resolve, 1500));
			goto(`${base}/products/gallery/${product.id}`); // Navigate to the gallery page to show the new image
			// window.location.href = `${base}/products/gallery/${product.id}`; // Refresh the page to show the new image
			// closeDialog();
		} catch (error) {
			uploadError = error instanceof Error ? error.message : 'An error occurred during upload';
		} finally {
			isUploading = false;
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
			<a href={base + '/products'} class="link font-medium text-primary link-hover">Products</a>
			<svg
				class="h-4 w-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Variations</span>
		</div>
		<!-- Header with Filters -->
		<div class="mb-6 rounded-lg">
			<div class="mb-4 flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Product Variations</h1>
					<p class="text-sm">Manage your product variations</p>
				</div>
				<button
					onclick={openDialog}
					class="btn-default btn gap-2 shadow-md transition-shadow btn-sm hover:shadow-lg"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Upload Image
				</button>
			</div>
		</div>

		<div class="overflow-hidden rounded-lg">
			{#if gallery.length > 0}
				<div class="grid grid-cols-1 gap-4 p-2 md:grid-cols-3">
					{#each gallery as image, index (image.id)}
						<div class="group relative overflow-hidden rounded-lg bg-base-200 p-2 shadow-md">
							<button
								type="button"
								onclick={() => openLightbox(index)}
								class="h-48 w-full cursor-pointer"
							>
								<img
									src={getImageUrl(image.image)}
									alt={image.alt_text || product.name}
									class="h-full w-full rounded-lg object-cover transition-all group-hover:brightness-75"
								/>
								<div
									class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
								>
									<svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
										<path d="M5.5 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="red" />
									</svg>
								</div>
							</button>

							<!-- Delete Button -->
							<button
								type="button"
								onclick={(e) => deleteImage(image.id, e)}
								disabled={isDeleting}
								class="btn absolute top-2 right-2 btn-circle opacity-0 transition-opacity btn-sm btn-error group-hover:opacity-100"
								title="Delete image"
								aria-label="Delete image"
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
					{/each}
				</div>
			{:else}
				<div class="p-6 text-center text-base-content/60">
					<p>No images available for this product.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Upload Image Modal -->
{#if showUploadModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-md rounded-lg bg-base-100 shadow-xl">
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-base-300 p-6">
				<h2 class="text-xl font-bold">Upload Image</h2>
				<button
					onclick={closeDialog}
					class="btn btn-circle btn-ghost btn-sm"
					disabled={isUploading}
				>
					✕
				</button>
			</div>

			<!-- Modal Body -->
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleUpload();
				}}
				class="space-y-4 p-6"
			>
				<!-- Image Preview -->
				{#if uploadForm.preview}
					<div
						class="flex h-40 w-full items-center justify-center overflow-hidden rounded-lg bg-base-200"
					>
						<img src={uploadForm.preview} alt="Preview" class="h-full w-full object-contain" />
					</div>
				{/if}

				<!-- File Input -->
				<div class="form-control w-full">
					<label class="label" aria-label="select image" for="file-input">
						<span class="label-text" aria-label="select image">Select Image</span>
					</label>
					<input
						type="file"
						accept="image/*"
						name="file"
						id="file-input"
						onchange={handleFileSelect}
						class="file-input-bordered file-input w-full"
						disabled={isUploading}
						required
					/>
				</div>

				<!-- Alt Text Input -->
				<div class="form-control w-full">
					<label class="label" for="alt-text">
						<span class="label-text" aria-label="alt text">Alt Text (optional)</span>
					</label>
					<input
						type="text"
						name="alt_text"
						id="alt-text"
						placeholder="Describe the image"
						bind:value={uploadForm.alt_text}
						class="input-bordered input w-full"
						disabled={isUploading}
					/>
				</div>
				<div class="form-control">
					<label class="label" for="main-color">
						<span class="label-text text-sm font-medium">Product Color</span>
					</label>
					<div class="flex gap-2">
						<input
							id="main-color"
							type="text"
							name="mainImageColor"
							class="input-bordered input input-sm flex-grow"
							bind:value={uploadForm.mainImageColor}
							placeholder="e.g., Red, Blue, Default"
						/>
						<input
							type="color"
							class="input-bordered input input-sm w-14 cursor-pointer"
							bind:value={uploadForm.mainImageColor}
						/>
					</div>
				</div>

				<!-- Error Message -->
				{#if uploadError}
					<div class="alert alert-error">
						<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2"
							/>
						</svg>
						<span>{uploadError}</span>
					</div>
				{/if}

				<!-- Modal Footer -->
				<div class="flex justify-end gap-2 border-t border-base-300 pt-4">
					<button type="button" onclick={closeDialog} class="btn btn-ghost" disabled={isUploading}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" disabled={isUploading || !uploadForm.file}>
						{#if isUploading}
							<span class="loading loading-sm loading-spinner"></span>
							Uploading...
						{:else}
							Upload
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

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

<!-- Lightbox Gallery Modal -->
{#if showLightbox && gallery.length > 0}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
		<!-- Close Button -->
		<button
			type="button"
			onclick={closeLightbox}
			aria-label="Close lightbox"
			class="btn absolute top-4 right-4 btn-circle text-white btn-ghost hover:bg-white/20"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>

		<!-- Main Image -->
		<div class="flex h-full w-full max-w-4xl items-center justify-center">
			<img
				src={getImageUrl(gallery[lightboxIndex].image)}
				alt={gallery[lightboxIndex].alt_text || product.name}
				class="max-h-[90vh] max-w-full object-contain"
			/>
		</div>

		<!-- Previous Button -->
		<button
			type="button"
			aria-label="Previous image"
			onclick={previousImage}
			class="btn absolute left-4 btn-circle text-2xl text-white btn-ghost hover:bg-white/20"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>

		<!-- Next Button -->
		<button
			type="button"
			aria-label="Next image"
			onclick={nextImage}
			class="btn absolute right-4 btn-circle text-2xl text-white btn-ghost hover:bg-white/20"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>

		<!-- Image Counter -->
		<div
			class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white"
		>
			{lightboxIndex + 1} / {gallery.length}
		</div>

		<!-- Image Info -->
		{#if gallery[lightboxIndex].alt_text}
			<div
				class="absolute bottom-16 left-1/2 max-w-xs -translate-x-1/2 rounded-lg bg-black/70 px-4 py-2 text-center text-sm text-white"
			>
				{gallery[lightboxIndex].alt_text}
			</div>
		{/if}
	</div>
{/if}
