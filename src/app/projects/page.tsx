'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';
import { ProjectColorIndicator } from '@/components/ui/ColorIndicator';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  color?: string | null;
  pattern?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
          setFilteredProjects(data);
        } else {
          console.error('Failed to fetch projects');
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleSearch = (query: string) => {
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.description.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredProjects(filtered);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = projects;

    if (filters.status) {
      filtered = filtered.filter((project) => project.status === filters.status);
    }

    setFilteredProjects(filtered);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PLANNING':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'ON_HOLD':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      key: 'color' as keyof Project,
      header: '',
      render: (_: unknown, project: Project) => (
        <ProjectColorIndicator
          project={project}
          size="md"
          showTooltip={true}
          tooltipText={`${project.name} color`}
        />
      ),
    },
    {
      key: 'name' as keyof Project,
      header: 'Project Name',
      sortable: true,
    },
    {
      key: 'description' as keyof Project,
      header: 'Description',
      sortable: false,
    },
    {
      key: 'status' as keyof Project,
      header: 'Status',
      sortable: true,
      render: (status: string) => (
        <StatusBadge
          status={status}
          variant={getStatusVariant(status)}
        />
      ),
    },
    {
      key: 'createdAt' as keyof Project,
      header: 'Created',
      sortable: true,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Filter by Status',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'PLANNING', label: 'Planning' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'ON_HOLD', label: 'On Hold' },
      ],
    },
  ];

  const handleRowClick = (project: Project) => {
    // Navigate to project detail page
    window.location.href = `/projects/${project.id}`;
  };

  const handleDelete = async (projectId: string, projectName?: string) => {
    if (confirm(`Are you sure you want to delete project "${projectName || 'this project'}"?`)) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove project from local state to update UI immediately
          const updatedProjects = projects.filter((p) => p.id !== projectId);
          setProjects(updatedProjects);
          setFilteredProjects(updatedProjects);
        } else {
          const errorData = await response.json();
          console.error('Failed to delete project:', errorData.error);
          alert('Failed to delete project: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project. Please try again.');
      }
    }
  };

  const renderActions = (project: Project) => (
    <TableActions
      itemId={project.id}
      itemName={project.name}
      editPath={`/projects/${project.id}/edit`}
      onDelete={handleDelete}
    />
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">Manage your project portfolio</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <span className="mr-2">+</span>
          New Project
        </Link>
      </div>

      {/* Search and Filters */}
      <SearchFilter
        placeholder="Search projects..."
        onSearch={handleSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Projects Table */}
      <DataTable
        data={filteredProjects}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        actions={renderActions}
      />
    </div>
  );
}
