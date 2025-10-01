'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';
import { OperatorColorIndicator } from '@/components/ui/ColorIndicator';
import StatisticsCards from '@/components/ui/StatisticsCards';
import { AVAILABLE_SKILLS, OPERATOR_STATUS, OPERATOR_SHIFTS } from '@/config/workshop-properties';
import { logger } from '@/utils/logger';

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

// Default column configuration
const defaultColumns: Column<Operator>[] = [
  {
    key: 'color',
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
    key: 'name',
    header: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    header: 'Email',
    sortable: true,
  },
  {
    key: 'skills',
    header: 'Skills',
    sortable: false,
    render: (skills: string[]) => (
      <div className="flex flex-wrap gap-1">
        {skills.slice(0, 3).map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {skill}
          </span>
        ))}
        {skills.length > 3 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            +{skills.length - 3}
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (status: string) => {
      const getStatusVariant = (status: string) => {
        switch (status) {
          case 'ACTIVE':
            return 'success';
          case 'INACTIVE':
            return 'error';
          case 'ON_LEAVE':
            return 'warning';
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
    key: 'shift',
    header: 'Shift',
    sortable: true,
    render: (shift: string) => shift.replace(/_/g, ' '),
  },
];

// Function to get initial column order from localStorage
const getInitialColumns = (): Column<Operator>[] => {
  if (typeof window === 'undefined') return defaultColumns;

  try {
    const saved = localStorage.getItem('operatorsColumnOrder');
    if (!saved) return defaultColumns;

    const savedOrder = JSON.parse(saved);
    if (!Array.isArray(savedOrder)) return defaultColumns;

    // Reorder columns based on saved order
    const orderedColumns: Column<Operator>[] = [];

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
    logger.error('Error loading column order', error);
    return defaultColumns;
  }
};

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<Column<Operator>[]>(getInitialColumns);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await fetch('/api/operators');
        if (response.ok) {
          const data = await response.json();
          setOperators(data);
          setFilteredOperators(data);
        } else {
          logger.apiError('Fetch operators', '/api/operators', 'Failed to fetch');
        }
      } catch (error) {
        logger.error('Error fetching operators', error);
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

  // Column management functions
  const handleColumnReorder = (reorderedColumns: Column<Operator>[]) => {
    setColumns(reorderedColumns);
    localStorage.setItem(
      'operatorsColumnOrder',
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
    localStorage.removeItem('operatorsColumnOrder');
  };

  // Dynamic filters based on current data
  const filterOptions = [
    {
      key: 'status',
      label: 'All Statuses',
      options: OPERATOR_STATUS.map((status) => ({
        value: status.value,
        label: status.label,
      })),
    },
    {
      key: 'shift',
      label: 'All Shifts',
      options: OPERATOR_SHIFTS.map((shift) => ({
        value: shift.value,
        label: shift.label,
      })),
    },
    {
      key: 'skill',
      label: 'All Skills',
      options: AVAILABLE_SKILLS.map((skill) => ({
        value: skill.value,
        label: skill.label,
      })),
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
          
          // Show user-friendly error message
          if (errorData.error?.includes('assigned tasks')) {
            alert(`Cannot delete "${operatorName}"\n\nThis operator is currently assigned to one or more tasks. Please unassign or delete those tasks first.`);
          } else {
            alert('Failed to delete operator: ' + (errorData.error || 'Unknown error'));
          }
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
        logger.apiError('Update operator status', `/api/operators/${operatorId}`, errorData.error);
        alert('Failed to update operator status: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      logger.error('Error updating operator status', error);
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
    <PageContainer
      header={{
        title: 'Operators',
        description: 'Manage workshop operators and their skills',
        actions: (
          <Link
            href="/operators/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <span className="mr-2">+</span>
            Add Operator
          </Link>
        ),
      }}
      variant="list">
      {/* Statistics Cards */}
      <StatisticsCards
        stats={[
          { label: 'Total Operators', value: stats.total, color: 'gray' },
          { label: 'Active', value: stats.active, color: 'green' },
          { label: 'On Leave', value: stats.onLeave, color: 'yellow' },
          { label: 'Inactive', value: stats.inactive, color: 'red' },
        ]}
        loading={loading}
        columns={4}
      />

      {/* Search and Filters */}
      <SearchFilter
        placeholder="Search operators..."
        onSearch={handleSearch}
        filters={filterOptions}
        onFilterChange={handleFilterChange}
      />

      {/* Operators Table */}
      <DataTable
        data={filteredOperators}
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
