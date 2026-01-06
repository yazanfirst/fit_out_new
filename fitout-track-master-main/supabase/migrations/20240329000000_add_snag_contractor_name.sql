ALTER TABLE snags
  ADD COLUMN IF NOT EXISTS contractor_name TEXT;

UPDATE snags
SET contractor_name = ''
WHERE contractor_name IS NULL;
