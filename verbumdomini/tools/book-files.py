"""Writes the downloadable and printable copies of a book of the library from its reader text (app/books/<slug>.json):

  app/<slug>-print.html            the whole book on one page, to read and to print (Print button or the browser's print);
                                   in print each Book starts on a new page and chapters begin inside the text, so no page ends on a heading or a gap
  app/files/<FILE>.pdf             6 x 9 in, with a cover, a contents page with page numbers, bookmarks and page numbers
  app/files/<FILE>.epub            EPUB 3 (with an EPUB 2 table of contents too) for Apple Books, Google Play Books, Kobo,
                                   and Kindle through Amazon's Send to Kindle
  app/files/<FILE>.txt             plain text, one paragraph per line
  app/files/<FILE>.azw3            Kindle (KF8), made from the EPUB with Calibre's ebook-convert, for copying to a Kindle by USB

The PDF and the cover picture are made with Chromium (tools/book-files.mjs, Playwright), from the same page as the print copy.
The PDF is then checked: no empty page, no page that ends on a chapter heading, and no gap at the foot of a page
other than the last page of a Book.

Usage (from the repo root): python3 verbumdomini/tools/book-files.py confessions
Run it again after the book's text changes (python3 verbumdomini/tools/confessions.py first).
"""
import datetime, html, io, json, os, re, subprocess, sys, uuid, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, 'app')
SITE = 'https://verbumdomini.ca'
ROMAN = 'I II III IV V VI VII VIII IX X XI XII XIII XIV XV XVI XVII XVIII XIX XX'.split()
# Fonts the site already serves (Source Serif 4, upright and italic; Inter)
FONTS = {'serif': 'blob/4bfe23b7c2ace499db19046d6b4eebae.woff2', 'serif-i': 'blob/2c52a3fbeb2a626d9f45d2c964ff3c8f.woff2',
         'sans': 'blob/c52f40b52b7f8a012dcf46c83f2d2b2c.woff2'}
BOOKS = {
    'confessions': {
        'file': 'the-confessions-of-st-augustine', 'short': 'The Confessions', 'of': 'of St. Augustine',
        'author': 'Augustine of Hippo', 'translator': 'Edward Bouverie Pusey',
        'credit': 'Translated by E. B. Pusey', 'edition': 'In updated English',
        'about': ('St. Augustine wrote the Confessions around the year 400, a few years after he became bishop of Hippo in North Africa. '
                  'It is a long prayer to God: the story of his restless youth, his search for the truth, his conversion in a garden '
                  'in Milan and his baptism, followed by books on memory, time and creation.'),
        'text_note': ('This is E. B. Pusey’s translation (Oxford, 1838), which is in the public domain, with its old English updated by '
                      'verbumdomini.ca: “You” for “thou”, today’s verb endings and spelling. Pusey’s sentences are kept. '
                      'Chapters and sections follow the Latin edition, so “Confessions 10.27.38” is Book X, chapter 27, section 38; '
                      'section numbers are printed small at the start of each section.'),
        'art': 'art/w-augustine-800.jpg', 'pos': '62% 40%', 'subject': 'Christian spirituality; Autobiography; Conversion',
    },
}

slug = sys.argv[1] if len(sys.argv) > 1 else 'confessions'
B = BOOKS[slug]
bk = json.load(open(os.path.join(APP, 'books', f'{slug}.json'), encoding='utf-8'))
TITLE, PN = bk['t'], bk['pn']
FILE = B['file']
OUTD = os.path.join(APP, 'files')
os.makedirs(OUTD, exist_ok=True)
esc = html.escape
for v in list(B.values()) + [TITLE]:
    if isinstance(v, str) and '\u2014' in v: sys.exit('book-files: em dash in ' + v)


def parts():
    """Each part (Book): (number, title, summary, chapters); a chapter: (number, [(section, [blocks])]); a block: str or [lines]."""
    out = []
    for i, (secs, starts, (ti, su)) in enumerate(zip(bk['c'], bk['k'], bk['p'])):
        first = {s: c for s, c in starts}
        chs = []
        for n, s in enumerate(secs):
            sec = n + 1  # sections are numbered from 1 in each part
            if sec in first or not chs: chs.append((first.get(sec, 1), []))
            blocks = [p.split('\n') if '\n' in p else p for p in s.split('\n\n')]
            chs[-1][1].append((sec, blocks))
        if starts and starts[0][0] != 1: sys.exit('book-files: part %d does not start at section 1' % (i + 1))
        out.append((i + 1, ti, su, chs))
    return out


P = parts()
NSEC = sum(len(s) for _, _, _, c in P for _, s in c)
if NSEC != sum(len(x) for x in bk['c']): sys.exit('book-files: sections lost')


def hblocks(sec, blocks, first_of_part, chapter=None):
    """chapter: the chapter number when this section begins one (the print copy shows it at the start of the paragraph)."""
    out = []
    for j, b in enumerate(blocks):
        num = f'<span class="sn">{sec}</span>' if j == 0 else ''
        lead = f'<span class="chn" aria-hidden="true">Chapter {chapter}</span>' if j == 0 and chapter and not first_of_part else ''
        cls = ['open'] if first_of_part and j == 0 else []
        if lead: cls.append('cs')
        if isinstance(b, list): cls.append('poem')
        c = f' class="{" ".join(cls)}"' if cls else ''
        out.append(f'<p{c}>{lead}{num}' + ('<br/>'.join(esc(x) for x in b) if isinstance(b, list) else esc(b)) + '</p>')
    return out


# ---------- The page to read and print ----------
CSS = '''
@font-face{font-family:"Source Serif 4";font-style:normal;font-weight:200 900;font-display:swap;src:url(%(serif)s) format("woff2")}
@font-face{font-family:"Source Serif 4";font-style:italic;font-weight:200 900;font-display:swap;src:url(%(serif-i)s) format("woff2")}
@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;src:url(%(sans)s) format("woff2")}
:root{--bg:#f6f1e7;--page:#fffdf8;--tx:#2b2219;--mut:#6b5f50;--line:#e2d7c3;--ac:#7a2a2a;--gold:#8a6a14;--bar:rgb(246 241 231/.86);color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#111a28;--page:#172233;--tx:#ece5d6;--mut:#a7b0c0;--line:#2a3a55;--ac:#e0a2a2;--gold:#d9b26a;--bar:rgb(17 26 40/.86);color-scheme:dark}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%%;scroll-padding-top:72px}
body{margin:0;background:var(--bg);color:var(--tx);font:18px/1.75 "Source Serif 4",Georgia,serif;font-optical-sizing:auto;-webkit-font-smoothing:antialiased}
a{color:inherit}
.bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:8px;padding:10px 16px;background:var(--bar);backdrop-filter:blur(14px) saturate(1.6);-webkit-backdrop-filter:blur(14px) saturate(1.6);border-bottom:1px solid var(--line);font:500 14px/1.2 Inter,system-ui,sans-serif}
.bar .back{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border-radius:999px;text-decoration:none;color:var(--mut)}
.bar .back:hover{color:var(--tx);background:var(--line)}
.bar .ti{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-align:center;font-family:"Source Serif 4",Georgia,serif;font-style:italic;font-size:15px;color:var(--mut)}
.bar .b{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:var(--page);color:var(--tx);font:inherit;text-decoration:none;cursor:pointer}
.bar .b:hover{border-color:var(--mut)}
.bar .b.p{background:var(--ac);border-color:var(--ac);color:var(--page)}
.bar svg{width:16px;height:16px;flex:none}
@media (max-width:620px){.bar .ti{display:none}.bar .sp{flex:1}.bar .lbl{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.bar .b{padding:8px 11px}}
@media (min-width:621px){.bar .sp{display:none}}
main{max-width:46rem;margin:0 auto;padding:0 16px 96px}
.sheet{background:var(--page);border:1px solid var(--line);border-radius:14px;margin-top:28px;padding:clamp(24px,6vw,72px) clamp(20px,7vw,80px)}
.cover-pg{display:none}
.title-pg{text-align:center;padding:40px 0 24px}
.title-pg .k{font:600 12px/1 Inter,system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:var(--gold)}
.title-pg h1{margin:22px 0 0;font-size:clamp(44px,9vw,64px);line-height:1.02;font-weight:600;letter-spacing:-.02em}
.title-pg .of{display:block;margin-top:8px;font-size:.5em;font-style:italic;font-weight:400;letter-spacing:0}
.rule{width:56px;height:1px;margin:28px auto;background:var(--gold);opacity:.8}
.title-pg .tr{margin:0;font-size:17px;color:var(--mut)}
.title-pg .tr i{display:block}
.title-pg .pub{margin:44px 0 0;font:500 13px/1 Inter,system-ui,sans-serif;letter-spacing:.06em;color:var(--mut)}
.front h2{margin:0 0 18px;font:600 12px/1 Inter,system-ui,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);text-align:center}
.toc{list-style:none;margin:0;padding:0}
.toc li{margin:0;border-top:1px solid var(--line)}
.toc li:last-child{border-bottom:1px solid var(--line)}
.toc a{display:flex;align-items:baseline;gap:14px;padding:11px 2px;text-decoration:none}
.toc a:hover .t{color:var(--ac)}
.toc .n{flex:none;min-width:6.6em;white-space:nowrap;font:600 11px/1 Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.toc .t{flex:1;font-size:18px;line-height:1.35}
.toc .pg{flex:none;font-variant-numeric:tabular-nums;color:var(--mut)}
.toc .pg:empty{display:none}
.about p{margin:0 0 1em;font-size:16px;line-height:1.65;color:var(--mut)}
.about{margin:8px 0 52px;padding-top:28px;border-top:1px solid var(--line)}
.part{margin-top:28px}
.part-h{text-align:center;padding:24px 0 8px}
.part-h .k{display:block;font:600 12px/1 Inter,system-ui,sans-serif;letter-spacing:.26em;text-transform:uppercase;color:var(--gold)}
.part-h h2{margin:14px 0 0;font-size:clamp(30px,6vw,40px);line-height:1.12;font-weight:600;letter-spacing:-.015em;text-wrap:balance}
.part-h .su{max-width:30em;margin:16px auto 0;font-size:16px;line-height:1.6;font-style:italic;color:var(--mut);text-wrap:pretty}
.part-h .rule{margin:26px auto 18px}
.ch{margin:2.2em 0 .9em;text-align:center;font:600 11px/1 Inter,system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:var(--gold)}
.part-h + .ch{margin-top:.6em}
.txt p{margin:0;text-align:justify;hyphens:auto;-webkit-hyphens:auto;text-wrap:pretty}
.txt p + p{text-indent:1.5em}
@media screen and (max-width:600px){.txt p{text-align:left;hyphens:manual;-webkit-hyphens:manual}}
.txt .ch + p,.txt .poem,.txt .poem + p{text-indent:0}
.txt .poem{margin:.7em 0 .7em 1.5em;text-align:left;font-style:italic}
.txt .poem + p{margin-top:.7em}
.chn{display:none}
.sn{margin-right:.3em;font:600 .58em/1 Inter,system-ui,sans-serif;vertical-align:.45em;color:var(--gold);font-style:normal}
.txt p.open::first-letter{float:left;margin:.08em .1em 0 0;font-size:3.35em;line-height:.8;font-weight:600;color:var(--ac)}
.txt p.open .sn{display:none}
.end{margin:3em 0 0;text-align:center;font-size:20px;color:var(--gold);letter-spacing:.6em}
.colophon{margin-top:28px;text-align:center;font:13px/1.6 Inter,system-ui,sans-serif;color:var(--mut)}
.top{position:fixed;right:16px;bottom:16px;width:44px;height:44px;display:grid;place-items:center;border-radius:50%%;border:1px solid var(--line);background:var(--page);color:var(--mut);text-decoration:none;font:20px/1 Inter,system-ui,sans-serif;box-shadow:0 6px 18px -8px rgb(0 0 0/.4)}
@media print{
  @page{margin:20mm 19mm 22mm;@bottom-center{content:counter(page);font:9pt "Source Serif 4",Georgia,serif;color:#6b5f50}}
  @page front{@bottom-center{content:none}}
  :root{--bg:#fff;--page:#fff;--tx:#1d1712;--mut:#5e5346;--line:#d9cdb8;--ac:#6e2323;--gold:#7a5c0c;color-scheme:light}
  body{font-size:11pt;line-height:1.5;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .bar,.top,.colophon{display:none}
  main{max-width:none;margin:0;padding:0}
  .sheet{margin:0;padding:0;border:0;border-radius:0;background:none}
  .front{page:front}
  .title-pg{padding:22vh 0 0}
  .title-pg h1{font-size:40pt}
  .title-pg .tr{font-size:12pt}
  .title-pg .pub{margin-top:30pt}
  .toc a{padding:6pt 0}
  .toc .t{font-size:12pt}
  .about{margin:0;padding:34pt 8%% 0;border:0;text-align:center}
  .contents{break-before:page}
  .about p{margin-bottom:.7em;font-size:8.6pt;line-height:1.5}
  .part{margin:0;break-before:page}
  .part-h{padding:14vh 0 4pt;break-inside:avoid;break-after:avoid}
  .part-h h2{font-size:24pt}
  .part-h .su{font-size:10.5pt}
  .part-h .rule{margin:16pt auto 10pt}
  /* Chapters begin inside the text (a label at the start of the paragraph), so a page never ends on a heading
     and never leaves a gap */
  .ch{display:none}
  .txt > .ch:first-child{display:block;margin:0 0 8pt;font-size:7.5pt}
  .txt p{orphans:2;widows:2}
  .txt p.cs{margin-top:.75em;text-indent:0}
  .chn{display:inline;margin-right:.55em;font:600 7pt/1 Inter,system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
  .txt .poem{break-inside:avoid}
  .end{margin-top:22pt;font-size:13pt}
  a{text-decoration:none}
}
''' % FONTS


def page_html():
    toc = ''.join(f'<li><a href="#book-{n}"><span class="n">{PN} {ROMAN[n - 1]}</span><span class="t">{esc(ti)}</span>'
                  f'<span class="pg" data-p="{n}"></span></a></li>' for n, ti, _, _ in P)
    body = []
    for n, ti, su, chs in P:
        body.append(f'<section class="part" id="book-{n}" aria-labelledby="book-{n}-h"><header class="part-h"><span class="k">{PN} {ROMAN[n - 1]}</span>'
                    f'<h2 id="book-{n}-h">{esc(ti)}</h2><p class="su">{esc(su)}</p><div class="rule"></div></header><div class="txt">')
        for ci, (ch, secs) in enumerate(chs):
            body.append(f'<h3 class="ch" id="c{n}-{ch}">Chapter {ch}</h3>')
            for si, (sec, blocks) in enumerate(secs):
                body += hblocks(sec, blocks, ci == 0 and si == 0, ch if si == 0 else None)
        body.append('</div></section>')
    ic = lambda d: f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'
    desc = f'{TITLE}, complete, on one page to read and print. {B["credit"]}, {B["edition"].lower()}.'
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{esc(TITLE)}: Read and Print · verbumdomini.ca</title>
<meta name="description" content="{esc(desc)}"/>
<link rel="canonical" href="{SITE}/{slug}-print.html"/>
<link rel="icon" href="/favicon.ico" sizes="any"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<meta name="theme-color" content="#f6f1e7"/>
<style>{CSS}</style>
</head>
<body>
<nav class="bar" aria-label="Book">
<a class="back" href="/free-ebooks.html">{ic('<path d="M15 18l-6-6 6-6"/>')}<span class="lbl">Free e-Books</span></a>
<span class="ti">{esc(TITLE)}</span><span class="sp"></span>
<a class="b" href="#contents">{ic('<path d="M4 6h16M4 12h16M4 18h10"/>')}<span class="lbl">Contents</span></a>
<a class="b" href="files/{FILE}.pdf" download="">{ic('<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>')}<span class="lbl">PDF</span></a>
<button class="b p" type="button" id="print">{ic('<path d="M7 9V4h10v5M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2"/><path d="M7 14h10v6H7z"/>')}<span class="lbl">Print</span></button>
</nav>
<main id="top">
<article class="sheet">
<div class="front">
<section class="cover-pg" aria-hidden="true"></section>
<header class="title-pg">
<p class="k">{esc(B['author'])}</p>
<h1>{esc(B['short'])}<span class="of">{esc(B['of'])}</span></h1>
<div class="rule"></div>
<p class="tr">{esc(B['credit'])}<i>{esc(B['edition'])}</i></p>
<p class="pub">verbumdomini.ca</p>
</header>
<div class="about"><p>{esc(B['about'])}</p><p>{esc(B['text_note'])}</p></div>
<nav class="contents" id="contents" aria-labelledby="contents-h"><h2 id="contents-h">Contents</h2><ol class="toc">{toc}</ol></nav>
</div>
{"".join(body)}
<p class="end" aria-hidden="true">✠</p>
</article>
<p class="colophon">From <a href="/free-ebooks.html">Free e-Books</a> at verbumdomini.ca · Also in <a href="files/{FILE}.pdf" download="">PDF</a>, <a href="files/{FILE}.epub" download="">EPUB</a>, <a href="files/{FILE}.azw3" download="">Kindle</a> and <a href="files/{FILE}.txt" download="">plain text</a> · <a href="/{slug}.html">Read in the app</a></p>
</main>
<a class="top" href="#top" aria-label="Back to top">↑</a>
<script>document.getElementById('print').addEventListener('click',function(){{window.print()}});
if(/[?&]print\b/.test(location.search))document.fonts.ready.then(function(){{setTimeout(function(){{window.print()}},400)}});</script>
</body>
</html>
'''


open(os.path.join(APP, f'{slug}-print.html'), 'w', encoding='utf-8', newline='\n').write(page_html())

# ---------- Plain text ----------
t = [TITLE.upper(), '', f'{B["credit"]}. {B["edition"]}.', f'verbumdomini.ca/{slug}.html', '', '',
     'CONTENTS', '']
t += [f'  {PN} {ROMAN[n - 1]:<6} {ti}' for n, ti, _, _ in P]
t += ['', '', 'ABOUT THIS EDITION', '', B['about'], '', B['text_note'].replace('; section numbers are printed small at the start of each section', ''), '']
for n, ti, su, chs in P:
    t += ['', '', '*' * 40, '', f'{PN.upper()} {ROMAN[n - 1]}', ti.upper(), '', su, '', '*' * 40, '']
    for ch, secs in chs:
        t += ['', f'Chapter {ch}', '']
        for sec, blocks in secs:
            for b in blocks:
                t += (['    ' + x for x in b] if isinstance(b, list) else [b]) + ['']
t += ['', 'END OF THE CONFESSIONS' if slug == 'confessions' else 'THE END', '']
open(os.path.join(OUTD, f'{FILE}.txt'), 'w', encoding='utf-8', newline='\n').write('\n'.join(t))

# ---------- Cover picture and PDF (Chromium) ----------
import pypdfium2, pypdf
MJS = os.path.join(ROOT, 'tools', 'book-files.mjs')
def chromium(*a):
    r = subprocess.run(['node', MJS, *a], capture_output=True, text=True)
    if r.returncode: sys.exit('book-files: Chromium step failed:\n' + r.stdout + r.stderr)
cover = os.path.join(ROOT, 'tools', f'.{slug}-cover.jpg')
chromium('cover', APP, slug, json.dumps(B), cover)
pdf = os.path.join(OUTD, f'{FILE}.pdf')
def texts():
    doc = pypdfium2.PdfDocument(pdf)
    out = [doc[i].get_textpage().get_text_range().replace('\r', '') for i in range(len(doc))]
    doc.close()
    return out
chromium('pdf', APP, slug, json.dumps(dict(B, cover=cover)), '{}', pdf)
starts, flat = {}, [re.sub(r'\s', '', x) for x in texts()]
for n, ti, *_ in P:  # the first page after the contents with "BOOK I" and the part's title
    key = PN.upper() + ROMAN[n - 1] + re.sub(r'\s', '', ti)
    starts[str(n)] = next((i + 1 for i, x in enumerate(flat) if i > 2 and key in x), None)
starts = {k: v for k, v in starts.items() if v}
if len(starts) != len(P): sys.exit(f'book-files: found {len(starts)} part openings in the PDF, expected {len(P)}')
chromium('pdf', APP, slug, json.dumps(dict(B, cover=cover)), json.dumps(starts), pdf)
# the cover for the Free e-Books page, 600 x 900
from PIL import Image
Image.open(cover).resize((600, 900), Image.LANCZOS).save(os.path.join(APP, 'art', f'book-{slug}.jpg'), quality=84, optimize=True, progressive=True)
# Checks: no page ends on a chapter heading, and no page is empty (the cover has no text)
T = texts()
for i, tx in enumerate(T):
    lines = [re.sub(r'\s', '', x) for x in tx.split('\n') if x.strip() and not re.fullmatch(r'\d+', x.strip())]
    if i and not lines: sys.exit(f'book-files: page {i + 1} of the PDF is empty')
    if lines and re.fullmatch(r'CHAPTER\d+', lines[-1]): sys.exit(f'book-files: page {i + 1} of the PDF ends on a chapter heading')
doc = pypdfium2.PdfDocument(pdf)
ends = {v - 1 for v in starts.values()} | {len(doc)}
for i in range(3, len(doc)):
    tp = doc[i].get_textpage()
    low = min(tp.get_charbox(k)[1] for k in range(tp.count_chars()) if tp.get_charbox(k)[1] > 72)
    if i + 1 not in ends and low - .8 * 72 > 46: sys.exit(f'book-files: page {i + 1} of the PDF has a gap at the foot ({low - .8 * 72:.0f} pt)')
doc.close()
w = pypdf.PdfWriter(clone_from=pdf)
w.add_metadata({'/Title': TITLE, '/Author': B['author'], '/Subject': B['about'], '/Creator': 'verbumdomini.ca', '/Producer': 'verbumdomini.ca'})
w.page_mode = '/UseOutlines'
w.write(pdf)
print(f'PDF: {len(T)} pages; parts begin on pages', ', '.join(map(str, starts.values())))

# ---------- EPUB ----------
uid = 'urn:uuid:' + str(uuid.uuid5(uuid.NAMESPACE_URL, f'{SITE}/{slug}.html'))
mod = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
ECSS = '''@charset "utf-8";
body{margin:0 4%;font-family:serif;line-height:1.55;widows:2;orphans:2}
h1,h2,h3{font-weight:normal;text-align:center;hyphens:none;-webkit-hyphens:none;page-break-after:avoid;break-after:avoid}
.k{margin:0;text-align:center;font-family:sans-serif;font-size:.72em;letter-spacing:.2em;text-transform:uppercase;color:#7a5c0c}
.part-h{margin:3em 0 1.6em;page-break-inside:avoid}
.part-h h1{margin:.5em 0 0;font-size:1.7em;line-height:1.2;font-weight:bold}
.su{margin:1em 8% 0;text-indent:0;text-align:center;font-style:italic;font-size:.92em;color:#5e5346}
.rule{width:3em;margin:1.4em auto;border:0;border-top:1px solid #a88a45}
h3.ch{margin:1.8em 0 .7em;font-family:sans-serif;font-size:.7em;letter-spacing:.2em;text-transform:uppercase;color:#7a5c0c}
p{margin:0;text-indent:1.4em;text-align:justify;hyphens:auto;-webkit-hyphens:auto}
h3.ch + p,p.open,p.poem,p.poem + p{text-indent:0}
p.poem{margin:.7em 0 .7em 1.4em;text-align:left;font-style:italic}
p.poem + p{margin-top:.7em}
.sn{font-family:sans-serif;font-size:.6em;vertical-align:super;line-height:0;color:#7a5c0c;font-style:normal;margin-right:.25em}
p.open .sn{display:none}
.title{margin-top:22%;text-align:center}
.title h1{margin:.6em 0 0;font-size:2.4em;line-height:1.1;font-weight:bold}
.title .of{display:block;margin-top:.3em;font-size:.55em;font-style:italic;font-weight:normal}
.title p{text-indent:0;text-align:center}
.title .tr{color:#5e5346}
.title .pub{margin-top:3em;font-family:sans-serif;font-size:.8em;letter-spacing:.04em}
.about p{text-indent:0;margin:0 0 1em;font-size:.9em}
.about h1{font-size:1.2em;margin:2em 0 1em}
nav ol{list-style:none;padding:0;margin:0}
nav li{margin:.5em 0}
nav ol ol{display:none}
nav a{text-decoration:none}
nav h1{font-size:1.2em;margin:2em 0 1em}
.end{text-align:center;text-indent:0;margin-top:2em;color:#7a5c0c}
.cover{margin:0;padding:0;text-align:center}
.cover img{max-width:100%;max-height:100%}
'''


def xdoc(title, body, bodycls='', nav=False):
    ns = ' xmlns:epub="http://www.idpf.org/2007/ops"'
    cls = f' class="{bodycls}"' if bodycls else ''
    return (f'<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml"{ns} xml:lang="en" lang="en">\n'
            f'<head><meta charset="utf-8"/><title>{esc(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>\n'
            f'<body{cls}>\n{body}\n</body>\n</html>\n')


files = {}
files['cover.xhtml'] = xdoc('Cover', f'<div class="cover"><img src="cover.jpg" alt="{esc(TITLE)}"/></div>', 'cover')
files['title.xhtml'] = xdoc(TITLE, f'<section class="title" epub:type="titlepage"><p class="k">{esc(B["author"])}</p>'
                                   f'<h1>{esc(B["short"])}<span class="of">{esc(B["of"])}</span></h1><hr class="rule"/>'
                                   f'<p class="tr">{esc(B["credit"])}<br/><i>{esc(B["edition"])}</i></p><p class="pub">verbumdomini.ca</p></section>')
files['about.xhtml'] = xdoc('About this edition', f'<section class="about"><h1>About this edition</h1><p>{esc(B["about"])}</p>'
                                                  f'<p>{esc(B["text_note"])}</p><p>verbumdomini.ca</p></section>')
navli, ncx, order = [], [], 1
ncx.append(f'<navPoint id="np-title" playOrder="{order}"><navLabel><text>Title Page</text></navLabel><content src="title.xhtml"/></navPoint>'); order += 1
for n, ti, su, chs in P:
    name = f'book-{n:02d}.xhtml'
    body = [f'<section epub:type="chapter" aria-labelledby="h"><header class="part-h"><p class="k">{PN} {ROMAN[n - 1]}</p><h1 id="h">{esc(ti)}</h1>'
            f'<p class="su">{esc(su)}</p><hr class="rule"/></header>']
    sub = []
    for ci, (ch, secs) in enumerate(chs):
        body.append(f'<h3 class="ch" id="c{ch}">Chapter {ch}</h3>')
        sub.append(f'<li><a href="{name}#c{ch}">Chapter {ch}</a></li>')
        for si, (sec, blocks) in enumerate(secs):
            body += hblocks(sec, blocks, ci == 0 and si == 0)
    if n == len(P): body.append('<p class="end">✠</p>')
    body.append('</section>')
    files[name] = xdoc(f'{PN} {ROMAN[n - 1]}: {ti}', '\n'.join(body))
    navli.append(f'<li><a href="{name}">{PN} {ROMAN[n - 1]}: {esc(ti)}</a><ol>{"".join(sub)}</ol></li>')
    ncx.append(f'<navPoint id="np-{n}" playOrder="{order}"><navLabel><text>{PN} {ROMAN[n - 1]}: {esc(ti)}</text></navLabel><content src="{name}"/></navPoint>'); order += 1
navli.append('<li><a href="about.xhtml">About this edition</a></li>')
ncx.append(f'<navPoint id="np-about" playOrder="{order}"><navLabel><text>About this edition</text></navLabel><content src="about.xhtml"/></navPoint>')
files['nav.xhtml'] = xdoc('Contents', f'<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>{"".join(navli)}</ol></nav>\n'
                                      '<nav epub:type="landmarks" hidden="hidden"><ol><li><a epub:type="cover" href="cover.xhtml">Cover</a></li>'
                                      '<li><a epub:type="toc" href="nav.xhtml">Contents</a></li><li><a epub:type="bodymatter" href="book-01.xhtml">Start reading</a></li></ol></nav>')
files['toc.ncx'] = ('<?xml version="1.0" encoding="utf-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head>'
                    f'<meta name="dtb:uid" content="{uid}"/><meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head>'
                    f'<docTitle><text>{esc(TITLE)}</text></docTitle><navMap>{"".join(ncx)}</navMap></ncx>\n')
files['style.css'] = ECSS
spine = ['cover.xhtml', 'title.xhtml', 'nav.xhtml'] + [f'book-{n:02d}.xhtml' for n, *_ in P] + ['about.xhtml']
man = ''.join(f'<item id="x{i}" href="{f}" media-type="application/xhtml+xml"{" properties=\"nav\"" if f == "nav.xhtml" else ""}/>' for i, f in enumerate(spine))
opf = f'''<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="en">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="uid">{uid}</dc:identifier>
<dc:title>{esc(TITLE)}</dc:title>
<dc:creator id="au">{esc(B['author'])}</dc:creator>
<meta refines="#au" property="role" scheme="marc:relators">aut</meta>
<dc:contributor id="tr">{esc(B['translator'])}</dc:contributor>
<meta refines="#tr" property="role" scheme="marc:relators">trl</meta>
<dc:publisher>verbumdomini.ca</dc:publisher>
<dc:language>en</dc:language>
<dc:subject>{esc(B['subject'])}</dc:subject>
<dc:description>{esc(B['about'])}</dc:description>
<dc:rights>Public domain. Updated English by verbumdomini.ca.</dc:rights>
<dc:source>{SITE}/{slug}.html</dc:source>
<meta property="dcterms:modified">{mod}</meta>
<meta name="cover" content="cover-img"/>
</metadata>
<manifest>
<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
<item id="css" href="style.css" media-type="text/css"/>
<item id="cover-img" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>
{man}
</manifest>
<spine toc="ncx">
{"".join(f'<itemref idref="x{i}"/>' for i in range(len(spine)))}
</spine>
<guide><reference type="cover" title="Cover" href="cover.xhtml"/><reference type="toc" title="Contents" href="nav.xhtml"/><reference type="text" title="Start reading" href="book-01.xhtml"/></guide>
</package>
'''
ep = os.path.join(OUTD, f'{FILE}.epub')
with zipfile.ZipFile(ep, 'w') as z:
    z.writestr(zipfile.ZipInfo('mimetype'), 'application/epub+zip', compress_type=zipfile.ZIP_STORED)
    z.writestr('META-INF/container.xml', '<?xml version="1.0" encoding="utf-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
               '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>\n', zipfile.ZIP_DEFLATED)
    z.writestr('OEBPS/content.opf', opf, zipfile.ZIP_DEFLATED)
    for f, s in files.items(): z.writestr('OEBPS/' + f, s, zipfile.ZIP_DEFLATED)
    z.write(cover, 'OEBPS/cover.jpg', zipfile.ZIP_STORED)
os.remove(cover)

# ---------- Kindle (AZW3) ----------
# Made from the EPUB with Calibre's ebook-convert (apt-get install calibre). Without it, the last AZW3 is kept.
import shutil as _sh
azw = os.path.join(OUTD, f'{FILE}.azw3')
if _sh.which('ebook-convert'):
    r = subprocess.run(['ebook-convert', ep, azw, '--output-profile', 'kindle_pw3', '--no-inline-toc',
                        '--chapter-mark', 'none', '--page-breaks-before', '/'], capture_output=True, text=True)
    if r.returncode or not os.path.isfile(azw): sys.exit('book-files: ebook-convert failed:\n' + r.stdout[-2000:] + r.stderr[-2000:])
elif os.path.isfile(azw): print('book-files: ebook-convert not found; keeping the existing AZW3')
else: print('book-files: ebook-convert not found; no AZW3 written (apt-get install calibre)')
for f in (f'{FILE}.pdf', f'{FILE}.epub', f'{FILE}.txt', f'{FILE}.azw3'):
    if not os.path.isfile(os.path.join(OUTD, f)): continue
    print(f, f'{os.path.getsize(os.path.join(OUTD, f)) / 1e6:.2f} MB')
