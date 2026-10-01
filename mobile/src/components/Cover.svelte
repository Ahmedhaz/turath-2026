<script>
  // A book cover: the site's own geometric pattern in the book's hue, with the title set over it.
  // Pattern ids are made unique per instance, since the same book can be on screen twice.
  let { book, w = 120, title = true, progress = 0 } = $props();
  const uid = Math.random().toString(36).slice(2, 7);
  const art = $derived((book.cover || '').replace(/id="([^"]+)"/g, `id="$1-${uid}"`).replace(/url\(#([^)]+)\)/g, `url(#$1-${uid})`));
</script>

<div class="cover" style="--w:{w}px; --h:{book.hue}">
  <div class="art">{@html art}</div>
  <div class="shade"></div>
  {#if title}
    <div class="label">
      <span class="t">{book.t}</span>
      <span class="by">{book.by}</span>
    </div>
  {/if}
  {#if progress > 0}
    <div class="bar"><i style="width:{Math.min(100, progress * 100)}%"></i></div>
  {/if}
</div>

<style>
  .cover {
    position: relative; width: var(--w); aspect-ratio: 3 / 4; border-radius: calc(var(--w) * .025) calc(var(--w) * .06) calc(var(--w) * .06) calc(var(--w) * .025);
    overflow: hidden; background: hsl(var(--h) 38% 30%); box-shadow: var(--shadow), inset -3px 0 0 rgba(255,255,255,.08);
    flex: none; isolation: isolate;
  }
  .art, .art :global(svg) { position: absolute; inset: 0; width: 100%; height: 100%; }
  .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,.55)); }
  .cover::after { content: ''; position: absolute; inset: 0 0 0 auto; width: 6%; background: linear-gradient(270deg, rgba(0,0,0,.2), transparent); } /* Arabic books are bound on the right */
  .label { position: absolute; inset: auto 10% 9% 10%; color: #FBF5E8; text-align: center; display: grid; gap: 2px; }
  .t { font: 700 calc(var(--w) * .118)/1.3 var(--display); text-wrap: balance; text-shadow: 0 1px 8px rgba(0,0,0,.35); }
  .by { font: 500 calc(var(--w) * .07)/1.3 var(--ui); opacity: .82; }
  .bar { position: absolute; inset: auto 0 0 0; height: 4px; background: rgba(0,0,0,.3); }
  .bar i { display: block; height: 100%; background: #E9C877; }
</style>
