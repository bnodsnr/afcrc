<script lang="ts">
	import DashboardContent from '../components/ui/DashboardContent.svelte';
	let { data } = $props();
</script>

<DashboardContent dashboardstats={data} />
