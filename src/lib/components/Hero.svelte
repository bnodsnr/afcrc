<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import type { PromoBanner } from '$lib/api/types';
	import { getImageUrl } from '$lib/utils/image';
	import { getCategoryUrl } from '$lib/utils/url';

	interface Props {
		heroBannersData?: PromoBanner[];
		categories?: any[];
	}
	let { heroBannersData = [], categories = [] }: Props = $props();
	console.log('categories', categories);

	let currentSlide = $state(0);
	let isTransitioning = $state(false);

	const DURATION = 6000;

	const defaultSlides = [
		{
			id: 1,
			title: 'Butcher & Meat',
			eyebrow: 'Fresh Cut',
			desc: 'We provide always fresh and organic meat from our farm in a very hygienic way.',
			cta: 'Shop Collection',
			ctaHref: '#',
			bg: './a.jpg',
			text_alignment: 'left' as 'left' | 'center' | 'right'
		}
	];

	function transformBannersToSlides(apiBanners: PromoBanner[]) {
		if (!apiBanners || apiBanners.length === 0) return defaultSlides;
		const active = apiBanners.filter((b) => b.is_active);
		if (active.length === 0) return defaultSlides;
		return active.map((b) => ({
			id: b.id,
			title: b.title || '',
			eyebrow: b.primary_text || '',
			desc: b.secondary_text || '',
			cta: b.button_text || 'Shop Now',
			ctaHref: b.link || '#',
			bg: getImageUrl(b.image, './a.jpg'),
			text_alignment: (b.text_alignment as 'left' | 'center' | 'right') ?? 'left'
		}));
	}

	const slides = $derived(transformBannersToSlides(heroBannersData));
	const slideCount = $derived(slides.length);

	let autoTimer: ReturnType<typeof setInterval>;
	let heroEl: HTMLElement | undefined = $state();
	let mouseX = $state(0.5);
	let mouseY = $state(0.5);

	function goToSlide(i: number) {
		if (i !== currentSlide && !isTransitioning) {
			isTransitioning = true;
			currentSlide = i;
			setTimeout(() => {
				isTransitioning = false;
			}, 1200);
		}
	}

	function nextSlide() {
		if (!isTransitioning) {
			goToSlide((currentSlide + 1) % slideCount);
		}
	}

	function prevSlide() {
		if (!isTransitioning) {
			goToSlide(currentSlide === 0 ? slideCount - 1 : currentSlide - 1);
		}
	}

	function startAuto() {
		clearInterval(autoTimer);
		autoTimer = setInterval(nextSlide, DURATION);
	}

	function stopAuto() {
		clearInterval(autoTimer);
	}

	function handleMouse(e: MouseEvent) {
		const rect = heroEl!.getBoundingClientRect();
		mouseX = (e.clientX - rect.left) / rect.width;
		mouseY = (e.clientY - rect.top) / rect.height;
	}

	onMount(() => {
		startAuto();
		return stopAuto;
	});
</script>

<svelte:head>
	<style>
		@keyframes ken-burns-zoom {
			0% {
				transform: scale(1);
			}
			100% {
				transform: scale(1.12);
			}
		}
		@keyframes float-down {
			0%,
			100% {
				transform: translateY(0);
				opacity: 0.6;
			}
			50% {
				transform: translateY(6px);
				opacity: 1;
			}
		}
		@keyframes slide-reveal {
			0% {
				width: 0;
			}
			100% {
				width: 60px;
			}
		}
		.ken-burns {
			will-change: transform;
		}
		.ken-burns-in {
			animation: ken-burns-zoom 8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
		}
		.float-chevron {
			animation: float-down 2.2s ease-in-out infinite;
		}
		.accent-reveal {
			animation: slide-reveal 1s cubic-bezier(0.22, 1, 0.36, 1) 0.4s forwards;
		}
		.parallax-layer {
			will-change: transform;
		}
	</style>
</svelte:head>

<section
	bind:this={heroEl}
	class="relative min-h-[min(100dvh,800px)] select-none"
	role="region"
	aria-roledescription="carousel"
	onmouseenter={stopAuto}
	onmouseleave={startAuto}
	onmousemove={handleMouse}
>
	<!-- Ken Burns background layers -->
	<div class="absolute inset-0 overflow-hidden">
		{#each slides as slide, i}
			<div
				class="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
				class:opacity-100={i === currentSlide}
				class:opacity-0={i !== currentSlide}
			>
				<div
					class="ken-burns h-full w-full bg-cover bg-center"
					class:ken-burns-in={i === currentSlide}
					style="background-image: url({slide.bg});"
				></div>
				<!-- <div class="absolute inset-0 bg-paper/70"></div> -->
				<!-- <div
				class="absolute inset-0 bg-gradient-to-r from-pine-dark/40 via-pine-dark/20 to-pine-dark/5"
			></div> -->
				<!-- <div
				class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAgMGwyMCAyMG0wLTIwTDAgMjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] opacity-30"
			></div> -->
				<!-- Vignette overlay -->
				<!-- <div
				class="absolute inset-0 bg-gradient-to-t from-pine-dark/40 via-transparent to-pine-dark/10"
			></div> -->
			</div>
		{/each}
	</div>

	<!-- Text content - lower third with glass backdrop -->
	<div class="pointer-events-none absolute inset-0 z-10">
		{#each slides as slide, i}
			<div
				class="parallax-layer pointer-events-auto absolute inset-0 flex items-end pb-[250px] max-md:pb-[220px]"
				class:opacity-100={i === currentSlide}
				class:opacity-0={i !== currentSlide}
				style="transition: opacity 1000ms ease, transform 1000ms cubic-bezier(0.22,1,0.36,1); transition-delay: {i ===
				currentSlide
					? '200ms'
					: '0ms'};
					transform: translate({(mouseX - 0.5) * 20}px, {(mouseY - 0.5) * 12}px);"
			>
				<div class="max-w-[1180px] px-10 max-md:px-4">
					<div class="max-w-[780px] rounded-2xl p-8">
						<div class="eyebrow mb-4 text-gold before:bg-gold">{slide.eyebrow}</div>
						<h1
							class="mb-4 font-serif text-[clamp(2rem,4vw,1.5rem)] leading-[1.02] font-semibold tracking-[-0.018em] text-paper [text-shadow:0_4px_40px_rgba(0,0,0,0.4)]"
						>
							{@html slide.title}
						</h1>
						<p class="max-w-[880px] text-[1rem] leading-relaxed text-paper">
							{slide.desc}
						</p>
						<!-- Accent bar -->
						<div
							class="accent-reveal mt-5 h-[3px] w-0 rounded-full bg-gradient-to-r from-gold to-gold/20"
						></div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Slide number - right edge -->
	<div
		class="pointer-events-none absolute right-8 bottom-[390px] z-10 hidden flex-col items-center gap-3 lg:flex"
	>
		{#each slides as _, i}
			<button
				onclick={() => goToSlide(i)}
				class="block rounded-full border-0 transition-all duration-500 {i === currentSlide
					? 'h-[7px] w-[7px] scale-150 bg-gold'
					: 'h-[6px] w-[6px] bg-white/20'}"
				aria-label="Go to slide {i + 1}"
			></button>
		{/each}
	</div>

	<!-- Navigation arrow - left -->
	<button
		onclick={prevSlide}
		class="absolute top-1/2 left-6 z-20 hidden -translate-y-1/2 rounded-full border border-white/15 bg-white/6 px-[13px] py-[13px] text-white/50 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/12 hover:text-white lg:block"
		aria-label="Previous slide"
	>
		<svg viewBox="0 0 18 18" fill="none" class="h-[18px] w-[18px]">
			<path
				d="M11 13L7 9L11 5"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>
	<button
		onclick={nextSlide}
		class="absolute top-1/2 right-6 z-20 hidden -translate-y-1/2 rounded-full border border-white/15 bg-white/6 px-[13px] py-[13px] text-white/50 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/12 hover:text-white lg:block"
		aria-label="Next slide"
	>
		<svg viewBox="0 0 18 18" fill="none" class="h-[18px] w-[18px]">
			<path
				d="M7 5L11 9L7 13"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	<!-- Scroll indicator -->
	<div
		class="absolute bottom-[310px] left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
	>
		<span class="font-mono text-[0.6rem] tracking-[0.12em] text-white/30 uppercase">Scroll</span>
		<svg viewBox="0 0 16 16" fill="none" class="float-chevron h-4 w-4 text-white/40">
			<path
				d="M4 6L8 10L12 6"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</div>
	<!-- Category cards overlay -->
	<div class="absolute right-0 bottom-0 left-0 z-50 translate-y-1/2 px-6 max-md:px-4">
		<div
			class="hero-cat-grid mx-auto grid max-w-[1180px] grid-cols-4 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1"
		>
			{#each categories as category, index}
				<a
					href={getCategoryUrl(category)}
					class="hero-cat-card group relative flex min-h-[340px] overflow-hidden rounded border border-white/15 bg-white/5 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.45)] backdrop-blur-[2px] transition-all duration-500 hover:-translate-y-3 hover:border-white/30 hover:shadow-[0_32px_64px_-16px_rgba(11,61,42,0.6)] max-md:min-h-[320px]"
				>
					<!-- Background image - slow zoom on hover -->
					<div
						class="absolute inset-0 scale-105 bg-cover bg-center transition-transform duration-[900ms] ease-out group-hover:scale-[1.16]"
						style="background-image: url({getImageUrl(
							category.featured_image
						)}); background-size: cover; background-position: center;"
					></div>

					<!-- Overlay -->
					<div
						class="absolute inset-0 bg-gradient-to-t from-[#000]/95 via-[#103f2c]/55 to-black/15 transition-all duration-500 group-hover:from-[#0b3d2a]/95 group-hover:via-[#17533a]/40"
					></div>

					<!-- Inner hairline ring -->
					<div
						class="absolute inset-0 rounded-3xl ring-1 ring-white/10 transition-all duration-500 ring-inset group-hover:ring-white/25"
					></div>

					<!-- Gold accent line that sweeps in on hover -->
					<div
						class="absolute bottom-0 left-0 z-10 h-[3px] w-0 rounded-r-full bg-gradient-to-r from-gold via-butter to-transparent transition-all duration-500 ease-out group-hover:w-full"
					></div>

					<!-- Editorial index number -->
					<span
						class="absolute top-4 right-5 z-10 font-mono text-[0.65rem] font-medium tracking-[0.18em] text-white/40 transition-colors duration-300 group-hover:text-gold"
					>
						{String(index + 1).padStart(2, '0')}
					</span>

					<div class="relative z-10 mt-auto flex w-full flex-col items-start p-6 pb-7">
						<div
							class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:border-gold/40 group-hover:bg-white group-hover:text-pine-dark"
						>
							<svg
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M12 3C12 3 6 9 6 15C6 18 8 21 12 22" />
								<path d="M12 3C12 3 18 9 18 15C18 18 16 21 12 22" />
								<path d="M12 22V6" />
							</svg>
						</div>

						{#if category.subcategories?.length}
							<p class="mb-1 font-mono text-[0.6rem] tracking-[0.18em] text-gold/80 uppercase">
								{category.subcategories.length} Collections
							</p>
						{/if}

						<h3
							class="font-serif text-[1.45rem] leading-tight font-extrabold tracking-tight text-white uppercase transition-colors duration-300"
						>
							{category.name}
						</h3>

						{#if category.description}
							<p class="mt-2 line-clamp-2 text-[0.85rem] leading-relaxed text-white/65">
								{category.description}
							</p>
						{/if}

						<span
							class="mt-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 py-2 pr-2 pl-4 text-[0.7rem] font-semibold tracking-wide text-white uppercase backdrop-blur-md transition-all duration-300 group-hover:border-gold/50 group-hover:bg-gold group-hover:text-pine-dark"
						>
							View Products
							<span
								class="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-pine-dark group-hover:text-gold"
							>
								<svg
									width="12"
									height="12"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M3 8h10" />
									<path d="M9 4l4 4-4 4" />
								</svg>
							</span>
						</span>
					</div>
				</a>
			{/each}
		</div>
	</div>
</section>
