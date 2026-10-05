import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	try {
		// Get token from cookies
		const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
		if (!token) {
			console.warn('⚠️ No access token found in cookies. Redirecting to login.');
			throw redirect(303, `${base}/login`);
		}
		
		// Use server-side fetch instead of client API
		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/banners/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ Failed to fetch banners:', errorText);
			return {
				banners: [],
				error: 'Failed to load banners'
			};
		}

		const data = await response.json();

		// Extract banners from Django API response format
		// The API returns: { success: true, message: '...', data: [...] }
		let banners = [];
		
		if (data && typeof data === 'object') {
			// Handle Django REST response format
			if (data.data && Array.isArray(data.data)) {
				banners = data.data;
			} else if (data.results && Array.isArray(data.results)) {
				banners = data.results;
			} else if (Array.isArray(data)) {
				banners = data;
			} else {
				console.warn('⚠️ Unexpected banners data format:', data);
			}
		}
		return {
			banners: banners
		};
	} catch (error) {
		console.error('❌ Error fetching banners:', error);
		return {
			banners: [],
			error: 'Failed to load banners'
		};
	}
};

export const actions: Actions = {
	deleteBanner: async ({ request, cookies }) => {
		try {
			const formData = await request.formData();
			const bannerId = formData.get('id');

			if (!bannerId) {
				return fail(400, {
					success: false,
					message: 'Banner ID is required'
				});
			}

			// Get token from httpOnly cookies
			const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';

			if (!token) {
				return fail(401, {
					success: false,
					message: 'Not authenticated'
				});
			}

			// Make request to backend API with token
			const backendUrl = `${PUBLIC_API_BASE_URL}/api/banners/${bannerId}/delete/`;

			const response = await fetch(backendUrl, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include'
			});


			const data = await response.json();

			if (!response.ok) {
				return fail(response.status, data);
			}

			return {
				success: true,
				data: data
			};
		} catch (error) {
			return fail(500, {
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
};