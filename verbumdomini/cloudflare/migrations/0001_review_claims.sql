-- Claims reviewed by a site administrator, holiday notes, wheelchair access, and the actor's email in the log.
-- Applies on top of schema.sql (the base) for a new database and the existing one alike.
-- Applied by deploy-english.yml before the portal deploys (wrangler d1 migrations apply; it runs each file once).
ALTER TABLE parishes ADD COLUMN holiday_note TEXT NOT NULL DEFAULT '';
ALTER TABLE parishes ADD COLUMN wheelchair_accessible INTEGER;
ALTER TABLE parish_claims ADD COLUMN status TEXT NOT NULL DEFAULT 'code';
ALTER TABLE parish_claims ADD COLUMN manual INTEGER NOT NULL DEFAULT 0;
ALTER TABLE parish_claims ADD COLUMN message TEXT NOT NULL DEFAULT '';
ALTER TABLE parish_claims ADD COLUMN verified_at INTEGER;
ALTER TABLE parish_audit_log ADD COLUMN actor_email TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS parish_claims_status ON parish_claims (status, kind);
CREATE INDEX IF NOT EXISTS parish_audit_log_created ON parish_audit_log (created_at);
