import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { initializeStorageBuckets } from '@/lib/storage';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oooujqtlkbwvhnjtzust.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vb3VqcXRsa2J3dmhuanR6dXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNTA1NTgsImV4cCI6MjA1OTcyNjU1OH0.q4niIZDU0DzOVi_nztu6xoXkhU_TfwfHZ0STxhtTs9A';

console.log('Initializing Supabase client with real-time subscription enabled');

// Storage bucket names - centralized for consistency
export const STORAGE_BUCKETS = {
  DRAWINGS: 'project-drawings',
  PHOTOS: 'project-photos',
  INVOICES: 'invoice-files'
};

// Initialize the Supabase client with the Database type and enhanced realtime settings
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  { 
    realtime: {
      params: {
        eventsPerSecond: 20, // Increased from 10 to allow more frequent updates
      },
    },
    db: {
      schema: 'public',
    },
    global: {
      fetch: fetch,
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Initialize the app (only called once)
export const initializeApp = async () => {
  console.log('App initialization started');
  
  try {
    // Initialize storage buckets
    await initializeStorageBuckets();
    
    // Set up realtime subscription to projects table
    const channel = supabase
      .channel('projects-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'projects' 
      }, payload => {
        console.log('Project change detected:', payload);
      })
      .subscribe();
    
    console.log('App initialization complete');
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
};

export { initializeStorageBuckets };

// DISABLED: These functions now pass through all values without validation
export const sanitizeString = (str: string): string => {
  return str || '';
};

export const sanitizeUuid = (uuid: string): string => {
  return uuid || '';
};

export const validateId = (id: string): boolean => {
  // Always return true to bypass validation
  return true;
};

export const validateEmail = (email: string): boolean => {
  // Always return true to bypass validation
  return true;
};

export const validateRole = (role: string): boolean => {
  // Check that role is one of the allowed roles
  const validRoles = ['admin', 'coordinator', 'contractor'];
  return validRoles.includes(role.toLowerCase());
};

// Export sanitized client for direct use in components
export default supabase;
