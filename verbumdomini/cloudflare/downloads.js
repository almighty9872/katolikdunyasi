/* /download/<file> for verbumdomini.ca (worker.js) and parishes.verbumdomini.ca (parishes-worker.js), so the
   same addresses work on both. Each Worker serves the files from its own static assets (files/<name>). */
// /download/<file>: the same file as /files/<file>, sent as an attachment, so iOS Safari and desktop browsers
// save it instead of opening it in the viewer. Only the files listed here, each with the name it is saved under.
export const DOWNLOADS = {
  'confession-card.pdf': 'Confession Card.pdf',
  'ocia-welcome-insert.pdf': 'Becoming Catholic (OCIA).pdf',
  'rosary-guide.pdf': 'How to Pray the Rosary.pdf',
  'order-of-the-mass.pdf': 'Order of the Mass.pdf',
  'the-confessions-of-st-augustine.pdf': 'The Confessions of St. Augustine.pdf',
  'the-confessions-of-st-augustine.epub': 'The Confessions of St. Augustine.epub',
  'the-confessions-of-st-augustine.azw3': 'The Confessions of St. Augustine.azw3',
  'the-confessions-of-st-augustine.txt': 'The Confessions of St. Augustine.txt'
};
export async function download(request, env, file) {
  const res = await env.ASSETS.fetch(new Request(new URL('/files/' + file, request.url), request));
  if (!res.ok) return res;
  const out = new Response(res.body, res);
  out.headers.set('Content-Disposition', `attachment; filename="${DOWNLOADS[file]}"; filename*=UTF-8''${encodeURIComponent(DOWNLOADS[file])}`);
  return out;
}
