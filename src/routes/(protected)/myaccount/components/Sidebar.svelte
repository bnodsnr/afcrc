<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { logout } from '$lib/stores/auth';

	let { userProfile = null, onClose = () => {} } = $props();
	let isLoggingOut = $state(false);

	const navItems = [
		{
			id: 'dashboard',
			label: 'Dashboard',
			href: `${base}/myaccount`,
			icon: `<path d="M3 13h2v8H3zm4-4h2v12H7zm4-6h2v18h-2zm4 2h2v16h-2zm4-1h2v17h-2z" stroke-linecap="round" stroke-linejoin="round"/>`,
			exact: true
		},
		{
			id: 'orders',
			label: 'Order History',
			href: `${base}/myaccount/orders`,
			icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`
		},
		{
			id: 'returns',
			label: 'Return & Cancellation',
			href: `${base}/myaccount/returns`,
			icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>`
		},
		{
			id: 'profile',
			label: 'Profile',
			href: `${base}/myaccount/profile`,
			icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>`
		},
		{
			id: 'addresses',
			label: 'Addresses',
			href: `${base}/myaccount/addresses`,
			icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>`
		}
	];

	function isActive(href: string, exact?: boolean) {
		if (exact) {
			return $page.url.pathname === href;
		}
		return $page.url.pathname.startsWith(href);
	}

	async function handleLogout() {
		if (isLoggingOut) return;
		isLoggingOut = true;
		try {
			await logout();
			window.location.href = `${base}/`;
		} catch (e) {
			console.error('Logout error', e);
		} finally {
			isLoggingOut = false;
		}
	}
</script>

<aside class="sidebar">
	<!-- Profile Section -->
	<div class="profile-section">
		<div class="avatar-ring">
			<div class="avatar">
				{#if userProfile?.avatar}
					<img src={userProfile.avatar} alt="avatar" />
				{:else}
					<span class="avatar-initial">
						{userProfile?.user_name?.charAt(0).toUpperCase() || 'U'}
					</span>
				{/if}
			</div>
			<div class="online-dot"></div>
		</div>
		<div class="profile-info">
			<h3 class="profile-name">{userProfile?.user_name || 'User'}</h3>
			<p class="profile-email">{userProfile?.user_email || ''}</p>
		</div>
	</div>

	<!-- Navigation -->
	<nav class="sidebar-nav">
		{#each navItems as item}
			<a
				href={item.href}
				class="nav-item"
				class:active={isActive(item.href, item.exact)}
				aria-current={isActive(item.href, item.exact) ? 'page' : undefined}
			>
				<span class="nav-indicator"></span>
				<svg
					class="nav-icon"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.8"
					stroke="currentColor"
					width="20"
					height="20"
				>
					{@html item.icon}
				</svg>
				<span class="nav-label">{item.label}</span>
			</a>
		{/each}
	</nav>

	<!-- Logout -->
	<div class="sidebar-footer">
		<button class="logout-btn" onclick={handleLogout} disabled={isLoggingOut}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.8"
				stroke="currentColor"
				width="18"
				height="18"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
				/>
			</svg>
			<span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
		</button>
	</div>
</aside>

<style>
	.sidebar {
		width: 260px;
		min-height: calc(100vh - 120px);
		background: #ffffff;
		border-radius: 16px;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.04),
			0 4px 24px rgba(0, 0, 0, 0.06);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: sticky;
		top: 110px;
		align-self: flex-start;
		border: 1px solid rgba(0, 0, 0, 0.04);
	}

	/* ===== Profile Section ===== */
	.profile-section {
		padding: 28px 24px 20px;
		text-align: center;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		background: linear-gradient(135deg, rgba(11, 93, 30, 0.03), rgba(212, 160, 23, 0.03));
	}

	.avatar-ring {
		position: relative;
		display: inline-block;
	}

	.avatar {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: linear-gradient(135deg, #0b5d1e, #16a34a);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 4px 16px rgba(11, 93, 30, 0.25),
			0 0 0 4px rgba(255, 255, 255, 0.9);
		overflow: hidden;
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-initial {
		font-size: 26px;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.5px;
	}

	.online-dot {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 14px;
		height: 14px;
		background: #22c55e;
		border-radius: 50%;
		border: 3px solid #ffffff;
		box-shadow: 0 2px 6px rgba(34, 197, 94, 0.4);
	}

	.profile-info {
		margin-top: 14px;
	}

	.profile-name {
		font-size: 15px;
		font-weight: 700;
		color: #111827;
		margin: 0;
		line-height: 1.3;
	}

	.profile-email {
		font-size: 12px;
		color: #6b7280;
		margin: 4px 0 0;
		word-break: break-all;
		line-height: 1.4;
	}

	/* ===== Navigation ===== */
	.sidebar-nav {
		flex: 1;
		padding: 12px 10px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 11px 14px;
		border-radius: 10px;
		text-decoration: none;
		color: #6b7280;
		font-size: 13.5px;
		font-weight: 500;
		position: relative;
		transition: all 0.2s ease;
		overflow: hidden;
	}

	.nav-indicator {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%) scaleY(0);
		width: 3px;
		height: 20px;
		background: #0b5d1e;
		border-radius: 0 4px 4px 0;
		transition: transform 0.2s ease;
	}

	.nav-item:hover {
		background: rgba(11, 93, 30, 0.06);
		color: #111827;
	}

	.nav-item:hover .nav-indicator {
		transform: translateY(-50%) scaleY(1);
	}

	.nav-item.active {
		background: rgba(11, 93, 30, 0.1);
		color: #0b5d1e;
		font-weight: 600;
	}

	.nav-item.active .nav-indicator {
		transform: translateY(-50%) scaleY(1);
		background: #0b5d1e;
	}

	.nav-item.active .nav-icon {
		color: #0b5d1e;
	}

	.nav-icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
		transition: color 0.2s ease;
	}

	.nav-label {
		white-space: nowrap;
	}

	/* ===== Footer / Logout ===== */
	.sidebar-footer {
		padding: 12px 10px 16px;
		border-top: 1px solid rgba(0, 0, 0, 0.05);
	}

	.logout-btn {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 11px 14px;
		border: none;
		border-radius: 10px;
		background: transparent;
		color: #6b7280;
		font-size: 13.5px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.logout-btn:hover {
		background: rgba(239, 68, 68, 0.08);
		color: #dc2626;
	}

	.logout-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ===== Responsive ===== */
	@media (max-width: 768px) {
		.sidebar {
			width: 100%;
			min-height: auto;
			border-radius: 0;
			position: static;
			box-shadow: none;
			border: none;
			border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		}

		.sidebar-nav {
			flex-direction: row;
			overflow-x: auto;
			gap: 4px;
			padding: 8px 16px;
			-webkit-overflow-scrolling: touch;
		}

		.nav-item {
			flex-shrink: 0;
			padding: 8px 14px;
			font-size: 12.5px;
			gap: 6px;
		}

		.nav-indicator {
			display: none;
		}

		.profile-section {
			display: flex;
			align-items: center;
			gap: 14px;
			padding: 16px 20px;
			text-align: left;
		}

		.avatar-ring {
			flex-shrink: 0;
		}

		.avatar {
			width: 48px;
			height: 48px;
		}

		.avatar-initial {
			font-size: 18px;
		}

		.online-dot {
			width: 10px;
			height: 10px;
			border-width: 2px;
		}

		.profile-name {
			font-size: 14px;
		}

		.profile-email {
			font-size: 11px;
		}

		.sidebar-footer {
			display: none;
		}
	}
</style>
