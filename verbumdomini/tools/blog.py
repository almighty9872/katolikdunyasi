#!/usr/bin/env python3
"""Builds the blog (blog.verbumdomini.ca) from verbumdomini/blog-src/ into verbumdomini/_site_blog/.

A post is blog-src/posts/<slug>.md: header lines "key: value", a line "---", then the body.
The address of a post is https://blog.verbumdomini.ca/<slug>.

Header keys:
  title         the H1, as the reader sees it
  seo_title     the <title> and share title (under about 65 characters)
  description   the search snippet and card text (about 120 to 160 characters)
  category      one category, e.g. "Ongoing projects"
  subtitle      optional; shown under the title on the post page (description stays for search engines and cards)
  tags          comma separated, e.g. "Catechism, Turkish"
  author        a key of blog-src/authors.json (default: editor)
  date          first published, YYYY-MM-DD; updated: last real change (shown as "Updated")
  series        optional series name; series_part: its number (a banner shows from two parts)
  cover         optional image under static/, with cover_alt and cover_caption (inline HTML allowed)
  og_image      optional 1200x630 share image under static/ (default: cover, then og-image.jpg)
  draft         "true" leaves the post out unless the build runs with BLOG_DRAFTS=1

Body syntax (blog-src/posts/style-guide.md is a draft that shows all of it):
  paragraphs separated by blank lines; **bold**, *italic*, `code`, [text](url), inline HTML
  ## Heading (goes into "On this page"), ### Subheading
  ![alt](images/x.jpg "caption")   a figure that zooms on click
  > quote;  > [!NOTE] Title  + "> " lines: a callout (NOTE, TIP, WARNING, QUOTE; [!TIP]- starts closed)
  - list, 1. list;  ```lang fenced code (gets a copy button)
  text[^id] and a line "[^id]: note": a footnote with a preview popover

Writes the home page, posts, author pages, subscribe.html, 404.html, search.json, sitemap.xml,
robots.txt and three feeds with the full text of every post: feed.xml (Atom), rss.xml (RSS 2.0)
and feed.json (JSON Feed 1.1). Copies blog-src/static/ as is.
"""
import datetime, html, json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'blog-src')
OUT = os.path.join(ROOT, '_site_blog')
SITE = 'https://blog.verbumdomini.ca'
MAIN = 'https://verbumdomini.ca'
NAME = 'Verbum Domini Blog'
HOME_TITLE = 'Verbum Domini Blog: Catholic Faith, Translation and Free Catholic Resources'
HOME_DESC = ('Articles on the Catholic faith, translating the Catechism into Turkish, and building '
             'verbumdomini.ca, a free guide to the Catholic faith in plain English.')
DRAFTS = os.environ.get('BLOG_DRAFTS') == '1'
WPM = 220
PUBLISHER = {'@type': 'Organization', '@id': MAIN + '/#org', 'name': 'Verbum Domini', 'url': MAIN + '/',
             'logo': {'@type': 'ImageObject', 'url': MAIN + '/icon-512.png', 'width': 512, 'height': 512}}


def esc(s): return html.escape(s, quote=True)
def text(h): return html.unescape(re.sub(r'<[^>]+>', '', re.sub(r'<a class="anchor"[^>]*>#</a>', '', h))).strip()
def nice(d): return datetime.date.fromisoformat(d).strftime('%b %-d, %Y')
def slugify(s): return re.sub(r'[^a-z0-9]+', '-', text(s).lower()).strip('-')
def ld(o): return '<script type="application/ld+json">' + json.dumps(o, ensure_ascii=False).replace('</', '<\\/') + '</script>\n'
def fail(msg): sys.exit('blog.py: ' + msg)


def icon(name):
    paths = {
        'search': '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
        'type': '<path d="M4 7V5h11v2M9.5 5v14M7 19h5M14 12v-1.5h7V12M17.5 10.5V19M16 19h3"/>',
        'link': '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
        'share': '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
        'play': '<path d="M7 4.5v15l12-7.5z"/>',
        'pause': '<path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z"/>',
        'stop': '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
        'headphones': '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="14" width="4.5" height="6.5" rx="1.5"/><rect x="16" y="14" width="4.5" height="6.5" rx="1.5"/>',
        'book': '<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5C7 18 10 18.5 12 20c2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5V20"/>',
        'x': '<path d="m6 6 12 12M18 6 6 18"/>',
        'rss': '<path d="M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8"/><circle cx="6" cy="18" r="1.4"/>',
        'clock': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
        'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    }
    return f'<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>'


LOGO = ('<svg class="logo-fish" viewBox="0 0 48 24" aria-hidden="true" focusable="false"><path d="M3 12C13-.5 33-1 45 20.5M3 12C13 24.5 33 25 45 3.5" '
        'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M24 6.5v11M19.5 11h9" stroke="currentColor" '
        'stroke-width="1.8" stroke-linecap="round"/></svg>')

# ---------------------------------------------------------------- Markdown subset

class Doc:
    def __init__(self, slug):
        self.slug, self.heads, self.notes, self.order, self.ids = slug, [], {}, [], set()

    def uid(self, base):
        base = base or 'section'
        i, s = 2, base
        while s in self.ids: s, i = f'{base}-{i}', i + 1
        self.ids.add(s)
        return s

    def inline(self, s):
        codes = []
        s = re.sub(r'`([^`]+)`', lambda m: codes.append(f'<code>{esc(m.group(1))}</code>') or f'\0{len(codes) - 1}\0', s)
        s = re.sub(r'\[\^([\w-]+)\]', self.fnref, s)
        s = re.sub(r'(?<!!)\[([^\]]+)\]\(([^)\s]+)\)', lambda m: f'<a href="{esc(m.group(2))}">{m.group(1)}</a>', s)
        s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
        s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em>\1</em>', s)
        return re.sub('\0(\\d+)\0', lambda m: codes[int(m.group(1))], s)

    def fnref(self, m):
        k = m.group(1)
        if k not in self.order: self.order.append(k)
        n = self.order.index(k) + 1
        return (f'<sup class="fn-ref"><a href="#fn-{k}" id="fnref-{k}" data-fn="fn-{k}" '
                f'aria-label="Note {n}">{n}</a></sup>')

    def figure(self, alt, src, cap, cls='fig'):
        cap_html = f'<figcaption>{self.inline(cap)}</figcaption>' if cap else ''
        return (f'<figure class="{cls}"><a class="zoom" href="/{src}" aria-label="Enlarge image: {esc(alt)}">'
                f'<img src="/{src}" alt="{esc(alt)}" loading="lazy" decoding="async"></a>{cap_html}</figure>')

    def render(self, body):
        lines = body.replace('\r', '').split('\n')
        out, i = [], 0
        while i < len(lines):
            ln = lines[i]
            if not ln.strip(): i += 1; continue
            m = re.match(r'\[\^([\w-]+)\]:\s*(.*)', ln)
            if m:
                self.notes[m.group(1)] = m.group(2); i += 1; continue
            if ln.startswith('```'):
                lang = ln[3:].strip(); j = i + 1
                while j < len(lines) and not lines[j].startswith('```'): j += 1
                if j == len(lines): fail(f'{self.slug}: code block never closed')
                code = esc('\n'.join(lines[i + 1:j]))
                lab = f' data-lang="{esc(lang)}"' if lang else ''
                out.append(f'<div class="code"{lab}><pre tabindex="0"><code>{code}</code></pre></div>')
                i = j + 1; continue
            m = re.match(r'(#{2,3}) (.+)', ln)
            if m:
                lvl, t = len(m.group(1)), m.group(2).strip()
                hid = self.uid(slugify(t))
                self.heads.append((lvl, hid, text(self.inline(t))))
                out.append(f'<h{lvl} id="{hid}"><a class="anchor" href="#{hid}" aria-hidden="true" tabindex="-1">#</a>{self.inline(t)}</h{lvl}>')
                i += 1; continue
            m = re.match(r'!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$', ln)
            if m:
                out.append(self.figure(m.group(1), m.group(2), m.group(3) or '')); i += 1; continue
            if ln.startswith('>'):
                block = []
                while i < len(lines) and lines[i].startswith('>'):
                    block.append(re.sub(r'^> ?', '', lines[i])); i += 1
                m = re.match(r'\[!(NOTE|TIP|WARNING|QUOTE)\]([+-]?)\s*(.*)', block[0])
                if m:
                    kind, fold, title = m.group(1).lower(), m.group(2), m.group(3) or m.group(1).title()
                    inner = self.render('\n'.join(block[1:]))
                    op = '' if fold == '-' else ' open'
                    out.append(f'<details class="callout {kind}"{op}><summary><span class="co-t">{self.inline(title)}</span></summary>'
                               f'<div class="co-b">{inner}</div></details>')
                else:
                    out.append(f'<blockquote>{self.render('\n'.join(block))}</blockquote>')
                continue
            m = re.match(r'(- |\d+\. )', ln)
            if m:
                tag = 'ul' if m.group(1) == '- ' else 'ol'
                pat = r'- ' if tag == 'ul' else r'\d+\. '
                items = []
                while i < len(lines) and re.match(pat, lines[i]):
                    items.append(re.sub('^' + pat, '', lines[i])); i += 1
                out.append(f'<{tag}>' + ''.join(f'<li>{self.inline(x)}</li>' for x in items) + f'</{tag}>')
                continue
            para = []
            while (i < len(lines) and lines[i].strip() and not re.match(r'(#{2,3} |```|>|- |\d+\. |!\[|\[\^[\w-]+\]:)', lines[i])):
                para.append(lines[i].strip()); i += 1
            p = ' '.join(para)
            out.append(p if re.match(r'<(div|figure|table|aside|section|details|iframe)\b', p) else f'<p>{self.inline(p)}</p>')
        return '\n'.join(out)

    def footnotes(self):
        missing = [k for k in self.order if k not in self.notes]
        if missing: fail(f'{self.slug}: footnote without text: {", ".join(missing)}')
        if not self.order: return ''
        lis = ''.join(f'<li id="fn-{k}">{self.inline(self.notes[k])} <a class="fn-back" href="#fnref-{k}" '
                      f'aria-label="Back to the text of note {n}">↩</a></li>' for n, k in enumerate(self.order, 1))
        return f'<section class="footnotes" aria-labelledby="notes-h"><h2 id="notes-h">Notes</h2><ol>{lis}</ol></section>'


# ---------------------------------------------------------------- content

def load_authors():
    a = json.load(open(os.path.join(SRC, 'authors.json'), encoding='utf-8'))
    for k, v in a.items():
        v['slug'], v['url'] = k, f'{SITE}/authors/{k}'
        v['ld'] = {'@type': v.get('type', 'Person'), 'name': v['name'], 'url': v['url'], 'description': v['bio']}
    return a


def load(path, authors):
    raw = open(path, encoding='utf-8').read().replace('\r', '')
    if '\u2014' in raw: fail(f'{path}: em dash found (house rule: none)')
    head, body = raw.split('\n---\n', 1)
    p = dict(l.split(': ', 1) for l in head.strip().splitlines())
    for k in ('title', 'seo_title', 'category', 'date'):
        if not p.get(k): fail(f'{path}: missing "{k}"')
    p['slug'] = os.path.basename(path)[:-3]
    p['url'] = f"{SITE}/{p['slug']}"
    p.setdefault('description', '')  # optional: without it the post has no description line or meta description
    p.setdefault('updated', p['date'])
    p['tags'] = [t.strip() for t in p.get('tags', '').split(',') if t.strip()]
    p['author'] = authors.get(p.get('author', 'editor')) or fail(f'{path}: unknown author "{p.get("author")}"')
    for k in ('cover', 'og_image'):
        if p.get(k) and not os.path.isfile(os.path.join(SRC, 'static', p[k])): fail(f'{path}: {k} not found: {p[k]}')
    d = Doc(p['slug'])
    p['html'] = d.render(body) + d.footnotes()
    p['heads'] = d.heads
    p['words'] = len(text(p['html']).split())
    p['mins'] = max(1, round(p['words'] / WPM))
    p['og'] = p.get('og_image') or p.get('cover') or 'og-image.jpg'
    return p


# ---------------------------------------------------------------- page parts

def page(title, desc, url, body, extra='', og_type='website', img='og-image.jpg', robots='', cls=''):
    dm = f'<meta name="description" content="{esc(desc)}">\n' if desc else ''
    dog = f'<meta property="og:description" content="{esc(desc)}">\n' if desc else ''
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
{dm}{robots}<link rel="canonical" href="{url}">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="{NAME}">
<meta property="og:title" content="{esc(title)}">
{dog}<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/{img}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
{extra}<meta name="theme-color" content="#eeebe5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#101216" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="application/atom+xml" title="{NAME} (Atom)" href="{SITE}/feed.xml">
<link rel="alternate" type="application/rss+xml" title="{NAME} (RSS)" href="{SITE}/rss.xml">
<link rel="alternate" type="application/feed+json" title="{NAME} (JSON Feed)" href="{SITE}/feed.json">
<link rel="preload" href="/fonts/literata-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
<script src="/theme.js"></script>
<script src="/blog.js" defer></script>
</head>
<body class="{cls}">
<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"><span></span></div>
<header class="top">
<a class="brand" href="/" aria-label="Verbum Domini Blog, home">{LOGO}<span class="bn"><b>VERBUM DOMINI</b><small>The Blog</small></span></a>
<nav class="top-r" aria-label="Site">
<a class="top-link" href="{MAIN}/">verbumdomini.ca</a>
<button class="ib" type="button" data-open="search" aria-haspopup="dialog" aria-label="Search posts (press /)" title="Search (/)">{icon('search')}</button>
<button class="ib" type="button" data-open="settings" aria-expanded="false" aria-controls="settings" aria-label="Display settings" title="Display settings">{icon('type')}</button>
</nav>
<div class="settings" id="settings" role="group" aria-label="Display settings" hidden>
<fieldset><legend>Theme</legend><div class="seg" data-set="theme">
<button type="button" data-v="auto" aria-pressed="true">Auto</button><button type="button" data-v="light" aria-pressed="false">Light</button><button type="button" data-v="sepia" aria-pressed="false">Sepia</button><button type="button" data-v="dark" aria-pressed="false">Dark</button>
</div></fieldset>
<fieldset><legend>Text size</legend><div class="seg fs">
<button type="button" data-fs="-1" aria-label="Smaller text">A−</button><output aria-live="polite" id="fs-out">100%</output><button type="button" data-fs="1" aria-label="Larger text">A+</button>
</div></fieldset>
<button class="reader-btn wide" type="button" data-reader aria-pressed="false">{icon('book')} Reader mode</button>
</div>
</header>
{body}
<footer class="foot">
<div class="foot-in">
<p><b>{NAME}</b>. Articles on the Catholic faith and the making of <a href="{MAIN}/">verbumdomini.ca</a>, a free guide to the Catholic faith in plain English.</p>
<p class="foot-links"><a href="/">All posts</a><a href="/subscribe">{icon('rss')} Subscribe (RSS)</a><a href="{MAIN}/contact.html">Contact</a><a href="{MAIN}/privacy.html">Privacy</a></p>
</div>
</footer>
<dialog class="search" id="search" aria-label="Search posts">
<form method="dialog" class="s-form" role="search">
<label class="sr" for="s-q">Search posts</label>
{icon('search')}<input id="s-q" type="search" placeholder="Search posts" autocomplete="off" spellcheck="false" aria-controls="s-res" aria-describedby="s-count">
<button class="ib" type="submit" value="close" aria-label="Close search">{icon('x')}</button>
</form>
<div class="s-filters" id="s-filters"></div>
<p class="s-count" id="s-count" aria-live="polite"></p>
<ul class="s-res" id="s-res"></ul>
</dialog>
<dialog class="lightbox" id="lightbox" aria-label="Enlarged image">
<button class="ib lb-x" type="button" aria-label="Close">{icon('x')}</button>
<figure><figcaption></figcaption></figure>
</dialog>
<p class="toast" id="toast" role="status" aria-live="polite"></p>
</body>
</html>
'''


def tag_links(p):
    return ''.join(f'<a class="tag" href="/?tag={slugify(t)}">#{esc(t)}</a>' for t in p['tags'])


def card(p, big=False):
    img = ''
    if p.get('cover'):
        img = (f'<div class="c-img"><img src="/{p["cover"]}" alt="" loading="{"eager" if big else "lazy"}" decoding="async"></div>')
    return (f'<li class="card{" big" if big else ""}" data-cat="{slugify(p["category"])}" data-tags="{" ".join(slugify(t) for t in p["tags"])}">'
            f'{img}<div class="c-body"><p class="cat">{esc(p["category"])}</p>'
            f'<h2 class="c-t"><a href="/{p["slug"]}">{esc(p["title"])}</a></h2>'
            + (f'<p class="c-d">{esc(p["description"])}</p>' if p['description'] else '') +
            f'<p class="c-m"><time datetime="{p["date"]}">{nice(p["date"])}</time><span>{p["mins"]} min read</span></p>'
            f'</div></li>')


def author_box(a, heading=True, cls='author'):
    links = ''.join(f'<a href="{esc(u)}">{esc(k)}</a>' for k, u in a.get('links', {}).items())
    h = '<p class="ab-k">Written by</p>' if heading else ''
    return (f'<section class="{cls}" aria-label="About the author"><img class="av" src="/{a["avatar"]}" alt="" width="64" height="64">'
            f'<div>{h}<p class="ab-n"><a href="/authors/{a["slug"]}">{esc(a["name"])}</a></p>'
            f'<p class="ab-r">{esc(a.get("role", ""))}</p><p class="ab-b">{esc(a["bio"])}</p>'
            f'<p class="ab-l"><a href="/authors/{a["slug"]}">All posts by {esc(a["name"])}</a>{links}</p></div></section>')


NEWSLETTER = ('<section class="news" aria-labelledby="news-h"><h2 id="news-h">Get updates by email</h2>'
              '<p>An occasional email when there are new posts, pages or translations on Verbum Domini.</p>'
              '<form class="news-f" action="https://buttondown.com/api/emails/embed-subscribe/verbumdomini" method="post" aria-describedby="news-note"><fieldset>'
              '<input type="hidden" name="embed" value="1">'
              '<label class="sr" for="news-e">Email address</label>'
              '<input id="news-e" name="email" type="email" required placeholder="you@example.com" autocomplete="email">'
              '<button type="submit">Subscribe</button></fieldset></form>'
              f'<p class="news-note" id="news-note">We send you one email to confirm. No spam, and every email has an unsubscribe link. <a href="{MAIN}/privacy.html">Privacy</a></p></section>')


def share_bar(p):
    return (f'<div class="share" aria-label="Share this post" role="group">'
            f'<button type="button" class="btn" data-copy="{p["url"]}">{icon("link")} Copy link</button>'
            f'<button type="button" class="btn" data-share hidden>{icon("share")} Share</button></div>')


def toc(p):
    hs = p['heads']
    if sum(1 for h in hs if h[0] == 2) < 2: return ''
    lis = ''.join(f'<li class="l{lvl}"><a href="#{hid}">{esc(t)}</a></li>' for lvl, hid, t in hs)
    return (f'<aside class="toc-w"><details class="toc" id="toc"><summary>On this page</summary>'
            f'<nav aria-label="On this page"><ol>{lis}</ol></nav></details></aside>')


def series_box(p, posts):
    if not p.get('series'): return ''
    sp = sorted([q for q in posts if q.get('series') == p['series']], key=lambda q: int(q.get('series_part', 0)))
    if len(sp) < 2: return ''
    n = sp.index(p)
    item = lambda q: (f'<span aria-current="page">{esc(q["title"])}</span>' if q is p
                      else f'<a href="/{q["slug"]}">{esc(q["title"])}</a>')
    lis = ''.join(f'<li>{item(q)}</li>' for q in sp)
    nav = ''
    if n > 0: nav += f'<a class="sr-prev" href="/{sp[n - 1]["slug"]}">← Part {n}</a>'
    if n < len(sp) - 1: nav += f'<a class="sr-next" href="/{sp[n + 1]["slug"]}">Part {n + 2} →</a>'
    return (f'<details class="series"><summary><span class="sr-k">Series</span> <b>{esc(p["series"])}</b> '
            f'<span class="sr-n">Part {n + 1} of {len(sp)}</span></summary><ol>{lis}</ol><p class="sr-nav">{nav}</p></details>')


def related(p, posts):
    def score(q):
        return len(set(map(slugify, q['tags'])) & set(map(slugify, p['tags']))) * 2 + (q['category'] == p['category']) + (q.get('series') and q.get('series') == p.get('series') or 0)
    rs = sorted([q for q in posts if q is not p and score(q) > 0], key=lambda q: q['date'], reverse=True)
    rs = sorted(rs, key=score, reverse=True)[:3]
    if not rs: return ''
    return f'<section class="related" aria-labelledby="rel-h"><h2 id="rel-h">Related posts</h2><ul class="cards">{"".join(card(q) for q in rs)}</ul></section>'


def post_page(p, posts):
    lede = f'<p class="lede">{esc(p["subtitle"])}</p>\n' if p.get('subtitle') else ''
    a = p['author']
    upd = (f'<span class="upd">Updated <time datetime="{p["updated"]}">{nice(p["updated"])}</time></span>'
           if p['updated'] != p['date'] else '')
    cover = ''
    if p.get('cover'):
        cover = Doc(p['slug']).figure(p.get('cover_alt', ''), p['cover'], p.get('cover_caption', ''), 'cover')
        cover = cover.replace(' loading="lazy"', ' fetchpriority="high"')
    body = f'''<main id="main" class="post-main">
<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Blog</a></li><li><a href="/?category={slugify(p["category"])}">{esc(p["category"])}</a></li><li><span aria-current="page">{esc(p["title"])}</span></li></ol></nav>
<div class="post-grid">
{toc(p)}
<article class="post" data-words="{p["words"]}">
<header class="post-h">
<p class="cat"><a href="/?category={slugify(p["category"])}">{esc(p["category"])}</a></p>
<h1>{esc(p["title"])}</h1>
{lede}<div class="byline"><img class="av-s" src="/{a["avatar"]}" alt="" width="36" height="36"><div><a class="by-n" href="/authors/{a["slug"]}">{esc(a["name"])}</a>
<p class="by-m"><time datetime="{p["date"]}">{nice(p["date"])}</time>{upd}<span class="badge">{icon("clock")} {p["mins"]} min read</span></p></div></div>
<div class="tools">
<button type="button" class="btn" data-tts hidden aria-expanded="false" aria-controls="tts">{icon("headphones")} Listen</button>
<button type="button" class="btn" data-copy="{p["url"]}">{icon("link")} Copy link</button>
<button type="button" class="btn" data-share hidden>{icon("share")} Share</button>
<button type="button" class="btn" data-reader aria-pressed="false">{icon("book")} Reader mode</button>
</div>
<div class="tts" id="tts" role="region" aria-label="Listen to this post" hidden>
<button type="button" class="ib tts-pp" aria-label="Pause">{icon("pause")}{icon("play")}</button>
<button type="button" class="ib tts-stop" aria-label="Stop">{icon("stop")}</button>
<div class="tts-bar" aria-hidden="true"><span></span></div>
<label class="tts-rate"><span class="sr">Speed</span><select><option value="0.8">0.8×</option><option value="1" selected>1×</option><option value="1.2">1.2×</option><option value="1.5">1.5×</option></select></label>
<span class="tts-st" aria-live="polite"></span>
</div>
{series_box(p, posts)}
</header>
{cover}
<div class="prose" id="prose">
{p["html"]}
</div>
<footer class="post-f">
<p class="tags"><span class="sr">Tags:</span>{tag_links(p)}</p>
{share_bar(p)}
{author_box(a)}
</footer>
</article>
</div>
<div class="after">
{related(p, posts)}
{NEWSLETTER}
</div>
</main>
<button type="button" class="reader-exit" data-reader aria-pressed="true">{icon("x")} Exit reader mode</button>'''
    data = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'BlogPosting', '@id': p['url'] + '#post', 'headline': p['seo_title'], 'name': p['title'],
         'description': p['description'], 'url': p['url'], 'mainEntityOfPage': p['url'],
         'datePublished': p['date'], 'dateModified': p['updated'], 'inLanguage': 'en',
         'image': f'{SITE}/{p["og"]}', 'wordCount': p['words'], 'timeRequired': f'PT{p["mins"]}M',
         'articleSection': p['category'], 'keywords': ', '.join(p['tags']),
         'author': a['ld'], 'publisher': PUBLISHER,
         'isPartOf': {'@type': 'Blog', '@id': SITE + '/#blog', 'name': NAME, 'url': SITE + '/'}},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Blog', 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': p['category'], 'item': f'{SITE}/?category={slugify(p["category"])}'},
            {'@type': 'ListItem', 'position': 3, 'name': p['seo_title'], 'item': p['url']}]}]}
    extra = (f'<meta property="article:published_time" content="{p["date"]}">\n'
             f'<meta property="article:modified_time" content="{p["updated"]}">\n'
             f'<meta property="article:section" content="{esc(p["category"])}">\n'
             + ''.join(f'<meta property="article:tag" content="{esc(t)}">\n' for t in p['tags'])
             + f'<meta name="author" content="{esc(a["name"])}">\n' + ld(data))
    return page(f'{p["seo_title"]} | {NAME}', p['description'], p['url'], body, extra, 'article', p['og'], cls='is-post')


def home_page(posts):
    body = (f'<main id="main" class="home">\n<section class="hero mast">'
            f'<span class="m-rule" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M10 2v16M4 8h12"/></svg></span>'
            f'<h1><span class="m1">Verbum Domini</span> <em class="m2">Blog</em></h1><span class="m-rule" aria-hidden="true"></span>'
            f'<button type="button" class="search-fake" data-open="search" aria-haspopup="dialog">{icon("search")}<span>Search posts</span><kbd>/</kbd></button></section>\n'
            f'<p class="f-count" id="f-count" aria-live="polite"></p>\n'
            f'<ul class="cards" id="posts">{card(posts[0], True)}{"".join(card(p) for p in posts[1:])}</ul>\n'
            f'<p class="empty" id="empty" hidden>No posts match this tag. <button type="button" class="linkish" data-f="all">Show all posts</button></p>\n'
            f'{NEWSLETTER}\n</main>')
    data = {'@context': 'https://schema.org', '@type': 'Blog', '@id': SITE + '/#blog', 'name': NAME,
            'url': SITE + '/', 'description': HOME_DESC, 'inLanguage': 'en', 'publisher': PUBLISHER,
            'blogPost': [{'@type': 'BlogPosting', 'headline': p['seo_title'], 'url': p['url'],
                          'datePublished': p['date'], 'author': p['author']['ld']} for p in posts]}
    return page(HOME_TITLE, HOME_DESC, SITE + '/', body, ld(data), cls='is-home')


def author_page(a, posts):
    mine = [p for p in posts if p['author'] is a]
    body = (f'<main id="main" class="home">\n<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Blog</a></li><li><span aria-current="page">{esc(a["name"])}</span></li></ol></nav>'
            f'{author_box(a, False, "author big")}'
            f'<h2 class="sec-h">Posts by {esc(a["name"])}</h2><ul class="cards">{"".join(card(p) for p in mine)}</ul>\n</main>')
    data = {'@context': 'https://schema.org', '@type': 'ProfilePage', 'url': a['url'], 'mainEntity': a['ld']}
    desc = a['bio'][:155]
    return page(f'{a["name"]}, author at {NAME}', desc, a['url'], body, ld(data))


FEED_ICON = MAIN + '/icon-512.png'
FEEDS = [('Atom', 'feed.xml', 'application/atom+xml'), ('RSS', 'rss.xml', 'application/rss+xml'),
         ('JSON Feed', 'feed.json', 'application/feed+json')]


def stamp(d): return d + 'T12:00:00Z'
def rfc822(d): return datetime.date.fromisoformat(d).strftime('%a, %d %b %Y 12:00:00 +0000')


def feed_html(p):
    """The post as feed readers show it: absolute links, the cover first, no page-only parts."""
    h = re.sub(r'<a class="anchor"[^>]*>#</a>', '', p['html'])
    h = re.sub(r'href="#', f'href="{p["url"]}#', h)
    h = re.sub(r'(src|href)="/(?!/)', rf'\1="{SITE}/', h)
    h = h.replace(' loading="lazy"', '').replace(' decoding="async"', '')
    cover = ''
    if p.get('cover'):
        cap = f'<figcaption>{p.get("cover_caption", "")}</figcaption>' if p.get('cover_caption') else ''
        cover = f'<figure><img src="{SITE}/{p["cover"]}" alt="{esc(p.get("cover_alt", ""))}">{cap}</figure>'
    tail = (f'<hr><p>{p["mins"]} min read · <a href="{p["url"]}">Read this post on the {NAME}</a>'
            + (f' · Tags: {", ".join(esc(t) for t in p["tags"])}' if p['tags'] else '') + '</p>')
    return cover + h + tail


def media_size(path):
    return os.path.getsize(os.path.join(SRC, 'static', path))


def atom(posts):
    upd = stamp(max(p['updated'] for p in posts))
    def entry(p):
        a = p['author']
        cats = [f'<category term="{esc(p["category"])}" label="{esc(p["category"])}"/>'] + [f'<category term="{esc(t)}"/>' for t in p['tags']]
        thumb = f'<media:thumbnail url="{SITE}/{p["og"]}" width="1200" height="630"/>\n' if p.get('og') else ''
        return (f'<entry>\n<title>{esc(p["title"])}</title>\n<link rel="alternate" type="text/html" href="{p["url"]}"/>\n'
                f'<id>{p["url"]}</id>\n<published>{stamp(p["date"])}</published>\n<updated>{stamp(p["updated"])}</updated>\n'
                f'<author><name>{esc(a["name"])}</name><uri>{a["url"]}</uri></author>\n' + '\n'.join(cats) + '\n'
                f'{thumb}<summary type="text">{esc(p["description"])}</summary>\n'
                f'<content type="html" xml:base="{p["url"]}">{esc(feed_html(p))}</content>\n</entry>\n')
    return ('<?xml version="1.0" encoding="utf-8"?>\n'
            '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xml:lang="en">\n'
            f'<title>{NAME}</title>\n<subtitle>{esc(HOME_DESC)}</subtitle>\n<id>{SITE}/</id>\n<updated>{upd}</updated>\n'
            f'<link rel="alternate" type="text/html" href="{SITE}/"/>\n<link rel="self" type="application/atom+xml" href="{SITE}/feed.xml"/>\n'
            f'<icon>{SITE}/icon-192.png</icon>\n<logo>{FEED_ICON}</logo>\n<rights>Copyright {upd[:4]} Verbum Domini</rights>\n'
            + ''.join(entry(p) for p in posts) + '</feed>\n')


def rss(posts):
    def item(p):
        cats = ''.join(f'<category>{esc(c)}</category>\n' for c in [p['category']] + p['tags'])
        enc = ''
        if p.get('cover'):
            enc = (f'<enclosure url="{SITE}/{p["cover"]}" length="{media_size(p["cover"])}" type="image/jpeg"/>\n'
                   f'<media:content url="{SITE}/{p["og"]}" medium="image" type="image/jpeg" width="1200" height="630"/>\n')
        return (f'<item>\n<title>{esc(p["title"])}</title>\n<link>{p["url"]}</link>\n<guid isPermaLink="true">{p["url"]}</guid>\n'
                f'<pubDate>{rfc822(p["date"])}</pubDate>\n<dc:creator>{esc(p["author"]["name"])}</dc:creator>\n{cats}'
                f'<description>{esc(p["description"])}</description>\n<content:encoded>{esc(feed_html(p))}</content:encoded>\n{enc}</item>\n')
    last = max(p['updated'] for p in posts)
    return ('<?xml version="1.0" encoding="utf-8"?>\n'
            '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" '
            'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">\n<channel>\n'
            f'<title>{NAME}</title>\n<link>{SITE}/</link>\n<description>{esc(HOME_DESC)}</description>\n<language>en</language>\n'
            f'<lastBuildDate>{rfc822(last)}</lastBuildDate>\n<atom:link href="{SITE}/rss.xml" rel="self" type="application/rss+xml"/>\n'
            f'<image><url>{SITE}/icon-192.png</url><title>{NAME}</title><link>{SITE}/</link></image>\n'
            f'<copyright>Copyright {last[:4]} Verbum Domini</copyright>\n'
            + ''.join(item(p) for p in posts) + '</channel>\n</rss>\n')


def json_feed(posts):
    def item(p):
        it = {'id': p['url'], 'url': p['url'], 'title': p['title'], 'summary': p['description'],
              'content_html': feed_html(p), 'date_published': stamp(p['date']), 'date_modified': stamp(p['updated']),
              'tags': [p['category']] + p['tags'],
              'authors': [{'name': p['author']['name'], 'url': p['author']['url'], 'avatar': f'{SITE}/{p["author"]["avatar"]}'}],
              'language': 'en'}
        if p.get('cover'): it['image'] = f'{SITE}/{p["cover"]}'
        if p.get('og'): it['banner_image'] = f'{SITE}/{p["og"]}'
        return it
    return json.dumps({'version': 'https://jsonfeed.org/version/1.1', 'title': NAME, 'home_page_url': SITE + '/',
                       'feed_url': SITE + '/feed.json', 'description': HOME_DESC, 'icon': FEED_ICON,
                       'favicon': SITE + '/icon-192.png', 'language': 'en',
                       'authors': [{'name': 'Verbum Domini', 'url': MAIN + '/'}],
                       'items': [item(p) for p in posts]}, ensure_ascii=False, indent=1) + '\n'


def subscribe_page():
    from urllib.parse import quote
    atom_url = f'{SITE}/feed.xml'
    readers = [('Feedly', 'https://feedly.com/i/subscription/feed/' + quote(atom_url, safe='')),
               ('Inoreader', 'https://www.inoreader.com/?add_feed=' + quote(atom_url, safe='')),
               ('NewsBlur', 'https://www.newsblur.com/?url=' + quote(atom_url, safe='')),
               ('The Old Reader', 'https://theoldreader.com/feeds/subscribe?url=' + quote(atom_url, safe=''))]
    rows = ''.join(
        f'<li class="feed-row"><div><b>{n}</b><code>{SITE}/{f}</code></div>'
        f'<p class="feed-act"><button type="button" class="btn" data-copy="{SITE}/{f}">{icon("link")} Copy address</button>'
        f'<a class="btn" href="/{f}" type="{t}">Open</a></p></li>' for n, f, t in FEEDS)
    one = ''.join(f'<a class="btn" href="{esc(u)}" rel="noopener">{n}</a>' for n, u in readers)
    body = f'''<main id="main" class="home">
<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Blog</a></li><li><span aria-current="page">Subscribe</span></li></ol></nav>
<section class="hero sub-hero"><p class="kicker">Never miss a post</p><h1>Follow the blog</h1>
<p class="lede">Get every new post in your feed reader, in full, with no account, no tracking and no email needed. Or get updates by email with the form below.</p></section>
<section class="sub-card" aria-labelledby="one-h"><h2 id="one-h">One click</h2>
<p>Open the blog in a feed reader you already use:</p><p class="sub-btns">{one}</p>
<p class="sub-note">On iPhone, iPad and Mac, apps such as NetNewsWire and Reeder find the feed when you paste <code>{SITE}</code> into them.</p></section>
<section class="sub-card" aria-labelledby="addr-h"><h2 id="addr-h">Feed addresses</h2>
<p>Paste one into any feed reader. All three carry the full text of every post; most readers handle all of them.</p>
<ul class="feed-list">{rows}</ul></section>
<section class="sub-card" aria-labelledby="what-h"><h2 id="what-h">What is a feed?</h2>
<p>A feed is a list of new posts that a reader app checks for you. You choose what to follow, see posts in order, and nothing is decided by an algorithm. Free readers include Feedly, Inoreader and NetNewsWire.</p></section>
{NEWSLETTER}
</main>'''
    return page(f'Subscribe to the {NAME} (RSS, Atom, JSON Feed)', 'Follow the Verbum Domini Blog in any feed reader: RSS, Atom and JSON Feed addresses, with full posts and no tracking.',
                SITE + '/subscribe', body)


def search_index(posts):
    return json.dumps([{'t': p['title'], 'u': '/' + p['slug'], 'd': p['description'], 'c': p['category'],
                        'g': p['tags'], 'date': nice(p['date']), 'm': p['mins'],
                        'x': text(p['html'])[:6000]} for p in posts], ensure_ascii=False, separators=(',', ':'))


def main():
    authors = load_authors()
    files = sorted(f for f in os.listdir(os.path.join(SRC, 'posts')) if f.endswith('.md'))
    posts = [load(os.path.join(SRC, 'posts', f), authors) for f in files]
    posts = [p for p in posts if DRAFTS or p.get('draft') != 'true']
    posts.sort(key=lambda p: p['date'], reverse=True)
    if not posts: fail('no posts')
    shutil.rmtree(OUT, ignore_errors=True)
    shutil.copytree(os.path.join(SRC, 'static'), OUT)
    os.makedirs(os.path.join(OUT, 'authors'))

    def wr(name, s):
        with open(os.path.join(OUT, name), 'w', encoding='utf-8', newline='\n') as f: f.write(s)
    wr('index.html', home_page(posts))
    for p in posts: wr(p['slug'] + '.html', post_page(p, posts))
    used = [a for a in authors.values() if any(p['author'] is a for p in posts)]
    for a in used: wr(f'authors/{a["slug"]}.html', author_page(a, posts))
    wr('404.html', page(f'Page not found | {NAME}', 'This page does not exist.', SITE + '/404',
                        '<main id="main" class="home"><section class="hero"><h1>Page not found</h1><p class="lede">This page does not exist. '
                        '<a href="/">See all posts</a>, or search with the button at the top.</p></section></main>',
                        robots='<meta name="robots" content="noindex">\n'))
    last = max(p['updated'] for p in posts)
    urls = ([(SITE + '/', last)] + [(p['url'], p['updated']) for p in posts]
            + [(a['url'], max(p['updated'] for p in posts if p['author'] is a)) for a in used] + [(SITE + '/subscribe', last)])
    wr('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
       + ''.join(f'<url><loc>{u}</loc><lastmod>{d}</lastmod></url>\n' for u, d in urls) + '</urlset>\n')
    wr('robots.txt', f'User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n')
    wr('feed.xml', atom(posts))
    wr('rss.xml', rss(posts))
    wr('feed.json', json_feed(posts))
    wr('subscribe.html', subscribe_page())
    wr('search.json', search_index(posts))
    print(f'blog.py: {len(posts)} post(s) written to {os.path.relpath(OUT, os.path.dirname(ROOT))}')


main()
