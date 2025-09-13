import { useState, useEffect } from 'react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any;
  onSave: (update: { machineId: string | null; operatorId: string | null }) => void;
  machines: { id: string; name: string }[];
  operators: { id: string; name: string }[];
}

export default function TaskModal({ isOpen, onClose, task, onSave, machines, operators }: TaskModalProps) {
  const [machineId, setMachineId] = useState<string | null>(null);
  const [operatorId, setOperatorId] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setMachineId(task.machine?.id ?? null);
      setOperatorId(task.operator?.id ?? null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h3 className="text-lg font-bold mb-4">Update Assignment</h3>

        {/* Machine Dropdown */}
        <label className="block mb-2">Machine</label>
        <select
          className="w-full border p-2 mb-4"
          value={machineId ?? ''}
          onChange={(e) => setMachineId(e.target.value || null)}>
          <option value="">-- None --</option>
          {machines.map((m) => (
            <option
              key={m.id}
              value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Operator Dropdown */}
        <label className="block mb-2">Operator</label>
        <select
          className="w-full border p-2 mb-4"
          value={operatorId ?? ''}
          onChange={(e) => setOperatorId(e.target.value || null)}>
          <option value="">-- None --</option>
          {operators.map((o) => (
            <option
              key={o.id}
              value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
          <button
            onClick={() => onSave({ machineId, operatorId })}
            className="px-4 py-2 bg-blue-600 text-white rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
