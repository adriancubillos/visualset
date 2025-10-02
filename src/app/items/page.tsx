'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PageContainer from '@/components/layout/PageContainer';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';
import ImageViewer from '@/components/ui/ImageViewer';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import { logger } from '@/utils/logger';
import StatisticsCards from '@/components/ui/StatisticsCards';

// Import the Column type from DataTable
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

interface Item {
  id: string;
  name: string;
  description: string;
  status: string;
  measure?: string;
  imageUrl?: string | null;
  project: {
    id: string;
    name: string;
  };
  _count: {
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Default column configuration
  const defaultColumns: Column<Item>[] = [
    {
      key: 'imageUrl' as keyof Item,
      header: 'Image',
      render: (_: unknown, item: Item) => (
        <ImageViewer
          imageUrl={item.imageUrl}
          alt={item.name}
          size="small"
        />
      ),
    },
    {
      key: 'name' as keyof Item,
      header: 'Item Name',
      render: (value: string, item: Item) => (
        <div>
          <Link
            href={`/items/${item.id}`}
            className="font-medium text-blue-600 hover:text-blue-800">
            {item.name}
          </Link>
          {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
        </div>
      ),
    },
    {
      key: 'project' as keyof Item,
      header: 'Project',
      render: (value: Item['project'], item: Item) => (
        <Link
          href={`/projects/${item.project.id}`}
          className="text-blue-600 hover:text-blue-800">
          {item.project.name}
        </Link>
      ),
    },
    {
      key: 'status' as keyof Item,
      header: 'Status',
      render: (value: string, item: Item) => <StatusBadge status={item.status} />,
    },
    {
      key: '_count' as keyof Item,
      header: 'Tasks',
      render: (value: Item['_count'], item: Item) => (
        <span className="text-sm text-gray-600">
          {item._count.tasks} {item._count.tasks === 1 ? 'task' : 'tasks'}
        </span>
      ),
    },
    {
      key: 'updatedAt' as keyof Item,
      header: 'Last Updated',
      render: (value: string, item: Item) => (
        <span className="text-sm text-gray-500">{new Date(item.updatedAt).toLocaleDateString()}</span>
      ),
    },
  ];

  // Function to restore column order from localStorage
  const getInitialColumns = (): Column<Item>[] => {
    if (typeof window === 'undefined') return defaultColumns;

    try {
      const savedOrder = localStorage.getItem('itemsColumnOrder');
      if (!savedOrder) return defaultColumns;

      const keyOrder = JSON.parse(savedOrder) as (keyof Item)[];
      const columnMap = new Map(defaultColumns.map((col) => [col.key, col]));

      // Reorder columns based on saved order, keeping any new columns at the end
      const reorderedColumns = keyOrder
        .map((key) => columnMap.get(key))
        .filter((col): col is Column<Item> => col !== undefined);

      // Add any new columns that weren't in the saved order
      const usedKeys = new Set(keyOrder);
      const newColumns = defaultColumns.filter((col) => !usedKeys.has(col.key));

      return [...reorderedColumns, ...newColumns];
    } catch {
      return defaultColumns;
    }
  };

  const [columns, setColumns] = useState<Column<Item>[]>(getInitialColumns());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsResponse, projectsResponse] = await Promise.all([fetch('/api/items'), fetch('/api/projects')]);

        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setItems(itemsData);
          setFilteredItems(itemsData);
        } else {
          logger.error('Failed to fetch items');
        }

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        } else {
          logger.error('Failed to fetch projects');
        }
      } catch (error) {
        logger.error('Error fetching data,', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (query: string) => {
    const filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.project.name.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredItems(filtered);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = items;

    if (filters.project) {
      filtered = filtered.filter((item) => item.project.id === filters.project);
    }

    if (filters.status) {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    setFilteredItems(filtered);
  };

  const handleDelete = (id: string, itemName?: string) => {
    showConfirmDialog({
      title: 'Delete Item',
      message: `Are you sure you want to delete item "${itemName || 'this item'}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => performDelete(id),
    });
  };

  const performDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedItems = items.filter((item) => item.id !== id);
        setItems(updatedItems);
        setFilteredItems(updatedItems.filter((item) => filteredItems.some((filtered) => filtered.id === item.id)));
        toast.success('Item deleted successfully');
      } else {
        const errorData = await response.json();
        logger.apiError('Delete item', `/api/items/${id}`, errorData.error);
        toast.error('Failed to delete: ' + errorData.error);
      }
    } catch (error) {
      logger.error('Error deleting item', error);
      toast.error('Error deleting item' + error);
    }
  };

  const handleColumnReorder = (newColumnOrder: Column<Item>[]) => {
    setColumns(newColumnOrder);
    // Save column order to localStorage
    localStorage.setItem('itemsColumnOrder', JSON.stringify(newColumnOrder.map((col: Column<Item>) => col.key)));
  };

  const resetColumnOrder = () => {
    setColumns(defaultColumns);
    localStorage.removeItem('itemsColumnOrder');
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ON_HOLD', label: 'On Hold' },
  ];

  const filters = [
    {
      key: 'project',
      label: 'All Projects',
      options: projects
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((project) => ({
          value: project.id,
          label: project.name,
        })),
    },
    {
      key: 'status',
      label: 'All Statuses',
      options: statusOptions,
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Items',
        description: 'Manage project items and their associated tasks',
        actions: (
          <Link
            href="/items/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <span className="mr-2">+</span>
            Add Item
          </Link>
        ),
      }}
      variant="list">
      {/* Stats */}
      <StatisticsCards
        stats={[
          { label: 'Total Items', value: items.length, color: 'gray' },
          { label: 'Active', value: items.filter((item) => item.status === 'ACTIVE').length, color: 'green' },
          { label: 'Completed', value: items.filter((item) => item.status === 'COMPLETED').length, color: 'blue' },
          { label: 'On Hold', value: items.filter((item) => item.status === 'ON_HOLD').length, color: 'orange' },
        ]}
        loading={loading}
        columns={4}
      />

      {/* Search and Filters */}
      <SearchFilter
        placeholder="Search items by name, description, or project..."
        onSearch={handleSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Items Table */}
      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={filteredItems}
          columns={columns}
          loading={loading}
          maxHeight="70vh"
          onColumnReorder={handleColumnReorder}
          onResetColumns={resetColumnOrder}
          showResetColumns={true}
          actions={(item: Item) => (
            <TableActions
              itemId={item.id}
              itemName={item.name}
              editPath={`/items/${item.id}/edit`}
              onDelete={handleDelete}
            />
          )}
        />
      </div>
    </PageContainer>
  );
}
