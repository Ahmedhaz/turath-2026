// Everything the reader leaves behind: progress, bookmarks, highlights, settings, reading time.
// Kept in localStorage for instant reads and mirrored to Capacitor Preferences, which iOS does not
// purge under storage pressure the way it can purge WebView storage.
import { Preferences } from '@capacitor/preferences';

const KEY = 'turath.v1';
const blank = () => ({
  progress: {},      // "book/n" -> { pct, y, done, at }
  last: null,        // "book/n" most recently opened
  bookmarks: [],     // [{ k, at }]
  highlights: [],    // [{ id, k, text, note, at }]
  saved: [],         // saved wisdom: [{ q, u, at }]
  days: {},          // "YYYY-MM-DD" -> seconds read
  recent: [],        // recent searches
  settings: { theme: 'auto', size: 1, font: 'naskh', leading: 1.95 },
  onboarded: false,
});

function restore() {
  try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return blank() }
}

export const store = $state(restore());

let timer;
export function save() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const json = JSON.stringify(store);
    try { localStorage.setItem(KEY, json) } catch {}
    Preferences.set({ key: KEY, value: json }).catch(() => {});
  }, 250);
}

/** If WebView storage was cleared, bring the reader's data back from Preferences. */
export async function hydrate() {
  if (localStorage.getItem(KEY)) return;
  const { value } = await Preferences.get({ key: KEY }).catch(() => ({}));
  if (!value) return;
  try { Object.assign(store, blank(), JSON.parse(value)) } catch {}
}

const today = () => new Date().toISOString().slice(0, 10);

export function setProgress(k, patch) {
  store.progress[k] = { ...(store.progress[k] || { pct: 0, y: 0 }), ...patch, at: Date.now() };
  store.last = k;
  save();
}

export function addReadingTime(sec) {
  const d = today();
  store.days[d] = (store.days[d] || 0) + sec;
  save();
}

export function toggleBookmark(k) {
  const i = store.bookmarks.findIndex((b) => b.k === k);
  if (i >= 0) store.bookmarks.splice(i, 1); else store.bookmarks.unshift({ k, at: Date.now() });
  save();
  return i < 0;
}
export const isBookmarked = (k) => store.bookmarks.some((b) => b.k === k);

export function addHighlight(k, text) {
  const h = { id: Math.random().toString(36).slice(2, 10), k, text, note: '', at: Date.now() };
  store.highlights.unshift(h);
  save();
  return h;
}
export function removeHighlight(id) {
  const i = store.highlights.findIndex((h) => h.id === id);
  if (i >= 0) store.highlights.splice(i, 1);
  save();
}

export function toggleSaved(q, u) {
  const i = store.saved.findIndex((s) => s.q === q);
  if (i >= 0) store.saved.splice(i, 1); else store.saved.unshift({ q, u, at: Date.now() });
  save();
  return i < 0;
}

export function pushRecent(q) {
  store.recent = [q, ...store.recent.filter((r) => r !== q)].slice(0, 8);
  save();
}

/** consecutive days with any reading, counting today only once it has some */
export function streak() {
  let n = 0;
  const d = new Date();
  if (!store.days[today()]) d.setDate(d.getDate() - 1);
  for (;;) {
    const k = d.toISOString().slice(0, 10);
    if (!store.days[k]) return n;
    n++; d.setDate(d.getDate() - 1);
  }
}

/** the last seven days of reading, oldest first, in minutes */
export function week() {
  const out = [];
  const d = new Date();
  d.setDate(d.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    const k = d.toISOString().slice(0, 10);
    out.push({ k, min: Math.round((store.days[k] || 0) / 60), day: d.getDay() });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function applyTheme() {
  const t = store.settings.theme;
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = t === 'auto' ? (dark ? 'night' : 'paper') : t;
  document.documentElement.dataset.theme = theme;
  return theme;
}
