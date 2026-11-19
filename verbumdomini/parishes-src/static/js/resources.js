/* Resources page: the widget options change the preview and the code to paste. */
(function () {
  var th = document.getElementById('w-theme'), sz = document.getElementById('w-size'), fr = document.getElementById('w-frame'), code = document.getElementById('w-code');
  if (!th || !sz || !fr || !code) return;
  function upd() {
    var q = [];
    if (th.value) q.push('theme=' + th.value);
    if (sz.value) q.push('compact=1');
    var qs = q.length ? '?' + q.join('&') : '', h = sz.value ? 210 : 420;
    fr.src = '/embed/today.html' + qs;
    fr.className = 'pp-frame ' + (sz.value ? 'c' : 'f');
    code.textContent = '<iframe src="https://parishes.verbumdomini.ca/embed/today.html' + qs + '" title="Today’s Mass readings" width="100%" height="' + h +
      '" style="border:0;max-width:640px" loading="lazy"></iframe>';
  }
  th.addEventListener('change', upd); sz.addEventListener('change', upd);
})();
