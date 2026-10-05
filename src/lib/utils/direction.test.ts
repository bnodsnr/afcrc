import { describe, expect, it } from 'vitest';
import { findDirectionChild, parseDirectionSection } from './direction';
import type { ComponentData } from '$lib/api/types';

const row = (slug: string, extra: Partial<ComponentData> = {}): ComponentData =>
	({
		id: 1,
		name: slug,
		slug,
		page_content: `<p>${slug} body</p>`,
		children: [],
		...extra
	}) as ComponentData;

describe('parseDirectionSection (live `our-direction` shape)', () => {
	const section = parseDirectionSection(
		row('our-direction', {
			id: 23,
			name: 'Our Direction',
			page_content:
				'<h2><strong>What we are here to do -- and where we are taking it.</strong></h2><p>A mission is a promise.</p>',
			children: [row('mission', { id: 24 }), row('vission', { id: 25 })]
		})
	);

	it('reads the header from the parent row', () => {
		expect(section.eyebrow).toBe('Our Direction');
		expect(section.heading).toBe('What we are here to do -- and where we are taking it.');
		expect(section.lead).toContain('A mission is a promise.');
	});

	it('strips the heading out of the lead', () => {
		expect(section.lead).not.toContain('<h2');
	});

	it('resolves the vision card from the misspelled `vission` slug', () => {
		expect(section.mission?.id).toBe(24);
		expect(section.vision?.id).toBe(25);
	});

	it('reports no objectives card when there is no objectives row', () => {
		expect(section.objectives).toBeNull();
	});

	it('collects children other than mission / vision as objectives', () => {
		const s = parseDirectionSection(
			row('our-direction', {
				children: [
					row('mission', { id: 24 }),
					row('vission', { id: 25 }),
					row('research', { id: 26 }),
					row('ecosystems', { id: 27 })
				]
			})
		);
		expect(s.extra.map((c) => c.id)).toEqual([26, 27]);
	});

	it('does not treat an objectives row as an objective item', () => {
		const s = parseDirectionSection(
			row('our-direction', {
				children: [row('mission', { id: 24 }), row('objectives', { id: 28 })]
			})
		);
		expect(s.objectives?.id).toBe(28);
		expect(s.extra).toEqual([]);
	});
});

describe('findDirectionChild', () => {
	it('tolerates punctuation and case differences', () => {
		const kids = [row('Our_Vision'), row('our-objectives')];
		expect(findDirectionChild(kids, 'vision')?.slug).toBe('Our_Vision');
		expect(findDirectionChild(kids, 'objectives')?.slug).toBe('our-objectives');
	});

	it('returns null for an empty or missing child list', () => {
		expect(findDirectionChild([], 'mission')).toBeNull();
		expect(findDirectionChild(undefined, 'mission')).toBeNull();
	});
});

describe('parseDirectionSection with no CMS row', () => {
	it('returns empty strings so the caller can fall back', () => {
		const section = parseDirectionSection(null);
		expect(section).toMatchObject({ eyebrow: '', heading: '', lead: '' });
		expect(section.mission).toBeNull();
		expect(section.vision).toBeNull();
		expect(section.objectives).toBeNull();
		expect(section.extra).toEqual([]);
	});
});
