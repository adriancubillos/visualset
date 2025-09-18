'use client';

import { useState } from 'react';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import GanttChart from '@/components/GanttChart';

export default function SchedulePage() {
  const [activeView, setActiveView] = useState<'calendar' | 'gantt'>('calendar');

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeView === 'calendar'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setActiveView('gantt')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeView === 'gantt'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Gantt Chart (Machine Lanes)
          </button>
        </div>
      </div>

      {activeView === 'gantt' ? <GanttChart /> : <ScheduleCalendar />}
    </div>
  );
}
