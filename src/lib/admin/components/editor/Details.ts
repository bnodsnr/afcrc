import { mergeAttributes, Node, wrappingInputRule } from '@tiptap/core';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		details: {
			/**
			 * Toggle the current selection into a `<details>` (accordion) block.
			 */
			toggleDetails: () => ReturnType;
			/**
			 * Wrap the current selection in a `<details>` (accordion) block.
			 */
			setDetails: () => ReturnType;
			/**
			 * Remove the surrounding `<details>` (accordion) block.
			 */
			unsetDetails: () => ReturnType;
			/**
			 * Insert a ready-to-edit accordion at the current cursor position.
			 */
			insertAccordion: () => ReturnType;
		};
	}
}

export const Details = Node.create({
	name: 'details',
	group: 'block',
	content: 'summary block*',
	defining: true,

	parseHTML() {
		return [{ tag: 'details' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['details', mergeAttributes(HTMLAttributes), 0];
	},

	addCommands() {
		return {
			toggleDetails:
				() =>
				({ state, commands }) => {
					const details = state.schema.nodes.details;
					if (state.selection.$from.parent.type === details) {
						return commands.lift('details');
					}
					return commands.setDetails();
				},
			setDetails:
				() =>
				({ commands }) =>
					commands.wrapIn('details'),
			unsetDetails:
				() =>
				({ commands }) =>
					commands.lift('details'),
			insertAccordion:
				() =>
				({ commands }) => {
					const { schema } = this.editor.state;
					const details = schema.nodes.details;
					const summary = schema.nodes.summary;
					const paragraph = schema.nodes.paragraph;
					return commands.insertContent({
						type: details.name,
						content: [
							{
								type: summary.name,
								content: [{ type: 'text', text: 'Accordion Title' }]
							},
							{ type: paragraph.name }
						]
					});
				}
		};
	},

	addKeyboardShortcuts() {
		return {
			'Mod-Shift-9': () => this.editor.commands.toggleDetails()
		};
	},

	addInputRules() {
		return [
			wrappingInputRule({
				find: /^\s*:::accordion\s$/,
				type: this.type
			})
		];
	}
});
