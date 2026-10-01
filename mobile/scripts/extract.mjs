#!/usr/bin/env node
// Reads the site (the rest of this repo) and writes the app's content as data:
//   public/data/catalog.json        books, units, the framework (ailments, families, layers, arcs),
//                                   the "how do you feel" map and the daily wisdom quotes
//   public/data/ch/<book>/<n>.json  one chapter: clean prose HTML and its table of contents
//   public/data/search/idx-*.json   the site's search index, as is
// The site is never edited. Its pages are the source of truth; this script only re-shapes them.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE = process.env.TURATH_SRC ? path.resolve(process.env.TURATH_SRC) : path.dirname(HERE);
const OUT = path.join(HERE, 'public/data');
const LIVE = 'https://ahmedhaz.github.io/turath-2026/';

const read = (rel) => fs.readFileSync(path.join(SITE, rel), 'utf8');
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const ent = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const pick = (s, re) => { const m = s.match(re); return m ? m[1] : ''; };
const arNum = (s) => Number(String(s).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, '')) || 0;

function load(rel, name) {
  const ctx = { window: {} };
  vm.runInNewContext(read(rel), ctx);
  return ctx.window[name];
}

const FW = load('assets/framework-data.js', 'FW');
const HD = load('assets/home-data.js', 'HD');

// ---- prose: the site's markdown came through with lists flattened into paragraphs ("\n- x", "\n١. x").
// Turn those back into real lists, drop the decorative ornaments, keep everything else.
const BULLET = /^\s*[-•]\s+/;
const NUMBERED = /^\s*([0-9٠-٩]+)[.)]\s+/;
// Numbered items often sit inline ("…بين قوتين: ١. <strong>…</strong> … ٢. <strong>…"). Break them onto
// their own lines only when they run in sequence from one, so a stray "٣." in a sentence stays put.
const AR = '٠١٢٣٤٥٦٧٨٩';
const arabic = (n) => String(n).replace(/\d/g, (d) => AR[d]);
function splitInlineNumbers(s, open = '', close = '.') {
  const at = [];
  let from = 0;
  for (let k = 1; ; k++) {
    const i = s.indexOf(` ${open}${arabic(k)}${close} `, from);
    if (i < 0) break;
    at.push(i); from = i + 3;
  }
  if (at.length < 2) return s;
  let out = s;
  for (const i of at.reverse()) out = out.slice(0, i) + '\n' + out.slice(i + 1);
  return out;
}

function paragraph(inner) {
  // footnotes run inline too: "(١) … (٢) …" becomes one note per line
  const lines = splitInlineNumbers(splitInlineNumbers(' ' + inner.trim(), '(', ')')).split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return `<p>${inner.trim()}</p>`;
  let out = '', list = null;
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  for (const line of lines) {
    const kind = BULLET.test(line) ? 'ul' : NUMBERED.test(line) ? 'ol' : null;
    if (kind) {
      if (list !== kind) { close(); out += `<${kind}>`; list = kind; }
      out += `<li>${line.replace(kind === 'ul' ? BULLET : NUMBERED, '')}</li>`;
    } else {
      close();
      out += `<p>${line}</p>`;
    }
  }
  close();
  return out;
}

function prose(html) {
  let s = html;
  s = s.replace(/<div class="orn"[^>]*>[\s\S]*?<\/svg><\/div>/g, '<hr>');
  s = s.replace(/<svg[\s\S]*?<\/svg>/g, '');
  s = s.replace(/<p>([\s\S]*?)<\/p>/g, (_, inner) => paragraph(inner));
  s = s.replace(/(<hr>\s*)+/g, '<hr>').replace(/^\s*<hr>|<hr>\s*$/g, '');
  s = s.replace(/<a [^>]*href="[^"]*framework[^"]*"[^>]*>([\s\S]*?)<\/a>/g, '$1');
  s = s.replace(/href="(\.\.\/)+([^"]+\.pdf)"/g, (_, __, p) => `href="${LIVE}${p}"`);
  s = s.replace(/\s+\n/g, '\n').replace(/\n{2,}/g, '\n');
  return s.trim();
}

// Introductions live at book/<id>/intro/ and become unit 0.
const dir = (n) => (n === 0 ? 'intro' : n);
function chapter(book, n) {
  const s = read(`book/${book}/${dir(n)}/index.html`);
  const art = s.slice(s.indexOf('<article class="reader">'));
  const start = art.indexOf('<div class="prose">');
  const end = art.indexOf('<nav class="pager">');
  if (start < 0 || end < 0) throw new Error(`book/${book}/${n}: no prose or pager`);
  // After the prose div come one standalone ornament and the pager: drop both, then the closing </div>.
  let inner = art.slice(start + '<div class="prose">'.length, end).trimEnd();
  const lastOrn = inner.lastIndexOf('<div class="orn"');
  if (lastOrn > 0 && /<\/svg><\/div>$/.test(inner)) inner = inner.slice(0, lastOrn).trimEnd();
  inner = inner.replace(/<\/div>$/, '');
  // In Arabic text a middle dot next to Arabic digits reads as a zero ("١ · تشخيص" looks like "١٠ تشخيص"),
  // so headings use a full stop after a number and a colon elsewhere ("الفصل الأول: حقيقة الصبر").
  const html = prose(inner).replace(/(<h[23][^>]*>)([\s\S]*?)(<\/h[23]>)/g, (_, o, t, c) =>
    o + t.replace(/^([0-9٠-٩]+) · /, '$1. ').replace(/ · /g, ': ') + c);
  const toc = [...html.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map((m) => ({ id: m[2], t: ent(strip(m[3])) }));
  const matn = ent(strip(pick(art, /<h1 class="matn">([\s\S]*?)<\/h1>/)));
  const title = ent(strip(pick(art, /<h1[^>]*>([\s\S]*?)<\/h1>/)));
  const sub = ent(strip(pick(art, /<p class="sub">([\s\S]*?)<\/p>/)));
  const meta = strip(pick(art, /<p class="meta">([\s\S]*?)<\/p>/));
  const words = arNum(meta.split('·')[0]);
  return { html, toc, matn, title, sub, words };
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'ch'), { recursive: true });

const shelves = [];
const books = [];
const units = [];
const unitIndex = new Map(FW.units.map((u) => [u.u, u]));
let words = 0, chapters = 0;

const lib = read('library/index.html');
for (const [, shelf, body] of lib.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2|<\/main>)/g)) {
  const ids = [...new Set([...body.matchAll(/href="\.\.\/book\/([a-z]+)\/"/g)].map((m) => m[1]))];
  if (ids.length) shelves.push({ t: strip(shelf), books: ids });
}

for (const id of shelves.flatMap((s) => s.books)) {
  const s = read(`book/${id}/index.html`);
  const fw = FW.books[id] || {};
  const orig = ent(strip(pick(s, /<p class="orig">([\s\S]*?)<\/p>/)));
  const [source, author] = orig.replace(/^عن\s*/, '').split('·').map((x) => x.trim());
  const meta = strip(pick(s, /<p class="meta">([\s\S]*?)<\/p>/));
  const list = [...s.matchAll(/href="\.\.\/\.\.\/book\/[a-z]+\/(\d+|intro)\/"/g)].map((m) => (m[1] === 'intro' ? 0 : +m[1]));
  const ns = [...new Set(list)].sort((a, b) => a - b);
  fs.mkdirSync(path.join(OUT, 'ch', id), { recursive: true });
  let bookWords = 0;
  for (const n of ns) {
    const c = chapter(id, n);
    const fwu = unitIndex.get(`book/${id}/${dir(n)}/`) || {};
    fs.writeFileSync(path.join(OUT, 'ch', id, `${n}.json`), JSON.stringify({ html: c.html, toc: c.toc }));
    units.push({
      b: id, n, t: c.matn ? (c.sub || fwu.t || c.title) : (c.title || fwu.t), m: c.matn || undefined,
      w: c.words, a: fwu.a || [], l: fwu.l || [], c: fwu.c || [],
    });
    bookWords += c.words; chapters++;
  }
  words += bookWords;
  books.push({
    id, t: ent(strip(pick(s, /<h1>([\s\S]*?)<\/h1>/))) || fw.ar, en: fw.en, lab: fw.lab || 'الباب',
    k: ent(strip(pick(s, /class="kicker">([\s\S]*?)<\/p>/))), src: source, by: author,
    lede: ent(strip(pick(s, /class="lede">([\s\S]*?)<\/p>/))), hue: +pick(s, /--bh:(\d+)/) || 160,
    cover: pick(s, /class="bh-cover[^"]*">(<svg[\s\S]*?<\/svg>)/).replace(/\s+/g, ' '),
    wip: /قيد الكتابة/.test(meta) || undefined, count: ns.length, w: bookWords,
  });
}

const catalog = {
  shelves, books, units,
  ail: FW.ail, fam: FW.fam, layers: FW.layers, arcs: FW.arcs,
  feel: HD.feel.map(([ar, en, a]) => ({ t: ar, a })),
  quotes: HD.quotes.map((q) => ({ q: q.q, t: q.t, u: q.u.replace(/^book\/|\/$/g, ''), })),
  built: new Date().toISOString(),
};
fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify(catalog));

fs.mkdirSync(path.join(OUT, 'search'), { recursive: true });
for (const f of fs.readdirSync(path.join(SITE, 'search'))) {
  if (f.endsWith('.json')) fs.copyFileSync(path.join(SITE, 'search', f), path.join(OUT, 'search', f));
}
console.log(`data/: ${books.length} books, ${chapters} chapters, ${words.toLocaleString()} words, ${catalog.quotes.length} quotes`);
