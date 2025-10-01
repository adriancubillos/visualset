'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import StatusBadge from '@/components/ui/StatusBadge';
import { logger } from '@/utils/logger';
import TaskStatusQuickActions from '@/components/task/TaskStatusQuickActions';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  quantity: number;
  completed_quantity: number;
  createdAt: string;
  updatedAt: string;
  item?: {
    id: string;
    name: string;
    project?: {
      id: string;
      name: string;
    };
  };
  machine?: {
    id: string;
    name: string;
  };
  operator?: {
    id: string;
    name: string;
  };
  timeSlots: {
    id: string;
    startDateTime: string;
    endDateTime: string | null;
    durationMin: number;
  }[];
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetch(`/api/tasks/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch task');
        }
        const taskData = await response.json();
        setTask(taskData);
        setLoading(false);
      } catch (error) {
        logger.error('Error fetching task,', error);
        setLoading(false);
      }
    };

    fetchTask();
  }, [params.id]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'SCHEDULED':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'BLOCKED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok && task) {
        setTask({ ...task, status: newStatus });
        toast.success('Task status updated successfully');
      } else {
        logger.error('Failed to update task status');
        toast.error('Failed to update task status');
      }
    } catch (error) {
      logger.error('Error updating task status,', error);
      toast.error('Error updating task status. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`/api/tasks/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          router.push('/tasks');
        } else {
          logger.error('Failed to delete task');
        }
      } catch (error) {
        logger.error('Error deleting task,', error);
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

  if (!task) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Task not found</div>
        <Link
          href="/tasks"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <PageContainer
      header={{
        title: task.title,
        actions: (
          <div className="flex space-x-3">
            <Link
              href={`/tasks/${task.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Delete
            </button>
          </div>
        ),
      }}
      variant="detail">
      {/* Breadcrumb Navigation */}
      <nav
        className="flex mb-6"
        aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link
              href="/tasks"
              className="text-gray-500 hover:text-gray-700">
              Tasks
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>
          <li>
            <span className="text-gray-900 font-medium">{task.title}</span>
          </li>
        </ol>
      </nav>

      {/* Status and Progress Info */}
      <div className="mb-6 flex items-center space-x-4">
        <StatusBadge
          status={task.status}
          variant={getStatusVariant(task.status)}
        />
        <span className="text-gray-500">
          {task.completed_quantity}/{task.quantity} completed
        </span>
        <span className="text-gray-500">
          {task.timeSlots.reduce((total, slot) => total + slot.durationMin, 0)} minutes total
        </span>
      </div>

      {/* Quick Status Actions */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <TaskStatusQuickActions
          currentStatus={task.status}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Task Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Task Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{task.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <StatusBadge
                  status={task.status}
                  variant={getStatusVariant(task.status)}
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Quantity Progress</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.completed_quantity} of {task.quantity} completed
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((task.completed_quantity / task.quantity) * 100, 100)}%` }}></div>
                </div>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Duration</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.timeSlots.reduce((total, slot) => total + slot.durationMin, 0)} minutes
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(task.createdAt).toLocaleDateString()}</dd>
            </div>
            {task.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{task.description}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Assignments */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Project</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.item?.project ? (
                  <Link
                    href={`/projects/${task.item.project.id}`}
                    className="text-blue-600 hover:text-blue-800">
                    {task.item.project.name}
                  </Link>
                ) : (
                  'No project assigned'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Item</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.item ? (
                  <Link
                    href={`/items/${task.item.id}`}
                    className="text-blue-600 hover:text-blue-800">
                    {task.item.name}
                  </Link>
                ) : (
                  'No item assigned'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Machine</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.machine ? (
                  <Link
                    href={`/machines/${task.machine.id}`}
                    className="text-blue-600 hover:text-blue-800">
                    {task.machine.name}
                  </Link>
                ) : (
                  'No machine required'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Operator</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.operator ? (
                  <Link
                    href={`/operators/${task.operator.id}`}
                    className="text-blue-600 hover:text-blue-800">
                    {task.operator.name}
                  </Link>
                ) : (
                  'Unassigned'
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Time Slots */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Time Slots</h2>
        </div>
        <div className="px-6 py-4">
          {task.timeSlots && task.timeSlots.length > 0 ? (
            <div className="space-y-4">
              {task.timeSlots
                .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
                .map((slot, index) => {
                  const startDate = new Date(slot.startDateTime);
                  const endDate = slot.endDateTime
                    ? new Date(slot.endDateTime)
                    : new Date(startDate.getTime() + slot.durationMin * 60 * 1000);
                  const { date: startDateStr, time: startTime } = {
                    date: startDate.toLocaleDateString(),
                    time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  };
                  const { time: endTime } = {
                    time: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  };

                  return (
                    <div
                      key={slot.id}
                      className="p-4 border rounded-lg border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">Slot {index + 1}</span>
                        </div>
                        <div className="text-sm text-gray-500">{slot.durationMin} minutes</div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <span>📅 {startDateStr}</span>
                          <span>
                            🕐 {startTime} - {endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No time slots scheduled</p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
