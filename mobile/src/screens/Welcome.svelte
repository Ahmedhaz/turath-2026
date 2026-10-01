<script>
  import { onMount } from 'svelte';
  import { store, save } from '../lib/state.svelte.js';
  import { ar } from '../lib/data.js';
  import { tap, success } from '../lib/native.js';

  let { cat } = $props();
  let step = $state(0), shown = $state(false), leaving = $state(false);
  let picked = $state(new Set((store.focus || []).flatMap((a) => cat.feel.filter((f) => f.a.includes(a)).map((f) => f.t))));
  onMount(() => requestAnimationFrame(() => (shown = true)));

  const THEMES = [['paper', 'ورق', '#F5EFE3'], ['sepia', 'عتيق', '#EFE2C8'], ['night', 'ليل', '#15130F'], ['auto', 'تلقائي', 'linear-gradient(135deg,#F5EFE3 50%,#15130F 50%)']];

  function toggle(f) {
    tap();
    const s = new Set(picked);
    s.has(f.t) ? s.delete(f.t) : s.add(f.t);
    picked = s;
  }
  function finish() {
    store.focus = [...new Set(cat.feel.filter((f) => picked.has(f.t)).flatMap((f) => f.a))];
    store.onboarded = true;
    success();
    leaving = true;
    setTimeout(save, 0);
  }
  const next = () => { tap(); step < 2 ? step++ : finish(); };
</script>

<div class="wel" class:shown class:leaving>
  <div class="dots">{#each [0, 1, 2] as i}<i class:on={i === step}></i>{/each}</div>
  <button class="skip" onclick={finish}>تخطَّ</button>

  {#key step}
    <section class="step">
      {#if step === 0}
        <div class="mark">
          <svg viewBox="0 0 64 64" width="88" height="88"><rect width="64" height="64" rx="16" fill="#1F5E57"/><g fill="none" stroke="#F5EFE3" stroke-width="3" stroke-linecap="round"><path d="M14 46h36"/><path d="M18 46V22M26 46V16M34 46V24M42 46V18"/></g><circle cx="46" cy="14" r="4" fill="#D6B066"/></svg>
        </div>
        <h1 class="big">التراث يملك الدواء،<br />وقد فقد الفهرس.</h1>
        <p class="lead">أمهات الكتب، من الغزالي وابن عطاء الله وابن عربي إلى الشاطبي وابن خلدون، أُعيد اشتقاقها <b>بلسان مؤلفيها</b> لإنسانٍ يحمل هاتفاً في جيبه.</p>
        <div class="facts">
          <span><b class="num">{ar(cat.books.length)}</b>كتاباً</span>
          <span><b class="num">{ar(cat.units.length)}</b>وحدة</span>
          <span><b>بلا</b>إنترنت</span>
        </div>
      {:else if step === 1}
        <h1 class="mid">بماذا تشعر هذه الأيام؟</h1>
        <p class="lead">اختر ما يشبهك، ولو أكثر من واحد. نرتّب لك الأبواب التي تعالجه، ولا يراه أحد غيرك.</p>
        <div class="feel">
          {#each cat.feel as f}
            <button class="fc press" class:on={picked.has(f.t)} onclick={() => toggle(f)}>{f.t}</button>
          {/each}
        </div>
      {:else}
        <h1 class="mid">كيف تحب أن تقرأ؟</h1>
        <p class="lead">تغيّرها متى شئت من زر <b>أ</b> في القارئ.</p>
        <div class="themes">
          {#each THEMES as [id, t, bg]}
            <button class="th press" class:on={store.settings.theme === id} onclick={() => { tap(); store.settings.theme = id; save(); }}>
              <i style="background:{bg}"></i><span>{t}</span>
            </button>
          {/each}
        </div>
        <div class="size">
          <span>أ</span>
          <input type="range" min=".8" max="1.6" step=".04" bind:value={store.settings.size} oninput={save} />
          <span class="b">أ</span>
        </div>
        <p class="sample" style="font-size:{19 * store.settings.size}px">
          «اجتهادك فيما ضُمن لك، وتقصيرك فيما طُلب منك، دليلٌ على انطماس البصيرة منك.»
        </p>
      {/if}
    </section>
  {/key}

  <div class="foot">
    <button class="btn block press" onclick={next}>
      {step === 0 ? 'ابدأ' : step === 1 ? (picked.size ? `تابع، ${ar(picked.size)} اختيار` : 'تابع') : 'ادخل المكتبة'}
    </button>
  </div>
</div>

<style>
  .wel { position: fixed; inset: 0; z-index: 100; background: var(--paper); display: flex; flex-direction: column; padding: calc(var(--sat) + 18px) 24px calc(var(--sab) + 18px);
    opacity: 0; transition: opacity .45s var(--ease), transform .45s var(--ease-out); }
  .wel.shown { opacity: 1; }
  .wel.leaving { opacity: 0; transform: scale(1.04); pointer-events: none; }
  .dots { display: flex; gap: 6px; justify-content: center; }
  .dots i { width: 7px; height: 7px; border-radius: 4px; background: var(--line); background: color-mix(in srgb, var(--ink) 18%, transparent); transition: width .3s var(--ease), background .3s; }
  .dots i.on { width: 22px; background: var(--teal); }
  .skip { position: absolute; top: calc(var(--sat) + 10px); left: 18px; font: 500 14px var(--ui); color: var(--muted); padding: 6px; }
  .step { flex: 1; display: flex; flex-direction: column; justify-content: center; animation: in .5s var(--ease-out); overflow-y: auto; }
  @keyframes in { from { opacity: 0; transform: translateX(-24px); } }
  .mark { margin-bottom: 28px; }
  .mark svg { border-radius: 20px; box-shadow: var(--shadow-lg); }
  .big { font: 700 38px/1.45 var(--display); }
  .mid { font: 700 31px/1.4 var(--display); }
  .lead { font: 400 17px/1.85 var(--read); color: var(--ink-2); margin-top: 14px; }
  .facts { display: flex; gap: 26px; margin-top: 30px; }
  .facts span { display: grid; font: 500 13px var(--ui); color: var(--muted); }
  .facts b { font: 700 28px/1.2 var(--display); color: var(--teal); }
  .feel { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
  .fc { padding: 11px 16px; border-radius: 999px; background: var(--card); box-shadow: inset 0 0 0 1px var(--line); font: 500 15px var(--ui); transition: background .2s, color .2s; }
  .fc.on { background: var(--teal); color: var(--paper); box-shadow: none; }
  .themes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 26px; }
  .th { display: grid; justify-items: center; gap: 8px; font: 500 13px var(--ui); color: var(--muted); }
  .th i { width: 56px; height: 56px; border-radius: 50%; box-shadow: inset 0 0 0 1px var(--line); }
  .th.on i { box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--teal); }
  .th.on { color: var(--teal); }
  .size { display: flex; align-items: center; gap: 14px; margin-top: 26px; font-family: var(--display); }
  .size .b { font-size: 26px; }
  .size input { flex: 1; accent-color: var(--teal); }
  .sample { margin-top: 22px; padding: 18px; border-radius: var(--r); background: var(--card); font-family: var(--read); line-height: 1.95; }
  .foot { padding-top: 12px; }
</style>
