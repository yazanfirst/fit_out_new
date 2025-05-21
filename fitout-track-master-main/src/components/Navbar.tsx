
import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isMobile = useIsMobile();

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
              
              {!isMobile && (
                <div className="ml-10 flex items-center space-x-4">
                  <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                    Dashboard
                  </Link>
                  <Link to="/reports" className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                    Reports
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              {!isMobile && (
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
              
              {isMobile && (
                <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  <Menu className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {isMobile && isMenuOpen && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 sm:hidden animate-fade-in">
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
            <div className="flex flex-col">
              <Link to="/" className="px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">
                Dashboard
              </Link>
              <Link to="/reports" className="px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                Reports
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
