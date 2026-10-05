<script lang="ts">
    import Modal from '../components/ui/Modal.svelte';
    import { fade, slide } from 'svelte/transition';

    let showCreateMatchModal = false;
    let showScheduleModal = false;
    let selectedGroup = '';
    let searchQuery = '';
    let filterStatus = '';
    let viewMode: 'list' | 'calendar' = 'list';
    
    // Calendar-specific variables
    let currentDate = new Date();
    let calendarMonth = currentDate.getMonth();
    let calendarYear = currentDate.getFullYear();
    let selectedDate: Date | null = null;

    // Sample groups data
    let groups = [
        { 
            id: 1, 
            name: 'Group A', 
            leagueName: 'Premier League 2025',
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
            leagueName: 'Premier League 2025',
            teams: [
                { id: 7, name: 'Leicester City FC', shortName: 'LEI' },
                { id: 8, name: 'West Ham United FC', shortName: 'WHU' },
                { id: 9, name: 'Everton FC', shortName: 'EVE' },
                { id: 10, name: 'Newcastle United FC', shortName: 'NEW' }
            ]
        }
    ];

    // Sample matches data
    let matches = [
        {
            id: 1,
            groupId: 1,
            groupName: 'Group A',
            homeTeam: { id: 1, name: 'Manchester United FC', shortName: 'MUN' },
            awayTeam: { id: 2, name: 'Liverpool FC', shortName: 'LIV' },
            matchDate: '2025-10-15',
            matchTime: '15:00',
            venue: 'Old Trafford',
            status: 'Scheduled',
            homeScore: null,
            awayScore: null,
            round: 1,
            week: 3
        },
        {
            id: 2,
            groupId: 1,
            groupName: 'Group A',
            homeTeam: { id: 3, name: 'Chelsea FC', shortName: 'CHE' },
            awayTeam: { id: 4, name: 'Arsenal FC', shortName: 'ARS' },
            matchDate: '2025-10-16',
            matchTime: '20:00',
            venue: 'Stamford Bridge',
            status: 'Scheduled',
            homeScore: null,
            awayScore: null,
            round: 1,
            week: 3
        },
        {
            id: 3,
            groupId: 1,
            groupName: 'Group A',
            homeTeam: { id: 1, name: 'Manchester United FC', shortName: 'MUN' },
            awayTeam: { id: 3, name: 'Chelsea FC', shortName: 'CHE' },
            matchDate: '2025-10-10',
            matchTime: '17:30',
            venue: 'Old Trafford',
            status: 'Completed',
            homeScore: 2,
            awayScore: 1,
            round: 1,
            week: 2
        },
        {
            id: 4,
            groupId: 2,
            groupName: 'Group B',
            homeTeam: { id: 7, name: 'Leicester City FC', shortName: 'LEI' },
            awayTeam: { id: 8, name: 'West Ham United FC', shortName: 'WHU' },
            matchDate: '2025-10-18',
            matchTime: '19:45',
            venue: 'King Power Stadium',
            status: 'Scheduled',
            homeScore: null,
            awayScore: null,
            round: 1,
            week: 4
        },
        {
            id: 5,
            groupId: 1,
            groupName: 'Group A',
            homeTeam: { id: 2, name: 'Liverpool FC', shortName: 'LIV' },
            awayTeam: { id: 4, name: 'Arsenal FC', shortName: 'ARS' },
            matchDate: '2025-10-12',
            matchTime: '16:00',
            venue: 'Anfield',
            status: 'Live',
            homeScore: 1,
            awayScore: 0,
            round: 1,
            week: 3
        }
    ];

    // Match form data
    let matchForm = {
        groupId: '',
        homeTeamId: '',
        awayTeamId: '',
        matchDate: '',
        matchTime: '',
        venue: '',
        round: 1,
        week: 1
    };

    // Get teams for selected group
    $: selectedGroupTeams = groups.find(g => g.id.toString() === matchForm.groupId)?.teams || [];

    // Filter matches
    $: filteredMatches = matches.filter(match => {
        const matchesSearch = !searchQuery || 
            match.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            match.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            match.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
            match.groupName.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesGroup = !selectedGroup || match.groupId.toString() === selectedGroup;
        const matchesStatus = !filterStatus || match.status === filterStatus;
        
        return matchesSearch && matchesGroup && matchesStatus;
    });

    function handleCreateMatch() {
        // Validate required fields
        if (!matchForm.groupId || !matchForm.homeTeamId || !matchForm.awayTeamId || !matchForm.matchDate || !matchForm.matchTime) {
            alert('Please fill in all required fields');
            return;
        }

        // Check teams are different
        if (matchForm.homeTeamId === matchForm.awayTeamId) {
            alert('Home and away teams must be different');
            return;
        }

        // Find team details
        const group = groups.find(g => g.id.toString() === matchForm.groupId);
        const homeTeam = group?.teams.find(t => t.id.toString() === matchForm.homeTeamId);
        const awayTeam = group?.teams.find(t => t.id.toString() === matchForm.awayTeamId);

        if (!homeTeam || !awayTeam || !group) {
            alert('Invalid team or group selection');
            return;
        }

        // Create new match
        const newMatch = {
            id: matches.length + 1,
            groupId: parseInt(matchForm.groupId),
            groupName: group.name,
            homeTeam,
            awayTeam,
            matchDate: matchForm.matchDate,
            matchTime: matchForm.matchTime,
            venue: matchForm.venue || `${homeTeam.name} Stadium`,
            status: 'Scheduled',
            homeScore: null,
            awayScore: null,
            round: matchForm.round,
            week: matchForm.week
        };

        matches = [...matches, newMatch];
        resetMatchForm();
        showCreateMatchModal = false;
        alert('Match created successfully!');
    }

    function resetMatchForm() {
        matchForm = {
            groupId: '',
            homeTeamId: '',
            awayTeamId: '',
            matchDate: '',
            matchTime: '',
            venue: '',
            round: 1,
            week: 1
        };
    }

    function handleCloseModal() {
        resetMatchForm();
        showCreateMatchModal = false;
    }

    function updateMatchStatus(matchId: number, status: string) {
        matches = matches.map(match => 
            match.id === matchId ? { ...match, status } : match
        );
    }

    function deleteMatch(matchId: number) {
        if (confirm('Are you sure you want to delete this match?')) {
            matches = matches.filter(match => match.id !== matchId);
        }
    }

    function handleEditScore(matchId: number) {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        const homeScore = prompt(`Enter home score for ${match.homeTeam.shortName}:`, match.homeScore?.toString() || '0');
        const awayScore = prompt(`Enter away score for ${match.awayTeam.shortName}:`, match.awayScore?.toString() || '0');

        if (homeScore !== null && awayScore !== null) {
            matches = matches.map(m => 
                m.id === matchId ? {
                    ...m,
                    homeScore: parseInt(homeScore) || 0,
                    awayScore: parseInt(awayScore) || 0,
                    status: 'Completed'
                } : m
            );
        }
    }

    function generateRoundRobin(groupId: number) {
        const group = groups.find(g => g.id === groupId);
        if (!group || group.teams.length < 2) {
            alert('Group must have at least 2 teams to generate matches');
            return;
        }

        const teams = group.teams;
        const newMatches = [];
        let matchId = matches.length + 1;

        // Generate round-robin matches
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                // Home match
                newMatches.push({
                    id: matchId++,
                    groupId: group.id,
                    groupName: group.name,
                    homeTeam: teams[i],
                    awayTeam: teams[j],
                    matchDate: '',
                    matchTime: '',
                    venue: `${teams[i].name} Stadium`,
                    status: 'Draft',
                    homeScore: null,
                    awayScore: null,
                    round: 1,
                    week: Math.ceil((newMatches.length + 1) / 2)
                });

                // Away match (return fixture)
                newMatches.push({
                    id: matchId++,
                    groupId: group.id,
                    groupName: group.name,
                    homeTeam: teams[j],
                    awayTeam: teams[i],
                    matchDate: '',
                    matchTime: '',
                    venue: `${teams[j].name} Stadium`,
                    status: 'Draft',
                    homeScore: null,
                    awayScore: null,
                    round: 2,
                    week: Math.ceil((newMatches.length + 1) / 2)
                });
            }
        }

        matches = [...matches, ...newMatches];
        alert(`Generated ${newMatches.length} matches for ${group.name}!`);
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'Scheduled': return 'info';
            case 'Live': return 'success';
            case 'Completed': return 'neutral';
            case 'Cancelled': return 'error';
            case 'Postponed': return 'warning';
            case 'Draft': return 'ghost';
            default: return 'neutral';
        }
    }

    function formatMatchResult(match: any) {
        if (match.status === 'Completed' && match.homeScore !== null && match.awayScore !== null) {
            return `${match.homeScore} - ${match.awayScore}`;
        }
        return match.status;
    }

    // Calendar utility functions
    function getDaysInMonth(month: number, year: number): number {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(month: number, year: number): number {
        return new Date(year, month, 1).getDay();
    }

    function getCalendarDays(): Array<{date: number, isCurrentMonth: boolean, isToday: boolean, matches: any[]}> {
        const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
        const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
        const today = new Date();
        
        const days = [];

        // Previous month's trailing days
        const prevMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
        const prevYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
        const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);
        
        for (let i = firstDay - 1; i >= 0; i--) {
            const date = daysInPrevMonth - i;
            days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                matches: []
            });
        }

        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = today.getDate() === day && 
                          today.getMonth() === calendarMonth && 
                          today.getFullYear() === calendarYear;
            
            const dayMatches = getMatchesForDate(day, calendarMonth, calendarYear);
            
            days.push({
                date: day,
                isCurrentMonth: true,
                isToday,
                matches: dayMatches
            });
        }

        // Next month's leading days
        const remainingDays = 42 - days.length; // 6 weeks × 7 days
        for (let day = 1; day <= remainingDays; day++) {
            days.push({
                date: day,
                isCurrentMonth: false,
                isToday: false,
                matches: []
            });
        }

        return days;
    }

    function getMatchesForDate(day: number, month: number, year: number): any[] {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return filteredMatches.filter(match => match.matchDate === dateString);
    }

    function navigateMonth(direction: 'prev' | 'next') {
        if (direction === 'prev') {
            if (calendarMonth === 0) {
                calendarMonth = 11;
                calendarYear--;
            } else {
                calendarMonth--;
            }
        } else {
            if (calendarMonth === 11) {
                calendarMonth = 0;
                calendarYear++;
            } else {
                calendarMonth++;
            }
        }
    }

    function getMonthName(month: number): string {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month];
    }
</script>

<div class="p-4 space-y-4 bg-base-200 min-h-screen">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-base-100 p-4 rounded-lg shadow-sm">
        <div>
            <h1 class="text-2xl font-bold">Match Management</h1>
            <p class="text-base-content/70 text-sm">Schedule and manage matches between teams in groups</p>
        </div>
        <div class="flex gap-2 items-center flex-wrap">
            <button class="btn btn-secondary btn-sm" on:click={() => showScheduleModal = true}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Auto Generate
            </button>
            <button class="btn btn-primary" on:click={() => showCreateMatchModal = true}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Match
            </button>
        </div>
    </div>

    <!-- Controls Section -->
    <div class="flex flex-col lg:flex-row gap-4 items-center justify-between bg-base-100 p-4 rounded-lg shadow-sm">
        <!-- Search and Filters -->
        <div class="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div class="form-control flex-1">
                <div class="input-group">
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input 
                        type="text" 
                        placeholder="Search matches, teams, venues..." 
                        class="input input-bordered flex-1"
                        bind:value={searchQuery}
                    />
                </div>
            </div>
            <div class="form-control min-w-[160px]">
                <select class="select select-bordered" bind:value={selectedGroup}>
                    <option value="">All Groups</option>
                    {#each groups as group}
                        <option value={group.id}>{group.name}</option>
                    {/each}
                </select>
            </div>
            <div class="form-control min-w-[140px]">
                <select class="select select-bordered" bind:value={filterStatus}>
                    <option value="">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Live">Live</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Postponed">Postponed</option>
                </select>
            </div>
        </div>

        <!-- View Mode Toggle -->
        <div class="join">
            <button 
                class="join-item btn {viewMode === 'list' ? 'btn-primary' : 'btn-outline'}"
                on:click={() => viewMode = 'list'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
            </button>
            <button 
                class="join-item btn {viewMode === 'calendar' ? 'btn-primary' : 'btn-outline'}"
                on:click={() => viewMode = 'calendar'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
            </button>
        </div>
    </div>

    <!-- Stats Section -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="stat bg-base-100 rounded-lg shadow-sm">
            <div class="stat-figure text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <div class="stat-title">Total Matches</div>
            <div class="stat-value text-primary">{matches.length}</div>
            <div class="stat-desc">All competitions</div>
        </div>
        
        <div class="stat bg-base-100 rounded-lg shadow-sm">
            <div class="stat-figure text-info">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <div class="stat-title">Scheduled</div>
            <div class="stat-value text-info">{matches.filter(m => m.status === 'Scheduled').length}</div>
            <div class="stat-desc">Upcoming matches</div>
        </div>

        <div class="stat bg-base-100 rounded-lg shadow-sm">
            <div class="stat-figure text-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
            </div>
            <div class="stat-title">Live</div>
            <div class="stat-value text-success">{matches.filter(m => m.status === 'Live').length}</div>
            <div class="stat-desc">Currently playing</div>
        </div>

        <div class="stat bg-base-100 rounded-lg shadow-sm">
            <div class="stat-figure text-neutral">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div class="stat-title">Completed</div>
            <div class="stat-value text-neutral">{matches.filter(m => m.status === 'Completed').length}</div>
            <div class="stat-desc">Finished games</div>
        </div>

        <div class="stat bg-base-100 rounded-lg shadow-sm">
            <div class="stat-figure text-warning">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div class="stat-title">Draft</div>
            <div class="stat-value text-warning">{matches.filter(m => m.status === 'Draft').length}</div>
            <div class="stat-desc">Pending schedule</div>
        </div>
    </div>

    <!-- Matches Display -->
    {#if viewMode === 'list'}
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
                <div class="overflow-x-auto overflow-y-visible" style="scrollbar-width: thin; scrollbar-color: #a1a1aa #f1f5f9;">
                    <table class="table w-full table-zebra min-w-[1200px]">
                            <thead class="bg-base-200">
                                <tr class="text-base-content/80 text-sm font-semibold">
                                    <th class="bg-base-200 text-left px-6 py-4 w-48 min-w-[180px]">
                                        <div class="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Date & Time
                                        </div>
                                    </th>
                                    <th class="bg-base-200 text-left px-6 py-4 w-64 min-w-[250px]">
                                        <div class="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            Match
                                        </div>
                                    </th>
                                    <th class="bg-base-200 text-center px-6 py-4 w-32 min-w-[120px]">
                                        <div class="flex items-center justify-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Result
                                        </div>
                                    </th>
                                    <th class="bg-base-200 text-left px-6 py-4 w-40 min-w-[160px]">
                                        <div class="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            Venue
                                        </div>
                                    </th>
                                    <th class="bg-base-200 text-left px-6 py-4 w-32 min-w-[120px]">
                                        <div class="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Group
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
                                    <th class="bg-base-200 text-center px-6 py-4 w-60 min-w-[240px] sticky right-0 z-20 border-l border-base-300/50">
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
                                {#if filteredMatches.length === 0}
                                    <tr>
                                        <td colspan="7" class="text-center py-12 text-base-content/60">
                                            <div class="flex flex-col items-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <div>
                                                    <p class="font-medium">No matches found</p>
                                                    <p class="text-sm">Try adjusting your search or create a new match</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                {:else}
                                    {#each filteredMatches as match}
                                        <tr class="hover:bg-base-200/50 transition-colors duration-200 border-b border-base-300/50" transition:fade>
                                            <td class="px-6 py-4">
                                                <div>
                                                    <div class="font-semibold">{match.matchDate ? new Date(match.matchDate).toLocaleDateString() : 'TBD'}</div>
                                                    <div class="text-sm text-base-content/60">{match.matchTime || 'Time TBD'}</div>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="flex items-center justify-between">
                                                    <div class="flex items-center gap-2">
                                                        <span class="font-medium text-sm">{match.homeTeam.shortName}</span>
                                                    </div>
                                                    <div class="px-2 py-1 bg-base-200 rounded text-xs font-mono">
                                                        VS
                                                    </div>
                                                    <div class="flex items-center gap-2">
                                                        <span class="font-medium text-sm">{match.awayTeam.shortName}</span>
                                                    </div>
                                                </div>
                                                <div class="text-xs text-base-content/60 mt-1 text-center">
                                                    {match.homeTeam.name} vs {match.awayTeam.name}
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 text-center">
                                                <div class="font-bold text-lg">
                                                    {formatMatchResult(match)}
                                                </div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-2 h-2 bg-accent rounded-full"></div>
                                                    <span class="text-sm">{match.venue || 'TBD'}</span>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-2 h-2 bg-primary rounded-full"></div>
                                                    <span class="font-medium text-sm">{match.groupName}</span>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="badge badge-{getStatusColor(match.status)} badge-lg gap-2">
                                                    {#if match.status === 'Live'}
                                                        <div class="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                                                    {/if}
                                                    {match.status}
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 sticky right-0 bg-base-100 z-10 border-l border-base-300/30">
                                                <div class="flex items-center gap-2 justify-center flex-wrap">
                                                    {#if match.status === 'Draft' || match.status === 'Scheduled'}
                                                        <div class="tooltip tooltip-top" data-tip="Start Match">
                                                            <button 
                                                                class="btn btn-sm btn-success gap-1 hover:scale-105 transition-transform"
                                                                on:click={() => updateMatchStatus(match.id, 'Live')}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Start
                                                            </button>
                                                        </div>
                                                    {/if}
                                                    
                                                    {#if match.status === 'Live'}
                                                        <div class="tooltip tooltip-top" data-tip="End Match">
                                                            <button 
                                                                class="btn btn-sm btn-warning gap-1 hover:scale-105 transition-transform"
                                                                on:click={() => updateMatchStatus(match.id, 'Completed')}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h6v4H9z" />
                                                                </svg>
                                                                End
                                                            </button>
                                                        </div>
                                                    {/if}

                                                    <div class="tooltip tooltip-top" data-tip="Edit Score">
                                                        <button 
                                                            class="btn btn-sm btn-info gap-1 hover:scale-105 transition-transform"
                                                            on:click={() => handleEditScore(match.id)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                            </svg>
                                                            Score
                                                        </button>
                                                    </div>

                                                    <div class="tooltip tooltip-top" data-tip="Edit Match">
                                                        <button class="btn btn-sm btn-ghost hover:scale-105 transition-transform" aria-label="Edit match">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    <div class="tooltip tooltip-top" data-tip="Delete Match">
                                                        <button 
                                                            class="btn btn-sm btn-ghost text-error hover:scale-105 transition-transform" 
                                                            on:click={() => deleteMatch(match.id)}
                                                            aria-label="Delete match"
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
    {:else}
        <!-- Calendar View -->
        <div class="card bg-base-100 shadow-lg" transition:fade>
            <div class="card-body p-0">
                <!-- Calendar Header -->
                <div class="flex items-center justify-between p-6 border-b border-base-300">
                    <div class="flex items-center gap-4">
                        <h2 class="text-xl font-bold">
                            {getMonthName(calendarMonth)} {calendarYear}
                        </h2>
                        <div class="flex gap-1">
                            <button 
                                class="btn btn-sm btn-ghost"
                                on:click={() => navigateMonth('prev')}
                                aria-label="Previous month"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button 
                                class="btn btn-sm btn-ghost"
                                on:click={() => navigateMonth('next')}
                                aria-label="Next month"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <button 
                        class="btn btn-sm btn-primary"
                        on:click={() => {
                            calendarMonth = currentDate.getMonth();
                            calendarYear = currentDate.getFullYear();
                        }}
                    >
                        Today
                    </button>
                </div>

                <!-- Calendar Grid -->
                <div class="p-4">
                    <!-- Day Headers -->
                    <div class="grid grid-cols-7 gap-1 mb-2">
                        {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
                            <div class="text-center font-medium text-base-content/60 p-2 text-sm">
                                {day}
                            </div>
                        {/each}
                    </div>

                    <!-- Calendar Days -->
                    <div class="grid grid-cols-7 gap-1">
                        {#each getCalendarDays() as day}
                            <div 
                                class="min-h-[100px] border border-base-300/50 rounded p-1 cursor-pointer transition-all duration-200 hover:bg-base-200/50 {day.isCurrentMonth ? 'bg-base-50' : 'bg-base-300/20'} {day.isToday ? 'ring-2 ring-primary' : ''}"
                                on:click={() => selectedDate = new Date(calendarYear, calendarMonth, day.date)}
                                role="button"
                                tabindex="0"
                                on:keydown={(e) => e.key === 'Enter' && (selectedDate = new Date(calendarYear, calendarMonth, day.date))}
                            >
                                <!-- Date Number -->
                                <div class="flex justify-between items-start mb-1">
                                    <span class="text-sm font-medium {day.isCurrentMonth ? 'text-base-content' : 'text-base-content/40'} {day.isToday ? 'text-primary font-bold' : ''}">
                                        {day.date}
                                    </span>
                                    {#if day.matches.length > 0}
                                        <div class="badge badge-primary badge-xs">
                                            {day.matches.length}
                                        </div>
                                    {/if}
                                </div>

                                <!-- Matches for this day -->
                                <div class="space-y-1">
                                    {#each day.matches.slice(0, 3) as match}
                                        <div class="text-xs p-1 rounded {getStatusColor(match.status) === 'success' ? 'bg-success/20 text-success-content' : getStatusColor(match.status) === 'info' ? 'bg-info/20 text-info-content' : getStatusColor(match.status) === 'warning' ? 'bg-warning/20 text-warning-content' : 'bg-neutral/20 text-neutral-content'}">
                                            <div class="font-medium truncate">
                                                {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                                            </div>
                                            <div class="text-xs opacity-70">
                                                {match.matchTime || 'TBD'}
                                            </div>
                                            {#if match.status === 'Completed'}
                                                <div class="font-bold text-xs">
                                                    {formatMatchResult(match)}
                                                </div>
                                            {/if}
                                        </div>
                                    {/each}
                                    {#if day.matches.length > 3}
                                        <div class="text-xs text-center text-base-content/60 font-medium">
                                            +{day.matches.length - 3} more
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>

        <!-- Selected Date Details (if any date is selected) -->
        {#if selectedDate}
            <div class="card bg-base-100 shadow-lg mt-4" transition:slide>
                <div class="card-body">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold">
                            Matches for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h3>
                        <button 
                            class="btn btn-sm btn-ghost"
                            on:click={() => selectedDate = null}
                            aria-label="Close details"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {#if getMatchesForDate(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()).length === 0}
                        <div class="text-center py-8 text-base-content/60">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p class="font-medium">No matches scheduled</p>
                            <p class="text-sm">Create a new match for this date</p>
                            <button class="btn btn-sm btn-primary mt-3" on:click={() => showCreateMatchModal = true}>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Create Match
                            </button>
                        </div>
                    {:else}
                        <div class="space-y-3">
                            {#each getMatchesForDate(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()) as match}
                                <div class="border border-base-300 rounded-lg p-4 hover:bg-base-50 transition-colors">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-3 mb-2">
                                                <div class="font-bold text-lg">
                                                    {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                                                </div>
                                                <div class="badge badge-{getStatusColor(match.status)} badge-lg">
                                                    {match.status}
                                                </div>
                                            </div>
                                            <div class="text-sm text-base-content/70 space-y-1">
                                                <p>{match.homeTeam.name} vs {match.awayTeam.name}</p>
                                                <div class="flex gap-4">
                                                    <span>⏰ {match.matchTime || 'Time TBD'}</span>
                                                    <span>📍 {match.venue || 'Venue TBD'}</span>
                                                    <span>👥 {match.groupName}</span>
                                                </div>
                                                {#if match.status === 'Completed'}
                                                    <div class="font-bold text-primary">
                                                        Final Score: {formatMatchResult(match)}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                        <div class="flex gap-2">
                                            {#if match.status === 'Draft' || match.status === 'Scheduled'}
                                                <button 
                                                    class="btn btn-sm btn-success"
                                                    on:click={() => updateMatchStatus(match.id, 'Live')}
                                                >
                                                    Start
                                                </button>
                                            {/if}
                                            {#if match.status === 'Live'}
                                                <button 
                                                    class="btn btn-sm btn-warning"
                                                    on:click={() => updateMatchStatus(match.id, 'Completed')}
                                                >
                                                    End
                                                </button>
                                            {/if}
                                            <button 
                                                class="btn btn-sm btn-info"
                                                on:click={() => handleEditScore(match.id)}
                                            >
                                                Score
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    {/if}
</div>

<!-- Create Match Modal -->
<Modal bind:open={showCreateMatchModal} title="Create New Match" size="lg">
    <form on:submit|preventDefault={handleCreateMatch} class="space-y-4">
        <!-- Group Selection -->
        <div class="form-control">
            <label class="label" for="match-group">
                <span class="label-text">Group <span class="text-error">*</span></span>
            </label>
            <select
                id="match-group"
                bind:value={matchForm.groupId}
                class="select select-bordered w-full"
                required
            >
                <option value="" disabled>Select a group</option>
                {#each groups as group}
                    <option value={group.id}>{group.name} - {group.leagueName}</option>
                {/each}
            </select>
        </div>

        <!-- Teams Selection -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label" for="match-home-team">
                    <span class="label-text">Home Team <span class="text-error">*</span></span>
                </label>
                <select
                    id="match-home-team"
                    bind:value={matchForm.homeTeamId}
                    class="select select-bordered w-full"
                    required
                    disabled={!selectedGroupTeams.length}
                >
                    <option value="" disabled>Select home team</option>
                    {#each selectedGroupTeams as team}
                        <option value={team.id}>{team.name}</option>
                    {/each}
                </select>
            </div>

            <div class="form-control">
                <label class="label" for="match-away-team">
                    <span class="label-text">Away Team <span class="text-error">*</span></span>
                </label>
                <select
                    id="match-away-team"
                    bind:value={matchForm.awayTeamId}
                    class="select select-bordered w-full"
                    required
                    disabled={!selectedGroupTeams.length}
                >
                    <option value="" disabled>Select away team</option>
                    {#each selectedGroupTeams as team}
                        {#if team.id.toString() !== matchForm.homeTeamId}
                            <option value={team.id}>{team.name}</option>
                        {/if}
                    {/each}
                </select>
            </div>
        </div>

        <!-- Match Date and Time -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label" for="match-date">
                    <span class="label-text">Match Date <span class="text-error">*</span></span>
                </label>
                <input
                    id="match-date"
                    type="date"
                    bind:value={matchForm.matchDate}
                    class="input input-bordered w-full"
                    required
                />
            </div>

            <div class="form-control">
                <label class="label" for="match-time">
                    <span class="label-text">Match Time <span class="text-error">*</span></span>
                </label>
                <input
                    id="match-time"
                    type="time"
                    bind:value={matchForm.matchTime}
                    class="input input-bordered w-full"
                    required
                />
            </div>
        </div>

        <!-- Venue and Round -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label" for="match-venue">
                    <span class="label-text">Venue</span>
                </label>
                <input
                    id="match-venue"
                    type="text"
                    bind:value={matchForm.venue}
                    placeholder="Stadium name (optional)"
                    class="input input-bordered w-full"
                />
            </div>

            <div class="form-control">
                <label class="label" for="match-round">
                    <span class="label-text">Round</span>
                </label>
                <input
                    id="match-round"
                    type="number"
                    bind:value={matchForm.round}
                    min="1"
                    max="10"
                    class="input input-bordered w-full"
                />
            </div>
        </div>

        <!-- Modal Actions -->
        <div class="modal-action">
            <button type="button" class="btn btn-ghost" on:click={handleCloseModal}>
                Cancel
            </button>
            <button type="submit" class="btn btn-primary">
                Create Match
            </button>
        </div>
    </form>
</Modal>

<!-- Auto Generate Modal -->
<Modal bind:open={showScheduleModal} title="Auto Generate Matches" size="md">
    <div class="space-y-4">
        <div class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Generate round-robin matches for a group. This will create matches between all teams.</span>
        </div>

        <div class="form-control">
            <label class="label" for="auto-generate-group">
                <span class="label-text">Select Group</span>
            </label>
            <select id="auto-generate-group" class="select select-bordered w-full" bind:value={selectedGroup}>
                <option value="" disabled>Choose a group</option>
                {#each groups as group}
                    <option value={group.id}>{group.name} - {group.leagueName} ({group.teams.length} teams)</option>
                {/each}
            </select>
        </div>

        <div class="modal-action">
            <button class="btn btn-ghost" on:click={() => showScheduleModal = false}>
                Cancel
            </button>
            <button 
                class="btn btn-primary" 
                disabled={!selectedGroup}
                on:click={() => {
                    generateRoundRobin(parseInt(selectedGroup));
                    showScheduleModal = false;
                    selectedGroup = '';
                }}
            >
                Generate Matches
            </button>
        </div>
    </div>
</Modal>

<style>
    /* Enhanced table scrolling */
    .overflow-x-auto {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
    }
    
    .overflow-x-auto::-webkit-scrollbar {
        height: 8px;
    }
    
    .overflow-x-auto::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
    }
    
    .overflow-x-auto::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
    }
    
    .overflow-x-auto::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }
    
    /* Ensure sticky columns don't interfere with content */
    .table th.sticky,
    .table td.sticky {
        background-color: inherit;
        box-shadow: -4px 0 8px rgba(0, 0, 0, 0.1);
    }
    
    /* Smooth transitions for hover effects */
    .table tbody tr {
        transition: background-color 0.2s ease;
    }
    
    /* Improve button spacing in actions column */
    .table td .btn {
        min-height: 2rem;
    }
    
    /* Calendar enhancements */
    .grid > div[role="button"] {
        transition: all 0.2s ease;
    }
    
    .grid > div[role="button"]:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    /* Mobile calendar improvements */
    @media (max-width: 768px) {
        .grid > div[role="button"] {
            min-height: 80px;
            font-size: 0.8rem;
        }
    }
</style>
