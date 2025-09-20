'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  scheduledAt: string;
  durationMin: number;
  project: { id: string; name: string } | null;
  item: { id: string; name: string; project: { id: string; name: string } } | null;
  machine: { id: string; name: string } | null;
  operator: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [items, setItems] = useState<{ id: string; name: string; projectId: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksResponse, projectsResponse, itemsResponse] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/projects'),
          fetch('/api/items'),
        ]);

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData);
          setFilteredTasks(tasksData);
        } else {
          console.error('Failed to fetch tasks');
        }

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        } else {
          console.error('Failed to fetch projects');
        }

        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setItems(
            itemsData.map((i: { id: string; name: string; project: { id: string } }) => ({
              id: i.id,
              name: i.name,
              projectId: i.project.id,
            })),
          );
        } else {
          console.error('Failed to fetch items');
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
        task.project?.name.toLowerCase().includes(query.toLowerCase()) ||
        task.machine?.name.toLowerCase().includes(query.toLowerCase()) ||
        task.operator?.name.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredTasks(filtered);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = tasks;

    // Track selected project for dynamic item filtering
    // When project filter is cleared, it won't be in the filters object at all
    if ('project' in filters) {
      setSelectedProject(filters.project);
    } else {
      // Project filter was cleared
      setSelectedProject('');
    }

    if (filters.project) {
      filtered = filtered.filter((task) => task.item?.project.id === filters.project);
    }

    if (filters.item) {
      filtered = filtered.filter((task) => task.item?.id === filters.item);
    }

    setFilteredTasks(filtered);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      key: 'title' as keyof Task,
      header: 'Task',
      sortable: true,
    },
    {
      key: 'status' as keyof Task,
      header: 'Status',
      sortable: true,
      render: (status: string) => (
        <StatusBadge
          status={status ? status.replace(/_/g, ' ') : 'Unknown'}
          variant={getStatusVariant(status)}
        />
      ),
    },
    {
      key: 'project' as keyof Task,
      header: 'Project',
      sortable: false,
      render: (project: Task['project']) => <span className="text-sm">{project?.name || 'No Project'}</span>,
    },
    {
      key: 'item' as keyof Task,
      header: 'Item',
      sortable: false,
      render: (item: Task['item']) => <span className="text-sm">{item?.name || 'No Item'}</span>,
    },
    {
      key: 'operator' as keyof Task,
      header: 'Operator',
      sortable: false,
      render: (operator: Task['operator']) => <span className="text-sm">{operator?.name || 'Unassigned'}</span>,
    },
    {
      key: 'scheduledAt' as keyof Task,
      header: 'Scheduled',
      sortable: true,
      render: (date: string) => <span className="text-sm">{new Date(date).toLocaleDateString()}</span>,
    },
  ];

  const filters = [
    {
      key: 'project',
      label: 'Filter by Project',
      options: projects.map((project) => ({
        value: project.id,
        label: project.name,
      })),
    },
    {
      key: 'item',
      label: 'Filter by Item',
      options: items
        .filter((item) => !selectedProject || item.projectId === selectedProject)
        .map((item) => ({
          value: item.id,
          label: item.name,
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
    pending: tasks.filter((t) => t.status === 'PENDING').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    cancelled: tasks.filter((t) => t.status === 'CANCELLED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-2 text-gray-600">Manage and track workshop tasks</p>
        </div>
        <Link
          href="/tasks/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <span className="mr-2">+</span>
          Create Task
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-500">In Progress</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-sm text-gray-500">Cancelled</div>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchFilter
        placeholder="Search tasks..."
        onSearch={handleSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Tasks Table */}
      <DataTable
        data={filteredTasks}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        actions={renderActions}
      />
    </div>
  );
}
