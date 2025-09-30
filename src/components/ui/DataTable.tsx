'use client';

import { useState, useRef, useEffect } from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  width?: string; // e.g., "150px", "20%", "auto"
  minWidth?: string; // e.g., "100px"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  stickyHeader?: boolean;
  maxHeight?: string; // e.g., "500px", "70vh"
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  onRowClick,
  actions,
  stickyHeader = true,
  maxHeight,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showScrollHint, setShowScrollHint] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Check if table has horizontal overflow
  useEffect(() => {
    const checkOverflow = () => {
      if (tableContainerRef.current) {
        const container = tableContainerRef.current;
        const hasOverflow = container.scrollWidth > container.clientWidth;
        setShowScrollHint(hasOverflow);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [data, columns]);

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="px-6 py-4 border-b border-gray-200">
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const containerStyle = maxHeight ? { maxHeight } : {};

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      {/* Scroll hint indicator */}
      {showScrollHint && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center text-sm text-blue-700">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Scroll horizontally to see more columns
          </div>
        </div>
      )}

      <div
        ref={tableContainerRef}
        className="overflow-auto scrollbar-visible"
        style={containerStyle}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth || '120px',
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}>
                  <div className="flex items-center space-x-1">
                    <span className="truncate">{column.header}</span>
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-gray-400 flex-shrink-0">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="sticky right-0 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200 border-b">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item) => (
              <tr
                key={item.id}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors duration-150`}
                onClick={() => onRowClick?.(item)}>
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-4 text-sm text-gray-900"
                    style={{
                      width: column.width,
                      minWidth: column.minWidth || '120px',
                    }}>
                    <div className="truncate">
                      {column.render ? column.render(item[column.key], item) : String(item[column.key] || '')}
                    </div>
                  </td>
                ))}
                {actions && (
                  <td className="sticky right-0 bg-white px-6 py-4 text-right text-sm font-medium border-l border-gray-200">
                    <div className="flex justify-end">{actions(item)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No data available</div>
        </div>
      )}
    </div>
  );
}
