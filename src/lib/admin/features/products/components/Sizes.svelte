<script lang="ts">
	import type { Product } from '../types/product';
	import type { SizeCategoryChoice } from '../types/product';

	type Props = {
		product: Product;
		onchange: (sizes: Product['product_sizes'], sizeCategory: SizeCategoryChoice) => void;
	};

	let { product, onchange }: Props = $props();

	const sizeOptions: Record<Exclude<SizeCategoryChoice, 'none'>, string[]> = {
		clothing: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'],
		shoes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
		accessories: ['One Size', 'S/M', 'M/L', 'L/XL'],
		general: ['S', 'M', 'L'],
		grocery: ['per kg', 'per packet', 'Custom Weight']
	};

	const sizeCategoryLabels: Record<SizeCategoryChoice, string> = {
		none: 'No Sizes',
		clothing: 'Clothing Sizes',
		shoes: 'Shoe Sizes',
		accessories: 'Accessory Sizes',
		general: 'General Sizes',
		grocery: 'Weight / Unit Options'
	};

	function detectSizeCategory(): SizeCategoryChoice {
		if (product.product_size_category) return product.product_size_category;
		const slug = (product.categorySlug ?? '').toLowerCase();
		const name = (product.name ?? '').toLowerCase();
		if (slug.includes('shoe') || slug.includes('footwear') || name.includes('shoe')) return 'shoes';
		if (
			slug.includes('cloth') ||
			slug.includes('apparel') ||
			slug.includes('fashion') ||
			name.includes('shirt') ||
			name.includes('pant') ||
			name.includes('t-shirt')
		)
			return 'clothing';
		if (
			slug.includes('accessor') ||
			slug.includes('jewel') ||
			name.includes('watch') ||
			name.includes('hat') ||
			name.includes('bag')
		)
			return 'accessories';
		return 'general';
	}

	let sizeCategory = $state<SizeCategoryChoice>(detectSizeCategory());
	let availableSizes = $derived(sizeCategory === 'none' ? [] : sizeOptions[sizeCategory]);

	let selectedSizes = $state<string[]>(
		Array.isArray(product?.product_sizes) && product.product_sizes.length > 0
			? product.product_sizes
			: []
	);

	let customChecked = $state(false);
	let customWeight = $state('');
	let customWeightApplied = $state('');

	function emitSizes() {
		onchange(selectedSizes.length > 0 ? selectedSizes : null, sizeCategory);
	}

	function handleSizeChange(sizeValue: string, checked: boolean) {
		selectedSizes = checked
			? [...selectedSizes, sizeValue]
			: selectedSizes.filter((s) => s !== sizeValue);
		emitSizes();
	}

	function handleCustomWeightCheck(checked: boolean) {
		customChecked = checked;
		if (!checked) {
			customWeight = '';
			if (customWeightApplied) {
				selectedSizes = selectedSizes.filter((s) => s !== customWeightApplied);
				customWeightApplied = '';
			}
		}
		emitSizes();
	}

	function handleCustomWeightInput(value: string) {
		customWeight = value;
		const trimmed = value.trim();
		if (customWeightApplied) {
			selectedSizes = selectedSizes.filter((s) => s !== customWeightApplied);
			customWeightApplied = '';
		}
		if (trimmed) {
			customWeightApplied = trimmed;
			selectedSizes = [...selectedSizes, trimmed];
		}
		emitSizes();
	}

	function handleCategoryChange(newCategory: SizeCategoryChoice) {
		sizeCategory = newCategory;
		selectedSizes = [];
		customChecked = false;
		customWeight = '';
		customWeightApplied = '';
		onchange(null, sizeCategory);
	}
</script>

<div class="rounded-lg bg-base-100 p-6 shadow-sm">
	<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">Available Sizes</h2>

	<div class="mb-4">
		<label for="size-category" class="label">
			<span class="label-text text-sm font-medium">Size Category</span>
		</label>
		<select
			id="size-category"
			class="select-bordered select w-full select-sm"
			value={sizeCategory}
			onchange={(e) => handleCategoryChange(e.currentTarget.value as SizeCategoryChoice)}
		>
			<option value="none">None</option>
			<option value="clothing">Clothing</option>
			<option value="shoes">Shoes</option>
			<option value="accessories">Accessories</option>
			<option value="general">General</option>
			<option value="grocery">Grocery / Weight</option>
		</select>
	</div>

	{#if sizeCategory !== 'none'}
		<div class="mb-2 text-xs font-bold uppercase opacity-70">
			{sizeCategoryLabels[sizeCategory]}
		</div>

		<div class="max-h-60 overflow-y-auto">
			{#each availableSizes as sizeOption}
				{#if sizeOption === 'Custom Weight'}
					<label class="label cursor-pointer justify-start gap-2 py-1">
						<input
							type="checkbox"
							class="checkbox checkbox-sm checkbox-info"
							checked={customChecked}
							onchange={(e) =>
								handleCustomWeightCheck((e.target as HTMLInputElement).checked)}
						/>
						<span class="label-text p-1 text-sm font-medium">{sizeOption}</span>
					</label>
					{#if customChecked}
						<div class="mb-2 pl-8">
							<input
								type="text"
								class="input-bordered input input-sm w-full"
								placeholder="Enter weight (e.g. 250g)"
								value={customWeight}
								oninput={(e) => handleCustomWeightInput((e.target as HTMLInputElement).value)}
							/>
						</div>
					{/if}
				{:else}
					<label class="label cursor-pointer justify-start gap-2 py-1">
						<input
							type="checkbox"
							class="checkbox checkbox-sm checkbox-info"
							checked={selectedSizes.includes(sizeOption)}
							onchange={(e) =>
								handleSizeChange(sizeOption, (e.target as HTMLInputElement).checked)}
						/>
						<span class="label-text p-1 text-sm font-medium">{sizeOption}</span>
					</label>
				{/if}
			{/each}
		</div>

		<input type="hidden" name="sizes" value={selectedSizes.join('.')} />
		<input type="hidden" name="size_category" value={sizeCategory} />

		{#if selectedSizes.length > 0}
			<div class="mt-3 rounded-lg border border-base-300 p-2">
				<div class="mb-2 text-xs font-bold uppercase opacity-70">Selected Sizes:</div>
				<div class="flex flex-wrap gap-2">
					{#each selectedSizes as s}
						<span class="badge badge-sm badge-info">{s}</span>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<input type="hidden" name="sizes" value="" />
		<input type="hidden" name="size_category" value="none" />
	{/if}
</div>
