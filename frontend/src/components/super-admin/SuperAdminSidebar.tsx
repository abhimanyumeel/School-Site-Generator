'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  UsersIcon, 
  GlobeAltIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/super-admin/dashboard',
    icon: HomeIcon 
  },
  { 
    name: 'Schools Management', 
    href: '/super-admin/schools',
    icon: UsersIcon 
  },
  { 
    name: 'Websites Overview', 
    href: '/super-admin/websites',
    icon: GlobeAltIcon 
  },
  { 
    name: 'Analytics', 
    href: '/super-admin/analytics',
    icon: ChartBarIcon 
  },
  { 
    name: 'Audit Logs', 
    href: '/super-admin/audit-logs',
    icon: ClipboardDocumentListIcon 
  },
  { 
    name: 'Settings', 
    href: '/super-admin/settings',
    icon: Cog6ToothIcon 
  },
];

export default function SuperAdminSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <>
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-semibold text-gray-900">Super Admin</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                            ${isActive 
                              ? 'bg-gray-50 text-blue-600' 
                              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }
                          `}
                        >
                          <item.icon
                            className={`h-6 w-6 shrink-0 ${
                              isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                            }`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="flex flex-col gap-y-4">
                  <div className="text-xs font-semibold leading-6 text-gray-400">
                    System Status
                  </div>
                  <div className="flex items-center gap-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-400"></div>
                    <span className="text-sm text-gray-500">All systems normal</span>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        {/* Add mobile sidebar implementation here if needed */}
      </div>
    </>
  );
}