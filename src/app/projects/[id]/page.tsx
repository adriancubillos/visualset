'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  items?: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    updatedAt: string;
    tasks?: Array<{
      id: string;
      title: string;
      status: string;
      machine?: {
        id: string;
        name: string;
      };
      operator?: {
        id: string;
        name: string;
      };
    }>;
  }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        const projectData = await response.json();
        setProject(projectData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PLANNING':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'ON_HOLD':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        // TODO: Replace with actual API call
        const response = await fetch(`/api/projects/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          router.push('/projects');
        } else {
          console.error('Failed to delete project');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Project not found</div>
        <Link
          href="/projects"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <nav
            className="flex mb-4"
            aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link
                  href="/projects"
                  className="text-gray-500 hover:text-gray-700">
                  Projects
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{project.name}</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <div className="mt-2 flex items-center space-x-4">
            <StatusBadge
              status={project.status}
              variant={getStatusVariant(project.status)}
            />
            <span className="text-gray-500">Created {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/projects/${project.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            Delete
          </button>
        </div>
      </div>

      {/* Project Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Project Details</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Project Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{project.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <StatusBadge
                  status={project.status}
                  variant={getStatusVariant(project.status)}
                />
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{project.description}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(project.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(project.updatedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Project Items Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Project Items</h2>
            <Link
              href={`/items/new?project=${project.id}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Add Item
            </Link>
          </div>
        </div>
        <div className="px-6 py-4">
          {project.items && project.items.length > 0 ? (
            <div className="space-y-4">
              {project.items.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        <Link
                          href={`/items/${item.id}`}
                          className="hover:text-blue-600">
                          {item.name}
                        </Link>
                      </h3>
                      {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                    </div>
                    <StatusBadge
                      status={item.status}
                      variant={getStatusVariant(item.status)}
                    />
                  </div>

                  {/* Item completion and warnings */}
                  {item.tasks && item.tasks.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {/* Completion percentage */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Progress ({item.tasks.filter((t) => t.status === 'COMPLETED').length}/{item.tasks.length}{' '}
                          tasks)
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(
                            (item.tasks.filter((t) => t.status === 'COMPLETED').length / item.tasks.length) * 100,
                          )}
                          %
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            item.tasks.filter((t) => t.status === 'COMPLETED').length / item.tasks.length === 1
                              ? 'bg-green-500'
                              : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${
                              (item.tasks.filter((t) => t.status === 'COMPLETED').length / item.tasks.length) * 100
                            }%`,
                          }}
                        />
                      </div>

                      {/* Warnings */}
                      <div className="space-y-1">
                        {/* Tasks without operators */}
                        {item.tasks.filter((t) => !t.operator).length > 0 && (
                          <div className="flex items-center text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                            <span className="mr-1">⚠️</span>
                            {item.tasks.filter((t) => !t.operator).length} task(s) without operator assigned
                          </div>
                        )}

                        {/* Tasks with problematic statuses */}
                        {item.tasks.filter((t) => !['IN_PROGRESS', 'COMPLETED'].includes(t.status)).length > 0 && (
                          <div className="flex items-center text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                            <span className="mr-1">🚨</span>
                            {item.tasks.filter((t) => !['IN_PROGRESS', 'COMPLETED'].includes(t.status)).length} task(s)
                            need attention
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        <span className="mr-1">📝</span>
                        No tasks created for this item yet
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No items in this project yet.
              <Link
                href={`/items/new?project=${project.id}`}
                className="block mt-2 text-blue-600 hover:text-blue-800">
                Create the first item
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">📦</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Items</div>
              <div className="text-2xl font-bold text-gray-900">{project.items?.length || 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-sm">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Tasks</div>
              <div className="text-2xl font-bold text-gray-900">
                {project.items?.reduce((total, item) => total + (item.tasks?.length || 0), 0) || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-sm">⚙️</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Machines Used</div>
              <div className="text-2xl font-bold text-gray-900">
                {project.items
                  ? new Set(
                      project.items
                        .flatMap((item) => item.tasks || [])
                        .filter((task) => task.machine)
                        .map((task) => task.machine!.id),
                    ).size
                  : 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-sm">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Operators Assigned</div>
              <div className="text-2xl font-bold text-gray-900">
                {project.items
                  ? new Set(
                      project.items
                        .flatMap((item) => item.tasks || [])
                        .filter((task) => task.operator)
                        .map((task) => task.operator!.id),
                    ).size
                  : 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 text-sm">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Items Completed</div>
              <div className="text-2xl font-bold text-gray-900">
                {project.items?.filter((item) => item.status === 'COMPLETED').length || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
