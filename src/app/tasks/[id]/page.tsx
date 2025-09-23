'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDateTimeGMTMinus5 } from '@/utils/timezone';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  durationMin: number;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  machine?: {
    id: string;
    name: string;
  };
  operator?: {
    id: string;
    name: string;
  };
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'LOW':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
          <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
          <div className="mt-2 flex items-center space-x-4">
            <StatusBadge
              status={task.status}
              variant={getStatusVariant(task.status)}
            />
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                task.priority,
              )}`}>
              {task.priority} Priority
            </span>
            <span className="text-gray-500">{task.durationMin} minutes</span>
          </div>
        </div>
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
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                    task.priority,
                  )}`}>
                  {task.priority}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="mt-1 text-sm text-gray-900">{task.durationMin} minutes</dd>
            </div>
            {task.scheduledAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Scheduled At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(() => {
                    const { date, time } = formatDateTimeGMTMinus5(new Date(task.scheduledAt));
                    return `${date} ${time}`;
                  })()}
                </dd>
              </div>
            )}
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
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Project</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.project ? (
                  <Link
                    href={`/projects/${task.project.id}`}
                    className="text-blue-600 hover:text-blue-800">
                    {task.project.name}
                  </Link>
                ) : (
                  'No project assigned'
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
    </div>
  );
}
