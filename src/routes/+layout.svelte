<script>
  import '../app.css';
  import { onMount } from 'svelte';

  let { children } = $props();
</script>

<div class="app-shell">
  {@render children()}
</div>

<style>
  .app-shell {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
</style>
