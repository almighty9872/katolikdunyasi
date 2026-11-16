"""Writes the Confessions of St. Augustine: the book's text for the reader (app/books/confessions.json), its
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
  t: title; r: how references start ("St. Augustine, Confessions" 10.27.38); a: author; pn: name of a part ("Book");
  cite: how a copied passage is credited; ev: the label of the marked passages ("Treasured passage");
  src: a line on the source; p: [[title, summary], ...] one per part;
  c: [[section, ...], ...] one list per part, a section is a string (paragraphs split by a blank line, the lines
     of a poem by a single line break); k: [[[section, chapter], ...], ...] the sections where each chapter begins;
  e: [[[section, title, note], ...], ...] the marked passages of each part; w: [["form|form", meaning], ...] hard words
     (the first use in each part gets a small ring that shows the meaning; the list is tools/confessions/words.json).
A new book: write its JSON in this format and a contents page like this one, add its slug to BKS in
app/index.html and to SUBS in tools/build-app.py.
Usage (from the repo root): python3 verbumdomini/tools/confessions.py, then build as usual.
"""
import html, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, 'app')
SLUG = 'confessions'
TITLE = 'The Confessions of St. Augustine'
DESC = ('The Confessions of St. Augustine, all thirteen books in E. B. Pusey’s translation in updated English: '
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
# Treasured passages, marked in the reader like the major events in the Bible: (book, section, title, note, words that must be in the section)
TREASURED = [
    (1, 1, 'Our heart is restless', 'The opening prayer and the best-known line of the book: we were made for God, and nothing else will satisfy us.', 'our heart is restless'),
    (1, 6, 'Make room in my soul', 'Augustine asks God to enlarge his soul, repair it and make it clean, so that God can come in.', 'enlarge You it'),
    (2, 9, 'The pear tree', 'At sixteen he and his friends steal pears they don’t even want. He asks why he loved doing wrong for its own sake.', 'pear tree'),
    (3, 1, 'In love with loving', 'He arrives in Carthage as a student, hungry for love without knowing what he is really looking for.', 'in love with loving'),
    (3, 11, 'Closer than my inmost self', 'God was nearer to him than he was to himself, even while he searched everywhere else.', 'more inward to me than my most inward part'),
    (3, 19, 'Monica’s dream', 'His mother dreams she is standing on a wooden rule and is told that where she stands, her son will stand too.', 'rule'),
    (3, 21, 'The son of these tears', 'A bishop sends Monica home with words she never forgot: the son of these tears cannot be lost.', 'son of these tears'),
    (4, 9, 'The death of a friend', 'His closest friend dies, and everything he looks at speaks to him of death.', 'whatever I beheld was death'),
    (4, 11, 'Half of my soul', 'He borrows a poet’s words for his friend: they were one soul in two bodies.', 'half of my soul'),
    (4, 22, 'Man is a great deep', 'God counts the hairs on our head; our feelings and the beating of our heart are harder to count.', 'great deep'),
    (6, 3, 'Ambrose reading in silence', 'Augustine watches the bishop of Milan read without moving his lips, something few people did in those days.', 'his voice and tongue were at rest'),
    (7, 16, 'The food of grown men', 'He hears God say: you will not change Me into you, as food is changed; you will be changed into Me.', 'food of grown men'),
    (8, 17, 'Not yet', 'As a young man he prayed: give me chastity and self-control, but not yet.', 'only not yet'),
    (8, 27, 'Continence calls him', 'Self-control appears to him like a mother, surrounded by the many people who lived it by God’s grace.', 'chaste dignity of Continency'),
    (8, 28, 'Why not now?', 'Weeping under a fig tree, he asks how much longer it will be “tomorrow, and tomorrow”.', 'Why not now'),
    (8, 29, 'Take up and read', 'A child’s voice, a page of Saint Paul, and the moment of his conversion.', 'Take up and read'),
    (9, 23, 'At the window in Ostia', 'Monica and Augustine talk about heaven at a window by the sea, and for a moment they reach it.', 'alone, very sweetly'),
    (9, 27, 'Remember me at the altar', 'Dying, Monica asks for one thing only: that her sons remember her at the altar of the Lord.', 'altar'),
    (10, 8, 'What do I love when I love You?', 'Not the beauty of bodies or sweet music, but a light, a voice and a food for the soul.', 'what do I love, when I love You'),
    (10, 9, 'I asked the earth', 'He asks the earth, the sea and the sky, and they all answer: we are not your God; He made us.', 'I asked the earth'),
    (10, 12, 'The palaces of memory', 'Memory is a vast hall full of treasures, and he walks through it looking for God.', 'fields and spacious palaces'),
    (10, 38, 'Late have I loved You', 'The most famous prayer of the book: God was within him while he searched outside.', 'Too late loved I You'),
    (10, 40, 'Give what You command', 'His prayer for grace: give what You command, and command what You will.', 'Give what You enjoin'),
    (10, 50, 'A problem to myself', 'In God’s sight he has become a problem to himself.', 'problem to myself'),
    (11, 17, 'What is time?', 'If no one asks him, he knows; if he tries to explain it, he does not.', 'What then is time'),
    (13, 10, 'My weight is my love', 'Love carries him toward God, the way weight carries a stone down and fire up.', 'is my love'),
    (13, 50, 'The Sabbath without evening', 'The last prayer of the book: for the peace of the seventh day, which has no evening.', 'which has no evening'),
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
def sec_text(blocks):
    return '\n\n'.join(typo(x) if isinstance(x, str) else '\n'.join(typo(l.strip()) for l in x) for x in blocks)
first = {}  # (book, chapter) -> the section where the chapter begins
for b, secs in enumerate(books, 1):
    for c, sec, blocks in secs:
        first.setdefault((b, c), sec)
book = {'t': TITLE, 'r': 'St. Augustine, Confessions', 'a': 'St. Augustine', 'pn': 'Book', 'cite': 'St. Augustine, Confessions, tr. Pusey', 'ev': 'Treasured passage',
        'src': 'Translation: Edward Bouverie Pusey, The Confessions of S. Augustine (Oxford, 1838), public domain, with its old English updated by Verbum Domini.',
        'p': [[t, s] for t, s in BOOKS],
        'e': [[[sec, t, n] for bb, sec, t, n, q in TREASURED if bb == b] for b in range(1, 14)],
        'w': json.load(open(os.path.join(ROOT, 'tools', 'confessions', 'words.json'), encoding='utf-8')),
        'c': [[sec_text(bl) for c, sec, bl in secs] for secs in books],
        'k': [[[sec, c] for (bb, c), sec in sorted(first.items()) if bb == b] for b in range(1, 14)]}
for b, sec, t, n, q in TREASURED:
    if typo(q).lower() not in sec_text(books[b - 1][sec - 1][2]).replace('\n', ' ').lower(): raise SystemExit(f'confessions: treasured passage {b}.{sec} not found: {q}')
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
.bk-page .cf-tr{display:grid;gap:0 1.5rem;margin:.5rem 0 0;padding:0;list-style:none}
@media (min-width:640px){.bk-page .cf-tr{grid-template-columns:1fr 1fr}}
.bk-page .cf-tr li{margin:0;padding:0;border-bottom:1px solid var(--line)}
.bk-page .cf-tr a{display:flex;align-items:baseline;gap:.6rem;padding:.45rem .1rem;color:var(--tx);text-decoration:none;font-size:15.5px;line-height:1.35}
.bk-page .cf-tr a:hover{color:var(--ac)}
.bk-page .cf-tr i{flex:none;min-width:2.6em;font:600 11.5px var(--font-sans,system-ui);font-style:normal;color:var(--ac)}
.bk-page .cf-trm{margin:0 0 2rem}
.bk-page .cf-trm>summary{display:inline-block;margin-top:.6rem;cursor:pointer;font:500 14px var(--font-sans,system-ui);color:var(--ac)}
.bk-page .cf-trm[open]>summary{display:none}
.bk-page .cf-trm>.cf-tr{margin-top:0}
.bk-page .cf-src{margin-top:2rem;font-size:14px;color:var(--mut)}
</style>
<div class="wrap narrow bb-page bib-page bk-page" data-bk="confessions">
<header class="page-head center painted"><img alt="" class="ph-art" height="541" loading="lazy" src="art/w-augustine-800.jpg" width="800"/><div class="ph-text"><span class="page-ico"></span><p class="label">St. Augustine of Hippo · written about 397 to 400</p><h1>The Confessions of St. Augustine</h1><p class="sub">The full text, in thirteen books</p></div><p class="ph-cap">Vittore Carpaccio · <cite>The Vision of Saint Augustine</cite></p></header>
<div class="bib-intro body prose"><p>St. Augustine wrote the <em>Confessions</em> around 397 to 400, soon after he became bishop of Hippo in North Africa. He tells God the story of his life: his childhood, his years away from the faith, his conversion in a garden in Milan in 386, and his baptism. The last four books are about memory, time and the first chapter of Genesis.</p>
<p>This is Edward Bouverie Pusey’s translation of 1838. We changed its old forms (“You” for “Thou”, “has” for “hath”) and kept his sentences. Hard words are underlined: tap one to see what it means. The best-known passages are marked as treasured passages. References give book and chapter: <a class="cfref" data-a="c10-27" href="#confessions">10.27</a> is Book X, chapter 27.</p></div>
<div class="bib-intro bib-ct-w"></div>
<div class="bib-intro bib-itl"></div>
<section aria-labelledby="cf-books" class="bib-sec"><h2 id="cf-books">The thirteen books</h2>
<ol class="cf-toc">''']
for i, (t, s) in enumerate(BOOKS):
    out.append(f'<li><a data-c="{i+1}" href="#{SLUG}/{i+1}"><b>Book {ROMAN[i]}</b><span>{E(t)}</span><small>{E(s)}</small></a></li>')
out.append('</ol></section>\n<section aria-labelledby="cf-famous" class="bib-sec"><h2 id="cf-famous">Treasured passages</h2>')
chap = lambda b, sec: max(c for (bb, c), s0 in first.items() if bb == b and s0 <= sec)
# One short line each, in two columns; the first ten show, the rest open under "Show all"
tr = [f'<li><a href="#{SLUG}/{b}/{sec}" title="{E(n)}"><i>{b}.{chap(b, sec)}</i>{E(t)}</a></li>' for b, sec, t, n, q in TREASURED]
out.append('<ul class="cf-tr">' + ''.join(tr[:10]) + '</ul>')
out.append(f'<details class="cf-trm"><summary>Show all {len(tr)}</summary><ul class="cf-tr">' + ''.join(tr[10:]) + '</ul></details></section>')
out.append('<p class="bib-sec cf-src">Translation: Edward Bouverie Pusey, <cite>The Confessions of S. Augustine</cite> (Oxford, 1838), public domain, with its old English updated by Verbum Domini. '
           'Books, chapters and sections follow the Latin text. About the author: <a href="#saint-augustine">St. Augustine</a>.</p>')
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
rows = [[SLUG, '', TITLE, 0, DESC + ' The thirteen books: ' + '; '.join(f'Book {ROMAN[i]}, {t}' for i, (t, s) in enumerate(BOOKS)) + '.']]
for b, sec, t, n, q in TREASURED:
    rows.append([SLUG, f'c{b}-{chap(b, sec)}', t, 0, f'Confessions {b}.{chap(b, sec)}. {n} “{typo(q)}”'])
k = next((i for i, r in enumerate(srch) if r[0] > SLUG), len(srch))
srch[k:k] = rows
json.dump(srch, open(S, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, separators=(',', ':'))
print(f'confessions: page {len(page)} bytes, book {len(bj)} bytes, {sum(len(s) for s in books)} sections')
