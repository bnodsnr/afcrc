<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { getImageUrl } from '$lib/admin/utils/image';
	import type { Product } from '$lib/admin/features/products/types/product.js';
	import AllProducts from '$lib/admin/features/products/components/AllProducts.svelte';

	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	let { data } = $props();

	async function deleteProduct(id: number) {
		if (!confirm('Delete this product?')) return;
		const formData = new FormData();
		formData.append('product_id', String(id));
		const response = await fetch('?/deleteProduct', {
			method: 'POST',
			body: formData
		});
		const result = await response.json();
		if (result.type === 'success') {
			alert('Product deleted successfully');
			// Refresh the page to reflect changes
			location.reload();
		} else {
			alert('Failed to delete product: ' + result.message);
		}
	}
</script>

<div class="rounded-lg bg-white p-6 shadow-md dark:bg-base-100">
	<div class="mb-6 flex items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">Products</h1>
			<p class="text-sm text-base-content/60">Manage your products</p>
		</div>
		<a
			href={base + '/products/create'}
			class="btn flex-nowrap gap-2 border-base-content bg-base-content text-base-100 transition-shadow btn-sm hover:border-base-content hover:bg-base-content/90 hover:shadow-lg"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Create Product
		</a>
	</div>
	<AllProducts {data} />
</div>
