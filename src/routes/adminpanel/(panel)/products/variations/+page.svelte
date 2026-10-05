<script lang="ts">
	import { base } from '$lib/admin/paths';
	import { getImageUrl } from '$lib/admin/utils/image';

	let { data } = $props();
	let variations = data.variations || [];
	let searchQuery = $state('');

	let filteredVariations = $derived.by(() => {
		if (!searchQuery.trim()) return variations;
		const query = searchQuery.toLowerCase();
		return variations.filter(
			(v: any) =>
				v.name?.toLowerCase().includes(query) ||
				v.productName?.toLowerCase().includes(query) ||
				v.color?.toLowerCase().includes(query)
		);
	});
</script>

<div class="min-h-screen px-6 py-8">
	<div class="mx-auto max-w-7xl space-y-6">
		<!-- Header -->
		<div class="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm">
			<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<p class="text-sm tracking-[0.24em] text-primary uppercase">Admin</p>
					<h1 class="text-3xl font-semibold">Product Variations</h1>
					<p class="mt-2 max-w-2xl text-base-content/60">
						View and manage all product variations across your catalog
					</p>
				</div>
				<a href="{base}/products/variations/new" class="btn btn-primary">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					New Variation
				</a>
			</div>
		</div>

		<!-- Search -->
		<div class="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm">
			<input
				type="text"
				placeholder="Search variations by name, product, or color..."
				class="input-bordered input w-full"
				bind:value={searchQuery}
			/>
		</div>

		<!-- Variations Table -->
		<div class="overflow-x-auto rounded-2xl border border-base-200 bg-base-100 shadow-sm">
			{#if variations.length === 0}
				<div class="flex items-center justify-center p-12">
					<p class="text-base-content/60">No variations found</p>
				</div>
			{:else}
				<table class="min-w-full divide-y divide-base-200">
					<thead class="bg-base-200">
						<tr>
							<th class="px-6 py-4 text-left text-sm font-semibold">Image</th>
							<th class="px-6 py-4 text-left text-sm font-semibold">Name</th>
							<th class="px-6 py-4 text-left text-sm font-semibold">Product</th>
							<th class="px-6 py-4 text-left text-sm font-semibold">Weight</th>
							<th class="px-6 py-4 text-left text-sm font-semibold">Price</th>
							<th class="px-6 py-4 text-left text-sm font-semibold">Color</th>
							<th class="px-6 py-4 text-left text-sm font-semibold">Stock</th>
							<th class="px-6 py-4 text-left text-sm font-semibold">Status</th>
							<th class="px-6 py-4 text-left text-sm font-semibold">Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-base-200">
						{#each filteredVariations as variation (variation.id)}
							<tr class="hover:bg-base-50">
								<td class="px-6 py-4">
									{#if variation.image}
										<img
											src={getImageUrl(variation.image)}
											alt={variation.name}
											class="h-12 w-12 rounded object-cover"
										/>
									{:else}
										<div class="h-12 w-12 rounded bg-base-200"></div>
									{/if}
								</td>
								<td class="px-6 py-4">
									<span class="font-medium">{variation.name || 'N/A'}</span>
								</td>
								<td class="px-6 py-4">
									<a
										href="{base}/products/variations/{variation.productId}"
										class="hover:text-primary-focus link text-primary"
									>
										{variation.productName || 'N/A'}
									</a>
								</td>
								<td class="px-6 py-4 text-sm">
									{variation.weight || 0}g
								</td>
								<td class="px-6 py-4 text-sm font-medium">
									{parseFloat(variation.price || 0).toFixed(2)}
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-2">
										<div
											class="h-6 w-6 rounded border border-base-300"
											style="background-color: {variation.color || '#transparent'}"
										></div>
										<span class="text-sm">{variation.color || 'None'}</span>
									</div>
								</td>
								<td class="px-6 py-4 text-sm">
									{variation.stock_quantity || variation.quantity || 0}
								</td>
								<td class="px-6 py-4">
									<span
										class="badge"
										class:badge-success={variation.status === 'active'}
										class:badge-error={variation.status === 'inactive'}
									>
										{variation.status || 'unknown'}
									</span>
								</td>
								<td class="px-6 py-4 text-sm">
									<a
										href="{base}/products/variations/{variation.productId}"
										class="btn btn-ghost btn-xs"
									>
										Edit
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>

		<!-- Stats -->
		{#if variations.length > 0}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
				<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
					<p class="text-sm text-base-content/60">Total Variations</p>
					<p class="text-3xl font-bold">{variations.length}</p>
				</div>
				<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
					<p class="text-sm text-base-content/60">Active</p>
					<p class="text-3xl font-bold text-success">
						{variations.filter((v: any) => v.status === 'active').length}
					</p>
				</div>
				<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
					<p class="text-sm text-base-content/60">In Stock</p>
					<p class="text-3xl font-bold text-info">
						{variations.reduce(
							(sum: number, v: any) => sum + (v.stock_quantity || v.quantity || 0),
							0
						)}
					</p>
				</div>
				<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
					<p class="text-sm text-base-content/60">Total Value</p>
					<p class="text-3xl font-bold text-warning">
						${variations
							.reduce(
								(sum: number, v: any) =>
									sum + parseFloat(v.price || 0) * (v.stock_quantity || v.quantity || 0),
								0
							)
							.toFixed(2)}
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
