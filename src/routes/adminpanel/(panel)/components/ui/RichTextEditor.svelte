<script lang="ts">
    import { onMount } from 'svelte';

    export let value = '';
    export let placeholder = 'Enter text...';

    let editor: HTMLDivElement;
    let isFocused = false;

    onMount(() => {
        if (editor && value) {
            editor.innerHTML = value;
        }
    });

    function execCommand(command: string, value: string | null = null) {
        document.execCommand(command, false, value || undefined);
        updateValue();
    }

    function updateValue() {
        if (editor) {
            value = editor.innerHTML;
        }
    }

    function handlePaste(e: ClipboardEvent) {
        e.preventDefault();
        const text = e.clipboardData?.getData('text/plain');
        document.execCommand('insertText', false, text);
    }

    function handleFocus() {
        isFocused = true;
    }

    function handleBlur() {
        isFocused = false;
        updateValue();
    }
</script>

<div class="border border-base-300 rounded-lg overflow-hidden {isFocused ? 'ring-2 ring-primary' : ''}">
    <!-- Toolbar -->
    <div class="bg-base-200 border-b border-base-300 p-2 flex flex-wrap gap-1">
        <button
            type="button"
            class="btn btn-xs btn-ghost"
            on:click={() => execCommand('bold')}
            title="Bold"
            aria-label="Bold"
        >
            <i class="fas fa-bold"></i>
        </button>
        <button
            type="button"
            class="btn btn-xs btn-ghost"
            on:click={() => execCommand('italic')}
            title="Italic"
            aria-label="Italic"
        >
            <i class="fas fa-italic"></i>
        </button>
        <button
            type="button"
            class="btn btn-xs btn-ghost"
            on:click={() => execCommand('underline')}
            title="Underline"
            aria-label="Underline"
        >
            <i class="fas fa-underline"></i>
        </button>
        
        <div class="divider divider-horizontal mx-0"></div>
        
        <button
            type="button"
            class="btn btn-xs btn-ghost"
            on:click={() => execCommand('insertUnorderedList')}
            title="Bullet List"
            aria-label="Bullet List"
        >
            <i class="fas fa-list-ul"></i>
        </button>
        <button
            type="button"
            class="btn btn-xs btn-ghost"
            on:click={() => execCommand('insertOrderedList')}
            title="Numbered List"
            aria-label="Numbered List"
        >
            <i class="fas fa-list-ol"></i>
        </button>
        
        <div class="divider divider-horizontal mx-0"></div>
        
        <button
            type="button"
            class="btn btn-xs btn-ghost"
            on:click={() => execCommand('justifyLeft')}
            title="Align Left"
            aria-label="Align Left"
        >
            <i class="fas fa-align-left"></i>
        </button>
        <button
            type="button"
            class="btn btn-xs btn-ghost"
            on:click={() => execCommand('justifyCenter')}
            title="Align Center"
            aria-label="Align Center"
        >
            <i class="fas fa-align-center"></i>
        </button>
        <button
            type="button"
            class="btn btn-xs btn-ghost"
            on:click={() => execCommand('justifyRight')}
            title="Align Right"
            aria-label="Align Right"
        >
            <i class="fas fa-align-right"></i>
        </button>
        
        <div class="divider divider-horizontal mx-0"></div>
        
        <button
            type="button"
            class="btn btn-xs btn-ghost"
            on:click={() => execCommand('removeFormat')}
            title="Clear Formatting"
            aria-label="Clear Formatting"
        >
            <i class="fas fa-eraser"></i>
        </button>
    </div>

    <!-- Editor -->
    <div
        bind:this={editor}
        contenteditable="true"
        class="p-4 min-h-[150px] max-h-[300px] overflow-y-auto focus:outline-none bg-base-100"
        on:input={updateValue}
        on:paste={handlePaste}
        on:focus={handleFocus}
        on:blur={handleBlur}
        role="textbox"
        aria-multiline="true"
        aria-label="Rich text editor"
        data-placeholder={placeholder}
    ></div>
</div>

<style>
    [contenteditable]:empty:before {
        content: attr(data-placeholder);
        color: #999;
        pointer-events: none;
    }

    [contenteditable] {
        outline: none;
    }

    [contenteditable] :global(p) {
        margin: 0.5em 0;
    }

    [contenteditable] :global(ul),
    [contenteditable] :global(ol) {
        margin-left: 1.5em;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
    }
</style>
