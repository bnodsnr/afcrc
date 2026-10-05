<script lang="ts">
	import { base } from '$lib/admin/paths';
	export let nav = [];
	export let user = { name: 'User', avatar: '' };
</script>

<div class="drawer-side">
	<label for="drawer-toggle" aria-label="close sidebar" class="drawer-overlay"></label>
	<aside class="min-h-full w-64 bg-base-100">
		<!-- Logo -->
		<div class="px-6 py-4">
			<div class="flex items-center gap-2">
				<div class="avatar placeholder">
					<div class="bg-primary text-primary-content w-8 rounded-full">
						<span class="text-xs">SA</span>
					</div>
				</div>
				<span class="text-xl font-bold text-primary">Soccer Admin</span>
			</div>
		</div>

		<!-- Navigation menu -->
		<ul class="menu px-4 py-0 min-h-full w-full text-base-content">
			{#each nav as item}
				<li>
					<a
						class="flex items-center gap-3 {item.active ? 'active' : ''}"
						href="#{item.name.toLowerCase()}"
					>
						<span class="text-lg">{item.icon}</span>
						<span>{item.name}</span>
					</a>
				</li>
			{/each}

			<div class="divider"></div>

			<!-- Settings section -->
			<li><a href="#settings">⚙️ Settings</a></li>
			<li><a href="#help">❓ Help & Support</a></li>
			<li><a href="{base}/logout">🚪 Logout</a></li>
		</ul>

		<!-- User info at bottom -->
		<div class="p-4 border-t mt-auto">
			<div class="flex items-center gap-3">
				<div class="avatar">
					<div class="w-10 rounded-full">
						<img src={user.avatar} alt="User avatar" />
					</div>
				</div>
				<div class="flex-1">
					<div class="font-semibold text-sm">{user.name}</div>
					<div class="text-xs text-base-content/70">Administrator</div>
				</div>
			</div>
		</div>
	</aside>
</div>
