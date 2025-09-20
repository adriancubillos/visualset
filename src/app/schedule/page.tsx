'use client';

import ScheduleCalendar from '@/components/ScheduleCalendar';

export default function SchedulePage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <p className="text-gray-600">View and manage task schedules</p>
      </div>

      <ScheduleCalendar />
    </div>
  );
}
