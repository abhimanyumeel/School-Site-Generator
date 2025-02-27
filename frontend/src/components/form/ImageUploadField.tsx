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
          <div key={index} className="relative w-48 h-48 group">
            <Image
              src={preview}
              alt={`Preview ${index + 1}`}
              fill
              className="object-cover rounded-lg"
              onError={() => setError('Failed to load preview')}
            />
            {field.type === 'image-set' && (
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white 
                         opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {(previews.length === 0 || field.type === 'image-set') && (
          <div className="w-48">
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
              className="relative flex flex-col items-center justify-center h-48 
                        border-2 border-dashed border-gray-300 rounded-lg 
                        bg-white hover:bg-gray-50 transition-all duration-200 
                        cursor-pointer group"
            >
              {isUploading ? (
                // Loading State
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"/>
                  <span className="text-sm text-gray-500">Uploading...</span>
                </div>
              ) : (
                // Upload State
                <div className="flex flex-col items-center space-y-2 p-6">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center 
                                group-hover:scale-110 transition-transform duration-200">
                    <svg 
                      className="w-6 h-6 text-blue-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-500">
                      {field.type === 'image-set' ? 'Add Images' : 'Choose Image'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      SVG, PNG, JPG
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>
        )}
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
