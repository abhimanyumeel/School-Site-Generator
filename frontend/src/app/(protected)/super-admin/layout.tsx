'use client';

import { useAuth } from '@/contexts/auth-context';
import RoleGuard from '@/components/guards/role-guard';
import SuperAdminSidebar from '@/components/super-admin/SuperAdminSidebar';
import SuperAdminHeader from '@/components/super-admin/SuperAdminHeader';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="min-h-screen bg-gray-100">
        <SuperAdminSidebar />
        <div className="lg:pl-64">
          <SuperAdminHeader />
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}