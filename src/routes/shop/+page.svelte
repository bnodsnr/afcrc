<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { fade, fly, slide } from 'svelte/transition';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { env } from '$env/dynamic/public';
	import { resolve } from '$app/paths';
	import { getImageUrl } from '$lib/utils/image';
	import { handleAddToCart } from '$lib/utils/cart';
	import { toastStore } from '$lib/stores/toast';
	import WhyUs from '$lib/components/WhyUs.svelte';
	import Testimonials from '$lib/components/Testimonials.svelte';
	import BlogSection from '$lib/components/BlogSection.svelte';
	import Cta from '$lib/components/Cta.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type ApiCategory = {
		id: number;
		name: string;
		featured_image?: string | null;
	};

	type Category = {
		id: number;
		name: string;
		image: string | null;
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
		product_sizes?: unknown;
		stock_status?: string;
		stock_quantity?: string | number;
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
		description?: string;
		shortDescription?: string;
		rating: number;
		reviews: number;
		stockStatus?: string;
		stockQuantity: number;
	};

	type ShowcaseCategory = {
		name: string;
		tagline: string;
		seed: string;
		keywords: string[];
		icon: 'plant' | 'meat' | 'supplement' | 'drink' | 'dairy' | 'grain';
	};

	// ---------- Filter State ----------
	const filters = $state({
		category: null as number | null,
		search: '',
		sort: 'default',
		minPrice: 0,
		maxPrice: 10000
	});

	// ---------- UI State ----------
	let currentPage = $state(1);
	let products = $state<Product[]>([]);
	let totalPages = $state(1);
	let totalProducts = $state(0);
	let brands = $state<Category[]>([]);
	let isLoading = $state(false);
	let filterDrawerOpen = $state(false);
	let viewMode = $state<'grid' | 'list'>('grid');
	let scrolled = $state(false);
	let wishlist = $state<Set<number>>(new Set());

	const skeletonItems = [0, 1, 2, 3, 4, 5];
	const starItems = [0, 1, 2, 3, 4];
	const pageItems = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));

	const showcaseCategories: ShowcaseCategory[] = [
		{
			name: 'Agri Products',
			tagline: 'Fresh crops & produce',
			seed: 'agri-field',
			keywords: ['agri', 'crop', 'produce', 'vegetable', 'fruit', 'grain'],
			icon: 'plant'
		},
		{
			name: 'Premium Meat',
			tagline: 'Beef, poultry & lamb',
			seed: 'meat-steak',
			keywords: ['meat', 'beef', 'poultry', 'lamb', 'chicken', 'mutton'],
			icon: 'meat'
		},
		{
			name: 'Fresh Supplements',
			tagline: 'Wellness & herbal extracts',
			seed: 'herbal-pills',
			keywords: ['supplement', 'wellness', 'herbal', 'vitamin', 'health', 'extract'],
			icon: 'supplement'
		},
		{
			name: 'Beverages',
			tagline: 'Juices & functional drinks',
			seed: 'juice-drink',
			keywords: ['beverage', 'drink', 'juice', 'smoothie'],
			icon: 'drink'
		},
		{
			name: 'Dairy & Eggs',
			tagline: 'Milk, cheese & farm eggs',
			seed: 'dairy-eggs',
			keywords: ['dairy', 'milk', 'cheese', 'butter', 'egg', 'yogurt'],
			icon: 'dairy'
		},
		{
			name: 'Grains & Pulses',
			tagline: 'Flour, rice & lentils',
			seed: 'grains-pulses',
			keywords: ['grain', 'rice', 'flour', 'pulse', 'lentil', 'wheat'],
			icon: 'grain'
		}
	];

	const trustItems = [
		{ label: 'Farm Fresh Daily', sub: 'Harvested to order', icon: 'leaf' },
		{ label: 'Free Delivery', sub: 'Orders over Rs. 2,000', icon: 'truck' },
		{ label: 'Secure Payment', sub: '100% protected checkout', icon: 'shield' },
		{ label: 'Easy Returns', sub: '7-day satisfaction', icon: 'refresh' }
	] as const;

	// ---------- Hero slideshow ----------
	const heroSlides = [
		{
			eyebrow: 'Curated collection',
			title: 'Farm to your',
			highlight: 'doorstep',
			desc: 'Browse fresh picks, seasonal favorites and handpicked essentials from our farms and production lines.',
			seed: 'farm-hero'
		},
		{
			eyebrow: 'Premium meat',
			title: 'Butcher-grade cuts,',
			highlight: 'farm-raised',
			desc: 'Beef, poultry and lamb prepared under cold-chain care, so every cut arrives as fresh as the day it left the facility.',
			seed: 'meat-hero'
		},
		{
			eyebrow: 'Wellness & beverages',
			title: 'Fresh supplements &',
			highlight: 'functional drinks',
			desc: 'Herbal extracts, wellness blends and thirst-quenching drinks made from ingredients we source, pack and deliver ourselves.',
			seed: 'drinks-hero'
		}
	];

	let heroSlide = $state(0);
	let heroSliding = $state(false);
	let heroTimer: ReturnType<typeof setInterval> | undefined;

	const allLoaded = $derived((data?.products ?? []) as ApiProduct[]);

	const activeFilterCount = $derived(
		(filters.category !== null ? 1 : 0) +
			(filters.search.trim() ? 1 : 0) +
			(filters.minPrice > 0 || filters.maxPrice < 10000 ? 1 : 0)
	);

	// ---------- Curated category rows ----------
	let bestProducts = $state<Product[]>([]);
	let bestLoading = $state(true);
	let bestError = $state(false);

	let agriProducts = $state<Product[]>([]);
	let meatProducts = $state<Product[]>([]);
	let widgetsLoading = $state(true);
	let widgetsError = $state(false);

	// ---------- Promo countdown ----------
	let promoEnd = $state(0);
	let promoCountdown = $state({ days: 0, hours: 0, minutes: 0, seconds: 0 });
	let promoInterval: ReturnType<typeof setInterval> | undefined;

	onMount(async () => {
		await fetchCategories();
		await Promise.all([loadProducts(), loadBestProducts(), loadCategoryWidgets()]);
	});

	onMount(() => {
		promoEnd = Date.now() + 3 * 24 * 60 * 60 * 1000;
		updatePromoCountdown();
		promoInterval = setInterval(updatePromoCountdown, 1000);
	});

	onMount(() => {
		heroTimer = setInterval(nextHeroSlide, 6000);
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

		gsap.to('.why-item', {
			opacity: 1,
			y: 0,
			duration: 0.7,
			stagger: 0.15,
			ease: 'power2.out',
			scrollTrigger: { trigger: '.why-list', start: 'top 85%' }
		});

		gsap.to('.testimonial-card', {
			opacity: 1,
			y: 0,
			duration: 0.7,
			stagger: 0.15,
			ease: 'power2.out',
			scrollTrigger: { trigger: '.testimonial-grid', start: 'top 85%' }
		});

		gsap.to('.blog-card', {
			opacity: 1,
			y: 0,
			duration: 0.7,
			stagger: 0.15,
			ease: 'power2.out',
			scrollTrigger: { trigger: '.blog-grid', start: 'top 85%' }
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

	onDestroy(() => {
		if (promoInterval) clearInterval(promoInterval);
		if (heroTimer) clearInterval(heroTimer);
	});

	function updatePromoCountdown() {
		const diff = Math.max(0, promoEnd - Date.now());
		promoCountdown = {
			days: Math.floor(diff / 86_400_000),
			hours: Math.floor((diff % 86_400_000) / 3_600_000),
			minutes: Math.floor((diff % 3_600_000) / 60_000),
			seconds: Math.floor((diff % 60_000) / 1000)
		};
	}

	function pad(value: number): string {
		return value.toString().padStart(2, '0');
	}

	function closeDrawerOnEscape(e: KeyboardEvent) {
		if (filterDrawerOpen && e.key === 'Escape') filterDrawerOpen = false;
	}

	function goToHeroSlide(i: number) {
		if (i === heroSlide || heroSliding) return;
		heroSliding = true;
		heroSlide = i;
		setTimeout(() => {
			heroSliding = false;
		}, 1100);
	}

	function nextHeroSlide() {
		goToHeroSlide((heroSlide + 1) % heroSlides.length);
	}

	function prevHeroSlide() {
		goToHeroSlide(heroSlide === 0 ? heroSlides.length - 1 : heroSlide - 1);
	}

	function scrollToProducts() {
		document
			.getElementById('shop-products')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function scrollToElement(id: string) {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function normalize(value: string): string {
		return value.toLowerCase().replace(/[^a-z0-9]/g, '');
	}

	function countForKeywords(keywords: string[]): number {
		return allLoaded.filter((p) =>
			keywords.some((k) => (p.category_name ?? '').toLowerCase().includes(k))
		).length;
	}

	// -----------------------------
	// Cursor-tracked spotlight for product cards
	// -----------------------------
	function trackSpotlight(e: MouseEvent) {
		const el = e.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		el.style.setProperty('--x', `${e.clientX - rect.left}px`);
		el.style.setProperty('--y', `${e.clientY - rect.top}px`);
	}

	// -----------------------------
	// Scroll-reveal action
	// -----------------------------
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

	// -----------------------------
	// Wishlist
	// -----------------------------
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

	// -----------------------------
	// Categories
	// -----------------------------
	async function fetchCategories() {
		try {
			const res = await fetch(`${env.PUBLIC_BASE_URL}/api/get-categories/`);
			const data = await res.json();
			brands = (data.data ?? []).map((category: ApiCategory) => ({
				id: category.id,
				name: category.name,
				image: category.featured_image
			}));
		} catch (err) {
			console.error(err);
		}
	}

	// -----------------------------
	// Products
	// -----------------------------
	async function loadProducts(page = 1) {
		isLoading = true;

		try {
			const params = new SvelteURLSearchParams();

			if (filters.category) params.set('category', filters.category.toString());
			if (filters.search.trim()) params.set('search', filters.search);
			if (filters.sort !== 'default') params.set('sort', filters.sort);
			if (filters.minPrice > 0) params.set('min_price', filters.minPrice.toString());
			if (filters.maxPrice < 10000) params.set('max_price', filters.maxPrice.toString());
			params.set('page', page.toString());

			const response = await fetch(`${env.PUBLIC_BASE_URL}/api/paginated-products/?${params}`);

			if (!response.ok) throw new Error("Couldn't fetch products");

			const data = await response.json();

			totalProducts = data.count;
			currentPage = page;
			totalPages = Math.ceil(data.count / 18);

			products = data.results.map(mapProduct);
		} catch (err) {
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

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
			description: product.description,
			shortDescription: product.short_description,
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

	type TrendingApiProduct = {
		id: number;
		name: string;
		slug: string;
		seo_slug?: string;
		sku?: string;
		description?: string;
		regular_price?: string | number;
		sale_price?: string | number;
		discount_percentage?: number;
		product_type?: string;
		category?: string;
		image?: string;
	};

	async function loadBestProducts() {
		bestLoading = true;
		bestError = false;
		try {
			const res = await fetch(`${env.PUBLIC_BASE_URL}/api/get-trending-products/`);
			if (!res.ok) throw new Error("Couldn't fetch best products");
			const data = await res.json();
			bestProducts = (data.data ?? []).slice(0, 12).map(mapTrendingProduct);
		} catch (err) {
			console.error(err);
			bestError = true;
		} finally {
			bestLoading = false;
		}
	}

	function mapTrendingProduct(product: TrendingApiProduct): Product {
		const regular = Number(product.regular_price) || 0;
		const sale = Number(product.sale_price) || 0;
		const hasDiscount = sale > 0 && sale < regular;

		return {
			id: product.id,
			name: product.name,
			slug: product.slug,
			seo_slug: product.slug,
			sku: product.sku ?? '',
			brand: product.category ?? '',
			price: hasDiscount ? sale : regular,
			originalPrice: regular,
			discount:
				hasDiscount || Number(product.discount_percentage) > 0
					? Math.round(Number(product.discount_percentage) || ((regular - sale) / regular) * 100)
					: 0,
			image: product.image ?? '',
			description: product.description,
			shortDescription: product.description,
			rating: 4.5,
			reviews: 0,
			stockStatus: 'instock',
			stockQuantity: 0
		};
	}

	// -----------------------------
	// Category widgets (Agri Products + Premium Meat)
	// -----------------------------
	async function loadCategoryWidgets() {
		widgetsLoading = true;
		widgetsError = false;
		try {
			const res = await fetch(
				`${env.PUBLIC_BASE_URL}/api/get_product_widgets_by_category/?limit=12`
			);
			if (!res.ok) throw new Error("Couldn't fetch category widgets");
			const data = await res.json();
			const widgets: any[] = (data?.data ?? data ?? []).filter(
				(w: any) => w && Array.isArray(w.products)
			);

			agriProducts = widgets
				.flatMap((w: any) =>
					w.products
						.filter((p: any) => p.product_type === 'agri_product')
						.map((p: any) => mapWidgetProduct(p, w.seo_slug))
				)
				.slice(0, 12);

			meatProducts = widgets
				.flatMap((w: any) =>
					w.products
						.filter((p: any) => p.product_type === 'premium_meat')
						.map((p: any) => mapWidgetProduct(p, w.seo_slug))
				)
				.slice(0, 12);
		} catch (err) {
			console.error(err);
			widgetsError = true;
		} finally {
			widgetsLoading = false;
		}
	}

	function mapWidgetProduct(product: TrendingApiProduct, categorySeoSlug: string): Product {
		const regular = Number(product.regular_price) || 0;
		const sale = Number(product.sale_price) || 0;
		const hasDiscount = sale > 0 && sale < regular;

		return {
			id: product.id,
			name: product.name,
			slug: product.slug,
			seo_slug: product.seo_slug ?? categorySeoSlug,
			sku: product.sku ?? '',
			brand: product.category ?? '',
			price: hasDiscount ? sale : regular,
			originalPrice: regular,
			discount:
				hasDiscount || Number(product.discount_percentage) > 0
					? Math.round(Number(product.discount_percentage) || ((regular - sale) / regular) * 100)
					: 0,
			image: product.image ?? '',
			description: product.description,
			shortDescription: product.description,
			rating: 4.5,
			reviews: 0,
			stockStatus: 'instock',
			stockQuantity: 0
		};
	}

	// -----------------------------
	// Filter Actions
	// -----------------------------
	async function setCategory(id: number | null) {
		filters.category = id;
		currentPage = 1;
		await loadProducts();
		filterDrawerOpen = false;
	}

	async function selectCategory(id: number | null) {
		filters.category = filters.category === id ? null : id;
		currentPage = 1;
		await loadProducts();
		filterDrawerOpen = false;
	}

	async function browseCategory(cat: ShowcaseCategory) {
		const match = brands.find((b) => cat.keywords.some((k) => normalize(b.name).includes(k)));
		if (match) {
			await setCategory(match.id);
			toastStore.show(`Showing ${cat.name}`, 'success');
		} else {
			toastStore.show(`${cat.name} — more items arriving soon`, 'info');
		}
		scrollToProducts();
	}

	async function changeSort() {
		currentPage = 1;
		await loadProducts();
	}

	async function applyPriceFilter() {
		if (filters.minPrice > filters.maxPrice) {
			filters.maxPrice = filters.minPrice;
		}
		currentPage = 1;
		await loadProducts();
	}

	async function changePage(page: number) {
		await loadProducts(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	async function clearFilters() {
		filters.category = null;
		filters.search = '';
		filters.sort = 'default';
		filters.minPrice = 0;
		filters.maxPrice = 10000;
		currentPage = 1;
		await loadProducts();
	}

	async function removeCategoryFilter() {
		await setCategory(null);
	}

	async function resetPrice() {
		filters.minPrice = 0;
		filters.maxPrice = 10000;
		currentPage = 1;
		await loadProducts();
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
</script>

<svelte:window onkeydown={closeDrawerOnEscape} />

<svelte:head>
	<title>Shop — AFCRC</title>
	<meta
		name="description"
		content="Browse fresh picks, seasonal favorites and handpicked essentials from AFCRC."
	/>
</svelte:head>

{#snippet catIcon(name: ShowcaseCategory['icon'])}
	{#if name === 'plant'}
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
	{:else if name === 'meat'}
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
	{:else if name === 'supplement'}
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
	{:else if name === 'drink'}
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
	{:else if name === 'dairy'}
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

{#snippet trustIcon(name: (typeof trustItems)[number]['icon'])}
	{#if name === 'leaf'}
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
	{:else if name === 'truck'}
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
	{:else if name === 'shield'}
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

{#snippet productCard(product: Product, index: number = 0)}
	<a
		href={resolve(`/product/${product.seo_slug}/${product.slug}`)}
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

<!-- ── Hero ── -->
<section
	class="relative overflow-hidden bg-pine-dark pt-[80px] pb-24 max-md:pb-16"
	style="background:
		radial-gradient(circle at 12% 18%, #4b845a 0%, transparent 38%),
		radial-gradient(circle at 88% 12%, #fbe9ba 0%, transparent 34%),
		linear-gradient(135deg, #17533a 0%, #84a66d 55%, #fdf0cf 105%)"
>
	<div class="absolute inset-0" aria-hidden="true">
		{#each heroSlides as slide, i (i)}
			<div
				class="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out {i === heroSlide
					? 'opacity-100'
					: 'opacity-0'}"
			>
				<div
					class="hero-ken h-full w-full bg-cover bg-center {i === heroSlide ? 'hero-ken-in' : ''}"
					style="background-image: url('https://picsum.photos/seed/{slide.seed}/1600/900');"
				></div>
				<div
					class="absolute inset-0 bg-gradient-to-r from-pine-dark/95 via-pine-dark/75 to-pine-dark/30"
				></div>
				<div
					class="absolute inset-0"
					style="background: linear-gradient(135deg, rgba(23,83,58,0.45) 0%, rgba(132,166,109,0.25) 100%);"
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
	<div
		class="animate-float-slow pointer-events-none absolute top-1/3 left-1/2 h-40 w-40 rounded-full bg-teal/25 blur-3xl [animation-delay:-4s]"
	></div>

	<div class="relative mx-auto max-w-[1180px] px-6 max-md:px-4">
		<nav
			class="mb-9 flex items-center gap-2 font-mono text-[0.72rem] tracking-[0.08em] text-paper/70 uppercase"
			aria-label="Breadcrumb"
		>
			<a href={resolve('/')} class="transition-colors duration-200 hover:text-gold">Home</a>
			<span aria-hidden="true">/</span>
			<span class="font-semibold text-gold">Shop</span>
		</nav>

		<div class="flex items-end justify-between gap-10 max-lg:flex-col max-lg:items-start">
			<div class="max-w-[600px]" in:fly={{ y: 18, duration: 600, delay: 80 }}>
				{#key heroSlide}
					<div in:fade={{ duration: 650 }}>
						<div class="eyebrow text-gold before:bg-gold">
							{heroSlides[heroSlide].eyebrow}
						</div>
						<h1
							class="mt-4 min-h-[2.05em] font-serif text-[clamp(2.6rem,6vw,4.2rem)] leading-[1.02] font-bold tracking-[-0.01em] text-paper"
						>
							{heroSlides[heroSlide].title}
							<span class="relative mx-1 inline-block align-baseline whitespace-nowrap">
								<span
									class="absolute inset-x-[-7px] inset-y-[2px] skew-x-[-6deg] rounded-lg bg-gold/95"
									aria-hidden="true"
								></span>
								<span class="relative text-pine-dark">{heroSlides[heroSlide].highlight}</span>
							</span>
						</h1>
						<p
							class="mt-5 min-h-[4.9em] max-w-[500px] text-[0.98rem] leading-relaxed text-paper/85"
						>
							{heroSlides[heroSlide].desc}
						</p>
					</div>
				{/key}

				<div class="mt-7 flex flex-wrap items-center gap-2">
					{#each showcaseCategories.slice(0, 4) as cat (cat.name)}
						<button
							type="button"
							class="cursor-pointer rounded-full border border-white/30 bg-white/10 px-4 py-1.5 font-mono text-[0.7rem] font-semibold tracking-wide text-paper backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-pine-dark"
							onclick={() => browseCategory(cat)}
						>
							{cat.name}
						</button>
					{/each}
				</div>

				<div class="mt-7 flex items-center gap-2" role="tablist" aria-label="Hero slides">
					{#each heroSlides as _, i (i)}
						<button
							type="button"
							role="tab"
							aria-selected={heroSlide === i}
							aria-label="Go to slide {i + 1}"
							class="h-2 cursor-pointer rounded-full transition-all duration-300 {heroSlide === i
								? 'w-8 bg-gold'
								: 'w-2 bg-white/30 hover:bg-white/60'}"
							onclick={() => goToHeroSlide(i)}
						></button>
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
					<p class="font-serif text-[1.6rem] leading-none font-bold text-gold">{totalProducts}</p>
					<p class="mt-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-paper/80 uppercase">
						Products
					</p>
				</div>
				<div
					class="group rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.6rem] leading-none font-bold text-gold">100%</p>
					<p class="mt-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-paper/80 uppercase">
						Farm Fresh
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
				<div
					class="group rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-paper backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/15"
				>
					<p class="font-serif text-[1.6rem] leading-none font-bold text-gold">7 days</p>
					<p class="mt-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-paper/80 uppercase">
						Returns
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- <div class="relative -bottom-px" aria-hidden="true">
		<svg
			viewBox="0 0 1440 64"
			fill="none"
			class="block h-8 w-full text-paper-white"
			preserveAspectRatio="none"
		>
			<path d="M0 64L1440 8V64H0Z" fill="currentColor" />
		</svg>
	</div> -->
</section>

<!-- ── Trust strip ── -->
<section class="border-b border-line bg-paper-white">
	<div
		class="mx-auto grid max-w-[1180px] grid-cols-4 gap-4 px-6 py-5 max-md:px-4 max-sm:grid-cols-2"
	>
		{#each trustItems as item, i (item.label)}
			<div class="flex items-center gap-3" use:reveal={{ delay: i * 70 }}>
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10 text-pine-dark transition-transform duration-300 hover:scale-110 hover:rotate-6"
				>
					{@render trustIcon(item.icon)}
				</div>
				<div class="min-w-0">
					<p class="truncate text-[0.82rem] font-bold text-pine-dark">{item.label}</p>
					<p class="truncate text-[0.7rem] text-ink-soft">{item.sub}</p>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- ── Category showcase ── -->
<section class="bg-paper-white py-[70px] max-md:py-12" id="shop-categories">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<div class="mb-9 flex items-end justify-between gap-6">
			{@render sectionHeader('Shop by category', 'Explore our', 'fresh ranges')}
			<button
				type="button"
				class="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-5 py-2.5 font-mono text-[0.72rem] font-semibold tracking-[0.04em] text-pine-dark transition-all duration-300 hover:border-pine-dark hover:bg-pine-dark hover:text-white md:flex"
				onclick={scrollToProducts}
			>
				Browse all products
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
			</button>
		</div>

		<div class="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
			{#each showcaseCategories.slice(0, 4) as cat, i (cat.name)}
				<button
					type="button"
					class="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-white text-left shadow-[0_10px_30px_-12px_rgba(18,50,26,0.15)] transition-all duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)] hover:-translate-y-2 hover:border-pine/30 hover:shadow-[0_24px_48px_-16px_rgba(30,75,51,0.3)]"
					onclick={() => browseCategory(cat)}
					aria-label="Shop {cat.name}"
					use:reveal={{ delay: i * 70 }}
				>
					<div class="relative aspect-[4/3] overflow-hidden bg-paper-2">
						<img
							src={`https://picsum.photos/seed/${cat.seed}/600/400`}
							alt={cat.name}
							loading="lazy"
							class="h-full w-full object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(.22,1,.36,1)] group-hover:scale-110"
						/>
						<div
							class="absolute inset-0 bg-gradient-to-t from-pine-dark/85 via-pine-dark/20 to-transparent"
						></div>

						<div
							class="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-pine-dark shadow-md backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-gold"
						>
							{@render catIcon(cat.icon)}
						</div>

						<span
							class="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[0.62rem] font-bold text-pine-dark shadow-sm backdrop-blur-sm"
						>
							{#if countForKeywords(cat.keywords) > 0}
								{countForKeywords(cat.keywords)} items
							{:else}
								Fresh pick
							{/if}
						</span>

						<div class="absolute inset-x-0 bottom-0 p-4">
							<span
								class="mb-1.5 block h-[3px] w-6 rounded-full bg-gold transition-all duration-300 group-hover:w-12"
								aria-hidden="true"
							></span>
							<h3
								class="font-serif text-[1.22rem] leading-tight font-bold text-white drop-shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5"
							>
								{cat.name}
							</h3>
						</div>
					</div>

					<div class="flex flex-1 items-center justify-between gap-3 p-4">
						<p class="min-w-0 truncate text-[0.8rem] text-ink-soft">{cat.tagline}</p>
						<span
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine-dark text-white shadow-md transition-all duration-300 group-hover:translate-x-1 group-hover:bg-gold group-hover:text-pine-dark"
						>
							<svg
								width="15"
								height="15"
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

<!-- ── Promo hero ── -->
<section class="bg-paper-white pb-14">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<div
			class="relative overflow-hidden rounded-3xl bg-pine-dark px-8 py-12 max-md:px-5 max-md:py-10"
			style="background:
				linear-gradient(120deg, rgba(23,83,58,0.92) 0%, rgba(43,109,76,0.78) 55%, rgba(132,166,109,0.55) 100%),
				url('https://picsum.photos/seed/harvest-sale/1400/500') center/cover no-repeat"
			use:reveal
		>
			<div
				class="animate-float-slow pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-gold/25 blur-3xl"
			></div>
			<div class="relative flex flex-wrap items-center justify-between gap-10">
				<div class="max-w-[520px]">
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-3.5 py-1.5 font-mono text-[0.66rem] font-bold tracking-[0.08em] text-gold uppercase"
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="currentColor"
							class="animate-pulse-slow"
							aria-hidden="true"
						>
							<path d="M12 2l2.4 6.9H21l-5.6 4.2 2.1 6.9-5.5-4.1-5.5 4.1 2.1-6.9L3 8.9h6.6z" />
						</svg>
						Limited time harvest offer
					</span>
					<h2
						class="mt-4 font-serif text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.05] font-bold tracking-[-0.01em] text-paper"
					>
						Fresh harvest sale —<br />up to <span class="text-gold">40% off</span>
					</h2>
					<p class="mt-3 max-w-[440px] text-[0.92rem] leading-relaxed text-paper/80">
						Stock up on handpicked produce, premium cuts and farm-fresh essentials while the season
						lasts. Free delivery on every order over Rs. 2,000.
					</p>
					<div class="mt-6 flex flex-wrap items-center gap-3">
						<button
							type="button"
							class="cursor-pointer rounded-full bg-gold px-6 py-3 text-[0.85rem] font-bold text-pine-dark shadow-[0_12px_28px_-10px_rgba(0,0,0,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-paper hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.45)]"
							onclick={scrollToProducts}
						>
							Shop the sale
						</button>
						<button
							type="button"
							class="cursor-pointer rounded-full border border-white/40 bg-white/10 px-6 py-3 font-mono text-[0.75rem] font-semibold tracking-[0.04em] text-paper backdrop-blur-sm transition-all duration-200 hover:border-gold hover:text-gold"
							onclick={() => scrollToElement('shop-categories')}
						>
							Browse categories
						</button>
					</div>
				</div>

				<div class="flex shrink-0 flex-col items-center gap-4">
					<p
						class="font-mono text-[0.68rem] font-semibold tracking-[0.12em] text-paper/75 uppercase"
					>
						Offer ends in
					</p>
					<div class="flex items-center gap-2.5">
						<div
							class="countdown-box flex h-[74px] w-[70px] flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm"
						>
							<span class="font-mono text-[1.8rem] leading-none font-bold text-gold tabular-nums"
								>{pad(promoCountdown.days)}</span
							>
							<span class="mt-1 font-mono text-[0.58rem] tracking-[0.1em] text-paper/75 uppercase"
								>Days</span
							>
						</div>
						<div
							class="countdown-box flex h-[74px] w-[70px] flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm"
						>
							<span class="font-mono text-[1.8rem] leading-none font-bold text-gold tabular-nums"
								>{pad(promoCountdown.hours)}</span
							>
							<span class="mt-1 font-mono text-[0.58rem] tracking-[0.1em] text-paper/75 uppercase"
								>Hours</span
							>
						</div>
						<div
							class="countdown-box flex h-[74px] w-[70px] flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm"
						>
							<span class="font-mono text-[1.8rem] leading-none font-bold text-gold tabular-nums"
								>{pad(promoCountdown.minutes)}</span
							>
							<span class="mt-1 font-mono text-[0.58rem] tracking-[0.1em] text-paper/75 uppercase"
								>Mins</span
							>
						</div>
						<div
							class="countdown-box countdown-pulse flex h-[74px] w-[70px] flex-col items-center justify-center rounded-2xl border border-gold/40 bg-white/10 backdrop-blur-sm"
						>
							<span class="font-mono text-[1.8rem] leading-none font-bold text-gold tabular-nums"
								>{pad(promoCountdown.seconds)}</span
							>
							<span class="mt-1 font-mono text-[0.58rem] tracking-[0.1em] text-paper/75 uppercase"
								>Secs</span
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ── Best products ── -->
<section class="bg-paper-white pb-14">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<div class="mb-9 flex items-end justify-between gap-6">
			{@render sectionHeader(
				'Trending now',
				'Best',
				'products',
				"Our customers' most-loved picks, freshly restocked every week."
			)}
			<button
				type="button"
				class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-5 py-2.5 font-mono text-[0.72rem] font-semibold tracking-[0.04em] text-pine-dark transition-all duration-300 hover:border-pine-dark hover:bg-pine-dark hover:text-white"
				onclick={scrollToProducts}
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
			</button>
		</div>

		{#if bestLoading}
			<div class="grid grid-cols-4 gap-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
				{#each skeletonItems as i (i)}
					<div class="overflow-hidden rounded-2xl border border-line">
						<div class="skeleton-shimmer aspect-[4/3]"></div>
						<div class="space-y-3 p-4">
							<div class="skeleton-shimmer h-3 w-2/3 rounded"></div>
							<div class="skeleton-shimmer h-3 w-1/3 rounded"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if bestProducts.length > 0}
			<div class="grid grid-cols-4 gap-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
				{#each bestProducts as product, i (product.id)}
					{@render productCard(product, i)}
				{/each}
			</div>
		{:else}
			<p class="text-[0.9rem] text-ink-soft">Best products are on their way — check back soon.</p>
		{/if}
	</div>
</section>

<!-- ── Agri products ── -->
<section class="bg-paper-white pb-14">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<div class="mb-9 flex items-end justify-between gap-6">
			{@render sectionHeader(
				'Agri Products',
				'Fresh from our',
				'farms',
				'Vegetables, fruits, grains and pulses harvested to order.'
			)}
			<button
				type="button"
				class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-5 py-2.5 font-mono text-[0.72rem] font-semibold tracking-[0.04em] text-pine-dark transition-all duration-300 hover:border-pine-dark hover:bg-pine-dark hover:text-white"
				onclick={() => browseCategory(showcaseCategories[0])}
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
			</button>
		</div>

		{#if widgetsLoading}
			<div class="grid grid-cols-4 gap-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
				{#each skeletonItems as i (i)}
					<div class="overflow-hidden rounded-2xl border border-line">
						<div class="skeleton-shimmer aspect-[4/3]"></div>
						<div class="space-y-3 p-4">
							<div class="skeleton-shimmer h-3 w-2/3 rounded"></div>
							<div class="skeleton-shimmer h-3 w-1/3 rounded"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if agriProducts.length > 0}
			<div class="grid grid-cols-4 gap-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
				{#each agriProducts as product, i (product.id)}
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
						{@render catIcon('plant')}
					</div>
					<div>
						<p class="font-serif text-[1.1rem] font-semibold text-pine-dark">
							Agri Products arriving soon
						</p>
						<p class="mt-1 max-w-[420px] text-[0.85rem] text-ink-soft">
							We're restocking our farm-fresh crops and produce. Browse the full catalogue in the
							meantime.
						</p>
					</div>
				</div>
				{#if widgetsError}
					<button
						type="button"
						class="shrink-0 cursor-pointer rounded-full border border-pine/40 bg-white px-6 py-2.5 text-[0.85rem] font-bold text-pine-dark transition-colors duration-200 hover:border-pine hover:bg-pine hover:text-white"
						onclick={() => loadCategoryWidgets()}
					>
						Retry loading
					</button>
				{:else}
					<button
						type="button"
						class="shrink-0 cursor-pointer rounded-full bg-pine px-6 py-2.5 text-[0.85rem] font-bold text-white transition-colors duration-200 hover:bg-pine-dark"
						onclick={scrollToProducts}
					>
						Browse all products
					</button>
				{/if}
			</div>
		{/if}
	</div>
</section>

<!-- ── Premium meat ── -->
<section class="bg-paper-white pb-14">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<div class="mb-9 flex items-end justify-between gap-6">
			{@render sectionHeader(
				'Premium Meat',
				'Farm-raised,',
				'butcher-grade cuts',
				'Beef, poultry and lamb from animals raised the right way.'
			)}
			<button
				type="button"
				class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-5 py-2.5 font-mono text-[0.72rem] font-semibold tracking-[0.04em] text-pine-dark transition-all duration-300 hover:border-pine-dark hover:bg-pine-dark hover:text-white"
				onclick={() => browseCategory(showcaseCategories[1])}
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
			</button>
		</div>

		{#if widgetsLoading}
			<div class="grid grid-cols-4 gap-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
				{#each skeletonItems as i (i)}
					<div class="overflow-hidden rounded-2xl border border-line">
						<div class="skeleton-shimmer aspect-[4/3]"></div>
						<div class="space-y-3 p-4">
							<div class="skeleton-shimmer h-3 w-2/3 rounded"></div>
							<div class="skeleton-shimmer h-3 w-1/3 rounded"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if meatProducts.length > 0}
			<div class="grid grid-cols-4 gap-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
				{#each meatProducts as product, i (product.id)}
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
						{@render catIcon('meat')}
					</div>
					<div>
						<p class="font-serif text-[1.1rem] font-semibold text-pine-dark">
							Premium Meat arriving soon
						</p>
						<p class="mt-1 max-w-[420px] text-[0.85rem] text-ink-soft">
							Butcher-grade beef, poultry and lamb are being prepared. Browse the full catalogue in
							the meantime.
						</p>
					</div>
				</div>
				{#if widgetsError}
					<button
						type="button"
						class="shrink-0 cursor-pointer rounded-full border border-pine/40 bg-white px-6 py-2.5 text-[0.85rem] font-bold text-pine-dark transition-colors duration-200 hover:border-pine hover:bg-pine hover:text-white"
						onclick={() => loadCategoryWidgets()}
					>
						Retry loading
					</button>
				{:else}
					<button
						type="button"
						class="shrink-0 cursor-pointer rounded-full bg-pine px-6 py-2.5 text-[0.85rem] font-bold text-white transition-colors duration-200 hover:bg-pine-dark"
						onclick={scrollToProducts}
					>
						Browse all products
					</button>
				{/if}
			</div>
		{/if}
	</div>
</section>

<!-- ── Why AFCRC ── -->
<WhyUs />

<!-- ── Mobile filter toggle ── -->
<div
	class="sticky top-0 z-40 flex items-center justify-between gap-2.5 border-b border-line bg-paper-white/90 px-4 py-3 backdrop-blur-md transition-shadow duration-300 lg:hidden {scrolled
		? 'shadow-[0_8px_20px_-14px_rgba(18,50,26,0.4)]'
		: ''}"
>
	<button
		type="button"
		class="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-pine px-4 py-2 text-[0.8rem] font-bold text-white shadow-[0_8px_18px_-6px_rgba(43,109,76,0.5)] transition-transform duration-200 hover:-translate-y-px active:scale-95"
		onclick={() => (filterDrawerOpen = !filterDrawerOpen)}
		aria-expanded={filterDrawerOpen}
		aria-controls="filterDrawer"
	>
		<svg
			width="15"
			height="15"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<line x1="4" y1="6" x2="20" y2="6" />
			<line x1="8" y1="12" x2="20" y2="12" />
			<line x1="12" y1="18" x2="20" y2="18" />
		</svg>
		Filters
		{#if activeFilterCount > 0}
			<span
				class="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 font-mono text-[0.62rem] font-bold text-pine-dark"
			>
				{activeFilterCount}
			</span>
		{/if}
	</button>
	<div
		class="flex max-w-[230px] flex-1 items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2"
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
			<path d="M3 6h18M7 12h10M11 18h2" />
		</svg>
		<select
			class="w-full cursor-pointer border-none bg-transparent text-[0.8rem] font-semibold text-ink outline-none"
			aria-label="Sort products"
			bind:value={filters.sort}
			onchange={changeSort}
		>
			<option value="default">Sort: Default</option>
			<option value="price-asc">Price: Low → High</option>
			<option value="price-desc">Price: High → Low</option>
			<option value="name-asc">Name: A → Z</option>
			<option value="name-desc">Name: Z → A</option>
			<option value="discount">Biggest Discount</option>
		</select>
	</div>
</div>

<!-- ── Filter drawer overlay (mobile) ── -->
{#if filterDrawerOpen}
	<div
		class="fixed inset-0 z-[90] bg-pine-dark/40 backdrop-blur-sm"
		role="presentation"
		onclick={() => (filterDrawerOpen = false)}
		transition:fade={{ duration: 150 }}
	></div>
	<aside
		id="filterDrawer"
		class="fixed top-0 bottom-0 left-0 z-[100] flex w-[min(320px,88vw)] flex-col overflow-hidden bg-white shadow-[12px_0_28px_rgba(0,0,0,0.22)]"
		aria-label="Filters panel"
		transition:slide={{ duration: 250, axis: 'x' }}
	>
		<div class="flex items-center justify-between border-b border-line px-5 py-4">
			<span class="text-[0.95rem] font-bold text-ink">Filters</span>
			<button
				type="button"
				class="cursor-pointer rounded-lg px-2 py-1 text-[1.05rem] leading-none text-ink-soft transition-colors hover:bg-paper-2/60 hover:text-ink"
				onclick={() => (filterDrawerOpen = false)}
				aria-label="Close filters">✕</button
			>
		</div>
		<div class="flex-1 overflow-y-auto p-4">
			{@render filterForm()}
		</div>
	</aside>
{/if}

<!-- ── Testimonials ── -->
<!-- <Testimonials /> -->

<!-- ── Contact CTA ── -->
<!-- <Cta /> -->

<!-- ── Shared filter form (used in both the sidebar and the mobile drawer) ── -->
{#snippet filterForm()}
	<form class="flex flex-col gap-6 p-5" onsubmit={(e) => e.preventDefault()}>
		<div class="flex flex-col gap-3">
			<h3
				class="m-0 border-b border-line pb-2 font-mono text-[0.72rem] font-bold tracking-[0.08em] text-pine uppercase"
			>
				Category
			</h3>
			<div class="flex max-h-[260px] flex-col gap-1.5 overflow-y-auto">
				<label
					class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.85rem] text-ink transition-colors duration-150 hover:bg-paper-2/50"
				>
					<input
						type="radio"
						name="brand"
						class="h-4 w-4 shrink-0 cursor-pointer accent-pine"
						checked={filters.category === null}
						onchange={() => selectCategory(null)}
					/>
					<span>All Categories</span>
				</label>
				{#each brands as brand (brand.id)}
					<label
						class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.85rem] text-ink transition-colors duration-150 hover:bg-paper-2/50"
					>
						<input
							type="radio"
							name="brand"
							class="h-4 w-4 shrink-0 cursor-pointer accent-pine"
							checked={filters.category === brand.id}
							onchange={() => selectCategory(brand.id)}
						/>
						<span>{brand.name}</span>
					</label>
				{/each}
				{#if brands.length === 0}
					<p class="text-[0.8rem] text-ink-soft/70">No categories available.</p>
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<h3
				class="m-0 border-b border-line pb-2 font-mono text-[0.72rem] font-bold tracking-[0.08em] text-pine uppercase"
			>
				Price Range
			</h3>
			<div class="flex items-end gap-2.5">
				<label class="flex min-w-0 flex-1 flex-col gap-1 text-[0.7rem] font-semibold text-ink-soft">
					<span>Min</span>
					<input
						type="number"
						min="0"
						max={filters.maxPrice}
						class="w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[0.85rem] text-ink transition-colors outline-none focus:border-pine focus:ring-2 focus:ring-pine/15"
						bind:value={filters.minPrice}
						onchange={applyPriceFilter}
					/>
				</label>
				<span class="pb-2 text-ink-soft">–</span>
				<label class="flex min-w-0 flex-1 flex-col gap-1 text-[0.7rem] font-semibold text-ink-soft">
					<span>Max</span>
					<input
						type="number"
						min={filters.minPrice}
						class="w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[0.85rem] text-ink transition-colors outline-none focus:border-pine focus:ring-2 focus:ring-pine/15"
						bind:value={filters.maxPrice}
						onchange={applyPriceFilter}
					/>
				</label>
			</div>
			<input
				type="range"
				min="0"
				max="10000"
				step="50"
				bind:value={filters.maxPrice}
				onchange={applyPriceFilter}
				class="w-full cursor-pointer accent-pine"
				aria-label="Maximum price"
			/>
		</div>

		<button
			type="button"
			class="cursor-pointer rounded-xl border border-pine/20 bg-teal/10 px-4 py-2.5 text-[0.85rem] font-bold text-pine-dark transition-all duration-200 hover:-translate-y-px hover:bg-pine hover:text-white"
			onclick={clearFilters}>Clear all filters</button
		>
	</form>
{/snippet}

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

	/* ---------- Skeleton shimmer ---------- */
	:global(.skeleton-shimmer) {
		background: linear-gradient(
			90deg,
			rgba(18, 50, 26, 0.06) 25%,
			rgba(18, 50, 26, 0.1) 37%,
			rgba(18, 50, 26, 0.06) 63%
		);
		background-size: 800px 100%;
		animation: shimmer 1.6s linear infinite;
	}
	@keyframes shimmer {
		0% {
			background-position: -400px 0;
		}
		100% {
			background-position: 400px 0;
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
	.hero-ken {
		will-change: transform;
	}
	.hero-ken-in {
		animation: ken-burns-zoom 8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
	}
	@keyframes ken-burns-zoom {
		0% {
			transform: scale(1);
		}
		100% {
			transform: scale(1.12);
		}
	}

	:global(.animate-float-slow) {
		animation: float-slow 9s ease-in-out infinite;
	}
	:global(.animate-float-slower) {
		animation: float-slower 12s ease-in-out infinite;
	}
	:global(.animate-pulse-slow) {
		animation: pulse-slow 2.2s ease-in-out infinite;
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
	@keyframes pulse-slow {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.45;
		}
	}

	.hero-grain {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}

	/* ---------- Countdown ---------- */
	.countdown-pulse {
		animation: countdown-glow 1s ease-in-out infinite;
	}
	@keyframes countdown-glow {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(212, 168, 67, 0);
		}
		50% {
			box-shadow: 0 0 0 4px rgba(212, 168, 67, 0.12);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.reveal-init) {
			opacity: 1;
			transform: none;
		}
		:global(.reveal-in),
		:global(.skeleton-shimmer),
		:global(.animate-float-slow),
		:global(.animate-float-slower),
		:global(.animate-pulse-slow),
		.hero-ken-in,
		.countdown-pulse {
			animation: none;
		}
	}
</style>
