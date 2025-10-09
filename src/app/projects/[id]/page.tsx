'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import { getStatusVariant } from '@/utils/statusStyles';
import { logger } from '@/utils/logger';
import { extractErrorMessage, getErrorMessage } from '@/utils/errorHandling';
import PageContainer from '@/components/layout/PageContainer';
import ImageViewer from '@/components/ui/ImageViewer';
import { checkProjectCompletionReadiness } from '@/utils/projectValidation';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import StatisticsCards from '@/components/ui/StatisticsCards';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  name: string;
  description: string;
  orderNumber?: string | null;
  status: string;
  color?: string;
  pattern?: string;
  imageUrl?: string | null;
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
      taskMachines?: Array<{
        machine: {
          id: string;
          name: string;
        };
      }>;
      taskOperators?: Array<{
        operator: {
          id: string;
          name: string;
        };
      }>;
    }>;
  }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDelete = () => {
    showConfirmDialog({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: performDelete,
    });
  };

  const performDelete = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Project deleted successfully');
        router.push('/projects');
      } else {
        const errorMessage = await extractErrorMessage(response, 'Failed to delete project');
        logger.apiError('Delete project', `/api/projects/${params.id}`, errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error('Error deleting project', error);
      toast.error(getErrorMessage(error, 'Error deleting project'));
    }
  };

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

  // Using centralized getStatusVariant from utils/statusStyles

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

  // Calculate statistics
  const totalTasks = project.items?.reduce((total, item) => total + (item.tasks?.length || 0), 0) || 0;
  const completedTasks =
    project.items?.reduce(
      (total, item) => total + (item.tasks?.filter((t) => t.status === 'COMPLETED').length || 0),
      0,
    ) || 0;

  const totalItems = project.items?.length || 0;
  const completedItems = project.items?.filter((item) => item.status === 'COMPLETED').length || 0;

  // Get unique machines and operators
  const uniqueMachines = project.items
    ? Array.from(
        new Map(
          project.items
            .flatMap((item) => item.tasks || [])
            .flatMap((task) => task.taskMachines || [])
            .map((tm) => [tm.machine.id, tm.machine.name]),
        ).entries(),
      ).map(([id, name]) => ({ id, name }))
    : [];

  const uniqueOperators = project.items
    ? Array.from(
        new Map(
          project.items
            .flatMap((item) => item.tasks || [])
            .flatMap((task) => task.taskOperators || [])
            .map((to) => [to.operator.id, to.operator.name]),
        ).entries(),
      ).map(([id, name]) => ({ id, name }))
    : [];

  const statisticsCards = [
    {
      label: 'Items',
      value: `${completedItems}/${totalItems}`,
      color: 'blue' as const,
    },
    {
      label: 'Tasks',
      value: `${completedTasks}/${totalTasks}`,
      color: 'green' as const,
    },
    {
      label: 'Machines Used',
      value: uniqueMachines.length > 0 ? uniqueMachines.map((m) => m.name).join(', ') : '0',
      color: 'purple' as const,
    },
    {
      label: 'Operators Assigned',
      value: uniqueOperators.length > 0 ? uniqueOperators.map((o) => o.name).join(', ') : '0',
      color: 'orange' as const,
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
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
              Delete
            </button>
          </div>
        ),
      }}
      variant="detail"
      breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: project.name }]}>
      {/* Created and Updated Info */}
      <div className="mb-4 flex items-center space-x-6 text-sm text-gray-500">
        {project.orderNumber && <span className="font-medium text-gray-700">Order #: {project.orderNumber}</span>}
        <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
        <span>Last Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
      </div>

      {/* Image and Statistics Row */}
      <div className="mb-6 flex items-start gap-6">
        {/* Project Image */}
        {project.imageUrl && (
          <div className="flex-shrink-0">
            <ImageViewer
              imageUrl={project.imageUrl}
              alt={project.name}
              size="extraLarge"
            />
          </div>
        )}

        {/* Statistics Cards */}
        <div className="flex-1">
          <StatisticsCards
            stats={statisticsCards}
            loading={loading}
            showWhenEmpty={true}
            columns={project.imageUrl ? 2 : 5}
          />
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
                        {item.tasks.filter((t) => !t.taskOperators || t.taskOperators.length === 0).length > 0 && (
                          <div className="flex items-center text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                            <span className="mr-1">⚠️</span>
                            {item.tasks.filter((t) => !t.taskOperators || t.taskOperators.length === 0).length} task(s)
                            without operator assigned
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
