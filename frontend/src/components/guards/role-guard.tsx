'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: ('SUPER_ADMIN' | 'SINGLE_SCHOOL' | 'SCHOOL_ORGANIZATION')[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) { //only check after initial auth state is loaded
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user && !allowedRoles.includes(user.role)) {
                // Redirect based on role
                if (user.role === 'SUPER_ADMIN') {
                    router.push('/super-admin/dashboard');
                } else {
                    router.push('/home');
                }
            }
        }
    }, [isLoading, isAuthenticated, user, router, allowedRoles]);

    // Show nothing while loading
    if (isLoading) {
        return null;
    }

    // Show nothing if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    // Show nothing if user doesn't have required role
    if (!user || !allowedRoles.includes(user.role)) {
        return null;
    }

    // If all checks pass, render the protected content
    return <>{children}</>;
}
