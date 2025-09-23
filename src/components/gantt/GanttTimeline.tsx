import React from 'react';

interface GanttTimelineProps {
  days: Date[];
  dayWidth: number;
}

export default function GanttTimeline({ days, dayWidth }: GanttTimelineProps) {
  const formatDay = (date: Date) => {
    return date.getDate().toString();
  };

  const formatDayOfWeek = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="border-b border-gray-300">
      <div className="flex">
        {/* Fixed header for hierarchy */}
        <div className="w-80 border-r border-gray-300 bg-gray-100 flex items-center justify-center">
          <span className="font-semibold text-gray-700">Project / Item / Task</span>
        </div>

        {/* Timeline header */}
        <div className="flex-1 bg-gray-100">
          <div className="flex">
            {days.map((day, index) => (
              <div
                key={index}
                className={`border-r border-gray-200 text-center ${isWeekend(day) ? 'bg-gray-200' : 'bg-gray-100'} ${
                  isToday(day) ? 'bg-blue-100 border-blue-300' : ''
                }`}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
