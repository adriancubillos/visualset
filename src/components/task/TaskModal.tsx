'use client';

import { Dialog } from '@headlessui/react';
import { useState } from 'react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  //BUG fix
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any;
  onSave: (data: { machineId: string | null; operatorId: string | null }) => void;
}

export default function TaskModal({ isOpen, onClose, task, onSave }: TaskModalProps) {
  const [machineId, setMachineId] = useState(task?.machine?.id ?? '');
  const [operatorId, setOperatorId] = useState(task?.operator?.id ?? '');

  if (!task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      machineId: machineId || null,
      operatorId: operatorId || null,
    });
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <Dialog.Title className="text-lg font-semibold mb-4">Update Assignment</Dialog.Title>

          <form
            onSubmit={handleSubmit}
            className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Machine</label>
              <input
                type="text"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                placeholder="Machine ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Operator</label>
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                placeholder="Operator ID"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                Save
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
