import { writable, derived, get } from 'svelte/store';
import { isLoggedIn } from './auth';

export interface CartItem {
	/** Canonical id for this LINE. Prefer the server's cart_item_id once known;
	 *  falls back to a locally-computed key before the server has responded. */
	cartItemId: string;
	/** Server's own numeric line id, when available (matches payload's cart_item_id). */
	cart_item_id?: number;
	id: number; // product id — NOT unique across lines anymore
	name: string;
	slug: string;
	seo_slug: string;
	image: string;
	price: number;
	quantity: number;
	max_quantity?: number;
	sku?: string;
	stock_status?: string;
	/** Flat strings now, e.g. "red" / "xl" — not objects, not arrays. */
	color?: string;
	size?: string;
}

interface CartStore {
	items: CartItem[];
	lastUpdated: number;
}

const MAX_CART_ITEMS = 100;
const MAX_ITEM_QUANTITY = 99;

/**
 * Builds the local identity key for a cart line from product id + color + size.
 * - No color/size at all => key collapses to just the product id, so re-adding
 *   the same plain product always matches (qty increments).
 * - Same color+size => matches and increments.
 * - Different color or size => different key => separate line.
 *
 * This is only used before the server assigns a real cart_item_id (e.g. for
 * the optimistic local fallback); once synced from the server, cart_item_id
 * is used instead.
 */
export function buildCartItemId(
	productId: number,
	color?: string | null,
	size?: string | null
): string {
	const colorKey = color ? String(color).trim().toLowerCase() : '';
	const sizeKey = size ? String(size).trim().toLowerCase() : '';
	return `${productId}::${colorKey}::${sizeKey}`;
}

function initCart(): CartStore {
	return { items: [], lastUpdated: Date.now() };
}

function createCartStore() {
	const { subscribe, set, update } = writable<CartStore>(initCart());

	subscribe((cart) => {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent('cartUpdated', {
					detail: {
						count: cart.items.reduce((sum, item) => sum + item.quantity, 0),
						items: cart.items
					}
				})
			);
		}
	});

	return {
		subscribe,

		/**
		 * Add item to cart (local/optimistic path — the server path in
		 * utils/cart.ts is preferred when available).
		 * Matches an existing line only if product id + color + size are all
		 * identical -> increments quantity. Otherwise creates a new line.
		 */
		addItem: (
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
			options?: { color?: string; size?: string }
		): { success: boolean; message: string; cartItemId?: string } => {
			const color = options?.color;
			const size = options?.size;
			const cartItemId = buildCartItemId(product.id, color, size);

			let result: { success: boolean; message: string; cartItemId?: string } = {
				success: false,
				message: ''
			};

			console.debug('[cartStore.addItem] →', {
				productId: product.id,
				name: product.name,
				quantity,
				color,
				size,
				cartItemId,
				hasVariant: !!color || !!size
			});

			update((cart) => {
				if (quantity <= 0) {
					result.message = 'Quantity must be greater than 0';
					console.debug('[cartStore.addItem] rejected: invalid quantity', quantity);
					return cart;
				}

				if (quantity > MAX_ITEM_QUANTITY) {
					result.message = `Maximum quantity per item is ${MAX_ITEM_QUANTITY}`;
					console.debug('[cartStore.addItem] rejected: quantity exceeds max', quantity);
					return cart;
				}

				const price = product.sale_price
					? parseFloat(String(product.sale_price))
					: parseFloat(String(product.regular_price));

				if (isNaN(price) || price < 0) {
					result.message = 'Invalid product price';
					console.debug('[cartStore.addItem] rejected: invalid price', product);
					return cart;
				}

				const image = product.featured_image || product.image || '';
				const existingIndex = cart.items.findIndex((item) => item.cartItemId === cartItemId);

				if (existingIndex >= 0) {
					const existing = cart.items[existingIndex];
					const newQuantity = existing.quantity + quantity;
					const maxQty = product.max_quantity || MAX_ITEM_QUANTITY;

					console.debug('[cartStore.addItem] matching line found → incrementing', {
						cartItemId,
						currentQty: existing.quantity,
						addingQty: quantity,
						newQuantity,
						maxQty
					});

					if (newQuantity > maxQty) {
						result.message = `Cannot add more. Maximum quantity for this product is ${maxQty}`;
						console.debug('[cartStore.addItem] rejected: exceeds max quantity for this variant');
						return cart;
					}

					cart.items[existingIndex] = { ...existing, quantity: newQuantity };
					result.success = true;
					result.message = `Updated quantity to ${newQuantity}`;
					result.cartItemId = cartItemId;
				} else {
					if (cart.items.length >= MAX_CART_ITEMS) {
						result.message = `Cart is full. Maximum ${MAX_CART_ITEMS} items allowed`;
						console.debug('[cartStore.addItem] rejected: cart full');
						return cart;
					}

					console.debug('[cartStore.addItem] no matching line → creating new line', {
						cartItemId,
						reason: color || size ? 'different color/size combination' : 'first time adding this product'
					});

					cart.items.push({
						cartItemId,
						id: product.id,
						name: product.name,
						slug: product.slug,
						seo_slug: product.seo_slug,
						image,
						price,
						quantity,
						max_quantity: product.max_quantity,
						sku: product.sku,
						stock_status: product.stock_status,
						color,
						size
					});
					result.success = true;
					result.message =
						quantity === 1 ? 'Product added to cart' : `${quantity} items added to cart`;
					result.cartItemId = cartItemId;
				}

				cart.lastUpdated = Date.now();

				console.debug(
					'[cartStore.addItem] cart state after update:',
					cart.items.map((i) => ({
						cartItemId: i.cartItemId,
						productId: i.id,
						color: i.color,
						size: i.size,
						quantity: i.quantity
					}))
				);

				return cart;
			});

			return result;
		},

		/** Remove a single LINE (by cartItemId — which is the server's cart_item_id once synced). */
		removeItem: (cartItemId: string): { success: boolean; message: string } => {
			let found = false;
			update((cart) => {
				const initialLength = cart.items.length;
				cart.items = cart.items.filter((item) => item.cartItemId !== cartItemId);
				found = cart.items.length < initialLength;
				if (found) cart.lastUpdated = Date.now();
				console.debug('[cartStore.removeItem]', { cartItemId, found });
				return cart;
			});
			return {
				success: found,
				message: found ? 'Item removed from cart' : 'Item not found in cart'
			};
		},

		updateQuantity: (cartItemId: string, quantity: number): { success: boolean; message: string } => {
			let result = { success: false, message: '' };

			update((cart) => {
				const item = cart.items.find((item) => item.cartItemId === cartItemId);

				if (!item) {
					result.message = 'Item not found in cart';
					console.debug('[cartStore.updateQuantity] not found', cartItemId);
					return cart;
				}

				if (quantity <= 0) {
					cart.items = cart.items.filter((i) => i.cartItemId !== cartItemId);
					result.success = true;
					result.message = 'Item removed from cart';
				} else if (quantity > MAX_ITEM_QUANTITY) {
					result.message = `Maximum quantity is ${MAX_ITEM_QUANTITY}`;
					return cart;
				} else if (item.max_quantity && quantity > item.max_quantity) {
					result.message = `Maximum quantity for this product is ${item.max_quantity}`;
					return cart;
				} else {
					item.quantity = quantity;
					result.success = true;
					result.message = 'Quantity updated';
				}

				cart.lastUpdated = Date.now();
				console.debug('[cartStore.updateQuantity]', { cartItemId, quantity, result });
				return cart;
			});

			return result;
		},

		incrementQuantity: (cartItemId: string): { success: boolean; message: string } => {
			const cart = get(cartStore);
			const item = cart.items.find((item) => item.cartItemId === cartItemId);
			if (!item) return { success: false, message: 'Item not found' };
			return cartStore.updateQuantity(cartItemId, item.quantity + 1);
		},

		decrementQuantity: (cartItemId: string): { success: boolean; message: string } => {
			const cart = get(cartStore);
			const item = cart.items.find((item) => item.cartItemId === cartItemId);
			if (!item) return { success: false, message: 'Item not found' };
			return cartStore.updateQuantity(cartItemId, item.quantity - 1);
		},

		clear: (): { success: boolean; message: string } => {
			console.debug('[cartStore.clear] clearing cart');
			set({ items: [], lastUpdated: Date.now() });
			return { success: true, message: 'Cart cleared' };
		},

		/** True if ANY line for this product id exists (any color/size). */
		hasItem: (productId: number): boolean => {
			const cart = get(cartStore);
			return cart.items.some((item) => item.id === productId);
		},

		/** Total quantity of this product across ALL its color/size lines. */
		getItemQuantity: (productId: number): number => {
			const cart = get(cartStore);
			return cart.items
				.filter((item) => item.id === productId)
				.reduce((sum, item) => sum + item.quantity, 0);
		},

		getItem: (productId: number): CartItem | undefined => {
			const cart = get(cartStore);
			return cart.items.find((item) => item.id === productId);
		},

		getItemsByProductId: (productId: number): CartItem[] => {
			const cart = get(cartStore);
			return cart.items.filter((item) => item.id === productId);
		},

		/** Exact line lookup by cartItemId — what the product page should use. */
		getItemByCartItemId: (cartItemId: string): CartItem | undefined => {
			const cart = get(cartStore);
			return cart.items.find((item) => item.cartItemId === cartItemId);
		},

		/**
		 * Sync cart from the server payload shape:
		 * { items: [{ id, cart_item_id, product: {...}, price, quantity, subtotal, color, size }] }
		 */
		syncFromServer: (serverCart: any): void => {
			const items: CartItem[] = (serverCart.items || []).map((item: any) => {
				const productId = item.product?.id || item.id;
				const color = item.color || undefined;
				const size = item.size || undefined;
				return {
					// Prefer the server's own line id — it's the true source of truth.
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
					price: parseFloat(
						item.price ?? item.product?.sale_price ?? item.product?.regular_price ?? 0
					),
					quantity: item.quantity,
					sku: item.product?.sku,
					stock_status: item.product?.stock_status,
					max_quantity: item.product?.max_quantity,
					color,
					size
				};
			});

			console.debug(
				'[cartStore.syncFromServer] syncing',
				items.map((i) => ({
					cartItemId: i.cartItemId,
					productId: i.id,
					color: i.color,
					size: i.size,
					quantity: i.quantity
				}))
			);

			set({ items, lastUpdated: Date.now() });
		}
	};
}

export const cartStore = createCartStore();

// ---- Derived stores ----
export const cartCount = derived([cartStore, isLoggedIn], ([$cart, $isLoggedIn]) => {
	if (!$isLoggedIn) return 0;
	return $cart.items.reduce((total, item) => total + item.quantity, 0);
});

export const cartTotal = derived([cartStore, isLoggedIn], ([$cart, $isLoggedIn]) => {
	if (!$isLoggedIn) return 0;
	return $cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
});

export const cartItems = derived([cartStore, isLoggedIn], ([$cart, $isLoggedIn]) => {
	if (!$isLoggedIn) return [];
	return $cart.items;
});

export const cartItemCount = derived([cartStore, isLoggedIn], ([$cart, $isLoggedIn]) => {
	if (!$isLoggedIn) return 0;
	return $cart.items.length;
});

export function clearCart(): void {
	cartStore.clear();
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

export function getCartItemsByProductId(productId: number): CartItem[] {
	return cartStore.getItemsByProductId(productId);
}

export function getCartItemByCartItemId(cartItemId: string): CartItem | undefined {
	return cartStore.getItemByCartItemId(cartItemId);
}