<script lang="ts">
	import { base } from '$lib/admin/paths';
	import { page } from '$app/state';
	type BreadcrumbIcon =
		| 'home'
		| 'create'
		| 'edit'
		| 'view'
		| 'delete'
		| 'list'
		| 'settings'
		| 'profile'
		| 'default';

	function getSegmentIcon(segment: string): BreadcrumbIcon {
		const s = segment.toLowerCase();
		if (s === 'dashboard') return 'home';
		if (['create', 'new', 'add'].includes(s)) return 'create';
		if (['edit', 'update', 'modify'].includes(s)) return 'edit';
		if (['view', 'show', 'detail', 'details'].includes(s)) return 'view';
		if (['delete', 'remove'].includes(s)) return 'delete';
		if (['settings', 'setting', 'preferences', 'config'].includes(s)) return 'settings';
		if (['profile', 'account', 'me'].includes(s)) return 'profile';
		if (['list', 'index', 'all'].includes(s)) return 'list';
		if (/^[0-9a-f-]{8,}$/i.test(s) || /^\d+$/.test(s)) return 'view';
		return 'default';
	}

	const baseSegments = base.split('/').filter(Boolean);

	const format = (segment: string) =>
		decodeURIComponent(segment)
			.replace(/[-_]/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase());

	const breadcrumbs = $derived.by(() => {
		let segments = page.url.pathname.split('/').filter(Boolean);
		segments = segments.slice(baseSegments.length);
		segments = segments.filter((s) => s !== 'dashboard');

		return [
			{
				label: 'Dashboard',
				href: `${base}/dashboard`,
				icon: 'home' as BreadcrumbIcon
			},
			...segments.map((segment, index) => ({
				label: format(segment),
				href: `${base}/${segments.slice(0, index + 1).join('/')}`,
				icon: getSegmentIcon(segment)
			}))
		];
	});
</script>

{#snippet breadcrumbIcon(type: BreadcrumbIcon)}
	<svg class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		{#if type === 'home'}
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
			/>
		{:else if type === 'create'}
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		{:else if type === 'edit'}
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z"
			/>
		{:else if type === 'view'}
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
		{:else if type === 'delete'}
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
			/>
		{:else if type === 'settings'}
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
			/>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
			/>
		{:else if type === 'profile'}
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
			/>
		{:else if type === 'list'}
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 6h16M4 10h16M4 14h16M4 18h16"
			/>
		{:else}
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
			/>
		{/if}
	</svg>
{/snippet}

<nav class="breadcrumbs text-sm">
	<ul>
		{#each breadcrumbs as crumb, index}
			<li>
				{#if index === breadcrumbs.length - 1}
					<span class="flex items-center gap-1">
						{@render breadcrumbIcon(crumb.icon)}
						{crumb.label}
					</span>
				{:else}
					<a href={crumb.href} class="flex items-center gap-1">
						{@render breadcrumbIcon(crumb.icon)}
						{crumb.label}
					</a>
				{/if}
			</li>
		{/each}
	</ul>
</nav>
