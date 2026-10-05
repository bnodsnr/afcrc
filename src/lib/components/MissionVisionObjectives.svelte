<script lang="ts">
	import type { ComponentData } from '$lib/api/types';
	import { firstHeadingText, toText, withoutHeadings } from '$lib/utils/html';
	import { parseDirectionSection } from '$lib/utils/direction';

	/**
	 * Mission / Vision / Objectives — a bento-style block.
	 *
	 * `section` is the whole `our-direction` CMS row: its `name` is the eyebrow,
	 * its `page_content` the section heading + lead, and its children the cards
	 * (`name` = label, `page_content` = heading + body). Any child that is not
	 * the mission or vision card is treated as an objective.
	 *
	 * `objectives` is optional and lets a dedicated objectives row (with its own
	 * children) take the place of those leftover children.
	 *
	 * BUILT_IN_COPY below is a placeholder for admins who have not created the
	 * row yet. It is used only when the CMS has nothing for this section at all
	 * — it is never merged into a card the CMS has authored, so what you see is
	 * always what you typed in the admin.
	 */
	interface Props {
		section?: ComponentData | null;
		objectives?: ComponentData | null;
	}

	let { section = null, objectives = null }: Props = $props();

	type Card = { label: string; title: string; body: string };

	/** Placeholder copy, used only while the CMS has no `our-direction` row. */
	const BUILT_IN_COPY = {
		eyebrow: 'Our Direction',
		heading: 'What we are here to do — and where we are taking it.',
		lead: '<p>A mission is a promise, a vision is the destination, and our objectives are the work that closes the distance between the two. Here is ours, stated plainly.</p>',
		mission: {
			label: 'Mission',
			title: 'Our Mission',
			body: '<p>To conduct, promote and apply research that advances sustainable agriculture, forest conservation, biodiversity protection and responsible natural resource management — while contributing to resilient communities and a sustainable future.</p>'
		},
		vision: {
			label: 'Vision',
			title: 'Our Vision',
			body: '<p>A future where productive agriculture, thriving forests, protected biodiversity and resilient communities coexist in harmony.</p>'
		}
	};

	const ICONS = {
		mission: 'M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20zM12 7v10M12 3.5h.01M12 20.5h.01',
		vision: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
		objectives: 'M9 11l3 3 7-7M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9'
	};

	/** The `our-direction` row, flattened: header copy plus the cards it parents. */
	let cms = $derived(parseDirectionSection(section));

	// A dedicated objectives row wins; otherwise the leftover `our-direction`
	// children are the objectives.
	let objectiveRow = $derived(cms.objectives ?? objectives);

	let hasCms = $derived(
		Boolean(
			cms.eyebrow ||
			cms.heading ||
			toText(cms.lead) ||
			cms.mission ||
			cms.vision ||
			objectiveRow ||
			cms.extra.length
		)
	);

	/** Reads a CMS row into `{ label, title, body }`. No copy is invented. */
	function read(row: ComponentData | null | undefined): Card {
		const html = row?.page_content;
		const name = row?.name?.trim() ?? '';
		return {
			label: name,
			// Editors often write the card title as the row name and leave the body
			// as plain paragraphs, so the name stands in for a missing heading.
			title: firstHeadingText(html) || name,
			body: withoutHeadings(html)
		};
	}

	/** A card is worth rendering when the CMS gave it a title or a body. */
	function hasContent(card: Card): boolean {
		return Boolean(toText(card.title) || toText(card.body));
	}

	let header = $derived(
		hasCms
			? { eyebrow: cms.eyebrow, heading: cms.heading, lead: cms.lead }
			: {
					eyebrow: BUILT_IN_COPY.eyebrow,
					heading: BUILT_IN_COPY.heading,
					lead: BUILT_IN_COPY.lead
				}
	);

	let missionCard = $derived(hasCms ? read(cms.mission) : { ...BUILT_IN_COPY.mission });
	let visionCard = $derived(hasCms ? read(cms.vision) : { ...BUILT_IN_COPY.vision });
	// Objectives are always CMS-driven: there is no placeholder for them, so the
	// card only appears once the admin has authored it.
	let objectiveCard = $derived(read(objectiveRow));

	// The objectives come from the dedicated objectives row's children, or from
	// whatever is parented under `our-direction` besides mission and vision. The
	// API returns them newest-first, so restore reading order.
	let objectiveItems = $derived.by(() => {
		const source = objectiveRow?.children?.length ? objectiveRow.children : cms.extra;
		return [...source]
			.sort((a, b) => a.order - b.order || a.id - b.id)
			.map((row) => ({
				id: `obj-${row.id}`,
				title: row.name?.trim() ?? '',
				desc: withoutHeadings(row.page_content)
			}));
	});

	/**
	 * A card the admin has not authored is dropped rather than filled with
	 * placeholder copy, so the block shows exactly the rows that exist.
	 */
	let showMission = $derived(!hasCms || hasContent(missionCard));
	let showVision = $derived(!hasCms || hasContent(visionCard));
	let showObjectives = $derived(!hasCms || hasContent(objectiveCard) || objectiveItems.length > 0);

	console.log('MissionVisionObjectives.svelte', {
		showObjectives
	});

	/**
	 * Scroll reveal. A self-contained IntersectionObserver keeps the block
	 * portable — it animates identically on any page without the parent having
	 * to register a GSAP ScrollTrigger.
	 */
	function reveal(node: HTMLElement, opts: { delay?: number } = {}) {
		if (
			typeof IntersectionObserver === 'undefined' ||
			typeof window === 'undefined' ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			return {};
		}

		node.style.setProperty('--reveal-delay', `${opts.delay ?? 0}ms`);
		node.classList.add('mvo-reveal');

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				node.classList.add('mvo-reveal-in');
				observer.disconnect();
			},
			{ threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
		);
		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<section
	class="mvo relative overflow-hidden bg-paper-white py-[110px] max-md:py-16"
	id="mission-vision"
	style="background-image:
			linear-gradient(rgba(253,240,207,0.35) 1px, transparent 1px),
			linear-gradient(90deg, rgba(253,240,207,0.35) 1px, transparent 1px);
			background-size: 64px 64px;
			mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%);
			-webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%);"
>
	<!-- ambient glows -->
	<div
		class="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-meadow/12 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-afcrc-yellow/18 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute -bottom-48 left-1/3 h-[420px] w-[420px] rounded-full bg-afcrc-blue/10 blur-3xl"
	></div>
	<!-- grid texture -->
	<div
		class="pointer-events-none absolute inset-0 opacity-60"
		style="background-image:
			linear-gradient(rgba(32,36,31,0.04) 1px, transparent 1px),
			linear-gradient(90deg, rgba(32,36,31,0.04) 1px, transparent 1px);
			background-size: 64px 64px;
			mask-image: radial-gradient(ellipse 78% 62% at 50% 40%, #000 18%, transparent 76%);
			-webkit-mask-image: radial-gradient(ellipse 78% 62% at 50% 40%, #000 18%, transparent 76%);"
	></div>

	<div class="relative mx-auto max-w-[1180px] px-6 max-md:px-4">
		<!-- ===== HEADER ===== -->
		<header class="max-w-[760px]">
			<div use:reveal>
				<span
					class="inline-flex items-center gap-2.5 rounded-full border border-pine/20 bg-white/75 py-1.5 pr-5 pl-1.5 shadow-[0_8px_24px_-18px_rgba(23,83,58,0.6)] backdrop-blur-md"
				>
					<span
						class="flex h-7 w-7 items-center justify-center rounded-full bg-afcrc-yellow text-pine-dark"
					>
						<svg
							class="h-3.5 w-3.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M12 2v20M2 12h20" />
							<circle cx="12" cy="12" r="4" />
						</svg>
					</span>
					<span class="font-mono text-[0.66rem] tracking-[0.2em] text-pine uppercase"
						>{header.eyebrow}</span
					>
				</span>
			</div>

			<h2
				use:reveal={{ delay: 70 }}
				class="mt-5 mb-5 font-serif text-[clamp(1.9rem,3.6vw,2.85rem)] leading-[1.08] font-semibold tracking-[-0.02em] text-balance text-pine-dark"
			>
				{header.heading}
			</h2>

			<div use:reveal={{ delay: 140 }} class="mvo-lead max-w-[620px] text-pretty">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- admin-authored CMS content, run through safeHtml() -->
				{@html header.lead}
			</div>
		</header>

		<!-- ===== BENTO =====
		     Mobile-first: the spans below are `lg:`-prefixed, otherwise `span N`
		     against a 1-column grid would create N implicit columns and squeeze
		     the cards. -->
		<div class="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-12">
			<!-- MISSION — dark, tall -->
			{#if showMission}
				<article
					use:reveal={{ delay: 120 }}
					class="mvo-card mvo-card--mission group relative flex flex-col overflow-hidden rounded-3xl p-9 max-md:p-7 lg:col-span-5"
					aria-labelledby="mvo-mission"
				>
					<!-- decorative rings -->
					<svg
						class="pointer-events-none absolute -right-16 -bottom-20 h-[280px] w-[280px] opacity-[0.16] transition-transform duration-700 group-hover:rotate-6"
						viewBox="0 0 200 200"
						fill="none"
						aria-hidden="true"
					>
						<circle cx="100" cy="100" r="96" stroke="currentColor" stroke-width="1" />
						<circle
							cx="100"
							cy="100"
							r="72"
							stroke="currentColor"
							stroke-width="1"
							stroke-dasharray="6 10"
						/>
						<circle cx="100" cy="100" r="46" stroke="currentColor" stroke-width="1" />
						<circle cx="100" cy="100" r="18" fill="currentColor" />
					</svg>

					<div class="mvo-icon mvo-icon--gold">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.7"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d={ICONS.mission} />
						</svg>
					</div>

					<h3 id="mvo-mission" class="mvo-title mvo-title--on-dark">{missionCard.title}</h3>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- admin-authored CMS content, run through safeHtml() -->
					<div class="mvo-richtext mvo-richtext--on-dark">{@html missionCard.body}</div>
				</article>
			{/if}

			<!-- VISION — light, wide, editorial quote -->
			{#if showVision}
				<article
					use:reveal={{ delay: 200 }}
					class="mvo-card mvo-card--vision group relative col-span-1 flex flex-col overflow-hidden rounded-3xl p-9 max-md:p-7 lg:col-span-7"
					aria-labelledby="mvo-vision"
				>
					<span
						class="pointer-events-none absolute -top-6 right-6 font-serif text-[9rem] leading-none text-afcrc-yellow/20 select-none max-md:hidden"
						aria-hidden="true">&ldquo;</span
					>

					<div class="mvo-icon mvo-icon--teal">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.7"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d={ICONS.vision} />
						</svg>
					</div>

					<h3 id="mvo-vision" class="mvo-title">{visionCard.title}</h3>

					<blockquote class="mvo-quote">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -- admin-authored CMS content, run through safeHtml() -->
						{@html visionCard.body}
					</blockquote>
				</article>
			{/if}

			<!-- OBJECTIVES — full width checklist -->
			{#if showObjectives}
				<article
					use:reveal={{ delay: 280 }}
					class="mvo-card mvo-card--objectives group relative col-span-1 rounded-3xl p-9 max-md:p-7 lg:col-span-12"
					aria-labelledby="mvo-objectives"
				>
					<div class="flex flex-wrap items-start gap-6 max-sm:flex-col">
						<div class="flex items-start gap-4">
							<div class="mvo-icon mvo-icon--pine">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.7"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d={ICONS.objectives} />
								</svg>
							</div>
							{#if objectiveCard.title}
								<div>
									{#if objectiveCard.label}
										<p class="mvo-index">03 — {objectiveCard.label}</p>
									{/if}
									<h3 id="mvo-objectives" class="mvo-title">{objectiveCard.title}</h3>
								</div>
							{/if}
						</div>

						{#if objectiveCard.body}
							<!-- eslint-disable-next-line svelte/no-at-html-tags -- admin-authored CMS content, run through safeHtml() -->
							<div class="mvo-richtext min-w-[260px] flex-1">{@html objectiveCard.body}</div>
						{/if}
					</div>

					<ul class="mt-8 grid grid-cols-2 gap-x-10 gap-y-1 max-md:grid-cols-1">
						{#each objectiveItems as objective, i (objective.id)}
							<li
								use:reveal={{ delay: 320 + i * 70 }}
								class="mvo-row group/row flex gap-4 border-t border-line py-6"
							>
								<span class="mvo-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
								<div>
									<h4 class="mvo-row-title">{objective.title}</h4>
									<!-- eslint-disable-next-line svelte/no-at-html-tags -- admin-authored CMS content, run through safeHtml() -->
									<div class="mvo-richtext mt-1.5 text-[0.92rem]">{@html objective.desc}</div>
								</div>
							</li>
						{/each}
					</ul>
				</article>
			{/if}
		</div>
	</div>
</section>

<style>
	/* ===== reveal ===== */
	:global(.mvo-reveal) {
		opacity: 0;
		transform: translateY(26px);
		transition:
			opacity 0.75s ease var(--reveal-delay, 0ms),
			transform 0.75s cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay, 0ms);
	}
	:global(.mvo-reveal-in) {
		opacity: 1;
		transform: none;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.mvo-reveal) {
			opacity: 1;
			transform: none;
		}
		.mvo-card {
			transition: none !important;
		}
	}

	/* ===== cards ===== */
	.mvo-card {
		transition:
			transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 0.45s ease,
			border-color 0.45s ease;
	}
	@media (min-width: 1024px) {
		.mvo-card:hover {
			transform: translateY(-6px);
		}
	}

	.mvo-card--mission {
		color: var(--color-paper);
		background:
			radial-gradient(120% 90% at 100% 0%, rgba(239, 199, 47, 0.26) 0%, transparent 55%),
			radial-gradient(100% 80% at 0% 100%, rgba(63, 160, 196, 0.24) 0%, transparent 58%),
			linear-gradient(150deg, #17533a 0%, #0f3a28 100%);
		box-shadow: 0 30px 60px -34px rgba(23, 83, 58, 0.85);
	}
	.mvo-card--mission:hover {
		box-shadow: 0 40px 80px -34px rgba(23, 83, 58, 0.9);
	}

	.mvo-card--vision {
		color: var(--color-pine-dark);
		border: 1px solid rgba(23, 83, 58, 0.12);
		background:
			radial-gradient(110% 80% at 100% 0%, rgba(239, 199, 47, 0.2) 0%, transparent 55%),
			linear-gradient(160deg, #fffdf6 0%, #fdf6e2 100%);
		box-shadow: 0 24px 56px -36px rgba(23, 83, 58, 0.5);
	}

	.mvo-card--objectives {
		color: var(--color-pine-dark);
		border: 1px solid var(--color-line);
		background: rgba(255, 255, 255, 0.86);
		box-shadow: 0 24px 60px -40px rgba(23, 83, 58, 0.55);
		backdrop-filter: blur(10px);
	}

	/* ===== icon tile ===== */
	.mvo-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		margin-bottom: 22px;
		border-radius: 16px;
		transition:
			transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 0.45s ease;
	}
	.mvo-icon svg {
		width: 24px;
		height: 24px;
	}
	@media (min-width: 1024px) {
		.mvo-card:hover .mvo-icon {
			transform: translateY(-3px) rotate(-4deg);
		}
	}
	.mvo-icon--gold {
		color: #0f3a28;
		background: linear-gradient(140deg, #fbe9ba 0%, #efc72f 100%);
		box-shadow: 0 12px 26px -12px rgba(239, 199, 47, 0.8);
	}
	.mvo-icon--teal {
		color: var(--color-pine-dark);
		background: linear-gradient(140deg, #dff0e4 0%, #94b62c 100%);
		box-shadow: 0 12px 26px -12px rgba(148, 182, 44, 0.85);
	}
	.mvo-icon--pine {
		color: var(--color-paper);
		background: linear-gradient(140deg, #2b6d4c 0%, #17533a 100%);
		box-shadow: 0 12px 26px -12px rgba(23, 83, 58, 0.8);
	}

	/* ===== type ===== */
	.mvo-index {
		font-family: var(--font-mono);
		font-size: 0.64rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--color-ink-soft);
		margin-bottom: 10px;
	}
	.mvo-title {
		font-family: var(--font-serif);
		font-size: clamp(1.35rem, 2.1vw, 1.65rem);
		font-weight: 600;
		letter-spacing: -0.015em;
		line-height: 1.15;
		margin-bottom: 16px;
	}
	.mvo-title--on-dark {
		color: var(--color-paper);
	}

	/* The section lead is CMS HTML (an <h2> + <p> pair in the admin), so it needs
	   the same paragraph treatment the card bodies get. */
	.mvo-lead :global(p) {
		margin: 0;
		font-size: 1.02rem;
		line-height: 1.75;
		color: var(--color-ink-soft);
	}
	.mvo-lead :global(p + p) {
		margin-top: 0.75rem;
	}
	.mvo-lead :global(p:empty) {
		display: none;
	}
	.mvo-lead :global(a) {
		color: var(--color-pine);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.mvo-lead :global(strong) {
		color: var(--color-pine-dark);
		font-weight: 600;
	}

	.mvo-quote {
		margin: 0 0 26px;
		font-family: var(--font-serif);
		font-size: clamp(1.1rem, 1.75vw, 1.32rem);
		font-weight: 500;
		line-height: 1.5;
		letter-spacing: -0.01em;
		color: var(--color-pine-dark);
		position: relative;
		z-index: 1;
	}

	.mvo-row-title {
		font-family: var(--font-serif);
		font-size: 1.06rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--color-pine-dark);
		transition: color 0.3s ease;
	}
	.mvo-row:hover .mvo-row-title {
		color: var(--color-pine);
	}

	.mvo-num {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		flex-shrink: 0;
		border-radius: 11px;
		border: 1px solid var(--color-line);
		background: var(--color-paper-white);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-ink-soft);
		transition:
			background-color 0.35s ease,
			border-color 0.35s ease,
			color 0.35s ease;
	}
	.mvo-row:hover .mvo-num {
		background: var(--color-afcrc-yellow);
		border-color: transparent;
		color: var(--color-pine-dark);
	}

	/* ===== CMS (Tiptap) bodies rendered through {@html} =====
	   The markup carries no scope class, so every selector is :global(). */
	.mvo-richtext :global(p) {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.75;
		color: var(--color-ink-soft);
	}
	.mvo-richtext :global(p:empty) {
		display: none;
	}
	.mvo-richtext :global(ul),
	.mvo-richtext :global(ol) {
		margin: 0;
		padding-left: 20px;
		font-size: 0.95rem;
		line-height: 1.7;
		color: var(--color-ink-soft);
	}
	.mvo-richtext :global(li) {
		margin-bottom: 4px;
	}
	.mvo-richtext :global(li::marker) {
		color: var(--color-pine);
	}
	.mvo-richtext :global(a) {
		color: var(--color-pine);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.mvo-richtext :global(strong) {
		color: var(--color-pine-dark);
		font-weight: 600;
	}
	.mvo-richtext :global(blockquote) {
		margin: 8px 0 0;
		padding: 8px 14px;
		border-left: 3px solid var(--color-pine);
		border-radius: 0 8px 8px 0;
		background: color-mix(in srgb, var(--color-pine) 6%, transparent);
		font-style: italic;
	}

	.mvo-richtext--on-dark :global(p) {
		color: rgba(253, 240, 207, 0.82);
	}
	.mvo-richtext--on-dark :global(ul),
	.mvo-richtext--on-dark :global(ol) {
		color: rgba(253, 240, 207, 0.82);
	}
	.mvo-richtext--on-dark :global(li::marker) {
		color: var(--color-afcrc-yellow);
	}
	.mvo-richtext--on-dark :global(strong) {
		color: var(--color-paper);
	}
	.mvo-richtext--on-dark :global(a) {
		color: var(--color-afcrc-yellow);
	}

	/* The vision statement is set large, so its CMS body gets the same treatment. */
	.mvo-quote :global(p) {
		margin: 0;
		font-family: var(--font-serif);
		font-size: clamp(1.1rem, 1.75vw, 1.32rem);
		font-weight: 500;
		line-height: 1.5;
		letter-spacing: -0.01em;
		color: var(--color-pine-dark);
	}
	.mvo-quote :global(p:empty) {
		display: none;
	}
	.mvo-quote :global(strong) {
		color: var(--color-brand-green);
		font-weight: 600;
	}
</style>
