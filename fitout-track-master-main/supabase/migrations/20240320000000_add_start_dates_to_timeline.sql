-- Add start date columns to timeline_milestones table
ALTER TABLE timeline_milestones
ADD COLUMN planned_start timestamptz,
ADD COLUMN actual_start timestamptz;

-- Initialize planned_start for existing records (set to 7 days before planned_date)
UPDATE timeline_milestones
SET planned_start = planned_date - interval '7 days'
WHERE planned_start IS NULL;

-- Initialize actual_start for completed records (set to 7 days before actual_date)
UPDATE timeline_milestones
SET actual_start = actual_date - interval '7 days'
WHERE actual_date IS NOT NULL 
AND actual_start IS NULL;

-- Make planned_start required (NOT NULL) since planned_date is required
ALTER TABLE timeline_milestones
ALTER COLUMN planned_start SET NOT NULL; 