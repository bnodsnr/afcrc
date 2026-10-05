import { fail, type ActionFailure } from '@sveltejs/kit';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

function listFromText(value: string): string[] {
	return value
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

function listFromFields(fd: FormData, name: string): string[] {
	return (fd.getAll(name) as string[])
		.map((v) => v.trim())
		.filter((v) => v.length > 0);
}

function faqRows(value: string) {
	return listFromText(value).map((line) => {
		const idx = line.indexOf('|');
		if (idx === -1) return { question: line, answer: '' };
		return {
			question: line.slice(0, idx).trim(),
			answer: line.slice(idx + 1).trim()
		};
	});
}

function buildItineraries(fd: FormData): Record<string, unknown>[] {
	const itinIds = fd.getAll('itin_id[]') as string[];
	const itinDays = fd.getAll('itin_day[]') as string[];
	const itinTitles = fd.getAll('itin_title[]') as string[];
	const itinOvernights = fd.getAll('itin_overnight[]') as string[];
	const itinDescs = fd.getAll('itin_description[]') as string[];
	const itinMeals = fd.getAll('itin_meals[]') as string[];
	const itinAccom = fd.getAll('itin_accommodation[]') as string[];
	const itinTransport = fd.getAll('itin_transportation[]') as string[];
	const itinActivities = fd.getAll('itin_activities[]') as string[];

	const rows: Record<string, unknown>[] = [];
	for (let i = 0; i < itinDays.length; i++) {
		const day = (itinDays[i] || '').trim();
		const title = (itinTitles[i] || '').trim();
		if (!day && !title) continue;
		const row: Record<string, unknown> = {
			day: parseInt(day, 10) || i + 1,
			title,
			description: (itinDescs[i] || '').trim(),
			meals: (itinMeals[i] || '').trim(),
			accommodation: (itinAccom[i] || '').trim(),
			transportation: (itinTransport[i] || '').trim(),
			overnight_location: (itinOvernights[i] || '').trim()
		};
		const rawId = (itinIds[i] || '').trim();
		if (rawId && /^\d+$/.test(rawId)) row.id = parseInt(rawId, 10);
		const acts = listFromText(itinActivities[i] || '');
		if (acts.length) row.activities = acts;
		rows.push(row);
	}
	return rows;
}

function buildDepartures(fd: FormData): Record<string, unknown>[] {
	const depIds = fd.getAll('dep_id[]') as string[];
	const depDates = fd.getAll('dep_date[]') as string[];
	const depReturns = fd.getAll('dep_return[]') as string[];
	const depSeats = fd.getAll('dep_seats[]') as string[];
	const depStatuses = fd.getAll('dep_status[]') as string[];

	const rows: Record<string, unknown>[] = [];
	for (let i = 0; i < depDates.length; i++) {
		const depDate = (depDates[i] || '').trim();
		const retDate = (depReturns[i] || '').trim();
		if (!depDate && !retDate && !(depSeats[i] || '').trim()) continue;
		const row: Record<string, unknown> = {
			departure_date: depDate,
			return_date: retDate,
			available_seats: parseInt(depSeats[i] || '0', 10),
			status: (depStatuses[i] || '').trim() || 'open'
		};
		const rawId = (depIds[i] || '').trim();
		if (rawId && /^\d+$/.test(rawId)) row.id = parseInt(rawId, 10);
		rows.push(row);
	}
	return rows;
}

function buildGallery(fd: FormData): unknown[] {
	const raw = ((fd.get('gallery') as string) || '').trim();
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function firstError(errors: any): string {
	if (errors == null) return '';
	if (typeof errors === 'string') return errors;
	if (Array.isArray(errors)) {
		for (const item of errors) {
			const msg = firstError(item);
			if (msg) return msg;
		}
		return '';
	}
	const key = Object.keys(errors)[0];
	if (key === undefined) return '';
	const msg = firstError(errors[key]);
	return typeof msg === 'string' ? msg : '';
}

export async function tourStepAction(
	request: Request,
	token: string,
	opts: { allowCreate?: boolean } = {}
): Promise<Record<string, unknown> | ActionFailure<Record<string, unknown>>> {
	if (!token) {
		return fail(401, { error: 'Unauthorized' });
	}

	const fd = await request.formData();
	const step = ((fd.get('step') as string) || 'general').trim();
	const tourId = parseInt((fd.get('tour_id') as string) || '0', 10);
	const text = (name: string) => ((fd.get(name) as string) || '').trim();
	const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

	// ---- Step 1 (no tour yet): create the tour ------------------------
	if (!tourId) {
		if (!opts.allowCreate) {
			return fail(404, { error: 'Tour not found.' });
		}
		const title = text('title');
		const category = text('category');
		const thumbnail = fd.get('thumbnail') as File | null;

		if (!title) return fail(400, { error: 'Tour title is required.' });
		if (!category) return fail(400, { error: 'Please select a tour category.' });
		if (!thumbnail || thumbnail.size === 0) {
			return fail(400, { error: 'A thumbnail image is required.' });
		}

		const form = new FormData();
		const general: Record<string, string> = {
			category,
			title,
			status: text('status') || 'draft',
			short_description: text('short_description'),
			description: text('description')
		};
		Object.entries(general).forEach(([key, value]) => {
			if (value !== '') form.append(key, value);
		});
		const tourType = text('tour_type');
		if (tourType) form.append('tour_type', tourType);
		form.append('thumbnail', thumbnail, thumbnail.name);

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/packages/`, {
				method: 'POST',
				headers,
				body: form
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg =
					firstError(json.errors) || json.message || 'Failed to create the tour.';
				return fail(res.status, { error: msg, details: json });
			}
			const newId = json.data?.id;
			if (!newId) return fail(500, { error: 'Tour created but no id returned.' });
			return { success: true, message: 'Tour created. Continue to the next step.', tourId: newId };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to create the tour.';
			return fail(500, { error: message });
		}
	}

	// ---- Later steps: PATCH only the active step's fields ------------
	const form = new FormData();
	const appendText = (names: string[]) => {
		for (const name of names) {
			const value = text(name);
			if (value !== '') form.append(name, value);
		}
	};

	if (step === 'general') {
		if (!text('title')) return fail(400, { error: 'Tour title is required.' });
		appendText(['category', 'title', 'status', 'short_description', 'description']);
		const tourType = text('tour_type');
		if (tourType) form.append('tour_type', tourType);
		const thumbnail = fd.get('thumbnail') as File | null;
		if (thumbnail && thumbnail.size > 0) form.append('thumbnail', thumbnail, thumbnail.name);
	} else if (step === 'pricing') {
		appendText([
			'currency', 'starting_price', 'discount_price',
			'duration_days', 'duration_nights',
			'starting_location', 'ending_location',
			'minimum_group_size', 'maximum_group_size',
			'difficulty', 'transportation', 'accommodation', 'meals'
		]);
	} else if (step === 'lists') {
		const highlights = listFromFields(fd, 'highlights[]').map((title) => ({ title }));
		if (highlights.length) form.append('highlights', JSON.stringify(highlights));
	} else if (step === 'included') {
		const includes = listFromFields(fd, 'includes[]');
		const excludes = listFromFields(fd, 'excludes[]');
		if (includes.length) form.append('includes', JSON.stringify(includes));
		if (excludes.length) form.append('excludes', JSON.stringify(excludes));
	} else if (step === 'gallery') {
		const gallery = buildGallery(fd);
		if (gallery.length) form.append('gallery', JSON.stringify(gallery));
	} else if (step === 'faq') {
		const faq = faqRows(text('faq'));
		if (faq.length) form.append('faq', JSON.stringify(faq));
	} else if (step === 'itinerary') {
		const itineraries = buildItineraries(fd);
		form.append('itineraries', JSON.stringify(itineraries));
	} else if (step === 'departures') {
		const departures = buildDepartures(fd);
		form.append('departures', JSON.stringify(departures));
	} else if (step === 'seo') {
		appendText(['meta_title', 'meta_description', 'meta_keywords']);
	}

	try {
		const res = await fetch(`${PUBLIC_API_BASE_URL}/api/tours/packages/${tourId}/`, {
			method: 'PATCH',
			headers,
			body: form
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok) {
			const msg =
				firstError(json.errors) || json.message || 'Failed to save this step.';
			return fail(res.status, { error: msg, details: json });
		}
		return { success: true, message: 'Step saved.', tourId };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to save this step.';
		return fail(500, { error: message });
	}
}
