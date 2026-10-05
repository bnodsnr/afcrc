<script lang="ts">
    import DataTable from '../components/ui/DataTable/DataTable.svelte';
    import type { Column } from '../components/ui/DataTable/types';
    import CreateLeagueModal from '../components/ui/CreateLeagueModal.svelte';
    import { fade } from 'svelte/transition';

    let viewMode: 'list' | 'card' = 'list';
    let searchQuery = '';
    let showCreateModal = false;

    const columns: Column[] = [
        { field: 'name', header: 'League Name' },
        { field: 'season', header: 'Season' },
        { field: 'teams', header: 'Teams' },
        {
            field: 'status',
            header: 'Status',
            format: (value) => `<div class="badge badge-${value.toLowerCase() === 'active' ? 'success' : 'warning'}">${value}</div>`
        },
        {
            field: 'actions',
            header: 'Actions',
            format: () => `
                <div class="space-x-2">
                    <button class="btn btn-sm">Edit</button>
                    <button class="btn btn-sm btn-outline">View</button>
                </div>
            `
        }
    ];

    // Example data - replace with actual data from your API
    const leagueData = [
        { 
            name: 'Premier League', 
            season: '2025-2026', 
            teams: 12, 
            status: 'Active',
            logo: 'https://placehold.co/100x100/294BA1/white?text=PL',
            description: 'England\'s top professional football division'
        },
        { 
            name: 'La Liga', 
            season: '2025-2026', 
            teams: 10, 
            status: 'Pending',
            logo: 'https://placehold.co/100x100/C91B1B/white?text=LL',
            description: 'Spain\'s primary football competition'
        },
        { 
            name: 'Bundesliga', 
            season: '2025-2026', 
            teams: 8, 
            status: 'Active',
            logo: 'https://placehold.co/100x100/D4AF37/black?text=BL',
            description: 'Germany\'s premier football league'
        },
        { 
            name: 'Serie A', 
            season: '2025-2026', 
            teams: 14, 
            status: 'Active',
            logo: 'https://placehold.co/100x100/1A5F7A/white?text=SA',
            description: 'Top tier of Italian football'
        },
        { 
            name: 'Ligue 1', 
            season: '2025-2026', 
            teams: 16, 
            status: 'Pending',
            logo: 'https://placehold.co/100x100/002D62/white?text=L1',
            description: 'France\'s primary football competition'
        }
    ];

    $: filteredData = searchQuery
        ? leagueData.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : leagueData;

    function handleRowClick(event: CustomEvent) {
        const row = event.detail;
        console.log('Row clicked:', row);
    }

    function toggleView() {
        viewMode = viewMode === 'list' ? 'card' : 'list';
    }

    function handleCreateLeague(event: CustomEvent) {
        const newLeague = event.detail;
        console.log('Creating new league:', newLeague);
        // Here you would typically make an API call to save the league
        // For now, we'll just log it
        // You can add the new league to leagueData array
    }

    function openCreateModal() {
        showCreateModal = true;
    }
</script>

<div class="p-4 space-y-4 bg-base-200 min-h-screen">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-base-100 p-4 rounded-lg shadow-sm">
        <div>
            <h1 class="text-2xl font-bold">League Management</h1>
            <p class="text-base-content/70 text-sm">Manage your football leagues and competitions</p>
        </div>
        <div class="flex gap-2 items-center">
            <button class="btn btn-primary" on:click={openCreateModal}>
                <i class="fas fa-plus mr-2"></i>
                Create New League
            </button>
        </div>
    </div>

    <!-- Controls Section -->
    <div class="flex flex-col sm:flex-row gap-4 items-center justify-between bg-base-100 p-4 rounded-lg shadow-sm">
        <div class="flex-1 w-full sm:w-auto">
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search leagues..."
                class="input input-bordered w-full max-w-xs"
            />
        </div>
        <div class="join">
            <button
                class="join-item btn btn-sm {viewMode === 'list' ? 'btn-active' : ''}"
                on:click={() => viewMode = 'list'}
            >
                <i class="fas fa-list mr-2"></i>
                List
            </button>
            <button
                class="join-item btn btn-sm {viewMode === 'card' ? 'btn-active' : ''}"
                on:click={() => viewMode = 'card'}
            >
                <i class="fas fa-grid-2 mr-2"></i>
                Cards
            </button>
        </div>
    </div>

    <!-- Content Section -->
    {#if viewMode === 'list'}
        <div class="card bg-base-100 shadow-sm" transition:fade>
            <div class="card-body p-0">
                <DataTable
                    data={filteredData}
                    columns={columns}
                    pageSize={10}
                    searchable={false}
                    on:rowClick={handleRowClick}
                />
            </div>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" transition:fade>
            {#each filteredData as league}
                <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                    <div class="card-body">
                        <div class="flex items-center gap-4">
                            <img src={league.logo} alt={league.name} class="w-16 h-16 rounded-lg object-cover" />
                            <div>
                                <h2 class="card-title">
                                    {league.name}
                                    <div class="badge badge-{league.status.toLowerCase() === 'active' ? 'success' : 'warning'} ml-2">
                                        {league.status}
                                    </div>
                                </h2>
                                <p class="text-base-content/70">{league.description}</p>
                            </div>
                        </div>
                        <div class="flex justify-between items-center mt-4">
                            <div class="stats stats-sm shadow">
                                <div class="stat">
                                    <div class="stat-title">Season</div>
                                    <div class="stat-value text-lg">{league.season}</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-title">Teams</div>
                                    <div class="stat-value text-lg">{league.teams}</div>
                                </div>
                            </div>
                            <div class="card-actions">
                                <button class="btn btn-sm btn-circle btn-ghost" aria-label="Edit League">
                                    <i class="fas fa-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-circle btn-ghost" aria-label="View League">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Create League Modal -->
<CreateLeagueModal bind:open={showCreateModal} on:submit={handleCreateLeague} />
