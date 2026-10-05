<script lang="ts">
	import { base } from '$lib/admin/paths';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import RichTextEditor from '$lib/admin/components/RichTextEditor.svelte';

	let { data } = $props();

	let form = $state<any>(null);
	let loading = $state(false);
	let imageInput: HTMLInputElement;
	let menu = $state({
		name: '',
		url: '',
		slug: '',
		position: 'header',
		is_parent: true,
		component_name: '',
		parent: null as number | null,
		page_content: '',
		order: 0,
		is_active: true
	});

	let imagePreview = $state<string | null>(null);
	let selectedFile: File | null = $state(null);
	let fileInput: HTMLInputElement | null = $state(null);

	onMount(() => {});
	// let selectedFile = $state(null);

	function autoSlug() {
		if (!menu.slug) {
			menu.slug = menu.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '');
		}
	}

	// function handleImageUpload(event: Event) {
	// 	const target = event.target as HTMLInputElement;
	// 	if (target.files && target.files[0]) {
	// 		const reader = new FileReader();
	// 		reader.onload = (e) => {
	// 			imagePreview = e.target?.result as string;
	// 		};
	// 		reader.readAsDataURL(target.files[0]);
	// 	}
	// }

	interface Toast {
		id: number;
		message: string;
		type: 'success' | 'error';
	}
	let toasts = $state<Toast[]>([]);

	function addToast(message: string, type: Toast['type'] = 'error') {
		const id = Date.now();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 3000);
	}

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
			<a href={base + '/menus'} class="link font-medium text-primary link-hover">Menus</a>
			<svg
				class="h-4 w-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Create Menu</span>
		</div>

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
				<span>Menu created successfully!</span>
			</div>
		{/if}

		{#if form?.message && !form?.success}
			<div class="mb-6 alert alert-error">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				<span>{form.message}</span>
			</div>
		{/if}

		<form
			method="POST"
			action="?/createMenu"
			enctype="multipart/form-data"
			use:enhance={({ formData }) => {
				loading = true;
				return async ({ result, update }) => {
					if (result.type === 'success') {
						addToast('Menu created successfully!', 'success');
						await new Promise((r) => setTimeout(r, 1000));
						window.location.href = `${base}/menus`;
					} else if (result.type === 'failure') {
						console.error('Form submission failed:', result.data);
						addToast(result.data?.message || 'Failed to create menu', 'error');
						loading = false;
					} else {
						loading = false;
					}
				};
			}}
		>
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<!-- Main Content -->
				<div class="space-y-6 lg:col-span-2">
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-6 text-xl font-semibold">Menu Details</h2>
						<div class="space-y-4">
							<!-- Name -->
							<div class="form-control">
								<label class="label" for="name">
									<span class="label-text font-medium"
										>Page Name <span class="text-error">*</span></span
									>
								</label>
								<input
									id="name"
									name="name"
									type="text"
									class="input-bordered input w-full"
									placeholder="Enter menu name"
									bind:value={menu.name}
									oninput={autoSlug}
									required
								/>
							</div>

							<!-- URL -->
							<div class="form-control">
								<label class="label" for="url">
									<span class="label-text font-semibold">URL</span>
								</label>
								<input
									id="url"
									name="url"
									type="url"
									class="input-bordered input w-full"
									placeholder="https://example.com"
									bind:value={menu.url}
								/>
							</div>

							<!-- Slug -->
							<div class="form-control">
								<label class="label" for="slug">
									<span class="label-text font-semibold">Slug</span>
								</label>
								<input
									id="slug"
									name="slug"
									type="text"
									class="input-bordered input w-full"
									placeholder="auto-generated-slug"
									bind:value={menu.slug}
								/>
							</div>

							<!-- Page Content (Rich Text Editor) -->
							<div class="form-control">
								<RichTextEditor
									name="page_content"
									bind:value={menu.page_content}
									label="Page Content"
									placeholder="Enter page content..."
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Sidebar -->
				<div class="space-y-6">
					<!-- Settings -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold">Settings</h2>
						<div class="space-y-4">
							<!-- Position -->
							<div class="form-control">
								<label class="label" for="position">
									<span class="label-text font-medium"
										>Position <span class="text-error">*</span></span
									>
								</label>
								<select
									id="position"
									name="position"
									class="select-bordered select w-full"
									bind:value={menu.position}
								>
									<option value="header">Header</option>
									<option value="footer">Footer</option>
									<option value="sidebar">Sidebar</option>
									<option value="component">Component</option>
								</select>
							</div>

							<!-- Order -->
							<div class="form-control">
								<label class="label" for="order">
									<span class="label-text font-semibold">Order</span>
								</label>
								<input
									id="order"
									name="order"
									type="number"
									class="input-bordered input w-full"
									bind:value={menu.order}
									min="0"
								/>
							</div>

							<!-- Menu Type -->
							<input type="hidden" name="is_parent" value={menu.is_parent ? 'true' : 'false'} />
							<div class="form-control">
								<label class="label" for="menu-type">
									<span class="label-text font-semibold">Menu Type</span>
								</label>
								<div class="flex items-center gap-4 pt-2">
									<label class="flex cursor-pointer items-center gap-2">
										<input
											type="radio"
											class="radio radio-sm radio-primary"
											checked={menu.is_parent === true}
											onchange={() => {
												menu.is_parent = true;
												menu.parent = null;
											}}
										/>
										<span class="label-text">Parent Menu</span>
									</label>
									<label class="flex cursor-pointer items-center gap-2">
										<input
											type="radio"
											class="radio radio-sm radio-primary"
											checked={menu.is_parent === false}
											onchange={() => {
												menu.is_parent = false;
											}}
										/>
										<span class="label-text">Sub-menu</span>
									</label>
								</div>
							</div>

							<!-- Parent Menu (shown when is_parent = false) -->
							{#if !menu.is_parent}
								<div class="form-control">
									<label class="label" for="parent">
										<span class="label-text font-medium"
											>Parent Menu <span class="text-error">*</span></span
										>
									</label>
									<select
										id="parent"
										name="parent"
										class="select-bordered select w-full"
										bind:value={menu.parent}
									>
										<option value="">Select parent menu</option>
										{#each data.parentMenus as pm}
											<option value={pm.id}>{pm.name} ({pm.position})</option>
										{/each}
									</select>
								</div>
							{:else}
								<input type="hidden" name="parent" value="" />
							{/if}

							<!-- Component Name (shown when position = component) -->
							<input
								type="hidden"
								name="is_component"
								value={menu.position === 'component' ? 'true' : 'false'}
							/>

							{#if menu.position === 'component'}
								<div class="form-control">
									<label class="label" for="component_name">
										<span class="label-text font-medium"
											>Component Name <span class="text-error">*</span></span
										>
									</label>
									<input
										id="component_name"
										name="component_name"
										type="text"
										class="input-bordered input w-full"
										placeholder="e.g. hero"
										bind:value={menu.component_name}
										required
									/>
									<p class="mt-1 text-xs text-base-content/50">
										Enter the name of the component this menu item links to
									</p>
								</div>
							{:else}
								<input type="hidden" name="component_name" value="" />
							{/if}

							<!-- Active Status -->
							<input type="hidden" name="is_active" value={menu.is_active ? 'true' : 'false'} />
							<div class="form-control">
								<label class="label cursor-pointer justify-start gap-3">
									<input
										type="checkbox"
										class="toggle toggle-primary"
										checked={menu.is_active}
										onchange={() => {
											menu.is_active = !menu.is_active;
										}}
									/>
									<span class="label-text font-semibold">Active</span>
								</label>
							</div>
						</div>
					</div>

					<!-- Featured Image -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold">Featured Image</h2>
						<div class="rounded-lg border-2 border-dashed border-base-300 p-6 text-center">
							{#if imagePreview}
								<div class="relative inline-block w-full">
									<img
										src={imagePreview}
										alt="Preview"
										class="h-48 w-full rounded-lg object-cover"
									/>
									<button
										type="button"
										class="btn absolute -top-2 -right-2 btn-circle btn-sm btn-error"
										onclick={removeImage}
									>
										x
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
									<p class="font-medium">Click to upload image</p>
									<p class="text-sm">PNG, JPG, GIF up to 2MB</p>
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
					</div>

					<!-- Action Buttons -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<div class="flex gap-3">
							<a href={base + '/menus'} class="btn flex-1 btn-outline">Cancel</a>
							<button type="submit" class="btn flex-1 btn-primary" disabled={loading || !menu.name}>
								{#if loading}
									<span class="loading loading-sm loading-spinner"></span>
									Saving...
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									Create Menu
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
		</form>
	</div>
</div>

<!-- Toast -->
<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
	{#each toasts as t (t.id)}
		<div
			class="max-w-xs rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg"
			style="background: {t.type === 'success'
				? 'linear-gradient(90deg, #16a34a, #059669)'
				: 'linear-gradient(90deg, #dc2626, #b91c1c)'}"
		>
			<div class="flex items-center gap-2">
				{t.message}
			</div>
		</div>
	{/each}
</div>
