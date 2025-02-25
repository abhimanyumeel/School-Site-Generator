'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  BellIcon, 
  Bars3Icon,
} from '@heroicons/react/24/outline';

export default function SuperAdminHeader() {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Sidebar toggle button for mobile */}
      <button type="button" className="lg:hidden -m-2.5 p-2.5 text-gray-700">
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Page heading - can be dynamic based on current route */}
        <div className="flex items-center">
          <h1 className="text-lg font-semibold leading-7 text-gray-900">
            Super Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
          {/* Notifications dropdown */}
          <div className="relative">
            <button
              type="button"
              className="-m-1.5 p-1.5 text-gray-400 hover:text-gray-500"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-[10px] font-medium text-white flex items-center justify-center">
                3
              </span>
            </button>

            {/* Notifications dropdown panel */}
            {showNotifications && (
              <div className="absolute right-0 z-10 mt-2.5 w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h2 className="text-sm font-semibold">Notifications</h2>
                </div>
                <div className="px-4 py-2">
                  <div className="text-sm text-gray-500">No new notifications</div>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-x-4 text-sm font-medium leading-6 text-gray-900"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <span className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-white uppercase">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </button>

            {/* Profile dropdown panel */}
            {showProfileMenu && (
              <div className="absolute right-0 z-10 mt-2.5 w-64 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-500">Last login</p>
                  <p className="text-sm text-gray-700">
                    {new Date(user?.lastLoginAt || '').toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2 py-1">
                  <button
                    onClick={() => logout()}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}