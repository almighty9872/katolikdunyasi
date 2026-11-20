/* Resources page: the category tabs (kept in the address as #widgets, #bulletin...), the ?q= search from the overview,
   and the widget options, which change the preview and the code to paste. */
(function () {
  var secs = [].slice.call(document.querySelectorAll('.rs-sec')), tabs = [].slice.call(document.querySelectorAll('[data-cat]')).filter(function (b) { return b.tagName === 'BUTTON'; });
  var CATS = ['widgets', 'bulletin', 'checklists', 'sacraments'], qn = document.getElementById('rs-q');
  function pick(c) {
    tabs.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === c)); });
    secs.forEach(function (x) { x.hidden = !!c && x.getAttribute('data-cat') !== c; });
  }
  tabs.forEach(function (b) {
    b.addEventListener('click', function () { var c = b.getAttribute('data-cat'); pick(c); try { history.replaceState(null, '', location.pathname + (c ? '#' + c : '')); } catch (e) {} if (qn) qn.hidden = true; });
  });
  var h = location.hash.slice(1), q = (new URLSearchParams(location.search).get('q') || '').trim().toLowerCase();
  if (CATS.indexOf(h) >= 0) pick(h);
  else if (h) { var t = document.getElementById(h), s = t && t.closest('.rs-sec'); if (s) pick(''); }
  // ?q=: show the sections that mention the words and say how many
  if (q && qn) {
    var hit = secs.filter(function (x) { return x.textContent.toLowerCase().indexOf(q) >= 0; });
    secs.forEach(function (x) { x.hidden = hit.length > 0 && hit.indexOf(x) < 0; });
    qn.hidden = false;
    qn.textContent = hit.length ? hit.length + (hit.length === 1 ? ' section mentions' : ' sections mention') + ' “' + q + '”. Choose a category to see the others.' : 'Nothing here mentions “' + q + '”. Search the directory from the bar at the top.';
  }
})();
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
