<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { env } from '$env/dynamic/public';
	import { resolve } from '$app/paths';
	import { getImageUrl } from '$lib/utils/image';
	import { getProductUrl, getCategoryUrl } from '$lib/utils/url';
	import { handleAddToCart } from '$lib/utils/cart';
	import { toastStore } from '$lib/stores/toast';
	import WhyUs from '$lib/components/WhyUs.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Sub = {
		id: number;
		name: string;
		featured_image?: string | null;
		category?: number | { id: number } | string | null;
	};

	type Cat = {
		id: number;
		name: string;
		description?: string;
		featured_image?: string | null;
		seo_slug?: string;
		slug?: string;
		subcategories?: Sub[] | null;
	};

	type ApiProduct = {
		id: number;
		name: string;
		slug: string;
		seo_slug?: string;
		sku?: string;
		category_name?: string;
		category?: number;
		regular_price?: string | number;
		sale_price?: string | number;
		primary_image?: { image?: string } | null;
		images?: { image?: string }[];
		featured_image?: string | null;
		description?: string;
		short_description?: string;
		stock_status?: string;
		stock_quantity?: string | number;
		subcategories?: { id: number; name?: string }[];
	};

	type Product = {
		id: number;
		name: string;
		slug: string;
		seo_slug: string;
		sku: string;
		brand: string;
		category?: number;
		price: number;
		originalPrice: number;
		discount: number;
		image: string;
		rating: number;
		reviews: number;
		stockStatus?: string;
		stockQuantity: number;
	};

	const categories = $derived((data?.categories ?? []) as Cat[]);
	const allSubcategories = $derived((data?.subcategories ?? []) as Sub[]);
	const allProducts = $derived((data?.products ?? []) as ApiProduct[]);

	const starItems = [0, 1, 2, 3, 4];
	const skeletonItems = [0, 1, 2, 3, 4, 5, 6, 7];

	let scrolled = $state(false);
	let wishlist = $state<Set<number>>(new Set());
	let selectedSub = $state<Record<number, number | 'all'>>({});

	onMount(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 40;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	onDestroy(() => {});

	// -----------------------------
	// Helpers
	// -----------------------------
	function mapProduct(product: ApiProduct): Product {
		const regular = Number(product.regular_price) || 0;
		const sale = Number(product.sale_price) || 0;
		const hasDiscount = sale > 0 && sale < regular;
		const image =
			product.primary_image?.image ?? product.images?.[0]?.image ?? product.featured_image ?? '';

		return {
			id: product.id,
			name: product.name,
			slug: product.slug,
			seo_slug: product.seo_slug || product.slug,
			sku: product.sku ?? '',
			brand: product.category_name ?? '',
			category: product.category,
			price: hasDiscount ? sale : regular,
			originalPrice: regular,
			discount: hasDiscount ? Math.round(((regular - sale) / regular) * 100) : 0,
			image,
			rating: 4.5,
			reviews: 0,
			stockStatus: product.stock_status,
			stockQuantity: Number(product.stock_quantity)
		};
	}

	function formatPrice(price: number | string): string {
		const n = Number(price) || 0;
		return `Rs. ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function subIds(product: ApiProduct): number[] {
		return (product.subcategories ?? [])
			.map((s) => Number(s?.id))
			.filter((id) => !Number.isNaN(id) && id > 0);
	}

	function catSubs(cat: Cat): Sub[] {
		const inline = (cat.subcategories ?? []).filter((s) => s && Number(s.id) > 0);
		if (inline.length) return inline;
		return allSubcategories.filter((s) => {
			const c = s.category;
			if (typeof c === 'number') return c === cat.id;
			if (c && typeof c === 'object') return Number(c.id) === Number(cat.id);
			if (typeof c === 'string') return c === cat.name;
			return false;
		});
	}

	const productsBySub = $derived.by(() => {
		const map = new Map<number, Product[]>();
		for (const p of allProducts) {
			const prod = mapProduct(p);
			for (const id of subIds(p)) {
				if (!map.has(id)) map.set(id, []);
				map.get(id)!.push(prod);
			}
		}
		return map;
	});

	const productsByCat = $derived.by(() => {
		const map = new Map<number, Product[]>();
		for (const cat of categories) {
			const seen = new Set<number>();
			const out: Product[] = [];
			for (const s of catSubs(cat)) {
				for (const p of productsBySub.get(Number(s.id)) ?? []) {
					if (!seen.has(p.id)) {
						seen.add(p.id);
						out.push(p);
					}
				}
			}
			if (out.length === 0) {
				const kw = cat.name.toLowerCase();
				for (const p of allProducts) {
					if ((p.category_name ?? '').toLowerCase().includes(kw)) {
						const prod = mapProduct(p);
						if (!seen.has(prod.id)) {
							seen.add(prod.id);
							out.push(prod);
						}
					}
				}
			}
			map.set(cat.id, out);
		}
		return map;
	});

	const totalSubcategories = $derived.by(() => {
		const set = new Set<number>();
		for (const cat of categories) for (const s of catSubs(cat)) set.add(Number(s.id));
		return set.size;
	});

	function visibleProducts(cat: Cat): Product[] {
		const sel = selectedSub[cat.id] ?? 'all';
		if (sel === 'all') return productsByCat.get(cat.id) ?? [];
		return productsBySub.get(Number(sel)) ?? [];
	}

	function groupedBySub(cat: Cat): { sub: Sub; products: Product[] }[] {
		if ((selectedSub[cat.id] ?? 'all') !== 'all') return [];
		return catSubs(cat)
			.map((s) => ({ sub: s, products: productsBySub.get(Number(s.id)) ?? [] }))
			.filter((g) => g.products.length > 0);
	}

	function subCount(cat: Cat, subId: number): number {
		return productsBySub.get(Number(subId))?.length ?? 0;
	}

	function selectSub(catId: number, subId: number | 'all') {
		selectedSub = { ...selectedSub, [catId]: subId };
	}

	function scrollToSection(id: string) {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	// -----------------------------
	// Card interactions
	// -----------------------------
	function trackSpotlight(e: MouseEvent) {
		const el = e.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		el.style.setProperty('--x', `${e.clientX - rect.left}px`);
		el.style.setProperty('--y', `${e.clientY - rect.top}px`);
	}

	function toggleWishlist(e: Event, product: Product) {
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

	function addToCart(e: Event, product: Product) {
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
				max_quantity: product.stockQuantity || undefined
			},
			1
		);
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
			{ threshold: 0.08 }
		);
		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<svelte:head>
	<title>Categories — AFCRC</title>
	<meta
		name="description"
		content="Browse our full range of fresh produce, premium meat, supplements, beverages, dairy and grains by category."
	/>
</svelte:head>

{#snippet catIcon(name: string)}
	{#if /agri|crop|produce|veget|fruit|grain|pulse/i.test(name)}
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			><path d="M12 3C12 3 6 9 6 15C6 18 8 21 12 22" /><path
				d="M12 3C12 3 18 9 18 15C18 18 16 21 12 22"
			/><path d="M12 22V6" /></svg
		>
	{:else if /meat|beef|poultry|lamb|chicken|mutton/i.test(name)}
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			><path d="M17 8C17 5 15 3 12 3C9 3 7 5 7 8" /><path d="M5 14L7 21H17L19 14" /><path
				d="M3 14H21"
			/></svg
		>
	{:else if /supplement|wellness|herbal|vitamin|health|extract/i.test(name)}
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			><path d="M7 21L12 17L17 21" /><path d="M12 17V3" /><path d="M9 6C9 6 5 9 5 13" /><path
				d="M15 6C15 6 19 9 19 13"
			/></svg
		>
	{:else if /beverage|drink|juice|smoothie|tea|coffee/i.test(name)}
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			><path
				d="M17 9H7C5 9 4 10 4 12V17C4 19 5 20 7 20H17C19 20 20 19 20 17V12C20 10 19 9 17 9Z"
			/><path d="M8 9V7C8 5 10 4 12 4C14 4 16 5 16 7V9" /><path d="M10 15H14" /></svg
		>
	{:else if /dairy|milk|cheese|butter|egg|yogurt/i.test(name)}
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			><path
				d="M12 3C8.5 3 6.5 6 6.5 9c0 5 2.8 8.2 5.5 10 2.7-1.8 5.5-5 5.5-10 0-3-2-6-5.5-6z"
			/><path d="M12 13c1.5 0 2.5 1 2.5 2.5" /></svg
		>
	{:else}
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			><path d="M12 21V9" /><path d="M12 9c0-3 3-5 6-3-2 3-5 5-6 3z" /><path
				d="M12 9c0-3-3-5-6-3 2 3 5 5 6 3z"
			/></svg
		>
	{/if}
{/snippet}

{#snippet trustIcon(name: string)}
	{#if /leaf|fresh/i.test(name)}
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			><path d="M4 20C4 12 9 5 20 4c1 11-6 16-13 16-2 0-3-.4-3-1z" /><path
				d="M4 20c2-7 7-12 12-14"
			/></svg
		>
	{:else if /delivery|truck|deliver/i.test(name)}
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			><path d="M1 4h15v13H1z" /><path d="M16 8h4l3 3v5h-7z" /><circle
				cx="6.5"
				cy="19.5"
				r="1.5"
			/><circle cx="18.5" cy="19.5" r="1.5" /></svg
		>
	{:else if /secure|payment|protected/i.test(name)}
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg
		>
	{:else}
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.5-6.3" /><path d="M3 3v6h6" /></svg
		>
	{/if}
{/snippet}

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

{#snippet productCard(product: Product, index: number = 0)}
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
			{#if product.stockStatus === 'outofstock' || (product.stockQuantity === 0 && product.stockStatus !== 'instock')}
				<span
					class="absolute top-3 right-3 z-10 rounded-full bg-ink/80 px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold text-white backdrop-blur-sm"
					>Out of stock</span
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
				>{product.brand || 'Product'}</span
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
	class="relative overflow-hidden bg-pine-dark pt-[80px] pb-24 max-md:pb-16"
	style="background:
		radial-gradient(circle at 12% 18%, #4b845a 0%, transparent 38%),
		radial-gradient(circle at 88% 12%, #fbe9ba 0%, transparent 34%),
		linear-gradient(135deg, #17533a 0%, #84a66d 55%, #fdf0cf 105%)"
>
	<div
		class="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
		style="background-image: url('https://picsum.photos/seed/categories-hero/1600/900');"
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

	<div class="relative mx-auto max-w-[1180px] px-6 max-md:px-4">
		<nav
			class="mb-9 flex items-center gap-2 font-mono text-[0.72rem] tracking-[0.08em] text-paper/70 uppercase"
			aria-label="Breadcrumb"
		>
			<a href={resolve('/')} class="transition-colors duration-200 hover:text-gold">Home</a>
			<span aria-hidden="true">/</span>
			<span class="font-semibold text-gold">Categories</span>
		</nav>

		<div class="flex items-end justify-between gap-10 max-lg:flex-col max-lg:items-start">
			<div class="max-w-[620px]" in:fly={{ y: 18, duration: 600, delay: 80 }}>
				<div class="eyebrow text-gold before:bg-gold">Curated collections</div>
				<h1
					class="mt-4 font-serif text-[clamp(2.6rem,6vw,4.2rem)] leading-[1.02] font-bold tracking-[-0.01em] text-paper"
				>
					Shop by
					<span class="relative mx-1 inline-block align-baseline whitespace-nowrap">
						<span
							class="absolute inset-x-[-7px] inset-y-[2px] skew-x-[-6deg] rounded-lg bg-gold/95"
							aria-hidden="true"
						></span>
						<span class="relative text-pine-dark">category</span>
					</span>
				</h1>
				<p class="mt-5 max-w-[520px] text-[0.98rem] leading-relaxed text-paper/85">
					From farm-fresh produce to premium cuts and wellness essentials — explore every
					collection, organised by category and subcategory for effortless browsing.
				</p>

				<div class="mt-7 flex flex-wrap items-center gap-2">
					{#each categories as cat (cat.id)}
						<button
							type="button"
							class="cursor-pointer rounded-full border border-white/30 bg-white/10 px-4 py-1.5 font-mono text-[0.7rem] font-semibold tracking-wide text-paper backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-pine-dark"
							onclick={() => scrollToSection(`category-${cat.id}`)}
						>
							{cat.name}
						</button>
					{/each}
				</div>
			</div>

			<div
				class="grid shrink-0 grid-cols-2 gap-3 max-lg:w-full max-lg:grid-cols-4 max-sm:grid-cols-2"
				in:fly={{ y: 18, duration: 600, delay: 180 }}
			>
				<div
					class="group rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.6rem] leading-none font-bold text-gold">
						{categories.length}
					</p>
					<p class="mt-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-paper/80 uppercase">
						Categories
					</p>
				</div>
				<div
					class="group rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.6rem] leading-none font-bold text-gold">
						{totalSubcategories}
					</p>
					<p class="mt-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-paper/80 uppercase">
						Subcategories
					</p>
				</div>
				<div
					class="group rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.6rem] leading-none font-bold text-gold">
						{allProducts.length}
					</p>
					<p class="mt-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-paper/80 uppercase">
						Products
					</p>
				</div>
				<div
					class="group rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.6rem] leading-none font-bold text-gold">24h</p>
					<p class="mt-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-paper/80 uppercase">
						Delivery
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ── Trust strip ── -->
<section class="border-b border-line bg-paper-white">
	<div
		class="mx-auto grid max-w-[1180px] grid-cols-4 gap-4 px-6 py-5 max-md:px-4 max-sm:grid-cols-2"
	>
		{#each ['Farm Fresh Daily', 'Free Delivery', 'Secure Payment', 'Easy Returns'] as label, i (label)}
			<div class="flex items-center gap-3" use:reveal={{ delay: i * 70 }}>
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10 text-pine-dark transition-transform duration-300 hover:scale-110 hover:rotate-6"
				>
					{@render trustIcon(label)}
				</div>
				<div class="min-w-0">
					<p class="truncate text-[0.82rem] font-bold text-pine-dark">{label}</p>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- ── Category index ── -->
{#if categories.length > 0}
	<section class="bg-paper-white py-[70px] max-md:py-12">
		<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
			<div class="mb-9 flex items-end justify-between gap-6">
				{@render sectionHeader('Browse the store', 'All', 'categories')}
			</div>

			<div class="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
				{#each categories as cat, i (cat.id)}
					<button
						type="button"
						class="group relative flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_8px_28px_-12px_rgba(18,50,26,0.15)] transition-all duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)] hover:-translate-y-1.5 hover:shadow-[0_18px_36px_-10px_rgba(30,75,51,0.28)]"
						onclick={() => scrollToSection(`category-${cat.id}`)}
						aria-label="Shop {cat.name}"
						use:reveal={{ delay: i * 60 }}
					>
						<div class="relative h-[170px] overflow-hidden bg-paper-2">
							<img
								src={getImageUrl(
									cat.featured_image,
									`https://picsum.photos/seed/cat-${cat.id}/600/400`
								)}
								alt={cat.name}
								loading="lazy"
								class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
							/>
							<div
								class="absolute inset-0 bg-gradient-to-t from-pine-dark/70 via-pine-dark/10 to-transparent"
							></div>
							<div
								class="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 text-pine-dark shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-gold"
							>
								{@render catIcon(cat.name)}
							</div>
							<span
								class="absolute bottom-3 left-3 rounded-full bg-gold px-2.5 py-1 font-mono text-[0.62rem] font-bold text-pine-dark"
							>
								{productsByCat.get(cat.id)?.length ?? 0} products
							</span>
						</div>
						<div class="flex flex-1 items-center justify-between gap-3 p-4">
							<div class="min-w-0">
								<h3
									class="truncate font-serif text-[1.05rem] font-semibold text-pine-dark transition-colors duration-200 group-hover:text-teal"
								>
									{cat.name}
								</h3>
								<span
									class="mt-1 block h-[3px] w-6 rounded-full bg-gold transition-all duration-300 group-hover:w-12"
									aria-hidden="true"
								></span>
								<p class="mt-1.5 truncate text-[0.78rem] text-ink-soft">
									{cat.description || `${catSubs(cat).length} subcategories`}
								</p>
							</div>
							<span
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-pine-dark transition-all duration-300 group-hover:translate-x-1 group-hover:border-pine-dark group-hover:bg-pine-dark group-hover:text-white"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg
								>
							</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- ── Category sections with subcategory product lists ── -->
{#each categories as cat, catIndex (cat.id)}
	{@const subs = catSubs(cat)}
	{@const catProducts = productsByCat.get(cat.id) ?? []}
	<section
		class="bg-paper-white py-[70px] max-md:py-12 {catIndex % 2 === 1 ? 'bg-paper-2/30' : ''}"
		id="category-{cat.id}"
	>
		<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
			<div class="mb-8 flex items-end justify-between gap-6">
				<div class="flex items-start gap-4">
					<div
						class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pine-dark text-gold shadow-[0_10px_24px_-8px_rgba(23,83,58,0.45)]"
					>
						{@render catIcon(cat.name)}
					</div>
					<div>
						<div class="eyebrow mb-2 font-bold before:h-[2px] before:w-7 before:rounded-full">
							Category {String(catIndex + 1).padStart(2, '0')}
						</div>
						<h2
							class="font-serif text-[clamp(1.6rem,3vw,2.3rem)] leading-[1.05] font-semibold tracking-[-0.01em] text-pine-dark"
						>
							{cat.name}
						</h2>
						<p class="mt-1.5 max-w-[560px] text-[0.85rem] text-ink-soft">
							{cat.description || 'Handpicked products across this collection.'}
						</p>
					</div>
				</div>
				<div class="flex shrink-0 items-center gap-2.5">
					<span
						class="rounded-full bg-teal/10 px-3.5 py-1.5 font-mono text-[0.7rem] font-bold text-pine-dark"
					>
						{catProducts.length} products
					</span>
					<a
						href={getCategoryUrl(cat)}
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-5 py-2.5 font-mono text-[0.72rem] font-semibold tracking-[0.04em] text-pine-dark transition-all duration-300 hover:border-pine-dark hover:bg-pine-dark hover:text-white"
					>
						View all
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
			</div>

			<!-- Subcategory pills -->
			{#if subs.length > 0}
				<div class="mb-8 flex flex-wrap items-center gap-2">
					<button
						type="button"
						class="cursor-pointer rounded-full px-4 py-2 font-mono text-[0.72rem] font-semibold tracking-[0.03em] transition-all duration-300 {selectedSub[
							cat.id
						] === undefined || selectedSub[cat.id] === 'all'
							? 'bg-pine-dark text-white shadow-[0_10px_22px_-8px_rgba(23,83,58,0.5)]'
							: 'border border-line bg-white text-ink-soft hover:border-pine/40 hover:text-pine-dark'}"
						onclick={() => selectSub(cat.id, 'all')}
					>
						All
						<span class="ml-1.5 opacity-70">{catProducts.length}</span>
					</button>
					{#each subs as sub (sub.id)}
						<button
							type="button"
							class="cursor-pointer rounded-full px-4 py-2 font-mono text-[0.72rem] font-semibold tracking-[0.03em] transition-all duration-300 {selectedSub[
								cat.id
							] === Number(sub.id)
								? 'bg-pine-dark text-white shadow-[0_10px_22px_-8px_rgba(23,83,58,0.5)]'
								: 'border border-line bg-white text-ink-soft hover:border-pine/40 hover:text-pine-dark'}"
							onclick={() => selectSub(cat.id, Number(sub.id))}
						>
							{sub.name}
							<span class="ml-1.5 opacity-70">{subCount(cat, Number(sub.id))}</span>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Product lists -->
			{#if (selectedSub[cat.id] ?? 'all') === 'all' && groupedBySub(cat).length > 0}
				<!-- Grouped by subcategory -->
				<div class="flex flex-col gap-10">
					{#each groupedBySub(cat) as group (group.sub.id)}
						<div>
							<div class="mb-4 flex items-center justify-between gap-4">
								<div class="flex items-center gap-2.5">
									<span class="inline-block h-[3px] w-8 rounded-full bg-gold" aria-hidden="true"
									></span>
									<h3 class="font-serif text-[1.2rem] font-semibold text-pine-dark">
										{group.sub.name}
									</h3>
									<span
										class="rounded-full bg-white px-2.5 py-0.5 font-mono text-[0.62rem] font-bold text-teal"
									>
										{group.products.length}
									</span>
								</div>
							</div>
							<div
								class="grid grid-cols-4 gap-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1"
							>
								{#each group.products.slice(0, 8) as product, i (product.id)}
									{@render productCard(product, i)}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{:else if visibleProducts(cat).length > 0}
				<!-- Selected subcategory (or fallback flat grid) -->
				<div
					class="grid grid-cols-4 gap-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1"
				>
					{#each visibleProducts(cat) as product, i (product.id)}
						{@render productCard(product, i)}
					{/each}
				</div>
			{:else}
				<div
					class="flex flex-col items-center justify-between gap-6 rounded-2xl border border-dashed border-pine/30 bg-paper-2/40 px-8 py-10 text-center max-md:flex-col"
				>
					<div class="flex flex-col items-center gap-3">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-pine-dark"
						>
							{@render catIcon(cat.name)}
						</div>
						<div>
							<p class="font-serif text-[1.1rem] font-semibold text-pine-dark">
								{cat.name} products arriving soon
							</p>
							<p class="mt-1 max-w-[420px] text-[0.85rem] text-ink-soft">
								We're restocking this collection. Browse the full catalogue in the meantime.
							</p>
						</div>
					</div>
					<button
						type="button"
						class="shrink-0 cursor-pointer rounded-full bg-pine px-6 py-2.5 text-[0.85rem] font-bold text-white transition-colors duration-200 hover:bg-pine-dark"
						onclick={() => scrollToSection('category-index')}
					>
						Browse other categories
					</button>
				</div>
			{/if}
		</div>
	</section>
{/each}

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
