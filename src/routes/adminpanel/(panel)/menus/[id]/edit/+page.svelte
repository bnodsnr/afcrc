<script lang="ts">
	import { base } from '$lib/admin/paths';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import RichTextEditor from '$lib/admin/components/RichTextEditor.svelte';
	import { getImageUrl } from '$lib/admin/utils/image';

	let { data, form } = $props();

	const POSITION_OPTIONS = [
		{ value: 'header', label: 'Header' },
		{ value: 'footer', label: 'Footer' },
		{ value: 'sidebar', label: 'Sidebar' },
		{ value: 'component', label: 'Component' }
	];

	const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
	const VALID_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

	// The form is initialised once from the loaded menu, later values come from user input.
	// svelte-ignore state_referenced_locally
	const source = data.menu ?? {};

	function toStr(value: unknown): string {
		return value === null || value === undefined ? '' : String(value);
	}

	function toBool(value: unknown, fallback: boolean): boolean {
		if (typeof value === 'boolean') return value;
		if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
		if (typeof value === 'number') return value === 1;
		return fallback;
	}

	function toOrder(value: unknown): number {
		const parsed = Number(value);
		return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
	}

	// A menu saved as a component keeps its component name even when its position
	// is not (or no longer) the `component` position.
	const isComponent =
		toBool(source.is_component, false) || toStr(source.component_name) !== '';

	let menu = $state({
		name: toStr(source.name),
		url: toStr(source.url),
		slug: toStr(source.slug),
		position: toStr(source.position) || 'header',
		is_parent: toBool(source.is_parent, true),
		component_name: toStr(source.component_name),
		parent: (source.parent === null || source.parent === undefined || source.parent === ''
			? ''
			: String(source.parent)) as number | string | null,
		page_content: toStr(source.page_content),
		order: toOrder(source.order),
		is_active: toBool(source.is_active, true)
	});

	let positionOptions = $derived(
		menu.position && !POSITION_OPTIONS.some((o) => o.value === menu.position)
			? [{ value: menu.position, label: `${menu.position} (current)` }, ...POSITION_OPTIONS]
			: POSITION_OPTIONS
	);

	let loading = $state(false);
	let imageInput = $state<HTMLInputElement | null>(null);
	let existingImage = toStr(source.featured_image);
	let imagePreview = $state<string | null>(existingImage ? getImageUrl(existingImage) : null);
	let selectedFile = $state<File | null>(null);
	let removeImage = $state(false);

	let isComponentMenu = $derived(menu.position === 'component' || isComponent);

	let canSubmit = $derived(
		menu.name.trim().length > 0 &&
			(menu.is_parent || (menu.parent !== '' && menu.parent !== null)) &&
			(!isComponentMenu || menu.component_name !== '')
	);

	interface Toast {
		id: number;
		message: string;
		type: 'success' | 'error' | 'info';
	}
	let toasts = $state<Toast[]>([]);

	function addToast(message: string, type: Toast['type'] = 'error') {
		const id = Date.now() + Math.random();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 3000);
	}

	function autoSlug() {
		if (!menu.slug) {
			menu.slug = menu.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '');
		}
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

			// Validate file type first
			if (!VALID_IMAGE_TYPES.includes(file.type)) {
				addToast(`Invalid file type. Only PNG, JPG, GIF, WebP allowed`, 'error');
				target.value = '';
				return;
			}

			try {
				addToast(`Compressing image...`, 'info');
				const compressedFile = await compressImage(file);
				const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);

				if (compressedFile.size > MAX_IMAGE_SIZE) {
					addToast(`Compressed image still ${compressedSizeMB}MB, exceeds 2MB limit`, 'error');
					target.value = '';
					return;
				}

				selectedFile = compressedFile;
				removeImage = false;
				// Reset so selecting the same file again still fires a change event;
				// the compressed file is attached to the request through `selectedFile`.
				target.value = '';

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

	function removeImageFromForm() {
		imagePreview = null;
		selectedFile = null;
		removeImage = true;
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
			<span class="text-base-content/60">Edit Menu</span>
		</div>

		{#if form?.success}
			<div class="mb-6 alert alert-success">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<span>Menu updated successfully!</span>
			</div>
		{/if}

		{#if form?.message && !form?.success}
			<div class="mb-6 alert alert-error">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
				<span>{form.message}</span>
			</div>
		{/if}

		<form
			method="POST"
			action="?/updateMenu"
			enctype="multipart/form-data"
			use:enhance={({ formData }) => {
				if (selectedFile) {
					formData.set('image', selectedFile, selectedFile.name);
				}
				loading = true;
				return async ({ result, update }) => {
					if (result.type === 'success') {
						addToast('Menu updated successfully!', 'success');
						loading = false;
						await goto(`${base}/menus`);
					} else if (result.type === 'failure') {
						const message = (result.data as { message?: string } | undefined)?.message;
						addToast(message || 'Failed to update menu', 'error');
						loading = false;
						await update({ reset: false });
					} else if (result.type === 'redirect') {
						await update();
					} else {
						addToast(result.error?.message || 'Failed to update menu', 'error');
						loading = false;
					}
				};
			}}
		>
			<input type="hidden" name="remove_image" value={removeImage ? 'true' : 'false'} />

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
									{#each positionOptions as option (option.value)}
										<option value={option.value}>{option.label}</option>
									{/each}
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
								<span class="label font-semibold">Menu Type</span>
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
										{#each data.parentMenus as pm (pm.id)}
											<option value={pm.id}>{pm.name} ({pm.position})</option>
										{/each}
									</select>
									{#if data.parentMenus.length === 0}
										<p class="mt-1 text-xs text-error">
											No parent menu available. Create a parent menu first.
										</p>
									{/if}
								</div>
							{:else}
								<input type="hidden" name="parent" value="" />
							{/if}

							<!-- Component Name (shown when position = component) -->
							<input
								type="hidden"
								name="is_component"
								value={isComponentMenu ? 'true' : 'false'}
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
								<input type="hidden" name="component_name" value={menu.component_name} />
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
										title="Remove image"
										onclick={removeImageFromForm}
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
							<button
								type="submit"
								class="btn flex-1 btn-primary"
								disabled={loading || !canSubmit}
							>
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
									Update Menu
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
				: t.type === 'info'
					? 'linear-gradient(90deg, #0284c7, #0369a1)'
					: 'linear-gradient(90deg, #dc2626, #b91c1c)'}"
		>
			<div class="flex items-center gap-2">
				{t.message}
			</div>
		</div>
	{/each}
</div>
