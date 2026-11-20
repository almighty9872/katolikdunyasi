/* Directory: loads every parish once (/api/parishes, cached at the edge) and filters in the browser as you type.
   The filters are kept in the address, so a filtered list can be shared or bookmarked. */
(function () {
  var P = window.PP, all = [], el = function (id) { return document.getElementById(id); };
  var q = el('f-q'), area = el('f-area'), day = el('f-day'), tm = el('f-time'), lang = el('f-lang'), sp = el('f-sp'), list = el('list'), count = el('count');
  var SH = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var view = 'cards';
  try { view = localStorage.getItem('pp-view') === 'rows' ? 'rows' : 'cards'; } catch (e) {}
  // Filters from the address
  var u = new URLSearchParams(location.search);
  q.value = u.get('q') || ''; area.value = u.get('area') || ''; day.value = u.get('day') || ''; tm.value = u.get('time') || ''; var show = u.get('show') || (u.get('confession') === '1' ? 'confession' : u.get('access') === '1' ? 'access' : '');
  if (['', 'claimed', 'confession', 'access'].indexOf(show) < 0) show = '';
  sp.checked = u.get('special') === '1';
  function inTime(t) { var v = tm.value; return !v || (v === 'am' ? t < '12:00' : v === 'pm' ? t >= '12:00' && t < '17:00' : t >= '17:00'); }
  function masses(p) { return p.t.filter(function (x) { return x[0] === 'sunday' || x[0] === 'weekday'; }); }
  function match(p) {
    var n = q.value.trim().toLowerCase();
    if (n && (p.name + ' ' + p.city + ' ' + p.deanery + ' ' + p.street).toLowerCase().indexOf(n) < 0) return false;
    if (area.value && p.area !== area.value) return false;
    if (show === 'claimed' && !p.claimed) return false;
    if (show === 'confession' && !p.t.some(function (x) { return x[0] === 'confession'; })) return false;
    if (show === 'access' && p.access !== 1) return false;
    if (sp.checked && !(p.x && p.x.length)) return false;
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
    rows.forEach(function (x) { var k = SH[x[1]]; (by[k] = by[k] || []).push(P.time(x[2]).replace(/:00 /, ' ') + (x[4] && x[4] !== 'English' ? ' (' + x[4] + ')' : '')); });
    return '<div class="par-r"><dt>' + label + '</dt><dd>' + Object.keys(by).map(function (k) { return '<span><b>' + k + '</b> ' + P.esc(by[k].join(', ')) + '</span>'; }).join('') + '</dd></div>';
  }
  var CH = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.5v4M10 4.5h4"/><path d="M5 21V11.5l7-4.5 7 4.5V21"/><path d="M3 21h18"/><path d="M10 21v-3.5a2 2 0 0 1 4 0V21"/></svg>';
  function card(p, i) {
    var sun = p.t.filter(function (x) { return x[0] === 'sunday' && !/month/.test(x[5] || ''); }).sort(function (a, b) { return (a[1] === 6 ? -1 : a[1]) - (b[1] === 6 ? -1 : b[1]) || (a[2] < b[2] ? -1 : 1); });
    var wk = p.t.filter(function (x) { return x[0] === 'weekday' && !/month/.test(x[5] || ''); });
    var cf = p.t.filter(function (x) { return x[0] === 'confession'; });
    var langs = (p.langs || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x && x !== 'English'; });
    return '<li><a class="bento-card pp-par pp-nl" href="/parish/' + P.esc(p.slug) + '">' +
      '<div class="par-h"><span class="sq-badge lit">' + CH + '</span><span class="par-n"><h3>' + P.esc(p.name) + '</h3>' +
      '<span class="ar-s">' + P.esc([p.city, p.deanery].filter(Boolean).join(' · ')) + '</span></span>' +
      (p.claimed ? '<span class="status-pill claimed"><i aria-hidden="true"></i>Claimed</span>' : '<span class="status-pill info">Listing</span>') + '</div>' +
      '<p class="pp-status" data-i="' + i + '" aria-live="off">' + live(p) + '</p>' +
      '<dl class="par-s">' + line(sun, 'Weekend') + line(wk.slice(0, 12), 'Weekdays') + line(cf, 'Confession') + '</dl>' +
      '<p class="pp-foot"><span class="pp-small">' + P.esc(p.street) + '</span><span class="pp-axs">' + P.access(p.ax) + '</span>' + (langs.length ? '<span class="pp-small">Also in ' + P.esc(langs.join(', ')) + '</span>' : '') + '</p></a></li>';
  }
  function live(p) { return window.PPS ? window.PPS.badges(window.PPS.status(p.t, p.x), P.esc) : ''; }
  // The badges follow the clock: every minute, the cards on screen get this minute's status
  var shown = [];
  setInterval(function () {
    [].forEach.call(list.querySelectorAll('.pp-status[data-i]'), function (el) { var p = shown[+el.getAttribute('data-i')]; if (p) el.innerHTML = live(p); });
  }, 60000);
  var t0;
  function draw() {
    var hits = all.filter(match);
    list.className = 'pp-list' + (view === 'rows' ? ' rows' : '');
    shown = hits;
    list.innerHTML = hits.map(card).join('');
    count.textContent = hits.length === all.length ? all.length + ' parishes' : hits.length + ' of ' + all.length + ' parishes';
    [].forEach.call(document.querySelectorAll('[data-view]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === view)); });
    var s = new URLSearchParams();
    if (q.value.trim()) s.set('q', q.value.trim()); if (area.value) s.set('area', area.value); if (day.value) s.set('day', day.value);
    if (tm.value) s.set('time', tm.value); if (lang.value) s.set('lang', lang.value); if (show) s.set('show', show); if (sp.checked) s.set('special', '1');
    history.replaceState(null, '', location.pathname + (s.toString() ? '?' + s : ''));
  }
  el('f').addEventListener('input', function () { clearTimeout(t0); t0 = setTimeout(draw, 120); });
  el('f').addEventListener('submit', function (e) { e.preventDefault(); draw(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-show]');
    if (t) { show = t.getAttribute('data-show'); pills(); draw(); return; }
    var b = e.target.closest && e.target.closest('[data-view]'); if (!b) return;
    view = b.getAttribute('data-view'); try { localStorage.setItem('pp-view', view); } catch (x) {} draw();
  });
  function pills() { [].forEach.call(document.querySelectorAll('[data-show]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-show') === show)); }); }
  pills();
  // The cards' square badges take the colour of the liturgical day
  var ld = window.VDLit && window.VDLit.litDay(new Date());
  if (ld && ld.col !== 'green') list.setAttribute('data-lc', ld.col);
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
