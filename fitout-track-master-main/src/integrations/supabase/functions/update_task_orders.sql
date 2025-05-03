CREATE OR REPLACE FUNCTION update_task_orders(task_updates jsonb[])
RETURNS void AS $$
DECLARE
  task_update jsonb;
  update_count integer := 0;
BEGIN
  FOR task_update IN SELECT * FROM unnest(task_updates)
  LOOP
    BEGIN
      UPDATE tasks
      SET 
        status = task_update->>'status',
        order_index = (task_update->>'order_index')::integer,
        updated_at = now()
      WHERE id = (task_update->>'id')::uuid;
      
      update_count := update_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error updating task %: %', (task_update->>'id'), SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Successfully updated % tasks', update_count;
END;
$$ LANGUAGE plpgsql; 