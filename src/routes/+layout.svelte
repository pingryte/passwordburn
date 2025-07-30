<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/theme';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		// Initialize theme on mount
		const currentTheme = $theme;
		document.documentElement.classList.toggle('dark', currentTheme === 'dark');
	});
</script>

{@render children()}
