/* Every portal page: the theme button, "Copy" buttons, and small helpers the page scripts share (window.PP). */
(function () {
  var d = document.documentElement;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Theme: system, light, dark in turn; written to the shared cookie on verbumdomini.ca hosts
  var tb = document.querySelector('.pp-theme');
  function mode() { var m = /(?:^|; )vd-th=(light|dark|system)/.exec(document.cookie); return m ? m[1] : (d.getAttribute('data-theme') || 'system'); }
  function label(m) { if (tb) { tb.setAttribute('aria-label', 'Colour theme: ' + m); tb.title = 'Colour theme: ' + m; } }
  label(mode());
  if (tb) tb.addEventListener('click', function () {
    var m = { system: 'light', light: 'dark', dark: 'system' }[mode()] || 'system';
    if (m === 'system') d.removeAttribute('data-theme'); else d.setAttribute('data-theme', m);
    if (/(^|\.)verbumdomini\.ca$/.test(location.hostname)) document.cookie = 'vd-th=' + m + '; Domain=verbumdomini.ca; Path=/; Max-Age=31536000; SameSite=Lax; Secure';
    else document.cookie = 'vd-th=' + m + '; Path=/; Max-Age=31536000; SameSite=Lax';
    label(m);
  });
  // Copy buttons: data-copy="<id of the element whose text is copied>"
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } finally { t.remove(); }
    return Promise.resolve();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]'); if (!b) return;
    var src = document.getElementById(b.getAttribute('data-copy')); if (!src) return;
    copy(src.value != null && src.tagName !== 'DIV' ? src.value : src.innerText.trim()).then(function () {
      var n = b.parentNode.querySelector('.pp-copied');
      if (!n) { n = document.createElement('span'); n.className = 'pp-copied'; n.setAttribute('role', 'status'); b.after(n); }
      n.textContent = 'Copied'; clearTimeout(n._t); n._t = setTimeout(function () { n.textContent = ''; }, 2500);
    });
  });
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // "18:30" -> "6:30 p.m." (Canadian Press style, as parishes print it)
  function time(t) {
    var m = /^(\d\d):(\d\d)$/.exec(t || ''); if (!m) return t || '';
    var h = +m[1], ap = h < 12 ? 'a.m.' : 'p.m.'; h = h % 12 || 12;
    return h + ':' + m[2] + ' ' + ap;
  }
  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', credentials: 'same-origin', headers: {} };
    if (opts.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    return fetch(path, init).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'server' }; }).then(function (j) { j.status = r.status; return j; });
    }, function () { return { ok: false, error: 'network', status: 0 }; });
  }
  var ERR = {
    network: 'The portal could not be reached. Check your connection and try again.', server: 'Something went wrong on our side. Try again in a minute.',
    rate: 'Too many tries. Wait a minute, then try again.', fields: 'Some fields are missing or not valid.', origin: 'This request was blocked.',
    claimed: 'This parish has already been claimed. Ask its administrator to add you as an editor, or sign in.',
    domain: 'Use your @archtoronto.org address or an address at the parish’s own website domain.',
    parish: 'That parish was not found.', expired: 'This code has expired or was already used. Ask for a new one.',
    pin: 'That code is not right.', send: 'The email could not be sent. Try again in a few minutes.', auth: 'Your session has ended. Sign in again.',
    owner: 'Only the parish’s primary administrator can do this.', exists: 'That person is already an editor.', limit: 'You have reached the limit for this list.',
    self: 'You cannot remove yourself.', not_found: 'Not found.', pick: 'Choose a parish first.'
  };
  function err(j) { return ERR[j && j.error] || ERR.server; }
  function ago(ts) {
    if (!ts) return '';
    var dt = new Date(ts * 1000);
    return dt.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  // Accessibility features as icons with their names (for screen readers and as a tooltip)
  var AX = {
    wheelchair: ['Wheelchair-accessible entrance', '<circle cx="12" cy="4" r="2"/><path d="M11 7v6h5l3 6M11 10H7m4 3a5 5 0 1 0 2.5 7.5"/>'],
    hearing_loop: ['Hearing loop', '<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5 2"/><path d="M10 9a2 2 0 0 1 4 0c0 1.5-2 2-2 3.5"/><path d="M3 21 21 3"/>'],
    accessible_washroom: ['Accessible washroom', '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="7.5" r="1.5"/><path d="M12 10v4h3l1.5 3M12 12h-2.5m2.5 2a3 3 0 1 0 1.6 4.5"/>'],
    parking: ['Accessible parking', '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>']
  };
  // all: also the features marked as not available; bare: the icon only (the page writes the name next to it)
  function access(ax, all, bare) {
    ax = ax || {};
    return Object.keys(AX).filter(function (k) { return ax[k] === true || (all && ax[k] === false); }).map(function (k) {
      return '<span class="pp-ax' + (ax[k] ? '' : ' no') + '"' + (bare ? '' : ' title="' + esc(AX[k][0]) + (ax[k] ? '' : ': no') + '"') + '><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + AX[k][1] + '</svg>' +
        (bare ? '' : '<span class="pp-vh">' + esc(AX[k][0] + (ax[k] ? '' : ': no')) + '</span>') + '</span>';
    }).join('');
  }
  // A monthly counter on the parish (no visitor data); never waits and never fails loudly
  function track(slug, type) {
    if (!/^[a-z0-9-]+$/.test(slug || '')) return;
    try { fetch('/api/parishes/' + slug + '/event', { method: 'POST', credentials: 'omit', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: type }) }).catch(function () {}); } catch (e) {}
  }
  window.PP = { esc: esc, time: time, DAYS: DAYS, api: api, err: err, date: ago, copy: copy, access: access, AX: AX, track: track };
})();

/* The workspace header: the portal search (⌘K or Ctrl+K; parishes, resources and canons), the bell and the profile menu.
   The profile asks /api/admin/me only on a device that has signed in before (localStorage pp-signed, set by admin.js),
   so public visitors make no extra request. The bell lists the coming holy days (sched.js); for site administrators,
   the claims waiting for review as well. */
(function () {
  var P = window.PP, S = window.PPS, $ = function (id) { return document.getElementById(id); };
  var q = $('pp-q'), box = $('pp-qr'), form = q && q.form;
  if (!q || !box) return;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  // ---- popovers (bell, profile): one open at a time; Escape or a click outside closes ----
  var pops = [['pp-bell', 'pp-notes'], ['pp-me', 'pp-menu']];
  function close(except) { pops.forEach(function (x) { if (x[0] === except) return; var b = $(x[0]); if (b) { b.setAttribute('aria-expanded', 'false'); $(x[1]).hidden = true; } }); }
  pops.forEach(function (x) {
    var b = $(x[0]); if (!b) return;
    b.addEventListener('click', function (e) { e.stopPropagation(); var open = b.getAttribute('aria-expanded') !== 'true'; close(x[0]); b.setAttribute('aria-expanded', String(open)); $(x[1]).hidden = !open; if (open && x[0] === 'pp-bell') bell(true); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.pp-pop')) close(); if (!e.target.closest('.pp-search')) hide(); });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); q.focus(); q.select(); return; }
    if (e.key === 'Escape') { var open = pops.filter(function (x) { return $(x[0]) && $(x[0]).getAttribute('aria-expanded') === 'true'; })[0]; close(); hide(); if (open) $(open[0]).focus(); }
  });
  var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent), kbd = form.querySelector('kbd');
  if (kbd && !mac) kbd.textContent = 'Ctrl K';

  // ---- search: parishes (/api/parishes, cached at the edge), the resources and the reference, loaded on first focus ----
  var RES = [['Daily readings widget', '/resources#widget', 'Website widget'], ['Schedule widget for a parish website', '/admin#widget', 'Website widget'],
    ['Order of the Mass (PDF)', '/files/order-of-the-mass.pdf', 'Handout'], ['Confession card (PDF)', '/files/confession-card.pdf', 'Handout'],
    ['Becoming Catholic (OCIA) insert', '/files/ocia-welcome-insert.pdf', 'Handout'], ['How to Pray the Rosary (PDF)', '/files/rosary-guide.pdf', 'Handout'],
    ['Sunday bulletin texts', '/resources#blurbs', 'Bulletin insert'], ['Bulletin cover with the Sunday readings', '/generator?tpl=bulletin', 'Print Studio'],
    ['Pew card: Confession and Adoration', '/generator?tpl=pew&fmt=card', 'Print Studio'], ['Welcome brochure', '/generator?tpl=welcome&fmt=trifold', 'Print Studio'],
    ['Wedding and funeral readings packet', '/generator?tpl=packet', 'Print Studio'], ['Accessible bulletins (AODA)', '/resources#aoda', 'Ontario checklist'],
    ['Charitable receipts (CRA)', '/resources#cra', 'Ontario checklist'], ['Baptism, Communion, Confirmation and Marriage intake', '/resources#intake', 'Sacramental prep'],
    ['Claim your parish', '/claim', 'Parish staff']];
  var PAR = null, REF = null, hits = [], cur = -1, t0;
  function load() {
    if (!PAR) { PAR = []; P.api('/api/parishes').then(function (j) { if (j.ok) { PAR = j.parishes; draw(); } }); }
    if (!REF) { REF = []; fetch('/data/reference-index.json').then(function (r) { return r.json(); }).then(function (j) { REF = j.items || []; draw(); }, function () {}); }
  }
  function hide() { box.hidden = true; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); cur = -1; }
  function has(s, n) { return s.toLowerCase().indexOf(n) >= 0; }
  function draw() {
    var n = q.value.trim().toLowerCase(); if (n.length < 2) { hide(); return; }
    var num = /^\d{1,4}$/.test(n) ? +n : null;
    var ps = num !== null ? [] : PAR.filter(function (p) { return has(p.name + ' ' + p.city + ' ' + (p.deanery || ''), n); }).slice(0, 5).map(function (p) { return [p.name, '/parish/' + p.slug, p.city + (p.claimed ? ' · claimed' : '')]; });
    var rs = num !== null ? [] : RES.filter(function (r) { return has(r[0] + ' ' + r[2], n); }).slice(0, 4);
    var cs = REF.filter(function (r) { return num !== null ? num >= r.from && num <= r.to : has(r.title + ' ' + r.cats.join(' ') + ' ' + r.ref, n); }).slice(0, 4).map(function (r) { return [r.title, '/reference?q=' + encodeURIComponent(num !== null ? String(num) : r.title), r.ref]; });
    hits = [];
    var html = [['Parishes', ps], ['Resources', rs], ['Canon Law and Catechism', cs]].map(function (g) {
      if (!g[1].length) return '';
      return '<p class="pp-qr-h" role="presentation">' + g[0] + '</p>' + g[1].map(function (h) {
        var i = hits.push(h) - 1;
        return '<a class="pp-qr-i" id="pp-qr-' + i + '" role="option" aria-selected="false" href="' + P.esc(h[1]) + '"><b>' + P.esc(h[0]) + '</b><small>' + P.esc(h[2]) + '</small></a>';
      }).join('');
    }).join('');
    box.innerHTML = html || '<p class="pp-qr-h">Nothing found. Press Enter to search the directory.</p>';
    box.hidden = false; q.setAttribute('aria-expanded', 'true'); cur = -1;
  }
  function move(d) {
    if (!hits.length) return;
    cur = (cur + d + hits.length) % hits.length;
    [].forEach.call(box.querySelectorAll('.pp-qr-i'), function (a, i) { a.setAttribute('aria-selected', String(i === cur)); });
    q.setAttribute('aria-activedescendant', 'pp-qr-' + cur); $('pp-qr-' + cur).scrollIntoView({ block: 'nearest' });
  }
  q.addEventListener('focus', load);
  q.addEventListener('input', function () { clearTimeout(t0); t0 = setTimeout(draw, 80); });
  q.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (box.hidden) draw(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter' && cur >= 0) { e.preventDefault(); location.href = hits[cur][1]; }
  });
  form.addEventListener('submit', function (e) {
    var n = q.value.trim(); if (!n) { e.preventDefault(); return; }
    // A bare number or "can. 1176" is a canon or Catechism paragraph
    if (/^(can\.?|ccc)?\s*\d{1,4}$/i.test(n)) { e.preventDefault(); location.href = '/reference?q=' + encodeURIComponent(n.replace(/\D/g, '')); }
  });

  // ---- the bell ----
  var me = null, claims = null;
  function bell(full) {
    var items = [];
    if (claims && claims.length) items.push('<li class="hot"><a href="/admin#ed"><b>' + claims.length + (claims.length === 1 ? ' claim waits' : ' claims wait') + ' for review</b><small>Site administrator</small></a></li>');
    if (S) {
      var t = S.now().date;
      S.upcoming(t, 30).filter(function (h) { return h.kind !== 'feast'; }).slice(0, 4).forEach(function (h) {
        items.push('<li><a href="' + (me && me.parish ? '/admin#sched' : '/directory?special=1') + '"><b>' + P.esc(h.name) + '</b><small>' + P.esc(S.nice(h.date, true)) + (h.kind === 'obligation' ? ' · holy day of obligation' : h.kind === 'holiday' ? ' · office holiday' : '') + '</small></a></li>');
      });
    }
    var n = (claims ? claims.length : 0) + (S ? S.upcoming(S.now().date, 7).filter(function (h) { return h.kind === 'obligation' || h.kind === 'holyweek'; }).length : 0);
    $('pp-bell-n').hidden = !n; $('pp-bell-n').textContent = n > 9 ? '9+' : String(n);
    $('pp-bell').setAttribute('aria-label', 'Notifications' + (n ? ': ' + n + ' new' : ''));
    if (full) $('pp-notes-l').innerHTML = items.join('') || '<li class="pp-mut">No holy days in the next 30 days.</li>';
  }
  bell(false);

  // ---- the profile ----
  function initials(s) { var w = String(s || '').replace(/^(st\.?|saint|the)\s+/i, '').split(/\s+/).filter(Boolean); return ((w[0] || 'V')[0] + (w[1] ? w[1][0] : (w[0] || 'D')[1] || '')).toUpperCase(); }
  function user(j) {
    if (!j || !j.ok) { if (j && j.status === 401) store('pp-signed', null); return; }
    me = j; store('pp-signed', '1');
    var p = j.parish, who = j.me || {};
    $('pp-av').textContent = initials(p ? p.name : who.name);
    $('pp-me-n').textContent = p ? p.name : who.name || 'Site administrator';
    $('pp-me-s').textContent = who.email || who.role || '';
    $('pp-menu').innerHTML = '<p class="pp-pop-h">' + (j.super ? 'Site administrator' : P.esc(who.name || '') + (who.role ? ' · ' + P.esc(who.role) : '')) + '</p>' +
      '<a href="/admin">Dashboard</a>' + (p ? '<a href="/parish/' + P.esc(p.slug) + '">Public parish page</a><a href="/generator?parish=' + P.esc(p.slug) + '">Print Studio for this parish</a>' : '') +
      '<a href="https://verbumdomini.ca/">verbumdomini.ca</a><button type="button" id="pp-out">Sign out</button>';
    $('pp-out').addEventListener('click', function () { store('pp-signed', null); P.api('/api/auth/logout', { method: 'POST', body: {} }).then(function () { location.href = '/'; }); });
    if (j.super) P.api('/api/admin/super/overview').then(function (r) { if (r.ok) { claims = P.claims = r.claims || []; bell(false); if (window.PPOps && window.PPOps.dash) window.PPOps.dash(); } });
    bell(false);
  }
  P.user = user; P.store = store;
  // /admin loads /api/admin/me itself and hands it to P.user
  if (location.pathname !== '/admin' && store('pp-signed') === '1') P.api('/api/admin/me').then(user);
})();
