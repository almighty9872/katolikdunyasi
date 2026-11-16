# Verbum Domini (verbumdomini.ca)

The English Catholic site, https://verbumdomini.ca. Everything it is built from lives in this folder. Nothing here is shared with the Turkish site (katolikdunyasi.com), which is the rest of the repository (`almighty9872/katolikdunyasi`). The folder was copied from the shared source on 8 October 2026, and the two sites have grown apart since. In November 2026 the site was rebuilt as a single-page app, which is what verbumdomini.ca serves now.

## What is on the site

The menu has five sections, in this order:

- **Library:** the Holy Bible (all 73 books of the Douay-Rheims, with modern book names, Bishop Challoner's notes, a short guide to each chapter, a study appendix of apocryphal and Ethiopian books, and the Church Fathers on 33 chapters of Genesis), the full Compendium of the Catechism (598 questions and answers), Canon Law in plain words, Free e-Books (starting with The Confessions of St. Augustine), and a glossary of Catholic terms.
- **Guides:** the Order of the Mass, the Roman Missal Guide, Confession (with the Ten Commandments and an examination of conscience) and How to Become Catholic.
- **Prayer:** the Rosary (prayed bead by bead if you like), Divine Mercy, Deliverance Prayers, and Common Prayers in English and Latin.
- **Answers:** Frequently Asked Questions, the parables of Jesus (each on its own page), Why We're Catholic, Answering Atheism, Answering Islam and A Call to Our Jewish Friends.
- **History:** the history of the Rosary, the history of the Church in paintings, Vatican II Explained, The Popes, a saint for every day of the year with long biographies of the best-known saints, and miracles.

Each section also has its own page, used by the breadcrumb. Also: About This Site (with a What's new list), Contact, Accessibility, Privacy, and Sources and Copyright.

**The reader.** The Bible and the e-books share one reader, made to feel like Apple Books on phones and tablets and like Kindle's focus mode on a computer: pages turn with a swipe or a tap, and it has highlights, bookmarks, notes, a ribbon, read progress, word meanings and reading settings. On a computer the Church Fathers show beside the text; on a phone or tablet they open in a sheet.

**Free e-Books.** Each book can be read online, downloaded as PDF, EPUB, Kindle or text, or opened as a one-page version to print.

**The Popes** lists all 267 popes by era or in one sortable table. Each pope has his own page (`/pope-<name>.html`) with a life timeline, facts and his legacy, and where we have them his documents (linked to vatican.va), key moments, quotes and "Did you know?" cards. Most have a portrait, credited on the page.

**Reader tools:** search in the header across every page, a Welcome page with example searches and a banner for the liturgical season (with an Advent countdown), light and dark themes, a settings panel, keyboard shortcuts (they can be turned off), Save and Load for a backup of your settings and progress, and a download button for offline reading. Added to an iPhone or iPad Home Screen, the site opens full screen like an app.

**Accessibility:** the site follows WCAG 2.2 AA (skip link, full keyboard use, landmarks and heading levels, text for pictures, contrast, 24px targets). The Accessibility page says how it is tested.

**Printing:** every page has a print design: a title block, folded text printed open, menus and controls left out, light pictures, and the address and date at the bottom.

## Build and check

Once per checkout, install Tailwind (pinned in `package.json`):

```bash
npm ci --prefix verbumdomini --ignore-scripts
```

Then, from the repository root:

```bash
python3 verbumdomini/tools/build-app.py
```

```bash
npx --yes html-validate@9 --config verbumdomini/.htmlvalidate.json "verbumdomini/_site_en/*.html"
```

```bash
python3 verbumdomini/tools/qa/app-links.py verbumdomini/_site_en | tail -1
```

```bash
node --check verbumdomini/_site_en/app.js
```

The HTML check passes with no output, and the link check ends with `total bad 0`. After a change to `cloudflare/`, also run `npx --yes -p typescript@5.9.3 tsc -p verbumdomini/jsconfig.json` (no output means it passed).

The build needs Python 3 and Node, and writes `verbumdomini/_site_en/`, which is not kept in git. It:

- builds `app/app.css` with Tailwind from `app/src/app.tw.css` (edit styles there, never in `app.css`);
- copies `app/`, moves the shell's script out to `app.js`, and gives `app.js` and `app.css` a content hash in their addresses;
- writes a real file for every page (`/mass.html`, `/holy-bible.html`, ...) with that page's title, description and text already in place, so search engines can read it and a reload works;
- writes a page for each pope (`/pope-<name>.html`) and each parable (`/parable-<name>.html`) with its own title, description, picture and structured data. Old `popes.html#<name>` and `parables.html#<name>` addresses still open them;
- writes the sitemap, `robots.txt`, `llms.txt`, `site.webmanifest`, `404.html` and `_headers`.

## Deploy

A push to `main` that changes this folder runs `.github/workflows/deploy-english.yml`. It installs Tailwind, builds the site, checks that `app.js` parses, validates the HTML, checks the links, then publishes `_site_en/` with Wrangler to two Cloudflare Workers. It can also be started by hand from the Actions tab.

- `verbumdomini` serves the site on verbumdomini.ca (`cloudflare/wrangler.jsonc`, `worker.js`) and answers the contact form at `/api/contact` (`contact.js`: trap field, Turnstile, then mail through Cloudflare Email Routing).
- `verbumdomini-www` sends www.verbumdomini.ca to verbumdomini.ca (`cloudflare/www.jsonc`, `www-redirect.js`).

The workflow uses the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The contact form's `TO_ADDRESS` and `TURNSTILE_SECRET` are Worker secrets set in the Cloudflare dashboard, never in the repository.

## Folder layout

```
app/                The site itself (the source the build reads)
  index.html        The shell: header, menus, search, settings, and the whole app script
  src/app.tw.css    Styles (Tailwind source; app.css is built from it and not kept in git)
  pages/            One HTML fragment per page, plus index.json (titles and descriptions)
                    and search.json (the search index)
  bible/            The Douay-Rheims, one JSON file per book, with notes/ and guide/ per book,
                    fathers/ (the Church Fathers), the Compendium, hard words and the paintings' list
  books/            The e-books' text (confessions.json)
  confessions-print.html  The Confessions as one page to read and print
  data/             popes.json (the popes), readings-ca.json (daily Mass readings), and the
                    Bible, Quran and hadith references for the popups
  rosary/           Pray the Rosary, shown in a frame
  art/              Paintings; art/popes/ (pope portraits), art/fathers/ (Church Fathers)
  blob/, fonts/     Pictures and fonts
  files/            Downloads: the Order of the Mass (PDF) and the Confessions (PDF, EPUB, Kindle, text)
  splash/           Start-up screens for the Home Screen app on iPhone and iPad
  sw.js             Service worker: offline reading of the Bible and visited pages
tools/
  build-app.py      The build
  popes.py          Builds the popes page and its search entries from app/data/popes.json
  pope-portraits.py Finds and crops pope portraits
  fathers.py        Writes the Church Fathers files in app/bible/fathers/
  confessions.py    Writes app/books/confessions.json (the format for every e-book)
  book-files.py     Makes a book's downloads and print page (with book-files.mjs)
  qa/app-links.py   The link check
  qa/runtime.js     Runs every page on desktop and phone in a browser and reports errors
cloudflare/         The Workers' code and config
package.json        Tailwind, pinned
jsconfig.json       Type check settings for cloudflare/
```

## Editing

- **A page:** edit its fragment in `app/pages/<slug>.html`. A new page also needs an entry in `app/pages/index.json` and `search.json`, and a place in the menu in `app/index.html`.
- **Styles:** edit `app/src/app.tw.css`, then build.
- **The popes:** edit `app/data/popes.json`, run `python3 verbumdomini/tools/popes.py`, then build.
- **Pope portraits:** `python3 verbumdomini/tools/pope-portraits.py` finds public-domain portraits through Europeana, crops each around the face and saves it to `app/art/popes/`, with its credit in `popes.json`. A pope with no portrait shows his number on a crossed-keys emblem.
- **A new e-book:** put its text in `app/books/<slug>.json` (format in `tools/confessions.py`), run `python3 verbumdomini/tools/book-files.py <slug>` for its downloads and print page, and copy the Confessions card on `app/pages/free-ebooks.html`.
- **A new painting:** put it in `app/art/` as a JPEG and link the JPEG itself.
- **Writing:** plain, natural English. Pronouns for God are capitalized in our own text (He, Him, His); quoted texts keep their source's wording.

## Not live yet

Sync between devices is built but hidden: it needs a `/api/sync/<code>` route in the Worker, backed by a KV namespace the owner creates. Until then, readers use Save and Load.

## History and more

Until November 2026 the site was built by `tools/build.ps1 -EnglishSite`, a copy of the Turkish site's build. That build was deleted; the git history has it.

Rules, tools and status for the English site: `docs/english-site.md`. Rules for both sites: `CLAUDE.md` at the repository root.
