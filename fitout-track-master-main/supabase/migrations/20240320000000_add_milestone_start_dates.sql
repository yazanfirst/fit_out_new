-- Add start date columns to timeline_milestones table
ALTER TABLE timeline_milestones
ADD COLUMN planned_start timestamptz,
ADD COLUMN actual_start timestamptz;

-- Set default values for existing records
UPDATE timeline_milestones
SET planned_start = planned_date - interval '7 days',
    actual_start = CASE 
        WHEN actual_date IS NOT NULL THEN actual_date - interval '7 days'
        ELSE NULL
    END;

-- Make planned_start NOT NULL after setting default values
ALTER TABLE timeline_milestones
ALTER COLUMN planned_start SET NOT NULL; 