'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  color?: string;
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
        project.description.toLowerCase().includes(query.toLowerCase())
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
      key: 'name' as keyof Project,
      header: 'Project Name',
      sortable: true,
      render: (name: string, project: Project) => (
        <div className="flex items-center space-x-3">
          {project.color && (
            <div 
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: project.color }}
            />
          )}
          <span>{name}</span>
        </div>
      ),
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
        <StatusBadge status={status} variant={getStatusVariant(status)} />
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

  const renderActions = (project: Project) => (
    <div className="flex space-x-2">
      <Link
        href={`/projects/${project.id}/edit`}
        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
      >
        Edit
      </Link>
      <button
        onClick={(e) => {
          e.stopPropagation();
          // Handle delete
          console.log('Delete project:', project.id);
        }}
        className="text-red-600 hover:text-red-900 text-sm font-medium"
      >
        Delete
      </button>
    </div>
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
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
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
