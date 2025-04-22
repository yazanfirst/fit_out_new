import { createClient } from '@supabase/supabase-js';
import { User, UserRole } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Login user with username and password
export async function loginUser(username: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@fitouttrack.example`,
      password: password
    });

    if (error) {
      console.error('Login error:', error);
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'User not found' };
    }

    // Get user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      return { user: null, error: 'Failed to get user data' };
    }

    const user: User = {
      id: userData.id,
      username: userData.username,
      role: userData.role.charAt(0).toUpperCase() + userData.role.slice(1).toLowerCase() as UserRole,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };

    // Create audit log
    try {
      await createAuditLog(user.id, user.username, 'login', 'session', user.id, 'User logged in');
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    return { user, error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { user: null, error: 'An unexpected error occurred' };
  }
}

// Logout user
export async function logoutUser(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return { error: null };
  } catch (error) {
    console.error('Logout error:', error);
    return { error: 'Sign out failed' };
  }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return null;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single();

    if (error || !userData) {
      return null;
    }

    return {
      id: userData.id,
      username: userData.username,
      role: userData.role.charAt(0).toUpperCase() + userData.role.slice(1).toLowerCase() as UserRole,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}
