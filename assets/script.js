/* =========================================================================
   Katolik Kilisesi İnanç Esasları Özeti · script.js
   Vanilla JavaScript, no libraries. Loaded (defer) on every page.
   1. Theme toggle            5. Search (lazy-loads data/*.js on first use)
   2. Live clock              6. Reading bar: current chapter, prev/next
   7. Table-of-contents drawer (small screens)
   8. Main nav: dropdown + mobile sheet
   9. Info panel (i)   10. Rosary
   ========================================================================= */
(function () {
  'use strict';

  /* Part number → page. Keep in sync with tools/build.ps1 ($PartMeta). The English pages use
     their own English slugs (not a literal mirror of the Turkish filename), so a parallel list
     is needed; keep it in sync with $PartMeta's fileEn values. */
  var PAGES = ['iman-ikrari.html', 'kutsal-sirlar.html', 'mesihte-yasam.html', 'hristiyan-duasi.html'];
  var DATA_FILES = ['data/compendium-1.js', 'data/compendium-2.js', 'data/compendium-3.js', 'data/compendium-4.js'];
  /* A content hash per data file, written in by tools/build.ps1, so every data file URL
     changes whenever its content does (and so can be cached for a long time) */
  var DATA_VER = {"__DATA_VER__": 1};
  function dataUrl(src) { return ROOT + src + (DATA_VER[src] ? '?v=' + DATA_VER[src] : ''); }
  var MAX_RESULTS = 50;
  /* Pages served at arbitrary URLs (404.html), and every /en/ page, declare <html data-root="/">
     so data and links resolve from the site root */
  var ROOT = document.documentElement.getAttribute('data-root') || '';
  /* The site is Turkish only; the English edition (verbumdomini.ca) has its own script. The text
     tables below still hold both languages, and the helpers further down take a Turkish and an
     English argument and give the Turkish. */
  var LANG = 'tr';
  function siteHref(file) { return ROOT + file; }

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  /* Runs fn on the frame after next, so a class added inside it reliably starts a CSS
     transition from the element's just-applied "closed" state. Same goal as the classic
     "read el.offsetHeight to force a reflow" trick, without forcing that reflow synchronously. */
  var nextFrame = function (fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); };

  /* ---------------------------------------------------------------
     0. Language: the helpers that once wrote both languages, kept so the text tables and their
        callers stay as they are. A "pair string" is now just the Turkish.
     --------------------------------------------------------------- */
  function LT(tr, en) { return tr; }
  function L2(tr, en) { return tr; }
  function setAttr2(el, name, tr, en) { el.setAttribute(name, tr); }
  function pmake(tr, en) { return tr == null ? '' : String(tr); }
  function pstr(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function pcat() { return Array.prototype.map.call(arguments, pmake).join(''); }
  function pjoin(list, sep) { return list.filter(Boolean).join(sep); }
  function pmap(v, fn) { return fn(pmake(v), 'tr'); }
  function phtml(v) { return esc(pmake(v)); }
  function pset(el, v) { if (el) el.textContent = pmake(v); }
  function pnow(v) { return pmake(v); }
  function pattr(name, v) { return name + '="' + esc(pmake(v)) + '"'; }

  /* ---------------------------------------------------------------
     The home page's strip of Church history: the arrows page through it, the slider and the
     scale of dates under it move along it and follow it; a mouse drags it sideways. Hovering or
     focusing an event shows its longer text in a card above it.
     --------------------------------------------------------------- */
  function initHistory() {
    var box = $('.hx'), track = box && $('.hx-track', box);
    if (!track) return;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var prev = $('[data-hx-step="-1"]', box), next = $('[data-hx-step="1"]', box), range = $('.hx-range', box);
    var items = $$('.hx-it', track), years = $$('.hx-yr', box), yl = $('.hx-yl', box);
    var n = items.length, last = Math.max(1, n - 1);
    var max = function () { return Math.max(0, track.scrollWidth - track.clientWidth); };
    var group = function (i) { return +items[Math.max(0, Math.min(n - 1, i))].getAttribute('data-g'); };
    /* event i is "in view" when the strip has come i/(n-1) of the way, so every event, the last
       ones too, has its own place along the slider */
    var posOf = function (i) { return i / last * max(); };

    /* every move glides: an eased run for a click, a steady one while an arrow is held down */
    var anim = 0;
    var stop = function () { if (anim) cancelAnimationFrame(anim); anim = 0; };
    var glide = function (x) {
      stop();
      var from = track.scrollLeft, to = Math.max(0, Math.min(max(), x)), d = to - from;
      if (still || Math.abs(d) < 1) { track.scrollLeft = to; return; }
      var t0 = 0, dur = Math.min(900, 320 + Math.abs(d) * .25);
      var tick = function (t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        track.scrollLeft = from + d * e;
        anim = k < 1 ? requestAnimationFrame(tick) : 0;
      };
      anim = requestAnimationFrame(tick);
    };
    var nowAt = function () { var m = max(); return m > 0 ? track.scrollLeft / m * last : 0; };
    /* the first event of the next (or previous) year */
    var stepTo = function (dir) {
      var g = group(Math.round(nowAt())), i;
      if (dir > 0) { for (i = 0; i < n && group(i) <= g; i++); }
      else { for (i = n - 1; i >= 0 && group(i) >= g; i--); while (i > 0 && group(i - 1) === group(i)) i--; }
      glide(posOf(Math.max(0, Math.min(n - 1, i))));
    };
    var hold = function (dir) {
      stop();
      var v = 0, lastT = 0;
      var run = function (t) {
        var dt = lastT ? Math.min(50, t - lastT) : 16; lastT = t;
        v = Math.min(.9, v + dt * .003);                 /* speeds up to ~900px a second */
        track.scrollLeft += dir * v * dt;
        anim = requestAnimationFrame(run);
      };
      anim = requestAnimationFrame(run);
    };
    [prev, next].forEach(function (b) {
      if (!b) return;
      var dir = +b.getAttribute('data-hx-step'), timer = 0, held = false;
      b.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        held = false;
        timer = setTimeout(function () { held = true; hold(dir); }, 260);
      });
      var release = function () { clearTimeout(timer); if (held) stop(); };
      b.addEventListener('pointerup', release);
      b.addEventListener('pointerleave', function () { release(); held = false; });
      b.addEventListener('pointercancel', function () { release(); held = false; });
      /* a quick press, or Enter and Space, glides to the next year; a long press has already moved */
      b.addEventListener('click', function () { if (held) held = false; else stepTo(dir); });
    });
    years.forEach(function (y) {
      y.addEventListener('click', function () { glide(posOf(+y.getAttribute('data-hx-to'))); });
      /* reaching a year with Tab brings the strip to it, so the year comes into the middle */
      y.addEventListener('focus', function () { if (y.matches(':focus-visible')) glide(posOf(+y.getAttribute('data-hx-to'))); });
    });
    /* the row is moved only by script.js: the browser must not scroll it to show a focused year */
    var ybox = yl && yl.parentNode;
    if (ybox) ybox.addEventListener('scroll', function () { ybox.scrollLeft = 0; });
    /* the reader's own scrolling, dragging or sliding stops a glide */
    ['wheel', 'touchstart'].forEach(function (ev) { track.addEventListener(ev, stop, { passive: true }); });
    if (range) range.addEventListener('input', function () { stop(); track.scrollLeft = +range.value / 1000 * max(); });

    /* the row of years slides with the strip: the year in view sits in the middle, lit */
    var centers = [], lit = -1;
    var measure = function () { centers = years.map(function (y) { return y.offsetLeft + y.offsetWidth / 2; }); };
    var update = function () {
      var m = max(), x = track.scrollLeft, f = m > 0 ? Math.min(last, Math.max(0, x / m * last)) : 0;
      var i = Math.floor(f), j = Math.min(n - 1, i + 1), k = f - i;
      if (prev) prev.disabled = x <= 2;
      if (next) next.disabled = x >= m - 2;
      if (yl && centers.length) {
        var c = centers[group(i)] + (centers[group(j)] - centers[group(i)]) * k;
        yl.style.transform = 'translateX(' + (-c).toFixed(1) + 'px)';
      }
      var g = group(Math.round(f));
      if (g !== lit) {
        if (years[lit]) { years[lit].classList.remove('is-on'); years[lit].removeAttribute('aria-current'); }
        if (years[g]) { years[g].classList.add('is-on'); years[g].setAttribute('aria-current', 'true'); }
        lit = g;
      }
      if (range) {
        if (document.activeElement !== range) range.value = String(m > 0 ? Math.round(x / m * 1000) : 0);
        var yi = items[Math.round(f)]; range.setAttribute('aria-valuetext', yi.getAttribute('data-y'));
      }
    };
    var raf = 0;
    track.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; update(); }); }, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); });

    /* a mouse drags the strip; a click that ended a drag does not open the event */
    var drag = null, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      stop(); drag = { x: e.clientX, left: track.scrollLeft }; moved = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('is-drag'); hidePop(); }
      if (moved) { track.scrollLeft = drag.left - dx; e.preventDefault(); }
    });
    var endDrag = function () {
      if (!drag) return;
      drag = null;
      if (moved) track.classList.remove('is-drag');
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* the longer text, in one card laid over the page (the strip itself would clip it) */
    var pop = document.createElement('div'), popFor = null, popT = 0;
    pop.className = 'hx-pop'; pop.setAttribute('role', 'tooltip'); pop.id = 'hx-pop'; pop.hidden = true;
    document.body.appendChild(pop);
    function hidePop() {
      clearTimeout(popT);
      if (popFor) popFor.querySelector('.hx-a').removeAttribute('aria-describedby');
      popFor = null; pop.hidden = true;
    }
    function showPop(it) {
      if (drag && moved) return;
      var d = it.querySelector('.hx-d');
      if (!d) return;
      if (popFor && popFor !== it) popFor.querySelector('.hx-a').removeAttribute('aria-describedby');
      popFor = it; pop.textContent = d.textContent; pop.hidden = false;
      it.querySelector('.hx-a').setAttribute('aria-describedby', 'hx-pop');
      var r = it.querySelector('.hx-ph').getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
      var left = Math.max(12, Math.min(window.innerWidth - pw - 12, r.left + r.width / 2 - pw / 2));
      var top = r.top - ph - 10;
      pop.classList.toggle('is-below', top < 70);
      if (top < 70) top = r.bottom + 10;
      pop.style.left = left + 'px'; pop.style.top = top + 'px';
    }
    var hover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    items.forEach(function (it) {
      var a = it.querySelector('.hx-a');
      if (hover) {
        it.addEventListener('mouseenter', function () { clearTimeout(popT); popT = setTimeout(function () { showPop(it); }, 180); });
        it.addEventListener('mouseleave', hidePop);
      }
      a.addEventListener('focus', function () { if (a.matches(':focus-visible')) showPop(it); });
      a.addEventListener('blur', hidePop);
    });
    track.addEventListener('scroll', function () { if (popFor && !hover) hidePop(); else if (popFor) showPop(popFor); }, { passive: true });
    window.addEventListener('scroll', hidePop, { passive: true });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && popFor) hidePop(); });

    measure(); update();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); update(); });
  }

  /* ---------------------------------------------------------------
     1. Theme (charcoal/gold dark, ivory/gold light) follows the sun: light from sunrise to sunset
        where the reader is, dark after. Where that is comes from the device's time zone alone
        (a table of zones below, or the zone's offset), worked out here and never sent anywhere.
        Today's sunrise and sunset are kept (kd-sun) so <head> can pick the theme before the
        first paint. The switch overrides the sun until its next rise or set (kd-theme-choice).
     --------------------------------------------------------------- */
  var THEME_CHOICE = 'kd-theme-choice', SUN_KEY = 'kd-sun';
  var SUN_ZONES = {
    'Europe/Istanbul': [41, 29], 'Asia/Istanbul': [41, 29], 'Europe/London': [51.5, -0.1], 'Europe/Dublin': [53.3, -6.3],
    'Europe/Berlin': [52.5, 13.4], 'Europe/Paris': [48.9, 2.4], 'Europe/Rome': [41.9, 12.5], 'Europe/Madrid': [40.4, -3.7],
    'Europe/Amsterdam': [52.4, 4.9], 'Europe/Brussels': [50.8, 4.4], 'Europe/Vienna': [48.2, 16.4], 'Europe/Zurich': [47.4, 8.5],
    'Europe/Stockholm': [59.3, 18.1], 'Europe/Oslo': [59.9, 10.8], 'Europe/Copenhagen': [55.7, 12.6], 'Europe/Warsaw': [52.2, 21],
    'Europe/Athens': [38, 23.7], 'Europe/Lisbon': [38.7, -9.1], 'Europe/Moscow': [55.8, 37.6], 'Europe/Kiev': [50.5, 30.5], 'Europe/Kyiv': [50.5, 30.5],
    'Asia/Nicosia': [35.2, 33.4], 'Europe/Nicosia': [35.2, 33.4], 'Asia/Beirut': [33.9, 35.5], 'Asia/Jerusalem': [31.8, 35.2], 'Asia/Baghdad': [33.3, 44.4],
    'Asia/Tbilisi': [41.7, 44.8], 'Asia/Yerevan': [40.2, 44.5], 'Asia/Baku': [40.4, 49.9], 'Asia/Dubai': [25.2, 55.3], 'Asia/Tehran': [35.7, 51.4],
    'America/New_York': [40.7, -74], 'America/Detroit': [42.3, -83], 'America/Chicago': [41.9, -87.6], 'America/Denver': [39.7, -105],
    'America/Phoenix': [33.4, -112.1], 'America/Los_Angeles': [34.1, -118.2], 'America/Anchorage': [61.2, -149.9], 'Pacific/Honolulu': [21.3, -157.9],
    'America/Toronto': [43.7, -79.4], 'America/Montreal': [45.5, -73.6], 'America/Halifax': [44.6, -63.6], 'America/St_Johns': [47.6, -52.7],
    'America/Winnipeg': [49.9, -97.1], 'America/Regina': [50.4, -104.6], 'America/Edmonton': [53.5, -113.5], 'America/Vancouver': [49.3, -123.1],
    'America/Mexico_City': [19.4, -99.1], 'America/Sao_Paulo': [-23.6, -46.6], 'America/Argentina/Buenos_Aires': [-34.6, -58.4],
    'Australia/Sydney': [-33.9, 151.2], 'Australia/Melbourne': [-37.8, 145], 'Australia/Brisbane': [-27.5, 153], 'Australia/Adelaide': [-34.9, 138.6],
    'Australia/Perth': [-31.9, 115.9], 'Australia/Hobart': [-42.9, 147.3], 'Australia/Darwin': [-12.5, 130.8], 'Pacific/Auckland': [-36.8, 174.8],
    'Asia/Tokyo': [35.7, 139.7], 'Asia/Seoul': [37.6, 127], 'Asia/Shanghai': [31.2, 121.5], 'Asia/Hong_Kong': [22.3, 114.2], 'Asia/Singapore': [1.3, 103.8],
    'Asia/Kolkata': [22.6, 77], 'Asia/Manila': [14.6, 121], 'Africa/Johannesburg': [-26.2, 28], 'Africa/Cairo': [30, 31.2], 'Africa/Lagos': [6.5, 3.4], 'Africa/Nairobi': [-1.3, 36.8]
  };
  function sunPlace(d) {
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* old browser */ }
    if (SUN_ZONES[tz]) return SUN_ZONES[tz];
    /* a zone not in the table: its clock offset gives the longitude, its region the hemisphere */
    var south = /^(Australia|Antarctica)\/|^Pacific\/(Auckland|Chatham|Fiji|Noumea|Tongatapu)|^America\/(Argentina|Sao_Paulo|Santiago|Montevideo|Asuncion|Lima|La_Paz)|^Africa\/(Johannesburg|Maputo|Harare|Lusaka|Windhoek|Gaborone)|^Indian\/(Mauritius|Reunion)/.test(tz);
    return [south ? -30 : 40, -d.getTimezoneOffset() / 4];
  }
  /* sunrise or sunset on the day of d, in minutes after local midnight (null: the sun does not rise or set that day) */
  function sunMin(d, lat, lon, rise) {
    var R = Math.PI / 180, N = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5);
    var lh = lon / 15, t = N + ((rise ? 6 : 18) - lh) / 24, M = 0.9856 * t - 3.289;
    var L = (M + 1.916 * Math.sin(M * R) + 0.020 * Math.sin(2 * M * R) + 282.634 + 720) % 360;
    var RA = (Math.atan(0.91764 * Math.tan(L * R)) / R + 720) % 360;
    RA = (RA + Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90) / 15;
    var sinD = 0.39782 * Math.sin(L * R), cosD = Math.cos(Math.asin(sinD));
    var cosH = (Math.cos(90.833 * R) - sinD * Math.sin(lat * R)) / (cosD * Math.cos(lat * R));
    if (cosH > 1 || cosH < -1) return null;
    var Hh = (rise ? 360 - Math.acos(cosH) / R : Math.acos(cosH) / R) / 15;
    var UT = ((Hh + RA - 0.06571 * t - 6.622 - lh) % 24 + 24) % 24;
    return Math.round(((UT * 60 - d.getTimezoneOffset()) % 1440 + 1440) % 1440);
  }
  function sunToday() {
    var d = new Date(), p = sunPlace(d), r = sunMin(d, p[0], p[1], true), s = sunMin(d, p[0], p[1], false);
    var sun = r == null || s == null || s <= r ? { r: 420, s: 1140 } : { r: r, s: s };
    try { localStorage.setItem(SUN_KEY, JSON.stringify(sun)); } catch (e) { /* private mode */ }
    return sun;
  }
  /* the theme the sun gives now, and the moment it next changes */
  function sunTheme() {
    var sun = sunToday(), d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    var mid = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    var next = m < sun.r ? mid + sun.r * 6e4 : m < sun.s ? mid + sun.s * 6e4 : mid + 864e5 + sun.r * 6e4;
    return { t: m >= sun.r && m < sun.s ? 'light' : 'dark', next: next };
  }
  function themeChoice() {
    try { var c = JSON.parse(localStorage.getItem(THEME_CHOICE) || 'null'); return c && c.until > Date.now() ? c.t : null; } catch (e) { return null; }
  }
  function wantedTheme() { return themeChoice() || sunTheme().t; }
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function syncTheme() {
    $$('.theme-toggle').forEach(function (b) {
      b.setAttribute('aria-checked', String(isDark()));
      setAttr2(b, 'aria-label', isDark() ? 'Açık temaya geç' : 'Koyu temaya geç', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }
  /* The browser's own bars follow the theme too: through the theme-color meta (Safari up to
     iOS 18, Chrome on Android); Safari 26 reads the solid header and tab bar instead. */
  function syncChrome() {
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--chrome').trim() || (isDark() ? '#16161a' : '#f7f2e8'));
  }
  function applyTheme(t) {
    if (document.documentElement.getAttribute('data-theme') === t) return;
    document.documentElement.setAttribute('data-theme', t);
    syncTheme(); syncChrome();
  }
  function initTheme() {
    applyTheme(wantedTheme());
    syncTheme();
    $$('.theme-toggle').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = isDark() ? 'light' : 'dark';
        try { localStorage.setItem(THEME_CHOICE, JSON.stringify({ t: next, until: sunTheme().next })); } catch (e) { /* private mode */ }
        applyTheme(next);
      });
    });
    /* the page left open over sunrise or sunset changes with it */
    setInterval(function () { if (!document.hidden) applyTheme(wantedTheme()); }, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) applyTheme(wantedTheme()); });
    /* Back to a page the browser kept in memory (Safari's swipe back, the back button): it comes
       back as it was left, so a theme, text size or accessibility setting changed on a later page
       would not show. Read the saved choices again. */
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      var H = document.documentElement;
      applyTheme(wantedTheme());
      try {
        var fs = localStorage.getItem('kkio-fontsize');
        if (fs === '1' || fs === '2') H.setAttribute('data-fontsize', fs); else H.removeAttribute('data-fontsize');
        var a11y = JSON.parse(localStorage.getItem('kkio-a11y') || '{}');
        ['reader', 'contrast', 'saturation', 'spacing', 'links', 'dyslexia', 'cursor'].forEach(function (k) {
          if (a11y[k]) H.setAttribute('data-a11y-' + k, '1'); else H.removeAttribute('data-a11y-' + k);
        });
      } catch (err) { /* private mode */ }
    });
  }

  /* ---------------------------------------------------------------
     1b. Text size (0 = default, 1 = large, 2 = larger), persisted like
     the theme. Scales the root font-size, so every rem-based measurement
     on the page (type, spacing, icons) grows together.
     --------------------------------------------------------------- */
  var FONTSIZE_KEY = 'kkio-fontsize';
  var FONTSIZE_LABELS = ['Yazı boyutunu büyüt', 'Yazı boyutunu büyüt', 'Yazı boyutunu sıfırla'];
  var FONTSIZE_LABELS_EN = ['Make the text bigger', 'Make the text bigger', 'Reset the text size'];
  function fontsizeLevel() { return document.documentElement.getAttribute('data-fontsize') || '0'; }
  function syncFontsize() {
    var level = fontsizeLevel();
    $$('.fontsize-toggle').forEach(function (b) {
      setAttr2(b, 'aria-label', FONTSIZE_LABELS[Number(level)], FONTSIZE_LABELS_EN[Number(level)]);
    });
  }
  function initFontSize() {
    syncFontsize();
    $$('.fontsize-toggle').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = (Number(fontsizeLevel()) + 1) % 3;
        if (next === 0) { document.documentElement.removeAttribute('data-fontsize'); }
        else { document.documentElement.setAttribute('data-fontsize', String(next)); }
        try { localStorage.setItem(FONTSIZE_KEY, String(next)); } catch (e) { /* private mode */ }
        syncFontsize();
      });
    });
  }

  /* ---------------------------------------------------------------
     2. Full-site menu overlay header: today's full date and a live
        clock, plus three at-a-glance pills: the liturgical season (with
        its vestment colour), today's rosary mystery and today's saint.
     --------------------------------------------------------------- */
  /* Gregorian Easter (Meeus/Jones/Butcher), shared by the saints calendar and the season pill */
  function easterMD(year) {
    var a = year % 19, b = Math.floor(year / 100), c = year % 100;
    var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    return { m: Math.floor((h + l - 7 * m + 114) / 31), d: ((h + l - 7 * m + 114) % 31) + 1 };
  }
  /* Where today falls in the Roman liturgical year, in the visitor's own time zone: the season
     (with its week) and the colour the priest wears. Special days of the Proper of Time that
     change the colour are included: rose on Gaudete and Laetare Sundays, red on Palm Sunday,
     Good Friday and Pentecost, white through the Triduum's feasts, Trinity Sunday and Christ
     the King. The solemnities of the General Roman Calendar come first, moved as the rubrics
     move them (St Joseph and the Annunciation out of Holy Week and the Easter Octave, a
     solemnity off an Advent or Lent Sunday), with All Souls; then the feasts, which give way to
     a Sunday (unless they are feasts of the Lord), to Ash Wednesday, Holy Week and the Easter
     Octave. Memorials are left out: the season's colour is worn on them. */
  var LIT_TEXT = {
    tr: {
      advent: 'Advent', christmas: 'Noel Dönemi', ordinary: 'Olağan Zaman', lent: 'Büyük Perhiz', easter: 'Paskalya Dönemi',
      week: function (n) { return n + '. Hafta'; }, ash: 'Kül Çarşambası', palm: 'Hurma Pazarı', holyWeek: 'Kutsal Hafta',
      thu: 'Kutsal Perşembe', fri: 'Kutsal Cuma', sat: 'Kutsal Cumartesi', easterDay: 'Paskalya', pentecost: 'Pentekost',
      trinity: 'Kutsal Üçlü Birlik', king: 'Evrenin Kralı Mesih', colour: 'Litürjik renk',
      motherOfGod: 'Tanrı’nın Annesi Meryem', joseph: 'Aziz Yusuf', annunciation: 'Müjde', ascension: 'İsa’nın Göğe Yükselişi',
      corpus: 'Mesih’in Bedeni ve Kanı', heart: 'İsa’nın Kutsal Kalbi', john: 'Vaftizci Yahya’nın Doğuşu',
      peterPaul: 'Aziz Petrus ve Aziz Pavlus', assumption: 'Meryem’in Göğe Alınışı', saints: 'Bütün Azizler',
      souls: 'Ölüleri Anma Günü', immaculate: 'Lekesiz Gebelik',
      feasts: { convPaul: 'Aziz Pavlus’un İmana Gelişi', presentation: 'İsa’nın Tapınağa Sunuluşu', chairPeter: 'Aziz Petrus’un Kürsüsü',
        mark: 'Aziz Markos', philipJames: 'Aziz Filipus ve Aziz Yakup', matthias: 'Aziz Mattias', visitation: 'Meryem’in Elizabet’i Ziyareti',
        thomas: 'Aziz Tomas', magdalene: 'Mecdelli Aziz Meryem', james: 'Aziz Yakup', transfiguration: 'Suretin Değişmesi',
        lawrence: 'Aziz Laurentius', bartholomew: 'Aziz Bartalmay', nativityMary: 'Meryem’in Doğuşu', cross: 'Kutsal Haç’ın Yüceltilmesi',
        matthew: 'Aziz Matta', archangels: 'Başmelekler Mikail, Cebrail ve Rafael', luke: 'Aziz Luka', simonJude: 'Aziz Simun ve Aziz Yahuda',
        lateran: 'Lateran Bazilikası’nın Kutsanması', andrew: 'Aziz Andreas', stephen: 'Aziz İstefanos', johnAp: 'Aziz Yuhanna', innocents: 'Masum Çocuklar' },
      colours: { green: 'yeşil', violet: 'mor', white: 'beyaz', red: 'kırmızı', rose: 'pembe' }
    },
    en: {
      advent: 'Advent', christmas: 'Christmas Season', ordinary: 'Ordinary Time', lent: 'Lent', easter: 'Easter Season',
      week: function (n) { return 'Week ' + n; }, ash: 'Ash Wednesday', palm: 'Palm Sunday', holyWeek: 'Holy Week',
      thu: 'Holy Thursday', fri: 'Good Friday', sat: 'Holy Saturday', easterDay: 'Easter Sunday', pentecost: 'Pentecost',
      trinity: 'The Holy Trinity', king: 'Christ the King', colour: 'Liturgical color',
      motherOfGod: 'Mary, Mother of God', joseph: 'Saint Joseph', annunciation: 'The Annunciation', ascension: 'The Ascension',
      corpus: 'Corpus Christi', heart: 'The Sacred Heart', john: 'Birth of John the Baptist',
      peterPaul: 'Saints Peter and Paul', assumption: 'The Assumption', saints: 'All Saints',
      souls: 'All Souls', immaculate: 'The Immaculate Conception',
      feasts: { convPaul: 'Conversion of Saint Paul', presentation: 'The Presentation of the Lord', chairPeter: 'Chair of Saint Peter',
        mark: 'Saint Mark', philipJames: 'Saints Philip and James', matthias: 'Saint Matthias', visitation: 'The Visitation',
        thomas: 'Saint Thomas', magdalene: 'Saint Mary Magdalene', james: 'Saint James', transfiguration: 'The Transfiguration',
        lawrence: 'Saint Lawrence', bartholomew: 'Saint Bartholomew', nativityMary: 'Nativity of Mary', cross: 'Exaltation of the Holy Cross',
        matthew: 'Saint Matthew', archangels: 'The Archangels', luke: 'Saint Luke', simonJude: 'Saints Simon and Jude',
        lateran: 'Dedication of the Lateran Basilica', andrew: 'Saint Andrew', stephen: 'Saint Stephen', johnAp: 'Saint John', innocents: 'The Holy Innocents' },
      colours: { green: 'green', violet: 'violet', white: 'white', red: 'red', rose: 'rose' }
    }
  };
  function liturgicalDay(now, lang) {
    var L = LIT_TEXT[lang || LANG], y = now.getFullYear();
    var today = new Date(y, now.getMonth(), now.getDate());
    function date(m, d) { return new Date(y, m - 1, d); }
    function add(dt, n) { var x = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); x.setDate(x.getDate() + n); return x; }
    function days(a, b) { return Math.round((a - b) / 86400000); }
    function same(a, b) { return days(a, b) === 0; }
    function res(name, week, colour) { return { name: name + (week ? ' · ' + L.week(week) : ''), colour: colour }; }
    var e = easterMD(y), easter = date(e.m, e.d), ash = add(easter, -46), palm = add(easter, -7);
    var pentecost = add(easter, 49), christmas = date(12, 25);
    var advent = add(christmas, -(christmas.getDay() || 7) - 21), king = add(advent, -7);
    var epiphany = date(1, 6), baptism = add(epiphany, 7 - epiphany.getDay());
    var lentSun1 = add(ash, 4), heart = add(easter, 68);
    // a fixed solemnity on a Sunday of Advent or Lent moves to the Monday
    function offSunday(d) { return d.getDay() === 0 && ((d >= lentSun1 && d < palm) || d >= advent) ? add(d, 1) : d; }
    var joseph = offSunday(date(3, 19)), annunciation = offSunday(date(3, 25));
    if (joseph >= palm && joseph <= add(easter, 7)) joseph = add(palm, -1);
    if (annunciation >= palm && annunciation <= add(easter, 7)) annunciation = add(easter, 8);
    var john = same(date(6, 24), heart) || same(date(6, 24), add(easter, 60)) ? date(6, 23) : date(6, 24);
    var feasts = [[date(1, 1), L.motherOfGod, 'white'], [joseph, L.joseph, 'white'], [annunciation, L.annunciation, 'white'],
      [add(easter, 39), L.ascension, 'white'], [add(easter, 60), L.corpus, 'white'], [heart, L.heart, 'white'],
      [john, L.john, 'white'], [date(6, 29), L.peterPaul, 'red'], [date(8, 15), L.assumption, 'white'],
      [date(11, 1), L.saints, 'white'], [date(11, 2), L.souls, 'violet'], [offSunday(date(12, 8)), L.immaculate, 'white']];
    for (var i = 0; i < feasts.length; i++) if (same(today, feasts[i][0])) return res(feasts[i][1], 0, feasts[i][2]);
    // feasts: [month, day, key, colour, feast of the Lord]
    var F = L.feasts, md = (today.getMonth() + 1) * 100 + today.getDate();
    var FEASTS = [[1, 25, 'convPaul', 'white'], [2, 2, 'presentation', 'white', 1], [2, 22, 'chairPeter', 'white'], [4, 25, 'mark', 'red'],
      [5, 3, 'philipJames', 'red'], [5, 14, 'matthias', 'red'], [5, 31, 'visitation', 'white'], [7, 3, 'thomas', 'red'],
      [7, 22, 'magdalene', 'white'], [7, 25, 'james', 'red'], [8, 6, 'transfiguration', 'white', 1], [8, 10, 'lawrence', 'red'],
      [8, 24, 'bartholomew', 'red'], [9, 8, 'nativityMary', 'white'], [9, 14, 'cross', 'red', 1], [9, 21, 'matthew', 'red'],
      [9, 29, 'archangels', 'white'], [10, 18, 'luke', 'red'], [10, 28, 'simonJude', 'red'], [11, 9, 'lateran', 'white', 1],
      [11, 30, 'andrew', 'red'], [12, 26, 'stephen', 'red'], [12, 27, 'johnAp', 'white'], [12, 28, 'innocents', 'red']];
    var yields = same(today, ash) || (today >= palm && today <= add(easter, 7));
    for (var j = 0; j < FEASTS.length && !yields; j++) {
      var f = /** @type {any[]} */ (FEASTS[j]);
      if (f[0] * 100 + f[1] === md && (today.getDay() !== 0 || f[4])) return res(F[f[2]], 0, f[3]);
    }

    if (today >= christmas || today <= baptism) return res(L.christmas, 0, 'white');
    if (today >= advent) {
      var aw = Math.floor(days(today, advent) / 7) + 1;
      return res(L.advent, aw, same(today, add(advent, 14)) ? 'rose' : 'violet');
    }
    if (today < ash) return res(L.ordinary, Math.floor(days(today, baptism) / 7) + 1, 'green');
    if (same(today, ash)) return res(L.ash, 0, 'violet');
    if (today < palm) {
      var lw = today < lentSun1 ? 0 : Math.floor(days(today, lentSun1) / 7) + 1;
      return res(L.lent, lw, same(today, add(lentSun1, 21)) ? 'rose' : 'violet');
    }
    if (same(today, palm)) return res(L.palm, 0, 'red');
    if (today < add(easter, -3)) return res(L.holyWeek, 0, 'violet');
    if (same(today, add(easter, -3))) return res(L.thu, 0, 'white');
    if (same(today, add(easter, -2))) return res(L.fri, 0, 'red');
    if (same(today, add(easter, -1))) return res(L.sat, 0, 'white');
    if (same(today, easter)) return res(L.easterDay, 0, 'white');
    if (today < pentecost) return res(L.easter, Math.floor(days(today, easter) / 7) + 1, 'white');
    if (same(today, pentecost)) return res(L.pentecost, 0, 'red');
    if (same(today, add(pentecost, 7))) return res(L.trinity, 0, 'white');
    if (same(today, king)) return res(L.king, 0, 'white');
    var sunday = add(today, -today.getDay());
    return res(L.ordinary, 34 - Math.round(days(king, sunday) / 7), 'green');
  }
  /* today's date in both languages, as a pair */
  function todayDateHtml() { return LT(todayDateText('tr'), todayDateText('en')); }
  function todayDateText(lang) {
    var d = new Date();
    try {
      if ((lang || LANG) === 'en') return new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
      var p = {};
      new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      return p.day + ' ' + p.month + ' ' + p.year + ' ' + p.weekday;
    } catch (e) {
      return d.toDateString();
    }
  }
  function tickNavTime() {
    var timeEl = $('[data-ns-time]');
    if (!timeEl) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    function tick() {
      var d = new Date();
      var time = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      timeEl.textContent = time;
      timeEl.setAttribute('datetime', time);
      setTimeout(tick, 1000 - (Date.now() % 1000) + 5); // aligned to the next full second
    }
    tick();
  }
  function initNavToday() {
    var dateEl = $('[data-ns-date]');
    if (dateEl) dateEl.innerHTML = todayDateHtml();
    tickNavTime();
  }

  /* ---------------------------------------------------------------
     5. Search: Turkish + English, loads the data files on first use
     --------------------------------------------------------------- */
  var foldCache = {};
  /* Case/diacritic folding that preserves string length ("İsa" ~ "isa", "şükran" ~ "sukran") */
  function fold(s) {
    var lower = s.toLocaleLowerCase('tr');
    if (lower.length !== s.length) lower = s.toLowerCase();
    if (lower.length !== s.length) return s;
    var out = '';
    for (var i = 0; i < lower.length; i++) {
      var code = lower.charCodeAt(i);
      if (code < 128) { out += lower[i]; continue; }
      var m = foldCache[code];
      if (m === undefined) {
        m = lower[i].normalize ? lower[i].normalize('NFD')[0] : lower[i];
        if (m === 'ı') m = 'i';
        if (m === '’' || m === '‘') m = "'";
        foldCache[code] = m;
      }
      out += m;
    }
    return out;
  }
  /* Data text → plain text: [[Petrus|Peter]] → "Petrus (Peter)", tags removed */
  function plain(s) {
    return String(s || '').replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$1 ($2)').replace(/<[^>]+>/g, '').replace(/\n- /g, ' ').replace(/\s+/g, ' ').trim();
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function highlight(text, terms) {
    var f = fold(text), ranges = [];
    terms.forEach(function (t) { var i = f.indexOf(t); while (i !== -1) { ranges.push([i, i + t.length]); i = f.indexOf(t, i + t.length); } });
    if (!ranges.length) return esc(text);
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', pos = 0;
    ranges.forEach(function (r) {
      if (r[0] < pos) { if (r[1] > pos) { out += '<mark>' + esc(text.slice(pos, r[1])) + '</mark>'; pos = r[1]; } return; }
      out += esc(text.slice(pos, r[0])) + '<mark>' + esc(text.slice(r[0], r[1])) + '</mark>'; pos = r[1];
    });
    return out + esc(text.slice(pos));
  }
  function snippet(text, terms, len) {
    var f = fold(text), at = -1;
    terms.forEach(function (t) { var i = f.indexOf(t); if (i !== -1 && (at === -1 || i < at)) at = i; });
    if (at === -1 || text.length <= len) return text.length > len ? text.slice(0, len).replace(/\s+\S*$/, '') + '…' : text;
    var start = Math.max(0, at - Math.floor(len / 3));
    var s = text.slice(start, start + len);
    if (start > 0) s = '…' + s.replace(/^\S*\s/, '');
    if (start + len < text.length) s = s.replace(/\s+\S*$/, '') + '…';
    return s;
  }

  var index = null, loading = null;
  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = Promise.all(DATA_FILES.map(function (src, i) {
      return new Promise(function (resolve, reject) {
        if (window.COMPENDIUM && window.COMPENDIUM.parts && window.COMPENDIUM.parts[i]) return resolve();
        var s = document.createElement('script');
        s.src = dataUrl(src); s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    })).then(function () {
      index = [];
      window.COMPENDIUM.parts.forEach(function (p, pi) {
        p.items.forEach(function (it) {
          if (it.type !== 'qa') return;
          var e = { n: it.n, page: siteHref(PAGES[pi]), part: p.tr, partEn: p.en, q: plain(it.tr.q), a: plain(it.tr.a), qe: plain(it.en.q), ae: plain(it.en.a) };
          e.fq = fold(e.q); e.fa = fold(e.a); e.fe = fold(e.qe + ' ' + e.ae);
          index.push(e);
        });
      });
      return index;
    });
    return loading;
  }

  function search(raw) {
    var q = fold(raw.trim()).replace(/[“”"]/g, '');
    var terms = q.split(/\s+/).filter(function (t) { return t.length > 1 || /^\d$/.test(t); });
    if (!terms.length) return { terms: [], hits: [] };
    var num = /^\d{1,3}$/.test(q) ? parseInt(q, 10) : null;
    var hits = [];
    index.forEach(function (e) {
      var all = function (s) { return terms.every(function (t) { return s.indexOf(t) !== -1; }); };
      var score = 0, en = false;
      if (num !== null && e.n === num) score = 100;
      else if (all(e.fq)) score = 3;
      else if (all(e.fq + ' ' + e.fa)) score = 2;
      else if (all(e.fe)) { score = 1; en = true; }
      if (score) hits.push({ e: e, score: score, en: en });
    });
    hits.sort(function (a, b) { return b.score - a.score || a.e.n - b.e.n; });
    return { terms: terms, hits: hits };
  }

  function renderResults(box, raw, res) {
    if (!res.terms.length) { box.hidden = true; box.innerHTML = ''; return; }
    var qx = '“' + esc(raw.trim()) + '”', n = res.hits.length, more = n > MAX_RESULTS;
    var html = '<p class="sr-head" role="status">' + (n
      ? LT(qx + ' için ' + n + ' soru' + (more ? ' (ilk ' + MAX_RESULTS + ' gösteriliyor)' : ''), n + (n === 1 ? ' question' : ' questions') + ' for ' + qx + (more ? ' (first ' + MAX_RESULTS + ' shown)' : ''))
      : LT(qx + ' için sonuç bulunamadı.', 'No results for ' + qx + '.')) + '</p>';
    res.hits.slice(0, MAX_RESULTS).forEach(function (h) {
      var e = h.e, t0 = res.terms[0];
      /* the snippet in each language: where the words were found, else the answer */
      var snipTr = h.en ? null : snippet(e.a, res.terms, 150);
      var snipEn = snippet(fold(e.qe).indexOf(t0) !== -1 && fold(e.ae).indexOf(t0) === -1 ? e.qe : e.ae, res.terms, 150);
      html += '<a class="sr-item" href="' + e.page + '#soru-' + e.n + '"><span class="sr-num">' + e.n + '</span><span class="sr-body">' +
        '<span class="sr-q">' + LT(highlight(e.q, res.terms), highlight(e.qe, res.terms)) + '</span>' +
        '<span class="sr-snip">' + LT(snipTr === null ? '<span lang="en">' + highlight(snipEn, res.terms) + '</span>' : highlight(snipTr, res.terms), highlight(snipEn, res.terms)) + '</span>' +
        '<span class="sr-meta">' + LT(esc(e.part) + (h.en ? '<span class="sr-en">EN</span>' : ''), esc(e.partEn || e.part)) + '</span></span></a>';
    });
    box.innerHTML = html;
    box.hidden = false;
  }

  function initSearch() {
    $$('[data-search]').forEach(function (wrap) {
      var input = $('input', wrap), box = $('.search-results', wrap), timer = null;
      function run() {
        var raw = input.value;
        if (!raw.trim()) { renderResults(box, raw, { terms: [], hits: [] }); return; }
        loadIndex().then(function () { if (input.value === raw) renderResults(box, raw, search(raw)); })
          .catch(function () { box.hidden = false; box.innerHTML = '<p class="sr-empty">' + LT('Arama verileri yüklenemedi.', 'The search data could not be loaded.') + '</p>'; });
      }
      input.addEventListener('focus', function () { loadIndex().catch(function () {}); if (input.value.trim() && box.innerHTML) box.hidden = false; });
      input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 120); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { var first = $('.sr-item', box); if (first && !box.hidden) { e.preventDefault(); first.focus(); } }
        else if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); run(); loadIndex().then(function () { var f = $('.sr-item', box); if (f) location.href = f.getAttribute('href'); }); }
        else if (e.key === 'Escape') { box.hidden = true; }
      });
      box.addEventListener('keydown', function (e) {
        var items = $$('.sr-item', box), i = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (i > 0) items[i - 1].focus(); else input.focus(); }
        else if (e.key === 'Escape') { box.hidden = true; input.focus(); }
      });
      box.addEventListener('click', function (e) { if (e.target.closest('.sr-item')) box.hidden = true; });
      document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) box.hidden = true; });
      wrap.addEventListener('submit', function (e) { e.preventDefault(); });
    });
    /* ?q=… (used by the WebSite SearchAction on the home page) */
    var q = new URLSearchParams(location.search).get('q');
    var hero = $('.hero-search input');
    if (q && hero) { hero.value = q; hero.dispatchEvent(new Event('input')); hero.focus(); }
  }

  /* ---------------------------------------------------------------
     6. Reading bar: current chapter title, prev/next chapter,
        and TOC highlighting (rAF-throttled scroll handler)
     --------------------------------------------------------------- */
  function initReader() {
    var content = $('.content[data-reader]');
    /* phones' app view shows the questions level by level instead of the reading bar */
    if (!content || document.documentElement.classList.contains('av')) return;
    /* Search button (phones): opens the question search under the reading bar */
    var rbBtn = $('.rb-search-btn', content), rbBox = $('#rb-search');
    if (rbBtn && rbBox) {
      rbBtn.addEventListener('click', function () {
        var on = rbBox.hidden;
        rbBox.hidden = !on;
        rbBtn.setAttribute('aria-expanded', String(on));
        if (on) { var inp = $('input', rbBox); if (inp) inp.focus({ preventScroll: true }); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !rbBox.hidden && rbBox.contains(document.activeElement)) { rbBox.hidden = true; rbBtn.setAttribute('aria-expanded', 'false'); rbBtn.focus(); }
      });
    }
    var heads = $$('.sec', content);
    var stops = heads.filter(function (h) { return h.classList.contains('sec-l2') || h.classList.contains('sec-l3'); });
    var current = $('.readbar .current');
    var defaultTitle = current ? pstr(current) : '';
    var header = $('.site-header');
    var links = {};
    $$('.toc a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var tocBox = $('.toc');
    var activeLink = null, stopIndex = -1, ticking = false;

    function titleOf(h) { var t = $('.sec-title', h); return pstr(t || h); }
    function update() {
      ticking = false;
      var line = (header ? header.offsetHeight : 64) + 80;
      var cur = null, si = -1;
      for (var i = 0; i < heads.length; i++) { if (heads[i].getBoundingClientRect().top <= line) cur = heads[i]; else break; }
      for (var j = 0; j < stops.length; j++) { if (stops[j].getBoundingClientRect().top <= line) si = j; else break; }
      stopIndex = si;
      if (current) pset(current, si >= 0 ? titleOf(stops[si]) : defaultTitle);
      var link = cur ? links[cur.id] : null;
      if (link !== activeLink) {
        if (activeLink) activeLink.removeAttribute('aria-current');
        if (link) {
          link.setAttribute('aria-current', 'location');
          if (tocBox && getComputedStyle(tocBox).position === 'sticky') {
            var lt = link.offsetTop, st = tocBox.scrollTop, h = tocBox.clientHeight;
            if (lt < st + 40 || lt > st + h - 60) tocBox.scrollTop = lt - h / 3;
          }
        }
        activeLink = link;
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    function go(target) { if (target) { target.scrollIntoView({ block: 'start' }); history.replaceState(null, '', '#' + target.id); } }
    $$('[data-chapter="prev"]').forEach(function (b) { b.addEventListener('click', function () { go(stops[Math.max(0, stopIndex - 1)]); }); });
    $$('[data-chapter="next"]').forEach(function (b) { b.addEventListener('click', function () { go(stops[Math.min(stops.length - 1, stopIndex + 1)]); }); });
  }

  /* ---------------------------------------------------------------
     7. Table of contents as a drawer on small screens
     --------------------------------------------------------------- */
  function initDrawer() {
    var toc = $('.toc');
    if (!toc) return;
    var backdrop = null, opener = null;
    function close(refocus) {
      if (!toc.classList.contains('open')) return;
      toc.classList.remove('open');
      if (backdrop) { backdrop.remove(); backdrop = null; }
      $$('.toc-open').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      if (opener && refocus !== false) opener.focus();
    }
    function open(btn) {
      opener = btn;
      toc.classList.add('open');
      backdrop = document.createElement('div'); backdrop.className = 'toc-backdrop';
      backdrop.addEventListener('click', function () { close(); });
      document.body.appendChild(backdrop);
      btn.setAttribute('aria-expanded', 'true');
      var first = $('a[aria-current], a', toc); if (first) first.focus();
    }
    $$('.toc-open').forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
    $$('.toc-close').forEach(function (b) { b.addEventListener('click', function () { close(); }); });
    toc.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------------------------------------------------------------
     8. Main navigation: four plain links in the bar plus a hamburger,
        shown at every width, that opens the full-site overlay menu.
        Plain DOM, no dependencies.
     --------------------------------------------------------------- */
  // Desktop menus: Öğren, Cevap Ver, Dua Et, Keşfet open on hover (a mouse), on click and from the
  // keyboard; Escape or a click elsewhere closes them. A page with more inside opens its own list
  // beside the panel the same way.
  function initDeskNav() {
    var tops = $$('.dn-top'); if (!tops.length) return;
    var hover = window.matchMedia('(hover: hover) and (pointer: fine)');
    function setTop(li, on) {
      li.classList.toggle('is-open', on);
      var b = li.querySelector('.dn-btn'); if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (!on) $$('.dn-item.is-open', li).forEach(function (x) { x.classList.remove('is-open'); });
    }
    function closeAll(except) { tops.forEach(function (t) { if (t !== except) setTop(t, false); }); }
    tops.forEach(function (li) {
      var btn = li.querySelector('.dn-btn'), timer = null;
      btn.addEventListener('click', function () { var on = !li.classList.contains('is-open'); closeAll(li); setTop(li, on); });
      li.addEventListener('mouseenter', function () { if (!hover.matches) return; clearTimeout(timer); closeAll(li); setTop(li, true); });
      li.addEventListener('mouseleave', function () { if (!hover.matches) return; clearTimeout(timer); timer = setTimeout(function () { setTop(li, false); }, 220); });
      li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) setTop(li, false); });
      $$('.dn-item.has-sub', li).forEach(function (it) {
        var t2 = null;
        it.addEventListener('mouseenter', function () {
          if (!hover.matches) return; clearTimeout(t2);
          Array.prototype.forEach.call(it.parentNode.children, function (sib) { if (sib !== it) sib.classList.remove('is-open'); });
          it.classList.add('is-open');
        });
        it.addEventListener('mouseleave', function () { if (!hover.matches) return; clearTimeout(t2); t2 = setTimeout(function () { it.classList.remove('is-open'); }, 200); });
        it.addEventListener('focusin', function () {
          Array.prototype.forEach.call(it.parentNode.children, function (sib) { if (sib !== it) sib.classList.remove('is-open'); });
          it.classList.add('is-open');
        });
        it.addEventListener('focusout', function (e) { if (!it.contains(e.relatedTarget)) it.classList.remove('is-open'); });
        /* touch screens have no hover: the first tap on an item with a sub-list opens the list, the second follows the link */
        var a1 = it.querySelector('a');
        /* (the open state is read at pointerdown: a tap also fires mouseenter, which opens the list before the click) */
        if (a1) a1.addEventListener('pointerdown', function (e) { a1._touch = e.pointerType === 'touch' || e.pointerType === 'pen'; a1._wasOpen = it.classList.contains('is-open'); });
        if (a1) a1.addEventListener('click', function (e) {
          var touch = a1._touch || !hover.matches, wasOpen = a1._touch ? a1._wasOpen : it.classList.contains('is-open'); a1._touch = false;
          if (!touch || wasOpen) return;
          e.preventDefault();
          Array.prototype.forEach.call(it.parentNode.children, function (sib) { if (sib !== it) sib.classList.remove('is-open'); });
          it.classList.add('is-open');
        });
      });
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { setTop(li, false); btn.focus(); return; }
        if (e.key === 'ArrowDown' && e.target === btn) { e.preventDefault(); setTop(li, true); var f = li.querySelector('.dn-panel a'); if (f) f.focus(); return; }
        var links = $$('.dn-panel > .dn-list > .dn-item > a', li), i = links.indexOf(e.target);
        if (i > -1 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); var n = links[(i + (e.key === 'ArrowDown' ? 1 : links.length - 1)) % links.length]; n.focus(); }
        if (i > -1 && e.key === 'ArrowRight') { var sub = e.target.parentNode.querySelector('.dn-sub a'); if (sub) { e.preventDefault(); sub.focus(); } }
      });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.dn-top')) closeAll(null); });
    /* a sub-list that would run past the right edge of the window opens to the left instead */
    function placeSubs() {
      var w = document.documentElement.clientWidth;
      $$('.dn-sub').forEach(function (s) {
        s.classList.remove('dn-flip');
        if (s.getBoundingClientRect().right > w - 8) s.classList.add('dn-flip');
      });
    }
    placeSubs();
    var rz = null;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(placeSubs, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeSubs);
  }
  function initNav() {
    var sheet = $('#navsheet');
    if (!sheet) return;
    var toggles = $$('.menu-toggle'), panel = $('.navsheet-panel', sheet), hideTimer = null;
    function openSheet() {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      sheet.hidden = false;
      nextFrame(function () { sheet.classList.add('open'); });
      document.body.classList.add('sheet-open');
      toggles.forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
      var first = $('.ns-item[aria-current="page"]', sheet) || $('.ns-item', sheet);
      if (first) first.focus();
    }
    function closeSheet(refocus) {
      if (!sheet.classList.contains('open')) return;
      sheet.classList.remove('open');
      document.body.classList.remove('sheet-open');
      toggles.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      if (refocus && toggles[0]) toggles[0].focus();
      hideTimer = setTimeout(function () { sheet.hidden = true; hideTimer = null; }, 400);
    }
    toggles.forEach(function (b) {
      b.addEventListener('click', function () {
        if (sheet.classList.contains('open')) closeSheet(true); else openSheet();
      });
    });
    if (panel) panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeSheet(false);
    });
    /* a click beside the drawer, on the dimmed page, closes it */
    sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(true); });
    /* Growing past the phone breakpoint while the sheet is open would leave the page locked */
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) closeSheet(false); });
  }

  /* Offset from the cursor, flipping near an edge rather than clamping (the saints' bio panel). */
  function placePanel(panel, x, y) {
    panel.classList.remove('centered');
    var w = panel.offsetWidth, h = panel.offsetHeight, m = 12, gap = 18;
    var left = x + gap;
    if (left + w > window.innerWidth - m) left = x - w - gap;
    left = Math.max(m, Math.min(left, window.innerWidth - w - m));
    var top = y + 20;
    if (top + h > window.innerHeight - m) top = Math.max(m, y - h - gap);
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }
  var FINE = !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------------------------------------------------------
     9. Footer "Kaynaklar ve telif": a native modal <dialog> (focus
        trap, Esc and focus return come from the browser); a click on
        the blurred backdrop closes it too.
     --------------------------------------------------------------- */
  /* The footer's popups: Kaynaklar ve telif, and İletişim, Erişilebilirlik and Gizlilik (which
     are links to their own pages without JS) */
  function initSources() {
    function open(dlg) { fill(dlg); if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); }
    /* a popup whose text lives on its own page: fetched the first time it opens */
    function fill(dlg) {
      var box = $('.info-inner[data-lazy]', dlg), a = box && $('a', box);
      if (!a || box.getAttribute('data-lazy') === 'busy' || !window.fetch || !window.DOMParser) return;
      box.setAttribute('data-lazy', 'busy');
      var url = a.href;
      fetch(url).then(function (r) { if (!r.ok) throw r; return r.text(); }).then(function (t) {
        var body = new DOMParser().parseFromString(t, 'text/html').querySelector('#main .body');
        if (!body) throw body;
        /* its links were written for that page's folder */
        $$('a[href]', body).forEach(function (x) { var h = x.getAttribute('href'); if (!/^(#|[a-z]+:)/i.test(h)) x.setAttribute('href', new URL(h, url).href); });
        box.innerHTML = body.innerHTML;
        box.removeAttribute('data-lazy');
      }).catch(function () { box.setAttribute('data-lazy', ''); });
    }
    function close(dlg) { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); }
    /* The footer's links to these pages open their popup; everywhere else (the menus) they
       open the page itself. The href stays, so the pages are still crawled and open without JS */
    var DLG_PAGES = { 'erisilebilirlik.html': 'dlg-erisilebilirlik', 'gizlilik.html': 'dlg-gizlilik', 'kaynaklar-ve-telif.html': 'sources-dialog',
      'accessibility.html': 'dlg-erisilebilirlik', 'privacy.html': 'dlg-gizlilik', 'sources-and-copyright.html': 'sources-dialog' };
    var here = location.pathname.split('/').pop();
    $$('a[href]:not([data-no-dlg])').forEach(function (a) {
      var page = (a.getAttribute('href') || '').split(/[?#]/)[0].split('/').pop();
      var id = a.getAttribute('data-dialog') || DLG_PAGES[page];
      var dlg = id && page !== here && a.closest('footer') && document.getElementById(id);
      if (dlg) a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
        e.preventDefault();
        if (document.body.classList.contains('sheet-open')) { var x = $('.menu-toggle[aria-expanded="true"]'); if (x) x.click(); }
        open(dlg);
      });
    });
    $$('.sources-dialog').forEach(function (dlg) {
      $('.sources-close', dlg).addEventListener('click', function () { close(dlg); });
      dlg.addEventListener('click', function (e) {
        var r = dlg.getBoundingClientRect();
        if (e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) close(dlg);
      });
    });
  }

  /* A Bible, Qur'an or hadith reference opens its passage in a popup, read from the page itself
     (or from data/refs-*.js, loaded on the first click, where the page carries none). The link keeps its href: a modifier-click, or a passage the
     data doesn't have, still goes to the external site. */
  function initRefs() {
    var KINDS = {
      bref: { file: 'data/refs-bible.js', name: 'REFS_BIBLE', key: function (u) { return (u.searchParams.get('search') || '').replace(/\s*[-–]\s*/g, '-'); } },
      qref: { file: 'data/refs-quran.js', name: 'REFS_QURAN', key: function (u) { return u.pathname.slice(1).replace('/', ':'); } },
      hdref: { file: 'data/refs-hadith.js', name: 'REFS_HADITH', key: function (u) { return decodeURIComponent(u.pathname.slice(1)); } }
    };
    /* the passages this page cites, written into it by the build (build.ps1, Embed-Refs) */
    var emb = document.getElementById('kd-refs');
    if (emb) { try { var ed = JSON.parse(emb.textContent); Object.keys(ed).forEach(function (n) { if (!window[n]) window[n] = ed[n]; }); } catch (err) {} }
    var dlg = null, body, title, foot;
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function build() {
      var close = $('.sources-close');
      dlg = el('dialog', 'sources-dialog ref-dialog'); dlg.id = 'ref-dialog'; dlg.setAttribute('aria-labelledby', 'ref-dialog-t');
      var x = el('button', 'sources-close'); x.type = 'button'; x.setAttribute('aria-label', 'Kapat');
      x.innerHTML = close ? close.innerHTML : '×';
      title = el('h2', 'sources-title'); title.id = 'ref-dialog-t';
      body = el('div', 'info-inner ref-body'); foot = el('p', 'ref-foot');
      dlg.appendChild(x); dlg.appendChild(title); dlg.appendChild(body); dlg.appendChild(foot);
      document.body.appendChild(dlg);
      x.addEventListener('click', shut);
      dlg.addEventListener('click', function (e) {
        var r = dlg.getBoundingClientRect();
        if (e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) shut();
      });
    }
    function shut() { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); }
    /* verses as one paragraph, each number raised; lang marks the text's language for screen readers */
    function verses(list, lang, pick) {
      var p = el('p', 'ref-text'); p.lang = lang;
      list.forEach(function (v, i) {
        if (list.length > 1) p.appendChild(el('sup', 'ref-v', String(v[0])));
        p.appendChild(document.createTextNode(pick(v) + (i < list.length - 1 ? ' ' : '')));
      });
      return p;
    }
    function arabic(text) { var p = el('p', 'ref-ar', text); p.lang = 'ar'; p.dir = 'rtl'; return p; }
    /* the English translation, folded away under the Turkish */
    function other(label, node) { var d = el('details', 'ref-other'); d.appendChild(el('summary', '', label)); d.appendChild(node); return d; }
    function fill(kind, key, a) {
      var data = /** @type {any} */ (window)[KINDS[kind].name], item = data && data[key];
      body.textContent = ''; foot.textContent = '';
      var label = a.textContent.trim();
      if (kind === 'qref') label = 'Kur’an ' + key;
      /* "Yuhanna 6:55; 6:66": the second link carries no book name, so borrow the first one's */
      if (kind === 'bref' && /^\d+:/.test(label)) {
        for (var prev = a.previousElementSibling; prev; prev = prev.previousElementSibling) {
          if (prev.matches('a.bref') && !/^\d+:/.test(prev.textContent.trim())) { label = prev.textContent.trim().replace(/\s\d+:[\d\s,\-–]+$/, '') + ' ' + label; break; }
        }
      }
      title.textContent = label;
      if (!item) {
        body.appendChild(el('p', 'ref-note', data ? 'Bu metin henüz koleksiyonumuzda yok.' : 'Yükleniyor…'));
      } else if (kind === 'bref') {
        var tr = verses(item.tr, 'tr', function (v) { return v[1]; }), dr = verses(item.en, 'en', function (v) { return v[1]; });
        body.appendChild(tr);
        body.appendChild(other('İngilizcesi (Douay-Rheims)', dr));
      } else if (kind === 'qref') {
        var ar = el('p', 'ref-ar'); ar.lang = 'ar'; ar.dir = 'rtl';
        item.forEach(function (v, i) { ar.appendChild(document.createTextNode(v[1] + ' ')); ar.appendChild(el('span', 'ref-ayah', '﴿' + v[0].toLocaleString('ar-EG') + '﴾')); if (i < item.length - 1) ar.appendChild(document.createTextNode(' ')); });
        body.appendChild(ar);
        var qtr = verses(item, 'tr', function (v) { return v[2]; }), qen = verses(item, 'en', function (v) { return v[3]; });
        body.appendChild(qtr);
        body.appendChild(other('İngilizcesi (Pickthall)', qen));
      } else {
        body.appendChild(arabic(item.ar));
        var htr = el('p', 'ref-text', item.tr), hen = el('p', 'ref-text', item.en); htr.lang = 'tr'; hen.lang = 'en';
        body.appendChild(htr);
        body.appendChild(other('İngilizcesi', hen));
      }
      var src = { bref: 'Türkçe çeviri bize aittir. İngilizcesi: Douay-Rheims.',
        qref: 'Arapça: Tanzil. Türkçe çeviri bize aittir. İngilizcesi: Pickthall.',
        hdref: 'Numaralar sunnah.com’a göredir. Türkçe ve İngilizce çeviriler bize aittir.' }[kind];
      if (item) foot.appendChild(el('span', 'ref-src', src + ' '));
      var out = el('a', '', 'Kaynağında aç ↗');
      out.href = a.href; out.target = '_blank'; out.rel = 'noopener';
      foot.appendChild(out);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.bref, a.qref, a.hdref');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
      var kind = a.classList.contains('bref') ? 'bref' : a.classList.contains('qref') ? 'qref' : 'hdref', k = KINDS[kind], key;
      try { key = k.key(new URL(a.href)); } catch (err) { return; }
      e.preventDefault();
      if (!dlg) build();
      fill(kind, key, a);
      if (!dlg.open) { if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); }
      dlg.scrollTop = 0;
      if (!window[k.name]) loadDataScript(k.file, k.name).then(function () { if (dlg.open) fill(kind, key, a); }, function () {
        body.textContent = ''; body.appendChild(el('p', 'ref-note', 'Metin yüklenemedi.'));
      });
    });
  }

  /* ---------------------------------------------------------------
     10. Rosary: highlights today's set of mysteries, in the visitor's
         own local time zone. The prayer cards are plain <details>.
     --------------------------------------------------------------- */
  function initRosary() {
    if (!$('.myst')) return;

    var day = new Date().getDay();
    $$('.myst').forEach(function (m) {
      var days = (m.getAttribute('data-days') || '').split(',').map(Number);
      if (days.indexOf(day) !== -1) m.classList.add('is-today');
    });
  }

  /* ---------------------------------------------------------------
     10a. Anatolian Roots map (topraklarimizda-hristiyanlik.html): a
          place's card follows the mouse while hovering; a click, tap,
          Enter or an index chip pins it. The card content is the
          server-rendered <article class="amap-card"> for that place.
     --------------------------------------------------------------- */
  /* Illustrated sections (Ill-Sec in build.ps1): each section's line drawing draws itself as the section
     scrolls into view (without IntersectionObserver, or with reduced motion, the CSS simply shows it whole) */
  function initDrawings() {
    var secs = $$('.ill-sec, .ill-card');
    if (!secs.length || !window.IntersectionObserver) return;
    document.documentElement.classList.add('ill-draw');
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -20% 0px' });
    secs.forEach(function (s) { obs.observe(s); });
  }

  function initAnatoliaMap() {
    var root = $('.amap');
    if (!root) return;
    var svg = $('.amap-svg', root), frame = $('.amap-frame', root);
    var pop = $('.amap-pop', root), body = $('.amap-pop-body', pop), closeBtn = $('.amap-pop-close', pop);
    var sites = {}, cards = {}, shown = null, pinned = false, returnFocus = null, queued = false, lastX = 0, lastY = 0;
    var sheetMq = window.matchMedia ? window.matchMedia('(max-width: 640px)') : { matches: false };
    $$('.amap-site', svg).forEach(function (g) { sites[g.getAttribute('data-site')] = g; });
    $$('.amap-card', root).forEach(function (c) { cards[c.getAttribute('data-site')] = c; });

    function fill(id) {
      if (shown === id) return;
      var card = cards[id];
      body.textContent = '';
      Array.prototype.forEach.call(card.childNodes, function (n) { body.appendChild(n.cloneNode(true)); });
      var h = $('.amap-c-name', body); if (h) h.id = 'amap-pop-h';
      pop.className = 'amap-pop ' + ((card.className.match(/\bc-\w+/) || [''])[0]);
      if (shown && sites[shown]) sites[shown].classList.remove('is-active');
      sites[id].classList.add('is-active');
      shown = id;
    }
    /* x, y: viewport point to sit beside; flips left/up near the screen edges, like placePanel() */
    function place(x, y) {
      if (pop.classList.contains('is-sheet')) return;
      var fr = frame.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, gap = 16, m = 8;
      var head = topBar(), topLimit = (head ? head.getBoundingClientRect().bottom : 0) + m;
      var left = x + gap;
      if (left + w > window.innerWidth - m) left = x - w - gap;
      left = Math.max(m, Math.min(left, window.innerWidth - w - m));
      var top = y + gap;
      if (top + h > window.innerHeight - m) top = Math.max(topLimit, y - h - gap);
      pop.style.left = (left - fr.left) + 'px';
      pop.style.top = (top - fr.top) + 'px';
    }
    function hide() {
      pop.hidden = true;
      pop.classList.remove('is-pinned', 'is-sheet');
      if (shown && sites[shown]) sites[shown].classList.remove('is-active');
      shown = null; pinned = false;
    }
    function hover(id, x, y) {
      if (pinned) return;
      fill(id);
      pop.hidden = false;
      place(x, y);
    }
    function pin(id, x, y) {
      fill(id);
      pinned = true;
      pop.hidden = false;
      pop.classList.add('is-pinned');
      pop.classList.toggle('is-sheet', sheetMq.matches);
      if (x == null) { var r = sites[id].getBoundingClientRect(); x = r.right; y = r.top + r.height / 2; }
      place(x, y);
      if (pop.classList.contains('is-sheet')) requestAnimationFrame(function () { keepAboveSheet(id); });
    }
    /* Phones: the docked card covers the lower part of the screen, so scroll the chosen place above it */
    function keepAboveSheet(id) {
      var r = sites[id].querySelector('.amap-dot').getBoundingClientRect(), sheetTop = pop.getBoundingClientRect().top;
      var head = topBar(), top = head ? head.getBoundingClientRect().bottom : 0;
      if (r.top > top + 12 && r.bottom < sheetTop - 12) return;
      window.scrollBy({ top: (r.top + r.bottom) / 2 - (top + sheetTop) / 2, behavior: 'auto' });
    }
    function close() {
      var back = returnFocus;
      hide();
      returnFocus = null;
      if (back && back.focus) back.focus();
    }
    function siteAt(e) {
      var g = e.target.closest && e.target.closest('.amap-site');
      if (g) return g.getAttribute('data-site');
      /* Taps between markers (small on phones): the nearest place within reach */
      var best = null, bestD = 24;
      Object.keys(sites).forEach(function (id) {
        var r = sites[id].querySelector('.amap-dot').getBoundingClientRect();
        var d = Math.sqrt(Math.pow(r.left + r.width / 2 - e.clientX, 2) + Math.pow(r.top + r.height / 2 - e.clientY, 2));
        if (d < bestD) { best = id; bestD = d; }
      });
      return best;
    }

    svg.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var g = e.target.closest('.amap-site');
      if (g) hover(g.getAttribute('data-site'), e.clientX, e.clientY);
    });
    svg.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || pinned || !shown) return;
      lastX = e.clientX; lastY = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; if (!pinned && shown) place(lastX, lastY); });
    });
    svg.addEventListener('pointerout', function (e) {
      if (e.pointerType !== 'mouse' || pinned) return;
      var from = e.target.closest('.amap-site'), to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('.amap-site') : null;
      if (from && from !== to) hide();
    });
    svg.addEventListener('click', function (e) {
      var id = siteAt(e);
      if (!id) { if (pinned) close(); return; }
      if (pinned && shown === id) { close(); return; }
      returnFocus = sites[id];
      pin(id, e.clientX, e.clientY);
    });
    svg.addEventListener('keydown', function (e) {
      var g = e.target.closest && e.target.closest('.amap-site');
      if (!g || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      returnFocus = g;
      pin(g.getAttribute('data-site'));
      closeBtn.focus();
    });
    /* the small group list in the map's corner: pointing at a group lights up its places and dims the rest;
       a click (or tap) keeps it lit until clicked again */
    var legend = $$('.amap-lg', root), held = null;
    function light(cat) {
      Object.keys(sites).forEach(function (k) { sites[k].classList.toggle('is-lit', !!cat && sites[k].classList.contains('c-' + cat)); });
      svg.classList.toggle('has-lit', !!cat);
      legend.forEach(function (b) { b.classList.toggle('is-lit', b.getAttribute('data-cat') === cat); });
    }
    legend.forEach(function (b) {
      var cat = b.getAttribute('data-cat');
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('mouseenter', function () { light(cat); });
      b.addEventListener('focus', function () { light(cat); });
      b.addEventListener('mouseleave', function () { light(held); });
      b.addEventListener('blur', function () { light(held); });
      b.addEventListener('click', function () {
        held = held === cat ? null : cat;
        legend.forEach(function (o) { o.setAttribute('aria-pressed', String(o.getAttribute('data-cat') === held)); });
        light(held);
      });
    });
    closeBtn.addEventListener('click', close);
    pop.addEventListener('click', function (e) { if (e.target.closest('.amap-c-more')) hide(); });
    document.addEventListener('click', function (e) {
      if (pinned && !pop.contains(e.target) && !svg.contains(e.target)) hide();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) close(); });
    window.addEventListener('resize', function () { if (!pop.hidden) hide(); });
  }

  /* ---------------------------------------------------------------
     10b. Rosary tracker: walks a five-decade Rosary prayer by prayer
          over the 59-bead SVG from build.ps1 (Rosary-Svg). One step is
          one prayer, so a bead can hold several steps: the large bead
          between two decades carries the Glory Be and Fatima Prayer
          closing one decade, then the Our Father opening the next.
     --------------------------------------------------------------- */
  var RT_TEXT = {
    tr: {
      opening: 'Giriş', closing: 'Kapanış', today: 'bugün',
      decade: function (d) { return d + '. Gizem'; }, endOf: function (d) { return d + '. onluğun sonu'; },
      ord: ['Birinci Gizem', 'İkinci Gizem', 'Üçüncü Gizem', 'Dördüncü Gizem', 'Beşinci Gizem'],
      announce: 'Gizemi anın', intentions: ['İman için', 'Umut için', 'Sevgi için'],
      doneTitle: 'Tesbih tamamlandı', doneText: 'Beş onluğun hepsini tamamladınız. Dualarınız kabul olsun.',
      next: 'Sonraki', finish: 'Bitir', again: 'Yeniden başla', hide: 'Dua metnini gizle', show: 'Dua metnini göster',
      resumed: 'Kaldığınız yerden devam ediyorsunuz.',
      more: 'Tesbih hakkında', close: 'Kapat', tapHint: 'Ekrana dokunun: sağ ileri, sol geri',
      loadFail: 'Dualar yüklenemedi. Lütfen sayfayı yenileyin.',
      beadsLabel: 'Tesbih', finishes: { wood: 'Zeytin ağacı', pearl: 'İnci', lapis: 'Lapis' },
      welcomeK: 'Meryem Ana Tesbih Duası', welcomeH: 'Hoş geldiniz',
      welcomeP: 'Tesbih, Meryem Ana ile birlikte İsa’nın hayatını düşünerek dua etmektir. Her gizemde hayatından bir sahneye bakarak dua edeceksiniz; bütün tesbih yaklaşık yirmi dakika sürer.',
      todayIs: 'Bugünün gizemleri:', begin: 'Duaya başla',
      welcomeN: 'Sağ ok tuşuyla ya da ileri düğmesiyle ilerleyin; bir taneye tıklayarak oraya geçin.',
      full: 'Tam ekran', fullExit: 'Tam ekrandan çık', strand: 'Tesbih taneleri: bir taneye geçmek için tıklayın ya da sürükleyin'
    },
    en: {
      opening: 'Opening', closing: 'Closing', today: 'today',
      decade: function (d) { return 'Mystery ' + d; }, endOf: function (d) { return 'End of decade ' + d; },
      ord: ['First Mystery', 'Second Mystery', 'Third Mystery', 'Fourth Mystery', 'Fifth Mystery'],
      announce: 'Announce the mystery', intentions: ['For faith', 'For hope', 'For charity'],
      doneTitle: 'Rosary complete', doneText: 'You have prayed all five decades. May your prayers be heard.',
      next: 'Next', finish: 'Finish', again: 'Pray again', hide: 'Hide prayer text', show: 'Show prayer text',
      resumed: 'Picking up where you left off.',
      more: 'About the Rosary', close: 'Close', tapHint: 'Tap the screen: right for next, left for back',
      loadFail: 'The prayers could not be loaded. Please reload the page.',
      beadsLabel: 'Beads', finishes: { wood: 'Olive wood', pearl: 'Pearl', lapis: 'Lapis' },
      welcomeK: 'The Holy Rosary', welcomeH: 'Welcome',
      welcomeP: 'The Rosary is the life of Jesus seen through the eyes of his mother. At each mystery you pray looking at a moment from his life; the whole Rosary takes about twenty minutes.',
      todayIs: 'Today’s mysteries:', begin: 'Begin the Rosary',
      welcomeN: 'Go on with the right arrow key or the next button; click a bead to go to it.',
      full: 'Full screen', fullExit: 'Exit full screen', strand: 'Rosary beads: click a bead or drag the strand to move'
    }
  };
  function rosarySteps() {
    var s = [];
    function add(el, p, extra) { var o = { el: el, p: p }; for (var k in extra) o[k] = extra[k]; s.push(o); }
    add('crucifix', 'hac-isareti', { phase: 'open' });
    add('crucifix', 'iman-aciklamasi', { phase: 'open' });
    add('intro-bead-1', 'goklerdeki-pederimiz', { phase: 'open' });
    for (var i = 1; i <= 3; i++) add('intro-bead-' + (i + 1), 'selam-sana-meryem', { phase: 'open', n: i, of: 3, intent: i - 1 });
    add('intro-bead-5', 'pedere-san', { phase: 'open' });
    for (var d = 1; d <= 5; d++) {
      var ofBead = d === 1 ? 'intro-bead-5' : 'decade-' + d + '-our-father';
      if (d > 1) {
        add(ofBead, 'pedere-san', { phase: 'end', decade: d - 1 });
        add(ofBead, 'fatima-duasi', { phase: 'end', decade: d - 1 });
      }
      add(ofBead, 'goklerdeki-pederimiz', { phase: 'decade', decade: d, announce: true });
      for (var k = 1; k <= 10; k++) add('decade-' + d + '-bead-' + k, 'selam-sana-meryem', { phase: 'decade', decade: d, n: k, of: 10 });
    }
    add('centerpiece', 'pedere-san', { phase: 'end', decade: 5 });
    add('centerpiece', 'fatima-duasi', { phase: 'end', decade: 5 });
    add('centerpiece', 'selam-sana-kralice', { phase: 'close' });
    add('centerpiece', 'bitiris-duasi', { phase: 'close' });
    add('crucifix', 'hac-isareti', { phase: 'close' });
    return s;
  }
  function initRosaryTracker() {
    var root = $('.rt');
    if (!root) return;
    var T = RT_TEXT[LANG];
    var svg = $('.rt-svg', root), sheet = $('.rt-sheet', root), select = $('#rt-set', root);
    var halo = $('.rt-halo', root);
    var ui = {
      context: $('.rt-context', sheet), myst: $('.rt-mystery', sheet), mLabel: $('.rt-m-label', sheet), mTitle: $('.rt-m-title', sheet),
      title: $('.rt-title', sheet), text: $('.rt-text', sheet), prev: $('.rt-prev', sheet), next: $('.rt-next', sheet),
       bar: $('.rt-progress span', sheet), live: $('.rt-live', sheet), grip: $('.rt-grip', sheet),
      resume: $('.rt-resume', sheet),
      center: $('.rt-center', root), cSet: $('.rt-c-set', root), cCount: $('.rt-c-count', root), cMyst: $('.rt-c-myst', root)
    };
    var steps = rosarySteps(), idx = 0, done = false, prayers = {}, sets = {}, firstSet = null, lastCenter = '';
    var beads = {}, stepsFor = {}, hits = [];
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var narrow = /** @type {MediaQueryList} */ (window.matchMedia ? window.matchMedia('(max-width: 899.98px)') : { matches: true });

    /* Phones: the Rosary as one still screen that never scrolls. The painting of the mystery
       above (bars over it for the five decades), the prayer below with the beads of this part
       of the rosary; a tap on the right of the screen goes on, on the left goes back. The rest
       of the page waits in a sheet behind the ⋯ button. */
    var ph = { on: false, art: null, img: null, segs: [], dots: null, more: null, moved: [], artKey: '', top: null };
    var DOT_GROUPS = {
      open: ['crucifix', 'intro-bead-1', 'intro-bead-2', 'intro-bead-3', 'intro-bead-4', 'intro-bead-5'],
      close: ['centerpiece', 'crucifix']
    };
    function phoneBuild() {
      if (ph.art) return;
      var art = document.createElement('div');
      art.className = 'rt-art';
      art.innerHTML = '<img class="rt-art-img" alt="" decoding="async"><div class="rt-segs" aria-hidden="true"></div>' +
        '<div class="rt-art-t" aria-hidden="true"><p class="rt-art-k"></p><p class="rt-art-m"></p><p class="rt-art-c"></p></div>';
      var segBox = $('.rt-segs', art);
      for (var i = 0; i < 7; i++) {
        var sg = document.createElement('span'); sg.appendChild(document.createElement('i'));
        if (i === 0 || i === 6) sg.className = 'sm';
        segBox.appendChild(sg); ph.segs.push(sg.firstChild);
      }
      ph.art = art; ph.img = $('.rt-art-img', art);
      ph.k = $('.rt-art-k', art); ph.m = $('.rt-art-m', art); ph.c = $('.rt-art-c', art);
      ph.dots = document.createElement('div'); ph.dots.className = 'rt-dots'; ph.dots.setAttribute('aria-hidden', 'true');
      ph.hint = document.createElement('p'); ph.hint.className = 'rt-hint'; ph.hint.setAttribute('aria-hidden', 'true'); ph.hint.textContent = T.tapHint;
      ph.nextL = document.createElement('span'); ph.nextL.className = 'rt-next-l'; ph.nextL.setAttribute('aria-hidden', 'true');
      var mb = document.createElement('button');
      mb.type = 'button'; mb.className = 'rt-more-btn'; mb.setAttribute('aria-label', T.more); mb.setAttribute('aria-haspopup', 'dialog');
      mb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>';
      ph.moreBtn = mb;
      var dlg = document.createElement('dialog');
      dlg.className = 'rt-more'; dlg.setAttribute('aria-labelledby', 'rt-more-t');
      dlg.innerHTML = '<div class="rt-more-head"><p class="rt-more-t" id="rt-more-t"></p><button type="button" class="rt-more-x"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="rt-more-body"></div>';
      $('.rt-more-t', dlg).textContent = T.more;
      $('.rt-more-x', dlg).setAttribute('aria-label', T.close);
      document.body.appendChild(dlg);
      ph.more = dlg;
      mb.addEventListener('click', function () { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); });
      $('.rt-more-x', dlg).addEventListener('click', function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg && dlg.close) dlg.close(); });
      /* a link inside the sheet to a place on this page (a mystery card) closes it first */
      dlg.addEventListener('click', function (e) { if (e.target.closest('a[href^="#"]') && dlg.close) dlg.close(); });
    }
    function phoneTop() {
      var nav = document.documentElement.classList.contains('av') && $('.av-nav');
      root.style.setProperty('--rt-top', (nav ? Math.round(nav.getBoundingClientRect().bottom) : 0) + 'px');
    }
    function phoneOn() {
      phoneBuild();
      ph.on = true;
      document.documentElement.classList.add('rt-phone');
      root.insertBefore(ph.art, root.firstChild);
      $('.rt-bar', root).appendChild(ph.moreBtn);
      sheet.insertBefore(ph.dots, ui.context);
      sheet.appendChild(ph.hint);
      ui.next.appendChild(ph.nextL);
      /* everything after the rosary goes into the sheet, in order */
      var body = $('.rt-more-body', ph.more), n = root.nextSibling;
      while (n) { var nx = n.nextSibling; ph.moved.push(n); body.appendChild(n); n = nx; }
      phoneTop();
      window.scrollTo(0, 0);
    }
    function phoneOff() {
      ph.on = false;
      document.documentElement.classList.remove('rt-phone', 'rt-long');
      [ph.art, ph.moreBtn, ph.dots, ph.hint, ph.nextL].forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      if (ph.more.open && ph.more.close) ph.more.close();
      var at = root.nextSibling;
      ph.moved.forEach(function (el) { root.parentNode.insertBefore(el, at); });
      ph.moved = [];
      ui.text.style.fontSize = '';
      ui.text.classList.remove('is-scroll');
    }
    function segOf(st) { return st.phase === 'open' ? 0 : st.phase === 'close' ? 6 : st.decade; }
    function beadDots(box, st) {
      var ids, cur = -1, endOn = false;
      if (done || st.phase === 'close') ids = DOT_GROUPS.close;
      else if (st.phase === 'open') ids = DOT_GROUPS.open;
      else {
        var d = st.decade, of = d === 1 ? 'intro-bead-5' : 'decade-' + d + '-our-father';
        ids = [of]; for (var k = 1; k <= 10; k++) ids.push('decade-' + d + '-bead-' + k);
        ids.push('end');
        endOn = st.phase === 'end';
      }
      if (done) cur = ids.length;
      else if (endOn) cur = ids.length - 1;
      else ids.forEach(function (id, i) { if (id === st.el && cur < 0) cur = i; });
      /* the closing prayers: the medal holds four of them, the cross the last */
      if (!done && st.phase === 'close' && st.el === 'crucifix') cur = 1;
      box.textContent = '';
      ids.forEach(function (id, i) {
        var b = document.createElement('i');
        var kind = id === 'crucifix' ? 'cross' : id === 'centerpiece' ? 'medal' : id === 'end' ? 'end' : /our-father|intro-bead-(1|5)$/.test(id) ? 'big' : '';
        b.className = (kind ? kind + ' ' : '') + (i < cur ? 'done' : i === cur ? 'cur' : '');
        box.appendChild(b);
      });
    }
    function phoneRender(st) {
      if (!ph.on) return;
      var data = window.COMPENDIUM_ROSARY;
      /* the bars: one per decade, a short one for the opening and the closing prayers */
      var cnt = [0, 0, 0, 0, 0, 0, 0], pos = [0, 0, 0, 0, 0, 0, 0];
      steps.forEach(function (x, i) { var g = segOf(x); cnt[g]++; if (done || i < idx) pos[g]++; });
      var curSeg = done ? 7 : segOf(st);
      ph.segs.forEach(function (bar, g) {
        var f = g < curSeg ? 1 : g > curSeg ? 0 : (pos[g] + 1) / cnt[g];
        bar.style.width = Math.round(f * 100) + '%';
      });
      /* the painting: the mystery's own, the opening and closing their own (data/tespih.js "art",
         credited from data/tablolar.json) */
      var key = data && (!done && st.decade ? currentSet().items[st.decade - 1].art : data.artOpen);
      var a = key && data.art[key] ? data.art[key] : null;
      if (a && key !== ph.artKey) {
        ph.artKey = key;
        ph.img.src = 'assets/art/' + a.f + '.jpg';
        ph.img.style.objectPosition = '50% ' + a.y + '%';
        ph.art.classList.remove('is-fresh'); void ph.art.offsetWidth; ph.art.classList.add('is-fresh');
        /* the next decade's painting, ready before it is needed */
        if (st && st.decade && st.decade < 5) {
          var nk = currentSet().items[st.decade].art;
          if (data.art[nk]) { var pre = new Image(); pre.src = 'assets/art/' + data.art[nk].f + '.jpg'; }
        }
      }
      if (a) ph.c.textContent = (LANG === 'en' ? a.ae + ' · ' + a.te : a.a + ' · ' + a.t);
      if (done) { ph.k.textContent = T.closing; ph.m.textContent = T.doneTitle; }
      else if (st.decade) {
        ph.k.textContent = (st.announce ? T.announce + ' · ' : '') + T.ord[st.decade - 1];
        ph.m.textContent = mysteryName(st.decade);
      } else { ph.k.textContent = st.phase === 'open' ? T.opening : T.closing; ph.m.textContent = setName(); }
      ph.art.classList.toggle('is-announce', !!(st && st.announce));
      beadDots(ph.dots, st);
      ph.nextL.textContent = ui.next.getAttribute('aria-label');
      phoneFit();
    }
    /* the prayer fits the space it has: the type steps down from 20px (never below 15px); for the longest
       prayers the painting steps back; only if that is still not enough does the text scroll,
       inside its card, never the page */
    function phoneFit() {
      if (!ph.on) return;
      var el = ui.text, html = document.documentElement;
      var fits = function () {
        for (var px = 20; px >= 15; px -= .5) { el.style.fontSize = px + 'px'; if (el.scrollHeight <= el.clientHeight + 1) return true; }
        return false;
      };
      el.classList.remove('is-scroll');
      html.classList.remove('rt-long');
      if (fits()) return;
      html.classList.add('rt-long');
      if (!fits()) el.classList.add('is-scroll');
    }

    /* Desktop: the mystery's painting fills the screen, the prayer on a soft panel over it and the
       whole rosary in 3D along the foot (assets/vendor/rosary3d.js, built from tools/rosary3d/),
       the bead being prayed lit and lifted. Without WebGL a row of dots stands in for the beads. */
    var dk = { on: false, el: null, bg: [], img: [], cap: null, cv: null, dots: null, strand: null, front: 0, artKey: '', tools: null };
    var FINISH_KEY = 'kkio-rosary-finish';
    /* a clicked bead: its step nearest the one being prayed; the glowing bead itself goes on */
    function stepOfBead(id) {
      var list = stepsFor[id], cur = done ? steps.length : idx;
      if (!list) return -1;
      var pick = list[0];
      list.forEach(function (i) { if (Math.abs(i - cur) < Math.abs(pick - cur)) pick = i; });
      return pick;
    }
    function savedFinish() { try { return localStorage.getItem(FINISH_KEY) || 'wood'; } catch (e) { return 'wood'; } }
    function dkBuild() {
      if (dk.el) return;
      var el = document.createElement('div');
      el.className = 'rt-dk';
      el.innerHTML = '<figure class="rt-dk-paint"><img alt="" decoding="async"><img alt="" decoding="async"><figcaption></figcaption></figure>' +
        '<canvas class="rt-dk-strand" role="img"></canvas><div class="rt-dots rt-dk-dots" aria-hidden="true" hidden></div>' +
        '<div class="rt-dk-welcome" hidden><p class="rt-dk-wk"></p><h3 class="rt-dk-wh"></h3><p class="rt-dk-wp"></p>' +
        '<p class="rt-dk-wt"></p><button type="button" class="rt-dk-go"></button><p class="rt-dk-wn"></p></div>' +
        '<div class="rt-dk-tools"><div class="rt-dk-finish" role="group"></div>' +
        '<button type="button" class="rt-dk-full"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button></div>';
      dk.el = el;
      dk.img = $$('.rt-dk-paint img', el); dk.welcome = $('.rt-dk-welcome', el);
      dk.cap = $('figcaption', el); dk.cv = $('canvas', el); dk.dots = $('.rt-dk-dots', el);
      dk.cv.setAttribute('aria-label', T.strand);
      var fin = $('.rt-dk-finish', el), cur = savedFinish();
      fin.setAttribute('aria-label', T.beadsLabel);
      ['wood', 'pearl', 'lapis'].forEach(function (f) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'rt-fin rt-fin-' + f; b.setAttribute('data-finish', f);
        b.setAttribute('aria-pressed', String(f === cur)); b.title = T.finishes[f];
        b.innerHTML = '<i aria-hidden="true"></i><span class="visually-hidden"></span>';
        $('span', b).textContent = T.finishes[f];
        fin.appendChild(b);
      });
      fin.addEventListener('click', function (e) {
        var b = e.target.closest('[data-finish]'); if (!b) return;
        var f = b.getAttribute('data-finish');
        $$('[data-finish]', fin).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        try { localStorage.setItem(FINISH_KEY, f); } catch (er) { /* private mode */ }
        if (dk.strand) dk.strand.setFinish(f);
      });
      $('.rt-dk-go', el).addEventListener('click', function () {
        dkWelcome(false);
        try { ui.next.focus({ preventScroll: true }); } catch (e) { ui.next.focus(); }
      });
      var full = $('.rt-dk-full', el);
      full.addEventListener('click', function () {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (root.requestFullscreen) root.requestFullscreen().catch(function () { /* refused */ });
      });
      var fullLabel = function () {
        var l = document.fullscreenElement ? T.fullExit : T.full;
        full.setAttribute('aria-label', l); full.title = l;
        if (dk.on) dkSize();
      };
      document.addEventListener('fullscreenchange', fullLabel); fullLabel();
      if (!root.requestFullscreen) full.hidden = true;
      dkStrand();
    }
    function dkStrand() {
      var gl = null;
      try { gl = dk.cv.getContext('webgl2'); } catch (e) { gl = null; }
      /* the 3D module makes its own context on the canvas: hand over a fresh one */
      if (!gl || !window.ResizeObserver) { dkNoGl(); return; }
      var fresh = dk.cv.cloneNode(false); dk.cv.parentNode.replaceChild(fresh, dk.cv); dk.cv = fresh;
      import(new URL(dataUrl('assets/vendor/rosary3d.js'), document.baseURI).href).then(function (m) {
        dk.strand = m.createRosary(dk.cv, {
          still: reduceMotion,
          onPick: function (id) {
            if (!done && steps[idx].el === id) { next(); return; }
            var i = stepOfBead(id); if (i >= 0) goTo(i, 50);
          }
        });
        dk.strand.setFinish(savedFinish());
        dk.strand.goTo(done ? null : steps[idx].el, true);
      })['catch'](dkNoGl);
    }
    function dkNoGl() {
      dk.cv.hidden = true; dk.dots.hidden = false;
      $('.rt-dk-finish', dk.el).hidden = true;
      dk.strand = null;
      if (firstSet) render(false);
    }
    /* the section fills the window below the site's bar, edge to edge */
    function dkSize() {
      if (!dk.on) return;
      root.style.removeProperty('--dk-pull');
      var bar = topBar(), barH = bar && !document.fullscreenElement ? Math.round(bar.getBoundingClientRect().height) : 0;
      var docTop = root.getBoundingClientRect().top + window.scrollY;
      root.style.setProperty('--dk-bar', barH + 'px');
      root.style.setProperty('--dk-pull', Math.min(0, barH - docTop) + 'px');
      /* the window's width without its scroll bar; CSS centres the section on it */
      root.style.setProperty('--dk-w', document.documentElement.clientWidth + 'px');
    }
    function dkOn() {
      dkBuild();
      dk.on = true;
      document.documentElement.classList.add('rt-desk');
      root.insertBefore(dk.el, root.firstChild);
      sheet.insertBefore($('.rt-bar', root), sheet.firstChild);
      sheet.appendChild($('.rt-dk-tools', dk.el));
      dkSize();
    }
    function dkOff() {
      dk.on = false;
      dkWelcome(false);
      document.documentElement.classList.remove('rt-desk');
      if (document.fullscreenElement) document.exitFullscreen();
      dk.el.appendChild($('.rt-dk-tools', sheet));
      root.insertBefore($('.rt-bar', sheet), root.firstChild.nextSibling);
      if (dk.el.parentNode) dk.el.parentNode.removeChild(dk.el);
    }
    /* a painting crossfades in over the last, filling the screen; "hd" in data/tespih.js: the
       large painting for wide screens, in two sizes, and the point ("x", "y", in %) that stays in
       view when the screen's shape crops it */
    function dkArt(key) {
      var data = window.COMPENDIUM_ROSARY, a = data && data.art[key];
      if (!a || key === dk.artKey) return;
      dk.artKey = key;
      var h = a.hd, n = 1 - dk.front, img = dk.img[n], c = h || a;
      var show = function () {
        dk.front = n;
        dk.img.forEach(function (x, i) { x.classList.toggle('is-on', i === n); });
      };
      img.onload = show;
      if (h) {
        var box = img.parentNode.getBoundingClientRect();
        img.sizes = Math.max(320, Math.round(Math.max(box.width, box.height * h.w[1] / h.h))) + 'px';
        img.srcset = 'assets/art/' + h.f + '-1600.jpg ' + h.w[0] + 'w, assets/art/' + h.f + '-2560.jpg ' + h.w[1] + 'w';
        img.src = 'assets/art/' + h.f + '-1600.jpg';
        img.style.objectPosition = (h.x == null ? 50 : h.x) + '% ' + (h.y == null ? 40 : h.y) + '%';
      } else { img.removeAttribute('srcset'); img.src = 'assets/art/' + a.f + '.jpg'; img.style.objectPosition = '50% ' + a.y + '%'; }
      /* "p": "r" puts the prayer panel on the right, for a painting whose heart is at its left */
      root.classList.toggle('dk-right', !!(h && h.p === 'r'));
      dk.cap.textContent = LANG === 'en' ? (c.ae || c.a) + ' · ' + c.te : c.a + ' · ' + c.t;
      if (img.complete && img.naturalWidth) show();
    }
    /* the first screen: the opening painting and a word of welcome, until "Begin" (or a
       return visit the same day, which goes straight back to the prayer it left) */
    function dkWelcome(on) {
      dk.welcoming = on;
      dk.welcome.hidden = !on;
      root.classList.toggle('is-welcome', on);
      if (!on) return;
      $('.rt-dk-wk', dk.welcome).textContent = T.welcomeK;
      $('.rt-dk-wh', dk.welcome).textContent = T.welcomeH;
      $('.rt-dk-wp', dk.welcome).textContent = T.welcomeP;
      $('.rt-dk-wt', dk.welcome).textContent = T.todayIs + ' ' + setName();
      $('.rt-dk-go', dk.welcome).textContent = T.begin;
      $('.rt-dk-wn', dk.welcome).textContent = T.welcomeN;
    }
    function dkRender(st) {
      if (!dk.on) return;
      var data = window.COMPENDIUM_ROSARY;
      if (data) dkArt(!done && st.decade ? currentSet().items[st.decade - 1].art : data.artOpen);
      /* the next decade's painting, ready before it is needed */
      if (data && st && st.decade && st.decade < 5) {
        var nk = data.art[currentSet().items[st.decade].art];
        if (nk) { var pre = new Image(); pre.src = 'assets/art/' + (nk.hd ? nk.hd.f + '-1600' : nk.f) + '.jpg'; }
      }
      dk.el.classList.toggle('is-done', done);
      if (dk.welcoming) dkWelcome(true); // the set of mysteries may have changed
      if (dk.strand) {
        dk.strand.goTo(done ? null : steps[idx].el);
        if (done && !dk.wasDone) dk.strand.celebrate();
      }
      dk.wasDone = done;
      if (!dk.dots.hidden) beadDots(dk.dots, st);
    }

    $$('.bead', svg).forEach(function (b) {
      beads[b.id] = b;
      hits.push({
        id: b.id,
        x: parseFloat(b.getAttribute('cx') || b.getAttribute('data-cx')),
        y: parseFloat(b.getAttribute('cy') || b.getAttribute('data-cy')),
        r: parseFloat(b.getAttribute('r') || b.getAttribute('data-r'))
      });
    });
    steps.forEach(function (st, i) { (stepsFor[st.el] = stepsFor[st.el] || []).push(i); });
    if (narrow.matches) phoneOn(); else dkOn();
    var onScreen = function () {
      if (narrow.matches && !ph.on) { if (dk.on) dkOff(); phoneOn(); } else if (!narrow.matches && ph.on) { phoneOff(); dkOn(); }
      if (ph.on) phoneTop();
      if (firstSet) render(false);
    };
    if (narrow.addEventListener) narrow.addEventListener('change', onScreen); else if (narrow.addListener) narrow.addListener(onScreen);
    window.addEventListener('resize', function () { if (ph.on) { phoneTop(); phoneFit(); } if (dk.on) dkSize(); });

    /* Progress is kept in this browser only (localStorage), and only for the day it was
       prayed on: a new day starts fresh on that day's mysteries. */
    var SAVE_KEY = 'kkio-rosary';
    function dayStamp() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
    function saveProgress() {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ day: dayStamp(), set: select.value, idx: idx, done: done })); } catch (e) { /* private mode */ }
    }
    function savedProgress() {
      try {
        var s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
        if (s && s.day === dayStamp() && sets[s.set] && s.idx >= 0 && s.idx < steps.length) return s;
      } catch (e) { /* private mode or bad data */ }
      return null;
    }

    function currentSet() { return sets[select.value] || firstSet; }
    /* the sets' names in the list, in the language shown, today's marked */
    function nameOptions() {
      $$('option', select).forEach(function (o) {
        var st = sets[o.value]; if (!st) return;
        o.textContent = (LANG === 'en' ? st.en : st.tr) + (o.hasAttribute('data-today') ? ' (' + T.today + ')' : '');
      });
    }
    function setName() { var s = currentSet(); return LANG === 'en' ? s.en : s.tr; }
    function mysteryName(d) { var it = currentSet().items[d - 1]; return plain(LANG === 'en' ? it.en : it.tr); }
    function setText(el, text) {
      el.textContent = '';
      String(text || '').split(/\n{2,}/).forEach(function (para) {
        var p = document.createElement('p');
        /* The space before each <br> keeps words apart where CSS hides the breaks (phones) */
        para.split('\n').forEach(function (line, i) {
          if (i) { p.appendChild(document.createTextNode(' ')); p.appendChild(document.createElement('br')); }
          p.appendChild(document.createTextNode(line));
        });
        el.appendChild(p);
      });
    }
    function buzz(pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* unsupported */ } }

    function paintBeads(st) {
      var visited = {}, upto = done ? steps.length : idx;
      for (var i = 0; i < upto; i++) visited[steps[i].el] = true;
      Object.keys(beads).forEach(function (id) {
        var b = beads[id], state = st && st.el === id ? 'active' : (visited[id] ? 'prayed' : 'unprayed');
        if (!b.classList.contains(state)) { b.classList.remove('unprayed', 'active', 'prayed'); b.classList.add(state); }
        b.classList.toggle('announce', !!(st && st.el === id && st.announce));
      });
      svg.classList.toggle('is-complete', done);
      if (halo) {
        var on = st && !done && beads[st.el];
        halo.style.display = on ? '' : 'none';
        if (on) {
          var b = beads[st.el], g = b.tagName.toLowerCase() === 'g';
          var r = parseFloat(b.getAttribute(g ? 'data-r' : 'r'));
          halo.setAttribute('cx', b.getAttribute(g ? 'data-cx' : 'cx'));
          halo.setAttribute('cy', b.getAttribute(g ? 'data-cy' : 'cy'));
          halo.setAttribute('r', String(Math.round(r * (g ? 1.35 : 2.9))));
        }
      }
    }
    function paintCenter(st) {
      ui.cSet.textContent = setName();
      ui.cCount.textContent = '';
      if (st && st.n) {
        ui.cCount.appendChild(document.createTextNode(String(st.n)));
        var small = document.createElement('small'); small.textContent = '/' + st.of; ui.cCount.appendChild(small);
      }
      var key;
      ui.cMyst.textContent = '';
      if (done) { key = 'done'; ui.cMyst.textContent = T.doneTitle; }
      else if (st.decade) {
        key = setName() + st.decade;
        var strong = document.createElement('strong'); strong.textContent = T.ord[st.decade - 1];
        ui.cMyst.appendChild(strong); ui.cMyst.appendChild(document.createTextNode(mysteryName(st.decade)));
      } else { key = st.phase; ui.cMyst.textContent = st.phase === 'open' ? T.opening : T.closing; }
      if (key !== lastCenter) {
        ui.center.classList.remove('is-fresh');
        void ui.center.offsetWidth; // restart the fade-in for the new mystery
        ui.center.classList.add('is-fresh');
        lastCenter = key;
      }
    }
    function render(user) {
      var st = done ? null : steps[idx];
      paintBeads(st);
      paintCenter(st);
      sheet.classList.toggle('is-done', done);
      if (done) {
        ui.context.textContent = T.closing;
        ui.myst.hidden = true;
        ui.title.textContent = T.doneTitle;
        setText(ui.text, T.doneText);
        ui.prev.disabled = false;
        ui.next.setAttribute('aria-label', T.again); ui.next.title = T.again;
        ui.bar.style.width = '100%';
        ui.live.textContent = T.doneTitle;
      } else {
        var p = prayers[st.p][LANG], ctx;
        if (st.phase === 'open') ctx = T.opening + (st.n ? ' · ' + T.intentions[st.intent] + ' · ' + st.n + '/' + st.of : '');
        else if (st.phase === 'decade') ctx = T.decade(st.decade) + (st.n ? ' · ' + st.n + '/' + st.of : '');
        else if (st.phase === 'end') ctx = T.endOf(st.decade);
        else ctx = T.closing;
        ui.context.textContent = ctx;
        if (st.decade) {
          ui.myst.hidden = false;
          ui.myst.classList.toggle('is-announce', !!st.announce);
          ui.mLabel.textContent = st.announce ? T.announce : '';
          ui.mTitle.textContent = T.ord[st.decade - 1] + ': ' + mysteryName(st.decade);
        } else {
          ui.myst.hidden = true;
          ui.myst.classList.remove('is-announce');
        }
        ui.title.textContent = p.title;
        setText(ui.text, p.text);
        ui.text.scrollTop = 0;
        ui.prev.disabled = idx === 0;
        var nl = idx === steps.length - 1 ? T.finish : T.next; ui.next.setAttribute('aria-label', nl); ui.next.title = nl;
        ui.bar.style.width = (idx / steps.length * 100) + '%';
        ui.live.textContent = p.title + ', ' + ctx + (st.announce ? ', ' + ui.mTitle.textContent : '');
      }
      if (user) ui.resume.hidden = true;
      phoneRender(st);
      dkRender(st);
      saveProgress();
      if (user) keepVisible();
    }

    /* Keep the active bead on screen, between the sticky header and (on phones) the docked
       sheet: the whole rosary when it fits there, otherwise the bead centred. */
    function keepVisible() {
      if (done || ph.on || dk.on) return;
      var b = beads[steps[idx].el];
      if (!b) return;
      var r = b.getBoundingClientRect(), head = topBar();
      var top = head ? head.getBoundingClientRect().bottom : 0, bottom = window.innerHeight, pad = 14;
      if (narrow.matches) { var sr = sheet.getBoundingClientRect(); if (sr.top > top && sr.top < bottom) bottom = sr.top; }
      if (r.top >= top + pad && r.bottom <= bottom - pad) return;
      var stage = svg.getBoundingClientRect();
      var delta = stage.height <= bottom - top - 2 * pad ? stage.top - top - pad : (r.top + r.bottom) / 2 - (top + bottom) / 2;
      window.scrollBy({ top: delta, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    function goTo(i, pattern) {
      done = false;
      idx = Math.max(0, Math.min(steps.length - 1, i));
      render(true);
      buzz(steps[idx].announce ? [40, 60, 40] : pattern);
    }
    function next() {
      if (dk.welcoming) { dkWelcome(false); return; }
      if (done) { goTo(0, 50); return; }
      if (idx === steps.length - 1) { done = true; render(true); buzz([60, 80, 60, 80, 120]); return; }
      goTo(idx + 1, 50);
    }
    function prev() {
      if (done) { done = false; render(true); buzz(30); return; }
      if (idx > 0) goTo(idx - 1, 30);
    }

    function wire() {
      ui.next.addEventListener('click', next);
      ui.prev.addEventListener('click', prev);
      $('.rt-restart', root).addEventListener('click', function () { goTo(0, 50); });
      select.addEventListener('change', function () { render(false); });
      ui.grip.addEventListener('click', function () {
        var collapsed = sheet.classList.toggle('is-collapsed');
        ui.grip.setAttribute('aria-expanded', String(!collapsed));
        ui.grip.setAttribute('aria-label', collapsed ? T.show : T.hide);
      });
      /* phones: a tap on the prayer card, right two thirds forward, left third back; a swipe as on a
         book's page */
      sheet.addEventListener('click', function (e) {
        if (!ph.on || e.target.closest('button, a, select')) return;
        if (window.getSelection && String(window.getSelection()).length) return;
        var r = sheet.getBoundingClientRect();
        if (e.clientX - r.left < r.width / 3) prev(); else next();
      });
      var sx = null, sy = 0;
      root.addEventListener('touchstart', function (e) { if (ph.on && e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
      root.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
        sx = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); }
      }, { passive: true });
      /* desktop: the arrow keys turn the beads wherever the focus is, but not inside a field */
      document.addEventListener('keydown', function (e) {
        if (!dk.on || root.contains(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.target.closest && e.target.closest('input, select, textarea, [contenteditable]')) return;
        var r = root.getBoundingClientRect();
        if (r.bottom < window.innerHeight / 2 || r.top > window.innerHeight / 2) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      });
      root.addEventListener('keydown', function (e) {
        if (e.target === select || e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      });
      /* Beads sit closer together than a 44px touch target, so taps are resolved to the
         nearest bead within reach -- and the glowing bead always wins inside its own 44px
         circle, so the thumb can keep tapping it without precision. */
      svg.addEventListener('click', function (e) {
        var ctm = svg.getScreenCTM();
        if (!ctm) return;
        var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        var p = pt.matrixTransform(ctm.inverse()), scale = svg.getBoundingClientRect().width / 360;
        var activeId = done ? null : steps[idx].el, activeHit = null, best = null, bestD = Infinity;
        hits.forEach(function (h) {
          var d = Math.sqrt((h.x - p.x) * (h.x - p.x) + (h.y - p.y) * (h.y - p.y)) * scale;
          if (d > Math.max(22, h.r * scale + 8)) return;
          if (h.id === activeId) activeHit = h;
          if (d < bestD) { best = h; bestD = d; }
        });
        var hit = activeHit || best;
        if (!hit) return;
        if (hit.id === activeId) { next(); return; }
        var list = stepsFor[hit.id], cur = done ? steps.length : idx, pick = list[0];
        list.forEach(function (i) { if (Math.abs(i - cur) < Math.abs(pick - cur)) pick = i; });
        goTo(pick, 50);
      });
    }

    loadDataScript('data/tespih.js', 'COMPENDIUM_ROSARY').then(function () {
      var data = window.COMPENDIUM_ROSARY;
      data.prayers.forEach(function (p) { prayers[p.id] = p; });
      data.sets.forEach(function (s) { sets[s.id] = s; });
      firstSet = data.sets[0];
      var today = new Date().getDay();
      $$('option', select).forEach(function (o) {
        var days = (o.getAttribute('data-days') || '').split(',').map(Number);
        if (days.indexOf(today) !== -1) { o.setAttribute('data-today', '1'); select.value = o.value; }
      });
      nameOptions();
      var saved = savedProgress();
      if (saved) {
        select.value = saved.set; idx = saved.idx; done = !!saved.done;
        if (idx > 0 && !done) { ui.resume.textContent = T.resumed; ui.resume.hidden = false; }
      }
      wire();
      render(false);
      if (dk.on && idx === 0 && !done) dkWelcome(true);
    })['catch'](function () {
      ui.title.textContent = T.loadFail;
      ui.text.textContent = '';
      ui.next.disabled = true;
    });
  }

  /* ---------------------------------------------------------------
     11. Azizler: today's saint in the visitor's own local time zone,
         movable feasts (Easter and everything computed from it)
         grafted onto the fixed calendar, month scroll-spy, and hover
         panel for bios.
     --------------------------------------------------------------- */
  function initSaints() {
    var cal = $('.saints-cal');
    if (!cal) return;
    var chev = $('.saint-item summary .ico', cal), AZ_CHEV = chev ? chev.outerHTML : '';

    function localParts() {
      var d = new Date();
      return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    }
    function addDays(base, year, n) {
      var dt = new Date(Date.UTC(year, base.m - 1, base.d));
      dt.setUTCDate(dt.getUTCDate() + n);
      return { m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
    }

    /* month names as pair strings (Turkish, English) */
    var MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'].map(function (t, i) {
      return pmake(t, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i]);
    });
    var today = localParts();
    var easterThis = easterMD(today.year);
    var movableTodayCard = null;

    /* Resolve this year's movable feasts and graft each onto its fixed-calendar day */
    $$('.movable-card').forEach(function (card) {
      var offset = parseInt(card.getAttribute('data-offset'), 10);
      var date = addDays(easterThis, today.year, offset);
      var dateEl = $('[data-movable-date]', card);
      if (dateEl) pset(dateEl, pcat(' · ' + date.d + ' ', MONTHS[date.m - 1]));
      var isToday = date.m === today.month && date.d === today.day;
      if (isToday) movableTodayCard = card;
      var cell = $('.day-cell[data-m="' + date.m + '"][data-d="' + date.d + '"]');
      if (!cell) return;
      cell.classList.add('has-movable');
      if (cell.classList.contains('genel')) {
        cell.classList.remove('genel');
        var oldItem = $('.saint-item', cell);
        if (oldItem) oldItem.remove();
      }
      var wrap = $('.day-saints', cell);
      if (!wrap) { wrap = document.createElement('div'); wrap.className = 'day-saints'; cell.appendChild(wrap); }
      var h3 = $('h3', card), bio = $('.m-bio', card), rank = $('.m-rank', card);
      if (!h3 || !bio) return;
      /* the feast leads its day, and its rank becomes the day's when it is the higher one */
      var RK = ['rk-other', 'rk-optional', 'rk-memorial', 'rk-feast', 'rk-solemn', 'rk-hi'];
      var rk = card.getAttribute('data-rk') || 'rk-other', had = RK.filter(function (c) { return cell.classList.contains(c); })[0] || 'rk-other';
      if (RK.indexOf(rk) > RK.indexOf(had) || had === 'rk-other') {
        cell.classList.remove(had); cell.classList.add(rk);
        var dr = $('.day-rank', cell);
        if (!dr) { dr = document.createElement('span'); dr.className = 'day-rank label'; cell.insertBefore(dr, wrap); }
        if (rank) { var rc = rank.cloneNode(true); var md = $('.m-date', rc); if (md) md.remove(); dr.innerHTML = rc.innerHTML; }
      }
      var det = document.createElement('details');
      det.className = 'saint-item movable-item';
      det.innerHTML = '<summary><span class="s-name">' + h3.innerHTML + '</span>' + AZ_CHEV + '</summary><div class="saint-bio">' + bio.innerHTML + '</div>';
      wrap.insertBefore(det, wrap.firstChild);
      if (isToday) cell.classList.add('is-today');
    });
    if (!movableTodayCard) {
      var fixedToday = $('.day-cell[data-m="' + today.month + '"][data-d="' + today.day + '"]');
      if (fixedToday) fixedToday.classList.add('is-today');
    }

    /* Hero: today's saint(s), in full, above the fold */
    var dateLabel = $('[data-today-date]');
    if (dateLabel) pset(dateLabel, pcat(today.day + ' ', MONTHS[today.month - 1]));
    var body = $('[data-today-body]');
    if (body) {
      var source = movableTodayCard || $('.day-cell.is-today');
      var pieces = [];
      if (source) {
        var top20Id = !movableTodayCard && typeof TOP20_BY_DATE !== 'undefined' ? TOP20_BY_DATE[today.month + '-' + today.day] : null;
        var items = movableTodayCard ? [{ name: $('h3', source).innerHTML, title: '', bio: $('.m-bio', source).innerHTML }] :
          $$('.saint-item', source).map(function (it) {
            var t = $('.s-title', it);
            return { name: $('.s-name', it).innerHTML, title: t ? t.innerHTML : '', bio: $('.saint-bio', it).innerHTML };
          });
        items.forEach(function (it) {
          var moreSlug = top20Id || null;
          var more = moreSlug ? '<a class="today-more-link" href="' + siteHref(moreSlug + '.html') + '">' + LT('Devamını oku', 'Read more') + '<span class="visually-hidden">: ' + it.name.replace(/<[^>]*>/g, '') + '</span>' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></a>' : '';
          pieces.push('<div class="today-more"><span class="today-name">' + it.name + '</span>' +
            (it.title ? '<span class="today-title">' + it.title + '</span>' : '') +
            '<div class="today-bio">' + it.bio + '</div>' + more + '</div>');
        });
      }
      if (pieces.length) body.innerHTML = pieces.join('');
    }

    buildCalendar(cal, today, MONTHS);

    /* Month pills: without JS these are plain #ay-N anchors and every month shows, full
       year, scroll-to-jump. With JS, only one month shows at a time (today's, at first)
       and a pill click swaps which one instead of scrolling past the other eleven. */
    var pills = $$('.month-pills a');
    var months = $$('.month', cal);
    if (pills.length && months.length) {
      cal.classList.add('month-filter');
      var pillsNav = $('.month-pills');
      function showMonth(m) {
        months.forEach(function (sec) { sec.classList.toggle('is-shown', sec.getAttribute('data-month') === String(m)); });
        pills.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('data-month-link') === String(m)); });
      }
      pills.forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          showMonth(a.getAttribute('data-month-link'));
          if (pillsNav) pillsNav.scrollIntoView({ block: 'start', behavior: FINE ? 'smooth' : 'auto' });
        });
      });
      showMonth(today.month);
    }

    /* Desktop: hover a saint's name for a floating bio panel (reuses placePanel).
       Touch/no-hover: the native <details> disclosure handles it instead. */
    var panel = $('#saint-panel');
    if (panel && FINE) {
      cal.classList.add('fine-hover');
      var pinned = null;
      function fillPanel(item) {
        var name = $('.s-name', item), t = $('.s-title', item), bio = $('.saint-bio', item);
        panel.innerHTML = '<div class="info-inner"><span class="s-panel-name">' + (name ? name.innerHTML : '') + '</span>' +
          (t ? '<span class="s-panel-title">' + t.innerHTML + '</span>' : '') + (bio ? bio.innerHTML : '') + '</div>';
      }
      function openPanel(item, x, y) {
        fillPanel(item);
        panel.hidden = false;
        nextFrame(function () { panel.classList.add('open'); });
        if (x === undefined) { var r = item.getBoundingClientRect(); x = r.left; y = r.bottom - 8; }
        placePanel(panel, x, y);
      }
      function closePanel() {
        panel.classList.remove('open', 'pinned');
        setTimeout(function () { if (!panel.classList.contains('open')) panel.hidden = true; }, 200);
        pinned = null;
      }
      cal.addEventListener('mouseover', function (e) {
        var summary = e.target.closest('.saint-item > summary');
        if (!summary || pinned) return;
        openPanel(summary.parentElement, e.clientX, e.clientY);
      });
      cal.addEventListener('mousemove', function (e) {
        if (pinned || !panel || panel.hidden) return;
        if (e.target.closest('.saints-cal') === cal) placePanel(panel, e.clientX, e.clientY);
      });
      cal.addEventListener('mouseout', function (e) {
        if (pinned) return;
        var leaving = e.target.closest('.saint-item > summary');
        if (leaving && !leaving.contains(e.relatedTarget)) closePanel();
      });
      cal.addEventListener('click', function (e) {
        var summary = e.target.closest('.saint-item > summary');
        if (!summary) return;
        e.preventDefault();
        var item = summary.parentElement;
        if (pinned === item) { closePanel(); return; }
        closePanel();
        pinned = item;
        openPanel(item);
        panel.classList.add('pinned');
      });
      document.addEventListener('click', function (e) {
        if (pinned && panel && !panel.contains(e.target) && !cal.contains(e.target)) closePanel();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });
    }
  }

  /* ---------------------------------------------------------------
     12. Kutsal Ayin: scroll-spy on the six part icons
     --------------------------------------------------------------- */
  function initMass() {
    var pills = $$('.mass-pills a');
    if (!pills.length) return;
    /* Each part's words fold beneath its explanation; opening one closes the others, so only
       one part's words are on screen at a time -- a plain accordion. */
    var parts = $$('.mass-text');
    parts.forEach(function (part) {
      part.addEventListener('toggle', function () {
        if (!part.open) return;
        parts.forEach(function (other) { if (other !== part) other.open = false; });
      });
    });
    if (!window.IntersectionObserver) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = en.target.getAttribute('data-part');
        pills.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('data-part-link') === n); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.mass-sec').forEach(function (sec) { obs.observe(sec); });
  }

  /* ---------------------------------------------------------------
     13. Home page: today's saint, lazy-loaded from its own data file
         (same pattern as search) only when the home page actually has
         the widget to fill.
     --------------------------------------------------------------- */
  function loadDataScript(src, globalName) {
    return new Promise(function (resolve, reject) {
      if (window[globalName]) return resolve();
      var s = document.createElement('script');
      s.src = dataUrl(src); s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  /* "M-D" -> the Top-20 saint page for every calendar day that honours one of
     them, so the home page's today's-saint links can go straight to that
     saint's own page instead of the general calendar. Hand-built from
     data/azizler.js and data/buyuk-azizler.js, since it's a fixed calendar
     fact, not something to recompute client-side. June 29 (Petrus and Pavlus
     together) is deliberately left out: it's one calendar entry for two
     people, so it falls back to the general azizler.html like any other day. */
  var TOP20_BY_DATE = {
    '1-1': 'meryem-ana', '1-28': 'aziz-thomas-aquinas',
    '2-11': 'meryem-ana',
    '3-17': 'aziz-patrick', '3-19': 'aziz-yusuf',
    '4-29': 'sienali-aziz-catharina',
    '5-1': 'aziz-yusuf', '5-13': 'meryem-ana', '5-24': 'meryem-ana', '5-31': 'meryem-ana',
    '6-13': 'padovali-aziz-antonius', '6-24': 'vaftizci-yahya',
    '7-11': 'aziz-benedictus', '7-16': 'meryem-ana', '7-31': 'aziz-ignatius-loyola',
    '8-15': 'meryem-ana', '8-22': 'meryem-ana', '8-28': 'aziz-augustinus', '8-29': 'vaftizci-yahya',
    '9-5': 'kalkutali-aziz-teresa', '9-8': 'meryem-ana', '9-12': 'meryem-ana', '9-15': 'meryem-ana',
    '9-23': 'padre-pio', '9-24': 'meryem-ana', '9-30': 'aziz-hieronymus',
    '10-1': 'lisieuxlu-kucuk-teresa', '10-4': 'assisili-aziz-francis', '10-7': 'meryem-ana',
    '10-15': 'avilali-aziz-teresa', '10-22': 'aziz-ii-yuhanna-pavlus',
    '11-21': 'meryem-ana',
    '12-8': 'meryem-ana', '12-10': 'meryem-ana', '12-12': 'meryem-ana', '12-27': 'havari-yuhanna'
  };
  /* Shared by the home page's "Saint of the Day" pill and the nav overlay's today-pill. */
  function getTodaySaint() {
    var todayDate = new Date();
    var today = { year: todayDate.getFullYear(), month: todayDate.getMonth() + 1, day: todayDate.getDate() };
    /* Just the names (data/azizler-adlar.js, a few KB written by the build), not the whole
       calendar with its biographies: this runs on the home page and in every page's menu */
    return loadDataScript('data/azizler-adlar.js', 'SAINT_NAMES').then(function () {
      var s = window.SAINT_NAMES[today.month + '-' + today.day];
      if (s) s = { name: s[0], nameEn: s[1] };
      var top20Id = TOP20_BY_DATE[today.month + '-' + today.day];
      var slug = top20Id || 'azizler';
      /* a saint without a page of their own: straight to today in the calendar, their life open */
      var href = siteHref(slug + '.html') + (top20Id ? '' : '#gun-' + today.month + '-' + today.day);
      return { html: s ? LT(esc(s.name), esc(s.nameEn || s.name)) : LT('Bugün için yok', 'None for today'), href: href };
    });
  }
  /* ---------------------------------------------------------------
     Home page. Three cards for today: the saint (with the opening of
     their life, from a small file per month), the date with the
     liturgical season (the card takes the season's colour) and the
     day's rosary mysteries. On phones, four app icons below them:
     Ara opens the Katekizm search over the blurred screen, and the
     others open Settings-style pages that grow out of their icon,
     slide further in to a page's sections, and shrink back into the
     icon on Kapat. A swipe in from the left edge goes back a level.
     --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
     11b. The saints' calendar as a calendar. The page's own HTML keeps
          every day of the year as text (what search engines and readers
          without JS get); from it this lays out:
          - on a computer, a month at a time on a real grid (Monday first,
            this year's weekdays), each day showing its saints, with the
            chosen day's saints and lives beside it, and a year view to
            jump across the months;
          - on a phone, the Takvim screen as a year of small months (a
            tap opens that month) and each month as a grid of its days
            (a tap opens that day).
     --------------------------------------------------------------- */
  var RANKS = ['rk-hi', 'rk-solemn', 'rk-feast', 'rk-memorial', 'rk-optional', 'rk-other', 'genel'];
  function buildCalendar(cal, today, MONTHS) {
    /* every word of the calendar as a pair string (Turkish, English): phtml() and pattr() write it */
    function pairs(tr, en) { return tr.map(function (t, i) { return pmake(t, en[i]); }); }
    function pobj(tr, en) { var o = {}; Object.keys(tr).forEach(function (k) { o[k] = Array.isArray(tr[k]) ? pairs(tr[k], en[k]) : pmake(tr[k], en[k]); }); return o; }
    var WD = pairs(['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    var WD1 = pairs(['P', 'S', 'Ç', 'P', 'C', 'C', 'P'], ['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    var WDL = pairs(['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'], ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
    var TX = pobj({ prev: 'Önceki ay', next: 'Sonraki ay', today: 'Bugün', month: 'Ay', year: 'Yıl', more: 'daha', legend: ['Büyük Bayram', 'Bayram', 'Anma', 'İhtiyari Anma'], none: 'Bu gün için kayıtlı bir aziz yok.' },
      { prev: 'Previous month', next: 'Next month', today: 'Today', month: 'Month', year: 'Year', more: 'more', legend: ['Solemnity', 'Feast', 'Memorial', 'Optional memorial'], none: 'No saint is listed for this day.' });
    /* short weekday names: three letters in Turkish, two in English */
    function wdShort(w) { return phtml(pmap(w, function (x, l) { return x.slice(0, l === 'en' ? 2 : 3); })); }
    /* "5 March: Saint A, Saint B" */
    function dayLabel(d, m, withWd, n) { return pcat(d + ' ', MONTHS[m - 1], withWd ? pcat(', ', WDL[wd(m, d)]) : '', n && n.length ? pcat(': ', pjoin(n, ', ')) : ''); }
    var Y = today.year;
    function rankOf(cell) { for (var i = 0; i < RANKS.length; i++) if (cell.classList.contains(RANKS[i])) return RANKS[i]; return 'rk-other'; }
    function dayOf(m, d) { return $('.day-cell[data-m="' + m + '"][data-d="' + d + '"]', cal); }
    function daysIn(m) { return new Date(Y, m, 0).getDate(); }
    function lead(m) { return (new Date(Y, m - 1, 1).getDay() + 6) % 7; }
    function wd(m, d) { return (new Date(Y, m - 1, d).getDay() + 6) % 7; }
    function isToday(m, d) { return m === today.month && d === today.day; }
    function names(cell) { return cell ? $$('.s-name', cell).map(pstr) : []; }
    /* the first paragraph of a saint's life */
    function bioStart(it) {
      var t = $('.saint-bio p', it);
      return t ? t.textContent.replace(/\s+/g, ' ').trim() : '';
    }
    var LEG_RK = ['rk-solemn', 'rk-feast', 'rk-memorial', 'rk-optional'];
    function legend() {
      return '<p class="cal-legend">' + LEG_RK.map(function (r, i) { return '<span><i class="cal-dot ' + r + '"></i>' + phtml(TX.legend[i]) + '</span>'; }).join('') + '</p>';
    }

    /* ----- a phone: the year, and each month's grid, inside the page's own levels */
    var pills = $('.month-pills');
    if (document.documentElement.classList.contains('av')) {
      var year = document.createElement('div');
      year.className = 'cal-year cal-phone';
      year.innerHTML = '<p class="cal-year-y">' + Y + '</p>' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) {
        var cells = '';
        for (var i = 0; i < lead(m); i++) cells += '<span></span>';
        for (var d = 1; d <= daysIn(m); d++) {
          var c = dayOf(m, d), r = c ? rankOf(c) : '';
          cells += '<span class="' + (isToday(m, d) ? 'is-today ' : '') + (/rk-(hi|solemn|feast)/.test(r) ? 'is-big ' + r : '') + '">' + d + '</span>';
        }
        return '<a class="cal-mini' + (m === today.month ? ' is-now' : '') + '" href="#ay-' + m + '"><span class="cal-mini-h">' + phtml(MONTHS[m - 1]) + '</span><span class="cal-mini-g" aria-hidden="true">' + cells + '</span></a>';
      }).join('') + legend();
      if (pills) pills.parentNode.insertBefore(year, pills.nextSibling); else cal.parentNode.insertBefore(year, cal);
      /* a day's own screen: its month and weekday beside the number */
      $$('.day-cell', cal).forEach(function (c) {
        var m = +c.getAttribute('data-m'), d = +c.getAttribute('data-d'), n = $('.day-num', c);
        if (!n) return;
        var s = document.createElement('span'); s.className = 'day-mon';
        pset(s, pcat(MONTHS[m - 1], ', ', WDL[wd(m, d)]));
        n.parentNode.insertBefore(s, n.nextSibling);
      });
      /* the Takvim screen itself: this month, the chosen day's saints under it (today's at
         first), arrows for the other months, and "Tüm yıl" for the twelve at a glance */
      var now = document.createElement('div');
      now.className = 'cal-now cal-phone';
      var nst = { m: today.month, sel: { m: today.month, d: today.day } };
      var TXP = pobj({ year: 'Tüm yıl', month: 'Bu ay', read: 'Hayatını oku', prev: 'Önceki ay', next: 'Sonraki ay' },
        { year: 'Full year', month: 'This month', read: 'Read their life', prev: 'Previous month', next: 'Next month' });
      function nowRender() {
        var m = nst.m, g = '';
        WD.forEach(function (w, i) { g += '<span class="cal-wd' + (i > 4 ? ' is-we' : '') + '">' + wdShort(w) + '</span>'; });
        for (var i = 0; i < lead(m); i++) g += '<span></span>';
        for (var d = 1; d <= daysIn(m); d++) {
          var c = dayOf(m, d), n = names(c), sel = nst.sel.m === m && nst.sel.d === d;
          g += '<button type="button" class="cal-md ' + (c ? rankOf(c) : '') + (isToday(m, d) ? ' is-today' : '') + (sel ? ' is-sel' : '') + (wd(m, d) > 4 ? ' is-we' : '') +
            '" data-m="' + m + '" data-d="' + d + '" aria-pressed="' + sel + '" ' + pattr('aria-label', dayLabel(d, m, false, n)) + '><span class="cal-n">' + d + '</span><i class="cal-dot"></i></button>';
        }
        var sm = nst.sel.m, sd = nst.sel.d, sc = dayOf(sm, sd), rank = sc ? $('.day-rank', sc) : null;
        var day = '<p class="cal-now-date"><b>' + phtml(pcat(sd + ' ', MONTHS[sm - 1])) + '</b>, ' + phtml(WDL[wd(sm, sd)]) + '</p>' +
          (rank && rank.textContent.trim() ? '<p class="cal-now-rank"><i class="cal-dot ' + (sc ? rankOf(sc) : '') + '"></i>' + phtml(pstr(rank)) + '</p>' : '') +
          (sc ? $$('.saint-item', sc).map(function (it) {
            var nm = $('.s-name', it), t = $('.s-title', it), b = bioStart(it), lk = $('.s-links', it);
            return '<div class="cal-now-saint"><p class="cal-now-n">' + (nm ? nm.innerHTML : '') + '</p>' + (t ? '<p class="cal-now-st">' + t.innerHTML + '</p>' : '') +
              (b ? '<p class="cal-now-bio">' + phtml(b) + '</p>' : '') + (lk ? lk.outerHTML : '') + '</div>';
          }).join('') : '') +
          '<a class="cal-now-go" href="#gun-' + sm + '-' + sd + '">' + phtml(TXP.read) + ' ›</a>';
        now.innerHTML = '<div class="cal-now-bar"><button type="button" class="cal-now-arrow" data-step="-1" ' + pattr('aria-label', TXP.prev) + (m === 1 ? ' disabled' : '') + '>‹</button>' +
          '<p class="cal-now-t">' + phtml(pcat(MONTHS[m - 1], ' ' + Y)) + '</p><button type="button" class="cal-now-arrow" data-step="1" ' + pattr('aria-label', TXP.next) + (m === 12 ? ' disabled' : '') + '>›</button>' +
          '<button type="button" class="cal-now-year" aria-expanded="false">' + phtml(TXP.year) + '</button></div>' +
          '<div class="cal-mgrid">' + g + '</div><div class="cal-now-day" aria-live="polite">' + day + '</div>' + legend();
      }
      now.addEventListener('click', function (e) {
        var t = e.target.closest('button'); if (!t) return;
        if (t.hasAttribute('data-step')) { nst.m = Math.min(12, Math.max(1, nst.m + +t.getAttribute('data-step'))); nowRender(); return; }
        if (t.classList.contains('cal-now-year')) { year.classList.add('is-open'); now.classList.add('is-hidden'); year.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); return; }
        if (t.hasAttribute('data-d')) { nst.sel = { m: +t.getAttribute('data-m'), d: +t.getAttribute('data-d') }; nowRender(); }
      });
      nowRender();
      year.insertAdjacentHTML('afterbegin', '<button type="button" class="cal-now-year cal-year-back">' + phtml(TXP.month) + '</button>');
      year.addEventListener('click', function (e) {
        if (!e.target.closest('.cal-year-back')) return;
        year.classList.remove('is-open'); now.classList.remove('is-hidden'); nst.m = today.month; nst.sel = { m: today.month, d: today.day }; nowRender();
      });
      year.parentNode.insertBefore(now, year);
      /* each month's small grid is built when the month comes near the screen, not all twelve at load */
      function buildMonthGrid(sec) {
        if (sec.hasAttribute('data-grid')) return;
        sec.setAttribute('data-grid', '');
        var m = +sec.getAttribute('data-month'), g = '';
        WD.forEach(function (w, i) { g += '<span class="cal-wd' + (i > 4 ? ' is-we' : '') + '">' + wdShort(w) + '</span>'; });
        for (var i = 0; i < lead(m); i++) g += '<span></span>';
        for (var d = 1; d <= daysIn(m); d++) {
          var c = dayOf(m, d), n = names(c);
          g += '<a class="cal-md ' + (c ? rankOf(c) : '') + (isToday(m, d) ? ' is-today' : '') + (wd(m, d) > 4 ? ' is-we' : '') + '" href="#gun-' + m + '-' + d + '" ' + pattr('aria-label', dayLabel(d, m, false, n)) + '><span class="cal-n">' + d + '</span><i class="cal-dot"></i></a>';
        }
        var grid = document.createElement('div');
        grid.className = 'cal-mgrid cal-phone';
        grid.innerHTML = g;
        var legendBox = document.createElement('div'); legendBox.className = 'cal-phone'; legendBox.innerHTML = legend();
        var t = $('.month-title', sec);
        sec.insertBefore(legendBox, t.nextSibling);
        sec.insertBefore(grid, t.nextSibling);
      }
      var months = $$('.month', cal);
      if ('IntersectionObserver' in window) {
        var mio = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { buildMonthGrid(e.target); mio.unobserve(e.target); } });
        }, { rootMargin: '800px 0px' });
        months.forEach(function (sec) { mio.observe(sec); });
      } else months.forEach(buildMonthGrid);
      return;
    }

    /* ----- a computer: the calendar itself */
    var app = document.createElement('div');
    app.className = 'cal-app';
    app.innerHTML =
      '<div class="cal-bar"><div class="cal-nav"><button type="button" class="cal-arrow" data-cal-step="-1" ' + pattr('aria-label', TX.prev) + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>' +
      '<h2 class="cal-title" aria-live="polite"></h2><button type="button" class="cal-arrow" data-cal-step="1" ' + pattr('aria-label', TX.next) + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button></div>' +
      '<button type="button" class="cal-todaybtn">' + phtml(TX.today) + '</button>' +
      '<div class="cal-seg" role="group"><button type="button" data-cal-view="month" aria-pressed="true">' + phtml(TX.month) + '</button><button type="button" data-cal-view="year" aria-pressed="false">' + phtml(TX.year) + '</button></div></div>' +
      '<div class="cal-body"><div class="cal-main"></div><aside class="cal-day" aria-live="polite"></aside></div>' + legend();
    if (pills) pills.parentNode.insertBefore(app, pills); else cal.parentNode.insertBefore(app, cal);
    cal.classList.add('cal-on');
    if (pills) pills.classList.add('cal-on');
    var main = $('.cal-main', app), side = $('.cal-day', app), title = $('.cal-title', app);
    var st = { view: 'month', m: today.month, sel: { m: today.month, d: today.day } };

    function monthHtml(m) {
      var h = '<div class="cal-grid" role="group" ' + pattr('aria-label', pcat(MONTHS[m - 1], ' ' + Y)) + '><div class="cal-row cal-head" aria-hidden="true">' +
        WD.map(function (w, i) { return '<span class="' + (i > 4 ? 'is-we' : '') + '">' + phtml(w) + '</span>'; }).join('') + '</div><div class="cal-days">';
      for (var i = 0; i < lead(m); i++) h += '<span class="cal-cell is-out" aria-hidden="true"></span>';
      for (var d = 1; d <= daysIn(m); d++) {
        var c = dayOf(m, d), n = names(c), r = c ? rankOf(c) : 'rk-other';
        var ev = n.slice(0, 2).map(function (x) { return '<span class="cal-ev ' + r + '">' + phtml(x) + '</span>'; }).join('') +
          (n.length > 2 ? '<span class="cal-more">+' + (n.length - 2) + ' ' + phtml(TX.more) + '</span>' : '');
        var sel = st.sel.m === m && st.sel.d === d;
        h += '<button type="button" class="cal-cell ' + r + (isToday(m, d) ? ' is-today' : '') + (sel ? ' is-sel' : '') + (wd(m, d) > 4 ? ' is-we' : '') +
          '" data-m="' + m + '" data-d="' + d + '" aria-pressed="' + sel + '" tabindex="' + (sel ? 0 : -1) + '" ' + pattr('aria-label', dayLabel(d, m, true, n)) + '>' +
          '<span class="cal-n">' + d + '</span>' + ev + '</button>';
      }
      var tail = (7 - (lead(m) + daysIn(m)) % 7) % 7;
      for (var k = 0; k < tail; k++) h += '<span class="cal-cell is-out" aria-hidden="true"></span>';
      return h + '</div></div>';
    }
    function yearHtml() {
      return '<div class="cal-year">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) {
        var g = WD1.map(function (w) { return '<span class="cal-wd">' + phtml(w) + '</span>'; }).join('');
        for (var i = 0; i < lead(m); i++) g += '<span></span>';
        for (var d = 1; d <= daysIn(m); d++) {
          var c = dayOf(m, d), r = c ? rankOf(c) : '';
          g += '<button type="button" class="cal-yd' + (isToday(m, d) ? ' is-today' : '') + (/rk-(hi|solemn|feast)/.test(r) ? ' is-big ' + r : '') + '" data-m="' + m + '" data-d="' + d + '" ' + pattr('aria-label', dayLabel(d, m, false)) + '>' + d + '</button>';
        }
        return '<section class="cal-mini' + (m === today.month ? ' is-now' : '') + '"><button type="button" class="cal-mini-h" data-m="' + m + '">' + phtml(MONTHS[m - 1]) + '</button><div class="cal-mini-g">' + g + '</div></section>';
      }).join('') + '</div>';
    }
    function dayHtml(m, d) {
      var c = dayOf(m, d), r = c ? rankOf(c) : '';
      var rank = c ? $('.day-rank', c) : null;
      var h = '<p class="cal-day-date"><span class="cal-day-n">' + d + '</span><span><span class="cal-day-m">' + phtml(pcat(MONTHS[m - 1], ' ' + Y)) + '</span><span class="cal-day-w">' + phtml(WDL[wd(m, d)]) + '</span></span></p>';
      if (rank && rank.textContent.trim()) h += '<p class="cal-day-rank"><i class="cal-dot ' + r + '"></i>' + phtml(pstr(rank)) + '</p>';
      var items = c ? $$('.saint-item', c) : [];
      if (!items.length) return h + '<p class="hint">' + phtml(TX.none) + '</p>';
      return h + items.map(function (it) {
        var n = $('.s-name', it), t = $('.s-title', it), b = $('.saint-bio', it);
        return '<article class="cal-saint"><h3>' + (n ? n.innerHTML : '') + '</h3>' + (t ? '<p class="cal-saint-t">' + t.innerHTML + '</p>' : '') + (b ? '<div class="cal-saint-bio">' + b.innerHTML + '</div>' : '') + '</article>';
      }).join('');
    }
    function render(focus) {
      app.setAttribute('data-view', st.view);
      pset(title, st.view === 'year' ? String(Y) : pcat(MONTHS[st.m - 1], ' ' + Y));
      $$('[data-cal-view]', app).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cal-view') === st.view)); });
      $$('.cal-arrow', app).forEach(function (b) { var s = +b.getAttribute('data-cal-step'); b.disabled = st.view === 'year' || (s < 0 ? st.m === 1 : st.m === 12); });
      main.innerHTML = st.view === 'year' ? yearHtml() : monthHtml(st.m);
      side.innerHTML = dayHtml(st.sel.m, st.sel.d);
      if (focus) { var f = $('.cal-cell.is-sel', main); if (f) f.focus(); }
    }
    function pick(m, d, focus) { st.sel = { m: m, d: d }; st.m = m; st.view = 'month'; render(focus); }
    app.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t || !app.contains(t)) return;
      if (t.hasAttribute('data-cal-step')) { st.m = Math.min(12, Math.max(1, st.m + +t.getAttribute('data-cal-step'))); render(); return; }
      if (t.hasAttribute('data-cal-view')) { st.view = t.getAttribute('data-cal-view'); render(); return; }
      if (t.classList.contains('cal-todaybtn')) { pick(today.month, today.day); return; }
      if (t.classList.contains('cal-mini-h')) { st.m = +t.getAttribute('data-m'); st.view = 'month'; render(); return; }
      if (t.hasAttribute('data-d')) pick(+t.getAttribute('data-m'), +t.getAttribute('data-d'));
    });
    /* arrow keys walk the days, across the months */
    main.addEventListener('keydown', function (e) {
      var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!step || st.view !== 'month') return;
      e.preventDefault();
      var dt = new Date(Y, st.sel.m - 1, st.sel.d + step);
      if (dt.getFullYear() !== Y) return;
      pick(dt.getMonth() + 1, dt.getDate(), true);
    });
    render();
    /* a link to a day (the home page's saint of the day): that day chosen, the calendar in view */
    var dm = /^#gun-(\d{1,2})-(\d{1,2})$/.exec(location.hash);
    if (dm && dayOf(+dm[1], +dm[2])) {
      pick(+dm[1], +dm[2]);
      requestAnimationFrame(function () { app.scrollIntoView({ block: 'start' }); });
    }
  }

  function initHome() {
    var home = $('.home-v2');
    if (!home) return;
    var now = new Date();
    /* the date and the season, in both languages */
    var dayEl = $('[data-hd-day]'), yearEl = $('[data-hd-year]'), litCard = $('[data-home-lit]');
    try {
      var fmt = function (loc, o) { return new Intl.DateTimeFormat(loc, o).format(now); };
      dayEl.innerHTML = LT(fmt('tr-TR', { day: 'numeric', month: 'long' }), fmt('en-US', { month: 'long', day: 'numeric' }));
      yearEl.innerHTML = now.getFullYear() + ' · ' + LT(fmt('tr-TR', { weekday: 'long' }), fmt('en-US', { weekday: 'long' }));
    } catch (e) { dayEl.textContent = now.toDateString(); }
    var lit = liturgicalDay(now, 'tr'), litEn = liturgicalDay(now, 'en');
    $('[data-hd-season]').innerHTML = LT(lit.name, litEn.name);
    $('[data-hd-colour]').innerHTML = LT(LIT_TEXT.tr.colour + ': ' + LIT_TEXT.tr.colours[lit.colour], LIT_TEXT.en.colour + ': ' + LIT_TEXT.en.colours[lit.colour]);
    litCard.setAttribute('data-lit', lit.colour);
    /* the saint */
    var saintCard = $('[data-home-saint]'), m = now.getMonth() + 1, key = m + '-' + now.getDate();
    /* a card's painting: the one its map gives for the key, else the map's default ("*") */
    var paint = function (card, k) {
      var el = $('.hm-art', card), map;
      if (!el) return;
      try { map = JSON.parse(card.getAttribute('data-art-map') || '{}'); } catch (e) { map = {}; }
      var art = map[k] || map['*'];
      /* the saint card's default painting is already in the page (build.ps1) */
      if (card === saintCard && art === map['*']) return;
      if (art) el.style.backgroundImage = 'url("' + ROOT + 'assets/art/' + art + (card === saintCard && window.innerWidth >= 980 ? '' : '-800') + '.jpg")';
    };
    getTodaySaint().then(function (sn) {
      $('[data-hs-name]', saintCard).innerHTML = sn.html;
      saintCard.setAttribute('href', sn.href);
      paint(saintCard, String(sn.href || '').split('/').pop().split('#')[0]);
      return loadDataScript('data/azizler-ozet-' + m + '.js', 'SAINT_SUMMARY_' + m);
    }).then(function () {
      var x = (window['SAINT_SUMMARY_' + m] || {})[key];
      if (!x) return;
      $('[data-hs-title]', saintCard).innerHTML = LT(esc(x[0] || ''), esc(x[1] || x[0] || ''));
      $('[data-hs-bio]', saintCard).innerHTML = LT(esc(x[2] || ''), esc(x[3] || x[2] || ''));
    })['catch'](function () { $('[data-hs-name]', saintCard).innerHTML = LT('Yılın azizleri', 'Saints of the year'); paint(saintCard, ''); });
    /* the mysteries */
    var myst = $('[data-home-mystery]');
    /* the day's mysteries: joyful Monday and Saturday, luminous Thursday, sorrowful Tuesday and Friday, glorious Wednesday and Sunday */
    paint(myst, ['yucelik', 'sevinc', 'aci', 'yucelik', 'isik', 'aci', 'sevinc'][now.getDay()]);
    loadDataScript('data/tespih.js', 'COMPENDIUM_ROSARY').then(function () {
      var set = window.COMPENDIUM_ROSARY.sets.filter(function (x) { return x.days.indexOf(now.getDay()) !== -1; })[0];
      if (!set) return;
      $('[data-hm-name]', myst).innerHTML = LT(set.tr, set.en);
      /* the days this set is prayed on */
      $('[data-hm-days]', myst).innerHTML = '(' + LT(set.dayTr, set.dayEn) + ')';
      /* "Tesbihe başla": the rosary itself, which opens on today's mysteries */
      myst.setAttribute('href', siteHref('tesbih-duasi.html') + '#tesbih-rehberi');
    })['catch'](function () { $('[data-hm-name]', myst).innerHTML = LT('Tesbih', 'The Rosary'); });

    /* the date card's clock: 24-hour, with seconds */
    var clock = $('[data-hd-time]');
    if (clock) {
      var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
      (function tick() {
        var d = new Date(), t = pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
        clock.textContent = t; clock.setAttribute('datetime', t);
        setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
      })();
    }

    /* the apps */
    var EASE = 'cubic-bezier(.2,.9,.22,1)', openApp = null, fromIcon = null, fromBtn = null;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* An open app is a history entry, so the browser's own back (Safari's swipe from the left
       edge, Android's back gesture) closes it. Its rows open the pages themselves, which a phone
       shows as the app's next screens (initAppView); their back button returns here. */
    var marked = false, skipPop = 0;
    function iconTransform(icon, box) {
      var r = icon.getBoundingClientRect(), b = box.getBoundingClientRect();
      var sx = r.width / b.width, sy = r.height / b.height;
      return { t: 'translate(' + ((r.left + r.width / 2) - (b.left + b.width / 2)) + 'px,' + ((r.top + r.height / 2) - (b.top + b.height / 2)) + 'px) scale(' + sx + ',' + sy + ')', rad: (18 / sx) + 'px ' + (18 / sy) + 'px' };
    }
    function boxOf(app) { return app.classList.contains('ios-spot') ? $('.ios-spot-panel', app) : app; }
    /* Ara: the field in the middle of what can be seen (above the keyboard, when it is up), or
       near the top once there are results, with the room under it for them */
    var spotEl = document.getElementById('app-ara'), spotBox = spotEl && $('.ios-spot-panel', spotEl);
    function placeSpot() {
      if (!spotEl || spotEl.hidden) return;
      var vv = window.visualViewport, vh = vv ? vv.height : window.innerHeight, vt = vv ? vv.offsetTop : 0;
      var field = $('.search-field', spotBox), res = $('.search-results', spotBox), fh = field.offsetHeight;
      var top = res && !res.hidden ? vt + Math.max(16, Math.round(vh * 0.07)) : vt + Math.round((vh - fh) / 2);
      spotBox.style.top = top + 'px';
      spotBox.style.setProperty('--spot-room', Math.max(140, vt + vh - top - fh - 30) + 'px');
    }
    if (spotEl) {
      var spotRes = $('.search-results', spotEl);
      if (spotRes && window.MutationObserver) new MutationObserver(placeSpot).observe(spotRes, { attributes: true, attributeFilter: ['hidden'] });
      if (window.visualViewport) { window.visualViewport.addEventListener('resize', placeSpot); window.visualViewport.addEventListener('scroll', placeSpot); }
      window.addEventListener('resize', placeSpot);
      window.addEventListener('resize', function () { if (openApp) setPill(fromBtn); });
    }
    /* the capsule behind the open app's icon, as in the App Store's bar */
    var dockBar = $('.hm-apps'), pill = $('.hm-pill');
    function setPill(btn) {
      $$('.hm-app', dockBar).forEach(function (b) { if (b === btn) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      if (!pill) return;
      if (!btn) { pill.classList.remove('is-on'); return; }
      pill.style.width = btn.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
      pill.classList.add('is-on');
    }
    /* from one open app straight to another: no closing and opening, just the other list */
    function switchTo(btn) {
      var id = btn.getAttribute('data-app-open'), app = document.getElementById('app-' + id), old = openApp;
      if (!app || !old || app === old) return;
      var oldBox = boxOf(old);
      old.classList.add('is-instant'); app.classList.add('is-instant');
      old.classList.remove('is-open'); old.hidden = true;
      oldBox.style.transition = 'none'; oldBox.style.transform = ''; oldBox.style.borderRadius = ''; oldBox.style.opacity = '';
      if (oldBox !== old) { var q0 = $('input', old), rs0 = $('.search-results', old); if (q0) q0.value = ''; if (rs0) { rs0.hidden = true; rs0.innerHTML = ''; } }
      var sc0 = $('.ios-scroll', old); if (sc0) sc0.scrollTop = 0;
      openApp = app; fromBtn = btn; fromIcon = $('.hm-icon', btn);
      setPill(btn);
      app.hidden = false;
      var box = boxOf(app);
      box.style.transition = 'none'; box.style.transform = ''; box.style.borderRadius = ''; box.style.opacity = '';
      if (box !== app) placeSpot();
      app.classList.add('is-open');
      setPill(btn);
      if (marked) { try { history.replaceState({ homeApp: id }, ''); } catch (e) { /* file:// */ } }
      /* Ara: the cursor in the field within the tap, so the keyboard comes up */
      if (box !== app) { var inp = $('input', app); if (inp) inp.focus({ preventScroll: true }); }
      requestAnimationFrame(function () { requestAnimationFrame(function () { old.classList.remove('is-instant'); app.classList.remove('is-instant'); }); });
    }
    function mark(app) { try { history.pushState({ homeApp: app.id.slice(4) }, ''); marked = true; } catch (e) { /* file:// */ } }
    function open(btn, instant) {
      var id = btn.getAttribute('data-app-open'), app = document.getElementById('app-' + id);
      if (!app || openApp) return;
      openApp = app; fromBtn = btn; fromIcon = $('.hm-icon', btn);
      setPill(btn);
      app.hidden = false;
      document.documentElement.classList.add('app-open');
      var box = boxOf(app), spot = box !== app;
      if (spot) { box.style.transition = 'none'; placeSpot(); }
      if (!still && !instant) {
        var tf = iconTransform(fromIcon, box);
        box.style.transition = 'none'; box.style.transform = tf.t; box.style.borderRadius = tf.rad;
        if (spot) box.style.opacity = '0';
        box.getBoundingClientRect();
        box.style.transition = 'transform .5s ' + EASE + ', border-radius .5s ' + EASE + ', opacity .25s, top .45s ' + EASE;
      }
      requestAnimationFrame(function () {
        box.style.transform = ''; box.style.borderRadius = ''; box.style.opacity = '';
        app.classList.add('is-open');
      });
      if (!instant) mark(app);
      var focusTo = spot ? $('input', app) : $('.ios-done', app);
      /* Ara: the field takes the cursor within the tap itself, which is what lets a phone
         bring its keyboard up (a moment later, it would not) */
      if (focusTo && !instant) { if (spot) focusTo.focus({ preventScroll: true }); else setTimeout(function () { focusTo.focus({ preventScroll: true }); }, 350); }
    }
    function finishClose(app) {
      var box = boxOf(app);
      app.hidden = true;
      box.style.transition = 'none'; box.style.transform = ''; box.style.borderRadius = ''; box.style.opacity = '';
      /* Ara opens empty next time, in the middle again */
      if (box !== app) { var q = $('input', app), rs = $('.search-results', app); if (q) q.value = ''; if (rs) { rs.hidden = true; rs.innerHTML = ''; } }
      var sc = $('.ios-scroll', app); if (sc) sc.scrollTop = 0;
      document.documentElement.classList.remove('app-open');
      if (openApp === app) openApp = null;
    }
    function close(fromHistory) {
      var app = openApp;
      if (!app) return;
      var box = boxOf(app), spot = box !== app;
      setPill(null);
      app.classList.remove('is-open');
      if (!still) {
        var tf = iconTransform(fromIcon, box);
        box.style.transition = 'transform .38s ' + EASE + ', border-radius .38s ' + EASE + ', opacity .3s';
        box.style.transform = tf.t; box.style.borderRadius = tf.rad;
        if (spot) box.style.opacity = '0';
      }
      setTimeout(function () { finishClose(app); if (fromBtn) fromBtn.focus({ preventScroll: true }); }, still ? 0 : 390);
      if (!fromHistory && marked) { marked = false; skipPop++; history.back(); }
      else marked = false;
      if (location.hash && /^#app-(ogren|tartis|dua|kesfet)$/.test(location.hash)) { try { history.replaceState(history.state, '', location.pathname); } catch (e) { /* file:// */ } }
    }
    window.addEventListener('popstate', function () {
      if (skipPop) { skipPop--; return; }
      if (openApp) close(true);
    });
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target : e.target.parentNode;
      var o = t.closest('[data-app-open]');
      if (o) {
        /* the icons stay over an open app: its own icon closes it, another one switches to that app */
        if (!openApp) { open(o); return; }
        if (openApp.id === 'app-' + o.getAttribute('data-app-open')) close(); else switchTo(o);
        return;
      }
      if (openApp && t.closest('[data-app-close]')) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openApp) close(); });
    /* As in the App Store's bar: a finger drawn along it carries the capsule with it, a lens
       over the icons, and where it is lifted, that app opens */
    if (dockBar && pill && window.PointerEvent) {
      var drag = null, noClick = 0;
      var appAt = function (x) {
        var best = null, bd = 1e9;
        $$('.hm-app[data-app-open]', dockBar).forEach(function (b) { var r = b.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - x); if (d < bd) { bd = d; best = b; } });
        return best;
      };
      var overTo = function (b) { $$('.hm-app[data-app-open]', dockBar).forEach(function (x) { x.classList.toggle('is-over', x === b); }); };
      var endDrag = function (e, cancel) {
        if (!drag || e.pointerId !== drag.id) return;
        var d = drag; drag = null;
        if (!d.moved) return;
        dockBar.classList.remove('is-drag'); overTo(null);
        noClick = Date.now();
        var b = cancel ? null : appAt(e.clientX);
        if (!b) { setPill(openApp ? fromBtn : null); return; }
        if (!openApp) open(b);
        else if (openApp.id !== 'app-' + b.getAttribute('data-app-open')) switchTo(b);
        else setPill(b);
      };
      dockBar.addEventListener('pointerdown', function (e) {
        if (e.button > 0) return;
        var b = e.target.closest('.hm-app[data-app-open]'); if (!b) return;
        drag = { id: e.pointerId, x0: e.clientX, moved: false, w: b.offsetWidth };
      });
      dockBar.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.moved) {
          if (Math.abs(e.clientX - drag.x0) < 6) return;
          drag.moved = true;
          try { dockBar.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
          dockBar.classList.add('is-drag');
        }
        var bs = $$('.hm-app[data-app-open]', dockBar), lo = bs[0].offsetLeft, hi = bs[bs.length - 1].offsetLeft;
        var x = e.clientX - dockBar.getBoundingClientRect().left - dockBar.clientLeft - drag.w / 2;
        pill.style.width = drag.w + 'px';
        pill.style.transform = 'translateX(' + Math.max(lo, Math.min(hi, x)) + 'px) scale(1.1)';
        pill.classList.add('is-on');
        overTo(appAt(e.clientX));
      });
      dockBar.addEventListener('pointerup', function (e) { endDrag(e, false); });
      dockBar.addEventListener('pointercancel', function (e) { endDrag(e, true); });
      /* the tap that ends a drag is not a tap on an icon as well */
      dockBar.addEventListener('click', function (e) { if (Date.now() - noClick < 400) { e.preventDefault(); e.stopPropagation(); } }, true);
    }
    /* the footer fades in once the home screen is scrolled (see the styles) */
    if (dockBar) {
      var footIn = function () { document.documentElement.classList.toggle('foot-in', window.pageYOffset > 24); };
      window.addEventListener('scroll', footIn, { passive: true });
      footIn();
    }
    $$('.ios-scroll').forEach(function (sc) {
      sc.addEventListener('scroll', function () { sc.parentNode.classList.toggle('is-scrolled', sc.scrollTop > 40); }, { passive: true });
    });

    /* Back here from one of an app's pages (its back button, or the browser's back when the page
       was not kept in memory): the history entry says which app was open. A page opened without
       coming from here (from a search engine, say) links back to its app as #app-ogren, #app-tartis, #app-dua or #app-kesfet. */
    var st = history.state, want = st && st.homeApp ? st.homeApp : (location.hash || '').replace(/^#app-/, '');
    var btn0 = /^(ogren|tartis|dua|kesfet)$/.test(want) && $('[data-app-open="' + want + '"]');
    if (btn0) { open(btn0, true); marked = !!(st && st.homeApp); }
    else if (st && st.homeApp) { try { history.replaceState(null, ''); } catch (e) { /* file:// */ } }
  }

  /* ---------------------------------------------------------------
     Phones: each page as a screen of an app (html.av, set in the page's
     head before the first paint). Every word of the page stays in its
     HTML, just as on a computer: search engines read the phone's page
     and must find all of it there, and they do not tap. The phone shows
     it one level at a time, like the Settings app: the page's sections
     as a list; a section's text, with its items as a list; an item on
     its own. Each level is a history entry at its own #anchor, so the
     browser's back (Safari's swipe from the left edge too) steps back a
     level, and any link to #something opens the level that holds it.
     --------------------------------------------------------------- */
  var AV_TX = {
    tr: { top: 'Sayfanın başına dön', sections: 'Bölümler', share: 'Paylaş', copied: 'Bağlantı kopyalandı', text: 'Metin', q: 'Soru', swipe: 'Kaydırarak geçin', prev: 'Önceki', next: 'Sonraki', toc: 'İçindekiler', done: 'Bitti', today: 'Bugünün Azizi', calendar: 'Takvim', church: 'kilise', churches: 'kilise' },
    en: { top: 'Back to top', sections: 'Sections', share: 'Share', copied: 'Link copied', text: 'Text', q: 'Question', swipe: 'Swipe for the next one', prev: 'Previous', next: 'Next', toc: 'Contents', done: 'Done', today: 'Saint of the Day', calendar: 'Calendar', church: 'church', churches: 'churches' }
  };
  /* ---------------------------------------------------------------
     Katekizm: which questions this reader has read. A question counts
     once it has been on screen for a few seconds (or "Sonraki" is
     tapped past it); the list stays in this browser only. A read
     question gets a gold tick; each chapter, part and contents entry a
     ring that fills as its questions are read.
     --------------------------------------------------------------- */
  var KKREAD = (function () {
    var KEY = 'kkio-read', set = {}, subs = [];
    try { (localStorage.getItem(KEY) || '').split(',').forEach(function (x) { if (+x) set[+x] = 1; }); } catch (e) { /* private mode */ }
    function save() { try { localStorage.setItem(KEY, Object.keys(set).join(',')); } catch (e) { /* private mode */ } }
    function count(a, b) { var c = 0; for (var i = a; i <= b; i++) if (set[i]) c++; return c; }
    return {
      has: function (n) { return !!set[n]; },
      mark: function (n) { if (!n || set[n]) return; set[n] = 1; save(); subs.forEach(function (f) { f(n); }); },
      clear: function () { set = {}; save(); subs.forEach(function (f) { f(0); }); },
      count: count, total: function () { return Object.keys(set).length; },
      on: function (f) { subs.push(f); }
    };
  })();
  var RD_TICK = '<svg class="rd-tick" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path d="m6 10.3 2.7 2.7L14.2 7.4"/></svg>';
  /* a ring for "k of n read": empty, part-filled, or full with a tick */
  function rdRing(k, n) {
    if (!n) return '';
    if (k >= n) return '<span class="rd rd-full" title="' + k + ' / ' + n + '">' + RD_TICK + '</span>';
    var C = 2 * Math.PI * 7.5, off = C * (1 - k / n);
    return '<span class="rd' + (k ? ' rd-some' : '') + '" title="' + k + ' / ' + n + '"><svg class="rd-ring" viewBox="0 0 20 20" aria-hidden="true"><circle class="rd-bg" cx="10" cy="10" r="7.5"/>' +
      (k ? '<circle class="rd-fg" cx="10" cy="10" r="7.5" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"/>' : '') + '</svg>' +
      (k ? '<span class="rd-k">' + k + '/' + n + '</span>' : '') + '</span>';
  }
  function rdRange(txt) { var m = /(\d+)\s*[–-]\s*(\d+)/.exec(txt || ''); if (m) return [+m[1], +m[2]]; m = /^\s*(\d+)\s*$/.exec(txt || ''); return m ? [+m[1], +m[1]] : null; }
  /* a computer: the questions' own number badges, the contents' ranges, the overview's parts */
  function initReadMarks() {
    var H = document.documentElement;
    function paint() {
      $$('article.qa[data-n]').forEach(function (a) { a.classList.toggle('is-read', KKREAD.has(+a.getAttribute('data-n'))); });
      $$('.toc a, .acc-list a').forEach(function (a) {
        var r = rdRange(avText($('.rng, .count', a)) || (a.getAttribute('data-rng') || ''));
        var old = $('.rd', a); if (old) old.remove();
        if (!r) return;
        a.insertAdjacentHTML('beforeend', rdRing(KKREAD.count(r[0], r[1]), r[1] - r[0] + 1));
      });
      $$('.part-acc > summary .p-meta').forEach(function (s) {
        var old = $('.rd', s); if (old) old.remove();
        var r = rdRange(avText(s).split('·').pop());
        if (r) s.insertAdjacentHTML('beforeend', rdRing(KKREAD.count(r[0], r[1]), r[1] - r[0] + 1));
      });
      var tot = $('.rd-total');
      if (tot) {
        var k = KKREAD.total();
        tot.hidden = !k;
        $('.rd-total-n', tot).textContent = k + ' / 598';
        $('.rd-total-bar i', tot).style.width = (k / 5.98) + '%';
      }
    }
    /* the overview: how far the reader has come, and a way to start over */
    var hero = $('.work-hero');
    if (hero && $('.parts')) {
      var tot = document.createElement('p');
      tot.className = 'rd-total'; tot.hidden = true;
      tot.innerHTML = '<span class="rd-total-t">' + LT('Okuduğunuz sorular', 'Questions you have read') + ' <b class="rd-total-n"></b></span>' +
        '<span class="rd-total-bar" aria-hidden="true"><i></i></span><button type="button" class="rd-reset">' + LT('Sıfırla', 'Start over') + '</button>';
      hero.appendChild(tot);
      $('.rd-reset', tot).addEventListener('click', function () {
        if (window.confirm(L2('Okuduğunuz soruların kaydı silinsin mi?', 'Forget which questions you have read?'))) KKREAD.clear();
      });
    }
    paint();
    KKREAD.on(paint);
    /* a question read on a computer: most of it in view for three seconds */
    if (H.classList.contains('av') || !window.IntersectionObserver) return;
    var timers = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var n = +e.target.getAttribute('data-n');
        if (e.isIntersecting && !KKREAD.has(n)) { if (!timers[n]) timers[n] = setTimeout(function () { KKREAD.mark(n); }, 3000); }
        else { clearTimeout(timers[n]); timers[n] = null; }
      });
    }, { threshold: 0.6 });
    $$('article.qa[data-n]').forEach(function (a) { io.observe(a); });
  }
  var AV_CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
  var AV_SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16"/></svg>';
  function avText(el) { return pstr(el); }
  /* marks the item that starts the page's usual "Bölümler" group, after a group of its own */
  var AV_GH_SECTIONS = {};
  /* A heading's text without its small label or English gloss */
  function avHead(h) {
    if (!h) return '';
    var c = h.cloneNode(true);
    $$('.label, .en, .gloss, .sec-label, svg', c).forEach(function (x) { x.remove(); });
    return avText(c);
  }
  function avNode(el, t, s, norow) {
    if (!el) return;
    el.setAttribute('data-av-node', '');
    if (t) el.setAttribute('data-av-t', t);
    if (s) el.setAttribute('data-av-s', s);
    if (norow) el.setAttribute('data-av-norow', '');
  }
  function avLink(el, t, s) { if (!el) return; el.setAttribute('data-av-link', ''); if (t) el.setAttribute('data-av-t', t); if (s) el.setAttribute('data-av-s', s); }
  /* A flat run of "heading, then its text" into one box per heading, so a section is one element */
  function avWrap(box, headSel, stopSel) {
    var cur = null, out = [];
    if (!box) return out;
    Array.prototype.slice.call(box.children).forEach(function (el) {
      if (el.matches(headSel)) {
        cur = document.createElement('div'); cur.className = 'av-sec'; cur.setAttribute('data-av-id', el.id);
        box.insertBefore(cur, el); cur.appendChild(el); out.push(cur); return;
      }
      if (stopSel && el.matches(stopSel)) { cur = null; return; }
      if (cur) cur.appendChild(el);
    });
    return out;
  }
  /* The Katekizm's parts: sections (h2) holding chapters (h3) holding the questions, with the
     smaller headings left in place as the headings of groups of questions */
  function avNest(box) {
    var stack = [{ lv: 1, el: box }];
    Array.prototype.slice.call(box.children).forEach(function (el) {
      var m = / sec-l([23])( |$)/.exec(' ' + el.className + ' ');
      if (m) {
        var lv = +m[1];
        while (stack[stack.length - 1].lv >= lv) stack.pop();
        var w = document.createElement('div'); w.className = 'av-sec'; w.setAttribute('data-av-id', el.id);
        var parent = stack[stack.length - 1].el;
        if (parent === box) box.insertBefore(w, el); else parent.appendChild(w);
        w.appendChild(el);
        avNode(w, avText($('.sec-title', el)) || avHead(el), avText($('.sec-label', el)));
        stack.push({ lv: lv, el: w });
        return;
      }
      var top = stack[stack.length - 1].el;
      if (top !== box) top.appendChild(el);
    });
  }
  /* Pages read as levels on a phone: the Katekizm (its parts, chapters and questions), its
     appendix and the calendar of saints. Every other page is one long page, as on a computer. */
  var AV_PAGES = {
    'ekler.html': function (m) {
      avWrap($('.wrap', m), 'h2.section-title[id]', 'p.conventions').forEach(function (w) { avNode(w, avHead($('h2', w))); });
      $$('.text-card[id]', m).forEach(function (c) { avNode(c, avText($('.t-title', c))); });
    },
    'azizler.html': function (m, T) {
      var wrap = $('.wrap', m), today = $('#bugun-azizi', m);
      avNode(today, T.today, avText($('[data-today-date]', today)));
      /* the calendar: the month links and the months into one box */
      var pills = $('#takvim', m), cal = $('.saints-cal', m);
      if (pills && cal) {
        var box = document.createElement('div'); box.className = 'av-sec'; box.setAttribute('data-av-id', 'takvim');
        pills.parentNode.insertBefore(box, pills); box.appendChild(pills);
        var cn = $('.cal-now', m); if (cn) box.appendChild(cn);
        var yr = $('.cal-year', m); if (yr) box.appendChild(yr);
        box.appendChild(cal);
        avNode(box, T.calendar);
      }
      avWrap(wrap, 'h2.section-title[id]', 'p.conventions').forEach(function (w) { avNode(w, avHead($('h2', w))); });
      $$('.saints-cal .month', m).forEach(function (mo) {
        var mn = avText($('.month-title', mo));
        avNode(mo, mn);
        $$('.day-cell', mo).forEach(function (c) {
          var d = c.getAttribute('data-d'), mm = c.getAttribute('data-m');
          c.setAttribute('data-av-id', 'gun-' + mm + '-' + d);
          var names = pjoin($$('.s-name', c).map(avText), ', ');
          avNode(c, d + ' ' + mn, names || avText($('.day-rank', c)));
        });
      });
    },
    'katekizm.html': function (m) {
      $$('.part-acc', m).forEach(function (d) {
        avNode(d, avText($('.p-title', d)), avText($('.p-meta', d)));
        /* its sections and chapters as lists of links */
        $$('.acc-section', d).forEach(function (sec) {
          var head = $(':scope > a', sec), list = $('.acc-list', sec), rows = document.createElement('div');
          rows.className = 'av-rows';
          $$('a', list).forEach(function (a) {
            var r = document.createElement('a'), lab = avText($('.c-label', a)), rng = avText($('.rng', a));
            r.className = 'av-row' + (a.parentNode.classList.contains('lv4') ? ' av-row-sub' : ''); r.href = a.getAttribute('href');
            r.innerHTML = '<span class="av-rt"><span class="av-t"></span><span class="av-s"></span></span>' + AV_CHEV;
            var tt = avHead($('span', a)).replace(lab, '').trim();
            pset($('.av-t', r), tt || avText(a));
            pset($('.av-s', r), pjoin([lab, rng], ' · '));
            rows.appendChild(r);
          });
          if (head) { var g = document.createElement('a'); g.className = 'av-gh av-gh-link'; g.href = head.getAttribute('href'); pset(g, pjoin([avText($('.label', head)), avText($('.s-title', head))], ': ')); sec.insertBefore(g, sec.firstChild); }
          sec.appendChild(rows);
        });
      });
      $$('.more-texts .text-link', m).forEach(function (a) { avLink(a, avText($('.t-title', a)), avText($('.t-sub', a))); });
    },
    'katekizm-part': function (m) {
      var c = $('#content', m);
      if (!c) return;
      avNest(c);
      $$('article.qa', c).forEach(function (a) { a.setAttribute('data-av-qn', a.id.replace('soru-', '')); avNode(a, pcat(avText($('.qa-num', a)), '. ', avText($('.qa-q', a)))); });
    }
  };
  ['iman-ikrari.html', 'kutsal-sirlar.html', 'mesihte-yasam.html', 'hristiyan-duasi.html'].forEach(function (f) { AV_PAGES[f] = AV_PAGES['katekizm-part']; });

  /* A page other than the home screen is laid out as a phone's app screens or as a computer's
     page when it loads (html.av, set in <head>). Resizing the window across that width loads
     the page again in the other layout, at the same place */
  /* ----- Kilise Bul's map: Turkey, fixed, with the cities that have a Catholic church. A city's
     dot lights up under the pointer; a tap or click opens the list of its churches beside the dot
     (on the side with room: to the east of Istanbul, to the west of Trabzon; on a phone, under
     the dot), each name leading to the church's own page. Istanbul's list has two columns, one
     for each side of the Bosphorus. */
  /* Kilise Bul: the dropdown list of churches under the map opens the chosen church's page */
  function initChurchPick() {
    $$('form[data-ch-pick]').forEach(function (f) {
      var sel = $('select', f);
      function go() {
        if (!sel.value) return;
        location.href = 'kilise/' + sel.value + '.html';
      }
      f.addEventListener('submit', function (e) { e.preventDefault(); go(); });
      /* a choice made with the pointer opens it at once; with the keyboard, Enter or the button */
      var byPointer = false;
      sel.addEventListener('pointerdown', function () { byPointer = true; });
      sel.addEventListener('keydown', function (e) { byPointer = false; if (e.key === 'Enter') { e.preventDefault(); go(); } });
      sel.addEventListener('change', function () { if (byPointer) go(); });
    });
  }
  function initChurchMap() {
    var sec = $('.cmap'); if (!sec) return;
    var svg = $('.cmap-svg', sec), frame = $('.cmap-frame', sec);
    var pin = function (el) { el._x = +el.getAttribute('data-x'); el._y = +el.getAttribute('data-y'); return el; };
    var cities = $$('.cmap-city', svg).map(pin), texts = $$('.cmap-texts text', svg).map(pin), ports = $$('.cmap-port', svg).map(pin), isles = $$('.cmap-isle', svg).map(pin);
    var line = document.createElement('div'); line.className = 'cmap-line'; line.hidden = true; frame.appendChild(line);
    var vb = null, open = null, city = null, busy = false;
    var still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* the view: the whole country, as wide as the frame's own shape needs */
    function whole() {
      var a = (frame.clientHeight / frame.clientWidth) || 0.594;
      var x0 = 10, x1 = 995, y0 = 60, y1 = 430, w = Math.max(x1 - x0, (y1 - y0) / a), h = w * a;
      return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w: w, h: h };
    }
    function setVb(v) {
      vb = v;
      svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
      /* dots and names keep their size on screen (a little smaller in a phone's narrow frame) */
      var fw = svg.clientWidth || 1, k = Math.max(.8, Math.min(1, fw / 640)) * Math.max(1, Math.min(1.5, fw / 1100)), s = Math.min(vb.w / fw * k, whole().w / fw * k);
      /* the ferry lines keep a steady width on screen */
      svg.style.setProperty('--cm-s', String(vb.w / fw));
      cities.forEach(function (c) { c.setAttribute('transform', 'translate(' + c._x + ' ' + c._y + ') scale(' + s + ')'); });
      texts.concat(ports, isles).forEach(function (t) { t.setAttribute('transform', 'translate(' + t._x + ' ' + t._y + ') scale(' + s + ')'); });
    }
    function draw() {
      if (busy) return;
      if (!city) setVb(whole());
      if (open) place(open);
      if (city) cvResize();
    }
    /* a ferry port (and the key under the map): straight to the question about the Greek islands, opened */
    $$('.cmap-port, .cmap-key a', sec).forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = document.getElementById((a.getAttribute('href') || a.getAttribute('xlink:href') || '').slice(1)); if (!t) return;
        e.preventDefault();
        if (t.tagName === 'DETAILS') /** @type {HTMLDetailsElement} */ (t).open = true;
        var r = document.documentElement; r.style.scrollBehavior = 'auto'; t.scrollIntoView(true); r.style.scrollBehavior = '';
        try { history.replaceState(history.state, '', location.pathname + location.search + '#' + t.id); } catch (err) { /* not rewritable */ }
      });
    });
    /* a port under the pointer or in focus: a line runs out to its island, which shows its name */
    ports.forEach(function (p) {
      var ln = $('.cf-line[data-port="' + p.getAttribute('data-port') + '"]', svg), is = $('.cmap-isle[data-isle="' + p.getAttribute('data-to') + '"]', svg);
      var on = function (v) { if (ln) ln.classList.toggle('is-on', v); if (is) is.classList.toggle('is-on', v); };
      p.addEventListener('pointerenter', function () { on(true); });
      p.addEventListener('pointerleave', function () { on(false); });
      p.addEventListener('focus', function () { on(true); });
      p.addEventListener('blur', function () { on(false); });
    });
    function popOf(c) { return document.getElementById('cmap-pop-' + c.getAttribute('data-city')); }
    /* the list beside its city: vertically round the dot, kept inside the frame where it fits */
    function place(c) {
      var pop = popOf(c); if (!pop) return;
      var f = frame.getBoundingClientRect(), d = $('.cc-dot', c).getBoundingClientRect();
      var cx = d.left + d.width / 2 - f.left, cy = d.top + d.height / 2 - f.top;
      var w = pop.offsetWidth, h = pop.offsetHeight, narrow = f.width < 600, gap = 26;
      pop.classList.toggle('is-below', narrow);
      if (narrow) {
        var x = Math.max(0, Math.min(f.width - w, cx - w / 2));
        pop.style.left = x + 'px'; pop.style.top = (cy + 16) + 'px';
        pop.style.setProperty('--ax', (cx - x) + 'px');
        line.hidden = true;
        return;
      }
      var right = c.getAttribute('data-open') !== 'l';
      var left = right ? cx + gap : cx - gap - w;
      /* never past the edge of the window */
      var vw = document.documentElement.clientWidth;
      left = Math.max(8 - f.left, Math.min(vw - 8 - f.left - w, left));
      var top = Math.max(-10, Math.min(f.height - h + 30, cy - h * 0.38));
      pop.style.left = left + 'px'; pop.style.top = top + 'px';
      line.hidden = false;
      line.style.top = cy + 'px';
      line.style.left = (right ? cx + 7 : left + w) + 'px';
      line.style.width = (gap - 7) + 'px';
      line.classList.toggle('is-l', !right);
    }
    function show(c, focus) {
      if (open === c) { hide(); return; }
      hide();
      var pop = popOf(c); if (!pop) return;
      open = c; c.classList.add('is-sel'); c.setAttribute('aria-expanded', 'true');
      pop.hidden = false; place(c);
      requestAnimationFrame(function () { pop.classList.add('is-open'); });
      if (focus) { var a = $('a', pop); if (a) a.focus({ preventScroll: true }); }
    }
    function hide(back) {
      if (!open) return;
      var c = open, pop = popOf(c);
      open = null; line.hidden = true;
      c.classList.remove('is-sel'); c.setAttribute('aria-expanded', 'false');
      if (pop) { pop.classList.remove('is-open'); pop.hidden = true; }
      if (back) c.focus({ preventScroll: true });
    }
    svg.addEventListener('click', function (e) {
      var c = e.target.closest('.cmap-city');
      if (c) openCity(c, false); else hide();
    });
    svg.addEventListener('keydown', function (e) {
      var c = e.target.closest && e.target.closest('.cmap-city');
      if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openCity(c, true); }
    });
    document.addEventListener('click', function (e) { if (open && !frame.contains(e.target)) hide(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (open) hide(true);
      else if (city && !cvCard.hidden) closeCard(true);
      else if (city) closeCity();
    });

    /* ---------- the city: clicking a city zooms into a drawn map of it (assets/sehir/<map>.json,
       made by tools/kilise-sehir-haritalari.py from OpenStreetMap), its churches where they stand and
       the well-known places round them; "Türkiye" zooms back out */
    var cv = /** @type {HTMLElement} */ ($('.cv', frame)), cvSvg = /** @type {SVGSVGElement} */ ($('.cv-svg', cv));
    var cvCard = /** @type {HTMLElement} */ ($('.cv-card', cv)), cvTitle = $('.cv-title', cv), cvMaps = $('.cv-maps', cv), cvWait = /** @type {HTMLElement} */ ($('.cv-wait', cv));
    var NS = 'http://www.w3.org/2000/svg', maps = {}, area = null, view = null, links = [], pins = [], labels = [], roads = {}, bubbles = [], picked = null, fly = 0, dock = null;
    var WIDTHS = { r1: [8, 1.6], r2: [5, 1.1], r3: [3.2, .8], r4: [2.2, .6], rail: [1.6, .8], ferry: [1.6, .7], river: [6, 1] };
    var kl = function (tr, en) { return '<span class="kl-tr">' + tr + '</span><span class="kl-en" lang="en">' + en + '</span>'; };
    var mk = function (tag, cls, parent) { var n = document.createElementNS(NS, tag); if (cls) n.setAttribute('class', cls); if (parent) parent.appendChild(n); return n; };
    var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    function tspans(t, tr, en) {
      var a = mk('tspan', 'kl-tr', t), b = mk('tspan', 'kl-en', t); a.textContent = tr; b.textContent = en;
    }
    function load(id) {
      if (maps[id]) return Promise.resolve(maps[id]);
      return fetch('assets/sehir/' + id + '.json').then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then(function (d) { maps[id] = d; return d; });
    }
    /* a position in an area's units (Web Mercator pixels at its zoom, from its corner) */
    function proj(d, lat, lon) {
      var n = 256 * Math.pow(2, d.z), r = lat * Math.PI / 180;
      return [(lon + 180) / 360 * n - d.o[0], (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n - d.o[1]];
    }
    function drawArea(d) {
      cvSvg.textContent = ''; roads = {}; pins = []; labels = []; bubbles = []; closeCard();
      var bg = mk('rect', 'cv-land', cvSvg); bg.setAttribute('width', String(d.w)); bg.setAttribute('height', String(d.h));
      /* round the churches the sea comes from closer tiles: the coarse one is cut away there */
      if (d.cover && d.cover.length) {
        var cp = mk('clipPath', null, mk('defs', null, cvSvg)); cp.id = 'cv-cut-' + d.id;
        mk('path', null, cp).setAttribute('d', 'M-9 -9H' + (d.w + 9) + 'V' + (d.h + 9) + 'H-9Z' + d.cover.map(function (c) { return 'M' + c[0] + ' ' + c[1] + 'V' + c[3] + 'H' + c[2] + 'V' + c[1] + 'Z'; }).join(''));
      }
      ['green', 'water', 'dwater', 'river', 'bld', 'r4', 'r3', 'r2', 'r1', 'rail', 'ferry'].forEach(function (k) {
        if (!d.layers[k]) return;
        var p = mk('path', 'cv-' + (k === 'dwater' ? 'water' : k), cvSvg); p.setAttribute('d', d.layers[k]); roads[k] = p;
        if (k === 'water' && d.cover && d.cover.length) p.setAttribute('clip-path', 'url(#cv-cut-' + d.id + ')');
      });
      var lg = mk('g', 'cv-labs', cvSvg); lg.setAttribute('aria-hidden', 'true');
      d.places.forEach(function (pl) {
        var g = mk('g', 'cv-lab is-' + pl.k, lg), t;
        if (pl.k === 's' || pl.k === 't') { var c = mk('circle', 'cv-lab-dot', g); c.setAttribute('r', '2.6'); }
        t = mk('text', null, g); t.setAttribute('y', pl.k === 's' || pl.k === 't' ? '-6' : '4'); tspans(t, pl.t, pl.e);
        labels.push({ el: g, x: pl.x, y: pl.y, r: pl.r, k: pl.k });
      });
      labels.sort(function (p, q) { return p.r - q.r || 'wdst'.indexOf(p.k) - 'wdst'.indexOf(q.k); });
      var pg = mk('g', 'cv-pins', cvSvg);
      links.forEach(function (a) {
        if (a.getAttribute('data-map') !== d.id) return;
        var ll = (a.getAttribute('data-ll') || '').split(' ').map(Number), xy = proj(d, ll[0], ll[1]);
        var tr = $('.kl-tr', a), en = $('.kl-en', a), st = a.getAttribute('data-st');
        var g = mk('g', 'cv-pin' + (st ? ' is-' + st : '') + (a.hasAttribute('data-approx') ? ' is-approx' : ''), pg);
        g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', tr ? tr.textContent || '' : '');
        mk('circle', 'cvp-halo', g).setAttribute('r', '15');
        if (a.hasAttribute('data-approx')) mk('circle', 'cvp-ring', g).setAttribute('r', '12');
        mk('circle', 'cvp-dot', g).setAttribute('r', '8');
        mk('path', 'cvp-cross', g).setAttribute('d', 'M0-4.6V4.2M-3.1-1.6H3.1');
        var t = mk('text', 'cvp-name', g); t.setAttribute('y', '-14'); tspans(t, tr ? tr.textContent : '', en ? en.textContent : '');
        pins.push({ el: g, a: a, x: xy[0], y: xy[1], sx: 0, sy: 0 });
      });
    }
    /* the view's shape follows the frame's */
    function fitView(v) {
      var d = area, a = (cvSvg.clientHeight / cvSvg.clientWidth) || .594, w = v.w, h = w * a;
      if (v.h > h) { h = v.h; w = h / a; }
      var maxW = Math.min(d.w, d.h / a), minW = 650;
      w = Math.max(minW, Math.min(maxW, w)); h = w * a;
      var cx = v.x + v.w / 2, cy = v.y + v.h / 2;
      return { x: Math.max(0, Math.min(d.w - w, cx - w / 2)), y: Math.max(0, Math.min(d.h - h, cy - h / 2)), w: w, h: h };
    }
    function home() {
      /* the churches with a margin, or the area's own view when it has one church */
      var d = area, ps = pins, v;
      if (ps.length < 2) v = { x: d.view[0], y: d.view[1], w: d.view[2], h: d.view[3] };
      else {
        var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        ps.forEach(function (p) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
        var m = Math.max(x1 - x0, y1 - y0) * .14 + 500;
        v = { x: x0 - m, y: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m };
      }
      /* the list docked at the side covers part of the map: the churches go in the rest of it */
      var fw = cvSvg.clientWidth || 1, dw = dock && dock.offsetWidth ? dock.offsetWidth + 20 : 0, f = Math.max(.5, (fw - dw) / fw);
      var a = (cvSvg.clientHeight / fw) || .594, w = Math.max(v.w, v.h / a) / f;
      return fitView({ x: v.x + v.w / 2 - w * f / 2, y: v.y + v.h / 2 - w * a / 2, w: w, h: w * a });
    }
    function apply() {
      if (!area || !view) return;
      cvSvg.setAttribute('viewBox', view.x + ' ' + view.y + ' ' + view.w + ' ' + view.h);
      var fw = cvSvg.clientWidth || 1, k = fw / view.w, s = 1 / k;
      /* roads as wide as they are, but never thinner than a line on screen */
      Object.keys(WIDTHS).forEach(function (r) { if (roads[r]) roads[r].setAttribute('stroke-width', String(Math.max(WIDTHS[r][1] / k, WIDTHS[r][0]))); });
      cvSvg.classList.toggle('is-near', k > .09);
      cvSvg.classList.toggle('is-close', k > .22);
      var boxes = [];
      /* churches closer than a fingertip on screen gather into a numbered bubble */
      var groups = [];
      pins.forEach(function (p) {
        p.sx = (p.x - view.x) * k; p.sy = (p.y - view.y) * k;
        var g = null;
        for (var i = 0; i < groups.length && !g; i++) if (Math.abs(groups[i].sx - p.sx) < 24 && Math.abs(groups[i].sy - p.sy) < 24) g = groups[i];
        if (g) { g.ps.push(p); g.sx = (g.sx * (g.ps.length - 1) + p.sx) / g.ps.length; g.sy = (g.sy * (g.ps.length - 1) + p.sy) / g.ps.length; }
        else groups.push({ ps: [p], sx: p.sx, sy: p.sy });
      });
      var named = k > .12 || pins.length < 4, bi = 0, pg = $('.cv-pins', cvSvg);
      groups.forEach(function (g) {
        if (g.ps.length === 1) {
          var p = g.ps[0]; p.el.style.display = '';
          p.el.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') scale(' + s + ')');
          p.el.classList.toggle('is-named', named);
          return;
        }
        g.ps.forEach(function (p) { p.el.style.display = 'none'; });
        var b = bubbles[bi++];
        if (!b) {
          b = { el: mk('g', 'cv-bub', pg), ps: [] };
          b.el.setAttribute('tabindex', '0'); b.el.setAttribute('role', 'button');
          mk('circle', 'cvb-halo', b.el).setAttribute('r', '19'); mk('circle', 'cvb-dot', b.el).setAttribute('r', '13');
          var t = mk('text', null, b.el); t.setAttribute('y', '4.5');
          bubbles.push(b);
        }
        b.ps = g.ps; b.el.style.display = '';
        $('text', b.el).textContent = String(g.ps.length);
        b.el.setAttribute('aria-label', g.ps.length + ' ' + LT('kilise: yakınlaştır', 'churches: zoom in'));
        b.el.setAttribute('transform', 'translate(' + (view.x + g.sx / k) + ' ' + (view.y + g.sy / k) + ') scale(' + s + ')');
      });
      for (; bi < bubbles.length; bi++) { bubbles[bi].el.style.display = 'none'; bubbles[bi].ps = []; }
      /* the names round them, the most important first: one that would cover a church or another
         name moves below its place, or stays hidden */
      boxes.push([0, 0, fw, 54]);
      groups.forEach(function (g) {
        boxes.push([g.sx - 13, g.sy - 13, g.sx + 13, g.sy + 13]);
        var nm = g.ps.length === 1 && named ? (($('.kl-tr', g.ps[0].a) || g.ps[0].a).textContent || '').length * 3.6 + 4 : 0;
        if (nm) boxes.push([g.sx - nm, g.sy - 28, g.sx + nm, g.sy - 10]);
      });
      var hit = function (b) { return boxes.some(function (o) { return b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]; }); };
      labels.forEach(function (l) {
        var on = l.r === 1 || (l.r === 2 && k > .045) || (l.r === 3 && k > .16), dy = 0;
        if (on) {
          var x = (l.x - view.x) * k, y = (l.y - view.y) * k, t = l.el.textContent || '', n = t.length / 2;
          var hw = n * (l.k === 'd' ? 4.6 : l.k === 'w' ? 4.4 : 3.3) + 4, top = l.k === 's' || l.k === 't' ? -17 : -8, bot = l.k === 's' || l.k === 't' ? 3 : 7;
          var b = [x - hw, y + top, x + hw, y + bot];
          if (hit(b)) { dy = 26; b = [x - hw, y + top + dy, x + hw, y + bot + dy]; if (hit(b)) on = false; }
          if (on) boxes.push(b);
        }
        l.el.style.display = on ? '' : 'none';
        if (on) l.el.setAttribute('transform', 'translate(' + l.x + ' ' + (l.y + dy / k) + ') scale(' + s + ')');
      });
      if (picked) placeCard();
    }
    function flyTo(t, ms) {
      var f = view, id = ++fly;
      if (still || !ms) { view = t; apply(); return; }
      var t0 = performance.now();
      (function step(now) {
        if (id !== fly) return;
        var u = Math.min(1, (now - t0) / ms), e = ease(u), w = Math.exp(Math.log(f.w) + (Math.log(t.w) - Math.log(f.w)) * e);
        var cx = f.x + f.w / 2 + (t.x + t.w / 2 - f.x - f.w / 2) * e, cy = f.y + f.h / 2 + (t.y + t.h / 2 - f.y - f.h / 2) * e, h = w * t.h / t.w;
        view = { x: cx - w / 2, y: cy - h / 2, w: w, h: h }; apply();
        if (u < 1) requestAnimationFrame(step);
      })(t0);
    }
    /* zoom by a factor round a point on screen (px), or round the middle */
    function zoomBy(f, px, py, ms) {
      var fw = cvSvg.clientWidth, fh = cvSvg.clientHeight;
      if (px == null) { px = fw / 2; py = fh / 2; }
      var ux = view.x + px / fw * view.w, uy = view.y + py / fh * view.h, w = view.w / f, h = view.h / f;
      var t = fitView({ x: ux - px / fw * w, y: uy - py / fh * h, w: w, h: h });
      if (ms) flyTo(t, ms); else { fly++; view = t; apply(); }
    }
    function cvResize() { if (area && view) { view = fitView(view); apply(); } }

    /* a church: a small card with its name and the way to its page */
    function openCard(p, focus) {
      closeCard(); picked = p; p.el.classList.add('is-sel');
      var a = p.a, st = a.getAttribute('data-st'), note = '';
      if (st === 'closed') note = kl('Şu anda kapalı', 'Currently closed');
      else if (st === 'limited') note = kl('Gitmeden önce sayfasına bakın', 'Check its page before you go');
      if (a.hasAttribute('data-approx')) note += (note ? ' · ' : '') + kl('Yaklaşık konum', 'Approximate location');
      cvCard.innerHTML = '<p class="cv-card-t">' + a.innerHTML + '</p>' + (note ? '<p class="cv-card-n">' + note + '</p>' : '') +
        '<a class="cv-card-a" href="' + a.getAttribute('href') + '">' + kl('Kilisenin sayfası', 'Church page') + ' <span aria-hidden="true">&#8594;</span></a>';
      cvCard.hidden = false; placeCard();
      if (focus) { var l = $('a', cvCard); if (l) l.focus({ preventScroll: true }); }
    }
    function placeCard() {
      var p = picked; if (!p) return;
      var fw = cvSvg.clientWidth, fh = cvSvg.clientHeight, w = cvCard.offsetWidth, h = cvCard.offsetHeight;
      var x = Math.max(8, Math.min(fw - w - 8, p.sx - w / 2)), y = p.sy - h - 22;
      if (y < 56) y = p.sy + 22;
      cvCard.style.left = x + 'px'; cvCard.style.top = Math.max(8, Math.min(fh - h - 8, y)) + 'px';
    }
    function closeCard(back) {
      if (!picked) return;
      var p = picked; picked = null; p.el.classList.remove('is-sel'); cvCard.hidden = true;
      if (back) p.el.focus({ preventScroll: true });
    }

    /* panning and zooming: drag, wheel, two fingers, double click, the buttons, the keyboard */
    var ptrs = {}, drag = null, moved = false;
    cvSvg.addEventListener('pointerdown', function (e) {
      if (!view) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; fly++;
      drag = { v: view, ps: JSON.parse(JSON.stringify(ptrs)) }; moved = false;
    });
    cvSvg.addEventListener('pointermove', function (e) {
      if (!drag || !ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(ptrs), r = cvSvg.getBoundingClientRect(), k = r.width / drag.v.w, a = drag.ps[ids[0]], b = ptrs[ids[0]];
      if (!a) return;
      if (ids.length === 1) {
        var dx = b.x - a.x, dy = b.y - a.y;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return;
        /* held only once it moves, so a tap still reaches the church under it */
        if (!moved) try { cvSvg.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
        moved = true; cvSvg.classList.add('is-drag');
        view = fitView({ x: drag.v.x - dx / k, y: drag.v.y - dy / k, w: drag.v.w, h: drag.v.h }); apply();
      } else if (drag.ps[ids[1]]) {
        var a2 = drag.ps[ids[1]], b2 = ptrs[ids[1]];
        var d0 = Math.hypot(a2.x - a.x, a2.y - a.y) || 1, d1 = Math.hypot(b2.x - b.x, b2.y - b.y);
        var mx0 = (a.x + a2.x) / 2 - r.left, my0 = (a.y + a2.y) / 2 - r.top, mx1 = (b.x + b2.x) / 2 - r.left, my1 = (b.y + b2.y) / 2 - r.top;
        var w = drag.v.w * d0 / d1, ux = drag.v.x + mx0 / k, uy = drag.v.y + my0 / k, k1 = r.width / w;
        moved = true;
        view = fitView({ x: ux - mx1 / k1, y: uy - my1 / k1, w: w, h: w * drag.v.h / drag.v.w }); apply();
      }
    });
    var lift = function (e) {
      delete ptrs[e.pointerId];
      cvSvg.classList.remove('is-drag');
      drag = Object.keys(ptrs).length ? { v: view, ps: JSON.parse(JSON.stringify(ptrs)) } : null;
    };
    cvSvg.addEventListener('pointerup', lift); cvSvg.addEventListener('pointercancel', lift);
    cvSvg.addEventListener('wheel', function (e) {
      if (!view) return;
      e.preventDefault();
      var r = cvSvg.getBoundingClientRect(), dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      zoomBy(Math.exp(-dy * .0022), e.clientX - r.left, e.clientY - r.top, 0);
    }, { passive: false });
    cvSvg.addEventListener('dblclick', function (e) { var r = cvSvg.getBoundingClientRect(); zoomBy(2, e.clientX - r.left, e.clientY - r.top, 420); });
    cvSvg.addEventListener('click', function (e) {
      if (moved) return;
      var t = /** @type {Element} */ (e.target), pn = t.closest('.cv-pin'), bb = t.closest('.cv-bub');
      if (pn) { var p = pins.filter(function (q) { return q.el === pn; })[0]; if (p) { if (picked === p) closeCard(); else openCard(p, false); } return; }
      if (bb) { zoomToGroup(bb); return; }
      closeCard();
    });
    cvSvg.addEventListener('keydown', function (e) {
      var t = /** @type {Element} */ (e.target), pn = t.closest && t.closest('.cv-pin'), bb = t.closest && t.closest('.cv-bub');
      if ((e.key === 'Enter' || e.key === ' ') && (pn || bb)) {
        e.preventDefault();
        if (bb) { zoomToGroup(bb); return; }
        var p = pins.filter(function (q) { return q.el === pn; })[0]; if (p) openCard(p, true);
        return;
      }
      var step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (step) { e.preventDefault(); flyTo(fitView({ x: view.x + step[0] * view.w * .25, y: view.y + step[1] * view.h * .25, w: view.w, h: view.h }), 260); }
      else if (e.key === '+' || e.key === '=') zoomBy(1.6, null, null, 300);
      else if (e.key === '-') zoomBy(1 / 1.6, null, null, 300);
    });
    function zoomToGroup(bb) {
      var b = bubbles.filter(function (q) { return q.el === bb; })[0]; if (!b || !b.ps.length) return;
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      b.ps.forEach(function (p) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
      var m = Math.max(x1 - x0, y1 - y0) * .35 + 60, t = fitView({ x: x0 - m, y: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m });
      if (t.w >= view.w * .9) t = fitView({ x: view.x + view.w * .25, y: view.y + view.h * .25, w: view.w / 2, h: view.h / 2 });
      flyTo(t, 650);
    }
    $$('.cv-zoom button', cv).forEach(function (b) {
      b.addEventListener('click', function () { if (view) zoomBy(b.getAttribute('data-z') === '1' ? 1.8 : 1 / 1.8, null, null, 320); });
    });

    /* the list of the city's churches beside its map, on a wide screen: a name under the pointer lights its church */
    function hot(a, on) {
      pins.forEach(function (p) { if (p.a === a) p.el.classList.toggle('is-hot', on); });
      bubbles.forEach(function (b) { if (b.ps.some(function (p) { return p.a === a; })) b.el.classList.toggle('is-hot', on); });
    }
    links = $$('.cmap-pop a[data-ll]', frame);
    links.forEach(function (a) {
      a.addEventListener('pointerenter', function () { hot(a, true); });
      a.addEventListener('pointerleave', function () { hot(a, false); });
      a.addEventListener('focus', function () { hot(a, true); });
      a.addEventListener('blur', function () { hot(a, false); });
    });

    function showArea(id, enter) {
      cvMaps.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-map') === id)); });
      var wait = setTimeout(function () { cvWait.hidden = false; }, 350);
      return load(id).then(function (d) {
        clearTimeout(wait); cvWait.hidden = true;
        area = d; drawArea(d); view = home(); apply();
        if (enter) cv.classList.add('is-in');
      });
    }
    function openCity(c, focus) {
      if (city || busy) return;
      var pop = popOf(c), own = pop ? $$('a[data-ll]', pop) : [];
      if (!own.length || !window.fetch || !window.Promise) { show(c, focus); return; }
      hide(); city = c; busy = true;
      var ids = (c.getAttribute('data-maps') || '').split(';').filter(Boolean).map(function (m) { return m.split('|'); });
      cvMaps.innerHTML = ids.map(function (m) { return '<button type="button" data-map="' + m[0] + '" aria-pressed="false">' + kl(m[1], m[2]) + '</button>'; }).join('');
      cvTitle.innerHTML = ($('.cmap-pop-t', pop) || c).innerHTML;
      sec.classList.add('is-city');
      setVb(whole());
      /* the country zooms into the city while the city's map grows out of its dot */
      var fw = svg.clientWidth, from = vb, a = from.h / from.w, w1 = 22, to = { x: c._x - w1 / 2, y: c._y - w1 * a / 2, w: w1, h: w1 * a };
      cv.style.transformOrigin = ((c._x - from.x) / from.w * fw) + 'px ' + ((c._y - from.y) / from.h * svg.clientHeight) + 'px';
      cv.classList.remove('is-in'); cv.hidden = false;
      dock = pop; dock.hidden = false; dock.classList.add('is-dock'); foldSides(dock);
      var first = own[0].getAttribute('data-map');
      var done = showArea(first, false);
      zoomCountry(from, to, function () {
        done.then(function () { cv.classList.add('is-in'); busy = false; dock.classList.add('is-open'); if (focus) /** @type {HTMLElement} */ ($('.cv-back', cv)).focus({ preventScroll: true }); })
          .catch(function () { busy = false; closeCity(true); show(c, focus); });
      });
    }
    /* a city with two lists (Istanbul's two sides, İzmir and Selçuk): each heading folds its list
       away, and on a narrow map both start folded so the docked lists don't cover the city */
    function foldSides(p) {
      var cols = $$('.cmap-pop-col', p), shut = cv.clientWidth < 1000;
      if (cols.length < 2) return;
      cols.forEach(function (col, i) {
        var h = $('.cmap-pop-h', col), ul = $('ul', col);
        if (!h || !ul) return;
        var b = $('.cmap-pop-tg', h);
        if (!b) {
          ul.id = p.id + '-' + i;
          h.innerHTML = '<button type="button" class="cmap-pop-tg" aria-controls="' + ul.id + '">' + h.innerHTML + '<span class="cmap-pop-n">' + $$('li', ul).length + '</span></button>';
          b = $('.cmap-pop-tg', h);
          if (b) b.addEventListener('click', function () { fold(col, !col.classList.contains('is-shut')); });
        }
        fold(col, shut);
      });
      function fold(col, s) {
        col.classList.toggle('is-shut', s);
        var t = $('.cmap-pop-tg', col);
        if (t) t.setAttribute('aria-expanded', String(!s));
        p.classList.toggle('is-slim', cols.every(function (c) { return c.classList.contains('is-shut'); }));
      }
    }
    function zoomCountry(from, to, then) {
      if (still) { setVb(to); svg.style.opacity = '0'; then(); return; }
      var t0 = performance.now(), ms = 800;
      (function step(now) {
        var u = Math.min(1, (now - t0) / ms), e = ease(u), w = Math.exp(Math.log(from.w) + (Math.log(to.w) - Math.log(from.w)) * e), h = w * from.h / from.w;
        var cx = from.x + from.w / 2 + (to.x + to.w / 2 - from.x - from.w / 2) * e, cy = from.y + from.h / 2 + (to.y + to.h / 2 - from.y - from.h / 2) * e;
        setVb({ x: cx - w / 2, y: cy - h / 2, w: w, h: h });
        svg.style.opacity = String(u < .55 ? 1 : 1 - (u - .55) / .45);
        if (u < 1) requestAnimationFrame(step); else then();
      })(t0);
    }
    function closeCity(now) {
      if (!city) return;
      var c = city; closeCard(); busy = true; fly++;
      cv.classList.remove('is-in');
      if (dock) { dock.classList.remove('is-open', 'is-dock'); dock.hidden = true; }
      sec.classList.remove('is-city');
      var to = whole(), a = to.h / to.w, w1 = 22, from = { x: c._x - w1 / 2, y: c._y - w1 * a / 2, w: w1, h: w1 * a };
      var end = function () { cv.hidden = true; city = null; area = null; view = null; busy = false; svg.style.opacity = ''; setVb(whole()); if (!now) c.focus({ preventScroll: true }); };
      if (now || still) { end(); return; }
      var t0 = performance.now(), ms = 750;
      (function step(t) {
        var u = Math.min(1, (t - t0) / ms), e = ease(u), w = Math.exp(Math.log(from.w) + (Math.log(to.w) - Math.log(from.w)) * e), h = w * a;
        var cx = from.x + from.w / 2 + (to.x + to.w / 2 - from.x - from.w / 2) * e, cy = from.y + from.h / 2 + (to.y + to.h / 2 - from.y - from.h / 2) * e;
        setVb({ x: cx - w / 2, y: cy - h / 2, w: w, h: h });
        svg.style.opacity = String(Math.min(1, u / .45));
        if (u < 1) requestAnimationFrame(step); else end();
      })(t0);
    }
    $('.cv-back', cv).addEventListener('click', function () { closeCity(false); });
    cvMaps.addEventListener('click', function (e) {
      var b = /** @type {Element} */ (e.target).closest('button'); if (!b || !area || b.getAttribute('data-map') === area.id) return;
      cv.classList.add('is-swap');
      setTimeout(function () { showArea(b.getAttribute('data-map'), false).then(function () { cv.classList.remove('is-swap'); }); }, 180);
    });
    var lastW = 0;
    var refit = function () { var fw = frame.clientWidth; if (!fw || fw === lastW) return; lastW = fw; draw(); };
    if (window.ResizeObserver) new ResizeObserver(refit).observe(frame); else window.addEventListener('resize', refit);
    draw();
  }

  /* "En üste kaydır": at the foot of a page (or a phone's level) that runs well past one screen */
  function initToTop() {
    var av = document.documentElement.classList.contains('av');
    var foot = av ? $('.av-foot') : $('.site-footer');
    if (!foot || !window.scrollTo) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'to-top'; b.hidden = true;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg><span>' + LT('En üste kaydır', 'Scroll to top') + '</span>';
    if (av) {
      var row = document.createElement('div'), share = $('.av-share', foot);
      row.className = 'av-foot-row';
      foot.insertBefore(row, foot.firstChild);
      row.appendChild(b);
      if (share) row.appendChild(share);
    } else {
      var w = document.createElement('div');
      w.className = 'wrap to-top-wrap';
      w.appendChild(b);
      foot.parentNode.insertBefore(w, foot);
    }
    /* "Yukarı çık": on a long page, a pill in the lower corner once the reader is well down it
       (it steps aside while the button at the foot is in view) */
    var f = document.createElement('button');
    f.type = 'button'; f.className = 'to-top to-top-float';
    f.innerHTML = b.innerHTML.replace(/<span>.*<\/span>/, '<span>' + LT('Yukarı çık', 'Back to top') + '</span>');
    document.body.appendChild(f);
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, footIn = false;
    var check = function () { b.hidden = document.documentElement.scrollHeight < window.innerHeight * 1.25; floatOn(); };
    var floatOn = function () {
      var long = document.documentElement.scrollHeight > window.innerHeight * 2.5;
      f.classList.toggle('is-on', long && !footIn && window.scrollY > window.innerHeight * 1.2);
    };
    var up = function () {
      try { window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    };
    b.addEventListener('click', up);
    f.addEventListener('click', function () { up(); f.blur(); });
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { footIn = es[0].isIntersecting; floatOn(); }).observe(foot);
    window.addEventListener('scroll', floatOn, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(check).observe(document.body);
    window.addEventListener('resize', check);
    check();
  }

  function initLayoutSwitch() {
    if (!document.body.hasAttribute('data-avp') || !window.matchMedia) return;
    var mq = window.matchMedia('(max-width: 979px)'), was = document.documentElement.classList.contains('av');
    /* laying the page out for printing changes its width too: that must not reload it (the
       browser's print dialog would close at once) */
    var printing = false;
    window.addEventListener('beforeprint', function () { printing = true; });
    window.addEventListener('afterprint', function () { setTimeout(function () { printing = false; }, 500); });
    var isPrint = function () { return printing || (window.matchMedia && window.matchMedia('print').matches); };
    var check = function () {
      if (isPrint()) return;
      setTimeout(function () { if (!isPrint() && mq.matches !== was) location.reload(); }, 250);
    };
    if (mq.addEventListener) mq.addEventListener('change', check); else if (mq.addListener) mq.addListener(check);
  }
  function initAppView() {
    var H = document.documentElement, main = $('#main'), nav = $('.av-nav');
    if (!H.classList.contains('av')) return;
    if (!main || !nav) { H.classList.remove('av'); return; }
    /* its own words in both languages, as pair strings (pset/phtml write them) */
    var T = {}; Object.keys(AV_TX.tr).forEach(function (k) { T[k] = pmake(AV_TX.tr[k], AV_TX.en[k]); });
    var key = document.body.getAttribute('data-avp') || '';
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { history.scrollRestoration = 'manual'; } catch (e) { /* old browsers */ }

    /* the page's icon, name and description: its hero, first in the page */
    var hero = $('.work-hero', main) || $('.page-head', main);
    if (hero) { hero.classList.add('av-hero'); main.insertBefore(hero, main.firstChild); }
    var pageT = avText($('h1', hero || main)) || document.title;
    var prep = AV_PAGES[key];
    if (prep) prep(main, T);

    /* the language of the originals: Türkçe, English or Latina, where a level has them */
    var seg = document.createElement('div');
    seg.className = 'av-lang av-fixed'; seg.setAttribute('role', 'group'); setAttr2(seg, 'aria-label', AV_TX.tr.text, AV_TX.en.text);
    if (hero) hero.parentNode.insertBefore(seg, hero.nextSibling); else main.insertBefore(seg, main.firstChild);
    /* the page's own list heading, and the button to share the level being read */
    var foot = document.createElement('div');
    foot.className = 'av-foot';
    foot.innerHTML = '<button type="button" class="av-share">' + AV_SHARE + '<span>' + phtml(T.share) + '</span></button><p class="av-toast" role="status" aria-live="polite"></p>';
    main.parentNode.insertBefore(foot, main.nextSibling);

    /* In a level further in, the page's small icon and name lead back to its start; a level
       deeper still also shows the levels between as a trail under them */
    var crumbs = document.createElement('p');
    crumbs.className = 'av-crumbs';
    if (hero) {
      hero.appendChild(crumbs);
      var toTop = function (e) { if (cur && !(e.target.closest && e.target.closest('a, button, input, select'))) { e.preventDefault(); popTo(null); } };
      hero.addEventListener('click', toTop);
      hero.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') toTop(e); });
    }
    /* rows of questions: a gold tick once read; rows of chapters: a ring filling up */
    function readRows(level) {
      $$('.av-row', level).forEach(function (a) {
        var k = a._avSrc; if (!k) return;
        var old = $('.rd', a); if (old) old.remove();
        a.classList.remove('is-read');
        if (k.hasAttribute('data-av-qn')) {
          if (KKREAD.has(+k.getAttribute('data-av-qn'))) { a.classList.add('is-read'); a.lastElementChild.insertAdjacentHTML('beforebegin', '<span class="rd rd-full">' + RD_TICK + '</span>'); }
          return;
        }
        var qs = $$('article.qa[data-n]', k);
        if (!qs.length) return;
        var got = qs.filter(function (q) { return KKREAD.has(+q.getAttribute('data-n')); }).length;
        a.lastElementChild.insertAdjacentHTML('beforebegin', rdRing(got, qs.length));
      });
    }
    KKREAD.on(function () { if (cur !== undefined) readRows(cur || main); });
    function trailFor(n) {
      var list = [];
      for (var p = parentOf(parentOf(n)); p; p = parentOf(p)) list.unshift(p);
      crumbs.innerHTML = list.map(function (p) { return '<a href="#' + idOf(p) + '" data-av-pop="' + idOf(p) + '"></a>'; }).join(AV_CHEV);
      $$('a', crumbs).forEach(function (a, i) { pset(a, titleOf(list[i])); });
      crumbs.hidden = !list.length;
      if (!hero) return;
      if (n) { hero.setAttribute('role', 'button'); hero.setAttribute('tabindex', '0'); setAttr2(hero, 'aria-label', AV_TX.tr.top + ': ' + pageT); }
      else { hero.removeAttribute('role'); hero.removeAttribute('tabindex'); hero.removeAttribute('aria-label'); }
    }
    var navTitle = $('.av-title', nav), backA = $('[data-av-back]', nav), backL = $('[data-av-back-label]', nav);
    var homeBack = { href: backA.getAttribute('href'), label: pstr(backL) };
    /* Came here from another of the site's pages: back goes there, under its name */
    var ref = null;
    try { if (document.referrer && new URL(document.referrer).origin === location.origin) ref = new URL(document.referrer); } catch (e) { /* no URL() */ }
    try { sessionStorage.setItem('avt:' + location.pathname, pageT); } catch (e) { /* private mode */ }
    if (ref && ref.pathname !== location.pathname) {
      var refT = null; try { refT = sessionStorage.getItem('avt:' + ref.pathname); } catch (e) { /* private mode */ }
      if (refT) homeBack.label = refT;
      homeBack.history = window.history.length > 1;
    }

    function nodeOf(el) { var n = el && el.closest ? el.closest('[data-av-node]') : null; return n && main.contains(n) ? n : null; }
    function parentOf(n) { return n ? nodeOf(n.parentElement) : null; }
    function idOf(n) {
      if (!n.id && !n.getAttribute('data-av-id')) n.setAttribute('data-av-id', 'av-' + (++idOf.k));
      return n.id || n.getAttribute('data-av-id');
    }
    idOf.k = 0;
    function titleOf(n) { return n ? (n.getAttribute('data-av-t') || avHead($('h2, h3, summary', n)) || pageT) : pageT; }
    function depthOf(n) { var d = 0; while (n) { d++; n = parentOf(n); } return d; }
    function byId(id) {
      if (!id) return null;
      var el = document.getElementById(id) || $('[data-av-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]', main);
      return el && main.contains(el) ? el : null;
    }

    /* A level's list: a row for each of its items, in their place in the text */
    function rowsFor(level) {
      if (level._avRows) return;
      level._avRows = true;
      var kids = $$('[data-av-node], [data-av-link]', level).filter(function (k) { return nodeOf(k.parentElement) === (level === main ? null : level) && !k.hasAttribute('data-av-norow'); });
      var runs = [], last = null;
      kids.forEach(function (k) {
        if (last && last.end.nextElementSibling === k && !k._avGh) last.list.push(k);
        else { last = { list: [k] }; runs.push(last); }
        last.end = k;
      });
      runs.forEach(function (r, i) {
        var box = document.createElement('div');
        box.className = 'av-rows';
        r.list.forEach(function (k) {
          var a = document.createElement('a'), s = k.getAttribute('data-av-s'), out = k.hasAttribute('data-av-link');
          a.className = 'av-row';
          a.href = out ? k.getAttribute('href') : '#' + idOf(k);
          a.innerHTML = '<span class="av-rt"><span class="av-t"></span>' + (s ? '<span class="av-s"></span>' : '') + '</span>' + AV_CHEV;
          pset($('.av-t', a), titleOf(k));
          if (s) pset($('.av-s', a), s);
          a._avSrc = k;
          if (k.hidden) a.hidden = true;
          box.appendChild(a);
        });
        var own = r.list[0]._avGh;
        if (level === main && (own || i === 0) && !$('.cmap, [data-av-nogh]', main)) {
          var gh = document.createElement('p'); gh.className = 'av-gh'; pset(gh, own && own !== AV_GH_SECTIONS ? own : T.sections);
          r.list[0].parentNode.insertBefore(gh, r.list[0]);
        }
        r.list[0].parentNode.insertBefore(box, r.list[0]);
      });
    }
    /* a filter elsewhere on the page (the churches' rite) hides some items: so do their rows */
    function syncRows() {
      $$('.av-row', main).forEach(function (a) {
        var k = a._avSrc; if (!k) return;
        a.hidden = !!k.hidden;
        if (k.classList.contains('church-city')) { var n = $$('.church-card', k).filter(function (c) { return !c.hidden; }).length, sEl = $('.av-s', a); if (sEl) pset(sEl, pmake(n + ' ' + AV_TX.tr.church, n + ' ' + (n === 1 ? AV_TX.en.church : AV_TX.en.churches))); }
      });
    }
    var rite = $('#rite-select'); if (rite) rite.addEventListener('change', function () { setTimeout(syncRows, 0); });

    /* ----- which level is on screen */
    var cur = null, scrolls = {};
    function place(n) {
      $$('.av-cur, .av-path', main.parentNode).forEach(function (e) { e.classList.remove('av-cur', 'av-path'); });
      var target = n || main;
      target.classList.add('av-cur');
      if (n) for (var p = n.parentElement; p && p !== main.parentElement; p = p.parentElement) p.classList.add('av-path');
      rowsFor(target);
      if (n && n.tagName === 'DETAILS') n.open = true;
      /* collapsed parts inside the level (a church's Mass times, a day's saints) open */
      $$('details:not([data-av-node]):not(.latin)', target).forEach(function (d) { if (nodeOf(d.parentElement) === n) d.open = true; });
      H.classList.toggle('av-sub', !!n);
      /* a level with no levels under it is read, not chosen from: its heading sits on the left */
      H.classList.toggle('av-leaf', !!n && !$('[data-av-node]', n));
      H.classList.toggle('av-reader', !!(n && n.hasAttribute('data-av-qn')));
      cur = n;
      var par = parentOf(n);
      pset(navTitle, n ? titleOf(n) : pageT);
      pset(backL, n ? (par ? titleOf(par) : pageT) : homeBack.label);
      backA.setAttribute('href', n ? '#' + (par ? idOf(par) : '') : homeBack.href);
      langFor(target);
      trailFor(n);
      readRows(target);
      if (n && n.hasAttribute('data-av-qn')) reader(n);
      setTitle();
    }
    /* the tab's title: the level's name and the page's, in the language shown */
    function setTitle() { document.title = cur ? pnow(titleOf(cur)) + ' | ' + pnow(pageT) : pageT0(); }
    var title0 = document.title;
    function pageT0() { return title0; }
    function keyOf(n) { return n ? idOf(n) : ''; }
    /* Slide the new level in (forward) or back, with the page's icon and title shrinking or
       growing between them; the browser's own back swipe has already shown its picture of the
       level underneath, so that one is put in place at once */
    /* The new level slides in from the side it comes from (the page's own animation, not the
       browser's view transitions: Safari could leave one of those hanging over a blank level) */
    function swap(fn, dir) {
      fn();
      if (still || !dir || !main.animate) return;
      var from = dir === 'fwd' ? '34%' : '-34%';
      var parts = cur ? [cur] : $$(':scope > *', main).filter(function (el) { return el !== hero && !el.classList.contains('av-fixed') && el.offsetHeight; });
      parts.forEach(function (el) {
        try {
          el.animate([{ transform: 'translateX(' + from + ')', opacity: 0 }, { transform: 'none', opacity: 1 }],
            { duration: 380, easing: 'cubic-bezier(.32, .72, 0, 1)' });
        } catch (e) { /* no Web Animations */ }
      });
    }
    function show(n, how, scrollTo) {
      var from = cur;
      scrolls[keyOf(from)] = window.pageYOffset;
      var dir = how === 'none' ? null : (depthOf(n) >= depthOf(from) ? 'fwd' : 'back');
      /* the phone's own swipe back has already shown the level underneath as it was: it is put
         in place as it is, without the icon and title resizing again */
      if (how === 'none') {
        H.classList.add('av-still');
        requestAnimationFrame(function () { requestAnimationFrame(function () { H.classList.remove('av-still'); }); });
      }
      swap(function () {
        place(n);
        var y = scrollTo != null ? scrollTo : (dir === 'back' || how === 'none' ? (scrolls[keyOf(n)] || 0) : 0);
        window.scrollTo(0, y);
        onScroll();
        /* a screen reader carries on from the new level's heading (the page's, back at its list) */
        var h = n ? $('h2, h3, h4, summary, .day-num', n) : $('h1', hero || main);
        if (h && how !== 'none') { if (!h.hasAttribute('tabindex') && h.tagName !== 'SUMMARY') h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      }, dir);
    }
    /* The levels this page's history entries hold, oldest first, so a level further up can be
       reached by going back that many steps at once */
    function trail() { var s = history.state; return s && s.av && s.trail ? s.trail.slice() : [keyOf(cur)]; }
    function popTo(a) {
      var tr = trail(), k = tr.lastIndexOf(keyOf(a));
      if (a === cur) return;
      if (k >= 0 && k < tr.length - 1) { viaButton = true; history.go(k - (tr.length - 1)); }
      else go(a, 'replace');
    }
    function urlFor(n) { return n ? '#' + idOf(n) : location.pathname + location.search; }
    function go(n, how) {
      if (n === cur) return;
      try {
        var tr = trail();
        if (how === 'replace') history.replaceState({ av: 1, pushed: !!(history.state && history.state.pushed), trail: tr.slice(0, -1).concat(keyOf(n)) }, '', urlFor(n));
        else history.pushState({ av: 1, pushed: true, trail: tr.concat(keyOf(n)) }, '', urlFor(n));
      } catch (e) { /* file:// */ }
      show(n, how === 'replace' ? 'back' : 'push');
    }
    function step(n) {
      if (!n || n === cur) return;
      /* into another part, the back button leads to that part's list rather than the history */
      var same = parentOf(n) === parentOf(cur);
      try { history.replaceState({ av: 1, pushed: same && !!(history.state && history.state.pushed), trail: trail().slice(0, -1).concat(keyOf(n)) }, '', urlFor(n)); } catch (e) { /* file:// */ }
      show(n, 'push');
    }
    /* an element anywhere on the page: open the level that holds it, then bring it into view */
    function reveal(el, how) {
      var n = el.hasAttribute('data-av-node') ? el : nodeOf(el);
      /* a section's own heading carries its anchor: that is the section itself */
      if (n && el.id && n.getAttribute('data-av-id') === el.id) el = n;
      if (n !== cur) go(n, how);
      if (el !== n) requestAnimationFrame(function () { requestAnimationFrame(function () {
        var y = el.getBoundingClientRect().top + window.pageYOffset - nav.offsetHeight - 12;
        window.scrollTo(0, Math.max(0, y));
      }); });
    }

    /* the browser's back and forward */
    var viaButton = false;
    window.addEventListener('popstate', function () {
      var n = nodeOf(byId(hashId()));
      /* anything but the page's own back button (a swipe from the edge, the browser's back or
         forward) has already been drawn by the browser: no slide of our own on top of it */
      var native = !viaButton;
      viaButton = false;
      show(n, native ? 'none' : 'pop');
    });
    /* links to a place on this page */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || a.target === '_blank') return;
      if (a === backA) { e.preventDefault(); back(); return; }
      if (a.hasAttribute('data-av-pop')) { e.preventDefault(); popTo(nodeOf(byId(a.getAttribute('data-av-pop')))); return; }
      /* the previous or next section: it takes the place of the one being read, so the back
         button still leads to the list the reader came from, not through every section read */
      if (a.hasAttribute('data-av-step')) { e.preventDefault(); step(nodeOf(byId(a.getAttribute('href').slice(1)))); return; }
      var u; try { u = new URL(a.href, location.href); } catch (err) { return; }
      if (u.origin !== location.origin || u.pathname !== location.pathname || !u.hash) return;
      var el = byId(decodeURIComponent(u.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      reveal(el, 'push');
    });
    /* a level's collapsed title is its heading here, not a switch */
    document.addEventListener('click', function (e) {
      var s = e.target.closest && e.target.closest('summary');
      if (s && s.parentNode.hasAttribute('data-av-node') && main.contains(s)) e.preventDefault();
    }, true);
    function back() {
      if (cur) {
        if (history.state && history.state.pushed) { viaButton = true; history.back(); }
        else go(parentOf(cur), 'replace');
        return;
      }
      if (homeBack.history) history.back(); else location.href = homeBack.href;
    }
    /* the settings are the header's: opened once this tap has finished, so the panel's own
       "tap outside closes it" doesn't take this tap for one */
    /* The Katekizm's search: the magnifier opens the field across the bar and puts the cursor
       in it in the same tap (so a phone's keyboard comes up); a tap elsewhere folds it away */
    var findBtn = $('.av-find', nav), findBar = $('#av-findbar');
    if (findBtn && findBar) {
      var findIn = $('input', findBar);
      var setFind = function (on) {
        findBar.hidden = false;
        findBtn.setAttribute('aria-expanded', String(on));
        H.classList.toggle('av-finding', on);
        if (on) findIn.focus();
        else { findIn.blur(); setTimeout(function () { if (!H.classList.contains('av-finding')) findBar.hidden = true; }, 320); }
      };
      findBar.hidden = true;
      findBtn.addEventListener('click', function () { setFind(!H.classList.contains('av-finding')); });
      document.addEventListener('click', function (e) { if (H.classList.contains('av-finding') && !findBar.contains(e.target) && !findBtn.contains(e.target)) setFind(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && H.classList.contains('av-finding')) { setFind(false); findBtn.focus(); } });
      /* a result on this page opens its question here */
      findBar.addEventListener('click', function (e) { if (e.target.closest('.sr-item')) setFind(false); });
    }
    $('.av-gear', nav).addEventListener('click', function () { var g = $('.site-header .settings-btn'); if (g) setTimeout(function () { g.click(); }, 0); });

    /* the title in the bar once the page's own has scrolled away */
    function onScroll() {
      var lim = hero ? hero.offsetTop + hero.offsetHeight - nav.offsetHeight : 40;
      H.classList.toggle('av-scrolled', window.pageYOffset > Math.max(8, lim));
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ----- Share: the address of the level being read */
    var toast = $('.av-toast', foot), toastT = null;
    $('.av-share', foot).addEventListener('click', function () {
      var url = location.href, title = document.title;
      if (navigator.share) { navigator.share({ title: title, url: url })['catch'](function () { /* dismissed */ }); return; }
      var done = function () { toast.textContent = pnow(T.copied); clearTimeout(toastT); toastT = setTimeout(function () { toast.textContent = ''; }, 2200); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { /* blocked */ }); else done();
    });

    /* ----- Türkçe / English / Latina: the originals where a level has them, in place of the
       Turkish, remembered from page to page */
    var ORIG_KEY = 'kkio-orig', pref = 'tr';
    try { pref = localStorage.getItem(ORIG_KEY) || 'tr'; } catch (e) { /* private mode */ }
    var LABELS = { tr: LT('Türkçe', 'English'), la: 'Latina' };
    function mine(el, target) { return nodeOf(el) === (target === main ? null : target); }
    function langFor(target) {
      var has = { la: $$('details.latin', target).some(function (x) { return mine(x, target); }) };
      var opts = ['tr'].concat(has.la ? ['la'] : []);
      H.classList.toggle('av-orig', opts.length > 1);
      if (opts.length < 2) { H.removeAttribute('data-orig'); return; }
      var eff = opts.indexOf(pref) >= 0 ? pref : 'tr';
      seg.innerHTML = opts.map(function (o) { return '<button type="button" data-orig="' + o + '" aria-pressed="' + (o === eff) + '"' + (o === 'la' ? ' lang="la"' : '') + '>' + LABELS[o] + '</button>'; }).join('');
      setOrig(eff, target);
    }
    function setOrig(o, target) {
      if (o === 'tr') H.removeAttribute('data-orig'); else H.setAttribute('data-orig', o);
      /* the Latin shows only as Latina: back in Turkish or English it folds away again */
      $$('details.latin', target).forEach(function (d) { d.open = o === 'la'; });
      $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-orig') === o)); });
    }
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-orig]'); if (!b) return;
      pref = b.getAttribute('data-orig');
      try { localStorage.setItem(ORIG_KEY, pref); } catch (err) { /* private mode */ }
      var target = cur || main;
      main.classList.remove('av-fade'); void main.offsetWidth; main.classList.add('av-fade');
      setOrig(pref, target);
    });

    /* ----- The Katekizm: a question on its own, with Previous / Next under it, a swipe left or
       right for the next or the one before, and a contents button at the bottom right: a slider
       over all 598 and the questions of this chapter. Past the first or the last question of a
       part, the next part's page opens at that question. */
    var KQ_TOTAL = 598, KQ_STARTS = [1, 218, 357, 534];
    function kqUrl(n) { var pi = 0; KQ_STARTS.forEach(function (s, i) { if (n >= s) pi = i; }); return siteHref(PAGES[pi]) + '#soru-' + n; }
    function kqGo(n, dir) {
      if (n < 1 || n > KQ_TOTAL) return;
      var el = document.getElementById('soru-' + n);
      if (!el) { location.href = kqUrl(n); return; }
      var same = parentOf(el) === parentOf(cur);
      try { history.replaceState({ av: 1, pushed: same && !!(history.state && history.state.pushed), trail: trail().slice(0, -1).concat('soru-' + n) }, '', '#soru-' + n); } catch (e) { /* file:// */ }
      scrolls[keyOf(cur)] = 0;
      swap(function () { place(el); window.scrollTo(0, 0); onScroll(); }, dir > 0 ? 'next' : 'prev');
    }
    function reader(a) {
      if (!a._avKq) {
        a._avKq = true;
        var n = +a.getAttribute('data-av-qn');
        var top = document.createElement('p'); top.className = 'kq-count av-keepl';
        top.innerHTML = '<span>' + phtml(T.q) + ' ' + n + ' / ' + KQ_TOTAL + '</span><span class="kq-hint">' + phtml(T.swipe) + '</span>';
        a.insertBefore(top, a.firstChild);
        var pager = document.createElement('div'); pager.className = 'kq-pager av-keepl';
        pager.innerHTML = '<button type="button" class="kq-btn" data-kq="-1"' + (n <= 1 ? ' disabled' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg><span>' + phtml(T.prev) + '</span></button>' +
          '<button type="button" class="kq-btn kq-next" data-kq="1"' + (n >= KQ_TOTAL ? ' disabled' : '') + '><span>' + phtml(T.next) + '</span>' + AV_CHEV + '</button>';
        a.appendChild(pager);
      }
      kqTools();
      var qn = +a.getAttribute('data-av-qn');
      var rd = /** @type {any} */ (reader);
      clearTimeout(rd.t);
      if (!KKREAD.has(qn)) rd.t = setTimeout(function () { if (cur === a) { KKREAD.mark(qn); readMark(a); } }, 3000);
      readMark(a);
    }
    /* the question's own line: "Okundu" with a tick once it has been read */
    function readMark(a) {
      var top = $('.kq-count', a); if (!top) return;
      var had = $('.kq-read', top), on = KKREAD.has(+a.getAttribute('data-av-qn'));
      if (on && !had) top.insertAdjacentHTML('beforeend', '<span class="kq-read">' + RD_TICK + '<span>' + LT('Okundu', 'Read') + '</span></span>');
      else if (!on && had) had.remove();
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-kq]');
      if (!b || !cur) return;
      var d = +b.getAttribute('data-kq');
      if (d > 0) KKREAD.mark(+cur.getAttribute('data-av-qn'));
      kqGo(+cur.getAttribute('data-av-qn') + d, d);
    });
    /* a swipe across the question (not from the edge, which is the browser's back) */
    var rs = null;
    document.addEventListener('touchstart', function (e) {
      rs = null;
      var t = e.touches[0];
      if (!cur || !cur.hasAttribute('data-av-qn') || t.clientX < 40 || e.touches.length > 1 || !cur.contains(e.target)) return;
      rs = { x: t.clientX, y: t.clientY, t0: Date.now(), live: false, dx: 0 };
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!rs) return;
      var t = e.touches[0], dx = t.clientX - rs.x, dy = t.clientY - rs.y;
      if (!rs.live) { if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { rs = null; return; } if (Math.abs(dx) < 12) return; rs.live = true; }
      rs.dx = dx;
      cur.style.transition = 'none'; cur.style.transform = 'translateX(' + dx * 0.5 + 'px)'; cur.style.opacity = String(1 - Math.min(0.4, Math.abs(dx) / 800));
    }, { passive: true });
    document.addEventListener('touchend', function () {
      var r0 = rs; rs = null;
      if (!r0 || !r0.live || !cur) return;
      var el = cur, n = +el.getAttribute('data-av-qn'), dir = r0.dx < 0 ? 1 : -1;
      var fast = Math.abs(r0.dx) / Math.max(1, Date.now() - r0.t0) > 0.45;
      el.style.transition = 'transform .25s, opacity .25s'; el.style.transform = ''; el.style.opacity = '';
      setTimeout(function () { el.style.transition = ''; }, 260);
      if ((Math.abs(r0.dx) > 70 || (fast && Math.abs(r0.dx) > 30)) && n + dir >= 1 && n + dir <= KQ_TOTAL) kqGo(n + dir, dir);
    });
    var kq = null;
    function kqTools() {
      if (kq) return;
      var fab = document.createElement('button');
      fab.type = 'button'; fab.className = 'kq-fab av-kq-fab'; setAttr2(fab, 'aria-label', AV_TX.tr.toc, AV_TX.en.toc); fab.setAttribute('aria-haspopup', 'dialog');
      fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.1" fill="currentColor" stroke="none"/></svg>';
      var sh = document.createElement('div');
      sh.className = 'kq-sheet av-kq-sheet'; sh.hidden = true;
      sh.innerHTML = '<div class="kq-sheet-bg" data-kq-close></div><div class="kq-sheet-panel" role="dialog" aria-modal="true" aria-label="' + esc(pnow(T.toc)) + '">' +
        '<div class="kq-grab" aria-hidden="true"></div><div class="kq-sheet-head"><p class="kq-sheet-t">' + phtml(T.toc) + '</p><button type="button" class="ios-done" data-kq-close>' + phtml(T.done) + '</button></div>' +
        '<div class="kq-slider"><p class="kq-slider-l"></p><input type="range" min="1" max="' + KQ_TOTAL + '" step="1" aria-label="' + esc(pnow(T.q)) + '"><p class="kq-slider-q"></p></div>' +
        '<div class="kq-sheet-scroll"><p class="av-gh kq-sheet-gh"></p><div class="av-rows kq-sheet-list"></div></div></div>';
      document.body.appendChild(fab); document.body.appendChild(sh);
      var range = $('input', sh), lab = $('.kq-slider-l', sh), qt = $('.kq-slider-q', sh);
      function label() {
        var n = +range.value, el = document.getElementById('soru-' + n);
        lab.innerHTML = phtml(T.q) + ' ' + n + ' / ' + KQ_TOTAL;
        pset(qt, el ? avText($('.qa-q', el)) : '');
      }
      function openSheet(on) {
        if (!on) { sh.classList.remove('is-open'); setTimeout(function () { if (!sh.classList.contains('is-open')) sh.hidden = true; }, 260); fab.focus({ preventScroll: true }); return; }
        var n = +cur.getAttribute('data-av-qn'), par = parentOf(cur);
        range.value = n; label();
        pset($('.kq-sheet-gh', sh), par ? titleOf(par) : pageT);
        var list = $('.kq-sheet-list', sh);
        list.innerHTML = '';
        $$('[data-av-qn]', par || main).filter(function (q) { return parentOf(q) === par; }).forEach(function (q) {
          var b = document.createElement('button'), here = q === cur;
          b.type = 'button'; b.className = 'av-row' + (here ? ' is-here' : ''); b.setAttribute('data-kq-go', q.getAttribute('data-av-qn'));
          if (here) b.setAttribute('aria-current', 'true');
          b.innerHTML = '<span class="av-rt"><span class="av-t"></span></span>';
          pset($('.av-t', b), titleOf(q));
          list.appendChild(b);
        });
        sh.hidden = false;
        requestAnimationFrame(function () {
          sh.classList.add('is-open');
          var sc = $('.kq-sheet-scroll', sh), h = $('.is-here', sh);
          if (h) sc.scrollTop = Math.max(0, h.offsetTop - sc.clientHeight / 2 + h.offsetHeight / 2);
        });
        setTimeout(function () { range.focus({ preventScroll: true }); }, 60);
      }
      range.addEventListener('input', label);
      range.addEventListener('change', function () { var n = +range.value, c = +cur.getAttribute('data-av-qn'); openSheet(false); if (n !== c) kqGo(n, n > c ? 1 : -1); });
      fab.addEventListener('click', function () { openSheet(true); });
      sh.addEventListener('click', function (e) {
        if (e.target.closest('[data-kq-close]')) { openSheet(false); return; }
        var g = e.target.closest('[data-kq-go]');
        if (g) { var n = +g.getAttribute('data-kq-go'), c = +cur.getAttribute('data-av-qn'); openSheet(false); if (n !== c) kqGo(n, n > c ? 1 : -1); }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sh.hidden) openSheet(false); });
      kq = { fab: fab, sheet: sh };
    }

    /* ----- start: at the level the address points to */
    var start = byId(hashId());
    /* the hero takes its size at once on load; after that every change of level resizes it */
    H.classList.add('av-still');
    requestAnimationFrame(function () { requestAnimationFrame(function () { H.classList.remove('av-still'); }); });
    place(null);
    if (start) {
      var sn = start.hasAttribute('data-av-node') ? start : nodeOf(start);
      if (sn && start.id && sn.getAttribute('data-av-id') === start.id) start = sn;
      place(sn);
      /* a reload keeps the entry's own record of the levels before it */
      var st0 = history.state;
      if (!(st0 && st0.av && st0.trail && st0.trail[st0.trail.length - 1] === keyOf(sn))) {
        try { history.replaceState({ av: 1, pushed: false, trail: [keyOf(sn)] }, '', location.href); } catch (e) { /* file:// */ }
      }
      /* the browser jumps to the #anchor itself as the page finishes loading: after that, put
         the level at its top (or the linked element under the bar) */
      var settle = function () { if (start !== sn) reveal(start, 'none'); else window.scrollTo(0, 0); onScroll(); };
      settle();
      if (document.readyState !== 'complete') window.addEventListener('load', function () { requestAnimationFrame(settle); }, { once: true });
      else requestAnimationFrame(settle);
    }
    onScroll();
    H.classList.add('av-ready');
  }

  /* GitHub Pages doesn't send an X-Frame-Options/frame-ancestors header, and that CSP
     directive is ignored when set via a <meta> tag, so this is the remaining defense
     against the site being loaded inside someone else's iframe (clickjacking). */
  function initFrameBust() {
    try { if (window.top !== window.self) window.top.location = window.self.location.href; } catch (e) { /* cross-origin top: assume framed and bail the same way */ window.top.location = window.self.location.href; }
  }

  /* İletişim: the form posts to the Cloudflare Worker on /api/contact (cloudflare/contact-worker.js),
     which checks Cloudflare Turnstile's token and emails the message on. Sent here with fetch so the
     visitor stays on the page; without JavaScript the Worker sends the browser back with ?gonderildi
     or ?hata, read below. */
  function initContactForm() {
    var form = $('form.cform');
    if (!form) return;
    var status = $('.cf-status', form), btn = $('.cf-send', form);
    var langIn = form.querySelector('input[name="lang"]');
    if (langIn) langIn.value = (document.documentElement.lang || 'tr').slice(0, 2) === 'en' ? 'en' : 'tr';
    function show(key) {
      $$('.cf-msg', status).forEach(function (p) { p.hidden = p.getAttribute('data-msg') !== key; });
    }
    /* a request for a Mass or a visit belongs to the church itself: choosing it shows where to
       write instead, and the message box and the send button step aside */
    var topic = form.querySelector('select[name="topic"]'), church = $('[data-cf-church]', form);
    var hideFor = [$('.cf-msgfield', form), $('.cf-turnstile', form), $('.cf-foot', form)];
    function onTopic() {
      var isChurch = !!topic && topic.value === 'kilise';
      if (church) church.hidden = !isChurch;
      hideFor.forEach(function (el) { if (el) el.hidden = isChurch; });
    }
    if (topic) { topic.addEventListener('change', onTopic); onTopic(); }
    var q = location.search;
    if (/[?&]gonderildi=1/.test(q)) show('ok');
    else { var m = q.match(/[?&]hata=(\w+)/); if (m) show(m[1] === 'fields' || m[1] === 'check' ? m[1] : 'error'); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      btn.disabled = true; form.classList.add('is-sending'); show('');
      fetch(form.getAttribute('action'), { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'error' }; }); })
        .then(function (d) {
          if (d && d.ok) { form.classList.add('is-sent'); form.reset(); onTopic(); show('ok'); }
          else { show(d && (d.error === 'fields' || d.error === 'check') ? d.error : 'error'); }
        })
        .catch(function () { show('error'); })
        .then(function () {
          btn.disabled = false; form.classList.remove('is-sending');
          if (window.turnstile) try { window.turnstile.reset(); } catch (x) { /* widget not ready */ }
          var shown = $('.cf-msg:not([hidden])', status); if (shown) shown.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    });
  }

  /* Printing (or Save as PDF) should show every <details> section in full,
     not just the ones the reader happened to have open (saint bios, FAQ
     answers). Opens them all right before the browser's print dialog, then
     restores whichever ones were actually open. Latin prayer text (.latin)
     is excluded: the print stylesheet hides it outright, screen/mobile keep
     it as a collapsed toggle either way. */
  /* ---------------------------------------------------------------
     An article is read as one long page that grows as it is read: the first screens are shown,
     the rest follows a part at a time as the reader nears the end of what is there. A link to a
     place further down (or a page opened at one), the browser's find (Ctrl/Cmd+F) and printing
     bring in everything up to it, or everything. The thin bar at the top shows how much of the
     whole article has been read, measured in its words, so it does not jump as parts come in.
     --------------------------------------------------------------- */
  function initArticleFlow() {
    var main = $('#main');
    if (!main || !document.body.hasAttribute('data-article')) return;
    var bar = document.createElement('div'), fill = document.createElement('span');
    bar.className = 'read-prog'; bar.setAttribute('aria-hidden', 'true'); bar.appendChild(fill);
    document.body.appendChild(bar);
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var len = function (el) { return (el.textContent || '').replace(/\s+/g, ' ').length; };
    /* the box that holds the article's parts: going in while one child holds nearly all of it */
    var box = main;
    for (var k = 0; k < 3; k++) {
      var kids = Array.prototype.slice.call(box.children).filter(function (el) { return !/^(SCRIPT|STYLE|TEMPLATE|DIALOG)$/.test(el.tagName); });
      if (kids.length >= 4) break;
      var big = kids.slice().sort(function (x, y) { return len(y) - len(x); })[0];
      if (!big || len(big) < len(box) * .7) break;
      box = big;
    }
    var parts = Array.prototype.slice.call(box.children).filter(function (el) {
      return !/^(SCRIPT|STYLE|TEMPLATE|DIALOG)$/.test(el.tagName) && !el.classList.contains('av-fixed') && !el.classList.contains('av-hero');
    });
    /* a part taller than a screen and a half is split into its own parts (going in, as above,
       while one child holds nearly all of it) */
    var split = function (el, depth) {
      if (depth > 4 || el.getBoundingClientRect().height < (window.innerHeight || 700) * 1.5 || /^(UL|OL|TABLE|FIGURE|P|BLOCKQUOTE|DETAILS|SVG)$/i.test(el.tagName)) return [el];
      var ks = Array.prototype.slice.call(el.children).filter(function (k) { return !/^(SCRIPT|STYLE|TEMPLATE|DIALOG)$/.test(k.tagName); });
      if (ks.length >= 3) return ks.reduce(function (a, k) { return a.concat(split(k, depth + 1)); }, []);
      var bigK = ks.slice().sort(function (x, y) { return len(y) - len(x); })[0];
      if (!bigK || len(bigK) < len(el) * .7) return [el];
      return ks.reduce(function (a, k) { return a.concat(k === bigK ? split(k, depth + 1) : [k]); }, []);
    };
    parts = parts.reduce(function (a, el) { return a.concat(split(el, 0)); }, []);
    parts.forEach(function (el) { el._kdLen = Math.max(1, len(el)); });
    var vh = function () { return window.innerHeight || 700; };
    /* the first screens stay; the rest waits */
    var shown = 0, h = 0, top0 = box.getBoundingClientRect().top + window.pageYOffset;
    while (shown < parts.length && (h < vh() * 1.6 || shown < 2)) { h = parts[shown].getBoundingClientRect().bottom + window.pageYOffset - top0; shown++; }
    /* data-no-flow: a page shown whole, without parts coming in as the reader scrolls */
    var later = $('[data-no-flow]', main) ? [] : parts.slice(shown);
    var hashEl = function () { try { return location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { return null; } };
    if (later.length > 1) {
      later.forEach(function (el) { el.classList.add('kd-later'); });
      var sentinel = document.createElement('div');
      sentinel.className = 'kd-more'; sentinel.setAttribute('aria-hidden', 'true');
      later[0].parentNode.insertBefore(sentinel, later[0]);
      var showUpTo = function (n, fade) {
        while (later.length && n > 0) {
          var el = later.shift(); n--;
          el.classList.remove('kd-later');
          if (fade && !still) el.classList.add('kd-in');
        }
        if (!later.length) { sentinel.remove(); if (io) io.disconnect(); }
        else { later[0].parentNode.insertBefore(sentinel, later[0]); if (io) { io.unobserve(sentinel); io.observe(sentinel); } }
        progress();
      };
      /* a batch: parts until about a screen more is there */
      var batch = function () {
        var added = 0, n = 0;
        while (later.length && (added < vh() * 1.2 || n === 0)) {
          var el = later[0]; showUpTo(1, true); n++;
          added += el.offsetHeight;
        }
      };
      var io = window.IntersectionObserver ? new IntersectionObserver(function (es) {
        if (es.some(function (e) { return e.isIntersecting; })) batch();
      }, { rootMargin: '0px 0px 900px 0px' }) : null;
      if (io) io.observe(sentinel); else showUpTo(later.length);
      /* everything up to an element further down */
      var bringIn = function (el) {
        if (!el || !later.length) return false;
        /* the part that holds it, or (a section split into parts) the first of its parts */
        var i = -1;
        later.forEach(function (p, j) { if (i < 0 && (p === el || p.contains(el) || el.contains(p))) i = j; });
        if (i < 0) return false;
        showUpTo(i + 1, false);
        /* and what follows it, so it does not land at the end of the page */
        var hh = 0;
        while (later.length && hh < vh()) { var nx = later[0]; showUpTo(1, false); hh += nx.offsetHeight; }
        return true;
      };
      var target = hashEl();
      if (bringIn(target)) requestAnimationFrame(function () { target.scrollIntoView(); });
      window.addEventListener('hashchange', function () { var t = hashEl(); if (bringIn(t)) t.scrollIntoView(); });
      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href*="#"]');
        if (!a) return;
        var u; try { u = new URL(a.href, location.href); } catch (err) { return; }
        if (u.pathname !== location.pathname || !u.hash) return;
        try { bringIn(document.getElementById(decodeURIComponent(u.hash.slice(1)))); } catch (err) { /* bad hash */ }
      }, true);
      document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) showUpTo(later.length); });
      window.addEventListener('beforeprint', function () { showUpTo(later.length); });
    }
    /* how much has been read: how far down the page the reader is, with the parts still to come
       counted at the height the text shown so far takes for its length; so the bar moves evenly
       up and down with the scroll, and does not jump when a part comes in */
    var raf = 0;
    function progress() {
      raf = 0;
      var doc = document.documentElement, H = doc.scrollHeight, rest = 0, shown = 0, shownH = 0;
      parts.forEach(function (el) {
        if (el.classList.contains('kd-later')) { rest += el._kdLen; return; }
        var r = el.getBoundingClientRect();
        if (r.height) { shown += el._kdLen; shownH += r.height; }
      });
      if (rest && shown) H += rest * shownH / shown;
      var max = Math.max(1, H - vh());
      fill.style.transform = 'scaleX(' + Math.max(0, Math.min(1, window.pageYOffset / max)).toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(progress); }, { passive: true });
    window.addEventListener('resize', function () { if (!raf) raf = requestAnimationFrame(progress); });
    progress();
  }

  /* ---------------------------------------------------------------
     An article's sections, a tap away: a round button with a list in the lower corner (once the
     reader is into the page) opens the list of the page's sections, the one being read marked;
     a section further down that has not come in yet is brought in first (initArticleFlow).
     --------------------------------------------------------------- */
  function initJumpList() {
    var main = $('#main');
    /* data-no-jl: a page without the list (the Rosary page, where it would cover the prayer panel's buttons) */
    if (!main || !document.body.hasAttribute('data-article') || $('[data-no-jl]', main)) return;
    /* the page's sections, and the numbered parts inside them (İslam'a Cevap, Tesbihin Tarihi) */
    var heads = $$('h2, h3.ic-sec-t', main).filter(function (h) {
      return !h.closest('.page-head, .av-hero, dialog, .ic-sources, .kt-nav') && !h.classList.contains('visually-hidden');
    });
    var items = [];
    heads.forEach(function (h) {
      var t = h.id ? h : h.closest('[id]');
      if (!t || !main.contains(t) || items.some(function (x) { return x.t === t; })) return;
      var name = pnow(avHead(h)).trim();
      if (name) items.push({ t: t, h: h, name: name, sub: h.tagName === 'H3' });
    });
    if (items.filter(function (x) { return !x.sub; }).length < 3) return;
    var box = document.createElement('div');
    box.className = 'jl';
    var jlOn = 'Bu sayfada', jlBtn = 'Bölümler: bu sayfadaki başlıklar';
    box.innerHTML = '<nav class="jl-panel" id="jl-panel" aria-label="' + jlOn + '" hidden><p class="jl-h">' + jlOn + '</p><ol></ol></nav>' +
      '<button type="button" class="jl-btn" aria-expanded="false" aria-controls="jl-panel" aria-label="' + jlBtn + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.6" cy="6.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.6" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.6" cy="17.5" r="1.2" fill="currentColor" stroke="none"/></svg>' +
      '<span class="jl-n" aria-hidden="true"></span></button>';
    var list = $('ol', box), panel = $('.jl-panel', box), btn = $('.jl-btn', box), num = $('.jl-n', box);
    var top = 0;
    items.forEach(function (it) {
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + it.t.id; a.textContent = it.name;
      if (it.sub) li.className = 'jl-sub';
      else a.insertAdjacentHTML('afterbegin', '<span class="jl-i">' + (++top) + '</span>');
      it.n = top;
      li.appendChild(a); list.appendChild(li); it.a = a;
    });
    document.body.appendChild(box);
    var open = function (on) {
      panel.hidden = !on; btn.setAttribute('aria-expanded', String(on)); box.classList.toggle('is-open', on);
      if (on) { var c = $('[aria-current="true"]', list); if (c) c.scrollIntoView({ block: 'nearest' }); }
    };
    btn.addEventListener('click', function () { open(panel.hidden); });
    list.addEventListener('click', function (e) { if (e.target.closest('a')) setTimeout(function () { open(false); }, 0); });
    document.addEventListener('click', function (e) { if (!panel.hidden && !box.contains(/** @type {Node} */ (e.target))) open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); } });
    var raf = 0;
    var update = function () {
      raf = 0;
      box.classList.toggle('is-on', window.pageYOffset > (window.innerHeight || 700) * .6);
      var line = (window.innerHeight || 700) * .3, cur = -1;
      items.forEach(function (it, i) { if (it.h.offsetParent && it.h.getBoundingClientRect().top <= line) cur = i; });
      /* at the foot of the page, the last section */
      if (window.pageYOffset + (window.innerHeight || 700) >= document.documentElement.scrollHeight - 4 && !$('.kd-later')) cur = items.length - 1;
      items.forEach(function (it, i) { it.a.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
      num.textContent = cur >= 0 ? items[cur].n + '/' + top : '';
    };
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', function () { if (!raf) raf = requestAnimationFrame(update); });
    update();
  }

  /* ----- A banner that is a window onto its painting (.ph-pan): the painting is shown at its
     full width, its top first; as the page scrolls, the painting moves inside the window, so the
     rest of it comes into view before the window leaves the screen */
  function initBannerPan() {
    var win = $('.ph-pan .ph-win'), img = win && $('img', win);
    if (!img) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var raf = 0;
    var run = function () {
      raf = 0;
      var wh = win.offsetHeight, ih = img.offsetHeight, extra = Math.max(0, ih - wh);
      var r = win.getBoundingClientRect(), s = Math.max(0, -r.top);
      /* the top of the painting first; the rest rises into view as the window scrolls away */
      var y = -Math.min(extra, s * extra / Math.max(1, wh * .8));
      img.style.setProperty('--pan', y.toFixed(1) + 'px');
      win.style.setProperty('--fade', Math.max(.25, 1 - s / Math.max(1, wh) * .75).toFixed(3));
    };
    var go = function () { if (!raf) raf = requestAnimationFrame(run); };
    window.addEventListener('scroll', go, { passive: true });
    window.addEventListener('resize', go);
    img.addEventListener('load', go);
    run();
  }

  /* ----- The twenty saints on Azizler: a ring like an unseen story around each portrait until
     that saint's page has been read; a saint's page marks itself read (kd-saints-seen) */
  function initSaintStories() {
    var KEY = 'kd-saints-seen', seen = [];
    try { seen = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { seen = []; }
    var page = $('[data-saint-page]');
    if (page) {
      var id = page.getAttribute('data-saint-page');
      if (seen.indexOf(id) < 0) { seen.push(id); try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch (e) { /* private mode */ } }
    }
    $$('.gs-st[data-gs]').forEach(function (a) {
      var read = seen.indexOf(a.getAttribute('data-gs')) >= 0;
      a.classList.toggle('is-seen', read);
      var n = $('.gs-n', a);
      if (n && !read && !$('.visually-hidden', a)) a.insertAdjacentHTML('beforeend', '<span class="visually-hidden">' + ', okunmadı' + '</span>');
    });
  }

  /* ----- Kilise'nin Tarihi: the era bar marks the era being read */
  function initEraNav() {
    var nav = $('.kt-nav');
    if (!nav || !window.IntersectionObserver) return;
    var links = $$('a', nav), seen = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
      var cur = null;
      links.forEach(function (a) { if (seen[a.getAttribute('href').slice(1)] && !cur) cur = a; });
      if (cur) links.forEach(function (a) { a.setAttribute('aria-current', a === cur ? 'true' : 'false'); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach(function (a) { var s = document.getElementById(a.getAttribute('href').slice(1)); if (s) io.observe(s); });
  }

  function initPrintExpand() {
    var reopen = [];
    window.addEventListener('beforeprint', function () {
      reopen = [];
      $$('details:not(.latin):not([open])').forEach(function (d) { d.setAttribute('open', ''); reopen.push(d); });
    });
    window.addEventListener('afterprint', function () {
      reopen.forEach(function (d) { d.removeAttribute('open'); });
      reopen = [];
    });
  }

  /* ---------------------------------------------------------------
     14. Kiliseler (parish locator): a rite <select> plus a
         one-city-at-a-time browsing mode. Every city is a native
         <details> (collapsed by default, works with no JS at all);
         this script only adds on top of that:
           - on load, only İstanbul's <details> is left visible, so
             the page opens on one manageable city instead of all ten;
           - a city pill shows only that city and opens it;
           - "Tüm Kiliseler" in the rite <select> shows every city,
             already expanded; a specific rite (e.g. Süryani Katolik)
             instead reveals and expands only the cities that actually
             have a matching church, wherever they are.
         The Mass-times disclosure per card is a separate, plain
         native <details>; its expanded body is styled as a floating
         popup on wide screens purely in CSS, no JS needed for that.
     --------------------------------------------------------------- */
  function initChurchFilter() {
    var select = $('#rite-select');
    if (!select) return;
    var cityLinks = $$('[data-city-link]');
    var cities = $$('.church-city');
    var cards = $$('.church-card');

    function showOnlyCity(id) { cities.forEach(function (sec) { sec.hidden = sec.id !== id; }); }
    function showAllCities() { cities.forEach(function (sec) { sec.hidden = false; }); }
    function markCurrentCity(id) {
      cityLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('data-city-link') === id); });
    }

    function applyRite(rite, expandAll) {
      cards.forEach(function (c) { c.hidden = rite !== 'all' && c.getAttribute('data-rite') !== rite; });
      showAllCities();
      if (rite !== 'all') {
        cities.forEach(function (sec) {
          var anyMatch = $$('.church-card', sec).some(function (c) { return !c.hidden; });
          sec.hidden = !anyMatch;
          if (anyMatch) sec.open = true;
        });
      } else if (expandAll) {
        cities.forEach(function (sec) { sec.open = true; });
      }
      markCurrentCity(null);
      select.value = rite;
    }

    function goToCity(id) {
      applyRite('all', false); // a fresh city view shows everything in it, regardless of any prior rite filter
      select.value = 'all';
      showOnlyCity(id);
      var sec = document.getElementById(id);
      if (sec) /** @type {HTMLDetailsElement} */ (sec).open = true;
      markCurrentCity(id);
    }

    select.addEventListener('change', function () { applyRite(select.value, select.value === 'all'); });
    cityLinks.forEach(function (a) { a.addEventListener('click', function () { goToCity(a.getAttribute('data-city-link')); }); });

    /* Phones' app view lists every city, and opens the one an address points to by itself */
    if (document.documentElement.classList.contains('av')) return;
    showOnlyCity('istanbul');
    markCurrentCity('istanbul');
    /* Arriving at a city or a church (from the home screen's Kilise Bul, say): open that city */
    var hashEl = location.hash && document.getElementById(hashId());
    var hashCity = hashEl && (hashEl.classList.contains('church-city') ? hashEl : hashEl.closest && hashEl.closest('.church-city'));
    if (hashCity) { goToCity(hashCity.id); requestAnimationFrame(function () { hashEl.scrollIntoView(); }); }
  }

  /* ---------------------------------------------------------------
     Folded sections (Neden Katoliğiz? hooks, Kutsal Kitap and Katolik
     Olma Süreci sections) open in place. A link to one (#ince-ayar,
     #zaten-hristiyan) opens it and brings it into view; the phone
     view does its own.
     --------------------------------------------------------------- */
  function initWhyHooks() {
    var wrap = $('main') || document.body;
    if (!$('.why-item, .kk-sec', wrap) || document.documentElement.classList.contains('av')) return;
    function openHash() {
      var id = hashId(), el = id && document.getElementById(id);
      if (!el || !wrap.contains(el) || !el.matches('.why-item, .kk-sec')) return;
      /** @type {HTMLDetailsElement} */ (el).open = true;
      requestAnimationFrame(function () { el.scrollIntoView({ block: 'start' }); });
    }
    window.addEventListener('hashchange', openHash);
    openHash();
  }

  /* ---------------------------------------------------------------
     Pinned section links (Kilise Bul, Meseller, Mucizeler, Sorular): the row
     gets .is-stuck once it reaches the header (for its glass band)
     and publishes its height as --toc-h so in-page jumps land below
     it. On the long lists it also highlights the section
     being read; Kilise Bul marks its one open city itself. When the
     row is too long for one line it scrolls sideways, keeping the
     highlighted link in view.
     --------------------------------------------------------------- */
  function initStickyToc() {
    var nav = $('.faq-toc.is-sticky');
    if (!nav) return;
    var root = document.documentElement, list = $('ul', nav);
    var links = $$('a[href^="#"]', nav);
    var spy = !links.some(function (a) { return a.hasAttribute('data-city-link'); });
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var smooth = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var top = 64, current, ticking = false;

    function measure() {
      root.style.setProperty('--toc-h', nav.offsetHeight + 'px');
      top = parseFloat(getComputedStyle(nav).top) || 64;
    }
    function reveal(a) {
      if (!a || list.scrollWidth <= list.clientWidth) return;
      var left = a.offsetLeft - (list.clientWidth - a.offsetWidth) / 2;
      list.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'auto' });
    }
    function update() {
      ticking = false;
      nav.classList.toggle('is-stuck', nav.getBoundingClientRect().top <= top + 1);
      if (!spy) return;
      var line = top + nav.offsetHeight + 24, pick = null;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) pick = links[i]; });
      if (pick === current) return;
      current = pick;
      links.forEach(function (a) {
        a.classList.toggle('is-current', a === pick);
        if (a === pick) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
      reveal(pick);
    }
    function queue() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    // Fade (and, for a mouse, an arrow on) whichever end of the row has links out of view
    function ends() {
      var max = list.scrollWidth - list.clientWidth;
      nav.classList.toggle('fade-l', max > 1 && list.scrollLeft > 1);
      nav.classList.toggle('fade-r', max > 1 && list.scrollLeft < max - 1);
    }
    var chev = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>'; };
    [['prev', 'm15 18-6-6 6-6', -1], ['next', 'm9 18 6-6-6-6', 1]].forEach(function (x) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'toc-arrow ' + x[0]; btn.tabIndex = -1; btn.setAttribute('aria-hidden', 'true');
      btn.innerHTML = chev(x[1]);
      btn.addEventListener('click', function () { list.scrollBy({ left: /** @type {number} */ (x[2]) * list.clientWidth * 0.7, behavior: smooth ? 'smooth' : 'auto' }); });
      nav.appendChild(btn);
    });
    list.addEventListener('scroll', ends, { passive: true });

    // First measurement: from the observer once the page has laid itself out, not synchronously here
    if (window.ResizeObserver) new ResizeObserver(function () { measure(); ends(); queue(); }).observe(nav);
    else requestAnimationFrame(function () { measure(); ends(); update(); });
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', function () { measure(); ends(); queue(); });
    links.forEach(function (a) { a.addEventListener('click', function () { reveal(a); }); });
  }


  /* ---------------------------------------------------------------
     FAQ question directory (sss.html): a pinned row of category tabs, each
     opening the list of its questions (on phones one button that opens a
     bottom sheet with all of them). A choice opens that answer and jumps
     to it at once, with no scrolling animation. The row also shows where
     the reader is: the current category, and on phones "12 / 39".
     --------------------------------------------------------------- */
  function initFaqDir() {
    var nav = $('.faq-dir');
    if (!nav) return;
    var root = document.documentElement;
    var tabs = $$('.fd-tab', nav), panels = $$('.fd-panel', nav), links = $$('.fd-list a', nav);
    var allBtn = $('.fd-all', nav), pos = $('.fd-pos', nav), scrim = $('.fd-scrim', nav), box = $('.fd-panels', nav);
    var items = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var mq = window.matchMedia('(max-width: 720px)');
    var restText = pos ? pos.textContent : '', ticking = false, current = -1;
    nav.classList.add('fd-on');

    function closeAll() {
      tabs.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
      panels.forEach(function (p) { p.classList.remove('is-open'); });
      nav.classList.remove('is-sheet');
      allBtn.setAttribute('aria-expanded', 'false');
      root.classList.remove('fd-lock');
    }
    function toCurrent(container) {
      var cur = $('a.is-current', container);
      if (cur) container.scrollTop = Math.max(0, cur.offsetTop - container.clientHeight / 2 + cur.offsetHeight / 2);
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        var was = tab.getAttribute('aria-expanded') === 'true';
        closeAll();
        if (was) return;
        var p = panels[i];
        tab.setAttribute('aria-expanded', 'true');
        p.classList.add('is-open');
        var x = tab.getBoundingClientRect().left - nav.getBoundingClientRect().left;
        p.style.setProperty('--x', Math.max(0, Math.min(x, nav.clientWidth - p.offsetWidth)) + 'px');
        toCurrent(p);
      });
    });
    allBtn.addEventListener('click', function () {
      var was = nav.classList.contains('is-sheet');
      closeAll();
      if (was) return;
      nav.classList.add('is-sheet');
      allBtn.setAttribute('aria-expanded', 'true');
      root.classList.add('fd-lock');
      toCurrent(box);
    });
    scrim.addEventListener('click', closeAll);
    document.addEventListener('click', function (e) { if (!mq.matches && !nav.contains(e.target)) closeAll(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
    var onMq = function () { closeAll(); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);

    function go(id, keepHash) {
      var el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'DETAILS') /** @type {HTMLDetailsElement} */ (el).open = true;
      closeAll();
      root.style.scrollBehavior = 'auto';
      el.scrollIntoView(true);
      root.style.scrollBehavior = '';
      if (!keepHash) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* file: or sandbox */ } }
      var s = $('summary', el);
      if (s) s.focus({ preventScroll: true });
      queue();
    }
    links.forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); go(a.getAttribute('href').slice(1)); });
    });
    function hashGo() { var id = hashId(); if (id && items.some(function (t) { return t && t.id === id; })) go(id, true); }
    window.addEventListener('hashchange', hashGo);
    hashGo();

    function update() {
      ticking = false;
      var top = parseFloat(getComputedStyle(nav).top) || 64;
      nav.classList.toggle('is-stuck', nav.getBoundingClientRect().top <= top + 1);
      var line = top + nav.offsetHeight + 24, pick = -1;
      items.forEach(function (t, i) {
        if (!t) return;
        var r = t.getBoundingClientRect();
        /* far-away sections are not rendered (content-visibility) and report an empty box */
        if (r.height && r.top <= line) pick = i;
      });
      if (pick === current) return;
      current = pick;
      links.forEach(function (a, i) {
        a.classList.toggle('is-current', i === pick);
        if (i === pick) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
      var cat = pick < 0 ? -1 : panels.indexOf(links[pick].closest('.fd-panel'));
      tabs.forEach(function (t, i) { t.classList.toggle('is-current', i === cat); });
      if (pos) pos.textContent = pick < 0 ? restText : (pick + 1) + ' / ' + links.length;
    }
    function queue() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    queue();
  }

  /* ---------------------------------------------------------------
     Kilise Bul (kiliseler.html) in Turkish and English: the page holds both and the
     switch shows one at once, with nothing loaded. The reading place is kept: the
     element at the top of the screen stays at the same height, even though the other
     language's text is longer or shorter. The pinned row's city buttons jump
     instantly and follow the city being read.
     --------------------------------------------------------------- */
  /* the band across each church card wears the colour of today's liturgy (liturgicalDay);
     without the script it keeps the stained-glass default */
  function initLitBand() {
    if ($('.kl-ch')) document.documentElement.setAttribute('data-lit', liturgicalDay(new Date(), 'en').colour);
  }
  /* Kilise Bul, Mass by language: one language at a time (a second tap clears it), kept in ?dil= */
  function initMassLang() {
    var box = $('.kl-lf');
    if (!box) return;
    var btns = $$('[data-lf]', box), status = $('.kl-lf-status', box), items = $$('.kl-lf-list li', box);
    function pick(l, user) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lf') === l ? 'true' : 'false'); });
      box.classList.toggle('has-pick', !!l);
      var nCh = 0, nMass = 0;
      items.forEach(function (li) {
        var on = !!l && (' ' + li.getAttribute('data-l') + ' ').indexOf(' ' + l + ' ') > -1;
        if (li.classList.contains('kl-lf-city')) on = !!l && $$('.kl-lf-ch', li).some(function (c) { return (' ' + c.getAttribute('data-l') + ' ').indexOf(' ' + l + ' ') > -1; });
        else if (on && li.classList.contains('kl-lf-ch')) nCh++;
        else if (on) nMass++;
        li.classList.toggle('is-match', on);
      });
      var b = btns.filter(function (x) { return x.getAttribute('data-lf') === l; })[0];
      if (b) {
        var tr = $('.kl-tr', b).textContent, en = $('.kl-en', b).textContent;
        status.innerHTML = '<span class="kl-tr">' + tr + ': ' + nCh + ' kilisede ' + nMass + ' ayin saati</span><span class="kl-en" lang="en">' + en + ': ' + nMass + (nMass === 1 ? ' Mass time' : ' Mass times') + ' in ' + nCh + (nCh === 1 ? ' church' : ' churches') + '</span>';
      } else status.textContent = '';
      if (user) {
        try { var u = new URL(location.href); if (l) u.searchParams.set('dil', l); else u.searchParams.delete('dil'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch (e) { /* not rewritable */ }
      }
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { pick(b.getAttribute('aria-pressed') === 'true' ? '' : b.getAttribute('data-lf'), true); });
    });
    box.classList.add('is-on');
    var q = /[?&]dil=([a-z]+)/.exec(location.search);
    pick(q && btns.some(function (b) { return b.getAttribute('data-lf') === q[1]; }) ? q[1] : '', false);
  }
  function initKlLang() {
    var sw = $('.kl-switch');
    if (!sw) return;
    var H = document.documentElement, KEY = 'kd-kl-lang', bar = $('.kl-bar');
    var ANCHORS = '.kl-ch, .kl-h, .kl-side, .kl-sum, .kl-lead, .faq-item, .cmap, .ch-pick, .conventions, .page-head, .crumbs';
    var title0 = document.title, titleEn = sw.getAttribute('data-title-en');
    var chips = $$('.kl-chips > ul a'), cities = chips.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    function isEn() { return H.classList.contains('kl-en-on'); }
    function paint() {
      var en = isEn();
      sw.setAttribute('aria-checked', en ? 'true' : 'false');
      H.lang = en ? 'en' : 'tr';
      if (titleEn) document.title = en ? titleEn : title0;
      $$('[data-aria-en]').forEach(function (el) {
        if (el._tr == null) el._tr = el.getAttribute('aria-label') || '';
        el.setAttribute('aria-label', en ? el.getAttribute('data-aria-en') : el._tr);
      });
    }
    function topLine() {
      var h = parseFloat(getComputedStyle(H).getPropertyValue('--header-h')) || 64;
      return h + (bar ? bar.offsetHeight : 0) + 12;
    }
    function jumpTo(fn) {
      H.style.scrollBehavior = 'auto';
      fn();
      H.style.scrollBehavior = '';
    }
    function setLang(en, user) {
      if (en === isEn()) return;
      /* the place being read: the smallest block that holds the line near the top of the screen
         (else the first one below it), and how far down that block the line is */
      var line = topLine(), el = /** @type {Element | null} */ (null), area = 1e12, next = /** @type {Element | null} */ (null), nextTop = 1e12;
      $$(ANCHORS).forEach(function (c) {
        if (c.closest('.kl-tr, .kl-en') || !c.offsetHeight) return;
        var r = c.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) { if (r.height * r.width < area) { area = r.height * r.width; el = c; } }
        else if (r.top > line && r.top < nextTop) { nextTop = r.top; next = c; }
      });
      if (!el) el = next;
      var rel = 0;
      if (el) { var r0 = el.getBoundingClientRect(); rel = Math.max(0, Math.min(1, (line - r0.top) / Math.max(1, r0.height))); }
      H.classList.toggle('kl-en-on', en);
      paint();
      if (el) {
        var r1 = el.getBoundingClientRect(), want = line - rel * r1.height, d = r1.top - want;
        if (Math.abs(d) > 0.5) jumpTo(function () { window.scrollBy(0, d); });
      }
      if (user) {
        try { localStorage.setItem(KEY, en ? 'en' : 'tr'); } catch (e) { /* private mode */ }
        try { var u = new URL(location.href); u.searchParams.set('lang', en ? 'en' : 'tr'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch (e) { /* not rewritable */ }
      }
      queue();
    }
    sw.addEventListener('click', function () { setLang(!isEn(), true); });
    $$('[data-kl-set]').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-kl-set') === 'en', true); }); });
    paint();

    /* the cities: an instant jump, and the city in view lit in the row */
    chips.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        var t = cities[i]; if (!t) return;
        e.preventDefault();
        jumpTo(function () { t.scrollIntoView(true); });
        try { history.replaceState(history.state, '', location.pathname + location.search + '#' + t.id); } catch (err) { /* not rewritable */ }
        queue();
      });
    });
    /* "Tüm şehirler" (desktop): the same instant jump, then the menu closes; a click outside or Escape closes it too */
    var all = $('.kl-all'), allLinks = all ? $$('ul a', all) : [];
    allLinks.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        var t = cities[i]; if (!t) return;
        e.preventDefault();
        all.open = false;
        jumpTo(function () { t.scrollIntoView(true); });
        try { history.replaceState(history.state, '', location.pathname + location.search + '#' + t.id); } catch (err) { /* not rewritable */ }
        queue();
      });
    });
    if (all) {
      document.addEventListener('click', function (e) { if (all.open && !all.contains(e.target)) all.open = false; });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && all.open) { all.open = false; $('summary', all).focus(); } });
    }
    /* the section jumps on the banner (map, news, questions): instant too */
    $$('.ph-jump a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
        e.preventDefault();
        jumpTo(function () { t.scrollIntoView(true); });
        try { history.replaceState(history.state, '', location.pathname + location.search + '#' + t.id); } catch (err) { /* not rewritable */ }
        queue();
      });
    });
    var ticking = false, cur = -2;
    function update() {
      ticking = false;
      if (bar) bar.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= (parseFloat(getComputedStyle(bar).top) || 64) + 1);
      var line = topLine() + 8, pick = -1;
      cities.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) pick = i; });
      if (pick === cur) return;
      cur = pick;
      chips.forEach(function (a, i) {
        a.classList.toggle('is-current', i === pick);
        if (i === pick) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
      allLinks.forEach(function (a, i) { a.classList.toggle('is-current', i === pick); });
      if (all) $('summary', all).classList.toggle('is-current', !!(chips[pick] && chips[pick].parentNode.classList.contains('kl-x')));
      var list = chips[0] && chips[0].closest('ul'), a = chips[pick];
      if (list && a && list.scrollWidth > list.clientWidth) list.scrollLeft = Math.max(0, a.offsetLeft - (list.clientWidth - a.offsetWidth) / 2);
    }
    function queue() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    queue();
  }

  /* ---------------------------------------------------------------
     11. Settings panel (the gear beside the logo): the language switch,
         then accessibility profile presets and individual settings
         (contrast, text spacing, a
         hover-to-read "screen reader" using the Web Speech API, etc.).
         All visual effects are CSS driven by data-a11y-* attributes on
         <html> (see styles.css) rather than a `filter`, which would
         otherwise break position:fixed descendants (header, dialogs).
         State persists in localStorage like the theme and text-size
         toggles; "Bigger Text" reuses that existing font-size toggle
         instead of keeping its own separate state.
     --------------------------------------------------------------- */
  function initA11y() {
    var toggleBtn = $('.settings-btn'), panel = $('#settings-panel');
    if (!toggleBtn || !panel) return;
    var closeBtn = $('.a11y-close', panel);
    var A11Y_KEY = 'kkio-a11y';
    var KEYS = ['reader', 'contrast', 'saturation', 'spacing', 'links', 'dyslexia', 'cursor'];
    var PROFILES = {
      motor:      { keys: ['cursor', 'spacing', 'links'], bigtext: false },
      blind:      { keys: ['reader', 'contrast'], bigtext: true },
      colorblind: { keys: ['saturation', 'links', 'contrast'], bigtext: false },
      dyslexia:   { keys: ['dyslexia', 'spacing'], bigtext: true }
    };
    var state = (function () { try { return JSON.parse(localStorage.getItem(A11Y_KEY) || '{}'); } catch (e) { return {}; } })();
    var speaking = null;

    function saveState() { try { localStorage.setItem(A11Y_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } }
    function bigTextOn() { return fontsizeLevel() !== '0'; }
    function setBigText(on) {
      if (on) document.documentElement.setAttribute('data-fontsize', '2'); else document.documentElement.removeAttribute('data-fontsize');
      try { localStorage.setItem(FONTSIZE_KEY, on ? '2' : '0'); } catch (e) { /* private mode */ }
      syncFontsize();
    }
    function stopReading() {
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* unsupported */ }
      if (speaking) { speaking.classList.remove('a11y-reading'); speaking = null; }
    }
    function speakEl(el) {
      if (!('speechSynthesis' in window) || el === speaking) return;
      /* Many elements carry a nested translation/original in a different
         language (e.g. a heading's English gloss span, a hidden Latin or
         "original English" toggle block) purely for sighted/print use.
         textContent would pull all of it in regardless of visibility or
         language, so the wrong-language portion gets read aloud in the
         page's voice. Strip any descendant whose lang doesn't match the
         language of the element actually being read. */
      var effLang = ((el.closest('[lang]') || document.documentElement).getAttribute('lang') || document.documentElement.lang || 'tr').split('-')[0];
      var clone = el.cloneNode(true);
      $$('[lang]', clone).forEach(function (n) {
        var l = (n.getAttribute('lang') || '').split('-')[0];
        if (l && l !== effLang) n.remove();
      });
      var text = (clone.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 500);
      if (!text) return;
      try { window.speechSynthesis.cancel(); } catch (e) { /* unsupported */ }
      if (speaking) speaking.classList.remove('a11y-reading');
      speaking = el;
      el.classList.add('a11y-reading');
      try {
        var u = new SpeechSynthesisUtterance(text);
        u.lang = effLang === 'en' ? 'en-US' : effLang === 'tr' ? 'tr-TR' : effLang;
        window.speechSynthesis.speak(u);
      } catch (e) { /* unsupported */ }
    }
    function apply() {
      KEYS.forEach(function (k) {
        if (state[k]) document.documentElement.setAttribute('data-a11y-' + k, '1');
        else document.documentElement.removeAttribute('data-a11y-' + k);
      });
      $$('.a11y-tile', panel).forEach(function (t) {
        var k = t.getAttribute('data-a11y-toggle');
        t.setAttribute('aria-pressed', String(k === 'bigtext' ? bigTextOn() : !!state[k]));
      });
      $$('.a11y-profile', panel).forEach(function (p) {
        var def = PROFILES[p.getAttribute('data-a11y-profile')];
        var on = !!def && def.keys.every(function (k) { return !!state[k]; }) && (!def.bigtext || bigTextOn());
        p.setAttribute('aria-pressed', String(on));
      });
      if (!state.reader) stopReading();
    }

    $$('.a11y-tile', panel).forEach(function (t) {
      var k = t.getAttribute('data-a11y-toggle');
      t.addEventListener('click', function () {
        if (k === 'bigtext') { setBigText(!bigTextOn()); apply(); return; }
        state[k] = !state[k];
        saveState();
        apply();
      });
    });
    $$('.a11y-profile', panel).forEach(function (p) {
      p.addEventListener('click', function () {
        var def = PROFILES[p.getAttribute('data-a11y-profile')];
        if (!def) return;
        var allOn = def.keys.every(function (k) { return !!state[k]; }) && (!def.bigtext || bigTextOn());
        def.keys.forEach(function (k) { state[k] = !allOn; });
        saveState();
        if (def.bigtext) setBigText(!allOn);
        apply();
      });
    });
    var resetBtn = $('.a11y-reset', panel);
    if (resetBtn) resetBtn.addEventListener('click', function () {
      state = {};
      saveState();
      setBigText(false);
      apply();
    });

    var open = false;
    /* Drops down under the gear beside the logo; on phones (CSS) it spans the width instead */
    function position() {
      if (window.innerWidth <= 480) { panel.style.left = ''; return; }
      var r = toggleBtn.getBoundingClientRect(), w = panel.offsetWidth;
      panel.style.left = Math.max(12, Math.min(r.left - 16, window.innerWidth - w - 12)) + 'px';
    }
    function show() {
      open = true;
      panel.hidden = false;
      position();
      nextFrame(function () { panel.classList.add('open'); });
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
    function hide() {
      open = false;
      panel.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      setTimeout(function () { if (!open) panel.hidden = true; }, 220);
    }
    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (open) hide(); else show();
    });
    if (closeBtn) closeBtn.addEventListener('click', hide);
    document.addEventListener('click', function (e) {
      if (open && !panel.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) hide();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { hide(); toggleBtn.focus(); }
    });
    window.addEventListener('resize', function () { if (open) position(); });

    var READ_SEL = 'h1,h2,h3,h4,p,a,li,button,summary,figcaption';
    document.addEventListener('mouseover', function (e) {
      if (!state.reader || panel.contains(e.target) || toggleBtn.contains(e.target)) return;
      var el = e.target.closest(READ_SEL);
      if (el) speakEl(el);
    });
    document.addEventListener('focusin', function (e) {
      if (!state.reader) return;
      var el = e.target.closest(READ_SEL);
      if (el) speakEl(el);
    });

    apply();
  }

  /* Keep --header-h equal to the real (sticky) header height so the reading bar and anchors never hide under it */
  function initMapLinks() {
    var links = $$('.map-link');
    if (!links.length) return;
    var ua = window.navigator.userAgent || '';
    var isIOS = /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    if (!isIOS) return;
    links.forEach(function (a) {
      var q = a.getAttribute('data-map-q');
      if (q) a.href = 'https://maps.apple.com/?q=' + encodeURIComponent(q);
    });
  }

  /* Church cards: the address button opens its popup on tap/click; outside tap or Escape closes it */
  function initAddrPops() {
    var wraps = $$('.kl-adr');
    if (!wraps.length) return;
    function closeAll(except) {
      wraps.forEach(function (w) {
        if (w === except) return;
        w.classList.remove('is-open');
        w.firstElementChild.setAttribute('aria-expanded', 'false');
      });
    }
    wraps.forEach(function (w) {
      var b = w.firstElementChild;
      b.addEventListener('click', function () {
        var open = !w.classList.contains('is-open');
        closeAll(w);
        w.classList.toggle('is-open', open);
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.kl-adr')) closeAll(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  }

  function initHeaderHeight() {
    var header = topBar();
    if (!header) return;
    function set(h) { document.documentElement.style.setProperty('--header-h', Math.round(h) + 'px'); }
    /* The observer reports the header's size right after the browser's own first layout, so
       nothing here makes it lay the page out early (reading offsetHeight at startup did) */
    if (window.ResizeObserver) {
      new ResizeObserver(function (entries) {
        var e = entries[0], box = /** @type {ResizeObserverSize} */ (e.borderBoxSize && (e.borderBoxSize[0] || e.borderBoxSize));
        set(box && box.blockSize ? box.blockSize : header.offsetHeight);
      }).observe(header);
    } else {
      var old = function () { set(header.offsetHeight); };
      requestAnimationFrame(old); window.addEventListener('resize', old);
    }
  }

  /* The bar at the top of the screen: the site's header, or on phones the app view's own bar */
  function topBar() { return $(document.documentElement.classList.contains('av') ? '.av-nav' : '.site-header'); }
  /* The address's #fragment as an id; a malformed escape (#%E0) gives '' instead of throwing */
  /* ----- A painting in the text (.art-sq, built by build.ps1 Art-Sq): a click opens it whole in a
     dialog, with its name, painter, place and a plain description of what it shows */
  function initArtView() {
    var figs = $$('.art-sq');
    if (!figs.length) return;
    var dlg = document.createElement('dialog');
    dlg.className = 'sources-dialog art-dlg';
    dlg.setAttribute('aria-labelledby', 'art-dlg-t');
    dlg.innerHTML = '<button type="button" class="sources-close" aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '<div class="art-dlg-pic"></div><h2 class="art-dlg-t" id="art-dlg-t"></h2><p class="art-dlg-m"></p><p class="art-dlg-d"></p>';
    document.body.appendChild(dlg);
    var close = function () { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); };
    $('.sources-close', dlg).addEventListener('click', close);
    /* a click on the backdrop, outside the box, closes it too */
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    /* the dialog empties when it closes, so a large painting is not kept in memory */
    dlg.addEventListener('close', function () { $('.art-dlg-pic', dlg).textContent = ''; });
    figs.forEach(function (fig) {
      var btn = $('.art-sq-btn', fig), pic = btn && $('picture', btn);
      if (!pic) return;
      btn.addEventListener('click', function () {
        /* the same picture at the size of the dialog: the browser picks the larger file */
        var big = /** @type {HTMLElement} */ (pic.cloneNode(true));
        $$('source, img', big).forEach(function (el) { if (el.hasAttribute('sizes')) el.setAttribute('sizes', '(min-width: 1000px) 58rem, 100vw'); });
        var img = $('img', big);
        if (img) { img.className = 'art-dlg-img'; img.removeAttribute('style'); img.removeAttribute('loading'); img.alt = fig.getAttribute('data-t') || ''; }
        var box = $('.art-dlg-pic', dlg);
        box.textContent = ''; box.appendChild(big);
        $('.art-dlg-t', dlg).textContent = fig.getAttribute('data-t') || '';
        $('.art-dlg-m', dlg).textContent = [fig.getAttribute('data-a'), fig.getAttribute('data-loc')].filter(Boolean).join(' · ');
        var d = $('.art-dlg-d', dlg), dt = fig.getAttribute('data-d') || '';
        d.textContent = dt; d.hidden = !dt;
        if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      });
    });
  }

  function hashId() { try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return ''; } }
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  /* each part of the page starts on its own: one that fails leaves the others working */
  ready(function () {
    [
      initFrameBust, initHeaderHeight, initTheme, initFontSize, initContactForm, initNavToday, initHistory,
      initSearch, initReader, initDrawer, initNav, initDeskNav, initSources, initRefs, initRosary, initRosaryTracker, initAnatoliaMap, initDrawings, initSaints, initMass, initHome, initPrintExpand,
      initChurchFilter, initStickyToc, initFaqDir, initLitBand, initKlLang, initMassLang, initWhyHooks, initMapLinks, initAddrPops, initA11y, initAppView, initReadMarks, initToTop, initArticleFlow, initJumpList, initBannerPan, initArtView, initSaintStories, initEraNav, initChurchMap, initChurchPick, initLayoutSwitch
    ].forEach(function (init) { try { init(); } catch (e) { if (window.console) console.error(e); } });
  });
})();
