import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '@/lib/types';
import { 
  loginUser, 
  logoutUser, 
  getCurrentUser, 
  getUserProjects 
} from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  userProjects: string[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCoordinator: boolean;
  isContractor: boolean;
  hasPermission: (action: string, resource: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProjects, setUserProjects] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          if (currentUser.role.toLowerCase() === 'contractor') {
            const projects = await getUserProjects(currentUser.id);
            setUserProjects(projects);
            
            // Redirect contractor to their first project if they're on the dashboard
            if (window.location.pathname === '/' && projects.length > 0) {
              navigate(`/project/${projects[0]}`);
            }
          }
        } else {
          // Not logged in, redirect to login
          if (window.location.pathname !== '/login') {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [navigate]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { user: loggedInUser, error } = await loginUser(username, password);
      
      if (error || !loggedInUser) {
        toast({
          title: 'Login failed',
          description: error || 'Invalid credentials',
          variant: 'destructive'
        });
        return false;
      }
      
      setUser(loggedInUser);
      
      // Load projects for contractor - make case-insensitive
      if (loggedInUser.role.toLowerCase() === 'contractor') {
        const projects = await getUserProjects(loggedInUser.id);
        setUserProjects(projects);
        
        // Redirect contractor to their first project
        if (projects.length > 0) {
          navigate(`/project/${projects[0]}`);
        } else {
          toast({
            title: 'No projects assigned',
            description: 'You have no projects assigned to your account',
            variant: 'destructive'
          });
        }
      } else {
        // Redirect admin and coordinator to dashboard
        navigate('/');
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutUser();
      setUser(null);
      setUserProjects([]);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout failed',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isCoordinator = user?.role?.toLowerCase() === 'coordinator';
  const isContractor = user?.role?.toLowerCase() === 'contractor';

  const hasPermission = (action: string, resource: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions - make case-insensitive
    if (user.role.toLowerCase() === 'admin') {
      return true;
    }

    // Coordinator permissions - make case-insensitive
    if (user.role.toLowerCase() === 'coordinator') {
      // Coordinators can do anything except user management
      if (resource === 'users') {
        return false;
      }
      return true;
    }

    // Contractor permissions - most restricted - make case-insensitive
    if (user.role.toLowerCase() === 'contractor') {
      // Contractors can't access these resources at all
      if (['users', 'audit_logs', 'invoices'].includes(resource)) {
        return false;
      }
      
      // Contractors can view projects but not delete them
      if (resource === 'projects' || resource === 'items') {
        if (action === 'delete') {
          return false;
        }
        // Allow view, create, update
        return ['view', 'create', 'update'].includes(action);
      }
      
      // For timeline items, drawings, etc. - contractors can view and update but not delete
      if (['timeline', 'drawings', 'milestones'].includes(resource)) {
        if (action === 'delete') {
          return false;
        }
        return ['view', 'create', 'update'].includes(action);
      }
      
      // Default to false for any other resource/action combinations
      return false;
    }

    // Default deny for unknown roles
    return false;
  };

  const value = {
    user,
    loading,
    userProjects,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isCoordinator,
    isContractor,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 