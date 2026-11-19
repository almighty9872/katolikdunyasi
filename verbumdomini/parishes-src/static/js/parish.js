/* A parish's profile, /parish/<slug>: drawn from /api/parishes/<slug>. */
(function () {
  var P = window.PP, box = document.getElementById('prof');
  var slug = (location.pathname.match(/^\/parish\/([a-z0-9-]+)/) || [])[1] || new URLSearchParams(location.search).get('slug') || '';
  var KIND = { sunday: 'Sunday Masses', weekday: 'Weekday Masses', confession: 'Confession', adoration: 'Adoration' };
  function enc(s) { return encodeURIComponent(s); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
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
    return '<table class="pp-sched"><tr><th>Day</th><th>Times</th></tr>' + by.map(function (x) { return '<tr><td>' + P.esc(x.label) + '</td><td>' + x.t.map(P.esc).join('<br>') + '</td></tr>'; }).join('') + '</table>';
  }
  if (!/^[a-z0-9-]+$/.test(slug)) { box.innerHTML = '<h1>Parish not found</h1><p><a href="/directory">Open the directory</a></p>'; return; }
  P.api('/api/parishes/' + slug).then(function (j) {
    if (!j.ok) { box.innerHTML = '<h1>' + (j.status === 404 ? 'Parish not found' : 'The parish could not be loaded') + '</h1><p>' + P.esc(j.status === 404 ? 'This parish is not in the directory, or its address has changed.' : P.err(j)) + '</p><p><a class="btn" href="/directory">Open the directory</a></p>'; return; }
    var p = j.parish, T = function (k) { return j.mass_times.filter(function (r) { return r.kind === k; }); };
    document.title = p.name + ' · Verbum Domini for Parishes';
    var addr = p.street + ', ' + p.city + ', ON' + (p.postal_code ? ' ' + p.postal_code : '');
    var g = p.lat != null ? 'https://www.google.com/maps/search/?api=1&query=' + p.lat + ',' + p.lng : 'https://www.google.com/maps/search/?api=1&query=' + enc(p.name + ', ' + addr);
    var a = 'https://maps.apple.com/?q=' + enc(p.name) + (p.lat != null ? '&ll=' + p.lat + ',' + p.lng : '&address=' + enc(addr));
    var web = safeUrl(p.website_url), bul = safeUrl(p.bulletin_url), live = safeUrl(p.livestream_url);
    var notes = j.announcements.map(function (n) { return '<article class="pp-ann"><h3>' + P.esc(n.title) + '</h3>' + (n.body ? '<p>' + P.esc(n.body) + '</p>' : '') + (n.expires_at ? '<p class="pp-small">Until ' + P.esc(P.date(n.expires_at)) + '</p>' : '') + '</article>'; }).join('');
    box.innerHTML =
      '<p class="pp-kick">' + P.esc([p.deanery, p.region && p.region + ' Region'].filter(Boolean).join(' · ')) + '</p>' +
      '<h1>' + P.esc(p.name) + '</h1>' +
      '<p class="pp-row">' + (p.claimed ? '<span class="badge">Updated by the parish</span>' : '<span class="badge gray">Archdiocese listing</span>') + ' <span class="pp-small">Last updated ' + P.esc(P.date(p.updated_at)) + '</span></p>' +
      '<div class="pp-prof"><div>' +
      (notes ? '<h2 id="notices">Parish notices</h2>' + notes : '') +
      '<h2 id="mass">Mass times</h2><h3>Weekend</h3>' + table(T('sunday'), 'sunday') + '<h3>Weekdays</h3>' + table(T('weekday'), 'weekday') +
      '<h2 id="confession">Confession and Adoration</h2><h3>Confession</h3>' + table(T('confession'), 'confession') + '<h3>Adoration</h3>' + table(T('adoration'), 'adoration') +
      '<p class="pp-small">Times change on holy days and in the summer. When in doubt, check the bulletin or call the office.</p>' +
      '</div><aside class="pp-side" aria-label="Contact">' +
      '<div class="pp-card"><h3>Address</h3><p>' + P.esc(addr) + '</p><p class="pp-row"><a class="btn" href="' + P.esc(g) + '" rel="noopener" target="_blank">Google Maps</a> <a class="btn" href="' + P.esc(a) + '" rel="noopener" target="_blank">Apple Maps</a></p></div>' +
      '<div class="pp-card"><h3>Contact</h3>' +
      (p.phone ? '<p><a href="tel:' + P.esc(p.phone.replace(/[^0-9+]/g, '')) + '">' + P.esc(p.phone) + '</a></p>' : '') +
      (p.email ? '<p><a href="mailto:' + P.esc(p.email) + '">' + P.esc(p.email) + '</a></p>' : '') +
      (web ? '<p><a href="' + P.esc(web) + '" rel="noopener" target="_blank">Official website</a></p>' : '') + '</div>' +
      ((bul || live) ? '<div class="pp-card"><h3>This week</h3><p class="pp-row">' + (bul ? '<a class="btn p" href="' + P.esc(bul) + '" rel="noopener" target="_blank">Weekly bulletin</a> ' : '') + (live ? '<a class="btn" href="' + P.esc(live) + '" rel="noopener" target="_blank">Livestream</a>' : '') + '</p></div>' : '') +
      '</aside></div>' +
      '<p class="pp-note ac pp-noprint">Work for this parish? <a href="/claim?slug=' + enc(p.slug) + '">Claim or update this parish</a>.</p>';
  });
})();
