<script lang="ts">
	import { House, ShoppingBag, LayoutGrid, ShoppingCart, User } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { cartCount } from '$lib/stores/cart';
	import { categoriesDrawerOpen } from '$lib/stores/categoriesDrawer';

	const pathname = $derived($page.url.pathname);

	function isActive(path: string): boolean {
		if (path === base || path === `${base}/`) {
			return pathname === base || pathname === `${base}/` || pathname === '/';
		}
		return pathname === path || pathname.startsWith(`${path}/`);
	}

	const count = $derived($cartCount);
	const displayCount = $derived(count > 99 ? '99+' : count);
	const showBadge = $derived($cartCount > 0);

	const iconSize = 22;
	const inactive = 'text-zinc-400';
	const active = 'text-brand-green';
	const baseItem =
		'relative flex flex-1 flex-col items-center justify-center gap-1 pb-2 pt-2 text-[10px] font-medium transition-colors duration-200 no-underline';
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-charcoal/95 backdrop-blur-lg lg:hidden"
	aria-label="Mobile navigation"
>
	<div class="flex items-stretch" style="padding-bottom: env(safe-area-inset-bottom, 0)">
		<a href={base} class="{baseItem} {isActive(base) ? active : inactive}" aria-label="Home">
			<House size={iconSize} stroke-width={isActive(base) ? 2.4 : 2} />
			<span class={isActive(base) ? 'font-semibold text-brand-green' : ''}>Home</span>
		</a>

		<a
			href="{base}/shop"
			class="{baseItem} {isActive(`${base}/shop`) ? active : inactive}"
			aria-label="Shop"
		>
			<ShoppingBag size={iconSize} stroke-width={isActive(`${base}/shop`) ? 2.4 : 2} />
			<span class={isActive(`${base}/shop`) ? 'font-semibold text-brand-green' : ''}>Shop</span>
		</a>

		<button
			type="button"
			onclick={() => categoriesDrawerOpen.set(true)}
			class="relative flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-2 text-[10px] font-medium text-zinc-400 no-underline transition-colors duration-200"
			aria-label="Categories"
		>
			<div
				class="flex h-12 w-12 -translate-y-4 items-center justify-center rounded-full bg-brand-green text-white shadow-lg ring-4 shadow-brand-green/40 ring-charcoal transition-transform duration-200 hover:scale-105"
			>
				<LayoutGrid size={24} stroke-width={2} />
			</div>
			<span class="relative -mt-2">Products</span>
		</button>

		<a
			href="{base}/cart"
			class="{baseItem} {isActive(`${base}/cart`) ? active : inactive}"
			aria-label="Cart"
		>
			<div class="relative">
				<ShoppingCart size={iconSize} stroke-width={isActive(`${base}/cart`) ? 2.4 : 2} />
				{#if showBadge}
					<span
						class="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] leading-none font-bold text-white"
					>
						{displayCount}
					</span>
				{/if}
			</div>
			<span class={isActive(`${base}/cart`) ? 'font-semibold text-brand-green' : ''}>Cart</span>
		</a>

		<a
			href="{base}/login"
			class="{baseItem} {isActive(`${base}/login`) ? active : inactive}"
			aria-label="Account"
		>
			<User size={iconSize} stroke-width={isActive(`${base}/login`) ? 2.4 : 2} />
			<span class={isActive(`${base}/login`) ? 'font-semibold text-brand-green' : ''}>Account</span>
		</a>
	</div>
</nav>
