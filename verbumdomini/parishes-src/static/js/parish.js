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
  var KIND = { sunday: ['Sunday Mass', 'lit'], weekday: ['Weekday Mass', 'ac'], confession: ['Confession', 'vio'], adoration: ['Adoration', 'gold'] };
  function table(rows, kind) {
    var none = kind === 'confession' ? 'No Confession times listed. Call the parish office or ask after Mass.' : kind === 'adoration' ? 'No Adoration hours listed.' : 'None listed.';
    // Weekend order: Saturday vigil first, then Sunday; weekdays Monday to Saturday
    var ord = function (d) { return kind === 'sunday' ? (d === 6 ? -1 : d) : (d === 0 ? 7 : d); };
    rows = rows.slice().sort(function (a, b) { return ord(a.day) - ord(b.day) || (a.start_time < b.start_time ? -1 : 1); });
    var by = [];
    rows.forEach(function (r) {
      var last = by[by.length - 1], label = P.DAYS[r.day] + (r.note === 'Vigil' ? ' (vigil)' : '');
      var t = P.time(r.start_time) + (r.end_time ? ' to ' + P.time(r.end_time) : ''), sub = [r.language && r.language !== 'English' ? r.language : '', r.note && r.note !== 'Vigil' ? r.note : ''].filter(Boolean).join(' · ');
      if (last && last.label === label) { last.t.push(t); if (sub) last.s.push(sub); } else by.push({ label: label, t: [t], s: sub ? [sub] : [] });
    });
    return '<div class="sb-g"><h3 class="sb-h">' + KIND[kind][0] + '</h3>' + (by.length ? by.map(function (x) {
      return '<div class="accent-row ' + KIND[kind][1] + '"><span><span class="ar-t">' + P.esc(x.label) + '</span>' + (x.s.length ? '<span class="ar-s">' + P.esc(x.s.join('; ')) + '</span>' : '') + '</span><span class="ar-v">' + x.t.map(P.esc).join(', ') + '</span></div>';
    }).join('') : '<p class="pp-small sb-none">' + none + '</p>') + '</div>';
  }
  function specials(list) {
    var today = S.now().date, rows = list.filter(function (x) { return x.event_date >= today; });
    var holy = S.upcoming(today, 45).filter(function (h) { return h.kind !== 'holiday' && h.kind !== 'feast'; });
    if (!rows.length) {
      return '<p class="pp-mut">The parish has not posted special times yet. Coming up: ' + P.esc(holy.slice(0, 4).map(function (h) { return h.name + ' (' + S.nice(h.date) + ')'; }).join(', ') || 'no holy days in the next weeks') + '. Check with the parish for its times.</p>';
    }
    var by = [];
    rows.forEach(function (r) { var l = by[by.length - 1]; if (l && l.d === r.event_date) l.r.push(r); else by.push({ d: r.event_date, r: [r] }); });
    return by.map(function (g) {
      return '<div class="accent-row rk"><span><span class="ar-t">' + P.esc(S.nice(g.d, true)) + (g.d === today ? ' <span class="status-pill pending">Today</span>' : '') + '</span>' + g.r.map(function (r) {
        return '<span class="ar-s"><span class="pp-tag ' + P.esc(r.category) + '">' + P.esc(CAT[r.category] || r.category) + '</span> ' + P.esc(r.occasion_name) +
          (r.language && r.language !== 'English' ? ' · ' + P.esc(r.language) : '') + (r.notes ? ' · ' + P.esc(r.notes) : '') + '</span>';
      }).join('') + '</span><span class="ar-v">' + g.r.map(function (r) { return r.start_time ? P.esc(P.time(r.start_time) + (r.end_time ? ' to ' + P.time(r.end_time) : '')) : 'All day'; }).join('<br>') + '</span></div>';
    }).join('');
  }
  function bulletin(b) {
    if (!b) return '';
    var week = 'Week of ' + S.nice(b.week_of, true) + ', ' + b.week_of.slice(0, 4);
    return '<section class="bento-card pp-bul" id="bulletin" aria-labelledby="bul-h"><div class="pp-bul-head"><h2 class="bc-t" id="bul-h">Web Bulletin</h2><span class="status-pill info">' + P.esc(week) + '</span>' +
      '<button class="btn pp-noprint" type="button" id="bul-print">Print the bulletin</button></div>' +
      (b.pastor_note ? '<h3>From the pastor</h3><div class="pp-bul-note">' + paras(b.pastor_note) + '</div>' : '') +
      (b.intentions.length ? '<h3>Mass intentions</h3><div class="pp-tbl"><table><caption class="pp-vh">Mass intentions for the ' + P.esc(week.toLowerCase()) + '</caption><tr><th scope="col">Mass</th><th scope="col">Intention</th><th scope="col">Requested by</th></tr>' +
        b.intentions.map(function (x) { return '<tr><td>' + P.esc(x.when) + '</td><td>' + P.esc(x.intention) + '</td><td>' + P.esc(x.by) + '</td></tr>'; }).join('') + '</table></div>' : '') +
      (b.announcements.length ? '<h3>Announcements</h3>' + b.announcements.map(function (a) { return '<article class="pp-ann"><h4>' + P.esc(a.title) + '</h4>' + paras(a.body) + '</article>'; }).join('') : '') +
      '</section>';
  }
  var MI = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5A5 5 0 0 1 21 19"/></svg>';
  var TONES = ['lit', 'ac', 'gold', 'vio', 'rk'];
  function ministries(list) {
    if (!list.length) return '';
    var cats = [];
    list.forEach(function (m) { var c = m.category || 'Other'; if (cats.indexOf(c) < 0) cats.push(c); });
    return '<section class="bento-card" aria-labelledby="ministries"><div class="bc-head"><h2 class="bc-t" id="ministries">Active Ministries</h2><span class="status-pill info">' + list.length + '</span></div><div class="pp-mins">' + list.map(function (m) {
      var c = m.category || 'Other';
      return '<article class="pp-min"><span class="sq-badge ' + TONES[cats.indexOf(c) % TONES.length] + '">' + MI + '</span><div><h3>' + P.esc(m.name) + '</h3><p class="ar-s">' + P.esc(c) + (m.schedule_text ? ' · ' + P.esc(m.schedule_text) : '') + '</p>' +
        (m.description ? '<p>' + P.esc(m.description) + '</p>' : '') +
        (m.contact_name || m.contact_email ? '<p class="pp-small">Contact: ' + P.esc(m.contact_name) + (m.contact_email ? ' <a href="mailto:' + P.esc(m.contact_email) + '">' + P.esc(m.contact_email) + '</a>' : '') + '</p>' : '') + '</div></article>';
    }).join('') + '</div></section>';
  }
  var ld = window.VDLit && window.VDLit.litDay(new Date());
  if (ld && ld.col !== 'green') box.setAttribute('data-lc', ld.col);
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
    var CH = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.5v4M10 4.5h4"/><path d="M5 21V11.5l7-4.5 7 4.5V21"/><path d="M3 21h18"/><path d="M10 21v-3.5a2 2 0 0 1 4 0V21"/></svg>';
    var weekly = j.bulletin ? '#bulletin' : bul;
    box.innerHTML =
      '<header class="bento-card ph">' +
      '<div class="ph-top"><span class="sq-badge lit ph-sq">' + CH + '</span><div class="ph-n"><p class="ar-s">' + P.esc([p.city, p.deanery, p.region ? p.region + ' Region' : ''].filter(Boolean).join(' · ')) + '</p>' +
      '<h1>' + P.esc(p.name) + '</h1><p class="pp-small">' + P.esc(addr) + '</p></div>' +
      (p.claimed ? '<span class="status-pill claimed"><i aria-hidden="true"></i>Claimed</span>' : '<span class="status-pill pending">Unclaimed</span>') + '</div>' +
      '<div class="ph-live"><span class="ph-lab">Right now</span><p class="pp-status" id="live" aria-live="polite"></p></div>' +
      '<p class="ph-act pp-noprint"><a class="btn p" data-dir="1" href="' + P.esc(g) + '" rel="noopener" target="_blank">Get Directions</a>' +
      (weekly ? '<a class="btn" data-bul="1" href="' + P.esc(weekly) + '"' + (weekly === bul ? ' rel="noopener" target="_blank"' : '') + '>Weekly Bulletin</a>' : '') +
      '<a class="btn" href="/generator?parish=' + enc(p.slug) + '&amp;tpl=pew&amp;fmt=card">Print Pew Card</a>' +
      '<a class="btn" href="/claim?slug=' + enc(p.slug) + '">Claim or Update</a></p>' +
      '<p class="pp-small ph-meta">' + (p.claimed ? 'Kept by the parish' : 'From the Archdiocese listing') + ' · last updated ' + P.esc(P.date(p.updated_at)) + (axKnown ? ' <span class="pp-axs">' + P.access(ax) + '</span>' : '') + '</p>' +
      '</header>' +
      (notes || p.holiday_note ? '<section class="bento-card ph-notes" aria-labelledby="notices"><h2 class="bc-t" id="notices">Parish notices</h2>' + (p.holiday_note ? '<div class="pp-note warn"><b>Schedule changes:</b> ' + P.esc(p.holiday_note) + '</div>' : '') + notes + '</section>' : '') +
      '<div class="pp-prof"><div class="pp-col">' +
      '<section class="bento-card" id="mass" aria-labelledby="sb-h"><div class="bc-head"><h2 class="bc-t" id="sb-h">Schedule Breakdown</h2><span class="status-pill season">Toronto time</span></div>' +
      '<div class="sb">' + table(T('sunday'), 'sunday') + table(T('weekday'), 'weekday') + '<div id="confession">' + table(T('confession'), 'confession') + '</div>' +
      (p.confession_notes ? '<p class="pp-small">' + P.esc(p.confession_notes) + '</p>' : '') + table(T('adoration'), 'adoration') + (p.adoration_notes ? '<p class="pp-small">' + P.esc(p.adoration_notes) + '</p>' : '') +
      '<div class="sb-g" id="special"><h3 class="sb-h">Special Holy Days</h3>' + specials(sp) + '</div></div>' +
      '<p class="pp-small">Times change on holy days and in the summer. When in doubt, check the bulletin or call the office.</p></section>' +
      (bulletin(j.bulletin) || '<section class="bento-card pp-bul" aria-labelledby="bul-h"><div class="pp-bul-head"><h2 class="bc-t" id="bul-h">Web Bulletin</h2></div><p class="pp-mut">' + (bul ? 'This parish posts its bulletin as a PDF.' : 'This parish has not posted a web bulletin.') + '</p>' + (bul ? '<p><a class="btn" data-bul="1" href="' + P.esc(bul) + '" rel="noopener" target="_blank">Bulletin (PDF)</a></p>' : '') + '</section>') +
      '</div><aside class="pp-col pp-side" aria-label="Clergy, ministries, access and map">' +
      '<section class="bento-card" aria-labelledby="cl-h"><h2 class="bc-t" id="cl-h">Clergy and Office Hours</h2>' +
      (clergy.length ? '<ul class="pp-clergy">' + clergy.map(function (c) { return '<li><span class="pp-av">' + P.esc(c.name.replace(/^(Rev\.|Fr\.|Father|Msgr\.|Deacon|Dcn\.|Very Rev\.|Most Rev\.)\s*/i, '').split(/\s+/).map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase()) + '</span><span><b>' + P.esc(c.name) + '</b>' + (c.role ? '<span class="ar-s">' + P.esc(c.role) + '</span>' : '') + '</span></li>'; }).join('') + '</ul>' : '<p class="pp-mut">No clergy listed.</p>') +
      (p.office_hours ? '<div class="inset-stat"><span class="is-l">Office hours</span><p class="pp-pre">' + P.esc(p.office_hours) + '</p></div>' : '') +
      '<p class="pp-contact">' + (p.phone ? '<a href="tel:' + P.esc(p.phone.replace(/[^0-9+]/g, '')) + '">' + P.esc(p.phone) + '</a>' : '') +
      (p.email ? '<a href="mailto:' + P.esc(p.email) + '">' + P.esc(p.email) + '</a>' : '') +
      (web ? '<a href="' + P.esc(web) + '" rel="noopener" target="_blank">Official website</a>' : '') + (live ? '<a href="' + P.esc(live) + '" rel="noopener" target="_blank">Livestream</a>' : '') + '</p></section>' +
      ministries(mins) +
      '<section class="bento-card" aria-labelledby="ax-h"><h2 class="bc-t" id="ax-h">Accessibility</h2>' +
        (axKnown ? '<ul class="pp-axl">' + Object.keys(P.AX).filter(function (k) { return typeof ax[k] === 'boolean'; }).map(function (k) { return '<li class="' + (ax[k] ? '' : 'no') + '">' + P.access({ [k]: ax[k] }, true, true) + ' ' + P.esc(P.AX[k][0]) + (ax[k] ? '' : ': not available') + '</li>'; }).join('') + '</ul>' : '<p class="pp-mut">The parish has not listed its accessibility features.</p>') +
        (p.languages && p.languages.length ? '<p class="pp-small"><b>Languages:</b> ' + P.esc(p.languages.join(', ')) + '</p>' : '') + '</section>' +
      '<section class="bento-card pp-map" aria-labelledby="contact"><h2 class="bc-t" id="contact">Map</h2>' +
      (osm ? '<iframe class="pp-osm" title="Map of ' + P.esc(p.name) + '" src="' + P.esc(osm) + '" loading="lazy" referrerpolicy="no-referrer"></iframe><p class="pp-small"><a href="' + P.esc(big) + '" rel="noopener" target="_blank">Larger map</a> · © OpenStreetMap contributors</p>' : '') +
      '<p>' + P.esc(addr) + '</p><p class="pp-row"><a class="btn p" data-dir="1" href="' + P.esc(g) + '" rel="noopener" target="_blank">Directions</a> <a class="btn" data-dir="1" href="' + P.esc(a) + '" rel="noopener" target="_blank">Apple Maps</a></p></section>' +
      '</aside></div>';
    function tick() { var el = document.getElementById('live'); if (el) el.innerHTML = S.badges(S.status(j.mass_times, sp), P.esc) || '<span class="pp-small">No Mass in the next seven days is listed.</span>'; }
    tick(); setInterval(tick, 60000);
    box.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('a,button'); if (!t) return;
      if (t.hasAttribute('data-dir')) P.track(p.slug, 'directions');
      if (t.hasAttribute('data-bul') && t.getAttribute('href') !== '#bulletin') P.track(p.slug, 'bulletin');
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
