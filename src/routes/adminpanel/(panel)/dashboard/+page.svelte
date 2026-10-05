<script lang="ts">
	import DashboardContent from '../components/ui/DashboardContent.svelte';
	let { data } = $props();

	const dashboardstats = {
		totalOrders: {
			total_orders: data.stats.totalBookings,
			total_revenue: data.stats.revenue
		},
		statusCount: {
			status_counts: Object.fromEntries(
				(data.statusBreakdown ?? []).map((s: any) => [s.status, s.count])
			)
		},
		recentOrders: {
			orders: (data.recentBookings ?? []).map((b: any) => ({
				order_code: b.booking_code ?? b.id,
				user__name: b.customer_name ?? b.user_name ?? '',
				user__phone: b.customer_phone ?? b.phone ?? '',
				total_items: (Number(b.adults) || 0) + (Number(b.children) || 0) + (Number(b.infants) || 0),
				total: b.total,
				status: b.booking_status,
				created_at: b.created_at
			}))
		},
		topProducts: {
			products: (data.topCategories ?? []).map((c: any) => ({
				name: c.name ?? c.title ?? '',
				total_orders: c.package_count ?? 0,
				total_revenue: 0
			}))
		}
	};
</script>

<DashboardContent {dashboardstats} />