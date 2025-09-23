'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import GanttTaskBar from './GanttTaskBar';
import { convertTaskTimeForDisplay, toDisplayTimezoneStartOfDay } from '@/utils/timezone';

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
  currentDate?: Date;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

type ViewMode = 'day' | 'week' | 'month';

export default function GanttChart({ projects, currentMonth, currentDate, viewMode = 'month' }: GanttChartProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [internalCurrentDate, setInternalCurrentDate] = useState<Date>(currentDate || currentMonth);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const hierarchyContentRef = useRef<HTMLDivElement>(null);

  // Update internal date when props change
  useEffect(() => {
    if (viewMode === 'month') {
      setInternalCurrentDate(currentMonth);
    } else if (currentDate) {
      setInternalCurrentDate(currentDate);
    }
  }, [currentDate, currentMonth, viewMode]);

  // Auto-scroll to current date in month view
  useEffect(() => {
    if (viewMode === 'month' && timelineContentRef.current) {
      // Add a small delay to ensure DOM is fully rendered
      const scrollTimeout = setTimeout(() => {
        if (!timelineContentRef.current) return;

        const today = new Date();
        const currentDayOfMonth = today.getDate();

        // Calculate scroll position to center on current date
        const dayWidth = 40; // Month view day width
        const containerWidth = timelineContentRef.current.clientWidth;
        const targetScrollPosition = (currentDayOfMonth - 1) * dayWidth - containerWidth / 2 + dayWidth / 2;

        // Ensure scroll position is within bounds
        const maxScrollLeft = timelineContentRef.current.scrollWidth - containerWidth;
        const scrollLeft = Math.max(0, Math.min(targetScrollPosition, maxScrollLeft));

        console.log('Auto-scrolling to current date:', {
          currentDayOfMonth,
          dayWidth,
          containerWidth,
          targetScrollPosition,
          scrollLeft,
        });

        // Smooth scroll to the position
        timelineContentRef.current.scrollTo({
          left: scrollLeft,
          behavior: 'smooth',
        });
      }, 100);

      return () => clearTimeout(scrollTimeout);
    }
  }, [viewMode, internalCurrentDate]);

  // Generate days based on view mode
  const getDaysForView = (date: Date, mode: ViewMode) => {
    const days = [];

    switch (mode) {
      case 'day':
        // Use centralized function to get start of day in display timezone
        const dayStart = toDisplayTimezoneStartOfDay(date);
        days.push(dayStart);
        break;

      case 'week':
        // Get the start of the week (Sunday) in display timezone
        const weekStart = toDisplayTimezoneStartOfDay(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Set to Sunday

        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          days.push(day);
        }
        break;

      case 'month':
      default:
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
          days.push(new Date(day));
        }
        break;
    }

    return days;
  };

  const days = getDaysForView(internalCurrentDate, viewMode);
  const dayWidth = viewMode === 'day' ? 200 : viewMode === 'week' ? 80 : 40; // Wider columns for day/week view

  // Filter projects/items/tasks based on view mode and selected date range
  const getFilteredProjects = () => {
    // Get the date range for the current view
    const viewStartDate = days[0];
    const viewEndDate = new Date(days[days.length - 1]);
    viewEndDate.setDate(viewEndDate.getDate() + 1); // Add one day to make it exclusive end

    const filteredProjects = projects
      .map((project) => {
        const filteredItems = project.items
          .map((item) => {
            const filteredTasks = item.tasks.filter((task) => {
              if (!task.startDate || !task.endDate) return false;

              // Convert UTC task times to display timezone
              const { start: localStartDate, end: localEndDate } = convertTaskTimeForDisplay(
                typeof task.startDate === 'string' ? task.startDate : task.startDate.toISOString(),
                task.durationMin,
              );

              // Check if task overlaps with the current view date range
              return localStartDate < viewEndDate && localEndDate >= viewStartDate;
            });

            return {
              ...item,
              tasks: filteredTasks,
            };
          })
          .filter((item) => item.tasks.length > 0); // Only include items with tasks

        return {
          ...project,
          items: filteredItems,
        };
      })
      .filter((project) => project.items.length > 0); // Only include projects with items

    return filteredProjects;
  };

  const filteredProjects = getFilteredProjects();

  console.log('GanttChart render:', {
    viewMode,
    currentDate: internalCurrentDate.toDateString(),
    daysCount: days.length,
    dayWidth,
    totalWidth: days.length * dayWidth,
    originalProjectsCount: projects.length,
    filteredProjectsCount: filteredProjects.length,
    viewDateRange: `${days[0].toDateString()} to ${days[days.length - 1].toDateString()}`,
  });

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
    const allProjectIds = new Set(filteredProjects.map((p) => p.id));
    setExpandedProjects(allProjectIds);
  };

  const collapseAllProjects = () => {
    setExpandedProjects(new Set());
    setExpandedItems(new Set()); // Also collapse all items
  };

  const expandAllItems = () => {
    const allItemIds = new Set<string>();
    filteredProjects.forEach((project) => {
      if (expandedProjects.has(project.id)) {
        project.items.forEach((item) => allItemIds.add(item.id));
      }
    });
    setExpandedItems(allItemIds);
  };

  const collapseAllItems = () => {
    setExpandedItems(new Set());
  };

  const navigateToday = () => {
    setInternalCurrentDate(new Date());
  };

  // Get display title based on view mode
  const getViewTitle = () => {
    const options: Intl.DateTimeFormatOptions = {};
    switch (viewMode) {
      case 'day':
        options.weekday = 'long';
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        break;
      case 'week':
        const startOfWeek = new Date(internalCurrentDate);
        startOfWeek.setDate(internalCurrentDate.getDate() - internalCurrentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        options.year = 'numeric';
        options.month = 'long';
        break;
    }
    return internalCurrentDate.toLocaleDateString('en-US', options);
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

    // Check if task is within the current view range
    const viewStartDate = days[0];
    const viewEndDate = days[days.length - 1];

    console.log('Task position debug:', {
      taskId: task.id,
      taskTitle: task.title,
      localStartDate: localStartDate.toDateString(),
      localEndDate: localEndDate.toDateString(),
      viewMode,
      viewStartDate: viewStartDate.toDateString(),
      viewEndDate: viewEndDate.toDateString(),
      daysLength: days.length,
    });

    // Extend the end of view to end of day
    const viewEndDateEndOfDay = new Date(viewEndDate);
    viewEndDateEndOfDay.setHours(23, 59, 59, 999);

    console.log('Overlap check:', {
      taskId: task.id,
      localEndDate: localEndDate.toISOString(),
      viewStartDate: viewStartDate.toISOString(),
      localStartDate: localStartDate.toISOString(),
      viewEndDateEndOfDay: viewEndDateEndOfDay.toISOString(),
      condition1: localEndDate < viewStartDate,
      condition2: localStartDate > viewEndDateEndOfDay,
      willReturn: localEndDate < viewStartDate || localStartDate > viewEndDateEndOfDay,
    });

    // Check if task overlaps with current view
    if (localEndDate < viewStartDate || localStartDate > viewEndDateEndOfDay) {
      console.log('Returning null for task:', task.id, 'due to no overlap');
      return null; // Task is outside current view
    }

    // Find the position within the view
    let startPosition = 0;
    let endPosition = 0;

    // Calculate start position
    for (let i = 0; i < days.length; i++) {
      const dayStart = new Date(days[i]);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(days[i]);
      dayEnd.setHours(23, 59, 59, 999);

      if (localStartDate >= dayStart && localStartDate <= dayEnd) {
        startPosition = i;
        break;
      } else if (localStartDate < dayStart) {
        startPosition = i;
        break;
      }
    }

    // Calculate end position
    for (let i = days.length - 1; i >= 0; i--) {
      const dayStart = new Date(days[i]);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(days[i]);
      dayEnd.setHours(23, 59, 59, 999);

      if (localEndDate >= dayStart && localEndDate <= dayEnd) {
        endPosition = i;
        break;
      } else if (localEndDate > dayEnd) {
        endPosition = i;
        break;
      }
    }

    // Calculate duration in days
    const durationDays = Math.max(1, endPosition - startPosition + 1);

    const position = {
      left: startPosition * dayWidth,
      width: durationDays * dayWidth - 2, // -2 for border
    };

    console.log('Task position result:', {
      taskId: task.id,
      startPosition,
      endPosition,
      durationDays,
      dayWidth,
      position,
    });

    return position;
  }; // Render only the hierarchy column (left sidebar)
  const renderHierarchyColumn = () => {
    const hierarchyRows: React.ReactElement[] = [];

    filteredProjects.forEach((project) => {
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

    filteredProjects.forEach((project) => {
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

      {/* Top control bar */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Current view info */}
          <div className="text-lg font-semibold text-gray-900">{getViewTitle()}</div>

          {/* Right side - Today button and expand/collapse controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={navigateToday}
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-300">
              Today
            </button>

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
      </div>

      {/* Content with synchronized scrolling */}
      <div
        className="flex"
        style={{ maxHeight: '600px' }}>
        {/* Fixed sidebar for hierarchy */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Fixed header for hierarchy */}
          <div className="border-b border-gray-300 bg-gray-100 py-3 px-4 flex-shrink-0">
            <div className="flex items-center">
              <span className="font-semibold text-gray-700">Project / Item / Task</span>
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
                  const formatDay = (date: Date) => {
                    switch (viewMode) {
                      case 'day':
                        return date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        });
                      case 'week':
                        return date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          day: 'numeric',
                        });
                      case 'month':
                      default:
                        return date.getDate().toString();
                    }
                  };

                  const formatDayOfWeek = (date: Date) => {
                    if (viewMode === 'day') return '';
                    if (viewMode === 'week') return '';
                    return date.toLocaleDateString('en-US', { weekday: 'short' });
                  };

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
                        {viewMode === 'month' && (
                          <div className={`text-xs font-medium ${isToday(day) ? 'text-blue-600' : 'text-gray-600'}`}>
                            {formatDayOfWeek(day)}
                          </div>
                        )}
                        <div
                          className={`${viewMode === 'day' ? 'text-xs' : 'text-sm'} font-semibold ${
                            isToday(day) ? 'text-blue-700' : 'text-gray-800'
                          }`}>
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

      {filteredProjects.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>
            {viewMode === 'day'
              ? `No scheduled tasks found for ${internalCurrentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}.`
              : viewMode === 'week'
              ? `No scheduled tasks found for the week of ${days[0].toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })} - ${days[days.length - 1].toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}.`
              : `No scheduled tasks found for ${internalCurrentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}.`}
          </p>
        </div>
      )}
    </div>
  );
}
