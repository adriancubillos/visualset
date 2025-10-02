'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import TableActions from '@/components/ui/TableActions';
import ImageViewer from '@/components/ui/ImageViewer';
import PageContainer from '@/components/layout/PageContainer';
import { checkItemCompletionReadiness } from '@/utils/itemValidation';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import { logger } from '@/utils/logger';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  estimatedHours: number;
  actualHours: number;
  startDate: string;
  endDate: string;
  machine: {
    id: string;
    name: string;
  } | null;
  operator: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Item {
  id: string;
  name: string;
  description: string;
  status: string;
  measure?: string;
  imageUrl?: string | null;
  project: {
    id: string;
    name: string;
    description: string;
  };
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDelete = () => {
    showConfirmDialog({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: performDelete,
    });
  };

  const performDelete = async () => {
    try {
      const response = await fetch(`/api/items/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Item deleted successfully');
        // Navigate back to the project detail page
        router.push(`/projects/${item?.project.id}`);
      } else {
        const errorData = await response.json();
        logger.apiError('Delete item', `/api/items/${params.id}`, errorData.error);
        toast.error('Failed to delete item. \n ' + errorData.error);
      }
    } catch (error) {
      logger.error('Error deleting item', error);
      toast.error('An error occurred while deleting the item.');
    }
  };

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/items/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setItem(data);
        } else {
          logger.error('Failed to fetch item');
        }
      } catch (error) {
        logger.error('Error fetching item,', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const handleTaskDelete = (taskId: string) => {
    showConfirmDialog({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => performTaskDelete(taskId),
    });
  };

  const performTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok && item) {
        const updatedTasks = item.tasks.filter((task) => task.id !== taskId);
        setItem({ ...item, tasks: updatedTasks });
        toast.success('Task deleted successfully');
      } else {
        logger.error('Failed to delete task');
        toast.error('Failed to delete task');
      }
    } catch (error) {
      logger.error('Error deleting task,', error);
      toast.error('Error deleting task');
    }
  };

  const taskColumns = [
    {
      key: 'title' as keyof Task,
      header: 'Task',
      render: (value: string, task: Task) => (
        <div>
          <Link
            href={`/tasks/${task.id}`}
            className="font-medium text-blue-600 hover:text-blue-800">
            {task.title}
          </Link>
          {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
        </div>
      ),
    },
    {
      key: 'status' as keyof Task,
      header: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: 'priority' as keyof Task,
      header: 'Priority',
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${value === 'HIGH'
            ? 'bg-red-100 text-red-800'
            : value === 'MEDIUM'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
            }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'machine' as keyof Task,
      header: 'Machine',
      render: (value: Task['machine']) => (
        <span className="text-sm text-gray-600">
          {value ? (
            <Link
              href={`/machines/${value.id}`}
              className="text-blue-600 hover:text-blue-800">
              {value.name}
            </Link>
          ) : (
            'Not assigned'
          )}
        </span>
      ),
    },
    {
      key: 'operator' as keyof Task,
      header: 'Operator',
      render: (value: Task['operator']) => (
        <span className="text-sm text-gray-600">
          {value ? (
            <Link
              href={`/operators/${value.id}`}
              className="text-blue-600 hover:text-blue-800">
              {value.name}
            </Link>
          ) : (
            'Not assigned'
          )}
        </span>
      ),
    },
    {
      key: 'estimatedHours' as keyof Task,
      header: 'Hours',
      render: (value: number, task: Task) => (
        <span className="text-sm text-gray-600">
          {task.actualHours || 0} / {value || 0}h
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Item not found</h2>
        <p className="mt-2 text-gray-600">The item you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/items"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          Back to Items
        </Link>
      </div>
    );
  }

  return (
    <PageContainer
      variant="detail"
      header={{
        title: item.name,
        description: item.description,
        actions: (
          <div className="flex space-x-3">
            <Link
              href={`/items/${item.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Edit Item
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Delete
            </button>
          </div>
        ),
      }}
      breadcrumbs={[
        { label: 'Items', href: '/items' },
        { label: item.name },
      ]}>

      {/* Created and Updated Info */}
      <div className="mb-4 flex items-center space-x-6 text-sm text-gray-500">
        <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
        <span>Last Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
        {item.measure && <span>Measurements: {item.measure}</span>}
      </div>

      {/* Image and Info Row */}
      <div className="mb-6 flex items-start gap-6">
        {/* Item Image */}
        {item.imageUrl && (
          <div className="flex-shrink-0">
            <ImageViewer
              imageUrl={item.imageUrl}
              alt={item.name}
              size="extraLarge"
            />
          </div>
        )}

        {/* Item Info Cards */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project</h3>
          <Link
            href={`/projects/${item.project.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium">
            {item.project.name}
          </Link>
          {item.project.description && <p className="text-sm text-gray-500 mt-2">{item.project.description}</p>}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
          <StatusBadge
            status={item.status}
            size="lg"
          />

          {/* Completion Readiness Indicator */}
          {(() => {
            const completionStatus = checkItemCompletionReadiness(item.tasks);

            if (item.status === 'COMPLETED') {
              return (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 text-green-400 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-800">Item Completed</span>
                  </div>
                </div>
              );
            }

            if (completionStatus.canComplete) {
              return (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 text-green-400 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-800">Ready for completion</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">All tasks completed</p>
                </div>
              );
            }

            if (completionStatus.totalTasks === 0) {
              return (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 text-yellow-400 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-yellow-800">No tasks</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">Add tasks to track progress</p>
                </div>
              );
            }

            return (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-red-400 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-red-800">Cannot complete</span>
                </div>
                <p className="text-xs text-red-700 mt-1">
                  {completionStatus.incompleteTasks.length} task
                  {completionStatus.incompleteTasks.length !== 1 ? 's' : ''} remaining
                </p>
              </div>
            );
          })()}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks</h3>
          <div className="text-2xl font-bold text-blue-600">{item.tasks.length}</div>
          {(() => {
            const completionStatus = checkItemCompletionReadiness(item.tasks);
            return (
              <>
                <p className="text-sm text-gray-500">{completionStatus.completedTasks} completed</p>
                {completionStatus.totalTasks > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{completionStatus.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${completionStatus.completionPercentage === 100
                          ? 'bg-green-500'
                          : completionStatus.completionPercentage > 50
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                          }`}
                        style={{ width: `${completionStatus.completionPercentage}%` }}></div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
          <Link
            href={`/tasks/new?project=${item.project.id}&item=${item.id}&returnUrl=/items/${item.id}`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Add Task
          </Link>
        </div>

        {item.tasks.length > 0 ? (
          <DataTable
            data={item.tasks}
            columns={taskColumns}
            actions={(task: Task) => (
              <TableActions
                itemId={task.id}
                itemName={task.title}
                editPath={`/tasks/${task.id}/edit`}
                onDelete={handleTaskDelete}
              />
            )}
          />
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No tasks yet.</p>
            <Link
              href={`/tasks/new?itemId=${item.id}`}
              className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-800">
              Create the first task
            </Link>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Created:</span>
            <span className="ml-2 text-gray-600">{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Last Updated:</span>
            <span className="ml-2 text-gray-600">{new Date(item.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
