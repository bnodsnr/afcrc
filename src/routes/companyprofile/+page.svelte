<script lang="ts">
	import { resolve } from '$app/paths';
	import type { CategoryData, ComponentData } from '$lib/api/types';
	import type { ServiceData } from '$lib/api/services';
	import ChairmanMessage from '$lib/components/ChairmanMessage.svelte';
	import { getImageUrl } from '$lib/utils/image';
	import { firstHeadingText, toText, withoutHeadings } from '$lib/utils/html';
	import { getCategoryUrl } from '$lib/utils/url';
	import serviceFallback from '$lib/images/cat_banner_1.png';
	import MissionVisionObjectives from '$lib/components/MissionVisionObjectives.svelte';

	let {
		data
	}: {
		data: {
			categories?: CategoryData[];
			services?: ServiceData[];
			chairmanMessage?: ComponentData | null;
			companyProfile?: ComponentData | null;
			companyStory?: ComponentData | null;
			storyWidget?: ComponentData | null;
			direction?: ComponentData | null;
			objectives?: ComponentData | null;
		};
	} = $props();
	/** How many categories the hero card grid shows. */
	const HERO_CATEGORY_LIMIT = 4;

	/** Accent colours cycled across the hero cards (from BannerSection). */
	const cardAccents = [
		'var(--green)',
		'var(--meat-red)',
		'var(--herb-purple)',
		'var(--bev-orange)'
	];
	const cardAccentText = [
		'var(--green-dark)',
		'var(--meat-red)',
		'var(--herb-purple)',
		'var(--bev-orange)'
	];
	const cardIcons = [
		'M12 22V12M12 12C12 7 8 4 4 4c0 5 3 8 8 8zM12 12c0-5 4-8 8-8 0 5-3 8-8 8z',
		'ellipse',
		'leaf',
		'bottle'
	];

	/** All categories from the API; empty when the backend is unavailable. */
	const allCategories = $derived<CategoryData[]>(data.categories ?? []);

	/** All services from the API; empty when the backend is unavailable. */
	const allServices = $derived<ServiceData[]>(data.services ?? []);

	/** API-driven hero cards. No image field — cards are solid colour only. */
	const heroCategories = $derived(
		allCategories
			.filter((c) => c && (c.slug || c.name))
			.slice(0, HERO_CATEGORY_LIMIT)
			.map((c, i) => ({
				id: c.id,
				name: c.name,
				description: c.description,
				icon: cardIcons[i % cardIcons.length],
				href: getCategoryUrl(c)
			}))
	);

	/* ==================================================================
	   API-DRIVEN HERO COPY
	   The "company-profile" parent row: `name` labels the hero, its
	   `page_content` (Tiptap) is the tagline.
	   ================================================================== */

	/** Unwraps a single wrapping <p> so its inner markup can sit inside our own. */
	function unwrapParagraph(html: string): string {
		const single = html.match(/^<p\b[^>]*>([\s\S]*)<\/p>$/i);
		return single ? single[1] : html;
	}

	const HERO_FALLBACK = {
		title: 'Company Profile',
		tagline:
			'<strong>Agricultural &amp; Forest Conservation Research Centre.</strong> Research that transforms knowledge into practical solutions — advancing sustainable agriculture, forest conservation, biodiversity protection and responsible natural resource management for the communities and environments that depend on them.'
	};

	let heroTitle = $derived(data.companyProfile?.name?.trim() || HERO_FALLBACK.title);

	// The body is editor-authored, so it is sanitised before rendering; a body with
	// more than one paragraph stays as authored and the CSS keeps them apart.
	let heroTagline = $derived.by(() => {
		const body = unwrapParagraph(withoutHeadings(data.companyProfile?.page_content ?? ''));
		return toText(body) ? body : HERO_FALLBACK.tagline;
	});

	/* ==================================================================
	   API-DRIVEN COMPANY STORY (TIMELINE)
	   The "company-story" parent row supplies the section copy. The
	   "our-story" parent row, passed in as `storyWidget`, is a separate
	   component: its children are the milestones, one per timeline node.
	   ================================================================== */

	/**
	 * FALLBACK MILESTONES — not supplied by AFCRC.
	 * These stand in until an "our-story" component (with one child per
	 * milestone) exists in the admin; replace or delete them once it does.
	 */
	const STORY_FALLBACK = [
		{
			id: -1,
			year: '2026',
			title: 'The work begins',
			desc: 'AFCRC starts operating in Nepal and Australia as an international agriculture company, built on sustainable farming, forest conservation and the transfer of knowledge to Nepalese farmers.',
			image: null
		},
		{
			id: -2,
			year: '',
			title: 'A mega farming project in Nawalparasi',
			desc: 'A farming project is established in Nawalparasi District, Nepal, to promote sustainable agriculture and move knowledge and skills from Australia to the farmers who work the land.',
			image: null
		},
		{
			id: -3,
			year: '',
			title: 'From farm to value chain',
			desc: 'The scope widens from cultivation to agro-processing, value chains and stakeholder integration, so producers, commercial enterprise and the food sector are served end to end.',
			image: null
		},
		{
			id: -4,
			year: '',
			title: 'One operation, three capabilities',
			desc: 'Sourcing, packaging and distribution run under one roof, so quality decisions made at the farm gate are never lost by the time a product reaches a shelf.',
			image: null
		}
	];

	/** A milestone name may lead with a year — "2013 — Founded" — which becomes the node badge. */
	function splitYear(name: string): { year: string; title: string } {
		const match = (name ?? '').match(/^\s*((?:19|20)\d{2})\s*[—–\-:|·]*\s*(.+)$/);
		return match
			? { year: match[1], title: match[2].trim() }
			: { year: '', title: (name ?? '').trim() };
	}

	/** The "company-story" row: name = eyebrow, page_content = heading + intro. */
	let storyParent = $derived(data.companyStory ?? null);
	let storyLabel = $derived(storyParent?.name?.trim() || 'Our Story');
	let storyHeading = $derived(
		firstHeadingText(storyParent?.page_content) ||
			'One field of work, two countries, a long commitment.'
	);
	let storyIntro = $derived.by(() => {
		const body = withoutHeadings(storyParent?.page_content ?? '');
		return toText(body) ? body : '';
	});

	/** The "our-story" row, supplied via props: its children are the milestones. */
	let storyWidget = $derived(data.storyWidget ?? null);

	let storyMilestones = $derived.by(() => {
		// The API returns children newest-first, so restore reading order.
		const rows = [...(storyWidget?.children ?? [])]
			.filter((row) => row?.name || row?.page_content)
			.sort((a, b) => a.order - b.order || a.id - b.id);

		if (!rows.length) return STORY_FALLBACK;

		return rows.map((row) => {
			const { year, title } = splitYear(row.name);
			return {
				id: row.id,
				year,
				title: title || `Step ${row.order}`,
				desc: toText(withoutHeadings(row.page_content)),
				image: row.featured_image ? getImageUrl(row.featured_image) : null
			};
		});
	});

	/* ==================================================================
	   EASY-TO-REPLACE CONFIGURATION
	   ================================================================== */

	/** Company profile PDF. Replace with the real file path when uploaded. */
	const PROFILE_PDF_URL = '/documents/AFCRC-Company-Profile.pdf';

	/**
	 * PLACEHOLDER FIGURES — NOT VERIFIED FACTS.
	 * These numbers were not supplied by AFCRC. Replace every `value` with
	 * audited data (or remove an entry entirely) before publishing.
	 */
	const IMPACT_STATS = [
		{ value: 10, suffix: '+', label: 'Years of Experience' },
		{ value: 50, suffix: '+', label: 'Research & Development Activities' },
		{ value: 1000, suffix: '+', label: 'Farmers & Community Members Reached' },
		{ value: 20, suffix: '+', label: 'Training & Capacity Building Programs' }
	];

	type Palette = { sky: string; hill1: string; hill2: string; hill3: string; sun: string };

	/** Icon paths cycled across service cards. */
	const serviceIcons = [
		'M12 2 3 9l9 4 9-4-9-7z',
		'M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z',
		'M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.6.5 1 1.3 1 2.1V16h6v-1.4c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 2z',
		'M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z',
		'M9 3v6l-5 9a1 1 0 0 0 1 1.5h14a1 1 0 0 0 1-1.5l-5-9V3',
		'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'
	];

	/** Card palettes cycled across service cards. */
	const servicePalettes: Palette[] = [
		{ sky: '#EAF3D8', hill1: '#94B62C', hill2: '#5C8A2A', hill3: '#3C6B21', sun: '#F5C542' },
		{ sky: '#DCEEE2', hill1: '#2F6B34', hill2: '#21512A', hill3: '#153B1F', sun: '#EFC72F' },
		{ sky: '#E3F0F6', hill1: '#4A7CC9', hill2: '#2F6B8F', hill3: '#1D4A66', sun: '#8FD3F0' },
		{ sky: '#FBEFD6', hill1: '#C9A441', hill2: '#8A6E22', hill3: '#5C4A17', sun: '#EFC72F' },
		{ sky: '#EDE6F8', hill1: '#7C6FC9', hill2: '#564BA0', hill3: '#3A3270', sun: '#C9BDF2' },
		{ sky: '#DFF0E8', hill1: '#4B845A', hill2: '#2B6D4C', hill3: '#17533A', sun: '#F5C542' }
	];

	/**
	 * Service cards driven by the services API.
	 * Images come from `featured_image`; the SVG scenery renders only when the
	 * API record has no image, so the grid never shows a broken image.
	 */
	const serviceCards = $derived(
		allServices.map((s, i) => ({
			id: s.id,
			key: s.slug || String(s.id),
			title: s.name,
			desc: s.short_description ?? '',
			image: s.featured_image ? getImageUrl(s.featured_image, serviceFallback) : null,
			icon: serviceIcons[i % serviceIcons.length],
			palette: servicePalettes[i % servicePalettes.length],
			href: resolve('/services/[slug]', { slug: s.slug || String(s.id) })
		}))
	);

	const APPROACH_STEPS: { title: string; desc: string }[] = [
		{ title: 'Research', desc: 'Identify challenges and opportunities.' },
		{ title: 'Innovation', desc: 'Develop practical and sustainable solutions.' },
		{ title: 'Knowledge Transfer', desc: 'Share knowledge and build capacity.' },
		{ title: 'Field Application', desc: 'Put research into practical use.' },
		{ title: 'Community Impact', desc: 'Support stronger livelihoods and healthier environments.' }
	];

	const CORE_VALUES = [
		{
			icon: 'M6 2h12M6 22h12M6 2c0 6 6 6 6 10s-6 4-6 10M18 2c0 6-6 6-6 10s6 4 6 10',
			title: 'Evidence First',
			desc: 'Every recommendation begins with field data.'
		},
		{
			icon: 'M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
			title: 'Sustainability',
			desc: 'Long-term thinking for land and people.'
		},
		{
			icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
			title: 'Partnership',
			desc: 'We work alongside communities, never for them.'
		}
	];

	/* ==================================================================
	   BEHAVIOUR
	   ================================================================== */

	function reveal(node: HTMLElement, opts: { delay?: number } = {}) {
		if (
			typeof IntersectionObserver === 'undefined' ||
			typeof window === 'undefined' ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			return {};
		}

		node.style.setProperty('--reveal-delay', `${opts.delay ?? 0}ms`);
		node.classList.add('cp-reveal');

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				node.classList.add('cp-reveal-in');
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

	function counter(node: HTMLElement, opts: { to: number }) {
		if (
			typeof IntersectionObserver === 'undefined' ||
			typeof window === 'undefined' ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			return {};
		}

		let frame = 0;
		node.textContent = '0';

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();

				const duration = 1500;
				const started = performance.now();

				const tick = (now: number) => {
					const p = Math.min(1, (now - started) / duration);
					const eased = 1 - Math.pow(1 - p, 3);
					node.textContent = Math.round(opts.to * eased).toLocaleString('en-US');
					if (p < 1) frame = requestAnimationFrame(tick);
				};

				frame = requestAnimationFrame(tick);
			},
			{ threshold: 0.5 }
		);
		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
				cancelAnimationFrame(frame);
			}
		};
	}
</script>

<svelte:head>
	<title>Company Profile — AFCRC Foundation</title>
	<meta
		name="description"
		content="The Agricultural & Forest Conservation Research Centre (AFCRC) Foundation — our services, product categories, approach and impact in sustainable agriculture, forest conservation and biodiversity."
	/>
</svelte:head>

{#snippet scenery(palette: Palette, uid: string)}
	<svg
		viewBox="0 0 400 260"
		preserveAspectRatio="xMidYMid slice"
		class="h-full w-full"
		aria-hidden="true"
		focusable="false"
	>
		<defs>
			<linearGradient id="sky-{uid}" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color={palette.sky} />
				<stop offset="100%" stop-color="#ffffff" stop-opacity="0.35" />
			</linearGradient>
		</defs>
		<rect width="400" height="260" fill="url(#sky-{uid})" />
		<circle cx="312" cy="58" r="24" fill={palette.sun} opacity="0.9" />
		<circle cx="312" cy="58" r="40" fill={palette.sun} opacity="0.16" />
		<path d="M0 168 Q 90 118 190 152 T 400 126 V260 H0 Z" fill={palette.hill1} />
		<path d="M0 202 Q 110 164 235 196 T 400 178 V260 H0 Z" fill={palette.hill2} />
		<path d="M0 234 Q 130 208 265 230 T 400 220 V260 H0 Z" fill={palette.hill3} />
	</svg>
{/snippet}

<!-- ============================= HERO ============================= -->
<!-- Design ported from src/lib/components/BannerSection.svelte.
     Image layers removed (.bg-slider / .slide / .dots / .card-photo);
     the hero background and the category cards use solid colours only. -->
<section class="cp-hero p-[44px]">
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.16]"
		style="background-image:
			linear-gradient(rgba(253,240,207,0.35) 1px, transparent 1px),
			linear-gradient(90deg, rgba(253,240,207,0.35) 1px, transparent 1px);
			background-size: 64px 64px;
			mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%);
			-webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%);"
	></div>
	<div
		class="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full blur-3xl"
		style="background: radial-gradient(circle, rgba(239,199,47,0.22) 0%, transparent 70%);"
	></div>
	<div class="leaf-decor right" aria-hidden="true"></div>

	<div class="content-row">
		<!-- LEFT: headline + copy -->
		<div class="left-col pt-5">
			<h1 use:reveal={{ delay: 120 }} class="headline-script">{heroTitle}</h1>

			<div use:reveal={{ delay: 180 }} class="divider-row">
				<span class="line"></span>
				<span class="leaf-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
						<path d="M6 20c0-6 2-10 6-14 4 4 6 8 6 14z" />
						<path d="M12 6v14" />
					</svg>
				</span>
				<span class="line"></span>
			</div>

			<!-- eslint-disable-next-line svelte/no-at-html-tags -- admin-authored CMS content, run through safeHtml() -->
			<p use:reveal={{ delay: 220 }} class="tagline">{@html heroTagline}</p>

			<!-- Impact stats (moved here from the former "9. IMPACT" section) -->
			<div use:reveal={{ delay: 300 }} class="mt-8 w-full">
				<!-- gap-px over a translucent bg draws hairline dividers between the cells -->
				<dl
					class="m-0 grid grid-cols-4 gap-px overflow-hidden rounded-xl bg-paper/12 max-sm:grid-cols-2"
				>
					{#each IMPACT_STATS as stat (stat.label)}
						<div
							class="flex flex-col items-center justify-center gap-1.5 bg-pine-dark px-2 py-3.5 text-center transition-colors duration-300 hover:bg-pine-dark/70"
						>
							<dd
								class="m-0 font-serif text-[1.3rem] leading-none font-semibold text-afcrc-yellow tabular-nums"
							>
								<span use:counter={{ to: stat.value }}>{stat.value.toLocaleString('en-US')}</span
								><span>{stat.suffix}</span>
							</dd>
							<dt class="text-[0.6rem] leading-[1.3] text-paper/60">{stat.label}</dt>
						</div>
					{/each}
				</dl>
			</div>

			<div use:reveal={{ delay: 340 }} class="mt-7 flex flex-wrap gap-3.5">
				<!-- eslint-disable svelte/no-navigation-without-resolve -- PROFILE_PDF_URL is a static file in /documents, not an app route -->
				<a href={PROFILE_PDF_URL} class="hero-btn hero-btn--solid">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
					</svg>
					Download Profile
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<a href={resolve('/contact')} class="hero-btn hero-btn--ghost">Get in Touch</a>
			</div>
		</div>

		<!-- RIGHT: category card grid (API: getCategories) -->
		<div class="right-col">
			<div class="card-grid">
				{#each heroCategories as cat, i (cat.id)}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- getCategoryUrl() already prefixes the SvelteKit base path -->
					<a
						href={cat.href}
						class="card"
						style="--accent: {cardAccents[i % cardAccents.length]}; --accent-text: {cardAccentText[
							i % cardAccentText.length
						]}; animation-delay: {0.05 + i * 0.12}s"
					>
						<div class="icon-circle">
							{#if cat.icon === 'leaf'}
								<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
									<path d="M6 20c0-6 2-10 6-14 4 4 6 8 6 14z" />
									<path d="M12 6v14" />
								</svg>
							{:else if cat.icon === 'ellipse'}
								<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
									<ellipse cx="12" cy="13" rx="7" ry="6" />
									<path d="M8 8c0-3 2-5 2-5" />
								</svg>
							{:else if cat.icon === 'bottle'}
								<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
									<path d="M8 3h8l-1 5H9z" />
									<path d="M9 8l1 12h4l1-12" />
								</svg>
							{:else}
								<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
									<path d={cat.icon} />
								</svg>
							{/if}
						</div>
						<h3>{cat.name}</h3>
						<div class="mini-line"></div>
						{#if cat.description}
							<p class="sub">{cat.description}</p>
						{/if}
					</a>
				{/each}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</div>
		</div>
	</div>
</section>
<ChairmanMessage message={data.chairmanMessage ?? null} />
<MissionVisionObjectives section={data.direction ?? null} objectives={data.objectives ?? null} />
<!-- ============================= COMPANY STORY ============================= -->
<section id="story" class="relative overflow-hidden bg-paper-white py-[100px] max-md:py-16">
	<!-- ambient -->
	<div
		class="pointer-events-none absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-meadow/20 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-afcrc-yellow/20 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.5]"
		style="background-image:
			linear-gradient(rgba(32,36,31,0.045) 1px, transparent 1px),
			linear-gradient(90deg, rgba(32,36,31,0.045) 1px, transparent 1px);
			background-size: 72px 72px;
			mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 75%);
			-webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 75%);"
	></div>

	<div class="relative mx-auto max-w-[1180px] px-6 max-md:px-4">
		<header use:reveal class="mx-auto max-w-[760px] text-center">
			<span
				class="inline-flex items-center gap-2.5 rounded-full border border-pine/20 bg-white/80 py-1.5 pr-5 pl-1.5 shadow-[0_8px_24px_-16px_rgba(23,83,58,0.55)] backdrop-blur-md"
			>
				<span
					class="flex h-7 w-7 items-center justify-center rounded-full bg-afcrc-yellow text-pine-dark"
				>
					<svg
						class="h-3.5 w-3.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="9" />
						<path d="M12 7.5V12l3 2" />
					</svg>
				</span>
				<span class="font-mono text-[0.66rem] tracking-[0.2em] text-pine uppercase"
					>{storyLabel}</span
				>
			</span>

			<h2
				class="mt-5 mb-4 font-serif text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.08] font-semibold tracking-[-0.02em] text-pine-dark"
			>
				{storyHeading}
			</h2>
			{#if storyIntro}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- admin-authored CMS content, run through safeHtml() -->
				<p class="text-[0.98rem] leading-relaxed text-ink-soft">{@html storyIntro}</p>
			{/if}
		</header>

		<ol class="story-list mt-16 max-md:mt-10">
			{#each storyMilestones as milestone, i (milestone.id ?? i)}
				<li class="story-item" use:reveal={{ delay: (i % 2) * 90 }}>
					<span class="story-dot" aria-hidden="true"><span></span></span>

					<article class="story-card">
						{#if milestone.year}
							<span class="story-year font-mono">{milestone.year}</span>
						{/if}
						<h3 class="font-serif text-[1.2rem] font-semibold text-pine-dark max-sm:text-[1.1rem]">
							{milestone.title}
						</h3>
						{#if milestone.desc}
							<p class="mt-2.5 text-[0.92rem] leading-[1.75] text-ink-soft">{milestone.desc}</p>
						{/if}
					</article>

					{#if milestone.image}
						<img src={milestone.image} alt="" loading="lazy" decoding="async" class="story-media" />
					{/if}
				</li>
			{/each}
		</ol>
	</div>
</section>

<!-- ============================= 9. DOWNLOAD ============================= -->
<section class="relative overflow-hidden bg-paper-white py-[100px] max-md:py-16">
	<div class="relative mx-auto max-w-[1180px] px-6 max-md:px-4">
		<div
			use:reveal
			class="relative overflow-hidden rounded-[32px] bg-pine-dark px-8 py-12 max-lg:py-10 sm:px-12 lg:px-16 lg:py-16"
		>
			<!-- leaf decorations -->
			<svg
				class="pointer-events-none absolute -top-10 -right-10 h-56 w-56 text-afcrc-lime/12 max-sm:hidden"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.6.5 1 1.3 1 2.1V16h6v-1.4c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 2z"
				/>
			</svg>
			<svg
				class="pointer-events-none absolute -bottom-14 -left-8 h-64 w-64 rotate-45 text-afcrc-yellow/10 max-sm:hidden"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
			</svg>
			<div
				class="pointer-events-none absolute inset-0 opacity-[0.14]"
				style="background-image:
					linear-gradient(rgba(253,240,207,0.35) 1px, transparent 1px),
					linear-gradient(90deg, rgba(253,240,207,0.35) 1px, transparent 1px);
					background-size: 56px 56px;
					mask-image: radial-gradient(ellipse 70% 70% at 70% 40%, #000 20%, transparent 75%);
					-webkit-mask-image: radial-gradient(ellipse 70% 70% at 70% 40%, #000 20%, transparent 75%);"
			></div>

			<div class="relative grid items-center gap-12 lg:grid-cols-[0.55fr_1fr]">
				<!-- document mockup -->
				<div class="mx-auto w-full max-w-[210px] max-lg:order-2">
					<div
						class="doc-mockup relative rounded-xl bg-paper p-4 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.7)] transition-transform duration-500 ease-out hover:scale-[1.04] hover:rotate-[-3deg]"
					>
						<div class="mb-3 flex items-center justify-between">
							<span class="h-2 w-10 rounded-full bg-pine/25"></span>
							<span class="h-2 w-6 rounded-full bg-afcrc-yellow"></span>
						</div>
						<div class="mb-2 h-2.5 w-full rounded-full bg-pine-dark/70"></div>
						<div class="mb-1.5 h-1.5 w-4/5 rounded-full bg-pine-dark/20"></div>
						<div class="mb-4 h-1.5 w-3/5 rounded-full bg-pine-dark/20"></div>
						<div class="mb-4 h-20 rounded-lg bg-gradient-to-br from-meadow/45 to-pine/25"></div>
						<div class="mb-1.5 h-1.5 w-full rounded-full bg-pine-dark/20"></div>
						<div class="mb-1.5 h-1.5 w-11/12 rounded-full bg-pine-dark/20"></div>
						<div class="h-1.5 w-2/3 rounded-full bg-pine-dark/20"></div>
					</div>
				</div>

				<div class="text-center lg:text-left">
					<div
						class="eyebrow justify-center text-afcrc-yellow before:bg-afcrc-yellow lg:justify-start"
					>
						Company Profile
					</div>
					<h2
						class="mt-4 mb-4 font-serif text-[clamp(1.7rem,3.2vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-paper"
					>
						Explore the Complete AFCRC Company Profile
					</h2>
					<p class="mx-auto max-w-[520px] text-[0.96rem] leading-relaxed text-paper/70 lg:mx-0">
						Download our complete company profile to learn more about AFCRC Foundation, our mission,
						research areas, projects, activities, products and approach.
					</p>

					<!-- eslint-disable svelte/no-navigation-without-resolve -- PROFILE_PDF_URL is a static file in /documents, not an app route -->
					<a
						href={PROFILE_PDF_URL}
						class="mt-8 inline-flex items-center gap-2.5 rounded-full bg-afcrc-yellow px-8 py-4 font-mono text-[0.74rem] font-semibold tracking-[0.16em] text-pine-dark uppercase transition-all duration-300 hover:bg-paper hover:shadow-[0_22px_46px_-20px_rgba(239,199,47,0.95)]"
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
						</svg>
						Download Company Profile PDF
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* ==================================================================
	   HERO — ported from src/lib/components/BannerSection.svelte
	   Image layers removed; solid colours only.
	   ================================================================== */
	.cp-hero {
		--green-dark: #1f3d24;
		--green: #2e5d34;
		--meat-red: #8c3a2b;
		--herb-purple: #5b3a86;
		--bev-orange: #e0902f;
		--cream: #fbfaf6;
		--text-muted: #4a4a45;
		--shadow-card: 0 18px 40px rgba(20, 40, 20, 0.18);

		position: relative;
		display: flex;
		align-items: stretch;
		min-height: 100vh;
		overflow: hidden;
		font-family: var(--font-sans);
		/* solid colour base so the grid overlay above stays visible */
		background: var(--color-pine-dark);
	}

	.leaf-decor.right {
		position: absolute;
		top: 0;
		right: 0;
		width: 140px;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(10, 22, 10, 0.55));
		z-index: 3;
		pointer-events: none;
	}

	.content-row {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 1500px;
		margin: 0 auto;
		display: grid;
		/* two columns: left = copy, right = category cards */
		grid-template-columns: 1fr 1fr;
		gap: clamp(20px, 3vw, 40px);
		padding: clamp(16px, 3vh, 40px) clamp(20px, 4vw, 50px);
		/* top-align both columns so they start on the same row */
		align-items: start;
	}

	.left-col {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-bottom: clamp(60px, 12vh, 120px);
		position: relative;
	}

	.eyebrow {
		margin-top: 1.25rem;
		font-weight: 700;
		font-size: clamp(1.2rem, 2vw, 1.7rem);
		color: var(--cream);
		letter-spacing: 0.5px;
		text-shadow: 0 2px 10px rgba(249, 225, 3, 0.35);
	}

	.headline-script {
		font-family: var(--font-serif);
		font-weight: 700;
		font-size: clamp(1.6rem, 2.8vw, 2.2rem);
		line-height: 0.95;
		color: var(--cream);
		margin: -4px 0 10px -3px;
		text-shadow: 0 4px 18px rgba(20, 50, 20, 0.2);
	}

	.divider-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 4px 0 14px;
	}
	.divider-row .line {
		height: 2px;
		width: 50px;
		background: var(--cream);
		opacity: 0.6;
	}
	.divider-row .leaf-icon {
		display: flex;
		width: 1rem;
		color: #a8e6a1;
	}
	.divider-row .leaf-icon svg {
		width: 100%;
		height: auto;
	}

	.tagline {
		font-size: clamp(0.85rem, 1.2vw, 1rem);
		line-height: 1.55;
		color: var(--cream);
		font-weight: 500;
		margin: 0;
		text-shadow: 0 1px 6px rgba(255, 255, 255, 0.25);
	}
	/* The tagline body comes from the CMS through {@html}, so those selectors
	   must be :global() — the injected markup carries no scope class. */
	.tagline :global(strong) {
		display: block;
		margin-bottom: 0.35rem;
		font-weight: 700;
	}
	.tagline :global(p + p) {
		margin-top: 0.6rem;
	}

	.badge {
		margin-top: 18px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		width: fit-content;
		background: var(--green-dark);
		color: var(--cream);
		font-weight: 600;
		letter-spacing: 1.2px;
		font-size: 0.72rem;
		padding: 9px 20px;
		border-radius: 30px;
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
	}
	.badge svg {
		width: 14px;
		height: 14px;
		fill: #a8e6a1;
		flex-shrink: 0;
	}

	.hero-btn {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		padding: 12px 24px;
		border-radius: 30px;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		text-decoration: none;
		transition:
			transform 0.25s ease,
			background-color 0.25s ease,
			box-shadow 0.25s ease;
	}
	.hero-btn svg {
		width: 15px;
		height: 15px;
		flex-shrink: 0;
	}
	.hero-btn--solid {
		background: #e9c53a;
		color: #1f3d24;
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
	}
	.hero-btn--solid:hover {
		transform: translateY(-2px);
		background: #f5d968;
	}
	.hero-btn--ghost {
		border: 2px solid rgba(251, 250, 246, 0.7);
		color: var(--cream);
	}
	.hero-btn--ghost:hover {
		transform: translateY(-2px);
		background: rgba(251, 250, 246, 0.15);
	}

	/* ---------- CARD GRID ---------- */
	.right-col {
		position: relative;
		z-index: 2;
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(2, min(250px, 40vw));
		grid-auto-rows: min(250px, 40vw);
		gap: clamp(12px, 1.6vw, 22px);
		position: relative;
		z-index: 2;
		justify-content: center;
		margin: 0 auto;
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		text-decoration: none;
		color: inherit;
		/* solid colour only — the original layered a photo under this */
		background-color: var(--cream);
		border-radius: 5px;
		box-shadow: var(--shadow-card);
		padding: clamp(10px, 1.4vw, 18px) clamp(10px, 1.4vw, 16px);
		overflow: hidden;
		border-bottom: 5px solid var(--accent);
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
		width: 100%;
		height: 100%;
		animation: cp-card-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}

	@keyframes cp-card-in {
		from {
			opacity: 0;
			transform: translateY(24px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.card:hover {
		transform: translateY(-4px);
		box-shadow: 0 26px 50px rgba(20, 40, 20, 0.25);
	}

	.icon-circle {
		width: clamp(32px, 4vw, 46px);
		height: clamp(32px, 4vw, 46px);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8px;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.18);
		background: var(--accent);
		flex-shrink: 0;
	}
	.icon-circle svg {
		width: 55%;
		height: 55%;
	}

	.card h3 {
		font-size: clamp(0.78rem, 1.3vw, 1.05rem);
		font-weight: 800;
		letter-spacing: 0.4px;
		margin: 0 0 4px;
		color: var(--accent-text);
	}

	.card .mini-line {
		width: 28px;
		height: 2px;
		background: var(--accent-text);
		opacity: 0.5;
		margin-bottom: 6px;
		flex-shrink: 0;
	}

	.card p.sub {
		font-size: clamp(0.62rem, 0.9vw, 0.8rem);
		color: var(--text-muted);
		margin: 0;
		font-weight: 500;
		/* clamp long API descriptions so cards keep their square shape */
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.view-all {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 9px 22px;
		border-radius: 30px;
		border: 1px solid rgba(251, 250, 246, 0.55);
		color: var(--cream);
		font-family: var(--font-mono);
		font-size: 0.64rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		text-decoration: none;
		transition:
			background-color 0.25s ease,
			color 0.25s ease;
	}
	.view-all:hover {
		background: var(--cream);
		color: var(--green-dark);
	}

	@media (max-width: 1000px) {
		.cp-hero {
			height: auto;
			min-height: 100vh;
			/* stays hidden so the 720px decorative glow cannot force
			   horizontal overflow on narrow viewports */
			overflow: hidden;
		}
		.content-row {
			grid-template-columns: 1fr;
			padding: 40px 24px;
		}
		.left-col {
			padding-bottom: 40px;
			align-items: center;
			text-align: center;
		}
		.divider-row {
			justify-content: center;
		}
		.card-grid {
			grid-template-columns: repeat(2, min(250px, 42vw));
			grid-auto-rows: min(250px, 42vw);
			gap: 10px;
		}
		.card {
			padding: 10px 8px;
		}
		.leaf-decor.right {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			animation: none;
			transition: none;
		}
	}

	/* ==================================================================
	   COMPANY STORY — TIMELINE
	   ================================================================== */
	.story-list {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: clamp(18px, 2.4vw, 30px);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* the spine */
	.story-list::before {
		content: '';
		position: absolute;
		top: 14px;
		bottom: 14px;
		left: 11px;
		width: 2px;
		background: linear-gradient(
			to bottom,
			transparent,
			var(--color-pine) 7%,
			var(--color-pine) 93%,
			transparent
		);
		opacity: 0.3;
	}

	.story-item {
		position: relative;
		display: grid;
		padding-left: 52px;
	}

	.story-dot {
		position: absolute;
		top: 20px;
		left: 0;
		display: flex;
		width: 24px;
		height: 24px;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--color-afcrc-yellow);
		border-radius: 999px;
		background: var(--color-paper-white);
		box-shadow: 0 0 0 5px rgba(239, 199, 47, 0.16);
	}
	.story-dot span {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: var(--color-pine);
	}

	.story-card {
		border: 1px solid var(--color-line);
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.82);
		padding: 22px 26px;
		box-shadow: 0 18px 40px -32px rgba(23, 83, 58, 0.55);
		transition:
			transform 0.35s ease,
			box-shadow 0.35s ease;
	}

	.story-year {
		display: inline-block;
		margin-bottom: 10px;
		border-radius: 999px;
		background: var(--color-pine);
		padding: 4px 12px;
		font-size: 0.64rem;
		letter-spacing: 0.18em;
		color: var(--color-paper-white);
	}

	.story-media {
		margin-top: 16px;
		height: 190px;
		width: 100%;
		border-radius: 14px;
		object-fit: cover;
	}

	@media (min-width: 640px) {
		.story-item:hover .story-card {
			transform: translateY(-3px);
			box-shadow: 0 26px 50px -30px rgba(23, 83, 58, 0.6);
		}
	}

	/* desktop: spine down the centre, cards alternate sides */
	@media (min-width: 1024px) {
		.story-list {
			gap: clamp(30px, 4vw, 48px);
		}
		.story-list::before {
			left: 50%;
			transform: translateX(-1px);
		}
		.story-item {
			grid-template-columns: 1fr 1fr;
			column-gap: 64px;
			padding-left: 0;
		}
		.story-dot {
			left: 50%;
			transform: translateX(-50%);
		}
		.story-item:nth-child(odd) .story-card,
		.story-item:nth-child(odd) .story-media {
			grid-column: 1;
			justify-self: end;
			text-align: right;
		}
		.story-item:nth-child(even) .story-card,
		.story-item:nth-child(even) .story-media {
			grid-column: 2;
		}
		.story-item:nth-child(odd) .story-media {
			order: -1;
		}
		.story-item:nth-child(odd) .story-year {
			margin-left: auto;
		}
	}

	/* ==================================================================
	   REST OF PAGE
	   ================================================================== */
	:global(.cp-reveal) {
		opacity: 0;
		transform: translateY(26px);
		transition:
			opacity 0.75s ease var(--reveal-delay, 0ms),
			transform 0.75s cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay, 0ms);
	}

	:global(.cp-reveal-in) {
		opacity: 1;
		transform: none;
	}

	.research-card:hover .research-arrow {
		background-color: var(--color-afcrc-lime);
		border-color: var(--color-afcrc-lime);
		color: #fff;
	}

	.approach-step:not(:last-child) .approach-rail::after {
		content: '';
		position: absolute;
		background-image: linear-gradient(
			to bottom,
			var(--color-afcrc-yellow) 0 4px,
			transparent 4px 9px
		);
		background-size: 2px 9px;
		opacity: 0.4;
	}

	/* mobile: vertical connector below each node */
	@media (max-width: 1023px) {
		.approach-step:not(:last-child) .approach-rail::after {
			top: 3.25rem;
			bottom: -2.25rem;
			left: 50%;
			width: 2px;
			height: auto;
			transform: translateX(-50%);
			background-image: linear-gradient(
				to bottom,
				var(--color-afcrc-yellow) 0 4px,
				transparent 4px 9px
			);
			background-size: 2px 9px;
		}
	}

	/* desktop: horizontal connector between nodes */
	@media (min-width: 1024px) {
		.approach-step:not(:last-child) .approach-rail::after {
			top: 1.5rem;
			left: calc(50% + 2rem);
			width: calc(100% - 4rem);
			height: 2px;
			background-image: linear-gradient(
				to right,
				var(--color-afcrc-yellow) 0 4px,
				transparent 4px 9px
			);
			background-size: 9px 2px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.cp-reveal) {
			opacity: 1;
			transform: none;
		}
	}
</style>
