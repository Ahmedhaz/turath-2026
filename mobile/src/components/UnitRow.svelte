<script>
  // A chapter in a list anywhere outside its own book: which book, its title, how long, and whether read.
  import { store } from '../lib/state.svelte.js';
  import { read } from '../lib/nav.svelte.js';
  import { ar, duration, minutes, label } from '../lib/data.js';
  import { tap } from '../lib/native.js';
  import Cover from './Cover.svelte';
  import Icon from './Icon.svelte';
  let { cat, u, rank = 0 } = $props();
  const book = $derived(cat.bookById[u.b]);
  const p = $derived(store.progress[`${u.b}/${u.n}`]);
</script>

<button class="ur press" onclick={() => { tap(); read(u.b, u.n); }}>
  {#if rank}<span class="rk num">{ar(rank)}</span>{/if}
  <Cover {book} w={46} title={false} />
  <span class="tx">
    <span class="bk">{book.t}، {label(book, u.n)}</span>
    <span class="tt">{u.t}</span>
    <span class="mt">{duration(minutes(u.w))}{p && !p.done ? `، قرأت ${ar(Math.round(p.pct * 100))}٪` : ''}</span>
  </span>
  {#if p?.done}<span class="ok"><Icon name="check" size={14} /></span>{/if}
</button>

<style>
  .ur { display: flex; align-items: center; gap: 14px; width: 100%; padding: 12px 4px; text-align: start; border-bottom: .5px solid var(--line); }
  .rk { width: 22px; flex: none; text-align: center; font: 700 16px var(--display); color: var(--gold); }
  .tx { flex: 1; min-width: 0; display: grid; gap: 1px; }
  .bk { font: 500 12px var(--ui); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tt { font: 700 16.5px/1.6 var(--display); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .mt { font: 400 12px var(--ui); color: var(--muted); }
  .ok { width: 22px; height: 22px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--teal); color: var(--paper); }
</style>
