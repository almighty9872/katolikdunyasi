// Types for `tsc -p verbumdomini/jsconfig.json` (type check only; nothing here ships).
declare module 'cloudflare:email' { export class EmailMessage { constructor(from: string, to: string, raw: string); } }
// The Workers runtime's default cache (parishes-worker.js)
interface CacheStorage { readonly default: Cache; }
