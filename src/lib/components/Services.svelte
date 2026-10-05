<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	const services = [
		{
			key: 'training',
			title: 'Training Services',
			description:
				'Hands-on training programs for farmers, technicians and agri-entrepreneurs on modern cultivation, livestock and conservation practices.',
			icon: 'presentation'
		},
		{
			key: 'academic',
			title: 'Academic Courses',
			description:
				'Structured certificate and diploma courses in agriculture, forestry and allied sciences for students and professionals.',
			icon: 'cap'
		},
		{
			key: 'soil',
			title: 'Soil Testing',
			description:
				'Laboratory analysis of soil health, fertility and nutrient levels with clear, actionable reports for smarter crop planning.',
			icon: 'test-tube'
		},
		{
			key: 'fertilizer',
			title: 'Fertilizer Management',
			description:
				'Science-based fertilizer scheduling and nutrient management plans tailored to your soil profile and crop requirements.',
			icon: 'leaf'
		}
	];

	let root: HTMLElement | undefined = $state();

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		if (!root) return;

		// Scoped to this component only
		const ctx = gsap.context(() => {
			gsap.from('.services-head > *', {
				opacity: 0,
				y: 24,
				duration: 0.6,
				stagger: 0.1,
				ease: 'power2.out',
				scrollTrigger: { trigger: '.services-head', start: 'top 82%' }
			});

			gsap.from('.service-card', {
				opacity: 0,
				y: 30,
				duration: 0.55,
				stagger: 0.1,
				ease: 'power2.out',
				scrollTrigger: { trigger: '.services-grid', start: 'top 85%' }
			});
		}, root);

		return () => ctx.revert();
	});
</script>

<section class="services" id="services" bind:this={root}>
	<div class="wrapper">
		<div class="services-head">
			<h2>Services That Grow<br />With <span>You</span></h2>
			<p class="lead">
				From practical field skills to laboratory science, our four core services support farmers,
				students and agri-businesses at every step of the journey.
			</p>
		</div>

		<div class="services-grid">
			{#each services as service (service.key)}
				<article class="service-card">
					<div class="service-icon">
						{#if service.icon === 'presentation'}
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M2 3h20" />
								<path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
								<path d="m7 21 5-5 5 5" />
							</svg>
						{:else if service.icon === 'cap'}
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"
								/>
								<path d="M22 10v6" />
								<path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
							</svg>
						{:else if service.icon === 'test-tube'}
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="m21 7-6.82 6.82a2.83 2.83 0 1 1-4-4L17 3" />
								<path d="m16 2 6 6" />
								<path d="M22 16 16 22" />
							</svg>
						{:else}
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
								/>
								<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
							</svg>
						{/if}
					</div>
					<h3>{service.title}</h3>
					<p>{service.description}</p>
					<a class="service-link" href="/#contact">
						Learn more
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M5 12h14" />
							<path d="m12 5 7 7-7 7" />
						</svg>
					</a>
				</article>
			{/each}
		</div>
	</div>
</section>

<style>
	.services {
		--cream: #faf9f6;
		--ink: #1c1c1a;
		--olive: #5c6b47;
		--olive-dark: #3f4a32;
		--gray: #6b6b66;
		--line: #e7e5df;

		font-family: 'Helvetica Neue', Arial, sans-serif;
		background:
			radial-gradient(circle at 15% 20%, #4b845a 0%, transparent 35%),
			radial-gradient(circle at 85% 15%, #fbe9ba 0%, transparent 35%),
			linear-gradient(135deg, #17533a 0%, #84a66d 50%, #fdf0cf 100%);
		color: var(--ink);
		padding: 70px 80px 80px;
	}
	.services * {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}
	.wrapper {
		max-width: 1400px;
		margin: 0 auto;
	}

	.services-head {
		text-align: center;
		margin-bottom: 46px;
	}
	.eyebrow {
		display: inline-block;
		color: var(--olive);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 1.5px;
		margin-bottom: 14px;
	}
	.eyebrow-line {
		width: 36px;
		height: 3px;
		background: var(--olive);
		margin: 0 auto 22px;
	}
	h2 {
		font-size: clamp(30px, 4vw, 44px);
		font-weight: 800;
		line-height: 1.15;
		margin-bottom: 16px;
	}
	h2 span {
		color: var(--olive);
	}
	.lead {
		font-size: 16px;
		color: var(--gray);
		line-height: 1.6;
		max-width: 620px;
		margin: 0 auto;
	}

	/* ---- Service cards ---- */
	.services-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20px;
	}
	.service-card {
		background: #ffffff;
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 28px 24px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
		position: relative;
		overflow: hidden;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease,
			border-color 0.3s ease;
	}
	.service-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 100%;
		height: 3px;
		background: linear-gradient(90deg, var(--olive), var(--olive-dark));
		transition: right 0.35s ease;
	}
	.service-card:hover {
		transform: translateY(-6px);
		border-color: color-mix(in srgb, var(--olive) 40%, transparent);
		box-shadow: 0 18px 38px -18px rgba(63, 74, 50, 0.35);
	}
	.service-card:hover::before {
		right: 0;
	}

	.service-icon {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: #eef0e9;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 18px;
		transition:
			background 0.3s ease,
			transform 0.3s ease;
	}
	.service-icon svg {
		width: 24px;
		height: 24px;
		stroke: var(--ink);
		fill: none;
		transition: stroke 0.3s ease;
	}
	.service-card:hover .service-icon {
		background: var(--olive);
		transform: scale(1.06);
	}
	.service-card:hover .service-icon svg {
		stroke: #fff;
	}

	.service-card h3 {
		font-size: 17px;
		font-weight: 700;
		margin-bottom: 8px;
	}
	.service-card p {
		font-size: 14px;
		color: var(--gray);
		line-height: 1.55;
		flex: 1;
	}

	.service-link {
		margin-top: 18px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.4px;
		color: var(--olive-dark);
		text-decoration: none;
		transition:
			gap 0.25s ease,
			color 0.25s ease;
	}
	.service-link svg {
		width: 15px;
		height: 15px;
		stroke: currentColor;
		fill: none;
	}
	.service-link:hover {
		gap: 10px;
		color: var(--olive);
	}

	@media (max-width: 1100px) {
		.services {
			padding: 50px 40px 60px;
		}
		.services-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (max-width: 640px) {
		.services {
			padding: 40px 20px 50px;
		}
		.services-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.service-card {
			transition: none;
		}
	}
</style>
