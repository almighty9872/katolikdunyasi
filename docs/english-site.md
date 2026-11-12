# English site: Verbum Domini (verbumdomini.ca)

Handoff notes for whoever works on the English site. The Turkish site (katolikdunyasi.com) is handled separately; don't change Turkish text from the English workstream.

## Ground rules

The rules for both sites (commit and deploy, no em dashes, no Claude lines, the owner's name, secrets, one folder per site) are in `CLAUDE.md` at the repo root. For the English site also:

- Don't use Wikimedia for new images.
- English should read like it was written in English: direct, plain, not "translated", not AI-sounding.
- Pronouns for the Holy Trinity (God the Father, Jesus Christ the Son, the Holy Spirit) are capitalized in our own text: He, Him, His, Himself. Quoted texts keep their source's wording: Scripture, the Catechism and Compendium, the Missal and other liturgical texts, prayers, and quotations from saints, popes and authors. Parable characters (the father, the shepherd, the master) stay lowercase inside the story; the explanation that names God or Christ is capitalized.
- The live katolikdunyasi.com stays Turkish-only. Its Catechism pages still have an English toggle.
- Nothing Turkish on verbumdomini.ca, and no links or language tags (hreflang) to the Turkish site.
- `docs/security-audit.md` records the closed security audit; its "Things to keep in mind" section applies to English-site work. In particular: a new painting goes into `verbumdomini/assets/art/` as a JPEG at the top level (the deploy makes its AVIF and WebP copies), the contact form only accepts posts from verbumdomini.ca, and there is no workers.dev preview address.

## How it's built (since the redesign port, November 2026)

The live site is built from `verbumdomini/app/`, first ported from the "Verbum Domini Redesign" artifact (now retired; all work happens here). It is a single-page app: `app/index.html` is the shell and its script, and each page is a fragment in `app/pages/<slug>.html` (listed in `app/pages/index.json`) that the app loads when the address is `/<slug>.html` (the home page is `/`; a place inside a page follows as a hash, `/holy-bible.html#genesis/1`). The app moves between pages with the History API (`vGo`/`vH` in the shell's script); older `/#<slug>` addresses still open and are replaced by the page's own.

- Build: `python3 verbumdomini/tools/build-app.py` writes `verbumdomini/_site_en/`. It first runs Tailwind CSS (pinned at 4.1.11 in `verbumdomini/package.json`; install once per checkout with `npm ci --prefix verbumdomini --ignore-scripts`) to build `app/app.css` from `app/src/app.tw.css`. `app.css` is build output and not in git: style changes go into `app.tw.css` (plain CSS works there too). It copies `app/`, moves the shell's script to `app.js` (and versions it and `app.css` by content hash), and writes a real `<slug>.html` for every page: the shell with that page's title, description, canonical address and text already in place, so search engines and the old `.html` links keep working, and the app takes over in place. Links the app writes as `#<slug>` become `/<slug>.html` in the built pages. It also writes `saints.html` and `more.html`. It also writes `rosary.html`, `bible.html` (the old Bible address), `404.html`, the sitemap, robots.txt, llms.txt, the manifest and `_headers`.
- QA: html-validate as below, and `python3 verbumdomini/tools/qa/app-links.py verbumdomini/_site_en` (links to `#<page>` are app pages, not anchors).
- Pictures and fonts that the artifact kept in its asset store are in `app/blob/` (named by their asset id) and linked as `/blob/<id>.<ext>`.
- The Rosary page frames `app/rosary/pray-the-rosary.html` (the old site's Rosary, kept as built), so `_headers` and `cloudflare/worker.js` allow framing by the site itself (`frame-ancestors 'self'`).
- The Popes (`/popes.html`, each pope at `/popes.html#<name>`): the source is `app/data/popes.json` (lives, acts, and a selection of documents linking to vatican.va). After editing it, run `python3 verbumdomini/tools/popes.py`, which writes the page fragment `app/pages/popes.html` and the page's entries in `index.json` and `search.json`. The app script draws the explorer and each pope's page (`popesInit` in `app/index.html`).
- Contact form: posts to `/api/contact` (`cloudflare/contact.js`) with Turnstile, as before.
- Sync between devices is not live yet: the app hides it when there is no sync store. It needs a `/api/sync/<code>` route in the Worker backed by a KV namespace the owner creates.
- The previous build (`tools/build.ps1 -EnglishSite` with `data/`, `content/`, `assets/`, `en/`) is no longer deployed. The notes below describe it.

## The previous build

**The English site has its own folder, `verbumdomini/`, and nothing in it is shared with the Turkish site.** It was copied from the shared source on 8 October 2026 (the copy built byte-for-byte the same site) and from then on the two sites evolve separately:

- English work happens only inside `verbumdomini/`: its `data/`, `content/`, `assets/` (styles, script, fonts, pictures), `tools/` (its own copy of `build.ps1` and the helper scripts) and `cloudflare/` (the Workers config).
- The Turkish site is everything outside `verbumdomini/`. Don't edit it from the English workstream, and don't expect a change there to reach verbumdomini.ca: the root's own `-EnglishSite` build is no longer deployed (the Turkish workstream can remove it, with `tools/en-site/`, `tools/en-rewrite/` and the `en/` twins).
- Deploys follow the folders: `.github/workflows/deploy-english.yml` runs only when `verbumdomini/` (or that workflow) changes; the Turkish `deploy.yml` ignores `verbumdomini/`.

```
pwsh -NoProfile -File ./verbumdomini/tools/build.ps1 -EnglishSite   # English site -> verbumdomini/_site_en/
```

The copied build still carries the bilingual machinery it came with: data fields come in pairs (`xxx` / `xxxEn`, `content/*-en.md`), `T(tr,en)` renders a pair, and `-EnglishSite` keeps the English half. Inside `verbumdomini/` only the English halves matter; the Turkish halves are leftovers that `strip_tr.py` empties from the output and that can be deleted over time. It also writes Turkish pages and `en/` twins inside `verbumdomini/` as a by-product; they are gitignored.

What `-EnglishSite` does (the block before `Write-Host "Done."` in `verbumdomini/tools/build.ps1`):
- copies the `en/*.html` twins to the root of `_site_en/` and strips the Turkish halves
- English alone: no hreflang links or `og:locale:alternate`, no mention of katolikdunyasi.com, data files without Turkish (strip_tr.py), `data-en-base=""` on every page including 404. In `assets/script.js`, `EN_SITE` (true when `data-en-base` is empty) makes the script write English only, build links to the English pages (`siteHref`) and leave the Turkish out of the reference popups
- removes the language pill
- rewrites `https://katolikdunyasi.com/en/` to `https://verbumdomini.ca/` and `/en/` links to `/`
- drops pages not offered in English (Find a Church and the church pages, Christianity in Our Lands): menu items are removed, links in running text are unwrapped
- swaps the brand to "Verbum Domini" (font `assets/fonts/kd-brand-en.woff2`) and replaces the text "katolikdunyasi.com" with "Verbum Domini"
- writes its own sitemap, robots.txt, llms.txt and site.webmanifest
- `$EnSiteUrl = 'https://verbumdomini.ca'`, `$EnTagline = 'Spreading and defending the Gospel'`

The next step for the English site, when there is time: give it a build of its own made for articles (for example Astro: Markdown articles with date, author, category and tags, RSS, category pages), and an editor such as Pages CMS, so content can be written without code.

In `build.ps1`, a curly apostrophe (’) inside a single-quoted PowerShell string ends the string and breaks the build. Put such text in double quotes.

Sources on the case pages (Answering Islam, Answering Atheism) are `[Turkish, link, English, English link]`; put `"-"` for one language to cite a source on the other language's page only (the English page cites Pew where the Turkish cites Özarslan).


## Tools

All paths below are inside `verbumdomini/` (run them from there, e.g. `cd verbumdomini`).

- `tools/en-rewrite/`: edit English fields in data files without touching Turkish.
  - `python3 tools/en-rewrite/dump.py data/sss.js` prints every English field with its path.
  - `apply.py <file> <patch.json>`: patch is `{ "/path": "new text" }`; replaces whole fields, refuses empty values and em dashes.
  - `sub.py <file> <patch.json>`: patch is `[[path, old, new], ...]`; replaces one unique substring in a field.
  - `data/tespih.js` doesn't round-trip; edit it with plain string replacement.
  - Porting Rosary data or code from the Turkish `data/tespih.js` or `assets/script.js`: the `"hd"` objects on the Rosary art entries carry no Turkish `"t"` here (they keep f, w, h, x, y, p, a, ae, te). Leave `"t"` out, and keep the desktop caption's fallback to `"te"` when `"t"` is missing.
  - `usspell.py <file>` (add `--dry` to preview): makes British spellings American in a file's English fields (the site's English is US). It skips quoted Scripture (`/en/text`); check anything else inside quotation marks by hand, since quotations keep their published spelling.
- `tools/yahudilere-cagri/`: `data/yahudilere-cagri.js` is generated. Turkish text lives in `gen.py`, English in `en.py`, auto-links in `linker.py`. Edit those, then `python3 tools/yahudilere-cagri/gen.py data/yahudilere-cagri.js`.
- `tools/en-site/strip_tr.py _site_en`: run by `build.ps1 -EnglishSite` (needs Python). Empties the Turkish half of every pair in the English site's data files and in the passages each page embeds, keeping the structure the script expects; it lists any Turkish-only letters left over (names like İzmir or Wojtyła are expected). The build stops if it fails.
- `tools/qa/links.py _site_en`: internal link and anchor check (expects `total bad 0`).
- `tools/qa/runtime.js <dir>`: Playwright run of every page on desktop and phone; reports JS errors, horizontal overflow and possible Turkish leaks. Serve the folder on port 8772 first (`python3 -m http.server 8772`). Needs the `playwright` package. The leak check has false positives; read them.
- HTML validation: `npx --yes html-validate@9 --config .htmlvalidate.json "_site_en/*.html"`.

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
