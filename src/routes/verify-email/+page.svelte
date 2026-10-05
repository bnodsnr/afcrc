<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Footer from '$lib/components/Footer.svelte';
	// import Topbar from '$lib/components/Topbar.svelte';
	import { setAuth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	let { form }: { form: any } = $props();

	let email = $state('');
	let otp = $state('');
	let otpDigits = $state(['', '', '', '', '', '']);
	const otpRefs: HTMLInputElement[] = [];
	let activeIndex = $state(-1);
	let isLoading = $state(false);
	let isResending = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let resendCooldown = $state(0);

	onMount(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			email = params.get('email') || '';
		}
	});

	$effect(() => {
		if (form?.message && !form?.success) {
			errorMessage = form.message;
			successMessage = '';
		}
		if (form?.success && form?.message) {
			successMessage = form.message;
			errorMessage = '';
		}
		if (form?.success && form?.user) {
			setAuth({ user: form.user });
			setTimeout(() => goto('/'), 1500);
		}
	});

	function handleVerify() {
		if (!email || !otp) {
			errorMessage = 'Please enter your email and OTP';
			return;
		}
		if (!/^\d{6}$/.test(otp)) {
			errorMessage = 'OTP must be a 6-digit number';
			return;
		}
		isLoading = true;
		errorMessage = '';
	}

	function handleResend() {
		if (resendCooldown > 0) return;
		if (!email) {
			errorMessage = 'Please enter your email first';
			return;
		}
		isResending = true;
		errorMessage = '';
		successMessage = '';
	}

	function onOtpInput(e: Event, index: number) {
		const target = e.target as HTMLInputElement;
		const val = target.value.replace(/\D/g, '');
		otpDigits[index] = val.slice(0, 1);
		otp = otpDigits.join('');
		if (val && index < 5) {
			otpRefs[index + 1]?.focus();
		}
	}

	function handleOtpKeydown(e: KeyboardEvent, index: number) {
		const target = e.target as HTMLInputElement;
		if (e.key === 'Backspace' && !target.value && index > 0) {
			otpDigits[index] = '';
			otpDigits[index - 1] = '';
			otp = otpDigits.join('');
			otpRefs[index - 1]?.focus();
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			const formEl = document.querySelector('form[action="?/verifyOtp"]') as HTMLFormElement;
			if (formEl) formEl.requestSubmit();
		}
	}

	function handleOtpPaste(e: ClipboardEvent) {
		const data = e.clipboardData?.getData('text') || '';
		const digits = data.replace(/\D/g, '').slice(0, 6).split('');
		digits.forEach((d, i) => {
			otpDigits[i] = d;
		});
		otp = otpDigits.join('');
		const focusIndex = Math.min(digits.length, 5);
		otpRefs[focusIndex]?.focus();
		e.preventDefault();
	}

	function onOtpFocus(index: number) {
		activeIndex = index;
	}

	function onOtpBlur() {
		activeIndex = -1;
	}
</script>

<!-- <Topbar /> -->

<div class="page">
	<!-- Left panel -->
	<div class="left-panel">
		<div class="pattern"></div>
		<div class="left-content">
			<h2 class="brand-name">Verify Your Email</h2>
			<p class="brand-sub">One more step to activate your account</p>
			<div class="divider"></div>
			<p class="brand-excerpt">
				We've sent a 6-digit verification code to your email address. Enter it below to complete
				your registration.
			</p>
		</div>
	</div>

	<!-- Right panel -->
	<div class="right-panel">
		<div class="form-box">
			<h1 class="form-title">Email Verification</h1>
			<p class="form-sub">Enter the OTP sent to your email</p>
			<div class="gold-line"></div>

			{#if errorMessage}
				<div class="error-box">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#b91c1c"
						stroke-width="2"
						style="flex-shrink:0;margin-top:2px"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
					<span>{errorMessage}</span>
				</div>
			{/if}

			{#if successMessage}
				<div class="success-box">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#16a34a"
						stroke-width="2"
						style="flex-shrink:0;margin-top:2px"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<polyline points="16 8 10.5 14 8 11.5"></polyline>
					</svg>
					<span>{successMessage}</span>
				</div>
			{/if}

			<!-- Verify OTP Form -->
			<form
				action="?/verifyOtp"
				method="post"
				use:enhance={() => {
					handleVerify();
					return async ({ result }) => {
						isLoading = false;
						if (result.type === 'failure') {
							errorMessage = result.data?.message || 'Verification failed';
							successMessage = '';
						} else if (result.type === 'success') {
							if (result.data?.user) {
								setAuth({ user: result.data.user });
								setTimeout(() => goto('/'), 1500);
							}
							successMessage = result.data?.message || 'Verified!';
							errorMessage = '';
						}
					};
				}}
			>
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
							type="email"
							id="email"
							name="email"
							bind:value={email}
							placeholder="Enter your email"
							required
							disabled={isLoading}
						/>
					</div>
				</div>

				<!-- OTP field -->
				<div class="field">
					<label>Verification Code</label>
					<div class="otp-input-wrap" onpaste={handleOtpPaste}>
						{#each otpDigits as digit, i}
							<input
								type="text"
								inputmode="numeric"
								pattern="[0-9]*"
								autocomplete="one-time-code"
								maxlength="1"
								value={digit}
								oninput={(e) => onOtpInput(e, i)}
								onkeydown={(e) => handleOtpKeydown(e, i)}
								onfocus={() => onOtpFocus(i)}
								onblur={onOtpBlur}
								disabled={isLoading}
								required
								bind:this={otpRefs[i]}
								class="otp-digit {digit ? 'filled' : ''} {activeIndex === i ? 'active' : ''}"
							/>
						{/each}
					</div>
					<p class="field-hint">Enter the 6-digit code sent to your email</p>
				</div>
				<input type="hidden" name="otp" value={otp} />

				<button type="submit" class="submit-btn" disabled={isLoading || !email || !otp}>
					{#if isLoading}
						<span class="loading-spinner"></span>
						Verifying...
					{:else}
						Verify Email
					{/if}
				</button>
			</form>

			<!-- Resend OTP Form -->
			<form
				action="?/resendOtp"
				method="post"
				use:enhance={() => {
					handleResend();
					return async ({ result }) => {
						isResending = false;
						if (result.type === 'failure') {
							errorMessage = result.data?.message || 'Failed to resend OTP';
							successMessage = '';
						} else if (result.type === 'success') {
							successMessage = result.data?.message || 'OTP resent!';
							errorMessage = '';
							resendCooldown = 60;
							const interval = setInterval(() => {
								resendCooldown--;
								if (resendCooldown <= 0) clearInterval(interval);
							}, 1000);
						}
					};
				}}
			>
				<input type="hidden" name="email" value={email} />
				<div class="resend-section">
					{#if resendCooldown > 0}
						<p class="resend-text">Resend OTP in {resendCooldown}s</p>
					{:else}
						<button type="submit" class="resend-btn" disabled={isResending || !email}>
							{#if isResending}
								<span class="loading-spinner-small"></span>
								Resending...
							{:else}
								Didn't receive the code? <span class="resend-link">Resend OTP</span>
							{/if}
						</button>
					{/if}
				</div>
			</form>

			<p class="login-text">
				Already verified? <a href="{base}/login" class="login-link">Sign in</a>
			</p>
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

	/* Left panel */
	.left-panel {
		width: 540px;
		flex-shrink: 0;
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%);
		border-right: 1px solid #0f172a;
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
			radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
			radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 70%);
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
		background: linear-gradient(90deg, #6366f1, #8b5cf6);
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

	/* Right panel */
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
		background: linear-gradient(90deg, #6366f1, #8b5cf6);
		border-radius: 1px;
		margin-bottom: 28px;
	}

	/* Error box */
	.error-box {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 10px;
		padding: 12px 14px;
		margin-bottom: 20px;
		font-size: 13px;
		color: #b91c1c;
	}

	/* Success box */
	.success-box {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 10px;
		padding: 12px 14px;
		margin-bottom: 20px;
		font-size: 13px;
		color: #16a34a;
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
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	.input-wrap input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* OTP Input */
	.otp-input-wrap {
		display: flex;
		gap: 10px;
		justify-content: center;
	}

	.otp-digit {
		width: 52px;
		height: 60px;
		background: #ffffff;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		font-size: 26px;
		font-weight: 700;
		color: #0f172a;
		text-align: center;
		outline: none;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease,
			transform 0.15s ease;
		font-family: inherit;
		caret-color: #6366f1;
		padding: 0;
	}

	.otp-digit.filled {
		border-color: #6366f1;
		background: #f8faff;
	}

	.otp-digit.active {
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
		transform: translateY(-2px);
	}

	.otp-digit:focus {
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
		transform: translateY(-2px);
	}

	.otp-digit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Hide spinner for number inputs */
	.otp-digit::-webkit-outer-spin-button,
	.otp-digit::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.otp-digit[type='number'] {
		-moz-appearance: textfield;
	}

	.field-hint {
		font-size: 12px;
		color: #94a3b8;
		margin-top: 12px;
		text-align: center;
	}

	/* Submit */
	.submit-btn {
		width: 100%;
		padding: 14px;
		background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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
		box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
		transform: translateY(-1px);
	}

	.submit-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.submit-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* Resend section */
	.resend-section {
		text-align: center;
		margin-top: 20px;
	}

	.resend-text {
		font-size: 13px;
		color: #94a3b8;
	}

	.resend-btn {
		background: none;
		border: none;
		font-size: 13px;
		color: #94a3b8;
		cursor: pointer;
		font-family: inherit;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.resend-btn:disabled {
		cursor: not-allowed;
	}

	.resend-link {
		color: #6366f1;
		font-weight: 700;
	}

	.login-text {
		text-align: center;
		font-size: 13px;
		color: #94a3b8;
		margin-top: 20px;
	}

	.login-link {
		color: #6366f1;
		font-weight: 700;
		text-decoration: none;
		transition: color 0.2s;
	}

	.login-link:hover {
		color: #4f46e5;
	}

	/* Loading spinners */
	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	.loading-spinner-small {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(99, 102, 241, 0.3);
		border-top-color: #6366f1;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
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
