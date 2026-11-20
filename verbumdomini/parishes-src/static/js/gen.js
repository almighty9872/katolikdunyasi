/* The Print and PDF studio (/generator). Left: the parish, a template, a size and the content; right: a live preview of
   the printed sheets at scale, with crop marks and the back side. Everything is made in the browser from public data:
     /api/parishes and /api/parishes/<slug> (the parish's times, specials, ministries, clergy and web bulletin)
     data/readings-ca.json (Canadian lectionary references), bible/<book>.json (Douay-Rheims, public domain),
     data/saints-index.json, prayers-index.json, art-index.json and reference-index.json (built by tools/parishes.py)
   A handout is a list of panels, each a list of blocks ({t: 'h1', x: '...'}, {t: 'kv', rows}, {t: 'qr', url}...). This file
   draws the blocks as HTML for the preview and for printing; gen-pdf.js (with vendor/jspdf.umd.min.js, loaded on the first
   "Download PDF") lays the same blocks out as a vector PDF with the standard PDF fonts. When a handout quotes Scripture or
   cites the Catechism or the Code of Canon Law, the attribution footer is added by itself (foot() below).
   Address: /generator?parish=<slug>&tpl=bulletin|pew|saint|welcome|packet&fmt=letter|half|trifold|card|bookmark&date=YYYY-MM-DD */
(function () {
  var P = window.PP, S = window.PPS, L = window.VDLit, $ = function (id) { return document.getElementById(id); };
  var esc = P.esc, SITE = 'https://parishes.verbumdomini.ca';
  // Sizes in inches. sheet: the Letter sheet the copies go on; cols x rows copies; panels: across one side of one copy
  var FMT = {
    letter: { w: 8.5, h: 11, sheet: [8.5, 11], cols: 1, rows: 1, panels: 1, base: 11, pad: 0.55, flip: 'long edge' },
    half: { w: 5.5, h: 8.5, sheet: [11, 8.5], cols: 2, rows: 1, panels: 1, base: 9.6, pad: 0.4, flip: 'short edge' },
    trifold: { w: 11, h: 8.5, sheet: [11, 8.5], cols: 1, rows: 1, panels: 3, base: 8.8, pad: 0.32, flip: 'short edge' },
    card: { w: 4.25, h: 5.5, sheet: [8.5, 11], cols: 2, rows: 2, panels: 1, base: 8.6, pad: 0.26, flip: 'long edge' },
    bookmark: { w: 2.5, h: 7, sheet: [11, 8.5], cols: 4, rows: 1, panels: 1, base: 7.6, pad: 0.17, flip: 'short edge' }
  };
  var HINT = { bulletin: 'half', pew: 'card', saint: 'letter', welcome: 'trifold', packet: 'letter' };
  var COL = { green: '#2f6b3a', violet: '#5b3f8f', rose: '#a8506f', red: '#9a2a22', white: '#8a6a14' };
  var D = { saints: [], prayers: [], art: [], readings: {}, ref: { items: [] }, books: [] }, BIB = {}, PAR = null, LIST = [], side = 'front', last = null;
  var q = new URLSearchParams(location.search);

  // ---------- data ----------
  function getJSON(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
  function book(name) {
    var b = D.books.filter(function (x) { return x.t === name || x.t.replace(/^Acts of the Apostles$/, 'Acts') === name || (name === 'Psalm' && x.s === 'psalms') || (name === 'Song of Solomon' && x.s === 'song-of-songs'); })[0];
    if (!b) return Promise.resolve(null);
    return BIB[b.s] || (BIB[b.s] = getJSON('/bible/' + b.s + '.json').catch(function () { delete BIB[b.s]; return null; }));
  }
  // "1 Corinthians 12:31–13:8", "Romans 8:31-35, 37-39", "Song of Songs 2:8-10, 14, 16; 8:6-7" -> [[chapter, verse], ...]
  function parseRef(ref) {
    var m = /^(.+?)\s+(\d+):(.+)$/.exec(String(ref).trim()); if (!m) return null;
    var name = m[1], ch = +m[2], out = [];
    m[3].split(';').forEach(function (seg, si) {
      seg = seg.trim(); var c = /^(\d+):(.*)$/.exec(seg); if (si > 0 && c) { ch = +c[1]; seg = c[2]; } else if (si > 0 && !c) return;
      seg.split(',').forEach(function (part) {
        var r = /^(\d+)[a-z]*\s*(?:[-–]\s*(?:(\d+):)?(\d+)[a-z]*)?$/.exec(part.trim()); if (!r) return;
        var a = +r[1], c2 = r[2] ? +r[2] : ch, b = r[3] ? +r[3] : a;
        if (c2 !== ch) { for (var v = a; v <= 200; v++) out.push([ch, v, 1]); ch = c2; a = 1; }
        for (var w = a; w <= b; w++) out.push([ch, w]);
      });
    });
    return { book: name, verses: out };
  }
  // The text of a reference (no Psalms: the Douay-Rheims numbers them differently from the lectionary)
  function passage(ref, max) {
    var r = parseRef(ref); if (!r || /^Psalm/.test(r.book)) return Promise.resolve(null);
    return book(r.book).then(function (b) {
      if (!b) return null;
      var vs = [];
      r.verses.forEach(function (x) { var c = b.c[x[0] - 1], t = c && c[x[1] - 1]; if (t) vs.push(t); });
      if (!vs.length) return null;
      var cut = max && vs.length > max;
      return { ref: ref, text: (cut ? vs.slice(0, max) : vs).join(' ').replace(/\s+/g, ' ') + (cut ? ' …' : ''), cut: !!cut };
    });
  }

  // ---------- parish helpers (placeholders without a parish) ----------
  function par() { return PAR ? PAR.parish : { name: 'Your Parish', street: '', city: 'Toronto', postal_code: '', phone: '', email: '', website_url: '', slug: '', clergy: [], languages: [], accessibility: {} }; }
  function times(kind) { return PAR ? PAR.mass_times.filter(function (r) { return r.kind === kind; }) : []; }
  function kv(kind, short) {
    var ord = function (d) { return kind === 'sunday' ? (d === 6 ? -1 : d) : (d === 0 ? 7 : d); }, by = [], DN = short ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : S.DAYS;
    times(kind).slice().sort(function (a, b) { return ord(a.day) - ord(b.day) || (a.start_time < b.start_time ? -1 : 1); }).forEach(function (r) {
      var k = DN[r.day] + (r.note === 'Vigil' && !short ? ' (vigil)' : ''), t = S.time(r.start_time) + (r.end_time ? '–' + S.time(r.end_time) : '') + (r.language && r.language !== 'English' ? ' (' + r.language + ')' : '') + (r.note && r.note !== 'Vigil' && !short ? ', ' + r.note : '');
      var l = by[by.length - 1]; if (l && l[0] === k) l[1] += ', ' + t; else by.push([k, t]);
    });
    return by;
  }
  function addr() { var p = par(); return [p.street, [p.city, 'ON', p.postal_code].filter(Boolean).join(' ')].filter(Boolean).join(', '); }
  function pageUrl() { var p = par(); return p.slug ? SITE + '/parish/' + p.slug : SITE + '/directory'; }
  function contact() { var p = par(); return [p.phone, p.email, (p.website_url || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')].filter(Boolean).join(' · '); }
  function timesBlocks(kinds, short, label) {
    var out = [], names = { sunday: 'Weekend Masses', weekday: 'Weekday Masses', confession: 'Confession', adoration: 'Adoration' };
    kinds.forEach(function (k) {
      var rows = kv(k, short);
      if (rows.length) out.push({ t: 'h3', x: names[k] }, { t: 'kv', rows: rows });
      else if (PAR && (k === 'confession' || k === 'sunday')) out.push({ t: 'h3', x: names[k] }, { t: 'p', sm: 1, x: k === 'confession' ? 'Ask the parish office or a priest after Mass.' : 'Call the parish office.' });
      var note = PAR && (k === 'confession' ? PAR.parish.confession_notes : k === 'adoration' ? PAR.parish.adoration_notes : '');
      if (note) out.push({ t: 'p', sm: 1, x: note });
    });
    if (!PAR && label !== false) out.push({ t: 'p', sm: 1, x: 'Choose your parish above to print its Mass and Confession times here.' });
    return out;
  }
  function specialsBlock(days) {
    if (!PAR) return [];
    var t = S.now().date, rows = (PAR.specials || []).filter(function (x) { return x.event_date >= t && x.event_date <= S.addDays(t, days); });
    if (!rows.length) return [];
    return [{ t: 'h3', x: 'Special dates' }, { t: 'kv', rows: rows.slice(0, 8).map(function (x) { return [S.nice(x.event_date), x.occasion_name + (x.start_time ? ', ' + S.time(x.start_time) : x.category === 'office_closed' ? ': office closed' : x.category === 'no_mass' ? ': no Mass' : '')]; }) }];
  }
  function prayer(title) { return D.prayers.filter(function (x) { return x.title === title; })[0]; }
  function prayerBlocks(title, use) {
    var p = prayer(title); if (!p || !p.text) return [];
    return [{ t: 'h3', x: p.title }, { t: 'verse', x: p.text }];
  }
  function artFor(auto) {
    var v = $('g-art').value; if (!v) return null;
    if (v !== 'auto') return D.art.filter(function (a) { return a.id === v; })[0] || null;
    return auto || null;
  }
  function artByTag(tags) {
    for (var i = 0; i < tags.length; i++) { var a = D.art.filter(function (x) { return x.tags.indexOf(tags[i]) >= 0; }); if (a.length) return a[(new Date().getDate()) % a.length]; }
    return null;
  }
  function imgBlock(a, h, use) { if (!a) return []; use.art.push(a); return [{ t: 'img', src: a.img, alt: a.title + (a.artist ? ' by ' + a.artist : ''), h: h, cap: (a.artist ? a.artist + ', ' : '') + a.title }]; }
  function litOf(date) { var x = date.split('-'); return L ? L.litDay(new Date(+x[0], +x[1] - 1, +x[2])) : { title: '', season: '', col: 'green' }; }

  // ---------- options of each template ----------
  function o(id) { return $('g-o-' + id); }
  function checked(id) { var e = o(id); return !!(e && e.checked); }
  function val(id) { var e = o(id); return e ? e.value : ''; }
  function sel(id, label, opts, cur) { return '<label>' + esc(label) + ' <select id="g-o-' + id + '">' + opts.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === cur ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></label>'; }
  function chk(id, label, on) { return '<label class="pp-chk"><input id="g-o-' + id + '" type="checkbox"' + (on ? ' checked' : '') + '> ' + esc(label) + '</label>'; }
  function prayerOpts() { return [['', 'No prayer']].concat(D.prayers.filter(function (x) { return x.text; }).map(function (x) { return [x.title, x.title + ' (' + x.category + ')']; })); }
  function nextSunday() { var d = S.now().date; while (S.dayOf(d) !== 0) d = S.addDays(d, 1); return d; }
  function todaysSaint() {
    var n = S.now(), m = +n.date.slice(5, 7), d = +n.date.slice(8, 10);
    for (var i = 0; i < 40; i++) {
      var x = S.addDays(n.date, i), mm = +x.slice(5, 7), dd = +x.slice(8, 10);
      var hit = D.saints.filter(function (s) { return s.month === mm && s.day === dd; })[0];
      if (hit) return hit;
    }
    return D.saints[0];
  }
  function saintKey(s) { return s.name + '|' + (s.month || 'e') + '|' + (s.day || s.easter); }
  function saintDate(s) {
    if (s.month) return S.MON[s.month - 1] + ' ' + s.day;
    var y = S.now().year, e = S.easter(y), d = S.addDays(e, s.easter);
    if (d < S.now().date) d = S.addDays(S.easter(y + 1), s.easter);
    return S.nice(d) + ', ' + d.slice(0, 4);
  }
  var OPTS = {
    bulletin: function () {
      return '<label>For the Sunday or feast of <input id="g-o-date" type="date" value="' + esc(q.get('date') || nextSunday()) + '"></label>' +
        chk('gospel', 'Print the Gospel text (Douay-Rheims)', true) + chk('times', 'Mass and Confession times on the back', true) +
        chk('bul', 'Announcements and intentions from this week’s web bulletin', true);
    },
    pew: function () {
      return sel('prayer', 'Prayer', prayerOpts(), 'Act of Contrition') +
        sel('exam', 'Examination of conscience', [['', 'None']].concat(D.prayers.filter(function (x) { return x.points; }).map(function (x) { return [x.id, x.title.replace('Examination of conscience: ', '')]; })), '') +
        chk('mass', 'Weekend Mass times too', true);
    },
    saint: function () {
      var s = todaysSaint();
      return '<label>Find a saint <input id="g-o-sq" type="search" autocomplete="off" placeholder="Name, patron of…"></label>' +
        '<label>Saint <select id="g-o-saint">' + saintOptions('', s ? saintKey(s) : '') + '</select></label>' + sel('prayer', 'Prayer', prayerOpts(), 'Glory be to the Father');
    },
    welcome: function () { return chk('refs', 'Canon Law and Catechism references for each sacrament', false) + sel('prayer', 'Prayer on the back', prayerOpts(), 'Our Father'); },
    packet: function () {
      return sel('occ', 'For', [['wedding', 'A wedding'], ['funeral', 'A funeral']], q.get('occ') || 'wedding') + chk('text', 'Print the full texts (Douay-Rheims)', true) + chk('psalm', 'Responsorial psalm choices (references)', true);
    }
  };
  function saintOptions(needle, cur) {
    needle = (needle || '').toLowerCase();
    var list = D.saints.filter(function (s) { return !needle || (s.name + ' ' + s.title + ' ' + s.patronage.join(' ')).toLowerCase().indexOf(needle) >= 0; }).slice(0, 400);
    return list.map(function (s) { var k = saintKey(s); return '<option value="' + esc(k) + '"' + (k === cur ? ' selected' : '') + '>' + esc(s.name + ' (' + saintDate(s) + ')') + '</option>'; }).join('');
  }

  // ---------- templates: each returns a promise of panels (or {flow: blocks}) ----------
  var WEDDING = { ot: ['Genesis 1:26-28, 31', 'Genesis 2:18-24', 'Ruth 1:16-17', 'Song of Songs 2:8-10, 14, 16; 8:6-7', 'Jeremiah 31:31-34'],
    ps: ['Psalm 33', 'Psalm 34', 'Psalm 103', 'Psalm 112', 'Psalm 128', 'Psalm 145', 'Psalm 148'],
    nt: ['Romans 12:1-2, 9-18', '1 Corinthians 12:31–13:8', 'Ephesians 5:2, 21-33', 'Colossians 3:12-17', '1 John 4:7-12', 'Revelation 19:1, 5-9'],
    g: ['Matthew 5:1-12', 'Matthew 5:13-16', 'Matthew 19:3-6', 'Matthew 22:35-40', 'Mark 10:6-9', 'John 2:1-11', 'John 15:9-12', 'John 15:12-16', 'John 17:20-26'] };
  var FUNERAL = { ot: ['Job 19:1, 23-27', 'Wisdom 3:1-9', 'Wisdom 4:7-15', 'Isaiah 25:6-9', 'Lamentations 3:17-26', 'Daniel 12:1-3', '2 Maccabees 12:43-46'],
    ps: ['Psalm 23', 'Psalm 25', 'Psalm 27', 'Psalm 42', 'Psalm 63', 'Psalm 103', 'Psalm 116', 'Psalm 122', 'Psalm 130'],
    nt: ['Romans 5:5-11', 'Romans 6:3-9', 'Romans 8:31-35, 37-39', 'Romans 14:7-12', '1 Corinthians 15:51-57', '2 Corinthians 5:1, 6-10', '1 Thessalonians 4:13-18', '2 Timothy 2:8-13', '1 John 3:1-2', 'Revelation 21:1-7'],
    g: ['Matthew 5:1-12', 'Matthew 11:25-30', 'Luke 12:35-40', 'Luke 24:13-35', 'John 6:37-40', 'John 11:17-27', 'John 12:23-28', 'John 14:1-6'] };
  var SACR = [
    ['Baptism', 'For infants, parents call the office a few months ahead for preparation; adults begin with OCIA.', 'CCC 1213', 'can. 849'],
    ['First Reconciliation and Communion', 'Children prepare in Grade 2, with the parish and the Catholic school.', 'CCC 1322', 'can. 912'],
    ['Confirmation', 'Usually in Grade 7 or 8, with a sponsor who is a confirmed, practising Catholic.', 'CCC 1285', 'can. 879'],
    ['Marriage', 'Contact the office at least a year before the wedding for preparation and the paperwork.', 'CCC 1601', 'can. 1063'],
    ['Anointing of the Sick', 'Call the office for anyone seriously ill, before surgery, or frail with age.', 'CCC 1499', 'can. 998'],
    ['Funerals', 'Families call the funeral home and the parish office to plan the Funeral Mass.', 'CCC 1680', 'can. 1176'],
    ['Becoming Catholic (OCIA)', 'Adults who want to be baptized or received into the Church meet weekly with the parish team.', 'CCC 1229', 'can. 788']
  ];
  function refItem(key) { var n = +key.replace(/\D/g, ''), src = /^CCC/.test(key) ? 'CCC' : 'CIC'; return D.ref.items.filter(function (r) { return r.src === src && n >= r.from && n <= r.to; })[0]; }
  var TPLS = {
    bulletin: function (c) {
      var date = val('date') || nextSunday(), e = D.readings[date], lit = litOf(date), when = S.nice(date, true) + ', ' + date.slice(0, 4);
      c.accent = COL[lit.col] || COL.white;
      var a = artFor(artByTag(lit.season === 'Ordinary Time' ? ['Eucharist', 'Marian'] : [lit.season.replace(' Season', ''), lit.season === 'Holy Week' ? 'Lent' : '', 'Eucharist']));
      var p = par();
      var cover = [{ t: 'kick', x: lit.season + ' · ' + lit.col }, { t: 'h1', x: (e && e.t) || lit.title }, { t: 'p', x: when, c: 1, sm: 1 }]
        .concat(imgBlock(a, c.fmt === 'bookmark' ? 0.32 : 0.48, c.use)).concat([{ t: 'h2', x: p.name, c: 1 }, { t: 'p', sm: 1, c: 1, x: addr() }]);
      var rd = [{ t: 'h2', x: 'This Sunday’s readings' }];
      if (e) { c.use.lect = 1; rd.push({ t: 'kv', rows: [['First reading', e.r1], ['Psalm', e.ps], ['Second reading', e.r2], ['Gospel', e.g]].filter(function (x) { return x[1]; }) }); }
      else rd.push({ t: 'p', sm: 1, x: 'The readings for this date are not in our calendar yet (it covers the coming weeks). Choose a nearer Sunday.' });
      var max = { letter: 30, half: 16, trifold: 18, card: 7, bookmark: 5 }[c.fmt];
      return (e && checked('gospel') ? passage(e.g, max) : Promise.resolve(null)).then(function (g) {
        var gos = g ? (c.use.scripture = 1, [{ t: 'h3', x: 'The Gospel' }, { t: 'verse', ref: g.ref + ' (Douay-Rheims)', x: g.text }]) : [];
        var back = [], wb = PAR && PAR.bulletin && checked('bul') && PAR.bulletin.week_of === date ? PAR.bulletin : null;
        if (checked('times')) back = back.concat([{ t: 'h2', x: 'Mass times' }]).concat(timesBlocks(['sunday', 'weekday', 'confession'], c.fmt === 'bookmark' || c.fmt === 'card')).concat(specialsBlock(21));
        if (wb && wb.intentions.length) back.push({ t: 'h3', x: 'Mass intentions' }, { t: 'kv', rows: wb.intentions.map(function (x) { return [x.when, x.intention + (x.by ? ' (' + x.by + ')' : '')]; }) });
        if (wb && wb.announcements.length) { back.push({ t: 'h3', x: 'Announcements' }); wb.announcements.forEach(function (x) { back.push({ t: 'p', x: x.title + (x.body ? ': ' + x.body : '') }); }); }
        back.push({ t: 'qr', url: pageUrl(), cap: 'Live Mass times', size: 0.34 });
        if (c.n === 6) return [cover, rd.concat(gos.slice(0, 1)), gos.slice(1), back.slice(0, Math.ceil(back.length / 2)), back.slice(Math.ceil(back.length / 2), -1), [{ t: 'h2', x: p.name }, { t: 'p', sm: 1, x: addr() }, { t: 'p', sm: 1, x: contact() }, back[back.length - 1]]];
        return [cover, rd.concat(gos).concat(back)];
      });
    },
    pew: function (c) {
      var p = par(), small = c.fmt === 'bookmark';
      var front = [{ t: 'kick', x: p.name }, { t: 'h1', x: small ? 'Confession' : 'Confession and Adoration' }]
        .concat(timesBlocks(['confession', 'adoration'], small, false)).concat(specialsBlock(30).length ? specialsBlock(30) : [])
        .concat(checked('mass') ? timesBlocks(['sunday'], true, false) : [])
        .concat([{ t: 'qr', url: pageUrl(), cap: 'Live times: ' + pageUrl().replace('https://', ''), size: small ? 0.62 : 0.36 }]);
      var back = val('prayer') ? prayerBlocks(val('prayer'), c.use) : [];
      var ex = D.prayers.filter(function (x) { return x.id === val('exam'); })[0];
      if (ex) back.push({ t: 'h3', x: 'Examine your conscience' }, { t: 'p', it: 1, x: ex.title.replace('Examination of conscience: ', '') }, { t: 'list', items: ex.points.slice(0, small ? 5 : 10) });
      back.push({ t: 'p', sm: 1, x: 'Tell the priest how long since your last confession, confess your sins, listen to his counsel, pray the Act of Contrition and receive absolution.' });
      if (c.n === 6) return [front.slice(0, 2), front.slice(2, -1), back, [], [front[front.length - 1]], [{ t: 'h2', x: p.name }, { t: 'p', sm: 1, x: addr() }, { t: 'p', sm: 1, x: contact() }]];
      return [front, back];
    },
    saint: function (c) {
      var k = val('saint'), s = D.saints.filter(function (x) { return saintKey(x) === k; })[0] || todaysSaint();
      if (!s) return Promise.resolve([[{ t: 'p', x: 'The saints could not be loaded.' }], []]);
      var a = artFor(s.img ? D.art.filter(function (x) { return x.img === s.img; })[0] : artByTag(['Saints']));
      var front = [{ t: 'kick', x: saintDate(s) + ' · ' + s.rank }, { t: 'h1', x: s.name }].concat(s.title ? [{ t: 'p', it: 1, c: 1, x: s.title }] : [])
        .concat(imgBlock(a, c.fmt === 'letter' ? 0.42 : 0.36, c.use))
        .concat(s.patronage.length ? [{ t: 'h3', x: 'Patron of' }, { t: 'p', x: s.patronage.join(', ') }] : []);
      var bio = s.bio.split(/\n\n+/).map(function (x) { return { t: 'p', x: x }; });
      var back = [{ t: 'h2', x: 'Life' }].concat(bio).concat(val('prayer') ? prayerBlocks(val('prayer'), c.use) : [])
        .concat([{ t: 'rule' }, { t: 'p', sm: 1, x: par().name + (PAR ? ' · ' + addr() : '') }, { t: 'qr', url: pageUrl(), cap: 'Mass times', size: 0.22 }]);
      if (c.n === 6) return [front, bio.slice(0, 2), bio.slice(2), prayerBlocks(val('prayer'), c.use), [], back.slice(-3)];
      return [front, back];
    },
    welcome: function (c) {
      var p = par(), a = artFor(artByTag(['Eucharist', 'Saints'])), refs = checked('refs');
      var cover = [{ t: 'kick', x: 'Welcome to' }, { t: 'h1', x: p.name }].concat(imgBlock(a, 0.46, c.use)).concat([{ t: 'p', c: 1, x: addr() }, { t: 'p', c: 1, it: 1, x: 'We are glad you are here.' }]);
      var mass = [{ t: 'h2', x: 'Mass and Confession' }].concat(timesBlocks(['sunday', 'weekday', 'confession', 'adoration'], c.fmt === 'card' || c.fmt === 'bookmark'));
      var sac = [{ t: 'h2', x: 'The sacraments' }];
      SACR.forEach(function (x) {
        var r1 = refs && refItem(x[2]), r2 = refs && refItem(x[3]);
        if (r1) c.use.ccc = 1; if (r2) c.use.cic = 1;
        sac.push({ t: 'h3', x: x[0] }, { t: 'p', x: x[1] + (refs && (r1 || r2) ? ' (' + [r1 && r1.ref, r2 && r2.ref].filter(Boolean).join('; ') + ')' : '') });
      });
      var min = [{ t: 'h2', x: 'Get involved' }];
      var ms = PAR ? PAR.ministries : [];
      if (ms.length) ms.slice(0, 12).forEach(function (m) { min.push({ t: 'p', x: m.name + (m.schedule_text ? ': ' + m.schedule_text : '') }); });
      else min.push({ t: 'p', x: 'Choir, readers, servers, hospitality, youth, outreach to the poor and the sick: ask the office how you can help.' });
      var cl = [{ t: 'h2', x: 'Clergy and office' }];
      if (p.pastor_name) cl.push({ t: 'kv', rows: [['Pastor', p.pastor_name]].concat((p.clergy || []).map(function (x) { return [x.role || 'Clergy', x.name]; })) });
      if (p.office_hours) cl.push({ t: 'h3', x: 'Office hours' }, { t: 'p', x: p.office_hours });
      if (contact()) cl.push({ t: 'p', x: contact() });
      var ax = Object.keys(P.AX).filter(function (k) { return (p.accessibility || {})[k] === true; }).map(function (k) { return P.AX[k][0]; });
      if (ax.length) cl.push({ t: 'h3', x: 'Accessibility' }, { t: 'list', items: ax });
      if ((p.languages || []).length) cl.push({ t: 'p', sm: 1, x: 'Languages: ' + p.languages.join(', ') });
      var backc = [{ t: 'h2', x: 'Register with the parish' }, { t: 'p', x: 'Registered parishioners receive tax receipts for their offerings and make sacraments easier to arrange. Ask at the office or after Mass.' },
        { t: 'qr', url: pageUrl(), cap: 'Our page with live times', size: 0.5 }].concat(val('prayer') ? prayerBlocks(val('prayer'), c.use) : []);
      if (c.n === 6) return [cover, mass, sac, min, cl, backc];
      return [cover.concat(mass), sac.concat(min).concat(cl).concat(backc.slice(0, 3))];
    },
    packet: function (c) {
      var W = val('occ') === 'funeral' ? FUNERAL : WEDDING, wed = W === WEDDING, text = checked('text'), p = par();
      var head = [{ t: 'kick', x: p.name }, { t: 'h1', x: wed ? 'Choosing the readings for your wedding' : 'Choosing the readings for the funeral' },
        { t: 'p', x: wed ? 'Choose one reading from each list, then give this sheet to the priest or deacon. Your readers can practise from these pages.' : 'With the priest or deacon, the family chooses the readings for the Funeral Mass: one from each list. Family members or friends may read the first two.' },
        { t: 'p', sm: 1, x: 'Couple or family: ______________________   Date: ____________   Phone: ______________' }];
      var groups = [['First reading (Old Testament)', W.ot, 14], ['Second reading (New Testament)', W.nt, 14], ['Gospel', W.g, 18]];
      if (checked('psalm')) groups.splice(1, 0, ['Responsorial psalm', W.ps, 0]);
      var jobs = [];
      groups.forEach(function (g) { g[1].forEach(function (r) { jobs.push(text && g[2] ? passage(r, g[2]) : Promise.resolve(null)); }); });
      return Promise.all(jobs).then(function (res) {
        var out = head.slice(), i = 0;
        c.use.lect = 1;
        groups.forEach(function (g) {
          out.push({ t: 'h2', x: g[0] });
          g[1].forEach(function (r) { var t = res[i++]; if (t) c.use.scripture = 1; out.push({ t: 'check', x: r }); if (t) out.push({ t: 'verse', x: t.text }); });
        });
        out.push({ t: 'p', sm: 1, x: 'The full readings are in the Lectionary for Mass; the priest or deacon will give your readers the approved text.' });
        if (c.flow) return { flow: out };
        var half = Math.ceil(out.length / c.n), panels = [];
        for (var k = 0; k < c.n; k++) panels.push(out.slice(k * half, (k + 1) * half));
        return panels;
      });
    }
  };

  // The footer every handout carries, with the attributions its content needs
  function foot(use) {
    var l = [];
    if (use.scripture) l.push('Scripture texts: Douay-Rheims Bible (public domain).');
    if (use.lect) l.push('Reading references: Lectionary for Mass for use in Canada.');
    if (use.ccc) l.push('Catechism of the Catholic Church: © Libreria Editrice Vaticana. References and summaries only; official text at vatican.va.');
    if (use.cic) l.push('Code of Canon Law (1983): © Libreria Editrice Vaticana. References and summaries only; official text at vatican.va.');
    use.art.forEach(function (a) { l.push('Art: ' + (a.artist ? a.artist + ', ' : '') + a.title + ' (public domain).'); });
    l.push('Made with Verbum Domini for Parishes · parishes.verbumdomini.ca');
    return { t: 'foot', lines: l };
  }

  // ---------- assembling a handout ----------
  function build() {
    var tpl = $('g-tpl').value, fk = $('g-fmt').value, f = FMT[fk];
    var c = { fmt: fk, n: f.panels * 2, flow: fk === 'letter' && tpl === 'packet', use: { art: [] }, accent: COL.white };
    return Promise.resolve(TPLS[tpl](c)).then(function (res) {
      var extra = [];
      var ri = $('g-ref').value, r = ri !== '' ? D.ref.items[+ri] : null;
      if (r) { c.use[r.src === 'CCC' ? 'ccc' : 'cic'] = 1; extra.push({ t: 'note', x: r.ref + ', ' + r.source + ': ' + r.title, y: r.summary }); }
      if ($('g-note').value.trim()) extra.push({ t: 'p', x: $('g-note').value.trim() });
      if (res.flow) return { c: c, f: f, fk: fk, flow: res.flow.concat(extra).concat([foot(c.use)]) };
      var panels = res.slice(0, c.n);
      while (panels.length < c.n) panels.push([]);
      for (var i = c.n; i < res.length; i++) panels[c.n - 1] = panels[c.n - 1].concat(res[i]);
      panels[c.n - 1] = panels[c.n - 1].concat(extra).concat([foot(c.use)]);
      return { c: c, f: f, fk: fk, panels: panels };
    });
  }
  // The panels on each printed side: a tri-fold prints 5, 6, 1 outside and 2, 3, 4 inside
  function sides(h) {
    if (h.flow) return null;
    var p = h.panels;
    if (h.f.panels === 3) return [[p[4], p[5], p[0]], [p[1], p[2], p[3]]];
    return [[p[0]], [p[1]]];
  }

  // ---------- HTML ----------
  function blockHtml(b) {
    var cl = (b.c ? ' c' : '') + (b.sm ? ' sm' : '') + (b.it ? ' it' : '');
    switch (b.t) {
      case 'kick': return '<p class="g-kick">' + esc(b.x) + '</p>';
      case 'h1': return '<h2 class="g-h1">' + esc(b.x) + '</h2>';
      case 'h2': return '<h3 class="g-h2' + cl + '">' + esc(b.x) + '</h3>';
      case 'h3': return '<h4 class="g-h3">' + esc(b.x) + '</h4>';
      case 'p': return '<p class="g-p' + cl + '">' + esc(b.x).replace(/\n/g, '<br>') + '</p>';
      case 'list': return '<ul class="g-list">' + b.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      case 'check': return '<p class="g-check"><span aria-hidden="true"></span>' + esc(b.x) + '</p>';
      case 'kv': return '<dl class="g-kv">' + b.rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>';
      case 'verse': return '<blockquote class="g-verse">' + (b.ref ? '<cite>' + esc(b.ref) + '</cite>' : '') + esc(b.x).replace(/\n/g, '<br>') + '</blockquote>';
      case 'qr': return '<figure class="g-qr" data-size="' + b.size + '">' + window.QR.svg(b.url, 2) + '<figcaption>' + esc(b.cap) + '</figcaption></figure>';
      case 'img': return '<figure class="g-img" data-h="' + b.h + '"><img src="' + esc(b.src) + '" alt="' + esc(b.alt) + '"><figcaption>' + esc(b.cap) + '</figcaption></figure>';
      case 'rule': return '<hr class="g-rule">';
      case 'note': return '<aside class="g-note"><b>' + esc(b.x) + '</b> ' + esc(b.y) + '</aside>';
      case 'foot': return '<footer class="g-foot">' + b.lines.map(esc).join('<br>') + '</footer>';
    }
    return '';
  }
  function panelHtml(blocks) { return '<div class="g-pn"><div class="g-in">' + (blocks || []).map(blockHtml).join('') + '</div></div>'; }
  function inch(el, k, v) { el.style[k] = v + 'in'; }
  function sizeInner(pn, f) {
    var inn = pn.firstChild, h = f.h - 2 * f.pad, w = f.w / f.panels - 2 * f.pad;
    [].forEach.call(inn.querySelectorAll('.g-img img'), function (im) { im.style.maxHeight = (+im.parentNode.getAttribute('data-h') * h) + 'in'; });
    [].forEach.call(inn.querySelectorAll('.g-qr svg'), function (sv) { var s = Math.min(+sv.parentNode.getAttribute('data-size') * w, h * 0.5); sv.style.width = s + 'in'; sv.style.height = s + 'in'; });
  }
  // Shrink a panel's type until it fits (never below 55%)
  function fit(pn, base) {
    var inn = pn.firstChild, s = 1;
    for (; s >= 0.55; s -= 0.03) { inn.style.fontSize = (base * s).toFixed(2) + 'pt'; if (inn.scrollHeight <= inn.clientHeight + 1) break; }
    pn.classList.toggle('g-over', inn.scrollHeight > inn.clientHeight + 1);
    return s;
  }
  function crop(sheet, f, W, H, cols, rows) {
    var ox = (W - cols * f.w) / 2, oy = (H - rows * f.h) / 2, out = [];
    if (ox < 0.3 && oy < 0.3) return out;
    var g = 0.0625, len = 0.25;
    for (var i = 0; i <= cols; i++) { var x = ox + i * f.w; if (oy >= 0.3) { out.push([x, oy - g - len, x, oy - g]); out.push([x, oy + rows * f.h + g, x, oy + rows * f.h + g + len]); } }
    for (var j = 0; j <= rows; j++) { var y = oy + j * f.h; if (ox >= 0.3) { out.push([ox - g - len, y, ox - g, y]); out.push([ox + cols * f.w + g, y, ox + cols * f.w + g + len, y]); } }
    out.forEach(function (m) {
      var d = document.createElement('i'); d.className = 'g-mark';
      inch(d, 'left', Math.min(m[0], m[2])); inch(d, 'top', Math.min(m[1], m[3])); inch(d, 'width', Math.max(Math.abs(m[2] - m[0]), 0.006)); inch(d, 'height', Math.max(Math.abs(m[3] - m[1]), 0.006));
      sheet.appendChild(d);
    });
    return out;
  }
  // The flow layout (Letter packet): blocks fill page after page
  function paginate(blocks, f) {
    var zoom = $('g-zoom'), pages = [[]], probe = document.createElement('div');
    probe.className = 'g-sheet g-probe'; inch(probe, 'width', f.w); inch(probe, 'height', f.h);
    probe.innerHTML = panelHtml([]); zoom.appendChild(probe);
    var pn = probe.firstChild, inn = pn.firstChild;
    inch(pn, 'left', 0); inch(pn, 'top', 0); inch(pn, 'width', f.w); inch(pn, 'height', f.h); pn.style.padding = f.pad + 'in';
    inn.style.fontSize = f.base + 'pt';
    blocks.forEach(function (b) {
      var t = document.createElement('div'); t.innerHTML = blockHtml(b); var el = t.firstChild; if (!el) return;
      inn.appendChild(el); sizeInner(pn, f);
      if (inn.scrollHeight > inn.clientHeight + 1 && pages[pages.length - 1].length) { inn.innerHTML = ''; inn.appendChild(el); pages.push([]); }
      pages[pages.length - 1].push(b);
    });
    probe.remove();
    return pages;
  }
  function render() {
    var my = {};
    last = my;
    $('g-msg').textContent = '';
    return build().then(function (h) {
      if (last !== my) return null;
      var f = h.f, trim = $('g-imp').value === 'trim', W = trim ? f.w : f.sheet[0], H = trim ? f.h : f.sheet[1], cols = trim ? 1 : f.cols, rows = trim ? 1 : f.rows;
      var zoom = $('g-zoom'); zoom.innerHTML = '';
      zoom.style.setProperty('--gacc', h.c.accent); zoom.className = 'g-zoom fmt-' + h.fk;
      var sd = sides(h);
      if (h.flow) { sd = paginate(h.flow, f).map(function (pg) { return [pg]; }); }
      var marks = [], ox = (W - cols * f.w) / 2, oy = (H - rows * f.h) / 2;
      sd.forEach(function (panels, si) {
        var sheet = document.createElement('div');
        sheet.className = 'g-sheet' + (h.flow ? '' : si % 2 ? ' back' : ' front');
        sheet.setAttribute('data-n', si);
        inch(sheet, 'width', W); inch(sheet, 'height', H);
        var sc = null;
        for (var r = 0; r < rows; r++) for (var cI = 0; cI < cols; cI++) {
          panels.forEach(function (bl, pi) {
            var t = document.createElement('div'); t.innerHTML = panelHtml(bl); var pn = t.firstChild;
            var pw = f.w / f.panels;
            inch(pn, 'left', ox + cI * f.w + pi * pw); inch(pn, 'top', oy + r * f.h); inch(pn, 'width', pw); inch(pn, 'height', f.h);
            pn.style.padding = f.pad + 'in';
            if (f.panels > 1 && pi) pn.classList.add('g-fold');
            sheet.appendChild(pn); sizeInner(pn, f);
          });
        }
        zoom.appendChild(sheet);
        // Fit the first copy's panels; the other copies are the same
        var pns = sheet.querySelectorAll('.g-pn'), per = panels.length, scales = [];
        for (var k = 0; k < pns.length; k++) {
          if (k < per) scales[k] = h.flow ? (pns[k].firstChild.style.fontSize = f.base + 'pt', 1) : fit(pns[k], f.base);
          else { pns[k].firstChild.style.fontSize = (f.base * scales[k % per]).toFixed(2) + 'pt'; pns[k].classList.toggle('g-over', pns[k % per].classList.contains('g-over')); }
        }
        sheet._scales = scales.slice(0, per);
        if ($('g-crop').checked && !trim) marks = crop(sheet, f, W, H, cols, rows);
        // Images load later: refit then
        [].forEach.call(sheet.querySelectorAll('img'), function (im) { if (!im.complete) im.addEventListener('load', function () { if (last === my && !h.flow) { for (var k = 0; k < per; k++) sheet._scales[k] = fit(pns[k], f.base); for (k = per; k < pns.length; k++) pns[k].firstChild.style.fontSize = pns[k % per].firstChild.style.fontSize; } }, { once: true }); });
      });
      h.W = W; h.H = H; h.cols = cols; h.rows = rows; h.ox = ox; h.oy = oy; h.sides = sd; h.marks = marks; h.trim = trim;
      zoom._h = h;
      var over = zoom.querySelector('.g-over');
      $('g-msg').textContent = over ? 'Some text does not fit even at the smallest size: choose a larger format or less content.' : '';
      $('g-info').textContent = (h.flow ? sd.length + ' pages' : (cols * rows > 1 ? cols * rows + ' copies per sheet · ' : '') + (trim ? 'one per page' : 'Letter ' + (W > H ? 'landscape' : 'portrait'))) + ' · print two-sided, flip on ' + (h.flow ? 'long edge' : f.flip);
      $('g-sf').textContent = f.panels === 3 ? 'Outside' : 'Front'; $('g-sb').textContent = f.panels === 3 ? 'Inside' : 'Back';
      document.querySelector('.pp-gen-bar .pp-view').hidden = !!h.flow;
      showSide(); scale();
      return h;
    }).catch(function (e) { $('g-msg').textContent = 'The handout could not be made: ' + (e && e.message || e); });
  }
  function showSide() {
    var flow = $('g-zoom')._h && $('g-zoom')._h.flow;
    [].forEach.call($('g-zoom').querySelectorAll('.g-sheet'), function (s) { s.classList.toggle('g-hide', !flow && !s.classList.contains(side)); });
    $('g-stage').classList.toggle('g-noback', !$('g-duplex').checked);
    [].forEach.call(document.querySelectorAll('[data-side]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-side') === side)); });
  }
  function scale() {
    var z = $('g-zoom'), h = z._h; if (!h) return;
    var avail = $('g-stage').clientWidth - 24, s = Math.min(1, avail / (h.W * 96));
    z.style.transform = 'scale(' + s.toFixed(4) + ')';
    $('g-stage').style.height = (z.offsetHeight * s + 24) + 'px';
  }
  window.addEventListener('resize', scale);

  // ---------- print and PDF ----------
  var pageRule = -1;
  function pageSize(W, H) {
    var css = [].filter.call(document.styleSheets, function (s) { return /portal\.css/.test(s.href || ''); })[0]; if (!css) return;
    try { if (pageRule >= 0) css.deleteRule(pageRule); pageRule = css.insertRule('@page{size:' + W + 'in ' + H + 'in;margin:0}', css.cssRules.length); } catch (e) { pageRule = -1; }
  }
  $('g-print').addEventListener('click', function () {
    var h = $('g-zoom')._h; if (!h) return;
    pageSize(h.W, h.H); document.body.classList.add('pp-gen-print'); window.print();
  });
  window.addEventListener('afterprint', function () { document.body.classList.remove('pp-gen-print'); });
  function loadScript(src) {
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  }
  function images(h) {
    var srcs = {}, out = {};
    (h.flow ? [h.flow] : h.panels).forEach(function (bl) { bl.forEach(function (b) { if (b.t === 'img') srcs[b.src] = 1; }); });
    return Promise.all(Object.keys(srcs).map(function (s) {
      // A painting that has not loaded after 8 seconds is left out rather than holding the PDF back
      return new Promise(function (ok) { var im = new Image(); im.onload = function () { out[s] = im; ok(); }; im.onerror = ok; setTimeout(ok, 8000); im.src = s; });
    })).then(function () { return out; });
  }
  $('g-pdf').addEventListener('click', function () {
    var h = $('g-zoom')._h; if (!h) return;
    var b = this; b.disabled = true; $('g-msg').textContent = 'Making the PDF…';
    (window.jspdf ? Promise.resolve() : loadScript('/vendor/jspdf.umd.min.js'))
      .then(function () { return images(h); })
      .then(function (imgs) {
        var duplex = $('g-duplex').checked;
        var job = { W: h.W, H: h.H, f: h.f, cols: h.cols, rows: h.rows, ox: h.ox, oy: h.oy, marks: h.marks, accent: h.c.accent, images: imgs, qr: window.QR.matrix,
          sides: h.flow ? null : (duplex ? h.sides : h.sides.slice(0, 1)), flow: h.flow || null };
        var doc = window.PPPdf.make(window.jspdf.jsPDF, job);
        var name = (PAR ? PAR.parish.slug + '-' : '') + $('g-tpl').value + '-' + h.fk + '.pdf';
        doc.save(name);
        $('g-msg').textContent = 'PDF saved: ' + name;
      })
      .catch(function (e) { $('g-msg').textContent = 'The PDF could not be made (' + (e && e.message || 'error') + '). Use Print, then “Save as PDF”.'; })
      .then(function () { b.disabled = false; });
  });

  // ---------- controls ----------
  var t0;
  function later() { clearTimeout(t0); t0 = setTimeout(render, 150); }
  function url() {
    var s = new URLSearchParams();
    if ($('g-parish').value) s.set('parish', $('g-parish').value);
    s.set('tpl', $('g-tpl').value); s.set('fmt', $('g-fmt').value);
    if (o('date') && o('date').value) s.set('date', o('date').value);
    if (o('occ')) s.set('occ', o('occ').value);
    history.replaceState(null, '', location.pathname + '?' + s);
  }
  function opts() {
    $('g-opts').innerHTML = OPTS[$('g-tpl').value]();
    $('g-hint').textContent = 'Suggested size for this template: ' + $('g-fmt').querySelector('[value=' + HINT[$('g-tpl').value] + ']').textContent + '.';
    var sq = o('sq');
    if (sq) sq.addEventListener('input', function () { var cur = val('saint'); o('saint').innerHTML = saintOptions(sq.value, cur); later(); });
  }
  function artOpts() {
    var n = ($('g-art-q').value || '').toLowerCase(), cur = $('g-art').value;
    var list = D.art.filter(function (a) { return !n || (a.title + ' ' + a.artist + ' ' + a.tags.join(' ')).toLowerCase().indexOf(n) >= 0; });
    $('g-art').innerHTML = '<option value="auto">Chosen for the template</option><option value="">No painting</option>' + list.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.title + (a.artist ? ', ' + a.artist : '')) + '</option>'; }).join('');
    $('g-art').value = [].some.call($('g-art').options, function (x) { return x.value === cur; }) ? cur : (n && list.length ? list[0].id : 'auto');
  }
  $('g').addEventListener('input', function (e) { if (e.target.id === 'g-art-q') artOpts(); if (e.target.id !== 'g-o-sq') { url(); later(); } });
  $('g').addEventListener('change', function (e) {
    if (e.target.id === 'g-tpl') { opts(); if (!q.get('fmt')) $('g-fmt').value = HINT[$('g-tpl').value]; q.delete('fmt'); }
    if (e.target.id === 'g-parish') loadParish($('g-parish').value);
    if (e.target.id === 'g-duplex') showSide();
    url(); later();
  });
  $('g').addEventListener('submit', function (e) { e.preventDefault(); });
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-side]'); if (!b) return; side = b.getAttribute('data-side'); showSide(); scale(); });
  function loadParish(slug) {
    if (!slug) { PAR = null; $('g-pmsg').textContent = 'No parish: the handout uses placeholders.'; return Promise.resolve(); }
    $('g-pmsg').textContent = 'Loading the parish…';
    return P.api('/api/parishes/' + encodeURIComponent(slug)).then(function (j) {
      if (!j.ok) { PAR = null; $('g-pmsg').textContent = P.err(j); return; }
      PAR = j; $('g-pmsg').textContent = j.parish.claimed ? 'Times kept by the parish, as of ' + P.date(j.parish.updated_at) + '.' : 'Times from the Archdiocese listing: check them before printing.';
      render();
    });
  }

  // ---------- start ----------
  Promise.all([getJSON('/data/saints-index.json'), getJSON('/data/prayers-index.json'), getJSON('/data/art-index.json'), getJSON('/data/readings-ca.json'),
    getJSON('/data/reference-index.json'), getJSON('/data/bible-books.json'), P.api('/api/parishes')]).then(function (r) {
    D.saints = r[0]; D.prayers = r[1]; D.art = r[2]; D.readings = r[3]; D.ref = r[4]; D.books = r[5];
    LIST = r[6].ok ? r[6].parishes : [];
    $('g-parish').innerHTML = '<option value="">No parish (placeholders)</option>' + LIST.map(function (x) { return '<option value="' + esc(x.slug) + '">' + esc(x.name + ', ' + x.city) + '</option>'; }).join('');
    $('g-ref').innerHTML = '<option value="">None</option>' + D.ref.items.map(function (x, i) { return '<option value="' + i + '">' + esc(x.ref + ': ' + x.title) + '</option>'; }).join('');
    if (FMT[q.get('fmt')]) $('g-fmt').value = q.get('fmt');
    if (TPLS[q.get('tpl')]) $('g-tpl').value = q.get('tpl');
    if (!FMT[q.get('fmt')]) $('g-fmt').value = HINT[$('g-tpl').value];
    opts(); artOpts(); document.dispatchEvent(new Event('pp-gen-ready'));   // gen-ui.js: the pills follow
    var slug = q.get('parish') || '';
    if (slug && LIST.some(function (x) { return x.slug === slug; })) { $('g-parish').value = slug; return loadParish(slug); }
    $('g-pmsg').textContent = 'Choose a parish to fill in its times, or print with placeholders.';
    return render();
  }, function () { $('g-zoom').innerHTML = '<p>The library could not be loaded. Reload the page to try again.</p>'; });
})();
