'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';
import { OperatorColorIndicator } from '@/components/ui/ColorIndicator';

interface Operator {
  id: string;
  name: string;
  email: string;
  skills: string[];
  status: string;
  shift: string;
  color?: string | null;
  pattern?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await fetch('/api/operators');
        if (response.ok) {
          const data = await response.json();
          setOperators(data);
          setFilteredOperators(data);
        } else {
          console.error('Failed to fetch operators');
        }
      } catch (error) {
        console.error('Error fetching operators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOperators();
  }, []);

  const handleSearch = (query: string) => {
    const filtered = operators.filter(
      (operator) =>
        operator.name.toLowerCase().includes(query.toLowerCase()) ||
        operator.email.toLowerCase().includes(query.toLowerCase()) ||
        operator.skills.some((skill) => skill.toLowerCase().includes(query.toLowerCase())),
    );
    setFilteredOperators(filtered);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = operators;

    if (filters.status) {
      filtered = filtered.filter((operator) => operator.status === filters.status);
    }

    if (filters.shift) {
      filtered = filtered.filter((operator) => operator.shift === filters.shift);
    }

    if (filters.skill) {
      filtered = filtered.filter((operator) => operator.skills.includes(filters.skill));
    }

    setFilteredOperators(filtered);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ON_LEAVE':
        return 'warning';
      case 'INACTIVE':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatSkills = (skills: string[]) => {
    return skills.map((skill) => skill.replace(/_/g, ' ')).join(', ');
  };

  const columns = [
    {
      key: 'color' as keyof Operator,
      header: '',
      render: (_: unknown, operator: Operator) => (
        <OperatorColorIndicator
          operator={operator}
          size="md"
          showTooltip={true}
          tooltipText={`${operator.name} color`}
        />
      ),
    },
    {
      key: 'name' as keyof Operator,
      header: 'Name',
      sortable: true,
    },
    {
      key: 'email' as keyof Operator,
      header: 'Email',
      sortable: true,
    },
    {
      key: 'skills' as keyof Operator,
      header: 'Skills',
      sortable: false,
      render: (skills: string[]) => <span className="text-sm text-gray-600">{formatSkills(skills)}</span>,
    },
    {
      key: 'status' as keyof Operator,
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
      key: 'shift' as keyof Operator,
      header: 'Shift',
      sortable: true,
      render: (shift: string) => <span className="capitalize">{shift ? shift.toLowerCase() : 'Unknown'}</span>,
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Filter by Status',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'ON_LEAVE', label: 'On Leave' },
        { value: 'INACTIVE', label: 'Inactive' },
      ],
    },
    {
      key: 'shift',
      label: 'Filter by Shift',
      options: [
        { value: 'DAY', label: 'Day' },
        { value: 'EVENING', label: 'Evening' },
        { value: 'NIGHT', label: 'Night' },
      ],
    },
    {
      key: 'skill',
      label: 'Filter by Skill',
      options: [
        { value: 'CNC_MILL', label: 'CNC Mill' },
        { value: 'CNC_LATHE', label: 'CNC Lathe' },
        { value: 'WELDING', label: 'Welding' },
        { value: 'GRINDER', label: 'Grinder' },
        { value: 'DRILL_PRESS', label: 'Drill Press' },
        { value: 'BANDSAW', label: 'Bandsaw' },
      ],
    },
  ];

  const handleRowClick = (operator: Operator) => {
    window.location.href = `/operators/${operator.id}`;
  };

  const handleDelete = async (operatorId: string, operatorName?: string) => {
    if (confirm(`Are you sure you want to delete operator "${operatorName || 'this operator'}"?`)) {
      try {
        const response = await fetch(`/api/operators/${operatorId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove operator from local state to update UI immediately
          const updatedOperators = operators.filter((op) => op.id !== operatorId);
          setOperators(updatedOperators);
          setFilteredOperators(updatedOperators);
        } else {
          const errorData = await response.json();
          console.error('Failed to delete operator:', errorData.error);
          alert('Failed to delete operator: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting operator:', error);
        alert('Error deleting operator. Please try again.');
      }
    }
  };

  const handleStatusChange = async (operatorId: string, newStatus: string) => {
    try {
      const operator = operators.find((op) => op.id === operatorId);
      if (!operator) return;

      const response = await fetch(`/api/operators/${operatorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...operator,
          status: newStatus,
        }),
      });

      if (response.ok) {
        const updatedOperator = await response.json();
        const updatedOperators = operators.map((op) => (op.id === operatorId ? updatedOperator : op));
        setOperators(updatedOperators);
        setFilteredOperators(updatedOperators);
      } else {
        const errorData = await response.json();
        console.error('Failed to update operator status:', errorData.error);
        alert('Failed to update operator status: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating operator status:', error);
      alert('Error updating operator status. Please try again.');
    }
  };

  const renderActions = (operator: Operator) => (
    <TableActions
      itemId={operator.id}
      itemName={operator.name}
      editPath={`/operators/${operator.id}/edit`}
      onDelete={handleDelete}
      extraActions={
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newStatus = operator.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            handleStatusChange(operator.id, newStatus);
          }}
          className="text-green-600 hover:text-green-900 text-sm font-medium">
          {operator.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </button>
      }
    />
  );

  // Calculate statistics
  const stats = {
    total: operators.length,
    active: operators.filter((o) => o.status === 'ACTIVE').length,
    onLeave: operators.filter((o) => o.status === 'ON_LEAVE').length,
    inactive: operators.filter((o) => o.status === 'INACTIVE').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operators</h1>
          <p className="mt-2 text-gray-600">Manage workshop operators and their skills</p>
        </div>
        <Link
          href="/operators/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <span className="mr-2">+</span>
          Add Operator
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Operators</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.onLeave}</div>
          <div className="text-sm text-gray-500">On Leave</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          <div className="text-sm text-gray-500">Inactive</div>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchFilter
        placeholder="Search operators..."
        onSearch={handleSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Operators Table */}
      <DataTable
        data={filteredOperators}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        actions={renderActions}
      />
    </div>
  );
}
