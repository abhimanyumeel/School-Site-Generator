'use client';

import { useState, useEffect } from 'react';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { Tooltip } from '@/components/ui/Tooltip';
import Image from 'next/image';
import axios from '@/lib/axios';

interface WebsiteFormProps {
  initialData: any;
  onSave: (formData: any, changeDescription: string) => Promise<void>;
  isEdit?: boolean;
  schoolWebsiteId?: string;
}

export default function WebsiteForm({ 
  initialData, 
  onSave, 
  isEdit = false,
  schoolWebsiteId 
}: WebsiteFormProps) {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [changeDescription, setChangeDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSave(formData, changeDescription);
      setChangeDescription('');
    } catch (error) {
      setError('Failed to save changes');
      console.error('Form submission error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (path: string, value: string) => {
    setFormData((prev: any) => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const isImageField = (fieldName: string, value: any) => {
    const imageKeywords = ['image', 'logo', 'photo', 'picture', 'banner', 'background'];
    return (
      imageKeywords.some(keyword => fieldName.toLowerCase().includes(keyword)) ||
      (typeof value === 'string' && value.startsWith('/static/uploads/'))
    );
  };

  return (
    
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
      {isEdit && (
        <div className="bg-indigo-200 rounded-xl p-8 shadow-sm border border-gray-400 hover:shadow-xl">
          <div className="relative group">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Description of Changes *
            </label>
            <textarea
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              className="w-full px-5 py-4 rounded-lg  bg-white
                       transition-all duration-200 resize-none
                       hover:border-indigo-300
                       text-gray-900
                       placeholder-gray-400"
              placeholder="Describe your changes..."
              required={isEdit}
              rows={4}
            />
          </div>
        </div>
      )}

      {Object.entries(formData).map(([section, fields]: [string, any]) => (
        <div key={section} 
          className="bg-indigo-200 rounded-xl p-8 shadow-sm border border-gray-400 hover:shadow-xl">
          <h3 className="text-xl font-semibold mb-8 text-gray-900 capitalize">
            {section.replace(/([A-Z])/g, ' $1').trim()}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(fields).map(([field, fieldData]: [string, any]) => {
              const fieldType = isImageField(field, fieldData) ? 'image' : 'text';
              
              if (typeof fieldData === 'object' && fieldData !== null) {
                return (
                  <div key={field} className="col-span-full">
                    <div className="bg-white rounded-md p-6 border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-4 capitalize flex items-center">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="space-y-6">
                        {Object.entries(fieldData).map(([subField, value]: [string, any]) => (
                          <FormField
                            key={`${field}-${subField}`}
                            label={subField}
                            value={value}
                            path={`${section}.${field}.${subField}`}
                            onChange={handleInputChange}
                            fieldType={isImageField(subField, value) ? 'image' : 'text'}
                            schoolWebsiteId={schoolWebsiteId}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <FormField
                  key={field}
                  label={field}
                  value={fieldData}
                  path={`${section}.${field}`}
                  onChange={handleInputChange}
                  fieldType={fieldType}
                  schoolWebsiteId={schoolWebsiteId}
                />
              );
            })}
          </div>
        </div>
      ))}

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-4 bg-indigo-600 text-white rounded-lg 
                   disabled:opacity-50 transition-all duration-200
                   hover:bg-indigo-700 hover:shadow-xl
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isSaving ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                   xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" 
                        stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving Changes...
            </span>
          ) : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="fixed bottom-4 left-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-up shadow-lg">
          <p className="text-red-600 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                    clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </form>
  );
}

// FormField Component
interface FormFieldProps {
  label: string;
  value: string;
  path: string;
  onChange: (path: string, value: string) => void;
  fieldType?: 'text' | 'image';
  schoolWebsiteId?: string;
}

function FormField({ 
  label, 
  value, 
  path, 
  onChange,
  fieldType = 'text',
  schoolWebsiteId
}: FormFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      const formData = new FormData();
      formData.append('file', file);

      const [section, ...fieldParts] = path.split('.');
      const fieldId = fieldParts.join('.');
      
      formData.append('section', section);
      formData.append('fieldId', fieldId);
      if (schoolWebsiteId) {
        formData.append('schoolWebsiteId', schoolWebsiteId);
      }

      const response = await axios.post('/upload', formData);
      onChange(path, response.data.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Add validation for image src
  const isValidImageSrc = (src: string | null | undefined): boolean => {
    return Boolean(src && typeof src === 'string' && src.length > 0);
  };
  console.log('value foroundv',value)


  if (fieldType === 'image') {
    
    return (
      <div className="relative group">
        <label className="block text-sm font-medium mb-2 text-gray-500 capitalize">
          {label.replace(/([A-Z])/g, ' $1').trim()}
        </label>
        <div className="space-y-4">
          {/* Only render Image component if value is valid */}
          {isValidImageSrc(value) && (
            <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={value}
                alt={label || 'Image preview'}
                fill
                className="object-contain"
                onError={(e) => {
                  console.error('Image failed to load:', value);
                  // Optionally set a fallback image
                  // e.currentTarget.src = '/path/to/fallback-image.jpg';
                }}
              />
              <button
                type="button"
                onClick={() => onChange(path, '')}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full 
                         hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-5 py-4 rounded-lg border border-gray-300
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-indigo-50 file:text-indigo-700
                     hover:file:bg-indigo-100"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              </div>
            )}
          </div>
          {uploadError && (
            <p className="text-sm text-red-600">{uploadError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <label className="block text-sm font-medium mb-2 text-gray-500 
                     transition-transform duration-200 group-focus-within:-translate-y-6 
                     group-focus-within:text-sm capitalize">
        {label.replace(/([A-Z])/g, ' $1').trim()}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => {
            onChange(path, e.target.value);
          }}
          className={`
            w-full px-5 py-4 rounded-md border bg-transparent
            transition-all duration-200
            hover:border-indigo-300
            placeholder-gray-400 
            border-gray-300 text-gray-900
          `}
        />
      </div>
    </div>
  );
}
