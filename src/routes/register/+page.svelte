<script lang="ts">
	import { fade } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import Footer from '$lib/components/Footer.svelte';
	// import Topbar from '$lib/components/Topbar.svelte';
	import { base } from '$app/paths';

	let name = $state('');
	let email = $state('');
	let mobile = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let fieldErrors = $state<Record<string, string>>({});
	let showHints = $state(true);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false); // FIX: separate toggle for confirm password

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
	// FIX: separate toggle function for confirm password
	function toggleConfirmPasswordVisibility() {
		showConfirmPassword = !showConfirmPassword;
	}

	// Email validation helper
	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	let isProcessing = $state(false); // FIX: was plain `let`, not reactive

	// Password strength validation
	function isStrongPassword(pwd: string): { valid: boolean; message: string } {
		if (pwd.length < 8) {
			return { valid: false, message: 'Password must be at least 8 characters long' };
		}
		if (!/[A-Z]/.test(pwd)) {
			return { valid: false, message: 'Password must contain at least one uppercase letter' };
		}
		if (!/[a-z]/.test(pwd)) {
			return { valid: false, message: 'Password must contain at least one lowercase letter' };
		}
		if (!/[0-9]/.test(pwd)) {
			return { valid: false, message: 'Password must contain at least one number' };
		}
		return { valid: true, message: '' };
	}

	const validateForm = () => {
		fieldErrors = {};

		if (!name || !email || !password || !confirmPassword) {
			if (!name) fieldErrors.name = 'Full name is required';
			if (!email) fieldErrors.email = 'Email is required';
			if (!password) fieldErrors.password = 'Password is required';
			if (!confirmPassword) fieldErrors.confirmPassword = 'Password confirmation is required';
			return false;
		}

		if (!isValidEmail(email)) {
			fieldErrors.email = 'Please enter a valid email address';
		}

		const passwordCheck = isStrongPassword(password);
		if (!passwordCheck.valid) {
			fieldErrors.password = passwordCheck.message;
		}

		if (password !== confirmPassword) {
			fieldErrors.confirmPassword = 'Passwords do not match';
		}

		return Object.keys(fieldErrors).length === 0;
	};

	const handleEnhance = ({ formData, cancel }: any) => {
		errorMessage = '';
		fieldErrors = {};
		showHints = true;

		if (!validateForm()) {
			cancel();
			return;
		}

		isLoading = true;
		isProcessing = true; // FIX: actually set isProcessing

		return async ({ result }: any) => {
			isLoading = false;
			isProcessing = false; // FIX: reset isProcessing

			if (result.type === 'failure') {
				if (result.data?.errors) {
					const sanitizedErrors: Record<string, string> = {};
					const generalErrors: string[] = [];

					for (const [key, value] of Object.entries(result.data.errors)) {
						let errMsg = '';

						if (typeof value === 'string') {
							errMsg = value;
						} else if (Array.isArray(value) && value.length > 0) {
							errMsg = String(value[0]);
						}

						if (errMsg) {
							const cleanedValue = errMsg.replace(/<[^>]*>/g, '');

							if (key === 'server' || key === 'detail' || key === 'non_field_errors') {
								generalErrors.push(cleanedValue);
							} else {
								sanitizedErrors[key] = cleanedValue;
							}
						}
					}

					fieldErrors = sanitizedErrors;
					showHints = false;

					if (generalErrors.length > 0) {
						errorMessage = generalErrors.join(' ');
					} else if (Object.keys(sanitizedErrors).length > 0) {
						const fieldCount = Object.keys(sanitizedErrors).length;
						errorMessage =
							result.data?.message ||
							`Please fix ${fieldCount} error${fieldCount !== 1 ? 's' : ''} below`;
					} else {
						errorMessage = result.data?.message || 'Registration failed. Please try again.';
					}
				} else {
					errorMessage = result.data?.message || 'Registration failed. Please try again.';
				}
			} else if (result.type === 'redirect') {
				window.location.href = result.location;
			} else if (result.type === 'error') {
				errorMessage = result.error?.message || 'Something went wrong on the server';
			}
		};
	};
</script>

<!-- <Topbar /> -->

<div class="page">
	<!-- Left panel -->
	<div class="left-panel">
		<div class="pattern"></div>
		<div class="left-content">
			<h2 class="brand-name">Welcome</h2>
			<p class="brand-sub">Create your account to get started</p>
			<div class="divider"></div>

			<div class="join-section">
				<div class="join-divider"></div>
				<p class="join-heading">Why Join?</p>
				<ul class="join-perks">
					<li class="join-perk">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						Fast and easy setup
					</li>
					<li class="join-perk">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						Access exclusive features
					</li>
					<li class="join-perk">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						Join a growing community
					</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Right panel -->
	<div class="right-panel">
		<div class="form-box">
			<h1 class="form-title">Create Account</h1>
			<p class="form-sub">Sign up to get started</p>
			<div class="gold-line"></div>

			{#if errorMessage}
				<div class="error-box">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#d4a017"
						stroke-width="2"
						style="flex-shrink:0;margin-top:2px"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
					<span>{errorMessage || 'Something went wrong'}</span>
				</div>
			{/if}

			<form action="?/createUser" method="post" use:enhance={handleEnhance}>
				<!-- Name field -->
				<div class="field">
					<label for="name">Full Name</label>
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
							<circle cx="12" cy="8" r="4" />
							<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
						</svg>
						<input
							type="text"
							id="name"
							bind:value={name}
							name="name"
							placeholder="Enter your full name"
							required
							class:error={fieldErrors.name}
						/>
					</div>
					<!-- FIX: was class:error={fieldErrors.email} — wrong field -->
					{#if fieldErrors.name}
						<p class="field-error">{fieldErrors.name}</p>
					{/if}
				</div>

				<!-- Email field -->
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
							bind:value={email}
							name="email"
							placeholder="Enter your email"
							required
							class:error={fieldErrors.email}
						/>
					</div>
					{#if fieldErrors.email}
						<p class="field-error">{fieldErrors.email}</p>
					{/if}
				</div>

				<!-- Phone field -->
				<div class="field">
					<label for="mobile">Phone No</label>
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
							<path
								d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l1.62-1.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"
							/>
						</svg>
						<input
							type="tel"
							id="mobile"
							name="mobile"
							bind:value={mobile}
							placeholder="Enter your mobile number"
							class:error={fieldErrors.mobile}
						/>
					</div>
					{#if fieldErrors.mobile}
						<p class="field-error">{fieldErrors.mobile}</p>
					{/if}
				</div>

				<!-- Password field -->
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
							class:error={fieldErrors.password}
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
					{#if fieldErrors.password}
						<p class="field-error">{fieldErrors.password}</p>
					{/if}
				</div>

				<!-- Confirm Password field — FIX: was using wrong id, name, bind:value, and toggle -->
				<div class="field">
					<label for="confirmPassword">Confirm Password</label>
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
							<path d="M9 16l2 2 4-4" />
						</svg>
						<input
							id="confirmPassword"
							type={showConfirmPassword ? 'text' : 'password'}
							name="confirmPassword"
							bind:value={confirmPassword}
							placeholder="••••••••"
							disabled={isProcessing}
							required
							class:error={fieldErrors.confirmPassword}
						/>
						<button
							type="button"
							class="eye-btn"
							onclick={toggleConfirmPasswordVisibility}
							disabled={isProcessing}
							aria-label="Toggle confirm password visibility"
						>
							{#if showConfirmPassword}
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
					{#if fieldErrors.confirmPassword}
						<p class="field-error">{fieldErrors.confirmPassword}</p>
					{/if}
				</div>

				<div class="row">
					<label class="check-wrap">
						<input type="checkbox" />
						<span>I agree to the Terms &amp; Conditions</span>
					</label>
				</div>

				<!-- FIX: loading-spinner class now has proper spin animation -->
				<button type="submit" class="submit-btn" disabled={isLoading}>
					{#if isLoading}
						<span class="loading-spinner"></span>
						Creating account...
					{:else}
						Create Account
					{/if}
				</button>

				<!-- Divider -->
				<!-- <div class="or-divider">
					<span class="or-line"></span>
					<span class="or-text">or continue with</span>
					<span class="or-line"></span>
				</div> -->

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

				<p class="register-text">
					Already have an account? <a href="{base}/login" class="register-link">Sign in</a>
				</p>
			</form>
		</div>
	</div>
</div>

<Footer />

<style>
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
		background-size: cover;
		background-position: center;
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
		/* margin-bottom: 32px; */
		line-height: 1.5;
	}

	.divider {
		width: 48px;
		height: 2px;
		background: linear-gradient(90deg, #d4a017, #f5d78e);
		border-radius: 1px;
		margin: 0 auto 32px;
	}

	.join-section {
		width: 100%;
		text-align: center;
	}

	.join-divider {
		width: 100%;
		height: 1px;
		background: rgba(255, 255, 255, 0.1);
		margin-bottom: 24px;
	}

	.join-heading {
		font-size: 14px;
		font-weight: 600;
		color: #94a3b8;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		margin-bottom: 20px;
	}

	.join-perks {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
		margin: 0;
		padding: 0;
	}

	.join-perk {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 14px 20px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		font-size: 14px;
		color: #e2e8f0;
		font-weight: 500;
		backdrop-filter: blur(10px);
		transition:
			background 0.2s,
			border-color 0.2s;
	}

	.join-perk:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.join-perk svg {
		flex-shrink: 0;
		color: #d4a017;
	}

	/* ── Right panel ── */
	.right-panel {
		flex: 1;
		background: #f8fafc;
		display: flex;
		padding: 48px 40px;
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
		border-radius: 10px;
		padding: 12px 14px;
		margin-bottom: 20px;
		font-size: 13px;
		color: #f5d78e;
	}

	/* Field error messages */
	.field-error {
		font-size: 11px;
		color: #c0392b;
		margin-top: 5px;
		margin-left: 2px;
	}

	/* Fields */
	.field {
		margin-bottom: 18px;
	}

	.field label {
		display: block;
		font-size: 13px;
		font-weight: 600;
		color: #334155;
		letter-spacing: 0.2px;
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

	/* FIX: highlight error inputs */
	.input-wrap input.error {
		border-color: #c0392b;
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

	/* FIX: loading-spinner was defined but had no spin animation applied */
	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
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
		.join-section {
			display: none;
		}
		.right-panel {
			padding: 36px 24px;
			min-height: 100vh;
		}
	}
</style>
