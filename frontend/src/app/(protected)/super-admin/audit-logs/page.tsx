'use client';

import { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import Pagination from '@/components/layout/Pagination';
import "react-datepicker/dist/react-datepicker.css";

interface AuditLog {
  id: string;
  action: string;
  entityType: 'user' | 'school' | 'website' | 'permission' | 'system';
  entityId: string;
  entityName: string;
  performedBy: string;
  timestamp: string;
  details: string;
  ipAddress: string;
}

interface Filters {
  entityType: string[];
  action: string[];
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
}

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const itemsPerPage = 20;

  const [filters, setFilters] = useState<Filters>({
    entityType: [],
    action: [],
    dateRange: {
      startDate: null,
      endDate: null
    }
  });

  // Mock data
  const mockLogs: AuditLog[] = Array.from({ length: 50 }, (_, index) => ({
    id: `log-${index + 1}`,
    action: ['created', 'updated', 'deleted', 'published', 'logged in'][Math.floor(Math.random() * 5)],
    entityType: ['user', 'school', 'website', 'permission', 'system'][Math.floor(Math.random() * 5)] as AuditLog['entityType'],
    entityId: `entity-${index + 1}`,
    entityName: `Example Entity ${index + 1}`,
    performedBy: `user.${index + 1}@example.com`,
    timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    details: 'Additional details about the action',
    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
  }));

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-green-700 bg-green-50 ring-green-600/20';
      case 'updated': return 'text-blue-700 bg-blue-50 ring-blue-600/20';
      case 'deleted': return 'text-red-700 bg-red-50 ring-red-600/20';
      case 'published': return 'text-purple-700 bg-purple-50 ring-purple-600/20';
      default: return 'text-gray-700 bg-gray-50 ring-gray-600/20';
    }
  };

  const getEntityTypeIcon = (type: AuditLog['entityType']) => {
    switch (type) {
      case 'user': return '👤';
      case 'school': return '🏫';
      case 'website': return '🌐';
      case 'permission': return '🔒';
      case 'system': return '⚙️';
      default: return '📄';
    }
  };

  const filteredLogs = mockLogs.filter(log => {
    const searchFields = [
      log.action,
      log.entityType,
      log.entityName,
      log.performedBy,
      log.details
    ].map(field => field.toLowerCase());

    const matchesSearch = searchQuery === '' || 
      searchFields.some(field => field.includes(searchQuery.toLowerCase()));

    const matchesEntityType = filters.entityType.length === 0 || 
      filters.entityType.includes(log.entityType);

    const matchesAction = filters.action.length === 0 || 
      filters.action.includes(log.action);

    const logDate = new Date(log.timestamp);
    const matchesDateRange = 
      (!filters.dateRange.startDate || logDate >= filters.dateRange.startDate) &&
      (!filters.dateRange.endDate || logDate <= filters.dateRange.endDate);

    return matchesSearch && matchesEntityType && matchesAction && matchesDateRange;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Audit Logs
        </h1>
      </div>

      {/* Search and Filter Bar */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <FunnelIcon className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
          Filters
        </button>
      </div>

      {/* Logs Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Action
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Entity
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Performed By
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Timestamp
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <span>{getEntityTypeIcon(log.entityType)}</span>
                          <span className="font-medium text-gray-900">{log.entityName}</span>
                        </div>
                        <div className="text-xs text-gray-500">{log.entityType}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.performedBy}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-20"
            onClick={() => setIsFilterModalOpen(false)}
          />
          <div className="fixed inset-0 z-30 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsFilterModalOpen(false)}
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">Filter Logs</h3>
                    <div className="mt-4 space-y-4">
                      {/* Add filter options here */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
