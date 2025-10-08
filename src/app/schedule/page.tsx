'use client';

import { useState, useEffect } from 'react';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import { logger } from '@/utils/logger';
import { extractErrorMessage } from '@/utils/errorHandling';
import toast from 'react-hot-toast';
import GanttChart from '@/components/gantt/GanttChart';
import PageContainer from '@/components/layout/PageContainer';

interface GanttTask {
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
  };
  machine?: {
    id: string;
    name: string;
    type: string;
  };
}

interface GanttItem {
  id: string;
  name: string;
  status: string;
  tasks: GanttTask[];
}

interface GanttProject {
  id: string;
  name: string;
  color: string;
  status: string;
  items: GanttItem[];
}

interface GanttData {
  projects: GanttProject[];
}

export default function SchedulePage() {
  // Helper function to get current date in browser timezone
  const getTodayInDisplayTimezone = () => {
    // Use native browser Date to get current date and time
    const displayNow = new Date();
    // Return just the date part to avoid time-related issues
    return new Date(displayNow.getFullYear(), displayNow.getMonth(), displayNow.getDate());
  };

  const [activeTab, setActiveTab] = useState<'calendar' | 'gantt'>('calendar');
  const [ganttData, setGanttData] = useState<GanttData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(getTodayInDisplayTimezone());
  const [currentDate, setCurrentDate] = useState(getTodayInDisplayTimezone());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    if (activeTab === 'gantt' && !ganttData) {
      const fetchGanttData = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/gantt');
          if (response.ok) {
            const data = await response.json();
            setGanttData(data);
          } else {
            const errorMessage = await extractErrorMessage(response, 'Failed to fetch Gantt data');
            logger.apiError('Fetch Gantt data', '/api/gantt', errorMessage);
            toast.error(errorMessage);
          }
        } catch (error) {
          logger.error('Error fetching Gantt data', error);
          toast.error('Error loading schedule data');
        } finally {
          setLoading(false);
        }
      };

      fetchGanttData();
    }
  }, [activeTab, ganttData]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToPrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate((prev) => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() - 1);
        return newDate;
      });
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() - 7);
        return newDate;
      });
    } else {
      goToPreviousMonth();
    }
  };

  const goToNext = () => {
    if (viewMode === 'day') {
      setCurrentDate((prev) => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
      });
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + 7);
        return newDate;
      });
    } else {
      goToNextMonth();
    }
  };

  const goToCurrentMonth = () => {
    const todayInDisplayTz = getTodayInDisplayTimezone();
    setCurrentMonth(todayInDisplayTz);
    setCurrentDate(todayInDisplayTz);
  };

  const formatDateTitle = (date: Date) => {
    // Format the date directly since navigation dates are already in the correct timezone context
    switch (viewMode) {
      case 'day':
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} - ${weekEnd.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`;
      case 'month':
      default:
        return date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
    }
  };
  return (
    <PageContainer
      header={{
        title: 'Production Schedule',
        description: 'View schedules in calendar or Gantt chart format',
      }}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            📅 Calendar View
          </button>
          <button
            onClick={() => setActiveTab('gantt')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'gantt'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            📈 Gantt Chart
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'calendar' && <ScheduleCalendar />}
      {activeTab === 'gantt' && (
        <div className="space-y-4">
          {/* Gantt Controls */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex justify-between items-center py-4">
              {/* Navigation Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={goToPrevious}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous
                </button>
                <h2 className="text-lg font-semibold text-gray-900 min-w-[280px] text-center">
                  {formatDateTitle(viewMode === 'month' ? currentMonth : currentDate)}
                </h2>
                <button
                  onClick={goToNext}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Next
                  <svg
                    className="w-4 h-4 ml-1"
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
                </button>
                <button
                  onClick={goToCurrentMonth}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Today
                </button>
              </div>

              {/* View Mode Controls */}
              <div className="flex items-center space-x-4">
                <div className="flex rounded-md shadow-sm">
                  <button
                    onClick={() => {
                      setViewMode('month');
                      // Keep currentMonth as is for month view
                    }}
                    className={`px-4 py-2 text-sm font-medium border rounded-l-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      viewMode === 'month'
                        ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700'
                        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                    }`}>
                    Month
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('week');
                      setCurrentDate(getTodayInDisplayTimezone()); // Set to today for week view
                    }}
                    className={`px-4 py-2 text-sm font-medium border-t border-b focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      viewMode === 'week'
                        ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700'
                        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                    }`}>
                    Week
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('day');
                      setCurrentDate(getTodayInDisplayTimezone()); // Set to today for day view
                    }}
                    className={`px-4 py-2 text-sm font-medium border rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      viewMode === 'day'
                        ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700'
                        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                    }`}>
                    Day
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading Gantt chart...</div>
            </div>
          ) : ganttData ? (
            <GanttChart
              projects={ganttData.projects}
              currentMonth={currentMonth}
              currentDate={currentDate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          ) : (
            <div className="text-center text-gray-500 h-64 flex items-center justify-center">
              No Gantt data available
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
