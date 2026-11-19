/* parishes.verbumdomini.ca: the parish portal. Static pages come from _site_parishes/ (built by tools/parishes.py
   from parishes-src/); this script answers what matches no file:
     /, /resources, /directory, /claim, /admin   the portal's pages (clean addresses for <name>.html)
     /parish/<slug>                              a parish's profile (parish.html, which reads /api/parishes/<slug>)
     /download/<file>                            the handouts as attachments (downloads.js, shared with verbumdomini.ca)
     /api/...                                    the directory, the claim and sign-in steps, and the admin dashboard
   Data: the D1 database PARISH_DB (cloudflare/schema.sql, seeded by tools/seed-parishes.py).

   Staff prove they work for a parish with a 6-digit code sent to their email: an @archtoronto.org address or one at
   the parish's own website domain. The code is kept only as a keyed hash and expires after 15 minutes. After it,
   the browser holds a signed session cookie that names the staff member and the parish, and every admin query is
   limited to that parish. Staff whose parish has no website domain of its own (a generic address such as Gmail) still
   confirm their address with a code, but the claim then waits for a site administrator to approve or reject it.

   Set in Cloudflare, never in this repo:  Secret SESSION_SECRET     a long random string (signs sessions, keys the code hashes)
                                           Secret SUPERADMIN_EMAILS  site administrators' addresses, comma-separated. They sign in
   at /claim?login=1 like editors; on /admin they see every parish, the claims waiting for review and the recent activity
   across the portal, can open any parish's dashboard (claimed or not, with its full listing editable), approve or reject
   a claim, and release one; their sessions last 8 hours, and removing an address from the secret ends its session at once.
   Set in parishes.jsonc:  PARISH_DB (D1), CONTACT_EMAIL (send_email), CLAIM_LIMIT (rate limit), FROM_ADDRESS */
import { EmailMessage } from 'cloudflare:email';
import { DOWNLOADS, download } from './downloads.js';

const PAGES = { '/': '/index.html', '/resources': '/resources.html', '/directory': '/directory.html', '/claim': '/claim.html', '/admin': '/admin.html' };
const ROLES = ['Pastor', 'Associate Pastor', 'Parish Secretary', 'Office Administrator', 'Communications Coordinator'];
const EDITOR_ROLES = [...ROLES, 'Volunteer Editor'];
const KINDS = ['sunday', 'weekday', 'confession', 'adoration'];
const COOKIE = '__Host-pp_session';
const SESSION_SECONDS = 14 * 86400;
const SUPER_SECONDS = 8 * 3600;
const PIN_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 5;
const MAX_BODY = 32768;
const EMAIL_RX = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;
const TIME_RX = /^([01]\d|2[0-3]):[0-5]\d$/;
const SLUG_RX = /^[a-z0-9-]{1,120}$/;
const TICKET_RX = /^[A-Za-z0-9_-]{20,40}$/;
const AREAS = ['Toronto', 'Mississauga', 'Brampton', 'York Region', 'Durham Region', 'Peel/Caledon', 'Simcoe/Georgian'];

// Pages may be framed only by this site (the Resources page previews the widget); the widget itself by anyone
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; " +
  "frame-src 'self'; form-action 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'self'";
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Content-Security-Policy': CSP,
  'X-Frame-Options': 'SAMEORIGIN'
};
function secure(res, embed) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!out.headers.has(k)) out.headers.set(k, v);
  if (embed) {
    out.headers.delete('X-Frame-Options');
    out.headers.set('Content-Security-Policy', CSP.replace("frame-ancestors 'self'", 'frame-ancestors *'));
  }
  return out;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/{2,}/g, '/');
    if (path !== url.pathname) { const to = new URL(url.href); to.pathname = path; return secure(Response.redirect(to.href, 301)); }
    if (path.startsWith('/api/')) {
      let res;
      try { res = await api(request, env, ctx, url, path); }
      catch (e) { console.error('api', path, e && e.message); res = json({ ok: false, error: 'server' }, 500); }
      return secure(res);
    }
    if (path.startsWith('/download/') && Object.hasOwn(DOWNLOADS, path.slice(10))) return secure(await download(request, env, path.slice(10)));
    if (Object.hasOwn(PAGES, path)) return secure(await env.ASSETS.fetch(new Request(new URL(PAGES[path], url.origin), request)));
    if (/^\/parish\/[a-z0-9-]{1,120}\/?$/.test(path)) return secure(await env.ASSETS.fetch(new Request(new URL('/parish.html', url.origin), request)));
    if (path.endsWith('.html') && Object.hasOwn(PAGES, path.slice(0, -5))) { const to = new URL(url.href); to.pathname = path.slice(0, -5); return secure(Response.redirect(to.href, 301)); }
    if (path === '/embed' || path === '/embed/today') { const to = new URL(url.href); to.pathname = '/embed/today.html'; return secure(Response.redirect(to.href, 301)); }
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return secure(asset, path.startsWith('/embed/'));
    const nf = await env.ASSETS.fetch(new URL('/404.html', url.origin));
    return secure(new Response(nf.body, { status: 404, headers: nf.headers }));
  }
};

// ---------- API ----------
async function api(request, env, ctx, url, path) {
  const m = request.method;
  if (m !== 'GET' && m !== 'HEAD') {
    // Writes come only from this site's own pages, as JSON (a cross-site form cannot send either)
    if (request.headers.get('Origin') !== url.origin) return json({ ok: false, error: 'origin' }, 403);
    if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) return json({ ok: false, error: 'type' }, 415);
    if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY) return json({ ok: false, error: 'size' }, 413);
  }
  if (path === '/api/parishes' && m === 'GET') return cached(request, ctx, () => listParishes(env, url), 300);
  let r = path.match(/^\/api\/parishes\/([a-z0-9-]{1,120})$/);
  if (r && m === 'GET') return cached(request, ctx, () => oneParish(env, r[1]), 60);

  if (m === 'POST' && CODE_ROUTES.includes(path)) {
    const slow = await limited(request, env);
    if (slow) return slow;
    if (path === '/api/claim/request') return claimRequest(request, env);
    if (path === '/api/claim/verify') return verify(request, env, 'claim');
    if (path === '/api/auth/login') return loginRequest(request, env);
    return verify(request, env, 'login');
  }
  if (path === '/api/auth/logout' && m === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });

  if (path.startsWith('/api/admin/')) {
    const s = await session(request, env);
    if (!s) return json({ ok: false, error: 'auth' }, 401);
    if (path === '/api/admin/me' && m === 'GET') return adminMe(env, s);
    if (path.startsWith('/api/admin/super/')) {
      if (!s.su) return json({ ok: false, error: 'owner' }, 403);
      if (path === '/api/admin/super/open' && m === 'POST') return superOpen(request, env, s);
      if (path === '/api/admin/super/release' && m === 'POST') return superRelease(env, ctx, url, s);
      if (path === '/api/admin/super/audit' && m === 'GET') return superAudit(env, s);
      if (path === '/api/admin/super/overview' && m === 'GET') return superOverview(env);
      r = path.match(/^\/api\/admin\/super\/claims\/([A-Za-z0-9_-]{20,40})\/(approve|reject)$/);
      if (r && m === 'POST') return r[2] === 'approve' ? superApprove(env, ctx, url, s, r[1]) : superReject(request, env, s, r[1]);
      return json({ ok: false, error: 'not_found' }, 404);
    }
    // A site administrator works on one parish at a time, chosen with /api/admin/super/open
    if (!s.parish_id) return json({ ok: false, error: 'pick' }, 400);
    if (path === '/api/admin/profile' && m === 'PUT') return adminProfile(request, env, ctx, url, s);
    if (path === '/api/admin/schedules' && m === 'PUT') return adminSchedules(request, env, ctx, url, s);
    if (path === '/api/admin/announcements' && m === 'POST') return adminAnnounce(request, env, ctx, url, s);
    r = path.match(/^\/api\/admin\/announcements\/(\d{1,12})$/);
    if (r && m === 'DELETE') return adminUnannounce(env, ctx, url, s, Number(r[1]));
    if (path === '/api/admin/editors' && m === 'POST') return adminAddEditor(request, env, s);
    r = path.match(/^\/api\/admin\/editors\/(\d{1,12})$/);
    if (r && m === 'DELETE') return adminRemoveEditor(env, s, Number(r[1]));
  }
  return json({ ok: false, error: 'not_found' }, 404);
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}
async function body(request) { try { const b = await request.json(); return b && typeof b === 'object' && !Array.isArray(b) ? b : {}; } catch { return {}; } }
function str(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, n); }
function text(v, n) { return String(v == null ? '' : v).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ').trim().slice(0, n); }
function httpUrl(v) {
  const s = str(v, 500);
  if (!s) return '';
  try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null; } catch { return null; }
}
const now = () => Math.floor(Date.now() / 1000);

// Public answers are cached at the edge for a few minutes; admin edits purge the parish's entries in this data centre
async function cached(request, ctx, make, maxAge) {
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await make();
  if (res.status !== 200) return res;
  res.headers.set('Cache-Control', `public, max-age=${maxAge}`);
  ctx.waitUntil(cache.put(request, res.clone()));
  return res;
}
async function purge(ctx, url, slug) {
  const cache = caches.default;
  ctx.waitUntil(Promise.all([cache.delete(new Request(new URL('/api/parishes', url.origin))), cache.delete(new Request(new URL('/api/parishes/' + slug, url.origin)))]));
}
// The steps that send or check a code: a few a minute from one address (CLAIM_LIMIT)
const CODE_ROUTES = ['/api/claim/request', '/api/claim/verify', '/api/auth/login', '/api/auth/verify'];
async function limited(request, env) {
  if (!env.CLAIM_LIMIT) return null;
  const { success } = await env.CLAIM_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
  return success ? null : json({ ok: false, error: 'rate' }, 429, { 'Retry-After': '60' });
}

// GET /api/parishes[?q=&area=&day=0-6&from=HH:MM&to=HH:MM&confession=1&lang=&access=1]
// Every parish with its schedule in short form: t = [[kind, day, start, end, language, note], ...]
async function listParishes(env, url) {
  const [ps, ts] = await env.PARISH_DB.batch([
    env.PARISH_DB.prepare('SELECT id, slug, name, deanery, area, street, city, postal_code, lat, lng, phone, website_url, wheelchair_accessible, is_claimed, updated_at FROM parishes ORDER BY name'),
    env.PARISH_DB.prepare('SELECT parish_id, kind, day, start_time, end_time, language, note FROM mass_times ORDER BY parish_id, kind, sort, day, start_time')
  ]);
  const by = new Map();
  for (const t of ts.results) {
    if (!by.has(t.parish_id)) by.set(t.parish_id, []);
    by.get(t.parish_id).push([t.kind, t.day, t.start_time, t.end_time, t.language, t.note]);
  }
  const q = url.searchParams, needle = str(q.get('q'), 80).toLowerCase(), area = str(q.get('area'), 40), lang = str(q.get('lang'), 40).toLowerCase();
  const day = q.has('day') && /^[0-6]$/.test(q.get('day') || '') ? Number(q.get('day')) : null;
  const from = TIME_RX.test(q.get('from') || '') ? q.get('from') : '', to = TIME_RX.test(q.get('to') || '') ? q.get('to') : '';
  const conf = q.get('confession') === '1', access = q.get('access') === '1';
  const out = [];
  for (const p of ps.results) {
    const t = by.get(p.id) || [];
    if (needle && !(p.name + ' ' + p.city + ' ' + p.deanery).toLowerCase().includes(needle)) continue;
    if (area && p.area !== area) continue;
    if (conf && !t.some(x => x[0] === 'confession')) continue;
    if (access && p.wheelchair_accessible !== 1) continue;
    if (day !== null || from || to || lang) {
      if (!t.some(x => (x[0] === 'sunday' || x[0] === 'weekday') && (day === null || x[1] === day) && (!from || x[2] >= from) && (!to || x[2] <= to) && (!lang || String(x[4]).toLowerCase() === lang))) continue;
    }
    out.push({ slug: p.slug, name: p.name, deanery: p.deanery, area: p.area, street: p.street, city: p.city, postal_code: p.postal_code,
      lat: p.lat, lng: p.lng, phone: p.phone, website_url: p.website_url, access: p.wheelchair_accessible, claimed: !!p.is_claimed, updated_at: p.updated_at, t });
  }
  return json({ ok: true, count: out.length, parishes: out });
}

// GET /api/parishes/<slug>: the whole record, its times and the notices showing now
async function oneParish(env, slug) {
  const p = await env.PARISH_DB.prepare('SELECT * FROM parishes WHERE slug = ?').bind(slug).first();
  if (!p) return json({ ok: false, error: 'not_found' }, 404);
  const t = now();
  const [times, notes] = await env.PARISH_DB.batch([
    env.PARISH_DB.prepare('SELECT id, kind, day, start_time, end_time, language, note FROM mass_times WHERE parish_id = ? ORDER BY kind, sort, day, start_time').bind(p.id),
    env.PARISH_DB.prepare('SELECT id, title, body, starts_at, expires_at FROM parish_announcements WHERE parish_id = ? AND starts_at <= ? AND (expires_at IS NULL OR expires_at > ?) ORDER BY starts_at DESC LIMIT 20').bind(p.id, t, t)
  ]);
  return json({ ok: true, parish: publicParish(p), mass_times: times.results, announcements: notes.results });
}
function publicParish(p) {
  return { slug: p.slug, name: p.name, deanery: p.deanery, region: p.region, area: p.area, street: p.street, city: p.city, postal_code: p.postal_code,
    lat: p.lat, lng: p.lng, phone: p.phone, email: p.email, website_url: p.website_url, bulletin_url: p.bulletin_url, livestream_url: p.livestream_url,
    holiday_note: p.holiday_note || '', wheelchair_accessible: p.wheelchair_accessible == null ? null : p.wheelchair_accessible, claimed: !!p.is_claimed, updated_at: p.updated_at };
}

// ---------- codes and sessions ----------
const enc = new TextEncoder();
function b64u(bytes) { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(s) { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); }
async function hmac(env, msg) {
  if (!env.SESSION_SECRET || String(env.SESSION_SECRET).length < 32) throw new Error('SESSION_SECRET is not set');
  const key = await crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
function same(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
function newPin() { const a = new Uint32Array(1); do crypto.getRandomValues(a); while (a[0] >= 4294000000); return String(a[0] % 1000000).padStart(6, '0'); }
function newTicket() { return b64u(crypto.getRandomValues(new Uint8Array(18))); }
const pinHash = async (env, ticket, pin) => b64u(await hmac(env, 'pin:' + ticket + ':' + pin));

async function session(request, env) {
  const c = (request.headers.get('Cookie') || '').split(/;\s*/).find(x => x.startsWith(COOKIE + '='));
  if (!c) return null;
  const [data, sig] = c.slice(COOKIE.length + 1).split('.');
  if (!data || !sig || !same(sig, b64u(await hmac(env, 'session:' + data)))) return null;
  let s; try { s = JSON.parse(new TextDecoder().decode(unb64u(data))); } catch { return null; }
  if (!s || !(s.x > now())) return null;
  if (s.su) {
    // A site administrator: still listed in SUPERADMIN_EMAILS, and on the parish they opened (if any)
    if (!isSuper(env, s.su)) return null;
    const base = { id: 0, su: true, email: s.su, name: 'Site administrator', role: 'Site administrator', is_owner: 1, parish_id: 0, slug: '' };
    if (!s.p) return base;
    const p = await env.PARISH_DB.prepare('SELECT id, slug FROM parishes WHERE id = ?').bind(Number(s.p)).first();
    return p ? { ...base, parish_id: p.id, slug: p.slug } : base;
  }
  // The staff member must still be listed for the parish: a removed editor's cookie stops working at once
  const a = await env.PARISH_DB.prepare('SELECT a.id, a.parish_id, a.email, a.name, a.role, a.is_owner, p.slug FROM parish_admins a JOIN parishes p ON p.id = a.parish_id WHERE a.id = ? AND a.parish_id = ?')
    .bind(Number(s.a), Number(s.p)).first();
  return a || null;
}
async function sessionCookie(env, adminId, parishId) {
  return cookie(env, { a: adminId, p: parishId, x: now() + SESSION_SECONDS }, SESSION_SECONDS);
}
async function superCookie(env, email, parishId) {
  return cookie(env, { su: email, p: parishId, x: now() + SUPER_SECONDS }, SUPER_SECONDS);
}
async function cookie(env, payload, maxAge) {
  const data = b64u(enc.encode(JSON.stringify(payload)));
  return `${COOKIE}=${data}.${b64u(await hmac(env, 'session:' + data))}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}
function isSuper(env, email) {
  return !!email && String(env.SUPERADMIN_EMAILS || '').toLowerCase().split(/[\s,;]+/).filter(Boolean).includes(String(email).toLowerCase());
}
function audit(env, parishId, adminId, action, detail, email) {
  return env.PARISH_DB.prepare('INSERT INTO parish_audit_log (parish_id, admin_id, actor_email, action, detail) VALUES (?, ?, ?, ?, ?)').bind(parishId, adminId, str(email, 200), action, str(detail, 500));
}
// A dashboard change, logged under the editor, or marked as the site administrator's
function auditAs(env, s, action, detail) {
  return audit(env, s.parish_id, s.su ? null : s.id, action, (s.su ? '[site admin] ' : '') + detail, s.email);
}

// The email domain test for a claim: the archdiocese's own domain, or exactly the host of the parish's website
function hostOf(u) { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; } }
function emailAllowed(env, email, parish) {
  const domain = email.split('@')[1] || '';
  return domain === 'archtoronto.org' || (!!hostOf(parish.website_url) && domain === hostOf(parish.website_url)) || isSuper(env, email);
}
async function recentCodes(env, email) {
  const r = await env.PARISH_DB.prepare('SELECT COUNT(*) AS n FROM parish_claims WHERE email = ? AND created_at > ?').bind(email, now() - 900).first();
  return Number(r && r.n) || 0;
}

// POST /api/claim/request {slug, name, role, email, manual?, message?}
// manual: the address is not at an official domain. The code still proves the address; a site administrator then decides.
async function claimRequest(request, env) {
  const b = await body(request);
  if (str(b.website, 200)) return json({ ok: true, ticket: newTicket() });  // a field people never see: a bot filled it
  const slug = str(b.slug, 120), name = str(b.name, 100), role = str(b.role, 60), email = str(b.email, 200).toLowerCase();
  if (!SLUG_RX.test(slug) || name.length < 2 || !ROLES.includes(role) || !EMAIL_RX.test(email)) return json({ ok: false, error: 'fields' }, 400);
  const p = await env.PARISH_DB.prepare('SELECT id, name, website_url, is_claimed FROM parishes WHERE slug = ?').bind(slug).first();
  if (!p) return json({ ok: false, error: 'parish' }, 404);
  if (p.is_claimed) return json({ ok: false, error: 'claimed' }, 409);
  const official = emailAllowed(env, email, p), manual = !official && b.manual === true, message = text(b.message, 1000);
  if (!official && !manual) return json({ ok: false, error: 'domain', allowed: ['archtoronto.org', hostOf(p.website_url)].filter(Boolean), manual: true }, 400);
  if (manual && message.length < 10) return json({ ok: false, error: 'fields' }, 400);
  if (await recentCodes(env, email) >= 3) return json({ ok: false, error: 'rate' }, 429);
  const ticket = newTicket(), pin = newPin();
  await env.PARISH_DB.prepare('INSERT INTO parish_claims (id, kind, parish_id, name, role, email, pin_hash, expires_at, manual, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(ticket, 'claim', p.id, name, role, email, await pinHash(env, ticket, pin), now() + PIN_SECONDS, manual ? 1 : 0, message).run();
  if (!await mail(env, email, 'Your code to claim ' + p.name, [
    `Your code to claim ${p.name} on Verbum Domini for Parishes is:`, '', '    ' + pin, '',
    'It works for 15 minutes.' + (manual ? ' After you enter it, your request goes to the site administrator for review.' : '') +
    ' If you did not ask for it, ignore this email: nothing changes without the code.'])) {
    await env.PARISH_DB.prepare('DELETE FROM parish_claims WHERE id = ?').bind(ticket).run();
    return json({ ok: false, error: 'send' }, 502);
  }
  return json({ ok: true, ticket, manual });
}

// POST /api/auth/login {email, slug?}: the same answer whether or not the address belongs to an editor
async function loginRequest(request, env) {
  const b = await body(request);
  const email = str(b.email, 200).toLowerCase(), slug = str(b.slug, 120);
  if (!EMAIL_RX.test(email)) return json({ ok: false, error: 'fields' }, 400);
  const ticket = newTicket();
  if (await recentCodes(env, email) >= 3) return json({ ok: true, ticket });
  if (isSuper(env, email)) {
    const pin = newPin();
    await env.PARISH_DB.prepare('INSERT INTO parish_claims (id, kind, email, pin_hash, expires_at) VALUES (?, ?, ?, ?, ?)')
      .bind(ticket, 'login', email, await pinHash(env, ticket, pin), now() + PIN_SECONDS).run();
    await mail(env, email, 'Your site administrator sign-in code', [
      'Your code to sign in as site administrator of Verbum Domini for Parishes is:', '', '    ' + pin, '',
      'It works for 15 minutes. If you did not ask for it, ignore this email.']);
    return json({ ok: true, ticket });
  }
  const a = await env.PARISH_DB.prepare('SELECT a.id, a.parish_id, p.name FROM parish_admins a JOIN parishes p ON p.id = a.parish_id WHERE a.email = ?' +
    (SLUG_RX.test(slug) ? ' AND p.slug = ?' : '') + ' ORDER BY a.last_login_at DESC LIMIT 1').bind(...(SLUG_RX.test(slug) ? [email, slug] : [email])).first();
  if (!a) return json({ ok: true, ticket });
  const pin = newPin();
  await env.PARISH_DB.prepare('INSERT INTO parish_claims (id, kind, parish_id, admin_id, email, pin_hash, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(ticket, 'login', a.parish_id, a.id, email, await pinHash(env, ticket, pin), now() + PIN_SECONDS).run();
  await mail(env, email, 'Your sign-in code for ' + a.name, [
    `Your code to sign in to ${a.name} on Verbum Domini for Parishes is:`, '', '    ' + pin, '',
    'It works for 15 minutes. If you did not ask for it, ignore this email.']);
  return json({ ok: true, ticket });
}

// POST /api/claim/verify and /api/auth/verify {ticket, pin}
async function verify(request, env, kind) {
  const b = await body(request);
  const ticket = str(b.ticket, 64), pin = str(b.pin, 12).replace(/\s/g, '');
  if (!TICKET_RX.test(ticket) || !/^\d{6}$/.test(pin)) return json({ ok: false, error: 'pin' }, 400);
  // Count the try before checking it, so parallel guesses cannot get past the limit
  const c = await env.PARISH_DB.prepare('UPDATE parish_claims SET attempts = attempts + 1 WHERE id = ? AND kind = ? AND used_at IS NULL AND expires_at > ? AND attempts < ? RETURNING *')
    .bind(ticket, kind, now(), MAX_ATTEMPTS).first();
  if (!c) return json({ ok: false, error: 'expired' }, 400);
  if (!same(c.pin_hash, await pinHash(env, ticket, pin))) return json({ ok: false, error: 'pin', left: MAX_ATTEMPTS - c.attempts }, 400);
  const used = await env.PARISH_DB.prepare('UPDATE parish_claims SET used_at = ? WHERE id = ? AND used_at IS NULL').bind(now(), ticket).run();
  if (!used.meta.changes) return json({ ok: false, error: 'expired' }, 400);
  let adminId = c.admin_id;
  if (kind === 'claim' && c.manual) {
    // The address is confirmed, but not an official one: it waits for a site administrator
    const p = await env.PARISH_DB.prepare('SELECT name, is_claimed FROM parishes WHERE id = ?').bind(c.parish_id).first();
    if (!p || p.is_claimed) return json({ ok: false, error: 'claimed' }, 409);
    await env.PARISH_DB.batch([
      env.PARISH_DB.prepare("UPDATE parish_claims SET status = 'pending', verified_at = ? WHERE id = ?").bind(now(), ticket),
      audit(env, c.parish_id, null, 'claim.pending', `${c.name} (${c.role})`, c.email)
    ]);
    const supers = String(env.SUPERADMIN_EMAILS || '').split(/[\s,;]+/).filter(x => EMAIL_RX.test(x));
    await Promise.all(supers.map(to => mail(env, to, 'Claim to review: ' + p.name, [
      `${c.name} (${c.role}, ${c.email}) asks to manage ${p.name}. Their note:`, '', c.message, '',
      'Approve or reject it at https://parishes.verbumdomini.ca/admin'])));
    return json({ ok: true, pending: true });
  }
  if (kind === 'claim') {
    const won = await env.PARISH_DB.prepare('UPDATE parishes SET is_claimed = 1, claimed_at = ?, updated_at = ? WHERE id = ? AND is_claimed = 0').bind(now(), now(), c.parish_id).run();
    if (!won.meta.changes) return json({ ok: false, error: 'claimed' }, 409);
    const a = await env.PARISH_DB.prepare('INSERT INTO parish_admins (parish_id, email, name, role, is_owner, last_login_at) VALUES (?, ?, ?, ?, 1, ?) ' +
      'ON CONFLICT (parish_id, email) DO UPDATE SET name = excluded.name, role = excluded.role, is_owner = 1, last_login_at = excluded.last_login_at RETURNING id')
      .bind(c.parish_id, c.email, c.name, c.role, now()).first();
    adminId = a.id;
    await env.PARISH_DB.batch([
      env.PARISH_DB.prepare("UPDATE parish_claims SET status = 'approved', verified_at = ? WHERE id = ?").bind(now(), ticket),
      audit(env, c.parish_id, adminId, 'claim', `${c.name} (${c.role})`, c.email)
    ]);
  } else if (!c.admin_id) {
    // A site administrator's code (no parish): still listed, then a short session with no parish open
    if (!isSuper(env, c.email)) return json({ ok: false, error: 'expired' }, 400);
    return json({ ok: true, redirect: '/admin' }, 200, { 'Set-Cookie': await superCookie(env, c.email, 0) });
  } else {
    const a = await env.PARISH_DB.prepare('UPDATE parish_admins SET last_login_at = ? WHERE id = ? AND parish_id = ? RETURNING id').bind(now(), c.admin_id, c.parish_id).first();
    if (!a) return json({ ok: false, error: 'expired' }, 400);
    await audit(env, c.parish_id, adminId, 'login', '', c.email).run();
  }
  return json({ ok: true, redirect: '/admin' }, 200, { 'Set-Cookie': await sessionCookie(env, adminId, c.parish_id) });
}

// ---------- the dashboard (every query is limited to the session's parish_id) ----------
async function adminMe(env, s) {
  if (!s.parish_id) return json({ ok: true, super: true, me: { id: 0, name: s.name, email: s.email, role: s.role, owner: true }, parish: null });
  const [p, times, notes, eds] = await env.PARISH_DB.batch([
    env.PARISH_DB.prepare('SELECT * FROM parishes WHERE id = ?').bind(s.parish_id),
    env.PARISH_DB.prepare('SELECT kind, day, start_time, end_time, language, note FROM mass_times WHERE parish_id = ? ORDER BY kind, sort, day, start_time').bind(s.parish_id),
    env.PARISH_DB.prepare('SELECT id, title, body, starts_at, expires_at, created_at FROM parish_announcements WHERE parish_id = ? AND (expires_at IS NULL OR expires_at > ?) ORDER BY starts_at DESC LIMIT 100').bind(s.parish_id, now() - 30 * 86400),
    env.PARISH_DB.prepare('SELECT id, email, name, role, is_owner, created_at, last_login_at FROM parish_admins WHERE parish_id = ? ORDER BY is_owner DESC, created_at').bind(s.parish_id)
  ]);
  return json({ ok: true, me: { id: s.id, name: s.name, email: s.email, role: s.role, owner: !!s.is_owner },
    parish: publicParish(p.results[0]), mass_times: times.results, announcements: notes.results, editors: eds.results, roles: EDITOR_ROLES, super: !!s.su });
}

// PUT /api/admin/profile: links, contact, holiday note and access for every editor; a site administrator also edits the
// listing itself (name, address, website, area, map point). The website decides which email domain may claim the parish,
// so parish staff cannot change it.
async function adminProfile(request, env, ctx, url, s) {
  const b = await body(request);
  const bulletin = httpUrl(b.bulletin_url), live = httpUrl(b.livestream_url), phone = str(b.phone, 40), email = str(b.email, 200).toLowerCase();
  const note = text(b.holiday_note, 1000), wa = b.wheelchair_accessible === true ? 1 : b.wheelchair_accessible === false ? 0 : null;
  if (bulletin === null || live === null || (email && !EMAIL_RX.test(email)) || (phone && !/^[0-9+().\s-]{7,40}$/.test(phone))) return json({ ok: false, error: 'fields' }, 400);
  const db = env.PARISH_DB, q = [
    db.prepare('UPDATE parishes SET bulletin_url = ?, livestream_url = ?, phone = ?, email = ?, holiday_note = ?, wheelchair_accessible = ?, updated_at = ? WHERE id = ?')
      .bind(bulletin, live, phone, email, note, wa, now(), s.parish_id)
  ];
  if (s.su && b.listing && typeof b.listing === 'object') {
    const L = b.listing, name = str(L.name, 140), street = str(L.street, 160), city = str(L.city, 80), deanery = str(L.deanery, 80), area = str(L.area, 40);
    const postal = str(L.postal_code, 7).toUpperCase().replace(/^([A-Z]\d[A-Z])\s*(\d[A-Z]\d)$/, '$1 $2'), web = httpUrl(L.website_url);
    const lat = L.lat === '' || L.lat == null ? null : Number(L.lat), lng = L.lng === '' || L.lng == null ? null : Number(L.lng);
    if (name.length < 3 || !city || web === null || (area && !AREAS.includes(area)) || (postal && !/^[A-Z]\d[A-Z] \d[A-Z]\d$/.test(postal)) ||
      (lat === null) !== (lng === null) || (lat !== null && !(lat > 41 && lat < 57 && lng > -96 && lng < -74))) return json({ ok: false, error: 'fields' }, 400);
    q.push(db.prepare('UPDATE parishes SET name = ?, street = ?, city = ?, postal_code = ?, deanery = ?, area = ?, website_url = ?, lat = ?, lng = ? WHERE id = ?')
      .bind(name, street, city, postal, deanery, area, web, lat, lng, s.parish_id));
  }
  q.push(auditAs(env, s, 'profile', s.su && b.listing ? 'listing, contact and links' : 'contact and links'));
  await db.batch(q);
  await purge(ctx, url, s.slug);
  return json({ ok: true });
}

async function adminSchedules(request, env, ctx, url, s) {
  const b = await body(request);
  if (!Array.isArray(b.items) || b.items.length > 200) return json({ ok: false, error: 'fields' }, 400);
  const rows = [];
  for (const it of b.items) {
    const kind = str(it && it.kind, 20), day = Number(it && it.day), start = str(it && it.start_time, 5), end = str(it && it.end_time, 5);
    if (!KINDS.includes(kind) || !Number.isInteger(day) || day < 0 || day > 6 || !TIME_RX.test(start) || (end && (!TIME_RX.test(end) || end <= start))) return json({ ok: false, error: 'fields', item: rows.length }, 400);
    rows.push([kind, day, start, end, str(it.language, 40) || 'English', str(it.note, 160)]);
  }
  const db = env.PARISH_DB;
  // One transaction: the old schedule goes and the new one comes in, in the order the dashboard shows it
  await db.batch([
    db.prepare('DELETE FROM mass_times WHERE parish_id = ?').bind(s.parish_id),
    ...rows.map((r, i) => db.prepare('INSERT INTO mass_times (parish_id, kind, day, start_time, end_time, language, note, sort, seeded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)').bind(s.parish_id, ...r, i)),
    db.prepare('UPDATE parishes SET updated_at = ? WHERE id = ?').bind(now(), s.parish_id),
    auditAs(env, s, 'schedules', rows.length + ' times')
  ]);
  await purge(ctx, url, s.slug);
  return json({ ok: true, count: rows.length });
}

async function adminAnnounce(request, env, ctx, url, s) {
  const b = await body(request);
  const title = str(b.title, 140), text1 = text(b.body, 2000);
  const starts = b.starts_at ? Number(b.starts_at) : now(), expires = b.expires_at ? Number(b.expires_at) : null;
  if (title.length < 3 || !Number.isInteger(starts) || (expires !== null && (!Number.isInteger(expires) || expires <= starts))) return json({ ok: false, error: 'fields' }, 400);
  const n = await env.PARISH_DB.prepare('SELECT COUNT(*) AS n FROM parish_announcements WHERE parish_id = ? AND (expires_at IS NULL OR expires_at > ?)').bind(s.parish_id, now()).first();
  if (Number(n && n.n) >= 50) return json({ ok: false, error: 'limit' }, 400);
  const [ins] = await env.PARISH_DB.batch([
    env.PARISH_DB.prepare('INSERT INTO parish_announcements (parish_id, title, body, starts_at, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?) RETURNING id').bind(s.parish_id, title, text1, starts, expires, s.su ? null : s.id),
    env.PARISH_DB.prepare('UPDATE parishes SET updated_at = ? WHERE id = ?').bind(now(), s.parish_id),
    auditAs(env, s, 'announcement.add', title)
  ]);
  await purge(ctx, url, s.slug);
  return json({ ok: true, id: ins.results[0].id });
}

async function adminUnannounce(env, ctx, url, s, id) {
  const r = await env.PARISH_DB.prepare('DELETE FROM parish_announcements WHERE id = ? AND parish_id = ?').bind(id, s.parish_id).run();
  if (!r.meta.changes) return json({ ok: false, error: 'not_found' }, 404);
  await auditAs(env, s, 'announcement.remove', String(id)).run();
  await purge(ctx, url, s.slug);
  return json({ ok: true });
}

async function adminAddEditor(request, env, s) {
  if (!s.is_owner) return json({ ok: false, error: 'owner' }, 403);
  const b = await body(request);
  const name = str(b.name, 100), email = str(b.email, 200).toLowerCase(), role = str(b.role, 60);
  if (name.length < 2 || !EMAIL_RX.test(email) || !EDITOR_ROLES.includes(role)) return json({ ok: false, error: 'fields' }, 400);
  const n = await env.PARISH_DB.prepare('SELECT COUNT(*) AS n FROM parish_admins WHERE parish_id = ?').bind(s.parish_id).first();
  if (Number(n && n.n) >= 12) return json({ ok: false, error: 'limit' }, 400);
  const a = await env.PARISH_DB.prepare('INSERT INTO parish_admins (parish_id, email, name, role, invited_by) VALUES (?, ?, ?, ?, ?) ON CONFLICT (parish_id, email) DO NOTHING RETURNING id')
    .bind(s.parish_id, email, name, role, s.su ? null : s.id).first();
  if (!a) return json({ ok: false, error: 'exists' }, 409);
  await auditAs(env, s, 'editor.add', `${name} (${role}) <${email}>`).run();
  const p = await env.PARISH_DB.prepare('SELECT name, slug FROM parishes WHERE id = ?').bind(s.parish_id).first();
  const sent = await mail(env, email, 'You can now edit ' + p.name + ' on Verbum Domini for Parishes', [
    `${s.name} added you as an editor of ${p.name} on Verbum Domini for Parishes.`, '',
    'To sign in, open https://parishes.verbumdomini.ca/claim?login=1&slug=' + p.slug + ' and enter this email address. A code will be sent to you each time.']);
  return json({ ok: true, id: a.id, invited: sent });
}

async function adminRemoveEditor(env, s, id) {
  if (!s.is_owner) return json({ ok: false, error: 'owner' }, 403);
  if (id === s.id) return json({ ok: false, error: 'self' }, 400);
  const r = await env.PARISH_DB.prepare('DELETE FROM parish_admins WHERE id = ? AND parish_id = ? AND (is_owner = 0 OR ?) RETURNING email').bind(id, s.parish_id, s.su ? 1 : 0).first();
  if (!r) return json({ ok: false, error: 'not_found' }, 404);
  await auditAs(env, s, 'editor.remove', r.email).run();
  return json({ ok: true });
}

// ---------- site administrators (SUPERADMIN_EMAILS) ----------
// POST /api/admin/super/open {slug}: work on that parish (an empty slug closes it)
async function superOpen(request, env, s) {
  const slug = str((await body(request)).slug, 120);
  if (!slug) return json({ ok: true }, 200, { 'Set-Cookie': await superCookie(env, s.email, 0) });
  if (!SLUG_RX.test(slug)) return json({ ok: false, error: 'fields' }, 400);
  const p = await env.PARISH_DB.prepare('SELECT id FROM parishes WHERE slug = ?').bind(slug).first();
  if (!p) return json({ ok: false, error: 'parish' }, 404);
  await audit(env, p.id, null, 'site-admin.open', '', s.email).run();
  return json({ ok: true }, 200, { 'Set-Cookie': await superCookie(env, s.email, p.id) });
}
// POST /api/admin/super/release: the open parish becomes unclaimed again; its editors and pending codes are removed.
// Its schedule, links and notices stay, so a new claim starts from them.
async function superRelease(env, ctx, url, s) {
  if (!s.parish_id) return json({ ok: false, error: 'pick' }, 400);
  await env.PARISH_DB.batch([
    env.PARISH_DB.prepare('DELETE FROM parish_admins WHERE parish_id = ?').bind(s.parish_id),
    env.PARISH_DB.prepare('DELETE FROM parish_claims WHERE parish_id = ?').bind(s.parish_id),
    env.PARISH_DB.prepare('UPDATE parishes SET is_claimed = 0, claimed_at = NULL, updated_at = ? WHERE id = ?').bind(now(), s.parish_id),
    auditAs(env, s, 'site-admin.release', 'claim released, editors removed')
  ]);
  await purge(ctx, url, s.slug);
  return json({ ok: true });
}
// GET /api/admin/super/audit: the open parish's last 200 log entries
async function superAudit(env, s) {
  if (!s.parish_id) return json({ ok: false, error: 'pick' }, 400);
  const r = await env.PARISH_DB.prepare("SELECT l.created_at, l.action, l.detail, a.name, COALESCE(NULLIF(l.actor_email, ''), a.email) AS email FROM parish_audit_log l LEFT JOIN parish_admins a ON a.id = l.admin_id WHERE l.parish_id = ? ORDER BY l.id DESC LIMIT 200")
    .bind(s.parish_id).all();
  return json({ ok: true, log: r.results });
}

// GET /api/admin/super/overview: every parish with its editor count, the claims waiting for review, the portal's last 150 changes
async function superOverview(env) {
  const db = env.PARISH_DB;
  const [ps, cl, log] = await db.batch([
    db.prepare('SELECT p.slug, p.name, p.city, p.area, p.is_claimed, p.updated_at, (SELECT COUNT(*) FROM parish_admins a WHERE a.parish_id = p.id) AS editors FROM parishes p ORDER BY p.name'),
    db.prepare("SELECT c.id, c.name, c.role, c.email, c.message, c.verified_at, p.slug, p.name AS parish, p.website_url, p.is_claimed FROM parish_claims c JOIN parishes p ON p.id = c.parish_id " +
      "WHERE c.kind = 'claim' AND c.status = 'pending' ORDER BY c.verified_at"),
    db.prepare('SELECT l.created_at, l.action, l.detail, l.actor_email, p.slug, p.name AS parish FROM parish_audit_log l JOIN parishes p ON p.id = l.parish_id ORDER BY l.id DESC LIMIT 150')
  ]);
  return json({ ok: true, parishes: ps.results, claims: cl.results, log: log.results });
}
// POST /api/admin/super/claims/<id>/approve: the requester becomes the parish's primary administrator and is told by email
async function superApprove(env, ctx, url, s, id) {
  const db = env.PARISH_DB;
  const c = await db.prepare("SELECT c.*, p.slug, p.name AS parish FROM parish_claims c JOIN parishes p ON p.id = c.parish_id WHERE c.id = ? AND c.kind = 'claim' AND c.status = 'pending'").bind(id).first();
  if (!c) return json({ ok: false, error: 'not_found' }, 404);
  const won = await db.prepare('UPDATE parishes SET is_claimed = 1, claimed_at = ?, updated_at = ? WHERE id = ? AND is_claimed = 0').bind(now(), now(), c.parish_id).run();
  if (!won.meta.changes) return json({ ok: false, error: 'claimed' }, 409);
  await db.batch([
    db.prepare("UPDATE parish_claims SET status = 'approved' WHERE id = ?").bind(id),
    db.prepare("UPDATE parish_claims SET status = 'rejected' WHERE parish_id = ? AND kind = 'claim' AND status = 'pending' AND id <> ?").bind(c.parish_id, id),
    db.prepare('INSERT INTO parish_admins (parish_id, email, name, role, is_owner) VALUES (?, ?, ?, ?, 1) ON CONFLICT (parish_id, email) DO UPDATE SET is_owner = 1').bind(c.parish_id, c.email, c.name, c.role),
    audit(env, c.parish_id, null, 'claim.approve', `[site admin] ${c.name} (${c.role}) <${c.email}>`, s.email)
  ]);
  await purge(ctx, url, c.slug);
  const sent = await mail(env, c.email, 'Your claim of ' + c.parish + ' is approved', [
    `Your request to manage ${c.parish} on Verbum Domini for Parishes has been approved.`, '',
    'Sign in at https://parishes.verbumdomini.ca/claim?login=1&slug=' + c.slug + ' with this email address. A code will be sent to you each time.']);
  return json({ ok: true, notified: sent });
}
// POST /api/admin/super/claims/<id>/reject {reason?}
async function superReject(request, env, s, id) {
  const reason = text((await body(request)).reason, 500);
  const c = await env.PARISH_DB.prepare("UPDATE parish_claims SET status = 'rejected' WHERE id = ? AND kind = 'claim' AND status = 'pending' RETURNING parish_id, name, email").bind(id).first();
  if (!c) return json({ ok: false, error: 'not_found' }, 404);
  await audit(env, c.parish_id, null, 'claim.reject', `[site admin] ${c.name} <${c.email}>` + (reason ? ': ' + reason : ''), s.email).run();
  const p = await env.PARISH_DB.prepare('SELECT name FROM parishes WHERE id = ?').bind(c.parish_id).first();
  await mail(env, c.email, 'Your claim of ' + (p ? p.name : 'a parish') + ' was not approved', [
    `Your request to manage ${p ? p.name : 'the parish'} on Verbum Domini for Parishes was not approved.` + (reason ? ' Reason: ' + reason : ''), '',
    'If you work for the parish, ask your pastor or the parish office to claim it with an @archtoronto.org address, or reply to the parish office email listed in the directory.']);
  return json({ ok: true });
}

// ---------- email (Cloudflare send_email binding, plain text) ----------
function b64(s) { const bytes = enc.encode(s); let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]); return btoa(bin); }
function mimeWord(s) { return '=?UTF-8?B?' + b64(s) + '?='; }
async function mail(env, to, subject, lines) {
  const raw = [
    'From: ' + mimeWord('Verbum Domini for Parishes') + ' <' + env.FROM_ADDRESS + '>',
    'To: <' + to + '>',
    'Subject: ' + mimeWord(subject),
    'Date: ' + new Date().toUTCString(),
    'Message-ID: <' + crypto.randomUUID() + '@verbumdomini.ca>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(lines.concat(['', '-- ', 'Verbum Domini for Parishes · https://parishes.verbumdomini.ca']).join('\n')).replace(/.{1,76}/g, '$&\r\n')
  ].join('\r\n');
  try { await env.CONTACT_EMAIL.send(new EmailMessage(env.FROM_ADDRESS, to, raw)); return true; }
  catch (e) { console.error('send failed', e && e.message); return false; }
}
