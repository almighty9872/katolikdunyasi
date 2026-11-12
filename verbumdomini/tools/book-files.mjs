// Chromium step of tools/book-files.py (run by it, not by hand).
//   node book-files.mjs cover <app> <slug> <book.json> <out.jpg>            the cover picture (1600 x 2400) for the EPUB
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

// The cover: deep red cloth, a gold frame, the painting in a round medallion (as on the Free e-Books page)
const COVER_CSS = `
.cv{position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
  background:radial-gradient(120% 80% at 50% 30%,#7a252c 0,#5b1a1f 55%,#3f1115 100%);color:#e9cf93;text-align:center;overflow:hidden}
.cv:before{content:"";position:absolute;inset:4.2%;border:1.5px solid rgb(233 207 147/.6);border-radius:1.2%}
.cv:after{content:"";position:absolute;inset:5.4%;border:.6px solid rgb(233 207 147/.35)}
.cv .au{margin-top:17%;font:600 3.4cqw/1 Inter,sans-serif;letter-spacing:.32em;text-transform:uppercase}
.cv img{width:46%;aspect-ratio:1;margin-top:8%;border-radius:50%;border:.7cqw solid #e9cf93;object-fit:cover;object-position:${B.pos};box-shadow:0 2cqw 6cqw rgb(0 0 0/.35)}
.cv .ti{margin-top:9%;font:600 10.5cqw/1.02 "Source Serif 4",serif;letter-spacing:-.015em;color:#f6e6bd}
.cv .of{margin-top:2.2%;font:italic 400 5.4cqw/1.1 "Source Serif 4",serif;color:#f6e6bd}
.cv .rl{width:12%;height:1px;margin:6% 0 5%;background:#e9cf93;opacity:.75}
.cv .tr{font:italic 400 3.5cqw/1.4 "Source Serif 4",serif;opacity:.95}
.cv .mk{position:absolute;bottom:9.5%;left:0;right:0;font:600 2.5cqw/1 Inter,sans-serif;letter-spacing:.4em;text-transform:uppercase;opacity:.8}`;
const coverHtml = `<div class="cv"><span class="au">${esc(B.author.replace(/ of .*/, '').replace(/^Augustine$/, 'St. Augustine'))}</span>
<img src="data:image/jpeg;base64,${fs.readFileSync(path.join(app, B.art)).toString('base64')}" alt=""><span class="ti">${esc(B.short)}</span><span class="of">${esc(B.of)}</span>
<span class="rl"></span><span class="tr">${esc(B.credit)}<br>${esc(B.edition)}</span><span class="mk">Verbum Domini</span></div>`;
const FACES = `@font-face{font-family:"Source Serif 4";font-style:normal;font-weight:200 900;src:url(${fontUrl('blob/4bfe23b7c2ace499db19046d6b4eebae.woff2')})}
@font-face{font-family:"Source Serif 4";font-style:italic;font-weight:200 900;src:url(${fontUrl('blob/2c52a3fbeb2a626d9f45d2c964ff3c8f.woff2')})}
@font-face{font-family:Inter;font-weight:100 900;src:url(${fontUrl('blob/c52f40b52b7f8a012dcf46c83f2d2b2c.woff2')})}`;

const browser = await chromium.launch();
const page = await browser.newPage(mode === 'cover' ? { deviceScaleFactor: 2 } : {});
if (mode === 'cover') {
  await page.setViewportSize({ width: 800, height: 1200 });
  await page.setContent(`<!DOCTYPE html><html><head><style>${FACES}html,body{margin:0;height:100%}body{container-type:size}${COVER_CSS}</style></head><body>${coverHtml}</body></html>`);
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
  .cover-pg{display:block;page:cover;width:6in;height:9in;container-type:size;break-after:page}
  .title-pg{padding-top:1.2in}
  .part-h{padding-top:.9in}
}
${COVER_CSS}` });
  await page.evaluate(([html, pages]) => {
    document.querySelector('.cover-pg').innerHTML = html; document.title = document.title.replace(/:.*/, '');
    for (const [k, v] of Object.entries(pages)) document.querySelector(`.pg[data-p="${k}"]`).textContent = v;
  }, [coverHtml, pages]);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
  await page.pdf({ path: a6, preferCSSPageSize: true, printBackground: true, outline: true, tagged: true });
}
await browser.close();
