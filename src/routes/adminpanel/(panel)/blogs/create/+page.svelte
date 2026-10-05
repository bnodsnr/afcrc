<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { enhance } from '$app/forms';
	import RichTextEditor from '$lib/admin/components/RichTextEditor.svelte';
	let description = $state('');
	let content = $state('<p>Initial content</p>');
	let form: any;
	let { data } = $props();
	let isSubmitting = $state(false);

	// Blog form data
	let blog = $state({
		title: '',
		author: '',
		content: '',
		status: true,
		image: null as File | null
	});

	let loading = $state(false);
	let imagePreview = $state<string | null>(null);
	let imageInputElement: HTMLInputElement;

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

	// Handle image upload
	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			blog.image = file;

			// Generate preview
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	// Remove image
	function removeImage() {
		blog.image = null;
		imagePreview = null;
		if (imageInputElement) {
			imageInputElement.value = '';
		}
	}

	// Handle form submission
	function handleFormSubmit() {
		return async ({ result, update }: any) => {
			isSubmitting = true;

			if (result.type === 'success') {
				addToast('Blog created successfully!', 'success');
				await new Promise((resolve) => setTimeout(resolve, 1500));
				window.location.href = `${base}/blogs`;
			} else if (result.type === 'failure') {
				const message = result.data?.message || 'Failed to create blog';
				addToast(message, 'error');
				isSubmitting = false;
			} else if (result.type === 'error') {
				addToast('An error occurred', 'error');
				isSubmitting = false;
			}
		};
	}

	onMount(() => {
		// Initialize form if needed
	});
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
			<a href={base + '/blogs'} class="link link-hover text-primary font-medium">All Blogs</a>
			<svg
				class="w-4 h-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Create Blog</span>
		</div>

		<!-- Success/Error Messages -->
		{#if form?.success}
			<div class="alert alert-success mb-6">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				<span>{form.message || 'Banner created successfully!'}</span>
			</div>
		{/if}
		{#if form?.error}
			<div class="alert alert-error mb-6">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				<div class="flex-1">
					<span>{form.error}</span>
					{#if form?.details}
						<p class="text-sm mt-2 opacity-75">{form.details}</p>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Form Content -->
		<form
			method="POST"
			action="?/createBlog"
			enctype="multipart/form-data"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					if (result.type === 'success') {
						await new Promise((resolve) => setTimeout(resolve, 1500));
						addToast('Blog created successfully!', 'success');
						window.location.href = `${base}/blogs`;
					} else if (result.type === 'failure') {
						addToast('Failed to create blog', 'error');
						loading = false;
					}
				};
			}}
		>
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Main Content -->
				<div class="lg:col-span-2 space-y-6">
					<!-- Banner Text Content -->
					<div class="bg-base-100 rounded-lg shadow-sm p-6">
						<h2 class="text-xl font-semibold mb-6">Title</h2>

						<div class="space-y-4">
							<!-- Title -->
							<div class="form-control">
								<label class="label" for="title">
									<span class="label-text font-medium">Title *</span>
								</label>
								<input
									type="text"
									id="title"
									name="title"
									class="input input-bordered w-full"
									placeholder="Title"
									required
									bind:value={blog.title}
								/>
							</div>

							<!-- Primary Text -->
							<div class="form-control">
								<label class="label" for="author">
									<span class="label-text font-medium">Author</span>
								</label>
								<input
									type="text"
									id="author"
									name="author"
									class="input input-bordered w-full"
									bind:value={blog.author}
									placeholder="Author Name"
									maxlength="100"
								/>
								<label class="label" for="author">
									<span class="label-text-alt text-base-content/60">{blog.author.length}/100</span>
								</label>
							</div>

							<!-- TipTap replaces textarea -->
							<RichTextEditor
								name="content"
								bind:value={blog.content}
								label="Content"
								placeholder="Enter content..."
							/>
							<!-- Secondary Text -->
							<!-- <div class="form-control">
								<div>
									<label class="label" for="secondary_text">
										<span class="label-text font-medium">content</span>
									</label>
								</div>
								<div>
									<textarea
										class="textarea textarea-bordered w-full"
										id="secondary_text"
										name="secondary_text"
										bind:value={blog.content}
										placeholder="Supporting text or description"
									></textarea>
									<label class="label" for="secondary_text">
										<span class="label-text-alt text-base-content/60"
											>{blog.content.length}/250</span
										>
									</label>
								</div>
							</div> -->

							<!-- Link URL -->

							<div class="form-control">
								<h2 class="text-lg font-semibold mb-4">Status</h2>
								<label class="label cursor-pointer">
									<span class="label-text font-medium">Active</span>
									<input
										type="checkbox"
										name="is_active"
										class="toggle toggle-primary"
										bind:checked={blog.status}
									/>
								</label>
								<p class="text-sm text-base-content/60 mt-2">
									{blog.status ? 'This banner is currently active' : 'This banner is inactive'}
								</p>
							</div>
						</div>
					</div>
				</div>
				<!-- Sidebar -->
				<div class="space-y-6">
					<!-- Feature Image -->
					<div class="bg-base-100 rounded-lg shadow-sm p-6">
						<h2 class="text-lg font-semibold mb-4">Feature Image</h2>

						<div class="border-2 border-dashed border-base-300 rounded-lg p-6 text-center">
							{#if imagePreview}
								<div class="relative inline-block w-full">
									<img
										src={imagePreview}
										alt="Feature image preview"
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
									<p class="font-medium">Click to upload banner image</p>
									<p class="text-sm">PNG, JPG, GIF up to 2MB</p>
									<p class="text-xs mt-2 text-base-content/50">Recommended: 1200x400px</p>
								</div>
							{/if}
							<input
								type="file"
								name="image"
								class="hidden"
								accept="image/*"
								bind:this={blog.image}
								onchange={handleImageUpload}
							/>
							<button
								type="button"
								class="btn btn-primary btn-sm mt-4"
								onclick={() => blog.image?.click()}
							>
								{imagePreview ? 'Change Image' : 'Upload Image'}
							</button>
						</div>

						<!-- Image Info -->
						<div class="mt-4 p-4 bg-base-200 rounded-lg text-sm text-base-content/70">
							<p class="font-medium mb-2">Image Guidelines:</p>
							<ul class="list-disc list-inside space-y-1">
								<li>Recommended size: 1200x400px</li>
								<li>Max file size: 2MB</li>
								<li>Supported formats: PNG, JPG, GIF, WebP</li>
								<li>Use high quality images</li>
							</ul>
						</div>

						<!-- Action Buttons -->
						<div class="mt-6 flex gap-3">
							<a href={base + '/blogs'} class="btn btn-outline flex-1"> Cancel </a>
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
