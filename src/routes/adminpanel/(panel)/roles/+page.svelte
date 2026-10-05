<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	interface Permission {
		id: number;
		name: string;
		codename: string;
		app_label: string;
		model_name: string;
	}

	interface Group {
		id: number;
		name: string;
		permissions: number[];
		permissions_detail: Permission[];
		permission_count: number;
	}

	interface GroupedPermission {
		app_label: string;
		model: string;
		permissions: { id: number; name: string; codename: string }[];
	}

	interface Toast {
		id: number;
		message: string;
		type: 'success' | 'error' | 'info';
	}

	let { data } = $props();

	let groups = $state<Group[]>(data?.groups ?? []);
	let groupedPermissions = $state<GroupedPermission[]>(data?.groupedPermissions ?? []);
	let flatPermissions = $state<Permission[]>(data?.flatPermissions ?? []);
	let token = $state(data?.apiToken ?? '');
	let toasts = $state<Toast[]>([]);

	let activeTab = $state<'groups' | 'permissions'>('groups');

	// Create group modal
	let showCreateModal = $state(false);
	let createForm = $state({ name: '', selectedPerms: [] as number[] });

	// Edit group modal
	let showEditModal = $state(false);
	let editingGroup = $state<Group | null>(null);
	let editForm = $state({ name: '', selectedPerms: [] as number[] });

	function addToast(message: string, type: Toast['type'] = 'info') {
		const id = Date.now();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => (toasts = toasts.filter((t) => t.id !== id)), 3000);
	}

	async function fetchGroups() {
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/groups/`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (!res.ok) return;
			const json = await res.json();
			groups = json.data ?? [];
		} catch {
			addToast('Failed to load groups', 'error');
		}
	}

	async function handleCreate() {
		if (!createForm.name.trim()) {
			addToast('Group name is required', 'error');
			return;
		}
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/groups/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ name: createForm.name.trim(), permissions: createForm.selectedPerms })
			});
			const result = await res.json();
			if (result.success) {
				addToast('Group created', 'success');
				showCreateModal = false;
				createForm = { name: '', selectedPerms: [] };
				fetchGroups();
			} else {
				addToast(Object.values(result.errors ?? {}).flat().join(', ') || 'Failed', 'error');
			}
		} catch {
			addToast('Something went wrong', 'error');
		}
	}

	function openEdit(group: Group) {
		editingGroup = group;
		editForm = { name: group.name, selectedPerms: group.permissions.map((p) => (typeof p === 'number' ? p : p)) };
		showEditModal = true;
	}

	async function handleEdit() {
		if (!editingGroup || !editForm.name.trim()) return;
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/groups/${editingGroup.id}/`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ name: editForm.name.trim(), permissions: editForm.selectedPerms })
			});
			const result = await res.json();
			if (result.success) {
				addToast('Group updated', 'success');
				showEditModal = false;
				editingGroup = null;
				fetchGroups();
			} else {
				addToast(Object.values(result.errors ?? {}).flat().join(', ') || 'Failed', 'error');
			}
		} catch {
			addToast('Something went wrong', 'error');
		}
	}

	async function deleteGroup(id: number) {
		if (!confirm('Delete this group?')) return;
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/groups/${id}/`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			});
			const result = await res.json();
			if (result.success) {
				groups = groups.filter((g) => g.id !== id);
				addToast('Group deleted', 'success');
			} else {
				addToast(result.message || 'Failed to delete', 'error');
			}
		} catch {
			addToast('Something went wrong', 'error');
		}
	}

	// Derived: all permission IDs
	let allPermIds = $derived(
		groupedPermissions.flatMap((gp) => gp.permissions.map((p) => p.id))
	);

	function modulePermIds(gp: GroupedPermission): number[] {
		return gp.permissions.map((p) => p.id);
	}

	// ── Create: select-all helpers ──
	let createAllSelected = $derived(
		allPermIds.length > 0 && allPermIds.every((id) => createForm.selectedPerms.includes(id))
	);

	function toggleCreateAll() {
		createForm.selectedPerms = createAllSelected ? [] : [...allPermIds];
	}

	function createModuleSelected(gp: GroupedPermission): boolean {
		const ids = modulePermIds(gp);
		return ids.length > 0 && ids.every((id) => createForm.selectedPerms.includes(id));
	}

	function toggleCreateModule(gp: GroupedPermission) {
		const ids = modulePermIds(gp);
		const allIn = ids.every((id) => createForm.selectedPerms.includes(id));
		createForm.selectedPerms = allIn
			? createForm.selectedPerms.filter((p) => !ids.includes(p))
			: [...createForm.selectedPerms, ...ids.filter((id) => !createForm.selectedPerms.includes(id))];
	}

	// ── Edit: select-all helpers ──
	let editAllSelected = $derived(
		allPermIds.length > 0 && allPermIds.every((id) => editForm.selectedPerms.includes(id))
	);

	function toggleEditAll() {
		editForm.selectedPerms = editAllSelected ? [] : [...allPermIds];
	}

	function editModuleSelected(gp: GroupedPermission): boolean {
		const ids = modulePermIds(gp);
		return ids.length > 0 && ids.every((id) => editForm.selectedPerms.includes(id));
	}

	function toggleEditModule(gp: GroupedPermission) {
		const ids = modulePermIds(gp);
		const allIn = ids.every((id) => editForm.selectedPerms.includes(id));
		editForm.selectedPerms = allIn
			? editForm.selectedPerms.filter((p) => !ids.includes(p))
			: [...editForm.selectedPerms, ...ids.filter((id) => !editForm.selectedPerms.includes(id))];
	}

	function toggleCreatePerm(id: number) {
		createForm.selectedPerms = createForm.selectedPerms.includes(id)
			? createForm.selectedPerms.filter((p) => p !== id)
			: [...createForm.selectedPerms, id];
	}

	function toggleEditPerm(id: number) {
		editForm.selectedPerms = editForm.selectedPerms.includes(id)
			? editForm.selectedPerms.filter((p) => p !== id)
			: [...editForm.selectedPerms, id];
	}

	onMount(() => {
		if (!groups.length) fetchGroups();
	});
</script>

<div class="min-h-screen bg-base-200">
	<div class="mx-auto p-6">
		<!-- Breadcrumb -->
		<div class="mb-6 flex items-center gap-2 text-sm">
			<a href={base} class="link link-hover text-primary font-medium">Dashboard</a>
			<svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Roles & Permissions</span>
		</div>

		<!-- Header -->
		<div class="mb-6 rounded-lg bg-gradient-to-r from-violet-700 to-violet-400 p-6 text-white shadow-lg">
			<div class="flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Roles & Permissions</h1>
					<p class="text-violet-100 text-sm">Manage permission groups and assign granular permissions</p>
				</div>
				{#if activeTab === 'groups'}
					<button
						class="btn flex-nowrap gap-2 bg-white/20 text-white shadow-md transition-all hover:bg-white/30 btn-sm"
						onclick={() => (showCreateModal = true)}
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Create Group
					</button>
				{/if}
			</div>
		</div>

		<!-- Tabs -->
		<div role="tablist" class="tabs tabs-bordered mb-6">
			<button
				role="tab"
				class="tab {activeTab === 'groups' ? 'tab-active font-semibold' : ''}"
				onclick={() => (activeTab = 'groups')}
			>
				Permission Groups
			</button>
			<button
				role="tab"
				class="tab {activeTab === 'permissions' ? 'tab-active font-semibold' : ''}"
				onclick={() => (activeTab = 'permissions')}
			>
				All Permissions
			</button>
		</div>

		<!-- Groups Tab -->
		{#if activeTab === 'groups'}
			<div class="overflow-hidden rounded-lg bg-base-100 shadow-sm">
				{#if groups.length > 0}
					<div class="overflow-x-auto">
						<table class="table">
							<thead class="bg-base-200">
								<tr>
									<th>#</th>
									<th>Group Name</th>
									<th>Permissions</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each groups as group, i (group.id)}
									<tr class="transition-colors hover:bg-base-200">
										<td class="text-sm text-base-content/60">{i + 1}</td>
										<td>
											<span class="font-medium text-base-content">{group.name}</span>
										</td>
										<td>
											{#if group.permissions_detail && group.permissions_detail.length > 0}
												<div class="flex flex-wrap gap-1">
													{#each group.permissions_detail.slice(0, 5) as perm}
														<span class="badge badge-sm badge-outline">{perm.codename}</span>
													{/each}
													{#if group.permission_count > 5}
														<span class="badge badge-sm badge-ghost">+{group.permission_count - 5} more</span>
													{/if}
												</div>
											{:else}
												<span class="text-xs text-base-content/40">No permissions</span>
											{/if}
										</td>
										<td>
											<div class="flex gap-1">
												<button
													onclick={() => openEdit(group)}
													class="btn text-info btn-ghost btn-xs"
													title="Edit group"
												>
													<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
													</svg>
												</button>
												<button
													onclick={() => deleteGroup(group.id)}
													class="btn text-error btn-ghost btn-xs"
													title="Delete group"
												>
													<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="p-12 text-center">
						<svg class="mx-auto mb-4 h-12 w-12 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
						</svg>
						<h3 class="mb-1 text-lg font-semibold text-base-content">No groups</h3>
						<p class="mb-4 text-base-content/60">Create your first permission group.</p>
						<button class="btn btn-primary btn-sm" onclick={() => (showCreateModal = true)}>Create Group</button>
					</div>
				{/if}
			</div>

		<!-- Permissions Tab -->
		{:else if activeTab === 'permissions'}
			<div class="space-y-4">
				{#if groupedPermissions.length > 0}
					{#each groupedPermissions as group (group.app_label + '.' + group.model)}
						<div class="overflow-hidden rounded-lg bg-base-100 shadow-sm">
							<div class="border-b border-base-300 bg-base-200/80 px-5 py-3">
								<h3 class="text-sm font-bold uppercase tracking-wider text-base-content/70">
									{group.app_label}
									<span class="font-normal normal-case text-base-content/40">/</span>
									<span class="font-semibold normal-case text-base-content/90">{group.model}</span>
								</h3>
							</div>
							<div class="overflow-x-auto">
								<table class="table">
									<thead>
										<tr>
											<th>Codename</th>
											<th>Display Name</th>
											<th class="w-20 text-center">ID</th>
										</tr>
									</thead>
									<tbody>
										{#each group.permissions as perm}
											<tr class="hover:bg-base-200">
												<td><code class="rounded bg-base-200 px-2 py-0.5 text-xs font-mono text-base-content/80">{perm.codename}</code></td>
												<td class="text-sm text-base-content">{perm.name}</td>
												<td class="text-center text-xs text-base-content/40">{perm.id}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/each}
				{:else}
					<div class="p-12 text-center text-base-content/60">No permissions found</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Create Group Modal -->
{#if showCreateModal}
	<div
		class="modal modal-open"
		onclick={(e) => {
			if (e.target === e.currentTarget) showCreateModal = false;
		}}
	>
		<div class="modal-box max-w-2xl">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => (showCreateModal = false)}>✕</button
			>
			<h3 class="text-lg font-bold mb-4">Create Permission Group</h3>

			<div class="form-control mb-4">
				<label class="label">
					<span class="label-text font-semibold">Group Name <span class="text-error">*</span></span>
				</label>
				<input
					type="text"
					class="input input-bordered w-full text-base-content"
					placeholder="e.g. Content Manager"
					bind:value={createForm.name}
				/>
			</div>

			<p class="text-sm font-semibold mb-2 text-base-content">
				Assign Permissions
				<span class="font-normal text-xs text-base-content/50 ml-2">
					({createForm.selectedPerms.length} / {allPermIds.length} selected)
				</span>
			</p>
			<div class="max-h-96 overflow-y-auto rounded-lg border border-base-300 p-3 space-y-4">
				<!-- Global select-all -->
				<label class="flex items-center gap-2 cursor-pointer border-b border-base-300 pb-2 mb-2">
					<input
						type="checkbox"
						class="checkbox checkbox-sm checkbox-primary"
						checked={createAllSelected}
						onchange={toggleCreateAll}
					/>
					<span class="text-sm font-semibold text-base-content">Select All Permissions</span>
				</label>

				{#each groupedPermissions as gp (gp.app_label + '.' + gp.model)}
					<div>
						<label class="flex items-center gap-2 cursor-pointer mb-2">
							<input
								type="checkbox"
								class="checkbox checkbox-xs checkbox-secondary"
								checked={createModuleSelected(gp)}
								onchange={() => toggleCreateModule(gp)}
							/>
							<p class="text-xs font-bold uppercase tracking-wider text-base-content/70">
								{gp.app_label} / {gp.model}
							</p>
						</label>
						<div class="flex flex-wrap gap-2 ml-5">
							{#each gp.permissions as perm}
								<label class="flex items-center gap-1.5 cursor-pointer">
									<input
										type="checkbox"
										class="checkbox checkbox-xs"
										checked={createForm.selectedPerms.includes(perm.id)}
										onchange={() => toggleCreatePerm(perm.id)}
									/>
									<span class="text-xs text-base-content/80">{perm.codename}</span>
								</label>
							{/each}
						</div>
					</div>
					<hr class="border-base-300" />
				{/each}
			</div>

			<div class="modal-action">
				<button class="btn btn-sm btn-ghost" onclick={() => (showCreateModal = false)}>Cancel</button>
				<button class="btn btn-sm btn-primary" onclick={handleCreate} disabled={!createForm.name.trim()}>
					Create Group
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Group Modal -->
{#if showEditModal && editingGroup}
	<div
		class="modal modal-open"
		onclick={(e) => {
			if (e.target === e.currentTarget) showEditModal = false;
		}}
	>
		<div class="modal-box max-w-2xl">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => (showEditModal = false)}>✕</button
			>
			<h3 class="text-lg font-bold mb-4">Edit Group: <span class="text-primary">{editingGroup.name}</span></h3>

			<div class="form-control mb-4">
				<label class="label">
					<span class="label-text font-semibold">Group Name</span>
				</label>
				<input
					type="text"
					class="input input-bordered w-full text-base-content"
					bind:value={editForm.name}
				/>
			</div>

			<p class="text-sm font-semibold mb-2 text-base-content">
				Assign Permissions
				<span class="font-normal text-xs text-base-content/50 ml-2">
					({editForm.selectedPerms.length} / {allPermIds.length} selected)
				</span>
			</p>
			<div class="max-h-96 overflow-y-auto rounded-lg border border-base-300 p-3 space-y-4">
				<!-- Global select-all -->
				<label class="flex items-center gap-2 cursor-pointer border-b border-base-300 pb-2 mb-2">
					<input
						type="checkbox"
						class="checkbox checkbox-sm checkbox-primary"
						checked={editAllSelected}
						onchange={toggleEditAll}
					/>
					<span class="text-sm font-semibold text-base-content">Select All Permissions</span>
				</label>

				{#each groupedPermissions as gp (gp.app_label + '.' + gp.model)}
					<div>
						<label class="flex items-center gap-2 cursor-pointer mb-2">
							<input
								type="checkbox"
								class="checkbox checkbox-xs checkbox-secondary"
								checked={editModuleSelected(gp)}
								onchange={() => toggleEditModule(gp)}
							/>
							<p class="text-xs font-bold uppercase tracking-wider text-base-content/70">
								{gp.app_label} / {gp.model}
							</p>
						</label>
						<div class="flex flex-wrap gap-2 ml-5">
							{#each gp.permissions as perm}
								<label class="flex items-center gap-1.5 cursor-pointer">
									<input
										type="checkbox"
										class="checkbox checkbox-xs"
										checked={editForm.selectedPerms.includes(perm.id)}
										onchange={() => toggleEditPerm(perm.id)}
									/>
									<span class="text-xs text-base-content/80">{perm.codename}</span>
								</label>
							{/each}
						</div>
					</div>
					<hr class="border-base-300" />
				{/each}
			</div>

			<div class="modal-action">
				<button class="btn btn-sm btn-ghost" onclick={() => (showEditModal = false)}>Cancel</button>
				<button class="btn btn-sm btn-primary" onclick={handleEdit} disabled={!editForm.name.trim()}>
					Save Changes
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Toasts -->
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
				{t.message}
			</div>
		</div>
	{/each}
</div>
