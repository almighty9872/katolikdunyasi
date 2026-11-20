"""Builds the parish portal (parishes.verbumdomini.ca) from verbumdomini/parishes-src/ into verbumdomini/_site_parishes/.

parishes-src/<name>.html are page bodies. Each starts with a header comment:
    <!--
    title: Resources
    description: One or two sentences for search results and link previews.
    nav: resources            (the rail link marked as the current page: overview, directory, resources, generator, reference, admin)
    htitle: Claim             (optional: the header title, when it is not the rail label)
    scripts: directory.js     (files in parishes-src/static/js/, loaded at the end of the page; portal.js always is)
    layout: bare              (optional: no header or footer, for embed/today.html)
    noindex: 1                (optional)
    -->
This wraps each one in the same head, the workspace shell (an icon rail on the left, a bottom bar on phones: Overview, Directory,
Resources, Print Studio, Reference, Parish Admin, verbumdomini.ca; a header with the page title, the portal search, the theme,
the notification bell and the profile menu, all run by static/js/portal.js) and footer,
and copies what the pages use from the main site, so the two stay in step:
    app/app.css (the main site's stylesheet: colour tokens, light and dark, base type; built by tools/build-app.py)
    app/fonts/, the Source Serif 4 files the main site loads, app/files/ (the PDFs), app/data/readings-ca.json
    easterMD, litDay, ROS and RDAY from app/index.html's script, as static/js/liturgy.js (the widget and the overview use them)
parishes-src/static/ is copied as is (portal.css, the page scripts, vendor/jspdf.umd.min.js for the Print & PDF studio).

Reference data for the Print & PDF studio (/generator) and the admin's quick reference, in data/ (built here, never edited by hand):
    saints-index.json     app/pages/saints.html: name, feast month and day (or days from Easter), rank, title, patronage, a short biography, a painting
    prayers-index.json    app/pages/common-prayers.html, the Rosary prayers (app/rosary/data/tespih.js) and the examination of conscience of app/pages/confession.html
    art-index.json        the public-domain paintings of the main site (captions in app/pages/*.html and app/index.html, the Rosary's art list), copied to art/
    reference-index.json  parishes-src/reference.json: Canon Law and Catechism numbers, topics and our own summaries, with links to vatican.va.
                          Never the text of the Code or the Catechism (their English translations are copyrighted).
    readings-ca.json      the Canadian lectionary references by date; bible/<book>.json, the Douay-Rheims text (public domain), for the passages

Usage (from verbumdomini/ or the repo root): python3 verbumdomini/tools/parishes.py
Run tools/build-app.py first in a fresh checkout: it builds app/app.css. Deploy: cloudflare/parishes.jsonc.
"""
import hashlib, html, json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP, SRC, OUT = os.path.join(ROOT, 'app'), os.path.join(ROOT, 'parishes-src'), os.path.join(ROOT, '_site_parishes')
SITE = 'https://parishes.verbumdomini.ca'
# The rail: (key, address, label, icon paths on a 24-unit grid, stroked)
NAV = [('overview', '/', 'Overview', '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>'),
       ('directory', '/directory', 'Directory', '<path d="M12 2.5v4M10 4.5h4"/><path d="M5 21V11.5l7-4.5 7 4.5V21"/><path d="M3 21h18"/><path d="M10 21v-3.5a2 2 0 0 1 4 0V21"/>'),
       ('resources', '/resources', 'Resources', '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h7M9 11.5h5"/>'),
       ('generator', '/generator', 'Print Studio', '<path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="9" rx="2.5"/><path d="M7 14h10v7H7z"/><path d="M17.5 11.5h.01"/>'),
       ('reference', '/reference', 'Reference', '<path d="M12 4v17M7 21h10M5 7.5h14"/><path d="M7.5 7.5 4.5 14a3 3 0 0 0 6 0zM16.5 7.5l-3 6.5a3 3 0 0 0 6 0z"/><circle cx="12" cy="4" r="1"/>'),
       ('admin', '/admin', 'Parish Admin', '<path d="M12 3 20 6v6c0 4.6-3.3 8-8 9-4.7-1-8-4.4-8-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>')]
CLEAN = {'index': '/', 'resources': '/resources', 'directory': '/directory', 'generator': '/generator', 'reference': '/reference', 'claim': '/claim', 'admin': '/admin'}
def icon(paths, cls='pp-ic'): return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths}</svg>'


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


# ---------- reference data (data/*-index.json) ----------
def plain(h):
    h = re.sub(r'<br\s*/?>', '\n', h)
    h = re.sub(r'</p>\s*<p[^>]*>', '\n\n', h)
    return html.unescape(re.sub(r'<[^>]+>', '', h)).strip()
def jdump(name, data):
    wr('data/' + name, json.dumps(data, ensure_ascii=False, separators=(',', ':')))

# Paintings: the captioned <img> of the pages ("Artist · <cite>Title</cite>" or data-by/data-t) and the Rosary's list
SEASON_TAGS = [  # (tag, words in the title)
    ('Advent', r'annunc|visitation|isaiah|john the baptist|immaculate'), ('Christmas', r'nativ|adoration of the (magi|shepherds)|magi|shepherd|holy family|presentation|flight into egypt|epiphany|madonna and child|virgin and child'),
    ('Lent', r'agony|flagell|thorns|ecce homo|carrying|cross|crucif|calvary|deposition|entomb|piet|lament|passion|prodigal|temptation|penit|magdalen'),
    ('Holy Week', r'last supper|washing|entry into jerusalem|crucif|deposition|entomb|calvary|passion'),
    ('Easter', r'resurrect|risen|ascension|pentecost|emmaus|thomas|noli me tangere|tomb|holy spirit'),
    ('Marian', r'mary|madonna|virgin|annunc|assumption|coronation|immaculate|our lady|visitation'),
    ('Saints', r'saint|st\.|apostle|martyr|francis|jerome|augustine|peter|paul|joseph|teresa|catherine|benedict|patrick|anthony|thomas aquinas'),
    ('Eucharist', r'supper|eucharist|mass|bolsena|lamb|bread'), ('Baptism', r'baptism|baptis'), ('Marriage', r'cana|wedding|marriage|betrothal'),
    ('Funeral', r'lazarus|lament|entomb|piet|deposition|last judgement|resurrect|death of')]
MYST = {}
tespih = rd(os.path.join(APP, 'rosary', 'data', 'tespih.js'))
R = json.loads(tespih[tespih.index('{', tespih.rindex('*/')):tespih.rindex(';')])
for st in R['sets']:
    for it in st['items']:
        if it.get('art'): MYST.setdefault(it['art'], []).append((st['en'].replace('The ', '').replace(' Mysteries', ''), it['en']))
art, seen = [], set()
def add_art(src, title, artist, extra=()):
    src = src.split('?')[0]
    # Paintings only: not the maps of the history timeline (art/tl/) or the portraits of popes and Church Fathers
    if not src.startswith('art/') or src.startswith(('art/tl/', 'art/popes/', 'art/fathers/')) or src in seen or not os.path.isfile(os.path.join(APP, src)) or not title: return
    seen.add(src)
    t = title.lower()
    tags = [k for k, rx in SEASON_TAGS if re.search(rx, t)] + list(extra)
    if not any(x in tags for x in ('Advent', 'Christmas', 'Lent', 'Holy Week', 'Easter')): tags.append('Ordinary Time')
    art.append({'id': os.path.basename(src)[:-4], 'title': html.unescape(title), 'artist': html.unescape(artist or ''), 'img': '/' + src, 'tags': sorted(set(tags))})
for k, a in R['art'].items():
    f = re.sub(r'^(\.\./)+', '', a['f'])
    extra = [m for m, _ in MYST.get(k, [])] + ['Rosary'] if k in MYST else []
    add_art(f, a.get('te') or (MYST.get(k) or [('', '')])[0][1], a.get('ae') or a.get('a'), extra)
for f in sorted([os.path.join(APP, 'index.html')] + [os.path.join(APP, 'pages', x) for x in os.listdir(os.path.join(APP, 'pages')) if x.endswith('.html')]):
    t = rd(f)
    for m in re.finditer(r'<img([^>]*?)src="((?:\.\./)?art/[^"]+\.jpg)"([^>]*)>(?:\s*<figcaption>([^<]*?)\s*·\s*<cite>([^<]*)</cite>)?', t):
        attrs = m.group(1) + m.group(3)
        by, ti = re.search(r'data-by="([^"]*)"', attrs), re.search(r'data-t="([^"]*)"', attrs)
        add_art(m.group(2).lstrip('./'), m.group(5) or (ti and ti.group(1)) or '', m.group(4) or (by and by.group(1)) or '')
os.makedirs(os.path.join(OUT, 'art'))
for a in art:
    os.makedirs(os.path.dirname(os.path.join(OUT, a['img'][1:])), exist_ok=True)
    shutil.copy(os.path.join(APP, a['img'][1:]), os.path.join(OUT, a['img'][1:]))
art.sort(key=lambda a: a['title'])
jdump('art-index.json', art)

# Saints: one entry per saint of the fixed calendar, and the movable days (counted from Easter)
src = rd(os.path.join(APP, 'pages', 'saints.html'))
saints = []
def patrons(bio):
    out = []
    for m in re.finditer(r'patron(?: saint)? of ([^.;:()]+)', bio):
        for x in re.split(r',\s*(?:and\s+)?|\s+and\s+', m.group(1)):
            x = re.sub(r'^(the|all)\s+', '', x.strip())
            if 2 < len(x) < 50 and x not in out: out.append(x)
    return out[:8]
def art_for(name):
    n = re.sub(r'^(Saint|Saints|St\.?)\s+', '', name).split(',')[0].split(' and ')[0].strip().lower()
    for a in art:
        if len(n) > 3 and n in a['title'].lower(): return a['img']
    return ''
for cell in re.finditer(r'<div class="day-cell ([^"]*)" data-d="(\d+)" data-m="(\d+)"[^>]*>(.*?)</div></div>\s*(?=<div class="day-cell|</div>)', src, re.S):
    rank = re.search(r'class="day-rank label">([^<]*)<', cell.group(4))
    for it in re.finditer(r'<span class="s-name">(.*?)</span>(?:<span class="s-title">(.*?)</span>)?</summary><div class="saint-bio">(.*?)</div></details>', cell.group(4), re.S):
        bio = plain(re.sub(r'<p class="s-links">.*?</p>', '', it.group(3), flags=re.S))
        name = plain(it.group(1))
        saints.append({'name': name, 'title': plain(it.group(2) or ''), 'month': int(cell.group(3)), 'day': int(cell.group(2)),
                       'rank': plain(rank.group(1)) if rank else 'Optional Memorial', 'patronage': patrons(bio), 'bio': bio[:900], 'img': art_for(name)})
for m in re.finditer(r'<article class="movable-card" data-movable="[^"]*" data-offset="(-?\d+)"[^>]*><h3>(.*?)</h3><p class="m-rank label">(.*?)<span.*?<div class="m-bio">(.*?)</div></article>', src, re.S):
    bio = plain(m.group(4))
    saints.append({'name': plain(m.group(2)), 'title': '', 'easter': int(m.group(1)), 'rank': plain(m.group(3)), 'patronage': patrons(bio), 'bio': bio[:900], 'img': art_for(plain(m.group(2)))})
if len(saints) < 300: sys.exit(f'parishes: only {len(saints)} saints found in app/pages/saints.html; its markup changed')
jdump('saints-index.json', saints)

# Prayers: the Common Prayers page by section, the Rosary prayers, the examination of conscience by commandment
prayers, titles = [], set()
src = rd(os.path.join(APP, 'pages', 'common-prayers.html'))
for sec in re.finditer(r'<h2 class="section-title"[^>]*>(.*?)</h2>(.*?)(?=<h2 class="section-title"|$)', src, re.S):
    for a in re.finditer(r'<article class="text-card" id="x-([a-z0-9-]+)"><h3 class="t-title">(.*?)</h3><div class="verse">(.*?)</div>', sec.group(2), re.S):
        t = plain(a.group(2)); titles.add(t.lower())
        prayers.append({'id': a.group(1), 'title': t, 'category': plain(sec.group(1)), 'text': plain(a.group(3))})
for x in R['prayers']:
    t = x['en']['title']
    # The same prayer under a shorter name ("Glory Be" is "Glory be to the Father")
    if any(y.replace('the ', '').startswith(t.lower().replace('the ', '')) for y in titles): continue
    titles.add(t.lower())
    prayers.append({'id': 'rosary-' + x['id'], 'title': t, 'category': 'The Rosary', 'text': x['en']['text']})
src = rd(os.path.join(APP, 'pages', 'confession.html'))
for a in re.finditer(r'<article[^>]*id="x-emir-(\d+)"[^>]*>\s*<h3 class="cfb-t">(.*?)</h3>.*?<ol class="cfb-qs">(.*?)</ol>', src, re.S):
    prayers.append({'id': 'examination-' + a.group(1), 'title': 'Examination of conscience: ' + plain(a.group(2)), 'category': 'Examination of conscience',
                    'commandment': int(a.group(1)), 'text': '', 'points': [plain(li) for li in re.findall(r'<li>(.*?)</li>', a.group(3), re.S)]})
if not any(p['category'] == 'Examination of conscience' for p in prayers) or len(prayers) < 30: sys.exit('parishes: prayers or examination of conscience not found; the markup of common-prayers.html or confession.html changed')
jdump('prayers-index.json', prayers)

# Canon Law and Catechism: numbers, topics and our summaries, with the official pages on vatican.va
LINK = {'CIC': 'https://www.vatican.va/archive/cod-iuris-canonici/cic_index_en.html', 'CCC': 'https://www.vatican.va/content/catechism/en.html'}
NAME = {'CIC': 'Code of Canon Law (1983)', 'CCC': 'Catechism of the Catholic Church'}
ref = json.loads(rd(os.path.join(SRC, 'reference.json')))['items']
for r in ref:
    r['ref'] = (('can. ' if r['from'] == r['to'] else 'cann. ') if r['src'] == 'CIC' else ('CCC ' if r['from'] == r['to'] else 'CCC ')) + (str(r['from']) if r['from'] == r['to'] else f"{r['from']}–{r['to']}")
    r['source'], r['url'] = NAME[r['src']], LINK[r['src']]
jdump('reference-index.json', {'note': 'Summaries in plain English by Verbum Domini for Parishes, for office use. They are not the text of the Code of Canon Law or the Catechism of the Catholic Church: read the official text on vatican.va (© Libreria Editrice Vaticana).',
                               'sources': [{'id': k, 'name': NAME[k], 'url': LINK[k]} for k in LINK], 'items': ref})

# The Bible books the readings point to (Douay-Rheims, public domain), and the list of them
books = json.loads(rd(os.path.join(APP, 'bible', 'index.json')))
os.makedirs(os.path.join(OUT, 'bible'))
for b in books:
    f = os.path.join(APP, 'bible', b['s'] + '.json')
    if os.path.isfile(f): shutil.copy(f, os.path.join(OUT, 'bible', b['s'] + '.json'))
jdump('bible-books.json', [{'s': b['s'], 't': b['t']} for b in books if os.path.isfile(os.path.join(APP, 'bible', b['s'] + '.json'))])

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
    base = ['js/portal.js'] if meta.get('layout') == 'bare' else ['js/sched.js', 'js/portal.js']   # sched.js: the bell's holy days
    scripts = base + ['js/' + s.strip() for s in meta.get('scripts', '').split(',') if s.strip() and 'js/' + s.strip() not in base]
    for s in scripts:
        if not os.path.isfile(os.path.join(OUT, s)): sys.exit(f'parishes: {name}: script {s} not found')
    full = title if title.startswith('Verbum Domini') else f'{title} · Verbum Domini for Parishes'
    head = (f'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'
            f'<title>{html.escape(full)}</title>\n<meta name="description" content="{attr(desc)}">\n'
            + ('<meta name="robots" content="noindex">\n' if meta.get('noindex') else '' if meta.get('nocanonical') else f'<link rel="canonical" href="{url}">\n')
            + f'<meta property="og:title" content="{attr(full)}">\n<meta property="og:description" content="{attr(desc)}">\n'
            f'<meta property="og:image" content="{SITE}/og-image.jpg">\n<meta property="og:type" content="website">\n'
            '<meta name="theme-color" content="#eeebe5" media="(prefers-color-scheme: light)">\n<meta name="theme-color" content="#101216" media="(prefers-color-scheme: dark)">\n'
            '<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
            f'<link rel="stylesheet" href="/app.css?v={V["app.css"]}">\n<link rel="stylesheet" href="/portal.css?v={V["portal.css"]}">\n'
            f'<script src="{asset("js/theme.js")}"></script>\n</head>\n')
    tail = ''.join(f'<script src="{asset(s)}"></script>\n' for s in scripts)
    if meta.get('layout') == 'bare':
        return head + f'<body class="pp pp-bare">\n{body}{tail}</body>\n</html>\n'
    cur = meta.get('nav', '')
    label = meta.get('htitle') or next((t for k, h, t, _ in NAV if k == cur), title)
    rail = ''.join(f'<a class="pp-rl" href="{h}"' + (' aria-current="page"' if k == cur else '') + f'>{icon(i)}<span class="pp-tip">{t}</span></a>' for k, h, t, i in NAV)
    top = ('<a class="pp-skip" href="#main">Skip to content</a>\n'
           '<nav class="pp-rail" aria-label="Portal"><a class="pp-logo" href="/" title="Verbum Domini for Parishes"><span class="pp-mark" aria-hidden="true"></span><span class="pp-vh">Verbum Domini for Parishes</span></a>'
           f'<div class="pp-rls">{rail}</div>'
           '<a class="pp-rl pp-home" href="https://verbumdomini.ca/">' + icon('<path d="M10 17l-5-5 5-5"/><path d="M5 12h10a4 4 0 0 1 4 4v4"/>') + '<span class="pp-tip">verbumdomini.ca</span></a></nav>\n'
           '<div class="pp-shell">\n<header class="pp-hdr">'
           f'<p class="pp-htitle"><span class="pp-mark" aria-hidden="true"></span>{html.escape(label)}</p>'
           '<form class="pp-search" role="search" action="/directory" autocomplete="off"><label class="pp-vh" for="pp-q">Search the portal</label>'
           + icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>') +
           '<input id="pp-q" name="q" type="search" placeholder="Search parishes, resources or canons" role="combobox" aria-expanded="false" aria-controls="pp-qr" aria-autocomplete="list">'
           '<kbd aria-hidden="true">⌘K</kbd><div class="pp-qr" id="pp-qr" role="listbox" aria-label="Results" hidden></div></form>'
           '<div class="pp-tools">'
           '<button class="pp-ib pp-theme" type="button" aria-label="Colour theme: system" title="Colour theme">'
           + icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 'pp-ic i-sun')
           + icon('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', 'pp-ic i-moon') + '</button>'
           '<div class="pp-pw"><button class="pp-ib pp-bell" id="pp-bell" type="button" aria-expanded="false" aria-controls="pp-notes" aria-label="Notifications">'
           + icon('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>') + '<span class="pp-dot" id="pp-bell-n" hidden></span></button>'
           '<div class="pp-pop" id="pp-notes" hidden><p class="pp-pop-h">Coming up</p><ul id="pp-notes-l"><li class="pp-mut">Loading…</li></ul></div></div>'
           '<div class="pp-pw"><button class="pp-me" id="pp-me" type="button" aria-expanded="false" aria-controls="pp-menu">'
           '<span class="pp-av" id="pp-av" aria-hidden="true">VD</span><span class="pp-me-t"><b id="pp-me-n">Parish staff</b><small id="pp-me-s">Sign in or claim a parish</small></span>'
           + icon('<path d="m6 9 6 6 6-6"/>', 'pp-ic pp-chev') + '</button>'
           '<div class="pp-pop pp-menu" id="pp-menu" hidden><a href="/claim?login=1">Sign in</a><a href="/claim">Claim your parish</a><a href="https://verbumdomini.ca/">verbumdomini.ca</a></div></div>'
           '</div></header>\n')
    foot = ('<footer class="pp-ft"><nav aria-label="Footer">' + ''.join(f'<a href="{h}">{t}</a>' for k, h, t, _ in NAV) +
            '<a href="https://verbumdomini.ca/">verbumdomini.ca</a><a href="https://verbumdomini.ca/contact.html">Contact</a>'
            '<a href="https://verbumdomini.ca/privacy.html">Privacy</a></nav>'
            '<p>Verbum Domini for Parishes is free. Parish listings come from the Archdiocese of Toronto’s public directory and are kept up to date by the parishes themselves.</p>'
            '</footer>\n')
    return head + f'<body class="pp">\n{top}<main id="main" class="pp-main {attr(meta.get("main", ""))}">\n{body}</main>\n{foot}</div>\n{tail}</body>\n</html>\n'


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
   + ''.join(f'<url><loc>{SITE}{CLEAN[n]}</loc></url>\n' for n in ('index', 'resources', 'directory', 'generator', 'reference')) + '</urlset>\n')
# Headers for the files Cloudflare serves directly (parishes-worker.js sends the same with what it answers).
# Pages may be framed by this site only; the widget in embed/ by any site, which is its purpose.
CSP = ("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; "
       "frame-src 'self' https://www.openstreetmap.org; form-action 'self'; base-uri 'none'; object-src 'none'")
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

/bible/*
  Cache-Control: public, max-age=604800, stale-while-revalidate=604800

/art/*
  Cache-Control: public, max-age=2592000, stale-while-revalidate=604800

/vendor/*
  Cache-Control: public, max-age=2592000, stale-while-revalidate=604800
''')
print(f'parishes: {len(names) + 1} pages into {os.path.relpath(OUT)}')
