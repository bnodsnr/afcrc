<script lang="ts">
	import ProductForm from '$lib/admin/features/products/components/ProductForm.svelte';
	import type { PageData } from './$types';
	let { data } = $props();
	const token = data.token;
	let categories = $state(data.categories.results || []);
	let subcategories = $state<any[]>([]);
	let vendors = $state(data.vendors.results || []);
	let subcategoriesLoading = $state(false);
	import Breadcrumb from '$lib/admin/components/Breadcrumb.svelte';
</script>

<div class="mb-6 flex items-center gap-2 text-sm"><Breadcrumb /></div>

<ProductForm {categories} {subcategories} {subcategoriesLoading} {vendors} {token} />
