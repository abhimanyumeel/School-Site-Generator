'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';
import { HiPlus, HiDownload, HiEye, HiPencil } from 'react-icons/hi';

interface Website {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  themeId: string;
  buildPath?: string;
}

export default function WebsitesGrid() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await axios.get('/websites/my-websites');
        setWebsites(response.data);
      } catch (error) {
        console.error('Failed to fetch websites:', error);
        setError('Failed to load websites. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebsites();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Websites</h2>
        <Link
          href="/create-website"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          <span className="mr-2"><HiPlus size={20} /></span>
          Create New Website
        </Link>
      </div>

      {websites.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <HiPlus size={48} />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No websites yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first website.</p>
          <div className="mt-6">
            <Link
              href="/create-website"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              <span className="mr-2"><HiPlus size={20} /></span>
              Create New Website
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <div
              key={website.id}
              className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">{website.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    website.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {website.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Created on {new Date(website.createdAt).toLocaleDateString()}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {website.buildPath && (
                  <>
                    <button
                      onClick={() => website.buildPath && window.open(`/api/preview?path=${encodeURIComponent(website.buildPath)}`, '_blank')}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                      <span className="mr-1"><HiEye size={16} /></span>
                      Preview
                    </button>
                    <a
                      href={`/api/download?path=${encodeURIComponent(website.buildPath)}`}
                      download
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                    >
                      <span className="mr-1"><HiDownload size={16} /></span>
                      Download
                    </a>
                  </>
                )}
                <Link
                  href={`/website/${website.id}/edit`}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <span className="mr-1"><HiPencil size={16} /></span>
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
