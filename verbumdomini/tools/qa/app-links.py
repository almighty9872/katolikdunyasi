"""Link check for the built site (verbumdomini/tools/build-app.py output).
Like links.py, but a link to #<page> (or #<page>/<part>) is a page of the app, not an anchor,
and the page fragments in pages/ are checked too. Prints the broken links, then "total bad N".
Usage: python3 verbumdomini/tools/qa/app-links.py verbumdomini/_site_en"""
import collections, glob, json, os, re, sys

root = sys.argv[1]
routes = {p['s'] for p in json.load(open(os.path.join(root, 'pages', 'index.json'), encoding='utf-8'))} | {'home', 'rosary', 'saints', 'more', 'library', 'guides', 'prayer', 'answers', 'history', 'bible', 'read-the-bible', 'who-is-jesus', 'start'}
# Old addresses /popes.html#<name> still open a pope in the app (a place in the app, not an anchor); each pope also has /pope-<name>.html
popes = {p['s'] for p in json.load(open(os.path.join(root, 'data', 'popes.json'), encoding='utf-8'))}
files = glob.glob(root + '/*.html') + glob.glob(root + '/pages/*.html')
ids = {f: set(re.findall(r'\bid="([^"]+)"', open(f, encoding='utf-8').read())) for f in files}
bad = collections.Counter()
for f in files:
    h = open(f, encoding='utf-8').read()
    for u in re.findall(r'(?:href|src)="([^"]+)"', h):
        if re.match(r'(https?:|mailto:|tel:|data:|javascript:)', u):
            if 'katolikdunyasi.com' in u: bad['TRLINK ' + u] += 1
            continue
        path, _, frag = u.partition('#'); path = path.split('?')[0]
        if frag.split('/')[0] in routes and path in ('', '/', 'index.html', '/index.html'): continue
        if path == '': target = f
        elif path.startswith('/download/'): target = os.path.join(root, 'files', path[10:])  # the worker sends files/<name> as an attachment
        elif path.startswith('/'): target = os.path.join(root, path.lstrip('/') or 'index.html')
        else: target = os.path.join(root, path)  # fragments are shown inside the root page, so their links resolve from the root
        if not os.path.exists(target): bad[os.path.relpath(target, root)] += 1; continue
        if frag and target.endswith('.html') and frag not in ids.get(target, set()) and frag.split('/')[0] not in routes \
                and not (target.endswith('popes.html') and frag in popes) \
                and not (target.endswith('confessions.html') and re.fullmatch(r'\d+(/\d+)?', frag)):  # a book or section in the reader
            bad[os.path.relpath(target, root) + '#' + frag] += 1
for k, n in bad.most_common(40): print(n, k)
print('total bad', sum(bad.values()))
