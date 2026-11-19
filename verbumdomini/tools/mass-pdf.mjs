// The Order of the Mass PDF (app/files/order-of-the-mass.pdf), from the text of app/pages/mass.html.
//   node verbumdomini/tools/mass-pdf.mjs [out.pdf] [font-size-px]
// Letter pages, laid out by hand rather than by the browser's page breaks: the text is cut into blocks that never split
// (a line with its label, an instruction with the line it introduces, a Priest's line with the answer,
// a part's heading with its first lines),
// the blocks are packed into pages, and each page's leftover height is shared out between its blocks,
// so every page runs to the same bottom edge with no gap. The font size is chosen so the last page ends full too.
import { createRequire } from 'module';
import { pathToFileURL, fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.join(here, '..', 'app');
const out = process.argv[2] || path.join(app, 'files', 'order-of-the-mass.pdf');
const FS = parseFloat(process.argv[3] || '13.1');
const font = f => pathToFileURL(path.join(app, 'fonts', f)).href;
const mass = fs.readFileSync(path.join(app, 'pages', 'mass.html'), 'utf8');

// One line under each part's heading (the page itself has a painting there instead)
const LEAD = [
  'The Priest goes up to the altar and kisses it.',
  'God speaks to us in the readings, the Gospel and the homily. Then we profess our faith together.',
  'Bread and wine are brought to the altar, and the Priest offers them to God for all of us.',
  'The heart of the Mass. The Priest gives thanks to God for all of us, and by the power of the Holy Spirit the bread and wine become the Body and Blood of Christ. Everyone is standing.',
  'We pray the Our Father, offer each other the sign of peace, and receive the Body and Blood of Christ in Holy Communion.',
  'The Priest blesses the people and sends them out to live the Gospel.'];

const CSS = `
@font-face{font-family:Lit;src:url(${font('literata-latin.woff2')}) format('woff2');font-weight:200 900}
@font-face{font-family:Lit;font-style:italic;src:url(${font('literata-italic-latin.woff2')}) format('woff2');font-weight:200 900}
@font-face{font-family:Lex;src:url(${font('lexend-latin.woff2')}) format('woff2');font-weight:100 900}
@page{size:letter;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font:400 ${FS}px/1.42 Lit,serif;color:#2b2118;background:#fff}
.pg{position:relative;width:8.5in;height:11in;padding:.62in .72in 0;overflow:hidden;break-after:page}
.pg:last-child{break-after:auto}
.col{height:var(--h);display:flex;flex-direction:column}
.ft{position:absolute;left:.72in;right:.72in;bottom:.42in;display:flex;justify-content:space-between;font:400 8px/1 Lex,sans-serif;letter-spacing:.04em;color:#8a7a66;border-top:.5px solid #dccfb0;padding-top:7px}
.top{text-align:center;padding-bottom:.9em;border-bottom:1.2px solid #2b2118;margin-bottom:.2em}
.top h1{font:500 2.35em/1.1 Lit,serif;font-variant:small-caps;letter-spacing:.06em}
.top p{font-style:italic;color:#6b5b47;font-size:.9em;margin-top:.25em}
.key{font:400 7.5px/1 Lex,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#6b5b47;margin-top:.9em;display:flex;justify-content:center;gap:2.2em}
.key b{font-weight:700;color:#2b2118}
.key i{text-transform:none;letter-spacing:.02em;font:italic 400 9px/1 Lit,serif}
.part .k{font:600 7.5px/1 Lex,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#a01f1a}
.part h2{font:500 1.6em/1.15 Lit,serif;font-variant:small-caps;letter-spacing:.04em;margin-top:.22em}
.part .ld{font-style:italic;color:#6b5b47;font-size:.92em;line-height:1.35;margin-top:.15em;padding-bottom:.45em;border-bottom:.6px solid #c9a75a;margin-bottom:.35em}
.ln{display:grid;grid-template-columns:.95in 1fr}
.ln .r{font:600 7px/1.25 Lex,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a01f1a;padding-top:.36em;padding-right:1.4em}
.ln.c .t,.ln.pc .t{font-weight:640}
.ln.c .r,.ln.pc .r{color:#2b2118}
.nt{margin-left:.95in;font-style:italic;color:#6b5b47;font-size:.88em;line-height:1.38}
.b>*+*{margin-top:.28em}
.gap{flex:1 1 0}
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>The Order of the Mass</title><style>${CSS}</style></head>
<body><div id="src" style="width:7.06in">${mass}</div><div id="out"></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
// from a file, so the page may load the site's fonts from app/fonts
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mass-pdf-')), 'mass.html');
fs.writeFileSync(tmp, html);
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
await page.evaluate(() => Promise.all(['400 13px Lit', '640 13px Lit', 'italic 400 13px Lit', '600 8px Lex'].map(f => document.fonts.load(f))));
const pages = await page.evaluate(({ LEAD }) => {
  const src = document.getElementById('src'), out = document.getElementById('out');
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e };
  const line = p => { const r = p.querySelector('.mass-role'), d = el('div', 'ln ' + (p.classList.contains('mass-c') ? 'c' : p.classList.contains('mass-pc') ? 'pc' : 'p'));
    d.append(el('div', 'r', r.textContent)); r.remove(); d.append(el('div', 't', p.innerHTML.trim())); return d };
  const note = h => el('div', 'nt', h);
  // the blocks, in order; a block is an array of elements kept together on one page
  const blocks = [];
  const top = el('div', 'top', '<h1>The Order of the Mass</h1><p>The words of the Priest and the people, with when to sit, stand and kneel</p>' +
    '<div class="key"><span>Priest</span><span><b>People (in bold)</b></span><i>Instructions in italics</i></div>');
  blocks.push([top]);
  src.querySelectorAll('.mass-sec').forEach((sec, i) => {
    const items = [];
    sec.querySelector('.mass-dialogue').childNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.classList.contains('mass-note')) items.push(note(n.querySelector('em') ? n.querySelector('em').innerHTML : n.innerHTML));
      else if (n.classList.contains('mass-line')) items.push(line(n));
      else if (n.classList.contains('mass-creed')) {
        const ap = n.querySelector('[data-crp=ap] .mass-line'), ni = n.querySelector('[data-crp=ni] .mass-line'), nn = n.querySelector('[data-crp=ni] .mass-note');
        items.push(note('The Apostles’ Creed:'), line(ap));
        items.push(note('Or the Nicene Creed' + (nn ? ' (' + nn.textContent.replace(/^\s*|[.:]\s*$/g, '').replace(/^./, c => c.toLowerCase()) + ')' : '') + ':'), line(ni));
        n.querySelectorAll('[data-crp=ni] .mass-note').forEach((x, j) => { if (j) items.push(note(x.innerHTML)) });
      }
    });
    // instructions stay with the line after them; a part's heading takes its first two lines along
    let cur = [];
    const head = el('div', 'part', '<div class="k">Part ' + (i + 1) + '</div><h2>' + sec.querySelector('.ill-h').textContent + '</h2><div class="ld">' + LEAD[i] + '</div>');
    cur.push(head);
    let lines = 0;
    // and a Priest's line stays with the people's answer to it
    items.forEach((it, j) => {
      cur.push(it);
      if (!it.classList.contains('ln')) return;
      lines++;
      const nx = items.slice(j + 1).find(x => x.classList.contains('ln'));
      if (it.classList.contains('p') && nx && nx.classList.contains('c')) return;
      if (cur[0] !== head || lines >= 2) { blocks.push(cur); cur = [] }
    });
    if (cur.length) { if (cur.every(x => x.classList.contains('nt')) && blocks.length) blocks[blocks.length - 1].push(...cur); else blocks.push(cur) }
  });
  // measure each block at the page's width
  const W = getComputedStyle(document.documentElement).fontSize;
  const meas = el('div', 'pg'); meas.style.height = 'auto'; out.append(meas);
  const col = el('div', 'colm'); meas.append(col);
  const H = blocks.map(b => { const d = el('div', 'b'); b.forEach(x => d.append(x)); col.append(d); const h = d.getBoundingClientRect().height; return [d, h] });
  meas.remove();
  // page body height: 11in minus top padding and the footer area
  const avail = 11 * 96 - .62 * 96 - .78 * 96;
  const minGap = 9; // px between blocks before any spreading
  // fewest pages first (greedy), then the split into that many pages that leaves the most even slack (least sum of squares)
  const N = H.length, span = (a, b) => { let u = 0; for (let j = a; j < b; j++) u += H[j][1] + (j > a ? minGap : 0); return u };
  let k = 1; for (let j = 0, u = 0; j < N; j++) { const need = (u ? minGap : 0) + H[j][1]; if (u && u + need > avail) { k++; u = H[j][1] } else u += need }
  const best = [[0]], from = [[]];
  for (let p = 1; p <= k; p++) { best[p] = []; from[p] = [];
    for (let b = 1; b <= N; b++) { best[p][b] = Infinity;
      for (let a = b - 1; a >= 0; a--) { const u = span(a, b); if (u > avail) break; const prev = best[p - 1][a];
        if (prev === undefined || prev === Infinity) continue; const c = prev + (avail - u) ** 2; if (c < best[p][b]) { best[p][b] = c; from[p][b] = a } } } }
  const pgs = []; for (let p = k, b = N; p > 0; p--) { const a = from[p][b]; pgs.unshift(H.slice(a, b).map(x => x[0])); b = a }
  const n = pgs.length, fills = [];
  const usedOf = ds => ds.reduce((a, d, j) => a + H.find(x => x[0] === d)[1] + (j ? minGap : 0), 0);
  // the last page spreads too when it is close to full; otherwise its blocks sit at the top
  const lastFull = usedOf(pgs[n - 1]) > avail * .86;
  pgs.forEach((ds, i) => {
    const p = el('div', 'pg'), c = el('div', 'col'); c.style.setProperty('--h', avail + 'px'); p.append(c);
    const last = i === n - 1 && !lastFull;
    ds.forEach((d, j) => { if (j) { const g = el('div', 'gap'); g.style.minHeight = minGap + 'px'; if (last) g.style.flex = '0 0 ' + minGap + 'px'; c.append(g) } c.append(d) });
    p.append(el('div', 'ft', '<span>The Order of the Mass · verbumdomini.ca</span><span>Page ' + (i + 1) + ' of ' + n + '</span>'));
    out.append(p);
    fills.push(Math.round(usedOf(ds) / avail * 100));
  });
  src.remove();
  return fills;
}, { LEAD });
await page.pdf({ path: out, width: '8.5in', height: '11in', printBackground: true, preferCSSPageSize: true });
await browser.close();
fs.rmSync(path.dirname(tmp), { recursive: true });
console.log('mass-pdf: ' + pages.length + ' pages, each page full before spreading: ' + pages.join('% ') + '%; font ' + FS + 'px');
