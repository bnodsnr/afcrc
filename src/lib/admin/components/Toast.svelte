<script lang="ts">
	import { toastStore } from '$lib/admin/utils/tostar.svelte';
	import { fly, fade } from 'svelte/transition';
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
	{#each toastStore.all as t (t.id)}
		<div
			in:fly={{ x: 100, duration: 200 }}
			out:fade={{ duration: 150 }}
			class="flex max-w-xs items-center justify-between gap-3 rounded px-4 py-2 text-sm text-white shadow-lg"
			style="background: {t.type === 'success'
				? 'linear-gradient(90deg,#16a34a,#059669)'
				: t.type === 'error'
					? 'linear-gradient(90deg,#dc2626,#b91c1c)'
					: 'linear-gradient(90deg,#3b82f6,#2563eb)'}"
		>
			<span>{t.message}</span>
			<button
				onclick={() => toastStore.remove(t.id)}
				class="shrink-0 text-white/80 hover:text-white"
				aria-label="Dismiss"
			>
				✕
			</button>
		</div>
	{/each}
</div>
