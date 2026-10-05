<script lang="ts">
    import Modal from '../components/ui/Modal.svelte';
    import { fade, slide } from 'svelte/transition';

    let showCreateClubModal = false;
    let searchQuery = '';
    let viewMode: 'list' | 'card' = 'card';

    // Sample clubs data - replace with actual API data
    let clubs = [
        {
            id: 1,
            name: 'Manchester United FC',
            shortName: 'MUN',
            founded: 1878,
            city: 'Manchester',
            country: 'England',
            stadium: 'Old Trafford',
            capacity: 74140,
            website: 'https://manutd.com',
            email: 'info@manutd.com',
            phone: '+44 161 868 8000',
            contactPerson: 'John Smith - Club Manager',
            logo: 'https://placehold.co/100x100/DC143C/white?text=MUN',
            status: 'Active',
            registrationDate: '2025-01-15'
        },
        {
            id: 2,
            name: 'Liverpool FC',
            shortName: 'LIV',
            founded: 1892,
            city: 'Liverpool',
            country: 'England',
            stadium: 'Anfield',
            capacity: 53394,
            website: 'https://liverpoolfc.com',
            email: 'info@liverpoolfc.com',
            phone: '+44 151 263 2361',
            contactPerson: 'Sarah Johnson - Registration Officer',
            logo: 'https://placehold.co/100x100/C8102E/white?text=LIV',
            status: 'Active',
            registrationDate: '2025-01-20'
        },
        {
            id: 3,
            name: 'Chelsea FC',
            shortName: 'CHE',
            founded: 1905,
            city: 'London',
            country: 'England',
            stadium: 'Stamford Bridge',
            capacity: 40341,
            website: 'https://chelseafc.com',
            email: 'info@chelseafc.com',
            phone: '+44 207 915 2900',
            contactPerson: 'Michael Brown - Operations Manager',
            logo: 'https://placehold.co/100x100/034694/white?text=CHE',
            status: 'Active',
            registrationDate: '2025-02-01'
        },
        {
            id: 4,
            name: 'Arsenal FC',
            shortName: 'ARS',
            founded: 1886,
            city: 'London',
            country: 'England',
            stadium: 'Emirates Stadium',
            capacity: 60260,
            website: 'https://arsenal.com',
            email: 'info@arsenal.com',
            phone: '+44 207 619 5003',
            contactPerson: 'Emma Davis - Club Secretary',
            logo: 'https://placehold.co/100x100/EF0107/white?text=ARS',
            status: 'Pending',
            registrationDate: '2025-02-10'
        }
    ];

    // Club form data
    let clubForm = {
        name: '',
        shortName: '',
        founded: new Date().getFullYear(),
        city: '',
        country: '',
        stadium: '',
        capacity: 0,
        website: '',
        email: '',
        phone: '',
        contactPerson: '',
        logo: '',
        status: 'Pending'
    };

    // Filter clubs based on search
    $: filteredClubs = searchQuery
        ? clubs.filter(club =>
            Object.values(club).some(val =>
                String(val).toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : clubs;

    function handleCreateClub() {
        // Validate required fields
        if (!clubForm.name || !clubForm.shortName || !clubForm.city || !clubForm.country) {
            alert('Please fill in all required fields');
            return;
        }

        // Check for duplicate short name
        if (clubs.some(club => club.shortName.toLowerCase() === clubForm.shortName.toLowerCase())) {
            alert('A club with this short name already exists');
            return;
        }

        // Create new club
        const newClub = {
            id: clubs.length + 1,
            ...clubForm,
            registrationDate: new Date().toISOString().split('T')[0]
        };

        clubs = [...clubs, newClub];
        resetClubForm();
        showCreateClubModal = false;
        alert('Club registered successfully!');
    }

    function resetClubForm() {
        clubForm = {
            name: '',
            shortName: '',
            founded: new Date().getFullYear(),
            city: '',
            country: '',
            stadium: '',
            capacity: 0,
            website: '',
            email: '',
            phone: '',
            contactPerson: '',
            logo: '',
            status: 'Pending'
        };
    }

    function handleCloseModal() {
        resetClubForm();
        showCreateClubModal = false;
    }

    function updateClubStatus(clubId: number, status: string) {
        clubs = clubs.map(club => 
            club.id === clubId ? { ...club, status } : club
        );
    }

    function deleteClub(clubId: number) {
        if (confirm('Are you sure you want to delete this club?')) {
            clubs = clubs.filter(club => club.id !== clubId);
        }
    }

    function handleViewPlayers(clubId: number, clubName: string) {
        // For now, show an alert - this can be expanded to open a modal or navigate to players page
        alert(`Viewing players for ${clubName} (Club ID: ${clubId})\n\nThis will open the players management page.`);
        
        // TODO: Implement players page navigation or modal
        // Example: goto(`/clubs/${clubId}/players`);
        // Or open a players modal component
    }
</script>

<div class="p-4 space-y-4 bg-base-200 min-h-screen">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-base-100 p-4 rounded-lg shadow-sm">
        <div>
            <h1 class="text-2xl font-bold">Club Registration</h1>
            <p class="text-base-content/70 text-sm">Manage club registrations and details</p>
        </div>
        <div class="flex gap-2 items-center">
            <button class="btn btn-primary" on:click={() => showCreateClubModal = true}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Register New Club
            </button>
        </div>
    </div>

    <!-- Controls Section -->
    <div class="flex flex-col sm:flex-row gap-4 items-center justify-between bg-base-100 p-4 rounded-lg shadow-sm">
        <div class="flex-1 w-full sm:w-auto">
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search clubs..."
                class="input input-bordered w-full max-w-xs"
            />
        </div>
        <div class="flex gap-4 items-center">
            <div class="stats stats-sm shadow">
                <div class="stat">
                    <div class="stat-title">Total Clubs</div>
                    <div class="stat-value text-lg">{clubs.length}</div>
                </div>
                <div class="stat">
                    <div class="stat-title">Active</div>
                    <div class="stat-value text-lg text-success">{clubs.filter(c => c.status === 'Active').length}</div>
                </div>
                <div class="stat">
                    <div class="stat-title">Pending</div>
                    <div class="stat-value text-lg text-warning">{clubs.filter(c => c.status === 'Pending').length}</div>
                </div>
            </div>
            <div class="join">
                <button
                    class="join-item btn btn-sm {viewMode === 'list' ? 'btn-active' : ''}"
                    on:click={() => viewMode = 'list'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    List
                </button>
                <button
                    class="join-item btn btn-sm {viewMode === 'card' ? 'btn-active' : ''}"
                    on:click={() => viewMode = 'card'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Cards
                </button>
            </div>
        </div>
    </div>

    <!-- Clubs Display -->
    {#if viewMode === 'card'}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" transition:fade>
            {#each filteredClubs as club}
                <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow" transition:slide>
                    <div class="card-body">
                        <div class="flex items-center gap-4 mb-3">
                            <img src={club.logo} alt="{club.name} logo" class="w-16 h-16 rounded-lg object-cover" />
                            <div class="flex-1">
                                <h2 class="card-title text-lg">
                                    {club.name}
                                    <div class="badge badge-{club.status === 'Active' ? 'success' : 'warning'} ml-2">
                                        {club.status}
                                    </div>
                                </h2>
                                <p class="text-sm text-base-content/70">{club.shortName} • Founded {club.founded}</p>
                            </div>
                        </div>
                        
                        <div class="space-y-2 text-sm">
                            <div class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{club.city}, {club.country}</span>
                            </div>
                            {#if club.stadium}
                                <div class="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>{club.stadium} ({club.capacity?.toLocaleString() || 0})</span>
                                </div>
                            {/if}
                            {#if club.phone}
                                <div class="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>{club.phone}</span>
                                </div>
                            {/if}
                            {#if club.contactPerson}
                                <div class="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>{club.contactPerson}</span>
                                </div>
                            {/if}
                        </div>

                        <div class="card-actions justify-end mt-4">
                            {#if club.status === 'Pending'}
                                <button 
                                    class="btn btn-sm btn-success"
                                    on:click={() => updateClubStatus(club.id, 'Active')}
                                >
                                    Approve
                                </button>
                            {:else}
                                <button 
                                    class="btn btn-sm btn-warning"
                                    on:click={() => updateClubStatus(club.id, 'Pending')}
                                >
                                    Set Pending
                                </button>
                            {/if}
                            <button 
                                class="btn btn-sm btn-info"
                                on:click={() => handleViewPlayers(club.id, club.name)}
                                aria-label="View players for {club.name}"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Players
                            </button>
                            <button class="btn btn-sm btn-ghost" aria-label="Edit club">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button 
                                class="btn btn-sm btn-ghost text-error" 
                                on:click={() => deleteClub(club.id)}
                                aria-label="Delete club"
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
                        <table class="table w-full table-zebra min-w-[1200px]">
                        <thead class="bg-base-200">
                            <tr class="text-base-content/80 text-sm font-semibold">
                                <th class="bg-base-200 text-left px-6 py-4 w-64 min-w-[250px]">
                                    <div class="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        Club
                                    </div>
                                </th>
                                <th class="bg-base-200 text-left px-6 py-4 w-40 min-w-[160px]">
                                    <div class="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        Location
                                    </div>
                                </th>
                                <th class="bg-base-200 text-left px-6 py-4 w-48 min-w-[180px]">
                                    <div class="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11" />
                                        </svg>
                                        Stadium
                                    </div>
                                </th>
                                <th class="bg-base-200 text-left px-6 py-4 w-56 min-w-[220px]">
                                    <div class="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Contact
                                    </div>
                                </th>
                                <th class="bg-base-200 text-left px-6 py-4 w-24 min-w-[100px]">
                                    <div class="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Founded
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
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Registered
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
                            {#if filteredClubs.length === 0}
                                <tr>
                                    <td colspan="8" class="text-center py-12 text-base-content/60">
                                        <div class="flex flex-col items-center gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <div>
                                                <p class="font-medium">No clubs found</p>
                                                <p class="text-sm">Try adjusting your search or add a new club</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            {:else}
                                {#each filteredClubs as club}
                                    <tr class="hover:bg-base-200/50 transition-colors duration-200 border-b border-base-300/50" transition:fade>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-4">
                                                <div class="avatar">
                                                    <div class="mask mask-squircle w-12 h-12">
                                                        <img src={club.logo} alt="{club.name} logo" class="object-cover" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div class="font-semibold text-base-content">{club.name}</div>
                                                    <div class="text-sm text-base-content/60 font-medium">{club.shortName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-2">
                                                <div class="w-2 h-2 bg-primary rounded-full"></div>
                                                <span class="font-medium">{club.city}, {club.country}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div>
                                                <div class="font-medium">{club.stadium || 'TBD'}</div>
                                                <div class="text-sm text-base-content/60">{club.capacity?.toLocaleString() || 0} capacity</div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="space-y-1">
                                                {#if club.phone}
                                                    <div class="flex items-center gap-2">
                                                        <div class="w-1.5 h-1.5 bg-info rounded-full"></div>
                                                        <span class="text-sm font-medium">{club.phone}</span>
                                                    </div>
                                                {/if}
                                                {#if club.contactPerson}
                                                    <div class="flex items-center gap-2">
                                                        <div class="w-1.5 h-1.5 bg-accent rounded-full"></div>
                                                        <span class="text-sm text-base-content/70">{club.contactPerson}</span>
                                                    </div>
                                                {/if}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-2">
                                                <div class="badge badge-neutral badge-sm">{club.founded}</div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="badge badge-{club.status === 'Active' ? 'success' : 'warning'} badge-lg gap-2">
                                                {#if club.status === 'Active'}
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                {:else}
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                {/if}
                                                {club.status}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span class="text-sm font-medium">{new Date(club.registrationDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 sticky right-0 bg-base-100 shadow-lg">
                                            <div class="flex items-center gap-2 justify-center flex-wrap">
                                                {#if club.status === 'Pending'}
                                                    <button 
                                                        class="btn btn-sm btn-success gap-1 hover:scale-105 transition-transform"
                                                        on:click={() => updateClubStatus(club.id, 'Active')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Approve
                                                    </button>
                                                {:else}
                                                    <button 
                                                        class="btn btn-sm btn-warning gap-1 hover:scale-105 transition-transform"
                                                        on:click={() => updateClubStatus(club.id, 'Pending')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Pending
                                                    </button>
                                                {/if}
                                                <div class="tooltip tooltip-top" data-tip="View Players">
                                                    <button 
                                                        class="btn btn-sm btn-info gap-1 hover:scale-105 transition-transform"
                                                        on:click={() => handleViewPlayers(club.id, club.name)}
                                                        aria-label="View players for {club.name}"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                        Players
                                                    </button>
                                                </div>
                                                <div class="tooltip tooltip-top" data-tip="Edit Club">
                                                    <button class="btn btn-sm btn-ghost hover:scale-105 transition-transform" aria-label="Edit club">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div class="tooltip tooltip-top" data-tip="Delete Club">
                                                    <button 
                                                        class="btn btn-sm btn-ghost text-error hover:scale-105 transition-transform" 
                                                        on:click={() => deleteClub(club.id)}
                                                        aria-label="Delete club"
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

<!-- Create Club Modal -->
<Modal bind:open={showCreateClubModal} title="Register New Club" size="lg">
    <form on:submit|preventDefault={handleCreateClub} class="space-y-4">
        <!-- Club Name -->
        <div class="form-control">
            <label class="label" for="club-name">
                <span class="label-text">Club Name <span class="text-error">*</span></span>
            </label>
            <input
                id="club-name"
                type="text"
                bind:value={clubForm.name}
                placeholder="Enter full club name"
                class="input input-bordered w-full"
                required
            />
        </div>

        <!-- Short Name & Founded -->
        <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label" for="club-short-name">
                    <span class="label-text">Short Name <span class="text-error">*</span></span>
                </label>
                <input
                    id="club-short-name"
                    type="text"
                    bind:value={clubForm.shortName}
                    placeholder="e.g., MUN, LIV"
                    class="input input-bordered w-full"
                    maxlength="5"
                    required
                />
            </div>
            <div class="form-control">
                <label class="label" for="club-founded">
                    <span class="label-text">Founded Year</span>
                </label>
                <input
                    id="club-founded"
                    type="number"
                    bind:value={clubForm.founded}
                    min="1800"
                    max={new Date().getFullYear()}
                    class="input input-bordered w-full"
                />
            </div>
        </div>

        <!-- City & Country -->
        <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label" for="club-city">
                    <span class="label-text">City <span class="text-error">*</span></span>
                </label>
                <input
                    id="club-city"
                    type="text"
                    bind:value={clubForm.city}
                    placeholder="Enter city"
                    class="input input-bordered w-full"
                    required
                />
            </div>
            <div class="form-control">
                <label class="label" for="club-country">
                    <span class="label-text">Country <span class="text-error">*</span></span>
                </label>
                <input
                    id="club-country"
                    type="text"
                    bind:value={clubForm.country}
                    placeholder="Enter country"
                    class="input input-bordered w-full"
                    required
                />
            </div>
        </div>

        <!-- Stadium & Capacity -->
        <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label" for="club-stadium">
                    <span class="label-text">Stadium</span>
                </label>
                <input
                    id="club-stadium"
                    type="text"
                    bind:value={clubForm.stadium}
                    placeholder="Enter stadium name"
                    class="input input-bordered w-full"
                />
            </div>
            <div class="form-control">
                <label class="label" for="club-capacity">
                    <span class="label-text">Stadium Capacity</span>
                </label>
                <input
                    id="club-capacity"
                    type="number"
                    bind:value={clubForm.capacity}
                    min="0"
                    placeholder="Enter capacity"
                    class="input input-bordered w-full"
                />
            </div>
        </div>

        <!-- Website & Email -->
        <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label" for="club-website">
                    <span class="label-text">Website</span>
                </label>
                <input
                    id="club-website"
                    type="url"
                    bind:value={clubForm.website}
                    placeholder="https://example.com"
                    class="input input-bordered w-full"
                />
            </div>
            <div class="form-control">
                <label class="label" for="club-email">
                    <span class="label-text">Email</span>
                </label>
                <input
                    id="club-email"
                    type="email"
                    bind:value={clubForm.email}
                    placeholder="contact@club.com"
                    class="input input-bordered w-full"
                />
            </div>
        </div>

        <!-- Phone & Logo -->
        <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label" for="club-phone">
                    <span class="label-text">Phone</span>
                </label>
                <input
                    id="club-phone"
                    type="tel"
                    bind:value={clubForm.phone}
                    placeholder="+1 234 567 8900"
                    class="input input-bordered w-full"
                />
            </div>
            <div class="form-control">
                <label class="label" for="club-contact-person">
                    <span class="label-text">Contact Person</span>
                </label>
                <input
                    id="club-contact-person"
                    type="text"
                    bind:value={clubForm.contactPerson}
                    placeholder="John Smith - Manager"
                    class="input input-bordered w-full"
                />
            </div>
            <div class="form-control">
                <label class="label" for="club-logo">
                    <span class="label-text">Logo URL</span>
                </label>
                <input
                    id="club-logo"
                    type="url"
                    bind:value={clubForm.logo}
                    placeholder="https://example.com/logo.png"
                    class="input input-bordered w-full"
                />
            </div>
        </div>

        <!-- Status -->
        <div class="form-control">
            <label class="label" for="club-status">
                <span class="label-text">Registration Status</span>
            </label>
            <select
                id="club-status"
                bind:value={clubForm.status}
                class="select select-bordered w-full"
            >
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
            </select>
        </div>
    </form>

    <svelte:fragment slot="footer">
        <button type="button" class="btn btn-ghost" on:click={handleCloseModal}>
            Cancel
        </button>
        <button type="button" class="btn btn-primary" on:click={handleCreateClub}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Register Club
        </button>
    </svelte:fragment>
</Modal>
