<script lang="ts">
	import { enhance } from '$app/forms';
	import { showSuccess, showError } from '$lib/stores/toast';

	const { data } = $props();

	let userProfile = $state<any>(data.profile ?? null);
	let isEditing = $state(false);
	let isSubmitting = $state(false);
	let formName = $state('');
	let formDob = $state('');
	let formGender = $state('');
	let formPhone = $state('');

	function startEditing() {
		formName = userProfile?.name || '';
		formDob = userProfile?.date_of_birth || '';
		formGender = userProfile?.gender || '';
		formPhone = userProfile?.phone || '';
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
	}
</script>

<div class="page-header">
	<h1>Profile</h1>
	<p>Manage your personal information and preferences.</p>
</div>

{#if userProfile}
	<div class="profile-grid">
		<!-- Profile Card -->
		<div class="card profile-card">
			<div class="profile-hero">
				<div class="avatar-lg">
					{#if userProfile.avatar}
						<img src={userProfile.avatar} alt="avatar" />
					{:else}
						<span class="avatar-text">
							{userProfile.user_name?.charAt(0).toUpperCase() || 'U'}
						</span>
					{/if}
				</div>
				<h2 class="hero-name">{userProfile.name || 'User'}</h2>
				<p class="hero-email">{userProfile.email || ''}</p>
				{#if userProfile.phone}
					<p class="hero-phone">{userProfile.phone}</p>
				{/if}
			</div>
			<div class="profile-stats">
				<div class="pstat">
					<span class="pstat-label">Member Since</span>
					<span class="pstat-value">
						{userProfile.date_joined
							? new Date(userProfile.date_joined).toLocaleDateString('en-US', {
									month: 'short',
									year: 'numeric'
								})
							: 'N/A'}
					</span>
				</div>
				<!-- <div class="pstat">
					<span class="pstat-label">Gender</span>
					<span class="pstat-value">{userProfile.gender || 'Not set'}</span>
				</div> -->
				<!-- <div class="pstat">
					<span class="pstat-label">Date of Birth</span>
					<span class="pstat-value">{userProfile.date_of_birth || 'Not set'}</span>
				</div> -->
			</div>
		</div>

		<!-- Edit Form -->
		<div class="card form-card">
			<div class="card-header">
				<h2>Personal Information</h2>
				{#if !isEditing}
					<button class="btn-edit" onclick={startEditing}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.8"
							stroke="currentColor"
							width="16"
							height="16"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
							/>
						</svg>
						Edit Profile
					</button>
				{/if}
			</div>

			{#if isEditing}
				<form
				method="POST"
				action="?/updateProfile"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result }) => {
						isSubmitting = false;
						if (result.type === 'success') {
							showSuccess(result.data.message || 'Profile updated successfully');
							isEditing = false;
							if (result.data.data) {
								userProfile = { ...userProfile, ...result.data.data };
							}
						} else if (result.type === 'failure') {
							showError(result.data.message || 'Failed to update profile');
						}
					};
				}}
			>
					<div class="form-body">
						<div class="form-row">
							<div class="form-group">
								<label for="name">Full Name</label>
								<input
									type="text"
									id="name"
									name="user_name"
									bind:value={formName}
									placeholder="Enter your full name"
								/>
							</div>
						</div>
						<div class="form-row">
							<div class="form-group">
								<label for="phone">Phone Number</label>
								<input
									type="text"
									id="phone"
									name="phone"
									bind:value={formPhone}
									placeholder="Enter your phone number"
								/>
							</div>
						</div>

						<div class="form-row form-row-2">
							<div class="form-group">
								<label for="dob">Date of Birth</label>
								<input type="date" id="dob" name="date_of_birth" bind:value={formDob} />
							</div>
							<div class="form-group">
								<label for="gender">Gender</label>
								<select id="gender" name="gender" bind:value={formGender}>
									<option value="">Select...</option>
									<option value="male">Male</option>
									<option value="female">Female</option>
									<option value="other">Other</option>
									<option value="prefer_not_to_say">Prefer not to say</option>
								</select>
							</div>
						</div>

						<div class="form-actions">
							<button
								type="button"
								class="btn-secondary"
								onclick={cancelEditing}
								disabled={isSubmitting}
							>
								Cancel
							</button>
							<button type="submit" class="btn-primary" disabled={isSubmitting}>
								{isSubmitting ? 'Saving...' : 'Save Changes'}
							</button>
						</div>
					</div>
				</form>
			{:else}
				<div class="form-body">
					<div class="info-grid">
						<div class="info-item">
							<span class="info-label">Full Name</span>
							<span class="info-value">{userProfile.name || 'Not set'}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Email Address</span>
							<span class="info-value">{userProfile.email || 'Not set'}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Phone Number</span>
							<span class="info-value">{userProfile.phone || 'Not set'}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Date of Birth</span>
							<span class="info-value">{userProfile.date_of_birth || 'Not set'}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Gender</span>
							<span class="info-value">{userProfile.gender || 'Not set'}</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="card">
		<div class="empty-state">
			<p>Unable to load profile. Please try again later.</p>
		</div>
	</div>
{/if}

<style>
	.page-header {
		margin-bottom: 24px;
	}

	.page-header h1 {
		font-size: 24px;
		font-weight: 800;
		color: #111827;
		margin: 0;
		letter-spacing: -0.5px;
	}

	.page-header p {
		font-size: 14px;
		color: #6b7280;
		margin: 6px 0 0;
	}

	/* ===== Card ===== */
	.card {
		background: #ffffff;
		border-radius: 14px;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.04),
			0 2px 12px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.04);
		overflow: hidden;
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60px 20px;
		color: #6b7280;
		gap: 12px;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e5e7eb;
		border-top-color: #0b5d1e;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ===== Profile Grid ===== */
	.profile-grid {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 24px;
		align-items: start;
	}

	/* ===== Profile Hero Card ===== */
	.profile-card {
		text-align: center;
	}

	.profile-hero {
		padding: 32px 24px 24px;
		background: linear-gradient(135deg, rgba(11, 93, 30, 0.04), rgba(212, 160, 23, 0.04));
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	.avatar-lg {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: linear-gradient(135deg, #0b5d1e, #16a34a);
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 16px;
		box-shadow: 0 4px 16px rgba(11, 93, 30, 0.25);
		overflow: hidden;
	}

	.avatar-lg img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-text {
		font-size: 30px;
		font-weight: 700;
		color: #ffffff;
	}

	.hero-name {
		font-size: 18px;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.hero-email {
		font-size: 13px;
		color: #6b7280;
		margin: 4px 0 0;
		word-break: break-all;
	}

	.hero-phone {
		font-size: 13px;
		color: #6b7280;
		margin: 2px 0 0;
	}

	.profile-stats {
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.pstat {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.pstat-label {
		font-size: 12.5px;
		color: #6b7280;
	}

	.pstat-value {
		font-size: 13px;
		font-weight: 600;
		color: #111827;
		text-transform: capitalize;
	}

	/* ===== Form Card ===== */
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	.card-header h2 {
		font-size: 16px;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.btn-edit {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		background: #ffffff;
		color: #374151;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.btn-edit:hover {
		border-color: #0b5d1e;
		color: #0b5d1e;
		background: rgba(11, 93, 30, 0.04);
	}

	.form-body {
		padding: 24px;
	}

	.form-row {
		margin-bottom: 20px;
	}

	.form-row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-group label {
		font-size: 13px;
		font-weight: 600;
		color: #374151;
	}

	.form-group input,
	.form-group select {
		padding: 10px 14px;
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		font-size: 13.5px;
		color: #111827;
		background: #ffffff;
		transition: border-color 0.2s;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #0b5d1e;
		box-shadow: 0 0 0 3px rgba(11, 93, 30, 0.1);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid rgba(0, 0, 0, 0.05);
	}

	.btn-secondary {
		padding: 10px 20px;
		border-radius: 10px;
		border: 1px solid #e5e7eb;
		background: #ffffff;
		color: #374151;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.btn-secondary:hover {
		background: #f9fafb;
	}

	.btn-primary {
		padding: 10px 20px;
		border-radius: 10px;
		border: none;
		background: #0b5d1e;
		color: #ffffff;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.btn-primary:hover {
		background: #16a34a;
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ===== Info Grid ===== */
	.info-grid {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.04);
	}

	.info-item:last-child {
		border-bottom: none;
	}

	.info-label {
		font-size: 13px;
		color: #6b7280;
	}

	.info-value {
		font-size: 13.5px;
		font-weight: 600;
		color: #111827;
		text-transform: capitalize;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60px 20px;
		color: #6b7280;
	}

	.empty-state p {
		font-size: 14px;
		margin: 0;
	}

	@media (max-width: 768px) {
		.profile-grid {
			grid-template-columns: 1fr;
		}

		.page-header h1 {
			font-size: 20px;
		}

		.form-row-2 {
			grid-template-columns: 1fr;
		}
	}
</style>
