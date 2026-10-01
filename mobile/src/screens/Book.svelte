<script>
  import { store } from '../lib/state.svelte.js';
  import { read } from '../lib/nav.svelte.js';
  import { ar, arGroup, duration, minutes, label } from '../lib/data.js';
  import { tap } from '../lib/native.js';
  import Cover from '../components/Cover.svelte';
  import NavBar from '../components/NavBar.svelte';
  import Icon from '../components/Icon.svelte';

  let { cat, id } = $props();
  const book = $derived(cat.bookById[id]);
  const units = $derived(cat.unitsOf(id));
  const p = (u) => store.progress[`${u.b}/${u.n}`];
  const doneCount = $derived(units.filter((u) => p(u)?.done).length);
  // where to pick up: the most recently opened unfinished chapter of this book, else the first unread one
  const next = $derived.by(() => {
    const open = units.filter((u) => p(u) && !p(u).done).sort((a, b) => p(b).at - p(a).at)[0];
    return open || units.find((u) => !p(u)?.done) || units[0];
  });
  const started = $derived(units.some((u) => p(u)));
  let y = $state(0);
</script>

<NavBar title={book.t} shown={y > 260} />
<div class="scroll" onscroll={(e) => (y = e.currentTarget.scrollTop)}>
  <section class="hero" style="--h:{book.hue}">
    <div class="glow">{@html book.cover}</div>
    <div class="c" style="transform: translateY({y * .25}px) scale({1 - Math.min(y, 200) / 2000})"><Cover {book} w={168} title={false} /></div>
    <p class="kicker">{book.k}</p>
    <h1 class="t">{book.t}</h1>
    <p class="by">{book.by}، عن {book.src}</p>
  </section>

  <div class="facts">
    <div><b class="num">{ar(units.length)}</b><span>{book.lab === 'الحكمة' ? 'حكمة' : 'وحدة'}</span></div>
    <div><b class="num">{duration(minutes(book.w))}</b><span>قراءة كاملة</span></div>
    <div><b class="num">{ar(Math.round((doneCount / units.length) * 100))}٪</b><span>أتممت</span></div>
  </div>

  <div class="cta">
    <button class="btn block press" onclick={() => { tap(); read(next.b, next.n); }}>
      <Icon name="play" size={18} fill />
      {started ? `تابع: ${label(book, next.n)}` : 'ابدأ القراءة'}
    </button>
  </div>

  <p class="lede">{book.lede}</p>

  <div class="section-h"><h2>{book.lab === 'الحكمة' ? 'الحِكَم' : 'الفهرس'}</h2><span class="more">{ar(doneCount)} / {ar(units.length)}</span></div>
  <ol class="toc">
    {#each units as u (u.n)}
      {@const pr = p(u)}
      <li>
        <button class="u press" class:done={pr?.done} onclick={() => { tap(); read(u.b, u.n); }}>
          <span class="n num">{u.n ? ar(u.n) : '✦'}</span>
          <span class="ut">
            {#if u.m}<span class="matn">{u.m}</span>{/if}
            <span class="tt">{u.t}</span>
            <span class="um">{duration(minutes(u.w))}</span>
          </span>
          <span class="st">
            {#if pr?.done}<span class="ok"><Icon name="check" size={16} /></span>
            {:else if pr}<svg class="ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" /><circle class="v" cx="18" cy="18" r="15" stroke-dasharray="{Math.max(4, pr.pct * 94)} 94" /></svg>
            {/if}
          </span>
        </button>
      </li>
    {/each}
  </ol>
  <div style="height: calc(var(--tabbar) + 24px)"></div>
</div>

<style>
  .hero { position: relative; overflow: hidden; isolation: isolate; text-align: center; padding: calc(var(--sat) + 64px) 24px 26px;
    background: linear-gradient(180deg, hsl(var(--h) 40% 42% / .28), transparent); }
  .glow { position: absolute; inset: -20% -20% 30%; z-index: -1; opacity: .35; filter: blur(30px) saturate(1.2);
    mask-image: radial-gradient(closest-side, #000, transparent); -webkit-mask-image: radial-gradient(closest-side, #000, transparent); }
  .glow :global(svg) { width: 100%; height: 100%; }
  .c { display: grid; place-items: center; margin-bottom: 22px; will-change: transform; }
  .c :global(.cover) { box-shadow: 0 28px 50px -18px hsl(var(--h) 50% 15% / .7), var(--shadow); }
  .kicker { font: 600 13px var(--ui); color: var(--gold); }
  .t { font: 700 30px/1.3 var(--display); margin: 4px 0 6px; text-wrap: balance; }
  .by { font: 500 14px var(--ui); color: var(--ink-2); }
  .facts { display: grid; grid-template-columns: repeat(3, 1fr); margin: 4px 16px 0; padding: 14px 0; border-block: .5px solid var(--line); text-align: center; }
  .facts div { display: grid; gap: 2px; }
  .facts div + div { border-inline-start: .5px solid var(--line); }
  .facts b { font: 700 19px var(--display); }
  .facts span { font: 500 12px var(--ui); color: var(--muted); }
  .cta { padding: 18px 16px 6px; }
  .cta :global(svg) { transform: scaleX(-1); }
  .lede { padding: 12px 22px 0; font: 400 16px/1.9 var(--read); color: var(--ink-2); }
  .toc { list-style: none; margin: 0; padding: 0 12px; }
  .u { display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 8px; text-align: start; border-bottom: .5px solid var(--line); }
  .n { width: 30px; flex: none; text-align: center; font: 600 15px var(--ui); color: var(--muted); }
  .ut { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .matn { font: 400 17px/1.7 var(--display); color: var(--ink); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .tt { font: 600 16px/1.5 var(--ui); }
  .matn + .tt { font: 500 13px var(--ui); color: var(--teal); }
  .um { font: 400 12px var(--ui); color: var(--muted); }
  .u.done .tt, .u.done .matn { color: var(--muted); }
  .st { width: 26px; flex: none; display: grid; place-items: center; }
  .ok { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--teal); color: var(--paper); }
  .ring { width: 22px; height: 22px; transform: rotate(-90deg); }
  .ring circle { fill: none; stroke: var(--paper-2); stroke-width: 4; }
  .ring .v { stroke: var(--teal); stroke-linecap: round; }
</style>
