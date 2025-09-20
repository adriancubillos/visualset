'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import StatisticsCards from '@/components/ui/StatisticsCards';

interface DashboardStats {
  activeProjects: number;
  runningTasks: number;
  availableMachines: number;
  activeOperators: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
}

interface Machine {
  id: string;
  name: string;
  status: string;
}

interface Operator {
  id: string;
  name: string;
  status: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    runningTasks: 0,
    availableMachines: 0,
    activeOperators: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [projectsRes, tasksRes, machinesRes, operatorsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/tasks'),
          fetch('/api/machines'),
          fetch('/api/operators'),
        ]);

        const [projects, tasks, machines, operators] = await Promise.all([
          projectsRes.json(),
          tasksRes.json(),
          machinesRes.json(),
          operatorsRes.json(),
        ]);

        setStats({
          activeProjects: projects.filter((p: Project) => p.status === 'ACTIVE').length,
          runningTasks: tasks.filter((t: Task) => t.status === 'IN_PROGRESS').length,
          availableMachines: machines.filter((m: Machine) => m.status === 'AVAILABLE').length,
          activeOperators: operators.filter((o: Operator) => o.status === 'ACTIVE').length,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const statsDisplay = [
    { 
      label: 'Active Projects', 
      value: stats.activeProjects, 
      change: '', 
      changeType: 'neutral' as const,
      color: 'blue' as const 
    },
    { 
      label: 'Running Tasks', 
      value: stats.runningTasks, 
      change: '', 
      changeType: 'neutral' as const,
      color: 'green' as const 
    },
    { 
      label: 'Available Machines', 
      value: stats.availableMachines, 
      change: '', 
      changeType: 'neutral' as const,
      color: 'purple' as const 
    },
    { 
      label: 'Active Operators', 
      value: stats.activeOperators, 
      change: '', 
      changeType: 'neutral' as const,
      color: 'orange' as const 
    },
  ];

  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        const [tasksRes, projectsRes] = await Promise.all([fetch('/api/tasks'), fetch('/api/projects')]);

        if (tasksRes.ok) {
          const tasks = await tasksRes.json();
          setRecentTasks(tasks.slice(0, 3)); // Get 3 most recent tasks
        }

        if (projectsRes.ok) {
          const projects = await projectsRes.json();
          setRecentProjects(projects.slice(0, 2)); // Get 2 most recent projects
        }
      } catch (error) {
        console.error('Error fetching recent data:', error);
      }
    };

    fetchRecentData();
  }, []);

  const recentActivity = [
    ...recentTasks.map((task: Task) => ({
      id: task.id,
      type: 'task' as const,
      message: `Task "${task.title}" - ${task.status}`,
      time: new Date(task.updatedAt).toLocaleDateString(),
    })),
    ...recentProjects.map((project: Project) => ({
      id: project.id,
      type: 'project' as const,
      message: `Project "${project.name}" - ${project.status}`,
      time: new Date(project.updatedAt).toLocaleDateString(),
    })),
  ];

  const quickActions = [
    { label: 'Create New Project', href: '/projects/new', icon: '📁', color: 'bg-blue-500' },
    { label: 'Schedule Task', href: '/tasks/new', icon: '✅', color: 'bg-green-500' },
    { label: 'Add Machine', href: '/machines/new', icon: '⚙️', color: 'bg-purple-500' },
    { label: 'Add Operator', href: '/operators/new', icon: '👥', color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your workshop operations</p>
      </div>

      {/* Stats Grid */}
      <StatisticsCards 
        stats={statsDisplay}
        loading={loading}
        showWhenEmpty={true}
        columns={4}
        showSkeletonCount={4}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div
                    className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white mr-3`}>
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3">
                  <StatusBadge
                    status={activity.type}
                    variant={activity.type === 'task' ? 'success' : activity.type === 'project' ? 'info' : 'default'}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/schedule"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-4">📅</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
              <p className="text-gray-600">View Gantt chart and calendar</p>
            </div>
          </div>
        </Link>

        <Link
          href="/projects"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-4">📁</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
              <p className="text-gray-600">Manage project portfolio</p>
            </div>
          </div>
        </Link>

        <Link
          href="/machines"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-4">⚙️</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Machines</h3>
              <p className="text-gray-600">Monitor machine status</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
