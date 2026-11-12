"""Writes the Confessions of Saint Augustine page (app/pages/confessions.html) and its entries in
app/pages/index.json and app/pages/search.json, from tools/confessions/text.json.

text.json: the 13 books, each a list of [chapter, section, blocks]; a block is a paragraph (string) or a
poem (list of lines). The text is E. B. Pusey's translation (1838, public domain) with the old forms updated
(thee and thou, -est and -eth, words like unto and whither, American spelling); Pusey's sentences are kept.
Pusey's paragraphs follow the section numbers of the Latin; chapters and sections follow the Latin edition, so
"Confessions 10.27" is Book 10, chapter 27. Each chapter's anchor is c<book>-<chapter> (c10-27); links
elsewhere on the site use <a class="cfref" data-a="c10-27" href="#confessions">, which opens a popup.
Usage (from the repo root): python3 verbumdomini/tools/confessions.py, then build as usual.
"""
import html, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, 'app')
SLUG = 'confessions'
TITLE = 'The Confessions of Saint Augustine'
DESC = ('Saint Augustine’s Confessions, all thirteen books in E. B. Pusey’s translation in updated English: '
        'his restless youth, the garden in Milan, his baptism, Monica at Ostia, memory, time and creation.')
ROMAN = 'I II III IV V VI VII VIII IX X XI XII XIII'.split()
BOOKS = [
    ('Infancy and Boyhood', 'Augustine praises God, then looks back at his infancy and his schooldays: the beatings, the games, and his love of Latin stories over Greek lessons.'),
    ('The Stolen Pears', 'At sixteen, idle at home, he drifts into lust and joins a gang that steals pears only for the thrill of doing wrong. Why did he love the sin itself?'),
    ('Carthage', 'A student in Carthage, he loves the theater, reads Cicero’s Hortensius and starts to long for wisdom, then joins the Manichees. His mother Monica weeps for him and is told he will come back.'),
    ('Teacher and Friend', 'For nine years he teaches rhetoric and lives with a woman he has not married. The death of a close friend breaks him, and he writes his first book, on beauty.'),
    ('Faustus, Rome and Milan', 'The famous Manichee Faustus disappoints him. He slips away to Rome, then takes a post in Milan, where he goes to hear Bishop Ambrose preach.'),
    ('Ambrose and Alypius', 'Monica follows him to Milan. Ambrose’s sermons clear away his objections to Scripture, his friend Alypius is caught by the games, and a marriage is arranged for him.'),
    ('Finding God', 'Books of the Platonists show him that God is spirit and that evil is not a thing but a lack of good. Only in Christ, the humble Word made flesh, does he find the way.'),
    ('Take Up and Read', 'The stories of Victorinus and Saint Antony shake him. In a garden in Milan, torn between two wills, he hears a child chanting “Take up and read” and gives himself to Christ.'),
    ('Baptism and Monica', 'He gives up teaching, is baptized by Ambrose at Easter 387, and shares a glimpse of heaven with his mother at Ostia, days before she dies.'),
    ('Memory', 'Now a bishop, he asks not what he was but what he is. He searches the vast halls of memory for God and looks honestly at the temptations he still faces.'),
    ('Time and Eternity', 'On the first words of Genesis: what was God doing before He made heaven and earth? Augustine asks what time is, and finds it in the stretching of the mind.'),
    ('Heaven and Earth', 'On “In the beginning God made heaven and earth”: formless matter, the heaven of heavens, and how one verse of Scripture can hold many true meanings.'),
    ('The Days of Creation', 'The six days of Genesis read as a picture of the Church, ending in the rest of the seventh day, which has no evening.'),
]
# Famous passages: (book, chapter, title, a line from it)
FAMOUS = [
    (1, 1, 'Our heart is restless', 'You made us for Yourself, and our heart is restless, until it repose in You.'),
    (2, 4, 'The stolen pears', 'I loved my own fault, not that for which I was faulty, but my fault itself.'),
    (3, 4, 'Cicero’s Hortensius', 'This book altered my affections, and turned my prayers to Yourself O Lord.'),
    (4, 4, 'The death of a friend', 'At this grief my heart was utterly darkened; and whatever I beheld was death.'),
    (8, 7, '“But not yet”', 'Give me chastity and continency, only not yet.'),
    (8, 12, 'Take up and read', 'I heard from a neighboring house a voice, as of boy or girl, I know not, chanting, and often repeating, “Take up and read; Take up and read.”'),
    (9, 10, 'Monica at Ostia', 'We were discoursing then together, alone, very sweetly.'),
    (10, 27, 'Late have I loved You', 'Too late loved I You, O Beauty of ancient days, yet ever new! too late I loved You!'),
    (11, 14, 'What is time?', 'If no one asks me, I know: if I wish to explain it to one that asks, I know not.'),
]
E = lambda s: html.escape(s, quote=False)
def typo(s):
    # straight quotes to curly ones, as on the rest of the site
    s = re.sub(r"(^|[\s(\[—-])'", r'\1‘', s)
    s = s.replace("'", '’')
    s = re.sub(r'(^|[\s(\[—-])"', r'\1“', s)
    return s.replace('"', '”')
books = json.load(open(os.path.join(ROOT, 'tools', 'confessions', 'text.json'), encoding='utf-8'))
text = {}  # "10.27" -> plain text of the chapter
for b, secs in enumerate(books, 1):
    for c, s, blocks in secs:
        text.setdefault(f'{b}.{c}', []).extend(x if isinstance(x, str) else ' / '.join(x) for x in blocks)
for b, c, t, q in FAMOUS:
    plain = typo(' '.join(text[f'{b}.{c}'])).replace('But this book', 'This book')
    if typo(q).rstrip('.') not in plain: raise SystemExit(f'confessions: famous passage {b}.{c} not found: {q}')
out = ['''<style>
.cf-page .cf-intro{margin-bottom:1.5rem}
.cf-toc{display:grid;gap:.5rem;margin:1rem 0 2rem;padding:0;list-style:none}
@media (min-width:640px){.cf-toc{grid-template-columns:1fr 1fr}}
.cf-toc a{display:block;height:100%;padding:.75rem .9rem;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--tx);text-decoration:none;transition:border-color .15s}
.cf-toc a:hover{border-color:var(--ac)}
.cf-toc b{display:block;font-family:var(--font-sans,system-ui);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ac)}
.cf-toc span{display:block;font-weight:600;margin:.1rem 0 .2rem}
.cf-toc small{display:block;color:var(--mut);font-size:13.5px;line-height:1.45}
.cf-fam{margin:1rem 0 2rem;padding:0;list-style:none;display:grid;gap:.6rem}
.cf-fam a{display:block;padding:.7rem .9rem;border-left:3px solid var(--ac);background:var(--card);border-radius:0 10px 10px 0;color:var(--tx);text-decoration:none}
.cf-fam a:hover{background:var(--bg2)}
.cf-fam b{display:block;font-size:14px}
.cf-fam q{display:block;font-style:italic;color:var(--mut);font-size:15px;margin-top:.15rem;quotes:"“" "”"}
.cf-fam i{font-style:normal;font-size:12px;color:var(--ac);font-family:var(--font-sans,system-ui)}
.cf-book{margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--line)}
.cf-book h2{margin-top:0}
.cf-bk{display:block;font-family:var(--font-sans,system-ui);font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ac);margin-bottom:.25rem}
.cf-sum{color:var(--mut);font-style:italic}
.cf-ch{position:relative;scroll-margin-top:5rem}
.cf-ch:target,.cf-ch.hit{background:color-mix(in srgb,var(--ac) 7%,transparent);border-radius:8px}
.cf-n{float:left;min-width:1.9em;margin:.2em .5em 0 0;padding:.05em .3em;border-radius:6px;background:var(--bg2);color:var(--ac);font-family:var(--font-sans,system-ui);font-size:12px;font-weight:600;text-align:center;text-decoration:none;line-height:1.6}
.cf-n:hover{background:var(--acbg,var(--bg2))}
.cf-v{margin-left:1.5rem;font-style:italic}
.cf-pn{display:flex;justify-content:space-between;gap:1rem;margin-top:1.5rem;font-size:14px}
.cf-pn a{text-decoration:none}
.cf-src{margin-top:3rem;font-size:14px;color:var(--mut)}
</style>
<div class="wrap narrow cf-page">
<header class="page-head center painted"><img alt="" class="ph-art" height="541" loading="lazy" src="art/w-augustine-800.jpg" width="800"/><div class="ph-text"><span class="page-ico"></span><p class="label">Saint Augustine of Hippo · written about 397 to 400</p><h1>The Confessions</h1><p class="sub">His life told to God, in thirteen books</p></div><p class="ph-cap">Vittore Carpaccio · <cite>The Vision of Saint Augustine</cite></p></header>
<div class="body prose">
<div class="cf-intro"><p>Saint Augustine wrote the <em>Confessions</em> soon after he became bishop of Hippo, in North Africa. It is the story of his restless search for truth, from his childhood to his conversion in a garden in Milan and his baptism, all of it spoken as a prayer to God. The last four books turn from his past to his present: memory, time, and the first chapter of Genesis. People have read it for sixteen centuries, and it is still one of the great books of the world.</p>
<p>This is the full text in Edward Bouverie Pusey’s translation of 1838. We have updated its old English (“You” for “Thou”, “has” for “hath”, “to” for “unto”) and kept his sentences. The numbers are the book and chapter, as the <em>Confessions</em> are usually cited: <a class="cfref" data-a="c10-27" href="#confessions">10.27</a> is Book X, chapter 27.</p></div>
<h2 id="cf-books">The thirteen books</h2>
<nav aria-label="Books" class="sec-nav cf-nav"><ol class="cf-toc">''']
for i, (t, s) in enumerate(BOOKS):
    out.append(f'<li><a data-a="book-{i+1}" href="#{SLUG}"><b>Book {ROMAN[i]}</b><span>{E(t)}</span><small>{E(s)}</small></a></li>')
out.append('</ol></nav>\n<h2 id="cf-famous">Famous passages</h2>\n<ul class="cf-fam">')
for b, c, t, q in FAMOUS:
    out.append(f'<li><a data-a="c{b}-{c}" href="#{SLUG}"><b>{E(t)}</b><q>{E(typo(q))}</q><i>{b}.{c}</i></a></li>')
out.append('</ul>')
heads = []
for b, secs in enumerate(books, 1):
    t, s = BOOKS[b - 1]
    heads.append(f'Book {ROMAN[b-1]}: {t}')
    out.append(f'<section class="cf-book" id="book-{b}"><h2><span class="cf-bk">Book {ROMAN[b-1]}</span>{E(t)}</h2><p class="cf-sum">{E(s)}</p>')
    last = None
    for c, sec, blocks in secs:
        if c != last:
            if last is not None: out.append('</div>')
            out.append(f'<div class="cf-ch" id="c{b}-{c}">')
        for k, x in enumerate(blocks):
            num = f'<a aria-label="Book {ROMAN[b-1]}, chapter {c}" class="cf-n" data-a="c{b}-{c}" href="#{SLUG}">{c}</a>' if c != last and k == 0 else ''
            if isinstance(x, str): out.append(f'<p>{num}{E(typo(x))}</p>')
            else: out.append(f'<p class="cf-v">{num}' + '<br/>'.join(E(typo(l.strip())) for l in x) + '</p>')
        last = c
    out.append('</div>')
    prev = f'<a data-a="book-{b-1}" href="#{SLUG}">← Book {ROMAN[b-2]}</a>' if b > 1 else '<span></span>'
    nxt = f'<a data-a="book-{b+1}" href="#{SLUG}">Book {ROMAN[b]} →</a>' if b < 13 else '<span></span>'
    out.append(f'<nav aria-label="Books" class="cf-pn">{prev}<a data-a="cf-books" href="#{SLUG}">All books</a>{nxt}</nav></section>')
out.append('<p class="cf-src">Translation: Edward Bouverie Pusey, <cite>The Confessions of S. Augustine</cite> (Oxford, 1838), public domain, with its old English updated by Verbum Domini. '
           'Books, chapters and sections follow the Latin text. Read more about the author on our page on <a href="#saint-augustine">Saint Augustine</a>.</p>')
out.append('</div>\n</div>\n')
page = '\n'.join(out)
if '—' in page: raise SystemExit('confessions: em dash in the page')
open(os.path.join(APP, 'pages', f'{SLUG}.html'), 'w', encoding='utf-8', newline='\n').write(page)
# Site index: the page, then one search entry per book and per famous passage
plain = lambda h: html.unescape(re.sub(r'<[^>]+>', ' ', h))
n = len(re.sub(r'\s+', ' ', plain(page)))
P = os.path.join(APP, 'pages', 'index.json')
idx, me = json.load(open(P, encoding='utf-8')), {'s': SLUG, 't': TITLE, 'd': DESC, 'h': heads, 'n': n}
k = next((i for i, p in enumerate(idx) if p['s'] == SLUG), None)
if k is None: idx.append(me)
else: idx[k] = me
json.dump(idx, open(P, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False)
S = os.path.join(APP, 'pages', 'search.json')
srch = [r for r in json.load(open(S, encoding='utf-8')) if r[0] != SLUG]
rows = [[SLUG, '', TITLE, 0, 'Confessions of Saint Augustine. ' + DESC]]
for i, (t, s) in enumerate(BOOKS, 1):
    rows.append([SLUG, f'book-{i}', f'Confessions, Book {ROMAN[i-1]}: {t}', 0, s])
for b, c, t, q in FAMOUS:
    rows.append([SLUG, f'c{b}-{c}', f'Confessions {b}.{c}: {t.strip("“”")}', 0, typo(' '.join(text[f"{b}.{c}"]))])
k = next((i for i, r in enumerate(srch) if r[0] > SLUG), len(srch))
srch[k:k] = rows
json.dump(srch, open(S, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, separators=(',', ':'))
print(f'confessions: {len(page)} bytes, {sum(len(s) for s in books)} sections')
