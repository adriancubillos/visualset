import { useState, useEffect } from 'react';
import { formatDateTimeGMTMinus5, parseGMTMinus5DateTime } from '@/utils/timezone';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any;
  onSave: (update: { 
    projectId: string | null; 
    machineId: string | null; 
    operatorId: string | null;
    scheduledAt?: string;
    durationMin?: number;
  }) => void;
  projects: { id: string; name: string }[];
  machines: { id: string; name: string }[];
  operators: { id: string; name: string }[];
}

export default function TaskModal({ isOpen, onClose, task, onSave, projects, machines, operators }: TaskModalProps) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [machineId, setMachineId] = useState<string | null>(null);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    if (task) {
      setProjectId(task.project?.id ?? null);
      setMachineId(task.machine?.id ?? null);
      setOperatorId(task.operator?.id ?? null);
      
      // Set date and time from task.scheduledAt using GMT-5
      if (task.scheduledAt) {
        const date = new Date(task.scheduledAt);
        const { date: dateStr, time: timeStr } = formatDateTimeGMTMinus5(date);
        setScheduledDate(dateStr);
        setStartTime(timeStr);
      } else {
        setScheduledDate('');
        setStartTime('');
      }
      
      // Convert durationMin to hours
      setDuration(task.durationMin ? task.durationMin / 60 : 0);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96 max-w-md mx-4 border">
        <h3 className="text-xl font-bold mb-6 text-gray-900">Update Assignment</h3>

        {/* Project Display (Read-only) */}
        <label className="block mb-2 text-sm font-semibold text-gray-700">Project</label>
        <div className="w-full border-2 border-gray-200 rounded-md p-3 mb-4 text-gray-700 bg-gray-50">
          {task.project?.name || 'No project assigned'}
        </div>

        {/* Machine Dropdown */}
        <label className="block mb-2 text-sm font-semibold text-gray-700">Machine</label>
        <select
          className="w-full border-2 border-gray-300 rounded-md p-3 mb-4 text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={machineId ?? ''}
          onChange={(e) => setMachineId(e.target.value || null)}>
          <option value="" className="text-gray-500">-- None --</option>
          {machines.map((m) => (
            <option
              key={m.id}
              value={m.id}
              className="text-gray-900">
              {m.name}
            </option>
          ))}
        </select>

        {/* Operator Dropdown */}
        <label className="block mb-2 text-sm font-semibold text-gray-700">Operator</label>
        <select
          className="w-full border-2 border-gray-300 rounded-md p-3 mb-4 text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={operatorId ?? ''}
          onChange={(e) => setOperatorId(e.target.value || null)}>
          <option value="" className="text-gray-500">-- None --</option>
          {operators.map((o) => (
            <option
              key={o.id}
              value={o.id}
              className="text-gray-900">
              {o.name}
            </option>
          ))}
        </select>

        {/* Date Input */}
        <label className="block mb-2 text-sm font-semibold text-gray-700">Scheduled Date</label>
        <input
          type="date"
          className="w-full border-2 border-gray-300 rounded-md p-3 mb-4 text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />

        {/* Start Time Input */}
        <label className="block mb-2 text-sm font-semibold text-gray-700">Start Time</label>
        <input
          type="time"
          className="w-full border-2 border-gray-300 rounded-md p-3 mb-4 text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />

        {/* Duration Input */}
        <label className="block mb-2 text-sm font-semibold text-gray-700">Duration (hours)</label>
        <input
          type="number"
          min="0"
          step="0.5"
          className="w-full border-2 border-gray-300 rounded-md p-3 mb-6 text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={duration}
          onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium">
            Cancel
          </button>
          <button
            onClick={async () => {
              // Combine date and time into ISO datetime if both are provided
              let scheduledDateTime = undefined;
              if (scheduledDate && startTime) {
                // Parse as GMT-5 and convert to UTC for storage
                const localDateTime = parseGMTMinus5DateTime(scheduledDate, startTime);
                scheduledDateTime = localDateTime.toISOString();
              }
              
              // Convert duration from hours to minutes
              const durationInMinutes = duration * 60;
              
              // Use existing /api/schedule endpoint for conflict checking and saving
              if (scheduledDateTime) {
                try {
                  const response = await fetch('/api/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      taskId: task.id,
                      projectId,
                      machineId,
                      operatorId,
                      scheduledAt: scheduledDateTime,
                      durationMin: durationInMinutes,
                    }),
                  });

                  const data = await response.json();

                  if (response.ok) {
                    // Success - call onSave to update parent component
                    onSave({ 
                      projectId, 
                      machineId, 
                      operatorId,
                      scheduledAt: scheduledDateTime,
                      durationMin: durationInMinutes
                    });
                  } else {
                    // Handle conflict or other errors
                    if (data.conflict) {
                      const conflictType = data.conflict.machine ? 'Machine' : 'Operator';
                      const conflictName = data.conflict.machine?.name || data.conflict.operator?.name || 'Unknown';
                      const conflictStartDate = new Date(data.conflict.scheduledAt);
                      const conflictEndDate = new Date(
                        new Date(data.conflict.scheduledAt).getTime() + (data.conflict.durationMin || 60) * 60 * 1000
                      );
                      const { date: startDate, time: startTime } = formatDateTimeGMTMinus5(conflictStartDate);
                      const { date: endDate, time: endTime } = formatDateTimeGMTMinus5(conflictEndDate);
                      const conflictStart = `${startDate} ${startTime}`;
                      const conflictEnd = `${endDate} ${endTime}`;
                      
                      alert(`Scheduling conflict detected:\n\n${conflictType} "${conflictName}" is already booked for task "${data.conflict.title}" from ${conflictStart} to ${conflictEnd}`);
                    } else {
                      alert(data.error || 'Failed to update task');
                    }
                  }
                } catch (error) {
                  console.error('Error updating task:', error);
                  alert('Error updating task. Please try again.');
                }
              } else {
                // No scheduling, just update assignments
                onSave({ 
                  projectId, 
                  machineId, 
                  operatorId,
                  scheduledAt: scheduledDateTime,
                  durationMin: durationInMinutes
                });
              }
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
