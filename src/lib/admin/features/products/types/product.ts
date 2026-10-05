// src/lib/features/products/types/product.ts

export type ProductTypeChoice =
	| 'none'
	| 'trending'
	| 'flash_sales'
	| 'new_arrivals'
	| 'best_sellers'
	| 'hot_deals';

export type VendorChoice = string;
export type StatusChoice = 'draft' | 'published';
export type VisibilityChoice = 'visible' | 'hidden';
export type StockStatusChoice = 'instock' | 'outofstock' | 'onbackorder';
export type SizeCategoryChoice = 'none' | 'clothing' | 'shoes' | 'accessories' | 'general' | 'grocery';
export type PriceUnitChoice = 'per_kg' | 'per_packet';

export type VariationStatus = 'active' | 'inactive';

export interface Inventory {
	manageStock: boolean;
	stock_quantity: number | '';
	stockStatus: StockStatusChoice;
	backordersAllowed: boolean;
	low_stock_threshold: number | null | '';
}

export interface Shipping {
	weight: number | '';
	length: number | '';
	width: number | '';
	height: number | '';
}

export interface Attribute {
	name: string;
	value: string;
	isVariation: boolean;
}

export interface MainImage {
	file: File;
	alt_text: string;
	is_primary: boolean;
	color: string;
}

export interface VariationAttributes {
	[key: string]: string;
}

export interface MainImage {
	file: File | null;
	alt_text: string;
	is_primary: boolean;
	color: string;
}

export interface GalleryImage {
	file: File | null;
	alt_text: string;
	is_primary: boolean;
	color: string;
}

export interface ProductColor {
	name: string;
	hex_code: string;
	image: File | null;
	is_available: boolean;
}

export interface ProductSize {
	size: string;
	category: SizeCategoryChoice;
	is_available: boolean;
}

export interface ProductSEO {
	meta_title: string;
	meta_description: string;
	slug_override: string;
	canonical_url: string;
	focus_keyword: string;
}

export interface ProductResponse {
	id: number;
	name: string;
	seoSlug: string;
	slug: string;
	sku: string;
	vendor: VendorChoice;
	description: string;
	shortDescription: string;
	product_type: ProductTypeChoice;
	status: StatusChoice;
	regular_price: number | 0;
	sale_price: number | null | 0;
	price_unit: PriceUnitChoice;
	weight: number | null | '';
	category: string | number | 0;
	categorySlug: string;
	subcategory: string | number | 0;
	visibility: VisibilityChoice;
	inventory: Inventory;
	shipping: Shipping;
	attributes: Attribute[];
	variations: Variation[];
	mainImage: MainImage | null;
	galleryImages: GalleryImage[];
	colors: ProductColor[];
	sizes: ProductSize[];
	seo: ProductSEO;
	reviewsEnabled: boolean;
	featured: boolean;
	createdAt?: string;
	updatedAt?: string;
	is_featured: boolean;
	product_sizes: string[] | null;
	product_size_category: SizeCategoryChoice;
}

export interface Product {
	name: string;
	seoSlug: string;
	slug: string;
	sku: string;
	vendor: VendorChoice;
	description: string;
	shortDescription: string;
	product_type: ProductTypeChoice;
	status: StatusChoice;
	regularPrice: number | 0;
	salePrice: number | null | 0;
	priceUnit: PriceUnitChoice;
	weight: number | '';
	category: string | number | 0;
	categorySlug: string;
	subcategory: string | number | 0;
	visibility: VisibilityChoice;
	inventory: Inventory;
	shipping: Shipping;
	attributes: Attribute[];
	variations: Variation[];
	mainImage: MainImage | null;
	galleryImages: GalleryImage[];
	colors: ProductColor[];
	sizes: ProductSize[];
	
	seo: ProductSEO;
	reviewsEnabled: boolean;
	featured: boolean;
	createdAt?: string;
	updatedAt?: string;
	is_featured: boolean;
	product_sizes: string[] | null;
	product_size_category: SizeCategoryChoice;
}

export interface ProductResponse {
	name: string;
	seoSlug: string;
	slug: string;
	sku: string;
	vendor: VendorChoice;
	description: string;
	shortDescription: string;
	product_type: ProductTypeChoice;
	status: StatusChoice;
	regular_price: number | 0;
	sale_price: number | null | 0;
	price_unit: PriceUnitChoice;
	weight: number | null | '';
	category: string | number | 0;
	categorySlug: string;
	subcategory: string | number | 0;
	visibility: VisibilityChoice;
	inventory: Inventory;
	shipping: Shipping;
	attributes: Attribute[];
	variations: Variation[];
	primary_image: MainImage | null;
	galleryImages: GalleryImage[];
	colors: ProductColor[];
	sizes: ProductSize[];
	seo: ProductSEO;
	reviewsEnabled: boolean;
	featured: boolean;
	createdAt?: string;
	updatedAt?: string;
	is_featured: boolean;
	product_sizes: string[] | null;
	product_size_category: SizeCategoryChoice;
	stock_quantity: number | string | '';  // API response field (maps to quantity)
}

export interface VariationImage {
	file?: File | null;        // set when user picks a new file
	path?: string;             // existing image path (for edit mode)
	alt_text?: string;         // alt text for the image
	is_primary?: boolean;      // whether it's the primary image
	color?: string;            // associated color
}


export interface Variation {
	id: number | null;
	name: string;
	weight: string;
	regular_price: number | string | '';
	sales_price: number | string | '';
	price: number | string | '';
	quantity: number | string | '';  // form field name
	stock_quantity?: number | string;  // API response field (maps to quantity)
	status: VariationStatus;
	color: string;
	image?: VariationImage | null;
}


// Factory so every component/page gets a clean default object
export function createEmptyProduct(): Product {
	return {
		name: '',
		seoSlug: '',
		slug: '',
		sku: '',
		vendor: '',
		description: '',
		shortDescription: '',
		product_type: 'none',
		status: 'published',
		regularPrice: 0,
		salePrice: 0,
		priceUnit: 'per_kg',
		weight: '',
		category: '',
		categorySlug: '',
		subcategory: '',
		visibility: 'visible',
		inventory: {
			manageStock: true,
			stock_quantity: 1,
			stockStatus: 'instock',
			backordersAllowed: false,
			low_stock_threshold: 1
		},
		shipping: { weight: '', length: '', width: '', height: '' },
		attributes: [],
		variations: [],
		mainImage: null,
		galleryImages: [],
		colors: [],
		sizes: [],
		seo: {
			meta_title: '',
			meta_description: '',
			slug_override: '',
			canonical_url: '',
			focus_keyword: ''
		},
		reviewsEnabled: true,
		is_featured: false,
		product_sizes: null,
		product_size_category: 'none',
	};
}

/**
 * Maps API response data to Variation object
 * Handles both API field names (stock_quantity, weight, price) and form field names (quantity)
 */
export function mapApiVariationToFormVariation(apiVariation: any): Variation {
	return {
		id: apiVariation.id ?? null,
		name: apiVariation.name || '',
		weight: String(apiVariation.weight || '0'),
		regular_price: apiVariation.regular_price ?? apiVariation.price ?? '',
		sales_price: apiVariation.sales_price ?? '',
		price: apiVariation.price || '',
		quantity: apiVariation.stock_quantity ?? apiVariation.quantity ?? '',
		status: apiVariation.status || 'active',
		color: apiVariation.color || '',
		image: apiVariation.image
			? {
					file: null,
					path: apiVariation.image,
					alt_text: apiVariation.image_alt || '',
					is_primary: false,
					color: apiVariation.color || ''
			  }
			: null
	};
}

export function createEmptyVariation(): Variation {
	return {
		id: null,
		name: '',
		weight: '0',
		regular_price: '',
		sales_price: '',
		price: '',
		quantity: '',
		status: 'active',
		color: '',
		image: null
	};
}