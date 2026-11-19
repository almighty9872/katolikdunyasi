/* Directory: loads every parish once (/api/parishes, cached at the edge) and filters in the browser as you type.
   The filters are kept in the address, so a filtered list can be shared or bookmarked. */
(function () {
  var P = window.PP, all = [], el = function (id) { return document.getElementById(id); };
  var q = el('f-q'), area = el('f-area'), day = el('f-day'), tm = el('f-time'), lang = el('f-lang'), conf = el('f-conf'), list = el('list'), count = el('count');
  var SH = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var view = 'cards';
  try { view = localStorage.getItem('pp-view') === 'rows' ? 'rows' : 'cards'; } catch (e) {}
  // Filters from the address
  var u = new URLSearchParams(location.search);
  q.value = u.get('q') || ''; area.value = u.get('area') || ''; day.value = u.get('day') || ''; tm.value = u.get('time') || ''; conf.checked = u.get('confession') === '1';
  function inTime(t) { var v = tm.value; return !v || (v === 'am' ? t < '12:00' : v === 'pm' ? t >= '12:00' && t < '17:00' : t >= '17:00'); }
  function masses(p) { return p.t.filter(function (x) { return x[0] === 'sunday' || x[0] === 'weekday'; }); }
  function match(p) {
    var n = q.value.trim().toLowerCase();
    if (n && (p.name + ' ' + p.city + ' ' + p.deanery + ' ' + p.street).toLowerCase().indexOf(n) < 0) return false;
    if (area.value && p.area !== area.value) return false;
    if (conf.checked && !p.t.some(function (x) { return x[0] === 'confession'; })) return false;
    if (day.value || tm.value || lang.value) {
      return masses(p).some(function (x) {
        var d = day.value === 'sun' ? x[0] === 'sunday' : day.value ? x[0] === 'weekday' && x[1] === +day.value : true;
        return d && inTime(x[2]) && (!lang.value || x[4] === lang.value);
      });
    }
    return true;
  }
  function line(rows, label) {
    if (!rows.length) return '';
    var by = {};
    rows.forEach(function (x) { var k = SH[x[1]]; (by[k] = by[k] || []).push(P.time(x[2]) + (x[4] && x[4] !== 'English' ? ' (' + x[4] + ')' : '')); });
    return '<p class="pp-times"><b>' + label + ':</b> ' + Object.keys(by).map(function (k) { return k + ' ' + P.esc(by[k].join(', ')); }).join(' · ') + '</p>';
  }
  function card(p) {
    var sun = p.t.filter(function (x) { return x[0] === 'sunday' && !/month/.test(x[5] || ''); }).sort(function (a, b) { return (a[1] === 6 ? -1 : a[1]) - (b[1] === 6 ? -1 : b[1]) || (a[2] < b[2] ? -1 : 1); });
    var cf = p.t.filter(function (x) { return x[0] === 'confession'; });
    return '<li><a class="pp-card pp-par" href="/parish/' + P.esc(p.slug) + '"><h3>' + P.esc(p.name) + '</h3>' +
      '<p class="pp-meta">' + P.esc(p.street) + ', ' + P.esc(p.city) + (p.deanery ? ' · ' + P.esc(p.deanery) : '') + '</p>' +
      line(sun, 'Weekend') + (cf.length ? line(cf, 'Confession') : '') +
      '<p class="pp-row">' + (p.claimed ? '<span class="badge">Updated by the parish</span>' : '<span class="badge gray">Archdiocese listing</span>') + '</p></a></li>';
  }
  var t0;
  function draw() {
    var hits = all.filter(match);
    list.className = 'pp-list' + (view === 'rows' ? ' rows' : '');
    list.innerHTML = hits.map(card).join('');
    count.textContent = hits.length === all.length ? all.length + ' parishes' : hits.length + ' of ' + all.length + ' parishes';
    [].forEach.call(document.querySelectorAll('[data-view]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === view)); });
    var s = new URLSearchParams();
    if (q.value.trim()) s.set('q', q.value.trim()); if (area.value) s.set('area', area.value); if (day.value) s.set('day', day.value);
    if (tm.value) s.set('time', tm.value); if (lang.value) s.set('lang', lang.value); if (conf.checked) s.set('confession', '1');
    history.replaceState(null, '', location.pathname + (s.toString() ? '?' + s : ''));
  }
  el('f').addEventListener('input', function () { clearTimeout(t0); t0 = setTimeout(draw, 120); });
  el('f').addEventListener('submit', function (e) { e.preventDefault(); draw(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-view]'); if (!b) return;
    view = b.getAttribute('data-view'); try { localStorage.setItem('pp-view', view); } catch (x) {} draw();
  });
  P.api('/api/parishes').then(function (j) {
    if (!j.ok) { count.textContent = P.err(j); return; }
    all = j.parishes;
    var langs = {};
    all.forEach(function (p) { masses(p).forEach(function (x) { if (x[4]) langs[x[4]] = (langs[x[4]] || 0) + 1; }); });
    Object.keys(langs).sort(function (a, b) { return a === 'English' ? -1 : b === 'English' ? 1 : a < b ? -1 : 1; }).forEach(function (l) {
      var o = document.createElement('option'); o.value = o.textContent = l; lang.appendChild(o);
    });
    lang.value = u.get('lang') || '';
    draw();
  });
})();
