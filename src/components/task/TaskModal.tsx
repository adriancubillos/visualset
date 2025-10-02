import { useState, useEffect } from 'react';
import TimeSlotsManager, { TimeSlot } from '@/components/forms/TimeSlotsManager';
import { sortByName } from '@/utils/sorting';
import Select from '@/components/ui/Select';
import QuantityProgress from '@/components/forms/QuantityProgress';
import TaskStatusQuickActions from './TaskStatusQuickActions';

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
    status: string;
  }) => void;
  items: { id: string; name: string; project?: { name: string } }[];
  machines: { id: string; name: string }[];
  operators: { id: string; name: string }[];
}

export default function TaskModal({
  isOpen,
  onClose,
  task,
  selectedSlotIndex,
  onSave,
  machines,
  operators,
}: TaskModalProps) {
  const [itemId, setItemId] = useState<string | null>(null);
  const [machineId, setMachineId] = useState<string | null>(null);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [completedQuantity, setCompletedQuantity] = useState<number>(0);
  const [status, setStatus] = useState<string>('PENDING');
  const [isTimeSlotsExpanded, setIsTimeSlotsExpanded] = useState<boolean>(false);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset state whenever modal opens or task changes
  useEffect(() => {
    if (isOpen && task) {
      setItemId(task.item?.id ?? null);
      setMachineId(task.machine?.id ?? null);
      setOperatorId(task.operator?.id ?? null);
      setQuantity(task.quantity ?? 1);
      setCompletedQuantity(task.completed_quantity ?? 0);
      setStatus(task.status ?? 'PENDING');

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
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Update Task
              {task.title && <span className="text-lg font-medium text-gray-700 mt-1"> - {task.title}</span>}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Project and Item - Compact Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Project:</span>{' '}
              <span className="text-gray-900">{task.project?.name || 'No Project'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Item:</span>{' '}
              <span className="text-gray-900">{task.item?.name || 'No Item'}</span>
            </div>
          </div>
        </div>

        {/* Machine and Operator in same row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Select
            label="Operator"
            value={operatorId}
            onChange={setOperatorId}
            options={sortByName(operators)}
            placeholder="-- None --"
          />
          <Select
            label="Machine"
            value={machineId}
            onChange={setMachineId}
            options={sortByName(machines)}
            placeholder="-- None --"
          />
        </div>

        {/* Quick Status Actions */}
        <div className="mb-6">
          <TaskStatusQuickActions
            currentStatus={status}
            onStatusChange={setStatus}
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

        {/* Time Slots - Collapsible */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setIsTimeSlotsExpanded(!isTimeSlotsExpanded)}
            className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg p-4 border border-gray-200 transition-all duration-200 mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Schedule Time Slots</h4>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                isTimeSlotsExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isTimeSlotsExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
            <TimeSlotsManager
              timeSlots={timeSlots}
              onChange={setTimeSlots}
              selectedSlotIndex={selectedSlotIndex ?? undefined}
            />
          </div>
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
                status,
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
