<script lang="ts">
	import { base } from '$lib/admin/paths';

	interface FAQ {
		id: number;
		question: string;
		answer: string;
		category: string;
		order: number;
		is_active: boolean;
		created_at: string;
		updated_at: string;
	}

	let { data } = $props();
	let faqs = $state<FAQ[]>(data.faqs || []);
	let isLoading = $state(false);
	let searchQuery = $state('');
	let filterCategory = $state('all');

	let toasts = $state<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

	function addToast(message: string, type: 'success' | 'error' = 'info') {
		const id = Date.now();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 3000);
	}

	let filteredFaqs = $derived(
		faqs.filter((f) => {
			const matchesSearch =
				searchQuery === '' || f.question.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory = filterCategory === 'all' || f.category === filterCategory;
			return matchesSearch && matchesCategory;
		})
	);

	async function deleteFaq(id: number) {
		if (!confirm('Are you sure you want to delete this FAQ?')) {
			return;
		}
		isLoading = true;
		try {
			const formData = new FormData();
			formData.append('id', id.toString());
			const response = await fetch('?/deleteFaq', {
				method: 'POST',
				body: formData
			});
			if (response.ok) {
				faqs = faqs.filter((f) => f.id !== id);
				addToast('FAQ deleted successfully', 'success');
			} else {
				addToast('Failed to delete FAQ', 'error');
			}
		} catch (error) {
			addToast('Error deleting FAQ', 'error');
		} finally {
			isLoading = false;
		}
	}

	function getCategoryBadge(category: string) {
		switch (category) {
			case 'general':
				return 'badge-info';
			case 'shipping':
				return 'badge-primary';
			case 'payment':
				return 'badge-success';
			case 'returns':
				return 'badge-warning';
			case 'product':
				return 'badge-secondary';
			case 'account':
				return 'badge-accent';
			default:
				return 'badge-ghost';
		}
	}

	function formatDate(dateString: string) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function stripHtml(html: string) {
		if (!html) return '';
		const tmp = document.createElement('div');
		tmp.innerHTML = html;
		return tmp.textContent || tmp.innerText || '';
	}
</script>

<div class="rounded-lg bg-white p-6 shadow-md dark:bg-base-100">
	<div class="mb-6 flex items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">FAQs</h1>
			<p class="text-sm text-base-content/60">Manage frequently asked questions</p>
		</div>
		<a
			href={base + '/faqs/create'}
			class="btn gap-2 border-base-content bg-base-content text-base-100 btn-sm hover:border-base-content hover:bg-base-content/90"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add FAQ
		</a>
	</div>

	<!-- Filters -->
	<div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
		<div class="form-control md:col-span-2">
			<label class="label pb-1" for="search">
				<span class="label-text text-xs font-semibold tracking-wide uppercase">Search</span>
			</label>
			<input
				id="search"
				type="text"
				placeholder="Search FAQs..."
				class="input-bordered input input-sm w-full"
				bind:value={searchQuery}
			/>
		</div>
		<div class="form-control">
			<label class="label pb-1" for="category-filter">
				<span class="label-text text-xs font-semibold tracking-wide uppercase">Category</span>
			</label>
			<select
				id="category-filter"
				class="select-bordered select w-full select-sm"
				bind:value={filterCategory}
			>
				<option value="all">All Categories</option>
				<option value="general">General</option>
				<option value="shipping">Shipping</option>
				<option value="payment">Payment</option>
				<option value="returns">Returns</option>
				<option value="product">Product</option>
				<option value="account">Account</option>
			</select>
		</div>
	</div>

	<!-- FAQ Table -->
	<div class="mt-6 rounded-lg border border-base-200">
		{#if filteredFaqs.length > 0}
			<div class="overflow-x-auto">
				<table class="table-compact table w-full">
					<thead>
						<tr>
							<th class="text-left">Question</th>
							<th class="text-left">Answer</th>
							<th class="text-center">Category</th>
							<th class="text-center">Status</th>
							<th class="text-left">Order</th>
							<th class="text-left">Created</th>
							<th class="text-center">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredFaqs as faq (faq.id)}
							<tr>
								<td>
									<p class="font-medium">{faq.question}</p>
								</td>
								<td>
									<p class="max-w-xs truncate text-sm text-base-content/70">
										{faq.answer ? stripHtml(faq.answer) : '—'}
									</p>
								</td>
								<td class="text-center">
									<span class="badge badge-sm {getCategoryBadge(faq.category)}">{faq.category}</span
									>
								</td>
								<td class="text-center">
									<span class="badge badge-sm {faq.is_active ? 'badge-success' : 'badge-gray'}">
										{faq.is_active ? 'Active' : 'Inactive'}
									</span>
								</td>
								<td>{faq.order}</td>
								<td class="text-sm">{formatDate(faq.created_at)}</td>
								<td class="text-center">
									<div class="flex justify-center gap-2">
										<a
											href={base + `/faqs/${faq.id}/edit`}
											class="btn btn-square btn-xs btn-info"
											title="Edit FAQ"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</a>
										<button
											class="btn btn-square text-white btn-xs btn-error"
											title="Delete FAQ"
											onclick={() => deleteFaq(faq.id)}
											disabled={isLoading}
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
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-12">
				<svg
					class="mb-4 h-12 w-12 text-base-content/30"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p class="text-base-content/50">No FAQs found</p>
				<a href={base + '/faqs/create'} class="btn mt-2 btn-link btn-sm">Create your first FAQ</a>
			</div>
		{/if}
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
