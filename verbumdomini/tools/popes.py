"""The Popes page of verbumdomini.ca. The source is app/data/popes.json: one entry per pope, in order, with
n (number in the official list; nn for Benedict IX's three reigns), s (address: /pope-<s>.html), name, bn (secular name, before election),
a and b (start and end: YYYY, YYYY-MM or YYYY-MM-DD, Julian dates before 1582), born, died (only when he did not die as pope: resigned or deposed; c. YYYY, or unknown), bp (birthplace), st (S saint, B blessed,
V venerable, G servant of God), bur (burial), tags, e (era), sum (one line), why (one line: his gift to the Church), bio (paragraphs), did (list), tl (key moments: [date, text]), q (quotes: t text, s source, u link), dyk ("Did you know?" facts), mot, mote (motto in Latin and English), vat (the pope's folder on
vatican.va), docs (t title, s subtitle, d date, y kind, u link, l language), and im, ic (portrait file and credit, written by tools/pope-portraits.py).
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
.pp-tools{position:sticky;top:0;z-index:3;background:var(--bg);padding:10px 0 8px;margin:0 0 6px;font-family:var(--font-sans)}
.pp-bar{display:flex;gap:8px;align-items:stretch}
.pp-q{flex:1;display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:0 14px;min-height:44px}
.pp-q:focus-within{border-color:var(--ac);box-shadow:0 0 0 3px color-mix(in srgb,var(--ac) 22%,transparent)}
.pp-q svg{width:18px;height:18px;flex:none;stroke:var(--mut);fill:none;stroke-width:2;stroke-linecap:round}
.pp-q input{flex:1;min-width:0;border:0;background:none;color:var(--tx);font:16px var(--font-sans);outline:none;padding:8px 0}
.pp-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-top:8px;padding-bottom:2px}
.pp-chips::-webkit-scrollbar{display:none}
.pp-chip{flex:none;border:1px solid var(--line);background:var(--card);color:var(--tx);border-radius:999px;padding:6px 12px;min-height:34px;font:500 14px var(--font-sans);cursor:pointer;white-space:nowrap}
.pp-chip small{color:var(--mut);font-weight:400;margin-left:4px}
.pp-chip[aria-pressed=true]{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.pp-chip[aria-pressed=true] small{color:inherit;opacity:.75}
.pp-count{display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px;font:14px var(--font-sans);color:var(--mut);margin:12px 0 0}
.pp-count button{border:0;background:none;color:var(--ac);font:inherit;text-decoration:underline;cursor:pointer;padding:0 2px}
.pp-count .pp-tg{text-decoration:none;font-weight:500}
.pp-cr{margin-left:auto;display:flex;align-items:center;gap:12px}
.pp-seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:2px;background:var(--card)}
.pp-count .pp-seg button{text-decoration:none;color:var(--mut);font:500 13px var(--font-sans);padding:5px 12px;border-radius:999px;transition:background .15s,color .15s}
.pp-count .pp-seg button[aria-pressed=true]{background:var(--tx);color:var(--bg)}
.pp-leg{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.pp-lg{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--card);color:var(--tx);border-radius:999px;padding:5px 11px;font:500 13px var(--font-sans);cursor:pointer;transition:opacity .15s}
.pp-lg:hover{border-color:var(--ec)}
.pp-lg i{width:10px;height:10px;border-radius:50%;background:var(--ec)}
.pp-lg small{color:var(--mut)}
.pp-lg[aria-pressed=false]{opacity:.5}.pp-lg[aria-pressed=false] i{background:none;box-shadow:inset 0 0 0 2px var(--ec)}
.pp-all-t{border:1px solid var(--line);border-radius:var(--pp-r);overflow:hidden;background:var(--card)}
.doc .pp-tball tbody td.c-n{box-shadow:inset 4px 0 var(--ec)}
.pp-tb .c-e{white-space:nowrap}
.pp-et{display:inline-block;font:600 12px var(--font-sans);padding:3px 9px;border-radius:999px;background:var(--ecb);color:var(--ecs)}
.doc details.pp-era{margin:10px 0 0;padding:0;border:1px solid var(--line);border-radius:var(--pp-r);background:var(--card);overflow:hidden;font-family:var(--font-sans);font-size:inherit}
.doc details.pp-era>summary:after{content:none}
.doc details.pp-era>summary,.doc details.pp-era[open]>summary{margin:0;font-weight:400;list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;padding:12px 14px 12px 12px;border-left:5px solid var(--ec);transition:background .15s}
.pp-era>summary::-webkit-details-marker{display:none}
.pp-era>summary:hover{background:var(--ecb)}
.doc details.pp-era[open]>summary{border-bottom:1px solid var(--line)}
.doc .pp-era h2{flex:1;min-width:0;margin:0;padding:0;border:0;font-size:19px;line-height:1.25;scroll-margin-top:150px}
.pp-era h2 small{display:block;font:400 13px var(--font-sans);color:var(--mut);margin-top:2px}
.pp-stk{display:flex;flex:none;padding-left:10px}
.pp-stk>*{width:34px;height:34px;box-sizing:border-box;border-radius:50%;border:2px solid var(--card);margin-left:-10px;background:var(--ecb);overflow:hidden;transition:transform .2s}
.pp-stk img{object-fit:cover;object-position:50% 20%}
.pp-stk b{display:grid;place-items:center;font-size:11px;color:var(--tx)}
.pp-era>summary:hover .pp-stk>*{transform:translateY(-3px)}
.pp-era>summary:hover .pp-stk>:nth-child(2){transition-delay:.04s}.pp-era>summary:hover .pp-stk>:nth-child(3){transition-delay:.08s}.pp-era>summary:hover .pp-stk>:nth-child(4){transition-delay:.12s}
.pp-chev{flex:none;width:20px;height:20px;stroke:var(--mut);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s}
.pp-era[open] .pp-chev{transform:rotate(180deg)}
.doc table.pp-tb{display:table;width:100%;border-collapse:collapse;margin:0;font-size:14px}
.doc .pp-tb th{padding:0;background:var(--bg2);font-size:12px;letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid var(--line)}
.pp-tb th button{display:flex;align-items:center;gap:5px;width:100%;box-sizing:border-box;border:0;background:none;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit;padding:9px 12px;cursor:pointer;text-align:left}
.pp-tb th button:hover{color:var(--tx)}
.pp-tb th button:after{content:"↕";opacity:.35;font-size:13px}
.pp-tb th[aria-sort=ascending] button,.pp-tb th[aria-sort=descending] button{color:var(--tx)}
.pp-tb th[aria-sort=ascending] button:after{content:"↑";opacity:1;color:var(--ecs)}
.pp-tb th[aria-sort=descending] button:after{content:"↓";opacity:1;color:var(--ecs)}
.doc .pp-tb td{padding:7px 12px;vertical-align:middle}
.pp-tb tbody tr{position:relative}
.doc .pp-tb tr:has(td):hover td{background:var(--ecb)}
.pp-tb .c-n{width:52px;font-weight:600;color:var(--ecs);font-variant-numeric:tabular-nums;white-space:nowrap}
.pp-tb .c-y{white-space:nowrap;color:var(--mut);font-variant-numeric:tabular-nums}
.pp-tb .c-l{width:22%;min-width:90px}
.pp-who{display:flex;align-items:center;gap:12px;color:var(--tx);text-decoration:none;font:600 16px/1.25 var(--font-serif)}
.pp-who:after{content:"";position:absolute;inset:0}
.pp-who:focus-visible{outline:none}.pp-tb tr:has(.pp-who:focus-visible){outline:2px solid var(--ac);outline-offset:-2px}
.pp-av0{flex:none;width:44px;height:44px;box-sizing:border-box;border-radius:50%;overflow:hidden;background:var(--ecb);border:2px solid var(--ecs);display:grid;place-items:center;transition:transform .18s}
.pp-av0 img{width:100%;height:100%;object-fit:cover;object-position:50% 20%}
.pp-av0 svg{width:64%;height:64%;opacity:.4;color:var(--ecs)}
.pp-tb tr:hover .pp-av0{transform:scale(1.14) rotate(-4deg)}
.pp-len{display:block;height:8px;border-radius:4px;background:color-mix(in srgb,var(--line) 70%,transparent);overflow:hidden}
.pp-len i{display:block;height:100%;width:var(--l);min-width:3px;border-radius:4px;background:var(--ec);transform-origin:left;animation:pp-grow .5s ease-out both}
.pp-lt{display:block;font-size:12px;color:var(--mut);margin-top:3px;opacity:0;transition:opacity .15s;white-space:nowrap}
.pp-tb tr:hover .pp-lt,.pp-tb tr:focus-within .pp-lt{opacity:1}
@keyframes pp-grow{from{transform:scaleX(0)}}
.pp-ls{columns:2;font-size:14px;padding:12px 14px 12px 32px;margin:0}
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
.pp-prof{position:relative}
.pp-nb{position:absolute;top:16px;right:18px;display:flex;gap:8px;font:14px var(--font-sans)}
.pp-nb a.pp-arr{display:inline-flex;align-items:center;gap:5px;padding:4px;border:1px solid var(--line);background:color-mix(in srgb,var(--card) 85%,transparent);border-radius:999px;text-decoration:none;font-size:22px;line-height:1;color:var(--mut);transition:border-color .15s,transform .15s}
.pp-nb a.pp-arr[rel=prev]{padding-left:11px}.pp-nb a.pp-arr[rel=next]{padding-right:11px}
.pp-nb a.pp-arr:hover{color:var(--tx);border-color:var(--ac);transform:translateY(-1px)}
.pp-fi{display:grid;place-items:center;width:46px;height:46px;border-radius:50%;overflow:hidden;background:var(--bg2);font:600 12px var(--font-serif);color:var(--mut)}
.pp-fi img{width:100%;height:100%;object-fit:cover;object-position:50% 38%}
.pp-det{--pr:16px;--psh:0 1px 2px color-mix(in srgb,var(--tx) 8%,transparent),0 4px 16px color-mix(in srgb,var(--tx) 5%,transparent)}
.pp-prof{background:var(--card);border:1px solid var(--line);border-radius:var(--pr);box-shadow:var(--psh);overflow:hidden;font-family:var(--font-sans)}
.pp-cover{height:120px;background:radial-gradient(120% 140% at 85% 0%,color-mix(in srgb,var(--ac) 14%,transparent),transparent 60%),linear-gradient(180deg,var(--bg2),color-mix(in srgb,var(--bg2) 60%,var(--card)))}
.pp-id{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px 20px;align-items:end;padding:0 24px 14px;margin-top:-64px}
.pp-av{width:150px;height:150px;border-radius:50%;overflow:hidden;background:var(--bg2);border:5px solid var(--card);box-shadow:var(--psh);display:grid;place-items:center}
.pp-av img{width:100%;height:100%;object-fit:cover;object-position:50% 38%;display:block}
.pp-av span{font:600 34px var(--font-serif);color:var(--mut)}
.pp-em{position:relative;display:grid;place-items:center;width:100%;height:100%}.pp-em svg{position:absolute;left:15%;top:15%;width:70%;height:70%;opacity:.22}
.pp-em b{position:relative;font-weight:600;text-shadow:0 0 6px var(--bg2),0 0 2px var(--bg2)}.pp-av .pp-em b{font-size:34px}
.doc .pp-idt h1{margin:0;font-size:32px;line-height:1.15}
.pp-kick{font:14px var(--font-sans);color:var(--mut);margin:6px 0 0;display:flex;gap:6px 10px;flex-wrap:wrap;align-items:center}
.pp-kick>span:not(.pp-b)+span:not(.pp-b):before{content:"·";margin-right:10px}
.pp-act{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.pp-btn{display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:0 14px;border-radius:10px;background:var(--bg2);color:var(--tx);text-decoration:none;font:600 14px var(--font-sans);border:1px solid var(--line)}
.pp-btn:hover{border-color:var(--mut)}.pp-btn.pri{background:var(--tx);color:var(--bg);border-color:var(--tx)}.pp-btn small{opacity:.7;font-weight:400}
.doc .pp-tabs{display:flex;flex-wrap:nowrap;gap:4px;overflow-x:auto;scrollbar-width:none;border-top:1px solid var(--line);padding:0 16px;margin:0 8px}
.pp-tabs::-webkit-scrollbar{display:none}
.pp-tabs a{flex:none;text-align:center;padding:12px 12px 10px;color:var(--mut);text-decoration:none;font:600 14px var(--font-sans);border-bottom:3px solid transparent}
.pp-tabs a{display:inline-flex;align-items:center;justify-content:center;gap:7px}.pp-tabs svg{width:17px;height:17px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.pp-tabs small{font-weight:500;font-size:12px;padding:1px 7px;border-radius:999px;background:var(--bg2)}
.pp-tabs a:hover{color:var(--tx)}.pp-tabs a.on{color:var(--tx);border-bottom-color:var(--ac)}
.pp-fb{margin-top:16px;font-family:var(--font-sans)}
.doc dl.pp-info{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px}
.pp-box{background:var(--card);border:1px solid var(--line);border-radius:var(--pr);box-shadow:var(--psh);padding:16px 18px}
.doc .pp-box h2,.doc .pp-box h3{margin:0 0 10px;font:700 18px/1.3 var(--font-sans);color:var(--tx)}
.doc .pp-pan>h2:not(:first-child){margin-top:22px;padding-top:18px;border-top:1px solid var(--line);scroll-margin-top:90px}
.pp-bb.prose p{font:16.5px/1.65 var(--font-serif);margin:0 0 .8em}.pp-bb.prose p:last-child{margin:0}
.pp-ln{color:var(--ac);text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--ac) 35%,transparent);text-underline-offset:2px}
.pp-ln:hover{text-decoration-color:currentColor}
.pp-status{margin:0 0 20px;font:17px/1.55 var(--font-serif);padding:2px 0 2px 14px;border-left:3px solid var(--ec)}
.doc ol.pp-step{display:flex;list-style:none;margin:0 0 18px;padding:18px 0 0}
.doc .pp-step li{flex:1 1 0;min-width:0;position:relative;margin:0;padding:26px 4px 0;text-align:center}
.pp-step li:before{content:"";position:absolute;z-index:1;top:3px;left:50%;width:16px;height:16px;margin-left:-8px;box-sizing:border-box;border-radius:50%;background:var(--card);border:3px solid var(--ecs)}
.pp-step li:after{content:"";position:absolute;top:9px;right:50%;width:100%;height:4px;border-radius:2px;background:var(--line)}
.pp-step li:first-child:after{display:none}
.pp-step li.r:after{background:var(--ec)}.pp-step li.r:before{background:var(--ec)}
.pp-step li.now:before{animation:pp-pulse 2s ease-out infinite}
@keyframes pp-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ec) 55%,transparent)}100%{box-shadow:0 0 0 10px transparent}}
.pp-step span{display:block;font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mut)}
.pp-step b{display:block;font:700 19px/1.25 var(--font-serif);color:var(--tx);font-variant-numeric:tabular-nums}
.pp-step small{display:block;font-size:12.5px;color:var(--mut)}
.pp-rg{position:absolute;z-index:2;top:-16px;left:0;transform:translateX(-50%);white-space:nowrap;font:600 12px/1.2 var(--font-sans);font-style:normal;color:var(--ecs)}
.doc dl.pp-info{margin:0;font-size:13.5px}
.pp-info div{padding:7px 11px;border-radius:10px;background:var(--bg);border:1px solid var(--line)}
.pp-info dd small{font-size:12.5px}
.pp-info dt{color:var(--mut);font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}.pp-info dd{margin:3px 0 0;line-height:1.45}.pp-info dd small{color:var(--mut)}
.pp-cred{margin:10px 0 0;font-size:11.5px;line-height:1.4;color:var(--mut)}.pp-cred a{color:inherit}
.pp-det h2{scroll-margin-top:16px}
.doc .pp-did{list-style:none;margin:0;padding:0}
.doc .pp-did li{position:relative;padding:8px 4px 8px 30px;margin:0;border-bottom:1px solid var(--line);font-size:15.5px;line-height:1.45}.doc .pp-did li:last-child{border:0}
.pp-why{margin:-6px 0 20px;padding:12px 16px;border-radius:var(--pp-r);background:var(--ecb);font:16px/1.55 var(--font-serif)}
.pp-why b{display:block;font:600 12px/1.4 var(--font-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--ecs);margin:0 0 4px}
.doc .pp-tl{list-style:none;margin:0;padding:0 0 0 14px;border-left:2px solid var(--ec)}
.doc .pp-tl li{position:relative;margin:0;padding:6px 0 10px 16px;font-size:15.5px;line-height:1.45}
.pp-tl li:before{content:"";position:absolute;left:-20px;top:11px;width:10px;height:10px;border-radius:50%;background:var(--card);border:2px solid var(--ec)}
.pp-tl b{display:block;font:600 13px var(--font-sans);color:var(--ecs)}
.pp-qs{display:grid;gap:12px}
.doc .pp-qt{margin:0;padding:16px 18px;border-radius:var(--pp-r);background:var(--card);border:1px solid var(--line);border-left:4px solid var(--ec)}
.doc .pp-qt blockquote{margin:0;padding:0;border:0}
.doc .pp-qt p{margin:0;font:italic 18px/1.5 var(--font-serif)}
.pp-qt p:before{content:"\201C"}.pp-qt p:after{content:"\201D"}
.pp-qt figcaption{margin:8px 0 0;font:13px/1.4 var(--font-sans);color:var(--mut)}.pp-qt figcaption a{color:inherit}
.doc .pp-dyk{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.doc .pp-dyk li{margin:0;padding:16px;border-radius:var(--pp-r);background:var(--ecb);font-size:15px;line-height:1.5}
.pp-dyk li:before{content:"?";display:grid;place-items:center;width:26px;height:26px;margin:0 0 8px;border-radius:50%;background:var(--ec);color:#fff;font:700 15px var(--font-sans)}
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
@media (max-width:760px){
 .doc .pp-tabs{padding:0;margin:0}.pp-tabs a{flex:1 1 auto;padding:12px 6px 10px}
 .pp-id{grid-template-columns:1fr;justify-items:center;text-align:center;padding:0 16px 12px}.pp-kick,.pp-act{justify-content:center}.pp-av{width:128px;height:128px}.pp-cover{height:96px}.pp-nb{top:10px;left:12px;right:12px;justify-content:space-between}.pp-nb a[rel=next]:only-child{margin-left:auto}.pp-fi{width:38px;height:38px}.pp-box{padding:14px}}
@media (max-width:640px){.doc .pp-idt h1{font-size:27px}
 .pp-stk>:nth-child(n+3){display:none}.pp-ls{columns:1}
 .doc .pp-tb td{padding:6px 8px}.pp-tb th button{padding:9px 8px}.pp-tb .c-n{width:40px}.pp-av0{width:38px;height:38px}.pp-who{gap:10px;font-size:15px}.pp-tb .c-l{width:60px;min-width:60px}.pp-tb .c-e{display:none}.pp-cr{margin-left:0}.pp-lt{display:none}}
@media (max-width:400px){.pp-tb .c-l{display:none}}
@media print{.pp-nb,.pp-tools,.pp-count,.pp-stk,.pp-chev,.pp-av0,.c-l,.pp-crumb,.pp-act,.pp-tabs,.pp-dtabs,.pp-dq,.pp-all,.pp-cover,.pp-cred{display:none!important}
 .pp-prof,.pp-box{border:0!important;box-shadow:none!important;padding:0!important;background:none!important}
 .pp-id{display:flex!important;align-items:center;gap:6mm;margin:0 0 6mm!important;padding:0 0 5mm!important;border-bottom:.6pt solid #cfc6b2}
 .pp-av{width:28mm!important;height:28mm!important;border:0!important;box-shadow:none!important;flex:none}
 .doc .pp-idt h1{font-size:24pt!important}
 .pp-fb{display:block!important;margin:0!important}.pp-pan[hidden]{display:block!important}
 .pp-box{margin:0 0 6mm!important;break-inside:auto}
 .doc .pp-box h2{font-size:13pt!important;margin:0 0 2mm!important;padding-bottom:1mm;border-bottom:.4pt solid #e2dccd}
 .pp-status{text-align:left!important;border:0!important;padding:0!important;font-style:italic}
 .doc dl.pp-info{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1mm 6mm}
 .pp-info div{border:0!important;padding:0!important;background:none!important}.pp-step li:before{background:#fff!important}
 .pp-docs a{padding:1.5mm 0!important}.pp-docs b:after{display:none}.pp-docs .t{display:none!important}
 .pp-era{border:0!important;break-inside:auto}.pp-era>summary{border-left:0!important;padding:3mm 0 1mm!important}.pp-tb tr{break-inside:avoid}.doc .pp-tb td{padding:1mm 2mm!important}}
@media (prefers-reduced-motion:reduce){.pp-stk>*,.pp-chev,.pp-av0{transition:none}.pp-len i,.pp-step li.now:before{animation:none}}
</style>
'''
o=[CSS,'<div class="wrap pp-page">\n',
 '<header class="page-head center painted" id="x-pp-top"><img alt="" class="ph-art" height="506" loading="lazy" src="art/i-keys-800.jpg" width="800"/><div class="ph-text"><span class="page-ico"></span><h1>The Popes</h1><p class="sub">From St. Peter to Leo XIV, all 267.</p></div><p class="ph-cap">Perugino · <cite>Giving the Keys to Saint Peter</cite></p></header>\n',
 '<p class="bb-lede pp-lede">Jesus gave Peter the keys of the kingdom and told him to feed his sheep. Every Bishop of Rome since has inherited that task. Here are all of them, in order: search by name, browse by era, or open any pope to read his life, what he did for the Church, and the documents he published, with links to the official texts on the Vatican’s website.</p>\n',
 '<div id="pp-app">\n']
for k,t,y in ERAS:
    L=[p for p in P if p['e']==k]
    o.append(f'<details class="pp-era pp-e-{k}" id="pp-era-{k}"><summary><h2>{E(t)} <small>{y} · {len(L)} popes</small></h2></summary><ol class="pp-ls">')
    for p in L:
        o.append(f'<li><a href="#popes/{p["s"]}">{ordn(p["n"])} · {E(p["name"])}</a> ({span(p)})</li>')
    o.append('</ol></details>\n')
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
<li>Portraits: mosaics, paintings, prints and photographs from <a href="https://commons.wikimedia.org" rel="noopener" target="_blank">Wikimedia Commons</a> and the Rijksmuseum, Amsterdam (through <a href="https://www.europeana.eu" rel="noopener" target="_blank">Europeana</a>), in the public domain or under a Creative Commons licence; each pope’s page names its source, and its author where the licence asks for it. Popes without a portrait show the keys of Peter and their number.</li>
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
    S.append([f"popes/{p['s']}",'',f"Pope {ST.get(p.get('st'),'')}{p['name']}",10,' '.join([head,p['sum'],p.get('why','')]+p['bio']+p['did']+[t for d,t in p.get('tl',[])]+[x['t'] for x in p.get('q',[])]+p.get('dyk',[]))])
json.dump(S,open(APP+'/pages/search.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(f'popes: {len(P)} popes, pages/popes.html, index.json and search.json updated')
