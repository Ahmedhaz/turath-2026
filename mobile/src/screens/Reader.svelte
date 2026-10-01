<script>
  import { onMount, onDestroy, tick as svelteTick } from 'svelte';
  import { App as CapApp } from '@capacitor/app';
  import { store, save, setProgress, addReadingTime, toggleBookmark, addHighlight, removeHighlight } from '../lib/state.svelte.js';
  import { nav, read, go, sheet } from '../lib/nav.svelte.js';
  import { loadChapter, ar, arGroup, duration, minutes, key, label } from '../lib/data.js';
  import { tap, thud, success, shareText, native } from '../lib/native.js';
  import { paint, unpaint } from '../lib/marks.js';
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';

  let { cat, b, n, at = null } = $props();
  const k = key(b, n);
  const unit = cat.unitByKey.get(k);
  const book = cat.bookById[b];
  const siblings = cat.unitsOf(b);
  const idx = siblings.findIndex((u) => u.n === n);
  const prev = siblings[idx - 1], next = siblings[idx + 1];

  let ch = $state(null);
  let scroller, prose;
  let chrome = $state(true), shown = $state(false);
  let pct = $state(store.progress[k]?.pct || 0);
  let current = $state(0);             // index of the section heading in view
  let panel = $state(null);            // 'toc' | 'type' | 'hl'
  let selBar = $state(null);           // { x, y, text } floating selection toolbar
  let toast = $state(null);
  let doneNow = $state(false);
  let activeHl = $state(null);
  const marked = $derived(store.bookmarks.some((x) => x.k === k));
  const s = $derived(store.settings);
  const totalMin = minutes(unit.w);
  const leftMin = $derived(Math.max(1, Math.round(totalMin * (1 - pct))));

  onMount(async () => {
    requestAnimationFrame(() => (shown = true));
    ch = await loadChapter(b, n);
    await svelteTick();
    for (const h of store.highlights.filter((h) => h.k === k)) paint(prose, h.text, h.id);
    const saved = store.progress[k];
    if (at) {
      scrollToId(at, false);
    } else if (saved?.y > 400 && !saved.done) {
      scroller.scrollTop = saved.y;
      toast = { t: `تابعت من حيث توقفت، بقي ${duration(Math.max(1, Math.round(totalMin * (1 - saved.pct))))}`, a: 'من البداية', f: () => scroller.scrollTo({ top: 0, behavior: 'smooth' }) };
      setTimeout(() => (toast = null), 4200);
    }
    setProgress(k, {});
    clock = setInterval(countTime, 5000);
    document.addEventListener('selectionchange', onSelection);
    if (native) appListener = await CapApp.addListener('appStateChange', ({ isActive }) => (active = isActive));
  });

  // reading time: counted in 5 s steps, only while the app is in front and the reader moved recently
  let clock, appListener, active = true, lastMove = Date.now(), pending = 0;
  function countTime() {
    if (!active || Date.now() - lastMove > 90_000) return;
    pending += 5;
    if (pending >= 15) { addReadingTime(pending); pending = 0; }
  }
  onDestroy(() => {
    clearInterval(clock);
    if (pending) addReadingTime(pending);
    document.removeEventListener('selectionchange', onSelection);
    appListener?.remove();
  });

  let lastY = 0, ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scroller.scrollTop, max = scroller.scrollHeight - scroller.clientHeight;
      lastMove = Date.now();
      if (Math.abs(y - lastY) > 6) { if (y > lastY && y > 120 && !panel) chrome = false; else if (y < lastY - 12) chrome = true; }
      if (max - y < 60) chrome = true; // at the end, bring the controls back for what comes next
      lastY = y;
      pct = max > 0 ? Math.min(1, y / max) : 0;
      const p = store.progress[k] || {};
      const patch = { y: Math.round(y), pct: Math.max(p.done ? 1 : 0, pct) };
      if (!p.done && pct > .96) { patch.done = true; patch.pct = 1; doneNow = true; success(); }
      store.progress[k] = { ...p, ...patch, at: Date.now() };
      save();
      if (ch?.toc.length) {
        const hs = prose.querySelectorAll('h2[id], h3[id]');
        let c = 0;
        hs.forEach((h, i) => { if (h.getBoundingClientRect().top < 140) c = i; });
        current = c;
      }
    });
  }

  function scrollToId(id, smooth = true) {
    const el = prose?.querySelector(`[id="${CSS.escape(id)}"]`);
    if (el) scroller.scrollTo({ top: el.offsetTop - 90, behavior: smooth ? 'smooth' : 'auto' });
  }

  function onTap(e) {
    if (e.target.closest('mark[data-hl]')) {
      activeHl = store.highlights.find((h) => h.id === e.target.closest('mark').dataset.hl);
      panel = 'hl'; tap(); return;
    }
    if (e.target.closest('a, button, summary') || String(getSelection())) return;
    chrome = !chrome;
  }

  function onSelection() {
    const sel = getSelection();
    const text = String(sel).trim();
    if (!text || !sel.rangeCount || !prose?.contains(sel.anchorNode)) { selBar = null; return; }
    const r = sel.getRangeAt(0).getBoundingClientRect();
    selBar = { x: Math.min(Math.max(r.left + r.width / 2, 120), innerWidth - 120), y: Math.max(r.top - 58, 70), text };
  }

  function highlight() {
    const text = selBar.text;
    const h = addHighlight(k, text);
    getSelection().removeAllRanges(); selBar = null;
    paint(prose, text, h.id); success();
  }
  function copySel() { navigator.clipboard?.writeText(selBar.text); tap(); toastMsg('نُسخ النص'); getSelection().removeAllRanges(); selBar = null; }
  function shareSel() {
    const q = selBar.text; getSelection().removeAllRanges(); selBar = null;
    sheet('quote', { q, src: `${book.by}، ${book.t}`, hue: book.hue });
  }
  function toastMsg(t) { toast = { t }; setTimeout(() => (toast = null), 1800); }

  function close() { shown = false; setTimeout(() => (nav.reader = null), 300); }
  function toAil(a) { nav.reader = null; nav.tab = 'guide'; go('Ailment', { a }); }

  const THEMES = [
    { id: 'auto', t: 'تلقائي', bg: 'linear-gradient(135deg,#F5EFE3 50%,#15130F 50%)' },
    { id: 'paper', t: 'ورق', bg: '#F5EFE3' }, { id: 'sepia', t: 'عتيق', bg: '#EFE2C8' },
    { id: 'night', t: 'ليل', bg: '#15130F' }, { id: 'black', t: 'حالك', bg: '#000' },
  ];
  const setS = (patch) => { Object.assign(store.settings, patch); save(); tap(); };
</script>

<div class="reader" class:shown style="--fs:{s.size}; --lh:{s.leading}; --rf:{s.font === 'amiri' ? 'var(--display)' : 'var(--read)'}">
  <div class="progress"><i style="transform: scaleX({pct})"></i></div>

  <header class="bar" class:hidden={!chrome}>
    <button class="ib press" onclick={() => { tap(); close(); }} aria-label="إغلاق"><Icon name="close" /></button>
    <div class="where"><span>{book.t}</span><small>{label(book, n)}</small></div>
    <div class="acts">
      <button class="ib press" class:on={marked} aria-label="علامة" onclick={() => { toggleBookmark(k) ? (success(), toastMsg('أُضيفت علامة')) : tap(); }}>
        <Icon name="bookmark" fill={marked} />
      </button>
    </div>
  </header>

  <div class="scroll" bind:this={scroller} onscroll={onScroll} onclick={onTap} role="presentation">
    <article class="page">
      <header class="head">
        <p class="kick">{book.t}، {label(book, n)}</p>
        {#if unit.m}
          <div class="matn"><span class="orn">❁</span><h1>{unit.m}</h1><span class="orn">❁</span></div>
          <p class="sub">{unit.t}</p>
        {:else}
          <h1 class="title">{unit.t}</h1>
        {/if}
        <p class="meta"><Icon name="clock" size={15} /> {duration(totalMin)}، {arGroup(unit.w)} كلمة</p>
        {#if unit.a.length}
          <div class="tags">
            {#each unit.a as a}<button class="tag press" onclick={() => toAil(a)}>{cat.ail[a][0]}</button>{/each}
          </div>
        {/if}
      </header>

      {#if ch}
        <div class="prose" bind:this={prose}>{@html ch.html.replace(/<h3 id="([^"]*حواشي[^"]*)">/, '<details class="notes"><summary id="$1">').replace(/(<summary[^>]*>[^<]*)<\/h3>([\s\S]*)$/, '$1</summary>$2</details>')}</div>

        <footer class="end">
          <div class="done-card" class:pop={doneNow}>
            <span class="tick"><Icon name="check" size={26} /></span>
            <p class="dt">{store.progress[k]?.done ? 'أتممت هذا الباب' : 'وصلت إلى آخر الباب'}</p>
            <p class="dd">{unit.a.length ? `يعالج: ${unit.a.map((a) => cat.ail[a][0]).slice(0, 3).join('، ')}` : book.t}</p>
          </div>
          {#if next}
            <button class="next press" style="--h:{book.hue}" onclick={() => { tap(); read(b, next.n); }}>
              <span class="nk">التالي: {label(book, next.n)}، {duration(minutes(next.w))}</span>
              <span class="nt">{next.m || next.t}</span>
              <span class="ng"><Icon name="back" size={22} /></span>
            </button>
          {:else}
            <p class="fin">آخر ما في الكتاب. بارك الله في وقتك.</p>
          {/if}
          {#if prev}
            <button class="prev press" onclick={() => { tap(); read(b, prev.n); }}>السابق: {prev.m ? label(book, prev.n) : prev.t}</button>
          {/if}
        </footer>
      {:else}
        <div class="loading">{#each Array(9) as _, i}<i style="width:{[96, 88, 92, 70, 94, 85, 90, 60, 80][i]}%"></i>{/each}</div>
      {/if}
    </article>
  </div>

  <nav class="dock" class:hidden={!chrome}>
    <button class="ib press" onclick={() => { tap(); panel = 'toc'; }} aria-label="الفهرس"><Icon name="toc" /></button>
    <div class="pill num">{pct >= .995 ? 'النهاية' : `${ar(Math.round(pct * 100))}٪، بقي ${duration(leftMin)}`}</div>
    <button class="ib press" onclick={() => { tap(); panel = 'type'; }} aria-label="المظهر"><Icon name="type" /></button>
  </nav>

  {#if selBar}
    <div class="selbar" style="left:{selBar.x}px; top:{selBar.y}px" data-nodrag>
      <button onpointerdown={(e) => e.preventDefault()} onclick={highlight}><Icon name="highlight" size={19} />تظليل</button>
      <button onpointerdown={(e) => e.preventDefault()} onclick={shareSel}><Icon name="share" size={19} />بطاقة</button>
      <button onpointerdown={(e) => e.preventDefault()} onclick={copySel}><Icon name="copy" size={19} />نسخ</button>
    </div>
  {/if}

  {#if toast}
    <div class="toast">{toast.t}{#if toast.a}<button onclick={() => { toast.f(); toast = null; }}>{toast.a}</button>{/if}</div>
  {/if}
</div>

{#if panel === 'toc'}
  <Sheet title="في هذا الباب" onclose={() => (panel = null)}>
    {#snippet children({ close })}
      <ol class="toc-list">
        {#each ch?.toc || [] as h, i}
          <li><button class:on={i === current} onclick={() => { tap(); close(); setTimeout(() => scrollToId(h.id), 120); }}>{h.t}</button></li>
        {/each}
      </ol>
    {/snippet}
  </Sheet>
{/if}

{#if panel === 'type'}
  <Sheet title="راحة القراءة" onclose={() => (panel = null)}>
    <div class="type">
      <div class="themes">
        {#each THEMES as t}
          <button class="th press" class:on={s.theme === t.id} onclick={() => setS({ theme: t.id })}>
            <i style="background:{t.bg}"></i><span>{t.t}</span>
          </button>
        {/each}
      </div>
      <div class="row">
        <button class="sz press" onclick={() => setS({ size: Math.max(.8, +(s.size - .08).toFixed(2)) })} aria-label="أصغر">أ</button>
        <input type="range" min=".8" max="1.6" step=".04" value={s.size} oninput={(e) => { store.settings.size = +e.currentTarget.value; save(); }} />
        <button class="sz big press" onclick={() => setS({ size: Math.min(1.6, +(s.size + .08).toFixed(2)) })} aria-label="أكبر">أ</button>
      </div>
      <div class="seg2">
        <button class:on={s.font === 'naskh'} onclick={() => setS({ font: 'naskh' })} style="font-family: var(--read)">نسخ</button>
        <button class:on={s.font === 'amiri'} onclick={() => setS({ font: 'amiri' })} style="font-family: var(--display)">أميري</button>
      </div>
      <div class="seg2">
        {#each [[1.75, 'متقارب'], [1.95, 'معتدل'], [2.2, 'فسيح']] as [v, t]}
          <button class:on={s.leading === v} onclick={() => setS({ leading: v })}>{t}</button>
        {/each}
      </div>
    </div>
  </Sheet>
{/if}

{#if panel === 'hl' && activeHl}
  <Sheet title="تظليل" onclose={() => { panel = null; activeHl = null; }}>
    {#snippet children({ close })}
      <div class="hl">
        <blockquote>{activeHl.text}</blockquote>
        <div class="hl-acts">
          <button class="btn ghost press" onclick={() => { close(); setTimeout(() => sheet('quote', { q: activeHl.text, src: `${book.by}، ${book.t}`, hue: book.hue }), 300); }}><Icon name="share" size={18} />شارك كبطاقة</button>
          <button class="btn ghost press" onclick={() => { shareText(`«${activeHl.text}»\n— ${book.by}، ${book.t}`); }}>نص</button>
          <button class="btn ghost danger press" onclick={() => { unpaint(prose, activeHl.id); removeHighlight(activeHl.id); thud(); close(); }}><Icon name="trash" size={18} /></button>
        </div>
      </div>
    {/snippet}
  </Sheet>
{/if}

<style>
  .reader { position: fixed; inset: 0; z-index: 60; background: var(--paper); transform: translateY(24px); opacity: 0;
    transition: transform .38s var(--ease-out), opacity .3s var(--ease); }
  .reader.shown { transform: none; opacity: 1; }
  .progress { position: absolute; inset: 0 0 auto 0; z-index: 12; height: calc(var(--sat) + 2px); pointer-events: none; }
  .progress i { position: absolute; inset: auto 0 0 0; height: 2px; background: var(--gold); transform-origin: right; transition: transform .2s linear; }

  .bar { position: absolute; inset: 0 0 auto 0; z-index: 10; height: calc(var(--sat) + 52px); padding: var(--sat) 8px 0;
    display: grid; grid-template-columns: 48px 1fr 48px; align-items: center;
    background: var(--blur-bg); backdrop-filter: saturate(1.5) blur(20px); -webkit-backdrop-filter: saturate(1.5) blur(20px);
    border-bottom: .5px solid var(--line); transition: transform .35s var(--ease-out), opacity .25s; }
  .bar.hidden { transform: translateY(-100%); opacity: 0; }
  .where { display: grid; text-align: center; line-height: 1.3; min-width: 0; }
  .where span { font: 600 14px var(--ui); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .where small { font: 500 12px var(--ui); color: var(--muted); }
  .acts { display: flex; justify-content: flex-end; }
  .ib { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; color: var(--ink-2); }
  .ib.on { color: var(--gold); }

  .scroll { -webkit-user-select: text; user-select: text; }
  .page { max-width: 680px; margin: 0 auto; padding: calc(var(--sat) + 76px) 22px calc(var(--sab) + 120px); }
  .head { text-align: center; padding-bottom: 26px; margin-bottom: 26px; border-bottom: .5px solid var(--line); -webkit-user-select: none; user-select: none; }
  .kick { font: 600 13px var(--ui); color: var(--gold); }
  .title { font: 700 calc(30px * var(--fs))/1.35 var(--display); margin: 8px 0 12px; text-wrap: balance; }
  .matn { margin: 18px 0 10px; display: grid; gap: 6px; justify-items: center; }
  .matn h1 { font: 400 calc(27px * var(--fs))/1.9 var(--display); text-wrap: balance; }
  .orn { color: var(--gold); font-size: 18px; opacity: .8; }
  .sub { font: 600 15px var(--ui); color: var(--teal); margin-bottom: 10px; }
  .meta { display: inline-flex; align-items: center; gap: 6px; font: 500 13px var(--ui); color: var(--muted); }
  .tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-top: 14px; }
  .tag { font: 500 12.5px var(--ui); padding: 4px 12px; border-radius: 999px; background: var(--teal-soft); color: var(--teal); }

  .prose { font-family: var(--rf); font-size: calc(19px * var(--fs)); line-height: var(--lh); color: var(--ink); }
  .prose :global(p) { margin: 0 0 1.05em; text-wrap: pretty; }
  .prose :global(h2), .prose :global(h3) { font: 700 calc(22px * var(--fs))/1.5 var(--display); color: var(--teal); margin: 1.6em 0 .55em; scroll-margin-top: 90px; }
  .prose :global(strong) { font-weight: 700; color: var(--ink); }
  .prose :global(ul), .prose :global(ol) { margin: 0 0 1.1em; padding-inline-start: 1.3em; }
  .prose :global(li) { margin: 0 0 .5em; padding-inline-start: .2em; }
  .prose :global(li::marker) { color: var(--gold); font-weight: 700; }
  .prose :global(hr) { border: 0; height: 22px; margin: 1.8em 0; background: radial-gradient(circle, var(--gold) 2.2px, transparent 2.6px) 0 50% / 22px 22px repeat-x; opacity: .55; width: 110px; margin-inline: auto; }
  .prose :global(blockquote) { margin: 1.2em 0; padding: .4em 1em; border-inline-start: 3px solid var(--gold); color: var(--ink-2); }
  .prose :global(mark) { background: var(--hl); color: inherit; border-radius: 3px; padding: .05em 0; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  .prose :global(a) { color: var(--teal); text-decoration: underline; text-underline-offset: 3px; }
  .prose :global(details.notes) { margin-top: 2em; padding: 14px 16px; border-radius: var(--r-sm); background: var(--paper-2); font-size: .82em; line-height: 1.9; }
  .prose :global(details.notes summary) { font: 600 15px var(--ui); color: var(--ink-2); cursor: pointer; list-style: none; -webkit-user-select: none; user-select: none; }
  .prose :global(details.notes summary::after) { content: ' ▾'; color: var(--muted); }
  .prose :global(details.notes[open] summary) { margin-bottom: 10px; }
  .prose :global(details.notes p) { margin-bottom: .6em; }
  .prose ::selection { background: var(--gold-soft); }

  .loading { display: grid; gap: 16px; padding-top: 10px; }
  .loading i { height: 14px; border-radius: 7px; background: var(--paper-2); animation: pulse 1.2s var(--ease) infinite alternate; }
  @keyframes pulse { to { opacity: .45; } }

  .end { display: grid; gap: 14px; margin-top: 40px; -webkit-user-select: none; user-select: none; }
  .done-card { text-align: center; padding: 24px 18px; border-radius: var(--r); background: var(--card); box-shadow: var(--shadow); }
  .tick { width: 54px; height: 54px; margin: 0 auto 10px; border-radius: 50%; display: grid; place-items: center; background: var(--teal); color: var(--paper); }
  .done-card.pop .tick { animation: pop .6s var(--ease-out); }
  @keyframes pop { 0% { transform: scale(.4); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
  .dt { font: 700 20px var(--display); }
  .dd { font: 500 14px var(--ui); color: var(--muted); margin-top: 2px; }
  .next { position: relative; display: grid; gap: 8px; text-align: start; padding: 20px 20px 20px 64px; border-radius: var(--r); color: #FBF5E8;
    background: linear-gradient(135deg, hsl(var(--h) 40% 34%), hsl(var(--h) 44% 22%)); box-shadow: var(--shadow-lg); }
  .nk { font: 500 13px var(--ui); opacity: .8; }
  .nt { font: 700 20px/1.85 var(--display); }
  .ng { position: absolute; left: 18px; top: 50%; transform: translateY(-50%) scaleX(-1); width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.16); }
  .prev { font: 500 14px var(--ui); color: var(--muted); padding: 10px; }
  .fin { text-align: center; font: 400 17px var(--display); color: var(--ink-2); padding: 10px; }

  .dock { position: absolute; inset: auto 0 0 0; z-index: 10; padding: 10px 14px calc(var(--sab) + 10px);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--blur-bg); backdrop-filter: saturate(1.5) blur(20px); -webkit-backdrop-filter: saturate(1.5) blur(20px);
    border-top: .5px solid var(--line); transition: transform .35s var(--ease-out), opacity .25s; }
  .dock.hidden { transform: translateY(100%); opacity: 0; }
  .pill { font: 500 13px var(--ui); color: var(--muted); }

  .selbar { position: fixed; z-index: 70; transform: translateX(-50%); display: flex; padding: 4px; border-radius: 14px; background: #24201A; color: #F3EADB; box-shadow: var(--shadow-lg); animation: rise .2s var(--ease-out); }
  .selbar button { display: flex; align-items: center; gap: 6px; padding: 8px 12px; font: 500 14px var(--ui); border-radius: 10px; }
  .selbar button + button { border-inline-start: .5px solid rgba(255,255,255,.15); border-radius: 0; }
  @keyframes rise { from { opacity: 0; transform: translate(-50%, 6px); } }

  .toast { position: absolute; z-index: 20; left: 50%; bottom: calc(var(--sab) + 84px); transform: translateX(-50%); display: flex; align-items: center; gap: 12px;
    padding: 10px 16px; border-radius: 14px; background: #24201A; color: #F3EADB; font: 500 14px var(--ui); white-space: nowrap; box-shadow: var(--shadow-lg); animation: rise .3s var(--ease-out); }
  .toast button { color: #E9C877; font-weight: 600; }

  .toc-list { list-style: none; margin: 0; padding: 0 12px 10px; }
  .toc-list button { display: block; width: 100%; text-align: start; padding: 12px 12px; border-radius: 12px; font: 500 15.5px/1.5 var(--ui); color: var(--ink-2); }
  .toc-list button.on { background: var(--teal-soft); color: var(--teal); font-weight: 600; }

  .type { display: grid; gap: 20px; padding: 6px 20px 14px; }
  .themes { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .th { display: grid; justify-items: center; gap: 6px; font: 500 12px var(--ui); color: var(--muted); }
  .th i { width: 46px; height: 46px; border-radius: 50%; box-shadow: inset 0 0 0 1px var(--line); }
  .th.on i { box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--teal); }
  .th.on { color: var(--teal); }
  .row { display: flex; align-items: center; gap: 14px; }
  .sz { width: 40px; height: 40px; border-radius: 50%; background: var(--paper-2); font: 600 14px var(--display); }
  .sz.big { font-size: 22px; }
  input[type=range] { flex: 1; accent-color: var(--teal); }
  .seg2 { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; padding: 3px; border-radius: 12px; background: var(--paper-2); }
  .seg2 button { height: 40px; border-radius: 10px; font: 500 15px var(--ui); color: var(--ink-2); transition: background .2s, color .2s; }
  .seg2 button.on { background: var(--raised); color: var(--ink); box-shadow: var(--shadow); }

  .hl { padding: 0 20px 10px; }
  .hl blockquote { margin: 0 0 16px; padding: 14px 16px; border-radius: 12px; background: var(--hl); font: 400 18px/1.9 var(--read); }
  .hl-acts { display: flex; gap: 8px; }
  .hl-acts .btn { height: 44px; padding: 0 16px; font-size: 14px; }
  .danger { color: #B4442F !important; background: rgba(180, 68, 47, .1) !important; }
</style>
