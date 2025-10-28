'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MultiSelect from '@/components/ui/MultiSelect';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DataTable from '@/components/ui/DataTable';
import TableActions from '@/components/ui/TableActions';
import ImageViewer from '@/components/ui/ImageViewer';
import PageContainer from '@/components/layout/PageContainer';
import { checkItemCompletionReadiness } from '@/utils/itemValidation';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import TaskTitleSelect from '@/components/forms/TaskTitleSelect';
import { logger } from '@/utils/logger';
import { updateTaskWithConfirm, sendTaskUpdate } from '@/utils/taskApi';
import { getStatusVariant, getVariantClasses } from '@/utils/statusStyles';
import { extractErrorMessage, getErrorMessage } from '@/utils/errorHandling';
import { Column } from '@/types/table';
import Select from '@/components/ui/Select';
import { TASK_STATUS, ITEM_STATUS } from '@/config/workshop-properties';

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
  quantity?: number;
  completed_quantity?: number;
  machines: {
    id: string;
    name: string;
  }[];
  operators: {
    id: string;
    name: string;
  }[];
  timeSlots: {
    id: string;
    startDateTime: string;
    endDateTime: string | null;
    durationMin: number;
  }[];
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

// Helper function to get base columns
const getBaseColumns = (
  machines: { id: string; name: string }[],
  operators: { id: string; name: string }[],
  handleTaskUpdate: (taskId: string, field: string, value: string | null) => Promise<void>,
  handleTaskMachineUpdate: (taskId: string, machineIds: string[]) => Promise<void>,
  handleTaskOperatorUpdate: (taskId: string, operatorIds: string[]) => Promise<void>,
): Column<Task>[] => [
  {
    key: 'title' as keyof Task,
    header: 'Task',
    align: 'left' as const,
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
    render: (value: string, task: Task) => {
      const variant = getStatusVariant(value);
      const classes = getVariantClasses(variant, false);

      return (
        <div className="w-40">
          <Select
            value={value}
            onChange={(newStatus) => handleTaskUpdate(task.id, 'status', newStatus)}
            options={TASK_STATUS.map((s) => ({ id: s.value, name: s.label }))}
            placeholder="Select status"
            buttonClassName={`font-medium cursor-pointer ${classes}`}
          />
        </div>
      );
    },
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
    key: 'machines' as keyof Task,
    header: 'Machines',
    render: (value: Task['machines'], task: Task) => (
      <div className="w-64">
        <MultiSelect
          value={value?.map((m) => m.id) || []}
          onChange={(machineIds) => handleTaskMachineUpdate(task.id, machineIds)}
          options={machines}
          placeholder="-- None --"
          maxDisplayItems={2}
        />
      </div>
    ),
  },
  {
    key: 'operators' as keyof Task,
    header: 'Operators',
    render: (value: Task['operators'], task: Task) => (
      <div className="w-64">
        <MultiSelect
          value={value?.map((op) => op.id) || []}
          onChange={(operatorIds) => handleTaskOperatorUpdate(task.id, operatorIds)}
          options={operators}
          placeholder="-- None --"
          maxDisplayItems={2}
        />
      </div>
    ),
  },
  {
    key: 'timeSlots' as keyof Task,
    header: 'Scheduled',
    render: (value: Task['timeSlots']) => {
      if (!value || value.length === 0) {
        return <span className="text-sm text-gray-400 italic">Not scheduled</span>;
      }

      // Show all time slots in a compact format
      return (
        <div className="space-y-1.5">
          {value.map((slot, index) => {
            const start = new Date(slot.startDateTime);
            const end = slot.endDateTime
              ? new Date(slot.endDateTime)
              : new Date(start.getTime() + slot.durationMin * 60000);

            return (
              <div
                key={slot.id || index}
                className="text-xs">
                <div className="font-medium text-gray-700">
                  {start.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </div>
                <div className="text-gray-600">
                  {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>
      );
    },
  },
];

// Helper function to get initial column order
const getInitialColumns = (baseColumns: Column<Task>[], itemId: string): Column<Task>[] => {
  const saved = localStorage.getItem(`item-${itemId}-columnOrder`);
  // Debug: saved data (previously logged)
  if (!saved) {
    return baseColumns;
  }

  try {
    const savedOrder: { key: string; id?: string }[] = JSON.parse(saved);

    const orderedColumns: Column<Task>[] = [];

    // First, add columns in saved order
    for (const savedCol of savedOrder) {
      const matchingColumn = baseColumns.find((col: Column<Task>) => (col.id || col.key) === savedCol.key);
      if (matchingColumn) {
        orderedColumns.push(matchingColumn);
      } else {
        console.warn('Could not find matching column for:', savedCol);
      }
    }

    // Then, add any new columns that weren't in the saved order
    for (const col of baseColumns) {
      if (!orderedColumns.find((orderedCol) => (orderedCol.id || orderedCol.key) === (col.id || col.key))) {
        orderedColumns.push(col);
      }
    }

    // Final ordered columns computed
    return orderedColumns;
  } catch (error) {
    console.error('Error parsing saved column order, using base columns:', error);
    return baseColumns;
  }
};

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState<{ id: string; name: string }[]>([]);
  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);
  const [columns, setColumns] = useState<Column<Task>[]>([]);
  const [showMultiTaskForm, setShowMultiTaskForm] = useState(false);
  const [multiTaskLoading, setMultiTaskLoading] = useState(false);

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
        const errorMessage = await extractErrorMessage(response, 'Failed to delete item');
        logger.apiError('Delete item', `/api/items/${params.id}`, errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error('Error deleting item', error);
      toast.error(getErrorMessage(error, 'Error deleting item'));
    }
  };

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/items/${params.id}`);
        if (response.ok) {
          const data = await response.json();

          // Restore saved task order from localStorage
          const savedOrder = localStorage.getItem(`item-${params.id}-task-order`);
          if (savedOrder) {
            try {
              const taskOrder: string[] = JSON.parse(savedOrder);
              const orderedTasks = [...data.tasks].sort((a, b) => {
                const indexA = taskOrder.indexOf(a.id);
                const indexB = taskOrder.indexOf(b.id);
                // If task not in saved order, put it at the end
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });
              data.tasks = orderedTasks;
            } catch (e) {
              logger.error('Error parsing saved task order', e);
            }
          }

          setItem(data);
        }
      } catch (error) {
        logger.error('Error fetching item', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMachinesAndOperators = async () => {
      try {
        logger.debug('Fetching machines and operators...');
        const [machinesRes, operatorsRes] = await Promise.all([fetch('/api/machines'), fetch('/api/operators')]);

        logger.debug('Machines response', { status: machinesRes.status, ok: machinesRes.ok });
        logger.debug('Operators response', { status: operatorsRes.status, ok: operatorsRes.ok });

        if (machinesRes.ok) {
          const machinesData = await machinesRes.json();
          logger.debug('Machines data', { count: machinesData.length });
          setMachines(machinesData.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })));
        } else {
          console.error('Failed to fetch machines:', machinesRes.status, machinesRes.statusText);
        }

        if (operatorsRes.ok) {
          const operatorsData = await operatorsRes.json();
          logger.debug('Operators data', { count: operatorsData.length });
          setOperators(operatorsData.map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })));
        } else {
          console.error('Failed to fetch operators:', operatorsRes.status, operatorsRes.statusText);
        }
      } catch (error) {
        console.error('Error fetching machines/operators:', error);
        logger.error('Error fetching machines/operators', error);
      }
    };

    fetchItem();
    fetchMachinesAndOperators();
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
        const errorMessage = await extractErrorMessage(response, 'Failed to delete task');
        logger.error('Failed to delete task:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error('Error deleting task:', error);
      toast.error(getErrorMessage(error, 'Error deleting task'));
    }
  };

  // Function to check and update item status based on task completion
  const checkAndUpdateItemStatus = useCallback(
    async (updatedItem: Item) => {
      try {
        const completionStatus = checkItemCompletionReadiness(updatedItem.tasks);
        let newItemStatus = updatedItem.status;

        // Auto-update item status based on task completion
        if (
          completionStatus.canComplete &&
          completionStatus.completedTasks === completionStatus.totalTasks &&
          updatedItem.status !== 'COMPLETED'
        ) {
          newItemStatus = 'COMPLETED';
        } else if (
          completionStatus.completedTasks > 0 &&
          completionStatus.completedTasks < completionStatus.totalTasks &&
          updatedItem.status === 'COMPLETED'
        ) {
          newItemStatus = 'ACTIVE'; // Revert from completed if some tasks become incomplete
        }

        // Update item status if it changed
        if (newItemStatus !== updatedItem.status) {
          const response = await fetch(`/api/items/${params.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newItemStatus }),
          });

          if (response.ok) {
            setItem({ ...updatedItem, status: newItemStatus });
            toast.success(`Item status updated to ${newItemStatus.toLowerCase().replace('_', ' ')}`);
          }
        }
      } catch (error) {
        logger.error('Error updating item status:', error);
      }
    },
    [params.id],
  );

  const handleTaskUpdate = useCallback(
    async (taskId: string, field: string, value: string | null) => {
      if (!item) return;

      try {
        // Prepare the update payload
        const updatePayload: { [key: string]: string | number | null } = { [field]: value };

        // Handle quantity tracking updates when status changes
        if (field === 'status') {
          const task = item.tasks.find((t) => t.id === taskId);
          if (task && typeof task.quantity === 'number' && typeof task.completed_quantity === 'number') {
            // If un-completing a completed task, confirm first
            if (task.status === 'COMPLETED' && value !== 'COMPLETED') {
              // Use shared helper to handle confirmation and update
              const result = await updateTaskWithConfirm(
                taskId,
                { ...updatePayload, completed_quantity: 0 },
                {
                  existingStatus: task.status,
                  newStatus: value as string | null,
                  method: 'PATCH',
                },
              );

              if (result.ok && result.data) {
                const updatedTaskData = result.data as Partial<Task>;
                const updatedTasks = item.tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        ...updatedTaskData,
                        machines: (updatedTaskData.machines as Task['machines']) || [],
                        operators: (updatedTaskData.operators as Task['operators']) || [],
                        timeSlots: (updatedTaskData.timeSlots as Task['timeSlots']) || [],
                      }
                    : t,
                );
                const updatedItem = { ...item, tasks: updatedTasks };
                setItem(updatedItem);
                if (field === 'status') {
                  await checkAndUpdateItemStatus(updatedItem);
                }
                toast.success('Task updated successfully');
              } else {
                const errorMessage = (result.error as string) || 'Failed to update task';
                toast.error(errorMessage);
              }
            }

            if (value === 'COMPLETED') {
              // When marking as completed, set completed_quantity to full quantity
              updatePayload.completed_quantity = task.quantity;
            } else {
              // When changing from completed to any other status, reset completed_quantity to 0
              updatePayload.completed_quantity = 0;
            }
          }
        }

        const result = await sendTaskUpdate(taskId, updatePayload, 'PATCH');

        if (result.ok && result.data) {
          const updatedTaskData = result.data as Partial<Task>;

          // If server omitted completed_quantity when status was set to COMPLETED, infer from quantity
          if (field === 'status' && value === 'COMPLETED' && updatedTaskData.completed_quantity === undefined) {
            const originalTask = item.tasks.find((t) => t.id === taskId);
            const qty = (updatedTaskData.quantity as number | undefined) ?? originalTask?.quantity ?? 0;
            updatedTaskData.completed_quantity = qty;
          }

          const updatedTasks = item.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...updatedTaskData,
                  // Ensure we preserve the complete structure from API
                  machines: (updatedTaskData.machines as Task['machines']) || [],
                  operators: (updatedTaskData.operators as Task['operators']) || [],
                  timeSlots: (updatedTaskData.timeSlots as Task['timeSlots']) || [],
                }
              : task,
          );

          // Update item state with new tasks
          const updatedItem = { ...item, tasks: updatedTasks };
          setItem(updatedItem);

          // If status was updated, check if item status should auto-update
          if (field === 'status') {
            await checkAndUpdateItemStatus(updatedItem);
          }

          toast.success('Task updated successfully');
        } else {
          const errorMessage = (result.error as string) || 'Failed to update task';
          toast.error(errorMessage);
        }
      } catch (error) {
        logger.error('Error updating task:', error);
        toast.error(getErrorMessage(error, 'Error updating task'));
      }
    },
    [item, checkAndUpdateItemStatus],
  );

  // Manual item status update function
  const handleItemStatusUpdate = useCallback(
    async (newStatus: string | null) => {
      if (!newStatus || !item) return;

      try {
        const response = await fetch(`/api/items/${params.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          setItem({ ...item, status: newStatus });
          toast.success('Item status updated successfully');
        } else {
          const errorMessage = await extractErrorMessage(response, 'Failed to update item status');
          toast.error(errorMessage);
        }
      } catch (error) {
        logger.error('Error updating item status:', error);
        toast.error(getErrorMessage(error, 'Error updating item status'));
      }
    },
    [item, params.id],
  );

  const handleTaskMachineUpdate = useCallback(
    async (taskId: string, machineIds: string[]) => {
      if (!item) return;

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ machineIds }),
        });

        if (response.ok) {
          const updatedTaskData = await response.json();
          const updatedTasks = item.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...updatedTaskData,
                  machines: updatedTaskData.machines || [],
                  operators: updatedTaskData.operators || [],
                  timeSlots: updatedTaskData.timeSlots || [],
                }
              : task,
          );
          setItem({ ...item, tasks: updatedTasks });
          toast.success('Machine assignments updated successfully');
        } else {
          const errorMessage = await extractErrorMessage(response, 'Failed to update machine assignments');
          toast.error(errorMessage);
        }
      } catch (error) {
        logger.error('Error updating machine assignments:', error);
        toast.error(getErrorMessage(error, 'Error updating machine assignments'));
      }
    },
    [item],
  );

  const handleTaskOperatorUpdate = useCallback(
    async (taskId: string, operatorIds: string[]) => {
      if (!item) return;

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ operatorIds }),
        });

        if (response.ok) {
          const updatedTaskData = await response.json();
          const updatedTasks = item.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...updatedTaskData,
                  machines: updatedTaskData.machines || [],
                  operators: updatedTaskData.operators || [],
                  timeSlots: updatedTaskData.timeSlots || [],
                }
              : task,
          );
          setItem({ ...item, tasks: updatedTasks });
          toast.success('Operator assignments updated successfully');
        } else {
          const errorMessage = await extractErrorMessage(response, 'Failed to update operator assignments');
          toast.error(errorMessage);
        }
      } catch (error) {
        logger.error('Error updating operator assignments:', error);
        toast.error(getErrorMessage(error, 'Error updating operator assignments'));
      }
    },
    [item],
  );

  // Initialize columns when all dependencies are ready
  useEffect(() => {
    // Only require item data - machines and operators can be empty
    if (item) {
      logger.debug('Column initialization', {
        machines: machines.length,
        operators: operators.length,
        item: item?.name,
        tasks: item?.tasks?.length,
      });

      const baseColumns = getBaseColumns(
        machines,
        operators,
        handleTaskUpdate,
        handleTaskMachineUpdate,
        handleTaskOperatorUpdate,
      );

      logger.debug('Generated base columns', { count: baseColumns.length });

      const initialColumns = getInitialColumns(baseColumns, params.id as string);

      logger.debug('Final columns to set', { count: initialColumns.length });
      setColumns(initialColumns);

      logger.debug('=== End Column Initialization ===');
    } else {
      logger.debug('Column initialization skipped - missing item data');
    }
  }, [machines, operators, item, params.id, handleTaskUpdate, handleTaskMachineUpdate, handleTaskOperatorUpdate]);

  const handleTaskReorder = (reorderedTasks: Task[]) => {
    if (!item) return;

    // Update local state immediately for smooth UX
    setItem({ ...item, tasks: reorderedTasks });

    // Save the task order to localStorage
    const taskOrder = reorderedTasks.map((task) => task.id);
    localStorage.setItem(`item-${item.id}-task-order`, JSON.stringify(taskOrder));

    toast.success('Task order updated');
  };

  // Column management functions
  const handleColumnReorder = (reorderedColumns: Column<Task>[]) => {
    setColumns(reorderedColumns);
    localStorage.setItem(
      `item-${params.id}-columnOrder`,
      JSON.stringify(
        reorderedColumns.map((col) => ({
          key: col.key,
          id: col.id,
        })),
      ),
    );
  };

  const handleResetColumns = () => {
    const baseColumns = getBaseColumns(
      machines,
      operators,
      handleTaskUpdate,
      handleTaskMachineUpdate,
      handleTaskOperatorUpdate,
    );
    setColumns(baseColumns);
    localStorage.removeItem(`item-${params.id}-columnOrder`);
    // Re-initialize with base columns
    setTimeout(() => {
      setColumns(getInitialColumns(baseColumns, params.id as string));
    }, 0);
  };

  // Multi-task creation logic
  interface MultiTaskFormData {
    title: string;
    description: string;
  }

  const [multiTasks, setMultiTasks] = useState<MultiTaskFormData[]>([{ title: '', description: '' }]);

  const addNewTaskRow = () => {
    setMultiTasks([...multiTasks, { title: '', description: '' }]);
  };

  const removeTaskRow = (index: number) => {
    if (multiTasks.length > 1) {
      setMultiTasks(multiTasks.filter((_, i) => i !== index));
    }
  };

  const updateTaskRow = (index: number, field: keyof MultiTaskFormData, value: string) => {
    setMultiTasks(multiTasks.map((task, i) => (i === index ? { ...task, [field]: value } : task)));
  };

  const handleCreateMultipleTasks = async () => {
    if (!item) return;

    const validTasks = multiTasks.filter((task) => task.title.trim());
    if (validTasks.length === 0) {
      toast.error('Please enter at least one task title');
      return;
    }

    setMultiTaskLoading(true);
    try {
      const results = await Promise.allSettled(
        validTasks.map(async (taskData) => {
          const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: taskData.title,
              description: taskData.description,
              status: 'PENDING',
              priority: 'MEDIUM',
              quantity: 1,
              completed_quantity: 0,
              projectId: item.project.id,
              itemId: item.id,
              machineIds: [],
              operatorIds: [],
              timeSlots: [],
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to create task "${taskData.title}"`);
          }
          return await response.json();
        }),
      );

      const successful = results.filter((result) => result.status === 'fulfilled').length;
      const failed = results.filter((result) => result.status === 'rejected').length;

      if (successful > 0) {
        // Refresh the item to get updated tasks
        const response = await fetch(`/api/items/${params.id}`);
        if (response.ok) {
          const updatedItem = await response.json();
          setItem(updatedItem);
        }

        toast.success(`Created ${successful} task${successful !== 1 ? 's' : ''} successfully`);

        if (failed === 0) {
          setShowMultiTaskForm(false);
          setMultiTasks([{ title: '', description: '' }]);
        }
      }

      if (failed > 0) {
        toast.error(`Failed to create ${failed} task${failed !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      logger.error('Error creating multiple tasks', error);
      toast.error('Error creating tasks. Please try again.');
    } finally {
      setMultiTaskLoading(false);
    }
  };

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
      breadcrumbs={[{ label: 'Items', href: '/items' }, { label: item.name }]}>
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
            <div
              className="w-40 mb-3"
              onClick={(e) => e.stopPropagation()}>
              <Select
                value={item.status}
                onChange={handleItemStatusUpdate}
                options={ITEM_STATUS.map((s) => ({ id: s.value, name: s.label }))}
                placeholder="Select status"
                buttonClassName={`font-medium cursor-pointer ${getVariantClasses(
                  getStatusVariant(item.status),
                  false,
                )}`}
              />
            </div>

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
                          className={`h-2 rounded-full transition-all duration-300 ${
                            completionStatus.completionPercentage === 100
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
          <div className="flex space-x-3">
            <button
              onClick={() => setShowMultiTaskForm(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
              Add Multiple Tasks
            </button>
            <Link
              href={`/tasks/new?project=${item.project.id}&item=${item.id}&returnUrl=/items/${item.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Task
            </Link>
          </div>
        </div>

        {item.tasks.length > 0 ? (
          <DataTable
            data={item.tasks}
            columns={columns}
            tableId={`item-${item.id}-tasks`}
            enableRowReorder={true}
            onRowReorder={handleTaskReorder}
            onColumnReorder={handleColumnReorder}
            onResetColumns={handleResetColumns}
            showResetColumns={true}
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
              href={`/tasks/new?project=${item.project.id}&item=${item.id}&returnUrl=/items/${item.id}`}
              className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-800">
              Create the first task
            </Link>
          </div>
        )}
      </div>

      {/* Multi-Task Creation Modal */}
      {showMultiTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Add Multiple Tasks</h3>
                    <p className="text-sm text-gray-500">Create multiple tasks for {item.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMultiTaskForm(false);
                    setMultiTasks([{ title: '', description: '' }]);
                  }}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors duration-200">
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-4">
                {multiTasks.map((task, index) => (
                  <div
                    key={index}
                    className="group relative bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    {/* Task Number Badge */}
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                      {index + 1}
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                            <svg
                              className="h-4 w-4 mr-2 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Task Title *
                          </label>
                          <div className="relative">
                            <TaskTitleSelect
                              value={task.title}
                              onChange={(title) => updateTaskRow(index, 'title', title)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                            <svg
                              className="h-4 w-4 mr-2 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h7"
                              />
                            </svg>
                            Description (optional)
                          </label>
                          <textarea
                            rows={3}
                            value={task.description}
                            onChange={(e) => updateTaskRow(index, 'description', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                            placeholder="Enter a detailed description for this task..."
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="flex flex-col items-center pt-8">
                        <button
                          onClick={() => removeTaskRow(index)}
                          disabled={multiTasks.length === 1}
                          className={`group relative p-3 rounded-xl transition-all duration-200 ${
                            multiTasks.length === 1
                              ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                              : 'text-red-500 hover:text-red-700 hover:bg-red-50 hover:scale-110'
                          }`}
                          title={multiTasks.length === 1 ? 'Cannot remove the last task' : 'Remove this task'}>
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={addNewTaskRow}
                className="inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 text-sm font-medium rounded-lg text-gray-600 bg-white hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Another Task
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowMultiTaskForm(false);
                    setMultiTasks([{ title: '', description: '' }]);
                  }}
                  className="inline-flex items-center px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                  Cancel
                </button>
                <button
                  onClick={handleCreateMultipleTasks}
                  disabled={multiTaskLoading || multiTasks.every((task) => !task.title.trim())}
                  className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                    multiTaskLoading || multiTasks.every((task) => !task.title.trim())
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}>
                  {multiTaskLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Create {multiTasks.filter((task) => task.title.trim()).length} Task
                      {multiTasks.filter((task) => task.title.trim()).length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
