'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';
import StatisticsCards from '@/components/ui/StatisticsCards';
import { TASK_STATUS } from '@/config/workshop-properties';

// Column type for DataTable
type Column<T> = {
  key: keyof T;
  header: string;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, item: T) => React.ReactNode;
};

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
  machine: { id: string; name: string } | null;
  operator: { id: string; name: string } | null;
  timeSlots: {
    id: string;
    startDateTime: string;
    endDateTime: string | null;
    durationMin: number;
    isPrimary: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Default column configuration
const defaultColumns: Column<Task>[] = [
  {
    key: 'title',
    header: 'Task',
    sortable: true,
    width: '30%',
    minWidth: '200px',
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '120px',
    minWidth: '120px',
    render: (status: string) => {
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

      return (
        <StatusBadge
          status={status ? status.replace(/_/g, ' ') : 'Unknown'}
          variant={getStatusVariant(status)}
        />
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
    key: 'operator',
    header: 'Operator',
    sortable: false,
    width: '15%',
    minWidth: '120px',
    render: (operator: Task['operator']) => <span className="text-sm">{operator?.name || 'Unassigned'}</span>,
  },
  {
    key: 'timeSlots',
    header: 'Scheduled',
    sortable: true,
    width: '15%',
    minWidth: '150px',
    render: (timeSlots: Task['timeSlots']) => {
      if (!timeSlots || timeSlots.length === 0) {
        return <span className="text-sm text-gray-500">Not scheduled</span>;
      }

      // Find primary slot or use first slot
      const primarySlot = timeSlots.find((slot) => slot.isPrimary) || timeSlots[0];
      const date = new Date(primarySlot.startDateTime);

      return (
        <div className="text-sm">
          <div>{date.toLocaleDateString()}</div>
          {timeSlots.length > 1 && <div className="text-xs text-gray-500">+{timeSlots.length - 1} more</div>}
        </div>
      );
    },
  },
];

// Function to get initial column order from localStorage
const getInitialColumns = (): Column<Task>[] => {
  if (typeof window === 'undefined') return defaultColumns;

  try {
    const saved = localStorage.getItem('tasksColumnOrder');
    if (!saved) return defaultColumns;

    const savedOrder = JSON.parse(saved);
    if (!Array.isArray(savedOrder)) return defaultColumns;

    // Reorder columns based on saved order
    const orderedColumns: Column<Task>[] = [];

    // Add columns in saved order
    for (const savedCol of savedOrder) {
      const matchingColumn = defaultColumns.find((col) => (col.id || col.key) === (savedCol.id || savedCol.key));
      if (matchingColumn) {
        orderedColumns.push(matchingColumn);
      }
    }

    // Add any new columns that weren't in saved order
    for (const defaultCol of defaultColumns) {
      const exists = orderedColumns.some((col) => (col.id || col.key) === (defaultCol.id || defaultCol.key));
      if (!exists) {
        orderedColumns.push(defaultCol);
      }
    }

    return orderedColumns;
  } catch (error) {
    console.error('Error loading column order:', error);
    return defaultColumns;
  }
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<Column<Task>[]>(getInitialColumns);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksResponse, projectsResponse, operatorsResponse] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/projects'),
          fetch('/api/operators'),
        ]);

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData);
          setFilteredTasks(tasksData);
        } else {
          console.error('Failed to fetch tasks - Status:', tasksResponse.status, 'URL:', tasksResponse.url);
        }

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        } else {
          console.error('Failed to fetch projects - Status:', projectsResponse.status, 'URL:', projectsResponse.url);
        }

        if (operatorsResponse.ok) {
          const operatorsData = await operatorsResponse.json();
          setOperators(operatorsData.map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })));
        } else {
          console.error('Failed to fetch operators');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (query: string) => {
    const filtered = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.description.toLowerCase().includes(query.toLowerCase()) ||
        task.item?.project?.name.toLowerCase().includes(query.toLowerCase()) ||
        task.machine?.name.toLowerCase().includes(query.toLowerCase()) ||
        task.operator?.name.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredTasks(filtered);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = tasks;

    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.project) {
      filtered = filtered.filter((task) => task.item?.project.id === filters.project);
    }

    if (filters.operator) {
      filtered = filtered.filter((task) => task.operator?.id === filters.operator);
    }

    setFilteredTasks(filtered);
  };

  // Column management functions
  const handleColumnReorder = (reorderedColumns: Column<Task>[]) => {
    setColumns(reorderedColumns);
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
    setColumns(defaultColumns);
    localStorage.removeItem('tasksColumnOrder');
  };

  // Dynamic filters based on current data
  const filterOptions = [
    {
      key: 'status',
      label: 'Filter by Status',
      options: TASK_STATUS.slice()
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((status) => ({
          value: status.value,
          label: status.label,
        })),
    },
    {
      key: 'project',
      label: 'Filter by Project',
      options: projects
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((project) => ({
          value: project.id,
          label: project.name,
        })),
    },
    {
      key: 'operator',
      label: 'Filter by Operator',
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

  const handleDelete = async (taskId: string, taskName?: string) => {
    if (!confirm(`Are you sure you want to delete task "${taskName || 'this task'}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update local state
        const updatedTasks = tasks.filter((task) => task.id !== taskId);
        setTasks(updatedTasks);
        setFilteredTasks(updatedTasks);
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
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
            Create Task
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
            const colorMap: { [key: string]: 'yellow' | 'blue' | 'green' | 'red' | 'gray' } = {
              pending: 'yellow',
              scheduled: 'blue',
              inprogress: 'blue',
              completed: 'green',
              blocked: 'red',
            };
            return {
              label: status.label,
              value: (stats as Record<string, number>)[key] || 0,
              color: colorMap[key] || ('gray' as const),
            };
          }),
        ]}
        loading={loading}
        columns={5}
      />

      {/* Search and Filters */}
      <SearchFilter
        placeholder="Search tasks..."
        onSearch={handleSearch}
        filters={filterOptions}
        onFilterChange={handleFilterChange}
      />

      {/* Tasks Table */}
      <DataTable
        data={filteredTasks}
        columns={columns}
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
