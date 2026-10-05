<script lang="ts">
	import type { Product } from '../types/product';

	let {
		product = $bindable()
	}: {
		product: Product;
	} = $props();
</script>

<!-- SEO Settings -->
<div class="rounded-lg bg-base-100 p-6 shadow-sm">
	<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		SEO
	</h2>

	<div class="space-y-4">
		<div class="form-control">
			<label class="label" for="metaTitle">
				<span class="label-text text-sm font-medium">Meta Title</span>
			</label>
			<input
				id="metaTitle"
				type="text"
				name="meta_title"
				class="input-bordered input input-sm w-full"
				bind:value={product.seo.meta_title}
				placeholder="SEO title"
			/>
		</div>

		<div class="form-control">
			<label class="label" for="metaDesc">
				<span class="label-text text-sm font-medium">Meta Description</span>
			</label>
			<textarea
				id="metaDesc"
				name="meta_desc"
				class="textarea-bordered textarea h-16 textarea-sm"
				bind:value={product.seo.meta_description}
				placeholder="SEO description"
			></textarea>
		</div>
		<div class="form-control">
			<label class="label" for="canonicalUrl">
				<span class="label-text text-sm font-medium">Canonical Url</span>
			</label>
			<input
				id="canonicalUrl"
				type="text"
				name="canonicalUrl"
				class="input-bordered input input-sm w-full"
				bind:value={product.seo.canonical_url}
				placeholder="Canonical URL for SEO"
			/>
			<div class="form-control">
				<label class="label" for="keywords">
					<span class="label-text text-sm font-medium">Focused Keywords</span>
				</label>
				<input
					id="canonicalUrl"
					type="text"
					name="keywords"
					class="input-bordered input input-sm w-full"
					bind:value={product.seo.focus_keyword}
					placeholder="Meta Keywords"
				/>
			</div>
		</div>
	</div>
</div>
