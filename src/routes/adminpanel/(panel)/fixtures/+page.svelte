<script lang="ts">
    import Modal from '../components/ui/Modal.svelte';
    import { fade, slide } from 'svelte/transition';

    let showCreateMatchModal = false;
    let showGroupShuffleModal = false;
    let showGroupListModal = false;
    let showGenerateMatchesModal = false;
    let activeView: 'fixtures' | 'groups' = 'fixtures';

    // Sample data - replace with actual data from API
    let leagues = [
        { id: 1, name: 'Premier League', season: '2025-2026' },
        { id: 2, name: 'La Liga', season: '2025-2026' },
        { id: 3, name: 'Bundesliga', season: '2025-2026' }
    ];

    let teams = [
        { id: 1, name: 'Manchester United', leagueId: 1 },
        { id: 2, name: 'Liverpool', leagueId: 1 },
        { id: 3, name: 'Chelsea', leagueId: 1 },
        { id: 4, name: 'Arsenal', leagueId: 1 },
        { id: 5, name: 'Manchester City', leagueId: 1 },
        { id: 6, name: 'Tottenham', leagueId: 1 },
        { id: 7, name: 'Newcastle', leagueId: 1 },
        { id: 8, name: 'Aston Villa', leagueId: 1 },
        { id: 9, name: 'West Ham', leagueId: 1 },
        { id: 10, name: 'Brighton', leagueId: 1 },
        { id: 11, name: 'Crystal Palace', leagueId: 1 },
        { id: 12, name: 'Wolves', leagueId: 1 },
        { id: 13, name: 'Everton', leagueId: 1 },
        { id: 14, name: 'Leicester', leagueId: 1 },
        { id: 15, name: 'Brentford', leagueId: 1 },
        { id: 16, name: 'Southampton', leagueId: 1 }
    ];

    // Saved groups
    let savedGroups: any[] = [];

    let fixtures = [
        {
            id: 1,
            homeTeam: 'Manchester United',
            awayTeam: 'Liverpool',
            date: '2025-10-15',
            time: '15:00',
            venue: 'Old Trafford',
            status: 'Scheduled',
            group: null,
            matchday: 1
        },
        {
            id: 2,
            homeTeam: 'Chelsea',
            awayTeam: 'Arsenal',
            date: '2025-10-15',
            time: '17:30',
            venue: 'Stamford Bridge',
            status: 'Scheduled',
            group: null,
            matchday: 1
        }
    ];

    // Match creation form
    let matchForm = {
        leagueId: '',
        homeTeamId: '',
        awayTeamId: '',
        date: '',
        time: '',
        venue: '',
        matchday: 1
    };

    // Group shuffle form
    let groupShuffleForm = {
        leagueId: '',
        numberOfGroups: 4,
        teamsPerGroup: 4,
        groupName: ''
    };

    let shuffledGroups: any[] = [];
    let generatedMatches: any[] = [];
    let selectedGroupForMatches: string = '';
    let currentGroupStageForMatches: any = null;
    let matchesWithDetails: any[] = [];
    let bulkDate = '';
    let bulkTime = '';
    let bulkVenue = '';
    let draggedTeam: any = null;
    let draggedFromGroup: any = null;

    $: selectedLeagueTeams = matchForm.leagueId 
        ? teams.filter(t => t.leagueId === parseInt(matchForm.leagueId))
        : [];

    $: shuffleLeagueTeams = groupShuffleForm.leagueId 
        ? teams.filter(t => t.leagueId === parseInt(groupShuffleForm.leagueId))
        : [];

    $: groupedFixtures = fixtures.reduce((acc, fixture) => {
        const groupName = fixture.group || 'General';
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(fixture);
        return acc;
    }, {} as Record<string, any[]>);

    function handleCreateMatch() {
        if (!matchForm.homeTeamId || !matchForm.awayTeamId || !matchForm.date || !matchForm.time) {
            alert('Please fill in all required fields');
            return;
        }

        if (matchForm.homeTeamId === matchForm.awayTeamId) {
            alert('Home team and away team cannot be the same');
            return;
        }

        const homeTeam = teams.find(t => t.id === parseInt(matchForm.homeTeamId));
        const awayTeam = teams.find(t => t.id === parseInt(matchForm.awayTeamId));

        const newMatch = {
            id: fixtures.length + 1,
            homeTeam: homeTeam?.name || '',
            awayTeam: awayTeam?.name || '',
            date: matchForm.date,
            time: matchForm.time,
            venue: matchForm.venue,
            status: 'Scheduled',
            group: null,
            matchday: matchForm.matchday
        };

        fixtures = [...fixtures, newMatch];
        resetMatchForm();
        showCreateMatchModal = false;
        alert('Match created successfully!');
    }

    function resetMatchForm() {
        matchForm = {
            leagueId: '',
            homeTeamId: '',
            awayTeamId: '',
            date: '',
            time: '',
            venue: '',
            matchday: 1
        };
    }

    function shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function handleShuffleGroups() {
        if (!groupShuffleForm.leagueId) {
            alert('Please select a league');
            return;
        }

        const availableTeams = shuffleLeagueTeams;
        const totalTeamsNeeded = groupShuffleForm.numberOfGroups * groupShuffleForm.teamsPerGroup;

        if (availableTeams.length < totalTeamsNeeded) {
            alert(`Not enough teams. Need ${totalTeamsNeeded} teams but only have ${availableTeams.length}`);
            return;
        }

        // Shuffle teams
        const shuffled = shuffleArray(availableTeams).slice(0, totalTeamsNeeded);
        
        // Create groups
        const groups: any[] = [];
        for (let i = 0; i < groupShuffleForm.numberOfGroups; i++) {
            const groupTeams = shuffled.slice(
                i * groupShuffleForm.teamsPerGroup,
                (i + 1) * groupShuffleForm.teamsPerGroup
            );
            groups.push({
                id: i + 1,
                name: `Group ${String.fromCharCode(65 + i)}`,
                teams: groupTeams
            });
        }

        shuffledGroups = groups;
        generateGroupMatches(groups);
    }

    function generateGroupMatches(groups: any[]) {
        const matches: any[] = [];
        let matchId = 1;

        groups.forEach(group => {
            const groupTeams = group.teams;
            
            // Generate round-robin matches within each group
            for (let i = 0; i < groupTeams.length; i++) {
                for (let j = i + 1; j < groupTeams.length; j++) {
                    matches.push({
                        id: matchId++,
                        group: group.name,
                        homeTeam: groupTeams[i].name,
                        awayTeam: groupTeams[j].name,
                        matchday: Math.ceil(matchId / 2)
                    });
                }
            }
        });

        generatedMatches = matches;
    }

    function confirmGroupShuffle() {
        if (shuffledGroups.length === 0) {
            alert('Please shuffle groups first');
            return;
        }

        if (!groupShuffleForm.groupName) {
            alert('Please enter a group stage name');
            return;
        }

        // Save groups
        const groupStage = {
            id: savedGroups.length + 1,
            name: groupShuffleForm.groupName,
            leagueId: groupShuffleForm.leagueId,
            groups: shuffledGroups,
            createdAt: new Date().toISOString()
        };

        savedGroups = [...savedGroups, groupStage];

        showGroupShuffleModal = false;
        shuffledGroups = [];
        generatedMatches = [];
        groupShuffleForm.groupName = '';
        alert('Groups created successfully! You can now generate matches from the Groups tab.');
    }

    function generateMatchesForGroup(groupStageId: number) {
        const groupStage = savedGroups.find(g => g.id === groupStageId);
        if (!groupStage) return;

        currentGroupStageForMatches = groupStage;
        const matches: any[] = [];

        groupStage.groups.forEach((group: any) => {
            const groupTeams = group.teams;
            
            // Generate round-robin matches within each group
            for (let i = 0; i < groupTeams.length; i++) {
                for (let j = i + 1; j < groupTeams.length; j++) {
                    // Home and away matches
                    matches.push({
                        group: `${groupStage.name} - ${group.name}`,
                        homeTeam: groupTeams[i].name,
                        awayTeam: groupTeams[j].name,
                        date: '',
                        time: '',
                        venue: '',
                        matchday: 1
                    });
                    
                    // Return fixture
                    matches.push({
                        group: `${groupStage.name} - ${group.name}`,
                        homeTeam: groupTeams[j].name,
                        awayTeam: groupTeams[i].name,
                        date: '',
                        time: '',
                        venue: '',
                        matchday: 2
                    });
                }
            }
        });

        matchesWithDetails = matches;
        showGenerateMatchesModal = true;
    }

    function saveGeneratedMatches() {
        // Validate that at least some matches have dates
        const hasValidMatches = matchesWithDetails.some(m => m.date);
        
        if (!hasValidMatches) {
            if (!confirm('No dates have been set. Do you want to create matches without dates?')) {
                return;
            }
        }

        const totalMatches = matchesWithDetails.length;

        // Add matches to fixtures
        matchesWithDetails.forEach((match, index) => {
            fixtures = [...fixtures, {
                id: fixtures.length + 1,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                group: match.group,
                date: match.date || '',
                time: match.time || '',
                venue: match.venue || '',
                status: match.date ? 'Scheduled' : 'Pending',
                matchday: match.matchday
            }];
        });

        showGenerateMatchesModal = false;
        matchesWithDetails = [];
        currentGroupStageForMatches = null;
        alert(`${totalMatches} matches created successfully!`);
    }

    function applyDateToAll(date: string, time: string, venue: string) {
        matchesWithDetails = matchesWithDetails.map(match => ({
            ...match,
            date: date || match.date,
            time: time || match.time,
            venue: venue || match.venue
        }));
    }

    function applyBulkValues() {
        applyDateToAll(bulkDate, bulkTime, bulkVenue);
    }

    function shuffleMatchOrder() {
        matchesWithDetails = shuffleArray(matchesWithDetails);
    }

    // Drag and drop functions
    function handleDragStart(event: DragEvent, team: any, group: any, groupStageIndex: number) {
        draggedTeam = team;
        draggedFromGroup = { group, groupStageIndex };
        
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/html', team.name);
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    function handleDrop(event: DragEvent, targetGroup: any, groupStageIndex: number) {
        event.preventDefault();
        
        if (!draggedTeam || !draggedFromGroup) return;

        // Don't allow drop on the same group
        if (draggedFromGroup.group.id === targetGroup.id) {
            draggedTeam = null;
            draggedFromGroup = null;
            return;
        }

        // Remove team from source group
        const sourceGroupIndex = draggedFromGroup.group.id;
        savedGroups[groupStageIndex].groups = savedGroups[groupStageIndex].groups.map((group: any) => {
            if (group.id === sourceGroupIndex) {
                return {
                    ...group,
                    teams: group.teams.filter((t: any) => t.id !== draggedTeam.id)
                };
            }
            return group;
        });

        // Add team to target group
        savedGroups[groupStageIndex].groups = savedGroups[groupStageIndex].groups.map((group: any) => {
            if (group.id === targetGroup.id) {
                return {
                    ...group,
                    teams: [...group.teams, draggedTeam]
                };
            }
            return group;
        });

        // Update the savedGroups array to trigger reactivity
        savedGroups = [...savedGroups];

        // Clear drag state
        draggedTeam = null;
        draggedFromGroup = null;
    }

    function handleDragEnd() {
        draggedTeam = null;
        draggedFromGroup = null;
    }

    function deleteGroupStage(groupStageId: number) {
        if (confirm('Are you sure you want to delete this group stage? This will not delete the matches.')) {
            savedGroups = savedGroups.filter(g => g.id !== groupStageId);
        }
    }

    function generateAllGroupMatches() {
        if (savedGroups.length === 0) {
            alert('No group stages found. Please create groups first.');
            return;
        }

        let totalMatches = 0;
        savedGroups.forEach(groupStage => {
            const matches: any[] = [];
            let matchId = fixtures.length + totalMatches + 1;

            groupStage.groups.forEach((group: any) => {
                const groupTeams = group.teams;
                
                for (let i = 0; i < groupTeams.length; i++) {
                    for (let j = i + 1; j < groupTeams.length; j++) {
                        // Home and away matches
                        matches.push({
                            id: matchId++,
                            group: `${groupStage.name} - ${group.name}`,
                            homeTeam: groupTeams[i].name,
                            awayTeam: groupTeams[j].name,
                            date: '',
                            time: '',
                            venue: '',
                            status: 'Pending',
                            matchday: 1
                        });
                        
                        matches.push({
                            id: matchId++,
                            group: `${groupStage.name} - ${group.name}`,
                            homeTeam: groupTeams[j].name,
                            awayTeam: groupTeams[i].name,
                            date: '',
                            time: '',
                            venue: '',
                            status: 'Pending',
                            matchday: 2
                        });
                    }
                }
            });

            totalMatches += matches.length;
            fixtures = [...fixtures, ...matches];
        });

        alert(`${totalMatches} matches generated for all groups!`);
    }
</script>

<div class="p-4 space-y-4 bg-base-200 min-h-screen">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-base-100 p-4 rounded-lg shadow-sm">
        <div>
            <h1 class="text-2xl font-bold">Fixtures & Matches</h1>
            <p class="text-base-content/70 text-sm">Manage match schedules and group assignments</p>
        </div>
        <div class="flex gap-2 items-center flex-wrap">
            <button class="btn btn-primary btn-sm" on:click={() => showCreateMatchModal = true}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Match
            </button>
            <button class="btn btn-secondary btn-sm" on:click={() => showGroupShuffleModal = true}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Create Groups
            </button>
        </div>
    </div>

    <!-- View Tabs -->
    <div class="bg-base-100 rounded-lg shadow-sm">
        <div class="tabs tabs-boxed p-2">
            <button 
                class="tab {activeView === 'fixtures' ? 'tab-active' : ''}"
                on:click={() => activeView = 'fixtures'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fixtures ({fixtures.length})
            </button>
            <button 
                class="tab {activeView === 'groups' ? 'tab-active' : ''}"
                on:click={() => activeView = 'groups'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Groups ({savedGroups.length})
            </button>
        </div>
    </div>

    <!-- Fixtures View -->
    {#if activeView === 'fixtures'}
    <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
            <h2 class="card-title">Scheduled Fixtures</h2>
            <div class="overflow-x-auto">
                <table class="table w-full">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Home Team</th>
                            <th>Away Team</th>
                            <th>Venue</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#if fixtures.length === 0}
                            <tr>
                                <td colspan="6" class="text-center py-4">No fixtures scheduled</td>
                            </tr>
                        {:else}
                            {#each fixtures as fixture}
                                <tr transition:fade>
                                    <td>
                                        <div class="font-medium">{fixture.date || 'TBD'}</div>
                                        <div class="text-sm text-base-content/70">{fixture.time || '-'}</div>
                                    </td>
                                    <td class="font-medium">{fixture.homeTeam}</td>
                                    <td class="font-medium">{fixture.awayTeam}</td>
                                    <td>{fixture.venue || 'TBD'}</td>
                                    <td>
                                        <div class="badge badge-{fixture.status === 'Scheduled' ? 'success' : 'warning'}">
                                            {fixture.status}
                                        </div>
                                    </td>
                                    <td class="space-x-2">
                                        <button class="btn btn-xs btn-ghost" aria-label="Edit fixture">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button class="btn btn-xs btn-ghost text-error" aria-label="Delete fixture">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    {/if}

    <!-- Groups View -->
    {#if activeView === 'groups'}
        <div class="space-y-4" transition:fade>
            {#if savedGroups.length === 0}
                <div class="card bg-base-100 shadow-sm">
                    <div class="card-body text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 class="text-xl font-bold mt-4">No Groups Created</h3>
                        <p class="text-base-content/70 mt-2">Create your first group stage to organize teams and generate matches</p>
                        <button class="btn btn-primary mt-4" on:click={() => showGroupShuffleModal = true}>
                            Create Groups
                        </button>
                    </div>
                </div>
            {:else}
                {#each savedGroups as groupStage}
                    <div class="card bg-base-100 shadow-sm" transition:slide>
                        <div class="card-body">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="card-title">{groupStage.name}</h3>
                                    <p class="text-sm text-base-content/70">
                                        Created {new Date(groupStage.createdAt).toLocaleDateString()} • 
                                        {groupStage.groups.length} Groups
                                    </p>
                                </div>
                                <div class="flex gap-2">
                                    <button 
                                        class="btn btn-sm btn-primary"
                                        on:click={() => generateMatchesForGroup(groupStage.id)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Generate Matches
                                    </button>
                                    <button 
                                        class="btn btn-sm btn-ghost text-error"
                                        on:click={() => deleteGroupStage(groupStage.id)}
                                        aria-label="Delete group stage"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Groups Grid with Drag & Drop -->
                            <div class="alert alert-info mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span>💡 Drag and drop teams between groups to reorganize!</span>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {#each groupStage.groups as group, groupIndex}
                                    <div 
                                        class="card bg-base-200 shadow transition-all duration-200 hover:shadow-lg border-2 border-transparent hover:border-primary/20"
                                        on:dragover={handleDragOver}
                                        on:drop={(e) => handleDrop(e, group, savedGroups.findIndex(g => g.id === groupStage.id))}
                                        role="region"
                                        aria-label="Group {group.name}"
                                    >
                                        <div class="card-body p-4">
                                            <div class="flex justify-between items-center mb-2">
                                                <h4 class="font-bold text-lg">{group.name}</h4>
                                                <span class="badge badge-sm badge-primary">{group.teams.length}</span>
                                            </div>
                                            <div class="divider my-2"></div>
                                            
                                            <!-- Drop Zone -->
                                            <div class="min-h-[100px] space-y-2">
                                                {#if group.teams.length === 0}
                                                    <div class="flex items-center justify-center h-20 border-2 border-dashed border-base-300 rounded-lg text-base-content/50 text-sm">
                                                        Drop teams here
                                                    </div>
                                                {:else}
                                                    {#each group.teams as team}
                                                        <div
                                                            class="flex items-center gap-2 text-sm p-2 bg-base-100 rounded-lg cursor-move hover:bg-base-300 transition-colors border border-transparent hover:border-primary/30"
                                                            draggable="true"
                                                            on:dragstart={(e) => handleDragStart(e, team, group, savedGroups.findIndex(g => g.id === groupStage.id))}
                                                            on:dragend={handleDragEnd}
                                                            role="button"
                                                            tabindex="0"
                                                            title="Drag to move to another group"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                                                            </svg>
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span class="flex-1">{team.name}</span>
                                                        </div>
                                                    {/each}
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                {/each}

                <!-- Generate All Matches Button -->
                <div class="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-lg">
                    <div class="card-body">
                        <div class="flex justify-between items-center">
                            <div>
                                <h3 class="card-title">Generate All Matches</h3>
                                <p class="text-sm opacity-90">Create matches for all group stages at once</p>
                            </div>
                            <button 
                                class="btn btn-neutral"
                                on:click={generateAllGroupMatches}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate All
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>

<!-- Create Match Modal -->
<Modal bind:open={showCreateMatchModal} title="Create New Match" size="md">
    <form on:submit|preventDefault={handleCreateMatch} class="space-y-4">
        <!-- League Selection -->
        <div class="form-control">
            <label class="label" for="match-league">
                <span class="label-text">League <span class="text-error">*</span></span>
            </label>
            <select
                id="match-league"
                bind:value={matchForm.leagueId}
                class="select select-bordered w-full"
                required
            >
                <option value="">Select a league</option>
                {#each leagues as league}
                    <option value={league.id}>{league.name} ({league.season})</option>
                {/each}
            </select>
        </div>

        <!-- Home Team -->
        <div class="form-control">
            <label class="label" for="home-team">
                <span class="label-text">Home Team <span class="text-error">*</span></span>
            </label>
            <select
                id="home-team"
                bind:value={matchForm.homeTeamId}
                class="select select-bordered w-full"
                required
                disabled={!matchForm.leagueId}
            >
                <option value="">Select home team</option>
                {#each selectedLeagueTeams as team}
                    <option value={team.id}>{team.name}</option>
                {/each}
            </select>
        </div>

        <!-- Away Team -->
        <div class="form-control">
            <label class="label" for="away-team">
                <span class="label-text">Away Team <span class="text-error">*</span></span>
            </label>
            <select
                id="away-team"
                bind:value={matchForm.awayTeamId}
                class="select select-bordered w-full"
                required
                disabled={!matchForm.leagueId}
            >
                <option value="">Select away team</option>
                {#each selectedLeagueTeams as team}
                    <option value={team.id}>{team.name}</option>
                {/each}
            </select>
        </div>

        <!-- Date and Time -->
        <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label" for="match-date">
                    <span class="label-text">Date <span class="text-error">*</span></span>
                </label>
                <input
                    id="match-date"
                    type="date"
                    bind:value={matchForm.date}
                    class="input input-bordered w-full"
                    required
                />
            </div>
            <div class="form-control">
                <label class="label" for="match-time">
                    <span class="label-text">Time <span class="text-error">*</span></span>
                </label>
                <input
                    id="match-time"
                    type="time"
                    bind:value={matchForm.time}
                    class="input input-bordered w-full"
                    required
                />
            </div>
        </div>

        <!-- Venue -->
        <div class="form-control">
            <label class="label" for="match-venue">
                <span class="label-text">Venue</span>
            </label>
            <input
                id="match-venue"
                type="text"
                bind:value={matchForm.venue}
                placeholder="Enter venue name"
                class="input input-bordered w-full"
            />
        </div>

        <!-- Matchday -->
        <div class="form-control">
            <label class="label" for="matchday">
                <span class="label-text">Matchday</span>
            </label>
            <input
                id="matchday"
                type="number"
                bind:value={matchForm.matchday}
                min="1"
                class="input input-bordered w-full"
            />
        </div>
    </form>

    <svelte:fragment slot="footer">
        <button type="button" class="btn btn-ghost" on:click={() => { showCreateMatchModal = false; resetMatchForm(); }}>
            Cancel
        </button>
        <button type="button" class="btn btn-primary" on:click={handleCreateMatch}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Match
        </button>
    </svelte:fragment>
</Modal>

<!-- Group Shuffle Modal -->
<Modal bind:open={showGroupShuffleModal} title="Shuffle Teams into Groups" size="lg">
    <div class="space-y-6">
        <!-- Configuration Form -->
        <div class="space-y-4">
            <!-- Group Stage Name -->
            <div class="form-control">
                <label class="label" for="group-stage-name">
                    <span class="label-text">Group Stage Name <span class="text-error">*</span></span>
                </label>
                <input
                    id="group-stage-name"
                    type="text"
                    bind:value={groupShuffleForm.groupName}
                    placeholder="e.g., Quarter Finals, Group Stage"
                    class="input input-bordered w-full"
                    required
                />
            </div>

            <div class="form-control">
                <label class="label" for="shuffle-league">
                    <span class="label-text">League <span class="text-error">*</span></span>
                </label>
                <select
                    id="shuffle-league"
                    bind:value={groupShuffleForm.leagueId}
                    class="select select-bordered w-full"
                    required
                >
                    <option value="">Select a league</option>
                    {#each leagues as league}
                        <option value={league.id}>{league.name} ({league.season})</option>
                    {/each}
                </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                    <label class="label" for="num-groups">
                        <span class="label-text">Number of Groups</span>
                    </label>
                    <input
                        id="num-groups"
                        type="number"
                        bind:value={groupShuffleForm.numberOfGroups}
                        min="2"
                        max="8"
                        class="input input-bordered w-full"
                    />
                </div>
                <div class="form-control">
                    <label class="label" for="teams-per-group">
                        <span class="label-text">Teams per Group</span>
                    </label>
                    <input
                        id="teams-per-group"
                        type="number"
                        bind:value={groupShuffleForm.teamsPerGroup}
                        min="2"
                        max="8"
                        class="input input-bordered w-full"
                    />
                </div>
            </div>

            {#if groupShuffleForm.leagueId}
                <div class="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Available teams: {shuffleLeagueTeams.length} | Needed: {groupShuffleForm.numberOfGroups * groupShuffleForm.teamsPerGroup}</span>
                </div>
            {/if}

            <button type="button" class="btn btn-secondary btn-block" on:click={handleShuffleGroups}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Shuffle Groups
            </button>
        </div>

        <!-- Shuffled Groups Display -->
        {#if shuffledGroups.length > 0}
            <div class="space-y-4" transition:fade>
                <h3 class="font-bold text-lg">Shuffled Groups</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each shuffledGroups as group}
                        <div class="card bg-base-200 shadow">
                            <div class="card-body p-4">
                                <h4 class="card-title text-base">{group.name}</h4>
                                <ul class="space-y-2">
                                    {#each group.teams as team}
                                        <li class="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {team.name}
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        </div>
                    {/each}
                </div>

                <!-- Generated Matches Preview -->
                <div class="space-y-2">
                    <h3 class="font-bold text-lg">Generated Matches ({generatedMatches.length})</h3>
                    <div class="max-h-60 overflow-y-auto">
                        <table class="table table-sm w-full">
                            <thead>
                                <tr>
                                    <th>Group</th>
                                    <th>Home</th>
                                    <th>Away</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each generatedMatches as match}
                                    <tr>
                                        <td><span class="badge badge-sm">{match.group}</span></td>
                                        <td>{match.homeTeam}</td>
                                        <td>{match.awayTeam}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <svelte:fragment slot="footer">
        <button type="button" class="btn btn-ghost" on:click={() => { showGroupShuffleModal = false; shuffledGroups = []; generatedMatches = []; }}>
            Cancel
        </button>
        {#if shuffledGroups.length > 0}
            <button type="button" class="btn btn-primary" on:click={confirmGroupShuffle}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Confirm & Create Matches
            </button>
        {/if}
    </svelte:fragment>
</Modal>

<!-- Generate Matches Modal -->
<Modal bind:open={showGenerateMatchesModal} title="Generate & Schedule Matches" size="xl">
    {#if currentGroupStageForMatches}
        <div class="space-y-6">
            <!-- Quick Fill Section -->
            <div class="card bg-base-200">
                <div class="card-body p-4">
                    <h3 class="font-bold text-lg mb-2">Quick Fill All Matches</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="form-control">
                            <label class="label" for="bulk-date">
                                <span class="label-text">Date</span>
                            </label>
                            <input
                                id="bulk-date"
                                type="date"
                                bind:value={bulkDate}
                                class="input input-bordered input-sm"
                            />
                        </div>
                        <div class="form-control">
                            <label class="label" for="bulk-time">
                                <span class="label-text">Time</span>
                            </label>
                            <input
                                id="bulk-time"
                                type="time"
                                bind:value={bulkTime}
                                class="input input-bordered input-sm"
                            />
                        </div>
                        <div class="form-control">
                            <label class="label" for="bulk-venue">
                                <span class="label-text">Venue</span>
                            </label>
                            <input
                                id="bulk-venue"
                                type="text"
                                placeholder="Enter venue"
                                bind:value={bulkVenue}
                                class="input input-bordered input-sm"
                            />
                        </div>
                    </div>
                    <div class="mt-4 flex gap-2">
                        <button type="button" class="btn btn-sm btn-primary" on:click={applyBulkValues}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Apply to All Matches
                        </button>
                        <button type="button" class="btn btn-sm btn-secondary" on:click={shuffleMatchOrder}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Shuffle Match Order
                        </button>
                    </div>
                </div>
            </div>

            <!-- Matches List -->
            <div class="space-y-2">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-lg">Matches to Generate ({matchesWithDetails.length})</h3>
                    <span class="badge badge-info">{currentGroupStageForMatches.name}</span>
                </div>
                
                <div class="max-h-96 overflow-y-auto border border-base-300 rounded-lg">
                    <table class="table table-sm table-pin-rows">
                        <thead>
                            <tr>
                                <th class="w-8">#</th>
                                <th>Group</th>
                                <th>Home</th>
                                <th>Away</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Venue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each matchesWithDetails as match, index}
                                <tr class="hover">
                                    <td>{index + 1}</td>
                                    <td><span class="badge badge-sm badge-outline">{match.group}</span></td>
                                    <td class="font-medium">{match.homeTeam}</td>
                                    <td class="font-medium">{match.awayTeam}</td>
                                    <td>
                                        <input
                                            type="date"
                                            bind:value={match.date}
                                            class="input input-bordered input-xs w-full"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="time"
                                            bind:value={match.time}
                                            class="input input-bordered input-xs w-full"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            bind:value={match.venue}
                                            placeholder="Venue"
                                            class="input input-bordered input-xs w-full"
                                        />
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    {/if}

    <svelte:fragment slot="footer">
        <button type="button" class="btn btn-ghost" on:click={() => { showGenerateMatchesModal = false; matchesWithDetails = []; }}>
            Cancel
        </button>
        <button type="button" class="btn btn-primary" on:click={saveGeneratedMatches}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Create {matchesWithDetails.length} Matches
        </button>
    </svelte:fragment>
</Modal>

<style>
    /* Drag and drop visual feedback */
    [draggable="true"]:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    [draggable="true"]:active {
        transform: scale(0.98);
        opacity: 0.8;
    }

    /* Drop zone hover effect */
    .card:has([draggable="true"]:hover) {
        border-color: rgb(var(--primary) / 0.3) !important;
    }
</style>
