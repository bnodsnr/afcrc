<script lang="ts">
	import { base } from '$lib/admin/paths';
	import { getImageUrl } from '$lib/admin/utils/image';

	interface Menu {
		id: number;
		name: string;
		url: string;
		slug: string;
		position: string;
		is_parent: boolean;
		is_component: boolean;
		component_name: string;
		parent: number | null;
		featured_image: string | null;
		page_content: string;
		order: number;
		is_active: boolean;
		created_at: string;
		updated_at: string;
		children?: Menu[];
	}

	let { data } = $props();
	let menus = $state<Menu[]>(data.menus || []);
	let isLoading = $state(false);
	let searchQuery = $state('');
	let filterPosition = $state('all');

	let toasts = $state<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

	function addToast(message: string, type: 'success' | 'error' = 'info') {
		const id = Date.now();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 3000);
	}

	let filteredMenus = $derived(
		menus.filter((m) => {
			const matchesSearch =
				searchQuery === '' || m.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesPosition = filterPosition === 'all' || m.position === filterPosition;
			return matchesSearch && matchesPosition;
		})
	);

	async function deleteMenu(id: number) {
		if (
			!confirm('Are you sure you want to delete this menu? This will also delete all sub-menus.')
		) {
			return;
		}
		isLoading = true;
		try {
			const formData = new FormData();
			formData.append('id', id.toString());
			const response = await fetch('?/deleteMenu', {
				method: 'POST',
				body: formData
			});
			if (response.ok) {
				menus = menus.filter((m) => m.id !== id);
				addToast('Menu deleted successfully', 'success');
			} else {
				addToast('Failed to delete menu', 'error');
			}
		} catch (error) {
			addToast('Error deleting menu', 'error');
		} finally {
			isLoading = false;
		}
	}

	function formatDate(dateString: string) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getPositionBadgeClass(position: string) {
		switch (position) {
			case 'header':
				return 'badge-primary';
			case 'footer':
				return 'badge-secondary';
			case 'sidebar':
				return 'badge-accent';
			default:
				return 'badge-ghost';
		}
	}
</script>

<div class="rounded-lg bg-white p-6 shadow-md dark:bg-base-100">
	<div class="mb-6 flex items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">Menus</h1>
			<p class="text-sm text-base-content/60">Manage dynamic navigation menus</p>
		</div>
		<a
			href={base + '/menus/create'}
			class="btn gap-2 border-base-content bg-base-content text-base-100 btn-sm hover:border-base-content hover:bg-base-content/90"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Menu
		</a>
	</div>

	<!-- Filters -->
	<div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
		<div class="form-control md:col-span-2">
			<label class="label pb-1" for="search">
				<span class="label-text text-xs font-semibold tracking-wide uppercase">Search</span>
			</label>
			<input
				id="search"
				type="text"
				placeholder="Search menus..."
				class="input-bordered input input-sm w-full"
				bind:value={searchQuery}
			/>
		</div>
		<div class="form-control">
			<label class="label pb-1" for="position-filter">
				<span class="label-text text-xs font-semibold tracking-wide uppercase">Position</span>
			</label>
			<select
				id="position-filter"
				class="select-bordered select w-full select-sm"
				bind:value={filterPosition}
			>
				<option value="all">All Positions</option>
				<option value="none">None</option>
				<option value="header">Header</option>
				<option value="footer">Footer</option>
				<option value="sidebar">Sidebar</option>
			</select>
		</div>
	</div>

	<!-- Menu Table -->
	<div class="mt-6 rounded-lg border border-base-200">
		{#if filteredMenus.length > 0}
			<div class="overflow-x-auto">
				<table class="table-compact table w-full">
					<thead>
						<tr>
							<th class="text-left">Name</th>
							<th class="text-center">Image</th>
							<th class="text-left">URL</th>
							<th class="text-center">Position</th>
							<th class="text-center">Type</th>
							<th class="text-center">Component</th>
							<th class="text-center">Sub-items</th>
							<th class="text-center">Status</th>
							<th class="text-left">Order</th>
							<th class="text-center">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredMenus as menu (menu.id)}
							<tr>
								<td>
									<div class="flex items-center gap-3">
										<div>
											<p class="font-medium">{menu.name}</p>
											{#if menu.slug}
												<p class="text-xs text-base-content/50">/{menu.slug}</p>
											{/if}
										</div>
									</div>
								</td>
								<td class="text-center">
									{#if menu.featured_image}
										<div class="inline-flex">
											<img
												src={getImageUrl(menu.featured_image)}
												alt={menu.name}
												class="h-10 w-10 rounded-lg object-cover"
											/>
										</div>
									{:else}
										<span class="text-base-content/40">—</span>
									{/if}
								</td>
								<td>
									{#if menu.url}
										<span class="block max-w-[200px] truncate text-sm text-base-content/70"
											>{menu.url}</span
										>
									{:else}
										<span class="text-base-content/40">—</span>
									{/if}
								</td>
								<td class="text-center">
									<span class="badge badge-sm {getPositionBadgeClass(menu.position)}"
										>{menu.position}</span
									>
								</td>
								<td class="text-center">
									<span class="badge badge-sm {menu.is_parent ? 'badge-info' : 'badge-warning'}">
										{menu.is_parent ? 'Parent' : 'Sub-item'}
									</span>
								</td>
								<td class="text-center">
									{#if menu.is_component}
										<span class="badge badge-sm badge-accent">
											{menu.component_name || 'Yes'}
										</span>
									{:else}
										<span class="text-base-content/40">—</span>
									{/if}
								</td>
								<td class="text-center">
									{#if menu.children && menu.children.length > 0}
										<span class="badge badge-outline badge-sm">{menu.children.length}</span>
									{:else}
										<span class="text-base-content/40">0</span>
									{/if}
								</td>
								<td class="text-center">
									<span class="badge badge-sm {menu.is_active ? 'badge-success' : 'badge-gray'}">
										{menu.is_active ? 'Active' : 'Inactive'}
									</span>
								</td>
								<td class="text-center">{menu.order}</td>
								<td class="text-center">
									<div class="flex justify-center gap-2">
										<a
											href={base + `/menus/${menu.id}/edit`}
											class="btn btn-square btn-xs btn-info"
											title="Edit menu"
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
										<button
											class="btn btn-square text-white btn-xs btn-error"
											title="Delete menu"
											onclick={() => deleteMenu(menu.id)}
											disabled={isLoading}
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
							{#if menu.children && menu.children.length > 0}
								{#each menu.children as child}
									<tr class="bg-base-200/30">
										<td>
											<div class="flex items-center gap-3 pl-8">
												<span class="text-base-content/40">└</span>
												<div>
													<p class="text-sm font-medium">{child.name}</p>
													{#if child.url}
														<p class="text-xs text-base-content/50">{child.url}</p>
													{/if}
												</div>
											</div>
										</td>
										<td class="text-center">
											{#if child.featured_image}
												<div class="inline-flex">
													<img
														src={getImageUrl(child.featured_image)}
														alt={child.name}
														class="h-8 w-8 rounded object-cover"
													/>
												</div>
											{:else}
												<span class="text-base-content/40">—</span>
											{/if}
										</td>
										<td>
											{#if child.url}
												<span class="block max-w-[200px] truncate text-xs text-base-content/70"
													>{child.url}</span
												>
											{:else}
												<span class="text-base-content/40">—</span>
											{/if}
										</td>
										<td class="text-center">
											<span class="badge badge-xs {getPositionBadgeClass(child.position)}"
												>{child.position}</span
											>
										</td>
										<td class="text-center">
											<span class="badge badge-xs badge-warning">Sub-item</span>
										</td>
										<td class="text-center">
											{#if child.is_component}
												<span class="badge badge-xs badge-accent">
													{child.component_name || 'Yes'}
												</span>
											{:else}
												<span class="text-base-content/40">—</span>
											{/if}
										</td>
										<td class="text-center">
											{#if child.children && child.children.length > 0}
												<span class="badge badge-outline badge-xs">{child.children.length}</span>
											{:else}
												<span class="text-base-content/40">0</span>
											{/if}
										</td>
										<td class="text-center">
											<span
												class="badge badge-xs {child.is_active ? 'badge-success' : 'badge-gray'}"
											>
												{child.is_active ? 'Active' : 'Inactive'}
											</span>
										</td>
										<td class="text-center">{child.order}</td>
										<td class="text-center">
											<div class="flex justify-center gap-1">
												<a
													href={base + `/menus/${child.id}/edit`}
													class="btn btn-square btn-xs btn-info"
													title="Edit"
												>
													<svg
														class="h-3 w-3"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
												</a>
												<button
													class="btn btn-square text-white btn-xs btn-error"
													title="Delete"
													onclick={() => deleteMenu(child.id)}
												>
													<svg
														class="h-3 w-3"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
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
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-12">
				<svg
					class="mb-4 h-12 w-12 text-base-content/30"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
				<p class="text-base-content/50">No menus found</p>
				<a href={base + '/menus/create'} class="btn mt-2 btn-link btn-sm">Create your first menu</a>
			</div>
		{/if}
	</div>
</div>

<!-- Toast Notifications -->
<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
	{#each toasts as t (t.id)}
		<div
			class="max-w-xs rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg"
			style="background: {t.type === 'success'
				? 'linear-gradient(90deg, #16a34a, #059669)'
				: 'linear-gradient(90deg, #dc2626, #b91c1c)'}"
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
				{:else}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
				{t.message}
			</div>
		</div>
	{/each}
</div>
