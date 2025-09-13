'use client';

import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale'; // ✅ Named import
import TaskModal from './task/TaskModal';

interface Task {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  machine: { id: string; name: string } | null;
  operator: { id: string; name: string } | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Wrap the base Calendar with drag-and-drop HOC
const DnDCalendar = withDragAndDrop<CalendarEvent, object>(Calendar);

export default function ScheduleCalendar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New filter state
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');

  const [machines, setMachines] = useState<{ id: string; name: string }[]>([]);
  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/machines')
      .then((res) => res.json())
      .then(setMachines)
      .catch(console.error);

    fetch('/api/operators')
      .then((res) => res.json())
      .then(setOperators)
      .catch(console.error);

    fetch('/api/projects')
      .then((res) => res.json())
      .then(setProjects)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/schedule')
      .then((res) => res.json())
      .then(setTasks)
      .catch(console.error);
  }, []);

  // // ✅ Unique machines/operators for dropdown
  // const machines = Array.from(new Map(tasks.filter((t) => t.machine).map((t) => [t.machine!.id, t.machine!])).values());
  // const operators = Array.from(
  //   new Map(tasks.filter((t) => t.operator).map((t) => [t.operator!.id, t.operator!])).values(),
  // );

  // ✅ Apply filters
  const filteredTasks = tasks.filter((task) => {
    const machineMatch = selectedMachine === 'all' || task.machine?.id === selectedMachine;
    const operatorMatch = selectedOperator === 'all' || task.operator?.id === selectedOperator;
    return machineMatch && operatorMatch;
  });

  const events: CalendarEvent[] = filteredTasks.map((task) => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventDrop = async ({ event, start }: any) => {
    const updatedTask = tasks.find((t) => t.id === event.id);
    if (!updatedTask) return;

    // Ensure durationMin exists
    const duration = updatedTask.durationMin ?? 60; // fallback 60 minutes

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: updatedTask.id,
          scheduledAt: start.toISOString(),
          durationMin: duration,
          machineId: updatedTask.machine?.id ?? null,
          operatorId: updatedTask.operator?.id ?? null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === data.id ? { ...t, scheduledAt: data.scheduledAt, durationMin: data.durationMin } : t,
          ),
        );
      } else {
        alert(data.error || 'Failed to reschedule task');
      }
    } catch (err) {
      console.error(err);
      alert('Error rescheduling task');
    }
  };

  //BUG fix
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventResize = async ({ event, start, end }: any) => {
    const updatedTask = tasks.find((t) => t.id === event.id);
    if (!updatedTask) return;

    const newDuration = Math.round((end.getTime() - start.getTime()) / 60000); // in minutes

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: updatedTask.id,
          scheduledAt: start.toISOString(),
          durationMin: newDuration,
          machineId: updatedTask.machine?.id ?? null,
          operatorId: updatedTask.operator?.id ?? null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === data.id ? { ...t, scheduledAt: data.scheduledAt, durationMin: data.durationMin } : t,
          ),
        );
      } else {
        alert(data.error || 'Failed to resize task');
      }
    } catch (err) {
      console.error(err);
      alert('Error resizing task');
    }
  };

  // ✅ Save updates from modal
  const handleSaveAssignment = async (update: { projectId: string | null; machineId: string | null; operatorId: string | null }) => {
    if (!selectedTask) return;

    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: selectedTask.id,
        scheduledAt: selectedTask.scheduledAt,
        durationMin: selectedTask.durationMin,
        projectId: update.projectId,
        machineId: update.machineId,
        operatorId: update.operatorId,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      // Update task state
      setTasks((prev) => prev.map((t) => (t.id === data.id ? data : t)));

      // ✅ Close modal after save
      setIsModalOpen(false);
    } else {
      alert(data.error || 'Failed to update assignment');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Schedule</h2>

      {/* ✅ Filters */}
      <div className="flex gap-4 mb-4">
        <select
          value={selectedMachine}
          onChange={(e) => setSelectedMachine(e.target.value)}
          className="border rounded p-2">
          <option value="all">All Machines</option>
          {machines.map((m) => (
            <option
              key={m.id}
              value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={selectedOperator}
          onChange={(e) => setSelectedOperator(e.target.value)}
          className="border rounded p-2">
          <option value="all">All Operators</option>
          {operators.map((o) => (
            <option
              key={o.id}
              value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        defaultView="week"
        views={['week', 'day', 'agenda']}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        resizable={true}
        draggableAccessor={() => true}
        onSelectEvent={(event) => {
          const task = tasks.find((t) => t.id === event.id);
          if (task) {
            setSelectedTask(task);
            setIsModalOpen(true);
          }
        }}
      />

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        onSave={handleSaveAssignment}
        projects={projects}
        machines={machines}
        operators={operators}
      />
    </div>
  );
}
