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
import { getProjectColor, getOperatorColor, getMachineColor, getPatternStyles, type PatternType } from '@/utils/colors';
import { handleTaskAssignmentUpdate, TaskAssignmentUpdate } from '@/utils/taskAssignment';
import FilterSelect from './ui/FilterSelect';
import { sortByName } from '@/utils/sorting';
import { logger } from '@/utils/logger';
import toast from 'react-hot-toast';
import { displayConflictError } from '@/utils/taskErrorHandling';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  quantity?: number;
  completed_quantity?: number;
  project: { id: string; name: string; color?: string | null } | null;
  item: { id: string; name: string } | null;
  machine: { id: string; name: string; type?: string; location?: string } | null;
  operator: { id: string; name: string; email?: string | null; shift?: string | null } | null;
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
    // Multi-slot support
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
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState<boolean>(false);

  // New filter state
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<string>('all');

  const [machines, setMachines] = useState<{ id: string; name: string }[]>([]);
  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; color?: string | null }[]>([]);
  const [items, setItems] = useState<{ id: string; name: string; project?: { name: string } }[]>([]);

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

  // Cleanup touch timer on unmount
  useEffect(() => {
    return () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
      }
    };
  }, [touchTimer]);

  // // ✅ Unique machines/operators for dropdown
  // const machines = Array.from(new Map(tasks.filter((t) => t.machine).map((t) => [t.machine!.id, t.machine!])).values());
  // const operators = Array.from(
  //   new Map(tasks.filter((t) => t.operator).map((t) => [t.operator!.id, t.operator!])).values(),
  // );

  // ✅ Apply filters - memoized to prevent unnecessary recalculations
  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const machineMatch = selectedMachine === 'all' || task.machine?.id === selectedMachine;
      const operatorMatch = selectedOperator === 'all' || task.operator?.id === selectedOperator;
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

          // Get operator colors/patterns
          const operatorColor = task.operator ? getOperatorColor(task.operator) : null;
          const machineColor = task.machine ? getMachineColor(task.machine) : null;

          return {
            id: `${task.id}-${slotIndex}`, // Unique ID for each time slot
            title: task.title + (task.timeSlots && task.timeSlots.length > 1 ? ` (Slot ${slotIndex + 1})` : ''), // Add slot number if multiple slots
            start,
            end,
            allDay: false,
            resource: {
              color: getEventColor(task),
              machine: task.machine?.name,
              project: task.project?.name,
              duration: slot.durationMin,
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
        // Use the task update endpoint to preserve all time slots
        const res = await fetch(`/api/tasks/${updatedTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updatedTask.title,
            description: updatedTask.description,
            status: updatedTask.status,
            quantity: updatedTask.quantity || 1,
            completed_quantity: updatedTask.completed_quantity || 0,
            itemId: updatedTask.item?.id || null,
            machineId: updatedTask.machine?.id || null,
            operatorId: updatedTask.operator?.id || null,
            timeSlots: updatedTimeSlots.map((slot) => ({
              startDateTime: slot.startDateTime,
              endDateTime: slot.endDateTime,
              durationMin: slot.durationMin,
            })),
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setTasks((prev) => prev.map((task) => (task.id === data.id ? { ...task, ...data } : task)));
          toast.success('Task rescheduled successfully');
        } else {
          // Use the conflict error handler for detailed error messages
          if (data.conflict) {
            displayConflictError(data);
          } else {
            logger.error('Error updating task during drag operation', data.error);
            toast.error(data.error || 'Failed to reschedule task');
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
          resizable={false}
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
                  }}
                  onTouchStart={(e) => {
                    // For mobile: only show tooltip on actual long press
                    const touch = e.touches[0];
                    setMousePosition({ x: touch.clientX, y: touch.clientY });
                    setIsLongPress(false); // Reset long press flag

                    const timer = setTimeout(() => {
                      // This confirms it's a long press
                      setIsLongPress(true);
                      setHoveredEventId(event.id);
                      // Hide tooltip after 4 seconds
                      setTimeout(() => {
                        setHoveredEventId(null);
                        setIsLongPress(false);
                      }, 4000);
                    }, 500); // Long press threshold

                    setTouchTimer(timer);
                  }}
                  onTouchMove={() => {
                    // Cancel tooltip if user moves finger (scrolling/swiping)
                    if (touchTimer) {
                      clearTimeout(touchTimer);
                      setTouchTimer(null);
                      setIsLongPress(false);
                    }
                  }}
                  onTouchEnd={() => {
                    // Only cancel if it wasn't a long press yet
                    if (touchTimer && !isLongPress) {
                      clearTimeout(touchTimer);
                      setTouchTimer(null);
                      setIsLongPress(false);
                    }
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
                    <div className="text-xs opacity-90 truncate leading-tight">
                      {event.start.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}{' '}
                      -{' '}
                      {event.end.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </div>
                  </div>

                  {/* Text shadow overlay for better readability */}
                  <div className="absolute inset-0 bg-black opacity-20 rounded-lg"></div>

                  {/* Tooltip on hover - using state-based visibility */}
                  {hoveredEventId === event.id && (
                    <div
                      className="
                      fixed z-[9999]
                      bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg
                      pointer-events-none max-w-xs
                    "
                      style={{
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
                      <div className="font-semibold mb-1">{event.title}</div>
                      <div>Status: {event.resource?.status || 'UNKNOWN'}</div>
                      <div>Duration: {getDurationText(event.resource?.duration || 0)}</div>
                      {event.resource?.startDate && <div>Start: {event.resource.startDate}</div>}
                      {event.resource?.endDate && <div>End: {event.resource.endDate}</div>}
                      {(() => {
                        const originalTaskId = event.resource?.originalTaskId || event.id.split('-')[0];
                        const taskForTooltip = tasks.find((t) => t.id === originalTaskId);
                        return taskForTooltip?.operator && <div>Operator: {taskForTooltip.operator.name}</div>;
                      })()}
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
