'use client';

interface StatCard {
  label: string;
  value: number;
  color?: 'gray' | 'green' | 'blue' | 'yellow' | 'red' | 'orange' | 'purple' | 'indigo';
}

interface StatisticsCardsProps {
  stats: StatCard[];
  loading?: boolean;
  showWhenEmpty?: boolean;
  columns?: 'auto' | 1 | 2 | 3 | 4 | 5 | 6;
}

export default function StatisticsCards({
  stats,
  loading = false,
  showWhenEmpty = false,
  columns = 'auto',
}: StatisticsCardsProps) {
  // Don't render if loading or if no data and showWhenEmpty is false
  if (loading || (!showWhenEmpty && stats.every((stat) => stat.value === 0))) {
    return null;
  }

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

  const getGridClass = () => {
    if (columns === 'auto') {
      // Auto-detect based on number of stats
      if (stats.length <= 3) return 'grid-cols-1 md:grid-cols-3';
      if (stats.length === 4) return 'grid-cols-1 md:grid-cols-4';
      if (stats.length === 5) return 'grid-cols-1 md:grid-cols-5';
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

  return (
    <div className={`grid ${getGridClass()} gap-4`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow p-4">
          <div className={`text-2xl font-bold ${getColorClass(stat.color)}`}>{stat.value.toLocaleString()}</div>
          <div className="text-sm text-gray-500">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
