(function () {
  var d = document, AR = d.body.dataset.lang !== 'en', ROOT = d.body.dataset.root;
  var q = d.getElementById('q'), st = d.getElementById('status'), out = d.getElementById('results');
  var dig = '٠١٢٣٤٥٦٧٨٩';
  function num(n) { return AR ? String(n).replace(/\d/g, function (c) { return dig[c] }) : n }
  // length-preserving normalisation, so match offsets map back onto the stored text
  function norm(s) {
    return s.replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').toLowerCase();
  }
  function clean(s) { return s.replace(/[ؐ-ًؚ-ٰٟـ]/g, '').trim() }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }

  var docs = null, loading = null;
  function load() {
    if (loading) return loading;
    st.textContent = AR ? 'جارٍ تحميل فهرس المدونة…' : 'Loading the index…';
    loading = Promise.all(window.SM.map(function (b) {
      return fetch(ROOT + 'search/idx-' + b.s + '.json').then(function (r) { return r.json() }).then(function (arr) {
        return arr.map(function (x) { x.b = AR ? b.ar : b.en; x.nx = norm(x.x); x.nt = norm(x.t); return x });
      });
    })).then(function (parts) { docs = [].concat.apply([], parts); st.textContent = ''; return docs });
    return loading;
  }

  function run(term) {
    term = clean(term);
    if (term.length < 2) { out.innerHTML = ''; st.textContent = AR ? 'اكتب كلمتين أو حرفين على الأقل.' : 'Type at least two letters.'; return }
    load().then(function () {
      var words = norm(term).split(/\s+/).filter(Boolean);
      var hits = [];
      docs.forEach(function (x) {
        var score = 0, first = -1, count = 0;
        for (var i = 0; i < words.length; i++) {
          var w = words[i], pos = x.nx.indexOf(w);
          if (pos < 0 && x.nt.indexOf(w) < 0) return;
          if (x.nt.indexOf(w) > -1) score += 50;
          var c = 0, p = pos; while (p > -1 && c < 200) { c++; p = x.nx.indexOf(w, p + w.length) }
          count += c; score += Math.min(c, 40);
          if (first < 0 || (pos > -1 && pos < first)) first = pos;
        }
        hits.push({ x: x, s: score, f: first, c: count });
      });
      hits.sort(function (a, b) { return b.s - a.s });
      st.textContent = hits.length ? (AR ? num(hits.length) + ' وحدة' : hits.length + ' units') : (AR ? 'لا نتائج. جرّب كلمةً أقصر أو جذراً آخر.' : 'No results. Try a shorter word.');
      out.innerHTML = hits.slice(0, 60).map(function (h) {
        var x = h.x, f = Math.max(0, h.f), a = Math.max(0, f - 110), b = Math.min(x.x.length, f + 170);
        var snip = x.x.slice(a, b), nsnip = x.nx.slice(a, b), html = '', i = 0;
        var re = new RegExp(words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }).join('|'), 'g'), m;
        while ((m = re.exec(nsnip))) { html += esc(snip.slice(i, m.index)) + '<mark>' + esc(snip.slice(m.index, m.index + m[0].length)) + '</mark>'; i = m.index + m[0].length; if (!m[0].length) re.lastIndex++ }
        html += esc(snip.slice(i));
        return '<li><a href="' + ROOT + x.u + '"><span class="rb">' + esc(x.b) + ' · ' + esc(x.l) + '</span><span class="rt" lang="ar" dir="rtl">' + esc(x.t) + '</span><span class="rs" lang="ar" dir="rtl">' + (a > 0 ? '… ' : '') + html + ' …</span><span class="rc">' + (AR ? num(h.c) + ' موضعاً' : h.c + ' matches') + '</span></a></li>';
      }).join('');
    });
  }

  var t;
  d.querySelector('.search-form').addEventListener('submit', function (e) { e.preventDefault(); run(q.value); history.replaceState(null, '', '?q=' + encodeURIComponent(q.value)) });
  q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { if (q.value.trim().length > 1) run(q.value) }, 350) });
  q.addEventListener('focus', load, { once: true });
  var p = new URLSearchParams(location.search).get('q');
  if (p) { q.value = p; run(p) }
})();
