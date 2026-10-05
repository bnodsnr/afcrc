<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import { showToast } from '$lib/stores/toast';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	let settingsData = $derived(
		Array.isArray(data.settings) ? data.settings[0] || {} : data.settings || {}
	);

	let isSubmitting = $state(false);

	const handleEnhance: SubmitFunction = () => {
		isSubmitting = true;
		return async ({ result }) => {
			isSubmitting = false;
			if (result.type === 'success') {
				showToast(result.data?.message || 'Message sent successfully!', 'success');
			} else if (result.type === 'failure') {
				const msg =
					result.data?.errors?.server ||
					result.data?.message ||
					'Failed to send message. Please try again.';
				showToast(msg, 'error');
			} else if (result.type === 'error') {
				showToast('Something went wrong. Please try again.', 'error');
			}
		};
	};
</script>

<svelte:head>
	<title>Contact Us - Premium Agro Products</title>
	<meta
		name="description"
		content="Get in touch with us. We're here to help with any questions about our premium natural products."
	/>
</svelte:head>

<div class="contact-page">
	<!-- Hero Section -->
	<section class="hero-section">
		<div class="hero-bg-pattern"></div>
		<div class="hero-leaf hero-leaf-1">
			<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M60 10C60 10 90 40 90 70C90 90 75 105 60 110C45 105 30 90 30 70C30 40 60 10 60 10Z" fill="currentColor" opacity="0.08"/>
				<path d="M60 20V100" stroke="currentColor" stroke-width="1" opacity="0.1"/>
				<path d="M60 40C70 35 80 50 85 65" stroke="currentColor" stroke-width="0.5" opacity="0.08"/>
				<path d="M60 55C50 50 40 60 35 75" stroke="currentColor" stroke-width="0.5" opacity="0.08"/>
			</svg>
		</div>
		<div class="hero-leaf hero-leaf-2">
			<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M40 5C40 5 60 25 60 50C60 65 50 75 40 80C30 75 20 65 20 50C20 25 40 5 40 5Z" fill="currentColor" opacity="0.06"/>
			</svg>
		</div>
		<div class="hero-content">
			<span class="hero-badge">Get In Touch</span>
			<h1 class="hero-title">Contact Us</h1>
			<p class="hero-subtitle">
				Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as
				possible.
			</p>
		</div>
	</section>

	<!-- Contact Content -->
	<section class="contact-section">
		<div class="contact-bg-gradient"></div>
		<div class="container">
			<div class="contact-grid">
				<!-- Contact Information -->
				<div class="contact-info">
					<div class="info-header">
						<h2 class="info-title">Let's Talk</h2>
						<p class="info-description">
							Whether you have a question about our products, sustainability practices, or anything
							else, our team is ready to answer all your questions.
						</p>
					</div>

					<div class="info-cards">
						<div class="info-card">
							<div class="info-icon-wrapper">
								<div class="info-icon">
									<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
										<polyline points="9 22 9 12 15 12 15 22"/>
									</svg>
								</div>
							</div>
							<div class="info-content">
								<h3 class="info-card-title">Visit Us</h3>
								<p class="info-card-text">
									{settingsData?.address_line1 || '123 Hemp Street, Green Valley'}<br />
									{settingsData?.city || 'California'}, {settingsData?.country || '90210'}
								</p>
							</div>
						</div>

						<div class="info-card">
							<div class="info-icon-wrapper">
								<div class="info-icon">
									<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
									</svg>
								</div>
							</div>
							<div class="info-content">
								<h3 class="info-card-title">Call Us</h3>
								<p class="info-card-text">
									{settingsData?.phone_number || '(707) 000-0000'}<br />
									<!-- Toll Free: 1-800-9000 -->
								</p>
							</div>
						</div>

						<div class="info-card">
							<div class="info-icon-wrapper">
								<div class="info-icon">
									<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
										<polyline points="22,6 12,13 2,6"/>
									</svg>
								</div>
							</div>
							<div class="info-content">
								<h3 class="info-card-title">Email Us</h3>
								<p class="info-card-text">
									{settingsData?.email || 'info@hempstore.com'}<br />
									<!-- support@hempstore.com -->
								</p>
							</div>
						</div>

						<div class="info-card">
							<div class="info-icon-wrapper">
								<div class="info-icon">
									<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
										<circle cx="12" cy="12" r="10"/>
										<polyline points="12 6 12 12 16 14"/>
									</svg>
								</div>
							</div>
							<div class="info-content">
								<h3 class="info-card-title">Working Hours</h3>
								<p class="info-card-text">
									{settingsData?.working_hours || 'Mon - Fri: 9:00 AM - 6:00 PM'}<br />
								</p>
							</div>
						</div>
					</div>

					<!-- Social Links -->
					<div class="social-section">
						<h3 class="social-title">Follow Us</h3>
						<div class="social-links">
							<a href="#" class="social-link" aria-label="Facebook">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
								</svg>
							</a>
							<a href="#" class="social-link" aria-label="Instagram">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
									<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
									<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
								</svg>
							</a>
							<a href="#" class="social-link" aria-label="Twitter">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
								</svg>
							</a>
							<a href="#" class="social-link" aria-label="LinkedIn">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
									<rect x="2" y="9" width="4" height="12"/>
									<circle cx="4" cy="4" r="2"/>
								</svg>
							</a>
						</div>
					</div>
				</div>

				<!-- Contact Form -->
				<div class="contact-form-wrapper">
					<div class="form-header">
						<h2 class="form-title">Send us a Message</h2>
						<p class="form-description">
							Fill out the form below and we'll get back to you within 24 hours.
						</p>
					</div>
					<form class="contact-form" method="POST" use:enhance={handleEnhance}>
						<div class="form-row">
							<div class="form-group">
								<label for="name" class="form-label">Full Name *</label>
								<input
									type="text"
									id="name"
									name="name"
									required
									class="form-input"
									placeholder="John Doe"
								/>
							</div>

							<div class="form-group">
								<label for="email" class="form-label">Email Address *</label>
								<input
									type="email"
									id="email"
									name="email"
									required
									class="form-input"
									placeholder="john@example.com"
								/>
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="phone" class="form-label">Phone Number</label>
								<input
									type="tel"
									id="phone"
									name="phone"
									class="form-input"
									placeholder="(123) 456-7890"
								/>
							</div>

							<div class="form-group">
								<label for="subject" class="form-label">Subject *</label>
								<input
									type="text"
									id="subject"
									name="subject"
									class="form-input"
									placeholder="How can we help?"
								/>
							</div>
						</div>

						<div class="form-group">
							<label for="message" class="form-label">Message *</label>
							<textarea
								id="message"
								name="message"
								required
								class="form-textarea"
								placeholder="Tell us more about your inquiry..."
								rows="5"></textarea>
						</div>

						<button type="submit" class="submit-btn" disabled={isSubmitting}>
							{#if isSubmitting}
								<svg
									class="spinner"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
								</svg>
								Sending...
							{:else}
								Send Message
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<line x1="22" y1="2" x2="11" y2="13"/>
									<polygon points="22 2 15 22 11 13 2 9 22 2"/>
								</svg>
							{/if}
						</button>
					</form>
				</div>
			</div>
		</div>
	</section>

	<!-- Map Section -->
	<section class="map-section">
		<div class="map-container">
			<div class="map-wrapper">
				{#if settingsData?.map_embed_code}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html settingsData.map_embed_code}
				{/if}
			</div>
		</div>
	</section>
</div>

<style>
	/* Reset and Base */
	.contact-page {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #faf9f6;
		color: #1a1a1a;
	}

	/* Hero Section */
	.hero-section {
		background: linear-gradient(135deg, #0d3d1a 0%, #1a5c2e 40%, #0d3d1a 100%);
		padding: 100px 0 80px;
		position: relative;
		overflow: hidden;
	}

	.hero-bg-pattern {
		position: absolute;
		inset: 0;
		background-image: 
			radial-gradient(circle at 20% 80%, rgba(212, 165, 116, 0.08) 0%, transparent 50%),
			radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
			radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 60%);
	}

	.hero-leaf {
		position: absolute;
		color: #d4a574;
		pointer-events: none;
	}

	.hero-leaf-1 {
		top: -20px;
		right: 10%;
		width: 200px;
		height: 200px;
		transform: rotate(15deg);
	}

	.hero-leaf-2 {
		bottom: 10px;
		left: 5%;
		width: 120px;
		height: 120px;
		transform: rotate(-25deg);
	}

	.hero-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 24px;
		text-align: center;
		position: relative;
		z-index: 2;
	}

	.hero-badge {
		display: inline-block;
		background: rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(10px);
		color: #f5f0e8;
		font-family: 'Manrope', sans-serif;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 2.5px;
		padding: 8px 24px;
		border-radius: 30px;
		margin-bottom: 28px;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.hero-title {
		font-family: 'Manrope', sans-serif;
		font-size: 4rem;
		font-weight: 800;
		color: #ffffff;
		margin-bottom: 20px;
		line-height: 1.1;
		letter-spacing: -1.5px;
	}

	.hero-subtitle {
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.85);
		max-width: 560px;
		margin: 0 auto;
		line-height: 1.7;
		font-weight: 400;
	}

	/* Contact Section */
	.contact-section {
		padding: 100px 0 120px;
		position: relative;
		background: #faf9f6;
	}

	.contact-bg-gradient {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 400px;
		background: linear-gradient(180deg, rgba(13, 61, 26, 0.03) 0%, transparent 100%);
		pointer-events: none;
	}

	.container {
		max-width: 1320px;
		margin: 0 auto;
		padding: 0 40px;
	}

	.contact-grid {
		display: grid;
		grid-template-columns: 1fr 1.3fr;
		gap: 80px;
		align-items: start;
	}

	/* Contact Info */
	.contact-info {
		position: sticky;
		top: 120px;
	}

	.info-header {
		margin-bottom: 48px;
	}

	.info-title {
		font-family: 'Manrope', sans-serif;
		font-size: 2.8rem;
		font-weight: 800;
		color: #0d3d1a;
		margin-bottom: 16px;
		line-height: 1.15;
		letter-spacing: -0.5px;
	}

	.info-description {
		font-size: 1.1rem;
		color: #4a5568;
		line-height: 1.75;
		margin: 0;
	}

	.info-cards {
		display: grid;
		gap: 16px;
		margin-bottom: 48px;
	}

	.info-card {
		display: flex;
		gap: 20px;
		padding: 24px;
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(20px);
		border-radius: 18px;
		border: 1px solid rgba(13, 61, 26, 0.08);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4px 20px rgba(13, 61, 26, 0.04);
	}

	.info-card:hover {
		background: rgba(255, 255, 255, 0.9);
		border-color: rgba(13, 61, 26, 0.12);
		box-shadow: 0 12px 40px rgba(13, 61, 26, 0.08);
		transform: translateY(-4px);
	}

	.info-icon-wrapper {
		flex-shrink: 0;
	}

	.info-icon {
		width: 52px;
		height: 52px;
		background: linear-gradient(135deg, #0d3d1a 0%, #1a5c2e 100%);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #f5f0e8;
		box-shadow: 0 4px 12px rgba(13, 61, 26, 0.2);
	}

	.info-content {
		flex: 1;
	}

	.info-card-title {
		font-family: 'Manrope', sans-serif;
		font-size: 1.05rem;
		font-weight: 700;
		color: #0d3d1a;
		margin-bottom: 6px;
		letter-spacing: -0.2px;
	}

	.info-card-text {
		font-size: 0.95rem;
		color: #4a5568;
		line-height: 1.6;
		margin: 0;
	}

	/* Social Section */
	.social-section {
		padding-top: 36px;
		border-top: 1px solid rgba(13, 61, 26, 0.1);
	}

	.social-title {
		font-family: 'Manrope', sans-serif;
		font-size: 1rem;
		font-weight: 700;
		color: #0d3d1a;
		margin-bottom: 20px;
		letter-spacing: 0.3px;
	}

	.social-links {
		display: flex;
		gap: 12px;
	}

	.social-link {
		width: 48px;
		height: 48px;
		background: linear-gradient(135deg, #0d3d1a 0%, #1a5c2e 100%);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #f5f0e8;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		text-decoration: none;
		box-shadow: 0 4px 12px rgba(13, 61, 26, 0.15);
	}

	.social-link:hover {
		background: linear-gradient(135deg, #1a5c2e 0%, #2d7a45 100%);
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(13, 61, 26, 0.25);
	}

	/* Contact Form */
	.contact-form-wrapper {
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(24px);
		border-radius: 24px;
		padding: 48px;
		box-shadow: 
			0 8px 40px rgba(13, 61, 26, 0.06),
			0 1px 3px rgba(13, 61, 26, 0.04);
		border: 1px solid rgba(13, 61, 26, 0.08);
	}

	.form-header {
		margin-bottom: 40px;
	}

	.form-title {
		font-family: 'Manrope', sans-serif;
		font-size: 2.2rem;
		font-weight: 800;
		color: #0d3d1a;
		margin-bottom: 12px;
		letter-spacing: -0.5px;
	}

	.form-description {
		font-size: 1rem;
		color: #4a5568;
		margin: 0;
		line-height: 1.6;
	}

	.contact-form {
		display: flex;
		flex-direction: column;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
	}

	.form-group {
		margin-bottom: 28px;
	}

	.form-label {
		display: block;
		font-family: 'Manrope', sans-serif;
		font-size: 0.85rem;
		font-weight: 600;
		color: #0d3d1a;
		margin-bottom: 10px;
		letter-spacing: 0.3px;
		text-transform: uppercase;
	}

	.form-input,
	.form-textarea {
		width: 100%;
		padding: 0 18px;
		height: 54px;
		border: 1.5px solid rgba(13, 61, 26, 0.12);
		border-radius: 12px;
		font-size: 1rem;
		color: #1a1a1a;
		background: #ffffff;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		font-family: 'Inter', sans-serif;
		box-shadow: 0 2px 8px rgba(13, 61, 26, 0.02);
	}

	.form-input::placeholder,
	.form-textarea::placeholder {
		color: #9ca3af;
	}

	.form-input:hover,
	.form-textarea:hover {
		border-color: rgba(13, 61, 26, 0.2);
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: #0d3d1a;
		background: #ffffff;
		box-shadow: 
			0 0 0 4px rgba(13, 61, 26, 0.08),
			0 2px 12px rgba(13, 61, 26, 0.06);
	}

	.form-textarea {
		resize: vertical;
		min-height: 150px;
		padding: 16px 18px;
		height: auto;
	}

	.submit-btn {
		width: 100%;
		padding: 18px 32px;
		background: linear-gradient(135deg, #0d3d1a 0%, #1a5c2e 100%);
		color: #f5f0e8;
		border: none;
		border-radius: 14px;
		font-family: 'Manrope', sans-serif;
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-top: 8px;
		box-shadow: 0 6px 24px rgba(13, 61, 26, 0.25);
		position: relative;
		overflow: hidden;
	}

	.submit-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-3px);
		box-shadow: 0 12px 36px rgba(13, 61, 26, 0.35);
		background: linear-gradient(135deg, #1a5c2e 0%, #2d7a45 100%);
	}

	.submit-btn:hover:not(:disabled)::before {
		opacity: 1;
	}

	.submit-btn:active:not(:disabled) {
		transform: translateY(-1px);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Map Section */
	.map-section {
		width: 100%;
		padding: 0;
		margin: 0;
		position: relative;
		background: transparent;
		display: block;
	}

	.map-container {
		width: 100%;
		max-width: 100%;
		margin: 0;
		padding: 0;
		position: relative;
		overflow: hidden;
		display: block;
	}

	.map-wrapper {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%;
		height: 0;
		overflow: hidden;
		display: block;
		margin: 0;
	}

	.map-wrapper :global(iframe) {
		position: absolute;
		top: 0;
		left: 0;
		width: 100% !important;
		height: 100% !important;
		border: none;
		border-radius: 0;
	}

	/* Responsive Design */
	@media (max-width: 1200px) {
		.container {
			max-width: 1100px;
			padding: 0 32px;
		}

		.contact-grid {
			gap: 60px;
		}
	}

	@media (max-width: 1024px) {
		.contact-grid {
			grid-template-columns: 1fr;
			gap: 60px;
		}

		.contact-info {
			position: static;
		}

		.hero-title {
			font-size: 3.2rem;
		}

		.info-title {
			font-size: 2.4rem;
		}
	}

	@media (max-width: 768px) {
		.hero-section {
			padding: 80px 0 60px;
		}

		.hero-title {
			font-size: 2.6rem;
		}

		.hero-subtitle {
			font-size: 1.05rem;
		}

		.hero-leaf-1 {
			width: 140px;
			height: 140px;
			right: -20px;
		}

		.hero-leaf-2 {
			width: 80px;
			height: 80px;
			left: -10px;
		}

		.contact-section {
			padding: 60px 0 80px;
		}

		.container {
			padding: 0 20px;
		}

		.contact-form-wrapper {
			padding: 32px 24px;
		}

		.form-row {
			grid-template-columns: 1fr;
			gap: 0;
		}

		.info-title {
			font-size: 2rem;
		}

		.form-title {
			font-size: 1.8rem;
		}

		.info-card {
			padding: 20px;
		}

		.info-cards {
			gap: 12px;
		}

		.info-icon {
			width: 46px;
			height: 46px;
			border-radius: 12px;
		}

		.info-icon svg {
			width: 20px;
			height: 20px;
		}

		.social-links {
			gap: 10px;
		}

		.social-link {
			width: 44px;
			height: 44px;
			border-radius: 12px;
		}
	}

	@media (max-width: 480px) {
		.hero-section {
			padding: 64px 0 48px;
		}

		.hero-title {
			font-size: 2.2rem;
			letter-spacing: -1px;
		}

		.hero-badge {
			font-size: 0.7rem;
			padding: 6px 16px;
			letter-spacing: 2px;
		}

		.info-title {
			font-size: 1.8rem;
		}

		.info-description {
			font-size: 1rem;
		}

		.form-title {
			font-size: 1.6rem;
		}

		.contact-form-wrapper {
			padding: 28px 20px;
		}

		.form-input,
		.form-textarea {
			font-size: 16px;
		}
	}
</style>
