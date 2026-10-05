<script lang="ts">
	import { enhance } from '$app/forms';
	import { base } from '$lib/admin/paths';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();

	let categories = $derived(data.categories ?? []);
	let isOpen = $state(false);
</script>

<div class="min-h-screen bg-base-200">
	<div class="mx-auto">
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-2 text-sm">
				<a href={base} class="link font-medium text-primary link-hover">Dashboard</a>
				<svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
				<a href={base + '/tours'} class="link font-medium text-primary link-hover">Tours</a>
				<svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
				<span class="text-base-content/60">Tour Categories</span>
			</div>
			<button class="btn btn-primary" onclick={() => (isOpen = true)}>+ Add Category</button>
		</div>

		{#if form?.success}
			<div class="mb-6 alert alert-success">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<span>{form.message}</span>
			</div>
		{/if}
		{#if form?.error}
			<div class="mb-6 alert alert-error">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
				<span>{form.error}</span>
			</div>
		{/if}

		<div class="rounded-lg bg-base-100 shadow-sm">
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Slug</th>
							<th>Status</th>
							<th>Sort</th>
							<th>Packages</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each categories as cat (cat.id)}
							<tr>
								<td class="font-semibold">{cat.name}</td>
								<td class="text-base-content/60">{cat.slug}</td>
								<td><span class="badge {cat.status === 'active' ? 'badge-success' : 'badge-ghost'}">{cat.status}</span></td>
								<td>{cat.sort_order}</td>
								<td>{cat.package_count ?? 0}</td>
								<td class="text-right">
									<form method="POST" action="?/delete" use:enhance>
										<input type="hidden" name="id" value={cat.id} />
										<button
											type="submit"
											class="btn btn-circle btn-sm btn-ghost text-error"
											title="Delete"
											onclick={(e) => {
												if (!confirm(`Delete category "${cat.name}"?`)) e.preventDefault();
											}}
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
										</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>

				{#if categories.length === 0}
					<div class="py-16 text-center text-base-content/50">No tour categories yet.</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Create modal -->
{#if isOpen}
	<div class="modal modal-open">
		<form method="POST" action="?/create" use:enhance class="modal-box">
			<h3 class="text-lg font-bold">Add Tour Category</h3>
			<div class="mt-4 space-y-4">
				<div class="form-control">
					<label class="label" for="cat_name"><span class="label-text font-medium">Name *</span></label>
					<input type="text" id="cat_name" name="name" class="input-bordered input w-full" placeholder="e.g. Himalayan Treks" required value={form?.name || ''} />
				</div>
				<div class="form-control">
					<label class="label" for="cat_desc"><span class="label-text font-medium">Description</span></label>
					<textarea id="cat_desc" name="description" class="textarea-bordered textarea w-full" rows="3">{form?.description || ''}</textarea>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="form-control">
						<label class="label" for="cat_status"><span class="label-text font-medium">Status</span></label>
						<select id="cat_status" name="status" class="select-bordered select w-full">
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</div>
					<div class="form-control">
						<label class="label" for="cat_sort"><span class="label-text font-medium">Sort Order</span></label>
						<input type="number" id="cat_sort" name="sort_order" class="input-bordered input w-full" value="0" />
					</div>
				</div>
			</div>
			<div class="modal-action">
				<button type="button" class="btn" onclick={() => (isOpen = false)}>Cancel</button>
				<button type="submit" class="btn btn-primary">Create</button>
			</div>
		</form>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => (isOpen = false)}>close</button>
		</form>
	</div>
{/if}
