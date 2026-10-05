<script lang="ts">
	import type { ComponentData } from '$lib/api/types';
	import { firstHeadingText, toText, withoutHeadings } from '$lib/utils/html';
	import { getImageUrl } from '$lib/utils/image';
	import defaultPortrait from '$lib/images/dymmyimage.png';

	type RevealOptions = { delay?: number };

	interface Props {
		message?: ComponentData | null;
	}

	/** The "chairman-message" parent row: name = eyebrow, featured_image = portrait,
	 *  page_content = heading + message + sign-off. */
	let { message = null }: Props = $props();

	const FALLBACK = {
		eyebrow: "From the Chairman's Desk",
		heading: 'Stewardship is a long commitment, not a slogan.',
		paragraphs: [
			'The Agricultural & Forest Conservation Research Centre was founded on a simple belief: that the health of our soils, forests and watersheds is inseparable from the health of the communities that depend on them. Everything we do begins from that single idea.',
			'We work at the pace of evidence. Our teams spend long seasons in the field before we commit to a recommendation, because a solution that cannot survive real conditions is not a solution at all. This discipline has shaped every study, trial and partnership we have undertaken so far.',
			'Progress is measured in hectares restored, in farmers whose yields hold through a difficult season, and in young people who choose to study these subjects. I am proud of what we have built, and I am conscious of how much remains to be done.'
		],
		name: 'Dr Megh Raj Shrestha',
		title: 'Chairman/Executive Director, MBA, MACC, M Law (Australia)'
	};

	/** Pulls the text out of every <p> in a CMS fragment, in document order. */
	function paragraphTexts(html: string): string[] {
		return (
			[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
				// a <br> inside a line joins it to the next, so mark the break
				.map(([, inner]) => toText(inner.replace(/<br\s*\/?>/gi, ' · ')))
				.filter(Boolean)
		);
	}

	const content = $derived.by(() => {
		const html = message?.page_content ?? '';
		// The CMS separates the message from the sign-off with a horizontal rule.
		const [body, signOff = ''] = withoutHeadings(html).split(/<hr\b[^>]*>/i);
		const paragraphs = paragraphTexts(body);
		const signOffLines = paragraphTexts(signOff);

		return {
			eyebrow: message?.name?.trim() || FALLBACK.eyebrow,
			heading: firstHeadingText(html) || FALLBACK.heading,
			paragraphs: paragraphs.length ? paragraphs : FALLBACK.paragraphs,
			name: signOffLines[0] || FALLBACK.name,
			title: signOffLines.slice(1).join(' · ') || FALLBACK.title,
			portrait: getImageUrl(message?.featured_image, defaultPortrait),
			portraitAlt: message?.featured_image
				? `Portrait of ${signOffLines[0] || 'the Chairman of AFCRC'}`
				: 'Portrait of the Chairman of AFCRC'
		};
	});

	/** First and last name as initials, used as the hand-written signature. */
	const signature = $derived(
		(() => {
			const words = content.name
				.split(/\s+/)
				.filter((w) => w && !/^(dr|mr|mrs|ms|miss|prof)\.?$/i.test(w));

			if (words.length < 2) return words[0] ?? '';
			return `${words[0][0].toUpperCase()}. ${words[words.length - 1][0].toUpperCase()}.`;
		})()
	);

	function reveal(node: HTMLElement, opts: RevealOptions = {}) {
		if (
			typeof IntersectionObserver === 'undefined' ||
			typeof window === 'undefined' ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			return {};
		}

		node.style.setProperty('--reveal-delay', `${opts.delay ?? 0}ms`);
		node.classList.add('chair-reveal');

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				node.classList.add('chair-reveal-in');
				observer.disconnect();
			},
			{ threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
		);
		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<section class="relative overflow-hidden bg-paper-white py-[100px] max-md:py-16">
	<!-- ambient -->
	<div
		class="pointer-events-none absolute -top-48 -left-40 h-[560px] w-[560px] rounded-full bg-meadow/12 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute -right-32 bottom-0 h-[440px] w-[440px] rounded-full bg-gold/30 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.5]"
		style="background-image:
			linear-gradient(rgba(32,36,31,0.045) 1px, transparent 1px),
			linear-gradient(90deg, rgba(32,36,31,0.045) 1px, transparent 1px);
			background-size: 72px 72px;
			mask-image: radial-gradient(ellipse 70% 60% at 50% 35%, #000 20%, transparent 75%);
			-webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 35%, #000 20%, transparent 75%);"
	></div>

	<div class="relative mx-auto max-w-[1180px] px-6 max-md:px-4">
		<article class="grid grid-cols-[0.85fr_1.15fr] items-center gap-[70px] max-lg:grid-cols-1">
			<!-- ===== image side ===== -->
			<figure class="chair-figure relative m-0 max-lg:mx-auto max-lg:max-w-[420px]">
				<!-- offset accent frame -->
				<div
					class="pointer-events-none absolute -top-4 -left-4 h-full w-full rounded-[28px] border-2 border-afcrc-yellow/45 max-md:-top-3 max-md:-left-3"
				></div>
				<div
					class="pointer-events-none absolute -right-6 -bottom-6 -z-10 h-48 w-48 rounded-full bg-gradient-to-br from-afcrc-lime/40 to-afcrc-blue/30 blur-2xl"
				></div>

				<div
					class="group relative overflow-hidden rounded-2xl border border-line bg-pine-dark shadow-[0_28px_60px_-32px_rgba(23,83,58,0.65)]"
				>
					<img
						src={content.portrait}
						alt={content.portraitAlt}
						width="640"
						height="800"
						loading="lazy"
						decoding="async"
						class="chair-portrait aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
					/>
				</div>

				<!-- caption overlay -->
				<figcaption
					class="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-pine-dark/92 via-pine-dark/55 to-transparent px-6 pt-14 pb-6"
				>
					<p class="font-serif text-[1.05rem] font-semibold text-paper">{content.name}</p>
					<p class="mt-1 font-mono text-[0.64rem] tracking-[0.18em] text-gold uppercase">
						{content.title}
					</p>
				</figcaption>
			</figure>

			<!-- ===== content side ===== -->
			<div class="chair-content">
				<div use:reveal>
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
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M7 17h6M9.5 17V7.5a2.5 2.5 0 0 1 5 0" />
								<path d="M14.5 9.5h3M16.5 9.5v9" />
							</svg>
						</span>
						<span class="font-mono text-[0.66rem] tracking-[0.2em] text-pine uppercase"
							>{content.eyebrow}</span
						>
					</span>
				</div>

				<h2
					use:reveal={{ delay: 60 }}
					class="mt-4 mb-6 font-serif text-[clamp(1.8rem,3.6vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-pine-dark"
				>
					{content.heading}
				</h2>

				<blockquote class="m-0">
					{#each content.paragraphs as paragraph, i (i)}
						<p
							use:reveal={{ delay: 120 + i * 80 }}
							class="mb-4 text-[0.98rem] leading-[1.8] text-ink-soft last:mb-0"
						>
							{paragraph}
						</p>
					{/each}
				</blockquote>

				<div
					use:reveal={{ delay: 440 }}
					class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line pt-7"
				>
					<div>
						<p class="font-serif text-[1.15rem] font-semibold text-pine-dark">
							{content.name}
						</p>
						<p class="mt-0.5 font-mono text-[0.64rem] tracking-[0.18em] text-ink-soft/70 uppercase">
							{content.title}
						</p>
					</div>

					<div class="ml-auto text-right">
						<p
							class="font-serif text-[1.9rem] leading-none text-pine/70 italic max-sm:ml-0 max-sm:text-left"
						>
							{signature}
						</p>
					</div>
				</div>
			</div>
		</article>
	</div>
</section>

<style>
	:global(.chair-reveal) {
		opacity: 0;
		transform: translateY(26px);
		transition:
			opacity 0.75s ease var(--reveal-delay, 0ms),
			transform 0.75s cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay, 0ms);
	}

	:global(.chair-reveal-in) {
		opacity: 1;
		transform: none;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.chair-reveal) {
			opacity: 1;
			transform: none;
		}
		.chair-portrait {
			transition: none;
		}
	}

	.chair-figure {
		transition: transform 0.6s ease;
	}

	@media (min-width: 1024px) {
		.chair-figure:hover {
			transform: translateY(-4px);
		}
	}
</style>
