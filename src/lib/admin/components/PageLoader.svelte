<script lang="ts">
	import { pageLoader } from '$lib/admin/utils/Pageloader.svelte';
</script>

{#if pageLoader.active}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
		<div
			class="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"
		></div>
	</div>
{/if}
