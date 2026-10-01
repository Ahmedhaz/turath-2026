<script>
  // The app-level sheets: a prescription for a feeling, and the quote card maker.
  import { nav, closeSheet, read } from './lib/nav.svelte.js';
  import { prescribe, ar, duration, minutes } from './lib/data.js';
  import { tap, success, shareImage, shareText } from './lib/native.js';
  import { drawCard, STYLES } from './lib/card.js';
  import Sheet from './components/Sheet.svelte';
  import UnitRow from './components/UnitRow.svelte';
  import Icon from './components/Icon.svelte';

  let { cat } = $props();

  const rx = $derived(nav.sheet?.kind === 'prescription' ? prescribe(cat, { ails: nav.sheet.feel.a, limit: 12 }) : []);

  let canvas = $state(), url = $state(''), style = $state('book');
  $effect(() => {
    const s = nav.sheet;
    if (s?.kind !== 'quote' || !canvas) return;
    drawCard(canvas, { q: s.q, src: s.src, hue: s.hue, style }).then((u) => (url = u));
  });
</script>

{#if nav.sheet?.kind === 'prescription'}
  {@const f = nav.sheet.feel}
  <Sheet onclose={closeSheet} tall>
    {#snippet children({ close })}
      <div class="rx-head">
        <p class="eyebrow">وصفتك</p>
        <h2 class="title-l">{f.t}</h2>
        <p class="ails">
          {#each f.a as a, i}<span>{cat.ail[a][0]}</span>{#if i < f.a.length - 1}<i>·</i>{/if}{/each}
        </p>
        <p class="hint">ابدأ بالأول؛ الترتيب من الأنفع لحالك إلى الأوسع. {ar(rx.length)} أبواب، {duration(rx.reduce((s, u) => s + minutes(u.w), 0))}</p>
      </div>
      <div class="rx-list" onclickcapture={() => setTimeout(closeSheet, 0)}>
        {#each rx as u, i (u.b + u.n)}<UnitRow {cat} {u} rank={i + 1} />{/each}
      </div>
    {/snippet}
  </Sheet>
{/if}

{#if nav.sheet?.kind === 'quote'}
  <Sheet onclose={() => { closeSheet(); url = ''; }} title="بطاقة للمشاركة">
    <div class="qc">
      <canvas bind:this={canvas} class="hidden"></canvas>
      <div class="preview">{#if url}<img src={url} alt="" />{:else}<div class="ph"></div>{/if}</div>
      <div class="styles">
        {#each STYLES as s}<button class="chip press" class:on={style === s.id} onclick={() => { tap(); style = s.id; }}>{s.t}</button>{/each}
      </div>
      <div class="acts">
        <button class="btn press" onclick={() => { success(); shareImage(url, nav.sheet.src); }}><Icon name="share" size={18} />شارك الصورة</button>
        <button class="btn ghost press" onclick={() => { tap(); shareText(`«${nav.sheet.q}»\n— ${nav.sheet.src}`); }}>نصاً</button>
      </div>
    </div>
  </Sheet>
{/if}

<style>
  .rx-head { padding: 4px 22px 12px; }
  .ails { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; font: 600 14px var(--ui); color: var(--teal); }
  .ails i { color: var(--muted); font-style: normal; }
  .hint { font: 400 13.5px/1.7 var(--ui); color: var(--muted); }
  .rx-list { padding: 0 16px 20px; }
  .qc { display: grid; gap: 16px; padding: 0 20px 10px; }
  .hidden { display: none; }
  .preview { display: grid; place-items: center; }
  .preview img, .ph { width: min(70vw, 300px); aspect-ratio: 4 / 5; border-radius: 16px; box-shadow: var(--shadow-lg); }
  .ph { background: var(--paper-2); }
  .styles { display: flex; justify-content: center; gap: 8px; }
  .acts { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; }
</style>
