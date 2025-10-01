import { useState, useEffect } from 'react';
import TimeSlotsManager, { TimeSlot } from '@/components/forms/TimeSlotsManager';
import { sortByName } from '@/utils/sorting';
import Select from '@/components/ui/Select';
import QuantityProgress from '@/components/forms/QuantityProgress';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any;
  selectedSlotIndex?: number | null; // Index of the time slot that was clicked
  onSave: (update: {
    itemId: string | null;
    machineId: string | null;
    operatorId: string | null;
    timeSlots: TimeSlot[];
    quantity: number;
    completed_quantity: number;
  }) => void;
  items: { id: string; name: string; project?: { name: string } }[];
  machines: { id: string; name: string }[];
  operators: { id: string; name: string }[];
}

export default function TaskModal({ isOpen, onClose, task, selectedSlotIndex, onSave, items, machines, operators }: TaskModalProps) {
  const [itemId, setItemId] = useState<string | null>(null);
  const [machineId, setMachineId] = useState<string | null>(null);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [completedQuantity, setCompletedQuantity] = useState<number>(0);

  // Reset state whenever modal opens or task changes
  useEffect(() => {
    if (isOpen && task) {
      setItemId(task.item?.id ?? null);
      setMachineId(task.machine?.id ?? null);
      setOperatorId(task.operator?.id ?? null);
      setQuantity(task.quantity ?? 1);
      setCompletedQuantity(task.completed_quantity ?? 0);

      // Convert task timeSlots to TimeSlot format, or create a default one if none exist
      if (task.timeSlots && task.timeSlots.length > 0) {
        setTimeSlots(
          task.timeSlots.map(
            (slot: { id: string; startDateTime: string; endDateTime?: string | null; durationMin: number }) => {
              // Convert UTC datetime to local datetime string for TimeSlotsManager
              // The datetime-local input expects format: YYYY-MM-DDTHH:MM in local time
              const startDate = new Date(slot.startDateTime);
              const localStartDateTime = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);

              const endDateTime = slot.endDateTime
                ? (() => {
                  const endDate = new Date(slot.endDateTime);
                  return new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                })()
                : undefined;

              // Calculate actual duration from start and end times if endDateTime exists
              const actualDurationMin = slot.endDateTime
                ? Math.round(
                  (new Date(slot.endDateTime).getTime() - new Date(slot.startDateTime).getTime()) / (1000 * 60),
                )
                : slot.durationMin;

              return {
                id: slot.id,
                startDateTime: localStartDateTime,
                endDateTime,
                durationMin: actualDurationMin, // Use calculated duration instead of stored value
              };
            },
          ),
        );
      } else {
        // Create a default time slot if none exist
        const now = new Date();
        const defaultDateTime = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
        setTimeSlots([
          {
            startDateTime: defaultDateTime,
            durationMin: 60,
          },
        ]);
      }
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl mx-4 border max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-6 text-gray-900">Update Assignment</h3>

        {/* Project - Read Only */}
        <label className="block mb-2 text-sm font-semibold text-gray-700">Project</label>
        <input
          type="text"
          value={task.project?.name || 'No Project'}
          readOnly
          className="w-full border-2 border-gray-300 rounded-md p-3 mb-4 text-gray-900 bg-gray-100 cursor-not-allowed"
        />

        {/* Item - Read Only */}
        <label className="block mb-2 text-sm font-semibold text-gray-700">Item</label>
        <input
          type="text"
          value={task.item?.name || 'No Item'}
          readOnly
          className="w-full border-2 border-gray-300 rounded-md p-3 mb-4 text-gray-900 bg-gray-100 cursor-not-allowed"
        />

        {/* Machine and Operator in same row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Select
            label="Machine"
            value={machineId}
            onChange={setMachineId}
            options={sortByName(machines)}
            placeholder="-- None --"
          />
          <Select
            label="Operator"
            value={operatorId}
            onChange={setOperatorId}
            options={sortByName(operators)}
            placeholder="-- None --"
          />
        </div>

        {/* Quantity & Progress */}
        <div className="mb-6">
          <QuantityProgress
            quantity={quantity}
            completedQuantity={completedQuantity}
            onQuantityChange={setQuantity}
            onCompletedQuantityChange={setCompletedQuantity}
          />
        </div>

        {/* Time Slots */}
        <div className="mb-6">
          <TimeSlotsManager
            timeSlots={timeSlots}
            onChange={setTimeSlots}
            selectedSlotIndex={selectedSlotIndex ?? undefined}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium">
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({
                itemId,
                machineId,
                operatorId,
                timeSlots,
                quantity,
                completed_quantity: completedQuantity,
              });
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
