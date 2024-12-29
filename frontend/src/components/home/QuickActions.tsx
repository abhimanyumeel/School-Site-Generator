'use client';

import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const handleNewWebsite = () => {
    router.push('/create-website');
  };

  const handleBrowseTemplates = () => {
    router.push('/templates');
  };

  const handleQuickStart = () => {
    router.push('/tutorials');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <button 
        onClick={handleNewWebsite}
        className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="p-3 bg-blue-100 rounded-lg mr-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">New Website</h3>
          <p className="text-sm text-gray-500">Create a new website</p>
        </div>
      </button>

      <button 
        onClick={handleBrowseTemplates}
        className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="p-3 bg-green-100 rounded-lg mr-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">Templates</h3>
          <p className="text-sm text-gray-500">Browse templates</p>
        </div>
      </button>

      <button 
        onClick={handleQuickStart}
        className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="p-3 bg-purple-100 rounded-lg mr-4">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">Quick Start</h3>
          <p className="text-sm text-gray-500">View tutorials</p>
        </div>
      </button>
    </div>
  );
} 