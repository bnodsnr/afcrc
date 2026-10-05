<!-- DataTable.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Column } from './types';
    import { fade } from 'svelte/transition';

    export let data: any[] = [];
    export let columns: Column[] = [];
    export let pageSize: number = 10;
    export let searchable: boolean = true;

    const dispatch = createEventDispatcher();

    // Pagination state
    let currentPage = 1;
    let searchQuery = '';

    // Sorting state
    let sortColumn: string | null = null;
    let sortDirection: 'asc' | 'desc' = 'asc';

    $: totalPages = Math.ceil(filteredData.length / pageSize);
    $: startIndex = (currentPage - 1) * pageSize;
    $: endIndex = startIndex + pageSize;

    // Filter data based on search query
    $: filteredData = searchQuery
        ? data.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : data;

    // Sort data
    $: sortedData = sortColumn
        ? [...filteredData].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];
            const modifier = sortDirection === 'asc' ? 1 : -1;
            return aVal < bVal ? -1 * modifier : aVal > bVal ? 1 * modifier : 0;
        })
        : filteredData;

    // Get current page data
    $: paginatedData = sortedData.slice(startIndex, endIndex);

    function handleSort(column: string) {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'asc';
        }
    }

    function handleRowClick(row: any) {
        dispatch('rowClick', row);
    }

    function nextPage() {
        if (currentPage < totalPages) currentPage++;
    }

    function prevPage() {
        if (currentPage > 1) currentPage--;
    }

    function goToPage(page: number) {
        currentPage = page;
    }
</script>

<div class="w-full space-y-4">
    {#if searchable}
        <div class="flex justify-end">
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search..."
                class="input input-bordered w-full max-w-xs"
            />
        </div>
    {/if}

    <div class="overflow-x-auto bg-base-100 rounded-lg shadow">
        <table class="table w-full">
            <thead>
                <tr>
                    {#each columns as column}
                        <th
                            class="cursor-pointer hover:bg-base-200 transition-colors"
                            on:click={() => handleSort(column.field)}
                        >
                            <div class="flex items-center gap-2">
                                {column.header}
                                {#if sortColumn === column.field}
                                    <span class="text-xs opacity-60">
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                {/if}
                            </div>
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#if paginatedData.length === 0}
                    <tr>
                        <td colspan={columns.length} class="text-center py-4">
                            No data found
                        </td>
                    </tr>
                {:else}
                    {#each paginatedData as row}
                        <tr
                            transition:fade
                            class="hover:bg-base-200 cursor-pointer"
                            on:click={() => handleRowClick(row)}
                        >
                            {#each columns as column}
                                <td>
                                    {#if column.format}
                                        {@html column.format(row[column.field])}
                                    {:else}
                                        {row[column.field]}
                                    {/if}
                                </td>
                            {/each}
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
        <div class="flex justify-between items-center">
            <div class="text-sm text-base-content/70">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
            </div>
            <div class="join">
                <button
                    class="join-item btn btn-sm"
                    disabled={currentPage === 1}
                    on:click={() => prevPage()}
                >
                    Previous
                </button>
                {#each Array(totalPages) as _, i}
                    <button
                        class="join-item btn btn-sm {currentPage === i + 1
                            ? 'btn-active'
                            : ''}"
                        on:click={() => goToPage(i + 1)}
                    >
                        {i + 1}
                    </button>
                {/each}
                <button
                    class="join-item btn btn-sm"
                    disabled={currentPage === totalPages}
                    on:click={() => nextPage()}
                >
                    Next
                </button>
            </div>
        </div>
    {/if}
</div>
