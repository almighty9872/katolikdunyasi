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
