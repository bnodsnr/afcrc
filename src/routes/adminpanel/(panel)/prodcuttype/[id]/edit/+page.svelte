<script lang="ts">
	import { enhance } from '$app/forms';
	import { base } from '$lib/admin/paths';

	interface ProductType {
		id: number;
		name: string;
		code: string;
		description?: string;
		icon?: string;
		is_active?: boolean;
		created_at?: string;
		updated_at?: string;
		[key: string]: any;
	}

	let { data, form }: { data: { productType: ProductType }; form: any } = $props();
	let productType = $state(data.productType);

	let isActive = $state(productType?.is_active ?? true);
	let loading = $state(false);
</script>

<div class="min-h-screen bg-base-200">
	<div class="mx-auto">
		<!-- Breadcrumb Navigation -->
		<div class="mb-6 flex items-center gap-2 text-sm">
			<a href={base} class="link font-medium text-primary link-hover">Dashboard</a>
			<svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<a href={base + '/prodcuttype'} class="link font-medium text-primary link-hover">Product Types</a>
			<svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Edit Product Type</span>
		</div>

		<!-- Success/Error Messages -->
		{#if form?.success}
			<div class="mb-6 alert alert-success">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<span>{form.message || 'Product type updated successfully!'}</span>
			</div>
		{/if}
		{#if form?.error}
			<div class="mb-6 alert alert-error">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
				<span>{form.error}</span>
			</div>
		{/if}

		<!-- Form Content -->
		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					if (result.type === 'success') {
						await new Promise((resolve) => setTimeout(resolve, 1500));
						window.location.href = `${base}/prodcuttype`;
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
						<h2 class="mb-6 text-xl font-semibold">Product Type Details</h2>

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
									class="input-bordered input w-full"
									placeholder="e.g. Trending"
									value={productType.name || ''}
									required
								/>
							</div>

							<!-- Code -->
							<div class="form-control">
								<label class="label" for="code">
									<span class="label-text font-medium">Code</span>
								</label>
								<input
									type="text"
									id="code"
									name="code"
									class="input-bordered input w-full"
									placeholder="e.g. trending"
									value={productType.code || ''}
								/>
							</div>

							<!-- Description -->
							<div class="form-control">
								<label class="label" for="description">
									<span class="label-text font-medium">Description</span>
								</label>
								<textarea
									id="description"
									name="description"
									class="textarea-bordered textarea w-full"
									placeholder="Brief description about the product type"
									rows="4"
								>{productType.description || ''}</textarea>
							</div>
						</div>
					</div>
				</div>

				<!-- Sidebar -->
				<div class="space-y-6">
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
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
							{isActive ? 'This product type is currently active' : 'This product type is inactive'}
						</p>

						<!-- Action Buttons -->
						<div class="mt-6 flex gap-3">
							<a href={base + '/prodcuttype'} class="btn flex-1 btn-outline"> Cancel </a>
							<button type="submit" class="btn flex-1 btn-primary" disabled={loading}>
								{#if loading}
									<span class="loading loading-sm loading-spinner"></span>
									Processing...
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
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
