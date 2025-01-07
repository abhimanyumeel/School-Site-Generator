import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getApiUrl } from '@/lib/axios';


interface Field {
  type: string;
  label: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  description?: string;
  allowedTypes?: string[];
}

interface ImageField extends Field {
  type: 'image' | 'image-set';
  ratio?: string;
  showCroppingTool?: boolean;
  minWidth?: number;
  minHeight?: number;
}

interface ImageUploadFieldProps {
  id: string;
  field: ImageField;
  onUpload: (file: File | null, fieldId: string, urls?: string[]) => Promise<string | null>;
  value?: string;
  isUploading?: boolean;
  schoolWebsiteId?: string;
}

export default function ImageUploadField({
  id,
  field,
  onUpload,
  value,
  isUploading,
  schoolWebsiteId,
}: ImageUploadFieldProps) {
  // Update state when value prop changes
  const [previews, setPreviews] = useState<string[]>(() => {
    if (!value) return [];
    return Array.isArray(value) 
      ? value.map(url => `${getApiUrl()}${url}`)
      : [`${getApiUrl()}${value}`];
  });
  
  const [urls, setUrls] = useState<string[]>(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });

  // Add useEffect to update state when value changes
  useEffect(() => {
    if (value) {
      setPreviews(
        Array.isArray(value)
          ? value.map(url => `${getApiUrl()}${url}`)
          : [`${getApiUrl()}${value}`]
      );
      setUrls(Array.isArray(value) ? value : [value]);
    } else {
      setPreviews([]);
      setUrls([]);
    }
  }, [value]);
  
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const filesToProcess = field.type === 'image-set' ? files : [files[0]];

    try {
      setError(null);

      for (const file of filesToProcess) {
        // File validations...
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
          setError('Please upload image files only');
          return;
        }

        if (field.allowedTypes && !field.allowedTypes.includes(file.type)) {
          setError(`Allowed file types: ${field.allowedTypes.join(', ')}`);
          return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          setError('File size must be less than 5MB');
          return;
        }

        // Dimension validations if needed...
        if (field.minWidth || field.minHeight) {
          const img = new (window.Image as { new(): HTMLImageElement })();
          const objectUrl = URL.createObjectURL(file);
          
          try {
            await new Promise<void>((resolve, reject) => {
              img.onload = () => {
                if (
                  (field.minWidth && img.width < field.minWidth) ||
                  (field.minHeight && img.height < field.minHeight)
                ) {
                  reject(new Error(`Image must be at least ${field.minWidth}x${field.minHeight} pixels`));
                }
                resolve();
              };
              img.onerror = () => reject(new Error('Failed to load image'));
              img.src = objectUrl;
            });
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Invalid image dimensions');
            return;
          } finally {
            URL.revokeObjectURL(objectUrl);
          }
        }

        // Upload the file
        const uploadedUrl = await onUpload(file, id);
        if (uploadedUrl) {
          if (field.type === 'image-set') {
            // For image sets, append to existing arrays
            setPreviews(prev => [...prev, `${getApiUrl()}${uploadedUrl}`]);
            setUrls(prev => [...prev, uploadedUrl]);
          } else {
            // For single images, replace existing arrays
            setPreviews([`${getApiUrl()}${uploadedUrl}`]);
            setUrls([uploadedUrl]);
          }
        }
      }
    } catch (error) {
      setError('Failed to upload image');
      console.error('Upload error:', error);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (field.type === 'image-set') {
      const newUrls = urls.filter((_, i) => i !== index);
      setPreviews(prev => prev.filter((_, i) => i !== index));
      setUrls(newUrls);
      onUpload(null, id, newUrls);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-4">
        {previews.map((preview, index) => (
          <div key={index} className="relative w-32 h-32 group">
            <Image
              src={preview}
              alt={`Preview ${index + 1}`}
              fill
              className="object-cover rounded-lg"
              onError={() => setError('Failed to load preview')}
            />
            {field.type === 'image-set' && (
              <button
                type="button" // Add this to prevent form submission
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 
                         group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        <div className="flex-1">
          <input
            type="file"
            accept={field.allowedTypes?.join(',') || 'image/*'}
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
            id={`file-${id}`}
            multiple={field.type === 'image-set'}
          />
          <label
            htmlFor={`file-${id}`}
            className={`
              inline-flex items-center px-4 py-2 border border-gray-300 
              rounded-md shadow-sm text-sm font-medium text-gray-700 
              bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-blue-500 cursor-pointer
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isUploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              `${field.type === 'image-set' ? 'Add Images' : 'Choose File'}`
            )}
          </label>
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {field.description && <p className="mt-1 text-sm text-gray-500">{field.description}</p>}
      {field.minWidth && field.minHeight && (
        <p className="mt-1 text-sm text-gray-500">
          Minimum dimensions: {field.minWidth}x{field.minHeight} pixels
        </p>
      )}
    </div>
  );
}
