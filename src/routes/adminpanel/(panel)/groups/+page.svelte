<script lang="ts">
    import Modal from '../components/ui/Modal.svelte';
    import { fade, slide } from 'svelte/transition';

    let showCreateGroupModal = false;
    let searchQuery = '';
    let selectedLeague = '';
    let viewMode: 'list' | 'card' = 'card';

    // Sample leagues data
    let leagues = [
        { id: 1, name: 'Premier League 2025', status: 'Active' },
        { id: 2, name: 'Champions Cup', status: 'Active' },
        { id: 3, name: 'Youth League', status: 'Draft' },
        { id: 4, name: 'Women\'s Championship', status: 'Active' }
    ];

    // Sample groups data
    let groups = [
        {
            id: 1,
            name: 'Group A',
            leagueId: 1,
            leagueName: 'Premier League 2025',
            description: 'Top tier competitive group',
            maxTeams: 8,
            currentTeams: 6,
            status: 'Active',
            createdDate: '2025-09-15',
            teams: [
                { id: 1, name: 'Manchester United FC', shortName: 'MUN' },
                { id: 2, name: 'Liverpool FC', shortName: 'LIV' },
                { id: 3, name: 'Chelsea FC', shortName: 'CHE' },
                { id: 4, name: 'Arsenal FC', shortName: 'ARS' },
                { id: 5, name: 'Manchester City FC', shortName: 'MCI' },
                { id: 6, name: 'Tottenham FC', shortName: 'TOT' }
            ]
        },
        {
            id: 2,
            name: 'Group B',
            leagueId: 1,
            leagueName: 'Premier League 2025',
            description: 'Secondary competitive group',
            maxTeams: 8,
            currentTeams: 4,
            status: 'Active',
            createdDate: '2025-09-20',
            teams: [
                { id: 7, name: 'Leicester City FC', shortName: 'LEI' },
                { id: 8, name: 'West Ham United FC', shortName: 'WHU' },
                { id: 9, name: 'Everton FC', shortName: 'EVE' },
                { id: 10, name: 'Newcastle United FC', shortName: 'NEW' }
            ]
        },
        {
            id: 3,
            name: 'Junior Group',
            leagueId: 3,
            leagueName: 'Youth League',
            description: 'Under 18 players group',
            maxTeams: 6,
            currentTeams: 3,
            status: 'Draft',
            createdDate: '2025-10-01',
            teams: [
                { id: 11, name: 'Youth Team A', shortName: 'YTA' },
                { id: 12, name: 'Youth Team B', shortName: 'YTB' },
                { id: 13, name: 'Youth Team C', shortName: 'YTC' }
            ]
        }
    ];

    // Group form data
    let groupForm = {
        name: '',
        leagueId: '',
        description: '',
        maxTeams: 8,
        status: 'Draft'
    };

    // Filter groups based on search and selected league
    $: filteredGroups = groups.filter(group => {
        const matchesSearch = !searchQuery || 
            group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.leagueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesLeague = !selectedLeague || group.leagueId.toString() === selectedLeague;
        
        return matchesSearch && matchesLeague;
    });

    function handleCreateGroup() {
        // Validate required fields
        if (!groupForm.name || !groupForm.leagueId) {
            alert('Please fill in all required fields');
            return;
        }

        // Find selected league name
        const league = leagues.find(l => l.id.toString() === groupForm.leagueId);
        if (!league) {
            alert('Invalid league selected');
            return;
        }

        // Create new group
        const newGroup = {
            id: groups.length + 1,
            name: groupForm.name,
            leagueId: parseInt(groupForm.leagueId),
            leagueName: league.name,
            description: groupForm.description,
            maxTeams: groupForm.maxTeams,
            currentTeams: 0,
            status: groupForm.status,
            createdDate: new Date().toISOString().split('T')[0],
            teams: []
        };

        groups = [...groups, newGroup];
        resetGroupForm();
        showCreateGroupModal = false;
        alert('Group created successfully!');
    }

    function resetGroupForm() {
        groupForm = {
            name: '',
            leagueId: '',
            description: '',
            maxTeams: 8,
            status: 'Draft'
        };
    }

    function handleCloseModal() {
        resetGroupForm();
        showCreateGroupModal = false;
    }

    function updateGroupStatus(groupId: number, status: string) {
        groups = groups.map(group => 
            group.id === groupId ? { ...group, status } : group
        );
    }

    function deleteGroup(groupId: number) {
        if (confirm('Are you sure you want to delete this group? All associated teams will be removed.')) {
            groups = groups.filter(group => group.id !== groupId);
        }
    }

    function handleManageTeams(groupId: number, groupName: string) {
        // Navigate to team management for this group
        alert(`Managing teams for ${groupName} (Group ID: ${groupId})\n\nThis will open the team management interface.`);
        
        // TODO: Implement team management modal or navigation
        // Example: goto(`/groups/${groupId}/teams`);
    }

    function handleViewMatches(groupId: number, groupName: string) {
        // Navigate to matches for this group
        alert(`Viewing matches for ${groupName} (Group ID: ${groupId})\n\nThis will show the group's fixture list.`);
        
        // TODO: Implement matches view
        // Example: goto(`/groups/${groupId}/matches`);
    }
</script>

<div class="p-4 space-y-4 bg-base-200 min-h-screen">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-base-100 p-4 rounded-lg shadow-sm">
        <div>
            <h1 class="text-2xl font-bold">Group Management</h1>
            <p class="text-base-content/70 text-sm">Create and manage competition groups for leagues</p>
        </div>
        <div class="flex gap-2 items-center">
            <button class="btn btn-primary" on:click={() => showCreateGroupModal = true}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create New Group
            </button>
        </div>
    </div>

    <!-- Controls Section -->
    <div class="flex flex-col sm:flex-row gap-4 items-center justify-between bg-base-100 p-4 rounded-lg shadow-sm">
        <!-- Search and League Filter -->
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
            <div class="form-control flex-1">
                <div class="input-group">
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input 
                        type="text" 
                        placeholder="Search groups..." 
                        class="input input-bordered flex-1"
                        bind:value={searchQuery}
                    />
                </div>
            </div>
            <div class="form-control min-w-[200px]">
                <select class="select select-bordered" bind:value={selectedLeague}>
                    <option value="">All Leagues</option>
                    {#each leagues as league}
                        <option value={league.id}>{league.name}</option>
                    {/each}
                </select>
            </div>
        </div>

        <!-- View Mode Toggle -->
        <div class="join">
            <button 
                class="join-item btn {viewMode === 'card' ? 'btn-primary' : 'btn-outline'}"
                on:click={() => viewMode = 'card'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7H5m14 14H5" />
                </svg>
                Cards
            </button>
            <button 
                class="join-item btn {viewMode === 'list' ? 'btn-primary' : 'btn-outline'}"
                on:click={() => viewMode = 'list'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
            </button>
        </div>
    </div>

    <!-- Stats Section -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat bg-base-100 rounded-lg shadow-sm">
            <div class="stat-figure text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>
            <div class="stat-title">Total Groups</div>
            <div class="stat-value text-primary">{groups.length}</div>
            <div class="stat-desc">Across all leagues</div>
        </div>
        
        <div class="stat bg-base-100 rounded-lg shadow-sm">
            <div class="stat-figure text-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div class="stat-title">Active Groups</div>
            <div class="stat-value text-success">{groups.filter(g => g.status === 'Active').length}</div>
            <div class="stat-desc">Currently running</div>
        </div>

        <div class="stat bg-base-100 rounded-lg shadow-sm">
            <div class="stat-figure text-info">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            </div>
            <div class="stat-title">Total Teams</div>
            <div class="stat-value text-info">{groups.reduce((sum, group) => sum + group.currentTeams, 0)}</div>
            <div class="stat-desc">In all groups</div>
        </div>

        <div class="stat bg-base-100 rounded-lg shadow-sm">
            <div class="stat-figure text-warning">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div class="stat-title">Draft Groups</div>
            <div class="stat-value text-warning">{groups.filter(g => g.status === 'Draft').length}</div>
            <div class="stat-desc">Awaiting activation</div>
        </div>
    </div>

    <!-- Groups Display -->
    {#if viewMode === 'card'}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" transition:fade>
            {#each filteredGroups as group}
                <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300" transition:slide>
                    <div class="card-body">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h2 class="card-title text-lg">{group.name}</h2>
                                <p class="text-sm text-base-content/70">{group.leagueName}</p>
                            </div>
                            <div class="badge badge-{group.status === 'Active' ? 'success' : 'warning'}">
                                {group.status}
                            </div>
                        </div>
                        
                        <div class="space-y-2 text-sm">
                            <p class="text-base-content/80">{group.description}</p>
                            
                            <div class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>{group.currentTeams} / {group.maxTeams} teams</span>
                            </div>
                            
                            <div class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Created: {new Date(group.createdDate).toLocaleDateString()}</span>
                            </div>

                            <!-- Progress bar for team capacity -->
                            <div class="w-full">
                                <div class="flex justify-between text-xs mb-1">
                                    <span>Team Capacity</span>
                                    <span>{Math.round((group.currentTeams / group.maxTeams) * 100)}%</span>
                                </div>
                                <progress 
                                    class="progress progress-{group.currentTeams === group.maxTeams ? 'success' : 'primary'} w-full" 
                                    value={group.currentTeams} 
                                    max={group.maxTeams}
                                ></progress>
                            </div>
                        </div>

                        <div class="card-actions justify-end mt-4 flex-wrap gap-2">
                            {#if group.status === 'Draft'}
                                <button 
                                    class="btn btn-sm btn-success"
                                    on:click={() => updateGroupStatus(group.id, 'Active')}
                                >
                                    Activate
                                </button>
                            {:else}
                                <button 
                                    class="btn btn-sm btn-warning"
                                    on:click={() => updateGroupStatus(group.id, 'Draft')}
                                >
                                    Set Draft
                                </button>
                            {/if}
                            
                            <button 
                                class="btn btn-sm btn-info"
                                on:click={() => handleManageTeams(group.id, group.name)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Teams
                            </button>
                            
                            <button 
                                class="btn btn-sm btn-accent"
                                on:click={() => handleViewMatches(group.id, group.name)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Matches
                            </button>
                            
                            <button class="btn btn-sm btn-ghost" aria-label="Edit group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            
                            <button 
                                class="btn btn-sm btn-ghost text-error" 
                                on:click={() => deleteGroup(group.id)}
                                aria-label="Delete group"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <!-- Table View -->
        <div class="card bg-base-100 shadow-lg border-0" transition:fade>
            <!-- Mobile scroll hint -->
            <div class="md:hidden bg-info/10 border-l-4 border-info p-3 mb-0">
                <div class="flex items-center gap-2 text-info text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Swipe left/right to view more columns</span>
                </div>
            </div>
            <div class="card-body p-0">
                <div class="overflow-x-auto overflow-y-visible relative" style="scrollbar-width: thin; scrollbar-color: #a1a1aa #f1f5f9;">
                    <div class="min-w-max relative">
                        <!-- Scroll indicator shadows -->
                        <div class="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-base-100 to-transparent pointer-events-none z-10"></div>
                        <table class="table w-full table-zebra min-w-[1000px]">
                            <thead class="bg-base-200">
                                <tr class="text-base-content/80 text-sm font-semibold">
                                    <th class="bg-base-200 text-left px-6 py-4 w-48 min-w-[180px]">
                                        <div class="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Group
                                        </div>
                                    </th>
                                    <th class="bg-base-200 text-left px-6 py-4 w-48 min-w-[180px]">
                                        <div class="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            League
                                        </div>
                                    </th>
                                    <th class="bg-base-200 text-left px-6 py-4 w-64 min-w-[250px]">
                                        <div class="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                                            </svg>
                                            Description
                                        </div>
                                    </th>
                                    <th class="bg-base-200 text-left px-6 py-4 w-32 min-w-[120px]">
                                        <div class="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Teams
                                        </div>
                                    </th>
                                    <th class="bg-base-200 text-left px-6 py-4 w-28 min-w-[120px]">
                                        <div class="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Status
                                        </div>
                                    </th>
                                    <th class="bg-base-200 text-left px-6 py-4 w-32 min-w-[140px]">
                                        <div class="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Created
                                        </div>
                                    </th>
                                    <th class="bg-base-200 text-center px-6 py-4 w-60 min-w-[240px] sticky right-0">
                                        <div class="flex items-center justify-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                            </svg>
                                            Actions
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {#if filteredGroups.length === 0}
                                    <tr>
                                        <td colspan="7" class="text-center py-12 text-base-content/60">
                                            <div class="flex flex-col items-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <div>
                                                    <p class="font-medium">No groups found</p>
                                                    <p class="text-sm">Try adjusting your search or create a new group</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                {:else}
                                    {#each filteredGroups as group}
                                        <tr class="hover:bg-base-200/50 transition-colors duration-200 border-b border-base-300/50" transition:fade>
                                            <td class="px-6 py-4">
                                                <div>
                                                    <div class="font-semibold text-base-content">{group.name}</div>
                                                    <div class="text-sm text-base-content/60">ID: {group.id}</div>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-2 h-2 bg-primary rounded-full"></div>
                                                    <span class="font-medium">{group.leagueName}</span>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <p class="text-sm text-base-content/80 line-clamp-2">{group.description}</p>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="flex items-center gap-2">
                                                    <span class="font-medium">{group.currentTeams} / {group.maxTeams}</span>
                                                    <progress 
                                                        class="progress progress-primary progress-sm w-12" 
                                                        value={group.currentTeams} 
                                                        max={group.maxTeams}
                                                    ></progress>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="badge badge-{group.status === 'Active' ? 'success' : 'warning'} badge-lg gap-2">
                                                    {#if group.status === 'Active'}
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    {:else}
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    {/if}
                                                    {group.status}
                                                </div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span class="text-sm font-medium">{new Date(group.createdDate).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 sticky right-0 bg-base-100 shadow-lg">
                                                <div class="flex items-center gap-2 justify-center flex-wrap">
                                                    {#if group.status === 'Draft'}
                                                        <button 
                                                            class="btn btn-sm btn-success gap-1 hover:scale-105 transition-transform"
                                                            on:click={() => updateGroupStatus(group.id, 'Active')}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Activate
                                                        </button>
                                                    {:else}
                                                        <button 
                                                            class="btn btn-sm btn-warning gap-1 hover:scale-105 transition-transform"
                                                            on:click={() => updateGroupStatus(group.id, 'Draft')}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Draft
                                                        </button>
                                                    {/if}
                                                    
                                                    <div class="tooltip tooltip-top" data-tip="Manage Teams">
                                                        <button 
                                                            class="btn btn-sm btn-info gap-1 hover:scale-105 transition-transform"
                                                            on:click={() => handleManageTeams(group.id, group.name)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            Teams
                                                        </button>
                                                    </div>
                                                    
                                                    <div class="tooltip tooltip-top" data-tip="View Matches">
                                                        <button 
                                                            class="btn btn-sm btn-accent gap-1 hover:scale-105 transition-transform"
                                                            on:click={() => handleViewMatches(group.id, group.name)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            Matches
                                                        </button>
                                                    </div>
                                                    
                                                    <div class="tooltip tooltip-top" data-tip="Edit Group">
                                                        <button class="btn btn-sm btn-ghost hover:scale-105 transition-transform" aria-label="Edit group">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    
                                                    <div class="tooltip tooltip-top" data-tip="Delete Group">
                                                        <button 
                                                            class="btn btn-sm btn-ghost text-error hover:scale-105 transition-transform" 
                                                            on:click={() => deleteGroup(group.id)}
                                                            aria-label="Delete group"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    {/each}
                                {/if}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- Create Group Modal -->
<Modal bind:open={showCreateGroupModal} title="Create New Group" size="lg">
    <form on:submit|preventDefault={handleCreateGroup} class="space-y-4">
        <!-- Group Name -->
        <div class="form-control">
            <label class="label" for="group-name">
                <span class="label-text">Group Name <span class="text-error">*</span></span>
            </label>
            <input
                id="group-name"
                type="text"
                bind:value={groupForm.name}
                placeholder="Enter group name (e.g., Group A, Premier Division)"
                class="input input-bordered w-full"
                required
            />
        </div>

        <!-- League Selection -->
        <div class="form-control">
            <label class="label" for="group-league">
                <span class="label-text">League <span class="text-error">*</span></span>
            </label>
            <select
                id="group-league"
                bind:value={groupForm.leagueId}
                class="select select-bordered w-full"
                required
            >
                <option value="" disabled>Select a league</option>
                {#each leagues as league}
                    <option value={league.id}>{league.name}</option>
                {/each}
            </select>
        </div>

        <!-- Description -->
        <div class="form-control">
            <label class="label" for="group-description">
                <span class="label-text">Description</span>
            </label>
            <textarea
                id="group-description"
                bind:value={groupForm.description}
                placeholder="Optional description of the group..."
                class="textarea textarea-bordered w-full h-24 resize-none"
            ></textarea>
        </div>

        <!-- Max Teams and Status -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label" for="group-max-teams">
                    <span class="label-text">Maximum Teams</span>
                </label>
                <input
                    id="group-max-teams"
                    type="number"
                    bind:value={groupForm.maxTeams}
                    min="2"
                    max="32"
                    class="input input-bordered w-full"
                />
            </div>
            
            <div class="form-control">
                <label class="label" for="group-status">
                    <span class="label-text">Initial Status</span>
                </label>
                <select
                    id="group-status"
                    bind:value={groupForm.status}
                    class="select select-bordered w-full"
                >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                </select>
            </div>
        </div>

        <!-- Modal Actions -->
        <div class="modal-action">
            <button type="button" class="btn btn-ghost" on:click={handleCloseModal}>
                Cancel
            </button>
            <button type="submit" class="btn btn-primary">
                Create Group
            </button>
        </div>
    </form>
</Modal>
