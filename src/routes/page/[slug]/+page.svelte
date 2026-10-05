<script lang="ts">
	import { onMount } from 'svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { getImageUrl } from '$lib/utils/image';
	import { base } from '$app/paths';

	let { data } = $props();
	let page = $derived(data.pageDetails);
	let settings = $derived(data.settingsData);
	let visible = $state(false);

	function formatDate(raw: string) {
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

	onMount(() => {
		requestAnimationFrame(() => (visible = true));
	});
</script>

<svelte:head>
	<title>{page?.name ?? 'Page'} | {settings?.site_title ?? 'EPM'}</title>
	<meta name="description" content={page?.name ?? ''} />
</svelte:head>

<!-- Hero -->
<section class="hero">
	<div class="hero-shapes" aria-hidden="true">
		<div class="shape shape-1"></div>
		<div class="shape shape-2"></div>
		<div class="shape shape-3"></div>
	</div>
	<div class="container">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href="{base}/">Home</a>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg
			>
			<span class="current">{page?.name ?? 'Page'}</span>
		</nav>
		<h1 class="hero-title">{page?.name ?? 'Page'}</h1>
		<div class="hero-accent" aria-hidden="true"></div>
	</div>
</section>

<!-- Content -->
<main class="content" class:visible>
	<div class="container">
		<article class="article">
			{#if page?.featured_image}
				<div class="cover">
					<img
						src={getImageUrl(page.featured_image)}
						alt={page.name}
						loading="eager"
						decoding="async"
					/>
					<div class="cover-overlay" aria-hidden="true"></div>
				</div>
			{/if}

			<div class="article-card">
				<div class="article-body">
					{@html page?.page_content ?? ''}
				</div>
			</div>
		</article>
	</div>
</main>

<Footer />

<style>
	/* ── Hero ── */
	.hero {
		position: relative;
		background: linear-gradient(160deg, #0b5d1e 0%, #0a4a18 40%, #073d12 100%);
		padding: 80px 0 64px;
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
		max-width: 860px;
		margin: 0 auto;
		padding: 0 24px;
		position: relative;
		z-index: 1;
	}
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 500;
		margin-bottom: 20px;
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
	}
	.hero-title {
		font-size: clamp(2.2rem, 5vw, 3.5rem);
		font-weight: 800;
		color: #fff;
		line-height: 1.15;
		letter-spacing: -1px;
		margin: 0;
	}
	.hero-accent {
		width: 60px;
		height: 4px;
		border-radius: 2px;
		background: linear-gradient(90deg, #d4a017, #f5d998);
		margin-top: 20px;
	}

	/* ── Content ── */
	.content {
		padding: 56px 0 96px;
		background: linear-gradient(180deg, #f4f1eb 0%, #faf8f4 40%, #fff 100%);
		min-height: 60vh;
		opacity: 0;
		transform: translateY(16px);
		transition:
			opacity 0.5s ease,
			transform 0.5s ease;
	}
	.content.visible {
		opacity: 1;
		transform: translateY(0);
	}
	.article {
		max-width: 800px;
		margin: 0 auto;
	}
	.cover {
		position: relative;
		border-radius: 20px;
		overflow: hidden;
		aspect-ratio: 21 / 9;
		margin-bottom: 32px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}
	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.4s ease;
	}
	.cover:hover img {
		transform: scale(1.02);
	}
	.cover-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent 50%, rgba(0, 0, 0, 0.15) 100%);
		pointer-events: none;
	}
	.article-card {
		background: #fff;
		border-radius: 20px;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.03),
			0 8px 32px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.04);
		overflow: hidden;
	}
	.article-meta {
		padding: 24px 36px 0;
	}
	.meta-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		font-weight: 600;
		color: #9ca3af;
		background: #f5f5f5;
		padding: 5px 12px;
		border-radius: 50px;
	}
	.meta-badge svg {
		opacity: 0.5;
	}

	/* ── Article body (rendered HTML) ── */
	.article-body {
		padding: 28px 36px 48px;
		font-size: 1.05rem;
		line-height: 1.9;
		color: #374151;
	}

	.article-body :global(h1),
	.article-body :global(h2),
	.article-body :global(h3),
	.article-body :global(h4),
	.article-body :global(h5),
	.article-body :global(h6) {
		color: #111827;
		font-weight: 750;
		line-height: 1.3;
		margin-top: 2.2em;
		margin-bottom: 0.5em;
	}
	.article-body :global(h1) {
		font-size: 2.2rem;
		letter-spacing: -0.5px;
	}
	.article-body :global(h2) {
		font-size: 1.65rem;
		letter-spacing: -0.3px;
		padding-bottom: 10px;
		border-bottom: 2px solid #f0f0f0;
	}
	.article-body :global(h3) {
		font-size: 1.3rem;
	}
	.article-body :global(h4) {
		font-size: 1.1rem;
		font-weight: 650;
	}

	.article-body :global(p) {
		margin: 0 0 1.3em;
	}

	.article-body :global(a) {
		color: #0b5d1e;
		text-decoration: none;
		font-weight: 600;
		background: linear-gradient(180deg, transparent 60%, rgba(11, 93, 30, 0.1) 60%);
		padding: 0 2px;
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}
	.article-body :global(a:hover) {
		color: #d4a017;
		background: linear-gradient(180deg, transparent 60%, rgba(212, 160, 23, 0.15) 60%);
	}

	.article-body :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 12px;
		margin: 1.5em 0;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
	}

	.article-body :global(ul),
	.article-body :global(ol) {
		padding-left: 0;
		list-style: none;
		margin: 0 0 1.3em;
	}
	.article-body :global(ul li),
	.article-body :global(ol li) {
		position: relative;
		padding-left: 1.6em;
		margin-bottom: 0.5em;
	}
	.article-body :global(ul li)::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.6em;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: linear-gradient(135deg, #0b5d1e, #1a8a32);
	}
	.article-body :global(ol) {
		counter-reset: item;
	}
	.article-body :global(ol li) {
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

	.article-body :global(blockquote) {
		border: none;
		padding: 20px 24px;
		margin: 2em 0;
		background: linear-gradient(135deg, #f8f6f1, #f5f1ea);
		border-radius: 12px;
		border-left: 4px solid #d4a017;
		font-style: italic;
		color: #6b7280;
		position: relative;
	}
	.article-body :global(blockquote)::before {
		content: '\201C';
		position: absolute;
		top: 8px;
		left: 16px;
		font-size: 3rem;
		color: #d4a017;
		opacity: 0.2;
		font-family: Georgia, serif;
		line-height: 1;
	}

	.article-body :global(hr) {
		border: none;
		height: 1px;
		background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
		margin: 2.5em 0;
	}

	.article-body :global(table) {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		margin: 1.5em 0;
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

	/* ── Responsive ── */
	@media (max-width: 640px) {
		.hero {
			padding: 60px 0 44px;
		}
		.hero-title {
			letter-spacing: -0.5px;
		}
		.content {
			padding: 36px 0 64px;
		}
		.cover {
			border-radius: 14px;
			aspect-ratio: 16 / 9;
			margin-bottom: 20px;
		}
		.article-card {
			border-radius: 14px;
		}
		.article-meta {
			padding: 18px 20px 0;
		}
		.article-body {
			padding: 22px 20px 36px;
			font-size: 1rem;
		}
	}
</style>
