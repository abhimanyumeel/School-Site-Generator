'use client';

import { useState, useEffect } from 'react';

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

  // Update form data when initialData changes
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

  // Fixed handleInputChange to properly update nested objects
  const handleInputChange = (path: string, value: string) => {
    setFormData((prev: any) => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      // Navigate to the nested object
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      // Set the value
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6">
      {isEdit && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Description of Changes *
          </label>
          <textarea
            value={changeDescription}
            onChange={(e) => setChangeDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     text-gray-900 text-base"
            placeholder="Describe the changes you're making..."
            required={isEdit}
            rows={4}
          />
        </div>
      )}

      {Object.entries(formData).map(([section, fields]: [string, any]) => (
        <div key={section} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 capitalize">
            {section.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          <div className="space-y-6">
            {Object.entries(fields).map(([field, fieldData]: [string, any]) => {
              if (typeof fieldData === 'object' && fieldData !== null) {
                return (
                  <div key={field} className="border-l-4 border-blue-200 pl-4 py-2 bg-gray-50 rounded-r-lg">
                    <h4 className="font-semibold mb-4 text-gray-800 capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <div className="grid gap-6">
                      {Object.entries(fieldData).map(([subField, value]: [string, any]) => (
                        <div key={`${field}-${subField}`}>
                          <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                            {subField.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => handleInputChange(`${section}.${field}.${subField}`, e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                     bg-white shadow-sm text-gray-900 text-base font-normal"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type="text"
                    value={fieldData || ''}
                    onChange={(e) => handleInputChange(`${section}.${field}`, e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             bg-white shadow-sm text-gray-900 text-base font-normal"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 
                   text-white rounded-lg hover:from-blue-700 hover:to-purple-700 
                   disabled:opacity-50 shadow-lg transform transition-transform 
                   hover:scale-105 active:scale-95 font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </form>
  );
}
