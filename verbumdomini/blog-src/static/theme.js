// Runs before the page paints: applies the saved theme and text size, so there is no flash.
(function () {
  var d = document.documentElement, t = 'auto', f = '0';
  try { t = localStorage.getItem('vdb-theme') || 'auto'; f = localStorage.getItem('vdb-fs') || '0'; } catch (e) {}
  d.setAttribute('data-theme', t);
  d.setAttribute('data-fs', f);
  // Accessibility settings (blog.js), so the page paints with them
  try {
    var a = JSON.parse(localStorage.getItem('vdb-a11y') || '{}') || {};
    for (var k in a) if (a[k] && /^[a-z]+$/.test(k)) d.setAttribute('data-a11y-' + k, '1');
  } catch (e) {}
})();
