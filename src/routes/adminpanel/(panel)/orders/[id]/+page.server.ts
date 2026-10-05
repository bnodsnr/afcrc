import type {Actions, PageServerLoad} from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch, params, cookies }) => {
  const { id } = params;
  const token = cookies.get('adm_access_token');

  const res = await fetch(`${PUBLIC_API_BASE_URL}/api/orders/admin/details/${id}/`, {
    headers: { Authorization: `Bearer ${token}` }
  });

    if (!res.ok) {
        return fail(res.status, { error: 'Failed to fetch order details' });
    }
    
    const json = await res.json();
    return {
        orderDetails: json
    };
};

export const actions: Actions = {
    updateStatus: async ({ request, fetch, params, cookies }) => {
        const { id } = params;
        const token = cookies.get('adm_access_token');
        const formData = await request.formData();
        const newStatus = formData.get('status');

        const res = await fetch(`${PUBLIC_API_BASE_URL}/api/orders/admin/update-status/${id}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!res.ok) {
            return fail(res.status, { error: 'Failed to update order status' });
        }
    const result = await res.json();
    console.log('Status update response:', result);
        return {
          success: true,
          message: 'Order status updated successfully',
          status: newStatus
        }

        throw redirect(303, `/orders/${id}`);
    }
};