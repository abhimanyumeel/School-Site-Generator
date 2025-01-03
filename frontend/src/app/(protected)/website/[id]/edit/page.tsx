'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from '@/lib/axios';
import Navbar from '@/components/layout/Navbar';
import Breadcrumb from '@/components/layout/Breadcrumb';
import WebsiteForm from '@/components/website/WebsiteForm';
import VersionHistory from '@/components/website/VersionHistory';

interface Version {
  id: string;
  versionNumber: number;
  createdAt: string;
  changeDescription: string;
  isActive: boolean;
  data: Record<string, any>;
}

interface Website {
  id: string;
  data: Record<string, any>;
  currentVersion: number;
  themeId: string;
}

interface User {
  name: string;
  email: string;
  role: string;
}

export default function EditWebsitePage() {
  const params = useParams();
  const [website, setWebsite] = useState<Website | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [websiteResponse, versionsResponse, userResponse] = await Promise.all([
          axios.get(`/websites/${params.id}`),
          axios.get(`/websites/${params.id}/versions`),
          axios.get('/auth/profile'),
        ]);

        console.log('Website Data:', websiteResponse.data);
        console.log('Website Data.data:', websiteResponse.data.data);
        
        setWebsite(websiteResponse.data);
        setVersions(versionsResponse.data || []); // Handle empty versions array
        setUser(userResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load website data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

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

  const handleSaveChanges = async (formData: any, changeDescription: string) => {
    try {
      await axios.post(`/websites/${params.id}/versions`, {
        data: formData,
        changeDescription
      });
      
      // Refresh both website and versions data
      const [websiteRes, versionsRes] = await Promise.all([
        axios.get(`/websites/${params.id}`),
        axios.get(`/websites/${params.id}/versions`)
      ]);
      
      setWebsite(websiteRes.data);
      setVersions(versionsRes.data);
    } catch (error) {
      console.error('Failed to save changes:', error);
      setError('Failed to save changes');
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    try {
      await axios.post(`/websites/${params.id}/versions/${versionId}/activate`);
      
      // Refresh both website and versions data
      const [websiteRes, versionsRes] = await Promise.all([
        axios.get(`/websites/${params.id}`),
        axios.get(`/websites/${params.id}/versions`)
      ]);
      
      setWebsite(websiteRes.data);
      setVersions(versionsRes.data);
    } catch (error) {
      console.error('Failed to activate version:', error);
      setError('Failed to activate version');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/home' },
            { label: 'Edit Website', href: '#' }
          ]}
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main editing area - wider space for the form */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Edit Website
              </h1>
            </div>
            
            {website && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <WebsiteForm
                  initialData={website.data}
                  onSave={handleSaveChanges}
                  isEdit={true}
                />
              </div>
            )}
          </div>

          {/* Version history sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <VersionHistory
                versions={versions}
                onActivate={handleActivateVersion}
                currentData={website?.data || {}}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}