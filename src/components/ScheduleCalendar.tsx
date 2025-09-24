'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale'; // ✅ Named import
import TaskModal from './task/TaskModal';
import { convertTaskTimeForDisplay, getCurrentDisplayTimezoneDate, convertDragPositionToUTC } from '@/utils/timezone';
import { getProjectColor, getOperatorColor, getMachineColor, getPatternStyles, type PatternType } from '@/utils/colors';
import { handleTaskAssignmentUpdate, TaskAssignmentUpdate } from '@/utils/taskAssignment';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  durationMin: number;
  status: string;
  project: { id: string; name: string; color?: string | null } | null;
  item: { id: string; name: string } | null;
  machine: { id: string; name: string; type?: string; location?: string } | null;
  operator: { id: string; name: string; email?: string | null; shift?: string | null } | null;
  createdAt: string;
  updatedAt: string;
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
    operatorColor?: string;
    operatorPattern?: string;
    machineColor?: string;
    machinePattern?: string;
    // Additional tooltip data
    status: string;
    description?: string | null;
    item?: string;
    machineType?: string;
    machineLocation?: string;
    operatorEmail?: string | null;
    operatorShift?: string | null;
    startDate?: string;
    endDate?: string;
  };
}

interface DragDropEvent {
  event: CalendarEvent;
  start: string | Date;
  end?: string | Date;
}

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Wrap the base Calendar with drag-and-drop HOC
const DnDCalendar = withDragAndDrop<CalendarEvent, object>(Calendar);

// Helper function to get duration text
const getDurationText = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// Helper function to format dates for display
const formatDisplayDate = (dateStr: string): string => {
  const { start } = convertTaskTimeForDisplay(dateStr, 0);
  const monthName = start.toLocaleDateString('en-US', { month: 'short' });
  const day = start.getDate();
  const time = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${monthName} ${day}, ${time}`;
};

export default function ScheduleCalendar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'week' | 'day' | 'agenda'>('week');
  const [currentDate, setCurrentDate] = useState(() => getCurrentDisplayTimezoneDate());
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // New filter state
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const [machines, setMachines] = useState<{ id: string; name: string }[]>([]);
  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; color?: string | null }[]>([]);
  const [items, setItems] = useState<{ id: string; name: string; project?: { name: string } }[]>([]);

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
      .then((data) => {
        setProjects(data);
        // Extract items from projects for TaskModal
        const allItems = data.flatMap((p: { id: string; name: string; items?: { id: string; name: string }[] }) =>
          (p.items || []).map((item: { id: string; name: string }) => ({ ...item, project: { name: p.name } })),
        );
        setItems(allItems);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/schedule')
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
      })
      .catch(console.error);
  }, []);

  // // ✅ Unique machines/operators for dropdown
  // const machines = Array.from(new Map(tasks.filter((t) => t.machine).map((t) => [t.machine!.id, t.machine!])).values());
  // const operators = Array.from(
  //   new Map(tasks.filter((t) => t.operator).map((t) => [t.operator!.id, t.operator!])).values(),
  // );

  // ✅ Apply filters - memoized to prevent unnecessary recalculations
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const machineMatch = selectedMachine === 'all' || task.machine?.id === selectedMachine;
      const operatorMatch = selectedOperator === 'all' || task.operator?.id === selectedOperator;
      const projectMatch = selectedProject === 'all' || task.project?.id === selectedProject;
      return machineMatch && operatorMatch && projectMatch;
    });
  }, [tasks, selectedMachine, selectedOperator, selectedProject]);

  // Color coding function using consistent project color system - memoized
  const getEventColor = useCallback((task: Task) => {
    if (!task.project) return '#6b7280'; // gray-500
    return getProjectColor(task.project).hex;
  }, []);

  // Memoize events array to prevent recreation on every render
  const events: CalendarEvent[] = useMemo(() => {
    return filteredTasks.map((task) => {
      const { start, end } = convertTaskTimeForDisplay(task.scheduledAt, task.durationMin);

      // Get operator colors/patterns
      const operatorColor = task.operator ? getOperatorColor(task.operator) : null;
      const machineColor = task.machine ? getMachineColor(task.machine) : null;

      return {
        id: task.id,
        title: task.title, // Just the task title, project info goes in tooltip
        start,
        end,
        allDay: false,
        resource: {
          color: getEventColor(task),
          machine: task.machine?.name,
          project: task.project?.name,
          duration: task.durationMin,
          operatorColor: operatorColor?.hex || '#6b7280',
          operatorPattern: operatorColor?.pattern || 'solid',
          machineColor: machineColor?.hex || '#6b7280',
          machinePattern: machineColor?.pattern || 'solid',
          // Additional tooltip data
          status: task.status,
          description: task.description,
          item: task.item?.name,
          machineType: task.machine?.type,
          machineLocation: task.machine?.location,
          operatorEmail: task.operator?.email,
          operatorShift: task.operator?.shift,
          startDate: formatDisplayDate(task.scheduledAt),
          endDate: formatDisplayDate(
            new Date(new Date(task.scheduledAt).getTime() + task.durationMin * 60 * 1000).toISOString(),
          ),
        },
      };
    });
  }, [filteredTasks, getEventColor]);
  const handleEventDrop = useCallback(
    async ({ event, start }: DragDropEvent) => {
      const updatedTask = tasks.find((t) => t.id === event.id);
      if (!updatedTask) return;

      // Ensure durationMin exists
      const duration = updatedTask.durationMin ?? 60; // fallback 60 minutes

      // Convert start to Date if it's a string
      const startDate = typeof start === 'string' ? new Date(start) : start;

      // Use proper timezone conversion instead of hardcoded adjustment
      const utcTimeString = convertDragPositionToUTC(startDate, 0);

      try {
        const res = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: updatedTask.id,
            scheduledAt: utcTimeString,
            durationMin: duration,
            machineId: updatedTask.machine?.id ?? null,
            operatorId: updatedTask.operator?.id ?? null,
            itemId: updatedTask.item?.id ?? null,
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
    },
    [tasks],
  );

  const handleEventResize = useCallback(
    async ({ event, start, end }: DragDropEvent & { end: string | Date }) => {
      const updatedTask = tasks.find((t) => t.id === event.id);
      if (!updatedTask) return;

      // Convert start and end to Date if they're strings
      const startDate = typeof start === 'string' ? new Date(start) : start;
      const endDate = typeof end === 'string' ? new Date(end) : end;

      const newDuration = Math.round((endDate.getTime() - startDate.getTime()) / 60000); // in minutes

      // Use proper timezone conversion instead of hardcoded adjustment
      const utcTimeString = convertDragPositionToUTC(startDate, 0);

      try {
        const res = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: updatedTask.id,
            scheduledAt: utcTimeString,
            durationMin: newDuration,
            machineId: updatedTask.machine?.id ?? null,
            operatorId: updatedTask.operator?.id ?? null,
            itemId: updatedTask.item?.id ?? null,
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
    },
    [tasks],
  );

  // ✅ Save updates from modal - memoized
  const handleSaveAssignment = useCallback(
    async (update: TaskAssignmentUpdate) => {
      await handleTaskAssignmentUpdate(
        selectedTask,
        update,
        (updatedTask) => {
          // Convert the response to match our extended Task interface
          setTasks((prev) =>
            prev.map((t) => {
              if (t.id === updatedTask.id) {
                return {
                  ...t, // Keep existing fields
                  ...updatedTask, // Apply updates
                  // Ensure required fields are present
                  status: t.status,
                  createdAt: t.createdAt,
                  updatedAt: t.updatedAt,
                };
              }
              return t;
            }),
          );
        },
        () => setIsModalOpen(false),
      );
    },
    [selectedTask],
  );

  // Memoize event selection handler
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      const task = tasks.find((t) => t.id === event.id);
      if (task) {
        setSelectedTask(task);
        setHoveredEventId(null); // Clear tooltip when opening modal
        setIsModalOpen(true);
      }
    },
    [tasks],
  );

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
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
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
                <option
                  key={p.id}
                  value={p.id}>
                  {p.name}
                </option>
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
                <option
                  key={m.id}
                  value={m.id}>
                  {m.name}
                </option>
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
                <option
                  key={o.id}
                  value={o.id}>
                  {o.name}
                </option>
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
          onSelectEvent={handleSelectEvent}
          eventPropGetter={() => ({
            style: {
              backgroundColor: 'transparent', // We'll handle colors in the custom component
              borderColor: 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '500',
              padding: '0', // Remove padding since we'll handle it in the custom component
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'visible',
            },
          })}
          components={{
            event: ({ event }) => {
              const operatorStyle = getPatternStyles(
                event.resource?.operatorColor || '#6b7280',
                (event.resource?.operatorPattern as PatternType) || 'solid',
              );
              const machineStyle = getPatternStyles(
                event.resource?.machineColor || '#6b7280',
                (event.resource?.machinePattern as PatternType) || 'solid',
              );

              return (
                <div
                  className="relative w-full h-full rounded-lg cursor-pointer"
                  onMouseEnter={(e) => {
                    setMousePosition({ x: e.clientX, y: e.clientY });
                    setHoveredEventId(event.id);
                  }}
                  onMouseMove={(e) => {
                    if (hoveredEventId === event.id) {
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredEventId(null);
                  }}>
                  {/* Split background: left half operator, right half machine */}
                  <div className="absolute inset-0 flex">
                    <div
                      className="flex-1"
                      style={operatorStyle}
                    />
                    <div
                      className="flex-1"
                      style={machineStyle}
                    />
                  </div>

                  {/* Content overlay */}
                  <div className="relative z-10 p-1 h-full flex flex-col justify-center text-white">
                    <div className="font-medium truncate text-xs leading-tight">{event.title}</div>
                    {event.resource?.machine && (
                      <div className="text-xs opacity-90 truncate leading-tight">
                        {event.resource.machine} • {getDurationText(event.resource.duration)}
                      </div>
                    )}
                  </div>

                  {/* Text shadow overlay for better readability */}
                  <div className="absolute inset-0 bg-black opacity-20 rounded-lg"></div>

                  {/* Tooltip on hover - using state-based visibility */}
                  {hoveredEventId === event.id && (
                    <div
                      className="
                      fixed z-[9999]
                      bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg
                      pointer-events-none whitespace-nowrap max-w-xs
                    "
                      style={{
                        left: `${mousePosition.x + 10}px`,
                        top: `${mousePosition.y - 80}px`,
                        transform: mousePosition.y < 100 ? 'translateY(100px)' : 'none',
                      }}>
                      <div className="font-semibold mb-1">{event.title}</div>
                      <div>Status: {event.resource?.status || 'UNKNOWN'}</div>
                      <div>Duration: {getDurationText(event.resource?.duration || 0)}</div>
                      {event.resource?.startDate && <div>Start: {event.resource.startDate}</div>}
                      {event.resource?.endDate && <div>End: {event.resource.endDate}</div>}
                      {tasks.find((t) => t.id === event.id)?.operator && (
                        <div>Operator: {tasks.find((t) => t.id === event.id)?.operator?.name}</div>
                      )}
                      {event.resource?.machine && (
                        <div>
                          Machine: {event.resource.machine}
                          {event.resource?.machineType && ` (${event.resource.machineType})`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            },
          }}
        />
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        onSave={handleSaveAssignment}
        items={items}
        machines={machines}
        operators={operators}
      />
    </div>
  );
}

/**
 * Problems:

Hardcoded timezone conversion instead of using your centralized timezone utilities
Comments mention EDT (GMT-4) but your app is configured for GMT-5
Manual hour adjustment doesn't account for daylight saving time changes
Inconsistent with the Gantt chart which now uses proper timezone utilities
2. Performance Issues
3. State Management Issues
Multiple useEffect hooks fetching data separately
No memoization of expensive computations
Filter state causes full re-render of calendar
4. Accessibility & UX
No keyboard navigation support
Limited screen reader support
Error handling uses basic alert() notifications
Recommendations for Improvement 🚀
Priority 1: Fix Timezone Handling
Replace hardcoded timezone conversion with your centralized utilities:

Priority 2: Performance Optimization
Memoize events array with useMemo
Optimize filtering with useCallback
Debounce filter changes
Priority 3: Consistency
Align calendar timezone behavior with Gantt chart
Use same color system and formatting
Consistent date/time handling across components
Priority 4: Enhanced Features
Better error handling with toast notifications
Loading states during API calls
Keyboard shortcuts for common actions
Better mobile responsiveness
Specific Code Issues Found
Line 52: useState(new Date()) - should use timezone-aware current date
Lines 141 & 185: Hardcoded "+1 hour" adjustments
Line 117: convertTaskTimeForDisplay called in render loop
No error boundaries for calendar failures
Missing loading states during data fetching

 * 
 */
