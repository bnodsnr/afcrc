<script lang="ts">
	import { resolve } from '$app/paths';
	import ProductCard from './ProductCard.svelte';
	import type { ComponentData, ComponentsData, ProductWidget } from '$lib/api/types';

	interface Props {
		agroProducts: ProductWidget[];
		agroInfo?: ComponentData | ComponentsData | null;
	}

	let { agroProducts = [], agroInfo = null }: Props = $props();

	const products = $derived(agroProducts ?? []);

	// ---- Section copy, driven by the "agro-info" component row ----
	// The API hands back the single row for that slug, while the page load
	// normalises a missing row to an empty array, so both shapes are accepted
	// here. Every field falls back to the static copy, so the section still
	// renders if the CMS row is absent or has no content.
	const FALLBACK = {
		name: 'Agro Products',
		description: 'Agro products encompass all raw and processed commodities derive.',
		bullets: ['Freshly harvested', 'Naturally grown', 'Farm to table fresh']
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

	let info = $derived(Array.isArray(agroInfo) ? (agroInfo[0] ?? null) : agroInfo);

	// "Agro Products" -> "Agro" + "Products." so the accent word stays italic.
	// A connector is what actually starts the accent: "Beverage & Refreshent"
	// yields "Beverage" + "& Refreshent.", spaced or not, so the accent is never
	// empty just because the CMS title glued the connector to the next word.
	const CONNECTOR = /[&@/+|:]/;

	let heading = $derived.by(() => {
		const title = info?.name?.trim() || FALLBACK.name;
		const at = title.search(CONNECTOR);
		const head = (at === -1 ? title : title.slice(0, at)).trim();

		if (at !== -1 && head) {
			return { first: head, accent: `${title.slice(at).trim()}.` };
		}

		const words = title.split(/\s+/);
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
	console.log(description);
	let bullets = $derived.by(() => {
		const items = [...(info?.page_content ?? '').matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
			.map((match) => text(match[1]))
			.filter(Boolean);
		return items.length ? items : FALLBACK.bullets;
	});
</script>

<section
	id="premium-meat"
	class="relative overflow-hidden border-y border-line"
	style="background: radial-gradient(circle at 5% 10%, rgba(149, 196, 172, 0.38) 0%, transparent 30%), radial-gradient(circle at 95% 5%, rgba(204, 176, 232, 0.32) 0%, transparent 30%), radial-gradient(circle at 90% 85%, rgba(74, 144, 226, 0.20) 0%, transparent 32%), radial-gradient(circle at 15% 90%, rgba(244, 205, 66, 0.20) 0%, transparent 30%), radial-gradient(circle at 50% 50%, rgba(105, 177, 123, 0.08) 0%, transparent 45%), linear-gradient(135deg, #ffffff 0%, #f8faf9 45%, #faf8fc 100%);
    background-repeat: repeat, repeat, repeat, repeat, repeat, repeat;
  background-repeat: no-repeat !important;"
>
	<!-- <div
		class="pointer-events-none absolute -top-10 right-0 font-serif text-[clamp(7rem,20vw,17rem)] leading-none font-bold tracking-tight text-transparent opacity-[0.08] select-none"
		style="-webkit-text-stroke: 1px red;"
		aria-hidden="true"
	>
		Agro Products
	</div> -->

	<div class="relative mx-auto max-w-[1180px] px-6 py-[110px] max-md:px-4 max-md:py-20">
		<div class="mb-12 flex items-end justify-between gap-8 max-sm:flex-col max-sm:items-start">
			<div class="max-w-xl">
				<h2
					class="reveal mt-4 font-serif text-[clamp(2rem,3.6vw,2.9rem)] leading-[1.08] font-semibold tracking-[-0.02em] text-pine-dark"
				>
					{heading.first}
					{#if heading.accent}
						<em class="font-medium text-pine italic">{heading.accent}</em>
					{/if}
				</h2>

				<p class="reveal mt-4 max-w-md font-sans text-[0.92rem] leading-relaxed text-ink-soft">
					{description}
				</p>

				<div
					class="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5 font-mono text-[0.64rem] font-medium tracking-[0.12em] text-ink-soft uppercase"
				>
					{#each bullets as bullet (bullet)}
						<span class="inline-flex items-center gap-2">
							<svg
								width="13"
								height="13"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#2B6D4C"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg
							>{bullet}
						</span>
					{/each}
				</div>
			</div>

			<a
				href={resolve('/product/agro-products')}
				class="group reveal inline-flex shrink-0 items-center gap-3 rounded-full bg-afcrc-green px-6 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] text-paper-white uppercase shadow-[0_10px_30px_-10px_rgba(23,83,58,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-pine hover:shadow-[0_16px_36px_-10px_rgba(23,83,58,0.55)] max-sm:self-start"
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
					<ProductCard {product} categorySeoSlug="agri-products" variant="light" />
				{/each}
			</div>
		{:else}
			<div
				class="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-pine-dark/20 bg-white/70 px-6 py-16 text-center"
			>
				<svg
					width="30"
					height="30"
					viewBox="0 0 24 24"
					fill="none"
					stroke="#2B6D4C"
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
				<p class="font-serif text-lg text-ink">We are Lunching product very soon.</p>
				<p class="font-sans text-sm text-ink-soft">
					Fresh premium cuts are on their way — check back shortly.
				</p>
			</div>
		{/if}
	</div>
</section>
