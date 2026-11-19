/* The live schedule engine (window.PPS), shared by the directory, the parish page, the schedule widget, the admin and the
   Print & PDF studio. Everything is worked out in Toronto time (America/Toronto), whatever the visitor's own clock says:
     PPS.now()                      {date: "YYYY-MM-DD", day: 0-6, hm: "HH:MM", year}
     PPS.status(times, specials)    badges for this moment: [{cls, text}] ("Next Mass today at 5:30 p.m.", "Confession open now"...)
     PPS.holyDays(year)             Canadian holy days, Holy Week and Easter, Christmas, and Ontario holidays: [{date, name, kind, note}]
     PPS.upcoming(from, days)       the same for the next <days> days from the date <from>
   times: rows {kind, day, start_time, end_time, language, note} or the directory's short form [kind, day, start, end, language, note];
   specials: rows {event_date, category, occasion_name, start_time, end_time} or [date, category, occasion, start, end]. */
(function () {
  var TZ = 'America/Toronto';
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var fmt = null;
  try { fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); } catch (e) {}
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function now(at) {
    var d = at || new Date(), y, m, dd, h, mi;
    if (fmt && fmt.formatToParts) {
      var o = {}; fmt.formatToParts(d).forEach(function (x) { o[x.type] = x.value; });
      y = +o.year; m = +o.month; dd = +o.day; h = +o.hour % 24; mi = +o.minute;
    } else { y = d.getFullYear(); m = d.getMonth() + 1; dd = d.getDate(); h = d.getHours(); mi = d.getMinutes(); }
    var date = y + '-' + p2(m) + '-' + p2(dd);
    return { date: date, day: new Date(Date.UTC(y, m - 1, dd)).getUTCDay(), hm: p2(h) + ':' + p2(mi), year: y };
  }
  // Dates as "YYYY-MM-DD" strings, counted in whole days (UTC arithmetic, so no clock change can shift them)
  function iso(dt) { return dt.getUTCFullYear() + '-' + p2(dt.getUTCMonth() + 1) + '-' + p2(dt.getUTCDate()); }
  function parse(s) { var a = String(s).split('-'); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])); }
  function addDays(s, n) { var d = parse(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function dayOf(s) { return parse(s).getUTCDay(); }
  function nice(s, withDay) { var d = parse(s); return (withDay ? DAYS[d.getUTCDay()] + ', ' : '') + MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); }
  function time(t) {
    var m = /^(\d\d):(\d\d)$/.exec(t || ''); if (!m) return t || '';
    var h = +m[1], ap = h < 12 ? 'a.m.' : 'p.m.'; h = h % 12 || 12;
    return h + ':' + m[2] + ' ' + ap;
  }
  function mins(t) { var m = /^(\d\d):(\d\d)$/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : -1; }

  // Gregorian Easter (anonymous algorithm, the same result as easterMD in liturgy.js)
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return iso(new Date(Date.UTC(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1)));
  }
  // The nth weekday (0 Sunday) of a month, or the last one before a date
  function nth(y, m, wd, n) { var d = new Date(Date.UTC(y, m - 1, 1)); d.setUTCDate(1 + (wd - d.getUTCDay() + 7) % 7 + (n - 1) * 7); return iso(d); }
  function before(s, wd) { var d = parse(s); do d.setUTCDate(d.getUTCDate() - 1); while (d.getUTCDay() !== wd); return iso(d); }

  // kind: obligation (a holy day of obligation in Canada), solemnity, holyweek, feast, holiday (Ontario statutory or civic)
  function holyDays(y) {
    var E = easter(y), out = [];
    function add(date, name, kind, note) { out.push({ date: date, name: name, kind: kind, note: note || '' }); }
    add(y + '-01-01', 'Mary, Mother of God', 'obligation', 'Holy day of obligation in Canada; New Year’s Day (office usually closed)');
    var epi = y + '-01-02'; while (dayOf(epi) !== 0) epi = addDays(epi, 1);
    add(epi, 'The Epiphany of the Lord', 'solemnity', 'Kept on the Sunday between January 2 and 8 in Canada');
    add(nth(y, 2, 1, 3), 'Family Day', 'holiday', 'Ontario statutory holiday');
    add(y + '-03-19', 'Saint Joseph', 'solemnity', 'Moved when it falls on a Sunday of Lent or in Holy Week');
    add(y + '-03-25', 'The Annunciation of the Lord', 'solemnity', 'Moved when it falls in Holy Week or the Easter Octave');
    add(addDays(E, -46), 'Ash Wednesday', 'holyweek', 'Day of fasting and abstinence; ashes at Mass');
    add(addDays(E, -7), 'Palm Sunday', 'holyweek', 'Holy Week begins');
    add(addDays(E, -3), 'Holy Thursday', 'holyweek', 'Mass of the Lord’s Supper in the evening');
    add(addDays(E, -2), 'Good Friday', 'holyweek', 'Celebration of the Lord’s Passion; no Mass. Fasting and abstinence. Statutory holiday');
    add(addDays(E, -1), 'Holy Saturday', 'holyweek', 'The Easter Vigil after nightfall');
    add(E, 'Easter Sunday', 'solemnity', 'The Resurrection of the Lord');
    add(addDays(E, 1), 'Easter Monday', 'holiday', 'Some parish offices close');
    add(before(y + '-05-25', 1), 'Victoria Day', 'holiday', 'Ontario statutory holiday');
    add(addDays(E, 42), 'The Ascension of the Lord', 'solemnity', 'Kept on the Seventh Sunday of Easter in Canada');
    add(addDays(E, 49), 'Pentecost Sunday', 'solemnity');
    add(addDays(E, 63), 'The Most Holy Body and Blood of Christ', 'solemnity', 'Kept on the Sunday after Trinity Sunday in Canada');
    add(y + '-07-01', 'Canada Day', 'holiday', 'Statutory holiday');
    add(nth(y, 8, 1, 1), 'Civic Holiday', 'holiday', 'Most offices close in Ontario');
    add(y + '-08-15', 'The Assumption of the Blessed Virgin Mary', 'solemnity');
    add(nth(y, 9, 1, 1), 'Labour Day', 'holiday', 'Statutory holiday');
    add(y + '-09-30', 'National Day for Truth and Reconciliation', 'holiday', 'Federal day of remembrance');
    add(nth(y, 10, 1, 2), 'Thanksgiving', 'holiday', 'Ontario statutory holiday');
    add(y + '-11-01', 'All Saints', 'solemnity');
    add(y + '-11-02', 'All Souls', 'feast', 'The Commemoration of All the Faithful Departed');
    add(y + '-12-08', 'The Immaculate Conception', 'solemnity', 'Not a holy day of obligation in Canada; moved to December 9 when it falls on a Sunday');
    add(y + '-12-24', 'Christmas Eve', 'solemnity', 'Evening Masses of the Nativity fulfil the Christmas obligation');
    add(y + '-12-25', 'Christmas Day', 'obligation', 'Holy day of obligation in Canada; statutory holiday');
    add(y + '-12-26', 'Boxing Day', 'holiday', 'Statutory holiday');
    return out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  }
  function upcoming(from, days) {
    var to = addDays(from, days), y = +from.slice(0, 4);
    return holyDays(y).concat(holyDays(y + 1)).filter(function (h) { return h.date >= from && h.date <= to; });
  }

  function T(r) { return Array.isArray(r) ? { kind: r[0], day: r[1], start_time: r[2], end_time: r[3] || '', language: r[4] || '', note: r[5] || '' } : r; }
  function X(r) { return Array.isArray(r) ? { event_date: r[0], category: r[1], occasion_name: r[2], start_time: r[3] || '', end_time: r[4] || '' } : r; }
  var MASS = { sunday: 1, weekday: 1 };
  // Masses "first Friday of the month" and the like are not every week, so they never make a "next Mass" badge
  function weekly(r) { return !/month|first|second|third|fourth|last/i.test(r.note || ''); }
  function lang(r) { return r.language && r.language !== 'English' ? ' (' + r.language + ')' : ''; }

  function status(times, specials, at) {
    var n = now(at), hm = n.hm, cur = mins(hm), out = [];
    times = (times || []).map(T); specials = (specials || []).map(X);
    var todaySp = specials.filter(function (s) { return s.event_date === n.date; });
    var noMass = todaySp.some(function (s) { return s.category === 'no_mass'; });
    function windowOpen(kind, label, cls) {
      var rows = times.filter(function (r) { return r.kind === kind && r.day === n.day && r.end_time && weekly(r); }).map(function (r) { return { s: r.start_time, e: r.end_time }; })
        .concat(todaySp.filter(function (s) { return s.category === kind && s.end_time; }).map(function (s) { return { s: s.start_time, e: s.end_time }; }));
      var open = rows.filter(function (r) { return r.s <= hm && hm < r.e; })[0];
      if (open) { out.push({ cls: cls + ' live', text: label + ' open now, until ' + time(open.e) }); return true; }
      var later = rows.filter(function (r) { return r.s > hm; }).sort(function (a, b) { return a.s < b.s ? -1 : 1; })[0];
      if (later) out.push({ cls: cls, text: label + ' today at ' + time(later.s) });
      return false;
    }
    // Masses today: the regular ones (unless a "no Mass" day) and any special Mass or liturgy of today
    var masses = (noMass ? [] : times.filter(function (r) { return MASS[r.kind] && r.day === n.day && weekly(r); }).map(function (r) { return { s: r.start_time, l: lang(r) }; }))
      .concat(todaySp.filter(function (s) { return (s.category === 'mass' || s.category === 'liturgy') && s.start_time; }).map(function (s) { return { s: s.start_time, l: '' }; }))
      .sort(function (a, b) { return a.s < b.s ? -1 : 1; });
    var now1 = masses.filter(function (m) { var s = mins(m.s); return s <= cur && cur < s + 60; })[0];
    var next = masses.filter(function (m) { return m.s > hm; })[0];
    if (now1) out.push({ cls: 'mass live', text: 'Mass under way (began ' + time(now1.s) + ')' });
    if (next) out.push({ cls: 'mass', text: 'Next Mass today at ' + time(next.s) + next.l });
    else if (!now1) {
      // The next day with a Mass, within a week
      for (var i = 1; i <= 7; i++) {
        var dd = addDays(n.date, i), wd = dayOf(dd), sp = specials.filter(function (s) { return s.event_date === dd; });
        var none = sp.some(function (s) { return s.category === 'no_mass'; });
        var ms = (none ? [] : times.filter(function (r) { return MASS[r.kind] && r.day === wd && weekly(r); }).map(function (r) { return r.start_time; }))
          .concat(sp.filter(function (s) { return (s.category === 'mass' || s.category === 'liturgy') && s.start_time; }).map(function (s) { return s.start_time; })).sort();
        if (ms.length) { out.push({ cls: 'mass soon', text: 'Next Mass ' + (i === 1 ? 'tomorrow' : DAYS[wd]) + ' at ' + time(ms[0]) }); break; }
      }
    }
    windowOpen('confession', 'Confession', 'conf');
    windowOpen('adoration', 'Adoration', 'ador');
    if (noMass) out.unshift({ cls: 'alert', text: 'No Mass today' + (todaySp[0] ? ': ' + todaySp.filter(function (s) { return s.category === 'no_mass'; })[0].occasion_name : '') });
    if (todaySp.some(function (s) { return s.category === 'office_closed'; })) out.push({ cls: 'alert', text: 'Parish office closed today' });
    var sp7 = specials.filter(function (s) { return s.event_date >= n.date && s.event_date <= addDays(n.date, 7) && s.category !== 'office_closed'; });
    if (sp7.length) {
      var first = sp7.sort(function (a, b) { return a.event_date < b.event_date ? -1 : 1; })[0];
      out.push({ cls: 'special', text: 'Special Holy Day Schedule: ' + first.occasion_name + (first.event_date === n.date ? ' today' : ', ' + nice(first.event_date)) });
    }
    return out;
  }
  // The badges as HTML (the page's esc function keeps the text safe)
  function badges(list, esc) {
    return list.map(function (b) { return '<span class="pp-live ' + esc(b.cls) + '">' + (/live/.test(b.cls) ? '<i aria-hidden="true"></i>' : '') + esc(b.text) + '</span>'; }).join(' ');
  }
  window.PPS = { now: now, status: status, badges: badges, holyDays: holyDays, upcoming: upcoming, easter: easter, addDays: addDays, dayOf: dayOf, nice: nice, time: time, DAYS: DAYS, MON: MON };
})();
