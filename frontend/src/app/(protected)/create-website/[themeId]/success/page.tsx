'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from '@/lib/axios';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { HiDownload, HiEye, HiCheck, HiArrowLeft, HiExternalLink } from 'react-icons/hi';

interface User {
  name: string;
  email: string;
  role: string;
}

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);

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
    const buildPath = searchParams.get('buildPath');
    if (!buildPath) {
      router.push('/create-website');
      return;
    }
    setDownloadUrl(`/api/download?path=${encodeURIComponent(buildPath)}`);
    setPreviewUrl(`/api/preview?path=${encodeURIComponent(buildPath)}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Create Website', href: '/create-website' },
            { label: 'Success', href: '#' },
          ]}
        />

        <div className="max-w-4xl mx-auto mt-8">
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            {/* Success Icon */}
            <div className="mb-8 flex justify-center">
              <div 
                className="bg-green-100 rounded-full p-4 text-green-500 animate-[scale-in_0.5s_ease-out]"
                style={{
                  animation: 'scale-in 0.5s ease-out, bounce 1s ease-in-out 0.5s'
                }}
              >
                <HiCheck size={48} />
              </div>
            </div>

            <style jsx global>{`
              @keyframes scale-in {
                from {
                  transform: scale(0);
                  opacity: 0;
                }
                to {
                  transform: scale(1);
                  opacity: 1;
                }
              }

              @keyframes bounce {
                0%, 100% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.1);
                }
              }
            `}</style>

            {/* Success Message */}
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Website Generated Successfully! 🎉
              </h1>
              <p className="text-lg text-gray-600">
                Your website has been created and is ready for preview and download.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              <button
                onClick={() => window.open(previewUrl, '_blank')}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <HiEye size={20} />
                <span>Preview Website</span>
                <HiExternalLink size={16} />
              </button>

              <a
                href={downloadUrl}
                download
                className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <HiDownload size={20} />
                <span>Download Files</span>
              </a>
            </div>

            {/* Next Steps Card */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 rounded-full p-1 text-blue-600">
                  <HiCheck size={20} />
                </span>
                Next Steps
              </h2>
              <div className="space-y-4">
                {[
                  'Preview your generated website to ensure everything looks perfect',
                  'Download the website files to your computer',
                  'Extract the downloaded ZIP file',
                  'Upload the files to your web hosting service',
                  'Configure your domain settings if needed',
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-gray-600">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <HiArrowLeft size={20} />
              Back to Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
