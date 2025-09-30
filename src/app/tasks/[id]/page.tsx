'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDateTimeGMTMinus5 } from '@/utils/timezone';

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
    isPrimary: boolean;
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
        console.error('Error fetching task:', error);
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
      } else {
        console.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
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
          console.error('Failed to delete task');
        }
      } catch (error) {
        console.error('Error deleting task:', error);
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
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={task.status === status}
              className={`px-4 py-2 text-sm font-medium rounded-md border ${
                task.status === status
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}>
              Mark as {status.replace('_', ' ')}
            </button>
          ))}
        </div>
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
                  const { date: startDateStr, time: startTime } = formatDateTimeGMTMinus5(startDate);
                  const { time: endTime } = formatDateTimeGMTMinus5(endDate);

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 border rounded-lg ${
                        slot.isPrimary ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">Slot {index + 1}</span>
                          {slot.isPrimary && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Primary
                            </span>
                          )}
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
