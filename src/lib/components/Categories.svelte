<script lang="ts">
	import { base } from '$app/paths';
</script>

<section class="relative z-10 -mt-20 pt-4 pb-6" id="categories">
	<div class="mx-auto max-w-[1180px] px-6 max-md:px-4">
		<div
			class="cat-grid mx-auto grid max-w-5xl grid-cols-4 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1"
		>
			<a
				href="/categories/agri-products"
				class="cat-card group relative flex flex-col items-center overflow-hidden rounded-2xl border border-line bg-white bg-cover bg-center px-5 py-8 text-center shadow-[0_8px_28px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(30,75,51,0.2)]"
				style="background-image: url('https://picsum.photos/seed/agri-field/400/400')"
			>
				<div
					class="absolute inset-0 bg-gradient-to-t from-paper/95 via-paper/45 to-transparent"
				></div>
				<div class="relative z-10 flex flex-col items-center">
					<div
						class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-paper/70 text-pine-dark shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:bg-pine-dark group-hover:text-white"
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
							><path d="M12 3C12 3 6 9 6 15C6 18 8 21 12 22" /><path
								d="M12 3C12 3 18 9 18 15C18 18 16 21 12 22"
							/><path d="M12 22V6" /></svg
						>
					</div>
					<h3
						class="mb-1 font-serif text-[1.35rem] font-extrabold tracking-tight text-pine-dark uppercase"
					>
						Agri Products
					</h3>
					<p class="mb-4 text-sm text-ink-soft">Fresh crops & produce</p>
					<span
						class="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-pine-dark transition-all duration-300 group-hover:gap-2 group-hover:text-gold"
					>
						View Products
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
					</span>
				</div>
			</a>
			<a
				href="/categories/meat-products"
				class="cat-card group relative flex flex-col items-center overflow-hidden rounded-2xl border border-line bg-white bg-cover bg-center px-5 py-8 text-center shadow-[0_8px_28px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(30,75,51,0.2)]"
				style="background-image: url('https://picsum.photos/seed/meat-steak/400/400')"
			>
				<div
					class="absolute inset-0 bg-gradient-to-t from-paper/95 via-paper/45 to-transparent"
				></div>
				<div class="relative z-10 flex flex-col items-center">
					<div
						class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-paper/70 text-pine-dark shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:bg-pine-dark group-hover:text-white"
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
							><path d="M17 8C17 5 15 3 12 3C9 3 7 5 7 8" /><path d="M5 14L7 21H17L19 14" /><path
								d="M3 14H21"
							/></svg
						>
					</div>
					<h3 class="mb-1 font-serif text-[1.35rem] font-extrabold tracking-tight text-pine-dark">
						Premium Meat
					</h3>
					<p class="mb-4 text-sm text-ink-soft">Beef, poultry & lamb</p>
					<span
						class="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-pine-dark transition-all duration-300 group-hover:gap-2 group-hover:text-gold"
					>
						View Products
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
					</span>
				</div>
			</a>
			<a
				href="/categories/supplements"
				class="cat-card group relative flex flex-col items-center overflow-hidden rounded-2xl border border-line bg-white bg-cover bg-center px-5 py-8 text-center shadow-[0_8px_28px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(30,75,51,0.2)]"
				style="background-image: url('https://picsum.photos/seed/herbal-pills/400/400')"
			>
				<div
					class="absolute inset-0 bg-gradient-to-t from-paper/95 via-paper/45 to-transparent"
				></div>
				<div class="relative z-10 flex flex-col items-center">
					<div
						class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-paper/70 text-pine-dark shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:bg-pine-dark group-hover:text-white"
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
							><path d="M7 21L12 17L17 21" /><path d="M12 17V3" /><path
								d="M9 6C9 6 5 9 5 13"
							/><path d="M15 6C15 6 19 9 19 13" /></svg
						>
					</div>
					<h3 class="mb-1 font-serif text-[1.35rem] font-extrabold tracking-tight text-pine-dark">
						Supplements
					</h3>
					<p class="mb-4 text-sm text-ink-soft">Wellness & extracts</p>
					<span
						class="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-pine-dark transition-all duration-300 group-hover:gap-2 group-hover:text-gold"
					>
						View Products
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
					</span>
				</div>
			</a>
			<a
				href="/categories/beverages"
				class="cat-card group relative flex flex-col items-center overflow-hidden rounded-2xl border border-line bg-white bg-cover bg-center px-5 py-8 text-center shadow-[0_8px_28px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(30,75,51,0.2)]"
				style="background-image: url('https://picsum.photos/seed/juice-drink/400/400')"
			>
				<div
					class="absolute inset-0 bg-gradient-to-t from-paper/95 via-paper/45 to-transparent"
				></div>
				<div class="relative z-10 flex flex-col items-center">
					<div
						class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-paper/70 text-pine-dark shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:bg-pine-dark group-hover:text-white"
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
							><path
								d="M17 9H7C5 9 4 10 4 12V17C4 19 5 20 7 20H17C19 20 20 19 20 17V12C20 10 19 9 17 9Z"
							/><path d="M8 9V7C8 5 10 4 12 4C14 4 16 5 16 7V9" /><path d="M10 15H14" /></svg
						>
					</div>
					<h3 class="mb-1 font-serif text-[1.35rem] font-extrabold tracking-tight text-pine-dark">
						Beverages
					</h3>
					<p class="mb-4 text-sm text-ink-soft">Juices & functional</p>
					<span
						class="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-pine-dark transition-all duration-300 group-hover:gap-2 group-hover:text-gold"
					>
						View Products
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
					</span>
				</div>
			</a>
		</div>
	</div>
</section>
