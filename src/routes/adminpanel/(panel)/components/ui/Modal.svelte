<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';

    export let open = false;
    export let title = '';
    export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

    const dispatch = createEventDispatcher();

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl'
    };

    function close() {
        open = false;
        dispatch('close');
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            close();
        }
    }

    function handleEscape(event: KeyboardEvent) {
        if (event.key === 'Escape' && open) {
            close();
        }
    }
</script>

<svelte:window on:keydown={handleEscape} />

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        on:click={handleBackdropClick}
        on:keydown={handleEscape}
        role="button"
        tabindex="-1"
        transition:fade={{ duration: 200 }}
    >
        <div
            class="bg-base-100 rounded-lg shadow-xl w-full {sizeClasses[size]} max-h-[90vh] flex flex-col"
            transition:scale={{ duration: 200, start: 0.95 }}
        >
            <!-- Modal Header -->
            <div class="flex justify-between items-center p-6 border-b border-base-300">
                <h3 class="text-xl font-bold">{title}</h3>
                <button
                    class="btn btn-sm btn-circle btn-ghost"
                    on:click={close}
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 overflow-y-auto flex-1">
                <slot />
            </div>

            <!-- Modal Footer -->
            {#if $$slots.footer}
                <div class="flex justify-end gap-2 p-6 border-t border-base-300">
                    <slot name="footer" />
                </div>
            {/if}
        </div>
    </div>
{/if}
