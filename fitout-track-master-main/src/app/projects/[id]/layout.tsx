'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getProjectById } from '@/lib/api';
import { Project } from '@/lib/types';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams() as { id: string };
  const pathname = usePathname();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await getProjectById(id);
        setProject(data);
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  // Navigation tabs
  const tabs = [
    {
      name: 'Overview',
      href: `/projects/${id}`,
      current: pathname === `/projects/${id}`
    },
    {
      name: 'Timeline',
      href: `/projects/${id}/timeline`,
      current: pathname === `/projects/${id}/timeline`
    },
    {
      name: 'Items',
      href: `/projects/${id}/items`,
      current: pathname === `/projects/${id}/items`
    },
    {
      name: 'Drawings',
      href: `/projects/${id}/drawings`,
      current: pathname === `/projects/${id}/drawings`
    },
    {
      name: 'Invoices',
      href: `/projects/${id}/invoices`,
      current: pathname === `/projects/${id}/invoices`
    },
    {
      name: 'Tasks',
      href: `/projects/${id}/tasks`,
      current: pathname === `/projects/${id}/tasks`
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Project header */}
      {!loading && project && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-2">
              <span 
                className={`px-3 py-1 text-sm rounded-full ${
                  project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  project.status === 'Delayed' ? 'bg-amber-100 text-amber-800' :
                  project.status === 'On Hold' ? 'bg-gray-100 text-gray-800' :
                  'bg-purple-100 text-purple-800'
                }`}
              >
                {project.status}
              </span>
              <Link 
                href="/projects"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Back to Projects
              </Link>
            </div>
          </div>
          
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <div>Location: {project.location || 'N/A'}</div>
            <div>Contractor: {project.main_contractor || 'N/A'}</div>
            <div>Progress: {project.progress}%</div>
          </div>
        </div>
      )}
      
      {/* Navigation tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${tab.current
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              aria-current={tab.current ? 'page' : undefined}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
      
      {/* Page content */}
      <main>{children}</main>
    </div>
  );
} 