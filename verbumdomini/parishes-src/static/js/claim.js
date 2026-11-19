/* Claim a parish (step 1: details, step 2: the code), or sign in again (?login=1). Then on to /admin. */
(function () {
  var P = window.PP, $ = function (id) { return document.getElementById(id); };
  var u = new URLSearchParams(location.search), login = u.get('login') === '1', slug = u.get('slug') || '';
  var fc = $('f-claim'), fl = $('f-login'), fp = $('f-pin'), mode = login ? 'login' : 'claim', ticket = '';
  function msg(id, t, ok) { var m = $(id); m.textContent = t || ''; m.className = 'pp-msg' + (t ? ok ? ' ok' : ' err' : ''); }
  function step(n) {
    fc.hidden = n !== 1 || mode !== 'claim'; fl.hidden = n !== 1 || mode !== 'login'; fp.hidden = n !== 2;
    $('s1').removeAttribute('aria-current'); $('s2').removeAttribute('aria-current'); $(n === 1 ? 's1' : 's2').setAttribute('aria-current', 'step');
    if (n === 2) $('p-pin').focus();
  }
  function busy(f, on) { [].forEach.call(f.querySelectorAll('button'), function (b) { b.disabled = on; }); }
  if (login) {
    $('h').textContent = 'Sign in'; $('lede').textContent = 'Parish editors sign in with a code sent to their email each time. No password to remember.';
    $('l-slug').value = slug; document.title = 'Sign In · Verbum Domini for Parishes';
  }
  step(1);
  // The parish list for the claim form, with the parish from ?slug= chosen
  P.api('/api/parishes').then(function (j) {
    var s = $('c-parish');
    if (!j.ok) { s.innerHTML = '<option value="">' + P.esc(P.err(j)) + '</option>'; return; }
    s.innerHTML = '<option value="">Choose your parish…</option>' + j.parishes.map(function (p) {
      return '<option value="' + P.esc(p.slug) + '"' + (p.claimed ? ' data-claimed="1"' : '') + ' data-web="' + P.esc(p.website_url) + '">' + P.esc(p.name + ', ' + p.city) + (p.claimed ? ' (claimed)' : '') + '</option>';
    }).join('');
    if (slug) s.value = slug;
    hint();
  });
  function host(w) { try { return new URL(w).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function hint() {
    var o = $('c-parish').selectedOptions[0], h = o && host(o.getAttribute('data-web') || '');
    $('c-hint').textContent = o && o.getAttribute('data-claimed') ? 'This parish is already claimed. Its administrator can add you as an editor from the dashboard.'
      : 'The address must end in @archtoronto.org' + (h && h !== 'archtoronto.org' && !/\.archtoronto\.org$/.test(h) ? ' or @' + h : '') + '.';
  }
  $('c-parish').addEventListener('change', function () { hint(); $('c-manual').hidden = true; $('c-review').checked = false; });
  fc.addEventListener('submit', function (e) {
    e.preventDefault(); msg('c-msg', '');
    var b = { slug: $('c-parish').value, name: $('c-name').value.trim(), role: $('c-role').value, email: $('c-email').value.trim(), website: fc.elements.website.value };
    if (!b.slug || b.name.length < 2 || !b.role || !/^\S+@\S+\.\S+$/.test(b.email)) { msg('c-msg', 'Fill in every field.'); return; }
    if (!$('c-manual').hidden && $('c-review').checked) {
      b.manual = true; b.message = $('c-msg-text').value.trim();
      if (b.message.length < 10) { msg('c-msg', 'Tell us how we can confirm that you work for the parish.'); return; }
    }
    busy(fc, true);
    P.api('/api/claim/request', { method: 'POST', body: b }).then(function (j) {
      busy(fc, false);
      if (!j.ok) {
        msg('c-msg', P.err(j) + (j.error === 'domain' && j.allowed ? ' Allowed: @' + j.allowed.join(', @') + '. Or send your claim for review below.' : ''));
        if (j.error === 'domain' && j.manual) { $('c-manual').hidden = false; $('c-review').focus(); }
        return;
      }
      ticket = j.ticket; $('p-sent').textContent = 'We sent a six-digit code to ' + b.email + '. It works for 15 minutes.' + (j.manual ? ' After it, your claim goes to the site administrator for review.' : ''); step(2);
    });
  });
  fl.addEventListener('submit', function (e) {
    e.preventDefault(); msg('l-msg', '');
    var email = $('l-email').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { msg('l-msg', 'Enter your work email.'); return; }
    busy(fl, true);
    P.api('/api/auth/login', { method: 'POST', body: { email: email, slug: $('l-slug').value } }).then(function (j) {
      busy(fl, false);
      if (!j.ok) { msg('l-msg', P.err(j)); return; }
      ticket = j.ticket; $('p-sent').textContent = 'If ' + email + ' belongs to a parish editor, a six-digit code is on its way. It works for 15 minutes.'; step(2);
    });
  });
  fp.addEventListener('submit', function (e) {
    e.preventDefault(); msg('p-msg', '');
    var pin = $('p-pin').value.replace(/\D/g, '');
    if (pin.length !== 6) { msg('p-msg', 'Enter the six digits from the email.'); return; }
    busy(fp, true);
    P.api(mode === 'claim' ? '/api/claim/verify' : '/api/auth/verify', { method: 'POST', body: { ticket: ticket, pin: pin } }).then(function (j) {
      busy(fp, false);
      if (!j.ok) { msg('p-msg', P.err(j) + (j.left != null ? ' ' + j.left + (j.left === 1 ? ' try' : ' tries') + ' left.' : '')); return; }
      if (j.pending) { fp.hidden = true; $('done').hidden = false; $('done').setAttribute('tabindex', '-1'); $('done').focus(); return; }
      msg('p-msg', 'Confirmed. Opening your dashboard…', true);
      location.href = '/admin';
    });
  });
  $('p-back').addEventListener('click', function () { ticket = ''; $('p-pin').value = ''; msg('p-msg', ''); step(1); });
})();
