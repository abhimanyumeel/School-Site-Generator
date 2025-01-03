'use client';

import { useState, useEffect } from 'react';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { Tooltip } from '@/components/ui/Tooltip';

interface WebsiteFormProps {
  initialData: any;
  onSave: (formData: any, changeDescription: string) => Promise<void>;
  isEdit?: boolean;
}

export default function WebsiteForm({ 
  initialData, 
  onSave, 
  isEdit = false 
}: WebsiteFormProps) {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [changeDescription, setChangeDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validFields, setValidFields] = useState<Set<string>>(new Set());

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

  const validateField = (value: string, path: string) => {
    if (value && value.length > 0) {
      setValidFields(prev => new Set(prev).add(path));
    } else {
      setValidFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(path);
        return newSet;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
      {isEdit && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg 
                     border border-gray-100 dark:border-gray-700 transition-all duration-300">
          <div className="relative group">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300
                           transition-transform duration-200 group-focus-within:-translate-y-6 
                           group-focus-within:text-sm">
              Description of Changes *
            </label>
            <textarea
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border bg-transparent
                       transition-all duration-200 resize-none
                       dark:bg-gray-900 dark:text-white
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                       hover:border-indigo-300 dark:hover:border-indigo-400
                       placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Describe your changes..."
              required={isEdit}
              rows={4}
            />
          </div>
        </div>
      )}

      {Object.entries(formData).map(([section, fields]: [string, any]) => (
        <div key={section} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg 
                   border border-gray-100 dark:border-gray-700
                   hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-semibold mb-8 inline-block
                       bg-gradient-to-r from-indigo-600 to-purple-600 
                       bg-clip-text text-transparent capitalize">
            {section.replace(/([A-Z])/g, ' $1').trim()}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(fields).map(([field, fieldData]: [string, any]) => {
              if (typeof fieldData === 'object' && fieldData !== null) {
                return (
                  <div key={field} className="col-span-full">
                    <div className="bg-gradient-to-r from-indigo-50/30 to-transparent 
                                dark:from-indigo-900/20 dark:to-transparent
                                rounded-xl p-6 border-l-4 border-indigo-400">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4 capitalize flex items-center">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                        <Tooltip content="Nested field group">
                          <span className="ml-2 text-gray-400 hover:text-indigo-500 transition-colors duration-200">
                            <HiOutlineInformationCircle size={20} />
                          </span>
                        </Tooltip>
                      </h4>
                      <div className="space-y-6">
                        {Object.entries(fieldData).map(([subField, value]: [string, any]) => (
                          <FormField
                            key={`${field}-${subField}`}
                            label={subField}
                            value={value}
                            path={`${section}.${field}.${subField}`}
                            onChange={handleInputChange}
                            isValid={validFields.has(`${section}.${field}.${subField}`)}
                            onValidate={validateField}
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
                  isValid={validFields.has(`${section}.${field}`)}
                  onValidate={validateField}
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
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 
                   text-white rounded-xl disabled:opacity-50 
                   transform transition-all duration-200
                   hover:translate-y-[-2px] hover:shadow-lg hover:shadow-indigo-500/25
                   active:translate-y-[0px] active:shadow-sm
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
        <div className="fixed bottom-4 left-4 p-4 bg-red-50 dark:bg-red-900/50
                     border border-red-200 dark:border-red-800 rounded-xl 
                     animate-slide-up shadow-lg">
          <p className="text-red-600 dark:text-red-400 flex items-center">
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
function FormField({ 
  label, 
  value, 
  path, 
  onChange, 
  isValid, 
  onValidate 
}: { 
  label: string;
  value: string;
  path: string;
  onChange: (path: string, value: string) => void;
  isValid: boolean;
  onValidate: (value: string, path: string) => void;
}) {
  return (
    <div className="relative group">
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300
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
            onValidate(e.target.value, path);
          }}
          className={`
            w-full px-5 py-4 rounded-xl border bg-transparent
            transition-all duration-200
            dark:bg-gray-900 dark:text-white
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            hover:border-indigo-300 dark:hover:border-indigo-400
            placeholder-gray-400 dark:placeholder-gray-500
            ${isValid ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'}
          `}
        />
        {isValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xl animate-scale-in">
            <IoCheckmarkCircle size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
