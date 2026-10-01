// Content access. catalog.json is loaded once at launch; chapters load on demand and are cached.
let catalog = null;
const chapters = new Map();

export async function loadCatalog() {
  if (catalog) return catalog;
  const c = await (await fetch('./data/catalog.json')).json();
  c.bookById = Object.fromEntries(c.books.map((b) => [b.id, b]));
  c.unitByKey = new Map(c.units.map((u) => [key(u.b, u.n), u]));
  c.unitsOf = (id) => c.units.filter((u) => u.b === id);
  c.unitsWithAil = (a) => c.units.filter((u) => u.a.includes(+a));
  catalog = c;
  return c;
}

export const key = (b, n) => `${b}/${n}`;

export async function loadChapter(b, n) {
  const k = key(b, n);
  if (!chapters.has(k)) chapters.set(k, fetch(`./data/ch/${b}/${n}.json`).then((r) => r.json()));
  return chapters.get(k);
}

const AR = '٠١٢٣٤٥٦٧٨٩';
export const ar = (n) => String(n).replace(/\d/g, (d) => AR[d]);
export const arGroup = (n) => ar(Math.round(n).toLocaleString('en-US')).replace(/,/g, '٬');
/** reading minutes at a calm 200 words a minute */
export const minutes = (w) => Math.max(1, Math.round(w / 200));
export function duration(min) {
  if (min < 60) return `${ar(min)} د`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${ar(h)} س ${ar(m)} د` : `${ar(h)} س`;
}

/** a stable pick for today, so the day's wisdom does not change on every launch */
export function dayIndex(len, salt = 0, d = new Date()) {
  const day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5) + d.getFullYear() * 400;
  return (day * 7919 + salt * 104729) % len;
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'ليلة هادئة';
  if (h < 12) return 'صباح الخير';
  if (h < 17) return 'طاب يومك';
  return 'مساء الخير';
}

export function dates(d = new Date()) {
  const fmt = (cal, o) => { try { return new Intl.DateTimeFormat(`ar-${cal}`, o).format(d) } catch { return '' } };
  return {
    hijri: fmt('SA-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*هـ$/, ' هـ'),
    weekday: fmt('EG-u-nu-arab', { weekday: 'long' }),
    greg: fmt('EG-u-nu-arab', { day: 'numeric', month: 'long' }),
  };
}

/** normalisation used by search: diacritics and tatweel go, letters written several ways match each other */
const MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
export function norm(s) {
  return s.replace(MARKS, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').toLowerCase();
}

/** how a unit is named in its book: "الباب ١٢", "الحكمة ٥", or "المقدمة" for an introduction (n = 0) */
export const label = (book, n) => (+n === 0 ? 'المقدمة' : `${book.lab} ${ar(n)}`);

/**
 * Chapters that treat a set of ailments (or belong to an area of life / a layer), best first.
 * A tag listed first on a unit is its main subject, so earlier tags weigh more; a unit that treats
 * several of the asked ailments ranks above one that treats a single one. A short prescription should
 * read as a selection across the library, so `perBook` caps how many chapters one book contributes
 * (aphorisms are short, many and sometimes near-duplicates, so they get their own `cap`).
 */
export function prescribe(cat, { ails = [], arc = null, layer = null, limit = 40, cap = 2, perBook = 2 }) {
  const scored = [];
  for (const u of cat.units) {
    let s = 0;
    for (const a of ails) { const i = u.a.indexOf(+a); if (i >= 0) s += 4 - Math.min(i, 3); }
    if (arc != null && u.c.includes(+arc)) s += 3 - Math.min(u.c.indexOf(+arc), 2);
    if (layer != null && u.l.includes(+layer)) s += 3 - Math.min(u.l.indexOf(+layer), 2);
    if (s) scored.push({ u, s });
  }
  scored.sort((x, y) => y.s - x.s || x.u.w - y.u.w);
  const per = {};
  return scored.filter(({ u }) => {
    per[u.b] = (per[u.b] || 0) + 1;
    return per[u.b] <= (u.b === 'hikam' ? cap : perBook);
  }).slice(0, limit).map((x) => x.u);
}
