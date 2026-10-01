<script>
  // A prescription: everything across the books that treats one ailment, one area of life or one layer.
  import { read } from '../lib/nav.svelte.js';
  import { ar, prescribe, duration, minutes } from '../lib/data.js';
  import { store } from '../lib/state.svelte.js';
  import { tap } from '../lib/native.js';
  import NavBar from '../components/NavBar.svelte';
  import UnitRow from '../components/UnitRow.svelte';
  import Icon from '../components/Icon.svelte';

  let { cat, a = null, arc = null, layer = null } = $props();
  const units = $derived(prescribe(cat, { ails: a != null ? [a] : [], arc, layer, limit: 400, cap: Infinity, perBook: Infinity }));
  const fam = $derived(a != null ? cat.fam.find((f) => f[2].includes(+a)) : null);
  const title = $derived(a != null ? cat.ail[a][0] : arc != null ? cat.arcs[arc][0] : `طبقة ${cat.layers[layer][0]}`);
  const kicker = $derived(a != null ? `علّة، ${fam?.[0] || ''}` : arc != null ? 'محور' : 'طبقة');
  const desc = $derived(layer != null ? cat.layers[layer][2] : '');
  const total = $derived(units.reduce((s, u) => s + minutes(u.w), 0));
  const books = $derived(new Set(units.map((u) => u.b)).size);
  const first = $derived(units.find((u) => !store.progress[`${u.b}/${u.n}`]?.done) || units[0]);
  let y = $state(0);
</script>

<NavBar {title} shown={y > 90} />
<div class="scroll" onscroll={(e) => (y = e.currentTarget.scrollTop)}>
  <header class="head">
    <p class="eyebrow">{kicker}</p>
    <h1 class="title-xl">{title}</h1>
    {#if desc}<p class="desc">{desc}</p>{/if}
    <p class="meta">{ar(units.length)} باباً من {ar(books)} {books > 10 ? 'كتاباً' : 'كتب'}، {duration(total)}</p>
    {#if first}
      <button class="btn block press" onclick={() => { tap(); read(first.b, first.n); }}>
        <Icon name="play" size={18} fill /> ابدأ بأنفعها
      </button>
    {/if}
  </header>
  <div class="list">
    {#each units as u, i (u.b + u.n)}<UnitRow {cat} {u} rank={i < 3 ? i + 1 : 0} />{/each}
  </div>
  <div style="height: calc(var(--tabbar) + 24px)"></div>
</div>

<style>
  .head { padding: calc(var(--sat) + 70px) 20px 12px; }
  .desc { font: 400 16px/1.8 var(--read); color: var(--ink-2); margin-top: 6px; }
  .meta { font: 500 13px var(--ui); color: var(--muted); margin: 8px 0 18px; }
  .head :global(.btn svg) { transform: scaleX(-1); }
  .list { padding: 0 16px; }
</style>
