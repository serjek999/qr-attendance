"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { Users, GraduationCap, Shield, Calendar } from 'lucide-react';

const StatsCards = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalFaculty: 0,
        totalSBOs: 0,
        todayAttendance: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch counts from different tables
                const [studentsResult, facultyResult, sboResult, attendanceResult] = await Promise.all([
                    supabase.from('students').select('*', { count: 'exact' }),
                    supabase.from('faculty').select('*', { count: 'exact' }),
                    supabase.from('sbo_officers').select('*', { count: 'exact' }),
                    supabase.from('attendance_records').select('*', { count: 'exact' })
                        .eq('date', new Date().toISOString().split('T')[0])
                ]);

                setStats({
                    totalStudents: studentsResult.count || 0,
                    totalFaculty: facultyResult.count || 0,
                    totalSBOs: sboResult.count || 0,
                    todayAttendance: attendanceResult.count || 0
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        {
            title: "Total Students",
            value: stats.totalStudents,
            icon: Users,
            color: "bg-blue-500",
            textColor: "text-blue-600"
        },
        {
            title: "Total Faculty",
            value: stats.totalFaculty,
            icon: GraduationCap,
            color: "bg-green-500",
            textColor: "text-green-600"
        },
        {
            title: "SBO Officers",
            value: stats.totalSBOs,
            icon: Shield,
            color: "bg-purple-500",
            textColor: "text-purple-600"
        },
        {
            title: "Today's Attendance",
            value: stats.todayAttendance,
            icon: Calendar,
            color: "bg-orange-500",
            textColor: "text-orange-600"
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 animate-pulse">
                        <div className="h-4 bg-white/20 rounded w-3/4 mb-4"></div>
                        <div className="h-8 bg-white/20 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/70">{card.title}</p>
                            <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
                        </div>
                        <div className={`p-3 rounded-full ${card.color} bg-opacity-20`}>
                            <card.icon className={`h-6 w-6 ${card.textColor.replace('600', '400')}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsCards; 