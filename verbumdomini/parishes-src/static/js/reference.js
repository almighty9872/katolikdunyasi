/* The public quick reference (/reference): data/reference-index.json, built by tools/parishes.py from parishes-src/reference.json.
   Search by word or by a canon or paragraph number (?q= in the address, as the header search sends it). */
(function () {
  var P = window.PP, $ = function (id) { return document.getElementById(id); }, REF = null, ar = '';
  var BOOK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>';
  function area(r) {
    if (r.src === 'CCC') return 'ccc';
    if (r.from >= 840 && r.to <= 1165) return 'sac';
    if ((r.from >= 515 && r.to <= 552) || (r.from >= 1254 && r.to <= 1310)) return 'gov';
    return 'other';
  }
  var TONE = { sac: 'vio', gov: 'gold', ccc: 'lit', other: 'ac' };
  function draw() {
    if (!REF) return;
    var q = $('rf-q').value.trim().toLowerCase(), cat = $('rf-cat').value, num = /^\d{1,4}$/.test(q) ? +q : null;
    var hits = REF.items.filter(function (r) {
      if (ar && area(r) !== ar) return false;
      if (cat && r.cats.indexOf(cat) < 0) return false;
      if (num !== null) return num >= r.from && num <= r.to;
      return !q || (r.title + ' ' + r.summary + ' ' + r.cats.join(' ') + ' ' + r.ref).toLowerCase().indexOf(q) >= 0;
    });
    $('rf-count').textContent = hits.length + (hits.length === 1 ? ' entry' : ' entries');
    $('rf-list').innerHTML = hits.map(function (r, i) {
      var id = 'rf-c' + i;
      return '<article class="bento-card rf-card"><div class="par-h"><span class="sq-badge ' + TONE[area(r)] + '">' + BOOK + '</span><span class="par-n"><h2 class="bc-t">' + P.esc(r.title) + '</h2><span class="ar-s">' + P.esc(r.source) + '</span></span><span class="status-pill info">' + P.esc(r.ref) + '</span></div>' +
        '<p>' + P.esc(r.summary) + '</p><p class="pp-tags">' + r.cats.map(function (c) { return '<span class="pp-tag">' + P.esc(c) + '</span>'; }).join('') + '</p>' +
        '<p class="pp-vh" id="' + id + '">' + P.esc(r.title + ': ' + r.ref + ', ' + r.source + '. Summary, not the official text: ' + r.url) + '</p>' +
        '<p class="pp-row"><a class="btn" href="' + P.esc(r.url) + '" target="_blank" rel="noopener">Official text on vatican.va</a> <button class="btn" type="button" data-copy="' + id + '">Copy the citation</button></p></article>';
    }).join('') || '<p class="pp-mut">Nothing matches. Try a canon or paragraph number, or a word such as “sponsor”.</p>';
    var s = new URLSearchParams();
    if (q) s.set('q', q); if (ar) s.set('area', ar); if (cat) s.set('topic', cat);
    try { history.replaceState(null, '', location.pathname + (s.toString() ? '?' + s : '')); } catch (e) {}
  }
  function pills() { [].forEach.call(document.querySelectorAll('[data-area]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-area') === ar)); }); }
  var u = new URLSearchParams(location.search);
  $('rf-q').value = u.get('q') || ''; ar = ['sac', 'gov', 'ccc', 'other'].indexOf(u.get('area')) >= 0 ? u.get('area') : ''; pills();
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-area]'); if (!b) return; ar = b.getAttribute('data-area'); pills(); draw(); });
  $('rf').addEventListener('input', draw);
  $('rf').addEventListener('submit', function (e) { e.preventDefault(); });
  fetch('/data/reference-index.json').then(function (r) { return r.json(); }).then(function (j) {
    REF = j; var cats = {}; j.items.forEach(function (r) { r.cats.forEach(function (c) { cats[c] = 1; }); });
    $('rf-cat').innerHTML = '<option value="">Any topic</option>' + Object.keys(cats).sort().map(function (c) { return '<option>' + P.esc(c) + '</option>'; }).join('');
    $('rf-cat').value = u.get('topic') || '';
    draw();
  }, function () { $('rf-list').innerHTML = '<p>The reference could not be loaded. Try again.</p>'; });
})();
