// Runs before the page paints: applies the saved theme and text size, so there is no flash.
(function () {
  var d = document.documentElement, t = 'auto', f = '0';
  try { t = localStorage.getItem('vdb-theme') || 'auto'; f = localStorage.getItem('vdb-fs') || '0'; } catch (e) {}
  // The theme chosen on verbumdomini.ca (cookie vd-th on the parent domain, set by either site): dark is dark,
  // light keeps sepia if that is the blog's choice, system is auto
  var m = /(?:^|; )vd-th=(light|dark|system)/.exec(document.cookie);
  if (m) {
    t = m[1] === 'system' ? 'auto' : m[1] === 'light' && t === 'sepia' ? 'sepia' : m[1];
    try { localStorage.setItem('vdb-theme', t); } catch (e) {}
  }
  d.setAttribute('data-theme', t);
  d.setAttribute('data-fs', f);
  // Accessibility settings (blog.js), so the page paints with them
  try {
    var a = JSON.parse(localStorage.getItem('vdb-a11y') || '{}') || {};
    for (var k in a) if (a[k] && /^[a-z]+$/.test(k)) d.setAttribute('data-a11y-' + k, '1');
  } catch (e) {}
})();
