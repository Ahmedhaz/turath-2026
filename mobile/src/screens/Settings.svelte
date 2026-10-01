<script>
  import { store, save } from '../lib/state.svelte.js';
  import { ar } from '../lib/data.js';
  import { tap, thud, shareText } from '../lib/native.js';
  import NavBar from '../components/NavBar.svelte';
  import Icon from '../components/Icon.svelte';

  let { cat } = $props();
  const THEMES = [['auto', 'تلقائي'], ['paper', 'ورق'], ['sepia', 'عتيق'], ['night', 'ليل'], ['black', 'حالك']];
  let confirm = $state(false);
  const set = (p) => { Object.assign(store.settings, p); save(); tap(); };
  const focusNames = $derived((store.focus || []).map((a) => cat.ail[a][0]).join('، '));
</script>

<NavBar title="الإعدادات" solid />
<div class="scroll">
  <div class="wrap">
    <p class="gh">المظهر</p>
    <div class="group">
      <div class="seg">
        {#each THEMES as [id, t]}<button class:on={store.settings.theme === id} onclick={() => set({ theme: id })}>{t}</button>{/each}
      </div>
      <div class="item"><span>حجم الخط</span>
        <span class="stepper">
          <button onclick={() => set({ size: Math.max(.8, +(store.settings.size - .08).toFixed(2)) })}>−</button>
          <b class="num">{ar(Math.round(store.settings.size * 100))}٪</b>
          <button onclick={() => set({ size: Math.min(1.6, +(store.settings.size + .08).toFixed(2)) })}>+</button>
        </span>
      </div>
      <div class="item"><span>خط القراءة</span>
        <span class="seg mini">
          <button class:on={store.settings.font === 'naskh'} onclick={() => set({ font: 'naskh' })}>نسخ</button>
          <button class:on={store.settings.font === 'amiri'} onclick={() => set({ font: 'amiri' })}>أميري</button>
        </span>
      </div>
      <p class="preview" style="font-family:{store.settings.font === 'amiri' ? 'var(--display)' : 'var(--read)'}; font-size:{19 * store.settings.size}px; line-height:{store.settings.leading}">
        من علامات الاستناد إلى العمل، نقصان الرجاء عند وجود الزلل.
      </p>
    </div>

    <p class="gh">ما تعمل عليه</p>
    <div class="group">
      <button class="item press" onclick={() => { tap(); store.onboarded = false; save(); }}>
        <span>{focusNames || 'لم تختر بعد'}</span><span class="lnk">غيّر</span>
      </button>
    </div>

    <p class="gh">عن التطبيق</p>
    <div class="group">
      <a class="item" href="https://ahmedhaz.github.io/turath-2026/about/" target="_blank" rel="noopener"><span>المنهج والإشراف</span><Icon name="chevron" size={18} /></a>
      <a class="item" href="https://ahmedhaz.github.io/turath-2026/research/" target="_blank" rel="noopener"><span>أوراق المشروع وأبحاثه</span><Icon name="chevron" size={18} /></a>
      <button class="item press" onclick={() => shareText('مدونة استئناف التراث الفكري والروحي لإنسان ٢٠٢٦\nhttps://ahmedhaz.github.io/turath-2026/', 'Turath2026')}><span>شارك التطبيق</span><Icon name="share" size={18} /></button>
    </div>

    <p class="gh">بياناتك</p>
    <div class="group">
      {#if !confirm}
        <button class="item press danger" onclick={() => { thud(); confirm = true; }}><span>امسح التقدّم والمحفوظات</span></button>
      {:else}
        <div class="item"><span>متأكد؟ لا يمكن التراجع.</span>
          <span class="row">
            <button class="lnk" onclick={() => (confirm = false)}>إلغاء</button>
            <button class="lnk danger" onclick={() => { Object.assign(store, { progress: {}, last: null, bookmarks: [], highlights: [], saved: [], days: {}, recent: [] }); save(); thud(); confirm = false; }}>امسح</button>
          </span>
        </div>
      {/if}
    </div>
    <p class="foot">كل ما تقرؤه وتحفظه يبقى على جهازك وحده.<br>{ar(cat.books.length)} كتاباً، {ar(cat.units.length)} وحدة، تعمل بلا إنترنت</p>
  </div>
</div>

<style>
  .wrap { padding: calc(var(--sat) + 64px) 16px calc(var(--sab) + 90px); }
  .gh { font: 600 13px var(--ui); color: var(--muted); padding: 20px 6px 8px; }
  .group { border-radius: var(--r); background: var(--card); box-shadow: var(--shadow); overflow: hidden; }
  .item { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; min-height: 52px; padding: 10px 16px; text-align: start; font: 500 15.5px var(--ui); }
  .item + .item, .seg + .item { border-top: .5px solid var(--line); }
  .item :global(svg) { color: var(--muted); }
  .seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; margin: 12px; padding: 3px; border-radius: 12px; background: var(--paper-2); }
  .seg.mini { margin: 0; width: 140px; }
  .seg button { height: 36px; border-radius: 9px; font: 500 14px var(--ui); color: var(--ink-2); }
  .seg button.on { background: var(--raised); color: var(--ink); box-shadow: var(--shadow); }
  .stepper { display: flex; align-items: center; gap: 12px; }
  .stepper button { width: 34px; height: 34px; border-radius: 50%; background: var(--paper-2); font: 600 18px var(--ui); }
  .stepper b { min-width: 46px; text-align: center; font: 600 14px var(--ui); }
  .preview { padding: 14px 16px 18px; border-top: .5px solid var(--line); color: var(--ink-2); }
  .lnk { color: var(--teal); font: 600 15px var(--ui); }
  .row { display: flex; gap: 18px; }
  .danger { color: #B4442F; }
  .foot { text-align: center; font: 400 13px/1.8 var(--ui); color: var(--muted); padding: 28px 10px; }
</style>
