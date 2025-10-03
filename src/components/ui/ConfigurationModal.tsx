import { useState, useEffect } from 'react';
import { ConfigurationCategory } from '@prisma/client';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (configData: { category: ConfigurationCategory; value: string; label: string; sortOrder: number }) => void;
  config?: {
    id: string;
    category: ConfigurationCategory;
    value: string;
    label: string;
    sortOrder: number;
  } | null;
  category: ConfigurationCategory;
  maxSortOrder: number;
  isCreating: boolean;
}

const categoryLabels: Record<ConfigurationCategory, string> = {
  AVAILABLE_SKILLS: 'Skill',
  MACHINE_TYPES: 'Machine Type',
  TASK_TITLES: 'Task Title',
  TASK_PRIORITY: 'Task Priority',
  OPERATOR_SHIFTS: 'Operator Shift',
};

export default function ConfigurationModal({
  isOpen,
  onClose,
  onSave,
  config,
  category,
  maxSortOrder,
  isCreating,
}: ConfigurationModalProps) {
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [sortOrder, setSortOrder] = useState(1);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (config && !isCreating) {
        setValue(config.value);
        setLabel(config.label);
        setSortOrder(config.sortOrder);
      } else {
        setValue('');
        setLabel('');
        setSortOrder(maxSortOrder + 1);
      }
    }
  }, [isOpen, config, isCreating, maxSortOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!value.trim() || !label.trim()) {
      return;
    }

    onSave({
      category,
      value: value.trim(),
      label: label.trim(),
      sortOrder,
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mx-4 border">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {isCreating ? 'Add New' : 'Edit'} {categoryLabels[category]}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isCreating ? 'Create a new' : 'Update the'} {categoryLabels[category].toLowerCase()} configuration
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4">
          <div>
            <label
              htmlFor="value"
              className="block text-sm font-medium text-gray-700 mb-1">
              Value <span className="text-red-500">*</span>
            </label>
            <input
              id="value"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., CNC_MILL"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Internal identifier (use UPPERCASE with underscores)</p>
          </div>

          <div>
            <label
              htmlFor="label"
              className="block text-sm font-medium text-gray-700 mb-1">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., CNC Mill"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Display name shown to users</p>
          </div>

          <div>
            <label
              htmlFor="sortOrder"
              className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Order in which this item appears in lists</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim() || !label.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {isCreating ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
