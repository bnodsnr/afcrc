<script lang="ts">
	import { onMount } from 'svelte';
	import Quill from 'quill';
	import 'quill/dist/quill.core.css';
	import 'quill/dist/quill.snow.css';

	interface Props {
		value?: string;
		placeholder?: string;
		height?: string;
	}

	let { value = $bindable(), placeholder = '', height = 'h-64' }: Props = $props();

	let editorElement: HTMLDivElement;
	let quill: Quill;
	let isReady = false;

	onMount(() => {
		quill = new Quill(editorElement, {
			theme: 'snow',
			placeholder,
			modules: {
				toolbar: [
					[{ header: [1, 2, 3, 4, 5, 6, false] }],
					['bold', 'italic', 'underline', 'strike'],
					['blockquote', 'code-block'],
					[{ list: 'ordered' }, { list: 'bullet' }],
					[{ script: 'sub' }, { script: 'super' }],
					[{ indent: '-1' }, { indent: '+1' }],
					[{ color: [] }, { background: [] }],
					[{ font: [] }],
					[{ align: [] }],
					['link', 'image', 'video'],
					['clean']
				]
			}
		});

		// Set initial value
		if (value) {
			quill.root.innerHTML = value;
		}

		// Update parent on change
		quill.on('text-change', () => {
			value = quill.root.innerHTML;
		});

		isReady = true;
	});

	$effect(() => {
		// Update editor content when value prop changes from outside
		if (isReady && quill && value !== quill.root.innerHTML) {
			quill.root.innerHTML = value || '';
		}
	});
</script>

<div class="quill-editor-wrapper">
	<div bind:this={editorElement} class={height}></div>
</div>

<style>
	:global(.quill-editor-wrapper .ql-toolbar) {
		border: 1px solid
			color-mix(
				in oklab,
				var(--color-base-content) calc(var(--tw-border-opacity) * 100%),
				transparent
			);
		border-bottom: none;
		border-radius: 0.375rem 0.375rem 0 0;
		background-color: var(--color-base-200);
	}

	:global(.quill-editor-wrapper .ql-container) {
		border: 1px solid
			color-mix(
				in oklab,
				var(--color-base-content) calc(var(--tw-border-opacity) * 100%),
				transparent
			);
		border-radius: 0 0 0.375rem 0.375rem;
		font-family: inherit;
		font-size: 1rem;
		background-color: var(--color-base-100);
	}

	:global(.quill-editor-wrapper .ql-editor) {
		min-height: 100%;
		padding: 1rem;
	}

	:global(.quill-editor-wrapper .ql-editor.ql-blank::before) {
		color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
		font-style: italic;
	}

	:global(.quill-editor-wrapper .ql-toolbar button:hover),
	:global(.quill-editor-wrapper .ql-toolbar button:focus),
	:global(.quill-editor-wrapper .ql-toolbar button.ql-active),
	:global(.quill-editor-wrapper .ql-toolbar.ql-snow .ql-picker-label:hover),
	:global(.quill-editor-wrapper .ql-toolbar.ql-snow .ql-picker-item:hover),
	:global(.quill-editor-wrapper .ql-toolbar.ql-snow .ql-picker-item.ql-selected) {
		color: var(--color-primary);
	}

	:global(.quill-editor-wrapper .ql-snow .ql-stroke) {
		stroke: var(--color-base-content);
	}

	:global(.quill-editor-wrapper .ql-snow .ql-fill) {
		fill: var(--color-base-content);
	}

	:global(.quill-editor-wrapper .ql-toolbar.ql-snow .ql-picker-label) {
		color: var(--color-base-content);
	}
</style>
