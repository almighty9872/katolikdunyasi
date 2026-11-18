// Runs before the page paints: applies the saved theme and text size, so there is no flash.
(function () {
  var d = document.documentElement, t = 'auto', f = '0';
  try { t = localStorage.getItem('vdb-theme') || 'auto'; f = localStorage.getItem('vdb-fs') || '0'; } catch (e) {}
  d.setAttribute('data-theme', t);
  d.setAttribute('data-fs', f);
})();
