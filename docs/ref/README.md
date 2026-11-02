# CCC reference file (local lookup, no network needed)

- `ccc-vatican-pages.json`: for every CCC paragraph, the exact vatican.va page that holds it (`{from,to,url}` ranges). Built in Nov 2026 by crawling vatican.va's Catechism pages and checking each paragraph number on its page; finer than `data/ccc-vatican.json`.
  Gaps on vatican.va: the pages for 512-570, 702-716, 751-780, 871-945 and 992-1004 have an apostrophe in their address and refuse automated requests, so they were placed from the Catechism's headings (boundaries confirmed against the full Catechism text). Paragraphs 2075-2082 are not on vatican.va; they point to the Ten Commandments introduction. The Lord's Prayer sub-sections (2762-2865) have no pages of their own; they point to their article page.
