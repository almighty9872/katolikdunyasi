"""Writes the Church Fathers' commentary on Genesis for the Bible reader: app/bible/fathers/genesis.json,
from tools/fathers/src.json (each work split into its own numbered sections).

src.json was made once from the texts as printed (New Advent, except Augustine's unfinished commentary from tertullian.org):
  basil: {"I".."IX": {t: homily title, s: [[section, [paragraph, ...]], ...]}}
  gregory: {"I".."XXX": {t: chapter title, p: [[paragraph number, [paragraph]], ...]}}
  augustine: [{n: "3.6", h: heading or null, p: [paragraph, ...]}, ...]
  city (City of God, "book.chapter"), summa ("I.92.3", part.question.article), justin ("56"), theophilus ("book.chapter"),
  clement ("4"): {t: chapter title, p: [paragraph, ...]}
  irenaeus ("book.chapter.paragraph"), cyprian ("patience.10"): paragraph text
  hippolytus: [{h: heading (the verse), p: [paragraph, ...]}, ...] in the order printed
Scripture references in the texts are written [[Genesis 1:1]]; the reader turns them into links.

Output: app/bible/fathers/genesis.json: {w: {Father: {n: name, d: dates, img: portrait (credited on the Sources page), w, a, src: his first work}},
           k: {work: {w: title, a: about the work, src: translation and source}}, n: [chapters with commentary]}
        app/bible/fathers/genesis/<chapter>.json: [[first verse, last verse, Father, place in the work, our title, [paragraph, ...], work (if not his first)], ...]
Each entry is one unit of a work (a section of a homily, a chapter, an article of the Summa), placed at the verses it explains.
The reader shows them beside the chapter (bibFathers in app/index.html). St. Thomas Aquinas is a Doctor of the Church, not a Father;
he is here because he gathers the Fathers' reading of Genesis.
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
 'clement': {'n': 'St. Clement of Rome', 'd': 'died c. 100', 'w': 'Letter to the Corinthians',
   'a': 'Written about 96 by the bishop of Rome, the third after St. Peter, to a church split by jealousy. He uses the people of Genesis as examples.',
   'img': 'art/fathers/clement.jpg', 'src': 'Translated by John Keith, Ante-Nicene Fathers, vol. 9 (1896). Public domain.'},
 'justin': {'n': 'St. Justin Martyr', 'd': 'c. 100-165', 'w': 'Dialogue with Trypho',
   'a': 'A long conversation with a Jewish teacher named Trypho, written about 155. Justin shows from the Old Testament that Jesus is the Christ.',
   'img': 'art/fathers/justin.jpg', 'src': 'Translated by Marcus Dods and George Reith, Ante-Nicene Fathers, vol. 1 (1885). Public domain.'},
 'irenaeus': {'n': 'St. Irenaeus of Lyons', 'd': 'c. 130-202', 'w': 'Against Heresies',
   'a': 'Five books written about 180 against the Gnostics, who said the God of Genesis was not the Father of Jesus. Irenaeus shows it is one God and one plan from Adam to Christ.',
   'img': 'art/fathers/irenaeus.jpg', 'src': 'Translated by Alexander Roberts and William Rambaut, Ante-Nicene Fathers, vol. 1 (1885). Public domain.'},
 'theophilus': {'n': 'St. Theophilus of Antioch', 'd': 'died c. 185', 'w': 'To Autolycus',
   'a': 'Three books written about 180 to a pagan friend. The second walks through Genesis from creation to the first cities; the third tells of the Flood.',
   'img': 'art/fathers/theophilus.jpg', 'src': 'Translated by Marcus Dods, Ante-Nicene Fathers, vol. 2 (1885). Public domain.'},
 'hippolytus': {'n': 'St. Hippolytus of Rome', 'd': 'c. 170-235', 'w': 'Fragments on Genesis',
   'a': 'Pieces of his lost commentary on Genesis, kept in later collections. Most are on Jacob’s blessings of his sons in chapter 49.',
   'img': 'art/fathers/hippolytus.jpg', 'src': 'Translated by S. D. F. Salmond, Ante-Nicene Fathers, vol. 5 (1886). Public domain.'},
 'cyprian': {'n': 'St. Cyprian of Carthage', 'd': 'c. 210-258', 'w': 'On the Good of Patience',
   'a': 'A short treatise written in 256, two years before he was martyred.',
   'img': 'art/fathers/cyprian.jpg', 'src': 'Translated by Robert Ernest Wallis, Ante-Nicene Fathers, vol. 5 (1886). Public domain.'},
 'aquinas': {'n': 'St. Thomas Aquinas', 'd': '1225-1274', 'w': 'Summa Theologiae',
   'a': 'Not a Father but a Doctor of the Church. In the Summa he asks one question at a time and answers it from Scripture and the Fathers, above all St. Augustine. Only his answers are given here, with an objection where his reply needs it.',
   'img': 'art/fathers/aquinas.jpg', 'src': 'Translated by the Fathers of the English Dominican Province, second edition (1920). Public domain.'},
}
# A Father's other works: the entry names its work in its 7th field
K = {
 'city': {'w': 'The City of God', 'a': 'Written 413-426. Books 13 to 16 follow Genesis from the fall of Adam to Jacob’s blessings, tracing the line of those who lived for God.',
   'src': 'Translated by Marcus Dods, Nicene and Post-Nicene Fathers, First Series, vol. 2 (1887). Public domain.'},
 'jealousy': {'w': 'On Jealousy and Envy', 'a': 'A short treatise written about 256.',
   'src': 'Translated by Robert Ernest Wallis, Ante-Nicene Fathers, vol. 5 (1886). Public domain.'},
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

# Augustine, City of God: (book.chapter, chapter of Genesis, first verse, last verse, title)
CITY = [
 ('13.24',2,7,7,'The breath of life'), ('13.21',2,8,8,'Paradise: a real place that also stands for more'),
 ('14.12',2,16,17,'Why so small a command'), ('13.12',2,17,17,'Which death God meant'),
 ('14.22',2,24,24,'Marriage as God made it'), ('14.10',2,25,25,'Life in Paradise before sin'),
 ('14.11',3,1,6,'How the first man fell'), ('14.13',3,5,5,'Pride came first'), ('13.14',3,6,6,'Made upright, fallen by his own choice'),
 ('13.13',3,7,7,'The first punishment: shame'), ('14.17',3,7,7,'Their eyes were opened'),
 ('13.15',3,8,9,'Adam left God before God left him'), ('14.14',3,12,13,'Making excuses'),
 ('14.15',3,17,19,'Why the punishment was just'),
 ('15.1',4,1,2,'Two lines in the human race'), ('15.7',4,3,7,'Why Cain’s gift was refused'), ('15.5',4,8,8,'The first murder'),
 ('15.8',4,17,17,'Cain builds a city'), ('15.17',4,25,25,'Two fathers: Cain and Seth'), ('15.18',4,26,26,'Abel, Seth and Enos point to Christ'),
 ('15.21',5,1,3,'Back to the line of Adam'), ('15.16',5,4,4,'Why brothers and sisters married then'), ('15.9',5,5,5,'Why they lived so long'),
 ('15.19',5,24,24,'Enoch taken up'),
 ('15.22',6,1,2,'The sons of God and the daughters of men'), ('15.24',6,3,3,'A hundred and twenty years'), ('15.23',6,4,4,'Were the giants born of angels?'),
 ('15.25',6,6,7,'God’s anger is not like ours'), ('15.26',6,14,16,'The ark: a figure of Christ and the Church'),
 ('15.27',7,1,24,'The Flood: true history and a true sign'),
 ('16.1',9,1,1,'Who lived for God after the Flood'), ('16.2',9,20,27,'Noah’s sons: a prophecy'), ('16.3',10,1,1,'The nations from Noah’s sons'),
 ('16.11',10,25,25,'The first language'), ('16.4',11,1,4,'The tower of Babel'), ('16.5',11,5,5,'God came down'), ('16.6',11,7,7,'“Let us go down”: to whom God speaks'),
 ('16.10',11,10,26,'Shem’s line down to Abraham'), ('16.12',11,26,27,'A new age begins with Abraham'), ('16.13',11,31,31,'Why Nahor is left out'),
 ('16.14',11,32,32,'Terah dies in Haran'), ('16.16',12,1,3,'Two promises to Abraham'), ('16.15',12,4,4,'When Abraham left Haran'),
 ('16.18',12,7,7,'The land promised'), ('16.19',12,11,20,'Sarah kept safe in Egypt'), ('16.20',13,8,11,'Abraham and Lot part in peace'),
 ('16.21',13,14,17,'The land for ever'), ('16.22',14,14,20,'Melchizedek blesses Abraham'), ('16.23',15,5,6,'Count the stars'),
 ('16.24',15,9,17,'The sacrifice of the animals'), ('16.25',16,1,4,'Hagar'), ('16.28',17,5,5,'New names: Abraham and Sarah'),
 ('16.27',17,14,14,'Circumcision and the broken covenant'), ('16.26',17,15,21,'A son promised to Sarah'),
 ('16.29',18,1,3,'Three men at Mamre'), ('16.30',19,15,26,'Lot saved and Sodom burned'), ('16.31',21,1,7,'Isaac: the son of laughter'),
 ('16.32',22,1,14,'Abraham offers Isaac'), ('16.33',24,15,15,'Rebecca'), ('16.34',25,1,6,'Abraham marries Keturah'),
 ('16.35',25,22,23,'Twins in the womb'), ('16.36',26,2,5,'God blesses Isaac'), ('16.37',27,27,29,'What Esau and Jacob stand for'),
 ('16.38',28,10,19,'Jacob’s ladder'), ('16.39',32,28,28,'Why Jacob is called Israel'), ('16.40',46,26,27,'Seventy-five souls'),
 ('16.42',48,13,20,'Jacob crosses his hands'), ('16.41',49,8,12,'Judah’s blessing points to Christ'),
]
# Aquinas, Summa: (part.question.article, what to give: 'A' his answer, 'O3'/'R3' objection and reply 3, chapter, first verse, last verse, title)
SUMMA = [
 ('I.73.2','A',2,2,2,'How God rested'), ('I.73.3','A',2,3,3,'Why the seventh day is blessed'),
 ('I.91.1','A',2,7,7,'Made from the slime of the earth'),
 ('I.102.1','A',2,8,8,'Paradise is a real place'), ('I.97.4','A',2,9,9,'The tree of life'),
 ('I.102.3','A',2,15,15,'To dress it and keep it'), ('I.92.1','A',2,18,18,'Why the woman was made'),
 ('I.96.1','A',2,19,20,'Master of the animals'), ('I.94.3','A',2,19,20,'What Adam knew'),
 ('I.92.2','A',2,21,22,'Why she was made from the man'), ('I.92.3','A',2,21,22,'Why from a rib'),
 ('II-II.165.1','A',3,1,1,'Why God let man be tempted'), ('II-II.165.2','A',3,1,5,'How the tempter went about it'),
 ('II-II.163.1','A',3,5,5,'Pride was the first sin'), ('II-II.163.2','A',3,5,5,'“You shall be as gods”'),
 ('II-II.163.4','A',3,6,6,'Was Adam’s sin worse than Eve’s?'),
 ('II-II.164.2','A',3,16,19,'The punishments, one by one'), ('II-II.164.1','A',3,19,19,'Death is the punishment of sin'),
 ('I.51.3','O6 R6',6,4,4,'Could angels father children?'),
 ('II-II.110.3','O3 R3',12,13,13,'Did Abraham lie?'),
 ('III.22.6','A R3',14,18,18,'Melchizedek and the priesthood of Christ'),
 ('I.51.3','O5 R5',18,8,8,'Did the angels really eat?'),
 ('I-II.100.8','O3 R3',22,2,2,'Why Abraham’s obedience was not murder'),
]
# Irenaeus, Against Heresies: (book.chapter, paragraphs, chapter of Genesis, first verse, last verse, title)
IREN = [
 ('5.23',[1,2],2,17,17,'“In the day you eat”: when Adam died'), ('3.22',[4],3,6,6,'Eve’s knot untied by Mary'),
 ('3.23',[5],3,7,10,'Adam hides: the start of his repentance'), ('3.23',[3],3,14,17,'God cursed the serpent and the ground, not Adam'),
 ('4.40',[3],3,15,15,'Enmity between the serpent and the woman'), ('5.21',[1],3,15,15,'The seed of the woman crushes the head'),
 ('3.23',[7],3,15,15,'The heel is bitten; the head is crushed'), ('3.23',[6],3,22,24,'Driven out of Paradise in mercy'),
 ('4.18',[3],4,3,7,'Why Abel’s gift was accepted'), ('5.5',[1],5,24,24,'Enoch taken up alive'),
 ('5.32',[2],13,14,17,'The promised land still waits'), ('4.21',[1],15,6,6,'Our faith foreshadowed in Abraham'),
 ('4.16',[1,2],17,9,14,'Circumcision was a sign'), ('4.7',[1,2],17,17,17,'Abraham saw Christ’s day and was glad'),
 ('3.6',[1],19,24,24,'“The Lord rained from the Lord”'), ('4.31',[1,2],19,30,38,'Lot and his daughters'),
 ('4.5',[3,4,5],22,1,14,'Abraham’s faith and ours'), ('4.21',[2],25,23,23,'The elder shall serve the younger'),
 ('4.21',[3],25,26,26,'Jacob’s life read as a figure'), ('5.33',[3],27,27,29,'Isaac’s blessing looks to the Kingdom'),
 ('4.25',[2],38,27,30,'The twins of Tamar'),
]
# Justin, Dialogue with Trypho: (chapter, chapter of Genesis, first verse, last verse, title)
JUST = [
 ('62',3,22,22,'“Adam has become as one of us”'), ('138',7,1,7,'Noah and the eight souls: a figure of Christ'),
 ('139',9,24,27,'Noah’s blessing and curse'), ('127',11,5,5,'Who came down to see the tower?'),
 ('92',15,6,6,'Abraham was counted just before he was circumcised'), ('56',18,1,2,'Who appeared to Abraham at Mamre'),
 ('120',26,4,4,'In your seed all nations shall be blessed'), ('86',28,11,18,'Jacob’s stone: a figure of Christ'),
 ('134',29,16,30,'Leah and Rachel: a figure of the Church'), ('58',32,24,30,'Jacob wrestles with God'),
 ('52',49,10,10,'The sceptre shall not be taken away from Judah'),
]
# Theophilus, To Autolycus: (book.chapter, chapter of Genesis, first verse, last verse, title)
THEO = [
 ('2.27',2,7,7,'Made neither mortal nor immortal'), ('2.24',2,8,15,'The beauty of Paradise'), ('2.19',2,15,15,'Man placed in Paradise'),
 ('2.25',2,17,17,'The tree of knowledge was good'), ('2.28',2,21,23,'Why Eve was made from Adam’s rib'),
 ('2.22',3,8,8,'What it means that God walked'), ('2.23',3,14,19,'Why the account is true'), ('2.26',3,23,24,'Driven out in kindness'),
 ('2.29',4,8,12,'Cain’s crime'), ('2.30',4,17,22,'Cain’s family and what they made'), ('3.19',7,6,24,'The Flood'),
 ('2.31',11,1,9,'After the Flood: cities, kings and Babel'),
]
# Hippolytus, fragments: (index in src, chapter of Genesis, first verse, last verse, title)
HIPP = [
 (13,2,7,7,'Formed from the dust'), (3,3,8,8,'The voice of the Lord walking in the garden'), (14,27,1,40,'Isaac, Rebecca, Esau and Jacob as figures'),
 (4,49,3,3,'Reuben'), (5,49,4,4,'Reuben and his father’s bed'), (6,49,5,5,'Simeon and Levi'), (7,49,5,7,'The counsel of Simeon and Levi'),
 (8,49,11,11,'The foal tied to the vine'), (9,49,12,15,'Judah’s eyes, Zabulun and Issachar'), (10,49,16,20,'Dan, Gad and Aser'),
 (11,49,21,26,'Nephthali and Joseph'), (12,49,27,27,'Benjamin, the ravening wolf: St. Paul'),
]
# Clement, Letter to the Corinthians: (chapter, chapter of Genesis, first verse, last verse, title)
CLEM = [
 ('4',4,3,8,'Jealousy: Cain and Abel, Jacob and Esau, Joseph'), ('9',5,24,24,'Enoch and Noah: men who obeyed'),
 ('10',12,1,3,'Abraham, the friend of God'), ('17',18,27,27,'“I am dust and ashes”'), ('11',19,15,26,'Lot saved; his wife a warning'),
 ('31',22,6,9,'Isaac went gladly to be offered'),
]
# Cyprian: (work.paragraph, chapter of Genesis, first verse, last verse, title)
CYP = [
 ('jealousy.5',37,4,28,'Joseph sold by his brothers out of envy'), ('patience.10',50,15,21,'The patience of the patriarchs'),
]

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
def summa(key, what):
    P = S['summa'][key]['p']; out = []
    for w in what.split():
        if w == 'A':
            i = next(i for i, p in enumerate(P) if p.startswith('I answer that'))
            j = next((j for j in range(i + 1, len(P)) if P[j].startswith('Reply to Objection')), len(P))
            out += P[i:j]
        else:
            lab = ('Objection ' if w[0] == 'O' else 'Reply to Objection ') + w[1:] + '.'
            i = next(i for i, p in enumerate(P) if p.startswith(lab))
            j = next((j for j in range(i + 1, len(P)) if re.match(r'(Objection|Reply to Objection) \d|On the contrary|I answer that', P[j])), len(P))
            out += P[i:j]
    return [clean(p) for p in out]
def add(ch, v0, v1, f, ref, t, ps, work=None):
    C.setdefault(ch, []).append([v0, v1, f, ref, t, ps] + ([work] if work else []))
for k, ch, v0, v1, t in CITY:
    b, c = k.split('.')
    add(ch, v0, v1, 'augustine', 'Book %s, chapter %s' % (b, c), t, [clean(p) for p in S['city'][k]['p']], 'city')
for k, what, ch, v0, v1, t in SUMMA:
    pt, q, a = k.rsplit('.', 2)
    add(ch, v0, v1, 'aquinas', '%s, question %s, article %s' % (pt, q, a), t, summa(k, what))
for k, ns, ch, v0, v1, t in IREN:
    b, c = k.split('.')
    add(ch, v0, v1, 'irenaeus', 'Book %s, chapter %s' % (b, c), t, ['§%d %s' % (n, clean(S['irenaeus']['%s.%d' % (k, n)])) for n in ns])
for k, ch, v0, v1, t in JUST:
    add(ch, v0, v1, 'justin', 'Chapter ' + k, t, [clean(p) for p in S['justin'][k]['p']])
for k, ch, v0, v1, t in THEO:
    b, c = k.split('.')
    add(ch, v0, v1, 'theophilus', 'Book %s, chapter %s' % (b, c), t, [clean(p) for p in S['theophilus'][k]['p']])
HSKIP = ('After something', 'Then, after something', 'EUSEBIUS:')
for i, ch, v0, v1, t in HIPP:
    x = S['hippolytus'][i]
    add(ch, v0, v1, 'hippolytus', x['h'].replace('Genesis 44:27', 'Genesis 49:27'), t, [clean(p) for p in x['p'] if not p.startswith(HSKIP)])
for k, ch, v0, v1, t in CLEM:
    add(ch, v0, v1, 'clement', 'Chapter ' + k, t, [clean(p) for p in S['clement'][k]['p']])
for k, ch, v0, v1, t in CYP:
    w, n = k.split('.')
    add(ch, v0, v1, 'cyprian', 'Section ' + n, t, [clean(S['cyprian'][k])], None if w == 'patience' else w)
# Oldest Father first; each work keeps its own order
ORD = {f: i for i, f in enumerate(['clement', 'justin', 'irenaeus', 'theophilus', 'hippolytus', 'cyprian', 'basil', 'gregory', 'augustine', 'aquinas'])}
for ch in C: C[ch].sort(key=lambda e: (e[0], ORD[e[2]]))
GEN = json.load(open(os.path.join(ROOT, 'app/bible/genesis.json'), encoding='utf-8'))['c']
for ch, L in C.items():
    for e in L: assert 1 <= e[0] <= e[1] <= len(GEN[ch - 1]) and e[5] and all(e[5]), (ch, e[:5])
# One small index (the Fathers, their works, the chapters that have commentary) and one file per chapter, so a chapter loads only its own
D = os.path.join(ROOT, 'app/bible/fathers')
os.makedirs(os.path.join(D, 'genesis'), exist_ok=True)
for f in os.listdir(os.path.join(D, 'genesis')): os.remove(os.path.join(D, 'genesis', f))
J = lambda o, f: json.dump(o, open(f, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
J({'w': W, 'k': K, 'n': sorted(C)}, os.path.join(D, 'genesis.json'))
for ch, L in C.items(): J(L, os.path.join(D, 'genesis', '%d.json' % ch))
kb = lambda f: os.path.getsize(f) // 1024
big = max(C, key=lambda c: kb(os.path.join(D, 'genesis', '%d.json' % c)))
print('fathers: %d passages on %d chapters of Genesis (missing %s); index %d KB, largest chapter %d (%d KB)' % (sum(len(v) for v in C.values()), len(C),
      ', '.join(str(k) for k in range(1, 51) if k not in C) or 'none', kb(os.path.join(D, 'genesis.json')), big, kb(os.path.join(D, 'genesis', '%d.json' % big))))
