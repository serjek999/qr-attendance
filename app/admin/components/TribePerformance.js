"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { TrendingUp, Users, Award } from 'lucide-react';

const TribePerformance = () => {
    const [tribes, setTribes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTribeStats = async () => {
            try {
                // Fetch tribes with their member counts and attendance
                const { data: tribesData, error: tribesError } = await supabase
                    .from('tribes')
                    .select('*');

                if (tribesError) throw tribesError;

                // Get today's date
                const today = new Date().toISOString().split('T')[0];

                // Fetch attendance for today
                const { data: attendanceData, error: attendanceError } = await supabase
                    .from('attendance_records')
                    .select('student_id, date')
                    .eq('date', today);

                if (attendanceError) throw attendanceError;

                // Get unique students who attended today
                const todayAttendees = new Set(attendanceData.map(a => a.student_id));

                // Calculate stats for each tribe
                const tribesWithStats = await Promise.all(
                    tribesData.map(async (tribe) => {
                        // Get students in this tribe
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

                setTribes(tribesWithStats);
            } catch (error) {
                console.error('Error fetching tribe stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTribeStats();
    }, []);

    if (loading) {
        return (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-white/20 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-white/20 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Tribe Performance</h2>
                <div className="flex items-center space-x-2 text-sm text-white/70">
                    <TrendingUp className="h-4 w-4" />
                    <span>Today&apos;s Attendance</span>
                </div>
            </div>

            <div className="space-y-4">
                {tribes.map((tribe, index) => (
                    <div key={tribe.id} className="border border-white/20 rounded-lg p-4 bg-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {index === 0 && (
                                    <Award className="h-5 w-5 text-yellow-400" />
                                )}
                                <div>
                                    <h3 className="font-semibold text-lg text-white">{tribe.name}</h3>
                                    <div className="flex items-center space-x-4 text-sm text-white/70">
                                        <div className="flex items-center space-x-1">
                                            <Users className="h-4 w-4" />
                                            <span>{tribe.totalMembers} members</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <TrendingUp className="h-4 w-4" />
                                            <span>{tribe.presentToday} present today</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-2xl font-bold text-white">
                                    {tribe.attendanceRate}%
                                </div>
                                <div className="text-sm text-white/70">attendance rate</div>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                            <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${tribe.attendanceRate >= 80 ? 'bg-green-400' :
                                        tribe.attendanceRate >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                                        }`}
                                    style={{ width: `${tribe.attendanceRate}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {tribes.length === 0 && (
                <div className="text-center py-8 text-white/70">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No tribes found</p>
                    <p className="text-sm">Create tribes to start tracking performance</p>
                </div>
            )}
        </div>
    );
};

export default TribePerformance; 