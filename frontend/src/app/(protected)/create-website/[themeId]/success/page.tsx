'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  useEffect(() => {
    const buildPath = searchParams.get('buildPath');
    if (!buildPath) {
      router.push('/create-website');
      return;
    }
    // Convert buildPath to download URL
    setDownloadUrl(`/api/download?path=${encodeURIComponent(buildPath)}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-8">
            <svg
              className="mx-auto h-16 w-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 48 48"
            >
              <circle className="opacity-25" cx="24" cy="24" r="20" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm-4 29.95L10.05 24l2.829-2.828L20 28.293l15.121-15.121 2.829 2.828L20 34.95z"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Website Generated Successfully!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your website has been generated and is ready for download.
          </p>

          <div className="space-y-4">
            <a
              href={downloadUrl}
              className="inline-block w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              download
            >
              Download Website
            </a>

            <div className="mt-6">
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Next Steps:</h2>
            <ul className="text-left text-gray-600 space-y-2">
              <li>1. Download your generated website</li>
              <li>2. Extract the downloaded files</li>
              <li>3. Upload the files to your web hosting service</li>
              <li>4. Configure your domain settings if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
