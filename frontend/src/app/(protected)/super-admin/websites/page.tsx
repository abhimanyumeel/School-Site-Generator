'use client';

import { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import Pagination from '@/components/layout/Pagination';

interface Website {
  id: number;
  name: string;
  domain: string;
  status: 'published' | 'draft' | 'archived';
  lastUpdated: string;
  traffic: number;
  school: string;
  schoolType: 'SINGLE_SCHOOL' | 'SCHOOL_ORGANIZATION';
}

interface Filters {
  status: string[];
  traffic: string[];
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
}

const highlightText = (text: string, search: string) => {
  if (!search) return text;
  
  const parts = text.split(new RegExp(`(${search})`, 'gi'));
  return parts.map((part, index) => 
    part.toLowerCase() === search.toLowerCase() 
      ? <span key={index} className="bg-yellow-200">{part}</span>
      : part
  );
};

export default function WebsitesOverview() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    status: [],
    traffic: [],
    dateRange: {
      startDate: null,
      endDate: null
    }
  });

  const filterOptions = {
    status: ['published', 'draft', 'archived'],
    traffic: ['high', 'medium', 'low'] // Example traffic ranges
  };

  const handleFilterChange = (category: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: Array.isArray(prev[category])
        ? prev[category].includes(value)
          ? (prev[category] as string[]).filter(item => item !== value)
          : [...(prev[category] as string[]), value]
        : prev[category]
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      traffic: [],
      dateRange: {
        startDate: null,
        endDate: null
      }
    });
  };

  // Temporary mock data
  const allWebsites: Website[] = Array.from({ length: 25 }, (_, index) => ({
    id: index + 1,
    name: `School Website ${index + 1}`,
    domain: `school${index + 1}.edu`,
    status: index % 3 === 0 ? 'published' : index % 3 === 1 ? 'draft' : 'archived',
    lastUpdated: new Date(2024, 0, index + 1).toISOString(),
    traffic: Math.floor(Math.random() * 10000),
    school: `Springfield Elementary ${index + 1}`,
    schoolType: index % 2 === 0 ? 'SINGLE_SCHOOL' : 'SCHOOL_ORGANIZATION'
  }));

  // Filter websites based on search
  const filteredWebsites = allWebsites.filter(website => {
    const searchFields = [website.name, website.domain, website.status, website.school, website.id.toString()]
      .map(field => field.toLowerCase());
    
    const matchesSearch = searchQuery === '' || 
      searchFields.some(field => field.includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filters.status.length === 0 || filters.status.includes(website.status);
    
    // Example traffic filtering logic
    const matchesTraffic = filters.traffic.length === 0 || filters.traffic.some(level => {
      if (level === 'high') return website.traffic > 7500;
      if (level === 'medium') return website.traffic > 2500 && website.traffic <= 7500;
      return website.traffic <= 2500;
    });
    
    const websiteDate = new Date(website.lastUpdated);
    const matchesDateRange = 
      (!filters.dateRange.startDate || websiteDate >= filters.dateRange.startDate) &&
      (!filters.dateRange.endDate || websiteDate <= filters.dateRange.endDate);
    
    return matchesSearch && matchesStatus && matchesTraffic && matchesDateRange;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredWebsites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWebsites = filteredWebsites.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Websites Overview
        </h1>
      </div>

      {/* Search and Filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search websites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
          <MagnifyingGlassIcon 
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
            aria-hidden="true" 
          />
        </div>
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <FunnelIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Filters
          {Object.values(filters).reduce((count, filterArray) => 
            count + (Array.isArray(filterArray) ? filterArray.length : 0), 0) > 0 && (
              <span className="ml-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {Object.values(filters).reduce((count, filterArray) => 
                  count + (Array.isArray(filterArray) ? filterArray.length : 0), 0)}
              </span>
          )}
        </button>
      </div>

      {/* Websites Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-300 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-4 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Website
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      School
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Traffic
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Last Updated
                    </th>
                    <th scope="col" className="relative py-4 pl-3 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedWebsites.map((website) => (
                    <tr 
                      key={website.id}
                      className="transition duration-150 ease-in-out hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {website.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {highlightText(website.name, searchQuery)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {highlightText(website.domain, searchQuery)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="font-medium text-gray-900">
                              {highlightText(website.school, searchQuery)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {highlightText(website.schoolType.replace('_', ' ').toLowerCase(), searchQuery)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          website.status === 'published'
                            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                            : website.status === 'draft'
                            ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                            : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                        }`}>
                          <span className={`mr-1 h-1.5 w-1.5 rounded-full ${
                            website.status === 'published' ? 'bg-green-600' : 
                            website.status === 'draft' ? 'bg-yellow-600' : 'bg-red-600'
                          }`} />
                          {highlightText(website.status, searchQuery)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="text-sm text-gray-900">
                          {website.traffic.toLocaleString()} visits
                        </div>
                        <div className="text-xs text-gray-500">
                          {website.traffic > 7500 ? 'High' : 
                           website.traffic > 2500 ? 'Medium' : 'Low'} traffic
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(website.lastUpdated).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          View<span className="sr-only">, {website.name}</span>
                        </button>
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

      {/* Filter Modal Content */}
      {isFilterModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-20"
            onClick={() => setIsFilterModalOpen(false)}
          />
          
          {/* Modal */}
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
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">Filter Websites</h3>
                    <div className="mt-4 space-y-4">
                      {/* Status Filter */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Status</h4>
                        <div className="mt-2 space-y-2">
                          {filterOptions.status.map(status => (
                            <label key={status} className="inline-flex items-center mr-4">
                              <input
                                type="checkbox"
                                checked={filters.status.includes(status)}
                                onChange={() => handleFilterChange('status', status)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              />
                              <span className="ml-2 text-sm text-gray-600">{status}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Traffic Filter */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Traffic Level</h4>
                        <div className="mt-2 space-y-2">
                          {filterOptions.traffic.map(level => (
                            <label key={level} className="inline-flex items-center mr-4">
                              <input
                                type="checkbox"
                                checked={filters.traffic.includes(level)}
                                onChange={() => handleFilterChange('traffic', level)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              />
                              <span className="ml-2 text-sm text-gray-600">
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          clearFilters();
                          setIsFilterModalOpen(false);
                        }}
                        className="text-sm font-semibold text-gray-900 hover:text-gray-700"
                      >
                        Clear all
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFilterModalOpen(false)}
                        className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        Apply
                      </button>
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