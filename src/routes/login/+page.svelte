<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import Footer from '$lib/components/Footer.svelte';
	// import Topbar from '$lib/components/Topbar.svelte';
	import { setAuth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { PUBLIC_BASE_URL } from '$env/static/public';
	import { base } from '$app/paths';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let email = $state('');
	let password = $state('');
	let redirectTo = $state('/');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let isProcessing = false;
	let showPassword = $state(false);

	// When form action returns an error, show the message
	$effect(() => {
		if (form?.message && !form?.success) {
			errorMessage = form.message;
		}
	});

	onMount(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			redirectTo = params.get('redirectTo') || '/';
		}
	});

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	// Email validation helper
	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	/**
	 * Client-side form submit handler.
	 * Validates input, then lets use:enhance handle the actual submission.
	 * On success: stores user data in memory + sessionStorage, then redirects.
	 * On failure: shows error message.
	 */
	function handleEnhance() {
		isLoading = true;
		errorMessage = '';

		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			if (result.type === 'success') {
				// Cookies are already set by the server action.
				// Set auth state FIRST so beforeNavigate sees isLoggedIn=true
				if (result.data?.user) {
					setAuth({ user: result.data.user });
				} else {
					setAuth({});
				}
				// Then navigate
				const target = result.data?.redirectTo || redirectTo || '/';
				goto(target);
			} else if (result.type === 'failure') {
				errorMessage = result.data?.message || 'Login failed. Please try again.';
			} else {
				await update();
			}
			isLoading = false;
		};
	}

	/**
	 * Fallback: client-side login for environments where server actions
	 * are not available (e.g., static SPA deployment).
	 */
	async function handleClientLogin(event: Event) {
		event.preventDefault();
		isLoading = true;
		errorMessage = '';

		if (!email || !password) {
			errorMessage = 'Email and password are required';
			isLoading = false;
			return;
		}

		if (!isValidEmail(email)) {
			errorMessage = 'Please enter a valid email address';
			isLoading = false;
			return;
		}

		try {
			const res = await fetch(`${PUBLIC_BASE_URL}/api/customer/login/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ identifier: email, password })
			});

			const data = await res.json().catch(() => null);
			if (!res.ok) {
				errorMessage = data?.detail || data?.message || 'Invalid email or password';
				return;
			}

			const user = data?.user || null;
			setAuth({ user });
			goto(redirectTo || '/');
		} catch (error) {
			console.error(error);
			errorMessage = 'Unable to connect to server. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="page">
	<!-- Left panel -->
	<div class="left-panel">
		<div class="pattern"></div>
		<div class="left-content">
			<h2 class="brand-name">Welcome Back</h2>
			<p class="brand-sub">Nice to see you again</p>
			<div class="divider"></div>
			<p class="brand-excerpt">
				Sign in to access your account, track orders, and enjoy a personalized shopping experience.
			</p>
		</div>
	</div>

	<!-- Right panel -->
	<div class="right-panel">
		<div class="form-box">
			<h1 class="form-title">Welcome back</h1>
			<p class="form-sub">Sign in to your admin dashboard</p>
			<div class="gold-line"></div>

			{#if errorMessage}
				<div class="error-box">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#D4A017"
						stroke-width="2"
						style="flex-shrink:0;margin-top:2px"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
					<span>{errorMessage || 'Invalid email or password'}</span>
				</div>
			{/if}

			<form method="POST" action="?/login" use:enhance={handleEnhance}>
				<div class="field">
					<label for="email">Email Address</label>
					<div class="input-wrap">
						<svg
							class="input-icon"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
							></path>
							<polyline points="22,6 12,13 2,6"></polyline>
						</svg>
						<input
							type="text"
							id="email"
							name="identifier"
							bind:value={email}
							placeholder="Enter your email"
							required
						/>
					</div>
				</div>

				<div class="field">
					<label for="password">Password</label>
					<div class="input-wrap">
						<svg
							class="input-icon"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
							<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
						</svg>
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							name="password"
							bind:value={password}
							placeholder="••••••••"
							disabled={isProcessing}
							required
						/>
						<button
							type="button"
							class="eye-btn"
							onclick={togglePasswordVisibility}
							disabled={isProcessing}
							aria-label="Toggle password visibility"
						>
							{#if showPassword}
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
									/>
								</svg>
							{:else}
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
									<circle cx="12" cy="12" r="3"></circle>
								</svg>
							{/if}
						</button>
					</div>
				</div>
				<div class="row">
					<label class="check-wrap">
						<input type="checkbox" />
						<span>Remember me</span>
					</label>
					<a href="{base}/forgot-password" class="forgot-link">Forgot password?</a>
				</div>

				<button type="submit" class="submit-btn" disabled={isLoading}>
					{#if isLoading}
						<span class="loading-spinner"></span>
					{:else}
						Sign in
					{/if}
				</button>
				<!-- Divider -->
				<div class="or-divider">
					<span class="or-line"></span>
					<span class="or-text">or continue with</span>
					<span class="or-line"></span>
				</div>

				<!-- Social logins -->
				<!-- <div class="social-btns">
					<button type="button" class="social-btn google-btn">
						<svg width="18" height="18" viewBox="0 0 24 24">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Google
					</button>

					<button type="button" class="social-btn facebook-btn">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
							<path
								d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
							/>
						</svg>
						Facebook
					</button>
				</div> -->

				<!-- Register link -->
				<p class="register-text">
					Don't have an account?
					<a href="{base}/register" class="register-link">Create one</a>
				</p>
			</form>
		</div>
	</div>
</div>

<Footer />

<style>
	/* :global(body) {
		background: #0d0600;
	} */

	.page {
		display: flex;
		min-height: 100vh;
		padding: 40px;
	}

	/* ── Left panel ── */
	.left-panel {
		width: 540px;
		flex-shrink: 0;
		background: linear-gradient(135deg, #0b5d1e 0%, #0a4a18 50%, #1a0d00 100%);
		border-right: 1px solid #0a4a18;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48px 40px;
		position: relative;
		overflow: hidden;
	}

	.pattern {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 20% 20%, rgba(212, 160, 23, 0.18) 0%, transparent 50%),
			radial-gradient(circle at 80% 80%, rgba(11, 93, 30, 0.5) 0%, transparent 50%),
			radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
		pointer-events: none;
	}

	.left-content {
		width: 100%;
		position: relative;
		z-index: 1;
		text-align: center;
	}

	.brand-name {
		font-size: 32px;
		font-weight: 800;
		color: #f8fafc;
		letter-spacing: -0.5px;
		text-align: center;
		margin-bottom: 12px;
	}

	.brand-sub {
		font-size: 15px;
		color: #cbd5e1;
		letter-spacing: 0.3px;
		text-align: center;
		margin-bottom: 32px;
		line-height: 1.5;
	}

	.divider {
		width: 48px;
		height: 2px;
		background: linear-gradient(90deg, #d4a017, #f5d78e);
		border-radius: 1px;
		margin: 0 auto 32px;
	}

	.brand-excerpt {
		font-size: 14px;
		color: #94a3b8;
		line-height: 1.7;
		text-align: center;
		max-width: 320px;
		margin: 0 auto;
	}

	/* ── Right panel ── */
	.right-panel {
		flex: 1;
		background: #f8fafc;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.form-box {
		width: 100%;
		max-width: 380px;
	}

	.form-title {
		font-size: 28px;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 6px;
	}

	.form-sub {
		font-size: 14px;
		color: #64748b;
		margin-bottom: 8px;
	}

	.gold-line {
		width: 48px;
		height: 2px;
		background: linear-gradient(90deg, #d4a017, #f5d78e);
		border-radius: 1px;
		margin-bottom: 28px;
	}

	/* Error box */
	.error-box {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		background: #2d0f00;
		border: 1px solid rgba(212, 160, 23, 0.2);
		border-radius: 8px;
		padding: 12px 14px;
		margin-bottom: 20px;
		font-size: 13px;
		color: #f5d78e;
	}

	/* Fields */
	.field {
		margin-bottom: 18px;
	}

	.field label {
		display: block;
		font-size: 11px;
		font-weight: 700;
		color: #161616;
		letter-spacing: 0.8px;
		text-transform: uppercase;
		margin-bottom: 8px;
	}

	.input-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 14px;
		color: #94a3b8;
		pointer-events: none;
	}

	.input-wrap input {
		width: 100%;
		background: #ffffff;
		border: 1.5px solid #e2e8f0;
		border-radius: 10px;
		padding: 13px 14px 13px 42px;
		font-size: 14px;
		color: #0f172a;
		outline: none;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
		font-family: inherit;
	}

	.input-wrap input::placeholder {
		color: #94a3b8;
	}

	.input-wrap input:focus {
		border-color: #d4a017;
		box-shadow: 0 0 0 3px rgba(212, 160, 23, 0.12);
	}

	.input-wrap input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.eye-btn {
		position: absolute;
		right: 12px;
		background: none;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		padding: 4px;
		display: flex;
		transition: color 0.2s ease;
	}

	.eye-btn:hover {
		color: #d4a017;
	}

	/* Row */
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;
	}

	.check-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.check-wrap input {
		accent-color: #0b5d1e;
	}

	.check-wrap span {
		font-size: 13px;
		color: #334155;
	}

	.forgot-link {
		font-size: 13px;
		color: #0b5d1e;
		text-decoration: none;
		font-weight: 600;
		transition: color 0.2s ease;
	}

	.forgot-link:hover {
		color: #d4a017;
	}

	/* Submit */
	.submit-btn {
		width: 100%;
		padding: 14px;
		background: linear-gradient(135deg, #0b5d1e 0%, #0a4a18 100%);
		color: #fff;
		border: none;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.3px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition:
			transform 0.15s ease,
			box-shadow 0.2s ease;
		font-family: inherit;
	}

	.submit-btn:hover:not(:disabled) {
		box-shadow: 0 4px 16px rgba(11, 93, 30, 0.35);
		transform: translateY(-1px);
	}

	.submit-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.submit-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.or-divider {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 20px 0;
	}

	.or-line {
		flex: 1;
		height: 1px;
		background: #e2e8f0;
	}

	.or-text {
		font-size: 11px;
		color: #94a3b8;
		font-weight: 500;
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.social-btns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-bottom: 20px;
	}

	.social-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 11px 14px;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.2s,
			border-color 0.2s;
		font-family: inherit;
	}

	.google-btn {
		background: #ffffff;
		border: 1.5px solid #e2e8f0;
		color: #334155;
	}

	.google-btn:hover {
		background: #f8fafc;
		border-color: #cbd5e1;
	}

	.facebook-btn {
		background: #1877f2;
		border: 1.5px solid #1877f2;
		color: #fff;
	}

	.facebook-btn:hover {
		background: #166fe5;
	}

	.register-text {
		text-align: center;
		font-size: 13px;
		color: #94a3b8;
		margin-top: 4px;
	}

	.register-link {
		color: #0b5d1e;
		font-weight: 700;
		text-decoration: none;
		transition: color 0.2s;
	}

	.register-link:hover {
		color: #d4a017;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page {
			flex-direction: column;
			padding: 0;
		}
		.left-panel {
			width: 100%;
			padding: 48px 24px;
			border-right: none;
			border-bottom: none;
		}
		.left-content {
			padding: 0;
		}
		.brand-name {
			font-size: 26px;
		}
		.right-panel {
			padding: 36px 24px;
			min-height: 100vh;
		}
	}
</style>
