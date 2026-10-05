import { PUBLIC_API_BASE_URL } from '$env/static/public';

const baseUrl = PUBLIC_API_BASE_URL.replace(/\/+$/, '');

export interface TourPackage {
	id: number;
	title: string;
	slug?: string;
	category?: number | { id: number; name: string; slug: string } | null;
	category_name?: string;
	thumbnail?: string;
	status?: string;
	tour_type?: string;
	short_description?: string;
	description?: string;
	starting_price?: string | number;
	discount_price?: string | number;
	currency?: string;
	duration_days?: number;
	duration_nights?: number;
	starting_location?: string;
	ending_location?: string;
	meta_title?: string;
	meta_description?: string;
	meta_keywords?: string;
	[key: string]: unknown;
}

export interface PaginatedResult<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
}

export interface GetToursByCategoryOptions {
	page?: number;
	page_size?: number;
	limit?: number;
	token?: string;
}

export async function getToursByCategory(
	slug: string,
	opts: GetToursByCategoryOptions = {}
): Promise<{ data: PaginatedResult<TourPackage>; status: number }> {
	const { page = 1, page_size = 10, limit, token = '' } = opts;

	const query = new URLSearchParams({
		page: String(page),
		page_size: String(page_size)
	});
	if (limit && limit > 0) query.set('limit', String(limit));

	const res = await fetch(
		`${baseUrl}/api/tours/packages/by-category/${encodeURIComponent(slug)}/?${query.toString()}`,
		{
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {})
			}
		}
	);

	const json = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw {
			status: res.status,
			message: json.message || json.error || 'Failed to load tours for this category.',
			data: json
		};
	}

	return { data: json.data ?? json, status: res.status };
}

export async function getCategories(
	token = ''
): Promise<{ data: PaginatedResult<{ id: number; name: string; slug: string }>; status: number }> {
	const res = await fetch(`${baseUrl}/api/tours/categories/`, {
		headers: {
			...(token ? { Authorization: `Bearer ${token}` } : {})
		}
	});

	const json = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw {
			status: res.status,
			message: json.message || json.error || 'Failed to load tour categories.',
			data: json
		};
	}

	return { data: json.data ?? json, status: res.status };
}
