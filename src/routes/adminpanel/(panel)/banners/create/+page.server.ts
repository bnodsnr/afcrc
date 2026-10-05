import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
		if (!token) {
			return fail(401, { error: 'Unauthorized' });
		}
		try {
			const data = await request.formData();
			const title = data.get('title') as string;
			const primaryText = data.get('primary_text') as string;
			const secondaryText = data.get('secondary_text') as string;
			const link = data.get('link') as string;
			const placement = data.get('placement') as string;
			const imageFile = data.get('image') as File | null;
			const isActive = data.get('is_active') === 'on';

			// Validate required fields
			if (!title || title.trim() === '') {
				return fail(400, {
					error: 'Banner title is required',
					title,
					primaryText,
					secondaryText,
					link,
					isActive
				});
			}

			// Validate image size on server side as well
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
					isActive
				});
			}
			
			// Build FormData for the API
			const formData = new FormData();
			formData.append('title', title);
			formData.append('primary_text', primaryText || '');
			formData.append('secondary_text', secondaryText || '');
			formData.append('link', link || '');
			formData.append('placement', placement || '');
			formData.append('is_active', String(isActive));
			if (imageFile && imageFile.size > 0) {
				formData.append('image', imageFile);
			}


			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/banners/create/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});


			if (!response.ok) {
				const errorText = await response.text();
				try {
					const errorData = JSON.parse(errorText);
					return fail(response.status, {
						error: errorData.message || 'Failed to create banner',
						details: errorData
					});
				} catch {
					return fail(response.status, {
						error: 'Failed to create banner',
						details: errorText
					});
				}
			}

			const result = await response.json();
			return {
				success: true,
				message: 'Banner created successfully',
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
