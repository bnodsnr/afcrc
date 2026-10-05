/**
 * Image Service
 * Handles image URL generation and transformations
 */

import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const baseUrl =
	PUBLIC_API_BASE_URL.replace(/\/+$/, '');

class ImageService {
	private baseUrl: string;

	constructor(baseUrl?: string) {
		// normalize baseUrl (remove trailing slash)
		this.baseUrl = (baseUrl || PUBLIC_API_BASE_URL || 'http://localhost:9000').replace(/\/+$/, '');
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
			console.log('[ImageService] No image path, using fallback:', fallback || '/placeholder.jpg');
			return fallback || '/placeholder.jpg';
		}

		const normalizedBase = this.baseUrl.replace(/\/+$/, '');
		let basePath = '';
		try {
			basePath = new URL(normalizedBase).pathname.replace(/\/+$/, '');
		} catch (_) {}

		// If already a full URL (starts with http:// or https://) or a data URL
		if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
			// If the full URL is missing the base path, insert it
			if (basePath) {
				try {
					const parsed = new URL(imagePath);
					if (!parsed.pathname.startsWith(basePath + '/') && parsed.pathname !== basePath) {
						const fixed = `${parsed.origin}${basePath}${parsed.pathname}`;
						console.log('[ImageService] Fixed full URL (added base path):', fixed);
						return fixed;
					}
				} catch (_) {}
			}
			console.log('[ImageService] Already full URL, returning as-is:', imagePath);
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