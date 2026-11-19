-- Parish operations: clergy, office hours, accessibility, languages, Confession and Adoration notes on the parish;
-- special dates (holy days, Easter and Christmas, statutory holidays), ministries, web bulletins and monthly counters.
-- Applies on top of schema.sql and 0001_review_claims.sql. Applied by deploy-english.yml before the portal deploys
-- (wrangler d1 migrations apply runs each file once). Nothing here drops or rewrites existing data.
-- JSON columns hold what the Worker writes after checking it (parishes-worker.js, adminDetails); never trust them raw.

ALTER TABLE parishes ADD COLUMN office_hours TEXT NOT NULL DEFAULT '';
ALTER TABLE parishes ADD COLUMN pastor_name TEXT NOT NULL DEFAULT '';
ALTER TABLE parishes ADD COLUMN clergy_json TEXT NOT NULL DEFAULT '[]';          -- [{name, role}]
ALTER TABLE parishes ADD COLUMN accessibility_json TEXT NOT NULL DEFAULT '{}';   -- {wheelchair, hearing_loop, accessible_washroom, parking}: true, false or absent
ALTER TABLE parishes ADD COLUMN languages_csv TEXT NOT NULL DEFAULT '';          -- "English, Polish, Tagalog"
ALTER TABLE parishes ADD COLUMN confession_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE parishes ADD COLUMN adoration_notes TEXT NOT NULL DEFAULT '';

-- One-off dates that change the usual schedule: holy days, Christmas and Easter, Holy Week, statutory holidays
CREATE TABLE IF NOT EXISTS parish_special_schedules (
  id INTEGER PRIMARY KEY,
  parish_id INTEGER NOT NULL REFERENCES parishes (id) ON DELETE CASCADE,
  occasion_name TEXT NOT NULL,                            -- "Christmas Eve", "Good Friday", "Canada Day"
  event_date TEXT NOT NULL,                               -- "YYYY-MM-DD", Toronto local date
  category TEXT NOT NULL DEFAULT 'mass' CHECK (category IN ('mass', 'confession', 'adoration', 'liturgy', 'office_closed', 'no_mass')),
  start_time TEXT NOT NULL DEFAULT '',                    -- "HH:MM", or '' for an all-day entry (office closed, no Mass)
  end_time TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'English',
  notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS parish_special_schedules_parish ON parish_special_schedules (parish_id, event_date);
CREATE INDEX IF NOT EXISTS parish_special_schedules_date ON parish_special_schedules (event_date);

CREATE TABLE IF NOT EXISTS parish_ministries (
  id INTEGER PRIMARY KEY,
  parish_id INTEGER NOT NULL REFERENCES parishes (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',                      -- Liturgy, Faith formation, Youth, Outreach, Fellowship, Prayer, Other
  schedule_text TEXT NOT NULL DEFAULT '',                 -- "Tuesdays at 7 p.m. in the hall"
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS parish_ministries_parish ON parish_ministries (parish_id);

-- The web bulletin: one per parish and week, published (published_at set) or a draft (NULL)
CREATE TABLE IF NOT EXISTS parish_bulletins (
  id INTEGER PRIMARY KEY,
  parish_id INTEGER NOT NULL REFERENCES parishes (id) ON DELETE CASCADE,
  week_of TEXT NOT NULL,                                  -- the Sunday it is for, "YYYY-MM-DD"
  pastor_note TEXT NOT NULL DEFAULT '',
  intentions_json TEXT NOT NULL DEFAULT '[]',             -- [{when, intention, by}]
  announcements_json TEXT NOT NULL DEFAULT '[]',          -- [{title, body}]
  published_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS parish_bulletins_week ON parish_bulletins (parish_id, week_of);

-- Monthly counters with no visitor data at all: no address, no cookie, no time of day
CREATE TABLE IF NOT EXISTS parish_stats (
  parish_id INTEGER NOT NULL REFERENCES parishes (id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,                                -- "YYYY-MM", Toronto time
  profile_views INTEGER NOT NULL DEFAULT 0,
  directions_clicks INTEGER NOT NULL DEFAULT 0,
  bulletin_views INTEGER NOT NULL DEFAULT 0,
  widget_loads INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (parish_id, month_key)
);
