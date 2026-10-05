<script lang="ts">
	import type { StatusChoice, VisibilityChoice } from '../types/product';

	let {
		status = $bindable(),
		visibility = $bindable(),
		featured = $bindable()
	}: {
		status: StatusChoice;
		visibility: VisibilityChoice;
		featured: boolean;
	} = $props();
</script>

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
		Status & Feature
	</h2>
	<div class="space-y-4">
		<div class="form-control">
			<label class="label" for="status">
				<span class="label-text text-sm font-medium">Status</span>
			</label>
			<select
				id="status"
				class="select-bordered select w-full select-sm"
				bind:value={status}
				name="status"
			>
				<option value="draft">Draft</option>
				<option value="pending">Pending Review</option>
				<option value="published" selected>Published</option>
			</select>
		</div>

		<div class="form-control">
			<label class="label" for="visibility">
				<span class="label-text text-sm font-medium">Visibility</span>
			</label>
			<select
				id="visibility"
				class="select-bordered select w-full select-sm"
				bind:value={visibility}
				name="visibility"
			>
				<option value="visible">Shop & search</option>
				<option value="catalog">Shop only</option>
				<option value="search">Search only</option>
				<option value="hidden">Hidden</option>
			</select>
		</div>

		<div class="form-control">
			<label class="label cursor-pointer justify-start gap-2">
				<input
					type="checkbox"
					class="checkbox checkbox-sm"
					name="featured"
					bind:checked={featured}
				/>
				<span class="label-text text-sm font-medium">Featured product</span>
			</label>
		</div>
	</div>
</div>
