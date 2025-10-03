'use client';

import { useState } from 'react';
import { ConfigurationCategory } from '@prisma/client';
import PageContainer from '@/components/layout/PageContainer';
import DataTable from '@/components/ui/DataTable';
import SearchFilter from '@/components/ui/SearchFilter';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfigurationModal from '@/components/ui/ConfigurationModal';
import { useAllConfigurations } from '@/hooks/useConfiguration';
import { Column } from '@/types/table';
import toast from 'react-hot-toast';

interface Configuration {
  id: string;
  category: ConfigurationCategory;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels: Record<ConfigurationCategory, string> = {
  AVAILABLE_SKILLS: 'Available Skills',
  MACHINE_TYPES: 'Machine Types',
  TASK_TITLES: 'Task Titles',
  TASK_PRIORITY: 'Task Priority',
  OPERATOR_SHIFTS: 'Operator Shifts',
};

const categoryTabs = Object.entries(categoryLabels).map(([key, label]) => ({
  key: key as ConfigurationCategory,
  label,
}));

export default function ConfigurationPage() {
  const { configurations, loading, error, refetch } = useAllConfigurations();
  const [activeTab, setActiveTab] = useState<ConfigurationCategory>('AVAILABLE_SKILLS');
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const showError = (message: string) => {
    toast.error(message);
  };

  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const handleCreate = () => {
    setEditingConfig(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleEdit = (config: Configuration) => {
    setEditingConfig(config);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/configuration/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      refetch();
      showSuccess('Configuration deleted successfully');
    } catch (error) {
      console.error('Error deleting configuration:', error);
      showError('Failed to delete configuration');
    }
  };

  const handleModalSave = async (data: {
    category: ConfigurationCategory;
    value: string;
    label: string;
    sortOrder: number;
  }) => {
    try {
      const method = isCreating ? 'POST' : 'PUT';
      const url = isCreating ? '/api/configuration' : `/api/configuration/${editingConfig?.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isCreating ? 'create' : 'update'} configuration`);
      }

      refetch();
      setIsModalOpen(false);
      setEditingConfig(null);
      showSuccess(`Configuration ${isCreating ? 'created' : 'updated'} successfully`);
    } catch (error) {
      console.error(`Error ${isCreating ? 'creating' : 'updating'} configuration:`, error);
      showError(`Failed to ${isCreating ? 'create' : 'update'} configuration`);
    }
  };

  const filteredConfigurations = configurations.filter(
    (config) =>
      config.category === activeTab &&
      (config.value.toLowerCase().includes(searchValue.toLowerCase()) ||
        config.label.toLowerCase().includes(searchValue.toLowerCase())),
  );

  const maxSortOrder = Math.max(0, ...configurations.filter((c) => c.category === activeTab).map((c) => c.sortOrder));

  const columns: Column<Configuration>[] = [
    {
      key: 'value',
      header: 'Value',
    },
    {
      key: 'label',
      header: 'Label',
    },
    {
      key: 'sortOrder',
      header: 'Sort Order',
      render: (value: number) => <span className="text-sm text-gray-600">{value}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (value: boolean) => (
        <StatusBadge
          status={value ? 'active' : 'inactive'}
          variant={value ? 'success' : 'default'}
        />
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (value: string, item: Configuration) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(item)}
            className="text-blue-600 hover:text-blue-800 text-sm">
            Edit
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="text-red-600 hover:text-red-800 text-sm">
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <PageContainer>
        <div className="text-center text-red-600">
          <h2 className="text-xl font-semibold">Error Loading Configurations</h2>
          <p>{error}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Add Configuration
          </button>
        </div>

        {/* Category Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {categoryTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <SearchFilter
              searchValue={searchValue}
              onSearch={setSearchValue}
              placeholder="Search configurations..."
            />
          </div>
        </div>

        <DataTable
          data={filteredConfigurations}
          columns={columns}
          loading={loading}
        />

        <ConfigurationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingConfig(null);
          }}
          onSave={handleModalSave}
          config={editingConfig}
          category={activeTab}
          maxSortOrder={maxSortOrder}
          isCreating={isCreating}
        />
      </div>
    </PageContainer>
  );
}
