'use client';

import { useState, useEffect } from 'react';
import TaskModal from './task/TaskModal';
import { formatDateTimeGMTMinus5, convertTaskTimeForGantt } from '@/utils/timezone';
import { addDays, format } from 'date-fns';
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

interface Machine {
  id: string;
  name: string;
}

interface GanttTaskProps {
  task: Task;
  dayStart: Date;
  pixelsPerMinute: number;
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, newStart: Date, machineId: string) => void;
}

function GanttTask({ task, dayStart, pixelsPerMinute, onTaskClick, onTaskDrop }: GanttTaskProps) {
  // Use GanttChart-specific utility for UTC-based positioning
  const taskStart = convertTaskTimeForGantt(task.scheduledAt);
  
  // Calculate position and width
  const minutesFromDayStart = (taskStart.getTime() - dayStart.getTime()) / (1000 * 60);
  const left = Math.max(0, minutesFromDayStart * pixelsPerMinute);
  const width = task.durationMin * pixelsPerMinute;
  
  // Only show if task is within the day
  if (taskStart < dayStart || taskStart >= addDays(dayStart, 1)) {
    return null;
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      taskId: task.id,
      originalMachineId: task.machine?.id || null
    }));
  };

  // Color coding based on project or status
  const getTaskColor = () => {
    if (!task.project) return 'bg-gray-500 border-gray-600 hover:bg-gray-600';
    
    const colors = [
      'bg-blue-500 border-blue-600 hover:bg-blue-600',
      'bg-green-500 border-green-600 hover:bg-green-600',
      'bg-purple-500 border-purple-600 hover:bg-purple-600',
      'bg-orange-500 border-orange-600 hover:bg-orange-600',
      'bg-pink-500 border-pink-600 hover:bg-pink-600',
      'bg-indigo-500 border-indigo-600 hover:bg-indigo-600',
    ];
    
    const hash = task.project.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={`absolute text-white text-xs rounded-lg cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 border-l-4 ${getTaskColor()}`}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 100)}px`,
        height: '32px',
        zIndex: 10,
        top: '6px'
      }}
      draggable
      onDragStart={handleDragStart}
      onClick={() => onTaskClick(task)}
      title={`${task.title} - ${task.project?.name || 'No project'} (${task.durationMin}min)`}
    >
      <div className="px-3 py-1.5 h-full flex items-center">
        <div className="truncate font-medium">
          {task.title}
        </div>
        <div className="ml-auto text-xs opacity-75 whitespace-nowrap">
          {task.durationMin}m
        </div>
      </div>
    </div>
  );
}


export default function GanttChart() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scrollLeft, setScrollLeft] = useState(0);

  // Gantt settings
  const pixelsPerMinute = 2; // 2 pixels per minute
  // Create dayStart at midnight UTC for consistent positioning
  const dayStart = new Date(currentDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  
  // Working hours: 7 AM to 7 PM
  const workingStartHour = 7;
  const workingEndHour = 19;

  useEffect(() => {
    // Fetch data
    Promise.all([
      fetch('/api/tasks').then(res => res.json()),
      fetch('/api/machines').then(res => res.json()),
      fetch('/api/operators').then(res => res.json()),
      fetch('/api/projects').then(res => res.json())
    ]).then(([tasksData, machinesData, operatorsData, projectsData]) => {
      setTasks(tasksData);
      setMachines(machinesData);
      setOperators(operatorsData);
      setProjects(projectsData);
    }).catch(console.error);
  }, []);

  // Auto-scroll to working hours on mount
  useEffect(() => {
    const workingStartPixels = workingStartHour * 60 * pixelsPerMinute;
    setScrollLeft(workingStartPixels);
  }, [workingStartHour, pixelsPerMinute]);

  const handleTaskDrop = async (taskId: string, newStart: Date, machineId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: taskId,
          scheduledAt: newStart.toISOString(),
          durationMin: task.durationMin,
          machineId: machineId,
          operatorId: task.operator?.id || null,
          projectId: task.project?.id || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        alert(data.error || 'Failed to reschedule task');
      }
    } catch (err) {
      console.error(err);
      alert('Error rescheduling task');
    }
  };

  const handleSaveAssignment = async (update: TaskAssignmentUpdate) => {
    await handleTaskAssignmentUpdate(
      selectedTask,
      update,
      (updatedTask) => setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t)),
      () => setIsModalOpen(false)
    );
  };

  // Generate hour labels
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(dayStart);
    hour.setHours(i);
    return format(hour, 'HH:mm');
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Production Schedule</h2>
          <p className="text-slate-600">Machine lanes and task assignments</p>
        </div>
        
        {/* Date navigation */}
        <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 p-1">
          <button
            onClick={() => setCurrentDate(prev => addDays(prev, -1))}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <div className="px-6 py-2 bg-blue-50 text-blue-700 rounded-md font-semibold border border-blue-200">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </div>
          <button
            onClick={() => setCurrentDate(prev => addDays(prev, 1))}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors font-medium flex items-center gap-2"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-lg">
        {/* Header with time labels */}
        <div className="flex border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="w-48 p-4 border-r border-slate-200 font-bold text-slate-700 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Machines
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <div 
              className="flex" 
              style={{ 
                transform: `translateX(-${scrollLeft}px)`,
                width: `${24 * 60 * pixelsPerMinute}px`
              }}
            >
              {hours.map((hour, i) => {
                const isWorkingHour = i >= workingStartHour && i < workingEndHour;
                return (
                  <div
                    key={i}
                    className={`text-xs p-2 border-l border-slate-200 font-medium transition-colors ${
                      isWorkingHour 
                        ? 'text-blue-700 bg-blue-100/50 font-semibold' 
                        : 'text-slate-500 bg-slate-50'
                    }`}
                    style={{ width: `${60 * pixelsPerMinute}px` }}
                  >
                    <div className="text-center">{hour}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Machine lanes */}
        <div className="flex max-h-96 overflow-hidden">
          {/* Fixed machine names column */}
          <div className="w-48 bg-white border-r border-slate-200 overflow-y-auto">
            {machines.map(machine => {
              const isUnassigned = machine.id === 'unassigned';
              return (
                <div 
                  key={machine.id}
                  className={`p-4 border-b border-gray-100 flex items-center h-14 ${
                    isUnassigned 
                      ? 'bg-red-100 text-red-800 font-semibold' 
                      : 'bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!isUnassigned && (
                      <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
                    )}
                    {isUnassigned && (
                      <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
                    )}
                    <span>{machine.name}</span>
                  </div>
                </div>
              );
            })}
            
            {/* Unassigned tasks lane header */}
            <div className="p-4 border-b border-gray-100 flex items-center h-14 bg-red-100 text-red-800 font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
                <span>Unassigned Tasks</span>
              </div>
            </div>
          </div>
          
          {/* Scrollable timeline area */}
          <div 
            className="flex-1 overflow-auto"
            onScroll={handleScroll}
            ref={(el) => {
              if (el && el.scrollLeft !== scrollLeft) {
                el.scrollLeft = scrollLeft;
              }
            }}
          >
            <div style={{ width: `${24 * 60 * pixelsPerMinute}px` }}>
              {machines.map(machine => {
                const machineTasks = tasks.filter(task => task.machine?.id === machine.id);
                const isUnassigned = machine.id === 'unassigned';
                
                return (
                  <div 
                    key={machine.id}
                    className={`border-b border-gray-100 h-14 relative transition-colors duration-200 ${
                      isUnassigned ? 'bg-red-50 hover:bg-red-100' : 'bg-white hover:bg-slate-50'
                    }`}
                    onDrop={(e) => {
                      e.preventDefault();
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const minutesFromStart = x / pixelsPerMinute;
                      const newStart = new Date(dayStart.getTime() + minutesFromStart * 60 * 1000);
                      handleTaskDrop(data.taskId, newStart, machine.id);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {/* Hour grid lines */}
                    {Array.from({ length: 24 }, (_, i) => {
                      const isWorkingHour = i >= 7 && i < 19;
                      return (
                        <div
                          key={i}
                          className={`absolute top-0 bottom-0 ${
                            isWorkingHour ? 'border-l border-slate-200' : 'border-l border-gray-100'
                          }`}
                          style={{ left: `${i * 60 * pixelsPerMinute}px` }}
                        />
                      );
                    })}
                    
                    {/* Working hours background */}
                    <div 
                      className="absolute top-0 bottom-0 bg-blue-50/30"
                      style={{
                        left: `${7 * 60 * pixelsPerMinute}px`,
                        width: `${12 * 60 * pixelsPerMinute}px`
                      }}
                    />
                    
                    {/* Tasks */}
                    {machineTasks.map(task => (
                      <GanttTask
                        key={task.id}
                        task={task}
                        dayStart={dayStart}
                        pixelsPerMinute={pixelsPerMinute}
                        onTaskClick={(task) => {
                          setSelectedTask(task);
                          setIsModalOpen(true);
                        }}
                        onTaskDrop={handleTaskDrop}
                      />
                    ))}
                  </div>
                );
              })}
              
              {/* Unassigned tasks lane */}
              <div 
                className="border-b border-gray-100 h-14 relative bg-red-50 hover:bg-red-100 transition-colors duration-200"
                onDrop={(e) => {
                  e.preventDefault();
                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const minutesFromStart = x / pixelsPerMinute;
                  const newStart = new Date(dayStart.getTime() + minutesFromStart * 60 * 1000);
                  handleTaskDrop(data.taskId, newStart, 'unassigned');
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Hour grid lines */}
                {Array.from({ length: 24 }, (_, i) => {
                  const isWorkingHour = i >= 7 && i < 19;
                  return (
                    <div
                      key={i}
                      className={`absolute top-0 bottom-0 ${
                        isWorkingHour ? 'border-l border-slate-200' : 'border-l border-gray-100'
                      }`}
                      style={{ left: `${i * 60 * pixelsPerMinute}px` }}
                    />
                  );
                })}
                
                {/* Working hours background */}
                <div 
                  className="absolute top-0 bottom-0 bg-blue-50/30"
                  style={{
                    left: `${7 * 60 * pixelsPerMinute}px`,
                    width: `${12 * 60 * pixelsPerMinute}px`
                  }}
                />
                
                {/* Unassigned tasks */}
                {tasks.filter(task => !task.machine).map(task => (
                  <GanttTask
                    key={task.id}
                    task={task}
                    dayStart={dayStart}
                    pixelsPerMinute={pixelsPerMinute}
                    onTaskClick={(task) => {
                      setSelectedTask(task);
                      setIsModalOpen(true);
                    }}
                    onTaskDrop={handleTaskDrop}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
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
