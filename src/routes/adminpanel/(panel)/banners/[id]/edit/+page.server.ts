import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ params, fetch, cookies }) => {
	const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
	try {
		const bannerId = Number(params.id);
		if (isNaN(bannerId)) {
			throw error(400, 'Invalid banner ID');
		}

		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/banners/${bannerId}/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});


		if (!response.ok) {
			const errorText = await response.text();
			throw error(response.status, 'Failed to load banner');
		}

		const data = await response.json();

		// Extract banner from Django API response format
		let banner = null;
		
		if (data && typeof data === 'object') {
			if (data.data && typeof data.data === 'object') {
				banner = data.data;
			} else if (data.results && Array.isArray(data.results) && data.results[0]) {
				banner = data.results[0];
			} else if (!Array.isArray(data)) {
				banner = data;
			}
		}

		if (!banner) {
			throw error(404, 'Banner not found');
		}

		return {
			banner
		};
	} catch (err) {
		if (err instanceof Error && err.message.includes('Failed')) {
			throw err;
		}
		throw error(500, 'Failed to load banner');
	}
};

export const actions: Actions = {
	default: async ({ request, params, fetch, cookies }) => {
		const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
		try {
			const bannerId = Number(params.id);
			if (isNaN(bannerId)) {
				return fail(400, { error: 'Invalid banner ID' });
			}

			const data = await request.formData();
			const title = data.get('title') as string;
			const primaryText = data.get('primary_text') as string;
			const secondaryText = data.get('secondary_text') as string;
			const link = data.get('link') as string;
			const imageFile = data.get('image') as File | null;
			const isActive = data.get('is_active') === 'on';
			const placement = data.get('placement') as string;

			// Validate required fields
			if (!title || title.trim() === '') {
				return fail(400, {
					error: 'Banner title is required',
					title,
					primaryText,
					secondaryText,
					link,
					isActive,
					placement
				});
			}

			// Validate image size on server side
			const maxImageSize = 2 * 1024 * 1024; // 2MB
			if (imageFile && imageFile.size > maxImageSize) {
				const sizeMB = (imageFile.size / (1024 * 1024)).toFixed(2);
				console.error(`❌ Image too large: ${sizeMB}MB exceeds 2MB limit`);
				return fail(400, {
					error: `Image size ${sizeMB}MB exceeds 2MB limit`,
					title,
					primaryText,
					secondaryText,
					link,
					isActive,
					placement
				});
			}

			// Build FormData for the API
			const formData = new FormData();
			formData.append('title', title);
			formData.append('primary_text', primaryText || '');
			formData.append('secondary_text', secondaryText || '');
			formData.append('link', link || '');
			formData.append('is_active', String(isActive));
			formData.append('placement', placement || '');
			if (imageFile && imageFile.size > 0) {
				console.log(`📤 Adding image to FormData: ${imageFile.name} (${(imageFile.size / 1024).toFixed(2)}KB)`);
				formData.append('image', imageFile);
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/banners/${bannerId}/update/`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData,
				credentials: 'include'
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ API Error Response:', errorText);
				try {
					const errorData = JSON.parse(errorText);
					return fail(response.status, {
						error: errorData.message || 'Failed to update banner',
						details: errorData
					});
				} catch {
					return fail(response.status, {
						error: 'Failed to update banner',
						details: errorText
					});
				}
			}

			const result = await response.json();
			return {
				success: true,
				message: 'Banner updated successfully',
				banner: result
			};
		} catch (error: any) {
			
			// Check if it's a payload size error
			const errorMsg = error?.message || String(error);
			if (errorMsg.includes('payload') || errorMsg.includes('size') || errorMsg.includes('413')) {
				console.error('❌ Payload size exceeded - file or form data too large');
				return fail(413, {
					error: 'Payload size exceeded. Please use a smaller image (max 2MB).',
					details: 'The request body is too large. Make sure your image is under 2MB.'
				});
			}
			
			return fail(500, {
				error: 'An unexpected error occurred',
				details: error instanceof Error ? error.message : String(error)
			});
		}
	}
};
