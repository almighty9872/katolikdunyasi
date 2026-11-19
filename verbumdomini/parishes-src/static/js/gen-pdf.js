/* The PDF side of the Print and PDF studio (window.PPPdf.make(jsPDF, job)): lays out the same blocks gen.js shows in the
   preview, as a vector PDF with the standard PDF fonts (Times and Helvetica, no font files), using the locally served
   vendor/jspdf.umd.min.js. Nothing leaves the browser. Each panel's type is shrunk until it fits (as in the preview);
   the Letter Scripture packet flows from page to page, splitting a long passage between pages when it must.
   job: {W, H (sheet, inches), f (the format: w, h, panels, base, pad), cols, rows, ox, oy, marks: [[x1, y1, x2, y2]],
         accent: '#rrggbb', images: {src: HTMLImageElement}, qr: text -> matrix of booleans,
         sides: [[blocks of each panel] per printed side] or flow: [blocks]} */
(function (root) {
  var TX = [29, 27, 24], MUT = [92, 86, 80];
  // font, style, size (em of the base), space before and after (em), colour
  var ST = {
    kick: ['helvetica', 'bold', 0.72, 0, 0.35, 'acc'], h1: ['times', 'bold', 2.0, 0, 0.3, 'tx'], h2: ['times', 'bold', 1.42, 0.35, 0.25, 'tx'],
    h3: ['helvetica', 'bold', 0.92, 0.5, 0.15, 'acc'], p: ['times', 'normal', 1, 0, 0.45, 'tx'], psm: ['helvetica', 'normal', 0.8, 0, 0.4, 'mut'],
    pit: ['times', 'italic', 1, 0, 0.45, 'tx'], list: ['times', 'normal', 1, 0, 0.12, 'tx'], kk: ['helvetica', 'bold', 0.82, 0, 0, 'tx'],
    kvv: ['times', 'normal', 0.95, 0, 0, 'tx'], ref: ['helvetica', 'bold', 0.76, 0, 0.12, 'acc'], verse: ['times', 'normal', 0.95, 0, 0.5, 'tx'],
    cap: ['helvetica', 'italic', 0.68, 0.15, 0.35, 'mut'], qcap: ['helvetica', 'normal', 0.72, 0.15, 0.3, 'mut'], check: ['times', 'bold', 1, 0.15, 0.15, 'tx'],
    nt: ['helvetica', 'bold', 0.8, 0, 0.1, 'tx'], nb: ['times', 'normal', 0.9, 0, 0, 'tx'], foot: ['helvetica', 'normal', 0.6, 0, 0, 'mut']
  };
  // Characters outside the standard fonts' encoding (Windows-1252) are folded or dropped
  var CP = '\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178';
  function A(s) {
    s = String(s == null ? '' : s).replace(/[‐‑‒]/g, '-').replace(/−/g, '-').replace(/[′]/g, "'").replace(/ /g, ' ').replace(/✠|✝/g, '+').replace(/ł/g, 'l').replace(/Ł/g, 'L');
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], c = s.charCodeAt(i);
      if (c === 10 || (c >= 32 && c < 127) || (c >= 160 && c < 256) || CP.indexOf(ch) >= 0) { out += ch; continue; }
      var f = ch.normalize ? ch.normalize('NFD').replace(/[̀-ͯ]/g, '') : '';
      out += f && f.charCodeAt(0) < 256 ? f : '';
    }
    return out;
  }
  function rgb(hex) { var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || ''); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [138, 106, 20]; }

  function Ctx(doc, base, s, job, boxH) { this.doc = doc; this.pt = base * s; this.job = job; this.acc = rgb(job.accent); this.boxH = boxH; }
  Ctx.prototype.em = function (k) { return this.pt * k / 72; };
  Ctx.prototype.font = function (k) {
    var t = ST[k]; this.doc.setFont(t[0], t[1]); this.doc.setFontSize(this.pt * t[2]);
    var c = t[5] === 'acc' ? this.acc : t[5] === 'mut' ? MUT : TX; this.doc.setTextColor(c[0], c[1], c[2]);
    return t;
  };
  Ctx.prototype.lh = function (k) { return this.pt * ST[k][2] * 1.3 / 72; };
  Ctx.prototype.split = function (k, text, w) {
    this.font(k);
    return [].concat.apply([], A(text).split('\n').map(function (para) { return para ? this.doc.splitTextToSize(para, w) : ['']; }, this));
  };
  // Lines of one style; returns the height
  Ctx.prototype.lines = function (k, lines, x, y, w, draw, align) {
    var t = this.font(k), lh = this.lh(k), y0 = y + this.em(t[3]);
    if (draw) {
      for (var i = 0; i < lines.length; i++) {
        if (align === 'c') this.doc.text(lines[i], x + w / 2, y0 + i * lh, { baseline: 'top', align: 'center' });
        else this.doc.text(lines[i], x, y0 + i * lh, { baseline: 'top' });
      }
    }
    return this.em(t[3]) + lines.length * lh + this.em(t[4]);
  };
  Ctx.prototype.text = function (k, text, x, y, w, draw, align) { return this.lines(k, this.split(k, text, w), x, y, w, draw, align); };

  // One block: its height at this size, drawn if draw
  function block(c, b, x, y, w, draw) {
    var d = c.doc, h = 0, i, k;
    switch (b.t) {
      case 'kick': return c.text('kick', String(b.x).toUpperCase(), x, y, w, draw, 'c');
      case 'h1': return c.text('h1', b.x, x, y, w, draw, 'c');
      case 'h2': return c.text('h2', b.x, x, y, w, draw, b.c ? 'c' : '');
      case 'h3': return c.text('h3', b.x, x, y, w, draw);
      case 'p': return c.text(b.sm ? 'psm' : b.it ? 'pit' : 'p', b.x, x, y, w, draw, b.c ? 'c' : '');
      case 'list':
        for (i = 0; i < b.items.length; i++) {
          var ind = c.em(1.1), ls = c.split('list', b.items[i], w - ind);
          if (draw) { c.font('list'); d.text('•', x + c.em(0.2), y + h, { baseline: 'top' }); }
          h += c.lines('list', ls, x + ind, y + h, w - ind, draw);
        }
        return h + c.em(0.35);
      case 'check':
        var bx = c.em(0.8), cl = c.split('check', b.x, w - bx * 1.8);
        if (draw) { d.setDrawColor(TX[0], TX[1], TX[2]); d.setLineWidth(0.01); d.rect(x, y + c.em(0.15) + c.em(0.18), bx, bx); }
        return c.lines('check', cl, x + bx * 1.7, y, w - bx * 1.8, draw);
      case 'kv':
        var narrow = w < 1.9, kw = narrow ? w : Math.min(w * 0.36, c.em(9));
        for (i = 0; i < b.rows.length; i++) {
          var kl = c.split('kk', b.rows[i][0], narrow ? w : kw - c.em(0.6)), vl = c.split('kvv', b.rows[i][1], narrow ? w : w - kw);
          if (narrow) { h += c.lines('kk', kl, x, y + h, w, draw); h += c.lines('kvv', vl, x, y + h, w, draw) + c.em(0.25); }
          else {
            var a1 = c.lines('kk', kl, x, y + h, kw, draw), a2 = c.lines('kvv', vl, x + kw, y + h - c.em(0.05), w - kw, draw);
            h += Math.max(a1, a2) + c.em(0.22);
          }
        }
        return h + c.em(0.3);
      case 'verse':
        var vi = c.em(0.7);
        if (b.ref) h += c.text('ref', b.ref, x + vi, y, w - vi, draw);
        var vh = c.text('verse', b.x, x + vi, y + h, w - vi, draw);
        if (draw) { d.setDrawColor(c.acc[0], c.acc[1], c.acc[2]); d.setLineWidth(0.015); d.line(x + vi * 0.3, y, x + vi * 0.3, y + h + vh - c.em(0.5)); }
        return h + vh;
      case 'qr':
        var M = c.job.qr(b.url), n = M.length + 4, size = Math.min(b.size * w, c.boxH * 0.5, w), cell = size / n, qx = x + (w - size) / 2;
        if (draw) {
          d.setFillColor(0, 0, 0);
          for (var r = 0; r < M.length; r++) for (k = 0; k < M.length; k++) if (M[r][k]) d.rect(qx + (k + 2) * cell, y + (r + 2) * cell, cell * 1.02, cell * 1.02, 'F');
        }
        return size + c.text('qcap', b.cap, x, y + size, w, draw, 'c');
      case 'img':
        var im = c.job.images && c.job.images[b.src]; if (!im) return 0;
        var ar = (im.naturalWidth || im.width) / (im.naturalHeight || im.height) || 1.3, iw = w, ih = w / ar, hm = b.h * c.boxH;
        if (ih > hm) { ih = hm; iw = ih * ar; }
        if (draw) d.addImage(im, 'JPEG', x + (w - iw) / 2, y + c.em(0.2), iw, ih, b.src, 'MEDIUM');
        return c.em(0.2) + ih + c.text('cap', b.cap, x, y + c.em(0.2) + ih, w, draw, 'c');
      case 'rule':
        if (draw) { d.setDrawColor(c.acc[0], c.acc[1], c.acc[2]); d.setLineWidth(0.01); d.line(x + w * 0.3, y + c.em(0.4), x + w * 0.7, y + c.em(0.4)); }
        return c.em(0.9);
      case 'note':
        var ni = c.em(0.7), nh = c.text('nt', b.x, x + ni, y + c.em(0.4), w - ni * 1.4, draw);
        nh += c.text('nb', b.y, x + ni, y + c.em(0.4) + nh, w - ni * 1.4, draw) + c.em(0.8);
        if (draw) { d.setDrawColor(c.acc[0], c.acc[1], c.acc[2]); d.setLineWidth(0.02); d.line(x + ni * 0.3, y + c.em(0.3), x + ni * 0.3, y + nh - c.em(0.3)); }
        return nh + c.em(0.3);
      case 'foot':
        h = c.em(0.5);
        if (draw) { d.setDrawColor(MUT[0], MUT[1], MUT[2]); d.setLineWidth(0.006); d.line(x, y + c.em(0.2), x + w, y + c.em(0.2)); }
        for (i = 0; i < b.lines.length; i++) h += c.text('foot', b.lines[i], x, y + h, w, draw);
        return h;
    }
    return 0;
  }
  function height(c, blocks, w) { var h = 0; for (var i = 0; i < blocks.length; i++) h += block(c, blocks[i], 0, h, w, false); return h; }

  // One panel: the largest size (100% down to 55%) at which it fits; the footer sits at the bottom
  function panel(doc, job, blocks, x, y, pw, ph, s) {
    var f = job.f, w = pw - 2 * f.pad, bh = ph - 2 * f.pad;
    var body = blocks.filter(function (b) { return b.t !== 'foot'; }), ft = blocks.filter(function (b) { return b.t === 'foot'; });
    if (s == null) {
      for (s = 1; s >= 0.55; s -= 0.03) { var c0 = new Ctx(doc, f.base, s, job, bh); if (height(c0, body, w) + height(c0, ft, w) + c0.em(0.4) <= bh) break; }
      s = Math.max(s, 0.55);
    }
    var c = new Ctx(doc, f.base, s, job, bh), cy = y + f.pad;
    body.forEach(function (b) { cy += block(c, b, x + f.pad, cy, w, true); });
    var fy = y + ph - f.pad - height(c, ft, w);
    ft.forEach(function (b) { fy += block(c, b, x + f.pad, fy, w, true); });
    return s;
  }
  // The flow: whole pages at full size; a passage or paragraph that does not fit is split at a line
  function flow(doc, job) {
    var f = job.f, w = f.w - 2 * f.pad, bh = f.h - 2 * f.pad, c = new Ctx(doc, f.base, 1, job, bh), pages = [[]], used = 0;
    var queue = job.flow.slice();
    while (queue.length) {
      var b = queue.shift(), h = block(c, b, 0, 0, w, false);
      if (used + h > bh && pages[pages.length - 1].length) {
        var room = bh - used;
        if ((b.t === 'verse' || b.t === 'p') && room > bh * 0.15) {
          var k = b.t === 'verse' ? 'verse' : b.sm ? 'psm' : b.it ? 'pit' : 'p', iw = b.t === 'verse' ? w - c.em(0.7) : w;
          var ls = c.split(k, b.x, iw), refH = b.ref ? block(c, { t: 'p', sm: 1, x: b.ref }, 0, 0, iw, false) : 0;
          var fitN = Math.floor((room - refH - c.em(0.6)) / c.lh(k));
          if (fitN >= 2 && fitN < ls.length) {
            var a = {}, z = {}; for (var key in b) { a[key] = b[key]; z[key] = b[key]; }
            a.x = ls.slice(0, fitN).join(' '); z.x = ls.slice(fitN).join(' '); z.ref = b.ref ? b.ref + ' (continued)' : '';
            pages[pages.length - 1].push(a); pages.push([]); used = 0; queue.unshift(z); continue;
          }
        }
        pages.push([]); used = 0;
      }
      pages[pages.length - 1].push(b); used += h;
    }
    pages.forEach(function (pg, i) {
      if (i) doc.addPage([job.W, job.H], job.W > job.H ? 'l' : 'p');
      var cy = job.oy + f.pad;
      pg.forEach(function (b) { cy += block(c, b, job.ox + f.pad, cy, w, true); });
      c.font('foot'); doc.text(A((i + 1) + ' / ' + pages.length), job.ox + f.w / 2, job.oy + f.h - f.pad * 0.55, { baseline: 'top', align: 'center' });
    });
    return pages.length;
  }
  function marks(doc, job) {
    if (!job.marks || !job.marks.length) return;
    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.004);
    job.marks.forEach(function (m) { doc.line(m[0], m[1], m[2], m[3]); });
  }
  function make(jsPDF, job) {
    var doc = new jsPDF({ unit: 'in', format: [job.W, job.H], orientation: job.W > job.H ? 'l' : 'p', compress: true });
    doc.setProperties({ title: 'Parish handout', creator: 'Verbum Domini for Parishes (parishes.verbumdomini.ca)' });
    if (job.flow) { flow(doc, job); return doc; }
    var f = job.f, pw = f.w / f.panels;
    job.sides.forEach(function (panels, si) {
      if (si) doc.addPage([job.W, job.H], job.W > job.H ? 'l' : 'p');
      var scales = [];
      for (var r = 0; r < job.rows; r++) for (var cI = 0; cI < job.cols; cI++) {
        panels.forEach(function (bl, pi) {
          scales[pi] = panel(doc, job, bl || [], job.ox + cI * f.w + pi * pw, job.oy + r * f.h, pw, f.h, scales[pi]);
        });
      }
      marks(doc, job);
    });
    return doc;
  }
  root.PPPdf = { make: make, ascii: A };
})(typeof window !== 'undefined' ? window : globalThis);
