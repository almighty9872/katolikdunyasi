"""Builds verbumdomini.ca from verbumdomini/app/ into verbumdomini/_site_en/.

app/ is a single-page app: index.html loads each page (pages/<slug>.html) when the address is
/<slug>.html (a place inside a page follows as a hash, /holy-bible.html#genesis/1). Every page also
gets a real file, <slug>.html: the same shell with that page's title, description and canonical
address, and the page's text already in place, so search engines read it and reloads work. The app
writes its links as #<slug>; here they become /<slug>.html, and the app opens either in place.

Usage (from the repo root): python3 verbumdomini/tools/build-app.py
"""
import datetime, hashlib, html, json, os, re, shutil, sys

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
SUBS = {'holy-bible', 'parables', 'popes'}  # pages with places inside them (BIB, PBC and the popes in app/index.html)

def links(s):
    # href="#<slug>[/<place>]" -> "/<slug>.html[#<place>]" (the home page is "/")
    def fix(m):
        slug, sub = m.group(1), m.group(2)
        if slug not in ROUTES: return m.group(0)
        return 'href="' + ('/' if slug == 'home' else f'/{slug}.html') + (f'#{sub}' if sub and slug in SUBS else '') + '"'
    return re.sub(r'href="#([a-z0-9-]+)(?:/([^"]*))?"', fix, s)
shell = links(shell)
HUBS_MORE = 'The library, guides to the Mass and confession, prayer, answers to hard questions, and history.'
HOME_DESC = ('Verbum Domini: a free guide to the Catholic faith in plain English. The Douay-Rheims Bible, the Catechism, '
             'the Mass, the Rosary, the saints, and answers to hard questions.')

def head(title, desc, url):
    return (f'<title>{attr(title)}</title>\n'
            f'<meta name="description" content="{attr(desc)}">\n'
            f'<link rel="canonical" href="{url}">\n'
            f'<meta property="og:type" content="website">\n<meta property="og:site_name" content="Verbum Domini">\n'
            f'<meta property="og:title" content="{attr(title)}">\n<meta property="og:description" content="{attr(desc)}">\n'
            f'<meta property="og:url" content="{url}">\n<meta property="og:image" content="{SITE}/og-image.jpg">\n'
            f'<meta property="og:locale" content="en_US">\n<meta name="twitter:card" content="summary_large_image">\n'
            '<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
            '<link rel="manifest" href="/site.webmanifest">\n')

def page(title, desc, url, route=None, show='home', body=''):
    s = one(shell, '<title>Verbum Domini</title>\n', head(title, desc, url), 'title')
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
