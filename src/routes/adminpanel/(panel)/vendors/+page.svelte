<script lang="ts">
	import { base } from '$lib/admin/paths';

	interface Vendor {
		id: number;
		name: string;
		slug?: string;
		description?: string;
		logo?: string;
		email?: string;
		phone?: string;
		address?: string;
		is_active?: boolean;
		created_at?: string;
		updated_at?: string;
		[key: string]: any;
	}

	let { data } = $props();
	let vendors = $state<Vendor[]>(data.vendors || []);
	let isLoading = $state(false);

	let searchQuery = $state('');

	let filteredVendors = $derived(
		vendors.filter((v) => {
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return (
				v.name?.toLowerCase().includes(q) ||
				v.email?.toLowerCase().includes(q) ||
				v.phone?.toLowerCase().includes(q) ||
				v.address?.toLowerCase().includes(q)
			);
		})
	);

	function formatDate(dateString: string | undefined) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async function deleteVendor(id: number) {
		if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
			return;
		}

		isLoading = true;
		try {
			const formData = new FormData();
			formData.append('id', id.toString());

			const response = await fetch('?/deleteVendor', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			if (result.type === 'success') {
				vendors = vendors.filter((v) => v.id !== id);
				alert('Vendor deleted successfully');
			} else {
				alert('Failed to delete vendor: ' + (result.data?.message || 'Unknown error'));
			}
		} catch (error) {
			console.error('Error deleting vendor:', error);
			alert('Error deleting vendor');
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="rounded-lg bg-white p-6 shadow-md dark:bg-base-100">
	<div class="mb-6 flex items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">Vendors</h1>
			<p class="text-sm text-base-content/60">Manage your vendors</p>
		</div>
		<a
			href={base + '/vendors/create'}
			class="btn flex-nowrap gap-2 border-base-content bg-base-content text-base-100 transition-shadow btn-sm hover:border-base-content hover:bg-base-content/90 hover:shadow-lg"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add New Vendor
		</a>
	</div>

	<!-- Search -->
	<form class="mb-6" onsubmit={(e) => e.preventDefault()}>
		<!-- <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
			<div class="form-control md:col-span-3">
				<input
					type="text"
					placeholder="Search by name, email, phone, or address..."
					class="input-bordered input input-md w-full bg-white/90 text-base-content placeholder-base-content/50"
					bind:value={searchQuery}
				/>
			</div>
			<div class="form-control">
				<button
					class="btn w-full flex-nowrap gap-2 btn-md btn-primary"
					type="button"
					onclick={() => (searchQuery = '')}
				>
					Clear
				</button>
			</div>
		</div> -->
	</form>

	<!-- Vendors Table -->
	<div class="overflow-x-auto">
		{#if filteredVendors.length > 0}
			<table class="table">
				<thead>
					<tr class="border-b-2 bg-base-100">
						<th>#SN</th>
						<th>Name</th>
						<th>Email</th>
						<th>Phone</th>
						<th>Address</th>
						<th>Status</th>
						<th>Created</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredVendors as vendor, index (vendor.id)}
						<tr class="border-b border-base-200 hover:bg-base-100">
							<td>{index + 1}</td>
							<td class="font-medium">{vendor.name}</td>
							<td>{vendor.email || '—'}</td>
							<td>{vendor.phone || '—'}</td>
							<td class="max-w-[200px] truncate">{vendor.address || '—'}</td>
							<td>
								<span class={`badge ${vendor.is_active ? 'badge-success' : 'badge-error'}`}>
									{vendor.is_active ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td>{formatDate(vendor.created_at)}</td>
							<td>
								<div class="flex gap-2">
									<a
										href={base + `/vendors/${vendor.id}/edit`}
										class="btn btn-square btn-xs btn-info"
										title="Edit vendor"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
									</a>
									<button
										onclick={() => deleteVendor(vendor.id)}
										disabled={isLoading}
										class="btn btn-square text-white btn-xs btn-error"
										title="Delete vendor"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<div class="py-12 text-center">
				<svg
					class="mx-auto mb-4 h-12 w-12 text-base-content/30"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
					/>
				</svg>
				<p class="text-lg font-medium text-base-content/60">No vendors found</p>
				<p class="text-sm text-base-content/40">
					{#if searchQuery}
						Try adjusting your search
					{:else}
						Vendors will appear here once they are added
					{/if}
				</p>
			</div>
		{/if}
	</div>
</div>
