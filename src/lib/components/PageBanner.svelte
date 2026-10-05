<script lang="ts">
	import { onMount } from 'svelte';
	import catBanner from '$lib/images/cat_banner_1.png';
	import catBanner1 from '$lib/images/catbanner_2.png';
	import type { PromoBanner, Subcategory } from '$lib/api/types';
	import { getImageUrl } from '$lib/utils/image';

	import type { CategoryData } from '$lib/api/types';
	import { getCategoryUrl } from '$lib/utils/url';

	interface Props {
		banners?: PromoBanner[];
		subcategories?: Subcategory[];
		onselectsubcategory?: (id: number) => void;
	}

	let { banners = [], subcategories = [], onselectsubcategory }: Props = $props();

	interface CategoryCard {
		key: string;
		title: string;
		subtitle: string;
		color: string;
		textColor: string;
		icon: string;
		photo: string;
		href: string;
	}

	const cardColors = ['var(--green)', 'var(--meat-red)', 'var(--herb-purple)', 'var(--bev-orange)'];
	const cardTextColors = [
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

	// const categoryCards = $derived<CategoryCard[]>(
	// 	(categories ?? []).map((cat, i) => ({
	// 		key: String(cat.id),
	// 		title: cat.name,
	// 		subtitle: cat.description,
	// 		color: cardColors[i % cardColors.length],
	// 		textColor: cardTextColors[i % cardTextColors.length],
	// 		icon: cardIcons[i % cardIcons.length],
	// 		photo: getImageUrl(cat.featured_image, catBanner),
	// 		href: getCategoryUrl(cat)
	// 	}))
	// );

	interface Slide {
		id: number | string;
		image: string;
		link: string | null;
		banner: PromoBanner | null;
	}

	const fallbackBackgrounds = [catBanner, catBanner1];

	// API-driven slides; falls back to demo imagery when backend returns none
	const slides = $derived.by<Slide[]>(() => {
		const active = (banners ?? []).filter((b) => b.is_active && b.image);
		if (active.length > 0) {
			return active.map((b) => ({
				id: b.id,
				image: getImageUrl(b.image, catBanner),
				link: b.link,
				banner: b
			}));
		}
		return fallbackBackgrounds.map((image, i) => ({
			id: `fallback-${i}`,
			image,
			link: null,
			banner: null
		}));
	});

	let current = $state(0);

	const activeSlide = $derived(slides[current] ?? null);

	$effect(() => {
		if (current >= slides.length) current = 0;
	});
	let timer: ReturnType<typeof setInterval> | undefined;

	const SLIDE_MS = 5000;

	function goTo(i: number) {
		current = i;
		restartTimer();
	}

	function next() {
		current = (current + 1) % slides.length;
	}

	function restartTimer() {
		clearInterval(timer);
		timer = setInterval(() => {
			if (!document.hidden) next();
		}, SLIDE_MS);
	}

	function selectSubcategory(id: number) {
		onselectsubcategory?.(id);
	}

	const chipAccents = ['--green', '--meat-red', '--herb-purple', '--bev-orange'];

	onMount(() => {
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!reduceMotion) restartTimer();
		return () => clearInterval(timer);
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Poppins:wght@400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<section class="hero">
	<!-- Sliding background layer (fixed behind content) -->
	<div class="bg-slider" aria-hidden="true">
		{#each slides as slide, i (slide.id)}
			<div
				class="slide"
				class:active={i === current}
				style="background-image:url('{slide.image}')"
			></div>
		{/each}
		<!-- <div class="slide-overlay"></div> -->
	</div>

	<div class="dots" aria-label="Background slides">
		{#each slides as _, i}
			<button
				type="button"
				class="dot"
				class:active={i === current}
				aria-label="Show slide {i + 1}"
				aria-current={i === current}
				onclick={() => goTo(i)}
			></button>
		{/each}
	</div>

	{#if subcategories.length > 0}
		<nav class="subcat-menu" aria-label="Subcategories">
			<span class="subcat-label">
				<svg
					viewBox="0 0 24 24"
					aria-hidden="true"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				>
					<path d="M5 6h14M5 12h14M5 18h14" />
					<circle cx="3" cy="6" r="0.8" fill="currentColor" />
					<circle cx="3" cy="12" r="0.8" fill="currentColor" />
					<circle cx="3" cy="18" r="0.8" fill="currentColor" />
				</svg>
				Categories
			</span>
			<div class="subcat-scroll" role="list">
				{#each subcategories as sub, i (sub.id)}
					<button
						type="button"
						role="listitem"
						class="subcat"
						data-subcat-id={sub.id}
						style="--accent: var({chipAccents[i % chipAccents.length]})"
						onclick={() => selectSubcategory(sub.id)}
					>
						<span class="subcat-thumb-wrap">
							{#if sub.featured_image}
								<span
									class="subcat-thumb"
									style="background-image:url('{getImageUrl(sub.featured_image)}')"
								></span>
							{:else}
								<span class="subcat-thumb subcat-thumb--fallback"></span>
							{/if}
						</span>
						<span class="subcat-name">{sub.name}</span>
						<span class="subcat-arrow" aria-hidden="true">
							<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
						</span>
					</button>
				{/each}
			</div>
		</nav>
	{/if}

	<div class="hills">
		<div class="hill hill--1"></div>
		<div class="hill hill--2"></div>
		<div class="hill hill--3"></div>
	</div>
	<div class="leaf-decor right"></div>

	<div class="content-row">
		<!-- LEFT: headline + copy -->
		<div class="left-col">
			<div class="eyebrow">{activeSlide?.banner?.title || 'Pure. Natural.'}</div>
			<div class="headline-script">{activeSlide?.banner?.primary_text || 'From Nature'}</div>

			<div class="divider-row">
				<span class="line"></span>
				<span class="leaf-icon">🌿</span>
				<span class="line"></span>
			</div>

			<p class="tagline">
				{activeSlide?.banner?.secondary_text ||
					'Bringing you the finest quality products from local farms and authentic sources. Healthy choices for a better tomorrow.'}
			</p>

			<div class="badge">
				<svg viewBox="0 0 24 24">
					<path
						d="M12 2C7 2 3 6 3 11c0 4 3 7 7 7 1 0 2-.2 2.8-.6C11.6 21 9 22 9 22h6s-2.6-1-3.8-4.6c3.6-1 6.8-4.1 6.8-8.4 0-5-4-7-6-7z"
					/>
				</svg>
				NATURAL &bull; PURE &bull; TRUSTED
			</div>
		</div>

		<!-- RIGHT: category card grid -->
		<!-- <div class="card-grid"> -->
		<!-- {#each categoryCards as cat (cat.key)}
				<a
					href={cat.href}
					class="card card--{cat.key}"
					style="background-image: linear-gradient(
							180deg,
							rgba(251, 250, 246, 0.95) 0%,
							rgba(251, 250, 246, 0.75) 45%,
							rgba(251, 250, 246, 0.08) 100%
						), url('{cat.photo}'); --accent: {cat.color}; --accent-text: {cat.textColor}"
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
					<h3>{cat.title}</h3>
					<div class="mini-line"></div>
					<p class="sub" style="color:{cat.textColor}">{cat.subtitle}</p>
				</a>
			{/each} -->
		<!-- </div> -->
	</div>
</section>

<style>
	:global(body) {
		margin: 0;
		background: #0d1f10;
	}

	.hero {
		--green-dark: #1f3d24;
		--green: #2e5d34;
		--meat-red: #8c3a2b;
		--herb-purple: #5b3a86;
		--bev-orange: #e0902f;
		--cream: #fbfaf6;
		--text-dark: #1e2a1e;
		--text-muted: #4a4a45;
		--radius-card: 18px;
		--shadow-card: 0 18px 40px rgba(20, 40, 20, 0.18);

		font-family: 'Poppins', sans-serif;
		position: relative;
		height: 540px;
		max-height: 540px;
		display: flex;
		align-items: stretch;
		overflow: hidden;
		background:
			linear-gradient(
				180deg,
				rgba(10, 20, 10, 0.05) 0%,
				rgba(10, 25, 10, 0.35) 55%,
				rgba(6, 16, 8, 0.75) 100%
			),
			linear-gradient(180deg, #bfe3f2 0%, #d9edcf 30%, #8fbf6a 55%, #5f9450 75%, #3f6b3a 100%);
	}

	/* .hills {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
	}
	.hill {
		position: absolute;
		left: -10%;
		width: 120%;
		border-radius: 50% 50% 0 0 / 100% 100% 0 0;
	}
	.hill--1 {
		bottom: 26%;
		height: 220px;
		background: #6f9d55;
		opacity: 0.4;
	}
	.hill--2 {
		bottom: 14%;
		height: 260px;
		background: #557c3f;
		opacity: 0.5;
	}
	.hill--3 {
		bottom: 0;
		height: 220px;
		background: #3c5c2e;
		opacity: 0.65;
	} */

	.bg-slider {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
	}
	.slide {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		opacity: 0;
		transform: scale(1.08);
		transition:
			opacity 1.4s ease-in-out,
			transform 7s ease-out;
		will-change: opacity, transform;
	}
	.slide.active {
		opacity: 1;
		transform: scale(1);
	}
	.slide-overlay {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				180deg,
				rgba(10, 20, 10, 0.15) 0%,
				rgba(10, 25, 10, 0.4) 55%,
				rgba(6, 16, 8, 0.78) 100%
			),
			linear-gradient(90deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 45%);
	}

	.dots {
		position: absolute;
		bottom: 18px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 10px;
		z-index: 4;
	}
	.dot {
		width: 11px;
		height: 11px;
		padding: 0;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.85);
		background: transparent;
		cursor: pointer;
		transition:
			background 0.3s ease,
			transform 0.3s ease;
	}
	.dot.active {
		background: #fff;
		transform: scale(1.2);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
	}

	.subcat-menu {
		position: absolute;
		left: 50%;
		bottom: clamp(10px, 2vh, 80px);
		transform: translateX(-50%);
		z-index: 12;
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: calc(100% - 48px);
		padding: 9px 12px 9px 16px;
		background: linear-gradient(135deg, #2b6d4c, #1f5138);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border: 1px solid rgba(20, 40, 20, 0.12);
		border-radius: 24px;
		box-shadow:
			0 20px 46px rgba(20, 40, 20, 0.28),
			inset 0 1px 0 rgba(255, 255, 255, 0.7);
		animation: subcat-menu-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}
	@keyframes subcat-menu-in {
		from {
			opacity: 0;
			transform: translate(-50%, 24px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0) scale(1);
		}
	}
	.subcat-label {
		flex-shrink: 0;
		align-self: center;
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: 'Poppins', sans-serif;
		font-size: 0.64rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #fff;
		padding-right: 10px;
		border-right: 1px solid rgba(20, 40, 20, 0.16);
		margin-right: 2px;
	}
	.subcat-label svg {
		width: 16px;
		height: 16px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.subcat-scroll {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		max-width: 100%;
	}
	.subcat-scroll::-webkit-scrollbar {
		display: none;
	}
	.subcat {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
		cursor: pointer;
		border: 1px solid rgba(20, 60, 30, 0.08);
		background: rgba(255, 255, 255, 0.9);
		padding: 6px 10px 6px 6px;
		border-radius: 30px;
		box-shadow: 0 4px 12px rgba(20, 40, 20, 0.1);
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		font-size: 0.8rem;
		color: var(--green-dark);
		transition:
			background 0.25s ease,
			color 0.25s ease,
			transform 0.25s ease,
			box-shadow 0.25s ease,
			border-color 0.25s ease;
	}
	.subcat:hover {
		background: var(--accent, var(--green-dark));
		border-color: var(--accent, var(--green-dark));
		color: #fff;
		transform: translateY(-2px);
		box-shadow: 0 14px 26px rgba(20, 40, 20, 0.32);
	}
	.subcat:active {
		transform: translateY(0);
	}
	.subcat-thumb-wrap {
		position: relative;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		border-radius: 50%;
		background: var(--accent, var(--green-dark));
		padding: 2px;
	}
	.subcat-thumb {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background-size: cover;
		background-position: center;
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9) inset;
	}
	.subcat-thumb--fallback {
		background: linear-gradient(135deg, var(--accent), var(--green-dark));
	}
	.subcat-name {
		white-space: nowrap;
	}
	.subcat-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: rgba(20, 40, 20, 0.08);
		color: inherit;
		opacity: 0;
		transform: translateX(-4px);
		transition:
			opacity 0.25s ease,
			transform 0.25s ease,
			background 0.25s ease;
	}
	.subcat-arrow svg {
		width: 13px;
		height: 13px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.subcat:hover .subcat-arrow {
		opacity: 1;
		transform: translateX(0);
		background: rgba(255, 255, 255, 0.22);
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
		max-height: 100%;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(20px, 3vw, 40px);
		padding: clamp(16px, 3vh, 40px) clamp(20px, 4vw, 50px);
		align-items: center;
	}

	.left-col {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-bottom: clamp(60px, 12vh, 120px);
		position: relative;
	}

	.eyebrow {
		font-weight: 700;
		font-size: clamp(1.2rem, 2vw, 1.7rem);
		color: var(--green-dark);
		letter-spacing: 0.5px;
		text-shadow: 0 2px 10px rgba(255, 255, 255, 0.35);
	}

	.headline-script {
		font-family: 'Dancing Script', cursive;
		font-weight: 700;
		font-size: clamp(2.6rem, 6vw, 4.4rem);
		line-height: 0.95;
		color: var(--green);
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
		background: var(--green-dark);
		opacity: 0.6;
	}
	.divider-row .leaf-icon {
		font-size: 1rem;
	}

	.tagline {
		font-size: clamp(0.85rem, 1.2vw, 1rem);
		line-height: 1.55;
		color: var(--text-dark);
		max-width: 400px;
		font-weight: 500;
		text-shadow: 0 1px 6px rgba(255, 255, 255, 0.25);
	}

	.badge {
		margin-top: 18px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		width: fit-content;
		background: var(--green-dark);
		color: #fff;
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
	}

	.basket-illustration {
		position: absolute;
		left: -10px;
		bottom: -20px;
		width: clamp(180px, 24vw, 320px);
		z-index: 3;
		filter: drop-shadow(0 14px 18px rgba(0, 0, 0, 0.35));
	}

	/* ---------- CARD GRID: square cells matched to 250x250 images ---------- */
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
		text-align: center;
		text-decoration: none;
		color: inherit;
		background-color: var(--cream);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		border-radius: 5px;
		box-shadow: var(--shadow-card);
		padding: clamp(10px, 1.4vw, 18px) clamp(10px, 1.4vw, 16px) 0;
		overflow: hidden;
		border-bottom: 5px solid var(--accent);
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
		width: 100%;
		height: 100%;
	}
	/* Category cards: own staggered entrance (independent of pipeline GSAP) */
	.card {
		animation: cat-card-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}
	.card:nth-child(1) {
		animation-delay: 0.05s;
	}
	.card:nth-child(2) {
		animation-delay: 0.17s;
	}
	.card:nth-child(3) {
		animation-delay: 0.29s;
	}
	.card:nth-child(4) {
		animation-delay: 0.41s;
	}
	@keyframes cat-card-in {
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
		margin: 0 0 10px;
		font-weight: 500;
		flex-shrink: 0;
	}

	.card-photo {
		width: 100%;
		flex: 1;
		min-height: 0;
		border-radius: 12px 12px 0 0;
		background-size: cover;
		background-position: center;
	}

	@media (max-width: 1000px) {
		.hero {
			height: auto;
			min-height: 100vh;
			max-height: none;
			overflow: visible;
		}
		.subcat-menu {
			bottom: clamp(96px, 20vh, 120px);
			left: 50%;
			transform: translateX(-50%);
			width: calc(100% - 32px);
			justify-content: flex-start;
		}
		.subcat-scroll {
			max-width: 100%;
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
		.tagline {
			max-width: 100%;
		}
		.basket-illustration {
			position: static;
			margin: 24px auto 0;
			width: 220px;
		}
		.card-grid {
			grid-template-columns: repeat(2, min(250px, 42vw));
			grid-auto-rows: min(250px, 42vw);
			gap: 10px;
		}
		.card {
			padding: 10px 8px 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			animation: none;
			transition: none;
		}
		.slide {
			transition: none;
			transform: none;
		}
	}
</style>
