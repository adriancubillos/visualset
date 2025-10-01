'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TASK_PRIORITY, TASK_STATUS } from '@/config/workshop-properties';
import { useTaskFormData } from '@/hooks/useTaskFormData';
import ProjectItemSelect from '@/components/forms/ProjectItemSelect';
import AssignmentSelect from '@/components/forms/AssignmentSelect';
import TimeSlotsManager, { TimeSlot } from '@/components/forms/TimeSlotsManager';
import ProgressBar from '@/components/ui/ProgressBar';
import { handleTaskResponse } from '@/utils/taskErrorHandling';
import { logger } from '@/utils/logger';

function NewTaskPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, items, machines, operators, loading: dataLoading } = useTaskFormData();

  const sortedOperators = useMemo(() => [...operators].sort((a, b) => a.name.localeCompare(b.name)), [operators]);

  // Initialize with current date and time using browser timezone
  const currentDate = new Date();
  const currentDateStr = currentDate.toISOString().slice(0, 10); // YYYY-MM-DD
  const currentTimeStr = currentDate.toTimeString().slice(0, 5); // HH:MM
  const defaultDateTime = `${currentDateStr}T${currentTimeStr}`;
  const defaultDuration = 60;
  const defaultEndDateTime = new Date(new Date(defaultDateTime).getTime() + defaultDuration * 60000).toISOString();

  const defaultTimeSlot: TimeSlot = {
    startDateTime: defaultDateTime,
    endDateTime: defaultEndDateTime,
    durationMin: defaultDuration,
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    quantity: 1,
    completed_quantity: 0,
    projectId: searchParams.get('project') || '',
    itemId: '',
    machineId: searchParams.get('machine') || '',
    operatorId: searchParams.get('operator') || '',
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([defaultTimeSlot]);
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
      [name]: name === 'quantity' || name === 'completed_quantity' ? parseInt(value) || 0 : value,
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
      // Convert timeSlots to the format expected by the API
      const timeSlotDTOs = timeSlots.map((slot) => ({
        startDateTime: new Date(slot.startDateTime).toISOString(),
        endDateTime: slot.endDateTime ? new Date(slot.endDateTime).toISOString() : null,
        durationMin: slot.durationMin,
      }));

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
          timeSlots: timeSlotDTOs,
        }),
      });

      await handleTaskResponse(response, () => router.push('/tasks'), 'create task');
    } catch (error) {
      logger.error('Error creating task', error);
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
            onChange={(value) => setFormData((prev) => ({ ...prev, machineId: value || '' }))}
          />

          {/* Operator Assignment */}
          <AssignmentSelect
            id="operatorId"
            name="operatorId"
            label="Operator"
            value={formData.operatorId}
            options={sortedOperators}
            onChange={(value) => setFormData((prev) => ({ ...prev, operatorId: value || '' }))}
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

          {/* Time Slots */}
          <div>
            <TimeSlotsManager
              timeSlots={timeSlots}
              onChange={setTimeSlots}
              disabled={loading}
            />
          </div>

          {/* Quantity Tracking */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quantity & Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700">
                  Total Quantity Required
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    setFormData((prev) => ({
                      ...prev,
                      quantity: newQuantity,
                      completed_quantity: Math.min(prev.completed_quantity, newQuantity),
                    }));
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                />
                <p className="mt-1 text-xs text-gray-500">How many units need to be produced for this task</p>
              </div>

              <div>
                <label
                  htmlFor="completed_quantity"
                  className="block text-sm font-medium text-gray-700">
                  Completed Quantity
                </label>
                <input
                  type="number"
                  id="completed_quantity"
                  name="completed_quantity"
                  min="0"
                  max={formData.quantity}
                  value={formData.completed_quantity}
                  onChange={(e) => {
                    const newCompleted = Math.min(parseInt(e.target.value) || 0, formData.quantity);
                    setFormData((prev) => ({
                      ...prev,
                      completed_quantity: newCompleted,
                    }));
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">How many units have been completed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Progress</label>
                <ProgressBar
                  current={formData.completed_quantity}
                  total={formData.quantity}
                  showNumbers={true}
                  showPercentage={true}
                  variant={formData.completed_quantity >= formData.quantity ? 'success' : 'default'}
                  size="md"
                />
                <p className="mt-1 text-xs text-gray-500">Task completion progress</p>
              </div>
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
              disabled={
                loading || !formData.title.trim() || !formData.projectId || !formData.itemId || timeSlots.length === 0
              }
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading || !formData.title.trim() || !formData.projectId || !formData.itemId || timeSlots.length === 0
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
