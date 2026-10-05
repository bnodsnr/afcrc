const unicodeToAscii: Record<string, string> = {
	'₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
	'₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
	'⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
	'⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
	'⁽': '(', '⁾': ')', 'ⁿ': 'n', 'ⁱ': 'i',
	'→': '->', '←': '<-', '↔': '<->',
	'✓': 'v', '✗': 'x', '✕': 'x',
	'–': '-', '—': '--',
	'\u200B': '', '\u200C': '', '\u200D': '', '\uFEFF': '',
	'\u00A0': ' '
};

const pattern = new RegExp(
	`[${Object.keys(unicodeToAscii)
		.map((c) => c.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&'))
		.join('')}]`,
	'g'
);

export function normalizeHtmlContent(html: string): string {
	if (!html) return html;
	return html.replace(pattern, (ch) => unicodeToAscii[ch] ?? '');
}
