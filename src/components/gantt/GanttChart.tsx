'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import GanttTimeline from './GanttTimeline';
import GanttTaskBar from './GanttTaskBar';
import { convertTaskTimeForDisplay } from '@/utils/timezone';

export interface GanttTask {
  id: string;
  title: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  status: string;
  durationMin: number;
  operator?: {
    id: string;
    name: string;
    color?: string;
  } | null;
  machine?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface GanttItem {
  id: string;
  name: string;
  status: string;
  tasks: GanttTask[];
}

export interface GanttProject {
  id: string;
  name: string;
  status: string;
  color?: string;
  items: GanttItem[];
}

interface GanttChartProps {
  projects: GanttProject[];
  currentMonth: Date;
}

export default function GanttChart({ projects, currentMonth }: GanttChartProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Generate days for the current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
      days.push(new Date(day));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const dayWidth = 40; // Width of each day column in pixels

  const toggleProjectExpanded = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
      // Also collapse all items in this project
      const newExpandedItems = new Set(expandedItems);
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        project.items.forEach((item) => newExpandedItems.delete(item.id));
      }
      setExpandedItems(newExpandedItems);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleItemExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Calculate position for a task bar
  const getTaskPosition = (task: GanttTask) => {
    if (!task.startDate || !task.endDate) return null;

    // Convert UTC task times to GMT-5 for display using utility function
    const { start: localStartDate, end: localEndDate } = convertTaskTimeForDisplay(
      typeof task.startDate === 'string' ? task.startDate : task.startDate.toISOString(),
      task.durationMin,
    );

    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Check if task overlaps with current month
    if (localEndDate < monthStart || localStartDate > monthEnd) {
      return null; // Task is outside current month
    }

    const startDate = localStartDate < monthStart ? monthStart : localStartDate;
    const endDate = localEndDate > monthEnd ? monthEnd : localEndDate;

    const daysSinceMonthStart = Math.floor((startDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

    return {
      left: daysSinceMonthStart * dayWidth,
      width: durationDays * dayWidth - 2, // -2 for border
    };
  };

  const renderTaskRows = () => {
    const rows: React.ReactElement[] = [];

    projects.forEach((project) => {
      const isProjectExpanded = expandedProjects.has(project.id);

      // Project row
      rows.push(
        <div
          key={`project-${project.id}`}
          className="border-b border-gray-200">
          <div
            className="flex"
            style={{ minHeight: '40px' }}>
            <div className="w-80 border-r border-gray-200 bg-gray-50 flex items-center">
              <div className="flex items-center w-full">
                <button
                  onClick={() => toggleProjectExpanded(project.id)}
                  className="flex items-center px-4 py-2 text-left hover:bg-gray-100">
                  <svg
                    className={`w-4 h-4 mr-2 transition-transform ${isProjectExpanded ? 'transform rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <div
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: project.color || '#6B7280' }}
                  />
                  <span className="font-medium text-gray-900">📁 {project.name}</span>
                </button>
                <Link
                  href={`/projects/${project.id}`}
                  className="ml-auto mr-2 p-1 text-gray-400 hover:text-blue-600 rounded">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </Link>
              </div>
            </div>
            <div
              className="flex-1 relative bg-white"
              style={{ minWidth: days.length * dayWidth }}>
              {/* Project-level indicators could go here */}
            </div>
          </div>
        </div>,
      );

      if (isProjectExpanded) {
        project.items.forEach((item) => {
          const isItemExpanded = expandedItems.has(item.id);

          // Item row
          rows.push(
            <div
              key={`item-${item.id}`}
              className="border-b border-gray-100">
              <div
                className="flex"
                style={{ minHeight: '36px' }}>
                <div className="w-80 border-r border-gray-200 bg-blue-50 flex items-center">
                  <div className="flex items-center w-full">
                    <button
                      onClick={() => toggleItemExpanded(item.id)}
                      className="flex items-center px-8 py-2 text-left hover:bg-blue-100">
                      <svg
                        className={`w-3 h-3 mr-2 transition-transform ${isItemExpanded ? 'transform rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">📦 {item.name}</span>
                    </button>
                    <Link
                      href={`/items/${item.id}`}
                      className="ml-auto mr-2 p-1 text-gray-400 hover:text-blue-600 rounded">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
                <div
                  className="flex-1 relative bg-white"
                  style={{ minWidth: days.length * dayWidth }}>
                  {/* Item-level summary could go here */}
                </div>
              </div>
            </div>,
          );

          if (isItemExpanded) {
            item.tasks.forEach((task) => {
              const position = getTaskPosition(task);

              // Task row
              rows.push(
                <div
                  key={`task-${task.id}`}
                  className="border-b border-gray-50">
                  <div
                    className="flex"
                    style={{ minHeight: '32px' }}>
                    <div className="w-80 border-r border-gray-200 bg-white flex items-center">
                      <div className="flex items-center w-full px-12 py-1">
                        <span className="text-xs text-gray-600">⚙️ {task.title}</span>
                      </div>
                    </div>
                    <div
                      className="flex-1 relative bg-white"
                      style={{ minWidth: days.length * dayWidth }}>
                      {position && (
                        <GanttTaskBar
                          task={task}
                          left={position.left}
                          width={position.width}
                        />
                      )}
                    </div>
                  </div>
                </div>,
              );
            });
          }
        });
      }
    });

    return rows;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <GanttTimeline
        days={days}
        dayWidth={dayWidth}
      />

      {/* Content */}
      <div
        className="overflow-auto"
        style={{ maxHeight: '600px' }}>
        {renderTaskRows()}
      </div>

      {projects.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No scheduled tasks found for this month.</p>
        </div>
      )}
    </div>
  );
}
