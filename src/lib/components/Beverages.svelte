<script lang="ts">
	import { resolve } from '$app/paths';
	import ProductCard from './ProductCard.svelte';
	import type { ComponentData, ComponentsData, ProductWidget } from '$lib/api/types';

	interface Props {
		beverages: ProductWidget[];
		beveragesInfo?: ComponentData | ComponentsData | null;
	}

	let { beverages = [], beveragesInfo = null }: Props = $props();

	const products = $derived(beverages ?? []);

	// ---- Section copy, driven by the "beverages-info" component row ----
	// The API hands back the single row for that slug, while the page load
	// normalises a missing row to an empty array, so both shapes are accepted
	// here. Every field falls back to the static copy, so the section still
	// renders if the CMS row is absent or has no content.
	const FALLBACK = {
		name: 'Beverages',
		description:
			'Agro products encompass all raw and processed commodities derived from farming, livestock, and forestry practices.',
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

	let info = $derived(Array.isArray(beveragesInfo) ? (beveragesInfo[0] ?? null) : beveragesInfo);
	console.log(info);

	// "Beverages" is a single word, so there is no italic accent word to render.
	let heading = $derived.by(() => {
		const title = info?.name?.trim() || FALLBACK.name;

		// Split only at whitespace
		const words = title.split(/\s+/);

		if (!words.length) {
			return {
				first: '',
				accent: ''
			};
		}

		const first = words[0];

		// Special characters that should remain attached to the accent
		const specialChars = ['&', '-', '@', '/', '+', '|', ':'];

		if (words.length > 1 && specialChars.includes(words[1])) {
			return {
				first,
				accent: `${words.slice(1).join(' ')}.`
			};
		}

		return {
			first,
			accent: words.length > 1 ? `${words.slice(1).join(' ')}.` : ''
		};
	});
	console.log(heading);

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

<section
	id="premium-meat"
	class="relative overflow-hidden border-y border-line"
	style="background: radial-gradient(circle at 5% 10%, rgba(149, 196, 172, 0.38) 0%, transparent 30%), radial-gradient(circle at 95% 5%, rgba(204, 176, 232, 0.32) 0%, transparent 30%), radial-gradient(circle at 90% 85%, rgba(74, 144, 226, 0.20) 0%, transparent 32%), radial-gradient(circle at 15% 90%, rgba(244, 205, 66, 0.20) 0%, transparent 30%), radial-gradient(circle at 50% 50%, rgba(105, 177, 123, 0.08) 0%, transparent 45%), linear-gradient(135deg, #ffffff 0%, #f8faf9 45%, #faf8fc 100%);
    background-repeat: repeat, repeat, repeat, repeat, repeat, repeat;
  background-repeat: no-repeat !important;"
>
	<!-- <div
		class="pointer-events-none absolute -top-10 right-0 font-serif text-[clamp(7rem,20vw,17rem)] leading-none font-bold tracking-tight text-transparent opacity-[0.08] select-none"
		style="-webkit-text-stroke: 1px yellow;"
		aria-hidden="true"
	>
		Sustainably Farmed Goods
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
				href={resolve('/product/beverages')}
				class="group reveal inline-flex shrink-0 items-center gap-3 rounded-full bg-pine-dark px-6 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] text-paper-white uppercase shadow-[0_10px_30px_-10px_rgba(23,83,58,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-pine hover:shadow-[0_16px_36px_-10px_rgba(23,83,58,0.55)] max-sm:self-start"
			>
				View all
				{#if products.length > 0}
					<span class="rounded-full bg-white/20 px-2 py-0.5 text-[0.62rem] tabular-nums"
						>{products.length}</span
					>
				{/if}
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
