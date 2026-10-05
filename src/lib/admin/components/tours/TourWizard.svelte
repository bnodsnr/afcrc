<script lang="ts">
	import { enhance } from '$app/forms';
	import { base } from '$lib/admin/paths';
	import { getImageUrl } from '$lib/admin/utils/image';
	import RichTextEditor from '$lib/admin/components/RichTextEditor.svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	let {
		tour,
		token,
		categories = [],
		form = undefined,
		mode = 'create'
	}: {
		tour?: any;
		token: string;
		categories: { id: number; name: string; slug: string }[];
		form?: any;
		mode?: 'create' | 'edit';
	} = $props();

	const steps = [
		{ id: 'general', label: 'General' },
		{ id: 'pricing', label: 'Pricing & Details' },
		{ id: 'lists', label: 'Highlights' },
		{ id: 'included', label: 'Includes' },
		{ id: 'gallery', label: 'Gallery' },
		{ id: 'faq', label: 'FAQ' },
		{ id: 'itinerary', label: 'Itinerary' },
		{ id: 'departures', label: 'Departures' },
		{ id: 'seo', label: 'SEO' }
	];

	const initialForm = tour ?? form;
	const isEdit = mode === 'edit';

	let loading = $state(false);
	let thumbnailName = $state('');
	let stepIndex = $state(0);
	let tourId = $state<number>(tour?.id ?? 0);
	let notice = $state('');
	let thumbnailPreview = $state(tour?.thumbnail ?? '');

	const toList = (items: unknown[] | null | undefined): string[] =>
		(items ?? []).map((item) =>
			typeof item === 'string'
				? item
				: String(
						(item as Record<string, unknown>)?.title ??
							(item as Record<string, unknown>)?.question ??
							(item as Record<string, unknown>)?.name ??
							''
					)
		);

	type ItineraryRow = {
		id?: number;
		day: number;
		title: string;
		overnight: string;
		description: string;
		meals: string;
		accommodation: string;
		transportation: string;
		activities: string;
	};
	type DepartureRow = {
		id?: number;
		depDate: string;
		retDate: string;
		seats: number;
		status: string;
	};

	let itineraries = $state<ItineraryRow[]>(
		tour?.itineraries?.length
			? tour.itineraries.map((it: any) => ({
					id: it.id,
					day: it.day ?? 1,
					title: it.title ?? '',
					overnight: it.overnight_location ?? '',
					description: it.description ?? '',
					meals: it.meals ?? '',
					accommodation: it.accommodation ?? '',
					transportation: it.transportation ?? '',
					activities: Array.isArray(it.activities)
						? it.activities.join(', ')
						: (it.activities ?? '')
				}))
			: []
	);
	let departures = $state<DepartureRow[]>(
		tour?.departures?.length
			? tour.departures.map((dep: any) => ({
					id: dep.id,
					depDate: dep.departure_date ?? '',
					retDate: dep.return_date ?? '',
					seats: dep.available_seats ?? 10,
					status: dep.status ?? 'open'
				}))
			: []
	);
	let highlightItems = $state<string[]>(tour?.highlights?.length ? toList(tour.highlights) : ['']);
	let includeItems = $state<string[]>(tour?.includes?.length ? toList(tour.includes) : ['']);
	let excludeItems = $state<string[]>(tour?.excludes?.length ? toList(tour.excludes) : ['']);
	let galleryUploads = $state<string[]>(
		(tour?.gallery ?? [])
			.map((item: unknown) =>
				typeof item === 'string' ? item : String((item as Record<string, unknown>)?.image ?? '')
			)
			.filter((path: string) => path.length > 0)
	);
	let galleryUrls = $state<string[]>(['']);
	let galleryError = $state('');
	let uploadingGallery = $state(false);
	let description = $state(initialForm?.description ?? '');
	let faqText = $state(
		tour?.faq?.length
			? tour.faq
					.map((q: any) => `${q.question ?? ''}${q.answer ? ` | ${q.answer}` : ''}`)
					.join('\n')
			: (initialForm?.faq ?? '')
	);

	let galleryJson = $derived(
		JSON.stringify([
			...galleryUploads.map((image) => ({ image })),
			...galleryUrls
				.map((u) => u.trim())
				.filter((u) => u.length > 0)
				.map((image) => ({ image }))
		])
	);

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
				headers: { Authorization: `Bearer ${token}` },
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

	function removeGalleryUpload(i: number) {
		galleryUploads = galleryUploads.filter((_, idx) => idx !== i);
	}

	function addItinerary() {
		const nextDay = itineraries.length + 1;
		itineraries = [
			...itineraries,
			{
				day: nextDay,
				title: '',
				overnight: '',
				description: '',
				meals: '',
				accommodation: '',
				transportation: '',
				activities: ''
			}
		];
	}
	function removeItinerary(i: number) {
		itineraries = itineraries.filter((_, idx) => idx !== i);
	}
	function addDeparture() {
		departures = [...departures, { depDate: '', retDate: '', seats: 10, status: 'open' }];
	}
	function removeDeparture(i: number) {
		departures = departures.filter((_, idx) => idx !== i);
	}
	function addListItem(list: string[]) {
		list.push('');
	}
	function removeListItem(list: string[], i: number) {
		list.splice(i, 1);
	}

	function goToStep(i: number) {
		if (i === stepIndex) return;
		stepIndex = i;
		notice = '';
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
			<span class="text-base-content/60">{isEdit ? 'Edit Tour' : 'Create Tour'}</span>
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
				<span>{form.message || 'Tour created successfully!'}</span>
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
		{#if notice}
			<div class="mb-6 alert alert-info">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>{notice}</span>
			</div>
		{/if}

		<form
			method="POST"
			enctype="multipart/form-data"
			use:enhance={() => {
				loading = true;
				notice = '';
				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') {
						const data = result.data as { tourId?: number; message?: string };
						if (data?.tourId) tourId = data.tourId;
						if (stepIndex < steps.length - 1) {
							notice = data?.message || 'Saved. Moving to the next section...';
							stepIndex = stepIndex + 1;
							loading = false;
						} else {
							notice = isEdit ? 'Tour updated successfully!' : 'Tour created successfully!';
							await new Promise((resolve) => setTimeout(resolve, 1800));
							window.location.href = `${base}/tours`;
						}
					} else {
						loading = false;
					}
				};
			}}
		>
			<input type="hidden" name="step" value={steps[stepIndex].id} />
			<input type="hidden" name="tour_id" value={tourId} />
			<!-- Step indicator -->
			<div class="mb-8 overflow-x-auto">
				<ol class="steps w-full min-w-[760px]">
					{#each steps as s, i (s.id)}
						<li
							class="step {i < stepIndex ? 'step-success' : i === stepIndex ? 'step-primary' : ''}"
						>
							<button
								type="button"
								class="btn btn-ghost btn-sm min-h-0 px-1 py-0.5 font-medium"
								onclick={() => goToStep(i)}
							>
								{s.label}
							</button>
						</li>
					{/each}
				</ol>
			</div>

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<!-- Main content -->
				<div class="space-y-6 lg:col-span-2">
					<!-- ============ GENERAL ============ -->
					<fieldset hidden={stepIndex !== 0} disabled={stepIndex !== 0}>
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<h2 class="mb-6 text-xl font-semibold">General Information</h2>
							<div class="space-y-4">
								<div class="form-control">
									<label class="label" for="title">
										<span class="label-text font-medium">Tour Title *</span>
									</label>
									<input
										type="text"
										id="title"
										name="title"
										class="input-bordered input w-full"
										placeholder="e.g. Everest Base Camp Trek"
										required
										value={initialForm?.title || ''}
									/>
								</div>

								<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div class="form-control">
										<label class="label" for="category">
											<span class="label-text font-medium">Category *</span>
										</label>
										<select
											id="category"
											name="category"
											class="select-bordered select w-full"
											required
											value={initialForm?.category?.id ?? initialForm?.category ?? ''}
										>
											<option value="" disabled>Select category</option>
											{#each categories as cat (cat.id)}
												<option value={cat.id}>{cat.name}</option>
											{/each}
										</select>
									</div>
									<div class="form-control">
										<label class="label" for="status">
											<span class="label-text font-medium">Status</span>
										</label>
										<select
											id="status"
											name="status"
											class="select-bordered select w-full"
											value={initialForm?.status || 'draft'}
										>
											<option value="draft">Draft</option>
											<option value="published">Published</option>
											<option value="archived">Archived</option>
										</select>
									</div>
								</div>

								<div class="form-control">
									<label class="label" for="short_description">
										<span class="label-text font-medium">Short Description</span>
									</label>
									<textarea
										id="short_description"
										name="short_description"
										class="textarea-bordered textarea w-full"
										rows="2"
										placeholder="One-line summary shown in listings"
										>{initialForm?.short_description || ''}</textarea
									>
								</div>

								<RichTextEditor
									name="description"
									bind:value={description}
									label="Full Description"
									placeholder="Detailed tour description"
								/>

								<div class="form-control">
									<label class="label" for="thumbnail">
										<span class="label-text font-medium">Thumbnail Image {isEdit ? '' : '*'}</span>
									</label>
									{#if isEdit && thumbnailPreview}
										<div class="mb-2 flex items-center gap-3">
											<img
												src={getImageUrl(thumbnailPreview)}
												alt="Current thumbnail"
												class="h-16 w-24 rounded-lg object-cover"
											/>
											<span class="text-xs text-base-content/60">Current thumbnail</span>
										</div>
									{/if}
									<input
										type="file"
										id="thumbnail"
										name="thumbnail"
										class="file-input-bordered file-input w-full"
										accept="image/*"
										required={!isEdit}
										onchange={(e) => {
											const f = (e.currentTarget as HTMLInputElement).files?.[0];
											thumbnailName = f ? f.name : '';
										}}
									/>
									{#if thumbnailName}
										<p class="mt-1 text-xs text-base-content/60">Selected: {thumbnailName}</p>
									{:else if isEdit}
										<p class="mt-1 text-xs text-base-content/50">
											Leave empty to keep the current thumbnail.
										</p>
									{/if}
								</div>
							</div>
						</div>
					</fieldset>

					<!-- ============ PRICING & DETAILS ============ -->
					<fieldset hidden={stepIndex !== 1} disabled={stepIndex !== 1}>
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<h2 class="mb-6 text-xl font-semibold">Pricing & Details</h2>
							<div class="space-y-4">
								<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
									<div class="form-control">
										<label class="label" for="currency">
											<span class="label-text font-medium">Currency</span>
										</label>
										<select
											id="currency"
											name="currency"
											class="select-bordered select w-full"
											value={initialForm?.currency || 'USD'}
										>
											<option value="USD">USD</option>
											<option value="EUR">EUR</option>
											<option value="GBP">GBP</option>
											<option value="NPR">NPR</option>
											<option value="INR">INR</option>
											<option value="AUD">AUD</option>
										</select>
									</div>
									<div class="form-control">
										<label class="label" for="starting_price">
											<span class="label-text font-medium">Starting Price</span>
										</label>
										<input
											type="number"
											step="0.01"
											min="0"
											id="starting_price"
											name="starting_price"
											class="input-bordered input w-full"
											placeholder="1200.00"
											value={initialForm?.starting_price || ''}
										/>
									</div>
									<div class="form-control">
										<label class="label" for="discount_price">
											<span class="label-text font-medium">Discount Price</span>
										</label>
										<input
											type="number"
											step="0.01"
											min="0"
											id="discount_price"
											name="discount_price"
											class="input-bordered input w-full"
											placeholder="999.00"
											value={initialForm?.discount_price || ''}
										/>
									</div>
								</div>

								<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div class="form-control">
										<label class="label" for="duration_days">
											<span class="label-text font-medium">Duration (Days)</span>
										</label>
										<input
											type="number"
											min="1"
											id="duration_days"
											name="duration_days"
											class="input-bordered input w-full"
											placeholder="14"
											value={initialForm?.duration_days || '1'}
										/>
									</div>
									<div class="form-control">
										<label class="label" for="duration_nights">
											<span class="label-text font-medium">Duration (Nights)</span>
										</label>
										<input
											type="number"
											min="0"
											id="duration_nights"
											name="duration_nights"
											class="input-bordered input w-full"
											placeholder="13"
											value={initialForm?.duration_nights || '0'}
										/>
									</div>
								</div>

								<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div class="form-control">
										<label class="label" for="starting_location">
											<span class="label-text font-medium">Starting Location</span>
										</label>
										<input
											type="text"
											id="starting_location"
											name="starting_location"
											class="input-bordered input w-full"
											placeholder="Kathmandu"
											value={initialForm?.starting_location || ''}
										/>
									</div>
									<div class="form-control">
										<label class="label" for="ending_location">
											<span class="label-text font-medium">Ending Location</span>
										</label>
										<input
											type="text"
											id="ending_location"
											name="ending_location"
											class="input-bordered input w-full"
											placeholder="Kathmandu"
											value={initialForm?.ending_location || ''}
										/>
									</div>
								</div>

								<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
									<div class="form-control">
										<label class="label" for="minimum_group_size">
											<span class="label-text font-medium">Min Group Size</span>
										</label>
										<input
											type="number"
											min="1"
											id="minimum_group_size"
											name="minimum_group_size"
											class="input-bordered input w-full"
											placeholder="2"
											value={initialForm?.minimum_group_size || '1'}
										/>
									</div>
									<div class="form-control">
										<label class="label" for="maximum_group_size">
											<span class="label-text font-medium">Max Group Size</span>
										</label>
										<input
											type="number"
											min="1"
											id="maximum_group_size"
											name="maximum_group_size"
											class="input-bordered input w-full"
											placeholder="16"
											value={initialForm?.maximum_group_size || '20'}
										/>
									</div>
									<div class="form-control">
										<label class="label" for="difficulty">
											<span class="label-text font-medium">Difficulty</span>
										</label>
										<select
											id="difficulty"
											name="difficulty"
											class="select-bordered select w-full"
											value={initialForm?.difficulty || 'moderate'}
										>
											<option value="easy">Easy</option>
											<option value="moderate">Moderate</option>
											<option value="challenging">Challenging</option>
											<option value="hard">Hard</option>
										</select>
									</div>
								</div>

								<div class="form-control">
									<label class="label" for="transportation">
										<span class="label-text font-medium">Transportation</span>
									</label>
									<input
										type="text"
										id="transportation"
										name="transportation"
										class="input-bordered input w-full"
										placeholder="Private vehicle, flights"
										value={initialForm?.transportation || ''}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="accommodation">
										<span class="label-text font-medium">Accommodation</span>
									</label>
									<input
										type="text"
										id="accommodation"
										name="accommodation"
										class="input-bordered input w-full"
										placeholder="Tea houses, 4* hotels"
										value={initialForm?.accommodation || ''}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="meals">
										<span class="label-text font-medium">Meals</span>
									</label>
									<input
										type="text"
										id="meals"
										name="meals"
										class="input-bordered input w-full"
										placeholder="Breakfast, Lunch, Dinner"
										value={initialForm?.meals || ''}
									/>
								</div>
							</div>
						</div>
					</fieldset>

					<!-- ============ LISTS ============ -->
					<fieldset hidden={stepIndex !== 2} disabled={stepIndex !== 2}>
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<div class="mb-6 flex items-center justify-between">
								<h2 class="text-xl font-semibold">Highlights</h2>
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
											name="highlights[]"
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
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
												/></svg
											>
										</button>
									</div>
								{/each}
							</div>
						</div>
					</fieldset>

					<!-- ============ INCLUDED & EXCLUDED ============ -->
					<fieldset hidden={stepIndex !== 3} disabled={stepIndex !== 3}>
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<div class="mb-6 flex items-center justify-between">
								<h2 class="text-xl font-semibold">What's Included</h2>
								<button
									type="button"
									class="btn btn-sm btn-primary"
									onclick={() => addListItem(includeItems)}>+ Add Item</button
								>
							</div>
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
											name="includes[]"
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
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
												/></svg
											>
										</button>
									</div>
								{/each}
							</div>

							<div class="mb-6 mt-8 flex items-center justify-between">
								<h2 class="text-xl font-semibold">What's Excluded</h2>
								<button
									type="button"
									class="btn btn-sm btn-primary"
									onclick={() => addListItem(excludeItems)}>+ Add Item</button
								>
							</div>
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
											name="excludes[]"
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
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
												/></svg
											>
										</button>
									</div>
								{/each}
							</div>
						</div>
					</fieldset>

					<!-- ============ GALLERY ============ -->
					<fieldset hidden={stepIndex !== 4} disabled={stepIndex !== 4}>
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<h2 class="mb-6 text-xl font-semibold">Gallery</h2>
							<div class="space-y-4">
								<div class="form-control">
									<label class="label" for="gallery-files">
										<span class="label-text font-medium">Upload Images</span>
										<span class="label-text text-xs text-base-content/50"
											>You can select multiple files</span
										>
									</label>
									<input
										type="file"
										id="gallery-files"
										accept="image/*"
										multiple
										class="file-input-bordered file-input w-full"
										disabled={uploadingGallery}
										onchange={uploadGalleryFiles}
									/>
									{#if uploadingGallery}
										<p class="mt-2 flex items-center gap-2 text-xs text-base-content/60">
											<span class="loading loading-sm loading-spinner"></span>
											Uploading...
										</p>
									{/if}
									{#if galleryError}
										<p class="mt-2 text-xs text-error">{galleryError}</p>
									{/if}
								</div>

								{#if galleryUploads.length > 0}
									<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
										{#each galleryUploads as url, i (url + i)}
											<div class="group relative overflow-hidden rounded-lg border border-base-300">
												<img
													src={getImageUrl(url)}
													alt="Gallery image"
													class="h-28 w-full object-cover"
												/>
												<button
													type="button"
													class="btn absolute top-1 right-1 btn-circle btn-sm btn-error opacity-0 transition-opacity group-hover:opacity-100"
													onclick={() => removeGalleryUpload(i)}
													aria-label="Remove uploaded image"
												>
													<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
														><path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M6 18L18 6M6 6l12 12"
														/></svg
													>
												</button>
											</div>
										{/each}
									</div>
								{/if}

								<div class="divider"></div>

								<div class="mb-2 flex items-center justify-between">
									<span class="label-text font-medium">Or add image URLs</span>
									<button
										type="button"
										class="btn btn-sm btn-primary"
										onclick={() => addListItem(galleryUrls)}>+ Add URL</button
									>
								</div>
								{#if galleryUrls.length === 0}
									<p class="text-sm text-base-content/50">No URLs yet. Click "Add URL" to start.</p>
								{/if}
								<div class="space-y-3">
									{#each galleryUrls as url, i (i)}
										<div class="flex items-center gap-2">
											<input
												type="text"
												name="gallery_urls[]"
												class="input-bordered input w-full"
												placeholder="https://example.com/img1.jpg"
												bind:value={galleryUrls[i]}
											/>
											<button
												type="button"
												class="btn btn-circle btn-sm btn-ghost"
												onclick={() => removeListItem(galleryUrls, i)}
												aria-label="Remove URL"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
													><path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/></svg
												>
											</button>
										</div>
									{/each}
								</div>

								<input type="hidden" name="gallery" value={galleryJson} />
							</div>
						</div>
					</fieldset>

					<!-- ============ FAQ ============ -->
					<fieldset hidden={stepIndex !== 5} disabled={stepIndex !== 5}>
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<h2 class="mb-6 text-xl font-semibold">FAQ</h2>
							<div class="space-y-4">
								<div class="form-control">
									<label class="label" for="faq">
										<span class="label-text font-medium">FAQ</span>
										<span class="label-text text-xs text-base-content/50"
											>One per line: Question | Answer</span
										>
									</label>
									<textarea
										id="faq"
										name="faq"
										class="textarea-bordered textarea w-full"
										rows="6"
										placeholder="Best season? | March to May&#10;How hard is it? | Moderate"
										bind:value={faqText}
									></textarea>
								</div>
							</div>
						</div>
					</fieldset>

					<!-- ============ ITINERARY ============ -->
					<fieldset hidden={stepIndex !== 6} disabled={stepIndex !== 6}>
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<div class="mb-6 flex items-center justify-between">
								<h2 class="text-xl font-semibold">
									Day-by-Day Itinerary
									<span class="badge badge-ghost ml-2 align-middle">Optional</span>
								</h2>
								<button type="button" class="btn btn-sm btn-primary" onclick={addItinerary}
									>+ Add Day</button
								>
							</div>
							{#if itineraries.length === 0}
								<p class="text-sm text-base-content/50">
									No itinerary days yet. Add a day-by-day plan, or skip this section if the tour has
									no itinerary.
								</p>
							{/if}
							<div class="space-y-6">
								{#each itineraries as itin, i (i)}
									<div class="rounded-lg border border-base-300 p-4">
										<input type="hidden" name="itin_id[]" value={itin.id ?? ''} />
										<div class="mb-3 flex items-center justify-between">
											<h3 class="font-semibold">Day {i + 1}</h3>
											<button
												type="button"
												class="btn btn-circle btn-sm btn-ghost"
												onclick={() => removeItinerary(i)}
												aria-label="Remove day"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
													><path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/></svg
												>
											</button>
										</div>
										<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
											<div class="form-control">
												<label class="label"><span class="label-text">Day *</span></label>
												<input
													type="number"
													min="1"
													name="itin_day[]"
													class="input-bordered input w-full"
													value={itin.day}
												/>
											</div>
											<div class="form-control md:col-span-2">
												<label class="label"><span class="label-text">Title *</span></label>
												<input
													type="text"
													name="itin_title[]"
													class="input-bordered input w-full"
													placeholder="Arrival & welcome"
													bind:value={itin.title}
												/>
											</div>
										</div>
										<div class="mt-3">
											<RichTextEditor
												name="itin_description[]"
												bind:value={itin.description}
												label="Description"
												placeholder="What happens on this day"
											/>
										</div>
										<div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
											<input
												type="text"
												name="itin_overnight[]"
												class="input-bordered input w-full"
												placeholder="Overnight"
												bind:value={itin.overnight}
											/>
											<input
												type="text"
												name="itin_meals[]"
												class="input-bordered input w-full"
												placeholder="Meals (B, L, D)"
												bind:value={itin.meals}
											/>
											<input
												type="text"
												name="itin_transportation[]"
												class="input-bordered input w-full"
												placeholder="Transport"
												bind:value={itin.transportation}
											/>
										</div>
										<input
											type="text"
											name="itin_accommodation[]"
											class="input-bordered input mt-3 w-full"
											placeholder="Accommodation"
											bind:value={itin.accommodation}
										/>
										<input
											type="text"
											name="itin_activities[]"
											class="input-bordered input mt-3 w-full"
											placeholder="Activities (comma separated)"
											bind:value={itin.activities}
										/>
									</div>
								{/each}
							</div>
						</div>
					</fieldset>

					<!-- ============ DEPARTURES ============ -->
					<fieldset hidden={stepIndex !== 7} disabled={stepIndex !== 7}>
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<div class="mb-6 flex items-center justify-between">
								<h2 class="text-xl font-semibold">
									Tour Departures
									<span class="badge badge-ghost ml-2 align-middle">Optional</span>
								</h2>
								<button type="button" class="btn btn-sm btn-primary" onclick={addDeparture}
									>+ Add Departure</button
								>
							</div>
							{#if departures.length === 0}
								<p class="text-sm text-base-content/50">
									No departures yet. Add departure dates, or skip this section if the tour has no
									scheduled departures.
								</p>
							{/if}
							<div class="space-y-4">
								{#each departures as dep, i (i)}
									<div class="rounded-lg border border-base-300 p-4">
										<input type="hidden" name="dep_id[]" value={dep.id ?? ''} />
										<div class="mb-3 flex items-center justify-between">
											<h3 class="font-semibold">Departure {i + 1}</h3>
											<button
												type="button"
												class="btn btn-circle btn-sm btn-ghost"
												onclick={() => removeDeparture(i)}
												aria-label="Remove departure"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
													><path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/></svg
												>
											</button>
										</div>
										<div class="grid grid-cols-1 gap-3 md:grid-cols-4">
											<div class="form-control">
												<label class="label"><span class="label-text">Departure Date *</span></label
												>
												<input
													type="date"
													name="dep_date[]"
													class="input-bordered input w-full"
													bind:value={dep.depDate}
												/>
											</div>
											<div class="form-control">
												<label class="label"><span class="label-text">Return Date *</span></label>
												<input
													type="date"
													name="dep_return[]"
													class="input-bordered input w-full"
													bind:value={dep.retDate}
												/>
											</div>
											<div class="form-control">
												<label class="label"><span class="label-text">Seats</span></label>
												<input
													type="number"
													min="0"
													name="dep_seats[]"
													class="input-bordered input w-full"
													bind:value={dep.seats}
												/>
											</div>
											<div class="form-control">
												<label class="label"><span class="label-text">Status</span></label>
												<select
													name="dep_status[]"
													class="select-bordered select w-full"
													bind:value={dep.status}
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
						</div>
					</fieldset>

					<!-- ============ SEO ============ -->
					<fieldset hidden={stepIndex !== 8} disabled={stepIndex !== 8}>
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<h2 class="mb-6 text-xl font-semibold">SEO</h2>
							<div class="space-y-4">
								<div class="form-control">
									<label class="label" for="meta_title">
										<span class="label-text font-medium">Meta Title</span>
									</label>
									<input
										type="text"
										id="meta_title"
										name="meta_title"
										class="input-bordered input w-full"
										value={initialForm?.meta_title || ''}
									/>
								</div>
								<div class="form-control">
									<label class="label" for="meta_description">
										<span class="label-text font-medium">Meta Description</span>
									</label>
									<textarea
										id="meta_description"
										name="meta_description"
										class="textarea-bordered textarea w-full"
										rows="3">{initialForm?.meta_description || ''}</textarea
									>
								</div>
								<div class="form-control">
									<label class="label" for="meta_keywords">
										<span class="label-text font-medium">Meta Keywords</span>
									</label>
									<input
										type="text"
										id="meta_keywords"
										name="meta_keywords"
										class="input-bordered input w-full"
										placeholder="trekking, himalayas, nepal"
										value={initialForm?.meta_keywords || ''}
									/>
								</div>
							</div>
						</div>
					</fieldset>
				</div>

				<!-- Sidebar -->
				<div class="space-y-6">
					<div class="rounded-lg bg-base-100 p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-semibold">Promote</h2>
						<div class="form-control">
							<label class="label" for="tour_type">
								<span class="label-text font-medium">Tour Type</span>
							</label>
							<select
								id="tour_type"
								name="tour_type"
								class="select-bordered select w-full"
								value={initialForm?.tour_type || ''}
							>
								<option value="">None</option>
								<option value="featured">Featured</option>
								<option value="popular">Popular</option>
								<option value="best-seller">Best Seller</option>
							</select>
						</div>
						<div class="mt-6 flex flex-col gap-2">
							<button
								type="button"
								class="btn btn-outline"
								disabled={loading || stepIndex === 0}
								onclick={() => goToStep(stepIndex - 1)}
							>
								Back
							</button>
							<button type="submit" class="btn btn-primary w-full" disabled={loading}>
								{#if loading}
									<span class="loading loading-sm loading-spinner"></span>
									Saving...
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									{stepIndex < steps.length - 1 ? 'Save & Continue' : 'Complete Tour'}
								{/if}
							</button>
							<a
								href={isEdit ? `${base}/tours/${tour?.id ?? ''}` : `${base}/tours`}
								class="btn btn-ghost btn-sm mt-1 text-base-content/60">Cancel</a
							>
							<p class="mt-2 text-center text-xs text-base-content/50">
								Section {stepIndex + 1} of {steps.length}
							</p>
						</div>
					</div>
				</div>
			</div>
		</form>
	</div>
</div>
