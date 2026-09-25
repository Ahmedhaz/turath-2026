(function () {
  var d = document, tabs = d.querySelectorAll('.hw-tab'), phs = d.querySelectorAll('.hw-ph'), cur = 0, timer = null;
  function go(i, user) {
    cur = i;
    tabs.forEach(function (t, j) { t.classList.toggle('on', j === i); t.setAttribute('aria-selected', j === i) });
    phs.forEach(function (p, j) { p.classList.toggle('on', j === i) });
    if (user && timer) { clearInterval(timer); timer = null }
  }
  tabs.forEach(function (t, i) { t.addEventListener('click', function () { go(i, true) }) });
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage = d.querySelector('.hw-app');
  if (!reduce && stage && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !timer && cur === 0) timer = setInterval(function () { go((cur + 1) % tabs.length) }, 4200);
        if (!e.isIntersecting && timer) { clearInterval(timer); timer = null }
      });
    }, { threshold: .4 }).observe(stage);
  }
})();
