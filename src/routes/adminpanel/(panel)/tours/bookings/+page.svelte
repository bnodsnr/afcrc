<script lang="ts">
	import { enhance } from '$app/forms';
	import { base } from '$lib/admin/paths';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();

	let bookings = $derived(data.bookings ?? []);
	let pagination = $derived(data.pagination ?? { count: 0, page: 1, page_size: 10 });
	let status = $derived(data.status ?? '');

	const statusFilters = ['', 'pending', 'confirmed', 'cancelled', 'completed'];

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
			paid: 'badge-success',
			refunded: 'badge-ghost'
		};
		return map[s] ?? 'badge-ghost';
	}

	function fmtMoney(v: any): string {
		return Number(v || 0).toFixed(2);
	}

	function fmtDate(v: string | null | undefined): string {
		if (!v) return '—';
		return new Date(v).toLocaleDateString();
	}
</script>

<div class="min-h-screen bg-base-200">
	<div class="mx-auto">
		<div class="mb-6 flex items-center gap-2 text-sm">
			<a href={base} class="link font-medium text-primary link-hover">Dashboard</a>
			<svg
				class="h-4 w-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<a href={base + '/tours'} class="link font-medium text-primary link-hover">Tours</a>
			<svg
				class="h-4 w-4 text-base-content/40"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="text-base-content/60">Bookings</span>
		</div>

		{#if form?.success}
			<div class="mb-6 alert alert-success">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				<span>{form.message}</span>
			</div>
		{/if}
		{#if form?.error}
			<div class="mb-6 alert alert-error">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				<span>{form.error}</span>
			</div>
		{/if}

		<div class="mb-4 flex flex-wrap items-center gap-2">
			<div class="join">
				{#each statusFilters as s (s)}
					<a
						href={base + `/tours/bookings${s ? `?status=${s}` : ''}`}
						class="btn btn-sm join-item {status === s ? 'btn-primary' : 'btn-ghost'}"
						>{s === '' ? 'All' : s}</a
					>
				{/each}
			</div>
		</div>

		<div class="rounded-lg bg-base-100 shadow-sm">
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>Booking</th>
							<th>Package</th>
							<th>Customer</th>
							<th>Email</th>
							<th>Phone</th>
							<th>Travelers</th>
							<th>Total</th>
							<th>Payment</th>
							<th>Status</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each bookings as booking (booking.id)}
							<tr>
								<td>
									<div class="font-mono text-sm font-semibold">{booking.booking_number}</div>
									<div class="text-xs text-base-content/50">{fmtDate(booking.created_at)}</div>
								</td>
								<td>
									<div class="font-medium">{booking.package_title}</div>
									<div class="text-xs text-base-content/50">
										Dep: {fmtDate(booking.departure_date)}
									</div>
								</td>
								<td class="text-sm">{booking.name}</td>
								<td class="text-sm">{booking.email}</td>
								<td class="text-sm">{booking.phone}</td>
								<td class="text-sm">A:{booking.adults} C:{booking.children} I:{booking.infants}</td>
								<td class="font-semibold">{fmtMoney(booking.total)}</td>
								<td
									><span class="badge {paymentBadge(booking.payment_status)}"
										>{booking.payment_status}</span
									></td
								>
								<td
									><span class="badge {bookingBadge(booking.booking_status)}"
										>{booking.booking_status}</span
									></td
								>
								<td class="text-right">
									{#if booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed'}
										<div class="flex justify-end gap-1">
											{#if booking.booking_status === 'pending'}
												<form method="POST" action="?/confirm" use:enhance>
													<input type="hidden" name="id" value={booking.id} />
													<button
														type="submit"
														class="btn btn-sm btn-ghost text-success"
														onclick={(e) => {
															if (!confirm(`Confirm booking ${booking.booking_number}? A confirmation email will be sent to ${booking.email}.`))
																e.preventDefault();
														}}>Confirm</button
													>
												</form>
											{/if}
											<form method="POST" action="?/cancel" use:enhance>
												<input type="hidden" name="id" value={booking.id} />
												<button
													type="submit"
													class="btn btn-sm btn-ghost text-error"
													onclick={(e) => {
														if (!confirm(`Cancel booking ${booking.booking_number}?`))
															e.preventDefault();
													}}>Cancel</button
												>
											</form>
										</div>
									{:else}
										<span class="text-xs text-base-content/40">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>

				{#if bookings.length === 0}
					<div class="py-16 text-center text-base-content/50">No bookings found.</div>
				{/if}
			</div>

			{#if pagination.count > pagination.page_size}
				<div class="flex items-center justify-between border-t border-base-300 p-4">
					<p class="text-sm text-base-content/60">
						Showing {pagination.page} of {Math.max(
							1,
							Math.ceil(pagination.count / pagination.page_size)
						)} pages ({pagination.count} bookings)
					</p>
					<div class="flex gap-2">
						<a
							href={`${base}/tours/bookings?page=${Math.max(1, pagination.page - 1)}${status ? `&status=${status}` : ''}`}
							class="btn btn-sm {pagination.page <= 1 ? 'btn-disabled' : ''}">Prev</a
						>
						<a
							href={`${base}/tours/bookings?page=${pagination.page + 1}${status ? `&status=${status}` : ''}`}
							class="btn btn-sm"
							class:btn-disabled={pagination.page * pagination.page_size >= pagination.count}
							>Next</a
						>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
