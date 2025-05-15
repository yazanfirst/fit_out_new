import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Direct connection with a new API key
const supabaseUrl = 'https://oooujqtlkbwvhnjtzust.supabase.co';
// Try a completely fresh API key
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vb3VqcXRsa2J3dmhuanR6dXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNTA1NTgsImV4cCI6MjA1OTcyNjU1OH0.q4niIZDU0DzOVi_nztu6xoXkhU_TfwfHZ0STxhtTs9A';

// Create a direct Supabase client for testing
const testSupabase = createClient(supabaseUrl, supabaseAnonKey);

function SupabaseTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const testConnection = async () => {
    setLoading(true);
    setResult('Testing connection...');
    
    try {
      // Check if we can access the database
      const { data, error } = await testSupabase
        .from('projects')
        .select('count(*)')
        .limit(1);
        
      if (error) {
        console.error('Connection error:', error);
        setResult(`Error: ${error.message}`);
        return;
      }
      
      // Fix for TypeScript error - ensure data[0] exists and has a count property  
      const count = data && data[0] && 'count' in data[0] ? data[0].count : 0;
      setResult(`Success! Connected to database. Projects count: ${count}`);
      console.log('Connection successful, data:', data);
    } catch (err) {
      console.error('Unexpected error:', err);
      setResult(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const testStorage = async () => {
    setLoading(true);
    setResult('Testing storage connection...');
    
    try {
      // Check if we can list storage buckets
      const { data, error } = await testSupabase.storage.listBuckets();
        
      if (error) {
        console.error('Storage error:', error);
        setResult(`Storage Error: ${error.message}`);
        return;
      }
      
      const bucketNames = data.map(b => b.name).join(', ');
      setResult(`Success! Connected to storage. Buckets: ${bucketNames || 'none'}`);
      console.log('Storage connection successful, buckets:', data);
    } catch (err) {
      console.error('Unexpected storage error:', err);
      setResult(`Unexpected storage error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuditLogsTable = async () => {
    setLoading(true);
    setResult('Testing audit_logs table...');
    
    try {
      // Check if the audit_logs table exists
      const { data, error } = await testSupabase
        .from('audit_logs')
        .select('count(*)')
        .limit(1);
        
      if (error) {
        console.error('Audit logs error:', error);
        setResult(`Audit Logs Table Error: ${error.message}`);
        return;
      }
      
      // If we got here, the table exists
      const count = data && data[0] && 'count' in data[0] ? data[0].count : 0;
      setResult(`Success! Audit logs table exists. Records count: ${count}`);
      console.log('Audit logs table check successful, data:', data);
    } catch (err) {
      console.error('Unexpected audit logs error:', err);
      setResult(`Unexpected audit logs error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Supabase Connection Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Testing connection to: {supabaseUrl}</p>
        <p>Using API key: {supabaseAnonKey.substring(0, 10)}...{supabaseAnonKey.substring(supabaseAnonKey.length - 5)}</p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Test Database Connection
        </button>
        
        <button 
          onClick={testStorage} 
          disabled={loading}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Test Storage Connection
        </button>

        <button 
          onClick={testAuditLogsTable} 
          disabled={loading}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Test Audit Logs Table
        </button>
      </div>
      
      {result && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: result.includes('Error') ? '#fee2e2' : '#ecfdf5',
          border: `1px solid ${result.includes('Error') ? '#ef4444' : '#10b981'}`,
          borderRadius: '4px'
        }}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{result}</pre>
        </div>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <h2>Debug Info</h2>
        <p>If you're seeing 401 errors, your API key is likely invalid or has expired.</p>
        <p>If you're seeing 403 errors, your API key may not have the right permissions.</p>
        <p>If you're seeing network errors, check your internet connection or if Supabase is down.</p>
        <p>If you're seeing errors about missing tables, you need to create them in your Supabase database.</p>
      </div>
    </div>
  );
}

export default SupabaseTest; 