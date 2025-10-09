'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import { OperatorColorIndicator } from '@/components/ui/ColorIndicator';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
import { getStatusVariant } from '@/utils/statusStyles';
import { logger } from '@/utils/logger';
import { extractErrorMessage, getErrorMessage } from '@/utils/errorHandling';

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
  machine?: {
    id: string;
    name: string;
  };
  machines?: { id: string; name: string }[];
  operators?: { id: string; name: string }[];
  timeSlots?: { id: string; startDateTime: string; endDateTime?: string | null; durationMin: number }[];
}

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
  tasks?: Task[];
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

    // start fetch
    fetchOperator();
  }, [params.id]);

  // Using centralized getStatusVariant from utils/statusStyles

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
        const errorMessage = await extractErrorMessage(response, 'Failed to update operator status');
        logger.error('Failed to update operator status:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error('Error updating operator status', error);
      toast.error(getErrorMessage(error, 'Error updating operator status'));
    }
  };

  const handleDelete = () => {
    showConfirmDialog({
      title: 'Delete Operator',
      message: 'Are you sure you want to delete this operator? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: performDelete,
    });
  };

  const performDelete = async () => {
    try {
      const response = await fetch(`/api/operators/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Operator deleted successfully');
        router.push('/operators');
      } else {
        const errorMessage = await extractErrorMessage(response, 'Failed to delete operator');
        logger.error('Failed to delete operator:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error('Error deleting operator', error);
      toast.error(getErrorMessage(error, 'Error deleting operator'));
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
    <PageContainer
      variant="detail"
      header={{
        title: (
          <div className="flex items-center space-x-3">
            <span>{operator.name}</span>
            <OperatorColorIndicator
              operator={{
                id: operator.id,
                color: operator.color || '#000000',
                pattern: operator.pattern || 'solid',
              }}
              size="lg"
            />
          </div>
        ),
        description: (
          <div className="flex items-center space-x-4 mt-2">
            <StatusBadge
              status={operator.status ? operator.status.replace(/_/g, ' ') : 'Unknown'}
              variant={getStatusVariant(operator.status)}
            />
            <span className="text-gray-500">
              {operator.shift ? operator.shift.charAt(0) + operator.shift.slice(1).toLowerCase() : 'Unknown'} Shift
            </span>
            <span className="text-gray-500">{operator.email}</span>
          </div>
        ),
        actions: (
          <div className="flex space-x-3">
            <Link
              href={`/operators/${operator.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Edit Operator
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Delete
            </button>
          </div>
        ),
      }}
      breadcrumbs={[{ label: 'Operators', href: '/operators' }, { label: operator.name }]}>
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
              href={`/tasks/new?operator=${operator.id}&returnUrl=/operators/${operator.id}`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Add Task
            </Link>
          </div>
        </div>
        <div className="px-6 py-4">
          {operator.tasks && operator.tasks.length > 0 ? (
            <div className="space-y-3">
              {operator.tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/tasks/${task.id}`)}>
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,480px)_auto_min-content] items-start md:items-center gap-4">
                    <div className="col-start-1 md:col-start-1 max-w-full md:max-w-[480px] pr-0 md:pr-4 break-words">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">{task.title}</h3>

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

                      {/* Machines (multiple) */}
                      {task.machines && task.machines.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Machine(s):{' '}
                          {task.machines.map((m, idx) => (
                            <span
                              key={m.id}
                              className="inline">
                              <Link
                                href={`/machines/${m.id}`}
                                className="text-blue-600 hover:text-blue-800"
                                onClick={(e) => e.stopPropagation()}>
                                {m.name}
                              </Link>
                              {idx < task.machines!.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </p>
                      )}

                      {/* Other assigned operators */}
                      {task.operators && task.operators.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Assigned:{' '}
                          {task.operators.map((op, idx) => (
                            <span
                              key={op.id}
                              className="inline">
                              <Link
                                href={`/operators/${op.id}`}
                                className="text-blue-600 hover:text-blue-800"
                                onClick={(e) => e.stopPropagation()}>
                                {op.name}
                              </Link>
                              {idx < task.operators!.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>

                    <div className="col-start-2 md:col-start-2 justify-self-center w-full md:max-w-[520px] min-h-[72px] flex items-center">
                      {task.timeSlots && task.timeSlots.length > 0 ? (
                        <div className="mt-2 flex flex-col justify-center space-y-3 w-full md:w-auto">
                          {task.timeSlots
                            .slice()
                            .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
                            .map((slot, index) => {
                              const startDate = new Date(slot.startDateTime);
                              const endDate = slot.endDateTime
                                ? new Date(slot.endDateTime)
                                : new Date(startDate.getTime() + slot.durationMin * 60 * 1000);
                              const startDateStr = startDate.toLocaleDateString();
                              const startTime = startDate.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              });
                              const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                              return (
                                <div
                                  key={slot.id}
                                  className="p-3 border rounded-lg border-gray-200 bg-white w-full md:w-[260px] lg:w-[300px] text-sm sm:text-base">
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
                      ) : null}
                    </div>

                    {/* right column intentionally left minimal (status + priority) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:justify-end">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={task.status}
                          variant={getStatusVariant(task.status)}
                        />
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs sm:text-sm font-medium rounded-full ${
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
            <div className="text-center py-8 text-gray-500">No tasks currently assigned to this operator.</div>
          )}
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
    </PageContainer>
  );
}
