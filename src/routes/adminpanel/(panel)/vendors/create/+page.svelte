<script lang="ts">
	import { enhance } from '$app/forms';
	import { base } from '$lib/admin/paths';

	let { form }: { form: any } = $props();

	let isActive = $state(true);
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
			<a href={base + '/vendors'} class="link font-medium text-primary link-hover">Vendors</a>
			<svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Create Vendor</span>
		</div>

		<!-- Success/Error Messages -->
		{#if form?.success}
			<div class="mb-6 alert alert-success">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<span>{form.message || 'Vendor created successfully!'}</span>
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
						window.location.href = `${base}/vendors`;
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
						<h2 class="mb-6 text-xl font-semibold">Vendor Details</h2>

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
									placeholder="Vendor name"
									value={form?.name || ''}
									required
								/>
							</div>

							<!-- Email -->
							<div class="form-control">
								<label class="label" for="email">
									<span class="label-text font-medium">Email</span>
								</label>
								<input
									type="email"
									id="email"
									name="email"
									class="input-bordered input w-full"
									placeholder="vendor@example.com"
									value={form?.email || ''}
								/>
							</div>

							<!-- Phone -->
							<div class="form-control">
								<label class="label" for="phone">
									<span class="label-text font-medium">Phone</span>
								</label>
								<input
									type="text"
									id="phone"
									name="phone"
									class="input-bordered input w-full"
									placeholder="+977-XXXXXXXXX"
									value={form?.phone || ''}
								/>
							</div>

							<!-- Address -->
							<div class="form-control">
								<label class="label" for="address">
									<span class="label-text font-medium">Address</span>
								</label>
								<input
									type="text"
									id="address"
									name="address"
									class="input-bordered input w-full"
									placeholder="Vendor address"
									value={form?.address || ''}
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
									placeholder="Brief description about the vendor"
									rows="4"
								>{form?.description || ''}</textarea>
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
							{isActive ? 'This vendor will be active' : 'This vendor will be inactive'}
						</p>

						<!-- Action Buttons -->
						<div class="mt-6 flex gap-3">
							<a href={base + '/vendors'} class="btn flex-1 btn-outline"> Cancel </a>
							<button type="submit" class="btn flex-1 btn-primary" disabled={loading}>
								{#if loading}
									<span class="loading loading-sm loading-spinner"></span>
									Processing...
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									Create
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
		</form>
	</div>
</div>
