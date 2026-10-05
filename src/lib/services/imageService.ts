/**
 * Image Service
 * Handles image URL generation and transformations
 */

import { env } from '$env/dynamic/public';

class ImageService {
	private baseUrl: string;

	constructor(baseUrl?: string) {
		// normalize baseUrl (remove trailing slash)
		this.baseUrl = (baseUrl || env.PUBLIC_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
	}

	/**
	 * Get full path for an image
	 * @param imagePath - The image path from API (e.g., '/media/banners/cat.jpg' or 'https://...')
	 * @param fallback - Optional fallback image URL if the path is invalid
	 * @returns Full image URL
	 */
	getFullPath(imagePath: string | null | undefined, fallback?: string): string {
		
		// Handle null or undefined
		if (!imagePath) {
			return fallback || '/placeholder.jpg';
		}

		// If already a full URL (starts with http:// or https://)
		if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
			return imagePath;
		}

		// Use URL parsing to handle base pathname correctly and avoid doubling it.
		try {
			const parsed = new URL(this.baseUrl);
			const origin = parsed.origin;
			const basePath = parsed.pathname.replace(/\/+$/, ''); // '/hhhadmin' or ''

			// normalize incoming image path to start with '/'
			const normalizedImage = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

			// If the image path already includes the base pathname (e.g. '/hhhadmin/...'),
			// just attach it to origin to avoid duplication.
			if (basePath && (normalizedImage === basePath || normalizedImage.startsWith(basePath + '/')) ) {
				return `${origin}${normalizedImage}`;
			}

			// Otherwise combine origin + basePath + normalizedImage
			return `${origin}${basePath}${normalizedImage}`;
		} catch (err) {
			// Fallback to simpler join if URL parse fails
			if (imagePath.startsWith('/')) return `${this.baseUrl}${imagePath}`;
			return `${this.baseUrl}/${imagePath}`;
		}
	}

	/**
	 * Get full path for multiple images
	 * @param imagePaths - Array of image paths
	 * @param fallback - Optional fallback image URL
	 * @returns Array of full image URLs
	 */
	getFullPaths(imagePaths: (string | null | undefined)[], fallback?: string): string[] {
		return imagePaths.map((path) => this.getFullPath(path, fallback));
	}

	/**
	 * Check if image path is valid
	 * @param imagePath - The image path to validate
	 * @returns boolean indicating if path is valid
	 */
	isValidPath(imagePath: string | null | undefined): boolean {
		return !!imagePath && imagePath.length > 0;
	}

	/**
	 * Get image with size suffix (for responsive images)
	 * @param imagePath - The image path
	 * @param size - Size suffix (e.g., 'thumbnail', 'medium', 'large')
	 * @returns Full image URL with size suffix
	 */
	getImageWithSize(imagePath: string | null | undefined, size: string): string {
		if (!imagePath) return '/placeholder.jpg';

		const fullPath = this.getFullPath(imagePath);
		const lastDot = fullPath.lastIndexOf('.');

		if (lastDot === -1) return fullPath;

		return `${fullPath.substring(0, lastDot)}_${size}${fullPath.substring(lastDot)}`;
	}
}

// Export singleton instance
export const imageService = new ImageService();

// Export class for custom instances
export { ImageService };
