/* The workspace of a verified parish (/admin): a sidebar of eight panels (a drawer on phones). Everything comes from
   /api/admin/me; the server limits every change to the parish named in the session, whatever this page sends.
   This file: sign-in, the panels' navigation, the weekly schedule, contact and notices, the pew QR poster, editors and the
   site administrator's tools. admin-ops.js (window.PPOps): the dashboard, special dates, web bulletin, clergy and ministries,
   print presets, the Canon Law and Catechism reference and the widget builder. */
(function () {
  var P = window.PP, $ = function (id) { return document.getElementById(id); };
  var SITE = location.origin, D = null, sched = [], dirty = false;
  var KINDS = [['sunday', 'Sunday Masses', 'Include Saturday vigils here (day: Saturday, note: Vigil).'], ['weekday', 'Weekday Masses', ''],
    ['confession', 'Confession', 'Give an end time for each window.'], ['adoration', 'Adoration', '']];
  function msg(id, t, ok) { var m = $(id); if (!m) return; m.textContent = t || ''; m.className = 'pp-msg' + (t ? ok ? ' ok' : ' err' : ''); }
  function gate(html) { $('gate').innerHTML = html; $('gate').hidden = false; $('dash').hidden = true; }

  // ---- panels: a vertical tab list (arrow keys, Home and End move between them); on phones a drawer ----
  var tabs = [].slice.call(document.querySelectorAll('.pp-sidenav .pp-tab'));
  var OLD = { ann: 'bul', qr: 'print' };   // addresses of the earlier dashboard's tabs
  function drawer(open) { $('d-menu').setAttribute('aria-expanded', String(open)); $('d-side').classList.toggle('open', open); }
  function show(t, focusPanel) {
    tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; $(x.getAttribute('aria-controls')).hidden = !on; });
    if (t.id === 't-print') poster();
    if (window.PPOps && D) window.PPOps.shown(t.id.slice(2));
    try { history.replaceState(null, '', '#' + t.id.slice(2)); } catch (e) {}
    drawer(false);
    if (focusPanel) { var h = $(t.getAttribute('aria-controls')); h.tabIndex = -1; h.focus(); }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t, window.matchMedia('(max-width:900px)').matches); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, j = k === 'ArrowDown' || k === 'ArrowRight' ? i + 1 : k === 'ArrowUp' || k === 'ArrowLeft' ? i - 1 : k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : -9;
      if (j === -9) return;
      e.preventDefault(); var n = tabs[(j + tabs.length) % tabs.length]; n.focus(); show(n);
    });
  });
  $('d-menu').addEventListener('click', function () { drawer($('d-menu').getAttribute('aria-expanded') !== 'true'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('d-side').classList.contains('open')) { drawer(false); $('d-menu').focus(); } });
  // Other panels' links: data-go="<panel>" or "<panel>#<field id>"
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-go]'); if (!a) return;
    e.preventDefault();
    var g = a.getAttribute('data-go').split('#'), t = $('t-' + g[0]); if (!t) return;
    show(t);
    if (g[1] && $(g[1])) { $(g[1]).scrollIntoView({ block: 'center' }); $(g[1]).focus(); }
  });

  function load() {
    return P.api('/api/admin/me').then(function (j) {
      if (j.status === 401) { gate('<div class="pp-narrow"><h1>Parish Admin</h1><p class="pp-lede">Sign in with the email address you used to claim your parish, or that its administrator added.</p><p class="pp-row"><a class="btn p" href="/claim?login=1">Sign in</a> <a class="btn" href="/claim">Claim a parish</a></p></div>'); return; }
      if (!j.ok) { gate('<h1>Parish Admin</h1><p>' + P.esc(P.err(j)) + '</p>'); return; }
      if (j.super) suBar(j);
      if (!j.parish) { gate('<div class="pp-narrow"><h1>Site administrator</h1><p class="pp-lede">Choose a parish above to open its dashboard.</p></div>'); return; }
      D = j; $('gate').hidden = true; $('dash').hidden = false; draw();
    });
  }
  function draw() {
    var p = D.parish;
    document.title = p.name + ' · Parish Admin';
    $('d-name').textContent = p.name;
    $('d-kick').textContent = 'Parish Admin · ' + [p.deanery, p.city].filter(Boolean).join(', ');
    $('d-me').textContent = D.super ? 'Site administrator; changes are logged as yours' : D.me.name + ' · ' + D.me.role + (D.me.owner ? ', primary administrator' : '');
    // The site administrator's tools live in the last panel while a parish is open
    if (D.super) $('su-slot').appendChild($('su'));
    $('d-public').href = '/parish/' + p.slug;
    sched = D.mass_times.map(function (r) { return { kind: r.kind, day: r.day, start_time: r.start_time, end_time: r.end_time || '', language: r.language || 'English', note: r.note || '' }; });
    drawSched(); dirty = false;
    $('pr-bul').value = p.bulletin_url || ''; $('pr-live').value = p.livestream_url || ''; $('pr-phone').value = p.phone || ''; $('pr-email').value = p.email || '';
    $('pr-note').value = p.holiday_note || '';
    $('pr-listing').hidden = !D.super;
    if (D.super) {
      $('li-name').value = p.name; $('li-street').value = p.street; $('li-city').value = p.city; $('li-postal').value = p.postal_code; $('li-area').value = p.area || '';
      $('li-deanery').value = p.deanery; $('li-web').value = p.website_url; $('li-lat').value = p.lat == null ? '' : p.lat; $('li-lng').value = p.lng == null ? '' : p.lng;
    }
    drawNotes(); drawEditors();
    $('q-title').value = $('q-title').value || p.name;
    if (window.PPOps) window.PPOps.draw(D);
    var h = location.hash.slice(1), t = $('t-' + (OLD[h] || h));
    show(t || tabs[0]);
  }

  // ---- Schedules ----
  function opt(v, label, cur) { return '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + P.esc(label) + '</option>'; }
  function drawSched() {
    $('sched').innerHTML = KINDS.map(function (k) {
      var rows = sched.map(function (r, i) { return [r, i]; }).filter(function (x) { return x[0].kind === k[0]; });
      return '<div class="pp-sec"><h3>' + k[1] + ' <button class="btn" type="button" data-add="' + k[0] + '">Add a time</button></h3>' + (k[2] ? '<p class="pp-small">' + k[2] + '</p>' : '') +
        (rows.length ? '<div class="pp-tbl"><table class="pp-sched-ed"><tr><th>Day</th><th>Start</th><th>End</th><th>Language</th><th>Note (holidays, seasons)</th><th>Order</th></tr>' +
          rows.map(function (x) {
            var r = x[0], i = x[1], lab = P.esc(k[1] + ', row ' + (rows.indexOf(x) + 1));
            return '<tr data-i="' + i + '"><td><select aria-label="Day, ' + lab + '" data-f="day">' + P.DAYS.map(function (d, n) { return opt(n, d, r.day); }).join('') + '</select></td>' +
              '<td><input aria-label="Start, ' + lab + '" data-f="start_time" type="time" value="' + P.esc(r.start_time) + '" required></td>' +
              '<td><input aria-label="End, ' + lab + '" data-f="end_time" type="time" value="' + P.esc(r.end_time) + '"></td>' +
              '<td><input aria-label="Language, ' + lab + '" data-f="language" maxlength="40" value="' + P.esc(r.language) + '"></td>' +
              '<td><input aria-label="Note, ' + lab + '" data-f="note" maxlength="160" value="' + P.esc(r.note) + '"></td>' +
              '<td class="pp-ops pp-ops-c"><button type="button" data-mv="-1" aria-label="Move up, ' + lab + '">↑</button> <button type="button" data-mv="1" aria-label="Move down, ' + lab + '">↓</button> <button type="button" data-del="1" aria-label="Remove, ' + lab + '">✕</button></td></tr>';
          }).join('') + '</table></div>' : '<p class="pp-mut">None listed.</p>') + '</div>';
    }).join('');
  }
  $('sched').addEventListener('input', function (e) {
    var tr = e.target.closest('tr[data-i]'), f = e.target.getAttribute('data-f'); if (!tr || !f) return;
    var r = sched[+tr.getAttribute('data-i')]; r[f] = f === 'day' ? +e.target.value : e.target.value; dirty = true; msg('s-msg', 'Unsaved changes');
  });
  $('sched').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-add')) {
      var k = b.getAttribute('data-add');
      sched.push({ kind: k, day: k === 'sunday' ? 0 : 1, start_time: '', end_time: '', language: 'English', note: '' });
      dirty = true; drawSched(); msg('s-msg', 'Unsaved changes');
      var ins = $('sched').querySelectorAll('tr[data-i="' + (sched.length - 1) + '"] select'); if (ins[0]) ins[0].focus();
      return;
    }
    var tr = b.closest('tr[data-i]'); if (!tr) return;
    var i = +tr.getAttribute('data-i'), fi = i;
    if (b.hasAttribute('data-del')) sched.splice(i, 1);
    else {
      // Swap with the next or previous row of the same kind
      var d = +b.getAttribute('data-mv'), j = i + d;
      while (j >= 0 && j < sched.length && sched[j].kind !== sched[i].kind) j += d;
      if (j < 0 || j >= sched.length) return;
      var t = sched[i]; sched[i] = sched[j]; sched[j] = t; fi = j;
    }
    dirty = true; drawSched(); msg('s-msg', 'Unsaved changes');
    var again = $('sched').querySelector('tr[data-i="' + fi + '"] ' + (b.hasAttribute('data-del') ? 'button' : '[data-mv="' + b.getAttribute('data-mv') + '"]'));
    if (again) again.focus();
  });
  $('s-save').addEventListener('click', function () {
    var bad = sched.findIndex(function (r) { return !/^\d\d:\d\d$/.test(r.start_time) || (r.end_time && r.end_time <= r.start_time); });
    if (bad >= 0) { msg('s-msg', 'Every row needs a start time, and an end time after it if given.'); var tr = $('sched').querySelector('tr[data-i="' + bad + '"] input'); if (tr) tr.focus(); return; }
    // Kinds in dashboard order, rows in the order shown
    var items = []; KINDS.forEach(function (k) { sched.forEach(function (r) { if (r.kind === k[0]) items.push(r); }); });
    $('s-save').disabled = true; msg('s-msg', 'Saving…', true);
    P.api('/api/admin/schedules', { method: 'PUT', body: { items: items } }).then(function (j) {
      $('s-save').disabled = false;
      if (!j.ok) { msg('s-msg', P.err(j)); if (j.status === 401) load(); return; }
      sched = items; dirty = false; drawSched(); msg('s-msg', 'Saved. The public page shows it within a few minutes.', true);
      D.mass_times = items.slice(); if (window.PPOps) window.PPOps.draw(D);
    });
  });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ---- Bulletin, contact and notices ----
  $('f-prof').addEventListener('submit', function (e) {
    e.preventDefault();
    var b = { bulletin_url: $('pr-bul').value.trim(), livestream_url: $('pr-live').value.trim(), phone: $('pr-phone').value.trim(), email: $('pr-email').value.trim(),
      holiday_note: $('pr-note').value.trim() };
    if (D.super) b.listing = { name: $('li-name').value.trim(), street: $('li-street').value.trim(), city: $('li-city').value.trim(), postal_code: $('li-postal').value.trim(),
      area: $('li-area').value, deanery: $('li-deanery').value.trim(), website_url: $('li-web').value.trim(), lat: $('li-lat').value.trim(), lng: $('li-lng').value.trim() };
    msg('pr-msg', 'Saving…', true);
    P.api('/api/admin/profile', { method: 'PUT', body: b }).then(function (j) {
      if (!j.ok) { msg('pr-msg', j.error === 'fields' ? 'Check the fields: links must start with https://' + (D.super ? '; postal code like M5B 1Z8; latitude and longitude both or neither' : '') + '.' : P.err(j)); return; }
      if (D.super) { location.reload(); return; }
      D.parish.bulletin_url = b.bulletin_url; D.parish.livestream_url = b.livestream_url; D.parish.phone = b.phone; D.parish.email = b.email;
      D.parish.holiday_note = b.holiday_note;
      msg('pr-msg', 'Saved.', true);
      if (window.PPOps) window.PPOps.draw(D);
    });
  });
  function dayStart(v) { if (!v) return 0; var p = v.split('-'); return Math.floor(new Date(+p[0], +p[1] - 1, +p[2]).getTime() / 1000); }
  $('f-ann').addEventListener('submit', function (e) {
    e.preventDefault();
    var title = $('an-title').value.trim(), from = dayStart($('an-from').value), to = $('an-to').value ? dayStart($('an-to').value) + 86400 : 0;
    if (title.length < 3) { msg('an-msg', 'Give the notice a title.'); return; }
    if (to && to <= (from || Date.now() / 1000)) { msg('an-msg', 'The removal date must come after the start.'); return; }
    var b = { title: title, body: $('an-body').value.trim() }; if (from) b.starts_at = from; if (to) b.expires_at = to;
    msg('an-msg', 'Publishing…', true);
    P.api('/api/admin/announcements', { method: 'POST', body: b }).then(function (j) {
      if (!j.ok) { msg('an-msg', P.err(j)); return; }
      D.announcements.unshift({ id: j.id, title: b.title, body: b.body, starts_at: b.starts_at || Math.floor(Date.now() / 1000), expires_at: b.expires_at || null });
      $('f-ann').reset(); drawNotes(); msg('an-msg', 'Published.', true);
    });
  });
  function drawNotes() {
    var t = Date.now() / 1000;
    $('an-list').innerHTML = D.announcements.length ? D.announcements.map(function (n) {
      var state = n.expires_at && n.expires_at <= t ? 'Expired' : n.starts_at > t ? 'Starts ' + P.date(n.starts_at) : n.expires_at ? 'Showing until ' + P.date(n.expires_at - 1) : 'Showing until removed';
      return '<article class="pp-ann"><h3>' + P.esc(n.title) + '</h3>' + (n.body ? '<p>' + P.esc(n.body) + '</p>' : '') +
        '<p class="pp-row pp-small">' + P.esc(state) + ' <button class="btn" type="button" data-rm="' + n.id + '">Remove</button></p></article>';
    }).join('') : '<p class="pp-mut">No notices. Notices appear at the top of the parish page.</p>';
  }
  $('an-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm]'); if (!b) return;
    var id = +b.getAttribute('data-rm');
    if (!confirm('Remove this notice from the parish page?')) return;
    P.api('/api/admin/announcements/' + id, { method: 'DELETE' }).then(function (j) {
      if (!j.ok && j.status !== 404) { alert(P.err(j)); return; }
      D.announcements = D.announcements.filter(function (n) { return n.id !== id; }); drawNotes();
    });
  });

  // ---- Pew QR poster ----
  function codes() {
    var p = D.parish, two = $('q-two').value, out = [{ u: SITE + '/parish/' + p.slug, t: 'Mass and Confession times' }];
    if (two === 'bulletin' && p.bulletin_url) out.push({ u: p.bulletin_url, t: 'This week’s bulletin' });
    if (two === 'live' && p.livestream_url) out.push({ u: p.livestream_url, t: 'Livestream' });
    return out;
  }
  function weekend() {
    var w = sched.filter(function (r) { return r.kind === 'sunday' && !/month/.test(r.note); }).sort(function (a, b) { return (a.day === 6 ? -1 : a.day) - (b.day === 6 ? -1 : b.day) || (a.start_time < b.start_time ? -1 : 1); });
    var by = {}; w.forEach(function (r) { var k = r.day === 6 ? 'Saturday' : 'Sunday'; (by[k] = by[k] || []).push(P.time(r.start_time) + (r.language !== 'English' ? ' (' + r.language + ')' : '')); });
    return Object.keys(by).map(function (k) { return k + ': ' + by[k].join(', '); });
  }
  function poster() {
    if (!D) return;
    var c = codes();
    $('poster').innerHTML = '<p class="k">' + P.esc(D.parish.city || 'Welcome') + '</p><h2>' + P.esc($('q-title').value || D.parish.name) + '</h2><p>' + P.esc($('q-sub').value) + '</p>' +
      '<div class="qrs">' + c.map(function (x) { return '<figure>' + window.QR.svg(x.u, 2) + '<figcaption>' + P.esc(x.t) + '</figcaption><p class="u">' + P.esc(x.u.replace(/^https?:\/\//, '')) + '</p></figure>'; }).join('') + '</div>' +
      '<p>' + weekend().map(P.esc).join('<br>') + '</p><p class="u">parishes.verbumdomini.ca</p>';
    $('poster').querySelector('.qrs').style.gridTemplateColumns = c.length > 1 ? '1fr 1fr' : 'minmax(0,60%)';
    $('poster').querySelector('.qrs').style.justifyContent = 'center';
  }
  ['q-title', 'q-sub', 'q-two'].forEach(function (id) { $(id).addEventListener('input', poster); $(id).addEventListener('change', poster); });
  $('q-print').addEventListener('click', function () {
    document.body.classList.add('pp-printing'); $('p-print').classList.add('pp-print-me');
    window.print();
    setTimeout(function () { document.body.classList.remove('pp-printing'); $('p-print').classList.remove('pp-print-me'); }, 500);
  });
  // The PNG: the same poster drawn on a canvas at 300 dpi (2550 x 3300), so it prints sharp on Letter paper
  $('q-png').addEventListener('click', function () {
    var W = 2550, H = 3300, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d'), c = codes(), serif = '"Source Serif 4", Georgia, serif', sans = '-apple-system, "Segoe UI", Roboto, sans-serif';
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    function wrap(text, font, color, y, max, lh) {
      g.font = font; g.fillStyle = color; var words = String(text).split(' '), line = '';
      words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (g.measureText(t).width > max && line) { g.fillText(line, W / 2, y); y += lh; line = w; } else line = t; });
      if (line) { g.fillText(line, W / 2, y); y += lh; }
      return y;
    }
    var y = 330;
    y = wrap((D.parish.city || 'Welcome').toUpperCase(), '600 54px ' + sans, '#8a6a14', y, W - 400, 70) + 50;
    y = wrap($('q-title').value || D.parish.name, '600 150px ' + serif, '#15110f', y + 90, W - 400, 170) + 10;
    y = wrap($('q-sub').value, '400 72px ' + serif, '#4d4641', y + 20, W - 500, 92) + 80;
    var size = c.length > 1 ? 900 : 1200, gap = 200, x0 = (W - (size * c.length + gap * (c.length - 1))) / 2;
    c.forEach(function (x, i) {
      var M = window.QR.matrix(x.u), n = M.length + 4, cell = size / n, left = x0 + i * (size + gap);
      g.fillStyle = '#000';
      for (var r = 0; r < M.length; r++) for (var q = 0; q < M.length; q++) if (M[r][q]) g.fillRect(Math.floor(left + (q + 2) * cell), Math.floor(y + (r + 2) * cell), Math.ceil(cell), Math.ceil(cell));
      g.font = '600 60px ' + sans; g.fillStyle = '#15110f'; g.fillText(x.t, left + size / 2, y + size + 80);
      g.font = '400 40px ui-monospace, monospace'; g.fillStyle = '#4d4641'; g.fillText(x.u.replace(/^https?:\/\//, '').slice(0, 60), left + size / 2, y + size + 150);
    });
    y += size + 300;
    weekend().forEach(function (l) { y = wrap(l, '400 64px ' + serif, '#15110f', y, W - 400, 84); });
    g.font = '400 44px ui-monospace, monospace'; g.fillStyle = '#4d4641'; g.fillText('parishes.verbumdomini.ca', W / 2, H - 160);
    cv.toBlob(function (b) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = D.parish.slug + '-pew-card.png';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }, 'image/png');
  });

  // ---- Editors ----
  function drawEditors() {
    var me = D.me;
    $('ed-list').innerHTML = '<div class="pp-tbl"><table><tr><th>Name</th><th>Email</th><th>Role</th><th>Last sign-in</th><th></th></tr>' + D.editors.map(function (e) {
      return '<tr><td>' + P.esc(e.name) + (e.is_owner ? ' <span class="badge">Primary</span>' : '') + '</td><td>' + P.esc(e.email) + '</td><td>' + P.esc(e.role) + '</td><td>' + P.esc(e.last_login_at ? P.date(e.last_login_at) : 'Not yet') + '</td>' +
        '<td>' + ((D.super || (me.owner && !e.is_owner)) && e.id !== me.id ? '<button class="btn" type="button" data-ed="' + e.id + '">Remove</button>' : '') + '</td></tr>';
    }).join('') + '</table></div>';
    $('f-ed').hidden = !me.owner;
    $('ed-role').innerHTML = (D.roles || []).map(function (r) { return opt(r, r, 'Volunteer Editor'); }).join('');
  }
  $('ed-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-ed]'); if (!b) return;
    var id = +b.getAttribute('data-ed'), who = D.editors.find(function (x) { return x.id === id; });
    if (!confirm('Remove ' + (who ? who.name : 'this editor') + '? They will be signed out at once.')) return;
    P.api('/api/admin/editors/' + id, { method: 'DELETE' }).then(function (j) {
      if (!j.ok) { alert(P.err(j)); return; }
      D.editors = D.editors.filter(function (x) { return x.id !== id; }); drawEditors();
    });
  });
  $('f-ed').addEventListener('submit', function (e) {
    e.preventDefault();
    var b = { name: $('ed-name').value.trim(), email: $('ed-email').value.trim(), role: $('ed-role').value };
    if (b.name.length < 2 || !/^\S+@\S+\.\S+$/.test(b.email)) { msg('ed-msg', 'Give a name and an email address.'); return; }
    msg('ed-msg', 'Adding…', true);
    P.api('/api/admin/editors', { method: 'POST', body: b }).then(function (j) {
      if (!j.ok) { msg('ed-msg', P.err(j)); return; }
      D.editors.push({ id: j.id, name: b.name, email: b.email.toLowerCase(), role: b.role, is_owner: 0, last_login_at: null });
      $('f-ed').reset(); drawEditors();
      msg('ed-msg', j.invited ? 'Added. We emailed them how to sign in.' : 'Added. The invitation email could not be sent: tell them to sign in at parishes.verbumdomini.ca/claim?login=1.', true);
    });
  });

  // ---- Site administrator: open any parish, release a claim, read the activity log ----
  var PL = null;
  function suBar(j) {
    var B = $('su'), p = j.parish;
    B.hidden = false;
    B.innerHTML = '<p class="pp-kick">Site administrator · ' + P.esc(j.me.email) + '</p>' +
      '<form class="pp-row" id="su-f"><label class="pp-lab">Open a parish <select class="pp-in-f" id="su-p"><option value="">Loading…</option></select></label>' +
      '<button class="btn p" type="submit">Open</button>' + (p ? ' <button class="btn" id="su-close" type="button">Close parish</button> <button class="btn" id="su-rel" type="button">Release claim</button>' : '') + '</form>' +
      '<p class="pp-msg" id="su-msg" role="status"></p>' +
      '<details id="su-ov"' + (p ? '' : ' open') + '><summary>Overview: claims to review and recent activity</summary><div id="su-ovb"><p class="pp-skel">Loading…</p></div></details>' +
      (p ? '<details id="su-log"><summary>This parish’s activity log</summary><div id="su-logb"><p class="pp-skel">Loading…</p></div></details>' : '');
    function when(t) { return t ? new Date(t * 1000).toLocaleString('en-CA') : ''; }
    function overview() {
      P.api('/api/admin/super/overview').then(function (r) {
        if (!r.ok) { $('su-ovb').innerHTML = '<p>' + P.esc(P.err(r)) + '</p>'; return; }
        var claimed = r.parishes.filter(function (x) { return x.is_claimed; }).length;
        $('su-ovb').innerHTML = '<p class="pp-small">' + r.parishes.length + ' parishes, ' + claimed + ' claimed, ' + (r.parishes.length - claimed) + ' unclaimed (open one above to edit its listing).</p>' +
          '<h3>Claims waiting for review</h3>' + (!r.claims.length ? '<p class="pp-mut">None.</p>' :
          '<div class="pp-tbl"><table><tr><th>Parish</th><th>Requester</th><th>Their note</th><th>Confirmed</th><th></th></tr>' + r.claims.map(function (c) {
            return '<tr><td><a href="/parish/' + P.esc(c.slug) + '">' + P.esc(c.parish) + '</a>' + (c.website_url ? '<br><span class="pp-small">' + P.esc(c.website_url) + '</span>' : '') + (c.is_claimed ? '<br><span class="badge gray">Already claimed</span>' : '') + '</td>' +
              '<td>' + P.esc(c.name) + '<br><span class="pp-small">' + P.esc(c.role) + ' · ' + P.esc(c.email) + '</span></td><td>' + P.esc(c.message) + '</td><td>' + P.esc(when(c.verified_at)) + '</td>' +
              '<td class="pp-row"><button class="btn p" type="button" data-cl="approve" data-id="' + P.esc(c.id) + '"' + (c.is_claimed ? ' disabled' : '') + '>Approve</button> <button class="btn" type="button" data-cl="reject" data-id="' + P.esc(c.id) + '">Reject</button></td></tr>';
          }).join('') + '</table></div>') +
          '<h3>Recent activity</h3>' + (!r.log.length ? '<p class="pp-mut">No activity yet.</p>' :
          '<div class="pp-tbl"><table><tr><th>When</th><th>Parish</th><th>Who</th><th>What</th><th>Detail</th></tr>' + r.log.map(function (l) {
            return '<tr><td>' + P.esc(when(l.created_at)) + '</td><td><a href="/parish/' + P.esc(l.slug) + '">' + P.esc(l.parish) + '</a></td><td>' + P.esc(l.actor_email) + '</td><td>' + P.esc(l.action) + '</td><td>' + P.esc(l.detail) + '</td></tr>';
          }).join('') + '</table></div>');
      });
    }
    $('su-ov').addEventListener('toggle', function () { if (this.open && !this._done) { this._done = true; overview(); } });
    if (!p) { $('su-ov')._done = true; overview(); }
    $('su-ovb').addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-cl]'); if (!b) return;
      var act = b.getAttribute('data-cl'), body = {};
      if (act === 'approve' && !confirm('Approve this claim? The requester becomes the parish’s primary administrator.')) return;
      if (act === 'reject') { var why = prompt('Reject this claim. Reason to send them (optional):', ''); if (why === null) return; body.reason = why; }
      b.disabled = true;
      P.api('/api/admin/super/claims/' + encodeURIComponent(b.getAttribute('data-id')) + '/' + act, { method: 'POST', body: body }).then(function (r) {
        if (!r.ok) { b.disabled = false; msg('su-msg', P.err(r)); return; }
        msg('su-msg', act === 'approve' ? (r.notified ? 'Approved; they were emailed how to sign in.' : 'Approved, but the email could not be sent: tell them to sign in at /claim?login=1.') : 'Rejected.', true);
        overview();
      });
    });
    (PL ? Promise.resolve({ ok: true, parishes: PL }) : P.api('/api/parishes')).then(function (r) {
      if (!r.ok) return; PL = r.parishes;
      $('su-p').innerHTML = '<option value="">Choose…</option>' + PL.map(function (x) { return '<option value="' + P.esc(x.slug) + '">' + P.esc(x.name + ', ' + x.city) + (x.claimed ? ' (claimed)' : '') + '</option>'; }).join('');
      if (p) $('su-p').value = p.slug;
    });
    $('su-f').addEventListener('submit', function (e) {
      e.preventDefault(); if (!$('su-p').value) return;
      if (dirty && !confirm('Leave without saving the schedule?')) return; dirty = false;
      P.api('/api/admin/super/open', { method: 'POST', body: { slug: $('su-p').value } }).then(function (r) { if (!r.ok) { msg('su-msg', P.err(r)); return; } location.reload(); });
    });
    if (!p) return;
    $('su-close').addEventListener('click', function () {
      dirty = false; P.api('/api/admin/super/open', { method: 'POST', body: { slug: '' } }).then(function () { location.reload(); });
    });
    $('su-rel').addEventListener('click', function () {
      if (!confirm('Release ' + p.name + '? Every editor of this parish is removed and it can be claimed again. Its schedule, links and notices stay.')) return;
      P.api('/api/admin/super/release', { method: 'POST', body: {} }).then(function (r) { if (!r.ok) { msg('su-msg', P.err(r)); return; } location.reload(); });
    });
    $('su-log').addEventListener('toggle', function () {
      if (!this.open || this._done) return; this._done = true;
      P.api('/api/admin/super/audit').then(function (r) {
        $('su-logb').innerHTML = !r.ok ? '<p>' + P.esc(P.err(r)) + '</p>' : !r.log.length ? '<p class="pp-mut">No activity yet.</p>' :
          '<div class="pp-tbl"><table><tr><th>When</th><th>Who</th><th>What</th><th>Detail</th></tr>' + r.log.map(function (l) {
            return '<tr><td>' + P.esc(when(l.created_at)) + '</td><td>' + P.esc(l.name ? l.name + ' <' + l.email + '>' : '') + '</td><td>' + P.esc(l.action) + '</td><td>' + P.esc(l.detail) + '</td></tr>';
          }).join('') + '</table></div>';
      });
    });
  }

  window.PPAdmin = { msg: msg, load: load, opt: opt, get D() { return D; } };
  $('d-out').addEventListener('click', function () {
    if (dirty && !confirm('Leave without saving the schedule?')) return;
    dirty = false;
    P.api('/api/auth/logout', { method: 'POST', body: {} }).then(function () { location.href = '/'; });
  });
  load();
})();
