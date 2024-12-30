'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';

// Import our new components
import Navbar from '@/components/layout/Navbar';
import WelcomeSection from '@/components/home/WelcomeSection';
import WebsitesGrid from '@/components/home/WebsitesGrid';
import Breadcrumb from '@/components/layout/Breadcrumb';
import QuickActions from '@/components/home/QuickActions';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  entityType: string;
  entityId: string;
}

export default function AuthenticatedHome() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await axios.get('/auth/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

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
          <Breadcrumb items={[]} />
          <QuickActions />
          <WelcomeSection />
          <WebsitesGrid />
        </div>
      </main>
    </div>
  );
}