import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

async function fetchCollection(
	fetchFn: typeof fetch,
	url: string,
	headers: Record<string, string>
): Promise<any[]> {
	try {
		const res = await fetchFn(url, { headers });
		if (!res.ok) return [];
		const json = await res.json().catch(() => ({}));
		const data = json.data;
		if (Array.isArray(data)) return data;
		if (data && Array.isArray(data.results)) return data.results;
		return [];
	} catch {
		return [];
	}
}

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const token = cookies.get('adm_access_token') || '';
	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

	const baseUrl = PUBLIC_API_BASE_URL;
	const [packages, bookings, categories] = await Promise.all([
		fetchCollection(fetch, `${baseUrl}/api/tours/packages/?page=1&page_size=100`, headers),
		fetchCollection(fetch, `${baseUrl}/api/tours/bookings/?page=1&page_size=100`, headers),
		fetchCollection(fetch, `${baseUrl}/api/tours/categories/`, headers)
	]);

	const paidBookings = bookings.filter((b) => ['paid', 'partial'].includes(b.payment_status));
	const revenue = paidBookings.reduce((sum, b) => sum + Number(b.total || 0), 0);
	const totalPax = bookings.reduce(
		(sum, b) => sum + Number(b.adults || 0) + Number(b.children || 0) + Number(b.infants || 0),
		0
	);

	const rated = packages.filter((p) => p.average_rating != null);
	const averageRating =
		rated.length > 0
			? rated.reduce((sum, p) => sum + Number(p.average_rating), 0) / rated.length
			: null;

	const featuredTours = packages
		.filter((p) => p.tour_type)
		.concat(packages.filter((p) => !p.tour_type))
		.slice(0, 4);

	const upcomingDepartures: any[] = [];
	if (featuredTours.length > 0) {
		const departureLists = await Promise.all(
			featuredTours.map((tour) =>
				fetchCollection(
					fetch,
					`${baseUrl}/api/tours/packages/${tour.id}/departures/?page_size=100`,
					headers
				)
			)
		);
		for (let i = 0; i < featuredTours.length; i++) {
			for (const dep of departureLists[i] ?? []) {
				if (new Date(dep.departure_date) < TODAY) continue;
				upcomingDepartures.push({
					...dep,
					package_title: featuredTours[i].title,
					difficulty: featuredTours[i].difficulty
				});
			}
		}
	}
	upcomingDepartures.sort(
		(a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime()
	);
	const topUpcoming = upcomingDepartures.slice(0, 6);

	const statusColors: Record<string, string> = {
		pending: 'bg-warning',
		confirmed: 'bg-info',
		completed: 'bg-success',
		cancelled: 'bg-error'
	};
	const statusLabels: Record<string, string> = {
		pending: 'Pending',
		confirmed: 'Confirmed',
		completed: 'Completed',
		cancelled: 'Cancelled'
	};
	const statusBreakdown = ['pending', 'confirmed', 'completed', 'cancelled']
		.map((status) => ({
			status,
			label: statusLabels[status],
			count: bookings.filter((b) => b.booking_status === status).length,
			color: statusColors[status] ?? 'bg-base-content'
		}))
		.filter((slice) => slice.count > 0);

	const topCategories = [...categories]
		.sort((a, b) => Number(b.package_count || 0) - Number(a.package_count || 0))
		.slice(0, 5);

	const recentBookings = [...bookings]
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		.slice(0, 6);

	const stats = {
		totalTours: packages.length,
		publishedTours: packages.filter((p) => p.status === 'published').length,
		featuredTours: packages.filter((p) => p.tour_type).length,
		totalBookings: bookings.length,
		pendingBookings: bookings.filter((b) => b.booking_status === 'pending').length,
		revenue,
		totalPax,
		averageRating: averageRating != null ? Math.round(averageRating * 100) / 100 : null
	};

	return {
		token,
		stats,
		recentBookings,
		statusBreakdown,
		topCategories,
		featuredTours,
		upcomingDepartures: topUpcoming
	};
};
