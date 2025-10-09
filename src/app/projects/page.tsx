'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PageContainer from '@/components/layout/PageContainer';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import TableActions from '@/components/ui/TableActions';
import { ProjectColorIndicator } from '@/components/ui/ColorIndicator';
import StatisticsCards from '@/components/ui/StatisticsCards';
import ImageViewer from '@/components/ui/ImageViewer';
import Select from '@/components/ui/Select';
import { PROJECT_STATUS } from '@/config/workshop-properties';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import { logger } from '@/utils/logger';
import { getStatusVariant, getVariantClasses } from '@/utils/statusStyles';
import { extractErrorMessage, getErrorMessage } from '@/utils/errorHandling';
import { Column } from '@/types/table';
import FilterProvider from '@/components/layout/FilterProvider';

interface Project {
  id: string;
  name: string;
  description: string;
  orderNumber?: string | null;
  status: string;
  color?: string | null;
  pattern?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: Array<{
    id: string;
    status: string;
  }>;
}

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic';

function ProjectsPageContent({
  search,
  searchValue,
  filters,
  updateSearch,
  updateFilters,
  clearAll,
}: ReturnType<typeof import('@/hooks/useSimpleFilters').useSimpleFilters>) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Project update function
  const handleProjectUpdate = useCallback(async (projectId: string, field: string, value: string | null) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        setProjects((prevProjects) =>
          prevProjects.map((project) => (project.id === projectId ? { ...project, [field]: value } : project)),
        );
        toast.success(`Project ${field} updated successfully`);
      } else {
        const errorMessage = await extractErrorMessage(response, `Failed to update project ${field}`);
        logger.error(`Failed to update project ${field}:`, errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error(`Error updating project ${field}`, error);
      toast.error(getErrorMessage(error, `Error updating project ${field}`));
    }
  }, []);

  // Dynamic column configuration with update handler
  const getProjectColumns = useCallback(
    (): Column<Project>[] => [
      {
        key: 'color',
        header: 'Color',
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
        key: 'imageUrl',
        header: 'Image',
        render: (_: unknown, project: Project) => (
          <ImageViewer
            imageUrl={project.imageUrl}
            alt={project.name}
            size="small"
          />
        ),
      },
      {
        key: 'name',
        header: 'Project Name',
        align: 'left',
        sortable: true,
      },
      {
        key: 'orderNumber',
        header: 'Order #',
        render: (value: string | null | undefined) => <span className="text-sm text-gray-600">{value || '-'}</span>,
      },
      {
        key: 'description',
        header: 'Description',
        align: 'left',
        sortable: false,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (status: string, project: Project) => {
          const variant = getStatusVariant(status);
          const classes = getVariantClasses(variant, false);

          return (
            <div
              className="w-32"
              onClick={(e) => e.stopPropagation()}>
              <Select
                value={status}
                onChange={(newStatus) => handleProjectUpdate(project.id, 'status', newStatus)}
                options={PROJECT_STATUS.map((s) => ({ id: s.value, name: s.label }))}
                placeholder="Select status"
                buttonClassName={`font-medium cursor-pointer ${classes}`}
              />
            </div>
          );
        },
      },
      {
        key: 'updatedAt',
        header: 'Last Updated',
        sortable: true,
        render: (date: string) => new Date(date).toLocaleDateString(),
      },
    ],
    [handleProjectUpdate],
  );

  const [columns, setColumns] = useState<Column<Project>[]>(() => {
    if (typeof window === 'undefined') return getProjectColumns();

    try {
      const saved = localStorage.getItem('projectsColumnOrder');
      if (!saved) return getProjectColumns();

      const savedOrder = JSON.parse(saved);
      if (!Array.isArray(savedOrder)) return getProjectColumns();

      const baseColumns = getProjectColumns();
      // Reorder columns based on saved order
      const orderedColumns: Column<Project>[] = [];

      // Add columns in saved order
      for (const savedCol of savedOrder) {
        const matchingColumn = baseColumns.find((col) => (col.id || col.key) === (savedCol.id || savedCol.key));
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
      logger.error('Error loading column order,', error);
      return getProjectColumns();
    }
  });

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(search.toLowerCase()) ||
          project.description.toLowerCase().includes(search.toLowerCase()) ||
          (project.orderNumber && project.orderNumber.toLowerCase().includes(search.toLowerCase())),
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter((project) => project.status === filters.status);
    }

    return filtered;
  }, [projects, search, filters]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        } else {
          logger.error('Failed to fetch projects');
        }
      } catch (error) {
        logger.error('Error fetching projects,', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Column management functions
  const handleColumnReorder = (reorderedColumns: Column<Project>[]) => {
    setColumns(reorderedColumns);
    localStorage.setItem(
      'projectsColumnOrder',
      JSON.stringify(
        reorderedColumns.map((col) => ({
          key: col.key,
          id: col.id,
        })),
      ),
    );
  };

  const handleResetColumns = () => {
    const defaultCols = getProjectColumns();
    setColumns(defaultCols);
    localStorage.removeItem('projectsColumnOrder');
  };

  // Dynamic filters based on current data
  const filterOptions = [
    {
      key: 'status',
      label: 'All Statuses',
      options: PROJECT_STATUS.map((status) => ({
        value: status.value,
        label: status.label,
      })),
    },
  ];

  const handleRowClick = (project: Project) => {
    // Navigate to project details page
    window.location.href = `/projects/${project.id}`;
  };

  const handleDelete = (projectId: string, projectName?: string) => {
    showConfirmDialog({
      title: 'Delete Project',
      message: `Are you sure you want to delete project "${
        projectName || 'this project'
      }"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => performDelete(projectId),
    });
  };

  const performDelete = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove project from local state to update UI immediately
        const updatedProjects = projects.filter((p) => p.id !== projectId);
        setProjects(updatedProjects);
        toast.success('Project deleted successfully');
      } else {
        const errorMessage = await extractErrorMessage(response, 'Failed to delete project');
        logger.error('Failed to delete project:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      logger.error('Error deleting project:', error);
      toast.error(getErrorMessage(error, 'Error deleting project'));
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
    <PageContainer
      header={{
        title: 'Projects',
        description: 'Manage your project portfolio',
        actions: (
          <Link
            href="/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <span className="mr-2">+</span>
            New Project
          </Link>
        ),
      }}
      variant="list">
      {/* Statistics Cards */}
      <StatisticsCards
        stats={[
          { label: 'Total Projects', value: projects.length, color: 'gray' },
          ...PROJECT_STATUS.map((status) => {
            const variant = getStatusVariant(status.value);
            // Map status variants to StatisticsCards colors
            const variantColorMap: Record<string, 'yellow' | 'green' | 'blue' | 'orange' | 'red' | 'gray' | 'purple'> = {
              success: 'green',    // COMPLETED
              info: 'blue',        // ACTIVE
              warning: 'yellow',   // ON_HOLD
              error: 'red',        // CANCELLED
              scheduled: 'purple',
              default: 'gray',
            };
            return {
              label: status.label,
              value: projects.filter((project) => project.status === status.value).length,
              color: variantColorMap[variant] || ('gray' as const),
            };
          }),
        ]}
        loading={loading}
        columns={5}
      />

      {/* Search and Filters */}
      <SearchFilter
        placeholder="Search projects..."
        searchValue={searchValue}
        filterValues={filters}
        onSearch={updateSearch}
        filters={filterOptions}
        onFilterChange={updateFilters}
        clearAll={clearAll}
      />

      {/* Projects Table */}
      <DataTable
        data={filteredProjects}
        columns={columns}
        tableId="projects-list"
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

export default function ProjectsPage() {
  return (
    <FilterProvider defaultFilters={{ status: '' }}>
      {(filterProps) => <ProjectsPageContent {...filterProps} />}
    </FilterProvider>
  );
}
