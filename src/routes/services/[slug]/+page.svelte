<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { resolve } from '$app/paths';
	import { getImageUrl } from '$lib/utils/image';
	import bg from '$lib/images/bg.png';

	let { data } = $props();
	const service = $derived(data.service);

	let visible = $state(false);
	let root: HTMLElement | undefined = $state();

	function formatDate(raw: string | null) {
		if (!raw) return '';
		try {
			return new Date(raw).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return raw;
		}
	}

	function scrollToContact() {
		document.getElementById('service-cta')?.scrollIntoView({ behavior: 'smooth' });
	}

	onMount(() => {
		requestAnimationFrame(() => (visible = true));
		gsap.registerPlugin(ScrollTrigger);

		const ctx = gsap.context(() => {
			gsap.from('.reveal', {
				opacity: 0,
				y: 30,
				duration: 0.7,
				stagger: 0.1,
				ease: 'power2.out',
				scrollTrigger: { trigger: root, start: 'top 95%', toggleActions: 'play none none none' }
			});
		}, root);

		return () => ctx.revert();
	});
</script>

<svelte:head>
	<title>{service?.name ?? 'Service'} | AFCRC</title>
	<meta name="description" content={service?.short_description ?? service?.name ?? ''} />
</svelte:head>

<!-- ── Hero ─────────────────────────────────────────── -->
<section class="hero">
	<div class="hero-shapes" aria-hidden="true">
		<div class="shape shape-1"></div>
		<div class="shape shape-2"></div>
		<div class="shape shape-3"></div>
	</div>
	<div class="hero-content container" class:loaded={visible}>
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href={resolve('/')}>Home</a>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<polyline points="9 18 15 12 9 6" />
			</svg>
			<span class="current">{service?.name ?? 'Service'}</span>
		</nav>

		<h1 class="hero-title">{service?.name ?? 'Service'}</h1>
		{#if service?.short_description}
			<p class="hero-sub">{service.short_description}</p>
		{/if}
		<div class="hero-actions">
			<a
				class="btn btn-primary"
				href="https://www.facebook.com/profile.php?id=100066542056042"
				target="_blank"
				rel="noopener">Get In Touch</a
			>
			<a class="btn btn-ghost" href="#service-content">Learn More</a>
		</div>
		<div class="hero-accent" aria-hidden="true"></div>
	</div>
</section>
<section class="bg-paper-white py-[100px] max-md:py-16">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<article class="article-card">
			<div class="article-header">
				<!-- <h2 class="article-heading">{service?.name ?? 'this service'}</h2> -->
				<div class="article-line" aria-hidden="true"></div>
			</div>
			<div class="article-body">
				{#if service?.content}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- admin-authored CMS content -->
					{@html service.content}
				{:else}
					<p>
						For more information about this service, please reach out to our team — we will be happy
						to share full details, pricing and how we can support you.
					</p>
				{/if}
			</div>
		</article>
	</div>
</section>

<!-- ── CTA ──────────────────────────────────────────── -->
<section class="cta" id="service-cta">
	<div class="cta-bg" style="background-image: url({bg})"></div>
	<div class="cta-overlay"></div>
	<div class="cta-inner">
		<div class="cta-icon" aria-hidden="true">
			<svg
				width="26"
				height="26"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M3 11l9-8 9 8" />
				<path d="M5 9.5V21h14V9.5" />
				<path d="M9 21v-6h6v6" />
			</svg>
		</div>
		<p class="cta-eyebrow">Let's work together</p>
		<h2 class="cta-title">Ready to get started with {service?.name ?? 'our services'}?</h2>
		<p class="cta-text">
			Our team is ready to understand your requirements and guide you through the next steps. Get in
			touch and we'll respond promptly.
		</p>
		<div class="cta-divider" aria-hidden="true">
			<span></span>
			<i></i>
			<span></span>
		</div>
		<a
			class="cta-btn"
			href="https://www.facebook.com/profile.php?id=100066542056042"
			target="_blank"
			rel="noopener"
		>
			Contact Us
			<span class="cta-btn-arrow" aria-hidden="true">▯</span>
		</a>
	</div>
</section>

<style>
	/* ── Hero ── */
	.hero {
		position: relative;
		background: linear-gradient(160deg, #0b5d1e 0%, #0a4a18 40%, #073d12 100%);
		padding: 96px 0 56px;
		overflow: hidden;
	}
	.hero-shapes {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.shape {
		position: absolute;
		border-radius: 50%;
		opacity: 0.06;
		background: #fff;
	}
	.shape-1 {
		width: 400px;
		height: 400px;
		top: -120px;
		right: -80px;
		animation: float 20s ease-in-out infinite;
	}
	.shape-2 {
		width: 250px;
		height: 250px;
		bottom: -60px;
		left: 10%;
		animation: float 15s ease-in-out infinite reverse;
	}
	.shape-3 {
		width: 150px;
		height: 150px;
		top: 20%;
		left: 40%;
		animation: float 18s ease-in-out infinite 2s;
	}
	@keyframes float {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(15px, -20px) scale(1.05);
		}
		66% {
			transform: translate(-10px, 10px) scale(0.95);
		}
	}
	.container {
		max-width: 1180px;
		margin: 0 auto;
		padding: 0 24px;
		position: relative;
		z-index: 1;
	}
	.hero-content {
		opacity: 0;
		transform: translateY(18px);
		transition:
			opacity 0.6s ease,
			transform 0.6s ease;
	}
	.hero-content.loaded {
		opacity: 1;
		transform: translateY(0);
	}
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 500;
		margin-bottom: 22px;
	}
	.breadcrumb a {
		color: rgba(255, 255, 255, 0.55);
		text-decoration: none;
		transition: color 0.2s ease;
	}
	.breadcrumb a:hover {
		color: #fff;
	}
	.breadcrumb svg {
		color: rgba(255, 255, 255, 0.3);
		flex-shrink: 0;
	}
	.breadcrumb .current {
		color: rgba(255, 255, 255, 0.85);
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 360px;
	}
	.hero-title {
		font-size: clamp(2.4rem, 5.5vw, 3.8rem);
		font-weight: 800;
		color: #fff;
		line-height: 1.12;
		letter-spacing: -1px;
		margin: 0;
	}
	.hero-sub {
		color: rgba(255, 255, 255, 0.78);
		font-size: 1.12rem;
		line-height: 1.75;
		max-width: 680px;
		margin: 20px 0 0;
	}
	.hero-actions {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 30px;
		flex-wrap: wrap;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		padding: 13px 26px;
		border-radius: 999px;
		text-decoration: none;
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease,
			background 0.25s ease,
			color 0.25s ease,
			border-color 0.25s ease;
	}
	.btn-primary {
		background: linear-gradient(90deg, #d4a017, #f5d998);
		color: #173a12;
		border: 1px solid rgba(212, 160, 23, 0.7);
		box-shadow: 0 12px 30px -12px rgba(0, 0, 0, 0.5);
	}
	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 18px 40px -12px rgba(251, 233, 186, 0.5);
	}
	.btn-ghost {
		border: 1px solid rgba(255, 255, 255, 0.35);
		color: #fff;
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(4px);
	}
	.btn-ghost:hover {
		background: rgba(255, 255, 255, 0.14);
		border-color: rgba(255, 255, 255, 0.6);
		transform: translateY(-2px);
	}
	.hero-accent {
		width: 60px;
		height: 4px;
		border-radius: 2px;
		background: linear-gradient(90deg, #d4a017, #f5d998);
		margin-top: 28px;
	}

	/* ── Content ── */
	.content {
		padding: 96px 0 56px;
		/* background: linear-gradient(180deg, #f4f1eb 0%, #faf8f4 40%, #fff 100%);
		min-height: 60vh; */
	}
	.top-grid {
		display: grid;
		grid-template-columns: 1.6fr 1fr;
		gap: 28px;
		align-items: start;
		margin-bottom: 40px;
	}
	.cover {
		border-radius: 20px;
		overflow: hidden;
		aspect-ratio: 21 / 12;
		min-height: 260px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}
	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.quick-facts {
		background: #fff;
		border-radius: 20px;
		border: 1px solid rgba(0, 0, 0, 0.05);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.03),
			0 8px 32px rgba(0, 0, 0, 0.05);
		padding: 26px 28px;
	}
	.facts-title {
		font-size: 1.05rem;
		font-weight: 750;
		color: #111827;
		margin: 0 0 16px;
		letter-spacing: -0.3px;
	}
	.fact-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 0;
		border-top: 1px solid #f0f0f0;
		font-size: 0.9rem;
	}
	.fact-label {
		color: #9ca3af;
		font-weight: 500;
		flex-shrink: 0;
	}
	.fact-value {
		color: #374151;
		text-align: right;
		line-height: 1.5;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		justify-content: flex-end;
	}
	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #dc2626;
		flex-shrink: 0;
	}
	.status-dot.active {
		background: #16a34a;
	}
	.fact-cta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		margin-top: 18px;
		padding: 13px 20px;
		border-radius: 999px;
		border: none;
		background: linear-gradient(90deg, #0b5d1e, #1a8a32);
		color: #fff;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease;
	}
	.fact-cta:hover {
		transform: translateY(-2px);
		box-shadow: 0 14px 30px -10px rgba(11, 93, 30, 0.55);
	}

	.article-card {
		/* background: #fff; */
		border-radius: 20px;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.03),
			0 8px 32px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.04);
		overflow: hidden;
	}
	.article-header {
		padding: 30px 36px 0;
	}
	.article-heading {
		font-size: 1.5rem;
		font-weight: 750;
		color: #111827;
		margin: 0;
		letter-spacing: -0.4px;
	}
	.article-line {
		width: 46px;
		height: 3px;
		border-radius: 2px;
		background: linear-gradient(90deg, #0b5d1e, #1a8a32);
		margin-top: 12px;
	}

	/* ── Article body (Tiptap rich-text) ── */
	.article-body {
		padding: 28px 36px 52px;
		font-size: 1.05rem;
		line-height: 1.85;
		color: #374151;
	}

	/* ── Headings ── */
	.article-body :global(h1),
	.article-body :global(h2),
	.article-body :global(h3),
	.article-body :global(h4),
	.article-body :global(h5),
	.article-body :global(h6) {
		color: #111827;
		font-weight: 700;
		line-height: 1.3;
		margin-top: 2em;
		margin-bottom: 0.6em;
	}
	.article-body :global(h1) {
		font-size: 2rem;
		letter-spacing: -0.5px;
	}
	.article-body :global(h2) {
		font-size: 1.55rem;
		letter-spacing: -0.3px;
		padding-bottom: 10px;
		border-bottom: 2px solid #f0f0f0;
	}
	.article-body :global(h3) {
		font-size: 1.25rem;
	}
	.article-body :global(h4) {
		font-size: 1.1rem;
	}
	.article-body :global(h5),
	.article-body :global(h6) {
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.4px;
		color: #6b7280;
	}

	/* ── Paragraphs ── */
	.article-body :global(p) {
		margin: 0 0 1.3em;
	}

	/* ── Inline text ── */
	.article-body :global(strong) {
		font-weight: 700;
		color: #111827;
	}
	.article-body :global(em) {
		font-style: italic;
	}
	.article-body :global(s) {
		text-decoration: line-through;
		color: #9ca3af;
	}
	.article-body :global(u) {
		text-decoration-color: rgba(11, 93, 30, 0.3);
		text-underline-offset: 3px;
	}

	/* ── Links ── */
	.article-body :global(a) {
		color: #0b5d1e;
		text-decoration: none;
		font-weight: 600;
		background: linear-gradient(180deg, transparent 60%, rgba(11, 93, 30, 0.12) 60%);
		padding: 0 2px;
		transition: color 0.2s ease;
	}
	.article-body :global(a:hover) {
		color: #d4a017;
		background: linear-gradient(180deg, transparent 60%, rgba(212, 160, 23, 0.15) 60%);
	}

	/* ── Inline code ── */
	.article-body :global(code) {
		font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
		font-size: 0.88em;
		background: rgba(11, 93, 30, 0.07);
		color: #0b5d1e;
		padding: 2px 7px;
		border-radius: 5px;
		word-break: break-word;
	}

	/* ── Code blocks ── */
	.article-body :global(pre) {
		background: #1e293b;
		color: #e2e8f0;
		padding: 20px 24px;
		border-radius: 12px;
		overflow-x: auto;
		margin: 1.6em 0;
		font-size: 0.9rem;
		line-height: 1.7;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}
	.article-body :global(pre code) {
		background: none;
		color: inherit;
		padding: 0;
		border-radius: 0;
		font-size: inherit;
	}

	/* ── Images ── */
	.article-body :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 12px;
		margin: 1.8em 0;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
	}

	/* ── Unordered lists ── */
	.article-body :global(ul) {
		padding-left: 0;
		list-style: none;
		margin: 0 0 1.3em;
	}
	.article-body :global(ul li) {
		position: relative;
		padding-left: 1.6em;
		margin-bottom: 0.55em;
	}
	.article-body :global(ul li)::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.65em;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: linear-gradient(135deg, #0b5d1e, #1a8a32);
	}

	/* ── Ordered lists ── */
	.article-body :global(ol) {
		padding-left: 0;
		list-style: none;
		margin: 0 0 1.3em;
		counter-reset: item;
	}
	.article-body :global(ol li) {
		position: relative;
		padding-left: 2.2em;
		margin-bottom: 0.55em;
		counter-increment: item;
	}
	.article-body :global(ol li)::before {
		content: counter(item);
		position: absolute;
		left: 0;
		top: 0;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #0b5d1e;
		color: #fff;
		font-size: 12px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ── Nested lists ── */
	.article-body :global(li ul),
	.article-body :global(li ol) {
		margin: 0.5em 0 0;
	}
	.article-body :global(li ul li)::before {
		background: linear-gradient(135deg, #1a8a32, #22c55e);
		width: 6px;
		height: 6px;
	}

	/* ── Task lists (Tiptap checkbox) ── */
	.article-body :global(.taskListitem) {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding-left: 0 !important;
		margin-bottom: 0.55em;
	}
	.article-body :global(.taskListitem)::before {
		display: none !important;
	}
	.article-body :global(.taskListitem-label) {
		flex: 1;
	}
	.article-body :global(.taskListitem input[type='checkbox']) {
		margin-top: 0.35em;
		width: 17px;
		height: 17px;
		accent-color: #0b5d1e;
		flex-shrink: 0;
		cursor: pointer;
		border-radius: 4px;
	}

	/* ── Blockquote ── */
	.article-body :global(blockquote) {
		border: none;
		padding: 22px 28px;
		margin: 2em 0;
		background: linear-gradient(135deg, #f8f6f1, #f5f1ea);
		border-radius: 12px;
		border-left: 4px solid #d4a017;
		font-style: italic;
		color: #6b7280;
		position: relative;
	}
	.article-body :global(blockquote p) {
		margin-bottom: 0.5em;
	}
	.article-body :global(blockquote p:last-child) {
		margin-bottom: 0;
	}
	.article-body :global(blockquote)::before {
		content: '\201C';
		position: absolute;
		top: 10px;
		left: 16px;
		font-size: 3rem;
		color: #d4a017;
		opacity: 0.2;
		font-family: Georgia, serif;
		line-height: 1;
	}

	/* ── Horizontal rule ── */
	.article-body :global(hr) {
		border: none;
		height: 1px;
		background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
		margin: 2.5em 0;
	}

	/* ── Table ── */
	.article-body :global(table) {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		margin: 1.8em 0;
		font-size: 0.95rem;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
		border: 1px solid #e5e7eb;
	}
	.article-body :global(th),
	.article-body :global(td) {
		padding: 12px 16px;
		border-bottom: 1px solid #f0f0f0;
		text-align: left;
	}
	.article-body :global(tr:last-child td) {
		border-bottom: none;
	}
	.article-body :global(th) {
		background: #0b5d1e;
		color: #fff;
		font-weight: 600;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.article-body :global(tr:hover td) {
		background: #fafaf8;
	}

	/* ── Text alignment (Tiptap) ── */
	.article-body :global([style*='text-align: center']) {
		text-align: center;
	}
	.article-body :global([style*='text-align: right']) {
		text-align: right;
	}
	.article-body :global([style*='text-align: justify']) {
		text-align: justify;
	}

	/* ── First element top margin ── */
	.article-body :global(:first-child) {
		margin-top: 0;
	}
	.article-body :global(:last-child) {
		margin-bottom: 0;
	}

	/* ── CTA ── */
	.cta {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		padding: 88px 24px;
	}
	.cta-bg {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}
	.cta-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			rgba(0, 0, 0, 0.72) 0%,
			rgba(0, 0, 0, 0.52) 50%,
			rgba(0, 0, 0, 0.72) 100%
		);
		background: linear-gradient(
			160deg,
			rgba(23, 83, 58, 0.72) 0%,
			rgba(23, 83, 58, 0.35) 45%,
			rgba(132, 166, 109, 0.42) 100%
		);
	}
	.cta-inner {
		position: relative;
		z-index: 1;
		max-width: 900px;
		width: 100%;
		color: #fff;
		text-align: center;
	}
	.cta-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		margin: 0 auto 18px;
		border-radius: 50%;
		border: 1px solid rgba(251, 233, 186, 0.5);
		background: rgba(255, 255, 255, 0.1);
		color: #f9e9ba;
		box-shadow: 0 0 30px -6px rgba(251, 233, 186, 0.5);
	}
	.cta-eyebrow {
		color: #f9e9ba;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		margin: 0 0 12px;
	}
	.cta-title {
		font-size: clamp(2.2rem, 5vw, 3.6rem);
		font-weight: 600;
		line-height: 1.08;
		margin: 0 0 18px;
		text-shadow: 0 3px 15px rgba(0, 0, 0, 0.45);
	}
	.cta-text {
		max-width: 640px;
		margin: 0 auto 24px;
		font-size: 1.12rem;
		line-height: 1.85;
		color: rgba(255, 255, 255, 0.95);
	}
	.cta-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 26px;
	}
	.cta-divider span {
		width: 56px;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(249, 233, 186, 0.7));
	}
	.cta-divider span:last-child {
		background: linear-gradient(90deg, rgba(249, 233, 186, 0.7), transparent);
	}
	.cta-divider i {
		width: 5px;
		height: 5px;
		transform: rotate(45deg);
		background: #f9e9ba;
	}
	.cta-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-width: 215px;
		padding: 15px 30px;
		border-radius: 999px;
		border: 1px solid rgba(251, 233, 186, 0.7);
		background: rgba(251, 233, 186, 0.1);
		backdrop-filter: blur(6px);
		color: #f9e9ba;
		font-size: 1.03rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-decoration: none;
		transition: all 0.3s ease;
	}
	.cta-btn:hover {
		background: #f9e9ba;
		color: #17533a;
		transform: translateY(-2px);
		box-shadow: 0 18px 40px -12px rgba(251, 233, 186, 0.55);
	}
	.cta-btn-arrow {
		font-size: 0.9rem;
		transition: transform 0.3s ease;
	}
	.cta-btn:hover .cta-btn-arrow {
		transform: translateX(4px);
	}

	/* ── Responsive ── */
	@media (max-width: 900px) {
		.top-grid {
			grid-template-columns: 1fr;
		}
		.cover {
			aspect-ratio: 16 / 9;
		}
	}
	@media (max-width: 640px) {
		.hero {
			padding: 72px 0 52px;
		}
		.hero-title {
			letter-spacing: -0.5px;
		}
		.content {
			padding: 72px 0 52px;
		}
		.cover {
			border-radius: 14px;
		}
		.article-card {
			border-radius: 14px;
		}
		.article-header {
			padding: 22px 20px 0;
		}
		.article-body {
			padding: 20px 20px 40px;
			font-size: 1rem;
		}
		.quick-facts {
			padding: 20px;
		}
		.hero-actions .btn {
			width: 100%;
		}
		.cta {
			padding: 64px 18px;
		}
	}
</style>
