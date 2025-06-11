import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Building2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { getProjectById } from '@/lib/api';
import { Project } from '@/lib/types';

const ProjectSelector = () => {
  const { userProjects, user } = useAuth();
  const navigate = useNavigate();
  const { id: currentProjectId } = useParams<{ id: string }>();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch project details for the user's assigned projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (userProjects.length === 0) return;
      
      setLoading(true);
      try {
        const projectPromises = userProjects.map(projectId => getProjectById(projectId));
        const projectData = await Promise.all(projectPromises);
        setProjects(projectData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userProjects]);

  const handleProjectChange = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  // Don't render if user is not a contractor or has no projects
  if (!user || user.role.toLowerCase() !== 'contractor' || userProjects.length === 0) {
    return null;
  }

  // If contractor only has one project, don't show selector
  if (userProjects.length === 1) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Building2 className="h-4 w-4 text-gray-500" />
      <Select 
        value={currentProjectId || ''} 
        onValueChange={handleProjectChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={loading ? "Loading projects..." : "Select project"} />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex flex-col">
                <span className="font-medium">{project.name}</span>
                <span className="text-xs text-gray-500">{project.location}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectSelector; 