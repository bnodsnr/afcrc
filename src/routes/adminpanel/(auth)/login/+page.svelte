<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let isProcessing = $state(false);

	let { form }: { form: any } = $props();

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	const handleEnhance: SubmitFunction = () => {
		return async ({ result, update }) => {
			if (result.type === 'success' || result.type === 'redirect') {
				isProcessing = true;
				await new Promise((resolve) => setTimeout(resolve, 500));
			} else {
				isProcessing = false;
			}
			await update();
		};
	};
</script>

<main class="page">
	<div class="card">
		<div class="header">
			<div class="icon" aria-hidden="true">
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
					<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
				</svg>
			</div>
			<h1 class="title">Sign in</h1>
			<p class="subtitle">Enter your credentials to access your account</p>
		</div>

		{#if form?.incorrect || form?.error}
			<div class="error-box">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					style="flex-shrink:0;margin-top:2px"
				>
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="12" y1="8" x2="12" y2="12"></line>
					<line x1="12" y1="16" x2="12.01" y2="16"></line>
				</svg>
				<span>{form?.message || form?.error || 'Invalid email or password'}</span>
			</div>
		{/if}

		<form action="?/login" method="POST" use:enhance={handleEnhance} novalidate>
			<div class="field">
				<label for="email">Email</label>
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
						<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
						<polyline points="22,6 12,13 2,6"></polyline>
					</svg>
					<input
						id="email"
						type="email"
						name="email"
						bind:value={email}
						placeholder="you@example.com"
						autocomplete="email"
						disabled={isProcessing}
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
						placeholder="Enter your password"
						autocomplete="current-password"
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
			</div>

			<button type="submit" disabled={!email || !password || isProcessing} class="submit-btn">
				{#if isProcessing}
					<span class="spinner" aria-hidden="true"></span>
					Signing in...
				{:else}
					Sign in
				{/if}
			</button>
		</form>
	</div>
</main>

<style>
	:global(body) {
		background: #f6f7fb;
	}

	.page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 24px;
		background:
			radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.12) 0%, transparent 45%),
			radial-gradient(circle at 85% 20%, rgba(14, 165, 233, 0.1) 0%, transparent 40%),
			radial-gradient(circle at 75% 85%, rgba(168, 85, 247, 0.08) 0%, transparent 45%),
			#f6f7fb;
	}

	.card {
		width: 100%;
		max-width: 400px;
		background: #ffffff;
		border: 1px solid #eef0f5;
		border-radius: 20px;
		padding: 44px 40px 40px;
		box-shadow:
			0 4px 6px -2px rgb(15 23 42 / 0.04),
			0 20px 40px -12px rgb(15 23 42 / 0.1);
	}

	.header {
		text-align: center;
		margin-bottom: 32px;
	}

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border-radius: 16px;
		background: linear-gradient(135deg, #6366f1, #0ea5e9);
		color: #ffffff;
		box-shadow: 0 8px 16px -4px rgb(99 102 241 / 0.4);
		margin-bottom: 20px;
	}

	.title {
		font-size: 26px;
		font-weight: 700;
		color: #0f172a;
		letter-spacing: -0.02em;
		margin: 0 0 8px;
	}

	.subtitle {
		font-size: 14px;
		color: #64748b;
		margin: 0;
	}

	.error-box {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 12px;
		padding: 12px 14px;
		margin-bottom: 20px;
		font-size: 13px;
		color: #b91c1c;
	}

	.field {
		margin-bottom: 18px;
	}

	.field label {
		display: block;
		font-size: 13px;
		font-weight: 600;
		color: #334155;
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
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 13px 14px 13px 42px;
		font-size: 14px;
		color: #0f172a;
		outline: none;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease,
			background 0.2s ease;
		font-family: inherit;
	}

	.input-wrap input::placeholder {
		color: #94a3b8;
	}

	.input-wrap input:focus {
		background: #ffffff;
		border-color: #6366f1;
		box-shadow: 0 0 0 4px rgb(99 102 241 / 0.12);
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
		color: #475569;
	}

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
		user-select: none;
	}

	.check-wrap input {
		accent-color: #6366f1;
		width: 16px;
		height: 16px;
		cursor: pointer;
	}

	.check-wrap span {
		font-size: 13px;
		color: #64748b;
	}

	.submit-btn {
		width: 100%;
		padding: 14px;
		background: linear-gradient(135deg, #6366f1, #4f46e5);
		color: #ffffff;
		border: none;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition:
			box-shadow 0.2s ease,
			transform 0.2s ease,
			filter 0.2s ease;
		font-family: inherit;
		box-shadow: 0 4px 12px -2px rgb(99 102 241 / 0.4);
	}

	.submit-btn:hover:not(:disabled) {
		filter: brightness(1.05);
		box-shadow: 0 8px 20px -4px rgb(99 102 241 / 0.5);
		transform: translateY(-1px);
	}

	.submit-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgb(255 255 255 / 0.4);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 480px) {
		.card {
			padding: 32px 24px;
		}
	}
</style>
