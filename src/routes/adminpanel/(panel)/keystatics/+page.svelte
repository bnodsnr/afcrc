<script lang="ts">
	import { enhance } from '$app/forms';

	interface KeyStat {
		id: number;
		slogan:string;
		title: string;
		seo_slug?: string;
		count_number: string;
		status: boolean;
		created_at?: string;
	}

	interface FormState {
		slogan: string;
		title: string;
		count_number: string | string;
		status: boolean;
	}

	interface Toast {
		id: number;
		message: string;
		type: 'success' | 'error' | 'info';
	}

	let { data } = $props();

	let keystats = $state<KeyStat[]>(Array.isArray(data?.keystats) ? data.keystats : []);

	// ── Filters ──────────────────────────────────────────────────────────────
	let searchQuery = $state('');
	let filterStatus = $state('all');
	let sortBy = $state('created');

	const isFiltered = $derived(searchQuery !== '' || filterStatus !== 'all');

	const filteredKeystats = $derived(
		keystats
			.filter((ks) => {
				const q = searchQuery.toLowerCase();
				const matchesSearch = ks.title.toLowerCase().includes(q) || (ks.seo_slug ?? '').toLowerCase().includes(q);
				const matchesStatus =
					filterStatus === 'all' ||
					(filterStatus === 'active' ? ks.status === true : ks.status === false);
				
				return matchesSearch && matchesStatus;
			})
			.sort((a, b) => {
				if (sortBy === 'title') return a.title.localeCompare(b.title);
				if (sortBy === 'count') return b.count_number - a.count_number;
				return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
			})
	);

	// ── Dialog / form ────────────────────────────────────────────────────────
	let showDialog = $state(false);
	let isEditMode = $state(false);
	let editingId = $state<number | null>(null);

	let formData = $state<FormState>({
		slogan: '',
		title: '',
		count_number: '',
		status: true
	});

	function openCreateDialog() {
		isEditMode = false;
		editingId = null;
		resetForm();
		showDialog = true;
	}

	function openEditDialog(ks: KeyStat) {
		isEditMode = true;
		editingId = ks.id;
		formData = {
			slogan: ks.slogan,
			title: ks.title,
			count_number: ks.count_number,
			status: ks.status
		};
		showDialog = true;
	}

	function closeDialog() {
		showDialog = false;
		isEditMode = false;
		editingId = null;
		resetForm();
	}

	function resetForm() {
		formData = {
			slogan: '',
			title: '',
			count_number: '',
			status: true
		};
	}

	// ── Toast ────────────────────────────────────────────────────────────────
	let toasts = $state<Toast[]>([]);

	function addToast(message: string, type: Toast['type'] = 'info') {
		const id = Date.now();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 3000);
	}

	// ── Enhance handlers ─────────────────────────────────────────────────────
	function handleSave() {
		return async () => {
			return async ({ result, update }: any) => {
				if (result.type === 'success') {
				const raw = result.data?.keystat ?? result.data?.data;
				if (raw && raw.id) {
					if (isEditMode && editingId) {
						keystats = keystats.map((k) => (k.id === editingId ? { ...k, ...raw } : k));
						addToast('Key statistic updated successfully!', 'success');
					} else {
						keystats = [{ ...raw }, ...keystats];
						addToast('Key statistic created successfully!', 'success');
					}
				} else {
					addToast(result.data?.message ?? 'Saved successfully', 'info');
				}
				showDialog = false;
				isEditMode = false;
				editingId = null;
				resetForm();
			} else if (result.type === 'failure') {
				addToast(
					result.data?.error ?? (isEditMode ? 'Failed to update' : 'Failed to create'),
					'error'
				);
				await update({ reset: false });
			} else {
				await update({ reset: false });
				}
			};
		};
	}

	function handleToggle() {
		return async () => {
			return async ({ result, update }: any) => {
				if (result.type === 'success') {
					const raw = result.data?.keystat ?? result.data?.data;
					if (raw && raw.id) {
						keystats = keystats.map((k) => (k.id === raw.id ? { ...k, ...raw } : k));
					}
					addToast(result.data?.message ?? 'Status updated', 'success');
				} else {
					addToast(result.data?.error ?? 'Failed to update status', 'error');
					await update({ reset: false });
				}
			};
		};
	}

	async function deleteKeystat(id: number) {
		if (!confirm('Are you sure you want to delete this key statistic?')) return;
		const formData = new FormData();
		formData.append('id', id.toString());
		try {
			const res = await fetch('?/delete', { method: 'POST', body: formData });
			const result = await res.json();
			if (result.type === 'success') {
				keystats = keystats.filter((k) => k.id !== id);
				addToast(result.data?.message ?? 'Deleted successfully', 'success');
			} else {
				addToast(result.data?.error ?? 'Failed to delete', 'error');
			}
		} catch {
			addToast('Something went wrong', 'error');
		}
	}

	// ── Helpers ──────────────────────────────────────────────────────────────
	
	function formatDate(dateString: string | undefined) {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function clearFilters() {
		searchQuery = '';
		filterStatus = 'all';
		sortBy = 'created';
	}
</script>

<!-- Toast notifications -->
<div class="toast-top toast-end toast z-50">
	{#each toasts as toast (toast.id)}
		<div
			class="alert {toast.type === 'success'
				? 'alert-success'
				: toast.type === 'error'
					? 'alert-error'
					: 'alert-info'}"
		>
			<span>{toast.message}</span>
		</div>
	{/each}
</div>

<div class="min-h-screen">
	<div class="mx-auto">
		<!-- Breadcrumb -->
		<div class="mb-6 flex items-center gap-2 text-sm">
			<a href={'/adminpanel'} class="link font-medium text-primary link-hover">Dashboard</a>
			<svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<a href={'/adminpanel' + '/categories'} class="link font-medium text-primary link-hover">Categories</a>
			<svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Key Statistics</span>
		</div>

		<!-- Header -->
		<div class="mb-4 rounded-lg">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Key Statistics</h1>
					<p class="text-sm">{keystats.length} total · {filteredKeystats.length} shown</p>
				</div>
				<button onclick={openCreateDialog} class="btn-default btn gap-2 shadow-md btn-sm hover:shadow-lg">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Add Key Statistic
				</button>
			</div>
		</div>

		<!-- Filters -->
		<form class="mb-4 rounded-lg" onsubmit={(e) => e.preventDefault()}>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-5">
				<div class="form-control md:col-span-2">
					<label class="label pb-1">
						<span class="label-text text-xs font-semibold tracking-wide uppercase">Search</span>
					</label>
					<input
						type="text"
						placeholder="Title or slug…"
						class="input-bordered input input-sm w-full"
						bind:value={searchQuery}
					/>
				</div>

			

				<div class="form-control">
					<label class="label pb-1">
						<span class="label-text text-xs font-semibold tracking-wide uppercase">Status</span>
					</label>
					<select class="select-bordered select w-full select-sm" bind:value={filterStatus}>
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>

				<div class="form-control">
					<label class="label pb-1">
						<span class="label-text text-xs font-semibold tracking-wide uppercase">Sort by</span>
					</label>
					<select class="select-bordered select w-full select-sm" bind:value={sortBy}>
						<option value="created">Recently Created</option>
						<option value="title">Title (A–Z)</option>
						<option value="count">Highest Count</option>
					</select>
				</div>
			</div>

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
					
					<button type="button" onclick={clearFilters} class="btn text-error btn-ghost btn-xs">
						Clear all
					</button>
				</div>
			{/if}
		</form>

		<!-- Table -->
		<div class="overflow-hidden rounded-lg bg-base-100 shadow-sm">
			{#if filteredKeystats.length > 0}
				<div class="overflow-x-auto">
					<table class="table w-full table-zebra">
						<thead class="bg-base-200">
							<tr>
								<th class="text-left">Statistic</th>
								<th class="text-left">Slogan</th>
								<th class="text-center">Count</th>
								<th class="text-center">Status</th>
								<th class="text-left">Created</th>
								<th class="text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredKeystats as ks (ks.id)}
								<tr>
									<td>
										<div>
											<p class="font-medium text-base-content">{ks.title}</p>
											<p class="text-xs text-base-content/50">{ks.seo_slug ?? '—'}</p>
										</div>
									</td>

									<td><span>{ks.slogan}</span></td>

									<td class="text-center">
										<span class="badge badge-outline badge-sm">{ks.count_number}</span>
									</td>

									<td class="text-center">
										<span class="badge badge-sm {ks.status ? 'badge-success' : 'badge-ghost'}">
											{ks.status ? 'Active' : 'Inactive'}
										</span>
									</td>

									<td class="text-sm whitespace-nowrap text-base-content/70">
										{formatDate(ks.created_at)}
									</td>

									<td class="text-center">
										<div class="flex justify-center gap-1">
											<form
												method="POST"
												action="?/toggleStatus"
												use:enhance={handleToggle()}
												class="inline"
											>
												<input type="hidden" name="id" value={ks.id} />
												<input type="hidden" name="status" value={String(ks.status)} />
												<button
													type="submit"
													class="tooltip btn btn-square btn-xs btn-warning"
													data-tip={ks.status ? 'Deactivate' : 'Activate'}
												>
													{#if ks.status}
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
												</button>
											</form>

											<button
												type="button"
												onclick={() => openEditDialog(ks)}
												class="tooltip btn btn-square btn-xs btn-info"
												data-tip="Edit"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</button>

											<button
											type="button"
											onclick={() => deleteKeystat(ks.id)}
											class="tooltip btn btn-square text-white btn-xs btn-error"
											data-tip="Delete"
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
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="border-t border-base-300 px-4 py-3">
					<p class="text-sm text-base-content/60">
						Showing <strong>{filteredKeystats.length}</strong> of
						<strong>{keystats.length}</strong> key statistics
					</p>
				</div>
			{:else}
				<div class="p-12 text-center">
					<svg
						class="mx-auto mb-4 h-12 w-12 text-base-content/30"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
					<h3 class="mb-1 text-lg font-semibold">No key statistics found</h3>
					<p class="mb-4 text-sm text-base-content/60">
						{#if isFiltered}
							Try adjusting your filters or search terms.
						{:else}
							Start by adding your first key statistic.
						{/if}
					</p>
					{#if isFiltered}
						<button type="button" onclick={clearFilters} class="btn mr-2 btn-outline btn-sm">
							Clear Filters
						</button>
					{/if}
					<button type="button" onclick={openCreateDialog} class="btn gap-2 btn-sm btn-primary">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Add Key Statistic
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Create / Edit Modal -->
{#if showDialog}
	<div class="modal-open modal">
		<form
			action={isEditMode ? `?/update&id=${editingId}` : '?/create'}
			method="POST"
			class="modal-box w-full max-w-lg space-y-4"
			use:enhance={handleSave()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-bold">{isEditMode ? 'Edit Key Statistic' : 'Add New Key Statistic'}</h3>
				<button type="button" onclick={closeDialog} class="btn btn-circle btn-ghost btn-sm"
					>✕</button
				>
			</div>

			<div class="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
				<!-- Slogan -->
				<div class="form-control">
					<label class="label" for="ks-slogan">
						<span class="label-text font-medium">Slogan</span>
					</label>
					<input
						id="ks-slogan"
						type="text"
						name="slogan"
						placeholder="e.g. Reaching new milestones daily"
						class="input-bordered input w-full"
						bind:value={formData.slogan}
					/>
				</div>

				<!-- Title -->
				<div class="form-control">
					<label class="label" for="ks-title">
						<span class="label-text font-medium">Title *</span>
					</label>
					<input
						id="ks-title"
						type="text"
						name="title"
						placeholder="e.g. Total Completed Projects"
						class="input-bordered input w-full"
						bind:value={formData.title}
						required
					/>
				</div>

				<!-- Count Number -->
				<div class="form-control">
					<label class="label" for="ks-count">
						<span class="label-text font-medium">Count Number *</span>
					</label>
					<input
						id="ks-count"
						type="text"
						name="count_number"
						min="0"
						step="1"
						placeholder="e.g. 250"
						class="input-bordered input w-full"
						bind:value={formData.count_number}
						required
					/>
				</div>

				<!-- Status toggle -->
				<input type="hidden" name="status" value={formData.status ? 'true' : 'false'} />
				<div class="form-control">
					<label class="label cursor-pointer" for="ks-status">
						<span class="label-text font-medium">Active</span>
						<input
							id="ks-status"
							type="checkbox"
							class="toggle toggle-primary"
							bind:checked={formData.status}
						/>
					</label>
				</div>
			</div>

			<div class="modal-action mt-6">
				<button type="button" onclick={closeDialog} class="btn btn-ghost">Cancel</button>
				<button type="submit" class="btn gap-2 btn-primary">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					{isEditMode ? 'Update Key Statistic' : 'Add Key Statistic'}
				</button>
			</div>
		</form>
		<div class="modal-backdrop" onclick={closeDialog}></div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: -1;
	}
</style>