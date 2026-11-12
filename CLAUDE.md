# Repository Rules (both sites)
- Never commit, push or deploy without the owner's explicit "commit and deploy".
- No em dashes anywhere (content, commits, PRs).
- The owner's name and email never appear in the repo, commits, PRs or pages.
- Commit messages carry no Claude lines: no `Co-Authored-By: Claude` and no `Claude-Session:` link (the repo is public).
- Secrets (Cloudflare API token, Turnstile secret key) go into GitHub secrets by the owner. Never ask for them in chat and never write them to files.
- Repository: `almighty9872/katolikdunyasi` (renamed from `claude`; never create a new repo named `claude`, it would break GitHub's redirects). katolikdunyasi.com is a verified GitHub Pages domain: keep the `_github-pages-challenge-almighty9872` TXT record in Cloudflare DNS.
- Two sites, two folders: the Turkish site (katolikdunyasi.com) is everything outside `verbumdomini/`; the English site (verbumdomini.ca) is everything inside it. Work on one site never edits the other's files. English-site notes: `docs/english-site.md`.
- English-site work edits the live source in `verbumdomini/app/` directly (the "Verbum Domini Redesign" artifact is retired and deleted).

# Commands (run from the repo root)
- Turkish build: `pwsh -NoProfile -File ./tools/build.ps1 2>&1 | tail -3`. English build: `python3 verbumdomini/tools/build-app.py` (source: `verbumdomini/app/`). After editing `verbumdomini/app/data/popes.json`, run `python3 verbumdomini/tools/popes.py` first. Show more output only when the build fails.
- Turkish QA (pass = no output, then `total bad 0`): `npx --yes html-validate@9 --config .htmlvalidate.json "./*.html" "kilise/*.html"` and `python3 tools/qa/links.py | tail -1`. After a change to `assets/script.js` or `cloudflare/`: `npx --yes -p typescript@5.9.3 tsc -p jsconfig.json | head -5` (pass = no output; types for globals in `assets/globals.d.ts`).
- English QA: `npx --yes html-validate@9 --config verbumdomini/.htmlvalidate.json "verbumdomini/_site_en/*.html"` and `python3 verbumdomini/tools/qa/app-links.py verbumdomini/_site_en | tail -1`, plus `node --check verbumdomini/_site_en/app.js`. After a change to `cloudflare/`: `npx --yes -p typescript@5.9.3 tsc -p verbumdomini/jsconfig.json | head -5` (pass = no output; types for globals in `assets/globals.d.ts`).
- Inline page scripts: extract the script and run `node --check` on it.
- Deploy: a push to main. The Turkish site deploys from `.github/workflows/deploy.yml`, the English from `deploy-english.yml`. A commit that changes no site files (CLAUDE.md, docs) carries `[skip ci]`.

# Token Economy
- Generated files are build output, listed in `.gitignore` (root and `kilise/` pages, sitemap, `*.min.*`, `data/azizler-adlar.js`, `data/azizler-ozet-*.js`, `verbumdomini/_site_en/`). `rg` skips them by default; don't search them with `--no-ignore` or by naming them, and never read them to understand the code. Read the sources instead: `tools/build.ps1`, `data/`, `content/`.
- Lines in `build.ps1`, the data files and the pages run to thousands of characters: pipe every `rg`/`sed` on them through `cut -c1-200`.
- Run QA once, at the end of a task before the commit, not after every step. Check a single page with `rg` on that page.
- `git diff --stat` first; open the full diff of one file at a time.
- After a deploy, verify with one `curl -s <page> | grep -c <change>` on one changed page. If it fails after the deploy has had time to finish, report it rather than investigating.
- When a request could mean two things, ask one short question instead of working out both.
- Final reply: at most about 8 lines (what changed, the QA result, the commit hash); no list of files.

# Session Habits (from a token audit: re-reading a long conversation was 98.6% of all tokens)
- One task per session: start a new session after each "commit and deploy". This file and the git history carry what the next session needs.
- After a long idle gap, start a new session instead of resuming a large one: the cached conversation expires and is rebuilt at full size.
- Staying in one session: run `/compact` at about 150k-200k tokens of context, not at the automatic limit.
- Batch related requests into one message; every message re-sends the whole conversation.
- When a task ends with a deploy, Claude's final reply suggests a new session for the next task, in one line.

# Output & Verification Rules
- Do NOT capture screenshots or spawn browser verification tools automatically after making updates.
- Capture screenshots only when explicitly instructed in a prompt.
- Do not rewrite entire files when making small updates. Output only diffs or specific line modifications.
- Skip conversational greetings, pleasantries, filler text, or summaries of changes made unless explicitly requested.
- Provide implementations directly without lengthy step-by-step reasoning explanations.

# Execution Efficiency & Tool Directives
- Avoid invoking multi-agent workflows or sub-agents unless explicitly instructed.
- Web search is allowed for checking facts (dates, names, sources). Do not use notebook edit tools or background schedulers.
- Do NOT read full files to locate variable names, functions, or UI elements. Perform targeted searches using `ast-grep` or `rg` (ripgrep) first.
- Pipe all git status and diff commands through local log cleaning scripts if available (`git status --short`).
- Avoid verbose logging flags on terminal output. Use `--quiet` or `--silent` flags when available.
- Do not run `cat` on entire HTML or JS files over 100 lines. Read targeted line ranges using `sed` or line-specific range tools.
