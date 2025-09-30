interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export default function ProgressBar({
  current,
  total,
  label,
  showPercentage = true,
  showNumbers = true,
  size = 'md',
  variant = 'default',
  className = '',
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = current >= total;

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  const progressColor = isComplete ? variantClasses.success : variantClasses[variant];

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage || showNumbers) && (
        <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
          <span className="font-medium">{label}</span>
          <div className="flex items-center gap-2">
            {showNumbers && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {current}/{total}
              </span>
            )}
            {showPercentage && <span className="text-xs font-medium">{percentage}%</span>}
          </div>
        </div>
      )}
      <div className={`bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
