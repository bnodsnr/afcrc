<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
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

	type HeroSlide = {
		id: number;
		image: string;
		eyebrow: string;
		title: string;
		description: string;
		badge: string;
		subId?: number;
	};

	type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'discount' | 'name';

	const category = $derived(
		(data?.category ?? null) as {
			id: number;
			name: string;
			description?: string;
			featured_image?: string | null;
			seo_slug?: string;
			slug?: string;
			subcategories?: Sub[] | null;
		} | null
	);
	const allSubcategories = $derived((data?.subcategories ?? []) as Sub[]);
	const allProducts = $derived((data?.products ?? []) as ApiProduct[]);
	const allCategories = $derived((data?.categories ?? []) as Cat[]);

	const starItems = [0, 1, 2, 3, 4];

	let wishlist = $state<Set<number>>(new Set());
	let selectedSub = $state<number | 'all'>('all');
	let sortBy = $state<SortOption>('featured');
	let query = $state('');
	let categoriesOpen = $state(false);

	// ── Hero slider state ──
	let currentSlide = $state(0);
	let autoTimer: ReturnType<typeof setInterval> | undefined;

	const AUTOPLAY_MS = 5500;

	function nextSlide() {
		if (heroSlides.length < 2) return;
		currentSlide = (currentSlide + 1) % heroSlides.length;
	}

	function prevSlide() {
		if (heroSlides.length < 2) return;
		currentSlide = (currentSlide - 1 + heroSlides.length) % heroSlides.length;
	}

	function goToSlide(i: number) {
		currentSlide = i;
	}

	function startAuto() {
		stopAuto();
		if (heroSlides.length < 2) return;
		autoTimer = setInterval(nextSlide, AUTOPLAY_MS);
	}

	function stopAuto() {
		if (autoTimer) clearInterval(autoTimer);
		autoTimer = undefined;
	}

	onMount(() => {
		startAuto();
		return stopAuto;
	});

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

	function catSubs(): Sub[] {
		const inline = (category?.subcategories ?? []).filter((s) => s && Number(s.id) > 0);
		if (inline.length) return inline;
		return allSubcategories.filter((s) => {
			const c = s.category;
			if (typeof c === 'number') return c === category?.id;
			if (c && typeof c === 'object') return Number(c.id) === Number(category?.id);
			if (typeof c === 'string') return c === category?.name;
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

	const catProducts = $derived.by(() => {
		const seen = new Set<number>();
		const out: Product[] = [];
		for (const s of catSubs()) {
			for (const p of productsBySub.get(Number(s.id)) ?? []) {
				if (!seen.has(p.id)) {
					seen.add(p.id);
					out.push(p);
				}
			}
		}
		if (out.length === 0 && category) {
			const kw = category.name.toLowerCase();
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
		return out;
	});

	// ── Hero slides ──
	const heroSlides = $derived.by(() => {
		const slides: HeroSlide[] = [];
		const subs = catSubs();
		const catName = category?.name || 'Collection';

		if (category?.featured_image) {
			slides.push({
				id: 0,
				image: getImageUrl(category.featured_image),
				eyebrow: 'Curated collection',
				title: catName,
				description:
					category?.description ||
					`Handpicked products across the ${catName} collection, sourced fresh and delivered with care.`,
				badge: `${catProducts.length} products`
			});
		}

		for (const s of subs) {
			if (!s.featured_image) continue;
			slides.push({
				id: slides.length + 1,
				image: getImageUrl(s.featured_image),
				eyebrow: 'Subcategory',
				title: s.name,
				description: `Browse ${s.name} inside ${catName} — freshly sourced, quality-checked and ready for delivery.`,
				badge: `${subCount(Number(s.id))} products`,
				subId: Number(s.id)
			});
		}

		if (slides.length === 0) {
			const imgs = catProducts
				.map((p) => p.image)
				.filter(Boolean)
				.slice(0, 4);
			if (imgs.length) {
				imgs.forEach((img, i) => {
					slides.push({
						id: i,
						image: getImageUrl(img),
						eyebrow: 'Curated collection',
						title: catName,
						description:
							category?.description || `Handpicked products across the ${catName} collection.`,
						badge: `${catProducts.length} products`
					});
				});
			}
		}

		if (slides.length === 0) {
			slides.push({
				id: 0,
				image: 'https://picsum.photos/seed/afcrc-category-hero/1600/900',
				eyebrow: 'Curated collection',
				title: catName,
				description: `Handpicked products across the ${catName} collection, sourced fresh and delivered with care.`,
				badge: 'Shop now'
			});
		}

		return slides;
	});

	// ── Sorting / filtering ──
	const sortOptions: { value: SortOption; label: string }[] = [
		{ value: 'featured', label: 'Featured' },
		{ value: 'price-asc', label: 'Price: Low to High' },
		{ value: 'price-desc', label: 'Price: High to Low' },
		{ value: 'discount', label: 'Biggest Discount' },
		{ value: 'name', label: 'Name A–Z' }
	];

	// ── Sections grouped by subcategory ──
	const subSections = $derived.by(() => {
		return catSubs()
			.map((s) => ({
				id: Number(s.id),
				name: s.name,
				image: s.featured_image ? getImageUrl(s.featured_image) : '',
				products: productsBySub.get(Number(s.id)) ?? []
			}))
			.filter((s) => s.products.length > 0);
	});

	// Products not assigned to any subcategory
	const orphanProducts = $derived.by(() => {
		const assigned = new Set<number>();
		for (const s of subSections) {
			for (const p of s.products) assigned.add(p.id);
		}
		return catProducts.filter((p) => !assigned.has(p.id));
	});

	// Sections to render, respecting the active subcategory, search and sort
	const visibleSections = $derived.by(() => {
		const q = query.trim().toLowerCase();

		const sort = (list: Product[]): Product[] => {
			const arr = [...list];
			switch (sortBy) {
				case 'price-asc':
					arr.sort((a, b) => a.price - b.price);
					break;
				case 'price-desc':
					arr.sort((a, b) => b.price - a.price);
					break;
				case 'discount':
					arr.sort((a, b) => b.discount - a.discount);
					break;
				case 'name':
					arr.sort((a, b) => a.name.localeCompare(b.name));
					break;
			}
			return arr;
		};

		const filter = (list: Product[]): Product[] => {
			const base = q
				? list.filter(
						(p) => p.name.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q)
					)
				: [...list];
			return sort(base);
		};

		if (selectedSub !== 'all') {
			const s = subSections.find((s) => s.id === selectedSub);
			return s ? [{ ...s, products: filter(s.products) }] : [];
		}

		const sections = subSections.map((s) => ({ ...s, products: filter(s.products) }));
		if (orphanProducts.length) {
			sections.push({
				id: 0,
				name: `More ${category?.name?.toLowerCase() || 'products'}`,
				image: '',
				products: filter(orphanProducts)
			});
		}
		return sections;
	});

	const totalShown = $derived(visibleSections.reduce((n, s) => n + s.products.length, 0));

	// ── Demo data (shown when the category has no products) ──
	function demoProduct(
		id: number,
		name: string,
		price: number,
		originalPrice: number,
		seed: string,
		brand: string,
		rating = 4.5
	): Product {
		return {
			id,
			name,
			slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
			seo_slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
			sku: `DEMO-${id}`,
			brand,
			price,
			originalPrice,
			discount:
				originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
			image: `https://picsum.photos/seed/${seed}/600/450`,
			rating,
			reviews: 0,
			stockStatus: 'instock',
			stockQuantity: 25
		};
	}

	const demoSections = [
		{
			id: 101,
			name: 'Fruits & Vegetables',
			image: 'https://picsum.photos/seed/produce/400/400',
			products: [
				demoProduct(9001, 'Farm-Fresh Red Apples', 180, 210, 'red-apple', 'Fruits & Vegetables'),
				demoProduct(9002, 'Organic Bananas (Dozen)', 90, 110, 'banana', 'Fruits & Vegetables'),
				demoProduct(9003, 'Sun-Ripened Tomatoes', 60, 75, 'tomato', 'Fruits & Vegetables', 4.6),
				demoProduct(9004, 'Tender Spinach Bunch', 40, 55, 'spinach', 'Fruits & Vegetables', 4.4)
			]
		},
		{
			id: 102,
			name: 'Cereals & Grains',
			image: 'https://picsum.photos/seed/grains/400/400',
			products: [
				demoProduct(9101, 'Aged Basmati Rice 5kg', 950, 1099, 'basmati', 'Cereals & Grains', 4.8),
				demoProduct(9102, 'Stone-Ground Whole Wheat Atta', 240, 280, 'atta', 'Cereals & Grains'),
				demoProduct(9103, 'Rolled Oats 1kg', 180, 220, 'oats', 'Cereals & Grains', 4.6),
				demoProduct(9104, 'Premium Toor Dal 2kg', 320, 360, 'dal', 'Cereals & Grains', 4.5)
			]
		},
		{
			id: 103,
			name: 'Dairy & Eggs',
			image: 'https://picsum.photos/seed/dairy/400/400',
			products: [
				demoProduct(9201, 'Full-Cream Milk 1L', 90, 105, 'milk', 'Dairy & Eggs'),
				demoProduct(9202, 'Farm Fresh Eggs (Pack of 12)', 110, 130, 'eggs', 'Dairy & Eggs', 4.7),
				demoProduct(9203, 'Cultured Curd 400g', 70, 85, 'curd', 'Dairy & Eggs', 4.3),
				demoProduct(9204, 'Unsalted Cream Butter', 65, 80, 'butter', 'Dairy & Eggs', 4.4)
			]
		},
		{
			id: 104,
			name: 'Herbal & Wellness',
			image: 'https://picsum.photos/seed/herbs/400/400',
			products: [
				demoProduct(9301, 'Wild Forest Honey 500g', 420, 499, 'honey', 'Herbal & Wellness', 4.9),
				demoProduct(9302, 'Turmeric Power 250g', 150, 180, 'turmeric', 'Herbal & Wellness', 4.6),
				demoProduct(9303, 'Green Tea Leaves 200g', 260, 300, 'greentea', 'Herbal & Wellness', 4.7),
				demoProduct(
					9304,
					'Cold-Pressed Mustard Oil 1L',
					340,
					390,
					'mustard',
					'Herbal & Wellness',
					4.5
				)
			]
		}
	];

	const displaySections = $derived.by(() => {
		if (catProducts.length === 0) return demoSections;
		return visibleSections;
	});

	const displayTotal = $derived(displaySections.reduce((n, s) => n + s.products.length, 0));

	function subCount(subId: number): number {
		return productsBySub.get(Number(subId))?.length ?? 0;
	}

	function subName(subId: number): string {
		return catSubs().find((s) => Number(s.id) === Number(subId))?.name ?? 'Subcategory';
	}

	function selectSub(subId: number | 'all') {
		selectedSub = subId;
		if (subId !== 'all') {
			requestAnimationFrame(() => {
				document
					.getElementById(`sub-${subId}`)
					?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			});
		}
	}

	function clearFilters() {
		selectedSub = 'all';
		query = '';
	}

	function scrollToProducts() {
		document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
	<title>{category?.name || 'Category'} - AFCRC</title>
	<meta
		name="description"
		content="Browse {category?.name ||
			'our'} collection of farm-fresh produce, meat, supplements and more."
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

<!-- ══════════════════════ HERO SLIDER ══════════════════════ -->
<section
	class="relative overflow-hidden bg-pine-dark pt-[80px]"
	onmouseenter={stopAuto}
	onmouseleave={startAuto}
	aria-roledescription="carousel"
	aria-label="Featured {category?.name || 'collection'}"
>
	<!-- Background slides -->
	<div class="absolute inset-0" aria-hidden="true">
		{#each heroSlides as slide, i (slide.id)}
			<div
				class="absolute inset-0 overflow-hidden transition-opacity duration-[1100ms] ease-in-out {i ===
				currentSlide
					? 'opacity-100'
					: 'opacity-0'}"
			>
				<div
					class="hero-bg h-full w-full bg-cover bg-center"
					class:ken-burns-in={i === currentSlide}
					style="background-image: url({slide.image});"
				></div>
				<div
					class="absolute inset-0 bg-gradient-to-r from-pine-dark/95 via-pine-dark/65 to-pine-dark/20"
				></div>
				<div
					class="absolute inset-0 bg-gradient-to-t from-pine-dark/90 via-transparent to-pine-dark/35"
				></div>
			</div>
		{/each}
	</div>

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

	<div class="relative mx-auto max-w-[1240px] px-6 max-md:px-4">
		<nav
			class="flex items-center gap-2 py-6 font-mono text-[0.72rem] tracking-[0.08em] text-paper/70 uppercase"
			aria-label="Breadcrumb"
		>
			<a href={resolve('/')} class="transition-colors duration-200 hover:text-gold">Home</a>
			<span aria-hidden="true">/</span>
			<a href={resolve('/categories')} class="transition-colors duration-200 hover:text-gold"
				>Categories</a
			>
			<span aria-hidden="true">/</span>
			<span class="font-semibold text-gold">{category?.name || 'Category'}</span>
		</nav>

		<div
			class="flex items-end justify-between gap-10 pt-2 pb-16 max-lg:flex-col max-lg:items-start"
		>
			<div class="max-w-[640px]">
				{#key currentSlide}
					<div
						in:fly={{ y: 22, duration: 550 }}
						class="rounded-3xl border border-white/15 bg-white/[0.08] p-7 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.55)] backdrop-blur-md max-sm:p-5"
					>
						<div class="eyebrow text-gold before:bg-gold">
							{heroSlides[currentSlide].eyebrow}
						</div>
						<h1
							class="mt-3 font-serif text-[clamp(2.1rem,5vw,3.4rem)] leading-[1.03] font-bold tracking-[-0.01em] text-paper"
						>
							{heroSlides[currentSlide].title}
						</h1>
						<p class="mt-4 max-w-[520px] text-[0.96rem] leading-relaxed text-paper/85">
							{heroSlides[currentSlide].description}
						</p>
						<div class="mt-6 flex flex-wrap items-center gap-3">
							<button
								type="button"
								class="cursor-pointer rounded-full bg-gold px-6 py-3 font-mono text-[0.72rem] font-bold tracking-[0.05em] text-pine-dark uppercase shadow-[0_10px_30px_-10px_rgba(212,168,67,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-paper hover:shadow-[0_14px_36px_-10px_rgba(212,168,67,0.8)]"
								onclick={scrollToProducts}
							>
								Shop the collection
							</button>
							<button
								type="button"
								class="cursor-pointer rounded-full border border-white/30 bg-white/10 px-6 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.05em] text-paper uppercase backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-white/15 hover:text-gold"
								onclick={() => {
									if (heroSlides[currentSlide].subId)
										selectSub(Number(heroSlides[currentSlide].subId));
									scrollToProducts();
								}}
							>
								Explore {heroSlides[currentSlide].badge}
							</button>
						</div>
					</div>
				{/key}
			</div>

			<div
				class="grid shrink-0 grid-cols-2 gap-3 max-lg:w-full max-lg:grid-cols-4 max-sm:grid-cols-2"
			>
				<div
					class="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.6rem] leading-none font-bold text-gold">
						{catProducts.length}
					</p>
					<p class="mt-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-paper/80 uppercase">
						Products
					</p>
				</div>
				<div
					class="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.6rem] leading-none font-bold text-gold">
						{catSubs().length}
					</p>
					<p class="mt-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-paper/80 uppercase">
						Subcategories
					</p>
				</div>
				<div
					class="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.6rem] leading-none font-bold text-gold">
						{totalShown}
					</p>
					<p class="mt-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-paper/80 uppercase">
						Showing
					</p>
				</div>
				<div
					class="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.6rem] leading-none font-bold text-gold">24h</p>
					<p class="mt-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-paper/80 uppercase">
						Delivery
					</p>
				</div>
			</div>
		</div>

		<!-- Dots + counter -->
		{#if heroSlides.length > 1}
			<div class="flex items-center gap-4 pb-8">
				<div class="flex items-center gap-2">
					{#each heroSlides as _, i (i)}
						<button
							type="button"
							class="hero-dot {i === currentSlide ? 'active' : ''}"
							onclick={() => goToSlide(i)}
							aria-label="Go to slide {i + 1}"
						>
							{#if i === currentSlide}
								<span class="dot-progress"></span>
							{/if}
						</button>
					{/each}
				</div>
				<span class="font-mono text-[0.68rem] tracking-[0.14em] text-paper/60 tabular-nums"
					>{String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(
						2,
						'0'
					)}</span
				>
			</div>
		{/if}
	</div>

	<!-- Arrows -->
	{#if heroSlides.length > 1}
		<button
			type="button"
			class="hero-arrow group absolute top-1/2 left-5 z-20 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 p-3 text-paper backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-gold hover:bg-gold hover:text-pine-dark md:flex"
			onclick={prevSlide}
			aria-label="Previous slide"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 18 18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M11 13 7 9l4-4" /></svg
			>
		</button>
		<button
			type="button"
			class="hero-arrow group absolute top-1/2 right-5 z-20 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 p-3 text-paper backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-gold hover:bg-gold hover:text-pine-dark md:flex"
			onclick={nextSlide}
			aria-label="Next slide"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 18 18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M7 5l4 4-4 4" /></svg
			>
		</button>
	{/if}
</section>

<!-- ── Subcategory strip ── -->
<!-- {#if catSubs().length > 0}
	<section class="border-b border-line bg-paper-white">
		<div
			class="mx-auto grid max-w-[1240px] grid-cols-4 gap-4 px-6 py-5 max-md:px-4 max-sm:grid-cols-2"
		>
			{#each catSubs() as sub, i (sub.id)}
				<button
					type="button"
					class="flex cursor-pointer items-center gap-3 text-left"
					use:reveal={{ delay: i * 70 }}
					onclick={() => {
						selectSub(Number(sub.id));
						scrollToProducts();
					}}
					aria-label="Browse {sub.name}"
				>
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal/10 text-pine-dark transition-transform duration-300 hover:scale-110 hover:rotate-6"
					>
						{#if sub.featured_image}
							<img
								src={getImageUrl(sub.featured_image)}
								alt={sub.name}
								loading="lazy"
								class="h-full w-full object-cover"
							/>
						{:else}
							{@render catIcon(sub.name)}
						{/if}
					</div>
					<div class="min-w-0">
						<p class="truncate text-[0.82rem] font-bold text-pine-dark">{sub.name}</p>
						<p class="font-mono text-[0.6rem] tracking-[0.08em] text-ink-soft uppercase">
							{subCount(Number(sub.id))} products
						</p>
					</div>
				</button>
			{/each}
		</div>
	</section>
{/if} -->

<!-- ══════════════════════ SHOP LAYOUT ══════════════════════ -->
<section id="products" class="bg-paper-white py-14 max-md:py-10">
	<div class="mx-auto max-w-[1240px] px-6 max-md:px-4">
		<!-- ── Filter toolbar ── -->
		<div class="mb-8 flex flex-wrap items-center gap-3 max-sm:flex-col max-sm:items-stretch">
			<button
				type="button"
				class="flex h-11 shrink-0 cursor-pointer items-center gap-2.5 rounded-full border border-line bg-white px-5 font-mono text-[0.72rem] font-semibold tracking-[0.04em] text-pine-dark shadow-[0_8px_24px_-14px_rgba(18,50,26,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:border-pine/40 hover:bg-paper-2"
				onclick={() => (categoriesOpen = true)}
				aria-label="Browse all categories"
				aria-expanded={categoriesOpen}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg
				>
				Categories
				<span
					class="rounded-full bg-teal/10 px-2 py-0.5 font-mono text-[0.62rem] font-bold text-teal"
				>
					{allCategories.length}
				</span>
			</button>

			<div class="relative min-w-0 flex-1 max-sm:w-full">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft"
					><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /></svg
				>
				<input
					type="search"
					bind:value={query}
					placeholder="Search in {category?.name || 'this collection'}…"
					class="h-11 w-full rounded-full border border-line bg-white pr-4 pl-11 font-mono text-[0.72rem] text-ink shadow-[0_8px_24px_-14px_rgba(18,50,26,0.25)] transition-all duration-300 outline-none placeholder:text-ink-soft/70 focus:border-pine/50 focus:ring-2 focus:ring-pine/15"
				/>
			</div>

			<div class="relative shrink-0">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft"
					><path d="M4 7h16M7 12h10M10 17h4" /></svg
				>
				<select
					bind:value={sortBy}
					class="h-11 cursor-pointer appearance-none rounded-full border border-line bg-white pr-9 pl-10 font-mono text-[0.72rem] font-semibold text-pine-dark shadow-[0_8px_24px_-14px_rgba(18,50,26,0.25)] transition-all duration-300 outline-none focus:border-pine/50 focus:ring-2 focus:ring-pine/15"
					aria-label="Sort products"
				>
					{#each sortOptions as o (o.value)}
						<option value={o.value}>{o.label}</option>
					{/each}
				</select>
				<svg
					width="12"
					height="12"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-soft"
					><path d="M4 6l4 4 4-4" /></svg
				>
			</div>
		</div>

		<!-- ── Results meta + active filters ── -->
		<div class="mb-8 flex flex-wrap items-center justify-between gap-3">
			<!-- <p class="font-mono text-[0.72rem] tracking-[0.06em] text-ink-soft">
				Showing
				<span class="font-bold text-pine-dark">{displayTotal}</span>
				of {catProducts.length > 0 ? catProducts.length : displayTotal} products
				{#if selectedSub !== 'all'}
					in <span class="font-bold text-teal">{subName(selectedSub)}</span>
				{/if}
			</p> -->
			{#if selectedSub !== 'all' || query.trim()}
				<div class="flex flex-wrap items-center gap-2" transition:fade={{ duration: 200 }}>
					<span class="font-mono text-[0.66rem] tracking-[0.1em] text-ink-soft uppercase"
						>Active</span
					>
					{#if selectedSub !== 'all'}
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-pine-dark px-3 py-1.5 font-mono text-[0.68rem] font-semibold text-white"
						>
							{subName(selectedSub)}
							<button
								type="button"
								class="cursor-pointer text-white/70 transition-colors hover:text-white"
								onclick={() => selectSub('all')}
								aria-label="Remove subcategory filter">&times;</button
							>
						</span>
					{/if}
					{#if query.trim()}
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 font-mono text-[0.68rem] font-semibold text-white"
						>
							"{query.trim()}"
							<button
								type="button"
								class="cursor-pointer text-white/70 transition-colors hover:text-white"
								onclick={() => (query = '')}
								aria-label="Clear search">&times;</button
							>
						</span>
					{/if}
					<button
						type="button"
						class="cursor-pointer rounded-full px-3 py-1.5 font-mono text-[0.68rem] font-semibold text-teal underline-offset-2 transition-colors hover:text-pine-dark hover:underline"
						onclick={clearFilters}
					>
						Clear all
					</button>
				</div>
			{/if}
		</div>

		<!-- ── Subcategory sections ── -->
		{#if displaySections.length > 0}
			<div class="space-y-14">
				{#each displaySections as section, i (section.id)}
					<section id="sub-{section.id}" class="scroll-mt-32" transition:fade={{ duration: 250 }}>
						<div class="mb-6 flex items-end justify-between gap-6">
							<div class="min-w-0">
								<div class="eyebrow font-bold before:h-[2px] before:w-7 before:rounded-full">
									Curated picks
								</div>
								<h2
									class="mt-2 font-serif text-[clamp(1.65rem,3vw,2.15rem)] leading-[1.06] font-bold tracking-[-0.01em] text-pine-dark"
								>
									{section.name}
								</h2>
								<p class="mt-1.5 font-mono text-[0.66rem] tracking-[0.1em] text-ink-soft uppercase">
									{section.products.length} fresh picks, ready to deliver
								</p>
							</div>
							<span
								class="hidden shrink-0 items-center gap-2 rounded-full border border-pine/15 bg-white px-4 py-2 font-mono text-[0.68rem] font-bold text-pine-dark shadow-[0_8px_24px_-14px_rgba(18,50,26,0.3)] sm:inline-flex"
							>
								<span class="h-2 w-2 animate-pulse rounded-full bg-teal"></span>
								{section.products.length} items
							</span>
						</div>
						<div class="mb-7 h-px bg-gradient-to-r from-pine/30 via-line to-transparent"></div>

						{#if section.products.length > 0}
							<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
								{#each section.products as product, j (product.id)}
									{@render productCard(product, j)}
								{/each}
							</div>
						{:else}
							<div
								class="rounded-2xl border border-dashed border-pine/30 bg-paper-2/40 px-6 py-10 text-center"
							>
								<p class="text-[0.9rem] text-ink-soft">
									No products match your search in {section.name}.
								</p>
							</div>
						{/if}
					</section>

					{#if i < displaySections.length - 1}
						<div class="h-px bg-gradient-to-r from-transparent via-pine/20 to-transparent"></div>
					{/if}
				{/each}
			</div>
		{:else}
			<div
				class="flex flex-col items-center justify-between gap-6 rounded-2xl border border-dashed border-pine/30 bg-paper-2/40 px-8 py-12 text-center max-md:flex-col"
			>
				<div class="flex flex-col items-center gap-3">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-pine-dark"
					>
						{@render catIcon(category?.name || 'Products')}
					</div>
					<div>
						<p class="font-serif text-[1.1rem] font-semibold text-pine-dark">
							No products match your filters
						</p>
						<p class="mt-1 max-w-[420px] text-[0.85rem] text-ink-soft">
							Try a different subcategory, clear the search, or browse the full catalogue.
						</p>
					</div>
				</div>
				<button
					type="button"
					class="shrink-0 cursor-pointer rounded-full bg-pine px-6 py-2.5 text-[0.85rem] font-bold text-white transition-colors duration-200 hover:bg-pine-dark"
					onclick={clearFilters}
				>
					Clear all filters
				</button>
			</div>
		{/if}
	</div>
</section>

{#if categoriesOpen}
	<div
		class="fixed inset-0 z-[80]"
		role="dialog"
		aria-modal="true"
		aria-label="Browse all categories"
	>
		<button
			type="button"
			class="absolute inset-0 h-full w-full cursor-default bg-pine-dark/50 backdrop-blur-sm"
			onclick={() => (categoriesOpen = false)}
			transition:fade={{ duration: 200 }}
			aria-label="Close categories"
		></button>

		<aside
			class="absolute top-0 left-0 flex h-full w-[330px] max-w-[88vw] flex-col bg-white shadow-2xl"
			transition:fly={{ x: -40, duration: 300 }}
		>
			<header class="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine-dark text-gold"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							stroke-linecap="round"
							stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg
						>
					</div>
					<div class="min-w-0">
						<p class="font-mono text-[0.6rem] tracking-[0.14em] text-teal uppercase">Explore</p>
						<h2
							class="truncate font-serif text-[1.15rem] leading-tight font-semibold text-pine-dark"
						>
							All Categories
						</h2>
					</div>
				</div>
				<button
					type="button"
					class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-paper-2 text-pine-dark transition-all duration-200 hover:rotate-90 hover:bg-pine-dark hover:text-white"
					onclick={() => (categoriesOpen = false)}
					aria-label="Close categories"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg
					>
				</button>
			</header>

			<div class="flex-1 overflow-y-auto p-3">
				{#if allCategories.length > 0}
					<ul class="space-y-1">
						{#each allCategories as c (c.id)}
							<li>
								<a
									href={getCategoryUrl(c)}
									class="drawer-link {c.id === category?.id ? 'active' : ''}"
								>
									<span
										class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-pine-dark"
									>
										{@render catIcon(c.name)}
									</span>
									<span class="min-w-0 flex-1 truncate">{c.name}</span>
									<svg
										width="13"
										height="13"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.6"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="opacity-40"><path d="M3 8h10M9 4l4 4-4 4" /></svg
									>
								</a>
							</li>
						{/each}
					</ul>
				{:else}
					<p
						class="px-3 py-8 text-center font-mono text-[0.72rem] tracking-[0.06em] text-ink-soft uppercase"
					>
						No categories yet
					</p>
				{/if}
			</div>

			{#if category && catSubs().length > 0}
				<div class="border-t border-line p-4">
					<p class="mb-2.5 font-mono text-[0.6rem] tracking-[0.14em] text-ink-soft uppercase">
						Inside {category.name}
					</p>
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							class="shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 font-mono text-[0.68rem] font-semibold tracking-[0.03em] transition-all duration-300 {selectedSub ===
							'all'
								? 'bg-pine-dark text-white'
								: 'border border-line bg-white text-ink-soft'}"
							onclick={() => {
								selectSub('all');
								categoriesOpen = false;
							}}
						>
							All
						</button>
						{#each catSubs() as sub (sub.id)}
							<button
								type="button"
								class="shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 font-mono text-[0.68rem] font-semibold tracking-[0.03em] transition-all duration-300 {selectedSub ===
								Number(sub.id)
									? 'bg-pine-dark text-white'
									: 'border border-line bg-white text-ink-soft'}"
								onclick={() => {
									selectSub(Number(sub.id));
									categoriesOpen = false;
								}}
							>
								{sub.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<footer class="border-t border-line p-4">
				<a
					href={resolve('/categories')}
					class="flex items-center justify-between rounded-xl bg-pine-dark px-4 py-3 font-mono text-[0.72rem] font-bold tracking-[0.05em] text-white uppercase transition-all duration-300 hover:bg-pine"
				>
					View all categories
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg
					>
				</a>
			</footer>
		</aside>
	</div>
{/if}

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

	/* ---------- Hero slider ---------- */
	.hero-bg {
		will-change: transform;
	}
	.ken-burns-in {
		animation: ken-burns-zoom 7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
	}
	@keyframes ken-burns-zoom {
		0% {
			transform: scale(1.03);
		}
		100% {
			transform: scale(1.15);
		}
	}

	:global(.hero-dot) {
		position: relative;
		height: 4px;
		width: 22px;
		overflow: hidden;
		border: 0;
		border-radius: 9999px;
		padding: 0;
		background: rgba(253, 240, 207, 0.25);
		cursor: pointer;
		transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}
	:global(.hero-dot.active) {
		width: 42px;
		background: rgba(253, 240, 207, 0.25);
	}
	:global(.hero-dot .dot-progress) {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: #fbe9ba;
		animation: dot-progress 5.5s linear forwards;
	}
	@keyframes dot-progress {
		from {
			width: 0;
		}
		to {
			width: 100%;
		}
	}

	.hero-grain {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}

	/* ---------- Sidebar links ---------- */
	/* ---------- Categories drawer ---------- */
	.drawer-link {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.75rem;
		border-radius: 0.9rem;
		padding: 0.5rem 0.75rem;
		font-family: var(--font-sans);
		font-size: 0.86rem;
		font-weight: 500;
		color: var(--color-ink-soft);
		text-decoration: none;
		transition:
			background-color 0.2s ease,
			color 0.2s ease,
			transform 0.2s ease;
	}
	.drawer-link:hover {
		background: rgba(43, 109, 76, 0.08);
		color: var(--color-pine-dark);
		transform: translateX(2px);
	}
	.drawer-link.active {
		background: var(--color-pine-dark);
		color: #fff;
		box-shadow: 0 10px 22px -10px rgba(23, 83, 58, 0.6);
	}
	.drawer-link.active svg {
		opacity: 1;
		color: var(--color-gold);
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
