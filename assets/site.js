(function () {
  var d = document, root = d.documentElement;
  function store(k, v) { try { localStorage.setItem(k, v) } catch (e) {} }

  // theme
  var tb = d.querySelector('.theme');
  if (tb) tb.addEventListener('click', function () {
    var cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next; store('theme', next);
  });

  // mobile nav
  var nb = d.querySelector('.nav-btn'), nav = d.querySelector('.nav');
  if (nb) nb.addEventListener('click', function () {
    var o = nav.classList.toggle('open'); nb.setAttribute('aria-expanded', o);
  });

  // reader: font size
  d.querySelectorAll('[data-fs]').forEach(function (b) {
    b.addEventListener('click', function () {
      var cur = parseFloat(getComputedStyle(root).getPropertyValue('--fs')) || 1.18;
      var v = Math.min(1.6, Math.max(0.95, cur + 0.08 * (+b.dataset.fs))).toFixed(2) + 'rem';
      root.style.setProperty('--fs', v); store('fs', v);
    });
  });

  // reader: progress + active toc
  var bar = d.querySelector('.progress span'), art = d.querySelector('.reader');
  if (bar && art) {
    var links = [].slice.call(d.querySelectorAll('.toc a'));
    var heads = links.map(function (a) { return d.getElementById(decodeURIComponent(a.hash.slice(1))) });
    var tick = function () {
      var r = art.getBoundingClientRect(), h = r.height - innerHeight;
      bar.style.width = Math.min(100, Math.max(0, -r.top / (h > 0 ? h : 1) * 100)) + '%';
      var on = -1;
      heads.forEach(function (el, i) { if (el && el.getBoundingClientRect().top < 120) on = i });
      links.forEach(function (a, i) { a.classList.toggle('on', i === on) });
    };
    addEventListener('scroll', tick, { passive: true }); tick();
  }
})();
