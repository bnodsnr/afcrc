<script lang="ts">
	import { base } from '$lib/admin/paths';
	import { enhance } from '$app/forms';
	import RichTextEditor from '$lib/admin/components/RichTextEditor.svelte';

	let { data } = $props();
	let loading = $state(false);

	let form = $state({
		name: '',
		status: true,
		short_description: '',
		content: '',
		featured_image: null as File | null
	});

	let imagePreview = $state<string | null>(null);
	let imageInputElement: HTMLInputElement;

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

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			form.featured_image = file;

			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function removeImage() {
		form.featured_image = null;
		imagePreview = null;
		if (imageInputElement) {
			imageInputElement.value = '';
		}
	}
</script>

<div class="min-h-screen bg-base-200">
	<div class="mx-auto">
		<!-- Breadcrumb Navigation -->
		<div class="mb-6 flex items-center gap-2 text-sm">
			<a href={base} class="link link-hover text-primary font-medium">Dashboard</a>
			<svg
				class="w-4 h-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<a href={base + '/services'} class="link link-hover text-primary font-medium">All Services</a>
			<svg
				class="w-4 h-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Create Service</span>
		</div>

		<!-- Form Content -->
		<form
			method="POST"
			action="?/create"
			enctype="multipart/form-data"
			use:enhance={() => {
				loading = true;
				return async ({ result }) => {
					if (result.type === 'success') {
						await new Promise((resolve) => setTimeout(resolve, 1500));
						addToast('Service created successfully!', 'success');
						window.location.href = `${base}/services`;
					} else if (result.type === 'failure') {
						const message = (result.data?.message as string) || 'Failed to create service';
						addToast(message, 'error');
						loading = false;
					} else if (result.type === 'error') {
						addToast('An error occurred', 'error');
						loading = false;
					}
				};
			}}
		>
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Main Content -->
				<div class="lg:col-span-2 space-y-6">
					<div class="bg-base-100 rounded-lg shadow-sm p-6">
						<h2 class="text-xl font-semibold mb-6">Service Details</h2>

						<div class="space-y-4">
							<!-- Name -->
							<div class="form-control">
								<label class="label" for="name">
									<span class="label-text font-medium">Name *</span>
								</label>
								<input
									type="text"
									id="name"
									name="name"
									class="input input-bordered w-full"
									placeholder="e.g. Web Development"
									required
									bind:value={form.name}
								/>
							</div>

							<!-- Short Description -->
							<div class="form-control">
								<label class="label" for="short_description">
									<span class="label-text font-medium">Short Description</span>
								</label>
								<textarea
									id="short_description"
									name="short_description"
									class="textarea textarea-bordered w-full"
									placeholder="Brief excerpt shown in listings..."
									maxlength="250"
									bind:value={form.short_description}
								></textarea>
								<label class="label" for="short_description">
									<span class="label-text-alt text-base-content/60"
										>{form.short_description.length}/250</span
									>
								</label>
							</div>

							<!-- Content (Rich Text Editor) -->
							<RichTextEditor
								name="content"
								bind:value={form.content}
								label="Content"
								placeholder="Enter service description..."
							/>

							<!-- Status -->
							<div class="form-control">
								<h2 class="text-lg font-semibold mb-4">Status</h2>
								<label class="label cursor-pointer">
									<span class="label-text font-medium">Active</span>
									<input
										type="checkbox"
										name="status"
										class="toggle toggle-primary"
										bind:checked={form.status}
									/>
								</label>
								<p class="text-sm text-base-content/60 mt-2">
									{form.status ? 'This service is currently active' : 'This service is inactive'}
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Sidebar -->
				<div class="space-y-6">
					<!-- Featured Image -->
					<div class="bg-base-100 rounded-lg shadow-sm p-6">
						<h2 class="text-lg font-semibold mb-4">Featured Image</h2>

						<div class="border-2 border-dashed border-base-300 rounded-lg p-6 text-center">
							{#if imagePreview}
								<div class="relative inline-block w-full">
									<img
										src={imagePreview}
										alt="Featured image preview"
										class="w-full h-48 object-cover rounded-lg"
									/>
									<button
										type="button"
										class="btn btn-sm btn-error btn-circle absolute -top-2 -right-2"
										onclick={removeImage}
										title="Remove image"
									>
										×
									</button>
								</div>
							{:else}
								<div class="text-base-content/60">
									<svg
										class="mx-auto h-12 w-12 mb-3"
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
									<p class="text-sm">PNG, JPG, GIF, WebP up to 2MB</p>
									<p class="text-xs mt-2 text-base-content/50">Recommended: 1200x800px</p>
								</div>
							{/if}
							<input
								type="file"
								name="featured_image"
								class="hidden"
								accept="image/*"
								bind:this={imageInputElement}
								onchange={handleImageUpload}
							/>
							<button
								type="button"
								class="btn btn-primary btn-sm mt-4"
								onclick={() => imageInputElement?.click()}
							>
								{imagePreview ? 'Change Image' : 'Upload Image'}
							</button>
						</div>

						<!-- Image Info -->
						<div class="mt-4 p-4 bg-base-200 rounded-lg text-sm text-base-content/70">
							<p class="font-medium mb-2">Image Guidelines:</p>
							<ul class="list-disc list-inside space-y-1">
								<li>Recommended size: 1200x800px</li>
								<li>Max file size: 2MB</li>
								<li>Supported formats: PNG, JPG, GIF, WebP</li>
								<li>Use high quality images</li>
							</ul>
						</div>

						<!-- Action Buttons -->
						<div class="mt-6 flex gap-3">
							<a href={base + '/services'} class="btn btn-outline flex-1"> Cancel </a>
							<button type="submit" class="btn btn-primary flex-1" disabled={loading}>
								{#if loading}
									<span class="loading loading-spinner loading-sm"></span>
									Saving...
								{:else}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									Save
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
		</form>
	</div>
</div>

<div class="fixed top-4 right-4 flex flex-col gap-2 z-50">
	{#each toasts as t (t.id)}
		<div
			class="px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs text-white font-medium animate-in fade-in slide-in-from-top-2"
			style="background: {t.type === 'success'
				? 'linear-gradient(90deg, #16a34a, #059669)'
				: t.type === 'error'
					? 'linear-gradient(90deg, #dc2626, #b91c1c)'
					: 'linear-gradient(90deg, #3b82f6, #2563eb)'}"
		>
			<div class="flex items-center gap-2">
				{#if t.type === 'success'}
					<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else if t.type === 'error'}
					<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
