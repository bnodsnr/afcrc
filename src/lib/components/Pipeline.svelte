<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	const stages = [
		{
			number: '01',
			title: 'Grown & raised right',
			color: 'gold',
			textClass: 'text-gold',
			dotClass: 'bg-gold/15',
			label: 'PRODUCTION'
		},
		{
			number: '02',
			title: 'Sealed for integrity',
			color: 'teal',
			textClass: 'text-gold',
			dotClass: 'bg-gold/15',
			label: 'PACKAGING'
		},
		{
			number: '03',
			title: 'Delivered on time',
			color: 'meadow',
			textClass: 'text-gold',
			dotClass: 'bg-gold/15',
			label: 'DISTRIBUTION'
		}
	];

	let root: HTMLElement | undefined = $state();

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		if (!root) return;

		// Scoped to THIS component only — selectors below can't touch
		// category cards / badges living in other sections.
		const ctx = gsap.context(() => {
			const visual = root!.querySelector('.pipeline-visual');

			const tl = gsap.timeline({
				scrollTrigger: { trigger: visual, start: 'top 80%' }
			});

			tl.from(visual, { opacity: 0, y: 30, duration: 0.7, ease: 'power2.out' })
				// rings spin + grow into place (unique to pipeline visual)
				.from(
					'.ring',
					{
						opacity: 0,
						scale: 0.55,
						rotation: 45,
						transformOrigin: '50% 50%',
						duration: 0.8,
						stagger: 0.12,
						ease: 'back.out(1.4)'
					},
					'-=0.3'
				)
				.from('.connector', { opacity: 0, duration: 0.5, stagger: 0.15 }, '-=0.5')
				.from(
					'.origin-dot, .origin-pulse',
					{ opacity: 0, scale: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(2)' },
					'-=0.25'
				)
				// badge drops in from above
				.from('.badge', { opacity: 0, y: -14, duration: 0.45, ease: 'power2.out' }, '-=0.2')
				// stage cards fly in from their own directions
				.from('.c-gold', { opacity: 0, x: -46, duration: 0.5, ease: 'power3.out' }, '-=0.2')
				.from('.c-meadow', { opacity: 0, x: 46, duration: 0.5, ease: 'power3.out' }, '-=0.35')
				.from('.c-teal', { opacity: 0, y: 46, duration: 0.5, ease: 'power3.out' }, '-=0.35');
		}, root);

		return () => ctx.revert();
	});
</script>

<section class="pipeline relative overflow-hidden pt-[250px] pb-[50px]" id="pipeline" bind:this={root}>
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<div class="grid grid-cols-[1.1fr_0.9fr] items-stretch gap-[60px] max-lg:grid-cols-1">
			<div class="flex flex-col justify-center">
				<div class="eyebrow text-gold before:bg-gold">Welcome to AFCRC</div>
				<h2
					class="reveal mt-[18px] mb-10 max-w-[600px] font-serif text-[clamp(2rem,3.4vw,2.7rem)] font-semibold tracking-[-0.01em] text-gold"
				>
					One continuous chain of custody — from raw produce to the customer's hands.
				</h2>
				<p class="reveal mb-10 max-w-[600px] text-[1.05rem] leading-[1.65] text-white">
					Agricultural & Forest Conservation Research Centre (AFCRC) is dedicated to advancing
					sustainable agriculture, forest conservation, and rural development through innovative
					research, quality products, and community collaboration. AFCRC promotes environmentally
					responsible practices, supports farmers and local communities, and delivers trusted
					agricultural, livestock, herbal, and forestry-related solutions for a healthier and more
					sustainable future.
				</p>
				<!-- <div
					class="pipeline-stages relative space-y-7 pl-8 before:absolute before:top-3 before:bottom-2 before:left-[11px] before:w-px before:bg-gradient-to-b before:from-gold before:via-teal before:to-meadow max-lg:pl-8"
				>
					{#each stages as stage}
						<div class="pipeline-stage relative translate-x-[-12px] opacity-0">
							<div
								class="absolute top-1 -left-8 flex h-6 w-6 items-center justify-center rounded-full {stage.dotClass}"
							>
								<span class="h-2.5 w-2.5 rounded-full bg-{stage.color}"></span>
							</div>
							<div class="mb-1 font-mono text-[0.72rem] tracking-[0.1em] {stage.textClass}">
								{stage.number} — {stage.label}
							</div>
							<h3 class="font-serif text-[1.3rem] font-semibold tracking-[-0.01em] text-white">
								{stage.title}
							</h3>
						</div>
					{/each}
				</div> -->
			</div>

			<div class="pipeline-visual [py-10px] relative rounded-3xl" style="min-height: 580px; ">
				<svg viewBox="0 0 420 480" fill="none" class="h-full w-full" style="overflow: visible;">
					<defs>
						<radialGradient id="connector-glow" cx="50%" cy="50%" r="50%">
							<stop offset="0%" stop-color="rgba(232,169,59,0.06)" />
							<stop offset="100%" stop-color="rgba(232,169,59,0)" />
						</radialGradient>
					</defs>

					<circle cx="210" cy="195" r="230" fill="url(#connector-glow)" />
					<circle class="ring ring-gold" cx="210" cy="195" r="195" />
					<circle class="ring ring-teal" cx="210" cy="195" r="160" />
					<circle class="ring ring-meadow" cx="210" cy="195" r="125" />

					<path
						id="p-prod"
						class="connector"
						d="M 210 195 C 165 175, 120 150, 88 118"
						stroke="#E8A93B"
						stroke-width="1.6"
						stroke-dasharray="5 7"
						stroke-linecap="round"
						fill="none"
						opacity="0.9"
					/>
					<path
						id="p-dist"
						class="connector"
						d="M 210 195 C 255 175, 300 150, 332 118"
						stroke="#7CAA45"
						stroke-width="1.6"
						stroke-dasharray="5 7"
						stroke-linecap="round"
						fill="none"
						opacity="0.9"
					/>
					<path
						id="p-pack"
						class="connector"
						d="M 210 195 C 210 250, 210 300, 210 345"
						stroke="#3FA0C4"
						stroke-width="1.6"
						stroke-dasharray="5 7"
						stroke-linecap="round"
						fill="none"
						opacity="0.9"
					/>

					<circle
						class="origin-pulse"
						cx="210"
						cy="195"
						r="5"
						fill="none"
						stroke="#E8A93B"
						stroke-width="1.3"
					/>
					<circle
						class="origin-dot"
						cx="210"
						cy="195"
						r="4"
						fill="#E8A93B"
						filter="drop-shadow(0 0 8px #E8A93B)"
					/>

					<g class="runner" style="color: #E8A93B;">
						<circle r="2.4" fill="#E8A93B">
							<animateMotion
								dur="4.5s"
								repeatCount="indefinite"
								path="M 210 195 C 165 175, 120 150, 88 118"
							/>
						</circle>
					</g>
					<g class="runner" style="color: #7CAA45;">
						<circle r="2.4" fill="#7CAA45">
							<animateMotion
								dur="4.5s"
								repeatCount="indefinite"
								path="M 210 195 C 255 175, 300 150, 332 118"
							/>
						</circle>
					</g>
					<g class="runner" style="color: #3FA0C4;">
						<circle r="2.4" fill="#3FA0C4">
							<animateMotion
								dur="4.5s"
								repeatCount="indefinite"
								path="M 210 195 C 210 250, 210 300, 210 345"
							/>
						</circle>
					</g>
				</svg>

				<div class="badge-pos" style="left: 50%; top: 40.6%;">
					<div class="badge">
						<span class="dot"></span>
						<span>OUR PROCESS</span>
					</div>
				</div>

				<div class="card-pos" style="left: 2%; top: 16%;">
					<div class="card c-gold">
						<div class="num">01</div>
						<div>
							<h3>Production</h3>
							<span>STAGE 01</span>
						</div>
					</div>
				</div>

				<div class="card-pos" style="right: 2%; top: 16%;">
					<div class="card c-meadow">
						<div class="num">03</div>
						<div>
							<h3>Distribution</h3>
							<span>STAGE 03</span>
						</div>
					</div>
				</div>

				<div class="card-pos" style="left: 50%; top: 60%; transform: translateX(-50%);">
					<div class="card c-teal">
						<div class="num">02</div>
						<div>
							<h3>Packaging</h3>
							<span>STAGE 02</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.pipeline {
		background:
			radial-gradient(circle at 15% 20%, #4b845a 0%, transparent 35%),
			radial-gradient(circle at 85% 15%, #fbe9ba 0%, transparent 35%),
			linear-gradient(135deg, #17533a 0%, #84a66d 50%, #fdf0cf 100%);
	}
	.pipeline-visual .ring {
		fill: none;
		stroke-width: 4px;
		stroke-linecap: round;
	}
	.pipeline-visual .ring-gold {
		stroke: #e8a93b;
		opacity: 0.95;
		stroke-dasharray: 10 16;
	}
	.pipeline-visual .ring-teal {
		stroke: #3fa0c4;
		opacity: 0.95;
		stroke-dasharray: 6 12;
	}
	.pipeline-visual .ring-meadow {
		stroke: #7caa45;
		opacity: 0.95;
		stroke-dasharray: 4 10;
	}

	.pipeline-visual .origin-pulse {
		animation: expand 2.8s ease-out infinite;
		transform-origin: center;
	}
	@keyframes expand {
		0% {
			r: 5;
			opacity: 0.7;
		}
		100% {
			r: 32;
			opacity: 0;
		}
	}

	.pipeline-visual .runner circle {
		animation: pulse-runner 2.6s ease-in-out infinite;
	}
	@keyframes pulse-runner {
		0%,
		100% {
			r: 2.4;
			opacity: 0.55;
		}
		50% {
			r: 3.4;
			opacity: 1;
		}
	}

	.pipeline-visual .card-pos {
		position: absolute;
	}

	.pipeline-visual .card {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 18px 14px 14px;
		border-radius: 14px;
		border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
		background:
			radial-gradient(
				160% 160% at 0% 0%,
				color-mix(in srgb, var(--accent) 42%, transparent),
				transparent 55%
			),
			linear-gradient(
				140deg,
				color-mix(in srgb, var(--accent) 34%, #0d1a14),
				color-mix(in srgb, var(--accent) 12%, #0d1a14)
			);
		box-shadow: 0 12px 30px -14px var(--accent-glow);
		backdrop-filter: blur(14px);
		white-space: nowrap;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease,
			border-color 0.3s ease;
	}
	.pipeline-visual .card:hover {
		transform: translateY(-3px);
		border-color: color-mix(in srgb, var(--accent) 85%, white);
		box-shadow: 0 18px 42px -16px var(--accent-glow);
	}
	.pipeline-visual .card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		border-radius: 14px 0 0 14px;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--accent) 90%, white),
			var(--accent)
		);
	}

	.pipeline-visual .num {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 9px;
		font-family: 'JetBrains Mono', monospace;
		font-weight: 600;
		font-size: 0.78rem;
		color: #0d1a14;
		background: var(--accent);
		box-shadow: 0 6px 16px -6px var(--accent-glow);
		flex-shrink: 0;
	}

	.pipeline-visual .card h3 {
		margin: 0;
		font-family: 'Fraunces', serif;
		font-weight: 500;
		font-size: 0.98rem;
		color: #f4f1e8;
		line-height: 1.15;
	}
	.pipeline-visual .card span {
		display: block;
		margin-top: 2px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.6rem;
		letter-spacing: 0.16em;
		color: rgba(244, 241, 232, 0.62);
	}

	.pipeline-visual .c-gold {
		--accent: #e8a93b;
		--accent-glow: rgba(232, 169, 59, 0.4);
	}
	.pipeline-visual .c-teal {
		--accent: #3fa0c4;
		--accent-glow: rgba(63, 160, 196, 0.4);
	}
	.pipeline-visual .c-meadow {
		--accent: #7caa45;
		--accent-glow: rgba(124, 170, 69, 0.4);
	}

	/* wrapper pins the badge to the exact center of the concentric rings
	   (cx 210/420 = 50%, cy 195/480 = 40.6%) — GSAP animates the inner pill */
	.pipeline-visual .badge-pos {
		position: absolute;
		transform: translate(-50%, -50%);
	}

	.pipeline-visual .badge {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 7px 16px;
		border-radius: 999px;
		border: 1px solid rgba(232, 169, 59, 0.35);
		background: color-mix(in srgb, #0f1f19 88%, black);
		box-shadow: 0 6px 18px -8px rgba(232, 169, 59, 0.45);
	}
	.pipeline-visual .badge .dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #e8a93b;
		box-shadow: 0 0 8px rgba(232, 169, 59, 0.8);
	}
	.pipeline-visual .badge span {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.58rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		color: #e8a93b;
	}
</style>
