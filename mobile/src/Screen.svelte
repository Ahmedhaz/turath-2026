<script>
  // One layer of a tab's stack. Pushed layers slide in from the left (right-to-left navigation);
  // a covered layer drifts a little the other way and dims, as on iOS.
  import { onMount } from 'svelte';
  import { nav } from './lib/nav.svelte.js';
  import Today from './screens/Today.svelte';
  import Library from './screens/Library.svelte';
  import Book from './screens/Book.svelte';
  import Guide from './screens/Guide.svelte';
  import Ailment from './screens/Ailment.svelte';
  import Search from './screens/Search.svelte';
  import Saved from './screens/Saved.svelte';
  import Settings from './screens/Settings.svelte';

  const MAP = { Today, Library, Book, Guide, Ailment, Search, Saved, Settings };
  let { screen, props, cat, depth, covered = false, drag = null } = $props();
  const Comp = $derived(MAP[screen]);
  let entered = $state(depth === 0);
  onMount(() => { if (depth > 0) requestAnimationFrame(() => requestAnimationFrame(() => (entered = true))); });
  const x = $derived(drag?.on ? -drag.x : 0);

  // On pop, slide out from wherever the layer is now (mid-swipe or at rest) to fully off-screen.
  function exit(node) {
    const x0 = new DOMMatrix(getComputedStyle(node).transform).m41;
    const to = -node.offsetWidth;
    return { duration: 300, css: (t) => { const e = 1 - Math.pow(1 - (1 - t), 3); return `transform: translateX(${x0 + (to - x0) * e}px); transition: none`; } };
  }
</script>

<div class="layer" out:exit class:entered class:covered class:root={depth === 0} class:dragging={drag?.on}
  style="--x:{x}px; z-index:{depth + 1}">
  <Comp {...props} {cat} />
</div>

<style>
  .layer {
    position: absolute; inset: 0; background: var(--paper); overflow: hidden;
    transform: translateX(-100%); transition: transform .42s var(--ease-out), filter .42s var(--ease-out);
    will-change: transform;
  }
  .layer:not(.root) { box-shadow: 8px 0 30px -10px rgba(0,0,0,.25); }
  .layer.entered { transform: translateX(var(--x)); }
  .layer.covered { transform: translateX(28%); filter: brightness(.94); }
  .layer.dragging { transition: none; }
</style>
