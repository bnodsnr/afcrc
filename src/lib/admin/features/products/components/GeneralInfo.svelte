<script lang="ts">
	import { api } from '$lib/admin/api/client';
	import type { Product, Category, ProductTypeChoice } from '../types/product';

	type Vendor = { name: string; slug: string };

	type Props = {
		product: Product;
		categories?: Category[];
		subcategories?: Category[];
		subcategoriesLoading?: boolean;
		loadSubcategories?: (event: Event) => void;
		vendors?: Vendor[];
		token?: string;
	};

	let {
		product = $bindable<Product>(),
		categories = [],
		subcategories = [],
		subcategoriesLoading = false,
		loadSubcategories = () => {},
		vendors = [],
		token = ''
	}: Props = $props();
	let productTypes = $state<{ value: ProductTypeChoice; label: string }[]>([
		{ value: 'none', label: 'None' }
	]);
	let productTypesLoading = $state(false);

	let priceUnitLabel = $derived(product.priceUnit === 'per_packet' ? 'per packet' : 'per kg');
	let weightUnitLabel = $derived(product.priceUnit === 'per_packet' ? 'gram' : 'kg');

	$effect(() => {
		loadProductTypes();
	});

	async function loadProductTypes() {
		productTypesLoading = true;
		try {
			const result = await api.get('/api/product-types/list-all/', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			const body = result?.data ?? result;
			const items = Array.isArray(body) ? body : ((body as any)?.data ?? []);
			productTypes = [
				{ value: 'none', label: 'None' },
				...(items.map((t: any) => ({ value: t.code, label: t.name })) as {
					value: ProductTypeChoice;
					label: string;
				}[])
			];
		} catch (err) {
			console.error('Failed to load product types:', err);
		} finally {
			productTypesLoading = false;
		}
	}

	let showVendorModal = $state(false);
	let newVendorName = $state('');
	let newVendorError = $state('');
	let vendorSubmitting = $state(false);
	let vendorList = $state<Vendor[]>([...vendors]);

	function handleAddVendor() {
		newVendorName = '';
		newVendorError = '';
		showVendorModal = true;
	}

	function closeVendorModal() {
		showVendorModal = false;
		newVendorName = '';
		newVendorError = '';
	}

	async function handleSubmitVendor() {
		const name = newVendorName.trim();
		if (!name) {
			newVendorError = 'Vendor name is required';
			return;
		}
		const slug = name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_|_$/g, '');
		if (vendorList.some((v) => v.slug === slug)) {
			newVendorError = 'Vendor already exists';
			return;
		}

		vendorSubmitting = true;
		newVendorError = '';

		try {
			const result = await api.post(
				'/api/vendors/',
				{ name, slug },
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);
			const data = result?.data ?? result;
			const vendor: Vendor = { name: data?.name ?? name, slug: data?.slug ?? slug };
			vendorList = [...vendorList, vendor];
			product.vendor = vendor.slug as any;
			closeVendorModal();
		} catch (err: any) {
			newVendorError = err?.message || 'Failed to add vendor';
		} finally {
			vendorSubmitting = false;
		}
	}
</script>

<div class="rounded-lg bg-base-100 p-6 shadow-sm">
	<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		General Information
	</h2>
	<div class="space-y-4">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="name">
					<span class="label-text font-medium">Product Name</span>
				</label>
				<input
					id="name"
					type="text"
					name="name"
					class="input-bordered input w-full"
					bind:value={product.name}
				/>
			</div>

			<div class="form-control">
				<label class="label" for="productType">
					<span class="label-text font-medium">Product Type</span>
				</label>
				<select
					id="productType"
					name="productType"
					class="select-bordered select w-full"
					bind:value={product.product_type}
					disabled={productTypesLoading}
				>
					{#if productTypesLoading}
						<option value="">Loading product types...</option>
					{/if}
					{#each productTypes as type}
						<option value={type.value}>{type.label}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="category">
					<span class="label-text font-medium">Category</span>
				</label>
				<select
					id="category"
					class="select-bordered select w-full"
					name="category"
					bind:value={product.category}
					onchange={loadSubcategories}
				>
					<option value="">Select a category</option>
					{#each categories as category}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
			</div>
			<div class="form-control">
				<label class="label" for="subCategory">
					<span class="label-text font-medium">Sub Category</span>
				</label>
				<!-- ✅ removed {#key subcategories} — it was destroying/recreating the select and losing the bound value -->
				<select
					id="subCategory"
					class="select-bordered select w-full"
					bind:value={product.subcategory}
					name="subCategory"
					disabled={subcategoriesLoading}
				>
					<!-- ✅ disabled only when loading, not when empty — empty just shows the placeholder -->
					<option value="">
						{subcategoriesLoading
							? 'Loading...'
							: subcategories.length === 0
								? 'Select a category first'
								: 'Select a subcategory'}
					</option>
					{#each subcategories as subcategory}
						<option value={subcategory.id}>{subcategory.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="priceUnit">
					<span class="label-text font-medium">Price Option</span>
				</label>
				<select
					id="priceUnit"
					name="price_unit"
					class="select-bordered select w-full"
					bind:value={product.priceUnit}
				>
					<option value="per_kg">Per Kilogram (per kg)</option>
					<option value="per_packet">Per Packet</option>
				</select>
			</div>

			<div class="form-control">
				<label class="label" for="productWeight">
					<span class="label-text font-medium">Product Weight ({weightUnitLabel})</span>
				</label>
				<input
					id="productWeight"
					type="number"
					name="weight"
					class="input-bordered input w-full"
					bind:value={product.weight}
					placeholder={product.priceUnit === 'per_packet' ? 'e.g. 250 (packet weight)' : '0.00'}
					step="0.01"
					min="0"
				/>
				<label class="label" for="productWeight">
					<span class="label-text text-base-content/60">
						{#if product.priceUnit === 'per_packet'}
							Enter the packet weight so the price can be set accordingly
						{:else}
							Per kilogram price (leave empty for 1 kg)
						{/if}
					</span>
				</label>
			</div>
			<div class="form-control">
				<label class="label" for="regularPrice">
					<span class="label-text font-medium">Regular Price ({priceUnitLabel})</span>
				</label>
				<input
					id="regularPrice"
					type="number"
					name="regular_price"
					class="input-bordered input w-full"
					bind:value={product.regularPrice}
					placeholder="0.00"
					step="0.01"
				/>
			</div>
			<div class="form-control">
				<label class="label" for="salePrice">
					<span class="label-text font-medium">Sale Price ({priceUnitLabel})</span>
				</label>
				<input
					id="salePrice"
					type="number"
					name="sales_price"
					class="input-bordered input w-full"
					bind:value={product.salePrice}
					placeholder="0.00"
					step="0.01"
				/>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="shortDesc">
					<span class="label-text font-medium">Short Description</span>
				</label>
				<textarea
					id="shortDesc"
					name="shortDescription"
					class="textarea-bordered textarea h-20 w-full"
					bind:value={product.shortDescription}
					placeholder="Brief product description"
				></textarea>
			</div>
			<div class="form-control">
				<label class="label" for="fullDesc">
					<span class="label-text font-medium">Full Description</span>
				</label>
				<textarea
					id="fullDesc"
					name="description"
					class="textarea-bordered textarea h-20 w-full"
					bind:value={product.description}
					placeholder="Detailed product description"
				></textarea>
			</div>

			<div class="form-control">
				<label class="label" for="vendor">
					<span class="label-text font-medium"
						>Vendor <span
							><a href="#" onclick={handleAddVendor} class="link link-primary">[Add New Vendor]</a
							></span
						>
					</span></label
				>
				<select
					id="vendor"
					name="vendor"
					class="select-bordered select w-full"
					bind:value={product.vendor}
				>
					<option value="">Select a vendor</option>
					{#each vendorList as vendor}
						<option value={vendor.slug}>{vendor.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
</div>

{#if showVendorModal}
	<div class="modal-open modal">
		<div class="modal-box w-full max-w-md space-y-4">
			<h3 class="text-lg font-bold">Add New Vendor</h3>
			<div class="form-control">
				<label class="label" for="vendorName">
					<span class="label-text font-medium">Vendor Name</span>
				</label>
				<input
					id="vendorName"
					type="text"
					class="input-bordered input w-full"
					placeholder="e.g. Royal Hemp"
					bind:value={newVendorName}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							handleSubmitVendor();
						}
					}}
				/>
				{#if newVendorError}
					<label class="label">
						<span class="label-text-alt text-error">{newVendorError}</span>
					</label>
				{/if}
			</div>
			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={closeVendorModal}>Cancel</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={handleSubmitVendor}
					disabled={vendorSubmitting}
				>
					{vendorSubmitting ? 'Adding...' : 'Add Vendor'}
				</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick={closeVendorModal}></div>
	</div>
{/if}
