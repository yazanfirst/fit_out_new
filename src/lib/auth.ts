import { User, UserRole, AuditLog } from './types';
import bcrypt from 'bcryptjs';
import { sanitizeUuid, validateId } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Create a mock storage for development environments without window
const createMemoryStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => (key in store ? store[key] : null),
    setItem: (key: string, value: string): void => { store[key] = value; },
    removeItem: (key: string): void => { delete store[key]; },
    clear: (): void => { Object.keys(store).forEach(key => delete store[key]); },
    key: (index: number): string | null => {
      const keys = Object.keys(store);
      return index >= 0 && index < keys.length ? keys[index] : null;
    },
    length: Object.keys(store).length
  } as Storage;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use browser localStorage if available, otherwise use memory storage
const storage = typeof window !== 'undefined' ? window.localStorage : createMemoryStorage();
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Login user with username and password
export async function loginUser(username: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // DEVELOPMENT MODE: Handle hardcoded admin and dev users
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode login attempt for:', username);
      
      // Special case for admin
      if (username.toLowerCase() === 'admin' && password === 'admin123') {
        console.log('Development mode: Using hardcoded admin user');
        
        // Create a development admin user
        const user: User = {
          id: 'f968ddca-2424-45ff-8ffa-b7a180216734', // Use the ID from your database
          username: 'admin',
          role: 'Admin',
          created_at: '2025-04-21T19:57:55.462825+00',
          updated_at: '2025-04-21T19:57:55.462825+00'
        };
        
        // Store authenticated user in localStorage for development
        storage.setItem('authenticated_user', JSON.stringify(user));
        
        try {
          // Log successful login, but don't fail if this doesn't work
          await createAuditLog(user.id, user.username, 'login', 'session', user.id, 'User logged in (dev mode)');
        } catch (auditError) {
          console.warn('Failed to create audit log in dev mode:', auditError);
        }
        
        return { user, error: null };
      }
      
      // Check for other development users - use stored passwords
      const devUsersJson = storage.getItem('dev_users');
      if (devUsersJson) {
        const devUsers = JSON.parse(devUsersJson);
        const user = devUsers.find((u: User) => u.username.toLowerCase() === username.toLowerCase());
        
        if (user) {
          console.log('Found development user:', user.username);
          
          // Get stored passwords
          const passwordsJson = storage.getItem('dev_passwords');
          const passwords = passwordsJson ? JSON.parse(passwordsJson) : {};
          const storedPassword = passwords[username.toLowerCase()];
          
          // Check if we have a stored password, otherwise fallback to default
          if (storedPassword) {
            if (password === storedPassword) {
              // Store authenticated user in localStorage for development
              storage.setItem('authenticated_user', JSON.stringify(user));
              
              try {
                await createAuditLog(user.id, user.username, 'login', 'session', user.id, 'Dev user logged in');
              } catch (auditError) {
                console.warn('Failed to create audit log for dev user:', auditError);
              }
              
              return { user, error: null };
            } else {
              console.log(`Password mismatch for ${username}. Expected: ${storedPassword}, Got: ${password}`);
              return { user: null, error: `Invalid password for ${username}. For development users, use the password you set when creating the user.` };
            }
          } else {
            // Fallback to the default "password123" check
            if (password === 'password123') {
              // Store authenticated user in localStorage for development
              storage.setItem('authenticated_user', JSON.stringify(user));
              
              try {
                await createAuditLog(user.id, user.username, 'login', 'session', user.id, 'Dev user logged in');
              } catch (auditError) {
                console.warn('Failed to create audit log for dev user:', auditError);
              }
              
              return { user, error: null };
            } else {
              return { user: null, error: 'Invalid password for development user. Try using "password123".' };
            }
          }
        }
      }
      
      // For development mode, if user not found in dev storage, create one on the fly if password is "password123"
      if (password === 'password123') {
        console.log('Auto-creating development user:', username);
        
        const { user, error } = await createUser(username, password, 'Contractor');
        if (user) {
          // Store authenticated user in localStorage
          storage.setItem('authenticated_user', JSON.stringify(user));
          return { user, error: null };
        } else {
          return { user: null, error: error || 'Failed to auto-create user' };
        }
      }
      
      return { user: null, error: 'Invalid username or password for development mode' };
    }

    // PRODUCTION MODE: Regular flow for production users
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
      .eq('username', username)
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      return { user: null, error: 'Invalid username or password' };
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    if (!isValidPassword) {
      return { user: null, error: 'Invalid username or password' };
    }

    // Return user without password hash
    const user: User = {
      id: userData.id,
      username: userData.username,
      role: userData.role.charAt(0).toUpperCase() + userData.role.slice(1).toLowerCase() as UserRole,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };

    // Store authenticated user in localStorage for development
    storage.setItem('authenticated_user', JSON.stringify(user));

    // Log successful login
    try {
      await createAuditLog(user.id, user.username, 'login', 'session', user.id, 'User logged in');
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
      // Continue anyway - don't fail the login just because we couldn't log it
    }

    return { user, error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

// Logout user
export async function logoutUser(): Promise<{ error: string | null }> {
  try {
    // For development, just remove from localStorage
    storage.removeItem('authenticated_user');

    // In production, we'd use this:
    // const { error } = await supabase.auth.signOut();
    // if (error) {
    //   throw error;
    // }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return { error: null };
  } catch (error) {
    console.error('Logout error:', error);
    return { error: null };
  }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    // In development mode, we're using localStorage to store the authenticated user
    const storedUser = storage.getItem('authenticated_user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }

    // In production, we would use this:
    // const { data: sessionData } = await supabase.auth.getSession();
    // if (!sessionData.session) {
    //   return null;
    // }
    //
    // const { data: userData, error } = await supabase
    //   .from('users')
    //   .select('*')
    //   .eq('id', sessionData.session.user.id)
    //   .single();
    //
    // if (error || !userData) {
    //   return null;
    // }
    //
    // return {
    //   id: userData.id,
    //   username: userData.username,
    //   role: userData.role as UserRole,
    //   created_at: userData.created_at,
    //   updated_at: userData.updated_at
    // };

    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Create a new user (Admin only)
export async function createUser(
  username: string, 
  password: string, 
  role: UserRole
): Promise<{ user: User | null; error: string | null }> {
  try {
    console.log('Creating user in database:', username, 'with role:', role);
    
    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();
    
    if (checkError) {
      if (checkError.code !== 'PGRST116') { // Not found is expected
        console.error('Error checking existing user:', checkError);
        return { user: null, error: `Database error: ${checkError.message}` };
      }
    }

    if (existingUser) {
      console.log('Username already exists:', username);
      return { user: null, error: 'Username already exists' };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Convert role to lowercase for database storage (enum type in Postgres)
    const dbRole = role.toLowerCase();
    console.log('Using database role format:', dbRole);

    // Create user in users table
    console.log('Inserting user into database');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          username,
          password_hash: passwordHash,
          role: dbRole // Use lowercase role value for the database
        }
      ])
      .select('*')
      .single();

    if (userError) {
      console.error('Error inserting user into database:', userError);
      return { user: null, error: `Database error: ${userError.message || 'Unknown error'}` };
    }
    
    if (!userData) {
      console.error('No user data returned from insert');
      return { user: null, error: 'Failed to create user - no data returned' };
    }

    console.log('Successfully created user in database:', userData);

    // Get current user for audit log
    const currentUser = await getCurrentUser();
    if (currentUser) {
      try {
        await createAuditLog(
          currentUser.id,
          currentUser.username,
          'create',
          'user',
          userData.id,
          `Created new user with role: ${role}`
        );
      } catch (auditError) {
        console.warn('Failed to create audit log for new user:', auditError);
        // Continue anyway
      }
    }

    // Return the newly created user with correct capitalized role from our app's type
    const user: User = {
      id: userData.id,
      username: userData.username,
      role: role, // Use the original capitalized role from our app
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };
    console.log('Returning new user:', user);
    
    // Save to dev_users for development mode persistence
    if (process.env.NODE_ENV !== 'production') {
      const storedUsers = storage.getItem('dev_users');
      let devUsers = storedUsers ? JSON.parse(storedUsers) : [];
      devUsers.push(user);
      storage.setItem('dev_users', JSON.stringify(devUsers));
      
      // Store password for development mode
      const passwordsJson = storage.getItem('dev_passwords');
      const passwords = passwordsJson ? JSON.parse(passwordsJson) : {};
      passwords[username.toLowerCase()] = password;
      storage.setItem('dev_passwords', JSON.stringify(passwords));
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('Create user error:', error);
    return { 
      user: null, 
      error: error instanceof Error 
        ? `Failed to create user: ${error.message}` 
        : 'Failed to create user: Unknown error' 
    };
  }
}

// Update a user (Admin only)
export async function updateUser(
  userId: string,
  updates: { username?: string; password?: string; role?: UserRole }
): Promise<{ user: User | null; error: string | null }> {
  try {
    const updateData: any = {};
    
    if (updates.username) {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', updates.username)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return { user: null, error: 'Username already exists' };
      }
      
      updateData.username = updates.username;
    }
    
    if (updates.password) {
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(updates.password, salt);
    }
    
    if (updates.role) {
      // Convert role to lowercase for database storage
      updateData.role = updates.role.toLowerCase();
      console.log('Updating user with role:', updates.role, '(db format:', updateData.role, ')');
    }
    
    // Update user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
      
    if (userError || !userData) {
      throw userError || new Error('Failed to update user');
    }
    
    // Get current user for audit log
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await createAuditLog(
        currentUser.id,
        currentUser.username,
        'update',
        'user',
        userId,
        `Updated user: ${JSON.stringify(updates)}`
      );
    }
    
    // Return user with properly capitalized role
    return {
      user: {
        id: userData.id,
        username: userData.username,
        role: updates.role || (userData.role as string).charAt(0).toUpperCase() + (userData.role as string).slice(1).toLowerCase() as UserRole,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      },
      error: null
    };
  } catch (error) {
    console.error('Update user error:', error);
    return { 
      user: null, 
      error: error instanceof Error 
        ? `Failed to update user: ${error.message}` 
        : 'Failed to update user: Unknown error'
    };
  }
}

// Delete a user (Admin only)
export async function deleteUser(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Delete user from users table
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (userError) {
      throw userError;
    }
    
    // Delete from project_users
    await supabase
      .from('project_users')
      .delete()
      .eq('user_id', userId);
    
    // Get current user for audit log
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await createAuditLog(
        currentUser.id,
        currentUser.username,
        'delete',
        'user',
        userId,
        'User deleted'
      );
    }
    
    // In development mode, also remove from localStorage
    if (process.env.NODE_ENV !== 'production') {
      const storedUsers = storage.getItem('dev_users');
      if (storedUsers) {
        const devUsers = JSON.parse(storedUsers);
        const updatedUsers = devUsers.filter((user: User) => user.id !== userId);
        storage.setItem('dev_users', JSON.stringify(updatedUsers));
      }
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Delete user error:', error);
    return { 
      success: false, 
      error: error instanceof Error 
        ? `Failed to delete user: ${error.message}` 
        : 'Failed to delete user: Unknown error'
    };
  }
}

// Get all users (Admin only)
export async function getAllUsers(): Promise<User[]> {
  try {
    // Get users from database in all environments
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role, created_at, updated_at')
      .order('username');
      
    if (error) {
      console.error('Error getting users from database:', error);
      throw error;
    }
    
    // Convert DB roles (lowercase) to app roles (capitalized)
    const usersWithFixedRoles = data.map(user => ({
      ...user,
      role: (user.role as string).charAt(0).toUpperCase() + (user.role as string).slice(1).toLowerCase() as UserRole
    }));
    
    // In development mode, update stored users to match database
    if (process.env.NODE_ENV !== 'production') {
      // Store the database users to local storage for persistence
      storage.setItem('dev_users', JSON.stringify(usersWithFixedRoles));
    }
    
    return usersWithFixedRoles as User[];
  } catch (error) {
    console.error('Get all users error:', error);
    
    // Only fall back to localStorage in development mode if database query failed
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode: falling back to localStorage');
      const storedUsers = storage.getItem('dev_users');
      return storedUsers ? JSON.parse(storedUsers) : [];
    }
    
    return [];
  }
}

// Assign user to project
export async function assignUserToProject(userId: string, projectId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Use IDs directly without validation
    console.log('Assigning user to project without validation:', userId, projectId);
    
    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('project_users')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .single();
      
    if (existingAssignment) {
      return { success: true, error: null }; // Already assigned
    }
    
    // Create assignment
    const { error } = await supabase
      .from('project_users')
      .insert([{ user_id: userId, project_id: projectId }]);
      
    if (error) {
      console.error('Error assigning user to project:', error);
      return { success: false, error: error.message };
    }
    
    // Get current user for audit log
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await createAuditLog(
        currentUser.id,
        currentUser.username,
        'assign',
        'project_user',
        `${projectId}_${userId}`,
        `Assigned user ${userId} to project ${projectId}`
      );
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Assign user to project error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to assign user to project'
    };
  }
}

// Remove user from project
export async function removeUserFromProject(userId: string, projectId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('project_users')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId);
      
    if (error) {
      throw error;
    }
    
    // Get current user for audit log
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await createAuditLog(
        currentUser.id,
        currentUser.username,
        'unassign',
        'project_user',
        `${projectId}_${userId}`,
        `Removed user ${userId} from project ${projectId}`
      );
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Remove user from project error:', error);
    return { success: false, error: 'Failed to remove user from project' };
  }
}

// Get projects for a user
export async function getUserProjects(userId: string): Promise<string[]> {
  try {
    // Get projects from database
    const { data, error } = await supabase
      .from('project_users')
      .select('project_id')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
    
    return data.map(item => item.project_id);
  } catch (error) {
    console.error('Get user projects error:', error);
    return [];
  }
}

// Get users for a project
export async function getProjectUsers(projectId: string): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('project_users')
      .select('user_id')
      .eq('project_id', projectId);
      
    if (error) {
      throw error;
    }
    
    const userIds = data.map(item => item.user_id);
    
    if (userIds.length === 0) {
      return [];
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, role, created_at, updated_at')
      .in('id', userIds);
      
    if (userError) {
      throw userError;
    }
    
    return userData as User[];
  } catch (error) {
    console.error('Get project users error:', error);
    return [];
  }
}

// Create audit log
export async function createAuditLog(
  userId: string,
  username: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: string
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert([
      {
        user_id: userId,
        username,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        timestamp: new Date().toISOString()
      }
    ]);
  } catch (error) {
    console.error('Create audit log error:', error);
    console.error('Get current user error:', error);
    return null;
  }
}

// Get audit logs (Admin only)
export async function getAuditLogs(limit = 100, offset = 0): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      throw error;
    }
    
    return data as AuditLog[];
  } catch (error) {
    console.error('Get audit logs error:', error);
    return [];
  }
}
