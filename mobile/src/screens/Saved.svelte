<script>
  import { store, toggleSaved, streak } from '../lib/state.svelte.js';
  import { go, read, sheet } from '../lib/nav.svelte.js';
  import { ar, duration, label } from '../lib/data.js';
  import { tap } from '../lib/native.js';
  import Icon from '../components/Icon.svelte';
  import UnitRow from '../components/UnitRow.svelte';

  let { cat } = $props();
  let seg = $state(0); // 0 bookmarks، 1 highlights، 2 wisdom
  const totalMin = $derived(Math.round(Object.values(store.days).reduce((a, b) => a + b, 0) / 60));
  const done = $derived(Object.values(store.progress).filter((p) => p.done).length);
  const bookOf = (k) => cat.bookById[k.split('/')[0]];
</script>

<div class="scroll">
  <div class="head">
    <h1 class="title-xl">محفوظاتي</h1>
    <button class="gear press" onclick={() => { tap(); go('Settings'); }} aria-label="الإعدادات"><Icon name="settings" /></button>
  </div>

  <div class="stats">
    <div><b class="num">{duration(Math.max(0, totalMin))}</b><span>وقت القراءة</span></div>
    <div><b class="num">{ar(done)}</b><span>باباً أتممته</span></div>
    <div><b class="num">{ar(streak())}</b><span>أيام متتالية</span></div>
  </div>

  <div class="seg">
    {#each [['علامات', store.bookmarks.length], ['تظليلات', store.highlights.length], ['حِكَم', store.saved.length]] as [t, c], i}
      <button class:on={seg === i} onclick={() => { tap(); seg = i; }}>{t}{#if c}<small class="num">{ar(c)}</small>{/if}</button>
    {/each}
  </div>

  {#if seg === 0}
    {#if store.bookmarks.length}
      <div class="list">{#each store.bookmarks as bm (bm.k)}{@const u = cat.unitByKey.get(bm.k)}{#if u}<UnitRow {cat} {u} />{/if}{/each}</div>
    {:else}
      <div class="empty"><Icon name="bookmark" size={34} /><p>ضع علامة على أي باب من زر <b>العلامة</b> أعلى القارئ، فتجده هنا.</p></div>
    {/if}
  {:else if seg === 1}
    {#if store.highlights.length}
      <div class="hls">
        {#each store.highlights as h (h.id)}
          {@const bk = bookOf(h.k)}{@const u = cat.unitByKey.get(h.k)}
          <button class="hl press" style="--h:{bk.hue}" onclick={() => { tap(); read(u.b, u.n); }}>
            <span class="q">{h.text}</span>
            <span class="src">{bk.t}، {u.m ? label(bk, u.n) : u.t}</span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty"><Icon name="highlight" size={34} /><p>اضغط مطولاً على أي جملة في القارئ، ثم اختر <b>تظليل</b>.</p></div>
    {/if}
  {:else}
    {#if store.saved.length}
      <div class="hls">
        {#each store.saved as s (s.q)}
          {@const bk = cat.bookById[s.u.split('/')[0]]}
          <div class="wq" style="--h:{bk.hue}">
            <p class="q">{s.q}</p>
            <div class="wa">
              <button class="press" onclick={() => { tap(); read(...s.u.split('/')); }}>اقرأ الشرح</button>
              <button class="press" onclick={() => { tap(); sheet('quote', { q: s.q, src: bk.by, hue: bk.hue }); }}><Icon name="share" size={18} /></button>
              <button class="press" onclick={() => { tap(); toggleSaved(s.q, s.u); }}><Icon name="heart" size={18} fill /></button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty"><Icon name="heart" size={34} /><p>احفظ حكمة اليوم بالقلب، فتجتمع هنا حِكَمك.</p></div>
    {/if}
  {/if}
  <div style="height: calc(var(--tabbar) + 24px)"></div>
</div>

<style>
  .head { display: flex; align-items: flex-end; justify-content: space-between; padding: calc(var(--sat) + 28px) 20px 14px; }
  .gear { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: var(--paper-2); color: var(--ink-2); }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0 16px; padding: 16px 6px; border-radius: var(--r); background: var(--card); box-shadow: var(--shadow); text-align: center; }
  .stats div { display: grid; }
  .stats div + div { border-inline-start: .5px solid var(--line); }
  .stats b { font: 700 20px var(--display); color: var(--teal); }
  .stats span { font: 500 12px var(--ui); color: var(--muted); }
  .seg { display: grid; grid-template-columns: repeat(3, 1fr); margin: 20px 16px 8px; padding: 3px; border-radius: 12px; background: var(--paper-2); }
  .seg button { height: 38px; border-radius: 10px; font: 500 14.5px var(--ui); color: var(--ink-2); display: flex; align-items: center; justify-content: center; gap: 6px; }
  .seg button.on { background: var(--raised); color: var(--ink); box-shadow: var(--shadow); }
  .seg small { font: 600 11px var(--ui); color: var(--teal); }
  .list { padding: 0 16px; }
  .hls { display: grid; gap: 10px; padding: 8px 16px; }
  .hl { display: grid; gap: 8px; text-align: start; padding: 16px 18px; border-radius: var(--r); background: var(--card); box-shadow: var(--shadow); border-inline-start: 4px solid hsl(var(--h) 40% 45%); }
  .q { font: 400 17px/1.9 var(--read); }
  .src { font: 500 12px var(--ui); color: var(--muted); }
  .wq { padding: 18px; border-radius: var(--r); color: #FBF5E8; background: linear-gradient(135deg, hsl(var(--h) 40% 32%), hsl(var(--h) 44% 20%)); }
  .wq .q { font: 400 21px/1.8 var(--display); }
  .wa { display: flex; gap: 8px; margin-top: 12px; }
  .wa button { height: 36px; min-width: 36px; padding: 0 12px; border-radius: 999px; background: rgba(255,255,255,.14); display: grid; place-items: center; font: 600 13px var(--ui); }
  .wa button:first-child { margin-inline-end: auto; }
  .empty { display: grid; justify-items: center; gap: 12px; padding: 56px 40px; text-align: center; color: var(--muted); }
  .empty p { font: 400 15px/1.8 var(--ui); }
  .empty b { color: var(--ink-2); }
</style>
