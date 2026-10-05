<script lang="ts">
	import { onMount } from 'svelte';
	
	// All available DaisyUI themes
	let themes = [
		'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 
		'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden', 
		'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 
		'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade', 
		'night', 'coffee', 'winter'
	];
	
	let currentTheme = $state('dark');
	let searchTerm = $state('');
	
	// Theme categories for better organization
	let themeCategories = {
		'Light Themes': ['light', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'garden', 'lofi', 'pastel', 'fantasy', 'wireframe', 'cmyk', 'autumn', 'acid', 'lemonade', 'winter'],
		'Dark Themes': ['dark', 'synthwave', 'retro', 'cyberpunk', 'halloween', 'forest', 'aqua', 'black', 'luxury', 'dracula', 'business', 'night', 'coffee'],
		'Special Themes': ['valentine', 'halloween', 'cyberpunk', 'synthwave', 'retro']
	};
	
	// Filter themes based on search
	let filteredThemes = $derived(themes.filter(theme => 
		theme.toLowerCase().includes(searchTerm.toLowerCase())
	));
	
	function changeTheme(theme: string) {
		currentTheme = theme;
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('soccer-admin-theme', theme);
	}
	
	onMount(() => {
		// Load saved theme
		const savedTheme = localStorage.getItem('soccer-admin-theme') || 'dark';
		currentTheme = savedTheme;
		document.documentElement.setAttribute('data-theme', savedTheme);
	});
</script>

<svelte:head>
	<title>DaisyUI Themes - Soccer League Admin</title>
</svelte:head>

<!-- Header Section -->
<div class="hero bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl mb-8">
	<div class="hero-content text-center py-12">
		<div class="max-w-2xl">
			<h1 class="text-5xl font-bold mb-4">
				<span class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
					DaisyUI Themes
				</span>
			</h1>
			<p class="text-lg text-base-content/70 mb-6">
				Transform your soccer league admin interface instantly with 29 built-in themes. 
				A time-saver that lets you focus on building rather than deciding on colors.
			</p>
			<div class="badge badge-primary badge-lg">
				Current Theme: <span class="font-bold ml-1">{currentTheme}</span>
			</div>
		</div>
	</div>
</div>

<!-- How to use section -->
<div class="card bg-base-100 shadow-xl mb-8">
	<div class="card-body">
		<h2 class="card-title text-2xl mb-4">How to use DaisyUI themes?</h2>
		<p class="text-base-content/80 mb-4">
			DaisyUI comes with 35 built-in themes that instantly transform your website's entire look - a time-saver that lets you focus on building rather than deciding on colors.
		</p>
		<p class="text-base-content/80 mb-6">
			You can also create your own custom themes or customize built-in themes.
		</p>
		
		<!-- Code example -->
		<div class="mockup-code bg-base-300">
			<pre data-prefix="$"><code>npm install daisyui</code></pre>
			<pre data-prefix=">" class="text-warning"><code>installing...</code></pre>
			<pre data-prefix=">" class="text-success"><code>Done!</code></pre>
		</div>
		
		<div class="alert alert-info mt-4">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
			</svg>
			<span>You can manage themes by adding brackets in front of <code>@plugin "daisyui"</code> in your CSS file.</span>
		</div>
	</div>
</div>

<!-- Search and Filter -->
<div class="card bg-base-100 shadow-xl mb-8">
	<div class="card-body">
		<div class="form-control w-full max-w-xs">
			<label class="label" for="theme-search">
				<span class="label-text">Search themes</span>
			</label>
			<input 
				id="theme-search"
				type="text" 
				placeholder="Search themes..." 
				class="input input-bordered w-full" 
				bind:value={searchTerm}
			/>
		</div>
	</div>
</div>

<!-- Theme Showcase Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
	{#each filteredThemes as theme}
		<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 {currentTheme === theme ? 'border-primary' : 'border-transparent'}" 
			 role="button"
			 tabindex="0"
			 onclick={() => changeTheme(theme)}
			 onkeydown={(e) => e.key === 'Enter' && changeTheme(theme)}>
			<div class="card-body p-6" data-theme={theme}>
				<!-- Theme preview -->
				<div class="flex flex-col gap-3 mb-4">
					<div class="flex gap-2">
						<div class="w-4 h-4 bg-primary rounded-full"></div>
						<div class="w-4 h-4 bg-secondary rounded-full"></div>
						<div class="w-4 h-4 bg-accent rounded-full"></div>
					</div>
					<div class="flex gap-2">
						<button class="btn btn-primary btn-xs">Primary</button>
						<button class="btn btn-secondary btn-xs">Secondary</button>
						<button class="btn btn-accent btn-xs">Accent</button>
					</div>
					<div class="text-base-content">
						<h3 class="font-bold capitalize">{theme}</h3>
						<p class="text-xs opacity-70">Base content text</p>
					</div>
				</div>
				
				{#if currentTheme === theme}
					<div class="badge badge-primary">Active</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

<!-- Theme Categories -->
<div class="space-y-8">
	{#each Object.entries(themeCategories) as [category, categoryThemes]}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-xl mb-4">{category}</h3>
				<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
					{#each categoryThemes as theme}
						<button 
							class="btn btn-outline hover:btn-primary {currentTheme === theme ? 'btn-primary' : ''}"
							onclick={() => changeTheme(theme)}
						>
							{theme}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/each}
</div>

<!-- Component Showcase -->
<div class="mt-12">
	<h2 class="text-3xl font-bold mb-6 text-center">Component Preview</h2>
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Buttons Showcase -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">Buttons</h3>
				<div class="flex flex-wrap gap-2">
					<button class="btn btn-primary">Primary</button>
					<button class="btn btn-secondary">Secondary</button>
					<button class="btn btn-accent">Accent</button>
					<button class="btn btn-info">Info</button>
					<button class="btn btn-success">Success</button>
					<button class="btn btn-warning">Warning</button>
					<button class="btn btn-error">Error</button>
				</div>
			</div>
		</div>
		
		<!-- Alerts Showcase -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">Alerts</h3>
				<div class="space-y-2">
					<div class="alert alert-info">
						<span>Info alert with current theme!</span>
					</div>
					<div class="alert alert-success">
						<span>Success alert looks great!</span>
					</div>
					<div class="alert alert-warning">
						<span>Warning alert stands out!</span>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Stats Showcase -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">Stats</h3>
				<div class="stats shadow">
					<div class="stat">
						<div class="stat-title">Total Teams</div>
						<div class="stat-value text-primary">12</div>
						<div class="stat-desc">↗︎ 2 new this season</div>
					</div>
					<div class="stat">
						<div class="stat-title">Active Players</div>
						<div class="stat-value text-secondary">156</div>
						<div class="stat-desc">↗︎ 8 new registrations</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Form Elements -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">Form Elements</h3>
				<div class="form-control w-full">
					<label class="label" for="demo-team-name">
						<span class="label-text">Team Name</span>
					</label>
					<input id="demo-team-name" type="text" placeholder="Enter team name" class="input input-bordered" />
				</div>
				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">Active Team</span>
						<input type="checkbox" checked class="checkbox checkbox-primary" />
					</label>
				</div>
				<div class="form-control">
					<label class="label" for="demo-division">
						<span class="label-text">League Division</span>
					</label>
					<select id="demo-division" class="select select-bordered">
						<option disabled selected>Select division</option>
						<option>Premier League</option>
						<option>Championship</option>
						<option>League One</option>
					</select>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Footer Note -->
<div class="mt-12 text-center">
	<div class="alert alert-success max-w-2xl mx-auto">
		<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		<span>Themes are automatically saved to your browser's local storage!</span>
	</div>
</div>
