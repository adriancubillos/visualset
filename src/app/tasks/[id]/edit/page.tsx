'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDateTimeGMTMinus5, parseGMTMinus5DateTime, getCurrentDisplayTimezoneDate } from '@/utils/timezone';
import { TASK_PRIORITY, TASK_STATUS } from '@/config/workshop-properties';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  durationMin: number;
  scheduledAt: string | null;
  itemId: string | null;
  machineId: string | null;
  operatorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    scheduledAt: '',
    durationMin: 60,
    itemId: '',
    machineId: '',
    operatorId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dateWarning, setDateWarning] = useState('');

  // Fetch data for dropdowns
  const [items, setItems] = useState<{ id: string; name: string; project?: { name: string } }[]>([]);
  const [machines, setMachines] = useState<{ id: string; name: string }[]>([]);
  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch task data and dropdown data in parallel
        const [taskResponse, itemsRes, machinesRes, operatorsRes] = await Promise.all([
          fetch(`/api/tasks/${params.id}`),
          fetch('/api/projects?include=items'), // We'll need items with project info
          fetch('/api/machines'),
          fetch('/api/operators'),
        ]);

        if (!taskResponse.ok) {
          throw new Error('Failed to fetch task');
        }

        const taskData = await taskResponse.json();
        setTask(taskData);

        // Format scheduledAt using GMT-5 timezone utilities
        let scheduledAt = '';
        if (taskData.scheduledAt) {
          const date = new Date(taskData.scheduledAt);
          const { date: dateStr, time: timeStr } = formatDateTimeGMTMinus5(date);
          scheduledAt = `${dateStr}T${timeStr}`;
        }

        setFormData({
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status,
          priority: taskData.priority || 'MEDIUM',
          scheduledAt: scheduledAt,
          durationMin: taskData.durationMin,
          itemId: taskData.item?.id || '',
          machineId: taskData.machineId || '',
          operatorId: taskData.operatorId || '',
        });

        // Set dropdown data - extract items from projects response
        if (itemsRes.ok) {
          const projectsData = await itemsRes.json();
          const allItems = projectsData.flatMap(
            (p: { id: string; name: string; items?: { id: string; name: string }[] }) =>
              (p.items || []).map((item: { id: string; name: string }) => ({ ...item, project: { name: p.name } })),
          );
          setItems(allItems);
        }

        if (machinesRes.ok) {
          const machinesData = await machinesRes.json();
          setMachines(machinesData.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })));
        }

        if (operatorsRes.ok) {
          const operatorsData = await operatorsRes.json();
          setOperators(operatorsData.map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert scheduledAt from form format to UTC using GMT-5 utilities
      let scheduledAtUTC = null;
      if (formData.scheduledAt) {
        const [dateStr, timeStr] = formData.scheduledAt.split('T');
        scheduledAtUTC = parseGMTMinus5DateTime(dateStr, timeStr).toISOString();
      }

      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          itemId: formData.itemId || null,
          machineId: formData.machineId || null,
          operatorId: formData.operatorId || null,
          scheduledAt: scheduledAtUTC,
        }),
      });

      if (response.ok) {
        router.push(`/tasks/${params.id}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to update task:', errorData.error);
        alert('Failed to update task: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'durationMin' ? parseInt(value) || 0 : value,
    }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <nav
          className="flex mb-4"
          aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link
                href="/tasks"
                className="text-gray-500 hover:text-gray-700">
                Tasks
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <Link
                href={`/tasks/${task.id}`}
                className="text-gray-500 hover:text-gray-700">
                {task.title}
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className="text-gray-900 font-medium">Edit</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
        <p className="mt-2 text-gray-600">Update task information</p>
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

          {/* Item Assignment */}
          <div>
            <label
              htmlFor="itemId"
              className="block text-sm font-medium text-gray-700">
              Item
            </label>
            <select
              id="itemId"
              name="itemId"
              value={formData.itemId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">No Item</option>
              {items.map((item) => (
                <option
                  key={item.id}
                  value={item.id}>
                  {item.name} {item.project ? `(${item.project.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Machine Assignment */}
          <div>
            <label
              htmlFor="machineId"
              className="block text-sm font-medium text-gray-700">
              Machine
            </label>
            <select
              id="machineId"
              name="machineId"
              value={formData.machineId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">No Machine Required</option>
              {machines.map((machine) => (
                <option
                  key={machine.id}
                  value={machine.id}>
                  {machine.name}
                </option>
              ))}
            </select>
          </div>

          {/* Operator Assignment */}
          <div>
            <label
              htmlFor="operatorId"
              className="block text-sm font-medium text-gray-700">
              Operator
            </label>
            <select
              id="operatorId"
              name="operatorId"
              value={formData.operatorId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">Unassigned</option>
              {operators.map((operator) => (
                <option
                  key={operator.id}
                  value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
          </div>

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

                      // Check if date is in the past and show warning
                      if (date) {
                        const selectedDate = new Date(date);
                        const today = getCurrentDisplayTimezoneDate();
                        today.setHours(0, 0, 0, 0); // Reset time for comparison

                        if (selectedDate < today) {
                          setDateWarning('Warning: Scheduled date is in the past');
                        } else {
                          setDateWarning('');
                        }
                      } else {
                        setDateWarning('');
                      }

                      setFormData((prev) => ({
                        ...prev,
                        scheduledAt: date ? `${date}T${time}` : '',
                      }));
                    }}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                        : new Date().toISOString().split('T')[0];
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
              {dateWarning && <p className="mt-1 text-xs text-yellow-600">{dateWarning}</p>}
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
            <Link
              href={`/tasks/${task.id}`}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.title.trim()}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saving || !formData.title.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
