'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import ImageUpload from '@/components/forms/ImageUpload';
import { checkItemCompletionReadiness, getItemCompletionMessage } from '@/utils/itemValidation';
import { ITEM_STATUS } from '@/config/workshop-properties';
import { logger } from '@/utils/logger';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
}

interface Item {
  id: string;
  name: string;
  description: string;
  status: string;
  quantity: number;
  measure?: string;
  imageUrl?: string | null;
  projectId: string;
  tasks?: Task[];
}

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState<Item>({
    id: '',
    name: '',
    description: '',
    status: 'ACTIVE',
    quantity: 1,
    measure: '',
    imageUrl: null,
    projectId: '',
    tasks: [],
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [statusValidationError, setStatusValidationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch item data and projects in parallel
        const [itemResponse, projectsResponse] = await Promise.all([
          fetch(`/api/items/${params.id}`),
          fetch('/api/projects'),
        ]);

        let itemData = null;
        if (itemResponse.ok) {
          itemData = await itemResponse.json();
          console.log('Loaded item data:', itemData);
          setFormData({
            id: itemData.id,
            name: itemData.name,
            description: itemData.description || '',
            status: itemData.status,
            quantity: itemData.quantity || 1,
            measure: itemData.measure || '',
            imageUrl: itemData.imageUrl || null,
            projectId: itemData.project.id,
            tasks: itemData.tasks || [],
          });
        } else {
          logger.error('Failed to fetch item');
        }

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          // Show active projects, but also include the current item's project if it's not active
          const activeProjects = projectsData.filter((project: Project) => project.status === 'ACTIVE');

          // If item's current project is not in the active list, add it
          if (itemData && itemData.project) {
            const currentProjectInList = activeProjects.find((p: Project) => p.id === itemData.project.id);
            if (!currentProjectInList) {
              // Add the current project to the list so it can be selected
              console.log('Adding current project to list:', itemData.project);
              activeProjects.push(itemData.project);
            }
          }

          setProjects(activeProjects);
        } else {
          logger.error('Failed to fetch projects');
        }
      } catch (error) {
        logger.error('Error fetching data,', error);
      } finally {
        setInitialLoading(false);
        setProjectsLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusValidationError(null);

    try {
      const response = await fetch(`/api/items/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          status: formData.status,
          quantity: formData.quantity,
          measure: formData.measure,
          imageUrl: formData.imageUrl,
          projectId: formData.projectId,
        }),
      });

      if (response.ok) {
        router.push(`/items/${params.id}`);
      } else {
        const errorData = await response.json();

        // Check if this is a validation error for completion status
        if (response.status === 400 && errorData.details) {
          setStatusValidationError(errorData.details);
          // Only log validation errors in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Item completion validation failed:', errorData.details);
          }
        } else {
          const errorMessage = errorData.error || 'Failed to update item';
          setStatusValidationError(errorMessage);
          logger.error('Failed to update item,', errorMessage);
        }
      }
    } catch (error) {
      logger.error('Error updating item,', error);
      setStatusValidationError('An unexpected error occurred');
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

    // Clear validation error when status changes
    if (name === 'status' && statusValidationError) {
      setStatusValidationError(null);
    }
  };

  // Get completion status for the current item
  const completionStatus = formData.tasks ? checkItemCompletionReadiness(formData.tasks) : null;
  const isAttemptingCompletion = formData.status === 'COMPLETED';
  const showCompletionWarning = isAttemptingCompletion && completionStatus && !completionStatus.canComplete;

  return (
    <PageContainer
      variant="form"
      maxWidth="2xl"
      header={{
        title: 'Edit Item',
        description: 'Update item information',
      }}
      loading={initialLoading}
      loadingComponent={
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
      breadcrumbs={formData.name ? [
        { label: 'Items', href: '/items' },
        { label: formData.name, href: `/items/${formData.id}` },
        { label: 'Edit' },
      ] : undefined}>

      {/* Global Error Message */}
      {statusValidationError && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Unable to update item</h3>
              <p className="text-sm text-red-700 mt-1">{statusValidationError}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setStatusValidationError(null)}
                className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:text-red-600">
                <span className="sr-only">Dismiss</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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

          {/* Measurements */}
          <div>
            <label
              htmlFor="measure"
              className="block text-sm font-medium text-gray-700">
              Measurements
            </label>
            <input
              type="text"
              id="measure"
              name="measure"
              value={formData.measure || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 10cm x 5cm x 2cm"
            />
            <p className="mt-1 text-sm text-gray-500">Physical dimensions of the item (optional)</p>
          </div>

          {/* Image Upload */}
          <ImageUpload
            label="Item Image"
            currentImageUrl={formData.imageUrl || null}
            onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
            onImageRemoved={() => setFormData({ ...formData, imageUrl: null })}
            entityType="item"
            entityName={formData.name}
            projectName={projects.find(p => p.id === formData.projectId)?.name}
          />

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              {ITEM_STATUS.map((status) => (
                <option
                  key={status.value}
                  value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            {/* Completion Status Info */}
            {completionStatus && (
              <div className="mt-2">
                {completionStatus.totalTasks > 0 && (
                  <div className="text-sm text-gray-600">
                    Progress: {completionStatus.completedTasks}/{completionStatus.totalTasks} tasks completed (
                    {completionStatus.completionPercentage}%)
                  </div>
                )}

                {showCompletionWarning && (
                  <div className="mt-1 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-amber-400"
                          viewBox="0 0 20 20"
                          fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Completion Requirements</h3>
                        <div className="mt-2 text-sm text-amber-700">{getItemCompletionMessage(completionStatus)}</div>
                        {completionStatus.incompleteTasks.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-amber-800">Incomplete tasks:</p>
                            <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                              {completionStatus.incompleteTasks.map((task) => (
                                <li key={task.id}>
                                  {task.title} (Status: {task.status})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isAttemptingCompletion && completionStatus.canComplete && (
                  <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">Ready for completion</p>
                        <p className="text-sm text-green-700">{getItemCompletionMessage(completionStatus)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading || !formData.name.trim() || !formData.projectId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}>
              {loading ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
