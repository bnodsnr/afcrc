<script lang="ts">
	import TourWizard from '$lib/admin/components/tours/TourWizard.svelte';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();
</script>

<TourWizard
	mode="create"
	token={data.token}
	categories={data.categories ?? []}
	form={form}
/>
