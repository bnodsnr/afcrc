import { fail, error , redirect} from '@sveltejs/kit';
import type { Actions } from './$types';
import { getAccessTokenFromCookieStore } from '$lib/utils/protected-route';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const load = async ({ fetch, cookies }) => {
	// const authToken = getAccessTokenFromCookieStore(cookies);

	const authToken = cookies.get('cust_access_token');
	if (!authToken) {
		throw redirect(302, '/login');
	}
	const headers = {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${authToken}`
	};

	const summaryRes = await fetch(`${PUBLIC_BASE_URL}/api/orders/summary/`, { method: 'GET', headers });
	let summaryData: any = null;
	if (summaryRes.ok) {
		summaryData = await summaryRes.json();
	} else {
		console.error('Failed to fetch order summary:', summaryRes.status, await summaryRes.text());
	}
	console.log('Summary Data:', summaryData);
	return { summary: summaryData };
};

// export const actions: Actions = {
// 	updateProfile: async ({ request, fetch, cookies }) => {
// 		const formData = await request.formData();
// 		const user_name = formData.get('user_name') as string;
// 		const date_of_birth = formData.get('date_of_birth') as string;
// 		const gender = formData.get('gender') as string;
// 		const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:9000';
// 		const authToken = getAccessTokenFromCookieStore(cookies);
// 		try {
// 			const response = await fetch(`${API_BASE_URL}/api/myaccount/profile/update/`, {
// 				method: 'PUT',
// 				headers: {
// 					'Content-Type': 'application/json',
// 					'Authorization': `Bearer ${authToken}`
// 				},
// 				body: JSON.stringify({
// 					user_name,
// 					date_of_birth,
// 					gender
// 				})
// 			});

// 			if (!response.ok) {
// 				const error = await response.json();
// 				return fail(response.status, {
// 					message: error.detail || 'Failed to update profile'
// 				});
// 			}

// 			const result = await response.json();
// 			return {
// 				success: true,
// 				message: 'Profile updated successfully',
// 				data: result
// 			};
// 		} catch (error) {
// 			return fail(500, {
// 				message: error instanceof Error ? error.message : 'An error occurred'
// 			});
// 		}
// 	},

// 	updateShippingAddress: async ({ request, fetch, cookies }) => {
// 		const formData = await request.formData();
// 		const full_name = formData.get('full_name') as string;
// 		const phone = formData.get('phone') as string;
// 		const email = formData.get('email') as string;
// 		const address_line1 = formData.get('address_line1') as string;
// 		const address_line2 = formData.get('address_line2') as string;
// 		const city = formData.get('city') as string;
// 		const state = formData.get('state') as string;
// 		const postal_code = formData.get('postal_code') as string;
// 		const country = formData.get('country') as string;
// 		const is_default = formData.get('is_default') === 'on';
// 		const address_type = 'shipping';
// 		const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:9000';
// 		const authToken = getAccessTokenFromCookieStore(cookies);
// 		try {
// 			const response = await fetch(`${API_BASE_URL}/api/myaccount/shippingaddress/create/`, {
// 				method: 'POST',
// 				headers: {
// 					'Content-Type': 'application/json',
// 					'Authorization': `Bearer ${authToken}`
// 				},
// 				body: JSON.stringify({
// 					full_name,
// 					phone,
// 					email,
// 					address_line1,
// 					address_line2,
// 					city,
// 					state,
// 					postal_code,
// 					country,
// 					address_type,
// 					is_default
// 				})
// 			});

// 			if (!response.ok) {
// 				const error = await response.json();
// 				return fail(response.status, {
// 					message: error.detail || 'Failed to update shipping address'
// 				});
// 			}

// 			const result = await response.json();
// 			return {
// 				success: true,
// 				message: 'Shipping address updated successfully',
// 				data: result
// 			};
// 		} catch (error) {
// 			return fail(500, {
// 				message: error instanceof Error ? error.message : 'An error occurred'
// 			});
// 		}
// 	},

// 	updateBillingAddress: async ({ request, fetch, cookies }) => {
// 		const formData = await request.formData();
// 		const full_name = formData.get('full_name') as string;
// 		const phone = formData.get('phone') as string;
// 		const email = formData.get('email') as string;
// 		const address_line1 = formData.get('address_line1') as string;
// 		const address_line2 = formData.get('address_line2') as string;
// 		const city = formData.get('city') as string;
// 		const state = formData.get('state') as string;
// 		const postal_code = formData.get('postal_code') as string;
// 		const country = formData.get('country') as string;
// 		const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:9000';
// 		const authToken = getAccessTokenFromCookieStore(cookies);
// 		try {
// 			const response = await fetch(`${API_BASE_URL}/api/myaccount/billingaddress/create/`, {
// 				method: 'POST',
// 				headers: {
// 					'Content-Type': 'application/json',
// 					'Authorization': `Bearer ${authToken}`
// 				},
// 				body: JSON.stringify({
// 					full_name,
// 					phone,
// 					email,
// 					address_line1,
// 					address_line2,
// 					city,
// 					state,
// 					postal_code,
// 					country
// 				})
// 			});

// 			if (!response.ok) {
// 				const error = await response.json();
// 				return fail(response.status, {
// 					message: error.detail || 'Failed to update billing address'
// 				});
// 			}

// 			const result = await response.json();
// 			return {
// 				success: true,
// 				message: 'Billing address updated successfully',
// 				data: result
// 			};
// 		} catch (error) {
// 			return fail(500, {
// 				message: error instanceof Error ? error.message : 'An error occurred'
// 			});
// 		}
// 	}
// };
