'use client';

interface StatCard {
  label: string;
  value: number;
  color?: 'gray' | 'green' | 'blue' | 'yellow' | 'red' | 'orange' | 'purple' | 'indigo';
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

interface StatisticsCardsProps {
  stats: StatCard[];
  loading?: boolean;
  showWhenEmpty?: boolean;
  columns?: 'auto' | 1 | 2 | 3 | 4 | 5 | 6;
  showSkeletonCount?: number;
}

export default function StatisticsCards({
  stats,
  loading = false,
  showWhenEmpty = false,
  columns = 'auto',
  showSkeletonCount = 4,
}: StatisticsCardsProps) {
  const getColorClass = (color: StatCard['color'] = 'gray') => {
    const colorMap = {
      gray: 'text-gray-900',
      green: 'text-green-600',
      blue: 'text-blue-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600',
      orange: 'text-orange-600',
      purple: 'text-purple-600',
      indigo: 'text-indigo-600',
    };
    return colorMap[color];
  };

  const getGridClass = (itemCount?: number) => {
    const count = itemCount || stats.length;

    if (columns === 'auto') {
      // Auto-detect based on number of stats
      if (count <= 3) return 'grid-cols-1 md:grid-cols-3';
      if (count === 4) return 'grid-cols-1 md:grid-cols-4';
      if (count === 5) return 'grid-cols-1 md:grid-cols-5';
      return 'grid-cols-1 md:grid-cols-6';
    }

    const columnMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-6',
    };
    return columnMap[columns];
  };

  const getChangeTextColor = (changeType: StatCard['changeType'] = 'neutral') => {
    const colorMap = {
      increase: 'text-green-600',
      decrease: 'text-red-600',
      neutral: 'text-gray-600',
    };
    return colorMap[changeType];
  };

  // Show loading skeleton if loading
  if (loading) {
    return (
      <div className={`grid ${getGridClass(showSkeletonCount)} gap-4`}>
        {Array.from({ length: showSkeletonCount }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  // Don't render if no data and showWhenEmpty is false
  if (!showWhenEmpty && stats.every((stat) => stat.value === 0)) {
    return null;
  }

  return (
    <div className={`grid ${getGridClass()} gap-4`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className={`text-2xl font-bold ${getColorClass(stat.color)}`}>{stat.value.toLocaleString()}</div>
            </div>
            {stat.change && <div className={`text-sm ${getChangeTextColor(stat.changeType)}`}>{stat.change}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
