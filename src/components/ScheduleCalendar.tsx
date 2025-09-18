'use client';

import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale'; // ✅ Named import
import TaskModal from './task/TaskModal';
import { formatDateTimeGMTMinus5, convertTaskTimeForDisplay, adjustDragPositionForTimezone } from '@/utils/timezone';
import { handleTaskAssignmentUpdate, TaskAssignmentUpdate } from '@/utils/taskAssignment';

interface Task {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  project: { id: string; name: string } | null;
  machine: { id: string; name: string } | null;
  operator: { id: string; name: string } | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: {
    color: string;
    machine?: string;
    project?: string;
    duration: number;
  };
}

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Wrap the base Calendar with drag-and-drop HOC
const DnDCalendar = withDragAndDrop<CalendarEvent, object>(Calendar);

export default function ScheduleCalendar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'week' | 'day' | 'agenda'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // New filter state
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

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
    const projectMatch = selectedProject === 'all' || task.project?.id === selectedProject;
    return machineMatch && operatorMatch && projectMatch;
  });

  // Color coding function similar to GanttChart
  const getEventColor = (task: Task) => {
    if (!task.project) return '#6b7280'; // gray-500
    
    const colors = [
      '#3b82f6', // blue-500
      '#10b981', // green-500
      '#8b5cf6', // purple-500
      '#f59e0b', // orange-500
      '#ec4899', // pink-500
      '#6366f1', // indigo-500
    ];
    
    const hash = task.project.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const events: CalendarEvent[] = filteredTasks.map((task) => {
    const { start, end } = convertTaskTimeForDisplay(task.scheduledAt, task.durationMin);
    return {
      id: task.id,
      title: `${task.title} - ${task.project?.name ?? 'No project'}`,
      start,
      end,
      allDay: false,
      resource: {
        color: getEventColor(task),
        machine: task.machine?.name,
        project: task.project?.name,
        duration: task.durationMin
      }
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventDrop = async ({ event, start }: any) => {
    const updatedTask = tasks.find((t) => t.id === event.id);
    if (!updatedTask) return;

    // Ensure durationMin exists
    const duration = updatedTask.durationMin ?? 60; // fallback 60 minutes

    // Calendar shows EDT (GMT-4) but API expects GMT-5 time
    // Convert EDT to GMT-5: add 1 hour to match expected timezone
    const adjustedStart = new Date(start.getTime() + (60 * 60 * 1000));

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: updatedTask.id,
          scheduledAt: adjustedStart.toISOString(),
          durationMin: duration,
          machineId: updatedTask.machine?.id ?? null,
          operatorId: updatedTask.operator?.id ?? null,
          projectId: updatedTask.project?.id ?? null,
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

    // Calendar shows EDT (GMT-4) but API expects GMT-5 time
    // Convert EDT to GMT-5: add 1 hour to match expected timezone
    const adjustedStart = new Date(start.getTime() + (60 * 60 * 1000));

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: updatedTask.id,
          scheduledAt: adjustedStart.toISOString(),
          durationMin: newDuration,
          machineId: updatedTask.machine?.id ?? null,
          operatorId: updatedTask.operator?.id ?? null,
          projectId: updatedTask.project?.id ?? null,
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
  const handleSaveAssignment = async (update: TaskAssignmentUpdate) => {
    await handleTaskAssignmentUpdate(
      selectedTask,
      update,
      (updatedTask) => setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))),
      () => setIsModalOpen(false)
    );
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Production Calendar</h2>
          <p className="text-slate-600">Weekly and daily task scheduling</p>
        </div>
      </div>

      {/* Modern Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg p-3 text-slate-700 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors">
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Machine</label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg p-3 text-slate-700 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors">
              <option value="all">All Machines</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Operator</label>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg p-3 text-slate-700 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors">
              <option value="all">All Operators</option>
              {operators.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={currentView}
          onView={(view) => setCurrentView(view as 'week' | 'day' | 'agenda')}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
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
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.resource?.color || '#6b7280',
              borderColor: event.resource?.color || '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '500',
              padding: '2px 8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }
          })}
          components={{
            event: ({ event }) => (
              <div className="p-1">
                <div className="font-medium truncate">{event.title}</div>
                {event.resource?.machine && (
                  <div className="text-xs opacity-75 truncate">
                    {event.resource.machine} • {event.resource.duration}m
                  </div>
                )}
              </div>
            )
          }}
        />
      </div>

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
