/* The workspace panels beyond the weekly schedule (window.PPOps, called by admin.js after each load and panel change):
   Dashboard (liturgical day, holy day reminders, profile completeness, monthly counters), Special liturgical dates,
   the web bulletin composer, clergy, office and accessibility, ministries, Print and PDF presets, the Canon Law and
   Catechism quick reference (data/reference-index.json) and the widget builder. Every save goes to an /api/admin/ route
   that the server limits to the parish of the session. */
(function () {
  var P = window.PP, S = window.PPS, A = window.PPAdmin, $ = function (id) { return document.getElementById(id); };
  var D = null, slug = '', spec = [], mins = [], clergy = [], ints = [], anns = [], bulId = 0, REF = null, specDirty = false, minDirty = false;
  var CAT = { mass: 'Mass', confession: 'Confession', adoration: 'Adoration', liturgy: 'Liturgy (no Mass)', office_closed: 'Office closed (all day)', no_mass: 'No Mass (all day)' };
  var KINDN = { obligation: 'Holy day of obligation', solemnity: 'Solemnity', holyweek: 'Holy Week and Lent', feast: 'Feast', holiday: 'Holiday' };
  var ACC = [['wheelchair', 'Wheelchair-accessible entrance'], ['hearing_loop', 'Hearing loop'], ['accessible_washroom', 'Accessible washroom'], ['parking', 'Accessible parking']];
  var TPL = [
    ['bulletin', 'half', 'Sunday bulletin cover and lectionary insert', 'The Sunday’s readings, liturgical colour, a painting and your Mass times. Half-page, two to a Letter sheet.'],
    ['pew', 'card', 'Confession and Adoration pew card', 'Your Confession and Adoration hours, the Act of Contrition and a QR code to the live schedule. Four to a sheet.'],
    ['pew', 'bookmark', 'Liturgical bookmark', 'Mass times, Confession and a QR code on a 2.5 by 7 inch bookmark. Four to a sheet.'],
    ['saint', 'letter', 'Saint feast day and patronage handout', 'A saint of the calendar with patronage, a short life and a prayer.'],
    ['welcome', 'trifold', 'New parishioner welcome brochure', 'A tri-fold with Mass times, sacraments, ministries, clergy, office hours and a QR code.'],
    ['packet', 'letter', 'Wedding and funeral Scripture packet', 'Reading choices for families planning a wedding or a funeral, with the texts.']
  ];
  function msg(id, t, ok) { A.msg(id, t, ok); }
  function opt(v, label, cur) { return '<option value="' + P.esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + P.esc(label) + '</option>'; }
  function today() { return D.today || S.now().date; }
  function nextSunday(d) { var x = d; while (S.dayOf(x) !== 0) x = S.addDays(x, 1); return x; }
  function guard(e) { if (specDirty || minDirty) { e.preventDefault(); e.returnValue = ''; } }
  window.addEventListener('beforeunload', guard);

  // ---------- Dashboard ----------
  function score() {
    var p = D.parish, t = today(), has = function (k) { return D.mass_times.some(function (r) { return r.kind === k; }); };
    var webBul = (D.bulletins || []).some(function (b) { return b.published_at && b.week_of >= S.addDays(t, -14); });
    var holy = S.upcoming(t, 45).filter(function (h) { return h.kind === 'obligation' || h.kind === 'holyweek' || h.name === 'Christmas Eve'; });
    var todo = holy.filter(function (h) { return !spec.some(function (s) { return s.event_date === h.date; }); }), posted = !todo.length;
    var checks = [
      [15, has('sunday'), 'Weekend Mass times', 'sched'], [8, has('weekday'), 'Weekday Mass times', 'sched'], [10, has('confession'), 'Confession times', 'sched'],
      [6, !!p.phone, 'Office phone', 'bul#pr-phone'], [6, !!p.email, 'Office email', 'bul#pr-email'],
      [10, !!p.bulletin_url || webBul, 'This week’s bulletin (PDF link or web bulletin)', 'bul#b-week'],
      [8, !!p.office_hours, 'Office hours', 'people#dt-office'], [8, !!p.pastor_name, 'Pastor', 'people#dt-pastor'],
      [8, Object.keys(p.accessibility || {}).length > 0, 'Accessibility features', 'people#dt-access'],
      [5, (p.languages || []).length > 0, 'Languages served', 'people#dt-langs'], [6, (D.ministries || []).length > 0, 'At least one ministry or group', 'people#mn-add'],
      [10, posted, 'Times for ' + todo.map(function (h) { return h.name; }).slice(0, 3).join(', '), 'sched']
    ];
    var n = checks.reduce(function (a, c) { return a + (c[1] ? c[0] : 0); }, 0), miss = checks.filter(function (c) { return !c[1]; });
    var hp = n >= 90 ? ['claimed', 'Healthy listing'] : n >= 60 ? ['season', 'Nearly there'] : ['pending', 'Needs attention'];
    var r = 50, c = 2 * Math.PI * r;
    return '<div class="pp-ring"><svg viewBox="0 0 120 120" role="img" aria-label="Profile ' + n + '% complete"><circle class="g-tr" cx="60" cy="60" r="' + r + '"/>' +
      (n ? '<circle class="g-v" cx="60" cy="60" r="' + r + '" stroke-dasharray="' + (c * n / 100).toFixed(1) + ' 999" transform="rotate(-90 60 60)"/>' : '') +
      '<text x="60" y="64" class="g-n">' + n + '%</text></svg><span class="status-pill ' + hp[0] + '"><i aria-hidden="true"></i>' + hp[1] + '</span></div>' +
      (miss.length ? '<p class="is-l">Still missing</p><div class="pp-ring-list">' + miss.map(function (c) {
        return '<a class="accent-row rk pp-nl" href="#' + c[3].split('#')[0] + '" data-go="' + P.esc(c[3]) + '"><span><span class="ar-t">' + P.esc(c[2]) + '</span></span><span class="ar-v">+' + c[0] + '%</span></a>';
      }).join('') + '</div>' : '<p class="pp-small">Complete. Thank you for keeping it current.</p>');
  }
  function season() {
    var L = window.VDLit, d = L ? L.litDay(new Date()) : null, t = today();
    var next = S.upcoming(t, 40).filter(function (h) { return h.kind !== 'holiday' && h.kind !== 'feast'; })[0];
    return (d ? '<p class="pp-kick">Today in the Church</p><h2>' + P.esc(d.title) + '</h2><p>' + P.esc(d.season) + ' · liturgical colour ' + P.esc(d.col) + ' · ' + P.esc(S.nice(t, true)) + '</p>' : '') +
      (next ? '<p class="pp-small">Next: <b>' + P.esc(next.name) + '</b>, ' + P.esc(S.nice(next.date, true)) + (next.kind === 'obligation' ? ' (holy day of obligation)' : '') + '. ' +
        (spec.some(function (s) { return s.event_date === next.date; }) ? 'Your times are posted.' : '<a href="#sched" data-go="sched" data-holy="' + next.date + '">Post your times</a>') + '</p>' : '');
  }
  function holy() {
    var t = today(), list = S.upcoming(t, 75).filter(function (h) { return h.kind !== 'feast'; });
    if (!list.length) return '<p class="pp-mut">No holy days or holidays in the next ten weeks.</p>';
    return '<ul class="pp-holy">' + list.slice(0, 6).map(function (h) {
      var got = spec.some(function (s) { return s.event_date === h.date; });
      return '<li><span class="pp-holy-d">' + P.esc(S.nice(h.date)) + '</span><span><b>' + P.esc(h.name) + '</b><br><span class="pp-small">' + P.esc(KINDN[h.kind]) + (h.note ? ' · ' + P.esc(h.note) : '') + '</span></span>' +
        (got ? '<span class="badge">Posted</span>' : '<button class="btn" type="button" data-holy="' + h.date + '">Add times</button>') + '</li>';
    }).join('') + '</ul>';
  }
  // Four counters, each with its own figure and a sparkline of the months on record (one series per chart, one axis)
  function stats() {
    var m = today().slice(0, 7), rows = (D.stats || []).slice().reverse(), cur = rows.filter(function (r) { return r.month_key === m; })[0] || {};
    var tiles = [['profile_views', 'Parish page views', 'lit'], ['directions_clicks', 'Directions opened', 'ac'], ['bulletin_views', 'Bulletin reads', 'gold'], ['widget_loads', 'Widget views', 'vio']];
    var prev = rows.filter(function (r) { return r.month_key < m; }).pop() || {};
    return '<div class="kpi-grid">' + tiles.map(function (x) {
      var v = cur[x[0]] || 0, p = prev[x[0]] || 0, d = v - p;
      return '<div class="kpi-b ' + x[2] + '"><span class="kpi-l">' + x[1] + '</span><span class="kpi">' + v.toLocaleString('en-CA') + '</span>' +
        '<span class="pp-small">' + (prev.month_key ? (d >= 0 ? '+' : '') + d.toLocaleString('en-CA') + ' on last month' : 'This month') + '</span>' + spark(rows.map(function (r) { return r[x[0]] || 0; }), x[1]) + '</div>';
    }).join('') + '</div>' +
      (rows.length ? '<details class="pp-tview"><summary>Show as a table</summary><div class="pp-tbl"><table><caption class="pp-vh">Monthly counters</caption><tr><th scope="col">Month</th>' + tiles.map(function (x) { return '<th scope="col">' + x[1] + '</th>'; }).join('') + '</tr>' +
        rows.slice().reverse().map(function (r) { var d = r.month_key.split('-'); return '<tr><th scope="row">' + S.MON[+d[1] - 1] + ' ' + d[0] + '</th>' + tiles.map(function (x) { return '<td>' + (r[x[0]] || 0) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div></details>'
        : '<p class="pp-mut">No visits counted yet. Counting started with this version of the portal.</p>') +
      '<p class="pp-small">Counts only: no visitor addresses, cookies or times are kept.</p>';
  }
  function spark(vals, label) {
    if (vals.length < 2) return '<span class="spark-none" aria-hidden="true"></span>';
    var W = 160, H = 40, max = Math.max.apply(null, vals) || 1, bw = W / vals.length;
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + P.esc(label) + ', the last ' + vals.length + ' months: ' + vals.join(', ') + '">' + vals.map(function (v, i) {
      var h = Math.max(2, (H - 2) * v / max), last = i === vals.length - 1;
      return '<rect x="' + (i * bw + 1).toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + Math.max(2, bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2"' + (last ? ' class="on"' : '') + '><title>' + v + '</title></rect>';
    }).join('') + '</svg>';
  }
  // The weekly schedule and ministries at a glance
  function sum() {
    var K = [['sunday', 'Sunday Mass', 'lit'], ['weekday', 'Weekday Mass', 'ac'], ['confession', 'Confession', 'vio'], ['adoration', 'Adoration', 'gold']];
    var t = today(), up = spec.filter(function (s) { return s.event_date >= t; });
    return K.map(function (k) {
      var rows = D.mass_times.filter(function (r) { return r.kind === k[0]; }), days = {};
      rows.forEach(function (r) { days[r.day] = 1; });
      return '<a class="accent-row ' + k[2] + ' pp-nl" href="#sched" data-go="sched"><span><span class="ar-t">' + k[1] + '</span><span class="ar-s">' + (rows.length ? Object.keys(days).map(function (d) { return S.DAYS[d].slice(0, 3); }).join(', ') : 'None listed') + '</span></span><span class="ar-v">' + rows.length + '</span></a>';
    }).join('') +
      '<a class="accent-row rk pp-nl" href="#sched" data-go="sched"><span><span class="ar-t">Special dates</span><span class="ar-s">' + (up.length ? 'Next: ' + P.esc(up[0].occasion_name) + ', ' + P.esc(S.nice(up[0].event_date)) : 'None posted') + '</span></span><span class="ar-v">' + up.length + '</span></a>' +
      '<a class="accent-row ac pp-nl" href="#people" data-go="people"><span><span class="ar-t">Ministries and groups</span><span class="ar-s">' + ((D.ministries || []).slice(0, 3).map(function (m) { return P.esc(m.name); }).join(', ') || 'None listed') + '</span></span><span class="ar-v">' + (D.ministries || []).length + '</span></a>';
  }
  // Pending: holy days in the next 45 days without posted times (and claims waiting, for site administrators); active: schedule rows
  function act() {
    var t = today(), holy = S.upcoming(t, 45).filter(function (h) { return h.kind === 'obligation' || h.kind === 'holyweek' || h.name === 'Christmas Eve'; });
    var todo = holy.filter(function (h) { return !spec.some(function (s) { return s.event_date === h.date; }); }).length, claims = D.super && P.claims ? P.claims.length : 0;
    var drafts = (D.bulletins || []).filter(function (b) { return !b.published_at; }).length;
    return '<div class="ov-stats">' +
      '<div class="inset-stat"><div class="is-row"><span class="is-n">' + (todo + drafts + claims) + '</span><span class="status-pill ' + (todo + drafts + claims ? 'pending' : 'claimed') + '"><i aria-hidden="true"></i>Pending</span></div><span class="is-l">' +
        [todo + (todo === 1 ? ' holy day without times' : ' holy days without times'), drafts ? drafts + ' bulletin draft' + (drafts === 1 ? '' : 's') : '', claims ? claims + ' claim' + (claims === 1 ? '' : 's') + ' to review' : ''].filter(Boolean).join(', ') + '</span></div>' +
      '<div class="inset-stat"><div class="is-row"><span class="is-n">' + D.mass_times.length + '</span><span class="status-pill season">Active</span></div><span class="is-l">Weekly schedule entries</span></div></div>' +
      '<p class="pp-row adm-acts"><a class="btn p" href="#sched" data-go="sched">Post holy day times</a><a class="btn" href="#bul" data-go="bul">Write the bulletin</a></p>';
  }
  function dash() {
    var L = window.VDLit, d = L ? L.litDay(new Date()) : null;
    $('dash-season').className = 'bento-card pp-season col-' + (d ? d.col : 'green');
    $('dash-season').innerHTML = season(); $('dash-score').innerHTML = score(); $('dash-holy').innerHTML = holy(); $('dash-stats').innerHTML = stats();
    $('dash-sum').innerHTML = sum(); $('dash-act').innerHTML = act();
  }

  // ---------- Special liturgical dates ----------
  function drawSpec() {
    spec.sort(function (a, b) { return a.event_date < b.event_date ? -1 : a.event_date > b.event_date ? 1 : a.start_time < b.start_time ? -1 : 1; });
    var t = today();
    $('spec').innerHTML = spec.length ? '<div class="pp-tbl"><table class="pp-sched-ed"><tr><th>Date</th><th>Occasion</th><th>Kind</th><th>Start</th><th>End</th><th>Language</th><th>Note</th><th></th></tr>' + spec.map(function (r, i) {
      var lab = P.esc('special date ' + (i + 1)), allDay = r.category === 'office_closed' || r.category === 'no_mass';
      return '<tr data-i="' + i + '"' + (r.event_date < t ? ' class="past"' : '') + '><td><input aria-label="Date, ' + lab + '" data-f="event_date" type="date" value="' + P.esc(r.event_date) + '"></td>' +
        '<td><input aria-label="Occasion, ' + lab + '" data-f="occasion_name" maxlength="100" value="' + P.esc(r.occasion_name) + '"></td>' +
        '<td><select aria-label="Kind, ' + lab + '" data-f="category">' + Object.keys(CAT).map(function (k) { return opt(k, CAT[k], r.category); }).join('') + '</select></td>' +
        '<td><input aria-label="Start, ' + lab + '" data-f="start_time" type="time" value="' + P.esc(r.start_time) + '"' + (allDay ? ' disabled' : '') + '></td>' +
        '<td><input aria-label="End, ' + lab + '" data-f="end_time" type="time" value="' + P.esc(r.end_time) + '"' + (allDay ? ' disabled' : '') + '></td>' +
        '<td><input aria-label="Language, ' + lab + '" data-f="language" maxlength="40" value="' + P.esc(r.language) + '"></td>' +
        '<td><input aria-label="Note, ' + lab + '" data-f="notes" maxlength="200" value="' + P.esc(r.notes) + '"></td>' +
        '<td class="pp-ops pp-ops-c"><button type="button" data-del="1" aria-label="Remove, ' + lab + '">✕</button></td></tr>';
    }).join('') + '</table></div>' : '<p class="pp-mut">No special dates yet. Add one, or pick from the suggestions below.</p>';
    var sug = S.upcoming(t, 365);
    $('sp-sugg').innerHTML = '<ul class="pp-holy">' + sug.map(function (h) {
      var got = spec.some(function (s) { return s.event_date === h.date; });
      return '<li><span class="pp-holy-d">' + P.esc(S.nice(h.date) + ', ' + h.date.slice(0, 4)) + '</span><span><b>' + P.esc(h.name) + '</b><br><span class="pp-small">' + P.esc(KINDN[h.kind]) + (h.note ? ' · ' + P.esc(h.note) : '') + '</span></span>' +
        (got ? '<span class="badge">Added</span>' : '<button class="btn" type="button" data-holy="' + h.date + '">Add</button>') + '</li>';
    }).join('') + '</ul>';
  }
  function holyRow(date) {
    var h = S.upcoming(S.addDays(date, -1), 2).filter(function (x) { return x.date === date; })[0]; if (!h) return null;
    var r = { event_date: date, occasion_name: h.name, category: 'mass', start_time: '', end_time: '', language: 'English', notes: '' };
    if (h.kind === 'holiday') { r.category = 'office_closed'; r.notes = 'Parish office closed'; }
    if (h.name === 'Good Friday') { r.category = 'liturgy'; r.occasion_name = 'Celebration of the Lord’s Passion'; r.start_time = '15:00'; }
    if (h.name === 'Holy Saturday') { r.occasion_name = 'The Easter Vigil'; r.start_time = '20:30'; }
    if (h.name === 'Holy Thursday') { r.occasion_name = 'Mass of the Lord’s Supper'; r.start_time = '19:30'; }
    if (h.name === 'Christmas Eve') r.start_time = '16:00';
    return r;
  }
  function addHoly(date) {
    var r = holyRow(date); if (!r) return;
    spec.push(r); specDirty = true; drawSpec(); msg('sp-msg', 'Unsaved changes'); dash();
    sub('spec');
    var i = spec.indexOf(r), el = $('spec').querySelector('tr[data-i="' + i + '"] [data-f="' + (r.start_time || r.category === 'office_closed' ? 'notes' : 'start_time') + '"]');
    if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); }
  }
  function sub(k) {
    $('sub-reg').hidden = k !== 'reg'; $('sub-spec').hidden = k !== 'spec';
    [].forEach.call(document.querySelectorAll('[data-sub]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-sub') === k)); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-sub],[data-holy]'); if (!b || !D) return;
    if (b.hasAttribute('data-sub')) { sub(b.getAttribute('data-sub')); return; }
    e.preventDefault();
    var t = $('t-sched'); if (t.getAttribute('aria-selected') !== 'true') t.click();
    addHoly(b.getAttribute('data-holy'));
  });
  $('spec').addEventListener('input', function (e) {
    var tr = e.target.closest('tr[data-i]'), f = e.target.getAttribute('data-f'); if (!tr || !f) return;
    var r = spec[+tr.getAttribute('data-i')]; r[f] = e.target.value; specDirty = true; msg('sp-msg', 'Unsaved changes');
    if (f === 'category') { var all = r.category === 'office_closed' || r.category === 'no_mass'; tr.querySelectorAll('[type=time]').forEach(function (x) { x.disabled = all; if (all) x.value = ''; }); if (all) { r.start_time = ''; r.end_time = ''; } }
  });
  $('spec').addEventListener('click', function (e) {
    var b = e.target.closest('[data-del]'); if (!b) return;
    spec.splice(+b.closest('tr').getAttribute('data-i'), 1); specDirty = true; drawSpec(); msg('sp-msg', 'Unsaved changes');
  });
  $('sp-add').addEventListener('click', function () {
    spec.push({ event_date: S.addDays(today(), 7), occasion_name: '', category: 'mass', start_time: '', end_time: '', language: 'English', notes: '' });
    specDirty = true; drawSpec(); msg('sp-msg', 'Unsaved changes');
    var r = $('spec').querySelectorAll('tr[data-i]'); if (r.length) r[r.length - 1].querySelector('input').focus();
  });
  $('sp-save').addEventListener('click', function () {
    var bad = spec.findIndex(function (r) {
      var all = r.category === 'office_closed' || r.category === 'no_mass';
      return !/^\d{4}-\d\d-\d\d$/.test(r.event_date) || r.occasion_name.trim().length < 2 || (!all && !/^\d\d:\d\d$/.test(r.start_time)) || (r.end_time && r.end_time <= r.start_time);
    });
    if (bad >= 0) { msg('sp-msg', 'Each date needs a day, an occasion and a start time (except closed or no-Mass days), with any end time after the start.'); var el = $('spec').querySelector('tr[data-i="' + bad + '"] input'); if (el) el.focus(); return; }
    $('sp-save').disabled = true; msg('sp-msg', 'Saving…', true);
    var items = spec.map(function (r) { return { event_date: r.event_date, occasion_name: r.occasion_name.trim(), category: r.category, start_time: r.start_time, end_time: r.end_time, language: r.language || 'English', notes: r.notes }; });
    P.api('/api/admin/specials', { method: 'PUT', body: { items: items } }).then(function (j) {
      $('sp-save').disabled = false;
      if (!j.ok) { msg('sp-msg', P.err(j)); return; }
      specDirty = false; D.specials = items; msg('sp-msg', 'Saved. The parish page and the widget show them within a few minutes.', true); drawSpec(); dash();
    });
  });

  // ---------- Web bulletin ----------
  function rowsHtml(list, fields, kind) {
    return list.length ? list.map(function (x, i) {
      return '<div class="pp-erow" data-k="' + kind + '" data-i="' + i + '">' + fields.map(function (f) {
        var lab = P.esc(f[1] + ', ' + (kind === 'int' ? 'intention ' : kind === 'ann' ? 'announcement ' : 'name ') + (i + 1));
        return f[2] === 'area' ? '<label class="pp-wide">' + P.esc(f[1]) + ' <textarea data-f="' + f[0] + '" maxlength="' + f[3] + '" aria-label="' + lab + '">' + P.esc(x[f[0]]) + '</textarea></label>'
          : '<label>' + P.esc(f[1]) + ' <input data-f="' + f[0] + '" maxlength="' + f[3] + '" value="' + P.esc(x[f[0]]) + '" placeholder="' + P.esc(f[2] || '') + '" aria-label="' + lab + '"></label>';
      }).join('') + '<button class="btn pp-x" type="button" data-rm="1" aria-label="Remove ' + (kind === 'int' ? 'intention' : kind === 'ann' ? 'announcement' : 'name') + ' ' + (i + 1) + '">Remove</button></div>';
    }).join('') : '<p class="pp-small">None yet.</p>';
  }
  var IF = [['when', 'Mass', 'Sat 5 p.m.', 60], ['intention', 'Intention', '† Name', 200], ['by', 'Requested by', 'The family', 100]];
  var AF = [['title', 'Title', '', 140], ['body', 'Text', 'area', 1500]];
  var CF = [['name', 'Name', 'Rev. Name Surname', 100], ['role', 'Role', 'Associate Pastor, Deacon…', 60]];
  function drawBulRows() { $('b-ints').innerHTML = rowsHtml(ints, IF, 'int'); $('b-anns').innerHTML = rowsHtml(anns, AF, 'ann'); }
  function fillBul(b) {
    bulId = b ? b.id : 0;
    $('b-week').value = b ? b.week_of : nextSunday(today()); $('b-note').value = b ? b.pastor_note : '';
    ints = b ? b.intentions.map(function (x) { return { when: x.when, intention: x.intention, by: x.by }; }) : [];
    anns = b ? b.announcements.map(function (x) { return { title: x.title, body: x.body }; }) : [];
    $('b-del').hidden = !bulId; drawBulRows(); pdfLink(); draftLabel(b);
  }
  // Saving a published bulletin as a draft takes it off the parish page: the button says so
  function draftLabel(b) { $('b-draft').textContent = b && b.published_at ? 'Unpublish and save as draft' : 'Save draft'; }
  function bulSelect() {
    $('b-load').innerHTML = '<option value="">New bulletin</option>' + (D.bulletins || []).map(function (b) { return opt(b.id, 'Sunday ' + b.week_of + (b.published_at ? ' (published)' : ' (draft)'), bulId); }).join('');
  }
  function pdfLink() { $('b-pdf').href = '/generator?parish=' + encodeURIComponent(slug) + '&tpl=bulletin&fmt=half&date=' + encodeURIComponent($('b-week').value || ''); }
  function editRows(box, list) {
    box.addEventListener('input', function (e) { var r = e.target.closest('.pp-erow'), f = e.target.getAttribute('data-f'); if (r && f) list()[+r.getAttribute('data-i')][f] = e.target.value; });
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (!b) return; list().splice(+b.closest('.pp-erow').getAttribute('data-i'), 1); drawBulRows(); drawClergy(); });
  }
  editRows($('b-ints'), function () { return ints; }); editRows($('b-anns'), function () { return anns; });
  $('b-int-add').addEventListener('click', function () { ints.push({ when: '', intention: '', by: '' }); drawBulRows(); var x = $('b-ints').querySelectorAll('input'); x[x.length - 3].focus(); });
  $('b-ann-add').addEventListener('click', function () { anns.push({ title: '', body: '' }); drawBulRows(); var x = $('b-anns').querySelectorAll('input'); x[x.length - 1].focus(); });
  $('b-load').addEventListener('change', function () { var id = +this.value; fillBul((D.bulletins || []).filter(function (b) { return b.id === id; })[0] || null); });
  $('b-week').addEventListener('change', pdfLink);
  function saveBul(publish) {
    var week = $('b-week').value;
    if (!/^\d{4}-\d\d-\d\d$/.test(week)) { msg('b-msg', 'Choose the Sunday the bulletin is for.'); $('b-week').focus(); return; }
    var body = { week_of: week, pastor_note: $('b-note').value.trim(), publish: publish,
      intentions: ints.filter(function (x) { return x.intention.trim(); }), announcements: anns.filter(function (x) { return x.title.trim(); }) };
    msg('b-msg', publish ? 'Publishing…' : 'Saving…', true);
    P.api('/api/admin/bulletins', { method: 'POST', body: body }).then(function (j) {
      if (!j.ok) { msg('b-msg', P.err(j)); return; }
      var b = { id: j.id, week_of: week, pastor_note: body.pastor_note, intentions: body.intentions, announcements: body.announcements, published_at: j.published_at };
      D.bulletins = (D.bulletins || []).filter(function (x) { return x.id !== j.id && x.week_of !== week; }).concat([b]).sort(function (a, c) { return a.week_of < c.week_of ? 1 : -1; });
      bulId = j.id; bulSelect(); $('b-del').hidden = false; dash(); draftLabel(b);
      msg('b-msg', publish ? 'Published. It shows on the parish page within a few minutes.' : 'Draft saved. It is not on the parish page until you publish it.', true);
    });
  }
  $('b-draft').addEventListener('click', function () { saveBul(false); });
  $('b-pub').addEventListener('click', function () { saveBul(true); });
  $('b-del').addEventListener('click', function () {
    if (!bulId || !confirm('Delete this bulletin? It is removed from the parish page too.')) return;
    P.api('/api/admin/bulletins/' + bulId, { method: 'DELETE' }).then(function (j) {
      if (!j.ok && j.status !== 404) { msg('b-msg', P.err(j)); return; }
      D.bulletins = D.bulletins.filter(function (x) { return x.id !== bulId; }); fillBul(null); bulSelect(); dash(); msg('b-msg', 'Deleted.', true);
    });
  });

  // ---------- Clergy, office, access, languages ----------
  function drawClergy() { $('dt-clergy').innerHTML = rowsHtml(clergy, CF, 'cl'); }
  editRows($('dt-clergy'), function () { return clergy; });
  $('dt-cl-add').addEventListener('click', function () { if (clergy.length >= 12) return; clergy.push({ name: '', role: '' }); drawClergy(); var x = $('dt-clergy').querySelectorAll('input'); x[x.length - 2].focus(); });
  function fillDetails() {
    var p = D.parish, ax = p.accessibility || {};
    $('dt-pastor').value = p.pastor_name || ''; $('dt-office').value = p.office_hours || ''; $('dt-langs').value = (p.languages || []).join(', ');
    $('dt-cnote').value = p.confession_notes || ''; $('dt-anote').value = p.adoration_notes || '';
    clergy = (p.clergy || []).map(function (c) { return { name: c.name, role: c.role }; }); drawClergy();
    $('dt-access').innerHTML = ACC.map(function (a) {
      var v = typeof ax[a[0]] === 'boolean' ? (ax[a[0]] ? '1' : '0') : '';
      return '<label>' + P.esc(a[1]) + ' <select id="ax-' + a[0] + '">' + opt('', 'Not stated', v) + opt('1', 'Yes', v) + opt('0', 'No', v) + '</select></label>';
    }).join('');
  }
  function details() {
    var p = D.parish;
    return { pastor_name: p.pastor_name || '', clergy: p.clergy || [], office_hours: p.office_hours || '', accessibility: p.accessibility || {},
      languages: p.languages || [], confession_notes: p.confession_notes || '', adoration_notes: p.adoration_notes || '' };
  }
  function saveDetails(over, id) {
    var b = details(); Object.keys(over).forEach(function (k) { b[k] = over[k]; });
    msg(id, 'Saving…', true);
    P.api('/api/admin/details', { method: 'PUT', body: b }).then(function (j) {
      if (!j.ok) { msg(id, P.err(j)); return; }
      var p = D.parish; p.pastor_name = b.pastor_name; p.clergy = b.clergy; p.office_hours = b.office_hours; p.accessibility = b.accessibility;
      p.languages = b.languages; p.confession_notes = b.confession_notes; p.adoration_notes = b.adoration_notes;
      if (Object.prototype.hasOwnProperty.call(b.accessibility, 'wheelchair')) p.wheelchair_accessible = b.accessibility.wheelchair ? 1 : 0;
      msg(id, 'Saved. The parish page shows it within a few minutes.', true); dash();
    });
  }
  $('f-det').addEventListener('submit', function (e) {
    e.preventDefault();
    var acc = {}; ACC.forEach(function (a) { var v = $('ax-' + a[0]).value; if (v) acc[a[0]] = v === '1'; });
    saveDetails({ pastor_name: $('dt-pastor').value.trim(), clergy: clergy.filter(function (c) { return c.name.trim(); }).map(function (c) { return { name: c.name.trim(), role: c.role.trim() }; }),
      office_hours: $('dt-office').value.trim(), accessibility: acc, languages: $('dt-langs').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean) }, 'dt-msg');
  });
  $('f-snotes').addEventListener('submit', function (e) { e.preventDefault(); saveDetails({ confession_notes: $('dt-cnote').value.trim(), adoration_notes: $('dt-anote').value.trim() }, 'sn-msg'); });

  // ---------- Ministries ----------
  function drawMins() {
    var cats = D.ministry_categories || ['Other'];
    $('mn-list').innerHTML = mins.length ? mins.map(function (m, i) {
      var lab = function (t) { return P.esc(t + ', ministry ' + (i + 1)); };
      return '<fieldset class="pp-card pp-minform" data-i="' + i + '"><legend>' + P.esc(m.name || 'New ministry') + '</legend><div class="pp-grid two">' +
        '<label>Name <input data-f="name" maxlength="100" value="' + P.esc(m.name) + '" aria-label="' + lab('Name') + '"></label>' +
        '<label>Category <select data-f="category" aria-label="' + lab('Category') + '">' + cats.map(function (c) { return opt(c, c, m.category); }).join('') + '</select></label>' +
        '<label>When and where <input data-f="schedule_text" maxlength="160" value="' + P.esc(m.schedule_text) + '" placeholder="Tuesdays at 7 p.m. in the hall"></label>' +
        '<label>Contact name <input data-f="contact_name" maxlength="100" value="' + P.esc(m.contact_name) + '"></label>' +
        '<label>Contact email (public) <input data-f="contact_email" type="email" maxlength="200" value="' + P.esc(m.contact_email) + '"></label></div>' +
        '<label>Description <textarea data-f="description" maxlength="600">' + P.esc(m.description) + '</textarea></label>' +
        '<p class="pp-row"><button class="btn" type="button" data-mrm="1">Remove this ministry</button></p></fieldset>';
    }).join('') : '<p class="pp-mut">No ministries listed yet.</p>';
  }
  $('mn-list').addEventListener('input', function (e) { var f = e.target.getAttribute('data-f'), c = e.target.closest('[data-i]'); if (!f || !c) return; mins[+c.getAttribute('data-i')][f] = e.target.value; minDirty = true; msg('mn-msg', 'Unsaved changes'); });
  $('mn-list').addEventListener('click', function (e) { var b = e.target.closest('[data-mrm]'); if (!b) return; mins.splice(+b.closest('[data-i]').getAttribute('data-i'), 1); minDirty = true; drawMins(); msg('mn-msg', 'Unsaved changes'); });
  $('mn-add').addEventListener('click', function () {
    if (mins.length >= 60) return;
    mins.push({ name: '', category: 'Other', schedule_text: '', contact_name: '', contact_email: '', description: '' }); minDirty = true; drawMins();
    var f = $('mn-list').querySelectorAll('fieldset'); f[f.length - 1].querySelector('input').focus();
  });
  $('mn-save').addEventListener('click', function () {
    var bad = mins.findIndex(function (m) { return m.name.trim().length < 2 || (m.contact_email && !/^\S+@\S+\.\S+$/.test(m.contact_email.trim())); });
    if (bad >= 0) { msg('mn-msg', 'Each ministry needs a name, and a contact email must be a full address.'); $('mn-list').querySelectorAll('fieldset')[bad].querySelector('input').focus(); return; }
    msg('mn-msg', 'Saving…', true);
    var items = mins.map(function (m) { return { name: m.name.trim(), category: m.category, schedule_text: m.schedule_text.trim(), contact_name: m.contact_name.trim(), contact_email: m.contact_email.trim(), description: m.description.trim() }; });
    P.api('/api/admin/ministries', { method: 'PUT', body: { items: items } }).then(function (j) {
      if (!j.ok) { msg('mn-msg', P.err(j)); return; }
      D.ministries = items; minDirty = false; msg('mn-msg', 'Saved.', true); dash();
    });
  });

  // ---------- Print presets ----------
  function presets() {
    $('pr-presets').innerHTML = TPL.map(function (t) {
      return '<a class="pp-card" href="/generator?parish=' + encodeURIComponent(slug) + '&amp;tpl=' + t[0] + '&amp;fmt=' + t[1] + '"><h3>' + P.esc(t[2]) + '</h3><p>' + P.esc(t[3]) + '</p><span class="pp-go">Open in the Print Generator →</span></a>';
    }).join('');
  }

  // ---------- Canon Law and Catechism reference ----------
  function area(r) {
    if (r.src === 'CCC') return 'ccc';
    if (r.from >= 840 && r.to <= 1165) return 'sac';
    if ((r.from >= 515 && r.to <= 552) || (r.from >= 1254 && r.to <= 1310)) return 'gov';
    return 'other';
  }
  function drawRef() {
    if (!REF) return;
    var q = $('rf-q').value.trim().toLowerCase(), ar = $('rf-area').value, cat = $('rf-cat').value, num = /^\d{1,4}$/.test(q) ? +q : null;
    var hits = REF.items.filter(function (r) {
      if (ar && area(r) !== ar) return false;
      if (cat && r.cats.indexOf(cat) < 0) return false;
      if (num !== null) return num >= r.from && num <= r.to;
      return !q || (r.title + ' ' + r.summary + ' ' + r.cats.join(' ') + ' ' + r.ref).toLowerCase().indexOf(q) >= 0;
    });
    $('rf-count').textContent = hits.length + (hits.length === 1 ? ' entry' : ' entries');
    $('rf-list').innerHTML = hits.map(function (r, i) {
      var id = 'rf-c' + i;
      return '<article class="pp-card pp-refc"><p class="pp-tags"><span class="pp-tag dean">' + P.esc(r.ref) + '</span><span class="pp-tag">' + P.esc(r.source) + '</span>' + r.cats.map(function (c) { return '<span class="pp-tag">' + P.esc(c) + '</span>'; }).join('') + '</p>' +
        '<h3>' + P.esc(r.title) + '</h3><p>' + P.esc(r.summary) + '</p>' +
        '<p class="pp-vh" id="' + id + '">' + P.esc(r.title + ': ' + r.ref + ', ' + r.source + '. Summary, not the official text: ' + r.url) + '</p>' +
        '<p class="pp-row"><a class="btn" href="' + P.esc(r.url) + '" target="_blank" rel="noopener">Official text on vatican.va</a> <button class="btn" type="button" data-copy="' + id + '">Copy the citation</button></p></article>';
    }).join('') || '<p class="pp-mut">Nothing matches. Try a canon or paragraph number, or a word such as “sponsor”.</p>';
  }
  function loadRef() {
    if (REF) return;
    REF = { items: [] };
    fetch('/data/reference-index.json').then(function (r) { return r.json(); }).then(function (j) {
      REF = j; var cats = {}; j.items.forEach(function (r) { r.cats.forEach(function (c) { cats[c] = 1; }); });
      $('rf-cat').innerHTML = '<option value="">Any topic</option>' + Object.keys(cats).sort().map(function (c) { return opt(c, c, ''); }).join('');
      drawRef();
    }, function () { REF = null; $('rf-list').innerHTML = '<p>The reference could not be loaded. Try again.</p>'; });
  }
  $('rf').addEventListener('input', drawRef);
  $('rf').addEventListener('submit', function (e) { e.preventDefault(); });

  // ---------- Widget builder ----------
  function widget() {
    var k = (document.querySelector('[name=wb-k]:checked') || {}).value || 'parish', th = $('wb-theme').value, c = $('wb-compact').checked, w = $('wb-w').value;
    var h = Math.max(200, Math.min(1200, +$('wb-h').value || 460));
    var q = (k === 'parish' ? ['slug=' + slug] : []).concat(th ? ['theme=' + th] : []).concat(c ? ['compact=1'] : []);
    var src = location.origin + '/embed/' + (k === 'parish' ? 'parish' : 'today') + '.html' + (q.length ? '?' + q.join('&') : '');
    var title = k === 'parish' ? D.parish.name + ': Mass and Confession times' : 'Today’s Mass readings';
    $('wb-code').value = '<iframe src="' + src + '" title="' + title.replace(/"/g, '&quot;') + '" width="' + w + '" height="' + h + '" style="border:0;max-width:100%" loading="lazy"></iframe>';
    var f = $('wb-frame'); if (f.getAttribute('src') !== src) f.setAttribute('src', src);
    f.style.height = h + 'px'; f.style.width = w === '100%' ? '100%' : w + 'px';
  }
  $('wb').addEventListener('input', widget); $('wb').addEventListener('change', widget);

  // ---------- called by admin.js ----------
  window.PPOps = {
    dash: function () { if (D) dash(); },
    draw: function (d) {
      var fresh = !D || slug !== d.parish.slug;
      D = d; slug = d.parish.slug;
      if (fresh) {
        spec = (d.specials || []).map(function (r) { return { event_date: r.event_date, occasion_name: r.occasion_name, category: r.category, start_time: r.start_time || '', end_time: r.end_time || '', language: r.language || 'English', notes: r.notes || '' }; });
        mins = (d.ministries || []).map(function (m) { return { name: m.name, category: m.category, schedule_text: m.schedule_text, contact_name: m.contact_name, contact_email: m.contact_email, description: m.description }; });
        var wk = nextSunday(today()), cur = (d.bulletins || []).filter(function (b) { return b.week_of === wk; })[0];
        fillBul(cur || null); bulSelect(); fillDetails(); drawSpec(); drawMins(); presets();
      }
      dash();
    },
    shown: function (id) {
      if (id === 'ref') loadRef();
      if (id === 'widget') widget();
      if (id === 'dash') dash();
    }
  };
  // admin.js may have loaded the parish before this file ran
  if (A.D) {
    window.PPOps.draw(A.D);
    var cur = document.querySelector('.pp-sidenav [aria-selected=true]'); if (cur) window.PPOps.shown(cur.id.slice(2));
  }
})();
