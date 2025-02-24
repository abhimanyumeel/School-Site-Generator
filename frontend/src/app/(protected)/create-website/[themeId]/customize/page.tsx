'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { isAxiosError } from 'axios';
import Navbar from '@/components/layout/Navbar';
import Breadcrumb from '@/components/layout/Breadcrumb';

import { IoSettingsOutline } from 'react-icons/io5';
import { HiOutlineHome } from 'react-icons/hi2';
import { FiInfo } from 'react-icons/fi';
import { FaRegBuilding } from 'react-icons/fa';
import { RiTeamLine } from 'react-icons/ri';
import { IoChatboxEllipsesOutline } from 'react-icons/io5';
import { IoCalendarOutline } from 'react-icons/io5';
import { LuContact } from 'react-icons/lu';
import { IoMegaphoneOutline } from 'react-icons/io5';
import { HiTemplate } from 'react-icons/hi';
import { GrGallery } from 'react-icons/gr';
import { FaFileContract } from 'react-icons/fa';
import { MdOutlinePrivacyTip } from 'react-icons/md';
import { RiUserAddLine } from 'react-icons/ri';
import { LiaClipboardListSolid } from 'react-icons/lia';
import { FaRegHandshake } from 'react-icons/fa';
import { PiCertificate } from 'react-icons/pi';

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

export interface Field {
  type: string;
  label: string;
  required?: boolean;
  allowMultiple?: boolean;
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
type UploadHandler = (
  file: File | null,
  fieldId: string,
  existingUrls?: string[],
) => Promise<string | null>;

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
  renderField: (
    sectionId: string,
    fieldId: string,
    field: Field,
  ) => React.ReactNode;
}

interface ObjectFieldProps {
  sectionId: string;
  fieldId: string;
  field: Field;
  renderField: (
    sectionId: string,
    fieldId: string,
    field: Field,
  ) => React.ReactNode;
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
  fields?: Record<string, Field>;
}

const isFieldDefinition = (obj: any): obj is Field => {
  return (
    obj &&
    typeof obj === 'object' &&
    'type' in obj &&
    (('label' in obj && typeof obj.label === 'string') ||
      (obj.type === 'object' && 'fields' in obj))
  );
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
  const [uploadingImages, setUploadingImages] = useState<{
    [key: string]: boolean;
  }>({});
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
      localStorage.setItem(
        `formData-${params.themeId}`,
        JSON.stringify(formData),
      );
    }
  }, [formData, params.themeId]);

  // Update handleImageUpload to ensure proper image URL storage
  const handleImageUpload = async (
    file: File | null,
    fieldId: string,
    existingUrls?: string[],
  ) => {
    try {
      const [section, field] = fieldId.split('.');
      setUploadingImages((prev) => ({ ...prev, [fieldId]: true }));
      setError(null);

      // Handle image removal/update case
      if (!file && existingUrls !== undefined) {
        setFormData((prev) => {
          const newData = {
            ...prev,
            [currentPage]: {
              ...prev[currentPage],
              [section]: {
                ...prev[currentPage]?.[section],
                [field]: existingUrls,
              },
            },
            images: {
              ...prev.images,
              [`${currentPage}.${section}.${field}`]: existingUrls,
            },
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

      const fieldConfig =
        theme?.metadata.pages[currentPage]?.sections[section]?.fields[field];

      setFormData((prev) => {
        const imageUrl = response.data.url;
        const newData = {
          ...prev,
          [currentPage]: {
            ...prev[currentPage],
            [section]: {
              ...prev[currentPage]?.[section],
              [field]:
                fieldConfig?.type === 'image-set'
                  ? [...(prev[currentPage]?.[section]?.[field] || []), imageUrl]
                  : imageUrl,
            },
          },
          images: {
            ...prev.images,
            [`${currentPage}.${section}.${field}`]:
              fieldConfig?.type === 'image-set'
                ? [
                    ...(prev.images?.[`${currentPage}.${section}.${field}`] ||
                      []),
                    imageUrl,
                  ]
                : imageUrl,
          },
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
      setUploadingImages((prev) => ({ ...prev, [fieldId]: false }));
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
          if (field.type === 'image' || field.type === 'image-set') {
            // Keep existing image handling
            pageData[sectionId][fieldId] =
              formData[currentPage]?.[sectionId]?.[fieldId] ||
              (field.type === 'image-set' ? [] : '');
          } else if (field.type === 'array') {
            // Get existing array data from formData
            const existingItems =
              formData[currentPage]?.[sectionId]?.[fieldId] || [];

            pageData[sectionId][fieldId] = existingItems.map(
              (item: any, index: number) => {
                const itemData: Record<string, any> = {};

                // Process each field in the array item
                Object.entries(field.items || {}).forEach(
                  ([itemKey, itemDef]) => {
                    if ((itemDef as Field).type === 'object') {
                      // Handle nested objects within array items
                      const nestedData: Record<string, any> = {};
                      Object.entries((itemDef as Field).fields || {}).forEach(
                        ([nestedKey, nestedField]) => {
                          if (
                            (nestedField as Field).type === 'image' ||
                            (nestedField as Field).type === 'image-set'
                          ) {
                            // Handle image fields within nested objects
                            nestedData[nestedKey] =
                              item[itemKey]?.[nestedKey] ||
                              ((nestedField as Field).type === 'image-set'
                                ? []
                                : '');
                          } else if (
                            (nestedField as Field).type === 'checkbox'
                          ) {
                            // Handle checkbox fields within nested objects
                            nestedData[nestedKey] =
                              !!item[itemKey]?.[nestedKey];
                          } else {
                            // Handle other field types (short-text, email, number, long-text, select)
                            nestedData[nestedKey] =
                              item[itemKey]?.[nestedKey] || '';
                          }
                        },
                      );
                      itemData[itemKey] = nestedData;
                    }
                    // Handle image fields directly in array items
                    else if (
                      (itemDef as Field).type === 'image' ||
                      (itemDef as Field).type === 'image-set'
                    ) {
                      // Handle image fields directly in array items
                      if ((itemDef as Field).type === 'image-set') {
                        // Handle image sets (multiple images)
                        itemData[itemKey] = Array.isArray(item[itemKey])
                          ? item[itemKey]
                          : [];
                      } else {
                        // Handle single image
                        itemData[itemKey] = item[itemKey] || '';
                      }
                    }
                    // Handle simple fields (text, number, etc.) but skip if it's an object type
                    else if (
                      typeof itemDef === 'object' &&
                      'type' in itemDef &&
                      ((itemDef as { type: string }).type !== 'object' ||
                        (itemDef as { type: string }).type === 'long-text')
                    ) {
                      // Handle simple input fields (text, number, etc.)
                      itemData[itemKey] = item[itemKey] || '';
                    }
                    // Handle select fields with special dropdown case
                    else if ((itemDef as Field).type === 'select') {
                      itemData[itemKey] = item[itemKey] || '';
                      // Handle special case for dropdown type
                      if (itemKey === 'type' && item[itemKey] === 'dropdown') {
                        itemData.items = item.items || [];
                      }
                    }
                    // handle nested arrays (for dropdown emnus and generic arrays)
                    else if ((itemDef as Field).type === 'array') {
                      if (item.type === 'dropdown') {
                        // Handle dropdown-specific nested arrays with complex items
                        itemData[itemKey] = (item[itemKey] || []).map(
                          (subItem: any) => {
                            const subItemData: Record<string, any> = {};
                            Object.entries(
                              (itemDef as Field).items || {},
                            ).forEach(([subItemKey, subItemDef]) => {
                              subItemData[subItemKey] =
                                subItem[subItemKey] || '';
                            });
                            return subItemData;
                          },
                        );
                      } else {
                        // Handle generic nested arrays (like features)
                        itemData[itemKey] = item[itemKey] || [];
                      }
                    }
                    // Handle checkbox fields directly in array items
                    else if ((itemDef as Field).type === 'checkbox') {
                      itemData[itemKey] = !!item[itemKey];
                    } else {
                      // Handle regular fields
                      itemData[itemKey] = item[itemKey] || '';
                    }
                  },
                );

                return itemData;
              },
            );
          } else if (field.type === 'object') {
            // Handle object fields
            const objectData: Record<string, any> = {};
            const fieldAsField = field as Field; // Explicit type casting
            const allowMultiple = fieldAsField.allowMultiple !== false;

            if (!allowMultiple) {
              // Handle single instance objects (like footer.about)
              Object.entries(fieldAsField.fields || {}).forEach(
                ([subFieldId, subField]) => {
                  if ((subField as Field).type === 'array') {
                    // Handle arrays within objects
                    const arrayData =
                      formData[currentPage]?.[sectionId]?.[fieldId]?.[
                        subFieldId
                      ] || [];
                    objectData[subFieldId] = arrayData.map(
                      (item: any) => item || '',
                    );
                  } else if ((subField as Field).type === 'object') {
                    // Handle nested objects
                    const nestedData: Record<string, any> = {};
                    Object.entries((subField as Field).fields || {}).forEach(
                      ([nestedKey, nestedField]) => {
                        if ((nestedField as Field).type === 'array') {
                          // Handle arrays within nested objects
                          const arrayData =
                            formData[currentPage]?.[sectionId]?.[fieldId]?.[
                              subFieldId
                            ]?.[nestedKey] || [];
                          nestedData[nestedKey] = arrayData;
                        } else if ((nestedField as Field).type === 'object') {
                          // Handle deep nested objects
                          const deepNestedData: Record<string, any> = {};
                          Object.entries(
                            (nestedField as Field).fields || {},
                          ).forEach(([deepNestedFieldId, deepNestedField]) => {
                            const input = e.currentTarget.elements.namedItem(
                              `${sectionId}.${fieldId}.${subFieldId}.${nestedKey}.${deepNestedFieldId}`,
                            ) as HTMLInputElement;
                            deepNestedData[deepNestedFieldId] =
                              input?.value || '';
                          });
                          nestedData[nestedKey] = deepNestedData;
                        } else {
                          // Handle regular fields within nested objects
                          const input = e.currentTarget.elements.namedItem(
                            `${sectionId}.${fieldId}.${subFieldId}.${nestedKey}`,
                          ) as HTMLInputElement;
                          nestedData[nestedKey] = input?.value || '';
                        }
                      },
                    );
                    objectData[subFieldId] = nestedData;
                  } else if ((subField as Field).type === 'long-text') {
                    // Handle long-text fields
                    const input = e.currentTarget.elements.namedItem(
                      `${sectionId}.${fieldId}.${subFieldId}`,
                    ) as HTMLTextAreaElement;
                    objectData[subFieldId] = input?.value || '';
                  } else {
                    // Handle regular fields
                    const input = e.currentTarget.elements.namedItem(
                      `${sectionId}.${fieldId}.${subFieldId}`,
                    ) as HTMLInputElement;
                    objectData[subFieldId] = input?.value || '';
                  }
                },
              );
            } else {
              // Get all object instances
              Object.entries(
                formData[currentPage]?.[sectionId]?.[fieldId] || {},
              ).forEach(([objectId, objectInstance]) => {
                Object.entries(fieldAsField.fields || {}).forEach(
                  ([subFieldId, subField]) => {
                    if ((subField as Field).type === 'array') {
                      // Handle arrays within objects
                      const arrayData =
                        formData[currentPage]?.[sectionId]?.[fieldId]?.[
                          objectId
                        ]?.[subFieldId] || [];
                      objectData[subFieldId] = arrayData.map((item: any) => {
                        // Handle simple string values
                        return item || '';
                      });
                      console.log('Array within object data:', {
                        path: `${sectionId}.${fieldId}.${subFieldId}`,
                        data: arrayData,
                      });
                    } else if ((subField as Field).type === 'object') {
                      // Handle nested objects (like social_links in footer.about)
                      const nestedData: Record<string, any> = {};
                      Object.entries((subField as Field).fields || {}).forEach(
                        ([nestedKey, nestedField]) => {
                          if ((nestedField as Field).type === 'array') {
                            // Handle arrays within nested objects
                            const arrayData =
                              formData[currentPage]?.[sectionId]?.[fieldId]?.[
                                objectId
                              ]?.[subFieldId]?.[nestedKey] || [];
                            nestedData[nestedKey] = arrayData;
                          } else if ((nestedField as Field).type === 'object') {
                            // Handle deep nested objects
                            const deepNestedData: Record<string, any> = {};

                            Object.entries(
                              (nestedField as Field).fields || {},
                            ).forEach(
                              ([deepNestedFieldId, deepNestedField]) => {
                                if (
                                  (deepNestedField as Field).type === 'array'
                                ) {
                                  // Handle arrays within deep nested objects
                                  deepNestedData[deepNestedFieldId] =
                                    formData[currentPage]?.[sectionId]?.[
                                      fieldId
                                    ]?.[objectId]?.[subFieldId]?.[nestedKey]?.[
                                      deepNestedFieldId
                                    ] || [];
                                } else {
                                  // Handle regular fields within deep nested objects
                                  const deepNestedValue =
                                    formData[currentPage]?.[sectionId]?.[
                                      fieldId
                                    ]?.[objectId]?.[subFieldId]?.[nestedKey]?.[
                                      deepNestedFieldId
                                    ];
                                  deepNestedData[deepNestedFieldId] =
                                    deepNestedValue || '';
                                }
                              },
                            );
                            nestedData[nestedKey] = deepNestedData;
                          } else {
                            // Handle regular fields within nested objects
                            const nestedInput =
                              e.currentTarget.elements.namedItem(
                                `${sectionId}.${fieldId}.${objectId}.${subFieldId}.${nestedKey}`,
                              ) as HTMLInputElement;
                            nestedData[nestedKey] = nestedInput?.value || '';
                          }
                        },
                      );
                      objectData[subFieldId] = nestedData;
                    } else if ((subField as Field).type === 'long-text') {
                      // Handle long-text fields within objects
                      const textareaInput = e.currentTarget.elements.namedItem(
                        `${sectionId}.${fieldId}.${objectId}.${subFieldId}`,
                      ) as HTMLTextAreaElement;
                      objectData[subFieldId] = textareaInput?.value || '';
                    } else {
                      // Handle direct fields within object (like description in footer.about)
                      const input = e.currentTarget.elements.namedItem(
                        `${sectionId}.${fieldId}.${objectId}.${subFieldId}`,
                      ) as HTMLInputElement;
                      objectData[subFieldId] = input?.value || '';
                    }
                  },
                );
              });
            }

            // Update the page data with the object field values
            pageData[sectionId][fieldId] = objectData;
          } else {
            // Handle regular fields (keep existing logic)
            const formValue = (e.currentTarget as HTMLFormElement)[
              `${sectionId}.${fieldId}`
            ]?.value;
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
                description:
                  updatedFormData.home?.hero?.subtitle ||
                  'My Website Description',
                author: 'Anonymous',
                createdAt: new Date().toISOString(),
                ...updatedFormData,
              },
            });

            console.log('Response received:', websiteResponse.data);

            const buildData = websiteResponse.data.data;

            if (buildData?.buildPath) {
              router.push(
                `/create-website/${params.themeId}/success?buildPath=${encodeURIComponent(buildData.buildPath)}`,
              );
            } else {
              console.error(
                'Invalid response structure:',
                websiteResponse.data,
              );
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
              message: errorMessage,
            });
            setError(`Failed to generate website: ${errorMessage}`);
          } else {
            console.error('Unexpected error:', error);
            setError(
              'An unexpected error occurred while generating the website',
            );
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

  // Update the getStepIcon function with all page types
  const getStepIcon = (page: string) => {
    const icons = {
      global: IoSettingsOutline,
      home: HiOutlineHome,
      about: FiInfo,
      facilities: FaRegBuilding,
      team: RiTeamLine,
      testimonial: IoChatboxEllipsesOutline,
      appointment: IoCalendarOutline,
      call_to_action: IoMegaphoneOutline,
      contact: LuContact,
      gallery: GrGallery,
      terms_of_service: FaRegHandshake,
      privacy_policy: MdOutlinePrivacyTip,
      mandatory_disclosure: LiaClipboardListSolid,
      admission: RiUserAddLine,
      tc: PiCertificate,
    };
    return icons[page as keyof typeof icons] || HiTemplate;
  };

  // Modify the form field rendering to include image upload components
  const renderField = (sectionId: string, fieldId: string, field: Field) => {
    console.log('Rendering field:', {
      sectionId,
      fieldId,
      fieldType: field.type,
      fieldLabel: field.label,
      hasFields: field.fields ? Object.keys(field.fields).length : 0,
    });

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
      className:
        'w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900',
    };

    switch (field.type) {
      case 'short-text':
      case 'email':
      case 'url':
      case 'number':
      case 'date':
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
            {field.options?.map((option) => (
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
              {(formData[currentPage]?.[sectionId]?.[fieldId] || [{}]).map(
                (item: any, index: number) => (
                  <div
                    key={index}
                    className="p-6 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-gray-700">
                        {field.label || 'Item'} {index + 1}
                      </span>
                      {(formData[currentPage]?.[sectionId]?.[fieldId] || [])
                        .length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [
                              ...(formData[currentPage]?.[sectionId]?.[
                                fieldId
                              ] || []),
                            ];
                            newItems.splice(index, 1);
                            setFormData({
                              ...formData,
                              [currentPage]: {
                                ...formData[currentPage],
                                [sectionId]: {
                                  ...formData[currentPage]?.[sectionId],
                                  [fieldId]: newItems,
                                },
                              },
                            });
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {typeof field.items === 'object' &&
                      'type' in field.items &&
                      (field.items as unknown as Field).type === 'object' &&
                      'fields' in field.items &&
                      field.items.fields && (
                        <div className="space-y-3">
                          {Object.entries(
                            (
                              field.items as unknown as {
                                fields: Record<string, Field>;
                              }
                            ).fields,
                          ).map(([fieldKey, fieldDef]) => (
                            <div key={fieldKey} className="flex flex-col">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {(fieldDef as Field).label}
                              </label>
                              <input
                                type="text"
                                value={item[fieldKey] || ''}
                                onChange={(e) => {
                                  const newItems = [
                                    ...(formData[currentPage]?.[sectionId]?.[
                                      fieldId
                                    ] || []),
                                  ];
                                  newItems[index] = {
                                    ...newItems[index],
                                    [fieldKey]: e.target.value,
                                  };
                                  setFormData({
                                    ...formData,
                                    [currentPage]: {
                                      ...formData[currentPage],
                                      [sectionId]: {
                                        ...formData[currentPage]?.[sectionId],
                                        [fieldId]: newItems,
                                      },
                                    },
                                  });
                                }}
                                className="flex-1 px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`Enter ${(fieldDef as Field).label}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Render item fields */}
                    <div className="space-y-4">
                      {Object.entries(field.items || {}).map(
                        ([itemKey, itemDef]) => {
                          const inputId = `${sectionId}.${fieldId}.${index}.${itemKey}`;

                          if (!itemDef) return null;
                          if (
                            typeof itemDef === 'object' &&
                            'type' in itemDef
                          ) {
                            const typedItemDef = itemDef as ItemDefinition;

                            // Add handling for object type within array
                            if (typedItemDef.type === 'object') {
                              return (
                                <div
                                  key={itemKey}
                                  className="p-4 bg-white rounded-lg border border-gray-200"
                                >
                                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                                    {typedItemDef.label ||
                                      itemKey.charAt(0).toUpperCase() +
                                        itemKey.slice(1)}
                                  </label>
                                  <div className="space-y-3">
                                    {Object.entries(
                                      typedItemDef.fields || {},
                                    ).map(([fieldKey, fieldDef]) => (
                                      <div key={fieldKey} className="ml-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          {(fieldDef as Field).label}
                                        </label>
                                        {fieldDef.type === 'short-text' ||
                                        fieldDef.type === 'email' ||
                                        fieldDef.type === 'number' ||
                                        fieldDef.type === 'date' ? (
                                          <input
                                            type={
                                              fieldDef.type === 'short-text'
                                                ? 'text'
                                                : fieldDef.type
                                            }
                                            value={
                                              item[itemKey]?.[fieldKey] || ''
                                            }
                                            onChange={(e) => {
                                              const newItems = [
                                                ...(formData[currentPage]?.[
                                                  sectionId
                                                ]?.[fieldId] || []),
                                              ];
                                              newItems[index] = {
                                                ...newItems[index],
                                                [itemKey]: {
                                                  ...(newItems[index][
                                                    itemKey
                                                  ] || {}),
                                                  [fieldKey]: e.target.value,
                                                },
                                              };
                                              setFormData({
                                                ...formData,
                                                [currentPage]: {
                                                  ...formData[currentPage],
                                                  [sectionId]: {
                                                    ...formData[currentPage]?.[
                                                      sectionId
                                                    ],
                                                    [fieldId]: newItems,
                                                  },
                                                },
                                              });
                                            }}
                                            className="..."
                                            placeholder={`Enter ${fieldDef.label}`}
                                          />
                                        ) : fieldDef.type === 'long-text' ? (
                                          <textarea
                                            value={
                                              item[itemKey]?.[fieldKey] || ''
                                            }
                                            onChange={(e) => {
                                              const newItems = [
                                                ...(formData[currentPage]?.[
                                                  sectionId
                                                ]?.[fieldId] || []),
                                              ];
                                              newItems[index] = {
                                                ...newItems[index],
                                                [itemKey]: {
                                                  ...(newItems[index][
                                                    itemKey
                                                  ] || {}),
                                                  [fieldKey]: e.target.value,
                                                },
                                              };
                                              setFormData({
                                                ...formData,
                                                [currentPage]: {
                                                  ...formData[currentPage],
                                                  [sectionId]: {
                                                    ...formData[currentPage]?.[
                                                      sectionId
                                                    ],
                                                    [fieldId]: newItems,
                                                  },
                                                },
                                              });
                                            }}
                                            className="..."
                                            placeholder={`Enter ${fieldDef.label}`}
                                            rows={4}
                                          />
                                        ) : fieldDef.type === 'select' &&
                                          fieldDef.options ? (
                                          <select
                                            value={
                                              item[itemKey]?.[fieldKey] || ''
                                            }
                                            onChange={(e) => {
                                              const newItems = [
                                                ...(formData[currentPage]?.[
                                                  sectionId
                                                ]?.[fieldId] || []),
                                              ];
                                              newItems[index] = {
                                                ...newItems[index],
                                                [itemKey]: {
                                                  ...(newItems[index][
                                                    itemKey
                                                  ] || {}),
                                                  [fieldKey]: e.target.value,
                                                },
                                              };
                                              setFormData({
                                                ...formData,
                                                [currentPage]: {
                                                  ...formData[currentPage],
                                                  [sectionId]: {
                                                    ...formData[currentPage]?.[
                                                      sectionId
                                                    ],
                                                    [fieldId]: newItems,
                                                  },
                                                },
                                              });
                                            }}
                                            className="..."
                                          >
                                            {fieldDef.options.map((option) => (
                                              <option
                                                key={option}
                                                value={option}
                                              >
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        ) : fieldDef.type === 'checkbox' ? (
                                          <input
                                            type="checkbox"
                                            checked={
                                              !!item[itemKey]?.[fieldKey]
                                            }
                                            onChange={(e) => {
                                              const newItems = [
                                                ...(formData[currentPage]?.[
                                                  sectionId
                                                ]?.[fieldId] || []),
                                              ];
                                              newItems[index] = {
                                                ...newItems[index],
                                                [itemKey]: {
                                                  ...(newItems[index][
                                                    itemKey
                                                  ] || {}),
                                                  [fieldKey]: e.target.checked,
                                                },
                                              };
                                              setFormData({
                                                ...formData,
                                                [currentPage]: {
                                                  ...formData[currentPage],
                                                  [sectionId]: {
                                                    ...formData[currentPage]?.[
                                                      sectionId
                                                    ],
                                                    [fieldId]: newItems,
                                                  },
                                                },
                                              });
                                            }}
                                            className="..."
                                          />
                                        ) : fieldDef.type === 'image' ||
                                          fieldDef.type === 'image-set' ? (
                                          <ImageUploadField
                                            id={`${sectionId}.${fieldId}.${index}.${itemKey}.${fieldKey}`}
                                            field={fieldDef as ImageField}
                                            onUpload={async (
                                              file: File | null,
                                              fieldId: string,
                                              existingUrls?: string[],
                                            ) => {
                                              const uploadedUrl =
                                                await handleImageUpload(
                                                  file,
                                                  fieldId,
                                                  existingUrls,
                                                );
                                              if (uploadedUrl) {
                                                const newItems = [
                                                  ...(formData[currentPage]?.[
                                                    sectionId
                                                  ]?.[fieldId] || []),
                                                ];

                                                // intitalize the item if it doesn't exist
                                                if (!newItems[index]) {
                                                  newItems[index] = {};
                                                }

                                                // initialize the nested object if it doesn't exist
                                                if (!newItems[index][itemKey]) {
                                                  newItems[index][itemKey] = {};
                                                }
                                                newItems[index] = {
                                                  ...newItems[index],
                                                  [itemKey]: {
                                                    ...newItems[index][itemKey],
                                                    [fieldKey]:
                                                      fieldDef.type ===
                                                      'image-set'
                                                        ? [
                                                            ...(newItems[index][
                                                              itemKey
                                                            ]?.[fieldKey] ||
                                                              []),
                                                            uploadedUrl,
                                                          ]
                                                        : uploadedUrl,
                                                  },
                                                };
                                                setFormData({
                                                  ...formData,
                                                  [currentPage]: {
                                                    ...formData[currentPage],
                                                    [sectionId]: {
                                                      ...formData[
                                                        currentPage
                                                      ]?.[sectionId],
                                                      [fieldId]: newItems,
                                                    },
                                                  },
                                                });
                                              }
                                              return uploadedUrl;
                                            }}
                                            value={
                                              item[itemKey]?.[fieldKey] ||
                                              (fieldDef.type === 'image-set'
                                                ? []
                                                : '')
                                            }
                                            isUploading={
                                              uploadingImages[
                                                `${sectionId}.${fieldId}.${index}.${itemKey}.${fieldKey}`
                                              ]
                                            }
                                            schoolWebsiteId={website?.id || ''}
                                          />
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            // Keep existing array and select handling
                            if (typedItemDef.type === 'array') {
                              return (
                                <div key={itemKey} className="mt-4">
                                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {typedItemDef.label ||
                                      itemKey.charAt(0).toUpperCase() +
                                        itemKey.slice(1)}
                                  </label>
                                  <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                                    {/* Show nested items only if parent type is dropdown */}
                                    {item.type === 'dropdown' ? (
                                      <>
                                        {(item[itemKey] || []).map(
                                          (subItem: any, subIndex: number) => (
                                            <div
                                              key={subIndex}
                                              className="flex gap-4 items-start"
                                            >
                                              {Object.entries(
                                                typedItemDef.items || {},
                                              ).map(
                                                ([subItemKey, subItemDef]: [
                                                  string,
                                                  any,
                                                ]) => (
                                                  <div
                                                    key={subItemKey}
                                                    className="flex-1"
                                                  >
                                                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                                                      {subItemDef.label ||
                                                        subItemKey
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                          subItemKey.slice(1)}
                                                    </label>
                                                    <input
                                                      type="text"
                                                      value={
                                                        subItem[subItemKey] ||
                                                        ''
                                                      }
                                                      onChange={(e) => {
                                                        const newItems = [
                                                          ...(formData[
                                                            currentPage
                                                          ]?.[sectionId]?.[
                                                            fieldId
                                                          ] || []),
                                                        ];
                                                        if (
                                                          !newItems[index][
                                                            itemKey
                                                          ]
                                                        )
                                                          newItems[index][
                                                            itemKey
                                                          ] = [];
                                                        newItems[index][
                                                          itemKey
                                                        ][subIndex] = {
                                                          ...newItems[index][
                                                            itemKey
                                                          ][subIndex],
                                                          [subItemKey]:
                                                            e.target.value,
                                                        };
                                                        setFormData({
                                                          ...formData,
                                                          [currentPage]: {
                                                            ...formData[
                                                              currentPage
                                                            ],
                                                            [sectionId]: {
                                                              ...formData[
                                                                currentPage
                                                              ]?.[sectionId],
                                                              [fieldId]:
                                                                newItems,
                                                            },
                                                          },
                                                        });
                                                      }}
                                                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md 
                                                text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 
                                                focus:border-blue-500 shadow-sm"
                                                    />
                                                  </div>
                                                ),
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newItems = [
                                                    ...(formData[currentPage]?.[
                                                      sectionId
                                                    ]?.[fieldId] || []),
                                                  ];
                                                  newItems[index][
                                                    itemKey
                                                  ].splice(subIndex, 1);
                                                  setFormData({
                                                    ...formData,
                                                    [currentPage]: {
                                                      ...formData[currentPage],
                                                      [sectionId]: {
                                                        ...formData[
                                                          currentPage
                                                        ]?.[sectionId],
                                                        [fieldId]: newItems,
                                                      },
                                                    },
                                                  });
                                                }}
                                                className="text-red-500 hover:text-red-700 text-sm mt-6"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          ),
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newItems = [
                                              ...(formData[currentPage]?.[
                                                sectionId
                                              ]?.[fieldId] || []),
                                            ];
                                            if (!newItems[index][itemKey])
                                              newItems[index][itemKey] = [];
                                            newItems[index][itemKey].push({});
                                            setFormData({
                                              ...formData,
                                              [currentPage]: {
                                                ...formData[currentPage],
                                                [sectionId]: {
                                                  ...formData[currentPage]?.[
                                                    sectionId
                                                  ],
                                                  [fieldId]: newItems,
                                                },
                                              },
                                            });
                                          }}
                                          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                        >
                                          Add Item
                                        </button>
                                      </>
                                    ) : (
                                      // Handle generic nested arrays (like features)
                                      <>
                                        {(item[itemKey] || []).map(
                                          (value: string, subIndex: number) => (
                                            <div
                                              key={subIndex}
                                              className="flex gap-4 items-start"
                                            >
                                              <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => {
                                                  const newItems = [
                                                    ...(formData[currentPage]?.[
                                                      sectionId
                                                    ]?.[fieldId] || []),
                                                  ];
                                                  if (!newItems[index][itemKey])
                                                    newItems[index][itemKey] =
                                                      [];
                                                  newItems[index][itemKey][
                                                    subIndex
                                                  ] = e.target.value;
                                                  setFormData({
                                                    ...formData,
                                                    [currentPage]: {
                                                      ...formData[currentPage],
                                                      [sectionId]: {
                                                        ...formData[
                                                          currentPage
                                                        ]?.[sectionId],
                                                        [fieldId]: newItems,
                                                      },
                                                    },
                                                  });
                                                }}
                                                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md 
                                              text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 
                                              focus:border-blue-500 shadow-sm"
                                                placeholder={`Enter ${typedItemDef.label || itemKey}`}
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newItems = [
                                                    ...(formData[currentPage]?.[
                                                      sectionId
                                                    ]?.[fieldId] || []),
                                                  ];
                                                  newItems[index][
                                                    itemKey
                                                  ].splice(subIndex, 1);
                                                  setFormData({
                                                    ...formData,
                                                    [currentPage]: {
                                                      ...formData[currentPage],
                                                      [sectionId]: {
                                                        ...formData[
                                                          currentPage
                                                        ]?.[sectionId],
                                                        [fieldId]: newItems,
                                                      },
                                                    },
                                                  });
                                                }}
                                                className="text-red-500 hover:text-red-700 text-sm mt-2"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          ),
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newItems = [
                                              ...(formData[currentPage]?.[
                                                sectionId
                                              ]?.[fieldId] || []),
                                            ];
                                            if (!newItems[index][itemKey])
                                              newItems[index][itemKey] = [];
                                            newItems[index][itemKey].push('');
                                            setFormData({
                                              ...formData,
                                              [currentPage]: {
                                                ...formData[currentPage],
                                                [sectionId]: {
                                                  ...formData[currentPage]?.[
                                                    sectionId
                                                  ],
                                                  [fieldId]: newItems,
                                                },
                                              },
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

                            if (typedItemDef.type === 'select') {
                              return (
                                <div key={itemKey} className="mb-4">
                                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {typedItemDef.label ||
                                      itemKey.charAt(0).toUpperCase() +
                                        itemKey.slice(1)}
                                  </label>
                                  <select
                                    value={item[itemKey] || ''}
                                    onChange={(e) => {
                                      const newItems = [
                                        ...(formData[currentPage]?.[
                                          sectionId
                                        ]?.[fieldId] || []),
                                      ];
                                      newItems[index] = {
                                        ...newItems[index],
                                        [itemKey]: e.target.value,
                                        ...(itemKey === 'type' &&
                                        e.target.value === 'dropdown'
                                          ? { items: [] }
                                          : {}),
                                      };
                                      setFormData({
                                        ...formData,
                                        [currentPage]: {
                                          ...formData[currentPage],
                                          [sectionId]: {
                                            ...formData[currentPage]?.[
                                              sectionId
                                            ],
                                            [fieldId]: newItems,
                                          },
                                        },
                                      });
                                    }}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md 
                                  text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 
                                  focus:border-blue-500 shadow-sm"
                                  >
                                    <option value="" className="text-gray-500">
                                      Select {typedItemDef.label || itemKey}
                                    </option>
                                    {typedItemDef.options?.map(
                                      (option: string) => (
                                        <option
                                          key={option}
                                          value={option}
                                          className="text-gray-900"
                                        >
                                          {option.charAt(0).toUpperCase() +
                                            option.slice(1)}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>
                              );
                            }

                            // handle Image fields
                            if (
                              typedItemDef.type === 'image' ||
                              typedItemDef.type === 'image-set'
                            ) {
                              return (
                                <div key={itemKey} className="mb-4">
                                  <ImageUploadField
                                    id={`${sectionId}.${fieldId}.${index}.${itemKey}`}
                                    field={typedItemDef as ImageField}
                                    onUpload={async (
                                      file: File | null,
                                      fieldId: string,
                                      existingUrls?: string[],
                                    ) => {
                                      const uploadedUrl =
                                        await handleImageUpload(
                                          file,
                                          fieldId,
                                          existingUrls,
                                        );
                                      if (uploadedUrl) {
                                        const baseFieldId =
                                          fieldId.split('.')[1];
                                        const newItems = [
                                          ...(formData[currentPage]?.[
                                            sectionId
                                          ]?.[baseFieldId] || [{}]),
                                        ];

                                        newItems[index] = {
                                          ...newItems[index],
                                          [itemKey]:
                                            typedItemDef.type === 'image-set'
                                              ? [
                                                  ...(newItems[index][
                                                    itemKey
                                                  ] || []),
                                                  uploadedUrl,
                                                ]
                                              : uploadedUrl,
                                        };

                                        setFormData((prevFormData) => {
                                          const newFormData = {
                                            ...prevFormData,
                                            [currentPage]: {
                                              ...prevFormData[currentPage],
                                              [sectionId]: {
                                                ...prevFormData[currentPage]?.[
                                                  sectionId
                                                ],
                                                [baseFieldId]: newItems,
                                              },
                                            },
                                          };

                                          return newFormData;
                                        });
                                      }
                                      return uploadedUrl;
                                    }}
                                    value={
                                      item[itemKey] ||
                                      (typedItemDef.type === 'image-set'
                                        ? []
                                        : '')
                                    }
                                    isUploading={
                                      uploadingImages[
                                        `${sectionId}.${fieldId}.${index}.${itemKey}`
                                      ]
                                    }
                                    schoolWebsiteId={website?.id || ''}
                                  />
                                </div>
                              );
                            }

                            // handle long text fields
                            if (typedItemDef.type === 'long-text') {
                              return (
                                <div key={itemKey} className="mb-4">
                                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {typedItemDef.label ||
                                      itemKey.charAt(0).toUpperCase() +
                                        itemKey.slice(1)}
                                  </label>
                                  <textarea
                                    value={item[itemKey] || ''}
                                    onChange={(e) => {
                                      const newItems = [
                                        ...(formData[currentPage]?.[
                                          sectionId
                                        ]?.[fieldId] || []),
                                      ];
                                      newItems[index] = {
                                        ...newItems[index],
                                        [itemKey]: e.target.value,
                                      };
                                      setFormData({
                                        ...formData,
                                        [currentPage]: {
                                          ...formData[currentPage],
                                          [sectionId]: {
                                            ...formData[currentPage]?.[
                                              sectionId
                                            ],
                                            [fieldId]: newItems,
                                          },
                                        },
                                      });
                                    }}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md 
                                      text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 
                                      focus:border-blue-500 shadow-sm min-h-[100px]"
                                    placeholder={`Enter ${typedItemDef.label || itemKey}`}
                                  />
                                </div>
                              );
                            }

                            // Add handling for date type
                            if (typedItemDef.type === 'date') {
                              return (
                                <div key={itemKey} className="mb-4">
                                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {typedItemDef.label ||
                                      itemKey.charAt(0).toUpperCase() +
                                        itemKey.slice(1)}
                                  </label>
                                  <input
                                    type="date"
                                    value={item[itemKey] || ''}
                                    onChange={(e) => {
                                      const newItems = [
                                        ...(formData[currentPage]?.[
                                          sectionId
                                        ]?.[fieldId] || []),
                                      ];
                                      newItems[index] = {
                                        ...newItems[index],
                                        [itemKey]: e.target.value,
                                      };
                                      setFormData({
                                        ...formData,
                                        [currentPage]: {
                                          ...formData[currentPage],
                                          [sectionId]: {
                                            ...formData[currentPage]?.[
                                              sectionId
                                            ],
                                            [fieldId]: newItems,
                                          },
                                        },
                                      });
                                    }}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md 
                                      text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 
                                      focus:border-blue-500 shadow-sm"
                                  />
                                </div>
                              );
                            }

                            // Handle simple fields (text, number, etc.)

                            // Handle simple fields (text, number, etc.) but skip if it's an object type
                            if (
                              typeof itemDef === 'object' &&
                              'type' in itemDef &&
                              (itemDef as { type: string }).type !== 'object'
                            ) {
                              return (
                                <div key={itemKey} className="mb-4">
                                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {(itemDef as Field).label ||
                                      itemKey.charAt(0).toUpperCase() +
                                        itemKey.slice(1)}
                                  </label>
                                  <input
                                    type={
                                      (itemDef as Field).type === 'date'
                                        ? 'date'
                                        : 'text'
                                    }
                                    value={item[itemKey] || ''}
                                    onChange={(e) => {
                                      const newItems = [
                                        ...(formData[currentPage]?.[
                                          sectionId
                                        ]?.[fieldId] || []),
                                      ];
                                      newItems[index] = {
                                        ...newItems[index],
                                        [itemKey]: e.target.value,
                                      };
                                      setFormData({
                                        ...formData,
                                        [currentPage]: {
                                          ...formData[currentPage],
                                          [sectionId]: {
                                            ...formData[currentPage]?.[
                                              sectionId
                                            ],
                                            [fieldId]: newItems,
                                          },
                                        },
                                      });
                                    }}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md 
                                  text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 
                                  focus:border-blue-500 shadow-sm"
                                    placeholder={`Enter ${(itemDef as Field).label}`}
                                  />
                                </div>
                              );
                            }
                            return null;
                          }

                          // Handle simple fields (text, number, etc.)

                          // Handle simple fields (text, number, etc.) but skip if it's an object type
                          if (
                            typeof itemDef === 'object' &&
                            'type' in itemDef &&
                            (itemDef as { type: string }).type !== 'object'
                          ) {
                            return (
                              <div key={itemKey} className="mb-4">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                  {(itemDef as Field).label ||
                                    itemKey.charAt(0).toUpperCase() +
                                      itemKey.slice(1)}
                                </label>
                                <input
                                  type={
                                    (itemDef as Field).type === 'date'
                                      ? 'date'
                                      : 'text'
                                  }
                                  value={item[itemKey] || ''}
                                  onChange={(e) => {
                                    const newItems = [
                                      ...(formData[currentPage]?.[sectionId]?.[
                                        fieldId
                                      ] || []),
                                    ];
                                    newItems[index] = {
                                      ...newItems[index],
                                      [itemKey]: e.target.value,
                                    };
                                    setFormData({
                                      ...formData,
                                      [currentPage]: {
                                        ...formData[currentPage],
                                        [sectionId]: {
                                          ...formData[currentPage]?.[sectionId],
                                          [fieldId]: newItems,
                                        },
                                      },
                                    });
                                  }}
                                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md 
                                text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 
                                focus:border-blue-500 shadow-sm"
                                  placeholder={`Enter ${(itemDef as Field).label}`}
                                />
                              </div>
                            );
                          }
                          return null;
                        },
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* Add Item button for array fields */}
            <button
              type="button"
              onClick={() => {
                const currentItems =
                  formData[currentPage]?.[sectionId]?.[fieldId] || [];
                const newItems = [...currentItems, {}];
                setFormData({
                  ...formData,
                  [currentPage]: {
                    ...formData[currentPage],
                    [sectionId]: {
                      ...formData[currentPage]?.[sectionId],
                      [fieldId]: newItems,
                    },
                  },
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
        const allowMultiple = (field as Field).allowMultiple !== false;
        const objectEntries = allowMultiple
          ? Object.entries(formData[currentPage]?.[sectionId]?.[fieldId] || {})
          : [['single', formData[currentPage]?.[sectionId]?.[fieldId] || {}]];

        return (
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
            {objectEntries.map(([objectId, objectData]) => (
              <div
                key={objectId}
                className={`${allowMultiple ? 'mb-6 p-4 border-t border-gray-300' : ''}`}
              >
                {/* Remove button for each object instance */}
                {allowMultiple && (
                  <div className="flex justify-end mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prevData) => {
                          const newState = structuredClone(prevData);

                          if (
                            newState[currentPage] &&
                            newState[currentPage][sectionId] &&
                            newState[currentPage][sectionId][fieldId]
                          ) {
                            delete newState[currentPage][sectionId][fieldId][
                              objectId
                            ];
                          }

                          return newState;
                        });
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {Object.entries(field.fields || {}).map(
                  ([subFieldId, subField]) => (
                    <div key={subFieldId} className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">
                        {(subField as Field).label}
                      </label>
                      {(subField as Field).type === 'object' ? (
                        <div className="pl-4 space-y-4 border-l-2 border-blue-100 bg-gray-50 rounded-lg p-4">
                          {Object.entries((subField as Field).fields || {}).map(
                            ([nestedFieldId, nestedField]) => (
                              <div key={nestedFieldId} className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800">
                                  {(nestedField as Field).label}
                                </label>
                                {(nestedField as Field).type === 'array' ? (
                                  <div className="space-y-4">
                                    {(
                                      formData[currentPage]?.[sectionId]?.[
                                        fieldId
                                      ]?.[objectId]?.[subFieldId]?.[
                                        nestedFieldId
                                      ] || []
                                    ).map((item: any, index: number) => (
                                      <div
                                        key={item.id || index}
                                        className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                                      >
                                        {/*Array item fields*/}
                                        <div className="flex items-center gap-2 w-full">
                                          <textarea
                                            value={item || ''}
                                            onChange={(e) => {
                                              const newFields = [
                                                ...(formData[currentPage]?.[
                                                  sectionId
                                                ]?.[fieldId]?.[objectId]?.[
                                                  subFieldId
                                                ]?.[nestedFieldId] || []),
                                              ];
                                              newFields[index] = e.target.value;
                                              setFormData({
                                                ...formData,
                                                [currentPage]: {
                                                  ...(formData[currentPage] ||
                                                    {}),
                                                  [sectionId]: {
                                                    ...(formData[currentPage]?.[
                                                      sectionId
                                                    ] || {}),
                                                    [fieldId]: {
                                                      ...(formData[
                                                        currentPage
                                                      ]?.[sectionId]?.[
                                                        fieldId
                                                      ] || {}),
                                                      [objectId]: {
                                                        ...(formData[
                                                          currentPage
                                                        ]?.[sectionId]?.[
                                                          fieldId
                                                        ]?.[objectId] || {}),
                                                        [subFieldId]: {
                                                          ...(formData[
                                                            currentPage
                                                          ]?.[sectionId]?.[
                                                            fieldId
                                                          ]?.[objectId]?.[
                                                            subFieldId
                                                          ] || {}),
                                                          [nestedFieldId]:
                                                            newFields,
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              });
                                            }}
                                            className="flex-1 px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder={`Enter ${(nestedField as Field).label}`}
                                          />

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const parentObject =
                                                formData[currentPage]?.[
                                                  sectionId
                                                ]?.[fieldId]?.[objectId];
                                              const currentItems =
                                                parentObject?.[subFieldId]?.[
                                                  nestedFieldId
                                                ] || [];
                                              const newItems = [
                                                ...currentItems,
                                              ];
                                              newItems.splice(index, 1);

                                              setFormData((prevData) => ({
                                                ...prevData,
                                                [currentPage]: {
                                                  ...(prevData[currentPage] ||
                                                    {}),
                                                  [sectionId]: {
                                                    ...(prevData[currentPage]?.[
                                                      sectionId
                                                    ] || {}),
                                                    [fieldId]: {
                                                      ...(prevData[
                                                        currentPage
                                                      ]?.[sectionId]?.[
                                                        fieldId
                                                      ] || {}),
                                                      [objectId]: {
                                                        ...parentObject,
                                                        [subFieldId]: {
                                                          ...(parentObject?.[
                                                            subFieldId
                                                          ] || {}),
                                                          [nestedFieldId]:
                                                            newItems,
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              }));
                                            }}
                                            className="p-2.5 text-red-600 hover:text-red-700 bg-transparent transition-color duration-200 flex items-center justify-center"
                                            title="Remove item"
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-5 w-5"
                                              viewBox="0 0 20 20"
                                              fill="currentColor"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    ))}

                                    {/* Add new item button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('First button clicked');
                                        console.log({
                                          currentPage,
                                          sectionId,
                                          fieldId,
                                          objectId,
                                          subFieldId,
                                          nestedFieldId,
                                          currentFormData:
                                            formData[currentPage]?.[
                                              sectionId
                                            ]?.[fieldId]?.[objectId],
                                        });

                                        const parentObject =
                                          formData[currentPage]?.[sectionId]?.[
                                            fieldId
                                          ]?.[objectId];

                                        console.log('Before update:', {
                                          parentObject,
                                          currentItems:
                                            parentObject?.[subFieldId]?.[
                                              nestedFieldId
                                            ] || [],
                                          fullPath: `${currentPage}.${sectionId}.${fieldId}.${objectId}.${subFieldId}.${nestedFieldId}`,
                                        });
                                        const currentItems =
                                          parentObject?.[subFieldId]?.[
                                            nestedFieldId
                                          ] || [];
                                        const newItems = [...currentItems, ''];

                                        setFormData((prevData) => ({
                                          ...prevData,
                                          [currentPage]: {
                                            ...(prevData[currentPage] || {}),
                                            [sectionId]: {
                                              ...(prevData[currentPage]?.[
                                                sectionId
                                              ] || {}),
                                              [fieldId]: {
                                                ...(prevData[currentPage]?.[
                                                  sectionId
                                                ]?.[fieldId] || {}),
                                                [objectId]: {
                                                  ...parentObject,
                                                  [subFieldId]: {
                                                    ...(parentObject?.[
                                                      subFieldId
                                                    ] || {}),
                                                    [nestedFieldId]: newItems,
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        }));

                                        console.log('After update:', {
                                          parentObject,
                                          currentItems:
                                            parentObject?.[subFieldId]?.[
                                              nestedFieldId
                                            ] || [],
                                          fullPath: `${currentPage}.${sectionId}.${fieldId}.${objectId}.${subFieldId}.${nestedFieldId}`,
                                        });
                                      }}
                                      className="w-full px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200"
                                    >
                                      {`Add ${nestedField.label}`}
                                    </button>
                                  </div>
                                ) : (nestedField as Field).type === 'object' ? (
                                  // Handle object within nested object
                                  <div className="pl-4 space-y-4 border-l-2 border-blue-100 bg-gray-50 rounded-lg p-4">
                                    {Object.entries(
                                      (nestedField as Field).fields || {},
                                    ).map(
                                      ([
                                        deepNestedFieldId,
                                        deepNestedField,
                                      ]) => (
                                        <div
                                          key={deepNestedFieldId}
                                          className="space-y-2"
                                        >
                                          <label className="block text-sm font-semibold text-gray-800">
                                            {(deepNestedField as Field).label}
                                          </label>
                                          {(deepNestedField as Field).type ===
                                          'array' ? (
                                            // Handle array within deep nested object
                                            <div className="space-y-4">
                                              {(
                                                formData[currentPage]?.[
                                                  sectionId
                                                ]?.[fieldId]?.[objectId]?.[
                                                  subFieldId
                                                ]?.[nestedFieldId]?.[
                                                  deepNestedFieldId
                                                ] || []
                                              ).map(
                                                (item: any, index: number) => (
                                                  <div
                                                    key={item.id || index}
                                                    className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                                                  >
                                                    <div className="flex items-center gap-2 w-full">
                                                      <textarea
                                                        value={item || ''}
                                                        onChange={(e) => {
                                                          const newItems = [
                                                            ...(formData[
                                                              currentPage
                                                            ]?.[sectionId]?.[
                                                              fieldId
                                                            ]?.[objectId]?.[
                                                              subFieldId
                                                            ]?.[
                                                              nestedFieldId
                                                            ]?.[
                                                              deepNestedFieldId
                                                            ] || []),
                                                          ];
                                                          newItems[index] =
                                                            e.target.value;
                                                          setFormData({
                                                            ...formData,
                                                            [currentPage]: {
                                                              ...(formData[
                                                                currentPage
                                                              ] || {}),
                                                              [sectionId]: {
                                                                ...(formData[
                                                                  currentPage
                                                                ]?.[
                                                                  sectionId
                                                                ] || {}),
                                                                [fieldId]: {
                                                                  ...(formData[
                                                                    currentPage
                                                                  ]?.[
                                                                    sectionId
                                                                  ]?.[
                                                                    fieldId
                                                                  ] || {}),
                                                                  [objectId]: {
                                                                    ...(formData[
                                                                      currentPage
                                                                    ]?.[
                                                                      sectionId
                                                                    ]?.[
                                                                      fieldId
                                                                    ]?.[
                                                                      objectId
                                                                    ] || {}),
                                                                    [subFieldId]:
                                                                      {
                                                                        ...(formData[
                                                                          currentPage
                                                                        ]?.[
                                                                          sectionId
                                                                        ]?.[
                                                                          fieldId
                                                                        ]?.[
                                                                          objectId
                                                                        ]?.[
                                                                          subFieldId
                                                                        ] ||
                                                                          {}),
                                                                        [nestedFieldId]:
                                                                          {
                                                                            ...(formData[
                                                                              currentPage
                                                                            ]?.[
                                                                              sectionId
                                                                            ]?.[
                                                                              fieldId
                                                                            ]?.[
                                                                              objectId
                                                                            ]?.[
                                                                              subFieldId
                                                                            ]?.[
                                                                              nestedFieldId
                                                                            ] ||
                                                                              {}),
                                                                            [deepNestedFieldId]:
                                                                              newItems,
                                                                          },
                                                                      },
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          });
                                                        }}
                                                        className="flex-1 px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg"
                                                        placeholder={`Enter ${(deepNestedField as Field).label}`}
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const currentItems =
                                                            formData[
                                                              currentPage
                                                            ]?.[sectionId]?.[
                                                              fieldId
                                                            ]?.[objectId]?.[
                                                              subFieldId
                                                            ]?.[
                                                              nestedFieldId
                                                            ]?.[
                                                              deepNestedFieldId
                                                            ] || [];
                                                          const newItems = [
                                                            ...currentItems,
                                                          ];
                                                          newItems.splice(
                                                            index,
                                                            1,
                                                          );
                                                          setFormData({
                                                            ...formData,
                                                            [currentPage]: {
                                                              ...(formData[
                                                                currentPage
                                                              ] || {}),
                                                              [sectionId]: {
                                                                ...(formData[
                                                                  currentPage
                                                                ]?.[
                                                                  sectionId
                                                                ] || {}),
                                                                [fieldId]: {
                                                                  ...(formData[
                                                                    currentPage
                                                                  ]?.[
                                                                    sectionId
                                                                  ]?.[
                                                                    fieldId
                                                                  ] || {}),
                                                                  [objectId]: {
                                                                    ...(formData[
                                                                      currentPage
                                                                    ]?.[
                                                                      sectionId
                                                                    ]?.[
                                                                      fieldId
                                                                    ]?.[
                                                                      objectId
                                                                    ] || {}),
                                                                    [subFieldId]:
                                                                      {
                                                                        ...(formData[
                                                                          currentPage
                                                                        ]?.[
                                                                          sectionId
                                                                        ]?.[
                                                                          fieldId
                                                                        ]?.[
                                                                          objectId
                                                                        ]?.[
                                                                          subFieldId
                                                                        ] ||
                                                                          {}),
                                                                        [nestedFieldId]:
                                                                          {
                                                                            ...(formData[
                                                                              currentPage
                                                                            ]?.[
                                                                              sectionId
                                                                            ]?.[
                                                                              fieldId
                                                                            ]?.[
                                                                              objectId
                                                                            ]?.[
                                                                              subFieldId
                                                                            ]?.[
                                                                              nestedFieldId
                                                                            ] ||
                                                                              {}),
                                                                            [deepNestedFieldId]:
                                                                              newItems,
                                                                          },
                                                                      },
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          });
                                                        }}
                                                        className="text-red-600 hover:text-red-700"
                                                      >
                                                        <svg
                                                          xmlns="http://www.w3.org/2000/svg"
                                                          className="h-5 w-5"
                                                          viewBox="0 0 20 20"
                                                          fill="currentColor"
                                                        >
                                                          <path
                                                            fillRule="evenodd"
                                                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                            clipRule="evenodd"
                                                          />
                                                        </svg>
                                                      </button>
                                                    </div>
                                                  </div>
                                                ),
                                              )}

                                              {/* Add button for deep nested array */}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const currentItems =
                                                    formData[currentPage]?.[
                                                      sectionId
                                                    ]?.[fieldId]?.[objectId]?.[
                                                      subFieldId
                                                    ]?.[nestedFieldId]?.[
                                                      deepNestedFieldId
                                                    ] || [];
                                                  const newItems = [
                                                    ...currentItems,
                                                    '',
                                                  ];
                                                  setFormData({
                                                    ...formData,
                                                    [currentPage]: {
                                                      ...(formData[
                                                        currentPage
                                                      ] || {}),
                                                      [sectionId]: {
                                                        ...(formData[
                                                          currentPage
                                                        ]?.[sectionId] || {}),
                                                        [fieldId]: {
                                                          ...(formData[
                                                            currentPage
                                                          ]?.[sectionId]?.[
                                                            fieldId
                                                          ] || {}),
                                                          [objectId]: {
                                                            ...(formData[
                                                              currentPage
                                                            ]?.[sectionId]?.[
                                                              fieldId
                                                            ]?.[objectId] ||
                                                              {}),
                                                            [subFieldId]: {
                                                              ...(formData[
                                                                currentPage
                                                              ]?.[sectionId]?.[
                                                                fieldId
                                                              ]?.[objectId]?.[
                                                                subFieldId
                                                              ] || {}),
                                                              [nestedFieldId]: {
                                                                ...(formData[
                                                                  currentPage
                                                                ]?.[
                                                                  sectionId
                                                                ]?.[fieldId]?.[
                                                                  objectId
                                                                ]?.[
                                                                  subFieldId
                                                                ]?.[
                                                                  nestedFieldId
                                                                ] || {}),
                                                                [deepNestedFieldId]:
                                                                  newItems,
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  });
                                                }}
                                                className="w-full px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200"
                                              >
                                                {`Add ${(deepNestedField as Field).label}`}
                                              </button>
                                            </div>
                                          ) : (
                                            // Handle regular fields in deep nested object
                                            <input
                                              type="text"
                                              value={
                                                formData[currentPage]?.[
                                                  sectionId
                                                ]?.[fieldId]?.[objectId]?.[
                                                  subFieldId
                                                ]?.[nestedFieldId]?.[
                                                  deepNestedFieldId
                                                ] || ''
                                              }
                                              onChange={(e) => {
                                                setFormData({
                                                  ...formData,
                                                  [currentPage]: {
                                                    ...(formData[currentPage] ||
                                                      {}),
                                                    [sectionId]: {
                                                      ...(formData[
                                                        currentPage
                                                      ]?.[sectionId] || {}),
                                                      [fieldId]: {
                                                        ...(formData[
                                                          currentPage
                                                        ]?.[sectionId]?.[
                                                          fieldId
                                                        ] || {}),
                                                        [objectId]: {
                                                          ...(formData[
                                                            currentPage
                                                          ]?.[sectionId]?.[
                                                            fieldId
                                                          ]?.[objectId] || {}),
                                                          [subFieldId]: {
                                                            ...(formData[
                                                              currentPage
                                                            ]?.[sectionId]?.[
                                                              fieldId
                                                            ]?.[objectId]?.[
                                                              subFieldId
                                                            ] || {}),
                                                            [nestedFieldId]: {
                                                              ...(formData[
                                                                currentPage
                                                              ]?.[sectionId]?.[
                                                                fieldId
                                                              ]?.[objectId]?.[
                                                                subFieldId
                                                              ]?.[
                                                                nestedFieldId
                                                              ] || {}),
                                                              [deepNestedFieldId]:
                                                                e.target.value,
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                });
                                              }}
                                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                              placeholder={`Enter ${(deepNestedField as Field).label}`}
                                            />
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    id={`${sectionId}.${fieldId}.${subFieldId}.${nestedFieldId}`}
                                    name={`${sectionId}.${fieldId}.${subFieldId}.${nestedFieldId}`}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 
                                  text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 
                                  focus:border-blue-500 shadow-sm"
                                    placeholder={`Enter ${(nestedField as Field).label}`}
                                    defaultValue={
                                      formData[currentPage]?.[sectionId]?.[
                                        fieldId
                                      ]?.[subFieldId]?.[nestedFieldId]
                                    }
                                  />
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      ) : (subField as Field).type === 'array' ? (
                        // Handle array within object
                        <div className="space-y-4">
                          {/* Show existing fields */}
                          {(
                            formData[currentPage]?.[sectionId]?.[fieldId]?.[
                              objectId
                            ]?.[subFieldId] || []
                          ).map((item: any, index: number) => (
                            <div
                              key={item.id || index}
                              className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                            >
                              <div className="flex items-center gap-2 w-full">
                                <textarea
                                  value={item.name || ''}
                                  onChange={(e) => {
                                    const newFields = [
                                      ...(formData[currentPage]?.[sectionId]?.[
                                        fieldId
                                      ]?.[objectId]?.[subFieldId] || []),
                                    ];
                                    newFields[index] = e.target.value;

                                    setFormData({
                                      ...formData,
                                      [currentPage]: {
                                        ...(formData[currentPage] || {}),
                                        [sectionId]: {
                                          ...(formData[currentPage]?.[
                                            sectionId
                                          ] || {}),
                                          [fieldId]: {
                                            ...(formData[currentPage]?.[
                                              sectionId
                                            ]?.[fieldId] || {}),
                                            [objectId]: {
                                              ...(formData[currentPage]?.[
                                                sectionId
                                              ]?.[fieldId]?.[objectId] || {}),
                                              [subFieldId]: newFields,
                                            },
                                          },
                                        },
                                      },
                                    });
                                  }}
                                  placeholder={`Enter ${subField.label}`}
                                  className="flex-1 px-4 py-2.5 text-gray-900 bg-white border border-gray-300 
                                                rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                                placeholder-gray-400"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData((prevData) => {
                                      const newFields = [
                                        ...(formData[currentPage]?.[
                                          sectionId
                                        ]?.[fieldId]?.[objectId]?.[
                                          subFieldId
                                        ] || []),
                                      ];
                                      newFields.splice(index, 1);

                                      return {
                                        ...prevData,
                                        [currentPage]: {
                                          ...(prevData[currentPage] || {}),
                                          [sectionId]: {
                                            ...(prevData[currentPage]?.[
                                              sectionId
                                            ] || {}),
                                            [fieldId]: {
                                              ...(prevData[currentPage]?.[
                                                sectionId
                                              ]?.[fieldId] || {}),
                                              [objectId]: {
                                                ...(prevData[currentPage]?.[
                                                  sectionId
                                                ]?.[fieldId]?.[objectId] || {}),
                                                [subFieldId]: newFields,
                                              },
                                            },
                                          },
                                        },
                                      };
                                    });
                                  }}
                                  className=" text-red-600 hover:text-red-700 
                                      bg-transparent 
                                      transition-colors duration-200 flex items-center justify-center"
                                  title="Remove field"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add new field button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              console.log('Second button clicked');
                              e.preventDefault();
                              e.stopPropagation();

                              //Get the specific parent object
                              const parentObject =
                                formData[currentPage]?.[sectionId]?.[fieldId]?.[
                                  objectId
                                ];
                              const currentFields =
                                parentObject?.[subFieldId] || [];

                              const newFields = [...currentFields, ''];

                              setFormData({
                                ...formData,
                                [currentPage]: {
                                  ...(formData[currentPage] || {}),
                                  [sectionId]: {
                                    ...(formData[currentPage]?.[sectionId] ||
                                      {}),
                                    [fieldId]: {
                                      ...(formData[currentPage]?.[sectionId]?.[
                                        fieldId
                                      ] || {}),
                                      [objectId]: {
                                        ...parentObject,
                                        [subFieldId]: newFields,
                                      },
                                    },
                                  },
                                },
                              });
                            }}
                            className="w-full px-4 py-2.5 text-sm font-medium text-blue-600 
                      bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200
                      transition-colors duration-200"
                          >
                            {`Add ${subField.label}`}
                          </button>
                        </div>
                      ) : (
                        <div>
                          {(subField as Field).type === 'long-text' ? (
                            <textarea
                              id={`${sectionId}.${fieldId}.${subFieldId}`}
                              name={`${sectionId}.${fieldId}.${subFieldId}`}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 
                        text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 
                        focus:border-blue-500 shadow-sm"
                              rows={4}
                              placeholder={`Enter ${(subField as Field).label}`}
                              defaultValue={
                                formData[currentPage]?.[sectionId]?.[fieldId]?.[
                                  subFieldId
                                ]
                              }
                            />
                          ) : (subField as Field).type === 'date' ? (
                            <input
                              type="date"
                              id={`${sectionId}.${fieldId}.${subFieldId}`}
                              name={`${sectionId}.${fieldId}.${subFieldId}`}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 
                      text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 
                      focus:border-blue-500 shadow-sm"
                              defaultValue={
                                formData[currentPage]?.[sectionId]?.[fieldId]?.[
                                  subFieldId
                                ]
                              }
                            />
                          ) : (
                            <input
                              type="text"
                              id={`${sectionId}.${fieldId}.${subFieldId}`}
                              name={`${sectionId}.${fieldId}.${subFieldId}`}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 
                      text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 
                      focus:border-blue-500 shadow-sm"
                              placeholder={`Enter ${(subField as Field).label}`}
                              defaultValue={
                                formData[currentPage]?.[sectionId]?.[fieldId]?.[
                                  subFieldId
                                ]
                              }
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            ))}

            {allowMultiple && (
              <button
                type="button"
                onClick={() => {
                  console.log('Outer button clicked');
                  const newObjectId = `item_${Date.now()}`;
                  // Create new object with empty values for all fields
                  const newObject: Record<string, any> = {};
                  Object.entries(field.fields || {}).forEach(([key, value]) => {
                    if ((value as Field).type === 'array') {
                      newObject[key] = [];
                    } else if ((value as Field).type === 'object') {
                      newObject[key] = {};
                    } else {
                      newObject[key] = '';
                    }
                  });

                  setFormData((prevData) => {
                    const newstate = structuredClone(prevData);
                    return {
                      ...newstate,
                      [currentPage]: {
                        ...(newstate[currentPage] || {}),
                        [sectionId]: {
                          ...(newstate[currentPage]?.[sectionId] || {}),
                          [fieldId]: {
                            ...(newstate[currentPage]?.[sectionId]?.[fieldId] ||
                              {}),
                            [newObjectId]: newObject,
                          },
                        },
                      },
                    };
                  });
                }}
                className="w-full mt-4 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 
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
            )}
          </div>
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
  const ObjectField = ({
    sectionId,
    fieldId,
    field,
    renderField,
  }: ObjectFieldProps) => {
    return (
      <div className="space-y-4 p-6 bg-white border border-gray-200 rounded-lg">
        {field.fields &&
          Object.entries(field.fields).map(([key, subField]) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
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
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Theme Not Found
            </h2>
            <p className="mt-2 text-gray-600">
              The requested theme could not be found.
            </p>
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-blue-500 to-purple-600 animate-gradient-x">
              Customize {theme.name}
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Personalize your website design and content
            </p>
          </div>

          {/* Progress Indicator - Remove scrolling, expand container */}
          <div className="mb-12 bg-white rounded-xl p-8 shadow-sm w-full">
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm font-semibold text-gray-700">
                Customizing:{' '}
                <span className="text-blue-600">{currentPageData.title}</span>
              </span>
              <span className="text-sm font-medium text-gray-700 bg-blue-50 px-4 py-1.5 rounded-full">
                Step{' '}
                {Object.keys(theme.metadata.pages).indexOf(currentPage) + 1} of{' '}
                {Object.keys(theme.metadata.pages).length}
              </span>
            </div>

            <div className="relative w-full">
              {/* Progress bar background */}
              <div
                className="absolute left-0 w-full h-1 bg-gray-200"
                style={{ top: '24px' }}
              ></div>

              {/* Active progress bar */}
              <div
                className="absolute h-1 bg-blue-500 transition-all duration-300"
                style={{
                  top: '24px',
                  left: 0,
                  width: `${(Object.keys(theme.metadata.pages).indexOf(currentPage) / (Object.keys(theme.metadata.pages).length - 1)) * 100}%`,
                }}
              ></div>

              {/* Steps - Removed min-width and text labels */}
              <div className="relative z-10 flex justify-between w-full">
                {Object.entries(theme.metadata.pages).map(
                  ([pageId, page], index) => {
                    const StepIcon = getStepIcon(pageId);
                    const isActive =
                      index <=
                      Object.keys(theme.metadata.pages).indexOf(currentPage);
                    const isCurrent = pageId === currentPage;

                    return (
                      <div key={pageId} className="flex flex-col items-center">
                        <div
                          className={`
                          w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 
                          ${
                            isActive
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                              : 'bg-white border-2 border-gray-200 text-gray-400'
                          }
                          ${isCurrent ? 'ring-4 ring-blue-100' : ''}
                        `}
                        >
                          <StepIcon size={24} />
                        </div>
                        {/* Removed the page title text */}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>

          {/* Page Navigation - Single line with smaller text */}
          <div className="flex items-center mb-8 bg-white p-2 rounded-lg shadow-sm w-full overflow-x-auto scrollbar-thin">
            <div className="flex space-x-2 min-w-max">
              {' '}
              {/* Added wrapper div */}
              {Object.entries(theme.metadata.pages).map(([pageId, page]) => (
                <button
                  key={pageId}
                  onClick={() => setCurrentPage(pageId)}
                  className={`px-3 py-1.5 rounded-lg text-md font-medium transition-all duration-200 whitespace-nowrap
                    ${
                      currentPage === pageId
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    } ${pageId === 'global' ? 'mr-auto' : ''}`}
                >
                  {pageId === 'global'
                    ? 'Global Settings'
                    : page.title.replace(' Page', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Form - Modern styling */}
          <form onSubmit={handleSubmit}>
            {Object.entries(currentPageData.sections).map(
              ([sectionId, section]) => (
                <div
                  key={sectionId}
                  className="bg-white shadow-sm rounded-xl p-8 mb-8 border border-gray-100 hover:shadow-md transition-shadow duration-200"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    {section.title}
                  </h3>
                  <div className="space-y-6">
                    {Object.entries(section.fields).map(([fieldId, field]) => {
                      console.log('Field being processed:', {
                        sectionId,
                        fieldId,
                        type: field.type,
                        label: field.label,
                      });

                      return (
                        <div key={fieldId} className="relative">
                          <label
                            htmlFor={`${sectionId}.${fieldId}`}
                            className="block text-sm font-semibold text-gray-800 mb-2"
                          >
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>

                          {/* Handle all field types through renderField */}
                          {renderField(sectionId, fieldId, field)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
            )}

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
