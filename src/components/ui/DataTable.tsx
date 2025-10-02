'use client';

import { useState, useRef, useEffect } from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  width?: string; // e.g., "150px", "20%", "auto"
  minWidth?: string; // e.g., "100px"
  maxWidth?: string; // e.g., "300px" - prevents columns from being too wide
  align?: 'left' | 'center' | 'right'; // Horizontal alignment (default: center)
  id?: string; // Unique identifier for the column (optional, defaults to key)
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
  onColumnReorder?: (newColumnOrder: Column<T>[]) => void; // Callback for column reordering
  onResetColumns?: () => void; // Callback for resetting columns to default order
  showResetColumns?: boolean; // Whether to show the reset columns button
}

export default function DataTable<T extends { id: string }>({
  data,
  columns: initialColumns,
  loading = false,
  onRowClick,
  actions,
  stickyHeader = true,
  maxHeight,
  onColumnReorder,
  onResetColumns,
  showResetColumns = false,
}: DataTableProps<T>) {
  const [columns, setColumns] = useState<Column<T>[]>(initialColumns);
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Sync columns when initialColumns changes
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Handle column drag and drop
  const handleDragStart = (e: React.DragEvent, columnIndex: number) => {
    setDraggedColumnIndex(columnIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for Firefox
  };

  const handleDragOver = (e: React.DragEvent, columnIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumnIndex(columnIndex);
  };

  const handleDragLeave = () => {
    setDragOverColumnIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedColumnIndex === null || draggedColumnIndex === dropIndex) {
      setDraggedColumnIndex(null);
      setDragOverColumnIndex(null);
      return;
    }

    const newColumns = [...columns];
    const draggedColumn = newColumns[draggedColumnIndex];

    // Remove the dragged column
    newColumns.splice(draggedColumnIndex, 1);
    // Insert it at the new position
    newColumns.splice(dropIndex, 0, draggedColumn);

    setColumns(newColumns);
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);

    // Notify parent component of the new column order
    if (onColumnReorder) {
      onColumnReorder(newColumns);
    }
  };

  const handleDragEnd = () => {
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
  };

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
        className="overflow-auto scrollbar-visible relative"
        style={containerStyle}>
        {/* Reset Columns Button */}
        {showResetColumns && onResetColumns && (
          <div className="sticky top-0 z-30 bg-gray-50 px-4 py-2 border-b-0 left-0 right-0 block">
            <div className="flex justify-end">
              <button
                onClick={onResetColumns}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
                title="Reset column order to default">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset Columns
              </button>
            </div>
          </div>
        )}

        <table className="min-w-full">
          <thead
            className={`bg-gray-50 border-t border-b border-gray-300 ${stickyHeader ? 'sticky z-20' : ''}`}
            style={{ top: showResetColumns && onResetColumns ? '40px' : '0px' }}>
            <tr>
              {columns.map((column, columnIndex) => (
                <th
                  key={column.id || String(column.key)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, columnIndex)}
                  onDragOver={(e) => handleDragOver(e, columnIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, columnIndex)}
                  onDragEnd={handleDragEnd}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider transition-all duration-200 ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    } ${draggedColumnIndex === columnIndex ? 'opacity-50 bg-blue-100' : ''} ${dragOverColumnIndex === columnIndex && draggedColumnIndex !== columnIndex
                      ? 'bg-blue-50 border-l-4 border-l-blue-400'
                      : ''
                    }`}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth || '120px',
                    maxWidth: column.maxWidth || '250px',
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}>
                  <div className="flex items-center space-x-1">
                    {/* Drag handle indicator */}
                    <svg
                      className="w-3 h-3 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                    </svg>
                    <span className="truncate min-w-0">{column.header}</span>
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-gray-400 flex-shrink-0">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="sticky right-0 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
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
                {columns.map((column) => {
                  const alignment = column.align || 'center';
                  const justifyClass = alignment === 'left' ? 'justify-start' : alignment === 'right' ? 'justify-end' : 'justify-center';
                  
                  return (
                    <td
                      key={column.id || String(column.key)}
                      className="px-6 py-4 text-sm text-gray-900 align-middle"
                      style={{
                        width: column.width,
                        minWidth: column.minWidth || '120px',
                        maxWidth: column.maxWidth || '250px',
                      }}>
                      <div className={`break-words flex ${justifyClass}`}>
                        {column.render ? column.render(item[column.key], item) : String(item[column.key] || '')}
                      </div>
                    </td>
                  );
                })}
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
