<script lang="ts">
	import { resolve } from '$app/paths';
	import { getImageUrl } from '$lib/utils/image';
	import type { ProductWidget } from '$lib/api/types';
	import dummyimage from '$lib/images/dymmyimage.png';

	interface Props {
		product: ProductWidget;
		categorySeoSlug?: string;
		variant?: 'dark' | 'light';
	}

	let { product, categorySeoSlug = '', variant = 'dark' }: Props = $props();

	const light = $derived(variant === 'light');

	const rootClass = $derived(
		light
			? 'reveal product-item group relative flex flex-col overflow-hidden rounded-[10px] border-2 border-white/70 bg-white/60 shadow-[0_14px_44px_-16px_rgba(23,83,58,0.35)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-gold hover:bg-white/80 hover:shadow-[0_28px_60px_-16px_rgba(23,83,58,0.5)]'
			: 'reveal product-item group relative flex flex-col overflow-hidden rounded-[10px] border-2 border-white/[0.18] bg-white/[0.065] shadow-[0_14px_44px_-16px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/45 hover:bg-white/[0.1] hover:shadow-[0_28px_60px_-16px_rgba(0,0,0,0.65)]'
	);

	const titleClass = $derived(
		light
			? 'mb-2 line-clamp-1 font-serif text-[1.02rem] font-semibold tracking-[-0.01em] text-pine-dark transition-colors duration-300 group-hover:text-pine'
			: 'mb-2 line-clamp-1 font-serif text-[1.02rem] font-semibold tracking-[-0.01em] text-paper-white transition-colors duration-300 group-hover:text-gold'
	);

	const priceClass = $derived(
		light
			? 'font-mono text-[1rem] font-bold tracking-tight text-pine-dark tabular-nums'
			: 'font-mono text-[1rem] font-bold tracking-tight text-paper-white tabular-nums'
	);

	const compareClass = $derived(
		light
			? 'font-mono text-[0.72rem] text-pine-dark/50 tabular-nums line-through'
			: 'font-mono text-[0.72rem] text-white/40 tabular-nums line-through'
	);

	const unitClass = $derived(
		light
			? 'font-mono text-[0.68rem] font-medium tracking-wide text-pine-dark/55 normal-case'
			: 'font-mono text-[0.68rem] font-medium tracking-wide text-white/50'
	);

	const productHref = $derived(
		resolve(`/product/${categorySeoSlug || product.category || 'products'}/${product.slug}`)
	);

	const regularPrice = $derived(parseFloat(String(product.regular_price ?? 0)));
	const salePrice = $derived(
		product.sale_price != null ? parseFloat(String(product.sale_price)) : null
	);
	const price = $derived(salePrice ?? regularPrice);
	const hasDiscount = $derived(
		typeof product.discount_percentage === 'number' && product.discount_percentage > 0
	);
	const discount = $derived(
		hasDiscount ? Math.round(Math.min(product.discount_percentage, 99)) : 0
	);

	function formatPrice(value: number): string {
		if (Number.isNaN(value)) return '';
		return `Rs. ${value.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
</script>

<a href={productHref} class={rootClass}>
	<div
		class="pointer-events-none absolute inset-x-6 top-0 h-px"
		style="background: linear-gradient(90deg, transparent, {light
			? 'rgba(255, 255, 255, 0.85)'
			: 'rgba(251, 233, 186, 0.4)'}, transparent);"
		aria-hidden="true"
	></div>

	<div class="relative h-52 overflow-hidden">
		<img
			src={getImageUrl(product.image, dummyimage)}
			alt={product.name}
			class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
			loading="lazy"
		/>
		<div
			class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-30"
			aria-hidden="true"
		></div>

		{#if discount > 0}
			<span
				class="absolute top-3 left-3 rounded-full bg-gold px-2.5 py-1 font-mono text-[0.62rem] font-bold tracking-wide text-[#2c1714] shadow-lg backdrop-blur-sm"
				>-{discount}%</span
			>
		{/if}

		{#if product.category}
			<span
				class="absolute top-3 right-3 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 font-mono text-[0.55rem] leading-none font-semibold tracking-[0.08em] text-white/90 uppercase backdrop-blur-md"
				>{product.category}</span
			>
		{/if}
	</div>

	<div class="flex flex-1 flex-col p-5">
		<h3 class={titleClass}>
			{product.name}
		</h3>
		<div class="flex min-w-0 flex-col">
			<span class={priceClass}>
				{formatPrice(price)}
				{#if product.price_unit}
					<span class={unitClass}>/ {product.price_unit.replace('per_', '')}</span>
				{/if}
			</span>
			{#if salePrice != null && salePrice < regularPrice}
				<span class={compareClass}>{formatPrice(regularPrice)}</span>
			{/if}
		</div>
	</div>
</a>
