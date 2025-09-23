'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GanttChart from '@/components/gantt/GanttChart';

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
  status: string;
  color?: string;
  pattern?: string;
  items: GanttItem[];
}

interface GanttData {
  projects: GanttProject[];
}

export default function GanttPage() {
  const [data, setData] = useState<GanttData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [operatorFilter, setOperatorFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchGanttData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/gantt');
        if (response.ok) {
          const ganttData = await response.json();
          setData(ganttData);
        } else {
          console.error('Failed to fetch Gantt data');
        }
      } catch (error) {
        console.error('Error fetching Gantt data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGanttData();
  }, []);

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

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Filter projects based on current filters
  const getFilteredProjects = () => {
    if (!data) return [];

    return data.projects
      .map((project) => ({
        ...project,
        items: project.items
          .map((item) => ({
            ...item,
            tasks: item.tasks.filter((task) => {
              // Status filter
              if (statusFilter !== 'all' && task.status.toLowerCase() !== statusFilter.toLowerCase()) {
                return false;
              }

              // Operator filter
              if (operatorFilter !== 'all' && (!task.operator || task.operator.id !== operatorFilter)) {
                return false;
              }

              // Search filter
              if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
              }

              return true;
            }),
          }))
          .filter((item) => item.tasks.length > 0), // Only show items with visible tasks
      }))
      .filter((project) => project.items.length > 0); // Only show projects with visible items
  };

  // Get unique operators for filter dropdown
  const getAvailableOperators = () => {
    if (!data) return [];

    const operators = new Map();
    data.projects.forEach((project) => {
      project.items.forEach((item) => {
        item.tasks.forEach((task) => {
          if (task.operator) {
            operators.set(task.operator.id, task.operator);
          }
        });
      });
    });

    return Array.from(operators.values());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <nav
                className="flex mb-2"
                aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  <li>
                    <Link
                      href="/"
                      className="text-blue-600 hover:text-blue-800">
                      Dashboard
                    </Link>
                  </li>
                  <li className="text-gray-500">/</li>
                  <li className="text-gray-900 font-medium">Schedule</li>
                </ol>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">Production Schedule</h1>
              <p className="text-gray-600">Gantt chart view of projects, items, and tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Month Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousMonth}
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

              <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                {formatMonthYear(currentMonth)}
              </h2>

              <button
                onClick={goToNextMonth}
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

            {/* View Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex rounded-md shadow-sm">
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-l-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Month
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-t border-b border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Week
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Day
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {data && data.projects.length > 0 ? (
          <GanttChart
            projects={data.projects}
            currentMonth={currentMonth}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Tasks</h3>
              <p>There are no tasks with scheduled dates to display.</p>
              <Link
                href="/tasks"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Manage Tasks
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
