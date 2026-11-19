// Verbum Domini Blog: reading features. No libraries; every feature checks that its element exists.
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, el) { return (el || d).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var typing = function (e) { var t = e.target; return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); };

  // ---- toast (also announced to screen readers)
  var toast = $('#toast'), toastT;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  // ---- display settings: theme, text size, reader mode
  var settings = $('#settings'), setBtn = $('[data-open="settings"]');
  function openSettings(open) {
    if (!settings) return;
    settings.hidden = !open; setBtn.setAttribute('aria-expanded', String(open));
    if (open) { var b = $('[aria-pressed="true"]', settings); if (b) b.focus(); }
  }
  if (setBtn) setBtn.addEventListener('click', function () { openSettings(settings.hidden); });
  d.addEventListener('click', function (e) {
    if (settings && !settings.hidden && !settings.contains(e.target) && !setBtn.contains(e.target)) openSettings(false);
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && settings && !settings.hidden) { openSettings(false); setBtn.focus(); }
  });

  function setTheme(t) {
    root.setAttribute('data-theme', t); store.set('vdb-theme', t);
    $$('[data-set="theme"] button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === t)); });
  }
  $$('[data-set="theme"] button').forEach(function (b) { b.addEventListener('click', function () { setTheme(b.dataset.v); }); });
  setTheme(root.getAttribute('data-theme') || 'auto');

  var SIZES = { '-2': '85%', '-1': '92%', '0': '100%', '1': '110%', '2': '120%', '3': '130%' };
  function setFs(n) {
    n = Math.max(-2, Math.min(3, n)); root.setAttribute('data-fs', String(n)); store.set('vdb-fs', String(n));
    var o = $('#fs-out'); if (o) o.textContent = SIZES[String(n)];
  }
  $$('button[data-fs]').forEach(function (b) {
    b.addEventListener('click', function () { setFs(+(root.getAttribute('data-fs') || 0) + +b.dataset.fs); });
  });
  setFs(+(root.getAttribute('data-fs') || 0));

  var isPost = d.body.classList.contains('is-post');
  function setReader(on) {
    if (on && !isPost) { say('Reader mode works on a post'); return; }
    if (on) root.setAttribute('data-reader', ''); else root.removeAttribute('data-reader');
    $$('[data-reader]').forEach(function (b) { if (!b.classList.contains('reader-exit')) b.setAttribute('aria-pressed', String(on)); });
    if (on) { openSettings(false); var h = $('.post h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); h.scrollIntoView({ block: 'start' }); } }
    say(on ? 'Reader mode on. Press Escape to leave.' : 'Reader mode off');
  }
  $$('[data-reader]').forEach(function (b) {
    b.addEventListener('click', function () { setReader(!root.hasAttribute('data-reader')); });
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.hasAttribute('data-reader') && !d.querySelector('dialog[open]')) setReader(false);
  });

  // ---- reading progress bar
  var bar = $('.progress span'), art = $('.post');
  if (bar && art) {
    var tick = false;
    var upd = function () {
      tick = false;
      var r = art.getBoundingClientRect(), total = r.height - innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : (r.top < 0 ? 1 : 0);
      bar.style.transform = 'scaleX(' + p + ')';
    };
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }

  // ---- "On this page": open on wide screens, a closed accordion on phones; highlights the section in view
  var toc = $('#toc');
  if (toc) {
    var wide = matchMedia('(min-width:1120px)');
    var place = function () { toc.open = wide.matches; };
    place(); if (wide.addEventListener) wide.addEventListener('change', place);
    var links = $$('a', toc), heads = links.map(function (a) { return d.getElementById(a.hash.slice(1)); });
    links.forEach(function (a) { a.addEventListener('click', function () { if (!wide.matches) toc.open = false; }); });
    var mark = function () {
      var cur = 0;
      heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < 120) cur = i; });
      links.forEach(function (a, i) { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    };
    addEventListener('scroll', function () { requestAnimationFrame(mark); }, { passive: true }); mark();
  }

  // ---- copy link and native share
  function copy(text, done) {
    var ok = function () { say(done); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
    function fallback() {
      var t = d.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.className = 'sr';
      d.body.appendChild(t); t.select();
      try { d.execCommand('copy'); ok(); } catch (e) { say('Copy failed. The address is ' + text); }
      t.remove();
    }
  }
  $$('[data-copy]').forEach(function (b) { b.addEventListener('click', function () { copy(b.dataset.copy, 'Link copied'); }); });
  if (navigator.share) {
    $$('[data-share]').forEach(function (b) {
      b.hidden = false;
      b.addEventListener('click', function () {
        navigator.share({ title: d.title, url: (d.querySelector('link[rel=canonical]') || location).href }).catch(function () {});
      });
    });
  }

  // ---- copy buttons on code blocks
  $$('.code').forEach(function (c) {
    var b = d.createElement('button'); b.type = 'button'; b.className = 'copy-code'; b.textContent = 'Copy';
    b.setAttribute('aria-label', 'Copy code');
    b.addEventListener('click', function () {
      copy($('code', c).textContent, 'Code copied'); b.textContent = 'Copied';
      setTimeout(function () { b.textContent = 'Copy'; }, 1600);
    });
    c.appendChild(b);
  });

  // ---- image lightbox
  var lb = $('#lightbox');
  if (lb && lb.showModal) {
    var lbCap = $('figcaption', lb), lbImg = d.createElement('img'), lbFrom = null;
    lbCap.parentNode.insertBefore(lbImg, lbCap);
    $$('a.zoom').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); lbFrom = a;
        var img = $('img', a), cap = a.parentNode.querySelector('figcaption');
        lbImg.src = a.href; lbImg.alt = img ? img.alt : '';
        lbCap.innerHTML = cap ? cap.innerHTML : ''; lbCap.hidden = !cap;
        lb.showModal();
      });
    });
    $('.lb-x', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') lb.close(); });
    lb.addEventListener('close', function () { if (lbFrom) lbFrom.focus(); });
  }

  // ---- footnote previews: hover on a mouse, tap or Enter anywhere; Escape closes
  var pop = null, popRef = null, pinned = false;
  function closePop(back) {
    if (!pop) return;
    pop.remove(); pop = null;
    if (popRef) { popRef.setAttribute('aria-expanded', 'false'); if (back) popRef.focus(); }
    popRef = null; pinned = false;
  }
  function openPop(a) {
    if (popRef === a) return;
    closePop();
    var note = d.getElementById(a.dataset.fn); if (!note) return;
    var c = note.cloneNode(true); $$('.fn-back', c).forEach(function (x) { x.remove(); });
    pop = d.createElement('div'); pop.className = 'fn-pop'; pop.id = 'fn-pop'; pop.setAttribute('role', 'note');
    pop.innerHTML = '<p>' + c.innerHTML + '</p><a class="fn-go" href="#' + a.dataset.fn + '">Go to the note</a>';
    d.body.appendChild(pop);
    var r = a.getBoundingClientRect(), w = pop.offsetWidth;
    var left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2));
    var top = r.bottom + scrollY + 8;
    if (r.bottom + pop.offsetHeight + 16 > innerHeight && r.top > pop.offsetHeight + 16) top = r.top + scrollY - pop.offsetHeight - 8;
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
    popRef = a; a.setAttribute('aria-expanded', 'true'); a.setAttribute('aria-controls', 'fn-pop');
    pop.addEventListener('mouseleave', function () { if (hover && !pinned) closePop(); });
  }
  var hover = matchMedia('(hover:hover) and (pointer:fine)').matches, hideT;
  $$('.fn-ref a').forEach(function (a) {
    a.setAttribute('aria-expanded', 'false');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (popRef === a && pinned) { closePop(); return; }
      openPop(a); pinned = true;
    });
    if (hover) {
      a.addEventListener('mouseenter', function () { clearTimeout(hideT); openPop(a); });
      a.addEventListener('mouseleave', function () { hideT = setTimeout(function () { if (pop && !pinned && !pop.matches(':hover')) closePop(); }, 250); });
    }
  });
  d.addEventListener('click', function (e) { if (pop && !pop.contains(e.target) && !e.target.closest('.fn-ref')) closePop(); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop) closePop(true); });
  d.addEventListener('focusin', function (e) { if (pop && !pop.contains(e.target) && e.target !== popRef) closePop(); });

  // ---- listen (text to speech, in the browser; nothing is sent anywhere)
  var ttsBtn = $('[data-tts]'), tts = $('#tts'), synth = window.speechSynthesis;
  if (ttsBtn && tts && synth && window.SpeechSynthesisUtterance) {
    ttsBtn.hidden = false;
    var pp = $('.tts-pp', tts), stopB = $('.tts-stop', tts), rate = $('select', tts), st = $('.tts-st', tts), fill = $('.tts-bar span', tts);
    var parts = $$('#prose > :is(h2,h3,p,ul,ol,blockquote,details)').filter(function (el) { return el.textContent.trim(); });
    var idx = 0, playing = false, voice = null, gen = 0;
    var pickVoice = function () {
      var vs = synth.getVoices().filter(function (v) { return /^en(-|_|$)/i.test(v.lang); });
      voice = vs.filter(function (v) { return v.localService && /natural|premium|enhanced|samantha|daniel|google/i.test(v.name); })[0] || vs[0] || null;
    };
    pickVoice(); if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
    var show = function () {
      pp.dataset.state = playing ? 'playing' : 'paused';
      pp.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      st.textContent = 'Part ' + Math.min(idx + 1, parts.length) + ' of ' + parts.length;
      fill.style.width = (100 * idx / parts.length) + '%';
      parts.forEach(function (p, i) { p.classList.toggle('speaking', playing && i === idx); });
    };
    var speak = function () {
      if (idx >= parts.length) { stop(); say('Finished reading'); return; }
      var my = ++gen, el = parts[idx];
      var c = el.cloneNode(true);
      $$('.fn-ref,.anchor', c).forEach(function (x) { x.parentNode.removeChild(x); });
      var txt = c.textContent.replace(/\s+/g, ' ').trim();
      var u = new SpeechSynthesisUtterance(txt);
      u.lang = 'en'; if (voice) u.voice = voice; u.rate = +rate.value;
      u.onend = function () { if (my === gen && playing) { idx++; speak(); } };
      u.onerror = function () { if (my === gen && playing) { idx++; speak(); } };
      synth.speak(u);
      if (el.getBoundingClientRect().top > innerHeight * 0.7 || el.getBoundingClientRect().bottom < 80) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      show();
    };
    var play = function () { playing = true; synth.cancel(); speak(); };
    var pause = function () { playing = false; gen++; synth.cancel(); show(); };
    var stop = function () { pause(); idx = 0; tts.hidden = true; ttsBtn.setAttribute('aria-expanded', 'false'); show(); ttsBtn.focus(); };
    ttsBtn.addEventListener('click', function () {
      if (tts.hidden) { tts.hidden = false; ttsBtn.setAttribute('aria-expanded', 'true'); play(); pp.focus(); }
      else if (playing) pause(); else play();
    });
    pp.addEventListener('click', function () { if (playing) pause(); else play(); });
    stopB.addEventListener('click', stop);
    rate.addEventListener('change', function () { if (playing) play(); });
    addEventListener('pagehide', function () { synth.cancel(); });
  }

  // ---- search (instant, in the browser, over /search.json) with category and tag filters
  var sd = $('#search');
  if (sd && sd.showModal) {
    var q = $('#s-q', sd), res = $('#s-res', sd), cnt = $('#s-count', sd), fbox = $('#s-filters', sd);
    var data = null, filt = null, opener = null;
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var slug = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
    var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    var hi = function (s, words) {
      var h = esc(s);
      words.forEach(function (w) { if (w.length > 1) h = h.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
      return h;
    };
    var load = function () {
      if (data) return Promise.resolve(data);
      return fetch('/search.json').then(function (r) { return r.json(); }).then(function (j) {
        data = j.map(function (p) { p.n = norm([p.t, p.d, p.c, p.g.join(' '), p.x].join(' ')); return p; });
        var cats = [], tags = [];
        data.forEach(function (p) { if (cats.indexOf(p.c) < 0) cats.push(p.c); p.g.forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); }); });
        fbox.innerHTML = '<span class="sr">Filter by</span>' + cats.map(function (c) { return '<button type="button" class="chip" data-k="c" data-v="' + esc(c) + '" aria-pressed="false">' + esc(c) + '</button>'; }).join('')
          + tags.map(function (t) { return '<button type="button" class="chip" data-k="g" data-v="' + esc(t) + '" aria-pressed="false">#' + esc(t) + '</button>'; }).join('');
        $$('.chip', fbox).forEach(function (b) {
          b.addEventListener('click', function () {
            var on = b.getAttribute('aria-pressed') !== 'true';
            $$('.chip', fbox).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
            b.setAttribute('aria-pressed', String(on)); filt = on ? { k: b.dataset.k, v: b.dataset.v } : null; run();
          });
        });
        return data;
      });
    };
    var run = function () {
      if (!data) return;
      var words = norm(q.value.trim()).split(/\s+/).filter(Boolean);
      var hits = data.filter(function (p) {
        if (filt && (filt.k === 'c' ? p.c !== filt.v : p.g.indexOf(filt.v) < 0)) return false;
        return words.every(function (w) { return p.n.indexOf(w) >= 0; });
      }).map(function (p) {
        var s = 0, t = norm(p.t);
        words.forEach(function (w) { if (t.indexOf(w) >= 0) s += 3; if (norm(p.d).indexOf(w) >= 0) s += 1; });
        return { p: p, s: s };
      }).sort(function (a, b) { return b.s - a.s; });
      res.innerHTML = hits.map(function (h) {
        var p = h.p, snip = p.d;
        if (words.length) {
          var i = norm(p.x).indexOf(words[0]);
          if (i > -1 && norm(p.t + p.d).indexOf(words[0]) < 0) snip = (i > 60 ? '…' : '') + p.x.slice(Math.max(0, i - 60), i + 120) + '…';
        }
        return '<li><a href="' + p.u + '"><b>' + hi(p.t, words) + '</b><span>' + hi(snip, words) + '</span><span>' + esc(p.c) + ' · ' + esc(p.date) + ' · ' + p.m + ' min read</span></a></li>';
      }).join('');
      cnt.textContent = hits.length === 1 ? '1 post' : hits.length + ' posts';
      if (!hits.length) cnt.textContent = 'No posts match. Try other words.';
    };
    var openSearch = function (e) {
      opener = e && e.currentTarget; openSettings(false);
      sd.showModal(); q.focus(); load().then(run, function () { cnt.textContent = 'Search could not load. Check the connection and try again.'; });
    };
    $$('[data-open="search"]').forEach(function (b) { b.addEventListener('click', openSearch); });
    q.addEventListener('input', run);
    sd.addEventListener('close', function () { if (opener) opener.focus(); });
    sd.addEventListener('click', function (e) { if (e.target === sd) sd.close(); });
    sd.addEventListener('keydown', function (e) {
      var items = $$('a', res); if (!items.length) return;
      var i = items.indexOf(d.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(items.length - 1, i + 1)].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (i <= 0) q.focus(); else items[i - 1].focus(); }
      else if (e.key === 'Enter' && d.activeElement === q) { e.preventDefault(); location.href = items[0].href; }
    });
    d.addEventListener('keydown', function (e) {
      if (sd.open || typing(e)) return;
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
    });
  }

  // ---- home: ?category= and ?tag= links (from posts) filter the list; the page has no filter row
  var list = $('#posts');
  if (list) {
    var cards = $$('.card', list), count = $('#f-count'), empty = $('#empty');
    var apply = function (kind, v, push) {
      var n = 0;
      cards.forEach(function (c) {
        var ok = kind === 'all' || (kind === 'category' ? c.dataset.cat === v : (' ' + c.dataset.tags + ' ').indexOf(' ' + v + ' ') > -1);
        c.hidden = !ok; if (ok) n++;
      });
      count.textContent = '';
      if (kind !== 'all' && n) {
        count.textContent = (n === 1 ? '1 post' : n + ' posts') + ' tagged #' + v + ' · ';
        var all = document.createElement('button');
        all.type = 'button'; all.className = 'linkish'; all.textContent = 'Show all posts';
        all.addEventListener('click', function () { apply('all', '', true); });
        count.appendChild(all);
      }
      empty.hidden = n > 0;
      if (push) history.replaceState(null, '', kind === 'all' ? location.pathname : '?' + kind + '=' + encodeURIComponent(v));
    };
    $$('#empty [data-f]').forEach(function (c) { c.addEventListener('click', function () { apply('all', '', true); }); });
    var ps = new URLSearchParams(location.search);
    if (ps.get('category')) apply('category', ps.get('category'));
    else if (ps.get('tag')) apply('tag', ps.get('tag'));
  }

  // ---- newsletter: posts to verbumdomini.ca/api/subscribe (cloudflare/subscribe.js) and shows the answer
  // under the box, green or red, so the reader stays on the page. Without JavaScript the form posts there as a page.
  $$('form.news-f').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('button[type=submit]', f), m = $('.nl-msg', f.parentNode);
      if (!m) { m = d.createElement('p'); m.className = 'nl-msg'; m.setAttribute('role', 'status'); m.hidden = true; f.insertAdjacentElement('afterend', m); }
      var show = function (ok, t) { m.className = 'nl-msg ' + (ok ? 'ok' : 'err'); m.textContent = t; m.hidden = false; };
      btn.disabled = true;
      fetch('https://verbumdomini.ca/api/subscribe', { method: 'POST', body: new FormData(f) })
        .then(function (r) { return r.json(); })
        .then(function (r) { show(!!r.ok, r.msg); if (r.ok) f.reset(); }, function () { show(false, 'Something went wrong. Please try again later.'); })
        .then(function () { btn.disabled = false; });
    });
  });
})();
