import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAccessTokenFromCookieStore } from '$lib/utils/protected-route';

function normalizeAddressList(data: any): any[] {
	if (data?.data && Array.isArray(data.data)) return data.data;
	if (Array.isArray(data)) return data;
	return [];
}

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const authToken = getAccessTokenFromCookieStore(cookies);
	const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:9000';

	const headers: Record<string, string> = authToken
		? { Authorization: `Bearer ${authToken}` }
		: {};

	try {
		const [shippingRes, billingRes] = await Promise.all([
			fetch(`${API_BASE_URL}/api/myaccount/shippingaddress/`, { headers }).then((r) =>
				r.ok ? r.json() : null
			),
			fetch(`${API_BASE_URL}/api/myaccount/billingaddress/`, { headers }).then((r) =>
				r.ok ? r.json() : null
			)
		]);

		return {
			shippingAddresses: normalizeAddressList(shippingRes),
			billingAddresses: normalizeAddressList(billingRes)
		};
	} catch (error) {
		return {
			shippingAddresses: [],
			billingAddresses: []
		};
	}
};

export const actions: Actions = {
	createOrder: async ({ request, fetch, cookies }) => {
		const authToken = getAccessTokenFromCookieStore(cookies);
		if (!authToken) {
			return fail(401, { message: 'Not authenticated' });
		}

		const formData = await request.formData();

		const shippingAddressId = formData.get('shippingAddressId') as string;
		const billingAddressId = formData.get('billingAddressId') as string;
		const billingSameAsShipping = formData.get('billingSameAsShipping') === 'true';
		const paymentMethod = formData.get('paymentMethod') as string;
		const itemsJson = formData.get('items') as string;
		const cartId = formData.get('cartId') as string;
		const subtotal = formData.get('subtotal') as string;
		const shippingCost = formData.get('shipping') as string;
		const tax = formData.get('tax') as string;
		const discount = formData.get('discount') as string;
		const total = formData.get('total') as string;
		const promoCode = formData.get('promoCode') as string;
		const promoDiscountPercentage = formData.get('promoDiscountPercentage') as string;

		if (!shippingAddressId) {
			return fail(400, { message: 'Shipping address is required' });
		}
		if (!itemsJson) {
			return fail(400, { message: 'No items in the order' });
		}

		let items: any[];
		try {
			items = JSON.parse(itemsJson);
		} catch {
			return fail(400, { message: 'Invalid order items data' });
		}

		const orderItems = items.map((item: any) => ({
			product_id: item.id,
			name: item.name,
			quantity: item.quantity,
			price: item.price,
			image: item.image,
			size: item.size,
			color: item.color,
			subtotal: item.price * item.quantity
		}));

		const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:9000';

		const effectiveBillingAddressId = billingSameAsShipping
			? shippingAddressId
			: billingAddressId;

		const payload: Record<string, any> = {
			shipping_address: parseInt(shippingAddressId, 10),
			billing_address: parseInt(effectiveBillingAddressId, 10),
			items: orderItems,
			payment_method: paymentMethod,
			subtotal: parseFloat(subtotal),
			shipping: parseFloat(shippingCost),
			tax: parseFloat(tax),
			discount: parseFloat(discount),
			total: parseFloat(total)
		};

		if (cartId) {
			payload.cart_id = parseInt(cartId, 10);
		}
		if (promoCode) {
			payload.promo_code = promoCode;
			payload.promo_discount_percentage = parseFloat(promoDiscountPercentage);
		}

		try {
			const response = await fetch(`${API_BASE_URL}/api/checkout/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authToken}`
				},
				body: JSON.stringify(payload)
			});

			const result = await response.json();

			if (!response.ok) {
				return fail(response.status, {
					message: result.detail || result.message || 'Failed to place order'
				});
			}

			return {
				success: true,
				message: 'Order placed successfully',
				order: result.data || result
			};
		} catch (error) {
			return fail(500, {
				message: error instanceof Error ? error.message : 'An error occurred while placing the order'
			});
		}
	}
};
