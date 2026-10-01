<script>
  // A bottom sheet that follows the finger: drag the grabber (or the sheet when it is scrolled to the
  // top) down past a third of its height, or flick it, and it dismisses. Tapping the scrim dismisses too.
  import { onMount } from 'svelte';
  let { onclose, children, title = '', tall = false } = $props();
  let el, body, y = $state(0), dragging = $state(false), shown = $state(false);
  let startY = 0, lastY = 0, lastT = 0, v = 0;

  onMount(() => requestAnimationFrame(() => (shown = true)));

  // A touch becomes a drag only after it moves; until then it is a tap and must reach the row under it.
  let pending = false, pid = 0;
  function down(e) {
    if (e.target.closest('input, [data-nodrag]') || (body && body.scrollTop > 0 && !e.target.closest('.grab'))) return;
    pending = true; pid = e.pointerId; startY = lastY = e.clientY; lastT = performance.now(); v = 0;
  }
  function move(e) {
    if (pending && !dragging) {
      if (Math.abs(e.clientY - startY) < 6) return;
      if (e.clientY < startY) { pending = false; return; } // an upward move is a scroll, not a dismiss
      dragging = true; el.setPointerCapture(pid);
    }
    if (!dragging) return;
    const now = performance.now();
    v = (e.clientY - lastY) / Math.max(1, now - lastT);
    lastY = e.clientY; lastT = now;
    const d = e.clientY - startY;
    y = d > 0 ? d : d / 6; // rubber-band upwards
  }
  function up() {
    pending = false;
    if (!dragging) return;
    dragging = false;
    if (y > el.offsetHeight / 3 || v > .6) close(); else y = 0;
  }
  function close() { shown = false; setTimeout(onclose, 280); }
</script>

<div class="scrim" class:shown onclick={close} role="presentation"></div>
<div class="sheet" class:shown class:tall class:dragging bind:this={el} style="--y:{y}px"
  onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} role="dialog" aria-modal="true" aria-label={title}>
  <div class="grab"><i></i></div>
  {#if title}<h2 class="sheet-title">{title}</h2>{/if}
  <div class="body" bind:this={body}>{@render children?.({ close })}</div>
</div>

<style>
  .scrim { position: fixed; inset: 0; background: rgba(10, 8, 4, .38); opacity: 0; transition: opacity .3s var(--ease); z-index: 80; }
  .scrim.shown { opacity: 1; }
  .sheet {
    position: fixed; inset: auto 0 0 0; z-index: 81; max-height: 88vh; display: flex; flex-direction: column;
    background: var(--raised); border-radius: 26px 26px 0 0; box-shadow: var(--shadow-lg);
    padding-bottom: calc(var(--sab) + 12px); touch-action: none;
    transform: translateY(calc(100% + 20px)); transition: transform .42s var(--ease-out);
  }
  .sheet.tall { height: 88vh; }
  .sheet.shown { transform: translateY(var(--y)); }
  .sheet.dragging { transition: none; }
  .grab { display: grid; place-items: center; padding: 10px 0 6px; cursor: grab; }
  .grab i { width: 38px; height: 5px; border-radius: 3px; background: var(--line); background: color-mix(in srgb, var(--ink) 18%, transparent); }
  .sheet-title { font: 700 20px/1.3 var(--display); padding: 4px 22px 10px; }
  .body { overflow-y: auto; touch-action: pan-y; overscroll-behavior: contain; }
  .body::-webkit-scrollbar { display: none; }
</style>
