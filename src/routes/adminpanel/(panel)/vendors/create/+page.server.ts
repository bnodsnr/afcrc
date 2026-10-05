import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const actions: Actions = {
	default: async ({ request, fetch, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		try {
			const formData = await request.formData();
			const name = formData.get('name') as string;
			const email = formData.get('email') as string;
			const phone = formData.get('phone') as string;
			const address = formData.get('address') as string;
			const description = formData.get('description') as string;
			const isActive = formData.get('is_active') === 'on';

			if (!name || name.trim() === '') {
				return fail(400, { error: 'Vendor name is required', name, email, phone, address, description, isActive });
			}

			const payload = {
				name: name.trim(),
				email: email || '',
				phone: phone || '',
				address: address || '',
				description: description || '',
				is_active: isActive
			};

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/vendors/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(payload),
				credentials: 'include'
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('API Error Response:', errorText);
				try {
					const errorData = JSON.parse(errorText);
					return fail(response.status, {
						error: errorData.message || errorData.error || 'Failed to create vendor',
						details: errorData
					});
				} catch {
					return fail(response.status, { error: 'Failed to create vendor', details: errorText });
				}
			}

			const result = await response.json();
			return {
				success: true,
				message: 'Vendor created successfully',
				vendor: result
			};
		} catch (err: any) {
			return fail(500, {
				error: err instanceof Error ? err.message : 'An unexpected error occurred'
			});
		}
	}
};
