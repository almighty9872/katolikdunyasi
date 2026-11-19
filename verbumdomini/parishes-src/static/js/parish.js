/* A parish's profile, /parish/<slug>: drawn from /api/parishes/<slug>. The status badges (next Mass, Confession open now,
   special holy day schedule) come from sched.js in Toronto time and are refreshed every minute. The map is OpenStreetMap's
   own embed; the monthly counters (profile view, directions, bulletin) keep nothing about the visitor. */
(function () {
  var P = window.PP, S = window.PPS, box = document.getElementById('prof');
  var slug = (location.pathname.match(/^\/parish\/([a-z0-9-]+)/) || [])[1] || new URLSearchParams(location.search).get('slug') || '';
  var CAT = { mass: 'Mass', confession: 'Confession', adoration: 'Adoration', liturgy: 'Liturgy', office_closed: 'Office closed', no_mass: 'No Mass' };
  function enc(s) { return encodeURIComponent(s); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function paras(t) { return String(t || '').split(/\n{2,}/).map(function (x) { return '<p>' + P.esc(x).replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function table(rows, kind) {
    if (!rows.length) return '<p class="pp-mut">' + (kind === 'confession' ? 'No Confession times listed. Call the parish office or ask after Mass.' : kind === 'adoration' ? 'No Adoration hours listed.' : 'None listed.') + '</p>';
    // Weekend order: Saturday vigil first, then Sunday; weekdays Monday to Saturday
    var ord = function (d) { return kind === 'sunday' ? (d === 6 ? -1 : d) : (d === 0 ? 7 : d); };
    rows = rows.slice().sort(function (a, b) { return ord(a.day) - ord(b.day) || (a.start_time < b.start_time ? -1 : 1); });
    var by = [];
    rows.forEach(function (r) {
      var last = by[by.length - 1], label = P.DAYS[r.day] + (r.note === 'Vigil' ? ' (vigil)' : '');
      var t = P.time(r.start_time) + (r.end_time ? ' to ' + P.time(r.end_time) : '') + (r.language && r.language !== 'English' ? ' · ' + r.language : '') + (r.note && r.note !== 'Vigil' ? ' · ' + r.note : '');
      if (last && last.label === label) last.t.push(t); else by.push({ label: label, t: [t] });
    });
    return '<table class="pp-sched"><tr><th scope="col">Day</th><th scope="col">Times</th></tr>' + by.map(function (x) { return '<tr><th scope="row">' + P.esc(x.label) + '</th><td>' + x.t.map(P.esc).join('<br>') + '</td></tr>'; }).join('') + '</table>';
  }
  function specials(list) {
    var today = S.now().date, rows = list.filter(function (x) { return x.event_date >= today; });
    var holy = S.upcoming(today, 45).filter(function (h) { return h.kind !== 'holiday' && h.kind !== 'feast'; });
    if (!rows.length) {
      return '<p class="pp-mut">The parish has not posted special times yet. Coming up: ' + P.esc(holy.slice(0, 4).map(function (h) { return h.name + ' (' + S.nice(h.date) + ')'; }).join(', ') || 'no holy days in the next weeks') + '. Check with the parish for its times.</p>';
    }
    var by = [];
    rows.forEach(function (r) { var l = by[by.length - 1]; if (l && l.d === r.event_date) l.r.push(r); else by.push({ d: r.event_date, r: [r] }); });
    return '<ul class="pp-spec">' + by.map(function (g) {
      return '<li><p class="pp-spec-d"><b>' + P.esc(S.nice(g.d, true)) + '</b>' + (g.d === today ? ' <span class="badge">Today</span>' : '') + '</p><ul>' + g.r.map(function (r) {
        return '<li><span class="pp-tag ' + P.esc(r.category) + '">' + P.esc(CAT[r.category] || r.category) + '</span> ' + P.esc(r.occasion_name) +
          (r.start_time ? ': ' + P.esc(P.time(r.start_time) + (r.end_time ? ' to ' + P.time(r.end_time) : '')) : '') +
          (r.language && r.language !== 'English' ? ' · ' + P.esc(r.language) : '') + (r.notes ? ' <span class="pp-small">' + P.esc(r.notes) + '</span>' : '') + '</li>';
      }).join('') + '</ul></li>';
    }).join('') + '</ul>';
  }
  function bulletin(b) {
    if (!b) return '';
    var week = 'Week of ' + S.nice(b.week_of, true) + ', ' + b.week_of.slice(0, 4);
    return '<section class="pp-bul" id="bulletin" aria-labelledby="bul-h"><div class="pp-bul-head"><h2 id="bul-h">Web Bulletin</h2><p class="pp-small">' + P.esc(week) + '</p>' +
      '<button class="btn pp-noprint" type="button" id="bul-print">Print the bulletin</button></div>' +
      (b.pastor_note ? '<h3>From the pastor</h3><div class="pp-bul-note">' + paras(b.pastor_note) + '</div>' : '') +
      (b.intentions.length ? '<h3>Mass intentions</h3><div class="pp-tbl"><table><caption class="pp-vh">Mass intentions for the ' + P.esc(week.toLowerCase()) + '</caption><tr><th scope="col">Mass</th><th scope="col">Intention</th><th scope="col">Requested by</th></tr>' +
        b.intentions.map(function (x) { return '<tr><td>' + P.esc(x.when) + '</td><td>' + P.esc(x.intention) + '</td><td>' + P.esc(x.by) + '</td></tr>'; }).join('') + '</table></div>' : '') +
      (b.announcements.length ? '<h3>Announcements</h3>' + b.announcements.map(function (a) { return '<article class="pp-ann"><h4>' + P.esc(a.title) + '</h4>' + paras(a.body) + '</article>'; }).join('') : '') +
      '</section>';
  }
  function ministries(list) {
    if (!list.length) return '';
    var cats = {};
    list.forEach(function (m) { (cats[m.category || 'Other'] = cats[m.category || 'Other'] || []).push(m); });
    return '<h2 id="ministries">Parish Ministries</h2><div class="pp-mins">' + Object.keys(cats).map(function (c) {
      return cats[c].map(function (m) {
        return '<article class="pp-card pp-min"><p class="pp-tags"><span class="pp-tag">' + P.esc(c) + '</span></p><h3>' + P.esc(m.name) + '</h3>' +
          (m.schedule_text ? '<p class="pp-small"><b>When:</b> ' + P.esc(m.schedule_text) + '</p>' : '') + (m.description ? '<p>' + P.esc(m.description) + '</p>' : '') +
          (m.contact_name || m.contact_email ? '<p class="pp-small">Contact: ' + P.esc(m.contact_name) + (m.contact_email ? ' <a href="mailto:' + P.esc(m.contact_email) + '">' + P.esc(m.contact_email) + '</a>' : '') + '</p>' : '') + '</article>';
      }).join('');
    }).join('') + '</div>';
  }
  if (!/^[a-z0-9-]+$/.test(slug)) { box.innerHTML = '<h1>Parish not found</h1><p><a href="/directory">Open the directory</a></p>'; return; }
  P.api('/api/parishes/' + slug).then(function (j) {
    if (!j.ok) { box.innerHTML = '<h1>' + (j.status === 404 ? 'Parish not found' : 'The parish could not be loaded') + '</h1><p>' + P.esc(j.status === 404 ? 'This parish is not in the directory, or its address has changed.' : P.err(j)) + '</p><p><a class="btn" href="/directory">Open the directory</a></p>'; return; }
    var p = j.parish, T = function (k) { return j.mass_times.filter(function (r) { return r.kind === k; }); };
    var sp = j.specials || [], mins = j.ministries || [];
    document.title = p.name + ' · Verbum Domini for Parishes';
    P.track(p.slug, 'profile');
    var addr = p.street + ', ' + p.city + ', ON' + (p.postal_code ? ' ' + p.postal_code : '');
    var g = p.lat != null ? 'https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng : 'https://www.google.com/maps/dir/?api=1&destination=' + enc(p.name + ', ' + addr);
    var a = 'https://maps.apple.com/?daddr=' + (p.lat != null ? p.lat + ',' + p.lng : enc(addr)) + '&q=' + enc(p.name);
    var osm = p.lat != null ? 'https://www.openstreetmap.org/export/embed.html?bbox=' + [(p.lng - 0.006).toFixed(5), (p.lat - 0.0035).toFixed(5), (p.lng + 0.006).toFixed(5), (p.lat + 0.0035).toFixed(5)].join(',') + '&layer=mapnik&marker=' + p.lat + ',' + p.lng : '';
    var big = p.lat != null ? 'https://www.openstreetmap.org/?mlat=' + p.lat + '&mlon=' + p.lng + '#map=17/' + p.lat + '/' + p.lng : '';
    var web = safeUrl(p.website_url), bul = safeUrl(p.bulletin_url), live = safeUrl(p.livestream_url);
    var notes = j.announcements.map(function (n) { return '<article class="pp-ann"><h3>' + P.esc(n.title) + '</h3>' + (n.body ? '<p>' + P.esc(n.body) + '</p>' : '') + (n.expires_at ? '<p class="pp-small">Until ' + P.esc(P.date(n.expires_at)) + '</p>' : '') + '</article>'; }).join('');
    var clergy = (p.pastor_name ? [{ name: p.pastor_name, role: 'Pastor' }] : []).concat(p.clergy || []);
    var ax = p.accessibility || {}, axKnown = Object.keys(ax).length > 0;
    box.innerHTML =
      '<header class="pp-phead">' +
      '<p class="pp-tags">' + (p.deanery ? '<span class="pp-tag dean">' + P.esc(p.deanery) + '</span>' : '') + (p.city ? '<span class="pp-tag city">' + P.esc(p.city) + '</span>' : '') + (p.region ? '<span class="pp-tag">' + P.esc(p.region) + ' Region</span>' : '') + '</p>' +
      '<h1>' + P.esc(p.name) + '</h1>' +
      '<p class="pp-status" id="live" aria-live="polite"></p>' +
      '<p class="pp-row">' + (p.claimed ? '<span class="badge">Updated by the parish</span>' : '<span class="badge gray">Archdiocese listing</span>') + ' <span class="pp-small">Last updated ' + P.esc(P.date(p.updated_at)) + '</span>' +
      (axKnown ? ' <span class="pp-axs">' + P.access(ax) + '</span>' : '') + '</p>' +
      '<nav class="pp-jump pp-noprint" aria-label="On this page"><a href="#mass">Mass times</a><a href="#confession">Confession</a><a href="#special">Special dates</a>' + (j.bulletin ? '<a href="#bulletin">Bulletin</a>' : '') + (mins.length ? '<a href="#ministries">Ministries</a>' : '') + '<a href="#contact">Contact</a></nav>' +
      '</header>' +
      '<div class="pp-prof"><div>' +
      (notes ? '<h2 id="notices">Parish notices</h2>' + notes : '') +
      (p.holiday_note ? '<div class="pp-note warn"><b>Schedule changes:</b> ' + P.esc(p.holiday_note) + '</div>' : '') +
      '<h2 id="mass">Mass times</h2><div class="pp-grid two pp-sched-g"><div class="pp-card"><h3>Weekend</h3>' + table(T('sunday'), 'sunday') + '</div><div class="pp-card"><h3>Weekdays</h3>' + table(T('weekday'), 'weekday') + '</div></div>' +
      '<h2 id="confession">Confession and Adoration</h2><div class="pp-grid two pp-sched-g"><div class="pp-card"><h3>Confession</h3>' + table(T('confession'), 'confession') + (p.confession_notes ? '<p class="pp-small">' + P.esc(p.confession_notes) + '</p>' : '') + '</div>' +
      '<div class="pp-card"><h3>Adoration</h3>' + table(T('adoration'), 'adoration') + (p.adoration_notes ? '<p class="pp-small">' + P.esc(p.adoration_notes) + '</p>' : '') + '</div></div>' +
      '<h2 id="special">Special Liturgical Dates</h2>' + specials(sp) +
      '<p class="pp-small">Times change on holy days and in the summer. When in doubt, check the bulletin or call the office.</p>' +
      bulletin(j.bulletin) + ministries(mins) +
      '</div><aside class="pp-side" aria-label="Map and contact">' +
      '<div class="pp-card pp-map"><h3 id="contact">Address</h3>' +
      (osm ? '<iframe class="pp-osm" title="Map of ' + P.esc(p.name) + '" src="' + P.esc(osm) + '" loading="lazy" referrerpolicy="no-referrer"></iframe><p class="pp-small"><a href="' + P.esc(big) + '" rel="noopener" target="_blank">Larger map</a> · © OpenStreetMap contributors</p>' : '') +
      '<p>' + P.esc(addr) + '</p><p class="pp-row"><a class="btn p" data-dir="1" href="' + P.esc(g) + '" rel="noopener" target="_blank">Directions</a> <a class="btn" data-dir="1" href="' + P.esc(a) + '" rel="noopener" target="_blank">Apple Maps</a></p></div>' +
      '<div class="pp-card"><h3>Clergy and office</h3>' +
      (clergy.length ? '<ul class="pp-clergy">' + clergy.map(function (c) { return '<li><b>' + P.esc(c.name) + '</b>' + (c.role ? '<span class="pp-small"> ' + P.esc(c.role) + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '') +
      (p.office_hours ? '<p class="pp-small"><b>Office hours</b></p><p class="pp-pre">' + P.esc(p.office_hours) + '</p>' : '') +
      (p.phone ? '<p><a href="tel:' + P.esc(p.phone.replace(/[^0-9+]/g, '')) + '">' + P.esc(p.phone) + '</a></p>' : '') +
      (p.email ? '<p><a href="mailto:' + P.esc(p.email) + '">' + P.esc(p.email) + '</a></p>' : '') +
      (web ? '<p><a href="' + P.esc(web) + '" rel="noopener" target="_blank">Official website</a></p>' : '') + '</div>' +
      (axKnown || (p.languages && p.languages.length) ? '<div class="pp-card"><h3>Access and languages</h3>' +
        (axKnown ? '<ul class="pp-axl">' + Object.keys(P.AX).filter(function (k) { return typeof ax[k] === 'boolean'; }).map(function (k) { return '<li class="' + (ax[k] ? '' : 'no') + '">' + P.access({ [k]: ax[k] }, true, true) + ' ' + P.esc(P.AX[k][0]) + (ax[k] ? '' : ': not available') + '</li>'; }).join('') + '</ul>' : '') +
        (p.languages && p.languages.length ? '<p class="pp-small"><b>Languages:</b> ' + P.esc(p.languages.join(', ')) + '</p>' : '') + '</div>' : '') +
      ((bul || live) ? '<div class="pp-card"><h3>This week</h3><p class="pp-row">' + (bul ? '<a class="btn p" data-bul="1" href="' + P.esc(bul) + '" rel="noopener" target="_blank">Bulletin (PDF)</a> ' : '') + (live ? '<a class="btn" href="' + P.esc(live) + '" rel="noopener" target="_blank">Livestream</a>' : '') + '</p></div>' : '') +
      '</aside></div>' +
      '<p class="pp-note ac pp-noprint">Work for this parish? <a href="/claim?slug=' + enc(p.slug) + '">Claim or update this parish</a>. Print a pew card or poster with these times in the <a href="/generator?parish=' + enc(p.slug) + '">Print Generator</a>.</p>';
    function tick() { var el = document.getElementById('live'); if (el) el.innerHTML = S.badges(S.status(j.mass_times, sp), P.esc) || '<span class="pp-small">No Mass in the next seven days is listed.</span>'; }
    tick(); setInterval(tick, 60000);
    box.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('a,button'); if (!t) return;
      if (t.hasAttribute('data-dir')) P.track(p.slug, 'directions');
      if (t.hasAttribute('data-bul')) P.track(p.slug, 'bulletin');
      if (t.id === 'bul-print') { document.body.classList.add('pp-print-bul'); window.print(); setTimeout(function () { document.body.classList.remove('pp-print-bul'); }, 500); }
    });
    // The web bulletin counts as read once it has been on screen
    var wb = document.getElementById('bulletin');
    if (wb && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); P.track(p.slug, 'bulletin'); } });
      io.observe(wb);
    }
  });
})();
