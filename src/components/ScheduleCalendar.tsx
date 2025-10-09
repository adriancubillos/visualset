'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale'; // ✅ Named import
import TaskModal from './task/TaskModal';
import { getProjectColor, getOperatorColor, getMachineColor, getPatternStyles, type PatternType } from '@/utils/colors';
import { handleTaskAssignmentUpdate, TaskAssignmentUpdate } from '@/utils/taskAssignment';
import FilterSelect from './ui/FilterSelect';
import { sortByName } from '@/utils/sorting';
import { logger } from '@/utils/logger';
import toast from 'react-hot-toast';
import { displayConflictError } from '@/utils/taskErrorHandling';
import { updateTaskWithConfirm } from '@/utils/taskApi';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  quantity?: number;
  completed_quantity?: number;
  project: { id: string; name: string; color?: string | null } | null;
  item: { id: string; name: string } | null;
  machines?: { id: string; name: string; type?: string; location?: string }[];
  operators?: { id: string; name: string; email?: string | null; shift?: string | null }[];
  timeSlots?: {
    id: string;
    startDateTime: string;
    endDateTime?: string | null;
    durationMin: number;
  }[];
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
    machines?: string[];
    project?: string;
    duration: number;
    operators?: { name: string; color: string; pattern: string }[];
    machineColors?: { name: string; color: string; pattern: string }[];
    status: string;
    description?: string | null;
    item?: string;
    machineTypes?: string[];
    machineLocations?: string[];
    operatorEmails?: (string | null)[];
    operatorShifts?: (string | null)[];
    startDate?: string;
    endDate?: string;
    originalTaskId?: string;
    slotIndex?: number;
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
  const start = new Date(dateStr);
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
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'week' | 'day' | 'agenda'>('week');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Use ref to track hovered event without triggering re-renders
  const hoveredEventRef = useRef<string | null>(null);

  // New filter state
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<string>('all');

  // Row height control (30-minute slot height in pixels)
  const [rowHeight, setRowHeight] = useState<number>(60);

  const [machines, setMachines] = useState<{ id: string; name: string }[]>([]);
  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; color?: string | null }[]>([]);
  const [items, setItems] = useState<{ id: string; name: string; project?: { id: string; name: string } }[]>([]);

  useEffect(() => {
    fetch('/api/machines')
      .then((res) => res.json())
      .then(setMachines)
      .catch((error) => logger.apiError('Fetch machines', '/api/machines', error));

    fetch('/api/operators')
      .then((res) => res.json())
      .then(setOperators)
      .catch((error) => logger.apiError('Fetch operators', '/api/operators', error));

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
      .catch((error) => logger.apiError('Fetch projects', '/api/projects', error));
  }, []);

  useEffect(() => {
    fetch('/api/schedule')
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
      })
      .catch((error) => logger.apiError('Fetch schedule', '/api/schedule', error));
  }, []);

  // // ✅ Unique machines/operators for dropdown
  // const machines = Array.from(new Map(tasks.filter((t) => t.machine).map((t) => [t.machine!.id, t.machine!])).values());
  // const operators = Array.from(
  //   new Map(tasks.filter((t) => t.operator).map((t) => [t.operator!.id, t.operator!])).values(),
  // );

  // ✅ Apply filters - memoized to prevent unnecessary recalculations
  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const taskMachines = task.machines || [];
      const taskOperators = task.operators || [];

      const machineMatch = selectedMachine === 'all' || taskMachines.some((m) => m.id === selectedMachine);
      const operatorMatch = selectedOperator === 'all' || taskOperators.some((o) => o.id === selectedOperator);
      const projectMatch = selectedProject === 'all' || task.project?.id === selectedProject;
      const itemMatch = selectedItem === 'all' || task.item?.id === selectedItem;
      return machineMatch && operatorMatch && projectMatch && itemMatch;
    });

    return filtered;
  }, [tasks, selectedMachine, selectedOperator, selectedProject, selectedItem]);

  // ✅ Get items filtered by selected project - memoized
  const availableItems = useMemo(() => {
    if (selectedProject === 'all') {
      return items;
    }
    // Find the selected project and get its items
    const project = projects.find((p) => p.id === selectedProject);
    if (!project) return [];

    return items.filter((item) =>
      tasks.some((task) => task.project?.id === selectedProject && task.item?.id === item.id),
    );
  }, [items, selectedProject, projects, tasks]);

  // ✅ Reset item selection when project changes
  useEffect(() => {
    setSelectedItem('all');
  }, [selectedProject]);

  // Color coding function using consistent project color system - memoized
  const getEventColor = useCallback((task: Task) => {
    if (!task.project) return '#6b7280'; // gray-500
    return getProjectColor(task.project).hex;
  }, []);

  // Memoize events array to prevent recreation on every render
  const events: CalendarEvent[] = useMemo(() => {
    const eventList = filteredTasks
      .flatMap((task) => {
        // Create a separate calendar event for each time slot
        if (!task.timeSlots || task.timeSlots.length === 0) {
          return null;
        }

        return task.timeSlots.map((slot, slotIndex) => {
          const start = new Date(slot.startDateTime);
          const end = slot.endDateTime
            ? new Date(slot.endDateTime)
            : new Date(start.getTime() + slot.durationMin * 60000);

          const taskMachines = task.machines || [];
          const taskOperators = task.operators || [];

          // Get colors/patterns for all operators and machines
          const operatorData = taskOperators.map((op) => {
            const colorData = getOperatorColor(op);
            return {
              name: op.name,
              color: colorData.hex,
              pattern: colorData.pattern,
            };
          });

          const machineData = taskMachines.map((m) => {
            const colorData = getMachineColor(m);
            return {
              name: m.name,
              color: colorData.hex,
              pattern: colorData.pattern,
            };
          });

          return {
            id: `${task.id}-${slotIndex}`, // Unique ID for each time slot
            title: task.title + (task.timeSlots && task.timeSlots.length > 1 ? ` (Slot ${slotIndex + 1})` : ''), // Add slot number if multiple slots
            start,
            end,
            allDay: false,
            resource: {
              color: getEventColor(task),
              machines: taskMachines.map((m) => m.name),
              project: task.project?.name,
              duration: slot.durationMin,
              operators: operatorData,
              machineColors: machineData,
              // Additional tooltip data
              status: task.status,
              description: task.description,
              item: task.item?.name,
              machineTypes: taskMachines.map((m) => m.type).filter(Boolean) as string[],
              machineLocations: taskMachines.map((m) => m.location).filter(Boolean) as string[],
              operatorEmails: taskOperators.map((o) => o.email ?? null),
              operatorShifts: taskOperators.map((o) => o.shift ?? null),
              startDate: formatDisplayDate(slot.startDateTime),
              endDate: formatDisplayDate(end.toISOString()),
              // Store original task ID and slot info for event handling
              originalTaskId: task.id,
              slotIndex: slotIndex,
            },
          };
        });
      })
      .filter((event): event is NonNullable<typeof event> => event !== null); // Type-safe filter

    return eventList;
  }, [filteredTasks, getEventColor]);
  const handleEventDrop = useCallback(
    async ({ event, start }: DragDropEvent) => {
      // Extract original task ID and slot index from event
      const originalTaskId = event.resource?.originalTaskId || event.id.split('-')[0];
      const slotIndex = event.resource?.slotIndex ?? parseInt(event.id.split('-')[1] || '0');
      const updatedTask = tasks.find((t) => t.id === originalTaskId);

      if (!updatedTask || !updatedTask.timeSlots || slotIndex >= updatedTask.timeSlots.length) {
        logger.error('Invalid task or slot index for drag drop');
        return;
      }

      // Get the specific time slot that was dragged
      const draggedSlot = updatedTask.timeSlots[slotIndex];
      if (!draggedSlot) {
        logger.error('Could not find dragged slot');
        return;
      }

      // Convert the drag position to a proper UTC time string
      const startDate = typeof start === 'string' ? new Date(start) : start;

      // Extract date and time components from the local drag position
      const year = startDate.getFullYear();
      const month = startDate.getMonth() + 1;
      const day = startDate.getDate();
      const hours = startDate.getHours();
      const minutes = startDate.getMinutes();

      // Format as strings and convert to UTC
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      const localDateTime = new Date(`${dateStr}T${timeStr}:00`); // Local time
      const utcStartTime = localDateTime.toISOString(); // Convert to UTC

      // Calculate end time based on original duration
      const endTime = new Date(localDateTime.getTime() + draggedSlot.durationMin * 60 * 1000);
      const utcEndTime = endTime.toISOString();

      // Create updated time slots array with only the dragged slot modified
      const updatedTimeSlots = updatedTask.timeSlots.map((slot, index) => {
        if (index === slotIndex) {
          return {
            ...slot,
            startDateTime: utcStartTime,
            endDateTime: utcEndTime,
          };
        }
        return slot;
      });

      try {
        const payload = {
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status,
          quantity: updatedTask.quantity || 1,
          completed_quantity: updatedTask.completed_quantity || 0,
          itemId: updatedTask.item?.id || null,
          machineIds: updatedTask.machines?.map((m) => m.id) || [],
          operatorIds: updatedTask.operators?.map((o) => o.id) || [],
          timeSlots: updatedTimeSlots.map((slot) => ({
            startDateTime: slot.startDateTime,
            endDateTime: slot.endDateTime,
            durationMin: slot.durationMin,
          })),
        };

        const result = await updateTaskWithConfirm(updatedTask.id, payload, {
          existingStatus: tasks.find((t) => t.id === updatedTask.id)?.status,
          newStatus: updatedTask.status,
          // Drag/drop modifies timeSlots only; use PATCH to avoid overwriting other relations
          method: 'PATCH',
        });

        if (result.ok && result.data) {
          const data = result.data as Record<string, unknown>;
          const updated = { ...(data as unknown as Record<string, unknown>) } as Partial<Task>;

          // If status is COMPLETED and server didn't return completed_quantity, infer from quantity
          if (updated.status === 'COMPLETED' && updated.completed_quantity === undefined) {
            const current = tasks.find((t) => t.id === updated.id);
            const qty = (updated.quantity as number | undefined) ?? current?.quantity ?? 0;
            updated.completed_quantity = qty;
          }

          setTasks((prev) => prev.map((task) => (task.id === (data.id as string) ? { ...task, ...updated } : task)));
          toast.success('Task rescheduled successfully');
        } else {
          const serverData = result.data as Record<string, unknown> | undefined;
          if (serverData && (serverData as unknown as { conflict?: boolean }).conflict) {
            displayConflictError(serverData);
          } else {
            const errObj =
              result.error ??
              (serverData && (serverData as unknown as { error?: unknown }).error) ??
              'Failed to reschedule task';
            logger.error('Error updating task during drag operation', errObj);
            let errorMessage = 'Failed to reschedule task';
            if (typeof errObj === 'string') errorMessage = errObj;
            else if (typeof errObj === 'object' && errObj && 'message' in (errObj as Record<string, unknown>)) {
              const maybe = errObj as Record<string, unknown>;
              if (typeof maybe.message === 'string') errorMessage = maybe.message;
            }
            toast.error(errorMessage || 'Failed to reschedule task');
          }
        }
      } catch (err) {
        logger.error('Error rescheduling task', err);
        toast.error('Error rescheduling task. Please try again.');
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
                  ...updatedTask, // Apply updates (including status)
                  // Ensure required fields are present
                  createdAt: t.createdAt,
                  updatedAt: t.updatedAt,
                };
              }
              return t;
            }),
          );

          // Also update the selectedTask state if it's the same task
          if (selectedTask && selectedTask.id === updatedTask.id) {
            setSelectedTask({
              ...selectedTask,
              ...updatedTask,
              createdAt: selectedTask.createdAt,
              updatedAt: selectedTask.updatedAt,
            });
          }
        },
        () => setIsModalOpen(false),
      );
    },
    [selectedTask],
  );

  // Memoize event selection handler with debouncing to prevent multiple rapid clicks
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      // Extract original task ID and slot index from event resource
      const originalTaskId = event.resource?.originalTaskId || event.id.split('-')[0];
      const slotIndex = event.resource?.slotIndex ?? parseInt(event.id.split('-')[1] || '0');
      const task = tasks.find((t) => t.id === originalTaskId);
      if (task) {
        setSelectedTask(task);
        setSelectedSlotIndex(slotIndex); // Track which slot was clicked
        setHoveredEventId(null); // Clear tooltip when opening modal
        setIsModalOpen(true);
      }
    },
    [tasks], // Include isModalOpen in dependencies since we use it in the timeout
  );

  // Memoize the event component to prevent constant re-rendering on mouse events
  const EventComponent = useCallback(
    ({ event }: { event: CalendarEvent }) => {
      // Get the first operator and machine for the split background
      const firstOperator = event.resource?.operators?.[0];
      const firstMachine = event.resource?.machineColors?.[0];

      const operatorStyle = firstOperator
        ? getPatternStyles(firstOperator.color, firstOperator.pattern as PatternType)
        : getPatternStyles('#6b7280', 'solid');

      const machineStyle = firstMachine
        ? getPatternStyles(firstMachine.color, firstMachine.pattern as PatternType)
        : getPatternStyles('#6b7280', 'solid');

      return (
        <div
          className="relative w-full h-full rounded-lg cursor-pointer border-2 border-transparent hover:border-blue-300"
          title="" // Disable browser's default tooltip
          onClick={(e) => {
            // Single, reliable click handler
            e.stopPropagation();
            e.preventDefault(); // Prevent any default behavior

            // Hide any tooltips first
            hoveredEventRef.current = null;
            setHoveredEventId(null);
            // Use direct handler for reliable modal opening
            handleSelectEvent(event);
          }}
          onMouseEnter={(e) => {
            // Immediately show this event's tooltip
            hoveredEventRef.current = event.id;
            setHoveredEventId(event.id);
            setMousePosition({ x: e.clientX, y: e.clientY });
          }}
          onMouseMove={(e) => {
            if (hoveredEventRef.current === event.id) {
              // Update mouse position without causing re-renders
              const newPosition = { x: e.clientX, y: e.clientY };
              setMousePosition(newPosition);
            }
          }}
          onMouseLeave={() => {
            // Only hide if we're leaving this specific event
            if (hoveredEventRef.current === event.id) {
              hoveredEventRef.current = null;
              setHoveredEventId(null);
            }
          }}
          style={{ position: 'relative', zIndex: 10 }} // Ensure it's clickable
          data-testid={`calendar-event-${event.id}`}>
          {/* Split background: top half operator, bottom half machine */}
          <div className="absolute inset-0 flex flex-col">
            <div
              className="flex-1 relative"
              style={operatorStyle}>
              {/* Operator initials in top left - show all operators */}
              {event.resource?.operators && event.resource.operators.length > 0 && (
                <div className="absolute top-0.5 left-0.5 text-[10px] font-bold text-white bg-black bg-opacity-40 px-1 rounded flex gap-0.5">
                  {event.resource.operators.map((op, idx) => (
                    <span key={idx}>
                      {op.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 3)}
                      {idx < event.resource!.operators!.length - 1 && ','}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div
              className="flex-1 relative"
              style={machineStyle}>
              {/* Machine names in bottom left - show all machines */}
              {event.resource?.machines && event.resource.machines.length > 0 && (
                <div className="absolute bottom-0.5 left-0.5 text-[10px] font-bold text-white bg-black bg-opacity-40 px-1 rounded truncate max-w-[90%]">
                  {event.resource.machines.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Content overlay */}
          <div className="relative z-10 p-1 h-full flex flex-col justify-center text-white">
            <div className="font-medium truncate text-xs leading-tight">{event.title}</div>
          </div>

          {/* Text shadow overlay for better readability */}
          <div className="absolute inset-0 bg-black opacity-20 rounded-lg"></div>
        </div>
      );
    },
    [handleSelectEvent], // Only include stable dependencies
  );

  // Render tooltip separately to avoid EventComponent re-renders
  const renderTooltip = () => {
    if (!hoveredEventId) return null;

    const event = events.find((e) => e.id === hoveredEventId);
    if (!event) return null;

    return (
      <div
        className="fixed pointer-events-none max-w-xs"
        style={{
          zIndex: 99999,
          left:
            Math.min(
              Math.max(mousePosition.x + 10, 10),
              (typeof window !== 'undefined' ? window.innerWidth : 800) - 300,
            ) + 'px',
          top:
            Math.min(
              Math.max(mousePosition.y - 80, 10),
              (typeof window !== 'undefined' ? window.innerHeight : 600) - 150,
            ) + 'px',
        }}>
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
          <div className="font-semibold mb-1">{event.title}</div>
          <div>Status: {event.resource?.status || 'UNKNOWN'}</div>
          <div>Duration: {getDurationText(event.resource?.duration || 0)}</div>
          {event.resource?.startDate && <div>Start: {event.resource.startDate}</div>}
          {event.resource?.endDate && <div>End: {event.resource.endDate}</div>}
          {event.resource?.operators && event.resource.operators.length > 0 && (
            <div>
              Operator{event.resource.operators.length > 1 ? 's' : ''}:{' '}
              {event.resource.operators.map((o) => o.name).join(', ')}
            </div>
          )}
          {event.resource?.machines && event.resource.machines.length > 0 && (
            <div>
              Machine{event.resource.machines.length > 1 ? 's' : ''}: {event.resource.machines.join(', ')}
              {event.resource?.machineTypes &&
                event.resource.machineTypes.length > 0 &&
                ` (${event.resource.machineTypes.join(', ')})`}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Memoize the components object to prevent unnecessary re-renders
  const calendarComponents = useMemo(
    () => ({
      event: EventComponent,
    }),
    [EventComponent],
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
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

          {/* Row Height Control */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Row Height:</label>
            <input
              type="range"
              min="40"
              max="120"
              step="10"
              value={rowHeight}
              onChange={(e) => setRowHeight(Number(e.target.value))}
              className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((rowHeight - 40) / 80) * 100}%, #e2e8f0 ${
                  ((rowHeight - 40) / 80) * 100
                }%, #e2e8f0 100%)`,
              }}
            />
            <span className="text-sm text-slate-600 min-w-[45px]">{rowHeight}px</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FilterSelect
            label="Project"
            value={selectedProject}
            onChange={setSelectedProject}
            options={sortByName(projects)}
            allLabel="All Projects"
          />
          <FilterSelect
            label="Item"
            value={selectedItem}
            onChange={setSelectedItem}
            options={sortByName(availableItems)}
            allLabel="All Items"
          />
          <FilterSelect
            label="Machine"
            value={selectedMachine}
            onChange={setSelectedMachine}
            options={sortByName(machines)}
            allLabel="All Machines"
          />
          <FilterSelect
            label="Operator"
            value={selectedOperator}
            onChange={setSelectedOperator}
            options={sortByName(operators)}
            allLabel="All Operators"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <style>{`
          .rbc-time-slot {
            min-height: ${rowHeight}px !important;
          }
          .rbc-timeslot-group {
            min-height: ${rowHeight * 2}px !important;
          }
        `}</style>
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'auto', minHeight: 600 }}
          view={currentView}
          onView={(view) => setCurrentView(view as 'week' | 'day' | 'agenda')}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          views={['week', 'day', 'agenda']}
          onEventDrop={handleEventDrop}
          resizable={false}
          draggableAccessor={() => true}
          onSelectEvent={(event) => {
            // Add a small delay to prevent interference with click events
            setTimeout(() => handleSelectEvent(event), 10);
          }}
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
          components={calendarComponents}
        />
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlotIndex(null); // Reset selected slot when closing
        }}
        task={selectedTask}
        selectedSlotIndex={selectedSlotIndex}
        onSave={handleSaveAssignment}
        items={items}
        machines={machines}
        operators={operators}
      />

      {/* Render tooltip outside the calendar to avoid z-index issues */}
      {renderTooltip()}
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
