/* A small QR code encoder (ISO/IEC 18004): byte mode, error correction level M, versions 1 to 10 (up to 213 bytes),
   enough for any parish address. Runs in the browser, so the pew cards need no outside service.
   QR.matrix(text) -> array of rows of booleans (true = dark); QR.svg(text, quiet) -> an SVG string. */
(function (root) {
  // Per version (1-10), level M: total codewords, EC codewords per block, number of blocks
  var TOTAL = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
  var ECC = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  var BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  var ALIGN = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  function gmul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 255; }
  function divisor(deg) {
    var r = []; for (var i = 0; i < deg - 1; i++) r.push(0); r.push(1);
    var root = 1;
    for (i = 0; i < deg; i++) {
      for (var j = 0; j < r.length; j++) { r[j] = gmul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = gmul(root, 2);
    }
    return r;
  }
  function remainder(data, div) {
    var r = div.map(function () { return 0; });
    data.forEach(function (b) { var f = b ^ r.shift(); r.push(0); div.forEach(function (c, i) { r[i] ^= gmul(c, f); }); });
    return r;
  }
  function utf8(s) { var out = [], e = unescape(encodeURIComponent(s)); for (var i = 0; i < e.length; i++) out.push(e.charCodeAt(i)); return out; }

  function matrix(text) {
    var bytes = utf8(text), ver = 0;
    for (var v = 1; v <= 10; v++) {
      var cap = (TOTAL[v] - ECC[v] * BLOCKS[v]) * 8;
      if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= cap) { ver = v; break; }
    }
    if (!ver) throw new Error('QR: text too long');
    var size = 17 + 4 * ver, dataLen = TOTAL[ver] - ECC[ver] * BLOCKS[ver];
    // The data bits: mode, length, bytes, terminator, then padding
    var bits = [];
    function put(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, dataLen * 8 - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k]; data.push(b); }
    for (var pad = 0xec; data.length < dataLen; pad ^= 0xec ^ 0x11) data.push(pad);
    // Blocks with their error correction, interleaved
    var nb = BLOCKS[ver], el = ECC[ver], raw = TOTAL[ver], short = nb - raw % nb, shortLen = Math.floor(raw / nb), div = divisor(el), blocks = [];
    for (i = 0, k = 0; i < nb; i++) {
      var dat = data.slice(k, k + shortLen - el + (i < short ? 0 : 1)); k += dat.length;
      var ecc = remainder(dat, div);
      if (i < short) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var cw = [];
    for (i = 0; i < blocks[0].length; i++) for (var j = 0; j < nb; j++) if (i !== shortLen - el || j >= short) cw.push(blocks[j][i]);

    var M = [], F = [];
    for (i = 0; i < size; i++) { M.push(new Array(size).fill(false)); F.push(new Array(size).fill(false)); }
    function fn(x, y, d) { M[y][x] = d; F[y][x] = true; }
    for (i = 0; i < size; i++) { fn(6, i, i % 2 === 0); fn(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (c) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), x = c[0] + dx, y = c[1] + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) fn(x, y, d !== 2 && d !== 4);
      }
    });
    var al = ALIGN[ver], n = al.length;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) fn(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    function format(mask) {
      var d = (0 << 3) | mask, r = d;  // level M is 00
      for (var i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var bt = ((d << 10) | r) ^ 0x5412, g = function (i) { return ((bt >>> i) & 1) !== 0; };
      for (i = 0; i <= 5; i++) fn(8, i, g(i));
      fn(8, 7, g(6)); fn(8, 8, g(7)); fn(7, 8, g(8));
      for (i = 9; i < 15; i++) fn(14 - i, 8, g(i));
      for (i = 0; i < 8; i++) fn(size - 1 - i, 8, g(i));
      for (i = 8; i < 15; i++) fn(8, size - 15 + i, g(i));
      fn(8, size - 8, true);
    }
    format(0);
    if (ver >= 7) {
      var r = ver;
      for (i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      var vb = (ver << 12) | r;
      for (i = 0; i < 18; i++) { var bit = ((vb >>> i) & 1) !== 0, a = size - 11 + i % 3, c = Math.floor(i / 3); fn(a, c, bit); fn(c, a, bit); }
    }
    // The codewords, in the two-column zigzag from the bottom right
    var bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (j = 0; j < 2; j++) {
        var x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!F[y][x] && bi < cw.length * 8) { M[y][x] = ((cw[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0; bi++; }
      }
    }
    var MASKS = [
      function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; }, function (x) { return x % 3 === 0; },
      function (x, y) { return (x + y) % 3 === 0; }, function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
      function (x, y) { return x * y % 2 + x * y % 3 === 0; }, function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; },
      function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }];
    function apply(m) { for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (!F[y][x] && MASKS[m](x, y)) M[y][x] = !M[y][x]; }
    // Penalty score (runs, 2x2 blocks, finder-like patterns, balance), to choose the most readable mask
    function penalty() {
      var p = 0, dark = 0, x, y, run, line;
      for (var pass = 0; pass < 2; pass++) for (y = 0; y < size; y++) {
        run = 1; line = '';
        for (x = 0; x < size; x++) {
          var c = pass ? M[x][y] : M[y][x]; line += c ? '1' : '0';
          if (x > 0 && c === (pass ? M[x - 1][y] : M[y][x - 1])) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
        }
        p += 40 * ((line.match(/(?=10111010000|00001011101)/g) || []).length);
      }
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c0 = M[y][x]; if (c0 === M[y][x + 1] && c0 === M[y + 1][x] && c0 === M[y + 1][x + 1]) p += 3; }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (M[y][x]) dark++;
      var total = size * size;
      return p + 10 * Math.max(0, Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1);
    }
    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++) { apply(m); format(m); var s = penalty(); if (s < bestP) { bestP = s; best = m; } apply(m); }
    apply(best); format(best);
    return M;
  }

  function svg(text, quiet) {
    var M = matrix(text), q = quiet == null ? 4 : quiet, n = M.length + 2 * q, d = '';
    for (var y = 0; y < M.length; y++) for (var x = 0; x < M.length; x++) if (M[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" role="img" aria-label="QR code for ' +
      String(text).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }) + '"><rect width="' + n + '" height="' + n + '" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
  }
  root.QR = { matrix: matrix, svg: svg };
})(typeof window !== 'undefined' ? window : globalThis);
