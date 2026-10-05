<script lang="ts">
	import './header.css';
	import Button from './Button.svelte';

	interface Props {
		user?: { name: string };
		onLogin?: () => void;
		onLogout?: () => void;
		onCreateAccount?: () => void;
	}

	const { user, onLogin, onLogout, onCreateAccount }: Props = $props();

	let aboutOpen = $state(false);

	function toggleAbout(event: MouseEvent) {
		event.stopPropagation();
		aboutOpen = !aboutOpen;
	}

	function closeMenus() {
		aboutOpen = false;
	}
</script>

<svelte:window onclick={closeMenus} />

<header>
	<div class="storybook-header">
		<div>
			<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
				<g fill="none" fill-rule="evenodd">
					<path
						d="M10 0h12a10 10 0 0110 10v12a10 10 0 01-10 10H10A10 10 0 010 22V10A10 10 0 0110 0z"
						fill="#FFF"
					/>
					<path
						d="M5.3 10.6l10.4 6v11.1l-10.4-6v-11zm11.4-6.2l9.7 5.5-9.7 5.6V4.4z"
						fill="#555AB9"
					/>
					<path d="M27.2 10.6v11.2l-10.5 6V16.5l10.5-6zM15.7 4.4v11L6 10l9.7-5.5z" fill="#91BAF8" />
				</g>
			</svg>
			<h1>Acme</h1>
		</div>

		<nav class="storybook-nav" aria-label="Main navigation">
			<a class="nav-link" href="/">Home</a>

			<div class="has-submenu" class:open={aboutOpen}>
				<button
					type="button"
					class="nav-link submenu-toggle"
					aria-haspopup="true"
					aria-expanded={aboutOpen}
					onclick={toggleAbout}
				>
					About Us
					<svg
						class="chev"
						class:flip={aboutOpen}
						width="10"
						height="10"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>
				<div class="submenu" role="menu">
					<a href="/about/profile" role="menuitem" onclick={closeMenus}>Profile</a>
					<a href="/about/our-teams" role="menuitem" onclick={closeMenus}>Our Teams</a>
				</div>
			</div>

			<a class="nav-link" href="/contact">Contact</a>
		</nav>

		<div>
			{#if user}
				<span class="welcome">
					Welcome, <b>{user.name}</b>!
				</span>
				<Button size="small" onclick={onLogout} label="Log out" />
			{:else}
				<Button size="small" onclick={onLogin} label="Log in" />
				<Button primary size="small" onclick={onCreateAccount} label="Sign up" />
			{/if}
		</div>
	</div>
</header>

<style>
	.storybook-nav {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 8px 14px;
		border: none;
		background: transparent;
		font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
		font-size: 14px;
		font-weight: 600;
		color: #333;
		text-decoration: none;
		cursor: pointer;
		border-radius: 6px;
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}
	.nav-link:hover {
		background: rgba(85, 90, 185, 0.08);
		color: #555ab9;
	}

	.chev {
		transition: transform 0.25s ease;
	}
	.chev.flip {
		transform: rotate(180deg);
	}

	/* ---- Dropdown ---- */
	.has-submenu {
		position: relative;
	}
	.submenu {
		position: absolute;
		top: calc(100% + 8px);
		left: 50%;
		transform: translate(-50%, 8px);
		min-width: 180px;
		padding: 8px;
		background: #fff;
		border-radius: 10px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: 0 14px 34px -12px rgba(20, 20, 43, 0.22);
		display: flex;
		flex-direction: column;
		gap: 2px;
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition:
			opacity 0.22s ease,
			transform 0.22s ease,
			visibility 0.22s;
		z-index: 30;
	}
	.submenu::before {
		content: '';
		position: absolute;
		top: -6px;
		left: 50%;
		transform: translateX(-50%) rotate(45deg);
		width: 10px;
		height: 10px;
		background: #fff;
		border-left: 1px solid rgba(0, 0, 0, 0.08);
		border-top: 1px solid rgba(0, 0, 0, 0.08);
	}

	/* open on hover, keyboard focus, or click */
	.has-submenu:hover .submenu,
	.has-submenu:focus-within .submenu,
	.has-submenu.open .submenu {
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
		transform: translate(-50%, 0);
	}

	.submenu a {
		padding: 10px 14px;
		border-radius: 7px;
		font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
		font-size: 14px;
		font-weight: 600;
		color: #333;
		text-decoration: none;
		transition:
			background 0.18s ease,
			color 0.18s ease;
	}
	.submenu a:hover {
		background: rgba(85, 90, 185, 0.09);
		color: #555ab9;
	}
</style>
