<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { page } from '$app/stores';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;

		const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

		tl.from('.error-code', {
			scale: 0.5,
			opacity: 0,
			duration: 0.8,
			ease: 'elastic.out(1, 0.5)'
		})
			.from(
				'.error-title',
				{
					y: 30,
					opacity: 0,
					duration: 0.6
				},
				'-=0.3'
			)
			.from(
				'.error-message',
				{
					y: 20,
					opacity: 0,
					duration: 0.5
				},
				'-=0.2'
			)
			.from(
				'.error-actions',
				{
					y: 20,
					opacity: 0,
					duration: 0.5
				},
				'-=0.2'
			)
			.from(
				'.error-illustration',
				{
					scale: 0.8,
					opacity: 0,
					duration: 0.7,
					ease: 'back.out(1.7)'
				},
				'-=0.5'
			);
	});
</script>

<svelte:head>
	<title>404 — Page Not Found | AFCRC</title>
	<meta name="description" content="The page you're looking for doesn't exist or has been moved." />
</svelte:head>

<div class="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
	<div class="relative mx-auto max-w-2xl">
		<div
			class="error-illustration pointer-events-none absolute -top-16 -right-8 opacity-[0.06] select-none md:top-0 md:right-8"
		>
			<svg
				class="h-64 w-64 text-pine md:h-96 md:w-96"
				viewBox="0 0 200 200"
				fill="none"
				stroke="currentColor"
				stroke-width="1"
			>
				<circle cx="100" cy="100" r="80" stroke-dasharray="8 4" />
				<circle cx="100" cy="100" r="60" stroke-dasharray="4 8" />
				<path d="M60 100 L140 100 M100 60 L100 140" stroke-width="2" />
				<circle cx="100" cy="100" r="8" fill="currentColor" />
			</svg>
		</div>

		<div class="relative">
			<p
				class="error-code font-modern text-[8rem] leading-none font-black tracking-tighter text-pine/10 md:text-[12rem]"
			>
				404
			</p>

			<div class="relative -mt-16 md:-mt-24">
				<h1 class="error-title font-serif text-4xl font-bold text-ink md:text-5xl">
					Page Not Found
				</h1>

				<p class="error-message mx-auto mt-4 max-w-md text-lg text-ink-soft">
					Oops! The page you're looking for seems to have wandered off our farm. It might have been
					moved, deleted, or never existed in the first place.
				</p>

				<div class="error-actions mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
					<a
						href="/"
						class="group inline-flex items-center gap-2 rounded-full bg-pine px-8 py-3.5 font-sans text-sm font-medium text-paper-white transition-all duration-300 hover:bg-pine-dark hover:shadow-lg hover:shadow-pine/20"
					>
						<svg
							class="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						Back to Home
					</a>

					<a
						href="/contact"
						class="group inline-flex items-center gap-2 rounded-full border-2 border-ink/15 px-8 py-3.5 font-sans text-sm font-medium text-ink transition-all duration-300 hover:border-pine hover:bg-pine/5 hover:text-pine"
					>
						Contact Us
						<svg
							class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
