# Owner steps: Cloudflare and GitHub

The settings from the security audit that only you can change, because they live in the
Cloudflare dashboard or in GitHub, not in this repository. Work down the list; each step says how
to check it worked. None of them needs a secret to be shared with anyone.

Where a menu name has moved in the Cloudflare dashboard, press **Ctrl+K** (Cmd+K on a Mac) and type
the setting's name: the search finds it.

---

## 1. GitHub and Cloudflare: let the deploy publish the Turkish contact form

The Turkish contact form Worker (`cloudflare/contact-worker.js`) is now published by
`.github/workflows/deploy-contact.yml` instead of being pasted into the dashboard. It uses the same
two repository secrets as the English deploy, so nothing new goes into GitHub, but the token must
be allowed to touch katolikdunyasi.com.

1. **Check the Worker's name.** Cloudflare → **Workers & Pages**. The contact Worker should be
   called `katolikdunyasi-contact`. If it has another name, tell me the name (it is not secret) and I
   will put it in `cloudflare/wrangler.jsonc`; otherwise the deploy makes a second Worker.
2. **Check it is in the same account as the English site** (`verbumdomini`). Both should be listed
   on the same **Workers & Pages** page.
3. **Check the API token's rights.** Cloudflare → your profile (top right) → **API Tokens** → the
   token the GitHub secret `CLOUDFLARE_API_TOKEN` holds (the "Edit Cloudflare Workers" one) →
   **Edit**. It needs:
   - Account · **Workers Scripts** · Edit (it already has this)
   - Zone · **Workers Routes** · Edit, with **Zone Resources** including `katolikdunyasi.com`
     ("All zones" or a list with both `verbumdomini.ca` and `katolikdunyasi.com`)

   Save. The token's value does not change, so the GitHub secret stays as it is.
4. **Run the deploy.** GitHub → the repository → **Actions** → **Deploy the contact form Worker**.
   If the run started by this push failed (red), open it → **Re-run all jobs**. Otherwise press
   **Run workflow**. It should go green in about a minute.
5. **Check the Worker.** Cloudflare → `katolikdunyasi-contact` → **Settings**:
   - **Variables and Secrets**: `TURNSTILE_SECRET` and `TO_ADDRESS` are still there (deploys keep
     secrets), and `FROM_ADDRESS` is `form@katolikdunyasi.com`.
   - **Bindings**: `CONTACT_EMAIL` (Send email) and `CONTACT_LIMIT` (Rate limiting).
   - **Domains & Routes**: `katolikdunyasi.com/api/*`.
6. **Send a test message** from https://katolikdunyasi.com/iletisim.html and check it arrives.

From now on, never edit the Worker's code in the dashboard: the next deploy would replace it.

---

## 2. Cloudflare, katolikdunyasi.com: security headers (audit M2)

GitHub Pages cannot send these headers, but Cloudflare can add them on the way out.

1. Cloudflare → **katolikdunyasi.com** → **Rules** → **Overview** → **Create rule** →
   **Response Header Transform Rule**.
2. **Rule name:** `Security headers`.
3. **If incoming requests match:** choose **Custom filter expression** → **Edit expression** and
   paste:

   ```
   (http.host in {"katolikdunyasi.com" "www.katolikdunyasi.com"})
   ```

4. **Then:** add these, each as **Set static** (use **Set new header** for each line):

   | Header name | Value |
   |---|---|
   | `X-Frame-Options` | `DENY` |
   | `Content-Security-Policy` | `frame-ancestors 'none'; base-uri 'self'; object-src 'none'` |
   | `Referrer-Policy` | `strict-origin-when-cross-origin` |
   | `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self), payment=(), usb=(), fullscreen=(self)` |
   | `Cross-Origin-Opener-Policy` | `same-origin` |
   | `X-Content-Type-Options` | `nosniff` |

5. **Deploy**.

Check: https://securityheaders.com/?q=katolikdunyasi.com shows the six headers. The pages keep
their own script policy (in each page's head); this header policy only adds the framing rules, and
the two work together.

## 3. Cloudflare, katolikdunyasi.com: HSTS for a year (audit M2)

First make sure every name under the domain works over HTTPS: Cloudflare → **katolikdunyasi.com**
→ **DNS** → **Records**. For each name listed (for example `www`, `mail`), open
`https://<name>.katolikdunyasi.com` in a browser. Names used only for mail (MX records) are fine. If
one does not open over HTTPS, skip "Include subdomains" below and tell me.

1. Cloudflare → **katolikdunyasi.com** → **SSL/TLS** → **Edge Certificates** → **HTTP Strict
   Transport Security (HSTS)** → **Enable HSTS** (or **Change settings**).
2. Tick that you understand, then set:
   - **Enable HSTS:** On
   - **Max Age:** 12 months
   - **Apply HSTS policy to subdomains (includeSubDomains):** On
   - **Preload:** Off
   - **No-Sniff header:** On
3. **Save**.

Check: `curl -sI https://katolikdunyasi.com/ | grep -i strict` shows `max-age=31536000; includeSubDomains`.

## 4. Cloudflare, katolikdunyasi.com: leave the churches' email addresses as they are (audit L10)

The church pages list public email addresses. Cloudflare rewrites them into
`/cdn-cgi/l/email-protection` links, which open a Cloudflare page for visitors without JavaScript.

1. Cloudflare → **katolikdunyasi.com** → search (Ctrl+K) for **Email Address Obfuscation** (under
   **Scrape Shield** or **Security → Settings**, depending on the dashboard version).
2. Turn it **Off**.

Check: `curl -s https://katolikdunyasi.com/kilise/<any church page>.html | grep -c email-protection`
prints `0`. The contact form is not affected: your own address was never on the site.

## 5. Cloudflare, katolikdunyasi.com: browser cache for the paintings and fonts (audit L3)

The paintings and fonts keep their file names when they change, so a year in the browser's cache is
too long. (The CSS, the JS, the data files and now the 3D rosary carry a content hash and can keep
the year.)

1. Cloudflare → **katolikdunyasi.com** → **Caching** → **Cache Rules** (or **Rules** → **Cache
   Rules**). Find the rule that sets a 1 year **Browser TTL** for `/assets/`.
2. **Create rule** (a new one, listed **after** that rule, so it wins):
   - **Rule name:** `Paintings and fonts: 30 days`
   - **Custom filter expression:**

     ```
     (http.host eq "katolikdunyasi.com" and (starts_with(http.request.uri.path, "/assets/art/") or starts_with(http.request.uri.path, "/assets/fonts/")))
     ```

   - **Cache eligibility:** Eligible for cache
   - **Browser TTL:** Override origin, **30 days**
   - Leave Edge TTL as the existing rule has it.
3. **Deploy**.

Check: `curl -sI https://katolikdunyasi.com/assets/art/13fligh.jpg | grep -i cache-control` shows
`max-age=2592000`.

## 6. Nothing to do: Cloudflare's bot-detection script (from audit M3)

Cloudflare adds a small bot-detection script ("JavaScript detections") to the pages. The pages'
script policy blocks it, which shows as one harmless error in the browser console; visitors notice
nothing. On the Free plan this cannot be switched off on its own (only paid plans have a separate
switch), and with Bot Fight Mode off Cloudflare does not act on its result. Letting it run would
mean weakening the pages' script policy for every page, so it stays blocked.

---

## Nothing to do

- **verbumdomini.ca**: its headers, HSTS, caching, the contact form's rate limit and the end of the
  `workers.dev` address all come from the repository and deploy on their own.
- **GitHub secrets**: no new ones. `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` stay as they are.
