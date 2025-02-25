'use client';

import { 
  UsersIcon, 
  GlobeAltIcon, 
  UserGroupIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';

const stats = [
  {
    name: 'Total Schools',
    value: '0',
    icon: UsersIcon,
    description: 'Registered educational institutions'
  },
  {
    name: 'Total Websites',
    value: '0',
    icon: GlobeAltIcon,
    description: 'Active school websites'
  },
  {
    name: 'Active Users',
    value: '0',
    icon: UserGroupIcon,
    description: 'Currently active users'
  }
];

export default function SuperAdminDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
        Dashboard Overview
      </h2>
      
      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                    <dd className="text-xs text-gray-500 mt-1">
                      {stat.description}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Recent Activity
          </h3>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
            View all
          </button>
        </div>
        <div className="mt-4 bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <ClipboardIcon className="h-full w-full" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
              <p className="mt-1 text-sm text-gray-500">
                New activities will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
