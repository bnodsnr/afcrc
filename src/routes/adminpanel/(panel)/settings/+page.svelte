<script lang="ts">
	import { base } from '$lib/admin/paths';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let settings = data.data.data;

	// =======================================
	// Tab error tracking — shows dot on tab
	// with invalid fields even when hidden
	// =======================================
	type TabId = 'general' | 'address' | 'contact' | 'media' | 'social';

	const tabFields: Record<TabId, string[]> = {
		general: ['email', 'working_hours', 'map_embed_code'],
		address: ['address_line1', 'address_line2', 'city', 'state', 'country', 'postal_code'],
		contact: ['phone_number'],
		media: ['logo', 'favicon'],
		social: [
			'facebook_url',
			'twitter_url',
			'instagram_url',
			'linkedin_url',
			'tiktok_url',
			'youtube_url'
		]
	};

	const tabs = [
		{ id: 'general' as TabId, label: 'General Info', icon: '🏢' },
		{ id: 'address' as TabId, label: 'Address', icon: '📍' },
		{ id: 'contact' as TabId, label: 'Contact Info', icon: '📱' },
		{ id: 'media' as TabId, label: 'Media', icon: '🖼️' },
		{ id: 'social' as TabId, label: 'Social Media', icon: '🔗' }
	] as const;

	const socialLinks = [
		{ key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/...' },
		{ key: 'twitter_url', label: 'Twitter', placeholder: 'https://twitter.com/...' },
		{ key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/...' },
		{ key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/...' },
		{ key: 'tiktok_url', label: 'TikTok', placeholder: 'https://tiktok.com/...' },
		{ key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/...' }
	] as const;

	// =======================================
	// Form State
	// =======================================
	let formData = $state({
		address_line1: settings?.address_line1 ?? '',
		address_line2: settings?.address_line2 ?? '',
		city: settings?.city ?? '',
		state: settings?.state ?? '',
		country: settings?.country ?? '',
		postal_code: settings?.postal_code ?? '',
		phone_number: settings?.phone_number ?? '',
		email: settings?.email ?? '',
		working_hours: settings?.working_hours ?? '',
		logo: null as File | null,
		favicon: null as File | null,
		map_embed_code: settings?.map_embed_code ?? '',
		facebook_url: settings?.facebook_url ?? '',
		twitter_url: settings?.twitter_url ?? '',
		instagram_url: settings?.instagram_url ?? '',
		linkedin_url: settings?.linkedin_url ?? '',
		tiktok_url: settings?.tiktok_url ?? '',
		youtube_url: settings?.youtube_url ?? ''
	});

	let imagePreview = $state({
		logo: resolveUrl(settings?.logo),
		favicon: resolveUrl(settings?.favicon)
	});

	let loading = $state(false);
	let success = $state(false);
	let error = $state('');
	let successMessage = $state('');
	let activeTab = $state<TabId>('general');

	function resolveUrl(path?: string): string {
		if (!path) return '';
		return path.startsWith('http') ? path : `${PUBLIC_API_BASE_URL}${path}`;
	}

	// =======================================
	// File Upload
	// =======================================
	function handleFileChange(field: 'logo' | 'favicon', event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		formData[field] = file;
		const reader = new FileReader();
		reader.onload = (e) => (imagePreview[field] = e.target?.result as string);
		reader.readAsDataURL(file);
	}

	// =======================================
	// Reset
	// =======================================
	async function resetSettings() {
		await invalidateAll();
		const fresh = Array.isArray(data.settings) ? data.settings[0] : data.settings;

		const textKeys = Object.keys(formData).filter((k) => k !== 'logo' && k !== 'favicon') as Array<
			keyof typeof formData
		>;

		textKeys.forEach((key) => {
			(formData as any)[key] = fresh?.[key] ?? '';
		});

		imagePreview.logo = resolveUrl(fresh?.logo);
		imagePreview.favicon = resolveUrl(fresh?.favicon);
		formData.logo = null;
		formData.favicon = null;
		error = '';
		success = false;
	}

	// =======================================
	// Single Submit — all tabs, one request
	// =======================================
	async function handleSubmit(e: Event) {
		e.preventDefault();

		try {
			error = '';
			success = false;
			loading = true;

			const submitData = new FormData();

			// ✅ Map formData keys → API expected keys
			const fieldMap: Record<string, string> = {
				address_line1: 'address_line1',
				address_line2: 'address_line2',
				city: 'city',
				state: 'state',
				country: 'country',
				postal_code: 'postal_code',
				phone_number: 'phone_number',
				email: 'email',
				working_hours: 'working_hours',
				map_embed_code: 'map_embed_code',
				facebook_url: 'facebook_url',
				twitter_url: 'twitter_url',
				instagram_url: 'instagram_url',
				linkedin_url: 'linkedin_url',
				tiktok_url: 'tiktok_url',
				youtube_url: 'youtube_url'
			};

			// Append with mapped API key names
			(Object.keys(fieldMap) as Array<keyof typeof fieldMap>).forEach((formKey) => {
				const apiKey = fieldMap[formKey];
				const value = formData[formKey as keyof typeof formData];
				submitData.append(apiKey, (value as string) ?? '');
			});

			// Files
			if (formData.logo instanceof File) {
				submitData.append('logo', formData.logo, formData.logo.name);
			}
			if (formData.favicon instanceof File) {
				submitData.append('favicon', formData.favicon, formData.favicon.name);
			}

			const response = await fetch('?/updateSettings', {
				method: 'POST',
				body: submitData
			});

			const result = await response.json();

			if (result.type === 'success') {
				success = true;
				successMessage = 'Settings saved successfully!';
				await invalidateAll();
			} else {
				error = result.data?.error || 'Failed to save settings';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	// Auto-dismiss success
	$effect(() => {
		if (success) {
			const t = setTimeout(() => (success = false), 3000);
			return () => clearTimeout(t);
		}
	});
</script>

<div class="min-h-screen">
	<div class="">
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
			<span class="text-base-content/60">Settings</span>
		</div>

		<!-- Header -->
		<div class="mb-6 rounded-lg">
			<h1 class="mb-2 text-3xl font-bold">Website Settings</h1>
			<p class="text-base-content/60">
				Manage your website information, contact details, and social media links
			</p>
		</div>

		<!-- Alerts -->
		{#if success}
			<div class="mb-6 alert alert-success shadow-lg" role="alert">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>{successMessage}</span>
			</div>
		{/if}

		{#if error}
			<div class="mb-6 alert alert-error shadow-lg" role="alert">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				<span>{error}</span>
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
			<!-- Sidebar -->
			<div class="lg:col-span-1">
				<div class="sticky top-6 rounded-lg bg-base-100 p-4 shadow-sm">
					<h3 class="mb-4 font-bold text-base-content">Settings Sections</h3>
					<nav class="space-y-2">
						{#each tabs as item}
							<button
								type="button"
								onclick={() => (activeTab = item.id)}
								class="btn relative w-full justify-start text-left btn-ghost
                                    {activeTab === item.id ? 'btn-primary' : ''}"
							>
								<span>{item.icon}</span>
								<span>{item.label}</span>
							</button>
						{/each}
					</nav>
				</div>
			</div>

			<!-- Single form wraps ALL tabs -->
			<div class="lg:col-span-3">
				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- General Tab -->
					{#if activeTab === 'general'}
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<h2 class="mb-6 flex items-center gap-2 text-xl font-bold">
								<span class="text-2xl">🏢</span> General Information
							</h2>
							<div class="form-control mb-4">
								<label class="label" for="email">
									<span class="label-text font-medium">Email Address</span>
								</label>
								<input
									type="email"
									id="email"
									placeholder="contact@example.com"
									class="input-bordered input w-full"
									bind:value={formData.email}
								/>
							</div>
							<div class="form-control mb-4">
								<label class="label" for="working_hours">
									<span class="label-text font-medium">Working Hours</span>
								</label>
								<input
									type="text"
									id="working_hours"
									placeholder="e.g., Mon-Fri: 9AM-5PM"
									class="input-bordered input w-full"
									bind:value={formData.working_hours}
								/>
								<label class="label">
									<span class="label-text-alt text-base-content/60"
										>e.g., Mon-Fri: 9AM-5PM, Sat: 10AM-3PM</span
									>
								</label>
							</div>
							<div class="form-control mb-4">
								<label class="label" for="map_embed_code">
									<span class="label-text font-medium">Map Embed Code</span>
								</label>
								<textarea
									id="map_embed_code"
									placeholder="Paste your Google Maps embed code here"
									class="textarea-bordered textarea h-32 w-full"
									bind:value={formData.map_embed_code}
								/>
							</div>
						</div>
					{/if}

					<!-- Address Tab -->
					{#if activeTab === 'address'}
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<h2 class="mb-6 flex items-center gap-2 text-xl font-bold">
								<span class="text-2xl">📍</span> Address Information
							</h2>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								{#each [{ id: 'address_line1', label: 'Address Line 1', placeholder: 'Street address' }, { id: 'address_line2', label: 'Address Line 2', placeholder: 'Apt, suite, etc.' }, { id: 'city', label: 'City', placeholder: 'City' }, { id: 'state', label: 'State / Province', placeholder: 'State' }, { id: 'country', label: 'Country', placeholder: 'Country' }, { id: 'postal_code', label: 'Postal Code', placeholder: 'ZIP / Postal' }] as field}
									<div class="form-control">
										<label class="label" for={field.id}>
											<span class="label-text font-medium">{field.label}</span>
										</label>
										<input
											type="text"
											id={field.id}
											placeholder={field.placeholder}
											class="input-bordered input w-full"
											bind:value={formData[field.id as keyof typeof formData] as string}
										/>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Contact Tab -->
					{#if activeTab === 'contact'}
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<h2 class="mb-6 flex items-center gap-2 text-xl font-bold">
								<span class="text-2xl">📱</span> Contact Information
							</h2>
							<div class="form-control mb-4">
								<label class="label" for="phone_number">
									<span class="label-text font-medium">Phone Number</span>
								</label>
								<input
									type="tel"
									id="phone_number"
									placeholder="+1 (555) 000-0000"
									class="input-bordered input w-full"
									bind:value={formData.phone_number}
								/>
							</div>
						</div>
					{/if}

					<!-- Media Tab -->
					{#if activeTab === 'media'}
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<h2 class="mb-6 flex items-center gap-2 text-xl font-bold">
								<span class="text-2xl">🖼️</span> Media Files
							</h2>
							{#each ['logo', 'favicon'] as const as field}
								<div class="mb-8">
									<div class="form-control mb-4">
										<label class="label" for={field}>
											<span class="label-text font-medium capitalize">{field}</span>
										</label>
										<input
											type="file"
											id={field}
											accept="image/*"
											class="file-input-bordered file-input w-full"
											onchange={(e) => handleFileChange(field, e)}
										/>
										<label class="label">
											<span class="label-text-alt text-base-content/60">
												{field === 'logo'
													? 'Recommended: 200x200px or larger'
													: 'Recommended: 32x32px (ICO, PNG, or JPG)'}
											</span>
										</label>
									</div>
									{#if imagePreview[field]}
										<div class="mt-4">
											<p class="mb-2 text-sm font-medium capitalize">{field} Preview:</p>
											<div class="inline-block rounded-lg bg-base-200 p-4">
												<img
													src={imagePreview[field]}
													alt="{field} preview"
													class="{field === 'logo' ? 'h-24 w-24' : 'h-8 w-8'} object-contain"
												/>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					<!-- Social Tab -->
					{#if activeTab === 'social'}
						<div class="rounded-lg bg-base-100 p-6 shadow-sm">
							<h2 class="mb-6 flex items-center gap-2 text-xl font-bold">
								<span class="text-2xl">🔗</span> Social Media Links
							</h2>
							<div class="space-y-4">
								{#each socialLinks as item}
									<div class="form-control">
										<label class="label" for={item.key}>
											<span class="label-text font-medium">{item.label}</span>
										</label>
										<input
											type="url"
											id={item.key}
											placeholder={item.placeholder}
											class="input-bordered input w-full"
											bind:value={formData[item.key]}
										/>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Actions — always visible -->
					<div class="flex gap-4 rounded-lg bg-base-100 p-6 shadow-sm">
						<button type="submit" disabled={loading} class="btn gap-2 btn-primary">
							{#if loading}
								<span class="loading loading-sm loading-spinner"></span>
							{/if}
							Save Settings
						</button>
						<button type="button" onclick={resetSettings} disabled={loading} class="btn btn-ghost">
							Reset
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
