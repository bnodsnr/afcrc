import { mergeAttributes, Node } from '@tiptap/core';

export const Summary = Node.create({
	name: 'summary',
	group: 'block',
	content: 'inline*',
	defining: true,

	parseHTML() {
		return [{ tag: 'summary' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['summary', mergeAttributes(HTMLAttributes), 0];
	}
});
