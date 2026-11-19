/* Newsletter sign-up: the forms on the home page and the blog post to /api/subscribe, which worker.js
   hands to this. It adds the address to Buttondown through its API (Buttondown then sends its own
   confirmation email) and answers with JSON, so the page shows the result next to the box in green
   or red and the reader never leaves the site. Without JavaScript the forms still post straight to Buttondown.

   Set in Cloudflare (Workers > verbumdomini > Settings > Variables and Secrets), never in this repo:
     Secret   BUTTONDOWN_API_KEY  a Buttondown API key (Buttondown: Settings > API)
   Set in wrangler.jsonc:
     Binding  SUBSCRIBE_LIMIT     rate limit, a few tries a minute from one address */

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
  const answer = (/** @type {keyof MSG} */ k, status = 200) =>
    new Response(JSON.stringify({ ok: MSG[k][0], msg: MSG[k][1] }), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (env.SUBSCRIBE_LIMIT) {
    const { success } = await env.SUBSCRIBE_LIMIT.limit({ key: ip || 'unknown' });
    if (!success) return answer('busy', 429);
  }
  let form;
  try { form = await request.formData(); } catch { return answer('invalid', 400); }
  const email = String(form.get('email') || '').trim().slice(0, 200);
  if (!EMAIL_RX.test(email)) return answer('invalid', 400);
  if (!env.BUTTONDOWN_API_KEY) return answer('error', 500);

  let res, data = {};
  try {
    res = await fetch('https://api.buttondown.com/v1/subscribers', {
      method: 'POST',
      headers: { Authorization: 'Token ' + env.BUTTONDOWN_API_KEY, 'Content-Type': 'application/json' },
      // No "type": Buttondown's default double opt-in sends the confirmation email
      body: JSON.stringify({ email_address: email, ip_address: ip || undefined }),
      signal: AbortSignal.timeout(8000)
    });
    data = await res.json().catch(() => ({}));
  } catch (e) {
    console.error('buttondown unreachable', e && e.message);
    return answer('error', 502);
  }
  if (res.ok) return answer('sent');
  const code = String(data.code || '');
  if (code === 'email_already_exists' || code === 'subscriber_already_exists') return answer('already');
  if (code === 'email_invalid' || code === 'email_empty') return answer('invalid', 400);
  if (/blocked|suppressed/.test(code)) return answer('blocked', 400);
  if (code === 'rate_limited' || res.status === 429) return answer('busy', 429);
  console.error('buttondown', res.status, code);
  return answer('error', 502);
}
