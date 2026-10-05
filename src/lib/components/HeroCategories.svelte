<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Poppins:wght@400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<section class="hero">
	<!-- soft rolling hill silhouettes to suggest farmland -->
	<div class="hills" aria-hidden="true">
		<div class="hill hill--1"></div>
		<div class="hill hill--2"></div>
		<div class="hill hill--3"></div>
	</div>
	<div class="leaf-decor right" aria-hidden="true"></div>

	<div class="content-row">
		<!-- LEFT: headline + copy -->
		<div class="left-col">
			<div class="eyebrow">Pure. Natural.</div>
			<div class="headline-script">From Nature</div>

			<div class="divider-row">
				<span class="line"></span>
				<span class="leaf-icon">🌿</span>
				<span class="line"></span>
			</div>

			<p class="tagline">
				Bringing you the finest quality products from local farms and authentic sources. Healthy
				choices for a better tomorrow.
			</p>

			<div class="badge">
				<svg viewBox="0 0 24 24"
					><path
						d="M12 2C7 2 3 6 3 11c0 4 3 7 7 7 1 0 2-.2 2.8-.6C11.6 21 9 22 9 22h6s-2.6-1-3.8-4.6c3.6-1 6.8-4.1 6.8-8.4 0-5-4-7-6-7z"
					/></svg
				>
				NATURAL &bull; PURE &bull; TRUSTED
			</div>

			<!-- Illustrated basket accent -->
			<svg
				class="basket-illustration"
				viewBox="0 0 400 260"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<ellipse cx="200" cy="245" rx="170" ry="12" fill="rgba(0,0,0,0.25)" />
				<path d="M60 150 L340 150 L310 240 L90 240 Z" fill="#a9713c" />
				<path d="M60 150 L340 150 L335 165 L65 165 Z" fill="#8a5a2f" />
				<g stroke="#7a4d28" stroke-width="3" opacity="0.6">
					<line x1="80" y1="165" x2="105" y2="240" />
					<line x1="120" y1="165" x2="140" y2="240" />
					<line x1="160" y1="165" x2="175" y2="240" />
					<line x1="200" y1="165" x2="200" y2="240" />
					<line x1="240" y1="165" x2="225" y2="240" />
					<line x1="280" y1="165" x2="260" y2="240" />
					<line x1="320" y1="165" x2="295" y2="240" />
				</g>
				<path
					d="M120 150 Q100 90 140 60"
					fill="none"
					stroke="#8a5a2f"
					stroke-width="8"
					stroke-linecap="round"
				/>
				<path
					d="M280 150 Q300 90 260 60"
					fill="none"
					stroke="#8a5a2f"
					stroke-width="8"
					stroke-linecap="round"
				/>
				<!-- veggies -->
				<circle cx="150" cy="140" r="30" fill="#c93b2c" />
				<circle cx="200" cy="120" r="34" fill="#4a7a2f" />
				<circle cx="250" cy="140" r="30" fill="#e0a72a" />
				<ellipse cx="120" cy="130" rx="24" ry="16" fill="#3f6b2a" />
				<ellipse cx="280" cy="130" rx="24" ry="16" fill="#3f6b2a" />
				<path
					d="M170 90 Q200 60 230 90"
					stroke="#2f5723"
					stroke-width="10"
					fill="none"
					stroke-linecap="round"
				/>
			</svg>
		</div>

		<!-- RIGHT: category card grid -->
		<div class="card-grid">
			<div class="card card--agro">
				<div class="icon-circle">
					<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"
						><path
							d="M12 22V12M12 12C12 7 8 4 4 4c0 5 3 8 8 8zM12 12c0-5 4-8 8-8 0 5-3 8-8 8z"
						/></svg
					>
				</div>
				<h3>AGRO PRODUCTS</h3>
				<div class="mini-line"></div>
				<p class="sub">Fresh, Natural &amp; Healthy</p>
				<div class="card-photo"></div>
			</div>

			<div class="card card--meat">
				<div class="icon-circle">
					<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"
						><ellipse cx="12" cy="13" rx="7" ry="6" /><path d="M8 8c0-3 2-5 2-5" /></svg
					>
				</div>
				<h3>PREMIUM MEAT</h3>
				<div class="mini-line"></div>
				<p class="sub">Hygienic, Safe &amp; High Quality</p>
				<div class="card-photo"></div>
			</div>

			<div class="card card--herbal">
				<div class="icon-circle">
					<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"
						><path d="M6 20c0-6 2-10 6-14 4 4 6 8 6 14z" /><path d="M12 6v14" /></svg
					>
				</div>
				<h3>HERBAL PRODUCTS</h3>
				<div class="mini-line"></div>
				<p class="sub">Pure, Natural &amp; Effective</p>
				<div class="card-photo"></div>
			</div>

			<div class="card card--beverage">
				<div class="icon-circle">
					<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"
						><path d="M8 3h8l-1 5H9z" /><path d="M9 8l1 12h4l1-12" /></svg
					>
				</div>
				<h3>BEVERAGE</h3>
				<div class="mini-line"></div>
				<p class="sub">Refreshing, Natural &amp; Energizing</p>
				<div class="card-photo"></div>
			</div>
		</div>
	</div>
</section>

<style lang="css">
	.hero {
		/* palette */
		--green-dark: #1f3d24;
		--green: #2e5d34;
		--green-mid: #3f7a3f;
		--green-light: #eef5ea;
		--meat-red: #8c3a2b;
		--herb-purple: #5b3a86;
		--bev-orange: #e0902f;
		--cream: #fbfaf6;
		--text-dark: #1e2a1e;
		--text-muted: #4a4a45;
		--radius-card: 18px;
		--shadow-card: 0 18px 40px rgba(20, 40, 20, 0.18);

		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: stretch;
		overflow: hidden;
		font-family: 'Poppins', sans-serif;
		background:
			linear-gradient(
				180deg,
				rgba(10, 20, 10, 0.05) 0%,
				rgba(10, 25, 10, 0.35) 55%,
				rgba(6, 16, 8, 0.75) 100%
			),
			linear-gradient(180deg, #bfe3f2 0%, #d9edcf 30%, #8fbf6a 55%, #5f9450 75%, #3f6b3a 100%);
	}

	/* soft rolling hill silhouettes to suggest farmland */
	.hills {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}
	.hill {
		position: absolute;
		left: -10%;
		width: 120%;
		border-radius: 50% 50% 0 0 / 100% 100% 0 0;
		opacity: 0.55;
	}
	.hill--1 {
		bottom: 26%;
		height: 220px;
		background: #6f9d55;
		opacity: 0.4;
	}
	.hill--2 {
		bottom: 14%;
		height: 260px;
		background: #557c3f;
		opacity: 0.5;
	}
	.hill--3 {
		bottom: 0;
		height: 220px;
		background: #3c5c2e;
		opacity: 0.65;
	}

	/* leafy corner decorations */
	.leaf-decor {
		position: absolute;
		z-index: 3;
		pointer-events: none;
		opacity: 0.9;
	}
	.leaf-decor.top-left {
		top: -40px;
		left: -30px;
		width: 220px;
		transform: rotate(-8deg);
	}
	.leaf-decor.right {
		top: 0;
		right: 0;
		width: 140px;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(10, 22, 10, 0.55));
	}

	.content-row {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 1700px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1.05fr;
		gap: 48px;
		padding: 70px 60px 40px;
		align-items: center;
	}

	/* ---------- LEFT COLUMN ---------- */
	.left-col {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-bottom: 220px; /* room for basket illustration */
		position: relative;
	}

	.eyebrow {
		font-family: 'Poppins', sans-serif;
		font-weight: 700;
		font-size: 2.3rem;
		color: var(--green-dark);
		letter-spacing: 0.5px;
		text-shadow: 0 2px 10px rgba(255, 255, 255, 0.35);
	}

	.headline-script {
		font-family: 'Dancing Script', cursive;
		font-weight: 700;
		font-size: 6.2rem;
		line-height: 0.95;
		color: var(--green);
		margin: -6px 0 14px -4px;
		text-shadow: 0 4px 18px rgba(20, 50, 20, 0.2);
	}

	.divider-row {
		display: flex;
		align-items: center;
		gap: 14px;
		margin: 6px 0 20px;
	}
	.divider-row .line {
		height: 2px;
		width: 70px;
		background: var(--green-dark);
		opacity: 0.6;
	}
	.divider-row .leaf-icon {
		font-size: 1.1rem;
		color: var(--green-dark);
	}

	.tagline {
		font-size: 1.08rem;
		line-height: 1.65;
		color: var(--text-dark);
		max-width: 430px;
		font-weight: 500;
		text-shadow: 0 1px 6px rgba(255, 255, 255, 0.25);
	}

	.badge {
		margin-top: 26px;
		display: inline-flex;
		align-items: center;
		gap: 10px;
		width: fit-content;
		background: var(--green-dark);
		color: #fff;
		font-weight: 600;
		letter-spacing: 1.5px;
		font-size: 0.85rem;
		padding: 12px 26px;
		border-radius: 30px;
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
	}
	.badge svg {
		width: 16px;
		height: 16px;
		fill: #a8e6a1;
	}

	/* basket illustration (bottom-left) */
	.basket-illustration {
		position: absolute;
		left: -20px;
		bottom: -40px;
		width: 520px;
		max-width: 60%;
		z-index: 3;
		filter: drop-shadow(0 20px 25px rgba(0, 0, 0, 0.35));
	}

	/* ---------- RIGHT COLUMN: CARD GRID ---------- */
	.card-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 26px;
		position: relative;
		z-index: 2;
	}

	.card {
		background: var(--cream);
		border-radius: var(--radius-card);
		box-shadow: var(--shadow-card);
		padding: 28px 24px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		overflow: hidden;
		border-bottom: 6px solid transparent;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}
	.card:hover {
		transform: translateY(-6px);
		box-shadow: 0 26px 50px rgba(20, 40, 20, 0.25);
	}

	.card--agro {
		border-color: var(--green);
	}
	.card--meat {
		border-color: var(--meat-red);
	}
	.card--herbal {
		border-color: var(--herb-purple);
	}
	.card--beverage {
		border-color: var(--bev-orange);
	}

	.icon-circle {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 14px;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.18);
	}
	.icon-circle svg {
		width: 30px;
		height: 30px;
	}

	.card--agro .icon-circle {
		background: var(--green);
	}
	.card--meat .icon-circle {
		background: var(--meat-red);
	}
	.card--herbal .icon-circle {
		background: var(--herb-purple);
	}
	.card--beverage .icon-circle {
		background: var(--bev-orange);
	}

	.card h3 {
		font-size: 1.35rem;
		font-weight: 800;
		letter-spacing: 0.5px;
		margin-bottom: 8px;
	}
	.card--agro h3 {
		color: var(--green-dark);
	}
	.card--meat h3 {
		color: var(--meat-red);
	}
	.card--herbal h3 {
		color: var(--herb-purple);
	}
	.card--beverage h3 {
		color: var(--bev-orange);
	}

	.card .mini-line {
		width: 36px;
		height: 2px;
		background: currentColor;
		opacity: 0.5;
		margin-bottom: 10px;
	}
	.card--agro .mini-line {
		color: var(--green-dark);
	}
	.card--meat .mini-line {
		color: var(--meat-red);
	}
	.card--herbal .mini-line {
		color: var(--herb-purple);
	}
	.card--beverage .mini-line {
		color: var(--bev-orange);
	}

	.card p.sub {
		font-size: 0.92rem;
		color: var(--text-muted);
		margin-bottom: 18px;
		font-weight: 500;
	}

	.card-photo {
		width: 100%;
		flex: 1;
		border-radius: 14px 14px 0 0;
		background-size: cover;
		background-position: center;
		min-height: 170px;
	}

	.card--agro .card-photo {
		background:
			radial-gradient(circle at 30% 20%, #cfe8b0, transparent 60%),
			linear-gradient(160deg, #8a5a34, #6b4423 70%);
	}
	.card--meat .card-photo {
		background:
			radial-gradient(circle at 40% 30%, #e8b3a3, transparent 55%),
			linear-gradient(160deg, #a3572f, #7c3a1d 70%);
	}
	.card--herbal .card-photo {
		background:
			radial-gradient(circle at 35% 25%, #d7e8c9, transparent 55%),
			linear-gradient(160deg, #f4f4ee, #dbe4d0 70%);
	}
	.card--beverage .card-photo {
		background:
			radial-gradient(circle at 45% 20%, #ffe2a6, transparent 55%),
			linear-gradient(160deg, #8a5a34, #5c3b21 70%);
	}

	/* ---------- Responsive ---------- */
	@media (max-width: 1100px) {
		.content-row {
			grid-template-columns: 1fr;
			padding: 50px 30px;
		}
		.left-col {
			padding-bottom: 60px;
			align-items: center;
			text-align: center;
		}
		.divider-row {
			justify-content: center;
		}
		.tagline {
			max-width: 100%;
		}
		.headline-script {
			font-size: 4.4rem;
		}
		.basket-illustration {
			position: static;
			margin: 30px auto 0;
			width: 280px;
		}
		.card-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (max-width: 640px) {
		.eyebrow {
			font-size: 1.6rem;
		}
		.headline-script {
			font-size: 3.2rem;
		}
		.card-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			transition: none;
		}
	}
</style>
