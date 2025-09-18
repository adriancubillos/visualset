import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';

export default function Dashboard() {
  // Mock data for dashboard
  const stats = [
    { label: 'Active Projects', value: '12', change: '+2', changeType: 'increase' },
    { label: 'Running Tasks', value: '8', change: '-1', changeType: 'decrease' },
    { label: 'Available Machines', value: '15', change: '0', changeType: 'neutral' },
    { label: 'Active Operators', value: '6', change: '+1', changeType: 'increase' },
  ];

  const recentActivity = [
    { id: '1', type: 'task', message: 'Task "CNC Milling Part A" completed', time: '2 minutes ago' },
    { id: '2', type: 'machine', message: 'Machine "CNC-001" went offline', time: '15 minutes ago' },
    { id: '3', type: 'project', message: 'New project "Engine Block Series" created', time: '1 hour ago' },
    { id: '4', type: 'operator', message: 'Operator John Smith started shift', time: '2 hours ago' },
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`text-sm ${
                stat.changeType === 'increase' ? 'text-green-600' : 
                stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

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
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white mr-3`}>
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
                <div key={activity.id} className="flex items-start space-x-3">
                  <StatusBadge 
                    status={activity.type} 
                    variant={
                      activity.type === 'task' ? 'success' :
                      activity.type === 'machine' ? 'error' :
                      activity.type === 'project' ? 'info' : 'default'
                    }
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
        <Link href="/schedule" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-4">📅</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
              <p className="text-gray-600">View Gantt chart and calendar</p>
            </div>
          </div>
        </Link>

        <Link href="/projects" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-4">📁</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
              <p className="text-gray-600">Manage project portfolio</p>
            </div>
          </div>
        </Link>

        <Link href="/machines" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
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
