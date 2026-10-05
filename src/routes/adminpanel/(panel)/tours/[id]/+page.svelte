<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { base } from '$lib/admin/paths';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { getImageUrl } from '$lib/admin/utils/image';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();

	let tour = $derived(data.tour);
	let categories = $derived(data.categories ?? []);

	let editing = $state<Record<string, boolean>>({});
	let editSaving = $state<Record<string, boolean>>({});

	function toggleEdit(section: string) {
		editing[section] = !editing[section];
	}

	function patchEnhance(section: string) {
		return () => {
			editSaving[section] = true;
			return async ({ result, update }: { result: any; update: any }) => {
				await update({ reset: false });
				editSaving[section] = false;
				if (result.type === 'success') {
					editing[section] = false;
					await invalidateAll();
				}
			};
		};
	}

	interface ItinRow {
		id?: number;
		day: number;
		title: string;
		description: string;
		meals: string;
		accommodation: string;
		transportation: string;
		overnight_location: string;
		activities: string;
	}

	interface DepRow {
		id?: number;
		departure_date: string;
		return_date: string;
		available_seats: number;
		status: string;
	}

	let highlightItems = $state<string[]>([]);
	let includeItems = $state<string[]>([]);
	let excludeItems = $state<string[]>([]);
	let faqText = $state('');
	let galleryUploads = $state<string[]>([]);
	let galleryUrls = $state<string[]>(['']);
	let galleryError = $state('');
	let uploadingGallery = $state(false);
	let itinRows = $state<ItinRow[]>([]);
	let depRows = $state<DepRow[]>([]);

	function lines(value: string): string[] {
		return value
			.split('\n')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
	}

	function openJsonEdit(section: string) {
		if (section === 'highlights') {
			highlightItems = (tour.highlights ?? [])
				.map((h: any) => String(h?.title ?? h ?? ''))
				.filter((s: string) => s.length > 0);
			if (highlightItems.length === 0) highlightItems = [''];
		} else if (section === 'includes') {
			includeItems = (tour.includes ?? [])
				.map((i: any) => String(i ?? ''))
				.filter((s: string) => s.length > 0);
			if (includeItems.length === 0) includeItems = [''];
		} else if (section === 'excludes') {
			excludeItems = (tour.excludes ?? [])
				.map((i: any) => String(i ?? ''))
				.filter((s: string) => s.length > 0);
			if (excludeItems.length === 0) excludeItems = [''];
		} else if (section === 'faq') {
			faqText = (tour.faq ?? [])
				.map((q: any) => `${q?.question ?? ''}${q?.answer ? ` | ${q.answer}` : ''}`)
				.join('\n');
		} else if (section === 'gallery') {
			galleryUploads = (tour.gallery ?? [])
				.map((g: any) => (typeof g === 'string' ? g : String(g?.image ?? '')))
				.filter((s: string) => s.length > 0);
			galleryUrls = [''];
			galleryError = '';
		} else if (section === 'itinerary') {
			itinRows = (tour.itineraries ?? []).map((it: any) => ({
				id: it?.id,
				day: it?.day ?? 1,
				title: it?.title ?? '',
				description: it?.description ?? '',
				meals: it?.meals ?? '',
				accommodation: it?.accommodation ?? '',
				transportation: it?.transportation ?? '',
				overnight_location: it?.overnight_location ?? '',
				activities: Array.isArray(it?.activities)
					? it.activities.join(', ')
					: typeof it?.activities === 'string'
						? it.activities
						: ''
			}));
		} else if (section === 'departures') {
			depRows = (tour.departures ?? []).map((d: any) => ({
				id: d?.id,
				departure_date: d?.departure_date ?? '',
				return_date: d?.return_date ?? '',
				available_seats: d?.available_seats ?? 10,
				status: d?.status ?? 'open'
			}));
		}
		editing[section] = true;
	}

	function highlightsJson(): string {
		return JSON.stringify(
			highlightItems
				.map((t) => t.trim())
				.filter((t) => t.length > 0)
				.map((title) => ({ title }))
		);
	}

	function includesJson(): string {
		return JSON.stringify(includeItems.map((t) => t.trim()).filter((t) => t.length > 0));
	}

	function excludesJson(): string {
		return JSON.stringify(excludeItems.map((t) => t.trim()).filter((t) => t.length > 0));
	}

	function faqJson(): string {
		return JSON.stringify(
			lines(faqText).map((line) => {
				const idx = line.indexOf('|');
				if (idx === -1) return { question: line, answer: '' };
				return { question: line.slice(0, idx).trim(), answer: line.slice(idx + 1).trim() };
			})
		);
	}

	function galleryJson(): string {
		return JSON.stringify([
			...galleryUploads.map((image) => ({ image })),
			...galleryUrls
				.map((u) => u.trim())
				.filter((u) => u.length > 0)
				.map((image) => ({ image }))
		]);
	}

	function itinerariesJson(): string {
		return JSON.stringify(
			itinRows.map((r) => {
				const row: Record<string, unknown> = {
					day: Number(r.day) || 1,
					title: r.title.trim(),
					description: r.description.trim(),
					meals: r.meals.trim(),
					accommodation: r.accommodation.trim(),
					transportation: r.transportation.trim(),
					overnight_location: r.overnight_location.trim()
				};
				const acts = lines(r.activities);
				if (acts.length) row.activities = acts;
				if (r.id) row.id = r.id;
				return row;
			})
		);
	}

	function departuresJson(): string {
		return JSON.stringify(
			depRows.map((r) => {
				const row: Record<string, unknown> = {
					departure_date: r.departure_date,
					return_date: r.return_date,
					available_seats: Number(r.available_seats) || 0,
					status: r.status || 'open'
				};
				if (r.id) row.id = r.id;
				return row;
			})
		);
	}

	async function uploadGalleryFiles(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (files.length === 0) return;
		uploadingGallery = true;
		galleryError = '';
		try {
			const fd = new FormData();
			files.forEach((f) => fd.append('images', f));
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/packages/gallery/upload/`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${data.token}` },
				body: fd
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json.message || 'Failed to upload images.');
			const uploaded: { image: string }[] = json.data ?? [];
			galleryUploads = [...galleryUploads, ...uploaded.map((u) => u.image)];
		} catch (err) {
			galleryError = err instanceof Error ? err.message : 'Failed to upload images.';
		} finally {
			uploadingGallery = false;
			input.value = '';
		}
	}

	function addListItem(list: string[]) {
		list.push('');
	}

	function removeListItem(list: string[], i: number) {
		list.splice(i, 1);
	}

	function addItinerary() {
		itinRows = [
			...itinRows,
			{
				id: undefined,
				day: itinRows.length + 1,
				title: '',
				description: '',
				meals: '',
				accommodation: '',
				transportation: '',
				overnight_location: '',
				activities: ''
			}
		];
	}

	function removeItinerary(i: number) {
		itinRows = itinRows.filter((_, idx) => idx !== i);
	}

	function addDeparture() {
		depRows = [
			...depRows,
			{ id: undefined, departure_date: '', return_date: '', available_seats: 10, status: 'open' }
		];
	}

	function removeDeparture(i: number) {
		depRows = depRows.filter((_, idx) => idx !== i);
	}

	function removeGalleryImage(i: number) {
		galleryUploads = galleryUploads.filter((_, idx) => idx !== i);
	}

	function addGalleryUrl() {
		galleryUrls = [...galleryUrls, ''];
	}

	function removeGalleryUrl(i: number) {
		galleryUrls = galleryUrls.filter((_, idx) => idx !== i);
	}

	// function getImageUrl(path: string | null | undefined): string {
	// 	if (!path) return '';
	// 	return `${PUBLIC_API_BASE_URL}/media/${path.replace(/^\//, '')}`;
	// }

	function formatPrice(value: string | number | null | undefined): string {
		const num = Number(value ?? 0);
		return `${tour.currency ?? ''} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function statusBadge(status: string): string {
		const map: Record<string, string> = {
			draft: 'badge-ghost',
			published: 'badge-success',
			archived: 'badge-warning'
		};
		return map[status] ?? 'badge-ghost';
	}

	function difficultyLabel(difficulty: string): string {
		const map: Record<string, string> = {
			easy: 'Easy',
			moderate: 'Moderate',
			challenging: 'Challenging',
			hard: 'Hard'
		};
		return map[difficulty] ?? difficulty;
	}

	function listItem(item: unknown): string {
		if (typeof item === 'string') return item;
		if (item && typeof item === 'object') {
			const obj = item as Record<string, unknown>;
			return String(obj.title ?? obj.question ?? obj.answer ?? obj.name ?? obj.image ?? '');
		}
		return '';
	}

	function galleryImages(items: unknown[]): string[] {
		return items
			.map((item) => {
				if (typeof item === 'string') return item;
				if (item && typeof item === 'object') {
					const obj = item as Record<string, unknown>;
					return String(obj.image ?? '');
				}
				return '';
			})
			.filter((path) => path.length > 0);
	}

	function itineraryActivities(acts: unknown): string[] {
		if (Array.isArray(acts)) return acts.map(String);
		if (typeof acts === 'string' && acts.trim())
			return acts
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
		return [];
	}

	function formatDate(value: string | null | undefined): string {
		if (!value) return '—';
		return new Date(value).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function departureStatusBadge(status: string): string {
		const map: Record<string, string> = {
			scheduled: 'badge-info',
			open: 'badge-success',
			confirmed: 'badge-primary',
			closed: 'badge-ghost',
			cancelled: 'badge-error'
		};
		return map[status] ?? 'badge-ghost';
	}
</script>

<div class="min-h-screen bg-base-200">
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
			<a href={base + '/tours'} class="link font-medium text-primary link-hover">Tours</a>
			<svg
				class="h-4 w-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="truncate text-base-content/60">{tour.title}</span>
		</div>

		<!-- Alerts -->
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
				<span>{form.message || 'Tour updated successfully!'}</span>
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

		<!-- Header -->
		<div class="mb-6">
			{#if editing.general}
				<form
					method="POST"
					action="?/patch"
					use:enhance={patchEnhance('general')}
					class="rounded-lg bg-base-100 p-6 shadow-sm"
				>
					<input type="hidden" name="section" value="general" />
					<h2 class="mb-4 text-lg font-semibold">Edit Title &amp; Status</h2>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="form-control md:col-span-2">
							<label class="label" for="title"
								><span class="label-text font-medium">Tour Title</span></label
							>
							<input
								type="text"
								id="title"
								name="title"
								class="input-bordered input w-full"
								value={tour.title}
							/>
						</div>
						<div class="form-control">
							<label class="label" for="status"
								><span class="label-text font-medium">Status</span></label
							>
							<select id="status" name="status" class="select-bordered select w-full">
								<option value="draft" selected={tour.status === 'draft'}>Draft</option>
								<option value="published" selected={tour.status === 'published'}>Published</option>
								<option value="archived" selected={tour.status === 'archived'}>Archived</option>
							</select>
						</div>
						<div class="form-control md:col-span-3">
							<label class="label" for="category"
								><span class="label-text font-medium">Category</span></label
							>
							<select id="category" name="category" class="select-bordered select w-full">
								{#each categories as cat (cat.id)}
									<option value={cat.id} selected={tour.category?.id === cat.id}>{cat.name}</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="mt-4">
						<label class="label" for="tour_type">
							<span class="label-text font-medium">Tour Type</span>
						</label>
						<select id="tour_type" name="tour_type" class="select-bordered select w-full">
							<option value="">None</option>
							<option value="featured" selected={tour.tour_type === 'featured'}>Featured</option>
							<option value="popular" selected={tour.tour_type === 'popular'}>Popular</option>
							<option value="best-seller" selected={tour.tour_type === 'best-seller'}
								>Best Seller</option
							>
						</select>
					</div>
					<div class="mt-6 flex gap-2">
						<button type="submit" class="btn btn-primary btn-sm" disabled={editSaving.general}>
							{#if editSaving.general}<span class="loading loading-sm loading-spinner"></span>{/if}
							Save
						</button>
						<button type="button" class="btn btn-ghost btn-sm" onclick={() => toggleEdit('general')}
							>Cancel</button
						>
					</div>
				</form>
			{:else}
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<h1 class="text-2xl font-bold">{tour.title}</h1>
							<button
								type="button"
								class="btn btn-ghost btn-xs"
								onclick={() => toggleEdit('general')}
								title="Edit title & status"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
								Edit
							</button>
						</div>
						<div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-base-content/60">
							<span>{tour.slug}</span>
							{#if tour.category?.name}
								<span class="badge badge-outline badge-sm">{tour.category.name}</span>
							{/if}
							<span class="badge {statusBadge(tour.status)} badge-sm">{tour.status}</span>
							{#if tour.tour_type}
								<span class="badge badge-primary badge-sm">{tour.tour_type}</span>
							{/if}
						</div>
					</div>
					<div class="flex gap-2">
						<a href={`${base}/tours/${tour.id}/edit`} class="btn btn-primary btn-sm">
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							Edit Tour
						</a>
						<a href={base + '/tours'} class="btn btn-outline btn-sm">
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 19l-7-7m0 0l7-7m-7 7h18"
								/>
							</svg>
							Back to Tours
						</a>
					</div>
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Main column -->
			<div class="space-y-6 lg:col-span-2">
				<!-- Hero -->
				<div class="overflow-hidden rounded-lg bg-base-100 shadow-sm">
					{#if editing.thumbnail}
						<form
							method="POST"
							action="?/patch"
							use:enhance={patchEnhance('thumbnail')}
							enctype="multipart/form-data"
							class="flex h-64 flex-col items-center justify-center gap-3 p-6 lg:h-80"
						>
							<input type="hidden" name="section" value="thumbnail" />
							<p class="text-sm text-base-content/60">Replace thumbnail image</p>
							<input
								type="file"
								id="thumbnail"
								name="thumbnail"
								class="file-input-bordered file-input w-full max-w-md"
								accept="image/*"
							/>
							<div class="flex gap-2">
								<button
									type="submit"
									class="btn btn-primary btn-sm"
									disabled={editSaving.thumbnail}
								>
									{#if editSaving.thumbnail}<span class="loading loading-sm loading-spinner"
										></span>{/if}
									Save Image
								</button>
								<button
									type="button"
									class="btn btn-ghost btn-sm"
									onclick={() => toggleEdit('thumbnail')}>Cancel</button
								>
							</div>
						</form>
					{:else if tour.thumbnail}
						<div class="relative">
							<img
								src={getImageUrl(tour.thumbnail)}
								alt={tour.title}
								class="h-64 w-full object-cover lg:h-80"
							/>
							<button
								type="button"
								class="btn btn-sm btn-ghost absolute right-3 bottom-3 bg-base-100/80"
								onclick={() => toggleEdit('thumbnail')}
								title="Change thumbnail"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
							</button>
						</div>
					{:else}
						<div
							class="flex h-64 w-full items-center justify-center bg-base-200 text-base-content/40 lg:h-80"
						>
							<button
								type="button"
								class="btn btn-ghost btn-sm"
								onclick={() => toggleEdit('thumbnail')}>Add thumbnail</button
							>
						</div>
					{/if}
					<div class="p-6">
						{#if tour.short_description}
							<p class="text-base-content/80">{tour.short_description}</p>
						{/if}
						{#if tour.description}
							<div class="divider"></div>
							<div class="prose prose-sm max-w-none whitespace-pre-wrap text-base-content/80">
								{@html tour.description}
							</div>
						{/if}
					</div>
				</div>

				<!-- Description -->
				<div class="rounded-lg bg-base-100 p-6 shadow-sm">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-semibold">Description</h2>
						{#if !editing.description}
							<button
								type="button"
								class="btn btn-ghost btn-xs"
								onclick={() => toggleEdit('description')}>Edit</button
							>
						{/if}
					</div>
					{#if editing.description}
						<form method="POST" action="?/patch" use:enhance={patchEnhance('description')}>
							<input type="hidden" name="section" value="description" />
							<div class="form-control">
								<label class="label" for="short_description"
									><span class="label-text font-medium">Short Description</span></label
								>
								<textarea
									id="short_description"
									name="short_description"
									class="textarea-bordered textarea w-full"
									rows="2">{tour.short_description ?? ''}</textarea
								>
							</div>
							<div class="form-control mt-3">
								<label class="label" for="description"
									><span class="label-text font-medium">Full Description</span></label
								>
								<textarea
									id="description"
									name="description"
									class="textarea-bordered textarea w-full"
									rows="6">{tour.description ?? ''}</textarea
								>
							</div>
							<div class="mt-4 flex gap-2">
								<button
									type="submit"
									class="btn btn-primary btn-sm"
									disabled={editSaving.description}
								>
									{#if editSaving.description}<span class="loading loading-sm loading-spinner"
										></span>{/if}
									Save
								</button>
								<button
									type="button"
									class="btn btn-ghost btn-sm"
									onclick={() => toggleEdit('description')}>Cancel</button
								>
							</div>
						</form>
					{:else if tour.short_description || tour.description}
						<p class="text-base-content/70">Click "Edit" to update the descriptions.</p>
					{:else}
						<p class="text-base-content/50">No description yet.</p>
					{/if}
				</div>

				<!-- Highlights -->
				{#if editing.highlights || tour.highlights?.length}
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold">Highlights</h2>
							{#if !editing.highlights}
								<button
									type="button"
									class="btn btn-ghost btn-xs"
									onclick={() => openJsonEdit('highlights')}>Edit</button
								>
							{/if}
						</div>
						{#if editing.highlights}
							<form method="POST" action="?/patch" use:enhance={patchEnhance('highlights')}>
								<input type="hidden" name="section" value="highlights" />
								<input type="hidden" name="highlights" value={highlightsJson()} />
								<div class="mb-4 flex items-center justify-between">
									<h3 class="font-semibold">Highlights</h3>
									<button
										type="button"
										class="btn btn-sm btn-primary"
										onclick={() => addListItem(highlightItems)}>+ Add Highlight</button
									>
								</div>
								{#if highlightItems.length === 0}
									<p class="text-sm text-base-content/50">
										No highlights yet. Click "Add Highlight" to start.
									</p>
								{/if}
								<div class="space-y-3">
									{#each highlightItems as item, i (i)}
										<div class="flex items-center gap-2">
											<input
												type="text"
												class="input-bordered input w-full"
												placeholder="e.g. Everest sunrise"
												bind:value={highlightItems[i]}
											/>
											<button
												type="button"
												class="btn btn-circle btn-sm btn-ghost"
												onclick={() => removeListItem(highlightItems, i)}
												aria-label="Remove highlight"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										</div>
									{/each}
								</div>
								<div class="mt-4 flex gap-2">
									<button
										type="submit"
										class="btn btn-primary btn-sm"
										disabled={editSaving.highlights}
									>
										{#if editSaving.highlights}<span class="loading loading-sm loading-spinner"
											></span>{/if}
										Save
									</button>
									<button
										type="button"
										class="btn btn-ghost btn-sm"
										onclick={() => toggleEdit('highlights')}>Cancel</button
									>
								</div>
							</form>
						{:else}
							<ul class="space-y-2">
								{#each tour.highlights as item}
									<li class="flex items-start gap-2 text-sm">
										<svg
											class="mt-0.5 h-4 w-4 shrink-0 text-primary"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span>{listItem(item)}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				<!-- Gallery -->
				{#if editing.gallery || galleryImages(tour.gallery ?? []).length}
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold">Gallery</h2>
							{#if !editing.gallery}
								<button
									type="button"
									class="btn btn-ghost btn-xs"
									onclick={() => openJsonEdit('gallery')}>Edit</button
								>
							{/if}
						</div>
						{#if editing.gallery}
							<form method="POST" action="?/patch" use:enhance={patchEnhance('gallery')}>
								<input type="hidden" name="section" value="gallery" />
								<input type="hidden" name="gallery" value={galleryJson()} />
								<div class="space-y-4">
									<div class="form-control">
										<label class="label" for="gallery-files">
											<span class="label-text font-medium">Upload images</span>
											{#if uploadingGallery}
												<span class="label-text text-xs text-base-content/50">Uploading…</span>
											{/if}
										</label>
										<input
											type="file"
											id="gallery-files"
											accept="image/*"
											multiple
											class="file-input-bordered file-input w-full"
											onchange={uploadGalleryFiles}
										/>
										{#if galleryError}
											<p class="mt-2 text-xs text-error">{galleryError}</p>
										{/if}
									</div>
									{#if galleryUploads.length > 0}
										<div class="grid grid-cols-3 gap-3">
											{#each galleryUploads as url, i (url + i)}
												<div class="relative">
													<img
														src={getImageUrl(url)}
														alt=""
														class="h-24 w-full rounded-lg border border-base-300 object-cover"
													/>
													<button
														type="button"
														class="btn btn-circle btn-xs btn-error absolute right-1 top-1"
														onclick={() => removeGalleryImage(i)}
														aria-label="Remove image"
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
																d="M6 18L18 6M6 6l12 12"
															/>
														</svg>
													</button>
												</div>
											{/each}
										</div>
									{/if}
									<div class="space-y-2">
										{#each galleryUrls as url, i (i)}
											<div class="flex gap-2">
												<input
													type="text"
													class="input-bordered input w-full"
													placeholder="Paste image URL"
													bind:value={galleryUrls[i]}
												/>
												<button
													type="button"
													class="btn btn-ghost btn-square btn-sm"
													onclick={() => removeGalleryUrl(i)}
													aria-label="Remove URL"
												>
													<svg
														class="h-4 w-4"
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
												</button>
											</div>
										{/each}
										<button type="button" class="btn btn-ghost btn-sm" onclick={addGalleryUrl}
											>+ Add URL</button
										>
									</div>
								</div>
								<div class="mt-4 flex gap-2">
									<button
										type="submit"
										class="btn btn-primary btn-sm"
										disabled={editSaving.gallery}
									>
										{#if editSaving.gallery}<span class="loading loading-sm loading-spinner"
											></span>{/if}
										Save
									</button>
									<button
										type="button"
										class="btn btn-ghost btn-sm"
										onclick={() => toggleEdit('gallery')}>Cancel</button
									>
								</div>
							</form>
						{:else}
							<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
								{#each galleryImages(tour.gallery ?? []) as img}
									<a
										href={getImageUrl(img)}
										target="_blank"
										class="block overflow-hidden rounded-lg border border-base-300"
									>
										<img
											src={getImageUrl(img)}
											alt=""
											class="h-32 w-full object-cover transition-opacity hover:opacity-80"
										/>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Itinerary -->
				{#if editing.itinerary || tour.itineraries?.length}
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold">Itinerary</h2>
							<div class="flex gap-2">
								{#if editing.itinerary}
									<button type="button" class="btn btn-sm btn-primary" onclick={addItinerary}
										>+ Add Day</button
									>
								{:else}
									<button
										type="button"
										class="btn btn-ghost btn-xs"
										onclick={() => openJsonEdit('itinerary')}>Edit</button
									>
								{/if}
							</div>
						</div>
						{#if editing.itinerary}
							<form method="POST" action="?/patch" use:enhance={patchEnhance('itinerary')}>
								<input type="hidden" name="section" value="itinerary" />
								<input type="hidden" name="itineraries" value={itinerariesJson()} />
								{#if itinRows.length === 0}
									<p class="text-sm text-base-content/50">
										No itinerary days yet. Click "Add Day" to start.
									</p>
								{/if}
								<div class="space-y-4">
									{#each itinRows as r, i (i)}
										<div class="rounded-lg border border-base-300 p-4">
											<div class="mb-3 flex items-center justify-between">
												<h3 class="font-semibold">Day {i + 1}</h3>
												<button
													type="button"
													class="btn btn-circle btn-sm btn-ghost"
													onclick={() => removeItinerary(i)}
													aria-label="Remove day"
												>
													<svg
														class="h-4 w-4"
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
												</button>
											</div>
											<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
												<div class="form-control">
													<label class="label" for={`itin-day-${i}`}
														><span class="label-text">Day</span></label
													>
													<input
														id={`itin-day-${i}`}
														type="number"
														min="1"
														class="input-bordered input w-full"
														bind:value={itinRows[i].day}
													/>
												</div>
												<div class="form-control md:col-span-2">
													<label class="label" for={`itin-title-${i}`}
														><span class="label-text">Title</span></label
													>
													<input
														id={`itin-title-${i}`}
														type="text"
														class="input-bordered input w-full"
														placeholder="Arrival in Kathmandu"
														bind:value={itinRows[i].title}
													/>
												</div>
												<div class="form-control md:col-span-3">
													<label class="label" for={`itin-desc-${i}`}
														><span class="label-text">Description</span></label
													>
													<textarea
														id={`itin-desc-${i}`}
														class="textarea-bordered textarea w-full"
														rows="3"
														bind:value={itinRows[i].description}
													></textarea>
												</div>
												<div class="form-control">
													<label class="label" for={`itin-meals-${i}`}
														><span class="label-text">Meals</span></label
													>
													<input
														id={`itin-meals-${i}`}
														type="text"
														class="input-bordered input w-full"
														placeholder="Breakfast, Dinner"
														bind:value={itinRows[i].meals}
													/>
												</div>
												<div class="form-control">
													<label class="label" for={`itin-accom-${i}`}
														><span class="label-text">Accommodation</span></label
													>
													<input
														id={`itin-accom-${i}`}
														type="text"
														class="input-bordered input w-full"
														placeholder="Hotel"
														bind:value={itinRows[i].accommodation}
													/>
												</div>
												<div class="form-control">
													<label class="label" for={`itin-trans-${i}`}
														><span class="label-text">Transportation</span></label
													>
													<input
														id={`itin-trans-${i}`}
														type="text"
														class="input-bordered input w-full"
														placeholder="Private vehicle"
														bind:value={itinRows[i].transportation}
													/>
												</div>
												<div class="form-control">
													<label class="label" for={`itin-over-${i}`}
														><span class="label-text">Overnight</span></label
													>
													<input
														id={`itin-over-${i}`}
														type="text"
														class="input-bordered input w-full"
														placeholder="Kathmandu"
														bind:value={itinRows[i].overnight_location}
													/>
												</div>
												<div class="form-control md:col-span-2">
													<label class="label" for={`itin-act-${i}`}>
														<span class="label-text">Activities</span>
														<span class="label-text text-xs text-base-content/50"
															>Comma separated</span
														>
													</label>
													<input
														id={`itin-act-${i}`}
														type="text"
														class="input-bordered input w-full"
														placeholder="Sightseeing, Hiking"
														bind:value={itinRows[i].activities}
													/>
												</div>
											</div>
										</div>
									{/each}
								</div>
								<div class="mt-4 flex gap-2">
									<button
										type="submit"
										class="btn btn-primary btn-sm"
										disabled={editSaving.itinerary}
									>
										{#if editSaving.itinerary}<span class="loading loading-sm loading-spinner"
											></span>{/if}
										Save
									</button>
									<button
										type="button"
										class="btn btn-ghost btn-sm"
										onclick={() => toggleEdit('itinerary')}>Cancel</button
									>
								</div>
							</form>
						{:else}
							<div class="space-y-3">
								{#each tour.itineraries as itin, i (itin.id ?? i)}
									<div class="collapse collapse-arrow border border-base-300">
										<input type="checkbox" checked={i === 0} />
										<div class="collapse-title">
											<div class="flex flex-wrap items-center justify-between gap-2">
												<span class="font-medium">
													<span class="badge badge-primary badge-sm">Day {itin.day}</span>
													<span class="ml-2">{itin.title || `Day ${itin.day}`}</span>
												</span>
												{#if itin.meals}<span class="text-xs text-base-content/50"
														>{itin.meals}</span
													>{/if}
											</div>
										</div>
										<div class="collapse-content text-sm text-base-content/70">
											{#if itin.description}
												<p>{itin.description}</p>
											{/if}
											<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/60">
												{#if itin.overnight_location}
													<span
														>Overnight: <span class="font-medium">{itin.overnight_location}</span
														></span
													>
												{/if}
												{#if itin.accommodation}
													<span>Stay: <span class="font-medium">{itin.accommodation}</span></span>
												{/if}
												{#if itin.transportation}
													<span
														>Transport: <span class="font-medium">{itin.transportation}</span></span
													>
												{/if}
											</div>
											{#if itineraryActivities(itin.activities).length}
												<div class="mt-2 flex flex-wrap gap-1">
													{#each itineraryActivities(itin.activities) as act}
														<span class="badge badge-ghost badge-sm">{act}</span>
													{/each}
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<!-- FAQ -->
				{#if editing.faq || tour.faq?.length}
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold">FAQ</h2>
							{#if !editing.faq}
								<button
									type="button"
									class="btn btn-ghost btn-xs"
									onclick={() => openJsonEdit('faq')}>Edit</button
								>
							{/if}
						</div>
						{#if editing.faq}
							<form method="POST" action="?/patch" use:enhance={patchEnhance('faq')}>
								<input type="hidden" name="section" value="faq" />
								<input type="hidden" name="faq" value={faqJson()} />
								<div class="form-control">
									<label class="label" for="faq_text">
										<span class="label-text font-medium">FAQ</span>
										<span class="label-text text-xs text-base-content/50"
											>One per line: Question | Answer</span
										>
									</label>
									<textarea
										id="faq_text"
										class="textarea-bordered textarea w-full"
										rows="6"
										placeholder="Best season? | March to May&#10;How hard is it? | Moderate"
										bind:value={faqText}
									></textarea>
								</div>
								<div class="mt-4 flex gap-2">
									<button type="submit" class="btn btn-primary btn-sm" disabled={editSaving.faq}>
										{#if editSaving.faq}<span class="loading loading-sm loading-spinner"
											></span>{/if}
										Save
									</button>
									<button
										type="button"
										class="btn btn-ghost btn-sm"
										onclick={() => toggleEdit('faq')}>Cancel</button
									>
								</div>
							</form>
						{:else}
							<div class="space-y-3">
								{#each tour.faq as item}
									<div class="collapse collapse-arrow border border-base-300">
										<input type="checkbox" />
										<div class="collapse-title font-medium">{item.question || 'Question'}</div>
										<div class="collapse-content text-sm text-base-content/70">
											{item.answer || ''}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Key facts -->
				<div class="rounded-lg bg-base-100 p-6 shadow-sm">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-semibold">Key Facts</h2>
						{#if !editing.facts}
							<button type="button" class="btn btn-ghost btn-xs" onclick={() => toggleEdit('facts')}
								>Edit</button
							>
						{/if}
					</div>
					{#if editing.facts}
						<form method="POST" action="?/patch" use:enhance={patchEnhance('facts')}>
							<input type="hidden" name="section" value="facts" />
							<div class="grid grid-cols-2 gap-3">
								<div class="form-control">
									<label class="label" for="currency"
										><span class="label-text">Currency</span></label
									>
									<select id="currency" name="currency" class="select-bordered select w-full">
										<option value="USD" selected={tour.currency === 'USD'}>USD</option>
										<option value="EUR" selected={tour.currency === 'EUR'}>EUR</option>
										<option value="GBP" selected={tour.currency === 'GBP'}>GBP</option>
										<option value="NPR" selected={tour.currency === 'NPR'}>NPR</option>
										<option value="INR" selected={tour.currency === 'INR'}>INR</option>
										<option value="AUD" selected={tour.currency === 'AUD'}>AUD</option>
									</select>
								</div>
								<div class="form-control">
									<label class="label" for="difficulty"
										><span class="label-text">Difficulty</span></label
									>
									<select id="difficulty" name="difficulty" class="select-bordered select w-full">
										<option value="easy" selected={tour.difficulty === 'easy'}>Easy</option>
										<option value="moderate" selected={tour.difficulty === 'moderate'}
											>Moderate</option
										>
										<option value="challenging" selected={tour.difficulty === 'challenging'}
											>Challenging</option
										>
										<option value="hard" selected={tour.difficulty === 'hard'}>Hard</option>
									</select>
								</div>
								<div class="form-control">
									<label class="label" for="starting_price"
										><span class="label-text">Starting Price</span></label
									>
									<input
										type="number"
										step="0.01"
										min="0"
										id="starting_price"
										name="starting_price"
										class="input-bordered input w-full"
										value={tour.starting_price ?? ''}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="discount_price"
										><span class="label-text">Discount Price</span></label
									>
									<input
										type="number"
										step="0.01"
										min="0"
										id="discount_price"
										name="discount_price"
										class="input-bordered input w-full"
										value={tour.discount_price ?? ''}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="duration_days"
										><span class="label-text">Days</span></label
									>
									<input
										type="number"
										min="1"
										id="duration_days"
										name="duration_days"
										class="input-bordered input w-full"
										value={tour.duration_days ?? 1}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="duration_nights"
										><span class="label-text">Nights</span></label
									>
									<input
										type="number"
										min="0"
										id="duration_nights"
										name="duration_nights"
										class="input-bordered input w-full"
										value={tour.duration_nights ?? 0}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="starting_location"
										><span class="label-text">Starts</span></label
									>
									<input
										type="text"
										id="starting_location"
										name="starting_location"
										class="input-bordered input w-full"
										value={tour.starting_location ?? ''}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="ending_location"
										><span class="label-text">Ends</span></label
									>
									<input
										type="text"
										id="ending_location"
										name="ending_location"
										class="input-bordered input w-full"
										value={tour.ending_location ?? ''}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="minimum_group_size"
										><span class="label-text">Min Group</span></label
									>
									<input
										type="number"
										min="1"
										id="minimum_group_size"
										name="minimum_group_size"
										class="input-bordered input w-full"
										value={tour.minimum_group_size ?? 1}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="maximum_group_size"
										><span class="label-text">Max Group</span></label
									>
									<input
										type="number"
										min="1"
										id="maximum_group_size"
										name="maximum_group_size"
										class="input-bordered input w-full"
										value={tour.maximum_group_size ?? 20}
									/>
								</div>
							</div>
							<div class="mt-4 flex gap-2">
								<button type="submit" class="btn btn-primary btn-sm" disabled={editSaving.facts}>
									{#if editSaving.facts}<span class="loading loading-sm loading-spinner"
										></span>{/if}
									Save
								</button>
								<button
									type="button"
									class="btn btn-ghost btn-sm"
									onclick={() => toggleEdit('facts')}>Cancel</button
								>
							</div>
						</form>
					{:else}
						<dl class="space-y-3 text-sm">
							<div class="flex items-center justify-between gap-3">
								<dt class="text-base-content/50">Category</dt>
								<dd class="font-medium">{tour.category?.name ?? '—'}</dd>
							</div>
							<div class="flex items-center justify-between gap-3">
								<dt class="text-base-content/50">Duration</dt>
								<dd class="font-medium">
									{tour.duration_days} days / {tour.duration_nights} nights
								</dd>
							</div>
							<div class="flex items-center justify-between gap-3">
								<dt class="text-base-content/50">Price</dt>
								<dd class="font-medium">
									{#if tour.discount_price && Number(tour.discount_price) > 0}
										<span class="text-error">{formatPrice(tour.discount_price)}</span>
										<span class="text-xs text-base-content/40 line-through"
											>{formatPrice(tour.starting_price)}</span
										>
									{:else}
										{formatPrice(tour.starting_price)}
									{/if}
								</dd>
							</div>
							<div class="flex items-center justify-between gap-3">
								<dt class="text-base-content/50">Starts / Ends</dt>
								<dd class="text-right font-medium">
									{tour.starting_location || '—'} / {tour.ending_location || '—'}
								</dd>
							</div>
							<div class="flex items-center justify-between gap-3">
								<dt class="text-base-content/50">Group Size</dt>
								<dd class="font-medium">{tour.minimum_group_size}–{tour.maximum_group_size}</dd>
							</div>
							<div class="flex items-center justify-between gap-3">
								<dt class="text-base-content/50">Difficulty</dt>
								<dd class="font-medium">{difficultyLabel(tour.difficulty)}</dd>
							</div>
							<div class="flex items-center justify-between gap-3">
								<dt class="text-base-content/50">Rating</dt>
								<dd class="font-medium">
									{#if tour.average_rating != null}
										{tour.average_rating} ({tour.review_count ?? 0} reviews)
									{:else}
										No reviews yet
									{/if}
								</dd>
							</div>
						</dl>
					{/if}
				</div>

				<!-- Details -->
				<div class="rounded-lg bg-base-100 p-6 shadow-sm">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-semibold">Details</h2>
						{#if !editing.details}
							<button
								type="button"
								class="btn btn-ghost btn-xs"
								onclick={() => toggleEdit('details')}>Edit</button
							>
						{/if}
					</div>
					{#if editing.details}
						<form method="POST" action="?/patch" use:enhance={patchEnhance('details')}>
							<input type="hidden" name="section" value="details" />
							<div class="space-y-3">
								<div class="form-control">
									<label class="label" for="transportation"
										><span class="label-text">Transportation</span></label
									>
									<input
										type="text"
										id="transportation"
										name="transportation"
										class="input-bordered input w-full"
										value={tour.transportation ?? ''}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="accommodation"
										><span class="label-text">Accommodation</span></label
									>
									<input
										type="text"
										id="accommodation"
										name="accommodation"
										class="input-bordered input w-full"
										value={tour.accommodation ?? ''}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="meals"><span class="label-text">Meals</span></label>
									<input
										type="text"
										id="meals"
										name="meals"
										class="input-bordered input w-full"
										value={tour.meals ?? ''}
									/>
								</div>
							</div>
							<div class="mt-4 flex gap-2">
								<button type="submit" class="btn btn-primary btn-sm" disabled={editSaving.details}>
									{#if editSaving.details}<span class="loading loading-sm loading-spinner"
										></span>{/if}
									Save
								</button>
								<button
									type="button"
									class="btn btn-ghost btn-sm"
									onclick={() => toggleEdit('details')}>Cancel</button
								>
							</div>
						</form>
					{:else}
						<dl class="space-y-3 text-sm">
							<div class="flex items-center justify-between gap-3">
								<dt class="text-base-content/50">Transportation</dt>
								<dd class="text-right font-medium">{tour.transportation || '—'}</dd>
							</div>
							<div class="flex items-center justify-between gap-3">
								<dt class="text-base-content/50">Accommodation</dt>
								<dd class="text-right font-medium">{tour.accommodation || '—'}</dd>
							</div>
							<div class="flex items-center justify-between gap-3">
								<dt class="text-base-content/50">Meals</dt>
								<dd class="text-right font-medium">{tour.meals || '—'}</dd>
							</div>
						</dl>
					{/if}
				</div>

				<!-- Departures -->
				{#if editing.departures || tour.departures?.length}
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold">Departures</h2>
							<div class="flex gap-2">
								{#if editing.departures}
									<button type="button" class="btn btn-sm btn-primary" onclick={addDeparture}
										>+ Add Departure</button
									>
								{:else}
									<button
										type="button"
										class="btn btn-ghost btn-xs"
										onclick={() => openJsonEdit('departures')}>Edit</button
									>
								{/if}
							</div>
						</div>
						{#if editing.departures}
							<form method="POST" action="?/patch" use:enhance={patchEnhance('departures')}>
								<input type="hidden" name="section" value="departures" />
								<input type="hidden" name="departures" value={departuresJson()} />
								{#if depRows.length === 0}
									<p class="text-sm text-base-content/50">
										No departures yet. Click "Add Departure" to start.
									</p>
								{/if}
								<div class="space-y-4">
									{#each depRows as r, i (i)}
										<div class="rounded-lg border border-base-300 p-4">
											<div class="mb-3 flex items-center justify-between">
												<h3 class="font-semibold">Departure {i + 1}</h3>
												<button
													type="button"
													class="btn btn-circle btn-sm btn-ghost"
													onclick={() => removeDeparture(i)}
													aria-label="Remove departure"
												>
													<svg
														class="h-4 w-4"
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
												</button>
											</div>
											<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
												<div class="form-control">
													<label class="label" for={`dep-dep-${i}`}
														><span class="label-text">Departure Date</span></label
													>
													<input
														id={`dep-dep-${i}`}
														type="date"
														class="input-bordered input w-full"
														bind:value={depRows[i].departure_date}
													/>
												</div>
												<div class="form-control">
													<label class="label" for={`dep-ret-${i}`}
														><span class="label-text">Return Date</span></label
													>
													<input
														id={`dep-ret-${i}`}
														type="date"
														class="input-bordered input w-full"
														bind:value={depRows[i].return_date}
													/>
												</div>
												<div class="form-control">
													<label class="label" for={`dep-seats-${i}`}
														><span class="label-text">Available Seats</span></label
													>
													<input
														id={`dep-seats-${i}`}
														type="number"
														min="1"
														class="input-bordered input w-full"
														bind:value={depRows[i].available_seats}
													/>
												</div>
												<div class="form-control">
													<label class="label" for={`dep-status-${i}`}
														><span class="label-text">Status</span></label
													>
													<select
														id={`dep-status-${i}`}
														class="select-bordered select w-full"
														bind:value={depRows[i].status}
													>
														<option value="scheduled">Scheduled</option>
														<option value="open">Open</option>
														<option value="confirmed">Confirmed</option>
														<option value="closed">Closed</option>
														<option value="cancelled">Cancelled</option>
													</select>
												</div>
											</div>
										</div>
									{/each}
								</div>
								<div class="mt-4 flex gap-2">
									<button
										type="submit"
										class="btn btn-primary btn-sm"
										disabled={editSaving.departures}
									>
										{#if editSaving.departures}<span class="loading loading-sm loading-spinner"
											></span>{/if}
										Save
									</button>
									<button
										type="button"
										class="btn btn-ghost btn-sm"
										onclick={() => toggleEdit('departures')}>Cancel</button
									>
								</div>
							</form>
						{:else}
							<div class="overflow-x-auto">
								<table class="table">
									<thead>
										<tr>
											<th>Departure</th>
											<th>Return</th>
											<th>Seats</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										{#each tour.departures as dep (dep.id)}
											<tr>
												<td>{formatDate(dep.departure_date)}</td>
												<td>{formatDate(dep.return_date)}</td>
												<td>
													{Number(dep.remaining_seats ?? dep.available_seats ?? 0)}
													<span class="text-xs text-base-content/50"
														>/ {dep.available_seats ?? '—'}</span
													>
												</td>
												<td
													><span class="badge {departureStatusBadge(dep.status)} badge-sm"
														>{dep.status}</span
													></td
												>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</div>
				{/if}

				<!-- What's Included -->
				{#if editing.includes || tour.includes?.length}
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold">What's Included</h2>
							{#if !editing.includes}
								<button
									type="button"
									class="btn btn-ghost btn-xs"
									onclick={() => openJsonEdit('includes')}>Edit</button
								>
							{/if}
						</div>
						{#if editing.includes}
							<form method="POST" action="?/patch" use:enhance={patchEnhance('includes')}>
								<input type="hidden" name="section" value="includes" />
								<input type="hidden" name="includes" value={includesJson()} />
								{#if includeItems.length === 0}
									<p class="text-sm text-base-content/50">
										No included items yet. Click "Add Item" to start.
									</p>
								{/if}
								<div class="space-y-3">
									{#each includeItems as item, i (i)}
										<div class="flex items-center gap-2">
											<input
												type="text"
												class="input-bordered input w-full"
												placeholder="e.g. Airport transfers"
												bind:value={includeItems[i]}
											/>
											<button
												type="button"
												class="btn btn-circle btn-sm btn-ghost"
												onclick={() => removeListItem(includeItems, i)}
												aria-label="Remove item"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										</div>
									{/each}
								</div>
								<div class="mt-4 flex items-center justify-between gap-2">
									<div class="flex gap-2">
										<button
											type="submit"
											class="btn btn-primary btn-sm"
											disabled={editSaving.includes}
										>
											{#if editSaving.includes}<span class="loading loading-sm loading-spinner"
												></span>{/if}
											Save
										</button>
										<button
											type="button"
											class="btn btn-ghost btn-sm"
											onclick={() => toggleEdit('includes')}>Cancel</button
										>
									</div>
									<button
										type="button"
										class="btn btn-sm btn-primary"
										onclick={() => addListItem(includeItems)}>+ Add Item</button
									>
								</div>
							</form>
						{:else}
							<ul class="space-y-2">
								{#each tour.includes as item}
									<li class="flex items-start gap-2 text-sm">
										<svg
											class="mt-0.5 h-4 w-4 shrink-0 text-success"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<span>{listItem(item)}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				<!-- What's Excluded -->
				{#if editing.excludes || tour.excludes?.length}
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold">What's Excluded</h2>
							{#if !editing.excludes}
								<button
									type="button"
									class="btn btn-ghost btn-xs"
									onclick={() => openJsonEdit('excludes')}>Edit</button
								>
							{/if}
						</div>
						{#if editing.excludes}
							<form method="POST" action="?/patch" use:enhance={patchEnhance('excludes')}>
								<input type="hidden" name="section" value="excludes" />
								<input type="hidden" name="excludes" value={excludesJson()} />
								{#if excludeItems.length === 0}
									<p class="text-sm text-base-content/50">
										No excluded items yet. Click "Add Item" to start.
									</p>
								{/if}
								<div class="space-y-3">
									{#each excludeItems as item, i (i)}
										<div class="flex items-center gap-2">
											<input
												type="text"
												class="input-bordered input w-full"
												placeholder="e.g. International flights"
												bind:value={excludeItems[i]}
											/>
											<button
												type="button"
												class="btn btn-circle btn-sm btn-ghost"
												onclick={() => removeListItem(excludeItems, i)}
												aria-label="Remove item"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										</div>
									{/each}
								</div>
								<div class="mt-4 flex items-center justify-between gap-2">
									<div class="flex gap-2">
										<button
											type="submit"
											class="btn btn-primary btn-sm"
											disabled={editSaving.excludes}
										>
											{#if editSaving.excludes}<span class="loading loading-sm loading-spinner"
												></span>{/if}
											Save
										</button>
										<button
											type="button"
											class="btn btn-ghost btn-sm"
											onclick={() => toggleEdit('excludes')}>Cancel</button
										>
									</div>
									<button
										type="button"
										class="btn btn-sm btn-primary"
										onclick={() => addListItem(excludeItems)}>+ Add Item</button
									>
								</div>
							</form>
						{:else}
							<ul class="space-y-2">
								{#each tour.excludes as item}
									<li class="flex items-start gap-2 text-sm">
										<svg
											class="mt-0.5 h-4 w-4 shrink-0 text-error"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<span>{listItem(item)}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				<!-- SEO -->
				{#if editing.seo || tour.meta_title || tour.meta_description || tour.meta_keywords}
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold">SEO</h2>
							{#if !editing.seo}
								<button type="button" class="btn btn-ghost btn-xs" onclick={() => toggleEdit('seo')}
									>Edit</button
								>
							{/if}
						</div>
						{#if editing.seo}
							<form method="POST" action="?/patch" use:enhance={patchEnhance('seo')}>
								<input type="hidden" name="section" value="seo" />
								<div class="space-y-3">
									<div class="form-control">
										<label class="label" for="meta_title"
											><span class="label-text">Meta Title</span></label
										>
										<input
											type="text"
											id="meta_title"
											name="meta_title"
											class="input-bordered input w-full"
											value={tour.meta_title ?? ''}
										/>
									</div>
									<div class="form-control">
										<label class="label" for="meta_description"
											><span class="label-text">Meta Description</span></label
										>
										<textarea
											id="meta_description"
											name="meta_description"
											class="textarea-bordered textarea w-full"
											rows="3">{tour.meta_description ?? ''}</textarea
										>
									</div>
									<div class="form-control">
										<label class="label" for="meta_keywords"
											><span class="label-text">Meta Keywords</span></label
										>
										<input
											type="text"
											id="meta_keywords"
											name="meta_keywords"
											class="input-bordered input w-full"
											value={tour.meta_keywords ?? ''}
										/>
									</div>
								</div>
								<div class="mt-4 flex gap-2">
									<button type="submit" class="btn btn-primary btn-sm" disabled={editSaving.seo}>
										{#if editSaving.seo}<span class="loading loading-sm loading-spinner"
											></span>{/if}
										Save
									</button>
									<button
										type="button"
										class="btn btn-ghost btn-sm"
										onclick={() => toggleEdit('seo')}>Cancel</button
									>
								</div>
							</form>
						{:else}
							<dl class="space-y-3 text-sm">
								{#if tour.meta_title}
									<div>
										<dt class="text-base-content/50">Meta Title</dt>
										<dd class="font-medium">{tour.meta_title}</dd>
									</div>
								{/if}
								{#if tour.meta_description}
									<div>
										<dt class="text-base-content/50">Meta Description</dt>
										<dd class="text-base-content/70">{tour.meta_description}</dd>
									</div>
								{/if}
								{#if tour.meta_keywords}
									<div>
										<dt class="text-base-content/50">Meta Keywords</dt>
										<dd class="flex flex-wrap gap-1">
											{#each String(tour.meta_keywords).split(',') as kw}
												{#if kw.trim()}
													<span class="badge badge-ghost badge-sm">{kw.trim()}</span>
												{/if}
											{/each}
										</dd>
									</div>
								{/if}
							</dl>
						{/if}
					</div>
				{/if}

				<!-- Meta -->
				<div class="rounded-lg bg-base-100 p-6 shadow-sm">
					<dl class="space-y-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<dt class="text-base-content/50">Created</dt>
							<dd class="font-medium">{formatDate(tour.created_at)}</dd>
						</div>
						<div class="flex items-center justify-between gap-3">
							<dt class="text-base-content/50">Updated</dt>
							<dd class="font-medium">{formatDate(tour.updated_at)}</dd>
						</div>
						<div class="flex items-center justify-between gap-3">
							<dt class="text-base-content/50">Created By</dt>
							<dd class="font-medium">{tour.created_by?.name || tour.created_by || '—'}</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	</div>
</div>
