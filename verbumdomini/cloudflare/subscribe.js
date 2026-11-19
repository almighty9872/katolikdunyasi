/* Newsletter sign-up: the forms on the home page and the blog post to /api/subscribe, which worker.js
   hands to this. It adds the address to beehiiv through its API with double opt-in (beehiiv then sends
   its own confirmation email). A script's request gets JSON, so the page shows the result next to the
   box in green or red and the reader never leaves the site. Without JavaScript the form posts here as
   a page: success goes to /newsletter-check-inbox.html, anything else gets a short page with the message.

   Set in Cloudflare (Workers > verbumdomini > Settings > Variables and Secrets), never in this repo:
     Secret   BEEHIIV_API_KEY         a beehiiv API key (beehiiv: Workspace > API)
   Set in wrangler.jsonc:
     Var      BEEHIIV_PUBLICATION_ID  the publication's ID (pub_...), not a secret
     Binding  SUBSCRIBE_LIMIT         rate limit, a few tries a minute from one address */

const ORIGINS = ['https://verbumdomini.ca', 'https://www.verbumdomini.ca', 'https://blog.verbumdomini.ca'];
const EMAIL_RX = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;

// Each answer: whether it shows in green (ok) and the words shown
const MSG = {
  sent: [true, 'Thank you! Check your email and click the link to confirm.'],
  already: [true, 'You’re already subscribed. Thank you!'],
  invalid: [false, 'That email address doesn’t look right. Please check it and try again.'],
  blocked: [false, 'This address can’t be subscribed. Please write to us on the contact page.'],
  busy: [false, 'Too many tries. Please wait a minute and try again.'],
  error: [false, 'Something went wrong. Please try again later.']
};

export async function subscribe(request, env) {
  const origin = request.headers.get('Origin') || '';
  const cors = ORIGINS.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Max-Age': '86400' } });
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  if (!cors['Access-Control-Allow-Origin']) return new Response('Forbidden', { status: 403 });
  // A plain form post (no JavaScript) navigates to this address, a script's fetch does not
  const page = request.headers.get('Sec-Fetch-Mode') === 'navigate'
    || (!request.headers.get('Sec-Fetch-Mode') && /text\/html/.test(request.headers.get('Accept') || ''));
  const answer = (/** @type {keyof MSG} */ k, status = 200) => {
    const [ok, msg] = MSG[k];
    if (!page) return new Response(JSON.stringify({ ok, msg }), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    if (k === 'sent') return new Response(null, { status: 303, headers: { Location: 'https://verbumdomini.ca/newsletter-check-inbox.html', 'Cache-Control': 'no-store' } });
    const back = origin === 'https://blog.verbumdomini.ca' ? origin + '/' : 'https://verbumdomini.ca/';
    return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<meta name="robots" content="noindex"><title>Newsletter · Verbum Domini</title>'
      + '<style>body{margin:0;font:18px/1.6 Georgia,serif;background:#eeebe5;color:#15110f}main{max-width:34rem;margin:16vh auto 0;padding:0 16px}a{color:#3a6491}</style></head>'
      + `<body><main><h1>Newsletter</h1><p>${msg}</p><p><a href="${back}">Go back</a></p></main></body></html>`,
      { status: ok ? 200 : status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  };

  if (env.SUBSCRIBE_LIMIT) {
    const { success } = await env.SUBSCRIBE_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
    if (!success) return answer('busy', 429);
  }
  let form;
  try { form = await request.formData(); } catch { return answer('invalid', 400); }
  const email = String(form.get('email') || '').trim().slice(0, 200);
  if (!EMAIL_RX.test(email)) return answer('invalid', 400);
  if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) return answer('error', 500);

  let res, data = {};
  try {
    res = await fetch(`https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.BEEHIIV_API_KEY, 'Content-Type': 'application/json' },
      // "on": beehiiv sends the confirmation email and keeps the address pending until it is clicked.
      // reactivate_existing stays off, so someone who unsubscribed can't be signed up again by anyone else.
      body: JSON.stringify({ email, double_opt_override: 'on', reactivate_existing: false, send_welcome_email: false,
        utm_source: 'verbumdomini', referring_site: origin }),
      signal: AbortSignal.timeout(8000)
    });
    data = await res.json().catch(() => ({}));
  } catch (e) {
    console.error('beehiiv unreachable', e && e.message);
    return answer('error', 502);
  }
  if (res.ok) {
    // beehiiv answers an address it already has with that subscription instead of an error
    const st = String(data.data && data.data.status || '');
    if (st === 'active') return answer('already');
    if (st === 'invalid') return answer('invalid', 400);
    if (st === 'inactive' || st === 'needs_attention') return answer('blocked', 400);
    return answer('sent');
  }
  if (res.status === 429) return answer('busy', 429);
  const detail = (data.errors || []).map((/** @type {{code?: string, message?: string}} */ x) => (x.code || '') + ' ' + (x.message || '')).join('; ');
  if (res.status === 400 && /email/i.test(detail)) return answer('invalid', 400);
  console.error('beehiiv', res.status, detail);
  return answer('error', 502);
}
