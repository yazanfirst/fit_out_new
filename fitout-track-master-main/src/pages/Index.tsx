import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, PlusCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProjectCard from '@/components/ProjectCard';
import AddProjectModal from '@/components/AddProjectModal';
import Navbar from '@/components/Navbar';
import { Project, ProjectStatus } from '@/lib/types';
import { getProjects } from '@/lib/api';
import { useProjectStore } from '@/stores/useProjectStore';

const Dashboard = () => {
  const { data: projects, isLoading, error, setData, setLoading, setError } = useProjectStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [setData, setLoading, setError]);
  
  // Apply filters
  const filteredProjects = projects.filter((project: Project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (project.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (project.main_contractor || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesChain = chainFilter === 'all' || project.chain === chainFilter;
    
    return matchesSearch && matchesStatus && matchesChain;
  });
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setChainFilter('all');
  };
  
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || chainFilter !== 'all';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex flex-wrap justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Project Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your restaurant fitout projects</p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 mt-4 sm:mt-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Project</span>
            </Button>
          </div>
          
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search projects..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <Button
                variant={showFilters ? "secondary" : "outline"}
                className="flex items-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  className="flex items-center gap-1"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4" />
                  <span>Clear</span>
                </Button>
              )}
            </div>
          </div>
          
          {showFilters && (
            <div className="mb-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white p-4 rounded-md shadow-sm border animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Chain</label>
                <Select value={chainFilter} onValueChange={setChainFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by chain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chains</SelectItem>
                    <SelectItem value="BK">Burger King</SelectItem>
                    <SelectItem value="TC">Texas Chicken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-12">
              <h3 className="mt-4 text-lg font-medium">Loading projects...</h3>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <h3 className="mt-4 text-lg font-medium text-red-500">Error loading projects</h3>
              <p className="text-muted-foreground mt-1">Please try again later.</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <h3 className="mt-4 text-lg font-medium">No projects found</h3>
              <p className="text-muted-foreground mt-1">
                {hasActiveFilters 
                  ? "Try adjusting your filters or search terms." 
                  : "Click the Add Project button to create your first project."}
              </p>
              {hasActiveFilters && (
                <Button 
                  className="mt-4"
                  variant="outline"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project: Project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <AddProjectModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      
      <footer className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            FitoutTrack Master &copy; {new Date().getFullYear()} | Advanced Project Management for Restaurant Fitouts
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
