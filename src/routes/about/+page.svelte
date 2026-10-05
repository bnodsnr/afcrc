<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { resolve } from '$app/paths';
	import type { ComponentData } from '$lib/api/types';
	import { firstHeadingText, toText, withoutHeadings } from '$lib/utils/html';
	import WhyUs from '$lib/components/WhyUs.svelte';
	import MissionVisionObjectives from '$lib/components/MissionVisionObjectives.svelte';

	let { data } = $props();
	let root: HTMLElement | undefined = $state();
	let aboutRoot: HTMLElement | undefined = $state();

	type Feature = { icon: string; title: string; desc: string };
	type Pillar = Feature & { tone: 'lime' | 'pine' | 'meadow' | 'gold' };
	type Node = { label: string; bg: string; icon: string; cls: string };

	const PRINCIPLES: string[] = [
		'Research-driven',
		'Field-tested',
		'Community-led',
		'Evidence-based'
	];

	const PILLARS: Pillar[] = [
		{
			icon: 'M12 2 3 9l9 4 9-4-9-7z',
			title: 'Sustainable Agriculture',
			desc: 'Practical methods that keep soil, water and yields healthy for the long term.',
			tone: 'lime'
		},
		{
			icon: 'M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z',
			title: 'Forest Conservation',
			desc: 'Protecting forests, watersheds and the species that depend on them.',
			tone: 'pine'
		},
		{
			icon: 'M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.6.5 1 1.3 1 2.1V16h6v-1.4c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 2z',
			title: 'Biodiversity Protection',
			desc: 'Safeguarding native species and the habitats that sustain them.',
			tone: 'meadow'
		},
		{
			icon: 'M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
			title: 'Responsible Resource Use',
			desc: 'Managing land, water and natural resources with care and accountability.',
			tone: 'gold'
		}
	];

	const STORY_STEPS: Feature[] = [
		{
			icon: 'M4 22V4a1 1 0 0 1 1-1h8l1 2h6v10h-7l-1-2H5',
			title: 'Foundation',
			desc: 'AFCRC Foundation is committed to research that generates practical knowledge and supports sustainable development. Our research focuses on agricultural innovation, natural-resource management, environmental conservation, biodiversity, and solutions that can benefit farmers and local communities.'
		},
		{
			icon: 'M9 3v6l-5 9a1 1 0 0 0 1 1.5h14a1 1 0 0 0 1-1.5l-5-9V3',
			title: 'Research',
			desc: 'AFCRC Foundation is committed to research that generates practical knowledge and supports sustainable development. Our research focuses on agricultural innovation, natural-resource management, environmental conservation, biodiversity, and solutions that can benefit farmers and local communities.'
		},
		{
			icon: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z',
			title: 'Field Studies',
			desc: 'AFCRC Foundation is committed to research that generates practical knowledge and supports sustainable development. Our research focuses on agricultural innovation, natural-resource management, environmental conservation, biodiversity, and solutions that can benefit farmers and local communities.'
		},
		{
			icon: 'M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.6.5 1 1.3 1 2.1V16h6v-1.4c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 2z',
			title: 'Innovation',
			desc: 'AFCRC Foundation is committed to research that generates practical knowledge and supports sustainable development. Our research focuses on agricultural innovation, natural-resource management, environmental conservation, biodiversity, and solutions that can benefit farmers and local communities.'
		},
		{
			icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
			title: 'Community Engagement',
			desc: 'AFCRC Foundation is committed to research that generates practical knowledge and supports sustainable development. Our research focuses on agricultural innovation, natural-resource management, environmental conservation, biodiversity, and solutions that can benefit farmers and local communities.'
		},
		{
			icon: 'M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
			title: 'Sustainable Impact',
			desc: 'AFCRC Foundation is committed to research that generates practical knowledge and supports sustainable development. Our research focuses on agricultural innovation, natural-resource management, environmental conservation, biodiversity, and solutions that can benefit farmers and local communities.'
		}
	];

	const ECOSYSTEM_NODES: Node[] = [
		{
			label: 'Forests',
			bg: '#2F6B34',
			icon: 'M12 2 3 9l9 4 9-4-9-7z',
			cls: 'left-1/2 top-0 -translate-x-1/2'
		},
		{
			label: 'Communities',
			bg: '#C9A441',
			icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
			cls: 'left-0 top-[110px]'
		},
		{
			label: 'Biodiversity',
			bg: '#7C6FC9',
			icon: 'M12 3c-4 0-7 2-7 6 0 3 2 4 4 4s4-2 4-4M12 3c4 0 7 2 7 6 0 3-2 4-4 4s-4-2-4-4M12 3v18',
			cls: 'right-0 top-[110px]'
		},
		{
			label: 'Water & Soil',
			bg: '#4A7CC9',
			icon: 'M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z',
			cls: 'left-1/2 top-[118px] -translate-x-1/2'
		},
		{
			label: 'Agriculture',
			bg: '#3F7A3F',
			icon: 'M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.6.5 1 1.3 1 2.1V16h6v-1.4c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 2z',
			cls: 'bottom-0 left-1/2 -translate-x-1/2'
		}
	];

	const VALUES: Feature[] = [
		{
			icon: 'M6 2h12M6 22h12M6 2c0 6 6 6 6 10s-6 4-6 10M18 2c0 6-6 6-6 10s6 4 6 10',
			title: 'Scientific Integrity',
			desc: 'We value evidence, accuracy and transparency.'
		},
		{
			icon: 'M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
			title: 'Sustainability',
			desc: 'We consider long term environmental and social impact.'
		},
		{
			icon: 'M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.6.5 1 1.3 1 2.1V16h6v-1.4c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 2z',
			title: 'Innovation',
			desc: 'We encourage new ideas and better solutions.'
		},
		{
			icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
			title: 'Collaboration',
			desc: 'We achieve more through partnerships and teamwork.'
		},
		{
			icon: 'M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z',
			title: 'Conservation',
			desc: 'We are committed to protecting ecosystems and biodiversity.'
		},
		{
			icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
			title: 'Community',
			desc: 'We respect local knowledge and support community participation.'
		}
	];

	// ---- API-driven hero copy ------------------------------------------------
	// `data.aboutUs` is the "About Us" parent row: `name` labels the hero,
	// `page_content` is the CMS (Tiptap) body and `children` are its features.
	let aboutParent = $derived((data?.aboutUs ?? null) as ComponentData | null);

	const HERO_FALLBACK = {
		label: 'About Us',
		title: 'AFCRC',
		html: '<p>Advancing research, promoting conservation and supporting sustainable agriculture for a resilient environment and thriving communities.</p>'
	};

	// The body is editor-authored, so drop anything executable before rendering it.
	function toHeroBody(html: string): string {
		return toText(html) ? html : HERO_FALLBACK.html;
	}

	let aboutLabel = $derived(aboutParent?.name?.trim() || HERO_FALLBACK.label);

	// The first heading of the Tiptap body becomes the hero title; everything else
	// stays in the body so lists, links and quotes authored in the CMS survive.
	let aboutTitle = $derived(firstHeadingText(aboutParent?.page_content) || HERO_FALLBACK.title);
	let aboutBody = $derived(toHeroBody(withoutHeadings(aboutParent?.page_content)));

	// ---- API-driven "Our Process" pipeline ------------------------------------
	// The "Our Process" row supplies the badge label, its children the stages: every
	// child becomes one branch leaving the origin node (connector + runner + card).
	// Branch slots are reused when there are more children than branches.
	const BRANCHES = [
		{
			color: '#E8A93B',
			theme: 'hero-c-gold',
			path: 'M 210 195 C 165 175, 120 150, 88 118',
			position: 'left: 2%; top: 16%;'
		},
		{
			color: '#3FA0C4',
			theme: 'hero-c-teal',
			path: 'M 210 195 C 210 250, 210 300, 210 345',
			position: 'left: 50%; top: 60%; transform: translateX(-50%);'
		},
		{
			color: '#7CAA45',
			theme: 'hero-c-meadow',
			path: 'M 210 195 C 255 175, 300 150, 332 118',
			position: 'right: 2%; top: 16%;'
		}
	];

	const STAGES_FALLBACK: Pick<ComponentData, 'id' | 'name'>[] = [
		{ id: -1, name: 'Production' },
		{ id: -2, name: 'Packaging' },
		{ id: -3, name: 'Distribution' }
	];

	let processParent = $derived((data?.ourProcess ?? null) as ComponentData | null);
	let processLabel = $derived(processParent?.name?.trim() || 'Our Process');

	let stages = $derived.by(() => {
		const rows = processParent?.children?.length ? processParent.children : STAGES_FALLBACK;
		return rows.map((row, index) => ({
			id: row.id,
			name: row.name,
			number: String(index + 1).padStart(2, '0'),
			branch: BRANCHES[index % BRANCHES.length]
		}));
	});

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		if (!root) return;

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		const ctx = gsap.context(() => {
			// Left column — plays as soon as the page paints, no scroll needed.
			if (!reduced) {
				gsap
					.timeline({ defaults: { ease: 'power3.out' } })
					.from('.hero-kicker', { opacity: 0, y: 16, duration: 0.55 })
					.from('.hero-title', { opacity: 0, y: 40, duration: 0.85 }, '-=0.3')
					.from(
						'.hero-title-accent',
						{ opacity: 0, scaleX: 0, duration: 0.6, ease: 'power2.out' },
						'-=0.5'
					)
					.from('.hero-richtext', { opacity: 0, y: 26, duration: 0.7 }, '-=0.5')
					.from('.hero-cta > *', { opacity: 0, y: 18, duration: 0.55, stagger: 0.1 }, '-=0.4');
			}

			const vtl = gsap.timeline({
				scrollTrigger: { trigger: '.hero-pipeline', start: 'top 80%' }
			});

			vtl
				.from('.hero-pipeline', { opacity: 0, y: 30, duration: 0.7, ease: 'power2.out' })
				.from(
					'.hero-pipeline .ring',
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
				.from('.hero-pipeline .connector', { opacity: 0, duration: 0.5, stagger: 0.15 }, '-=0.5')
				.from(
					'.hero-pipeline .origin-dot, .hero-pipeline .origin-pulse',
					{ opacity: 0, scale: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(2)' },
					'-=0.25'
				)
				.from('.hero-pipeline .hero-badge', { opacity: 0, y: -14, duration: 0.45 }, '-=0.2')
				.from(
					'.hero-pipeline .hero-c-gold',
					{ opacity: 0, x: -46, duration: 0.5, ease: 'power3.out' },
					'-=0.2'
				)
				.from(
					'.hero-pipeline .hero-c-meadow',
					{ opacity: 0, x: 46, duration: 0.5, ease: 'power3.out' },
					'-=0.35'
				)
				.from(
					'.hero-pipeline .hero-c-teal',
					{ opacity: 0, y: 46, duration: 0.5, ease: 'power3.out' },
					'-=0.35'
				);
		}, root);

		if (aboutRoot) {
			const triggers: ScrollTrigger[] = [];

			const ctxAbout = gsap.context(() => {
				if (reduced) return;

				// Targets are resolved lazily inside `onEnter` so GSAP always grabs the
				// live DOM nodes. Resolving them up-front breaks for content rendered
				// inside Svelte `{#each}` blocks, which are not hydrated yet at onMount.
				const reveal = (trigger: HTMLElement, start: string, pick: () => Element[]) => {
					triggers.push(
						ScrollTrigger.create({
							trigger,
							start,
							once: true,
							onEnter: () => {
								gsap.fromTo(
									pick(),
									{ opacity: 0, y: 28 },
									{
										opacity: 1,
										y: 0,
										duration: 0.7,
										stagger: 0.09,
										ease: 'power2.out',
										overwrite: true
									}
								);
							}
						})
					);
				};

				gsap.utils.toArray<HTMLElement>('.reveal-block').forEach((el) => {
					reveal(el, 'top 88%', () => [el]);
				});

				gsap.utils.toArray<HTMLElement>('.reveal-stagger').forEach((group) => {
					reveal(group, 'top 85%', () => Array.from(group.children));
				});

				const motif = aboutRoot?.querySelector('.who-motif');
				if (motif) {
					triggers.push(
						ScrollTrigger.create({
							trigger: motif,
							start: 'top 90%',
							once: true,
							onEnter: () => {
								gsap.fromTo(
									motif,
									{ opacity: 0, scale: 0.82, rotation: -25 },
									{
										opacity: 1,
										scale: 1,
										rotation: 0,
										duration: 1,
										ease: 'back.out(1.3)',
										overwrite: true
									}
								);
							}
						})
					);
				}
			}, aboutRoot);

			// Web fonts land after mount and change layout, so recalculate trigger positions.
			document.fonts?.ready.then(() => ScrollTrigger.refresh());

			return () => {
				ctx.revert();
				ctxAbout.revert();
				triggers.forEach((t) => t.kill());
			};
		}

		return () => ctx.revert();
	});
</script>

<svelte:head>
	<title>About — AFCRC</title>
	<meta
		name="description"
		content="The Agricultural & Forest Conservation Research Centre (AFCRC) advances research, promotes conservation and supports sustainable agriculture for a resilient environment and thriving communities."
	/>
</svelte:head>
<!-- ===== HERO ===== -->
<section class="hero relative overflow-hidden bg-pine-dark py-[10px]" bind:this={root}>
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
	<div
		class="pointer-events-none absolute -right-32 -bottom-40 h-[420px] w-[420px] rounded-full blur-3xl"
		style="background: radial-gradient(circle, rgba(148,182,44,0.28) 0%, transparent 70%);"
	></div>

	<div class="hero-grid relative mx-auto max-w-[1180px] px-6 max-md:px-4">
		<div class="hero-copy">
			<div class="hero-kicker">
				<span class="hero-kicker-rule"></span>
				<span class="hero-kicker-label">{aboutLabel}</span>
			</div>

			<h1
				class="hero-title mt-6 max-w-[22ch] font-serif text-[clamp(1.7rem,3.2vw,2.55rem)] leading-[1.14] font-semibold tracking-[-0.015em] text-balance text-paper"
			>
				{aboutTitle}
			</h1>
			<span
				class="hero-title-accent mt-5 block h-[3px] w-[150px] origin-left rounded-full bg-gradient-to-r from-[#E8A93B] via-[#EFC45E] to-transparent max-md:w-[110px]"
				aria-hidden="true"
			></span>

			<!-- Tiptap-authored body, styled for the dark hero instead of the
			     light "About Us" treatment used on the home page. -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- admin-authored CMS content, run through safeHtml() -->
			<div class="hero-richtext mt-7 max-w-[640px] text-pretty">{@html aboutBody}</div>

			<div class="hero-cta mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
				<a
					href={resolve('/contact')}
					class="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3.5 text-[0.85rem] font-semibold tracking-[0.04em] text-pine-dark uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-paper hover:shadow-[0_18px_40px_-18px_rgba(232,169,59,0.9)]"
				>
					Get In Touch
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M5 12h14M13 6l6 6-6 6" />
					</svg>
				</a>

				<a href="#who-we-are" class="hero-link group">
					<span>Explore our work</span>
					<svg
						class="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M5 12h14M13 6l6 6-6 6" />
					</svg>
				</a>
			</div>
		</div>

		<div class="hero-collage py-6">
			<div class="hero-pipeline relative rounded-3xl">
				<svg viewBox="0 0 420 480" fill="none" class="h-full w-full" style="overflow: visible;">
					<defs>
						<radialGradient id="about-connector-glow" cx="50%" cy="50%" r="50%">
							<stop offset="0%" stop-color="rgba(232,169,59,0.06)" />
							<stop offset="100%" stop-color="rgba(232,169,59,0)" />
						</radialGradient>
					</defs>

					<circle cx="210" cy="195" r="230" fill="url(#about-connector-glow)" />
					<circle class="ring ring-gold" cx="210" cy="195" r="195" />
					<circle class="ring ring-teal" cx="210" cy="195" r="160" />
					<circle class="ring ring-meadow" cx="210" cy="195" r="125" />

					<!-- one branch per stage of the "Our Process" menu -->
					{#each stages as stage (stage.id)}
						<path
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

				<div class="hero-badge-pos" style="left: 50%; top: 40.6%;">
					<div class="hero-badge">
						<span class="hero-badge-dot"></span>
						<span>{processLabel.toUpperCase()}</span>
					</div>
				</div>

				{#each stages as stage (stage.id)}
					<div class="hero-card-pos" style={stage.branch.position}>
						<div class="hero-card {stage.branch.theme}">
							<div class="hero-num">{stage.number}</div>
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
</section>

<!-- ===== WHY AFCRC ===== -->
<div bind:this={aboutRoot}>
	<WhyUs whyafcrc={data.whyAfcrc} />
</div>

<!-- ===== MISSION / VISION / OBJECTIVES ===== -->
<MissionVisionObjectives
	section={(data.direction as ComponentData) ?? null}
	objectives={(data.objectives as ComponentData) ?? null}
/>

<style>
	.hero :global(*) {
		box-sizing: border-box;
	}

	.hero-grid {
		display: grid;
		grid-template-columns: 1.32fr 0.68fr;
		gap: 56px;
		align-items: center;
	}

	.hero-copy {
		max-width: 700px;
	}

	/* Small label above the headline — the API component name. */
	.hero-kicker {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding: 6px 16px 6px 12px;
		border-radius: 999px;
		border: 1px solid rgba(232, 169, 59, 0.28);
		background: rgba(232, 169, 59, 0.07);
		backdrop-filter: blur(8px);
	}
	.hero-kicker-rule {
		width: 18px;
		height: 1px;
		background: #e8a93b;
	}
	.hero-kicker-label {
		font-size: 0.66rem;
		font-weight: 600;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: #e8a93b;
	}

	.hero-link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: rgba(253, 240, 207, 0.72);
		text-decoration: none;
		transition: color 0.3s ease;
	}
	.hero-link:hover {
		color: #e8a93b;
	}

	.hero-collage {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 500px;
		border-radius: 20px;
	}

	.hero-pipeline {
		width: min(100%, 400px);
		height: min(100%, 460px);
	}

	/* ===== HERO BODY: Tiptap HTML rendered through {@html} =====
	   Same content as the home page "About Us" block, restyled for the dark hero:
	   every selector is :global() because {@html} markup carries no scope class. */
	.hero-richtext :global(p) {
		font-size: 0.98rem;
		line-height: 1.8;
		color: rgba(253, 240, 207, 0.78);
		margin: 0 0 16px;
	}
	/* Opening line of the CMS body gets a slightly heavier lead treatment. */
	.hero-richtext :global(> p:first-of-type) {
		font-size: 1.06rem;
		color: rgba(253, 240, 207, 0.9);
	}
	.hero-richtext :global(p:last-child) {
		margin-bottom: 0;
	}
	/* Tiptap leaves empty paragraphs behind as spacing placeholders. */
	.hero-richtext :global(p:empty) {
		display: none;
	}
	.hero-richtext :global(h2),
	.hero-richtext :global(h3),
	.hero-richtext :global(h4) {
		font-family: var(--font-serif);
		font-weight: 600;
		line-height: 1.2;
		color: var(--color-paper);
		margin: 22px 0 10px;
	}
	.hero-richtext :global(h2) {
		font-size: 1.35rem;
	}
	.hero-richtext :global(h3) {
		font-size: 1.1rem;
		color: var(--color-gold);
	}
	.hero-richtext :global(strong) {
		color: var(--color-paper);
		font-weight: 600;
	}
	.hero-richtext :global(ul),
	.hero-richtext :global(ol) {
		margin: 0 0 14px;
		padding-left: 22px;
		font-size: 0.95rem;
		line-height: 1.7;
		color: rgba(253, 240, 207, 0.8);
	}
	.hero-richtext :global(ul) {
		list-style: disc;
	}
	.hero-richtext :global(ol) {
		list-style: decimal;
	}
	.hero-richtext :global(li) {
		margin-bottom: 7px;
	}
	.hero-richtext :global(li::marker) {
		color: var(--color-gold);
	}
	.hero-richtext :global(blockquote) {
		margin: 0 0 14px;
		padding: 12px 18px;
		border-left: 3px solid var(--color-gold);
		border-radius: 0 10px 10px 0;
		background: rgba(232, 169, 59, 0.08);
		color: rgba(253, 240, 207, 0.85);
		font-style: italic;
	}
	.hero-richtext :global(blockquote p:last-child) {
		margin-bottom: 0;
	}
	.hero-richtext :global(a) {
		color: var(--color-gold);
		text-decoration: underline;
		text-decoration-color: rgba(232, 169, 59, 0.45);
		text-underline-offset: 3px;
		transition: color 0.2s ease;
	}
	.hero-richtext :global(a:hover) {
		color: var(--color-paper);
		text-decoration-color: currentColor;
	}
	.hero-richtext :global(img) {
		max-width: 100%;
		height: auto;
		margin: 10px 0;
		border-radius: 12px;
	}

	.hero-pipeline :global(.ring) {
		fill: none;
		stroke-width: 4px;
		stroke-linecap: round;
	}
	.hero-pipeline :global(.ring-gold) {
		stroke: #e8a93b;
		opacity: 0.95;
		stroke-dasharray: 10 16;
	}
	.hero-pipeline :global(.ring-teal) {
		stroke: #3fa0c4;
		opacity: 0.95;
		stroke-dasharray: 6 12;
	}
	.hero-pipeline :global(.ring-meadow) {
		stroke: #7caa45;
		opacity: 0.95;
		stroke-dasharray: 4 10;
	}

	.hero-pipeline :global(.origin-pulse) {
		animation: hero-expand 2.8s ease-out infinite;
		transform-origin: center;
	}
	@keyframes hero-expand {
		0% {
			r: 5;
			opacity: 0.7;
		}
		100% {
			r: 32;
			opacity: 0;
		}
	}

	.hero-pipeline :global(.runner circle) {
		animation: hero-pulse-runner 2.6s ease-in-out infinite;
	}
	@keyframes hero-pulse-runner {
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

	.hero-card-pos {
		position: absolute;
	}

	.hero-card {
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
	.hero-card:hover {
		transform: translateY(-3px);
		border-color: color-mix(in srgb, var(--accent) 85%, white);
		box-shadow: 0 18px 42px -16px var(--accent-glow);
	}
	.hero-card::before {
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

	.hero-num {
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

	.hero-card h3 {
		margin: 0;
		font-family: 'Fraunces', serif;
		font-weight: 500;
		font-size: 0.98rem;
		color: #f4f1e8;
		line-height: 1.15;
	}
	.hero-card span {
		display: block;
		margin-top: 2px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.6rem;
		letter-spacing: 0.16em;
		color: rgba(244, 241, 232, 0.62);
	}

	.hero-c-gold {
		--accent: #e8a93b;
		--accent-glow: rgba(232, 169, 59, 0.4);
	}
	.hero-c-teal {
		--accent: #3fa0c4;
		--accent-glow: rgba(63, 160, 196, 0.4);
	}
	.hero-c-meadow {
		--accent: #7caa45;
		--accent-glow: rgba(124, 170, 69, 0.4);
	}

	.hero-badge-pos {
		position: absolute;
		transform: translate(-50%, -50%);
	}

	.hero-badge {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		width: auto;
		padding: 8px 18px;
		border-radius: 999px;
		text-align: center;
		white-space: nowrap;
		border: 1px solid rgba(232, 169, 59, 0.35);
		background: color-mix(in srgb, #0f1f19 88%, black);
		box-shadow: 0 6px 18px -8px rgba(232, 169, 59, 0.45);
	}
	.hero-badge-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #e8a93b;
		box-shadow: 0 0 8px rgba(232, 169, 59, 0.8);
	}
	.hero-badge span {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.58rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		color: #e8a93b;
	}

	/* ===== WHO WE ARE / OUR STORY ===== */
	.focus-card {
		--tone: var(--color-pine);
		--tone-soft: color-mix(in srgb, var(--color-pine) 12%, transparent);
	}
	.focus-card[data-tone='lime'] {
		--tone: #6f9c14;
		--tone-soft: color-mix(in srgb, #94b62c 18%, transparent);
	}
	.focus-card[data-tone='pine'] {
		--tone: var(--color-pine-dark);
		--tone-soft: color-mix(in srgb, var(--color-pine-dark) 12%, transparent);
	}
	.focus-card[data-tone='meadow'] {
		--tone: var(--color-meadow);
		--tone-soft: color-mix(in srgb, var(--color-meadow) 20%, transparent);
	}
	.focus-card[data-tone='gold'] {
		--tone: #b98a12;
		--tone-soft: color-mix(in srgb, var(--color-afcrc-yellow) 28%, transparent);
	}

	.focus-card-icon {
		color: var(--tone);
		background: var(--tone-soft);
		transition:
			background-color 0.35s ease,
			color 0.35s ease;
	}
	.focus-card:hover .focus-card-icon {
		color: #fff;
		background: var(--tone);
	}
	.focus-card-glow {
		background: var(--tone);
	}
	.focus-card-rule,
	.focus-card-bar {
		background: var(--tone);
	}

	@media (max-width: 1200px) {
		/* Tighter cards so the left/right pair never collides in a narrow column. */
		.hero-card {
			gap: 9px;
			padding: 11px 14px 11px 11px;
		}
		.hero-num {
			width: 30px;
			height: 30px;
			font-size: 0.72rem;
		}
		.hero-card h3 {
			font-size: 0.9rem;
		}
		.hero-card span {
			font-size: 0.55rem;
		}
	}

	@media (max-width: 1100px) {
		.hero-grid {
			grid-template-columns: 1fr;
			gap: 40px;
		}
		.hero-copy {
			max-width: none;
		}
		.hero-collage {
			height: auto;
			min-height: 460px;
			padding: 20px 0;
		}
		.hero-pipeline {
			width: min(100%, 400px);
			height: 440px;
		}
	}
</style>
