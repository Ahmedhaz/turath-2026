<script>
  import { store } from '../lib/state.svelte.js';
  import { go } from '../lib/nav.svelte.js';
  import { ar, arGroup, duration, minutes } from '../lib/data.js';
  import { tap } from '../lib/native.js';
  import Cover from '../components/Cover.svelte';

  let { cat } = $props();
  let shelf = $state(-1); // -1: all shelves
  let scrolled = $state(false);

  const progressOf = (id) => {
    const us = cat.unitsOf(id);
    return us.filter((u) => store.progress[`${u.b}/${u.n}`]?.done).length / (us.length || 1);
  };
  const started = $derived(cat.books.filter((b) => Object.keys(store.progress).some((k) => k.startsWith(b.id + '/'))));
  const total = cat.books.reduce((a, b) => a + b.w, 0);
</script>

<div class="scroll" onscroll={(e) => (scrolled = e.currentTarget.scrollTop > 50)}>
  <header class="mini" class:show={scrolled}><span>المكتبة</span></header>
  <div class="head">
    <h1 class="title-xl">المكتبة</h1>
    <p class="sub">{ar(cat.books.length)} كتاباً من أمهات التراث، بلسان مؤلفيها، في {arGroup(total)} كلمة.</p>
  </div>

  {#if started.length}
    <div class="section-h"><h2>على مكتبك</h2></div>
    <div class="hscroll desk">
      {#each started as b (b.id)}
        <button class="press" onclick={() => { tap(); go('Book', { id: b.id }); }}>
          <Cover book={b} w={112} progress={progressOf(b.id)} />
        </button>
      {/each}
    </div>
  {/if}

  <div class="hscroll seg">
    <button class="chip press" class:on={shelf === -1} onclick={() => { tap(); shelf = -1; }}>الكل</button>
    {#each cat.shelves as s, i}
      <button class="chip press" class:on={shelf === i} onclick={() => { tap(); shelf = i; }}>{s.t}</button>
    {/each}
  </div>

  {#each cat.shelves as s, i}
    {#if shelf === -1 || shelf === i}
      <div class="section-h"><h2>{s.t}</h2></div>
      <div class="list">
        {#each s.books as id (id)}
          {@const b = cat.bookById[id]}
          <button class="row press" onclick={() => { tap(); go('Book', { id }); }}>
            <Cover book={b} w={84} title={false} progress={progressOf(id)} />
            <div class="txt">
              <p class="t">{b.t}</p>
              <p class="by">{b.by}</p>
              <p class="lede">{b.lede}</p>
              <p class="meta">{ar(b.count)} {b.count > 10 ? b.lab : 'وحدات'}، {duration(minutes(b.w))}{b.wip ? '، قيد الكتابة' : ''}</p>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  {/each}
  <div style="height: calc(var(--tabbar) + 24px)"></div>
</div>

<style>
  .mini { position: sticky; top: 0; z-index: 5; height: calc(var(--sat) + 44px); padding-top: var(--sat); display: grid; place-items: center;
    font: 600 16px var(--ui); background: var(--blur-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    opacity: 0; transition: opacity .25s var(--ease); margin-bottom: calc(-1 * (var(--sat) + 44px)); pointer-events: none; border-bottom: .5px solid var(--line); }
  .mini.show { opacity: 1; }
  .head { padding: calc(var(--sat) + 28px) 20px 8px; }
  .sub { color: var(--muted); font: 400 15px/1.6 var(--ui); margin-top: 4px; }
  .desk { padding-bottom: 8px; }
  .seg { margin-top: 22px; }
  .list { display: grid; gap: 4px; padding: 0 12px; }
  .row { display: flex; gap: 16px; align-items: center; padding: 10px 8px; border-radius: var(--r); text-align: start; }
  .txt { flex: 1; min-width: 0; }
  .t { font: 700 19px/1.4 var(--display); }
  .by { font: 500 13px var(--ui); color: var(--teal); margin-top: 1px; }
  .lede { font: 400 13.5px/1.6 var(--ui); color: var(--ink-2); margin-top: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .meta { font: 500 12px var(--ui); color: var(--muted); margin-top: 6px; }
</style>
