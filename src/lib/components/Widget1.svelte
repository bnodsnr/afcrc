<section class="bg-paper-white py-[100px] max-md:py-16">
	<div
		class="mx-auto grid max-w-[1180px] grid-cols-[1fr_1fr] gap-[70px] px-6 max-lg:grid-cols-1 max-md:px-4"
	>
		<div
			class="relative overflow-hidden rounded-2xl p-10"
			style="background:
				radial-gradient(circle at 15% 20%, #4b845a 0%, transparent 35%),
				radial-gradient(circle at 85% 15%, #fbe9ba 0%, transparent 35%),
				linear-gradient(135deg, #17533a 0%, #84a66d 50%, #fdf0cf 100%)"
		>
			<div class="eyebrow text-gold before:bg-gold">Where Agriculture Meets Conservation</div>
			<h2
				class="mt-4 mb-4 font-serif text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-[-0.01em] text-paper"
			>
				Where Agriculture Meets Conservation
			</h2>
			<p class="mb-4 max-w-[340px] text-[0.9rem] leading-relaxed text-paper/85">
				Agriculture and forests are interconnected. Healthy ecosystems support productive landscapes
				and resilient communities.
			</p>
			<div class="relative mx-auto mt-8 h-[340px] w-[340px] max-w-full">
				<svg viewBox="0 0 340 340" class="absolute inset-0 h-full w-full">
					<line x1="170" y1="80" x2="70" y2="150" stroke="#C9CDC2" stroke-width="1.5" />
					<line x1="170" y1="80" x2="270" y2="150" stroke="#C9CDC2" stroke-width="1.5" />
					<line x1="70" y1="150" x2="170" y2="180" stroke="#C9CDC2" stroke-width="1.5" />
					<line x1="270" y1="150" x2="170" y2="180" stroke="#C9CDC2" stroke-width="1.5" />
					<line x1="170" y1="180" x2="170" y2="290" stroke="#C9CDC2" stroke-width="1.5" />
					<line x1="70" y1="150" x2="170" y2="290" stroke="#C9CDC2" stroke-width="1.5" />
					<line x1="270" y1="150" x2="170" y2="290" stroke="#C9CDC2" stroke-width="1.5" />
				</svg>
				{#each ECOSYSTEM_NODES as node (node.label)}
					<div class="absolute w-[96px] text-center {node.cls}">
						<div
							class="mx-auto mb-1.5 flex h-[56px] w-[56px] items-center justify-center rounded-full border-[3px] border-white shadow-[0_10px_30px_rgba(18,50,26,0.12)]"
							style="background: {node.bg};"
						>
							<svg
								class="h-6 w-6 text-white"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"><path d={node.icon} /></svg
							>
						</div>
						<span class="text-[0.72rem] font-semibold text-paper">{node.label}</span>
					</div>
				{/each}
			</div>
		</div>

		<div>
			<div class="eyebrow text-pine before:bg-pine">What guides us</div>
			<h2
				class="mt-4 mb-8 font-serif text-[clamp(1.8rem,3vw,2.4rem)] font-semibold tracking-[-0.01em] text-pine-dark"
			>
				Our Values
			</h2>
			<div class="grid grid-cols-3 gap-x-6 gap-y-8 max-md:grid-cols-2">
				{#each VALUES as v (v.title)}
					<div class="text-center">
						<div
							class="mx-auto mb-2.5 flex h-[46px] w-[46px] items-center justify-center rounded-full border border-teal bg-teal/15"
						>
							<svg
								class="h-[22px] w-[22px] text-teal"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"><path d={v.icon} /></svg
							>
						</div>
						<h4 class="mb-1 font-serif text-[0.95rem] font-semibold text-pine-dark">
							{v.title}
						</h4>
						<p class="text-[0.82rem] leading-snug text-ink-soft">{v.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
