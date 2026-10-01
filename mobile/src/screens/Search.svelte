<script>
  import { store, pushRecent, save } from '../lib/state.svelte.js';
  import { read, go } from '../lib/nav.svelte.js';
  import { ar, norm } from '../lib/data.js';
  import { tap } from '../lib/native.js';
  import Icon from '../components/Icon.svelte';

  let { cat } = $props();
  let q = $state(''), input;
  let docs = null, loading = $state(false), results = $state([]), total = $state(0);
  const SUGGEST = [1, 11, 15, 8, 16, 13].map((a) => cat.ail[a][0]).concat(['الشاشة', 'الصلاة', 'النوم', 'الرزق']);

  async function load() {
    if (docs) return docs;
    loading = true;
    const parts = await Promise.all(cat.books.map((b) =>
      fetch(`./data/search/idx-${b.id}.json`).then((r) => r.ok ? r.json() : []).catch(() => [])
        .then((arr) => arr.map((x) => ({ ...x, b: b.id, nx: norm(x.x), nt: norm(x.t) })))));
    docs = parts.flat();
    loading = false;
    return docs;
  }

  let timer;
  function onInput() { clearTimeout(timer); timer = setTimeout(run, 220); }

  async function run() {
    const term = q.trim();
    if (term.length < 2) { results = []; total = 0; return; }
    await load();
    const words = norm(term).split(/\s+/).filter(Boolean);
    const hits = [];
    for (const x of docs) {
      let score = 0, first = -1, count = 0, ok = true;
      for (const w of words) {
        const pos = x.nx.indexOf(w), inTitle = x.nt.includes(w);
        if (pos < 0 && !inTitle) { ok = false; break; }
        if (inTitle) score += 50;
        let c = 0, p = pos; while (p > -1 && c < 200) { c++; p = x.nx.indexOf(w, p + w.length); }
        count += c; score += Math.min(c, 40);
        if (pos > -1 && (first < 0 || pos < first)) first = pos;
      }
      if (ok) hits.push({ x, score, first, count });
    }
    hits.sort((a, b) => b.score - a.score || b.count - a.count);
    total = hits.length;
    results = hits.slice(0, 60).map(({ x, first, count }) => {
      const f = Math.max(0, first), a = Math.max(0, f - 70), z = Math.min(x.x.length, f + 140);
      const snip = x.x.slice(a, z), nsnip = x.nx.slice(a, z);
      let html = '', i = 0, m;
      const re = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
      const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
      while ((m = re.exec(nsnip))) { html += esc(snip.slice(i, m.index)) + '<mark>' + esc(snip.slice(m.index, m.index + m[0].length)) + '</mark>'; i = m.index + m[0].length; if (!m[0].length) re.lastIndex++; }
      html += esc(snip.slice(i));
      const [, b, n] = x.u.match(/book\/([a-z]+)\/(\d+|intro)/) || [];
      return { b, n: n === 'intro' ? 0 : +n, t: x.t, l: x.l, html: (a > 0 ? '… ' : '') + html + ' …', count };
    });
  }

  function open(r) { tap(); pushRecent(q.trim()); input?.blur(); read(r.b, r.n); }
  function use(t) { tap(); q = t; run(); }
</script>

<div class="scroll">
  <div class="head">
    <h1 class="title-xl">بحث</h1>
    <label class="field">
      <Icon name="search" size={20} />
      <input bind:this={input} bind:value={q} oninput={onInput} onfocus={load} type="search" enterkeyhint="search"
        placeholder="كلمة، حال، أو اسم باب…" autocomplete="off" autocorrect="off" spellcheck="false" />
      {#if q}<button class="clr" onclick={() => { q = ''; results = []; total = 0; input.focus(); }} aria-label="مسح"><Icon name="close" size={16} /></button>{/if}
    </label>
  </div>

  {#if q.trim().length >= 2}
    <p class="status">{loading ? 'نفتح الفهرس…' : total ? `${ar(total)} موضعاً${total > 60 ? '، أقربها أولاً' : ''}` : 'لا نتائج. جرّب كلمةً أقصر أو جذراً آخر.'}</p>
    <ol class="results">
      {#each results as r}
        {@const bk = cat.bookById[r.b]}
        <li>
          <button class="res press" onclick={() => open(r)}>
            <span class="rb" style="--h:{bk?.hue}">{bk?.t}، {r.l}</span>
            <span class="rt">{r.t}</span>
            <span class="rs">{@html r.html}</span>
          </button>
        </li>
      {/each}
    </ol>
  {:else}
    {#if store.recent.length}
      <div class="section-h"><h2>بحثت مؤخراً</h2><button class="more" onclick={() => { store.recent = []; save(); }}>مسح</button></div>
      <div class="wrap">{#each store.recent as r}<button class="chip press" onclick={() => use(r)}>{r}</button>{/each}</div>
    {/if}
    <div class="section-h"><h2>جرّب</h2></div>
    <div class="wrap">{#each SUGGEST as s}<button class="chip press" onclick={() => use(s)}>{s}</button>{/each}</div>
    <div class="section-h"><h2>تصفّح حسب الكتاب</h2></div>
    <div class="books">
      {#each cat.books as b}
        <button class="bk press" style="--h:{b.hue}" onclick={() => { tap(); go('Book', { id: b.id }); }}><i></i>{b.t}</button>
      {/each}
    </div>
  {/if}
  <div style="height: calc(var(--tabbar) + 24px)"></div>
</div>

<style>
  .head { position: sticky; top: 0; z-index: 5; padding: calc(var(--sat) + 28px) 16px 12px; background: var(--paper); }
  .head h1 { padding: 0 4px 10px; }
  .field { display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 14px; border-radius: 14px; background: var(--paper-2); color: var(--muted); }
  .field input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; font: 400 17px var(--ui); color: var(--ink); -webkit-appearance: none; }
  .field input::-webkit-search-cancel-button { display: none; }
  .clr { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--muted); color: var(--paper); }
  .status { padding: 4px 20px 6px; font: 500 13px var(--ui); color: var(--muted); }
  .results { list-style: none; margin: 0; padding: 0 16px; }
  .res { display: grid; gap: 3px; width: 100%; text-align: start; padding: 14px 4px; border-bottom: .5px solid var(--line); }
  .rb { font: 600 12px var(--ui); color: hsl(var(--h) 40% 38%); }
  :global([data-theme="night"]) .rb, :global([data-theme="black"]) .rb { color: hsl(var(--h) 45% 68%); }
  .rt { font: 700 17px/1.5 var(--display); }
  .rs { font: 400 14.5px/1.8 var(--read); color: var(--ink-2); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .rs :global(mark) { background: var(--hl); color: inherit; border-radius: 3px; }
  .wrap { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 20px; }
  .books { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 16px; }
  .bk { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 14px; background: var(--card); box-shadow: var(--shadow); font: 600 13.5px/1.4 var(--ui); text-align: start; }
  .bk i { width: 10px; height: 28px; border-radius: 3px; flex: none; background: hsl(var(--h) 40% 38%); }
</style>
