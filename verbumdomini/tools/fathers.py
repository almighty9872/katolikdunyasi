"""Writes the Church Fathers' commentary on Genesis for the Bible reader: app/bible/fathers/genesis.json,
from tools/fathers/src.json (the three works split into their own numbered sections).

src.json was made once from the texts as printed (New Advent for Basil and Gregory, tertullian.org for Augustine):
  basil: {"I".."IX": {t: homily title, s: [[section, [paragraph, ...]], ...]}}
  gregory: {"I".."XXX": {t: chapter title, p: [[paragraph number, [paragraph]], ...]}}
  augustine: [{n: "3.6", h: heading or null, p: [paragraph, ...]}, ...]
Scripture references in the texts are written [[Genesis 1:1]]; the reader turns them into links.

Output: {w: {key: {n: Father, d: dates, w: work, a: about the work, img: portrait (credited on the Sources page), src: translation and source}},
         c: {chapter: [[first verse, last verse, work key, place in the work, our title, [paragraph, ...]], ...]}}
Each entry is one unit of the work (a section of a homily, a group of Augustine's sections, a chapter of Gregory),
placed at the verses it explains. The reader shows them beside the chapter (bibFathers in app/index.html).
Usage (from the repo root): python3 verbumdomini/tools/fathers.py, then build as usual.
"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = json.load(open(os.path.join(ROOT, 'tools/fathers/src.json'), encoding='utf-8'))

W = {
 'basil': {'n': 'St. Basil the Great', 'd': 'c. 330-379', 'w': 'Hexaemeron',
   'a': 'Nine homilies on the six days of creation, preached in Lent about 378 at Caesarea in Cappadocia, in the morning and evening, to a church full of working people.',
   'img': 'art/fathers/basil.jpg', 'src': 'Translated by Blomfield Jackson, Nicene and Post-Nicene Fathers, Second Series, vol. 8 (1895). Public domain.'},
 'augustine': {'n': 'St. Augustine', 'd': '354-430', 'w': 'The Literal Interpretation of Genesis: Unfinished Book',
   'a': 'Augustine’s first try, about 393, at reading Genesis as history rather than allegory. He asks more than he answers, and stopped at the creation of man.',
   'img': 'art/fathers/augustine.jpg', 'src': 'Translated by Isabella Image (2020), revision 4, released into the public domain.'},
 'gregory': {'n': 'St. Gregory of Nyssa', 'd': 'c. 335-395', 'w': 'On the Making of Man',
   'a': 'Written about 379 by Basil’s younger brother to finish the Hexaemeron, which had stopped before the creation of man.',
   'img': 'art/fathers/gregory.jpg', 'src': 'Translated by H. A. Wilson, Nicene and Post-Nicene Fathers, Second Series, vol. 5 (1893). Public domain.'},
}

# Basil: (homily, section, chapter, first verse, last verse, title)
B = [
 ('I',1,1,1,1,'Who tells us this: Moses'), ('I',2,1,1,1,'“In the beginning God”: against chance'),
 ('I',3,1,1,1,'What began will also end'), ('I',4,1,1,1,'They measured the stars and missed their Maker'),
 ('I',5,1,1,1,'Before the visible world: the angels'), ('I',6,1,1,1,'What “beginning” means'),
 ('I',7,1,1,1,'“Created”: the work of an Artist'), ('I',8,1,1,1,'Do not ask what heaven and earth are made of'),
 ('I',9,1,1,1,'What holds up the earth'), ('I',10,1,1,1,'The simplicity of faith'),
 ('I',11,1,1,1,'Let the philosophers refute each other'),
 ('II',1,1,2,2,'Invisible and unfinished'), ('II',2,1,2,2,'Matter is not eternal'),
 ('II',3,1,2,2,'What hid the earth: water'), ('II',4,1,2,2,'Darkness is not a power of evil'),
 ('II',5,1,2,2,'Where evil comes from'), ('II',6,1,2,2,'The Spirit brooding over the waters'),
 ('II',7,1,3,4,'Let there be light'), ('II',8,1,5,5,'“One day”: a figure of eternity'),
 ('III',1,1,6,6,'Time given to God is not lost'), ('III',2,1,6,6,'How God speaks: the Word'),
 ('III',3,1,6,6,'One heaven, or more?'), ('III',4,1,6,7,'Waters above the firmament'),
 ('III',5,1,6,6,'Why so much water'), ('III',6,1,6,6,'The rivers of the world'),
 ('III',7,1,6,7,'What the firmament is'), ('III',8,1,8,8,'God called the firmament heaven'),
 ('III',9,1,7,7,'Water means water'), ('III',10,1,8,8,'Good: fit for its purpose'),
 ('IV',1,1,9,9,'The workshop of creation'), ('IV',2,1,9,10,'Let the waters be gathered'),
 ('IV',3,1,9,9,'The first command still runs'), ('IV',4,1,9,10,'One gathering, many seas'),
 ('IV',5,1,9,10,'Dry land before the sun'), ('IV',6,1,10,10,'Why the sea is good'),
 ('IV',7,1,10,10,'The sea, and the Church at prayer'),
 ('V',1,1,11,11,'Let the earth bring forth'), ('V',2,1,11,11,'Grass, and the shortness of life'),
 ('V',3,1,11,11,'How a plant grows'), ('V',4,1,11,11,'Poisonous plants'),
 ('V',5,1,11,11,'Each after its kind'), ('V',6,1,11,11,'The rose without thorns'),
 ('V',7,1,11,11,'The trees and their uses'), ('V',8,1,11,12,'The variety of fruits'),
 ('V',9,1,11,12,'One water, many colours'), ('V',10,1,11,13,'A command that still works'),
 ('VI',1,1,14,14,'Spectators who are also athletes'), ('VI',2,1,14,15,'Lights after the plants'),
 ('VI',3,1,14,15,'Light and the body that carries it'), ('VI',4,1,14,14,'Signs of the weather'),
 ('VI',5,1,14,14,'Against horoscopes'), ('VI',6,1,14,14,'Born under the Ram'),
 ('VI',7,1,14,14,'The stars do not rule our will'), ('VI',8,1,14,14,'Seasons, days and years'),
 ('VI',9,1,16,16,'Two great lights'), ('VI',10,1,16,18,'The sun and the changing moon'),
 ('VI',11,1,16,19,'The moon, the tides and the weather'),
 ('VII',1,1,20,20,'Let the waters bring forth'), ('VII',2,1,20,21,'The kinds of fish'),
 ('VII',3,1,20,21,'The big fish eat the small'), ('VII',4,1,20,21,'Fish keep their bounds; we do not'),
 ('VII',5,1,20,21,'What fish know'), ('VII',6,1,20,21,'The viper, marriage, and the great whales'),
 ('VIII',1,1,24,24,'Let the earth bring forth the living creature'), ('VIII',2,1,20,24,'The soul of animals; the birds'),
 ('VIII',3,1,20,20,'The kinds of birds'), ('VIII',4,1,20,20,'The bees and their king'),
 ('VIII',5,1,20,20,'Cranes, storks and swallows'), ('VIII',6,1,20,20,'The turtle-dove and the eagle'),
 ('VIII',7,1,20,20,'In the firmament of heaven'), ('VIII',8,1,20,22,'Insects, and the riches of the soul'),
 ('IX',1,1,24,24,'“For me grass is grass”'), ('IX',2,1,24,24,'Let the earth bring forth: and look up'),
 ('IX',3,1,24,25,'What animals teach'), ('IX',4,1,24,25,'Virtue is natural to us'),
 ('IX',5,1,24,25,'Nothing too much, nothing missing'), ('IX',6,1,26,27,'“Let us make man”: the Trinity'),
]
# Augustine: (first section index, last section index, chapter, first verse, last verse, title)
A = [
 (0,3,1,1,1,'The faith he reads by'), (4,4,1,1,1,'Four ways to read Scripture'),
 (5,7,1,1,1,'In the beginning: time and the angels'), (8,9,1,1,1,'What “heaven and earth” means'),
 (10,10,1,2,2,'The earth was invisible'), (11,11,1,2,2,'Darkness above the abyss'),
 (12,14,1,2,2,'Why unformed matter is called water'), (15,17,1,2,2,'The Spirit passed over the water'),
 (18,18,1,3,3,'How God speaks'), (19,20,1,3,3,'Let there be light'), (21,24,1,4,4,'Light and darkness'),
 (25,26,1,5,5,'Day and night'), (27,27,1,5,5,'Evening and morning: one day'), (28,28,1,6,6,'The vault between the waters'),
 (29,30,1,7,7,'And so it was done'), (31,31,1,8,8,'God called the vault sky'), (32,33,1,9,10,'The dry land appears'),
 (34,35,1,11,13,'Plants'), (36,37,1,14,15,'The lights in the sky'), (38,39,1,14,15,'Signs and times, days and years'),
 (40,43,1,16,19,'Sun, moon and stars'), (44,47,1,20,20,'Let the waters bring forth'),
 (48,49,1,20,21,'Creeping things, birds and great whales'), (50,52,1,22,23,'Increase and multiply'),
 (53,54,1,24,25,'The beasts of the earth'), (55,56,1,26,26,'“Let us make”'), (57,62,1,26,27,'Image and likeness'),
]
# Gregory: (chapter, chapter of Genesis, first verse, last verse, title)
G = [
 ('II',1,26,26,'Why man was made last'), ('III',1,26,26,'Man is worth more than the whole visible world'),
 ('IV',1,26,26,'Made to rule'), ('V',1,26,27,'A likeness of God’s kingship'),
 ('XVI',1,26,27,'The image of God, and male and female'), ('XVII',1,28,28,'Increase and multiply: had man not sinned'),
 ('XVIII',1,28,28,'Where our passions come from'),
 ('I',2,1,2,'The world made ready for man'), ('XIX',2,9,9,'Food in Paradise'), ('XX',2,16,17,'The tree of the knowledge of good and evil'),
]
# A few lines of Basil's last homily on the Jews are left out (marked […]); the reader's source line says so
CUT = [
 ('IX', 'Thus the Jews, race hostile to truth,', 'without being able to assuage their fury.'),
 ('IX', 'Jewish fiction!', 'shows whence it has come.'),
 ('IX', 'the Jew covered with shame, ', 'the Jew covered with shame, '),
]
def cut(h, p):
    for hh, a, b in CUT:
        i = p.find(a) if hh == h else -1
        if i >= 0: p = p[:i] + '[…] ' + p[p.index(b, i) + len(b):].lstrip()
    return p
def clean(p):
    p = re.sub(r'\s*\u2014\s*', ', ', p)          # the site uses no em dashes
    p = re.sub(r',\s*([,.;:?!])', r'\1', p)
    p = re.sub(r'([“‘]) ', r'\1', p)
    p = p.replace('soulproper', 'soul proper').replace('believethe', 'believe the').replace('soulsexisted', 'souls existed').replace('souland', 'soul and')
    return re.sub(r'\s+', ' ', p).strip()

C = {}
ROMAN = {'I':1,'II':2,'III':3,'IV':4,'V':5,'VI':6,'VII':7,'VIII':8,'IX':9}
for h, s, ch, v0, v1, t in B:
    P = dict((n, ps) for n, ps in S['basil'][h]['s'])[s]
    C.setdefault(ch, []).append([v0, v1, 'basil', 'Homily %d, section %d' % (ROMAN[h], s), t, [clean(cut(h, p)) for p in P]])
AU = S['augustine']
for i0, i1, ch, v0, v1, t in A:
    xs = AU[i0:i1 + 1]
    nums = [x['n'] for x in xs]
    ref = 'Section ' + nums[0] if len(nums) == 1 else 'Sections %s-%s' % (nums[0], nums[-1])
    paras = []
    for x in xs:
        ps = [clean(p) for p in x['p']]
        paras.append('§' + x['n'] + ' ' + ps[0]); paras += ps[1:]
    C.setdefault(ch, []).append([v0, v1, 'augustine', ref, t, paras])
for c, ch, v0, v1, t in G:
    x = S['gregory'][c]
    paras = ['§%d %s' % (n, clean(' '.join(ps))) for n, ps in x['p']]
    C.setdefault(ch, []).append([v0, v1, 'gregory', 'Chapter ' + c, t, paras])
ORD = {'basil': 0, 'augustine': 1, 'gregory': 2}
for ch in C: C[ch].sort(key=lambda e: (e[0], ORD[e[2]]))  # stable: each work keeps its own order
out = os.path.join(ROOT, 'app/bible/fathers/genesis.json')
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump({'w': W, 'c': {str(k): v for k, v in sorted(C.items())}}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('fathers: %d passages on Genesis %s -> %s (%d KB)' % (sum(len(v) for v in C.values()), ', '.join(str(k) for k in sorted(C)), os.path.relpath(out, ROOT), os.path.getsize(out) // 1024))
