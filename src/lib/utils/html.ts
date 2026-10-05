/**
 * Helpers for rendering editor-authored (Tiptap) HTML safely in Svelte.
 */

/** Strips executable markup and inline event handlers from CMS HTML. */
export function safeHtml(value: string | null | undefined): string {
	if (!value) return '';
	return value
		.replace(/<\s*(script|style|iframe|object|embed)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
		.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
		.replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '');
}

/** Flattens HTML to plain text, decoding the entities the CMS editor emits. */
export function toText(html: string | null | undefined): string {
	return (html ?? '')
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Returns the text of the first heading in a Tiptap body, if there is one. */
export function firstHeadingText(html: string | null | undefined): string {
	const match = safeHtml(html).match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
	return match ? toText(match[1]) : '';
}

/** Returns the body with every heading stripped out, for use under the heading. */
export function withoutHeadings(html: string | null | undefined): string {
	return safeHtml(html).replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, '');
}
