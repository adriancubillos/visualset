'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ColorPicker from '@/components/ui/ColorPicker';
import ImageUpload from '@/components/forms/ImageUpload';
import PageContainer from '@/components/layout/PageContainer';
import { PROJECT_STATUS } from '@/config/workshop-properties';
import { logger } from '@/utils/logger';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    orderNumber: '',
    status: 'ACTIVE',
    color: '',
    imageUrl: null as string | null,
  });
  const [loading, setLoading] = useState(false);
  const [usedColors, setUsedColors] = useState<string[]>([]);
  const [colorError, setColorError] = useState('');

  // Fetch used colors on component mount
  useEffect(() => {
    const fetchUsedColors = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const projects = await response.json();
          const colors = projects
            .map((project: { color?: string }) => project.color)
            .filter((color: string | undefined): color is string => color !== null && color !== undefined);
          setUsedColors(colors);
        }
      } catch (error) {
        logger.error('Error fetching used colors,', error);
      }
    };

    fetchUsedColors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setColorError('');

    // Validate color uniqueness
    if (formData.color && usedColors.includes(formData.color)) {
      setColorError('This color is already in use by another project');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/projects');
      } else {
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.includes('Color is already in use')) {
            setColorError('This color is already in use by another project');
          } else {
            logger.error('Failed to create project,', errorData);
          }
        } catch {
          logger.error('Failed to create project - Server error');
          logger.error('Response status,', response.status);
        }
      }
    } catch (error) {
      logger.error('Error creating project,', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
    setColorError('');
  };

  return (
    <PageContainer
      variant="form"
      maxWidth="2xl"
      header={{
        title: 'Add Project',
        description: 'Add a new project to your portfolio',
      }}>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6">
          {/* Project Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter project name"
            />
          </div>

          {/* Order Number */}
          <div>
            <label
              htmlFor="orderNumber"
              className="block text-sm font-medium text-gray-700">
              Order Number
            </label>
            <input
              type="text"
              name="orderNumber"
              id="orderNumber"
              value={formData.orderNumber}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter order number (optional)"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter project description"
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700">
              Initial Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required>
              <option value="">Select Status</option>
              {PROJECT_STATUS.map((status) => (
                <option
                  key={status.value}
                  value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <ColorPicker
            selectedColor={formData.color}
            onColorChange={handleColorChange}
            usedColors={usedColors}
            error={colorError}
          />

          {/* Image Upload */}
          <ImageUpload
            label="Project Image"
            currentImageUrl={formData.imageUrl}
            onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
            onImageRemoved={() => setFormData({ ...formData, imageUrl: null })}
            entityType="project"
            entityName={formData.name}
          />

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
              disabled={loading || !formData.name.trim()}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading || !formData.name.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
