'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnOrderState,
  ColumnSizingState,
} from '@tanstack/react-table';
import { Column } from '@/types/table';

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  stickyHeader?: boolean;
  maxHeight?: string;
  onColumnReorder?: (newColumnOrder: Column<T>[]) => void;
  onResetColumns?: () => void;
  showResetColumns?: boolean;
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
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [, setIsDragging] = useState(false); // isDragging state not used in render

  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => {
    const order = initialColumns.map((col) => (col.id || String(col.key)) as string);
    // Add actions at the beginning if it exists
    if (actions) {
      return ['actions', ...order];
    }
    return order;
  });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => {
    // Load saved column widths from localStorage
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('tableColumnWidths');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Convert our Column type to TanStack ColumnDef
  const tanstackColumns = useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = [];

    // Add actions column FIRST if provided
    if (actions) {
      cols.push({
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableResizing: false,
        size: 120,
        minSize: 120,
        maxSize: 120,
        cell: (info) => <div className="flex justify-center">{actions(info.row.original)}</div>,
      });
    }

    // Add regular columns
    const regularCols = initialColumns.map((col) => ({
      id: col.id || String(col.key),
      accessorKey: col.key as string,
      header: col.header,
      enableSorting: col.sortable ?? false,
      size: col.width ? parseInt(col.width) : undefined,
      minSize: col.minWidth ? parseInt(col.minWidth) : 60,
      // Remove maxSize to allow unlimited resizing
      cell: (info: import('@tanstack/react-table').CellContext<T, unknown>) => {
        const value = info.getValue();
        const item = info.row.original;
        const alignment = col.align || 'center';
        const justifyClass =
          alignment === 'left' ? 'justify-start' : alignment === 'right' ? 'justify-end' : 'justify-center';

        return (
          <div className={`break-words break-all flex ${justifyClass}`}>
            {col.render ? col.render(value, item) : String(value || '')}
          </div>
        );
      },
    }));

    cols.push(...regularCols);
    return cols;
  }, [initialColumns, actions]);

  const table = useReactTable({
    data,
    columns: tanstackColumns,
    state: {
      sorting,
      columnOrder,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: (updater) => {
      setColumnSizing((old) => {
        const newSizing = typeof updater === 'function' ? updater(old) : updater;
        // Save to localStorage
        localStorage.setItem('tableColumnWidths', JSON.stringify(newSizing));
        return newSizing;
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
  });

  // Sync column order when initialColumns changes
  useEffect(() => {
    const order = initialColumns.map((col) => (col.id || String(col.key)) as string);
    // Add actions at the beginning if it exists
    if (actions) {
      setColumnOrder(['actions', ...order]);
    } else {
      setColumnOrder(order);
    }
  }, [initialColumns, actions]);

  // Handle column drag and drop
  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    // Don't allow drag if we're resizing or if it's the actions column
    if (isResizing || columnId === 'actions') {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumnId(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = (e: React.DragEvent, dropColumnId: string) => {
    e.preventDefault();

    // Don't allow dropping on actions column
    if (!draggedColumnId || draggedColumnId === dropColumnId || dropColumnId === 'actions') {
      setDraggedColumnId(null);
      setDragOverColumnId(null);
      return;
    }

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumnId);
    const dropIndex = newOrder.indexOf(dropColumnId);

    // Remove dragged column and insert at new position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedColumnId);

    setColumnOrder(newOrder);
    setDraggedColumnId(null);
    setDragOverColumnId(null);

    // Notify parent if callback provided
    if (onColumnReorder) {
      const reorderedColumns = newOrder
        .map((id) => initialColumns.find((col) => (col.id || String(col.key)) === id))
        .filter((col): col is Column<T> => col !== undefined);
      onColumnReorder(reorderedColumns);
    }
  };

  const handleDragEnd = () => {
    setDraggedColumnId(null);
    setDragOverColumnId(null);
    // Delay clearing isDragging to prevent sort from triggering
    setTimeout(() => setIsDragging(false), 100);
  };

  // Track when resizing ends globally
  useEffect(() => {
    const handleMouseUp = () => {
      if (isResizing) {
        setTimeout(() => setIsResizing(false), 100);
      }
    };

    if (isResizing) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isResizing]);

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
  }, [data, columnOrder]);

  const handleResetColumns = () => {
    localStorage.removeItem('tableColumnWidths');
    setColumnSizing({});
    const order = initialColumns.map((col) => (col.id || String(col.key)) as string);
    // Add actions at the beginning if it exists
    if (actions) {
      setColumnOrder(['actions', ...order]);
    } else {
      setColumnOrder(order);
    }
    if (onResetColumns) {
      onResetColumns();
    }
  };

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
        {showResetColumns && (
          <div className="sticky top-0 z-30 bg-gray-50 px-4 py-2 border-b-0 left-0 right-0 block">
            <div className="flex justify-end">
              <button
                onClick={handleResetColumns}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
                title="Reset column order and widths to default">
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

        <table
          className="min-w-full"
          style={{ width: table.getCenterTotalSize(), borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead
            className={`${stickyHeader ? 'sticky z-20' : ''}`}
            style={{
              top: showResetColumns ? '40px' : '0px',
            }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isDragging = draggedColumnId === header.id;
                  const isDragOver = dragOverColumnId === header.id;

                  return (
                    <th
                      key={header.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, header.id)}
                      onDragOver={(e) => handleDragOver(e, header.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, header.id)}
                      onDragEnd={handleDragEnd}
                      className={`relative px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider transition-all duration-200 cursor-pointer hover:bg-gray-100 bg-gray-50 ${
                        isDragging ? 'opacity-50 bg-blue-100' : ''
                      } ${isDragOver && !isDragging ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''}`}
                      style={{
                        width: header.getSize(),
                        borderTop: '1px solid #d1d5db',
                        borderRight: '1px solid #d1d5db',
                        borderBottom: '1px solid #d1d5db',
                      }}
                      onClick={(e) => {
                        // Only allow sorting if not dragging or resizing
                        if (!isDragging && !isResizing) {
                          const handler = header.column.getToggleSortingHandler();
                          handler?.(e);
                        }
                      }}>
                      <div className="flex items-center space-x-1 justify-center">
                        {/* Drag handle indicator */}
                        <svg
                          className="w-3 h-3 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                        </svg>
                        <span className="truncate min-w-0">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {/* Sort indicator */}
                        {{
                          asc: <span className="text-gray-400 flex-shrink-0">↑</span>,
                          desc: <span className="text-gray-400 flex-shrink-0">↓</span>,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                      {/* Resize handle */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsResizing(true);
                            header.getResizeHandler()(e);
                          }}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute top-0 right-0 w-4 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-500 z-10 -mr-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors duration-150`}
                onClick={() => onRowClick?.(row.original)}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 text-sm text-gray-900 align-middle"
                    style={{
                      width: cell.column.getSize(),
                      borderRight: '1px solid #e5e7eb',
                    }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
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
