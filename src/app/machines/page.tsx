'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PageContainer from '@/components/layout/PageContainer';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';
import StatisticsCards from '@/components/ui/StatisticsCards';
import { MachineColorIndicator } from '@/components/ui/ColorIndicator';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import { logger } from '@/utils/logger';
import { MACHINE_STATUS } from '@/config/workshop-properties';
import { useMachineTypes } from '@/hooks/useConfiguration';
import { Column } from '@/types/table';
import FilterProvider from '@/components/layout/FilterProvider';

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

// Default column configuration
const defaultColumns: Column<Machine>[] = [
  {
    key: 'color',
    header: 'Color',
    render: (_: unknown, machine: Machine) => (
      <MachineColorIndicator
        machine={machine}
        size="md"
        showTooltip={true}
        tooltipText={`${machine.name} color`}
      />
    ),
  },
  {
    key: 'name',
    header: 'Machine Name',
    align: 'left',
    sortable: true,
  },
  {
    key: 'type',
    header: 'Type',
    sortable: true,
    render: (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (status: string) => {
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

      return (
        <StatusBadge
          status={status ? status.replace(/_/g, ' ') : 'Unknown'}
          variant={getStatusVariant(status)}
        />
      );
    },
  },
  {
    key: 'location',
    header: 'Location',
    sortable: true,
  },
  {
    key: 'updatedAt',
    header: 'Last Updated',
    sortable: true,
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
];

// Function to get initial column order from localStorage
const getInitialColumns = (): Column<Machine>[] => {
  if (typeof window === 'undefined') return defaultColumns;

  try {
    const saved = localStorage.getItem('machinesColumnOrder');
    if (!saved) return defaultColumns;

    const savedOrder = JSON.parse(saved);
    if (!Array.isArray(savedOrder)) return defaultColumns;

    // Reorder columns based on saved order
    const orderedColumns: Column<Machine>[] = [];

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
    logger.error('Error loading column order,', error);
    return defaultColumns;
  }
};

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic';

function MachinesPageContent({
  search,
  searchValue,
  filters,
  updateSearch,
  updateFilters,
  clearAll,
}: ReturnType<typeof import('@/hooks/useSimpleFilters').useSimpleFilters>) {
  const { options: machineTypes } = useMachineTypes();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<Column<Machine>[]>(getInitialColumns);

  // Filter machines based on search and filters
  const filteredMachines = useMemo(() => {
    let filtered = machines;

    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(
        (machine) =>
          machine.name.toLowerCase().includes(search.toLowerCase()) ||
          machine.location?.toLowerCase().includes(search.toLowerCase()) ||
          machine.type.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter((machine) => machine.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter((machine) => machine.status === filters.status);
    }

    if (filters.location) {
      filtered = filtered.filter((machine) => machine.location === filters.location);
    }

    return filtered;
  }, [machines, search, filters]);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch('/api/machines');
        if (response.ok) {
          const data = await response.json();
          setMachines(data);
        } else {
          logger.error('Failed to fetch machines');
        }
      } catch (error) {
        logger.error('Error fetching machines,', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  // Column management functions
  const handleColumnReorder = (reorderedColumns: Column<Machine>[]) => {
    setColumns(reorderedColumns);
    localStorage.setItem(
      'machinesColumnOrder',
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
    localStorage.removeItem('machinesColumnOrder');
  };

  // Dynamic filters based on current data
  const filterOptions = [
    {
      key: 'status',
      label: 'All Statuses',
      options: MACHINE_STATUS.map((status) => ({
        value: status.value,
        label: status.label,
      })),
    },
    {
      key: 'type',
      label: 'All Types',
      options: machineTypes.map((type) => ({
        value: type.value,
        label: type.label,
      })),
    },
    {
      key: 'location',
      label: 'All Locations',
      options: Array.from(new Set(machines.map((machine) => machine.location)))
        .filter((location) => location) // Remove empty locations
        .sort()
        .map((location) => ({
          value: location,
          label: location,
        })),
    },
  ];

  const handleRowClick = (machine: Machine) => {
    window.location.href = `/machines/${machine.id}`;
  };

  const handleDelete = (machineId: string, machineName?: string) => {
    showConfirmDialog({
      title: 'Delete Machine',
      message: `Are you sure you want to delete machine "${
        machineName || 'this machine'
      }"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => performDelete(machineId, machineName),
    });
  };

  const performDelete = async (machineId: string, machineName?: string) => {
    try {
      const response = await fetch(`/api/machines/${machineId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedMachines = machines.filter((machine) => machine.id !== machineId);
        setMachines(updatedMachines);
        toast.success('Machine deleted successfully');
      } else {
        const errorData = await response.json();
        logger.error('Failed to delete machine,', errorData.error);

        if (errorData.error?.includes('assigned tasks')) {
          toast.error(
            `Cannot delete "${machineName}". This machine is currently assigned to one or more tasks. Please unassign or delete those tasks first.`,
            { duration: 6000 },
          );
        } else {
          toast.error('Failed to delete machine: ' + (errorData.error || 'Unknown error'));
        }
      }
    } catch (error) {
      logger.error('Error deleting machine:', error);
      toast.error('Error deleting machine');
    }
  };

  const renderActions = (machine: Machine) => (
    <TableActions
      itemId={machine.id}
      itemName={machine.name}
      editPath={`/machines/${machine.id}/edit`}
      onDelete={handleDelete}
    />
  );

  // Calculate statistics
  const stats = {
    total: machines.length,
    available: machines.filter((m) => m.status === 'AVAILABLE').length,
    inUse: machines.filter((m) => m.status === 'IN_USE').length,
    maintenance: machines.filter((m) => m.status === 'MAINTENANCE').length,
    offline: machines.filter((m) => m.status === 'OFFLINE').length,
  };

  return (
    <PageContainer
      header={{
        title: 'Machines',
        description: 'Monitor and manage workshop machines',
        actions: (
          <Link
            href="/machines/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <span className="mr-2">+</span>
            Add Machine
          </Link>
        ),
      }}
      variant="list">
      {/* Statistics Cards */}
      <StatisticsCards
        stats={[
          { label: 'Total Machines', value: stats.total, color: 'gray' },
          { label: 'Available', value: stats.available, color: 'green' },
          { label: 'In Use', value: stats.inUse, color: 'blue' },
          { label: 'Maintenance', value: stats.maintenance, color: 'yellow' },
          { label: 'Offline', value: stats.offline, color: 'red' },
        ]}
        loading={loading}
        columns={5}
      />

      {/* Search and Filters */}
      <SearchFilter
        placeholder="Search machines..."
        searchValue={searchValue}
        filterValues={filters}
        onSearch={updateSearch}
        filters={filterOptions}
        onFilterChange={updateFilters}
        clearAll={clearAll}
      />

      {/* Machines Table */}
      <DataTable
        data={filteredMachines}
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

export default function MachinesPage() {
  return (
    <FilterProvider defaultFilters={{ type: '', status: '', location: '' }}>
      {(filterProps) => <MachinesPageContent {...filterProps} />}
    </FilterProvider>
  );
}
