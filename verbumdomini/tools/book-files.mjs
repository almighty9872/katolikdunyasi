// Chromium step of tools/book-files.py (run by it, not by hand).
//   node book-files.mjs cover <app> <slug> <book.json> <out.jpg>            the cover picture (1600 x 2400) for the EPUB, the PDF and the site
//   (the pdf step reads it from book.json's "cover")
//   node book-files.mjs pdf <app> <slug> <book.json> <pages.json> <out.pdf> the PDF, 6 x 9 in, from <slug>-print.html;
//        pages.json: {"1": 5, ...} the page where each part begins, written into the contents ({} on the first pass)
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [mode, app, slug, bookJson, a5, a6] = process.argv.slice(2);
const B = JSON.parse(bookJson);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fontUrl = f => pathToFileURL(path.join(app, f)).href;

// The cover: navy leather, gently used (grain, patina, rubbed edges and corners), a blind-tooled joint by the spine,
// a gold-tooled double frame with corner ornaments, the painting set in a recessed medallion, gold-stamped lettering.
// Drawn at 800 x 1200 CSS px. The site's address, not "Verbum Domini", marks the book, so it is not mistaken for Scripture.
const noise = (f, o, seed, extra = '') => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1200'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='${f}' numOctaves='${o}' seed='${seed}'/>${extra}</filter><rect width='100%' height='100%' filter='url(%23f)'/></svg>`).replace(/%2523/g, '%23')}")`;
// a mask that is mostly solid with small flaked spots, for worn gold
const FLAKE = noise('0.9', 2, 7, "<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -12 9.4'/>");
const COVER_CSS = `
.cv{position:relative;width:800px;height:1200px;overflow:hidden;background:#17233f;color:#d8b46a;text-align:center;font-family:"Source Serif 4",serif}
.cv>svg{position:absolute;inset:0;width:100%;height:100%}
.cv .g{background:linear-gradient(172deg,#f3dc9d 0,#d9b467 38%,#b48a40 62%,#e2c27c 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  -webkit-mask-image:${FLAKE};mask-image:${FLAKE};filter:drop-shadow(0 -1px 0 rgb(0 0 0/.75)) drop-shadow(0 1.5px .5px rgb(255 255 255/.10))}
.cv .au{position:absolute;top:150px;left:0;right:0;font:600 25px/1 Inter,sans-serif;letter-spacing:.36em;padding-left:.36em;text-transform:uppercase}
.cv .md{position:absolute;top:222px;left:50%;width:356px;height:356px;margin-left:-158px;border-radius:50%;
  box-shadow:inset 0 9px 18px rgb(0 0 0/.75),inset 0 -2px 3px rgb(255 255 255/.06),0 1px 0 rgb(255 255 255/.07)}
.cv .md img{position:absolute;inset:16px;width:324px;height:324px;border-radius:50%;object-fit:cover;object-position:${B.pos};filter:sepia(.18) saturate(.9) contrast(1.04) brightness(.93)}
.cv .md:after{content:"";position:absolute;inset:16px;border-radius:50%;
  background:radial-gradient(70% 55% at 32% 26%,rgb(255 248 230/.16),transparent 60%),radial-gradient(closest-side,transparent 78%,rgb(10 14 28/.55));
  box-shadow:inset 0 6px 14px rgb(0 0 0/.55)}
.cv .ti{position:absolute;top:648px;left:40px;right:0;font:600 72px/1 "Source Serif 4",serif;letter-spacing:-.01em}
.cv .of{position:absolute;top:738px;left:40px;right:0;font:italic 400 44px/1.1 "Source Serif 4",serif}
.cv .tr{position:absolute;top:880px;left:40px;right:0;font:italic 400 27px/1.45 "Source Serif 4",serif}
.cv .mk{position:absolute;bottom:118px;left:40px;right:0;font:500 22px/1 Inter,sans-serif;letter-spacing:.08em}`;
const coverHtml = `<div class="cv"><svg viewBox="0 0 800 1200" aria-hidden="true">
<defs>
<radialGradient id="base" cx="56%" cy="40%" r="80%"><stop offset="0" stop-color="#1e2d52"/><stop offset=".55" stop-color="#15213d"/><stop offset="1" stop-color="#0a1024"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d898"/><stop offset=".45" stop-color="#c9a257"/><stop offset=".7" stop-color="#a87f3b"/><stop offset="1" stop-color="#e0c07a"/></linearGradient>
<linearGradient id="light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
<radialGradient id="vig" cx="55%" cy="45%" r="75%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
<filter id="pebble" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="4" seed="11"/>
  <feDiffuseLighting surfaceScale="2.4" lighting-color="#fff"><feDistantLight azimuth="235" elevation="57"/></feDiffuseLighting><feColorMatrix values="1 0 0 0 -.32  0 1 0 0 -.32  0 0 1 0 -.32  0 0 0 1 0"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/>
  <feColorMatrix type="saturate" values="0"/></filter>
<filter id="patina" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".0045 .006" numOctaves="3" seed="21"/>
  <feColorMatrix values="0 0 0 0 .55  0 0 0 0 .6  0 0 0 0 .72  0 0 0 2.6 -1.25"/></filter>
<filter id="rub" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="16"/><feComponentTransfer result="band"><feFuncA type="linear" slope="1.6"/></feComponentTransfer>
  <feTurbulence type="fractalNoise" baseFrequency=".055 .09" numOctaves="4" seed="5"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3.6 -1.6" result="spots"/>
  <feComposite in="band" in2="spots" operator="in"/></filter>
<filter id="tool" x="-5%" y="-5%" width="110%" height="110%"><feOffset in="SourceAlpha" dy="-1.4" result="up"/><feFlood flood-color="#000" flood-opacity=".7"/><feComposite in2="up" operator="in" result="dark"/>
  <feOffset in="SourceAlpha" dy="1.4" result="dn"/><feFlood flood-color="#fff" flood-opacity=".12"/><feComposite in2="dn" operator="in" result="lite"/>
  <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -12 9.2" result="fl"/>
  <feComposite in="SourceGraphic" in2="fl" operator="in" result="worn"/><feMerge><feMergeNode in="dark"/><feMergeNode in="lite"/><feMergeNode in="worn"/></feMerge></filter>
<filter id="blind"><feOffset in="SourceAlpha" dy="1.5" result="o"/><feFlood flood-color="#fff" flood-opacity=".09"/><feComposite in2="o" operator="in" result="h"/>
  <feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<g id="orn"><path d="M0 0l18 18M0 0c10 2 16 8 18 18M0 0c2 10 8 16 18 18" fill="none"/><circle cx="26" cy="26" r="4.5"/><circle cx="40" cy="12" r="2.4"/><circle cx="12" cy="40" r="2.4"/>
  <path d="M30 30c6 0 10 4 12 10c-6-2-10-6-12-10zM30 30c0 6 4 10 10 12c-2-6-6-10-10-12z"/></g>
</defs>
<rect width="800" height="1200" fill="url(#base)"/>
<rect width="800" height="1200" filter="url(#patina)" opacity=".28" style="mix-blend-mode:soft-light"/>
<rect width="800" height="1200" filter="url(#pebble)" opacity=".5" style="mix-blend-mode:soft-light"/>
<rect width="800" height="1200" filter="url(#grain)" opacity=".14" style="mix-blend-mode:overlay"/>
<g filter="url(#rub)" opacity=".26"><rect x="4" y="4" width="792" height="1192" fill="none" stroke="#a9b4c9" stroke-width="14"/>
  <circle cx="800" cy="0" r="36" fill="#a9b4c9"/><circle cx="800" cy="1200" r="40" fill="#a9b4c9"/><circle cx="0" cy="1200" r="26" fill="#a9b4c9"/><circle cx="0" cy="0" r="22" fill="#a9b4c9"/>
  <path d="M560 1040c40-6 90-2 130 12" stroke="#a9b4c9" stroke-width="7" fill="none"/><path d="M150 330c30 12 52 30 64 52" stroke="#a9b4c9" stroke-width="5" fill="none"/></g>
<g filter="url(#blind)"><rect x="40" y="0" width="7" height="1200" fill="#060b1a" opacity=".55"/><rect x="47" y="0" width="3" height="1200" fill="#fff" opacity=".05"/>
  <rect x="0" y="0" width="40" height="1200" fill="#000" opacity=".16"/></g>
<g filter="url(#tool)" stroke="url(#gold)" fill="url(#gold)">
  <rect x="86" y="58" width="656" height="1084" fill="none" stroke-width="3.2"/><rect x="100" y="72" width="628" height="1056" fill="none" stroke-width="1.2"/>
  <use href="#orn" x="110" y="82" fill-opacity="1" stroke-width="1.6"/><use href="#orn" transform="translate(718 82) scale(-1 1)" stroke-width="1.6"/>
  <use href="#orn" transform="translate(110 1118) scale(1 -1)" stroke-width="1.6"/><use href="#orn" transform="translate(718 1118) scale(-1 -1)" stroke-width="1.6"/>
  <circle cx="420" cy="400" r="190" fill="none" stroke-width="2.6"/><circle cx="420" cy="400" r="199" fill="none" stroke-width="1"/>
  <path d="M370 846h100M420 838l7 8-7 8-7-8z" stroke-width="1.4"/><circle cx="356" cy="846" r="2.6"/><circle cx="484" cy="846" r="2.6"/>
</g>
<rect width="800" height="1200" fill="url(#light)"/><rect width="800" height="1200" fill="url(#vig)"/>
</svg>
<span class="au g">${esc(B.author.replace(/ of .*/, '').replace(/^Augustine$/, 'St. Augustine'))}</span>
<div class="md"><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(app, B.art)).toString('base64')}" alt=""></div>
<span class="ti g">${esc(B.short)}</span><span class="of g">${esc(B.of)}</span>
<span class="tr g">${esc(B.credit)}<br>${esc(B.edition)}</span><span class="mk g">verbumdomini.ca</span></div>`;
const FACES = `@font-face{font-family:"Source Serif 4";font-style:normal;font-weight:200 900;src:url(${fontUrl('blob/4bfe23b7c2ace499db19046d6b4eebae.woff2')})}
@font-face{font-family:"Source Serif 4";font-style:italic;font-weight:200 900;src:url(${fontUrl('blob/2c52a3fbeb2a626d9f45d2c964ff3c8f.woff2')})}
@font-face{font-family:Inter;font-weight:100 900;src:url(${fontUrl('blob/c52f40b52b7f8a012dcf46c83f2d2b2c.woff2')})}`;

const browser = await chromium.launch();
const page = await browser.newPage(mode === 'cover' ? { deviceScaleFactor: 2 } : {});
if (mode === 'cover') {
  await page.setViewportSize({ width: 800, height: 1200 });
  await page.setContent(`<!DOCTYPE html><html><head><style>${FACES}html,body{margin:0}${COVER_CSS}</style></head><body>${coverHtml}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
  await page.screenshot({ path: a5, type: 'jpeg', quality: 88, scale: 'device' });
  // deviceScaleFactor 2 below gives 1600 x 2400
} else {
  const pages = JSON.parse(a5);
  await page.goto(pathToFileURL(path.join(app, `${slug}-print.html`)).href);
  await page.addStyleTag({ content: `
@media print{
  @page{size:6in 9in;margin:.72in .68in .8in}
  @page cover{margin:0;@bottom-center{content:none}}
  body{font-size:10.6pt;line-height:1.52}
  .cover-pg{display:block;page:cover;width:6in;height:9in;break-after:page}
  .cover-pg img{display:block;width:6in;height:9in}
  .title-pg{padding-top:1.2in}
  .part-h{padding-top:.9in}
}` });
  await page.evaluate(([html, pages]) => {
    document.querySelector('.cover-pg').innerHTML = '<img alt="" src="' + html + '">'; document.title = document.title.replace(/:.*/, '');
    for (const [k, v] of Object.entries(pages)) document.querySelector(`.pg[data-p="${k}"]`).textContent = v;
  }, ['data:image/jpeg;base64,' + fs.readFileSync(B.cover).toString('base64'), pages]);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
  await page.pdf({ path: a6, preferCSSPageSize: true, printBackground: true, outline: true, tagged: true });
}
await browser.close();
