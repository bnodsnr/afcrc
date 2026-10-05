/**
 * Parsing for the Mission / Vision / Objectives block.
 *
 * The block is a single CMS parent row (`our-direction`) whose `page_content`
 * is the section eyebrow/heading/lead, with one child row per card. Children
 * are matched on slug rather than by fetching each one separately, because the
 * endpoint resolves a slug only — and the slugs the admin saved are not always
 * the canonical spelling (`vission` for `vision` today), so the match is
 * deliberately tolerant.
 */
import type { ComponentData } from '$lib/api/types';
import { firstHeadingText, withoutHeadings } from './html';

/** Slug of the CMS parent row that holds the section header, mission and vision. */
export const DIRECTION_PARENT = 'our-direction';

/**
 * Slug of the standalone objectives row. It is not a child of `our-direction`,
 * so it is fetched on its own and passed to the block separately.
 */
export const OBJECTIVES_SLUG = 'our-objectives';

type CardKind = 'mission' | 'vision' | 'objectives';

/** Slugs a card may have been saved under, canonical spelling first. */
const CARD_SLUGS: Record<CardKind, string[]> = {
	mission: ['mission', 'our-mission', 'missions'],
	vision: ['vision', 'vission', 'our-vision', 'visions'],
	objectives: ['objectives', 'objective', 'our-objectives', 'objectives-list']
};

/** Case- and punctuation-insensitive slug key, so `our_vision` === `our-vision`. */
function slugKey(value: string | null | undefined): string {
	return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds the child row backing a card, whichever accepted slug it was saved
 * under. Returns null when the admin has not authored that card yet, which is
 * the signal for the caller to fall back to built-in copy.
 */
export function findDirectionChild(
	children: ComponentData[] | null | undefined,
	kind: CardKind
): ComponentData | null {
	const wanted = CARD_SLUGS[kind].map(slugKey);
	return (
		(children ?? []).find((child) => {
			if (!child) return false;
			return wanted.includes(slugKey(child.slug) || slugKey(child.component_name));
		}) ?? null
	);
}

export interface DirectionSection {
	/** Eyebrow chip text — the parent row's `name`. */
	eyebrow: string;
	/** Section heading, from the first heading in the parent body. */
	heading: string;
	/** Section lead HTML, from the parent body with headings stripped. */
	lead: string;
	/** Card rows; each is null when the admin has not authored that card. */
	mission: ComponentData | null;
	vision: ComponentData | null;
	objectives: ComponentData | null;
	/** Children of `our-direction` that are not the mission or vision card. */
	extra: ComponentData[];
}

/** Turns an `our-direction` CMS row into the section's display data. */
export function parseDirectionSection(row: ComponentData | null | undefined): DirectionSection {
	const children = row?.children ?? [];
	const mission = findDirectionChild(children, 'mission');
	const vision = findDirectionChild(children, 'vision');
	const objectives = findDirectionChild(children, 'objectives');

	return {
		eyebrow: row?.name?.trim() ?? '',
		heading: firstHeadingText(row?.page_content),
		lead: withoutHeadings(row?.page_content),
		mission,
		vision,
		objectives,
		// Anything parented under `our-direction` that is not the mission or
		// vision card is an objective, so the list needs no separate row.
		extra: children.filter(
			(child) => child && child !== mission && child !== vision && child !== objectives
		)
	};
}
