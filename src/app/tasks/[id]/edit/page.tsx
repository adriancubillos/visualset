'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import { TASK_PRIORITY, TASK_STATUS } from '@/config/workshop-properties';
import { useTaskFormData } from '@/hooks/useTaskFormData';
import { TaskResponseDTO } from '@/types/api';
import ProjectItemSelect from '@/components/forms/ProjectItemSelect';
import AssignmentSelect from '@/components/forms/AssignmentSelect';
import TimeSlotsManager, { TimeSlot } from '@/components/forms/TimeSlotsManager';
import QuantityProgress from '@/components/forms/QuantityProgress';
import TaskStatusQuickActions from '@/components/task/TaskStatusQuickActions';
import { handleTaskResponse } from '@/utils/taskErrorHandling';
import { logger } from '@/utils/logger';
import toast from 'react-hot-toast';

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const { projects, items, machines, operators, loading: dataLoading } = useTaskFormData();

  const [task, setTask] = useState<TaskResponseDTO | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    quantity: 1,
    completed_quantity: 0,
    projectId: '',
    itemId: '',
    machineId: '',
    operatorId: '',
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        const taskResponse = await fetch(`/api/tasks/${params.id}`);

        if (!taskResponse.ok) {
          throw new Error('Failed to fetch task');
        }

        const taskData = await taskResponse.json();
        setTask(taskData);

        // Convert time slots to the format expected by TimeSlotsManager
        const convertedTimeSlots: TimeSlot[] =
          taskData.timeSlots?.map(
            (slot: { id: string; startDateTime: string; endDateTime?: string; durationMin: number }) => {
              const startDate = new Date(slot.startDateTime);
              const dateStr = startDate.toISOString().slice(0, 10); // YYYY-MM-DD
              const timeStr = startDate.toTimeString().slice(0, 5); // HH:MM
              const localStartDateTime = `${dateStr}T${timeStr}`;

              // Calculate endDateTime if not present, or convert if present
              let endDateTime: string | undefined;
              if (slot.endDateTime) {
                const endDate = new Date(slot.endDateTime);
                const endDateStr = endDate.toISOString().slice(0, 10); // YYYY-MM-DD
                const endTimeStr = endDate.toTimeString().slice(0, 5); // HH:MM
                endDateTime = `${endDateStr}T${endTimeStr}`;
              } else if (slot.durationMin > 0) {
                // Calculate endDateTime from startDateTime + duration
                const calculatedEndDateTime = new Date(
                  new Date(localStartDateTime).getTime() + slot.durationMin * 60000,
                );
                endDateTime = calculatedEndDateTime.toISOString();
              }

              return {
                id: slot.id,
                startDateTime: localStartDateTime,
                endDateTime: endDateTime,
                durationMin: slot.durationMin,
              };
            },
          ) || [];

        setTimeSlots(convertedTimeSlots);

        setFormData({
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status,
          priority: taskData.priority || 'MEDIUM',
          quantity: taskData.quantity || 1,
          completed_quantity: taskData.completed_quantity || 0,
          projectId: taskData.project?.id || '',
          itemId: taskData.item?.id || '',
          machineId: taskData.machine?.id || '',
          operatorId: taskData.operator?.id || '',
        });

        setLoading(false);
      } catch (error) {
        logger.error('Error fetching task data', error);
        setLoading(false);
      }
    };

    fetchTaskData();
  }, [params.id]);

  const handleProjectChange = (projectId: string) => {
    setFormData((prev) => ({ ...prev, projectId }));
  };

  const handleItemChange = (itemId: string) => {
    setFormData((prev) => ({ ...prev, itemId }));
  };

  // Show loading state while fetching data
  if (loading || dataLoading) {
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

  if (!task) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Task not found</h2>
          <p className="text-gray-600">The task you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/tasks"
            className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert timeSlots to the format expected by the API
      const timeSlotDTOs = timeSlots.map((slot) => ({
        id: slot.id,
        startDateTime: new Date(slot.startDateTime).toISOString(),
        endDateTime: slot.endDateTime ? new Date(slot.endDateTime).toISOString() : null,
        durationMin: slot.durationMin,
      }));

      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
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

      await handleTaskResponse(response, () => router.push(`/tasks/${params.id}`), 'update task');
    } catch (error) {
      logger.error('Error updating task', error);
      toast.error('Error updating task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'durationMin' || name === 'quantity' || name === 'completed_quantity' ? parseInt(value) || 0 : value,
    }));
  };

  if (!task && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Task not found</div>
        <Link
          href="/tasks"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <PageContainer
      variant="form"
      maxWidth="2xl"
      header={{
        title: 'Edit Task',
        description: 'Update task information',
      }}
      loading={loading}
      breadcrumbs={task ? [
        { label: 'Tasks', href: '/tasks' },
        { label: task.title, href: `/tasks/${task.id}` },
        { label: 'Edit' },
      ] : undefined}>

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
            options={operators}
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
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                {TASK_STATUS.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Status Actions */}
          <div>
            <TaskStatusQuickActions
              currentStatus={formData.status}
              onStatusChange={(newStatus) => {
                setFormData((prev) => ({ ...prev, status: newStatus }));
              }}
              disabled={saving}
            />
          </div>

          {/* Quantity & Progress */}
          <div>
            <QuantityProgress
              quantity={formData.quantity}
              completedQuantity={formData.completed_quantity}
              onQuantityChange={(newQuantity) => {
                setFormData((prev) => ({
                  ...prev,
                  quantity: newQuantity,
                  completed_quantity: Math.min(prev.completed_quantity, newQuantity),
                }));
              }}
              onCompletedQuantityChange={(newCompleted) => {
                setFormData((prev) => ({
                  ...prev,
                  completed_quantity: newCompleted,
                }));
              }}
            />
          </div>

          {/* Time Slots */}
          <div>
            <TimeSlotsManager
              timeSlots={timeSlots}
              onChange={setTimeSlots}
              disabled={saving}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href={`/tasks/${task.id}`}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={
                saving || !formData.title.trim() || !formData.projectId || !formData.itemId || timeSlots.length === 0
              }
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saving || !formData.title.trim() || !formData.projectId || !formData.itemId || timeSlots.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
