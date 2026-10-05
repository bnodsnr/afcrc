import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import{fail} from '@sveltejs/kit';
import type { Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	// Get auth token
	const token = cookies.get('adm_access_token') || cookies.get('adm_access_token');

	// Redirect if not authenticated
	if (!token) {
		throw redirect(302, `${base}/login`);
	}

	// Reusable headers
	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};

	try {
		// Fetch testimonials API
		const testimonialsResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/testimonials/`, {
			method: 'GET',
			headers
		});

		// Handle testimonials fetch failure
		if (!testimonialsResponse.ok) {
			console.error('❌ Testimonials API Error:', testimonialsResponse.status, await testimonialsResponse.text());
			throw error(testimonialsResponse.status, 'Failed to load testimonials');
		}

		// Parse JSON
		const testimonialsData = await testimonialsResponse.json();
		console.log('testimonialsData is', testimonialsData);

		return {
			testimonials: testimonialsData.data ?? [],
			testimonialCount: testimonialsData.data?.length ?? 0,
			apiToken: token,
			error: null
		};
	} catch (err) {
		console.error('❌ Server Load Error:', err);
		throw error(500, 'Failed to load testimonials');
	}
};


export const actions = {
	deleteTestimonial: async ({  request, cookies }) => {
		const token = cookies.get('adm_access_token') || cookies.get('adm_access_token');

		if (!token) {
			throw redirect(302, `${base}/login`);
		}
		try {
			const formData = await request.formData();
			const testimonialId = formData.get('id');


			if (!testimonialId) {
				return fail(400, {
					success: false,
					message: 'Testimonial ID is required'
				});
			}

			// Make request to backend API with token
			const backendUrl = `${PUBLIC_API_BASE_URL}/api/testimonials/${testimonialId}/`;
			const response = await fetch(backendUrl, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Backend API Error:', response.status, errorText);
				return fail(response.status, {
					success: false,
					message: 'Failed to delete testimonial'
				});
			}

			return {
				success: true,
				message: 'Testimonial deleted successfully'
			};
		} catch (error) {
			console.error('[Server Action] Error:', error);
			return fail(500, {
				success: false,
				message: 'An error occurred while deleting the testimonial'
			});
		}
	}
};