<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { getImageUrl } from '$lib/utils/image';
	import { resolve } from '$app/paths';
	import bg from '$lib/images/bg.png';

	let { data } = $props();
	const blog = $derived(data.blogsData);

	let visible = $state(false);
	let root: HTMLElement | undefined = $state();
	let progressPct = $state(0);

	const WORDS_PER_MIN = 200;

	function wordCount(html: string) {
		const text = html.replace(/<[^>]+>/g, ' ');
		return text.trim().split(/\s+/).length;
	}

	const totalWords = $derived(wordCount(blog.content));
	const totalMinutes = $derived(Math.max(1, Math.round(totalWords / WORDS_PER_MIN)));

	function injectIds() {
		const article = document.getElementById('article-body');
		if (!article) return;
		let idx = 0;
		article.querySelectorAll('h2, h3').forEach((el) => {
			el.id = `section-${idx++}`;
		});
	}

	function onScroll() {
		const article = document.getElementById('article-body');
		if (!article) return;

		const rect = article.getBoundingClientRect();
		const scrolled = Math.max(0, -rect.top);
		const pct = Math.min(100, Math.round((scrolled / rect.height) * 100));
		progressPct = pct;
	}

	function formatDate(raw: string) {
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

	onMount(() => {
		requestAnimationFrame(() => (visible = true));
		injectIds();
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();

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

		return () => {
			ctx.revert();
			window.removeEventListener('scroll', onScroll);
		};
	});
</script>

<svelte:head>
	<title>{blog.title} | AFCRC</title>
	<meta name="description" content={blog.title} />
</svelte:head>

<!-- Reading progress -->
<div class="progress-wrap" aria-hidden="true">
	<div class="progress-bar" style="width: {progressPct}%"></div>
</div>

<!-- ── Hero ─────────────────────────────────────────── -->
<section class="hero" class:has-image={!!blog.image}>
	{#if blog.image}
		<div class="hero-bg" style="background-image: url({getImageUrl(blog.image)})"></div>
		<div class="hero-overlay"></div>
	{:else}
		<div class="hero-shapes" aria-hidden="true">
			<div class="shape shape-1"></div>
			<div class="shape shape-2"></div>
			<div class="shape shape-3"></div>
		</div>
	{/if}
	<div class="hero-content container" class:loaded={visible}>
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href={resolve('/blogs')}>Blogs</a>
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
			<span class="current">{blog.title}</span>
		</nav>

		<h1 class="hero-title">{blog.title}</h1>

		<div class="post-meta">
			<div class="author">
				<div class="avatar" aria-hidden="true">A</div>
				<span class="author-name">{blog.author || 'Admin'}</span>
			</div>
			<span class="meta-sep"></span>
			<time datetime={blog.created_at}>{formatDate(blog.created_at)}</time>
			<span class="meta-sep"></span>
			<span class="read-time">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
				</svg>
				{totalMinutes} min read
			</span>
		</div>

		<div class="hero-accent" aria-hidden="true"></div>
	</div>
</section>

<!-- ── Content ──────────────────────────────────────── -->
<section class="bg-paper-white">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<article class="article-card">
			<div class="article-header">
				<div class="article-line" aria-hidden="true"></div>
			</div>
			<div class="article-body" id="article-body">
				{@html blog.content}

				<hr class="divider" />

				<div class="share-row">
					<span class="share-label">Share this article</span>
					<div class="share-btns">
						<button
							class="share-btn"
							onclick={() => navigator.clipboard.writeText(window.location.href)}
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
								<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
							</svg>
							Copy link
						</button>
						<a
							class="share-btn"
							href="https://www.linkedin.com/sharing/share-offsite/?url={encodeURIComponent(
								typeof window !== 'undefined' ? window.location.href : ''
							)}"
							target="_blank"
							rel="noopener noreferrer">LinkedIn</a
						>
						<a
							class="share-btn"
							href="https://twitter.com/intent/tweet?url={encodeURIComponent(
								typeof window !== 'undefined' ? window.location.href : ''
							)}&text={encodeURIComponent(blog.title)}"
							target="_blank"
							rel="noopener noreferrer">Twitter / X</a
						>
						<a
							class="share-btn"
							href="https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(
								typeof window !== 'undefined' ? window.location.href : ''
							)}"
							target="_blank"
							rel="noopener noreferrer">Facebook</a
						>
					</div>
				</div>
			</div>
		</article>
	</div>
</section>

<style>
	/* ── Progress ── */
	.progress-wrap {
		position: sticky;
		top: 0;
		z-index: 200;
		height: 2px;
		background: transparent;
	}
	.progress-bar {
		height: 100%;
		background: #0b5d1e;
		transition: width 0.1s linear;
	}

	/* ── Hero ── */
	.hero {
		position: relative;
		background: linear-gradient(160deg, #0b5d1e 0%, #0a4a18 40%, #073d12 100%);
		padding: 96px 0 56px;
		overflow: hidden;
	}
	.hero.has-image {
		background: #000;
	}
	.hero-bg {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}
	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			160deg,
			rgba(7, 61, 18, 0.82) 0%,
			rgba(10, 74, 24, 0.65) 45%,
			rgba(11, 93, 30, 0.72) 100%
		);
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
	.hero-accent {
		width: 60px;
		height: 4px;
		border-radius: 2px;
		background: linear-gradient(90deg, #d4a017, #f5d998);
		margin-top: 28px;
	}

	/* ── Post meta (in hero) ── */
	.post-meta {
		display: flex;
		align-items: center;
		gap: 14px;
		font-size: 13px;
		color: rgba(255, 255, 255, 0.65);
		margin-top: 22px;
		flex-wrap: wrap;
	}
	.author {
		display: flex;
		align-items: center;
		gap: 7px;
	}
	.avatar {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}
	.author-name {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.85);
	}
	.meta-sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		flex-shrink: 0;
	}
	.read-time {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	/* ── Article card ── */
	.bg-paper-white {
		padding: 96px 0 56px;
	}
	.article-card {
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

	/* ── Divider ── */
	.divider {
		border: none;
		height: 1px;
		background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
		margin: 48px 0 32px;
	}

	/* ── Share ── */
	.share-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		margin-top: 32px;
	}
	.share-label {
		font-size: 13px;
		color: #aaa;
		font-weight: 500;
	}
	.share-btns {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.share-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 12.5px;
		padding: 6px 14px;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
		background: #fff;
		color: #555;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.15s;
		font-family: inherit;
	}
	.share-btn:hover {
		background: #f7faf7;
		border-color: #0b5d1e;
		color: #0b5d1e;
	}

	/* ── Responsive ── */
	@media (max-width: 640px) {
		.hero {
			padding: 72px 0 52px;
		}
		.hero-title {
			letter-spacing: -0.5px;
		}
		.bg-paper-white {
			padding: 72px 0 52px;
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
		.breadcrumb .current {
			max-width: 160px;
		}
	}
</style>
