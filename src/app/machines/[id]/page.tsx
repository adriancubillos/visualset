'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/utils/logger';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import { MachineColorIndicator } from '@/components/ui/ColorIndicator';
import StatusBadge from '@/components/ui/StatusBadge';

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'IN_USE':
        return 'info';
      case 'MAINTENANCE':
        return 'warning';
      case 'OFFLINE':
        return 'error';
      default:
        return 'default';
    }
  };

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
        logger.apiError('Update machine status', `/api/machines/${machine?.id}`, 'Failed to update');
      }
    } catch (error) {
      logger.error('Error updating machine status', error);
    }
  };

  const handleDelete = async () => {
    if (!machine) return;
    
    if (confirm('Are you sure you want to delete this machine?')) {
      try {
        // TODO: Replace with actual API call
        const response = await fetch(`/api/machines/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          router.push('/machines');
        } else {
          logger.apiError('Delete machine', `/api/machines/${machine.id}`, 'Failed to delete');
        }
      } catch (error) {
        logger.error('Error deleting machine', error);
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
      variant="detail">
      {/* Breadcrumb Navigation */}
      <nav
        className="flex mb-6"
        aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link
              href="/machines"
              className="text-gray-500 hover:text-gray-700">
              Machines
            </Link>
          </li>
          <li>
            <span className="text-gray-400">/</span>
          </li>
          <li>
            <span className="text-gray-900 font-medium">{machine.name}</span>
          </li>
        </ol>
      </nav>

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
              href={`/tasks/new?machine=${machine.id}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Assign Task
            </Link>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="text-center py-8 text-gray-500">
            {machine.status === 'IN_USE'
              ? 'Task information will be displayed here when integrated with the task system.'
              : 'No tasks currently assigned to this machine.'}
          </div>
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
