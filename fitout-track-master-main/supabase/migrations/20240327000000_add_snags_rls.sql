ALTER TABLE snags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on snags"
  ON snags
  FOR ALL
  USING (true)
  WITH CHECK (true);
