<script lang="ts">
	import type { PageData } from './$types';
	import { getImageUrl } from '$lib/utils/image';
	import { resolve } from '$app/paths';

	let { data }: { data: PageData } = $props();

	const blogsData = $derived(data?.blogsData ?? []);

	function stripHtml(html: string): string {
		return html
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	function excerpt(content: string, max = 150): string {
		const text = stripHtml(content);
		return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
	}

	function formatDate(raw: string): string {
		if (!raw) return '';
		try {
			return new Date(raw).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return raw;
		}
	}

	function readTime(content: string): string {
		const words = stripHtml(content).split(' ').filter(Boolean).length;
		return `${Math.max(1, Math.round(words / 200))} min read`;
	}
</script>

<svelte:head>
	<title>Blog — AFCRC</title>
	<meta
		name="description"
		content="Read the latest articles from AFCRC on sustainable agriculture, forest conservation, research and community impact."
	/>
</svelte:head>

<!-- Hero Section -->
<section class="hero-section">
	<div class="hero-bg-pattern"></div>
	<div class="hero-leaf hero-leaf-1">
		<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M60 10C60 10 90 40 90 70C90 90 75 105 60 110C45 105 30 90 30 70C30 40 60 10 60 10Z"
				fill="currentColor"
				opacity="0.08"
			/>
			<path d="M60 20V100" stroke="currentColor" stroke-width="1" opacity="0.1" />
			<path d="M60 40C70 35 80 50 85 65" stroke="currentColor" stroke-width="0.5" opacity="0.08" />
			<path d="M60 55C50 50 40 60 35 75" stroke="currentColor" stroke-width="0.5" opacity="0.08" />
		</svg>
	</div>
	<div class="hero-leaf hero-leaf-2">
		<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M40 5C40 5 60 25 60 50C60 65 50 75 40 80C30 75 20 65 20 50C20 25 40 5 40 5Z"
				fill="currentColor"
				opacity="0.06"
			/>
		</svg>
	</div>
	<div class="hero-content">
		<span class="hero-badge">Insights</span>
		<h1 class="hero-title">Our Latest Articles</h1>
		<p class="hero-subtitle">
			Explore articles on sustainable agriculture, forest conservation, research and community
			impact.
		</p>
	</div>
</section>

<!-- Posts -->
<section class="bg-paper-white py-[100px] max-md:py-16">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		{#if blogsData.length === 0}
			<div class="mx-auto max-w-[420px] py-20 text-center">
				<svg
					class="mx-auto mb-5 h-14 w-14 text-ink-soft/40"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
				</svg>
				<h2 class="font-serif text-[1.4rem] font-semibold text-pine-dark">No articles found</h2>
				<p class="mt-2 text-[0.95rem] text-ink-soft">
					Check back soon for the latest updates from our research and field teams.
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-3 gap-7 max-lg:grid-cols-2 max-md:grid-cols-1">
				{#each blogsData as post (post.id)}
					<article
						class="group flex overflow-hidden rounded-[18px] border border-line bg-white transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_16px_30px_-12px_rgba(20,30,20,0.18)]"
					>
						<a href={resolve(`/blogs/${post.slug}`)} class="flex flex-1 flex-col">
							<div class="h-[200px] overflow-hidden bg-paper-2">
								<img
									src={getImageUrl(post.image)}
									alt={post.title}
									loading="lazy"
									class="h-full w-full object-cover transition-transform duration-600 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
								/>
							</div>
							<div class="flex flex-1 flex-col p-[24px_26px_28px]">
								<div
									class="mb-[10px] flex flex-wrap items-center gap-[10px] font-mono text-[0.66rem] tracking-[0.08em] text-teal uppercase"
								>
									<span>{post.author || 'AFCRC'}</span>
									<span>·</span>
									<span>{formatDate(post.created_at)}</span>
									<span>·</span>
									<span>{readTime(post.content)}</span>
								</div>
								<h3
									class="mb-[10px] font-serif text-[1.14rem] font-semibold tracking-[-0.01em] text-pine-dark transition-colors duration-300 group-hover:text-pine"
								>
									{post.title}
								</h3>
								<p class="mb-4 line-clamp-3 text-[0.9rem] leading-relaxed text-ink-soft">
									{excerpt(post.content)}
								</p>
								<span
									class="mt-auto inline-flex items-center gap-[6px] text-[0.83rem] font-semibold text-pine-dark"
								>
									Read more
									<svg
										viewBox="0 0 16 16"
										fill="none"
										class="h-[14px] w-[14px] transition-transform duration-300 group-hover:translate-x-1"
									>
										<path
											d="M3 8H13M13 8L9 4M13 8L9 12"
											stroke="currentColor"
											stroke-width="1.6"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</span>
							</div>
						</a>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	/* Hero Section */
	.hero-section {
		background: linear-gradient(135deg, #0d3d1a 0%, #1a5c2e 40%, #0d3d1a 100%);
		padding: 100px 0 80px;
		position: relative;
		overflow: hidden;
	}

	.hero-bg-pattern {
		position: absolute;
		inset: 0;
		background-image:
			radial-gradient(circle at 20% 80%, rgba(212, 165, 116, 0.08) 0%, transparent 50%),
			radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
			radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 60%);
	}

	.hero-leaf {
		position: absolute;
		color: #d4a574;
		pointer-events: none;
	}

	.hero-leaf-1 {
		top: -20px;
		right: 10%;
		width: 200px;
		height: 200px;
		transform: rotate(15deg);
	}

	.hero-leaf-2 {
		bottom: 10px;
		left: 5%;
		width: 120px;
		height: 120px;
		transform: rotate(-25deg);
	}

	.hero-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 24px;
		text-align: center;
		position: relative;
		z-index: 2;
	}

	.hero-badge {
		display: inline-block;
		background: rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(10px);
		color: #f5f0e8;
		font-family: 'Manrope', sans-serif;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 2.5px;
		padding: 8px 24px;
		border-radius: 30px;
		margin-bottom: 28px;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.hero-title {
		font-family: 'Manrope', sans-serif;
		font-size: 4rem;
		font-weight: 800;
		color: #ffffff;
		margin-bottom: 20px;
		line-height: 1.1;
		letter-spacing: -1.5px;
	}

	.hero-subtitle {
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.85);
		max-width: 560px;
		margin: 0 auto;
		line-height: 1.7;
		font-weight: 400;
	}
</style>
