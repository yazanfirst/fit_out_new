ALTER TABLE snags
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'Contractor' CHECK (scope IN ('Owner', 'Contractor'));

UPDATE snags
SET scope = 'Contractor'
WHERE scope IS NULL;
