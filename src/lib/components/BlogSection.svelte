<script lang="ts">
	import { getImageUrl } from '$lib/utils/image';
	let { limitBlogs }: { limitBlogs: any[] } = $props();
</script>

<section class="bg-pine-dark py-[110px]" id="blog">
	<div class="mx-auto max-w-[1180px] px-10 max-md:px-[22px]">
		<div class="mb-14 flex items-end justify-between gap-10 max-lg:flex-col">
			<div>
				<div class="eyebrow text-white">Latest publications &amp; blogs</div>
				<h2
					class="reveal mt-4 max-w-[520px] font-serif text-[clamp(1.9rem,3.2vw,2.5rem)] font-semibold tracking-[-0.01em] text-white"
				>
					Notes from the field, the packaging line and the road.
				</h2>
			</div>
			<p class="max-w-[320px] pb-[6px] text-[0.95rem] leading-relaxed text-white">
				Updates, insights and standards from across our production, packaging and distribution
				network.
			</p>
		</div>

		<div class="blog-grid grid grid-cols-3 gap-7 max-lg:grid-cols-1">
			{#each limitBlogs as blog}
				<a
					href="/blogs/{blog.slug}"
					class="reveal blog-card group block overflow-hidden rounded-[18px] border border-line bg-white transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_16px_30px_-12px_rgba(20,30,20,0.18)]"
				>
					<div class="h-[200px] overflow-hidden">
						<img
							src={getImageUrl(blog.image)}
							alt={blog.title}
							class="h-full w-full object-cover transition-transform duration-600 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
						/>
					</div>
					<div class="p-[24px_26px_28px]">
						<div
							class="mb-[10px] flex items-center gap-[10px] font-mono text-[0.66rem] tracking-[0.08em] text-teal uppercase"
						>
							<span>{blog.author}</span><span>·</span><span>{blog.created_at}</span>
						</div>
						<h3
							class="mb-[10px] font-serif text-[1.14rem] font-semibold tracking-[-0.01em] text-pine-dark"
						>
							{blog.title}
						</h3>
						<p class="mb-4 text-[0.9rem] leading-relaxed text-ink-soft">
							{blog.content.length > 120 ? blog.content.slice(0, 120) + '…' : blog.content}
						</p>
						<span
							class="inline-flex cursor-pointer items-center gap-[6px] text-[0.83rem] font-semibold text-pine-dark"
						>
							Read more
							<svg viewBox="0 0 16 16" fill="none" class="h-[14px] w-[14px]">
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
			{/each}
		</div>
	</div>
</section>
