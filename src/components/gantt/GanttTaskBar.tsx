import React from 'react';
import Link from 'next/link';
import { GanttTask } from './GanttChart';
import { formatDateTimeGMTMinus5 } from '@/utils/timezone';

interface GanttTaskBarProps {
  task: GanttTask;
  left: number;
  width: number;
}

export default function GanttTaskBar({ task, left, width }: GanttTaskBarProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'in progress':
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDurationText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    const utcDate = new Date(date);
    // Use the timezone utility to format date in GMT-5
    const { date: dateStr, time: timeStr } = formatDateTimeGMTMinus5(utcDate);

    // Convert to more friendly format
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

    return `${monthName} ${parseInt(day)}, ${timeStr}`;
  };

  return (
    <Link href={`/tasks/${task.id}`}>
      <div
        className="absolute top-1 group cursor-pointer"
        style={{
          left: `${left}px`,
          width: `${width}px`,
          zIndex: 10,
        }}>
        {/* Task bar */}
        <div
          className={`
        h-6 rounded-sm shadow-sm border border-opacity-50
        ${getStatusColor(task.status)} 
        hover:shadow-md transition-shadow duration-200
        flex items-center px-1
      `}>
          {/* Task content */}
          <div className="flex items-center justify-between w-full text-white text-xs">
            <span
              className="truncate font-medium"
              title={task.title}>
              {task.title}
            </span>

            {/* Resource indicators */}
            <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
              {task.operator && (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold border border-white"
                  style={{ backgroundColor: task.operator.color || '#6B7280' }}
                  title={`Operator: ${task.operator.name}`}>
                  {task.operator.name.charAt(0).toUpperCase()}
                </div>
              )}

              {task.machine && (
                <div
                  className="w-4 h-4 bg-gray-700 rounded flex items-center justify-center border border-white"
                  title={`Machine: ${task.machine.name} (${task.machine.type})`}>
                  <span className="text-xs text-white">🔧</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tooltip on hover */}
        <div
          className="
        absolute bottom-8 left-0 z-50 
        bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        pointer-events-none whitespace-nowrap
      ">
          <div className="font-semibold mb-1">{task.title}</div>
          <div>
            Status: <span className="capitalize">{task.status}</span>
          </div>
          <div>Duration: {getDurationText(task.durationMin)}</div>
          {task.startDate && <div>Start: {formatDate(task.startDate)}</div>}
          {task.endDate && <div>End: {formatDate(task.endDate)}</div>}
          {task.operator && <div>Operator: {task.operator.name}</div>}
          {task.machine && (
            <div>
              Machine: {task.machine.name} ({task.machine.type})
            </div>
          )}

          {/* Tooltip arrow */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </Link>
  );
}
