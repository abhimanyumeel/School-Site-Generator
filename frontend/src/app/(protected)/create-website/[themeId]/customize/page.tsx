'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import Navbar from '@/components/layout/Navbar';
import Breadcrumb from '@/components/layout/Breadcrumb';

// Types for our theme metadata
interface ThemeMetadata {
  pages: {
    [key: string]: {
      title: string;
      sections: {
        [key: string]: {
          title: string;
          fields: {
            [key: string]: {
              type: string;
              label: string;
              required?: boolean;
              minLength?: number;
              maxLength?: number;
            };
          };
        };
      };
    };
  };
}

interface Theme {
  id: string;
  name: string;
  previewPath: string;
  metadata: ThemeMetadata;
}

interface User {
    name: string;
    email: string;
    role: string;
  }

export default function CustomizeTheme() {
  const params = useParams();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Fetch theme metadata when component mounts

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/auth/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await axios.get(`/themes/${params.themeId}`);
        setTheme(response.data);
        // Set the first page as current page if it exists
        if (response.data.metadata.pages) {
          setCurrentPage(Object.keys(response.data.metadata.pages)[0]);
        }
      } catch (error) {
        console.error('Failed to fetch theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheme();
  }, [params.themeId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const formDataObj = new FormData(formElement);
    const pageData: Record<string, Record<string, string>> = {};
    
    Array.from(formDataObj.entries()).forEach(([key, value]) => {
      const [section, field] = key.split('.');
      if (!pageData[section]) pageData[section] = {};
      pageData[section][field] = value.toString();
    });

    // Update form data with the current page's data
    const updatedFormData = {
      ...formData,
      [currentPage]: pageData
    };
    setFormData(updatedFormData);

    // Check if this is the last page
    const pages = theme?.metadata.pages || {};
    const pageIds = Object.keys(pages);
    const currentIndex = pageIds.indexOf(currentPage);
    const isLastPage = currentIndex === pageIds.length - 1;

    if (isLastPage) {
      try {
        await axios.post('/themes/generate', {
          themeName: theme?.id,
          name: updatedFormData.home?.hero?.title || 'My Website',
          description: updatedFormData.home?.hero?.description || '',
          data: updatedFormData
        });

        router.push('/websites');
      } catch (error) {
        console.error('Failed to generate website:', error);
      }
    } else {
      setCurrentPage(pageIds[currentIndex + 1]);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Create Website', href: '/create-website' },
              { label: 'Customize Theme', href: '#' },
            ]}
          />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!theme) {
    return (
      <div>
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Create Website', href: '/create-website' },
              { label: 'Theme Not Found', href: '#' },
            ]}
          />
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Theme Not Found</h2>
            <p className="mt-2 text-gray-600">The requested theme could not be found.</p>
            <button
              onClick={() => router.push('/create-website')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Return to Themes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPageData = theme.metadata.pages[currentPage];

  return (
    <div>
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Create Website', href: '/create-website' },
            { label: `Customize ${theme.name}`, href: '#' },
          ]}
        />

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Customize {theme.name}
          </h1>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                Customizing: {currentPageData.title}
              </span>
              <span className="text-sm font-medium text-gray-600">
                Page {Object.keys(theme.metadata.pages).indexOf(currentPage) + 1} of{' '}
                {Object.keys(theme.metadata.pages).length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((Object.keys(theme.metadata.pages).indexOf(currentPage) + 1) /
                      Object.keys(theme.metadata.pages).length) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex space-x-4 mb-8">
            {Object.entries(theme.metadata.pages).map(([pageId, page]) => (
              <button
                key={pageId}
                onClick={() => setCurrentPage(pageId)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  currentPage === pageId
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {page.title}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {Object.entries(currentPageData.sections).map(([sectionId, section]) => (
              <div key={sectionId} className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {section.title}
                </h3>
                <div className="space-y-4">
                  {Object.entries(section.fields).map(([fieldId, field]) => (
                    <div key={fieldId}>
                      <label
                        htmlFor={`${sectionId}.${fieldId}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {field.label}
                      </label>
                      {field.type === 'short-text' && (
                        <input
                          type="text"
                          id={`${sectionId}.${fieldId}`}
                          name={`${sectionId}.${fieldId}`}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required={field.required}
                          minLength={field.minLength}
                          maxLength={field.maxLength}
                          defaultValue={formData[currentPage]?.[sectionId]?.[fieldId]}
                        />
                      )}
                      {field.type === 'long-text' && (
                        <textarea
                          id={`${sectionId}.${fieldId}`}
                          name={`${sectionId}.${fieldId}`}
                          rows={4}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required={field.required}
                          minLength={field.minLength}
                          maxLength={field.maxLength}
                          defaultValue={formData[currentPage]?.[sectionId]?.[fieldId]}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/create-website')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {currentPage === Object.keys(theme.metadata.pages).slice(-1)[0]
                  ? 'Generate Website'
                  : 'Next Page'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}