<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$lib/admin/paths';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { getImageUrl } from '$lib/admin/utils/image';

	interface Blog {
		id: number;
		title: string;
		author: string | null;
		content: string;
		image: string | null;
		status: boolean;
		created_at: string;
		updated_at: string;
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

	// Grab your SSR data passed from +page.server.ts
	let { data } = $props();
	const token = data.apiToken;

	// Initialize frontend states
	let blogs = $state<Blog[]>(data?.blogs ?? []);
	let totalItems = $state(data?.blogCount ?? 0);

	let searchQuery = $state('');
	let filterStatus = $state('all');
	let sortBy = $state('default');
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	// 🔥 Fetch blogs on page change (Client-side fetch)
	async function fetchBlogs(page = 1) {
		try {
			const baseUrl = PUBLIC_API_BASE_URL || 'http://127.0.0.1:9000';

			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};

			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}

			const res = await fetch(`${baseUrl}/api/blogs/`, {
				method: 'GET',
				headers: headers
			});

			if (!res.ok) throw new Error('API server returned an error');

			const payload = await res.json();

			// Map raw data into component state
			blogs = payload.data ?? [];
			totalItems = payload.data?.length ?? 0;
			currentPage = page;
		} catch (err) {
			console.error('Failed to load blogs on client:', err);
		}
	}

	// ✅ Derived state: Client-side processing (filtering/sorting)
	let processedBlogs = $derived.by(() => {
		let list = [...blogs];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(b) => b.title.toLowerCase().includes(q) || (b.author && b.author.toLowerCase().includes(q))
			);
		}

		if (filterStatus !== 'all') {
			const statusValue = filterStatus === 'published';
			list = list.filter((b) => b.status === statusValue);
		}

		// Only sort if user explicitly chose a sort option
		if (sortBy === 'title') {
			list.sort((a, b) => a.title.localeCompare(b.title));
		} else if (sortBy === 'author') {
			list.sort((a, b) => (a.author ?? '').localeCompare(b.author ?? ''));
		} else if (sortBy === 'date') {
			list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
		}

		return list;
	});

	// Pagination configuration
	let totalPages = $derived(Math.max(1, Math.ceil(totalItems / itemsPerPage)));
	let startItem = $derived(totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1);
	let endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

	$effect(() => {
		if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
		if (currentPage < 1) currentPage = 1;
	});

	function getPaginationRange() {
		const pages: (number | string)[] = [];
		const maxPages = 5;
		const half = Math.floor(maxPages / 2);

		let start = Math.max(1, currentPage - half);
		let end = Math.min(totalPages, currentPage + half);

		if (end - start < maxPages - 1) {
			if (start === 1) {
				end = Math.min(totalPages, start + maxPages - 1);
			} else {
				start = Math.max(1, end - maxPages + 1);
			}
		}

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
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	async function deleteBlog(id: number) {
		if (confirm('Are you sure you want to delete this blog?')) {
			try {
				const formData = new FormData();
				formData.append('id', id.toString());

				const res = await fetch(`?/deleteBlog`, {
					method: 'POST',
					body: formData
				});

				const result = await res.json();

				// SvelteKit action returns { type: 'success' } or { type: 'failure' }
				if (result.type === 'success') {
					blogs = blogs.filter((b) => b.id !== id);
					totalItems -= 1;
					addToast('Blog deleted successfully', 'success');
				} else {
					addToast(result.data?.message || 'Failed to delete blog', 'error');
				}
			} catch (error) {
				console.error('Delete error:', error);
				addToast('Something went wrong', 'error');
			}
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function truncateContent(content: string, maxLength: number = 60): string {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}

	onMount(() => {
		// Since SSR provides initial page data, only fetch if it arrived empty
		if (!blogs.length) {
			fetchBlogs(1);
		}
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
			<span class="text-base-content/60">Blogs</span>
		</div>

		<!-- Header with Gradient Background -->
		<div class="mb-6 rounded-lg">
			<div class="mb-4 flex items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Blogs</h1>
					<p class="text-sm">Manage your blog posts</p>
				</div>
				<a
					class="btn flex-nowrap gap-2 text-white shadow-md transition-shadow btn-sm btn-info hover:shadow-lg"
					href={base + '/blogs/create'}
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Create Blog
				</a>
			</div>

			<!-- Filters Section -->
			<div class="grid grid-cols-1 gap-2 md:grid-cols-4">
				<!-- Search -->
				<div class="form-control md:col-span-2">
					<input
						type="text"
						placeholder="Search by title or author..."
						class="input-bordered input input-md w-full text-base-content placeholder-base-content/50"
						bind:value={searchQuery}
					/>
				</div>

				<!-- Filter by Status -->
				<div class="form-control">
					<select
						class="select-bordered select w-full select-md text-base-content"
						bind:value={filterStatus}
					>
						<option value="all">All Status</option>
						<option value="published">Published</option>
						<option value="draft">Draft</option>
					</select>
				</div>

				<!-- Sort By -->
				<div class="form-control">
					<select
						class="select-bordered select w-full select-md text-base-content"
						bind:value={sortBy}
					>
						<option value="default">Default</option>
						<option value="title">Title (A-Z)</option>
						<option value="author">Author</option>
						<option value="date">Newest First</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Blogs Table -->
		<div class="overflow-hidden rounded-lg bg-base-100 shadow-sm">
			{#if processedBlogs.length > 0}
				<div class="overflow-x-auto">
					<table class="table">
						<thead class="bg-base-200">
							<tr>
								<th>Title</th>
								<th>Author</th>
								<th>Content</th>
								<th>Status</th>
								<th>Created Date</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each processedBlogs as blog (blog.id)}
								<tr class="transition-colors hover:bg-base-200">
									<!-- Title -->
									<td>
										<div class="flex items-center gap-3">
											<div
												class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-base-200"
											>
												{#if blog.image}
													<img
														src={getImageUrl(blog.image)}
														alt={blog.title}
														class="h-full w-full rounded-lg object-cover"
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
															d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
														/>
													</svg>
												{/if}
											</div>
											<div>
												<p class="line-clamp-1 font-medium text-base-content">{blog.title}</p>
												<p class="text-xs text-base-content/60">ID: {blog.id}</p>
											</div>
										</div>
									</td>

									<!-- Author -->
									<td>
										<p class="text-sm text-base-content">{blog.author || 'N/A'}</p>
									</td>

									<!-- Content Preview -->
									<td>
										<p class="line-clamp-1 text-sm text-base-content/70">
											{truncateContent(blog.content.replace(/<[^>]*>/g, ''))}
										</p>
									</td>

									<!-- Status -->
									<td class="text-center">
										{#if blog.status}
											<span class="badge badge-sm badge-success">Published</span>
										{:else}
											<span class="badge badge-sm badge-error">Draft</span>
										{/if}
									</td>

									<!-- Created Date -->
									<td>
										<p class="text-sm text-base-content/70">{formatDate(blog.created_at)}</p>
									</td>

									<!-- Actions -->
									<td class="text-center">
										<div class="flex justify-center gap-2">
											<a
												href={base + '/blogs/edit/' + blog.id}
												class="btn btn-square text-white btn-xs btn-info"
												title="Edit blog"
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
												type="button"
												onclick={() => deleteBlog(blog.id)}
												class="btn btn-square text-white btn-xs btn-error"
												title="Delete blog"
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

				<!-- Pagination Section -->
				<div class="border-t border-base-300 p-4">
					<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
						<!-- Results Info -->
						<p class="text-sm text-base-content/60">
							Showing <span class="font-semibold">{startItem}</span> to
							<span class="font-semibold">{endItem}</span> of
							<span class="font-semibold">{totalItems}</span> blogs
						</p>

						<!-- Items Per Page Selector -->
						<div class="flex items-center gap-2">
							<label for="itemsPerPage" class="text-sm text-base-content/60">Items per page:</label>
							<select
								id="itemsPerPage"
								class="select-bordered select w-20 select-sm"
								bind:value={itemsPerPage}
								onchange={(e) => {
									itemsPerPage = parseInt(e.target.value);
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

						<!-- Pagination Controls -->
						<div class="flex flex-wrap items-center gap-2">
							<!-- Previous Button -->
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

							<!-- Page Numbers -->
							<div class="flex gap-1">
								{#each getPaginationRange() as page (page)}
									{#if page === '...'}
										<span class="px-2 py-1 text-base-content/60">...</span>
									{:else}
										<button
											class={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
											onclick={() => goToPage(page)}
										>
											{page}
										</button>
									{/if}
								{/each}
							</div>

							<!-- Next Button -->
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

			<!-- Filtered Results Empty State -->
			{#if processedBlogs.length === 0 && (searchQuery || filterStatus !== 'all')}
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
					<h3 class="mb-1 text-lg font-semibold text-base-content">No blogs found</h3>
					<p class="mb-4 text-base-content/60">Try adjusting your filters or search terms.</p>
				</div>
			{/if}

			<!-- No Blogs Empty State -->
			{#if processedBlogs.length === 0 && !searchQuery && filterStatus === 'all'}
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
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					<h3 class="mb-1 text-lg font-semibold text-base-content">No blogs yet</h3>
					<p class="mb-4 text-base-content/60">Start by creating your first blog post.</p>
					<a
						href={base + '/blogs/create'}
						class="btn inline-flex items-center gap-2 btn-sm btn-primary"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Create First Blog
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
