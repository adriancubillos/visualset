'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import TableActions from '@/components/ui/TableActions';

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
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/items/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setItem(data);
        } else {
          console.error('Failed to fetch item');
        }
      } catch (error) {
        console.error('Error fetching item:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const handleTaskDelete = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
        });

        if (response.ok && item) {
          const updatedTasks = item.tasks.filter((task) => task.id !== taskId);
          setItem({ ...item, tasks: updatedTasks });
        } else {
          console.error('Failed to delete task');
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
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
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            value === 'HIGH'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <nav
            className="flex mb-4"
            aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link
                  href="/items"
                  className="text-blue-600 hover:text-blue-800">
                  Items
                </Link>
              </li>
              <li className="text-gray-500">/</li>
              <li className="text-gray-900 font-medium">{item.name}</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
          {item.description && <p className="mt-2 text-gray-600">{item.description}</p>}
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/items/${item.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Edit Item
          </Link>
        </div>
      </div>

      {/* Item Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks</h3>
          <div className="text-2xl font-bold text-blue-600">{item.tasks.length}</div>
          <p className="text-sm text-gray-500">
            {item.tasks.filter((task) => task.status === 'COMPLETED').length} completed
          </p>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
          <Link
            href={`/tasks/new?itemId=${item.id}`}
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
    </div>
  );
}
