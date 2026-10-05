<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import Hero from '$lib/components/Hero.svelte';
	import Introduction from '$lib/components/Introduction.svelte';
	import HeroCategories from '$lib/components/HeroCategories.svelte';
	import BannerSection from '$lib/components/BannerSection.svelte';
	import Services from '$lib/components/Services.svelte';
	import Pipeline from '$lib/components/Pipeline.svelte';
	import AgriProduct from '$lib/components/AgriProduct.svelte';
	import PremiumMeat from '$lib/components/PremiumMeat.svelte';
	import WhyUs from '$lib/components/WhyUs.svelte';
	import Testimonials from '$lib/components/Testimonials.svelte';
	import BlogSection from '$lib/components/BlogSection.svelte';
	import Cta from '$lib/components/Cta.svelte';
	import type {
		PromoBanner,
		ProductWidgetsData,
		ComponentsData,
		PageComponentData
	} from '$lib/api/types';
	import Herbal from '$lib/components/Herbal.svelte';
	import Beverages from '$lib/components/Beverages.svelte';

	let {
		data
	}: {
		data: {
			heroBanners: PromoBanner[];
			categories: any[];
			premiummeat: any[];
			agroProducts: any[];
			herbalProducts: any[];
			beverages: any[];
			productWidgets: ProductWidgetsData;
			limitBlogs: any[];
			settings: any[];
			testimonials: any[];
			pageComponents: PageComponentData[];
			faqs: any[];
			ourProcess: ComponentsData;
			aboutUs: ComponentsData;
			premiumMeatInfo: ComponentsData;
			agroInfo: ComponentsData;
			herbalInfo: ComponentsData;
			beverageInfo: ComponentsData;
			companystat: any[];
		};
	} = $props();

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

		gsap.utils.toArray('.product-grid').forEach((grid) => {
			const g = grid as Element;
			gsap.to(g.querySelectorAll('.product-item'), {
				opacity: 1,
				y: 0,
				duration: 0.7,
				stagger: 0.1,
				ease: 'power2.out',
				scrollTrigger: { trigger: g, start: 'top 88%' }
			});
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
</script>

<svelte:head>
	<title>AFCRC — Production | Packaging | Distribution</title>
	<meta
		name="description"
		content="AFCRC sources, processes, and moves premium meat, agricultural produce, herbal supplements and beverages — built on one supply chain you can trust, end to end."
	/>
</svelte:head>

<!-- <Hero heroBannersData={data.heroBanners} categories={data.categories} /> -->
<BannerSection banners={data.heroBanners} categories={data.categories} />
<Introduction aboutUs={data.aboutUs} ourProcess={data.ourProcess} companystat={data.companystat} />
<PremiumMeat premiumMeatInfo={data.premiumMeatInfo} premiummeat={data.premiummeat} />
<AgriProduct agroInfo={data.agroInfo} agroProducts={data.agroProducts} />
<Herbal herbalInfo={data.herbalInfo} herbalProducts={data.herbalProducts} />
<Beverages beveragesInfo={data.beverageInfo} beverages={data.beverages}></Beverages>
<BlogSection limitBlogs={data.limitBlogs} />
<Testimonials testimonials={data.testimonials} />
