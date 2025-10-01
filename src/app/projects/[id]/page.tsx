'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import ColorIndicator from '@/components/ui/ColorIndicator';
import StatisticsCards from '@/components/ui/StatisticsCards';
import PageContainer from '@/components/layout/PageContainer';
import { PatternType } from '@/utils/entityColors';
import { checkProjectCompletionReadiness } from '@/utils/projectValidation';
import { logger } from '@/utils/logger';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  color?: string;
  pattern?: string;
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
        logger.error('Error fetching project,', error);
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

  const statisticsCards = [
    {
      label: 'Total Items',
      value: project.items?.length || 0,
      color: 'blue' as const,
    },
    {
      label: 'Total Tasks',
      value: project.items?.reduce((total, item) => total + (item.tasks?.length || 0), 0) || 0,
      color: 'green' as const,
    },
    {
      label: 'Machines Used',
      value: project.items
        ? new Set(
          project.items
            .flatMap((item) => item.tasks || [])
            .filter((task) => task.machine)
            .map((task) => task.machine!.id),
        ).size
        : 0,
      color: 'purple' as const,
    },
    {
      label: 'Operators Assigned',
      value: project.items
        ? new Set(
          project.items
            .flatMap((item) => item.tasks || [])
            .filter((task) => task.operator)
            .map((task) => task.operator!.id),
        ).size
        : 0,
      color: 'orange' as const,
    },
    {
      label: 'Items Completed',
      value: project.items?.filter((item) => item.status === 'COMPLETED').length || 0,
      color: 'indigo' as const,
    },
  ];

  return (
    <PageContainer
      header={{
        title: project.name,
        description: project.description,
        actions: (
          <div className="flex space-x-3">
            <Link
              href={`/projects/${project.id}/edit`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Edit Project
            </Link>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this project?')) {
                  fetch(`/api/projects/${params.id}`, { method: 'DELETE' }).then((response) =>
                    response.ok ? router.push('/projects') : logger.error('Failed to delete'),
                  );
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
              Delete
            </button>
          </div>
        ),
      }}
      variant="detail"
      breadcrumbs={[
        { label: 'Projects', href: '/projects' },
        { label: project.name },
      ]}>

      <div className="flex items-center space-x-4">
        <ColorIndicator
          entity={{
            id: project.id,
            color: project.color,
            pattern: project.pattern as PatternType,
          }}
          entityType="project"
          size="lg"
        />
        <div>
          <div className="flex space-x-6 mt-2 text-sm text-gray-500">
            <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
            <span>Last Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Status and Info */}
      <div className="mb-6 flex items-center space-x-4">
        <StatusBadge
          status={project.status}
          variant={getStatusVariant(project.status)}
        />

        {/* Project Completion Readiness Indicator */}
        {(() => {
          if (!project.items) return null;

          const completionStatus = checkProjectCompletionReadiness(
            project.items.map((item) => ({
              id: item.id,
              name: item.name,
              status: item.status,
            })),
          );

          if (project.status === 'COMPLETED') {
            return <div className="mt-2 text-xs text-green-600 font-medium">✓ Project Completed</div>;
          }

          if (completionStatus.canComplete) {
            return <div className="mt-2 text-xs text-green-600 font-medium">✓ Ready for completion</div>;
          }

          if (completionStatus.totalItems === 0) {
            return <div className="mt-2 text-xs text-yellow-600 font-medium">⚠ No items added</div>;
          }

          return (
            <div className="mt-2 text-xs text-red-600 font-medium">
              ✗ {completionStatus.incompleteItems.length} item
              {completionStatus.incompleteItems.length !== 1 ? 's' : ''} remaining
            </div>
          );
        })()}
      </div>


      {/* Statistics Cards */}
      <div className="mb-8">
        <StatisticsCards
          stats={statisticsCards}
          loading={loading}
          showWhenEmpty={true}
          columns={5}
        />
      </div>

      {/* Project Items Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Project Items</h2>
            <Link
              href={`/items/new?project=${project.id}&returnUrl=/projects/${project.id}`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
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
                          className={`h-2 rounded-full transition-all duration-300 ${item.tasks.filter((t) => t.status === 'COMPLETED').length / item.tasks.length === 1
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                            }`}
                          style={{
                            width: `${(item.tasks.filter((t) => t.status === 'COMPLETED').length / item.tasks.length) * 100
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
                        {item.tasks.filter(
                          (t) => !['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(t.status),
                        ).length > 0 && (
                            <div className="flex items-center text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                              <span className="mr-1">🚨</span>
                              {
                                item.tasks.filter(
                                  (t) => !['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(t.status),
                                ).length
                              }{' '}
                              task(s) need attention
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
    </PageContainer>
  );
}
