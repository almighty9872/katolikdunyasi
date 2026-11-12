"""Writes the Confessions of Saint Augustine: the book's text for the reader (app/books/confessions.json), its
contents page (app/pages/confessions.html), and its entries in app/pages/index.json and app/pages/search.json,
from tools/confessions/text.json.

text.json: the 13 books, each a list of [chapter, section, blocks]; a block is a paragraph (string) or a
poem (list of lines). The text is E. B. Pusey's translation (1838, public domain) with the old forms updated
(thee and thou, -est and -eth, words like unto and whither, American spelling); Pusey's sentences are kept.
Pusey's paragraphs follow the section numbers of the Latin; chapters and sections follow the Latin edition, so
"Confessions 10.27.38" is Book 10, chapter 27, section 38.

The book is read in the same reader as the Bible (bkInit in app/index.html): one Book of the Confessions is one
page of the reader, and its sections are numbered like verses, so highlights, bookmarks, notes, the ribbon,
read progress and the reading tools all work as in the Bible. Addresses: /confessions.html#10 (Book X),
/confessions.html#10/38 (section 38). Older chapter anchors (#c10-27, #book-10) still open the right place, and
links elsewhere on the site use <a class="cfref" data-a="c10-27" href="#confessions">, which opens a popup.

books/<slug>.json, the format for every book of the library read this way:
  t: short title; ti: full title; a: author; pn: name of a part ("Book"); cite: how a copied passage is credited;
  src: a line on the source; p: [[title, summary], ...] one per part;
  c: [[section, ...], ...] one list per part, a section is a string (paragraphs split by a blank line, the lines
     of a poem by a single line break); k: [[[section, chapter], ...], ...] the sections where each chapter begins.
A new book: write its JSON in this format and a contents page like this one, add its slug to BKS in
app/index.html and to SUBS in tools/build-app.py.
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
def sec_text(blocks):
    return '\n\n'.join(typo(x) if isinstance(x, str) else '\n'.join(typo(l.strip()) for l in x) for x in blocks)
first = {}  # (book, chapter) -> the section where the chapter begins
for b, secs in enumerate(books, 1):
    for c, sec, blocks in secs:
        first.setdefault((b, c), sec)
book = {'t': 'Confessions', 'ti': TITLE, 'a': 'Saint Augustine', 'pn': 'Book', 'cite': 'Saint Augustine, Confessions, tr. Pusey',
        'src': 'Translation: Edward Bouverie Pusey, The Confessions of S. Augustine (Oxford, 1838), public domain, with its old English updated by Verbum Domini.',
        'p': [[t, s] for t, s in BOOKS],
        'c': [[sec_text(bl) for c, sec, bl in secs] for secs in books],
        'k': [[[sec, c] for (bb, c), sec in sorted(first.items()) if bb == b] for b in range(1, 14)]}
for b, secs in enumerate(books, 1):
    assert [sec for c, sec, bl in secs] == list(range(1, len(secs) + 1)), f'confessions: sections of book {b} are not 1..n'
bj = json.dumps(book, ensure_ascii=False, separators=(',', ':'))
if '—' in bj: raise SystemExit('confessions: em dash in the text')
os.makedirs(os.path.join(APP, 'books'), exist_ok=True)
open(os.path.join(APP, 'books', f'{SLUG}.json'), 'w', encoding='utf-8', newline='\n').write(bj)
out = ['''<style>
.bk-page .cf-toc{display:grid;gap:.5rem;margin:1rem 0 2rem;padding:0;list-style:none;counter-reset:none}
@media (min-width:640px){.bk-page .cf-toc{grid-template-columns:1fr 1fr}}
.bk-page .cf-toc li{margin:0;padding:0}
.bk-page .cf-toc a{position:relative;display:block;height:100%;padding:.75rem .9rem;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--tx);text-decoration:none;transition:border-color .15s}
.bk-page .cf-toc a:hover{border-color:var(--ac)}
.bk-page .cf-toc b{display:block;font-family:var(--font-sans,system-ui);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ac)}
.bk-page .cf-toc span{display:block;font-weight:600;margin:.1rem 0 .2rem}
.bk-page .cf-toc small{display:block;color:var(--mut);font-size:13.5px;line-height:1.45}
.bk-page .cf-toc i{position:absolute;top:.7rem;right:.8rem;display:flex;align-items:center;gap:5px;font:500 11.5px var(--font-sans,system-ui);font-style:normal;color:var(--mut)}
.bk-page .cf-toc a.rd i{color:var(--ac)}
.bk-page .cf-fam{margin:1rem 0 2rem;padding:0;list-style:none;display:grid;gap:.6rem}
.bk-page .cf-fam li{margin:0;padding:0}
.bk-page .cf-fam a{display:block;padding:.7rem .9rem;border-left:3px solid var(--ac);background:var(--card);border-radius:0 10px 10px 0;color:var(--tx);text-decoration:none}
.bk-page .cf-fam a:hover{background:var(--bg2)}
.bk-page .cf-fam b{display:block;font-size:14px}
.bk-page .cf-fam q{display:block;font-style:italic;color:var(--mut);font-size:15px;margin-top:.15rem;quotes:"“" "”"}
.bk-page .cf-fam i{font-style:normal;font-size:12px;color:var(--ac);font-family:var(--font-sans,system-ui)}
.bk-page .cf-src{margin-top:2rem;font-size:14px;color:var(--mut)}
</style>
<div class="wrap narrow bb-page bib-page bk-page" data-bk="confessions">
<header class="page-head center painted"><img alt="" class="ph-art" height="541" loading="lazy" src="art/w-augustine-800.jpg" width="800"/><div class="ph-text"><span class="page-ico"></span><p class="label">Saint Augustine of Hippo · written about 397 to 400</p><h1>The Confessions</h1><p class="sub">His life told to God, in thirteen books</p></div><p class="ph-cap">Vittore Carpaccio · <cite>The Vision of Saint Augustine</cite></p></header>
<div class="bib-intro body prose"><p>Saint Augustine wrote the <em>Confessions</em> soon after he became bishop of Hippo, in North Africa. It is the story of his restless search for truth, from his childhood to his conversion in a garden in Milan and his baptism, all of it spoken as a prayer to God. The last four books turn from his past to his present: memory, time, and the first chapter of Genesis. People have read it for sixteen centuries, and it is still one of the great books of the world.</p>
<p>This is the full text in Edward Bouverie Pusey’s translation of 1838. We have updated its old English (“You” for “Thou”, “has” for “hath”, “to” for “unto”) and kept his sentences. Each book opens in the reader, with the reading tools of our Bible: highlights, bookmarks and notes, listening, and your progress. The numbers are book, chapter and section, as the <em>Confessions</em> are usually cited: <a class="cfref" data-a="c10-27" href="#confessions">10.27</a> is Book X, chapter 27.</p></div>
<div class="bib-intro bib-ct-w"></div>
<div class="bib-intro bib-itl"></div>
<section aria-labelledby="cf-books" class="bib-sec"><h2 id="cf-books">The thirteen books</h2>
<ol class="cf-toc">''']
for i, (t, s) in enumerate(BOOKS):
    out.append(f'<li><a data-c="{i+1}" href="#{SLUG}/{i+1}"><b>Book {ROMAN[i]}</b><span>{E(t)}</span><small>{E(s)}</small></a></li>')
out.append('</ol></section>\n<section aria-labelledby="cf-famous" class="bib-sec"><h2 id="cf-famous">Famous passages</h2>\n<ul class="cf-fam">')
for b, c, t, q in FAMOUS:
    out.append(f'<li><a href="#{SLUG}/{b}/{first[(b, c)]}"><b>{E(t)}</b><q>{E(typo(q))}</q><i>{b}.{c}</i></a></li>')
out.append('</ul></section>')
out.append('<p class="bib-sec cf-src">Translation: Edward Bouverie Pusey, <cite>The Confessions of S. Augustine</cite> (Oxford, 1838), public domain, with its old English updated by Verbum Domini. '
           'Books, chapters and sections follow the Latin text. Read more about the author on our page on <a href="#saint-augustine">Saint Augustine</a>.</p>')
out.append('<div class="bib-read" id="bib-read" hidden></div>\n</div>\n')
page = '\n'.join(out)
if '—' in page: raise SystemExit('confessions: em dash in the page')
open(os.path.join(APP, 'pages', f'{SLUG}.html'), 'w', encoding='utf-8', newline='\n').write(page)
heads = [f'Book {ROMAN[b]}: {t}' for b, (t, s) in enumerate(BOOKS)]
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
print(f'confessions: page {len(page)} bytes, book {len(bj)} bytes, {sum(len(s) for s in books)} sections')
