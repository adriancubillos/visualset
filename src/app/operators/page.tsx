'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PageContainer from '@/components/layout/PageContainer';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';
import { OperatorColorIndicator } from '@/components/ui/ColorIndicator';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import { logger } from '@/utils/logger';
import { extractErrorMessage, getErrorMessage } from '@/utils/errorHandling';
import StatisticsCards from '@/components/ui/StatisticsCards';
import { OPERATOR_STATUS } from '@/config/workshop-properties';
import { useAvailableSkills, useOperatorShifts } from '@/hooks/useConfiguration';
import { Column } from '@/types/table';
import FilterProvider from '@/components/layout/FilterProvider';

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
// Function to create columns with access to configuration data
const createColumns = (availableSkills: { value: string; label: string }[]): Column<Operator>[] => [
  {
    key: 'color',
    header: 'Color',
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
    align: 'left',
    sortable: true,
  },
  {
    key: 'email',
    header: 'Email',
    align: 'left',
    sortable: true,
  },
  {
    key: 'skills',
    header: 'Skills',
    align: 'left',
    sortable: false,
    render: (skills: string[]) => {
      // Convert skill values to labels
      const getSkillLabel = (skillValue: string) => {
        const skill = availableSkills.find((s) => s.value === skillValue);
        return skill?.label || skillValue;
      };

      return (
        <div className="flex flex-wrap gap-1">
          {skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getSkillLabel(skill)}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              +{skills.length - 3}
            </span>
          )}
        </div>
      );
    },
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
const getInitialColumns = (baseColumns: Column<Operator>[]): Column<Operator>[] => {
  if (typeof window === 'undefined') return baseColumns;

  try {
    const saved = localStorage.getItem('operatorsColumnOrder');
    if (!saved) return baseColumns;

    const savedOrder = JSON.parse(saved);
    if (!Array.isArray(savedOrder)) return baseColumns;

    // Reorder columns based on saved order
    const orderedColumns: Column<Operator>[] = [];

    // Add columns in saved order
    for (const savedCol of savedOrder) {
      const matchingColumn = baseColumns.find(
        (col: Column<Operator>) => (col.id || col.key) === (savedCol.id || savedCol.key),
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

function OperatorsPageContent({
  search,
  searchValue,
  filters,
  updateSearch,
  updateFilters,
  clearAll,
}: ReturnType<typeof import('@/hooks/useSimpleFilters').useSimpleFilters>) {
  const { options: availableSkills } = useAvailableSkills();
  const { options: operatorShifts } = useOperatorShifts();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  // Create columns with access to configuration data
  const baseColumns = useMemo(() => createColumns(availableSkills), [availableSkills]);
  const [columns, setColumns] = useState<Column<Operator>[]>([]);
  const [columnsInitialized, setColumnsInitialized] = useState(false);

  // Initialize columns once when baseColumns is ready
  useEffect(() => {
    if (!columnsInitialized && availableSkills.length > 0) {
      setColumns(getInitialColumns(baseColumns));
      setColumnsInitialized(true);
    }
  }, [baseColumns, columnsInitialized, availableSkills.length]);

  // Filter operators based on search and filters
  const filteredOperators = useMemo(() => {
    let filtered = operators;

    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(
        (operator) =>
          operator.name.toLowerCase().includes(search.toLowerCase()) ||
          operator.email?.toLowerCase().includes(search.toLowerCase()) ||
          operator.shift.toLowerCase().includes(search.toLowerCase()) ||
          operator.skills.some((skill) => skill.toLowerCase().includes(search.toLowerCase())),
      );
    }

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter((operator) => operator.status === filters.status);
    }

    if (filters.shift) {
      filtered = filtered.filter((operator) => operator.shift === filters.shift);
    }

    if (filters.skill) {
      filtered = filtered.filter((operator) => operator.skills.includes(filters.skill));
    }

    return filtered;
  }, [operators, search, filters]);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await fetch('/api/operators');
        if (response.ok) {
          const data = await response.json();
          setOperators(data);
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
    setColumns(baseColumns);
    setColumnsInitialized(false);
    localStorage.removeItem('operatorsColumnOrder');
    // Re-initialize with base columns
    setTimeout(() => {
      setColumns(getInitialColumns(baseColumns));
      setColumnsInitialized(true);
    }, 0);
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
      options: operatorShifts.map((shift) => ({
        value: shift.value,
        label: shift.label,
      })),
    },
    {
      key: 'skill',
      label: 'All Skills',
      options: availableSkills.map((skill) => ({
        value: skill.value,
        label: skill.label,
      })),
    },
  ];

  const handleRowClick = (operator: Operator) => {
    window.location.href = `/operators/${operator.id}`;
  };

  const handleDelete = (operatorId: string, operatorName?: string) => {
    showConfirmDialog({
      title: 'Delete Operator',
      message: `Are you sure you want to delete operator "${
        operatorName || 'this operator'
      }"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => performDelete(operatorId, operatorName),
    });
  };

  const performDelete = async (operatorId: string, operatorName?: string) => {
    try {
      const response = await fetch(`/api/operators/${operatorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedOperators = operators.filter((op) => op.id !== operatorId);
        setOperators(updatedOperators);
        toast.success('Operator deleted successfully');
      } else {
        const errorMessage = await extractErrorMessage(response, 'Failed to delete operator');
        logger.error('Failed to delete operator:', errorMessage);

        if (errorMessage.includes('assigned tasks')) {
          toast.error(
            `Cannot delete "${operatorName}". This operator is currently assigned to one or more tasks. Please unassign or delete those tasks first.`,
            { duration: 6000 },
          );
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      logger.error('Error deleting operator:', error);
      toast.error(getErrorMessage(error, 'Error deleting operator'));
    }
  };

  const renderActions = (operator: Operator) => (
    <TableActions
      itemId={operator.id}
      itemName={operator.name}
      editPath={`/operators/${operator.id}/edit`}
      onDelete={handleDelete}
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
        searchValue={searchValue}
        filterValues={filters}
        onSearch={updateSearch}
        filters={filterOptions}
        onFilterChange={updateFilters}
        clearAll={clearAll}
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

export default function OperatorsPage() {
  return (
    <FilterProvider defaultFilters={{ status: '', shift: '', skill: '' }}>
      {(filterProps) => <OperatorsPageContent {...filterProps} />}
    </FilterProvider>
  );
}
