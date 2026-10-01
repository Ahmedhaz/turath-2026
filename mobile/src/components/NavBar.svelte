<script>
  // The header of a pushed screen: a back button, and a title that fades in once the large title
  // has scrolled away (pass `shown`).
  import { back } from '../lib/nav.svelte.js';
  import { tap } from '../lib/native.js';
  import Icon from './Icon.svelte';
  let { title = '', shown = false, solid = false, children } = $props();
</script>

<header class="nb" class:shown class:solid>
  <button class="b press" onclick={() => { tap(); back(); }} aria-label="رجوع"><Icon name="back" size={26} /></button>
  <span class="t">{title}</span>
  <div class="end">{@render children?.()}</div>
</header>

<style>
  .nb { position: absolute; inset: 0 0 auto 0; z-index: 10; height: calc(var(--sat) + 50px); padding: var(--sat) 6px 0;
    display: grid; grid-template-columns: 52px 1fr 52px; align-items: center;
    transition: background-color .25s var(--ease), border-color .25s var(--ease); border-bottom: .5px solid transparent; }
  .nb.shown, .nb.solid { background: var(--blur-bg); backdrop-filter: saturate(1.5) blur(20px); -webkit-backdrop-filter: saturate(1.5) blur(20px); border-color: var(--line); }
  .b { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; color: var(--teal); }
  .t { text-align: center; font: 600 16px var(--ui); opacity: 0; transform: translateY(6px); transition: .25s var(--ease); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nb.shown .t, .nb.solid .t { opacity: 1; transform: none; }
  .end { display: flex; justify-content: flex-end; }
</style>
