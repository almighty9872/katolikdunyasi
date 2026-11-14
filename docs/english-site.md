# English site: Verbum Domini (verbumdomini.ca)

Handoff notes for whoever works on the English site. The Turkish site (katolikdunyasi.com) is handled separately; don't change Turkish text from the English workstream.

## Ground rules

The rules for both sites (commit and deploy, no em dashes, no Claude lines, the owner's name, secrets, one folder per site) are in `CLAUDE.md` at the repo root. For the English site also:

- Don't use Wikimedia for new images.
- English should read like it was written in English: direct, plain, not "translated", not AI-sounding.
- Pronouns for the Holy Trinity (God the Father, Jesus Christ the Son, the Holy Spirit) are capitalized in our own text: He, Him, His, Himself. Quoted texts keep their source's wording: Scripture, the Catechism and Compendium, the Missal and other liturgical texts, prayers, and quotations from saints, popes and authors. Parable characters (the father, the shepherd, the master) stay lowercase inside the story; the explanation that names God or Christ is capitalized.
- The live katolikdunyasi.com stays Turkish-only. Its Catechism pages still have an English toggle.
- Nothing Turkish on verbumdomini.ca, and no links or language tags (hreflang) to the Turkish site.
- `docs/security-audit.md` records the closed security audit; its "Things to keep in mind" section applies to English-site work. In particular: a new painting goes into `verbumdomini/app/art/` as a JPEG (the app build makes no AVIF or WebP copies, so link the JPEG itself; its AVIF/WebP note is about the retired build), the contact form only accepts posts from verbumdomini.ca, and there is no workers.dev preview address.

## How it's built (since the redesign port, November 2026)

The live site is built from `verbumdomini/app/`, first ported from the "Verbum Domini Redesign" artifact (now retired; all work happens here). It is a single-page app: `app/index.html` is the shell and its script, and each page is a fragment in `app/pages/<slug>.html` (listed in `app/pages/index.json`) that the app loads when the address is `/<slug>.html` (the home page is `/`; a place inside a page follows as a hash, `/holy-bible.html#genesis/1`). The app moves between pages with the History API (`vGo`/`vH` in the shell's script); older `/#<slug>` addresses still open and are replaced by the page's own.

- Build: `python3 verbumdomini/tools/build-app.py` writes `verbumdomini/_site_en/`. It first runs Tailwind CSS (pinned at 4.1.11 in `verbumdomini/package.json`; install once per checkout with `npm ci --prefix verbumdomini --ignore-scripts`) to build `app/app.css` from `app/src/app.tw.css`. `app.css` is build output and not in git: style changes go into `app.tw.css` (plain CSS works there too). It copies `app/`, moves the shell's script to `app.js` (and versions it and `app.css` by content hash), and writes a real `<slug>.html` for every page: the shell with that page's title, description, canonical address and text already in place, so search engines and the old `.html` links keep working, and the app takes over in place. Links the app writes as `#<slug>` become `/<slug>.html` in the built pages. It also writes `saints.html` and `more.html`. It also writes `rosary.html`, `bible.html` (the old Bible address), `404.html`, the sitemap, robots.txt, llms.txt, the manifest and `_headers`.
- QA: html-validate as below, and `python3 verbumdomini/tools/qa/app-links.py verbumdomini/_site_en` (links to `#<page>` are app pages, not anchors).
- Pictures and fonts that the artifact kept in its asset store are in `app/blob/` (named by their asset id) and linked as `/blob/<id>.<ext>`.
- The Rosary page frames `app/rosary/pray-the-rosary.html` (the old site's Rosary, kept as built), so `_headers` and `cloudflare/worker.js` allow framing by the site itself (`frame-ancestors 'self'`).
- The Popes (`/popes.html`, each pope at `/popes.html#<name>`): the source is `app/data/popes.json` (lives, acts, and a selection of documents linking to vatican.va). After editing it, run `python3 verbumdomini/tools/popes.py`, which writes the page fragment `app/pages/popes.html` and the page's entries in `index.json` and `search.json`. The app script draws the explorer and each pope's page (`popesInit` in `app/index.html`).
- Books of the library (the Confessions, and every book added later) are read in the Bible's reader: highlights, bookmarks, notes, the ribbon, read progress, listening, focus mode and the other reading tools work as in the Bible. The text is `app/books/<slug>.json` (format in `tools/confessions.py`), one part of the book (a Book of the Confessions) per reader page, its sections numbered like verses (`/confessions.html#10/38`). A new book needs its JSON, a contents page like `app/pages/confessions.html`, its slug in `BKS` (`app/index.html`) and in `SUBS` (`tools/build-app.py`). The Confessions are written by `python3 verbumdomini/tools/confessions.py`.
- Church Fathers on the Bible: `verbumdomini/tools/fathers.py` writes `app/bible/fathers/<book>.json` (the Fathers, their works and the chapters that have commentary) and `app/bible/fathers/<book>/<chapter>.json` (Genesis for now, 33 of 50 chapters: Basil, Gregory of Nyssa and Augustine on creation; Augustine's City of God, the Summa of St. Thomas Aquinas and the Ante-Nicene Fathers Clement, Justin, Irenaeus, Theophilus, Hippolytus and Cyprian on the rest; Protestant commentaries are not used). A Father's second work is named in the entry's 7th field and described in `K`. The service worker keeps `bible/*.json` cache-first, so bump `BIBLE` in `app/sw.js` when one changes from `tools/fathers/src.json`; the verse mapping and our short titles are in the script. In the reader (bibFathers in `app/index.html`) a chip under a verse opens a panel: docked beside the text from 1200px, a side sheet on tablets, a bottom sheet on phones. Reading tools has a Church Fathers switch. A new book: add its JSON and its slug to FAB.
- Downloads and print copies of a book (the steps for every book of the library, first done for the Confessions): `python3 verbumdomini/tools/book-files.py <slug>` writes, from `app/books/<slug>.json`, the one-page version to read and print (`app/<slug>-print.html`, with a Print button; `?print` opens the print dialog on load) and `app/files/<file>.pdf` (6 x 9 in, cover, contents with page numbers, bookmarks), `.epub` (EPUB 3 with an EPUB 2 table of contents), `.azw3` (Kindle, made from the EPUB with Calibre's `ebook-convert`; install it with `apt-get install calibre`, since downloads from Calibre's site are blocked in cloud sessions) and `.txt`. A new book needs an entry in `BOOKS` at the top of the script (file name, title lines, author, translator, the about and text notes, cover painting). Run it after the book's text changes, then build. It stops if the PDF has an empty page, a page that ends on a chapter heading, or a gap at the foot of a page other than the last page of a Book: in print, chapters begin inside the text (a small "Chapter N" label at the start of the paragraph) and each Book starts on a new page, so these never happen.
- On the Free e-Books page (`app/pages/free-ebooks.html`) each book is an `eb-book` card: Read online, a Download drop-down (PDF, EPUB, Kindle, Text, with sizes; copy the Confessions card and change the file names and sizes), Print, One-page version, and the Kindle note. The drop-down is a `<div class="ddm">` with a button and a `hidden` menu; the app script (`ddSet` in `app/index.html`) opens and closes every `.ddm`. Don't use `<details>` for it (Chromium clips the open menu) or the class `dd` (the site's header menus use it).
- Pages carry no Previous/Next links at the bottom; in the Bible reader they stay in the page, hidden, for the arrow keys and page turns.
- Contact form: posts to `/api/contact` (`cloudflare/contact.js`) with Turnstile, as before.
- Sync between devices is not live yet: the app hides it when there is no sync store. It needs a `/api/sync/<code>` route in the Worker backed by a KV namespace the owner creates.
- The previous build (`tools/build.ps1 -EnglishSite`) was retired in November 2026 and deleted (see below).

## The previous build

Until November 2026 the site was built by `tools/build.ps1 -EnglishSite` from `data/`, `content/` and `assets/`, a copy of the Turkish site's bilingual build. That build and its helpers (`tools/en-rewrite/`, `tools/en-site/`, `tools/yahudilere-cagri/`, `tools/qa/links.py`) were deleted in the November 2026 clean-up; the git history has them. The Rosary page's frame (`app/rosary/`) is that build's Rosary kept as built: its script reads paintings as `assets/art/<f>`, so the `f` entries in `app/rosary/data/tespih.js` climb out with `../` to `art/` and `blob/`.

The next step for the English site, when there is time: give it a build of its own made for articles (for example Astro: Markdown articles with date, author, category and tags, RSS, category pages), and an editor such as Pages CMS, so content can be written without code.

## Tools

All paths below are inside `verbumdomini/`.

- `tools/build-app.py`: the build (see above). `tools/popes.py`, `tools/fathers.py`, `tools/confessions.py`, `tools/book-files.py` and `tools/pope-portraits.py` write the data they are named for.
- `tools/qa/app-links.py _site_en`: internal link and anchor check (expects `total bad 0`).
- `tools/qa/runtime.js <dir>`: Playwright run of every page on desktop (1366px) and phone (390px); reports JS errors, failed requests, horizontal overflow, buttons and links cut off at the right edge, and possible Turkish leaks. Serve the folder on port 8772 first (`python3 -m http.server 8772`). The leak check has false positives (names such as Ağca, İznik); read them.
- HTML validation: `npx --yes html-validate@9 --config verbumdomini/.htmlvalidate.json "verbumdomini/_site_en/*.html"`.
- Type check of the Workers: `npx --yes -p typescript@5.9.3 tsc -p verbumdomini/jsconfig.json` (types in `cloudflare/globals.d.ts`).

## Status

Done:
1. English gaps filled; every page has English.
2. Build split (`-EnglishSite`), 48 pages, valid HTML, no broken links, no JS errors.
3. Native-English rewrite of every page written for the site: interface, homepage, guides, Bible guide, Mass, Rosary and its history, Confession, FAQ, Miracles, Church history, Parables, debate pages, the 20 great saints, the 365-day calendar, Privacy, Accessibility and Sources. Texts by others (the Vatican's Compendium, Douay-Rheims, the Roman Missal, traditional prayers, Pickthall) are left as published. The Sources page no longer shows Turkish (picture credits and portrait list now have English).

4. workers.dev preview set up. `.github/workflows/deploy-english.yml` runs when `verbumdomini/` changes (and by hand): it builds `verbumdomini/` with `-EnglishSite`, validates the HTML, checks the links, then deploys `_site_en/` with Wrangler to the Worker `verbumdomini` (config and a small `worker.js` in `verbumdomini/cloudflare/`). Address: https://verbumdomini.ca (registered with Cloudflare, connected as the Worker's custom domain in wrangler.jsonc); preview: https://verbumdomini.tzjcqs5g44.workers.dev. GitHub secrets: `CLOUDFLARE_API_TOKEN` ("Edit Cloudflare Workers" template), `CLOUDFLARE_ACCOUNT_ID`.
   - URLs keep `.html` (`html_handling: none`); `worker.js` serves `/` and redirects `/mass` to `/mass.html`; unknown paths get `404.html`.
   - `www.verbumdomini.ca` is a second Worker, `verbumdomini-www` (`www.jsonc`, `www-redirect.js`), that 301-redirects to verbumdomini.ca, so ordinary page loads stay free static-file requests.
   - Test locally with `npx wrangler@4 dev --config verbumdomini/cloudflare/wrangler.jsonc`.
   - Leave the Worker `katolikdunyasi-contact` (the Turkish contact form, route `katolikdunyasi.com/api/*`) alone.

Next:
5. Contact form: the form posts to `/api/contact`, handled by `verbumdomini/cloudflare/contact.js` inside the verbumdomini Worker (trap field, Turnstile check, then mail through Cloudflare Email Routing). The Turnstile widget is shared with the Turkish site and lists verbumdomini.ca as a hostname. Set by the owner in Cloudflare, not in the repo: Email Routing on for verbumdomini.ca, and the Worker secrets `TURNSTILE_SECRET` and `TO_ADDRESS` (a verified destination address). `FROM_ADDRESS` (form@verbumdomini.ca) and the `CONTACT_EMAIL` binding are in `wrangler.jsonc`. Local test: put both secrets in a file outside the repo (Turnstile's test secret `1x0000000000000000000000000000000AA` always passes) and run `wrangler dev --env-file <file>`; sent mail is saved as .eml under `.wrangler/`.
6. At cutover:
   - Done: the old katolikdunyasi.com `/en/...` addresses redirect to verbumdomini.ca (Cloudflare Bulk Redirects).
   - Make the Turkish site's hreflang point to verbumdomini.ca and stop shipping `en/` on the Turkish site, except the 8 Catechism English pages, which move to the English site.
   - Turn off GitHub Pages only if the Turkish site also moves to Cloudflare.
