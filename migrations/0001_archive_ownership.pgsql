BEGIN;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS owner_id varchar(128);
CREATE INDEX IF NOT EXISTS archives_owner_id_idx ON archives (owner_id);
COMMIT;
