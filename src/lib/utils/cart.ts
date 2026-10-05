import { cartStore, buildCartItemId } from '$lib/stores/cart';
import { get } from 'svelte/store';
import { isLoggedIn } from '$lib/stores/auth';

import type { CartItem } from '$lib/stores/cart';
import { showToast } from '$lib/stores/toast';
import { goto } from '$app/navigation';

export interface AddToCartOptions {
	quantity?: number;
	showNotification?: boolean;
	onSuccess?: (message: string) => void;
	onError?: (error: string) => void;
	/** Flat strings, e.g. "red" / "xl" — not arrays, not objects. */
	color?: string;
	size?: string;
}

/**
 * Fetch and sync cart from server.
 *
 * NOTE ON AUTH: the JWT lives in an HttpOnly cookie (`cust_access_token`),
 * which browser JS can never read. We call our own same-origin proxy
 * `/api/cart/` which reads the cookie server-side via SvelteKit's cookies
 * API and forwards the request to the backend with an Authorization header.
 */
export async function syncCartFromServer(callbacks?: {
	onSuccess?: (message: string) => void;
	onError?: (error: string) => void;
}): Promise<boolean> {
	try {
		const logged = get(isLoggedIn);
		if (!logged) {
			console.debug('[syncCartFromServer] skipped: not logged in');
			return false;
		}

		const url = `/api/cart/`;

		const res = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		console.debug('[syncCartFromServer] GET status:', res.status);

		if (!res.ok) {
			const err = await res.json().catch(() => null);
			console.debug('[syncCartFromServer] error payload:', err);
			callbacks?.onError?.(err?.error || err?.detail || `Server returned ${res.status}`);
			return false;
		}

		const data = await res.json().catch(() => null);
		console.debug('[syncCartFromServer] payload:', data);

		if (data && data.success && data.cart) {
			const items = data.cart.items || [];
			const serverCart = {
				items: items.map((item: any) => mapServerItem(item))
			};

			cartStore.syncFromServer(serverCart);
			callbacks?.onSuccess?.('Cart synced from server');
			return true;
		}

		return false;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Failed to sync cart';
		console.debug('[syncCartFromServer] threw:', error);
		callbacks?.onError?.(errorMsg);
		return false;
	}
}

/**
 * Maps a raw server cart-item payload to our local CartItem shape,
 * always deriving/attaching a cartItemId so lines with different
 * sizes/variations never collide.
 */
function mapServerItem(item: any): CartItem {
	const productId = item.product?.id || item.id;
	const color = item.color || undefined;
	const size = item.size || undefined;

	return {
		cartItemId:
			item.cart_item_id !== undefined && item.cart_item_id !== null
				? String(item.cart_item_id)
				: buildCartItemId(productId, color, size),
		cart_item_id: item.cart_item_id,
		id: productId,
		name: item.product?.name || 'Product',
		slug: item.product?.slug || '',
		seo_slug: item.product?.seo_slug || '',
		image: item.product?.image || item.product?.images?.[0]?.image || '',
		price: parseFloat(item.price ?? item.product?.sale_price ?? item.product?.regular_price ?? 0),
		quantity: item.quantity,
		sku: item.product?.sku,
		stock_status: item.product?.stock_status,
		max_quantity: item.product?.max_quantity,
		color,
		size
	};
}

/**
 * Add a product to cart with optional callbacks.
 * REQUIRES USER TO BE LOGGED IN.
 *
 * Behaviour (Daraz/Amazon style):
 * - Same product + same size + same colour  → quantity increments.
 * - Same product + different size/colour    → new, separate cart line.
 * - No size/colour at all                   → always one line per product.
 *
 * AUTH: calls our same-origin proxy `/api/cart/add/` which reads the
 * HttpOnly `cust_access_token` cookie server-side and forwards the
 * request to the backend with an Authorization header.
 */
export async function addToCart(
	product: {
		id: number;
		name: string;
		slug: string;
		seo_slug: string;
		featured_image?: string;
		image?: string;
		sale_price?: string | number | null;
		regular_price: string | number;
		sku?: string;
		stock_status?: string;
		max_quantity?: number;
	},
	options: AddToCartOptions = {}
): Promise<boolean> {
	const { quantity = 1, onSuccess, onError, color, size } = options;

	const cartItemId = buildCartItemId(product.id, color, size);

	if (!product || !product.id) {
		console.debug('[addToCart] rejected: invalid product', product);
		onError?.('Invalid product');
		return false;
	}

	if (quantity <= 0 || quantity > 99) {
		console.debug('[addToCart] rejected: invalid quantity', quantity);
		onError?.('Invalid quantity. Must be between 1 and 99.');
		return false;
	}

	if (product.stock_status === 'out_of_stock') {
		console.debug('[addToCart] rejected: out of stock');
		onError?.('This product is currently out of stock');
		return false;
	}

	try {
		const logged = get(isLoggedIn);
		if (!logged) {
			console.debug('[addToCart] rejected: not logged in');
			onError?.('Please log in to add items to cart');
			return false;
		}

		const url = `/api/cart/add/`;
		// Flat payload — matches the server's cart item shape (color/size as strings).
		const body: any = { product_id: product.id, quantity, color, size };

		console.debug('[addToCart] request body:', body);

		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		console.debug('[addToCart] server status:', res.status);

		if (!res.ok) {
			const err = await res.json().catch(() => null);
			console.debug('[addToCart] server error payload:', err);
			onError?.(err?.error || err?.detail || `Server returned ${res.status}`);
			return false;
		}

		const data = await res.json().catch(() => null);
		console.debug('[addToCart] server success payload:', data);

		if (data && data.success && data.cart) {
			const items = data.cart.items || [];
			const serverCart = { items: items.map((item: any) => mapServerItem(item)) };

			console.debug(
				'[addToCart] syncing server cart, lines:',
				serverCart.items.map((i) => ({
					cartItemId: i.cartItemId,
					productId: i.id,
					color: i.color,
					size: i.size,
					quantity: i.quantity
				}))
			);

			cartStore.syncFromServer(serverCart);
			onSuccess?.(`${product.name} added to cart!`);
			return true;
		}

		console.debug('[addToCart] no server cart in response — using local fallback');
		const result = cartStore.addItem(product, quantity, { color, size });
		console.debug('[addToCart] local fallback result:', result);

		if (result.success) {
			onSuccess?.(result.message);
			return true;
		} else {
			onError?.(result.message);
			return false;
		}
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Failed to add to cart';
		console.debug('[addToCart] threw:', error);
		onError?.(errorMsg);
		return false;
	}
}

/**
 * Remove a single cart LINE.
 * ⚠️ Pass `item.cartItemId`, not the product id — a product can now have
 * multiple lines (one per size/colour combination).
 */
export function removeFromCart(
	cartItemId: string,
	callbacks?: { onSuccess?: (message: string) => void; onError?: (error: string) => void }
): boolean {
	try {
		console.debug('[removeFromCart]', cartItemId);
		const result = cartStore.removeItem(cartItemId);
		if (result.success) callbacks?.onSuccess?.(result.message);
		else callbacks?.onError?.(result.message);
		return result.success;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Failed to remove from cart';
		callbacks?.onError?.(errorMsg);
		return false;
	}
}

/**
 * Update quantity for a single cart LINE.
 * ⚠️ Pass `item.cartItemId`, not the product id.
 */
export function updateCartQuantity(
	cartItemId: string,
	quantity: number,
	callbacks?: { onSuccess?: (message: string) => void; onError?: (error: string) => void }
): boolean {
	try {
		console.debug('[updateCartQuantity]', { cartItemId, quantity });
		const result = cartStore.updateQuantity(cartItemId, quantity);
		if (result.success) callbacks?.onSuccess?.(result.message);
		else callbacks?.onError?.(result.message);
		return result.success;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Failed to update quantity';
		callbacks?.onError?.(errorMsg);
		return false;
	}
}

/** ⚠️ Pass `item.cartItemId`, not the product id. */
export function incrementCartItem(
	cartItemId: string,
	callbacks?: { onSuccess?: (message: string) => void; onError?: (error: string) => void }
): boolean {
	try {
		const result = cartStore.incrementQuantity(cartItemId);
		if (result.success) callbacks?.onSuccess?.(result.message);
		else callbacks?.onError?.(result.message);
		return result.success;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Failed to increment quantity';
		callbacks?.onError?.(errorMsg);
		return false;
	}
}

/** ⚠️ Pass `item.cartItemId`, not the product id. */
export function decrementCartItem(
	cartItemId: string,
	callbacks?: { onSuccess?: (message: string) => void; onError?: (error: string) => void }
): boolean {
	try {
		const result = cartStore.decrementQuantity(cartItemId);
		if (result.success) callbacks?.onSuccess?.(result.message);
		else callbacks?.onError?.(result.message);
		return result.success;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Failed to decrement quantity';
		callbacks?.onError?.(errorMsg);
		return false;
	}
}

export function clearCart(
	skipConfirmation: boolean = false,
	callbacks?: {
		onSuccess?: (message: string) => void;
		onError?: (error: string) => void;
		onCancel?: () => void;
	}
): boolean {
	try {
		if (!skipConfirmation) {
			const confirmed = confirm('Are you sure you want to clear your cart?');
			if (!confirmed) {
				callbacks?.onCancel?.();
				return false;
			}
		}
		const result = cartStore.clear();
		if (result.success) callbacks?.onSuccess?.(result.message);
		else callbacks?.onError?.(result.message);
		return result.success;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Failed to clear cart';
		callbacks?.onError?.(errorMsg);
		return false;
	}
}

export function isInCart(productId: number): boolean {
	return cartStore.hasItem(productId);
}

export function getCartQuantity(productId: number): number {
	return cartStore.getItemQuantity(productId);
}

export function getCartItem(productId: number): CartItem | undefined {
	return cartStore.getItem(productId);
}

export function getCartItems(): CartItem[] {
	const cart = get(cartStore);
	return cart.items;
}

export function getCartCount(): number {
	const cart = get(cartStore);
	return cart.items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartTotal(): number {
	const cart = get(cartStore);
	return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function formatPrice(price: number, currency: string = 'Rs.'): string {
	return `${currency} ${price.toLocaleString('en-NP', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
}

export function validateCart(): { valid: boolean; message: string } {
	const cart = get(cartStore);

	if (cart.items.length === 0) {
		return { valid: false, message: 'Your cart is empty' };
	}

	for (const item of cart.items) {
		if (item.quantity <= 0) return { valid: false, message: `Invalid quantity for ${item.name}` };
		if (item.price <= 0) return { valid: false, message: `Invalid price for ${item.name}` };
		if (item.stock_status === 'out_of_stock')
			return { valid: false, message: `${item.name} is out of stock` };
	}

	return { valid: true, message: 'Cart is valid' };
}

/**
 * Common handler for Add to Cart buttons.
 *
 * FIX: previously forwarded `sizes`/`selectedVariations` — fields that
 * don't exist on `AddToCartOptions` — so `color`/`size` were always
 * `undefined` by the time they reached `addToCart`, no matter what the
 * user picked on the product page. Now forwards `color`/`size` directly.
 */
export async function handleAddToCart(
	product: {
		id: number;
		name: string;
		slug: string;
		seo_slug: string;
		featured_image?: string;
		image?: string;
		sale_price?: string | number | null;
		regular_price: string | number;
		sku?: string;
		stock_status?: string;
		max_quantity?: number;
	},
	quantity: number = 1,
	options: { color?: string; size?: string } = {}
): Promise<boolean> {
	const logged = get(isLoggedIn);
	if (!logged) {
		showToast('Please log in to add items to cart', 'error');
		if (typeof window !== 'undefined') {
			setTimeout(() => {
				goto('/login');
			}, 1000);
		}
		return false;
	}

	if (product.stock_status === 'out_of_stock') {
		showToast('This product is out of stock', 'error');
		return false;
	}

	try {
		const success = await addToCart(product, {
			quantity,
			color: options.color,
			size: options.size,
			onSuccess: () => showToast(`${product.name} added to cart`, 'success'),
			onError: (error) => showToast(error || 'Failed to add to cart', 'error')
		});
		return success;
	} catch (error) {
		showToast('Failed to add to cart', 'error');
		return false;
	}
}

/** ⚠️ Pass `item.cartItemId`, not the product id. */
export function handleRemoveFromCart(cartItemId: string, productName?: string): boolean {
	try {
		return removeFromCart(cartItemId, {
			onSuccess: (message) =>
				showToast(productName ? `${productName} removed from cart` : message, 'success'),
			onError: (error) => showToast(error || 'Failed to remove from cart', 'error')
		});
	} catch (error) {
		showToast('Failed to remove from cart', 'error');
		return false;
	}
}

/** ⚠️ Pass `item.cartItemId`, not the product id. */
export function handleUpdateQuantity(
	cartItemId: string,
	quantity: number,
	productName?: string
): boolean {
	try {
		return updateCartQuantity(cartItemId, quantity, {
			onSuccess: (message) =>
				showToast(productName ? `${productName} quantity updated` : message, 'success'),
			onError: (error) => showToast(error || 'Failed to update quantity', 'error')
		});
	} catch (error) {
		showToast('Failed to update quantity', 'error');
		return false;
	}
}