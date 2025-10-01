'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import VisualIdentifier from '@/components/ui/VisualIdentifier';
import { PatternType } from '@/utils/entityColors';
import { MACHINE_TYPES, MACHINE_STATUS } from '@/config/workshop-properties';
import { logger } from '@/utils/logger';

export default function NewMachinePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    type: MACHINE_TYPES[0].value,
    status: 'AVAILABLE',
    location: '',
    color: '#ef4444', // Red - first color in palette
    pattern: 'solid' as PatternType,
  });
  const [loading, setLoading] = useState(false);
  const [isColorPatternValid, setIsColorPatternValid] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/machines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/machines');
      } else {
        logger.error('Failed to create machine');
      }
    } catch (error) {
      logger.error('Error creating machine,', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const handlePatternChange = (pattern: PatternType) => {
    setFormData((prev) => ({ ...prev, pattern }));
  };

  return (
    <PageContainer
      header={{
        title: 'Add Machine',
        description: 'Register a new machine in the workshop',
      }}
      variant="form">
      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6">
          {/* Machine Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700">
              Machine Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., CNC-001, DRILL-002"
            />
          </div>

          {/* Machine Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700">
              Machine Type *
            </label>
            <select
              id="type"
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              {MACHINE_TYPES.map((type) => (
                <option
                  key={type.value}
                  value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700">
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Workshop A, Bay 3"
            />
          </div>

          {/* Visual Identifier */}
          <VisualIdentifier
            color={formData.color}
            pattern={formData.pattern}
            onColorChange={handleColorChange}
            onPatternChange={handlePatternChange}
            previewName={formData.name || 'New Machine'}
            entityType="machine"
            onValidationChange={setIsColorPatternValid}
          />

          {/* Initial Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700">
              Initial Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              {MACHINE_STATUS.map((status) => (
                <option
                  key={status.value}
                  value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.name.trim() ||
                !formData.location.trim() ||
                !formData.color ||
                !formData.pattern ||
                !isColorPatternValid
              }
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ||
                  !formData.name.trim() ||
                  !formData.location.trim() ||
                  !formData.color ||
                  !formData.pattern ||
                  !isColorPatternValid
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}>
              {loading ? 'Adding...' : 'Add Machine'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
