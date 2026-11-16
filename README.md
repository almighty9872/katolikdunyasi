# Katolik Dünyası and Verbum Domini

This repository holds two Catholic websites:

| Site | Language | Folder | Deploys with |
|---|---|---|---|
| [katolikdunyasi.com](https://katolikdunyasi.com) | Turkish | everything outside `verbumdomini/` | `.github/workflows/deploy.yml` (GitHub Pages) |
| [verbumdomini.ca](https://verbumdomini.ca) | English | `verbumdomini/` | `.github/workflows/deploy-english.yml` (Cloudflare) |

## Please do not copy these sites

A lot of love and long hours went into the design, code and writing of both sites. The source is public so you can see how they are made, not so they can be copied. It is not open source: all rights are reserved. Please do not reproduce these sites, their designs or their text, in whole or in part. If you would like to use something, just ask through the contact page. Texts in the public domain (such as older Bible translations and the Church Fathers) stay free for everyone, of course.

The two sites share no files. Work on one never changes the other. This README covers the Turkish site. The English site has its own [README](verbumdomini/README.md) and notes in [docs/english-site.md](docs/english-site.md).

A push to `main` deploys the site whose files changed.

## The English site in short

Verbum Domini is a single-page app built from `verbumdomini/app/` by `python3 verbumdomini/tools/build-app.py`. It has the Holy Bible in a book-style reader (with the Church Fathers on Genesis), Free e-Books (starting with The Confessions of St. Augustine), the full Compendium of the Catechism, the Mass and the Roman Missal, Confession, the Rosary (with a guided Pray the Rosary page), Common Prayers in English and Latin, Divine Mercy, Deliverance Prayers, the saints with long biographies, the parables, miracles, the history of the Church, Vatican II Explained, The Popes (all popes, each with a profile page and many with portraits), Canon Law, the case pages (Why We're Catholic, Answering Islam, Answering Atheism, A Call to Our Jewish Friends), a glossary, FAQ and contact form. Each page and each pope and parable has its own address (`/mass.html`, `/pope-<name>.html`, `/parable-<name>.html`). Readers can back up their settings and download the site for offline reading.

## The Turkish site

katolikdunyasi.com is a Catholic resource site in Turkish. Its center is a full Turkish translation of the **Compendium of the Catechism of the Catholic Church** (Libreria Editrice Vaticana, 2005): all 598 questions and answers, the Motu Proprio, the Introduction, both Creeds, the Decalogue table, the Our Father and the full Appendix.

Around it are original Turkish pages:

- **Öğren (Learn):** Why we're Catholic, becoming Catholic (OCIA/RCIA), Confession, the Mass step by step, the parables of Jesus, choosing a Bible, a glossary, frequently asked questions.
- **Cevap Ver (Answer):** answering Islam, answering atheism, a call to the Jewish people.
- **Dua Et (Pray):** the Rosary with an interactive bead tracker, the history of the Rosary, the calendar of the saints and 20 long saint biographies.
- **Keşfet (Explore):** Catholic miracles, Christianity's roots in Anatolia (with a map), the history of the Church, the Eastern Catholic Churches, and Kilise Bul, a directory of active Catholic churches in Turkey with a page for each church and each city.

### Language

The site is in Turkish. The only page in two languages is Kilise Bul (`kiliseler.html`), which is in Turkish and English at once. It picks the language from `?lang=`, the reader's last choice, or the browser's languages.

The Katekizm pages are Turkish only. They point to their English twins on verbumdomini.ca with `hreflang` (`$VdTwin` in `tools/build.ps1`). On phones, where a part has Latin originals, a Türkçe / Latina switch swaps the text in place.

Some data stays bilingual because the Turkish pages use it: Katekizm search also finds a question by its English text (`data/compendium-*.js`), and the verse popups show the Douay-Rheims, Pickthall and hadith English beside the Turkish (`data/refs-*.js`). `assets/script.js` writes its text through paired helpers (`LT(tr, en)`, `pmake`, `pstr`), which give the Turkish here.

### How it works

- Plain HTML, CSS and JavaScript, built ahead of time by `tools/build.ps1` (PowerShell) from `data/` and `content/`. You can open `index.html` from disk or upload the built folder to any static host.
- No outside requests except Cloudflare Turnstile (the spam check) on the contact page. The site never asks for the visitor's location.
- Fonts are self-hosted in `assets/fonts/`: Inter for all text, Lexend for the dyslexia setting, EB Garamond capitals for the logo only. The one library, three.js for the Rosary's 3D beads on a computer, is bundled in `assets/vendor/`.
- On a computer the header has five menus: Öğren, Cevap Ver, Dua Et, Keşfet (`Desk-Nav` in `tools/build.ps1`) and İletişim (`Dn-Contact`: the contact page and the pages about the site). Below 980px they fold into a full-screen menu behind the hamburger icon, which also shows the date and time.
- The home page's "Bugün" (Today) card shows the liturgical season and its color, the saint of the day and the Rosary mysteries of the day. `liturgicalDay()` in `assets/script.js` works this out from the date alone.
- The theme follows the sun: light from sunrise to sunset, dark after. The place comes only from the device's time zone. The theme switch overrides it until the next sunrise or sunset.
- Search works on every page. It loads the four Compendium files the first time it is used, then searches the Turkish and English text or jumps to a question number. `index.html?q=...` opens the home page with a search filled in.
- A link to a place on another page jumps straight there and holds the spot while the page finishes loading.
- `sitemap.xml` gives each page a `<lastmod>` from the date its data file last changed in git. `robots.txt` welcomes every crawler, `llms.txt` lists every page for AI assistants, and each deploy pings IndexNow (Bing, Yandex and others).

## Folder layout

```
index.html              Home: search, section cards, the Today card, the history strip
neden-katoligiz.html    Why we're Catholic: a short case in three parts (God, Jesus, the Church),
                        two "doors" to start, and 17 short hooks that open to the full answer
katekizm.html           The Katekizm overview (old address katesizm.html forwards here)
iman-ikrari.html        Compendium Part I, Q 1-217     Reading pages: contents sidebar
kutsal-sirlar.html      Compendium Part II, Q 218-356  and chapter prev/next
mesihte-yasam.html      Compendium Part III, Q 357-533
hristiyan-duasi.html    Compendium Part IV, Q 534-598
motu-proprio.html       Motu Proprio
giris.html              Introduction
ekler.html              Appendix: prayers (TR/EN/LA) and formulas of Catholic doctrine
katolik-sureci.html     Becoming Catholic: two doors (never baptized / baptized elsewhere), the first step, the OCIA steps
gunah-cikarma.html      Confession: step by step, an examination of conscience, first-timer questions
kutsal-ayin.html        The Mass, part by part
meseller.html           The parables of Jesus, explained plainly, by theme
tesbih-duasi.html       The Rosary: a 59-bead tracker (tap a bead or press Next), 3D beads on a computer,
                        then the prayers and the four sets of mysteries
tesbih-tarihi.html      The history of the Rosary
azizler.html            Calendar of the saints (movable feasts placed on their days for the year),
                        plus the 20 best-known saints as round portraits
<saint-id>.html         One page per best-known saint (e.g. meryem-ana.html), a long Turkish biography
kutsal-kitap.html       Choosing a Bible: three quick answers, the full guide below
mucizeler.html          Catholic miracles: apparitions, relics, Eucharistic miracles, incorrupt saints
topraklarimizda-hristiyanlik.html  Christianity's roots in Anatolia: a map of 24 places, then Paul's
                        homeland, the Seven Churches, Nicaea and the Church Fathers
kilise-tarihi.html      The Church's history, era by era, each event with its picture
dogu-katolik-kiliseleri.html  The Eastern Catholic Churches: 23 churches in five rite families
islama-cevap.html       Answering Islam: a note to the reader, then the full case in four parts
ateizme-cevap.html      Answering atheism: a short summary, then the full case
yahudilere-cagri.html   A call to the Jewish people, in the humble tone the Church's documents ask for
sss.html                Frequently asked questions, by topic
sozluk.html             Glossary of Catholic terms, A to Z
kiliseler.html          Kilise Bul: a map of Turkey; a city zooms into a drawn city map with its churches
kiliseler-<city>.html   One page per city with two or more churches
kilise/<id>.html        One page per church: Mass and visiting times, address, history, sources
iletisim.html           Contact form (no email address is published)
gizlilik.html           Privacy policy
erisilebilirlik.html    Accessibility statement
kaynaklar-ve-telif.html Sources and copyright, with credits for every painting and portrait
404.html                "Page not found"
sitemap.xml, robots.txt, llms.txt, <IndexNow key>.txt
favicon.ico, apple-touch-icon.png, site.webmanifest, assets/icon-192.png, assets/icon-512.png

assets/styles.css       All styling, edited by hand. Theme colors at the top
assets/script.js        Theme, search, reading bar, phone app screens, widgets
assets/globals.d.ts     Types for the script's globals (used by the type check)
assets/styles.min.css, assets/script.min.js   Built from the two files above; pages load these
assets/fonts/           Inter, Lexend and kd-brand-* (EB Garamond, logo only), SIL Open Font License.
                        The *-ext-a files hold only Latin Extended-A (Turkish ğ ş İ) to stay small
assets/og-image.jpg     The site's 1200x630 share picture
assets/og/              One share picture per church (made by tools/og-cards.py)
assets/sehir/           The drawn city maps for Kilise Bul (made by tools/kilise-sehir-haritalari.py)
assets/art/             Paintings (data/tablolar.json), history pictures (tl/), saint portraits (saints/)
assets/vendor/          rosary3d.js: the Rosary's 3D beads with three.js (source in tools/rosary3d)

data/compendium-1..4.js   The Compendium, Turkish and English, one file per part
data/extras.js            Motu Proprio, Introduction, Creeds, Decalogue, Our Father, Appendix
data/ccc-vatican.json     Which vatican.va page holds each Catechism paragraph
data/neden-katoligiz.js   Why we're Catholic
data/katolik-sureci.js    Becoming Catholic
data/gunah-cikarma.js     Confession
data/kutsal-ayin.js       The Mass
data/meseller.js          The parables
data/tespih.js            Rosary prayers and mysteries
data/tesbih-tarihi.js     The history of the Rosary
data/azizler.js           Saints calendar, one entry per day
data/buyuk-azizler.js     The 20 best-known saints
data/aziz-portreleri.json Credits for the saints' portraits
data/sss.js               FAQ
data/mucizeler.js         Miracles
data/topraklarimizda-hristiyanlik.js, anadolu-haritasi.js   Anatolian roots page and its map places
data/anadolu-harita-sekli.js, kilise-harita-sekli.js        Map outlines (generated, don't edit)
data/kilise-tarihi.json   Church history: eras and events (home strip and kilise-tarihi.html)
data/tarih-gorseller.json Credits for the history pictures
data/tablolar.json        The paintings behind page titles, sections and home cards
data/kiliseler.js         Churches in Turkey by city and rite, with map positions
data/islama-cevap.js, ateizme-cevap.js, yahudilere-cagri.js   The three Cevap Ver pages
data/refs-bible.js, refs-quran.js, refs-hadith.js   Text for the verse popups; the build puts
                          the ones a page cites into that page
data/azizler-adlar.js, azizler-ozet-*.js   Built from azizler.js (not kept in git)

content/kutsal-kitap.md   Bible guide
content/dogu-katolik-kiliseleri.md   Eastern Catholic Churches
content/hakkinda.md       Footer line and the sources and copyright text
content/gizlilik.md, erisilebilirlik.md   Privacy and accessibility pages
content/glossary-tr.txt   Glossary terms, one per line

tools/build.ps1           Builds every page from data/ and content/
tools/sozluk.py           Builds the glossary from content/glossary-tr.txt
tools/og-cards.py         Draws each church's share picture into assets/og/
tools/kilise-sehir-haritalari.py   Draws the city maps from OpenStreetMap data into assets/sehir/
tools/kilise-sehir-yerleri.json    Landmarks shown on the city maps
tools/anadolu-harita-sekli.mjs, kilise-harita-sekli.mjs   Rebuild the map outlines (Node)
tools/yahudilere-cagri/   Builds data/yahudilere-cagri.js from its source text
tools/rosary3d/           Source of assets/vendor/rosary3d.js (Node)
tools/qa/                 links.py (links and anchors, run by the deploy), runtime.js (script errors)

cloudflare/               The contact form's Worker (contact-worker.js, wrangler.jsonc) and its setup guide
.github/workflows/        deploy.yml (Turkish site), deploy-contact.yml (contact Worker), deploy-english.yml
verbumdomini/             The English site
docs/                     english-site.md, owner-steps.md (dashboard settings), security-audit.md,
                          ref/ (a Catechism paragraph to vatican.va page table)
CLAUDE.md                 Rules and commands for AI-assisted work on both sites
CNAME                     The domain; the build uses it for canonical and sitemap addresses
```

The pages, `sitemap.xml`, the minified CSS and JS and the generated data files are not kept in git (see `.gitignore`). The deploy builds them on every push.

## Building and checking

Run from the repository root:

```bash
pwsh -NoProfile -File ./tools/build.ps1
```

On Windows: `powershell -ExecutionPolicy Bypass -File tools\build.ps1`. The deploy minifies CSS and JS with esbuild (`npm install -g esbuild` to match it locally; without it the build uses a simpler minifier).

Checks (each passes with no output, and the link check ends with `total bad 0`):

```bash
npx --yes html-validate@9 --config .htmlvalidate.json "./*.html" "kilise/*.html"
```

```bash
python3 tools/qa/links.py | tail -1
```

After changing `assets/script.js` or `cloudflare/`:

```bash
npx --yes -p typescript@5.9.3 tsc -p jsconfig.json
```

The deploy runs the HTML and link checks too, and stops before publishing if they fail.

## Editing content

Most text lives in `data/*.js`. The format is described at the top of each file. A Compendium question looks like this:

```js
{ "type": "qa", "n": 16, "id": "soru-16", "ccc": "85-90, 100",
  "tr": { "q": "...", "a": "... [[Petrus'un|Peter]] ardılı ..." },
  "en": { "q": "...", "a": "..." } }
```

- `[[Türkçe|English]]` marks a name spelled differently in Turkish. It shows as "Petrus'un (Peter)".
- In an answer, `\n` starts a new paragraph, and a line starting with `- ` becomes a bullet.
- Keep the text between `/*JSON-START*/` and `/*JSON-END*/` as strict JSON: double quotes, no trailing commas.

Then rebuild. Search reads the data files directly, so search results change at once; the pages need the build.

**Footer and copyright text:** edit `content/hakkinda.md`. The top block (between the `---` lines) holds `title` (the footer link and dialog heading) and `about` (the one-line sentence in the footer). The rest is Markdown: `##` headings, blank lines for paragraphs, `**bold**`, `*italic*`, `[link](https://...)`, lists, `> quotes` and `---`. Raw HTML shows as plain text, so the page can't break by accident.

**Churches:** edit `data/kiliseler.js`. After adding a church, run `python3 tools/og-cards.py` for its share picture. After adding a city, or a church far from the others, run `python3 tools/kilise-sehir-haritalari.py` (needs `pip install mapbox-vector-tile`).

**Domain:** the build reads the domain from `CNAME` and uses it for canonical, Open Graph and sitemap addresses. Without it the build warns and uses `https://www.example.com`.

## Page design

**Illustrated sections.** Most guide pages are built from `Ill-Sec` in `tools/build.ps1`: a line drawing beside the section, a small line over a large heading, and a color tone (`gold`, `red`, `blue`, `green`, `purple`). The drawings are SVG strokes in the `$Ill` table. Each one draws itself as it scrolls into view (`initDrawings` in `assets/script.js`) and shows whole without JavaScript or with reduced motion. They are decorative and hidden from screen readers.

**Articles.** Most pages are articles (`data-article` on `<body>`, set by `Write-Page`). An article shows its first screens and loads the rest as the reader gets near the end. All the text is in the HTML from the start, so search engines and readers without JavaScript get the whole page. Anchor links, find in page and printing load everything needed. A thin gold bar at the top shows reading progress, and a round button opens the list of sections. Not articles: the home page, the Katekizm pages, the saints calendar, Kilise Bul, the contact page and the glossary. İslam'a Cevap is an article but loads all at once.

**Phones.** Below 980px, every page except the home screen works like an app screen (`initAppView` in `assets/script.js`). The Katekizm pages and the saints calendar are read in levels: a list of sections, then a section, then one item. Each level has its own `#anchor`, so the back button steps back a level. The top bar leads back to the page's home screen app (Öğren, Dua Et, Keşfet, Cevap Ver). The home screen has the four app icons and a bar to switch between them. Which parts of a page are levels is set in `AV_PAGES` in `assets/script.js`.

## References and links

- Every Bible reference in the text (e.g. "Matta 13:1-23", "Luke 15:3-7") links to BibleGateway in the RSV Catholic Edition (`Link-Refs` in `tools/build.ps1`). The parables' English (Douay-Rheims) links to that translation.
- Catechism paragraph numbers (KKK/CCC) open the Catechism on vatican.va. `data/ccc-vatican.json` maps each paragraph to its page; a paragraph it doesn't cover opens the contents page.
- On İslam'a Cevap, a Catechism reference (§841) opens a popup with the matching Compendium question.

## The contact form

`iletisim.html` has a form instead of an email address. It posts to `/api/contact`, answered by a Cloudflare Worker (`cloudflare/contact-worker.js`). The Worker checks a hidden trap field and Cloudflare Turnstile, then emails the message through Cloudflare Email Routing with the sender as Reply-To. A topic menu sets the subject, and requests about a church go to that church. The owner's address lives only in the Worker's secrets. The public Turnstile site key is `$TurnstileSiteKey` in `tools/build.ps1`. Setup steps are in `cloudflare/README.md`. `deploy-contact.yml` publishes the Worker when `cloudflare/` changes.

## Hosting: GitHub Pages behind Cloudflare

1. **Pages:** repository Settings, Pages, Source: "GitHub Actions". The branch is `main`. Every push runs `deploy.yml`; watch it in the Actions tab.
2. **Domain:** `CNAME` holds `katolikdunyasi.com`, and the same domain is set under Settings, Pages, Custom domain.
3. **DNS (Cloudflare):** four A records for `@` (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`), optional AAAA records (`2606:50c0:8000::153` to `2606:50c0:8003::153`), and a CNAME `www` to `<github-username>.github.io`. Keep the `_github-pages-challenge-<github-username>` TXT record: it keeps the domain verified so no other GitHub account can claim it.
4. **HTTPS:** start with the records as DNS only (grey cloud) until GitHub issues its certificate, then tick Enforce HTTPS. The records are now Proxied, with SSL/TLS **Full (strict)** (never "Flexible", which loops), Always Use HTTPS and HSTS (6 months, no preload).
5. **Cache rules:**
   - `/assets/*`: 1 year at the edge and in the browser. CSS and JS links carry a content hash; if you replace a font or picture under the same name, purge that address.
   - `/data/*`: 2 hours.
   - Pages (`/` and `*.html`): 10 minutes, matching the pages' own `max-age=600`.
   - Keep Block AI bots, Cloudflare's managed robots.txt and Rocket Loader off.

If GitHub ever shows a certificate warning, set the records to DNS only for an hour, then back to Proxied.

## Translation conventions

- **Terms** follow Turkish Catholic usage: Kutsal Sır (sacrament), Efkaristiya, Konfirmasyon, Tövbe ve Barışma, Kutsal Üçlü, Havari, Öğretim Makamı (Magisterium), Araf, Kutsal Ayin (Missa).
- **Names:** when a name is spelled differently in Turkish, its first mention in each card shows the Turkish, then the English in brackets: Petrus (Peter), Aziz Augustinus (Saint Augustine), İznik (Nicaea). İsa and Meryem are not glossed each time. The footer explains this.
- **Scripture** keeps the Catholic canon and the Vatican source's verse numbers, including the Deuterocanonical books (2 Makabeler, Bilgelik, Sirak) and the Catholic Psalm numbering. Book names are in Turkish.
- **Fixes to the source**, each marked on the page:
  - Q420: "Galatians 1:25" becomes James 1:25, with an editor's note.
  - Q39: CCC "2112-213" becomes 212-213.
  - Introduction footnote: "Laetarum magnopere" becomes *Laetamur magnopere*.
- **Q469 (death penalty):** the card gives the 2005 text faithfully and adds an editor's note on Pope Francis' 2018 change to CCC 2267.

## Notes

- This is an **unofficial translation**. The original text is © Libreria Editrice Vaticana, and publishing a translation normally needs LEV's permission. A review by a Turkish Catholic reader (for example, someone linked to the Episcopal Conference of Türkiye) is welcome.
- With gzip or brotli (most hosts do this), the largest page, the saints calendar, is about 140 KB.

## Contact

Corrections and suggestions are welcome through the [İletişim page](https://katolikdunyasi.com/iletisim.html) (Turkish site) or the [contact page](https://verbumdomini.ca/contact.html) on verbumdomini.ca.
