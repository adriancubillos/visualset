import { useState, useEffect } from 'react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any;
  onSave: (update: { projectId: string | null; machineId: string | null; operatorId: string | null }) => void;
  projects: { id: string; name: string }[];
  machines: { id: string; name: string }[];
  operators: { id: string; name: string }[];
}

export default function TaskModal({ isOpen, onClose, task, onSave, projects, machines, operators }: TaskModalProps) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [machineId, setMachineId] = useState<string | null>(null);
  const [operatorId, setOperatorId] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setProjectId(task.project?.id ?? null);
      setMachineId(task.machine?.id ?? null);
      setOperatorId(task.operator?.id ?? null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96 max-w-md mx-4 border">
        <h3 className="text-xl font-bold mb-6 text-gray-900">Update Assignment</h3>

        {/* Project Dropdown */}
        <label className="block mb-2 text-sm font-semibold text-gray-700">Project</label>
        <select
          className="w-full border-2 border-gray-300 rounded-md p-3 mb-4 text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={projectId ?? ''}
          onChange={(e) => setProjectId(e.target.value || null)}>
          <option value="" className="text-gray-500">-- None --</option>
          {projects.map((p) => (
            <option
              key={p.id}
              value={p.id}
              className="text-gray-900">
              {p.name}
            </option>
          ))}
        </select>

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
          className="w-full border-2 border-gray-300 rounded-md p-3 mb-6 text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium">
            Cancel
          </button>
          <button
            onClick={() => onSave({ projectId, machineId, operatorId })}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
