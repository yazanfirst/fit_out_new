-- Example: Update a specific milestone by ID
UPDATE timeline_milestones
SET 
    planned_date = '2025-03-01 00:00:00+00',
    actual_date = '2025-03-01 00:00:00+00',
    status = 'Completed'
WHERE id = '57560803-fe77-477e-bd12-5457d85a07c5';

-- Example: Update all 'Not Started' milestones
UPDATE timeline_milestones
SET planned_date = planned_date + interval '1 month'
WHERE status = 'Not Started';

-- Example: Update completion status based on dates
UPDATE timeline_milestones
SET status = 'Completed'
WHERE actual_date IS NOT NULL;

-- Example: Mark milestones as delayed if past planned date
UPDATE timeline_milestones
SET status = 'Delayed'
WHERE planned_date < CURRENT_TIMESTAMP 
    AND status = 'Not Started';

-- Example: Clear actual_date for specific status
UPDATE timeline_milestones
SET actual_date = NULL
WHERE status IN ('Not Started', 'In Progress', 'Delayed'); 