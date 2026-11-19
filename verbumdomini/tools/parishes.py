"""Builds the parish portal (parishes.verbumdomini.ca) from verbumdomini/parishes-src/ into verbumdomini/_site_parishes/.

parishes-src/<name>.html are page bodies. Each starts with a header comment:
    <!--
    title: Resources
    description: One or two sentences for search results and link previews.
    nav: resources            (the header link marked as the current page: overview, resources, directory, admin)
    scripts: directory.js     (files in parishes-src/static/js/, loaded at the end of the page; portal.js always is)
    layout: bare              (optional: no header or footer, for embed/today.html)
    noindex: 1                (optional)
    -->
This wraps each one in the same head, header (Overview, Resources, Directory, Parish Admin, ← Verbum Domini) and footer,
and copies what the pages use from the main site, so the two stay in step:
    app/app.css (the main site's stylesheet: colour tokens, light and dark, base type; built by tools/build-app.py)
    app/fonts/, the Source Serif 4 files the main site loads, app/files/ (the PDFs), app/data/readings-ca.json
    easterMD, litDay, ROS and RDAY from app/index.html's script, as static/js/liturgy.js (the widget and the overview use them)
parishes-src/static/ is copied as is (portal.css and the page scripts).

Usage (from verbumdomini/ or the repo root): python3 verbumdomini/tools/parishes.py
Run tools/build-app.py first in a fresh checkout: it builds app/app.css. Deploy: cloudflare/parishes.jsonc.
"""
import hashlib, html, json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP, SRC, OUT = os.path.join(ROOT, 'app'), os.path.join(ROOT, 'parishes-src'), os.path.join(ROOT, '_site_parishes')
SITE = 'https://parishes.verbumdomini.ca'
NAV = [('overview', '/', 'Overview'), ('resources', '/resources', 'Resources'), ('directory', '/directory', 'Directory'), ('admin', '/admin', 'Parish Admin')]
CLEAN = {'index': '/', 'resources': '/resources', 'directory': '/directory', 'claim': '/claim', 'admin': '/admin'}


def rd(p): return open(p, encoding='utf-8').read()
def wr(p, s):
    p = os.path.join(OUT, p); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8', newline='\n').write(s)
def attr(s): return html.escape(s, quote=True)
def ver(p): return hashlib.sha256(open(os.path.join(OUT, p), 'rb').read()).hexdigest()[:10]

# The main site's stylesheet: build it with the pinned Tailwind if this checkout has none yet
css = os.path.join(APP, 'app.css')
if not os.path.isfile(css):
    tw = os.path.join(ROOT, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs')
    if not os.path.isfile(tw): sys.exit('parishes: app/app.css is missing and Tailwind is not installed; run: npm ci --prefix verbumdomini')
    r = subprocess.run(['node', tw, '-i', 'app.tw.css', '-o', css, '--minify'], cwd=os.path.join(APP, 'src'), capture_output=True, text=True)
    if r.returncode or not os.path.isfile(css): sys.exit('parishes: Tailwind failed:\n' + r.stderr)

if os.path.isdir(OUT): shutil.rmtree(OUT)
shutil.copytree(os.path.join(SRC, 'static'), OUT)
shutil.copy(css, os.path.join(OUT, 'app.css'))
shutil.copytree(os.path.join(APP, 'fonts'), os.path.join(OUT, 'fonts'))
shutil.copytree(os.path.join(APP, 'files'), os.path.join(OUT, 'files'), ignore=shutil.ignore_patterns('*.epub', '*.azw3', '*.txt', 'the-confessions-*'))
os.makedirs(os.path.join(OUT, 'data'))
shutil.copy(os.path.join(APP, 'data', 'readings-ca.json'), os.path.join(OUT, 'data', 'readings-ca.json'))
for f in ('favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'og-image.jpg'): shutil.copy(os.path.join(APP, f), os.path.join(OUT, f))

shell = rd(os.path.join(APP, 'index.html'))
# Source Serif 4, the main site's serif: the Latin files and their @font-face rules, renamed into fonts/
faces = []
for style, weight, blob in re.findall(r"@font-face \{font-family: 'Source Serif 4';font-style: (\w+);font-weight: (\d+);font-display: swap;src: url\(/blob/([0-9a-f]+)\.woff2\) format\('woff2'\);unicode-range: U\+0000-00FF[^}]*\}", shell):
    name = f'source-serif-4-{style}-{blob[:8]}.woff2'
    shutil.copy(os.path.join(APP, 'blob', blob + '.woff2'), os.path.join(OUT, 'fonts', name))
    faces.append(f'@font-face{{font-family:"Source Serif 4";font-style:{style};font-weight:{weight};font-display:swap;src:url(/fonts/{name}) format("woff2")}}')
if len(faces) < 3: sys.exit('parishes: Source Serif 4 faces not found in app/index.html')
wr('portal.css', '\n'.join(faces) + '\n' + rd(os.path.join(OUT, 'portal.css')))

# The liturgical calendar of the main site's script, word for word, so the widget always agrees with verbumdomini.ca
def grab(pat, label):
    m = re.search(pat, shell, re.S)
    if not m: sys.exit(f'parishes: {label} not found in app/index.html')
    return m.group(0)
lit = '\n'.join([grab(r"  var WD=\[[^\]]*\];\n", 'WD'), grab(r"  function ord\(n\)\{[^\n]*\n", 'ord'),
                 grab(r"  function easterMD\(y\)\{.*?\n.*?\}\}\n", 'easterMD'), grab(r"  function litDay\(now\)\{.*?\n  \}\n", 'litDay'),
                 grab(r"  var ROS=\{.*?\]\]\}\};\n", 'ROS'), grab(r"  var RDAY='[A-Z]+';\n", 'RDAY')])
wr('js/liturgy.js', '/* From app/index.html (verbumdomini.ca), copied by tools/parishes.py: the liturgical day, the season colour\n'
   '   and the Rosary mysteries of each day. Edit them there, not here. */\nwindow.VDLit=(function(){\n' + lit +
   '  return {WD:WD,ord:ord,easterMD:easterMD,litDay:litDay,ROS:ROS,RDAY:RDAY};\n})();\n')

V = {p: ver(p) for p in ('app.css', 'portal.css')}
def asset(p): return f'/{p}?v={ver(p)}'


def page(name, src):
    m = re.match(r'<!--\n(.*?)\n-->\n', src, re.S)
    if not m: sys.exit(f'parishes: {name}: header comment missing')
    meta = dict(l.split(': ', 1) for l in m.group(1).splitlines() if ': ' in l)
    body = src[m.end():]
    # {{size:<file>}}: the size of a file in app/files/, as the handouts table shows it
    def size(mm):
        n = os.path.getsize(os.path.join(APP, 'files', mm.group(1)))
        return f'{n / 1048576:.1f} MB' if n >= 1048576 else f'{max(1, round(n / 1024))} KB'
    body = re.sub(r'\{\{size:([a-z0-9.-]+)\}\}', size, body)
    title, desc = meta['title'], meta['description']
    url = SITE + CLEAN.get(name, '/' + name.replace('.html', ''))
    scripts = ['js/portal.js'] + ['js/' + s.strip() for s in meta.get('scripts', '').split(',') if s.strip()]
    for s in scripts:
        if not os.path.isfile(os.path.join(OUT, s)): sys.exit(f'parishes: {name}: script {s} not found')
    full = title if title.startswith('Verbum Domini') else f'{title} · Verbum Domini for Parishes'
    head = (f'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'
            f'<title>{html.escape(full)}</title>\n<meta name="description" content="{attr(desc)}">\n'
            + ('<meta name="robots" content="noindex">\n' if meta.get('noindex') else '' if meta.get('nocanonical') else f'<link rel="canonical" href="{url}">\n')
            + f'<meta property="og:title" content="{attr(full)}">\n<meta property="og:description" content="{attr(desc)}">\n'
            f'<meta property="og:image" content="{SITE}/og-image.jpg">\n<meta property="og:type" content="website">\n'
            '<meta name="theme-color" content="#e6e2da" media="(prefers-color-scheme: light)">\n<meta name="theme-color" content="#101216" media="(prefers-color-scheme: dark)">\n'
            '<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
            f'<link rel="stylesheet" href="/app.css?v={V["app.css"]}">\n<link rel="stylesheet" href="/portal.css?v={V["portal.css"]}">\n'
            f'<script src="{asset("js/theme.js")}"></script>\n</head>\n')
    tail = ''.join(f'<script src="{asset(s)}"></script>\n' for s in scripts)
    if meta.get('layout') == 'bare':
        return head + f'<body class="pp pp-bare">\n{body}{tail}</body>\n</html>\n'
    cur = meta.get('nav', '')
    nav = ''.join(f'<a href="{h}"' + (' aria-current="page"' if k == cur else '') + f'>{t}</a>' for k, h, t in NAV)
    top = ('<a class="pp-skip" href="#main">Skip to content</a>\n<header class="pp-top"><div class="pp-in">'
           '<a class="pp-brand" href="/"><span class="pp-mark" aria-hidden="true"></span><span>Verbum Domini</span><small>for Parishes</small></a>'
           f'<nav class="pp-nav" aria-label="Portal">{nav}<a class="pp-home" href="https://verbumdomini.ca/">← Verbum Domini</a></nav>'
           '<button class="pp-theme" type="button" aria-label="Colour theme: system" title="Colour theme"><span aria-hidden="true"></span></button>'
           '</div></header>\n')
    foot = ('<footer class="pp-ft"><div class="pp-in"><nav aria-label="Footer">' + nav.replace(' aria-current="page"', '') +
            '<a href="https://verbumdomini.ca/">verbumdomini.ca</a><a href="https://verbumdomini.ca/contact.html">Contact</a>'
            '<a href="https://verbumdomini.ca/privacy.html">Privacy</a></nav>'
            '<p>Verbum Domini for Parishes is free. Parish listings come from the Archdiocese of Toronto’s public directory and are kept up to date by the parishes themselves.</p>'
            '</div></footer>\n')
    return head + f'<body class="pp">\n{top}<main id="main" class="pp-main {attr(meta.get("main", ""))}">\n{body}</main>\n{foot}{tail}</body>\n</html>\n'


names = []
for dirpath, _, files in os.walk(SRC):
    if os.path.relpath(dirpath, SRC).startswith('static'): continue
    for f in sorted(files):
        if not f.endswith('.html'): continue
        rel = os.path.relpath(os.path.join(dirpath, f), SRC)
        name = rel[:-5].replace(os.sep, '/')
        wr(rel, page(name, rd(os.path.join(SRC, rel))))
        names.append(name)

wr('404.html', page('404', '<!--\ntitle: Page not found\ndescription: This address has no page.\nnoindex: 1\n-->\n'
   '<div class="pp-narrow"><h1>Page not found</h1><p class="pp-lede">This address has no page. A parish may have a new address in the directory.</p>'
   '<p><a class="btn p" href="/directory">Open the directory</a> <a class="btn" href="/">Overview</a></p></div>\n'))
wr('robots.txt', f'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /claim\nDisallow: /api/\n\nSitemap: {SITE}/sitemap.xml\n')
wr('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
   + ''.join(f'<url><loc>{SITE}{CLEAN[n]}</loc></url>\n' for n in ('index', 'resources', 'directory')) + '</urlset>\n')
# Headers for the files Cloudflare serves directly (parishes-worker.js sends the same with what it answers).
# Pages may be framed by this site only; the widget in embed/ by any site, which is its purpose.
CSP = ("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; "
       "frame-src 'self'; form-action 'self'; base-uri 'none'; object-src 'none'")
wr('_headers', f'''/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Content-Security-Policy: {CSP}; frame-ancestors 'self'
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()

/embed/*
  ! X-Frame-Options
  ! Content-Security-Policy
  Content-Security-Policy: {CSP}; frame-ancestors *
  Cache-Control: public, max-age=3600

/app.css
  Cache-Control: public, max-age=31536000, immutable

/portal.css
  Cache-Control: public, max-age=31536000, immutable

/js/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=2592000, stale-while-revalidate=604800

/data/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400
''')
print(f'parishes: {len(names) + 1} pages into {os.path.relpath(OUT)}')
