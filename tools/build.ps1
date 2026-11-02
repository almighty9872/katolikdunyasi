<#
.SYNOPSIS
  Static page generator for katolikdunyasi.com, a Turkish Catholic resource
  site: the Compendium of the Catechism of the Catholic Church (with the
  Vatican's English), the OCIA/RCIA process, the Mass explained, prayers and
  the Rosary, a calendar of the saints, the Bible in Turkish, miracles, the
  Church's history, answers to common objections, and an FAQ.

.DESCRIPTION
  Reads the single source of truth, data/*.js and content/*.md, and writes
  crawlable static HTML pages (all content pre-rendered for SEO) in Turkish at
  the site root, with JSON-LD structured data
  (WebSite, Book, Article, Church, BreadcrumbList), sitemap.xml, robots.txt and
  llms.txt into the site root.

  The generated files are not committed (see .gitignore): the deploy workflow
  runs this on every push. Run it locally to preview the site.
  No dependencies (esbuild is used for minifying when it is installed): Windows PowerShell 5.1 or PowerShell 7+ (Windows/macOS/Linux).
  Keep this file saved as UTF-8 WITH BOM so Windows PowerShell 5.1 reads the
  Turkish text correctly, and do not use typographic quote characters in string
  literals (PowerShell treats them as quotes); use &#8220; &#8221; in markup, and
  $Apos for the Turkish suffix apostrophe in text that Attr() will escape.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File tools\build.ps1 -SiteUrl https://www.yourdomain.com
  pwsh tools/build.ps1 -SiteUrl https://www.yourdomain.com
#>
param(
  # Absolute site root for canonical, og:url and sitemap URLs (no trailing slash).
  # Leave empty to use the domain in the CNAME file (https://<domain>).
  # The site is Turkish only: the English edition, verbumdomini.ca, is built from verbumdomini/.
  [string]$SiteUrl = ''
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$CnamePlaceholder = 'alanadiniz.com'
if (-not $SiteUrl) {
  $cnameFile = Join-Path $Root 'CNAME'
  $domain = if (Test-Path $cnameFile) { ([IO.File]::ReadAllText($cnameFile)).Trim() } else { '' }
  if ($domain -and $domain -ne $CnamePlaceholder) { $SiteUrl = "https://$domain" }
  else { $SiteUrl = 'https://www.example.com'; Write-Warning "CNAME is missing or still the placeholder: canonical/sitemap URLs use $SiteUrl" }
}
$SiteUrl = $SiteUrl.TrimEnd('/')
# Last-changed date of a page: the newest git commit touching the data it is built from
# (sitemap <lastmod>, Article dateModified). Template-only changes don't count, and with no
# git history (a plain folder, a shallow clone) pages simply carry no date.
$PageSources = @{
  'katekizm.html' = @('data/compendium-1.js', 'data/compendium-2.js', 'data/compendium-3.js', 'data/compendium-4.js')
  'iman-ikrari.html' = @('data/compendium-1.js'); 'kutsal-sirlar.html' = @('data/compendium-2.js')
  'mesihte-yasam.html' = @('data/compendium-3.js'); 'hristiyan-duasi.html' = @('data/compendium-4.js', 'data/extras.js')
  'ekler.html' = @('data/extras.js'); 'motu-proprio.html' = @('data/extras.js'); 'giris.html' = @('data/extras.js')
  'sss.html' = @('data/sss.js'); 'sozluk.html' = @('content/glossary-tr.txt'); 'katolik-sureci.html' = @('data/katolik-sureci.js'); 'gunah-cikarma.html' = @('data/gunah-cikarma.js')
  'topraklarimizda-hristiyanlik.html' = @('data/topraklarimizda-hristiyanlik.js', 'data/anadolu-haritasi.js')
  'neden-katoligiz.html' = @('data/neden-katoligiz.js'); 'azizler.html' = @('data/azizler.js', 'data/buyuk-azizler.js')
  'kutsal-ayin.html' = @('data/kutsal-ayin.js'); 'meseller.html' = @('data/meseller.js'); 'mucizeler.html' = @('data/mucizeler.js')
  'tesbih-duasi.html' = @('data/tespih.js'); 'tesbih-tarihi.html' = @('data/tesbih-tarihi.js'); 'kiliseler.html' = @('data/kiliseler.js')
  'islama-cevap.html' = @('data/islama-cevap.js'); 'ateizme-cevap.html' = @('data/ateizme-cevap.js'); 'yahudilere-cagri.html' = @('data/yahudilere-cagri.js', 'data/tablolar.json')
  'kutsal-kitap.html' = @('content/kutsal-kitap.md'); 'erisilebilirlik.html' = @('content/erisilebilirlik.md')
  'gizlilik.html' = @('content/gizlilik.md'); 'kaynaklar-ve-telif.html' = @('content/hakkinda.md', 'data/tablolar.json', 'data/aziz-portreleri.json')
  'index.html' = @('data/kilise-tarihi.json', 'data/tarih-gorseller.json', 'data/tablolar.json', 'data/azizler.js', 'data/buyuk-azizler.js')
  'kilise-tarihi.html' = @('data/kilise-tarihi.json', 'data/tarih-gorseller.json')
  'dogu-katolik-kiliseleri.html' = @('content/dogu-katolik-kiliseleri.md')
  'iletisim.html' = @('cloudflare/contact-worker.js')   # the form and the worker that sends it on
}
$script:GitDates = @{}
$script:HasGit = [bool](Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $Root '.git'))
function Page-LastMod([string]$file) {
  if (-not $script:HasGit) { return '' }
  $src = $PageSources[$file]
  if (-not $src) {
    if ($file -like 'kilise/*' -or $file -like 'kiliseler-*.html') { $src = @('data/kiliseler.js') }
    elseif ($file -match '^[a-z0-9-]+\.html$' -and $GreatSaintIds -and $GreatSaintIds.ContainsKey(($file -replace '\.html$', ''))) { $src = @('data/buyuk-azizler.js') }
    else { return '' }
  }
  $key = $src -join '|'
  if (-not $script:GitDates.ContainsKey($key)) {
    $d = ''
    try { $d = (& git -C $Root log -1 --format=%cs -- @src 2>$null | Select-Object -First 1) } catch {}
    $script:GitDates[$key] = if ($d) { "$d".Trim() } else { '' }
  }
  return $script:GitDates[$key]
}
$MonthNamesTr = @('Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık')
$BuildDateTr = "$((Get-Date).Day) $($MonthNamesTr[(Get-Date).Month - 1]) $((Get-Date).Year)"
$Utf8 = New-Object System.Text.UTF8Encoding $false
$script:PageInfo = @()
# Cache-busting query string for the shared CSS/JS: a short hash of the minified
# file's own content, so every page automatically requests a fresh copy the
# moment either one changes, instead of browsers reusing a stale cached
# assets/styles.min.css or script.min.js indefinitely across deploys (both
# files keep the same name release to release).
function File-Ver([byte[]]$bytes) {
  $hash = [Security.Cryptography.MD5]::Create().ComputeHash($bytes)
  return ([BitConverter]::ToString($hash) -replace '-', '').Substring(0, 10).ToLowerInvariant()
}
# Minifies CSS: strips /* */ comments, collapses whitespace runs, and removes
# the space around { } : ; , . Safe for this file specifically because it has
# no string values containing those characters with meaningful surrounding
# space (checked: quoted values here are single tokens like font names), and
# calc()/attribute-selector spacing never touches those five characters.
function Minify-Css([string]$css) {
  $css = [regex]::Replace($css, '/\*[\s\S]*?\*/', '')
  $css = [regex]::Replace($css, '\s+', ' ')
  $css = [regex]::Replace($css, '\s*([{};,])\s*', '$1')
  # A space before ':' can be a descendant combinator ('.a :is(...)'), so only the one after goes
  $css = [regex]::Replace($css, ':\s+', ':')
  $css = $css -replace ';}', '}'
  return $css.Trim()
}
# Minifies JS conservatively: strips /* */ comments (safe here, verified no
# string/regex literal in the file contains an unmatched */ that would close
# a comment early) and trims each line's leading/trailing whitespace and
# blank lines. Does not join lines or touch in-line spacing, so it cannot
# affect ASI or regex-literal parsing. script.js has no template literals,
# so no string ever depends on preserved newlines/indentation either.
function Minify-Js([string]$js) {
  $js = [regex]::Replace($js, '/\*[\s\S]*?\*/', '')
  # A line that starts with // is a whole-line comment (script.js has no multi-line strings)
  $lines = $js -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' -and -not $_.StartsWith('//') }
  return ($lines -join "`n")
}
# esbuild, where it is installed (the deploy installs it): a real minifier, a good deal smaller
# than the simple one above, which stays as the fallback
function Esbuild-Min([string]$code, [string]$ext) {
  $eb = Get-Command esbuild -ErrorAction SilentlyContinue
  if (-not $eb) { return $null }
  $tmp = Join-Path ([IO.Path]::GetTempPath()) ("kd-" + [guid]::NewGuid().ToString('N'))
  [IO.File]::WriteAllText("$tmp.$ext", $code, $Utf8)
  & $eb.Source "$tmp.$ext" --minify --charset=utf8 --log-level=error "--outfile=$tmp.min.$ext" | Out-Null
  $ok = $LASTEXITCODE -eq 0 -and (Test-Path "$tmp.min.$ext")
  $r = if ($ok) { [IO.File]::ReadAllText("$tmp.min.$ext").TrimEnd() } else { $null }
  Remove-Item "$tmp.$ext", "$tmp.min.$ext" -ErrorAction SilentlyContinue
  return $r
}
$CssSrc = [IO.File]::ReadAllText((Join-Path $Root 'assets/styles.css'))
$CssMin = Esbuild-Min $CssSrc 'css'
if (-not $CssMin) { $CssMin = Minify-Css $CssSrc }
[IO.File]::WriteAllText((Join-Path $Root 'assets/styles.min.css'), $CssMin, $Utf8)
$CssVer = File-Ver ([IO.File]::ReadAllBytes((Join-Path $Root 'assets/styles.min.css')))
# (script.min.js is written further down, once data/azizler-adlar.js exists: it carries a
# version hash for every data file.)
# Turkish suffix apostrophe (U+2019). Built from its code point on purpose: PowerShell
# treats a typographic quote as a string delimiter, so it must not appear in a literal,
# and &#8217; is no use in text that Attr() escapes. Interpolate it as $Apos instead.
$Apos = [char]0x2019
# The site is the brand now; the Compendium is one work published on it.
$SiteName = 'katolikdunyasi.com'
$SiteTag = 'Türkçe Katolik Portalı'
$WorkName = 'Katolik Kilisesi İnanç Esasları Özeti'
$SiteNameEn = 'Compendium of the Catechism of the Catholic Church'

# Pages whose English twin lives on verbumdomini.ca: the Katekizm and its parts. Their
# hreflang="en" points there (the old katolikdunyasi.com/en/ addresses redirect there too).
$VdUrl = 'https://verbumdomini.ca'
$VdTwin = @{
  'katekizm.html' = "$VdUrl/compendium.html"; 'giris.html' = "$VdUrl/introduction.html"; 'motu-proprio.html' = "$VdUrl/motu-proprio.html"
  'iman-ikrari.html' = "$VdUrl/profession-of-faith.html"; 'kutsal-sirlar.html' = "$VdUrl/celebration-of-christian-mystery.html"
  'mesihte-yasam.html' = "$VdUrl/life-in-christ.html"; 'hristiyan-duasi.html' = "$VdUrl/christian-prayer.html"; 'ekler.html' = "$VdUrl/appendix.html"
}

# ------------------------------------------------------------------ data
function Read-Data([string]$file) {
  $path = Join-Path (Join-Path $Root 'data') $file
  $t = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  $s = $t.IndexOf('/*JSON-START*/'); $e = $t.IndexOf('/*JSON-END*/')
  if ($s -lt 0 -or $e -lt 0) { throw "${file}: JSON-START / JSON-END markers not found." }
  try { return ($t.Substring($s + 14, $e - $s - 14) | ConvertFrom-Json) }
  catch { throw "${file}: JSON syntax error: $($_.Exception.Message)" }
}
$Parts = @(1..4 | ForEach-Object { Read-Data "compendium-$_.js" })
$X = Read-Data 'extras.js'
$FaqData = Read-Data 'sss.js'
$Rosary = Read-Data 'tespih.js'
$Sureci = Read-Data 'katolik-sureci.js'
$Confession = Read-Data 'gunah-cikarma.js'
$Anatolia = Read-Data 'topraklarimizda-hristiyanlik.js'
$WhyCatholic = Read-Data 'neden-katoligiz.js'
$Saints = Read-Data 'azizler.js'
# data/azizler-adlar.js: just each day's first saint name (Turkish, English) for the
# today's-saint pill on the home page and in the menu, instead of the full calendar.
$saintNames = [ordered]@{}
foreach ($day in $Saints.days) {
  $first = @($day.saints)[0]
  if ($first) { $saintNames["$($day.m)-$($day.d)"] = @($first.name, $first.nameEn) }
}
$saintNamesJson = ConvertTo-Json -InputObject $saintNames -Compress -Depth 4
[IO.File]::WriteAllText((Join-Path $Root 'data/azizler-adlar.js'),
  "/* Generated by tools/build.ps1 from data/azizler.js; do not edit. */`nwindow.SAINT_NAMES = $saintNamesJson;`n", $Utf8)
# data/azizler-ozet-<month>.js: the title and the opening of each day's first saint's life, for
# the home page's saint card; one small file a month, so the card never loads the whole calendar.
function Clip-Text([string]$t, [int]$max = 190) {
  if (-not $t -or $t.Length -le $max) { return $t }
  $cut = $t.Substring(0, $max); $sp = $cut.LastIndexOf(' ')
  if ($sp -gt 100) { $cut = $cut.Substring(0, $sp) }
  return $cut.TrimEnd(',', ';', ':', ' ') + '…'
}
foreach ($month in 1..12) {
  $sum = [ordered]@{}
  foreach ($day in @($Saints.days | Where-Object { $_.m -eq $month })) {
    $first = @($day.saints)[0]
    if ($first) { $sum["$($day.m)-$($day.d)"] = @($first.title, $first.titleEn, (Clip-Text $first.bio), (Clip-Text $first.bioEn)) }
  }
  $sumJson = ConvertTo-Json -InputObject $sum -Compress -Depth 4
  [IO.File]::WriteAllText((Join-Path $Root "data/azizler-ozet-$month.js"),
    "/* Generated by tools/build.ps1 from data/azizler.js; do not edit. */`nwindow.SAINT_SUMMARY_$month = $sumJson;`n", $Utf8)
}
# script.min.js, with a content hash for each data file so the data URLs change with their content
# (only the data files the browser loads; the rest are build input and are not published, see
# .github/workflows/deploy.yml)
$RuntimeData = @('compendium-1.js', 'compendium-2.js', 'compendium-3.js', 'compendium-4.js', 'tespih.js', 'azizler-adlar.js', 'refs-bible.js', 'refs-quran.js', 'refs-hadith.js') + (1..12 | ForEach-Object { "azizler-ozet-$_.js" })
$dataVer = [ordered]@{}
Get-ChildItem (Join-Path $Root 'data') -Filter '*.js' | Where-Object { $RuntimeData -contains $_.Name } | Sort-Object Name | ForEach-Object {
  $dataVer["data/$($_.Name)"] = File-Ver ([IO.File]::ReadAllBytes($_.FullName))
}
# the 3D rosary module too: its URL changes with its content, so it can be cached for a year
$dataVer['assets/vendor/rosary3d.js'] = File-Ver ([IO.File]::ReadAllBytes((Join-Path $Root 'assets/vendor/rosary3d.js')))
$JsSrc = [IO.File]::ReadAllText((Join-Path $Root 'assets/script.js'))
$JsFull = $JsSrc.Replace('{"__DATA_VER__": 1}', (ConvertTo-Json -InputObject $dataVer -Compress))
$JsMin = Esbuild-Min $JsFull 'js'
if (-not $JsMin) { $JsMin = Minify-Js $JsFull }
[IO.File]::WriteAllText((Join-Path $Root 'assets/script.min.js'), $JsMin, $Utf8)
$JsVer = File-Ver ([IO.File]::ReadAllBytes((Join-Path $Root 'assets/script.min.js')))
$GreatSaints = Read-Data 'buyuk-azizler.js'
$GreatSaintIds = @{}; foreach ($s in $GreatSaints.saints) { $GreatSaintIds[$s.id] = $true }
$Mass = Read-Data 'kutsal-ayin.js'

# Page file, ordinal label and meta description per part (descriptions are for search engines only)
$PartMeta = @{
  1 = @{ file = 'iman-ikrari.html';               ord = 'Birinci Kısım';  roman = 'I';
         desc = "Katolik Kilisesi Katekizmi Özeti, Birinci Kısım: İnanç Beyanı. Vahiy, Kutsal Üçlü, Mesih İsa, Kilise ve ebedi hayat üzerine 1–217. sorular."
          }
  2 = @{ file = 'kutsal-sirlar.html';  ord = 'İkinci Kısım';   roman = 'II';
         desc = "Katolik Kilisesi Katekizmi Özeti, İkinci Kısım: Hristiyan Gizeminin Kutlanması. Litürji ve yedi Kutsal Sır üzerine 218–356. sorular."
          }
  3 = @{ file = 'mesihte-yasam.html';                    ord = 'Üçüncü Kısım';   roman = 'III';
         desc = "Katolik Kilisesi Katekizmi Özeti, Üçüncü Kısım: Mesih$($Apos)te Yaşam. İnsan onuru, vicdan, erdemler, günah, lütuf ve On Emir üzerine 357–533. sorular."
          }
  4 = @{ file = 'hristiyan-duasi.html';                  ord = 'Dördüncü Kısım'; roman = 'IV';
         desc = "Katolik Kilisesi Katekizmi Özeti, Dördüncü Kısım: Hristiyan Duası. Dua ve Rab$($Apos)bin Duası (Göklerdeki Pederimiz) üzerine 534–598. sorular."
          }
}

# ------------------------------------------------------------------ helpers
$GlossRx = '\[\[([^|\]]+)\|([^\]]+)\]\]'
function Inline([string]$s) { if (-not $s) { return '' }; return [regex]::Replace($s, $GlossRx, '$1<span class="gloss" lang="en"> ($2)</span>') }
function Plain([string]$s)  { if (-not $s) { return '' }; $s = [regex]::Replace($s, $GlossRx, '$1 ($2)'); return (($s -replace '<[^>]+>', '') -replace '\s+', ' ').Trim() }
# script-src lists the SHA-256 of each inline script on the page instead of 'unsafe-inline', so markup
# that got into a page some other way cannot run (JSON and JSON-LD blocks don't run and need none)
# The browser reads CR LF in a page as LF before it hashes a script, so the hash is taken the same way.
$Sha256 = [Security.Cryptography.SHA256]::Create()
function Pin-InlineScripts([string]$h) {
  $pins = [regex]::Matches($h, '<script(?![^>]*\b(?:src|type)=)[^>]*>([\s\S]*?)</script>') | ForEach-Object {
    "'sha256-" + [Convert]::ToBase64String($Sha256.ComputeHash([Text.Encoding]::UTF8.GetBytes($_.Groups[1].Value.Replace("`r`n", "`n").Replace("`r", "`n")))) + "'"
  } | Select-Object -Unique
  return $h.Replace("script-src 'self' 'unsafe-inline'", "script-src 'self' $($pins -join ' ')")
}
function Attr([string]$s)   { return ($s -replace '&', '&amp;' -replace '"', '&quot;' -replace '<', '&lt;' -replace '>', '&gt;') }
# An attribute, its value escaped: TA 'aria-label' 'Kapat'
function TA([string]$name, [string]$value) { return "$name=`"$(Attr $value)`"" }
# Shortens text for a <meta name="description"> so search engines don't cut it
# off mid-sentence; trims at the last full word within the limit. Only for the
# meta tag, never for text shown on the page.
function Meta-Trim([string]$s, [int]$max = 160) {
  if ($s.Length -le $max) { return $s }
  $cut = $s.Substring(0, $max)
  $lastSpace = $cut.LastIndexOf(' ')
  if ($lastSpace -gt 0) { $cut = $cut.Substring(0, $lastSpace) }
  return $cut.TrimEnd('.', ',', ';', ':') + '…'
}
function Blocks([string]$s) {
  $sb = New-Object Text.StringBuilder; $list = New-Object Collections.ArrayList
  foreach ($line in ($s -split "`n")) {
    $l = $line.Trim(); if (-not $l) { continue }
    if ($l.StartsWith('- ')) { [void]$list.Add($l.Substring(2)); continue }
    if ($list.Count) { [void]$sb.Append('<ul>' + (($list | ForEach-Object { '<li>' + (Inline $_) + '</li>' }) -join '') + '</ul>'); $list.Clear() }
    if ($l.StartsWith('### ')) { [void]$sb.Append('<h3 class="blk-sub">' + (Inline $l.Substring(4)) + '</h3>'); continue }
    [void]$sb.Append('<p>' + (Inline $l) + '</p>')
  }
  if ($list.Count) { [void]$sb.Append('<ul>' + (($list | ForEach-Object { '<li>' + (Inline $_) + '</li>' }) -join '') + '</ul>') }
  return $sb.ToString()
}
function Verse([string]$s) { return ((($s -split "`n`n+") | ForEach-Object { '<p>' + ((Inline $_) -replace "`n", '<br>') + '</p>' }) -join '') }
function HTag([int]$lvl) { return 'h' + [Math]::Min(6, [Math]::Max(2, $lvl)) }
# JSON string for JSON-LD ('<' escaped so the script block can never be closed early)
function JStr([string]$s) {
  if ($null -eq $s) { return 'null' }
  $s = $s -replace '\\', '\\' -replace '"', '\"' -replace "`r", '' -replace "`n", '\n' -replace "`t", ' ' -replace '<', ('\' + 'u003c')
  return '"' + $s + '"'
}
function Range-Text($r) { if ($null -eq $r -or $null -eq $r[0]) { return '' }; if ($r[0] -eq $r[1]) { return "$($r[0])" }; return "$($r[0])–$($r[1])" }
# For each heading id: @(first question, last question) until the next heading of the same or higher level
function Get-Ranges($items) {
  $list = @($items); $res = @{}
  for ($i = 0; $i -lt $list.Count; $i++) {
    $it = $list[$i]; if ($it.type -ne 'heading') { continue }
    $first = $null; $last = $null
    for ($j = $i + 1; $j -lt $list.Count; $j++) {
      $x = $list[$j]
      if ($x.type -eq 'heading' -and $x.level -le $it.level) { break }
      if ($x.type -eq 'qa') { if ($null -eq $first) { $first = $x.n }; $last = $x.n }
    }
    $res[$it.id] = @($first, $last)
  }
  return $res
}
# "Birinci Bölüm: X" -> @('Birinci Bölüm', 'X');  "Section One: X" -> @('Section One', 'X')
function Split-Heading([string]$s) {
  $m = [regex]::Match($s, '^((?:Birinci|İkinci|Üçüncü|Dördüncü) (?:Kısım|Bölüm|Başlık)|(?:Part|Section|Chapter) (?:One|Two|Three|Four)):\s*(.+)$')
  if ($m.Success) { return @($m.Groups[1].Value, $m.Groups[2].Value) }
  return @('', $s)
}
function Split-Attr([string]$s) { $m = [regex]::Match($s, '^([\s\S]*?)\s*\(([^()]*)\)\s*$'); if ($m.Success) { return @($m.Groups[1].Value, $m.Groups[2].Value) }; return @($s, '') }

# ---------------- minimal Markdown (content/hakkinda.md feeds the footer's sources dialog)
# Defined here rather than further down because the footer renders the dialog on every page.
function Md-Inline([string]$s) {
  $s = $s -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;'
  $s = [regex]::Replace($s, '`([^`]+)`', '<code>$1</code>')
  $s = [regex]::Replace($s, '\[([^\]]+)\]\(([^)\s]+)\)', [Text.RegularExpressions.MatchEvaluator]{
    param($m) $u = $m.Groups[2].Value
    $rel = if ($u -match '^https?://') { ' target="_blank" rel="noopener"' } else { '' }
    "<a href=`"$u`"$rel>$($m.Groups[1].Value)</a>" })
  $s = [regex]::Replace($s, '\*\*(.+?)\*\*', '<strong>$1</strong>')
  $s = [regex]::Replace($s, '(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', '<em>$1</em>')
  $s = [regex]::Replace($s, '(?<![\w])_(?!\s)(.+?)(?<!\s)_(?![\w])', '<em>$1</em>')
  return $s
}
function Convert-Markdown([string]$md) {
  $lines = ($md -replace "`r", '') -split "`n"
  $sb = New-Object Text.StringBuilder
  $para = New-Object Collections.ArrayList; $items = New-Object Collections.ArrayList; $quote = New-Object Collections.ArrayList
  $listTag = 'ul'
  $flush = {
    if ($para.Count)  { [void]$sb.Append('<p>' + (Md-Inline ($para -join ' ')) + '</p>'); $para.Clear() }
    if ($items.Count) { [void]$sb.Append("<$listTag>" + (($items | ForEach-Object { '<li>' + (Md-Inline $_) + '</li>' }) -join '') + "</$listTag>"); $items.Clear() }
    if ($quote.Count) { [void]$sb.Append('<blockquote><p>' + (Md-Inline ($quote -join ' ')) + '</p></blockquote>'); $quote.Clear() }
  }
  foreach ($raw in $lines) {
    $l = $raw.TrimEnd()
    if ($l -match '^\s*$') { . $flush; continue }
    # "## Heading {#some-id}" gives the heading an id (for in-page links such as the mobile tab bar)
    if ($l -match '^(#{1,4})\s+(.+?)(?:\s+\{#([a-z0-9-]+)\})?$') { . $flush; $lvl = [Math]::Max(2, $Matches[1].Length); $hid = if ($Matches[3]) { " id=`"$($Matches[3])`"" } else { '' }; [void]$sb.Append("<h$lvl$hid>" + (Md-Inline $Matches[2]) + "</h$lvl>"); continue }
    if ($l -match '^\s*(-{3,}|\*{3,}|_{3,})\s*$') { . $flush; [void]$sb.Append('<hr>'); continue }
    if ($l -match '^>\s?(.*)$') { $q = $Matches[1]; if ($para.Count -or $items.Count) { . $flush }; [void]$quote.Add($q); continue }
    if ($l -match '^\s{0,3}[-*+]\s+(.+)$') { $v = $Matches[1]; if ($para.Count -or $quote.Count -or ($items.Count -and $listTag -ne 'ul')) { . $flush }; $listTag = 'ul'; [void]$items.Add($v); continue }
    if ($l -match '^\s{0,3}\d+[.)]\s+(.+)$') { $v = $Matches[1]; if ($para.Count -or $quote.Count -or ($items.Count -and $listTag -ne 'ol')) { . $flush }; $listTag = 'ol'; [void]$items.Add($v); continue }
    if ($items.Count -and $raw -match '^\s{2,}\S') { $items[$items.Count - 1] = $items[$items.Count - 1] + ' ' + $l.Trim(); continue }
    if ($quote.Count) { [void]$quote.Add($l.Trim()); continue }
    if ($items.Count) { . $flush }
    [void]$para.Add($l.Trim())
  }
  . $flush
  return $sb.ToString()
}
# ------------------------------------------------------------------ icons (inline SVG, no image files)
# Sprite emitted once per page; repeated icons reference it with <use>
$Sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">' +
  '<symbol id="i-chev" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></symbol>' +
  '<symbol id="i-globe" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></g></symbol>' +
  '</svg>'
$IcoChev   = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-chev"/></svg>'
$IcoChevLg = '<svg class="chev" aria-hidden="true" focusable="false"><use href="#i-chev"/></svg>'
$IcoGlobe  = '<svg aria-hidden="true" focusable="false"><use href="#i-globe"/></svg>'
$IcoSearch = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>'
$IcoSun    = '<svg class="ico-sun" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>'
$IcoMoon   = '<svg class="ico-moon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z"/></svg>'
$IcoList   = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>'
# Three independent lines (not one path) so open/close can animate each into an X via CSS,
# driven purely by the button's own aria-expanded state -- no JS beyond the existing toggle.
$IcoMenuToggle = '<svg class="menu-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><line class="mi-l1" x1="4" y1="6" x2="20" y2="6"/><line class="mi-l2" x1="4" y1="12" x2="20" y2="12"/><line class="mi-l3" x1="4" y1="18" x2="20" y2="18"/></svg>'
$IcoTextSize = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/><path d="M10.5 7.8v5.4M7.8 10.5h5.4"/></svg>'
$IcoPrev   = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>'
$IcoNext   = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>'
$IcoClose  = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
# Page-head icons: replace the small-caps section label on a few pages where the label was
# purely decorative (repeating the nav category, or just the page's own title back at itself).
$IcoDoor     = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21V4.5A1.5 1.5 0 0 1 8.5 3h5L18 6.5V21"/><path d="M4 21h16"/><circle cx="14.3" cy="12.5" r=".6" fill="currentColor" stroke="none"/></svg>'
$IcoKey      = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.2" cy="7.2" r="3.7"/><path d="M9.8 9.8 18.5 18.5"/><path d="M15 15l2.2-2.2"/><path d="M17.8 17.8l2.2-2.2"/></svg>'
# Kilise'nin tarihi: an hourglass
$IcoHourglass = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 3h11M6.5 21h11"/><path d="M7.5 3c0 4.6 4.5 6 4.5 9s-4.5 4.4-4.5 9"/><path d="M16.5 3c0 4.6-4.5 6-4.5 9s4.5 4.4 4.5 9"/><path d="M9.6 18.6h4.8"/></svg>'
$IcoRoots    = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="3.1"/><path d="M12 9.1V14"/><path d="M12 14 8 20M12 14v6M12 14l4 6"/></svg>'
$IcoCompass  = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.3 8.7 13.2 13.2 8.7 15.3 10.8 10.8Z"/></svg>'
$IcoChalice  = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10"/><path d="M7.5 4c0 4.5 1.3 8 4.5 8s4.5-3.5 4.5-8"/><path d="M12 12v5.5"/><path d="M8 21h8"/><path d="M12 17.5v3.5"/></svg>'
$IcoBookOpen = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5c-1.6-1.3-3.6-2-6-2-.6 0-1 .4-1 1v11.5c0 .6.4 1 1 1 2.4 0 4.4.7 6 2 1.6-1.3 3.6-2 6-2 .6 0 1-.4 1-1V5.5c0-.6-.4-1-1-1-2.4 0-4.4.7-6 2Z"/><path d="M12 6.5v13"/></svg>'
$IcoBible    = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3H19v16.5a1 1 0 0 1-1 1H7.5A1.5 1.5 0 0 1 6 19Z"/><path d="M6 19a1.5 1.5 0 0 1 1.5-1.5H19"/><path d="M9.5 3v5.2l2-1.4 2 1.4V3"/></svg>'
$IcoQuestion = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.3 9.4a2.7 2.7 0 1 1 4 2.4c-.9.5-1.3 1.1-1.3 2.1v.4"/><circle cx="12" cy="17.6" r=".7" fill="currentColor" stroke="none"/></svg>'
$IcoSparkle  = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none"><path d="M12 2c.9 4.6 3.1 6.8 7.7 7.7-4.6.9-6.8 3.1-7.7 7.7-.9-4.6-3.1-6.8-7.7-7.7C8.9 8.8 11.1 6.6 12 2Z"/></svg>'
$IcoChevDown = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5 12 15l6-5.5"/></svg>'
function Page-Ico([string]$svg) { return "<span class=`"page-ico`">$svg</span>" }

# The paintings (data/tablolar.json): which page's header shows which painting, and each
# painting's title, painter, home and source. The images are in assets/art (up to 1600 wide, with 1200 and 800 wide copies).
$Tablolar = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'data/tablolar.json') | ConvertFrom-Json
# The home page's strip of Church history and the credits of its pictures
$Tarih = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'data/kilise-tarihi.json') | ConvertFrom-Json
$tgFile = Join-Path $Root 'data/tarih-gorseller.json'
$TarihImg = if (Test-Path $tgFile) { Get-Content -Raw -Encoding UTF8 $tgFile | ConvertFrom-Json } else { [pscustomobject]@{} }
function Art-Img([string]$key, [string]$cls, [string]$sizes = '100vw', [string]$prio = 'auto') {
  $a = $Tablolar.art.$key
  $fp = if ($prio -eq 'high') { ' fetchpriority="high"' } else { ' loading="lazy"' }
  # one file for a painting 800 wide or less; else an 800 copy, a 1200 copy when the original
  # is wider than that (phones take it), and the original. Each in AVIF and WebP too, made next to
  # the JPEG by the deploy (a browser that reads neither takes the JPEG).
  $w = [int]$a.w
  $setOf = {
    param($ext)
    if ($w -le 800) { return "/assets/art/$key.$ext" }
    $mid = if ($w -gt 1200) { ", /assets/art/$key-1200.$ext 1200w" } else { '' }
    return "/assets/art/$key-800.$ext 800w$mid, /assets/art/$key.$ext $($w)w"
  }
  $sz = if ($w -le 800) { '' } else { " sizes=`"$sizes`"" }
  $set = if ($w -le 800) { '' } else { " srcset=`"$(& $setOf 'jpg')`"$sz" }
  return "<picture><source type=`"image/avif`" srcset=`"$(& $setOf 'avif')`"$sz><source type=`"image/webp`" srcset=`"$(& $setOf 'webp')`"$sz>" +
    "<img class=`"$cls`" src=`"assets/art/$key.jpg`"$set width=`"$($a.w)`" height=`"$($a.h)`" alt=`"`" decoding=`"async`" style=`"object-position:50% $($a.y)%`"$fp></picture>"
}
# a picture inside a story (data file "art": a key of data/tablolar.json), with its credit under it
# A painting's painter
function Art-A($a) { $a.a }
# A painting in the run of the text: a small square the text wraps round; a click opens it whole,
# with its painter, where it is and what it shows (script.js, initArtView)
function Art-Sq([string]$key) {
  $a = $Tablolar.art.$key
  # a photo under a Creative Commons licence carries the licence in its credit
  $lic = if ($a.loc -match '^CC') { " · $($a.loc)" } else { '' }
  $data = "$(TA 'data-t' $a.t) $(TA 'data-a' $a.a) $(TA 'data-loc' $a.loc) $(TA 'data-d' $a.d)"
  return "<figure class=`"art-sq`" $data><button type=`"button`" class=`"art-sq-btn`" aria-haspopup=`"dialog`" $(TA 'aria-label' "Büyüt: $($a.t)")>" +
    "$(Art-Img $key 'art-sq-img' '(min-width: 600px) 13rem, 9rem')</button><figcaption>$(Art-A $a)$lic</figcaption></figure>"
}
function Mira-Fig([string]$key) {
  if (-not $key) { return '' }
  return Art-Sq $key
}
function Art-Cap([string]$key) {
  $a = $Tablolar.art.$key
  return "<p class=`"ph-cap`">$($a.a) · <cite>$($a.t)</cite></p>"
}
# A page whose header has a painting: the painting behind the title, its name underneath. A
# painting smaller than the screen is shown whole, in a frame, over a blurred copy of itself.
# A section that has a painting (data/tablolar.json "sections"): the painting, with its name, in
# place of the section's line drawing
function Paint-Sections([string]$body, [string]$file) {
  $map = $Tablolar.sections.$file
  if (-not $map) { return $body }
  foreach ($p in $map.PSObject.Properties) {
    $key = $p.Value
    $fig = Art-Sq $key
    # the painting goes at the start of the section's first paragraph, so its top is level with
    # that paragraph's first line and the headings above it keep the full width (not a paragraph
    # inside a fold, a box, a list of steps or a quote: then it stays under the heading)
    $rx = '(<(?:section|article)\b[^>]*\bid="' + [regex]::Escape($p.Name) + '"[^>]*>)<div class="ill-art" aria-hidden="true"><svg[\s\S]*?</svg></div>(<div class="ill-body">(?:<p class="ill-kick">[\s\S]*?</p>)?<h2[\s\S]*?</h2>)'
    $m = [regex]::Match($body, $rx)
    if (-not $m.Success) { continue }
    $head = $m.Groups[1].Value + $m.Groups[2].Value
    $rest = $body.Substring($m.Index + $m.Length)
    $para = [regex]::Match($rest, '<p(?=[\s>])(?![^>]*class="(?:ill-kick|faq-cat-en|label)")')
    $at = if ($para.Success -and $rest.Substring(0, $para.Index) -notmatch '</section>|<blockquote|<details|kk-quick|stage-list') { $para.Index } else { 0 }
    $body = $body.Substring(0, $m.Index) + $head + $rest.Substring(0, $at) + $fig + $rest.Substring($at)
  }
  return $body
}
function Paint-Head([string]$body, [string]$file) {
  $key = $Tablolar.pages.$file
  if (-not $key) { return $body }
  $m = [regex]::Match($body, '<header class="page-head([^"]*)"([^>]*)>')
  if (-not $m.Success) {
    # a page with a hero section instead of a page header (the Katekizm's own page): the banner opens it
    $h = [regex]::Match($body, '<section class="hero work-hero">')
    if (-not $h.Success) { return $body }
    $at = $h.Index + $h.Length
    return $body.Substring(0, $at) + "<header class=`"page-head painted banner-only`" data-art=`"$key`">$(Art-Img $key 'ph-art' '100vw' 'high')$(Art-Cap $key)</header>" + $body.Substring($at)
  }
  # the painting runs the full width of the page as a banner (header paintings are all landscape),
  # its name on it at the lower right, the page's title under it
  $cls = "page-head$($m.Groups[1].Value) painted"
  $imgs = Art-Img $key 'ph-art' '100vw' 'high'
  # a few banners are a window onto the whole painting, which moves inside it as the page
  # scrolls, so more of it comes into view before it leaves (script.js, initBannerPan)
  if (@('tesbih-duasi.html') -contains $file) { $cls += ' ph-pan'; $imgs = "<div class=`"ph-win`">$imgs</div>" }
  $open = "<header class=`"$cls`" data-art=`"$key`"$($m.Groups[2].Value)>$imgs"
  $end = $body.IndexOf('</header>', $m.Index)
  $inner = $body.Substring($m.Index + $m.Length, $end - $m.Index - $m.Length)
  # a row of section jumps (class ph-jump) sits on the painting below the title's panel, not in it
  $jump = [regex]::Match($inner, '<nav class="ph-jump"[\s\S]*?</nav>')
  $after = ''
  if ($jump.Success) { $after = $jump.Value; $inner = $inner.Remove($jump.Index, $jump.Length) }
  return $body.Substring(0, $m.Index) + $open + "<div class=`"ph-text`">$inner</div>$after" + (Art-Cap $key) + $body.Substring($end)
}

# ---- Illustrated sections: a page section with a line drawing of its own beside it (in the section's
# colour, "tone"), a small kicker over a large heading. The drawing draws itself as the section scrolls
# into view (initDrawings in script.js); without JavaScript or with reduced motion it is simply shown.
# Every drawing is plain strokes on a 120 x 120 grid, one path per stroke so they draw one after another.
$Ill = @{
  'ship'      = '<path d="M18 80h84l-9 13H27z"/><path d="M60 80V22"/><path d="M62 26l28 46H62z"/><path d="M58 30L36 70h22"/><path d="M60 22l11 4-11 4"/><path d="M8 104q8-6 16 0t16 0 16 0 16 0 16 0 16 0 16 0"/>'
  'lampstand' = '<path d="M60 40v56"/><path d="M48 40v4a12 12 0 0 0 24 0v-4"/><path d="M36 40v4a24 24 0 0 0 48 0v-4"/><path d="M24 40v4a36 36 0 0 0 72 0v-4"/><path d="M44 104q16-12 32 0z"/><path d="M24 36c-3-4-3-8 0-12 3 4 3 8 0 12z"/><path d="M36 36c-3-4-3-8 0-12 3 4 3 8 0 12z"/><path d="M48 36c-3-4-3-8 0-12 3 4 3 8 0 12z"/><path d="M60 36c-3-4-3-8 0-12 3 4 3 8 0 12z"/><path d="M72 36c-3-4-3-8 0-12 3 4 3 8 0 12z"/><path d="M84 36c-3-4-3-8 0-12 3 4 3 8 0 12z"/><path d="M96 36c-3-4-3-8 0-12 3 4 3 8 0 12z"/>'
  'church'    = '<path d="M14 98h92"/><path d="M24 98V60h72v38"/><path d="M36 60a24 24 0 0 1 48 0"/><path d="M60 36V20M53 26h14"/><path d="M54 98V84a6 6 0 0 1 12 0v14"/><path d="M33 80v-8a4 4 0 0 1 8 0v8M79 80v-8a4 4 0 0 1 8 0v8"/><path d="M18 60l42-6 42 6"/>'
  'book'      = '<path d="M14 88q23-10 46 0 23-10 46 0V46q-23-10-46 0-23-10-46 0z"/><path d="M60 46v42"/><path d="M24 56q14-5 28 0M24 66q14-5 28 0M24 76q14-5 28 0"/><path d="M68 56q14-5 28 0M68 66q14-5 28 0"/><path d="M86 18q18-8 22-4-2 10-20 24l-10 4z"/><path d="M78 42l-8 14"/>'
  'keys'      = '<path d="M22 30a10 10 0 1 0 20 0a10 10 0 1 0-20 0"/><path d="M39 37l55 55"/><path d="M86 84l8-8M77 75l6-6"/><path d="M78 30a10 10 0 1 0 20 0a10 10 0 1 0-20 0"/><path d="M81 37L26 92"/><path d="M34 84l-8-8M43 75l-6-6"/>'
  'tablets'   = '<path d="M18 102V42a19 19 0 0 1 38 0v60z"/><path d="M64 102V42a19 19 0 0 1 38 0v60z"/><path d="M28 50h18M28 60h18M28 70h18"/><path d="M28 80h18M28 90h18"/><path d="M74 50h18M74 60h18M74 70h18"/><path d="M74 80h18M74 90h18"/>'
  'cosmos'    = '<path d="M60 18c3 24 9 30 32 33-23 3-29 9-32 33-3-24-9-30-32-33 23-3 29-9 32-33z"/><path d="M96 78c1 8 3 10 10 11-7 1-9 3-10 11-1-8-3-10-10-11 7-1 9-3 10-11z"/><path d="M22 82c1 6 2 7 8 8-6 1-7 2-8 8-1-6-2-7-8-8 6-1 7-2 8-8z"/><path d="M24 22v8M20 26h8"/><path d="M98 18v6M95 21h6"/><path d="M60 100v6M57 103h6"/>'
  'tomb'      = '<path d="M4 104h112"/><path d="M10 104q12-40 50-42t50 42"/><path d="M44 104V88a16 16 0 0 1 32 0v16"/><path d="M80 94a10 10 0 1 0 20 0a10 10 0 1 0-20 0"/><path d="M51 32a9 9 0 1 0 18 0a9 9 0 1 0-18 0"/><path d="M60 14v-6M44 20l-4-4M76 20l4-4M38 34h-6M82 34h6"/>'
  'basilica'  = '<path d="M14 104h92"/><path d="M22 100V72h76v28"/><path d="M32 78v22M44 78v22M56 78v22M64 78v22M76 78v22M88 78v22"/><path d="M34 72v-8h52v8"/><path d="M38 64a22 22 0 0 1 44 0"/><path d="M56 42v-6h8v6"/><path d="M60 36V24M55 29h10"/>'
  'door'      = '<path d="M24 104h72"/><path d="M38 104V30h44v74"/><path d="M82 30l16 8v72l-16-6"/><path d="M92 70v4"/><path d="M60 46v12M48 52l-5-5M72 52l5-5M44 66h-7M76 66h7"/><path d="M46 104l-14 12M74 104l14 12"/>'
  'mary'      = '<path d="M46 26a14 14 0 1 0 28 0a14 14 0 1 0-28 0"/><path d="M60 16c-11 0-15 11-15 21 0 15-9 36-15 66h60c-6-30-15-51-15-66 0-10-4-21-15-21z"/><path d="M54 36a6 7 0 1 0 12 0a6 7 0 1 0-12 0"/><path d="M55 70l5-9 5 9"/><path d="M24 30v6M21 33h6"/><path d="M96 30v6M93 33h6"/><path d="M18 62v4M16 64h4M102 62v4M100 64h4"/>'
  'reliquary' = '<path d="M28 104h64"/><path d="M36 104V62h48v42"/><path d="M32 62l28-20 28 20"/><path d="M60 42V22M53 29h14"/><path d="M50 72h20v22H50z"/><path d="M60 78v10M56 83h8"/>'
  'chalice'   = '<path d="M38 52h44c0 20-9 32-22 32S38 72 38 52z"/><path d="M60 84v12"/><path d="M42 104q18-14 36 0z"/><path d="M48 30a12 12 0 1 0 24 0a12 12 0 1 0-24 0"/><path d="M60 23v14M53 30h14"/><path d="M60 10V6M42 16l-3-3M78 16l3-3M34 30h-4M86 30h4"/>'
  'lily'      = '<path d="M60 106V58"/><path d="M60 96c-8-1-14-6-17-14 8 0 14 5 17 14z"/><path d="M60 58c-8-6-10-24-2-40 2 14 6 26 2 40z"/><path d="M60 58c-14 2-30-8-36-24 14 0 28 8 36 24z"/><path d="M60 58c14 2 30-8 36-24-14 0-28 8-36 24z"/><path d="M57 46l-5-12M63 46l5-12M60 46V32"/><path d="M51 33h2M67 33h2M59 31h2"/>'
  'wheat'     = '<path d="M60 108V22"/><path d="M60 40c-7 -2 -10 -8 -10 -14 7 2 10 8 10 14z"/><path d="M60 40c7 -2 10 -8 10 -14 -7 2 -10 8 -10 14z"/><path d="M60 54c-7 -2 -10 -8 -10 -14 7 2 10 8 10 14z"/><path d="M60 54c7 -2 10 -8 10 -14 -7 2 -10 8 -10 14z"/><path d="M60 68c-7 -2 -10 -8 -10 -14 7 2 10 8 10 14z"/><path d="M60 68c7 -2 10 -8 10 -14 -7 2 -10 8 -10 14z"/><path d="M60 30c-4-4-4-10 0-14 4 4 4 10 0 14z"/><path d="M60 108q-6-30-28-52"/><path d="M60 108q6-30 28-52"/><path d="M32 56c-1-8 2-14 8-16 1 7-2 13-8 16z M88 56c1-8-2-14-8-16-1 7 2 13 8 16z"/>'
  'sheep'     = '<path d="M34 58a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0a8 8 0 0 1 0 16a6 6 0 0 1 -12 0a6 6 0 0 1 -12 0a6 6 0 0 1 -12 0a6 6 0 0 1 -12 0a8 8 0 0 1 0 -16z"/><path d="M84 60c3-7 15-8 18 0 2 8-4 13-12 11"/><path d="M88 58l-5-7"/><path d="M97 63v1"/><path d="M42 74v16M52 74v16M66 74v16M76 74v16"/><path d="M16 92h88"/>'
  'knock'     = '<path d="M30 104h60"/><path d="M38 104V40a22 22 0 0 1 44 0v64"/><path d="M60 22v82"/><path d="M68 64a5 5 0 1 0 10 0a5 5 0 1 0-10 0"/><path d="M92 54q6 6 0 12M98 48q10 12 0 24"/>'
  'oillamp'   = '<path d="M18 76q40-26 80-6q-38 18-80 6z"/><path d="M18 76c-10-2-10-14 0-14"/><path d="M50 62c0-6 14-6 14 0"/><path d="M98 64c-6-6-6-14 0-22 6 8 6 16 0 22z"/><path d="M48 84h28l-4 10H52z"/><path d="M98 34v-6M86 40l-4-4M110 40l4-4"/>'
  'grapes'    = '<path d="M60 14v14"/><path d="M60 22c10-8 24-6 30 2-10 6-22 6-30-2z"/><path d="M39 40a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M53 40a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M67 40a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M46 53a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M60 53a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M39 66a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M53 66a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M67 66a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M46 79a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M60 79a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="M53 92a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/>'
  'feast'     = '<path d="M10 82h100"/><path d="M20 82v22M100 82v22"/><path d="M28 60h14l-2 14h-10z"/><path d="M35 74v8M30 82h10"/><path d="M52 82c0-12 9-18 20-18s20 6 20 18"/><path d="M62 70l4 4M72 68l4 4M82 70l4 4"/><path d="M40 40v-6M60 30v-8M80 40v6"/>'
  'bell'      = '<path d="M60 18v10"/><path d="M38 78c0-26 7-48 22-48s22 22 22 48z"/><path d="M32 78h56"/><path d="M55 84a5 5 0 0 0 10 0"/><path d="M22 44q-7 12 0 24M98 44q7 12 0 24"/>'
  'lectern'   = '<path d="M24 58q18-9 36 0 18-9 36 0V34q-18-9-36 0-18-9-36 0z"/><path d="M60 34v24"/><path d="M32 42q10-4 20 0M32 50q10-4 20 0M68 42q10-4 20 0M68 50q10-4 20 0"/><path d="M60 60v36"/><path d="M48 96h24M42 104h36"/>'
  'gifts'     = '<path d="M10 92h100"/><path d="M16 92c0-16 12-26 28-26s28 10 28 26"/><path d="M30 76l6 6M42 72l6 6M54 76l6 6"/><path d="M84 38h12M86 38v8c-8 4-10 14-8 26 1 14 6 20 12 20s11-6 12-20c2-12 0-22-8-26v-8"/><path d="M82 64h28"/>'
  'monstrance'= '<path d="M48 40a12 12 0 1 0 24 0a12 12 0 1 0-24 0"/><path d="M60 16v-6M60 64v6M36 40h-6M84 40h6M43 23l-4-4M77 23l4-4M43 57l-4 4M77 57l4 4"/><path d="M60 70v24"/><path d="M53 80h14"/><path d="M42 104q18-14 36 0z"/>'
  'cross'     = '<path d="M60 16v88"/><path d="M38 42h44"/><path d="M24 30l8 6M96 30l-8 6"/><path d="M18 62h10M102 62H92"/><path d="M26 92l8-5M94 92l-8-5"/>'
  'shell'     = '<path d="M18 72a42 42 0 0 1 84 0"/><path d="M18 72l42 20 42-20"/><path d="M60 92L26 50M60 92L38 36M60 92L52 29M60 92L68 29M60 92L82 36M60 92L94 50"/><path d="M60 98c-3 4-3 7 0 8 3-1 3-4 0-8z"/><path d="M48 104c-2 3-2 5 0 6 2-1 2-3 0-6zM72 104c-2 3-2 5 0 6 2-1 2-3 0-6z"/>'
  'trinity'   = '<path d="M38 46a22 22 0 1 0 44 0a22 22 0 1 0-44 0"/><path d="M21 76a22 22 0 1 0 44 0a22 22 0 1 0-44 0"/><path d="M55 76a22 22 0 1 0 44 0a22 22 0 1 0-44 0"/><path d="M60 58l-7 12h14z"/>'
  'shield'    = '<path d="M60 14l38 14v26c0 26-16 44-38 52-22-8-38-26-38-52V28z"/><path d="M60 34v52M42 52h36"/><path d="M60 22v-8"/>'
  'scroll'    = '<path d="M30 30h56a8 8 0 0 1 8 8v52"/><path d="M30 30a8 8 0 0 0 0 16h8V30"/><path d="M38 46v52a8 8 0 0 0 8 8h52a8 8 0 0 0 0-16H46"/><path d="M48 52h34M48 62h34M48 72h24"/><path d="M90 90a8 8 0 0 1-8 8"/>'
  'rose'      = '<path d="M60 36c-7 0-11 5-9 11 2 5 9 6 13 2 3-3 2-9-3-10"/><path d="M48 46c-9 0-14 8-11 16 4 9 20 11 28 3"/><path d="M72 46c9 0 14 8 11 16-3 8-13 12-22 9"/><path d="M36 58c-7 13 3 28 24 28s31-15 24-28"/><path d="M60 86v26"/><path d="M60 102c-9-1-15-7-17-14 9 0 15 6 17 14z"/><path d="M60 96c8-1 13-6 15-12-8 0-13 5-15 12z"/>'
  'beads'     = '<path d="M60 78v12"/><path d="M41.5 74.0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"/><path d="M30.5 63.0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"/><path d="M26.5 48.0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"/><path d="M30.5 33.0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"/><path d="M41.5 22.0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"/><path d="M56.5 18.0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"/><path d="M71.5 22.0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"/><path d="M82.5 33.0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"/><path d="M86.5 48.0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"/><path d="M82.5 63.0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"/><path d="M71.5 74.0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"/><path d="M60 92v20M53 99h14"/>'
  'scales'    = '<path d="M60 18v82"/><path d="M42 104h36"/><path d="M22 34h76"/><path d="M56 22a4 4 0 1 0 8 0a4 4 0 1 0-8 0"/><path d="M22 34L10 66M22 34l12 32"/><path d="M98 34L86 66M98 34l12 32"/><path d="M8 66q14 14 28 0z"/><path d="M84 66q14 14 28 0z"/>'
  'candle'    = '<path d="M34 104h52"/><path d="M47 104V58h26v46"/><path d="M60 58v-8"/><path d="M60 48c-7-6-7-15 0-24 7 9 7 18 0 24z"/><path d="M60 14V6M40 22l-5-5M80 22l5-5M32 38h-7M88 38h7"/>'
  'star'      = '<path d="M60 12l6 34 32 6-32 6-6 50-6-50-32-6 32-6z"/><path d="M45 37l-7-7M75 37l7-7M45 67l-7 7M75 67l7 7"/><path d="M22 22v6M19 25h6"/><path d="M98 90v6M95 93h6"/><path d="M16 106h88"/>'
  'thorns'    = '<path d="M16 60a44 20 0 1 0 88 0a44 20 0 1 0-88 0"/><path d="M18 52c20 18 64 20 84 2M18 68c20-18 64-20 84-2"/><path d="M28 46l-5-9M46 42l-2-10M66 41l2-10M84 44l5-9M100 52l9-3M20 54l-9-4M28 75l-5 8M48 80l-2 10M70 80l2 10M90 75l5 8"/>'
  'dove'      = '<path d="M60 75c-5 0-8-4-8-10 0-12 3-24 8-34 5 10 8 22 8 34 0 6-3 10-8 10z"/><path d="M55 81a5 5 0 1 0 10 0a5 5 0 1 0-10 0"/><path d="M54 48C40 34 24 32 10 38c10 4 18 10 22 18 8-2 16-4 22-6z"/><path d="M66 48c14-14 30-16 44-10-10 4-18 10-22 18-8-2-16-4-22-6z"/><path d="M56 32l-5-16h18l-5 16"/><path d="M60 94v12M46 92l-6 10M74 92l6 10"/>'
  'tabor'     = '<path d="M6 104L42 58l12 12 20-34 40 68"/><path d="M58 52l8-6M74 36l4 12"/><path d="M74 26v-12M58 30l-7-8M90 30l7-8M54 44h-9M94 44h9"/><path d="M14 112h92"/>'
  'stars12'   = '<path d="M60.0 12.5v7.0M56.5 16.0h7.0M81.0 18.1v7.0M77.5 21.6h7.0M96.4 33.5v7.0M92.9 37.0h7.0M102.0 54.5v7.0M98.5 58.0h7.0M96.4 75.5v7.0M92.9 79.0h7.0M81.0 90.9v7.0M77.5 94.4h7.0M60.0 96.5v7.0M56.5 100.0h7.0M39.0 90.9v7.0M35.5 94.4h7.0M23.6 75.5v7.0M20.1 79.0h7.0M18.0 54.5v7.0M14.5 58.0h7.0M23.6 33.5v7.0M20.1 37.0h7.0M39.0 18.1v7.0M35.5 21.6h7.0"/><path d="M42 74V44l18 22 18-22v30"/>'
  'tools'     = '<path d="M22 26h12v62h66v12H22z"/><path d="M58 22h40v14H58z"/><path d="M76 36v44"/><path d="M98 29h8"/>'
  'sword'     = '<path d="M60 10l6 10v62H54V20z"/><path d="M60 22v56"/><path d="M38 82h44"/><path d="M60 82v16"/><path d="M55 104a5 5 0 1 0 10 0a5 5 0 1 0-10 0"/>'
  'eagle'     = '<path d="M60 44c-6 0-9 8-9 18s4 20 9 28c5-8 9-18 9-28s-3-18-9-18z"/><path d="M54 34a6 6 0 1 0 12 0a6 6 0 1 0-12 0"/><path d="M66 33l9 3-8 3"/><path d="M48 32a12 12 0 0 1 24 0"/><path d="M52 56C40 34 24 26 8 28c10 6 14 14 16 22-6 1-10 5-12 9 12-3 26-2 40 2z"/><path d="M68 56c12-22 28-30 44-28-10 6-14 14-16 22 6 1 10 5 12 9-12-3-26-2-40 2z"/><path d="M54 88l-8 16h28l-8-16"/>'
  'heart'     = '<path d="M60 102C32 84 20 68 20 52a20 20 0 0 1 40-8 20 20 0 0 1 40 8c0 16-12 32-40 50z"/><path d="M60 34c-7-6-7-15 0-24 7 9 7 18 0 24z"/><path d="M14 98L104 34"/><path d="M104 34l-11 1M104 34l-2 11"/><path d="M14 98l1-9M14 98l9-1"/>'
  'sun'       = '<path d="M42 60a18 18 0 1 0 36 0a18 18 0 1 0-36 0"/><path d="M60.0 35.0L60.0 14.0M69.6 36.9L73.8 26.7M77.7 42.3L92.5 27.5M83.1 50.4L93.3 46.2M85.0 60.0L106.0 60.0M83.1 69.6L93.3 73.8M77.7 77.7L92.5 92.5M69.6 83.1L73.8 93.3M60.0 85.0L60.0 106.0M50.4 83.1L46.2 93.3M42.3 77.7L27.5 92.5M36.9 69.6L26.7 73.8M35.0 60.0L14.0 60.0M36.9 50.4L26.7 46.2M42.3 42.3L27.5 27.5M50.4 36.9L46.2 26.7"/>'
  'tau'       = '<path d="M22 24h76v16H68v66H52V40H22z"/><path d="M60 14v-4M44 16l-3-3M76 16l3-3"/>'
  'ihs'       = '<path d="M30 60a30 30 0 1 0 60 0a30 30 0 1 0-60 0"/><path d="M60.0 25.0L60.0 8.0M69.1 26.2L71.4 17.5M77.5 29.7L86.0 15.0M84.7 35.3L91.1 28.9M90.3 42.5L105.0 34.0M93.8 50.9L102.5 48.6M95.0 60.0L112.0 60.0M93.8 69.1L102.5 71.4M90.3 77.5L105.0 86.0M84.7 84.7L91.1 91.1M77.5 90.3L86.0 105.0M69.1 93.8L71.4 102.5M60.0 95.0L60.0 112.0M50.9 93.8L48.6 102.5M42.5 90.3L34.0 105.0M35.3 84.7L28.9 91.1M29.7 77.5L15.0 86.0M26.2 69.1L17.5 71.4M25.0 60.0L8.0 60.0M26.2 50.9L17.5 48.6M29.7 42.5L15.0 34.0M35.3 35.3L28.9 28.9M42.5 29.7L34.0 15.0M50.9 26.2L48.6 17.5"/><path d="M45 52v18"/><path d="M52 52v18M52 61h10M62 52v18"/><path d="M77 54c-1-3-9-3-9 1.5s9 3.5 9 8.5-8 5-10 1.5"/><path d="M57 46v-10M53 40h8"/>'
  'cupsnake'  = '<path d="M38 46h44c0 18-9 28-22 28S38 64 38 46z"/><path d="M60 74v16"/><path d="M44 104q16-14 32 0z"/><path d="M58 46c-8-6 6-12-2-18-6-5 4-12 10-8"/><path d="M66 20l6-2-3 6"/>'
  'shamrock'  = '<path d="M60 58c-12-4-18-14-12-22 4-5 10-3 12 2 2-5 8-7 12-2 6 8 0 18-12 22z"/><path transform="rotate(120 60 58)" d="M60 58c-12-4-18-14-12-22 4-5 10-3 12 2 2-5 8-7 12-2 6 8 0 18-12 22z"/><path transform="rotate(240 60 58)" d="M60 58c-12-4-18-14-12-22 4-5 10-3 12 2 2-5 8-7 12-2 6 8 0 18-12 22z"/><path d="M60 58q6 26 20 46"/>'
  'arms'      = '<path d="M22 16h76v44c0 28-18 42-38 50-20-8-38-22-38-50z"/><path d="M70 16v86"/><path d="M22 42h76"/><path d="M32 86V62l9 12 9-12v24"/>'
  'hand'      = '<path d="M46 108V70l-10-16c-3-5 3-9 7-5l9 11V28c0-5 8-5 8 0v26-32c0-5 8-5 8 0v32-26c0-5 8-5 8 0v30-20c0-5 8-5 8 0v40c0 18-8 30-20 30z"/><path d="M58 80a4 4 0 1 0 8 0a4 4 0 1 0-8 0"/>'
  'lion'      = '<path d="M60.0 20.0Q71.6 9.3 77.4 24.0Q92.4 19.3 91.3 35.1Q106.9 37.4 99.0 51.1Q112.0 60.0 99.0 68.9Q106.9 82.6 91.3 84.9Q92.4 100.7 77.4 96.0Q71.6 110.7 60.0 100.0Q48.4 110.7 42.6 96.0Q27.6 100.7 28.7 84.9Q13.1 82.6 21.0 68.9Q8.0 60.0 21.0 51.1Q13.1 37.4 28.7 35.1Q27.6 19.3 42.6 24.0Q48.4 9.3 60.0 20.0z"/><path d="M36 54c0-16 10-26 24-26s24 10 24 26c0 18-10 32-24 32S36 72 36 54z"/><path d="M48 52h4M68 52h4"/><path d="M54 66h12l-6 6z"/><path d="M60 72v4M52 80q8 4 16 0"/>'
}
function Ill-Art([string]$name) {
  if (-not $Ill[$name]) { return '' }
  "<div class=`"ill-art`" aria-hidden=`"true`"><svg viewBox=`"0 0 120 120`">$($Ill[$name] -replace '<path ', '<path pathLength="1" ' -replace '/>', '></path>')</svg></div>"
}
# -Kick and -Sub may be empty; -Body is the section's own content, under the heading
function Ill-Sec([string]$Id, [string]$Art, [string]$Tone, [string]$Kick, [string]$Head, [string]$Body, [string]$Sub = '', [string]$HeadId = '', [string]$Class = '') {
  $k = if ($Kick) { "<p class=`"ill-kick`">$Kick</p>" } else { '' }
  $hid = if ($HeadId) { " id=`"$HeadId`"" } else { '' }
  $lab = if ($HeadId) { " aria-labelledby=`"$HeadId`"" } else { '' }
  "<section id=`"$Id`" class=`"ill-sec tone-$Tone$(if ($Class) { " $Class" })`"$lab>$(Ill-Art $Art)<div class=`"ill-body`">$k<h2 class=`"ill-h`"$hid>$Head</h2>$Sub$Body</div></section>"
}
# Jerusalem cross: large cross potent in the centre, a small cross in each quadrant (100x100 grid)
$CrossShapes = '<rect x="44" y="12" width="12" height="76"/><rect x="12" y="44" width="76" height="12"/><rect x="33" y="8" width="34" height="9"/><rect x="33" y="83" width="34" height="9"/><rect x="8" y="33" width="9" height="34"/><rect x="83" y="33" width="9" height="34"/><rect x="23.5" y="18" width="5" height="16"/><rect x="18" y="23.5" width="16" height="5"/><rect x="71.5" y="18" width="5" height="16"/><rect x="66" y="23.5" width="16" height="5"/><rect x="23.5" y="66" width="5" height="16"/><rect x="18" y="71.5" width="16" height="5"/><rect x="71.5" y="66" width="5" height="16"/><rect x="66" y="71.5" width="16" height="5"/>'
$Logo = '<svg class="logo" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g fill="currentColor">' + $CrossShapes + '</g></svg>'

# The header's mark: a Christian fish (ichthys) facing left with a small cross in its body, softly
# glowing like the rosary's cross; on hover or focus it turns over to a static Jerusalem cross.
# The cross: a cross potent (arms ending in bars) with four small crosses, drawn on a 100 grid with
# every gap the same, so it stays crisp at 28px
$IchthysSvg = '<svg viewBox="0 0 48 24" focusable="false"><path d="M3 12C13-.5 33-1 45 20.5M3 12C13 24.5 33 25 45 3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M24 6.5v11M19.5 11h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
$JerusalemSvg = '<svg viewBox="0 0 100 100" focusable="false"><g fill="currentColor"><rect x="44.5" y="10" width="11" height="80" rx="1"/><rect x="10" y="44.5" width="80" height="11" rx="1"/><rect x="32" y="7" width="36" height="9" rx="1"/><rect x="32" y="84" width="36" height="9" rx="1"/><rect x="7" y="32" width="9" height="36" rx="1"/><rect x="84" y="32" width="9" height="36" rx="1"/><rect x="24.5" y="18" width="5" height="18" rx=".6"/><rect x="18" y="24.5" width="18" height="5" rx=".6"/><rect x="70.5" y="18" width="5" height="18" rx=".6"/><rect x="64" y="24.5" width="18" height="5" rx=".6"/><rect x="24.5" y="64" width="5" height="18" rx=".6"/><rect x="18" y="70.5" width="18" height="5" rx=".6"/><rect x="70.5" y="64" width="5" height="18" rx=".6"/><rect x="64" y="70.5" width="18" height="5" rx=".6"/></g></svg>'
$BrandMark = '<span class="bm" aria-hidden="true"><span class="bm-in"><span class="bm-face bm-fish"><span class="bm-halo"></span>' + $IchthysSvg + '</span><span class="bm-face bm-cross">' + $JerusalemSvg + '</span></span></span>'
# The name in capitals (a tiny EB Garamond subset holding only these letters, preloaded); read as
# words by screen readers
$BrandName = '<span class="brand-name"><span class="visually-hidden">Katolik Dünyası</span><span class="bn" lang="tr" aria-hidden="true"><span class="bn-c">K</span>ATOLİK <span class="bn-c">D</span>ÜNYASI</span></span>'
$Favicon = 'data:image/svg+xml,' + ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#16161a"/><g fill="#d6b16b" transform="translate(12 12) scale(.76)">' + $CrossShapes + '</g></svg>').Replace('<', '%3C').Replace('>', '%3E').Replace('#', '%23').Replace('"', "'")

# ------------------------------------------------------------------ components
# drawn by CSS (.ext in styles.css): one rule instead of an inline SVG in every link (the glossary has 600 of them)
$IcoExternal = '<i class="ext" aria-hidden="true"></i>'
# ---- References to the Catechism (CCC / KKK) and to Scripture, linked to their sources
# CCC paragraphs go to the Catechism on vatican.va, in a new window. data/ccc-vatican.json, when
# present, maps paragraph ranges to the vatican.va page holding them ([{ "from": 1420, "to": 1498,
# "url": "https://www.vatican.va/content/catechism/en/..." }]); a paragraph it does not cover
# goes to the Catechism's contents page there.
$CccHome = 'https://www.vatican.va/content/catechism/en.html'
$CccMapFile = Join-Path $Root 'data/ccc-vatican.json'
$CccMap = if (Test-Path $CccMapFile) { @(Get-Content -Raw -Encoding UTF8 $CccMapFile | ConvertFrom-Json) } else { @() }
function Ccc-Url([int]$n) {
  foreach ($r in $CccMap) { if ($n -ge [int]$r.from -and $n -le [int]$r.to) { return $r.url } }
  return $CccHome
}
# "971, 2096–2097, 2132": one link per paragraph or range; a "CIC kan." (canon law) part stays text
function Ccc-Link([string]$text) {
  $title = TA 'title' "Katolik Kilisesi Katekizmi, vatican.va (yeni pencerede açılır)"
  $parts = $text -split ' · '
  $out = foreach ($part in $parts) {
    if ($part -match '^\s*CIC') { $part; continue }
    $pre = ''; $body = $part
    if ($part -match '^(\s*(?:CCC|KKK)\s)(.*)$') { $pre = $Matches[1]; $body = $Matches[2] }
    $items = $body -split ',\s*'
    $pre + (($items | ForEach-Object {
      if ($_ -match '^(\d{1,4})') { "<a href=`"$(Ccc-Url ([int]$Matches[1]))`" target=`"_blank`" rel=`"noopener`" $title>$_</a>" } else { $_ }
    }) -join ', ')
  }
  $h = $out -join ' · '
  # the small "opens elsewhere" arrow rides inside the last link, so it never wraps onto a line alone
  $i = $h.LastIndexOf('</a>')
  if ($i -ge 0) { return $h.Substring(0, $i) + $IcoExternal + $h.Substring($i) }
  return $h
}
# Scripture: every "Matta 13:1–23", "1. Korintliler 12:13", "Luke 15:3–7" in a page's text links
# to that passage on BibleGateway, in the Revised Standard Version, Catholic Edition.
$BibleBooks = [ordered]@{
  'Yaratılış' = 'Genesis'; "Mısır’dan Çıkış" = 'Exodus'; "Mısır'dan Çıkış" = 'Exodus'; 'Çıkış' = 'Exodus'; 'Levililer' = 'Leviticus'
  'Çölde Sayım' = 'Numbers'; 'Sayılar' = 'Numbers'; "Yasa’nın Tekrarı" = 'Deuteronomy'; "Yasa'nın Tekrarı" = 'Deuteronomy'
  'Yeşu' = 'Joshua'; 'Hakimler' = 'Judges'; 'Rut' = 'Ruth'; 'Samuel' = 'Samuel'; 'Krallar' = 'Kings'; 'Tarihler' = 'Chronicles'
  'Ezra' = 'Ezra'; 'Nehemya' = 'Nehemiah'; 'Tobit' = 'Tobit'; 'Yudit' = 'Judith'; 'Ester' = 'Esther'
  'Makabeler' = 'Maccabees'; 'Makkabiler' = 'Maccabees'; 'Eyüp' = 'Job'; 'Mezmurlar' = 'Psalm'; 'Mezmur' = 'Psalm'
  "Süleyman’ın Özdeyişleri" = 'Proverbs'; "Süleyman'ın Özdeyişleri" = 'Proverbs'; 'Özdeyişler' = 'Proverbs'; 'Vaiz' = 'Ecclesiastes'
  'Ezgiler Ezgisi' = 'Song of Songs'; 'Neşideler Neşidesi' = 'Song of Songs'; 'Bilgelik' = 'Wisdom'; 'Sirak' = 'Sirach'
  'Yeşaya' = 'Isaiah'; 'Yeremya' = 'Jeremiah'; 'Ağıtlar' = 'Lamentations'; 'Baruk' = 'Baruch'; 'Hezekiel' = 'Ezekiel'; 'Daniel' = 'Daniel'
  'Hoşea' = 'Hosea'; 'Yoel' = 'Joel'; 'Amos' = 'Amos'; 'Ovadya' = 'Obadiah'; 'Yunus' = 'Jonah'; 'Mika' = 'Micah'; 'Nahum' = 'Nahum'
  'Habakkuk' = 'Habakkuk'; 'Sefanya' = 'Zephaniah'; 'Hagay' = 'Haggai'; 'Zekeriya' = 'Zechariah'; 'Malaki' = 'Malachi'
  'Matta' = 'Matthew'; 'Markos' = 'Mark'; 'Luka' = 'Luke'; 'Yuhanna' = 'John'; 'Elçilerin İşleri' = 'Acts'; 'Romalılar' = 'Romans'
  'Korintliler' = 'Corinthians'; 'Galatyalılar' = 'Galatians'; 'Efesliler' = 'Ephesians'; 'Filipililer' = 'Philippians'
  'Koloseliler' = 'Colossians'; 'Selanikliler' = 'Thessalonians'; 'Timoteos' = 'Timothy'; 'Titus' = 'Titus'; 'Filimon' = 'Philemon'
  'İbraniler' = 'Hebrews'; 'Yakup' = 'James'; 'Petrus' = 'Peter'; 'Yahuda' = 'Jude'; 'Vahiy' = 'Revelation'
  'Genesis' = 'Genesis'; 'Exodus' = 'Exodus'; 'Leviticus' = 'Leviticus'; 'Numbers' = 'Numbers'; 'Deuteronomy' = 'Deuteronomy'
  'Psalms' = 'Psalm'; 'Psalm' = 'Psalm'; 'Proverbs' = 'Proverbs'; 'Isaiah' = 'Isaiah'; 'Jeremiah' = 'Jeremiah'; 'Wisdom' = 'Wisdom'; 'Sirach' = 'Sirach'
  'Matthew' = 'Matthew'; 'Mark' = 'Mark'; 'Luke' = 'Luke'; 'John' = 'John'; 'Jn' = 'John'; 'Acts' = 'Acts'; 'Romans' = 'Romans'
  'Corinthians' = 'Corinthians'; 'Galatians' = 'Galatians'; 'Ephesians' = 'Ephesians'; 'Philippians' = 'Philippians'
  'Colossians' = 'Colossians'; 'Thessalonians' = 'Thessalonians'; 'Timothy' = 'Timothy'; 'Hebrews' = 'Hebrews'; 'James' = 'James'
  'Peter' = 'Peter'; 'Revelation' = 'Revelation'; 'Joshua' = 'Joshua'; 'Judges' = 'Judges'; 'Ruth' = 'Ruth'; 'Kings' = 'Kings'
  'Chronicles' = 'Chronicles'; 'Nehemiah' = 'Nehemiah'; 'Judith' = 'Judith'; 'Esther' = 'Esther'; 'Maccabees' = 'Maccabees'; 'Job' = 'Job'
  'Ecclesiastes' = 'Ecclesiastes'; 'Song of Songs' = 'Song of Songs'; 'Lamentations' = 'Lamentations'; 'Baruch' = 'Baruch'; 'Ezekiel' = 'Ezekiel'
  'Hosea' = 'Hosea'; 'Joel' = 'Joel'; 'Obadiah' = 'Obadiah'; 'Jonah' = 'Jonah'; 'Micah' = 'Micah'; 'Zephaniah' = 'Zephaniah'; 'Haggai' = 'Haggai'
  'Zechariah' = 'Zechariah'; 'Malachi' = 'Malachi'; 'Philemon' = 'Philemon'; 'Jude' = 'Jude'
}
$bookAlt = (($BibleBooks.Keys | Sort-Object { -$_.Length }) | ForEach-Object { [regex]::Escape($_) }) -join '|'
# (a number after a comma is another verse, unless a chapter follows it, "6:2", or it is the
# number of the next book, "1 Korintliler 5:7")
$VerseList = '\d{1,3}(?:\s?[-–]\s?\d{1,3})?(?:,\s?\d{1,3}(?:[-–]\d{1,3})?(?!\d*:)(?!\d*\.?\s\p{Lu}))*'
$ScriptureRx = [regex]"(?<![\p{L}\d’'])(?:(?<n>[1-3])\.?\s)?(?<b>$bookAlt)\s(?<c>\d{1,3}):(?<v>$VerseList)"
$ScriptureMoreRx = [regex]"(?<a><a class=`"bref`" data-b=`"(?<eb>[^`"]+)`"[^>]*>[^<]*</a>)(?<sep>;\s?)(?<c>\d{1,3}):(?<v>$VerseList)"
$KkkRx = [regex]"(?<![\p{L}\d])(?<k>KKK|CCC)\s(?<p>\d{1,4}(?:\s?[-–]\s?\d{1,4})?(?:,\s?\d{1,4}(?:[-–]\d{1,4})?)*)"
function Bible-Url([string]$book, [string]$c, [string]$v) {
  $q = "$book $($c):$(($v -replace '–', '-') -replace '\s', '')"
  return "https://www.biblegateway.com/passage/?search=$([uri]::EscapeDataString($q))&amp;version=RSVCE"
}
$ScriptureEval = [System.Text.RegularExpressions.MatchEvaluator]{
  param($m)
  $en = $BibleBooks[$m.Groups['b'].Value]
  if ($m.Groups['n'].Success) { $en = "$($m.Groups['n'].Value) $en" }
  "<a class=`"bref`" data-b=`"$en`" href=`"$(Bible-Url $en $m.Groups['c'].Value $m.Groups['v'].Value)`" target=`"_blank`" rel=`"noopener`">$($m.Value)</a>"
}
$ScriptureMoreEval = [System.Text.RegularExpressions.MatchEvaluator]{
  param($m)
  $en = $m.Groups['eb'].Value; $t = "$($m.Groups['c'].Value):$($m.Groups['v'].Value)"
  "$($m.Groups['a'].Value)$($m.Groups['sep'].Value)<a class=`"bref`" data-b=`"$en`" href=`"$(Bible-Url $en $m.Groups['c'].Value $m.Groups['v'].Value)`" target=`"_blank`" rel=`"noopener`">$t</a>"
}
$KkkEval = [System.Text.RegularExpressions.MatchEvaluator]{
  param($m)
  $first = [int]([regex]::Match($m.Groups['p'].Value, '\d+').Value)
  "<a class=`"cref`" href=`"$(Ccc-Url $first)`" target=`"_blank`" rel=`"noopener`" title=`"Katolik Kilisesi Katekizmi, vatican.va`">$($m.Value)</a>"
}
# Only the text between tags, and none inside a link, a script or a style, is looked at
function Link-Refs([string]$html) {
  $parts = [regex]::Split($html, '(<[^>]+>)')
  $inA = 0; $skip = 0
  $sb = [System.Text.StringBuilder]::new()
  foreach ($p in $parts) {
    if ($p.StartsWith('<')) {
      if ($p -match '^<a[\s>]') { $inA++ } elseif ($p -match '^</a>') { $inA = [Math]::Max(0, $inA - 1) }
      elseif ($p -match '^<(script|style|textarea|title|summary)[\s>]') { $skip++ } elseif ($p -match '^</(script|style|textarea|title|summary)>') { $skip = [Math]::Max(0, $skip - 1) }
      [void]$sb.Append($p); continue
    }
    if ($inA -or $skip -or $p.Length -lt 6) { [void]$sb.Append($p); continue }
    $t = $ScriptureRx.Replace($p, $ScriptureEval)
    for ($k = 0; $k -lt 6; $k++) { $t2 = $ScriptureMoreRx.Replace($t, $ScriptureMoreEval); if ($t2 -eq $t) { break }; $t = $t2 }
    $t = $KkkRx.Replace($t, $KkkEval)
    [void]$sb.Append($t)
  }
  return $sb.ToString()
}
function Qa-Html($it, [int]$hl) {
  $n = $it.n; $tag = HTag $hl
  # a translator's note belongs to the Turkish only
  $note = ''
  return "<article class=`"qa`" id=`"soru-$n`" data-n=`"$n`">" +
    "<header class=`"qa-head`"><a class=`"qa-num`" href=`"#soru-$n`" $(TA 'aria-label' "Soru $n bağlantısı")>$n</a><$tag class=`"qa-q`">$((Inline $it.tr.q))</$tag></header>" +
    "<p class=`"qa-ref`" $(TA 'title' 'Katolik Kilisesi Katekizmi madde numaraları')>$(Ccc-Link $it.ccc)</p>" +
    "<div class=`"qa-a`">$((Blocks $it.tr.a))</div>$note" +
    "</article>"
}
# $tagLevel is the true HTML heading level (never skips a level in the DOM); it can
# differ from $it.level, which only sets the sec-l$level class (visual size), e.g. a
# bridging title like "The Creed" sits right under a Part heading and is styled a size
# smaller (sec-l4) even though it is only one level deep, not four.
function Heading-Html($it, [int]$tagLevel) {
  $tag = HTag $tagLevel
  $tr = Split-Heading $it.tr
  $label = if ($tr[0]) { "<span class=`"sec-label`">$($tr[0])</span>" } else { '' }
  return "<$tag class=`"sec sec-l$($it.level)`" id=`"$($it.id)`">$label<span class=`"sec-title`">$((Inline $tr[1]))</span></$tag>"
}
function Quote-Html($it) {
  $t = Split-Attr $it.tr
  $cap = if ($t[1]) { "<figcaption class=`"attr`">$((Inline $t[1]))</figcaption>" } else { '' }
  return "<figure class=`"quote`"><blockquote><p>$((Inline $t[0]))</p></blockquote>$cap</figure>"
}
# Card with Turkish text and optional Latin
function Text-Card($obj, [string]$id, [int]$hl, [string]$bodyTr) {
  $tag = HTag $hl
  $html = "<article class=`"text-card`" id=`"$id`"><$tag class=`"t-title`">$((Inline $obj.tr.title))</$tag>$($bodyTr)"
  if ($obj.la) { $html += "<details class=`"latin`"><summary>Latince metin: $($obj.la.title)</summary><div class=`"verse`" lang=`"la`">$(Verse $obj.la.text)</div></details>" }
  return $html + '</article>'
}
function Decalogue-Table($d) {
  $head = '<thead><tr>' + (($d.cols | ForEach-Object { "<th scope=`"col`">$_</th>" }) -join '') + '</tr></thead>'
  $rows = @($d.rows); $body = New-Object Text.StringBuilder
  for ($r = 0; $r -lt $rows.Count; $r++) {
    [void]$body.Append('<tr>'); $row = @($rows[$r])
    for ($c = 0; $c -lt $row.Count; $c++) {
      if ($null -eq $row[$c]) { continue }
      $span = if ($c -eq 0 -and $r + 1 -lt $rows.Count -and $null -eq @($rows[$r + 1])[0]) { ' rowspan="2"' } else { '' }
      [void]$body.Append("<td data-label=`"$(Attr $d.cols[$c])`"$span>$(Verse $row[$c])</td>")
    }
    [void]$body.Append('</tr>')
  }
  return "<div class=`"verse`"><table>$head<tbody>$($body.ToString())</tbody></table></div>"
}
function Special-Html([string]$ref, [int]$hl) {
  switch ($ref) {
    'creeds' {
      $cards = ($X.creeds | ForEach-Object { Text-Card $_ $_.id $hl "<div class=`"verse`">$(Verse $_.tr.text)</div>" }) -join ''
      return "<div class=`"text-grid two`">$cards</div>"
    }
    'decalogue' {
      $d = $X.decalogue
      $obj = [pscustomobject]@{ tr = [pscustomobject]@{ title = $d.tr.title }; la = $null }
      return "<div class=`"text-grid decalogue`">$(Text-Card $obj 'on-emir-tablosu' $hl (Decalogue-Table $d.tr))</div>"
    }
    'our-father' {
      $o = $X.ourFather
      $trV = '<div class="verse">' + (Verse $o.tr.text) + '</div>'
      return '<div class="text-grid">' + (Text-Card $o 'goklerdeki-babamiz-duasi' $hl $trV) + '</div>'
    }
  }
  return ''
}
# Renders a part's items in order; the level-1 heading is the page <h1>, so it is skipped
function Render-Items($items) {
  $sb = New-Object Text.StringBuilder; $current = 1
  foreach ($it in $items) {
    switch ($it.type) {
      'heading' {
        if ($it.level -gt 1) {
          $tagLevel = [Math]::Min([int]$it.level, $current + 1)
          [void]$sb.Append((Heading-Html $it $tagLevel))
          $current = $tagLevel
        } else {
          $current = [int]$it.level
        }
      }
      'qa'      { [void]$sb.Append((Qa-Html $it ($current + 1))) }
      'quote'   { [void]$sb.Append((Quote-Html $it)) }
      'special' { [void]$sb.Append((Special-Html $it.ref ($current + 1))) }
    }
    [void]$sb.Append("`n")
  }
  return $sb.ToString()
}

# ------------------------------------------------------------------ page shell
# ---------------- content/*.md pages (front matter + minimal Markdown)
function Read-Md([string]$name) {
  $p = Join-Path (Join-Path $Root 'content') $name
  $md = if (Test-Path $p) { [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8) } else { '' }
  $meta = @{}
  $fmm = [regex]::Match($md, '^\uFEFF?\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)')
  if ($fmm.Success) {
    foreach ($line in ($fmm.Groups[1].Value -split "`n")) { $kv = [regex]::Match($line, '^\s*([A-Za-z_]+)\s*:\s*(.*?)\s*$'); if ($kv.Success) { $meta[$kv.Groups[1].Value.ToLower()] = $kv.Groups[2].Value.Trim('"', "'") } }
    $md = $md.Substring($fmm.Length)
  }
  return @{ meta = $meta; body = $md }
}

# ---------------- "Kaynaklar ve telif": content/hakkinda.md is the list shown in the footer's
# sources dialog; its front-matter "about" line is the one-sentence description under the footer tagline.
$aboutFile = Join-Path (Join-Path $Root 'content') 'hakkinda.md'
$aboutMd = if (Test-Path $aboutFile) { [IO.File]::ReadAllText($aboutFile, [Text.Encoding]::UTF8) } else { '' }
$aboutMd = $aboutMd -replace '\{\{TARIH\}\}', $BuildDateTr
$fm = @{}
$fmMatch = [regex]::Match($aboutMd, '^\uFEFF?\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)')
if ($fmMatch.Success) {
  foreach ($line in ($fmMatch.Groups[1].Value -split "`n")) { $kv = [regex]::Match($line, '^\s*([A-Za-z_]+)\s*:\s*(.*?)\s*$'); if ($kv.Success) { $fm[$kv.Groups[1].Value.ToLower()] = $kv.Groups[2].Value.Trim('"', "'") } }
  $aboutMd = $aboutMd.Substring($fmMatch.Length)
}
$h1m = [regex]::Match($aboutMd, '(?m)^#\s+(.+?)\s*$')
if ($h1m.Success) { $aboutMd = $aboutMd.Remove($h1m.Index, $h1m.Length) }
$InfoHtml = Convert-Markdown $aboutMd

$Kk = Read-Md 'kutsal-kitap.md'
$KkMeta = $Kk.meta
$Er = Read-Md 'erisilebilirlik.md'
$ErMeta = $Er.meta
$Gz = Read-Md 'gizlilik.md'
$GzMeta = $Gz.meta
$Dk = Read-Md 'dogu-katolik-kiliseleri.md'
$DkMeta = $Dk.meta

# Top bar: brand, the settings gear (accessibility), the five core links and the
# hamburger that opens the full menu.
$TextNav = @(
  @{ href = 'motu-proprio.html';    t = 'Motu Proprio';                       s = 'XVI. Benediktus, 2005' },
  @{ href = 'giris.html';           t = 'Giriş';                              s = 'Kardinal Ratzinger, 2005' },
  @{ href = 'iman-ikrari.html';     t = 'I. İnanç Beyanı';                    s = 'Sorular 1–217' },
  @{ href = 'kutsal-sirlar.html';   t = 'II. Hristiyan Gizeminin Kutlanması'; s = 'Sorular 218–356' },
  @{ href = 'mesihte-yasam.html';   t = "III. Mesih$($Apos)te Yaşam";         s = 'Sorular 357–533' },
  @{ href = 'hristiyan-duasi.html'; t = 'IV. Hristiyan Duası';                s = 'Sorular 534–598' },
  @{ href = 'ekler.html';           t = 'Ekler';                              s = 'Dualar ve formüller' }
)
# Katekizm gets its own top-level nav menu (mirrors the English site's "Compendium" dropdown):
# the overview page plus each of its seven chapters.
$KatekizmNav = @(@{ href = 'katekizm.html'; t = 'Genel Bakış'; s = '598 soru ve yanıtın tam listesi' }) + $TextNav
# Every page that belongs to the Compendium, for the 'is-section' state and the breadcrumb
$KatekizmPages = @('katekizm.html') + ($TextNav | ForEach-Object { $_.href })
$IcoBook = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.6C10.6 5.4 8.6 4.8 6 4.8H3.6v13.4H6c2.6 0 4.6.6 6 1.8 1.4-1.2 3.4-1.8 6-1.8h2.4V4.8H18c-2.6 0-4.6.6-6 1.8z"/><path d="M12 6.6v13.4"/></svg>'
$IcoBeads = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="14.6" r="6.4"/><circle cx="12" cy="5.2" r="1.5"/><path d="M12 6.7v1.5" stroke-linecap="round"/><path d="M10.4 3.3h3.2M12 1.7v3.2" stroke-linecap="round"/></svg>'
$IcoWay = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21c3-6 3-11 0-17"/><path d="M19 21c-3-6-3-11 0-17"/><path d="M9.5 15h5M9 10h6"/><circle cx="12" cy="4" r="1.4" fill="currentColor" stroke="none"/></svg>'
$IcoStar = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2c1 2.8 1.9 4.4 3.4 5.8 1.5 1.4 3.1 2.1 5.4 2.7-2.3.6-3.9 1.4-5.4 2.7-1.5 1.4-2.4 3-3.4 5.8-1-2.8-1.9-4.4-3.4-5.8-1.5-1.3-3.1-2.1-5.4-2.7 2.3-.6 3.9-1.3 5.4-2.7 1.5-1.4 2.4-3 3.4-5.8z"/></svg>'
$IcoChalice = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10"/><path d="M7.6 4c0 4.4 1.3 7.6 4.4 7.6s4.4-3.2 4.4-7.6"/><path d="M12 11.6V19"/><path d="M8 19h8"/></svg>'
$IcoRadiance = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></svg>'
$IcoHome = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9.5a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1V10"/></svg>'
$IcoMail = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.2" y="5.5" width="17.6" height="13" rx="1.6"/><path d="m4 6.5 8 6.5 8-6.5"/></svg>'
$IcoPrayers = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v14"/><path d="M8 5.5c0 5-1 8-3.5 10"/><path d="M16 5.5c0 5 1 8 3.5 10"/><path d="M8 20.5c1.3-1 2.7-1 4 0 1.3-1 2.7-1 4 0"/></svg>'
$IcoScroll = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4.5h11a2 2 0 0 1 2 2V8H9a2 2 0 0 0-2 2Z"/><path d="M7 4.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5H9a2 2 0 0 1-2-2Z"/><path d="M11.5 11.5h5M11.5 14.5h5"/></svg>'
$IcoAsk = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.2"/><path d="M9.3 9.2a2.8 2.8 0 1 1 3.5 3.1c-.6.2-.9.7-.9 1.3v.6"/><circle cx="12" cy="17.2" r="1.05" fill="currentColor" stroke="none"/></svg>'
$IcoGlossary = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4.5h11a2.5 2.5 0 0 1 2.5 2.5v13.5H7.5A2.5 2.5 0 0 1 5 18z"/><path d="M5 18a2.5 2.5 0 0 1 2.5-2.5h11"/><path d="m9.4 12.4 2.3-5.6 2.3 5.6M10.2 10.6h3"/></svg>'
# Doğu Katolik Kiliseleri: the Eastern three-bar cross
$IcoEastCross = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8v18.4M9.4 5.4h5.2M6.4 9.6h11.2M9 17.6l6-2.4"/></svg>'
$IcoPin = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg>'
$SmallCross = '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor">' + $CrossShapes + '</g></svg>'
# Cevap Ver: two speech bubbles; İslam'a Cevap: a speech bubble with a cross in it
$IcoDebate = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.6h9.6a1.6 1.6 0 0 1 1.6 1.6v5.2a1.6 1.6 0 0 1-1.6 1.6H8.4l-3.6 3v-3H4a1.6 1.6 0 0 1-1.6-1.6V6.2A1.6 1.6 0 0 1 4 4.6Z"/><path d="M15.2 8.6H20a1.6 1.6 0 0 1 1.6 1.6v5.2A1.6 1.6 0 0 1 20 17h-.8v3l-3.6-3h-4.4a1.6 1.6 0 0 1-1.6-1.6V13"/></svg>'
$IcoAnswer = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3.8h14a1.8 1.8 0 0 1 1.8 1.8v9.2a1.8 1.8 0 0 1-1.8 1.8h-7.4L7 20.4v-3.8H5a1.8 1.8 0 0 1-1.8-1.8V5.6A1.8 1.8 0 0 1 5 3.8Z"/><path d="M12 6.6v7.2M9.4 9.2h5.2"/></svg>'
# Ateizme Cevap: a planet with its ring and a small star
$IcoCosmos = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="13.5" r="5"/><path d="M4.6 17.8c-1.9-1.2.6-4.6 5.6-7.1s9.9-3.2 11-1.5c.6 1-.4 2.6-2.5 4.3"/><path d="M18.5 2.8v3.6M16.7 4.6h3.6"/></svg>'
$IcoLamp = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v13M8.5 20h7"/><path d="M9 7v2a3 3 0 0 0 6 0V7"/><path d="M6 7v2a6 6 0 0 0 12 0V7"/><path d="M3 7v2a9 9 0 0 0 18 0V7"/><path d="M3 4.6v.4M6 4.6v.4M9 4.6v.4M12 4.6v.4M15 4.6v.4M18 4.6v.4M21 4.6v.4"/></svg>'
# href -> icon lookup for the mobile menu sheet (each real destination gets a small icon; the
# plain-text ns-label section headers do not). Defined early, before Header-Html is first called
# by the Compendium part-page loop below, so every icon it references must already exist here.
$NavIcons = @{
  'index.html'          = $IcoHome
  'katekizm.html'        = $SmallCross
  'katolik-sureci.html'  = $IcoWay
  'gunah-cikarma.html'   = $IcoKey
  'kutsal-ayin.html'     = $IcoChalice
  'meseller.html'        = $IcoScroll
  'kutsal-kitap.html'    = $IcoBook
  'tesbih-duasi.html'    = $IcoBeads
  'ekler.html'           = $IcoPrayers
  'mucizeler.html'       = $IcoRadiance
  'azizler.html'         = $IcoStar
  'sss.html'             = $IcoAsk
  'sozluk.html'          = $IcoGlossary
  'kiliseler.html'       = $IcoPin
  'topraklarimizda-hristiyanlik.html' = $IcoRoots
  'dogu-katolik-kiliseleri.html' = $IcoEastCross
  'kilise-tarihi.html'   = $IcoHourglass
  'islama-cevap.html'    = $IcoAnswer
  'ateizme-cevap.html'   = $IcoCosmos
  'yahudilere-cagri.html' = $IcoLamp
  'iletisim.html'        = $IcoMail
}
$IcoA11yPerson = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="7.4" r="1.3" fill="currentColor" stroke="none"/><path d="M7.6 10.2 12 11l4.4-.8M12 11v3.2l-2.2 4M12 14.2l2.2 4"/></svg>'
$IcoShield = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 5 6v5.4c0 4.4 3 8 7 9.4 4-1.4 7-5 7-9.4V6Z"/><path d="m9.2 12.2 2 2 3.8-4"/></svg>'
# The full-screen menu: the same three groups as the home screen's apps (Öğren, Dua Et, Keşfet)
# and a fourth for the site itself. The Katekizm is one row; the arrow beside it folds its seven
# parts open underneath (open already when the page shown is one of them).
$SheetNav = @(
  @{ label = 'Öğren'; items = @(
    @{ href = 'neden-katoligiz.html'; t = 'Neden Katoliğiz?'; s = 'Tanrı, İsa ve Kilise, kısaca'; ico = $IcoCompass },
    @{ href = 'katekizm.html'; t = 'Katekizm'; s = '598 soru ve yanıt' },
    @{ href = 'kutsal-kitap.html'; t = 'Kutsal Kitap'; s = 'Onaylı çeviriler' },
    @{ href = 'sss.html'; t = 'Sorular'; s = 'Sıkça sorulan sorular' },
    @{ href = 'sozluk.html'; t = 'Sözlük'; s = 'Katolik terimleri, A-Z'; ico = $IcoGlossary },
    @{ href = 'katolik-sureci.html'; t = 'Katolik Olma Süreci'; s = 'OCIA, adım adım' },
    @{ href = 'meseller.html'; t = "İsa$($Apos)nın Meselleri"; s = 'Otuz iki mesel' }) },
  @{ label = 'Cevap Ver'; items = @(
    @{ href = 'islama-cevap.html'; t = "İslam$($Apos)a Cevap"; s = 'İslam, kendi kaynaklarıyla' },
    @{ href = 'ateizme-cevap.html'; t = 'Ateizme Cevap'; s = 'Akıl ve kanıtla Tanrı' },
    @{ href = 'yahudilere-cagri.html'; t = 'Yahudilere Çağrı'; s = "Tanah$($Apos)ın sözleriyle Mesih" }) },
  @{ label = 'Dua Et'; items = @(
    @{ href = 'kutsal-ayin.html'; t = 'Kutsal Ayin'; s = 'Ayinin sırası' },
    @{ href = 'tesbih-duasi.html'; t = 'Tesbih Duası'; s = 'Dualar ve gizemler' },
    @{ href = 'ekler.html'; t = 'Sık Kullanılan Dualar'; s = 'Günlük dualar ve formüller' },
    @{ href = 'gunah-cikarma.html'; t = 'Günah Çıkarma'; s = 'Nasıl işler, adım adım' }) },
  @{ label = 'Keşfet'; items = @(
    @{ href = 'azizler.html'; t = 'Azizler'; s = 'Yılın her günü için bir aziz' },
    @{ href = 'mucizeler.html'; t = 'Mucizeler'; s = 'Görünmeler, kalıntılar, mucizeler' },
    @{ href = 'topraklarimizda-hristiyanlik.html'; t = 'Topraklarımızda Hristiyanlık'; s = "Pavlus$($Apos)tan İznik$($Apos)e" },
    @{ href = 'dogu-katolik-kiliseleri.html'; t = 'Doğu Katolik Kiliseleri'; s = 'Bir Kilise, birçok gelenek' },
    @{ href = 'kilise-tarihi.html'; t = "Kilise$($Apos)nin Tarihi"; s = 'Havarilerden bugüne' },
    @{ href = 'kiliseler.html'; t = 'Kilise Bul'; s = "Türkiye$($Apos)de kiliseler" }) },
  @{ label = 'Site'; items = @(
    @{ href = 'iletisim.html'; t = 'İletişim'; s = 'Bize ulaşın' },
    @{ href = 'erisilebilirlik.html'; t = 'Erişilebilirlik'; s = 'Herkes için okunur bir site'; ico = $IcoA11yPerson },
    @{ href = 'gizlilik.html'; t = 'Gizlilik Politikası'; s = 'Hangi veri, nasıl korunur'; ico = $IcoShield },
    @{ href = 'kaynaklar-ve-telif.html'; t = 'Kaynaklar ve Telif'; s = 'Metinler, tablolar, lisanslar'; ico = $IcoBook }) }
)
function Ns-Item($it, [string]$current, [string]$cls = 'ns-item') {
  $ico = if ($it.ico) { $it.ico } elseif ($NavIcons[$it.href]) { $NavIcons[$it.href] } else { $SmallCross }
  $sHtml = if ($it.s) { "<span class=`"ns-s`">$($it.s)</span>" } else { '' }
  return "<a class=`"$cls`" href=`"$($it.href)`"$(Cur $it.href $current)><span class=`"ns-ico`">$ico</span><span class=`"ns-body`"><span class=`"ns-t`">$($it.t)</span>$sHtml</span></a>"
}
function Nav-Sheet([string]$current) {
  $i = 0
  return (($SheetNav | ForEach-Object {
    $links = ($_.items | ForEach-Object {
      Ns-Item $_ $current
    }) -join ''
    $delay = ([double]$i * 0.04).ToString([Globalization.CultureInfo]::InvariantCulture); $i++
    "      <div class=`"ns-group`" style=`"animation-delay:$($delay)s`"><p class=`"ns-label`">$($_.label)</p>$links</div>"
  }) -join "`n")
}
# ------------------------------------------------------------------ phones: apps and app screens
# The church icon of the home screen's Dua Et app
$TbSvg = { param($d, $extra = '') "<svg viewBox=`"0 0 24 24`" aria-hidden=`"true`" fill=`"none`" stroke=`"currentColor`" stroke-width=`"1.7`" stroke-linecap=`"round`" stroke-linejoin=`"round`"$extra>$d</svg>" }
$TbChurch = & $TbSvg '<path d="M12 2.4v4.2M10.1 4.3h3.8"/><path d="M5.6 21v-9.3L12 6.9l6.4 4.8V21"/><path d="M3.4 21h17.2"/><path d="M10.1 21v-4a1.9 1.9 0 0 1 3.8 0v4"/>'
# The home screen app each page belongs to (Öğren, Dua Et, Keşfet): its colour on phones, set as
# data-app on the page's body by Write-Page; the home page's own lists follow the same grouping.
$AppOf = @{}
foreach ($f in @('neden-katoligiz.html', 'katekizm.html', 'kutsal-kitap.html', 'sss.html', 'sozluk.html', 'katolik-sureci.html', 'meseller.html',
                 'motu-proprio.html', 'giris.html', 'iman-ikrari.html', 'kutsal-sirlar.html', 'mesihte-yasam.html', 'hristiyan-duasi.html')) { $AppOf[$f] = 'ogren' }
foreach ($f in @('kutsal-ayin.html', 'tesbih-duasi.html', 'tesbih-tarihi.html', 'ekler.html', 'gunah-cikarma.html')) { $AppOf[$f] = 'dua' }
$AppOf['islama-cevap.html'] = 'tartis'
$AppOf['ateizme-cevap.html'] = 'tartis'
$AppOf['yahudilere-cagri.html'] = 'tartis'
foreach ($f in @('azizler.html', 'mucizeler.html', 'topraklarimizda-hristiyanlik.html', 'dogu-katolik-kiliseleri.html', 'kilise-tarihi.html', 'kiliseler.html')) { $AppOf[$f] = 'kesfet' }
foreach ($gs in $GreatSaints.saints) { $AppOf["$($gs.id).html"] = 'kesfet' }

# ---- Phones: every page but the home screen is shown as an app screen (script.js, initAppView).
# All of the page's text stays in its HTML, as on a computer; the phone shows it one level at a
# time. The bar at the top leads back to where the page belongs: its app on the home screen, or
# the page it is part of.
$AppNames = @{ ogren = 'Öğren'; tartis = 'Cevap Ver'; dua = 'Dua Et'; kesfet = 'Keşfet' }
$KatekizmSub = @('motu-proprio.html', 'giris.html', 'iman-ikrari.html', 'kutsal-sirlar.html', 'mesihte-yasam.html', 'hristiyan-duasi.html')
function Av-Parent([string]$trFile) {
  if ($trFile -like 'kilise/*' -or $trFile -like 'kiliseler-*.html') { return @{ href = 'kiliseler.html'; t = 'Kilise Bul' } }
  if ($KatekizmSub -contains $trFile) { return @{ href = 'katekizm.html'; t = 'Katekizm' } }
  if ($trFile -eq 'tesbih-tarihi.html') { return @{ href = 'tesbih-duasi.html'; t = 'Tesbih Duası' } }
  if ($GreatSaints.saints | Where-Object { "$($_.id).html" -eq $trFile }) { return @{ href = 'azizler.html#buyuk-azizler'; t = 'Azizler' } }
  $app = $AppOf[$trFile]
  if ($app) { return @{ href = "index.html#app-$app"; t = $AppNames[$app] } }
  return @{ href = 'index.html'; t = 'Ana Sayfa' }
}
$IcoAvBack = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>'
function Av-Nav([string]$trFile) {
  $p = Av-Parent $trFile
  $navL = TA 'aria-label' 'Sayfa gezintisi'
  $setL = TA 'aria-label' 'Ayarlar: erişilebilirlik'
  $thL = TA 'aria-label' 'Koyu temaya geç'
  # The Katekizm's own pages: a magnifier that opens into a search field across the bar
  $find = ''; $findBar = ''
  if (($KatekizmSub + @('ekler.html')) -contains $trFile) {
    $find = "<button type=`"button`" class=`"av-find`" $(TA 'aria-label' "Katekizm$($Apos)de ara") aria-expanded=`"false`" aria-controls=`"av-findbar`">$IcoSearch</button>"
    $findBar = "<div class=`"av-findbar`" id=`"av-findbar`" hidden>$(Search-Form 'av-find-form' 'q-av' "Katekizm$($Apos)de ara: Türkçe, İngilizce ya da numara")</div>"
  }
  return "<nav class=`"av-nav`" $navL><a class=`"av-back`" href=`"$($p.href)`" data-av-back>$IcoAvBack<span data-av-back-label>$($p.t)</span></a>" +
    "<span class=`"av-title`" aria-hidden=`"true`"></span><span class=`"av-tools`">$find<button type=`"button`" class=`"theme-toggle av-theme`" role=`"switch`" aria-checked=`"false`" $thL>$IcoSun$IcoMoon</button>" +
    "<button type=`"button`" class=`"av-gear`" $setL aria-haspopup=`"dialog`" aria-controls=`"settings-panel`">$IcoGear</button>" +
    "<a class=`"av-close`" href=`"index.html`" $(TA 'aria-label' 'Kapat: ana ekrana dön')>$IcoClose</a></span>$findBar</nav>"
}
$MassIcons = @{
  gather   = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V11a7 7 0 0 1 14 0v10"/><path d="M4 21h16"/><circle cx="12" cy="9" r="1" fill="currentColor" stroke="none"/></svg>'
  book     = $IcoBook
  gifts    = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.4" cy="8" r="3.3"/><path d="M14.6 5h5"/><path d="M15.2 5c0 3.4 1 5.8 3.4 5.8s3.4-2.4 3.4-5.8" transform="translate(-1 0)"/><path d="M18.1 10.8V19"/><path d="M15 19h6.2"/></svg>'
  chalice  = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5h10"/><path d="M7.6 5c0 4.4 1.3 7.6 4.4 7.6s4.4-3.2 4.4-7.6"/><path d="M12 12.6V19"/><path d="M8 19h8"/><path d="M4.6 3.4 6.4 5M19.4 3.4 17.6 5"/></svg>'
  host     = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14c2.4 3 5.6 4.4 8 4.4s5.6-1.4 8-4.4"/><circle cx="12" cy="7.6" r="3.4"/><path d="M12 5.6v.01M10.2 8.3h3.6"/></svg>'
  blessing = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6.5 6.5 5 5M19 5l-1.5 1.5M6.5 17.5 5 19M19 19l-1.5-1.5"/><circle cx="12" cy="12" r="3.4"/></svg>'
}
$IcoGear = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.11 4.95 L10.50 2.52 L13.50 2.52 L13.89 4.95 A7.3 7.3 0 0 1 15.65 5.68 L17.64 4.23 L19.77 6.36 L18.32 8.35 A7.3 7.3 0 0 1 19.05 10.11 L21.48 10.50 L21.48 13.50 L19.05 13.89 A7.3 7.3 0 0 1 18.32 15.65 L19.77 17.64 L17.64 19.77 L15.65 18.32 A7.3 7.3 0 0 1 13.89 19.05 L13.50 21.48 L10.50 21.48 L10.11 19.05 A7.3 7.3 0 0 1 8.35 18.32 L6.36 19.77 L4.23 17.64 L5.68 15.65 A7.3 7.3 0 0 1 4.95 13.89 L2.52 13.50 L2.52 10.50 L4.95 10.11 A7.3 7.3 0 0 1 5.68 8.35 L4.23 6.36 L6.36 4.23 L8.35 5.68 A7.3 7.3 0 0 1 10.11 4.95Z"/><circle cx="12" cy="12" r="3"/></svg>'

# ---------------------------------------------------------------- accessibility widget icons
$IcoWheelchair = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.2" cy="5" r="1.5" fill="currentColor" stroke="none"/><path d="M11.4 8v5.2l4.4 4.4"/><path d="M11.4 13.2h5"/><path d="M7.8 13.2a5 5 0 1 0 4.9 6"/></svg>'
$IcoEyeOff = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 3.5l17 17"/><path d="M10.6 5.4A10.6 10.6 0 0 1 12 5.3c5 0 8.7 3.4 10 6.7-.5 1.3-1.4 2.7-2.6 3.9M6.6 6.6C4.6 8 3 9.9 2 12c1.3 3.3 5 6.7 10 6.7 1.4 0 2.7-.3 3.9-.7"/><path d="M9.9 10a3 3 0 0 0 4.2 4.2"/></svg>'
$IcoDroplet = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5c3 4 6 7.4 6 10.8a6 6 0 0 1-12 0c0-3.4 3-6.8 6-10.8Z"/></svg>'
$IcoBookOpen = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.6C10.6 5.4 8.6 4.8 6 4.8H3.6v13.4H6c2.6 0 4.6.6 6 1.8 1.4-1.2 3.4-1.8 6-1.8h2.4V4.8H18c-2.6 0-4.6.6-6 1.8z"/><path d="M12 6.6v13.4"/></svg>'
$IcoSpeaker = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.4L12 6v12l-4.6-3.5H4z"/><path d="M16 9.2a4 4 0 0 1 0 5.6M18.6 6.8a7.8 7.8 0 0 1 0 10.4"/></svg>'
$IcoContrast = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9.2"/><path d="M12 2.8a9.2 9.2 0 0 1 0 18.4Z" fill="currentColor" stroke="none"/></svg>'
$IcoSpacing = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M18 4v16"/><path d="M9 12h6M9.4 9.6 7 12l2.4 2.4M14.6 9.6 17 12l-2.4 2.4"/></svg>'
$IcoLink = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 14.5 14.5 9.5"/><path d="M11 7l1.3-1.3a3.5 3.5 0 0 1 4.9 4.9L15.9 12"/><path d="M13 17l-1.3 1.3a3.5 3.5 0 0 1-4.9-4.9L8.1 12"/></svg>'
$IcoCursor = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M6 3.5 18 13l-5 .8 2.6 5.3-2 1-2.6-5.3L7.5 18Z"/></svg>'
$IcoRefresh = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M4 20v-4.5h4.5"/></svg>'
$IcoPlay = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.2"/><path d="M10.2 8.7v6.6l5.3-3.3z" fill="currentColor" stroke="none"/></svg>'
# Settings panel, opened by the gear beside the logo: accessibility
# profile presets + individual toggles, state kept in localStorage (see script.js), CSS driven
# entirely by data-a11y-* attributes on <html> so it never touches position:fixed elements via
# `filter` (which would break their containing block). Defined here (before the first
# Write-Page call) and included on every page via Write-Page.
$A11yWidgetHtml = @"
<div class="a11y-panel glass" id="settings-panel" role="dialog" aria-modal="false" aria-labelledby="settings-title" hidden>
  <div class="a11y-head"><p class="a11y-title" id="settings-title">$IcoGear Ayarlar</p><button type="button" class="a11y-close icon-btn" $(TA 'aria-label' 'Kapat')>$IcoClose</button></div>
  <div class="a11y-body">
    <p class="a11y-group-label">Erişilebilirlik Profilleri</p>
    <div class="a11y-profiles">
      <button type="button" class="a11y-profile" data-a11y-profile="motor" aria-pressed="false">$IcoWheelchair<span>Hareket Kısıtlılığı</span></button>
      <button type="button" class="a11y-profile" data-a11y-profile="blind" aria-pressed="false">$IcoEyeOff<span>Görme Engelli</span></button>
      <button type="button" class="a11y-profile" data-a11y-profile="colorblind" aria-pressed="false">$IcoDroplet<span>Renk Körlüğü</span></button>
      <button type="button" class="a11y-profile" data-a11y-profile="dyslexia" aria-pressed="false">$IcoBookOpen<span>Disleksi</span></button>
    </div>
    <p class="a11y-group-label">Erişilebilirlik Ayarları</p>
    <div class="a11y-toggles">
      <button type="button" class="a11y-tile" data-a11y-toggle="reader" aria-pressed="false">$IcoSpeaker<span>Ekran Okuyucu</span></button>
      <button type="button" class="a11y-tile" data-a11y-toggle="contrast" aria-pressed="false">$IcoContrast<span>Kontrast Artır</span></button>
      <button type="button" class="a11y-tile" data-a11y-toggle="saturation" aria-pressed="false">$IcoDroplet<span>Doygunluğu Azalt</span></button>
      <button type="button" class="a11y-tile" data-a11y-toggle="bigtext" aria-pressed="false">$IcoTextSize<span>Büyük Yazı</span></button>
      <button type="button" class="a11y-tile" data-a11y-toggle="spacing" aria-pressed="false">$IcoSpacing<span>Harf Aralığı</span></button>
      <button type="button" class="a11y-tile" data-a11y-toggle="links" aria-pressed="false">$IcoLink<span>Bağlantıları Vurgula</span></button>
      <button type="button" class="a11y-tile" data-a11y-toggle="dyslexia" aria-pressed="false">$IcoBookOpen<span>Disleksi Dostu Yazı</span></button>
      <button type="button" class="a11y-tile" data-a11y-toggle="cursor" aria-pressed="false">$IcoCursor<span>Büyük İmleç</span></button>
    </div>
    <button type="button" class="a11y-reset">$IcoRefresh Tüm Ayarları Sıfırla</button>
    <p class="a11y-note">Ekran Okuyucu, tarayıcınızın konuşma sentezini kullanarak üzerine geldiğiniz metni sesli okur; gerçek bir ekran okuyucunun (VoiceOver, NVDA, TalkBack vb.) yerini tutmaz, sitenin kendisi zaten onlarla uyumludur.</p>
  </div>
</div>
"@


# The TR | EN switch: a small pill that floats in the corner of every page, over the text, so the
# reader can flip between the two languages at any point of a long page (script.js, initLang)
# The inline <head> script, around the phone-view flag ($avJs): the language (every page says its
# own, data-url-lang), the theme and the reading settings, all before the first paint.
$HeadJs = 'document.documentElement.classList.add(''js'');'
$HeadJs2 = '(function(H){var T=null,d=new Date(),L=H.getAttribute(''data-url-lang'');if(L===''en''){H.classList.add(''lang-en'');H.lang=''en''}try{var c=JSON.parse(localStorage.getItem(''kd-theme-choice'')||''null'');if(c&&c.until>d.getTime())T=c.t}catch(e){}if(!T){var u=null;try{u=JSON.parse(localStorage.getItem(''kd-sun'')||''null'')}catch(e){}var m=d.getHours()*60+d.getMinutes();T=m>=(u?u.r:420)&&m<(u?u.s:1140)?''light'':''dark''}H.setAttribute(''data-theme'',T);if(T===''light''){var tc=document.querySelector(''meta[name=theme-color]'');if(tc)tc.setAttribute(''content'',''#f7f2e8'')}})(document.documentElement);try{var fs=localStorage.getItem(''kkio-fontsize'');if(fs===''1''||fs===''2'')document.documentElement.setAttribute(''data-fontsize'',fs);var a11y=JSON.parse(localStorage.getItem(''kkio-a11y'')||''{}'');[''contrast'',''saturation'',''spacing'',''links'',''dyslexia'',''cursor''].forEach(function(k){if(a11y[k])document.documentElement.setAttribute(''data-a11y-''+k,''1'')})}catch(e){}'
function Search-Form([string]$cls, [string]$id, [string]$placeholder) {
  $action = 'katekizm.html'
  $label = "Katekizm$($Apos)de ara (Türkçe veya İngilizce, ya da soru numarası)"
  return "<form class=`"search $cls`" role=`"search`" data-search action=`"$action`"><div class=`"search-field`">$IcoSearch" +
    "<label class=`"visually-hidden`" for=`"$id`">$label</label>" +
    "<input id=`"$id`" type=`"search`" name=`"q`" $(TA 'placeholder' $placeholder) autocomplete=`"off`" enterkeyhint=`"search`"></div>" +
    "<div class=`"search-results`" hidden></div></form>"
}
# Desktop (980px and up): the four groups of the phone's home screen as the bar's own menus,
# each opening a panel of its pages; a few pages open a further list beside it (the Katekizm's
# parts, the Rosary's two pages, the saints). Below 980px the hamburger's overlay takes over.
$DnSubs = @{
  'katekizm.html' = $KatekizmNav
  'tesbih-duasi.html' = @(
    @{ href = 'tesbih-duasi.html'; t = 'Tesbih Duası Et'; s = 'Boncuk boncuk, birlikte dua edin' },
    @{ href = 'tesbih-tarihi.html'; t = 'Tesbihin Tarihi'; s = "İncil$($Apos)den Fatima$($Apos)ya" })
  'azizler.html' = @(
    @{ href = 'azizler.html'; t = 'Azizler Takvimi'; s = 'Yılın her günü için bir aziz' },
    @{ href = 'azizler.html#buyuk-azizler'; t = 'En Çok Bilinen 20 Aziz'; s = 'Hayat hikâyeleri'; saints = $true })
}
$IcoChevDown = '<svg class="dn-chev" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
$IcoChevRight = '<svg class="dn-more" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>'
function Dn-Link($it, [string]$current, [string]$cls = 'dn-a', [string]$more = '') {
  $ico = if ($it.ico) { $it.ico } elseif ($NavIcons[$it.href]) { $NavIcons[$it.href] } else { '' }
  $icoHtml = if ($ico) { "<span class=`"dn-ico`">$ico</span>" } else { '' }
  $sHtml = if ($it.s) { "<span class=`"dn-s`">$($it.s)</span>" } else { '' }
  return "<a class=`"$cls`" href=`"$($it.href)`"$(Cur $it.href $current)>$icoHtml<span class=`"dn-body`"><span class=`"dn-t`">$($it.t)</span>$sHtml</span>$more</a>"
}
function Desk-Nav([string]$current) {
  $ids = @('ogren', 'tartis', 'dua', 'kesfet'); $n = 0
  $curApp = $AppOf[$current]
  return (($SheetNav | Select-Object -First 4 | ForEach-Object {
    $grp = $_; $id = $ids[$n]; $n++
    $items = ($grp.items | ForEach-Object {
      $it = $_; $sub = $DnSubs[$it.href]
      if (-not $sub) { return "<li class=`"dn-item`">$(Dn-Link $it $current)</li>" }
      $subLis = ($sub | ForEach-Object {
        $si = $_
        if (-not $si.saints) { return "<li>$(Dn-Link $si $current 'dn-a dn-sa')</li>" }
        $gs = ($GreatSaints.saints | ForEach-Object { "<li><a class=`"dn-gs`" href=`"$($_.id).html`"$(Cur "$($_.id).html" $current)>$($_.name)</a></li>" }) -join ''
        "<li class=`"dn-item has-sub`">$(Dn-Link $si $current 'dn-a dn-sa' $IcoChevRight)<div class=`"dn-sub dn-sub2`"><ul class=`"dn-gs-list`">$gs</ul></div></li>"
      }) -join ''
      "<li class=`"dn-item has-sub`">$(Dn-Link $it $current 'dn-a' $IcoChevRight)<div class=`"dn-sub`"><ul class=`"dn-list`">$subLis</ul></div></li>"
    }) -join ''
    $sec = if ($curApp -eq $id) { ' is-section' } else { '' }
    "<li class=`"dn-top`"><button type=`"button`" class=`"nav-link dn-btn$sec`" aria-expanded=`"false`" aria-controls=`"dn-$id`">$($grp.label)$IcoChevDown</button>" +
      "<div class=`"dn-panel glass`" id=`"dn-$id`"><ul class=`"dn-list`">$items</ul></div></li>"
  }) -join '') + (Dn-Contact $current)
}
# The last menu, İletişim: the contact page first, then the pages about the site itself under a small heading
$DnSitePages = @(
  @{ href = 'erisilebilirlik.html'; t = 'Erişilebilirlik'; s = 'Herkes için okunur bir site'; ico = $IcoA11yPerson },
  @{ href = 'gizlilik.html'; t = 'Gizlilik Politikası'; s = 'Hangi veri, nasıl korunur'; ico = $IcoShield },
  @{ href = 'kaynaklar-ve-telif.html'; t = 'Kaynaklar ve Telif'; s = 'Metinler ve izinler'; ico = $IcoBook })
function Dn-Contact([string]$current) {
  $contact = @{ href = 'iletisim.html'; t = 'Bize Ulaşın'; s = 'Sorularınızı bize yazın' }
  $site = ($DnSitePages | ForEach-Object { "<li class=`"dn-item`">$(Dn-Link $_ $current)</li>" }) -join ''
  $sec = if ((@('iletisim.html') + @($DnSitePages | ForEach-Object { $_.href })) -contains $current) { ' is-section' } else { '' }
  "<li class=`"dn-top`"><button type=`"button`" class=`"nav-link dn-btn$sec`" aria-expanded=`"false`" aria-controls=`"dn-iletisim`">İletişim$IcoChevDown</button>" +
    "<div class=`"dn-panel glass`" id=`"dn-iletisim`"><ul class=`"dn-list`"><li class=`"dn-item`">$(Dn-Link $contact $current)</li>" +
    "<li class=`"dn-head`" role=`"presentation`">Site Hakkında</li>$site</ul></div></li>"
}
function Cur([string]$href, [string]$current) { if ($href -eq $current) { return ' aria-current="page"' }; return '' }
function Header-Html([string]$current) {
  $coreMenu = Desk-Nav $current
  return @"
$Sprite
<a class="skip-link" href="#main">İçeriğe geç</a>
<header class="site-header">
  <div class="wrap">
    <div class="header-row">
      <div class="brand-group">
        <a class="brand" href="index.html"$(Cur 'index.html' $current)>$BrandMark<span class="brand-rule" aria-hidden="true"></span>$BrandName</a>
        <button type="button" class="settings-btn" $(TA 'aria-label' 'Ayarlar: erişilebilirlik') aria-haspopup="dialog" aria-expanded="false" aria-controls="settings-panel">$IcoGear</button>
      </div>
      <nav class="mainnav dnav" $(TA 'aria-label' 'Ana menü')>
        <ul>$coreMenu</ul>
      </nav>
      <button type="button" class="icon-btn menu-toggle" $(TA 'aria-label' 'Menü') aria-expanded="false" aria-controls="navsheet" $(TA 'data-tooltip' 'Tüm Menü')>$IcoMenuToggle</button>
      <div class="header-tools">
        <button type="button" class="theme-toggle" role="switch" aria-checked="false" $(TA 'aria-label' 'Koyu temaya geç')>$IcoSun$IcoMoon<span class="knob" aria-hidden="true"></span></button>
      </div>
    </div>
  </div>
</header>
<div class="navsheet" id="navsheet" hidden>
  <div class="navsheet-panel glass" role="dialog" aria-modal="true" $(TA 'aria-label' 'Menü')>
    <div class="ns-head">
      <p class="ns-date"><span data-ns-date></span> <time class="ns-time" data-ns-time>--:--:--</time></p>
    </div>
    <nav class="ns-nav" $(TA 'aria-label' 'Menü')>
$(Nav-Sheet $current)
    </nav>
  </div>
</div>
"@
}
# The footer's site map follows the header's menus (Öğren, Cevap Ver, Dua Et, Keşfet, Site), with the
# Katekizm's parts as a column of their own and the Rosary's history beside the Rosary
function Foot-Group([string]$label, $items) {
  $lis = ($items | ForEach-Object { "<li><a href=`"$($_.href)`">$($_.t)</a></li>" }) -join ''
  return "<p class=`"foot-label`">$($label)</p><ul>$lis</ul>"
}
$fgLearn = $SheetNav[0]; $fgDebate = $SheetNav[1]; $fgPray = $SheetNav[2]; $fgExplore = $SheetNav[3]; $fgSite = $SheetNav[4]
$footLearn = @($fgLearn.items | Where-Object { $_.href -ne 'katekizm.html' })
$footCat = @(@{ href = 'katekizm.html'; t = 'Genel Bakış' }) + @($TextNav | Where-Object { $_.href -ne 'ekler.html' })
$footPray = foreach ($it in $fgPray.items) { $it; if ($it.href -eq 'tesbih-duasi.html') { @{ href = 'tesbih-tarihi.html'; t = 'Tesbihin Tarihi' } } }
$footSite = @($fgSite.items)
$FootCols = "      <div class=`"foot-col`">$(Foot-Group $fgLearn.label $footLearn)</div>`n" +
  "      <div class=`"foot-col`">$(Foot-Group 'Katekizm' $footCat)</div>`n" +
  "      <div class=`"foot-col`">$(Foot-Group $fgDebate.label $fgDebate.items)$(Foot-Group $fgPray.label $footPray)</div>`n" +
  "      <div class=`"foot-col`">$(Foot-Group $fgExplore.label $fgExplore.items)$(Foot-Group $fgSite.label $footSite)</div>"

# İletişim, Erişilebilirlik and Gizlilik also open over the page from the footer, like
# "Kaynaklar ve telif" (their own pages stay, for search engines and links from elsewhere)
function Foot-Dialog([string]$id, [string]$title, [string]$inner, [string]$src = '') {
  # The longer texts (Erişilebilirlik, Gizlilik) aren't repeated in every page: the popup fetches
  # them from their own page the first time it opens (the link is the fallback)
  $box = if ($src) { "<div class=`"info-inner`" data-lazy><p><a href=`"$src`" data-no-dlg>Sayfayı aç</a></p></div>" } else { "<div class=`"info-inner`">$inner</div>" }
  return "<dialog class=`"sources-dialog`" id=`"$id`" aria-labelledby=`"$id-t`"><button type=`"button`" class=`"sources-close`" $(TA 'aria-label' 'Kapat')>$IcoClose</button>" +
    "<h2 class=`"sources-title`" id=`"$id-t`">$title</h2>$box</dialog>"
}
# İletişim: no address is published anywhere; the form posts to a Cloudflare Worker on
# /api/contact (cloudflare/contact-worker.js), which checks it with Turnstile and emails it on.
# $TurnstileSiteKey is the widget's public site key (Cloudflare > Turnstile); the one below is
# katolikdunyasi.com's own key.
$TurnstileSiteKey = '0x4AAAAAAFLZFP4-Scpg6ov1'
$ContactIntro = "<p>Bir hata gördüyseniz, bir konu önermek ya da merhaba demek istiyorsanız aşağıdaki formdan yazın.</p>"
$ContactOutro = "<p>Gelen her mesajı bizzat okuyorum. Yoğunluğa bağlı olarak yanıt vermem biraz zaman alabilir; fakat paylaştığınız tüm geri bildirimler için şimdiden içtenlikle teşekkür ederim.</p>"
$FooterHtml = @"
<footer class="site-footer">
  <div class="wrap foot-grid">
    <div class="foot-about">
      <p class="foot-brand"><span class="foot-fish" aria-hidden="true">$IchthysSvg</span>$BrandName</p>
      <p class="foot-tag">$($SiteTag)</p>
      <p class="foot-desc">$($fm['about'])</p>
      <p class="foot-legal"><strong>Yasal Uyarı</strong> Katolik Dünyası, Kanon Hukuku$($Apos)nun 216. Maddesinin ilk cümlesine uygun olarak yürütülen bağımsız ve özel bir girişimdir. Bu web sitesi, hiçbir kilise makamının veya Katolik Kilisesi$($Apos)nin resmi bir platformu değildir; resmi bir onay veya kurumsal bir bağlılık taşımamaktadır.</p>
      <p class="foot-copy foot-src"><a class="foot-sources" href="kaynaklar-ve-telif.html" data-dialog="sources-dialog">$($fm['title'])</a><a class="foot-contact" href="iletisim.html">İletişim</a><a class="foot-contact foot-extra" href="erisilebilirlik.html" data-dialog="dlg-erisilebilirlik">Erişilebilirlik</a><a class="foot-contact foot-extra" href="gizlilik.html" data-dialog="dlg-gizlilik">Gizlilik</a></p>
    </div>
    <nav class="foot-sitemap" $(TA 'aria-label' 'Site haritası')>
$FootCols
    </nav>
  </div>
</footer>
$(Foot-Dialog 'dlg-erisilebilirlik' ($ErMeta.title) '' 'erisilebilirlik.html')
$(Foot-Dialog 'dlg-gizlilik' ($GzMeta.title) '' 'gizlilik.html')
<dialog class="sources-dialog" id="sources-dialog" aria-labelledby="sources-title">
  <button type="button" class="sources-close" $(TA 'aria-label' 'Kapat')>$IcoClose</button>
  <h2 class="sources-title" id="sources-title">$($fm['title'])</h2>
  <div class="info-inner">$($InfoHtml)</div>
</dialog>
"@
# ---- Links between the site's own pages. The first mention of a saint, a miracle or a topic that
# has a page of its own becomes a link to it, once per page, in running text only
# (paragraphs and list items; never in headings, links, buttons, prayers or quotations' sources).
# Each rule: the page it leads to, then the pattern (.NET regex), then pages to leave it off.
$XrefRules = @(
  @('padre-pio.html', 'Padre Pio'),
  @('aziz-augustinus.html', "(?:Hipponlu (?:Aziz )?|Aziz )Augustinus"),
  @('aziz-thomas-aquinas.html', 'Thomas Aquinas'),
  @('assisili-aziz-francis.html', 'Assisili (?:Aziz )?Fransuva'),
  @('sienali-aziz-catharina.html', "Sienal$([char]0x131) (?:Azize )?Katerina"),
  @('avilali-aziz-teresa.html', "Avilal$([char]0x131) (?:Azize )?Teresa"),
  @('lisieuxlu-kucuk-teresa.html', "Lisieux[’']l$([char]0xfc) (?:Azize )?(?:K$([char]0xfc)$([char]0xe7)$([char]0xfc)k )?Teresa"),
  @('aziz-ignatius-loyola.html', "Loyolal$([char]0x131) (?:Aziz )?$([char]0x130)gnatius"),
  @('aziz-benedictus.html', "Nursial$([char]0x131) (?:Aziz )?Benedictus"),
  @('aziz-patrick.html', 'Aziz Patrick'),
  @('padovali-aziz-antonius.html', "Padoval$([char]0x131) (?:Aziz )?Antuan"),
  @('kalkutali-aziz-teresa.html', "Kalk$([char]0xfc)tal$([char]0x131) (?:Rahibe |Azize )?Teresa|Rahibe Teresa"),
  @('aziz-ii-yuhanna-pavlus.html', "II\. Ioannes Paulus"),
  @('aziz-hieronymus.html', 'Aziz Hieronymus'),
  @('aziz-yusuf.html', 'Aziz Yusuf'),
  @('havari-petrus.html', 'Havari Petrus'),
  @('havari-pavlus.html', 'Havari Pavlus'),
  @('vaftizci-yahya.html', 'Vaftizci Yahya'),
  @('havari-yuhanna.html', 'Havari Yuhanna'),
  @('mucizeler.html#fatima', "Fatima(?! Duas$([char]0x131))", 'islama-cevap.html'),
  @('mucizeler.html#lourdes', 'Lourdes'),
  @('mucizeler.html#guadalupe', 'Guadalupe'),
  @('mucizeler.html#zeytun', 'Zeytun'),
  @('mucizeler.html#kefen', 'Torino Kefeni'),
  @('mucizeler.html#lanciano', 'Lanciano'),
  @('mucizeler.html#bolsena', 'Bolsena'),
  @('mucizeler.html#bernadette', 'Bernadette'),
  @('mucizeler.html#vianney', "Jean-Marie Vianney|Ars Curesi"),
  @('tesbih-duasi.html', "[Tt]esbih [Dd]uas$([char]0x131)"),
  @('tesbih-tarihi.html#inebahti', "$([char]0x130)nebaht$([char]0x131)"),
  @('kutsal-ayin.html', "Kutsal Ayin|Pazar Ayini|Ayin(?=[’'])", 'kilise/*'),
  @('gunah-cikarma.html', "[Gg]$([char]0xfc)nah [$([char]0xc7)$([char]0xe7)]$([char]0x131)kar\p{L}*"),
  @('katolik-sureci.html', "Katolik olma(?:k|ya|n$([char]0x131)n)?|Katolik olmak isteyen"),
  @('meseller.html', "[Mm]esel(?:ler|leri|lerinde|leriyle|lerle|i|ini|inde|iyle)?"),
  @('topraklarimizda-hristiyanlik.html#iznik', "$([char]0x130)znik Konsili|Efes Konsili"),
  @('topraklarimizda-hristiyanlik.html#yedi-kilise', "[Yy]edi [Kk]ilise"),
  @('topraklarimizda-hristiyanlik.html#yer-antakya', 'Antakya'),
  @('topraklarimizda-hristiyanlik.html#yer-demre', "Myra|Demre"),
  @('topraklarimizda-hristiyanlik.html#yer-kapadokya', 'Kapadokya'),
  @('sss.html#araf', 'Araf', 'islama-cevap.html'),
  # plain "tesbih" (and its suffixed forms) for the Rosary; off where it also means Muslim prayer beads
  @('tesbih-duasi.html', "[Tt]esbih\p{L}*", 'islama-cevap.html'),
  @('meryem-ana.html', "Meryem Ana(?! Evi)"),
  @('katekizm.html', "(?<!Kilisesi )Katekizm\p{L}*"),
  @('kutsal-kitap.html', "Kutsal Kitap|Kutsal Kitab\p{L}+")
) | ForEach-Object {
  $b = '(?<![\p{L}\d])'; $a = '(?![\p{L}\d])'
  # a fourth item names the pages (wildcards allowed) where the rule stays off
  @{ to = $_[0]; file = ($_[0] -split '#')[0]; rx = [regex]"$b(?:$($_[1]))$a"; off = $(if ($_.Count -gt 2) { $_[2] } else { '' }) }
}
# The official texts (the Compendium and its parts) and the pages that are only lists or forms stay as they are
$XrefSkipPages = @('index.html', 'katekizm.html', 'iman-ikrari.html', 'kutsal-sirlar.html', 'mesihte-yasam.html', 'hristiyan-duasi.html',
  'motu-proprio.html', 'giris.html', 'ekler.html', '404.html', 'gizlilik.html', 'erisilebilirlik.html', 'kaynaklar-ve-telif.html', 'iletisim.html')
$XrefBlockTags = @('p', 'li', 'td')
$XrefSkipTags = @('a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'summary', 'button', 'label', 'select', 'option', 'script', 'style', 'svg', 'nav', 'header', 'footer', 'cite', 'figcaption', 'textarea')
$XrefSkipClass = [regex]'(?:^|\s)(?:verse|rt-[\w-]+|conventions|gloss|ic-tl[\w-]*|crumbs|text-link|faq-ref|th-link|ref-[\w-]+|m-day|label|th-quote)(?:\s|$)'
$XrefVoid = @('br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'wbr', 'col', 'area', 'embed', 'track')
function Link-Xrefs([string]$html, [string]$file) {
  if ($XrefSkipPages -contains $file) { return $html }
  $parts = [regex]::Split($html, '(<[^>]+>)')
  $stack = New-Object Collections.ArrayList   # each: @(tag, isBlock, isSkip)
  $used = @{}
  $sb = [System.Text.StringBuilder]::new()
  foreach ($p in $parts) {
    if ($p.StartsWith('<')) {
      [void]$sb.Append($p)
      if ($p -match '^<!--') { continue }
      if ($p -match '^</([a-zA-Z0-9]+)') {
        $t = $Matches[1].ToLower()
        for ($i = $stack.Count - 1; $i -ge 0; $i--) { if ($stack[$i][0] -eq $t) { $stack.RemoveRange($i, $stack.Count - $i); break } }
        continue
      }
      if ($p -match '^<([a-zA-Z0-9]+)') {
        $t = $Matches[1].ToLower()
        if ($XrefVoid -contains $t -or $p.EndsWith('/>')) { continue }
        $cls = if ($p -match '\sclass="([^"]*)"') { $Matches[1] } else { '' }
        $skip = ($XrefSkipTags -contains $t) -or $XrefSkipClass.IsMatch($cls)
        [void]$stack.Add(@($t, ($XrefBlockTags -contains $t), $skip))
      }
      continue
    }
    if (-not $p.Trim()) { [void]$sb.Append($p); continue }
    $inBlock = $false; $inSkip = $false
    foreach ($e in $stack) { if ($e[1]) { $inBlock = $true }; if ($e[2]) { $inSkip = $true } }
    if (-not $inBlock -or $inSkip) { [void]$sb.Append($p); continue }
    # the earliest mention in this text of a page not linked yet, then the rest after it
    $rest = $p
    while ($rest) {
      $best = $null; $bestRule = $null
      foreach ($r in $XrefRules) {
        if ($r.file -eq $file -or ($r.off -and $file -like $r.off) -or $used.ContainsKey($r.to)) { continue }
        $m = $r.rx.Match($rest)
        if ($m.Success -and ($null -eq $best -or $m.Index -lt $best.Index)) { $best = $m; $bestRule = $r }
      }
      if ($null -eq $best) { [void]$sb.Append($rest); break }
      $used[$bestRule.to] = $true
      [void]$sb.Append($rest.Substring(0, $best.Index)).Append("<a class=`"xref`" href=`"$($bestRule.to)`">$($best.Value)</a>")
      $rest = $rest.Substring($best.Index + $best.Length)
    }
  }
  return $sb.ToString()
}
$ShortTitles = @{
  'kilise/verapokhumin-buyukada.html' = 'Verapokhumin Ermeni Katolik Kilisesi, Büyükada'
}
# The passages a page cites (the a.bref, a.qref and a.hdref links), taken from data/refs-*.js
# and written into the page, so its popups open without loading the whole collection. The keys
# are worked out the way script.js (initRefs) works them out from each link.
$RefData = @{}
foreach ($rf in @(@('bref', 'refs-bible.js', 'REFS_BIBLE'), @('qref', 'refs-quran.js', 'REFS_QURAN'), @('hdref', 'refs-hadith.js', 'REFS_HADITH'))) {
  $raw = [IO.File]::ReadAllText((Join-Path $Root "data/$($rf[1])"))
  $json = $raw.Substring($raw.IndexOf('{')).TrimEnd().TrimEnd(';')
  $RefData[$rf[0]] = @{ name = $rf[2]; data = ($json | ConvertFrom-Json -AsHashtable) }
}
function Embed-Refs([string]$h) {
  $found = @{}
  foreach ($m in [regex]::Matches($h, '<a class="(bref|qref|hdref)"[^>]*?\bhref="https?://[^/"]+/([^"]*)"')) {
    $kind = $m.Groups[1].Value; $rest = [Net.WebUtility]::HtmlDecode($m.Groups[2].Value)
    $key = switch ($kind) {
      'bref' { if ($rest -match '[?&]search=([^&]*)') { ([Uri]::UnescapeDataString($Matches[1].Replace('+', ' ')) -replace '\s*[-–]\s*', '-') } }
      'qref' { $pth = ($rest -split '[?#]')[0]; $i = $pth.IndexOf('/'); if ($i -ge 0) { $pth.Substring(0, $i) + ':' + $pth.Substring($i + 1) } else { $pth } }
      'hdref' { [Uri]::UnescapeDataString(($rest -split '[?#]')[0]) }
    }
    # (a plain assignment: an if-expression would unroll a one-verse list)
    $item = $null
    if ($key) { $item = $RefData[$kind].data[$key] }
    if ($null -eq $item) { continue }
    $n = $RefData[$kind].name
    if (-not $found[$n]) { $found[$n] = [ordered]@{} }
    $found[$n][$key] = $item
  }
  if ($found.Count -eq 0) { return $h }
  $js = (ConvertTo-Json -InputObject $found -Compress -Depth 8).Replace('</', '<\/')
  return $h.Replace('</body>', "<script type=`"application/json`" id=`"kd-refs`">$js</script>`n</body>")
}
function Write-Page {
  param([string]$File, [string]$Title, [string]$Description, [string]$Path, [string]$Body,
        [string[]]$JsonLd = @(), [string]$OgType = 'website',
        [string]$Robots = 'index,follow,max-snippet:-1,max-image-preview:large', [bool]$Canonical = $true, [bool]$RootRelative = $false, [string]$OgImagePath = '', [string]$OgImageAlt = '')
  $Body = Link-Refs $Body
  $Body = Link-Xrefs $Body $File
  $Body = Paint-Head $Body $File
  $Body = Paint-Sections $Body $File
  # Search results show roughly 60 characters of a title; a long page name keeps its words
  # and drops the site-name suffix instead (og:site_name still carries it).
  $suffix = " | $SiteName"
  if ($Title.Length -gt 60 -and $Title.EndsWith($suffix)) { $Title = $Title.Substring(0, $Title.Length - $suffix.Length) }
  # Still too long: a hand-made short form where one exists, else drop the bracketed part
  # (an alternate name, a question range)
  $short = $ShortTitles[$File]
  if ($short -and $Title.Length -gt 60) { $Title = $short }
  if ($Title.Length -gt 60) { $Title = ($Title -replace '\s*\([^)]*\)', '').Trim() }
  $trUrl = "$SiteUrl/$Path"
  # the English edition of the page, where verbumdomini.ca has one (the Katekizm and its parts)
  $enUrl = $VdTwin[$File]
  $hreflang = if ($enUrl) { "<link rel=`"alternate`" hreflang=`"tr`" href=`"$trUrl`">`n<link rel=`"alternate`" hreflang=`"en`" href=`"$enUrl`">`n<link rel=`"alternate`" hreflang=`"x-default`" href=`"$trUrl`">" } else { '' }
  $headerHtml = Header-Html $File
  $footerHtml = $FooterHtml
  # The home screen app a page belongs to (Öğren, Dua Et, Keşfet), for its colour on phones
  $appAttr = if ($AppOf -and $AppOf[$File]) { " data-app=`"$($AppOf[$File])`"" } else { '' }
  # Every page but the home screen becomes an app screen on phones (see Av-Nav); the class is set
  # before the first paint so the page doesn't jump
  $isHome = $File -match '(^|/)index\.html$'
  $avJs = if ($isHome) { '' } else { "if(window.matchMedia&&matchMedia('(max-width: 979px)').matches){document.documentElement.classList.add('av');setTimeout(function(){document.documentElement.classList.add('av-ready')},3000)}" }
  # kiliseler.html is in Turkish and English at once; the language is chosen before the first paint
  # (?lang=, the reader's last choice, or English when none of the browser's languages is Turkish)
  $klJs = if ($File -eq 'kiliseler.html') { "(function(H){var l=null;try{var q=/[?&]lang=(en|tr)/.exec(location.search);l=q?q[1]:localStorage.getItem('kd-kl-lang')}catch(e){}if(l!=='en'&&l!=='tr'){var L=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];l='tr';for(var i=0;i<L.length;i++){if(/^tr/i.test(L[i])){l='tr';break}l='en'}}if(l==='en'){H.classList.add('kl-en-on');H.lang='en'}})(document.documentElement);" } else { '' }
  $avNav = if ($isHome) { '' } else { Av-Nav $File }
  $appAttr += if ($isHome) { '' } else { " data-avp=`"$File`"" }
  # An article (every page but the home page, the Katekizm's, the calendar of saints, the
  # churches, the contact form and the glossary, whose search needs every term there): read as
  # one long page that grows as it is scrolled, with a
  # bar at the top for how far along the reader is (script.js, initArticleFlow)
  $notArticle = $isHome -or ($KatekizmPages -contains $File) -or (@('azizler.html', 'kiliseler.html', 'iletisim.html', '404.html', 'katesizm.html', 'sozluk.html') -contains $File)
  if (-not $notArticle) { $appAttr += ' data-article' }
  $a11yHtml = $A11yWidgetHtml
  # The picture a shared link shows: the page's painting (its 1200 copy when it has one, small
  # enough for every app's preview), else the site's own
  $ogKey = $Tablolar.pages.$File
  if ($ogKey) {
    $oa = $Tablolar.art.$ogKey; $ow = [int]$oa.w; $oh = [int]$oa.h
    $ogImg = "$SiteUrl/assets/art/$ogKey.jpg"
    if ($ow -gt 1200) { $ogImg = "$SiteUrl/assets/art/$ogKey-1200.jpg"; $oh = [int][math]::Round($oh * 1200 / $ow); $ow = 1200 }
    $ogAlt = "$($oa.a) · $($oa.t)"
  } elseif ($OgImagePath) { $ogImg = "$SiteUrl/$OgImagePath"; $ow = 1200; $oh = 630; $ogAlt = $OgImageAlt
  } else { $ogImg = "$SiteUrl/assets/og-image.jpg"; $ow = 1200; $oh = 630; $ogAlt = $SiteName }
  # The home page's largest picture on a phone is the saint card's painting, which script.js
  # would only set once the day's saint is known; the default one is in the page from the start
  # (.hm-card.hm-saint: more specific than the stylesheet's background shorthand, which loads later)
  $homeArt = ''
  if ($isHome) {
    $da = ($SaintArtJson | ConvertFrom-Json).'*'
    # on a phone the largest picture is the date card's painting (Home-Page): its AVIF copies are
    # fetched first, with nothing else at high priority; the saint card is further down
    $hk = '13fligh'; $hw = [int]$Tablolar.art.$hk.w
    $hSet = if ($hw -le 800) { "/assets/art/$hk.avif $($hw)w" } else { "/assets/art/$hk-800.avif 800w$(if ($hw -gt 1200) { ", /assets/art/$hk-1200.avif 1200w" }), /assets/art/$hk.avif $($hw)w" }
    $homeArt = "<link rel=`"preload`" as=`"image`" type=`"image/avif`" href=`"/assets/art/$hk$(if ($hw -gt 800) { '-800' }).avif`" imagesrcset=`"$hSet`" imagesizes=`"50vw`" media=`"(max-width: 979.98px)`" fetchpriority=`"high`">`n" +
      "<link rel=`"preload`" as=`"image`" href=`"assets/art/$da.jpg`" media=`"(min-width: 980px)`">`n" +
      "<style>.hm-card.hm-saint .hm-art{background-image:url(`"assets/art/$da-800.jpg`")}@media (min-width:980px){.hm-card.hm-saint .hm-art{background-image:url(`"assets/art/$da.jpg`")}}</style>`n"
  }
  # Articles carry an image and a publisher, as search engines ask of them
  $JsonLd = @($JsonLd | ForEach-Object {
    if ($_ -match '"@type":"Article"' -and $_ -notmatch '"image"') {
      $pub = if ($_ -notmatch '"publisher"') { '"publisher":{"@type":"Organization","name":' + (JStr $SiteName) + ',"url":"' + $SiteUrl + '/","logo":{"@type":"ImageObject","url":"' + $SiteUrl + '/apple-touch-icon.png"}},' } else { '' }
      $mod = Page-LastMod $File
      $dm = if ($mod -and $_ -notmatch '"dateModified"') { '"dateModified":"' + $mod + '",' } else { '' }
      $_.Replace('"@type":"Article",', '"@type":"Article","image":"' + $ogImg + '",' + $pub + $dm)
    } else { $_ }
  })
  $ldTr = ($JsonLd | ForEach-Object { "<script type=`"application/ld+json`">$_</script>" }) -join "`n"
  $csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"
  if ($File -eq 'iletisim.html') { $csp = $csp.Replace("script-src 'self' 'unsafe-inline'", "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com") + "; frame-src https://challenges.cloudflare.com" }
  $canon = if ($Canonical) { "<link rel=`"canonical`" href=`"$trUrl`">" } else { '' }
  $htmlAttr = " lang=`"tr`" data-url-lang=`"tr`"$(if ($RootRelative) { ' data-root="/"' })"
  $html = @"
<!DOCTYPE html>
<html$htmlAttr>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>$(Attr $Title)</title>
<meta name="description" content="$(Attr $Description)">
<meta name="robots" content="$Robots">
$canon
$hreflang
<meta name="theme-color" content="#16161a">
<meta http-equiv="Content-Security-Policy" content="$csp">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta property="og:type" content="$OgType">
<meta property="og:locale" content="tr_TR">
<meta property="og:site_name" content="$(Attr $SiteName)">
<meta property="og:title" content="$(Attr $Title)">
<meta property="og:description" content="$(Attr $Description)">
<meta property="og:url" content="$trUrl">
<meta property="og:image" content="$ogImg">
<meta property="og:image:width" content="$ow">
<meta property="og:image:height" content="$oh">
<meta property="og:image:alt" content="$(Attr $ogAlt)">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="$(Attr $Title)">
<meta name="twitter:description" content="$(Attr $Description)">
<meta name="twitter:image" content="$ogImg">
<meta name="twitter:image:alt" content="$(Attr $ogAlt)">
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="icon" href="$Favicon" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preload" href="assets/fonts/kd-brand-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/kd-brand-ext.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/inter-ext-a.woff2" as="font" type="font/woff2" crossorigin>
$homeArt<link rel="stylesheet" href="assets/styles.min.css?v=$CssVer">
<script>$HeadJs$($avJs)$($klJs)$HeadJs2</script>
$ldTr
<script src="assets/script.min.js?v=$JsVer" defer></script>
</head>
<body$appAttr>
$headerHtml
$avNav
<main id="main">
$Body
</main>
$footerHtml
$a11yHtml
</body>
</html>
"@
  # 404.html and the church pages are not at the site's top level (or are served at any address),
  # so their links start at the site root rather than at the file
  if ($RootRelative) { $html = [regex]::Replace($html, '(href|src|action)="(?!https?:|#|/|data:|mailto:|tel:)', '$1="/') }
  $html = Pin-InlineScripts (Embed-Refs $html)
  [IO.File]::WriteAllText((Join-Path $Root $File), $html, $Utf8)
  $script:PageInfo += ,@{ File = $File; Path = $Path; Title = $Title; Desc = $Description; Robots = $Robots }
  Write-Host "  + $File"
}
function Breadcrumb-Ld([string]$name, [string]$path, [string]$parentName = '', [string]$parentPath = '') {
  $homeName = 'Ana Sayfa'
  $items = '{"@type":"ListItem","position":1,"name":' + (JStr $homeName) + ',"item":' + (JStr "$SiteUrl/") + '}'
  $pos = 2
  if ($parentName) {
    $items += ',{"@type":"ListItem","position":2,"name":' + (JStr $parentName) + ',"item":' + (JStr "$SiteUrl/$parentPath") + '}'
    $pos = 3
  }
  $items += ',{"@type":"ListItem","position":' + $pos + ',"name":' + (JStr $name) + ',"item":' + (JStr "$SiteUrl/$path") + '}'
  return '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[' + $items + ']}'
}
# The visible breadcrumb trail was removed from every page (the BreadcrumbList structured data
# stays, for search results); both functions are kept so the page code calling them is unchanged.
function Crumbs([string]$here, [string]$parentName = '', [string]$parentPath = '') {
  return ''
}

Write-Host "Building pages ($SiteUrl)..."

# ================================================================== PART PAGES (1–4)
for ($i = 0; $i -lt 4; $i++) {
  $p = $Parts[$i]; $pn = [int]$p.part; $meta = $PartMeta[$pn]
  $items = @($p.items); $ranges = Get-Ranges $items

  $toc = ($items | Where-Object { $_.type -eq 'heading' -and $_.level -ge 2 } | ForEach-Object {
    $title = (Split-Heading $_.tr)[1]
    "<li class=`"t$($_.level)`"><a href=`"#$($_.id)`"><span>$((Inline $title))</span><span class=`"rng`">$(Range-Text $ranges[$_.id])</span></a></li>"
  }) -join ''

  $prev = if ($pn -gt 1) { "<a class=`"prev`" href=`"$($PartMeta[$pn - 1].file)`"><span class=`"label`">← $($PartMeta[$pn - 1].ord)</span><strong>$($Parts[$i - 1].tr)</strong></a>" } else { "<a class=`"prev`" href=`"giris.html`"><span class=`"label`">←</span><strong>Giriş</strong></a>" }
  $next = if ($pn -lt 4) { "<a class=`"next`" href=`"$($PartMeta[$pn + 1].file)`"><span class=`"label`">$($PartMeta[$pn + 1].ord) →</span><strong>$($Parts[$i + 1].tr)</strong></a>" } else { "<a class=`"next`" href=`"ekler.html`"><span class=`"label`">→</span><strong>Ekler</strong></a>" }

  $body = @"
<div class="wrap">
  $(Crumbs $meta.ord 'Katekizm' 'katekizm.html')
  <header class="page-head">
    <div><p class="label">$($meta.ord) · Sorular $($p.from)–$($p.to)</p><h1>$($p.tr)</h1></div>
  </header>
  <div class="reader">
    <nav class="toc" id="toc" $(TA 'aria-label' 'Bu kısmın içindekiler listesi')>
      <div class="toc-inner">
        <button type="button" class="icon-btn toc-close" $(TA 'aria-label' 'İçindekileri kapat')>$IcoClose</button>
        <p class="toc-title label">İçindekiler</p>
        <ol>$toc</ol>
      </div>
    </nav>
    <div class="content" id="content" data-reader>
      <div class="readbar">
        <button type="button" class="icon-btn toc-open" aria-controls="toc" aria-expanded="false" $(TA 'aria-label' 'İçindekiler')>$IcoList</button>
        <p class="current">$($p.tr)</p>
        <button type="button" class="icon-btn" data-chapter="prev" $(TA 'aria-label' 'Önceki başlık')>$IcoPrev</button>
        <button type="button" class="icon-btn" data-chapter="next" $(TA 'aria-label' 'Sonraki başlık')>$IcoNext</button>
        <button type="button" class="icon-btn rb-search-btn" aria-controls="rb-search" aria-expanded="false" $(TA 'aria-label' "Katekizm$($Apos)de ara")>$IcoSearch</button>
        <div class="rb-search" id="rb-search" hidden>$(Search-Form 'rb-form' 'q-part' 'Soru ara: Türkçe, İngilizce ya da numara')</div>
      </div>
$(Render-Items $items)
      <nav class="pager" $(TA 'aria-label' 'Kısımlar arası geçiş')>$prev$next</nav>
    </div>
  </div>
</div>
"@
  Write-Page -File $meta.file -Title "$($meta.ord): $($p.tr) (Sorular $($p.from)–$($p.to)) | $SiteName" -Description $meta.desc `
    -Path $meta.file -Body $body -JsonLd @((Breadcrumb-Ld $p.tr $meta.file 'Katekizm' 'katekizm.html')) -OgType 'article'
}

# ================================================================== HOME (index.html): search + accordion of the four parts
$acc = ($Parts | ForEach-Object {
  $p = $_; $meta = $PartMeta[[int]$p.part]; $items = @($p.items); $ranges = Get-Ranges $items
  $nQ = @($items | Where-Object { $_.type -eq 'qa' }).Count
  $nS = @($items | Where-Object { $_.type -eq 'heading' -and $_.level -eq 2 }).Count
  $sb = New-Object Text.StringBuilder; $open = $false
  # The questions that sit straight under a heading, before its first subheading (question 1,
  # under "Birinci Bölüm", say): listed as rows of their own, so they are not taken for a mere title
  $direct = @{}; $hasSub = @{}; $curH = $null; $stack = New-Object Collections.ArrayList
  foreach ($it in $items) {
    if ($it.type -eq 'heading') {
      while ($stack.Count -and $stack[$stack.Count - 1].level -ge $it.level) { $stack.RemoveAt($stack.Count - 1) }
      if ($stack.Count) { $hasSub[$stack[$stack.Count - 1].id] = $true }
      [void]$stack.Add($it)
      $curH = $it.id; $direct[$curH] = New-Object Collections.ArrayList
    }
    elseif ($it.type -eq 'qa' -and $curH) { [void]$direct[$curH].Add($it) }
  }
  $ownRows = {
    param($h, [string]$cls)
    $qs = @($direct[$h.id])
    # a heading with no subheadings is itself the row for its questions (but a section always lists them)
    if (-not $qs.Count -or ($h.level -gt 2 -and -not $hasSub[$h.id])) { return '' }
    ($qs | ForEach-Object { "<li class=`"$cls lv-own`"><a href=`"$($meta.file)#soru-$($_.n)`"><span><span class=`"c-label`">Soru $($_.n)</span>$((Inline $_.tr.q))</span><span class=`"rng`"></span></a></li>" }) -join ''
  }
  foreach ($h in ($items | Where-Object { $_.type -eq 'heading' -and $_.level -ge 2 -and $_.level -le 4 })) {
    $sp = Split-Heading $h.tr; $href = "$($meta.file)#$($h.id)"; $rt = Range-Text $ranges[$h.id]
    if ($h.level -eq 2) {
      if ($open) { [void]$sb.Append('</ul></div>') }
      [void]$sb.Append("<div class=`"acc-section`"><a href=`"$href`"><span class=`"label`">$($sp[0])</span><span class=`"s-title`">$((Inline $sp[1]))</span></a><ul class=`"acc-list`">")
      [void]$sb.Append((& $ownRows $h 'lv3'))
      $open = $true
    } elseif ($h.level -eq 3) {
      $lab = if ($sp[0]) { "<span class=`"c-label`">$($sp[0])</span>" } else { '' }
      [void]$sb.Append("<li class=`"lv3`"><a href=`"$href`"><span>$lab$((Inline $sp[1]))</span><span class=`"rng`">$rt</span></a></li>")
      [void]$sb.Append((& $ownRows $h 'lv4'))
    } else {
      [void]$sb.Append("<li class=`"lv4`"><a href=`"$href`"><span>$((Inline $sp[1]))</span><span class=`"rng`">$rt</span></a></li>")
    }
  }
  if ($open) { [void]$sb.Append('</ul></div>') }
@"
<details class="part-acc" id="kisim-$($p.part)">
  <summary><span class="roman" aria-hidden="true">$($meta.roman)</span><span><span class="p-title"><span class="visually-hidden">$($meta.ord): </span>$($p.tr)</span><span class="p-meta label">$nQ soru · $nS bölüm · $($p.from)–$($p.to)</span></span>$IcoChevLg</summary>
  <div class="part-body">$($sb.ToString())<a class="btn btn-gold open-part" href="$($meta.file)">Kısmı oku</a></div>
</details>
"@
}) -join "`n"

# ---------------- katekizm.html: the Compendium landing page (search + the four parts)
$katekizmBody = @"
<div class="wrap narrow">
  $(Crumbs 'Katekizm')
  <section class="hero work-hero">
    $Logo
    <h1>$($WorkName)</h1>
    
    <p class="hint">Başlıklarını görmek için bir kısmı açın ya da bir soru arayın.</p>
    $(Search-Form 'hero-search' 'q-katekizm' '598 soruda ara: Türkçe, İngilizce ya da soru numarası')
  </section>
  <div class="parts">
$acc
  </div>
  <div class="ornament">$SmallCross</div>
  <div class="more-texts">
    <a class="text-link" href="motu-proprio.html"><span class="label">Önsöz</span><span class="t-title">Motu Proprio</span><span class="t-sub">XVI. Benediktus, 28 Haziran 2005</span></a>
    <a class="text-link" href="giris.html"><span class="label">Önsöz</span><span class="t-title">Giriş</span><span class="t-sub">Kardinal Joseph Ratzinger, 20 Mart 2005</span></a>
    <a class="text-link" href="ekler.html"><span class="label">Ekler</span><span class="t-title">Dualar ve Formüller</span><span class="t-sub">A. Sık Kullanılan Dualar · B. Katolik Öğretinin Formülleri</span></a>
  </div>
  <p class=`"conventions`">Kutsal Kitap göndermeleri Katolik kanonuna (Deuterokanonik kitaplar dahil) ve kaynak metindeki Katolik ayet numaralandırmasına göre verilmiştir. Türkçede farklı yazılan özel adların İngilizcesi ilk geçtikleri yerde parantez içinde verilir; ör. Petrus <span class=`"gloss`">(Peter)</span>. İsa <span class=`"gloss`">(Jesus)</span> ve Meryem <span class=`"gloss`">(Mary)</span> adları sık geçtiği için yinelenmez. Her sorunun altındaki sayılar, Katolik Kilisesi Katekizmi$($Apos)nin ilgili madde numaralarıdır.</p>
</div>
"@
$bookLd = '{"@context":"https://schema.org","@type":"Book","name":' + (JStr $WorkName) + ',"alternateName":' + (JStr "$SiteNameEn (Türkçe)") +
  ',"inLanguage":"tr","url":' + (JStr "$SiteUrl/katekizm.html") + ',"about":{"@type":"Thing","name":"Katolik Kilisesi"},' +
  '"translationOfWork":{"@type":"Book","name":' + (JStr $SiteNameEn) + ',"inLanguage":"en","datePublished":"2005-06-28","publisher":{"@type":"Organization","name":"Libreria Editrice Vaticana"}},' +
  '"hasPart":[' + (($Parts | ForEach-Object { '{"@type":"Chapter","name":' + (JStr $_.tr) + ',"url":' + (JStr "$SiteUrl/$($PartMeta[[int]$_.part].file)") + '}' }) -join ',') + ']}'
Write-Page -File 'katekizm.html' -Title "$WorkName | $SiteName" `
  -Description "Katolik Kilisesi Katekizmi Özeti$($Apos)nin (Compendium) Türkçe çevirisi: iman, kutsal sırlar, Hristiyan ahlakı ve dua üzerine 598 soru ve yanıt." `
  -Path 'katekizm.html' -Body $katekizmBody -JsonLd @($bookLd, (Breadcrumb-Ld 'Katekizm' 'katekizm.html'))

# ================================================================== ARTICLE PAGES: Motu Proprio, Giriş (Turkish paragraphs)
function Parallel-Paragraphs($list) {
  return (@($list) | ForEach-Object { "<p>$(Inline $_)</p>" }) -join ''
}
function Article-Page([string]$file, [string]$crumb, [string]$label, [string]$h1, [string]$bodyHtml, [string]$desc, [string]$ld, [string]$titleOverride = '') {
  $body = @"
<div class="wrap">
  $(Crumbs $crumb 'Katekizm' 'katekizm.html')
  <article class="article" id="article">
    <header class="page-head center"><p class="label">$($label)</p><h1>$($h1)</h1></header>
    <div class="body">$bodyHtml</div>
  </article>
</div>
"@
  $pageTitle = if ($titleOverride) { $titleOverride } else { $h1 }
  Write-Page -File $file -Title "$pageTitle | $SiteName" -Description $desc -Path $file -Body $body -JsonLd @($ld, (Breadcrumb-Ld $crumb $file 'Katekizm' 'katekizm.html')) -OgType 'article'
}
$mp = $X.motuProprio
$mpBody = ("<p class=`"address`">$($mp.tr.address)</p>") +
  (Parallel-Paragraphs $mp.tr.paragraphs) +
  "<div class=`"signature`">$(((($mp.tr.closing | ForEach-Object { "<p>$(Inline $_)</p>" }) -join '')))</div>"
$mpLd = '{"@context":"https://schema.org","@type":"Article","headline":' + (JStr "Motu Proprio: $($mp.tr.title)") + ',"inLanguage":"tr","datePublished":"2005-06-28","author":{"@type":"Person","name":"Papa XVI. Benediktus"},"publisher":{"@type":"Organization","name":"Libreria Editrice Vaticana"},"mainEntityOfPage":' + (JStr "$SiteUrl/motu-proprio.html") + '}'
Article-Page 'motu-proprio.html' 'Motu Proprio' 'Motu Proprio' "Katolik Kilisesi Katekizmi Özeti$($Apos)nin Onaylanması ve Yayımlanması İçin Motu Proprio" `
 $mpBody `
  (Meta-Trim "Papa XVI. Benediktus$($Apos)un 28 Haziran 2005 tarihli Motu Proprio$($Apos)su: Katolik Kilisesi Katekizmi Özeti$($Apos)nin onaylanması ve yayımlanması.") $mpLd `
  "Motu Proprio: Katekizm Özeti$($Apos)nin Onaylanması" `


$in = $X.introduction
$inBody = (Parallel-Paragraphs $in.tr.paragraphs) +
  "<div class=`"signature`">$(((($in.tr.closing | ForEach-Object { "<p>$_</p>" }) -join '')))</div>" +
  "<div class=`"footnotes`">$(Parallel-Paragraphs $in.tr.footnotes)</div>"
$inLd = '{"@context":"https://schema.org","@type":"Article","headline":"Giriş","inLanguage":"tr","datePublished":"2005-03-20","author":{"@type":"Person","name":"Kardinal Joseph Ratzinger"},"mainEntityOfPage":' + (JStr "$SiteUrl/giris.html") + '}'
Article-Page 'giris.html' 'Giriş' 'Önsöz' 'Giriş' $inBody `
  (Meta-Trim "Katolik Kilisesi Katekizmi Özeti$($Apos)nin Girişi (Kardinal Joseph Ratzinger, 2005): Özet$($Apos)in hazırlanışı, üç temel özelliği ve dört kısmı.") $inLd '' `


# ================================================================== APPENDIX (ekler.html)
$prayers = ($X.appendix.prayers | ForEach-Object { Text-Card $_ $_.id 3 "<div class=`"verse`">$(Verse $_.tr.text)</div>" }) -join "`n"
$formulas = ($X.appendix.formulas | ForEach-Object {
  $cls = if ($_.tr.plain) { ' class="plain"' } else { '' }
  $tr = "<div class=`"verse`"><ol$cls>" + (($_.tr.items | ForEach-Object { "<li>$(Inline $_)</li>" }) -join '') + '</ol></div>'
  Text-Card ([pscustomobject]@{ tr = $_.tr; la = $null }) $_.id 3 $tr
}) -join "`n"
# Read like a prayer book: one column, no boxes, a short gold rule between prayers,
# and a row of links at the top of each part to jump straight to a prayer
function Pb-Index($items, [string]$label) {
  $links = ($items | ForEach-Object { "<li><a href=`"#$($_.id)`">$((Inline $_.tr.title))</a></li>" }) -join ''
  return "<nav class=`"pb-index`" $(TA 'aria-label' $label)><ul>$links</ul></nav>"
}
$eklerBody = @"
<div class="wrap narrow" id="ekler">
  $(Crumbs 'Ekler' 'Katekizm' 'katekizm.html')
  <header class="page-head center"><p class="label">Ekler</p><h1>Ekler</h1></header>
  <h2 class="section-title" id="ek-a"><span class="label">A</span>Sık Kullanılan Dualar</h2>
  $(Pb-Index $X.appendix.prayers 'Dualar')
  <div class="prayer-book pb-prayers">
$prayers
  </div>
  <h2 class="section-title" id="ek-b"><span class="label">B</span>Katolik Öğretinin Formülleri</h2>
  $(Pb-Index $X.appendix.formulas 'Formüller')
  <div class="prayer-book pb-formulas">
$formulas
  </div>
</div>
"@
Write-Page -File 'ekler.html' -Title "Ekler: Dualar ve Katolik Öğreti Formülleri | $SiteName" `
  -Description "Katolik Kilisesi Katekizmi Özeti Ekleri: Türkçe ve Latince sık kullanılan dualar ve Katolik öğretinin formülleri." `
  -Path 'ekler.html' -Body $eklerBody -JsonLd @((Breadcrumb-Ld 'Ekler' 'ekler.html' 'Katekizm' 'katekizm.html'))

# ================================================================== SSS (sss.html): questions from non-Catholics and newcomers
# Plain <details>/<summary> accordions: they open without JavaScript, are searchable by the
# browser find-in-page in supporting browsers, and each carries the CCC paragraphs it rests on.
$script:FaqN = 0
$script:FdN = 0
$fdTabs = ($FaqData.categories | ForEach-Object { "<li><button type=`"button`" class=`"fd-tab`" aria-expanded=`"false`" aria-controls=`"fd-$($_.id)`"><span>$(if ($_.s) { $_.s } else { $_.title })</span><small>$(@($_.items).Count)</small>$IcoChevLg</button></li>" }) -join ''
$fdPanels = ($FaqData.categories | ForEach-Object {
  $lis = ($_.items | ForEach-Object { $script:FdN++; "<li><a href=`"#$($_.id)`"><b>$($script:FdN)</b><span>$(if ($_.s) { $_.s } else { $_.q })</span></a></li>" }) -join ''
  "<section class=`"fd-panel`" id=`"fd-$($_.id)`"><h2 class=`"fd-ph`">$((Inline $_.title))</h2><ol class=`"fd-list`">$lis</ol></section>"
}) -join ''
$faqNav = "<nav class=`"faq-dir`" $(TA 'aria-label' 'Soru dizini')><div class=`"fd-bar`"><ul class=`"fd-tabs`">$fdTabs</ul><button type=`"button`" class=`"fd-all`" aria-expanded=`"false`" aria-controls=`"fd-panels`"><span>Tüm sorular</span><span class=`"fd-pos`" aria-hidden=`"true`">$($script:FdN) soru</span>$IcoChevLg</button></div><div class=`"fd-panels`" id=`"fd-panels`">$fdPanels</div><div class=`"fd-scrim`"></div></nav>"
$faqCats = ($FaqData.categories | ForEach-Object {
  $script:FaqN++; $cat = $_
  $qs = ($cat.items | ForEach-Object {
    "<details class=`"faq-item`" id=`"$($_.id)`">" +
      "<summary><span class=`"faq-q`">$((Inline $_.q))</span>$IcoChevLg</summary>" +
      "<div class=`"faq-a`">" +
        "<p class=`"faq-ref`" $(TA 'title' 'Katolik Kilisesi Katekizmi madde numaraları')>$(Ccc-Link $_.ccc)</p>" +
        "$((Blocks $_.a))</div>" +
    "</details>"
  }) -join "`n"
  $ma = @{ 'teolojik-yanilgilar' = @('trinity', 'blue'); 'kutsal-sirlar-uygulamalar' = @('shell', 'green'); 'otorite-ogretiler' = @('keys', 'gold'); 'akla-gelen-itirazlar' = @('oillamp', 'purple'); 'savunma-ve-guncel-sorular' = @('shield', 'red') }[$cat.id]
  if (-not $ma) { $ma = @('candle', 'gold') }
  $cnt = @($cat.items).Count
  Ill-Sec -Id $cat.id -Art '' -Tone $ma[1] -Class 'faq-cat' -Kick ("$cnt soru") -Head ((Inline $cat.title)) `
    -Sub ('') -Body "<div class=`"faq-list`">$qs</div>"
}) -join "`n"
$sssBody = @"
<div class="wrap narrow ill-page">
  $(Crumbs 'Sıkça Sorulan Sorular')
  <header class="page-head center"><h1>$((Inline $FaqData.title))</h1></header>
  $faqNav
$faqCats
</div>
"@
Write-Page -File 'sss.html' -Title "$($FaqData.title) | $SiteName" `
  -Description "Katolik Kilisesi hakkında sık sorulan sorular ve Katekizm$($Apos)e dayanan yanıtlar: Meryem ve azizlere saygı, Kutsal Üçlü, günah çıkarma, papalık, araf, evrim." `
  -Path 'sss.html' -Body $sssBody -JsonLd @((Breadcrumb-Ld 'Sıkça Sorulan Sorular' 'sss.html'))

# ================================================================== SÖZLÜK (sozluk.html)
# The glossary of Catholic terms (content/glossary-tr.txt), A to Z in the Turkish alphabet:
# tools/sozluk.py writes the letters and their terms; here they get the site's page around them,
# the Catechism links and a search that narrows the list as you type. The Turkish port of the
# English site's glossary (verbumdomini.ca/glossary.html).
$glPy = Get-Command python3, python -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $glPy) { throw 'The glossary needs Python (tools/sozluk.py)' }
$glTmp = [IO.Path]::GetTempFileName()
& $glPy.Source (Join-Path $Root 'tools/sozluk.py') $glTmp
if ($LASTEXITCODE) { throw 'tools/sozluk.py failed' }
$glHtml = [IO.File]::ReadAllText($glTmp, $Utf8); Remove-Item $glTmp
$glInfo = [regex]::Match($glHtml, '<!--gl-count:(\d+)\|([^|]*)\|([^>]*)-->')
$glN = $glInfo.Groups[1].Value
$glHtml = $glHtml.Replace($glInfo.Value, '')
# each definition's Catechism paragraphs, one link per paragraph, as on the FAQ
$glHtml = [regex]::Replace($glHtml, '<p class="gl-ref" data-ccc="([^"]*)"></p>', {
  param($m) "<p class=`"gl-ref`"><abbr title=`"Katolik Kilisesi Katekizmi`">KKK</abbr> $(Ccc-Link ([Net.WebUtility]::HtmlDecode($m.Groups[1].Value)))</p>" })
$Tablolar.pages | Add-Member -NotePropertyName 'sozluk.html' -NotePropertyValue 'i-disputa' -Force
$glSub = "$($glInfo.Groups[2].Value)$($Apos)dan $($glInfo.Groups[3].Value)$($Apos)ya, imanın $glN terimi ve onları öğreten Katekizm paragrafları"
$glScript = @'
<script>
(function () {
  var q = document.getElementById('gl-q'); if (!q) return;
  var clear = document.getElementById('gl-clear'), status = document.getElementById('gl-status'), none = document.getElementById('gl-none');
  // Turkish case first (İ/i and I/ı), then ı and i as one letter, and without accents or
  // apostrophes, ç ğ ö ş ü folded too: "isa", "İSA" and "ısa" all find İsa, "ihs" finds IHS,
  // "sozluk" finds "sözlük" (so on a keyboard without Turkish letters every term can be found)
  var norm = function (s) { return s.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[’']/g, ''); };
  var items = [].slice.call(document.querySelectorAll('.gl-e')).map(function (e) {
    return { el: e, t: norm(e.querySelector('dt').textContent), d: norm(e.querySelector('dd').textContent) };
  });
  var secs = [].slice.call(document.querySelectorAll('.gl-letter'));
  var letters = [].slice.call(document.querySelectorAll('.gl-az a'));
  var timer, bar = document.querySelector('.gl-bar'), marks = [];
  // the words typed, marked in each term and definition shown (the Catechism links aside); the
  // text is compared as the search compares it, one character at a time, so each character of
  // the folded text keeps the place of the character it came from
  function unmark() {
    marks.forEach(function (m) { var p = m.parentNode; if (p) { p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); } });
    marks = [];
  }
  function mark(el, v) {
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = walk.nextNode())) if (!n.parentNode.closest('.gl-ref')) nodes.push(n);
    nodes.forEach(function (node) {
      var s = node.nodeValue, flat = '', at = [], cuts = [], k, i, j, f;
      for (i = 0; i < s.length; i++) { f = norm(s[i]); for (j = 0; j < f.length; j++) { flat += f[j]; at.push(i); } }
      for (k = flat.indexOf(v); k > -1; k = flat.indexOf(v, k + v.length)) cuts.push([at[k], at[k + v.length - 1] + 1]);
      if (!cuts.length) return;
      var frag = document.createDocumentFragment(), last = 0;
      cuts.forEach(function (c) {
        if (c[0] > last) frag.appendChild(document.createTextNode(s.slice(last, c[0])));
        var m = document.createElement('mark'); m.className = 'gl-mark'; m.textContent = s.slice(c[0], c[1]);
        frag.appendChild(m); marks.push(m); last = c[1];
      });
      if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }
  function run() {
    var v = norm(q.value.trim());
    clear.hidden = !q.value;
    unmark();
    document.documentElement.classList.toggle('gl-searching', !!v);
    var named = 0, shown = 0;
    items.forEach(function (it) {
      var byName = !v || it.t.indexOf(v) > -1, hit = byName || it.d.indexOf(v) > -1;
      it.el.hidden = !hit;
      if (hit) { shown++; if (v && byName) named++; if (v) mark(it.el, v); }
    });
    secs.forEach(function (s) {
      var any = !!s.querySelector('.gl-e:not([hidden])');
      s.hidden = !any;
      var a = letters.filter(function (x) { return x.getAttribute('href') === '#' + s.id; })[0];
      if (a) a.classList.toggle('gl-dim', !any);
    });
    none.hidden = !v || shown > 0;
    status.textContent = !v || shown === 0 ? '' : shown + ' terim bulundu' + (named && named < shown ? ', ' + named + ' tanesi adıyla' : '');
    // reading further down when typing: back to the first result, just under the pinned bar, at
    // once (the page's smooth scrolling would still be gliding when the next letter is typed)
    if (v && bar.classList.contains('is-stuck')) {
      var first = secs.filter(function (s) { return !s.hidden; })[0] || none;
      var off = (parseFloat(getComputedStyle(bar).top) || 0) + bar.offsetHeight + 10;
      window.scrollTo({ top: Math.max(0, first.getBoundingClientRect().top + window.pageYOffset - off), behavior: 'instant' });
    }
  }
  q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 110); });
  q.addEventListener('keydown', function (e) { if (e.key === 'Escape' && q.value) { e.preventDefault(); q.value = ''; run(); } });
  clear.addEventListener('click', function () { q.value = ''; run(); q.focus(); });
  // a letter, or a term named in a definition: the whole list again if it was narrowed, then
  // the place itself, just below the pinned letters (on phones the app view would only allow
  // for its own bar), and the term glows for a moment. The jump is instant: a glide from A to Z
  // runs through hundreds of terms and takes too long
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.gl-x, .gl-az a');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = document.getElementById(a.getAttribute('href').slice(1));
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    if (q.value) { q.value = ''; run(); }
    var off = (parseFloat(getComputedStyle(bar).top) || 0) + bar.offsetHeight + 10;
    window.scrollTo({ top: Math.max(0, t.getBoundingClientRect().top + window.pageYOffset - off), behavior: 'instant' });
    try { history.replaceState(history.state, '', '#' + t.id); } catch (err) { /* file:// */ }
    if (t.classList.contains('gl-e')) { t.classList.remove('gl-hit'); void t.offsetWidth; t.classList.add('gl-hit'); }
  }, true);
  // "/" puts the cursor in the search, as on many sites
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); q.focus(); }
  });
})();
</script>
'@
$glBody = @"
<div class="wrap narrow gl-page">
  <header class="page-head center">$(Page-Ico $IcoGlossary)<h1>Katolik Terimler Sözlüğü</h1><p class="sub">$glSub</p></header>
$glHtml
</div>
$glScript
"@
$glDesc = "$($glInfo.Groups[2].Value)$($Apos)dan $($glInfo.Groups[3].Value)$($Apos)ya $glN Katolik terimin açıklaması; her biri, öğretildiği Katolik Kilisesi Katekizmi paragraflarıyla."
Write-Page -File 'sozluk.html' -Title "Katolik Terimler Sözlüğü | $SiteName" `
  -Description $glDesc -Path 'sozluk.html' -Body $glBody -JsonLd @((Breadcrumb-Ld 'Katolik Terimler Sözlüğü' 'sozluk.html'))

# ================================================================== KUTSAL KITAP (kutsal-kitap.html)
# Three quick answers first (what to read in Turkish, what in English, how to spot a Catholic
# edition); the guide's sections follow folded away, each opening in place. The closing source
# note stays outside the folds.
function Kk-Fold([string]$html, [string]$sfx = '') {
  $tail = ''
  $i = $html.IndexOf('<blockquote')
  if ($i -ge 0) { $tail = $html.Substring($i); $html = $html.Substring(0, $i) }
  $parts = [regex]::Split($html, '(?=<h2 id=")')
  $out = ($parts | Where-Object { $_.Trim() } | ForEach-Object {
    $m = [regex]::Match($_, '^<h2 id="([^"]+)">(.*?)</h2>(.*)$', 'Singleline')
    if (-not $m.Success) { return $_ }
    "<details class=`"kk-sec`" id=`"$($m.Groups[1].Value)$sfx`"><summary><h3>$($m.Groups[2].Value)</h3>$IcoChevLg</summary><div class=`"kk-sec-body`">$($m.Groups[3].Value)</div></details>"
  }) -join "`n"
  return "<div class=`"kk-secs`">$out</div><div class=`"kk-note`">$tail</div>"
}
$kkRead = 'https://www.bible.com/tr/versions/2308-kkdeu-kutsal-kitap-ve-deuterokanonik-kitaplar'
$kkQuick = @(
  @(('Türkçe okumak için'), ('Kutsal Kitap ve Deuterokanonik Kitaplar (2003)'),
    ('73 kitabın tamamı, kolay okunur bir dille.'),
    "<a href=`"$kkRead`" target=`"_blank`" rel=`"noopener`">Ücretsiz oku $IcoExternal</a>"),
  @(('İngilizce için'), ('RSV-CE (The Ignatius Bible)'),
    ('Özgün metne yakın ama okunur; genel kullanım için en iyi seçim.'),
    "<a href=`"https://www.ewtn.com/bible`" target=`"_blank`" rel=`"noopener`">Ücretsiz oku $IcoExternal</a>"),
  @(('Satın alırken'), ('73 kitap ve Imprimatur'),
    ('Katolik baskıda 73 kitap vardır; iç kapakta Nihil obstat ve Imprimatur yazar.'), '')
)
$kkQuickHtml = ($kkQuick | ForEach-Object {
  $act = if ($_[3]) { '<p class="kk-q-a">' + $_[3] + '</p>' } else { '' }
  '<div class="kk-q"><p class="kk-q-k">' + $_[0] + '</p><p class="kk-q-t">' + $_[1] + '</p><p class="kk-q-s">' + $_[2] + '</p>' + $act + '</div>'
}) -join ''
$kkLogosTr = @'
<h2>Çeviri neden bu kadar önemli?</h2><p>Yeni Ahit Grekçe yazıldı. Eski Grekçe, tek bir kelimeye koca bir felsefeyi sığdırabilen bir dildir; bu yüzden onu daha dar anlamlı dillere aktarmak zordur. Yuhanna İncili şöyle başlar: <em>“Başlangıçta Söz vardı. Söz Tanrı’yla birlikteydi ve Söz Tanrı’ydı”</em> (Yuhanna 1:1). Burada “Söz” diye çevrilen kelime, Grekçe <em lang="grc">logos</em>’tur.</p><p>Eski Grek felsefesinde logos, evrene düzen veren akıl ve ilahi zekâdır: her şeyi birbirine bağlayan ve yöneten evrensel ilke. Stoacı filozoflar için logos, doğa, kader ya da takdirle bir tutulan etkin, akıllı ve ruhani bir güçtü. Yuhanna bu kelimeyi seçerek şunu söyler: Evrenin anlamı ve düzeni olan bu Akıl, Tanrı’nın kendisidir ve İsa’da insan oldu (Yuhanna 1:14).</p><p>“Söz” ya da “Tanrısal Söz” gibi karşılıklar bu derinliği taşıyamaz; birçok okur için anlamı bile açık değildir. Grekçenin bu zenginliği, her kelimenin bağlamıyla birlikte dikkatle yorumlanmasını gerektirir. İyi bir çeviri ve Kilise’nin rehberliği bu yüzden bu kadar önemlidir.</p>
'@
# the Logos note: its heading becomes the section's, the rest its body
function Kk-Split([string]$h) { $m = [regex]::Match($h.Trim(), '^<h2>(.*?)</h2>(.*)$', 'Singleline'); return @($m.Groups[1].Value, $m.Groups[2].Value) }
$kkLT = Kk-Split $kkLogosTr
$kkGuideN = ([regex]::Matches((Convert-Markdown $Kk.body), '<h2 id="')).Count
$kkBody = @"
<div class="wrap narrow ill-page">
  $(Crumbs 'Kutsal Kitap')
  <header class="page-head center">$(Page-Ico $IcoBible)<h1>$($KkMeta.title)</h1><p class="sub">$($KkMeta.subtitle)</p></header>
$(Ill-Sec -Id 'kisaca' -HeadId 'kk-quick-h' -Art 'book' -Tone 'gold' -Kick ('Hangi Kutsal Kitap?') -Head ('Kısaca') `
    -Body "<div class=`"kk-quick`">$kkQuickHtml</div><p class=`"kk-motto`">En iyi çeviri, okuyacağınız çeviridir.</p>")
$(Ill-Sec -Id 'logos' -Art 'scroll' -Tone 'blue' -Kick ('Logos') -Head ((Inline $kkLT[0])) `
    -Body "<div class=`"prose ill-prose`">$((Inline $kkLT[1]))</div>")
$(Ill-Sec -Id 'rehber' -Art 'lectern' -Tone 'red' -Kick ("$kkGuideN bölüm") -Head ('Rehberin tamamı') `
    -Body "<div class=`"body prose kk-body`">$((Kk-Fold (Convert-Markdown $Kk.body)))</div>")
</div>
"@
Write-Page -File 'kutsal-kitap.html' -Title "$($KkMeta.title) | $SiteName" -Description $KkMeta.description `
  -Path 'kutsal-kitap.html' -Body $kkBody -JsonLd @((Breadcrumb-Ld 'Kutsal Kitap' 'kutsal-kitap.html'))

$IcoArrowR = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
# ================================================================== KATOLIK SURECI (katolik-sureci.html)
# Two doors up top (never baptized / baptized in another church), the first step in one line, the
# OCIA steps as a short numbered list, and everything else (the baptized path, conditional
# baptism, the wait, practical questions) folded away, each opening in place.
$sureciDoors = (@($Sureci.paths) | ForEach-Object -Begin { $di = 0 } -Process {
  $to = if ($di -eq 0) { 'surec' } else { 'zaten-hristiyan' }; $di++
  "<a class=`"why-door`" href=`"#$to`"><span class=`"why-door-t`">$((Inline $_.door))</span><span class=`"why-door-s`">$((Inline $_.doorSub))</span>$IcoArrowR</a>"
}) -join ''
$stageList = ($Sureci.steps | ForEach-Object {
  $i = [array]::IndexOf(@($Sureci.steps), $_) + 1
  "<li class=`"stage`"><span class=`"stage-n`">$i</span><div class=`"stage-body`"><h3>$((Inline $_.title))</h3><p>$((Inline $_.text))</p></div></li>"
}) -join "`n"
function Sureci-Fold([string]$id, $title, $body) {
  "<details class=`"kk-sec`" id=`"$id`"><summary><h3>$title</h3>$IcoChevLg</summary><div class=`"kk-sec-body prose`">$body</div></details>"
}
$sureciFolds = @(
  (Sureci-Fold 'zaten-hristiyan' ($Sureci.already.title) ((Blocks $Sureci.already.body))),
  (Sureci-Fold 'sartli-vaftiz' ($Sureci.conditional.title) ((Blocks $Sureci.conditional.body))),
  (Sureci-Fold 'beklerken' ($Sureci.waiting.title) ((Blocks $Sureci.waiting.body)))
) + @($Sureci.faq | ForEach-Object { Sureci-Fold $_.id ((Inline $_.q)) "<p>$((Inline $_.a))</p>" })
$sureciBody = @"
<div class="wrap narrow sureci-wrap ill-page" data-av-nogh>
  $(Crumbs 'Katolik Olma Süreci')
  <header class="page-head center">$(Page-Ico $IcoDoor)<h1>$($Sureci.title)</h1></header>
  <p class="why-intro">$((Inline $Sureci.intro))</p>
  <nav class="why-doors two" $(TA 'aria-label' 'Hangi yol sizin için?')>$sureciDoors</nav>
  <p class="sureci-first">$((Inline $Sureci.firstStep)) <a href="kiliseler.html">$IcoPin Kilise Bul</a></p>
$(Ill-Sec -Id 'surec' -HeadId 'h-surec' -Art 'shell' -Tone 'blue' -Kick ('OCIA · yaklaşık altı ay') -Head ('Hazırlık adım adım') `
    -Body "<p class=`"why-thesis`">$((Inline $Sureci.processIntro))</p><ol class=`"stage-list`">$stageList</ol>")
$(Ill-Sec -Id 'sorular' -HeadId 'h-sorular' -Art 'candle' -Tone 'gold' -Kick ('Sorular ve özel durumlar') -Head ('Merak edilenler') `
    -Body "<div class=`"kk-secs`">$($sureciFolds -join '')</div>")
  <p class=`"conventions`">Bu sayfadaki OCIA süreci, Kilise$($Apos)nin bütün dünyada geçerli düzenlemesidir (1972, Tanrısal Kült Cemaati). Paskalya Nöbeti dışında kabul ve günah çıkarmanın zamanı gibi bazı ayrıntılar, ABD Katolik Episkoposlar Konferansı$($Apos)nın Katekümenlik İçin Ulusal Tüzüğü$($Apos)nden (1986) alınmıştır. Kendi bölgenizdeki uygulama için en yakın kiliseye danışın.</p>
</div>
"@
Write-Page -File 'katolik-sureci.html' -Title "$($Sureci.title) | $SiteName" `
  -Description "Katolik olmak isteyenler için: OCIA/RCIA süreci nedir, vaftizli ve vaftizsiz adaylar için adım adım nasıl işler, hangi hazırlık gerekir." `
  -Path 'katolik-sureci.html' -Body $sureciBody -JsonLd @((Breadcrumb-Ld 'Katolik Olma Süreci' 'katolik-sureci.html'))

# ================================================================== GUNAH CIKARMA (gunah-cikarma.html)
# Two doors (how it works / preparing), the steps as a light timeline, and the rest folded: one fold
# per commandment in the examination of conscience (what it covers, then the questions) and one per
# question and fear. The seal martyrs footnote stays open under the questions.
$confessionSteps = ($Confession.steps | ForEach-Object {
  $i = [array]::IndexOf(@($Confession.steps), $_) + 1
  "<li class=`"stage`"><span class=`"stage-n`">$i</span><div class=`"stage-body`"><h3>$((Inline $_.title))</h3><p>$((Inline $_.text))</p></div></li>"
}) -join "`n"
$examenFolds = ($Confession.examenGroups | ForEach-Object {
  $group = $_
  $items = ($group.items | ForEach-Object { '<li>' + (Inline $_) + '</li>' }) -join ''
  $lists = ('<ul class="examen-list">' + $items + '</ul>')
  $note = ''
  if ($group.noteMark) { $note = '<p class="examen-note">* ' + ((Inline $Confession.examenNote)) + '</p>' }
  $title = ((Inline $group.title)) + $(if ($group.noteMark) { '*' } else { '' })
  $slug = 'emir-' + (([regex]::Match($group.title, '^[\d ve]+')).Value.Trim() -replace '\s+ve\s+', '-' -replace '\s', '')
  '<details class="kk-sec" id="' + $slug + '"><summary><h3>' + $title + '</h3>' + $IcoChevLg + '</summary><div class="kk-sec-body">' +
    '<p class="examen-about">' + ((Inline $group.about)) + '</p>' + $lists + $note + '</div></details>'
}) -join "`n"
# the questions are short and all worth reading, so they are simply listed open, question over answer
$confessionFaq = ($Confession.faq | ForEach-Object {
  '<div class="ill-qa" id="' + $_.id + '"><h3 class="ill-q">' + ((Inline $_.q)) + '</h3><p class="ill-a">' + ((Inline $_.a)) + '</p></div>'
}) -join "`n"
$sealMartyrsItems = ($Confession.sealMartyrs.items | ForEach-Object { '<li><strong>' + (Inline $_.name) + '</strong> ' + (Inline $_.detail) + '</li>' }) -join "`n"
$sealLists = ('<ul class="footnote-list">' + $sealMartyrsItems + '</ul>')
$sealMartyrsHtml = '<aside class="footnote-block" id="muhur-sehitleri"><p class="footnote-label">* ' + ((Inline $Confession.sealMartyrs.title)) + '</p><p>' + ((Inline $Confession.sealMartyrs.intro)) + '</p>' + $sealLists + '</aside>'
$confessionDoors = '<a class="why-door" href="#adim-adim"><span class="why-door-t">' + ('İlk kez ya da uzun bir aradan sonra gidiyorum') + '</span><span class="why-door-s">' + ('Adım adım neler olacağını görün') + '</span>' + $IcoArrowR + '</a>' +
  '<a class="why-door" href="#vicdan-muhasebesi"><span class="why-door-t">' + ('Hazırlanmak istiyorum') + '</span><span class="why-door-s">' + ("On Emir$($Apos)e göre vicdan muhasebesi") + '</span>' + $IcoArrowR + '</a>'
$confessionBody = @"
<div class="wrap narrow sureci-wrap ill-page" data-av-nogh>
  $(Crumbs 'Günah Çıkarma')
  <header class="page-head center">$(Page-Ico $IcoKey)<h1>$($Confession.title)</h1></header>
  <p class="why-intro">$((Inline $Confession.intro))</p>
  <nav class="why-doors two" $(TA 'aria-label' 'Nereden başlamak istersiniz?')>$confessionDoors</nav>
$(Ill-Sec -Id 'adim-adim' -HeadId 'h-adim' -Art 'keys' -Tone 'purple' -Kick ('Ayin nasıl ilerler') -Head ('Adım adım') `
    -Body "<ol class=`"stage-list`">$confessionSteps</ol>")
$(Ill-Sec -Id 'vicdan-muhasebesi' -HeadId 'h-vicdan' -Art 'tablets' -Tone 'red' -Kick ('Hazırlık') -Head ('Vicdan muhasebesi') `
    -Body "<p class=`"why-thesis`">$((Inline $Confession.examenIntro))</p><div class=`"kk-secs`">$examenFolds</div>")
$(Ill-Sec -Id 'sorular-ve-korkular' -HeadId 'h-sorular' -Art 'candle' -Tone 'green' -Kick ('Merak edilenler') -Head ('Sık sorulan sorular ve korkular') `
    -Body "<div class=`"ill-qas`">$confessionFaq</div>$sealMartyrsHtml")
  <p class=`"conventions`">Bu sayfa, Katolik Kilisesi Katekizmi$($Apos)nin Tövbe ve Barışma Kutsal Sırrı üzerine öğretisine (<a href=`"https://www.vatican.va/content/catechism/en/part_two/section_two/chapter_two/article_4/vi_the_sacrament_of_penance_and_reconciliation.html`" target=`"_blank`" rel=`"noopener`">KKK 1420-1498</a>) ve Kilise hukukuna dayanır; ayin sözlerinin tam metni bölgeden bölgeye küçük farklar gösterebilir. Uygulamadaki ayrıntılar için (örneğin günah çıkarma saatleri) en yakın cemaat kilisenize danışın; <a href=`"kiliseler.html`">Kilise Bul</a> sayfası size yardımcı olabilir.</p>
</div>
"@
Write-Page -File 'gunah-cikarma.html' -Title "$($Confession.title) | $SiteName" `
  -Description "Günah çıkarma nasıl işler? Adım adım pratik rehber, vicdan muhasebesi listesi ve ilk kez günah çıkaracaklar için sık sorulan sorular." `
  -Path 'gunah-cikarma.html' -Body $confessionBody -JsonLd @((Breadcrumb-Ld 'Günah Çıkarma' 'gunah-cikarma.html'))

# ================================================================== ANADOLU'DAKI KOKLER HARITASI (on the page below)
# The places come from data/anadolu-haritasi.js, the outline from data/anadolu-harita-sekli.js
# (generated, see tools/anadolu-harita-sekli.mjs). Every place also gets a server-rendered card:
# initAnatoliaMap() in assets/script.js shows it in the popup, and without JavaScript the cards
# simply stay visible as a list under the map.
$AnMap = Read-Data 'anadolu-haritasi.js'
$AnShape = Read-Data 'anadolu-harita-sekli.js'
function Map-Num([double]$v) { return ([Math]::Round($v, 1)).ToString([Globalization.CultureInfo]::InvariantCulture) }
function Map-XY([double]$lat, [double]$lon) {
  $x = $AnShape.tx + $AnShape.k * $lon * [Math]::PI / 180
  $y = $AnShape.ty - $AnShape.k * [Math]::Log([Math]::Tan([Math]::PI / 4 + $lat * [Math]::PI / 360))
  return @((Map-Num $x), (Map-Num $y))
}
function Anatolia-Map {
  $catName = @{}; foreach ($c in $AnMap.cats) { $catName[$c.id] = ($c.tr) }
  $seas = @(@{ n = 'Karadeniz'; lat = 42.55; lon = 34.6 }, @{ n = 'Akdeniz'; lat = 35.25; lon = 31.2 }, @{ n = 'Ege Denizi'; lat = 36.0; lon = 26.22 })
  $seaText = ($seas | ForEach-Object { $p = Map-XY $_.lat $_.lon; "<text x=`"$($p[0])`" y=`"$($p[1])`">$($_.n)</text>" }) -join ''
  $markers = New-Object Text.StringBuilder
  $cards = New-Object Text.StringBuilder
  foreach ($s in $AnMap.sites) {
    $c = $s.tr
    $p = Map-XY $s.lat $s.lon
    $label = if ($c.label) { $c.label } else { $c.name }
    [void]$markers.Append("<g class=`"amap-site c-$($s.cat)`" data-site=`"$($s.id)`" transform=`"translate($($p[0]) $($p[1]))`" tabindex=`"0`" role=`"button`" $(TA 'aria-label' $c.name) aria-controls=`"amap-pop`">" +
      "<circle class=`"amap-hit`" r=`"11`"></circle><circle class=`"amap-dot`" r=`"6`"></circle>" +
      "<text class=`"amap-label`" x=`"$(if ($null -ne $c.lx) { $c.lx } else { $s.lx })`" y=`"$(if ($null -ne $c.ly) { $c.ly } else { $s.ly })`" text-anchor=`"$(if ($c.la) { $c.la } else { $s.la })`">$($label)</text></g>")
    $old = if ($c.old) { " <span class=`"amap-c-old`">($($c.old))</span>" } else { '' }
    $refs = if (@($c.refs).Count) { "<div class=`"amap-c-refs`"><span class=`"label`">Kutsal Kitap$($Apos)ta</span>" + (((@($c.refs) | ForEach-Object { "<span class=`"amap-ref`">$_</span>" }) -join '')) + '</div>' } else { '' }
    $more = if ($s.section) { "<a class=`"amap-c-more`" href=`"#$($s.section)`">Bu sayfada devamını okuyun$IcoChevDown</a>" } else { '' }
    [void]$cards.Append("<article class=`"amap-card c-$($s.cat)`" id=`"yer-$($s.id)`" data-site=`"$($s.id)`" hidden>" +
      "<p class=`"amap-c-cat`"><span class=`"amap-key`"></span>$($catName[$s.cat])</p>" +
      "<h3 class=`"amap-c-name`">$($c.name)$old</h3><p class=`"amap-c-place`">$($c.place)</p>" +
      "<p class=`"amap-c-text`">$((Inline $c.text))</p>$refs$more</article>")
  }
  # the groups, listed small in the map's lower right corner: pointing at one lights up its places
  $legend = ($AnMap.cats | ForEach-Object {
    "<li><button type=`"button`" class=`"amap-lg c-$($_.id)`" data-cat=`"$($_.id)`"><span class=`"amap-key`"></span>$($_.tr)</button></li>"
  }) -join ''
  return @"
<section class="amap" id="harita" aria-labelledby="amap-h">
  <h2 class="section-title" id="amap-h">$($AnMap.title)</h2>
  <p class="amap-lead">$($AnMap.lead)</p>
  <div class="amap-frame">
    <div class="amap-scroll">
      <svg class="amap-svg" viewBox="0 0 $($AnShape.W) $($AnShape.H)" role="group" $(TA 'aria-label' 'Hristiyanlığın ilk tarihinden yerlerle Türkiye haritası')>
        <rect class="amap-sea" width="$($AnShape.W)" height="$($AnShape.H)"></rect>
        <path class="amap-land" d="$($AnShape.land)"></path>
        <path class="amap-tr" d="$($AnShape.turkey)"></path>
        <path class="amap-lake" d="$($AnShape.lakes)"></path>
        <g class="amap-seas" aria-hidden="true">$seaText</g>
        <g class="amap-sites">$($markers.ToString())</g>
      </svg>
    </div>
    <ul class="amap-legend" $(TA 'aria-label' 'Haritadaki yer grupları')>$legend</ul>
    <div class="amap-pop" id="amap-pop" role="dialog" aria-labelledby="amap-pop-h" hidden>
      <button type="button" class="amap-pop-close" $(TA 'aria-label' 'Kapat')>$IcoClose</button>
      <div class="amap-pop-body"></div>
      <p class="amap-pop-hint">Kartı açık tutmak için tıklayın</p>
    </div>
  </div>
  <p class="amap-swipe">Haritanın tamamını görmek için yana kaydırın</p>
  <div class="amap-cards">$($cards.ToString())</div>
</section>
"@
}

# ================================================================== TOPRAKLARIMIZDA HRISTIYANLIK (topraklarimizda-hristiyanlik.html)
# Each section as an illustrated section (Ill-Sec), its kicker naming the map group it belongs to, in that group's colour
$AnaArt = @{ 'pavlus' = 'ship'; 'yedi-kilise' = 'lampstand'; 'iznik' = 'church'; 'kilise-babalari' = 'book' }
$AnaCat = @{ 'pavlus' = 'pavlus'; 'yedi-kilise' = 'kilise'; 'iznik' = 'konsil'; 'kilise-babalari' = 'gelenek' }
$AnaTone = @{ 'pavlus' = 'gold'; 'kilise' = 'red'; 'konsil' = 'blue'; 'gelenek' = 'green' }
$anatoliaSections = ($Anatolia.sections | ForEach-Object {
  $cid = $AnaCat[$_.id]
  $cat = if ($cid) { $AnMap.cats | Where-Object { $_.id -eq $cid } | Select-Object -First 1 } else { $null }
  Ill-Sec -Id $_.id -Art $AnaArt[$_.id] -Tone $(if ($cid) { $AnaTone[$cid] } else { 'gold' }) -Kick $(if ($cat) { $cat.tr } else { '' }) `
    -Head ((Inline $_.title)) -Sub ('') `
    -Body "<div class=`"prose ill-prose`">$((Blocks $_.body))</div>"
}) -join "`n"
$anatoliaBody = @"
<div class="wrap narrow">
  $(Crumbs 'Topraklarımızda Hristiyanlık')
  <header class="page-head center">$(Page-Ico $IcoRoots)<h1>$($Anatolia.title)</h1></header>
</div>
<div class="wrap">
$(Anatolia-Map)
</div>
<div class="wrap narrow">
$anatoliaSections
  <p class="conventions closing-note">$((Inline $Anatolia.closing))</p>
</div>
"@
Write-Page -File 'topraklarimizda-hristiyanlik.html' -Title "$($Anatolia.title) | $SiteName" `
  -Description "Hristiyanlığın Anadolu'daki kökleri: Pavlus'un memleketi Tarsus, Vahiy Kitabı'nın yedi kilisesi, İznik Konsili, Antakya ve İzmir'deki ilk Kilise Babaları." `
  -Path 'topraklarimizda-hristiyanlik.html' -Body $anatoliaBody -JsonLd @((Breadcrumb-Ld 'Topraklarımızda Hristiyanlık' 'topraklarimizda-hristiyanlik.html'))

# ================================================================== İSLAM'A CEVAP (islama-cevap.html)
# The Cevap Ver section's first page: a short summary ("Kısaca"), each point leading to its section,
# then the full case in parts. In the text, "Kur’an 9:29" (and "; 6:114" after it) links to that
# verse on quran.com, and "Buhari 25", "Müslim 1452a", "Ebu Davud 4002", "Tirmizi 2653", "İbn Mace 1944" or
# "Nesai 3959" to the hadith on sunnah.com
# (in the English text: "Qur’an 9:29", "Bukhari 25", "Muslim 1452a", "Abu Dawud 4002", "Tirmidhi 2653",
# "Ibn Majah 1944", "Nasa’i 3959").
$Ic = Read-Data 'islama-cevap.js'
$QuranRx = [regex]("(Kur$($Apos)an|Qur$($Apos)an) " + '(\d{1,3}:\d{1,3}(?:-\d{1,3})?(?:;\s?\d{1,3}:\d{1,3}(?:-\d{1,3})?)*)')
$QuranEval = [System.Text.RegularExpressions.MatchEvaluator]{
  param($m)
  $refs = ($m.Groups[2].Value -split ';\s?' | ForEach-Object {
    $cv = $_ -split ':'
    "<a class=`"qref`" href=`"https://quran.com/$($cv[0])/$($cv[1])`" target=`"_blank`" rel=`"noopener`">$_</a>"
  }) -join '; '
  "$($m.Groups[1].Value) $refs"
}
$HadithRx = [regex]'(?<![\p{L}])(Buhari|Müslim|Ebu Davud|Tirmizi|İbn Mace|Nesai|Bukhari|Muslim|Abu Dawud|Tirmidhi|Ibn Majah|Nasa.i) (\d{1,5}[a-z]?)(?![\d\p{L}])'
$HadithBooks = @{ 'Buhari' = 'bukhari'; 'Müslim' = 'muslim'; 'Ebu Davud' = 'abudawud'; 'Tirmizi' = 'tirmidhi'; 'İbn Mace' = 'ibnmajah'; 'Nesai' = 'nasai'
  'Bukhari' = 'bukhari'; 'Muslim' = 'muslim'; 'Abu Dawud' = 'abudawud'; 'Tirmidhi' = 'tirmidhi'; 'Ibn Majah' = 'ibnmajah' }
$HadithEval = [System.Text.RegularExpressions.MatchEvaluator]{
  param($m)
  $book = if ($m.Groups[1].Value -like 'Nasa*') { 'nasai' } else { $HadithBooks[$m.Groups[1].Value] }
  "<a class=`"hdref`" href=`"https://sunnah.com/$($book):$($m.Groups[2].Value)`" target=`"_blank`" rel=`"noopener`">$($m.Value)</a>"
}
function Ic-Link([string]$s) { return $HadithRx.Replace($QuranRx.Replace($s, $QuranEval), $HadithEval) }
# One paragraph per line; "- " list items, "### " a subheading, "@art key" a painting, "> text || source" a quotation
function Ic-Blocks([string]$s) {
  $sb = New-Object Text.StringBuilder; $list = New-Object Collections.ArrayList
  $flush = { if ($list.Count) { [void]$sb.Append('<ul>' + (($list | ForEach-Object { "<li>$(Ic-Link $_)</li>" }) -join '') + '</ul>'); $list.Clear() } }
  foreach ($line in ($s -split "`n")) {
    $l = $line.Trim(); if (-not $l) { continue }
    if ($l.StartsWith('- ')) { [void]$list.Add($l.Substring(2)); continue }
    . $flush
    if ($l.StartsWith('### ')) { [void]$sb.Append("<h4>$(Ic-Link $l.Substring(4))</h4>"); continue }
    if ($l.StartsWith('@art ')) { [void]$sb.Append((Mira-Fig $l.Substring(5).Trim())); continue }
    if ($l.StartsWith('> ')) {
      $qs = $l.Substring(2) -split ' \|\| ', 2
      $cite = if ($qs.Count -gt 1) { "<cite>$(Ic-Link $qs[1])</cite>" } else { '' }
      [void]$sb.Append("<blockquote class=`"ic-quote`"><p>$($qs[0])</p>$cite</blockquote>"); continue
    }
    [void]$sb.Append("<p>$(Ic-Link $l)</p>")
  }
  . $flush
  return $sb.ToString()
}
$IcoArrowL = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'
$IcoSections = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>'
# One case page of the Cevap Ver section (İslam'a Cevap, Ateizme Cevap): the summary, the parts, the
# closing, the sources and the footnote, from one data file of the same shape

# Each part of a case page, and its closing, as an illustrated section: drawing and colour by part id
$CaseArt = @{
  'islama-cevap' = @{ kitap = @('scroll', 'blue'); peygamber = @('scales', 'gold'); tanri = @('cosmos', 'purple'); itirazlar = @('shield', 'red'); sonuc = @('door', 'green') }
  'ateizme-cevap' = @{ ring = @('scales', 'purple'); tanri = @('cosmos', 'blue'); isa = @('tomb', 'gold'); itirazlar = @('shield', 'red'); sonuc = @('door', 'green') }
  'yahudilere-cagri' = @{ kardeslik = @('lampstand', 'gold'); isaretler = @('scroll', 'blue'); itirazlar = @('shield', 'red'); sonuc = @('door', 'green') }
}
function Case-Body($Ic, $Ico, [string]$Page) {
  $arts = $CaseArt[$Page]
  # Which part each section belongs to, for the small label on each summary card
  $icPartOf = @{}
  foreach ($pt in @($Ic.parts)) {
    # A part may name its label itself ("kicker"); otherwise the part title up to its colon
    $k = if ($pt.kicker) { $pt.kicker } else { (($pt.title -split ':')[0]).Trim() }
    foreach ($sc in @($pt.sections)) { $icPartOf[$sc.id] = $k }
  }
  $icTotal = @($Ic.tldr).Count
  $icTldr = ($Ic.tldr | ForEach-Object -Begin { $i = 0 } -Process {
    $i++
    $pn = $icPartOf[$_.href]
    $kick = if ($pn) { "<span class=`"ic-tl-k`" aria-hidden=`"true`">$i / $icTotal · $pn</span>" } else { "<span class=`"ic-tl-k`" aria-hidden=`"true`">$i / $icTotal</span>" }
    "<li><a class=`"ic-tl`" href=`"#$($_.href)`">$kick<span class=`"ic-tl-n`">$i</span><span class=`"ic-tl-b`"><span class=`"ic-tl-t`">$($_.t)</span><span class=`"ic-tl-s`">$($_.text)<span class=`"ic-tl-more`">Tümünü oku $IcoArrowR</span></span></span></a></li>"
  }) -join ''
  $icRoman = @('I', 'II', 'III', 'IV', 'V', 'VI')
  # Every section, the closing too, in reading order: each ends with a way to the one before, the
  # one after and back to the start (on a phone, the page's list of parts)
  $icSeq = @(@($Ic.parts) | ForEach-Object { $_.sections }) + @($Ic.closing)
  function Ic-Nav($k) {
    $prev = if ($k -gt 0) { $p = $icSeq[$k - 1]; "<a class=`"ic-nav-prev`" href=`"#$($p.id)`" data-av-step><span class=`"ic-nav-l`">$IcoArrowL Önceki bölüm</span><span class=`"ic-nav-t`">$($p.title)</span></a>" } else { '<span></span>' }
    $next = if ($k -lt $icSeq.Count - 1) { $n = $icSeq[$k + 1]; "<a class=`"ic-nav-next`" href=`"#$($n.id)`" data-av-step><span class=`"ic-nav-l`">Sonraki bölüm $IcoArrowR</span><span class=`"ic-nav-t`">$($n.title)</span></a>" } else { '<span></span>' }
    $c = $icSeq[$k]
    return "<nav class=`"ic-nav`" aria-label=`"$(Attr "$(Plain $c.title): bölümler arasında")`">$prev$next<a class=`"ic-nav-start`" href=`"#bas`" data-av-pop=`"bas`">$IcoSections Bölümlere dön</a></nav>"
  }
  $script:icN = 0
  $icParts = (@($Ic.parts) | ForEach-Object -Begin { $pi = 0 } -Process {
    $part = $_
    $secs = ($part.sections | ForEach-Object {
      $script:icN++
      "<section class=`"ic-sec`" id=`"$($_.id)`"><h3 class=`"ic-sec-t`"><span class=`"label`">$($script:icN)</span><span>$($_.title)</span></h3>" +
        "<div class=`"prose`">$((Ic-Blocks $_.body))</div>$(Ic-Nav ($script:icN - 1))</section>"
    }) -join "`n"
    $pi++
    $a = $arts[$part.id]; if (-not $a) { $a = @('candle', 'gold') }
    Ill-Sec -Id $part.id -HeadId "$($part.id)-h" -Art $a[0] -Tone $a[1] -Class 'ic-part' -Kick ("$($icRoman[$pi - 1]). Bölüm") -Head ($part.title) -Body $secs
  }) -join "`n"
  $icSources = ($Ic.sources | ForEach-Object {
    # [Turkish, link, ...]: "-" in place of the Turkish marks a source the English site cites
    if ($_[0] -eq '-') { return }
    $t = $_[0]
    if ($_[1]) { "<li><a href=`"$($_[1])`" target=`"_blank`" rel=`"noopener`">$t</a></li>" } else { "<li>$t</li>" }
  }) -join ''
  $icBody = @"
  <div class="wrap narrow ic-page ill-page">
    <header class="page-head center" id="bas">$(Page-Ico $Ico)<h1>$($Ic.title)</h1></header>
    <p class="ic-lead">$($Ic.lead)</p>
    <p class="ic-lead-note">$((Ic-Link $Ic.note))</p>
    <section class="ic-tldr" id="kisaca" aria-labelledby="kisaca-h">
      <details class="ic-tldr-d"><summary class="ic-tldr-s"><h2 class="section-title" id="kisaca-h">$($Ic.tldrTitle)</h2>$IcoChevDown</summary>
      <ol class="ic-tl-list ic-tl-v">$icTldr</ol>
      </details>
    </section>
  $icParts
$(Ill-Sec -Id $Ic.closing.id -HeadId "$($Ic.closing.id)-h" -Art $arts['sonuc'][0] -Tone $arts['sonuc'][1] -Class 'ic-closing' -Kick ('Sonuç') -Head ($Ic.closing.title) -Body ("<div class=`"prose`">$(((Ic-Blocks $Ic.closing.body) -replace '<h4>', '<h3 class="ic-sub">' -replace '</h4>', '</h3>'))</div>" + (Ic-Nav ($icSeq.Count - 1))))
    <section class="ic-sources" aria-labelledby="ic-kaynak-h"><h2 class="section-title" id="ic-kaynak-h">Kaynaklar</h2><ul>$icSources</ul></section>
  </div>
"@
  return $icBody
}
$icBody = Case-Body $Ic $IcoAnswer 'islama-cevap'
$icLd = '{"@context":"https://schema.org","@type":"Article","headline":' + (JStr (Plain $Ic.title)) + ',"inLanguage":"tr","author":{"@type":"Organization","name":' + (JStr $SiteName) + '},"mainEntityOfPage":' + (JStr "$SiteUrl/islama-cevap.html") + '}'
Write-Page -File 'islama-cevap.html' -Title "$(Plain $Ic.title): Kur'an ve Hadislerle | $SiteName" `
  -Description (Meta-Trim "İslam'ın iddiaları kendi kaynaklarıyla sınanıyor: İslam ikilemi, Kur'an'ın korunmuşluğu, Muhammed'in karakteri, Kâbe'nin putu Hübel. Kısa özet ve tam tartışma.") `
  -Path 'islama-cevap.html' -Body $icBody -JsonLd @($icLd, (Breadcrumb-Ld "İslam$($Apos)a Cevap" 'islama-cevap.html'))

# ================================================================== ATEIZME CEVAP (ateizme-cevap.html)
# The Cevap Ver section's second page, built like İslam'a Cevap from data/ateizme-cevap.js: God's
# existence argued from reason and evidence, then the testimony of miracles and converts, then the
# objections (evil, hiddenness, many religions, science).
$Ac = Read-Data 'ateizme-cevap.js'
$acBody = Case-Body $Ac $IcoCosmos 'ateizme-cevap'
$acLd = '{"@context":"https://schema.org","@type":"Article","headline":' + (JStr (Plain $Ac.title)) + ',"inLanguage":"tr","author":{"@type":"Organization","name":' + (JStr $SiteName) + '},"mainEntityOfPage":' + (JStr "$SiteUrl/ateizme-cevap.html") + '}'
Write-Page -File 'ateizme-cevap.html' -Title "$(Plain $Ac.title): Akıl ve Kanıtla | $SiteName" `
  -Description (Meta-Trim "Tanrı var mı? Ateizm ve agnostisizm akıl ve kanıtla sınanıyor: evrenin varlığı, ince ayar, bilinç, ahlak, İsa’nın dirilişi, mucizeler ve kötülük sorunu.") `
  -Path 'ateizme-cevap.html' -Body $acBody -JsonLd @($acLd, (Breadcrumb-Ld 'Ateizme Cevap' 'ateizme-cevap.html'))

# ================================================================== YAHUDILERE CAGRI (yahudilere-cagri.html)
# The Cevap Ver section's third page, built like the other two from data/yahudilere-cagri.js: a humble
# witness to Jesus as Israel's Messiah, from the Tanakh, written to the Church's own guidance on
# Catholic-Jewish relations. Its paintings are named in data/tablolar.json.
$Yc = Read-Data 'yahudilere-cagri.js'
$ycBody = Case-Body $Yc $IcoLamp 'yahudilere-cagri'
$ycLd = '{"@context":"https://schema.org","@type":"Article","headline":' + (JStr (Plain $Yc.title)) + ',"inLanguage":"tr","author":{"@type":"Organization","name":' + (JStr $SiteName) + '},"mainEntityOfPage":' + (JStr "$SiteUrl/yahudilere-cagri.html") + '}'
Write-Page -File 'yahudilere-cagri.html' -Title "$(Plain $Yc.title): Tanah$($Apos)ın Sözleriyle Mesih | $SiteName" `
  -Description (Meta-Trim "Nasıralı İsa neden İsrail$($Apos)in beklediği Mesih? Daniel, Yeşaya 53, kurban ve kefaret, Mezmur 22 ve en sık itirazlar. Kilise$($Apos)nin Yahudi halkına duyduğu saygıyla.") `
  -Path 'yahudilere-cagri.html' -Body $ycBody -JsonLd @($ycLd, (Breadcrumb-Ld 'Yahudilere Çağrı' 'yahudilere-cagri.html'))

# ================================================================== NEDEN KATOLIGIZ (neden-katoligiz.html + en/why-were-catholic.html)
# A short case in three parts, read in one calm column. Two "doors" at the top send a skeptic to
# the start and a Christian straight to the Church. Each part lists its topics as one-line hooks;
# each hook is a <details> that opens to the skeptic's question, a one-line answer, the key points,
# and an "Ama..." line that opens the objection's reply. On a phone each hook is a row that opens
# the whole topic as its own screen (script.js, AV_PAGES).
function Why-Page {
  $W = $WhyCatholic
  function F2($o, [string]$k) { (Inline $o.$k) }
  $L = @{ doors = 'Nereden başlamak istersiniz?'; but = 'Ama'; q = 'Soru'; together = 'Hepsi bir arada'; where = 'Buradan nereye?' }
  function LL([string]$k) { $L[$k] }
  $parts = @($W.parts); $n = $parts.Count
  $doors = @(
    @($parts[0].id, "Tanrı$($Apos)ya inanmakta zorlanıyorum", 'Baştan başlayın: Tanrı var mı?', 'I find it hard to believe in God', 'Start at the beginning: is there a God?'),
    @($parts[1].id, "Tanrı$($Apos)ya inanıyorum, ama dinlere güvenemiyorum", 'İsa kim? bölümüne geçin', 'I believe in God, but I struggle with religion', 'Go to: Who is Jesus?'),
    @($parts[$n - 1].id, 'Hristiyanım, ama neden Katolik?', 'Doğrudan Kilise bölümüne geçin', "I$($Apos)m a Christian, but why Catholic?", 'Go straight to the Church')
  )
  $doorsHtml = ($doors | ForEach-Object { "<a class=`"why-door`" href=`"#$($_[0])`"><span class=`"why-door-t`">$($_[1])</span><span class=`"why-door-s`">$($_[2])</span>$IcoArrowR</a>" }) -join ''
  $panels = (0..($n - 1) | ForEach-Object {
    $k = $_; $pt = $parts[$k]
    $aside = ''
    if ($k -eq 0) {
      $aside = '<p class="why-aside">' + ('Ateist ya da agnostikseniz: <a href="ateizme-cevap.html">Ateizme Cevap</a>') + '</p>'
    }
    if ($k -eq 1) {
      $trA = 'Müslüman bir arka plandan geliyorsanız: <a href="islama-cevap.html">İslam' + $Apos + 'a Cevap</a>'
      $aside = '<p class="why-aside">' + ($trA) + '</p>'
    }
    $items = ($pt.topics | ForEach-Object {
      $tp = $_
      $pts = (@($tp.points) | ForEach-Object { "<li>$(Inline $_)</li>" }) -join ''
      "<details class=`"why-item`" id=`"$($tp.id)`">" +
        "<summary><span class=`"why-hook-k`">$((Inline $tp.title))</span><span class=`"why-hook`">$(F2 $tp 'hook')</span>$IcoChevLg</summary>" +
        "<div class=`"why-body`">" +
          "<p class=`"why-q`"><span class=`"why-q-label`">$(LL 'q')</span>$(F2 $tp 'q')</p>" +
          "<p class=`"why-lede`">$(F2 $tp 'lede')</p>" +
          ("<ul class=`"why-points`">$pts</ul>") +
          "<details class=`"why-obj`"><summary><span class=`"why-obj-label`">$(LL 'but')</span><span class=`"why-obj-q`">$(F2 $tp 'objection')</span>$IcoChev</summary><p>$(F2 $tp 'reply')</p></details>" +
        "</div>" +
      "</details>"
    }) -join "`n"
    $art = @('cosmos', 'tomb', 'basilica')[[math]::Min($k, 2)]; $tone = @('blue', 'gold', 'red')[[math]::Min($k, 2)]
    Ill-Sec -Id $pt.id -HeadId "h-$($pt.id)" -Art $art -Tone $tone -Class 'why-part' -Kick ("Bölüm $($k + 1) / $n") `
      -Head ((Inline $pt.title)) -Body ("<p class=`"why-thesis`">$(F2 $pt 'thesis')</p><div class=`"why-list`">$items</div>" + $aside)
  }) -join "`n"
  $chain = (@($W.chain) | ForEach-Object -Begin { $i2 = 0 } -Process { $i2++; "<li><span class=`"why-chain-n`">$i2</span>$((Inline $_))</li>" }) -join ''
  $ctaItems = @(@('katolik-sureci.html', 'Katolik Olma Süreci', 'Yol adım adım nasıl ilerler', 'Becoming Catholic', 'What the path looks like, step by step'),
    @('sss.html', 'Sık Sorulan Sorular', 'Sık sorulan diğer sorulara cevaplar', 'Frequently Asked Questions', 'More answers to common questions'),
    @('kiliseler.html', 'Kilise Bul', "Türkiye$($Apos)deki Katolik kiliseleri", 'Find a Church', 'Catholic parishes across Turkey'),
    @('iletisim.html', 'İletişim', 'Sorularınızı bize yazın', 'Contact', 'Write to us with your questions'))
  $cta = ($ctaItems | ForEach-Object { "<a class=`"why-cta`" href=`"$($_[0])`"><span class=`"why-cta-t`">$($_[1])</span><span class=`"why-cta-s`">$($_[2])</span>$IcoArrowR</a>" }) -join ''
  $crumb = Crumbs 'Neden Katoliğiz?'
  $body = @"
<div class="wrap why-wrap ill-page" data-av-nogh>
  $crumb
  <header class="page-head center">$(Page-Ico $IcoCompass)<h1>$($W.title)</h1></header>
  <p class="why-intro">$(F2 $W 'intro')</p>
  <nav class="why-doors" $(TA 'aria-label' $L.doors)>$doorsHtml</nav>
$panels
$(Ill-Sec -Id 'sonuc' -HeadId 'h-sonuc' -Art 'door' -Tone 'green' -Class 'why-end' -Kick ('Sonuç') -Head (LL 'together') `
    -Body "<ol class=`"why-chain`">$chain</ol><p class=`"why-closing`">$(F2 $W 'closing')</p><h3 class=`"why-where`">$(LL 'where')</h3><div class=`"why-ctas`">$cta</div>")
</div>
"@
  $page = 'neden-katoligiz.html'
  Write-Page -File $page -Title "$($W.title) | $SiteName" `
    -Description "Katolik inancının akla ve kalbe hitap eden kısa özeti: Tanrı var mı, İsa kim ve neden Katolik Kilise?" `
    -Path $page -Body $body -JsonLd @((Breadcrumb-Ld 'Neden Katoliğiz?' $page))
}
Why-Page

# ================================================================== AZIZLER (azizler.html)
function Rank-Class([string]$rank) {
  if (-not $rank) { return 'rk-other' }
  if ($rank -match 'En Büyük Bayram') { return 'rk-hi' }
  if ($rank -match 'Büyük Bayram') { return 'rk-solemn' }
  if ($rank -match '^Bayram$') { return 'rk-feast' }
  if ($rank -match 'İhtiyari') { return 'rk-optional' }
  if ($rank -match 'Anma') { return 'rk-memorial' }
  return 'rk-other'
}
# The calendar's saints (and Marian feasts) who have a page of their own here: their card leads to
# it. Every other saint's card ends in a Google search for the name.
$SaintPageRe = [ordered]@{
  'meryem-ana'             = "Meryem Ana(?!.*Bazilika)"
  'aziz-yusuf'             = "^(İşçi )?Yusuf$"
  'havari-petrus'          = "Petrus.un Kürsüsü|^Havariler Petrus ve Pavlus$"
  'havari-pavlus'          = "Pavlus.un İmana Dönüşü|^Havariler Petrus ve Pavlus$"
  'vaftizci-yahya'         = "^Vaftizci Yahya"
  'havari-yuhanna'         = "^Havari ve İncil Yazarı Ioannes|Latin Kapısı Önündeki Aziz Yuhanna"
  'aziz-augustinus'        = "^Augustinus of Hippo"
  'aziz-thomas-aquinas'    = "^Thomas Aquinas"
  'assisili-aziz-francis'  = "^Franciscus of Assisi"
  'sienali-aziz-catharina' = "^Catharina of Siena"
  'avilali-aziz-teresa'    = "^Teresia of Ávila"
  'lisieuxlu-kucuk-teresa' = "Lisieux"
  'aziz-ignatius-loyola'   = "^Ignatius of Loyola"
  'aziz-benedictus'        = "^Benedictus$"
  'aziz-patrick'           = "^Patricius$"
  'padovali-aziz-antonius' = "^Antonius of Padua"
  'kalkutali-aziz-teresa'  = "^Teresa of Calcutta"
  'aziz-ii-yuhanna-pavlus' = "^Ioannes Paulus II"
  'padre-pio'              = "Padre Pio"
  'aziz-hieronymus'        = "^Hieronymus$"
}
function Saint-Links($s) {
  $pages = @($SaintPageRe.Keys | Where-Object { $s.name -cmatch $SaintPageRe[$_] })
  if ($pages.Count) {
    # one page: "Devamını oku"; two (Petrus and Pavlus): each by its name
    return '<p class="s-links">' + (($pages | ForEach-Object {
      $id = $_
      $gs = $GreatSaints.saints | Where-Object { $_.id -eq $id } | Select-Object -First 1
      $label = if ($pages.Count -gt 1) { $gs.name } else { ('Devamını oku') + '<span class="visually-hidden">: ' + ($gs.name) + '</span>' }
      "<a class=`"s-page`" href=`"$id.html`">$label$IcoNext</a>"
    }) -join '') + '</p>'
  }
  # a search for the name, in the language shown
  $plain = ($s.name -replace '<[^>]+>', '')
  $q = if ($plain -match '(^|\s)(Aziz|Havari|Havariler|Meryem|Vaftizci|Bazilika)') { $plain } else { "Aziz $plain" }
  return "<p class=`"s-links`">" + ("<a class=`"s-google`" href=`"https://www.google.com/search?q=$([uri]::EscapeDataString($q))`" target=`"_blank`" rel=`"noopener nofollow`">Google$($Apos)da ara</a>") + "</p>"
}
function Saint-Item($s) {
  $titlePart = if ($s.title) { "<span class=`"s-title`">$((Inline $s.title))</span>" } else { '' }
  return "<details class=`"saint-item`"><summary><span class=`"s-name`">$((Inline $s.name))</span>$titlePart$IcoChev</summary><div class=`"saint-bio`">$((Blocks $s.bio))$(Saint-Links $s)</div></details>"
}
$monthSectionsHtml = (1..12 | ForEach-Object {
  $mo = $_
  $monthDays = @($Saints.days | Where-Object { $_.m -eq $mo }) | Sort-Object d
  $cells = ($monthDays | ForEach-Object {
    $day = $_
    if ($day.genel) {
      "<div class=`"day-cell genel`" data-m=`"$mo`" data-d=`"$($day.d)`"><span class=`"day-num`">$($day.d)</span><details class=`"saint-item genel-item`"><summary><span class=`"s-name`">$((Inline $Saints.genelTitle))</span>$IcoChev</summary><div class=`"saint-bio`">$((Blocks $Saints.genelBio))</div></details></div>"
    } else {
      $rc = Rank-Class $day.rank
      $saintsHtml = (($day.saints | ForEach-Object { Saint-Item $_ }) -join '')
      "<div class=`"day-cell $rc`" data-m=`"$mo`" data-d=`"$($day.d)`"><span class=`"day-num`">$($day.d)</span><span class=`"day-rank label`">$($day.rank)</span><div class=`"day-saints`">$saintsHtml</div></div>"
    }
  }) -join "`n"
  "<section class=`"month`" id=`"ay-$mo`" data-month=`"$mo`"><h2 class=`"month-title`">$($MonthNamesTr[$mo - 1])</h2><div class=`"day-grid`">$cells</div></section>"
}) -join "`n"
$monthPillsHtml = (1..12 | ForEach-Object { "<a href=`"#ay-$_`" data-month-link=`"$_`">$($MonthNamesTr[$_ - 1].Substring(0, 3))</a>" }) -join ''
# The feasts that move with Easter: script.js dates them for the year shown and puts each on its
# day in the calendar; the cards themselves stay hidden, as that script's source
$movableCardsHtml = ($Saints.movable | ForEach-Object {
  "<article class=`"movable-card`" data-movable=`"$($_.id)`" data-offset=`"$($_.offset)`" data-rk=`"$(Rank-Class $_.rank)`"><h3>$((Inline $_.title))</h3><p class=`"m-rank label`">$($_.rank)<span class=`"m-date`" data-movable-date></span></p><div class=`"m-bio`">$((Blocks $_.bio))</div></article>"
}) -join "`n"
# The twenty best-known saints: one compact list, folded into a dropdown
# Each saint's page opens with a drawing of the saint's traditional emblem, named under it
$SaintEmblems = @{
  'meryem-ana'             = @('stars12', 'blue', 'On iki yıldızlı taç', 'The crown of twelve stars')
  'aziz-yusuf'             = @('tools', 'gold', 'Marangoz gönyesi ve çekici', "The carpenter's square and hammer")
  'havari-petrus'          = @('keys', 'gold', 'Cennetin anahtarları', 'The keys of the kingdom')
  'havari-pavlus'          = @('sword', 'red', 'Kılıç', 'The sword')
  'vaftizci-yahya'         = @('shell', 'blue', 'Vaftiz kabuğu', 'The baptismal shell')
  'havari-yuhanna'         = @('eagle', 'purple', 'Kartal', 'The eagle')
  'aziz-augustinus'        = @('heart', 'red', 'Alevli ve oklu yürek', 'The flaming, pierced heart')
  'aziz-thomas-aquinas'    = @('sun', 'gold', 'Göğsündeki güneş', 'The sun on his breast')
  'assisili-aziz-francis'  = @('tau', 'green', 'Tau haçı', 'The tau cross')
  'sienali-aziz-catharina' = @('thorns', 'red', 'Dikenli taç', 'The crown of thorns')
  'avilali-aziz-teresa'    = @('book', 'purple', 'Kitap ve kalem', 'The book and quill')
  'lisieuxlu-kucuk-teresa' = @('rose', 'red', 'Gül', 'The rose')
  'aziz-ignatius-loyola'   = @('ihs', 'gold', 'IHS mührü', 'The IHS seal')
  'aziz-benedictus'        = @('cupsnake', 'purple', 'Yılanlı kadeh', 'The cup with the serpent')
  'aziz-patrick'           = @('shamrock', 'green', 'Yonca', 'The shamrock')
  'padovali-aziz-antonius' = @('lily', 'gold', 'Zambak', 'The lily')
  'kalkutali-aziz-teresa'  = @('beads', 'blue', 'Tesbih', 'The rosary')
  'aziz-ii-yuhanna-pavlus' = @('arms', 'blue', 'Totus Tuus arması', 'The Totus Tuus coat of arms')
  'padre-pio'              = @('hand', 'red', 'Kutsal yaralar', 'The stigmata')
  'aziz-hieronymus'        = @('lion', 'gold', 'Aslan', 'The lion')
}
function Saint-Emblem([string]$id) {
  $e = $SaintEmblems[$id]
  if (-not $e) { return '' }
  "<div class=`"emblem ill-card tone-$($e[1])`">$(Ill-Art $e[0])<p class=`"emblem-cap`">Simgesi: $($e[2])</p></div>"
}
# the twenty on Azizler: a round portrait of each, ringed like a story not yet seen until the
# saint's page has been read (script.js, initSaintStories); the pictures' credits are on
# kaynaklar-ve-telif.html (data/aziz-portreleri.json)
$SaintPortraits = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'data/aziz-portreleri.json') | ConvertFrom-Json
$greatSaintsCardsHtml = ($GreatSaints.saints | ForEach-Object {
  "<a class=`"gs-st`" href=`"$($_.id).html`" data-gs=`"$($_.id)`"><span class=`"gs-ring`"><img src=`"assets/art/saints/$($_.id).jpg`" alt=`"`" width=`"256`" height=`"256`" loading=`"lazy`" decoding=`"async`"></span><span class=`"gs-n`">$((Inline $_.name))</span><span class=`"gs-s`">$((Inline $_.epithet))</span></a>"
}) -join ''
$azizlerBody = @"
<div class="wrap narrow">
  $(Crumbs 'Azizler')
  <header class="page-head center">$(Page-Ico $IcoStar)<h1>$((Inline $Saints.title))</h1></header>
  <p class="faq-intro">$((Inline $Saints.intro))</p>
  <section class="today-saint glass" id="bugun-azizi" data-today>
    <p class="label">Bugün <span data-today-date>...</span></p>
    <div class="today-body" data-today-body><p class="hint">Bugünün azizini görmek için JavaScript$($Apos)i etkinleştirin.</p></div>
  </section>
  <nav class="month-pills" id="takvim" $(TA 'aria-label' 'Aylar') data-month-pills>$monthPillsHtml</nav>
  <div class="saints-cal" data-saints-cal>
$monthSectionsHtml
  </div>
  <h2 class="section-title" id="buyuk-azizler">$((Inline $GreatSaints.title))</h2>
  <p class="faq-intro">$((Inline $GreatSaints.intro))</p>
  <div class="gs-stories">$greatSaintsCardsHtml</div>
  <p class="gs-credit">Portreler kamu malı tablolardan ve fotoğraflardan alınmıştır; künyeleri <a href=`"kaynaklar-ve-telif.html#aziz-portreleri`">Kaynaklar ve Telif</a> sayfasındadır.</p>
  <div class="movable-list" data-movable-list hidden>
$movableCardsHtml
  </div>
  <p class=`"conventions`">Tarihler ve ayin dereceleri Roma Genel Takvimi$($Apos)ne göredir. Hareketli bayramlar, Meeus/Jones/Butcher algoritmasıyla hesaplanan Paskalya tarihine göre yerleştirilir. Roma Genel Takvimi$($Apos)nde boş kalan günler için Roma Azizler Cetveli$($Apos)nden (Martyrologium Romanum) ya da Batı$($Apos)nın eski takvim geleneğinden bir aziz seçtik. Bu azizlerin rütbesi <em>Roma Azizler Cetveli</em> olarak gösterilir. Kilise bu anmaları o gün için zorunlu tutmaz; bunlar sitenin sunduğu ek bilgilerdir. Aziz hayat öyküleri bu site için Türkçe olarak yazıldı ve yazarın kendi bilgisine dayanır. Özellikle az bilinen azizlerde tarih ya da ayrıntı hataları olabilir. Güvenilir bir kaynağa dayandırılamayan birkaç gün için Kilise$($Apos)nin genel bir açıklaması kullanıldı.</p>
</div>
<div class="hover-panel glass" id="saint-panel" role="tooltip" hidden></div>
"@
Write-Page -File 'azizler.html' -Title "$($Saints.title) | $SiteName" `
  -Description "Katolik ayin takviminin azizleri: bugünün azizini Türkiye saatiyle görün, yılın her günü için Türkçe aziz hayat hikayelerini keşfedin." `
  -Path 'azizler.html' -Body $azizlerBody -JsonLd @((Breadcrumb-Ld 'Azizler' 'azizler.html'))

# ------------------------------------------------------------------ one page per great saint
$GreatSaints.saints | ForEach-Object {
  $s = $_
  $saintBody = @"
<div class="wrap narrow">
  $(Crumbs $s.name 'Azizler' 'azizler.html')
  <article class="article" id="article">
    <header class="page-head center saint-head" data-saint-page="$($s.id)">$(Page-Ico $IcoStar)$(Saint-Emblem $s.id)<p class="label">$(Inline $s.epithet) · $($s.era)</p><h1>$((Inline $s.name))</h1></header>
    <div class="body prose">$((Convert-Markdown $s.body))</div>
  </article>
</div>
"@
  $saintLd = '{"@context":"https://schema.org","@type":"Article","headline":' + (JStr $s.name) + ',"inLanguage":"tr","author":{"@type":"Organization","name":' + (JStr $SiteName) + '},"mainEntityOfPage":' + (JStr "$SiteUrl/$($s.id).html") + '}'
  Write-Page -File "$($s.id).html" -Title "$($s.name) | $SiteName" `
    -Description (Meta-Trim (Plain $s.summary)) -Path "$($s.id).html" -Body $saintBody `
    -JsonLd @($saintLd, (Breadcrumb-Ld $s.name "$($s.id).html" 'Azizler' 'azizler.html')) -OgType 'article'
}

# ================================================================== KUTSAL AYIN (kutsal-ayin.html)
function Mass-Lines($lines) {
  $roleLabels = $Mass.roleLabels
  $sb = New-Object Text.StringBuilder
  foreach ($ln in $lines) {
    $txt = $ln.tr
    switch ($ln.role) {
      'N'  { [void]$sb.Append("<p class=`"mass-note`"><em>$(Inline $txt)</em></p>") }
      'PC' { [void]$sb.Append("<p class=`"mass-line mass-pc`"><span class=`"mass-role label`">$($roleLabels.PC)</span>$(Inline $txt)</p>") }
      'P'  { [void]$sb.Append("<p class=`"mass-line mass-p`"><span class=`"mass-role label`">$($roleLabels.P)</span>$(Inline $txt)</p>") }
      'C'  { [void]$sb.Append("<p class=`"mass-line mass-c`"><span class=`"mass-role label`">$($roleLabels.C)</span>$(Inline $txt)</p>") }
    }
  }
  return $sb.ToString()
}
$massPillsHtml = ($Mass.parts | ForEach-Object {
  "<a href=`"#$($_.id)`" data-part-link=`"$($_.n)`" $(TA 'data-tooltip' $_.title) $(TA 'title' $_.title)>$($MassIcons[$_.icon])<span class=`"visually-hidden`">$($_.title)</span></a>"
}) -join ''
$massPartsHtml = ($Mass.parts | ForEach-Object {
  $p = $_
  $icon = $MassIcons[$p.icon]
  $trHtml = Mass-Lines $p.lines
  $ma = @{ 'gather' = @('bell', 'gold'); 'book' = @('lectern', 'blue'); 'gifts' = @('gifts', 'green'); 'chalice' = @('chalice', 'red'); 'host' = @('monstrance', 'gold'); 'blessing' = @('cross', 'purple') }[$p.icon]
  if (-not $ma) { $ma = @('candle', 'gold') }
  # the part's short explanation is always on screen; its words (priest and people) fold away beneath it
  $words = "<details class=`"kk-sec mass-text`"><summary><h3>Ayinin sözleri</h3>$IcoChevLg</summary>" +
    "<div class=`"kk-sec-body`"><div class=`"mass-dialogue`" data-tr>$($trHtml)</div></div></details>"
  (Ill-Sec -Id $p.id -Art $ma[0] -Tone $ma[1] -Class 'mass-sec' -Kick ("Bölüm $($p.n)") -Head ((Inline $p.title)) `
    -Sub ('') `
    -Body ("<p class=`"mass-lead`">$((Inline $p.lead))</p>" + $words)) -replace '^<section ', "<section data-part=`"$($p.n)`" "
}) -join "`n"
$massBody = @"
<div class="wrap narrow ill-page">
  $(Crumbs 'Kutsal Ayin')
  <header class="page-head center">$(Page-Ico $IcoChalice)<h1>$($Mass.title)</h1></header>
  <p class="faq-intro">$((Inline $Mass.intro))</p>
  <p class="mass-video-note">$IcoPlay Ayinin akışını izleyerek takip etmek isterseniz <a href=`"https://www.youtube.com/watch?v=RS8NrJ0Y5O8`" target=`"_blank`" rel=`"noopener`">bu İngilizce video</a> yardımcı olabilir.</p>
  <nav class="mass-pills" $(TA 'aria-label' 'Ayinin bölümleri') data-mass-pills>$massPillsHtml</nav>
  <div class="mass-parts" data-mass-parts>
$massPartsHtml
  </div>
</div>
"@
Write-Page -File 'kutsal-ayin.html' -Title "$($Mass.title) | $SiteName" `
  -Description "Kutsal Ayin$($Apos)in sırası: cemaatin toplanmasından son takdise, Kutsal Kitabın okunmasından Efkaristiya$($Apos)nın kutsanmasına dek altı bölüm." `
  -Path 'kutsal-ayin.html' -Body $massBody -JsonLd @((Breadcrumb-Ld 'Kutsal Ayin' 'kutsal-ayin.html'))

# ================================================================== ISA'NIN MESELLERI (meseller.html)
$Parables = Read-Data 'meseller.js'
$ParableIcons = @{
  sprout = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V11.5"/><path d="M12 11.5C12 7 8.4 5.8 5 5.8 5 10.4 7.8 11.5 12 11.5z"/><path d="M12 11.5c0-3.6 2.7-4.6 5.5-4.6 0 3.6-1.9 4.6-5.5 4.6z"/></svg>'
  heart  = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.3s-7.3-4.5-9.6-9.1C.9 7.6 2.6 4.5 5.8 4c2-.3 3.9.8 6.2 3.2C14.3 4.8 16.2 3.7 18.2 4c3.2.5 4.9 3.6 3.4 7.2-2.3 4.6-9.6 9.1-9.6 9.1z"/></svg>'
  prayer = $IcoPrayers
  lamp   = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c2 2.4 3.1 4.4 3.1 6.3a3.1 3.1 0 1 1-6.2 0C8.9 7.4 10 5.4 12 3z"/><path d="M8.2 18.6h7.6M9.6 15.6h4.8"/></svg>'
  coins  = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6.3" rx="7" ry="2.6"/><path d="M5 6.3v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-5"/><path d="M5 11.3v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-5"/></svg>'
  door   = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21V9a6 6 0 0 1 12 0v12"/><path d="M4 21h16"/><circle cx="14.3" cy="14" r=".9" fill="currentColor" stroke="none"/></svg>'
}
$script:MeselN = 0
$meselToc = ($Parables.categories | ForEach-Object { "<li><a href=`"#$($_.id)`">$((Inline $_.title))</a></li>" }) -join ''
$meselCats = ($Parables.categories | ForEach-Object {
  $script:MeselN++; $cat = $_
  $icon = $ParableIcons[$cat.icon]
  $items = ($cat.items | ForEach-Object {
    "<details class=`"mira-item`" id=`"$($_.id)`"><summary><span class=`"mira-ico`">$icon</span><span class=`"mira-head`"><span class=`"mira-name`">$((Inline $_.name))</span><span class=`"mira-place label`">$($_.ref)</span></span>$IcoChevLg</summary><div class=`"mira-bio`">$((Blocks $_.bio))</div></details>"
  }) -join "`n"
  $ma = @{ 'hukumdarlik' = @('wheat', 'gold'); 'merhamet' = @('sheep', 'green'); 'dua' = @('knock', 'purple'); 'uyaniklik' = @('oillamp', 'blue'); 'sorumluluk' = @('grapes', 'red'); 'cagri' = @('feast', 'gold') }[$cat.id]
  if (-not $ma) { $ma = @('book', 'gold') }
  $cnt = @($cat.items).Count
  Ill-Sec -Id $cat.id -Art $ma[0] -Tone $ma[1] -Class 'mira-cat' -Kick ("$cnt mesel") -Head ((Inline $cat.title)) `
    -Sub ('') `
    -Body ("<p class=`"faq-intro`">$((Inline $cat.lead))</p>" + "<div class=`"mira-list`">$items</div>")
}) -join "`n"
$MeselTitle = "İsa$($Apos)nın Meselleri"
$meselBody = @"
<div class="wrap narrow ill-page">
  $(Crumbs $MeselTitle)
  <header class="page-head center">$(Page-Ico $IcoBookOpen)<h1>$($Parables.title)</h1></header>
  <p class="faq-intro">$((Inline $Parables.intro))</p>
  <nav class="faq-toc is-sticky" $(TA 'aria-label' 'Kategoriler')><ul>$meselToc</ul></nav>
$meselCats
</div>
"@
Write-Page -File 'meseller.html' -Title "$($Parables.title) | $SiteName" `
  -Description "Mesih İsa$($Apos)nın İnciller$($Apos)deki başlıca meselleri: kısaca yeniden anlatılmış ve konularına göre bölümlere ayrılmış, düz bir dille açıklanmış otuz ikisi bir arada." `
  -Path 'meseller.html' -Body $meselBody -JsonLd @((Breadcrumb-Ld $MeselTitle 'meseller.html'))

# ================================================================== TESBIH DUASI (tesbih-duasi.html)
# An interactive tracker (a full 59-bead rosary as inline SVG, walked prayer by prayer by
# initRosaryTracker() in assets/script.js) followed by the prayers as collapsible cards,
# grouped into the order they are said: opening, each decade (said five times), close.
#
# Bead ids are what the script keys on: #crucifix, #intro-bead-1..5 (pendant, from the
# crucifix up), #centerpiece, #decade-N-bead-1..10, and #decade-N-our-father for decades
# 2-5 (decade 1's Our Father is #intro-bead-5, the pendant bead next to the centerpiece).
function Rosary-Svg([string]$label) {
  $cx = 180.0; $cy = 200.0; $a = 150.0; $b = 178.0
  $rS = 6.5; $rL = 10.0
  $fmt = { param($v) ([Math]::Round($v, 1)).ToString([Globalization.CultureInfo]::InvariantCulture) }
  # Loop items in prayer order: from the centerpiece at the bottom, counter-clockwise on screen.
  $items = @(@{ id = 'centerpiece'; kind = 'medal'; s = 26.0 })
  for ($d = 1; $d -le 5; $d++) {
    if ($d -gt 1) { $items += @{ id = "decade-$d-our-father"; kind = 'lg'; s = 2 * $rL } }
    for ($k = 1; $k -le 10; $k++) { $items += @{ id = "decade-$d-bead-$k"; kind = 'sm'; s = 2 * $rS } }
  }
  # Beads are spaced by arc length (an ellipse's angle parameter would bunch them at the ends).
  $N = 3600; $arc = [double[]]::new($N + 1); $ptX = [double[]]::new($N + 1); $ptY = [double[]]::new($N + 1)
  for ($j = 0; $j -le $N; $j++) {
    $t = (90.0 - 360.0 * $j / $N) * [Math]::PI / 180.0
    $ptX[$j] = $cx + $a * [Math]::Cos($t); $ptY[$j] = $cy + $b * [Math]::Sin($t)
    if ($j -gt 0) { $arc[$j] = $arc[$j - 1] + [Math]::Sqrt([Math]::Pow($ptX[$j] - $ptX[$j - 1], 2) + [Math]::Pow($ptY[$j] - $ptY[$j - 1], 2)) }
  }
  $sumS = 0.0; foreach ($it in $items) { $sumS += $it.s }
  $gap = ($arc[$N] - $sumS) / $items.Count
  $pos = 0.0; $j = 0; $order = @{}; $seq = 0
  # Prayer order for the staggered "complete" shimmer (--i): pendant first, then the loop.
  foreach ($id in @('crucifix', 'intro-bead-1', 'intro-bead-2', 'intro-bead-3', 'intro-bead-4', 'intro-bead-5')) { $order[$id] = $seq; $seq++ }
  for ($i = 1; $i -lt $items.Count; $i++) { $order[$items[$i].id] = $seq; $seq++ }
  $order['centerpiece'] = $seq
  $loop = New-Object Text.StringBuilder
  for ($i = 0; $i -lt $items.Count; $i++) {
    if ($i -gt 0) { $pos += $items[$i - 1].s / 2 + $gap + $items[$i].s / 2 }
    while ($j -lt $N -and $arc[$j + 1] -lt $pos) { $j++ }
    $f = if ($arc[$j + 1] -gt $arc[$j]) { ($pos - $arc[$j]) / ($arc[$j + 1] - $arc[$j]) } else { 0 }
    $bx = & $fmt ($ptX[$j] + ($ptX[$j + 1] - $ptX[$j]) * $f); $by = & $fmt ($ptY[$j] + ($ptY[$j + 1] - $ptY[$j]) * $f)
    $it = $items[$i]
    if ($it.kind -eq 'medal') { continue }
    $r = if ($it.kind -eq 'lg') { $rL } else { $rS }
    [void]$loop.Append("<circle id=`"$($it.id)`" class=`"bead $($it.kind) unprayed`" cx=`"$bx`" cy=`"$by`" r=`"$r`" style=`"--i:$($order[$it.id])`"></circle>")
  }
  $my = $cy + $b
  $pend = @(
    @{ id = 'intro-bead-5'; kind = 'lg'; y = 413.0 }, @{ id = 'intro-bead-4'; kind = 'sm'; y = 439.5 },
    @{ id = 'intro-bead-3'; kind = 'sm'; y = 462.5 }, @{ id = 'intro-bead-2'; kind = 'sm'; y = 485.5 },
    @{ id = 'intro-bead-1'; kind = 'lg'; y = 512.0 }
  ) | ForEach-Object {
    $r = if ($_.kind -eq 'lg') { $rL } else { $rS }
    "<circle id=`"$($_.id)`" class=`"bead $($_.kind) unprayed`" cx=`"180`" cy=`"$($_.y)`" r=`"$r`" style=`"--i:$($order[$_.id])`"></circle>"
  }
  return "<svg class=`"rt-svg`" viewBox=`"0 0 360 624`" role=`"img`" $label focusable=`"false`">" +
    "<ellipse class=`"chain`" cx=`"$cx`" cy=`"$cy`" rx=`"$a`" ry=`"$b`"></ellipse>" +
    "<path class=`"chain`" d=`"M180 $my V 540`"></path>" +
    # The glow behind whichever bead is being prayed: a soft disc that script.js moves to that bead.
    # (A CSS drop-shadow on the bead itself would be simpler, but Safari ignores filters on SVG shapes.)
    "<defs><radialGradient id=`"rt-halo-g`"><stop class=`"rt-halo-in`" offset=`"0`"/><stop class=`"rt-halo-mid`" offset=`".45`"/><stop class=`"rt-halo-out`" offset=`"1`"/></radialGradient></defs>" +
    "<circle class=`"rt-halo`" cx=`"180`" cy=`"568`" r=`"44`" fill=`"url(#rt-halo-g)`"></circle>" +
    "<g id=`"rt-loop`">$($loop.ToString())</g>" +
    "<g id=`"rt-pendant`">$($pend -join '')" +
    "<g id=`"centerpiece`" class=`"bead medal unprayed`" data-cx=`"180`" data-cy=`"$my`" data-r=`"15`" style=`"--i:$($order['centerpiece'])`">" +
      "<ellipse cx=`"180`" cy=`"$my`" rx=`"12`" ry=`"15`"></ellipse><path class=`"medal-mark`" d=`"M173.5 384 V372.5 L180 379.5 L186.5 372.5 V384`"></path></g>" +
    "<g id=`"crucifix`" class=`"bead cross active`" data-cx=`"180`" data-cy=`"568`" data-r=`"36`" style=`"--i:0`">" +
      "<rect x=`"173`" y=`"532`" width=`"14`" height=`"80`" rx=`"3`"></rect><rect x=`"154`" y=`"549`" width=`"52`" height=`"14`" rx=`"3`"></rect></g>" +
    "</g></svg>"
}

# The tracker block. The sheet is server-rendered on its first step (the Sign of the Cross)
# so it never paints empty; the script takes over once data/tespih.js has loaded.
function Rosary-Tracker {
  $first = $PrayerById['hac-isareti']
  # the list's names are set by script.js in the language shown; Turkish until then
  $opts = ($Rosary.sets | ForEach-Object { "<option value=`"$($_.id)`" data-days=`"$($_.days -join ',')`">$($_.tr)</option>" }) -join ''
  return @"
  <section class="rt" id="tesbih-rehberi" aria-labelledby="rt-h">
    <h2 class="visually-hidden" id="rt-h">Adım Adım Tesbih</h2>
    <div class="rt-bar">
      <label class="rt-select"><span class="label">Gizemler</span><select id="rt-set">$opts</select></label>
      <button type="button" class="rt-restart">$IcoRefresh<span>Baştan başla</span></button>
    </div>
    <div class="rt-body">
      <div class="rt-stage">
        $(Rosary-Svg (TA 'aria-label' 'Beş onluklu tesbih: bir taneye geçmek için dokunun'))
        <div class="rt-center" aria-hidden="true"><p class="rt-c-set"></p><p class="rt-c-count"></p><p class="rt-c-myst">Giriş</p></div>
      </div>
      <div class="rt-sheet glass" role="region" $(TA 'aria-label' 'Dua paneli')>
        <button type="button" class="rt-grip" aria-expanded="true" aria-controls="rt-text" $(TA 'aria-label' 'Dua metnini gizle')><span></span></button>
        <div class="rt-progress" aria-hidden="true"><span></span></div>
        <p class="rt-resume" hidden></p>
        <p class="rt-context label">Giriş</p>
        <p class="rt-mystery" hidden><span class="rt-m-label"></span><span class="rt-m-title"></span></p>
        <h3 class="rt-title">$((Inline $first.tr.title))</h3>
        <div class="rt-text" id="rt-text">$(((Verse $first.tr.text) -replace '<br>', ' <br>'))</div>
        <div class="rt-nav">
          <button type="button" class="rt-prev" disabled $(TA 'aria-label' 'Önceki') $(TA 'title' 'Önceki')>$IcoPrev</button>
          <button type="button" class="rt-next" $(TA 'aria-label' 'Sonraki') $(TA 'title' 'Sonraki')>$IcoNext</button>
        </div>
        <p class="visually-hidden rt-live" aria-live="polite"></p>
      </div>
    </div>
  </section>
"@
}
# each set of mysteries with a drawing of its own: the star of Bethlehem, Mount Tabor's light, the
# crown of thorns, the dove of Pentecost
$MystArt = @{ 'sevinc' = @('star', 'blue'); 'isik' = @('tabor', 'gold'); 'aci' = @('thorns', 'red'); 'yucelik' = @('dove', 'purple') }
$mysterySets = ($Rosary.sets | ForEach-Object {
  $items = ($_.items | ForEach-Object { "<li><span class=`"m-tr`">$((Inline $_.tr))</span></li>" }) -join ''
  $ma = $MystArt[$_.id]
  "<article class=`"myst ill-card tone-$($ma[1])`" data-days=`"$($_.days -join ',')`" id=`"gizem-$($_.id)`">" +
    "$(Ill-Art $ma[0])<header><h3>$((Inline $_.tr))</h3><p class=`"m-day label`">$($_.dayTr)</p></header>" +
    "<ol class=`"myst-list`">$items</ol></article>"
}) -join "`n"
$stepList = ($Rosary.steps | ForEach-Object {
  "<li><span class=`"s-tr`">$((Inline $_.tr))</span></li>"
}) -join ''

$PrayerById = @{}
$Rosary.prayers | ForEach-Object { $PrayerById[$_.id] = $_ }
# Two short plain paragraphs around the steps (the prayers themselves come from the script),
# so search engines see what the page is about; the history page carries the long story
$rosaryLead = if ($Rosary.about) { '<p class="rosary-note">' + ($Rosary.about.tr) + '</p>' } else { '' }
$rosaryTip = if ($Rosary.about.tipTr) { '<p class="rosary-note">' + ($Rosary.about.tipTr) + '</p>' } else { '' }
$tespihBody = @"
<div class="wrap narrow" data-no-jl>
  $(Crumbs 'Tesbih Duası')
  <h1 class="visually-hidden">$($Rosary.title)</h1>
$(Rosary-Tracker)
  <h2 class="section-title" id="gizemler">Gizemler</h2>
  <div class="myst-grid">
$mysterySets
  </div>
  <h2 class="section-title" id="nasil">Tesbih nasıl dua edilir?</h2>
  $rosaryLead
  <ol class="steps">$stepList</ol>
  $rosaryTip
  <a class="text-link th-link" href="tesbih-tarihi.html"><span class="label">Okuyun</span><span class="t-title">Tesbihin Tarihi</span><span class="t-sub">İncil$($Apos)deki kökünden Aziz Dominik$($Apos)e, İnebahtı$($Apos)dan Fatima$($Apos)ya</span></a>
  <p class="conventions">Dua metinleri, İstanbul$($Apos)daki Sant$($Apos)Antuan (Aziz Antuan) Bazilikası$($Apos)nda tesbih duası için kullanılan Türkçe gelenek esas alınarak düzenlenmiştir.</p>
</div>
"@
Write-Page -File 'tesbih-duasi.html' -Title "$($Rosary.title) | $SiteName" `
  -Description "Meryem Ana Tesbih Duası: dualar, Sevinç, Işık, Acı ve Yücelik gizemleri ve tesbihin nasıl dua edileceği." `
  -Path 'tesbih-duasi.html' -Body $tespihBody -JsonLd @((Breadcrumb-Ld 'Tesbih Duası' 'tesbih-duasi.html'))

# ================================================================== TESBIHIN TARIHI (tesbih-tarihi.html)
# The history of the Rosary, linked from the Tesbih Duası page under its intro. Read like the
# Cevap Ver pages (numbered sections, quotes, sources); the two lists of Bible references fold away.
$RosaryHistory = Read-Data 'tesbih-tarihi.js'
function Th-Inline([string]$s) { return [regex]::Replace([regex]::Replace($s, '\*\*(.+?)\*\*', '<strong>$1</strong>'), '(?<![\*\w])\*([^*]+)\*(?!\*)', '<em>$1</em>') }
# One paragraph per line; "- " list item, "> " quotation, "[[+ Title]] ... [[-]]" a part that folds away
function Th-Blocks([string]$s) {
  $sb = New-Object Text.StringBuilder; $list = New-Object Collections.ArrayList
  $flush = { if ($list.Count) { [void]$sb.Append('<ul>' + (($list | ForEach-Object { "<li>$(Th-Inline $_)</li>" }) -join '') + '</ul>'); $list.Clear() } }
  foreach ($line in ($s -split "`n")) {
    $l = $line.Trim(); if (-not $l) { continue }
    if ($l.StartsWith('- ')) { [void]$list.Add($l.Substring(2)); continue }
    . $flush
    if ($l -match '^\[\[\+ (.+)\]\]$') { [void]$sb.Append("<details class=`"faq-item th-fold`"><summary><span class=`"faq-q`">$($Matches[1])</span>$IcoChevLg</summary><div class=`"faq-a`">"); continue }
    if ($l -eq '[[-]]') { [void]$sb.Append('</div></details>'); continue }
    if ($l.StartsWith('> ')) { [void]$sb.Append("<blockquote class=`"ic-quote`"><p>$(Th-Inline $l.Substring(2))</p></blockquote>"); continue }
    [void]$sb.Append("<p>$(Th-Inline $l)</p>")
  }
  . $flush
  return $sb.ToString()
}
# The closing line (to the bead-by-bead guide) ends the last section
$thToGuide = { param($s, $name) $s.Replace($name, "<a href=`"tesbih-duasi.html#tesbih-rehberi`">$name</a>") }
$thClosing = "<p class=`"th-closing`">$(& $thToGuide $RosaryHistory.closing 'Adım Adım Tesbih')</p>"
$thAll = @($RosaryHistory.sections)
# The thirteen sections in six illustrated parts (Ill-Sec); each section keeps its own anchor and heading
$thParts = @(
  @{ id = 'baslangic'; art = 'rose'; tone = 'red'; k = 'Başlangıç'; h = "Gül bahçesinden İncil$($Apos)e"; s = @('adi', 'kokleri', 'bos-tekrar') },
  @{ id = 'orta-cag'; art = 'beads'; tone = 'gold'; k = 'Orta Çağ'; h = "Çakıl taşlarından Aziz Dominik$($Apos)e"; s = @('cakil-taslari', 'aziz-dominik', 'yeniden-dogus') },
  @{ id = 'inebahti-ve-sonrasi'; art = 'ship'; tone = 'blue'; k = '1571 ve sonrası'; h = 'İnebahtı ve dünyaya yayılış'; s = @('inebahti', 'dunyaya-yayilan') },
  @{ id = 'gorunmeler'; art = 'mary'; tone = 'purple'; k = '19. ve 20. yüzyıl'; h = 'Bartolo Longo, Lourdes ve Fatima'; s = @('bartolo-longo', 'lourdes-fatima') },
  @{ id = 'gunumuz'; art = 'candle'; tone = 'green'; k = 'Bugün'; h = 'Işık Gizemleri ve tesbihin özü'; s = @('ioannes-paulus', 'tesbihin-ozu') },
  @{ id = 'savas'; art = 'shield'; tone = 'red'; k = 'Ruhsal savaş'; h = "Şeytan $([char]0x201C)Selam Sana Meryem$([char]0x201D)den neden korkar?"; s = @('ruhsal-savas') }
)
$thById = @{}; foreach ($x in $thAll) { $thById[$x.id] = $x }
$thLast = $thAll[-1].id
$thSecs = ($thParts | ForEach-Object {
  $pt = $_
  $inner = ($pt.s | ForEach-Object {
    $x = $thById[$_]
    $end = if ($x.id -eq $thLast) { $thClosing } else { '' }
    $head = if (@($pt.s).Count -gt 1) { "<h3 class=`"ic-sec-t`"><span>$($x.title)</span></h3>" } else { "<h3 class=`"ic-sec-t visually-hidden`"><span>$($x.title)</span></h3>" }
    "<section class=`"ic-sec th-sub`" id=`"$($x.id)`">$head" +
      "<div class=`"prose ill-prose`">$(((Th-Blocks $x.body) + $end))</div></section>"
  }) -join ''
  Ill-Sec -Id $pt.id -Art $pt.art -Tone $pt.tone -Kick ($pt.k) -Head ($pt.h) -Class 'th-part' -Body $inner
}) -join "`n"
$thSources = (@($RosaryHistory.sources) | ForEach-Object {
  "<h3 class=`"th-src-g`">$($_.g)</h3><ul>" + ((@($_.items) | ForEach-Object { "<li>$((Th-Inline $_[0]))</li>" }) -join '') + '</ul>'
}) -join ''
$thBody = @"
<div class="wrap narrow ic-page th-page ill-page">
  $(Crumbs 'Tesbihin Tarihi' 'Tesbih Duası' 'tesbih-duasi.html')
  <header class="page-head center" id="bas">$(Page-Ico $IcoBeads)<h1>$($RosaryHistory.title)</h1></header>
  <figure class="quote th-quote"><blockquote><p>$($RosaryHistory.quote)</p></blockquote><figcaption class="attr">$($RosaryHistory.quoteBy)</figcaption></figure>
$thSecs
  <section class="ic-sources" aria-labelledby="th-kaynak-h"><h2 class="section-title" id="th-kaynak-h">Kaynaklar</h2>$thSources</section>
</div>
"@
$thLd = '{"@context":"https://schema.org","@type":"Article","headline":"Tesbihin Tarihi","inLanguage":"tr","mainEntityOfPage":' + (JStr "$SiteUrl/tesbih-tarihi.html") + '}'
Write-Page -File 'tesbih-tarihi.html' -Title "Tesbihin Tarihi | $SiteName" `
  -Description "Tesbihin tarihi: Kutsal Kitap'taki kökleri, çakıl taşlarından boncuklara, Aziz Dominik, İnebahtı, Lourdes, Fatima, Işık Gizemleri ve ruhsal savaş." `
  -Path 'tesbih-tarihi.html' -Body $thBody -JsonLd @($thLd, (Breadcrumb-Ld 'Tesbihin Tarihi' 'tesbih-tarihi.html' 'Tesbih Duası' 'tesbih-duasi.html')) -OgType 'article'

# ================================================================== KILISE'NIN TARIHI (kilise-tarihi.html)
# The whole of data/kilise-tarihi.json as one article: an era bar to jump with, then each era
# (its years, a short introduction) and its events down a line of dates, each with its picture,
# its short line and the full story. The home page's strip links each event here (#olay-N).
$ktN = 0; $ktEraNav = New-Object System.Collections.Generic.List[string]
$ktEras = ($Tarih.eras | ForEach-Object {
  $era = $_
  $ktEraNav.Add("<a href=`"#donem-$($era.id)`"><span class=`"kt-en`">$($era.t)</span><span class=`"kt-ey`">$($era.span)</span></a>")
  $evs = ($Tarih.items | Where-Object { $_.era -eq $era.id } | ForEach-Object {
    $it = $_; $script:ktN++
    $g = $TarihImg.($it.img)
    $cap = if ($g) { "<figcaption>$($g.a) · <cite>$($g.t)</cite></figcaption>" } else { '' }
    $more = if ($it.link) { "<a class=`"kt-more`" href=`"$($it.link)`">Devamını okuyun<svg viewBox=`"0 0 24 24`" aria-hidden=`"true`" fill=`"none`" stroke=`"currentColor`" stroke-width=`"2`" stroke-linecap=`"round`" stroke-linejoin=`"round`"><path d=`"m9 6 6 6-6 6`"/></svg></a>" } else { '' }
    "<li class=`"kt-ev`" id=`"olay-$script:ktN`"><span class=`"kt-dot`" aria-hidden=`"true`"></span>" +
      "<figure class=`"kt-img`"><img src=`"assets/art/tl/$($it.img).jpg`" alt=`"`" width=`"600`" height=`"400`" loading=`"lazy`" decoding=`"async`">$cap</figure>" +
      "<div class=`"kt-body`"><p class=`"kt-y`">$($it.y)</p><h3 class=`"kt-t`">$($it.t)</h3><p class=`"kt-s`">$($it.s)</p><p class=`"kt-d`">$($it.d)</p>$more</div></li>"
  }) -join ''
  "<section class=`"kt-era`" id=`"donem-$($era.id)`" aria-labelledby=`"donem-$($era.id)-h`"><header class=`"kt-era-head`"><p class=`"kt-span`">$($era.span)</p>" +
    "<h2 id=`"donem-$($era.id)-h`">$($era.t)</h2><p class=`"kt-intro`">$($era.intro)</p></header><ol class=`"kt-list`">$evs</ol></section>"
}) -join "`n"
$ktBody = @"
<div class="wrap kt-page">
  <header class="page-head center" id="bas">$(Page-Ico $IcoHourglass)<h1>Kilise$($Apos)nin Tarihi</h1><p class="sub">Pentikost$($Apos)tan II. Vatikan Konsili$($Apos)ne, $ktN olay.</p></header>
  <nav class="kt-nav" $(TA 'aria-label' 'Dönemler')>$($ktEraNav -join '')</nav>
$ktEras
  <p class="kt-end">Hikâye sürüyor. Devamı için <a href=`"topraklarimizda-hristiyanlik.html`">Topraklarımızda Hristiyanlık</a> ve <a href=`"azizler.html`">Azizler</a>.</p>
</div>
"@
$ktLd = '{"@context":"https://schema.org","@type":"Article","headline":"Kilise' + "'" + 'nin Tarihi","inLanguage":"tr","mainEntityOfPage":' + (JStr "$SiteUrl/kilise-tarihi.html") + '}'
Write-Page -File 'kilise-tarihi.html' -Title "Kilise$($Apos)nin Tarihi | $SiteName" `
  -Description "Kilise'nin tarihi: Pentikost'tan İznik ve Efes konsillerine, manastırlardan Trento'ya, I. ve II. Vatikan konsillerine kadar $ktN olay, tablolarıyla." `
  -Path 'kilise-tarihi.html' -Body $ktBody -JsonLd @($ktLd, (Breadcrumb-Ld "Kilise$($Apos)nin Tarihi" 'kilise-tarihi.html')) -OgType 'article'

# ================================================================== MUCIZELER (mucizeler.html)
$Miracles = Read-Data 'mucizeler.js'
$MiracleIcons = @{
  apparition = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.2 13.3 10.7 17 12 13.3 13.3 12 16.8 10.7 13.3 7 12 10.7 10.7Z"/></svg>'
  relic      = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="3.5" width="15" height="19" rx="1.2"/><path d="M12 8.5v8M8.5 12.5h7"/></svg>'
  eucharist  = $IcoChalice
  incorrupt  = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V11a7 7 0 0 1 14 0v9"/><path d="M4 20h16"/><path d="M12 3.4v2.2M10.8 4.5h2.4"/></svg>'
}
$script:MiraN = 0
$miraToc = ($Miracles.categories | ForEach-Object { "<li><a href=`"#$($_.id)`">$((Inline $_.title))</a></li>" }) -join ''
$miraCats = ($Miracles.categories | ForEach-Object {
  $script:MiraN++; $cat = $_
  $icon = $MiracleIcons[$cat.icon]
  $items = ($cat.items | ForEach-Object {
    $mid = $_.id
    $more = if ($GreatSaintIds.ContainsKey($mid)) { $gsN = @($GreatSaints.saints | Where-Object { $_.id -eq $mid })[0]; '<a class="today-more-link" href="' + $mid + '.html">' + ('Devamını oku') + '<span class="visually-hidden">: ' + ($gsN.name) + '</span>' + $IcoNext + '</a>' } else { '' }
    "<details class=`"mira-item`" id=`"$($_.id)`"><summary><span class=`"mira-ico`">$icon</span><span class=`"mira-head`"><span class=`"mira-name`">$((Inline $_.name))</span><span class=`"mira-place label`">$($_.place)</span></span>$IcoChevLg</summary><div class=`"mira-bio`">$(Mira-Fig $_.art)$((Blocks $_.bio))$more</div></details>"
  }) -join "`n"
  $ma = @{ 'gorunmeler' = @('mary', 'blue'); 'kalintilar' = @('reliquary', 'gold'); 'efkaristiya' = @('chalice', 'red'); 'curumeyen-azizler' = @('lily', 'green') }[$cat.id]
  if (-not $ma) { $ma = @('candle', 'gold') }
  # the kicker names the places the section goes to
  $kTr = (@($cat.items) | ForEach-Object { ($_.place -split ',')[0].Trim() }) -join ' · '
  Ill-Sec -Id $cat.id -Art $ma[0] -Tone $ma[1] -Class 'mira-cat' -Kick ($kTr) -Head ((Inline $cat.title)) `
    -Sub ('') `
    -Body ("<p class=`"faq-intro`">$((Inline $cat.lead))</p>" + "<div class=`"mira-list`">$items</div>")
}) -join "`n"
$mucizelerBody = @"
<div class="wrap narrow ill-page">
  $(Crumbs 'Mucizeler')
  <header class="page-head center">$(Page-Ico $IcoSparkle)<h1>$($Miracles.title)</h1></header>
  <p class="faq-intro">$((Inline $Miracles.intro))</p>
  <nav class="faq-toc is-sticky" $(TA 'aria-label' 'Kategoriler')><ul>$miraToc</ul></nav>
$miraCats
</div>
"@
Write-Page -File 'mucizeler.html' -Title "Mucizeler | $SiteName" `
  -Description "Katolik Kilisesi$($Apos)nde bilinen mucizeler: Meryem Ana görünmeleri (Fatima, Lourdes, Guadalupe, Zeytun), Torino Kefeni, Efkaristiya mucizeleri ve çürümeyen azizler." `
  -Path 'mucizeler.html' -Body $mucizelerBody -JsonLd @((Breadcrumb-Ld 'Mucizeler' 'mucizeler.html'))

# ================================================================== KILISELER (kiliseler.html): parish locator
# The map of Turkey with the cities that have a Catholic church (kiliseler.html), and a page of
# its own for every church (kilise/<id>.html): its history, Mass times, visiting hours, contact
# details and the sources they came from.
$Churches = Read-Data 'kiliseler.js'
$RiteLabels = @{}
$Churches.rites | ForEach-Object { $RiteLabels[$_.id] = @{ tr = $_.tr } }
# Searches Google Maps by the church's own name and city: these are all named, independently
# mappable landmarks, so a name search resolves more reliably than a sourced street address.
function Map-Url([string]$q) { return 'https://www.google.com/maps/search/?api=1&query=' + [uri]::EscapeDataString($q) }
$IcoClock = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.2"/><path d="M12 7.4V12l3.2 2"/></svg>'
$IcoPhone = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.2 4h3.1l1.3 4-2 1.4a12.5 12.5 0 0 0 5.9 5.9l1.4-2 4 1.3v3.1a1.6 1.6 0 0 1-1.7 1.6A16.3 16.3 0 0 1 3.6 5.7 1.6 1.6 0 0 1 5.2 4Z"/></svg>'
$IcoExternalCh = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/><path d="M14 4h6v6"/><path d="M20 4 10.5 13.5"/></svg>'
$IcoWarn = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 2.6 18.2a1.6 1.6 0 0 0 1.4 2.4h16a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z"/><path d="M12 9.5v4.4"/><circle cx="12" cy="16.8" r="1" fill="currentColor" stroke="none"/></svg>'
$IcoChurch = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.6v3.1M10.6 4.1h2.8"/><path d="M5 10.8 12 6l7 4.8V21H5Z"/><path d="M9.6 21v-4.6a2.4 2.4 0 0 1 4.8 0V21"/></svg>'
$IcoMailSm = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.4" y="5.4" width="17.2" height="13.2" rx="2"/><path d="m4 7 8 6 8-6"/></svg>'
$IcoGlobe = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>'
$IcoDoor = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4.6A1.6 1.6 0 0 1 6.6 3h10.8A1.6 1.6 0 0 1 19 4.6V21"/><path d="M3 21h18"/><circle cx="15" cy="12.4" r=".9" fill="currentColor" stroke="none"/></svg>'
# a phone number as shown ("0212 244 09 35 (14:00–17:00)") and as dialled (+902122440935)
function Tel-Href([string]$p) { $d = (($p -replace '\(.*$', '') -replace '[^\d]', ''); if ($d.StartsWith('0')) { $d = $d.Substring(1) }; return "tel:+90$d" }
function Site-Host([string]$u) { return (($u -replace '^https?://(www\.)?', '') -replace '/$', '') }
# where each church belongs on phones and in the bar at the top: Keşfet, under Kilise Bul
$ChurchPages = @()
foreach ($city in $Churches.cities) { foreach ($ch in $city.churches) { $AppOf["kilise/$($ch.id).html"] = 'kesfet'; $ChurchPages += "kilise/$($ch.id).html" } }
# A city with two or more churches also gets a page of its own (kiliseler-<city>.html): the page
# "İstanbul'daki Katolik kiliseleri" searchers land on, leading to each church's page
$CityPages = @{}
foreach ($city in $Churches.cities) { if (@($city.churches).Count -ge 2) { $CityPages[$city.id] = "kiliseler-$($city.id).html"; $AppOf["kiliseler-$($city.id).html"] = 'kesfet' } }
# the city with its Turkish case ending, for the headings and the summaries
$CityLoc = @{ istanbul = "İstanbul$($Apos)da"; izmir = "İzmir$($Apos)de"; bursa = "Bursa$($Apos)da"; ankara = "Ankara$($Apos)da"; konya = "Konya$($Apos)da"; antalya = "Antalya$($Apos)da"; mersin = "Mersin$($Apos)de"; adana = "Adana$($Apos)da"; hatay = "Hatay$($Apos)da"; samsun = "Samsun$($Apos)da"; trabzon = "Trabzon$($Apos)da"; diyarbakir = "Diyarbakır$($Apos)da"; mardin = "Mardin$($Apos)de" }
$ChurchDir = Join-Path $Root 'kilise'
if (-not (Test-Path $ChurchDir)) { New-Item -ItemType Directory -Path $ChurchDir | Out-Null }
# pages of churches no longer in the data are removed, so no stale page stays online
Get-ChildItem $ChurchDir -Filter '*.html' | Where-Object { $ChurchPages -notcontains "kilise/$($_.Name)" } | Remove-Item

foreach ($city in $Churches.cities) {
  $cityName = $city.name -replace ' \(.*\)$', ''
  foreach ($ch in $city.churches) {
    $rite = $RiteLabels[$ch.rite]
    $file = "kilise/$($ch.id).html"
    # the notice: closed, or something to know before going
    $notice = ''
    if ($ch.notice) {
      $head = if ($ch.status -eq 'closed') { 'Şu anda kapalı.' } elseif ($ch.status -eq 'active') { 'Duyuru.' } else { 'Gitmeden önce.' }
      $notice = "<div class=`"ch-notice is-$($ch.status)`" role=`"note`">$IcoWarn<p><strong>$head</strong> $((Inline $ch.notice))</p></div>"
    }
    # contact: address (with a map link), phones, e-mail, website
    $mapQ = "$(Plain $ch.name), $cityName"
    $rows = New-Object Text.StringBuilder
    [void]$rows.Append("<div class=`"ch-row`"><dt>$IcoPin<span>Adres</span></dt><dd>$(Inline $ch.address)<br><a class=`"map-link`" href=`"$(Map-Url $mapQ)`" data-map-q=`"$(Attr $mapQ)`" target=`"_blank`" rel=`"noopener`">Haritada aç $IcoExternalCh</a></dd></div>")
    if (@($ch.phones).Count) {
      $ph = (@($ch.phones) | ForEach-Object { "<a href=`"$(Tel-Href $_)`">$_</a>" }) -join '<br>'
      [void]$rows.Append("<div class=`"ch-row`"><dt>$IcoPhone<span>Telefon</span></dt><dd>$ph</dd></div>")
    }
    if ($ch.email) { [void]$rows.Append("<div class=`"ch-row`"><dt>$IcoMailSm<span>E-posta</span></dt><dd><a href=`"mailto:$($ch.email)`">$($ch.email)</a></dd></div>") }
    if ($ch.website) { [void]$rows.Append("<div class=`"ch-row`"><dt>$IcoGlobe<span>Web</span></dt><dd><a href=`"$($ch.website)`" target=`"_blank`" rel=`"noopener`">$(Site-Host $ch.website) $IcoExternalCh</a></dd></div>") }
    $times = (0..(@($ch.mass).Count - 1) | ForEach-Object { $m = @($ch.mass)[$_]; "<tr><th scope=`"row`">$((Inline $m[0]))</th><td>$((Inline $m[1]))</td></tr>" }) -join ''
    $massNote = if ($ch.massNote) { "<p class=`"ch-note`">$((Inline $ch.massNote))</p>" } else { '' }
    $ocia = if ($ch.ocia) { "<section class=`"ch-sec ch-ocia`" id=`"ocia`"><h2 class=`"ch-h`">$IcoCompass Katolik Olmak İsteyenler İçin</h2><p>$((Inline $ch.ocia))</p></section>" } else { '' }
    $visits = if ($ch.visits) { "<section class=`"ch-sec`" id=`"ziyaret`"><h2 class=`"ch-h`">$IcoDoor Ziyaret</h2><p>$((Inline $ch.visits))</p></section>" } else { '' }
    $hist = ((@($ch.history) | ForEach-Object { "<p>$(Inline $_)</p>" }) -join "`n")
    $srcs = (@($ch.sources) | ForEach-Object { "<li><a href=`"$($_[1])`" target=`"_blank`" rel=`"noopener`">$((Inline $_[0]))</a></li>" }) -join ''
    # links to the other churches of the city (the same side of the Bosphorus in Istanbul), to the
    # same rite's churches elsewhere, and to the pages a visitor of a church needs next
    $sibs = @($city.churches | Where-Object { $_.id -ne $ch.id })
    if ($ch.side) { $sibs = @($sibs | Where-Object { $_.side -eq $ch.side }) }
    if ($sibs.Count -gt 8) { $sibs = @(@($sibs | Where-Object { $_.district -eq $ch.district }) + @($sibs | Where-Object { $_.district -ne $ch.district }) | Select-Object -First 8) }
    $cityHref = if ($CityPages[$city.id]) { $CityPages[$city.id] } else { 'kiliseler.html#' + $city.id }
    $cityDk = $CityLoc[$city.id] -replace 'da$', 'daki' -replace 'de$', 'deki'
    $sibLi = { param($list) ($list | ForEach-Object { $r2 = $RiteLabels[$_.rite]; "<li><a href=`"kilise/$($_.id).html`">$(Inline $_.name)</a><span>$(Inline $_.district), $($r2.tr)</span></li>" }) -join '' }
    $moreHtml = ''
    if ($sibs.Count) { $moreHtml += "<h3>$cityDk Diğer Katolik Kiliseler</h3><ul class=`"ch-links`">$(& $sibLi $sibs)</ul><p><a href=`"$cityHref`">$cityDk tüm Katolik kiliseleri</a></p>" }
    else { $moreHtml += "<p><a href=`"$cityHref`">$cityDk Katolik Kiliseleri</a></p>" }
    if ($ch.rite -ne 'latin') {
      $sameRite = @($Churches.cities | ForEach-Object { $c2 = $_; @($c2.churches) | Where-Object { $_.rite -eq $ch.rite -and $_.id -ne $ch.id -and $c2.id -ne $city.id } } | Select-Object -First 6)
      if ($sameRite.Count) { $moreHtml += "<h3>Aynı Ayin Geleneğinden Kiliseler ($($rite.tr))</h3><ul class=`"ch-links`">$(& $sibLi $sameRite)</ul>" }
    }
    $moreHtml += "<p class=`"ch-next`"><a href=`"kutsal-ayin.html`">Kutsal Ayin nasıl yapılır?</a> · <a href=`"katolik-sureci.html`">Katolik Olma Süreci</a> · <a href=`"kilise-tarihi.html`">Kilise’nin Tarihi</a> · <a href=`"kiliseler.html`">Türkiye’deki tüm kiliseler</a></p>"
    $moreSec = "<section class=`"ch-sec ch-more`" id=`"diger-kiliseler`"><h2 class=`"ch-h`">$IcoPin Yakındaki ve İlgili Sayfalar</h2>$moreHtml</section>"
    # the trail back up: home, Kilise Bul, the city's churches, this church (phones have the bar instead)
    $crumbs = "<nav class=`"crumbs`" $(TA 'aria-label' 'Bulunduğunuz yer')><ol><li><a href=`"index.html`">Ana Sayfa</a></li><li><a href=`"kiliseler.html`">Kilise Bul</a></li>" +
      $(if ($CityPages[$city.id]) { "<li><a href=`"$($CityPages[$city.id])`">$cityName</a></li>" } else { '' }) +
      "<li><span aria-current=`"page`">$(Inline $ch.name)</span></li></ol></nav>"
    $body = @"
<div class="wrap narrow">
  $crumbs
  <article class="article church-page" id="article">
    <header class="page-head center">$(Page-Ico $IcoChurch)<p class="label">$($rite.tr) · $cityName</p><h1>$((Inline $ch.name))</h1><p class="sub">$(Inline $ch.district), $cityName</p></header>
    $notice
    <section class="ch-sec ch-contact"><dl class="ch-list">$($rows.ToString())</dl></section>
    <section class="ch-sec" id="ayin-saatleri"><h2 class="ch-h">$IcoClock Ayin Saatleri</h2><table class="ch-times"><tbody>$times</tbody></table>$massNote</section>
    $visits
    $ocia
    <section class="ch-sec" id="tarihce"><h2 class="ch-h">$IcoBook Tarihçe</h2><div class="prose">$hist</div></section>
    $moreSec
    <section class="ch-sec ch-sources" id="kaynaklar"><h2 class="ch-h">Kaynaklar</h2><ul>$srcs</ul>
      <p class=`"conventions`">Son kontrol: $($Churches.updated). Ayin ve ziyaret saatleri bayramlarda ve mevsime göre değişebilir; gitmeden önce kiliseyle teyit edin. Bir hata gördüyseniz <a href=`"iletisim.html`">bize bildirin</a>.</p></section>
  </article>
  <p class="ch-back"><a class="btn" href="kiliseler.html#harita">$IcoPin Kilise Bul haritasına dön</a></p>
</div>
"@
    $nm = Plain $ch.name
    $tTail = if ($ch.status -eq 'closed') { 'Tarihçe ve Bilgi' } else { 'Ayin Saatleri ve Tarihçe' }
    $pgTitle = "$($nm), $($cityName): $tTail"
    if ($pgTitle.Length -gt 60) { $pgTitle = "$($nm): $tTail" }
    if ($pgTitle.Length -gt 60) { $pgTitle = "$($nm), $cityName" }
    $massSum = ((@($ch.mass) | Select-Object -First 2 | ForEach-Object { "$(Plain $_[0]) $(Plain $_[1])" }) -join '; ')
    $what = if ($ch.visits) { 'ayin ve ziyaret saatleri, adres ve tarihçe' } else { 'ayin saatleri, adres ve tarihçe' }
    $desc = "$nm, $(Plain $ch.district), $($cityName): $what." + $(if ($massSum) { " $massSum." } else { '' })
    $ogCard = if (Test-Path (Join-Path $Root "assets/og/$($ch.id).jpg")) { "assets/og/$($ch.id).jpg" } else { '' }
    $ogImgUrl = if ($ogCard) { "$SiteUrl/$ogCard" } else { "$SiteUrl/assets/og-image.jpg" }
    $same = @(); if ($ch.website) { $same += $ch.website }
    foreach ($sr in @($ch.sources)) { if ($sr[1] -match 'wikipedia\.org') { $same += $sr[1] } }
    $tels = @(@($ch.phones) | ForEach-Object { (Tel-Href $_) -replace '^tel:', '' })
    $ld = '{"@context":"https://schema.org","@type":"Church","@id":' + (JStr "$SiteUrl/$file#church") + ',"name":' + (JStr $nm) +
      ',"description":' + (JStr (Meta-Trim (Plain @($ch.history)[0]) 300)) +
      ',"address":{"@type":"PostalAddress","streetAddress":' + (JStr (Plain $ch.address)) + ',"addressLocality":' + (JStr $cityName) + ',"addressCountry":"TR"}' +
      ',"containedInPlace":{"@type":"City","name":' + (JStr $cityName) + '}' + ',"image":' + (JStr $ogImgUrl) +
      $(if ($tels.Count -eq 1) { ',"telephone":' + (JStr $tels[0]) } elseif ($tels.Count -gt 1) { ',"telephone":[' + (($tels | ForEach-Object { JStr $_ }) -join ',') + ']' } else { '' }) +
      $(if ($ch.email) { ',"email":' + (JStr $ch.email) } else { '' }) +
      $(if ($same.Count -eq 1) { ',"sameAs":' + (JStr $same[0]) } elseif ($same.Count -gt 1) { ',"sameAs":[' + (($same | ForEach-Object { JStr $_ }) -join ',') + ']' } else { '' }) +
      ',"url":' + (JStr "$SiteUrl/$file") + '}'
    $mod = Page-LastMod $file
    $wp = '{"@context":"https://schema.org","@type":"WebPage","@id":' + (JStr "$SiteUrl/$file") + ',"url":' + (JStr "$SiteUrl/$file") + ',"name":' + (JStr $pgTitle) + ',"inLanguage":"tr"' +
      $(if ($mod) { ',"dateModified":"' + $mod + '"' } else { '' }) + ',"about":{"@id":' + (JStr "$SiteUrl/$file#church") + '},"isPartOf":{"@type":"WebSite","name":' + (JStr $SiteName) + ',"url":' + (JStr "$SiteUrl/") + '}}'
    Write-Page -File $file -Title "$pgTitle | $SiteName" -Description (Meta-Trim $desc) -Path $file -Body $body `
      -JsonLd @($ld, $wp, (Breadcrumb-Ld $nm $file 'Kilise Bul' 'kiliseler.html')) -OgType 'article' -RootRelative $true `
      -OgImagePath $ogCard -OgImageAlt "$nm, $($cityName): Katolik kilisesi"
  }
}

# ---------------- A page for each city with two or more churches (kiliseler-<city>.html): the list
# with every church's Mass times, each leading to the church's page; searchers' "<city> kilise" and
# "<city> Catholic church" land here. A line in English tells English-speaking visitors what it is.
$CpSide = @{ avrupa = 'Avrupa Yakası'; anadolu = 'Anadolu Yakası'; merkez = 'Şehir merkezi'; selcuk = 'Selçuk (Efes)' }
foreach ($city in $Churches.cities) {
  $cf = $CityPages[$city.id]; if (-not $cf) { continue }
  $cn = $city.name -replace ' \(.*\)$', ''; $cnEn = if ($city.nameEn) { $city.nameEn } else { $cn }
  $cdaki = $CityLoc[$city.id] -replace 'da$', 'daki' -replace 'de$', 'deki'
  $n = @($city.churches).Count
  $parts = @(); $partsEn = @()
  foreach ($r in $Churches.rites) { $k = @($city.churches | Where-Object { $_.rite -eq $r.id }).Count; if ($k) { $parts += "$k $($r.tr)"; $partsEn += "$k $($r.en)" } }
  $li = { param($list) ($list | ForEach-Object {
      $c = $_; $mass = (@($c.mass) | ForEach-Object { "$(Inline $_[0]): $(Inline $_[1])" }) -join '; '
      $closed = if ($c.status -eq 'closed') { "<strong class=`"cp-closed`">Şu anda kapalı.</strong> " } else { '' }
      $massHtml = ''; if ($mass) { $massHtml = '<span class="cp-k">Ayin:</span> ' + $mass }
      "<li class=`"cp-ch`"><h3><a href=`"kilise/$($c.id).html`">$(Inline $c.name)</a></h3><p class=`"cp-meta`">$($RiteLabels[$c.rite].tr) · $(Inline $c.district)</p><p>$closed$massHtml</p></li>" }) -join '' }
  $sides = @($city.churches | Where-Object { $_.side } | ForEach-Object { $_.side } | Select-Object -Unique)
  if ($sides.Count -gt 1) {
    $lists = ($sides | ForEach-Object { $sd = $_; "<section class=`"ch-sec`"><h2 class=`"ch-h`">$IcoPin $($CpSide[$sd])</h2><ul class=`"cp-list`">$(& $li @($city.churches | Where-Object { $_.side -eq $sd }))</ul></section>" }) -join "`n"
  } else { $lists = "<section class=`"ch-sec`"><h2 class=`"ch-h`">$IcoPin Kiliseler</h2><ul class=`"cp-list`">$(& $li @($city.churches))</ul></section>" }
  $others = (($Churches.cities | Where-Object { $CityPages[$_.id] -and $_.id -ne $city.id } | ForEach-Object { "<a href=`"$($CityPages[$_.id])`">$($_.name -replace ' \(.*\)$', '')</a>" }) -join ' · ')
  $othersHtml = ''; if ($others) { $othersHtml = '      <p class="ch-next">Diğer şehirler: ' + $others + '</p>' }
  $cpCrumbs = "<nav class=`"crumbs`" $(TA 'aria-label' 'Bulunduğunuz yer')><ol><li><a href=`"index.html`">Ana Sayfa</a></li><li><a href=`"kiliseler.html`">Kilise Bul</a></li><li><span aria-current=`"page`">$cn</span></li></ol></nav>"
  $cpBody = @"
<div class="wrap narrow">
  $cpCrumbs
  <article class="article church-page" id="article">
    <header class="page-head center">$(Page-Ico $IcoChurch)<p class="label">Kilise Bul</p><h1>$cdaki Katolik Kiliseleri</h1><p class="sub">$n kilise: $($parts -join ', ')</p></header>
    <p class="cp-lead">$cn şehrindeki Katolik kiliselerinin adresi, telefonu, ayin saatleri, ziyaret bilgisi ve tarihçesi, kilise kilise. Her kilisenin kendi sayfasında harita bağlantısı ve kaynaklar da var.</p>
    <p class="cp-lead" lang="en">Catholic churches in $($cnEn): $n churches ($($partsEn -join ', ')), with addresses, Mass times, visiting information and history. The church pages are in Turkish; Mass times are given as day and hour.</p>
$lists
    <section class="ch-sec ch-more"><h2 class="ch-h">$IcoCompass İlgili Sayfalar</h2>
      <p class="ch-next"><a href="kiliseler.html#$($city.id)">$cn kiliseleri harita ve kartlarla (Türkçe ve İngilizce)</a> · <a href="kutsal-ayin.html">Kutsal Ayin nasıl yapılır?</a> · <a href="katolik-sureci.html">Katolik Olma Süreci</a></p>
$othersHtml
    </section>
    <p class="conventions">Son kontrol: $($Churches.updated). Ayin ve ziyaret saatleri bayramlarda ve mevsime göre değişebilir; gitmeden önce kiliseyle teyit edin. Bir hata gördüyseniz <a href="iletisim.html">bize bildirin</a>.</p>
  </article>
  <p class="ch-back"><a class="btn" href="kiliseler.html#harita">$IcoPin Kilise Bul haritasına dön</a></p>
</div>
"@
  $cpItems = @(); $pos = 0
  foreach ($c in $city.churches) { $pos++; $cpItems += '{"@type":"ListItem","position":' + $pos + ',"url":' + (JStr "$SiteUrl/kilise/$($c.id).html") + ',"name":' + (JStr (Plain $c.name)) + '}' }
  $cpLd = '{"@context":"https://schema.org","@type":"ItemList","name":' + (JStr "$cdaki Katolik Kiliseleri") + ',"numberOfItems":' + $n + ',"itemListElement":[' + ($cpItems -join ',') + ']}'
  $names = (@($city.churches) | Select-Object -First 3 | ForEach-Object { Plain $_.short }) -join ', '
  Write-Page -File $cf -Title "$cdaki Katolik Kiliseleri: Adres ve Ayin Saatleri | $SiteName" `
    -Description (Meta-Trim "$cdaki $n Katolik kilisesinin adresi, telefonu ve ayin saatleri: $names. Ziyaret bilgisi ve her kilisenin tarihçesi.") `
    -Path $cf -Body $cpBody -JsonLd @($cpLd, (Breadcrumb-Ld "$cdaki Katolik Kiliseleri" $cf 'Kilise Bul' 'kiliseler.html'))
}

# ---------------- The map: Turkey, fixed, with the cities that have a Catholic church. A city's dot
# lights up under the pointer and opens the list of its churches (script.js, initChurchMap), each
# name leading to the church's page. The shape is the Anatolian Roots map's outline, with the
# Marmara coast in full detail.
function KL([string]$tr, [string]$en) { return "<span class=`"kl-tr`">$tr</span><span class=`"kl-en`" lang=`"en`">$en</span>" }
function KLB([string]$tr, [string]$en) { return "<div class=`"kl-tr kl-blk`">$tr</div><div class=`"kl-en kl-blk`" lang=`"en`">$en</div>" }
function City-En($city) { if ($city.nameEn) { return $city.nameEn } else { return ($city.name -replace ' \(.*\)$', '') } }
$PickSide = @{ avrupa = @('Avrupa Yakası', 'European side'); anadolu = @('Anadolu Yakası', 'Asian side'); merkez = @('Şehir merkezi', 'City center'); selcuk = @('Selçuk (Efes)', 'Selçuk (Ephesus)') }
# the city with its Turkish case ending ("İstanbul’da", "İzmir’de"), for the headings and the summaries
$CmShape = Read-Data 'kilise-harita-sekli.js'
function Cm-Pin([double]$lat, [double]$lon) { $p = Map-XY $lat $lon; return "data-x=`"$($p[0])`" data-y=`"$($p[1])`"" }
$cmCities = New-Object Text.StringBuilder; $cmPops = New-Object Text.StringBuilder
# a city's own maps when a church stands far from the rest (its "map" in data/kiliseler.js)
$MapNames = @{ selcuk = @('Selçuk (Efes)', 'Selçuk (Ephesus)'); antakya = @('Antakya', 'Antakya (Antioch)'); iskenderun = @('İskenderun', 'İskenderun') }
# the columns of a city's list: Istanbul's two sides of the Bosphorus; İzmir and Selçuk (Efes)
$SideLabel = @{ avrupa = ('Avrupa Yakası'); anadolu = ('Anadolu Yakası'); merkez = ('Şehir merkezi'); selcuk = ('Selçuk (Efes)') }
foreach ($city in $Churches.cities) {
  $lab = $city.label; $cityName = $city.name -replace ' \(.*\)$', ''
  $aeShow = Attr ((City-En $city) + ': show churches'); $aeList = Attr ((City-En $city) + ' churches')
  $maps = @($city.churches | ForEach-Object { if ($_.map) { $_.map } else { $city.id } } | Select-Object -Unique)
  $mapsAttr = if ($maps.Count -gt 1) { ' data-maps="' + (($maps | ForEach-Object { $n = if ($MapNames[$_]) { $MapNames[$_] } else { @($cityName, (City-En $city)) }; "$_|$($n[0])|$($n[1])" }) -join ';') + '"' } else { '' }
  [void]$cmCities.Append("<g class=`"cmap-city`" data-city=`"$($city.id)`" data-open=`"$($city.open)`"$mapsAttr $(Cm-Pin $city.lat $city.lon) tabindex=`"0`" role=`"button`" aria-haspopup=`"true`" aria-expanded=`"false`" aria-controls=`"cmap-pop-$($city.id)`" $(TA 'aria-label' "$($city.name): kiliseleri göster") data-aria-en=`"$aeShow`">" +
    "<circle class=`"cc-hit`" r=`"18`"></circle><circle class=`"cc-glow`" r=`"13`"></circle><circle class=`"cc-dot`" r=`"5.5`"></circle>" +
    "<text class=`"cc-name`" x=`"$($lab[0])`" y=`"$($lab[1])`" text-anchor=`"$($lab[2])`">$($cityName)</text></g>")
  # each church also carries its place on the city map (script.js, initChurchMap): its position, the
  # map it is on (assets/sehir/<map>.json), and whether that position is only approximate or it is closed
  $li = { param($list) ($list | ForEach-Object {
    $ll = ''
    if ($_.lat) {
      $mp = if ($_.map) { $_.map } else { $city.id }
      $ll = " data-ll=`"$($_.lat) $($_.lon)`" data-map=`"$mp`""
      if ($_.approx) { $ll += ' data-approx' }
      if ($_.status -ne 'active') { $ll += " data-st=`"$($_.status)`"" }
    }
    "<li><a href=`"kilise/$($_.id).html`"$ll>$(KL (Inline $_.short) $(if ($_.shortEn) { $_.shortEn } else { Inline $_.short }))</a></li>" }) -join '' }
  $sides = @($city.churches | Where-Object { $_.side } | ForEach-Object { $_.side } | Select-Object -Unique)
  if ($sides.Count -gt 1) {
    $cols = ($sides | ForEach-Object { ,@($_, $SideLabel[$_]) } | ForEach-Object {
      $s = $_; $in = @($city.churches | Where-Object { $_.side -eq $s[0] }); $long = if ($in.Count -gt 12) { ' is-long' } else { '' }
      $rows = if ($long) { " style=`"--rows:$([Math]::Ceiling($in.Count / 2))`"" } else { '' }
      "<div class=`"cmap-pop-col$long`"><p class=`"cmap-pop-h`">$(KL $s[1] $PickSide[$s[0]][1])</p><ul$rows>$(& $li $in)</ul></div>"
    }) -join ''
  } else { $cols = "<div class=`"cmap-pop-col`"><ul>$(& $li @($city.churches))</ul></div>" }
  [void]$cmPops.Append("<div class=`"cmap-pop`" id=`"cmap-pop-$($city.id)`" role=`"group`" $(TA 'aria-label' "$($city.name) kiliseleri") data-aria-en=`"$aeList`" hidden><p class=`"cmap-pop-t`">$(KL $city.name (City-En $city))</p><div class=`"cmap-pop-cols`">$cols</div></div>")
}
# the Greek islands with a Catholic church, each a small ring at its main town (the name shows when its port is in focus)
$cmIsles = @(
  @{ id = 'midilli'; n = 'Midilli'; e = 'Lesbos'; lat = 39.17; lon = 26.30; l = @(-8, 4, 'end') }
  @{ id = 'sakiz'; n = 'Sakız'; e = 'Chios'; lat = 38.37; lon = 26.03; l = @(-8, 4, 'end') }
  @{ id = 'sisam'; n = 'Sisam'; e = 'Samos'; lat = 37.73; lon = 26.80; l = @(-8, 4, 'end') }
  @{ id = 'istankoy'; n = 'İstanköy'; e = 'Kos'; lat = 36.85; lon = 27.12; l = @(-8, 4, 'end') }
  @{ id = 'rodos'; n = 'Rodos'; e = 'Rhodes'; lat = 36.25; lon = 27.98; l = @(0, 15, 'middle') }
)
# the ferry ports to those islands: a blue dot leading to the question about them; under the pointer
# a line runs out to its island (script.js, initChurchMap)
$cmPortList = @(
  @{ id = 'ayvalik'; n = 'Ayvalık'; to = 'midilli'; lat = 39.32; lon = 26.69; l = @(9, 4, 'start') }
  @{ id = 'cesme'; n = 'Çeşme'; to = 'sakiz'; lat = 38.32; lon = 26.30; l = @(0, 15, 'middle') }
  @{ id = 'kusadasi'; n = 'Kuşadası'; to = 'sisam'; lat = 37.86; lon = 27.26; l = @(9, 4, 'start') }
  @{ id = 'bodrum'; n = 'Bodrum'; to = 'istankoy'; lat = 37.03; lon = 27.43; l = @(0, 15, 'middle') }
  @{ id = 'marmaris'; n = 'Marmaris'; to = 'rodos'; lat = 36.85; lon = 28.27; l = @(0, -9, 'middle') }
  @{ id = 'fethiye'; n = 'Fethiye'; to = 'rodos'; lat = 36.62; lon = 29.12; l = @(0, 15, 'middle') }
)
$isleOf = @{}; foreach ($i in $cmIsles) { $isleOf[$i.id] = $i }
$cmIsleHtml = ($cmIsles | ForEach-Object { "<g class=`"cmap-isle`" data-isle=`"$($_.id)`" $(Cm-Pin $_.lat $_.lon)><circle class=`"ci-dot`" r=`"3.2`"></circle><text class=`"ci-name`" x=`"$($_.l[0])`" y=`"$($_.l[1])`" text-anchor=`"$($_.l[2])`"><tspan class=`"kl-tr`">$($_.n)</tspan><tspan class=`"kl-en`">$($_.e)</tspan></text></g>" }) -join ''
# a gentle arc from the port to the island, bowing to the left of the crossing
$cmFerries = ($cmPortList | ForEach-Object {
  $a = Map-XY $_.lat $_.lon; $isle = $isleOf[$_.to]; $b = Map-XY $isle.lat $isle.lon
  $x1 = [double]$a[0]; $y1 = [double]$a[1]; $x2 = [double]$b[0]; $y2 = [double]$b[1]
  $cx = Map-Num (($x1 + $x2) / 2 + ($y2 - $y1) * .18); $cy = Map-Num (($y1 + $y2) / 2 - ($x2 - $x1) * .18)
  "<path class=`"cf-line`" data-port=`"$($_.id)`" pathLength=`"1`" d=`"M$($a[0]) $($a[1])Q$cx $cy $($b[0]) $($b[1])`"></path>"
}) -join ''
$cmPorts = ($cmPortList | ForEach-Object { "<a class=`"cmap-port`" href=`"#yunan-adalari`" data-port=`"$($_.id)`" data-to=`"$($_.to)`" $(Cm-Pin $_.lat $_.lon)><title>$($_.n): $($isleOf[$_.to].n) adasına feribot</title><circle class=`"cp-hit`" r=`"12`"></circle><circle class=`"cp-dot`" r=`"4`"></circle><text class=`"cp-name`" x=`"$($_.l[0])`" y=`"$($_.l[1])`" text-anchor=`"$($_.l[2])`">$($_.n)</text></a>" }) -join ''
$cmTexts = (@(
  @{ t = 'Karadeniz'; lat = 42.55; lon = 34.6 }
  @{ t = 'Akdeniz'; lat = 35.25; lon = 31.2 }
) | ForEach-Object { "<text class=`"cm-sea`" $(Cm-Pin $_.lat $_.lon)>$($_.t)</text>" }) -join ''
$cmBox = $CmShape.box
$churchMapHtml = @"
<section class="cmap" id="harita" $(TA 'aria-label' 'Kilise haritası') data-aria-en="Map of churches">
  <div class="cmap-frame">
    <svg class="cmap-svg" viewBox="0 0 $($AnShape.W) $($AnShape.H)" role="group" $(TA 'aria-label' "Türkiye$($Apos)deki Katolik kiliselerinin haritası: bir şehir seçin") data-aria-en="Map of Catholic churches in Turkey: choose a city">
      <defs><clipPath id="cmap-out"><path clip-rule="evenodd" d="M-500-500H1500V1100H-500ZM$($cmBox[0]) $($cmBox[1])H$($cmBox[2])V$($cmBox[3])H$($cmBox[0])Z"></path></clipPath></defs>
      <rect class="cmap-sea" x="-500" y="-500" width="2000" height="1600"></rect>
      <path class="cmap-land" d="$($AnShape.land)"></path>
      <path class="cmap-tr" d="$($AnShape.turkey)" clip-path="url(#cmap-out)"></path>
      <path class="cmap-tr" d="$($CmShape.marmara)"></path>
      <path class="cmap-lake" d="$($AnShape.lakes)"></path>
      <g class="cmap-texts" aria-hidden="true">$cmTexts</g>
      <g class="cmap-ferries" aria-hidden="true">$cmFerries</g>
      <g class="cmap-isles" aria-hidden="true">$cmIsleHtml</g>
      <g class="cmap-ports">$cmPorts</g>
      <g class="cmap-cities">$($cmCities.ToString())</g>
    </svg>
    $($cmPops.ToString())
    <div class="cv" hidden>
      <svg class="cv-svg" role="group" $(TA 'aria-label' 'Şehir haritası') data-aria-en="City map"></svg>
      <div class="cv-bar"><button type="button" class="cv-back"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>$(KL 'Türkiye' 'Turkey')</button><p class="cv-title"></p><div class="cv-maps" role="group"></div></div>
      <div class="cv-zoom"><button type="button" data-z="1" $(TA 'aria-label' 'Yakınlaştır') data-aria-en="Zoom in">+</button><button type="button" data-z="-1" $(TA 'aria-label' 'Uzaklaştır') data-aria-en="Zoom out">&#8722;</button></div>
      <div class="cv-card" hidden></div>
      <p class="cv-wait" hidden>$(KL 'Harita yükleniyor…' 'Loading the map…')</p>
      <p class="cv-credit"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&#169; OpenStreetMap</a></p>
    </div>
  </div>
  <p class="cmap-key"><a href="#yunan-adalari"><span class="cp-swatch" aria-hidden="true"></span>$(KL 'Katolik kilisesi olan Yunan adalarına feribot limanları: Ayvalık, Çeşme, Kuşadası, Bodrum, Marmaris, Fethiye' 'Ferry ports to Greek islands with a Catholic church: Ayvalık, Çeşme, Kuşadası, Bodrum, Marmaris, Fethiye')</a></p>
</section>
"@
$IcoChevKl = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>'
# ---------------- Every church of the page in two languages. Turkish is what is written in the
# page; the English twin sits beside it in the same document (class kl-en), and the switch at the
# top of the page shows one or the other at once (script.js, initKlLang), so the reader keeps the
# place they were at. Text with an English twin goes through KL; whole blocks through KLB.
$TotalChurches = 0; foreach ($c in $Churches.cities) { $TotalChurches += @($c.churches).Count }
$TotalCities = @($Churches.cities).Count
# sort key in the Turkish alphabet (c, ç, d ... ı, i ... s, ş ... u, ü), the same on every machine
function Tr-Key([string]$s) {
  $al = 'abcçdefgğhıijklmnoöpqrsştuüvwxyz'
  $t = $s.Replace('İ', 'i').Replace('I', 'ı').ToLowerInvariant()
  # two plain capital letters per character (0 = anything else, then the alphabet from 1): a culture-aware
  # sort ranks punctuation before letters, capitals alone compare the same in every culture
  return -join ($t.ToCharArray() | ForEach-Object { $c = $al.IndexOf($_) + 1; "$([char](65 + [int][Math]::Floor($c / 26)))$([char](65 + $c % 26))" })
}
function Church-Pick([string]$lang) {
  $en = $lang -eq 'en'
  $sb = New-Object Text.StringBuilder
  foreach ($city in $Churches.cities) {
    $cn = if ($en) { City-En $city } else { $city.name -replace ' \(.*\)$', '' }
    $sides = @($city.churches | Where-Object { $_.side } | ForEach-Object { $_.side } | Select-Object -Unique)
    if ($sides.Count -lt 2) { $sides = @('') }
    foreach ($sd in $sides) {
      $list = if ($sd) { @($city.churches | Where-Object { $_.side -eq $sd }) } else { @($city.churches) }
      $gl = if ($sd) { "$cn · $($PickSide[$sd][[int]$en])" } else { $cn }
      [void]$sb.Append("<optgroup label=`"$(Attr $gl)`">")
      foreach ($ch in @($list | Sort-Object { Tr-Key (Plain $(if ($en -and $_.shortEn) { $_.shortEn } else { $_.short })) })) { $nm = if ($en -and $ch.shortEn) { $ch.shortEn } else { $ch.short }; [void]$sb.Append("<option value=`"$($ch.id)`">$(Attr (Plain $nm))</option>") }
      [void]$sb.Append('</optgroup>')
    }
  }
  $id = "ch-pick-$lang"
  $label = if ($en) { 'Or choose from the list' } else { 'Ya da listeden seçin' }
  $ph = if ($en) { 'Choose a church…' } else { 'Bir kilise seçin…' }
  $go = if ($en) { 'Go' } else { 'Git' }
  $form = "<form class=`"ch-pick`" data-ch-pick action=`"#`"><label for=`"$id`">$label</label><div class=`"ch-pick-row`"><select id=`"$id`" name=`"kilise`" required><option value=`"`" selected disabled>$ph</option>$($sb.ToString())</select><button type=`"submit`" class=`"btn`">$go</button></div></form>"
  if ($en) { return "<div class=`"kl-en kl-blk`" lang=`"en`">$form</div>" } else { return "<div class=`"kl-tr kl-blk`">$form</div>" }
}
$churchPickHtml = (Church-Pick 'tr') + (Church-Pick 'en')

# One church as a card: name, rite and district, the address with a map link, every Mass time, the
# notice when it is closed or has something to know, and the link to its own page
function Church-Card($ch, [string]$cityName) {
  $rite = $RiteLabels[$ch.rite]; $riteEn = (@($Churches.rites | Where-Object { $_.id -eq $ch.rite })[0]).en
  $nmTr = Inline $ch.name; $nmEn = if ($ch.nameEn) { $ch.nameEn } else { $nmTr }
  $mapQ = "$(Plain $ch.name), $cityName"
  $times = ''
  if (@($ch.mass).Count) {
    $times = '<dl class="kl-mass">' + ((0..(@($ch.mass).Count - 1) | ForEach-Object {
      $m = @($ch.mass)[$_]; $me = if ($ch.massEn -and @($ch.massEn).Count -gt $_) { @($ch.massEn)[$_] } else { $m }
      "<div class=`"kl-mrow`"><dt>$(KL (Inline $m[0]) $me[0])</dt><dd>$(KL (Inline $m[1]) $me[1])</dd></div>"
    }) -join '') + '</dl>'
  }
  $note = ''
  if ($ch.massNote) { $note = "<p class=`"kl-mnote`">$(KL (Inline $ch.massNote) $(if ($ch.massNoteEn) { $ch.massNoteEn } else { Inline $ch.massNote }))</p>" }
  $notice = ''
  if ($ch.notice) {
    $head = if ($ch.status -eq 'closed') { KL 'Şu anda kapalı.' 'Currently closed.' } elseif ($ch.status -eq 'active') { KL 'Duyuru.' 'Notice.' } else { KL 'Gitmeden önce.' 'Before you go.' }
    $notice = "<div class=`"ch-notice kl-notice is-$($ch.status)`" role=`"note`">$IcoWarn<p><strong>$head</strong> $(KL (Inline $ch.notice) $(if ($ch.noticeEn) { $ch.noticeEn } else { Inline $ch.notice }))</p></div>"
  }
  $tel = ''
  if (@($ch.phones).Count) { $p0 = @($ch.phones)[0]; $tel = "<a class=`"kl-tel`" href=`"$(Tel-Href $p0)`">$IcoPhone<span>$p0</span></a>" }
  $adrLab = KL 'Adres' 'Address'
  $adr = "<span class=`"kl-adr`"><button type=`"button`" class=`"kl-adr-btn`" aria-expanded=`"false`" aria-haspopup=`"true`">$IcoPin<span>$adrLab</span></button>" +
    "<span class=`"kl-pop`" role=`"group`"><span class=`"kl-pop-addr`">$(Inline $ch.address)</span>" +
    "<a class=`"kl-pop-map map-link`" href=`"$(Map-Url $mapQ)`" data-map-q=`"$(Attr $mapQ)`" target=`"_blank`" rel=`"noopener`"><span>$(KL 'Haritada aç' 'Open in Maps')</span> $IcoExternalCh</a></span></span>"
  return "<li><article class=`"kl-ch is-$($ch.status)`" id=`"k-$($ch.id)`">" +
    "<h3 class=`"kl-name`"><a href=`"kilise/$($ch.id).html`">$(KL $nmTr $nmEn)</a></h3>" +
    "<p class=`"kl-meta`"><span class=`"kl-rite`">$(KL $rite.tr $riteEn)</span>$adr</p>" +
    "$notice$times$note" +
    "<p class=`"kl-links`">$tel" +
    "<a class=`"kl-more`" href=`"kilise/$($ch.id).html`"><span>$(KL 'Tarihçe ve ayrıntılar' 'History and details (Turkish)')</span>$IcoChevKl</a></p>" +
    "</article></li>"
}

# One city: its heading, a line saying what is there, then the churches (Istanbul by side of the Bosphorus)
function City-Section($city) {
  $cn = $city.name -replace ' \(.*\)$', ''; $cnEn = City-En $city; $n = @($city.churches).Count
  $parts = @(); $partsEn = @()
  foreach ($r in $Churches.rites) {
    $k = @($city.churches | Where-Object { $_.rite -eq $r.id }).Count
    if ($k) { $parts += "$k $($r.tr)"; $partsEn += "$k $($r.en)" }
  }
  $loc = $CityLoc[$city.id]
  $sumTr = if ($n -eq 1) { "$loc 1 Katolik kilisesi bulunuyor: $($parts -join ', ')." } else { "$loc $n Katolik kilisesi bulunuyor: $($parts -join ', ')." }
  $sumEn = if ($n -eq 1) { "$cnEn has 1 Catholic church: $($partsEn -join ', ')." } else { "$cnEn has $n Catholic churches: $($partsEn -join ', ')." }
  $sides = @($city.churches | Where-Object { $_.side } | ForEach-Object { $_.side } | Select-Object -Unique)
  if ($sides.Count -gt 1) {
    $body = ($sides | ForEach-Object {
      $s = $_; $in = @($city.churches | Where-Object { $_.side -eq $s })
      "<h3 class=`"kl-side`">$(KL $PickSide[$s][0] $PickSide[$s][1])</h3><ul class=`"kl-grid`">$(($in | ForEach-Object { Church-Card $_ $cn }) -join '')</ul>"
    }) -join ''
  } else { $body = "<ul class=`"kl-grid`">$((@($city.churches) | ForEach-Object { Church-Card $_ $cn }) -join '')</ul>" }
  $cpLink = if ($CityPages[$city.id]) { "<p class=`"kl-citypage`"><a href=`"$($CityPages[$city.id])`">$(KL 'Bu şehrin kiliseleri ayrı sayfada' 'This city on a page of its own (Turkish)')</a></p>" } else { '' }
  return "<section class=`"kl-city`" id=`"$($city.id)`" aria-labelledby=`"h-$($city.id)`"><h2 class=`"kl-h`" id=`"h-$($city.id)`">$(KL "$loc Katolik Kiliseleri" "Catholic Churches in $cnEn")<span class=`"kl-count`">$n</span></h2>" +
    "<p class=`"kl-sum`">$(KL $sumTr $sumEn)</p>$cpLink$body</section>"
}
$klCities = ($Churches.cities | ForEach-Object { City-Section $_ }) -join "`n"

# Mass by language: every Mass time whose language the sources give, read from the English Mass text
# ("10:00 English · 11:30 Spanish"); a row ending in ", Polish / Turkish" gives the language of all its
# times, and an Armenian Catholic church's times count as Armenian and Turkish (its note says so).
# Closed churches and times with no language stated are left out. The reader picks a language on the page.
$MassLangs = [ordered]@{
  en = @('İngilizce', 'English', 'English'); fr = @('Fransızca', 'French', 'French'); it = @('İtalyanca', 'Italian', 'Italian')
  es = @('İspanyolca', 'Spanish', 'Spanish'); de = @('Almanca', 'German', 'German'); pl = @('Lehçe', 'Polish', 'Polish')
  ko = @('Korece', 'Korean', 'Korean'); ar = @('Arapça', 'Arabic', 'Arabic'); syr = @('Süryanice (Aramice)', 'Syriac (Aramaic)', 'Aramaic|Syriac')
  hy = @('Ermenice', 'Armenian', 'Armenian'); tr = @('Türkçe', 'Turkish', 'Turkish')
}
function Mass-Langs([string]$s) { return @($MassLangs.Keys | Where-Object { $s -match "\b($($MassLangs[$_][2]))\b" }) }
$lfCount = @{}; $lfCities = New-Object Text.StringBuilder
foreach ($city in $Churches.cities) {
  $chHtml = New-Object Text.StringBuilder
  foreach ($ch in @($city.churches | Where-Object { $_.status -ne 'closed' })) {
    $rows = New-Object Text.StringBuilder; $chLangs = @{}
    for ($i = 0; $i -lt @($ch.mass).Count; $i++) {
      $m = @($ch.mass)[$i]; $me = @($ch.massEn)[$i]
      $segTr = $m[1] -split ' · '; $segEn = $me[1] -split ' · '
      $rowLangs = @()
      if ($segEn[-1] -match ', ([A-Z][a-z]+(?: / [A-Z][a-z]+)*)$') { $rowLangs = Mass-Langs $Matches[1] }
      for ($j = 0; $j -lt $segEn.Count; $j++) {
        $e = $segEn[$j]
        if ($e -notmatch '\d{1,2}:\d{2}' -or ($e -match 'Rosary|Adoration' -and $e -notmatch 'Mass')) { continue }
        $ls = Mass-Langs $e
        if (-not $ls.Count) { $ls = $rowLangs }
        if (-not $ls.Count -and $ch.rite -eq 'ermeni') { $ls = @('hy', 'tr') }
        if (-not $ls.Count) { continue }
        foreach ($l in $ls) { $chLangs[$l] = 1 }
        [void]$rows.Append("<li data-l=`"$($ls -join ' ')`"><span class=`"kl-lf-day`">$(KL (Inline $m[0]) $me[0])</span> $(KL (Inline $segTr[$j]) $e)</li>")
      }
    }
    if (-not $rows.Length) { continue }
    foreach ($l in $chLangs.Keys) { $lfCount[$l] = 1 + [int]$lfCount[$l] }
    $nmEn = if ($ch.nameEn) { $ch.nameEn } else { Inline $ch.name }
    [void]$chHtml.Append("<li class=`"kl-lf-ch`" data-l=`"$(@($chLangs.Keys) -join ' ')`"><a href=`"#k-$($ch.id)`">$(KL (Inline $ch.name) $nmEn)</a><ul>$rows</ul></li>")
  }
  if ($chHtml.Length) { [void]$lfCities.Append("<li class=`"kl-lf-city`"><h3>$(KL ($city.name -replace ' \(.*\)$', '') (City-En $city))</h3><ul>$chHtml</ul></li>") }
}
# the buttons: the other languages by how many churches have them, Turkish last
$lfKeys = @(@($MassLangs.Keys | Where-Object { $_ -ne 'tr' -and $lfCount[$_] } | Sort-Object { - $lfCount[$_] }, { $MassLangs[$_][1] }) + @('tr' | Where-Object { $lfCount[$_] }))
$lfBtns = ($lfKeys | ForEach-Object { "<li><button type=`"button`" data-lf=`"$_`" aria-pressed=`"false`">$(KL $MassLangs[$_][0] $MassLangs[$_][1])<small>$($lfCount[$_])</small></button></li>" }) -join ''
$klLangHtml = "<section class=`"kl-lf`" id=`"dile-gore`" aria-labelledby=`"h-kl-lf`"><h2 class=`"kl-h`" id=`"h-kl-lf`">$(KL 'Dile Göre Ayinler' 'Mass by Language')</h2>" +
  "<p class=`"kl-sum`">$(KL 'Bir dil seçin: o dildeki bütün ayinler şehir şehir, gün ve saatiyle listelenir. Rakam, o dilde ayin olan kilise sayısıdır.' 'Choose a language to see every Mass in it, city by city, with its day and time. The number is how many churches have Mass in that language.')</p>" +
  "<ul class=`"kl-lf-btns`" role=`"group`" aria-label=`"Ayin dili`" data-aria-en=`"Language of the Mass`">$lfBtns</ul>" +
  "<p class=`"kl-lf-status`" role=`"status`" aria-live=`"polite`"></p>" +
  "<ul class=`"kl-lf-list`">$lfCities</ul>" +
  "<p class=`"kl-lf-note`">$(KL 'Dili belirtilmeyen ayinler bu listede yok; kartlarda bütün saatler yazıyor. Gitmeden önce saati kiliseden teyit edin.' 'Masses whose language the sources do not give are not in this list; the cards below have every time. Check the time with the church before you go.')</p></section>"

# Church news: the newest few dated items from the data file, each with its source and a link to the church or city it concerns
$klNewsHtml = ''
$newsItems = @($Churches.news | Sort-Object { $_.date } -Descending | Select-Object -First 5)
if ($newsItems.Count) {
  $klNewsHtml = '<section class="kl-news" id="haberler" aria-labelledby="h-kl-news"><h2 class="kl-h" id="h-kl-news">' + (KL 'Kilise Haberleri' 'Church News') + '</h2><ul class="kl-news-list">' + (($newsItems | ForEach-Object {
    $n = $_
    $rel = ''
    if ($n.churchId) { $rel = "<a href=`"kilise/$($n.churchId).html`">$(KL 'İlgili kilise' 'The church')</a>" }
    elseif ($n.cityId) { $rel = "<a href=`"#$($n.cityId)`">$(KL 'İlgili şehir' 'The city')</a>" }
    $srcEn = if ($n.source.Count -gt 2) { $n.source[2] } else { $n.source[0] }
    "<li class=`"kl-news-item`"><time datetime=`"$($n.date)`">$(KL $n.dateTr $n.dateEn)</time><h3>$(KL $n.title $n.titleEn)</h3><p>$(KL $n.text $n.textEn)</p><p class=`"kl-news-src`"><a href=`"$($n.source[1])`" rel=`"noopener`">$(KL $n.source[0] $srcEn)</a>$(if ($rel) { " · $rel" })</p></li>"
  }) -join '') + '</ul></section>'
}

# The pinned row: the cities as one-tap jumps, and the TR / EN switch at its right. On desktop only the
# $klTop cities stay as chips; the rest sit in the "Tüm şehirler" menu, which lists every city
$klTop = @('istanbul', 'izmir', 'ankara', 'antalya')
$klChips = ($Churches.cities | ForEach-Object { $x = if ($klTop -notcontains $_.id) { ' class="kl-x"' } else { '' }; "<li$x><a href=`"#$($_.id)`">$(KL ($_.name -replace ' \(.*\)$', '') (City-En $_))<small>$(@($_.churches).Count)</small></a></li>" }) -join ''
$klAllList = ($Churches.cities | ForEach-Object { "<li><a href=`"#$($_.id)`">$(KL ($_.name -replace ' \(.*\)$', '') (City-En $_))<small>$(@($_.churches).Count)</small></a></li>" }) -join ''
$klAll = "<details class=`"kl-all`"><summary>$(KL 'Tüm şehirler' 'All cities')<small>$(@($Churches.cities).Count)</small></summary><ul>$klAllList</ul></details>"
$klSwitch = "<div class=`"kl-lang`"><button type=`"button`" class=`"kl-lab`" data-kl-set=`"tr`" lang=`"tr`">TR</button><button type=`"button`" class=`"kl-switch`" role=`"switch`" aria-checked=`"false`" aria-label=`"Türkçe / English`" data-title-en=`"Catholic Churches in Turkey: Addresses and Mass Times | $SiteName`"><span class=`"kl-knob`"></span></button><button type=`"button`" class=`"kl-lab`" data-kl-set=`"en`" lang=`"en`">EN</button></div>"
$klBar = "<div class=`"kl-bar`"><nav class=`"kl-chips`" aria-label=`"Şehirler`" data-aria-en=`"Cities`"><ul>$klChips</ul>$klAll</nav>$klSwitch</div>"

# Questions people search for, in both languages; the same text goes into the page's FAQ markup
$riteCounts = ($Churches.rites | ForEach-Object { $r = $_; [pscustomobject]@{ tr = $r.tr; en = $r.en; n = (@($Churches.cities | ForEach-Object { $_.churches } | Where-Object { $_.rite -eq $r.id }).Count) } })
$riteTr = ($riteCounts | Where-Object { $_.n } | ForEach-Object { "$($_.n) $($_.tr)" }) -join ', '
$riteEn = ($riteCounts | Where-Object { $_.n } | ForEach-Object { "$($_.n) $($_.en)" }) -join ', '
$klFaq = @(
  @{ id = 'kac-kilise'
     q = "Türkiye$($Apos)de kaç Katolik kilisesi var?"; qe = 'How many Catholic churches are there in Turkey?'
     a = "Bu sayfada $TotalCities şehirde $TotalChurches Katolik kilisesi listeleniyor: $riteTr. En çok kilise İstanbul$($Apos)da ve İzmir$($Apos)de bulunuyor. Kapalı olanlar da listededir; durumları kendi kartlarında yazar."
     ae = "This page lists $TotalChurches Catholic churches in $TotalCities cities: $riteEn. Most are in Istanbul and Izmir. Churches that are closed are listed too, and their cards say so." }
  @{ id = 'ayin-saatleri-degisir-mi'
     q = 'Pazar ayini ve hafta içi ayin saatleri değişir mi?'; qe = 'Do Sunday and weekday Mass times change?'
     a = "Evet. Noel, Kutsal Hafta ve Paskalya gibi bayramlarda ve mevsime göre saatler değişebilir. Gitmeden önce kilisenin telefonundan ya da web sitesinden teyit edin; her kartta telefon ve kilisenin kendi sayfasına bağlantı var."
     ae = "Yes. Times can change at feasts such as Christmas, Holy Week and Easter, and with the season. Check by phone or on the church$($Apos)s website before you go; every card has the phone number and a link to the church$($Apos)s own page." }
  @{ id = 'katolik-olmayan-ayine-katilabilir-mi'
     q = "Katolik olmayan biri Ayin$($Apos)e katılabilir mi?"; qe = 'Can a non-Catholic attend Mass?'
     a = "Evet. Ayinler herkese açıktır; oturup izleyebilir, sessizce eşlik edebilirsiniz. Komünyon (kutsal ekmek) yalnızca Katolikler içindir; o sırada yerinizde kalabilirsiniz. Ayrıntı için <a href=`"sss.html#komunyon-kimler`">Kimler Kutsal Komünyon alabilir?</a> sorusuna bakın."
     ae = "Yes. Mass is open to everyone; you can sit, watch and join in quietly. Communion is for Catholics only, and you can stay in your seat while it is given. See <a href=`"sss.html#komunyon-kimler`">Who can receive Holy Communion?</a> (in Turkish)." }
  @{ id = 'ayin-dili'
     q = 'Ayinler hangi dilde yapılıyor?'; qe = 'In which language is Mass celebrated?'
     a = "Birçok kilisede Türkçe ayin vardır; ayrıca İngilizce, İtalyanca, Lehçe ve başka dillerde yapılan ayinler de bulunur. Her kartta saatin yanında ayinin dili yazıyor; <a href=`"#dile-gore`">Dile Göre Ayinler</a> bölümünde bir dil seçip o dildeki bütün ayinleri görebilirsiniz."
     ae = "Many churches have a Mass in Turkish, and there are also Masses in English, Italian, Polish and other languages. Each card gives the language next to the time, and in <a href=`"#dile-gore`">Mass by Language</a> you can pick a language and see every Mass in it." }
  @{ id = 'kiliseye-girerken'
     q = 'Kiliseye girerken ne giymeli, nelere dikkat etmeli?'; qe = 'What should I wear and keep in mind when I visit a church?'
     a = "Özel bir kıyafet gerekmez; omuzları ve dizleri örten sade bir giyim yeterlidir. İçeride sessiz olun ve telefonunuzu kapatın. Ayin sırasında fotoğraf ve video çekmemek en doğrusudur; ziyaret saatlerinde çekim için kiliseye sorun."
     ae = "No special clothes are needed; simple dress that covers shoulders and knees is enough. Keep quiet inside and switch your phone off. It is best not to take photos or video during Mass; ask the church about photos during visiting hours." }
  @{ id = 'katolik-olmak-icin'
     q = 'Katolik olmak istiyorum, nereye başvurmalıyım?'; qe = 'I want to become Catholic. Where do I start?'
     a = "Yakınınızdaki bir kiliseye gidip rahiple konuşun. Katolik Kilisesi$($Apos)ne katılım OCIA denen bir hazırlık süreciyle olur; <a href=`"katolik-sureci.html`">Katolik Olma Süreci</a> sayfasında adımlar anlatılıyor."
     ae = "Visit a church near you and speak to the priest. Joining the Catholic Church happens through a period of preparation called OCIA; the steps are explained on the <a href=`"katolik-sureci.html`">Becoming Catholic</a> page (in Turkish)." }
  @{ id = 'yunan-adalari'
     q = "Yakındaki Yunan adalarında Katolik kilisesi var mı?"; qe = 'Are there Catholic churches on the nearby Greek islands?'
     a = "Evet. Türkiye kıyısından feribotla kısa sürede gidilen beş Yunan adasında Katolik kilisesi var: Rodos$($Apos)ta (Marmaris$($Apos)ten ve Fethiye$($Apos)den) Assisili Aziz Francis Katedrali ve Fransisken rahiplerin hizmet verdiği Zafer Meryemi Kilisesi; Sakız Adası$($Apos)nda (Çeşme$($Apos)den) Aziz Nikolaos Katedrali; Sisam$($Apos)da (Kuşadası$($Apos)ndan) Meryem$($Apos)in Göğe Alınışı Kilisesi; Midilli$($Apos)de (Ayvalık$($Apos)tan ve Dikili$($Apos)den) Midilli şehrindeki Meryem$($Apos)in Göğe Alınışı Kilisesi; İstanköy$($Apos)de (Bodrum$($Apos)dan) İstanköy şehrindeki Agnus Dei Kilisesi. Bu cemaatler küçüktür; pazar ayini çoğu zaman tektir ve Yunanca ya da İngilizce olabilir. Seferlerin çoğu yaz aylarındadır. Türk vatandaşları Hızlı Vize (Visa Express) uygulamasıyla bu beş adaya önceden başvurmadan gidebilir: geçerli pasaportla limanda 60 avroya 7 günlük vize verilir. Bu vize yalnızca uygulamaya dahil Yunan adalarında geçerlidir, başka Avrupa ülkelerine gitmeye izin vermez; uygulama şu an Nisan 2027$($Apos)ye kadar uzatılmış durumda. Başka ülkelerin vatandaşları için her zamanki Schengen kuralları geçerlidir. Yola çıkmadan önce feribot saatlerini, vize koşullarını ve ayin saatini kiliseyle teyit edin."
     ae = "Yes. Five Greek islands a short ferry ride from the Turkish coast have Catholic churches: on Rhodes (from Marmaris and Fethiye), St. Francis of Assisi Cathedral and the Franciscan-run Church of Our Lady of Victory; on Chios (from Çeşme), St. Nicholas Cathedral; on Samos (from Kuşadası), the Church of the Assumption; on Lesbos (from Ayvalık and Dikili), the Church of the Assumption in Mytilene; and on Kos (from Bodrum), the Agnus Dei church in Kos town. These are small communities, often with a single Sunday Mass, which may be in Greek or English. Most crossings run in the summer months. Turkish citizens can visit all five islands without applying in advance under the Visa Express scheme: with a valid passport, a 7-day visa is issued at the port for 60 euros. It is valid only on the Greek islands in the scheme and does not allow travel to other European countries; the scheme currently runs until April 2027. Other nationalities need a Schengen visa or visa-free entry as usual. Before you go, check the ferry times, the visa rules and the Mass time with the church." }
  @{ id = 'katolik-bulunamadiginda'
     q = 'Yakınımda Katolik kilisesi yoksa ne yapmalıyım?'; qe = 'What if there is no Catholic church near me?'
     a = (Inline $Churches.orthodoxNote); ae = $Churches.orthodoxNoteEn }
)
$klFaqHtml = '<div class="faq-list kl-faq">' + (($klFaq | ForEach-Object {
  "<details class=`"faq-item`" id=`"$($_.id)`"><summary><span class=`"faq-q`">$(KL $_.q $_.qe)</span>$IcoChevLg</summary><div class=`"faq-a`">$(KLB "<p>$($_.a)</p>" "<p>$($_.ae)</p>")</div></details>"
}) -join "`n") + '</div>'

$leadTr = "Türkiye$($Apos)de $TotalCities şehirde $TotalChurches Katolik kilisesinin adresi, telefonu, pazar ve hafta içi ayin saatleri, ziyaret bilgisi ve tarihçesi bu sayfada. Haritadan şehri seçin, listeden kiliseye bakın ya da aşağıdaki şehir düğmeleriyle doğrudan şehre geçin."
$leadEn = "Address, phone number, Sunday and weekday Mass times, visiting information and history for $TotalChurches Catholic churches in $TotalCities cities across Turkey. Pick a city on the map, choose a church from the list, or jump straight to a city with the buttons below."
$kiliselerBody = @"
<div class="wrap narrow kl-page">
  $(Crumbs 'Kilise Bul')
  <header class="page-head center">$(Page-Ico $IcoChurch)<h1>$(KL "Türkiye$($Apos)de Katolik Kiliseleri" 'Catholic Churches in Turkey')</h1>
    <p class="kl-lead">$(KL $leadTr $leadEn)<em class="kl-checked">$(KL "Son kontrol: $($Churches.checked)" "Last checked: $($Churches.checkedEn)")</em></p>
    <nav class="ph-jump" aria-label="Bölümler" data-aria-en="Sections"><ul><li><a href="#harita">$(KL 'Harita' 'Map')</a></li><li><a href="#dile-gore">$(KL 'Diller' 'Languages')</a></li>$(if ($klNewsHtml) { "<li><a href=`"#haberler`">$(KL 'Haberler' 'News')</a></li>" })<li><a href="#sik-sorulanlar">$(KL 'Sorular' 'Questions')</a></li></ul></nav></header>
  $klBar
$churchMapHtml
  $churchPickHtml
  $klLangHtml
$klCities
  $klNewsHtml
  <section class="kl-faqs" id="sik-sorulanlar" aria-labelledby="h-kl-faq"><h2 class="kl-h" id="h-kl-faq">$(KL 'Sık Sorulan Sorular' 'Frequently Asked Questions')</h2>
$klFaqHtml</section>
  <p class="conventions">$(KL (Inline $Churches.note) $Churches.noteEn)</p>
</div>
"@
# structured data: the list of churches (each leading to its own page) and the questions above
$klItems = New-Object Collections.Generic.List[string]; $klPos = 0
foreach ($city in $Churches.cities) { foreach ($ch in $city.churches) { $klPos++; $klItems.Add('{"@type":"ListItem","position":' + $klPos + ',"url":' + (JStr "$SiteUrl/kilise/$($ch.id).html") + ',"name":' + (JStr (Plain $ch.name)) + '}') } }
$ldList = '{"@context":"https://schema.org","@type":"ItemList","name":' + (JStr "Türkiye$($Apos)de Katolik Kiliseleri") + ',"numberOfItems":' + $klPos + ',"itemListElement":[' + ($klItems -join ',') + ']}'
$ldFaq = '{"@context":"https://schema.org","@type":"FAQPage","inLanguage":"tr","mainEntity":[' + (($klFaq | ForEach-Object { '{"@type":"Question","name":' + (JStr $_.q) + ',"acceptedAnswer":{"@type":"Answer","text":' + (JStr (Plain $_.a)) + '}}' }) -join ',') + ']}'
Write-Page -File 'kiliseler.html' -Title "Türkiye$($Apos)de Katolik Kiliseleri: Adres ve Ayin Saatleri | $SiteName" `
  -Description (Meta-Trim "Türkiye$($Apos)deki $TotalChurches Katolik kilisesinin adresi, telefonu ve ayin saatleri: İstanbul, İzmir, Ankara, Bursa, Antalya. Harita, şehir şehir liste ve kısa tarihçeler.") `
  -Path 'kiliseler.html' -Body $kiliselerBody -JsonLd @((Breadcrumb-Ld 'Kilise Bul' 'kiliseler.html'), $ldList, $ldFaq)

# ================================================================== ILETISIM (iletisim.html)
$cfMsgs = @(
  @('ok', 'Teşekkürler, mesajınız bize ulaştı. En kısa sürede yanıt vereceğim.', "Thank you, your message has arrived. I’ll reply as soon as I can."),
  @('fields', 'Lütfen geçerli bir e-posta adresi ve bir mesaj yazın.', 'Please enter a valid email address and a message.'),
  @('check', 'Güvenlik doğrulaması tamamlanamadı. Lütfen kutunun yüklenmesini bekleyip yeniden deneyin.', 'The security check could not be completed. Please wait for the box to load and try again.'),
  @('error', 'Mesajınız şu an gönderilemedi. Lütfen biraz sonra yeniden deneyin.', 'Your message could not be sent just now. Please try again a little later.'))
$cfMsgHtml = ($cfMsgs | ForEach-Object { "<p class=`"cf-msg cf-$($_[0])`" data-msg=`"$($_[0])`" hidden>$($_[1])</p>" }) -join ''
$iletisimBody = @"
<div class="wrap narrow">
  $(Crumbs 'İletişim')
  <header class="page-head center">$(Page-Ico $IcoMail)<h1>İletişim</h1></header>
  <div class="contact-wrap">
    <div class="contact-intro">$ContactIntro</div>
    <form class="cform" id="mesaj" action="/api/contact" method="post">
      <div class="cf-row">
        <label class="cf-field"><span class="cf-label">Adınız <em>(isteğe bağlı)</em></span><input type="text" name="name" autocomplete="name" maxlength="100"></label>
        <label class="cf-field"><span class="cf-label">E-posta adresiniz</span><input type="email" name="email" autocomplete="email" maxlength="200" required></label>
      </div>
      <label class="cf-field"><span class="cf-label">Mesajınız</span><textarea name="message" rows="7" minlength="5" maxlength="5000" required></textarea></label>
      <div class="cf-trap" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <input type="hidden" name="lang" value="tr">
      <div class="cf-turnstile" data-sitekey="$TurnstileSiteKey" data-theme="auto" data-size="flexible"></div>
      <div class="cf-foot">
        <button type="submit" class="btn cf-send">$IcoMail<span>Gönder</span></button>
        <p class="cf-note">E-posta adresiniz yalnızca size yanıt vermek için kullanılır. Ayrıntılar: <a href=`"gizlilik.html`" data-no-dlg>Gizlilik Politikası</a>.</p>
      </div>
      <div class="cf-status" role="status" aria-live="polite">$cfMsgHtml</div>
      <noscript><p class="cf-msg cf-error">Formun çalışması için JavaScript gerekir.</p></noscript>
    </form>
    <div class="contact-outro">$ContactOutro</div>
  </div>
</div>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
"@
Write-Page -File 'iletisim.html' -Title "İletişim | $SiteName" `
  -Description "katolikdunyasi.com$($Apos)a nasıl ulaşabileceğiniz: çeviri düzeltmeleri, içerik önerileri ve sorularınız için iletişim formu." `
  -Path 'iletisim.html' -Body $iletisimBody -JsonLd @((Breadcrumb-Ld 'İletişim' 'iletisim.html'))

# ================================================================== ERISILEBILIRLIK (erisilebilirlik.html)
$erBody = @"
<div class="wrap narrow">
  $(Crumbs 'Erişilebilirlik')
  <header class="page-head center">$(Page-Ico $IcoA11yPerson)<h1>$($ErMeta.title)</h1><p class="sub">$($ErMeta.subtitle)</p></header>
  <div class="body prose">$((Convert-Markdown $Er.body))</div>
</div>
"@
Write-Page -File 'erisilebilirlik.html' -Title "$($ErMeta.title) | $SiteName" -Description $ErMeta.description `
  -Path 'erisilebilirlik.html' -Body $erBody -JsonLd @((Breadcrumb-Ld 'Erişilebilirlik' 'erisilebilirlik.html'))

# ================================================================== DOGU KATOLIK KILISELERI (dogu-katolik-kiliseleri.html)
$dkBody = @"
<div class="wrap narrow">
  $(Crumbs 'Doğu Katolik Kiliseleri')
  <header class="page-head center">$(Page-Ico $IcoEastCross)<h1>$($DkMeta.title)</h1><p class="sub">$($DkMeta.subtitle)</p></header>
  <div class="body prose">$((Convert-Markdown $Dk.body))</div>
</div>
"@
$dkLd = '{"@context":"https://schema.org","@type":"Article","headline":"Doğu Katolik Kiliseleri","inLanguage":"tr","mainEntityOfPage":' + (JStr "$SiteUrl/dogu-katolik-kiliseleri.html") + '}'
Write-Page -File 'dogu-katolik-kiliseleri.html' -Title "$($DkMeta.title) | $SiteName" -Description $DkMeta.description `
  -Path 'dogu-katolik-kiliseleri.html' -Body $dkBody -JsonLd @($dkLd, (Breadcrumb-Ld 'Doğu Katolik Kiliseleri' 'dogu-katolik-kiliseleri.html')) -OgType 'article'

# ================================================================== GIZLILIK (gizlilik.html)
$gzBody = @"
<div class="wrap narrow">
  $(Crumbs 'Gizlilik Politikası')
  <header class="page-head center">$(Page-Ico $IcoShield)<h1>$($GzMeta.title)</h1><p class="sub">$($GzMeta.subtitle)</p></header>
  <div class="body prose">$((Convert-Markdown $Gz.body))</div>
</div>
"@
Write-Page -File 'gizlilik.html' -Title "$($GzMeta.title) | $SiteName" -Description $GzMeta.description `
  -Path 'gizlilik.html' -Body $gzBody -JsonLd @((Breadcrumb-Ld 'Gizlilik Politikası' 'gizlilik.html'))

# ================================================================== KAYNAKLAR VE TELIF (kaynaklar-ve-telif.html)
# The same text as the footer's "Kaynaklar ve telif" popup, as a page of its own for search
# engines, shared links and visitors without JavaScript
# the photographs in the miracle stories (keys mira-*, fatima-*) are listed on their own
$ArtListHtml = (($Tablolar.art.PSObject.Properties | Where-Object { $_.Name -notmatch '^(mira|fatima)-' } | Sort-Object { $_.Value.a }, { $_.Value.t }) | ForEach-Object {
  $a = $_.Value
  "<li><span><a href=`"$($a.src)`" target=`"_blank`" rel=`"noopener`"><cite>$($a.t)</cite></a><br>$(Art-A $a) · $($a.loc)</span></li>"
}) -join ''
$seenImg = @{}
$TarihListHtml = (($Tarih.items | ForEach-Object { $_.img } | Where-Object { if ($seenImg[$_]) { $false } else { $seenImg[$_] = 1; $true } }) | ForEach-Object {
  $g = $TarihImg.$_
  if ($g) { "<li><span><a href=`"$($g.src)`" target=`"_blank`" rel=`"noopener`"><cite>$((Attr $g.t))</cite></a><br>$((Attr $g.a)) · $($g.lic)</span></li>" }
}) -join ''
$MiraListHtml = (($Tablolar.art.PSObject.Properties | Where-Object { $_.Name -match '^(mira|fatima)-' }) | ForEach-Object {
  $a = $_.Value
  "<li><span><a href=`"$($a.src)`" target=`"_blank`" rel=`"noopener`"><cite>$($a.t)</cite></a><br>$(Art-A $a) · $($a.loc)</span></li>"
}) -join ''
$PortraitListHtml = ($GreatSaints.saints | ForEach-Object {
  $p = $SaintPortraits.($_.id)
  if ($p) { "<li><span><a href=`"$($p.src)`" target=`"_blank`" rel=`"noopener`">$((Inline $_.name))</a><br>$($p.t) · $($p.lic)</span></li>" }
}) -join ''
$ktBody = @"
<div class="wrap narrow">
  $(Crumbs $fm['title'])
  <header class="page-head center">$(Page-Ico $IcoBook)<h1>$($fm['title'])</h1></header>
  <div class="body prose">$($InfoHtml)
  <h2 id="tablolar">Tablolar</h2>
  <p>Sayfa başlıklarında, bölümlerde ve ana sayfada kullanılan tablolar. Hepsi kamu malıdır; bağlantılar görüntülerin alındığı sayfaları açar.</p>
  <ul class="art-list">$ArtListHtml</ul>
  <h2 id="tarih-gorselleri">$("Kilise’nin tarihi görselleri")</h2>
  <p>$("Kilise’nin tarihi sayfasındaki ve ana sayfa şeridindeki görseller, sırasıyla. Kamu malı olmayanlar, belirtilen Creative Commons lisansıyla ve sahiplerinin adıyla kullanılır.")</p>
  <ul class="art-list">$TarihListHtml</ul>
  <h2 id="mucize-fotograflari">Mucizeler sayfasındaki görseller</h2>
  <p>Kamu malı olmayanlar, belirtilen Creative Commons lisansıyla ve sahiplerinin adıyla kullanılır.</p>
  <ul class="art-list">$MiraListHtml</ul>
  <h2 id="aziz-portreleri">Aziz portreleri</h2>
  <p>Azizler sayfasındaki en bilinen yirmi azizin portreleri. Creative Commons lisanslı olanlar, lisansları ve kaynak sayfaları belirtilerek kullanılır.</p>
  <ul class="art-list">$PortraitListHtml</ul></div>
</div>
"@
Write-Page -File 'kaynaklar-ve-telif.html' -Title "$($fm['title']) | $SiteName" -Description $fm['description'] `
  -Path 'kaynaklar-ve-telif.html' -Body $ktBody -JsonLd @((Breadcrumb-Ld $fm['title'] 'kaynaklar-ve-telif.html'))

# ================================================================== 404.html (served by GitHub Pages for unknown URLs)
$notFoundBody = @"
<div class="wrap narrow">
  <section class="hero">
    $Logo
    <p class="label">404</p>
    <h1>Sayfa bulunamadı</h1>
    <p class="hint">Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir. Bir soru arayın ya da ana sayfaya dönün.</p>
    $(Search-Form 'hero-search' 'q-404' '598 soruda ara')
    <p class="about-link"><a class="btn" href="index.html">Ana sayfaya dön</a></p>
  </section>
</div>
"@
Write-Page -File '404.html' -Title "Sayfa bulunamadı | $SiteName" -Description 'Sayfa bulunamadı.' -Path '404.html' -Body $notFoundBody `
  -Robots 'noindex' -Canonical $false -RootRelative $true

# ---------------- index.html / en/index.html: the home page
# Phones: an iPhone-like home screen. Today's saint, the date with the liturgical season (the card
# takes the season's colour) and the day's rosary mysteries, then four app icons: Ara opens the
# Katekizm search over the blurred screen, and Öğren, Dua Et and Keşfet open Settings-style pages
# listing their pages, with each page's own sections one level further in (see initHome). Cevap Ver
# (İslam'a Cevap) took Ara's place; the Katekizm's own pages keep their search.
# Desktop: the same three cards in a row, a search bar, and the three lists side by side.
# Each page's own content, down to single questions and prayers, is laid out in the browser from
# the site's data files once a page is opened in its app (initHomeTree in assets/script.js).
$HomeApps = @(
  @{ id = 'ogren'; t = 'Öğren'; s = 'İnancın ne olduğu ve nedeni'; ico = $SmallCross; pages = @(
    @{ f = 'neden-katoligiz.html'; ico = $IcoCompass; t = 'Neden Katoliğiz?'
       s = 'Tanrı var mı, İsa kim, neden Katolik Kilise? Kısa cümlelerle.' },
    @{ f = 'katekizm.html'; ico = $SmallCross; t = 'Katekizm'
       s = 'İman, kutsal sırlar, ahlak ve dua üzerine 598 soru ve yanıt.' },
    @{ f = 'kutsal-kitap.html'; ico = $IcoBook; t = 'Kutsal Kitap'; s = $KkMeta.short },
    @{ f = 'sss.html'; ico = $IcoAsk; t = 'Sorular'
       s = 'Katolik inancı üzerine en sık sorulan sorular.' },
    @{ f = 'sozluk.html'; ico = $IcoGlossary; t = 'Sözlük'
       s = "Katolik terimleri A$($Apos)dan Z$($Apos)ye, Katekizm$($Apos)deki yerleriyle." },
    @{ f = 'katolik-sureci.html'; ico = $IcoWay; t = 'Katolik Olma Süreci'
       s = 'Katolik olmak isteyenler için OCIA süreci, adım adım.' },
    @{ f = 'meseller.html'; ico = $IcoScroll; t = "İsa$($Apos)nın Meselleri"
       s = 'Otuz iki mesel, düz bir dille açıklanmış.' }) },
  @{ id = 'tartis'; t = 'Cevap Ver'; s = 'Sorulara cevap, inancın gerekçeleri'; ico = $IcoDebate; pages = @(
    @{ f = 'islama-cevap.html'; ico = $IcoAnswer; t = "İslam$($Apos)a Cevap"
       s = "İslam$($Apos)ın iddiaları, Kur$($Apos)an ve hadislerle sınanıyor." },
    @{ f = 'ateizme-cevap.html'; ico = $IcoCosmos; t = 'Ateizme Cevap'
       s = 'Tanrı var mı? Ateizm, akıl ve kanıtla sınanıyor.' },
    @{ f = 'yahudilere-cagri.html'; ico = $IcoLamp; t = 'Yahudilere Çağrı'
       s = "Nasıralı İsa neden İsrail$($Apos)in Mesih$($Apos)i? Tanah$($Apos)ın sözleriyle, saygıyla." }) },
  @{ id = 'dua'; t = 'Dua Et'; s = 'Ayin, tesbih ve günlük dualar'; ico = $TbChurch; pages = @(
    @{ f = 'kutsal-ayin.html'; ico = $IcoChalice; t = 'Kutsal Ayin'
       s = 'Ayinin sırası, toplanmadan son takdise altı bölüm.' },
    @{ f = 'tesbih-duasi.html'; ico = $IcoBeads; t = 'Tesbih Duası'
       s = 'Bütün dualar ve gizemleriyle.' },
    @{ f = 'ekler.html'; ico = $IcoPrayers; t = 'Sık Kullanılan Dualar'
       s = 'Günlük dualar ve formüller, tek sayfada.' },
    @{ f = 'gunah-cikarma.html'; ico = $IcoKey; t = 'Günah Çıkarma'
       s = 'Nasıl işler, adım adım; vicdan muhasebesi ve sık sorulan sorular.' }) },
  @{ id = 'kesfet'; t = 'Keşfet'; s = 'Azizler, mucizeler ve bu toprakların kökleri'; ico = $IcoCompass; pages = @(
    @{ f = 'azizler.html'; ico = $IcoStar; t = 'Azizler'
       s = 'Bugünün azizini görün, yılın her günü için hayat hikâyeleri.' },
    @{ f = 'mucizeler.html'; ico = $IcoRadiance; t = 'Mucizeler'
       s = 'Meryem Ana görünmeleri, Torino Kefeni, Efkaristiya mucizeleri ve çürümeyen azizler.' },
    @{ f = 'topraklarimizda-hristiyanlik.html'; ico = $IcoRoots; t = 'Topraklarımızda Hristiyanlık'
       s = "Pavlus$($Apos)un memleketi, Vahiy$($Apos)in yedi kilisesi, İznik Konsili." },
    @{ f = 'dogu-katolik-kiliseleri.html'; ico = $IcoEastCross; t = 'Doğu Katolik Kiliseleri'
       s = 'Papa ile birlik içindeki 23 kilise ve beş ayin geleneği.' },
    @{ f = 'kilise-tarihi.html'; ico = $IcoHourglass; t = "Kilise$($Apos)nin Tarihi"
       s = "Pentikost$($Apos)tan II. Vatikan Konsili$($Apos)ne, iki bin yıl." },
    @{ f = 'kiliseler.html'; ico = $IcoPin; t = 'Kilise Bul'
       s = "Türkiye$($Apos)de ayine gidebileceğiniz kiliseler, şehir şehir." }) }
)

# The faint religious images in the corners of the home page's three cards
$DecoSvg = { param($d) "<svg class=`"hm-deco`" viewBox=`"0 0 64 64`" aria-hidden=`"true`" fill=`"none`" stroke=`"currentColor`" stroke-width=`"2.2`" stroke-linecap=`"round`" stroke-linejoin=`"round`">$d</svg>" }
$DecoDove = & $DecoSvg '<path d="M32 42c-2.6 0-4.6-2-4.6-4.6 0-4.2 2.4-8.6 4.6-12.6 2.2 4 4.6 8.4 4.6 12.6 0 2.6-2 4.6-4.6 4.6Z"/><path d="M28 30c-6-4.6-14.6-5.6-22-2.6 7.2 1 13.4 4.2 19 9"/><path d="M36 30c6-4.6 14.6-5.6 22-2.6-7.2 1-13.4 4.2-19 9"/><path d="M29.4 22.6 32 18l2.6 4.6"/><circle cx="32" cy="46" r="2.6"/><path d="M32 51v7M25 50l-3.6 6M39 50l3.6 6M20 46l-5.4 3.4M44 46l5.4 3.4"/>'
$DecoCross = & $DecoSvg '<path d="M32 6v52M18 20h28"/><path d="M32 20m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0" stroke-width="1.4"/><path d="M26 58h12" stroke-width="1.6"/>'
$DecoChalice = & $DecoSvg '<circle cx="32" cy="9" r="5"/><path d="M32 6.4v5.2M29.4 9h5.2" stroke-width="1.4"/><path d="M18 18h28c0 11-5.6 18-14 18S18 29 18 18Z"/><path d="M32 36v12"/><path d="M22 58c0-5.6 4.4-10 10-10s10 4.4 10 10Z"/>'
$IcoChevR = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>'
# The home page's saint and mystery cards take the painting of the day's saint page (Azizler's
# when the saint has none) and of the day's mysteries; script.js picks it from these maps
$SaintArtJson = '{' + (($Tablolar.pages.PSObject.Properties | ForEach-Object { "`"$($_.Name)`":`"$($_.Value)`"" }) -join ',') + ',"*":"05franc"}'
$SetArtJson = '{"sevinc":"66annunc","isik":"47emmau","aci":"55flagel","yucelik":"45death","*":"58rosar"}'
function Home-Page {
  $loading = 'Yükleniyor…'
  $cardDate = @"
  <div class="hm-today hm-today-date" id="bugun">
    <div class="hm-card hm-date" data-home-lit>$(Art-Img '13fligh' 'hm-art' '(min-width: 980px) 40vw, 50vw' 'high')$DecoDove
      <span class="hm-label">Bugün</span>
      <span class="hm-day" data-hd-day>$loading</span><span class="hm-year" data-hd-year></span><time class="hm-time" data-hd-time></time>
      <span class="hm-season" data-hd-season></span><span class="hm-sub" data-hd-colour></span>
    </div>
  </div>
"@
  $cardsRest = @"
  <div class="hm-today hm-today-rest">
    <a class="hm-card hm-myst" href="tesbih-duasi.html#tesbih-rehberi" data-home-mystery data-art-map="$(Attr $SetArtJson)"><span class="hm-art" aria-hidden="true"></span>$DecoCross
      <span class="hm-label">$IcoBeads Günün Gizemi</span>
      <span class="hm-mn" data-hm-name>$loading</span><span class="hm-sub" data-hm-days></span>
      <span class="hm-go">Tesbihe başla $IcoChevR</span>
    </a>
    <a class="hm-card hm-saint" href="azizler.html" data-home-saint data-art-map="$(Attr $SaintArtJson)"><span class="hm-art" aria-hidden="true"></span>$DecoChalice
      <span class="hm-label">$IcoStar Bugünün Azizi</span>
      <span class="hm-sn" data-hs-name>$loading</span><span class="hm-sub" data-hs-title></span><span class="hm-bio" data-hs-bio></span>
      <span class="hm-go">Hayatını oku $IcoChevR</span>
    </a>
  </div>
"@
  # Kilise Bul on the front page: what people look for most. A small map of Turkey with a dot for
  # every city that has a church, a line saying what is there, and the biggest cities as one-tap links
  $mmB = $CmShape.box; $mmPad = 5
  $mmVb = "$(Map-Num ($mmB[0] - $mmPad)) $(Map-Num ($mmB[1] - $mmPad)) $(Map-Num ($mmB[2] - $mmB[0] + 2 * $mmPad)) $(Map-Num ($mmB[3] - $mmB[1] + 2 * $mmPad))"
  $mmDots = ($Churches.cities | ForEach-Object { $xy = Map-XY $_.lat $_.lon; $r = if (@($_.churches).Count -gt 5) { 5.2 } else { 3.6 }; "<circle class=`"mm-dot`" cx=`"$($xy[0])`" cy=`"$($xy[1])`" r=`"$r`"></circle>" }) -join ''
  $mmSvg = "<svg class=`"mm-svg`" viewBox=`"$mmVb`" aria-hidden=`"true`" focusable=`"false`"><defs><clipPath id=`"mm-out`"><path clip-rule=`"evenodd`" d=`"M-500-500H1500V1100H-500ZM$($mmB[0]) $($mmB[1])H$($mmB[2])V$($mmB[3])H$($mmB[0])Z`"></path></clipPath></defs>" +
    "<rect class=`"mm-sea`" x=`"-500`" y=`"-500`" width=`"2000`" height=`"1600`"></rect><path class=`"mm-land`" d=`"$($AnShape.land)`"></path><path class=`"mm-tr`" d=`"$($AnShape.turkey)`" clip-path=`"url(#mm-out)`"></path><path class=`"mm-tr`" d=`"$($CmShape.marmara)`"></path><path class=`"mm-lake`" d=`"$($AnShape.lakes)`"></path>$mmDots</svg>"
  $mmN = 0; foreach ($c in $Churches.cities) { $mmN += @($c.churches).Count }
  $mmCities = (($Churches.cities | Select-Object -First 7) | ForEach-Object { "<li><a href=`"kiliseler.html#$($_.id)`">$($_.name -replace ' \(.*\)$', '')<small>$(@($_.churches).Count)</small></a></li>" }) -join ''
  $find = @"
  <section class="hm-find" aria-labelledby="hm-find-h">
    <div class="hm-find-top">
      <a class="hm-find-main" href="kiliseler.html">
        <span class="hm-label">$IcoPin Kilise Bul</span>
        <h2 class="hm-find-t" id="hm-find-h">Türkiye$($Apos)de Katolik kilisesi mi arıyorsunuz?</h2>
        <span class="hm-find-s">$(@($Churches.cities).Count) şehirde $mmN kilise: adres, telefon ve ayin saatleri.</span>
        <span class="hm-go">Kiliseleri göster $IcoChevR</span>
      </a>
      <a class="hm-find-map" href="kiliseler.html#harita" tabindex="-1" aria-hidden="true">$mmSvg</a>
    </div>
    <ul class="hm-find-cities" $(TA 'aria-label' 'Şehirler')>$mmCities<li><a class="hm-find-all" href="kiliseler.html#harita">Tümü</a></li></ul>
  </section>
"@
  $placeholder = "Katekizm$($Apos)de ara: Türkçe, İngilizce ya da soru numarası"
  $searchDesk = "<div class=`"hm-search`">$(Search-Form 'hm-search-form' 'q-home' $placeholder)</div>"
  # The Church's history as a strip of small round pictures, oldest first (data/kilise-tarihi.json):
  # each with its year, title and a short line; hovering or focusing one shows the longer text,
  # clicking it opens the event on kilise-tarihi.html. Under the strip, every year in a row that
  # glides along with it, the year in view lit and the rest dimmed, then a slider (script.js,
  # initHistory). Events that share a year share one button (data-g on each event). The round
  # pictures are small square copies (assets/art/tl/s); kilise-tarihi.html shows the full ones.
  $tlItems = New-Object System.Collections.Generic.List[string]; $n = 0
  $tlYears = New-Object System.Collections.Generic.List[string]; $g = -1; $lastLbl = ''
  foreach ($it in $Tarih.items) {
    $nums = @([regex]::Matches($it.y, '\d+') | ForEach-Object { $_.Value })
    $lbl = if ($it.y -match 'yüzyıl') { ($nums -join '-') + '. yy' } elseif ($it.y -match '^\d+\S*l[ae]r') { $Matches[0] } else { $nums[0] }
    if ($lbl -ne $lastLbl) { $g++; $lastLbl = $lbl; $tlYears.Add("<li><button type=`"button`" class=`"hx-yr`" data-hx-to=`"$n`" $(TA 'aria-label' "$($it.y): $($it.t)")>$($lbl)</button></li>") }
    $n++
    $tlItems.Add("<li class=`"hx-it`" data-y=`"$($it.y)`" data-g=`"$g`"><a class=`"hx-a`" href=`"kilise-tarihi.html#olay-$n`"><span class=`"hx-ph`"><picture><source type=`"image/avif`" srcset=`"assets/art/tl/s/$($it.img).avif`"><source type=`"image/webp`" srcset=`"assets/art/tl/s/$($it.img).webp`"><img src=`"assets/art/tl/s/$($it.img).jpg`" alt=`"`" width=`"240`" height=`"240`" loading=`"lazy`" decoding=`"async`" draggable=`"false`"></picture></span>" +
      "<span class=`"hx-y`">$($it.y)</span><span class=`"hx-t`">$($it.t)</span><span class=`"hx-s`">$($it.s)</span></a><span class=`"hx-d`" hidden>$($it.d)</span></li>")
  }
  $gsHtml = (($GreatSaints.saints | Select-Object -First 10) | ForEach-Object { "<a href=`"$($_.id).html`">$($_.name)</a>" }) -join ''
  $lists = @"
<div class="hm-journey">
  <div class="hj-grid">
    <section class="hj-debate" aria-labelledby="hj-h"><p class="hj-kick">Cevap Ver</p><h2 class="hj-h" id="hj-h">Sorular ve itirazlar</h2>
      <div class="hd-grid">
        <a class="hd-card" href="islama-cevap.html">$(Art-Img 'w-sultan' 'hd-art' '(min-width: 980px) 24vw, 50vw')<span class="hd-t">İslam$($Apos)a Cevap</span><span class="hd-d">Kur$($Apos)an, hadisler ve İslam tarihi ışığında Hristiyanlığa yöneltilen sorulara cevaplar.</span><span class="hd-more">Okuyun$IcoChevR</span></a>
        <a class="hd-card" href="ateizme-cevap.html">$(Art-Img '34thomas' 'hd-art' '(min-width: 980px) 24vw, 50vw')<span class="hd-t">Ateizme Cevap</span><span class="hd-d">Tanrı var mı, İsa dirildi mi? Aklın ve tarihin söyledikleri.</span><span class="hd-more">Okuyun$IcoChevR</span></a>
        <a class="hd-card hd-wide" href="yahudilere-cagri.html">$(Art-Img 'y-presen' 'hd-art' '(min-width: 980px) 48vw, 60vw')<span class="hd-t">Yahudilere Çağrı</span><span class="hd-d">Nasıralı İsa neden İsrail$($Apos)in Mesih$($Apos)i? Tanah$($Apos)ın kendi sözleriyle, saygıyla.</span><span class="hd-more">Okuyun$IcoChevR</span></a>
      </div>
    </section>
    <aside class="hj-aside">
      <a class="hj-feat" href="tesbih-tarihi.html">$(Art-Img '42loreto' 'hj-art' '30vw')<span class="hj-kick">Öne çıkan yazı</span><span class="hj-ft">$($RosaryHistory.title)</span><span class="hj-fd">$($RosaryHistory.lead)</span><span class="hj-more">Okuyun$IcoChevR</span></a>
      <figure class="hj-q"><blockquote><p>“Bizi kendin için yarattın ve kalbimiz sende huzur bulana dek huzursuzdur.”</p></blockquote><figcaption>Aziz Augustinus, İtiraflar</figcaption></figure>
      <div class="hj-saints"><p class="hj-kick">En çok bilinen 20 aziz</p><div>$gsHtml<a class="hj-all" href="azizler.html#buyuk-azizler">ve diğerleri…</a></div></div>
    </aside>
  </div>
  <section class="hx" aria-labelledby="hx-h">
    <div class="hx-head"><div><p class="hj-kick">Tarih</p><h2 class="hj-h" id="hx-h"><a class="hx-hl" href="kilise-tarihi.html">Kilise$($Apos)nin tarihi$IcoChevR</a></h2><p class="hx-lead">Havarilerden bugüne Kilise tarihinin önemli olayları.</p></div>
    <div class="hx-ctl"><button type="button" class="hx-btn" data-hx-step="-1" $(TA 'aria-label' 'Önceki')><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg></button><button type="button" class="hx-btn" data-hx-step="1" $(TA 'aria-label' 'Sonraki')>$IcoChevR</button></div></div>
    <ol class="hx-track" tabindex="0" $(TA 'aria-label' "Kilise tarihi, $n olay, eskiden yeniye")>$($tlItems -join '')</ol>
    <div class="hx-scale"><div class="hx-years"><ol class="hx-yl" $(TA 'aria-label' 'Yıllar')>$($tlYears -join '')</ol></div>
      <input class="hx-range" type="range" min="0" max="1000" value="0" step="1" $(TA 'aria-label' 'Zaman çizelgesinde ilerle') aria-valuetext="33"></div>
  </section>
</div>
"@
  # Phone: the icons, the search overlay and the three apps
  # The bar at the foot of the home screen, as in the App Store: a glyph and a name for each app,
  # the open one in a capsule that glides to it (script.js moves .hm-pill)
  $dockGlyph = @{
    ara    = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.4" cy="10.4" r="6.6"/><path d="m15.3 15.3 5.2 5.2"/></g></svg>'
    ogren  = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor" transform="translate(2 2) scale(.2)">' + $CrossShapes + '</g></svg>'
    dua    = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><circle cx="12" cy="3.4" r="1.25"/><circle cx="15.9" cy="4.5" r="1.25"/><circle cx="18.4" cy="7.6" r="1.25"/><circle cx="18.4" cy="11.4" r="1.25"/><circle cx="8.1" cy="4.5" r="1.25"/><circle cx="5.6" cy="7.6" r="1.25"/><circle cx="5.6" cy="11.4" r="1.25"/><circle cx="8.1" cy="14.4" r="1.25"/><circle cx="15.9" cy="14.4" r="1.25"/><circle cx="12" cy="15.6" r="1.6"/><rect x="11.25" y="17.2" width="1.5" height="5.6" rx=".4"/><rect x="9.6" y="18.6" width="4.8" height="1.4" rx=".4"/></g></svg>'
    tartis = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><path d="M3.8 3.6h10.4a2 2 0 0 1 2 2v5.8a2 2 0 0 1-2 2H8.6l-4 3.2v-3.2h-.8a2 2 0 0 1-2-2V5.6a2 2 0 0 1 2-2Z"/><path d="M17.8 8.2h2.4a2 2 0 0 1 2 2v5.6a2 2 0 0 1-2 2h-.6V21l-3.8-3.2h-4.4a2 2 0 0 1-2-2v-1.4h4.8a3.6 3.6 0 0 0 3.6-3.6Z" opacity=".78"/></g></svg>'
    kesfet = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2c.9 3.4 1.9 5.4 3.4 6.7 1.5 1.4 3.4 2.2 6.4 3.1-3 .9-4.9 1.7-6.4 3.1-1.5 1.3-2.5 3.3-3.4 6.7-.9-3.4-1.9-5.4-3.4-6.7-1.5-1.4-3.4-2.2-6.4-3.1 3-.9 4.9-1.7 6.4-3.1 1.5-1.3 2.5-3.3 3.4-6.7Z"/></svg>'
  }
  $icons = "<span class=`"hm-pill`" aria-hidden=`"true`"></span>" +
    (($HomeApps | ForEach-Object { "<button type=`"button`" class=`"hm-app`" data-app-open=`"$($_.id)`" aria-haspopup=`"dialog`" aria-controls=`"app-$($_.id)`"><span class=`"hm-icon`">$($dockGlyph[$_.id])</span><span class=`"hm-app-t`">$($_.t)</span></button>" }) -join '')
  # Kilise Bul is one tap from the bar: a plain link, not an app that opens over the page
  $icons += "<a class=`"hm-app hm-link`" href=`"kiliseler.html`"><span class=`"hm-icon`"><svg viewBox=`"0 0 24 24`" aria-hidden=`"true`"><g fill=`"none`" stroke=`"currentColor`" stroke-width=`"2.2`" stroke-linecap=`"round`" stroke-linejoin=`"round`"><path d=`"M12 21.5s7.2-6.6 7.2-12.2a7.2 7.2 0 0 0-14.4 0c0 5.6 7.2 12.2 7.2 12.2Z`"/><path d=`"M12 5.6v6.2M9.4 8.3h5.2`"/></g></svg></span><span class=`"hm-app-t`">Kilise Bul</span></a>"
  $close = 'Kapat'
  $apps = ($HomeApps | ForEach-Object {
    $app = $_; $appT = $app.t; $appA = TA 'aria-label' $app.t; $i = 0
    # Each row opens the page itself, which a phone shows as the next screen of this app
    $rows = ($app.pages | ForEach-Object {
      "<a class=`"ios-row`" href=`"$($_.f)`" data-app-page><span class=`"ios-ri`">$($_.ico)</span><span class=`"ios-rt`"><span class=`"ios-t`">$($_.t)</span><span class=`"ios-s`">$($_.s)</span></span>$IcoChevR</a>"
    }) -join ''
    $pagesHtml = "<section class=`"ios-page is-current`" data-page=`"root`"><header class=`"ios-nav`"><span></span><span class=`"ios-nt`">$appT</span><button type=`"button`" class=`"ios-done`" data-app-close>$close</button></header>" +
      "<div class=`"ios-scroll`"><h2 class=`"ios-large`">$appT</h2><p class=`"ios-lead`">$($app.s)</p><div class=`"ios-group`">$rows</div></div></section>"
    "<div class=`"ios-app`" id=`"app-$($app.id)`" data-app=`"$($app.id)`" role=`"dialog`" aria-modal=`"true`" $appA hidden><div class=`"ios-splash app-$($app.id)`">$($app.ico)</div><div class=`"ios-stack`">$pagesHtml</div></div>"
  }) -join "`n"
  $tag = $SiteTag
  $body = @"
<div class="wrap home-v2">
  <h1 class="visually-hidden">$tag</h1>
  <div class="hm-about"><p class="hm-about-t">$tag</p><p class="hm-about-s">$($fm['about'])</p></div>
  <div class="hm-duo">
$cardDate
$find
  </div>
$cardsRest
  $searchDesk
  <nav class="hm-apps" $(TA 'aria-label' 'Bölümler')>$icons</nav>
  $lists
</div>
$apps
"@
  $homePath = ''
  $q = 'katekizm.html'
  $ld = '{"@context":"https://schema.org","@type":"WebSite","name":' + (JStr $SiteName) +
    ',"url":' + (JStr "$SiteUrl/$homePath") + ',"inLanguage":"tr","description":' + (JStr $SiteTag) + '}'
  Write-Page -File 'index.html' -Title "$SiteName | $SiteTag" `
    -Description "Türkçe Katolik Portalı: Katolik Kilisesi Katekizmi Özeti$($Apos)nin tam çevirisi ve Katolik inancı üzerine sıkça sorulan sorular." `
    -Path '' -Body $body -JsonLd @($ld)
}
Home-Page

# The Katekizm overview's old address (katesizm.html): forwards with any ?q= search and #question
$html = "<!DOCTYPE html>`n<html lang=`"tr`">`n<head>`n<meta charset=`"utf-8`">`n<title>Katekizm | $SiteName</title>`n<meta name=`"robots`" content=`"noindex`">`n" +
  "<link rel=`"canonical`" href=`"$SiteUrl/katekizm.html`">`n<meta http-equiv=`"refresh`" content=`"0; url=/katekizm.html`">`n" +
  "<script>location.replace('/katekizm.html' + location.search + location.hash)</script>`n</head>`n<body><p><a href=`"/katekizm.html`">Katekizm</a></p></body>`n</html>`n"
[IO.File]::WriteAllText((Join-Path $Root 'katesizm.html'), $html, $Utf8)

# ================================================================== sitemap.xml & robots.txt
$pages = @(
  @{ p = ''; pr = '1.0' }, @{ p = 'katekizm.html'; pr = '0.9' },
  @{ p = 'iman-ikrari.html'; pr = '0.9' }, @{ p = 'kutsal-sirlar.html'; pr = '0.9' },
  @{ p = 'mesihte-yasam.html'; pr = '0.9' }, @{ p = 'hristiyan-duasi.html'; pr = '0.9' }, @{ p = 'ekler.html'; pr = '0.8' },
  @{ p = 'kutsal-kitap.html'; pr = '0.9' }, @{ p = 'tesbih-duasi.html'; pr = '0.9' }, @{ p = 'tesbih-tarihi.html'; pr = '0.8' }, @{ p = 'katolik-sureci.html'; pr = '0.9' },
  @{ p = 'gunah-cikarma.html'; pr = '0.9' }, @{ p = 'topraklarimizda-hristiyanlik.html'; pr = '0.9' }, @{ p = 'dogu-katolik-kiliseleri.html'; pr = '0.8' }, @{ p = 'kilise-tarihi.html'; pr = '0.8' },
  @{ p = 'neden-katoligiz.html'; pr = '0.9' }, @{ p = 'islama-cevap.html'; pr = '0.8' }, @{ p = 'ateizme-cevap.html'; pr = '0.8' }, @{ p = 'yahudilere-cagri.html'; pr = '0.8' },
  @{ p = 'azizler.html'; pr = '0.9' }, @{ p = 'kutsal-ayin.html'; pr = '0.9' },
  @{ p = 'sss.html'; pr = '0.9' }, @{ p = 'sozluk.html'; pr = '0.8' }, @{ p = 'kiliseler.html'; pr = '0.9' }, @{ p = 'motu-proprio.html'; pr = '0.6' },
  @{ p = 'giris.html'; pr = '0.6' }, @{ p = 'mucizeler.html'; pr = '0.7' },
  @{ p = 'iletisim.html'; pr = '0.4' }, @{ p = 'meseller.html'; pr = '0.9' }, @{ p = 'erisilebilirlik.html'; pr = '0.3' },
  @{ p = 'gizlilik.html'; pr = '0.3' }, @{ p = 'kaynaklar-ve-telif.html'; pr = '0.3' }
) + ($GreatSaints.saints | ForEach-Object { @{ p = "$($_.id).html"; pr = '0.6' } }) + ($CityPages.Values | Sort-Object | ForEach-Object { @{ p = $_; pr = '0.7' } }) + ($ChurchPages | ForEach-Object { @{ p = $_; pr = '0.5' } })
# <lastmod> is the date the page's data last changed in git (Page-LastMod), never simply the build date.
$smUrls = foreach ($pg in $pages) {
  $lm = Page-LastMod $(if ($pg.p) { $pg.p } else { 'index.html' })
  "  <url><loc>$SiteUrl/$($pg.p)</loc>$(if ($lm) { "<lastmod>$lm</lastmod>" })</url>"
}
$sm = '<?xml version="1.0" encoding="UTF-8"?>' + "`n" + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + "`n" +
  ($smUrls -join "`n") + "`n</urlset>`n"
[IO.File]::WriteAllText((Join-Path $Root 'sitemap.xml'), $sm, $Utf8)
# Every crawler is welcome: search engines and the AI assistants that answer people's questions
# (ChatGPT, Claude, Perplexity, Gemini…) can read and cite the whole site.
[IO.File]::WriteAllText((Join-Path $Root 'robots.txt'), "User-agent: *`nAllow: /`n`nSitemap: $SiteUrl/sitemap.xml`n", $Utf8)

# llms.txt (llmstxt.org): a plain map of the site for AI assistants, each page with its
# one-line description.
$llmSkip = @('404.html', 'katesizm.html')
$llmPages = @($script:PageInfo | Where-Object { $llmSkip -notcontains $_.File -and $_.Robots -notmatch 'noindex' } | Sort-Object -Stable { if ($_.File -eq 'index.html') { 0 } else { 1 } })
$llmCut = { param($t) ($t -replace ([regex]::Escape(" | $SiteName") + '$'), '') -replace ('^' + [regex]::Escape($SiteName) + ' \| '), '' }
$llms = "# $SiteName`n`n> A Turkish Catholic portal (Turkish only): the Compendium of the Catechism of the Catholic Church (598 questions and answers), the saints of the calendar, prayers and the Rosary, the order of the Mass, Catholic churches in Turkey with Mass times, and answers about the faith, Islam and atheism.`n`n" +
  "The English edition is a separate site, Verbum Domini: $VdUrl/. Quotations of the Catechism follow the official Turkish translation.`n`n" +
  "## Türkçe`n`n" +
  (($llmPages | ForEach-Object { "- [$(& $llmCut $_.Title)]($SiteUrl/$($_.Path)): $($_.Desc)" }) -join "`n") + "`n"
[IO.File]::WriteAllText((Join-Path $Root 'llms.txt'), $llms, $Utf8)
# IndexNow: the key file that proves the site is ours when the deploy tells Bing, Yandex and
# the others which addresses changed (see .github/workflows/deploy.yml)
$IndexNowKey = '6d932ac291e035e4f4741e45a828f802'
[IO.File]::WriteAllText((Join-Path $Root "$IndexNowKey.txt"), $IndexNowKey, $Utf8)

# security.txt (RFC 9116): how to report a vulnerability, without publicly guessing at one.
# Expires a year out from each build, so the file never goes silently stale.
$wellKnownDir = Join-Path $Root '.well-known'
if (-not (Test-Path $wellKnownDir)) { New-Item -ItemType Directory -Path $wellKnownDir | Out-Null }
$secExpires = (Get-Date).AddYears(1).ToString('yyyy-MM-ddT00:00:00.000Z')
$secTxt = "Contact: $SiteUrl/iletisim.html`nExpires: $secExpires`nPreferred-Languages: tr`nCanonical: $SiteUrl/.well-known/security.txt`n"
[IO.File]::WriteAllText((Join-Path $wellKnownDir 'security.txt'), $secTxt, $Utf8)
Write-Host "  + sitemap.xml, robots.txt, llms.txt, IndexNow key, .well-known/security.txt"
Write-Host "Done."
