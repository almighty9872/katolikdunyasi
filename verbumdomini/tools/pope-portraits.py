"""Portraits for the popes' pages of verbumdomini.ca, public domain only, found through Europeana (europeana.eu), mostly prints
in the Rijksmuseum. For each pope in app/data/popes.json it searches titles such as "Portret van paus Innocentius X", keeps only
images marked public domain (Public Domain Mark or CC0) whose title names that pope with the same number, saves a 320px wide copy
as app/art/popes/<s>.jpg (cropped around the face, 320 by 400; an image with no clear, large face is passed over), and writes into popes.json: im (the file name) and ic (the credit shown under the pope's facts: the collection that holds it, and a link to it on Europeana; catalogues name artists too unreliably to repeat them).
A pope with no match keeps his ordinal in the picture frame. Popes that already have im are skipped; pass --all to redo them,
or name slugs to redo only those (e.g. leo-xiii pius-x). Then run python3 verbumdomini/tools/popes.py and build as usual.

With --commons it uses Wikimedia Commons instead: the image Wikidata gives each pope (for most, his mosaic medallion in
St. Paul Outside the Walls), public domain or CC0, credited "Wikimedia Commons"; with --cc also CC BY and CC BY-SA files, credited
with the author and licence. A pope whose Wikidata image is missing or refused is looked up by file title on Commons ("Pope Leo VII"),
and such a file is kept only when a face is found in it. Wikimedia refuses requests from the cloud
environment these pages are edited in, so that mode runs in GitHub Actions (.github/workflows/pope-portraits.yml).

Europeana's public demo key is used unless EUROPEANA_KEY is set; WIKIMEDIA_UA sets the user agent sent to Wikimedia.
Needs Pillow and opencv-python-headless<5.
Usage (from the repo root): python3 verbumdomini/tools/pope-portraits.py [--commons] [--all | <slug> ...]
"""
import hashlib, html, io, json, os, re, sys, time, urllib.parse, urllib.request
from PIL import Image
import cv2, numpy as np
FACE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
ALT = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml')
EYE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
APP = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app')
SRC = APP + '/data/popes.json'
OUT = APP + '/art/popes'
KEY = os.environ.get('EUROPEANA_KEY', 'api2demo')
UA = os.environ.get('WIKIMEDIA_UA') or 'vd-pope-portraits/1.0 (static site build)'
# The English name in popes.json, and the Latin or Dutch forms catalogues use
LAT = {'Peter': 'Petrus', 'Clement': 'Clemens|Clement', 'Callixtus': 'Calixtus|Callistus|Callixtus', 'Urban': 'Urbanus|Urbaan|Urban', 'Stephen': 'Stephanus|Stefanus|Stephen',
       'Innocent': 'Innocentius|Innocent', 'Boniface': 'Bonifatius|Bonifacius|Boniface', 'Celestine': 'Celestinus|Coelestinus|Celestine', 'John': 'Johannes|Joannes|John',
       'Gregory': 'Gregorius|Gregory', 'Theodore': 'Theodorus', 'Martin': 'Martinus|Martin', 'Eugene': 'Eugenius|Eugene', 'Benedict': 'Benedictus|Benedict',
       'Paul': 'Paulus|Paul', 'Adrian': 'Adrianus|Hadrianus|Adriaan|Adrian', 'Nicholas': 'Nicolaas|Nicolaus|Nicholas', 'Sylvester': 'Silvester|Sylvester',
       'Valentine': 'Valentinus', 'Pontian': 'Pontianus', 'Fabian': 'Fabianus', 'Eutychian': 'Eutychianus', 'Sabinian': 'Sabinianus', 'Vitalian': 'Vitalianus',
       'Zachary': 'Zacharias', 'Constantine': 'Constantinus', 'Mark': 'Marcus', 'Francis': 'Franciscus|Francis', 'Lando': 'Landus|Lando', 'Miltiades': 'Miltiades|Melchiades',
       'Anacletus': 'Anacletus|Cletus', 'Felix': 'Felix', 'Julius': 'Julius', 'Leo': 'Leo', 'Pius': 'Pius', 'Sixtus': 'Sixtus|Xystus', 'Alexander': 'Alexander'}
# Europeana items checked by eye and passed over (wrong person, or not a portrait); the next match is used
SKIP = {'/879/https___hispana_mcu_es_lod_oai_dadun_unav_edu_10171____27178_ent1', '/90402/RP_P_2016_49_60_7', '/90402/RP_P_2016_49_69_6', '/90402/RP_P_2016_49_70_8', '/2024903/photography_ProvidedCHO_KU_Leuven_9991094020101488'}
FREE = ('creativecommons.org/publicdomain/mark/', 'creativecommons.org/publicdomain/zero/')

RL = 0  # "too many requests" answers so far: in --commons mode, the run stops at RL_MAX rather than crawl
RL_MAX = int(os.environ.get('RL_MAX', '6'))
class Throttled(Exception): pass

def get(url, tries=5):
    global RL
    for t in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30).read()
        except (urllib.error.URLError, ConnectionError, TimeoutError) as e:
            if getattr(e, 'code', None) == 429:
                RL += 1; print(f'rate limited ({RL}/{RL_MAX}):', url[:90], flush=True)
                if '--commons' in sys.argv and RL >= RL_MAX: raise Throttled()
            if getattr(e, 'code', 503) not in (429, 500, 502, 503, 504) or t == tries - 1: raise
            # Wikimedia asks clients that hear 429 to back off: wait what it says, or 15 s doubling
            ra = getattr(e, 'headers', None) and e.headers.get('Retry-After')
            time.sleep(max(int(ra) if ra and ra.isdigit() else 0, 15 * 2 ** t) if getattr(e, 'code', None) == 429 else 3 * 2 ** t)

def forms(p):
    m = re.match(r'(.+?)(?: ([IVXL]+))?$', p['name'])
    words, num = m.group(1).split(' '), m.group(2) or ''
    alts = [LAT.get(w, w).split('|') for w in words]
    names = [' '.join(x) for x in __import__('itertools').product(*alts)]
    return names, num

def search(q):
    u = 'https://api.europeana.eu/record/v2/search.json?' + urllib.parse.urlencode(
        {'wskey': KEY, 'query': q, 'rows': 40, 'reusability': 'open', 'media': 'true', 'profile': 'rich'})
    return json.loads(get(u)).get('items', [])

def best(p):
    names, num = forms(p)
    nm = r'(?:' + '|'.join(map(re.escape, names)) + r')' + (r'\s+' + num + r'(?![IVXL\w])' if num else r'(?![\w]|\s+[IVXL]+\b)')
    # "Portret van paus X", "Paus X", "Pope X", "Papa San X", or a title that starts with the name ("Innocentius X, paus")
    pat = re.compile(r'\b(?:paus|pope|papa|pape|papst)\s+(?:(?:san|saint|st\.?|sint|heilige|de heilige)\s+)?' + nm + r'|^\W*' + nm + r'\b' + ('' if num else r'\W+(?:paus|pope|papa)') + r'|\bheilige ' + nm + r' als paus', re.I)
    seen, hits = set(), []
    for n in names[:3]:
        for it in search(f'title:"{n + (" " + num if num else "")}" AND (title:paus OR title:pope OR title:papa OR title:portret)'):
            t = (it.get('title') or [''])[0]
            if it['id'] in seen or it['id'] in SKIP or not it.get('edmPreview') or not any(f in (it.get('rights') or [''])[0] for f in FREE): continue
            m = pat.search(t)  # the pope is the subject: named near the start, not in passing ("Willibrord, sent by Pope Gregory II")
            if not m or m.start() > 30: continue
            if re.search(r'allegor|medal|munt|penning|graf|tomb|wapen|arms|kroning|begrafenis|audi[eë]ntie|processie|bul\b|brief|letter', t, re.I): continue
            seen.add(it['id'])
            hits.append((0 if re.match(r'(portret|portrait|bildnis)', t, re.I) else 1, 0 if re.match(r'(portret van )?paus\b', t, re.I) else 1, it))
        time.sleep(0.3)
    hits.sort(key=lambda h: h[:2])
    return [h[2] for h in hits]

def face(im):
    """The largest face that a second model, or eyes inside it, confirm: engravings fool a single cascade with their hatching"""
    g = cv2.equalizeHist(cv2.cvtColor(np.array(im), cv2.COLOR_RGB2GRAY))
    mn = max(24, int(im.width * .12))
    alt = list(ALT.detectMultiScale(g, 1.06, 4, minSize=(mn, mn)))
    def ok(f):
        x, y, w, h = f
        if any(abs((a[0] + a[2] / 2) - (x + w / 2)) < w * .3 and abs((a[1] + a[3] / 2) - (y + h / 2)) < h * .3 for a in alt): return True
        return len(EYE.detectMultiScale(g[y:y + h * 6 // 10, x:x + w], 1.05, 4, minSize=(w // 8, w // 8), maxSize=(w // 3, w // 3))) >= 1
    f = [f for f in FACE.detectMultiScale(g, 1.06, 5, minSize=(mn, mn)) if ok(f)]
    return max(f, key=lambda x: x[2]) if f else None

def portrait(it):
    th = Image.open(io.BytesIO(get(it['edmPreview'][0]))).convert('RGB')
    fb = face(th)
    if fb is None: return None
    im = th
    try:
        full = Image.open(io.BytesIO(get(it['edmIsShownBy'][0]))).convert('RGB')
        if full.width > th.width: im = full
    except Exception: pass
    return crop(im, [v * im.width / th.width for v in fb])

def crop(im, fb):
    """320 by 400 around the face fb (x, y, w, h); None when the crop is too small or does not show that face"""
    x, y, w, h = fb
    cw = min(w * 2.4, im.width); ch = min(cw * 1.25, im.height); cw = ch / 1.25
    cx, cy = x + w / 2, y + h * .55
    l = min(max(cx - cw / 2, 0), im.width - cw); t = min(max(cy - ch * .42, 0), im.height - ch)
    out = im.crop((round(l), round(t), round(l + cw), round(t + ch)))
    if out.width < 160: return None
    out = out.resize((320, 400), Image.LANCZOS)
    f = face(out)  # the crop must show the face itself, in the upper middle
    if f is None or not (90 < f[0] + f[2] / 2 < 230 and 60 < f[1] + f[3] / 2 < 260 and f[2] > 90): return None
    return out

# --commons: the image Wikidata gives each pope (P18; for most popes before the 19th century, his mosaic medallion in
# St. Paul Outside the Walls), kept only when Commons marks the file public domain or CC0. Run where Wikimedia answers
# (.github/workflows/pope-portraits.yml); this environment's requests are refused.
EXTRA = {'peter': 'Q33923', 'eleutherius': 'Q101090'}
# Wikidata images checked by eye that show no face (a page of text, a desk, hands): only the title search is tried for these popes
NOFACE = {'adrian-iv', 'adrian-v', 'benedict-xi', 'callixtus-ii', 'celestine-iii', 'clement-iii', 'gregory-xii', 'innocent-v', 'lucius-iii', 'martin-iv',
          'pius-ii', 'urban-iii', 'victor-ii', 'victor-iii', 'adrian-i', 'lando', 'john-ii', 'eugene-ii', 'honorius-iv', 'leo-iv', 'zachary',
          'sisinnius', 'clement-iv', 'eugene-iv', 'anastasius-iii'}
PD = re.compile(r'(public domain|pd\b|pd-|cc0)', re.I)
CC = re.compile(r'cc[- ]by(?:-sa)?[- ]\d', re.I)
def lic_ok(lic): return bool(PD.match(lic.strip()) or ('--cc' in sys.argv and CC.match(lic.strip())))
def credit(m):
    link = f'<a href="{html.escape(m["page"])}" target="_blank" rel="noopener">file page</a>'
    if PD.match(m['lic'].strip()): return f'Wikimedia Commons, public domain, {link}'
    who = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', m.get('artist') or '')).strip()[:80] or 'Unknown author'
    return f'{html.escape(who)}, {html.escape(m["lic"].strip())}, via Wikimedia Commons, {link}'

def commons_search(p):
    """File titles on Commons that name this pope with his number ("Pope Leo VII", "Papa Leone VII"), at most 8"""
    names, num = forms(p)
    nm = r'(?:' + '|'.join(map(re.escape, names + [p['name'].rsplit(' ', 1)[0]])) + r')' + (r'\s+' + num + r'(?![IVXL\w])' if num else r'(?![\w]|\s+[IVXL]+\b)')
    pat = re.compile(r'\b(?:pope|papa|papst|paus|pape)\s+(?:(?:saint|st\.?|san|sanctus)\s+)?' + nm, re.I)
    q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'list': 'search', 'srnamespace': '6', 'srlimit': '20',
                                'srsearch': f'intitle:"{p["name"]}" pope filetype:bitmap'})
    hits = [h['title'][5:] for h in json.loads(get('https://commons.wikimedia.org/w/api.php?' + q))['query']['search']]
    time.sleep(1)
    return [h for h in hits if pat.search(h) and not re.search(r'coin|medal|coat|arms|stemma|wappen|tomb|grave|signature|bull|seal|map', h, re.I)][:8]

def commons_files():
    def sparql(q): return json.loads(get('https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': q, 'format': 'json'})))['results']['bindings']
    rows = [{'l': x['pLabel']['value'].lower(), 'y': int(x['start']['value'][1:5]) if x.get('start', {}).get('value', '')[1:5].isdigit() else None, 'img': x['img']['value']}
            for x in sparql('SELECT ?p ?pLabel ?start ?img WHERE { ?p p:P39 ?st . ?st ps:P39 wd:Q19546 . OPTIONAL { ?st pq:P580 ?start } '
                            '?p wdt:P18 ?img . SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }')]
    extra = {}
    for x in sparql('SELECT ?p ?img WHERE { VALUES ?p { ' + ' '.join('wd:' + q for q in EXTRA.values()) + ' } ?p wdt:P18 ?img }'):
        extra.setdefault(x['p']['value'].rsplit('/', 1)[1], []).append(x['img']['value'])
    out = {}
    for p in P:
        if p['s'] in EXTRA: u = extra.get(EXTRA[p['s']], [])
        else:
            name, ya = p['name'].lower(), int(re.search(r'\d+', p['a']).group())
            c = [r for r in rows if r['l'] in (name, 'pope ' + name)]
            if len(c) > 1: c = [r for r in c if r['y'] and abs(r['y'] - ya) <= 2] or c
            u = [r['img'] for r in c]
        if u: out[p['s']] = sorted({urllib.parse.unquote(x.split('FilePath/')[1]) for x in u})
    return out

def commons_info(files):
    info = {}
    for i in range(0, len(files), 40):
        q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': '960',
                                    'iiextmetadatafilter': 'LicenseShortName|Artist', 'titles': '|'.join('File:' + f for f in files[i:i + 40])})
        d = json.loads(get('https://commons.wikimedia.org/w/api.php?' + q))
        norm = {n['to']: n['from'] for n in d['query'].get('normalized', [])}
        for pg in d['query']['pages'].values():
            ii = (pg.get('imageinfo') or [{}])[0]
            info[norm.get(pg['title'], pg['title'])[5:]] = {'lic': ii.get('extmetadata', {}).get('LicenseShortName', {}).get('value', ''), 'artist': ii.get('extmetadata', {}).get('Artist', {}).get('value', ''),
                                                            'thumb': ii.get('thumburl'), 'page': ii.get('descriptionurl')}
        time.sleep(1)
    return info

def commons_portrait(m):
    """A face crop when a face is found; otherwise the upper middle, as a medallion is centred on the face (checked by eye after)"""
    time.sleep(2)  # one image every few seconds keeps under Wikimedia's limit
    im = Image.open(io.BytesIO(get(m['thumb']))).convert('RGB')
    small = im.resize((400, round(im.height * 400 / im.width)))
    fb = face(small)
    out = crop(im, [v * im.width / 400 for v in fb]) if fb is not None else None
    if out: return out, 'face'
    cw = min(im.width * .62, im.height * .8 / 1.25); ch = cw * 1.25
    l = (im.width - cw) / 2; t = max(0, min(im.height * .5 - ch * .5, im.height - ch))
    if cw < 160: return None, ''
    return im.crop((round(l), round(t), round(l + cw), round(t + ch))).resize((320, 400), Image.LANCZOS), 'centre'

def ahash(im):
    g = im.convert('L').crop((40, 40, 280, 300)).resize((8, 8), Image.LANCZOS); a = list(g.getdata()); m = sum(a) / 64
    return sum(1 << i for i, v in enumerate(a) if v > m)

P = json.load(open(SRC, encoding='utf-8'))
only = [a for a in sys.argv[1:] if not a.startswith('--')]
os.makedirs(OUT, exist_ok=True)
USED = {p['s']: ahash(Image.open(f"{OUT}/{p['im']}")) for p in P if p.get('im') and os.path.exists(f"{OUT}/{p['im']}") and p['s'] not in only and '--all' not in sys.argv}
got = 0
STOP = False
COMMONS = '--commons' in sys.argv
T0, BUDGET = time.time(), 60 * int(os.environ.get('BUDGET_MIN', '20'))
if COMMONS:
    try:
        CF = commons_files(); CI = commons_info(sorted({f for v in CF.values() for f in v})); print(len(CF), 'popes have an image on Wikidata', flush=True)
    except (Throttled, urllib.error.HTTPError) as e: print('STOPPED: Wikimedia is rate limiting this run' if isinstance(e, Throttled) or getattr(e, 'code', 0) == 429 else f'STOPPED: {e}', flush=True); sys.exit(3)
try:
    for p in P:
        if only and p['s'] not in only: continue
        if not only and p.get('im') and '--all' not in sys.argv: continue
        if COMMONS and time.time() - T0 > BUDGET: print('time budget used up, stopping', flush=True); break
        if COMMONS:
            im = how = m = None
            for pass_ in ('wikidata', 'search'):
                if pass_ == 'wikidata': fl = [] if p['s'] in NOFACE else CF.get(p['s'], [])
                else:
                    fl = [f for f in commons_search(p) if f not in CF.get(p['s'], [])]
                    CI.update(commons_info([f for f in fl if f not in CI]) if fl else {})
                for f in fl:
                    m = CI.get(f)
                    if not m or not m['thumb']: continue
                    if not lic_ok(m['lic']): print('licence not accepted:', p['s'], m['lic']); continue
                    try: im, how = commons_portrait(m)
                    except Throttled: raise
                    except Exception as e: print('skip', p['s'], e); im = None
                    if im and pass_ == 'search' and how != 'face': im = None  # a title match is kept only when it shows a face
                    if im and any(bin(h ^ ahash(im)).count('1') < 10 for h in USED.values()): im = None
                    if im: break
                if im: break
            if not im: print('none:', p['s']); continue
            USED[p['s']] = ahash(im)
            im.save(f"{OUT}/{p['s']}.jpg", 'JPEG', quality=82, optimize=True, progressive=True)
            p['im'] = p['s'] + '.jpg'
            p['ic'] = credit(m)
            open(SRC, 'w', encoding='utf-8', newline='\n').write(json.dumps(P, ensure_ascii=False, separators=(',', ':')))
            got += 1; print(f'ok ({how}):', p['s'], '|', f[:70]); time.sleep(2); continue
        it = im = None
        for c in best(p)[:10]:
            try: im = portrait(c)
            except Exception as e: print('skip', p['s'], e); im = None
            if im and any(bin(h ^ ahash(im)).count('1') < 10 for h in USED.values()): im = None  # the same woodcut stood for many popes: use it once
            if im: it = c; break
        if not it: print('none:', p['s']); continue
        USED[p['s']] = ahash(im)
        im.save(f"{OUT}/{p['s']}.jpg", 'JPEG', quality=82, optimize=True, progressive=True)
        src = (it.get('dataProvider') or ['Europeana'])[0]
        link = 'https://www.europeana.eu/item' + it['id']
        p['im'] = p['s'] + '.jpg'
        p['ic'] = f'{html.escape(src)}, public domain, <a href="{html.escape(link)}" target="_blank" rel="noopener">Europeana</a>'
        got += 1
        open(SRC, 'w', encoding='utf-8', newline='\n').write(json.dumps(P, ensure_ascii=False, separators=(',', ':')))
        print('ok:', p['s'], '|', it['title'][0][:70])
except Throttled:
    print('STOPPED: Wikimedia is rate limiting this run; what was fetched so far is saved', flush=True); STOP = True
open(SRC, 'w', encoding='utf-8', newline='\n').write(json.dumps(P, ensure_ascii=False, separators=(',', ':')))
print(got, 'portraits saved')
if STOP: sys.exit(3)
