import { TASK_STATUS } from '@/config/workshop-properties';
import { getStatusVariant as getStatusVariantFromValue, getVariantClasses } from '@/utils/statusStyles';

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

  const getStatusClassForButton = (status: string, isCurrent: boolean): string => {
    const variant = getStatusVariantFromValue(status);
    return getVariantClasses(variant, isCurrent);
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
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${getStatusClassForButton(
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
