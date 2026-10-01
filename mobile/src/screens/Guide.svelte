<script>
  import { go, sheet } from '../lib/nav.svelte.js';
  import { ar } from '../lib/data.js';
  import { tap } from '../lib/native.js';
  import Icon from '../components/Icon.svelte';

  let { cat } = $props();
  const count = (a) => cat.units.filter((u) => u.a.includes(a)).length;
  const ARC_ICON = ['❂', '⌂', '◈', '❖'];
  let scrolled = $state(false);
</script>

<div class="scroll" onscroll={(e) => (scrolled = e.currentTarget.scrollTop > 50)}>
  <header class="mini" class:show={scrolled}><span>الدليل</span></header>
  <div class="head">
    <h1 class="title-xl">الدليل</h1>
    <p class="sub">التراث يملك الدواء، وقد فقد الفهرس. هذا هو الفهرس: ابدأ مما تجده في نفسك، والدليل يجمع لك الأبواب التي تعالجه من الكتب كلها.</p>
  </div>

  <div class="section-h"><h2>بماذا تشعر؟</h2></div>
  <div class="feels">
    {#each cat.feel as f, i}
      <button class="feel press" onclick={() => { tap(); sheet('prescription', { feel: f }); }}>
        <span>{f.t}</span><Icon name="chevron" size={18} />
      </button>
    {/each}
  </div>

  <div class="section-h"><h2>أين يقع الأمر؟</h2></div>
  <div class="arcs">
    {#each cat.arcs as a, i}
      <button class="arc press" style="--i:{i}" onclick={() => { tap(); go('Ailment', { arc: i }); }}>
        <span class="g">{ARC_ICON[i]}</span><b>{a[0]}</b>
        <small>{ar(cat.units.filter((u) => u.c.includes(i)).length)} باباً</small>
      </button>
    {/each}
  </div>

  <div class="section-h"><h2>العلل الاثنتان والعشرون</h2></div>
  <p class="note">سبع أُسَر، والقاعدة بينها: الدواء بالضدّ.</p>
  {#each cat.fam as [name, , ails]}
    <div class="fam">
      <p class="fh">{name}</p>
      <div class="ails">
        {#each ails as a}
          <button class="ail press" onclick={() => { tap(); go('Ailment', { a }); }}>
            {cat.ail[a][0]}<span class="c num">{ar(count(a))}</span>
          </button>
        {/each}
      </div>
    </div>
  {/each}

  <div class="section-h"><h2>طبقات الإنسان</h2></div>
  <div class="layers">
    {#each cat.layers as l, i}
      <button class="layer press" onclick={() => { tap(); go('Ailment', { layer: i }); }}>
        <span class="ln num">{ar(i)}</span>
        <span class="lt"><b>{l[0]}</b><small>{l[2]}</small></span>
        <Icon name="chevron" size={18} />
      </button>
    {/each}
  </div>
  <div style="height: calc(var(--tabbar) + 24px)"></div>
</div>

<style>
  .mini { position: sticky; top: 0; z-index: 5; height: calc(var(--sat) + 44px); padding-top: var(--sat); display: grid; place-items: center;
    font: 600 16px var(--ui); background: var(--blur-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    opacity: 0; transition: opacity .25s var(--ease); margin-bottom: calc(-1 * (var(--sat) + 44px)); pointer-events: none; border-bottom: .5px solid var(--line); }
  .mini.show { opacity: 1; }
  .head { padding: calc(var(--sat) + 28px) 20px 4px; }
  .sub { color: var(--ink-2); font: 400 16px/1.85 var(--read); margin-top: 8px; }
  .feels { display: grid; gap: 8px; padding: 0 16px; }
  .feel { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-radius: 16px; background: var(--card); box-shadow: var(--shadow); font: 500 16px/1.4 var(--ui); text-align: start; }
  .feel :global(svg) { color: var(--muted); flex: none; }
  .arcs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 16px; }
  .arc { display: grid; gap: 2px; justify-items: start; padding: 16px; border-radius: 18px; text-align: start;
    background: linear-gradient(140deg, hsl(calc(160 + var(--i) * 45) 40% 45% / .16), hsl(calc(160 + var(--i) * 45) 40% 45% / .05)); }
  .arc .g { font-size: 22px; color: hsl(calc(160 + var(--i) * 45) 35% 38%); margin-bottom: 6px; }
  .arc b { font: 700 20px var(--display); }
  .arc small { font: 500 12px var(--ui); color: var(--muted); }
  .note { padding: 0 20px 4px; margin-top: -6px; font: 400 14px var(--ui); color: var(--muted); }
  .fam { padding: 10px 20px 4px; }
  .fh { font: 600 13px var(--ui); color: var(--gold); margin-bottom: 8px; }
  .ails { display: flex; flex-wrap: wrap; gap: 8px; }
  .ail { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 999px; background: var(--card); box-shadow: inset 0 0 0 1px var(--line); font: 500 14.5px var(--ui); }
  .ail .c { font: 600 11px var(--ui); color: var(--teal); background: var(--teal-soft); padding: 1px 7px; border-radius: 999px; }
  .layers { display: grid; padding: 0 16px; }
  .layer { display: flex; align-items: center; gap: 14px; padding: 14px 6px; border-bottom: .5px solid var(--line); text-align: start; }
  .ln { width: 34px; height: 34px; flex: none; border-radius: 10px; display: grid; place-items: center; background: var(--gold-soft); color: var(--gold); font: 700 16px var(--display); }
  .lt { flex: 1; display: grid; }
  .lt b { font: 700 17px var(--display); }
  .lt small { font: 400 13px/1.5 var(--ui); color: var(--muted); }
  .layer :global(svg) { color: var(--muted); }
</style>
