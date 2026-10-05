<script lang="ts">
	import { enhance } from '$app/forms';
	import { base } from '$lib/admin/paths';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { getImageUrl } from '$lib/admin/utils/image';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();

	let tours = $derived(data.packages ?? []);
	let pagination = $derived(data.pagination ?? { count: 0, page: 1, page_size: 10 });

	function mediaUrl(path: string | null | undefined): string {
		if (!path) return '';
		return `${PUBLIC_API_BASE_URL}/media/${path.replace(/^\//, '')}`;
	}

	function formatPrice(t: any): string {
		if (t.discount_price && Number(t.discount_price) > 0) {
			return `${t.currency ?? ''} ${t.discount_price}`;
		}
		return `${t.currency ?? ''} ${t.starting_price ?? '0'}`;
	}

	function statusBadge(status: string): string {
		const map: Record<string, string> = {
			draft: 'badge-ghost',
			published: 'badge-success',
			archived: 'badge-warning'
		};
		return map[status] ?? 'badge-ghost';
	}
</script>

<div class="min-h-screen bg-base-200">
	<div class="mx-auto">
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-2 text-sm">
				<a href={base} class="link font-medium text-primary link-hover">Dashboard</a>
				<svg
					class="h-4 w-4 text-base-content/40"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
				<span class="text-base-content/60">Tours</span>
			</div>
			<a href={base + '/tours/create'} class="btn btn-primary">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Create Tour
			</a>
		</div>

		{#if form?.success}
			<div class="mb-6 alert alert-success">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				<span>{form.message}</span>
			</div>
		{/if}
		{#if form?.error}
			<div class="mb-6 alert alert-error">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				<span>{form.error}</span>
			</div>
		{/if}

		<div class="rounded-lg bg-base-100 shadow-sm">
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>Tour</th>
							<th>Category</th>
							<th>Duration</th>
							<th>Price</th>
							<th>Status</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each tours as tour (tour.id)}
							<tr>
								<td>
									<div class="flex items-center gap-3">
										<div class="avatar">
											<div class="h-12 w-16 rounded-md">
												{#if tour.thumbnail}
													<img
														src={getImageUrl(tour.thumbnail)}
														alt={tour.title}
														class="h-full w-full object-cover"
													/>
												{:else}
													<div
														class="flex h-full w-full items-center justify-center bg-base-200 text-xs text-base-content/50"
													>
														No img
													</div>
												{/if}
											</div>
										</div>
										<div>
											<div class="font-semibold">{tour.title}</div>
											<div class="text-xs text-base-content/50">{tour.slug}</div>
										</div>
									</div>
								</td>
								<td>{tour.category?.name ?? '—'}</td>
								<td>{tour.duration_days} days</td>
								<td>{formatPrice(tour)}</td>
								<td><span class="badge {statusBadge(tour.status)}">{tour.status}</span></td>
								<td class="text-right">
									<div class="flex justify-end gap-1">
										<a
											href={`${base}/tours/${tour.id}`}
											class="btn btn-circle btn-sm btn-ghost"
											title="View tour"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												/><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
												/></svg
											>
										</a>
										<form method="POST" action="?/delete" use:enhance>
											<input type="hidden" name="id" value={tour.id} />
											<button
												type="submit"
												class="btn btn-circle btn-sm btn-ghost text-error"
												title="Delete"
												onclick={(e) => {
													if (!confirm(`Delete tour "${tour.title}"?`)) e.preventDefault();
												}}
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
													><path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/></svg
												>
											</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>

				{#if tours.length === 0}
					<div class="py-16 text-center">
						<p class="text-base-content/50">No tours yet.</p>
						<a href={base + '/tours/create'} class="btn btn-primary btn-sm mt-4"
							>Create your first tour</a
						>
					</div>
				{/if}
			</div>

			{#if pagination.count > pagination.page_size}
				<div class="flex items-center justify-between border-t border-base-300 p-4">
					<p class="text-sm text-base-content/60">
						Showing {pagination.page} of {Math.max(
							1,
							Math.ceil(pagination.count / pagination.page_size)
						)} pages ({pagination.count} tours)
					</p>
					<div class="flex gap-2">
						<a
							href={`${base}/tours?page=${Math.max(1, pagination.page - 1)}`}
							class="btn btn-sm {pagination.page <= 1 ? 'btn-disabled' : ''}">Prev</a
						>
						<a
							href={`${base}/tours?page=${pagination.page + 1}`}
							class="btn btn-sm"
							class:btn-disabled={pagination.page * pagination.page_size >= pagination.count}
							>Next</a
						>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
