#!/usr/bin/env node
// Refuses content the app cannot open. Every unit in the catalog must have its chapter file with real
// prose, every contents entry must point at a heading that exists, and every way into a chapter (a
// daily quote, a search result, a feeling's ailments) must land on something that is there.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'public/data');
const cat = JSON.parse(fs.readFileSync(path.join(DATA, 'catalog.json'), 'utf8'));
const bad = [];
const units = new Set(cat.units.map((u) => `${u.b}/${u.n}`));

for (const u of cat.units) {
  const f = path.join(DATA, 'ch', u.b, `${u.n}.json`);
  if (!fs.existsSync(f)) { bad.push(`${u.b}/${u.n}: no chapter file`); continue; }
  const ch = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (ch.html.length < 2000) bad.push(`${u.b}/${u.n}: only ${ch.html.length} characters of prose`);
  for (const t of ch.toc) if (!ch.html.includes(`id="${t.id}"`)) bad.push(`${u.b}/${u.n}: contents entry without heading: ${t.t}`);
  if (!u.t) bad.push(`${u.b}/${u.n}: no title`);
  for (const a of u.a) if (!cat.ail[a]) bad.push(`${u.b}/${u.n}: unknown ailment ${a}`);
}
for (const b of cat.books) {
  if (!cat.units.some((u) => u.b === b.id)) bad.push(`${b.id}: book without units`);
  if (!b.cover.startsWith('<svg')) bad.push(`${b.id}: no cover`);
}
for (const q of cat.quotes) if (!units.has(q.u)) bad.push(`quote points at missing ${q.u}`);
for (const f of cat.feel) for (const a of f.a) if (!cat.ail[a]) bad.push(`feeling "${f.t}": unknown ailment ${a}`);

let hits = 0;
for (const f of fs.readdirSync(path.join(DATA, 'search'))) {
  for (const x of JSON.parse(fs.readFileSync(path.join(DATA, 'search', f), 'utf8'))) {
    const m = x.u.match(/book\/([a-z]+)\/(\d+|intro)\//);
    const k = m && `${m[1]}/${m[2] === 'intro' ? 0 : m[2]}`;
    if (!k || !units.has(k)) bad.push(`search entry points at missing ${x.u}`);
    hits++;
  }
}

if (bad.length) {
  console.error(bad.slice(0, 40).join('\n') + (bad.length > 40 ? `\n… and ${bad.length - 40} more` : ''));
  process.exit(1);
}
console.log(`data ok: ${cat.books.length} books, ${cat.units.length} chapters, ${cat.quotes.length} quotes, ${hits} search entries, all resolve`);
