-- Create the audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  project_id UUID,
  project_name TEXT,
  section TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details TEXT
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_section ON audit_logs(section);

-- Enable RLS but make it permissive for now
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for anon and authenticated users (for testing)
CREATE POLICY "Allow all operations on audit_logs" 
  ON audit_logs
  FOR ALL 
  USING (true);

-- Insert some test data
INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, project_id, project_name, section, timestamp, details)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin', 'login', 'session', '00000000-0000-0000-0000-000000000000', NULL, NULL, NULL, NOW(), 'User logged in'),
  ('00000000-0000-0000-0000-000000000000', 'admin', 'create', 'project', '1', '1', 'Test Project', 'Project Management', NOW() - INTERVAL '1 hour', 'Created project: Test Project'),
  ('00000000-0000-0000-0000-000000000000', 'admin', 'update', 'project', '1', '1', 'Test Project', 'Project Management', NOW() - INTERVAL '30 minutes', 'Updated project status to In Progress'),
  ('00000000-0000-0000-0000-000000000000', 'admin', 'create', 'user', 'abc123', NULL, NULL, 'User Management', NOW() - INTERVAL '2 hours', 'Created new user with role: Contractor'),
  ('00000000-0000-0000-0000-000000000000', 'admin', 'assign', 'project_user', '1_abc123', '1', 'Test Project', 'Project Management', NOW() - INTERVAL '1 hour 55 minutes', 'Assigned user abc123 to project 1'); 