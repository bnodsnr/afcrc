<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade, slide } from 'svelte/transition';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { resolve } from '$app/paths';
	import { getImageUrl } from '$lib/utils/image';
	import { getProductUrl } from '$lib/utils/url';
	import { handleAddToCart } from '$lib/utils/cart';
	import { toastStore } from '$lib/stores/toast';
	import WhyUs from '$lib/components/WhyUs.svelte';
	import type { PageData } from './$types';
	import type { ProductWidget } from '$lib/api/types';

	let { data }: { data: PageData } = $props();

	type SubcategoryItem = {
		id: number;
		name: string;
		description: string;
		featured_image: string;
		product_count: number;
		products: MappedProduct[];
	};

	type MappedProduct = {
		id: number;
		name: string;
		slug: string;
		seo_slug: string;
		sku: string;
		category: string;
		price: number;
		originalPrice: number;
		discount: number;
		image: string;
		rating: number;
		reviews: number;
		stockStatus?: string;
		priceUnit?: string;
	};

	const starItems = [0, 1, 2, 3, 4];

	const agroProducts = $derived((data?.agroProducts ?? []) as ProductWidget[]);
	const rawSubcategories = $derived((data?.subcategories ?? []) as any[]);

	const products = $derived.by(() => {
		return agroProducts.map(mapProduct);
	});

	const subcategoryList = $derived.by((): SubcategoryItem[] => {
		return rawSubcategories.map((sub) => ({
			id: sub.id,
			name: sub.name,
			description: sub.description || '',
			featured_image: sub.featured_image || '',
			product_count: sub.product_count ?? 0,
			products: products.filter((p) => {
				const pName = p.category.toLowerCase();
				const sName = sub.name.toLowerCase();
				return pName === sName || pName.includes(sName) || sName.includes(pName);
			})
		}));
	});

	const subcategoryMap = $derived.by(() => {
		const map = new Map<string, SubcategoryItem>();
		for (const sub of subcategoryList) {
			map.set(sub.name.toLowerCase(), sub);
		}
		return map;
	});

	const unmatchedProducts = $derived.by(() => {
		const matched = new Set(subcategoryList.flatMap((s) => s.products.map((p) => p.id)));
		return products.filter((p) => !matched.has(p.id));
	});

	// ---------- Filter State ----------
	let selectedSub = $state<number | 'all'>('all');
	let searchQuery = $state('');
	let sortMode = $state('default');
	let scrolled = $state(false);
	let wishlist = $state<Set<number>>(new Set());
	let subDropdownOpen = $state(false);
	let subSearchQuery = $state('');
	let dropdownTriggerRef = $state<HTMLDivElement | undefined>(undefined);
	let dropdownPanelRef = $state<HTMLDivElement | undefined>(undefined);

	const filteredSubcategories = $derived.by(() => {
		const q = subSearchQuery.toLowerCase().trim();
		if (!q) return subcategoryList;
		return subcategoryList.filter(
			(s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
		);
	});

	const selectedSubInfo = $derived(
		selectedSub === 'all' ? null : (subcategoryList.find((s) => s.id === selectedSub) ?? null)
	);

	const filteredProducts = $derived.by(() => {
		let result = products;

		if (selectedSub !== 'all') {
			const sub = subcategoryList.find((s) => s.id === selectedSub);
			if (sub) result = sub.products;
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
			);
		}

		switch (sortMode) {
			case 'price-asc':
				result = [...result].sort((a, b) => a.price - b.price);
				break;
			case 'price-desc':
				result = [...result].sort((a, b) => b.price - a.price);
				break;
			case 'name-asc':
				result = [...result].sort((a, b) => a.name.localeCompare(b.name));
				break;
			case 'name-desc':
				result = [...result].sort((a, b) => b.name.localeCompare(a.name));
				break;
			case 'discount':
				result = [...result].sort((a, b) => b.discount - a.discount);
				break;
		}

		return result;
	});

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		gsap.utils.toArray('.reveal').forEach((el) => {
			const elem = el as Element;
			gsap.to(elem, {
				opacity: 1,
				y: 0,
				duration: 0.8,
				ease: 'power2.out',
				scrollTrigger: { trigger: elem, start: 'top 88%' }
			});
		});
		ScrollTrigger.refresh();
	});

	onMount(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 40;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	function handleSubDropdownKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			subDropdownOpen = false;
			subSearchQuery = '';
		}
	}

	function toggleSubDropdown() {
		subDropdownOpen = !subDropdownOpen;
		if (!subDropdownOpen) subSearchQuery = '';
	}

	function clickOutsideDropdown(node: HTMLElement) {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (!node.contains(target)) {
				subDropdownOpen = false;
				subSearchQuery = '';
			}
		};
		document.addEventListener('click', handleClick, true);
		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

	// -----------------------------
	// Helpers
	// -----------------------------
	function mapProduct(product: ProductWidget): MappedProduct {
		const regular = Number(product.regular_price) || 0;
		const sale = Number(product.sale_price) || 0;
		const hasDiscount = sale > 0 && sale < regular;
		const discount =
			hasDiscount || Number(product.discount_percentage) > 0
				? Math.round(Number(product.discount_percentage) || ((regular - sale) / regular) * 100)
				: 0;

		return {
			id: product.id,
			name: product.name,
			slug: product.slug,
			seo_slug: product.category || 'agri-products',
			sku: product.sku ?? '',
			category: product.category ?? '',
			price: hasDiscount ? sale : regular,
			originalPrice: regular,
			discount,
			image: product.image ?? '',
			rating: 4.5,
			reviews: 0,
			stockStatus: 'instock',
			priceUnit: product.price_unit ?? undefined
		};
	}

	function formatPrice(price: number): string {
		return `Rs. ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function trackSpotlight(e: MouseEvent) {
		const el = e.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		el.style.setProperty('--x', `${e.clientX - rect.left}px`);
		el.style.setProperty('--y', `${e.clientY - rect.top}px`);
	}

	function reveal(node: HTMLElement, opts: { delay?: number } = {}) {
		node.style.setProperty('--reveal-delay', `${opts.delay ?? 0}ms`);
		node.classList.add('reveal-init');

		if (typeof IntersectionObserver === 'undefined') {
			node.classList.add('reveal-in');
			return {};
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						node.classList.add('reveal-in');
						observer.unobserve(node);
					}
				}
			},
			{ threshold: 0.12 }
		);
		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	function toggleWishlist(e: Event, product: MappedProduct) {
		e.preventDefault();
		e.stopPropagation();
		const next = new Set(wishlist);
		if (next.has(product.id)) {
			next.delete(product.id);
			toastStore.show(`Removed ${product.name} from wishlist`, 'info');
		} else {
			next.add(product.id);
			toastStore.show(`Saved ${product.name} to wishlist`, 'success');
		}
		wishlist = next;
	}

	function addToCart(e: Event, product: MappedProduct) {
		e.preventDefault();
		e.stopPropagation();
		handleAddToCart(
			{
				id: product.id,
				name: product.name,
				slug: product.slug,
				seo_slug: product.seo_slug,
				image: product.image,
				sale_price: product.discount > 0 ? product.price : null,
				regular_price: product.originalPrice,
				sku: product.sku,
				stock_status: product.stockStatus,
				max_quantity: undefined
			},
			1
		);
	}

	function scrollToProducts() {
		document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<svelte:head>
	<title>Agro Products — AFCRC</title>
	<meta
		name="description"
		content="Browse our full range of fresh agro products — vegetables, fruits, grains, pulses and more, harvested to order from our farms."
	/>
</svelte:head>

{#snippet sectionHeader(eyebrow: string, lead: string, highlight?: string, sub?: string)}
	<div use:reveal>
		<div class="eyebrow mb-3 font-bold before:h-[2px] before:w-7 before:rounded-full">
			{eyebrow}
			<span
				class="inline-flex h-1.5 w-1.5 rounded-full bg-gold ring-2 ring-gold/30"
				aria-hidden="true"
			></span>
		</div>
		<h2
			class="reveal font-serif text-[clamp(1.7rem,3.2vw,2.5rem)] leading-[1.08] font-semibold tracking-[-0.01em] text-pine-dark"
		>
			{lead}
			{#if highlight}
				<span class="relative mx-0.5 inline-block align-baseline whitespace-nowrap">
					<span
						class="absolute inset-x-[-5px] inset-y-[-1px] skew-x-[-8deg] rounded-[6px] bg-gold/90"
						aria-hidden="true"
					></span>
					<span class="relative text-pine-dark">{highlight}</span>
				</span>
			{/if}
		</h2>
		{#if sub}
			<p class="mt-2.5 max-w-[520px] text-[0.88rem] leading-relaxed text-ink-soft">{sub}</p>
		{/if}
	</div>
{/snippet}

{#snippet productCard(product: MappedProduct, index: number = 0)}
	<a
		href={getProductUrl(product)}
		class="spotlight-card group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)] hover:-translate-y-1.5 hover:border-pine/30 hover:shadow-[0_20px_40px_-16px_rgba(30,75,51,0.25)]"
		onmousemove={trackSpotlight}
		use:reveal={{ delay: (index % 4) * 70 }}
	>
		<div class="relative aspect-[4/3] overflow-hidden bg-paper-2">
			<img
				src={getImageUrl(product.image)}
				alt={product.name}
				loading="lazy"
				class="h-full w-full object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(.22,1,.36,1)] group-hover:scale-110"
			/>
			<div
				class="pointer-events-none absolute inset-0 bg-gradient-to-t from-pine-dark/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
			></div>
			{#if product.discount > 0}
				<span
					class="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold text-pine-dark shadow-sm"
					>-{product.discount}%</span
				>
			{/if}

			<div
				class="absolute right-3 bottom-3 z-10 flex [transform:translateY(6px)] flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100"
			>
				<button
					class="heart-btn flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-none bg-white/95 text-pine-dark shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white"
					class:active={wishlist.has(product.id)}
					onclick={(e) => toggleWishlist(e, product)}
					aria-label={wishlist.has(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
					aria-pressed={wishlist.has(product.id)}
				>
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path
							d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"
						/></svg
					>
				</button>
				<button
					class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-none bg-pine-dark text-white shadow-md transition-all duration-200 hover:scale-110 hover:bg-pine"
					onclick={(e) => addToCart(e, product)}
					aria-label="Add to cart"
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
						><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line
							x1="3"
							y1="6"
							x2="21"
							y2="6"
						/><path d="M16 10a4 4 0 0 1-8 0" /></svg
					>
				</button>
			</div>
		</div>
		<div class="relative z-[1] flex flex-1 flex-col p-4">
			<span
				class="mb-1.5 self-start rounded-full bg-teal/10 px-2.5 py-0.5 font-mono text-[0.55rem] leading-none tracking-[0.06em] text-teal uppercase"
				>{product.category || 'Agro'}</span
			>
			<h3 class="mb-1 font-serif text-[0.95rem] font-semibold tracking-[-0.01em] text-pine-dark">
				{product.name}
			</h3>
			<div class="mb-2.5 flex items-center gap-0.5">
				{#each starItems as j (j)}
					<svg
						class="h-2.5 w-2.5 {j < Math.round(product.rating) ? 'text-gold' : 'text-line'}"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 0 0-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 0 0-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 0 0-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957z"
						/>
					</svg>
				{/each}
			</div>
			<div class="mt-auto flex items-center justify-between">
				<div class="flex items-baseline gap-1.5">
					<span class="font-mono text-[0.95rem] font-bold text-pine-dark">
						{formatPrice(product.price)}
						{#if product.priceUnit}
							<span class="font-mono text-[0.65rem] font-medium text-pine-dark/50">
								/ {product.priceUnit.replace('per_', '')}
							</span>
						{/if}
					</span>
					{#if product.discount > 0}
						<span class="font-mono text-[0.7rem] text-ink-soft line-through">
							{formatPrice(product.originalPrice)}
						</span>
					{/if}
				</div>
			</div>
		</div>
	</a>
{/snippet}

<!-- ── Hero ── -->
<section
	class="relative overflow-hidden bg-pine-dark pt-14 pb-14 max-md:pt-10 max-md:pb-10"
	style="background:
		radial-gradient(circle at 12% 18%, #4b845a 0%, transparent 38%),
		radial-gradient(circle at 88% 12%, #fbe9ba 0%, transparent 34%),
		linear-gradient(135deg, #17533a 0%, #84a66d 55%, #fdf0cf 105%)"
>
	<div
		class="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
		style="background-image: url('https://picsum.photos/seed/agro-hero/1600/900');"
		aria-hidden="true"
	></div>
	<div
		class="absolute inset-0 bg-gradient-to-r from-pine-dark/95 via-pine-dark/75 to-pine-dark/30"
		aria-hidden="true"
	></div>
	<div
		class="hero-grain pointer-events-none absolute inset-0 opacity-[0.05]"
		aria-hidden="true"
	></div>
	<div
		class="animate-float-slow pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl"
	></div>
	<div
		class="animate-float-slower pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-pine/40 blur-3xl"
	></div>
	<div
		class="animate-float-slow pointer-events-none absolute top-1/3 left-1/2 h-40 w-40 rounded-full bg-teal/25 blur-3xl [animation-delay:-4s]"
	></div>

	<div class="relative mx-auto max-w-[1180px] px-6 max-md:px-4">
		<nav
			class="mb-5 flex items-center gap-2 font-mono text-[0.72rem] tracking-[0.08em] text-paper/70 uppercase"
			aria-label="Breadcrumb"
		>
			<a href={resolve('/')} class="transition-colors duration-200 hover:text-gold">Home</a>
			<span aria-hidden="true">/</span>
			<span class="font-semibold text-gold">Agro Products</span>
		</nav>

		<div class="flex items-end justify-between gap-10 max-lg:flex-col max-lg:items-start">
			<div class="max-w-[620px]" in:fly={{ y: 18, duration: 600, delay: 80 }}>
				<div class="eyebrow text-gold before:bg-gold">Farm-fresh harvest</div>
				<h1
					class="mt-4 font-serif text-[clamp(2.6rem,6vw,4.2rem)] leading-[1.02] font-bold tracking-[-0.01em] text-paper"
				>
					Agro
					<span class="relative mx-1 inline-block align-baseline whitespace-nowrap">
						<span
							class="absolute inset-x-[-7px] inset-y-[2px] skew-x-[-6deg] rounded-lg bg-gold/95"
							aria-hidden="true"
						></span>
						<span class="relative text-pine-dark">products</span>
					</span>
				</h1>
				<p class="mt-3 max-w-[520px] text-[0.92rem] leading-relaxed text-paper/85">
					Freshly harvested vegetables, fruits, grains and pulses sourced directly from our farms.
					Naturally grown, sustainably farmed, delivered to your doorstep.
				</p>

				<div class="mt-5 flex flex-wrap items-center gap-2">
					<button
						type="button"
						class="cursor-pointer rounded-full border border-white/30 bg-white/10 px-4 py-1.5 font-mono text-[0.7rem] font-semibold tracking-wide text-paper backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-pine-dark"
						onclick={scrollToProducts}
					>
						Browse all products
					</button>
					{#if subcategoryList.length > 0}
						{#each subcategoryList.slice(0, 3) as sub (sub.id)}
							<button
								type="button"
								class="cursor-pointer rounded-full border border-white/30 bg-white/10 px-4 py-1.5 font-mono text-[0.7rem] font-semibold tracking-wide text-paper backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-pine-dark"
								onclick={() => {
									selectedSub = sub.id;
									scrollToProducts();
								}}
							>
								{sub.name}
							</button>
						{/each}
					{/if}
				</div>
			</div>

			<div
				class="grid shrink-0 grid-cols-2 gap-2 max-lg:w-full max-lg:grid-cols-4 max-sm:grid-cols-2"
				in:fly={{ y: 18, duration: 600, delay: 180 }}
			>
				<div
					class="group rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.3rem] leading-none font-bold text-gold">
						{products.length}
					</p>
					<p class="mt-1 font-mono text-[0.58rem] tracking-[0.08em] text-paper/80 uppercase">
						Products
					</p>
				</div>
				<div
					class="group rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.3rem] leading-none font-bold text-gold">
						{subcategoryList.length}
					</p>
					<p class="mt-1 font-mono text-[0.58rem] tracking-[0.08em] text-paper/80 uppercase">
						Subcategories
					</p>
				</div>
				<div
					class="group rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.3rem] leading-none font-bold text-gold">100%</p>
					<p class="mt-1 font-mono text-[0.58rem] tracking-[0.08em] text-paper/80 uppercase">
						Farm Fresh
					</p>
				</div>
				<div
					class="group rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.3rem] leading-none font-bold text-gold">24h</p>
					<p class="mt-1 font-mono text-[0.58rem] tracking-[0.08em] text-paper/80 uppercase">
						Delivery
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ── Subcategory filter bar + dropdown ── -->
{#if subcategoryList.length > 0}
	<section class="sticky top-[72px] z-30 border-b border-line bg-white/80 backdrop-blur-xl">
		<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
			<div class="flex items-center gap-3 py-3 max-md:gap-2">
				<!-- "All" chip — always visible -->
				<button
					type="button"
					class="group flex shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-2.5 transition-all duration-300 {selectedSub ===
					'all'
						? 'border-pine-dark bg-pine-dark text-white shadow-[0_4px_16px_-4px_rgba(23,83,58,0.45)]'
						: 'border-line bg-paper-2/60 text-ink-soft hover:border-pine/40 hover:bg-white hover:text-pine-dark'}"
					onclick={() => {
						selectedSub = 'all';
						scrollToProducts();
					}}
				>
					<span
						class="flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-300 {selectedSub ===
						'all'
							? 'bg-white/20'
							: 'bg-pine/10 group-hover:bg-pine/20'}"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect x="3" y="3" width="7" height="7" /><rect
								x="14"
								y="3"
								width="7"
								height="7"
							/><rect x="3" y="14" width="7" height="7" /><rect
								x="14"
								y="14"
								width="7"
								height="7"
							/></svg
						>
					</span>
					<span class="font-mono text-[0.72rem] font-semibold tracking-[0.03em] whitespace-nowrap"
						>All</span
					>
					<span
						class="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 font-mono text-[0.6rem] font-bold transition-colors duration-300 {selectedSub ===
						'all'
							? 'bg-white/25 text-white'
							: 'bg-pine/10 text-pine-dark'}">{products.length}</span
					>
				</button>

				<div class="h-6 w-px shrink-0 bg-line max-md:hidden" aria-hidden="true"></div>

				<!-- Selected subcategory chip (when one is picked) -->
				{#if selectedSubInfo}
					<button
						type="button"
						class="group flex shrink-0 items-center gap-2.5 rounded-2xl border border-pine-dark bg-pine-dark px-4 py-2.5 text-white shadow-[0_4px_16px_-4px_rgba(23,83,58,0.45)] transition-all duration-300"
						onclick={() => (selectedSub = 'all')}
					>
						{#if selectedSubInfo.featured_image}
							<img
								src={getImageUrl(selectedSubInfo.featured_image)}
								alt={selectedSubInfo.name}
								class="h-8 w-8 shrink-0 rounded-xl object-cover ring-2 ring-white/40"
							/>
						{:else}
							<span
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line
										x1="3"
										y1="6"
										x2="21"
										y2="6"
									/><path d="M16 10a4 4 0 01-8 0" />
								</svg>
							</span>
						{/if}
						<span
							class="font-mono text-[0.72rem] font-semibold tracking-[0.03em] whitespace-nowrap"
						>
							{selectedSubInfo.name}
						</span>
						<span
							class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 font-mono text-[0.6rem] font-bold"
							>{selectedSubInfo.product_count}
						</span>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="ml-0.5 opacity-60"
						>
							<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				{/if}

				<!-- Spacer + search / sort / dropdown trigger -->
				<div class="ml-auto flex items-center gap-2">
					<span class="shrink-0 font-mono text-[0.72rem] font-semibold text-ink-soft max-md:hidden">
						{filteredProducts.length}
						{filteredProducts.length === 1 ? 'product' : 'products'}
					</span>

					<div
						class="flex max-w-[180px] flex-1 items-center gap-1.5 rounded-full border border-line bg-paper-2/60 px-3 py-2 transition-colors duration-200 focus-within:border-pine/40 focus-within:bg-white max-md:hidden"
					>
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="shrink-0 text-ink-soft/50"
							aria-hidden="true"
						>
							<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
						<input
							type="text"
							placeholder="Search..."
							class="w-full border-none bg-transparent text-[0.72rem] text-ink outline-none placeholder:text-ink-soft/50"
							bind:value={searchQuery}
						/>
					</div>

					<div
						class="flex items-center gap-1 rounded-full border border-line bg-paper-2/60 px-3 py-2 max-md:hidden"
					>
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="shrink-0 text-ink-soft/50"
							aria-hidden="true"
						>
							<line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line
								x1="12"
								y1="18"
								x2="20"
								y2="18"
							/>
						</svg>
						<select
							class="cursor-pointer border-none bg-transparent text-[0.72rem] font-semibold text-ink outline-none"
							aria-label="Sort products"
							bind:value={sortMode}
						>
							<option value="default">Default</option>
							<option value="price-asc">Price: Low → High</option>
							<option value="price-desc">Price: High → Low</option>
							<option value="name-asc">Name: A → Z</option>
							<option value="name-desc">Name: Z → A</option>
							<option value="discount">Biggest Discount</option>
						</select>
					</div>

					<div class="h-5 w-px shrink-0 bg-line max-md:hidden" aria-hidden="true"></div>

					<div bind:this={dropdownTriggerRef} class="relative" use:clickOutsideDropdown>
						<button
							type="button"
							class="group flex shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-2.5 transition-all duration-300 {subDropdownOpen
								? 'border-pine-dark bg-pine-dark text-white shadow-[0_4px_16px_-4px_rgba(23,83,58,0.45)]'
								: 'border-line bg-paper-2/60 text-ink-soft hover:border-pine/40 hover:bg-white hover:text-pine-dark'}"
							onclick={toggleSubDropdown}
							aria-haspopup="listbox"
							aria-expanded={subDropdownOpen}
						>
							<span
								class="flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-300 {subDropdownOpen
									? 'bg-white/20'
									: 'bg-pine/10 group-hover:bg-pine/20'}"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" />
								</svg>
							</span>
							<span
								class="font-mono text-[0.72rem] font-semibold tracking-[0.03em] whitespace-nowrap"
							>
								{subDropdownOpen ? 'Close' : 'Categories'}
							</span>
							<span
								class="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 font-mono text-[0.6rem] font-bold transition-colors duration-300 {subDropdownOpen
									? 'bg-white/25 text-white'
									: 'bg-pine/10 text-pine-dark'}">{subcategoryList.length}</span
							>
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="ml-0.5 transition-transform duration-200 {subDropdownOpen
									? 'rotate-180'
									: ''}"
							>
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</button>

						{#if subDropdownOpen}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="absolute top-full right-0 z-50 mt-2 max-h-[420px] w-[320px] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_20px_60px_-12px_rgba(23,83,58,0.25)]"
								transition:fly={{ y: -8, duration: 200 }}
								onclick={(e) => e.stopPropagation()}
								onkeydown={handleSubDropdownKeydown}
								bind:this={dropdownPanelRef}
								role="listbox"
								aria-label="Subcategories"
							>
								<!-- Search input -->
								<div class="border-b border-line p-3">
									<div
										class="flex items-center gap-2 rounded-xl border border-line bg-paper-2/40 px-3 py-2"
									>
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											class="shrink-0 text-ink-soft/60"
											aria-hidden="true"
										>
											<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
										</svg>
										<input
											type="text"
											placeholder="Search categories..."
											class="w-full border-none bg-transparent text-[0.78rem] text-ink outline-none placeholder:text-ink-soft/50"
											bind:value={subSearchQuery}
											autofocus
										/>
									</div>
								</div>

								<!-- Scrollable list -->
								<div class="max-h-[340px] overflow-y-auto overscroll-contain p-1.5">
									{#if filteredSubcategories.length === 0}
										<div class="px-4 py-8 text-center">
											<p class="font-mono text-[0.75rem] text-ink-soft/60">No categories found</p>
										</div>
									{:else}
										{#each filteredSubcategories as sub (sub.id)}
											<button
												type="button"
												class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 {selectedSub ===
												sub.id
													? 'bg-pine-dark text-white'
													: 'text-ink hover:bg-paper-2/80 hover:text-pine-dark'}"
												role="option"
												aria-selected={selectedSub === sub.id}
												onclick={() => {
													selectedSub = selectedSub === sub.id ? 'all' : sub.id;
													subDropdownOpen = false;
													subSearchQuery = '';
													scrollToProducts();
												}}
											>
												{#if sub.featured_image}
													<img
														src={getImageUrl(sub.featured_image)}
														alt={sub.name}
														class="h-8 w-8 shrink-0 rounded-lg object-cover transition-all duration-200 {selectedSub ===
														sub.id
															? 'ring-2 ring-white/40'
															: 'ring-1 ring-line'}"
													/>
												{:else}
													<span
														class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 {selectedSub ===
														sub.id
															? 'bg-white/20'
															: 'bg-teal/10'}"
													>
														<svg
															width="14"
															height="14"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
														>
															<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line
																x1="3"
																y1="6"
																x2="21"
																y2="6"
															/><path d="M16 10a4 4 0 01-8 0" />
														</svg>
													</span>
												{/if}
												<div class="min-w-0 flex-1">
													<span
														class="block truncate font-mono text-[0.72rem] font-semibold tracking-[0.02em]"
														>{sub.name}</span
													>
													{#if sub.description}
														<span
															class="block truncate font-mono text-[0.6rem] {selectedSub === sub.id
																? 'text-white/60'
																: 'text-ink-soft/60'}">{sub.description}</span
														>
													{/if}
												</div>
												<span
													class="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-[0.6rem] font-bold transition-colors duration-200 {selectedSub ===
													sub.id
														? 'bg-white/25 text-white'
														: 'bg-pine/10 text-pine-dark'}">{sub.product_count}</span
												>
											</button>
										{/each}
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Mobile-only search / sort row -->
	<div class="border-b border-line bg-white/60 backdrop-blur-sm md:hidden">
		<div class="mx-auto flex max-w-[1180px] items-center gap-2 px-4 py-2.5">
			<div
				class="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-line bg-paper-2/40 px-3 py-2 focus-within:border-pine/40 focus-within:bg-white"
			>
				<svg
					width="13"
					height="13"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					class="shrink-0 text-ink-soft/50"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input
					type="text"
					placeholder="Search..."
					class="w-full border-none bg-transparent text-[0.72rem] text-ink outline-none placeholder:text-ink-soft/50"
					bind:value={searchQuery}
				/>
			</div>
			<div
				class="flex shrink-0 items-center gap-1 rounded-xl border border-line bg-paper-2/40 px-3 py-2"
			>
				<svg
					width="13"
					height="13"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					class="shrink-0 text-ink-soft/50"
					aria-hidden="true"
				>
					<line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line
						x1="12"
						y1="18"
						x2="20"
						y2="18"
					/>
				</svg>
				<select
					class="cursor-pointer border-none bg-transparent text-[0.72rem] font-semibold text-ink outline-none"
					aria-label="Sort products"
					bind:value={sortMode}
				>
					<option value="default">Default</option>
					<option value="price-asc">Price ↑</option>
					<option value="price-desc">Price ↓</option>
					<option value="name-asc">A → Z</option>
					<option value="name-desc">Z → A</option>
					<option value="discount">Discount</option>
				</select>
			</div>
			<span class="shrink-0 font-mono text-[0.65rem] font-semibold text-ink-soft">
				{filteredProducts.length}
			</span>
		</div>
	</div>
{/if}

<!-- ── Product grid section ── -->
<section class="bg-paper-white pt-2 pb-14" id="product-grid">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		{#if filteredProducts.length > 0}
			<div class="grid grid-cols-4 gap-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
				{#each filteredProducts as product, i (product.id)}
					{@render productCard(product, i)}
				{/each}
			</div>
		{:else}
			<div
				class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-pine/30 bg-paper-2/40 px-8 py-16 text-center"
			>
				<div
					class="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-pine-dark"
				>
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M12 3C12 3 6 9 6 15C6 18 8 21 12 22" /><path
							d="M12 3C12 3 18 9 18 15C18 18 16 21 12 22"
						/><path d="M12 22V6" /></svg
					>
				</div>
				<div>
					<p class="font-serif text-[1.2rem] font-semibold text-pine-dark">No products found</p>
					<p class="mt-1.5 max-w-[420px] text-[0.88rem] text-ink-soft">
						Try adjusting your search or filters. Fresh agro products are always being restocked.
					</p>
				</div>
				<button
					type="button"
					class="cursor-pointer rounded-full bg-pine px-6 py-2.5 text-[0.85rem] font-bold text-white transition-colors duration-200 hover:bg-pine-dark"
					onclick={() => {
						selectedSub = 'all';
						searchQuery = '';
						sortMode = 'default';
					}}
				>
					Clear all filters
				</button>
			</div>
		{/if}
	</div>
</section>

<!-- ── Why AFCRC ── -->
<WhyUs />

<style>
	/* ---------- Scroll reveal ---------- */
	:global(.reveal-init) {
		opacity: 0;
		transform: translateY(22px);
	}
	:global(.reveal-in) {
		animation: reveal-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
		animation-delay: var(--reveal-delay, 0ms);
	}
	@keyframes reveal-up {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ---------- Cursor spotlight on product cards ---------- */
	:global(.spotlight-card) {
		--x: 50%;
		--y: 50%;
	}
	:global(.spotlight-card)::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		border-radius: inherit;
		background: radial-gradient(
			220px circle at var(--x) var(--y),
			rgba(212, 168, 67, 0.14),
			transparent 70%
		);
		opacity: 0;
		transition: opacity 0.35s ease;
	}
	:global(.spotlight-card:hover)::before {
		opacity: 1;
	}

	/* ---------- Wishlist heart ---------- */
	:global(.heart-btn svg) {
		transition:
			fill 0.2s ease,
			stroke 0.2s ease,
			transform 0.2s ease;
	}
	:global(.heart-btn.active svg) {
		fill: #d64545;
		stroke: #d64545;
		transform: scale(1.08);
	}
	:global(.heart-btn.active) {
		animation: heart-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes heart-pop {
		0% {
			transform: scale(1);
		}
		40% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	/* ---------- Hero ambient motion ---------- */
	:global(.animate-float-slow) {
		animation: float-slow 9s ease-in-out infinite;
	}
	:global(.animate-float-slower) {
		animation: float-slower 12s ease-in-out infinite;
	}
	@keyframes float-slow {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(-14px, 18px) scale(1.06);
		}
	}
	@keyframes float-slower {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(16px, -14px) scale(1.08);
		}
	}

	.hero-grain {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}

	/* ---------- Hide scrollbar on filter strip ---------- */
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.reveal-init) {
			opacity: 1;
			transform: none;
		}
		:global(.reveal-in),
		:global(.animate-float-slow),
		:global(.animate-float-slower) {
			animation: none;
		}
	}
</style>
