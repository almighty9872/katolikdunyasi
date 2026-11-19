/* The schedule widget (embed/parish.html?slug=<parish>&theme=light|dark[&compact=1]): the parish's live status in Toronto
   time, this week's Masses, Confession and Adoration, and the special dates of the next weeks, from
   /api/parishes/<slug>/schedule. Parishes frame it on their own websites (the Widget Builder in /admin writes the code).
   ?theme= is applied by theme.js. Each load adds one to the parish's monthly widget counter; nothing about the visitor is kept. */
(function () {
  var S = window.PPS, w = document.getElementById('w'), q = new URLSearchParams(location.search), slug = q.get('slug') || '';
  var KIND = { sunday: 'Weekend Masses', weekday: 'Weekday Masses', confession: 'Confession', adoration: 'Adoration' };
  var CAT = { mass: 'Mass', confession: 'Confession', adoration: 'Adoration', liturgy: 'Liturgy', office_closed: 'Office closed', no_mass: 'No Mass' };
  var SH = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  if (q.get('compact') === '1') w.classList.add('compact');
  function fail(t) { w.innerHTML = '<p class="k"><i></i>Mass times</p><h1>' + esc(t) + '</h1><p class="f"><a href="https://parishes.verbumdomini.ca/directory" target="_blank" rel="noopener">Find a parish</a></p>'; }
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) { fail('No parish chosen'); return; }
  var J = null;
  function rows(kind) {
    var ord = function (d) { return kind === 'sunday' ? (d === 6 ? -1 : d) : (d === 0 ? 7 : d); };
    var by = {}, keys = [];
    J.mass_times.filter(function (r) { return r.kind === kind; }).sort(function (a, b) { return ord(a.day) - ord(b.day) || (a.start_time < b.start_time ? -1 : 1); }).forEach(function (r) {
      var k = SH[r.day]; if (!by[k]) { by[k] = []; keys.push(k); }
      by[k].push(S.time(r.start_time) + (r.end_time ? '–' + S.time(r.end_time) : '') + (r.language && r.language !== 'English' ? ' (' + r.language + ')' : ''));
    });
    return keys.length ? '<li><span>' + KIND[kind] + '</span>' + keys.map(function (k) { return '<b>' + k + '</b> ' + esc(by[k].join(', ')); }).join(' · ') + '</li>' : '';
  }
  function draw() {
    var p = J.parish, today = S.now().date;
    var sp = J.specials.filter(function (x) { return x.event_date >= today; }).slice(0, q.get('compact') === '1' ? 3 : 8);
    var st = S.status(J.mass_times, J.specials);
    w.innerHTML = '<p class="k"><i></i>' + esc(p.city || 'Parish') + ' · Mass times</p><h1>' + esc(p.name) + '</h1>' +
      '<p class="pp-status">' + (S.badges(st, esc) || '<span class="pp-live">No Mass listed in the next seven days</span>') + '</p>' +
      (p.holiday_note ? '<p class="note">' + esc(p.holiday_note) + '</p>' : '') +
      '<ul>' + ['sunday', 'weekday', 'confession', 'adoration'].map(rows).join('') + '</ul>' +
      (sp.length ? '<h2>Special dates</h2><ul class="sp">' + sp.map(function (x) {
        return '<li><span>' + esc(S.nice(x.event_date, true)) + '</span>' + esc(x.occasion_name) + ' · ' + esc(CAT[x.category] || '') + (x.start_time ? ' ' + esc(S.time(x.start_time)) : '') + (x.notes ? ' <small>' + esc(x.notes) + '</small>' : '') + '</li>';
      }).join('') + '</ul>' : '') +
      '<p class="f"><span>Times in Toronto time. Updated ' + esc(new Date(p.updated_at * 1000).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })) + '</span>' +
      '<a href="https://parishes.verbumdomini.ca/parish/' + esc(p.slug) + '" target="_blank" rel="noopener">Full schedule</a></p>';
  }
  fetch('/api/parishes/' + slug + '/schedule').then(function (r) { return r.json(); }).then(function (j) {
    if (!j || !j.ok) { fail('Parish not found'); return; }
    J = j; draw(); setInterval(draw, 60000);
    try { fetch('/api/parishes/' + slug + '/event', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'widget' }) }).catch(function () {}); } catch (e) {}
  }, function () { fail('The schedule could not be loaded'); });
})();
