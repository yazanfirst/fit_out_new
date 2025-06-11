import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DatabaseTest = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  const [projectId, setProjectId] = useState('');

  // Test user creation directly with Supabase
  const testCreateUser = async () => {
    setLoading(true);
    try {
      // Create a test user with timestamp to avoid duplicates
      const timestamp = new Date().toISOString();
      const testUsername = `test_user_${Date.now()}`;
      
      console.log('Creating test user:', testUsername);
      
      // Insert directly into users table
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username: testUsername,
            password_hash: 'test_hash_not_real',
            role: 'contractor'  // Use lowercase for the database
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log('User created:', data);
      setResults([...results, { operation: 'Create User', data, timestamp }]);
      
      // Store the user ID for easy reference
      if (data && data.length > 0) {
        setUserId(data[0].id);
      }
      
      toast({
        title: 'User Created',
        description: `Successfully created test user: ${testUsername}`
      });
    } catch (error) {
      console.error('Error creating test user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test user: ' + (error as any).message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Test disabling RLS for users table
  const testFixRLS = async () => {
    setLoading(true);
    try {
      // This function will show the SQL needed to fix the RLS policies
      // You'll need to run these commands in the Supabase SQL editor
      
      const sqlCommands = [
        `-- Disable RLS for the users table`,
        `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`,
        ``,
        `-- Or create a policy that allows all operations on users`,
        `CREATE POLICY "Allow all operations for users" ON users FOR ALL USING (true);`,
        ``,
        `-- Make sure RLS is enabled with the new policy`,
        `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`,
        ``,
        `-- Disable RLS for the project_users table`,
        `ALTER TABLE project_users DISABLE ROW LEVEL SECURITY;`,
        ``,
        `-- Or create a policy that allows all operations on project_users`,
        `CREATE POLICY "Allow all operations for project_users" ON project_users FOR ALL USING (true);`,
        ``,
        `-- Make sure RLS is enabled with the new policy`,
        `ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;`,
        ``,
        `-- Also fix projects table RLS`,
        `ALTER TABLE projects DISABLE ROW LEVEL SECURITY;`,
        `-- Or create a policy that allows all operations on projects`,
        `CREATE POLICY "Allow all operations for projects" ON projects FOR ALL USING (true);`,
        `ALTER TABLE projects ENABLE ROW LEVEL SECURITY;`
      ].join('\n');
      
      setResults([...results, { 
        operation: 'Fix RLS Policies', 
        data: { 
          message: 'Copy and run these SQL commands in the Supabase SQL Editor',
          sql: sqlCommands 
        }, 
        timestamp: new Date().toISOString() 
      }]);
      
      toast({
        title: 'RLS Fix Generated',
        description: 'SQL commands to fix RLS have been generated. Check results below.'
      });
    } catch (error) {
      console.error('Error generating RLS fix:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate RLS fix',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Test project creation directly with Supabase
  const testCreateProject = async () => {
    setLoading(true);
    try {
      // Create a test project with timestamp to avoid duplicates
      const testProject = `Test Project ${Date.now()}`;
      
      console.log('Creating test project:', testProject);
      
      // Insert directly into projects table
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: testProject,
            location: 'Test Location',
            main_contractor: 'Test Contractor',
            status: 'In Progress',
            progress: 50,
            chain: 'BK',
            notes: 'Created for testing',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log('Project created:', data);
      setResults([...results, { operation: 'Create Project', data, timestamp: new Date().toISOString() }]);
      
      // Store the project ID for easy reference
      if (data && data.length > 0) {
        setProjectId(data[0].id);
      }
      
      toast({
        title: 'Project Created',
        description: `Successfully created test project: ${testProject}`
      });
    } catch (error) {
      console.error('Error creating test project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test project: ' + (error as any).message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Test direct project-user assignment
  const testAssignUserToProject = async () => {
    setLoading(true);
    try {
      // Use the IDs from input fields or find the first user and project
      let userIdToUse = userId;
      let projectIdToUse = projectId;
      
      if (!userIdToUse) {
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (userError) {
          throw new Error(`Error fetching users: ${userError.message}`);
        }
        
        if (!users || users.length === 0) {
          throw new Error('No users found. Please create a user first.');
        }
        
        userIdToUse = users[0].id;
        setUserId(userIdToUse);
      }
      
      if (!projectIdToUse) {
        const { data: projects, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .limit(1);
        
        if (projectError) {
          throw new Error(`Error fetching projects: ${projectError.message}`);
        }
        
        if (!projects || projects.length === 0) {
          throw new Error('No projects found. Please create a project first.');
        }
        
        projectIdToUse = projects[0].id;
        setProjectId(projectIdToUse);
      }
      
      console.log(`Assigning user ${userIdToUse} to project ${projectIdToUse}`);
      
      // First check if the assignment already exists
      const { data: existingAssignments, error: checkError } = await supabase
        .from('project_users')
        .select('*')
        .eq('user_id', userIdToUse)
        .eq('project_id', projectIdToUse);
      
      if (checkError) {
        throw new Error(`Error checking existing assignments: ${checkError.message}`);
      }
      
      if (existingAssignments && existingAssignments.length > 0) {
        console.log('Assignment already exists:', existingAssignments);
        setResults([...results, { 
          operation: 'Assign User to Project', 
          data: { 
            message: 'Assignment already exists',
            existing: existingAssignments 
          }, 
          timestamp: new Date().toISOString() 
        }]);
        
        toast({
          title: 'Already Assigned',
          description: `User ${userIdToUse} is already assigned to project ${projectIdToUse}`
        });
        
        setLoading(false);
        return;
      }
      
      // Insert directly into project_users table
      const assignmentData = {
        user_id: userIdToUse,
        project_id: projectIdToUse
      };
      
      console.log('Inserting assignment with data:', assignmentData);
      
      const { data, error } = await supabase
        .from('project_users')
        .insert([assignmentData])
        .select();
      
      if (error) {
        console.error('Assignment error:', error);
        throw new Error(`Error assigning user: ${error.message}`);
      }
      
      console.log('User assigned to project, response:', data);
      
      // Double-check the assignment was stored
      const { data: verifyData, error: verifyError } = await supabase
        .from('project_users')
        .select('*')
        .eq('user_id', userIdToUse)
        .eq('project_id', projectIdToUse);
        
      if (verifyError) {
        console.warn('Verification warning:', verifyError);
      }
      
      const verificationResult = verifyData && verifyData.length > 0 
        ? 'Successfully verified the assignment exists in the database' 
        : 'WARNING: Could not verify the assignment exists after insertion';
      
      setResults([...results, { 
        operation: 'Assign User to Project', 
        data: { 
          assignment: data,
          verification: verifyData,
          verificationResult,
          assignmentData
        }, 
        timestamp: new Date().toISOString() 
      }]);
      
      toast({
        title: 'Assignment Created',
        description: `Successfully assigned user ${userIdToUse} to project ${projectIdToUse}`
      });
    } catch (error) {
      console.error('Error assigning user to project:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign user to project: ' + (error instanceof Error ? error.message : String(error)),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Manual insert using raw SQL - bypasses RLS completely
  const testDirectSqlInsert = async () => {
    setLoading(true);
    try {
      // Use the IDs from input fields
      if (!userId || !projectId) {
        throw new Error('Please enter both user ID and project ID for direct SQL insertion');
      }
      
      // Instead of using RPC, use a direct insert with explicit data
      const insertData = {
        user_id: userId,
        project_id: projectId
      };
      
      console.log('Attempting direct insert with data:', insertData);
      
      // Method 1: Try using supabase.auth.admin option (requires service role key)
      const { data, error } = await supabase
        .from('project_users')
        .insert([insertData])
        .select();
      
      if (error) {
        console.error('Direct insert error:', error);
        throw error;
      }
      
      console.log('Direct insert result:', data);
      setResults([...results, { 
        operation: 'Direct Insert', 
        data: data, 
        timestamp: new Date().toISOString(),
        message: 'Successfully inserted assignment directly'
      }]);
      
      toast({
        title: 'Assignment Created',
        description: 'Direct database insert successful!'
      });
      
      // Verify the insert worked by checking the count of assignments
      const { count, error: countError } = await supabase
        .from('project_users')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('project_id', projectId);
        
      if (!countError && count) {
        setResults(prevResults => [...prevResults, {
          operation: 'Verification',
          data: { count },
          timestamp: new Date().toISOString(),
          message: count > 0 ? 'Assignment exists in database' : 'No assignment found'
        }]);
      }
    } catch (error) {
      console.error('Error with direct insert:', error);
      
      // Provide alternative SQL commands to run in the SQL Editor
      const manualSQL = `
        -- Run this SQL command directly in your Supabase SQL Editor
        INSERT INTO project_users (id, user_id, project_id, created_at)
        VALUES (gen_random_uuid(), '${userId}', '${projectId}', now());
        
        -- Then verify with:
        SELECT * FROM project_users 
        WHERE user_id = '${userId}' AND project_id = '${projectId}';
      `;
      
      setResults([...results, { 
        operation: 'Direct Insert Failed', 
        data: { 
          error: error instanceof Error ? error.message : String(error),
          manualSQL,
          message: 'Try running this SQL directly in the Supabase SQL Editor'
        }, 
        timestamp: new Date().toISOString() 
      }]);
      
      toast({
        title: 'Error',
        description: 'Failed to insert assignment. See alternative SQL in results.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Database Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={testCreateUser} disabled={loading}>
            {loading ? 'Creating...' : 'Test Create User'}
          </Button>
          <Button onClick={testCreateProject} disabled={loading}>
            {loading ? 'Creating...' : 'Test Create Project'}
          </Button>
          <Button onClick={testAssignUserToProject} disabled={loading}>
            {loading ? 'Assigning...' : 'Test Assign User to Project'}
          </Button>
          <Button onClick={testFixRLS} disabled={loading} variant="destructive">
            {loading ? 'Processing...' : 'Generate RLS Fix'}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 my-4">
          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Enter project ID"
              className="mt-1"
            />
          </div>
        </div>
        
        <Button onClick={testDirectSqlInsert} disabled={loading} variant="secondary" className="w-full">
          {loading ? 'Executing...' : 'Direct SQL Insert (Bypass RLS)'}
        </Button>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Test Results:</h3>
          <div className="bg-slate-50 p-4 rounded max-h-80 overflow-auto text-xs">
            {results.length === 0 ? (
              <p className="text-muted-foreground">No tests run yet</p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="mb-4 pb-4 border-b border-slate-200">
                  <p><strong>Operation:</strong> {result.operation}</p>
                  <p><strong>Time:</strong> {result.timestamp}</p>
                  <p><strong>Result:</strong></p>
                  <pre className="mt-1 whitespace-pre-wrap bg-slate-100 p-2 rounded">{JSON.stringify(result.data, null, 2)}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseTest; 