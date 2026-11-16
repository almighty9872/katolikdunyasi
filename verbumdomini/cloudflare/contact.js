/* verbumdomini.ca contact form: the form on contact.html posts to /api/contact, which worker.js
   hands to this. It checks the message (a hidden trap field, Cloudflare Turnstile, simple length
   rules) and emails it to the address set in Cloudflare, so no address ever appears on the site.

   Set in Cloudflare (Workers > verbumdomini > Settings > Variables and Secrets), never in this repo:
     Secret   TURNSTILE_SECRET  the Turnstile widget's secret key
     Secret   TO_ADDRESS        the verified Email Routing destination address that receives the mail
   Set in wrangler.jsonc:
     Binding  CONTACT_EMAIL     "Send email" binding
     Variable FROM_ADDRESS      an address at verbumdomini.ca (Email Routing on for the domain) */
import { EmailMessage } from 'cloudflare:email';

const SITE = 'https://verbumdomini.ca';
const ORIGINS = [SITE, 'https://www.verbumdomini.ca'];
const HOSTS = ['verbumdomini.ca', 'www.verbumdomini.ca'];
const MAX_BYTES = 16384;
const EMAIL_RX = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;

export async function contact(request, env) {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  const origin = request.headers.get('Origin');
  // A browser always sends Origin on a form post, so a request without one is not from the page
  if (!origin || !ORIGINS.includes(origin)) return new Response('Forbidden', { status: 403 });
  if (Number(request.headers.get('Content-Length') || 0) > MAX_BYTES) return new Response('Payload Too Large', { status: 413 });
  // At most a few posts a minute from one address (the CONTACT_LIMIT rate limit binding)
  if (env.CONTACT_LIMIT) {
    const { success } = await env.CONTACT_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
    if (!success) return new Response('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } });
  }

  const asJson = (request.headers.get('Accept') || '').includes('application/json');
  let form;
  try { form = await request.formData(); } catch { return answer(false, 'fields', asJson); }

  // A field people never see: anything in it means a bot, which is told "thank you" and ignored
  if (String(form.get('website') || '').trim()) return answer(true, '', asJson);

  const name = clean(form.get('name'), 100);
  const email = clean(form.get('email'), 200);
  const message = String(form.get('message') || '').replace(/\r\n?/g, '\n').trim().slice(0, 5000);
  if (!EMAIL_RX.test(email) || message.length < 5) return answer(false, 'fields', asJson);

  // Cloudflare Turnstile: the check that the sender is a person
  const check = new FormData();
  check.append('secret', env.TURNSTILE_SECRET || '');
  check.append('response', String(form.get('cf-turnstile-response') || ''));
  check.append('remoteip', request.headers.get('CF-Connecting-IP') || '');
  const verdict = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: check, signal: AbortSignal.timeout(5000) })
    .then(r => r.json()).catch(() => ({ success: false }));
  if (!verdict.success || !HOSTS.includes(verdict.hostname)) return answer(false, 'check', asJson);

  const subject = 'Verbum Domini: ' + (name || email);
  const body = ['Name: ' + (name || '-'), 'Email: ' + email, '', message, '', '-- ', 'verbumdomini.ca contact form'].join('\n');
  const raw = [
    'From: ' + mimeWord('Verbum Domini') + ' <' + env.FROM_ADDRESS + '>',
    'To: <' + env.TO_ADDRESS + '>',
    'Reply-To: <' + email + '>',
    'Subject: ' + mimeWord(subject),
    'Date: ' + new Date().toUTCString(),
    'Message-ID: <' + crypto.randomUUID() + '@verbumdomini.ca>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(body).replace(/.{1,76}/g, '$&\r\n')
  ].join('\r\n');

  try {
    await env.CONTACT_EMAIL.send(new EmailMessage(env.FROM_ADDRESS, env.TO_ADDRESS, raw));
  } catch (e) {
    console.error('send failed', e && e.message);
    return answer(false, 'send', asJson, 502);
  }
  return answer(true, '', asJson);
}

// The page's own script asks for JSON; a plain form post (no JavaScript) is sent back to the page
// (the contact page shows the message for ?sent=1 or ?error=<code>)
function answer(ok, code, asJson, status) {
  if (asJson) return new Response(JSON.stringify({ ok, error: code || undefined }), {
    status: status || (ok ? 200 : 400), headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
  return Response.redirect(SITE + '/contact.html' + (ok ? '?sent=1' : '?error=' + code) + '#x-mesaj', 303);
}
// One line of text, no line breaks (they could add mail headers), at most n characters
function clean(v, n) { return String(v || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n); }
function b64(s) {
  const bytes = new TextEncoder().encode(s); let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function mimeWord(s) { return '=?UTF-8?B?' + b64(s) + '?='; }
