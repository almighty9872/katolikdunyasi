"""Builds verbumdomini.ca from verbumdomini/app/ into verbumdomini/_site_en/.

app/ is a single-page app: index.html loads each page (pages/<slug>.html) when the address is
/<slug>.html (a place inside a page follows as a hash, /holy-bible.html#genesis/1). Every page also
gets a real file, <slug>.html: the same shell with that page's title, description and canonical
address, and the page's text already in place, so search engines read it and reloads work. The app
writes its links as #<slug>; here they become /<slug>.html, and the app opens either in place.

Usage (from the repo root): python3 verbumdomini/tools/build-app.py
(once per checkout, to install the pinned Tailwind: npm ci --prefix verbumdomini)
"""
import datetime, hashlib, html, json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP, OUT = os.path.join(ROOT, 'app'), os.path.join(ROOT, '_site_en')
SITE = 'https://verbumdomini.ca'
TAGLINE = 'Spreading and defending the Gospel'
# Old addresses of the previous site that now have another name: old file -> page
ALIASES = {'bible': 'holy-bible'}

def rd(p): return open(os.path.join(APP, p), encoding='utf-8').read()
def wr(p, s):
    p = os.path.join(OUT, p); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8', newline='\n').write(s)
def one(s, old, new, label):
    if s.count(old) != 1: sys.exit(f'build-app: {label}: expected one match, found {s.count(old)}')
    return s.replace(old, new)
def attr(s): return html.escape(s, quote=True)

# The stylesheet: Tailwind builds app/app.css from app/src/app.tw.css (it is build output, not kept in git).
# Tailwind is pinned in verbumdomini/package.json; install it once with: npm ci --prefix verbumdomini
TW = os.path.join(ROOT, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs')
if not os.path.isfile(TW): sys.exit('build-app: Tailwind is not installed; run: npm ci --prefix verbumdomini')
tw = subprocess.run(['node', TW, '-i', 'app.tw.css', '-o', os.path.join(APP, 'app.css'), '--minify'],
                    cwd=os.path.join(APP, 'src'), capture_output=True, text=True)
if tw.returncode or not os.path.isfile(os.path.join(APP, 'app.css')): sys.exit('build-app: Tailwind failed:\n' + tw.stderr)

if os.path.isdir(OUT): shutil.rmtree(OUT)
shutil.copytree(APP, OUT, ignore=shutil.ignore_patterns('src', 'index.html'))

# The app's script moves to app.js; both it and app.css get a content hash so they can be cached for a year
shell = rd('index.html')
m = re.search(r'<script>\n(.*)</script>\n</body></html>\n?$', shell, re.S)
if not m or len(m.group(1)) < 100000: sys.exit('build-app: main script not found')
wr('app.js', m.group(1))
def ver(p): return hashlib.sha256(open(os.path.join(OUT, p), 'rb').read()).hexdigest()[:10]
shell = shell[:m.start()] + f'<script src="app.js?v={ver("app.js")}"></script>\n</body></html>\n'
shell = one(shell, '<link rel="stylesheet" href="app.css">', f'<link rel="stylesheet" href="app.css?v={ver("app.css")}">', 'app.css link')

pages = json.load(open(os.path.join(APP, 'pages', 'index.json'), encoding='utf-8'))
INFO = {p['s']: p for p in pages}
STATIC = {'home': 'Welcome', 'rosary': 'The Rosary', 'saints': 'Saints'}
# 'bible' and the rest are older names the app still opens (GONE in app/index.html)
ROUTES = sorted(set(INFO) | set(STATIC) | {'more', 'bible', 'read-the-bible', 'who-is-jesus', 'start'})
SUBS = {'holy-bible', 'parables', 'popes'}
POPES = {p['s']: p for p in json.load(open(os.path.join(APP, 'data', 'popes.json'), encoding='utf-8'))}
PARABLES = re.findall(r'<details class="pb-item" id="([a-z0-9-]+)"', rd('pages/parables.html'))  # pages with places inside them (BIB, PBC and the popes in app/index.html)

def links(s):
    # href="#<slug>[/<place>]" -> "/<slug>.html[#<place>]" (the home page is "/")
    def fix(m):
        slug, sub = m.group(1), m.group(2)
        if slug not in ROUTES: return m.group(0)
        if slug == 'popes' and sub and sub in POPES: return f'href="/pope-{sub}.html"'  # each pope and each parable has its own page
        if slug == 'parables' and sub and sub in PARABLES: return f'href="/parable-{sub}.html"'
        return 'href="' + ('/' if slug == 'home' else f'/{slug}.html') + (f'#{sub}' if sub and slug in SUBS else '') + '"'
    return re.sub(r'href="#([a-z0-9-]+)(?:/([^"]*))?"', fix, s)
shell = links(shell)
HUBS_MORE = 'The library, guides to the Mass and confession, prayer, answers to hard questions, and history.'
HOME_DESC = ('Verbum Domini: a free guide to the Catholic faith in plain English. The Douay-Rheims Bible, the Catechism, '
             'the Mass, the Rosary, the saints, and answers to hard questions.')

def head(title, desc, url, img=None, ld=None):
    return (f'<title>{attr(title)}</title>\n'
            f'<meta name="description" content="{attr(desc)}">\n'
            f'<link rel="canonical" href="{url}">\n'
            f'<meta property="og:type" content="website">\n<meta property="og:site_name" content="Verbum Domini">\n'
            f'<meta property="og:title" content="{attr(title)}">\n<meta property="og:description" content="{attr(desc)}">\n'
            f'<meta property="og:url" content="{url}">\n<meta property="og:image" content="{img or SITE + "/og-image.jpg"}">\n'
            f'<meta property="og:locale" content="en_US">\n<meta name="twitter:card" content="summary_large_image">\n'
            '<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
            '<link rel="manifest" href="/site.webmanifest">\n'
            + (f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False).replace("</", "<\\/")}</script>\n' if ld else ''))

def page(title, desc, url, route=None, show='home', body='', img=None, ld=None):
    s = one(shell, '<title>Verbum Domini</title>\n', head(title, desc, url, img, ld), 'title')
    s = one(s, f'<section class="pg" data-nav="home" data-page="home" data-tab="Home" data-title="Welcome" hidden="">',
            '<section class="pg" data-nav="home" data-page="home" data-tab="Home" data-title="Welcome"' + (' hidden="">' if show != 'home' else '>'), 'home section')
    if show in ('rosary', 'saints', 'hub'):
        s, n = re.subn(r'(<section class="pg"[^>]* data-page="' + show + r'"[^>]*?) hidden="">', r'\1>', s)
        if n != 1: sys.exit(f'build-app: {show} section: expected one match, found {n}')
    if show == 'doc':
        s = one(s, '<section class="pg" data-page="doc" hidden="">', '<section class="pg" data-page="doc">', 'doc section')
        styles = ''.join(re.findall(r'<style>.*?</style>\n?', body, re.S))  # a page's own styles go in the head
        body = re.sub(r'<style>.*?</style>\n?', '', body, flags=re.S)
        s = one(s, '</head>', styles + '</head>', 'head end')
        s = one(s, '<div class="doc" id="docmain"></div>', f'<div class="doc" id="docmain">{body}</div>', 'docmain')
    return s

def crawlable(frag):
    # Links between pages are hashes in the app; in the pre-rendered copy they point at the page files.
    # Its structured data (ld+json) is left out: it names addresses the site does not have.
    frag = re.sub(r'<script type="application/ld\+json">.*?</script>', '', frag, flags=re.S)
    frag = frag.replace('hidden="until-found"', 'hidden=""')
    return links(frag)

wr('index.html', page(f'Verbum Domini · {TAGLINE}', HOME_DESC, SITE + '/'))
urls = [SITE + '/']
for slug, p in INFO.items():
    frag = crawlable(rd(f'pages/{slug}.html'))
    wr(f'{slug}.html', page(f'{p["t"]} · Verbum Domini', p['d'], f'{SITE}/{slug}.html', slug, 'doc', frag))
    urls.append(f'{SITE}/{slug}.html')
# Each pope gets his own page, /pope-<name>.html: his profile already written out (picture, facts, life, what he did, documents)
# for search engines and readers without scripts, his own title, description, picture and structured data. The app replaces
# the text with the tabbed profile. Portrait addresses carry a fingerprint of the file, so a replaced portrait is fetched again.
for p in POPES.values():
    if p.get('im'): p['iv'] = hashlib.sha256(open(os.path.join(APP, 'art', 'popes', p['im']), 'rb').read()).hexdigest()[:8]
wr('data/popes.json', json.dumps(list(POPES.values()), ensure_ascii=False, separators=(',', ':')))
MON = 'January February March April May June July August September October November December'.split()
def pdate(d):
    m = re.match(r'(c\. )?(\d+)(?:-(\d\d))?(?:-(\d\d))?$', d or '')
    if not m: return html.escape(d or '')
    return (m.group(1) or '') + ' '.join(x for x in [str(int(m.group(4))) if m.group(4) else '', MON[int(m.group(3)) - 1] if m.group(3) else '', m.group(2)] if x)
def pyr(d): return re.match(r'(?:c\. )?(\d+)', d).group(1)
def pord(n): return f'{n}' + ('th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th'))
def pspan(p): return pyr(p['a']) + (' to ' + pyr(p['b']) if p.get('b') and pyr(p['b']) != pyr(p['a']) else '' if p.get('b') else ' to today')
PL = list(POPES.values())
pcss = ''.join(re.findall(r'<style>.*?</style>\n?', rd('pages/popes.html'), re.S))
for i, p in enumerate(PL):
    E = lambda x: html.escape(x or '', quote=True)
    pre = {'S': 'St. ', 'B': 'Bl. '}.get(p.get('st'), '')
    pv, nx = (PL[i - 1] if i else None), (PL[i + 1] if i + 1 < len(PL) else None)
    src = f"/art/popes/{p['im']}?v={p['iv']}" if p.get('im') else ''
    facts = [('Pope', pdate(p['a']) + (' to ' + pdate(p['b']) if p.get('b') else ' to today')), ('Born', ', '.join(x for x in [pdate(p.get('born')), E(p.get('bp'))] if x)),
             ('Died', '' if not p.get('b') else 'Unknown' if p.get('died') == 'unknown' else pdate(p.get('died') or p['b'])), ('Secular name', E(p['bn']) if p.get('bn') and p['bn'] != p['name'] else ''), ('Motto', f"<i lang=\"la\">{E(p['mot'])}</i>" + (f" <small>({E(p['mote'])})</small>" if p.get('mote') else '') if p.get('mot') else ''), ('Buried', E(p.get('bur')))]
    docs = ''.join(f'<li><a href="{E(d["u"])}" target="_blank" rel="noopener"><b>{E(d["t"])}</b>' + (f'<span class="s">{E(d["s"])}</span>' if d.get('s') else '') + '</a></li>' for d in p.get('docs') or [])
    body = (pcss + '<div class="wrap pp-page"><article class="pp-det">'
            + '<nav class="pp-crumb" aria-label="Popes"><a href="/popes.html">← All popes</a><span>'
            + (f'<a href="/pope-{pv["s"]}.html" rel="prev">‹ {E(pv["name"])}</a>' if pv else '') + (f'<a href="/pope-{nx["s"]}.html" rel="next">{E(nx["name"])} ›</a>' if nx else '') + '</span></nav>'
            + '<header class="pp-prof"><div class="pp-id">' + (f'<div class="pp-av"><img src="{src}" alt="{E(p.get("ia") or "Portrait of " + p["name"])}" width="320" height="400"></div>' if src else '')
            + f'<div class="pp-idt"><h1>{pre}{E(p["name"])}</h1><p class="pp-kick"><span>The {pord(p["n"])} Pope</span><span>{pspan(p)}</span></p></div></div></header>'
            + f'<div class="pp-fb"><section class="pp-box"><h2 id="pp-info">About</h2><p class="pp-status">{E(p["sum"])}</p>' + (f'<p class="pp-why"><b>His gift to the Church</b>{E(p["why"])}</p>' if p.get('why') else '') + f'<dl class="pp-info">'
            + ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in facts if v) + '</dl>' + (f'<p class="pp-cred">Portrait: {p["ic"]}</p>' if p.get('ic') else '') + '</section>'
            + '<section class="pp-box"><h2 id="pp-life">Life</h2><div class="pp-bb prose">' + ''.join(f'<p>{E(t)}</p>' for t in p['bio']) + '</div></section>'
            + ('<section class="pp-box"><h2 id="pp-tl">Key moments</h2><ol class="pp-bb pp-tl">' + ''.join(f'<li><b>{pdate(d)}</b><span>{E(t)}</span></li>' for d, t in p['tl']) + '</ol></section>' if p.get('tl') else '')
            + ('<section class="pp-box"><h2 id="pp-words">In his words</h2><div class="pp-qs">' + ''.join(f'<figure class="pp-qt"><blockquote><p>{E(x["t"])}</p></blockquote><figcaption>' + (f'<a href="{E(x["u"])}" target="_blank" rel="noopener">{E(x["s"])}</a>' if x.get('u') else E(x['s'])) + '</figcaption></figure>' for x in p['q']) + '</div></section>' if p.get('q') else '')
            + ('<section class="pp-box"><h2 id="pp-dyk">Did you know?</h2><ul class="pp-dyk">' + ''.join(f'<li>{E(t)}</li>' for t in p['dyk']) + '</ul></section>' if p.get('dyk') else '')
            + ('<section class="pp-box"><h2 id="pp-acts">His legacy</h2><ul class="pp-bb pp-did">' + ''.join(f'<li>{E(t)}</li>' for t in p['did']) + '</ul></section>' if p.get('did') else '')
            + ('<section class="pp-box"><h2 id="pp-docs">Documents</h2><ol class="pp-docs">' + docs + '</ol></section>' if docs else '')
            + '</div></article></div>')
    url = f"{SITE}/pope-{p['s']}.html"
    ld = {'@context': 'https://schema.org', '@type': 'Person', 'name': f"Pope {pre}{p['name']}", 'jobTitle': 'Pope', 'description': p['sum'], 'url': url}
    if src: ld['image'] = SITE + src
    if p.get('bn') and p['bn'] != p['name']: ld['alternateName'] = p['bn']
    if p.get('bp'): ld['birthPlace'] = p['bp']
    if p.get('vat'): ld['sameAs'] = f"https://www.vatican.va/content/{p['vat']}/en.html"
    wr(f"pope-{p['s']}.html", page(f"Pope {pre}{p['name']} ({pspan(p)}) · Verbum Domini", p['sum'], url, 'popes', 'doc', body, SITE + src if src else None, ld))
    urls.append(url)

# Each parable gets its own page, /parable-<name>.html, written out as the app shows it (pbPage in app/index.html)
pfrag = rd('pages/parables.html')
pcss = ''.join(re.findall(r'<style>.*?</style>\n?', pfrag, re.S))
def text(h): return html.unescape(re.sub(r'<[^>]+>', '', h)).strip()
for sec in re.findall(r'<section class="ill-sec[^"]*" id="[^"]+">.*?</section>', pfrag, re.S):
    sid = re.search(r'id="([^"]+)"', sec).group(1)
    cat = text(re.search(r'<h2 class="ill-h">(.*?)</h2>', sec, re.S).group(1))
    fig = re.search(r'<figure[^>]*>.*?<img[^>]*src="([^"]+)".*?(?:<figcaption>(.*?)</figcaption>)?</figure>', sec, re.S)
    for d in re.findall(r'<details class="pb-item".*?</details>', sec, re.S):
        slug = re.search(r'id="([^"]+)"', d).group(1)
        name = text(re.search(r'<h3 class="pb-name">(.*?)</h3>', d, re.S).group(1))
        lesson = text(re.search(r'<span class="pb-lesson">(.*?)</span>', d, re.S).group(1))
        refs = text(re.search(r'<span class="pb-refs">(.*?)</span>', d, re.S).group(1))
        b = re.search(r'<div class="pb-body">(.*)</div></details>', d, re.S).group(1)
        b = re.sub(r'<h4 class="pb-h">(.*?)</h4>', r'<h2 class="pb-h">\1</h2>', b)
        b = re.sub(r'(<div class="pb-pn">.*?</div>)', lambda m: re.sub(r' data-a="[^"]*"', '', m.group(1)), b, flags=re.S)
        title = 'The Parable of ' + re.sub(r'^The ', 'the ', name)
        url = f'{SITE}/parable-{slug}.html'
        body = (pcss + '<div class="wrap">'
                + f'<nav aria-label="Breadcrumb" class="pb-crumb"><ol><li><a href="#parables">The Parables of Jesus</a></li><li><a data-a="{sid}" href="#parables">{html.escape(cat)}</a></li></ol></nav>'
                + '<header class="page-head painted pb-head">' + (f'<img alt="" class="ph-art" src="{fig.group(1)}"/>' if fig else '')
                + f'<div class="ph-text"><p class="label">{html.escape(cat)}</p><h1>{html.escape(title)}</h1><p>{html.escape(lesson)}</p></div>'
                + (f'<p class="ph-cap">{fig.group(2)}</p>' if fig and fig.group(2) else '') + '</header>'
                + f'<p class="pb-refs pb-page-refs">{html.escape(refs)}</p><div class="pb-body pb-page">{b}</div>'
                + f'<p class="pb-all"><a href="#parables">All {len(PARABLES)} parables of Jesus →</a></p></div>')
        ld = {'@context': 'https://schema.org', '@graph': [
            {'@type': 'Article', 'headline': title, 'description': lesson, 'url': url, 'inLanguage': 'en',
             'isPartOf': {'@type': 'CollectionPage', 'name': 'The Parables of Jesus', 'url': SITE + '/parables.html'},
             'publisher': {'@type': 'Organization', 'name': 'Verbum Domini', 'url': SITE + '/'}},
            {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
             {'@type': 'ListItem', 'position': 2, 'name': 'The Parables of Jesus', 'item': SITE + '/parables.html'},
             {'@type': 'ListItem', 'position': 3, 'name': title, 'item': url}]}]}
        img = SITE + '/' + fig.group(1).lstrip('/') if fig else None
        wr(f'parable-{slug}.html', page(f'{title} · Verbum Domini', lesson, url, 'parables', 'doc', links(body), img, ld))
        urls.append(url)

wr('rosary.html', page('The Rosary · Verbum Domini',
                       'How to pray the Rosary: the prayers, today’s mysteries with their paintings, and the Rosary prayed bead by bead.',
                       f'{SITE}/rosary.html', 'rosary', 'rosary'))
urls.append(f'{SITE}/rosary.html')
wr('saints.html', page('Saints · Verbum Domini',
                       'The saint of the day, the calendar of the saints, and the best-known saints of the Church.',
                       f'{SITE}/saints.html', 'saints', 'saints'))
urls.append(f'{SITE}/saints.html')
wr('more.html', page('More · Verbum Domini', HUBS_MORE, f'{SITE}/more.html', 'more', 'hub'))
for old, new in ALIASES.items():
    p = INFO[new]
    wr(f'{old}.html', page(f'{p["t"]} · Verbum Domini', p['d'], f'{SITE}/{new}.html', new, 'doc', crawlable(rd(f'pages/{new}.html'))))

wr('404.html', f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Page not found · Verbum Domini</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.ico" sizes="any">
<style>body{{margin:0;font:18px/1.6 Georgia,serif;background:#fbfaf7;color:#1d1b18}}main{{max-width:34rem;margin:18vh auto 0;padding:0 16px}}h1{{font-size:28px;margin:0 0 8px}}a{{color:#8a5a12}}@media (prefers-color-scheme:dark){{body{{background:#14130f;color:#ece7dc}}a{{color:#e0b25e}}}}</style>
</head>
<body>
<main><h1>Page not found</h1><p>The page you were looking for isn’t here. It may have moved when the site was redesigned.</p><p><a href="/">Go to the home page</a></p></main>
</body>
</html>
''')

today = datetime.date.today().isoformat()
wr('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
   + ''.join(f'<url><loc>{u}</loc><lastmod>{today}</lastmod></url>\n' for u in urls) + '</urlset>\n')
wr('robots.txt', f'User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n')
wr('llms.txt', f'# Verbum Domini\n\n> {HOME_DESC}\n\n## Pages\n\n'
   + ''.join(f'- [{p["t"]}]({SITE}/{s}.html): {p["d"]}\n' for s, p in INFO.items()))
wr('site.webmanifest', json.dumps({'name': 'Verbum Domini', 'short_name': 'Verbum Domini', 'start_url': '/', 'display': 'standalone',
                                   'background_color': '#fbfaf7', 'theme_color': '#fbfaf7',
                                   'icons': [{'src': '/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
                                             {'src': '/icon-512.png', 'sizes': '512x512', 'type': 'image/png'}]}, indent=1) + '\n')
# Security headers match cloudflare/worker.js. Frames: the Rosary page shows rosary/pray-the-rosary.html in a frame of this site,
# so pages may be framed by this site only.
wr('_headers', '''/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Content-Security-Policy: frame-ancestors 'self'; base-uri 'self'; object-src 'none'
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)
  Cross-Origin-Opener-Policy: same-origin

/app.js
  Cache-Control: public, max-age=31536000, immutable

/app.css
  Cache-Control: public, max-age=31536000, immutable

/sw.js
  Cache-Control: no-cache

/blob/*
  Cache-Control: public, max-age=2592000, stale-while-revalidate=604800

/art/*
  Cache-Control: public, max-age=2592000, stale-while-revalidate=604800

/fonts/*
  Cache-Control: public, max-age=2592000, stale-while-revalidate=604800

/bible/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
''')
print(f'build-app: {len(urls) + len(ALIASES) + 1} pages into {os.path.relpath(OUT)}')
