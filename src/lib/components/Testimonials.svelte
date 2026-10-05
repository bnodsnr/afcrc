<script lang="ts">
	let { testimonials }: { testimonials: any[] } = $props();
</script>

<section
	class="bg-paper-2 py-[110px]"
	style="background: radial-gradient(circle at 5% 10%, rgba(149, 196, 172, 0.38) 0%, transparent 30%), radial-gradient(circle at 95% 5%, rgba(204, 176, 232, 0.32) 0%, transparent 30%), radial-gradient(circle at 90% 85%, rgba(74, 144, 226, 0.20) 0%, transparent 32%), radial-gradient(circle at 15% 90%, rgba(244, 205, 66, 0.20) 0%, transparent 30%), radial-gradient(circle at 50% 50%, rgba(105, 177, 123, 0.08) 0%, transparent 45%), linear-gradient(135deg, #ffffff 0%, #f8faf9 45%, #faf8fc 100%);
    background-repeat: repeat, repeat, repeat, repeat, repeat, repeat;
  background-repeat: no-repeat !important;"
	id="testimonials"
>
	<div class="mx-auto max-w-[1180px] px-10 max-md:px-[22px]">
		<div class="eyebrow text-pine-dark before:bg-gold">Hear From Our Customers</div>
		<h2
			class="reveal mt-[18px] mb-[60px] max-w-[600px] font-serif text-[clamp(1.9rem,3.2vw,2.5rem)] font-semibold tracking-[-0.01em] text-pine-dark"
		>
			Trusted by the people who source from us every week.
		</h2>

		<div class="testimonial-grid grid grid-cols-3 gap-7 max-lg:grid-cols-1">
			{#each testimonials as testimonial (testimonial.id)}
				<div
					class="reveal testimonial-card flex flex-col rounded-[18px] border border-line bg-white p-[34px]"
				>
					<div class="mb-[6px] font-serif text-[2.6rem] leading-none text-pine">&quot;</div>
					<div class="mb-[26px] flex-1 text-[0.97rem] leading-relaxed text-ink-soft">
						{@html testimonial.content}
					</div>
					<div class="flex items-center gap-[14px]">
						{#if testimonial.photo}
							<img
								src={testimonial.photo}
								alt={testimonial.name}
								class="h-11 w-11 shrink-0 rounded-full object-cover"
							/>
						{:else}
							<div
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine font-mono text-[0.85rem] font-semibold text-paper"
							>
								{testimonial.name
									.split(' ')
									.map((w: string) => w[0])
									.join('')
									.slice(0, 2)
									.toUpperCase()}
							</div>
						{/if}
						<div>
							<div class="text-[0.92rem] font-semibold text-pine-dark">{testimonial.name}</div>
							<div class="text-[0.78rem] text-ink-soft">
								{testimonial.designation ? testimonial.designation + ', ' : ''}{testimonial.company}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
