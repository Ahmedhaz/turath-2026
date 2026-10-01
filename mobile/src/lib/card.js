// Draws a quote as a 1080×1350 image (the 4:5 shape Instagram and WhatsApp status show uncropped).
// Arabic is laid out by measuring whole words right-to-left, so lines never break inside a word.
const W = 1080, H = 1350;

export const STYLES = [
  { id: 'book', t: 'لون الكتاب' },
  { id: 'paper', t: 'ورق' },
  { id: 'night', t: 'ليل' },
];

function wrap(ctx, text, max) {
  const words = text.split(/\s+/), lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawCard(canvas, { q, src, hue = 168, style = 'book' }) {
  await Promise.all([
    document.fonts.load('400 60px Amiri'), document.fonts.load('600 30px "IBM Plex Sans Arabic"'),
  ]).catch(() => {});
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const pal = style === 'paper'
    ? { a: '#F7F1E4', b: '#EADFC9', ink: '#211D17', soft: 'rgba(33,29,23,.55)', gold: '#A7832F' }
    : style === 'night'
      ? { a: '#1C1914', b: '#0E0C09', ink: '#EFE6D3', soft: 'rgba(239,230,211,.55)', gold: '#D9B86E' }
      : { a: `hsl(${hue} 42% 34%)`, b: `hsl(${hue} 46% 16%)`, ink: '#FBF5E8', soft: 'rgba(251,245,232,.65)', gold: '#E9C877' };

  const g = ctx.createRadialGradient(W * .8, 0, 50, W * .5, H * .5, H);
  g.addColorStop(0, pal.a); g.addColorStop(1, pal.b);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // a thin double frame with an eight-pointed star at the top, after the site's ornament
  ctx.strokeStyle = pal.gold; ctx.globalAlpha = .55; ctx.lineWidth = 2;
  ctx.strokeRect(54, 54, W - 108, H - 108);
  ctx.globalAlpha = .3; ctx.strokeRect(68, 68, W - 136, H - 136);
  ctx.globalAlpha = 1;
  star(ctx, W / 2, 150, 26, pal.gold);

  ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.fillStyle = pal.ink;
  let size = 66;
  let lines;
  for (; size >= 40; size -= 4) {
    ctx.font = `400 ${size}px Amiri`;
    lines = wrap(ctx, q, W - 260);
    if (lines.length * size * 1.75 < H - 520) break;
  }
  const lh = size * 1.75;
  let y = H / 2 - ((lines.length - 1) * lh) / 2 + size * .3;
  for (const l of lines) { ctx.fillText(l, W / 2, y); y += lh; }

  ctx.font = '600 30px "IBM Plex Sans Arabic"'; ctx.fillStyle = pal.soft;
  ctx.fillText(src || '', W / 2, H - 190);
  ctx.font = '500 26px "IBM Plex Sans Arabic"'; ctx.fillStyle = pal.gold;
  ctx.fillText('مدونة استئناف التراث  ❖  Turath2026', W / 2, H - 118);
  return canvas.toDataURL('image/png');
}

function star(ctx, cx, cy, r, color) {
  ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2, rr = i % 2 ? r * .45 : r;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}
