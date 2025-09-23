'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
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
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const hierarchyContentRef = useRef<HTMLDivElement>(null);

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

  console.log('Timeline setup:', {
    totalDays: days.length,
    dayWidth,
    totalWidth: days.length * dayWidth,
    lastDay: days[days.length - 1]?.getDate(),
  });

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

  const expandAllProjects = () => {
    const allProjectIds = new Set(projects.map((p) => p.id));
    setExpandedProjects(allProjectIds);
  };

  const collapseAllProjects = () => {
    setExpandedProjects(new Set());
    setExpandedItems(new Set()); // Also collapse all items
  };

  const expandAllItems = () => {
    const allItemIds = new Set<string>();
    projects.forEach((project) => {
      if (expandedProjects.has(project.id)) {
        project.items.forEach((item) => allItemIds.add(item.id));
      }
    });
    setExpandedItems(allItemIds);
  };

  const collapseAllItems = () => {
    setExpandedItems(new Set());
  };

  // Handle scrolling for the timeline content area
  const handleTimelineContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const scrollTop = e.currentTarget.scrollTop;

    console.log('Timeline content scroll:', { scrollLeft, scrollTop });

    // Sync vertical scroll with hierarchy
    if (hierarchyContentRef.current && hierarchyContentRef.current.scrollTop !== scrollTop) {
      hierarchyContentRef.current.scrollTop = scrollTop;
    }
  };

  // Handle vertical scrolling for the hierarchy content area
  const handleHierarchyContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;

    if (timelineContentRef.current && timelineContentRef.current.scrollTop !== scrollTop) {
      timelineContentRef.current.scrollTop = scrollTop;
    }
  };

  // Calculate position for a task bar
  const getTaskPosition = (task: GanttTask) => {
    if (!task.startDate || !task.endDate) return null;

    // Convert UTC task times to GMT-5 for display using utility function
    const { start: localStartDate, end: localEndDate } = convertTaskTimeForDisplay(
      typeof task.startDate === 'string' ? task.startDate : task.startDate.toISOString(),
      task.durationMin,
    );

    // The days array is built with dates like new Date(year, month, day) which are local dates
    // so we need to match that by using the local date components
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();

    // Get the day of month from the local start date
    const taskStartDay = localStartDate.getDate();
    const taskStartMonth = localStartDate.getMonth();
    const taskStartYear = localStartDate.getFullYear();

    // Check if task is in the current month
    if (taskStartYear !== currentYear || taskStartMonth !== currentMonthIndex) {
      return null; // Task is outside current month
    }

    // Position is based on day of month minus 1 (to make it 0-indexed)
    const daysSinceMonthStart = taskStartDay - 1;

    // Calculate duration in days
    const taskEndDay = localEndDate.getDate();
    const durationDays = Math.max(1, taskEndDay - taskStartDay + 1);

    return {
      left: daysSinceMonthStart * dayWidth,
      width: durationDays * dayWidth - 2, // -2 for border
    };
  }; // Render only the hierarchy column (left sidebar)
  const renderHierarchyColumn = () => {
    const hierarchyRows: React.ReactElement[] = [];

    projects.forEach((project) => {
      const isProjectExpanded = expandedProjects.has(project.id);

      // Project row hierarchy
      hierarchyRows.push(
        <div
          key={`hierarchy-project-${project.id}`}
          className="border-b border-gray-200 bg-gray-50"
          style={{ minHeight: '40px' }}>
          <div className="flex items-center w-full">
            <button
              onClick={() => toggleProjectExpanded(project.id)}
              className="flex items-center px-4 py-2 text-left hover:bg-gray-100 w-full">
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
              className="mr-2 p-1 text-gray-400 hover:text-blue-600 rounded">
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
        </div>,
      );

      if (isProjectExpanded) {
        project.items.forEach((item) => {
          const isItemExpanded = expandedItems.has(item.id);

          // Item row hierarchy
          hierarchyRows.push(
            <div
              key={`hierarchy-item-${item.id}`}
              className="border-b border-gray-100 bg-blue-50"
              style={{ minHeight: '36px' }}>
              <div className="flex items-center w-full">
                <button
                  onClick={() => toggleItemExpanded(item.id)}
                  className="flex items-center px-8 py-2 text-left hover:bg-blue-100 w-full">
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
                  className="mr-2 p-1 text-gray-400 hover:text-blue-600 rounded">
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
            </div>,
          );

          if (isItemExpanded) {
            item.tasks.forEach((task) => {
              // Task row hierarchy
              hierarchyRows.push(
                <div
                  key={`hierarchy-task-${task.id}`}
                  className="border-b border-gray-50 bg-white"
                  style={{ minHeight: '32px' }}>
                  <div className="flex items-center w-full px-12 py-1">
                    <span className="text-xs text-gray-600">⚙️ {task.title}</span>
                  </div>
                </div>,
              );
            });
          }
        });
      }
    });

    return hierarchyRows;
  };

  // Render only the timeline content (right side)
  const renderTimelineContent = () => {
    const timelineRows: React.ReactElement[] = [];

    projects.forEach((project) => {
      const isProjectExpanded = expandedProjects.has(project.id);

      // Project row timeline
      timelineRows.push(
        <div
          key={`timeline-project-${project.id}`}
          className="border-b border-gray-200 bg-white relative"
          style={{ minHeight: '40px', minWidth: days.length * dayWidth }}>
          {/* Project-level indicators could go here */}
        </div>,
      );

      if (isProjectExpanded) {
        project.items.forEach((item) => {
          const isItemExpanded = expandedItems.has(item.id);

          // Item row timeline
          timelineRows.push(
            <div
              key={`timeline-item-${item.id}`}
              className="border-b border-gray-100 bg-white relative"
              style={{ minHeight: '36px', minWidth: days.length * dayWidth }}>
              {/* Item-level summary could go here */}
            </div>,
          );

          if (isItemExpanded) {
            item.tasks.forEach((task) => {
              const position = getTaskPosition(task);

              // Task row timeline
              timelineRows.push(
                <div
                  key={`timeline-task-${task.id}`}
                  className="border-b border-gray-50 bg-white relative"
                  style={{ minHeight: '32px', minWidth: days.length * dayWidth }}>
                  {position && (
                    <GanttTaskBar
                      task={task}
                      left={position.left}
                      width={position.width}
                    />
                  )}
                </div>,
              );
            });
          }
        });
      }
    });

    return timelineRows;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Content with synchronized scrolling */}
      <div
        className="flex"
        style={{ maxHeight: '600px' }}>
        {/* Fixed sidebar for hierarchy */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Fixed header for hierarchy */}
          <div className="border-b border-gray-300 bg-gray-100 py-3 px-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Project / Item / Task</span>
              <div className="flex space-x-1">
                {/* Project expand/collapse buttons */}
                <div className="flex space-x-1">
                  <button
                    onClick={expandAllProjects}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    title="Expand All Projects">
                    📁+
                  </button>
                  <button
                    onClick={collapseAllProjects}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    title="Collapse All Projects">
                    📁-
                  </button>
                </div>
                {/* Item expand/collapse buttons */}
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={expandAllItems}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    title="Expand All Items">
                    📦+
                  </button>
                  <button
                    onClick={collapseAllItems}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    title="Collapse All Items">
                    📦-
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Hierarchy content */}
          <div
            ref={hierarchyContentRef}
            className="flex-1 overflow-y-auto"
            onScroll={handleHierarchyContentScroll}>
            {renderHierarchyColumn()}
          </div>
        </div>

        {/* Timeline area - single scroll container for both header and content */}
        <div
          ref={timelineContentRef}
          className="flex-1 overflow-auto"
          onScroll={handleTimelineContentScroll}
          style={{ maxHeight: '600px' }}>
          <div style={{ minWidth: days.length * dayWidth }}>
            {/* Timeline header */}
            <div className="bg-gray-100 border-b border-gray-300 sticky top-0 z-10">
              <div
                className="flex"
                style={{ minWidth: days.length * dayWidth }}>
                {days.map((day, index) => {
                  const formatDay = (date: Date) => date.getDate().toString();
                  const formatDayOfWeek = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
                  const isWeekend = (date: Date) => {
                    const dayOfWeek = date.getDay();
                    return dayOfWeek === 0 || dayOfWeek === 6;
                  };
                  const isToday = (date: Date) => {
                    const today = new Date();
                    return date.toDateString() === today.toDateString();
                  };

                  return (
                    <div
                      key={index}
                      className={`border-r border-gray-200 text-center ${
                        isWeekend(day) ? 'bg-gray-200' : 'bg-gray-100'
                      } ${isToday(day) ? 'bg-blue-100 border-blue-300' : ''}`}
                      style={{ width: dayWidth, minWidth: dayWidth }}>
                      <div className="py-2">
                        <div className={`text-xs font-medium ${isToday(day) ? 'text-blue-600' : 'text-gray-600'}`}>
                          {formatDayOfWeek(day)}
                        </div>
                        <div className={`text-sm font-semibold ${isToday(day) ? 'text-blue-700' : 'text-gray-800'}`}>
                          {formatDay(day)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline content */}
            <div style={{ minWidth: days.length * dayWidth }}>{renderTimelineContent()}</div>
          </div>
        </div>
      </div>

      {projects.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No scheduled tasks found for this month.</p>
        </div>
      )}
    </div>
  );
}
