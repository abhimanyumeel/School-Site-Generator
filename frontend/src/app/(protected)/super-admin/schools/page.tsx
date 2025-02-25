'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  XMarkIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import Pagination from '@/components/layout/Pagination';
import dynamic from 'next/dynamic';
import "react-datepicker/dist/react-datepicker.css";

interface Filters {
  type: string[];
  status: string[];
  websiteStatus: string[];
  dateRange: {
    startDate?: Date;
    endDate?: Date;
  };
}

interface School {
  id: number;
  name: string;
  type: 'SINGLE_SCHOOL' | 'SCHOOL_ORGANIZATION';
  status: 'active' | 'inactive';
  websiteStatus: 'published' | 'draft';
  createdAt: string;
  websiteCount: number;
  permissions: {
    canCreateWebsite: boolean;
    customPermissions: string[];
    websiteLimit: number;
  };
}

const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const highlightText = (text: string, search: string) => {
  if (!search) return text;
  
  const parts = text.split(new RegExp(`(${search})`, 'gi'));
  return parts.map((part, index) => 
    part.toLowerCase() === search.toLowerCase() 
      ? <span key={index} className="bg-yellow-200">{part}</span>
      : part
  );
};

const getSchoolType = (index: number): 'SINGLE_SCHOOL' | 'SCHOOL_ORGANIZATION' => 
  index % 2 === 0 ? 'SINGLE_SCHOOL' : 'SCHOOL_ORGANIZATION';

const getStatus = (index: number): 'active' | 'inactive' => 
  index % 3 === 0 ? 'inactive' : 'active';

const getWebsiteStatus = (index: number): 'published' | 'draft' => 
  index % 4 === 0 ? 'draft' : 'published';

export default function SchoolsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const itemsPerPage = 10;
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    type: [],
    status: [],
    websiteStatus: [],
    dateRange: {}
  });
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const filterOptions = {
    type: ['SINGLE_SCHOOL', 'SCHOOL_ORGANIZATION'],
    status: ['active', 'inactive'],
    websiteStatus: ['published', 'draft']
  };

  // Temporary mock data with more items to show pagination
  const allSchools: School[] = Array.from({ length: 25 }, (_, index) => ({
    id: index + 1,
    name: `Springfield Elementary ${index + 1}`,
    type: getSchoolType(index),
    status: getStatus(index),
    websiteStatus: getWebsiteStatus(index),
    createdAt: new Date(2024, 0, index + 1).toISOString(),
    websiteCount: index % 2 === 0 ? 1 : Math.min(3, index % 4),
    permissions: {
      canCreateWebsite: index % 2 === 0 ? false : index % 4 < 3,
      customPermissions: [],
      websiteLimit: index % 2 === 0 ? 1 : 3
    }
  }));

  useEffect(() => {
    setSchools(allSchools);
  }, []);

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
      type: [],
      status: [],
      websiteStatus: [],
      dateRange: {}
    });
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  // Filter schools based on search and filters
  const filteredSchools = schools.filter(school => {
    // Case-insensitive search across multiple fields
    const searchFields = [
      school.name,
      school.type,
      school.status,
      school.websiteStatus,
      school.id.toString()
    ].map(field => field.toLowerCase());
    
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const matchesSearch = searchQuery === '' || 
      searchTerms.every(term => 
        searchFields.some(field => field.includes(term))
      );

    // Rest of your filter conditions
    const matchesType = filters.type.length === 0 || filters.type.includes(school.type);
    const matchesStatus = filters.status.length === 0 || filters.status.includes(school.status);
    const matchesWebsiteStatus = filters.websiteStatus.length === 0 || filters.websiteStatus.includes(school.websiteStatus);
    const schoolDate = new Date(school.createdAt);
    const matchesDateRange = 
      (!filters.dateRange.startDate || schoolDate >= filters.dateRange.startDate) &&
      (!filters.dateRange.endDate || schoolDate <= filters.dateRange.endDate);
    
    return matchesSearch && matchesType && matchesStatus && matchesWebsiteStatus && matchesDateRange;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchools = filteredSchools.slice(startIndex, startIndex + itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePermissionUpdate = (schoolId: number, updates: {
    websiteLimit?: number;
    canCreateWebsite?: boolean;
  }) => {
    // In real app, make API call here
    const updatedSchools = schools.map(school => {
      if (school.id === schoolId) {
        return {
          ...school,
          websiteLimit: updates.websiteLimit ?? school.permissions.websiteLimit,
          permissions: {
            ...school.permissions,
            canCreateWebsite: updates.canCreateWebsite ?? school.permissions.canCreateWebsite
          }
        };
      }
      return school;
    });
    
    // Update the schools state
    setSchools(updatedSchools);
    console.log('Updated permissions for school:', schoolId, updates);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Schools Management
        </h1>
        <div className="mt-4 sm:ml-4 sm:mt-0">
          <button
            type="button"
            className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Add School
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            name="search"
            placeholder="Search schools..."
            onChange={(e) => debouncedSearch(e.target.value)}
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
          {Object.values(filters).reduce((count, filterArray) => count + filterArray.length, 0) > 0 && (
            <span className="ml-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {Object.values(filters).reduce((count, filterArray) => count + filterArray.length, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Updated Schools Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-300 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-4 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      School Name
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Website Status
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Websites
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Created At
                    </th>
                    <th scope="col" className="relative py-4 pl-3 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedSchools.map((school) => (
                    <tr 
                      key={school.id}
                      className="transition duration-150 ease-in-out hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {school.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {highlightText(school.name, searchQuery)}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {highlightText(school.id.toString(), searchQuery)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          {highlightText(school.type, searchQuery)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          school.status === 'active' 
                            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
                            : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                        }`}>
                          <span className={`mr-1 h-1.5 w-1.5 rounded-full ${
                            school.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                          }`} />
                          {highlightText(school.status, searchQuery)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          school.websiteStatus === 'published'
                            ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                            : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                        }`}>
                          {highlightText(school.websiteStatus, searchQuery)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">
                            {school.websiteCount} / {school.permissions.websiteLimit}
                          </span>
                          {school.websiteCount >= school.permissions.websiteLimit && (
                            <span className="text-xs text-amber-600">Limit reached</span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(school.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedSchool(school);
                            setIsPermissionModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Cog6ToothIcon className="h-5 w-5" />
                          <span className="sr-only">Manage permissions for {school.name}</span>
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          Edit<span className="sr-only">, {school.name}</span>
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
          onPageChange={handlePageChange}
        />
      )}

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
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">Filter Schools</h3>
                    <div className="mt-4 space-y-4">
                      {/* School Type Filter */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">School Type</h4>
                        <div className="mt-2 space-y-2">
                          {filterOptions.type.map(type => (
                            <label key={type} className="inline-flex items-center mr-4">
                              <input
                                type="checkbox"
                                checked={filters.type.includes(type)}
                                onChange={() => handleFilterChange('type', type)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              />
                              <span className="ml-2 text-sm text-gray-600">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>

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

                      {/* Website Status Filter */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Website Status</h4>
                        <div className="mt-2 space-y-2">
                          {filterOptions.websiteStatus.map(status => (
                            <label key={status} className="inline-flex items-center mr-4">
                              <input
                                type="checkbox"
                                checked={filters.websiteStatus.includes(status)}
                                onChange={() => handleFilterChange('websiteStatus', status)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              />
                              <span className="ml-2 text-sm text-gray-600">{status}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-x-3">
                      <button
                        type="button"
                        onClick={clearFilters}
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

      {isPermissionModalOpen && selectedSchool && (
        <>
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-20"
            onClick={() => setIsPermissionModalOpen(false)}
          />
          <div className="fixed inset-0 z-30 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {/* Close button */}
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setIsPermissionModalOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Modal content */}
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900 border-b border-gray-200 pb-4">
                      Manage Permissions - {selectedSchool.name}
                    </h3>
                    
                    <div className="mt-6 space-y-6">
                      {/* Website Limits Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Website Limits</h4>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-700">
                              Current Usage: {selectedSchool.websiteCount} / {selectedSchool.permissions.websiteLimit}
                            </span>
                            {selectedSchool.websiteCount >= selectedSchool.permissions.websiteLimit && (
                              <span className="text-xs text-amber-600 mt-1">Limit reached</span>
                            )}
                          </div>
                          {selectedSchool.type === 'SCHOOL_ORGANIZATION' && (
                            <button
                              type="button"
                              onClick={() => handlePermissionUpdate(selectedSchool.id, {
                                websiteLimit: selectedSchool.permissions.websiteLimit + 1
                              })}
                              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                              Increase Limit
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Website Creation Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Website Creation</h4>
                        <div className="flex items-center">
                          <input
                            id="website-creation"
                            type="checkbox"
                            checked={selectedSchool.permissions.canCreateWebsite}
                            onChange={(e) => handlePermissionUpdate(selectedSchool.id, {
                              canCreateWebsite: e.target.checked
                            })}
                            disabled={selectedSchool.websiteCount >= selectedSchool.permissions.websiteLimit}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
                          />
                          <label htmlFor="website-creation" className="ml-3 text-sm text-gray-700">
                            Allow website creation
                            {selectedSchool.websiteCount >= selectedSchool.permissions.websiteLimit && (
                              <span className="block text-xs text-gray-500">
                                Disabled because website limit is reached
                              </span>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex items-center justify-end gap-x-3">
                      <button
                        type="button"
                        onClick={() => setIsPermissionModalOpen(false)}
                        className="text-sm font-semibold leading-6 text-gray-900"
                      >
                        Close
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
