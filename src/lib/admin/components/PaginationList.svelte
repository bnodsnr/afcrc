<script lang="ts">
	interface Props {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		startItem: number;
		endItem: number;
		itemsPerPage: number;

		itemLabel?: string;

		pageSizeOptions?: number[];

		onPageChange: (page: number) => void;
		onPageSizeChange: (size: number) => void;
	}

	let {
		currentPage,
		totalPages,
		totalItems,
		startItem,
		endItem,
		itemsPerPage,
		itemLabel = 'items',
		pageSizeOptions = [5, 10, 15, 20, 25, 50],
		onPageChange,
		onPageSizeChange
	}: Props = $props();

	function paginationRange() {
		const pages: (number | string)[] = [];

		const maxVisible = 5;

		let start = Math.max(1, currentPage - 2);
		let end = Math.min(totalPages, start + maxVisible - 1);

		if (end - start < maxVisible - 1) {
			start = Math.max(1, end - maxVisible + 1);
		}

		if (start > 1) {
			pages.push(1);

			if (start > 2) pages.push('...');
		}

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}

		if (end < totalPages) {
			if (end < totalPages - 1) pages.push('...');

			pages.push(totalPages);
		}

		return pages;
	}
</script>

<div class="border-t border-base-300 p-4">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<!-- Results -->

		<p class="text-sm text-base-content/70">
			Showing
			<span class="font-semibold">{startItem}</span>
			–
			<span class="font-semibold">{endItem}</span>
			of
			<span class="font-semibold">{totalItems}</span>
			{itemLabel}
		</p>

		<div class="flex flex-wrap items-center gap-4">
			<!-- Page Size -->

			<div class="flex items-center gap-2">
				<label class="text-sm">Rows</label>

				<select
					class="select-bordered select select-sm"
					bind:value={itemsPerPage}
					onchange={(e) => onPageSizeChange(Number((e.target as HTMLSelectElement).value))}
				>
					{#each pageSizeOptions as size}
						<option value={size}>
							{size}
						</option>
					{/each}
				</select>
			</div>

			<!-- Pagination -->

			<div class="join">
				<button
					class="btn join-item btn-outline btn-sm"
					disabled={currentPage === 1}
					onclick={() => onPageChange(currentPage - 1)}
				>
					←
				</button>

				{#each paginationRange() as page}
					{#if page === '...'}
						<button class="btn-disabled btn join-item btn-sm"> ... </button>
					{:else}
						<button
							class:btn-primary={currentPage === page}
							class="btn join-item btn-outline btn-sm"
							onclick={() => onPageChange(page as number)}
						>
							{page}
						</button>
					{/if}
				{/each}

				<button
					class="btn join-item btn-outline btn-sm"
					disabled={currentPage === totalPages}
					onclick={() => onPageChange(currentPage + 1)}
				>
					→
				</button>
			</div>
		</div>
	</div>
</div>
