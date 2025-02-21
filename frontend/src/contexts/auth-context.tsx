'use client'

import {createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'SINGLE_SCHOOL' | 'SCHOOL_ORGANIZATION';
    websitesLimit: number;
    websitesCreated: number;
    isActive: boolean;
    lastLoginAt: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children}: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for token and user data in localStorage on initial load
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Error parsing user data:', error);
                logout(); // Clear invalid data
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (token: string, userData: User) => {
        try {
            console.log('Starting login process...');
            
            // Store token and user data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Set the token in cookie with proper attributes
            document.cookie = `token=${token}; path=/; max-age=86400; samesite=lax`;
            
            console.log('Stored token and user data');
            console.log('User role:', userData.role);
            console.log('Cookie set:', document.cookie);

            // Update state
            setUser(userData);
            console.log('Updated user state');
        
            // Redirect based on role
            const redirectPath = userData.role === 'SUPER_ADMIN' 
                ? '/super-admin/dashboard' 
                : '/home';
            
            console.log('Redirecting to:', redirectPath);
            
            // Use replace instead of href to prevent back navigation
            window.location.replace(redirectPath);
            
        } catch (error) {
            console.error('Login process error:', error);
        }
    };

    const logout = () => {
        try {
            console.log('Starting logout process...');
            
            // Clear stored data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Clear the cookie
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            
            // Clear user state
            setUser(null);
            
            console.log('Cleared all auth data');
            
            // Force a hard redirect to login page using replace
            window.location.replace('/login');
            
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
