'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/utils/logger';
import { extractErrorMessage, getErrorMessage } from '@/utils/errorHandling';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PageContainer from '@/components/layout/PageContainer';
import { MachineColorIndicator } from '@/components/ui/ColorIndicator';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
import { getStatusVariant } from '@/utils/statusStyles';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  item?: {
    id: string;
    name: string;
    project?: {
      id: string;
      name: string;
    };
  };
  operator?: {
    id: string;
    name: string;
  };
}

interface Machine {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  color?: string | null;
  pattern?: string | null;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMachine = async () => {
      try {
        const response = await fetch(`/api/machines/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch machine');
        }
        const machineData = await response.json();
        setMachine(machineData);
        setLoading(false);
      } catch (error) {
        logger.error('Error fetching machine', error);
        setLoading(false);
      }
    };

    fetchMachine();
  }, [params.id]);

  // Using centralized getStatusVariant from utils/statusStyles

  const formatMachineType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/machines/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok && machine) {
        setMachine({ ...machine, status: newStatus });
      } else {
        const errorMessage = await extractErrorMessage(response, 'Failed to update machine status');
        logger.apiError('Update machine status', `/api/machines/${machine?.id}`, errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error('Error updating machine status', error);
      toast.error(getErrorMessage(error, 'Error updating machine status'));
    }
  };

  const handleDelete = () => {
    showConfirmDialog({
      title: 'Delete Machine',
      message: 'Are you sure you want to delete this machine? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: performDelete,
    });
  };

  const performDelete = async () => {
    try {
      const response = await fetch(`/api/machines/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Machine deleted successfully');
        router.push('/machines');
      } else {
        const errorMessage = await extractErrorMessage(response, 'Failed to delete machine');
        logger.error('Failed to delete machine:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error('Error deleting machine', error);
      toast.error(getErrorMessage(error, 'Error deleting machine'));
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

  if (!machine) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Machine not found</div>
        <Link
          href="/machines"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Machines
        </Link>
      </div>
    );
  }

  return (
    <PageContainer
      header={{
        title: machine.name,
        actions: (
          <div className="flex space-x-3">
            <Link
              href={`/machines/${machine.id}/edit`}
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
      variant="detail"
      breadcrumbs={[{ label: 'Machines', href: '/machines' }, { label: machine.name }]}>
      {/* Status and Info */}
      <div className="mb-6 flex items-center space-x-4">
        <StatusBadge
          status={machine.status ? machine.status.replace(/_/g, ' ') : 'Unknown'}
          variant={getStatusVariant(machine.status)}
        />
        <MachineColorIndicator
          machine={machine}
          size="md"
        />
        <span className="text-gray-500">{formatMachineType(machine.type)}</span>
        <span className="text-gray-500">{machine.location}</span>
      </div>

      {/* Quick Status Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OFFLINE'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={machine.status === status}
              className={`px-4 py-2 text-sm font-medium rounded-md border ${
                machine.status === status
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}>
              Mark as {status ? status.replace(/_/g, ' ') : 'Unknown'}
            </button>
          ))}
        </div>
      </div>

      {/* Machine Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Machine Details</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Machine Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{machine.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatMachineType(machine.type)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Current Status</dt>
              <dd className="mt-1">
                <StatusBadge
                  status={machine.status ? machine.status.replace(/_/g, ' ') : 'Unknown'}
                  variant={getStatusVariant(machine.status)}
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900">{machine.location}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Added</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(machine.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(machine.updatedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Current Tasks */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Current Tasks</h2>
            <Link
              href={`/tasks/new?machine=${machine.id}&returnUrl=/machines/${machine.id}`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Add Task
            </Link>
          </div>
        </div>
        <div className="px-6 py-4">
          {machine.tasks && machine.tasks.length > 0 ? (
            <div className="space-y-3">
              {machine.tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/tasks/${task.id}`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      {task.item && (
                        <p className="text-sm text-gray-500 mt-1">
                          Item:{' '}
                          <Link
                            href={`/items/${task.item.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}>
                            {task.item.name}
                          </Link>
                          {task.item.project && (
                            <span>
                              {' '}
                              • Project:{' '}
                              <Link
                                href={`/projects/${task.item.project.id}`}
                                className="text-blue-600 hover:text-blue-800"
                                onClick={(e) => e.stopPropagation()}>
                                {task.item.project.name}
                              </Link>
                            </span>
                          )}
                        </p>
                      )}
                      {task.operator && (
                        <p className="text-sm text-gray-500 mt-1">
                          Operator:{' '}
                          <Link
                            href={`/operators/${task.operator.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}>
                            {task.operator.name}
                          </Link>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={task.status.replace(/_/g, ' ')}
                        variant={
                          task.status === 'COMPLETED'
                            ? 'success'
                            : task.status === 'IN_PROGRESS'
                            ? 'info'
                            : task.status === 'SCHEDULED'
                            ? 'info'
                            : 'warning'
                        }
                      />
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          task.priority === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No tasks currently assigned to this machine.</div>
          )}
        </div>
      </div>

      {/* Maintenance History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Maintenance History</h2>
        </div>
        <div className="px-6 py-4">
          <div className="text-center py-8 text-gray-500">
            Maintenance records will be displayed here when the maintenance tracking system is implemented.
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
