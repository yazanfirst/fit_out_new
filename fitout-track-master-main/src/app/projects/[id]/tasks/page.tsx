'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import KanbanBoard from '@/components/KanbanBoard/KanbanBoard';
import { getProjectById } from '@/lib/api';
import { Project } from '@/lib/types';

export default function ProjectTasksPage() {
  const { id } = useParams() as { id: string };
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await getProjectById(id);
        setProject(data);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md m-4">
        <p>{error || 'Project not found'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {project.status}
          </span>
          <span className="text-gray-500 text-sm">
            {project.location}
          </span>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 h-[calc(100vh-200px)]">
        <KanbanBoard projectId={id} />
      </div>
    </div>
  );
} 