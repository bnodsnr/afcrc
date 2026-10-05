/**
 * API response types
 */

export interface ProductData {
	id: string;
	name: string;
	price: number;
	originalPrice?: number;
	image: string;
	category?: string;
	rating?: number;
	reviews?: number;
	discount?: number;
	isNew?: boolean;
	isFeatured?: boolean;
}

export interface TrendingData {
	Datas: Data[];
	title?: string;
	subtitle?: string;
}

export interface FlashSale {
	id: string;
	Data: Data;
	endTime: string;
	discount: number;
	soldCount?: number;
	totalCount?: number;
}

export interface FlashSalesData {
	sales: FlashSale[];
	endTime?: string;
	title?: string;
}

export interface PromoBanner {
	id: number;
	primary_text: string | null;
	secondary_text: string | null;
	title: string | null;
	image: string;
	link: string | null;
	button_text: string | null;
	button_link: string | null;
	is_active: boolean;
	text_alignment?: string;
}

// The API returns the array directly after unwrapping the { success, message, data } wrapper
export type PromoBannersData = PromoBanner[];

export interface BestSellerData {
	Datas: Data[];
	title?: string;
}

export interface CollectionData {
	id: string;
	name: string;
	image: string;
	DataCount?: number;
	link?: string;
}

export interface CollectionsData {
	collections: CollectionData[];
	title?: string;
}

export interface Subcategory {
	id: number;
	name: string;
	description: string;
	featured_image: string;
	category?: CategoryData;
}

export interface CategoryData {
	id: number;
	name: string;
	description: string;
	featured_image: string;
	subcategories?: Subcategory[];
	Datas?: any[];
	seo_slug: string;
	slug: string;
}

export interface BlogData {
	id: number;
	title: string;
	content: string;
	author: string;
	slug: string;
	created_at: string;
	image: string;
}

export interface SettingsData {
	address_line1: string;
	address_line2: string;
	city: string;
	state: string;
	postal_code: string;
	country: string;
	phone_number: string;
	email: string;
	working_hours: string;
	logo: string;
	favicon: string;
	map_embed_code: string;
	facebook_url: string | null;
	twitter_url: string | null;
	instagram_url: string | null;
	linkedin_url: string | null;
	tiktok_url: string | null;
	youtube_url: string | null;
	whatsapp_number: string | null;
	whatsapp_message: string | null;
}

export interface TestimonialData {
	id: string;
	name: string;
	designation: string;
	company: string;
	content: string;
	photo: string;
	rating: number;
}

export interface TeamData {
	id: number;
	name: string;
	qualification: string | null;
	position: string | null;
	description: string | null;
	image: string | null;
	is_active: boolean;
	created_at: string;
}

export type ProductType = 'agri_product' | 'premium_meat' | 'beverage' | string;

export interface ProductWidget {
	id: number;
	name: string;
	slug: string;
	sku: string;
	description: string;
	regular_price: string | number;
	sale_price: string | number | null;
	discount_percentage: number;
	product_type: ProductType;
	category: string | null;
	price_unit: string | null;
	image: string | null;
	created_at: string;
}

export interface CategoryWidget {
	id: number;
	name: string;
	slug: string;
	seo_slug: string;
	products: ProductWidget[];
}

export interface ComponentData {
	id: number;
	name: string;
	url: string;
	slug: string;
	position: string;
	is_parent: boolean;
	is_component: boolean;
	component_name: string | null;
	parent: number | null;
	featured_image: string | null;
	page_content: string | null;
	order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	children: ComponentData[];
}

export type ComponentsData = ComponentData[];

/** A row from /api/get-page-components/ (component_name filter, e.g. "introduction") */
export interface PageComponentData {
	id: number;
	name: string;
	url: string;
	slug: string;
	position: string;
	is_parent: boolean;
	is_component: boolean;
	component_name: string | null;
	parent: number | null;
	featured_image: string | null;
	page_content: string | null;
	order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export type ProductWidgetsData = CategoryWidget[];
