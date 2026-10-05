<script lang="ts">
	import bg from '$lib/images/bg.png';
</script>

<section
	class="relative flex min-h-[680px] w-full items-center justify-center overflow-hidden max-[480px]:min-h-[580px] max-md:min-h-[620px]"
	id="contact"
	style="background-image: url({bg}); background-size: cover; background-position: center; background-repeat: no-repeat;"
>
	<div
		class="absolute inset-0"
		style="background: linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.52) 50%, rgba(0,0,0,0.72) 100%);"
	></div>
	<div
		class="absolute inset-0"
		style="background: linear-gradient(160deg, rgba(23,83,58,0.72) 0%, rgba(23,83,58,0.35) 45%, rgba(132,166,109,0.42) 100%); mix-blend-mode: multiply;"
	></div>

	<div
		class="relative z-10 mx-auto w-[min(900px,90%)] px-5 py-20 text-center text-white max-md:px-[18px] max-md:py-[60px]"
	>
		<div
			class="reveal mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 bg-white/10 text-gold shadow-[0_0_30px_-6px_rgba(251,233,186,0.5)] backdrop-blur-sm"
		>
			<svg
				width="26"
				height="26"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M12 3C12 3 6 9 6 15C6 18 8 21 12 22" />
				<path d="M12 3C12 3 18 9 18 15C18 18 16 21 12 22" />
				<path d="M12 22V6" />
			</svg>
		</div>
		<div class="eyebrow justify-center text-gold before:bg-gold">Let's work together</div>
		<h1
			class="reveal mx-auto mt-2 font-serif text-[clamp(2.6rem,6vw,5rem)] leading-[1.02] font-semibold tracking-[-0.01em] text-white [text-shadow:0_3px_15px_rgba(0,0,0,0.45)] max-[480px]:text-[2.2rem] max-md:text-[clamp(2.2rem,9vw,3.4rem)]"
		>
			Ready to source premium products through a chain you can verify at every step?
		</h1>
		<p
			class="mx-auto mb-8 max-w-[680px] text-[1.15rem] leading-[1.9] text-white/95 max-md:text-[1rem]"
		>
			From field to final delivery, we handle production, packaging and distribution under one
			transparent supply chain — so you can trust every step.
		</p>
		<div class="mb-10 flex items-center justify-center gap-4">
			<div class="h-px w-16 bg-gradient-to-r from-transparent to-gold/70"></div>
			<div class="h-[5px] w-[5px] rotate-45 bg-gold"></div>
			<div class="h-px w-16 bg-gradient-to-l from-transparent to-gold/70"></div>
		</div>
		<a
			href="https://www.facebook.com/profile.php?id=100066542056042"
			target="_blank"
			rel="noopener"
			class="group inline-flex min-w-[215px] items-center justify-center gap-2 rounded-full border border-gold/70 bg-gold/10 px-[30px] py-[15px] text-[1.05rem] font-semibold tracking-[0.06em] text-gold shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-pine-dark hover:shadow-[0_18px_40px_-12px_rgba(251,233,186,0.55)] max-md:min-w-[185px] max-md:text-[1rem]"
		>
			Contact Us
			<span
				class="text-[0.9rem] leading-none transition-transform duration-300 group-hover:translate-x-1"
				>▯</span
			>
		</a>
	</div>
	<div
		class="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-pine-dark/60 to-transparent"
	></div>
</section>
