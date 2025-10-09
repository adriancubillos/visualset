'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PageContainer from '@/components/layout/PageContainer';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import TableActions from '@/components/ui/TableActions';
import MultiSelect from '@/components/ui/MultiSelect';
import Select from '@/components/ui/Select';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import { logger } from '@/utils/logger';
import { getStatusVariant, getVariantClasses } from '@/utils/statusStyles';
import { extractErrorMessage, getErrorMessage } from '@/utils/errorHandling';
import StatisticsCards from '@/components/ui/StatisticsCards';
import { TASK_STATUS } from '@/config/workshop-properties';
import { useTaskTitles } from '@/hooks/useConfiguration';
import { Column } from '@/types/table';
import FilterProvider from '@/components/layout/FilterProvider';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  quantity: number;
  completed_quantity: number;
  item: {
    id: string;
    name: string;
    project: { id: string; name: string };
  } | null;
  machines: { id: string; name: string }[];
  operators: { id: string; name: string }[];
  timeSlots: {
    id: string;
    startDateTime: string;
    endDateTime: string | null;
    durationMin: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Default column configuration
// Function to get initial column order from localStorage

// Function to create columns with access to task title configuration
// Function to get initial column order from localStorage
const getInitialColumns = (baseColumns: Column<Task>[]): Column<Task>[] => {
  if (typeof window === 'undefined') return baseColumns;

  try {
    const saved = localStorage.getItem('tasksColumnOrder');
    if (!saved) return baseColumns;

    const savedOrder = JSON.parse(saved);
    if (!Array.isArray(savedOrder)) return baseColumns;

    // Reorder columns based on saved order
    const orderedColumns: Column<Task>[] = [];

    // Add columns in saved order
    for (const savedCol of savedOrder) {
      const matchingColumn = baseColumns.find(
        (col: Column<Task>) => (col.id || col.key) === (savedCol.id || savedCol.key),
      );
      if (matchingColumn) {
        orderedColumns.push(matchingColumn);
      }
    }

    // Add any new columns that weren't in saved order
    for (const defaultCol of baseColumns) {
      const exists = orderedColumns.some((col) => (col.id || col.key) === (defaultCol.id || defaultCol.key));
      if (!exists) {
        orderedColumns.push(defaultCol);
      }
    }

    return orderedColumns;
  } catch (error) {
    logger.error('Error loading column order', error);
    return baseColumns;
  }
};

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic';

function TasksPageContent({
  search,
  searchValue,
  filters,
  updateSearch,
  updateFilters,
  clearAll,
}: ReturnType<typeof import('@/hooks/useSimpleFilters').useSimpleFilters>) {
  const { options: taskTitles } = useTaskTitles();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [machines, setMachines] = useState<{ id: string; name: string }[]>([]);
  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Task update functions
  const handleTaskUpdate = useCallback(async (taskId: string, field: string, value: string | null) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, [field]: value } : task)));
        toast.success(`Task ${field} updated successfully`);
      } else {
        const errorMessage = await extractErrorMessage(response, `Failed to update task ${field}`);
        logger.error(`Failed to update task ${field}:`, errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error(`Error updating task ${field}`, error);
      toast.error(getErrorMessage(error, `Error updating task ${field}`));
    }
  }, []);

  const handleTaskMachineUpdate = useCallback(
    async (taskId: string, machineIds: string[]) => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ machineIds }),
        });

        if (response.ok) {
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskId ? { ...task, machines: machines.filter((m) => machineIds.includes(m.id)) } : task,
            ),
          );
          toast.success('Task machines updated successfully');
        } else {
          const errorMessage = await extractErrorMessage(response, 'Failed to update task machines');
          logger.error('Failed to update task machines:', errorMessage);
          toast.error(errorMessage);
        }
      } catch (error) {
        logger.error('Error updating task machines', error);
        toast.error(getErrorMessage(error, 'Error updating task machines'));
      }
    },
    [machines],
  );

  const handleTaskOperatorUpdate = useCallback(
    async (taskId: string, operatorIds: string[]) => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ operatorIds }),
        });

        if (response.ok) {
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskId ? { ...task, operators: operators.filter((op) => operatorIds.includes(op.id)) } : task,
            ),
          );
          toast.success('Task operators updated successfully');
        } else {
          const errorMessage = await extractErrorMessage(response, 'Failed to update task operators');
          logger.error('Failed to update task operators:', errorMessage);
          toast.error(errorMessage);
        }
      } catch (error) {
        logger.error('Error updating task operators', error);
        toast.error(getErrorMessage(error, 'Error updating task operators'));
      }
    },
    [operators],
  );

  // Create columns with real-time access to taskTitles
  const baseColumns = useMemo<Column<Task>[]>(
    () => [
      {
        key: 'title',
        header: 'Task',
        sortable: true,
        align: 'left',
        width: '30%',
        minWidth: '200px',
        render: (title: string, task: Task) => {
          // Access current taskTitles at render time
          const taskTitle = taskTitles.find((t) => t.value === title);
          const displayValue = taskTitle?.label || title;
          return (
            <Link
              href={`/tasks/${task.id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800">
              {displayValue}
            </Link>
          );
        },
      },
      {
        id: 'project',
        key: 'item',
        header: 'Project',
        sortable: false,
        width: '15%',
        minWidth: '150px',
        render: (item: Task['item']) => <span className="text-sm">{item?.project?.name || 'No Project'}</span>,
      },
      {
        id: 'item',
        key: 'item',
        header: 'Item',
        sortable: false,
        width: '15%',
        minWidth: '150px',
        render: (item: Task['item']) => <span className="text-sm">{item?.name || 'No Item'}</span>,
      },
      {
        key: 'quantity',
        header: 'Progress',
        sortable: false,
        width: '120px',
        minWidth: '120px',
        render: (quantity: number, task: Task) => (
          <div className="text-sm">
            <div>
              {task.completed_quantity}/{quantity}
            </div>
            <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
              <div
                className="bg-blue-600 h-1 rounded-full"
                style={{ width: `${Math.min((task.completed_quantity / quantity) * 100, 100)}%` }}></div>
            </div>
          </div>
        ),
      },
      {
        key: 'operators',
        header: 'Operators',
        sortable: false,
        width: '20%',
        minWidth: '200px',
        render: (taskOperators: Task['operators'], task: Task) => (
          <div
            className="w-64"
            onClick={(e) => e.stopPropagation()}>
            <MultiSelect
              value={taskOperators?.map((op) => op.id) || []}
              onChange={(operatorIds) => handleTaskOperatorUpdate(task.id, operatorIds)}
              options={operators}
              placeholder="-- None --"
              maxDisplayItems={2}
            />
          </div>
        ),
      },
      {
        key: 'machines',
        header: 'Machines',
        sortable: false,
        width: '20%',
        minWidth: '200px',
        render: (taskMachines: Task['machines'], task: Task) => (
          <div
            className="w-64"
            onClick={(e) => e.stopPropagation()}>
            <MultiSelect
              value={taskMachines?.map((m) => m.id) || []}
              onChange={(machineIds) => handleTaskMachineUpdate(task.id, machineIds)}
              options={machines}
              placeholder="-- None --"
              maxDisplayItems={2}
            />
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        width: '140px',
        minWidth: '140px',
        render: (status: string, task: Task) => {
          const variant = getStatusVariant(status);
          const classes = getVariantClasses(variant, false);

          return (
            <div
              className="w-32"
              onClick={(e) => e.stopPropagation()}>
              <Select
                value={status}
                onChange={(newStatus) => handleTaskUpdate(task.id, 'status', newStatus)}
                options={TASK_STATUS.map((s) => ({ id: s.value, name: s.label }))}
                placeholder="Select status"
                buttonClassName={`font-medium cursor-pointer ${classes}`}
              />
            </div>
          );
        },
      },
    ],
    [taskTitles, machines, operators, handleTaskUpdate, handleTaskMachineUpdate, handleTaskOperatorUpdate],
  ); // Depend on taskTitles and update functions

  // Track column order state separately from base columns
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // Get columns with proper ordering and current taskTitles
  const columns = useMemo(() => {
    if (columnOrder.length === 0) {
      // Initialize column order on first load
      return getInitialColumns(baseColumns);
    } else {
      // Apply saved column order
      const orderedColumns: Column<Task>[] = [];

      // First, add columns in saved order
      for (const savedKey of columnOrder) {
        const matchingColumn = baseColumns.find((col: Column<Task>) => (col.id || col.key) === savedKey);
        if (matchingColumn) {
          orderedColumns.push(matchingColumn);
        }
      }

      // Add any new columns that weren't in saved order
      for (const defaultCol of baseColumns) {
        const exists = orderedColumns.some((col) => (col.id || col.key) === (defaultCol.id || defaultCol.key));
        if (!exists) {
          orderedColumns.push(defaultCol);
        }
      }

      return orderedColumns;
    }
  }, [baseColumns, columnOrder]);

  // Initialize column order on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && baseColumns.length > 0 && columnOrder.length === 0) {
      try {
        const saved = localStorage.getItem('tasksColumnOrder');
        if (saved) {
          const savedOrder: { id?: string; key: string }[] = JSON.parse(saved);
          const orderKeys = savedOrder.map((col) => col.id || col.key);
          setColumnOrder(orderKeys);
        } else {
          // Set default order
          const defaultOrder = baseColumns.map((col) => col.id || col.key);
          setColumnOrder(defaultOrder);
        }
      } catch (error) {
        console.error('Error loading column order:', error);
        const defaultOrder = baseColumns.map((col) => col.id || col.key);
        setColumnOrder(defaultOrder);
      }
    }
  }, [baseColumns, columnOrder.length]);

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.description?.toLowerCase().includes(search.toLowerCase()) ||
          task.item?.name.toLowerCase().includes(search.toLowerCase()) ||
          task.item?.project.name.toLowerCase().includes(search.toLowerCase()) ||
          task.machines?.some((machine) => machine.name.toLowerCase().includes(search.toLowerCase())) ||
          task.operators?.some((operator) => operator.name.toLowerCase().includes(search.toLowerCase())),
      );
    }

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.project) {
      filtered = filtered.filter((task) => task.item?.project.id === filters.project);
    }

    if (filters.item) {
      filtered = filtered.filter((task) => task.item?.id === filters.item);
    }

    if (filters.machine) {
      filtered = filtered.filter((task) => task.machines?.some((machine) => machine.id === filters.machine));
    }

    if (filters.operator) {
      filtered = filtered.filter((task) => task.operators?.some((operator) => operator.id === filters.operator));
    }

    return filtered;
  }, [tasks, search, filters]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksResponse, projectsResponse, machinesResponse, operatorsResponse] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/projects'),
          fetch('/api/machines'),
          fetch('/api/operators'),
        ]);

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData);
        } else {
          logger.apiError('Fetch tasks', '/api/tasks', `Status: ${tasksResponse.status}`);
        }

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
          // Extract items from projects
          const allItems = projectsData.flatMap(
            (p: { id: string; name: string; items?: { id: string; name: string }[] }) =>
              (p.items || []).map((item: { id: string; name: string }) => ({ id: item.id, name: item.name })),
          );
          setItems(allItems);
        } else {
          logger.apiError('Fetch projects', '/api/projects', `Status: ${projectsResponse.status}`);
        }

        if (machinesResponse.ok) {
          const machinesData = await machinesResponse.json();
          setMachines(machinesData.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })));
        } else {
          logger.apiError('Fetch machines', '/api/machines', 'Failed to fetch');
        }

        if (operatorsResponse.ok) {
          const operatorsData = await operatorsResponse.json();
          setOperators(operatorsData.map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })));
        } else {
          logger.apiError('Fetch operators', '/api/operators', 'Failed to fetch');
        }
      } catch (error) {
        logger.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Column management functions
  const handleColumnReorder = (reorderedColumns: Column<Task>[]) => {
    const newOrder = reorderedColumns.map((col) => col.id || col.key);
    setColumnOrder(newOrder);
    localStorage.setItem(
      'tasksColumnOrder',
      JSON.stringify(
        reorderedColumns.map((col) => ({
          key: col.key,
          id: col.id,
        })),
      ),
    );
  };

  const handleResetColumns = () => {
    const defaultOrder = baseColumns.map((col) => col.id || col.key);
    setColumnOrder(defaultOrder);
    localStorage.removeItem('tasksColumnOrder');
  };

  // Dynamic filters based on current data
  const filterOptions = [
    {
      key: 'status',
      label: 'All Statuses',
      options: TASK_STATUS.slice()
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((status) => ({
          value: status.value,
          label: status.label,
        })),
    },
    {
      key: 'project',
      label: 'All Projects',
      options: projects
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((project) => ({
          value: project.id,
          label: project.name,
        })),
    },
    {
      key: 'item',
      label: 'All Items',
      options: items
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({
          value: item.id,
          label: item.name,
        })),
    },
    {
      key: 'machine',
      label: 'All Machines',
      options: machines
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((machine) => ({
          value: machine.id,
          label: machine.name,
        })),
    },
    {
      key: 'operator',
      label: 'All Operators',
      options: operators
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((operator) => ({
          value: operator.id,
          label: operator.name,
        })),
    },
  ];

  const handleRowClick = (task: Task) => {
    window.location.href = `/tasks/${task.id}`;
  };

  const handleDelete = (taskId: string, taskName?: string) => {
    showConfirmDialog({
      title: 'Delete Task',
      message: `Are you sure you want to delete task "${taskName || 'this task'}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => performDelete(taskId),
    });
  };

  const performDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedTasks = tasks.filter((task) => task.id !== taskId);
        setTasks(updatedTasks);
        toast.success('Task deleted successfully');
      } else {
        const errorMessage = await extractErrorMessage(response, 'Failed to delete task');
        logger.apiError('Delete task', `/api/tasks/${taskId}`, errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error('Error deleting task', error);
      toast.error(getErrorMessage(error, 'Error deleting task'));
    }
  };

  const renderActions = (task: Task) => (
    <TableActions
      itemId={task.id}
      itemName={task.title}
      editPath={`/tasks/${task.id}/edit`}
      onDelete={handleDelete}
    />
  );

  // Calculate statistics
  const stats = {
    total: tasks.length,
    ...Object.fromEntries(
      TASK_STATUS.map((status) => [
        status.value.toLowerCase().replace('_', ''),
        tasks.filter((t) => t.status === status.value).length,
      ]),
    ),
  };

  return (
    <PageContainer
      header={{
        title: 'Tasks',
        description: 'Manage and track workshop tasks',
        actions: (
          <Link
            href="/tasks/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <span className="mr-2">+</span>
            Add Task
          </Link>
        ),
      }}
      variant="list">
      {/* Statistics Cards */}
      <StatisticsCards
        stats={[
          { label: 'Total Tasks', value: stats.total, color: 'gray' },
          ...TASK_STATUS.map((status) => {
            const key = status.value.toLowerCase().replace('_', '');
            const variant = getStatusVariant(status.value);
            // Map status variants to StatisticsCards colors
            const variantColorMap: Record<string, 'yellow' | 'blue' | 'green' | 'red' | 'gray' | 'purple'> = {
              success: 'green',    // COMPLETED
              info: 'blue',        // IN_PROGRESS
              warning: 'yellow',   // PENDING
              error: 'red',        // BLOCKED
              scheduled: 'purple', // SCHEDULED
              default: 'gray',
            };
            return {
              label: status.label,
              value: (stats as Record<string, number>)[key] || 0,
              color: variantColorMap[variant] || ('gray' as const),
            };
          }),
        ]}
        loading={loading}
        columns={5}
      />

      {/* Search and Filters */}
      <SearchFilter
        placeholder="Search tasks..."
        searchValue={searchValue}
        filterValues={filters}
        onSearch={updateSearch}
        filters={filterOptions}
        onFilterChange={updateFilters}
        clearAll={clearAll}
      />

      {/* Tasks Table */}
      <DataTable
        data={filteredTasks}
        columns={columns}
        tableId="tasks-list"
        loading={loading}
        onRowClick={handleRowClick}
        actions={renderActions}
        maxHeight="70vh"
        onColumnReorder={handleColumnReorder}
        onResetColumns={handleResetColumns}
        showResetColumns={true}
      />
    </PageContainer>
  );
}

export default function TasksPage() {
  return (
    <FilterProvider defaultFilters={{ status: '', project: '', item: '', machine: '', operator: '' }}>
      {(filterProps) => <TasksPageContent {...filterProps} />}
    </FilterProvider>
  );
}
