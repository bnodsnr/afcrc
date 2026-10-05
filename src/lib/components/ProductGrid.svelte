<script lang="ts">
	interface Product {
		img: string;
		alt: string;
		category: string;
		name: string;
		price: number | string;
		originalPrice?: number;
		rating: number;
		reviews?: number;
		discount?: number;
		isNew?: boolean;
	}

	interface Props {
		id?: string;
		eyebrow?: string;
		title?: string;
		bgClass?: string;
		bgStyle?: string;
		eyebrowClass?: string;
		titleClass?: string;
		products: Product[];
		viewAllHref?: string;
		showCartButton?: boolean;
	}

	let {
		id = '',
		eyebrow = '',
		title = '',
		bgClass = '',
		bgStyle = '',
		eyebrowClass = '',
		titleClass = '',
		products = [],
		viewAllHref = '/products',
		showCartButton = false
	}: Props = $props();
</script>

<section class={bgClass} style={bgStyle ? `background: ${bgStyle}` : ''} {id}>
	<div class="mx-auto max-w-[1180px] px-6 py-[100px] max-md:px-4 max-md:py-16">
		<div class="mb-10 flex items-end justify-between gap-6">
			<div>
				{#if eyebrow}
					<div class="eyebrow {eyebrowClass}">{eyebrow}</div>
				{/if}
				{#if title}
					<h2
						class="reveal mt-3 font-serif text-[clamp(1.7rem,3vw,2.3rem)] font-semibold tracking-[-0.01em] {titleClass
							? titleClass
							: 'text-pine-dark'}"
					>
						{title}
					</h2>
				{/if}
			</div>
			<a
				href={viewAllHref}
				class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-5 py-2.5 font-mono text-[0.72rem] font-semibold tracking-[0.04em] text-pine-dark transition-all duration-300 hover:border-pine-dark hover:bg-pine-dark hover:text-white"
			>
				View All
				<svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg
				>
			</a>
		</div>

		<div class="product-grid grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
			{#each products as product}
				<a
					href="/products/{product.name.toLowerCase().replace(/\s+/g, '-')}"
					class="reveal product-item group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(30,75,51,0.18)]"
				>
					<div class="relative h-52 overflow-hidden bg-paper-2">
						<img
							src={product.img}
							alt={product.alt}
							class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
							loading="lazy"
						/>
						{#if product.discount}
							<span
								class="absolute top-3 left-3 rounded-full bg-gold px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold text-white shadow-sm"
								>-{product.discount}%</span
							>
						{/if}
						{#if product.isNew}
							<span
								class="absolute top-3 right-3 rounded-full bg-pine px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold text-white shadow-sm"
								>New</span
							>
						{/if}
						<button
							class="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-pine-dark opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 hover:bg-pine-dark hover:text-white"
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path
									d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
								/></svg
							>
						</button>
					</div>
					<div class="flex flex-1 flex-col p-4">
						<span
							class="mb-1.5 self-start rounded-full bg-teal/10 px-2.5 py-0.5 font-mono text-[0.55rem] leading-none tracking-[0.06em] text-teal uppercase"
							>{product.category}</span
						>
						<h3
							class="mb-1 font-serif text-[0.95rem] font-semibold tracking-[-0.01em] text-pine-dark"
						>
							{product.name}
						</h3>
						<div class="mb-2.5 flex items-center gap-0.5">
							{#each { length: 5 } as _, j}
								<svg
									class="h-2.5 w-2.5 {j < product.rating ? 'text-gold' : 'text-line'}"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z"
									/>
								</svg>
							{/each}
							{#if product.reviews}
								<span class="ml-1 font-mono text-[0.6rem] text-ink-soft">({product.reviews})</span>
							{/if}
						</div>
						<div class="mt-auto flex items-center justify-between">
							<!-- <div class="flex items-baseline gap-1.5">
								<span class="font-mono text-[0.95rem] font-bold text-pine-dark"
									>{typeof product.price === 'number'
										? `$${product.price.toFixed(2)}`
										: product.price}</span
								>
								{#if product.originalPrice}
									<span class="font-mono text-[0.7rem] text-ink-soft line-through"
										>${product.originalPrice.toFixed(2)}</span
									>
								{/if}
							</div> -->
							{#if showCartButton}
								<button
									class="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-dark text-white transition-all duration-300 hover:bg-pine hover:shadow-[0_4px_12px_-4px_rgba(30,75,51,0.4)]"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<svg
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										stroke-linecap="round"
										stroke-linejoin="round"
										><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line
											x1="3"
											y1="6"
											x2="21"
											y2="6"
										/><path d="M16 10a4 4 0 01-8 0" /></svg
									>
								</button>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>
</section>
