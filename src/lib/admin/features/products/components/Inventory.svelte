<script lang="ts">
	import type { Product } from '../types/product';

	let {
		product = $bindable()
	}: {
		product: Product;
	} = $props();
</script>

<div class="rounded-lg bg-base-100 p-6 shadow-sm">
	<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
			/>
		</svg>
		Inventory & Stock Management
	</h2>

	<div class="space-y-4">
		<div class="form-control">
			<label class="label cursor-pointer justify-start gap-2">
				<input
					type="checkbox"
					name="manage_stock"
					class="checkbox"
					bind:checked={product.inventory.manageStock}
				/>
				<span class="label-text font-medium">Track quantity for this inventory</span>
			</label>
		</div>

		{#if product.inventory.manageStock}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="form-control">
					<label class="label" for="stockQty">
						<span class="label-text">Stock Quantity</span>
					</label>
					<input
						id="stockQty"
						type="number"
						name="stockQuantity"
						class="input-bordered input w-full"
						bind:value={product.inventory.stock_quantity}
						placeholder="0"
						min="0"
					/>
				</div>
				<div class="form-control">
					<label class="label" for="lowStock">
						<span class="label-text">Low Stock Threshold</span>
					</label>
					<input
						id="lowStock"
						type="number"
						name="lowStockThreshold"
						class="input-bordered input w-full"
						bind:value={product.inventory.low_stock_threshold}
						placeholder="2"
						min="0"
					/>
				</div>
			</div>
		{/if}

		<div class="form-control">
			<label class="label" for="stockStatus">
				<span class="label-text font-medium">Stock Status</span>
			</label>
			<select
				id="stockStatus"
				class="select-bordered select w-full"
				name="stockStatus"
				bind:value={product.inventory.stockStatus}
			>
				<option value="instock">In Stock</option>
				<option value="outofstock">Out of Stock</option>
				<option value="onbackorder">On Backorder</option>
			</select>
		</div>

		<div class="form-control">
			<label class="label" for="backorders">
				<span class="label-text font-medium">Allow Backorders</span>
			</label>
			<select
				id="backorders"
				class="select-bordered select w-full"
				name="allowBackorders"
				bind:value={product.inventory.backorders_allowed}
			>
				<option value="no">Do not allow</option>
				<option value="notify">Allow, but notify customer</option>
				<option value="yes">Allow</option>
			</select>
		</div>
	</div>
</div>
