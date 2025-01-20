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
              items?: Record<string, Field>;
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
  fieldTypes?: {
    image?: {
      ratio?: string;
      showCroppingTool?: boolean;
      minWidth?: number;
      minHeight?: number;
    };
  };
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
  minCount?: number;
  maxCount?: number;
  items?: Record<string, Field>;
  fields?: Record<string, Field>;
  options?: string[];
  default?: any;
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

interface ItemField {
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  ratio?: string;
  showCroppingTool?: boolean;
  minWidth?: number;
  minHeight?: number;
}

interface ArrayFieldProps {
  sectionId: string;
  fieldId: string;
  field: Field;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  currentPage: string;
  renderField: (sectionId: string, fieldId: string, field: Field) => React.ReactNode;
}

interface ObjectFieldProps {
  sectionId: string;
  fieldId: string;
  field: Field;
  renderField: (sectionId: string, fieldId: string, field: Field) => React.ReactNode;
}

interface ItemDefinition {
  type: string;
  label?: string;
  required?: boolean;
  ratio?: string;
  showCroppingTool?: boolean;
  minWidth?: number;
  minHeight?: number;
  options?: string[];
  items?: Record<string, any>;
}

const isFieldDefinition = (obj: any): obj is Field => {
  return obj && 
    typeof obj === 'object' && 
    'type' in obj && 
    'label' in obj &&
    typeof obj.label === 'string';
};

const isImageField = (field: any): field is ImageField => {
  return field.type === 'image' || field.type === 'image-set';
};

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

  // Load saved form data from localStorage when component mounts
  useEffect(() => {
    const savedFormData = localStorage.getItem(`formData-${params.themeId}`);
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, [params.themeId]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(`formData-${params.themeId}`, JSON.stringify(formData));
    }
  }, [formData, params.themeId]);

  // Update handleImageUpload to ensure proper image URL storage
  const handleImageUpload = async (file: File | null, fieldId: string, existingUrls?: string[]) => {
    try {
      const [section, field] = fieldId.split('.');
      setUploadingImages(prev => ({ ...prev, [fieldId]: true }));
      setError(null);

      // Handle image removal/update case
      if (!file && existingUrls !== undefined) {
        setFormData(prev => {
          const newData = {
            ...prev,
            [currentPage]: {
              ...prev[currentPage],
              [section]: {
                ...prev[currentPage]?.[section],
                [field]: existingUrls
              }
            },
            images: {
              ...prev.images,
              [`${currentPage}.${section}.${field}`]: existingUrls
            }
          };
          console.log('Updated form data for image set:', newData);
          return newData;
        });
        return null;
      }

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

      const fieldConfig = theme?.metadata.pages[currentPage]?.sections[section]?.fields[field];
      
      setFormData(prev => {
        const imageUrl = response.data.url;
        const newData = {
          ...prev,
          [currentPage]: {
            ...prev[currentPage],
            [section]: {
              ...prev[currentPage]?.[section],
              [field]: fieldConfig?.type === 'image-set'
                ? [...(prev[currentPage]?.[section]?.[field] || []), imageUrl]
                : imageUrl
            }
          },
          images: {
            ...prev.images,
            [`${currentPage}.${section}.${field}`]: fieldConfig?.type === 'image-set'
              ? [...(prev.images?.[`${currentPage}.${section}.${field}`] || []), imageUrl]
              : imageUrl
          }
        };
        console.log('Updated form data after upload:', newData);
        return newData;
      });

      return response.data.url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      setError('Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploadingImages(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Update handleSubmit to ensure all metadata fields are included
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Get current page metadata
      const pageMetadata = theme?.metadata.pages[currentPage];
      if (!pageMetadata) throw new Error('Page metadata not found');

      // Create complete page data structure
      const pageData: Record<string, any> = {};
      
      // Process each section in the metadata
      Object.entries(pageMetadata.sections).forEach(([sectionId, section]) => {
        pageData[sectionId] = {};
        
        // Process each field in the section
        Object.entries(section.fields).forEach(([fieldId, field]) => {
          const value = formData[currentPage]?.[sectionId]?.[fieldId];
          if (field.type === 'image' || field.type === 'image-set') {
            // Use existing image value from state
            pageData[sectionId][fieldId] = value || (field.type === 'image-set' ? [] : '');
          } 
          else if (field.type === 'array') {
            const arrayData = [];
            const formElement = e.currentTarget as HTMLFormElement;
            const arrayField = field as Field;
            
            // Get the number of items (using minCount as default)
            const itemCount = arrayField.minCount || 1;
            
            // For each item in the array
            for (let i = 0; i < itemCount; i++) {
              const itemData: Record<string, string> = {};
              // For each field in the item
              Object.keys(arrayField.items || {}).forEach(itemKey => {
                const inputName = `${sectionId}.${fieldId}.${i}.${itemKey}`;
                const input = formElement[inputName];
                if (input) {
                  itemData[itemKey] = input.value;
                }
              });
              arrayData.push(itemData);
            }
            
            pageData[sectionId][fieldId] = arrayData;
          }
          else {
            // Use form input value
            const formValue = (e.currentTarget as HTMLFormElement)[`${sectionId}.${fieldId}`]?.value;
            pageData[sectionId][fieldId] = formValue || '';
          }
        });
      });

      // Merge with existing form data
      const updatedFormData = {
        ...formData,
        [currentPage]: pageData,
      };

      // Check if this is the last page
      const pages = theme?.metadata.pages || {};
      const pageIds = Object.keys(pages);
      const currentIndex = pageIds.indexOf(currentPage);
      const isLastPage = currentIndex === pageIds.length - 1;

      if (isLastPage) {
        try {
          // First, create or get the website
          let websiteId = website?.id;
          
          if (!websiteId) {
            // Create a new website record
            const websiteResponse = await axios.post('/themes/generate', {
              themeName: theme?.id, // Use theme.id as themeName
              websiteId: 'new', // Special value to indicate new website
              data: {
                name: updatedFormData.home?.hero?.title || 'My Website',
                description: updatedFormData.home?.hero?.subtitle || 'My Website Description',
                author: 'Anonymous',
                createdAt: new Date().toISOString(),
                ...updatedFormData,
              }
            });

            console.log('Response received:', websiteResponse.data);

            const buildData = websiteResponse.data.data;

            if (buildData?.buildPath) {
              router.push(`/create-website/${params.themeId}/success?buildPath=${encodeURIComponent(buildData.buildPath)}`);
            } else {
              console.error('Invalid response structure:', websiteResponse.data);
              setError('Invalid response from server. Missing build path.');
            }

            localStorage.removeItem(`formData-${params.themeId}`);
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
        // Move to next page
        setCurrentPage(pageIds[currentIndex + 1]);
      }

      // Update form data state
      setFormData(updatedFormData);
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
    // Basic field type check
    if (!field.type) {
      console.warn(`Field ${fieldId} has no type defined`);
      return null;
    }

    // Common props for all fields
    const commonProps = {
      id: `${sectionId}.${fieldId}`,
      name: `${sectionId}.${fieldId}`,
      required: field.required,
      'aria-label': field.label,
      className: "w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
    };

    switch (field.type) {
      case 'short-text':
      case 'email':
      case 'url':
      case 'number':
        return (
          <input
            type={field.type === 'short-text' ? 'text' : field.type}
            {...commonProps}
            minLength={field.minLength}
            maxLength={field.maxLength}
            defaultValue={field.default}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'long-text':
        return (
          <textarea
            {...commonProps}
            rows={4}
            minLength={field.minLength}
            maxLength={field.maxLength}
            defaultValue={field.default}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'select':
        return (
          <select {...commonProps} defaultValue={field.default}>
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'image':
      case 'image-set':
        return (
          <ImageUploadField
            id={`${sectionId}.${fieldId}`}
            field={field as unknown as ImageField}
            onUpload={handleImageUpload}
            value={formData[currentPage]?.[sectionId]?.[fieldId]}
            isUploading={uploadingImages[`${sectionId}.${fieldId}`]}
            schoolWebsiteId={website?.id || ''}
          />
        );

      case 'array':
        return (
          <div className="space-y-4">
            {/* Array items container */}
            <div className="space-y-4">
              {(formData[currentPage]?.[sectionId]?.[fieldId] || [{}]).map((item: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-700">
                      {field.label || 'Item'} {index + 1}
                    </span>
                    {(formData[currentPage]?.[sectionId]?.[fieldId] || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                          newItems.splice(index, 1);
                          setFormData({
                            ...formData,
                            [currentPage]: {
                              ...formData[currentPage],
                              [sectionId]: {
                                ...formData[currentPage]?.[sectionId],
                                [fieldId]: newItems
                              }
                            }
                          });
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Render item fields */}
                  <div className="space-y-4">
                    {Object.entries(field.items || {}).map(([itemKey, itemDef]) => {
                      const inputId = `${sectionId}.${fieldId}.${index}.${itemKey}`;
                      
                      // Handle nested object fields
                      if (!itemDef) return null;
                      if (typeof itemDef === 'object' && 'type' in itemDef) {
                        const typedItemDef = itemDef as ItemDefinition;
                        // Handle nested array (like dropdown items)
                        if (typedItemDef.type === 'array') {
                          return (
                            <div key={itemKey} className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {typedItemDef.label || itemKey.charAt(0).toUpperCase() + itemKey.slice(1)}
                              </label>
                              <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                                {/* Show nested items only if parent type is dropdown */}
                                {item.type === 'dropdown' && (
                                  <>
                                    {(item[itemKey] || []).map((subItem: any, subIndex: number) => (
                                      <div key={subIndex} className="flex gap-4 items-start">
                                        {Object.entries(typedItemDef.items || {}).map(([subItemKey, subItemDef]: [string, any]) => (
                                          <div key={subItemKey} className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                              {subItemDef.label || subItemKey.charAt(0).toUpperCase() + subItemKey.slice(1)}
                                            </label>
                                            <input
                                              type="text"
                                              value={subItem[subItemKey] || ''}
                                              onChange={(e) => {
                                                const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                                                if (!newItems[index][itemKey]) newItems[index][itemKey] = [];
                                                newItems[index][itemKey][subIndex] = {
                                                  ...newItems[index][itemKey][subIndex],
                                                  [subItemKey]: e.target.value
                                                };
                                                setFormData({
                                                  ...formData,
                                                  [currentPage]: {
                                                    ...formData[currentPage],
                                                    [sectionId]: {
                                                      ...formData[currentPage]?.[sectionId],
                                                      [fieldId]: newItems
                                                    }
                                                  }
                                                });
                                              }}
                                              className="w-full px-3 py-2 border rounded-md text-sm"
                                            />
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                                            newItems[index][itemKey].splice(subIndex, 1);
                                            setFormData({
                                              ...formData,
                                              [currentPage]: {
                                                ...formData[currentPage],
                                                [sectionId]: {
                                                  ...formData[currentPage]?.[sectionId],
                                                  [fieldId]: newItems
                                                }
                                              }
                                            });
                                          }}
                                          className="text-red-500 hover:text-red-700 text-sm mt-6"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                                        if (!newItems[index][itemKey]) newItems[index][itemKey] = [];
                                        newItems[index][itemKey].push({});
                                        setFormData({
                                          ...formData,
                                          [currentPage]: {
                                            ...formData[currentPage],
                                            [sectionId]: {
                                              ...formData[currentPage]?.[sectionId],
                                              [fieldId]: newItems
                                            }
                                          }
                                        });
                                      }}
                                      className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                    >
                                      Add Item
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // Handle select fields
                        if (typedItemDef.type === 'select') {
                          return (
                            <div key={itemKey} className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {typedItemDef.label || itemKey.charAt(0).toUpperCase() + itemKey.slice(1)}
                              </label>
                              <select
                                value={item[itemKey] || ''}
                                onChange={(e) => {
                                  const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                                  newItems[index] = {
                                    ...newItems[index],
                                    [itemKey]: e.target.value,
                                    ...(itemKey === 'type' && e.target.value === 'dropdown' ? { items: [] } : {})
                                  };
                                  setFormData({
                                    ...formData,
                                    [currentPage]: {
                                      ...formData[currentPage],
                                      [sectionId]: {
                                        ...formData[currentPage]?.[sectionId],
                                        [fieldId]: newItems
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border rounded-md"
                              >
                                <option value="">Select {typedItemDef.label || itemKey}</option>
                                {typedItemDef.options?.map((option: string) => (
                                  <option key={option} value={option}>
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }
                      }

                      // Handle simple fields (text, number, etc.)
                      return (
                        <div key={itemKey} className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {(itemDef as Field).label || itemKey.charAt(0).toUpperCase() + itemKey.slice(1)}
                          </label>
                          <input
                            type="text"
                            value={item[itemKey] || ''}
                            onChange={(e) => {
                              const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                              newItems[index] = { ...newItems[index], [itemKey]: e.target.value };
                              setFormData({
                                ...formData,
                                [currentPage]: {
                                  ...formData[currentPage],
                                  [sectionId]: {
                                    ...formData[currentPage]?.[sectionId],
                                    [fieldId]: newItems
                                  }
                                }
                              });
                            }}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Item button for array fields */}
            <button
              type="button"
              onClick={() => {
                const currentItems = formData[currentPage]?.[sectionId]?.[fieldId] || [];
                const newItems = [...currentItems, {}];
                setFormData({
                  ...formData,
                  [currentPage]: {
                    ...formData[currentPage],
                    [sectionId]: {
                      ...formData[currentPage]?.[sectionId],
                      [fieldId]: newItems
                    }
                  }
                });
              }}
              className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 
                text-blue-600 font-medium rounded-lg text-sm
                border border-blue-100 transition-colors duration-200
                flex items-center justify-center gap-2"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" 
                  clipRule="evenodd" 
                />
              </svg>
              Add {field.label || 'Item'}
            </button>
          </div>
        );

      case 'object':
        return (
          <ObjectField
            sectionId={sectionId}
            fieldId={fieldId}
            field={field}
            renderField={renderField}
          />
        );

      case 'html':
        return (
          <textarea
            {...commonProps}
            rows={6}
            defaultValue={field.default}
            placeholder="Enter HTML content"
          />
        );

      default:
        console.warn(`Unsupported field type: ${field.type}`);
        return null;
    }
  };

  // Separate component for object fields
  const ObjectField = ({ sectionId, fieldId, field, renderField }: ObjectFieldProps) => {
    return (
      <div className="space-y-4 p-6 bg-white border border-gray-200 rounded-lg">
        {field.fields && Object.entries(field.fields).map(([key, subField]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {(subField as Field).label}
            </label>
            {renderField(`${sectionId}.${fieldId}`, key, subField as Field)}
          </div>
        ))}
      </div>
    );
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
                          field={field as unknown as ImageField}
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
                      {field.type === 'array' && (
                        <div className="space-y-4">
                          {/* Array items container */}
                          <div className="space-y-4">
                            {(formData[currentPage]?.[sectionId]?.[fieldId] || [{}]).map((item: any, index: number) => (
                              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                                <div className="flex justify-between items-center mb-4">
                                  <span className="text-sm font-medium text-gray-700">
                                    {field.label || 'Item'} {index + 1}
                                  </span>
                                  {(formData[currentPage]?.[sectionId]?.[fieldId] || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                                        newItems.splice(index, 1);
                                        setFormData({
                                          ...formData,
                                          [currentPage]: {
                                            ...formData[currentPage],
                                            [sectionId]: {
                                              ...formData[currentPage]?.[sectionId],
                                              [fieldId]: newItems
                                            }
                                          }
                                        });
                                      }}
                                      className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>

                                {/* Render item fields */}
                                <div className="space-y-4">
                                  {Object.entries(field.items || {}).map(([itemKey, itemDef]) => {
                                    const inputId = `${sectionId}.${fieldId}.${index}.${itemKey}`;
                                    
                                    // Handle nested object fields
                                    if (!itemDef) return null;
                                    if (typeof itemDef === 'object' && 'type' in itemDef) {
                                      const typedItemDef = itemDef as ItemDefinition;
                                      // Handle nested array (like dropdown items)
                                      if (typedItemDef.type === 'array') {
                                        return (
                                          <div key={itemKey} className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                              {typedItemDef.label || itemKey.charAt(0).toUpperCase() + itemKey.slice(1)}
                                            </label>
                                            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                                              {/* Show nested items only if parent type is dropdown */}
                                              {item.type === 'dropdown' && (
                                                <>
                                                  {(item[itemKey] || []).map((subItem: any, subIndex: number) => (
                                                    <div key={subIndex} className="flex gap-4 items-start">
                                                      {Object.entries(typedItemDef.items || {}).map(([subItemKey, subItemDef]: [string, any]) => (
                                                        <div key={subItemKey} className="flex-1">
                                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            {subItemDef.label || subItemKey.charAt(0).toUpperCase() + subItemKey.slice(1)}
                                                          </label>
                                                          <input
                                                            type="text"
                                                            value={subItem[subItemKey] || ''}
                                                            onChange={(e) => {
                                                              const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                                                              if (!newItems[index][itemKey]) newItems[index][itemKey] = [];
                                                              newItems[index][itemKey][subIndex] = {
                                                                ...newItems[index][itemKey][subIndex],
                                                                [subItemKey]: e.target.value
                                                              };
                                                              setFormData({
                                                                ...formData,
                                                                [currentPage]: {
                                                                  ...formData[currentPage],
                                                                  [sectionId]: {
                                                                    ...formData[currentPage]?.[sectionId],
                                                                    [fieldId]: newItems
                                                                  }
                                                                }
                                                              });
                                                            }}
                                                            className="w-full px-3 py-2 border rounded-md text-sm"
                                                          />
                                                        </div>
                                                      ))}
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                                                          newItems[index][itemKey].splice(subIndex, 1);
                                                          setFormData({
                                                            ...formData,
                                                            [currentPage]: {
                                                              ...formData[currentPage],
                                                              [sectionId]: {
                                                                ...formData[currentPage]?.[sectionId],
                                                                [fieldId]: newItems
                                                              }
                                                            }
                                                          });
                                                        }}
                                                        className="text-red-500 hover:text-red-700 text-sm mt-6"
                                                      >
                                                        Remove
                                                      </button>
                                                    </div>
                                                  ))}
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                                                      if (!newItems[index][itemKey]) newItems[index][itemKey] = [];
                                                      newItems[index][itemKey].push({});
                                                      setFormData({
                                                        ...formData,
                                                        [currentPage]: {
                                                          ...formData[currentPage],
                                                          [sectionId]: {
                                                            ...formData[currentPage]?.[sectionId],
                                                            [fieldId]: newItems
                                                          }
                                                        }
                                                      });
                                                    }}
                                                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                                  >
                                                    Add Item
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      }

                                      // Handle select fields
                                      if (typedItemDef.type === 'select') {
                                        return (
                                          <div key={itemKey} className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                              {typedItemDef.label || itemKey.charAt(0).toUpperCase() + itemKey.slice(1)}
                                            </label>
                                            <select
                                              value={item[itemKey] || ''}
                                              onChange={(e) => {
                                                const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                                                newItems[index] = {
                                                  ...newItems[index],
                                                  [itemKey]: e.target.value,
                                                  ...(itemKey === 'type' && e.target.value === 'dropdown' ? { items: [] } : {})
                                                };
                                                setFormData({
                                                  ...formData,
                                                  [currentPage]: {
                                                    ...formData[currentPage],
                                                    [sectionId]: {
                                                      ...formData[currentPage]?.[sectionId],
                                                      [fieldId]: newItems
                                                    }
                                                  }
                                                });
                                              }}
                                              className="w-full px-3 py-2 border rounded-md"
                                            >
                                              <option value="">Select {typedItemDef.label || itemKey}</option>
                                              {typedItemDef.options?.map((option: string) => (
                                                <option key={option} value={option}>
                                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        );
                                      }
                                    }

                                    // Handle simple fields (text, number, etc.)
                                    return (
                                      <div key={itemKey} className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          {(itemDef as Field).label || itemKey.charAt(0).toUpperCase() + itemKey.slice(1)}
                                        </label>
                                        <input
                                          type="text"
                                          value={item[itemKey] || ''}
                                          onChange={(e) => {
                                            const newItems = [...(formData[currentPage]?.[sectionId]?.[fieldId] || [])];
                                            newItems[index] = { ...newItems[index], [itemKey]: e.target.value };
                                            setFormData({
                                              ...formData,
                                              [currentPage]: {
                                                ...formData[currentPage],
                                                [sectionId]: {
                                                  ...formData[currentPage]?.[sectionId],
                                                  [fieldId]: newItems
                                                }
                                              }
                                            });
                                          }}
                                          className="w-full px-3 py-2 border rounded-md"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Add Item button for array fields */}
                          <button
                            type="button"
                            onClick={() => {
                              const currentItems = formData[currentPage]?.[sectionId]?.[fieldId] || [];
                              const newItems = [...currentItems, {}];
                              setFormData({
                                ...formData,
                                [currentPage]: {
                                  ...formData[currentPage],
                                  [sectionId]: {
                                    ...formData[currentPage]?.[sectionId],
                                    [fieldId]: newItems
                                  }
                                }
                              });
                            }}
                            className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 
                              text-blue-600 font-medium rounded-lg text-sm
                              border border-blue-100 transition-colors duration-200
                              flex items-center justify-center gap-2"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path 
                                fillRule="evenodd" 
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" 
                                clipRule="evenodd" 
                              />
                            </svg>
                            Add {field.label || 'Item'}
                          </button>
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