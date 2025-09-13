'use client';

import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US'; // <-- ESM import
import 'react-big-calendar/lib/css/react-big-calendar.css';

interface Task {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  machine: { id: string; name: string } | null;
  operator: { id: string; name: string } | null;
}

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function ScheduleCalendar() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch('/api/schedule')
      .then((res) => res.json())
      .then(setTasks);
  }, []);

  const events: Event[] = tasks.map((task) => {
    const start = new Date(task.scheduledAt);
    const end = new Date(start.getTime() + task.durationMin * 60 * 1000);
    return {
      id: task.id,
      title: `${task.title} (${task.machine?.name ?? 'No machine'})`,
      start,
      end,
      allDay: false,
    };
  });

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Schedule</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        defaultView="week"
        views={['week', 'day', 'agenda']}
      />
    </div>
  );
}
