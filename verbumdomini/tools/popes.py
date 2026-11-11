"""The Popes page of verbumdomini.ca. The source is app/data/popes.json: one entry per pope, in order, with
n (number in the official list; nn for Benedict IX's three reigns), s (address: /popes.html#<s>), name, bn (name before election),
a and b (start and end: YYYY, YYYY-MM or YYYY-MM-DD, Julian dates before 1582), born, bp (birthplace), st (S saint, B blessed,
V venerable, G servant of God), bur (burial), tags, e (era), sum (one line), bio (paragraphs), did (list), vat (the pope's folder on
vatican.va), docs (t title, s subtitle, d date, y kind, u link, l language).
The app (app/index.html, popesInit) draws the explorer and each pope's page from that file. This script writes what is built
from it: the page fragment app/pages/popes.html (the list every pope links from, which search engines read), the page's entry in
app/pages/index.json, and one result per pope in app/pages/search.json. Run it after editing popes.json, then build as usual.

Usage (from the repo root): python3 verbumdomini/tools/popes.py
"""
import html, json, os, re, sys
APP = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app')
P = json.load(open(APP + '/data/popes.json', encoding='utf-8'))
E=lambda s: html.escape(s, quote=True)
ERAS=[('apostolic','Apostles and Martyrs','33-311'),('empire','The Church and the Empire','311-590'),('early','The Early Middle Ages','590-1049'),('reform','Reform and Crusades','1049-1305'),
      ('avignon','Avignon and the Great Schism','1305-1417'),('renaissance','Renaissance and Reformation','1417-1605'),('baroque','Baroque and Enlightenment','1605-1800'),
      ('modern','Revolution and the Modern World','1800-1958'),('council','The Council and Today','1958-today')]
def yr(d): return re.match(r'(?:c\. )?(\d+)',d).group(1) if d else ''
def ordn(n): return f'{n}'+('th' if 10<=n%100<=20 else {1:'st',2:'nd',3:'rd'}.get(n%10,'th'))
def span(p): return yr(p['a'])+('-'+yr(p['b']) if p.get('b') and yr(p['b'])!=yr(p['a']) else '' if p.get('b') else '-')
CSS=r'''<style>
.pp-page{--pp-r:12px}
.pp-page .pp-lede{max-width:640px}
.pp-e-apostolic{--ec:#a3312b}.pp-e-empire{--ec:#9a7414}.pp-e-early{--ec:#6a4fa3}.pp-e-reform{--ec:#2f7474}.pp-e-avignon{--ec:#a2582e}
.pp-e-renaissance{--ec:#3e64a8}.pp-e-baroque{--ec:#94407a}.pp-e-modern{--ec:#3a7a48}.pp-e-council{--ec:#b8741c}
.pp-page [class*=pp-e-]{--ecs:color-mix(in srgb,var(--ec) 78%,var(--tx));--ecb:color-mix(in srgb,var(--ec) 13%,var(--card))}
.pp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:18px 0 22px;font-family:var(--font-sans)}
.pp-stats div{background:var(--card);border:1px solid var(--line);border-radius:var(--pp-r);padding:12px 12px 10px}
.pp-stats b{display:block;font:600 26px/1.1 var(--font-serif);color:var(--tx)}
.pp-stats span{font-size:13px;color:var(--mut);line-height:1.35;display:block;margin-top:4px}
.pp-tools{position:sticky;top:0;z-index:3;background:var(--bg);padding:10px 0 8px;margin:0 0 6px;font-family:var(--font-sans)}
.pp-bar{display:flex;gap:8px;align-items:stretch}
.pp-q{flex:1;display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:0 14px;min-height:44px}
.pp-q:focus-within{border-color:var(--ac);box-shadow:0 0 0 3px color-mix(in srgb,var(--ac) 22%,transparent)}
.pp-q svg{width:18px;height:18px;flex:none;stroke:var(--mut);fill:none;stroke-width:2;stroke-linecap:round}
.pp-q input{flex:1;min-width:0;border:0;background:none;color:var(--tx);font:16px var(--font-sans);outline:none;padding:8px 0}
.pp-sort{border:1px solid var(--line);background:var(--card);color:var(--tx);border-radius:999px;padding:0 12px;font:14px var(--font-sans);min-height:44px;max-width:44%}
.pp-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-top:8px;padding-bottom:2px}
.pp-chips::-webkit-scrollbar{display:none}
.pp-chip{flex:none;border:1px solid var(--line);background:var(--card);color:var(--tx);border-radius:999px;padding:6px 12px;min-height:34px;font:500 14px var(--font-sans);cursor:pointer;white-space:nowrap}
.pp-chip small{color:var(--mut);font-weight:400;margin-left:4px}
.pp-chip[aria-pressed=true]{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.pp-chip[aria-pressed=true] small{color:inherit;opacity:.75}
.pp-eras{display:flex;gap:3px;margin:16px 0 6px;font-family:var(--font-sans)}
.pp-era-b{flex:var(--w) 1 0;min-width:0;border:0;padding:0;background:none;cursor:pointer;text-align:left;color:var(--tx)}
.pp-era-b i{display:block;height:14px;border-radius:4px;background:var(--ec);opacity:.85;transition:opacity .15s,transform .15s}
.pp-era-b:hover i,.pp-era-b:focus-visible i{opacity:1;transform:scaleY(1.25)}
.pp-eras.on .pp-era-b[aria-pressed=false] i{opacity:.25}
.pp-era-b span{display:block;font-size:11px;line-height:1.25;margin-top:5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pp-era-b[aria-pressed=true] span{color:var(--tx);font-weight:600}
.pp-tl{position:relative;margin:4px 0 4px;padding:8px 0 0;font-family:var(--font-sans)}
.pp-tl-c{display:grid;grid-template-columns:repeat(21,minmax(0,1fr));gap:3px;align-items:end;height:124px;border-bottom:1px solid var(--line)}
.pp-tl-col{display:flex;flex-direction:column-reverse;gap:1px;height:100%;overflow:hidden}
.pp-tl-col a{display:block;width:100%;height:3px;border-radius:1px;background:var(--ec);opacity:.85;flex:none}
.pp-tl-col a:hover{opacity:1;background:var(--tx)}
.pp-tl-col a.off{opacity:.15}
.pp-tl-x{display:grid;grid-template-columns:repeat(21,minmax(0,1fr));gap:2px;font-size:10px;color:var(--mut);text-align:center;margin-top:4px}
.pp-tl-x span:nth-child(even){visibility:hidden}
.pp-tl-tip{position:absolute;bottom:calc(100% - 6px);transform:translateX(-50%);background:var(--tx);color:var(--bg);font-size:12px;padding:5px 9px;border-radius:7px;white-space:nowrap;pointer-events:none;z-index:4}
.pp-count{font:14px var(--font-sans);color:var(--mut);margin:14px 0 0}
.pp-count button{border:0;background:none;color:var(--ac);font:inherit;text-decoration:underline;cursor:pointer;padding:0 2px}
.pp-era{margin-top:30px}
.pp-eh{display:flex;align-items:baseline;gap:4px 10px;flex-wrap:wrap;border-bottom:2px solid var(--ec);padding-bottom:8px;margin:0 0 12px}
.doc .pp-eh h2{margin:0;font-size:22px;scroll-margin-top:150px}
.pp-eh span{font:13px var(--font-sans);color:var(--mut)}
.doc ol.pp-grid{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.doc .pp-grid li{margin:0}
.pp-card{display:grid;grid-template-columns:auto 1fr;align-content:start;gap:2px 12px;height:100%;box-sizing:border-box;padding:12px 14px 12px 12px;border-radius:var(--pp-r);background:var(--card);border:1px solid var(--line);color:var(--tx);text-decoration:none;font-family:var(--font-sans);position:relative;transition:border-color .15s,transform .15s,box-shadow .15s}
.pp-card:hover{border-color:var(--ecs);transform:translateY(-1px);box-shadow:var(--soft)}
.pp-n{grid-row:span 3;min-width:38px;height:38px;padding:0 5px;box-sizing:border-box;border-radius:999px;display:grid;place-items:center;font:600 14px var(--font-sans);background:var(--ecb);color:var(--tx);border:2px solid var(--ecs);font-variant-numeric:tabular-nums}
.pp-n.long{font-size:12px}
.pp-nm{font:600 17px/1.25 var(--font-serif)}
.pp-yr{font-size:13px;color:var(--mut);font-variant-numeric:tabular-nums}
.pp-sm{grid-column:1/-1;font-size:13.5px;line-height:1.45;color:color-mix(in srgb,var(--tx) 82%,var(--bg));margin-top:6px}
.pp-tg{display:flex;gap:4px;flex-wrap:wrap}
.pp-b{display:inline-block;font:600 11px/1 var(--font-sans);letter-spacing:.02em;padding:4px 7px;border-radius:999px;background:var(--acbg);color:var(--tx);white-space:nowrap}
.pp-b.S{background:color-mix(in srgb,#c8a43c 30%,var(--card))}.pp-b.B{background:color-mix(in srgb,#5b8bd0 24%,var(--card))}
.pp-b.V,.pp-b.G{background:color-mix(in srgb,#8c8c8c 20%,var(--card))}.pp-b.m{background:color-mix(in srgb,#b23a3a 22%,var(--card))}
.pp-b.d{background:color-mix(in srgb,#5c46a0 22%,var(--card))}.pp-b.x{background:color-mix(in srgb,var(--tx) 9%,var(--card))}
.pp-none{font:15px var(--font-sans);color:var(--mut);padding:30px 0;text-align:center}
.pp-about{margin-top:48px}
.pp-det{font-family:var(--font-serif)}
.pp-crumb{display:flex;justify-content:space-between;align-items:center;gap:8px;font:14px var(--font-sans);margin:0 0 16px;flex-wrap:wrap}
.pp-crumb a{color:var(--tx);text-decoration:none;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:7px 13px;display:inline-flex;align-items:center;gap:6px;min-height:24px}
.pp-crumb a:hover{border-color:var(--ac)}
.pp-crumb span{display:flex;gap:6px}
.pp-det{--pr:16px;--psh:0 1px 2px color-mix(in srgb,var(--tx) 8%,transparent),0 4px 16px color-mix(in srgb,var(--tx) 5%,transparent)}
.pp-prof{background:var(--card);border:1px solid var(--line);border-radius:var(--pr);box-shadow:var(--psh);overflow:hidden;font-family:var(--font-sans)}
.pp-cover{height:120px;background:radial-gradient(120% 140% at 85% 0%,color-mix(in srgb,var(--ac) 14%,transparent),transparent 60%),linear-gradient(180deg,var(--bg2),color-mix(in srgb,var(--bg2) 60%,var(--card)))}
.pp-id{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px 20px;align-items:end;padding:0 24px 14px;margin-top:-64px}
.pp-av{width:150px;height:150px;border-radius:50%;overflow:hidden;background:var(--bg2);border:5px solid var(--card);box-shadow:var(--psh);display:grid;place-items:center}
.pp-av img{width:100%;height:100%;object-fit:cover;object-position:50% 38%;display:block}
.pp-av span{font:600 34px var(--font-serif);color:var(--mut)}
.doc .pp-idt h1{margin:0;font-size:32px;line-height:1.15}
.pp-kick{font:14px var(--font-sans);color:var(--mut);margin:6px 0 0;display:flex;gap:6px 10px;flex-wrap:wrap;align-items:center}
.pp-kick>span+span:before{content:"·";margin-right:10px}
.pp-act{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.pp-btn{display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:0 14px;border-radius:10px;background:var(--bg2);color:var(--tx);text-decoration:none;font:600 14px var(--font-sans);border:1px solid var(--line)}
.pp-btn:hover{border-color:var(--mut)}.pp-btn.pri{background:var(--tx);color:var(--bg);border-color:var(--tx)}.pp-btn small{opacity:.7;font-weight:400}
.doc .pp-tabs{display:flex;flex-wrap:nowrap;gap:4px;overflow-x:auto;scrollbar-width:none;border-top:1px solid var(--line);padding:0 16px;margin:0 8px}
.pp-tabs::-webkit-scrollbar{display:none}
.pp-tabs a{flex:none;padding:12px 12px 10px;color:var(--mut);text-decoration:none;font:600 14px var(--font-sans);border-bottom:3px solid transparent}
.pp-tabs a:hover{color:var(--tx)}.pp-tabs a.on{color:var(--tx);border-bottom-color:var(--ac)}
.pp-fb{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,8fr);gap:16px;align-items:start;margin-top:16px;font-family:var(--font-sans)}
.pp-side,.pp-col{display:flex;flex-direction:column;gap:16px;min-width:0}
.pp-box{background:var(--card);border:1px solid var(--line);border-radius:var(--pr);box-shadow:var(--psh);padding:16px 18px}
.doc .pp-box h2,.doc .pp-box h3{margin:0 0 10px;font:700 18px/1.3 var(--font-sans);color:var(--tx)}
.pp-bb.prose p{font:16.5px/1.65 var(--font-serif);margin:0 0 .8em}.pp-bb.prose p:last-child{margin:0}
.pp-ln{color:var(--ac);text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--ac) 35%,transparent);text-underline-offset:2px}
.pp-ln:hover{text-decoration-color:currentColor}
.pp-status{margin:0 0 12px;font:15.5px/1.5 var(--font-serif);text-align:center;padding:0 0 12px;border-bottom:1px solid var(--line)}
.doc dl.pp-info{margin:0;font-size:14px}
.pp-info div{padding:6px 0}.pp-info dt{color:var(--mut);font-size:12.5px}.pp-info dd{margin:1px 0 0;line-height:1.45}.pp-info dd small{color:var(--mut)}
.pp-cred{margin:10px 0 0;font-size:11.5px;line-height:1.4;color:var(--mut)}.pp-cred a{color:inherit}
.doc ol.pp-fr{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 8px}
.doc .pp-fr li{margin:0}
.pp-fr a{display:block;text-decoration:none;color:var(--tx);font-size:12.5px;line-height:1.25}
.pp-fi{display:grid;place-items:center;aspect-ratio:1;margin-bottom:5px;border-radius:10px;overflow:hidden;background:var(--bg2);font:600 15px var(--font-serif);color:var(--mut)}
.pp-fi img{width:100%;height:100%;object-fit:cover;object-position:50% 38%}
.pp-fr b{display:block;font-weight:600}.pp-fr a:hover b{text-decoration:underline}
.pp-fr small{display:block;color:var(--mut);font-size:11px;margin-top:1px}
.pp-det h2{scroll-margin-top:16px}
.doc .pp-did{list-style:none;margin:0;padding:0}
.doc .pp-did li{position:relative;padding:8px 4px 8px 30px;margin:0;border-bottom:1px solid var(--line);font-size:15.5px;line-height:1.45}.doc .pp-did li:last-child{border:0}
.pp-did li:before{content:"";position:absolute;left:8px;top:14px;width:9px;height:9px;border-radius:3px;transform:rotate(45deg);background:var(--ac);opacity:.55}
.pp-dtabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}
.pp-dq{margin:0 0 10px}
.doc ol.pp-docs{list-style:none;padding:0;margin:0;font-family:var(--font-sans)}
.doc .pp-docs li{margin:0;border-top:1px solid var(--line)}
.pp-docs a{display:grid;grid-template-columns:1fr auto;gap:2px 12px;padding:11px 4px;text-decoration:none;color:var(--tx)}
.pp-docs a:hover b{text-decoration:underline}
.pp-docs b{font:600 16px/1.35 var(--font-serif)}
.pp-docs b:after{content:" ↗";font:13px var(--font-sans);color:var(--mut)}
.pp-docs .s{grid-column:1;font-size:13.5px;color:var(--mut);line-height:1.4}
.pp-docs .y{grid-row:1;grid-column:2;font-size:12px;color:var(--mut);text-align:right;white-space:nowrap}
.pp-docs .t{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap;margin-top:3px}
.pp-all{display:inline-block;margin-top:14px;font:600 14px var(--font-sans)}
.pp-pnb{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:40px;font-family:var(--font-sans)}
.pp-pnb a{display:block;text-decoration:none;color:var(--tx);border:1px solid var(--line);background:var(--card);border-radius:var(--pp-r);padding:12px 14px}
.pp-pnb a:hover{border-color:var(--ac)}
.pp-pnb small{display:block;color:var(--mut);font-size:12px}
.pp-pnb b{font:600 17px var(--font-serif)}
.pp-pnb .nx{text-align:right;grid-column:2}
@media (max-width:760px){.pp-fb{display:flex;flex-direction:column;align-items:stretch}.pp-side,.pp-col{display:contents}.pp-side>:first-child{order:1}.pp-col>*{order:2}.pp-frs{order:3}
 .pp-id{grid-template-columns:1fr;justify-items:center;text-align:center;padding:0 16px 12px}.pp-kick,.pp-act{justify-content:center}.pp-av{width:128px;height:128px}.pp-cover{height:96px}.pp-box{padding:14px}}
@media (max-width:640px){.pp-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.doc .pp-idt h1{font-size:27px}
 .pp-tl-x span:nth-child(even){visibility:visible}.pp-tl-x span:not(:nth-child(4n+1)){visibility:hidden}
 .pp-era-b span{display:none}.doc ol.pp-grid{grid-template-columns:1fr}.pp-sort{max-width:38%}}
@media print{.pp-tools,.pp-eras,.pp-tl,.pp-count,.pp-stats,.pp-crumb,.pp-act,.pp-tabs,.pp-frs,.pp-pnb,.pp-dtabs,.pp-dq,.pp-all,.pp-cover,.pp-cred{display:none!important}
 .pp-prof,.pp-box{border:0!important;box-shadow:none!important;padding:0!important;background:none!important}
 .pp-id{display:flex!important;align-items:center;gap:6mm;margin:0 0 6mm!important;padding:0 0 5mm!important;border-bottom:.6pt solid #cfc6b2}
 .pp-av{width:28mm!important;height:28mm!important;border:0!important;box-shadow:none!important;flex:none}
 .doc .pp-idt h1{font-size:24pt!important}
 .pp-fb{display:block!important;margin:0!important}.pp-side,.pp-col{display:block!important}
 .pp-box{margin:0 0 6mm!important;break-inside:auto}
 .doc .pp-box h2{font-size:13pt!important;margin:0 0 2mm!important;padding-bottom:1mm;border-bottom:.4pt solid #e2dccd}
 .pp-status{text-align:left!important;border:0!important;padding:0!important;font-style:italic}
 .doc dl.pp-info{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1mm 6mm}
 .pp-docs a{padding:1.5mm 0!important}.pp-docs b:after{display:none}.pp-docs .t{display:none!important}
 .doc ol.pp-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:2mm!important}.pp-card{border:0!important;padding:1mm 0!important;break-inside:avoid}.pp-sm{display:none}}
@media (prefers-reduced-motion:reduce){.pp-card,.pp-era-b i{transition:none}}
</style>
'''
nS=sum(1 for p in P if p.get('st')=='S'); nB=sum(1 for p in P if p.get('st')=='B')
o=[CSS,'<div class="wrap pp-page">\n',
 '<header class="page-head center painted" id="x-pp-top"><img alt="" class="ph-art" height="506" loading="lazy" src="art/i-keys-800.jpg" width="800"/><div class="ph-text"><span class="page-ico"></span><h1>The Popes</h1><p class="sub">From St. Peter to Leo XIV, all 267.</p></div><p class="ph-cap">Perugino · <cite>Giving the Keys to Saint Peter</cite></p></header>\n',
 '<p class="bb-lede pp-lede">Jesus gave Peter the keys of the kingdom and told him to feed his sheep. Every Bishop of Rome since has inherited that task. Here are all of them, in order: search by name, browse by era, or open any pope to read his life, what he did for the Church, and the documents he published, with links to the official texts on the Vatican’s website.</p>\n',
 f'<div class="pp-stats"><div><b>267</b><span>popes in the official list</span></div><div><b>{nS}</b><span>venerated as saints, and {nB} as blessed</span></div><div><b>31 years</b><span>the longest documented reign, Pius IX</span></div><div><b>13 days</b><span>the shortest, Urban VII in 1590</span></div></div>\n',
 '<div id="pp-app">\n']
for k,t,y in ERAS:
    L=[p for p in P if p['e']==k]
    o.append(f'<section class="pp-era pp-e-{k}" id="pp-era-{k}"><div class="pp-eh"><h2>{E(t)}</h2><span>{y} · {len(L)} popes</span></div><ol class="pp-grid">')
    for p in L:
        n='145, 147, 150' if p.get('nn') else str(p['n'])
        o.append(f'<li><a class="pp-card" href="#popes/{p["s"]}"><span class="pp-n{" long" if p["n"]>99 else ""}">{ordn(p["n"])}</span><span class="pp-nm">{E(p["name"])}</span><span class="pp-yr">{span(p)}</span><span class="pp-sm">{E(p["sum"])}</span></a></li>')
    o.append('</ol></section>\n')
o.append('</div>\n')
o.append('''<section class="bb-sec pp-about" id="pp-about"><h2>About this list</h2><div class="prose">
<p>The numbering follows the official list of the Holy See, the one printed in the Vatican’s yearbook, the <i>Annuario Pontificio</i>. Leo XIV is the 267th pope. Benedict IX, who held the office three separate times in the eleventh century, is counted at each of his three reigns (145th, 147th and 150th), so 265 men have been pope.</p>
<p>A priest named Stephen was elected in March 752 and died a few days later, before he was consecrated. Older lists counted him as Stephen II, but the official list has left him out since 1961, which is why the later Stephens are sometimes given two numbers, such as Stephen II (III). Antipopes, men who claimed the papacy against a lawful pope, are not included.</p>
<p>For the first centuries the dates are those of tradition: the early lists of Roman bishops give the order and the approximate length of each reign, but rarely exact dates, and much of what later writers said about these popes, especially in the <i>Liber Pontificalis</i>, cannot be checked. Where a story is legend or uncertain, the pope’s page says so. Dates of election are given as recorded at the time (before 1582, in the Julian calendar).</p>
<p>The documents on each pope’s page link to the Holy See’s website, vatican.va, which publishes papal texts mostly from Leo XIII (1878) onward, with a selection from earlier centuries. Some are available only in Latin or Italian; the list says so. Each list is a selection of the most important texts; the Vatican’s site has the rest.</p>
</div></section>
<section class="bb-sec" id="pp-sources"><h2>Sources</h2><div class="prose"><ul>
<li>The Holy See, <a href="https://www.vatican.va/content/vatican/en/holy-father.html" rel="noopener" target="_blank">The Supreme Pontiffs</a>, with the documents of each pope</li>
<li><i>Annuario Pontificio</i> (Vatican City: Libreria Editrice Vaticana), the official list of the Roman Pontiffs</li>
<li>J. N. D. Kelly and Michael Walsh, <i>The Oxford Dictionary of Popes</i>, 2nd ed. (Oxford University Press, 2010)</li>
<li>Eamon Duffy, <i>Saints and Sinners: A History of the Popes</i>, 4th ed. (Yale University Press, 2014)</li>
<li>Eusebius of Caesarea, <i>Church History</i>, and St. Irenaeus of Lyons, <i>Against Heresies</i> III.3, for the early Bishops of Rome</li>
</ul></div></section>
</div>
''')
open(APP+'/pages/popes.html','w',encoding='utf-8',newline='\n').write(''.join(o))

# The page in the site index and each pope in the site search (old entries are replaced)
frag=open(APP+'/pages/popes.html',encoding='utf-8').read()
body=re.sub(r'<style>.*?</style>','',frag,flags=re.S)
text=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',body))).strip()
heads=[re.sub(r'<small>.*?</small>','',h).strip() for h in re.findall(r'<h2[^>]*>(.*?)</h2>',body,re.S)]
heads=[html.unescape(re.sub(r'<[^>]+>','',h)).strip() for h in heads]
lede=html.unescape(re.sub(r'<[^>]+>','',re.search(r'<p class="bb-lede pp-lede">(.*?)</p>',body,re.S).group(1)))
I=json.load(open(APP+'/pages/index.json',encoding='utf-8'))
I=[x for x in I if x['s']!='popes']
k=[x['s'] for x in I].index('vatican-ii')+1
I.insert(k,{'s':'popes','t':'The Popes','d':'All 267 popes from St. Peter to Leo XIV: search and browse them by era, read each pope’s life and what he did for the Church, and find his documents on the Vatican’s website.','h':heads,'n':len(text)})
json.dump(I,open(APP+'/pages/index.json','w',encoding='utf-8'),ensure_ascii=False)
S=json.load(open(APP+'/pages/search.json',encoding='utf-8'))
S=[r for r in S if not (r[0]=='popes' or r[0].startswith('popes/'))]
S.append(['popes','','The Popes',0,lede])
ST={'S':'St. ','B':'Bl. '}
def yr(d): return re.match(r'(?:c\. )?(\d+)',d).group(1)
for p in P:
    span=yr(p['a'])+('-'+yr(p['b']) if p.get('b') else ' to today')
    head=f"{p['n']}. {span}."+(f" Born {p['bn']}" if p.get('bn') and p['bn']!=p['name'] else '')+(f" in {p['bp']}." if p.get('bp') else '.' if p.get('bn') and p['bn']!=p['name'] else '')
    S.append([f"popes/{p['s']}",'',f"Pope {ST.get(p.get('st'),'')}{p['name']}",10,' '.join([head,p['sum']]+p['bio']+p['did'])])
json.dump(S,open(APP+'/pages/search.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(f'popes: {len(P)} popes, pages/popes.html, index.json and search.json updated')
