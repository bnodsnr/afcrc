<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import type { ComponentData, ComponentsData } from '$lib/api/types';

	let {
		ourProcess,
		aboutUs,
		companystat
	}: { ourProcess?: ComponentsData; aboutUs?: ComponentsData; companystat?: any[] } = $props();

	// ---- About Us, driven by the "introduction" page components ----
	// The parent row carries the heading and the lead paragraph; the rows parented
	// to it are the bullet features. When the API returns nothing the static copy is
	// used so the section never renders empty.
	const ABOUT_FALLBACK = {
		name: 'Agricultural & Forest Conservation Research Centre',
		page_content:
			'AFCRC is an International Agriculture company. Since 2013, this company has been actively operating in Nepal and Australia. In order to promote sustainable agriculture farming and transfer of knowledge and skills to the Nepalese Farmers from Australia, we established a mega farming project “AFCRC”',
		features: [
			{
				id: -1,
				name: 'Hi-Tech Nursery',
				page_content: 'Established hi-tech nursery in Nawalparasi & Butwal.'
			},
			{
				id: -2,
				name: 'Tissue Culture Laboratory',
				page_content: 'Running one of the biggest tissue culture labs.'
			},
			{ id: -3, name: 'Fish Nursery', page_content: 'One of the biggest fish nurseries in Nepal.' }
		] as Pick<ComponentData, 'id' | 'name' | 'page_content' | 'featured_image'>[]
	};

	// page_content is CMS-authored HTML, so strip anything executable before rendering.
	function safeHtml(value: string | null | undefined): string {
		if (!value) return '';
		return value
			.replace(/<\s*(script|style|iframe|object|embed)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
			.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
			.replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '');
	}

	// Fallback glyphs, cycled by index when a component has no featured_image.
	const FEATURE_ICONS = [
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 7 8 4 4 4c0 5 3 8 8 8z"/><path d="M12 12c0-5 4-8 8-8 0 5-3 8-8 8z"/></svg>',
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.5a2 2 0 0 1-.2.9L4.7 20.6a1 1 0 0 0 .9 1.4h12.8a1 1 0 0 0 .9-1.4L14.2 10.4a2 2 0 0 1-.2-.9V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>',
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12c2.5-3.5 7-5 11-3.5 2 .8 3.5 2 4.5 3.5-1 1.5-2.5 2.7-4.5 3.5-4 1.5-8.5 0-11-3.5Z"/><path d="M6 12 2.5 8.5v7L6 12Z"/><circle cx="16" cy="11" r="0.5"/></svg>'
	];

	let components = $derived(aboutUs ?? []);
	let aboutParent = $derived(components[0]);

	// The CMS body is the source of truth for the About Us heading and copy, so it
	// is rendered as-is. Only when the row carries no content do we fall back to
	// the static copy, which keeps the section populated if the API is empty.
	let aboutContent = $derived(
		safeHtml(aboutParent?.page_content) ||
			`<h1>${ABOUT_FALLBACK.name}</h1><p>${ABOUT_FALLBACK.page_content}</p>`
	);

	let aboutFeatures = $derived.by(() => {
		const features = aboutParent?.children ?? [];
		return features.length ? features : ABOUT_FALLBACK.features;
	});

	// Truncate long feature copy to ~100 words behind an "Explore more" toggle.
	const WORD_LIMIT = 50;
	let expanded = $state(new Set<number>());

	function wordCount(text: string): number {
		return text.trim() ? text.trim().split(/\s+/).length : 0;
	}

	function truncated(text: string, limit: number): string {
		return text.trim().split(/\s+/).slice(0, limit).join(' ') + '…';
	}

	function toggleFeature(id: number) {
		const next = new Set(expanded);
		next.has(id) ? next.delete(id) : next.add(id);
		expanded = next;
	}

	// The "Our Process" menu itself (the parent) drives the label, its children the stages.
	let processMenu = $derived(ourProcess?.[0]);

	// Every child of the "Our Process" menu becomes one branch leaving the origin
	// node: a connector, a runner travelling along it and a card at its tip.
	// Slots are reused when there are more children than branches.
	const BRANCHES = [
		{
			color: '#E8A93B',
			theme: 'c-gold',
			path: 'M 210 195 C 165 175, 120 150, 88 118',
			position: 'left: 2%; top: 16%;'
		},
		{
			color: '#3FA0C4',
			theme: 'c-teal',
			path: 'M 210 195 C 210 250, 210 300, 210 345',
			position: 'left: 50%; top: 60%; transform: translateX(-50%);'
		},
		{
			color: '#7CAA45',
			theme: 'c-meadow',
			path: 'M 210 195 C 255 175, 300 150, 332 118',
			position: 'right: 2%; top: 16%;'
		}
	];

	let stages = $derived(
		(processMenu?.children ?? []).map((child, index) => ({
			...child,
			number: String(index + 1).padStart(2, '0'),
			branch: BRANCHES[index % BRANCHES.length]
		}))
	);

	// ---- Stats bar, driven by the company stats endpoint ----
	// Each keystat supplies title, slogan and count_number; icons are cycled
	// by index. When the API returns nothing the static copy is used so the
	// bar never renders empty.
	const STATS_FALLBACK = [
		{
			title: 'Happy Customers',
			value: '1K+',
			slogan: 'Trusted by thousands of customers worldwide.'
		},
		{ title: 'Products', value: '5K+', slogan: 'A wide range of quality products for you.' },
		{
			title: 'Satisfaction',
			value: '9%',
			slogan: "We're proud to deliver the best experience possible."
		},
		{ title: 'Support', value: '24/7', slogan: 'Our support team is always here to help you.' }
	];

	const STAT_ICONS = [
		'<svg viewBox="0 0 24 24" stroke-width="1.6"><circle cx="12" cy="8" r="5" /><path d="M8.5 12.5 7 22l5-3 5 3-1.5-9.5" /></svg>',
		'<svg viewBox="0 0 24 24" stroke-width="1.6"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></svg>',
		'<svg viewBox="0 0 24 24" stroke-width="1.6"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></svg>',
		'<svg viewBox="0 0 24 24" stroke-width="1.6"><path d="M3 12a9 9 0 0 1 18 0" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" /></svg>'
	];

	function formatCount(value: number | string): string {
		const num = Number(value);
		if (Number.isNaN(num)) return String(value ?? '');
		return num.toLocaleString('en-US');
	}

	let stats = $derived.by(() => {
		if (companystat && Array.isArray(companystat) && companystat.length) {
			return companystat.map((s, i) => ({
				id: s.id ?? `stat-${i}`,
				value: formatCount(s.count_number),
				title: s.title || '',
				slogan: s.slogan || '',
				icon: STAT_ICONS[i % STAT_ICONS.length]
			}));
		}
		return STATS_FALLBACK.map((s, i) => ({
			id: `stat-${i}`,
			...s,
			icon: STAT_ICONS[i % STAT_ICONS.length]
		}));
	});

	let root: HTMLElement | undefined = $state();

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		if (!root) return;

		// Scoped to THIS component only — its own animation set,
		// completely separate from the pipeline visual.
		const ctx = gsap.context(() => {
			const tl = gsap.timeline({
				scrollTrigger: { trigger: '.top', start: 'top 80%' }
			});

			tl.from('.eyebrow', { opacity: 0, y: 18, duration: 0.5, ease: 'power2.out' })
				.from(
					'.eyebrow-line',
					{ scaleX: 0, transformOrigin: 'left center', duration: 0.4 },
					'-=0.2'
				)

				// features slide in from the left
				.from(
					'.feature',
					{ opacity: 0, x: -30, duration: 0.55, stagger: 0.12, ease: 'power2.out' },
					'-=0.3'
				);

			// Embedded pipeline visual — its own distinct animation set,
			// scoped to this component so it can't touch Pipeline.svelte's copy
			const vtl = gsap.timeline({
				scrollTrigger: { trigger: '.pipeline-visual', start: 'top 80%' }
			});

			vtl
				.from('.pipeline-visual', { opacity: 0, y: 30, duration: 0.7, ease: 'power2.out' })
				.from(
					'.ring',
					{
						opacity: 0,
						scale: 0.55,
						rotation: 45,
						transformOrigin: '50% 50%',
						duration: 0.8,
						stagger: 0.12,
						ease: 'back.out(1.4)'
					},
					'-=0.3'
				)
				.from('.connector', { opacity: 0, duration: 0.5, stagger: 0.15 }, '-=0.5')
				.from(
					'.origin-dot, .origin-pulse',
					{ opacity: 0, scale: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(2)' },
					'-=0.25'
				)
				.from('.pipeline-visual .badge', { opacity: 0, y: -14, duration: 0.45 }, '-=0.2')
				.from('.c-gold', { opacity: 0, x: -46, duration: 0.5, ease: 'power3.out' }, '-=0.2')
				.from('.c-meadow', { opacity: 0, x: 46, duration: 0.5, ease: 'power3.out' }, '-=0.35')
				.from('.c-teal', { opacity: 0, y: 46, duration: 0.5, ease: 'power3.out' }, '-=0.35');

			// stats count-up bar
			gsap.from('.stats .stat', {
				opacity: 0,
				y: 26,
				duration: 0.55,
				stagger: 0.1,
				ease: 'power2.out',
				scrollTrigger: { trigger: '.stats', start: 'top 88%' }
			});
		}, root);

		return () => ctx.revert();
	});
</script>

<section
	class="intro"
	bind:this={root}
	style="background: radial-gradient(circle at 5% 10%, rgba(149, 196, 172, 0.38) 0%, transparent 30%), radial-gradient(circle at 95% 5%, rgba(204, 176, 232, 0.32) 0%, transparent 30%), radial-gradient(circle at 90% 85%, rgba(74, 144, 226, 0.20) 0%, transparent 32%), radial-gradient(circle at 15% 90%, rgba(244, 205, 66, 0.20) 0%, transparent 30%), radial-gradient(circle at 50% 50%, rgba(105, 177, 123, 0.08) 0%, transparent 45%), linear-gradient(135deg, #ffffff 0%, #f8faf9 45%, #faf8fc 100%);
    background-repeat: repeat, repeat, repeat, repeat, repeat, repeat;
  background-repeat: no-repeat !important;"
>
	<div class="wrapper">
		<!-- ---- Top section ---- -->
		<div class="top">
			<div class="about-us">
				<div class="about-body">
					{@html aboutContent}
				</div>

				<a class="about-learn-more" href="/about">
					Learn more
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg
					>
				</a>
			</div>

			<!-- ---- Image collage ---- -->
			<div class="collage bg-pine-dark">
				<div class="collage-head">
					<div class="collage-eyebrow">How we work</div>
					<div class="collage-rule"></div>
					<h2>Our Process</h2>
				</div>

				<div class="pipeline-visual relative">
					<svg viewBox="0 0 420 480" fill="none" class="h-full w-full" style="overflow: visible;">
						<defs>
							<radialGradient id="intro-connector-glow" cx="50%" cy="50%" r="50%">
								<stop offset="0%" stop-color="rgba(232,169,59,0.06)" />
								<stop offset="100%" stop-color="rgba(232,169,59,0)" />
							</radialGradient>
						</defs>

						<circle cx="210" cy="195" r="230" fill="url(#intro-connector-glow)" />
						<circle class="ring ring-gold" cx="210" cy="195" r="195" />
						<circle class="ring ring-teal" cx="210" cy="195" r="160" />
						<circle class="ring ring-meadow" cx="210" cy="195" r="125" />

						<!-- one branch per child of the Our Process menu -->
						{#each stages as stage (stage.id)}
							<path
								id="intro-branch-{stage.id}"
								class="connector"
								d={stage.branch.path}
								stroke={stage.branch.color}
								stroke-width="1.6"
								stroke-dasharray="5 7"
								stroke-linecap="round"
								fill="none"
								opacity="0.9"
							/>
						{/each}

						<circle
							class="origin-pulse"
							cx="210"
							cy="195"
							r="5"
							fill="none"
							stroke="#E8A93B"
							stroke-width="1.3"
						/>
						<circle
							class="origin-dot"
							cx="210"
							cy="195"
							r="4"
							fill="#E8A93B"
							filter="drop-shadow(0 0 8px #E8A93B)"
						/>

						{#each stages as stage, index (stage.id)}
							<g class="runner" style="color: {stage.branch.color};">
								<circle r="2.4" fill={stage.branch.color}>
									<animateMotion
										dur="{4.5 + index * 0.7}s"
										repeatCount="indefinite"
										path={stage.branch.path}
									/>
								</circle>
							</g>
						{/each}
					</svg>

					<div class="badge-pos" style="left: 40%; top: 39.6%;">
						<div class="badge">
							<span class="dot"></span>
							<span>{processMenu?.name?.toUpperCase() ?? 'OUR PROCESS'}</span>
						</div>
					</div>

					{#each stages as stage (stage.id)}
						<div class="card-pos" style={stage.branch.position}>
							<div class="card {stage.branch.theme}">
								<div class="num">{stage.number}</div>
								<div>
									<h3>{stage.name}</h3>
									<span>STAGE {stage.number}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- ---- Stats bar ---- -->
		<div class="stats bg-pine-dark">
			{#each stats as stat (stat.id)}
				<div class="stat">
					<div class="stat-icon">
						{@html stat.icon}
					</div>
					<div>
						<h2>{stat.value}</h2>
						<h4>{stat.title}</h4>
						<p>{stat.slogan}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.intro {
		--cream: #faf9f6;
		--ink: #1c1c1a;
		--olive: #5c6b47;
		--olive-dark: #3f4a32;
		--gray: #6b6b66;
		--line: #e7e5df;
		--card-bg: #ffffff;

		font-family: 'Helvetica Neue', Arial, sans-serif;
		background: var(--cream);
		color: var(--ink);
		padding: 60px 80px;
	}
	.intro * {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}
	.wrapper {
		max-width: 1400px;
		margin: 0 auto;
	}

	/* ---- Top section ---- */
	.top {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 40px;
		align-items: start;
	}

	.eyebrow {
		color: var(--olive);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 1.5px;
		margin-bottom: 14px;
	}
	.eyebrow-line {
		width: 36px;
		height: 3px;
		background: var(--olive);
		margin-bottom: 22px;
	}
	.lead {
		font-size: 16px;
		color: var(--gray);
		line-height: 1.6;
		max-width: 480px;
		margin-bottom: 36px;
	}

	.feature {
		display: flex;
		gap: 18px;
		margin-bottom: 26px;
	}
	.feature-icon {
		flex: 0 0 52px;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: #eef0e9;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	/* Markup injected through {@html} carries no scope class, so these must be global. */
	.feature-icon :global(svg) {
		width: 22px;
		height: 22px;
		stroke: var(--ink);
	}
	.feature-icon img {
		width: 30px;
		height: 30px;
		object-fit: contain;
		border-radius: 50%;
	}
	.lead :global(p) {
		margin: 0;
	}
	.lead :global(p + p) {
		margin-top: 10px;
	}
	.feature h3 {
		font-size: 16px;
		font-weight: 700;
		margin-bottom: 6px;
	}
	.feature p {
		font-size: 14px;
		color: var(--gray);
		line-height: 1.5;
		max-width: 380px;
	}
	.feature-more {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		padding: 0;
		border: none;
		background: none;
		font-size: 13px;
		font-weight: 700;
		color: var(--about-green);
		cursor: pointer;
		transition: opacity 0.2s ease;
	}
	.feature-more:hover {
		opacity: 0.7;
	}
	.feature-more::after {
		content: '';
		width: 18px;
		height: 1.5px;
		background: currentColor;
		transition: width 0.2s ease;
	}
	.feature-more:hover::after {
		width: 26px;
	}

	/* ---- About Us: Tiptap-authored HTML rendered through {@html} ----
	   Every selector below is :global() because {@html} content is injected
	   without a Svelte scope class, so scoped rules would never match it. */
	/* Light-mode `--about-*` tokens now live in layout.css :root; this class can
	   still redeclare any of them to override colors for just this component. */
	.about-us {
		position: relative;
	}

	.about-learn-more {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin-top: 22px;
		padding: 12px 24px;
		border-radius: 999px;
		/* border: 1px solid var(--about-green); */
		background: linear-gradient(135deg, #f5c518 0%, #ffd84d 100%);
		color: #fff;
		font-size: 14px;
		font-weight: 700;
		text-decoration: none;
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}
	.about-learn-more svg {
		width: 16px;
		height: 16px;
		transition: transform 0.2s ease;
	}
	.about-learn-more:hover {
		background: transparent;
		color: var(--about-green);
		transform: translateY(-1px);
	}
	.about-learn-more:hover svg {
		transform: translateX(3px);
	}

	.about-body :global(h1) {
		position: relative;
		font-size: clamp(30px, 4vw, 44px);
		font-weight: 800;
		line-height: 1.15;
		letter-spacing: -0.015em;
		text-align: justify;
		text-wrap: balance;
		color: #17533a;
		margin: 0 0 18px;
		padding-bottom: 14px;
	}

	/* Short yellow underline accent beneath the heading. */
	.about-body :global(h1::after) {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		width: 64px;
		height: 4px;
		border-radius: 999px;
		/* background: var(--about-yellow); */
	}

	.about-body :global(p) {
		font-size: 16px;
		line-height: 1.75;
		/* color: var(--about-muted); */
		margin: 0 0 16px;
	}

	/* Tiptap emits <p style="text-align: justify">; keep the author's alignment. */
	.about-body :global(h1[style*='center']),
	.about-body :global(h1[style*='right']) {
		margin-inline: auto;
	}
	.about-body :global(h1[style*='center']::after) {
		left: 50%;
		transform: translateX(-50%);
	}

	/* Tiptap leaves empty paragraphs as spacing placeholders. */
	.about-body :global(p:empty) {
		display: none;
	}

	.about-body :global(a) {
		color: var(--about-blue);
		text-decoration: underline;
		text-decoration-color: rgba(16, 127, 184, 0.35);
		text-underline-offset: 3px;
		transition:
			color 0.2s ease,
			text-decoration-color 0.2s ease;
	}
	.about-body :global(a:hover) {
		color: var(--about-green);
		text-decoration-color: var(--about-yellow);
	}

	.about-body :global(ul),
	.about-body :global(ol) {
		margin: 0 0 18px;
		padding-left: 22px;
		font-size: 15.5px;
		line-height: 1.7;
		color: var(--about-muted);
	}
	.about-body :global(li) {
		margin-bottom: 8px;
	}
	.about-body :global(li::marker) {
		color: var(--about-yellow);
		font-weight: 700;
	}

	.about-body :global(blockquote) {
		margin: 0 0 18px;
		padding: 14px 20px;
		border-left: 3px solid var(--about-yellow);
		border-radius: 0 8px 8px 0;
		background: rgba(239, 199, 47, 0.08);
		color: var(--about-text);
		font-style: italic;
	}
	.about-body :global(blockquote p:last-child) {
		margin-bottom: 0;
	}

	.about-body :global(strong) {
		color: var(--about-green);
		font-weight: 700;
	}
	.about-body :global(h2) {
		font-size: 24px;
		font-weight: 700;
		line-height: 1.3;
		color: var(--about-green);
		margin: 26px 0 12px;
	}
	.about-body :global(h3) {
		font-size: 19px;
		font-weight: 700;
		line-height: 1.35;
		color: var(--about-green);
		margin: 22px 0 10px;
	}
	.about-body :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 12px;
	}

	/* Subtle green/yellow/blue grid, faded out so it never competes with the copy. */
	.about-us::before {
		/* content: '';
		position: absolute;
		inset: -6% -8% auto;
		height: 62%;
		pointer-events: none; */
		/* background-image:
			linear-gradient(var(--about-grid-line) 1px, transparent 1px),
			linear-gradient(90deg, rgba(239, 199, 47, 0.1) 1px, transparent 1px),
			linear-gradient(90deg, rgba(16, 127, 184, 0.07) 1px, transparent 1px);
		background-size:
			34px 34px,
			34px 34px,
			34px 34px;
		mask-image: radial-gradient(ellipse 70% 75% at 25% 30%, #000 20%, transparent 75%);
		-webkit-mask-image: radial-gradient(ellipse 70% 75% at 25% 30%, #000 20%, transparent 75%); */
		/* z-index: 0; */
	}
	.about-us > * {
		position: relative;
		z-index: 1;
	}

	/* Dark-mode `--about-*` tokens now live in layout.css too; the only
	   component-specific dark tweaks left are the link/quote decorations. */
	@media (prefers-color-scheme: dark) {
		.about-body :global(a) {
			text-decoration-color: rgba(111, 192, 234, 0.4);
		}
		.about-body :global(blockquote) {
			background: rgba(243, 210, 78, 0.1);
		}
	}

	/* ---- Image collage: hosts the embedded pipeline visual, centered ---- */
	.collage {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 14px;
		width: 100%;
		max-width: 560px;
		justify-self: end;
		height: 740px;

		border-radius: 10px;
		border: 1px solid rgba(232, 169, 59, 0.28);
		box-shadow:
			0 0 0 1px rgba(232, 169, 59, 0.1),
			0 22px 60px -28px rgba(232, 169, 59, 0.45),
			inset 0 1px 0 rgba(232, 169, 59, 0.14);
		overflow: hidden;
	}

	/* The grid lives on a pseudo-element so the mask fades the texture only,
	   never the diagram or the cards sitting inside the collage. */
	.collage::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(232, 169, 59, 0.14) 1px, transparent 1px),
			linear-gradient(90deg, rgba(126, 170, 69, 0.12) 1px, transparent 1px),
			radial-gradient(ellipse 60% 50% at 50% 40%, rgba(63, 160, 196, 0.1), transparent 70%);
		background-size:
			15px 15px,
			15px 15px,
			100% 100%;
		mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%);
		-webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%);
		pointer-events: none;
	}

	.collage-head {
		position: relative;
		text-align: center;
	}
	.collage-eyebrow {
		color: rgba(232, 169, 59, 0.9);
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 2.5px;
		text-transform: uppercase;
		margin-bottom: 10px;
	}
	.collage-rule {
		width: 44px;
		height: 2px;
		background: #e8a93b;
		margin: 0 auto 12px;
	}
	.collage-head h2 {
		color: #fbe9ba;
		font-size: 30px;
		font-weight: 800;
		letter-spacing: -0.01em;
		line-height: 1.2;
	}

	.collage .pipeline-visual {
		position: relative;
		width: min(100%, 520px);
		height: min(100%, 620px);
	}

	.badge {
		position: absolute;
		left: 56%;
		bottom: 14%;
		background: var(--olive-dark);
		color: #fff;
		padding: 22px 24px;
		border-radius: 16px;
		width: 210px;
		text-align: center;
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
	}

	/* ---- Stats bar ---- */
	.stats {
		margin-top: 56px;
		background:
			radial-gradient(circle at 15% 20%, #2f7a3b 0%, transparent 35%),
			radial-gradient(circle at 85% 15%, #8cc63f 0%, transparent 35%),
			linear-gradient(135deg, #f5c518 0%, #2f7a3b 50%, #2b8fd6 100%);
		border-radius: 10px;
		padding: 38px 50px;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
	}
	.stat {
		display: flex;
		gap: 16px;
		padding: 0 20px;
		border-right: 1px solid var(--line);
	}
	.stats::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(232, 169, 59, 0.14) 1px, transparent 1px),
			linear-gradient(90deg, rgba(126, 170, 69, 0.12) 1px, transparent 1px),
			radial-gradient(ellipse 60% 50% at 50% 40%, rgba(63, 160, 196, 0.1), transparent 70%);
		background-size:
			15px 15px,
			15px 15px,
			100% 100%;
		mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%);
		-webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%);
		pointer-events: none;
	}
	.stat:last-child {
		border-right: none;
	}
	.stat-icon :global(svg) {
		width: 34px;
		height: 34px;
		stroke: #fff;
		fill: none;
	}
	.stat h2 {
		font-size: 26px;
		font-weight: 800;
		margin-bottom: 4px;
		color: #fff;
	}
	.stat h4 {
		font-size: 14px;
		font-weight: 700;
		margin-bottom: 4px;
		color: #fff;
	}
	.stat p {
		font-size: 12.5px;
		color: #fff;
		line-height: 1.45;
		max-width: 180px;
	}

	@media (max-width: 1000px) {
		.intro {
			padding: 32px 20px;
		}
		.top {
			grid-template-columns: 1fr;
		}
		.collage {
			height: auto;
			min-height: 480px;
			padding: 28px 0 20px;
			justify-self: center;
		}
		.collage .pipeline-visual {
			height: 440px;
		}
		.collage-head h2 {
			font-size: 25px;
		}
		.stats {
			grid-template-columns: 1fr 1fr;
		}
		.stat {
			border-right: none;
			border-bottom: 1px solid var(--line);
			padding-bottom: 16px;
		}
	}

	.pipeline-visual .ring {
		fill: none;
		stroke-width: 4px;
		stroke-linecap: round;
	}
	.pipeline-visual .ring-gold {
		stroke: #e8a93b;
		opacity: 0.95;
		stroke-dasharray: 10 16;
	}
	.pipeline-visual .ring-teal {
		stroke: #3fa0c4;
		opacity: 0.95;
		stroke-dasharray: 6 12;
	}
	.pipeline-visual .ring-meadow {
		stroke: #7caa45;
		opacity: 0.95;
		stroke-dasharray: 4 10;
	}

	.pipeline-visual .origin-pulse {
		animation: expand 2.8s ease-out infinite;
		transform-origin: center;
	}
	@keyframes expand {
		0% {
			r: 5;
			opacity: 0.7;
		}
		100% {
			r: 32;
			opacity: 0;
		}
	}

	.pipeline-visual .runner circle {
		animation: pulse-runner 2.6s ease-in-out infinite;
	}
	@keyframes pulse-runner {
		0%,
		100% {
			r: 2.4;
			opacity: 0.55;
		}
		50% {
			r: 3.4;
			opacity: 1;
		}
	}

	.pipeline-visual .card-pos {
		position: absolute;
	}

	.pipeline-visual .card {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 18px 14px 14px;
		border-radius: 14px;
		border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
		background:
			radial-gradient(
				160% 160% at 0% 0%,
				color-mix(in srgb, var(--accent) 42%, transparent),
				transparent 55%
			),
			linear-gradient(
				140deg,
				color-mix(in srgb, var(--accent) 34%, #0d1a14),
				color-mix(in srgb, var(--accent) 12%, #0d1a14)
			);
		box-shadow: 0 12px 30px -14px var(--accent-glow);
		backdrop-filter: blur(14px);
		white-space: nowrap;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease,
			border-color 0.3s ease;
	}
	.pipeline-visual .card:hover {
		transform: translateY(-3px);
		border-color: color-mix(in srgb, var(--accent) 85%, white);
		box-shadow: 0 18px 42px -16px var(--accent-glow);
	}
	.pipeline-visual .card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		border-radius: 14px 0 0 14px;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--accent) 90%, white),
			var(--accent)
		);
	}

	.pipeline-visual .num {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 9px;
		font-family: 'JetBrains Mono', monospace;
		font-weight: 600;
		font-size: 0.78rem;
		color: #0d1a14;
		background: var(--accent);
		box-shadow: 0 6px 16px -6px var(--accent-glow);
		flex-shrink: 0;
	}

	.pipeline-visual .card h3 {
		margin: 0;
		font-family: 'Fraunces', serif;
		font-weight: 500;
		font-size: 0.98rem;
		color: #f4f1e8;
		line-height: 1.15;
	}
	.pipeline-visual .card span {
		display: block;
		margin-top: 2px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.6rem;
		letter-spacing: 0.16em;
		color: rgba(244, 241, 232, 0.62);
	}

	.pipeline-visual .c-gold {
		--accent: #e8a93b;
		--accent-glow: rgba(232, 169, 59, 0.4);
	}
	.pipeline-visual .c-teal {
		--accent: #3fa0c4;
		--accent-glow: rgba(63, 160, 196, 0.4);
	}
	.pipeline-visual .c-meadow {
		--accent: #7caa45;
		--accent-glow: rgba(124, 170, 69, 0.4);
	}

	/* wrapper pins the badge to the exact center of the concentric rings
	   (cx 210/420 = 50%, cy 195/480 = 40.6%) — GSAP animates the inner pill */
	.pipeline-visual .badge-pos {
		position: absolute;
		transform: translate(-50%, -50%);
	}

	.pipeline-visual .badge {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		width: auto;
		padding: 7px 16px;
		border-radius: 999px;
		text-align: left;
		border: 1px solid rgba(232, 169, 59, 0.35);
		background: color-mix(in srgb, #0f1f19 88%, black);
		box-shadow: 0 6px 18px -8px rgba(232, 169, 59, 0.45);
	}
	.pipeline-visual .badge .dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #e8a93b;
		box-shadow: 0 0 8px rgba(232, 169, 59, 0.8);
	}
	.pipeline-visual .badge span {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.58rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		color: #e8a93b;
	}
</style>
