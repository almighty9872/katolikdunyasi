"""Writes cloudflare/seed-parishes.sql: the parishes of the Archdiocese of Toronto for the parish portal's
D1 database (parishes.verbumdomini.ca), from the Archdiocese's public Find a Parish listing.

Each listing page carries, for every parish, a details box (website, address, phone, email, region and zone,
a map link with the coordinates) and a Mass times box (day, time, language). This reads every page of the
listing, turns them into rows for the tables in cloudflare/schema.sql and writes INSERT OR IGNORE statements,
so running the seed again never overwrites what a parish has edited. The listing has no Confession times:
parishes add those themselves in /admin.

Usage (from verbumdomini/): python3 tools/seed-parishes.py [--cache DIR]
  --cache DIR  keep the fetched pages in DIR and read them from there on the next run
Then load it (see cloudflare/parishes.jsonc):
  npx wrangler@4 d1 execute verbumdomini-parishes --remote --file cloudflare/seed-parishes.sql
"""
import html, os, re, sys, time, unicodedata, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'cloudflare', 'seed-parishes.sql')
BASE = 'https://www.archtoronto.org/en/contact-us/find-a-parish/'
QUERY = '?parish=&address=&city=&postalCode=&massTime=&massType=&massLanguage=&cLatLng=&page='
UA = 'Mozilla/5.0 (compatible; VerbumDominiParishDirectory/1.0; +https://parishes.verbumdomini.ca/)'
cache = sys.argv[sys.argv.index('--cache') + 1] if '--cache' in sys.argv else None


def fetch(n):
    if cache:
        p = os.path.join(cache, f'page-{n}.html')
        if os.path.isfile(p): return open(p, encoding='utf-8').read()
    req = urllib.request.Request(BASE + QUERY + str(n), headers={'User-Agent': UA})
    for attempt in range(4):
        try:
            s = urllib.request.urlopen(req, timeout=60).read().decode('utf-8', 'replace')
            break
        except Exception as e:
            if attempt == 3: sys.exit(f'seed-parishes: page {n}: {e}')
            time.sleep(2 ** attempt * 2)
    if cache:
        os.makedirs(cache, exist_ok=True)
        open(os.path.join(cache, f'page-{n}.html'), 'w', encoding='utf-8').write(s)
    time.sleep(1)  # one page a second: the listing is a public page, not an API
    return s


def text(h): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h or ''))).strip()
def slugify(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower().replace('&', ' and ')
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s)).strip('-')
def block(s, mid):  # the inside of one modal box, by its id
    i = s.find(f'id="{mid}"')
    if i < 0: return ''
    j = s.find('class="modal fade"', i + 10)
    return s[i:j if j > 0 else len(s)]


# Areas the directory filters by: the listing's zone, and the city inside Peel
TORONTO = {'Toronto', 'Etobicoke', 'Scarborough', 'North York', 'East York', 'York', 'Willowdale', 'Downsview', 'Weston'}
def area(city, zone):
    if zone == 'Durham': return 'Durham Region'
    if zone == 'York County': return 'York Region'
    if zone == 'Simcoe': return 'Simcoe/Georgian'
    if city == 'Mississauga': return 'Mississauga'
    if city in ('Brampton', 'Bramalea'): return 'Brampton'
    if zone in ('Dufferin-Peel', 'Mississauga'): return 'Peel/Caledon'
    if city in TORONTO or zone in ('Etobicoke', 'Scarborough', 'North Toronto', 'East Toronto'): return 'Toronto'
    return 'Toronto'


DAYS = {'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6}
# Headings in the Mass times box that are not plain weekdays: (kind, day, note)
SPECIAL = {'Saturday Vigil': ('sunday', 6, 'Vigil'), 'First Friday': ('weekday', 5, 'First Friday of the month'),
           'First Sunday': ('sunday', 0, 'First Sunday of the month'), 'Second Sunday': ('sunday', 0, 'Second Sunday of the month'),
           'Third Sunday': ('sunday', 0, 'Third Sunday of the month'), 'Fourth Sunday': ('sunday', 0, 'Fourth Sunday of the month')}
def hhmm(t):
    m = re.match(r'(\d{1,2}):(\d{2})\s*([AP])\.?M', t, re.I)
    if not m: return None
    h = int(m.group(1)) % 12 + (12 if m.group(3).upper() == 'P' else 0)
    return f'{h:02d}:{m.group(2)}'
def masses(box):
    out = []
    for head, body in re.findall(r'masstimes-heading-day"><strong>([^<]*)</strong></div>(.*?)(?=masstimes-heading-day|modal-footer|$)', box, re.S):
        head = text(head)
        if head in DAYS: kind, day, note = ('sunday' if head == 'Sunday' else 'weekday'), DAYS[head], ''
        elif head in SPECIAL: kind, day, note = SPECIAL[head]
        else: continue
        for span in re.findall(r'<span>(.*?)</span>', body, re.S):
            span = text(span)
            t = hhmm(span)
            if not t: continue
            lang = re.search(r'\(([^)]*)\)', span)
            extra = re.sub(r'^\d{1,2}:\d{2}\s*[AP]\.?M\.?\s*', '', span, flags=re.I)
            extra = re.sub(r'\([^)]*\)', '', extra).strip(' -,')
            out.append((kind, day, t, lang.group(1).strip() if lang else 'English', '; '.join(x for x in (note, extra) if x)))
    return out


def parse(s):
    rows = []
    for mid, name in re.findall(r'class="placemass-search-results-placename"[^>]*data-target="#pdp-([0-9A-Za-z]+)"\s*>(.*?)</a>', s, re.S):
        d, m = block(s, 'pdp-' + mid), block(s, 'mtp-' + mid)
        full = text(name)
        title = text(re.search(r'id="pdp-[^"]+-title"[^>]*>(.*?)</h5>', d, re.S).group(1)) if 'title"' in d else full
        title = re.sub(r'\s*\(DETAILS\)\s*$', '', title, flags=re.I)
        city = full.rsplit(',', 1)[1].strip() if ',' in full else ''
        addr = re.search(r'placemass-search-results-address">(.*?)<br\s*/?>\s*(?:<br|<div)', d, re.S)
        lines = [text(x) for x in re.split(r'<br\s*/?>', addr.group(1))] if addr else []
        street, pc = (lines[0] if lines else ''), ''
        if len(lines) > 1:
            cm = re.match(r'(.*?),\s*([A-Z]\d[A-Z]\s?\d[A-Z]\d)?\s*$', lines[-1])
            if cm:
                city = city or cm.group(1).strip()
                pc = (cm.group(2) or '').replace(' ', '')
                pc = pc[:3] + ' ' + pc[3:] if pc else ''
        geo = re.search(r'maps\.google\.com/\?q=(-?[\d.]+),(-?[\d.]+)', s[s.find(f'#pdp-{mid}'):s.find(f'#mtp-{mid}')])
        web = re.search(r'href="([^"]+)"[^>]*class="placemass-search-popup-website-url', d)
        tel = re.search(r'href="tel:[^"]*"[^>]*>\s*([^<]+?)\s*</a>', d)
        mail = re.search(r'href="mailto:([^"]+)"', d)
        reg = re.search(r'<strong>Region:</strong>\s*([^<]*?)\s*-\s*<strong>Zone:</strong>\s*([^<]*)', d)
        region, zone = (reg.group(1).strip(), reg.group(2).strip()) if reg else ('', '')
        url = web.group(1).strip() if web else ''
        if url and not re.match(r'https?://', url): url = 'https://' + url
        rows.append({'src': mid, 'name': title, 'street': street, 'city': city, 'postal': pc,
                     'lat': float(geo.group(1)) if geo else None, 'lng': float(geo.group(2)) if geo else None,
                     'phone': re.sub(r'[()]', '', tel.group(1)).replace(')-', '-').strip() if tel else '',
                     'email': mail.group(1).strip().lower() if mail else '', 'web': url,
                     'region': region, 'zone': zone, 'area': area(city, zone), 'masses': masses(m)})
    return rows


def q(v):
    if v is None: return 'NULL'
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


parishes, seen, n = [], set(), 1
while True:
    page = parse(fetch(n))
    page = [p for p in page if p['src'] not in seen]
    if not page: break
    for p in page: seen.add(p['src'])
    parishes += page
    n += 1
    if n > 60: break
if len(parishes) < 150: sys.exit(f'seed-parishes: only {len(parishes)} parishes read; the listing may have changed')

slugs = set()
for p in parishes:
    base = slugify(re.sub(r'\b(Parish|Church|Roman Catholic)\b', '', p['name'])) or 'parish'
    s = base if base not in slugs else f'{base}-{slugify(p["city"])}'
    k = 2
    while s in slugs: s, k = f'{base}-{slugify(p["city"])}-{k}', k + 1
    slugs.add(s); p['slug'] = s
# Slugs are stable across runs because the listing's order is alphabetical; a parish keeps its slug once
# it is in the database (INSERT OR IGNORE), whatever a later run computes.

out = ['-- Generated by tools/seed-parishes.py from the Archdiocese of Toronto\'s public Find a Parish listing.',
       '-- INSERT OR IGNORE: running it again adds new parishes and never changes edited ones.',
       f'-- {len(parishes)} parishes, {sum(len(p["masses"]) for p in parishes)} Mass times.', '']
for p in sorted(parishes, key=lambda p: p['slug']):
    out.append('INSERT OR IGNORE INTO parishes (slug, source_id, name, deanery, region, area, street, city, postal_code, lat, lng, phone, email, website_url) VALUES ('
               + ', '.join(q(p[k]) for k in ('slug', 'src', 'name', 'zone', 'region', 'area', 'street', 'city', 'postal', 'lat', 'lng', 'phone', 'email', 'web')) + ');')
    for i, (kind, day, t, lang, note) in enumerate(p['masses']):
        # Only for a parish seeded now (no times yet): an edited schedule is never doubled
        out.append(f"INSERT INTO mass_times (parish_id, kind, day, start_time, language, note, sort, seeded) SELECT id, {q(kind)}, {day}, {q(t)}, {q(lang)}, {q(note)}, {i}, 1 "
                   f"FROM parishes WHERE slug = {q(p['slug'])} AND NOT EXISTS (SELECT 1 FROM mass_times WHERE parish_id = parishes.id AND seeded = 0) "
                   f"AND NOT EXISTS (SELECT 1 FROM mass_times WHERE parish_id = parishes.id AND kind = {q(kind)} AND day = {day} AND start_time = {q(t)} AND language = {q(lang)});")
open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(out) + '\n')
print(f'seed-parishes: {len(parishes)} parishes, {sum(len(p["masses"]) for p in parishes)} Mass times into {os.path.relpath(OUT)}')
