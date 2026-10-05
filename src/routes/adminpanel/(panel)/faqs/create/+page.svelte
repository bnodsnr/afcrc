<script lang="ts">
	import { base } from '$lib/admin/paths';
	import { enhance } from '$app/forms';
	import RichTextEditor from '$lib/admin/components/RichTextEditor.svelte';

	let form = $state<any>(null);
	let loading = $state(false);

	let faq = $state({
		question: '',
		answer: '',
		category: 'general',
		order: 0,
		is_active: true
	});

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
</script>

<div class="min-h-screen bg-base-200">
	<div class="mx-auto">
		<!-- Breadcrumb -->
		<div class="mb-6 flex items-center gap-2 text-sm">
			<a href={base} class="link link-hover text-primary font-medium">Dashboard</a>
			<svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<a href={base + '/faqs'} class="link link-hover text-primary font-medium">FAQs</a>
			<svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Create FAQ</span>
		</div>

		{#if form?.success}
			<div class="alert alert-success mb-6">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<span>FAQ created successfully!</span>
			</div>
		{/if}

		{#if form?.message && !form?.success}
			<div class="alert alert-error mb-6">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
				<span>{form.message}</span>
			</div>
		{/if}

		<form
			method="POST"
			action="?/createFaq"
			enctype="multipart/form-data"
			use:enhance={() => {
				loading = true;
				return async ({ result }) => {
					if (result.type === 'success') {
						addToast('FAQ created successfully!', 'success');
						await new Promise((r) => setTimeout(r, 1000));
						window.location.href = `${base}/faqs`;
					} else if (result.type === 'failure') {
						addToast(result.data?.message || 'Failed to create FAQ', 'error');
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
						<h2 class="mb-6 text-xl font-semibold">FAQ Details</h2>
						<div class="space-y-4">
							<!-- Question -->
							<div class="form-control">
								<label class="label" for="question">
									<span class="label-text font-medium">Question <span class="text-error">*</span></span>
								</label>
								<input
									id="question"
									name="question"
									type="text"
									class="input input-bordered w-full"
									placeholder="Enter your question"
									bind:value={faq.question}
									required
								/>
							</div>

							<!-- Answer (Rich Text Editor) -->
							<div class="form-control">
								<RichTextEditor
									name="answer"
									bind:value={faq.answer}
									label="Answer"
									placeholder="Enter the answer..."
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
							<!-- Category -->
							<div class="form-control">
								<label class="label" for="category">
									<span class="label-text font-medium">Category <span class="text-error">*</span></span>
								</label>
								<select id="category" name="category" class="select select-bordered w-full" bind:value={faq.category}>
									<option value="general">General</option>
									<option value="shipping">Shipping</option>
									<option value="payment">Payment</option>
									<option value="returns">Returns</option>
									<option value="product">Product</option>
									<option value="account">Account</option>
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
									class="input input-bordered w-full"
									bind:value={faq.order}
									min="0"
								/>
							</div>

							<!-- Active Status -->
							<input type="hidden" name="is_active" value={faq.is_active ? 'true' : 'false'} />
							<div class="form-control">
								<label class="label cursor-pointer justify-start gap-3">
									<input
										type="checkbox"
										class="toggle toggle-primary"
										checked={faq.is_active}
										onchange={() => { faq.is_active = !faq.is_active; }}
									/>
									<span class="label-text font-semibold">Active</span>
								</label>
							</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<div class="flex gap-3">
							<a href={base + '/faqs'} class="btn btn-outline flex-1">Cancel</a>
							<button type="submit" class="btn btn-primary flex-1" disabled={loading || !faq.question}>
								{#if loading}
									<span class="loading loading-spinner loading-sm"></span>
									Saving...
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									Create FAQ
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
