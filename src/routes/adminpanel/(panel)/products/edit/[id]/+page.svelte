<script lang="ts">
	import ProductFrom from '$lib/admin/features/products/components/ProductForm.svelte';
	import type { PageData } from './$types';
	let { data } = $props();
	let product = $state(data.product);
	const token = data.token;
	let categories = $state(data.categories || []);
	let subcategories = $state<any[]>([]);
	let subcategoriesLoading = $state(false);
	let vendors = $state(data.vendors.results || []);
</script>

<ProductFrom
	{token}
	mode="edit"
	initialProduct={data.product}
	{categories}
	{subcategories}
	{subcategoriesLoading}
	{vendors}
/>
