<script lang="ts">
	import type { ComponentData } from '$lib/api/types';
	import { firstHeadingText, toText, withoutHeadings } from '$lib/utils/html';

	/** The "Why AFCRC" parent row: name = eyebrow, page_content = heading + body. */
	let { whyafcrc }: { whyafcrc: ComponentData | null | undefined } = $props();

	const FALLBACK: {
		eyebrow: string;
		title: string;
		body: string;
		items: { title: string; desc: string }[];
	} = {
		eyebrow: 'Why AFCRC',
		title: 'Built as one supply chain, not three separate vendors.',
		body: 'Most buyers juggle a producer, a packager and a distributor. We run all three under one roof, so quality decisions made at sourcing are never lost by the time a product reaches your shelf.',
		items: [
			{
				title: 'Sourced standards',
				desc: 'Every producer and grower we partner with is vetted against consistent quality and safety criteria before a single product moves through our chain.'
			},
			{
				title: 'Packaging built to protect',
				desc: "From cold-chain meat to sealed herbal capsules, packaging is matched to each product's shelf-life and handling needs, not a one-size template."
			},
			{
				title: 'Distribution that keeps pace',
				desc: "A logistics network coordinated end to end, so lead times stay predictable whether you're ordering meat, produce, supplements or beverages."
			}
		]
	};

	// The CMS carries no icon, so cycle a small set in reading order.
	const ICONS = [
		'M12 2L12 22M12 2C9 5 6 7 3 7.5M12 2C15 5 18 7 21 7.5',
		'M4 7h16v13H4zM9 7V5a3 3 0 016 0v2',
		'M3 12h4l2-5 4 10 2-5h6',
		'M12 2a6 6 0 0 0-4 10.5c.6.5 1 1.3 1 2.1V16h6v-1.4c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 2z',
		'M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z'
	];

	let eyebrow = $derived(whyafcrc?.name?.trim() || FALLBACK.eyebrow);

	// The first heading of the Tiptap body is the section title; the rest is prose.
	let title = $derived(firstHeadingText(whyafcrc?.page_content) || FALLBACK.title);
	let body = $derived.by(() => {
		const rest = withoutHeadings(whyafcrc?.page_content);
		return toText(rest) ? rest : `<p>${FALLBACK.body}</p>`;
	});

	// Children are the numbered reasons; the API returns them newest-first, so
	// restore reading order with `order` and fall back to insertion order (id).
	let items = $derived.by(() => {
		const rows = [...(whyafcrc?.children ?? [])].sort((a, b) => a.order - b.order || a.id - b.id);
		const source = rows.length ? rows : null;
		return Array.from({ length: source ? rows.length : FALLBACK.items.length }, (_, i) => {
			const row = source?.[i];
			return {
				id: row?.id ?? `fallback-${i}`,
				title: row?.name?.trim() || FALLBACK.items[i]?.title || '',
				desc: withoutHeadings(row?.page_content) || `<p>${FALLBACK.items[i]?.desc ?? ''}</p>`,
				icon: ICONS[i % ICONS.length]
			};
		});
	});
</script>

<section
	class="relative scroll-mt-24 overflow-hidden bg-paper-white py-[100px] max-md:py-16"
	style="background:
		radial-gradient(circle at 5% 10%, rgba(149, 196, 172, 0.38) 0%, transparent 30%),
		radial-gradient(circle at 95% 5%, rgba(204, 176, 232, 0.32) 0%, transparent 30%),
		radial-gradient(circle at 90% 85%, rgba(74, 144, 226, 0.20) 0%, transparent 32%),
		radial-gradient(circle at 15% 90%, rgba(244, 205, 66, 0.20) 0%, transparent 30%),
		radial-gradient(circle at 50% 50%, rgba(105, 177, 123, 0.08) 0%, transparent 45%),
		linear-gradient(135deg, #ffffff 0%, #f8faf9 45%, #faf8fc 100%);
	background-repeat: no-repeat !important;"
	id="why"
>
	<div
		class="mx-auto grid max-w-[1180px] grid-cols-[0.9fr_1.1fr] items-start gap-[70px] px-6 max-lg:grid-cols-1 max-md:px-4"
	>
		<div class="reveal-block">
			<div class="eyebrow text-pine-dark before:bg-pine">{eyebrow}</div>
			<h2
				class="mt-4 mb-5 font-serif text-[clamp(1.9rem,3.2vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.01em] text-pine-dark"
			>
				{title}
			</h2>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- admin-authored CMS content, run through safeHtml() -->
			<div class="why-richtext max-w-[420px]">{@html body}</div>
		</div>

		<div class="why-list reveal-stagger flex flex-col gap-0">
			{#each items as item (item.id)}
				<div
					class="why-item grid grid-cols-[52px_1fr] gap-[22px] border-b border-line py-7 first:pt-[6px] last:border-b-0"
				>
					<div
						class="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-pine/10 text-pine"
					>
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
							<path
								d={item.icon}
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<div>
						<h4
							class="mb-[6px] font-serif text-[1.12rem] font-semibold tracking-[-0.01em] text-pine-dark"
						>
							{item.title}
						</h4>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -- admin-authored CMS content, run through safeHtml() -->
						<div class="why-richtext text-[0.92rem]">{@html item.desc}</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	/* ===== CMS (Tiptap) body rendered through {@html} =====
	   The markup carries no scope class, so every selector is :global(). */
	.why-richtext :global(p) {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.7;
		color: var(--color-ink-soft);
	}
	.why-richtext :global(p:empty) {
		display: none;
	}
	.why-richtext :global(h1),
	.why-richtext :global(h2),
	.why-richtext :global(h3),
	.why-richtext :global(h4),
	.why-richtext :global(h5),
	.why-richtext :global(h6) {
		font-family: var(--font-serif);
		font-weight: 600;
		line-height: 1.25;
		color: var(--color-pine-dark);
		margin: 0 0 8px;
	}
	.why-richtext :global(ul),
	.why-richtext :global(ol) {
		margin: 0;
		padding-left: 20px;
		font-size: 0.92rem;
		line-height: 1.7;
		color: var(--color-ink-soft);
	}
	.why-richtext :global(li) {
		margin-bottom: 4px;
	}
	.why-richtext :global(li::marker) {
		color: var(--color-pine);
	}
	.why-richtext :global(a) {
		color: var(--color-pine);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.why-richtext :global(strong) {
		color: var(--color-pine-dark);
		font-weight: 600;
	}
	.why-richtext :global(blockquote) {
		margin: 8px 0 0;
		padding: 8px 14px;
		border-left: 3px solid var(--color-pine);
		border-radius: 0 8px 8px 0;
		background: color-mix(in srgb, var(--color-pine) 6%, transparent);
		font-style: italic;
	}
	.why-richtext :global(img) {
		max-width: 100%;
		height: auto;
		margin-top: 10px;
		border-radius: 12px;
	}
</style>
