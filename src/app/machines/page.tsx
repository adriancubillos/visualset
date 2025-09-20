'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';
import StatisticsCards from '@/components/ui/StatisticsCards';
import { MachineColorIndicator } from '@/components/ui/ColorIndicator';
import { MACHINE_TYPES, MACHINE_STATUS } from '@/config/workshop-properties';

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

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch('/api/machines');
        if (response.ok) {
          const data = await response.json();
          setMachines(data);
          setFilteredMachines(data);
        } else {
          console.error('Failed to fetch machines');
        }
      } catch (error) {
        console.error('Error fetching machines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  const handleSearch = (query: string) => {
    const filtered = machines.filter(
      (machine) =>
        machine.name.toLowerCase().includes(query.toLowerCase()) ||
        machine.type.toLowerCase().includes(query.toLowerCase()) ||
        machine.location.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredMachines(filtered);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = machines;

    if (filters.status) {
      filtered = filtered.filter((machine) => machine.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter((machine) => machine.type === filters.type);
    }

    if (filters.location) {
      filtered = filtered.filter((machine) => machine.location === filters.location);
    }

    setFilteredMachines(filtered);
  };

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

  const formatMachineType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const columns = [
    {
      key: 'color' as keyof Machine,
      header: '',
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
      key: 'name' as keyof Machine,
      header: 'Machine Name',
      sortable: true,
    },
    {
      key: 'type' as keyof Machine,
      header: 'Type',
      sortable: true,
      render: (type: string) => formatMachineType(type),
    },
    {
      key: 'status' as keyof Machine,
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
      key: 'location' as keyof Machine,
      header: 'Location',
      sortable: true,
    },
    {
      key: 'updatedAt' as keyof Machine,
      header: 'Last Updated',
      sortable: true,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Filter by Status',
      options: MACHINE_STATUS.map((status) => ({
        value: status.value,
        label: status.label,
      })),
    },
    {
      key: 'type',
      label: 'Filter by Type',
      options: MACHINE_TYPES.map((type) => ({
        value: type.value,
        label: type.label,
      })),
    },
    {
      key: 'location',
      label: 'Filter by Location',
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

  const handleDelete = async (machineId: string, machineName?: string) => {
    if (confirm(`Are you sure you want to delete machine "${machineName || 'this machine'}"?`)) {
      try {
        const response = await fetch(`/api/machines/${machineId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove machine from local state to update UI immediately
          const updatedMachines = machines.filter((m) => m.id !== machineId);
          setMachines(updatedMachines);
          setFilteredMachines(updatedMachines);
        } else {
          const errorData = await response.json();
          console.error('Failed to delete machine:', errorData.error);
          alert('Failed to delete machine: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting machine:', error);
        alert('Error deleting machine. Please try again.');
      }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Machines</h1>
          <p className="mt-2 text-gray-600">Monitor and manage workshop machines</p>
        </div>
        <Link
          href="/machines/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <span className="mr-2">+</span>
          Add Machine
        </Link>
      </div>

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
        onSearch={handleSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Machines Table */}
      <DataTable
        data={filteredMachines}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        actions={renderActions}
      />
    </div>
  );
}
