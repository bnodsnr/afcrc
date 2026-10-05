<script lang="ts">
	import { resolve } from '$app/paths';
	import ProductCard from './ProductCard.svelte';
	import type { ComponentData, ComponentsData, ProductWidget } from '$lib/api/types';

	interface Props {
		herbalProducts: ProductWidget[];
		herbalInfo?: ComponentData | ComponentsData | null;
	}

	let { herbalProducts = [], herbalInfo = null }: Props = $props();

	const products = $derived(herbalProducts ?? []);

	// ---- Section copy, driven by the "herbal-info" component row ----
	// The API hands back the single row for that slug, while the page load
	// normalises a missing row to an empty array, so both shapes are accepted
	// here. Every field falls back to the static copy, so the section still
	// renders if the CMS row is absent or has no content.
	const FALLBACK = {
		name: 'Herbal Products',
		description:
			'Hand-selected cuts, aged and prepared by our master butchers — delivered fresh from our counters to your table.',
		bullets: ['100% natural herbs', 'Lab tested purity', 'Sustainably sourced']
	};

	// page_content is CMS-authored HTML, so only its text is read — tags are
	// stripped rather than injected, keeping nothing executable out of the DOM.
	function text(value: string | null | undefined): string {
		return (value ?? '')
			.replace(/<[^>]*>/g, '')
			.replace(/&nbsp;/gi, ' ')
			.replace(/&amp;/gi, '&')
			.replace(/&lt;/gi, '<')
			.replace(/&gt;/gi, '>')
			.replace(/&quot;/gi, '"')
			.replace(/&#0?39;|&apos;/gi, "'")
			.trim();
	}

	let info = $derived(Array.isArray(herbalInfo) ? (herbalInfo[0] ?? null) : herbalInfo);

	// "Herbal Products" -> "Herbal" + "Products." so the accent word stays italic.
	let heading = $derived.by(() => {
		const words = (info?.name?.trim() || FALLBACK.name).split(/\s+/);
		const rest = words.slice(1).join(' ');
		return { first: words[0], accent: rest ? `${rest}.` : '' };
	});

	// The lead paragraph is the first <p> outside the bullet list; the list items
	// themselves become the tick row below it.
	let description = $derived.by(() => {
		const outsideList = (info?.page_content ?? '').replace(/<li\b[\s\S]*?<\/li>/gi, '');
		const lead = outsideList.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
		return text(lead?.[1]) || FALLBACK.description;
	});

	let bullets = $derived.by(() => {
		const items = [...(info?.page_content ?? '').matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
			.map((match) => text(match[1]))
			.filter(Boolean);
		return items.length ? items : FALLBACK.bullets;
	});
</script>

<section id="premium-meat" class="relative overflow-hidden bg-pine-dark">
	<div class="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden="true">
		<svg
			class="h-full w-full"
			xmlns="http://www.w3.org/2000/svg"
			preserveAspectRatio="none"
			viewBox="0 0 100 100"
			><defs
				><pattern
					id="meat-lines"
					width="22"
					height="22"
					patternUnits="userSpaceOnUse"
					patternTransform="rotate(45)"
					><rect width="22" height="1.5" x="0" y="10" fill="#f6c99a" /></pattern
				></defs
			><rect width="100" height="100" fill="url(#meat-lines)" /></svg
		>
	</div>

	<!-- <div
		class="pointer-events-none absolute -top-10 right-0 font-serif text-[clamp(7rem,20vw,17rem)] leading-none font-bold tracking-tight text-transparent opacity-[0.08] select-none"
		style="-webkit-text-stroke: 1px #ffffff;"
		aria-hidden="true"
	>
		Herbal Products
	</div> -->

	<div class="relative mx-auto max-w-[1180px] px-6 py-[110px] max-md:px-4 max-md:py-20">
		<div class="mb-12 flex items-end justify-between gap-8 max-sm:flex-col max-sm:items-start">
			<div class="max-w-xl">
				<div class="eyebrow text-gold [&::before]:bg-gold">{heading.first}</div>

				<h2
					class="reveal mt-4 font-serif text-[clamp(2rem,3.6vw,2.9rem)] leading-[1.08] font-semibold tracking-[-0.02em] text-paper-white"
				>
					{heading.first}
					{#if heading.accent}
						<em class="font-medium text-gold italic">{heading.accent}</em>
					{/if}
				</h2>

				<p class="reveal mt-4 max-w-md font-sans text-[0.92rem] leading-relaxed text-white/55">
					{description}
				</p>

				<div
					class="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5 font-mono text-[0.64rem] font-medium tracking-[0.12em] text-white/50 uppercase"
				>
					{#each bullets as bullet (bullet)}
						<span class="inline-flex items-center gap-2">
							<svg
								width="13"
								height="13"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#f6c99a"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg
							>{bullet}
						</span>
					{/each}
				</div>
			</div>

			<a
				href={resolve('/product/herbal-products')}
				class="group reveal inline-flex shrink-0 items-center gap-3 rounded-full bg-afcrc-yellow px-6 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] text-[#2c1714] uppercase shadow-[0_10px_30px_-10px_rgba(246,201,154,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-butter hover:shadow-[0_16px_36px_-10px_rgba(246,201,154,0.65)] max-sm:self-start"
			>
				View all
				<svg
					class="transition-transform duration-300 group-hover:translate-x-1"
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg
				>
			</a>
		</div>

		{#if products.length > 0}
			<div class="product-grid grid grid-cols-4 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
				{#each products.slice(0, 8) as product (product.id)}
					<ProductCard {product} categorySeoSlug="meat-products" variant="light" />
				{/each}
			</div>
		{:else}
			<div
				class="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gold/25 bg-white/[0.03] px-6 py-16 text-center backdrop-blur-sm"
			>
				<svg
					width="30"
					height="30"
					viewBox="0 0 24 24"
					fill="none"
					stroke="#f6c99a"
					stroke-width="1.4"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="opacity-70"
					><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line
						x1="3"
						y1="6"
						x2="21"
						y2="6"
					/><path d="M16 10a4 4 0 01-8 0" /></svg
				>
				<p class="font-serif text-lg text-paper-white">We are Lunching product very soon.</p>
				<p class="font-sans text-sm text-white/50">
					Fresh premium cuts are on their way — check back shortly.
				</p>
			</div>
		{/if}
	</div>
</section>
