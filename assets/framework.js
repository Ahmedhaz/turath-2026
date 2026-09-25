(function () {
  var F = window.FW, d = document, body = d.body;
  var AR = body.dataset.lang !== 'en', ROOT = body.dataset.root;
  var panel = d.getElementById('panel');
  var dig = '٠١٢٣٤٥٦٧٨٩';
  function num(n) { return AR ? String(n).replace(/\d/g, function (c) { return dig[c] }) : n }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  function lab(u) {
    var b = F.books[u.b];
    var l = u.n === 0 ? (AR ? 'المقدمة' : 'Introduction') : (AR ? b.lab + ' ' + num(u.n) : b.lab_en + ' ' + u.n);
    return (AR ? b.ar : b.en) + ' · ' + l;
  }
  function item(u) {
    return '<li><a href="' + ROOT + u.u + '"><small>' + esc(lab(u)) + '</small><span lang="ar" dir="rtl">' + esc(u.t) + '</span></a></li>';
  }

  // counts
  var cnt = {};
  F.units.forEach(function (u) {
    u.a.forEach(function (x) { cnt['a' + x] = (cnt['a' + x] || 0) + 1 });
    u.l.forEach(function (x) { cnt['l' + x] = (cnt['l' + x] || 0) + 1 });
    u.c.forEach(function (x) { cnt['c' + x] = (cnt['c' + x] || 0) + 1 });
  });
  d.querySelectorAll('[data-count]').forEach(function (el) { var c = cnt[el.dataset.count]; if (c) el.textContent = num(c) });

  function show(k, v, btn) {
    d.querySelectorAll('.layer.on,.ail.on,.arc.on,.station.on').forEach(function (e) { e.classList.remove('on') });
    if (btn) btn.classList.add('on');
    var title = '', sub = '', html = '';
    v = +v;
    if (k === 's') {
      var s = F.stations[v];
      title = (AR ? 'العقبة ' + num(v + 1) + ' · ' : 'Station ' + (v + 1) + ' · ') + (AR ? s.ar : s.en);
      sub = AR ? 'من منهاج العابدين' : 'From The Worshippers’ Path';
      html = '<ol>' + s.units.map(function (u) { return item({ b: 'minhaj', n: u.n, t: u.t, u: u.u }) }).join('') + '</ol>';
    } else {
      var list, name;
      if (k === 'a') { name = F.ail[v][AR ? 0 : 1]; list = F.units.filter(function (u) { return u.a.indexOf(v) > -1 }); }
      if (k === 'l') { name = F.layers[v][AR ? 0 : 1]; list = F.units.filter(function (u) { return u.l.indexOf(v) > -1 }); }
      if (k === 'c') { name = F.arcs[v][AR ? 0 : 1]; list = F.units.filter(function (u) { return u.c.indexOf(v) > -1 }); }
      title = k === 'a' ? (AR ? 'علّة ' : 'Ailment ') + num(v) + ' · ' + name : k === 'l' ? (AR ? 'طبقة ' : 'Layer · ') + name : (AR ? 'دائرة ' : 'Circle · ') + name;
      if (k === 'a') {
        var prim = list.filter(function (u) { return u.a[0] === v }), sec = list.filter(function (u) { return u.a[0] !== v });
        sub = AR ? num(list.length) + ' وحدة' : list.length + ' units';
        if (prim.length) html += '<p class="grp">' + (AR ? 'علّتها الأولى' : 'As the primary ailment') + '</p><ol>' + prim.map(item).join('') + '</ol>';
        if (sec.length) html += '<p class="grp">' + (AR ? 'تلمسها' : 'Also touches it') + '</p><ol>' + sec.map(item).join('') + '</ol>';
        if (!list.length) html = '<p class="muted">' + (AR ? 'لا وحدة موسومة بها بعد.' : 'No unit tagged yet.') + '</p>';
      } else {
        sub = AR ? num(list.length) + ' وحدة' : list.length + ' units';
        html = '<ol>' + list.map(item).join('') + '</ol>';
      }
    }
    panel.innerHTML = '<button class="close" aria-label="' + (AR ? 'إغلاق' : 'Close') + '">✕</button><h3>' + esc(title) + '</h3><p class="muted small">' + esc(sub) + '</p>' + html;
    panel.querySelector('.close').onclick = function () { show_empty(); };
    if (innerWidth < 1040) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    else panel.scrollTop = 0;
  }
  var empty = panel.innerHTML;
  function show_empty() { panel.innerHTML = empty; d.querySelectorAll('.on').forEach(function (e) { if (!e.closest('.nav')) e.classList.remove('on') }) }

  d.querySelectorAll('[data-k]').forEach(function (b) {
    b.addEventListener('click', function () { show(b.dataset.k, b.dataset.v, b); history.replaceState(null, '', '#' + (b.id || '')) });
  });
  var h = location.hash.slice(1), el = h && d.getElementById(h);
  if (el && el.dataset.k) { show(el.dataset.k, el.dataset.v, el); setTimeout(function () { el.scrollIntoView({ block: 'center' }) }, 50) }
})();
