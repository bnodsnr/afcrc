<script lang="ts">
	import { base } from '$lib/admin/paths';
	import { getImageUrl } from '$lib/admin/utils/image';

	export type TourStats = {
		totalTours: number;
		publishedTours: number;
		featuredTours: number;
		totalBookings: number;
		pendingBookings: number;
		revenue: number;
		totalPax: number;
		averageRating: number | null;
	};

	export type StatusSlice = {
		status: string;
		label: string;
		count: number;
		color: string;
	};

	let {
		stats,
		recentBookings = [],
		statusBreakdown = [],
		topCategories = [],
		featuredTours = [],
		upcomingDepartures = []
	}: {
		stats: TourStats;
		recentBookings: any[];
		statusBreakdown: StatusSlice[];
		topCategories: any[];
		featuredTours: any[];
		upcomingDepartures: any[];
	} = $props();

	const totalStatusCount = $derived(
		statusBreakdown.reduce((sum, slice) => sum + slice.count, 0)
	);

	function bookingBadge(s: string): string {
		const map: Record<string, string> = {
			pending: 'badge-warning',
			confirmed: 'badge-info',
			cancelled: 'badge-error',
			completed: 'badge-success'
		};
		return map[s] ?? 'badge-ghost';
	}

	function paymentBadge(s: string): string {
		const map: Record<string, string> = {
			unpaid: 'badge-warning',
			partial: 'badge-info',
			paid: 'badge-success',
			refunded: 'badge-ghost'
		};
		return map[s] ?? 'badge-ghost';
	}

	function departureBadge(s: string): string {
		const map: Record<string, string> = {
			scheduled: 'badge-ghost',
			open: 'badge-success',
			confirmed: 'badge-info',
			closed: 'badge-warning',
			cancelled: 'badge-error'
		};
		return map[s] ?? 'badge-ghost';
	}

	function tourStatusBadge(s: string): string {
		const map: Record<string, string> = {
			draft: 'badge-ghost',
			published: 'badge-success',
			archived: 'badge-warning'
		};
		return map[s] ?? 'badge-ghost';
	}

	function fmtMoney(v: any): string {
		const n = Number(v || 0);
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(n);
	}

	function fmtNumber(v: any): string {
		return Number(v || 0).toLocaleString();
	}

	function fmtDate(v: string | null | undefined): string {
		if (!v) return '—';
		return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function todayLabel(): string {
		return new Date().toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function seatFill(departure: any): number {
		const total = Number(departure.available_seats || 0);
		if (total <= 0) return 0;
		return Math.round((Number(departure.booked_seats || 0) / total) * 100);
	}

	function percent(count: number): number {
		if (totalStatusCount <= 0) return 0;
		return Math.round((count / totalStatusCount) * 100);
	}

	const confirmedRate = $derived.by(() => {
		if (totalStatusCount <= 0) return 0;
		const confirmed = statusBreakdown.find((s) => s.status === 'confirmed')?.count ?? 0;
		const completed = statusBreakdown.find((s) => s.status === 'completed')?.count ?? 0;
		return Math.round(((confirmed + completed) / totalStatusCount) * 100);
	});

	const maxCategory = $derived(
		topCategories.reduce((m, c) => Math.max(m, Number(c.package_count) || 0), 0)
	);
</script>

<div class="text-base-content">
	<!-- Header -->
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">Tour & Travel Dashboard</h1>
			<p class="mt-1 text-sm text-base-content/60">{todayLabel()}</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<a href={base + '/tours/bookings'} class="btn btn-ghost btn-sm">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				Bookings
			</a>
			<a href={base + '/tours'} class="btn btn-ghost btn-sm">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 21v-6m0 0l2.5-4.5L8 15m-5 0l-2 6m13-6v6m0 0l1-7.5L13 15m5-13v13m0-13l2 2m-2-2L16 4"
					/>
				</svg>
				All Tours
			</a>
			<a href={base + '/tours/create'} class="btn btn-primary btn-sm">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				New Tour
			</a>
		</div>
	</div>

	<!-- KPI cards -->
	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
		<!-- Tours -->
		<div class="rounded-xl border-l-4 border-primary bg-base-100 p-5 shadow-sm">
			<div class="mb-3 flex items-start justify-between">
				<div>
					<p class="text-sm font-medium text-base-content/60">Total Tours</p>
					<p class="mt-1 text-3xl font-bold">{fmtNumber(stats.totalTours)}</p>
				</div>
				<div class="rounded-lg bg-primary/10 p-3 text-primary">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 2l7 3.5v5C19 15 16 19 12 21c-4-2-7-6-7-10.5v-5L12 2z"
						/>
					</svg>
				</div>
			</div>
			<p class="text-xs text-base-content/60">
				{fmtNumber(stats.publishedTours)} published · {fmtNumber(stats.featuredTours)} promoted
			</p>
		</div>

		<!-- Bookings -->
		<div class="rounded-xl border-l-4 border-info bg-base-100 p-5 shadow-sm">
			<div class="mb-3 flex items-start justify-between">
				<div>
					<p class="text-sm font-medium text-base-content/60">Total Bookings</p>
					<p class="mt-1 text-3xl font-bold">{fmtNumber(stats.totalBookings)}</p>
				</div>
				<div class="rounded-lg bg-info/10 p-3 text-info">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
						/>
					</svg>
				</div>
			</div>
			<p class="text-xs text-base-content/60">
				{fmtNumber(stats.pendingBookings)} pending approval
			</p>
		</div>

		<!-- Revenue -->
		<div class="rounded-xl border-l-4 border-success bg-base-100 p-5 shadow-sm">
			<div class="mb-3 flex items-start justify-between">
				<div>
					<p class="text-sm font-medium text-base-content/60">Booking Revenue</p>
					<p class="mt-1 text-3xl font-bold">{fmtMoney(stats.revenue)}</p>
				</div>
				<div class="rounded-lg bg-success/10 p-3 text-success">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
			</div>
			<p class="text-xs text-base-content/60">From paid & partial bookings</p>
		</div>

		<!-- Travelers -->
		<div class="rounded-xl border-l-4 border-warning bg-base-100 p-5 shadow-sm">
			<div class="mb-3 flex items-start justify-between">
				<div>
					<p class="text-sm font-medium text-base-content/60">Travelers</p>
					<p class="mt-1 text-3xl font-bold">{fmtNumber(stats.totalPax)}</p>
				</div>
				<div class="rounded-lg bg-warning/10 p-3 text-warning">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</div>
			</div>
			<p class="text-xs text-base-content/60">
				Avg rating {stats.averageRating ?? '—'} / 5 across tours
			</p>
		</div>
	</div>

	<!-- Recent bookings + status -->
	<div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Recent bookings -->
		<div class="overflow-hidden rounded-xl bg-base-100 shadow-sm lg:col-span-2">
			<div class="flex items-center justify-between border-b border-base-300 px-5 py-4">
				<h2 class="flex items-center gap-2 text-lg font-bold">
					<svg class="h-5 w-5 text-info" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
						/>
						<path d="M8 2v2h4V2H8z" />
					</svg>
					Recent Bookings
				</h2>
				<a href={base + '/tours/bookings'} class="text-sm font-semibold text-primary link-hover">
					View all →
				</a>
			</div>
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>Booking</th>
							<th>Package</th>
							<th>Customer</th>
							<th>Departure</th>
							<th class="text-right">Total</th>
							<th>Payment</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each recentBookings as booking (booking.id)}
							<tr>
								<td>
									<div class="font-mono text-sm font-semibold">{booking.booking_number}</div>
									<div class="text-xs text-base-content/50">{fmtDate(booking.created_at)}</div>
								</td>
								<td>
									<div class="line-clamp-1 font-medium">{booking.package_title}</div>
									<div class="text-xs text-base-content/50">
										A:{booking.adults} C:{booking.children} I:{booking.infants}
									</div>
								</td>
								<td class="text-sm">{booking.customer_name}</td>
								<td class="text-sm">{fmtDate(booking.departure_date)}</td>
								<td class="text-right font-semibold">{fmtMoney(booking.total)}</td>
								<td>
									<span class="badge {paymentBadge(booking.payment_status)}">
										{booking.payment_status}
									</span>
								</td>
								<td>
									<span class="badge {bookingBadge(booking.booking_status)}">
										{booking.booking_status}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
				{#if recentBookings.length === 0}
					<div class="py-14 text-center text-base-content/50">
						No bookings yet. Bookings will appear here as customers reserve tours.
					</div>
				{/if}
			</div>
		</div>

		<!-- Booking status -->
		<div class="rounded-xl bg-base-100 p-5 shadow-sm">
			<h2 class="mb-5 flex items-center gap-2 text-lg font-bold">
				<svg class="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					/>
				</svg>
				Booking Status
			</h2>
			<div class="space-y-4">
				{#each statusBreakdown as slice (slice.status)}
					<div>
						<div class="mb-1 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="h-3 w-3 rounded-full {slice.color}"></span>
								<span class="text-sm font-medium">{slice.label}</span>
							</div>
							<span class="text-sm font-bold">{fmtNumber(slice.count)}</span>
						</div>
						<div class="h-2 w-full rounded-full bg-base-300/60">
							<div
								class="h-2 rounded-full {slice.color}"
								style="width: {percent(slice.count)}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-6 border-t border-base-300 pt-4">
				<p class="mb-2 text-xs font-semibold text-base-content/60">
					Confirmed Rate
				</p>
				<div class="h-3 w-full rounded-full bg-base-300/60">
					<div
						class="h-3 rounded-full bg-gradient-to-r from-success to-emerald-500"
						style="width: {confirmedRate}%"
					></div>
				</div>
				<p class="mt-2 text-xs text-base-content/60">
					{confirmedRate}%
					of bookings confirmed or completed
				</p>
			</div>
		</div>
	</div>

	<!-- Upcoming departures + top categories -->
	<div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Upcoming departures -->
		<div class="overflow-hidden rounded-xl bg-base-100 shadow-sm lg:col-span-2">
			<div class="flex items-center justify-between border-b border-base-300 px-5 py-4">
				<h2 class="flex items-center gap-2 text-lg font-bold">
					<svg class="h-5 w-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 001.415-1.415L11 9.586V6z"
							clip-rule="evenodd"
						/>
					</svg>
					Upcoming Departures
				</h2>
				<a href={base + '/tours'} class="text-sm font-semibold text-primary link-hover">Manage tours →</a>
			</div>
			<ul class="divide-y divide-base-300">
				{#each upcomingDepartures as departure (departure.id)}
					{@const fill = seatFill(departure)}
					<li class="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
						<div class="min-w-0">
							<p class="line-clamp-1 font-medium">{departure.package_title}</p>
							<p class="mt-0.5 flex items-center gap-2 text-xs text-base-content/60">
								<span class="font-semibold">{fmtDate(departure.departure_date)}</span>
								<span>→ {fmtDate(departure.return_date)}</span>
								<span class="badge badge-ghost badge-sm">{departure.difficulty}</span>
							</p>
						</div>
						<div class="flex items-center gap-4">
							<div class="w-32">
								<div class="mb-1 flex justify-between text-xs">
									<span class="text-base-content/60">Seats</span>
									<span class="font-semibold"
										>{departure.remaining_seats}/{departure.available_seats}</span
									>
								</div>
								<div class="h-2 w-full rounded-full bg-base-300/60">
									<div
										class="h-2 rounded-full {fill >= 90 ? 'bg-error' : fill >= 60 ? 'bg-warning' : 'bg-success'}"
										style="width: {fill}%"
									></div>
								</div>
							</div>
							<span class="badge {departureBadge(departure.status)}">{departure.status}</span>
						</div>
					</li>
				{/each}
			</ul>
			{#if upcomingDepartures.length === 0}
				<div class="py-14 text-center text-base-content/50">
					No upcoming departures. Add departure dates to your tours.
				</div>
			{/if}
		</div>

		<!-- Top categories -->
		<div class="rounded-xl bg-base-100 p-5 shadow-sm">
			<h2 class="mb-5 flex items-center gap-2 text-lg font-bold">
				<svg class="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
						clip-rule="evenodd"
					/>
				</svg>
				Top Categories
			</h2>
			<div class="space-y-4">
				{#each topCategories as category (category.id)}
					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-sm font-medium">{category.name}</span>
							<span class="text-xs font-bold text-base-content/60"
								>{category.package_count} tours</span
							>
						</div>
						<div class="h-2 w-full rounded-full bg-base-300/60">
							<div
								class="h-2 rounded-full bg-primary"
								style="width: {maxCategory > 0 ? Math.round((Number(category.package_count || 0) / maxCategory) * 100) : 0}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
			<a href={base + '/tours/categories'} class="btn btn-ghost btn-sm mt-6 w-full">
				Manage categories
			</a>
		</div>
	</div>

	<!-- Featured tours -->
	<div class="overflow-hidden rounded-xl bg-base-100 shadow-sm">
		<div class="flex items-center justify-between border-b border-base-300 px-5 py-4">
			<h2 class="flex items-center gap-2 text-lg font-bold">
				<svg class="h-5 w-5 text-error" fill="currentColor" viewBox="0 0 20 20">
					<path
						d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
					/>
				</svg>
				Featured Tours
			</h2>
			<a href={base + '/tours'} class="text-sm font-semibold text-primary link-hover">View all →</a>
		</div>

		{#if featuredTours.length > 0}
			<div class="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
				{#each featuredTours as tour (tour.id)}
					<a
						href={`${base}/tours/${tour.id}`}
						class="group rounded-lg border border-base-300 bg-base-100 transition-shadow hover:shadow-md"
					>
						<div class="h-36 w-full overflow-hidden rounded-t-lg bg-base-200">
							{#if tour.thumbnail}
								<img
									src={getImageUrl(tour.thumbnail)}
									alt={tour.title}
									class="h-full w-full object-cover transition-transform group-hover:scale-105"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center text-xs text-base-content/40">
									No image
								</div>
							{/if}
						</div>
						<div class="p-4">
							<div class="mb-1 flex items-start justify-between gap-2">
								<p class="line-clamp-1 text-sm font-semibold">{tour.title}</p>
								<span class="badge {tourStatusBadge(tour.status)} badge-sm">{tour.status}</span>
							</div>
							<div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/60">
								<span>
									<span class="text-yellow-500">★</span>
									{tour.average_rating ?? '—'} ({tour.review_count ?? 0})
								</span>
								<span>{tour.duration_days}d / {tour.duration_nights}n</span>
								<span>{tour.difficulty}</span>
							</div>
							<div class="flex items-center justify-between border-t border-base-300 pt-3">
								<span class="text-sm font-bold text-success">
									{tour.currency ?? ''} {tour.final_price ?? tour.starting_price ?? '0'}
								</span>
								<span class="text-xs text-primary group-hover:underline">View →</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="py-14 text-center text-base-content/50">
				No tours yet.
				<a href={base + '/tours/create'} class="link font-semibold text-primary">Create your first tour</a>
			</div>
		{/if}
	</div>
</div>
