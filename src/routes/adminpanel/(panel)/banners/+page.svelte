<script lang="ts">
	import { base } from '$lib/admin/paths';
	import { getImageUrl } from '$lib/admin/utils/image';
	import { enhance } from '$app/forms';
	import { hasPermission } from '$lib/admin/utils/permissions';

	interface Banner {
		id: number;
		title: string;
		image: string;
		primary_text?: string;
		secondary_text?: string;
		link?: string;
		is_active: boolean;
		created_at?: string;
		updated_at?: string;
	}

	interface PageData {
		banners: Banner[];
	}

	// Toast notifications
	interface Toast {
		id: number;
		message: string;
		type: 'success' | 'error' | 'info';
	}
	let toasts = $state<Toast[]>([]);

	function addToast(message: string, type: Toast['type'] = 'info') {
		const id = Date.now();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 3000);
	}

	let { data }: { data: PageData } = $props();
	let banners: Banner[] = $state(data.banners || []);

	// ── Filters (plain $state, NOT called as functions) ──────────────────────
	let searchQuery = $state('');
	let filterStatus = $state('all');
	let filterMainCategory = $state('all');
	let sortBy = $state('created_at');

	let isLoading = $state(false);

	const isFiltered = $derived(
		searchQuery !== '' || filterStatus !== 'all' || filterMainCategory !== 'all'
	);
	// Filter and sort banners
	let filteredBanners = $derived(
		[...banners].sort((a, b) => {
			switch (sortBy) {
				case 'created_at':
					return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
				case 'title':
					return (a.title || '').localeCompare(b.title || '');
				default:
					return 0;
			}
		})
	);

	async function deleteBanner(id: number) {
		if (!confirm('Are you sure you want to delete this banner? This action cannot be undone.')) {
			return;
		}

		isLoading = true;

		try {
			const formData = new FormData();
			formData.append('id', id.toString());

			const response = await fetch('?/deleteBanner', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				banners = banners.filter((b) => b.id !== id);
				addToast('Banner deleted successfully', 'success');
			} else {
				const data = await response.json();
				alert(`Failed to delete banner: ${data.message || 'Unknown error'}`);
			}
		} catch (error) {
			alert(`Error deleting banner: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			isLoading = false;
		}
	}

	async function toggleStatus(id: number) {
		const banner = banners.find((b) => b.id === id);
		if (!banner) return;

		isLoading = true;
		try {
			const formData = new FormData();
			formData.append('id', id.toString());
			formData.append('is_active', (!banner.is_active).toString());

			const response = await fetch('?/toggleStatus', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				banner.is_active = !banner.is_active;
				banners = banners;
			} else {
				const error = await response.text();
				alert('Failed to update status');
			}
		} catch (error) {
			alert('Error updating status');
		} finally {
			isLoading = false;
		}
	}

	function formatDate(dateString: string | undefined) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="rounded-lg bg-white p-6 shadow-md dark:bg-base-100">
	<div class="mb-6 flex items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">Banners</h1>
			<p class="text-sm text-base-content/60">Manage promotional banners</p>
		</div>
		{#if hasPermission('add_banner')}
			<a
				href={base + '/banners/create'}
				class="btn flex-nowrap gap-2 border-base-content bg-base-content text-base-100 transition-shadow btn-sm hover:border-base-content hover:bg-base-content/90 hover:shadow-lg"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Create Banner
			</a>
		{/if}
	</div>

	<form class="" onsubmit={(e) => e.preventDefault()}>
		<div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
			<!-- Search -->
			<div class="form-control md:col-span-2">
				<label class="label pb-1" for="search">
					<span class="label-text text-xs font-semibold tracking-wide uppercase">Search</span>
				</label>
				<input
					id="search"
					type="text"
					placeholder="Name or slug…"
					class="input-bordered input input-sm w-full"
					bind:value={searchQuery}
				/>
			</div>

			<!-- Status filter -->
			<div class="form-control">
				<label class="label pb-1" for="status">
					<span class="label-text text-xs font-semibold tracking-wide uppercase">Placment</span>
				</label>
				<select id="status" class="select-bordered select w-full select-sm">
					<option value="all">Placment</option>
					<option value="hero">Hero</option>
					<option value="promo">Promo</option>
				</select>
			</div>

			<div class="form-control">
				<label class="label pb-1" for="status">
					<span class="label-text text-xs font-semibold tracking-wide uppercase">Status</span>
				</label>
				<select
					id="status"
					class="select-bordered select w-full select-sm"
					bind:value={filterStatus}
				>
					<option value="all">All Status</option>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
				</select>
			</div>

			<!-- Sort -->
			<div class="form-control">
				<label class="label pb-1" for="sort">
					<span class="label-text text-xs font-semibold tracking-wide uppercase">Sort by</span>
				</label>
				<select class="select-bordered select w-full select-sm" id="sort" bind:value={sortBy}>
					<option value="created">Recently Created</option>
					<option value="name">Name (A–Z)</option>
					<option value="products">Most Products</option>
				</select>
			</div>
		</div>

		<!-- Active filter chips + clear button -->
		{#if isFiltered}
			<div class="mt-3 flex flex-wrap items-center gap-2">
				<span class="text-xs text-base-content/50">Active filters:</span>
				{#if searchQuery}
					<span class="badge gap-1 badge-outline badge-sm">
						"{searchQuery}"
						<button type="button" onclick={() => (searchQuery = '')} class="ml-1 font-bold"
							>×</button
						>
					</span>
				{/if}
				{#if filterStatus !== 'all'}
					<span class="badge gap-1 badge-outline badge-sm">
						{filterStatus}
						<button type="button" onclick={() => (filterStatus = 'all')} class="ml-1 font-bold"
							>×</button
						>
					</span>
				{/if}
				{#if filterMainCategory !== 'all'}
					<span class="badge gap-1 badge-outline badge-sm">
						{mainCategories.find((c: any) => String(c.id) === filterMainCategory)?.name ??
							filterMainCategory}
						<button
							type="button"
							onclick={() => (filterMainCategory = 'all')}
							class="ml-1 font-bold">×</button
						>
					</span>
				{/if}
				<button type="button" onclick={clearFilters} class="btn text-error btn-ghost btn-xs">
					Clear all
				</button>
			</div>
		{/if}
	</form>

	<div class="mt-6 rounded-lg border border-base-200">
		{#if filteredBanners && filteredBanners.length > 0}
			<div class="overflow-hidden shadow-sm">
				<table class="table-compact table w-full">
					<thead>
						<tr>
							<th class="text-left">Banner</th>
							<th class="text-left">Title</th>
							<th class="text-left">Primary Text</th>
							<th class="text-left">Secondary Text</th>
							<th class="text-center">Status</th>
							<th class="text-left">Created</th>
							<th class="text-center">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredBanners as banner (banner.id)}
							<tr>
								<!-- Banner Info -->
								<td>
									<div class="flex items-center gap-3">
										<div
											class="flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg bg-base-200"
										>
											{#if banner.image}
												<img
													src={getImageUrl(banner.image)}
													alt={banner.title}
													class="h-full w-full object-cover"
												/>
											{:else}
												<svg
													class="h-6 w-6 text-base-content/40"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
													/>
												</svg>
											{/if}
										</div>
									</div>
								</td>
								<td>
									{banner.title || '—'}
								</td>
								<!-- Primary Text -->
								<td>
									{banner.primary_text || '—'}
								</td>

								<!-- Secondary Text -->
								<td>
									{banner.secondary_text || '—'}
								</td>

								<!-- Status -->
								<td class="text-center">
									<span class="badge badge-sm {banner.is_active ? 'badge-success' : 'badge-gray'}">
										{banner.is_active ? 'Active' : 'Inactive'}
									</span>
								</td>

								<!-- Created Date -->
								<td class="text-sm">
									{formatDate(banner.created_at)}
								</td>

								<!-- Actions -->
								<td class="text-center">
									<div class="flex justify-center gap-2">
										<!-- <button
											onclick={() => toggleStatus(banner.id)}
											disabled={isLoading}
											class="btn btn-square btn-xs btn-warning {isLoading ? 'loading' : ''}"
											title={banner.is_active ? 'Deactivate banner' : 'Activate banner'}
											aria-label={banner.is_active ? 'Deactivate banner' : 'Activate banner'}
										>
											{#if banner.is_active}
												<svg class="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 20 20">
													<path
														fill-rule="evenodd"
														d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														clip-rule="evenodd"
													/>
												</svg>
											{:else}
												<svg
													class="h-4 w-4 text-base-content/40"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											{/if}
										</button> -->
										{#if hasPermission('change_banner')}
											<a
												href={base + `/banners/${banner.id}/edit`}
												class="btn btn-square btn-xs btn-info"
												title="Edit banner"
												aria-label="Edit banner"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</a>
										{/if}

										{#if hasPermission('delete_banner')}
											<button
												onclick={() => deleteBanner(banner.id)}
												disabled={isLoading}
												class="btn btn-square btn-xs btn-error text-white{isLoading ? 'loading' : ''}"
												title="Delete banner"
												aria-label="Delete banner"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
<!-- Toast Notifications -->
<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
	{#each toasts as t (t.id)}
		<div
			class="animate-in fade-in slide-in-from-top-2 max-w-xs rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg"
			style="background: {t.type === 'success'
				? 'linear-gradient(90deg, #16a34a, #059669)'
				: t.type === 'error'
					? 'linear-gradient(90deg, #dc2626, #b91c1c)'
					: 'linear-gradient(90deg, #3b82f6, #2563eb)'}"
		>
			<div class="flex items-center gap-2">
				{#if t.type === 'success'}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else if t.type === 'error'}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
				{t.message}
			</div>
		</div>
	{/each}
</div>
