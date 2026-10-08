-- Additive migration for existing installations. Review against a staging database first.
CREATE TABLE IF NOT EXISTS ai_usage (
  key text PRIMARY KEY,
  window_start bigint NOT NULL,
  used integer NOT NULL CHECK (used > 0)
);

-- Preserve the reviewed source context without changing existing deadline dates.
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS source_text text NOT NULL DEFAULT '';
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS date_status text NOT NULL DEFAULT 'legacy';
