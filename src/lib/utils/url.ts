/**
 * URL utility functions
 */

import { base } from '$app/paths';

/**
 * Generate a category URL with SEO slug and unique slug
 * @param category - Category object with seo_slug and slug (or name and slug)
 * @returns URL string in format /categories/{seo_slug}/{unique_slug}
 */
export function getCategoryUrl(category: { name?: string; slug?: string; seo_slug?: string }): string {
	// Handle missing or invalid data
	if (!category || !category.slug) {
		console.warn('Invalid category data - missing slug:', category);
		return `${base}/product`;
	}
	
	// Use seo_slug from backend, or generate from name, or use slug as fallback
	let seoSlug: string;
	if (category.seo_slug) {
		seoSlug = category.seo_slug;
	} else if (category.name) {
		seoSlug = category.name
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');
	} else {
		// Fallback: use the unique slug for both parts
		seoSlug = category.slug;
	}
	
	// Format: /categories/{seo_slug}/{unique_slug}
	// return `${base}/categories/${seoSlug}/${category.slug}`;
	return `${base}/product/${category.seo_slug}`;
}

/**
 * Generate a product URL with SEO slug and unique slug
 * @param product - Product object with seo_slug and slug (or name and slug)
 * @returns URL string in format /product/{seo_slug}/{unique_slug}
 */
export function getProductUrl(product: { name?: string; slug?: string; seo_slug?: string }): string {
	// Handle missing or invalid data
	if (!product || !product.slug) {
		console.warn('Invalid product data - missing slug:', product);
		return `${base}/product`;
	}
	
	// Use seo_slug from backend, or generate from name, or use slug as fallback
	let seoSlug: string;
	if (product.seo_slug) {
		seoSlug = product.seo_slug;
	} else if (product.name) {
		seoSlug = product.name
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');
	} else {
		// Fallback: use the unique slug for both parts
		seoSlug = product.slug;
	}
	
	// Format: /product/{seo_slug}/{unique_slug}
	return `${base}/product/${seoSlug}/${product.slug}`;
}

