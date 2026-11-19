// The confession card: the flow of confession on two pages the size of a Sunday missal (4.25 x 6.5 in),
// to print, fold into a missal or keep on a phone. Written to app/files/confession-card.pdf, linked from the
// Confession page (app/pages/confession.html) and /download/confession-card.pdf (DOWNLOADS in cloudflare/worker.js).
// Usage (from the repo root): node verbumdomini/tools/confession-card.mjs. Edit the text here when the page's steps change.
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'app');
const font = f => 'data:font/woff2;base64,' + fs.readFileSync(path.join(APP, 'fonts', f)).toString('base64');  // inline: a page set from a string cannot load file: fonts

// [title, what you do, words said (optional), small note (optional)]
const STEPS = [
  ['Examine your conscience', 'Before you go, sit quietly and ask the Holy Spirit to help you see your life honestly. Think back over what you have done and failed to do since your last confession. You can write your sins down.'],
  ['Go in', 'Kneel behind the screen or sit facing the priest; either is fine. He may greet you or read a short passage from Scripture.'],
  ['Begin', 'Make the Sign of the Cross and say how long it has been. A guess is fine. If it is your first time, say so.',
    '“Bless me, Father, for I have sinned. It has been three months since my last confession.”'],
  ['Say your sins', 'Simply and plainly. For serious sins, say what they were and roughly how many times. When you have finished, say so.',
    '“For these and all the sins of my past life, I am sorry.”'],
  ['Listen to the priest', 'He may give advice, then a penance, usually a prayer or a good deed. If you did not hear it, ask him to repeat it.'],
  ['The Act of Contrition', 'Use your own words, a short prayer, or the traditional one.',
    '“O my God, I am heartily sorry for having offended thee, and I detest all my sins because of thy just punishments, but most of all because they offend thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of thy grace, to sin no more, and to avoid the near occasions of sin. Amen.”',
    'Short version: “Lord Jesus, Son of God, have mercy on me, a sinner.”'],
  ['Absolution: you are forgiven', 'The priest extends his hand over you and says the words of absolution.',
    '“God, the Father of mercies, through the death and resurrection of his Son has reconciled the world to himself and sent the Holy Spirit among us for the forgiveness of sins; through the ministry of the Church may God give you pardon and peace, and I absolve you from your sins in the name of the Father, and of the Son, and of the Holy Spirit.”',
    'You say: “Amen.” Make the Sign of the Cross.'],
  ['Go in peace', 'The priest may say “Give thanks to the Lord, for he is good,” and you answer “His mercy endures for ever.” Do your penance as soon as you can, and thank God for His mercy.']
];
const step = (s, i) => `<li><h2><span>${i + 1}</span>${s[0]}</h2><p>${s[1]}</p>${s[2] ? `<blockquote>${s[2]}</blockquote>` : ''}${s[3] ? `<p class="n">${s[3]}</p>` : ''}</li>`;
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Confession Card</title><style>
@font-face{font-family:L;src:url(${font('literata-latin.woff2')}) format("woff2");font-weight:200 900}
@font-face{font-family:L;font-style:italic;src:url(${font('literata-italic-latin.woff2')}) format("woff2");font-weight:200 900}
@page{size:4.25in 6.5in;margin:0.36in 0.34in 0.32in}
*{box-sizing:border-box}html,body{margin:0}
body{font:9.3pt/1.45 L,Georgia,serif;color:#1d1b18}
.pg{height:5.82in;display:flex;flex-direction:column;break-after:page}.pg:last-child{break-after:auto}
header{text-align:center;padding-bottom:7pt;margin-bottom:8pt;border-bottom:.6pt solid #b9a27a}
header p{margin:0;font-size:6.4pt;letter-spacing:.2em;text-transform:uppercase;color:#8a6a2f}
header h1{margin:2pt 0 0;font-size:17pt;line-height:1.1;font-weight:500}
ol{list-style:none;margin:0;padding:0}
li{margin:0 0 9pt}
h2{display:flex;gap:5pt;align-items:baseline;margin:0 0 2pt;font-size:10.2pt;line-height:1.25;font-weight:650}
h2 span{flex:none;min-width:9pt;color:#8a6a2f}
p{margin:0}
li>p,li>blockquote{margin-left:14pt}
blockquote{margin-top:3pt;margin-right:0;margin-bottom:0;padding-left:6pt;border-left:1.2pt solid #c9b48d;font-style:italic}
.n{margin-top:3pt;font-size:8pt;color:#5c574f}
footer{margin-top:auto;padding-top:6pt;border-top:.6pt solid #b9a27a;text-align:center;font-size:6.6pt;color:#6b645b}
</style></head><body>
<section class="pg"><header><p>Verbum Domini</p><h1>Confession Card</h1></header><ol>${STEPS.slice(0, 5).map(step).join('')}</ol>
<footer>If you forget a step, the priest will guide you.</footer></section>
<section class="pg"><ol start="6">${STEPS.slice(5).map((s, i) => step(s, i + 5)).join('')}</ol>
<footer>verbumdomini.ca/confession.html</footer></section>
</body></html>`;
const b = await chromium.launch();
const p = await b.newPage();
await p.setContent(html, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
const out = path.join(APP, 'files', 'confession-card.pdf');
await p.pdf({ path: out, width: '4.25in', height: '6.5in', preferCSSPageSize: true, printBackground: true });
if (process.argv.includes('--png')) {  // a picture of each page, to check the layout
  await p.setViewportSize({ width: 408, height: 624 });
  await p.screenshot({ path: process.argv[process.argv.indexOf('--png') + 1], fullPage: true });
}
await b.close();
console.log('confession-card: ' + path.relative(process.cwd(), out));
