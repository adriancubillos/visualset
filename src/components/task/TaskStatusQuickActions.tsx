import { TASK_STATUS } from '@/config/workshop-properties';

interface TaskStatusQuickActionsProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

export default function TaskStatusQuickActions({
  currentStatus,
  onStatusChange,
  disabled = false,
}: TaskStatusQuickActionsProps) {
  // Get all status actions from centralized TASK_STATUS configuration
  const getAllActions = () => {
    return TASK_STATUS.map((statusConfig) => ({
      value: statusConfig.value,
      label: statusConfig.label,
      isCurrent: statusConfig.value === currentStatus,
    }));
  };

  const getStatusVariant = (status: string, isCurrent: boolean): string => {
    if (isCurrent) {
      // Highlighted current status with darker colors and border
      switch (status) {
        case 'PENDING':
          return 'bg-gray-200 text-gray-900 border-gray-400 ring-2 ring-gray-400';
        case 'IN_PROGRESS':
          return 'bg-blue-200 text-blue-900 border-blue-400 ring-2 ring-blue-400';
        case 'COMPLETED':
          return 'bg-green-200 text-green-900 border-green-400 ring-2 ring-green-400';
        case 'BLOCKED':
          return 'bg-red-200 text-red-900 border-red-400 ring-2 ring-red-400';
        case 'SCHEDULED':
          return 'bg-purple-200 text-purple-900 border-purple-400 ring-2 ring-purple-400';
        default:
          return 'bg-gray-200 text-gray-900 border-gray-400 ring-2 ring-gray-400';
      }
    } else {
      // Normal status colors with hover
      switch (status) {
        case 'PENDING':
          return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300';
        case 'IN_PROGRESS':
          return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300';
        case 'COMPLETED':
          return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300';
        case 'BLOCKED':
          return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300';
        case 'SCHEDULED':
          return 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300';
        default:
          return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300';
      }
    }
  };

  const actions = getAllActions();

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.value}
            type="button"
            onClick={() => !action.isCurrent && onStatusChange(action.value)}
            disabled={disabled || action.isCurrent}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${getStatusVariant(
              action.value,
              action.isCurrent,
            )} ${disabled && !action.isCurrent ? 'opacity-50 cursor-not-allowed' : ''} ${
              action.isCurrent ? 'cursor-not-allowed font-semibold' : 'cursor-pointer'
            }`}>
            {action.isCurrent ? `✓ ${action.label}` : `Mark as ${action.label}`}
          </button>
        ))}
      </div>
    </div>
  );
}
