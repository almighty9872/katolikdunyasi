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
  window.PP = { esc: esc, time: time, DAYS: DAYS, api: api, err: err, date: ago, copy: copy };
})();
