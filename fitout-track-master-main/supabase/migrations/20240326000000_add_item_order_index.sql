ALTER TABLE project_items
  ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY project_id, scope ORDER BY created_at) - 1 AS new_order
  FROM project_items
)
UPDATE project_items
SET order_index = ordered.new_order
FROM ordered
WHERE project_items.id = ordered.id;

CREATE INDEX IF NOT EXISTS idx_project_items_order
  ON project_items(project_id, scope, order_index);
