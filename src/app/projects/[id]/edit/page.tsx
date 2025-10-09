'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ColorPicker from '@/components/ui/ColorPicker';
import ImageUpload from '@/components/forms/ImageUpload';
import PageContainer from '@/components/layout/PageContainer';
import { PROJECT_STATUS } from '@/config/workshop-properties';
import { checkProjectCompletionReadiness, getProjectCompletionMessage } from '@/utils/projectValidation';
import { logger } from '@/utils/logger';
import { cleanupImageOnCancel } from '@/utils/imageCleanup';

interface Item {
  id: string;
  name: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  orderNumber?: string | null;
  status: string;
  color?: string;
  imageUrl?: string | null;
  items?: Item[];
  createdAt: string;
  updatedAt: string;
}

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    orderNumber: '',
    status: 'ACTIVE',
    color: '',
    imageUrl: null as string | null,
    items: [] as Item[],
  });
  const [usedColors, setUsedColors] = useState<string[]>([]);
  const [colorError, setColorError] = useState('');
  const [statusValidationError, setStatusValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [newUploadedImageUrl, setNewUploadedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project data and used colors in parallel
        const [projectResponse, colorsResponse] = await Promise.all([
          fetch(`/api/projects/${params.id}`),
          fetch('/api/projects'),
        ]);

        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project');
        }

        const projectData = await projectResponse.json();
        const allProjects = colorsResponse.ok ? await colorsResponse.json() : [];

        // Get used colors excluding current project
        const usedColorsList = allProjects
          .filter((p: { id: string; color?: string }) => p.id !== params.id && p.color)
          .map((p: { color: string }) => p.color);

        setProject(projectData);
        setUsedColors(usedColorsList);
        setOriginalImageUrl(projectData.imageUrl || null); // Store original for cancel restoration
        setOriginalStatus(projectData.status); // Store original status
        setFormData({
          name: projectData.name,
          description: projectData.description || '',
          orderNumber: projectData.orderNumber || '',
          status: projectData.status,
          color: projectData.color || '',
          imageUrl: projectData.imageUrl || null,
          items: projectData.items || [],
        });
        setLoading(false);
      } catch (error) {
        logger.error('Error fetching project,', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleCancel = async () => {
    await cleanupImageOnCancel({
      newUploadedImageUrl,
      originalImageUrl,
      currentImageUrl: formData.imageUrl,
      entityId: params.id as string,
      entityType: 'project',
      formData: {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        color: formData.color,
      },
    });

    router.push(`/projects/${project?.id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setColorError('');
    setStatusValidationError(null);

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Clear the new upload tracking since it's now saved
        setNewUploadedImageUrl(null);
        router.push(`/projects/${params.id}`);
      } else {
        const errorData = await response.json();

        if (response.status === 400) {
          if (errorData.error.includes('color')) {
            setColorError(errorData.error);
          } else if (errorData.details) {
            // This is a completion validation error
            setStatusValidationError(errorData.details);
            if (process.env.NODE_ENV === 'development') {
              console.warn('Project completion validation failed:', errorData.details);
            }
          } else {
            setStatusValidationError(errorData.error || 'Failed to update project');
          }
        } else {
          logger.error('Failed to update project,', errorData.error);
        }
      }
    } catch (error) {
      logger.error('Error updating project,', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation errors when relevant fields change
    if (name === 'status' && statusValidationError) {
      setStatusValidationError(null);
    }
    if (name === 'color' && colorError) {
      setColorError('');
    }
  };

  // Get completion status for the current project
  const completionStatus = formData.items ? checkProjectCompletionReadiness(formData.items) : null;
  const isAttemptingCompletion = formData.status === 'COMPLETED';
  const wasAlreadyCompleted = originalStatus === 'COMPLETED';
  const isNewlyAttemptingCompletion = isAttemptingCompletion && !wasAlreadyCompleted;
  const showCompletionWarning = isAttemptingCompletion && completionStatus && !completionStatus.canComplete;

  if (loading) {
    return (
      <PageContainer
        variant="form"
        maxWidth="2xl"
        header={{
          title: 'Edit Project',
          description: 'Update project information',
        }}>
        <div className="animate-pulse">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Project not found</div>
        <Link
          href="/projects"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <PageContainer
      variant="form"
      maxWidth="2xl"
      header={{
        title: 'Edit Project',
        description: 'Update project information',
      }}
      breadcrumbs={[
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${project.id}` },
        { label: 'Edit' },
      ]}>
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
              <h3 className="text-sm font-medium text-red-800">Unable to update project</h3>
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
          {/* Project Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
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
              id="orderNumber"
              name="orderNumber"
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
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              {PROJECT_STATUS.map((status) => (
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
                {completionStatus.totalItems > 0 && (
                  <div className="text-sm text-gray-600">
                    Progress: {completionStatus.completedItems}/{completionStatus.totalItems} items completed (
                    {completionStatus.completionPercentage}%)
                  </div>
                )}

                {showCompletionWarning && (
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
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
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">Cannot complete project</p>
                        <p className="text-sm text-red-700">{getProjectCompletionMessage(completionStatus)}</p>
                        {completionStatus.incompleteItems.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-red-800">Incomplete items:</p>
                            <ul className="text-xs text-red-700 mt-1 space-y-1">
                              {completionStatus.incompleteItems.map((item) => (
                                <li
                                  key={item.id}
                                  className="flex items-center">
                                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                  {item.name} ({item.status})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isNewlyAttemptingCompletion && completionStatus?.canComplete && (
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
                        <p className="text-sm text-green-700">{getProjectCompletionMessage(completionStatus)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {wasAlreadyCompleted && isAttemptingCompletion && completionStatus?.canComplete && (
                  <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
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
                        <p className="text-sm font-medium text-blue-800">Project completed</p>
                        <p className="text-sm text-blue-700">
                          This project is already marked as completed. All items are done.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Color Picker */}
          <ColorPicker
            selectedColor={formData.color}
            usedColors={usedColors}
            onColorChange={(color) => {
              setFormData((prev) => ({ ...prev, color }));
              setColorError('');
            }}
            error={colorError}
          />

          {/* Image Upload */}
          <ImageUpload
            label="Project Image"
            currentImageUrl={formData.imageUrl}
            onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
            onImageRemoved={() => setFormData({ ...formData, imageUrl: null })}
            onLoadingChange={setImageLoading}
            onNewUploadTracked={setNewUploadedImageUrl}
            entityType="project"
            entityName={formData.name}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || imageLoading || !formData.name.trim()}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saving || imageLoading || !formData.name.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}>
              {saving ? 'Saving...' : imageLoading ? 'Processing image...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
