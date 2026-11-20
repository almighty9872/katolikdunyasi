/* Overview (/): the directory's figures from /api/parishes (cached at the edge), a bar chart of parishes by area,
   the coverage gauge, and the liturgical day from liturgy.js (the same calendar as verbumdomini.ca). */
(function () {
  var P = window.PP, S = window.PPS, $ = function (id) { return document.getElementById(id); };
  var AREAS = ['Toronto', 'Mississauga', 'Brampton', 'York Region', 'Durham Region', 'Peel/Caledon', 'Simcoe/Georgian'];
  var NS = 'http://www.w3.org/2000/svg';
  function n(x) { return Number(x).toLocaleString('en-CA'); }

  // ---- the liturgical day ----
  var L = window.VDLit, d = L ? L.litDay(new Date()) : null, lit = $('ov-lit');
  if (d) {
    if (d.col !== 'green') lit.setAttribute('data-lc', d.col);
    var h = S ? +S.now().hm.slice(0, 2) : new Date().getHours();
    $('lit-greet').textContent = (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + (S ? '. ' + S.nice(S.now().date, true) : '');
    $('lit-h').textContent = d.title;
    $('lit-col').textContent = d.season;
    var C = { green: 'green', violet: 'violet', rose: 'rose', red: 'red', white: 'white or gold' };
    $('lit-sum').textContent = 'The Church is in ' + d.season + '. The vestments today are ' + (C[d.col] || d.col) + '.' +
      (S ? (function () { var x = S.upcoming(S.now().date, 40).filter(function (h) { return h.kind !== 'holiday' && h.kind !== 'feast'; })[0]; return x ? ' Next: ' + x.name + ', ' + S.nice(x.date, true) + '.' : ''; })() : '');
  }
  if (S) {
    var up = S.upcoming(S.now().date, 60).filter(function (h) { return h.kind !== 'feast'; }).slice(0, 5);
    $('ov-holy').innerHTML = up.length ? up.map(function (h) {
      var cls = h.kind === 'obligation' ? 'rk' : h.kind === 'holyweek' ? 'vio' : h.kind === 'holiday' ? 'ac' : 'gold';
      return '<div class="accent-row ' + cls + '"><span><span class="ar-t">' + P.esc(h.name) + '</span><span class="ar-s">' + P.esc(h.kind === 'obligation' ? 'Holy day of obligation' : h.kind === 'holiday' ? 'Ontario holiday: office hours change' : h.kind === 'holyweek' ? 'Holy Week and Lent' : 'Solemnity') + '</span></span><span class="ar-v">' + P.esc(S.nice(h.date)) + '</span></div>';
    }).join('') : '<p class="pp-mut">No holy days in the next two months.</p>';
  }

  // ---- the directory's figures ----
  P.api('/api/parishes').then(function (j) {
    if (!j.ok) { $('ov-chart').innerHTML = '<p class="pp-mut">' + P.esc(P.err(j)) + '</p>'; return; }
    var all = j.parishes, claimed = all.filter(function (p) { return p.claimed; }).length;
    var masses = all.reduce(function (a, p) { return a + p.t.filter(function (x) { return (x[0] === 'sunday' || x[0] === 'weekday') && !/month/i.test(x[5] || ''); }).length; }, 0);
    $('k-total').textContent = $('k-dir').textContent = n(all.length); $('k-claimed').textContent = $('s-claimed').textContent = n(claimed); $('k-masses').textContent = n(masses);
    chart(AREAS.map(function (a) {
      var ps = all.filter(function (p) { return p.area === a; });
      return { a: a, t: ps.length, c: ps.filter(function (p) { return p.claimed; }).length };
    }).filter(function (x) { return x.t; }));
    var conf = all.filter(function (p) { return p.t.some(function (x) { return x[0] === 'confession'; }); }).length;
    var acc = all.filter(function (p) { return p.access === 1; }).length, sp = all.filter(function (p) { return p.x && p.x.length; }).length;
    var pct = all.length ? Math.round(claimed / all.length * 100) : 0;
    gauge(pct);
    $('cov-pill').textContent = pct + '% kept by parishes';
    $('cov-rows').innerHTML = [['lit', 'Confession times listed', conf, '/directory?confession=1'], ['ac', 'Wheelchair accessible', acc, '/directory?access=1'], ['gold', 'Special schedule posted', sp, '/directory?special=1']].map(function (r) {
      return '<a class="accent-row ' + r[0] + ' pp-nl" href="' + r[3] + '"><span><span class="ar-t">' + r[1] + '</span></span><span class="ar-v">' + n(r[2]) + '</span></a>';
    }).join('');
  });

  // ---- a radial gauge: the share of parishes whose staff keep the listing ----
  function gauge(pct) {
    var r = 52, c = 2 * Math.PI * r * 0.75, v = c * pct / 100;
    $('cov-g').innerHTML = '<svg viewBox="0 0 140 124" role="img" aria-label="' + pct + '% of parishes keep their own listing">' +
      '<circle class="g-tr" cx="70" cy="70" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + ' 999" transform="rotate(135 70 70)"/>' +
      (pct ? '<circle class="g-v" cx="70" cy="70" r="' + r + '" stroke-dasharray="' + v.toFixed(1) + ' 999" transform="rotate(135 70 70)"/>' : '') +
      '<text x="70" y="70" class="g-n">' + pct + '%</text><text x="70" y="90" class="g-l">claimed</text></svg>';
  }

  // ---- bars by area: the claimed part in the accent, the rest in its tint; hover or focus for the figures ----
  function chart(rows) {
    var W = 640, H = 230, pl = 34, pb = 34, pt = 12, max = Math.max.apply(null, rows.map(function (r) { return r.t; })), step = Math.ceil(max / 4 / 10) * 10 || 10, top = step * 4;
    var bw = (W - pl) / rows.length, w = Math.min(46, bw * 0.56), y = function (v) { return pt + (H - pt - pb) * (1 - v / top); };
    var g = '';
    for (var k = 0; k <= 4; k++) g += '<line class="c-grid" x1="' + pl + '" x2="' + W + '" y1="' + y(k * step) + '" y2="' + y(k * step) + '"/><text class="c-ax" x="' + (pl - 8) + '" y="' + (y(k * step) + 4) + '" text-anchor="end">' + k * step + '</text>';
    rows.forEach(function (r, i) {
      var x = pl + bw * i + (bw - w) / 2, yt = y(r.t), yc = y(r.c), b = y(0);
      // The tint (the whole), then the claimed part from the baseline, with a 2px gap where they meet
      var rest = r.t - r.c ? '<path class="c-b" d="' + bar(x, yt, w, (r.c ? yc - 2 : b) - yt, true) + '"/>' : '';
      var cl = r.c ? '<path class="c-a" d="' + bar(x, yc, w, b - yc, !(r.t - r.c)) + '"/>' : '';
      g += '<a class="c-g pp-nl" href="/directory?area=' + encodeURIComponent(r.a) + '" data-i="' + i + '" aria-label="' + P.esc(r.a + ': ' + r.t + ' parishes, ' + r.c + ' claimed') + '">' +
        '<rect class="c-hit" x="' + (pl + bw * i) + '" y="' + pt + '" width="' + bw + '" height="' + (H - pt - pb) + '"/>' + rest + cl +
        '<text class="c-ax c-x" x="' + (x + w / 2) + '" y="' + (H - 12) + '" text-anchor="middle">' + P.esc(r.a.replace(' Region', '').replace('/Georgian', '').replace('/Caledon', '')) + '</text></a>';
    });
    var box = $('ov-chart');
    box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Parishes by area">' + g + '</svg><div class="c-tip" hidden></div>';
    $('ov-table').innerHTML = '<table><tr><th scope="col">Area</th><th scope="col">Parishes</th><th scope="col">Claimed</th></tr>' + rows.map(function (r) { return '<tr><th scope="row">' + P.esc(r.a) + '</th><td>' + r.t + '</td><td>' + r.c + '</td></tr>'; }).join('') + '</table>';
    var tip = box.querySelector('.c-tip');
    function show(e) {
      var a = e.target.closest && e.target.closest('.c-g'); if (!a) { tip.hidden = true; return; }
      var r = rows[+a.getAttribute('data-i')], bb = a.querySelector('.c-hit').getBoundingClientRect(), cb = box.getBoundingClientRect();
      tip.innerHTML = '<b>' + P.esc(r.a) + '</b><span>' + r.t + ' parishes</span><span>' + r.c + ' claimed</span>';
      tip.hidden = false; tip.style.left = Math.min(Math.max(bb.left - cb.left + bb.width / 2, 60), cb.width - 60) + 'px';
      [].forEach.call(box.querySelectorAll('.c-g'), function (x) { x.classList.toggle('dim', x !== a); });
    }
    function out() { tip.hidden = true; [].forEach.call(box.querySelectorAll('.c-g'), function (x) { x.classList.remove('dim'); }); }
    box.addEventListener('mouseover', show); box.addEventListener('focusin', show); box.addEventListener('mouseleave', out); box.addEventListener('focusout', out);
  }
  // A bar segment from y down to y+h; round: 4px rounded top corners (the topmost segment of a bar)
  function bar(x, y, w, h, round) {
    if (h <= 0) return '';
    var r = round ? Math.min(4, h, w / 2) : 0;
    return 'M' + x + ' ' + (y + h) + 'V' + (y + r) + (r ? 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y : '') + 'H' + (x + w - r) + (r ? 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) : '') + 'V' + (y + h) + 'Z';
  }
})();
