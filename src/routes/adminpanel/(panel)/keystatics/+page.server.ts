import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const load = async ({ cookies }) => {
	const token = cookies.get('adm_access_token') || '';
	if (!token) {
		throw redirect(303, `/adminpanel/login`);
	}
	try {
		const response = await fetch(`${PUBLIC_API_BASE_URL}/api/keystats/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});

		let keystats = [];
		if (response.ok) {
			const data = await response.json();
			keystats = data.data;
		}

		console.log("keystatis is",keystats);

		return { keystats, apiToken: token };
	} catch (error: any) {
		console.error('❌ Error loading keystats:', error?.message || error);
		return { keystats: [], apiToken: token };
	}
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) {
			throw redirect(303, `/adminpanel/login`);
		}
		try {
			const data = await request.formData();
			const slogan = (data.get('slogan') as string) ?? '';
			const title = (data.get('title') as string) ?? '';
			const countNumber = (data.get('count_number') as string) ?? '0';
			const status = data.get('status') === 'true';

			if (!title || !title.trim()) {
				return fail(400, { error: 'Title is required' });
			}

			const body = {
				title: title.trim(),
				slogan: slogan.trim(),
				count_number: parseInt(countNumber, 10) || 0,
				status
			};

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/keystats/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include',
				body: JSON.stringify(body)
			});

			const result = await response.json();

			if (!response.ok) {
				return fail(response.status, {
					error: result.message || result.errors || 'Failed to create key statistic'
				});
			}

			return {
				success: true,
				message: result.message || 'Key statistic created successfully',
				keystat: result.data
			};
		} catch (error: any) {
			console.error('Create keystat error:', error?.message || error);
			return fail(500, {
				error: 'An unexpected error occurred while creating the key statistic'
			});
		}
	},

	update: async ({ request, cookies, url }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) {
			throw redirect(303, `/adminpanel/login`);
		}
		try {
			const id = url.searchParams.get('id');
			if (!id) {
				return fail(400, { error: 'Key statistic ID is missing' });
			}

			const data = await request.formData();
			const slogan = (data.get('slogan') as string) ?? '';
			const title = (data.get('title') as string) ?? '';
			const countNumber = (data.get('count_number') as string) ?? '0';
			const status = data.get('status') === 'true';

			if (!title || !title.trim()) {
				return fail(400, { error: 'Title is required' });
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/keystats/${id}/`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include',
				body: JSON.stringify({
					title: title.trim(),
					slogan: slogan.trim(),
					count_number: parseInt(countNumber, 10) || 0,
					status
				})
			});

			const result = await response.json();

			if (!response.ok) {
				return fail(response.status, {
					error: result.message || result.errors || 'Failed to update key statistic'
				});
			}

			return {
				success: true,
				message: result.message || 'Key statistic updated successfully',
				keystat: result.data
			};
		} catch (error: any) {
			console.error('Update keystat error:', error?.message || error);
			return fail(500, {
				error: 'An unexpected error occurred while updating the key statistic'
			});
		}
	},

	delete: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) {
			throw redirect(303, `/adminpanel/login`);
		}
		try {
			const data = await request.formData();
			const id = data.get('id') as string;

			if (!id) {
				return fail(400, { error: 'Key statistic ID is required' });
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/keystats/${id}/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include'
			});

			if (!response.ok) {
				const result = await response.json().catch(() => ({}));
				return fail(response.status, {
					error: result.message || 'Failed to delete key statistic'
				});
			}

			return {
				success: true,
				message: 'Key statistic deleted successfully',
				id: parseInt(id, 10)
			};
		} catch (error: any) {
			console.error('Delete keystat error:', error?.message || error);
			return fail(500, {
				error: 'An unexpected error occurred while deleting the key statistic'
			});
		}
	},

	toggleStatus: async ({ request, cookies }) => {
		const token = cookies.get('adm_access_token') || '';
		if (!token) {
			throw redirect(303, `/adminpanel/login`);
		}
		try {
			const data = await request.formData();
			const id = data.get('id') as string;
			const status = data.get('status') === 'true';

			if (!id) {
				return fail(400, { error: 'Key statistic ID is required' });
			}

			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/keystats/${id}/`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include',
				body: JSON.stringify({ status: !status })
			});

			const result = await response.json();

			if (!response.ok) {
				return fail(response.status, {
					error: result.message || result.errors || 'Failed to update key statistic status'
				});
			}

			return {
				success: true,
				message: `Key statistic ${!status ? 'activated' : 'deactivated'} successfully`,
				keystat: result.data
			};
		} catch (error: any) {
			console.error('Toggle keystat status error:', error?.message || error);
			return fail(500, {
				error: 'An unexpected error occurred while updating status'
			});
		}
	}
};