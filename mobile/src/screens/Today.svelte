<script>
  import { store, streak, week, toggleSaved } from '../lib/state.svelte.js';
  import { nav, read, go, sheet } from '../lib/nav.svelte.js';
  import { ar, dates, greeting, dayIndex, minutes, duration, label } from '../lib/data.js';
  import { tap, success } from '../lib/native.js';
  import Icon from '../components/Icon.svelte';
  import Cover from '../components/Cover.svelte';

  let { cat } = $props();
  const d = dates();
  const hello = greeting();

  const quote = $derived(cat.quotes[dayIndex(cat.quotes.length)]);
  const qBook = $derived(cat.bookById[quote.u.split('/')[0]]);
  const savedQ = $derived(store.saved.some((s) => s.q === quote.q));

  const last = $derived(store.last && cat.unitByKey.get(store.last));
  const lastP = $derived(store.last ? store.progress[store.last] : null);
  const lastBook = $derived(last ? cat.bookById[last.b] : null);
  const left = $derived(last ? Math.max(1, Math.round(minutes(last.w) * (1 - (lastP?.pct || 0)))) : 0);

  const days = $derived(week());
  const weekMin = $derived(days.reduce((a, b) => a + b.min, 0));
  const maxMin = $derived(Math.max(10, ...days.map((x) => x.min)));
  const run = $derived(streak());
  const done = $derived(Object.values(store.progress).filter((p) => p.done).length);
  const DAY = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

  // a chapter for you: from what the reader said they feel, else a gentle daily pick; never one already done
  const pick = $derived.by(() => {
    const focus = store.focus || [];
    const pool = cat.units.filter((u) => !store.progress[`${u.b}/${u.n}`]?.done && u.b !== 'hikam' &&
      (!focus.length || u.a.some((a) => focus.includes(a))));
    const from = pool.length ? pool : cat.units;
    return from[dayIndex(from.length, 3)];
  });
  const pickBook = $derived(cat.bookById[pick.b]);

  let scrolled = $state(false);
</script>

<div class="scroll" onscroll={(e) => (scrolled = e.currentTarget.scrollTop > 40)}>
  <header class="mini" class:show={scrolled}><span>اليوم</span></header>

  <div class="top">
    <div>
      <p class="eyebrow">{d.weekday}، {d.hijri}</p>
      <h1 class="title-xl">{hello}</h1>
    </div>
    {#if run > 0}
      <div class="streak" title="أيام متتالية"><Icon name="flame" size={18} fill /><b class="num">{ar(run)}</b></div>
    {/if}
  </div>

  <!-- the day's wisdom -->
  <article class="wisdom" style="--h:{qBook.hue}">
    <div class="w-pat">{@html qBook.cover}</div>
    <p class="w-k">حكمة اليوم</p>
    <blockquote class="w-q">{quote.q}</blockquote>
    <p class="w-t">{quote.t}</p>
    <div class="w-actions">
      <button class="w-read press" onclick={() => { tap(); read(...quote.u.split('/')); }}>
        اقرأ شرحها <Icon name="chevron" size={18} />
      </button>
      <div class="w-icons">
        <button class="ic press" class:on={savedQ} aria-label="احفظ" onclick={() => { toggleSaved(quote.q, quote.u) ? success() : tap(); }}>
          <Icon name="heart" size={22} fill={savedQ} />
        </button>
        <button class="ic press" aria-label="شارك" onclick={() => { tap(); sheet('quote', { q: quote.q, src: qBook.by, hue: qBook.hue }); }}>
          <Icon name="share" size={22} />
        </button>
      </div>
    </div>
  </article>

  {#if last}
    <div class="section-h"><h2>تابع القراءة</h2></div>
    <button class="resume press" onclick={() => { tap(); read(last.b, last.n); }}>
      <Cover book={lastBook} w={64} title={false} />
      <div class="r-text">
        <p class="eyebrow">{lastBook.t}، {label(lastBook, last.n)}</p>
        <p class="r-t">{last.t}</p>
        <div class="r-bar"><i style="width:{Math.round((lastP?.pct || 0) * 100)}%"></i></div>
        <p class="r-left">{lastP?.done ? 'أتممته، اقرأه مرة أخرى' : `بقي ${duration(left)}`}</p>
      </div>
      <span class="r-go"><Icon name="play" size={18} fill /></span>
    </button>
  {/if}

  <div class="section-h"><h2>بماذا تشعر اليوم؟</h2></div>
  <div class="hscroll feel">
    {#each cat.feel as f}
      <button class="chip press" onclick={() => { tap(); sheet('prescription', { feel: f }); }}>{f.t}</button>
    {/each}
  </div>

  <div class="section-h"><h2>{store.focus?.length ? 'اختيرَ لك' : 'من رفوف المكتبة'}</h2></div>
  <button class="pick press" style="--h:{pickBook.hue}" onclick={() => { tap(); read(pick.b, pick.n); }}>
    <div class="p-cover"><Cover book={pickBook} w={88} /></div>
    <div class="p-text">
      <p class="eyebrow">{label(pickBook, pick.n)}، {duration(minutes(pick.w))}</p>
      <p class="p-t">{pick.t}</p>
      {#if pick.a.length}
        <div class="p-tags">
          {#each pick.a.slice(0, 3) as a}<span>{cat.ail[a][0]}</span>{/each}
        </div>
      {/if}
    </div>
  </button>

  <div class="section-h"><h2>أسبوعك</h2></div>
  <div class="week card">
    <div class="stats">
      <div><b class="num">{ar(weekMin)}</b><span>دقيقة هذا الأسبوع</span></div>
      <div><b class="num">{ar(done)}</b><span>{done === 1 ? 'وحدة أتممتها' : 'وحدات أتممتها'}</span></div>
      <div><b class="num">{ar(run)}</b><span>{run === 1 ? 'يوم متتالٍ' : 'أيام متتالية'}</span></div>
    </div>
    <div class="bars">
      {#each days as x, i}
        <div class="bar" class:today={i === 6}>
          <i style="height:{Math.max(4, (x.min / maxMin) * 100)}%" class:zero={!x.min}></i>
          <span>{DAY[x.day]}</span>
        </div>
      {/each}
    </div>
  </div>

  <div style="height: calc(var(--tabbar) + 28px)"></div>
</div>

<style>
  .mini { position: sticky; top: 0; z-index: 5; height: calc(var(--sat) + 44px); padding-top: var(--sat); display: grid; place-items: center;
    font: 600 16px var(--ui); background: var(--blur-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-bottom: .5px solid transparent; opacity: 0; transition: opacity .25s var(--ease); margin-bottom: calc(-1 * (var(--sat) + 44px)); pointer-events: none; }
  .mini.show { opacity: 1; border-color: var(--line); }
  .top { display: flex; align-items: flex-end; justify-content: space-between; padding: calc(var(--sat) + 28px) 20px 18px; }
  .streak { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 999px; background: var(--gold-soft); color: var(--gold); font: 700 15px var(--ui); }

  .wisdom { position: relative; margin: 0 16px; padding: 26px 22px 18px; border-radius: 26px; overflow: hidden; color: #FBF5E8;
    background: radial-gradient(120% 90% at 85% 0%, hsl(var(--h) 42% 36%), hsl(var(--h) 46% 18%)); box-shadow: var(--shadow-lg); isolation: isolate; }
  .w-pat { position: absolute; inset: 0; opacity: .18; z-index: -1; mask-image: linear-gradient(180deg, #000, transparent 75%); -webkit-mask-image: linear-gradient(180deg, #000, transparent 75%); }
  .w-pat :global(svg) { width: 100%; height: 100%; }
  .w-pat :global(text), .w-pat :global(rect:first-child) { display: none; }
  .w-k { font: 600 13px var(--ui); opacity: .75; letter-spacing: .02em; }
  .w-q { margin: 14px 0 12px; font: 400 25px/1.75 var(--display); text-wrap: pretty; }
  .w-t { font: 500 14px/1.5 var(--ui); opacity: .8; }
  .w-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 20px; }
  .w-read { display: inline-flex; align-items: center; gap: 4px; height: 42px; padding: 0 16px 0 10px; border-radius: 999px; background: rgba(255,255,255,.16); font: 600 15px var(--ui); }
  .w-icons { display: flex; gap: 6px; }
  .ic { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.12); }
  .ic.on { color: #F2C66D; }

  .resume { display: flex; align-items: center; gap: 14px; width: calc(100% - 32px); margin: 0 16px; padding: 14px; border-radius: var(--r); background: var(--card); box-shadow: var(--shadow); text-align: start; }
  .r-text { flex: 1; min-width: 0; }
  .r-t { font: 700 18px/1.4 var(--display); margin: 2px 0 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .r-bar { height: 4px; border-radius: 2px; background: var(--paper-2); overflow: hidden; }
  .r-bar i { display: block; height: 100%; background: var(--teal); border-radius: 2px; }
  .r-left { font: 500 13px var(--ui); color: var(--muted); margin-top: 6px; }
  .r-go { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--teal); color: var(--paper); flex: none; transform: scaleX(-1); }

  .feel { padding-bottom: 4px; }

  .pick { display: flex; gap: 16px; align-items: center; width: calc(100% - 32px); margin: 0 16px; padding: 16px; border-radius: var(--r); text-align: start;
    background: linear-gradient(135deg, hsl(var(--h) 40% 50% / .14), hsl(var(--h) 40% 50% / .04)); box-shadow: inset 0 0 0 1px hsl(var(--h) 30% 40% / .14); }
  .p-text { flex: 1; min-width: 0; }
  .p-t { font: 700 19px/1.45 var(--display); margin: 4px 0 8px; }
  .p-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .p-tags span { font: 500 12px var(--ui); padding: 3px 10px; border-radius: 999px; background: var(--card); color: var(--ink-2); }

  .card { margin: 0 16px; padding: 18px; border-radius: var(--r); background: var(--card); box-shadow: var(--shadow); }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stats div { display: grid; }
  .stats b { font: 700 26px/1.2 var(--display); color: var(--teal); }
  .stats span { font: 500 12px/1.4 var(--ui); color: var(--muted); }
  .bars { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; height: 92px; margin-top: 18px; }
  .bar { display: grid; grid-template-rows: 1fr auto; justify-items: center; gap: 6px; }
  .bar i { width: 100%; max-width: 26px; align-self: end; border-radius: 7px; background: var(--teal-soft); }
  .bar.today i { background: var(--teal); }
  .bar i.zero { background: var(--paper-2); }
  .bar span { font: 600 12px var(--ui); color: var(--muted); }
  .bar.today span { color: var(--teal); }
</style>
