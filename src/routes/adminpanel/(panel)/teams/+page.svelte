<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	interface Team {
		id: number;
		name: string;
		qualification: string | null;
		position: string | null;
		description: string | null;
		image: string | null;
		is_active: boolean;
		created_at: string;
	}

	interface Toast {
		id: number;
		message: string;
		type: 'success' | 'error' | 'info';
	}

	let { data } = $props();
	const token = data.apiToken;

	let teams = $state<Team[]>(data?.teams ?? []);
	let totalItems = $state(data?.teamsCount ?? 0);
	let toasts = $state<Toast[]>([]);
	let searchQuery = $state('');
	let filterStatus = $state('all');
	let sortBy = $state('default');
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	function addToast(message: string, type: Toast['type'] = 'info') {
		const id = Date.now();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => (toasts = toasts.filter((t) => t.id !== id)), 3000);
	}

	async function fetchTeams(page = 1) {
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/teams/`, {
				headers: {
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` })
				}
			});
			if (!res.ok) throw new Error();
			const payload = await res.json();
			teams = payload.data ?? [];
			totalItems = payload.data?.length ?? 0;
			currentPage = page;
		} catch {
			console.error('Failed to load teams');
		}
	}

	async function deleteTeam(id: number) {
		if (!confirm('Are you sure you want to delete this team member?')) return;
		try {
			const formData = new FormData();
			formData.append('id', id.toString());
			const res = await fetch(`?/deleteTeam`, { method: 'POST', body: formData });
			const result = await res.json();
			if (result.type === 'success') {
				teams = teams.filter((t) => t.id !== id);
				totalItems -= 1;
				addToast('Team member deleted successfully', 'success');
			} else {
				addToast(result.data?.message || 'Failed to delete team member', 'error');
			}
		} catch {
			addToast('Something went wrong', 'error');
		}
	}

	let processedTeams = $derived.by(() => {
		let list = [...teams];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(t) =>
					t.name.toLowerCase().includes(q) ||
					(t.position ?? '').toLowerCase().includes(q) ||
					(t.qualification ?? '').toLowerCase().includes(q)
			);
		}

		if (filterStatus !== 'all') {
			list = list.filter((t) => t.is_active === (filterStatus === 'active'));
		}

		if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
		else if (sortBy === 'date') list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

		return list;
	});

	let totalPages = $derived(Math.max(1, Math.ceil(totalItems / itemsPerPage)));
	let startItem = $derived(totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1);
	let endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

	$effect(() => {
		currentPage = Math.min(Math.max(1, currentPage), totalPages);
	});

	function getPaginationRange(): (number | string)[] {
		const maxPages = 5;
		const half = Math.floor(maxPages / 2);
		let start = Math.max(1, currentPage - half);
		let end = Math.min(totalPages, start + maxPages - 1);
		start = Math.max(1, end - maxPages + 1);

		const pages: (number | string)[] = [];
		if (start > 1) {
			pages.push(1);
			if (start > 2) pages.push('...');
		}
		for (let i = start; i <= end; i++) pages.push(i);
		if (end < totalPages) {
			if (end < totalPages - 1) pages.push('...');
			pages.push(totalPages);
		}
		return pages;
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) currentPage = page;
	}

	const truncate = (s: string, max = 60) => (s.length <= max ? s : s.slice(0, max) + '...');

	onMount(() => {
		if (!teams.length) fetchTeams(1);
	});
</script>

<div class="min-h-screen">
	<div class="mx-auto">
		<!-- Breadcrumb Navigation -->
		<div class="mb-6 flex items-center gap-2 text-sm">
			<a href={base} class="link font-medium text-primary link-hover">Dashboard</a>
			<svg
				class="h-4 w-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">All Teams</span>
		</div>

		<!-- Header -->
		<div class="mb-6 rounded-lg">
			<div class="mb-4 flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Teams</h1>
					<p class="text-sm">Manage your team members</p>
				</div>
				<a
					class="btn btn-sm btn-info flex-nowrap gap-2 text-white shadow-md transition-shadow hover:shadow-lg"
					href={base + '/teams/create'}
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Create Team Member
				</a>
			</div>
		</div>

		<!-- Filters -->
		<form class="mb-4 rounded-lg" onsubmit={(e) => e.preventDefault()}>
			<div class="grid grid-cols-1 gap-2 md:grid-cols-4">
				<div class="form-control md:col-span-2">
					<input
						type="text"
						placeholder="Search by name, position, qualification..."
						class="input-bordered input input-md w-full text-base-content placeholder-base-content/50"
						bind:value={searchQuery}
					/>
				</div>

				<div class="form-control">
					<select
						class="select-bordered select w-full select-md text-base-content"
						bind:value={filterStatus}
					>
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>

				<div class="form-control">
					<select
						class="select-bordered select w-full select-md text-base-content"
						bind:value={sortBy}
					>
						<option value="default">Default</option>
						<option value="name">Name (A-Z)</option>
						<option value="date">Newest First</option>
					</select>
				</div>
			</div>
		</form>

		<!-- Teams Table -->
		<div class="overflow-hidden rounded-lg bg-base-100 shadow-sm">
			{#if processedTeams.length > 0}
				<div class="overflow-x-auto">
					<table class="table">
						<thead class="bg-base-200">
							<tr>
								<th>Member</th>
								<th>Position</th>
								<th>Qualification</th>
								<th>Description</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each processedTeams as team (team.id)}
								<tr class="transition-colors hover:bg-base-200">
									<td>
										<div class="flex items-center gap-3">
											<div
												class="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-200"
											>
												{#if team.image}
													<img
														src={team.image}
														alt={team.name}
														class="h-full w-full rounded-full object-cover"
													/>
												{:else}
													<span class="font-medium text-base-content/60">
														{team.name.slice(0, 1).toUpperCase()}
													</span>
												{/if}
											</div>
											<div>
												<p class="line-clamp-1 font-medium text-base-content">{team.name}</p>
												<p class="text-xs text-base-content/60">ID: {team.id}</p>
											</div>
										</div>
									</td>

									<td>
										<p class="text-sm text-base-content/70">{team.position || '—'}</p>
									</td>

									<td>
										<p class="text-sm text-base-content/70">{team.qualification || '—'}</p>
									</td>

									<td>
										<p class="line-clamp-1 text-sm text-base-content/70">
											{truncate(team.description || '')}
										</p>
									</td>

									<td>
										{#if team.is_active}
											<span class="badge badge-sm badge-success">Active</span>
										{:else}
											<span class="badge badge-sm badge-gray">Inactive</span>
										{/if}
									</td>

									<td>
										<div class="flex items-center gap-1">
											<a
												href={base + '/teams/edit/' + team.id}
												title="Edit team member"
												aria-label={`Edit ${team.name}`}
												class="btn btn-ghost btn-xs"
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
												onclick={() => deleteTeam(team.id)}
												title="Delete team member"
												aria-label={`Delete ${team.name}`}
												class="btn btn-ghost btn-xs text-error"
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

				<!-- Pagination -->
				<div class="border-t border-base-300 p-4">
					<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
						<p class="text-sm text-base-content/60">
							Showing <span class="font-semibold">{startItem}</span> to
							<span class="font-semibold">{endItem}</span> of
							<span class="font-semibold">{totalItems}</span> team members
						</p>

						<div class="flex items-center gap-2">
							<label for="itemsPerPage" class="text-sm text-base-content/60">Items per page:</label>
							<select
								id="itemsPerPage"
								class="select-bordered select w-20 select-sm"
								bind:value={itemsPerPage}
								onchange={(e) => {
									itemsPerPage = parseInt(e.currentTarget.value);
									currentPage = 1;
								}}
							>
								<option value={5}>5</option>
								<option value={10}>10</option>
								<option value={15}>15</option>
								<option value={20}>20</option>
								<option value={25}>25</option>
								<option value={50}>50</option>
							</select>
						</div>

						<div class="flex flex-wrap items-center gap-2">
							<button
								class="btn btn-outline btn-sm"
								disabled={currentPage === 1}
								onclick={() => goToPage(currentPage - 1)}
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
								</svg>
								Previous
							</button>

							<div class="flex gap-1">
								{#each getPaginationRange() as page (page)}
									{#if page === '...'}
										<span class="px-2 py-1 text-base-content/60">...</span>
									{:else}
										<button
											class={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
											onclick={() => goToPage(page as number)}
										>
											{page}
										</button>
									{/if}
								{/each}
							</div>

							<button
								class="btn btn-outline btn-sm"
								disabled={currentPage === totalPages}
								onclick={() => goToPage(currentPage + 1)}
							>
								Next
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Filtered Empty State -->
			{#if processedTeams.length === 0 && (searchQuery || filterStatus !== 'all')}
				<div class="p-12 text-center">
					<svg
						class="mx-auto mb-4 h-12 w-12 text-base-content/40"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<h3 class="mb-1 text-lg font-semibold text-base-content">No team members found</h3>
					<p class="mb-4 text-base-content/60">Try adjusting your filters or search terms.</p>
				</div>
			{/if}

			<!-- Empty State -->
			{#if processedTeams.length === 0 && !searchQuery && filterStatus === 'all'}
				<div class="p-12 text-center">
					<svg
						class="mx-auto mb-4 h-12 w-12 text-base-content/40"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					<h3 class="mb-1 text-lg font-semibold text-base-content">No team members yet</h3>
					<p class="mb-4 text-base-content/60">Start by creating your first team member.</p>
					<a
						href={base + '/teams/create'}
						class="btn btn-primary btn-sm inline-flex items-center gap-2"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Create First Team Member
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>

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
