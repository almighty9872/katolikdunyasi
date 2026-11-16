/* verbumdomini.ca: Cloudflare serves the files in _site_en/ directly. This runs only for requests
   that match no file: "/" and folder paths get their index.html, and an address without ".html"
   (as GitHub Pages also accepted) is sent to the .html page. Anything else gets 404.html.
   The 404 page is sent from here, not by Cloudflare's not_found_handling, because with that
   setting a browser's page request that matches no file never reaches this script.
   /api/contact (the contact form) is handled in contact.js. */
import { contact } from './contact.js';

// Sent with every response this script makes; the files Cloudflare serves directly get the same
// headers from _headers (written by verbumdomini/tools/build-app.py). Pages may be framed by this site only:
// the Rosary page shows rosary/pray-the-rosary.html in a frame.
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)',
  'Cross-Origin-Opener-Policy': 'same-origin'
};
function secure(res) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!out.headers.has(k)) out.headers.set(k, v);
  return out;
}
// A redirect that can only stay on this site: this request's own address with a new path
function redirectTo(url, pathname) {
  const to = new URL(url.href);
  to.pathname = pathname;
  return Response.redirect(to.href, 301);
}

// Older names the app still opens (GONE in app/index.html) have no file of their own: their addresses redirect
const MOVED = { '/read-the-bible.html': '/holy-bible.html', '/who-is-jesus.html': '/', '/start.html': '/' };

// /download/<file>: the same file as /files/<file>, sent as an attachment, so iOS Safari and desktop browsers
// save it instead of opening it in the viewer. Only the files listed here, each with the name it is saved under.
const DOWNLOADS = {
  'order-of-the-mass.pdf': 'Order of the Mass.pdf',
  'the-confessions-of-st-augustine.pdf': 'The Confessions of St. Augustine.pdf',
  'the-confessions-of-st-augustine.epub': 'The Confessions of St. Augustine.epub',
  'the-confessions-of-st-augustine.azw3': 'The Confessions of St. Augustine.azw3',
  'the-confessions-of-st-augustine.txt': 'The Confessions of St. Augustine.txt'
};
async function download(request, env, file) {
  const res = await env.ASSETS.fetch(new Request(new URL('/files/' + file, request.url), request));
  if (!res.ok) return res;
  const out = new Response(res.body, res);
  out.headers.set('Content-Disposition', `attachment; filename="${DOWNLOADS[file]}"; filename*=UTF-8''${encodeURIComponent(DOWNLOADS[file])}`);
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return secure(await contact(request, env));
    // "//host/page" (and "/\host/page", which URL parsing turns into it) would read as another
    // host: repeated slashes become one first
    const path = url.pathname.replace(/\/{2,}/g, '/');
    if (path !== url.pathname) return secure(redirectTo(url, path));
    if (Object.hasOwn(MOVED, path)) return secure(redirectTo(url, MOVED[path]));
    if (path.startsWith('/download/') && Object.hasOwn(DOWNLOADS, path.slice(10))) return secure(await download(request, env, path.slice(10)));
    if (path.endsWith('/')) {
      const index = await env.ASSETS.fetch(new URL(path + 'index.html', url.origin));
      if (index.ok) return secure(index);
    } else if (!path.slice(path.lastIndexOf('/') + 1).includes('.')) {
      const page = await env.ASSETS.fetch(new URL(path + '.html', url.origin), { method: 'HEAD' });
      if (page.ok) return secure(redirectTo(url, path + '.html'));
    }
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return secure(asset);
    const notFound = await env.ASSETS.fetch(new URL('/404.html', url.origin));
    return secure(new Response(notFound.body, { status: 404, headers: notFound.headers }));
  }
};
