'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OperatorColorIndicator } from '@/components/ui/ColorIndicator';
import StatusBadge from '@/components/ui/StatusBadge';
import { logger } from '@/utils/logger';

interface Operator {
  id: string;
  name: string;
  email: string;
  skills: string[];
  status: string;
  shift: string;
  color?: string | null;
  pattern?: string | null;
  availability: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export default function OperatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOperator = async () => {
      try {
        const response = await fetch(`/api/operators/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch operator');
        }
        const operatorData = await response.json();
        setOperator(operatorData);
        setLoading(false);
      } catch (error) {
        logger.error('Error fetching operator,', error);
        setLoading(false);
      }
    };

    fetchOperator();
  }, [params.id]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ON_LEAVE':
        return 'warning';
      case 'INACTIVE':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatSkills = (skills: string[]) => {
    return skills.map((skill) => skill.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/operators/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...operator,
          status: newStatus,
        }),
      });

      if (response.ok && operator) {
        setOperator({ ...operator, status: newStatus });
      } else {
        const errorData = await response.json();
        logger.error('Failed to update operator status,', errorData.error);
        alert('Failed to update operator status: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      logger.error('Error updating operator status,', error);
      alert('Error updating operator status. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this operator?')) {
      try {
        const response = await fetch(`/api/operators/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          router.push('/operators');
        } else {
          const errorData = await response.json();
          logger.error('Failed to delete operator,', errorData.error);
          alert('Failed to delete operator: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        logger.error('Error deleting operator,', error);
        alert('Error deleting operator. Please try again.');
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

  if (!operator) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Operator not found</div>
        <Link
          href="/operators"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Operators
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
                  href="/operators"
                  className="text-gray-500 hover:text-gray-700">
                  Operators
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{operator.name}</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <span>{operator.name}</span>
            <OperatorColorIndicator
              operator={{
                id: operator.id,
                color: operator.color || '#000000',
                pattern: operator.pattern || 'solid',
              }}
              size="lg"
            />
          </h1>
          <div className="mt-2 flex items-center space-x-4">
            <StatusBadge
              status={operator.status ? operator.status.replace(/_/g, ' ') : 'Unknown'}
              variant={getStatusVariant(operator.status)}
            />
            <span className="text-gray-500">
              {operator.shift ? operator.shift.charAt(0) + operator.shift.slice(1).toLowerCase() : 'Unknown'} Shift
            </span>
            <span className="text-gray-500">{operator.email}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/operators/${operator.id}/edit`}
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
          {['ACTIVE', 'ON_LEAVE', 'INACTIVE'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={operator.status === status}
              className={`px-4 py-2 text-sm font-medium rounded-md border ${
                operator.status === status
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}>
              Mark as {status ? status.replace(/_/g, ' ') : 'Unknown'}
            </button>
          ))}
        </div>
      </div>

      {/* Operator Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Operator Details</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{operator.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{operator.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Current Status</dt>
              <dd className="mt-1">
                <StatusBadge
                  status={operator.status ? operator.status.replace(/_/g, ' ') : 'Unknown'}
                  variant={getStatusVariant(operator.status)}
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Shift</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {operator.shift ? operator.shift.charAt(0) + operator.shift.slice(1).toLowerCase() : 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Visual Identifier</dt>
              <dd className="mt-1 flex items-center space-x-3">
                <OperatorColorIndicator
                  operator={{
                    id: operator.id,
                    color: operator.color || '#000000',
                    pattern: operator.pattern || 'solid',
                  }}
                  size="md"
                />
                <span className="text-sm text-gray-600">
                  Color: {operator.color || '#000000'} • Pattern: {operator.pattern || 'solid'}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Skills</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-2">
                  {formatSkills(operator.skills).map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      {skill}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Joined</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(operator.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(operator.updatedAt).toLocaleDateString()}</dd>
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
              href={`/tasks/new?operator=${operator.id}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Assign Task
            </Link>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="text-center py-8 text-gray-500">
            {operator.status === 'ACTIVE'
              ? 'Task assignments will be displayed here when integrated with the task system.'
              : 'No tasks can be assigned while operator is not active.'}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Tasks Completed</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-sm">⏱️</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Hours Worked</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-sm">⭐</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Efficiency Rating</div>
              <div className="text-2xl font-bold text-gray-900">-</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
