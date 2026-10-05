<script>
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	let apiUrl = PUBLIC_API_BASE_URL || 'Not set in env';
	let detectedUrl = '';
	let showDebug = false;

	// Detect URL at runtime
	if (typeof window !== 'undefined') {
		if (window.location.pathname.startsWith('/adminhemp')) {
			detectedUrl = window.location.origin + '/hhhadminapi';
		} else {
			detectedUrl = window.location.origin;
		}
	}

	const finalUrl = apiUrl && apiUrl.trim() ? apiUrl : detectedUrl;
</script>

<!-- Only show in dev or if debug param is set -->
{#if showDebug || (typeof window !== 'undefined' && new URL(window.location).searchParams.get('debug'))}
	<div
		style="position: fixed; bottom: 20px; right: 20px; background: #222; color: #0f0; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; z-index: 9999; max-width: 400px;"
	>
		<div><strong>🔍 API Configuration Debug</strong></div>
		<div>PUBLIC_API_BASE_URL: {apiUrl}</div>
		<div>Detected URL: {detectedUrl}</div>
		<div><strong style="color: #ff0;">Final URL: {finalUrl}</strong></div>
		<div style="margin-top: 10px; font-size: 11px; opacity: 0.8;">
			Add ?debug=1 to URL to toggle this panel
		</div>
	</div>
{/if}

<style>
	div :global(strong) {
		color: #0f0;
	}
</style>
