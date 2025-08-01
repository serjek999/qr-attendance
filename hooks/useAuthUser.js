"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

export const useAuthUser = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadUserFromDatabase = useCallback(async () => {
        try {
            const storedUser = localStorage.getItem('currentUser');

            if (!storedUser) {
                setLoading(false);
                return;
            }

            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            // For now, just use the stored user data without refreshing from database
            // This avoids potential database connection issues during initial load
            toast({
                title: "Welcome Back!",
                description: `Hello ${parsedUser.full_name || parsedUser.first_name}! 👋`,
            });
        } catch (error) {
            console.error('Error in loadUserFromDatabase:', error);
            localStorage.removeItem('currentUser');
        } finally {
            setLoading(false);
        }
    }, [router]);

    const logout = useCallback(() => {
        localStorage.removeItem('currentUser');
        setUser(null);
        router.push('/auth');

        toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
        });
    }, [router]);

    useEffect(() => {
        loadUserFromDatabase();
    }, [loadUserFromDatabase]);

    return {
        user,
        loading,
        logout,
        loadUserFromDatabase
    };
}; 