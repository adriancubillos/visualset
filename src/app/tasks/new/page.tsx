'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseGMTMinus5DateTime } from '@/utils/timezone';

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    scheduledAt: '',
    durationMin: 60,
    projectId: searchParams.get('project') || '',
    machineId: searchParams.get('machine') || '',
    operatorId: searchParams.get('operator') || '',
  });
  const [loading, setLoading] = useState(false);

  // Fetch data for dropdowns
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [machines, setMachines] = useState<{id: string, name: string}[]>([]);
  const [operators, setOperators] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [projectsRes, machinesRes, operatorsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/machines'),
          fetch('/api/operators')
        ]);

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData.map((p: any) => ({ id: p.id, name: p.name })));
        }

        if (machinesRes.ok) {
          const machinesData = await machinesRes.json();
          setMachines(machinesData.map((m: any) => ({ id: m.id, name: m.name })));
        }

        if (operatorsRes.ok) {
          const operatorsData = await operatorsRes.json();
          setOperators(operatorsData.map((o: any) => ({ id: o.id, name: o.name })));
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'durationMin' ? parseInt(value) || 0 : value 
    }));
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
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Task Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
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

          {/* Project Assignment */}
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
              Project
            </label>
            <select
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Machine Assignment */}
          <div>
            <label htmlFor="machineId" className="block text-sm font-medium text-gray-700">
              Machine
            </label>
            <select
              id="machineId"
              name="machineId"
              value={formData.machineId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No Machine Required</option>
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.name}
                </option>
              ))}
            </select>
          </div>

          {/* Operator Assignment */}
          <div>
            <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700">
              Operator
            </label>
            <select
              id="operatorId"
              name="operatorId"
              value={formData.operatorId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Unassigned</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Initial Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          </div>

          {/* Scheduled Date and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date & Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="scheduledDate" className="block text-xs text-gray-500 mb-1">
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
                      setFormData(prev => ({ 
                        ...prev, 
                        scheduledAt: date ? `${date}T${time}` : ''
                      }));
                    }}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label htmlFor="scheduledTime" className="block text-xs text-gray-500 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    id="scheduledTime"
                    name="scheduledTime"
                    value={formData.scheduledAt ? formData.scheduledAt.split('T')[1] || '09:00' : '09:00'}
                    onChange={(e) => {
                      const time = e.target.value;
                      const date = formData.scheduledAt ? formData.scheduledAt.split('T')[0] : new Date().toISOString().split('T')[0];
                      setFormData(prev => ({ 
                        ...prev, 
                        scheduledAt: date ? `${date}T${time}` : ''
                      }));
                    }}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Leave empty if no specific schedule is required
              </p>
            </div>

            <div>
              <label htmlFor="durationMin" className="block text-sm font-medium text-gray-700">
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
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading || !formData.title.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
