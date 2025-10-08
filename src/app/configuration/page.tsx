'use client';

import { useState } from 'react';
import { ConfigurationCategory } from '@prisma/client';
import PageContainer from '@/components/layout/PageContainer';
import SearchFilter from '@/components/ui/SearchFilter';
import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAllConfigurations } from '@/hooks/useConfiguration';
import toast from 'react-hot-toast';

interface Configuration {
  id: string;
  category: ConfigurationCategory;
  value: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels: Record<ConfigurationCategory, string> = {
  AVAILABLE_SKILLS: 'Available Skill',
  MACHINE_TYPES: 'Machine Type',
  TASK_TITLES: 'Task Title',
  TASK_PRIORITY: 'Task Priority',
  OPERATOR_SHIFTS: 'Operator Shift',
};

const categoryTabs = Object.entries(categoryLabels).map(([key, label]) => ({
  key: key as ConfigurationCategory,
  label,
}));

export default function ConfigurationPage() {
  const { configurations, loading, error, refetch } = useAllConfigurations();
  const [activeTab, setActiveTab] = useState<ConfigurationCategory>('AVAILABLE_SKILLS');
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    label: '',
  });

  // Auto-generate value from label
  const generatedValue = formData.label.trim().replace(/\s+/g, '_').toUpperCase();

  // Form validation
  const isFormValid = formData.label.trim() !== '';

  const showError = (message: string) => {
    toast.error(message);
  };

  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const handleCreate = () => {
    setEditingConfig(null);
    setIsCreating(true);
    setFormData({
      label: '',
    });
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (config: Configuration) => {
    setEditingConfig(config);
    setIsCreating(false);
    setFormData({
      label: config.label,
    });
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingConfig(null);
    setIsCreating(false);
    setFormData({
      label: '',
    });
  };

  const handleDelete = (id: string, configLabel?: string) => {
    showConfirmDialog({
      title: 'Delete Configuration',
      message: `Are you sure you want to delete configuration "${configLabel || 'this entry'
        }"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => performDelete(id),
    });
  };

  const performDelete = async (id: string) => {
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

  const handleModalSave = async (data: { category: ConfigurationCategory; value: string; label: string }) => {
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
      handleCancel();
      showSuccess(`Configuration ${isCreating ? 'created' : 'updated'} successfully`);
    } catch (error) {
      console.error(`Error ${isCreating ? 'creating' : 'updating'} configuration:`, error);
      showError(`Failed to ${isCreating ? 'create' : 'update'} configuration`);
    }
  };

  const handleSave = async () => {
    // Additional validation check
    if (!isFormValid) {
      showError('Please fill in all required fields');
      return;
    }

    const data = {
      category: activeTab,
      value: generatedValue,
      label: formData.label.trim(),
    };
    await handleModalSave(data);
  };

  const filteredConfigurations = configurations.filter(
    (config) =>
      config.category === activeTab &&
      (config.value.toLowerCase().includes(searchValue.toLowerCase()) ||
        config.label.toLowerCase().includes(searchValue.toLowerCase())),
  );

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
    <PageContainer customWidth="w-[70%]">
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - Categories */}
        <div className="w-80 bg-white shadow-sm border-r border-gray-200">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuration</h1>

            {/* Category List */}
            <nav className="space-y-2">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === tab.key
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{tab.label}</span>
                    <span className="text-sm text-gray-500">
                      {configurations.filter((c) => c.category === tab.key).length}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{categoryLabels[activeTab]}</h2>
              <p className="text-sm text-gray-500 mt-1">Manage {categoryLabels[activeTab].toLowerCase()}</p>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add {categoryLabels[activeTab]}
            </button>
          </div>

          {/* Search or Form */}
          {isCreating || editingConfig ? (
            <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {isCreating ? `Add New ${categoryLabels[activeTab]}` : `Edit ${categoryLabels[activeTab]}`}
                </h3>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ label: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formData.label.trim() === '' ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="Enter label (e.g., 'Machine Type A')"
                    required
                  />
                  {formData.label.trim() === '' && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                  {generatedValue && (
                    <p className="text-gray-500 text-xs mt-1">
                      Value will be: <span className="font-mono font-semibold">{generatedValue}</span>
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isFormValid}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isFormValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                      }`}>
                    {isCreating ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mb-6">
              <SearchFilter
                searchValue={searchValue}
                onSearch={setSearchValue}
                placeholder="Search configurations..."
              />
            </div>
          )}

          {/* Configuration Items */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredConfigurations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No {categoryLabels[activeTab].toLowerCase()} found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConfigurations.map((config) => (
                <div
                  key={config.id}
                  className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${editingConfig?.id === config.id ? 'ring-2 ring-blue-500' : ''
                    }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{config.label}</h3>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Value: <span className="font-mono">{config.value}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(config)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Edit">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(config.id, config.label)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
