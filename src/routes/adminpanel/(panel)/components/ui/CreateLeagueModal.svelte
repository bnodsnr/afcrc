<script lang="ts">
    import Modal from './Modal.svelte';
    import RichTextEditor from './RichTextEditor.svelte';
    import { createEventDispatcher } from 'svelte';

    export let open = false;

    const dispatch = createEventDispatcher();

    let formData = {
        name: '',
        season: '',
        description: '',
        teams: 0,
        status: 'Pending'
    };

    function handleSubmit() {
        // Validate form
        if (!formData.name || !formData.season) {
            alert('Please fill in all required fields');
            return;
        }

        // Dispatch event with form data
        dispatch('submit', formData);
        
        // Reset form
        resetForm();
        
        // Close modal
        open = false;
    }

    function resetForm() {
        formData = {
            name: '',
            season: '',
            description: '',
            teams: 0,
            status: 'Pending'
        };
    }

    function handleClose() {
        resetForm();
        open = false;
        dispatch('close');
    }
</script>

<Modal bind:open title="Create New League" size="md" on:close={handleClose}>
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <!-- League Name -->
        <div class="form-control">
            <label class="label" for="league-name">
                <span class="label-text">League Name <span class="text-error">*</span></span>
            </label>
            <input
                id="league-name"
                type="text"
                bind:value={formData.name}
                placeholder="Enter league name"
                class="input input-bordered w-full"
                required
            />
        </div>

        <!-- Season -->
        <div class="form-control">
            <label class="label" for="league-season">
                <span class="label-text">Season <span class="text-error">*</span></span>
            </label>
            <input
                id="league-season"
                type="text"
                bind:value={formData.season}
                placeholder="e.g., 2025-2026"
                class="input input-bordered w-full"
                required
            />
        </div>

        <!-- Description -->
        <div class="form-control">
            <label class="label" for="league-description">
                <span class="label-text">Description</span>
            </label>
            <RichTextEditor
                bind:value={formData.description}
                placeholder="Enter league description..."
            />
        </div>

        <!-- Number of Teams -->
        <div class="form-control">
            <label class="label" for="league-teams">
                <span class="label-text">Number of Teams</span>
            </label>
            <input
                id="league-teams"
                type="number"
                bind:value={formData.teams}
                placeholder="Enter number of teams"
                class="input input-bordered w-full"
                min="0"
            />
        </div>

        <!-- Status -->
        <div class="form-control">
            <label class="label" for="league-status">
                <span class="label-text">Status</span>
            </label>
            <select
                id="league-status"
                bind:value={formData.status}
                class="select select-bordered w-full"
            >
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
            </select>
        </div>
    </form>

    <svelte:fragment slot="footer">
        <button type="button" class="btn btn-ghost" on:click={handleClose}>
            Cancel
        </button>
        <button type="button" class="btn btn-primary" on:click={handleSubmit}>
            <i class="fas fa-plus mr-2"></i>
            Create League
        </button>
    </svelte:fragment>
</Modal>
