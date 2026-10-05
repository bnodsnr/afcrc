import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const actions: Actions = {
	async updateBanner({ request, fetch, locals }) {
		try {
			const data = await request.formData();
			const id = data.get('id');
			
			const bannerId = Number(id);
			if (isNaN(bannerId)) {
				return fail(400, { error: 'Invalid banner ID' });
			}

			const formData = new FormData();
			formData.append('title', (data.get('title') as string) || '');
			formData.append('primary_text', (data.get('primary_text') as string) || '');
			formData.append('secondary_text', (data.get('secondary_text') as string) || '');
			formData.append('link', (data.get('link') as string) || '');
			formData.append('is_active', (data.get('is_active') as string) === 'on' ? 'true' : 'false');

			// Add image if provided
			const imageFile = data.get('image');
			if (imageFile instanceof File && imageFile.size > 0) {
				formData.append('image', imageFile);
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/banners/${bannerId}/update/`, {
				method: 'POST',
				body: formData,
				headers: {
					Authorization: `Bearer ${locals.authToken || ''}`
				},
				credentials: 'include'
			});

			console.log('📤 Update Banner Response Status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Failed to update banner:', errorText);
				return fail(response.status, { error: 'Failed to update banner' });
			}

			const result = await response.json();
			console.log('✅ Banner updated successfully:', result);

			return {
				success: true,
				message: 'Banner updated successfully'
			};
		} catch (error) {
			console.error('❌ Error updating banner:', error);
			return fail(500, { error: 'Failed to update banner' });
		}
	},

	async deleteBanner({ request, fetch, locals }) {
		try {
			const data = await request.formData();
			const id = data.get('id');

			const bannerId = Number(id);
			if (isNaN(bannerId)) {
				return fail(400, { error: 'Invalid banner ID' });
			}

			console.log('📤 Deleting banner:', bannerId);

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/banners/${bannerId}/delete/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${locals.authToken || ''}`
				},
				credentials: 'include'
			});

			console.log('📤 Delete Banner Response Status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Failed to delete banner:', errorText);
				return fail(response.status, { error: 'Failed to delete banner' });
			}

			const result = await response.json();
			console.log('✅ Banner deleted successfully:', result);

			return {
				success: true,
				message: 'Banner deleted successfully'
			};
		} catch (error) {
			console.error('❌ Error deleting banner:', error);
			return fail(500, { error: 'Failed to delete banner' });
		}
	},

	async toggleStatus({ request, fetch, locals }) {
		try {
			const data = await request.formData();
			const id = data.get('id');
			const isActive = data.get('is_active') === 'true';

			const bannerId = Number(id);
			if (isNaN(bannerId)) {
				return fail(400, { error: 'Invalid banner ID' });
			}

			const formData = new FormData();
			formData.append('is_active', isActive ? 'true' : 'false');

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/banners/${bannerId}/update/`, {
				method: 'POST',
				body: formData,
				headers: {
					Authorization: `Bearer ${locals.authToken || ''}`
				},
				credentials: 'include'
			});

			console.log('📤 Toggle Status Response:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Failed to toggle status:', errorText);
				return fail(response.status, { error: 'Failed to toggle status' });
			}

			return {
				success: true,
				message: 'Status updated successfully'
			};
		} catch (error) {
			console.error('❌ Error toggling status:', error);
			return fail(500, { error: 'Failed to toggle status' });
		}
	}
};