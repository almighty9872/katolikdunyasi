# katolikdunyasi.com

A static Catholic resource site in Turkish. Only the Katekizm pages keep a TR | EN switch, which turns the page into the Vatican's English in place (Latin originals are shown on request); see below. It includes a full translation of the **Compendium of the Catechism of the Catholic Church** (Libreria Editrice Vaticana, 2005; all 598 questions and answers, the Motu Proprio, the Introduction, both Creeds, the Decalogue table, the Our Father, and the full Appendix), plus original Turkish sections making the case for the Catholic faith, the OCIA/RCIA process for becoming Catholic, how Confession works, the Mass explained step by step, the parables of Jesus explained plainly, the Rosary and common prayers, a calendar of the saints, a guide to the Bible in Turkish, well-known Catholic miracles, Christianity's roots in Anatolia, the Church's history, the history of the Rosary, answers to Islam and to atheism, a call to the Jewish people, frequently asked questions, and a directory of active Catholic churches in Turkey.

The site uses plain HTML, CSS and JavaScript. It makes no CDN requests (the one exception is Cloudflare Turnstile, the spam check, loaded only on the contact page); the fonts (Inter for text, headings, menus and buttons, Lexend for the dyslexia setting, EB Garamond capitals for the logo) are self-hosted in `assets/fonts/`, and the one library, three.js for the Rosary's 3D beads on a computer, is bundled into `assets/vendor/`. You can open `index.html` straight from disk, or upload the folder to any static host.

Apart from the contact form, the site makes no outside network calls, and it never asks for the visitor's location. On a computer the header carries five dropdown menus (Öğren, Cevap Ver, Dua Et, Keşfet, built by `Desk-Nav` in `tools/build.ps1`, and İletişim / Contact, built by `Dn-Contact`: the contact page, then the pages about the site under "Site Hakkında"); below 980px they fold into the full-menu overlay opened from the hamburger icon, which shows today's date and time. The home page's "Bugün" card shows the day's liturgical season and the colour the priest wears (green, violet, white, red or rose), worked out in the browser from the date alone by `assets/script.js`'s `liturgicalDay()`, beside the day's saint and Rosary mysteries.

## Language: Turkish

**The site is Turkish only.** The English edition is a separate site, Verbum Domini (https://verbumdomini.ca), built from its own folder, `verbumdomini/`; nothing there is shared with this site. The Katekizm pages (`katekizm`, `giris`, `motu-proprio`, the four parts and `ekler`) point to their English editions on verbumdomini.ca with `hreflang` (`$VdTwin` in `tools/build.ps1`).

Some data the browser loads keeps its English, because the Turkish pages use it: the Katekizm search finds a question by its English too (`data/compendium-*.js`), and the verse popups show the Douay-Rheims, Pickthall and hadith English beside the Turkish (`data/refs-*.js`). `assets/script.js` still writes its text through the paired helpers (`LT(tr, en)`, `pmake`, `pstr`), which give the Turkish here.

The theme follows the sun: light from sunrise to sunset at the visitor's place, dark after. The place comes from the device's time zone only (a table in `script.js`, or the zone's offset); today's times are kept in `kd-sun` so `<head>` can pick the theme before the first paint. The theme switch overrides the sun until the next sunrise or sunset (`kd-theme-choice`).

`sitemap.xml` gives each page a `<lastmod>`: the date its data file last changed in git (the deploy fetches the full history for this). After the build, the deploy checks every page's HTML with html-validate (`.htmlvalidate.json`) and stops before publishing if the markup is broken.

Search engines and AI assistants are all welcome (`robots.txt` allows every crawler). `llms.txt` lists every page with its one-line description for AI assistants, and after each deploy the workflow tells the IndexNow search engines (Bing, Yandex and others) that the pages changed.

## Folder layout

```
index.html              Home: search box, section cards, today's saint
neden-katoligiz.html    Why we're Catholic: a short case in three parts (God, Jesus, the Church); two
                        "doors" to start, and 17 one-line hooks that open to the question, answer,
                        key points and the objection with its reply
iman-ikrari.html        Compendium Part I · Q 1–217   (reading page: sticky contents sidebar, chapter
kutsal-sirlar.html      Compendium Part II · Q 218–356  prev/next; the EN switch shows the Vatican's
mesihte-yasam.html      Compendium Part III · Q 357–533 English original)
hristiyan-duasi.html    Compendium Part IV · Q 534–598
motu-proprio.html       Motu Proprio (Turkish, or the English original with the EN switch)
giris.html              Introduction (same)
ekler.html              Appendix: prayers (TR/EN/LA) + formulas of Catholic doctrine
katolik-sureci.html     Becoming Catholic: two doors (never baptized / baptized elsewhere), the first step, the OCIA steps, the rest folded
gunah-cikarma.html      Confession: how it works step by step, an examination-of-conscience
                        checklist, and common first-timer fears/questions
kutsal-ayin.html        The Mass, part by part
meseller.html           The parables of Jesus, retold and explained plainly, by theme
tesbih-duasi.html       The Rosary: an interactive 59-bead SVG tracker (tap a bead or press Next;
                        prayer text in a bottom sheet, mystery of the day preselected, vibration
                        feedback on phones), then the prayers and the four sets of mysteries
azizler.html            Calendar of the saints (current month shown, other months a click away;
                        the feasts that move with Easter are dated for the year and placed on
                        their days), plus the "20 best-known saints" as round portraits (a gold
                        ring until read), each linking to its own page below
<saint-id>.html         One page per saint in the "20 best-known" list (e.g. meryem-ana.html),
                        a long original Turkish biography
kutsal-kitap.html       Choosing a Bible: three quick answers up top, the guide folded below
mucizeler.html          Catholic miracles: apparitions, relics, Eucharistic miracles, incorrupt saints
topraklarimizda-hristiyanlik.html  Christianity's roots in Anatolia: an interactive SVG map of 24
                        places (hover for a card that follows the pointer, click to pin it),
                        then Paul's homeland, the Seven Churches, Nicaea, the Church Fathers
sss.html                Frequently asked questions, grouped by topic
kiliseler.html          Parish locator: a map of Turkey; a city's dot opens the list of its churches
kilise/<id>.html        One page per church: Mass and visiting times, address, history, sources
dogu-katolik-kiliseleri.html  Eastern Catholic Churches: the 23 churches and five rites (content/dogu-katolik-kiliseleri.md)
kilise-tarihi.html      Kilise'nin Tarihi: the Church's history, era by era, every event with its picture
islama-cevap.html       Cevap Ver (Answer): Answering Islam, a short summary then the full case in four parts
ateizme-cevap.html      Cevap Ver: Answering atheism, the same layout
yahudilere-cagri.html   Cevap Ver: A call to the Jewish people, in the humble tone the Vatican's documents ask for
tesbih-tarihi.html      The history of the Rosary
iletisim.html           Contact page: a form that posts to the Cloudflare Worker (no address is published)
sozluk.html             Glossary of Catholic terms, A-Z
gizlilik.html           Privacy policy
erisilebilirlik.html    Accessibility statement
kaynaklar-ve-telif.html Sources and copyright, with the credits of every painting and portrait
404.html                "Page not found" page (GitHub Pages serves it for unknown URLs)
sitemap.xml, robots.txt, llms.txt, <IndexNow key>.txt
favicon.ico, apple-touch-icon.png, site.webmanifest, assets/icon-192.png, assets/icon-512.png   Site icons
assets/styles.css       All styling, hand-edited. Theme tokens at the top: dark = charcoal/gold, light = ivory/gold
assets/script.js        Theme, TR | EN switch, search, reading bar, contents drawer, phone app screens, widgets
assets/styles.min.css   ← generated by build.ps1 from styles.css; the file pages actually load
assets/script.min.js    ← generated by build.ps1 from script.js; the file pages actually load
assets/fonts/           Inter .woff2 files for all text, Lexend for the dyslexia setting, and kd-brand-* (EB Garamond, only the logo's letters)
                        (SIL Open Font License; OFL*.txt); the *-ext-a files
                        are cut down to Latin Extended-A (Turkish ğ ş İ) to keep them small
assets/og-image.jpg     1200×630 social preview image
assets/art/             The paintings (see data/tablolar.json), the history strip's pictures (tl/) and the saints' portraits (saints/)
assets/vendor/          rosary3d.js: the Rosary's 3D beads with three.js, bundled by tools/rosary3d
data/compendium-1..4.js ← Compendium content (Turkish + English pairs), one file per part
data/kilise-tarihi.json ← Church history: eras (years, introduction) and events (year, title, short line, full text, picture, link),
                          shown on the home page's strip and on kilise-tarihi.html
data/tarih-gorseller.json ← The credits of that strip's pictures (assets/art/tl/<key>.jpg, with small square
                          copies for the home page's round pictures in assets/art/tl/s/): title, author, licence, source
data/tablolar.json      ← The paintings behind the page titles, in the sections and on the home cards
                          (assets/art/<key>.jpg, up to 1600 wide, with <key>-1200.jpg and <key>-800.jpg
                          copies for smaller screens; a painting 800 wide or less has only the one file).
                          A page's painting is also its picture when the link is shared
data/aziz-portreleri.json ← Credits of the twenty saints' round portraits on Azizler (assets/art/saints/<id>.jpg)
data/extras.js          ← Motu Proprio, Introduction, Creeds, Decalogue, Our Father, Appendix
data/katolik-sureci.js  ← OCIA/RCIA process content
data/gunah-cikarma.js   ← Confession guide content
data/kutsal-ayin.js     ← The Mass content
data/meseller.js        ← The parables of Jesus (six thematic categories)
data/tespih.js          ← Rosary prayers and mysteries
data/azizler.js         ← Saints calendar (one entry per day)
data/buyuk-azizler.js   ← The 20 best-known saints: long original biography per saint, one page each
data/sss.js             ← FAQ content
data/mucizeler.js       ← Catholic miracles (four thematic categories)
data/topraklarimizda-hristiyanlik.js ← Christianity's roots in Anatolia content
data/anadolu-haritasi.js  ← The Anatolian Roots map's places: coordinates, history, Scripture references
data/anadolu-harita-sekli.js ← The map's outline (generated from Natural Earth, public domain; don't edit)
data/neden-katoligiz.js ← "Why we're Catholic" content
data/azizler-adlar.js   ← Generated by the build: just each day's saint name, for the today's-saint pill
data/kiliseler.js       ← Parish locator: churches in Turkey by city and rite, with approximate (district) map positions
data/kilise-harita-sekli.js ← The Marmara coast in full detail for the parish map (generated; don't edit)
data/islama-cevap.js    ← Answering Islam: the summary, the four parts and the sources (Turkish + English)
data/ateizme-cevap.js   ← Answering atheism
data/yahudilere-cagri.js ← A call to the Jewish people
data/refs-bible.js, refs-quran.js, refs-hadith.js ← The passages the reference popups show; the build writes
                          the ones each page cites into that page
content/kutsal-kitap.md ← Bible guide text (Markdown)
content/hakkinda.md     ← Footer text: the one-line "about" sentence and the "Kaynaklar ve Telif" (sources and copyright) dialog (Markdown)
content/gizlilik.md, erisilebilirlik.md ← The privacy and accessibility pages (Markdown)
content/glossary-tr.txt ← The glossary's terms, one per line (built into sozluk.html by tools/sozluk.py)
tools/build.ps1         Regenerates the static pages from data/ and content/
tools/sozluk.py         Builds the glossary page's body from content/glossary-tr.txt
tools/yahudilere-cagri/ Builds data/yahudilere-cagri.js from its source text
tools/rosary3d/         Source of assets/vendor/rosary3d.js (Node)
tools/qa/               links.py (internal links and anchors, run by the deploy) and runtime.js (script errors in a browser)
cloudflare/contact-worker.js  The contact form's Cloudflare Worker, deployed by deploy-contact.yml
cloudflare/wrangler.jsonc     The Worker's config: its name, the katolikdunyasi.com/api/* route, the email and rate-limit bindings
cloudflare/README.md    Step-by-step Cloudflare setup for the contact form (Turnstile, Email Routing, Worker, route)
tools/anadolu-harita-sekli.mjs  Regenerates the map outline (Node; only if the map frame should change)
tools/kilise-harita-sekli.mjs   Regenerates the parish map's detailed Marmara coast (Node)
.github/workflows/deploy.yml  Builds and publishes this site to GitHub Pages on every push to main
.github/workflows/deploy-contact.yml  Publishes the contact form Worker when cloudflare/ changes
.github/workflows/deploy-english.yml  Builds verbumdomini/ and publishes the English site to Cloudflare
verbumdomini/           The English site (verbumdomini.ca), self-contained; see its README.md
docs/                   english-site.md (English site notes), owner-steps.md (dashboard settings), security-audit.md
CLAUDE.md               Rules and commands for AI-assisted work on both sites
CNAME                   Your domain (one line). Also used for canonical/sitemap URLs
```

Search works on every page: it loads the four data files the first time someone uses it, then searches the Katekizm's Turkish and English text, or jumps straight to a question number. `index.html?q=...` opens the home page with a search already filled in.

## Illustrated sections

Most guide pages (Topraklarımızda Hristiyanlık, Günah Çıkarma, Neden Katoliğiz?, Kutsal Ayin, Katolik Olma Süreci, Mucizeler, Meseller, Sorular, Kutsal Kitap) are built from `Ill-Sec` in `tools/build.ps1`: a section with a line drawing beside it, a small "kicker" line over a large heading, and a colour tone (`gold`, `red`, `blue`, `green`, `purple`). The drawings are plain SVG strokes on a 120 × 120 grid in the `$Ill` table; each one draws itself as its section scrolls into view (`initDrawings` in `assets/script.js`) and appears whole without JavaScript or with "reduce motion" on. They are `aria-hidden`, purely decorative. To add one, add a set of `<path>` strokes to `$Ill` and name it in the page's `Ill-Sec` call. On a computer the drawing sits in a sticky column on the left; on phones it floats beside the heading.

## The contact form

`iletisim.html` has a form instead of an email address. It posts to `/api/contact`, which a Cloudflare Worker (`cloudflare/contact-worker.js`) answers: it checks a hidden trap field and Cloudflare Turnstile, then emails the message to the owner through Cloudflare Email Routing with the sender as Reply-To. The owner's address lives only in the Worker's secrets. The Turnstile site key (public) is `$TurnstileSiteKey` in `tools/build.ps1`; the İletişim page's Content Security Policy alone allows `challenges.cloudflare.com`. Setup and maintenance are in `cloudflare/README.md`.

## Editing content

1. Edit the text in `data/compendium-N.js` or `data/extras.js`. The format is described at the top of each file. A Q&A entry looks like this:
   ```js
   { "type": "qa", "n": 16, "id": "soru-16", "ccc": "85–90, 100",
     "tr": { "q": "…", "a": "… [[Petrus'un|Peter]] ardılı …" },
     "en": { "q": "…", "a": "…" } }
   ```
   - `[[Türkçe|English]]` marks a name that is spelled differently in Turkish. It is displayed as "Petrus'un (Peter)".
   - In an answer, `\n` starts a new paragraph, and a line that starts with `- ` becomes a bullet point.
   - Keep the text between the `/*JSON-START*/` and `/*JSON-END*/` markers as strict JSON: use double quotes and no trailing commas.
2. Rebuild the static pages:
   ```
   powershell -ExecutionPolicy Bypass -File tools\build.ps1
   ```
   On macOS or Linux, run `pwsh tools/build.ps1` instead. The build takes about one second. On GitHub this happens automatically on every push (see below).

Search reads the data files at runtime, so edits show up in search results immediately. The pages themselves are pre-rendered for search engines, so they need the build.

**Domain:** the build reads your domain from the `CNAME` file (one line, e.g. `ornekalan.com`) and uses `https://<that domain>` for canonical, Open Graph and sitemap URLs. The file holds `katolikdunyasi.com`. If it is missing or holds a placeholder, the build prints a warning and falls back to `https://www.example.com`.

## Phones: pages as app screens

Below 980px wide, every page except the home screen is shown as a screen of an app (`initAppView` in `assets/script.js`). The Katekizm's pages and the calendar of saints are read in levels: the page's sections as a list, a section with its items as a list, an item on its own. Every other page is one long page, as on a computer. All of the page's text stays in its HTML, so search engines read the same page on a phone as on a computer. Each level has its own `#anchor` address, so the browser's back steps back a level and links open the right level. The bar at the top leads back to the page's home screen app (Öğren, Dua Et, Keşfet, Cevap Ver) or the page it belongs to (`Av-Parent` in `tools/build.ps1`); where a level holds Latin originals, a Türkçe / Latina switch swaps the text in place. Which elements are levels on each page is set in `AV_PAGES` in `assets/script.js`.

An X beside the settings gear returns to the home screen, where the four app icons are. The home screen's bar is drawn after the App Store's: a glyph and a name for each app, the open one in a capsule; tapping another app switches to it at once. The type, on every screen size, is Lexend (`assets/fonts`, SIL Open Font License); the logo alone is set in EB Garamond. Resizing a window across the phone width (980px) reloads an inner page in the other layout. Further into a page, its small icon and name lead straight back to the page's first screen (going back in the browser's history as many steps as that takes), with the levels in between shown under them. On the Katekizm's own pages a magnifier in the bar opens the question search across it.

## Articles: one long page, loaded as it is read

Every page but the home page, the Katekizm's pages, the calendar of saints, Kilise Bul and İletişim is an article (`data-article` on its `<body>`, set by `Write-Page`). An article shows its first screens and brings in the rest a part at a time as the reader nears the end of what is there (`initArticleFlow` in `assets/script.js`). All of the text is in the HTML from the start, so search engines and readers without JavaScript get the whole page. A link to a place further down, a page opened at an `#anchor`, the browser's find (Ctrl/Cmd+F) and printing bring in everything needed. A thin gold bar at the top of the screen shows how much of the whole article has been read. A round button in the lower corner opens the list of the article's sections (`initJumpList`). Long articles are one centred column of text; each section's painting sits under its heading (`Paint-Sections` in `tools/build.ps1`), and the section's first paragraph opens with a large letter.

## References and addresses

Every Scripture reference in a page's text (Turkish or English book names, e.g. "Matta 13:1–23", "1. Korintliler 12:13", "Luke 15:3–7") is linked at build time to that passage on BibleGateway in the RSV Catholic Edition (`Link-Refs` in `tools/build.ps1`); the English of the parables, which is the Douay-Rheims text, links to the same passage in that translation. Catechism paragraph references (the "KKK/CCC" numbers under the questions and in the text) open the Catechism on vatican.va in a new window: `data/ccc-vatican.json`, when present, maps paragraph ranges to the vatican.va page holding them, and a paragraph it doesn't cover opens the Catechism's contents page there.

The Katekizm overview is `katekizm.html`; its old address `katesizm.html` is a forwarding page that keeps any `?q=` search and `#question`.

## Editing the sources and copyright text

Edit `content/hakkinda.md`. On github.com, open the file, click the pencil icon and commit. The workflow rebuilds every page in about a minute, since the text appears in each page's footer. In the top block (between the `---` lines), `title` is the footer link and dialog heading, and `about` is the one-line sentence under the site name in the footer. The rest is Markdown, shown in the "Kaynaklar ve Telif" dialog:

| Write | Result |
|---|---|
| `## Heading` / `### Smaller heading` | section headings |
| blank line between lines | new paragraph |
| `**bold**`, `*italic*` | **bold**, *italic* |
| `[link text](https://…)` | link |
| `- item` or `1. item` | bullet / numbered list |
| `> text` | highlighted quote |
| `---` | divider line |

Raw HTML is shown as plain text, so the page can't be broken by accident.

## Publishing on GitHub Pages with your Cloudflare domain

**1. Put the files in the repository.** The *contents* of this folder go at the root of the repository, so `index.html` is at the top level. Include the hidden files (`.github/`, `.gitignore`, `.gitattributes`, `.htmlvalidate.json`). The branch must be called `main`.
- With GitHub Desktop or git: add everything, commit, push.
- In the browser: repository → **Add file → Upload files**, drag in everything *inside* this folder (not the folder itself), then commit.

**2. Turn on Pages (one time).** Repository → **Settings → Pages → Build and deployment → Source: "GitHub Actions"**. Pushing now runs the workflow; watch it under the **Actions** tab (a green tick means it's live).

**3. Set your domain.**
- Put your domain in `CNAME` (e.g. `ornekalan.com` or `www.ornekalan.com`) and commit.
- Settings → Pages → **Custom domain**: enter the same domain → Save. (With Actions deployments, this setting, not the CNAME file, is what GitHub uses for serving; the file feeds the build.)

**4. Cloudflare DNS** (Cloudflare → your domain → DNS → Records). Keep the GitHub domain verification TXT record (`_github-pages-challenge-<your-github-username>`): it makes katolikdunyasi.com a verified domain, so no other GitHub account can claim it.
- Apex domain (`ornekalan.com`): four **A** records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Optional **AAAA** records for `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
- `www`: a **CNAME** record `www` → `<your-github-username>.github.io`. GitHub then redirects between www and the apex automatically.
- Set these records to **DNS only** (grey cloud) at first, so GitHub can issue its HTTPS certificate.

**5. HTTPS.** Once Settings → Pages shows the DNS check passed and the certificate is ready (minutes to a few hours), tick **Enforce HTTPS**. After that you may switch the Cloudflare records to **Proxied** (orange cloud) if you want Cloudflare's CDN. If you do, set Cloudflare **SSL/TLS mode to "Full (strict)"**. Never use "Flexible", which causes a redirect loop.

**6. Cloudflare caching (current setup).** The records are **Proxied**, with SSL/TLS **Full (strict)**, **Always Use HTTPS** and **HSTS** (6 months, no preload). Cache Rules keep the files that rarely change at Cloudflare's edge:
- `/assets/*` (CSS, JS, fonts, images): Edge TTL and Browser TTL 1 year. Safe because every CSS/JS link carries a content hash (`?v=…`); if you replace a font or an image under the same name, purge that URL (Caching → Configuration → Purge Cache).
- `/data/*` (the Catechism text and the verse popups the scripts fetch): Edge TTL and Browser TTL 2 hours, so data edits are visible within a couple of hours.
- The pages (`/`, and paths ending in `.html`): Edge TTL 10 minutes, matching the pages' own `max-age=600`, so a deploy shows up within 10 minutes.
- Keep **Block AI bots** and Cloudflare's **managed robots.txt** off (the site's own `robots.txt` and `llms.txt` invite crawlers), and leave **Rocket Loader** off. If GitHub's Pages settings ever show a certificate warning, switch the records to DNS only for an hour, then back.

**Updating later:** edit `data/*.js`, `content/hakkinda.md` or the assets, then commit. The workflow rebuilds and republishes. The pages, `sitemap.xml` and the minified CSS/JS are not kept in the repository (see `.gitignore`): the workflow builds them on every push, so you only run `tools/build.ps1` yourself to preview locally.

## Translation conventions

- **Terminology** follows Turkish Catholic usage: Kutsal Sır (sacrament), Efkaristiya, Konfirmasyon, Tövbe ve Barışma, Kutsal Üçlü, Havari, Öğretim Makamı (Magisterium), Araf, Kutsal Ayin (Missa), and so on.
- **Names:** when a name is spelled differently in Turkish, the first mention in each card shows the Turkish form followed by the English in parentheses, e.g. Petrus (Peter), Aziz Augustinus (Saint Augustine), İznik (Nicaea), Kadıköy (Kalkedon) (Chalcedon). İsa (Jesus) and Meryem (Mary) appear on almost every card, so they are not glossed each time. The footer explains this.
- **Scripture:** citations keep the Catholic canon and the verse numbering of the Vatican source. That includes the Deuterocanonical books (e.g. 2 Makabeler 7:28, Bilgelik, Sirak) and the Catholic Psalm verse numbering (e.g. Mezmurlar 51:19). Book names are in Turkish.
- **Source corrections:** a few errors in the Vatican page were fixed, and each fix is marked:
  - Q420: "Galatians 1:25" becomes James 1:25. There is an editor's note on the card.
  - Q39: the CCC reference "2112–213" becomes 212–213.
  - Introduction footnote: "Laetarum magnopere" becomes *Laetamur magnopere*.
- **Q469 (death penalty):** the card translates the 2005 text faithfully and adds an editor's note about Pope Francis' 2018 revision of CCC 2267.

## Notes before publishing

- This is an **unofficial translation**. The original text is © Libreria Editrice Vaticana, and publishing a translation publicly normally requires LEV's permission. You may also want a Turkish Catholic reviewer (for example, someone connected to the Episcopal Conference of Türkiye) to check the terminology before launch.
- Serve the files with gzip or brotli. Most hosts do this automatically. With compression, the largest page (the Saints calendar) is about 140 KB. The deploy minifies the CSS and JS with esbuild (`npm install -g esbuild` to get the same result locally; without it the build falls back to a simpler minifier).

## Contact

Translation corrections, content suggestions and general feedback are welcome through the contact form on the site's [İletişim page](https://katolikdunyasi.com/iletisim.html).
