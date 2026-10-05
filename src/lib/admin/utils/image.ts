/**
 * Image utility functions
 * Convenient wrapper around imageService
 */

import { imageService } from '$lib/admin/services/imageService';

/**
 * Get full image URL from API path
 * @param path - Image path from API
 * @param fallback - Optional fallback image
 */
export function getImageUrl(path: string | null | undefined, fallback?: string): string {
	return imageService.getFullPath(path, fallback);
}

/**
 * Get multiple image URLs
 * @param paths - Array of image paths
 * @param fallback - Optional fallback image
 */
export function getImageUrls(paths: (string | null | undefined)[], fallback?: string): string[] {
	return imageService.getFullPaths(paths, fallback);
}

/**
 * Check if image path is valid
 * @param path - Image path to validate
 */
export function isValidImagePath(path: string | null | undefined): boolean {
	return imageService.isValidPath(path);
}

/**
 * Get image with size suffix
 * @param path - Image path
 * @param size - Size suffix (thumbnail, medium, large)
 */
export function getImageWithSize(path: string | null | undefined, size: string): string {
	return imageService.getImageWithSize(path, size);
}