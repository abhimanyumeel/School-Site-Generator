'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { isAxiosError } from 'axios';
import Navbar from '@/components/layout/Navbar';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { HiHome, HiTemplate, HiColorSwatch, HiCog, HiInformationCircle, HiMail } from 'react-icons/hi';
import ImageUploadField from '@/components/form/ImageUploadField';

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

interface GenerateResponse {
  statusCode: number;
  message: string;
  data: {
    status: string;
    message: string;
    buildPath: string;
    timestamp: string;
  };
}

// Add this interface before ImageField
interface Field {
  type: string;
  label: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

interface ImageField extends Field {
  type: 'image' | 'image-set';
  ratio?: string;
  showCroppingTool?: boolean;
  minWidth?: number;
  minHeight?: number;
}

interface Website {
  id: string;
  data: Record<string, any>;
}

interface UploadingImages {
  [key: string]: boolean;
}

// Update the type definition for onUpload
type UploadHandler = (file: File | null, fieldId: string, existingUrls?: string[]) => Promise<string | null>;

export default function CustomizeTheme() {
  const params = useParams();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);

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

  // Update the handleImageUpload function
  const handleImageUpload = async (file: File | null, fieldId: string, existingUrls?: string[]) => {
    try {
      setUploadingImages(prev => ({ ...prev, [fieldId]: true }));
      setError(null);

      const [section, field] = fieldId.split('.');

      // Handle image removal/update case
      if (!file && existingUrls !== undefined) {
        setFormData(prev => ({
          ...prev,
          [currentPage]: {
            ...prev[currentPage],
            [section]: {
              ...prev[currentPage]?.[section],
              [field]: existingUrls
            }
          }
        }));
        return null;
      }

      // Handle new file upload
      if (!file) return null;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('section', section);
      formData.append('fieldId', field);

      if (website?.id) {
        formData.append('schoolWebsiteId', website.id);
      }

      const response = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update form data
      const fieldConfig = theme?.metadata.pages[currentPage]?.sections[section]?.fields[field];
      if (fieldConfig?.type === 'image-set') {
        setFormData(prev => ({
          ...prev,
          [currentPage]: {
            ...prev[currentPage],
            [section]: {
              ...prev[currentPage]?.[section],
              [field]: [...(prev[currentPage]?.[section]?.[field] || []), response.data.url]
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [currentPage]: {
            ...prev[currentPage],
            [section]: {
              ...prev[currentPage]?.[section],
              [field]: response.data.url
            }
          }
        }));
      }

      return response.data.url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      setError('Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploadingImages(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Modify handleSubmit to handle image fields
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    try {
      const formElement = e.currentTarget;
      const formDataObj = new FormData(formElement);
      const pageData: Record<string, Record<string, any>> = {};
      
      // Process form data including images
      Array.from(formDataObj.entries()).forEach(([key, value]) => {
        const [section, field] = key.split('.');
        if (!pageData[section]) pageData[section] = {};
        
        // Handle image fields differently
        const fieldConfig = theme?.metadata.pages[currentPage]?.sections[section]?.fields[field] as ImageField;
        if (fieldConfig?.type === 'image' || fieldConfig?.type === 'image-set') {
          // For image fields, use the value from state instead of form data
          const imageValue = formData[currentPage]?.[section]?.[field];
          if (imageValue) {
            pageData[section][field] = imageValue;
          }
          return;
        }
        
        pageData[section][field] = value.toString();
      });

      // Merge with existing form data
      const updatedFormData = {
        ...formData,
        [currentPage]: {
          ...formData[currentPage],
          ...pageData,
        },
      };

      setFormData(updatedFormData);

      // Check if this is the last page
      const pages = theme?.metadata.pages || {};
      const pageIds = Object.keys(pages);
      const currentIndex = pageIds.indexOf(currentPage);
      const isLastPage = currentIndex === pageIds.length - 1;

      if (isLastPage) {
        try {
          const payload = {
            themeName: theme?.id,
            data: updatedFormData
          };

          console.log('Sending payload:', JSON.stringify(payload, null, 2));

          // Generate theme first
          const response = await axios.post<GenerateResponse>('/themes/generate', payload);
          console.log('Response received:', response.data);

          const buildData = response.data.data;

          if (buildData?.buildPath) {
            router.push(`/create-website/${params.themeId}/success?buildPath=${encodeURIComponent(buildData.buildPath)}`);
          } else {
            console.error('Invalid response structure:', response.data);
            setError('Invalid response from server. Missing build path.');
          }
        } catch (error) {
          if (isAxiosError(error)) {
            const errorMessage = error.response?.data?.message || error.message;
            console.error('API Error:', {
              status: error.response?.status,
              data: error.response?.data,
              message: errorMessage
            });
            setError(`Failed to generate website: ${errorMessage}`);
          } else {
            console.error('Unexpected error:', error);
            setError('An unexpected error occurred while generating the website');
          }
        }
      } else {
        setCurrentPage(pageIds[currentIndex + 1]);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setError('Failed to submit form. Please try again.');
    }
  };

  // Add this helper function to get icon for each step
  const getStepIcon = (page: string) => {
    const icons = {
      home: HiHome,
      about: HiInformationCircle,
      contact: HiMail,
      content: HiTemplate,
      style: HiColorSwatch,
      settings: HiCog,
    };
    return icons[page as keyof typeof icons] || HiTemplate;
  };

  // Modify the form field rendering to include image upload components
  const renderField = (sectionId: string, fieldId: string, field: Field) => {
    if (field.type === 'image' || field.type === 'image-set') {
      return (
        <ImageUploadField
          key={`${sectionId}.${fieldId}`}
          id={`${sectionId}.${fieldId}`}
          field={field as ImageField}
          onUpload={handleImageUpload}
          value={formData[currentPage]?.[sectionId]?.[fieldId]}
          isUploading={uploadingImages[`${sectionId}.${fieldId}`]}
          schoolWebsiteId={website?.id || ''}
        />
      );
    }
    
    // ... existing field rendering logic ...
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
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100'>
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-12">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Create Website', href: '/create-website' },
            { label: `Customize ${theme.name}`, href: '#' },
          ]}
        />

        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-blue-500 to-purple-600 animate-gradient-x">
              Customize {theme.name}
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Personalize your website design and content
            </p>
          </div>

          {/* Progress Indicator - Fixed alignment */}
          <div className="mb-12 bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm font-semibold text-gray-700">
                Customizing: <span className="text-blue-600">{currentPageData.title}</span>
              </span>
              <span className="text-sm font-medium text-gray-700 bg-blue-50 px-4 py-1.5 rounded-full">
                Step {Object.keys(theme.metadata.pages).indexOf(currentPage) + 1} of{' '}
                {Object.keys(theme.metadata.pages).length}
              </span>
            </div>
            
            <div className="relative">
              {/* Progress bar background - Adjusted positioning */}
              <div 
                className="absolute left-0 w-full h-1 bg-gray-200"
                style={{ top: '24px' }} // Center the line relative to the circles
              ></div>
              
              {/* Active progress bar - Adjusted positioning */}
              <div 
                className="absolute h-1 bg-blue-500 transition-all duration-300"
                style={{ 
                  top: '24px',
                  left: 0,
                  width: `${(Object.keys(theme.metadata.pages).indexOf(currentPage) / (Object.keys(theme.metadata.pages).length - 1)) * 100}%` 
                }}
              ></div>

              {/* Steps */}
              <div className="relative z-10 flex justify-between">
                {Object.entries(theme.metadata.pages).map(([pageId, page], index) => {
                  const StepIcon = getStepIcon(pageId);
                  const isActive = index <= Object.keys(theme.metadata.pages).indexOf(currentPage);
                  const isCurrent = pageId === currentPage;

                  return (
                    <div key={pageId} className="flex flex-col items-center">
                      <div 
                        className={`
                          w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 
                          ${isActive 
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
                            : 'bg-white border-2 border-gray-200 text-gray-400'}
                          ${isCurrent 
                            ? 'ring-4 ring-blue-100' 
                            : ''}
                        `}
                      >
                        <StepIcon size="1.5em" />
                      </div>
                      <span 
                        className={`
                          mt-2 text-sm font-medium whitespace-nowrap
                          ${isActive ? 'text-blue-600' : 'text-gray-500'}
                        `}
                      >
                        {page.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Page Navigation - Updated styling */}
          <div className="flex space-x-4 mb-8 bg-white p-2 rounded-lg shadow-sm">
            {Object.entries(theme.metadata.pages).map(([pageId, page]) => (
              <button
                key={pageId}
                onClick={() => setCurrentPage(pageId)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === pageId
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page.title}
              </button>
            ))}
          </div>

          {/* Form - Modern styling */}
          <form onSubmit={handleSubmit}>
            {Object.entries(currentPageData.sections).map(([sectionId, section]) => (
              <div key={sectionId} className="bg-white shadow-sm rounded-xl p-8 mb-8 border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  {section.title}
                </h3>
                <div className="space-y-6">
                  {Object.entries(section.fields).map(([fieldId, field]) => (
                    <div key={fieldId} className="relative">
                      <label
                        htmlFor={`${sectionId}.${fieldId}`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {(field.type === 'image' || field.type === 'image-set') && (
                        <ImageUploadField
                          id={`${sectionId}.${fieldId}`}
                          field={field as ImageField}
                          onUpload={handleImageUpload}
                          value={formData[currentPage]?.[sectionId]?.[fieldId]}
                          isUploading={uploadingImages[`${sectionId}.${fieldId}`]}
                          schoolWebsiteId={website?.id || ''}
                        />
                      )}

                      {field.type === 'short-text' && (
                        <input
                          type="text"
                          id={`${sectionId}.${fieldId}`}
                          name={`${sectionId}.${fieldId}`}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            placeholder:text-gray-400
                            transition-all duration-200
                            hover:border-gray-400"
                          required={field.required}
                          minLength={field.minLength}
                          maxLength={field.maxLength}
                          defaultValue={formData[currentPage]?.[sectionId]?.[fieldId]}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      )}
                      {field.type === 'long-text' && (
                        <textarea
                          id={`${sectionId}.${fieldId}`}
                          name={`${sectionId}.${fieldId}`}
                          rows={4}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            placeholder:text-gray-400
                            transition-all duration-200
                            hover:border-gray-400
                            resize-y min-h-[100px]"
                          required={field.required}
                          minLength={field.minLength}
                          maxLength={field.maxLength}
                          defaultValue={formData[currentPage]?.[sectionId]?.[fieldId]}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      )}
                      {field.maxLength && (
                        <div className="mt-1 text-sm text-gray-500">
                          Maximum {field.maxLength} characters
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Form buttons - Updated styling */}
            <div className="flex justify-end space-x-4 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border border-gray-100 backdrop-blur-sm bg-opacity-90">
              <button
                type="button"
                onClick={() => router.push('/create-website')}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 
                  hover:bg-gray-50 hover:border-gray-400
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white
                  bg-gradient-to-r from-blue-600 to-blue-700
                  hover:from-blue-700 hover:to-blue-800
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  shadow-sm hover:shadow-md"
              >
                {currentPage === Object.keys(theme.metadata.pages).slice(-1)[0]
                  ? 'Generate Website'
                  : 'Next Page'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}