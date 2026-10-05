<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	interface AdminUser {
		id: number;
		email: string;
		name: string;
		phone: string | null;
		is_staff: boolean;
		is_superuser: boolean;
		is_active: boolean;
		is_buyer: boolean;
		created_at: string;
		groups: number[];
		groups_detail: { id: number; name: string }[];
	}

	interface Group {
		id: number;
		name: string;
	}

	interface Toast {
		id: number;
		message: string;
		type: 'success' | 'error' | 'info';
	}

	let { data } = $props();

	let users = $state<AdminUser[]>(data?.adminUsers ?? []);
	let groups = $state<Group[]>(data?.groups ?? []);
	let token = $state(data?.apiToken ?? '');
	let toasts = $state<Toast[]>([]);
	let showCreateModal = $state(false);

	let createForm = $state({
		name: '',
		email: '',
		phone: '',
		password: '',
		is_staff: true,
		is_superuser: false,
		is_active: true,
		selectedGroups: [] as number[]
	});

	function addToast(message: string, type: Toast['type'] = 'info') {
		const id = Date.now();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => (toasts = toasts.filter((t) => t.id !== id)), 3000);
	}

	async function fetchUsers() {
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (!res.ok) return;
			const json = await res.json();
			users = json.data ?? [];
		} catch {
			addToast('Failed to load users', 'error');
		}
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
			// silently fail
		}
	}

	async function handleCreate() {
		if (!createForm.email.trim() || !createForm.name.trim()) {
			addToast('Email and name are required', 'error');
			return;
		}
		try {
			const body: Record<string, unknown> = {
				email: createForm.email.trim(),
				name: createForm.name.trim(),
				phone: createForm.phone.trim() || null,
				is_staff: createForm.is_staff,
				is_superuser: createForm.is_superuser,
				is_active: createForm.is_active
			};
			if (createForm.password) body.password = createForm.password;
			if (createForm.selectedGroups.length > 0) body.groups = createForm.selectedGroups;

			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/admin-users/create/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(body)
			});
			const result = await res.json();
			if (result.success) {
				addToast('Admin user created successfully', 'success');
				showCreateModal = false;
				createForm = { name: '', email: '', phone: '', password: '', is_staff: true, is_superuser: false, is_active: true, selectedGroups: [] };
				fetchUsers();
			} else {
				const msg = Object.values(result.errors ?? {}).flat().join(', ') || 'Failed to create user';
				addToast(msg, 'error');
			}
		} catch {
			addToast('Something went wrong', 'error');
		}
	}

	async function deleteUser(id: number) {
		if (!confirm('Are you sure you want to delete this user?')) return;
		try {
			const fd = new FormData();
			fd.append('id', id.toString());
			const res = await fetch('?/deleteUser', { method: 'POST', body: fd });
			const result = await res.json();
			if (result.success) {
				users = users.filter((u) => u.id !== id);
				addToast('User deleted', 'success');
			} else {
				addToast(result.message || 'Failed to delete', 'error');
			}
		} catch {
			addToast('Something went wrong', 'error');
		}
	}

	function toggleGroup(groupId: number) {
		if (createForm.selectedGroups.includes(groupId)) {
			createForm.selectedGroups = createForm.selectedGroups.filter((g) => g !== groupId);
		} else {
			createForm.selectedGroups = [...createForm.selectedGroups, groupId];
		}
	}

	const formatDate = (d: string) =>
		new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

	onMount(() => {
		if (!users.length) fetchUsers();
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
			<span class="text-base-content/60">Admin Users</span>
		</div>

		<!-- Header -->
		<div class="mb-6 rounded-lg bg-gradient-to-r from-green-700 to-green-400 p-6 text-white shadow-lg">
			<div class="flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Admin Users</h1>
					<p class="text-green-100 text-sm">Manage admin users, roles and permissions</p>
				</div>
				<button
					class="btn flex-nowrap gap-2 bg-white/20 text-white shadow-md transition-all hover:bg-white/30 btn-sm"
					onclick={() => (showCreateModal = true)}
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Create User
				</button>
			</div>
		</div>

		<!-- Table -->
		<div class="overflow-hidden rounded-lg bg-base-100 shadow-sm">
			{#if users.length > 0}
				<div class="overflow-x-auto">
					<table class="table">
						<thead class="bg-base-200">
							<tr>
								<th>#</th>
								<th>Name</th>
								<th>Email</th>
								<th>Role</th>
								<th>Groups</th>
								<th>Status</th>
								<th>Created</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each users as user, i (user.id)}
								<tr class="transition-colors hover:bg-base-200">
									<td class="text-sm text-base-content/60">{i + 1}</td>
									<td>
										<div class="flex items-center gap-3">
											<div
												class="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700"
											>
												{(user.name || user.email).charAt(0).toUpperCase()}
											</div>
											<div>
												<p class="font-medium text-base-content">{user.name || 'N/A'}</p>
												<p class="text-xs text-base-content/50">ID: {user.id}</p>
											</div>
										</div>
									</td>
									<td class="text-sm text-base-content/70">{user.email}</td>
									<td>
										{#if user.is_superuser}
											<span class="badge badge-sm badge-error">Super Admin</span>
										{:else if user.is_staff}
											<span class="badge badge-sm badge-warning">Staff</span>
										{:else}
											<span class="badge badge-sm badge-ghost">User</span>
										{/if}
									</td>
									<td>
										{#if user.groups_detail && user.groups_detail.length > 0}
											<div class="flex flex-wrap gap-1">
												{#each user.groups_detail as g}
													<span class="badge badge-sm badge-outline">{g.name}</span>
												{/each}
											</div>
										{:else}
											<span class="text-xs text-base-content/40">—</span>
										{/if}
									</td>
									<td>
										{#if user.is_active}
											<span class="badge badge-sm badge-success">Active</span>
										{:else}
											<span class="badge badge-sm badge-error">Inactive</span>
										{/if}
									</td>
									<td class="text-sm text-base-content/60">{formatDate(user.created_at)}</td>
									<td>
										<button
											onclick={() => deleteUser(user.id)}
											title="Delete user"
											class="btn text-error btn-ghost btn-xs"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-12 text-center">
					<svg class="mx-auto mb-4 h-12 w-12 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
					<h3 class="mb-1 text-lg font-semibold text-base-content">No admin users</h3>
					<p class="mb-4 text-base-content/60">Create your first admin user to get started.</p>
					<button class="btn btn-primary btn-sm gap-2" onclick={() => (showCreateModal = true)}>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Create User
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Create Modal -->
{#if showCreateModal}
	<div
		class="modal modal-open"
		onclick={(e) => {
			if (e.target === e.currentTarget) showCreateModal = false;
		}}
	>
		<div class="modal-box max-w-xl">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => (showCreateModal = false)}>✕</button
			>
			<h3 class="text-lg font-bold mb-6">Create Admin User</h3>

			<div class="space-y-4">
				<!-- Name & Email -->
				<div class="grid grid-cols-2 gap-4">
					<div class="form-control">
						<label class="label">
							<span class="label-text font-semibold">Full Name <span class="text-error">*</span></span>
						</label>
						<input type="text" class="input input-bordered w-full text-base-content" placeholder="John Doe" bind:value={createForm.name} />
					</div>
					<div class="form-control">
						<label class="label">
							<span class="label-text font-semibold">Email <span class="text-error">*</span></span>
						</label>
						<input type="email" class="input input-bordered w-full text-base-content" placeholder="admin@example.com" bind:value={createForm.email} />
					</div>
				</div>

				<!-- Phone & Password -->
				<div class="grid grid-cols-2 gap-4">
					<div class="form-control">
						<label class="label">
							<span class="label-text font-semibold">Phone</span>
						</label>
						<input type="text" class="input input-bordered w-full text-base-content" placeholder="+977-98..." bind:value={createForm.phone} />
					</div>
					<div class="form-control">
						<label class="label">
							<span class="label-text font-semibold">Password</span>
						</label>
						<input type="password" class="input input-bordered w-full text-base-content" placeholder="Set a password" bind:value={createForm.password} />
					</div>
				</div>

				<!-- Role Selection -->
				<div class="rounded-lg border border-base-300 p-4">
					<p class="text-sm font-semibold mb-3 text-base-content">Role & Permissions</p>
					<div class="grid grid-cols-3 gap-3">
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" class="checkbox checkbox-sm checkbox-primary" bind:checked={createForm.is_staff} />
							<span class="text-sm text-base-content">Staff</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" class="checkbox checkbox-sm checkbox-secondary" bind:checked={createForm.is_superuser} />
							<span class="text-sm text-base-content">Super Admin</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" class="checkbox checkbox-sm checkbox-success" bind:checked={createForm.is_active} />
							<span class="text-sm text-base-content">Active</span>
						</label>
					</div>
				</div>

				<!-- Groups Selection -->
				{#if groups.length > 0}
					<div class="rounded-lg border border-base-300 p-4">
						<p class="text-sm font-semibold mb-3 text-base-content">Permission Groups</p>
						<div class="flex flex-wrap gap-2">
							{#each groups as group}
								<label class="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										class="checkbox checkbox-sm"
										checked={createForm.selectedGroups.includes(group.id)}
										onchange={() => toggleGroup(group.id)}
									/>
									<span class="text-sm text-base-content">{group.name}</span>
								</label>
							{/each}
						</div>
						{#if groups.length === 0}
							<p class="text-xs text-base-content/40">No groups available</p>
						{/if}
					</div>
				{/if}
			</div>

			<div class="modal-action">
				<button class="btn btn-sm btn-ghost" onclick={() => (showCreateModal = false)}>Cancel</button>
				<button
					class="btn btn-sm btn-primary"
					onclick={handleCreate}
					disabled={!createForm.email.trim() || !createForm.name.trim()}
				>
					Create User
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
				{#if t.type === 'success'}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
				{:else if t.type === 'error'}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
				{:else}
					<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd" />
					</svg>
				{/if}
				{t.message}
			</div>
		</div>
	{/each}
</div>
