<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { base } from '$app/paths';
	import { getImageUrl } from '$lib/utils/image';
	import heroImg from '$lib/assets/images/ourteam-hero.jpg';

	let { data } = $props();

	const gradients = [
		'linear-gradient(135deg,#17533a,#84a66d)',
		'linear-gradient(135deg,#4b845a,#3fa0c4)',
		'linear-gradient(135deg,#7caa45,#e8a93b)',
		'linear-gradient(135deg,#3fa0c4,#17533a)',
		'linear-gradient(135deg,#e8a93b,#7c6fc9)',
		'linear-gradient(135deg,#5c6b58,#4b845a)',
		'linear-gradient(135deg,#7c6fc9,#84a66d)',
		'linear-gradient(135deg,#17533a,#3fa0c4)'
	];

	const team = (data.teams ?? []).map((m, i) => {
		const initials = m.name
			.split(/\s+/)
			.filter(Boolean)
			.map((w) => w[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
		return {
			...m,
			initials: initials || '?',
			gradient: gradients[i % gradients.length],
			tag: m.position || 'Team Member',
			role: m.position || 'Team Member'
		};
	});

	let heroEl: HTMLElement | undefined = $state();
	let cardsEl: HTMLElement | undefined = $state();

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);

		const heroCtx = gsap.context(() => {
			if (!heroEl) return;
			const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

			tl.from('.hero-eyebrow', { opacity: 0, y: 22, duration: 0.6 })
				.from('.hero-title', { opacity: 0, y: 40, duration: 0.85 }, '-=0.35')
				.from('.hero-accent-wrap', { opacity: 0, y: 16, duration: 0.55 }, '-=0.45')
				.from('.hero-text', { opacity: 0, y: 26, duration: 0.7 }, '-=0.45')
				.from('.hero-cta a', { opacity: 0, y: 18, duration: 0.5, stagger: 0.12 }, '-=0.4')
				.from('.hero-stats > div', { opacity: 0, y: 16, duration: 0.5, stagger: 0.1 }, '-=0.35')
				.from('.hero-chip', { opacity: 0, y: 20, duration: 0.7, ease: 'power2.out' }, '-=0.5')
				.from('.hero-scroll', { opacity: 0, duration: 0.7 }, '-=0.35');
		}, heroEl);
		// prettier-ignore
		const cardsCtx = gsap.context(() => {
			gsap.utils.toArray('.team-card').forEach((el) => {
				const elem = el as Element;
				gsap.from(elem, {
					opacity: 0,
					y: 28,
					duration: 0.7,
					ease: 'power2.out',
					scrollTrigger: { trigger: elem, start: 'top 92%' }
				});
			});
		}, cardsEl);

		return () => {
			heroCtx.revert();
			cardsCtx.revert();
		};
	});
</script>

<svelte:head>
	<title>Our Team — AFCRC</title>
	<meta
		name="description"
		content="Meet the researchers, scientists and specialists behind the Agricultural & Forest Conservation Research Centre (AFCRC)."
	/>
</svelte:head>

<!-- ===== HERO ===== -->
<section
	bind:this={heroEl}
	class="relative flex min-h-[680px] items-center overflow-hidden bg-pine-dark py-28 max-xl:py-24 max-md:py-16"
>
	<img
		src={heroImg}
		alt="A diverse team of AFCRC professionals collaborating in a bright modern office"
		class="absolute inset-0 h-full w-full object-cover object-[68%_center] max-lg:object-center"
		fetchpriority="high"
		decoding="async"
	/>

	<div
		class="pointer-events-none absolute inset-0 bg-gradient-to-r from-pine-dark via-pine-dark/80 to-pine-dark/5 max-lg:from-pine-dark/95 max-lg:via-pine-dark/85 max-lg:to-pine-dark/60"
	></div>
	<div
		class="pointer-events-none absolute inset-0 bg-gradient-to-t from-pine-dark/85 via-transparent to-pine-dark/20"
	></div>
	<div
		class="pointer-events-none absolute inset-y-0 left-0 w-[55%] opacity-[0.05]"
		style="background-image:
			linear-gradient(rgba(253,240,207,0.6) 1px, transparent 1px),
			linear-gradient(90deg, rgba(253,240,207,0.6) 1px, transparent 1px);
		background-size: 52px 52px;"
	></div>

	<div class="relative mx-auto w-full max-w-[1180px] px-6 max-md:px-4 lg:px-8">
		<div class="max-w-[620px]">
			<div
				class="hero-eyebrow inline-flex items-center gap-3 rounded-full border border-gold/40 bg-pine-dark/70 px-5 py-2.5 backdrop-blur-md"
			>
				<span
					class="hero-pulse-dot h-2 w-2 rounded-full bg-[#E8A93B] shadow-[0_0_10px_rgba(232,169,59,0.9)]"
				></span>
				<span class="font-mono text-[0.62rem] font-semibold tracking-[0.22em] text-gold uppercase">
					Our Team
				</span>
				<span class="h-3.5 w-px bg-paper/25"></span>
				<span class="font-serif text-[0.72rem] tracking-[0.08em] text-paper/70 uppercase">
					AFCRC Research Centre
				</span>
			</div>

			<h1
				class="hero-title mt-7 font-serif text-[clamp(2.9rem,6vw,4.4rem)] leading-[1.04] font-bold tracking-[-0.015em] text-paper"
			>
				Meet the minds
				<span class="hero-accent-wrap relative mt-2 inline-flex w-full flex-col">
					<span
						class="hero-accent bg-gradient-to-r from-[#E8A93B] via-[#EFC45E] to-[#FBE9BA] bg-clip-text pr-1 text-transparent italic"
						>shaping a greener future</span
					>
					<svg
						class="absolute -bottom-2 left-0 w-full"
						viewBox="0 0 320 12"
						fill="none"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<path
							d="M4 9C62 3.5 190 2.5 316 6.5"
							stroke="#E8A93B"
							stroke-width="3.5"
							stroke-linecap="round"
							opacity="0.9"
						/>
					</svg>
				</span>
			</h1>

			<p class="hero-text mt-9 max-w-[500px] text-[0.98rem] leading-relaxed text-paper/80">
				A diverse group of researchers, scientists and field specialists combining decades of
				experience to advance sustainable agriculture, protect our forests and empower communities —
				grounded in real work, not just ambition.
			</p>

			<div class="hero-cta mt-11 flex flex-wrap gap-4">
				<a
					href="#team"
					class="group inline-flex items-center gap-2.5 rounded-full bg-gold px-9 py-4 text-[0.85rem] font-semibold tracking-[0.04em] text-pine-dark uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-paper hover:shadow-[0_10px_28px_-8px_rgba(251,233,186,0.7)]"
				>
					Meet the team
					<svg
						class="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg
					>
				</a>
				<a
					href="{base}/contact"
					class="inline-flex items-center gap-2 rounded-full border border-paper/50 px-9 py-4 text-[0.85rem] font-semibold tracking-[0.04em] text-paper uppercase transition-all duration-300 hover:-translate-y-0.5 hover:border-paper hover:bg-paper hover:text-pine-dark"
				>
					Join us
				</a>
			</div>

			<div class="hero-stats mt-14 flex items-center gap-5 max-md:mt-10 max-sm:gap-2.5">
				{#each [{ v: '40+', l: 'Specialists' }, { v: '12+', l: 'Research areas' }, { v: '20+', l: 'Field projects' }] as st (st.l)}
					<div class="border-l-2 border-[#E8A93B]/60 pl-5 max-sm:pl-3.5">
						<div class="font-serif text-[2.1rem] leading-none font-bold text-paper max-sm:text-2xl">
							{st.v}
						</div>
						<div class="mt-2 font-mono text-[0.62rem] tracking-[0.16em] text-paper/60 uppercase">
							{st.l}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div
			class="hero-chip absolute right-8 bottom-9 hidden items-center gap-4 rounded-2xl border border-paper/20 bg-pine-dark/70 py-3 pr-6 pl-3 shadow-[0_18px_40px_-16px_rgba(4,20,14,0.6)] backdrop-blur-xl lg:flex"
		>
			<div class="flex -space-x-2.5">
				{#each team.slice(0, 4) as m (m.id ?? m.role)}
					<span
						class="flex h-10 w-10 items-center justify-center rounded-full border-[2px] border-pine-dark font-serif text-[0.72rem] font-bold text-paper"
						style="background: {m.gradient};"
					>
						{m.initials}
					</span>
				{/each}
			</div>
			<div class="flex flex-col">
				<span class="font-serif text-[0.85rem] leading-tight font-semibold text-paper">
					Proudly building the future
				</span>
				<span class="font-mono text-[0.56rem] tracking-[0.14em] text-paper/55 uppercase">
					One community at a time
				</span>
			</div>
		</div>
	</div>

	<a
		href="#team"
		class="hero-scroll absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-paper/60 transition-colors duration-300 hover:text-paper md:flex"
		aria-label="Scroll to team"
	>
		<span class="font-mono text-[0.58rem] tracking-[0.24em] uppercase">Scroll</span>
		<span class="relative h-8 w-5 rounded-full border border-current">
			<span
				class="hero-scroll-dot absolute top-1.5 left-1/2 h-1.5 w-1 -translate-x-1/2 rounded-full bg-current"
			></span>
		</span>
	</a>
</section>

<!-- ===== TEAM CARDS ===== -->
<section id="team" class="scroll-mt-24 bg-paper-white py-[100px] max-md:py-16" bind:this={cardsEl}>
	<div class="mx-auto max-w-[1200px] px-6 max-md:px-4">
		<div class="mx-auto mb-14 max-w-[520px] text-center max-md:mb-10">
			<h2
				class="font-serif text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold tracking-[-0.01em] text-pine-dark"
			>
				Meet Our Team
			</h2>
			<div class="mx-auto mt-4 h-[3px] w-14 rounded-full bg-gold"></div>
			<p class="mt-5 text-[0.95rem] leading-relaxed text-ink-soft">
				A multidisciplinary group of researchers, scientists and specialists turning research into
				real, lasting impact.
			</p>
		</div>

		<div class="grid grid-cols-4 gap-8 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
			{#each team as m (m.id)}
				<article
					class="team-card group relative flex flex-col overflow-hidden rounded-[1.25rem] border border-line bg-white"
				>
					<!-- Portrait -->
					<div class="relative aspect-[4/4.4] w-full overflow-hidden bg-pine-dark">
						{#if m.image}
							<img
								src={getImageUrl(m.image)}
								alt={m.name}
								class="absolute inset-0 h-full w-full object-cover object-[50%_20%] transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
								loading="lazy"
							/>
						{:else}
							<span
								class="absolute inset-0 flex items-center justify-center font-serif text-[3.6rem] font-semibold text-paper/90"
								>{m.initials}</span
							>
						{/if}
					</div>

					<!-- Body -->
					<div class="flex grow flex-col px-6 pt-5 pb-6">
						<h3
							class="font-serif text-[1.3rem] leading-snug font-semibold tracking-[-0.01em] text-pine-dark"
						>
							{m.name}
						</h3>

						<p class="mt-1 text-[0.78rem] font-medium text-teal">{m.role}</p>

						{#if m.qualification}
							<p
								class="mt-1 inline-flex items-start gap-1.5 text-[0.72rem] leading-relaxed text-ink-soft"
							>
								<svg
									class="h-3.5 w-3.5 flex-shrink-0 text-gold"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z" /><path
										d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /><path d="M22 10v6" /></svg
								>
								<span>{m.qualification}</span>
							</p>
						{/if}

						<!-- Divider + socials -->
						<div class="mt-auto pt-5">
							<div class="border-t border-line pt-4">
								<div class="flex items-center gap-2.5">
									{#each [{ label: 'LinkedIn', icon: 'M4.98 3.5a2.49 2.49 0 1 1-4.99 0 2.49 2.49 0 0 1 4.99 0zM.5 9.5h3.5V24H.5zM8.7 9.5h3.35v1.98h.05c.47-.88 1.62-1.81 3.32-1.81 3.55 0 4.2 2.34 4.2 5.37V24h-3.5v-7.34c0-1.75-.03-4-2.44-4-2.44 0-2.82 1.9-2.82 3.87V24H8.7z' }, { label: 'X', icon: 'M23 4.8c-.78.35-1.62.59-2.5.7.9-.54 1.59-1.4 1.92-2.42a8.7 8.7 0 0 1-2.77 1.06A4.34 4.34 0 0 0 16.26 3c-2.4 0-4.34 1.95-4.34 4.35 0 .34.04.67.12.99A12.32 12.32 0 0 1 2.6 3.92a4.33 4.33 0 0 0 1.34 5.8 4.3 4.3 0 0 1-1.97-.54v.05c0 2.1 1.5 3.86 3.49 4.26a4.4 4.4 0 0 1-1.96.07 4.34 4.34 0 0 0 4.05 3.02A8.7 8.7 0 0 1 .6 18.37 12.3 12.3 0 0 0 7.3 20.4c6.58 0 10.18-5.46 10.18-10.2v-.47A7.3 7.3 0 0 0 23 4.8z' }, { label: 'Email', icon: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z' }] as s (s.label)}
										<a
											href="/ourteam"
											aria-label="{m.name} on {s.label}"
											class="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-soft transition-colors duration-300 hover:border-pine hover:bg-pine hover:text-white"
										>
											<svg
												class="h-[0.9rem] w-[0.9rem]"
												viewBox="0 0 24 24"
												fill="currentColor"
												stroke="none"
											><path d={s.icon} /></svg
											>
										</a>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- ===== JOIN CTA ===== -->
<section class="bg-paper-white pb-[100px] max-md:pb-16">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<div
			class="relative overflow-hidden rounded-2xl bg-pine-dark px-10 py-14 max-md:p-8"
			style="background:
				radial-gradient(circle at 12% 20%, #4b845a 0%, transparent 40%),
				radial-gradient(circle at 88% 15%, #e8a93b 0%, transparent 35%),
				linear-gradient(135deg, #17533a 0%, #2b6d4c 60%, #17533a 100%)"
		>
			<div
				class="pointer-events-none absolute -top-24 right-1/4 h-[260px] w-[260px] rounded-full bg-gold/10 blur-[90px]"
			></div>
			<div class="relative flex flex-wrap items-center justify-between gap-8">
				<div class="max-w-[520px]">
					<div class="eyebrow text-gold before:bg-gold">Join us</div>
					<h2 class="mt-4 font-serif text-[clamp(1.6rem,3vw,2.2rem)] font-semibold text-paper">
						Want to make an impact with us?
					</h2>
					<p class="mt-3 text-[0.92rem] leading-relaxed text-paper/80">
						We are always looking for passionate researchers and practitioners to join the AFCRC
						community.
					</p>
				</div>
				<a
					href="{base}/contact"
					class="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-[0.85rem] font-semibold tracking-[0.04em] text-pine-dark uppercase transition-all duration-300 hover:bg-paper hover:shadow-[0_8px_24px_-8px_rgba(251,233,186,0.6)]"
				>
					Get In Touch
				</a>
			</div>
		</div>
	</div>
</section>

<style>
	.team-card {
		will-change: transform, opacity;
		box-shadow:
			0 1px 2px rgba(17, 48, 34, 0.04),
			0 6px 16px -6px rgba(17, 48, 34, 0.08);
		transition:
			translate 0.4s cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1),
			border-color 0.3s ease,
			opacity 0.5s ease;
	}

	.team-card:hover {
		translate: 0 -6px;
		box-shadow:
			0 1px 2px rgba(17, 48, 34, 0.05),
			0 20px 40px -16px rgba(17, 48, 34, 0.22),
			0 0 0 1px rgba(17, 48, 34, 0.06);
		border-color: rgba(17, 48, 34, 0.16);
	}

	/* Smooth image zoom handled by Tailwind group-hover */

	.hero-pulse-dot {
		animation: hero-pulse-dot 2.2s ease-in-out infinite;
	}
	@keyframes hero-pulse-dot {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.55;
			transform: scale(0.75);
		}
	}

	.hero-scroll-dot {
		animation: hero-scroll-dot 1.8s ease-in-out infinite;
	}
	@keyframes hero-scroll-dot {
		0% {
			transform: translate(-50%, 0);
			opacity: 1;
		}
		70% {
			transform: translate(-50%, 14px);
			opacity: 0;
		}
		71% {
			transform: translate(-50%, -2px);
			opacity: 0;
		}
		100% {
			transform: translate(-50%, 0);
			opacity: 1;
		}
	}
</style>
