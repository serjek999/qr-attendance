"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

export const useAttendanceStats = () => {
    const [stats, setStats] = useState({
        today: {
            total: 0,
            present: 0,
            rate: 0
        },
        week: {
            total: 0,
            present: 0,
            rate: 0
        },
        month: {
            total: 0,
            present: 0,
            rate: 0
        }
    });
    const [tribeStats, setTribeStats] = useState([]);
    const [loading, setLoading] = useState(true);

    const calculateDateRange = useCallback((period) => {
        const today = new Date();
        const startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(today.getMonth() - 1);
                break;
            default:
                return today.toISOString().split('T')[0];
        }

        return {
            start: startDate.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
        };
    }, []);

    const fetchStats = useCallback(async (period = 'today') => {
        try {
            setLoading(true);

            if (period === 'today') {
                const today = new Date().toISOString().split('T')[0];

                // Get total students
                const { data: students, error: studentsError } = await supabase
                    .from('students')
                    .select('id');

                if (studentsError) throw studentsError;

                // Get today's attendance
                const { data: attendance, error: attendanceError } = await supabase
                    .from('attendance_records')
                    .select('student_id')
                    .eq('date', today);

                if (attendanceError) throw attendanceError;

                const total = students.length;
                const present = attendance.length;
                const rate = total > 0 ? (present / total) * 100 : 0;

                setStats(prev => ({
                    ...prev,
                    today: { total, present, rate: Math.round(rate) }
                }));
            } else {
                const { start, end } = calculateDateRange(period);

                // Get total students
                const { data: students, error: studentsError } = await supabase
                    .from('students')
                    .select('id');

                if (studentsError) throw studentsError;

                // Get attendance for the period
                const { data: attendance, error: attendanceError } = await supabase
                    .from('attendance_records')
                    .select('student_id, date')
                    .gte('date', start)
                    .lte('date', end);

                if (attendanceError) throw attendanceError;

                const total = students.length;
                const uniqueAttendees = new Set(attendance.map(a => a.student_id));
                const present = uniqueAttendees.size;
                const rate = total > 0 ? (present / total) * 100 : 0;

                setStats(prev => ({
                    ...prev,
                    [period]: { total, present, rate: Math.round(rate) }
                }));
            }
        } catch (error) {
            console.error(`Error fetching ${period} stats:`, error);
        } finally {
            setLoading(false);
        }
    }, [calculateDateRange]);

    const fetchTribeStats = useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Get all tribes
            const { data: tribes, error: tribesError } = await supabase
                .from('tribes')
                .select('*');

            if (tribesError) throw tribesError;

            // Get today's attendance
            const { data: attendance, error: attendanceError } = await supabase
                .from('attendance_records')
                .select('student_id')
                .eq('date', today);

            if (attendanceError) throw attendanceError;

            const todayAttendees = new Set(attendance.map(a => a.student_id));

            // Calculate stats for each tribe
            const tribesWithStats = await Promise.all(
                tribes.map(async (tribe) => {
                    const { data: tribeStudents, error: studentsError } = await supabase
                        .from('students')
                        .select('id')
                        .eq('tribe_id', tribe.id);

                    if (studentsError) throw studentsError;

                    const totalMembers = tribeStudents.length;
                    const presentToday = tribeStudents.filter(student =>
                        todayAttendees.has(student.id)
                    ).length;

                    const attendanceRate = totalMembers > 0 ? (presentToday / totalMembers) * 100 : 0;

                    return {
                        ...tribe,
                        totalMembers,
                        presentToday,
                        attendanceRate: Math.round(attendanceRate)
                    };
                })
            );

            // Sort by attendance rate (descending)
            tribesWithStats.sort((a, b) => b.attendanceRate - a.attendanceRate);
            setTribeStats(tribesWithStats);
        } catch (error) {
            console.error('Error fetching tribe stats:', error);
        }
    }, []);

    const fetchWeeklyStats = useCallback(async () => {
        const { start, end } = calculateDateRange('week');

        try {
            // Get total students
            const { data: students, error: studentsError } = await supabase
                .from('students')
                .select('id');

            if (studentsError) throw studentsError;

            // Get attendance for the week
            const { data: attendance, error: attendanceError } = await supabase
                .from('attendance_records')
                .select('student_id, date')
                .gte('date', start)
                .lte('date', end);

            if (attendanceError) throw attendanceError;

            const total = students.length;
            const uniqueAttendees = new Set(attendance.map(a => a.student_id));
            const present = uniqueAttendees.size;
            const rate = total > 0 ? (present / total) * 100 : 0;

            setStats(prev => ({
                ...prev,
                week: { total, present, rate: Math.round(rate) }
            }));
        } catch (error) {
            console.error('Error fetching weekly stats:', error);
        }
    }, [calculateDateRange]);

    const fetchMonthlyStats = useCallback(async () => {
        const { start, end } = calculateDateRange('month');

        try {
            // Get total students
            const { data: students, error: studentsError } = await supabase
                .from('students')
                .select('id');

            if (studentsError) throw studentsError;

            // Get attendance for the month
            const { data: attendance, error: attendanceError } = await supabase
                .from('attendance_records')
                .select('student_id, date')
                .gte('date', start)
                .lte('date', end);

            if (attendanceError) throw attendanceError;

            const total = students.length;
            const uniqueAttendees = new Set(attendance.map(a => a.student_id));
            const present = uniqueAttendees.size;
            const rate = total > 0 ? (present / total) * 100 : 0;

            setStats(prev => ({
                ...prev,
                month: { total, present, rate: Math.round(rate) }
            }));
        } catch (error) {
            console.error('Error fetching monthly stats:', error);
        }
    }, [calculateDateRange]);

    useEffect(() => {
        fetchStats('today');
        fetchTribeStats();
    }, [fetchStats, fetchTribeStats]);

    useEffect(() => {
        fetchWeeklyStats();
        fetchMonthlyStats();
    }, [fetchWeeklyStats, fetchMonthlyStats]);

    return {
        // State
        stats,
        tribeStats,
        loading,

        // Functions
        fetchStats,
        fetchTribeStats,
        fetchWeeklyStats,
        fetchMonthlyStats
    };
}; 