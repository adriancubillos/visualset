'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateTimeForDisplay, parseGMTMinus5DateTime, getCurrentDisplayTimezoneDate } from '@/utils/timezone';
import { TASK_PRIORITY, TASK_STATUS } from '@/config/workshop-properties';
import { useTaskFormData } from '@/hooks/useTaskFormData';
import ProjectItemSelect from '@/components/forms/ProjectItemSelect';
import AssignmentSelect from '@/components/forms/AssignmentSelect';

function NewTaskPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, items, machines, operators, loading: dataLoading } = useTaskFormData();

  const sortedOperators = useMemo(() => [...operators].sort((a, b) => a.name.localeCompare(b.name)), [operators]);

  // Initialize with current date and time in display timezone
  const currentUTCDate = new Date();
  const { date: currentDateStr, time: currentTimeStr } = formatDateTimeForDisplay(currentUTCDate);
  const defaultScheduledAt = `${currentDateStr}T${currentTimeStr}`;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    scheduledAt: defaultScheduledAt,
    durationMin: 60,
    projectId: searchParams.get('project') || '',
    itemId: '',
    machineId: searchParams.get('machine') || '',
    operatorId: searchParams.get('operator') || '',
  });
  const [loading, setLoading] = useState(false);

  // Show loading state while fetching dropdown data
  if (dataLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="bg-gray-200 h-96 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'durationMin' ? parseInt(value) || 0 : value,
    }));
  };

  const handleProjectChange = (projectId: string) => {
    setFormData((prev) => ({ ...prev, projectId }));
  };

  const handleItemChange = (itemId: string) => {
    setFormData((prev) => ({ ...prev, itemId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert scheduledAt from form format to UTC using GMT-5 utilities
      let scheduledAtUTC = null;
      if (formData.scheduledAt) {
        const [dateStr, timeStr] = formData.scheduledAt.split('T');
        scheduledAtUTC = parseGMTMinus5DateTime(dateStr, timeStr).toISOString();
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          projectId: formData.projectId || null,
          machineId: formData.machineId || null,
          operatorId: formData.operatorId || null,
          scheduledAt: scheduledAtUTC,
        }),
      });

      if (response.ok) {
        router.push('/tasks');
      } else {
        const errorData = await response.json();
        console.error('Failed to create task:', errorData.error);
        alert('Failed to create task: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
        <p className="mt-2 text-gray-600">Schedule a new task in the workshop</p>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6">
          {/* Task Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task title"
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
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task description"
            />
          </div>

          {/* Project and Item Assignment */}
          <ProjectItemSelect
            projectId={formData.projectId}
            itemId={formData.itemId}
            projects={projects}
            items={items}
            onProjectChange={handleProjectChange}
            onItemChange={handleItemChange}
            required={true}
          />

          {/* Machine Assignment */}
          <AssignmentSelect
            id="machineId"
            name="machineId"
            label="Machine"
            value={formData.machineId}
            options={machines}
            onChange={(value) => setFormData((prev) => ({ ...prev, machineId: value }))}
          />

          {/* Operator Assignment */}
          <AssignmentSelect
            id="operatorId"
            name="operatorId"
            label="Operator"
            value={formData.operatorId}
            options={sortedOperators}
            onChange={(value) => setFormData((prev) => ({ ...prev, operatorId: value }))}
          />

          {/* Priority and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                {TASK_PRIORITY.map((priority) => (
                  <option
                    key={priority.value}
                    value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

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
                {TASK_STATUS.filter((status) => ['PENDING', 'IN_PROGRESS'].includes(status.value))
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((status) => (
                    <option
                      key={status.value}
                      value={status.value}>
                      {status.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Scheduled Date and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="scheduledDate"
                    className="block text-xs text-gray-500 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="scheduledDate"
                    name="scheduledDate"
                    value={formData.scheduledAt ? formData.scheduledAt.split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value;
                      const time = formData.scheduledAt ? formData.scheduledAt.split('T')[1] : '09:00';
                      setFormData((prev) => ({
                        ...prev,
                        scheduledAt: date ? `${date}T${time}` : '',
                      }));
                    }}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min={getCurrentDisplayTimezoneDate().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label
                    htmlFor="scheduledTime"
                    className="block text-xs text-gray-500 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    id="scheduledTime"
                    name="scheduledTime"
                    value={formData.scheduledAt ? formData.scheduledAt.split('T')[1] || '09:00' : '09:00'}
                    onChange={(e) => {
                      const time = e.target.value;
                      const date = formData.scheduledAt
                        ? formData.scheduledAt.split('T')[0]
                        : getCurrentDisplayTimezoneDate().toISOString().split('T')[0];
                      setFormData((prev) => ({
                        ...prev,
                        scheduledAt: date ? `${date}T${time}` : '',
                      }));
                    }}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Leave empty if no specific schedule is required</p>
            </div>

            <div>
              <label
                htmlFor="durationMin"
                className="block text-sm font-medium text-gray-700">
                Duration (minutes)
              </label>
              <input
                type="number"
                id="durationMin"
                name="durationMin"
                min="1"
                value={formData.durationMin}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="60"
              />
            </div>
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
              disabled={loading || !formData.title.trim() || !formData.projectId || !formData.itemId}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading || !formData.title.trim() || !formData.projectId || !formData.itemId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewTaskPageContent />
    </Suspense>
  );
}
