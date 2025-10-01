'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import { logger } from '@/utils/logger';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
}

export default function NewItemPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    quantity: 1,
    projectId: '',
  });
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          // Only show active projects
          const activeProjects = data.filter((project: Project) => project.status === 'ACTIVE');
          setProjects(activeProjects);
        } else {
          logger.apiError('Fetch projects', '/api/projects', 'Failed to fetch');
        }
      } catch (error) {
        logger.error('Error fetching projects', error);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/items');
      } else {
        const errorData = await response.json();
        logger.apiError('Create item', '/api/items', errorData.error);
      }
    } catch (error) {
      logger.error('Error creating item', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value,
    }));
  };

  return (
    <PageContainer
      variant="form"
      maxWidth="2xl"
      header={{
        title: 'Add Item',
        description: 'Create a new item within a project',
      }}>
      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6">
          {/* Project Selection */}
          <div>
            <label
              htmlFor="projectId"
              className="block text-sm font-medium text-gray-700">
              Project *
            </label>
            <select
              id="projectId"
              name="projectId"
              required
              value={formData.projectId}
              onChange={handleChange}
              disabled={projectsLoading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">{projectsLoading ? 'Loading projects...' : 'Select a project'}</option>
              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {projects.length === 0 && !projectsLoading && (
              <p className="mt-2 text-sm text-red-600">No active projects found. Please create a project first.</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700">
              Item Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter item name"
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
              placeholder="Enter item description (optional)"
            />
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700">
              Item Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="1"
            />
            <p className="mt-1 text-sm text-gray-500">Total number of this item to be produced</p>
          </div>

          {/* Status */}
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
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
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
              disabled={loading || !formData.name.trim() || !formData.projectId}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading || !formData.name.trim() || !formData.projectId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}>
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
