'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import Navbar from '@/components/layout/Navbar';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ThemeGrid from '@/components/website/ThemeGrid';

interface Theme {
  id: string;
  name: string;
  previewPath: string;
}

interface User {
  name: string;
  email: string;
  role: string;
}

export default function CreateWebsite() {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

    const fetchThemes = async () => {
      try {
        const response = await axios.get('/themes');
        setThemes(response.data.data);
      } catch (error) {
        console.error('Failed to fetch themes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThemes();
  }, []);

  const handleThemeSelect = (themeId: string) => {
    router.push(`/create-website/${themeId}/customize`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Breadcrumb 
            items={[
              { label: 'Home', href: '/' },
              { label: 'Create Website', href: '#' }
            ]} 
          />
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Choose a Theme</h1>
            <p className="mt-2 text-sm text-gray-600">
              Select a theme to start creating your website. You can customize it in the next step.
            </p>
          </div>
          <ThemeGrid themes={themes} onSelect={handleThemeSelect} />
        </div>
      </main>
    </div>
  );
}
