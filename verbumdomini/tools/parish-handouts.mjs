// Two bulletin-insert handouts for parishes, each on half-letter pages (5.5 x 8.5 in, two to a Letter sheet):
//   app/files/ocia-welcome-insert.pdf  Becoming Catholic: the OCIA stages, from app/pages/becoming-catholic.html (edit the text here when that page changes)
//   app/files/rosary-guide.pdf         How to Pray the Rosary: the prayers and steps from app/rosary/data/tespih.js, the mysteries from ROS in app/index.html
// Linked from the parish portal's Resources page (parishes-src/resources.html) and served as /download/<file> (DOWNLOADS in cloudflare/worker.js).
// Usage (from the repo root): node verbumdomini/tools/parish-handouts.mjs [--png DIR]
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'app');
const font = f => 'data:font/woff2;base64,' + fs.readFileSync(path.join(APP, 'fonts', f)).toString('base64');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The prayers and steps of the site's Rosary page, and the mysteries (with their Gospel passages) of the app's Today panel
const tespih = fs.readFileSync(path.join(APP, 'rosary', 'data', 'tespih.js'), 'utf8');
const R = JSON.parse(tespih.slice(tespih.indexOf('{', tespih.lastIndexOf('*/')), tespih.lastIndexOf(';')));
const shell = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
const ros = shell.match(/var ROS=(\{[\s\S]*?\});\n\s*var RDAY/);
if (!ros) throw new Error('parish-handouts: ROS not found in app/index.html');
const ROS = Function('return ' + ros[1])();
const prayer = id => { const p = R.prayers.find(x => x.id === id); if (!p) throw new Error('parish-handouts: no prayer ' + id); return p.en; };

const CSS = `
@font-face{font-family:L;src:url(${font('literata-latin.woff2')}) format("woff2");font-weight:200 900}
@font-face{font-family:L;font-style:italic;src:url(${font('literata-italic-latin.woff2')}) format("woff2");font-weight:200 900}
@page{size:5.5in 8.5in;margin:0.42in 0.46in 0.4in}
*{box-sizing:border-box}html,body{margin:0}
body{font:9.6pt/1.45 L,Georgia,serif;color:#1d1b18}
.pg{height:7.68in;display:flex;flex-direction:column;break-after:page;overflow:hidden}.pg:last-child{break-after:auto}
header{text-align:center;padding-bottom:7pt;margin-bottom:9pt;border-bottom:.6pt solid #b9a27a}
header p{margin:0;font-size:6.6pt;letter-spacing:.2em;text-transform:uppercase;color:#8a6a2f}
header h1{margin:3pt 0 0;font-size:19pt;line-height:1.1;font-weight:500}
header .s{margin-top:3pt;font-size:8.6pt;letter-spacing:0;text-transform:none;color:#5c574f}
h2{margin:0 0 3pt;font-size:11pt;line-height:1.25;font-weight:650}
h2 span{color:#8a6a2f;margin-right:4pt}
h3{margin:7pt 0 1pt;font-size:9.4pt;font-weight:650}
p{margin:0 0 5pt}
.lead{font-size:10pt}
ol.st{list-style:none;margin:0;padding:0}
ol.st li{margin:0 0 7.5pt;break-inside:avoid}
ol.st li>p{margin:0 0 0 13pt}
.n{font-size:8.2pt;color:#5c574f}
.box{margin-top:6pt;padding:7pt 9pt;border:.6pt solid #c9b48d;border-radius:4pt}
.fill{display:grid;grid-template-columns:auto 1fr;gap:9pt 6pt;align-items:end;margin-top:6pt;font-size:9pt}
.fill i{display:block;border-bottom:.6pt solid #8f877b;height:11pt}
table{width:100%;border-collapse:collapse;font-size:8.6pt;margin:2pt 0 6pt}
th,td{text-align:left;vertical-align:top;padding:3pt 4pt;border-bottom:.5pt solid #ddd3c2}
th{font-size:7pt;letter-spacing:.12em;text-transform:uppercase;color:#8a6a2f;font-weight:600}
.pr{break-inside:avoid;margin:0 0 7pt}
.pr p{white-space:pre-line;margin:0;font-size:9.1pt;line-height:1.38}
.myst{display:grid;grid-template-columns:1fr 1fr;gap:6pt 12pt}
.myst div{break-inside:avoid}
.myst ol{margin:1pt 0 0;padding-left:13pt;font-size:8.6pt}
.myst li{margin:0 0 1pt}
.myst small{color:#6b645b;font-size:7.4pt}
footer{margin-top:auto;padding-top:5pt;border-top:.6pt solid #b9a27a;text-align:center;font-size:6.8pt;color:#6b645b}
`;
const doc = (title, body) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${CSS}</style></head><body>${body}</body></html>`;

// Becoming Catholic: the four periods of the OCIA, then the already-baptized path and a box for the parish's own details
const OCIA_STEPS = [
  ['Inquiry', 'You come to meetings, ask questions and get to know the faith, without promising anything. Bring every question, including the hard ones, and start coming to Sunday Mass.'],
  ['The Catechumenate', 'It begins at a Sunday Mass with the Rite of Acceptance: you say in front of the parish that you want to become a Christian, and the priest traces the cross on your forehead. Then comes the longest stage, learning what the Church believes, how Catholics pray and how they live, with a sponsor at your side.'],
  ['Purification and Enlightenment', 'The weeks of Lent. On the first Sunday the bishop chooses you for baptism at the Rite of Election, usually at the cathedral. On the third, fourth and fifth Sundays the parish prays over you in the Scrutinies, and you receive the Creed and the Lord’s Prayer.'],
  ['The Sacraments of Initiation', 'At the Easter Vigil you are baptized, confirmed and receive your first Communion, all in one night. The fifty days to Pentecost that follow (Mystagogy) help you settle into parish life.']];
const ocia = doc('Becoming Catholic', `
<section class="pg"><header><p>Verbum Domini · For Parishes</p><h1>Becoming Catholic</h1><p class="s">The Order of Christian Initiation of Adults (OCIA)</p></header>
<p class="lead">Adults become Catholic through their local parish. Most prepare from autumn to Easter in a group called OCIA (it used to be called RCIA). The Church sets no fixed length: if you need more time, you take more time.</p>
<ol class="st">${OCIA_STEPS.map((s, i) => `<li><h2><span>${i + 1}</span>${s[0]}</h2><p>${s[1]}</p></li>`).join('')}</ol>
<footer>Full guide: verbumdomini.ca/becoming-catholic.html</footer></section>
<section class="pg">
<h2>Already baptized in another church?</h2>
<p>If you were baptized with water in the name of the Father, and of the Son, and of the Holy Spirit, you are already a Christian and are not baptized again. You talk with the priest, prepare in a way that fits what you already know, make your first confession, and are received into full communion, often at an ordinary Sunday Mass, with Confirmation and first Communion.</p>
<h3>Do I have to believe everything already?</h3><p>No. The preparation exists for your questions and doubts. By the day you are received you should be able to say honestly that you believe what the Church teaches.</p>
<h3>Can I come to Mass before then?</h3><p>Yes, and you should. Until you are received you do not go up for Communion; in many parishes you can go up with your arms crossed for a blessing.</p>
<h3>Does it cost anything?</h3><p>The sacraments are free. Some parishes ask a small amount for books, and nobody is turned away for lack of money.</p>
<h3>Married outside the Church?</h3><p>Tell the priest at your first meeting. Your marriage may need attention before you are received, and he will explain the steps.</p>
<div class="box"><h2>Start here</h2><p class="n">Groups usually begin in September or October. Contact the parish office in spring or summer so the priest can meet you first.</p>
<div class="fill"><span>Contact</span><i></i><span>Phone or email</span><i></i><span>Next group begins</span><i></i></div></div>
<footer>verbumdomini.ca · free to copy for parish use</footer></section>`);

// The Rosary: how to pray it and the mysteries by day, then the prayers
const order = ['J', 'S', 'G', 'L'];
const rosary = doc('How to Pray the Rosary', `
<section class="pg"><header><p>Verbum Domini · For Parishes</p><h1>How to Pray the Rosary</h1><p class="s">${esc(R.about.en.split('. ').slice(0, 2).join('. '))}.</p></header>
<ol class="st">${R.steps.map((s, i) => `<li><h2 style="font-size:9.8pt;font-weight:500"><span>${i + 1}</span>${esc(s.en)}</h2></li>`).join('')}</ol>
<footer>verbumdomini.ca/rosary.html</footer></section>
<section class="pg"><header><p>Which mysteries to pray</p><h1 style="font-size:15pt">The Mysteries by Day</h1></header>
<table><tr><th>Day</th><th>Mysteries</th></tr>${[['Sunday', 'G'], ['Monday', 'J'], ['Tuesday', 'S'], ['Wednesday', 'G'], ['Thursday', 'L'], ['Friday', 'S'], ['Saturday', 'J']].map(d => `<tr><td>${d[0]}</td><td>${ROS[d[1]].n}</td></tr>`).join('')}</table>
<div class="myst">${order.map(k => `<div><h3>The ${ROS[k].n} Mysteries</h3><ol>${ROS[k].m.map(m => `<li>${esc(m[0])} <small>${esc(m[1])}</small></li>`).join('')}</ol></div>`).join('')}</div>
<footer>Paintings and the Rosary prayed bead by bead: verbumdomini.ca/rosary.html</footer></section>
<section class="pg"><header><p>The prayers</p><h1 style="font-size:15pt">Prayers of the Rosary</h1></header>
${['hac-isareti', 'iman-aciklamasi', 'goklerdeki-pederimiz', 'selam-sana-meryem'].map(id => `<div class="pr"><h2>${esc(prayer(id).title)}</h2><p>${esc(prayer(id).text)}</p></div>`).join('')}
<footer>verbumdomini.ca · free to copy for parish use</footer></section>
<section class="pg">
${['pedere-san', 'fatima-duasi', 'selam-sana-kralice', 'bitiris-duasi'].map(id => `<div class="pr"><h2>${esc(prayer(id).title)}</h2><p>${esc(prayer(id).text)}</p></div>`).join('')}
<footer>verbumdomini.ca/rosary.html</footer></section>`);

const b = await chromium.launch();
const p = await b.newPage();
const png = process.argv.includes('--png') ? process.argv[process.argv.indexOf('--png') + 1] : '';
for (const [name, html] of [['ocia-welcome-insert', ocia], ['rosary-guide', rosary]]) {
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  // Every page must fit its half-letter box: a section that overflows would be cut off
  const over = await p.evaluate(() => [...document.querySelectorAll('.pg')].map((s, i) => s.scrollHeight > s.clientHeight + 1 ? i + 1 : 0).filter(Boolean));
  if (over.length) throw new Error(`parish-handouts: ${name}: page ${over.join(', ')} overflows`);
  const out = path.join(APP, 'files', name + '.pdf');
  await p.pdf({ path: out, width: '5.5in', height: '8.5in', preferCSSPageSize: true, printBackground: true });
  if (png) { await p.setViewportSize({ width: 528, height: 816 }); await p.screenshot({ path: path.join(png, name + '.png'), fullPage: true }); }
  console.log('parish-handouts: ' + path.relative(process.cwd(), out));
}
await b.close();
