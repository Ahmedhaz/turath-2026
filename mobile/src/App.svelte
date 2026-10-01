<script>
  import { onMount } from 'svelte';
  import { App as CapApp } from '@capacitor/app';
  import { SplashScreen } from '@capacitor/splash-screen';
  import { nav, TABS, selectTab, back } from './lib/nav.svelte.js';
  import { store, hydrate, applyTheme } from './lib/state.svelte.js';
  import { loadCatalog } from './lib/data.js';
  import { tap, statusBar, native } from './lib/native.js';
  import Icon from './components/Icon.svelte';
  import Screen from './Screen.svelte';
  import Reader from './screens/Reader.svelte';
  import Sheets from './Sheets.svelte';
  import Welcome from './screens/Welcome.svelte';

  let cat = $state(null);
  const LABELS = { today: 'اليوم', library: 'المكتبة', guide: 'الدليل', search: 'بحث', saved: 'محفوظاتي' };
  const ROOTS = { today: 'Today', library: 'Library', guide: 'Guide', search: 'Search', saved: 'Saved' };

  onMount(async () => {
    await hydrate();
    statusBar(applyTheme());
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => statusBar(applyTheme()));
    cat = await loadCatalog();
    requestAnimationFrame(() => SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {}));
    if (native) CapApp.addListener('backButton', () => { if (!back()) CapApp.exitApp(); });
  });

  $effect(() => { store.settings.theme; statusBar(applyTheme()); });

  // Edge swipe back: in a right-to-left app the gesture starts at the right edge and pulls left.
  let swipe = $state({ on: false, x: 0 });
  let sx = 0, sy = 0, tracking = false;
  function edgeDown(e) {
    if (nav.reader || nav.sheet || !nav.stacks[nav.tab].length) return;
    if (e.clientX < innerWidth - 28) return;
    tracking = true; sx = e.clientX; sy = e.clientY;
  }
  function edgeMove(e) {
    if (!tracking) return;
    const dx = sx - e.clientX;
    if (!swipe.on && Math.abs(e.clientY - sy) > Math.abs(dx)) { tracking = false; return; }
    swipe = { on: true, x: Math.max(0, dx) };
  }
  function edgeUp() {
    if (!tracking) return;
    tracking = false;
    if (swipe.x > innerWidth * .32) { tap(); back(); }
    swipe = { on: false, x: 0 };
  }
</script>

<svelte:window onpointerdown={edgeDown} onpointermove={edgeMove} onpointerup={edgeUp} onpointercancel={edgeUp} />

{#if cat}
  <div class="tabs-host">
    {#each TABS as t (t)}
      <section class="tab" class:active={nav.tab === t} aria-hidden={nav.tab !== t}>
        <Screen screen={ROOTS[t]} props={{}} {cat} depth={0} covered={nav.stacks[t].length > 0} />
        {#each nav.stacks[t] as s, i (s.id)}
          <Screen screen={s.screen} props={s.props} {cat} depth={i + 1}
            covered={i < nav.stacks[t].length - 1}
            drag={i === nav.stacks[t].length - 1 && nav.tab === t ? swipe : null} />
        {/each}
      </section>
    {/each}
  </div>

  <nav class="tabbar" class:hidden={!!nav.reader}>
    {#each TABS as t (t)}
      <button class="tb press" class:on={nav.tab === t} onclick={() => { tap(); selectTab(t); }} aria-label={LABELS[t]}>
        <Icon name={t} size={25} fill={nav.tab === t && (t === 'saved')} />
        <span>{LABELS[t]}</span>
      </button>
    {/each}
  </nav>

  {#if nav.reader}
    {#key `${nav.reader.b}/${nav.reader.n}`}
      <Reader {cat} b={nav.reader.b} n={nav.reader.n} at={nav.reader.at} />
    {/key}
  {/if}

  <Sheets {cat} />

  {#if !store.onboarded}
    <Welcome {cat} />
  {/if}
{/if}

<style>
  .tabs-host { position: fixed; inset: 0; }
  .tab { position: absolute; inset: 0; visibility: hidden; }
  .tab.active { visibility: visible; }
  .tabbar {
    position: fixed; inset: auto 0 0 0; z-index: 40; height: var(--tabbar); padding-bottom: var(--sab);
    display: grid; grid-template-columns: repeat(5, 1fr);
    background: var(--blur-bg); backdrop-filter: saturate(1.6) blur(22px); -webkit-backdrop-filter: saturate(1.6) blur(22px);
    border-top: .5px solid var(--line); transition: transform .4s var(--ease-out);
  }
  .tabbar.hidden { transform: translateY(110%); }
  .tb { display: grid; justify-items: center; align-content: center; gap: 2px; color: var(--muted); font: 500 11px var(--ui); }
  .tb.on { color: var(--teal); }
</style>
