'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';

interface Item {
  id: string;
  name: string;
  description: string;
  status: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/items');
        if (response.ok) {
          const data = await response.json();
          setItems(data);
          setFilteredItems(data);
        } else {
          console.error('Failed to fetch items');
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
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

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) => item.status === status);
      setFilteredItems(filtered);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`/api/items/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const updatedItems = items.filter((item) => item.id !== id);
          setItems(updatedItems);
          setFilteredItems(updatedItems.filter((item) => filteredItems.some((filtered) => filtered.id === item.id)));
        } else {
          console.error('Failed to delete item');
        }
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const columns = [
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

  const statusOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ON_HOLD', label: 'On Hold' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Items</h1>
          <p className="mt-2 text-gray-600">Manage project items and their associated tasks</p>
        </div>
        <Link
          href="/items/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Add New Item
        </Link>
      </div>

      {/* Stats */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{items.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {items.filter((item) => item.status === 'ACTIVE').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {items.filter((item) => item.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {items.filter((item) => item.status === 'ON_HOLD').length}
            </div>
            <div className="text-sm text-gray-600">On Hold</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchFilter
            onSearch={handleSearch}
            placeholder="Search items by name, description, or project..."
          />
        </div>
        <div className="sm:w-48">
          <select
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={filteredItems}
          columns={columns}
          loading={loading}
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
    </div>
  );
}
