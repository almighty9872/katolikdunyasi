-- The parish portal's D1 database (binding PARISH_DB in cloudflare/parishes.jsonc; Worker: cloudflare/parishes-worker.js).
-- Create it once, then apply this file and the seed (tools/seed-parishes.py writes cloudflare/seed-parishes.sql):
--   npx wrangler@4 d1 create verbumdomini-parishes
--   npx wrangler@4 d1 execute verbumdomini-parishes --remote --file cloudflare/schema.sql
--   npx wrangler@4 d1 migrations apply verbumdomini-parishes --remote --config cloudflare/parishes.jsonc
--   npx wrangler@4 d1 execute verbumdomini-parishes --remote --file cloudflare/seed-parishes.sql
-- Every statement is IF NOT EXISTS, so the file can be applied again safely. This is the base: later changes
-- (columns added since) are in cloudflare/migrations/, which deploy-english.yml applies before each portal deploy.
-- Times are local Toronto time, 24h "HH:MM"; timestamps are Unix seconds (UTC).

CREATE TABLE IF NOT EXISTS parishes (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,              -- the address: /parish/<slug>
  source_id TEXT UNIQUE,                  -- the Archdiocese listing's id, for later seed runs
  name TEXT NOT NULL,
  deanery TEXT NOT NULL DEFAULT '',       -- the Archdiocese's pastoral zone (Etobicoke, Durham, Simcoe...)
  region TEXT NOT NULL DEFAULT '',        -- the pastoral region (Central, East, North, West)
  area TEXT NOT NULL DEFAULT '',          -- the directory's filter: Toronto, Mississauga, Brampton, York Region, Durham Region, Peel/Caledon, Simcoe/Georgian
  street TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  lat REAL,
  lng REAL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  bulletin_url TEXT NOT NULL DEFAULT '',
  livestream_url TEXT NOT NULL DEFAULT '',
  is_claimed INTEGER NOT NULL DEFAULT 0,
  claimed_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS parishes_city ON parishes (city);
CREATE INDEX IF NOT EXISTS parishes_area ON parishes (area);
CREATE INDEX IF NOT EXISTS parishes_slug ON parishes (slug);

-- Sunday Masses (with Saturday vigils), weekday Masses, Confession and Adoration
CREATE TABLE IF NOT EXISTS mass_times (
  id INTEGER PRIMARY KEY,
  parish_id INTEGER NOT NULL REFERENCES parishes (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('sunday', 'weekday', 'confession', 'adoration')),
  day INTEGER NOT NULL CHECK (day BETWEEN 0 AND 6),       -- 0 Sunday ... 6 Saturday
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'English',
  note TEXT NOT NULL DEFAULT '',                          -- "Vigil", "First Friday of the month", "Not in July and August"
  sort INTEGER NOT NULL DEFAULT 0,
  seeded INTEGER NOT NULL DEFAULT 0                       -- 1: from the Archdiocese listing; 0: entered by the parish
);
CREATE INDEX IF NOT EXISTS mass_times_parish_id ON mass_times (parish_id, kind, sort);

CREATE TABLE IF NOT EXISTS parish_announcements (
  id INTEGER PRIMARY KEY,
  parish_id INTEGER NOT NULL REFERENCES parishes (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  starts_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER,                                     -- NULL: until removed
  created_by INTEGER REFERENCES parish_admins (id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS parish_announcements_parish_id ON parish_announcements (parish_id, expires_at);

-- One-time codes: a parish claim (kind 'claim') or a sign-in (kind 'login'). The PIN is never stored, only its keyed SHA-256 hash.
CREATE TABLE IF NOT EXISTS parish_claims (
  id TEXT PRIMARY KEY,                                    -- random ticket the browser holds between the two steps
  kind TEXT NOT NULL CHECK (kind IN ('claim', 'login')),
  parish_id INTEGER REFERENCES parishes (id) ON DELETE CASCADE,
  admin_id INTEGER REFERENCES parish_admins (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS parish_claims_parish_id ON parish_claims (parish_id);
CREATE INDEX IF NOT EXISTS parish_claims_email ON parish_claims (email, created_at);

-- Staff who can edit a parish: the person who claimed it (is_owner = 1) and the editors they add
CREATE TABLE IF NOT EXISTS parish_admins (
  id INTEGER PRIMARY KEY,
  parish_id INTEGER NOT NULL REFERENCES parishes (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  is_owner INTEGER NOT NULL DEFAULT 0,
  invited_by INTEGER REFERENCES parish_admins (id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_login_at INTEGER,
  UNIQUE (parish_id, email)
);
CREATE INDEX IF NOT EXISTS parish_admins_parish_id ON parish_admins (parish_id);
CREATE INDEX IF NOT EXISTS parish_admins_email ON parish_admins (email);

CREATE TABLE IF NOT EXISTS parish_audit_log (
  id INTEGER PRIMARY KEY,
  parish_id INTEGER NOT NULL REFERENCES parishes (id) ON DELETE CASCADE,
  admin_id INTEGER,
  action TEXT NOT NULL,                                   -- claim, login, profile, schedules, announcement.add, announcement.remove, editor.add, editor.remove
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS parish_audit_log_parish_id ON parish_audit_log (parish_id, created_at);
