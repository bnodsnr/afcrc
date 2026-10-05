<script lang="ts">
	import { createEmptyProduct, type Product } from '../types/product';
	import GeneralInfo from './GeneralInfo.svelte';
	import Sizes from './Sizes.svelte';
	import { enhance, deserialize } from '$app/forms';
	import Images from './Images.svelte';
	import Variations from './Variations.svelte';
	import Status from './Status.svelte';
	import Seobar from './Seobar.svelte';
	import { base } from '$lib/admin/paths';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { goto } from '$app/navigation';
	import { toastStore } from '$lib/admin/utils/tostar.svelte';
	import { pageLoader } from '$lib/admin/utils/Pageloader.svelte';
	import Inventory from './Inventory.svelte';

	let { categories, mode = 'create', initialProduct = null, vendors = [], token } = $props();
	// let product = $state(createEmptyProduct());
	let loading = $state(false);
	let subcategories = $state<any[]>([]); // ← local state, not a prop
	let subcategoriesLoading = $state(false); // ← local state, not a prop

	const formAction = $derived(mode === 'edit' ? '?/updateProduct' : '?/createProduct');

	// In ProductForm.svelte, log to confirm subcategories loads
	async function fetchSubcategoriesById(categoryId: string | number) {
		if (!categoryId) return;
		subcategoriesLoading = true;
		subcategories = [];
		try {
			const formData = new FormData();
			formData.append('categoryId', String(categoryId));

			const response = await fetch('?/fetchSubcategories', {
				method: 'POST',
				body: formData,
				headers: {
					Authorization: `Bearer ${token}`,
					'x-sveltekit-action': 'true'
				}
			});

			const text = await response.text();
			const result = deserialize(text);
			if (result.type === 'success') {
				// create page action returns { subcategories }, edit page action returns { data }
				const data = (result.data as any)?.subcategories ?? (result.data as any)?.data;
				if (Array.isArray(data)) subcategories = [...data];
			}
		} catch (e) {
			console.error('Failed to load subcategories:', e);
			subcategories = [];
		} finally {
			subcategoriesLoading = false;
		}
	}

	function initProduct() {
		if (!initialProduct) return createEmptyProduct();
		return {
			...createEmptyProduct(),
			...structuredClone(initialProduct),
			mainImage: initialProduct.primary_image?.image ?? null,
			category: initialProduct.category ? Number(initialProduct.category) : '',
			subcategory: initialProduct.subcategory ? Number(initialProduct.subcategory) : '',
			regularPrice: initialProduct.regular_price ?? '',
			salePrice: initialProduct.sale_price ?? '',
			priceUnit: initialProduct.price_unit ?? 'per_kg',
			weight: initialProduct.weight ?? '',
			shortDescription: initialProduct.short_description ?? '',
			product_sizes: initialProduct.product_sizes ?? initialProduct.sizes ?? [],
			product_size_category: initialProduct.product_size_category ?? 'general'
		};
	}

	let product = $state(initProduct());

	// Separate effect only for the async subcategories fetch
	$effect(() => {
		if (initialProduct?.category) {
			fetchSubcategoriesById(initialProduct.category).then(() => {
				product.subcategory = initialProduct.subcategory ? Number(initialProduct.subcategory) : '';
			});
		}
	});

	async function loadSubcategories(event: Event) {
		const categoryId = (event.target as HTMLSelectElement).value;
		product.subcategory = '';
		await fetchSubcategoriesById(categoryId);
	}

	async function handleSubmit({ formData }: { formData: FormData }) {
		loading = true;
		// Strip whatever the DOM naively collected for variations
		const variationKeys = [
			'variation_name[]',
			'variation_weight[]',
			'variation_price[]',
			'variation_quantity[]',
			'variations_status[]',
			'color[]',
			'variation_image[]'
		];
		variationKeys.forEach((k) => formData.delete(k));

		// Rebuild entirely from reactive state — single source of truth
		for (const v of product.variations) {
			formData.append('variation_name[]', v.name);
			formData.append('variation_weight[]', String(v.weight ?? ''));
			formData.append('variation_price[]', String(v.price ?? ''));
			formData.append('variation_quantity[]', String(v.quantity ?? ''));
			formData.append('variations_status[]', v.status);
			formData.append('color[]', v.color ?? '');

			// ← This is what was missing — File lives in state, inject it directly
			if (v.image?.file instanceof File && v.image.file.size > 0) {
				formData.append('variation_image[]', v.image.file, v.image.file.name);
			} else {
				formData.append('variation_image[]', new Blob([]), '');
			}
		}

		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			loading = false;

			if (result.type === 'success') {
				toastStore.success('Product saved successfully.');
				await goto(base + '/products'); // ← await this
				pageLoader.hide(); // ← hide after navigation resolves
				return; // ← don't call update() — we've already navigated away
			}

			if (result.type === 'failure') {
				toastStore.error('Could not refresh data.');
				console.error(result.data?.message);
				await update(); // only re-run invalidation on failure, where we stay on the page
				pageLoader.hide();
			}
		};
	}
</script>

<!-- 
<div class="mb-8">
	<h4 class="text-3xl font-bold">
		{mode === 'edit' ? 'Edit Product' : 'Create New Product'}
	</h4>
	<p class="mt-1">
		{mode === 'edit'
			? 'Update the details below to modify this product'
			: 'Complete the form below to add a new product to your store'}
	</p>
</div> -->
<form action={formAction} method="post" enctype="multipart/form-data" use:enhance={handleSubmit}>
	{#if mode === 'edit' && initialProduct?.id}
		<input type="hidden" name="productId" value={initialProduct.id} />
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<div class="space-y-6 lg:col-span-2">
			<GeneralInfo
				bind:product
				{categories}
				{subcategories}
				{subcategoriesLoading}
				{loadSubcategories}
				{vendors}
				{token}
			/>
			<Inventory bind:product />
			<Images bind:mainImage={product.mainImage} bind:galleryImages={product.galleryImages} />
			{#if mode === 'create'}
				<Variations bind:variations={product.variations} />
			{/if}
		</div>
		<div class="space-y-6 lg:col-span-1">
			<Sizes
				{product}
				onchange={(sizes, sizeCategory) => {
					product.product_sizes = sizes;
					product.product_size_category = sizeCategory;
				}}
			/>
			<Status
				bind:status={product.status}
				bind:visibility={product.visibility}
				bind:featured={product.is_featured}
			/>

			<Seobar bind:product />
			<div class="rounded-lg bg-base-100 shadow-sm">
				<div class="sticky bottom-0 z-10 -mx-6 -mb-6 flex justify-center gap-3 p-6">
					<div class="flex items-center gap-3">
						<button
							type="submit"
							class="btn shadow-md transition-all duration-200 btn-primary hover:-translate-y-0.5 hover:shadow-lg"
							disabled={loading}
						>
							{#if loading}
								<span class="loading loading-sm loading-spinner"></span>
								Saving...
							{:else}
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								{mode === 'edit' ? 'Update Product' : 'Save Product'}
							{/if}
						</button>

						<button
							type="button"
							class="btn border-base-300 bg-base-100 text-base-content btn-outline hover:bg-base-200"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</form>
