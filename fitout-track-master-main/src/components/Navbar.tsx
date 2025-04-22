import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, User, FileText, Users, ClipboardList, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { user, logout, isAdmin, isCoordinator } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.username) return 'U';
    
    const parts = user.username.split(/[^a-zA-Z0-9]/); // Split by non-alphanumeric characters
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  // Get color class based on user role
  const getRoleColorClass = () => {
    if (!user) return 'bg-gray-500';
    
    switch (user.role) {
      case 'Admin':
        return 'bg-purple-500';
      case 'Coordinator':
        return 'bg-blue-500';
      case 'Contractor':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-primary">FitoutTrack</span>
                <span className="text-xl font-semibold text-muted-foreground ml-1">Master</span>
              </Link>
              
              {!isMobile && user && (
                <div className="ml-10 flex items-center space-x-4">
                  {(isAdmin || isCoordinator) && (
                    <>
                      <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        Dashboard
                      </Link>
                      <Link to="/reports" className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center">
                        <ClipboardList className="h-4 w-4 mr-1" />
                        Reports
                      </Link>
                    </>
                  )}
                  
                  {isAdmin && (
                    <>
                      <Link to="/users" className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Users
                      </Link>
                      <Link to="/audit-logs" className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center">
                        <ClipboardList className="h-4 w-4 mr-1" />
                        Audit Logs
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              {!isMobile && user && (isAdmin || isCoordinator) && (
                <div className="relative w-64 mr-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search projects..."
                    className="pl-10 py-2 focus:ring-primary"
                  />
                </div>
              )}
              
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className={`h-8 w-8 ${getRoleColorClass()}`}>
                        <AvatarFallback className="text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.role}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/users')}>
                          <Users className="mr-2 h-4 w-4" />
                          <span>User Management</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/audit-logs')}>
                          <ClipboardList className="mr-2 h-4 w-4" />
                          <span>Audit Logs</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {isMobile && (
                <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  <Menu className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {isMobile && isMenuOpen && user && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 sm:hidden animate-fade-in">
            {(isAdmin || isCoordinator) && (
              <div className="mb-3 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search projects..."
                  className="pl-10 py-2 w-full"
                />
              </div>
            )}
            
            <div className="flex flex-col">
              {(isAdmin || isCoordinator) && (
                <>
                  <Link to="/" className="px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link to="/reports" className="px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Reports
                  </Link>
                </>
              )}
              
              {isAdmin && (
                <>
                  <Link to="/users" className="px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </Link>
                  <Link to="/audit-logs" className="px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Audit Logs
                  </Link>
                </>
              )}
              
              <button 
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 flex items-center mt-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
