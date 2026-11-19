/* The widget (embed/today.html): the day from the visitor's own clock, with the liturgical day and Rosary mysteries
   from liturgy.js (the main site's own code) and the readings from data/readings-ca.json (the Canadian lectionary).
   ?compact=1 shows the day and the readings only; ?theme=light|dark is applied by theme.js. */
(function () {
  var L = window.VDLit, w = document.getElementById('w'), q = new URLSearchParams(location.search);
  var COL = { green: 'var(--lit)', violet: '#6b4fa0', rose: '#c46a8c', red: '#b3261e', white: '#c2a24a' };
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function bg(ref) { return 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(ref) + '&version=RSVCE'; }
  if (q.get('compact') === '1') w.classList.add('compact');
  function draw(RD) {
    var now = new Date(), d = L.litDay(now), key = now.getFullYear() + '-' + p2(now.getMonth() + 1) + '-' + p2(now.getDate()), e = RD && RD[key];
    var R = L.ROS[L.RDAY[now.getDay()]], col = d.col.charAt(0).toUpperCase() + d.col.slice(1);
    w.style.setProperty('--wc', COL[d.col] || 'var(--lit)');
    var rows = e ? [['First reading', e.r1], ['Psalm', e.ps], ['Second reading', e.r2], ['Gospel', e.g]].filter(function (x) { return x[1]; }) : [];
    w.innerHTML = '<p class="k"><i></i>' + esc(d.season) + ' · ' + esc(col) + '</p>' +
      '<h1>' + esc(e && e.t ? e.t : d.title) + '</h1>' +
      '<p class="d">' + esc(L.WD[now.getDay()] + ', ' + MON[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear()) + '</p>' +
      (rows.length ? '<ul>' + rows.map(function (x) { return '<li><span>' + x[0] + '</span><a href="' + esc(bg(x[1])) + '" target="_blank" rel="noopener">' + esc(x[1]) + '</a></li>'; }).join('') + '</ul>'
        : '<p><a href="https://verbumdomini.ca/?today" target="_blank" rel="noopener">Today’s readings on Verbum Domini</a></p>') +
      (e && e.th ? '<blockquote>' + esc(e.th.q) + '<small>' + (e.th.u ? '<a href="' + esc(e.th.u) + '" target="_blank" rel="noopener">' + esc(e.th.by) + '</a>' : esc(e.th.by)) + '</small></blockquote>' : '') +
      '<p class="ros">Rosary today: the <a href="https://verbumdomini.ca/rosary.html" target="_blank" rel="noopener">' + esc(R.n) + ' Mysteries</a></p>' +
      '<p class="f"><span>Readings of the Canadian lectionary</span><a href="https://verbumdomini.ca/?today" target="_blank" rel="noopener">Verbum Domini</a></p>';
  }
  fetch('/data/readings-ca.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(draw, function () { draw(null); });
  // Past midnight the card turns to the new day
  var day = new Date().getDate();
  setInterval(function () { if (new Date().getDate() !== day) { day = new Date().getDate(); location.reload(); } }, 60000);
})();
