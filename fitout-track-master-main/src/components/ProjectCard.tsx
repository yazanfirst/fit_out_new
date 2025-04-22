
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { type Project } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from '@tanstack/react-query';
import { Progress } from "@/components/ui/progress";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const queryClient = useQueryClient();
  
  // Enhanced logging to track the progress value flow
  console.log(`Rendering ProjectCard for project: ${project.name}, ID: ${project.id}, status: ${project.status}, raw progress: ${project.progress}, type: ${typeof project.progress}`);
  
  // Calculate the status color
  const getStatusColor = () => {
    switch (project.status) {
      case 'In Progress': return 'bg-blue-500';
      case 'Completed': return 'bg-green-500';
      case 'Delayed': return 'bg-red-500';
      case 'On Hold': return 'bg-amber-500';
      case 'Not Started': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Get the color for the progress bar based on progress value
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 30) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Enhanced normalization with extra validation
  let normalizedProgress = 0;
  
  if (typeof project.progress === 'number') {
    normalizedProgress = Math.max(0, Math.min(100, project.progress));
  } else if (typeof project.progress === 'string') {
    // Handle case where progress might be a string
    const parsed = parseInt(project.progress, 10);
    if (!isNaN(parsed)) {
      normalizedProgress = Math.max(0, Math.min(100, parsed));
    }
  }

  console.log(`ProjectCard: Final normalized progress: ${normalizedProgress} (from raw: ${project.progress})`);

  // Delete project function
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to project details
    e.stopPropagation(); // Stop event propagation
    
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        // Delete the project from database
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', project.id);
          
        if (error) {
          throw error;
        }
        
        // Show success notification
        toast.success('Project deleted successfully');
        
        // Refresh projects list
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      }
    }
  };

  return (
    <Link to={`/project/${project.id}`} className="block">
      <div className="group flex flex-col h-full overflow-hidden bg-white border rounded-lg shadow-sm transition hover:shadow-md">
        <div className="p-5 flex-1">
          <div className="flex justify-between items-start">
            <Badge 
              className={`${getStatusColor()} text-white`} 
              variant="secondary"
            >
              {project.status}
            </Badge>
            <div className={`text-sm font-medium ${project.chain === 'BK' ? 'text-orange-600' : 'text-red-600'}`}>
              {project.chain === 'BK' ? 'Burger King' : 'Texas Chicken'}
            </div>
          </div>
          
          <h3 className="text-lg font-medium mt-3">{project.name}</h3>
          
          <div className="mt-2 text-sm text-gray-600">
            <div className="truncate">{project.location || 'Location not specified'}</div>
            <div className="truncate mt-1">
              <span className="text-gray-500">Contractor:</span> {project.main_contractor || 'Not assigned'}
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span className="font-medium">{normalizedProgress}%</span>
            </div>
            <Progress 
              value={normalizedProgress} 
              className={`h-2 ${getProgressColor(normalizedProgress)}`}
            />
          </div>
          
          {/* Delete Button */}
          <div className="mt-4">
            <Button 
              variant="destructive"
              size="sm"
              className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete Project
            </Button>
          </div>
        </div>
        
        <div className="bg-gray-50 px-5 py-3 text-xs text-gray-500 border-t">
          Updated {new Date(project.updated_at).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
