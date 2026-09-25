(function () {
  var d = document, AR = d.body.dataset.lang !== 'en', ROOT = d.body.dataset.root, F = window.FW, H = window.HD;
  var dig = '٠١٢٣٤٥٦٧٨٩';
  function num(n) { return AR ? String(n).replace(/\d/g, function (c) { return dig[c] }) : String(n) }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }

  // count-up
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) d.querySelectorAll('.stats dd[data-count]').forEach(function (el) {
    var to = +el.dataset.count, t0 = null;
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); el.textContent = num(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step) }
    el.textContent = num(0); requestAnimationFrame(step);
  });

  // start where you are
  var picks = d.getElementById('picks');
  function label(u) {
    var b = F.books[u.b];
    return (AR ? b.ar : b.en) + ' · ' + (u.n === 0 ? (AR ? 'المقدمة' : 'Introduction') : (AR ? b.lab + ' ' + num(u.n) : b.lab_en + ' ' + u.n));
  }
  function pick(i) {
    var f = H.feel[i], ails = f[2], seen = {}, out = [];
    // primary ailment matches first, one per book, then secondary
    [true, false].forEach(function (primary) {
      ails.forEach(function (a) {
        F.units.forEach(function (u) {
          if (out.length >= 3 || seen[u.b]) return;
          var ok = primary ? u.a[0] === a : u.a.indexOf(a) > -1;
          if (ok) { seen[u.b] = 1; out.push({ u: u, a: a }) }
        });
      });
    });
    picks.innerHTML = out.map(function (x, k) {
      return '<a class="pick" style="--k:' + k + '" href="' + ROOT + x.u.u + '"><span class="pk-b">' + esc(label(x.u)) + '</span>' +
        '<span class="pk-t" lang="ar" dir="rtl">' + esc(x.u.t) + '</span><span class="pk-a">' + (AR ? 'يعالج: ' : 'Treats: ') + esc(F.ail[x.a][AR ? 0 : 1]) + ' ←</span></a>';
    }).join('') + '<a class="pick more" style="--k:3" href="' + ROOT + (AR ? '' : 'en/') + 'framework/#ail-' + ails[0] + '">' + (AR ? 'كل أبواب «' + esc(F.ail[ails[0]][0]) + '» في الإطار' : 'Every chapter on “' + esc(F.ail[ails[0]][1]) + '”') + '</a>';
    d.querySelectorAll('.feel').forEach(function (b, j) { b.classList.toggle('on', j === i); b.setAttribute('aria-pressed', j === i) });
  }
  d.querySelectorAll('.feel').forEach(function (b) { b.addEventListener('click', function () { pick(+b.dataset.i) }) });

  // aphorism of the day
  var q = H.quotes, qi = Math.floor(Date.now() / 864e5) % (q.length || 1);
  function showQ() {
    if (!q.length) { d.getElementById('hikma').hidden = true; return }
    var x = q[qi % q.length], el = d.getElementById('hk-q');
    el.classList.remove('fade'); void el.offsetWidth; el.classList.add('fade');
    el.textContent = '«' + x.q + '»';
    d.getElementById('hk-n').textContent = AR ? 'الحكمة ' + num(x.n) : 'Aphorism ' + x.n;
    var a = d.getElementById('hk-link'); a.href = ROOT + x.u; a.textContent = (AR ? 'اقرأ بابها: ' : 'Read its chapter: ') + x.t + (AR ? ' ←' : ' →');
  }
  d.getElementById('hk-next').addEventListener('click', function () { qi = (qi + 1 + Math.floor(Math.random() * 7)) % q.length; showQ() });
  showQ();
})();
