<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	interface ContactForm {
		id: number;
		name: string;
		email: string;
		message: string;
		phone: string | null;
		status: string;
		created_at: string;
	}

	interface Toast {
		id: number;
		message: string;
		type: 'success' | 'error' | 'info';
	}

	let { data } = $props();
	const token = data.apiToken;

	let items = $state<ContactForm[]>(data?.items ?? []);
	let totalItems = $state(data?.totalCount ?? 0);
	let toasts = $state<Toast[]>([]);
	let searchQuery = $state('');
	let filterStatus = $state('all');
	let sortBy = $state('default');
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	let showCreateModal = $state(false);
	let showDetailId = $state<number | null>(null);
	let showReplyId = $state<number | null>(null);
	let replyText = $state('');

	let createForm = $state({ name: '', email: '', message: '', phone: '' });

	let detailForm = $state({ name: '', email: '', phone: '', message: '' });

	function addToast(message: string, type: Toast['type'] = 'info') {
		const id = Date.now();
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => (toasts = toasts.filter((t) => t.id !== id)), 3000);
	}

	function getDetail(item: ContactForm | undefined) {
		return item;
	}

	function getReplyItem(item: ContactForm | undefined) {
		return item;
	}

	async function fetchItems(page = 1) {
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/contact-forms/`, {
				headers: {
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` })
				}
			});
			if (!res.ok) throw new Error();
			const payload = await res.json();
			items = payload.data ?? [];
			totalItems = payload.data?.length ?? 0;
			currentPage = page;
		} catch {
			addToast('Failed to load contact forms', 'error');
		}
	}

	async function deleteItem(id: number) {
		if (!confirm('Are you sure you want to delete this?')) return;
		try {
			const formData = new FormData();
			formData.append('id', id.toString());
			const res = await fetch('?/deleteItem', { method: 'POST', body: formData });
			const result = await res.json();
			if (result.success) {
				items = items.filter((i) => i.id !== id);
				totalItems -= 1;
				addToast('Deleted successfully', 'success');
			} else {
				addToast(result.message || 'Failed to delete', 'error');
			}
		} catch {
			addToast('Something went wrong', 'error');
		}
	}

	async function handleCreate() {
		if (!createForm.name.trim() || !createForm.email.trim() || !createForm.message.trim()) {
			addToast('Name, email, and message are required', 'error');
			return;
		}
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/contact-forms/create/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` })
				},
				body: JSON.stringify(createForm)
			});
			const result = await res.json();
			if (result.success) {
				addToast('Contact form created successfully', 'success');
				showCreateModal = false;
				createForm = { name: '', email: '', message: '', phone: '' };
				fetchItems(currentPage);
			} else {
				addToast(result.errors?.message || 'Failed to create', 'error');
			}
		} catch {
			addToast('Something went wrong', 'error');
		}
	}

	function openDetail(id: number) {
		const item = items.find((i) => i.id === id);
		if (item) {
			detailForm = { name: item.name, email: item.email, phone: item.phone ?? '', message: item.message };
			showDetailId = id;
		}
	}

	async function handleMarkAsRead(id: number) {
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/contact-forms/${id}/update/`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` })
				},
				body: JSON.stringify({ status: 'read' })
			});
			const result = await res.json();
			if (result.success) {
				addToast('Marked as read', 'success');
				fetchItems(currentPage);
			} else {
				addToast(result.errors?.message || 'Failed to update', 'error');
			}
		} catch {
			addToast('Something went wrong', 'error');
		}
	}

	async function handleReply(id: number) {
		if (!replyText.trim()) {
			addToast('Reply message is required', 'error');
			return;
		}
		try {
			const item = items.find((i) => i.id === id);
			const updatedMessage = item
				? item.message + '\n\n--- Admin Reply ---\n' + replyText
				: replyText;
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/contact-forms/${id}/update/`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` })
				},
				body: JSON.stringify({ message: updatedMessage, status: 'replied' })
			});
			const result = await res.json();
			if (result.success) {
				addToast('Reply sent successfully', 'success');
				showReplyId = null;
				replyText = '';
				fetchItems(currentPage);
			} else {
				addToast(result.errors?.message || 'Failed to send reply', 'error');
			}
		} catch {
			addToast('Something went wrong', 'error');
		}
	}

	let processedItems = $derived.by(() => {
		let list = [...items];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(i) =>
					i.name.toLowerCase().includes(q) ||
					i.email.toLowerCase().includes(q) ||
					i.message.toLowerCase().includes(q) ||
					i.phone?.toLowerCase().includes(q)
			);
		}

		if (filterStatus !== 'all') {
			list = list.filter((i) => i.status === filterStatus);
		}

		if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
		else if (sortBy === 'email') list.sort((a, b) => a.email.localeCompare(b.email));
		else if (sortBy === 'date')
			list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

	function goToPage(page: number | string) {
		const p = typeof page === 'number' ? page : parseInt(page);
		if (p >= 1 && p <= totalPages) currentPage = p;
	}

	const formatDate = (d: string) =>
		new Date(d).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});

	const truncate = (s: string, max = 80) => (s.length <= max ? s : s.slice(0, max) + '...');

	const statusBadge = (status: string) => {
		const map: Record<string, string> = {
			new: 'badge-info',
			read: 'badge-warning',
			replied: 'badge-success'
		};
		return map[status] || 'badge-ghost';
	};

	onMount(() => {
		if (!items.length) fetchItems(1);
	});
</script>

<div class="min-h-screen">
	<div class="mx-auto">
		<!-- Breadcrumb -->
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
			<span class="text-base-content/60">Contact Forms</span>
		</div>

		<!-- Header -->
		<div class="mb-6 rounded-lg">
			<div class="mb-4 flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Contact Forms</h1>
					<p class="text-sm">Manage contact form submissions</p>
				</div>
				<button
					class="btn flex-nowrap gap-2 text-white shadow-md transition-shadow btn-sm btn-info hover:shadow-lg"
					onclick={() => (showCreateModal = true)}
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Create Entry
				</button>
			</div>
		</div>

		<!-- Filters -->
		<form class="mb-4 rounded-lg" onsubmit={(e) => e.preventDefault()}>
			<div class="grid grid-cols-1 gap-2 md:grid-cols-4">
				<div class="form-control md:col-span-2">
					<input
						type="text"
						placeholder="Search by name, email, or message..."
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
						<option value="new">New</option>
						<option value="read">Read</option>
						<option value="replied">Replied</option>
					</select>
				</div>
				<div class="form-control">
					<select
						class="select-bordered select w-full select-md text-base-content"
						bind:value={sortBy}
					>
						<option value="default">Default</option>
						<option value="name">Name (A-Z)</option>
						<option value="email">Email (A-Z)</option>
						<option value="date">Newest First</option>
					</select>
				</div>
			</div>
		</form>

		<!-- Table -->
		<div class="overflow-hidden rounded-lg bg-base-100 shadow-sm">
			{#if processedItems.length > 0}
				<div class="overflow-x-auto">
					<table class="table">
						<thead class="bg-base-200">
							<tr>
								<th>Name</th>
								<th>Email</th>
								<th>Message</th>
								<th>Status</th>
								<th>Date</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each processedItems as item (item.id)}
								<tr class="transition-colors hover:bg-base-200">
									<td>
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-base-200"
											>
												<span class="text-sm font-semibold text-base-content/70"
													>{item.name.charAt(0).toUpperCase()}</span
												>
											</div>
											<div>
												<p class="line-clamp-1 font-medium text-base-content">{item.name}</p>
												<p class="text-xs text-base-content/60">ID: {item.id}</p>
											</div>
										</div>
									</td>
									<td>
										<p class="line-clamp-1 text-sm text-base-content/70">{item.email}</p>
										{#if item.phone}
											<p class="text-xs text-base-content/50">{item.phone}</p>
										{/if}
									</td>
									<td>
										<p class="line-clamp-2 text-sm text-base-content/70">{item.message}</p>
									</td>
									<td>
										<span class="badge badge-sm {statusBadge(item.status)}">{item.status}</span>
									</td>
									<td>
										<p class="text-sm text-base-content/60">{formatDate(item.created_at)}</p>
									</td>
									<td>
										<div class="flex items-center gap-1">
											<button
												onclick={() => openDetail(item.id)}
												title="View details"
												class="btn btn-ghost btn-xs"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
													/>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
													/>
												</svg>
											</button>
											<button
												onclick={() => {
													showReplyId = item.id;
													replyText = '';
												}}
												title="Reply"
												class="btn btn-ghost btn-xs"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
													/>
												</svg>
											</button>
											<button
												onclick={() => deleteItem(item.id)}
												title="Delete"
												class="btn text-error btn-ghost btn-xs"
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
							<span class="font-semibold">{totalItems}</span> entries
						</p>
						<div class="flex items-center gap-2">
							<label for="itemsPerPage" class="text-sm text-base-content/60">Items per page:</label>
							<select
								id="itemsPerPage"
								class="select-bordered select w-20 select-sm"
								bind:value={itemsPerPage}
								onchange={(e: Event) => {
									const target = e.target as HTMLSelectElement;
									itemsPerPage = parseInt(target.value);
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
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									/>
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
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			{/if}

			{#if processedItems.length === 0 && (searchQuery || filterStatus !== 'all')}
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
					<h3 class="mb-1 text-lg font-semibold text-base-content">No entries found</h3>
					<p class="mb-4 text-base-content/60">Try adjusting your filters or search terms.</p>
				</div>
			{/if}

			{#if processedItems.length === 0 && !searchQuery && filterStatus === 'all'}
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
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
						/>
					</svg>
					<h3 class="mb-1 text-lg font-semibold text-base-content">No contact forms yet</h3>
					<p class="mb-4 text-base-content/60">Start by creating your first entry.</p>
					<button class="btn btn-primary btn-sm gap-2" onclick={() => (showCreateModal = true)}>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Create First Entry
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Detail Modal -->
{#if showDetailId !== null}
	{@const detail = items.find((i) => i.id === showDetailId)}
	<div
		class="modal modal-open"
		onclick={(e) => {
			if (e.target === e.currentTarget) showDetailId = null;
		}}
	>
		<div class="modal-box max-w-2xl">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => (showDetailId = null)}>✕</button
			>
			<h3 class="text-lg font-bold mb-4">Contact Form Details</h3>
			{#if detail}
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="form-control">
							<label class="label">
								<span class="label-text font-semibold">Name</span>
							</label>
							<input type="text" class="input input-bordered w-full text-base-content" bind:value={detailForm.name} disabled />
						</div>
						<div class="form-control">
							<label class="label">
								<span class="label-text font-semibold">Email</span>
							</label>
							<input type="email" class="input input-bordered w-full text-base-content" bind:value={detailForm.email} disabled />
						</div>
						<div class="form-control">
							<label class="label">
								<span class="label-text font-semibold">Phone</span>
							</label>
							<input type="text" class="input input-bordered w-full text-base-content" bind:value={detailForm.phone} disabled />
						</div>
						<div class="form-control">
							<label class="label">
								<span class="label-text font-semibold">Status</span>
							</label>
							<div class="flex items-center gap-2">
								<span class="badge badge-sm {statusBadge(detail.status)}">{detail.status}</span>
							</div>
						</div>
					</div>
					<div class="form-control">
						<label class="label">
							<span class="label-text font-semibold">Date</span>
						</label>
						<input type="text" class="input input-bordered w-full text-base-content" value={formatDate(detail.created_at)} disabled />
					</div>
					<div class="form-control">
						<label class="label">
							<span class="label-text font-semibold">Message</span>
						</label>
						<textarea class="textarea textarea-bordered h-32 w-full text-base-content" bind:value={detailForm.message} disabled></textarea>
					</div>
				</div>
				<div class="modal-action flex-wrap gap-2">
					<button class="btn btn-sm btn-ghost" onclick={() => (showDetailId = null)}>Close</button>
					{#if detail.status === 'new'}
						<button class="btn btn-sm btn-warning" onclick={() => { handleMarkAsRead(detail.id); showDetailId = null; }}>
							Mark as Read
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Reply Modal -->
{#if showReplyId !== null}
	{@const replyItem = items.find((i) => i.id === showReplyId)}
	<div
		class="modal modal-open"
		onclick={(e) => {
			if (e.target === e.currentTarget) showReplyId = null;
		}}
	>
		<div class="modal-box max-w-2xl">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => (showReplyId = null)}>✕</button
			>
			<h3 class="text-lg font-bold mb-4">Reply to {replyItem?.name}</h3>
			{#if replyItem}
				<div class="space-y-4">
					<div class="rounded-lg bg-base-200 p-4">
						<p class="text-xs font-semibold text-base-content/50 mb-1">Original Message:</p>
						<p class="text-sm text-base-content whitespace-pre-wrap">{replyItem.message}</p>
					</div>
					<div class="form-control">
						<label class="label">
							<span class="label-text font-semibold">Your Reply</span>
						</label>
						<textarea
							class="textarea textarea-bordered h-32 w-full text-base-content"
							placeholder="Type your reply here..."
							bind:value={replyText}
						></textarea>
					</div>
				</div>
			{/if}
			<div class="modal-action">
				<button class="btn btn-sm btn-ghost" onclick={() => (showReplyId = null)}>Cancel</button>
				<button
					class="btn btn-sm btn-primary"
					onclick={() => handleReply(showReplyId!)}
					disabled={!replyText.trim()}
				>
					Send Reply
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Create Modal -->
{#if showCreateModal}
	<div
		class="modal modal-open"
		onclick={(e) => {
			if (e.target === e.currentTarget) showCreateModal = false;
		}}
	>
		<div class="modal-box max-w-lg">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => (showCreateModal = false)}>✕</button
			>
			<h3 class="text-lg font-bold mb-4">Create Contact Form Entry</h3>
			<div class="space-y-4">
				<div class="form-control">
					<label class="label"><span class="label-text font-semibold">Name</span></label>
					<input
						type="text"
						class="input input-bordered w-full text-base-content"
						placeholder="Full name"
						bind:value={createForm.name}
					/>
				</div>
				<div class="form-control">
					<label class="label"><span class="label-text font-semibold">Email</span></label>
					<input
						type="email"
						class="input input-bordered w-full text-base-content"
						placeholder="Email address"
						bind:value={createForm.email}
					/>
				</div>
				<div class="form-control">
					<label class="label"><span class="label-text font-semibold">Phone (optional)</span></label
					>
					<input
						type="text"
						class="input input-bordered w-full text-base-content"
						placeholder="Phone number"
						bind:value={createForm.phone}
					/>
				</div>
				<div class="form-control">
					<label class="label"><span class="label-text font-semibold">Message</span></label>
					<textarea
						class="textarea textarea-bordered h-24 w-full text-base-content"
						placeholder="Your message"
						bind:value={createForm.message}
					></textarea>
				</div>
			</div>
			<div class="modal-action">
				<button class="btn btn-sm btn-ghost" onclick={() => (showCreateModal = false)}
					>Cancel</button
				>
				<button
					class="btn btn-sm btn-primary"
					onclick={handleCreate}
					disabled={!createForm.name.trim() ||
						!createForm.email.trim() ||
						!createForm.message.trim()}
				>
					Create
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
