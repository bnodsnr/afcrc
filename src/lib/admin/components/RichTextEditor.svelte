<!-- src/lib/components/RichTextEditor.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Paragraph from '@tiptap/extension-paragraph';
	import Placeholder from '@tiptap/extension-placeholder';
	import Link from '@tiptap/extension-link';
	import Underline from '@tiptap/extension-underline';
	import TextAlign from '@tiptap/extension-text-align';
	import Color from '@tiptap/extension-color';
	import Highlight from '@tiptap/extension-highlight';
	import Image from '@tiptap/extension-image';
	import FontFamily from '@tiptap/extension-font-family';
	import { TextStyle } from '@tiptap/extension-text-style';
	import DropCursor from '@tiptap/extension-dropcursor';
	import GapCursor from '@tiptap/extension-gapcursor';
	import Focus from '@tiptap/extension-focus';
	import ListKeymap from '@tiptap/extension-list-keymap';
	import { Table } from '@tiptap/extension-table';
	import { TableRow } from '@tiptap/extension-table-row';
	import { TableHeader } from '@tiptap/extension-table-header';
	import { TableCell } from '@tiptap/extension-table-cell';
	import { TaskList } from '@tiptap/extension-task-list';
	import { TaskItem } from '@tiptap/extension-task-item';
	import { Subscript } from '@tiptap/extension-subscript';
	import { Superscript } from '@tiptap/extension-superscript';
	import { Typography } from '@tiptap/extension-typography';
	import { Youtube as YouTube } from '@tiptap/extension-youtube';
	import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
	import { common, createLowlight } from 'lowlight';
	import { Details } from './editor/Details';
	import { Summary } from './editor/Summary';
	import { FontSize } from '@tiptap/extension-text-style/font-size';
	import { CharacterCount } from '@tiptap/extensions';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faBold,
		faItalic,
		faUnderline,
		faStrikethrough,
		faCode,
		faSubscript,
		faSuperscript,
		faAlignLeft,
		faAlignCenter,
		faAlignRight,
		faAlignJustify,
		faListUl,
		faListOl,
		faListCheck,
		faQuoteLeft,
		faMinus,
		faTable,
		faImage,
		faLink,
		faVideo,
		faHeading,
		faParagraph,
		faTextHeight,
		faIndent,
		faOutdent,
		faEye,
		faEyeSlash,
		faFileCode,
		faRotateLeft,
		faRotateRight,
		faEraser,
		faChevronDown,
		faTableCellsLarge,
		faTableList,
		faTrashAlt,
		faPlus,
		faColumns,
		faTableCells,
		faShareNodes,
		faPen
	} from '@fortawesome/free-solid-svg-icons';

	import { faYoutube } from '@fortawesome/free-brands-svg-icons';

	const lowlight = createLowlight(common);

	let {
		value = $bindable(''),
		name = 'content',
		placeholder = 'Start typing...',
		label = 'Content'
	} = $props();

	type ViewMode = 'richtext' | 'html' | 'plaintext';

	let element = $state<HTMLDivElement | null>(null);
	let editor = $state<Editor | null>(null);
	let colorInput = $state('#000000');
	let highlightColor = $state('#FFFF00');
	let fontFamily = $state('inherit');
	let fontSize = $state('inherit');
	let viewMode = $state<ViewMode>('richtext');
	let htmlSource = $state('');
	let plainTextSource = $state('');
	let charCount = $state(0);
	let wordCount = $state(0);

	const fonts = ['inherit', 'Arial', 'Georgia', 'Courier New', 'Comic Sans MS', 'Times New Roman'];
	const fontSizes = [
		'inherit',
		'12px',
		'14px',
		'16px',
		'18px',
		'20px',
		'24px',
		'28px',
		'32px',
		'36px',
		'40px',
		'48px',
		'56px',
		'64px',
		'72px'
	];

	let editorState = $state({
		bold: false,
		italic: false,
		underline: false,
		strike: false,
		code: false,
		subscript: false,
		superscript: false,
		h1: false,
		h2: false,
		h3: false,
		h4: false,
		h5: false,
		h6: false,
		paragraph: false,
		bulletList: false,
		orderedList: false,
		taskList: false,
		blockquote: false,
		codeBlock: false,
		link: false,
		table: false,
		details: false,
		alignLeft: false,
		alignCenter: false,
		alignRight: false,
		alignJustify: false,
		canUndo: false,
		canRedo: false,
		canMergeCells: false,
		canSplitCell: false,
		canDeleteTable: false,
		canSinkList: false,
		canLiftList: false
	});

	let activeHeading = $derived(
		editorState.h1 ? 'Heading 1' : editorState.h2 ? 'Heading 2'
			: editorState.h3 ? 'Heading 3' : editorState.h4 ? 'Heading 4'
			: editorState.h5 ? 'Heading 5' : editorState.h6 ? 'Heading 6'
			: 'Paragraph'
	);

	function refreshEditorState() {
		if (!editor) return;
		editorState = {
			bold: editor.isActive('bold'),
			italic: editor.isActive('italic'),
			underline: editor.isActive('underline'),
			strike: editor.isActive('strike'),
			code: editor.isActive('code'),
			subscript: editor.isActive('subscript'),
			superscript: editor.isActive('superscript'),
			h1: editor.isActive('heading', { level: 1 }),
			h2: editor.isActive('heading', { level: 2 }),
			h3: editor.isActive('heading', { level: 3 }),
			h4: editor.isActive('heading', { level: 4 }),
			h5: editor.isActive('heading', { level: 5 }),
			h6: editor.isActive('heading', { level: 6 }),
			paragraph: editor.isActive('paragraph'),
			bulletList: editor.isActive('bulletList'),
			orderedList: editor.isActive('orderedList'),
			taskList: editor.isActive('taskList'),
			blockquote: editor.isActive('blockquote'),
			codeBlock: editor.isActive('codeBlock'),
			link: editor.isActive('link'),
			table: editor.isActive('table'),
			details: editor.isActive('details'),
			alignLeft: editor.isActive({ textAlign: 'left' }),
			alignCenter: editor.isActive({ textAlign: 'center' }),
			alignRight: editor.isActive({ textAlign: 'right' }),
			alignJustify: editor.isActive({ textAlign: 'justify' }),
			canUndo: editor.can().undo(),
			canRedo: editor.can().redo(),
			canMergeCells: editor.can().mergeCells(),
			canSplitCell: editor.can().splitCell(),
			canDeleteTable: editor.can().deleteTable(),
			canSinkList: editor.can().sinkListItem('listItem'),
			canLiftList: editor.can().liftListItem('listItem')
		};
	}

	onMount(() => {
		editor = new Editor({
			element: element as HTMLDivElement,
			extensions: [
				StarterKit.configure({
					link: false,
					underline: false,
					dropcursor: false,
					gapcursor: false,
					listKeymap: false,
					codeBlock: false
				}),
				Paragraph,
				Placeholder.configure({ placeholder }),
				Link.configure({
					openOnClick: false
				}),
				Underline,
				TextAlign.configure({
					types: ['heading', 'paragraph']
				}),
				Color.configure({
					types: ['textStyle']
				}),
				TextStyle,
				FontSize,
				Highlight.configure({
					multicolor: true
				}),
				Image.configure({
					allowBase64: true
				}),
				FontFamily.configure({
					types: ['textStyle']
				}),
				CharacterCount.configure({
					limit: null
				}),
				DropCursor.configure({
					class: 'drop-cursor',
					width: 2,
					color: '#3b82f6'
				}),
				GapCursor,
				Focus.configure({
					mode: 'all'
				}),
				ListKeymap,
				Table.configure({
					resizable: true,
					lastColumnResizable: false,
					allowTableNodeSelection: true
				}),
				TableRow,
				TableHeader,
				TableCell,
				TaskList,
				TaskItem.configure({
					nested: true
				}),
				Subscript,
				Superscript,
				Typography,
				YouTube.configure({
					nocookie: true,
					controls: true,
					modestBranding: true
				}),
				CodeBlockLowlight.configure({
					lowlight
				}),
				Details,
				Summary
			],
			content: value,
			onUpdate({ editor }) {
				value = editor.getHTML(); // sync back to parent
				charCount = editor.storage.characterCount.characters();
				wordCount = editor.storage.characterCount.words();
			}
		});

		editor.on('transaction', refreshEditorState);
		editor.on('selectionUpdate', refreshEditorState);
		charCount = editor.storage.characterCount.characters();
		wordCount = editor.storage.characterCount.words();
		refreshEditorState();
	});

	onDestroy(() => editor?.destroy());

	// Toolbar button handler
	function handleToolbarClick(action: () => void) {
		action();
		editor?.view.focus();
		refreshEditorState();
	}

	// Font family change
	function changeFontFamily(font: string) {
		fontFamily = font;
		if (editor) {
			if (font === 'inherit') {
				editor.chain().focus().unsetFontFamily().run();
			} else {
				editor.chain().focus().setFontFamily(font).run();
			}
		}
	}

	// Font size change
	function changeFontSize(size: string) {
		fontSize = size;
		if (editor) {
			if (size === 'inherit') {
				editor.chain().focus().unsetFontSize().run();
			} else {
				editor.chain().focus().setFontSize(size).run();
			}
		}
	}

	// Heading change
	function changeHeading(level: number | null) {
		if (!editor) return;
		if (level === null) {
			editor.chain().focus().setParagraph().run();
		} else {
			editor.chain().focus().setHeading({ level: level as 1 }).run();
		}
		refreshEditorState();
	}

	// Handle image upload
	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			const reader = new FileReader();
			reader.onload = (e) => {
				const url = e.target?.result as string;
				editor?.chain().focus().setImage({ src: url }).run();
			};
			reader.readAsDataURL(file);
		}
	}

	// Handle image via URL
	function handleImageUrl() {
		const url = window.prompt('Enter the image URL:');
		if (url) {
			editor?.chain().focus().setImage({ src: url }).run();
		}
	}

	// Handle YouTube embed
	function handleYouTubeInsert() {
		const url = window.prompt('Enter the YouTube video URL:');
		if (url) {
			editor?.chain().focus().setYoutubeVideo({ src: url }).run();
		}
	}

	// Handle link
	function handleLinkInsert() {
		if (editor?.isActive('link')) {
			editor.chain().focus().unsetLink().run();
		} else {
			const url = window.prompt('Enter the URL of the link:');
			if (url) {
				editor?.chain().focus().setLink({ href: url }).run();
			}
		}
	}

	// Handle table insert
	function insertTable() {
		editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
	}

	// View mode switch
	function switchView(mode: ViewMode) {
		if (mode === viewMode) return;
		if (!editor) return;

		if (mode === 'html') {
			htmlSource = editor.getHTML();
		} else if (mode === 'plaintext') {
			plainTextSource = htmlToPlainText(editor.getHTML());
		} else {
			// coming back to richtext — push html/plaintext back into editor
			const source =
				viewMode === 'html'
					? htmlSource
					: escapeHtml(plainTextSource);
			editor.commands.setContent(source, { emitUpdate: false });
			value = editor.getHTML();
		}
		viewMode = mode;
	}

	// Convert editor HTML into a readable plain-text string
	function htmlToPlainText(html: string) {
		const div = document.createElement('div');
		div.innerHTML = html;
		div
			.querySelectorAll(
				'p, div, br, hr, li, h1, h2, h3, h4, h5, h6, tr, blockquote, pre, details, summary'
			)
			.forEach((el) => el.after(document.createTextNode('\n')));
		return (div.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
	}

	// Escape plain text so it can be safely inserted back into the editor
	function escapeHtml(text: string) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	// Sync from HTML/plain text view while editing
	function syncSource() {
		if (!editor) return;
		if (viewMode === 'html') {
			editor.commands.setContent(htmlSource, { emitUpdate: false });
			value = editor.getHTML();
		} else if (viewMode === 'plaintext') {
			editor.commands.setContent(escapeHtml(plainTextSource), { emitUpdate: false });
			value = editor.getHTML();
		}
		charCount = editor.storage.characterCount.characters();
		wordCount = editor.storage.characterCount.words();
	}

	function handleIndent() {
		const ed = editor;
		if (!ed) return;
		if (ed.can().sinkListItem('listItem')) {
			ed.chain().focus().sinkListItem('listItem').run();
		}
		refreshEditorState();
	}

	function handleOutdent() {
		const ed = editor;
		if (!ed) return;
		if (ed.can().liftListItem('listItem')) {
			ed.chain().focus().liftListItem('listItem').run();
		}
		refreshEditorState();
	}
</script>

<!-- Hidden input carries the HTML value for form submission -->
<input type="hidden" {name} {value} />

<div class="editor-wrapper">
	{#if label}
		<label class="mb-2 block text-sm font-medium text-gray-700">{label}</label>
	{/if}

	<!-- View Mode Toggle -->
	{#if editor}
		<div class="view-toggle">
			<button
				type="button"
				class="view-toggle-btn"
				class:active={viewMode === 'richtext'}
				onclick={() => switchView('richtext')}
				title="Rich Text View"
			>
				<FontAwesomeIcon icon={faParagraph} class="h-4 w-4" fixedWidth />
				<span>Rich Text</span>
			</button>
			<button
				type="button"
				class="view-toggle-btn"
				class:active={viewMode === 'html'}
				onclick={() => switchView('html')}
				title="HTML Source View"
			>
				<FontAwesomeIcon icon={faCode} class="h-4 w-4" fixedWidth />
				<span>HTML</span>
			</button>
			<button
				type="button"
				class="view-toggle-btn"
				class:active={viewMode === 'plaintext'}
				onclick={() => switchView('plaintext')}
				title="Plain Text View"
			>
				<FontAwesomeIcon icon={faFileCode} class="h-4 w-4" fixedWidth />
				<span>Plain Text</span>
			</button>
		</div>
	{/if}

	{#if editor && viewMode === 'richtext'}
		{@const ed = editor}
		<!-- Modern Toolbar -->
		<div class="toolbar">
			<!-- Undo / Redo -->
			<div class="toolbar-group">
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().undo().run())}
					disabled={!editorState.canUndo}
					title="Undo (Ctrl+Z)"
					aria-label="Undo"
				>
					<FontAwesomeIcon icon={faRotateLeft} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().redo().run())}
					disabled={!editorState.canRedo}
					title="Redo (Ctrl+Y)"
					aria-label="Redo"
				>
					<FontAwesomeIcon icon={faRotateRight} class="h-4 w-4" fixedWidth />
				</button>
			</div>

			<!-- Divider -->
			<div class="toolbar-divider"></div>

			<!-- Heading dropdown -->
			<div class="toolbar-group toolbar-dropdown">
				<select
					value={activeHeading}
					onchange={(e) => {
						const val = (e.currentTarget as HTMLSelectElement).value;
						const levels: Record<string, number | null> = {
							Paragraph: null,
							'Heading 1': 1,
							'Heading 2': 2,
							'Heading 3': 3,
							'Heading 4': 4,
							'Heading 5': 5,
							'Heading 6': 6
						};
						handleToolbarClick(() => changeHeading(levels[val] ?? null));
					}}
					title="Text Style"
					class="toolbar-select"
					aria-label="Heading Level"
				>
					<option value="Paragraph">Paragraph</option>
					<option value="Heading 1">Heading 1</option>
					<option value="Heading 2">Heading 2</option>
					<option value="Heading 3">Heading 3</option>
					<option value="Heading 4">Heading 4</option>
					<option value="Heading 5">Heading 5</option>
					<option value="Heading 6">Heading 6</option>
				</select>
			</div>

			<!-- Divider -->
			<div class="toolbar-divider"></div>

			<!-- Font Family -->
			<div class="toolbar-group">
				<select
					value={fontFamily}
					onchange={(e) => changeFontFamily(e.currentTarget.value)}
					title="Font Family"
					class="toolbar-select"
					aria-label="Font Family"
				>
					{#each fonts as font}
						<option value={font}>{font === 'inherit' ? 'Default' : font}</option>
					{/each}
				</select>
			</div>

			<!-- Divider -->
			<div class="toolbar-divider"></div>

			<!-- Font Size -->
			<div class="toolbar-group">
				<select
					value={fontSize}
					onchange={(e) => changeFontSize(e.currentTarget.value)}
					title="Font Size"
					class="toolbar-select toolbar-select-sm"
					aria-label="Font Size"
				>
					{#each fontSizes as size}
						<option value={size}>{size === 'inherit' ? 'Size' : size}</option>
					{/each}
				</select>
			</div>

			<!-- Divider -->
			<div class="toolbar-divider"></div>

			<!-- Text Formatting -->
			<div class="toolbar-group">
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleBold().run())}
					class:active={editorState.bold}
					title="Bold (Ctrl+B)"
					aria-label="Bold"
				>
					<FontAwesomeIcon icon={faBold} class="h-4 w-4" fixedWidth />
				</button>

				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleItalic().run())}
					class:active={editorState.italic}
					title="Italic (Ctrl+I)"
					aria-label="Italic"
				>
					<FontAwesomeIcon icon={faItalic} class="h-4 w-4" fixedWidth />
				</button>

				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleUnderline().run())}
					class:active={editorState.underline}
					title="Underline (Ctrl+U)"
					aria-label="Underline"
				>
					<FontAwesomeIcon icon={faUnderline} class="h-4 w-4" fixedWidth />
				</button>

				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleStrike().run())}
					class:active={editorState.strike}
					title="Strikethrough"
					aria-label="Strikethrough"
				>
					<FontAwesomeIcon icon={faStrikethrough} class="h-4 w-4" fixedWidth />
				</button>

				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleCode().run())}
					class:active={editorState.code}
					title="Inline Code"
					aria-label="Inline Code"
				>
					<FontAwesomeIcon icon={faCode} class="h-4 w-4" fixedWidth />
				</button>

				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleSubscript().run())}
					class:active={editorState.subscript}
					title="Subscript"
					aria-label="Subscript"
				>
					<FontAwesomeIcon icon={faSubscript} class="h-4 w-4" fixedWidth />
				</button>

				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleSuperscript().run())}
					class:active={editorState.superscript}
					title="Superscript"
					aria-label="Superscript"
				>
					<FontAwesomeIcon icon={faSuperscript} class="h-4 w-4" fixedWidth />
				</button>
			</div>

			<!-- Divider -->
			<div class="toolbar-divider"></div>

			<!-- Text Color & Highlight -->
			<div class="toolbar-group toolbar-color-group">
				<div class="color-input-wrap" title="Text Color">
					<FontAwesomeIcon icon={faTextHeight} class="h-4 w-4" fixedWidth />
					<input type="color" value={colorInput} title="Text Color" class="color-input"
						onchange={(e) => {
							colorInput = e.currentTarget.value;
							editor?.chain().focus().setColor(colorInput).run();
						}} />
				</div>
				<div class="color-input-wrap" title="Highlight Color">
					<FontAwesomeIcon icon={faPen} class="h-4 w-4" fixedWidth />
					<input type="color" value={highlightColor} title="Highlight Color" class="color-input"
						onchange={(e) => {
							highlightColor = e.currentTarget.value;
							editor?.chain().focus().setHighlight({ color: highlightColor }).run();
						}} />
				</div>
			</div>

			<!-- Divider -->
			<div class="toolbar-divider"></div>

			<!-- Alignment -->
			<div class="toolbar-group">
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().setTextAlign('left').run())}
					class:active={editorState.alignLeft}
					title="Align Left"
					aria-label="Align Left"
				>
					<FontAwesomeIcon icon={faAlignLeft} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().setTextAlign('center').run())}
					class:active={editorState.alignCenter}
					title="Align Center"
					aria-label="Align Center"
				>
					<FontAwesomeIcon icon={faAlignCenter} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().setTextAlign('right').run())}
					class:active={editorState.alignRight}
					title="Align Right"
					aria-label="Align Right"
				>
					<FontAwesomeIcon icon={faAlignRight} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().setTextAlign('justify').run())}
					class:active={editorState.alignJustify}
					title="Justify"
					aria-label="Justify"
				>
					<FontAwesomeIcon icon={faAlignJustify} class="h-4 w-4" fixedWidth />
				</button>
			</div>

			<!-- Divider -->
			<div class="toolbar-divider"></div>

			<!-- Lists -->
			<div class="toolbar-group">
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleBulletList().run())}
					class:active={editorState.bulletList}
					title="Bullet List"
					aria-label="Bullet List"
				>
					<FontAwesomeIcon icon={faListUl} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleOrderedList().run())}
					class:active={editorState.orderedList}
					title="Ordered List"
					aria-label="Ordered List"
				>
					<FontAwesomeIcon icon={faListOl} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleTaskList().run())}
					class:active={editorState.taskList}
					title="Task List"
					aria-label="Task List"
				>
					<FontAwesomeIcon icon={faListCheck} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(handleIndent)}
					disabled={!editorState.canSinkList}
					title="Increase Indent"
					aria-label="Increase Indent"
				>
					<FontAwesomeIcon icon={faIndent} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(handleOutdent)}
					disabled={!editorState.canLiftList}
					title="Decrease Indent"
					aria-label="Decrease Indent"
				>
					<FontAwesomeIcon icon={faOutdent} class="h-4 w-4" fixedWidth />
				</button>
			</div>

			<!-- Divider -->
			<div class="toolbar-divider"></div>

			<!-- Block Elements -->
			<div class="toolbar-group">
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleBlockquote().run())}
					class:active={editorState.blockquote}
					title="Blockquote"
					aria-label="Blockquote"
				>
					<FontAwesomeIcon icon={faQuoteLeft} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleCodeBlock().run())}
					class:active={editorState.codeBlock}
					title="Code Block"
					aria-label="Code Block"
				>
					<FontAwesomeIcon icon={faCode} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().setHorizontalRule().run())}
					title="Horizontal Rule"
					aria-label="Horizontal Rule"
				>
					<FontAwesomeIcon icon={faMinus} class="h-4 w-4" fixedWidth />
				</button>
			</div>

			<!-- Divider -->
			<div class="toolbar-divider"></div>

			<!-- Tables -->
			<div class="toolbar-group">
				<button
					type="button"
					onclick={() => handleToolbarClick(insertTable)}
					class:active={editorState.table}
					title="Insert Table"
					aria-label="Insert Table"
				>
					<FontAwesomeIcon icon={faTable} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().addRowAfter().run())}
					title="Add Row"
					aria-label="Add Row"
				>
					<FontAwesomeIcon icon={faPlus} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().deleteRow().run())}
					title="Delete Row"
					aria-label="Delete Row"
				>
					<FontAwesomeIcon icon={faMinus} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().addColumnAfter().run())}
					title="Add Column"
					aria-label="Add Column"
				>
					<FontAwesomeIcon icon={faColumns} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().deleteColumn().run())}
					title="Delete Column"
					aria-label="Delete Column"
				>
					<FontAwesomeIcon icon={faTableCells} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().toggleHeaderRow().run())}
					title="Toggle Header Row"
					aria-label="Toggle Header Row"
				>
					<FontAwesomeIcon icon={faTableList} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().mergeCells().run())}
					disabled={!editorState.canMergeCells}
					title="Merge Cells"
					aria-label="Merge Cells"
				>
					<FontAwesomeIcon icon={faTableCellsLarge} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().splitCell().run())}
					disabled={!editorState.canSplitCell}
					title="Split Cell"
					aria-label="Split Cell"
				>
					<FontAwesomeIcon icon={faTableCells} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().deleteTable().run())}
					disabled={!editorState.canDeleteTable}
					title="Delete Table"
					aria-label="Delete Table"
				>
					<FontAwesomeIcon icon={faTrashAlt} class="h-4 w-4" fixedWidth />
				</button>
			</div>

			<!-- Divider -->
			<div class="toolbar-divider"></div>

			<!-- Media -->
			<div class="toolbar-group">
				<button
					type="button"
					title="Upload Image"
					aria-label="Upload Image"
					onclick={() => {
						const input = document.createElement('input');
						input.type = 'file';
						input.accept = 'image/*';
						input.onchange = handleImageUpload;
						input.click();
					}}
				>
					<FontAwesomeIcon icon={faImage} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(handleImageUrl)}
					title="Insert Image from URL"
					aria-label="Insert Image from URL"
				>
					<FontAwesomeIcon icon={faShareNodes} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(handleLinkInsert)}
					class:active={editorState.link}
					title={editorState.link ? 'Remove Link' : 'Insert Link'}
					aria-label="Link"
				>
					<FontAwesomeIcon icon={faLink} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(handleYouTubeInsert)}
					title="Insert YouTube Video"
					aria-label="Insert YouTube Video"
				>
					<FontAwesomeIcon icon={faYoutube} class="h-4 w-4" fixedWidth />
				</button>
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().insertAccordion().run())}
					class:active={editorState.details}
					title="Insert Accordion"
					aria-label="Insert Accordion"
				>
					<FontAwesomeIcon icon={faChevronDown} class="h-4 w-4" fixedWidth />
				</button>
			</div>

			<!-- Divider -->
			<div class="toolbar-divider"></div>

			<!-- Clear Formatting -->
			<div class="toolbar-group">
				<button
					type="button"
					onclick={() => handleToolbarClick(() => ed.chain().focus().clearNodes().run())}
					title="Clear Formatting"
					aria-label="Clear Formatting"
				>
					<FontAwesomeIcon icon={faEraser} class="h-4 w-4" fixedWidth />
				</button>
			</div>
		</div>
	{/if}

	<!-- Rich Text mount point (always mounted; hidden in other views) -->
	<div
		bind:this={element}
		class="editor-content"
		class:editor-hidden={viewMode !== 'richtext'}
	></div>

	{#if viewMode === 'html'}
		<textarea
			bind:value={htmlSource}
			oninput={syncSource}
			class="editor-source"
			placeholder="<p>HTML source code...</p>"
			spellcheck="false"
		></textarea>
	{/if}

	{#if viewMode === 'plaintext'}
		<textarea
			bind:value={plainTextSource}
			oninput={syncSource}
			class="editor-source editor-plain"
			placeholder="Plain text..."
		></textarea>
	{/if}

	<!-- Word / Character Count Footer -->
	{#if editor}
		<div class="editor-footer">
			<span class="editor-meta">{charCount} characters</span>
			<span class="editor-divider-dot"></span>
			<span class="editor-meta">{wordCount} words</span>
			<span class="editor-spacer"></span>
			<span class="editor-view-label">
				{#if viewMode === 'richtext'}
					<FontAwesomeIcon icon={faEye} class="h-3 w-3" fixedWidth />
					Rich Text Mode
				{:else if viewMode === 'html'}
					<FontAwesomeIcon icon={faCode} class="h-3 w-3" fixedWidth />
					HTML Mode
				{:else}
					<FontAwesomeIcon icon={faFileCode} class="h-3 w-3" fixedWidth />
					Plain Text Mode
				{/if}
			</span>
		</div>
	{/if}
</div>

<style>
	.editor-wrapper {
		border: 1px solid #e2e8f0;
		border-radius: 0.65rem;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		background: #fff;
	}

	/* ---- View Toggle Bar ---- */
	.view-toggle {
		display: flex;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		background: #f8fafc;
		border-bottom: 1px solid #e2e8f0;
	}

	.view-toggle-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 9999px;
		background: #fff;
		color: #64748b;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.view-toggle-btn:hover {
		background: #f1f5f9;
		color: #334155;
		border-color: #cbd5e1;
	}

	.view-toggle-btn.active {
		background: #2563eb;
		border-color: #2563eb;
		color: #fff;
		box-shadow: 0 1px 3px rgba(37, 99, 235, 0.4);
	}

	/* ---- Toolbar ---- */
	.toolbar {
		display: flex;
		gap: 0;
		padding: 0.65rem;
		border-bottom: 1px solid #e2e8f0;
		background: linear-gradient(to bottom, #fbfcfe, #f4f6f9);
		flex-wrap: wrap;
		align-items: center;
	}

	.toolbar-group {
		display: inline-flex;
		border-radius: 0.45rem;
		border: 1px solid #e2e8f0;
		overflow: hidden;
		background: #fff;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.toolbar-divider {
		width: 1px;
		height: 24px;
		background: #e2e8f0;
		margin: 0 0.45rem;
	}

	.toolbar button {
		padding: 0.475rem 0.6rem;
		border: none;
		background: none;
		font-size: 14px;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #475569;
		border-right: 1px solid #eef2f7;
	}

	.toolbar button:last-child {
		border-right: none;
	}

	.toolbar button:hover {
		background: #eef2f7;
		color: #1e293b;
	}

	.toolbar button.active {
		background: #dbeafe;
		color: #2563eb;
	}

	.toolbar button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.toolbar-select {
		padding: 0.475rem 0.6rem;
		font-size: 0.8rem;
		cursor: pointer;
		background: transparent;
		color: #475569;
		border: none;
		font-weight: 500;
		outline: none;
	}

	.toolbar-select:hover {
		background: #f4f6f9;
		color: #1e293b;
	}

	.toolbar-select-sm {
		font-size: 0.75rem;
	}

	.toolbar-dropdown .toolbar-select {
		min-width: 8rem;
	}

	.toolbar-color-group {
		align-items: center;
	}

	.color-input-wrap {
		position: relative;
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.5rem;
		gap: 0.35rem;
		border-right: 1px solid #eef2f7;
	}

	.color-input-wrap:last-child {
		border-right: none;
	}

	.color-input-wrap :global(svg) {
		color: #475569;
		pointer-events: none;
	}

	.color-input-wrap:hover :global(svg) {
		color: #2563eb;
	}

	.color-input {
		width: 20px;
		height: 20px;
		border: none;
		background: none;
		cursor: pointer;
		padding: 0;
		border-radius: 0.25rem;
		overflow: hidden;
	}

	/* ---- Editor area ---- */
	.editor-content {
		min-height: 200px;
		padding: 1rem;
		background: white;
	}

	.editor-hidden {
		display: none;
	}

	.editor-source {
		width: 100%;
		min-height: 200px;
		padding: 1rem;
		border: none;
		resize: vertical;
		font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
		font-size: 0.8rem;
		line-height: 1.6;
		color: #1f2937;
		background: #1e293b;
		color: #e2e8f0;
		outline: none;
		tab-size: 2;
	}

	.editor-plain {
		background: #f8fafc;
		color: #334155;
		font-family: system-ui, -apple-system, sans-serif;
		font-size: 0.9rem;
	}

	.editor-source::placeholder {
		color: #94a3b8;
	}

	/* ---- Footer ---- */
	.editor-footer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		border-top: 1px solid #e2e8f0;
		background: #f8fafc;
		font-size: 0.75rem;
		color: #64748b;
	}

	.editor-meta {
		font-variant-numeric: tabular-nums;
	}

	.editor-divider-dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: #cbd5e1;
	}

	.editor-spacer {
		flex: 1;
	}

	.editor-view-label {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-weight: 600;
		color: #64748b;
	}

	/* TipTap editor styles */
	:global(.ProseMirror) {
		outline: none;
		min-height: 200px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		font-size: 16px;
		line-height: 1.6;
		color: #1f2937;
	}

	:global(.ProseMirror p) {
		margin: 0.5rem 0;
	}

	:global(.ProseMirror h1) {
		font-size: 2rem;
		font-weight: 700;
		margin: 1rem 0 0.5rem;
		line-height: 1.3;
	}

	:global(.ProseMirror h2) {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0.875rem 0 0.5rem;
		line-height: 1.3;
	}

	:global(.ProseMirror h3) {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0.75rem 0 0.5rem;
		line-height: 1.3;
	}

	:global(.ProseMirror h4) {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0.75rem 0 0.5rem;
		line-height: 1.3;
	}

	:global(.ProseMirror h5) {
		font-size: 1rem;
		font-weight: 700;
		margin: 0.75rem 0 0.5rem;
		line-height: 1.3;
	}

	:global(.ProseMirror h6) {
		font-size: 0.875rem;
		font-weight: 700;
		margin: 0.75rem 0 0.5rem;
		line-height: 1.3;
	}

	:global(.ProseMirror strong) {
		font-weight: 700;
	}

	:global(.ProseMirror em) {
		font-style: italic;
	}

	:global(.ProseMirror u) {
		text-decoration: underline;
	}

	:global(.ProseMirror s) {
		text-decoration: line-through;
	}

	:global(.ProseMirror code) {
		background: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-family: 'Courier New', monospace;
		font-size: 0.9em;
		color: #e11d48;
	}

	:global(.ProseMirror pre) {
		background: #1f2937;
		color: #e5e7eb;
		padding: 1rem;
		border-radius: 0.375rem;
		overflow-x: auto;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		margin: 1rem 0;
	}

	:global(.ProseMirror pre code) {
		background: none;
		color: inherit;
		padding: 0;
		border-radius: 0;
	}

	:global(.ProseMirror blockquote) {
		border-left: 4px solid #3b82f6;
		padding-left: 1rem;
		margin-left: 0;
		color: #6b7280;
		font-style: italic;
	}

	:global(.ProseMirror ul) {
		padding-left: 1.5rem;
		list-style: disc;
		margin: 0.5rem 0;
	}

	:global(.ProseMirror ol) {
		padding-left: 1.5rem;
		list-style: decimal;
		margin: 0.5rem 0;
	}

	:global(.ProseMirror li) {
		margin: 0.25rem 0;
	}

	:global(.ProseMirror hr) {
		border: none;
		border-top: 2px solid #e5e7eb;
		margin: 1rem 0;
	}

	:global(.ProseMirror img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.375rem;
		margin: 0.5rem 0;
	}

	:global(.ProseMirror iframe) {
		max-width: 100%;
		border-radius: 0.375rem;
		margin: 0.5rem 0;
		aspect-ratio: 16 / 9;
		width: 100%;
		border: none;
	}

	:global(.ProseMirror sub) {
		vertical-align: sub;
		font-size: 0.75em;
	}

	:global(.ProseMirror sup) {
		vertical-align: super;
		font-size: 0.75em;
	}

	/* Task lists */
	:global(.ProseMirror ul[data-type='taskList']) {
		list-style: none;
		padding: 0;
	}

	:global(.ProseMirror ul[data-type='taskList'] li) {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
	}

	:global(.ProseMirror ul[data-type='taskList'] li > label) {
		margin-top: 0.35rem;
		user-select: none;
	}

	:global(.ProseMirror ul[data-type='taskList'] li > div) {
		flex: 1;
	}

	/* Tables */
	:global(.ProseMirror .tableWrapper) {
		overflow-x: auto;
		margin: 1rem 0;
	}

	:global(.ProseMirror table) {
		border-collapse: collapse;
		width: 100%;
		table-layout: fixed;
	}

	:global(.ProseMirror th),
	:global(.ProseMirror td) {
		border: 1px solid #d1d5db;
		padding: 0.5rem 0.75rem;
		vertical-align: top;
		min-width: 60px;
		position: relative;
	}

	:global(.ProseMirror th) {
		background: #f9fafb;
		font-weight: 600;
	}

	:global(.ProseMirror .selectedCell::after) {
		background: rgba(59, 130, 246, 0.2);
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
	}

	:global(.ProseMirror .column-resize-handle) {
		background-color: #3b82f6;
		bottom: -2px;
		position: absolute;
		right: -2px;
		top: 0;
		width: 4px;
		pointer-events: none;
	}

	/* Accordion (details/summary) */
	:global(.ProseMirror details) {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		margin: 0.75rem 0;
		overflow: hidden;
		background: #fff;
	}

	:global(.ProseMirror summary) {
		cursor: pointer;
		padding: 0.75rem 1rem;
		font-weight: 600;
		color: #1f2937;
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
		list-style: none;
		display: flex;
		align-items: center;
	}

	:global(.ProseMirror summary::-webkit-details-marker) {
		display: none;
	}

	:global(.ProseMirror summary::before) {
		content: '▸ ';
		font-size: 0.8em;
		margin-right: 0.25rem;
		transition: transform 0.15s ease;
	}

	:global(.ProseMirror details[open] > summary::before) {
		transform: rotate(90deg);
	}

	:global(.ProseMirror details[open] > summary) {
		border-bottom: 1px solid #e5e7eb;
	}

	:global(.ProseMirror details > :not(summary)) {
		padding: 1rem;
	}

	:global(.ProseMirror summary.is-empty::before) {
		content: 'Accordion Title ▸';
		color: #9ca3af;
		font-weight: 400;
	}

	:global(.ProseMirror details.is-empty::after) {
		content: 'Add content here...';
		color: #9ca3af;
		font-size: 0.9em;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		color: #9ca3af;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	:global(.drop-cursor) {
		background-color: #3b82f6;
		width: 2px;
	}
</style>
