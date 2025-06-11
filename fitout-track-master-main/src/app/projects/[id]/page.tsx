'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getProjectById } from '@/lib/api';
import { Project } from '@/lib/types';

export default function ProjectPage() {
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Project Details</h2>
        <div className="space-y-3">
          <div>
            <span className="text-gray-500">Name:</span> {project.name}
          </div>
          <div>
            <span className="text-gray-500">Location:</span> {project.location || 'N/A'}
          </div>
          <div>
            <span className="text-gray-500">Main Contractor:</span> {project.main_contractor || 'N/A'}
          </div>
          <div>
            <span className="text-gray-500">Status:</span> {project.status}
          </div>
          <div>
            <span className="text-gray-500">Progress:</span> {project.progress}%
          </div>
          <div>
            <span className="text-gray-500">Chain:</span> {project.chain}
          </div>
          {project.start_date && (
            <div>
              <span className="text-gray-500">Start Date:</span> {new Date(project.start_date).toLocaleDateString()}
            </div>
          )}
          {project.end_date && (
            <div>
              <span className="text-gray-500">End Date:</span> {new Date(project.end_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Progress</h2>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Completion</span>
            <span className="text-sm text-gray-500">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>
        
        {project.notes && (
          <>
            <h3 className="font-medium mb-2">Notes</h3>
            <p className="text-gray-700 whitespace-pre-line">{project.notes}</p>
          </>
        )}
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <a 
              href={`/projects/${id}/tasks`}
              className="block p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors text-center"
            >
              Tasks
            </a>
            <a 
              href={`/projects/${id}/timeline`}
              className="block p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors text-center"
            >
              Timeline
            </a>
            <a 
              href={`/projects/${id}/items`}
              className="block p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors text-center"
            >
              Items
            </a>
            <a 
              href={`/projects/${id}/drawings`}
              className="block p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md transition-colors text-center"
            >
              Drawings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 