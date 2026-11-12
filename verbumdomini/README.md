# Verbum Domini (verbumdomini.ca)

The English Catholic site, https://verbumdomini.ca. Everything it is built from lives in this
folder; nothing here is shared with the Turkish site (katolikdunyasi.com), which is the rest of the
repository (`almighty9872/katolikdunyasi`). The folder was copied from the shared source on
8 October 2026, and the two sites have evolved separately since. In November 2026 the site was
rebuilt as a single-page app (the "Verbum Domini Redesign"), which is what verbumdomini.ca serves now.

## Build and check

Run from the repository root:

```
python3 verbumdomini/tools/build-app.py                                # builds verbumdomini/_site_en/
npx --yes html-validate@9 --config verbumdomini/.htmlvalidate.json "verbumdomini/_site_en/*.html"
python3 verbumdomini/tools/qa/app-links.py verbumdomini/_site_en      # expects "total bad 0"
node --check verbumdomini/_site_en/app.js
```

The build needs only Python 3. It copies `app/`, moves the shell's script out to `app.js`, gives
`app.js` and `app.css` a content hash, and writes a real file for every page (`/mass.html`,
`/holy-bible.html`, ...) with that page's title, description and text already in place, so search
engines can read it and a reload works. It also writes the sitemap, `robots.txt`, `llms.txt`,
`site.webmanifest`, `404.html` and `_headers`. `_site_en/` is build output and is not kept in git.

## Deploy

A push to `main` that changes this folder runs `.github/workflows/deploy-english.yml`: it builds
the site, checks that `app.js` parses, validates the HTML, checks the links, then publishes `_site_en/` with Wrangler to two
Cloudflare Workers. It can also be started by hand from the Actions tab.

- `verbumdomini` serves the site on verbumdomini.ca (`cloudflare/wrangler.jsonc`, `worker.js`) and
  answers the contact form at `/api/contact` (`contact.js`: trap field, Turnstile, then mail through
  Cloudflare Email Routing).
- `verbumdomini-www` redirects www.verbumdomini.ca to verbumdomini.ca (`cloudflare/www.jsonc`,
  `www-redirect.js`).

The workflow uses the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The
contact form's `TO_ADDRESS` and `TURNSTILE_SECRET` are Worker secrets set in the Cloudflare
dashboard, never in the repository.

## Folder layout

```
app/            The site itself (the source the build reads)
  index.html    The shell: header, menus, search, settings, and the whole app script
  app.css       Styles, built by Tailwind from src/app.tw.css (build output, not in git)
  pages/        One HTML fragment per page, plus index.json (titles and descriptions) and
                search.json (the search index)
  bible/        The Douay-Rheims, one JSON file per book, with notes/ and guide/ per book,
                the Compendium, the meanings of hard words and the paintings' list
  data/         Daily Mass readings and the Bible, Quran and hadith references for popups
  rosary/       Pray the Rosary, the earlier site's Rosary kept as built and shown in a frame
  art/, blob/   Paintings and fonts
  files/        Downloads (the Order of the Mass as a PDF)
  sw.js         Service worker: offline reading of the Bible and the pages already visited
tools/          build-app.py (the build), qa/app-links.py (link check); the rest belongs to the
                previous build
cloudflare/     The Workers' code and config
CNAME           The site's domain
```

The folders `data/`, `content/`, `assets/`, `en/` and the HTML files at this folder's root, with
`tools/build.ps1 -EnglishSite`, are the previous build. They are no longer deployed.

Rules, tools and status for the English site: `docs/english-site.md`. Rules for both sites:
`CLAUDE.md` at the repository root.
