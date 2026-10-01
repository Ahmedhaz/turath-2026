// Highlights are stored as plain text and painted back onto the chapter on every open. The text can
// cross element boundaries (a highlight that starts in plain text and ends inside <strong>), so the
// search runs over the container's concatenated text and maps the match back onto text nodes.

function textNodes(root) {
  const out = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n);
  return out;
}

export function paint(root, text, id) {
  const nodes = textNodes(root);
  let all = '';
  const starts = nodes.map((n) => { const s = all.length; all += n.data; return s; });
  const at = all.indexOf(text);
  if (at < 0) return false;
  const end = at + text.length;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i], s = starts[i], e = s + n.data.length;
    if (e <= at || s >= end) continue;
    const from = Math.max(0, at - s), to = Math.min(n.data.length, end - s);
    const r = document.createRange();
    r.setStart(n, from); r.setEnd(n, to);
    const m = document.createElement('mark');
    m.dataset.hl = id;
    r.surroundContents(m);
  }
  return true;
}

export function unpaint(root, id) {
  root.querySelectorAll(`mark[data-hl="${id}"]`).forEach((m) => m.replaceWith(...m.childNodes));
  root.normalize();
}
